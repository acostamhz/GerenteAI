import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
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

  // Plazo del fiado, en días. Solo aplica a tipo FIADO; si no llega se usan 30.
  // Se pide en días y no como fecha para no arrastrar el lío de zonas horarias:
  // el tendero piensa en "me paga en 15 días", no en un instante UTC.
  @IsInt()
  @Min(1)
  @Max(365)
  @IsOptional()
  diasCredito?: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateDetalleVentaDto)
  detalles!: CreateDetalleVentaDto[];
}
