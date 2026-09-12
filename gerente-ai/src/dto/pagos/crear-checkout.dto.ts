import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import {
  PLAN_ADMINISTRADOR,
  PLAN_GERENTE,
  PLAN_SOCIO,
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

  // Solo los planes que se compran desde la aplicación. Quedan fuera el
  // Asistente, que es gratuito, y el Corporativo, que se cotiza hablando con el
  // equipo. El servicio lo vuelve a comprobar contra `contratacion`: esto es
  // para dar un error claro, no para autorizar.
  @IsInt()
  @IsIn([PLAN_GERENTE, PLAN_ADMINISTRADOR, PLAN_SOCIO])
  plan!: number;

  @IsIn(CICLOS)
  @IsOptional()
  ciclo?: Ciclo;
}
