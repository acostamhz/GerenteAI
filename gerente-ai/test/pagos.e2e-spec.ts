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
  PLAN_GERENTE,
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
        PLANES[PLAN_ADMINISTRADOR].precioAnual * 100,
      );
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
