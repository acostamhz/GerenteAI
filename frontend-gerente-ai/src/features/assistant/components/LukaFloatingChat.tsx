import { useState, useEffect, useRef } from "react";
import { Bot, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useLukaChat } from "../context/LukaChatContext";
import { ChatMessageItem } from "./ChatMessageItem";
import { AssistantQuickPrompts } from "./AssistantQuickPrompts";
import { ChatInput } from "./ChatInput";

export function LukaFloatingChat() {
  const { messages, isFloatingOpen, setIsFloatingOpen, triggerHeroDockPulse } = useLukaChat();
  const [isVisible, setIsVisible] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isFloatingOpenRef = useRef(isFloatingOpen);

  useEffect(() => {
    isFloatingOpenRef.current = isFloatingOpen;
  }, [isFloatingOpen]);

  useEffect(() => {
    const handleScroll = () => {
      // Mostrar botón flotante después de 350px de scroll
      if (window.scrollY > 350) {
        setIsVisible(true);
      } else {
        if (isFloatingOpenRef.current) {
          // El chat estaba abierto y el usuario volvió al inicio: disparar efecto de re-acoplamiento en Hero
          triggerHeroDockPulse();
        }
        setIsVisible(false);
        setIsFloatingOpen(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [setIsFloatingOpen, triggerHeroDockPulse]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isFloatingOpen]);

  return (
    <>
      {/* Floating Action Button (FAB) */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed bottom-6 right-6 z-50"
          >
            <button
              onClick={() => setIsFloatingOpen(!isFloatingOpen)}
              className="relative group flex items-center gap-3 px-4 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full shadow-2xl shadow-emerald-500/40 hover:shadow-emerald-500/60 hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer"
            >
              <div className="relative">
                <Bot className="w-6 h-6" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-300 border-2 border-emerald-600 rounded-full animate-ping" />
              </div>
              <span className="text-sm font-bold pr-1 hidden sm:inline-block">¿Dudas? Habla con Luka</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Modal Window */}
      <AnimatePresence>
        {isFloatingOpen && isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: -18 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[540px] bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border border-slate-200/80 dark:border-white/10 rounded-[2rem] shadow-2xl shadow-slate-950/30 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-200/80 dark:border-white/5 bg-slate-50/70 dark:bg-slate-800/60 backdrop-blur-md flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <Bot className="w-5 h-5" />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">Luka AI</h3>
                  <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Asistente en vivo
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsFloatingOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 p-4 flex flex-col gap-3 overflow-y-auto">
              {messages.map((msg) => (
                <ChatMessageItem key={msg.id} message={msg} />
              ))}
            </div>

            {/* Quick Prompts */}
            <div className="px-3 border-t border-gray-100 dark:border-white/5 bg-slate-50/30 dark:bg-slate-900/30">
              <AssistantQuickPrompts />
            </div>

            {/* Chat Input */}
            <ChatInput />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
