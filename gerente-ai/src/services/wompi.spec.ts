import { createHash } from 'crypto';
import {
  estadoDesdeWompi,
  eventoEsAutentico,
  firmaDeIntegridad,
  type EventoWompi,
} from './wompi';

const SECRETO = 'test_events_secreto';

/**
 * Se firma con `createHash` directo, sin reutilizar nada del código bajo prueba.
 * Si la prueba llamara a la misma función que valida, las dos podrían estar mal
 * de la misma forma y pasaría igual.
 */
function firmar(valores: string[], timestamp: number, secreto = SECRETO) {
  return createHash('sha256')
    .update(`${valores.join('')}${timestamp}${secreto}`, 'utf8')
    .digest('hex');
}

const PROPIEDADES = [
  'transaction.id',
  'transaction.status',
  'transaction.amount_in_cents',
];

function eventoValido(): EventoWompi {
  const transaction = {
    id: 'tx-1',
    reference: 'LUKA-abc',
    status: 'APPROVED',
    amount_in_cents: 7_990_000,
    currency: 'COP',
  };
  const timestamp = 1_700_000_000;

  return {
    data: { transaction },
    transaccion: transaction,
    timestamp,
    signature: {
      properties: PROPIEDADES,
      checksum: firmar(['tx-1', 'APPROVED', '7990000'], timestamp),
    },
  };
}

describe('firmaDeIntegridad', () => {
  it('concatena referencia, monto, moneda y secreto', () => {
    const esperado = createHash('sha256')
      .update('LUKA-abc7990000COPtest_integrity', 'utf8')
      .digest('hex');

    expect(
      firmaDeIntegridad('LUKA-abc', 7_990_000, 'COP', 'test_integrity'),
    ).toBe(esperado);
  });

  // Es la propiedad que sostiene todo: si el monto cambia en el navegador, la
  // firma deja de cuadrar y Wompi rechaza el cobro.
  it('cambia si cambia el monto', () => {
    const original = firmaDeIntegridad('LUKA-abc', 7_990_000, 'COP', 's');
    const alterada = firmaDeIntegridad('LUKA-abc', 100, 'COP', 's');

    expect(alterada).not.toBe(original);
  });

  it('cambia si cambia el secreto', () => {
    expect(firmaDeIntegridad('LUKA-abc', 7_990_000, 'COP', 'uno')).not.toBe(
      firmaDeIntegridad('LUKA-abc', 7_990_000, 'COP', 'otro'),
    );
  });
});

describe('eventoEsAutentico', () => {
  it('acepta un evento firmado con el secreto correcto', () => {
    expect(eventoEsAutentico(eventoValido(), SECRETO)).toBe(true);
  });

  it('acepta el checksum en mayúsculas', () => {
    const evento = eventoValido();
    evento.signature.checksum = evento.signature.checksum.toUpperCase();

    expect(eventoEsAutentico(evento, SECRETO)).toBe(true);
  });

  // El ataque directo: alguien copia un evento real y le sube el monto.
  it('rechaza un evento al que le cambiaron el monto', () => {
    const evento = eventoValido();
    evento.transaccion.amount_in_cents = 100;
    (
      evento.data as { transaction: { amount_in_cents: number } }
    ).transaction.amount_in_cents = 100;

    expect(eventoEsAutentico(evento, SECRETO)).toBe(false);
  });

  it('rechaza un evento al que le cambiaron el estado', () => {
    const evento = eventoValido();
    (evento.data as { transaction: { status: string } }).transaction.status =
      'APPROVED';
    evento.signature.checksum = firmar(
      ['tx-1', 'DECLINED', '7990000'],
      evento.timestamp,
    );

    expect(eventoEsAutentico(evento, SECRETO)).toBe(false);
  });

  // Sin conocer el secreto no se puede fabricar un evento válido, que es todo
  // el punto: si no, cualquiera se regalaría el plan con un curl.
  it('rechaza un evento firmado con otro secreto', () => {
    const evento = eventoValido();
    evento.signature.checksum = firmar(
      ['tx-1', 'APPROVED', '7990000'],
      evento.timestamp,
      'secreto-del-atacante',
    );

    expect(eventoEsAutentico(evento, SECRETO)).toBe(false);
  });

  it('rechaza si el timestamp no es el que se firmó', () => {
    const evento = eventoValido();
    evento.timestamp = evento.timestamp + 1;

    expect(eventoEsAutentico(evento, SECRETO)).toBe(false);
  });

  it('rechaza un checksum de longitud distinta sin reventar', () => {
    const evento = eventoValido();
    evento.signature.checksum = 'corto';

    expect(eventoEsAutentico(evento, SECRETO)).toBe(false);
  });

  /**
   * La firma se calcula sobre el `data` original, no sobre los campos que
   * copiamos. Si Wompi nombra una propiedad que hoy no leemos, la verificación
   * tiene que seguir funcionando.
   */
  it('firma sobre propiedades que no están entre las que usamos', () => {
    const transaction = {
      id: 'tx-2',
      reference: 'LUKA-xyz',
      status: 'APPROVED',
      amount_in_cents: 1_000,
      currency: 'COP',
      customer_email: 'quien@paga.com',
    };
    const timestamp = 1_700_000_500;

    const evento: EventoWompi = {
      data: { transaction },
      transaccion: transaction,
      timestamp,
      signature: {
        properties: ['transaction.id', 'transaction.customer_email'],
        checksum: firmar(['tx-2', 'quien@paga.com'], timestamp),
      },
    };

    expect(eventoEsAutentico(evento, SECRETO)).toBe(true);
  });
});

describe('estadoDesdeWompi', () => {
  it('traduce los estados conocidos', () => {
    expect(estadoDesdeWompi('APPROVED')).toBe('APROBADO');
    expect(estadoDesdeWompi('DECLINED')).toBe('RECHAZADO');
    expect(estadoDesdeWompi('VOIDED')).toBe('ANULADO');
    expect(estadoDesdeWompi('PENDING')).toBe('PENDIENTE');
  });

  // Ante un estado que no conocemos, lo seguro es no activar nada.
  it('trata un estado desconocido como error, nunca como aprobado', () => {
    expect(estadoDesdeWompi('LO_QUE_SEA')).toBe('ERROR');
    expect(estadoDesdeWompi('')).toBe('ERROR');
  });
});
