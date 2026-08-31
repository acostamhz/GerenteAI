import { apiClient } from '@/lib/apiClient';
import type { CicloFacturacion } from '@/shared/api/planesApi';

/**
 * Conexión real con la pasarela, contra los endpoints de `/pagos` del backend.
 *
 * Convive con la simulación de `wompiService`: mientras `USE_MOCK_GATEWAY` esté
 * en `true`, nada de esto se ejecuta.
 */

export type EstadoPago =
  | 'PENDIENTE'
  | 'APROBADO'
  | 'RECHAZADO'
  | 'ANULADO'
  | 'ERROR';

/** Lo que devuelve el backend al preparar un cobro. */
export interface DatosDeCheckout {
  referencia: string;
  montoEnCentavos: number;
  moneda: string;
  /** La calcula el servidor con un secreto. Wompi la revalida. */
  firmaDeIntegridad: string;
  llavePublica: string;
  plan: { id: number; nombre: string };
  ciclo: CicloFacturacion;
}

export interface Pago {
  id: string;
  referencia: string;
  estado: EstadoPago;
  plan: number;
  ciclo: 'MENSUAL' | 'ANUAL';
  montoEnCentavos: number;
  moneda: string;
  wompiTransaccionId: string | null;
  procesadoEl: string | null;
  createdAt: string;
}

/**
 * Pide el cobro al backend.
 *
 * El monto NO se manda: lo pone el servidor desde su catálogo. Si viajara desde
 * aquí, bastaría con editarlo en las herramientas del navegador para pagar mil
 * pesos por el plan más caro.
 */
export function crearCheckout(
  negocioId: string,
  plan: number,
  ciclo: CicloFacturacion,
): Promise<DatosDeCheckout> {
  return apiClient<DatosDeCheckout>('/pagos/checkout', {
    method: 'POST',
    body: JSON.stringify({ negocioId, plan, ciclo }),
  });
}

export function consultarPago(referencia: string): Promise<Pago> {
  return apiClient<Pago>(`/pagos/${referencia}`);
}

export function historialDePagos(negocioId: string): Promise<Pago[]> {
  return apiClient<Pago[]>(`/pagos?negocioId=${encodeURIComponent(negocioId)}`);
}

/**
 * Arma el enlace del checkout alojado de Wompi.
 *
 * Se redirige a Wompi en vez de cobrar desde aquí porque así los datos de la
 * tarjeta nunca pasan por nuestros servidores. Recogerlos nosotros nos metería
 * en el alcance de PCI-DSS, que es una obligación con auditoría que un equipo
 * de este tamaño no puede sostener.
 *
 * `redirect-url` lleva nuestra referencia porque Wompi devuelve la suya
 * (`?id=<transacción>`), y la pantalla de resultado necesita la nuestra para
 * preguntarle al backend.
 */
export function urlDelCheckout(datos: DatosDeCheckout): string {
  const base =
    import.meta.env.VITE_WOMPI_CHECKOUT_URL || 'https://checkout.wompi.co/p/';

  const redireccion = `${window.location.origin}/pago/resultado?ref=${encodeURIComponent(datos.referencia)}`;

  const parametros = new URLSearchParams({
    'public-key': datos.llavePublica,
    currency: datos.moneda,
    'amount-in-cents': String(datos.montoEnCentavos),
    reference: datos.referencia,
    'signature:integrity': datos.firmaDeIntegridad,
    'redirect-url': redireccion,
  });

  return `${base}?${parametros.toString()}`;
}

/**
 * Pide el cobro y manda a la persona a pagarlo.
 *
 * No devuelve nada porque el navegador se va: lo que pase después se recoge en
 * `/pago/resultado`.
 */
export async function iniciarPago(
  negocioId: string,
  plan: number,
  ciclo: CicloFacturacion,
): Promise<never> {
  const datos = await crearCheckout(negocioId, plan, ciclo);
  window.location.href = urlDelCheckout(datos);

  // La redirección no es instantánea; esta promesa nunca resuelve a propósito,
  // para que quien llame no siga ejecutando código mientras el navegador se va.
  return new Promise<never>(() => {});
}

/**
 * Espera a que el backend confirme el cobro.
 *
 * Hay que preguntar, no asumir: el plan lo activa el aviso que Wompi le manda al
 * servidor, no la vuelta del navegador. Los dos van por caminos distintos y el
 * aviso puede llegar antes o después de que la persona regrese.
 *
 * Si el servicio del backend estaba dormido, despertarlo tarda casi un minuto,
 * así que se insiste un rato antes de rendirse.
 */
export async function esperarResultado(
  referencia: string,
  opciones: { intentos?: number; esperaMs?: number } = {},
): Promise<Pago> {
  const { intentos = 20, esperaMs = 3000 } = opciones;

  let ultimo = await consultarPago(referencia);

  for (let i = 0; i < intentos && ultimo.estado === 'PENDIENTE'; i++) {
    await new Promise((seguir) => setTimeout(seguir, esperaMs));
    ultimo = await consultarPago(referencia);
  }

  return ultimo;
}
