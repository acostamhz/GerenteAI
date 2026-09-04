import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Las notas de voz y las fotos de WhatsApp llegan en base64 dentro del JSON,
  // y el limite por defecto de Express (100 kB) las rechazaba con un 413 que no
  // explicaba nada. Una foto de Meta pesa hasta 5 MB, que en base64 son ~6,7.
  app.useBodyParser('json', { limit: '12mb' });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // elimina del body cualquier campo que no esté en el DTO
      forbidNonWhitelisted: true, // rechaza el request si viene un campo extra no esperado
      transform: true, // convierte automáticamente tipos (ej. strings de query params a number)
    }),
  );

  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(',').map((value) =>
      value.trim(),
    ) ?? ['http://localhost:5173', 'http://localhost:3000'],
  });

  const port = process.env.PORT ?? 3000;

  await app.listen(port);

  new Logger('Bootstrap').log(
    `Luka AI API escuchando en http://localhost:${port}`,
  );
}

void bootstrap();
