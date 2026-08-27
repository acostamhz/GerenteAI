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

@Controller('compras')
export class ComprasController {
  constructor(private readonly comprasService: ComprasService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateCompraDto) {
    return this.comprasService.create(user.userId, user.rolGlobal, dto);
  }

  @Get()
  findAll(
    @Query('sedeId') sedeId?: string,
    @Query('proveedorId') proveedorId?: string,
  ) {
    return this.comprasService.findAll(sedeId, proveedorId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.comprasService.findOne(id);
  }

  // Sin PATCH a propósito: una compra se anula y se rehace, no se edita.
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.comprasService.remove(id, user.userId, user.rolGlobal);
  }
}
