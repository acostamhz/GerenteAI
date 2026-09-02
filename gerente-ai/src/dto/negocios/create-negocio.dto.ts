import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';

import {
  DIA_INICIO_MAXIMO,
  DIA_INICIO_MINIMO,
} from '../../modules/finance-ai/domain/periodo-contable';

export class CreateNegocioDto {
  @IsString()
  @IsNotEmpty()
  nombre!: string;

  // Contacto administrativo del negocio. La línea que atiende el bot vive en Sede.telefono,
  // porque cada sede tiene su propio WhatsApp.
  @IsString()
  @IsOptional()
  @Matches(/^\+?[1-9]\d{6,14}$/, {
    message:
      'telefonoContacto debe ser un número válido en formato internacional',
  })
  telefonoContacto?: string;

  @IsString()
  @IsOptional()
  @Matches(/^\+?[1-9]\d{6,14}$/, {
    message:
      'telefonoSecundario debe ser un número válido en formato internacional',
  })
  telefonoSecundario?: string;

  @IsString()
  @IsOptional()
  contexto?: string;

  /**
   * Dia en que arranca el periodo contable. Por defecto 1 (mes calendario).
   *
   * El dia de cierre no se pide: es el anterior al de inicio. Pedir los dos
   * permitiria guardarlos inconsistentes (empezar el 21 y cerrar el 15).
   */
  @IsInt()
  @Min(DIA_INICIO_MINIMO, {
    message: `El dia de inicio del periodo debe estar entre ${DIA_INICIO_MINIMO} y ${DIA_INICIO_MAXIMO}`,
  })
  @Max(DIA_INICIO_MAXIMO, {
    message: `El dia de inicio del periodo debe estar entre ${DIA_INICIO_MINIMO} y ${DIA_INICIO_MAXIMO}. Se limita a ${DIA_INICIO_MAXIMO} para que exista en todos los meses.`,
  })
  @IsOptional()
  diaInicioPeriodo?: number;
}
