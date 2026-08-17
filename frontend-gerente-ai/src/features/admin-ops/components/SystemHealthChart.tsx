import { 
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  BarChart, Bar 
} from "recharts";
import { DateDropdown } from "@/shared/components/ui/DateDropdown";

const LATENCY_DATA = [
  { day: "Lun", latency: 120 },
  { day: "Mar", latency: 150 },
  { day: "Mie", latency: 140 },
  { day: "Jue", latency: 200 },
  { day: "Vie", latency: 800 },
  { day: "Sab", latency: 130 },
  { day: "Dom", latency: 145 },
];

const TOKEN_DATA = [
  { day: "Lun", tokens: 45000 },
  { day: "Mar", tokens: 52000 },
  { day: "Mie", tokens: 48000 },
  { day: "Jue", tokens: 61000 },
  { day: "Vie", tokens: 59000 },
  { day: "Sab", tokens: 30000 },
  { day: "Dom", tokens: 25000 },
];

export function SystemHealthChart() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Latency Chart */}
      <div className="bg-card rounded-2xl shadow-sm border border-border p-6 flex flex-col">
        <div className="mb-4 flex justify-between items-start gap-4">
          <div>
            <h3 className="font-bold text-foreground">Latencia de Webhooks (n8n)</h3>
            <p className="text-xs text-muted-foreground font-medium">Tiempo promedio de procesamiento de las solicitudes de webhook.</p>
          </div>
          <DateDropdown value="7" />
        </div>
        <div className="flex-1 min-h-[256px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={LATENCY_DATA}>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }} tickFormatter={(value) => `${value} ms`} />
              <Tooltip 
                formatter={(value: number) => [`${value} ms`, 'Latencia']}
                contentStyle={{ backgroundColor: 'var(--color-card)', color: 'var(--color-foreground)', borderRadius: '12px', border: '1px solid var(--color-border)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Line type="monotone" dataKey="latency" stroke="#e11d48" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Token Usage Chart */}
      <div className="bg-card rounded-2xl shadow-sm border border-border p-6 flex flex-col">
        <div className="mb-4 flex justify-between items-start gap-4">
          <div>
            <h3 className="font-bold text-foreground">Consumo de Tokens (OpenAI)</h3>
            <p className="text-xs text-muted-foreground font-medium">Volumen de tokens procesados por la IA en la última semana.</p>
          </div>
          <DateDropdown value="7" />
        </div>
        <div className="flex-1 min-h-[256px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={TOKEN_DATA}>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }} />
              <Tooltip 
                cursor={{ fill: 'var(--color-muted)', opacity: 0.2 }}
                contentStyle={{ backgroundColor: 'var(--color-card)', color: 'var(--color-foreground)', borderRadius: '12px', border: '1px solid var(--color-border)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="tokens" fill="#4f46e5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
