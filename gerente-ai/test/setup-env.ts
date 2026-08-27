// Apunta las pruebas a un Postgres desechable en Docker, NUNCA al Neon compartido
// del equipo. Se levanta con:
//   docker run -d --name gerente-ai-test-db -e POSTGRES_PASSWORD=test \
//     -e POSTGRES_DB=gerente_test -p 5433:5432 postgres:16-alpine
//   DATABASE_URL="postgresql://postgres:test@localhost:5433/gerente_test" npx prisma db push
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  'postgresql://postgres:test@localhost:5433/gerente_test';

// AuthModule exige JWT_SECRET al construirse. Estas pruebas no validan tokens,
// pero el valor tiene que existir para que el módulo se pueda instanciar.
process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'secreto-solo-para-pruebas';
