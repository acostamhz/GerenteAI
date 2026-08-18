import {
  Activity,
  Repeat2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

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
    <section className="scroll-mt-28 px-6 pb-20">
      <div className="mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-violet-600 dark:text-violet-400">
            Retention
          </p>

          <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Una plataforma que genera recurrencia
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            La retención permite entender qué tan valioso se vuelve Luka
            después de que un negocio comienza a utilizarlo.
          </p>
        </div>

        {/* Metrics */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric) => {
            const Icon = metric.icon;

            return (
              <article
                key={metric.label}
                className="group rounded-3xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-black/20"
              >
                {/* Icon */}
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-600 transition-all duration-300 group-hover:bg-violet-100 group-hover:scale-105 dark:bg-violet-500/10 dark:text-violet-400 dark:group-hover:bg-violet-500/15">
                  <Icon className="h-5 w-5" />
                </div>

                {/* Label */}
                <p className="mt-6 text-sm font-medium text-muted-foreground">
                  {metric.label}
                </p>

                {/* Value */}
                <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">
                  {metric.value}
                </p>

                {/* Description */}
                <p className="mt-2 text-sm leading-5 text-muted-foreground/70">
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