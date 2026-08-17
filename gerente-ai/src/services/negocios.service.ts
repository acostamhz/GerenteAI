import { Injectable, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { CreateNegocioDto } from '../dto/negocios/create-negocio.dto';
import { UpdateNegocioDto } from '../dto/negocios/update-negocio.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class NegociosService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, createNegocioDto: CreateNegocioDto) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const negocio = await tx.negocio.create({ data: createNegocioDto });
        await tx.usuarioNegocio.create({
          data: { usuarioId: userId, negocioId: negocio.id, role: 'ADMIN' },
        });
        return negocio;
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Ya existe un negocio registrado con ese número de teléfono');
      }
      throw error;
    }
  }

  findAll() {
    return this.prisma.negocio.findMany();
  }

  async findOne(id: string) {
    const negocio = await this.prisma.negocio.findUnique({ where: { id } });
    if (!negocio) {
      throw new NotFoundException(`Negocio con id ${id} no encontrado`);
    }
    return negocio;
  }

  async update(id: string, userId: string, rolGlobal: string, updateNegocioDto: UpdateNegocioDto) {
    await this.findOne(id);
    await this.verificarPropietario(userId, id, rolGlobal);
    try {
      return await this.prisma.negocio.update({ where: { id }, data: updateNegocioDto });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Ya existe un negocio registrado con ese número de teléfono');
      }
      throw error;
    }
  }

  async remove(id: string, userId: string, rolGlobal: string) {
    await this.findOne(id);
    await this.verificarPropietario(userId, id, rolGlobal);
    return this.prisma.negocio.delete({ where: { id } });
  }

  // Reutilizable por SedesService y futuros módulos (Productos, Ventas, etc.)
  async verificarPropietario(usuarioId: string, negocioId: string, rolGlobal: string) {
    if (rolGlobal === 'MASTER') return;

    const relacion = await this.prisma.usuarioNegocio.findUnique({
      where: { usuarioId_negocioId: { usuarioId, negocioId } },
    });
    if (!relacion) {
      throw new ForbiddenException('No tienes permisos sobre este negocio');
    }
  }
}