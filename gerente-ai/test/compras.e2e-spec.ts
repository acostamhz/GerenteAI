import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import {
  cerrarContexto,
  crearContexto,
  limpiar,
  sembrar,
  stockDe,
  type Contexto,
  type Semilla,
} from './helpers/contexto';

describe('ComprasService (contra Postgres real)', () => {
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

  const costoDe = async (productoId: string) => {
    const producto = await ctx.prisma.producto.findUnique({
      where: { id: productoId },
    });
    return producto!.precioCompra.toNumber();
  };

  describe('create', () => {
    it('sube el stock y actualiza el precioCompra al último costo pagado', async () => {
      const compra = await ctx.compras.create(s.duenoId, 'CLIENTE', {
        sedeId: s.sedeAId,
        proveedorId: s.proveedorAId,
        detalles: [{ productoId: s.gaseosaId, cantidad: 800, costo: 1100 }],
      });

      expect(compra.total.toNumber()).toBe(880000);
      expect(await stockDe(ctx.prisma, s.gaseosaId)).toBe(810); // 10 + 800
      expect(await costoDe(s.gaseosaId)).toBe(1100); // antes era 1000
    });

    it('usa el precioCompra vigente cuando no se envía el costo', async () => {
      const compra = await ctx.compras.create(s.duenoId, 'CLIENTE', {
        sedeId: s.sedeAId,
        detalles: [{ productoId: s.gaseosaId, cantidad: 5 }],
      });

      expect(compra.total.toNumber()).toBe(5000); // 5 × 1000
      expect(await costoDe(s.gaseosaId)).toBe(1000); // sin cambios
    });

    it('permite comprar sin proveedor registrado', async () => {
      const compra = await ctx.compras.create(s.duenoId, 'CLIENTE', {
        sedeId: s.sedeAId,
        detalles: [{ productoId: s.panId, cantidad: 10, costo: 250 }],
      });

      expect(compra.proveedorId).toBeNull();
      expect(await stockDe(ctx.prisma, s.panId)).toBe(15);
    });

    it('rechaza un producto que no existe en la sede', async () => {
      await expect(
        ctx.compras.create(s.duenoId, 'CLIENTE', {
          sedeId: s.sedeAId,
          detalles: [{ productoId: s.arrozId, cantidad: 1 }], // arroz es de la sede B
        }),
      ).rejects.toThrow(NotFoundException);

      expect(await stockDe(ctx.prisma, s.arrozId)).toBe(10);
    });

    it('rechaza un proveedor de otra sede', async () => {
      const proveedorB = await ctx.prisma.proveedor.create({
        data: { nombre: 'Proveedor Norte', sedeId: s.sedeBId },
      });

      await expect(
        ctx.compras.create(s.duenoId, 'CLIENTE', {
          sedeId: s.sedeAId,
          proveedorId: proveedorB.id,
          detalles: [{ productoId: s.gaseosaId, cantidad: 1 }],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rechaza un total que no cuadra sin dejar rastro', async () => {
      await expect(
        ctx.compras.create(s.duenoId, 'CLIENTE', {
          sedeId: s.sedeAId,
          total: 1,
          detalles: [{ productoId: s.gaseosaId, cantidad: 5, costo: 1100 }],
        }),
      ).rejects.toThrow(BadRequestException);

      expect(await stockDe(ctx.prisma, s.gaseosaId)).toBe(10);
      expect(await costoDe(s.gaseosaId)).toBe(1000);
      expect(await ctx.prisma.compra.count()).toBe(0);
    });
  });

  describe('remove (anulación)', () => {
    it('devuelve el stock al anular', async () => {
      const compra = await ctx.compras.create(s.duenoId, 'CLIENTE', {
        sedeId: s.sedeAId,
        detalles: [{ productoId: s.gaseosaId, cantidad: 20 }],
      });
      expect(await stockDe(ctx.prisma, s.gaseosaId)).toBe(30);

      await ctx.compras.remove(compra.id, s.duenoId, 'CLIENTE');

      expect(await stockDe(ctx.prisma, s.gaseosaId)).toBe(10);
      expect(await ctx.prisma.compra.count()).toBe(0);
    });

    it('se niega a anular si la mercancía ya se vendió', async () => {
      const compra = await ctx.compras.create(s.duenoId, 'CLIENTE', {
        sedeId: s.sedeAId,
        detalles: [{ productoId: s.panId, cantidad: 10 }], // stock 5 -> 15
      });
      await ctx.ventas.create(s.duenoId, 'CLIENTE', {
        sedeId: s.sedeAId,
        detalles: [{ productoId: s.panId, cantidad: 12 }], // stock 15 -> 3
      });

      // Devolver las 10 unidades dejaría el stock en -7.
      await expect(
        ctx.compras.remove(compra.id, s.duenoId, 'CLIENTE'),
      ).rejects.toThrow(ConflictException);

      expect(await stockDe(ctx.prisma, s.panId)).toBe(3);
      expect(await ctx.prisma.compra.count()).toBe(1);
    });
  });
});
