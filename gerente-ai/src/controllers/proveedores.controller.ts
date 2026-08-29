import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ProveedoresService } from '../services/proveedores.service';
import { CreateProveedorDto } from '../dto/proveedores/create-proveedor.dto';
import { UpdateProveedorDto } from '../dto/proveedores/update-proveedor.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

type AuthUser = { userId: string; rolGlobal: string };

// El guard va en el controlador, no por método: así un endpoint nuevo
// nace protegido y no queda abierto por olvidar el decorador.
@Controller('proveedores')
@UseGuards(JwtAuthGuard)
export class ProveedoresController {
  constructor(private readonly proveedoresService: ProveedoresService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateProveedorDto) {
    return this.proveedoresService.create(user.userId, user.rolGlobal, dto);
  }

  @Get()
  findAll(@CurrentUser() user: AuthUser, @Query('sedeId') sedeId?: string) {
    return this.proveedoresService.findAll(user.userId, user.rolGlobal, sedeId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.proveedoresService.findOne(id, user.userId, user.rolGlobal);
  }

  @Patch(':id')
  update(@Param('id') id: string, @CurrentUser() user: AuthUser, @Body() dto: UpdateProveedorDto) {
    return this.proveedoresService.update(id, user.userId, user.rolGlobal, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.proveedoresService.remove(id, user.userId, user.rolGlobal);
  }
}