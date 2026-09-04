import { IsString, Length } from 'class-validator';

/**
 * Lo que n8n reporta despues de enviarle a Meta la respuesta de Luka.
 *
 * Existe porque el envio no lo hace el backend: la respuesta se calcula aqui,
 * pero quien la manda es el workflow, y el `wamid` con el que Meta la acepta
 * solo lo conoce el. Sin ese id, cuando alguien responde citando un mensaje de
 * Luka, llega un wamid que no esta en ninguna parte y la cita se pierde.
 *
 * Va en una llamada aparte a proposito: ocurre despues de haberle contestado al
 * usuario, y el no tiene por que esperarla.
 */
export class RegistrarEnvioDto {
  /** El `meta.assistantMessageId` que devolvio `POST /ai/interpret`. */
  @IsString()
  @Length(1, 100)
  mensajeId!: string;

  /** El id que devolvio Meta al aceptar el envio. */
  @IsString()
  @Length(1, 200)
  wamid!: string;
}
