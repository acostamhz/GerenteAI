import {
  BarChart3,
  Building2,
  Coffee,
  Store,
  Utensils,
} from "lucide-react";

import { businessTypeData } from "../data/investor.mock";

const icons = {
  Tiendas: Store,
  Restaurantes: Utensils,
  "Cafeterías": Coffee,
  Minimercados: Building2,
  Otros: BarChart3,
};

export function InvestorBusinessMetrics() {
  const total = businessTypeData.reduce(
    (sum, item) => sum + item.value,
    0,
  );

  return (
    <section className="px-6 pb-20">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.15em] text-amber-600">
                Market
              </p>

              <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                Diversificación del mercado
              </h2>

              <p className="mt-4 max-w-lg text-sm leading-7 text-slate-500">
                Luka está diseñado para acompañar diferentes tipos de
                micronegocios y convertirse en una capa inteligente de
                gestión para cada uno de ellos.
              </p>

              <div className="mt-8">
                <p className="text-sm font-medium text-slate-500">
                  Negocios representados
                </p>

                <p className="mt-2 text-4xl font-bold tracking-tight text-slate-950">
                  {total.toLocaleString("es-CO")}
                </p>
              </div>
            </div>

            <div className="space-y-5">
              {businessTypeData.map((business) => {
                const Icon =
                  icons[business.name as keyof typeof icons] ?? BarChart3;

                const percentage = Math.round(
                  (business.value / total) * 100,
                );

                return (
                  <div key={business.name}>
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                          <Icon className="h-4 w-4" />
                        </div>

                        <span className="text-sm font-semibold text-slate-700">
                          {business.name}
                        </span>
                      </div>

                      <div className="text-sm font-semibold text-slate-950">
                        {business.value}
                      </div>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-slate-900 transition-all"
                        style={{
                          width: `${percentage}%`,
                        }}
                      />
                    </div>

                    <p className="mt-1 text-right text-xs text-slate-400">
                      {percentage}% del total
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}