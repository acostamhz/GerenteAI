import { Users, MessageSquare, TrendingDown, TrendingUp, Activity, UserPlus } from "lucide-react";
import { BarChart, Bar, ResponsiveContainer, Tooltip, XAxis, LabelList } from "recharts";

const messageData = [
  { name: 'Lun', msg: 1200 },
  { name: 'Mar', msg: 1900 },
  { name: 'Mié', msg: 2200 },
  { name: 'Jue', msg: 2800 },
  { name: 'Vie', msg: 3100 },
  { name: 'Sáb', msg: 2100 },
  { name: 'Dom', msg: 1200 },
];

export function AdminMetrics() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      {/* Mensajes Procesados Card (Large) */}
      <div className="md:col-span-2 bg-card bg-gradient-to-br from-emerald-500/5 to-transparent rounded-2xl p-6 shadow-md border border-border flex flex-col md:flex-row gap-6">
        
        {/* Left Side: Stats */}
        <div className="flex flex-col justify-between w-full md:w-5/12 border-b md:border-b-0 md:border-r border-border/50 pb-4 md:pb-0 md:pr-6">
          <div>
            <div className="flex items-center gap-3 text-muted-foreground font-medium text-sm mb-4">
              <MessageSquare className="w-5 h-5 text-emerald-500" /> Mensajes Procesados
            </div>
            <p className="text-5xl font-black text-foreground tracking-tight mb-2">
              14.5K
            </p>
          </div>
          
          <div className="mt-4">
            <p className="text-xs text-muted-foreground font-medium mb-1">Crecimiento Semanal</p>
            <p className="text-sm font-bold flex items-center gap-1 text-emerald-500">
              <TrendingUp className="w-4 h-4" /> +15.3% <span className="text-muted-foreground font-normal">vs sem ant.</span>
            </p>
          </div>
        </div>
        
        {/* Right Side: Chart */}
        <div className="flex-1 flex flex-col justify-between">
          <div className="h-[140px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={messageData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--card)', color: 'var(--foreground)', fontSize: '12px' }}
                  itemStyle={{ color: 'var(--foreground)' }}
                />
                <Bar dataKey="msg" fill="#10b981" radius={[4, 4, 0, 0]} barSize={16}>
                  <LabelList dataKey="msg" position="top" fill="var(--muted-foreground)" fontSize={11} fontWeight="bold" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 text-center">
            <p className="text-xs text-muted-foreground font-medium bg-muted/30 inline-block px-3 py-1 rounded-full border border-border/50">
              20 de julio - 27 de julio
            </p>
          </div>
        </div>
      </div>

      {/* Tenants + DAU Card (Small) */}
      <div className="bg-card bg-gradient-to-br from-emerald-500/5 to-transparent rounded-2xl p-6 shadow-md border border-border flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 text-muted-foreground font-medium text-sm mb-4">
            <Users className="w-5 h-5 text-emerald-500" /> Negocios Activos
          </div>
          <p className="text-4xl font-black text-foreground tracking-tight mb-2">
            42
          </p>
        </div>
        
        <div className="mt-4 pt-4 border-t border-border/50">
          <div className="flex flex-col">
            <div className="flex items-center justify-between">
              <p className="text-xl font-bold text-foreground">DAU</p>
              <p className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded flex items-center gap-1">
                <Activity className="w-3 h-3" /> 78%
              </p>
            </div>
            <p className="text-xs text-muted-foreground font-medium mt-1">Usuarios diarios</p>
          </div>
        </div>
      </div>

      {/* New Users Card (Small) */}
      <div className="bg-card bg-gradient-to-br from-emerald-500/5 to-transparent rounded-2xl p-6 shadow-md border border-border flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 text-muted-foreground font-medium text-sm mb-4">
            <UserPlus className="w-5 h-5 text-emerald-500" /> Nuevos Usuarios
          </div>
          <p className="text-4xl font-black text-foreground tracking-tight mb-2">
            1,457
          </p>
        </div>
        
        <div className="mt-4 pt-4 border-t border-border/50">
          <p className="text-xs font-medium flex items-center gap-1 text-rose-500">
            <TrendingDown className="w-4 h-4" /> 2.9% <span className="text-muted-foreground font-normal">vs mes ant.</span>
          </p>
        </div>
      </div>
    </div>
  );
}
