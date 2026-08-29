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
import { VentasService } from '../services/ventas.service';
import { CreateVentaDto } from '../dto/ventas/create-venta.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

type AuthUser = { userId: string; rolGlobal: string };

// El guard va en el controlador, no por método: así un endpoint nuevo
// nace protegido y no queda abierto por olvidar el decorador.
@Controller('ventas')
@UseGuards(JwtAuthGuard)
export class VentasController {
  constructor(private readonly ventasService: VentasService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateVentaDto) {
    return this.ventasService.create(user.userId, user.rolGlobal, dto);
  }

  @Get()
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('sedeId') sedeId?: string,
    @Query('clienteId') clienteId?: string,
  ) {
    return this.ventasService.findAll(
      user.userId,
      user.rolGlobal,
      sedeId,
      clienteId,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.ventasService.findOne(id, user.userId, user.rolGlobal);
  }

  // Sin PATCH a propósito: una venta se anula y se rehace, no se edita.
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.ventasService.remove(id, user.userId, user.rolGlobal);
  }
}
