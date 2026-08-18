import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateDetalleCompraDto {
  @IsString()
  @IsNotEmpty()
  productoId!: string;

  @IsInt()
  @Min(1)
  cantidad!: number;

  // Opcional: si no llega se asume que costó lo mismo que la última vez,
  // o sea el precioCompra vigente del producto.
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  costo?: number;
}
