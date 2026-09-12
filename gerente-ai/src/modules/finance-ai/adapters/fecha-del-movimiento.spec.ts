import { fechaDelMovimiento } from './prisma-finance-data.adapter';
import { fechaColombiana } from '../domain/dia-colombia';
import type { Transaction } from '../domain/finance.types';

/**
 * Con que instante se guarda un movimiento.
 *
 * El error que estas pruebas fijan: todo lo que entraba por WhatsApp se
 * guardaba al mediodia UTC, o sea las 7:00 a. m. en Colombia. Un gasto de las
 * 5:55 p. m. se mostraba a las 7 de la manana, y como todos los movimientos
 * del dia compartian el mismo instante, la lista de "ultimos movimientos" los
 * ordenaba al azar.
 */

function movimiento(parcial: Partial<Transaction> = {}): Transaction {
  return {
    id: 'm1',
    businessId: 'b1',
    date: '2026-09-02',
    description: 'Licuadora',
    category: 'equipo',
    amount: 120_000,
    type: 'investment',
    currency: 'COP',
    source: 'whatsapp',
    createdAt: '2026-09-02T22:55:00.000Z',
    ...parcial,
  };
}

describe('fechaDelMovimiento', () => {
  it('sin fecha dicha, guarda la hora real del mensaje', () => {
    // 22:55 UTC = 5:55 p. m. en Colombia, que es cuando de verdad pasó.
    const fecha = fechaDelMovimiento(
      movimiento({ occurredAt: '2026-09-02T22:55:00.000Z' }),
    );

    expect(fecha.toISOString()).toBe('2026-09-02T22:55:00.000Z');
  });

  it('con fecha dicha por el usuario, usa el mediodía UTC', () => {
    // "El 23 de agosto vendí una cama": no hay hora que registrar, y el
    // mediodía es la única hora que no corre el día en ninguna zona horaria.
    const fecha = fechaDelMovimiento(
      movimiento({ date: '2026-08-23', occurredAt: null }),
    );

    expect(fecha.toISOString()).toBe('2026-08-23T12:00:00.000Z');
  });

  it('un movimiento de la noche sigue perteneciendo a su día colombiano', () => {
    // 11:30 p. m. del 2 en Bogotá ya es el 3 en UTC. Lo que el usuario ve
    // tiene que seguir siendo el 2, o los reportes por día se descuadran.
    const fecha = fechaDelMovimiento(
      movimiento({
        date: '2026-09-02',
        occurredAt: '2026-09-03T04:30:00.000Z',
      }),
    );

    expect(fechaColombiana(fecha)).toBe('2026-09-02');
  });

  it('dos movimientos del mismo día conservan su orden', () => {
    // Antes compartían instante y no había forma de saber cuál fue primero.
    const fiado = fechaDelMovimiento(
      movimiento({ occurredAt: '2026-09-02T15:00:00.000Z' }),
    );
    const abono = fechaDelMovimiento(
      movimiento({ occurredAt: '2026-09-02T22:55:00.000Z' }),
    );

    expect(fiado.getTime()).toBeLessThan(abono.getTime());
  });

  it('un instante corrupto no rompe el registro: cae al mediodía', () => {
    const fecha = fechaDelMovimiento(
      movimiento({ occurredAt: 'no es una fecha' }),
    );

    expect(fecha.toISOString()).toBe('2026-09-02T12:00:00.000Z');
  });
});
