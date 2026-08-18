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
    await this.negociosService.verificarAccesoSede(userId, sede, rolGlobal);

    return this.prisma.gasto.create({ data: dto });
  }

  findAll(sedeId?: string) {
    return this.prisma.gasto.findMany({
      where: sedeId ? { sedeId } : undefined,
    });
  }

  async findOne(id: string) {
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
    const gasto = await this.findOne(id);
    await this.verificarAccesoAlGasto(gasto.sedeId, userId, rolGlobal);
    return this.prisma.gasto.update({ where: { id }, data: dto });
  }

  async remove(id: string, userId: string, rolGlobal: string) {
    const gasto = await this.findOne(id);
    await this.verificarAccesoAlGasto(gasto.sedeId, userId, rolGlobal);
    return this.prisma.gasto.delete({ where: { id } });
  }

  private async verificarAccesoAlGasto(
    sedeId: string,
    userId: string,
    rolGlobal: string,
  ) {
    const sede = await this.prisma.sede.findUnique({ where: { id: sedeId } });
    if (!sede) {
      throw new NotFoundException('La sede asociada a este gasto ya no existe');
    }
    await this.negociosService.verificarAccesoSede(userId, sede, rolGlobal);
  }
}
