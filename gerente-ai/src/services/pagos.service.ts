import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CicloPago, EstadoPago, Prisma } from '@prisma/client';
import { PrismaService } from './prisma.service';
import { NegociosService } from './negocios.service';
import { PLANES } from './planes.service';
import { CrearCheckoutDto } from '../dto/pagos/crear-checkout.dto';
import type { Ciclo } from '../dto/negocios/cambiar-plan.dto';
import {
  estadoDesdeWompi,
  eventoEsAutentico,
  firmaDeIntegridad,
  type EventoWompi,
} from './wompi';

const MONEDA = 'COP';

@Injectable()
export class PagosService {
  private readonly logger = new Logger(PagosService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly negociosService: NegociosService,
  ) {}

  /**
   * Prepara un cobro y devuelve lo que el frontend necesita para abrir el
   * checkout de Wompi.
   *
   * El pago nace PENDIENTE y solo el webhook lo mueve de ahí. Lo que el
   * navegador diga después —"pagué", "salió bien"— es informativo: quien activa
   * el plan es el evento firmado que manda Wompi.
   */
  async crearCheckout(
    userId: string,
    rolGlobal: string,
    dto: CrearCheckoutDto,
  ) {
    // Pagar el plan es del dueño del negocio. Un administrador de sede opera en
    // su sede, pero no contrata en nombre del negocio.
    await this.negociosService.verificarPropietario(
      userId,
      dto.negocioId,
      rolGlobal,
    );

    const ciclo: Ciclo = dto.ciclo ?? 'mensual';
    const definicion = PLANES[dto.plan];

    // Se comprueba `contratacion` y no el precio: el Asistente es gratuito y el
    // Corporativo se cotiza en una reunión, y ambos valen 0 en el catálogo.
    if (!definicion || definicion.contratacion !== 'directo') {
      throw new BadRequestException('Ese plan no está a la venta');
    }

    // El precio sale del catálogo del servidor, nunca de la petición.
    const precio =
      ciclo === 'anual' ? definicion.precioAnual : definicion.precioMensual;

    // Un plan puede no tener ciclo anual. Sin esto se cobraría cero, que es
    // peor que fallar: el pago saldría aprobado y el plan se activaría gratis.
    if (precio === null) {
      throw new BadRequestException(
        `El plan ${definicion.nombre} solo se vende por mes`,
      );
    }

    const montoEnCentavos = precio * 100;

    // El prefijo hace que la referencia se reconozca de un vistazo en el panel
    // de Wompi; el uuid es lo que garantiza que no se repita.
    const referencia = `LUKA-${randomUUID().replace(/-/g, '')}`;

    const pago = await this.prisma.pago.create({
      data: {
        referencia,
        negocioId: dto.negocioId,
        usuarioId: userId,
        plan: dto.plan,
        ciclo: ciclo === 'anual' ? CicloPago.ANUAL : CicloPago.MENSUAL,
        montoEnCentavos,
        moneda: MONEDA,
      },
    });

    return {
      referencia: pago.referencia,
      montoEnCentavos,
      moneda: MONEDA,
      firmaDeIntegridad: firmaDeIntegridad(
        referencia,
        montoEnCentavos,
        MONEDA,
        this.secreto('WOMPI_INTEGRITY_SECRET'),
      ),
      llavePublica: this.secreto('WOMPI_PUBLIC_KEY'),
      plan: { id: definicion.id, nombre: definicion.nombre },
      ciclo,
    };
  }

  /**
   * Punto de entrada del webhook. Es público —Wompi no tiene forma de mandar un
   * JWT— así que la firma del evento es lo único que separa un cobro real de
   * alguien regalándose el plan Administrador con un `curl`.
   *
   * Los errores del emisor se responden 200 igualmente: Wompi reintenta lo que
   * no confirma, y un evento que nunca vamos a poder procesar se reintentaría
   * para siempre. Lo que sí queda es el log.
   */
  async procesarEvento(cuerpo: unknown): Promise<{ recibido: boolean }> {
    const evento = this.leerEvento(cuerpo);
    if (!evento) {
      this.logger.warn('Evento de Wompi con formato inesperado; se descarta');
      return { recibido: true };
    }

    if (!eventoEsAutentico(evento, this.secreto('WOMPI_EVENTS_SECRET'))) {
      this.logger.error(
        `Firma inválida en el evento de la referencia ${evento.transaccion.reference}; se descarta`,
      );
      return { recibido: true };
    }

    await this.aplicar(evento, cuerpo);
    return { recibido: true };
  }

  private async aplicar(evento: EventoWompi, cuerpoCrudo: unknown) {
    const transaccion = evento.transaccion;
    const estado = estadoDesdeWompi(transaccion.status);

    // PSE y Nequi pasan por PENDING antes de resolverse. No se toca el pago:
    // sigue esperando el evento definitivo.
    if (estado === 'PENDIENTE') return;

    const pago = await this.prisma.pago.findUnique({
      where: { referencia: transaccion.reference },
    });
    if (!pago) {
      this.logger.warn(
        `Evento para una referencia desconocida: ${transaccion.reference}`,
      );
      return;
    }
    if (pago.estado !== EstadoPago.PENDIENTE) {
      // Wompi reintenta cuando no confirmamos a tiempo. Volver a aplicarlo
      // extendería el plan dos veces por un solo cobro.
      return;
    }

    // Que la firma sea válida prueba que el evento viene de Wompi, no que
    // corresponda a lo que cobramos. Si el monto no cuadra, algo se torció: se
    // deja constancia y no se activa nada.
    const montoCuadra =
      transaccion.amount_in_cents === pago.montoEnCentavos &&
      transaccion.currency === pago.moneda;

    if (!montoCuadra) {
      this.logger.error(
        `El pago ${pago.referencia} esperaba ${pago.montoEnCentavos} ${pago.moneda} y llegó ${transaccion.amount_in_cents} ${transaccion.currency}`,
      );
    }

    const estadoFinal = montoCuadra ? estado : EstadoPago.ERROR;

    await this.prisma.$transaction(async (tx) => {
      // Condicional sobre el estado: si dos entregas del mismo evento entran a
      // la vez, solo una encuentra el pago PENDIENTE y solo una activa el plan.
      const { count } = await tx.pago.updateMany({
        where: { id: pago.id, estado: EstadoPago.PENDIENTE },
        data: {
          estado: estadoFinal,
          wompiTransaccionId: transaccion.id,
          datosWompi: cuerpoCrudo as Prisma.InputJsonValue,
          procesadoEl: new Date(),
        },
      });
      if (count === 0) return;

      if (estadoFinal !== EstadoPago.APROBADO) return;

      await this.negociosService.activarPlan(
        pago.negocioId,
        pago.plan,
        pago.ciclo === CicloPago.ANUAL ? 'anual' : 'mensual',
        // Un cobro confirmado renueva: suma a los días que el cliente ya pagó.
        { renovacion: true, tx },
      );
    });

    this.logger.log(
      `Pago ${pago.referencia} quedó en ${estadoFinal} (transacción ${transaccion.id})`,
    );
  }

  /** Historial de pagos de los negocios del usuario. */
  async findAll(userId: string, rolGlobal: string, negocioId?: string) {
    if (negocioId) {
      await this.negociosService.verificarPropietario(
        userId,
        negocioId,
        rolGlobal,
      );
      return this.prisma.pago.findMany({
        where: { negocioId },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (rolGlobal === 'MASTER') {
      return this.prisma.pago.findMany({ orderBy: { createdAt: 'desc' } });
    }

    return this.prisma.pago.findMany({
      where: { negocio: { usuariosNegocio: { some: { usuarioId: userId } } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Estado de un cobro concreto. Es lo que consulta el frontend cuando el
   * usuario vuelve del checkout, porque para entonces el webhook puede haber
   * llegado ya o estar en camino.
   */
  async porReferencia(referencia: string, userId: string, rolGlobal: string) {
    const pago = await this.prisma.pago.findUnique({ where: { referencia } });
    if (!pago) {
      throw new NotFoundException('No existe un pago con esa referencia');
    }
    await this.negociosService.verificarPropietario(
      userId,
      pago.negocioId,
      rolGlobal,
    );
    return pago;
  }

  /**
   * Una credencial ausente no puede degradarse en silencio: sin el secreto de
   * integridad se firmaría con la cadena vacía y Wompi rechazaría todos los
   * cobros; sin el de eventos, cualquier webhook pasaría por auténtico.
   */
  private secreto(nombre: string): string {
    const valor = process.env[nombre]?.trim();
    if (!valor) {
      this.logger.error(`Falta la variable de entorno ${nombre}`);
      throw new InternalServerErrorException(
        'La pasarela de pagos no está configurada',
      );
    }
    return valor;
  }

  /** El cuerpo del webhook es JSON de fuera: se comprueba antes de usarlo. */
  private leerEvento(cuerpo: unknown): EventoWompi | null {
    if (typeof cuerpo !== 'object' || cuerpo === null) return null;

    const raiz = cuerpo as Record<string, unknown>;
    const data = raiz.data as Record<string, unknown> | undefined;
    const transaccion = data?.transaction as
      Record<string, unknown> | undefined;
    const firma = raiz.signature as Record<string, unknown> | undefined;

    if (
      typeof transaccion?.id !== 'string' ||
      typeof transaccion.reference !== 'string' ||
      typeof transaccion.status !== 'string' ||
      typeof transaccion.amount_in_cents !== 'number' ||
      typeof transaccion.currency !== 'string' ||
      typeof raiz.timestamp !== 'number' ||
      typeof firma?.checksum !== 'string' ||
      !Array.isArray(firma.properties) ||
      !firma.properties.every((ruta) => typeof ruta === 'string')
    ) {
      return null;
    }

    return {
      data: raiz.data,
      transaccion: {
        id: transaccion.id,
        reference: transaccion.reference,
        status: transaccion.status,
        amount_in_cents: transaccion.amount_in_cents,
        currency: transaccion.currency,
      },
      timestamp: raiz.timestamp,
      signature: {
        properties: firma.properties,
        checksum: firma.checksum,
      },
    };
  }
}
