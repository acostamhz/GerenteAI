import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import {
  cerrarContexto,
  crearContexto,
  limpiar,
  saldoDe,
  sembrar,
  stockDe,
  type Contexto,
  type Semilla,
} from './helpers/contexto';

describe('VentasService (contra Postgres real)', () => {
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

  describe('create', () => {
    it('descuenta stock y calcula el total sin errores de punto flotante', async () => {
      const venta = await ctx.ventas.create(s.duenoId, 'CLIENTE', {
        sedeId: s.sedeAId,
        detalles: [{ productoId: s.gaseosaId, cantidad: 3 }],
      });

      // 3 × 1500.50 = 4501.50. En float daría 4501.499999999999.
      expect(venta.total.toNumber()).toBe(4501.5);
      expect(await stockDe(ctx.prisma, s.gaseosaId)).toBe(7);
      expect(venta.detalles).toHaveLength(1);
      expect(venta.detalles[0].precio.toNumber()).toBe(1500.5);
    });

    it('respeta el precio enviado cuando hay descuento', async () => {
      const venta = await ctx.ventas.create(s.duenoId, 'CLIENTE', {
        sedeId: s.sedeAId,
        detalles: [{ productoId: s.gaseosaId, cantidad: 2, precio: 1200 }],
      });

      expect(venta.total.toNumber()).toBe(2400);
    });

    it('suma varias líneas y acepta el total correcto enviado por el cliente', async () => {
      const venta = await ctx.ventas.create(s.duenoId, 'CLIENTE', {
        sedeId: s.sedeAId,
        total: 5501.5, // 3×1500.50 + 2×500
        detalles: [
          { productoId: s.gaseosaId, cantidad: 3 },
          { productoId: s.panId, cantidad: 2 },
        ],
      });

      expect(venta.total.toNumber()).toBe(5501.5);
      expect(await stockDe(ctx.prisma, s.gaseosaId)).toBe(7);
      expect(await stockDe(ctx.prisma, s.panId)).toBe(3);
    });

    it('rechaza un total que no cuadra con el calculado', async () => {
      await expect(
        ctx.ventas.create(s.duenoId, 'CLIENTE', {
          sedeId: s.sedeAId,
          total: 99,
          detalles: [{ productoId: s.gaseosaId, cantidad: 3 }],
        }),
      ).rejects.toThrow(BadRequestException);

      expect(await stockDe(ctx.prisma, s.gaseosaId)).toBe(10);
      expect(await ctx.prisma.venta.count()).toBe(0);
    });

    it('rechaza stock insuficiente sin tocar el stock de las otras líneas', async () => {
      await expect(
        ctx.ventas.create(s.duenoId, 'CLIENTE', {
          sedeId: s.sedeAId,
          detalles: [
            { productoId: s.gaseosaId, cantidad: 2 }, // alcanza
            { productoId: s.panId, cantidad: 999 }, // no alcanza
          ],
        }),
      ).rejects.toThrow(ConflictException);

      expect(await stockDe(ctx.prisma, s.gaseosaId)).toBe(10);
      expect(await stockDe(ctx.prisma, s.panId)).toBe(5);
      expect(await ctx.prisma.venta.count()).toBe(0);
    });

    it('rechaza productos repetidos en el detalle', async () => {
      await expect(
        ctx.ventas.create(s.duenoId, 'CLIENTE', {
          sedeId: s.sedeAId,
          detalles: [
            { productoId: s.gaseosaId, cantidad: 6 },
            { productoId: s.gaseosaId, cantidad: 6 },
          ],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rechaza un producto que pertenece a otra sede', async () => {
      await expect(
        ctx.ventas.create(s.duenoId, 'CLIENTE', {
          sedeId: s.sedeAId,
          detalles: [{ productoId: s.arrozId, cantidad: 1 }], // arroz es de la sede B
        }),
      ).rejects.toThrow(NotFoundException);

      expect(await stockDe(ctx.prisma, s.arrozId)).toBe(10);
    });

    it('exige clienteId cuando la venta es FIADO', async () => {
      await expect(
        ctx.ventas.create(s.duenoId, 'CLIENTE', {
          sedeId: s.sedeAId,
          tipo: 'FIADO',
          detalles: [{ productoId: s.gaseosaId, cantidad: 1 }],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rechaza un cliente de otra sede', async () => {
      await expect(
        ctx.ventas.create(s.duenoId, 'CLIENTE', {
          sedeId: s.sedeAId,
          tipo: 'FIADO',
          clienteId: s.clienteBId, // cliente de la sede B
          detalles: [{ productoId: s.gaseosaId, cantidad: 1 }],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('una venta FIADO incrementa el saldo pendiente del cliente', async () => {
      await ctx.ventas.create(s.duenoId, 'CLIENTE', {
        sedeId: s.sedeAId,
        tipo: 'FIADO',
        clienteId: s.clienteAId,
        detalles: [{ productoId: s.gaseosaId, cantidad: 2 }],
      });

      expect(await saldoDe(ctx.prisma, s.clienteAId)).toBe(3001);
    });

    it('una venta CONTADO no toca el saldo del cliente', async () => {
      await ctx.ventas.create(s.duenoId, 'CLIENTE', {
        sedeId: s.sedeAId,
        clienteId: s.clienteAId,
        detalles: [{ productoId: s.gaseosaId, cantidad: 2 }],
      });

      expect(await saldoDe(ctx.prisma, s.clienteAId)).toBe(0);
    });

    // Se afirma el invariante y no un conteo exacto de éxitos: bajo contención
    // algunas transacciones pueden expirar esperando el lock, y cuántas lo logran
    // depende del scheduler. Lo que nunca puede pasar es vender más de lo que hay.
    it('bajo llamadas concurrentes nunca sobrevende el stock', async () => {
      const vender = () =>
        ctx.ventas.create(s.duenoId, 'CLIENTE', {
          sedeId: s.sedeAId,
          detalles: [{ productoId: s.gaseosaId, cantidad: 7 }],
        });

      const resultados = await Promise.allSettled(
        Array.from({ length: 4 }, () => vender()),
      );
      const exitosas = resultados.filter(
        (r) => r.status === 'fulfilled',
      ).length;

      // Hay 10 unidades y cada venta pide 7: a lo sumo una puede prosperar.
      expect(exitosas).toBeLessThanOrEqual(1);
      const stock = await stockDe(ctx.prisma, s.gaseosaId);
      expect(stock).toBeGreaterThanOrEqual(0);
      expect(stock).toBe(10 - exitosas * 7);
      expect(await ctx.prisma.venta.count()).toBe(exitosas);
    });
  });

  describe('remove (anulación)', () => {
    it('devuelve el stock al anular', async () => {
      const venta = await ctx.ventas.create(s.duenoId, 'CLIENTE', {
        sedeId: s.sedeAId,
        detalles: [{ productoId: s.gaseosaId, cantidad: 4 }],
      });
      expect(await stockDe(ctx.prisma, s.gaseosaId)).toBe(6);

      await ctx.ventas.remove(venta.id, s.duenoId, 'CLIENTE');

      expect(await stockDe(ctx.prisma, s.gaseosaId)).toBe(10);
      expect(await ctx.prisma.venta.count()).toBe(0);
      expect(await ctx.prisma.detalleVenta.count()).toBe(0);
    });

    it('descuenta la deuda al anular una venta FIADO', async () => {
      const venta = await ctx.ventas.create(s.duenoId, 'CLIENTE', {
        sedeId: s.sedeAId,
        tipo: 'FIADO',
        clienteId: s.clienteAId,
        detalles: [{ productoId: s.gaseosaId, cantidad: 2 }],
      });
      expect(await saldoDe(ctx.prisma, s.clienteAId)).toBe(3001);

      await ctx.ventas.remove(venta.id, s.duenoId, 'CLIENTE');

      expect(await saldoDe(ctx.prisma, s.clienteAId)).toBe(0);
    });

    it('no deja el saldo en negativo si el cliente ya había abonado', async () => {
      const venta = await ctx.ventas.create(s.duenoId, 'CLIENTE', {
        sedeId: s.sedeAId,
        tipo: 'FIADO',
        clienteId: s.clienteAId,
        detalles: [{ productoId: s.gaseosaId, cantidad: 2 }], // deuda 3001
      });
      await ctx.abonos.create(s.duenoId, 'CLIENTE', {
        clienteId: s.clienteAId,
        monto: 3000,
      });
      expect(await saldoDe(ctx.prisma, s.clienteAId)).toBe(1);

      await ctx.ventas.remove(venta.id, s.duenoId, 'CLIENTE');

      // 1 - 3001 sería -3000; se corta en cero.
      expect(await saldoDe(ctx.prisma, s.clienteAId)).toBe(0);
    });
  });
});
