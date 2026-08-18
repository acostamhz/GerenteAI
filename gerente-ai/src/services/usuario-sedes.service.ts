import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from './prisma.service';
import { NegociosService } from './negocios.service';
import { CreateUsuarioSedeDto } from '../dto/usuario-sedes/create-usuario-sede.dto';

@Injectable()
export class UsuarioSedesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly negociosService: NegociosService,
  ) {}

  async create(userId: string, rolGlobal: string, dto: CreateUsuarioSedeDto) {
    const sede = await this.prisma.sede.findUnique({
      where: { id: dto.sedeId },
    });
    if (!sede) {
      throw new NotFoundException('La sede indicada no existe');
    }
    // Vincular personal la decide el dueño del negocio, no un miembro de la sede:
    // si bastara con pertenecer a la sede, un empleado podría darse permisos a sí mismo.
    await this.negociosService.verificarPropietario(
      userId,
      sede.negocioId,
      rolGlobal,
    );

    const usuario = await this.prisma.usuario.findUnique({
      where: { id: dto.usuarioId },
    });
    if (!usuario) {
      throw new NotFoundException('El usuario indicado no existe');
    }

    try {
      return await this.prisma.usuarioSede.create({ data: dto });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('El usuario ya está vinculado a esa sede');
      }
      throw error;
    }
  }

  async findAll(userId: string, rolGlobal: string, sedeId?: string) {
    // A diferencia de los módulos de negocio, aquí sedeId es obligatorio: listar todos los
    // vínculos del sistema expondría el organigrama completo de todos los negocios.
    if (!sedeId) {
      throw new BadRequestException(
        'Debes indicar el sedeId que quieres consultar',
      );
    }

    const sede = await this.prisma.sede.findUnique({ where: { id: sedeId } });
    if (!sede) {
      throw new NotFoundException('La sede indicada no existe');
    }
    await this.negociosService.verificarAccesoSede(userId, sede, rolGlobal);

    return this.prisma.usuarioSede.findMany({
      where: { sedeId },
      include: { usuario: { select: { id: true, nombre: true, email: true } } },
    });
  }

  async findOne(id: string, userId: string, rolGlobal: string) {
    const vinculo = await this.buscarVinculo(id);
    const sede = await this.buscarSedeDelVinculo(vinculo.sedeId);
    await this.negociosService.verificarAccesoSede(userId, sede, rolGlobal);
    return vinculo;
  }

  // Sin update: un vínculo solo tenía `role` como campo editable y el enum quedó
  // reducido a ADMIN. Para cambiar quién administra la sede, se desvincula y se vincula.
  async remove(id: string, userId: string, rolGlobal: string) {
    const vinculo = await this.buscarVinculo(id);
    const sede = await this.buscarSedeDelVinculo(vinculo.sedeId);
    await this.negociosService.verificarPropietario(
      userId,
      sede.negocioId,
      rolGlobal,
    );
    return this.prisma.usuarioSede.delete({ where: { id } });
  }

  private async buscarVinculo(id: string) {
    const vinculo = await this.prisma.usuarioSede.findUnique({ where: { id } });
    if (!vinculo) {
      throw new NotFoundException(
        `Vínculo usuario-sede con id ${id} no encontrado`,
      );
    }
    return vinculo;
  }

  private async buscarSedeDelVinculo(sedeId: string) {
    const sede = await this.prisma.sede.findUnique({ where: { id: sedeId } });
    if (!sede) {
      throw new NotFoundException(
        'La sede asociada a este vínculo ya no existe',
      );
    }
    return sede;
  }
}
