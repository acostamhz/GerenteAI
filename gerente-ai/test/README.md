# Pruebas de integración

Corren contra un **Postgres desechable en Docker**, nunca contra el Neon compartido del
equipo. La conexión está fijada en `setup-env.ts` y se puede sobreescribir con la variable
`TEST_DATABASE_URL`.

## Levantar la base (una sola vez)

```bash
docker run -d --name gerente-ai-test-db \
  -e POSTGRES_PASSWORD=test -e POSTGRES_DB=gerente_test \
  -p 5433:5432 postgres:16-alpine

DATABASE_URL="postgresql://postgres:test@localhost:5433/gerente_test" npx prisma db push
```

El puerto es 5433 para no chocar con un Postgres local en el 5432.

Si el schema de Prisma cambia, hay que repetir el `db push` para que la base de pruebas
quede al día.

```bash
docker start gerente-ai-test-db   # en sesiones posteriores
docker rm -f gerente-ai-test-db   # para borrarla del todo
```

## Correr

```bash
npm run test:e2e
```

## Cómo están armadas

Las pruebas instancian los **servicios** directamente con `Test.createTestingModule`, sin
levantar el servidor HTTP ni JWT. La lógica que puede corromper datos (transacciones,
descuento de stock, decimales, permisos por sede) vive en los servicios; los guards solo
extraen el usuario del token. La excepción es `app.e2e-spec.ts`, que sí levanta la app
entera para verificar `/health`.

`jest-e2e.json` fija `maxWorkers: 1`: todas las suites comparten la misma base y se limpian
entre pruebas, así que correrlas en paralelo hace que una borre los datos de otra.

## Qué NO cubren

- Los guards (`JwtAuthGuard`) y la validación de DTOs por `ValidationPipe`. Se prueban los
  servicios, que es donde está la lógica de negocio.
- El flujo de Auth completo (registro, verificación de correo, reset de contraseña).
- La carrera real que motiva el `updateMany` condicional en Ventas y Abonos. El test de
  concurrencia afirma el **invariante** ("nunca se sobrevende"), no el mecanismo: bajo
  contención el chequeo previo de stock suele rechazar primero, y forzar el solapamiento
  exacto de forma determinista no es viable desde el proceso de pruebas.
