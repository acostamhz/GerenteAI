import { BadRequestException } from '@nestjs/common';
import {
  cerrarContexto,
  crearContexto,
  limpiar,
  saldoDe,
  sembrar,
  type Contexto,
  type Semilla,
} from './helpers/contexto';

describe('AbonosService (contra Postgres real)', () => {
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
    // Deja al cliente A debiendo 3001 (2 × 1500.50).
    await ctx.ventas.create(s.duenoId, 'CLIENTE', {
      sedeId: s.sedeAId,
      tipo: 'FIADO',
      clienteId: s.clienteAId,
      detalles: [{ productoId: s.gaseosaId, cantidad: 2 }],
    });
  });

  it('descuenta el abono del saldo pendiente', async () => {
    const [abono] = await ctx.abonos.create(s.duenoId, 'CLIENTE', {
      clienteId: s.clienteAId,
      monto: 1000.5,
    });

    expect(abono.monto.toNumber()).toBe(1000.5);
    expect(await saldoDe(ctx.prisma, s.clienteAId)).toBe(2000.5);
  });

  it('deriva la sede del cliente, no la recibe del body', async () => {
    const [abono] = await ctx.abonos.create(s.duenoId, 'CLIENTE', {
      clienteId: s.clienteAId,
      monto: 500,
    });

    expect(abono.sedeId).toBe(s.sedeAId);
  });

  it('permite saldar la deuda exacta', async () => {
    await ctx.abonos.create(s.duenoId, 'CLIENTE', {
      clienteId: s.clienteAId,
      monto: 3001,
    });

    expect(await saldoDe(ctx.prisma, s.clienteAId)).toBe(0);
  });

  it('rechaza un abono mayor a la deuda', async () => {
    await expect(
      ctx.abonos.create(s.duenoId, 'CLIENTE', {
        clienteId: s.clienteAId,
        monto: 5000,
      }),
    ).rejects.toThrow(BadRequestException);

    expect(await saldoDe(ctx.prisma, s.clienteAId)).toBe(3001);
    expect(await ctx.prisma.abono.count()).toBe(0);
  });

  // Invariante, no conteo exacto: ver la nota del test equivalente en ventas.e2e-spec.
  it('bajo abonos concurrentes el saldo nunca queda en negativo', async () => {
    const abonar = () =>
      ctx.abonos.create(s.duenoId, 'CLIENTE', {
        clienteId: s.clienteAId,
        monto: 2000,
      });

    const resultados = await Promise.allSettled(
      Array.from({ length: 4 }, () => abonar()),
    );
    const exitosos = resultados.filter((r) => r.status === 'fulfilled').length;

    // La deuda es 3001: solo un abono de 2000 puede pasar.
    expect(exitosos).toBeLessThanOrEqual(1);
    const saldo = await saldoDe(ctx.prisma, s.clienteAId);
    expect(saldo).toBeGreaterThanOrEqual(0);
    expect(saldo).toBe(3001 - exitosos * 2000);
    expect(await ctx.prisma.abono.count()).toBe(exitosos);
  });

  it('al anular un abono la deuda vuelve al cliente', async () => {
    const [abono] = await ctx.abonos.create(s.duenoId, 'CLIENTE', {
      clienteId: s.clienteAId,
      monto: 1000,
    });
    expect(await saldoDe(ctx.prisma, s.clienteAId)).toBe(2001);

    await ctx.abonos.remove(abono.id, s.duenoId, 'CLIENTE');

    expect(await saldoDe(ctx.prisma, s.clienteAId)).toBe(3001);
    expect(await ctx.prisma.abono.count()).toBe(0);
  });
});
