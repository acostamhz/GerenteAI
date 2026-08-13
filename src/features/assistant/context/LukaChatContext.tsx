import { createContext, useContext, useState, ReactNode } from "react";
import { ChatMessage, QuickPrompt } from "../types";

interface LukaChatContextType {
  messages: ChatMessage[];
  isTyping: boolean;
  isFloatingOpen: boolean;
  setIsFloatingOpen: (open: boolean) => void;
  sendMessage: (text: string) => void;
  quickPrompts: QuickPrompt[];
  heroDockPulse: number;
  triggerHeroDockPulse: () => void;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "1",
    sender: "user",
    text: "¿Cómo van las ventas esta semana comparadas con la anterior?",
    timestamp: "10:42 AM",
  },
  {
    id: "2",
    sender: "assistant",
    text: "Las ventas esta semana ascienden a $12,450, lo que representa un aumento del 18% frente a la semana pasada.",
    timestamp: "10:42 AM",
    metricWidget: {
      title: "Crecimiento semanal",
      value: "$12,450",
      percentage: "+18%",
      progress: 75,
    },
  },
  {
    id: "3",
    sender: "user",
    text: "¡Excelente! Genera un reporte en PDF y envíamelo.",
    timestamp: "10:43 AM",
  },
  {
    id: "4",
    sender: "assistant",
    text: "¡Reporte generado! Te lo he enviado en PDF directamente por WhatsApp. También puedes consultarlo en tu dashboard en cualquier momento.",
    timestamp: "10:43 AM",
    actionButton: {
      label: "Comenzar Prueba Gratis",
      href: "/register",
    },
  },
];

const QUICK_PROMPTS: QuickPrompt[] = [
  {
    id: "p1",
    label: "¿Cómo funciona por WhatsApp?",
    query: "¿Cómo registro gastos o ingresos por WhatsApp?",
  },
  {
    id: "p2",
    label: "¿Qué reportes generas?",
    query: "¿Qué tipo de reportes y analíticas financieras me entregas?",
  },
  {
    id: "p3",
    label: "¿Cuáles son los planes?",
    query: "¿Cuáles son los planes de suscripción disponibles?",
  },
  {
    id: "p4",
    label: "¿Mis datos están seguros?",
    query: "¿Qué nivel de seguridad y privacidad tienen mis datos financieros?",
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

  const getResponseForQuery = (query: string): Omit<ChatMessage, "id" | "timestamp"> => {
    const q = query.toLowerCase();

    if (q.includes("whatsapp") || q.includes("registro") || q.includes("gasto") || q.includes("ingreso") || q.includes("audio") || q.includes("foto")) {
      return {
        sender: "assistant",
        text: "¡Es súper fácil! Solo me escribes a WhatsApp como si hablaras con un asistente humano: 'Gasté 45.000 en insumos hoy', me envías una nota de voz o la foto de una factura. Yo clasifico el movimiento y actualizo tu flujo de caja en tiempo real.",
        actionButton: {
          label: "Pruébalo Gratis",
          href: "/register",
        },
      };
    }

    if (q.includes("plan") || q.includes("precio") || q.includes("costo") || q.includes("cuanto cuesta") || q.includes("tarjeta")) {
      return {
        sender: "assistant",
        text: "Contamos con prueba gratis de 14 días sin necesidad de tarjeta de crédito. Además, tenemos planes adaptados para emprendedores y empresas en crecimiento con facturación mensual o anual.",
        actionButton: {
          label: "Ver Planes y Precios",
          href: "#planes",
        },
      };
    }

    if (q.includes("reporte") || q.includes("metrica") || q.includes("analitica") || q.includes("flujo de caja") || q.includes("pdf")) {
      return {
        sender: "assistant",
        text: "Genero reportes automáticos de balance mensual, ingresos vs gastos, márgenes de rentabilidad, alertas tempranas de liquidez y exportación instantánea a PDF o Excel.",
        metricWidget: {
          title: "Balance del Mes",
          value: "$28,900,000",
          percentage: "+24.5%",
          progress: 82,
        },
      };
    }

    if (q.includes("segur") || q.includes("privad") || q.includes("dato") || q.includes("banco")) {
      return {
        sender: "assistant",
        text: "Tus datos financieros se encuentran 100% encriptados de extremo a extremo con estándares de seguridad bancaria. Solo tú tienes acceso a tu información.",
      };
    }

    return {
      sender: "assistant",
      text: "¡Hola! Soy Luka, tu asistente inteligente para la gestión de tu negocio. Puedes preguntarme cómo registrar movimientos por WhatsApp, solicitar reportes de ventas o iniciar tu prueba gratis.",
      actionButton: {
        label: "Crear Cuenta Gratis",
        href: "/register",
      },
    };
  };

  const sendMessage = (text: string) => {
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    setTimeout(() => {
      const responseData = getResponseForQuery(text);
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        ...responseData,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setIsTyping(false);
    }, 850);
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
