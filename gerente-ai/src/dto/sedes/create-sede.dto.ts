import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class CreateSedeDto {
  @IsString()
  @IsNotEmpty()
  nombre!: string;

  // Línea de WhatsApp que atiende el bot en esta sede. Es única en todo el sistema:
  // es la llave con la que se sabe de qué sede viene un mensaje entrante.
  @IsString()
  @IsOptional()
  @Matches(/^\+?[1-9]\d{6,14}$/, {
    message: 'telefono debe ser un número válido en formato internacional',
  })
  telefono?: string;

  @IsString()
  @IsOptional()
  direccion?: string;

  @IsString()
  @IsOptional()
  contexto?: string;

  @IsString()
  @IsNotEmpty()
  negocioId!: string;
}
