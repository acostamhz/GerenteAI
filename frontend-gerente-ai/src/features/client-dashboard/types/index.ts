export type PeriodoTipo = 'diario' | 'semanal' | 'mensual';

export interface ReportePeriodoInfo {
  tipo: PeriodoTipo;
  desde: string;
  hasta: string;
  zonaHoraria: string;
}

export interface CifrasIngresos {
  ventasContado: number;
  abonos: number;
  total: number;
}

export interface CifrasEgresos {
  compras: number;
  gastos: number;
  total: number;
}

export interface ConteosTransacciones {
  ventas: number;
  abonos: number;
  compras: number;
  gastos: number;
}

export interface CifrasInformativo {
  ventasFiado: number;
  ventasTotales: number;
  conteos: ConteosTransacciones;
}

export interface SedeReporteItem {
  sede: {
    id: string;
    nombre: string;
  };
  ingresos: CifrasIngresos;
  egresos: CifrasEgresos;
  balance: number;
  informativo: CifrasInformativo;
}

export interface ReporteFinanciero {
  periodo: ReportePeriodoInfo;
  negocio?: {
    id: string;
    nombre: string;
  };
  sede?: {
    id: string;
    nombre: string;
  };
  ingresos: CifrasIngresos;
  egresos: CifrasEgresos;
  balance: number;
  informativo: CifrasInformativo;
  sedes?: SedeReporteItem[];
}

export interface DashboardTransactionItem {
  id: string;
  type: 'Venta' | 'Gasto' | 'Convertida';
  amount: number;
  amountFormatted: string;
  paymentMethod: string;
  pmDetails?: string;
  status: string;
  activity: string;
  personName: string;
  date: string;
  rawDate: string;
}
