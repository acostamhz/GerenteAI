import { PlanBackend, CicloFacturacion } from '@/shared/api/planesApi';

export type MetodoPagoWompi = 'CARD' | 'PSE' | 'NEQUI' | 'BANCOLOMBIA_TRANSFER';

export type TipoDocumento = 'CC' | 'NIT' | 'CE' | 'PPN';
export type TipoPersonaPse = '0' | '1'; // 0 = Natural, 1 = Jurídica

export interface DatosFacturacion {
  nombreCompleto: string;
  email: string;
  telefono: string;
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
}

export interface DatosTarjeta {
  numero: string;
  nombreTitular: string;
  expiracion: string; // MM/AA
  cvv: string;
  cuotas: number;
}

export interface DatosPse {
  bancoCodigo: string;
  tipoPersona: TipoPersonaPse;
}

export interface DatosNequi {
  telefonoNequi: string;
}

export interface CheckoutPayload {
  negocioId: string;
  plan: PlanBackend;
  ciclo: CicloFacturacion;
  metodo: MetodoPagoWompi;
  facturacion: DatosFacturacion;
  tarjeta?: DatosTarjeta;
  pse?: DatosPse;
  nequi?: DatosNequi;
}

export interface ResultadoTransaccionWompi {
  idTransaccion: string;
  referencia: string;
  estado: 'APROBADA' | 'RECHAZADA' | 'PENDIENTE';
  montoEnCentavos: number;
  moneda: 'COP';
  fecha: string;
  metodoPago: MetodoPagoWompi;
  planId: number;
  planNombre: string;
  ciclo: CicloFacturacion;
  mensaje: string;
}

export interface BancoPse {
  codigo: string;
  nombre: string;
}
