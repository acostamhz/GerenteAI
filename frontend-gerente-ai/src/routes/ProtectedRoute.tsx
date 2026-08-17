import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "@/features/auth";
import { PageSkeleton } from "@/shared/components/ui/PageSkeleton";

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <PageSkeleton />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
