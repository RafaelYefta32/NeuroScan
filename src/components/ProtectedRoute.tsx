import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: number[]; // [1] untuk admin, [2] untuk user, dsb.
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Memuat sesi...</p>
        </div>
      </div>
    );
  }

  // Jika belum login, redirect ke halaman login dengan parameter redirect
  if (!user || !profile) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Periksa role jika ditentukan
  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(profile.role_id)) {
      // Jika role tidak sesuai, arahkan ke dashboard yang sesuai dengan rolenya
      if (profile.role_id === 1) {
        return <Navigate to="/admin" replace />;
      } else {
        return <Navigate to="/app" replace />;
      }
    }
  }

  return <>{children}</>;
}
