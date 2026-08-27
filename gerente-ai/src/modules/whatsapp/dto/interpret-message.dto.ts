import {
  IsBoolean,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';

/**
 * Contrato de entrada de n8n.
 *
 * IMPORTANTE: el backend corre con `ValidationPipe({ forbidNonWhitelisted: true })`,
 * asi que un campo que no este declarado aqui hace que la peticion falle con 400.
 * Si n8n empieza a mandar un dato nuevo, primero se agrega en este DTO.
 */
export class InterpretMessageDto {
  /** Texto tal cual lo escribio el usuario en WhatsApp. */
  @IsString()
  @Length(1, 2_000, {
    message: 'El mensaje debe tener entre 1 y 2000 caracteres.',
  })
  message!: string;

  /**
   * Numero del remitente en formato internacional sin "+", como lo entrega
   * Meta en `entry[0].changes[0].value.messages[0].from`.
   */
  @IsString()
  @Matches(/^\+?\d{7,20}$/, {
    message:
      'phone debe ser un numero internacional (solo digitos, sin espacios).',
  })
  phone!: string;

  /** Nombre del perfil de WhatsApp. Solo se usa para el saludo y los logs. */
  @IsOptional()
  @IsString()
  @Length(1, 120)
  name?: string;

  /** Hilo de conversacion. Hoy n8n manda el mismo telefono; se acepta cualquiera. */
  @IsOptional()
  @IsString()
  @Length(1, 120)
  conversationId?: string;

  /**
   * `wamid` del mensaje de WhatsApp. Meta reintenta el webhook cuando no recibe
   * 200 a tiempo: con este id se descarta el duplicado y no se registra el gasto
   * dos veces. Muy recomendable enviarlo.
   */
  @IsOptional()
  @IsString()
  @Length(1, 200)
  messageId?: string;

  /**
   * Permite forzar el modo "solo interpretar, no guardar" desde n8n (pruebas).
   * Por defecto se guarda: el bot existe para registrar.
   */
  @IsOptional()
  @IsBoolean()
  persist?: boolean;
}
