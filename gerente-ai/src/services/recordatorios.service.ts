import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Prisma } from '@prisma/client';
import { PrismaService } from './prisma.service';
import { MailService } from '../auth/mail/mail.service';
import { PLAN_ASISTENTE, PLANES } from './planes.service';

const DIA = 86_400_000;

/** Cuántos días antes del vencimiento se avisa. */
const DIAS_AVISO_PREVIO = 3;
/** Cuántos días después se manda el último recordatorio. */
const DIAS_SEGUIMIENTO = 7;

/**
 * Tolerancia de las ventanas.
 *
 * El servicio de Render se duerme sin tráfico, así que el job puede no correr
 * durante un día entero. Sin margen, un vencimiento caído mientras dormía no se
 * avisaría nunca. Con él, se recupera en la siguiente ejecución.
 *
 * También acota por el otro lado: sin límite, la primera ejecución avisaría a
 * negocios que vencieron hace meses.
 */
const MARGEN_DIAS = 3;

type TipoDeAviso = 'previo' | 'vencido' | 'vencido_seguimiento';

export interface ResumenDeEnvios {
  previo: number;
  vencido: number;
  vencido_seguimiento: number;
}

/** Un negocio con la gente a la que hay que escribirle. */
type NegocioConDuenos = Prisma.NegocioGetPayload<{
  include: { usuariosNegocio: { include: { usuario: true } } };
}>;

@Injectable()
export class RecordatoriosService {
  private readonly logger = new Logger(RecordatoriosService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  /**
   * Refuerzo, no la vía principal. En Render el proceso se duerme y este cron no
   * dispara; quien lo llama de verdad es un cron externo contra
   * `POST /recordatorios/ejecutar`. Se deja porque cuando el servicio sí está
   * despierto, funciona, y no cuesta nada.
   */
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async porCron() {
    const resumen = await this.ejecutar();
    const total =
      resumen.previo + resumen.vencido + resumen.vencido_seguimiento;
    if (total > 0) {
      this.logger.log(`Recordatorios enviados por cron: ${total}`);
    }
  }

  /**
   * Manda los avisos que falten.
   *
   * No busca "los que vencen hoy" sino "los que están en ventana y todavía no
   * recibieron ese aviso". La diferencia importa: la primera versión depende de
   * correr exactamente a la hora, y esta no. Puede correr tarde, dos veces o
   * ninguna, que el resultado es el mismo.
   */
  async ejecutar(ahora = new Date()): Promise<ResumenDeEnvios> {
    const resumen: ResumenDeEnvios = {
      previo: 0,
      vencido: 0,
      vencido_seguimiento: 0,
    };

    for (const negocio of await this.candidatos('previo', ahora)) {
      const dias = this.diasHasta(negocio.planVenceEl!, ahora);
      if (
        await this.avisar(negocio, 'previo', (correo, nombre) =>
          this.mail.sendAvisoDeVencimiento(
            correo,
            nombre,
            negocio.nombre,
            this.nombreDelPlan(negocio.plan),
            dias,
          ),
        )
      ) {
        resumen.previo += 1;
      }
    }

    for (const negocio of await this.candidatos('vencido', ahora)) {
      if (
        await this.avisar(negocio, 'vencido', (correo, nombre) =>
          this.mail.sendPlanVencido(
            correo,
            nombre,
            negocio.nombre,
            this.nombreDelPlan(negocio.plan),
          ),
        )
      ) {
        resumen.vencido += 1;
      }
    }

    for (const negocio of await this.candidatos('vencido_seguimiento', ahora)) {
      if (
        await this.avisar(negocio, 'vencido_seguimiento', (correo, nombre) =>
          this.mail.sendSeguimientoDeVencimiento(
            correo,
            nombre,
            negocio.nombre,
            this.nombreDelPlan(negocio.plan),
          ),
        )
      ) {
        resumen.vencido_seguimiento += 1;
      }
    }

    return resumen;
  }

  /** Negocios que caen dentro de la ventana de un aviso concreto. */
  private candidatos(
    tipo: TipoDeAviso,
    ahora: Date,
  ): Promise<NegocioConDuenos[]> {
    const t = ahora.getTime();

    // Cada ventana es un rango sobre planVenceEl, no una fecha exacta.
    const rangos: Record<TipoDeAviso, { gt: Date; lte: Date }> = {
      // Vence pronto pero todavía no ha vencido.
      previo: {
        gt: new Date(t),
        lte: new Date(t + DIAS_AVISO_PREVIO * DIA),
      },
      // Venció hace poco.
      vencido: {
        gt: new Date(t - MARGEN_DIAS * DIA),
        lte: new Date(t),
      },
      // Venció hace una semana.
      vencido_seguimiento: {
        gt: new Date(t - (DIAS_SEGUIMIENTO + MARGEN_DIAS) * DIA),
        lte: new Date(t - DIAS_SEGUIMIENTO * DIA),
      },
    };

    return this.prisma.negocio.findMany({
      where: {
        // El Asistente es gratuito y no vence: no hay nada que recordarle.
        plan: { not: PLAN_ASISTENTE },
        planVenceEl: rangos[tipo],
      },
      include: { usuariosNegocio: { include: { usuario: true } } },
    });
  }

  /**
   * Registra el aviso y, solo si el registro era nuevo, lo envía.
   *
   * El orden no es casual. La restricción `@@unique(negocioId, tipo, venceEl)`
   * hace que el segundo intento choque contra la base y no mande nada. Si se
   * enviara primero y se registrara después, dos ejecuciones simultáneas
   * mandarían el correo dos veces antes de que ninguna hubiera registrado.
   */
  private async avisar(
    negocio: NegocioConDuenos,
    tipo: TipoDeAviso,
    enviar: (correo: string, nombre: string) => Promise<void>,
  ): Promise<boolean> {
    const venceEl = negocio.planVenceEl;
    if (!venceEl) return false;

    try {
      await this.prisma.notificacionPlan.create({
        data: { negocioId: negocio.id, tipo, venceEl },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        return false; // ya se avisó para este vencimiento
      }
      throw error;
    }

    // A todos los dueños: un negocio puede tener socios, y el que paga no es
    // necesariamente el que abrió la cuenta.
    const destinatarios = negocio.usuariosNegocio.map((v) => v.usuario);
    if (destinatarios.length === 0) {
      this.logger.warn(
        `El negocio ${negocio.id} no tiene dueños a quién avisar`,
      );
      return false;
    }

    for (const usuario of destinatarios) {
      await enviar(usuario.email, usuario.nombre);
    }

    this.logger.log(
      `Aviso "${tipo}" enviado a ${destinatarios.length} destinatario(s) de ${negocio.nombre}`,
    );
    return true;
  }

  private nombreDelPlan(plan: number) {
    return PLANES[plan]?.nombre ?? 'de pago';
  }

  /** Días que faltan, redondeando hacia arriba: 0.4 días es "mañana", no "hoy". */
  private diasHasta(fecha: Date, ahora: Date) {
    return Math.max(1, Math.ceil((fecha.getTime() - ahora.getTime()) / DIA));
  }
}
