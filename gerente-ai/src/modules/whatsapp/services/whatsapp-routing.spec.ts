import type { PrismaService } from '../../../services/prisma.service';
import {
  WhatsappRoutingService,
  normalizePhone,
} from './whatsapp-routing.service';

/**
 * El enrutamiento es la pieza que se rompio cuando el esquema paso de
 * `Negocio.telefono` a `Sede.telefono`. Estas pruebas fijan el contrato: se
 * busca por sede, y el numero se compara tolerando prefijos distintos.
 */
function fakePrisma(sedes: unknown[]) {
  const sede = {
    findFirst: jest.fn(({ where }: { where: { telefono: unknown } }) => {
      const criterio = where.telefono;
      const match = sedes.find((fila) => {
        const telefono = (fila as { telefono: string }).telefono;
        return typeof criterio === 'string'
          ? telefono === criterio
          : telefono.endsWith((criterio as { endsWith: string }).endsWith);
      });
      return Promise.resolve(match ?? null);
    }),
  };

  const usuario = { findFirst: jest.fn(() => Promise.resolve(null)) };

  return { prisma: { sede, usuario } as unknown as PrismaService, sede };
}

const SEDE = {
  id: 'sede-1',
  nombre: 'Sede principal',
  telefono: '573001234567',
  contexto: null,
  negocio: {
    id: 'negocio-1',
    nombre: 'Panadería El Virrey',
    contexto: null,
    usuariosNegocio: [{ usuario: { plan: 2 } }],
  },
};

describe('WhatsappRoutingService', () => {
  it('resuelve la sede por su línea de WhatsApp', async () => {
    const { prisma } = fakePrisma([SEDE]);
    const contexto = await new WhatsappRoutingService(prisma).resolve(
      '573001234567',
    );

    expect(contexto).toMatchObject({
      sedeId: 'sede-1',
      negocioId: 'negocio-1',
      negocioNombre: 'Panadería El Virrey',
      // plan 2 del panel = "gerente" en los límites de IA
      plan: 'gerente',
      currency: 'COP',
    });
  });

  it('tolera prefijos distintos comparando los últimos 10 dígitos', async () => {
    // Meta puede entregar el mismo número con o sin el 57, o con un 1 extra
    // (caso mexicano 52 vs 521). No puede quedar sin resolver por eso.
    const { prisma } = fakePrisma([SEDE]);
    const contexto = await new WhatsappRoutingService(prisma).resolve(
      '+57 300 123 4567',
    );

    expect(contexto?.sedeId).toBe('sede-1');
  });

  it('devuelve null si el número no pertenece a ninguna sede ni usuario', async () => {
    const { prisma } = fakePrisma([SEDE]);
    const contexto = await new WhatsappRoutingService(prisma).resolve(
      '573999999999',
    );

    expect(contexto).toBeNull();
  });

  it('normaliza el teléfono a solo dígitos', () => {
    expect(normalizePhone('+57 300 123-4567')).toBe('573001234567');
  });
});
