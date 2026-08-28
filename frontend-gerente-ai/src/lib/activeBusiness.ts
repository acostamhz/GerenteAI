import { apiClient } from '@/lib/apiClient';

interface Sede {
  id: string;
  nombre: string;
  negocioId: string;
}

/**
 * Traduce el negocio activo a la SEDE que entiende el módulo de IA.
 *
 * Las dos partes llaman "business" a cosas distintas y por eso hace falta esto:
 *
 *   frontend  `active_business_id`  ->  Negocio.id
 *   /ai/*     `businessId`          ->  Sede.id
 *
 * El módulo de IA se apoya en la sede porque Gasto, Venta y Compra cuelgan de
 * ella. Mandar un negocio donde se espera una sede no da error: devuelve un
 * negocio sin movimientos, que es peor, porque parece que el cliente no tuviera
 * datos y nadie sospecha del identificador.
 *
 * Se cachea en `localStorage` para no consultar sedes en cada pantalla.
 */
export async function resolveActiveSedeId(): Promise<string | null> {
  const cacheada = localStorage.getItem('active_sede_id');
  if (cacheada) return cacheada;

  const negocioId = localStorage.getItem('active_business_id');
  if (!negocioId) return null;

  const sedes = await apiClient<Sede[]>(`/sedes?negocioId=${negocioId}`);
  const primera = sedes?.[0];
  if (!primera) return null;

  localStorage.setItem('active_sede_id', primera.id);
  return primera.id;
}

/** Al cambiar de negocio la sede cacheada deja de valer. */
export function clearActiveSede(): void {
  localStorage.removeItem('active_sede_id');
}
