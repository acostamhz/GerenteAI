import ExcelJS from 'exceljs';
import type { DatosContables } from '../api/contabilidadApi';

/**
 * Arma el libro contable del negocio en Excel.
 *
 * Criterio contable: **base caja**. Se considera ingreso el dinero que entró
 * (ventas de contado y abonos de clientes), no la venta facturada. Una venta a
 * crédito no es caja: aparece aparte, como informativa, y su saldo vive en
 * Cuentas por Cobrar. Mezclarlas infla los ingresos y es el error que más se ve
 * en las planillas hechas a mano.
 *
 * El rango de fechas filtra los MOVIMIENTOS. El inventario y las cuentas por
 * cobrar son una foto de hoy: son saldos, no flujos, y no tendría sentido
 * "filtrarlos por fecha".
 */

export interface RangoFechas {
  desde: Date | null;
  hasta: Date | null;
  etiqueta: string;
}

export interface Contexto {
  negocio: string;
  rango: RangoFechas;
  datos: DatosContables;
}

// ---------------------------------------------------------------- estilo

const VERDE = 'FF059669';
const VERDE_SUAVE = 'FFECFDF5';
const GRIS_TITULO = 'FF111827';
const GRIS_BORDE = 'FFE5E7EB';
const ROJO = 'FFDC2626';

const MONEDA = '"$"#,##0;[Red]-"$"#,##0';
const FECHA = 'dd/mm/yyyy';

const BORDE_SUAVE: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: GRIS_BORDE } },
  left: { style: 'thin', color: { argb: GRIS_BORDE } },
  bottom: { style: 'thin', color: { argb: GRIS_BORDE } },
  right: { style: 'thin', color: { argb: GRIS_BORDE } },
};

/** Cabecera de hoja: nombre del negocio, título y periodo. */
function encabezado(
  ws: ExcelJS.Worksheet,
  titulo: string,
  ctx: Contexto,
  columnas: number,
): number {
  const ultima = String.fromCharCode(64 + columnas);

  ws.mergeCells(`A1:${ultima}1`);
  const t = ws.getCell('A1');
  t.value = titulo;
  t.font = { size: 18, bold: true, color: { argb: 'FFFFFFFF' } };
  t.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GRIS_TITULO } };
  t.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  ws.getRow(1).height = 34;

  ws.mergeCells(`A2:${ultima}2`);
  const s = ws.getCell('A2');
  s.value = `${ctx.negocio}   ·   ${ctx.rango.etiqueta}`;
  s.font = { size: 10, color: { argb: 'FF6B7280' } };
  s.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: VERDE_SUAVE } };
  s.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  ws.getRow(2).height = 20;

  ws.getRow(3).height = 8;
  return 4;
}

/** Fila de títulos de una tabla, con filtro y paneles congelados. */
function tabla(
  ws: ExcelJS.Worksheet,
  fila: number,
  columnas: { titulo: string; ancho: number; formato?: string }[],
): void {
  const row = ws.getRow(fila);

  columnas.forEach((col, i) => {
    const celda = row.getCell(i + 1);
    celda.value = col.titulo;
    celda.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: VERDE } };
    celda.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    celda.border = BORDE_SUAVE;

    ws.getColumn(i + 1).width = col.ancho;
    if (col.formato) ws.getColumn(i + 1).numFmt = col.formato;
  });

  row.height = 24;
  ws.views = [{ state: 'frozen', ySplit: fila }];
  ws.autoFilter = {
    from: { row: fila, column: 1 },
    to: { row: fila, column: columnas.length },
  };
}

/** Filas de datos con cebra, para que la vista no se pierda de renglón. */
function filas(
  ws: ExcelJS.Worksheet,
  desde: number,
  datos: (string | number | Date | null)[][],
): number {
  datos.forEach((valores, i) => {
    const row = ws.getRow(desde + i);
    valores.forEach((valor, c) => {
      const celda = row.getCell(c + 1);
      celda.value = valor;
      celda.border = BORDE_SUAVE;
      celda.alignment = { vertical: 'middle', indent: 1 };
      if (i % 2 === 1) {
        celda.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF9FAFB' },
        };
      }
    });
  });

  return desde + datos.length;
}

/** Fila de total: fondo verde suave y negrita. */
function total(
  ws: ExcelJS.Worksheet,
  fila: number,
  etiqueta: string,
  valor: number,
  columnaValor: number,
): void {
  const row = ws.getRow(fila);
  const celdaEtiqueta = row.getCell(1);
  celdaEtiqueta.value = etiqueta;
  celdaEtiqueta.font = { bold: true, size: 11 };

  const celdaValor = row.getCell(columnaValor);
  celdaValor.value = valor;
  celdaValor.font = { bold: true, size: 11 };
  celdaValor.numFmt = MONEDA;

  for (let c = 1; c <= columnaValor; c++) {
    row.getCell(c).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: VERDE_SUAVE },
    };
    row.getCell(c).border = BORDE_SUAVE;
    row.getCell(c).alignment = { vertical: 'middle', indent: 1 };
  }
  row.height = 22;
}

// ---------------------------------------------------------------- datos

const num = (v: number | string): number => Number(v) || 0;

const CATEGORIAS: Record<string, string> = {
  ARRIENDO: 'Arriendo',
  SERVICIOS: 'Servicios públicos',
  NOMINA: 'Nómina',
  TRANSPORTE: 'Transporte',
  OTROS: 'Otros gastos',
};

interface Movimiento {
  fecha: Date;
  tipo: string;
  categoria: string;
  descripcion: string;
  contraparte: string;
  entrada: number;
  salida: number;
  sede: string;
}

function construirMovimientos(ctx: Contexto): Movimiento[] {
  const { datos } = ctx;

  const sede = new Map(datos.sedes.map((s) => [s.id, s.nombre]));
  const cliente = new Map(datos.clientes.map((c) => [c.id, c.nombre]));
  const proveedor = new Map(datos.proveedores.map((p) => [p.id, p.nombre]));

  const dentro = (fecha: string): boolean => {
    const f = new Date(fecha);
    if (ctx.rango.desde && f < ctx.rango.desde) return false;
    if (ctx.rango.hasta && f > ctx.rango.hasta) return false;
    return true;
  };

  const movimientos: Movimiento[] = [];

  for (const v of datos.ventas) {
    if (!dentro(v.fecha)) continue;
    const esCredito = v.tipo === 'FIADO';
    movimientos.push({
      fecha: new Date(v.fecha),
      tipo: esCredito ? 'Venta a crédito' : 'Venta de contado',
      categoria: 'Ingresos por ventas',
      descripcion: esCredito
        ? 'Venta a crédito (no ingresa a caja hasta el abono)'
        : 'Venta de contado',
      contraparte: v.clienteId
        ? (cliente.get(v.clienteId) ?? 'Cliente')
        : 'Cliente general',
      // Una venta fiada no es caja: se muestra pero no suma.
      entrada: esCredito ? 0 : num(v.total),
      salida: 0,
      sede: sede.get(v.sedeId) ?? '',
    });
  }

  for (const a of datos.abonos) {
    if (!dentro(a.fecha)) continue;
    movimientos.push({
      fecha: new Date(a.fecha),
      tipo: 'Abono de cliente',
      categoria: 'Recaudo de cartera',
      descripcion: 'Abono a una venta a crédito',
      contraparte: cliente.get(a.clienteId) ?? 'Cliente',
      entrada: num(a.monto),
      salida: 0,
      sede: sede.get(a.sedeId) ?? '',
    });
  }

  for (const c of datos.compras) {
    if (!dentro(c.fecha)) continue;
    movimientos.push({
      fecha: new Date(c.fecha),
      tipo: 'Compra',
      categoria: 'Costo de mercancía',
      descripcion: 'Compra de mercancía a proveedor',
      contraparte: c.proveedorId
        ? (proveedor.get(c.proveedorId) ?? 'Proveedor')
        : 'Proveedor',
      entrada: 0,
      salida: num(c.total),
      sede: sede.get(c.sedeId) ?? '',
    });
  }

  for (const g of datos.gastos) {
    if (!dentro(g.fecha)) continue;
    movimientos.push({
      fecha: new Date(g.fecha),
      tipo: 'Gasto',
      categoria: CATEGORIAS[g.categoria] ?? g.categoria,
      descripcion: g.descripcion,
      contraparte: '',
      entrada: 0,
      salida: num(g.monto),
      sede: sede.get(g.sedeId) ?? '',
    });
  }

  return movimientos.sort((a, b) => a.fecha.getTime() - b.fecha.getTime());
}

// ---------------------------------------------------------------- hojas

function hojaResumen(
  wb: ExcelJS.Workbook,
  ctx: Contexto,
  movimientos: Movimiento[],
): void {
  const ws = wb.addWorksheet('Resumen', {
    properties: { tabColor: { argb: VERDE } },
  });

  let fila = encabezado(ws, 'Estado de resultados', ctx, 4);

  const suma = (filtro: (m: Movimiento) => boolean, campo: 'entrada' | 'salida') =>
    movimientos.filter(filtro).reduce((t, m) => t + m[campo], 0);

  const ventasContado = suma((m) => m.tipo === 'Venta de contado', 'entrada');
  const recaudos = suma((m) => m.tipo === 'Abono de cliente', 'entrada');
  const compras = suma((m) => m.tipo === 'Compra', 'salida');
  const gastos = suma((m) => m.tipo === 'Gasto', 'salida');
  const creditoTotal = ctx.datos.ventas
    .filter((v) => v.tipo === 'FIADO')
    .reduce((t, v) => t + num(v.total), 0);

  ws.getColumn(1).width = 42;
  ws.getColumn(2).width = 18;
  ws.getColumn(3).width = 4;
  ws.getColumn(4).width = 60;

  const lineas: [string, number | null, string][] = [
    ['INGRESOS DE CAJA', null, ''],
    ['Ventas de contado', ventasContado, 'Dinero recibido en el momento de la venta'],
    ['Abonos de clientes', recaudos, 'Recaudo de ventas a crédito de periodos anteriores'],
    ['Total ingresos', ventasContado + recaudos, ''],
    ['', null, ''],
    ['EGRESOS', null, ''],
    ['Costo de mercancía (compras)', compras, 'Lo que costó lo que se vende'],
    ['Gastos operativos', gastos, 'Arriendo, nómina, servicios, transporte y otros'],
    ['Total egresos', compras + gastos, ''],
    ['', null, ''],
    ['UTILIDAD DEL PERIODO', ventasContado + recaudos - compras - gastos, 'Ingresos de caja menos egresos'],
  ];

  for (const [etiqueta, valor, nota] of lineas) {
    const row = ws.getRow(fila);
    const esTitulo = valor === null && etiqueta !== '';
    const esTotal = etiqueta.startsWith('Total') || etiqueta.startsWith('UTILIDAD');

    row.getCell(1).value = etiqueta;
    row.getCell(1).font = {
      bold: esTitulo || esTotal,
      size: esTitulo ? 12 : 11,
      color: { argb: esTitulo ? VERDE : GRIS_TITULO },
    };
    row.getCell(1).alignment = { vertical: 'middle', indent: esTitulo || esTotal ? 1 : 2 };

    if (valor !== null) {
      const celda = row.getCell(2);
      celda.value = valor;
      celda.numFmt = MONEDA;
      celda.font = { bold: esTotal, size: 11 };
      celda.alignment = { vertical: 'middle', horizontal: 'right' };
    }

    row.getCell(4).value = nota;
    row.getCell(4).font = { size: 9, color: { argb: 'FF9CA3AF' }, italic: true };
    row.getCell(4).alignment = { vertical: 'middle' };

    if (esTotal) {
      for (let c = 1; c <= 2; c++) {
        row.getCell(c).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: VERDE_SUAVE },
        };
        row.getCell(c).border = BORDE_SUAVE;
      }
    }

    row.height = 20;
    fila++;
  }

  fila += 1;

  // Informativo: lo que se vendió a crédito no es caja, pero hay que verlo.
  const info = ws.getRow(fila);
  info.getCell(1).value = 'INFORMATIVO (no afecta la utilidad de caja)';
  info.getCell(1).font = { bold: true, size: 12, color: { argb: VERDE } };
  fila++;

  const informativos: [string, number, string][] = [
    [
      'Ventas a crédito del periodo',
      creditoTotal,
      'Ya vendido, todavía sin cobrar',
    ],
    [
      'Cuentas por cobrar a hoy',
      ctx.datos.clientes.reduce((t, c) => t + num(c.saldoPendiente), 0),
      'Saldo acumulado de todos los clientes',
    ],
    [
      'Inventario valorizado a hoy',
      ctx.datos.productos.reduce(
        (t, p) => t + p.stock * num(p.precioCompra),
        0,
      ),
      'Stock actual al precio de compra',
    ],
  ];

  for (const [etiqueta, valor, nota] of informativos) {
    const row = ws.getRow(fila);
    row.getCell(1).value = etiqueta;
    row.getCell(1).alignment = { vertical: 'middle', indent: 2 };
    row.getCell(2).value = valor;
    row.getCell(2).numFmt = MONEDA;
    row.getCell(2).alignment = { vertical: 'middle', horizontal: 'right' };
    row.getCell(4).value = nota;
    row.getCell(4).font = { size: 9, color: { argb: 'FF9CA3AF' }, italic: true };
    row.height = 20;
    fila++;
  }

  fila += 2;
  const pie = ws.getRow(fila);
  pie.getCell(1).value = `Generado por Luka AI el ${new Date().toLocaleString('es-CO')}`;
  pie.getCell(1).font = { size: 9, color: { argb: 'FF9CA3AF' }, italic: true };
  fila++;
  const nota = ws.getRow(fila);
  nota.getCell(1).value =
    'Criterio: base caja. Una venta a crédito se registra como ingreso cuando el cliente abona, no cuando se vende.';
  nota.getCell(1).font = { size: 9, color: { argb: 'FF9CA3AF' }, italic: true };
}

function hojaMovimientos(
  wb: ExcelJS.Workbook,
  ctx: Contexto,
  movimientos: Movimiento[],
): void {
  const ws = wb.addWorksheet('Movimientos');
  const fila = encabezado(ws, 'Libro de movimientos', ctx, 8);

  tabla(ws, fila, [
    { titulo: 'Fecha', ancho: 13, formato: FECHA },
    { titulo: 'Tipo', ancho: 20 },
    { titulo: 'Categoría', ancho: 22 },
    { titulo: 'Descripción', ancho: 42 },
    { titulo: 'Cliente / Proveedor', ancho: 26 },
    { titulo: 'Entrada', ancho: 16, formato: MONEDA },
    { titulo: 'Salida', ancho: 16, formato: MONEDA },
    { titulo: 'Sede', ancho: 20 },
  ]);

  const siguiente = filas(
    ws,
    fila + 1,
    movimientos.map((m) => [
      m.fecha,
      m.tipo,
      m.categoria,
      m.descripcion,
      m.contraparte,
      m.entrada || null,
      m.salida || null,
      m.sede,
    ]),
  );

  const entradas = movimientos.reduce((t, m) => t + m.entrada, 0);
  const salidas = movimientos.reduce((t, m) => t + m.salida, 0);

  const row = ws.getRow(siguiente);
  row.getCell(1).value = `TOTALES (${movimientos.length} movimientos)`;
  row.getCell(1).font = { bold: true };
  row.getCell(6).value = entradas;
  row.getCell(6).numFmt = MONEDA;
  row.getCell(6).font = { bold: true };
  row.getCell(7).value = salidas;
  row.getCell(7).numFmt = MONEDA;
  row.getCell(7).font = { bold: true, color: { argb: ROJO } };
  for (let c = 1; c <= 8; c++) {
    row.getCell(c).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: VERDE_SUAVE },
    };
    row.getCell(c).border = BORDE_SUAVE;
  }
  row.height = 22;
}

function hojaBalance(wb: ExcelJS.Workbook, ctx: Contexto): void {
  const ws = wb.addWorksheet('Balance');
  let fila = encabezado(ws, 'Situación a la fecha', ctx, 4);

  ws.getColumn(1).width = 42;
  ws.getColumn(2).width = 18;
  ws.getColumn(3).width = 4;
  ws.getColumn(4).width = 60;

  const inventario = ctx.datos.productos.reduce(
    (t, p) => t + p.stock * num(p.precioCompra),
    0,
  );
  const porCobrar = ctx.datos.clientes.reduce(
    (t, c) => t + num(c.saldoPendiente),
    0,
  );

  const bloques: [string, [string, number, string][]][] = [
    [
      'ACTIVOS',
      [
        ['Inventario (stock al costo)', inventario, 'Unidades en stock × precio de compra'],
        ['Cuentas por cobrar', porCobrar, 'Lo que los clientes deben por ventas fiadas'],
      ],
    ],
    [
      'PASIVOS',
      [
        [
          'Cuentas por pagar',
          0,
          'El sistema todavía no registra deudas con proveedores',
        ],
      ],
    ],
  ];

  for (const [titulo, lineas] of bloques) {
    const cab = ws.getRow(fila);
    cab.getCell(1).value = titulo;
    cab.getCell(1).font = { bold: true, size: 12, color: { argb: VERDE } };
    cab.height = 22;
    fila++;

    for (const [etiqueta, valor, nota] of lineas) {
      const row = ws.getRow(fila);
      row.getCell(1).value = etiqueta;
      row.getCell(1).alignment = { vertical: 'middle', indent: 2 };
      row.getCell(2).value = valor;
      row.getCell(2).numFmt = MONEDA;
      row.getCell(2).alignment = { vertical: 'middle', horizontal: 'right' };
      row.getCell(4).value = nota;
      row.getCell(4).font = { size: 9, color: { argb: 'FF9CA3AF' }, italic: true };
      row.height = 20;
      fila++;
    }

    const suma = lineas.reduce((t, [, v]) => t + v, 0);
    total(ws, fila, `Total ${titulo.toLowerCase()}`, suma, 2);
    fila += 2;
  }

  total(ws, fila, 'PATRIMONIO (activos − pasivos)', inventario + porCobrar, 2);
  fila += 2;

  const nota = ws.getRow(fila);
  nota.getCell(1).value =
    'Balance simplificado: incluye únicamente lo que el sistema registra hoy (inventario y cartera). No contempla efectivo en caja, bancos, activos fijos ni obligaciones financieras.';
  nota.getCell(1).font = { size: 9, color: { argb: 'FF9CA3AF' }, italic: true };
  ws.mergeCells(`A${fila}:D${fila}`);
  nota.height = 30;
  nota.getCell(1).alignment = { wrapText: true, vertical: 'middle' };
}

function hojaCartera(wb: ExcelJS.Workbook, ctx: Contexto): void {
  const deudores = ctx.datos.clientes
    .filter((c) => num(c.saldoPendiente) > 0)
    .sort((a, b) => num(b.saldoPendiente) - num(a.saldoPendiente));

  const ws = wb.addWorksheet('Cuentas por cobrar');
  const fila = encabezado(ws, 'Cartera de clientes', ctx, 4);
  const sede = new Map(ctx.datos.sedes.map((s) => [s.id, s.nombre]));

  tabla(ws, fila, [
    { titulo: 'Cliente', ancho: 34 },
    { titulo: 'Teléfono', ancho: 20 },
    { titulo: 'Saldo pendiente', ancho: 18, formato: MONEDA },
    { titulo: 'Sede', ancho: 22 },
  ]);

  const siguiente = filas(
    ws,
    fila + 1,
    deudores.map((c) => [
      c.nombre,
      c.telefono ?? '',
      num(c.saldoPendiente),
      sede.get(c.sedeId) ?? '',
    ]),
  );

  total(
    ws,
    siguiente,
    `TOTAL POR COBRAR (${deudores.length} clientes)`,
    deudores.reduce((t, c) => t + num(c.saldoPendiente), 0),
    3,
  );
}

function hojaInventario(wb: ExcelJS.Workbook, ctx: Contexto): void {
  const ws = wb.addWorksheet('Inventario');
  const fila = encabezado(ws, 'Inventario a la fecha', ctx, 7);
  const sede = new Map(ctx.datos.sedes.map((s) => [s.id, s.nombre]));

  tabla(ws, fila, [
    { titulo: 'Producto', ancho: 34 },
    { titulo: 'Stock', ancho: 10 },
    { titulo: 'Stock mínimo', ancho: 14 },
    { titulo: 'Costo unitario', ancho: 16, formato: MONEDA },
    { titulo: 'Precio de venta', ancho: 16, formato: MONEDA },
    { titulo: 'Valor en inventario', ancho: 20, formato: MONEDA },
    { titulo: 'Sede', ancho: 22 },
  ]);

  const ordenados = [...ctx.datos.productos].sort(
    (a, b) => b.stock * num(b.precioCompra) - a.stock * num(a.precioCompra),
  );

  const siguiente = filas(
    ws,
    fila + 1,
    ordenados.map((p) => [
      p.nombre,
      p.stock,
      p.stockMinimo,
      num(p.precioCompra),
      num(p.precioVenta),
      p.stock * num(p.precioCompra),
      sede.get(p.sedeId) ?? '',
    ]),
  );

  // Rojo para lo que está por debajo del mínimo: es lo que hay que reponer.
  ordenados.forEach((p, i) => {
    if (p.stock <= p.stockMinimo) {
      const celda = ws.getRow(fila + 1 + i).getCell(2);
      celda.font = { bold: true, color: { argb: ROJO } };
    }
  });

  total(
    ws,
    siguiente,
    `VALOR TOTAL DEL INVENTARIO (${ordenados.length} productos)`,
    ordenados.reduce((t, p) => t + p.stock * num(p.precioCompra), 0),
    6,
  );
}

function hojaCategorias(
  wb: ExcelJS.Workbook,
  ctx: Contexto,
  movimientos: Movimiento[],
): void {
  const ws = wb.addWorksheet('Gastos por categoría');
  const fila = encabezado(ws, 'Egresos agrupados', ctx, 3);

  const acumulado = new Map<string, { total: number; cantidad: number }>();
  for (const m of movimientos) {
    if (m.salida <= 0) continue;
    const actual = acumulado.get(m.categoria) ?? { total: 0, cantidad: 0 };
    actual.total += m.salida;
    actual.cantidad += 1;
    acumulado.set(m.categoria, actual);
  }

  const ordenado = [...acumulado.entries()].sort((a, b) => b[1].total - a[1].total);
  const suma = ordenado.reduce((t, [, v]) => t + v.total, 0);

  tabla(ws, fila, [
    { titulo: 'Categoría', ancho: 30 },
    { titulo: 'Movimientos', ancho: 14 },
    { titulo: 'Total', ancho: 18, formato: MONEDA },
    { titulo: '% del gasto', ancho: 14 },
  ]);

  const siguiente = filas(
    ws,
    fila + 1,
    ordenado.map(([categoria, v]) => [
      categoria,
      v.cantidad,
      v.total,
      suma > 0 ? `${Math.round((v.total / suma) * 100)}%` : '0%',
    ]),
  );

  total(ws, siguiente, 'TOTAL EGRESOS', suma, 3);
}

// ---------------------------------------------------------------- salida

/**
 * Arma el libro en memoria. Separado de la descarga para poder generarlo y
 * revisarlo fuera del navegador, sin depender del DOM.
 */
export function construirLibro(ctx: Contexto): ExcelJS.Workbook {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Luka AI';
  wb.created = new Date();

  const movimientos = construirMovimientos(ctx);

  hojaResumen(wb, ctx, movimientos);
  hojaMovimientos(wb, ctx, movimientos);
  hojaBalance(wb, ctx);
  hojaCartera(wb, ctx);
  hojaInventario(wb, ctx);
  hojaCategorias(wb, ctx, movimientos);

  return wb;
}

export async function descargarLibroContable(ctx: Contexto): Promise<void> {
  const wb = construirLibro(ctx);

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const nombre = `Contabilidad ${ctx.negocio} - ${ctx.rango.etiqueta}.xlsx`
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, ' ');

  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombre;
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  URL.revokeObjectURL(url);
}
