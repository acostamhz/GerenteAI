import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from './prisma.service';
import { NegociosService } from './negocios.service';
import { CreateAbonoDto } from '../dto/abonos/create-abono.dto';

@Injectable()
export class AbonosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly negociosService: NegociosService,
  ) {}

  async create(userId: string, rolGlobal: string, dto: CreateAbonoDto) {
    const cliente = await this.prisma.cliente.findUnique({
      where: { id: dto.clienteId },
    });
    if (!cliente) {
      throw new NotFoundException('El cliente indicado no existe');
    }

    const sede = await this.buscarSede(cliente.sedeId, 'este cliente');
    await this.negociosService.verificarAccesoSede(userId, sede, rolGlobal);

    const monto = new Prisma.Decimal(dto.monto);

    // Un abono mayor a la deuda dejaría el saldo en negativo. Es más probable que sea
    // un error de digitación (o de interpretación de la IA) que un pago adelantado real.
    if (cliente.saldoPendiente.lessThan(monto)) {
      throw new BadRequestException(
        `El abono (${monto.toString()}) supera el saldo pendiente del cliente (${cliente.saldoPendiente.toString()})`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // Condicional por la misma razón que el stock en Ventas: dos abonos simultáneos
      // sobre el mismo cliente no deben poder dejar el saldo por debajo de cero.
      const { count } = await tx.cliente.updateMany({
        where: { id: dto.clienteId, saldoPendiente: { gte: monto } },
        data: { saldoPendiente: { decrement: monto } },
      });
      if (count === 0) {
        throw new ConflictException(
          'El saldo del cliente cambió mientras se registraba el abono, intenta de nuevo',
        );
      }

      return tx.abono.create({
        data: { monto, clienteId: dto.clienteId, sedeId: cliente.sedeId },
      });
    });
  }

  findAll(sedeId?: string, clienteId?: string) {
    return this.prisma.abono.findMany({
      where: {
        ...(sedeId ? { sedeId } : {}),
        ...(clienteId ? { clienteId } : {}),
      },
      orderBy: { fecha: 'desc' },
    });
  }

  async findOne(id: string) {
    const abono = await this.prisma.abono.findUnique({ where: { id } });
    if (!abono) {
      throw new NotFoundException(`Abono con id ${id} no encontrado`);
    }
    return abono;
  }

  // Sin update, por lo mismo que en Ventas: corregir un monto ya aplicado al saldo
  // se hace anulando y volviendo a registrar.
  async remove(id: string, userId: string, rolGlobal: string) {
    const abono = await this.findOne(id);
    const sede = await this.buscarSede(abono.sedeId, 'este abono');
    await this.negociosService.verificarAccesoSede(userId, sede, rolGlobal);

    return this.prisma.$transaction(async (tx) => {
      // Anular el abono devuelve la deuda al cliente.
      await tx.cliente.update({
        where: { id: abono.clienteId },
        data: { saldoPendiente: { increment: abono.monto } },
      });
      return tx.abono.delete({ where: { id } });
    });
  }

  private async buscarSede(sedeId: string, contexto: string) {
    const sede = await this.prisma.sede.findUnique({ where: { id: sedeId } });
    if (!sede) {
      throw new NotFoundException(
        `La sede asociada a ${contexto} ya no existe`,
      );
    }
    return sede;
  }
}
