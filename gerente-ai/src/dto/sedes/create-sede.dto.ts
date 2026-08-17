import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateSedeDto {
  @IsString()
  @IsNotEmpty()
  nombre!: string;

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