import { IsIn, IsInt, IsOptional } from 'class-validator';
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
}
