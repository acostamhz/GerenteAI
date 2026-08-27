export const AREA_DATA = [
  { mes: "Ene", ventas: 45200, gastos: 32100 },
  { mes: "Feb", ventas: 52800, gastos: 35600 },
  { mes: "Mar", ventas: 48300, gastos: 33200 },
  { mes: "Abr", ventas: 61500, gastos: 38900 },
  { mes: "May", ventas: 58200, gastos: 36800 },
  { mes: "Jun", ventas: 71500, gastos: 42300 },
  { mes: "Jul", ventas: 68900, gastos: 41200 },
];

export const INSIGHTS_DATA = [
  {
    id: 1,
    type: "warning" as const,
    title: "Gasto en proveedores +23%",
    body: "Tus costos de inventario subieron $4,200 esta semana. Considera renegociar condiciones con Proveedor Meza antes del próximo pedido.",
    time: "Hace 2h",
    read: false,
  },
  {
    id: 2,
    type: "success" as const,
    title: "Flujo de caja positivo",
    body: "Tienes $12,400 de liquidez para los próximos 14 días. Es un buen momento para invertir en publicidad o reponer inventario de alta rotación.",
    time: "Hace 5h",
    read: false,
  },
  {
    id: 4,
    type: "success" as const,
    title: "Mejor semana del trimestre",
    body: "Las ventas del lunes superaron en 31% el promedio histórico. Jueves y viernes fueron tus días pico — considera ampliar horario esos días.",
    time: "Ayer",
    read: true,
  },
  {
    id: 5,
    type: "warning" as const,
    title: "Margen en productos lácteos cayó",
    body: "El margen bajó de 28% a 19%. El precio de compra subió pero no has ajustado el precio de venta al público.",
    time: "Hace 2 días",
    read: true,
  },
];

export const CASHFLOW_DATA = [
  { fecha: "15 Jul", concepto: "Venta mostrador — Cliente Ramírez", categoria: "Venta directa", monto: 4800, tipo: "ingreso" as const },
  { fecha: "15 Jul", concepto: "Compra inventario — Dist. Norte", categoria: "Proveedor", monto: -2150, tipo: "gasto" as const },
  { fecha: "14 Jul", concepto: "Venta online — Mercado Libre", categoria: "E-commerce", monto: 1340, tipo: "ingreso" as const },
  { fecha: "14 Jul", concepto: "Renta local julio", categoria: "Operativo", monto: -4500, tipo: "gasto" as const },
  { fecha: "14 Jul", concepto: "Venta mostrador — Cliente López", categoria: "Venta directa", monto: 2200, tipo: "ingreso" as const },
  { fecha: "13 Jul", concepto: "Nómina semanal", categoria: "Personal", monto: -5600, tipo: "gasto" as const },
  { fecha: "13 Jul", concepto: "Venta mayoreo — Tienda XYZ", categoria: "Mayoreo", monto: 9800, tipo: "ingreso" as const },
  { fecha: "12 Jul", concepto: "Publicidad Meta Ads", categoria: "Marketing", monto: -1200, tipo: "gasto" as const },
  { fecha: "12 Jul", concepto: "Venta mostrador — Cliente García", categoria: "Venta directa", monto: 3100, tipo: "ingreso" as const },
  { fecha: "11 Jul", concepto: "Servicios (agua, luz, internet)", categoria: "Operativo", monto: -780, tipo: "gasto" as const },
];
