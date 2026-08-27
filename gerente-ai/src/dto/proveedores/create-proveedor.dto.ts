import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateProveedorDto {
  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @IsString()
  @IsOptional()
  telefono?: string;

  @IsEmail()
  @IsOptional()
  correo?: string;

  @IsString()
  @IsOptional()
  direccion?: string;

  @IsString()
  @IsNotEmpty()
  sedeId!: string;
}