import { PlanesService } from '../../../services/planes.service';
import type { PrismaService } from '../../../services/prisma.service';
import {
  WhatsappRoutingService,
  normalizePhone,
} from './whatsapp-routing.service';

/**
 * El enrutamiento es la pieza que se rompio cuando el esquema paso de
 * `Negocio.telefono` a `Sede.telefono`, y la que daba la cuota equivocada
 * cuando el plan paso de `Usuario` a `Negocio`. Estas pruebas fijan las dos
 * cosas: se busca por sede, y la cuota sale del plan del negocio.
 */
function fakePrisma(sedes: unknown[]) {
  const sede = {
    findFirst: jest.fn(
      ({
        where,
      }: {
        where: { telefono?: unknown; whatsappUserId?: string };
      }) => {
        if (where.whatsappUserId !== undefined) {
          const match = sedes.find(
            (fila) =>
              (fila as { whatsappUserId?: string }).whatsappUserId ===
              where.whatsappUserId,
          );
          return Promise.resolve(match ?? null);
        }

        const criterio = where.telefono;
        const match = sedes.find((fila) => {
          const telefono = (fila as { telefono: string | null }).telefono;
          if (!telefono) return false;
          return typeof criterio === 'string'
            ? telefono === criterio
            : telefono.endsWith((criterio as { endsWith: string }).endsWith);
        });
        return Promise.resolve(match ?? null);
      },
    ),
  };

  const usuario = { findFirst: jest.fn(() => Promise.resolve(null)) };

  return { sede, usuario } as unknown as PrismaService;
}

function sedeCon(plan: number, planVenceEl: Date | null = null) {
  return {
    id: 'sede-1',
    nombre: 'Sede principal',
    telefono: '573001234567',
    whatsappUserId: null as string | null,
    contexto: null,
    negocio: {
      id: 'negocio-1',
      nombre: 'Panadería El Virrey',
      contexto: null,
      plan,
      planVenceEl,
      // Se deja a proposito en 1 (gratuito): si el codigo volviera a leer el
      // plan del usuario, estas pruebas lo delatan.
      usuariosNegocio: [{ usuario: { plan: 1 } }],
    },
  };
}

function servicio(sedes: unknown[]) {
  return new WhatsappRoutingService(fakePrisma(sedes), new PlanesService());
}

const EN_UN_MES = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
const HACE_UN_MES = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

describe('WhatsappRoutingService', () => {
  it('resuelve la sede por su línea de WhatsApp', async () => {
    const contexto = await servicio([sedeCon(1)]).resolve('573001234567');

    expect(contexto).toMatchObject({
      sedeId: 'sede-1',
      negocioId: 'negocio-1',
      negocioNombre: 'Panadería El Virrey',
      currency: 'COP',
    });
  });

  it('tolera prefijos distintos comparando los últimos 10 dígitos', async () => {
    // Meta puede entregar el mismo número con o sin el 57, o con un 1 extra
    // (caso mexicano 52 vs 521). No puede quedar sin resolver por eso.
    const contexto = await servicio([sedeCon(1)]).resolve('+57 300 123 4567');

    expect(contexto?.sedeId).toBe('sede-1');
  });

  it('devuelve null si el número no pertenece a ninguna sede ni usuario', async () => {
    const contexto = await servicio([sedeCon(1)]).resolve('573999999999');

    expect(contexto).toBeNull();
  });

  // ------------------------------------------------------------------ plan

  it('toma la cuota del plan del NEGOCIO, no del usuario', async () => {
    // Es el bug que dejaba en 50 mensajes/mes a clientes que pagaron por 500:
    // el negocio es Gerente aunque su usuario siga en 1.
    const contexto = await servicio([sedeCon(2)]).resolve('573001234567');

    expect(contexto?.plan).toBe('gerente');
  });

  it('mapea cada plan comercial a su cuota de IA', async () => {
    const casos: [number, string][] = [
      [1, 'asistente'],
      [2, 'gerente'],
      [3, 'director'], // "Administrador" en el catálogo comercial
      [4, 'corporativo'], // "Socio"
    ];

    for (const [plan, esperado] of casos) {
      const contexto = await servicio([sedeCon(plan, EN_UN_MES)]).resolve(
        '573001234567',
      );
      expect(contexto?.plan).toBe(esperado);
    }
  });

  it('un plan vencido cae al gratuito', async () => {
    // Mismo criterio que el resto del backend: vence y se cae a Asistente,
    // no se bloquea al negocio.
    const contexto = await servicio([sedeCon(3, HACE_UN_MES)]).resolve(
      '573001234567',
    );

    expect(contexto?.plan).toBe('asistente');
  });

  it('un plan pago vigente conserva su cuota', async () => {
    const contexto = await servicio([sedeCon(3, EN_UN_MES)]).resolve(
      '573001234567',
    );

    expect(contexto?.plan).toBe('director');
  });

  // ------------------------------------------------- identidad de WhatsApp

  it('resuelve por identidad cuando Meta oculta el teléfono', () => {
    // Las cuentas con nombre de usuario llegan sin "from": solo con user_id.
    // Antes caian en "no registrado" aunque su sede existiera.
    const sede = {
      ...sedeCon(2),
      telefono: null,
      whatsappUserId: 'CO.1710763673557397',
    };

    return expect(
      servicio([sede]).resolve({ userId: 'CO.1710763673557397' }),
    ).resolves.toMatchObject({ sedeId: 'sede-1', plan: 'gerente' });
  });

  it('devuelve null si la identidad no está vinculada a ninguna sede', async () => {
    const contexto = await servicio([sedeCon(1)]).resolve({
      userId: 'CO.0000000000000000',
    });

    expect(contexto).toBeNull();
  });

  it('prefiere la identidad y cae al teléfono si no hay coincidencia', async () => {
    // Un mensaje puede traer los dos datos: la identidad manda, pero si no
    // esta vinculada todavia, el telefono sigue sirviendo.
    const contexto = await servicio([sedeCon(2)]).resolve({
      userId: 'CO.9999999999999999',
      phone: '573001234567',
    });

    expect(contexto?.sedeId).toBe('sede-1');
  });

  it('normaliza el teléfono a solo dígitos', () => {
    expect(normalizePhone('+57 300 123-4567')).toBe('573001234567');
  });
});
