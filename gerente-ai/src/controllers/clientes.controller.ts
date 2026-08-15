import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ClientesService } from '../services/clientes.service';
import { CreateClienteDto } from '../dto/clientes/create-cliente.dto';
import { UpdateClienteDto } from '../dto/clientes/update-cliente.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

type AuthUser = { userId: string; rolGlobal: string };

@Controller('clientes')
export class ClientesController {
  constructor(private readonly clientesService: ClientesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateClienteDto) {
    return this.clientesService.create(user.userId, user.rolGlobal, dto);
  }

  @Get()
  findAll(@Query('sedeId') sedeId?: string) {
    return this.clientesService.findAll(sedeId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.clientesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @CurrentUser() user: AuthUser, @Body() dto: UpdateClienteDto) {
    return this.clientesService.update(id, user.userId, user.rolGlobal, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.clientesService.remove(id, user.userId, user.rolGlobal);
  }
}