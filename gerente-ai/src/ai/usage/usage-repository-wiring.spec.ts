import { AiModule } from '../ai.module';
import { PrismaAiUsageRepository } from './prisma-usage.repository';
import { AI_USAGE_REPOSITORY } from './usage.repository';

interface ProveedorRegistrado {
  provide?: symbol;
  useClass?: unknown;
}

/**
 * Comprueba a QUIÉN está cableado el registro de consumo, no cómo funciona.
 *
 * La distinción importa: las pruebas del repositorio de Prisma lo instancian
 * directamente, así que seguirían pasando aunque el módulo volviera a la versión
 * en memoria. Y ese cambio no rompe nada visible —el sistema responde igual—
 * salvo que los topes por plan dejan de aplicarse, que es justo lo que nadie
 * nota hasta que alguien consume de más.
 */
describe('cableado del registro de consumo de IA', () => {
  const proveedores = (
    (Reflect.getMetadata('providers', AiModule) ?? []) as ProveedorRegistrado[]
  ).filter((p) => typeof p === 'object');

  it('AiModule usa la implementación sobre Postgres, no la de memoria', () => {
    const registro = proveedores.find((p) => p.provide === AI_USAGE_REPOSITORY);

    expect(registro).toBeDefined();
    expect(registro?.useClass).toBe(PrismaAiUsageRepository);
  });
});
