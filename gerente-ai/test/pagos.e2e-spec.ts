import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { createHash } from 'crypto';
import { CicloPago, EstadoPago } from '@prisma/client';
import {
  cerrarContexto,
  crearContexto,
  limpiar,
  sembrar,
  type Contexto,
  type Semilla,
} from './helpers/contexto';
import {
  PLAN_ADMINISTRADOR,
  PLAN_ASISTENTE,
  PLAN_CORPORATIVO,
  PLAN_GERENTE,
  PLAN_SOCIO,
  PLANES,
} from '../src/services/planes.service';

const SECRETO_EVENTOS = process.env.WOMPI_EVENTS_SECRET!;

/**
 * Arma un evento como el que manda Wompi, firmado de verdad. Firmarlo aquí en
 * vez de saltarse la verificación es lo que hace que estas pruebas cubran el
 * camino real: si mañana alguien rompe la firma, fallan.
 */
function eventoDeWompi(opciones: {
  referencia: string;
  estado: string;
  montoEnCentavos: number;
  transaccionId?: string;
  moneda?: string;
  secreto?: string;
}) {
  const {
    referencia,
    estado,
    montoEnCentavos,
    transaccionId = `tx-${referencia}`,
    moneda = 'COP',
    secreto = SECRETO_EVENTOS,
  } = opciones;

  const timestamp = 1_700_000_000;
  const checksum = createHash('sha256')
    .update(
      `${transaccionId}${estado}${montoEnCentavos}${timestamp}${secreto}`,
      'utf8',
    )
    .digest('hex');

  return {
    event: 'transaction.updated',
    data: {
      transaction: {
        id: transaccionId,
        reference: referencia,
        status: estado,
        amount_in_cents: montoEnCentavos,
        currency: moneda,
      },
    },
    timestamp,
    signature: {
      properties: [
        'transaction.id',
        'transaction.status',
        'transaction.amount_in_cents',
      ],
      checksum,
    },
  };
}

describe('Pasarela de pagos (contra Postgres real)', () => {
  let ctx: Contexto;
  let s: Semilla;

  beforeAll(async () => {
    ctx = await crearContexto();
  });

  afterAll(async () => {
    await limpiar(ctx.prisma);
    await cerrarContexto(ctx);
  });

  beforeEach(async () => {
    await limpiar(ctx.prisma);
    s = await sembrar(ctx.prisma);
  });

  const planDelNegocio = async () =>
    ctx.prisma.negocio.findUniqueOrThrow({ where: { id: s.negocioId } });

  const pagoDe = async (referencia: string) =>
    ctx.prisma.pago.findUniqueOrThrow({ where: { referencia } });

  const checkoutGerente = () =>
    ctx.pagos.crearCheckout(s.duenoId, 'CLIENTE', {
      negocioId: s.negocioId,
      plan: PLAN_GERENTE,
      ciclo: 'mensual',
    });

  describe('crear el cobro', () => {
    it('deja el pago PENDIENTE y devuelve lo que el checkout necesita', async () => {
      const checkout = await checkoutGerente();

      expect(checkout.montoEnCentavos).toBe(
        PLANES[PLAN_GERENTE].precioMensual * 100,
      );
      expect(checkout.moneda).toBe('COP');
      expect(checkout.firmaDeIntegridad).toHaveLength(64);
      expect(checkout.referencia).toMatch(/^LUKA-[0-9a-f]{32}$/);

      const pago = await pagoDe(checkout.referencia);
      expect(pago.estado).toBe(EstadoPago.PENDIENTE);
      expect(pago.plan).toBe(PLAN_GERENTE);
      expect(pago.usuarioId).toBe(s.duenoId);
    });

    // El precio no viaja en la petición: si viajara, se editaría en el navegador.
    it('cobra el precio anual del catálogo cuando el ciclo es anual', async () => {
      const checkout = await ctx.pagos.crearCheckout(s.duenoId, 'CLIENTE', {
        negocioId: s.negocioId,
        plan: PLAN_ADMINISTRADOR,
        ciclo: 'anual',
      });

      expect(checkout.montoEnCentavos).toBe(
        PLANES[PLAN_ADMINISTRADOR].precioAnual! * 100,
      );
    });

    /**
     * El Gerente solo se vende por mes. Sin esta comprobación, `precioAnual` en
     * `null` se multiplicaba por 100 y daba cero: el cobro salía aprobado y el
     * plan se activaba gratis.
     */
    it('rechaza el ciclo anual en un plan que no lo tiene', async () => {
      await expect(
        ctx.pagos.crearCheckout(s.duenoId, 'CLIENTE', {
          negocioId: s.negocioId,
          plan: PLAN_GERENTE,
          ciclo: 'anual',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    // No se compra desde la aplicación: se cotiza en una reunión. Vale 0 en el
    // catálogo igual que el Asistente, así que el precio no sirve para
    // distinguirlos; lo que decide es `contratacion`.
    it('no deja cobrar el plan Corporativo', async () => {
      await expect(
        ctx.pagos.crearCheckout(s.duenoId, 'CLIENTE', {
          negocioId: s.negocioId,
          plan: PLAN_CORPORATIVO,
          ciclo: 'mensual',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('no deja cobrar un plan que no se vende', async () => {
      await expect(
        ctx.pagos.crearCheckout(s.duenoId, 'CLIENTE', {
          negocioId: s.negocioId,
          plan: PLAN_ASISTENTE,
          ciclo: 'mensual',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    // Contratar es del dueño: un admin de sede opera, pero no compra.
    it('rechaza al administrador de sede', async () => {
      await expect(
        ctx.pagos.crearCheckout(s.adminSedeAId, 'CLIENTE', {
          negocioId: s.negocioId,
          plan: PLAN_GERENTE,
          ciclo: 'mensual',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rechaza a alguien de otro negocio', async () => {
      await expect(
        ctx.pagos.crearCheckout(s.ajenoId, 'CLIENTE', {
          negocioId: s.negocioId,
          plan: PLAN_GERENTE,
          ciclo: 'mensual',
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('webhook con un pago aprobado', () => {
    it('marca el pago y activa el plan', async () => {
      const checkout = await ctx.pagos.crearCheckout(s.duenoId, 'CLIENTE', {
        negocioId: s.negocioId,
        plan: PLAN_ADMINISTRADOR,
        ciclo: 'mensual',
      });

      await ctx.pagos.procesarEvento(
        eventoDeWompi({
          referencia: checkout.referencia,
          estado: 'APPROVED',
          montoEnCentavos: checkout.montoEnCentavos,
        }),
      );

      const pago = await pagoDe(checkout.referencia);
      expect(pago.estado).toBe(EstadoPago.APROBADO);
      expect(pago.wompiTransaccionId).toBe(`tx-${checkout.referencia}`);
      expect(pago.procesadoEl).not.toBeNull();

      const negocio = await planDelNegocio();
      expect(negocio.plan).toBe(PLAN_ADMINISTRADOR);
      expect(negocio.planVenceEl!.getTime()).toBeGreaterThan(Date.now());
    });

    /**
     * Wompi reintenta lo que no confirmamos a tiempo. Sin la comprobación de
     * estado, un mismo cobro extendería el plan dos veces.
     */
    it('no aplica dos veces el mismo evento', async () => {
      const checkout = await checkoutGerente();
      const evento = eventoDeWompi({
        referencia: checkout.referencia,
        estado: 'APPROVED',
        montoEnCentavos: checkout.montoEnCentavos,
      });

      await ctx.pagos.procesarEvento(evento);
      const primerVencimiento = (await planDelNegocio()).planVenceEl!.getTime();

      await ctx.pagos.procesarEvento(evento);
      const segundoVencimiento = (
        await planDelNegocio()
      ).planVenceEl!.getTime();

      expect(segundoVencimiento).toBe(primerVencimiento);
    });

    // Renovar suma días a los que quedaban; si contara desde hoy, quien renueva
    // antes de tiempo regalaría los días que ya había pagado.
    it('renovar el mismo plan extiende el vencimiento en vez de reiniciarlo', async () => {
      const primero = await checkoutGerente();
      await ctx.pagos.procesarEvento(
        eventoDeWompi({
          referencia: primero.referencia,
          estado: 'APPROVED',
          montoEnCentavos: primero.montoEnCentavos,
        }),
      );
      const trasElPrimero = (await planDelNegocio()).planVenceEl!.getTime();

      const segundo = await checkoutGerente();
      await ctx.pagos.procesarEvento(
        eventoDeWompi({
          referencia: segundo.referencia,
          estado: 'APPROVED',
          montoEnCentavos: segundo.montoEnCentavos,
        }),
      );
      const trasElSegundo = (await planDelNegocio()).planVenceEl!.getTime();

      const treintaDias = 30 * 86_400_000;
      expect(trasElSegundo - trasElPrimero).toBeGreaterThan(
        treintaDias - 5_000,
      );
      expect(trasElSegundo - trasElPrimero).toBeLessThan(treintaDias + 5_000);
    });
  });

  describe('webhook que no debe activar nada', () => {
    /** El ataque directo: un curl diciendo "este negocio ya pagó". */
    it('ignora un evento firmado con otro secreto', async () => {
      const checkout = await checkoutGerente();
      const planPrevio = (await planDelNegocio()).plan;

      await ctx.pagos.procesarEvento(
        eventoDeWompi({
          referencia: checkout.referencia,
          estado: 'APPROVED',
          montoEnCentavos: checkout.montoEnCentavos,
          secreto: 'el-secreto-del-atacante',
        }),
      );

      expect((await pagoDe(checkout.referencia)).estado).toBe(
        EstadoPago.PENDIENTE,
      );
      expect((await planDelNegocio()).plan).toBe(planPrevio);
    });

    /**
     * La firma prueba que el evento viene de Wompi, no que corresponda a lo que
     * cobramos. Un monto que no cuadra se registra como error y no activa nada.
     */
    it('no activa si el monto no coincide con el cobrado', async () => {
      const checkout = await ctx.pagos.crearCheckout(s.duenoId, 'CLIENTE', {
        negocioId: s.negocioId,
        plan: PLAN_ADMINISTRADOR,
        ciclo: 'mensual',
      });
      const planPrevio = (await planDelNegocio()).plan;

      await ctx.pagos.procesarEvento(
        eventoDeWompi({
          referencia: checkout.referencia,
          estado: 'APPROVED',
          montoEnCentavos: 100,
        }),
      );

      expect((await pagoDe(checkout.referencia)).estado).toBe(EstadoPago.ERROR);
      expect((await planDelNegocio()).plan).toBe(planPrevio);
    });

    it('un pago rechazado deja el plan como estaba', async () => {
      const checkout = await checkoutGerente();
      const planPrevio = (await planDelNegocio()).plan;

      await ctx.pagos.procesarEvento(
        eventoDeWompi({
          referencia: checkout.referencia,
          estado: 'DECLINED',
          montoEnCentavos: checkout.montoEnCentavos,
        }),
      );

      expect((await pagoDe(checkout.referencia)).estado).toBe(
        EstadoPago.RECHAZADO,
      );
      expect((await planDelNegocio()).plan).toBe(planPrevio);
    });

    // PSE pasa por PENDING antes de resolverse: el pago sigue esperando.
    it('un evento PENDING no cierra el pago', async () => {
      const checkout = await checkoutGerente();

      await ctx.pagos.procesarEvento(
        eventoDeWompi({
          referencia: checkout.referencia,
          estado: 'PENDING',
          montoEnCentavos: checkout.montoEnCentavos,
        }),
      );

      const pago = await pagoDe(checkout.referencia);
      expect(pago.estado).toBe(EstadoPago.PENDIENTE);
      expect(pago.procesadoEl).toBeNull();
    });

    it('un evento con formato inesperado no revienta', async () => {
      await expect(
        ctx.pagos.procesarEvento({ cualquier: 'cosa' }),
      ).resolves.toEqual({ recibido: true });
      await expect(ctx.pagos.procesarEvento(null)).resolves.toEqual({
        recibido: true,
      });
    });

    it('un evento para una referencia que no existe no revienta', async () => {
      await expect(
        ctx.pagos.procesarEvento(
          eventoDeWompi({
            referencia: 'LUKA-inventada',
            estado: 'APPROVED',
            montoEnCentavos: 1000,
          }),
        ),
      ).resolves.toEqual({ recibido: true });
    });
  });

  /**
   * Lo que el cliente compró es lo que tiene que durar. Un error aquí no lo
   * detecta nadie hasta que a alguien que pagó el año le vence en un mes, y para
   * entonces ya es un problema de plata y de confianza.
   */
  describe('duración de lo que se paga', () => {
    const diasDeVigencia = (venceEl: Date) =>
      (venceEl.getTime() - Date.now()) / 86_400_000;

    const pagar = async (plan: number, ciclo: 'mensual' | 'anual') => {
      const checkout = await ctx.pagos.crearCheckout(s.duenoId, 'CLIENTE', {
        negocioId: s.negocioId,
        plan,
        ciclo,
      });
      await ctx.pagos.procesarEvento(
        eventoDeWompi({
          referencia: checkout.referencia,
          estado: 'APPROVED',
          montoEnCentavos: checkout.montoEnCentavos,
        }),
      );
      return checkout;
    };

    it('pagar el año da 365 días, no 30', async () => {
      // Se parte de un plan distinto para que sea alta y no renovación.
      await ctx.prisma.negocio.update({
        where: { id: s.negocioId },
        data: { plan: PLAN_ASISTENTE, planVenceEl: null },
      });

      await pagar(PLAN_ADMINISTRADOR, 'anual');

      const dias = diasDeVigencia((await planDelNegocio()).planVenceEl!);
      expect(Math.round(dias)).toBe(365);
    });

    it('pagar el mes da 30 días', async () => {
      await ctx.prisma.negocio.update({
        where: { id: s.negocioId },
        data: { plan: PLAN_ASISTENTE, planVenceEl: null },
      });

      await pagar(PLAN_ADMINISTRADOR, 'mensual');

      const dias = diasDeVigencia((await planDelNegocio()).planVenceEl!);
      expect(Math.round(dias)).toBe(30);
    });

    // El ciclo se guarda en el pago y de ahí lo lee el webhook. Si se perdiera
    // por el camino, un pago anual se activaría como mensual.
    it('el ciclo anual queda guardado en el pago', async () => {
      const checkout = await pagar(PLAN_ADMINISTRADOR, 'anual');

      expect((await pagoDe(checkout.referencia)).ciclo).toBe(CicloPago.ANUAL);
    });

    it('renovar el año suma otros 365 días', async () => {
      await ctx.prisma.negocio.update({
        where: { id: s.negocioId },
        data: { plan: PLAN_ASISTENTE, planVenceEl: null },
      });

      await pagar(PLAN_ADMINISTRADOR, 'anual');
      const primero = (await planDelNegocio()).planVenceEl!.getTime();

      await pagar(PLAN_ADMINISTRADOR, 'anual');
      const segundo = (await planDelNegocio()).planVenceEl!.getTime();

      expect(Math.round((segundo - primero) / 86_400_000)).toBe(365);
    });

    // Subir de plan a mitad de ciclo no arrastra el vencimiento anterior: es
    // otro producto y empieza a contar desde el pago.
    it('cambiar de plan cuenta desde hoy, no desde el vencimiento viejo', async () => {
      await ctx.prisma.negocio.update({
        where: { id: s.negocioId },
        data: { plan: PLAN_ASISTENTE, planVenceEl: null },
      });

      await pagar(PLAN_ADMINISTRADOR, 'anual');
      await pagar(PLAN_SOCIO, 'mensual');

      const dias = diasDeVigencia((await planDelNegocio()).planVenceEl!);
      expect(Math.round(dias)).toBe(30);
    });
  });

  describe('consulta', () => {
    it('el dueño ve sus pagos y no los de otros', async () => {
      const checkout = await checkoutGerente();

      const negocioAjeno = await ctx.prisma.negocio.create({
        data: { nombre: 'Competencia' },
      });
      await ctx.prisma.usuarioNegocio.create({
        data: { usuarioId: s.ajenoId, negocioId: negocioAjeno.id },
      });
      await ctx.prisma.pago.create({
        data: {
          referencia: 'LUKA-ajeno',
          negocioId: negocioAjeno.id,
          usuarioId: s.ajenoId,
          plan: PLAN_GERENTE,
          ciclo: CicloPago.MENSUAL,
          montoEnCentavos: 7_990_000,
        },
      });

      const mios = await ctx.pagos.findAll(s.duenoId, 'CLIENTE');
      expect(mios.map((pago) => pago.referencia)).toEqual([
        checkout.referencia,
      ]);
    });

    it('rechaza consultar por referencia un pago ajeno', async () => {
      const checkout = await checkoutGerente();

      await expect(
        ctx.pagos.porReferencia(checkout.referencia, s.ajenoId, 'CLIENTE'),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
