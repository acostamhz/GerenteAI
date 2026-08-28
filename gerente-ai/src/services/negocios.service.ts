import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { PlanesService, PLAN_ASISTENTE } from './planes.service';
import { CreateNegocioDto } from '../dto/negocios/create-negocio.dto';
import { UpdateNegocioDto } from '../dto/negocios/update-negocio.dto';
import type { Ciclo } from '../dto/negocios/cambiar-plan.dto';
import { Sede } from '@prisma/client';

/** Lo mínimo que hace falta de una sede para resolver permisos y plan. */
export type SedeParaAcceso = Pick<Sede, 'id' | 'negocioId' | 'createdAt'>;

/** Un ciclo mensual son 30 días y uno anual 365, contados desde el pago. */
function vencimientoDelCiclo(ciclo: Ciclo): Date {
  const dias = ciclo === 'anual' ? 365 : 30;
  return new Date(Date.now() + dias * 86_400_000);
}

@Injectable()
export class NegociosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly planes: PlanesService,
  ) {}

  // Quien crea el negocio queda como dueño en la misma transacción.
  async create(userId: string, createNegocioDto: CreateNegocioDto) {
    return this.prisma.$transaction(async (tx) => {
      const negocio = await tx.negocio.create({ data: createNegocioDto });
      await tx.usuarioNegocio.create({
        data: { usuarioId: userId, negocioId: negocio.id },
      });
      return negocio;
    });
  }

  findAll() {
    return this.prisma.negocio.findMany();
  }

  async findOne(id: string) {
    const negocio = await this.prisma.negocio.findUnique({ where: { id } });
    if (!negocio) {
      throw new NotFoundException(`Negocio con id ${id} no encontrado`);
    }
    return negocio;
  }

  async update(
    id: string,
    userId: string,
    rolGlobal: string,
    updateNegocioDto: UpdateNegocioDto,
  ) {
    await this.findOne(id);
    await this.verificarPropietario(userId, id, rolGlobal);
    return this.prisma.negocio.update({
      where: { id },
      data: updateNegocioDto,
    });
  }

  async remove(id: string, userId: string, rolGlobal: string) {
    await this.findOne(id);
    await this.verificarPropietario(userId, id, rolGlobal);
    return this.prisma.negocio.delete({ where: { id } });
  }

  /**
   * Único punto donde se cambia el plan de un negocio.
   *
   * Cuando exista la pasarela, su webhook llama aquí después de confirmar el
   * pago y no hay que reescribir nada. Por eso nadie más debe hacer
   * `negocio.update({ plan })`: si el cambio de plan se dispersa, mañana no se
   * sabe quién subió a alguien de plan ni por qué.
   */
  async cambiarPlan(
    negocioId: string,
    rolGlobal: string,
    plan: number,
    ciclo: Ciclo = 'mensual',
  ) {
    // Mientras no exista la pasarela, cambiar de plan es una operación de la
    // plataforma: si lo pudiera hacer el dueño, cualquiera se daría Administrador
    // gratis. Cuando entre el webhook de pagos, será él quien llame aquí.
    if (rolGlobal !== 'MASTER') {
      throw new ForbiddenException(
        'El plan se cambia al confirmarse un pago, no manualmente',
      );
    }

    await this.findOne(negocioId);

    // El plan gratuito no vence; los pagos, sí.
    const venceEl = plan === PLAN_ASISTENTE ? null : vencimientoDelCiclo(ciclo);

    return this.prisma.negocio.update({
      where: { id: negocioId },
      data: { plan, planVenceEl: venceEl },
    });
  }

  /** Estado del plan que rige hoy en el negocio (ya resuelto el vencimiento). */
  async estadoDelPlan(negocioId: string) {
    const negocio = await this.findOne(negocioId);
    return this.planes.estado(negocio.plan, negocio.planVenceEl);
  }

  // Reutilizable por SedesService y futuros módulos (Productos, Ventas, etc.)
  async verificarPropietario(
    usuarioId: string,
    negocioId: string,
    rolGlobal: string,
  ) {
    if (rolGlobal === 'MASTER') return;

    const relacion = await this.prisma.usuarioNegocio.findUnique({
      where: { usuarioId_negocioId: { usuarioId, negocioId } },
    });
    if (!relacion) {
      throw new ForbiddenException('No tienes permisos sobre este negocio');
    }
  }

  /**
   * Acceso operativo sobre una sede: dueño/socio del negocio, o miembro vinculado
   * a esa sede. Recibe la sede ya cargada porque el llamador siempre la consultó
   * antes para su propio 404.
   *
   * Con `escritura: true` valida además que la sede esté habilitada por el plan.
   * Leer nunca se bloquea: un negocio cuyo plan venció conserva el histórico de
   * todas sus sedes, solo deja de poder escribir en las que exceden el tope.
   */
  async verificarAccesoSede(
    usuarioId: string,
    sede: SedeParaAcceso,
    rolGlobal: string,
    opciones: { escritura?: boolean } = {},
  ) {
    if (rolGlobal === 'MASTER') return;

    const esDuenoDelNegocio = await this.prisma.usuarioNegocio.findUnique({
      where: { usuarioId_negocioId: { usuarioId, negocioId: sede.negocioId } },
    });
    const esMiembroDeLaSede = esDuenoDelNegocio
      ? null
      : await this.prisma.usuarioSede.findUnique({
          where: { usuarioId_sedeId: { usuarioId, sedeId: sede.id } },
        });

    if (!esDuenoDelNegocio && !esMiembroDeLaSede) {
      throw new ForbiddenException('No tienes permisos sobre esta sede');
    }

    if (opciones.escritura) {
      await this.verificarSedeHabilitadaPorPlan(sede);
    }
  }

  /**
   * Las sedes habilitadas son las primeras N creadas, donde N es el tope del
   * plan vigente. No se guarda un campo `activa` porque el vencimiento ocurre
   * por el paso del tiempo y no por un evento: haría falta un proceso nocturno
   * apagando sedes, y un dato calculado que se desactualiza es peor que no
   * tenerlo. Aquí se deriva en el momento, que además siempre está al día.
   */
  private async verificarSedeHabilitadaPorPlan(sede: SedeParaAcceso) {
    const negocio = await this.findOne(sede.negocioId);
    const estado = this.planes.estado(negocio.plan, negocio.planVenceEl);
    const tope = estado.vigente.maxSedes;

    if (tope === Number.POSITIVE_INFINITY) return;

    // Se piden las primeras N y se mira si esta está entre ellas. Contar las
    // creadas "antes que esta" sería frágil: dos sedes creadas en el mismo
    // milisegundo quedarían ambas en posición 0 y las dos se tomarían por la
    // primera. El desempate por `id` hace el orden estable siempre.
    const habilitadas = await this.prisma.sede.findMany({
      where: { negocioId: sede.negocioId },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      take: tope,
      select: { id: true },
    });

    if (!habilitadas.some((habilitada) => habilitada.id === sede.id)) {
      const motivo = estado.vencido
        ? `El plan ${estado.contratado.nombre} venció, así que solo la primera sede sigue habilitada para registrar información`
        : `El plan ${estado.vigente.nombre} permite operar en ${tope} sede(s)`;

      throw new ForbiddenException(
        `${motivo}. Esta sede queda en solo lectura hasta que se active un plan superior.`,
      );
    }
  }
}
