import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { CreateNegocioDto } from '../dto/negocios/create-negocio.dto';
import { UpdateNegocioDto } from '../dto/negocios/update-negocio.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class NegociosService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createNegocioDto: CreateNegocioDto) {
    try {
      return await this.prisma.negocio.create({ data: createNegocioDto });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Ya existe un negocio registrado con ese número de teléfono',
        );
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

  async update(id: string, updateNegocioDto: UpdateNegocioDto) {
    await this.findOne(id); // valida existencia, lanza 404 si no existe
    try {
      return await this.prisma.negocio.update({
        where: { id },
        data: updateNegocioDto,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Ya existe un negocio registrado con ese número de teléfono',
        );
      }
      throw error;
    }
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.negocio.delete({ where: { id } });
  }
}
