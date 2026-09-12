import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../src/services/prisma.service';
import { PrismaAiUsageRepository } from '../src/ai/usage/prisma-usage.repository';
import {
  PLAN_ASISTENTE,
  PLAN_GERENTE,
  PlanesService,
} from '../src/services/planes.service';
import type { AiUsageRecord } from '../src/ai/usage/usage.repository';
import { limpiar } from './helpers/contexto';

/**
 * El consumo de IA vive en Postgres y no en memoria.
 *
 * Antes se llevaba en un `Map` del proceso, asi que se reiniciaba en cada
 * despliegue y cada vez que Render dormia el servicio. El efecto practico era
 * que los topes por plan no se aplicaban nunca: bastaba esperar un reinicio para
 * volver a tener la cuota completa. Y con los planes actuales la cuota de
 * mensajes es de lo poco que separa un plan de pago de otro.
 */
describe('Consumo de IA (contra Postgres real)', () => {
  let moduleRef: TestingModule;
  let prisma: PrismaService;
  let repo: PrismaAiUsageRepository;

  let negocioId: string;
  let sedeId: string;

  const AHORA = new Date();
  const DESDE = new Date(AHORA.getTime() - 86_400_000);
  const HASTA = new Date(AHORA.getTime() + 86_400_000);

  const llamada = (extra: Partial<AiUsageRecord> = {}): AiUsageRecord => ({
    tenantId: negocioId,
    businessId: sedeId,
    feature: 'whatsapp.message',
    providerId: 'gemini',
    model: 'gemini-3.6-flash',
    inputTokens: 6_300,
    outputTokens: 120,
    costUsd: 0.000045,
    latencyMs: 2_100,
    success: true,
    createdAt: AHORA,
    ...extra,
  });

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      providers: [PrismaService, PrismaAiUsageRepository],
    }).compile();

    prisma = moduleRef.get(PrismaService);
    await prisma.$connect();
    repo = moduleRef.get(PrismaAiUsageRepository);
  });

  afterAll(async () => {
    await limpiar(prisma);
    await prisma.$disconnect();
    await moduleRef.close();
  });

  beforeEach(async () => {
    await limpiar(prisma);

    const negocio = await prisma.negocio.create({
      data: { nombre: 'Tienda con IA' },
    });
    const sede = await prisma.sede.create({
      data: { nombre: 'Principal', negocioId: negocio.id },
    });

    negocioId = negocio.id;
    sedeId = sede.id;
  });

  describe('conteo para la cuota', () => {
    it('cuenta las llamadas exitosas del negocio', async () => {
      await repo.record(llamada());
      await repo.record(llamada());
      await repo.record(llamada());

      expect(await repo.countMessages(negocioId, DESDE, HASTA)).toBe(3);
    });

    // Si al cliente no le llegó respuesta, no se le descuenta.
    it('no cuenta las fallidas, pero las guarda', async () => {
      await repo.record(llamada());
      await repo.record(llamada({ success: false, errorCode: 'timeout' }));

      expect(await repo.countMessages(negocioId, DESDE, HASTA)).toBe(1);
      expect(await prisma.consumoIa.count({ where: { negocioId } })).toBe(2);
    });

    /**
     * La razón de ser de todo esto. Se simula un reinicio creando un repositorio
     * nuevo —como haría el proceso al arrancar— y el consumo sigue ahí.
     */
    it('el consumo sobrevive a un reinicio del proceso', async () => {
      await repo.record(llamada());
      await repo.record(llamada());

      const trasElReinicio = new PrismaAiUsageRepository(prisma);

      expect(await trasElReinicio.countMessages(negocioId, DESDE, HASTA)).toBe(
        2,
      );
    });

    it('la cuota es por negocio: no se mezcla con la de otro', async () => {
      const otro = await prisma.negocio.create({ data: { nombre: 'Otra' } });

      await repo.record(llamada());
      await repo.record(llamada({ tenantId: otro.id, businessId: undefined }));

      expect(await repo.countMessages(negocioId, DESDE, HASTA)).toBe(1);
      expect(await repo.countMessages(otro.id, DESDE, HASTA)).toBe(1);
    });

    // El tope es mensual: lo del mes pasado no puede seguir descontando.
    it('respeta la ventana de fechas', async () => {
      await repo.record(llamada({ createdAt: new Date('2020-01-01') }));
      await repo.record(llamada());

      expect(await repo.countMessages(negocioId, DESDE, HASTA)).toBe(1);
    });
  });

  /**
   * La cuota se cuenta contra el ciclo de cobro, no contra el mes de calendario.
   *
   * Con el mes de calendario, quien pagaba el 25 estrenaba cuota completa el 1 y
   * en un mes de plan podía llegar a tener casi tres. Estas pruebas recorren el
   * camino entero: se calcula la ventana como lo hace producción y se cuenta con
   * ella contra la base.
   */
  describe('la cuota sigue al ciclo de cobro', () => {
    const planes = new PlanesService();
    const DIA = 86_400_000;
    const hace = (dias: number) => new Date(AHORA.getTime() - dias * DIA);
    const dentroDe = (dias: number) => new Date(AHORA.getTime() + dias * DIA);

    it('no cuenta el consumo del ciclo anterior', async () => {
      // Pagó hace 35 días: el ciclo anterior ya cerró y este lleva 5 días.
      const vence = dentroDe(25);

      await repo.record(llamada({ createdAt: hace(31) })); // ciclo anterior
      await repo.record(llamada({ createdAt: hace(2) })); // ciclo actual

      const ventana = planes.ventanaDeCuota(
        PLAN_GERENTE,
        vence,
        hace(200),
        AHORA,
      );

      expect(
        await repo.countMessages(negocioId, ventana.inicio, ventana.fin),
      ).toBe(1);
    });

    /**
     * El caso que motivó el cambio. Alguien que paga el día 25 tenía, con el mes
     * de calendario, su consumo borrado el día 1 — a los 6 días de pagar.
     */
    it('quien paga a fin de mes no estrena cuota el día 1', async () => {
      const vence = dentroDe(28); // pagó hace 2 días

      await repo.record(llamada({ createdAt: hace(1) }));

      const ventana = planes.ventanaDeCuota(
        PLAN_GERENTE,
        vence,
        hace(200),
        AHORA,
      );

      // El consumo de hace un día sigue contando: es el mismo ciclo pagado.
      expect(
        await repo.countMessages(negocioId, ventana.inicio, ventana.fin),
      ).toBe(1);
    });

    it('en el gratuito la ventana corre desde que se creó el negocio', async () => {
      const creado = hace(40); // lleva un bloque completo y va por el segundo

      await repo.record(llamada({ createdAt: hace(35) })); // bloque anterior
      await repo.record(llamada({ createdAt: hace(3) })); // bloque actual

      const ventana = planes.ventanaDeCuota(
        PLAN_ASISTENTE,
        null,
        creado,
        AHORA,
      );

      expect(
        await repo.countMessages(negocioId, ventana.inicio, ventana.fin),
      ).toBe(1);
    });
  });

  describe('resumen', () => {
    it('suma tokens y coste, y desglosa por proveedor', async () => {
      await repo.record(llamada());
      await repo.record(llamada());
      await repo.record(
        llamada({ providerId: 'groq', inputTokens: 100, outputTokens: 50 }),
      );

      const resumen = await repo.summarize(negocioId, DESDE, HASTA);

      expect(resumen.messages).toBe(3);
      expect(resumen.inputTokens).toBe(6_300 + 6_300 + 100);
      expect(resumen.outputTokens).toBe(120 + 120 + 50);
      expect(resumen.costUsd).toBeCloseTo(0.000135, 6);
      expect(resumen.byProvider).toEqual({ gemini: 2, groq: 1 });
    });

    it('un negocio sin consumo devuelve ceros, no revienta', async () => {
      const resumen = await repo.summarize(negocioId, DESDE, HASTA);

      expect(resumen).toMatchObject({
        messages: 0,
        inputTokens: 0,
        outputTokens: 0,
        costUsd: 0,
        byProvider: {},
      });
    });
  });

  describe('registro', () => {
    it('guarda la sede cuando se conoce', async () => {
      await repo.record(llamada());

      const fila = await prisma.consumoIa.findFirstOrThrow({
        where: { negocioId },
      });
      expect(fila.sedeId).toBe(sedeId);
      expect(fila.feature).toBe('whatsapp.message');
      expect(Number(fila.costoUsd)).toBeCloseTo(0.000045, 6);
    });

    /**
     * El modelo ya respondió y el usuario espera. Perder una fila de
     * contabilidad es menos grave que devolverle un error por ella.
     */
    it('un fallo al registrar no propaga el error', async () => {
      await expect(
        repo.record(llamada({ tenantId: 'negocio-que-no-existe' })),
      ).resolves.toBeUndefined();
    });
  });
});
