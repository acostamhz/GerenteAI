import { createContext, useContext, useState, ReactNode } from "react";
import { ChatMessage, QuickPrompt } from "../types";
import { assistantApi } from "../api/assistantApi";

interface LukaChatContextType {
  messages: ChatMessage[];
  isTyping: boolean;
  isFloatingOpen: boolean;
  setIsFloatingOpen: (open: boolean) => void;
  sendMessage: (text: string) => Promise<void>;
  quickPrompts: QuickPrompt[];
  heroDockPulse: number;
  triggerHeroDockPulse: () => void;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "1",
    sender: "assistant",
    text: "¡Hola! Soy Luka, tu Gerente Financiero con Inteligencia Artificial. ¿En qué puedo ayudarte hoy? Puedes preguntarme sobre tus ingresos, gastos, margen de ganancia o reportes de ventas.",
    timestamp: "Ahora",
  },
];

const QUICK_PROMPTS: QuickPrompt[] = [
  {
    id: "p1",
    label: "¿Cuánto vendimos este mes?",
    query: "¿Cuál es el resumen de ventas e ingresos de este mes?",
  },
  {
    id: "p2",
    label: "¿Cuáles son los mayores gastos?",
    query: "¿En qué categorías se han concentrado los mayores gastos operativos?",
  },
  {
    id: "p3",
    label: "Balance y Rentabilidad",
    query: "¿Cuál es el balance neto y el margen de rentabilidad actual?",
  },
  {
    id: "p4",
    label: "Cuentas por Cobrar (Fiados)",
    query: "¿Cuánto dinero tenemos pendiente en cuentas por cobrar fiadas?",
  },
];

const LukaChatContext = createContext<LukaChatContextType | undefined>(undefined);

export function LukaChatProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [isTyping, setIsTyping] = useState(false);
  const [isFloatingOpen, setIsFloatingOpen] = useState(false);
  const [heroDockPulse, setHeroDockPulse] = useState(0);

  const triggerHeroDockPulse = () => {
    setHeroDockPulse((prev) => prev + 1);
  };

  const getFallbackResponse = (query: string): string => {
    const q = query.toLowerCase();

    if (q.includes("venta") || q.includes("ingreso") || q.includes("ganancia")) {
      return "Según los registros actuales, tus ingresos de contado y abonos se mantienen estables. Puedes consultar el desglose gráfico en tiempo real desde tu Panel Financiero.";
    }
    if (q.includes("gasto") || q.includes("compra") || q.includes("egreso")) {
      return "Tus egresos principales corresponden a compras de mercancía y gastos fijos de operación. Te sugiero revisar la sección de proveedores para optimizar costos.";
    }
    if (q.includes("balance") || q.includes("rentabilidad")) {
      return "Tu balance neto está calculado sobre ingresos reales menos gastos y compras. Mantienes un flujo de caja positivo.";
    }
    return "Entendido. He analizado la información de tu negocio. Si deseas registrar un nuevo movimiento o consultar reportes específicos, dímelo y te asisto.";
  };

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const activeBusinessId = localStorage.getItem("active_business_id") || "demo-business";
      
      // Historial para contexto de conversación en el LLM
      const history = messages.slice(-6).map((m) => ({
        role: (m.sender === "user" ? "user" : "assistant") as "user" | "assistant",
        content: m.text,
      }));

      const result = await assistantApi.ask({
        businessId: activeBusinessId,
        question: text.trim(),
        history,
      });

      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "assistant",
        text: result.answer || getFallbackResponse(text),
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.warn("Luka AI offline o respondiendo con heurísticas locales:", err);
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "assistant",
        text: getFallbackResponse(text),
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <LukaChatContext.Provider
      value={{
        messages,
        isTyping,
        isFloatingOpen,
        setIsFloatingOpen,
        sendMessage,
        quickPrompts: QUICK_PROMPTS,
        heroDockPulse,
        triggerHeroDockPulse,
      }}
    >
      {children}
    </LukaChatContext.Provider>
  );
}

export function useLukaChat() {
  const context = useContext(LukaChatContext);
  if (!context) {
    throw new Error("useLukaChat must be used within a LukaChatProvider");
  }
  return context;
}
