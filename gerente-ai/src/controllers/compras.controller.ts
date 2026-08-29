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
import { ComprasService } from '../services/compras.service';
import { CreateCompraDto } from '../dto/compras/create-compra.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

type AuthUser = { userId: string; rolGlobal: string };

// El guard va en el controlador, no por método: así un endpoint nuevo
// nace protegido y no queda abierto por olvidar el decorador.
@Controller('compras')
@UseGuards(JwtAuthGuard)
export class ComprasController {
  constructor(private readonly comprasService: ComprasService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateCompraDto) {
    return this.comprasService.create(user.userId, user.rolGlobal, dto);
  }

  @Get()
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('sedeId') sedeId?: string,
    @Query('proveedorId') proveedorId?: string,
  ) {
    return this.comprasService.findAll(
      user.userId,
      user.rolGlobal,
      sedeId,
      proveedorId,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.comprasService.findOne(id, user.userId, user.rolGlobal);
  }

  // Sin PATCH a propósito: una compra se anula y se rehace, no se edita.
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.comprasService.remove(id, user.userId, user.rolGlobal);
  }
}
