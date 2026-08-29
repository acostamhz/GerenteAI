import { Navigate, Outlet } from 'react-router';
import { useAuth } from '@/features/auth';

/**
 * Ruta exclusiva para usuarios no autenticados (Login, Registro, Recuperación).
 * Si el usuario ya tiene sesión activa, lo redirige de inmediato a /dashboard.
 */
export function GuestRoute() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
