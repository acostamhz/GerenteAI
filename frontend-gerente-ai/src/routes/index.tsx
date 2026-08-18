import { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageSkeleton } from "@/shared/components/ui/PageSkeleton";
import { ProtectedRoute } from "./ProtectedRoute";

// ============================================================
// LAZY LOADED FEATURE MODULES
// ============================================================

const DashboardPage = lazy(() =>
  import("@/features/client-dashboard").then((m) => ({
    default: m.DashboardView,
  }))
);

const InsightsPage = lazy(() =>
  import("@/features/client-insights").then((m) => ({
    default: m.InsightsView,
  }))
);

const CashflowPage = lazy(() =>
  import("@/features/client-cashflow").then((m) => ({
    default: m.CashflowView,
  }))
);

const SubscriptionPage = lazy(() =>
  import("@/features/client-subscription").then((m) => ({
    default: m.SubscriptionView,
  }))
);

const ManageSubscriptionPage = lazy(() =>
  import("@/features/client-manage-subscription").then((m) => ({
    default: m.ManageSubscriptionView,
  }))
);

const ProfilePage = lazy(() =>
  import("@/features/shared-profile").then((m) => ({
    default: m.ProfileView,
  }))
);

const AdminDashboardLayout = lazy(() =>
  import("@/features/admin-dashboard").then((m) => ({
    default: m.AdminDashboardLayout,
  }))
);

const AdminCrmView = lazy(() =>
  import("@/features/admin-crm").then((m) => ({
    default: m.AdminCrmView,
  }))
);

const AdminOpsView = lazy(() =>
  import("@/features/admin-ops").then((m) => ({
    default: m.AdminOpsView,
  }))
);

const LandingPage = lazy(() =>
  import("@/features/landing-page").then((m) => ({
    default: m.LandingPageView,
  }))
);

const LoginPage = lazy(() =>
  import("@/features/auth").then((m) => ({
    default: m.LoginPage,
  }))
);

const RegisterPage = lazy(() =>
  import("@/features/auth").then((m) => ({
    default: m.RegisterPage,
  }))
);

const VerificarEmailPage = lazy(() =>
  import("@/features/auth").then((m) => ({
    default: m.VerificarEmailPage,
  }))
);

const ForgotPasswordPage = lazy(() =>
  import("@/features/auth").then((m) => ({
    default: m.ForgotPasswordPage,
  }))
);

const ResetPasswordPage = lazy(() =>
  import("@/features/auth").then((m) => ({
    default: m.ResetPasswordPage,
  }))
);

// ============================================================
// INVESTOR DASHBOARD
// PUBLIC - NO REQUIERE AUTENTICACIÓN
// ============================================================

const InvestorDashboardPage = lazy(() =>
  import("@/features/investor-dashboard").then((m) => ({
    default: m.InvestorDashboardView,
  }))
);

// ============================================================
// ROUTES
// ============================================================

export function AppRoutes() {
  return (
    <Routes>
      {/* ======================================================
          PUBLIC ROUTES
          ====================================================== */}

      <Route
        path="/login"
        element={
          <Suspense fallback={<PageSkeleton />}>
            <LoginPage />
          </Suspense>
        }
      />

      <Route
        path="/register"
        element={
          <Suspense fallback={<PageSkeleton />}>
            <RegisterPage />
          </Suspense>
        }
      />

      <Route
        path="/verificar-email"
        element={
          <Suspense fallback={<PageSkeleton />}>
            <VerificarEmailPage />
          </Suspense>
        }
      />

      <Route
        path="/forgot-password"
        element={
          <Suspense fallback={<PageSkeleton />}>
            <ForgotPasswordPage />
          </Suspense>
        }
      />

      <Route
        path="/recuperar-password"
        element={
          <Navigate
            to="/forgot-password"
            replace
          />
        }
      />

      <Route
        path="/restablecer-password"
        element={
          <Suspense fallback={<PageSkeleton />}>
            <ResetPasswordPage />
          </Suspense>
        }
      />

      <Route
        path="/reset-password"
        element={
          <Navigate
            to="/restablecer-password"
            replace
          />
        }
      />

      <Route
        path="/home"
        element={
          <Suspense fallback={<PageSkeleton />}>
            <LandingPage />
          </Suspense>
        }
      />

      {/* ======================================================
          INVESTOR DASHBOARD
          
          ESTA RUTA ES PÚBLICA.
          NO ESTÁ DENTRO DE ProtectedRoute.
          
          URL:
          /investors
          ====================================================== */}

      <Route
        path="/investors"
        element={
          <Suspense fallback={<PageSkeleton />}>
            <InvestorDashboardPage />
          </Suspense>
        }
      />

      {/* ======================================================
          PROTECTED ROUTES
          
          Todo lo que esté dentro de este Route requiere
          autenticación.
          ====================================================== */}

      <Route element={<ProtectedRoute />}>
        {/* ====================================================
            MAIN APPLICATION
            ==================================================== */}

        <Route
          path="/"
          element={<AppLayout />}
        >
          {/* Dashboard */}
          <Route
            index
            element={
              <Suspense fallback={<PageSkeleton />}>
                <DashboardPage />
              </Suspense>
            }
          />

          {/* Insights */}
          <Route
            path="insights"
            element={
              <Suspense fallback={<PageSkeleton />}>
                <InsightsPage />
              </Suspense>
            }
          />

          {/* Cashflow */}
          <Route
            path="cashflow"
            element={
              <Suspense fallback={<PageSkeleton />}>
                <CashflowPage />
              </Suspense>
            }
          />

          {/* Subscription */}
          <Route
            path="subscription"
            element={
              <Suspense fallback={<PageSkeleton />}>
                <SubscriptionPage />
              </Suspense>
            }
          />

          {/* Manage Subscription */}
          <Route
            path="manage-subscription"
            element={
              <Suspense fallback={<PageSkeleton />}>
                <ManageSubscriptionPage />
              </Suspense>
            }
          />

          {/* Profile */}
          <Route
            path="profile"
            element={
              <Suspense fallback={<PageSkeleton />}>
                <ProfilePage />
              </Suspense>
            }
          />

          {/* ==================================================
              ADMIN ROUTES
              ================================================== */}

          <Route
            path="admin"
            element={
              <Suspense fallback={<PageSkeleton />}>
                <AdminDashboardLayout />
              </Suspense>
            }
          >
            {/* /admin → /admin/crm */}
            <Route
              index
              element={
                <Navigate
                  to="crm"
                  replace
                />
              }
            />

            {/* Admin CRM */}
            <Route
              path="crm"
              element={
                <Suspense fallback={<PageSkeleton />}>
                  <AdminCrmView />
                </Suspense>
              }
            />

            {/* Admin Operations */}
            <Route
              path="ops"
              element={
                <Suspense fallback={<PageSkeleton />}>
                  <AdminOpsView />
                </Suspense>
              }
            />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}