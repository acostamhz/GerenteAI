import { fechaColombiana, sumarDias } from './dia-colombia';

/**
 * El periodo contable de un negocio.
 *
 * No todos cierran el mes calendario. Hay negocios cuyo mes va del 21 al 20 del
 * mes siguiente, porque asi les cuadra con la nomina o con el pago a
 * proveedores. Si el sistema asume siempre del 1 al 30, sus reportes cortan por
 * donde no es y los totales no coinciden con su realidad.
 *
 * Aqui vive esa regla, una sola vez, para que la usen igual el chatbot y los
 * reportes del panel.
 */

/**
 * Dia en que arranca el periodo. Se limita a 28 para que exista en todos los
 * meses: un periodo que empezara el 30 no tendria fecha valida en febrero.
 */
export const DIA_INICIO_MINIMO = 1;
export const DIA_INICIO_MAXIMO = 28;

/** Por defecto, mes calendario: del 1 al ultimo dia. */
export const DIA_INICIO_POR_DEFECTO = 1;

export interface PeriodoContable {
  /** Primer dia del periodo, `YYYY-MM-DD`. */
  desde: string;
  /** Ultimo dia del periodo, inclusive. */
  hasta: string;
  /** El dia de corte configurado, para poder explicarlo en pantalla. */
  diaInicio: number;
}

/** Deja el dia de inicio dentro del rango valido. */
export function normalizarDiaInicio(dia: number | null | undefined): number {
  if (!Number.isFinite(dia)) return DIA_INICIO_POR_DEFECTO;

  const entero = Math.trunc(dia as number);
  if (entero < DIA_INICIO_MINIMO) return DIA_INICIO_MINIMO;
  if (entero > DIA_INICIO_MAXIMO) return DIA_INICIO_MAXIMO;
  return entero;
}

/**
 * El periodo contable al que pertenece una fecha.
 *
 * Con `diaInicio` 21 y la fecha 2026-09-05, el periodo es 21/08 a 20/09: el 5
 * de septiembre todavia pertenece al periodo que arranco en agosto. Con la
 * fecha 2026-09-25, el periodo ya es 21/09 a 20/10.
 *
 * Con `diaInicio` 1 devuelve el mes calendario, que es el caso normal.
 */
export function periodoContableDe(
  fecha: string,
  diaInicio: number,
): PeriodoContable {
  const inicio = normalizarDiaInicio(diaInicio);
  const [anio, mes, dia] = fecha.split('-').map(Number);

  // Si el dia de hoy todavia no llego al corte, el periodo arranco el mes
  // pasado. Es el caso de "hoy es 5 y mi mes empieza el 21".
  const empiezaEsteMes = dia >= inicio;
  const anioInicio = empiezaEsteMes ? anio : mes === 1 ? anio - 1 : anio;
  const mesInicio = empiezaEsteMes ? mes : mes === 1 ? 12 : mes - 1;

  const desde = `${anioInicio}-${dosDigitos(mesInicio)}-${dosDigitos(inicio)}`;

  // El periodo termina el dia antes del siguiente corte.
  const mesSiguiente = mesInicio === 12 ? 1 : mesInicio + 1;
  const anioSiguiente = mesInicio === 12 ? anioInicio + 1 : anioInicio;
  const siguienteCorte = `${anioSiguiente}-${dosDigitos(mesSiguiente)}-${dosDigitos(inicio)}`;

  return { desde, hasta: sumarDias(siguienteCorte, -1), diaInicio: inicio };
}

/** El periodo contable en curso, segun el dia colombiano de hoy. */
export function periodoContableActual(
  diaInicio: number,
  ahora: Date = new Date(),
): PeriodoContable {
  return periodoContableDe(fechaColombiana(ahora), diaInicio);
}

/**
 * Como se describe el periodo en pantalla.
 *
 * Con mes calendario no se dice nada especial; con un corte distinto si, porque
 * el usuario necesita saber que "este mes" no significa lo de siempre.
 */
export function describirPeriodo(periodo: PeriodoContable): string {
  return periodo.diaInicio === DIA_INICIO_POR_DEFECTO
    ? 'este mes'
    : `tu periodo (${periodo.desde} a ${periodo.hasta})`;
}

function dosDigitos(valor: number): string {
  return String(valor).padStart(2, '0');
}
