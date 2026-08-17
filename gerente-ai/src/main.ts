import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
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
