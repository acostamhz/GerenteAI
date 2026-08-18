# Despliegue del backend en Render — instrucciones para el equipo de backend

Documento de entrega de Persona 5 (Integraciones).

**Contexto:** n8n ya está desplegado en Railway y el canal de WhatsApp está probado
hasta Meta. Falta el backend. En cuanto esté arriba con esta configuración, el bot
queda funcionando de punta a punta.

El código de la integración (`POST /ai/interpret`) está en la rama
`feat/integracion-whatsapp-n8n`. El detalle técnico de qué hace está en
[`n8n/README.md`](./README.md).

---

## ⚠️ Dos cosas que hay que resolver sí o sí

### 1. No hay migraciones de Prisma en el repo

`prisma/migrations/` no existe, así que **`npx prisma migrate deploy` no crea
ninguna tabla** — corre, dice "no pending migrations" y el servicio arranca contra
una base vacía. Después todo falla con errores de tabla inexistente.

Dos salidas:

- **Rápida** (lo que se viene usando): `npx prisma db push` en el Start Command.
- **Correcta a mediano plazo**: generar la migración inicial y commitearla:
  ```bash
  npx prisma migrate dev --name init
  git add prisma/migrations && git commit
  ```
  y ahí sí usar `migrate deploy`.

Abajo va la opción rápida.

### 2. El Dockerfile actual no sirve para producción

[`gerente-ai/Dockerfile`](../gerente-ai/Dockerfile) termina en
`CMD ["npm", "run", "start:dev"]` — modo desarrollo con watch.

Render **detecta el Dockerfile automáticamente** y lo usa si no se le dice lo
contrario. Hay que elegir **Runtime: Node** explícitamente al crear el servicio,
o arreglar el Dockerfile.

---

## La base de datos ya existe: está en Neon

**No hay que crear un PostgreSQL en Render.** La base está en
[Neon](https://neon.tech), fuera de Render, y eso simplifica las cosas: la misma
cadena de conexión sirve para el backend y para n8n (no hay red interna de por
medio).

De Neon → tu proyecto → **Connection Details** hace falta:

- La **connection string** completa, que termina en `?sslmode=require`. Va en
  `DATABASE_URL`. Ejemplo de la forma que tiene:
  ```
  postgresql://usuario:password@ep-algo-123456-pooler.us-east-2.aws.neon.tech/nombredb?sslmode=require
  ```
- Esa misma cadena, o sus partes sueltas (host, puerto 5432, base, usuario,
  password), se le pasa a Persona 5 para los crones de n8n.

Dos detalles de Neon que conviene saber:

- **El `sslmode=require` no es opcional.** Sin él, Prisma no conecta.
- Neon suspende la base tras unos minutos sin uso, pero **despierta en menos de
  un segundo**. No es un problema como el dormir de Render.

## Servicio único: Web Service

Render → New → **Web Service** → conectar el repo.

| Campo | Valor |
|---|---|
| **Root Directory** | `gerente-ai` ← **obligatorio**, el backend no está en la raíz del repo |
| **Runtime** | `Node` (no Docker, ver arriba) |
| **Build Command** | `npm install && npx prisma generate && npm run build` |
| **Start Command** | `npx prisma db push && node dist/main` |
| **Health Check Path** | `/health` |

> **No usar `/ai/health` como health check.** Ese endpoint hace una llamada real
> al modelo: Render lo pinguea cada pocos segundos y consumiría la cuota de Groq
> las 24 horas. El correcto es `/health`, que no toca ni la IA ni la base.

## Variables de entorno

| Variable | Valor |
|---|---|
| `DATABASE_URL` | La connection string de Neon, con `?sslmode=require` |
| `JWT_SECRET` | el que ya usan para el panel |
| `N8N_API_KEY` | **se lo pide a Persona 5** — tiene que ser idéntico al de n8n |
| `FINANCE_DATA_SOURCE` | `prisma` |
| `NODE_ENV` | `production` |
| `TZ` | `America/Bogota` |
| `NODE_VERSION` | `22` |
| `AI_PROVIDER` | `groq` |
| `GROQ_API_KEY` | la llave de Groq (console.groq.com/keys) |
| `AI_MODEL` | `llama-3.3-70b-versatile` |
| `AI_TIMEOUT_MS` | `30000` |
| `CORS_ORIGINS` | dominio del frontend |

### Bloque para pegar de una vez

Render → pestaña **Environment** → botón **"Add from .env"** → pegar esto y
completar los cuatro valores entre `<>`:

```
NODE_ENV=production
TZ=America/Bogota
NODE_VERSION=22
FINANCE_DATA_SOURCE=prisma
AI_PROVIDER=groq
AI_MODEL=llama-3.3-70b-versatile
AI_TIMEOUT_MS=30000
N8N_API_KEY=<lo pasa Persona 5 por canal privado>
DATABASE_URL=<connection string de Neon, terminada en ?sslmode=require>
JWT_SECRET=<el que ya usan para el panel>
GROQ_API_KEY=<console.groq.com/keys>
CORS_ORIGINS=<dominio del frontend>
```

**No se sube ningún archivo `.env` al repo ni se manda por chat.** En Render las
variables viven en el panel. La referencia de cuáles existen es
[`gerente-ai/.env.example`](../gerente-ai/.env.example), que sí está en git pero
solo con valores de ejemplo.

Opcional pero recomendado — proveedor de respaldo, para que el bot siga
respondiendo si Groq satura:

```
AI_FALLBACK_PROVIDER=gemini
AI_FALLBACK_API_KEY=<llave de aistudio.google.com/apikey>
```

`PORT` no se configura: Render la inyecta y [`main.ts`](../gerente-ai/src/main.ts)
ya la lee.

---

## ⚠️ El plan gratuito de Render duerme el servicio

En el free tier, tras **15 minutos sin tráfico** Render apaga la instancia. La
siguiente petición tarda **entre 30 y 60 segundos** en responder mientras arranca.

Traducido al bot: el primer mensaje de WhatsApp después de un rato de silencio
**se pierde o llega tardísimo**. Y en un bot de registro de gastos, el uso es
justamente esporádico.

Tres opciones, de mejor a peor:

1. **Plan pago** (~7 USD/mes). Es lo que corresponde si esto va a producción.
2. **Mantenerlo despierto** con un cron en n8n que pegue a `/health` cada 10
   minutos. Gratis, pero consume horas del plan free de Render (750 h/mes, y
   mantenerlo despierto 24/7 son ~730 h: entra justo).
3. **Dejarlo dormir** y asumir que el primer mensaje falla. El flujo de n8n ya
   tiene timeout de 45 s y respuesta de emergencia, así que el usuario recibe
   "no pude procesar tu mensaje, intenta de nuevo" en vez de silencio.

Decisión pendiente del equipo.

---

## Verificación (una vez desplegado)

```bash
# 1. ¿Está vivo?
curl https://TU-SERVICIO.onrender.com/health
# → {"success":true,"status":"online",...}

# 2. ¿Está configurada la IA?
curl https://TU-SERVICIO.onrender.com/ai/status
# → debe decir provider "groq", NO "echo"
#   ("echo" significa que falta AI_PROVIDER o GROQ_API_KEY)

# 3. ¿Responde la puerta de n8n?
curl -H "x-api-key: EL_N8N_API_KEY" \
  https://TU-SERVICIO.onrender.com/ai/interpret/ping
# → {"ok":true,"service":"whatsapp-interpret",...}
#   401 = la clave no coincide con la de n8n
#   404 = el deploy no tomó la rama con el código nuevo
```

---

## Lo que Persona 5 necesita de vuelta

1. **La URL pública** del servicio (`https://....onrender.com`)
2. **Los datos de conexión de Neon** (host, puerto 5432, base, usuario,
   password) — los crones de recordatorio y resumen semanal consultan la base
   directamente desde n8n, y ahí hay que cargarlos campo por campo
3. **Confirmación** de que los 3 curls de arriba dan OK

Con eso se activa el flujo nuevo en n8n y se prueba de punta a punta.
