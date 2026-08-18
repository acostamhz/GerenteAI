import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
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
    const negocio = await this.prisma.negocio.findUnique({
      where: { id: dto.negocioId },
    });
    if (!negocio) {
      throw new NotFoundException('El negocio indicado no existe');
    }
    await this.negociosService.verificarPropietario(
      userId,
      dto.negocioId,
      rolGlobal,
    );

    try {
      return await this.prisma.sede.create({ data: dto });
    } catch (error) {
      throw this.traducirTelefonoDuplicado(error);
    }
  }

  // El filtro por telefono es cómo se resuelve de qué sede viene un mensaje de WhatsApp.
  findAll(negocioId?: string, telefono?: string) {
    return this.prisma.sede.findMany({
      where: {
        ...(negocioId ? { negocioId } : {}),
        ...(telefono ? { telefono } : {}),
      },
    });
  }

  async findOne(id: string) {
    const sede = await this.prisma.sede.findUnique({ where: { id } });
    if (!sede) {
      throw new NotFoundException(`Sede con id ${id} no encontrada`);
    }
    return sede;
  }

  async update(
    id: string,
    userId: string,
    rolGlobal: string,
    dto: UpdateSedeDto,
  ) {
    const sede = await this.findOne(id);
    await this.negociosService.verificarPropietario(
      userId,
      sede.negocioId,
      rolGlobal,
    );

    try {
      return await this.prisma.sede.update({ where: { id }, data: dto });
    } catch (error) {
      throw this.traducirTelefonoDuplicado(error);
    }
  }

  async remove(id: string, userId: string, rolGlobal: string) {
    const sede = await this.findOne(id);
    await this.negociosService.verificarPropietario(
      userId,
      sede.negocioId,
      rolGlobal,
    );
    return this.prisma.sede.delete({ where: { id } });
  }

  // Sede.telefono es @unique en todo el sistema: dos sedes no pueden compartir la
  // línea de WhatsApp porque entonces no se sabría a cuál pertenece un mensaje.
  private traducirTelefonoDuplicado(error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      return new ConflictException(
        'Ese número de WhatsApp ya está asignado a otra sede',
      );
    }
    return error;
  }
}
