import { useState, FormEvent } from "react";
import { ArrowUp } from "lucide-react";
import { useLukaChat } from "../context/LukaChatContext";

export function ChatInput() {
  const [input, setInput] = useState("");
  const { sendMessage, isTyping } = useLukaChat();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;
    sendMessage(input);
    setInput("");
  };

  return (
    <div className="p-3 bg-white/60 dark:bg-slate-900/60 border-t border-gray-100 dark:border-white/5 backdrop-blur-md">
      {isTyping && (
        <div className="flex items-center gap-2 px-3 py-1 mb-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
          <div className="flex gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" />
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce delay-100" />
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce delay-200" />
          </div>
          <span>Luka está escribiendo...</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe una pregunta sobre Luka AI..."
          className="flex-1 px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700/80 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 transition-all shadow-sm"
        />
        <button
          type="submit"
          disabled={!input.trim() || isTyping}
          className="w-10 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white flex items-center justify-center transition-all shadow-md shadow-emerald-500/20 active:scale-95 cursor-pointer disabled:cursor-not-allowed shrink-0"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
