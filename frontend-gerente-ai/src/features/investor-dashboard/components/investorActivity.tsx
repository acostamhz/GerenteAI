import {
  Activity,
  Building2,
  FileText,
  MessageSquare,
  UserPlus,
} from "lucide-react";

import { recentActivity } from "../data/investor.mock";

const icons = {
  business: Building2,
  user: UserPlus,
  subscription: Activity,
  report: FileText,
  ai: MessageSquare,
};

export function InvestorActivity() {
  return (
    <section
      id="activity"
      className="px-6 pb-24"
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-6 lg:grid-cols-[1fr_0.7fr]">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-8">
              <p className="text-sm font-semibold uppercase tracking-[0.15em] text-cyan-600">
                Live activity
              </p>

              <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
                Actividad reciente
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Una muestra de los eventos que ocurren dentro del ecosistema
                de Luka.
              </p>
            </div>

            <div className="divide-y divide-slate-100">
              {recentActivity.map((activity) => {
                const Icon =
                  icons[activity.type as keyof typeof icons] ?? Activity;

                return (
                  <div
                    key={activity.id}
                    className="flex gap-4 py-5 first:pt-0 last:pb-0"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                      <Icon className="h-4 w-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col justify-between gap-1 sm:flex-row">
                        <p className="text-sm font-semibold text-slate-900">
                          {activity.title}
                        </p>

                        <span className="text-xs text-slate-400">
                          {activity.time}
                        </span>
                      </div>

                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        {activity.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[2rem] bg-slate-950 p-8 text-white">
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl" />

            <div className="relative">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
                <Activity className="h-5 w-5 text-emerald-400" />
              </div>

              <h3 className="mt-8 text-2xl font-bold tracking-tight">
                Luka está activo.
              </h3>

              <p className="mt-4 text-sm leading-7 text-slate-400">
                Cada interacción representa datos, actividad y oportunidades
                para entender mejor el comportamiento de nuestros usuarios.
              </p>

              <div className="mt-10 space-y-5">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.15em] text-slate-500">
                    Interacciones
                  </p>

                  <p className="mt-2 text-3xl font-bold">
                    76.340
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.15em] text-slate-500">
                    Mensajes procesados
                  </p>

                  <p className="mt-2 text-3xl font-bold">
                    184.920
                  </p>
                </div>
              </div>

              <div className="mt-10 flex items-center gap-2 text-sm font-medium text-emerald-400">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />

                Sistema operativo
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}