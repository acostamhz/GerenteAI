import { Sparkles, ArrowRight } from "lucide-react";
import { Link } from "react-router";
import { ChatMessage } from "../types";

export function ChatMessageItem({ message }: { message: ChatMessage }) {
  const isUser = message.sender === "user";

  if (isUser) {
    return (
      <div className="self-end max-w-[85%] bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-3 rounded-2xl rounded-tr-sm shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
        <p className="text-sm leading-relaxed">{message.text}</p>
        <span className="text-[10px] text-slate-400 dark:text-slate-500 block text-right mt-1 font-medium">
          {message.timestamp}
        </span>
      </div>
    );
  }

  return (
    <div className="self-start max-w-[90%] bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700/80 px-4 py-3.5 rounded-2xl rounded-tl-sm shadow-sm flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="shrink-0 w-6 h-6 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center mt-0.5">
        <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
      </div>

      <div className="flex-1 space-y-3">
        <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-normal">
          {message.text}
        </p>

        {/* Optional Metric Widget */}
        {message.metricWidget && (
          <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
                {message.metricWidget.title}
              </span>
              <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/20 px-2 py-0.5 rounded-full">
                {message.metricWidget.percentage}
              </span>
            </div>
            <div className="h-2 bg-emerald-200 dark:bg-emerald-900/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${message.metricWidget.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Optional Action Button */}
        {message.actionButton && (
          <div className="pt-1">
            {message.actionButton.href.startsWith("#") ? (
              <a
                href={message.actionButton.href}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>{message.actionButton.label}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            ) : (
              <Link
                to={message.actionButton.href}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>{message.actionButton.label}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        )}

        <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-medium">
          {message.timestamp}
        </span>
      </div>
    </div>
  );
}
