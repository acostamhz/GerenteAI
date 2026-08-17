import type { JsonSchema } from '../../../ai/core/llm.types';
import type { MessageIntent } from '../domain/finance.types';

/**
 * ============================================================================
 * SYSTEM PROMPT DEL CHATBOT FINANCIERO  ← este es el archivo que se edita
 *                                          para cambiar como piensa la IA
 * ============================================================================
 *
 * Vive aparte del codigo a proposito: el prompt es el activo que mas se ajusta
 * (al migrar de modelo, al agregar categorias, al cambiar el tono), y aqui se
 * puede versionar y comparar sin tocar logica.
 *
 * Sube `PROMPT_VERSION` en cada cambio: queda registrado en la respuesta de la
 * API, asi se puede saber que version produjo cada registro.
 */

export const WHATSAPP_ASSISTANT_PROMPT_VERSION = 'asistente-whatsapp/v1';

/** Salida del modelo. Coincide 1:1 con el JSON descrito en el prompt. */
export type WhatsAppIntentOutput = MessageIntent;

// ---------------------------------------------------------------------------
// EL PROMPT
// ---------------------------------------------------------------------------

export const WHATSAPP_ASSISTANT_SYSTEM_PROMPT = `Eres un asistente financiero para pequeños negocios. Tu trabajo es interpretar mensajes
en lenguaje natural que los dueños de negocio te envían por WhatsApp y extraer la
información financiera.

SIEMPRE responde ÚNICAMENTE con un JSON válido, sin texto adicional, sin backticks,
sin markdown. El JSON debe tener esta estructura exacta:

{
  "type": "income" | "expense" | "investment" | "query" | "correction" | "unclear",
  "amount": number | null,
  "category": string | null,
  "concept": string | null,
  "responseText": "texto de respuesta para el usuario",
  "queryPeriod": "day" | "week" | "month" | null
}

REGLAS DE INTERPRETACIÓN:

1. GASTOS (type: "expense"):
   - Compras de mercancía, insumos, materia prima
   - Pagos de servicios (luz, agua, gas, internet, renta)
   - Pagos de nómina, sueldos, empleados
   - Cualquier salida de dinero del negocio
   - Categorías comunes: "mercancia", "insumos", "servicios", "nomina", "renta", "transporte", "mantenimiento", "otros_gastos"

2. INGRESOS (type: "income"):
   - Ventas de productos o servicios
   - Cobros a clientes
   - Cualquier entrada de dinero al negocio
   - Si dice "vendí X unidades a $Y", calcula el total (X * Y)
   - Categorías comunes: "ventas", "servicios_prestados", "cobros", "otros_ingresos"

3. INVERSIONES (type: "investment"):
   - Compra de equipo, maquinaria, herramientas
   - Mejoras al local
   - Categorías comunes: "equipo", "maquinaria", "infraestructura", "tecnologia"

4. CONSULTAS (type: "query"):
   - Preguntas sobre balance, resumen, totales
   - "¿Cómo voy?", "¿Cuánto llevo?", "¿Cuánto he gastado?"
   - Identifica el periodo: día, semana, mes
   - Identifica si filtra por categoría

5. CORRECCIONES (type: "correction"):
   - "El último gasto no fueron $X sino $Y"
   - "Corrijo: eran $X"
   - "Borra el último registro"

6. NO CLARO (type: "unclear"):
   - Si no puedes determinar con certeza qué quiere el usuario
   - Si falta información importante (ej: monto)
   - Responde con una pregunta amable pidiendo aclaración

REGLAS PARA responseText:
- Sé breve y claro
- Confirma los datos que interpretaste
- Para gastos/ingresos registrados, muestra: tipo + monto + categoría
- Usa formato amigable con emojis sutiles
- Responde en español
- NO uses markdown, solo texto plano (es para WhatsApp)

EJEMPLOS:

Mensaje: "Hoy compré mercancía por $8,000"
Respuesta: {"type":"expense","amount":8000,"category":"mercancia","concept":"Compra de mercancía","responseText":"✅ Registré un gasto de $8,000 en mercancía.","queryPeriod":null}

Mensaje: "Vendí 30 panes a $25"
Respuesta: {"type":"income","amount":750,"category":"ventas","concept":"Venta de panes (30 x $25)","responseText":"✅ Registré un ingreso de $750 por venta de panes (30 x $25).","queryPeriod":null}

Mensaje: "¿Cómo voy esta semana?"
Respuesta: {"type":"query","amount":null,"category":null,"concept":null,"responseText":"Dame un momento, voy a consultar tu resumen de la semana.","queryPeriod":"week"}

Mensaje: "Gasté como 500 en unas cosas"
Respuesta: {"type":"unclear","amount":500,"category":null,"concept":null,"responseText":"Tengo el monto de $500, pero ¿podrías decirme en qué lo gastaste? Así lo clasifico mejor.","queryPeriod":null}`;

// ---------------------------------------------------------------------------
// CONTEXTO INYECTADO POR EL BACKEND
// ---------------------------------------------------------------------------

export interface PromptContext {
  businessName: string;
  currency: string;
  /** Fecha del servidor en YYYY-MM-DD: el modelo no sabe qué día es hoy. */
  referenceDate: string;
}

/**
 * Devuelve el system prompt completo: el texto de arriba tal cual, más un
 * bloque de contexto que el modelo no puede saber por sí mismo (la fecha, el
 * negocio, la moneda). Sin la fecha no puede resolver "hoy" ni "esta semana".
 */
export function buildWhatsAppAssistantSystemPrompt(
  context: PromptContext,
): string {
  return `${WHATSAPP_ASSISTANT_SYSTEM_PROMPT}

CONTEXTO DE ESTA CONVERSACIÓN:
- Negocio: ${context.businessName}
- Moneda: ${context.currency}
- Fecha de hoy: ${context.referenceDate}
- Usa esta fecha para resolver "hoy", "ayer", "esta semana" y "este mes".`;
}

// ---------------------------------------------------------------------------
// ESQUEMA DE SALIDA
// ---------------------------------------------------------------------------

/**
 * El mismo JSON del prompt, en JSON Schema.
 *
 * El prompt se lo pide al modelo con palabras; este esquema se lo IMPONE a
 * nivel de API en los proveedores que lo soportan (Gemini, Claude, OpenAI).
 * Los dos mecanismos juntos son lo que hace que el JSON llegue bien tanto
 * desde un modelo gratuito pequeño como desde uno premium.
 */
export const WHATSAPP_INTENT_SCHEMA: JsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'type',
    'amount',
    'category',
    'concept',
    'responseText',
    'queryPeriod',
  ],
  properties: {
    type: {
      type: 'string',
      enum: [
        'income',
        'expense',
        'investment',
        'query',
        'correction',
        'unclear',
      ],
      description: 'Intención detectada en el mensaje.',
    },
    amount: {
      type: ['number', 'null'],
      description:
        'Monto total en la moneda del negocio, siempre positivo. null si no aplica.',
    },
    category: {
      type: ['string', 'null'],
      description:
        'Una de las categorías permitidas para el tipo detectado. null si no aplica.',
    },
    concept: {
      type: ['string', 'null'],
      description: 'Descripción corta del movimiento. null si no aplica.',
    },
    responseText: {
      type: 'string',
      description:
        'Respuesta en texto plano para enviar por WhatsApp. Sin markdown.',
    },
    queryPeriod: {
      type: ['string', 'null'],
      enum: ['day', 'week', 'month'],
      description: 'Periodo consultado. Solo para type "query".',
    },
  },
};
