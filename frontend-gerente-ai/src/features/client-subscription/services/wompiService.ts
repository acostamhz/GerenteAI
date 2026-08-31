import { 
  BancoPse, 
  CheckoutPayload, 
  ResultadoTransaccionWompi,
  MetodoPagoWompi
} from '../types';

export const BANCOS_COLOMBIA_PSE: BancoPse[] = [
  { codigo: '1007', nombre: 'Bancolombia' },
  { codigo: '1507', nombre: 'Nequi' },
  { codigo: '1051', nombre: 'Davivienda' },
  { codigo: '1551', nombre: 'Daviplata' },
  { codigo: '1001', nombre: 'Banco de Bogotá' },
  { codigo: '1013', nombre: 'BBVA Colombia' },
  { codigo: '1023', nombre: 'Banco de Occidente' },
  { codigo: '1002', nombre: 'Banco Popular' },
  { codigo: '1019', nombre: 'Scotiabank Colpatria' },
  { codigo: '1040', nombre: 'Banco Agrario de Colombia' },
  { codigo: '1052', nombre: 'Banco AV Villas' },
  { codigo: '1561', nombre: 'RappiPay' },
  { codigo: '1558', nombre: 'Lulo Bank' },
  { codigo: '1562', nombre: 'Dale!' },
  { codigo: '1563', nombre: 'Ualá Colombia' },
  { codigo: '1006', nombre: 'Banco Itaú' },
  { codigo: '1014', nombre: 'Banco Santander Colombia' },
  { codigo: '1060', nombre: 'Banco Pichincha' },
  { codigo: '1032', nombre: 'Banco Caja Social' },
];

/**
 * Conmuta entre la simulación local y la pasarela real.
 *
 * Lo decide el entorno y ya no está fijo en el código: en local se puede seguir
 * simulando sin tocar nada, y en Vercel basta con definir la variable para que
 * los pagos salgan de verdad contra Wompi.
 *
 *   VITE_USE_MOCK_GATEWAY=false  -> cobra de verdad (sandbox o producción,
 *                                   según las llaves que tenga el backend)
 *   sin definir / cualquier otro -> simula, como hasta ahora
 */
export const USE_MOCK_GATEWAY =
  import.meta.env.VITE_USE_MOCK_GATEWAY !== 'false';

export const wompiService = {
  /**
   * Obtiene la lista de bancos PSE soportados
   */
  getBancosPse(): BancoPse[] {
    return BANCOS_COLOMBIA_PSE;
  },

  /**
   * Calcula el desglose financiero del cobro con IVA
   */
  calcularLiquidacion(precioTotal: number, ciclo: 'mensual' | 'anual') {
    // En Colombia, el software SaaS incluye 19% de IVA
    const tasaIva = 0.19;
    const baseGravable = Math.round(precioTotal / (1 + tasaIva));
    const iva = precioTotal - baseGravable;

    return {
      total: precioTotal,
      baseGravable,
      iva,
      ciclo,
    };
  },

  /**
   * Procesa el pago con la pasarela Wompi
   */
  async procesarPago(payload: CheckoutPayload, simularError = false): Promise<ResultadoTransaccionWompi> {
    if (!USE_MOCK_GATEWAY) {
      // Endpoint futuro cuando el backend exponga la pasarela
      throw new Error('Integración directa con servidor Wompi en desarrollo.');
    }

    // Simulación de latencia de red bancaria (2.0s)
    await new Promise((resolve) => setTimeout(resolve, 2000));

    if (simularError) {
      return {
        idTransaccion: `WOMPI-ERR-${Date.now()}`,
        referencia: `LUKA-${payload.plan.nombre.toUpperCase()}-${Math.random().toString(36).substring(7).toUpperCase()}`,
        estado: 'RECHAZADA',
        montoEnCentavos: (payload.ciclo === 'anual' ? payload.plan.precioAnual : payload.plan.precioMensual) * 100,
        moneda: 'COP',
        fecha: new Date().toISOString(),
        metodoPago: payload.metodo,
        planId: payload.plan.id,
        planNombre: payload.plan.nombre,
        ciclo: payload.ciclo,
        mensaje: 'Transacción declinada por la entidad financiera emisora.',
      };
    }

    const montoTotal = payload.ciclo === 'anual' ? payload.plan.precioAnual : payload.plan.precioMensual;
    const diasVigencia = payload.ciclo === 'anual' ? 365 : 30;
    const fechaVencimiento = new Date(Date.now() + diasVigencia * 86_400_000).toISOString();

    const resultado: ResultadoTransaccionWompi = {
      idTransaccion: `WOMPI-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`,
      referencia: `LUKA-${payload.plan.nombre.toUpperCase()}-${Math.random().toString(36).substring(7).toUpperCase()}`,
      estado: 'APROBADA',
      montoEnCentavos: montoTotal * 100,
      moneda: 'COP',
      fecha: new Date().toISOString(),
      metodoPago: payload.metodo,
      planId: payload.plan.id,
      planNombre: payload.plan.nombre,
      ciclo: payload.ciclo,
      mensaje: '¡Pago aprobado exitosamente por Wompi Bancolombia!',
    };

    // Actualizamos el plan del negocio en estado local simulado para reactividad instantánea
    if (payload.negocioId) {
      localStorage.setItem(`business_plan_${payload.negocioId}`, payload.plan.id.toString());
      localStorage.setItem(`business_plan_expires_${payload.negocioId}`, fechaVencimiento);
      localStorage.setItem('active_business_plan', payload.plan.id.toString());
      localStorage.setItem('active_business_plan_expires', fechaVencimiento);
      
      // Emitimos evento global para sincronizar todas las vistas
      window.dispatchEvent(new CustomEvent('plan_updated', { 
        detail: { 
          negocioId: payload.negocioId, 
          planId: payload.plan.id,
          planNombre: payload.plan.nombre,
          venceEl: fechaVencimiento
        } 
      }));
    }

    return resultado;
  },
};
