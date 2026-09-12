import {
  PLAN_ADMINISTRADOR,
  PLAN_ASISTENTE,
  PLAN_CORPORATIVO,
  PLAN_GERENTE,
  PLAN_SOCIO,
  PlanesService,
} from './planes.service';

// Fechas fijas: la logica depende del reloj, asi que se inyecta en vez de simularlo.
const HOY = new Date('2026-06-15T12:00:00Z');
const AYER = new Date('2026-06-14T12:00:00Z');
const MANANA = new Date('2026-06-16T12:00:00Z');

describe('PlanesService', () => {
  const planes = new PlanesService();

  describe('catalogo', () => {
    it('publica los cinco planes, incluido el Corporativo', () => {
      expect(planes.catalogo().map((p) => p.nombre)).toEqual([
        'Asistente',
        'Gerente',
        'Administrador',
        'Socio',
        'Corporativo',
      ]);
    });

    it('los precios mensuales son los del catálogo comercial', () => {
      const [asistente, gerente, administrador, socio, corporativo] =
        planes.catalogo();

      expect(asistente.precioMensual).toBe(0);
      expect(gerente.precioMensual).toBe(39_900);
      expect(administrador.precioMensual).toBe(79_900);
      expect(socio.precioMensual).toBe(149_900);
      expect(corporativo.precioMensual).toBe(0);
    });

    /**
     * `null` y 0 no son lo mismo. Si el Gerente valiera 0 al año, pedir su ciclo
     * anual cobraría cero y activaría el plan gratis; con `null`, falla.
     */
    it('solo Administrador y Socio se venden por año', () => {
      const [asistente, gerente, administrador, socio, corporativo] =
        planes.catalogo();

      expect(gerente.precioAnual).toBeNull();
      expect(asistente.precioAnual).toBeNull();
      expect(corporativo.precioAnual).toBeNull();
      expect(administrador.precioAnual).toBe(799_900);
      expect(socio.precioAnual).toBe(1_449_900);
    });

    // Tres formas distintas de "contratar" que antes se deducían del precio, y
    // el Asistente y el Corporativo valen 0 los dos.
    it('distingue gratuito, compra directa y cotización', () => {
      const [asistente, gerente, administrador, socio, corporativo] =
        planes.catalogo();

      expect(asistente.contratacion).toBe('gratuito');
      expect(gerente.contratacion).toBe('directo');
      expect(administrador.contratacion).toBe('directo');
      expect(socio.contratacion).toBe('directo');
      expect(corporativo.contratacion).toBe('cotizacion');
    });
  });

  describe('lo que se publica por la API', () => {
    /**
     * `Infinity` no sobrevive a JSON: se convierte en `null` solo. Se hace
     * explícito para que sea un contrato y no un accidente de serialización.
     */
    it('el Corporativo publica maxSedes en null, no en Infinity', () => {
      const corporativo = planes
        .catalogo()
        .find((p) => p.id === PLAN_CORPORATIVO)!;

      expect(corporativo.maxSedes).toBeNull();

      // Ida y vuelta por JSON: es como viaja de verdad al frontend.
      const serializado = JSON.parse(
        JSON.stringify(corporativo),
      ) as typeof corporativo;
      expect(serializado.maxSedes).toBeNull();
    });

    it('los demás publican su número tal cual', () => {
      expect(planes.catalogo().map((p) => p.maxSedes)).toEqual([
        1,
        1,
        3,
        5,
        null,
      ]);
    });
  });

  describe('topes de sedes', () => {
    it('cada plan tiene su tope', () => {
      expect(planes.maxSedes(PLAN_ASISTENTE, null, HOY)).toBe(1);
      expect(planes.maxSedes(PLAN_GERENTE, MANANA, HOY)).toBe(1);
      expect(planes.maxSedes(PLAN_ADMINISTRADOR, MANANA, HOY)).toBe(3);
      expect(planes.maxSedes(PLAN_SOCIO, MANANA, HOY)).toBe(5);
      expect(planes.maxSedes(PLAN_CORPORATIVO, MANANA, HOY)).toBe(Infinity);
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
      expect(estado.vigente.maxSedes).toBe(1);
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

  /**
   * El desajuste que resuelve: la vigencia del plan corre 30 días desde el pago
   * y la cuota corría por mes de calendario. Quien pagaba el 25 estrenaba cuota
   * completa el 1, así que en un mes de plan tenía casi tres.
   */
  describe('ventana de la cuota de IA', () => {
    const DIA = 86_400_000;
    const hace = (dias: number) => new Date(HOY.getTime() - dias * DIA);
    const dentroDe = (dias: number) => new Date(HOY.getTime() + dias * DIA);
    const CREADO = hace(200);

    const duraDias = (v: { inicio: Date; fin: Date }) =>
      Math.round((v.fin.getTime() - v.inicio.getTime()) / DIA);

    it('siempre dura 30 días', () => {
      const casos = [
        planes.ventanaDeCuota(PLAN_GERENTE, dentroDe(10), CREADO, HOY),
        planes.ventanaDeCuota(PLAN_ADMINISTRADOR, dentroDe(200), CREADO, HOY),
        planes.ventanaDeCuota(PLAN_ASISTENTE, null, CREADO, HOY),
      ];

      for (const ventana of casos) expect(duraDias(ventana)).toBe(30);
    });

    it('la ventana siempre contiene el momento consultado', () => {
      const casos = [
        planes.ventanaDeCuota(PLAN_GERENTE, dentroDe(1), CREADO, HOY),
        planes.ventanaDeCuota(PLAN_GERENTE, dentroDe(29), CREADO, HOY),
        planes.ventanaDeCuota(PLAN_ADMINISTRADOR, dentroDe(364), CREADO, HOY),
        planes.ventanaDeCuota(PLAN_ASISTENTE, null, hace(1), HOY),
        planes.ventanaDeCuota(PLAN_ASISTENTE, null, hace(89), HOY),
      ];

      for (const { inicio, fin } of casos) {
        expect(inicio.getTime()).toBeLessThanOrEqual(HOY.getTime());
        expect(fin.getTime()).toBeGreaterThan(HOY.getTime());
      }
    });

    // Con plan de pago, la ventana termina el día del vencimiento: la cuota se
    // renueva cuando se renueva el plan, no antes.
    it('con plan de pago se ancla al vencimiento', () => {
      const vence = dentroDe(10);
      const ventana = planes.ventanaDeCuota(PLAN_GERENTE, vence, CREADO, HOY);

      expect(ventana.fin).toEqual(vence);
      expect(ventana.inicio).toEqual(new Date(vence.getTime() - 30 * DIA));
    });

    /**
     * En el plan anual la cuota sigue siendo mensual: se venden mensajes al mes,
     * no 12 cuotas de golpe al empezar el año.
     */
    it('el plan anual también recibe bloques de 30 días', () => {
      const vence = dentroDe(200);
      const ventana = planes.ventanaDeCuota(
        PLAN_ADMINISTRADOR,
        vence,
        CREADO,
        HOY,
      );

      expect(duraDias(ventana)).toBe(30);
      // 200 días restantes son 7 bloques hacia atrás desde el vencimiento.
      expect(ventana.fin).toEqual(new Date(vence.getTime() - 6 * 30 * DIA));
    });

    it('en el gratuito se ancla a cuando se creó el negocio', () => {
      const creado = hace(45);
      const ventana = planes.ventanaDeCuota(PLAN_ASISTENTE, null, creado, HOY);

      // Ya pasó un bloque completo, así que va por el segundo.
      expect(ventana.inicio).toEqual(new Date(creado.getTime() + 30 * DIA));
    });

    it('un negocio recién creado estrena ventana', () => {
      const ventana = planes.ventanaDeCuota(PLAN_ASISTENTE, null, HOY, HOY);

      expect(ventana.inicio).toEqual(HOY);
      expect(ventana.fin).toEqual(new Date(HOY.getTime() + 30 * DIA));
    });

    // Al vencer se opera como Asistente, así que la cuota también pasa a
    // contarse desde la creación y no desde un vencimiento que ya pasó.
    it('un plan vencido se ancla a la creación, no al vencimiento', () => {
      const creado = hace(45);
      const vencido = planes.ventanaDeCuota(PLAN_GERENTE, hace(3), creado, HOY);
      const gratuito = planes.ventanaDeCuota(PLAN_ASISTENTE, null, creado, HOY);

      expect(vencido).toEqual(gratuito);
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

    // Lo que separa un plan de pago de otro son las sedes y la cuota de IA, no
    // las funciones: los tres las llevan todas.
    it('todos los planes de pago llevan la IA avanzada', () => {
      for (const plan of [PLAN_GERENTE, PLAN_ADMINISTRADOR, PLAN_SOCIO]) {
        expect(
          planes.tieneFuncionalidad(plan, MANANA, 'ia_avanzada', HOY),
        ).toBe(true);
      }
      expect(
        planes.tieneFuncionalidad(PLAN_ASISTENTE, null, 'ia_avanzada', HOY),
      ).toBe(false);
    });

    // Se evalua contra el plan vigente, no contra el que se pago alguna vez.
    it('un Gerente vencido pierde el reporte de fiados', () => {
      expect(
        planes.tieneFuncionalidad(PLAN_GERENTE, AYER, 'reporte_fiados', HOY),
      ).toBe(false);
    });
  });
});
