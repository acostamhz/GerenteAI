import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { NegociosService } from '../services/negocios.service';
import { CreateNegocioDto } from '../dto/negocios/create-negocio.dto';
import { UpdateNegocioDto } from '../dto/negocios/update-negocio.dto';
import { CambiarPlanDto } from '../dto/negocios/cambiar-plan.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

type AuthUser = { userId: string; rolGlobal: string };

@Controller('negocios')
export class NegociosController {
  constructor(private readonly negociosService: NegociosService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateNegocioDto) {
    return this.negociosService.create(user.userId, dto);
  }

  @Get()
  findAll() {
    return this.negociosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.negociosService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateNegocioDto,
  ) {
    return this.negociosService.update(id, user.userId, user.rolGlobal, dto);
  }

  // Único punto donde cambia el plan. Hoy solo MASTER; mañana, el webhook de la
  // pasarela después de confirmar el pago.
  @Patch(':id/plan')
  @UseGuards(JwtAuthGuard)
  cambiarPlan(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: CambiarPlanDto,
  ) {
    return this.negociosService.cambiarPlan(
      id,
      user.rolGlobal,
      dto.plan,
      dto.ciclo,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.negociosService.remove(id, user.userId, user.rolGlobal);
  }
}
