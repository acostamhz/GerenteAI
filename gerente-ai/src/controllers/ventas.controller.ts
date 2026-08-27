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

@Controller('ventas')
export class VentasController {
  constructor(private readonly ventasService: VentasService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateVentaDto) {
    return this.ventasService.create(user.userId, user.rolGlobal, dto);
  }

  @Get()
  findAll(
    @Query('sedeId') sedeId?: string,
    @Query('clienteId') clienteId?: string,
  ) {
    return this.ventasService.findAll(sedeId, clienteId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ventasService.findOne(id);
  }

  // Sin PATCH a propósito: una venta se anula y se rehace, no se edita.
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.ventasService.remove(id, user.userId, user.rolGlobal);
  }
}
