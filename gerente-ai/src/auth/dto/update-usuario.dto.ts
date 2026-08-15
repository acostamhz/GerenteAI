import { IsOptional, IsString } from 'class-validator';

export class UpdateUsuarioDto {
  @IsString()
  @IsOptional()
  telefono?: string;
}