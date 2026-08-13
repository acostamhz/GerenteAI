import { useEffect, useRef, useState } from "react";
import { Bot } from "lucide-react";
import { motion } from "motion/react";
import { useLukaChat } from "../context/LukaChatContext";
import { ChatMessageItem } from "./ChatMessageItem";
import { AssistantQuickPrompts } from "./AssistantQuickPrompts";
import { ChatInput } from "./ChatInput";

export function LukaHeroChat() {
  const { messages, heroDockPulse } = useLukaChat();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDocking, setIsDocking] = useState(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (heroDockPulse > 0) {
      setIsDocking(true);
      const timer = setTimeout(() => setIsDocking(false), 900);
      return () => clearTimeout(timer);
    }
  }, [heroDockPulse]);

  return (
    <div className="w-full max-w-lg relative z-10">
      {/* Ambient Glow behind the chat with smooth Bloom */}
      <motion.div
        animate={
          isDocking
            ? {
                scale: [1, 1.28, 1],
                opacity: [0.25, 0.8, 0.25],
              }
            : {
                scale: 1,
                opacity: 0.25,
              }
        }
        transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
        className="absolute inset-0 bg-gradient-to-tr from-emerald-500/25 to-teal-400/25 blur-3xl rounded-[2.5rem] -z-10 pointer-events-none"
      />

      {/* Main Chat Card with Silky Spring Reaction */}
      <motion.div
        animate={
          isDocking
            ? {
                scale: [0.975, 1.018, 1],
                y: [8, -2, 0],
                boxShadow: [
                  "0 20px 25px -5px rgba(0, 0, 0, 0.08)",
                  "0 0 35px 2px rgba(16, 185, 129, 0.35)",
                  "0 20px 25px -5px rgba(0, 0, 0, 0.08)",
                ],
              }
            : {
                scale: 1,
                y: 0,
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.08)",
              }
        }
        transition={{
          duration: 0.75,
          ease: [0.22, 1, 0.36, 1],
        }}
        className="relative bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-[2rem] shadow-2xl shadow-slate-900/10 dark:shadow-slate-950/50 overflow-hidden flex flex-col h-[520px] transition-colors duration-300"
      >
        {/* Shimmer line when re-docking */}
        {isDocking && (
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: "200%" }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent z-30 pointer-events-none"
          />
        )}

        {/* Chat Header */}
        <div className="px-6 py-3.5 border-b border-gray-200/80 dark:border-white/5 bg-slate-50/60 dark:bg-slate-800/50 backdrop-blur-md flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Bot className="w-5 h-5" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Luka AI</h3>
              <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                En línea • Prueba interactiva
              </p>
            </div>
          </div>
        </div>

        {/* Chat Body */}
        <div ref={scrollRef} className="flex-1 p-5 flex flex-col gap-3.5 overflow-y-auto">
          {messages.map((msg) => (
            <ChatMessageItem key={msg.id} message={msg} />
          ))}
        </div>

        {/* Quick Prompts */}
        <div className="px-4 border-t border-gray-100/60 dark:border-white/5 bg-slate-50/30 dark:bg-slate-900/30">
          <AssistantQuickPrompts />
        </div>

        {/* Chat Input */}
        <ChatInput />
      </motion.div>
    </div>
  );
}
