import { Injectable, Logger } from '@nestjs/common';

import type { PlanId } from '../../../ai/usage/usage.service';
import {
  PLAN_ADMINISTRADOR,
  PLAN_ASISTENTE,
  PLAN_GERENTE,
  PLAN_SOCIO,
  PlanesService,
} from '../../../services/planes.service';
import { PrismaService } from '../../../services/prisma.service';

/**
 * Traduce "quien escribio por WhatsApp" a "que sede de que negocio es".
 *
 * n8n solo conoce la identidad del remitente; el resto del backend necesita
 * `sedeId` para poder guardar un movimiento. Toda esa resolucion vive aqui.
 */

/**
 * Como llega identificado quien escribe.
 *
 * Normalmente es el telefono. Pero Meta permite activar un nombre de usuario, y
 * esas cuentas llegan SIN telefono: el webhook trae `from_user_id` en su lugar
 * (p. ej. "CO.1710763673557397"). Son cada vez mas, asi que el enrutamiento
 * acepta cualquiera de los dos.
 */
export interface WhatsappSender {
  phone?: string;
  /** Identidad de WhatsApp de quien oculto su telefono. */
  userId?: string;
}

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

  constructor(
    private readonly prisma: PrismaService,
    private readonly planes: PlanesService,
  ) {}

  /**
   * Resuelve el remitente. Devuelve null si no pertenece a ningun negocio: en
   * ese caso NO se llama al modelo (no se gasta cuota con desconocidos) y se
   * responde con un mensaje de alta.
   *
   * Orden de busqueda:
   *   1. `Sede.whatsappUserId`  identidad de quien oculto su telefono
   *   2. `Sede.telefono`        la linea de WhatsApp del bot, una por sede
   *   3. `Usuario.telefono`     el numero personal de un socio o empleado
   *
   * Con telefono, si no hay coincidencia exacta se reintenta por los ultimos 10
   * digitos (Meta normaliza prefijos: 52 vs 521, 57 vs +57...). Con identidad
   * la comparacion es exacta: no es un numero y no admite variantes.
   *
   * `Negocio.telefonoContacto` NO se consulta a proposito: el esquema lo marca
   * como telefono administrativo, no como linea del bot.
   */
  async resolve(
    sender: WhatsappSender | string,
  ): Promise<WhatsappContext | null> {
    // Se acepta un string suelto por comodidad: es el caso mas comun.
    const { phone: rawPhone, userId } =
      typeof sender === 'string'
        ? { phone: sender, userId: undefined }
        : sender;

    if (userId) {
      const byIdentity = await this.findBySede({ whatsappUserId: userId });
      if (byIdentity) return byIdentity;
    }

    if (rawPhone) {
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

    this.logger.warn(
      `Identidad de WhatsApp sin negocio asociado: ${userId ?? '(sin remitente)'}`,
    );
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
    match: { exact: string } | { tail: string } | { whatsappUserId: string },
  ): Promise<WhatsappContext | null> {
    const sede = await this.prisma.sede.findFirst({
      where:
        'whatsappUserId' in match
          ? { whatsappUserId: match.whatsappUserId }
          : 'exact' in match
            ? { telefono: match.exact }
            : { telefono: { endsWith: match.tail } },
      // Ya no hace falta traer usuariosNegocio: el plan vive en el negocio.
      include: { negocio: true },
    });

    if (!sede) return null;

    return {
      negocioId: sede.negocio.id,
      negocioNombre: sede.negocio.nombre,
      sedeId: sede.id,
      sedeNombre: sede.nombre,
      plan: this.planDelNegocio(sede.negocio),
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
        plan: this.planDelNegocio(porSede.negocio),
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
      plan: this.planDelNegocio(negocio),
      currency: DEFAULT_CURRENCY,
      contexto: sede.contexto ?? negocio.contexto,
    };
  }

  /**
   * Cuota de IA que le corresponde al negocio.
   *
   * El plan vive en `Negocio`, no en `Usuario`: comercialmente se compra por
   * negocio, asi que quien maneja dos negocios paga dos planes. `Usuario.plan`
   * sigue existiendo por compatibilidad pero ya nadie lo actualiza; leerlo
   * dejaba en 50 mensajes/mes a clientes que habian pagado por 500 o 5.000.
   *
   * Se resuelve contra el plan VIGENTE y no el contratado: un Gerente vencido
   * cae a Asistente, igual que en el resto del backend (`PlanesService.estado`).
   */
  private planDelNegocio(negocio: {
    plan: number;
    planVenceEl: Date | null;
  }): PlanId {
    const { vigente } = this.planes.estado(negocio.plan, negocio.planVenceEl);
    return CUOTA_POR_PLAN[vigente.id] ?? 'asistente';
  }
}

// ------------------------------------------------------------------- helpers

/**
 * Catalogo comercial (`planes.service`) -> cuotas de IA (`PLAN_LIMITS`).
 *
 * Los nombres no coinciden porque cada lado bautizo sus planes por separado: el
 * plan 3 es "Administrador" en comercial y "director" en las cuotas; el 4 es
 * "Socio" y "corporativo". El mapeo va por id numerico, que si es estable.
 * Unificar los nombres tocaria `PLAN_LIMITS` y los DTOs de finance-ai: queda
 * pendiente, no es parte de este arreglo.
 */
const CUOTA_POR_PLAN: Record<number, PlanId> = {
  [PLAN_ASISTENTE]: 'asistente',
  [PLAN_GERENTE]: 'gerente',
  [PLAN_ADMINISTRADOR]: 'director',
  [PLAN_SOCIO]: 'corporativo',
};

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

/** Para logs: nunca se escribe un telefono completo en texto plano. */
export function maskPhone(phone: string): string {
  return phone.length <= 4
    ? '****'
    : `${'*'.repeat(phone.length - 4)}${phone.slice(-4)}`;
}
