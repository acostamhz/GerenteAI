import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateDetalleVentaDto {
  @IsString()
  @IsNotEmpty()
  productoId!: string;

  @IsInt()
  @Min(1)
  cantidad!: number;

  // Opcional: si no llega se usa el precioVenta vigente del producto.
  // Se permite enviarlo para descuentos o precios negociados en el momento.
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  precio?: number;
}
