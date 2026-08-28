import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class CreateSedeDto {
  @IsString()
  @IsNotEmpty()
  nombre!: string;

  // Línea de WhatsApp que atiende el bot en esta sede. Es única en todo el sistema:
  // es la llave con la que se sabe de qué sede viene un mensaje entrante.
  @IsString()
  @IsOptional()
  @Matches(/^\+?[1-9]\d{6,14}$/, {
    message: 'telefono debe ser un número válido en formato internacional',
  })
  telefono?: string;

  // Nombre de usuario de WhatsApp del duenno ("jdar0423"). Sirve para las
  // cuentas que activaron esa opcion en WhatsApp: Meta oculta su telefono, asi
  // que es la unica forma de que el bot sepa quien escribe. Tambien es unico.
  @IsString()
  @IsOptional()
  @Matches(/^[a-zA-Z0-9._-]{3,30}$/, {
    message:
      'whatsappUsername solo admite letras, numeros, punto, guion y guion bajo',
  })
  whatsappUsername?: string;

  @IsString()
  @IsOptional()
  direccion?: string;

  @IsString()
  @IsOptional()
  contexto?: string;

  @IsString()
  @IsNotEmpty()
  negocioId!: string;
}
