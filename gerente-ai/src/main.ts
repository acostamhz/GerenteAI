import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,           // elimina del body cualquier campo que no esté en el DTO
      forbidNonWhitelisted: true, // rechaza el request si viene un campo extra no esperado
      transform: true,            // convierte automáticamente tipos (ej. strings de query params a number)
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();