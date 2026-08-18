import { ArrowUpRight, Building2, Users, WalletCards } from "lucide-react";
import { investorOverview } from "../data/investor.mock";

function formatNumber(value: number) {
  return new Intl.NumberFormat("es-CO").format(value);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}

const cards = [
  {
    label: "Usuarios registrados",
    value: formatNumber(investorOverview.users.total),
    growth: investorOverview.users.monthlyGrowth,
    description: "usuarios en la plataforma",
    icon: Users,
  },
  {
    label: "Negocios registrados",
    value: formatNumber(investorOverview.businesses.total),
    growth: investorOverview.businesses.monthlyGrowth,
    description: "negocios utilizando Luka",
    icon: Building2,
  },
  {
    label: "MRR",
    value: formatCurrency(investorOverview.revenue.mrr),
    growth: investorOverview.revenue.monthlyGrowth,
    description: "ingresos recurrentes mensuales",
    icon: WalletCards,
  },
  {
    label: "Retención",
    value: `${investorOverview.retention.rate}%`,
    growth: 2.1,
    description: "retención de usuarios",
    icon: ArrowUpRight,
  },
];

export function InvestorKpiGrid() {
  return (
    <section
      id="overview"
      className="px-6 pb-20"
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => {
            const Icon = card.icon;

            return (
              <article
                key={card.label}
                className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 transition-colors group-hover:bg-emerald-50 group-hover:text-emerald-600">
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                    <ArrowUpRight className="h-3 w-3" />

                    {card.growth}%
                  </div>
                </div>

                <div className="mt-8">
                  <p className="text-sm font-medium text-slate-500">
                    {card.label}
                  </p>

                  <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                    {card.value}
                  </p>

                  <p className="mt-2 text-sm text-slate-400">
                    {card.description}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}