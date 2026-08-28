import {
  ConflictException,
  ForbiddenException,
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
    await this.verificarTopeDeSedes(dto.negocioId, rolGlobal);

    try {
      return await this.prisma.sede.create({ data: dto });
    } catch (error) {
      throw this.traducirTelefonoDuplicado(error);
    }
  }

  /**
   * El plan del negocio define cuántas sedes puede tener: Asistente 1,
   * Gerente 4, Administrador 10. Se valida aquí y no en el frontend porque es
   * una regla de negocio: si solo estuviera en la pantalla, bastaría con llamar
   * la API directamente para saltársela.
   */
  private async verificarTopeDeSedes(negocioId: string, rolGlobal: string) {
    if (rolGlobal === 'MASTER') return;

    const estado = await this.negociosService.estadoDelPlan(negocioId);
    const tope = estado.vigente.maxSedes;
    if (tope === Number.POSITIVE_INFINITY) return;

    const existentes = await this.prisma.sede.count({ where: { negocioId } });
    if (existentes < tope) return;

    const motivo = estado.vencido
      ? `El plan ${estado.contratado.nombre} está vencido, así que el negocio quedó con el tope del plan Asistente`
      : `El plan ${estado.vigente.nombre} permite ${tope} sede(s)`;

    throw new ForbiddenException(
      `${motivo} y ya tiene ${existentes}. Cambia de plan para agregar más sedes.`,
    );
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
