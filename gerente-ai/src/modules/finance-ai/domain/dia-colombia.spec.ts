import {
  fechaColombiana,
  finDelDia,
  inicioDelDia,
  partesDelDia,
  sumarDias,
} from './dia-colombia';

/**
 * El caso real que originó esto: Angélica registró un gasto a las 11:08 p.m. del
 * 30 de agosto y medio minuto después Luka respondió que no encontraba nada.
 *
 * En UTC ese instante ya era el 31, así que al cortar "hoy" en el 30 el gasto
 * quedaba del otro lado. Estas pruebas fijan que el día sea el colombiano.
 */
const GASTO_DE_LAS_11PM = new Date('2026-08-31T04:08:20.185Z');

describe('fechaColombiana', () => {
  it('un gasto de las 11 p.m. pertenece a ese día, no al siguiente', () => {
    expect(fechaColombiana(GASTO_DE_LAS_11PM)).toBe('2026-08-30');
  });

  it('a la medianoche colombiana ya cambia el día', () => {
    expect(fechaColombiana(new Date('2026-08-31T04:59:59.999Z'))).toBe(
      '2026-08-30',
    );
    expect(fechaColombiana(new Date('2026-08-31T05:00:00.000Z'))).toBe(
      '2026-08-31',
    );
  });

  /**
   * El desfase está fijo en el código y no se toma del contenedor. Si dependiera
   * de la TZ del proceso, la respuesta cambiaría según dónde corriera, que es
   * justo el fallo que se está corrigiendo.
   */
  it('da lo mismo con cualquier TZ del proceso', () => {
    const original = process.env.TZ;
    const resultados: string[] = [];

    for (const tz of ['UTC', 'America/Bogota', 'Asia/Tokyo']) {
      process.env.TZ = tz;
      resultados.push(fechaColombiana(GASTO_DE_LAS_11PM));
    }

    process.env.TZ = original;
    expect(new Set(resultados).size).toBe(1);
    expect(resultados[0]).toBe('2026-08-30');
  });
});

describe('límites del día', () => {
  it('el día colombiano va de las 05:00Z a las 04:59Z del siguiente', () => {
    expect(inicioDelDia('2026-08-30').toISOString()).toBe(
      '2026-08-30T05:00:00.000Z',
    );
    expect(finDelDia('2026-08-30').toISOString()).toBe(
      '2026-08-31T04:59:59.999Z',
    );
  });

  // La regresión concreta: con el corte viejo (23:59:59.999Z del día 30) este
  // gasto quedaba fuera y el bot respondía que no existía.
  it('un gasto de las 11 p.m. cae dentro de su propio día', () => {
    const desde = inicioDelDia('2026-08-30');
    const hasta = finDelDia('2026-08-30');

    expect(GASTO_DE_LAS_11PM >= desde).toBe(true);
    expect(GASTO_DE_LAS_11PM <= hasta).toBe(true);
  });

  it('un rango de varios días cubre de punta a punta', () => {
    expect(inicioDelDia('2026-04-02').toISOString()).toBe(
      '2026-04-02T05:00:00.000Z',
    );
    expect(finDelDia('2026-08-30') > inicioDelDia('2026-04-02')).toBe(true);
  });
});

describe('partesDelDia', () => {
  it('resuelve fecha, día de la semana y primero de mes en hora colombiana', () => {
    // 30 de agosto de 2026 fue domingo.
    expect(partesDelDia(GASTO_DE_LAS_11PM)).toEqual({
      fecha: '2026-08-30',
      diaDeLaSemana: 0,
      primeroDelMes: '2026-08-01',
    });
  });

  // A las 11 p.m. del último día del mes, el mes todavía no cambió.
  it('no adelanta el mes por el desfase', () => {
    expect(partesDelDia(new Date('2026-09-01T03:00:00.000Z'))).toMatchObject({
      fecha: '2026-08-31',
      primeroDelMes: '2026-08-01',
    });
  });
});

describe('sumarDias', () => {
  it('retrocede la ventana de búsqueda sin desviarse', () => {
    expect(sumarDias('2026-08-01', -120)).toBe('2026-04-03');
  });

  it('cruza fin de mes y fin de año', () => {
    expect(sumarDias('2026-03-01', -1)).toBe('2026-02-28');
    expect(sumarDias('2026-01-01', -1)).toBe('2025-12-31');
  });
});
