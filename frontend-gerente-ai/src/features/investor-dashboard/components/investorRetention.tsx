import { Activity, Repeat2, TrendingDown, TrendingUp } from "lucide-react";

import { investorOverview } from "../data/investor.mock";

const metrics = [
  {
    label: "Retención",
    value: `${investorOverview.retention.rate}%`,
    description: "usuarios que permanecen activos",
    icon: Repeat2,
    positive: true,
  },
  {
    label: "Churn",
    value: `${investorOverview.retention.churn}%`,
    description: "tasa mensual de abandono",
    icon: TrendingDown,
    positive: true,
  },
  {
    label: "Usuarios activos",
    value: investorOverview.users.active.toLocaleString("es-CO"),
    description: "usuarios activos actualmente",
    icon: Activity,
    positive: true,
  },
  {
    label: "Negocios activos",
    value: investorOverview.businesses.active.toLocaleString("es-CO"),
    description: "negocios utilizando Luka",
    icon: TrendingUp,
    positive: true,
  },
];

export function InvestorRetention() {
  return (
    <section className="px-6 pb-20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-violet-600">
            Retention
          </p>

          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            Una plataforma que genera recurrencia
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            La retención permite entender qué tan valioso se vuelve Luka
            después de que un negocio comienza a utilizarlo.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric) => {
            const Icon = metric.icon;

            return (
              <article
                key={metric.label}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
                  <Icon className="h-5 w-5" />
                </div>

                <p className="mt-6 text-sm font-medium text-slate-500">
                  {metric.label}
                </p>

                <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                  {metric.value}
                </p>

                <p className="mt-2 text-sm leading-5 text-slate-400">
                  {metric.description}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}