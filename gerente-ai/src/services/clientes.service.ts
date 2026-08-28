import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { NegociosService } from './negocios.service';
import { CreateClienteDto } from '../dto/clientes/create-cliente.dto';
import { UpdateClienteDto } from '../dto/clientes/update-cliente.dto';

@Injectable()
export class ClientesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly negociosService: NegociosService,
  ) {}

  async create(userId: string, rolGlobal: string, dto: CreateClienteDto) {
    const sede = await this.prisma.sede.findUnique({
      where: { id: dto.sedeId },
    });
    if (!sede) {
      throw new NotFoundException('La sede indicada no existe');
    }
    await this.negociosService.verificarAccesoSede(userId, sede, rolGlobal, {
      escritura: true,
    });

    return this.prisma.cliente.create({ data: dto });
  }

  findAll(sedeId?: string) {
    return this.prisma.cliente.findMany({
      where: sedeId ? { sedeId } : undefined,
    });
  }

  async findOne(id: string) {
    const cliente = await this.prisma.cliente.findUnique({ where: { id } });
    if (!cliente) {
      throw new NotFoundException(`Cliente con id ${id} no encontrado`);
    }
    return cliente;
  }

  async update(
    id: string,
    userId: string,
    rolGlobal: string,
    dto: UpdateClienteDto,
  ) {
    const cliente = await this.findOne(id);
    await this.verificarAccesoAlCliente(cliente.sedeId, userId, rolGlobal);
    return this.prisma.cliente.update({ where: { id }, data: dto });
  }

  async remove(id: string, userId: string, rolGlobal: string) {
    const cliente = await this.findOne(id);
    await this.verificarAccesoAlCliente(cliente.sedeId, userId, rolGlobal);
    return this.prisma.cliente.delete({ where: { id } });
  }

  private async verificarAccesoAlCliente(
    sedeId: string,
    userId: string,
    rolGlobal: string,
  ) {
    const sede = await this.prisma.sede.findUnique({ where: { id: sedeId } });
    if (!sede) {
      throw new NotFoundException(
        'La sede asociada a este cliente ya no existe',
      );
    }
    await this.negociosService.verificarAccesoSede(userId, sede, rolGlobal, {
      escritura: true,
    });
  }
}
