import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Role } from '@prisma/client';

export class AsociarNegocioDto {
  @IsString()
  @IsNotEmpty()
  negocioId!: string;

  @IsEnum(Role)
  @IsOptional()
  role?: Role;
}