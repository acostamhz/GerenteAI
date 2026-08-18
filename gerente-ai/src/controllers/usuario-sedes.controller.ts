import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UsuarioSedesService } from '../services/usuario-sedes.service';
import { CreateUsuarioSedeDto } from '../dto/usuario-sedes/create-usuario-sede.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

type AuthUser = { userId: string; rolGlobal: string };

// Guard a nivel de clase: este módulo es la tabla de permisos, no un dato de negocio,
// así que las lecturas tampoco son públicas como en Productos/Clientes/Proveedores/Gastos.
@Controller('usuario-sedes')
@UseGuards(JwtAuthGuard)
export class UsuarioSedesController {
  constructor(private readonly usuarioSedesService: UsuarioSedesService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateUsuarioSedeDto) {
    return this.usuarioSedesService.create(user.userId, user.rolGlobal, dto);
  }

  @Get()
  findAll(@CurrentUser() user: AuthUser, @Query('sedeId') sedeId?: string) {
    return this.usuarioSedesService.findAll(
      user.userId,
      user.rolGlobal,
      sedeId,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.usuarioSedesService.findOne(id, user.userId, user.rolGlobal);
  }

  // Sin PATCH: no queda ningún campo editable en el vínculo (ver UsuarioSedesService).
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.usuarioSedesService.remove(id, user.userId, user.rolGlobal);
  }
}
