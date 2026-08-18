import { InvestorNavbar } from "./components/investorNavbar";
import { InvestorHero } from "./components/investorHero";
import { InvestorKpiGrid } from "./components/investorKpiGrid";
import { InvestorGrowthChart } from "./components/investorGrowthChart";
import { InvestorRevenueChart } from "./components/investorRevenueChart";
import { InvestorUsersChart } from "./components/investorUsersChart";
import { InvestorRetention } from "./components/investorRetention";
import { InvestorBusinessMetrics } from "./components/investorBusinessMetrics";
import { InvestorActivity } from "./components/investorActivity";
import { InvestorFooter } from "./components/investorFooter";

export default function InvestorDashboardView() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <InvestorNavbar />

      <main>
        <InvestorHero />

        <InvestorKpiGrid />

        <InvestorGrowthChart />

        <InvestorRevenueChart />

        <InvestorUsersChart />

        <InvestorRetention />

        <InvestorBusinessMetrics />

        <InvestorActivity />
      </main>

      <InvestorFooter />
    </div>
  );
}