/**
 * Enlace para abrir la conversación con Luka en WhatsApp.
 *
 * El número sale de `VITE_WHATSAPP_NUMBER`. **En Vercel hay que definirla con el
 * número de producción de la empresa**: el valor por defecto es el número de
 * pruebas de Meta, que solo puede escribirle a los destinatarios autorizados en
 * el panel de desarrolladores.
 */
const NUMERO_POR_DEFECTO = '573043904488';

export function lukaWhatsappUrl(mensaje = 'Hola'): string {
  // wa.me exige el número en formato internacional y solo dígitos.
  const numero = (
    (import.meta.env.VITE_WHATSAPP_NUMBER as string | undefined) || NUMERO_POR_DEFECTO
  ).replace(/\D/g, '');

  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
}
