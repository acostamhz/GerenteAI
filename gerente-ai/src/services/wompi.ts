import { createHash, timingSafeEqual } from 'crypto';

/**
 * Criptografía de Wompi, aislada del resto para poder probarla sin base de datos
 * ni servidor. Son las dos piezas que sostienen toda la pasarela:
 *
 * - la firma de integridad impide que alguien altere el monto en el navegador;
 * - la firma del evento impide que alguien invente un "ya pagó" contra nuestro
 *   webhook.
 *
 * Sin ellas, el resto del flujo es decoración.
 */

/**
 * Firma que viaja al checkout junto al cobro.
 *
 * Wompi la recalcula con el mismo secreto al recibir la petición: si el monto,
 * la referencia o la moneda cambiaron por el camino, no coincide y rechaza el
 * pago. El secreto nunca sale del servidor, así que el navegador no puede
 * producir una firma válida para un monto distinto.
 */
export function firmaDeIntegridad(
  referencia: string,
  montoEnCentavos: number,
  moneda: string,
  secreto: string,
): string {
  return sha256(`${referencia}${montoEnCentavos}${moneda}${secreto}`);
}

/** Un evento de Wompi, con lo mínimo que necesitamos para confiar en él. */
export interface EventoWompi {
  /**
   * El objeto `data` tal como llegó, sin recortar. La firma se calcula sobre él
   * y no sobre una copia con los campos que hoy nos interesan: si Wompi nombra
   * en `properties` una propiedad que no hubiéramos copiado, se firmaría sobre
   * una cadena vacía y el evento legítimo se rechazaría.
   */
  data: unknown;
  /** Los campos que sí usamos, ya comprobados. */
  transaccion: TransaccionWompi;
  timestamp: number;
  signature: { properties: string[]; checksum: string };
}

export interface TransaccionWompi {
  id: string;
  reference: string;
  status: string;
  amount_in_cents: number;
  currency: string;
}

/**
 * Comprueba que el evento lo mandó Wompi y no alguien más.
 *
 * El checksum se arma concatenando los valores de las propiedades que el propio
 * evento nombra en `signature.properties`, más el timestamp y el secreto de
 * eventos. Se usan las rutas que trae el evento —y no una lista fija nuestra—
 * porque es así como Wompi lo documenta y como puede ampliarlo sin rompernos.
 */
export function eventoEsAutentico(evento: EventoWompi, secreto: string) {
  const valores = evento.signature.properties
    .map((ruta) => valorEn(evento.data, ruta))
    .join('');

  const esperado = sha256(`${valores}${evento.timestamp}${secreto}`);

  return comparacionSegura(esperado, evento.signature.checksum);
}

/** Resuelve `"transaction.amount_in_cents"` contra el objeto `data`. */
function valorEn(data: unknown, ruta: string): string {
  let actual: unknown = data;

  for (const tramo of ruta.split('.')) {
    if (typeof actual !== 'object' || actual === null) return '';
    actual = (actual as Record<string, unknown>)[tramo];
  }

  // Solo valores simples: las propiedades que Wompi firma son escalares, y un
  // objeto se convertiría en "[object Object]", que casaría con cualquier cosa.
  if (
    typeof actual === 'string' ||
    typeof actual === 'number' ||
    typeof actual === 'boolean'
  ) {
    return String(actual);
  }
  return '';
}

function sha256(texto: string): string {
  return createHash('sha256').update(texto, 'utf8').digest('hex');
}

/**
 * Comparar con `===` filtraría información por el tiempo que tarda: al cortar en
 * el primer carácter distinto, se podría ir adivinando el checksum byte a byte.
 * `timingSafeEqual` tarda lo mismo siempre.
 */
function comparacionSegura(a: string, b: string): boolean {
  const bufferA = Buffer.from(a.toLowerCase(), 'utf8');
  const bufferB = Buffer.from(b.toLowerCase(), 'utf8');

  // timingSafeEqual exige longitudes iguales; distinta longitud ya es un no.
  if (bufferA.length !== bufferB.length) return false;

  return timingSafeEqual(bufferA, bufferB);
}

/**
 * Traduce el estado de Wompi al nuestro. Un estado desconocido se trata como
 * ERROR y no como aprobado: ante la duda, no se activa nada.
 */
export function estadoDesdeWompi(
  status: string,
): 'APROBADO' | 'RECHAZADO' | 'ANULADO' | 'ERROR' | 'PENDIENTE' {
  switch (status) {
    case 'APPROVED':
      return 'APROBADO';
    case 'DECLINED':
      return 'RECHAZADO';
    case 'VOIDED':
      return 'ANULADO';
    case 'PENDING':
      return 'PENDIENTE';
    default:
      return 'ERROR';
  }
}
