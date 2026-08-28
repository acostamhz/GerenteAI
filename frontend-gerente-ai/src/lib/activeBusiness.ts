import { apiClient } from '@/lib/apiClient';

interface Sede {
  id: string;
  nombre: string;
  negocioId: string;
}

/**
 * Traduce el negocio activo a la SEDE que entiende el módulo de IA.
 */
export async function resolveActiveSedeId(): Promise<string | null> {
  const cacheada = localStorage.getItem('active_sede_id');
  if (cacheada && cacheada !== 'all') return cacheada;

  const negocioId = localStorage.getItem('active_business_id');
  if (!negocioId) return null;

  const sedes = await apiClient<Sede[]>(`/sedes?negocioId=${negocioId}`);
  const primera = sedes?.[0];
  if (!primera) return null;

  localStorage.setItem('active_sede_id', primera.id);
  localStorage.setItem('active_sede_name', primera.nombre);
  return primera.id;
}

export function setActiveSede(sedeId: string, sedeName: string): void {
  localStorage.setItem('active_sede_id', sedeId);
  localStorage.setItem('active_sede_name', sedeName);
  window.dispatchEvent(new Event('sede_changed'));
}

/** Al cambiar de negocio la sede cacheada deja de valer. */
export function clearActiveSede(): void {
  localStorage.removeItem('active_sede_id');
  localStorage.removeItem('active_sede_name');
  window.dispatchEvent(new Event('sede_changed'));
}

const RANDOM_USERNAMES = [
  'cafecentral',
  'lucas_restobar',
  'tienda_don_pepe',
  'hamburguesas_virrey',
  'maria_ventas',
  'drogueria_salud',
  'panaderia_norte',
  'super_la_esquina',
  'boutique_moda',
];

export function getRandomUsernamePlaceholder(): string {
  const randomIndex = Math.floor(Math.random() * RANDOM_USERNAMES.length);
  return RANDOM_USERNAMES[randomIndex];
}
