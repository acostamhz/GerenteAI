import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from './prisma.service';
import { NegociosService } from './negocios.service';
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

@Injectable()
export class ReportesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly negociosService: NegociosService,
  ) {}

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
