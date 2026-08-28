import {
  PLAN_ADMINISTRADOR,
  PLAN_ASISTENTE,
  PLAN_GERENTE,
  PlanesService,
} from './planes.service';

// Fechas fijas: la logica depende del reloj, asi que se inyecta en vez de simularlo.
const HOY = new Date('2026-06-15T12:00:00Z');
const AYER = new Date('2026-06-14T12:00:00Z');
const MANANA = new Date('2026-06-16T12:00:00Z');

describe('PlanesService', () => {
  const planes = new PlanesService();

  describe('catalogo', () => {
    it('publica los tres planes comerciales, sin el de socios', () => {
      const catalogo = planes.catalogo();

      expect(catalogo.map((p) => p.nombre)).toEqual([
        'Asistente',
        'Gerente',
        'Administrador',
      ]);
    });

    it('el Asistente es gratuito y los otros dos tienen precio', () => {
      const [asistente, gerente, administrador] = planes.catalogo();

      expect(asistente.precioMensual).toBe(0);
      expect(gerente.precioMensual).toBe(79_900);
      expect(administrador.precioMensual).toBe(249_900);
    });

    // El anual se deriva del mensual, no se escribe aparte: fue justo esa
    // duplicacion la que produjo precios anuales calculados sobre 79.000.
    it('el precio anual es 12 meses con 16% de descuento', () => {
      const [asistente, gerente, administrador] = planes.catalogo();

      expect(gerente.precioAnual).toBe(805_392); // 79.900 x 12 x 0,84
      expect(administrador.precioAnual).toBe(2_518_992); // 249.900 x 12 x 0,84
      expect(asistente.precioAnual).toBe(0);
    });
  });

  describe('topes de sedes', () => {
    it('cada plan tiene su tope', () => {
      expect(planes.maxSedes(PLAN_ASISTENTE, null, HOY)).toBe(1);
      expect(planes.maxSedes(PLAN_GERENTE, MANANA, HOY)).toBe(4);
      expect(planes.maxSedes(PLAN_ADMINISTRADOR, MANANA, HOY)).toBe(10);
    });

    it('un plan desconocido cae al mas restrictivo, no al mas permisivo', () => {
      expect(planes.maxSedes(99, null, HOY)).toBe(1);
    });
  });

  describe('vencimiento', () => {
    it('sin fecha de vencimiento el plan no caduca', () => {
      const estado = planes.estado(PLAN_ASISTENTE, null, HOY);

      expect(estado.vencido).toBe(false);
      expect(estado.vigente.nombre).toBe('Asistente');
    });

    it('un plan con fecha futura sigue vigente', () => {
      const estado = planes.estado(PLAN_GERENTE, MANANA, HOY);

      expect(estado.vencido).toBe(false);
      expect(estado.vigente.nombre).toBe('Gerente');
      expect(estado.vigente.maxSedes).toBe(4);
    });

    // La regla central: vencer no bloquea, degrada.
    it('un Administrador vencido cae a Asistente', () => {
      const estado = planes.estado(PLAN_ADMINISTRADOR, AYER, HOY);

      expect(estado.vencido).toBe(true);
      expect(estado.contratado.nombre).toBe('Administrador');
      expect(estado.vigente.nombre).toBe('Asistente');
      expect(estado.vigente.maxSedes).toBe(1);
    });

    it('vencer justo hoy ya cuenta como vencido', () => {
      expect(planes.estado(PLAN_GERENTE, HOY, HOY).vencido).toBe(true);
    });

    it('conserva cual era el plan contratado, para poder ofrecer la renovacion', () => {
      const estado = planes.estado(PLAN_GERENTE, AYER, HOY);

      expect(estado.contratado.id).toBe(PLAN_GERENTE);
      expect(estado.venceEl).toEqual(AYER);
    });
  });

  describe('funcionalidades', () => {
    it('el Asistente no tiene ninguna funcion Premium', () => {
      expect(
        planes.tieneFuncionalidad(PLAN_ASISTENTE, null, 'reporte_fiados', HOY),
      ).toBe(false);
      expect(
        planes.tieneFuncionalidad(
          PLAN_ASISTENTE,
          null,
          'reportes_por_producto',
          HOY,
        ),
      ).toBe(false);
    });

    it('el Gerente tiene fiados y reportes por producto', () => {
      expect(
        planes.tieneFuncionalidad(PLAN_GERENTE, MANANA, 'reporte_fiados', HOY),
      ).toBe(true);
      expect(
        planes.tieneFuncionalidad(
          PLAN_GERENTE,
          MANANA,
          'reportes_por_producto',
          HOY,
        ),
      ).toBe(true);
    });

    it('la IA avanzada es exclusiva del Administrador', () => {
      expect(
        planes.tieneFuncionalidad(PLAN_GERENTE, MANANA, 'ia_avanzada', HOY),
      ).toBe(false);
      expect(
        planes.tieneFuncionalidad(
          PLAN_ADMINISTRADOR,
          MANANA,
          'ia_avanzada',
          HOY,
        ),
      ).toBe(true);
    });

    // Se evalua contra el plan vigente, no contra el que se pago alguna vez.
    it('un Gerente vencido pierde el reporte de fiados', () => {
      expect(
        planes.tieneFuncionalidad(PLAN_GERENTE, AYER, 'reporte_fiados', HOY),
      ).toBe(false);
    });
  });
});
