import { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageSkeleton } from "@/shared/components/ui/PageSkeleton";

// Lazy loaded feature modules (Public API imports)
const DashboardPage = lazy(() => import("@/features/client-dashboard").then(m => ({ default: m.DashboardView })));
const InsightsPage = lazy(() => import("@/features/client-insights").then(m => ({ default: m.InsightsView })));
const CashflowPage = lazy(() => import("@/features/client-cashflow").then(m => ({ default: m.CashflowView })));
const SubscriptionPage = lazy(() => import("@/features/client-subscription").then(m => ({ default: m.SubscriptionView })));
const ManageSubscriptionPage = lazy(() => import("@/features/client-manage-subscription").then(m => ({ default: m.ManageSubscriptionView })));
const ProfilePage = lazy(() => import("@/features/shared-profile").then(m => ({ default: m.ProfileView })));
const AdminDashboardLayout = lazy(() => import("@/features/admin-dashboard").then(m => ({ default: m.AdminDashboardLayout })));
const AdminCrmView = lazy(() => import("@/features/admin-crm").then(m => ({ default: m.AdminCrmView })));
const AdminOpsView = lazy(() => import("@/features/admin-ops").then(m => ({ default: m.AdminOpsView })));
const LandingPage = lazy(() => import("@/features/landing-page").then(m => ({ default: m.LandingPageView })));
const LoginPage = lazy(() => import("@/features/auth").then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import("@/features/auth").then(m => ({ default: m.RegisterPage })));

export function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={
        <Suspense fallback={<PageSkeleton />}>
          <RegisterPage />
        </Suspense>
      } />
      <Route path="/home" element={
        <Suspense fallback={<PageSkeleton />}>
          <LandingPage />
        </Suspense>
      } />

      {/* Protected/App Routes */}
      <Route path="/" element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="insights" element={<InsightsPage />} />
        <Route path="cashflow" element={<CashflowPage />} />
        <Route path="subscription" element={<SubscriptionPage />} />
        <Route path="manage-subscription" element={<ManageSubscriptionPage />} />
        <Route path="profile" element={<ProfilePage />} />
        
        {/* Admin Routes */}
        <Route path="admin" element={<AdminDashboardLayout />}>
          <Route index element={<Navigate to="crm" replace />} />
          <Route path="crm" element={<AdminCrmView />} />
          <Route path="ops" element={<AdminOpsView />} />
        </Route>
      </Route>
    </Routes>
  );
}
