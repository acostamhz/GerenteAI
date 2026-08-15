import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class CreateNegocioDto {
  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\+?[1-9]\d{6,14}$/, {
    message: 'telefono debe ser un número válido en formato internacional',
  })
  telefono!: string;

  @IsString()
  @IsOptional()
  @Matches(/^\+?[1-9]\d{6,14}$/, {
    message: 'telefonoSecundario debe ser un número válido en formato internacional',
  })
  telefonoSecundario?: string;

  @IsString()
  @IsOptional()
  contexto?: string;
}