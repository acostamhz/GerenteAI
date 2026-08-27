import { IsNotEmpty, IsString } from 'class-validator';

export class AsociarNegocioDto {
  // A quién se vincula. Antes se tomaba del token (auto-vinculación), lo que permitía
  // que cualquier usuario se hiciera dueño de un negocio ajeno con solo saber su id.
  @IsString()
  @IsNotEmpty()
  usuarioId!: string;

  @IsString()
  @IsNotEmpty()
  negocioId!: string;
}
