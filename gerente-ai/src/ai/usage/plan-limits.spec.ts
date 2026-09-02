import { PLAN_LIMITS, resolvePlan } from './usage.service';

/**
 * Los topes de mensajes son una regla comercial: si cambian en el contrato con
 * los clientes, tienen que cambiar aqui y esta prueba tiene que actualizarse a
 * proposito, no por accidente.
 */
describe('PLAN_LIMITS', () => {
  it('el plan gratuito incluye 500 mensajes de IA al mes', () => {
    expect(PLAN_LIMITS.asistente.monthlyAiMessages).toBe(500);
  });

  it('el primer plan de pago incluye 4.000', () => {
    expect(PLAN_LIMITS.gerente.monthlyAiMessages).toBe(4_000);
  });

  it('el plan full incluye 10.000', () => {
    expect(PLAN_LIMITS.director.monthlyAiMessages).toBe(10_000);
  });

  it('el plan interno de socios no tiene tope', () => {
    expect(PLAN_LIMITS.corporativo.monthlyAiMessages).toBe(
      Number.POSITIVE_INFINITY,
    );
  });

  it('cada plan de pago incluye mas mensajes que el anterior', () => {
    expect(PLAN_LIMITS.gerente.monthlyAiMessages).toBeGreaterThan(
      PLAN_LIMITS.asistente.monthlyAiMessages,
    );
    expect(PLAN_LIMITS.director.monthlyAiMessages).toBeGreaterThan(
      PLAN_LIMITS.gerente.monthlyAiMessages,
    );
  });
});

describe('resolvePlan', () => {
  it('reconoce los planes por su identificador', () => {
    expect(resolvePlan('director').monthlyAiMessages).toBe(10_000);
  });

  it('un plan desconocido cae en el gratuito, no en el mas generoso', () => {
    // Ante la duda se concede lo minimo: regalar cuota sale caro.
    expect(resolvePlan('inexistente').id).toBe('asistente');
    expect(resolvePlan(undefined).id).toBe('asistente');
  });
});
