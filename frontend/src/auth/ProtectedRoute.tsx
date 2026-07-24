import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { UserRole, useAuth } from "./AuthContext";

export function ProtectedRoute({
  children,
  requiredRoles,
}: {
  children: ReactNode;
  requiredRoles?: UserRole[];
}) {
  const { isAuthenticated, isLoading, hasRole } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="grid min-h-[calc(100vh_-_70px)] place-items-center">
        <div className="rounded-lg border border-line bg-panel/80 p-6 font-mono text-sm text-cyan shadow-panel">
          authenticating session...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (requiredRoles && !hasRole(requiredRoles)) {
    return <Navigate to="/scenarios" replace />;
  }

  return <>{children}</>;
}
