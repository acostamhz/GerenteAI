import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from './prisma.service';
import { NegociosService } from './negocios.service';
import { CreateVentaDto } from '../dto/ventas/create-venta.dto';

/** Plazo estándar de un fiado cuando el mensaje no dice otra cosa. */
const DIAS_CREDITO_POR_DEFECTO = 30;
const UN_DIA_MS = 86_400_000;

function vencimientoEn(dias: number): Date {
  return new Date(Date.now() + dias * UN_DIA_MS);
}

@Injectable()
export class VentasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly negociosService: NegociosService,
  ) {}

  async create(userId: string, rolGlobal: string, dto: CreateVentaDto) {
    const sede = await this.prisma.sede.findUnique({
      where: { id: dto.sedeId },
    });
    if (!sede) {
      throw new NotFoundException('La sede indicada no existe');
    }
    await this.negociosService.verificarAccesoSede(userId, sede, rolGlobal, {
      escritura: true,
    });

    const tipo = dto.tipo ?? 'CONTADO';
    const clienteId = dto.clienteId ?? null;

    // El schema permite Venta sin cliente, pero fiarle a nadie no significa nada:
    // el saldo pendiente tiene que quedar cargado a alguien.
    if (tipo === 'FIADO' && !clienteId) {
      throw new BadRequestException('Una venta FIADO requiere un clienteId');
    }

    // Un plazo de crédito sobre una venta de contado no significa nada, y
    // aceptarlo en silencio haría creer que quedó registrado.
    if (tipo !== 'FIADO' && dto.diasCredito !== undefined) {
      throw new BadRequestException(
        'diasCredito solo aplica a las ventas de tipo FIADO',
      );
    }

    if (clienteId) {
      const cliente = await this.prisma.cliente.findUnique({
        where: { id: clienteId },
      });
      if (!cliente) {
        throw new NotFoundException('El cliente indicado no existe');
      }
      if (cliente.sedeId !== dto.sedeId) {
        throw new BadRequestException(
          'El cliente no pertenece a la sede de la venta',
        );
      }
    }

    // Dos líneas del mismo producto harían que cada una valide el stock por separado
    // contra el mismo saldo, permitiendo vender más de lo que hay.
    const productoIds = dto.detalles.map((d) => d.productoId);
    if (new Set(productoIds).size !== productoIds.length) {
      throw new BadRequestException(
        'Hay productos repetidos en el detalle: agrupa las cantidades en una sola línea',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // El filtro por sedeId evita vender el producto de otra sede pasando su id.
      const productos = await tx.producto.findMany({
        where: { id: { in: productoIds }, sedeId: dto.sedeId },
      });

      if (productos.length !== productoIds.length) {
        const encontrados = new Set(productos.map((p) => p.id));
        const faltantes = productoIds.filter((id) => !encontrados.has(id));
        throw new NotFoundException(
          `Estos productos no existen en la sede indicada: ${faltantes.join(', ')}`,
        );
      }

      const porId = new Map(productos.map((p) => [p.id, p]));
      let total = new Prisma.Decimal(0);

      const lineas = dto.detalles.map((detalle) => {
        const producto = porId.get(detalle.productoId)!;

        if (producto.stock < detalle.cantidad) {
          throw new ConflictException(
            `Stock insuficiente de "${producto.nombre}": hay ${producto.stock} y se piden ${detalle.cantidad}`,
          );
        }

        const precio =
          detalle.precio !== undefined
            ? new Prisma.Decimal(detalle.precio)
            : producto.precioVenta;

        total = total.add(precio.mul(detalle.cantidad));
        return {
          productoId: detalle.productoId,
          cantidad: detalle.cantidad,
          precio,
        };
      });

      if (
        dto.total !== undefined &&
        !total.equals(new Prisma.Decimal(dto.total))
      ) {
        throw new BadRequestException(
          `El total enviado (${dto.total}) no coincide con el calculado (${total.toString()})`,
        );
      }

      // Decremento condicional: entre la lectura de arriba y esta escritura otra venta
      // simultánea pudo consumir el stock. Si eso pasó, updateMany no afecta filas
      // y abortamos la transacción en vez de dejar el stock en negativo.
      for (const linea of lineas) {
        const { count } = await tx.producto.updateMany({
          where: { id: linea.productoId, stock: { gte: linea.cantidad } },
          data: { stock: { decrement: linea.cantidad } },
        });
        if (count === 0) {
          throw new ConflictException(
            `El stock de "${porId.get(linea.productoId)!.nombre}" cambió mientras se registraba la venta, intenta de nuevo`,
          );
        }
      }

      if (tipo === 'FIADO' && clienteId) {
        await tx.cliente.update({
          where: { id: clienteId },
          data: { saldoPendiente: { increment: total } },
        });
      }

      const esFiado = tipo === 'FIADO';

      return tx.venta.create({
        data: {
          tipo,
          total,
          sedeId: dto.sedeId,
          clienteId,
          // El saldo por venta es lo que permite calcular antigüedad de deuda:
          // Cliente.saldoPendiente dice cuánto debe en total, pero no desde cuándo.
          saldoPendiente: esFiado ? total : new Prisma.Decimal(0),
          fechaVencimiento: esFiado
            ? vencimientoEn(dto.diasCredito ?? DIAS_CREDITO_POR_DEFECTO)
            : null,
          detalles: { create: lineas },
        },
        include: { detalles: true },
      });
    });
  }

  async findAll(
    userId: string,
    rolGlobal: string,
    sedeId?: string,
    clienteId?: string,
  ) {
    const visibles = await this.negociosService.filtroDeSedes(
      userId,
      rolGlobal,
      sedeId,
    );
    return this.prisma.venta.findMany({
      where: {
        sedeId: visibles,
        ...(clienteId ? { clienteId } : {}),
      },
      include: { detalles: true },
      orderBy: { fecha: 'desc' },
    });
  }

  async findOne(id: string, userId: string, rolGlobal: string) {
    const venta = await this.cargar(id);
    await this.verificarAccesoALaVenta(venta.sedeId, userId, rolGlobal);
    return venta;
  }

  /** Carga cruda: cada llamador decide qué permiso exige sobre la sede. */
  private async cargar(id: string) {
    const venta = await this.prisma.venta.findUnique({
      where: { id },
      include: { detalles: true },
    });
    if (!venta) {
      throw new NotFoundException(`Venta con id ${id} no encontrada`);
    }
    return venta;
  }

  private async verificarAccesoALaVenta(
    sedeId: string,
    userId: string,
    rolGlobal: string,
    opciones: { escritura?: boolean } = {},
  ) {
    const sede = await this.prisma.sede.findUnique({ where: { id: sedeId } });
    if (!sede) {
      throw new NotFoundException('La sede asociada a esta venta ya no existe');
    }
    await this.negociosService.verificarAccesoSede(
      userId,
      sede,
      rolGlobal,
      opciones,
    );
  }

  // No existe update: recalcular stock y saldo hacia atrás sobre una venta ya
  // registrada corrompe el inventario en silencio. Para corregir, se anula y se rehace.
  async remove(id: string, userId: string, rolGlobal: string) {
    const venta = await this.cargar(id);
    await this.verificarAccesoALaVenta(venta.sedeId, userId, rolGlobal, {
      escritura: true,
    });

    return this.prisma.$transaction(async (tx) => {
      // Los productos siguen existiendo: la FK con onDelete: Restrict impide borrar
      // un producto que tenga detalles de venta.
      for (const detalle of venta.detalles) {
        await tx.producto.update({
          where: { id: detalle.productoId },
          data: { stock: { increment: detalle.cantidad } },
        });
      }

      if (venta.tipo === 'FIADO' && venta.clienteId) {
        const cliente = await tx.cliente.findUnique({
          where: { id: venta.clienteId },
        });
        if (cliente) {
          // Si el cliente ya abonó parte de esta deuda, restar el total completo
          // dejaría el saldo en negativo; en ese caso se corta en cero.
          const nuevoSaldo = cliente.saldoPendiente.sub(venta.total);
          await tx.cliente.update({
            where: { id: venta.clienteId },
            data: {
              saldoPendiente: nuevoSaldo.isNegative()
                ? new Prisma.Decimal(0)
                : nuevoSaldo,
            },
          });
        }
      }

      // Los DetalleVenta caen por cascada desde Venta.
      return tx.venta.delete({ where: { id } });
    });
  }
}
