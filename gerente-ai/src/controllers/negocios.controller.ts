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

// El guard va en el controlador, no por método: así un endpoint nuevo
// nace protegido y no queda abierto por olvidar el decorador.
@Controller('negocios')
@UseGuards(JwtAuthGuard)
export class NegociosController {
  constructor(private readonly negociosService: NegociosService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateNegocioDto) {
    return this.negociosService.create(user.userId, dto);
  }

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.negociosService.findAll(user.userId, user.rolGlobal);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.negociosService.findOne(id, user.userId, user.rolGlobal);
  }

  @Patch(':id')
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
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.negociosService.remove(id, user.userId, user.rolGlobal);
  }
}
