import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { businessGrowthData } from "../data/investor.mock";

export function InvestorUsersChart() {
  return (
    <section className="px-6 pb-20">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-8">
              <p className="text-sm font-semibold uppercase tracking-[0.15em] text-emerald-600">
                Platform
              </p>

              <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
                Negocios activos
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Evolución del número de negocios registrados en Luka.
              </p>
            </div>

            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={businessGrowthData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e2e8f0"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                  />

                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                  />

                  <Tooltip
                    cursor={{ fill: "#f8fafc" }}
                    contentStyle={{
                      borderRadius: "16px",
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
                    }}
                    formatter={(value) => [
                      `${Number(value).toLocaleString("es-CO")} negocios`,
                      "Negocios",
                    ]}
                  />

                  <Bar
                    dataKey="businesses"
                    fill="#10b981"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-sm sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.15em] text-emerald-400">
              Momentum
            </p>

            <h2 className="mt-3 text-2xl font-bold tracking-tight">
              Luka está creciendo.
            </h2>

            <p className="mt-4 text-sm leading-7 text-slate-400">
              Cada nuevo negocio representa una oportunidad de aumentar la
              adopción de Luka, generar actividad dentro de la plataforma y
              convertir usuarios en clientes recurrentes.
            </p>

            <div className="mt-10">
              <p className="text-sm text-slate-400">
                Negocios registrados
              </p>

              <p className="mt-2 text-5xl font-bold tracking-tight">
                347
              </p>

              <div className="mt-4 inline-flex items-center rounded-full bg-emerald-400/10 px-3 py-1.5 text-sm font-semibold text-emerald-400">
                +12.4% este mes
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}