import { IsDateString, IsIn, IsInt, IsOptional } from 'class-validator';
import {
  PLAN_ADMINISTRADOR,
  PLAN_ASISTENTE,
  PLAN_GERENTE,
  PLAN_SOCIO,
} from '../../services/planes.service';

export const CICLOS = ['mensual', 'anual'] as const;
export type Ciclo = (typeof CICLOS)[number];

export class CambiarPlanDto {
  @IsInt()
  @IsIn([PLAN_ASISTENTE, PLAN_GERENTE, PLAN_ADMINISTRADOR, PLAN_SOCIO])
  plan!: number;

  // Define hasta cuándo queda vigente. Se ignora en el plan Asistente, que no vence.
  @IsIn(CICLOS)
  @IsOptional()
  ciclo?: Ciclo;

  /**
   * Vencimiento exacto, en vez del que saldría del ciclo. Solo MASTER llega
   * aquí, y lo necesita para lo que un ciclo fijo no cubre: regalar un mes,
   * corregir una fecha mal puesta, o extenderle a un cliente. También es lo que
   * permite ensayar los recordatorios sin esperar a que pasen 27 días.
   */
  @IsDateString()
  @IsOptional()
  venceEl?: string;
}
