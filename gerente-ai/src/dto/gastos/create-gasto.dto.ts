import { IsEnum, IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';
import { CategoriaGasto } from '@prisma/client';

export class CreateGastoDto {
  @IsString()
  @IsNotEmpty()
  descripcion!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  monto!: number;

  @IsEnum(CategoriaGasto)
  categoria!: CategoriaGasto;

  @IsString()
  @IsNotEmpty()
  sedeId!: string;
}