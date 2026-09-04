import { Injectable, Logger } from '@nestjs/common';

import type { PlanId } from '../../../ai/usage/usage.service';
import {
  PLAN_ADMINISTRADOR,
  PLAN_ASISTENTE,
  PLAN_GERENTE,
  PLAN_CORPORATIVO,
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
 * esas cuentas llegan SIN telefono: el webhook trae el BSUID (business-scoped
 * user id, p. ej. "CO.1710763673557397") y el nombre de usuario publico.
 */
export interface WhatsappSender {
  phone?: string;
  /** BSUID: identidad de quien oculto su telefono. Estable, pero ilegible. */
  userId?: string;
  /** Nombre de usuario de WhatsApp ("jdar0423"). Es el que la persona conoce. */
  username?: string;
}

export interface WhatsappContext {
  negocioId: string;
  negocioNombre: string;
  /** Es el `businessId` del dominio de IA: los movimientos cuelgan de la sede. */
  sedeId: string;
  sedeNombre: string;
  plan: PlanId;
  /** Nombre comercial del plan vigente ("Asistente", "Gerente"...). */
  planName: string;
  /** true si el plan vigente es el gratuito: decide que funciones se ofrecen. */
  planIsFree: boolean;
  currency: string;
  /**
   * Dia en que arranca el periodo contable del negocio (1 a 28).
   *
   * Hay negocios cuyo mes va del 21 al 20; sin este dato el bot les cortaria
   * los totales por el mes calendario y no coincidirian con su realidad.
   */
  diaInicioPeriodo: number;
  /**
   * Los 30 dias contra los que se cuenta la cuota de IA. Va anclada al
   * vencimiento del plan, o a la creacion del negocio si es gratuito.
   */
  ventanaDeCuota: { inicio: Date; fin: Date };
  /** Contexto de negocio/sede que el dashboard configura para la IA. */
  contexto: string | null;
}

/** Lo minimo que hace falta de la base para armar un `WhatsappContext`. */
interface SedeConNegocio {
  id: string;
  nombre: string;
  contexto: string | null;
  whatsappUserId: string | null;
  negocio: {
    id: string;
    nombre: string;
    contexto: string | null;
    plan: number;
    planVenceEl: Date | null;
    diaInicioPeriodo: number;
    createdAt: Date;
  };
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
   *   1. `Sede.whatsappUserId`    el BSUID, si ya quedo vinculado
   *   2. `Sede.whatsappUsername`  el nombre de usuario que cargo el duenno
   *   3. `Sede.telefono`          la linea de WhatsApp del bot, una por sede
   *   4. `Usuario.telefono`       el numero personal de un socio o empleado
   *
   * Con telefono, si no hay coincidencia exacta se reintenta por los ultimos 10
   * digitos (Meta normaliza prefijos: 52 vs 521, 57 vs +57...). Con identidad y
   * con usuario la comparacion es exacta: no son numeros, no admiten variantes.
   *
   * `Negocio.telefonoContacto` NO se consulta a proposito: el esquema lo marca
   * como telefono administrativo, no como linea del bot.
   */
  async resolve(
    sender: WhatsappSender | string,
  ): Promise<WhatsappContext | null> {
    // Se acepta un string suelto por comodidad: es el caso mas comun.
    const {
      phone: rawPhone,
      userId,
      username,
    } = typeof sender === 'string' ? { phone: sender } : sender;

    if (userId) {
      const sede = await this.buscarSede({ whatsappUserId: userId });
      if (sede) return this.toContext(sede);
    }

    if (username) {
      const sede = await this.buscarSede({ whatsappUsername: username });
      if (sede) {
        // Autovinculacion: al duenno solo se le pide su nombre de usuario, que
        // si conoce. El BSUID, que nadie sabria copiar, lo captura el sistema
        // del primer mensaje; desde el segundo resuelve por el, que es mas
        // estable (el nombre de usuario se puede cambiar).
        if (userId && sede.whatsappUserId !== userId) {
          await this.vincularIdentidad(sede.id, userId);
        }
        return this.toContext(sede);
      }
    }

    if (rawPhone) {
      const phone = normalizePhone(rawPhone);
      const tail = phone.slice(-10);

      const sede =
        (await this.buscarSede({ telefono: phone })) ??
        (await this.buscarSede({ telefono: { endsWith: tail } }));
      if (sede) return this.toContext(sede);

      const byUsuario =
        (await this.findByUsuario({ exact: phone })) ??
        (await this.findByUsuario({ tail }));
      if (byUsuario) return byUsuario;

      this.logger.warn(`Numero sin negocio asociado: ${maskPhone(phone)}`);
      return null;
    }

    this.logger.warn(
      `Identidad de WhatsApp sin negocio asociado: ${username ?? userId ?? '(sin remitente)'}`,
    );
    return null;
  }

  /**
   * ¿Existe la persona, aunque no tenga negocio?
   *
   * Se usa solo cuando `resolve` no encontro sede, para poder distinguir dos
   * situaciones que al usuario le importan mucho y antes se respondian igual:
   * quien nunca se registro, y quien ya tiene cuenta pero todavia no creo su
   * negocio. Decirle "registrate" a alguien que ya se registro lo deja sin
   * saber que hacer.
   */
  async findUsuarioSinNegocio(
    sender: WhatsappSender | string,
  ): Promise<{ nombre: string } | null> {
    const raw = typeof sender === 'string' ? sender : sender.phone;
    if (!raw) return null;

    const phone = normalizePhone(raw);
    if (!phone) return null;

    const usuario =
      (await this.prisma.usuario.findFirst({
        where: { telefono: phone },
        select: { nombre: true },
      })) ??
      (await this.prisma.usuario.findFirst({
        where: { telefono: { endsWith: phone.slice(-10) } },
        select: { nombre: true },
      }));

    return usuario;
  }

  // --------------------------------------------------------------- busquedas

  /**
   * La sede es la unidad con linea de WhatsApp propia y es tambien la unidad
   * contable: Gasto, Venta y Compra cuelgan de ella. Por eso una coincidencia
   * aqui resuelve el enrutamiento completo, sin ambiguedad sobre a que sede se
   * imputa el movimiento.
   */
  private buscarSede(where: {
    whatsappUserId?: string;
    whatsappUsername?: string;
    telefono?: string | { endsWith: string };
  }): Promise<SedeConNegocio | null> {
    return this.prisma.sede.findFirst({
      where,
      // No hace falta traer usuariosNegocio: el plan vive en el negocio.
      include: { negocio: true },
    });
  }

  /** Guarda el BSUID en la sede para que el proximo mensaje resuelva directo. */
  private async vincularIdentidad(
    sedeId: string,
    whatsappUserId: string,
  ): Promise<void> {
    try {
      await this.prisma.sede.update({
        where: { id: sedeId },
        data: { whatsappUserId },
      });
      this.logger.log(
        `Sede ${sedeId} vinculada a la identidad ${whatsappUserId}.`,
      );
    } catch (error) {
      // Que falle la vinculacion no puede dejar sin respuesta al usuario: el
      // mensaje ya quedo resuelto por nombre de usuario, y se reintentara sola
      // en el proximo.
      this.logger.warn(
        `No se pudo vincular la sede ${sedeId} con ${whatsappUserId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
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
    if (porSede) return this.toContext(porSede);

    const negocio = usuario.negocios[0]?.negocio;
    const sede = negocio?.sedes[0];
    if (!negocio || !sede) return null;

    return this.toContext({ ...sede, negocio });
  }

  // ----------------------------------------------------------------- interno

  private toContext(sede: SedeConNegocio): WhatsappContext {
    return {
      negocioId: sede.negocio.id,
      negocioNombre: sede.negocio.nombre,
      sedeId: sede.id,
      sedeNombre: sede.nombre,
      ...this.planDelNegocio(sede.negocio),
      currency: DEFAULT_CURRENCY,
      diaInicioPeriodo: sede.negocio.diaInicioPeriodo,
      ventanaDeCuota: this.planes.ventanaDeCuota(
        sede.negocio.plan,
        sede.negocio.planVenceEl,
        sede.negocio.createdAt,
      ),
      contexto: sede.contexto ?? sede.negocio.contexto,
    };
  }

  /**
   * Cuota de IA y datos comerciales del plan del negocio.
   *
   * El plan vive en `Negocio`, no en `Usuario`: comercialmente se compra por
   * negocio, asi que quien maneja dos negocios paga dos planes. `Usuario.plan`
   * sigue existiendo por compatibilidad pero ya nadie lo actualiza; leerlo
   * dejaba en 50 mensajes/mes a clientes que habian pagado por 500 o 5.000.
   *
   * Se resuelve contra el plan VIGENTE y no el contratado: un Gerente vencido
   * cae a Asistente, igual que en el resto del backend (`PlanesService.estado`).
   */
  private planDelNegocio(negocio: { plan: number; planVenceEl: Date | null }): {
    plan: PlanId;
    planName: string;
    planIsFree: boolean;
  } {
    const { vigente } = this.planes.estado(negocio.plan, negocio.planVenceEl);

    return {
      plan: CUOTA_POR_PLAN[vigente.id] ?? 'asistente',
      planName: vigente.nombre,
      planIsFree: vigente.id === PLAN_ASISTENTE,
    };
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
  [PLAN_SOCIO]: 'socio',
  [PLAN_CORPORATIVO]: 'corporativo',
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
