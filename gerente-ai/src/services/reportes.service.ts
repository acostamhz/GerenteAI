import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from './prisma.service';
import { NegociosService } from './negocios.service';
import {
  PlanesService,
  type Funcionalidad,
} from './planes.service';

import {
  Periodo,
} from '../dto/reportes/reporte-query.dto';

const OFFSET_HORAS = -5;
const UNA_HORA_MS = 3_600_000;

interface Rango {
  desde: Date;
  hasta: Date;
}

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
  abonos: {
    id: string;
    monto: number;
    fecha: string;
  }[];
}

@Injectable()
export class ReportesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly negociosService: NegociosService,
    private readonly planes: PlanesService,
  ) {}

  async porProducto(
    sedeId: string,
    userId: string,
    rolGlobal: string,
    periodo: Periodo,
    fecha?: string,
  ) {
    const sede = await this.buscarSedeConAcceso(
      sedeId,
      userId,
      rolGlobal,
    );

    await this.exigirFuncionalidad(
      sede.negocioId,
      'reportes_por_producto',
      rolGlobal,
    );

    const rango = this.calcularRango(periodo, fecha);

    const detalles = await this.prisma.detalleVenta.findMany({
      where: {
        venta: {
          sedeId,
          fecha: {
            gte: rango.desde,
            lt: rango.hasta,
          },
        },
      },
      include: {
        producto: {
          select: {
            id: true,
            nombre: true,
            precioCompra: true,
          },
        },
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
        ingresos: previo.ingresos.add(
          detalle.precio.mul(detalle.cantidad),
        ),
        costo: previo.costo.add(
          detalle.producto.precioCompra.mul(detalle.cantidad),
        ),
        lineas: previo.lineas + 1,
      });
    }

    const totalIngresos = [...acumulado.values()].reduce(
      (suma, producto) =>
        suma.add(producto.ingresos),
      new Prisma.Decimal(0),
    );

    const productos = [...acumulado.entries()]
      .map(([id, producto]) => ({
        id,
        nombre: producto.nombre,
        unidades: producto.unidades,
        ingresos: producto.ingresos.toNumber(),
        margenEstimado: producto.ingresos
          .sub(producto.costo)
          .toNumber(),
        vecesVendido: producto.lineas,
        participacion: totalIngresos.isZero()
          ? 0
          : Number(
              producto.ingresos
                .div(totalIngresos)
                .mul(100)
                .toFixed(2),
            ),
      }))
      .sort((a, b) => b.ingresos - a.ingresos);

    return {
      periodo: this.describirPeriodo(periodo, rango),
      sede: {
        id: sede.id,
        nombre: sede.nombre,
      },
      totalIngresos: totalIngresos.toNumber(),
      productos,
      advertencia:
        'Solo incluye ventas con detalle de productos. Las registradas por WhatsApp sin desglose no aparecen.',
    };
  }

  async fiados(
    sedeId: string,
    userId: string,
    rolGlobal: string,
  ) {
    const sede = await this.buscarSedeConAcceso(
      sedeId,
      userId,
      rolGlobal,
    );

    await this.exigirFuncionalidad(
      sede.negocioId,
      'reporte_fiados',
      rolGlobal,
    );

    const ventas = await this.prisma.venta.findMany({
      where: {
        sedeId,
        saldoPendiente: {
          gt: 0,
        },
      },
      include: {
        cliente: {
          select: {
            id: true,
            nombre: true,
            telefono: true,
          },
        },
        abonos: {
          orderBy: {
            fecha: 'desc',
          },
        },
      },
      orderBy: {
        fecha: 'asc',
      },
    });

    const ahora = Date.now();

    const porCliente = new Map<
      string,
      {
        cliente: {
          id: string;
          nombre: string;
          telefono: string | null;
        };
        saldo: Prisma.Decimal;
        vencido: Prisma.Decimal;
        ventas: VentaFiadaDescrita[];
      }
    >();

    for (const venta of ventas) {
      if (!venta.cliente) {
        continue;
      }

      const detalle = this.describirVentaFiada(
        venta,
        ahora,
      );

      const previo = porCliente.get(
        venta.cliente.id,
      ) ?? {
        cliente: venta.cliente,
        saldo: new Prisma.Decimal(0),
        vencido: new Prisma.Decimal(0),
        ventas: [],
      };

      previo.saldo = previo.saldo.add(
        venta.saldoPendiente,
      );

      if (detalle.vencida) {
        previo.vencido = previo.vencido.add(
          venta.saldoPendiente,
        );
      }

      previo.ventas.push(detalle);

      porCliente.set(
        venta.cliente.id,
        previo,
      );
    }

    const clientes = [...porCliente.values()]
      .map((cliente) => ({
        ...cliente.cliente,
        saldoPendiente:
          cliente.saldo.toNumber(),
        vencido:
          cliente.vencido.toNumber(),
        diasDeLaDeudaMasAntigua:
          cliente.ventas[0]
            ?.diasDesdeLaVenta ?? 0,
        ventas: cliente.ventas,
      }))
      .sort(
        (a, b) =>
          b.vencido - a.vencido ||
          b.saldoPendiente -
            a.saldoPendiente,
      );

    return {
      sede: {
        id: sede.id,
        nombre: sede.nombre,
      },
      generadoEl:
        new Date().toISOString(),
      totales: {
        porCobrar: clientes.reduce(
          (suma, cliente) =>
            suma + cliente.saldoPendiente,
          0,
        ),
        vencido: clientes.reduce(
          (suma, cliente) =>
            suma + cliente.vencido,
          0,
        ),
        clientesConDeuda:
          clientes.length,
        ventasPendientes:
          ventas.length,
      },
      clientes,
    };
  }

  async deSede(
    sedeId: string,
    userId: string,
    rolGlobal: string,
    periodo: Periodo,
    fecha?: string,
  ) {
    const sede =
      await this.buscarSedeConAcceso(
        sedeId,
        userId,
        rolGlobal,
      );

    const rango = this.calcularRango(
      periodo,
      fecha,
    );

    const movimientos =
      await this.movimientosDeSede(
        sedeId,
        rango,
      );

    return {
      periodo:
        this.describirPeriodo(
          periodo,
          rango,
        ),
      sede: {
        id: sede.id,
        nombre: sede.nombre,
      },
      ...this.armarCifras(
        movimientos,
      ),
    };
  }

  async deNegocio(
    negocioId: string,
    userId: string,
    rolGlobal: string,
    periodo: Periodo,
    fecha?: string,
  ) {
    const negocio =
      await this.prisma.negocio.findUnique({
        where: {
          id: negocioId,
        },
      });

    if (!negocio) {
      throw new NotFoundException(
        `Negocio con id ${negocioId} no encontrado`,
      );
    }

    await this.negociosService.verificarPropietario(
      userId,
      negocioId,
      rolGlobal,
    );

    const rango =
      this.calcularRango(
        periodo,
        fecha,
      );

    const sedes =
      await this.prisma.sede.findMany({
        where: {
          negocioId,
        },
        orderBy: {
          nombre: 'asc',
        },
      });

    const movimientosPorSede =
      await Promise.all(
        sedes.map(async (sede) => ({
          sede,
          movimientos:
            await this.movimientosDeSede(
              sede.id,
              rango,
            ),
        })),
      );

    const totales =
      movimientosPorSede.reduce(
        (acumulado, { movimientos }) => ({
          ventasContado:
            acumulado.ventasContado.add(
              movimientos.ventasContado,
            ),
          ventasFiado:
            acumulado.ventasFiado.add(
              movimientos.ventasFiado,
            ),
          abonos:
            acumulado.abonos.add(
              movimientos.abonos,
            ),
          compras:
            acumulado.compras.add(
              movimientos.compras,
            ),
          gastos:
            acumulado.gastos.add(
              movimientos.gastos,
            ),
          conteos: {
            ventas:
              acumulado.conteos.ventas +
              movimientos.conteos.ventas,
            abonos:
              acumulado.conteos.abonos +
              movimientos.conteos.abonos,
            compras:
              acumulado.conteos.compras +
              movimientos.conteos.compras,
            gastos:
              acumulado.conteos.gastos +
              movimientos.conteos.gastos,
          },
        }),
        this.movimientosVacios(),
      );

    return {
      periodo:
        this.describirPeriodo(
          periodo,
          rango,
        ),

      negocio: {
        id: negocio.id,
        nombre: negocio.nombre,
      },

      ...this.armarCifras(totales),

      sedes:
        movimientosPorSede.map(
          ({ sede, movimientos }) => ({
            sede: {
              id: sede.id,
              nombre: sede.nombre,
            },
            ...this.armarCifras(
              movimientos,
            ),
          }),
        ),
    };
  }

  private async movimientosDeSede(
    sedeId: string,
    rango: Rango,
  ) {
    const filtroFecha = {
      gte: rango.desde,
      lt: rango.hasta,
    };

    const [
      ventasPorTipo,
      abonos,
      compras,
      gastos,
    ] = await Promise.all([
      this.prisma.venta.groupBy({
        by: ['tipo'],
        where: {
          sedeId,
          fecha: filtroFecha,
        },
        _sum: {
          total: true,
        },
        _count: true,
      }),

      this.prisma.abono.aggregate({
        where: {
          sedeId,
          fecha: filtroFecha,
        },
        _sum: {
          monto: true,
        },
        _count: true,
      }),

      this.prisma.compra.aggregate({
        where: {
          sedeId,
          fecha: filtroFecha,
        },
        _sum: {
          total: true,
        },
        _count: true,
      }),

      this.prisma.gasto.aggregate({
        where: {
          sedeId,
          fecha: filtroFecha,
        },
        _sum: {
          monto: true,
        },
        _count: true,
      }),
    ]);

    const contado =
      ventasPorTipo.find(
        (venta) =>
          venta.tipo === 'CONTADO',
      );

    const fiado =
      ventasPorTipo.find(
        (venta) =>
          venta.tipo === 'FIADO',
      );

    return {
      ventasContado:
        contado?._sum.total ??
        new Prisma.Decimal(0),

      ventasFiado:
        fiado?._sum.total ??
        new Prisma.Decimal(0),

      abonos:
        abonos._sum.monto ??
        new Prisma.Decimal(0),

      compras:
        compras._sum.total ??
        new Prisma.Decimal(0),

      gastos:
        gastos._sum.monto ??
        new Prisma.Decimal(0),

      conteos: {
        ventas:
          (contado?._count ?? 0) +
          (fiado?._count ?? 0),
        abonos:
          abonos._count,
        compras:
          compras._count,
        gastos:
          gastos._count,
      },
    };
  }

  private movimientosVacios() {
    return {
      ventasContado:
        new Prisma.Decimal(0),
      ventasFiado:
        new Prisma.Decimal(0),
      abonos:
        new Prisma.Decimal(0),
      compras:
        new Prisma.Decimal(0),
      gastos:
        new Prisma.Decimal(0),
      conteos: {
        ventas: 0,
        abonos: 0,
        compras: 0,
        gastos: 0,
      },
    };
  }

  private armarCifras(
    movimientos: ReturnType<
      typeof this.movimientosVacios
    >,
  ) {
    const totalIngresos =
      movimientos.ventasContado.add(
        movimientos.abonos,
      );

    const totalEgresos =
      movimientos.compras.add(
        movimientos.gastos,
      );

    return {
      ingresos: {
        ventasContado:
          movimientos.ventasContado.toNumber(),

        abonos:
          movimientos.abonos.toNumber(),

        total:
          totalIngresos.toNumber(),
      },

      egresos: {
        compras:
          movimientos.compras.toNumber(),

        gastos:
          movimientos.gastos.toNumber(),

        total:
          totalEgresos.toNumber(),
      },

      balance:
        totalIngresos
          .sub(totalEgresos)
          .toNumber(),

      informativo: {
        ventasFiado:
          movimientos.ventasFiado.toNumber(),

        ventasTotales:
          movimientos.ventasContado
            .add(
              movimientos.ventasFiado,
            )
            .toNumber(),

        conteos:
          movimientos.conteos,
      },
    };
  }

  private describirPeriodo(
    periodo: Periodo,
    rango: Rango,
  ) {
    return {
      tipo: periodo,
      desde:
        rango.desde.toISOString(),
      hasta:
        rango.hasta.toISOString(),
      zonaHoraria:
        `UTC${OFFSET_HORAS}`,
    };
  }

  private calcularRango(
    periodo: Periodo,
    fechaISO?: string,
  ): Rango {
    const {
      anio,
      mes,
      dia,
    } = this.diaLocal(fechaISO);

    if (periodo === 'mensual') {
      return {
        desde: this.aUtc(
          anio,
          mes,
          1,
        ),
        hasta: this.aUtc(
          anio,
          mes + 1,
          1,
        ),
      };
    }

    if (periodo === 'semanal') {
      const diaDeLaSemana =
        new Date(
          Date.UTC(
            anio,
            mes,
            dia,
          ),
        ).getUTCDay();

      const desdeElLunes =
        (diaDeLaSemana + 6) % 7;

      return {
        desde: this.aUtc(
          anio,
          mes,
          dia - desdeElLunes,
        ),
        hasta: this.aUtc(
          anio,
          mes,
          dia -
            desdeElLunes +
            7,
        ),
      };
    }

    return {
      desde: this.aUtc(
        anio,
        mes,
        dia,
      ),
      hasta: this.aUtc(
        anio,
        mes,
        dia + 1,
      ),
    };
  }

  private diaLocal(
    fechaISO?: string,
  ) {
    if (fechaISO) {
      const [
        anio,
        mes,
        dia,
      ] = fechaISO
        .split('-')
        .map(Number);

      return {
        anio,
        mes: mes - 1,
        dia,
      };
    }

    const ahoraLocal =
      new Date(
        Date.now() +
          OFFSET_HORAS *
            UNA_HORA_MS,
      );

    return {
      anio:
        ahoraLocal.getUTCFullYear(),
      mes:
        ahoraLocal.getUTCMonth(),
      dia:
        ahoraLocal.getUTCDate(),
    };
  }

  private aUtc(
    anio: number,
    mes: number,
    dia: number,
  ) {
    return new Date(
      Date.UTC(
        anio,
        mes,
        dia,
      ) -
        OFFSET_HORAS *
          UNA_HORA_MS,
    );
  }

  private async buscarSedeConAcceso(
    sedeId: string,
    userId: string,
    rolGlobal: string,
  ) {
    const sede =
      await this.prisma.sede.findUnique({
        where: {
          id: sedeId,
        },
      });

    if (!sede) {
      throw new NotFoundException(
        `Sede con id ${sedeId} no encontrada`,
      );
    }

    await this.negociosService.verificarAccesoSede(
      userId,
      sede,
      rolGlobal,
    );

    return sede;
  }

  private async exigirFuncionalidad(
    negocioId: string,
    funcionalidad: Funcionalidad,
    rolGlobal: string,
  ) {
    if (rolGlobal === 'MASTER') {
      return;
    }

    const negocio =
      await this.prisma.negocio.findUnique({
        where: {
          id: negocioId,
        },
      });

    if (!negocio) {
      throw new NotFoundException(
        'El negocio de esta sede ya no existe',
      );
    }

    if (
      !this.planes.tieneFuncionalidad(
        negocio.plan,
        negocio.planVenceEl,
        funcionalidad,
      )
    ) {
      const estado =
        this.planes.estado(
          negocio.plan,
          negocio.planVenceEl,
        );

      const motivo =
        estado.vencido
          ? `El plan ${estado.contratado.nombre} está vencido`
          : `El plan ${estado.vigente.nombre} no incluye esta función`;

      throw new ForbiddenException(
        `${motivo}. Necesitas el plan Gerente o Administrador para consultar este reporte.`,
      );
    }
  }

  private describirVentaFiada(
    venta: {
      id: string;
      fecha: Date;
      total: Prisma.Decimal;
      saldoPendiente: Prisma.Decimal;
      fechaVencimiento: Date | null;
      abonos: {
        id: string;
        monto: Prisma.Decimal;
        fecha: Date;
      }[];
    },
    ahora: number,
  ): VentaFiadaDescrita {
    const vencida =
      venta.fechaVencimiento !== null &&
      venta.fechaVencimiento.getTime() <
        ahora;

    return {
      id: venta.id,
      fecha:
        venta.fecha.toISOString(),
      total:
        venta.total.toNumber(),
      saldoPendiente:
        venta.saldoPendiente.toNumber(),
      abonado:
        venta.total
          .sub(venta.saldoPendiente)
          .toNumber(),

      fechaVencimiento:
        venta.fechaVencimiento
          ?.toISOString() ?? null,

      vencida,

      diasDesdeLaVenta:
        Math.floor(
          (ahora -
            venta.fecha.getTime()) /
            86_400_000,
        ),

      diasDeAtraso:
        vencida &&
        venta.fechaVencimiento
          ? Math.floor(
              (ahora -
                venta.fechaVencimiento.getTime()) /
                86_400_000,
            )
          : 0,

      abonos:
        venta.abonos.map(
          (abono) => ({
            id: abono.id,
            monto:
              abono.monto.toNumber(),
            fecha:
              abono.fecha.toISOString(),
          }),
        ),
    };
  }
}