import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { GastosService } from '../services/gastos.service';
import { CreateGastoDto } from '../dto/gastos/create-gasto.dto';
import { UpdateGastoDto } from '../dto/gastos/update-gasto.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

type AuthUser = { userId: string; rolGlobal: string };

@Controller('gastos')
export class GastosController {
  constructor(private readonly gastosService: GastosService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateGastoDto) {
    return this.gastosService.create(user.userId, user.rolGlobal, dto);
  }

  @Get()
  findAll(@Query('sedeId') sedeId?: string) {
    return this.gastosService.findAll(sedeId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.gastosService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @CurrentUser() user: AuthUser, @Body() dto: UpdateGastoDto) {
    return this.gastosService.update(id, user.userId, user.rolGlobal, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.gastosService.remove(id, user.userId, user.rolGlobal);
  }
}