import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import {
  PLAN_ADMINISTRADOR,
  PLAN_GERENTE,
} from '../../services/planes.service';
import { CICLOS, type Ciclo } from '../negocios/cambiar-plan.dto';

/**
 * Lo que el frontend pide para iniciar un cobro.
 *
 * No lleva monto a propósito: el precio lo pone el backend desde el catálogo. Si
 * viniera del cliente, bastaría con editarlo en el navegador para pagar $1.000
 * por el plan Administrador.
 */
export class CrearCheckoutDto {
  @IsString()
  @IsNotEmpty()
  negocioId!: string;

  // Solo los planes que se venden. El Asistente es gratuito y el Socio es
  // interno: cobrar por cualquiera de los dos no tendría sentido.
  @IsInt()
  @IsIn([PLAN_GERENTE, PLAN_ADMINISTRADOR])
  plan!: number;

  @IsIn(CICLOS)
  @IsOptional()
  ciclo?: Ciclo;
}
