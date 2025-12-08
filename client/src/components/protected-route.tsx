import { useAuth } from "@/lib/auth-context";
import { Redirect } from "wouter";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: ('user' | 'agent' | 'admin')[];
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  requiredRoles,
  redirectTo = "/login"
}: ProtectedRouteProps) {
  const { user, isLoggedIn, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background" data-testid="loading-auth">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn || !user) {
    return <Redirect to={redirectTo} />;
  }

  if (requiredRoles && requiredRoles.length > 0) {
    const userRole = user.role || 'user';
    if (!requiredRoles.includes(userRole as 'user' | 'agent' | 'admin')) {
      return <Redirect to="/" />;
    }
  }

  return <>{children}</>;
}
