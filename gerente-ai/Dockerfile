# Imagen multi-etapa: la misma definicion sirve para desarrollo y para produccion.
#
#   docker compose up --build            -> etapa "development" (watch, con volumen)
#   docker build -t gerente-ai .         -> etapa "production"  (compilado, sin watch)
#
# Render usa la ultima etapa por defecto, asi que no necesita Build ni Start Command.

# ----------------------------------------------------------------- construccion
FROM node:22-alpine AS builder

# Prisma necesita openssl para su motor de consultas; Alpine no lo trae.
RUN apk add --no-cache openssl

WORKDIR /app

# Se copian primero los manifiestos: si no cambian, Docker reutiliza la capa de
# dependencias y no vuelve a instalar en cada build.
COPY package*.json ./
COPY prisma ./prisma

# --include=dev explicito: aqui hacen falta @nestjs/cli y typescript para compilar,
# y npm los omitiria si NODE_ENV viniera en production.
RUN npm ci --include=dev

RUN npx prisma generate

COPY . .
RUN npm run build

# ----------------------------------------------------------------- desarrollo
# Hereda de builder: ya tiene todas las dependencias y el cliente de Prisma.
# El codigo real llega por el volumen que monta docker-compose.
FROM builder AS development

CMD ["npm", "run", "start:dev"]

# ----------------------------------------------------------------- produccion
FROM node:22-alpine AS production

RUN apk add --no-cache openssl

WORKDIR /app
ENV NODE_ENV=production

# Solo dependencias de ejecucion: el CLI de Nest y TypeScript no viajan al servidor.
COPY package*.json ./
RUN npm ci --omit=dev

# El cliente de Prisma se copia ya generado. Generarlo aqui exigiria el CLI de
# Prisma, que es devDependency y no esta instalado en esta etapa.
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Informativo: Render inyecta PORT y main.ts la lee.
EXPOSE 3000

CMD ["node", "dist/main"]
