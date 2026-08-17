# Capa de IA de Luka AI

Guía de la integración de inteligencia artificial: cómo está construida, cómo
se usa y —lo más importante— **cómo se migra de una IA a otra sin reescribir
nada**.

---

## 0. Los dos archivos que vas a tocar

Si solo lees una sección, que sea esta.

| Quiero… | Archivo |
| --- | --- |
| **Cambiar el system prompt** (cómo piensa el chatbot) | [`src/modules/finance-ai/prompts/whatsapp-assistant.prompt.ts`](../src/modules/finance-ai/prompts/whatsapp-assistant.prompt.ts) |
| **Cambiar de IA** (Groq → Claude, etc.) | el archivo `.env` — variable `AI_PROVIDER` |

Y si necesitas ir más adentro:

| Quiero… | Archivo |
| --- | --- |
| Ver cómo se conecta técnicamente cada IA | [`src/ai/providers/`](../src/ai/providers/) — un archivo por proveedor |
| Ver qué hace el backend con lo que responde la IA | [`src/modules/finance-ai/services/whatsapp-message.service.ts`](../src/modules/finance-ai/services/whatsapp-message.service.ts) |
| Agregar un proveedor nuevo | [`src/ai/config/provider.catalog.ts`](../src/ai/config/provider.catalog.ts) |

---

## 1. La idea en una frase

El dominio nunca habla con una IA concreta. Habla con un **contrato**
(`LlmProvider`), y cada IA tiene un **adaptador** que traduce ese contrato a su
protocolo nativo. Cambiar de proveedor es cambiar una variable de entorno.

```
                 ┌──────────────────────────────────────────────┐
Dominio          │  WhatsAppMessageService                       │
(casos de uso)   │  InsightsService · AssistantService           │
                 └───────────────────────┬──────────────────────┘
                                         │ solo conoce esto
                 ┌───────────────────────▼──────────────────────┐
Fachada          │  LlmService                                   │
                 │  cuotas · reintentos · respaldo · costos      │
                 └───────────────────────┬──────────────────────┘
                                         │ interfaz LlmProvider
        ┌───────────────┬────────────────┼────────────────┬───────────────┐
        ▼               ▼                ▼                ▼               ▼
   OpenAiCompatible  Gemini         Anthropic          Echo         (el tuyo)
   Groq · Ollama     free tier      Claude (pago)      simulado
   OpenRouter                                          para tests
   DeepSeek · OpenAI
```

**La regla que mantiene esto sano:** si para cambiar de IA hace falta tocar algo
fuera de `src/ai/providers/`, el diseño se rompió. Cualquier peculiaridad de un
proveedor (que rechace `temperature`, que no soporte JSON con esquema, que use
`functionCall` en vez de `tool_calls`) se absorbe dentro de su adaptador.

---

## 2. Mapa de archivos

| Ruta | Qué hace |
| --- | --- |
| `src/ai/core/llm.types.ts` | El contrato neutral: mensajes, herramientas, formato de salida, uso. |
| `src/ai/core/llm.provider.ts` | La interfaz `LlmProvider` que todo adaptador implementa. |
| `src/ai/core/llm.errors.ts` | Taxonomía de errores normalizada (`rate_limit`, `timeout`, `refusal`…). |
| `src/ai/core/json.util.ts` | Rescata JSON de modelos que lo envuelven en texto o ```` ```json ````. |
| `src/ai/core/http.util.ts` | `fetch` con timeout + reintentos con backoff. |
| `src/ai/config/provider.catalog.ts` | Catálogo de proveedores y tabla de precios. |
| `src/ai/config/ai.config.ts` | Lectura y validación de variables de entorno. |
| `src/ai/providers/*.provider.ts` | Los adaptadores. **Único sitio con código específico de un proveedor.** |
| `src/ai/providers/provider.factory.ts` | Traduce configuración → instancia de proveedor. |
| `src/ai/services/llm.service.ts` | Fachada: cuotas, reintentos, respaldo, medición, trazas. |
| `src/ai/usage/` | Registro de consumo y límites por plan comercial. |
| `src/ai/filters/llm-exception.filter.ts` | Errores de IA → respuestas HTTP entendibles. |
| `src/modules/finance-ai/prompts/` | **Los system prompts.** Uno por caso de uso. |
| `src/modules/finance-ai/services/` | Qué hace el backend con la respuesta del modelo. |
| `src/modules/finance-ai/domain/finance.types.ts` | Tipos, categorías y sus etiquetas. |

---

## 3. Cambiar de IA

### Durante las pruebas (gratis)

**Groq** — el más rápido, capa gratuita generosa:

```env
AI_PROVIDER=groq
GROQ_API_KEY=gsk_...          # https://console.groq.com/keys
AI_MODEL=llama-3.3-70b-versatile
```

**Gemini** — mejor español y JSON con esquema garantizado:

```env
AI_PROVIDER=gemini
GEMINI_API_KEY=AIza...        # https://aistudio.google.com/apikey
AI_MODEL=gemini-2.0-flash
```

**Ollama** — todo local, costo cero y los datos financieros no salen del equipo:

```env
AI_PROVIDER=ollama
AI_MODEL=llama3.1:8b
AI_BASE_URL=http://localhost:11434/v1
```

**Echo** — sin llaves ni red; devuelve respuestas deterministas. Es el valor por
defecto para que el proyecto arranque recién clonado y para los tests.

### En producción (de pago)

```env
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...
AI_MODEL=claude-opus-5        # o claude-sonnet-5 / claude-haiku-4-5
```

**Eso es toda la migración.** No hay que tocar servicios, controladores ni
prompts. Reinicia el backend y `GET /ai/status` confirma quién está activo.

### Migración progresiva

Se puede mover un caso de uso a la vez. En `LlmService` cambia el proveedor
global, pero si quieres, por ejemplo, extracción en Groq (barato, alto volumen)
e insights en Claude (calidad), inyecta un segundo proveedor con su propio token
en `AiModule` y pásalo al servicio correspondiente. La interfaz es la misma, así
que conviven sin fricción.

### Respaldo automático

```env
AI_FALLBACK_PROVIDER=groq
AI_FALLBACK_API_KEY=gsk_...
```

Si el principal falla por saturación, caída, timeout o credenciales, `LlmService`
reintenta con backoff y luego pasa al respaldo. Un `bad_request` **no** activa el
respaldo: fallaría igual, y gastaría dinero para nada.

---

## 4. Añadir un proveedor nuevo

**Caso A — habla protocolo OpenAI** (la mayoría: Together, Fireworks, Mistral,
xAI, Cerebras…). No se escribe código: añade una entrada en
`src/ai/config/provider.catalog.ts`.

```ts
mistral: {
  id: 'mistral',
  kind: 'openai-compatible',
  label: 'Mistral AI',
  tier: 'paid',
  baseUrl: 'https://api.mistral.ai/v1',
  defaultModel: 'mistral-large-latest',
  apiKeyEnv: 'MISTRAL_API_KEY',
  notes: '...',
},
```

**Caso B — protocolo propio.** Tres pasos:

1. Crea `src/ai/providers/mi-ia.provider.ts` implementando `LlmProvider`
   (`generate`, `healthCheck`, `id`, `model`, `capabilities`).
2. Añade su `kind` al catálogo.
3. Añade un `case` en `provider.factory.ts`.

Guía práctica: copia `gemini.provider.ts`, que es el ejemplo completo (mensajes,
herramientas, esquema JSON, uso de tokens, errores).

**Lo que el adaptador debe garantizar:**

- Traducir errores a `LlmError` con el código correcto — de eso dependen los
  reintentos y el respaldo.
- Reportar `usage` en tokens — de eso dependen las cuotas del plan.
- Declarar `capabilities` con honestidad. Si dices `nativeJsonSchema: true` sin
  serlo, el JSON llegará roto al dominio.
- Filtrar en silencio lo que su modelo no acepte (`temperature` en Claude Opus 5,
  por ejemplo) en vez de propagar un 400.

---

## 5. Casos de uso implementados

### Chatbot de WhatsApp — `POST /ai/whatsapp/message`

Es el caso de uso principal. El system prompt está en
[`whatsapp-assistant.prompt.ts`](../src/modules/finance-ai/prompts/whatsapp-assistant.prompt.ts)
y obliga al modelo a responder **siempre** con este JSON:

```json
{
  "type": "income" | "expense" | "investment" | "query" | "correction" | "unclear",
  "amount": number | null,
  "category": string | null,
  "concept": string | null,
  "responseText": "texto de respuesta para el usuario",
  "queryPeriod": "day" | "week" | "month" | null
}
```

Según el `type`, el backend actúa
([`whatsapp-message.service.ts`](../src/modules/finance-ai/services/whatsapp-message.service.ts)):

| `type` | Qué hace el backend |
| --- | --- |
| `income` / `expense` / `investment` | Crea el movimiento y responde con el `responseText` del modelo. |
| `query` | **Ignora el `responseText`**, consulta los datos reales del periodo y arma la respuesta con cifras del backend. |
| `correction` | Devuelve la intención. Aplicarla requiere persistencia (ver §8). |
| `unclear` | Responde pidiendo el dato que falta. |

```bash
curl -X POST http://localhost:3000/ai/whatsapp/message \
  -H "content-type: application/json" \
  -d '{"message":"Hoy compré mercancía por 8000","businessId":"demo-business"}'
```

**Dos decisiones de diseño que conviene conocer:**

1. **Las cifras de las consultas las pone el backend, no el modelo.** Un LLM no
   es una fuente confiable de números. El modelo solo detecta *qué* se está
   preguntando; los totales salen de la base.
2. **Saneamiento defensivo.** Aunque el esquema obligue, un modelo puede
   devolver un monto negativo, un tipo inventado o una categoría que no
   corresponde (`"ventas"` en un gasto). `normalizeIntent()` corrige o descarta
   todo eso antes de que llegue a la contabilidad. La validación de esquema
   reduce el riesgo, no lo elimina.

### Insights — `POST /ai/insights`

Alimenta la pantalla *Recomendaciones de IA*. Toma la foto real del negocio
(totales, evolución mensual, categorías, movimientos recientes) y devuelve entre
2 y 5 hallazgos con acción concreta y prioridad. El prompt prohíbe explícitamente
el consejo genérico y los números inventados.

### Asistente — `POST /ai/assistant/ask`

Conversación con **herramientas**: el modelo no recibe la base de datos, recibe
tres funciones (`consultar_resumen_financiero`, `listar_transacciones`,
`calcular_totales`) que el backend resuelve contra el puerto de datos.

El `businessId` lo pone el backend, nunca los argumentos del modelo: así una
inyección de prompt no puede hacer que consulte los datos de otro negocio.

### Operación

- `GET /ai/status` — proveedor activo, modelo y capacidades.
- `GET /ai/health` — llamada real al proveedor (gasta unos pocos tokens).
- `GET /ai/usage/:tenantId` — consumo y cuota del mes.

---

## 6. Cuotas y costos

Los planes de la pantalla de suscripción están en `src/ai/usage/usage.service.ts`:

| Plan | Mensajes de IA/mes |
| --- | --- |
| Asistente | 50 |
| Gerente | 500 |
| Director | 5.000 |
| Corporativo | sin límite |

`LlmService` verifica la cuota **antes** de llamar al modelo y registra el
consumo después. Los fallos se registran para diagnóstico pero no descuentan
cuota. Al superarla, la API responde `402` con código `quota_exceeded`.

El costo estimado sale de `MODEL_PRICING` en `provider.catalog.ts`. Los modelos
gratuitos quedan en 0; los precios de Anthropic están cargados. Al añadir un
modelo de pago nuevo, añade su fila para que el panel de administración no
reporte costo cero.

> **Importante:** hoy el registro de consumo vive en memoria
> (`InMemoryAiUsageRepository`): se pierde al reiniciar y no se comparte entre
> instancias. **No sirve para facturar.** Antes de producción hay que
> implementar `AiUsageRepository` contra Postgres — es una sola clase, nada más
> cambia.

---

## 7. Probar y comparar proveedores

```bash
npm run ai:smoke
```

Ejecuta los tres casos de uso contra el proveedor configurado e imprime
resultado, latencia y costo. Su verdadero valor es **comparar**: corre el mismo
guion con `AI_PROVIDER=groq`, luego `=gemini`, luego `=anthropic` y decide con
datos —no con intuición— si el modelo barato alcanza para cada caso de uso.

Una estrategia habitual es mixta: extracción (alto volumen, tarea simple) en un
modelo económico, insights y asistente (donde se nota la calidad) en el premium.

---

## 8. Pendientes antes de producción

Esta capa está completa y funcionando, pero el backend a su alrededor todavía no:

- [ ] **Autenticación.** Hoy `tenantId` llega en el cuerpo de la petición; el
      cliente puede suplantar a otro. Debe salir de un JWT.
- [ ] **Persistencia.** Implementar `FinanceDataPort` y `AiUsageRepository`
      contra Postgres (el `docker-compose.yml` ya levanta la base).
- [ ] **Webhook de WhatsApp.** El servicio de extracción está listo; falta el
      endpoint que reciba los mensajes de Meta y valide la firma.
- [ ] **Rate limiting por IP/tenant**, además de la cuota del plan.
- [ ] **Caché de insights**: hoy cada llamada gasta tokens; regenerarlos una vez
      al día por negocio es suficiente.
- [ ] **Cablear el frontend**, que aún lee de `src/mocks/index.ts`.
