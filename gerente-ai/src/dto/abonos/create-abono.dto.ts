import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class CreateAbonoDto {
  @IsString()
  @IsNotEmpty()
  clienteId!: string;

  // Opcional: la venta que se está pagando. Si no llega, el abono se aplica a
  // las deudas más antiguas del cliente, que es lo habitual cuando abona "a la
  // cuenta" sin decir a cuál.
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  ventaId?: string;

  // Sin sedeId: se deriva de la sede del cliente. Aceptarlo del body permitiría
  // registrar el abono en una sede distinta a la del cliente que lo paga.
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  monto!: number;
}
