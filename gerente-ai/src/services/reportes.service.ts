import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from './prisma.service';
import { NegociosService } from './negocios.service';
import { PlanesService, type Funcionalidad } from './planes.service';
import { Periodo } from '../dto/reportes/reporte-query.dto';

// América/Bogotá. Se usa un offset fijo y no una librería de zonas horarias porque
// Colombia no tiene horario de verano, así que -5 es exacto todo el año.
// Si el producto sale del país, esto hay que cambiarlo por la zona real de cada sede.
const OFFSET_HORAS = -5;
const UNA_HORA_MS = 3_600_000;

interface Rango {
  desde: Date;
  hasta: Date;
}

/** Una venta fiada tal como la ve el reporte, con la antigüedad ya calculada. */
export interface VentaFiadaDescrita {
  id: string;
  fecha: string;
  total: number;
  saldoPendiente: number;
  abonado: number;
  fechaVencimiento: string | null;
  vencida: boolean;
  diasDesdeLaVenta: number;
  diasDeAtraso: number;
  abonos: { id: string; monto: number; fecha: string }[];
}

@Injectable()
export class ReportesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly negociosService: NegociosService,
    private readonly planes: PlanesService,
  ) {}

  /**
   * Reporte por producto: qué se vendió, cuánto y con qué margen. Exclusivo de
   * los planes Gerente y Administrador.
   */
  async porProducto(
    sedeId: string,
    userId: string,
    rolGlobal: string,
    periodo: Periodo,
    fecha?: string,
  ) {
    const sede = await this.buscarSedeConAcceso(sedeId, userId, rolGlobal);
    await this.exigirFuncionalidad(
      sede.negocioId,
      'reportes_por_producto',
      rolGlobal,
    );

    const rango = this.calcularRango(periodo, fecha);
    const detalles = await this.prisma.detalleVenta.findMany({
      where: {
        venta: { sedeId, fecha: { gte: rango.desde, lt: rango.hasta } },
      },
      include: {
        producto: { select: { id: true, nombre: true, precioCompra: true } },
      },
    });

    const acumulado = new Map<
      string,
      {
        nombre: string;
        unidades: number;
        ingresos: Prisma.Decimal;
        costo: Prisma.Decimal;
        lineas: number;
      }
    >();

    for (const detalle of detalles) {
      const previo = acumulado.get(detalle.productoId) ?? {
        nombre: detalle.producto.nombre,
        unidades: 0,
        ingresos: new Prisma.Decimal(0),
        costo: new Prisma.Decimal(0),
        lineas: 0,
      };

      acumulado.set(detalle.productoId, {
        nombre: previo.nombre,
        unidades: previo.unidades + detalle.cantidad,
        ingresos: previo.ingresos.add(detalle.precio.mul(detalle.cantidad)),
        costo: previo.costo.add(
          detalle.producto.precioCompra.mul(detalle.cantidad),
        ),
        lineas: previo.lineas + 1,
      });
    }

    const totalIngresos = [...acumulado.values()].reduce(
      (suma, p) => suma.add(p.ingresos),
      new Prisma.Decimal(0),
    );

    const productos = [...acumulado.entries()]
      .map(([id, p]) => ({
        id,
        nombre: p.nombre,
        unidades: p.unidades,
        ingresos: p.ingresos.toNumber(),
        // Margen APROXIMADO: usa el precioCompra actual del producto, no el que
        // tenía al momento de la venta. El costo histórico solo existe en
        // DetalleCompra, y atarlo a cada venta exigiría inventario por lotes.
        margenEstimado: p.ingresos.sub(p.costo).toNumber(),
        vecesVendido: p.lineas,
        participacion: totalIngresos.isZero()
          ? 0
          : Number(p.ingresos.div(totalIngresos).mul(100).toFixed(2)),
      }))
      .sort((a, b) => b.ingresos - a.ingresos);

    return {
      periodo: this.describirPeriodo(periodo, rango),
      sede: { id: sede.id, nombre: sede.nombre },
      totalIngresos: totalIngresos.toNumber(),
      productos,
      // Las ventas registradas por WhatsApp no crean DetalleVenta, así que no
      // aparecen aquí. Se avisa para que el número no se lea como el total real.
      advertencia:
        'Solo incluye ventas con detalle de productos. Las registradas por WhatsApp sin desglose no aparecen.',
    };
  }

  /**
   * Reporte de fiados: quién debe, cuánto, desde cuándo y qué está vencido.
   * Exclusivo de los planes Gerente y Administrador.
   */
  async fiados(sedeId: string, userId: string, rolGlobal: string) {
    const sede = await this.buscarSedeConAcceso(sedeId, userId, rolGlobal);
    await this.exigirFuncionalidad(sede.negocioId, 'reporte_fiados', rolGlobal);

    const ventas = await this.prisma.venta.findMany({
      where: { sedeId, saldoPendiente: { gt: 0 } },
      include: {
        cliente: { select: { id: true, nombre: true, telefono: true } },
        abonos: { orderBy: { fecha: 'desc' } },
      },
      orderBy: { fecha: 'asc' },
    });

    const ahora = Date.now();
    const porCliente = new Map<
      string,
      {
        cliente: { id: string; nombre: string; telefono: string | null };
        saldo: Prisma.Decimal;
        vencido: Prisma.Decimal;
        ventas: VentaFiadaDescrita[];
      }
    >();

    for (const venta of ventas) {
      // Una venta con saldo pero sin cliente sería un dato inconsistente; se
      // omite en vez de inventarle un deudor.
      if (!venta.cliente) continue;

      const detalle = this.describirVentaFiada(venta, ahora);
      const previo = porCliente.get(venta.cliente.id) ?? {
        cliente: venta.cliente,
        saldo: new Prisma.Decimal(0),
        vencido: new Prisma.Decimal(0),
        ventas: [],
      };

      previo.saldo = previo.saldo.add(venta.saldoPendiente);
      if (detalle.vencida) {
        previo.vencido = previo.vencido.add(venta.saldoPendiente);
      }
      previo.ventas.push(detalle);
      porCliente.set(venta.cliente.id, previo);
    }

    const clientes = [...porCliente.values()]
      .map((c) => ({
        ...c.cliente,
        saldoPendiente: c.saldo.toNumber(),
        vencido: c.vencido.toNumber(),
        // La deuda más antigua es la primera, porque las ventas vienen ordenadas.
        diasDeLaDeudaMasAntigua: c.ventas[0]?.diasDesdeLaVenta ?? 0,
        ventas: c.ventas,
      }))
      .sort(
        (a, b) => b.vencido - a.vencido || b.saldoPendiente - a.saldoPendiente,
      );

    return {
      sede: { id: sede.id, nombre: sede.nombre },
      generadoEl: new Date().toISOString(),
      totales: {
        porCobrar: clientes.reduce((s, c) => s + c.saldoPendiente, 0),
        vencido: clientes.reduce((s, c) => s + c.vencido, 0),
        clientesConDeuda: clientes.length,
        ventasPendientes: ventas.length,
      },
      clientes,
    };
  }

  private describirVentaFiada(
    venta: {
      id: string;
      fecha: Date;
      total: Prisma.Decimal;
      saldoPendiente: Prisma.Decimal;
      fechaVencimiento: Date | null;
      abonos: { id: string; monto: Prisma.Decimal; fecha: Date }[];
    },
    ahora: number,
  ): VentaFiadaDescrita {
    // "Vencida" se deriva y no se guarda: un campo booleano exigiría un proceso
    // que lo actualice cada noche, y quedaría desfasado entre corrida y corrida.
    const vencida =
      venta.fechaVencimiento !== null &&
      venta.fechaVencimiento.getTime() < ahora;

    return {
      id: venta.id,
      fecha: venta.fecha.toISOString(),
      total: venta.total.toNumber(),
      saldoPendiente: venta.saldoPendiente.toNumber(),
      abonado: venta.total.sub(venta.saldoPendiente).toNumber(),
      fechaVencimiento: venta.fechaVencimiento?.toISOString() ?? null,
      vencida,
      diasDesdeLaVenta: Math.floor(
        (ahora - venta.fecha.getTime()) / 86_400_000,
      ),
      diasDeAtraso:
        vencida && venta.fechaVencimiento
          ? Math.floor((ahora - venta.fechaVencimiento.getTime()) / 86_400_000)
          : 0,
      abonos: venta.abonos.map((a) => ({
        id: a.id,
        monto: a.monto.toNumber(),
        fecha: a.fecha.toISOString(),
      })),
    };
  }

  private async buscarSedeConAcceso(
    sedeId: string,
    userId: string,
    rolGlobal: string,
  ) {
    const sede = await this.prisma.sede.findUnique({ where: { id: sedeId } });
    if (!sede) {
      throw new NotFoundException(`Sede con id ${sedeId} no encontrada`);
    }
    // Sin `escritura`: consultar reportes es lectura, y una sede bloqueada por
    // plan conserva su histórico.
    await this.negociosService.verificarAccesoSede(userId, sede, rolGlobal);
    return sede;
  }

  /** El backend autoriza según el plan; el cálculo estadístico es de la capa de IA. */
  private async exigirFuncionalidad(
    negocioId: string,
    funcionalidad: Funcionalidad,
    rolGlobal: string,
  ) {
    if (rolGlobal === 'MASTER') return;

    const negocio = await this.prisma.negocio.findUnique({
      where: { id: negocioId },
    });
    if (!negocio) {
      throw new NotFoundException('El negocio de esta sede ya no existe');
    }

    if (
      !this.planes.tieneFuncionalidad(
        negocio.plan,
        negocio.planVenceEl,
        funcionalidad,
      )
    ) {
      const estado = this.planes.estado(negocio.plan, negocio.planVenceEl);
      const motivo = estado.vencido
        ? `El plan ${estado.contratado.nombre} está vencido`
        : `El plan ${estado.vigente.nombre} no incluye esta función`;

      throw new ForbiddenException(
        `${motivo}. Necesitas el plan Gerente o Administrador para consultar este reporte.`,
      );
    }
  }

  async deSede(
    sedeId: string,
    userId: string,
    rolGlobal: string,
    periodo: Periodo,
    fecha?: string,
  ) {
    const sede = await this.prisma.sede.findUnique({ where: { id: sedeId } });
    if (!sede) {
      throw new NotFoundException(`Sede con id ${sedeId} no encontrada`);
    }
    await this.negociosService.verificarAccesoSede(userId, sede, rolGlobal);

    const rango = this.calcularRango(periodo, fecha);
    const movimientos = await this.movimientosDeSede(sedeId, rango);

    return {
      periodo: this.describirPeriodo(periodo, rango),
      sede: { id: sede.id, nombre: sede.nombre },
      ...this.armarCifras(movimientos),
    };
  }

  // Consolidado del negocio: el total, más el desglose de cada sede.
  async deNegocio(
    negocioId: string,
    userId: string,
    rolGlobal: string,
    periodo: Periodo,
    fecha?: string,
  ) {
    const negocio = await this.prisma.negocio.findUnique({
      where: { id: negocioId },
    });
    if (!negocio) {
      throw new NotFoundException(`Negocio con id ${negocioId} no encontrado`);
    }
    // Solo el dueño ve el consolidado: un admin de sede no tiene por qué conocer
    // los números de las otras sedes.
    await this.negociosService.verificarPropietario(
      userId,
      negocioId,
      rolGlobal,
    );

    const rango = this.calcularRango(periodo, fecha);
    const sedes = await this.prisma.sede.findMany({
      where: { negocioId },
      orderBy: { nombre: 'asc' },
    });

    const movimientosPorSede = await Promise.all(
      sedes.map(async (sede) => ({
        sede,
        movimientos: await this.movimientosDeSede(sede.id, rango),
      })),
    );

    // Se acumula en Decimal y se convierte a número una sola vez, al final: sumar
    // los valores ya formateados reintroduciría el error de punto flotante.
    const totales = movimientosPorSede.reduce(
      (acumulado, { movimientos: m }) => ({
        ventasContado: acumulado.ventasContado.add(m.ventasContado),
        ventasFiado: acumulado.ventasFiado.add(m.ventasFiado),
        abonos: acumulado.abonos.add(m.abonos),
        compras: acumulado.compras.add(m.compras),
        gastos: acumulado.gastos.add(m.gastos),
        conteos: {
          ventas: acumulado.conteos.ventas + m.conteos.ventas,
          abonos: acumulado.conteos.abonos + m.conteos.abonos,
          compras: acumulado.conteos.compras + m.conteos.compras,
          gastos: acumulado.conteos.gastos + m.conteos.gastos,
        },
      }),
      this.movimientosVacios(),
    );

    return {
      periodo: this.describirPeriodo(periodo, rango),
      negocio: { id: negocio.id, nombre: negocio.nombre },
      ...this.armarCifras(totales),
      sedes: movimientosPorSede.map(({ sede, movimientos }) => ({
        sede: { id: sede.id, nombre: sede.nombre },
        ...this.armarCifras(movimientos),
      })),
    };
  }

  private async movimientosDeSede(sedeId: string, rango: Rango) {
    const filtroFecha = { gte: rango.desde, lt: rango.hasta };

    const [ventasPorTipo, abonos, compras, gastos] = await Promise.all([
      this.prisma.venta.groupBy({
        by: ['tipo'],
        where: { sedeId, fecha: filtroFecha },
        _sum: { total: true },
        _count: true,
      }),
      this.prisma.abono.aggregate({
        where: { sedeId, fecha: filtroFecha },
        _sum: { monto: true },
        _count: true,
      }),
      this.prisma.compra.aggregate({
        where: { sedeId, fecha: filtroFecha },
        _sum: { total: true },
        _count: true,
      }),
      this.prisma.gasto.aggregate({
        where: { sedeId, fecha: filtroFecha },
        _sum: { monto: true },
        _count: true,
      }),
    ]);

    const contado = ventasPorTipo.find((v) => v.tipo === 'CONTADO');
    const fiado = ventasPorTipo.find((v) => v.tipo === 'FIADO');

    return {
      ventasContado: contado?._sum.total ?? new Prisma.Decimal(0),
      ventasFiado: fiado?._sum.total ?? new Prisma.Decimal(0),
      abonos: abonos._sum.monto ?? new Prisma.Decimal(0),
      compras: compras._sum.total ?? new Prisma.Decimal(0),
      gastos: gastos._sum.monto ?? new Prisma.Decimal(0),
      conteos: {
        ventas: (contado?._count ?? 0) + (fiado?._count ?? 0),
        abonos: abonos._count,
        compras: compras._count,
        gastos: gastos._count,
      },
    };
  }

  private movimientosVacios() {
    return {
      ventasContado: new Prisma.Decimal(0),
      ventasFiado: new Prisma.Decimal(0),
      abonos: new Prisma.Decimal(0),
      compras: new Prisma.Decimal(0),
      gastos: new Prisma.Decimal(0),
      conteos: { ventas: 0, abonos: 0, compras: 0, gastos: 0 },
    };
  }

  // Una venta FIADO no es un ingreso: no entró plata, entró una deuda. El ingreso
  // real aparece después, cuando el cliente abona. Por eso el fiado va aparte, en
  // informativo, y no suma al balance.
  private armarCifras(m: ReturnType<typeof this.movimientosVacios>) {
    const totalIngresos = m.ventasContado.add(m.abonos);
    const totalEgresos = m.compras.add(m.gastos);

    return {
      ingresos: {
        ventasContado: m.ventasContado.toNumber(),
        abonos: m.abonos.toNumber(),
        total: totalIngresos.toNumber(),
      },
      egresos: {
        compras: m.compras.toNumber(),
        gastos: m.gastos.toNumber(),
        total: totalEgresos.toNumber(),
      },
      balance: totalIngresos.sub(totalEgresos).toNumber(),
      informativo: {
        ventasFiado: m.ventasFiado.toNumber(),
        ventasTotales: m.ventasContado.add(m.ventasFiado).toNumber(),
        conteos: m.conteos,
      },
    };
  }

  private describirPeriodo(periodo: Periodo, rango: Rango) {
    return {
      tipo: periodo,
      desde: rango.desde.toISOString(),
      hasta: rango.hasta.toISOString(),
      zonaHoraria: `UTC${OFFSET_HORAS}`,
    };
  }

  // El día del comerciante va de 00:00 a 23:59 en hora local, no en UTC. Sin esta
  // conversión, todo lo vendido después de las 7pm caería en el reporte del día siguiente.
  private calcularRango(periodo: Periodo, fechaISO?: string): Rango {
    const { anio, mes, dia } = this.diaLocal(fechaISO);

    if (periodo === 'mensual') {
      return {
        desde: this.aUtc(anio, mes, 1),
        hasta: this.aUtc(anio, mes + 1, 1),
      };
    }

    if (periodo === 'semanal') {
      // La semana va de lunes a domingo. getUTCDay da 0=domingo, así que se corre
      // para que el lunes quede en 0.
      const diaDeLaSemana = new Date(Date.UTC(anio, mes, dia)).getUTCDay();
      const desdeElLunes = (diaDeLaSemana + 6) % 7;
      return {
        desde: this.aUtc(anio, mes, dia - desdeElLunes),
        hasta: this.aUtc(anio, mes, dia - desdeElLunes + 7),
      };
    }

    return {
      desde: this.aUtc(anio, mes, dia),
      hasta: this.aUtc(anio, mes, dia + 1),
    };
  }

  private diaLocal(fechaISO?: string) {
    if (fechaISO) {
      const [anio, mes, dia] = fechaISO.split('-').map(Number);
      return { anio, mes: mes - 1, dia };
    }

    const ahoraLocal = new Date(Date.now() + OFFSET_HORAS * UNA_HORA_MS);
    return {
      anio: ahoraLocal.getUTCFullYear(),
      mes: ahoraLocal.getUTCMonth(),
      dia: ahoraLocal.getUTCDate(),
    };
  }

  // Date.UTC normaliza solo los desbordes de día y mes (por ejemplo dia = 0 o mes = 12).
  private aUtc(anio: number, mes: number, dia: number) {
    return new Date(Date.UTC(anio, mes, dia) - OFFSET_HORAS * UNA_HORA_MS);
  }
}
