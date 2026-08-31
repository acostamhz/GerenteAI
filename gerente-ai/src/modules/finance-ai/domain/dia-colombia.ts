/**
 * El dia colombiano, con una sola definicion.
 *
 * Antes habia dos, y no coincidian: `isoDate()` armaba la fecha con los
 * componentes LOCALES del contenedor y `dateRange()` la interpretaba como UTC.
 * Con TZ=America/Bogota —que es como corre en produccion— eso hacia que un gasto
 * registrado a las 11 p.m. cayera fuera del rango de "hoy", porque en UTC ya era
 * el dia siguiente. El sintoma: el bot confirmaba el gasto y medio minuto
 * despues respondia que no encontraba nada.
 *
 * El desfase se fija aqui en vez de depender de la TZ del contenedor. Asi la
 * respuesta es la misma en Render, en Railway y en la maquina de cualquiera, y
 * deja de haber una variable de entorno cuyo olvido rompe las cuentas en
 * silencio.
 *
 * Colombia no tiene horario de verano, asi que un desfase fijo es correcto todo
 * el año. Si algun dia se opera en otro pais, esto es lo que habria que hacer
 * variable por negocio.
 */

const OFFSET_HORAS = -5;
const UNA_HORA_MS = 3_600_000;

/**
 * El mismo instante corrido, para poder leer los componentes colombianos con
 * los getters `getUTC*`. No es una fecha valida por si sola: es un intermedio.
 */
function enColombia(instante: Date): Date {
  return new Date(instante.getTime() + OFFSET_HORAS * UNA_HORA_MS);
}

/** `YYYY-MM-DD` del dia colombiano al que pertenece ese instante. */
export function fechaColombiana(instante: Date): string {
  return enColombia(instante).toISOString().slice(0, 10);
}

/** Instante UTC en que empieza ese dia colombiano (00:00 en Bogota). */
export function inicioDelDia(fecha: string): Date {
  return new Date(
    new Date(`${fecha}T00:00:00.000Z`).getTime() - OFFSET_HORAS * UNA_HORA_MS,
  );
}

/** Instante UTC en que termina ese dia colombiano (23:59:59.999 en Bogota). */
export function finDelDia(fecha: string): Date {
  return new Date(
    new Date(`${fecha}T23:59:59.999Z`).getTime() - OFFSET_HORAS * UNA_HORA_MS,
  );
}

/**
 * Componentes del dia colombiano de un instante, para construir periodos.
 *
 * Se devuelven ya resueltos en vez de exponer el `Date` corrido, porque ese
 * intermedio es facil de usar mal: sus getters locales darian otra cosa.
 */
export function partesDelDia(instante: Date): {
  fecha: string;
  /** 0 = domingo, como `Date.getDay()`. */
  diaDeLaSemana: number;
  /** `YYYY-MM-01` del mes al que pertenece. */
  primeroDelMes: string;
} {
  const local = enColombia(instante);
  const fecha = local.toISOString().slice(0, 10);

  return {
    fecha,
    diaDeLaSemana: local.getUTCDay(),
    primeroDelMes: `${fecha.slice(0, 7)}-01`,
  };
}

/** Suma o resta dias a una fecha `YYYY-MM-DD`, sin tocar husos. */
export function sumarDias(fecha: string, dias: number): string {
  const movida = new Date(`${fecha}T00:00:00.000Z`);
  movida.setUTCDate(movida.getUTCDate() + dias);
  return movida.toISOString().slice(0, 10);
}
