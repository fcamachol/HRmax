import { ReactNode } from "react";
import { Redirect } from "wouter";
import { Loader2 } from "lucide-react";
import { usePortalAuth } from "@/contexts/PortalAuthContext";

interface RequirePortalAuthProps {
  children: ReactNode;
}

export function RequirePortalAuth({ children }: RequirePortalAuthProps) {
  const { isAuthenticated, isLoading } = usePortalAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/portal/login" />;
  }

  return <>{children}</>;
}
