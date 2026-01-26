import { ReactNode } from "react";
import { Redirect } from "wouter";
import { Loader2, AlertTriangle } from "lucide-react";
import { usePortalAuth } from "@/contexts/PortalAuthContext";

interface RequirePortalAuthProps {
  children: ReactNode;
}

export function RequirePortalAuth({ children }: RequirePortalAuthProps) {
  const { isAuthenticated, isLoading, clienteId, clientError } = usePortalAuth();

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

  // Show error if invalid client slug
  if (clientError) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-destructive/5 to-background flex flex-col items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 bg-destructive/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-10 w-10 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Portal no encontrado</h1>
          <p className="text-muted-foreground">
            {clientError}
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to={`/portal/${clienteId}/login`} />;
  }

  return <>{children}</>;
}
