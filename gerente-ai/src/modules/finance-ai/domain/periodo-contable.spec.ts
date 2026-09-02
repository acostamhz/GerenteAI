import {
  describirPeriodo,
  normalizarDiaInicio,
  periodoContableDe,
} from './periodo-contable';

describe('periodoContableDe', () => {
  describe('mes calendario (dia 1, el caso normal)', () => {
    it('va del primero al ultimo dia del mes', () => {
      expect(periodoContableDe('2026-09-15', 1)).toEqual({
        desde: '2026-09-01',
        hasta: '2026-09-30',
        diaInicio: 1,
      });
    });

    it('respeta los meses de 31 dias', () => {
      expect(periodoContableDe('2026-07-15', 1).hasta).toBe('2026-07-31');
    });

    it('respeta febrero', () => {
      expect(periodoContableDe('2026-02-10', 1).hasta).toBe('2026-02-28');
    });

    it('respeta febrero en anio bisiesto', () => {
      expect(periodoContableDe('2028-02-10', 1).hasta).toBe('2028-02-29');
    });
  });

  describe('periodo que empieza el 21 (el caso del cliente)', () => {
    it('antes del corte, el periodo arranco el mes pasado', () => {
      // El 5 de septiembre todavia pertenece al periodo que abrio en agosto.
      expect(periodoContableDe('2026-09-05', 21)).toEqual({
        desde: '2026-08-21',
        hasta: '2026-09-20',
        diaInicio: 21,
      });
    });

    it('el dia del corte abre el periodo nuevo', () => {
      expect(periodoContableDe('2026-09-21', 21)).toEqual({
        desde: '2026-09-21',
        hasta: '2026-10-20',
        diaInicio: 21,
      });
    });

    it('el dia antes del corte cierra el periodo viejo', () => {
      expect(periodoContableDe('2026-09-20', 21).hasta).toBe('2026-09-20');
    });

    it('despues del corte, el periodo va al mes siguiente', () => {
      expect(periodoContableDe('2026-09-25', 21)).toEqual({
        desde: '2026-09-21',
        hasta: '2026-10-20',
        diaInicio: 21,
      });
    });
  });

  describe('cambios de anio', () => {
    it('en enero antes del corte, el periodo arranco en diciembre', () => {
      expect(periodoContableDe('2026-01-05', 21)).toEqual({
        desde: '2025-12-21',
        hasta: '2026-01-20',
        diaInicio: 21,
      });
    });

    it('en diciembre despues del corte, el periodo cierra en enero', () => {
      expect(periodoContableDe('2026-12-25', 21)).toEqual({
        desde: '2026-12-21',
        hasta: '2027-01-20',
        diaInicio: 21,
      });
    });
  });

  it('los periodos consecutivos no dejan huecos ni se pisan', () => {
    // Que el dia siguiente al cierre sea exactamente el inicio del proximo es
    // lo que garantiza que ningun movimiento se quede sin periodo ni se cuente
    // dos veces.
    const septiembre = periodoContableDe('2026-09-25', 21);
    const octubre = periodoContableDe('2026-10-25', 21);

    const diaDespuesDelCierre = new Date(`${septiembre.hasta}T00:00:00.000Z`);
    diaDespuesDelCierre.setUTCDate(diaDespuesDelCierre.getUTCDate() + 1);

    expect(diaDespuesDelCierre.toISOString().slice(0, 10)).toBe(octubre.desde);
  });
});

describe('normalizarDiaInicio', () => {
  it('acepta los dias validos', () => {
    expect(normalizarDiaInicio(21)).toBe(21);
    expect(normalizarDiaInicio(1)).toBe(1);
    expect(normalizarDiaInicio(28)).toBe(28);
  });

  it('recorta los que no existen en todos los meses', () => {
    // Un periodo que empezara el 30 no tendria fecha valida en febrero.
    expect(normalizarDiaInicio(31)).toBe(28);
    expect(normalizarDiaInicio(0)).toBe(1);
  });

  it('ante un valor invalido cae en el mes calendario', () => {
    expect(normalizarDiaInicio(null)).toBe(1);
    expect(normalizarDiaInicio(undefined)).toBe(1);
    expect(normalizarDiaInicio(NaN)).toBe(1);
  });
});

describe('describirPeriodo', () => {
  it('con mes calendario no complica al usuario', () => {
    expect(describirPeriodo(periodoContableDe('2026-09-15', 1))).toBe(
      'este mes',
    );
  });

  it('con corte distinto dice las fechas, porque "este mes" enganaria', () => {
    const texto = describirPeriodo(periodoContableDe('2026-09-05', 21));
    expect(texto).toContain('2026-08-21');
    expect(texto).toContain('2026-09-20');
  });
});
