import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { NegociosService } from './negocios.service';
import { CreateProveedorDto } from '../dto/proveedores/create-proveedor.dto';
import { UpdateProveedorDto } from '../dto/proveedores/update-proveedor.dto';

@Injectable()
export class ProveedoresService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly negociosService: NegociosService,
  ) {}

  async create(userId: string, rolGlobal: string, dto: CreateProveedorDto) {
    const sede = await this.prisma.sede.findUnique({
      where: { id: dto.sedeId },
    });
    if (!sede) {
      throw new NotFoundException('La sede indicada no existe');
    }
    await this.negociosService.verificarAccesoSede(userId, sede, rolGlobal, {
      escritura: true,
    });

    return this.prisma.proveedor.create({ data: dto });
  }

  async findAll(userId: string, rolGlobal: string, sedeId?: string) {
    const visibles = await this.negociosService.filtroDeSedes(
      userId,
      rolGlobal,
      sedeId,
    );
    return this.prisma.proveedor.findMany({ where: { sedeId: visibles } });
  }

  async findOne(id: string, userId: string, rolGlobal: string) {
    const proveedor = await this.cargar(id);
    await this.verificarAccesoAlProveedor(proveedor.sedeId, userId, rolGlobal);
    return proveedor;
  }

  /** Carga cruda: cada llamador decide qué permiso exige sobre la sede. */
  private async cargar(id: string) {
    const proveedor = await this.prisma.proveedor.findUnique({ where: { id } });
    if (!proveedor) {
      throw new NotFoundException(`Proveedor con id ${id} no encontrado`);
    }
    return proveedor;
  }

  async update(
    id: string,
    userId: string,
    rolGlobal: string,
    dto: UpdateProveedorDto,
  ) {
    const proveedor = await this.cargar(id);
    await this.verificarAccesoAlProveedor(proveedor.sedeId, userId, rolGlobal, {
      escritura: true,
    });
    return this.prisma.proveedor.update({ where: { id }, data: dto });
  }

  async remove(id: string, userId: string, rolGlobal: string) {
    const proveedor = await this.cargar(id);
    await this.verificarAccesoAlProveedor(proveedor.sedeId, userId, rolGlobal, {
      escritura: true,
    });
    return this.prisma.proveedor.delete({ where: { id } });
  }

  private async verificarAccesoAlProveedor(
    sedeId: string,
    userId: string,
    rolGlobal: string,
    opciones: { escritura?: boolean } = {},
  ) {
    const sede = await this.prisma.sede.findUnique({ where: { id: sedeId } });
    if (!sede) {
      throw new NotFoundException(
        'La sede asociada a este proveedor ya no existe',
      );
    }
    await this.negociosService.verificarAccesoSede(
      userId,
      sede,
      rolGlobal,
      opciones,
    );
  }
}
