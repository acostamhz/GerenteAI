import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateUsuarioDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  nombre?: string;

  @IsString()
  @IsOptional()
  telefono?: string;
}
