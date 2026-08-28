import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ReportesService } from '../services/reportes.service';
import { ReporteQueryDto } from '../dto/reportes/reporte-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

type AuthUser = { userId: string; rolGlobal: string };

// A diferencia de los módulos de negocio, aquí los GET no son públicos: la regla es
// que un admin solo vea su sede y solo el dueño vea el consolidado, y eso obliga a
// saber quién está preguntando.
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

  // --- Reportes Premium: planes Gerente y Administrador ---

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
    return this.reportesService.fiados(sedeId, user.userId, user.rolGlobal);
  }
}
