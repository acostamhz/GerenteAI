import { Injectable, Logger } from '@nestjs/common';

import type { PlanId } from '../../../ai/usage/usage.service';
import { PrismaService } from '../../../services/prisma.service';

/**
 * Traduce "un numero de WhatsApp" a "que sede de que negocio esta escribiendo".
 *
 * n8n solo sabe el telefono del remitente; el resto del backend necesita
 * `sedeId` para poder guardar un movimiento. Toda esa resolucion vive aqui.
 */

export interface WhatsappContext {
  negocioId: string;
  negocioNombre: string;
  /** Es el `businessId` del dominio de IA: los movimientos cuelgan de la sede. */
  sedeId: string;
  sedeNombre: string;
  plan: PlanId;
  currency: string;
  /** Contexto de negocio/sede que el dashboard configura para la IA. */
  contexto: string | null;
}

@Injectable()
export class WhatsappRoutingService {
  private readonly logger = new Logger(WhatsappRoutingService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Resuelve el remitente. Devuelve null si el numero no pertenece a ningun
   * negocio: en ese caso NO se llama al modelo (no se gasta cuota con
   * desconocidos) y se responde con un mensaje de alta.
   *
   * Orden de busqueda:
   *   1. `Sede.telefono`     la linea de WhatsApp del bot, una por sede
   *   2. `Usuario.telefono`  el numero personal de un socio o empleado
   *
   * En ambos casos, si no hay coincidencia exacta se reintenta por los ultimos
   * 10 digitos (Meta normaliza prefijos: 52 vs 521, 57 vs +57...).
   *
   * `Negocio.telefonoContacto` NO se consulta a proposito: el esquema lo marca
   * como telefono administrativo, no como linea del bot.
   */
  async resolve(rawPhone: string): Promise<WhatsappContext | null> {
    const phone = normalizePhone(rawPhone);
    const tail = phone.slice(-10);

    const bySede =
      (await this.findBySede({ exact: phone })) ??
      (await this.findBySede({ tail }));
    if (bySede) return bySede;

    const byUsuario =
      (await this.findByUsuario({ exact: phone })) ??
      (await this.findByUsuario({ tail }));
    if (byUsuario) return byUsuario;

    this.logger.warn(`Numero sin negocio asociado: ${maskPhone(phone)}`);
    return null;
  }

  // --------------------------------------------------------------- busquedas

  /**
   * La sede es la unidad con linea de WhatsApp propia (`Sede.telefono`, unico
   * en la base) y es tambien la unidad contable: Gasto, Venta y Compra cuelgan
   * de ella. Por eso una coincidencia aqui resuelve el enrutamiento completo,
   * sin ambiguedad sobre a que sede se imputa el movimiento.
   */
  private async findBySede(
    match: { exact: string } | { tail: string },
  ): Promise<WhatsappContext | null> {
    const sede = await this.prisma.sede.findFirst({
      where:
        'exact' in match
          ? { telefono: match.exact }
          : { telefono: { endsWith: match.tail } },
      include: {
        negocio: {
          include: {
            usuariosNegocio: {
              orderBy: { id: 'asc' },
              take: 1,
              include: { usuario: true },
            },
          },
        },
      },
    });

    if (!sede) return null;

    return {
      negocioId: sede.negocio.id,
      negocioNombre: sede.negocio.nombre,
      sedeId: sede.id,
      sedeNombre: sede.nombre,
      plan: planFromNumber(sede.negocio.usuariosNegocio[0]?.usuario.plan),
      currency: DEFAULT_CURRENCY,
      contexto: sede.contexto ?? sede.negocio.contexto,
    };
  }

  private async findByUsuario(
    match: { exact: string } | { tail: string },
  ): Promise<WhatsappContext | null> {
    const usuario = await this.prisma.usuario.findFirst({
      where:
        'exact' in match
          ? { telefono: match.exact }
          : { telefono: { endsWith: match.tail } },
      include: {
        // Un empleado se asocia a una sede concreta; un duenno, al negocio.
        sedes: {
          take: 1,
          orderBy: { id: 'asc' },
          include: { sede: { include: { negocio: true } } },
        },
        negocios: {
          take: 1,
          orderBy: { id: 'asc' },
          include: {
            negocio: {
              include: { sedes: { orderBy: { createdAt: 'asc' }, take: 1 } },
            },
          },
        },
      },
    });

    if (!usuario) return null;

    const porSede = usuario.sedes[0]?.sede;
    if (porSede) {
      return {
        negocioId: porSede.negocio.id,
        negocioNombre: porSede.negocio.nombre,
        sedeId: porSede.id,
        sedeNombre: porSede.nombre,
        plan: planFromNumber(usuario.plan),
        currency: DEFAULT_CURRENCY,
        contexto: porSede.contexto ?? porSede.negocio.contexto,
      };
    }

    const negocio = usuario.negocios[0]?.negocio;
    const sede = negocio?.sedes[0];
    if (!negocio || !sede) return null;

    return {
      negocioId: negocio.id,
      negocioNombre: negocio.nombre,
      sedeId: sede.id,
      sedeNombre: sede.nombre,
      plan: planFromNumber(usuario.plan),
      currency: DEFAULT_CURRENCY,
      contexto: sede.contexto ?? negocio.contexto,
    };
  }
}

// ------------------------------------------------------------------- helpers

/**
 * Moneda del negocio.
 *
 * ASUNCION: el esquema de Prisma todavia no guarda moneda por negocio, y el
 * producto opera en Colombia. Cuando `Negocio` tenga el campo, se lee de ahi.
 */
const DEFAULT_CURRENCY = 'COP';

/** Deja solo digitos: "+57 300 123 4567" y "573001234567" deben coincidir. */
export function normalizePhone(value: string): string {
  return value.replace(/\D/g, '');
}

/** Los planes del dashboard son numeros; los limites de IA, nombres. */
function planFromNumber(plan: number | undefined): PlanId {
  const PLANS: PlanId[] = ['asistente', 'gerente', 'director', 'corporativo'];
  return PLANS[(plan ?? 1) - 1] ?? 'asistente';
}

/** Para logs: nunca se escribe un telefono completo en texto plano. */
export function maskPhone(phone: string): string {
  return phone.length <= 4
    ? '****'
    : `${'*'.repeat(phone.length - 4)}${phone.slice(-4)}`;
}
