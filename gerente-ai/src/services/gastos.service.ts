import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { NegociosService } from './negocios.service';
import { CreateGastoDto } from '../dto/gastos/create-gasto.dto';
import { UpdateGastoDto } from '../dto/gastos/update-gasto.dto';

@Injectable()
export class GastosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly negociosService: NegociosService,
  ) {}

  async create(userId: string, rolGlobal: string, dto: CreateGastoDto) {
    const sede = await this.prisma.sede.findUnique({
      where: { id: dto.sedeId },
    });
    if (!sede) {
      throw new NotFoundException('La sede indicada no existe');
    }
    await this.negociosService.verificarAccesoSede(userId, sede, rolGlobal, {
      escritura: true,
    });

    return this.prisma.gasto.create({ data: dto });
  }

  async findAll(userId: string, rolGlobal: string, sedeId?: string) {
    const visibles = await this.negociosService.filtroDeSedes(
      userId,
      rolGlobal,
      sedeId,
    );
    return this.prisma.gasto.findMany({ where: { sedeId: visibles } });
  }

  async findOne(id: string, userId: string, rolGlobal: string) {
    const gasto = await this.cargar(id);
    await this.verificarAccesoAlGasto(gasto.sedeId, userId, rolGlobal);
    return gasto;
  }

  /** Carga cruda: cada llamador decide qué permiso exige sobre la sede. */
  private async cargar(id: string) {
    const gasto = await this.prisma.gasto.findUnique({ where: { id } });
    if (!gasto) {
      throw new NotFoundException(`Gasto con id ${id} no encontrado`);
    }
    return gasto;
  }

  async update(
    id: string,
    userId: string,
    rolGlobal: string,
    dto: UpdateGastoDto,
  ) {
    const gasto = await this.cargar(id);
    await this.verificarAccesoAlGasto(gasto.sedeId, userId, rolGlobal, {
      escritura: true,
    });
    return this.prisma.gasto.update({ where: { id }, data: dto });
  }

  async remove(id: string, userId: string, rolGlobal: string) {
    const gasto = await this.cargar(id);
    await this.verificarAccesoAlGasto(gasto.sedeId, userId, rolGlobal, {
      escritura: true,
    });
    return this.prisma.gasto.delete({ where: { id } });
  }

  private async verificarAccesoAlGasto(
    sedeId: string,
    userId: string,
    rolGlobal: string,
    opciones: { escritura?: boolean } = {},
  ) {
    const sede = await this.prisma.sede.findUnique({ where: { id: sedeId } });
    if (!sede) {
      throw new NotFoundException('La sede asociada a este gasto ya no existe');
    }
    await this.negociosService.verificarAccesoSede(
      userId,
      sede,
      rolGlobal,
      opciones,
    );
  }
}
