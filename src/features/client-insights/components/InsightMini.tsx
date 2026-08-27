import { INSIGHTS_DATA } from "@/mocks";

export function InsightMini({ insight }: { insight: (typeof INSIGHTS_DATA)[0] }) {
  const cfg = {
    warning: { dot: "bg-amber-500", bg: "bg-amber-50 border border-amber-100", text: "text-gray-900", body: "text-gray-500" },
    success: { dot: "bg-emerald-500", bg: "bg-emerald-50 border border-emerald-100", text: "text-gray-900", body: "text-gray-500" },
    info: { dot: "bg-indigo-500", bg: "bg-indigo-50 border border-indigo-100", text: "text-gray-900", body: "text-gray-500" },
  }[insight.type];

  return (
    <div
      className={`rounded-xl p-4 ${cfg.bg} transition-opacity ${insight.read ? "opacity-55" : ""}`}
    >
      <div className="flex gap-3">
        <span className={`w-2 h-2 rounded-full mt-1 shrink-0 ${cfg.dot}`} />
        <div className="min-w-0">
          <p className={`text-sm font-bold mb-1 ${cfg.text} leading-tight`}>{insight.title}</p>
          <p className={`text-xs ${cfg.body} line-clamp-2 leading-relaxed`}>{insight.body}</p>
        </div>
      </div>
    </div>
  );
}
