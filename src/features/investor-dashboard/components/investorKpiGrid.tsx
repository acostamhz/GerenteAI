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
    <section id="overview" className="px-6 pb-20">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => {
            const Icon = card.icon;

            return (
              <article
                key={card.label}
                className="
                  group relative overflow-hidden rounded-3xl
                  border border-border
                  bg-card/70
                  p-6
                  shadow-sm
                  backdrop-blur-xl
                  transition-all duration-300
                  hover:-translate-y-1
                  hover:shadow-xl
                  hover:shadow-emerald-500/10
                  dark:bg-card/60
                "
              >
                {/* Ambient glow */}
                <div
                  className="
                    pointer-events-none absolute -right-12 -top-12
                    h-32 w-32 rounded-full
                    bg-emerald-500/10
                    blur-3xl
                    opacity-0
                    transition-opacity duration-500
                    group-hover:opacity-100
                  "
                />

                <div className="relative z-10">
                  <div className="flex items-start justify-between">
                    {/* Icon */}
                    <div
                      className="
                        flex h-11 w-11 items-center justify-center
                        rounded-2xl
                        border border-border
                        bg-muted/60
                        text-muted-foreground
                        shadow-sm
                        transition-all duration-300
                        group-hover:border-emerald-500/20
                        group-hover:bg-emerald-500/10
                        group-hover:text-emerald-600
                        dark:group-hover:text-emerald-400
                      "
                    >
                      <Icon className="h-5 w-5" strokeWidth={2} />
                    </div>

                    {/* Growth */}
                    <div
                      className="
                        flex items-center gap-1
                        rounded-full
                        border border-emerald-500/10
                        bg-emerald-500/10
                        px-2.5 py-1
                        text-xs font-semibold
                        text-emerald-700
                        dark:text-emerald-400
                      "
                    >
                      <ArrowUpRight className="h-3 w-3" strokeWidth={2.5} />
                      {card.growth}%
                    </div>
                  </div>

                  <div className="mt-8">
                    <p className="text-sm font-medium text-muted-foreground">
                      {card.label}
                    </p>

                    <p
                      className="
                        mt-2
                        text-3xl font-bold tracking-tight
                        text-foreground
                      "
                    >
                      {card.value}
                    </p>

                    <p className="mt-2 text-sm text-muted-foreground/70">
                      {card.description}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}