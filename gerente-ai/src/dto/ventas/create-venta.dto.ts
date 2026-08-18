import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { TipoVenta } from '@prisma/client';
import { CreateDetalleVentaDto } from './create-detalle-venta.dto';

export class CreateVentaDto {
  @IsString()
  @IsNotEmpty()
  sedeId!: string;

  @IsEnum(TipoVenta)
  @IsOptional()
  tipo?: TipoVenta;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  clienteId?: string;

  // Si llega, se compara contra el total calculado en el servidor y se rechaza si no cuadra.
  // Sirve de red de seguridad cuando quien arma la venta es la capa de IA.
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  total?: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateDetalleVentaDto)
  detalles!: CreateDetalleVentaDto[];
}
