import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { NegociosService } from './negocios.service';
import { CreateProductoDto } from '../dto/productos/create-producto.dto';
import { UpdateProductoDto } from '../dto/productos/update-producto.dto';

@Injectable()
export class ProductosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly negociosService: NegociosService,
  ) {}

  async create(userId: string, rolGlobal: string, dto: CreateProductoDto) {
    const sede = await this.prisma.sede.findUnique({
      where: { id: dto.sedeId },
    });
    if (!sede) {
      throw new NotFoundException('La sede indicada no existe');
    }
    await this.negociosService.verificarAccesoSede(userId, sede, rolGlobal, {
      escritura: true,
    });

    return this.prisma.producto.create({ data: dto });
  }

  async findAll(userId: string, rolGlobal: string, sedeId?: string) {
    const visibles = await this.negociosService.filtroDeSedes(
      userId,
      rolGlobal,
      sedeId,
    );
    return this.prisma.producto.findMany({ where: { sedeId: visibles } });
  }

  async findOne(id: string, userId: string, rolGlobal: string) {
    const producto = await this.cargar(id);
    await this.verificarAccesoAlProducto(producto.sedeId, userId, rolGlobal);
    return producto;
  }

  /** Carga cruda: cada llamador decide qué permiso exige sobre la sede. */
  private async cargar(id: string) {
    const producto = await this.prisma.producto.findUnique({ where: { id } });
    if (!producto) {
      throw new NotFoundException(`Producto con id ${id} no encontrado`);
    }
    return producto;
  }

  async update(
    id: string,
    userId: string,
    rolGlobal: string,
    dto: UpdateProductoDto,
  ) {
    const producto = await this.cargar(id);
    await this.verificarAccesoAlProducto(producto.sedeId, userId, rolGlobal, {
      escritura: true,
    });
    return this.prisma.producto.update({ where: { id }, data: dto });
  }

  async remove(id: string, userId: string, rolGlobal: string) {
    const producto = await this.cargar(id);
    await this.verificarAccesoAlProducto(producto.sedeId, userId, rolGlobal, {
      escritura: true,
    });
    return this.prisma.producto.delete({ where: { id } });
  }

  private async verificarAccesoAlProducto(
    sedeId: string,
    userId: string,
    rolGlobal: string,
    opciones: { escritura?: boolean } = {},
  ) {
    const sede = await this.prisma.sede.findUnique({ where: { id: sedeId } });
    if (!sede) {
      throw new NotFoundException(
        'La sede asociada a este producto ya no existe',
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
