import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { CreateNegocioDto } from '../dto/negocios/create-negocio.dto';
import { UpdateNegocioDto } from '../dto/negocios/update-negocio.dto';
import { Sede } from '@prisma/client';

@Injectable()
export class NegociosService {
  constructor(private readonly prisma: PrismaService) {}

  // Quien crea el negocio queda como dueño en la misma transacción.
  async create(userId: string, createNegocioDto: CreateNegocioDto) {
    return this.prisma.$transaction(async (tx) => {
      const negocio = await tx.negocio.create({ data: createNegocioDto });
      await tx.usuarioNegocio.create({
        data: { usuarioId: userId, negocioId: negocio.id },
      });
      return negocio;
    });
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

  async update(
    id: string,
    userId: string,
    rolGlobal: string,
    updateNegocioDto: UpdateNegocioDto,
  ) {
    await this.findOne(id);
    await this.verificarPropietario(userId, id, rolGlobal);
    return this.prisma.negocio.update({
      where: { id },
      data: updateNegocioDto,
    });
  }

  async remove(id: string, userId: string, rolGlobal: string) {
    await this.findOne(id);
    await this.verificarPropietario(userId, id, rolGlobal);
    return this.prisma.negocio.delete({ where: { id } });
  }

  // Reutilizable por SedesService y futuros módulos (Productos, Ventas, etc.)
  async verificarPropietario(
    usuarioId: string,
    negocioId: string,
    rolGlobal: string,
  ) {
    if (rolGlobal === 'MASTER') return;

    const relacion = await this.prisma.usuarioNegocio.findUnique({
      where: { usuarioId_negocioId: { usuarioId, negocioId } },
    });
    if (!relacion) {
      throw new ForbiddenException('No tienes permisos sobre este negocio');
    }
  }

  // Acceso operativo sobre una sede: dueño/socio del negocio, o miembro vinculado a esa sede.
  // Recibe la sede ya cargada porque el llamador siempre la consultó antes para su propio 404;
  // pasarla entera evita repetir la query y evita confundir el orden de sedeId/negocioId.
  async verificarAccesoSede(
    usuarioId: string,
    sede: Pick<Sede, 'id' | 'negocioId'>,
    rolGlobal: string,
  ) {
    if (rolGlobal === 'MASTER') return;

    const esDuenoDelNegocio = await this.prisma.usuarioNegocio.findUnique({
      where: { usuarioId_negocioId: { usuarioId, negocioId: sede.negocioId } },
    });
    if (esDuenoDelNegocio) return;

    const esMiembroDeLaSede = await this.prisma.usuarioSede.findUnique({
      where: { usuarioId_sedeId: { usuarioId, sedeId: sede.id } },
    });
    if (esMiembroDeLaSede) return;

    throw new ForbiddenException('No tienes permisos sobre esta sede');
  }
}
