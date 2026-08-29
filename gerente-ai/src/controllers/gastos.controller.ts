import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { GastosService } from '../services/gastos.service';
import { CreateGastoDto } from '../dto/gastos/create-gasto.dto';
import { UpdateGastoDto } from '../dto/gastos/update-gasto.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

type AuthUser = { userId: string; rolGlobal: string };

// El guard va en el controlador, no por método: así un endpoint nuevo
// nace protegido y no queda abierto por olvidar el decorador.
@Controller('gastos')
@UseGuards(JwtAuthGuard)
export class GastosController {
  constructor(private readonly gastosService: GastosService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateGastoDto) {
    return this.gastosService.create(user.userId, user.rolGlobal, dto);
  }

  @Get()
  findAll(@CurrentUser() user: AuthUser, @Query('sedeId') sedeId?: string) {
    return this.gastosService.findAll(user.userId, user.rolGlobal, sedeId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.gastosService.findOne(id, user.userId, user.rolGlobal);
  }

  @Patch(':id')
  update(@Param('id') id: string, @CurrentUser() user: AuthUser, @Body() dto: UpdateGastoDto) {
    return this.gastosService.update(id, user.userId, user.rolGlobal, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.gastosService.remove(id, user.userId, user.rolGlobal);
  }
}