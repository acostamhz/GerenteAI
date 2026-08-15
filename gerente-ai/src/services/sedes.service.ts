import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { NegociosService } from './negocios.service';
import { CreateSedeDto } from '../dto/sedes/create-sede.dto';
import { UpdateSedeDto } from '../dto/sedes/update-sede.dto';

@Injectable()
export class SedesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly negociosService: NegociosService,
  ) {}

  async create(userId: string, rolGlobal: string, dto: CreateSedeDto) {
    const negocio = await this.prisma.negocio.findUnique({ where: { id: dto.negocioId } });
    if (!negocio) {
      throw new NotFoundException('El negocio indicado no existe');
    }
    await this.negociosService.verificarPropietario(userId, dto.negocioId, rolGlobal);

    return this.prisma.sede.create({ data: dto });
  }

  findAll(negocioId?: string) {
    return this.prisma.sede.findMany({ where: negocioId ? { negocioId } : undefined });
  }

  async findOne(id: string) {
    const sede = await this.prisma.sede.findUnique({ where: { id } });
    if (!sede) {
      throw new NotFoundException(`Sede con id ${id} no encontrada`);
    }
    return sede;
  }

  async update(id: string, userId: string, rolGlobal: string, dto: UpdateSedeDto) {
    const sede = await this.findOne(id);
    await this.negociosService.verificarPropietario(userId, sede.negocioId, rolGlobal);
    return this.prisma.sede.update({ where: { id }, data: dto });
  }

  async remove(id: string, userId: string, rolGlobal: string) {
    const sede = await this.findOne(id);
    await this.negociosService.verificarPropietario(userId, sede.negocioId, rolGlobal);
    return this.prisma.sede.delete({ where: { id } });
  }
}