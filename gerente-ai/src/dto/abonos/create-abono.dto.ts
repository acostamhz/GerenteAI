import { IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';

export class CreateAbonoDto {
  @IsString()
  @IsNotEmpty()
  clienteId!: string;

  // Sin sedeId: se deriva de la sede del cliente. Aceptarlo del body permitiría
  // registrar el abono en una sede distinta a la del cliente que lo paga.
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  monto!: number;
}
