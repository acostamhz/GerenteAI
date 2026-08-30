import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';

import { ReportesService } from '../services/reportes.service';
import { ReporteQueryDto } from '../dto/reportes/reporte-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

type AuthUser = {
  userId: string;
  rolGlobal: string;
};

@Controller('reportes')
@UseGuards(JwtAuthGuard)
export class ReportesController {
  constructor(private readonly reportesService: ReportesService) {}

  @Get('sede/:sedeId')
  deSede(
    @Param('sedeId') sedeId: string,
    @CurrentUser() user: AuthUser,
    @Query() query: ReporteQueryDto,
  ) {
    return this.reportesService.deSede(
      sedeId,
      user.userId,
      user.rolGlobal,
      query.periodo ?? 'diario',
      query.fecha,
    );
  }

  @Get('negocio/:negocioId')
  deNegocio(
    @Param('negocioId') negocioId: string,
    @CurrentUser() user: AuthUser,
    @Query() query: ReporteQueryDto,
  ) {
    return this.reportesService.deNegocio(
      negocioId,
      user.userId,
      user.rolGlobal,
      query.periodo ?? 'diario',
      query.fecha,
    );
  }

  @Get('producto/:sedeId')
  porProducto(
    @Param('sedeId') sedeId: string,
    @CurrentUser() user: AuthUser,
    @Query() query: ReporteQueryDto,
  ) {
    return this.reportesService.porProducto(
      sedeId,
      user.userId,
      user.rolGlobal,
      query.periodo ?? 'mensual',
      query.fecha,
    );
  }

  @Get('fiados/:sedeId')
  fiados(@Param('sedeId') sedeId: string, @CurrentUser() user: AuthUser) {
    return this.reportesService.fiados(
      sedeId,
      user.userId,
      user.rolGlobal,
    );
  }
}