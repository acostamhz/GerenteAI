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
    const sede = await this.prisma.sede.findUnique({ where: { id: dto.sedeId } });
    if (!sede) {
      throw new NotFoundException('La sede indicada no existe');
    }
    await this.negociosService.verificarPropietario(userId, sede.negocioId, rolGlobal);

    return this.prisma.producto.create({ data: dto });
  }

  findAll(sedeId?: string) {
    return this.prisma.producto.findMany({ where: sedeId ? { sedeId } : undefined });
  }

  async findOne(id: string) {
    const producto = await this.prisma.producto.findUnique({ where: { id } });
    if (!producto) {
      throw new NotFoundException(`Producto con id ${id} no encontrado`);
    }
    return producto;
  }

  async update(id: string, userId: string, rolGlobal: string, dto: UpdateProductoDto) {
    const producto = await this.findOne(id);
    await this.verificarPropietarioDelProducto(producto.sedeId, userId, rolGlobal);
    return this.prisma.producto.update({ where: { id }, data: dto });
  }

  async remove(id: string, userId: string, rolGlobal: string) {
    const producto = await this.findOne(id);
    await this.verificarPropietarioDelProducto(producto.sedeId, userId, rolGlobal);
    return this.prisma.producto.delete({ where: { id } });
  }

  private async verificarPropietarioDelProducto(sedeId: string, userId: string, rolGlobal: string) {
    const sede = await this.prisma.sede.findUnique({ where: { id: sedeId } });
    if (!sede) {
      throw new NotFoundException('La sede asociada a este producto ya no existe');
    }
    await this.negociosService.verificarPropietario(userId, sede.negocioId, rolGlobal);
  }
}