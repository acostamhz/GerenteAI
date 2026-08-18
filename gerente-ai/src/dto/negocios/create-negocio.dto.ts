import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class CreateNegocioDto {
  @IsString()
  @IsNotEmpty()
  nombre!: string;

  // Contacto administrativo del negocio. La línea que atiende el bot vive en Sede.telefono,
  // porque cada sede tiene su propio WhatsApp.
  @IsString()
  @IsOptional()
  @Matches(/^\+?[1-9]\d{6,14}$/, {
    message:
      'telefonoContacto debe ser un número válido en formato internacional',
  })
  telefonoContacto?: string;

  @IsString()
  @IsOptional()
  @Matches(/^\+?[1-9]\d{6,14}$/, {
    message:
      'telefonoSecundario debe ser un número válido en formato internacional',
  })
  telefonoSecundario?: string;

  @IsString()
  @IsOptional()
  contexto?: string;
}
