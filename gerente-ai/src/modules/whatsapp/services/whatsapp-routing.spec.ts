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
        where: {
          telefono?: unknown;
          whatsappUserId?: string;
          whatsappUsername?: string;
        };
      }) => {
        if (where.whatsappUsername !== undefined) {
          const match = sedes.find(
            (fila) =>
              (fila as { whatsappUsername?: string }).whatsappUsername ===
              where.whatsappUsername,
          );
          return Promise.resolve(match ?? null);
        }

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
  const update = jest.fn(() => Promise.resolve({}));

  return {
    prisma: { sede: { ...sede, update }, usuario } as unknown as PrismaService,
    update,
  };
}

function sedeCon(plan: number, planVenceEl: Date | null = null) {
  return {
    id: 'sede-1',
    nombre: 'Sede principal',
    telefono: '573001234567',
    whatsappUserId: null as string | null,
    whatsappUsername: null as string | null,
    contexto: null,
    negocio: {
      id: 'negocio-1',
      nombre: 'Panadería El Virrey',
      contexto: null,
      plan,
      planVenceEl,
      diaInicioPeriodo: 1,
      // Ancla de la ventana de cuota cuando el plan es gratuito o venció.
      createdAt: new Date('2026-01-01T00:00:00Z'),
      // Se deja a proposito en 1 (gratuito): si el codigo volviera a leer el
      // plan del usuario, estas pruebas lo delatan.
      usuariosNegocio: [{ usuario: { plan: 1 } }],
    },
  };
}

function servicio(sedes: unknown[]) {
  const { prisma, update } = fakePrisma(sedes);
  const routing = new WhatsappRoutingService(prisma, new PlanesService());
  return Object.assign(routing, { __update: update });
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
      [4, 'socio'],
      [5, 'corporativo'], // el plan interno, que no se vende
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

  it('resuelve por nombre de usuario cuando el BSUID aún no está vinculado', async () => {
    // Es lo que hace que al duenno solo se le pida su usuario ("jdar0423"),
    // que si conoce, en vez de un identificador que nadie sabria copiar.
    const sede = {
      ...sedeCon(2),
      telefono: null,
      whatsappUsername: 'jdar0423',
    };

    const contexto = await servicio([sede]).resolve({
      userId: 'CO.1710763673557397',
      username: 'jdar0423',
    });

    expect(contexto).toMatchObject({ sedeId: 'sede-1', plan: 'gerente' });
  });

  it('guarda el BSUID la primera vez que resuelve por usuario', async () => {
    const sede = {
      ...sedeCon(1),
      telefono: null,
      whatsappUsername: 'jdar0423',
    };
    const routing = servicio([sede]);

    await routing.resolve({
      userId: 'CO.1710763673557397',
      username: 'jdar0423',
    });

    expect(routing.__update).toHaveBeenCalledWith({
      where: { id: 'sede-1' },
      data: { whatsappUserId: 'CO.1710763673557397' },
    });
  });

  it('no vuelve a vincular si el BSUID ya estaba guardado', async () => {
    const sede = {
      ...sedeCon(1),
      telefono: null,
      whatsappUserId: 'CO.1710763673557397',
      whatsappUsername: 'jdar0423',
    };
    const routing = servicio([sede]);

    await routing.resolve({
      userId: 'CO.1710763673557397',
      username: 'jdar0423',
    });

    // Resolvio por BSUID directo: ni siquiera llego a la busqueda por usuario.
    expect(routing.__update).not.toHaveBeenCalled();
  });

  it('normaliza el teléfono a solo dígitos', () => {
    expect(normalizePhone('+57 300 123-4567')).toBe('573001234567');
  });
});

describe('WhatsappRoutingService · usuario sin negocio', () => {
  /**
   * Distinguir "nunca se registró" de "ya tiene cuenta pero no creó su negocio"
   * es lo que evita mandar a registrarse a alguien que ya se registró: esa
   * persona repite el registro, ve que no cambia nada y abandona.
   */
  function prismaConUsuario(
    usuario: { nombre: string; telefono: string } | null,
  ) {
    return {
      sede: {
        findFirst: jest.fn(() => Promise.resolve(null)),
        update: jest.fn(),
      },
      usuario: {
        findFirst: jest.fn(({ where }: { where: { telefono: unknown } }) => {
          if (!usuario) return Promise.resolve(null);
          const criterio = where.telefono;
          const coincide =
            typeof criterio === 'string'
              ? usuario.telefono === criterio
              : usuario.telefono.endsWith(
                  (criterio as { endsWith: string }).endsWith,
                );
          return Promise.resolve(coincide ? { nombre: usuario.nombre } : null);
        }),
      },
    } as unknown as PrismaService;
  }

  function routing(usuario: { nombre: string; telefono: string } | null) {
    return new WhatsappRoutingService(
      prismaConUsuario(usuario),
      new PlanesService(),
    );
  }

  it('reconoce a quien ya tiene cuenta aunque no tenga negocio', async () => {
    const encontrado = await routing({
      nombre: 'Beto Pérez',
      telefono: '573107555660',
    }).findUsuarioSinNegocio({ phone: '573107555660' });

    expect(encontrado?.nombre).toBe('Beto Pérez');
  });

  it('lo reconoce aunque el prefijo del número no coincida', async () => {
    const encontrado = await routing({
      nombre: 'Beto Pérez',
      telefono: '3107555660',
    }).findUsuarioSinNegocio({ phone: '573107555660' });

    expect(encontrado?.nombre).toBe('Beto Pérez');
  });

  it('devuelve null si esa persona no existe', async () => {
    const encontrado = await routing(null).findUsuarioSinNegocio({
      phone: '573999999999',
    });

    expect(encontrado).toBeNull();
  });

  it('no busca cuando solo hay identidad de WhatsApp, porque no hay teléfono que cruzar', async () => {
    const encontrado = await routing({
      nombre: 'Beto Pérez',
      telefono: '573107555660',
    }).findUsuarioSinNegocio({ userId: 'CO.123' });

    expect(encontrado).toBeNull();
  });
});
