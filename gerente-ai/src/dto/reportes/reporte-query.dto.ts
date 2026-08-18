import { IsIn, IsOptional, Matches } from 'class-validator';

export const PERIODOS = ['diario', 'semanal', 'mensual'] as const;
export type Periodo = (typeof PERIODOS)[number];

export class ReporteQueryDto {
  @IsIn(PERIODOS, {
    message: `periodo debe ser uno de: ${PERIODOS.join(', ')}`,
  })
  @IsOptional()
  periodo?: Periodo;

  // Cualquier fecha dentro del período que se quiere consultar, en hora de Colombia.
  // Si no llega, se usa el día de hoy.
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'fecha debe tener el formato YYYY-MM-DD',
  })
  @IsOptional()
  fecha?: string;
}
