import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  Umbrella,
  Clock,
  FileText,
  Receipt,
  Folder,
  ChevronRight,
  CalendarDays,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PortalMobileLayout } from "@/components/portal/layout/PortalMobileLayout";
import { PullToRefresh } from "@/components/portal/layout/PullToRefresh";
import { usePortalAuth } from "@/contexts/PortalAuthContext";
import { cn } from "@/lib/utils";

interface QuickAction {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  color: string;
}

const quickActionsConfig: QuickAction[] = [
  {
    title: "Vacaciones",
    description: "Solicitar días",
    icon: Umbrella,
    path: "/solicitudes?tab=vacaciones",
    color: "bg-blue-500",
  },
  {
    title: "Permiso",
    description: "Solicitar permiso",
    icon: Clock,
    path: "/solicitudes?tab=permisos",
    color: "bg-purple-500",
  },
  {
    title: "Recibos",
    description: "Ver nómina",
    icon: Receipt,
    path: "/recibos",
    color: "bg-green-500",
  },
  {
    title: "Documentos",
    description: "Mis archivos",
    icon: Folder,
    path: "/mas/documentos",
    color: "bg-orange-500",
  },
];

export default function PortalHome() {
  const { employee, clienteId } = usePortalAuth();

  const quickActions = quickActionsConfig.map(action => ({
    ...action,
    href: `/portal/${clienteId}${action.path}`,
  }));

  // Fetch dashboard data
  const { data: dashboardData, refetch, isLoading } = useQuery({
    queryKey: ["/api/portal/dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/portal/dashboard", {
        credentials: "include",
      });
      if (!res.ok) {
        // Return default data if endpoint doesn't exist yet
        return {
          vacacionesDisponibles: employee?.diasVacacionesDisponibles || 0,
          solicitudesPendientes: 0,
          ultimoRecibo: null,
          anunciosPendientes: 0,
        };
      }
      return res.json();
    },
  });

  const handleRefresh = async () => {
    await refetch();
  };

  return (
    <PortalMobileLayout>
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="px-4 py-4 space-y-6">
          {/* Vacation Balance Card */}
          <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Días de vacaciones</p>
                  {isLoading ? (
                    <Skeleton className="h-10 w-16 bg-primary-foreground/20 mt-1" />
                  ) : (
                    <p className="text-4xl font-bold mt-1">
                      {dashboardData?.vacacionesDisponibles || 0}
                    </p>
                  )}
                  <p className="text-xs opacity-75 mt-1">disponibles</p>
                </div>
                <CalendarDays className="h-12 w-12 opacity-50" />
              </div>
              <Link href={`/portal/${clienteId}/solicitudes?tab=vacaciones`}>
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-4 w-full bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground border-0"
                >
                  Solicitar vacaciones
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Quick Actions Grid */}
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground mb-3 px-1">
              Acciones rápidas
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action) => (
                <Link key={action.href} href={action.href}>
                  <Card className="h-full hover:bg-accent/50 transition-colors active:scale-[0.98] touch-manipulation">
                    <CardContent className="p-4">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center mb-3",
                          action.color
                        )}
                      >
                        <action.icon className="h-5 w-5 text-white" />
                      </div>
                      <p className="font-medium text-sm">{action.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {action.description}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>

          {/* Pending Requests */}
          {(dashboardData?.solicitudesPendientes || 0) > 0 && (
            <Link href={`/portal/${clienteId}/solicitudes`}>
              <Card className="border-yellow-500/50 bg-yellow-50 dark:bg-yellow-900/10">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">Solicitudes pendientes</p>
                    <p className="text-xs text-muted-foreground">
                      Tienes {dashboardData?.solicitudesPendientes} solicitud(es)
                      en proceso
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          )}

          {/* Recent Payslip Preview */}
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="text-sm font-semibold text-muted-foreground">
                Último recibo
              </h2>
              <Link href={`/portal/${clienteId}/recibos`}>
                <Button variant="ghost" size="sm" className="text-xs h-7">
                  Ver todos
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
            {isLoading ? (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-lg" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-32 mb-2" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-6 w-20" />
                  </div>
                </CardContent>
              </Card>
            ) : dashboardData?.ultimoRecibo ? (
              <Link href={`/portal/${clienteId}/recibos/${dashboardData.ultimoRecibo.id}`}>
                <Card className="hover:bg-accent/50 transition-colors active:scale-[0.98] touch-manipulation">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {dashboardData.ultimoRecibo.periodo}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {dashboardData.ultimoRecibo.fecha}
                      </p>
                    </div>
                    <Badge variant="secondary" className="font-mono">
                      ${Number(dashboardData.ultimoRecibo.neto).toLocaleString()}
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <FileText className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No hay recibos disponibles
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Announcements Preview */}
          {(dashboardData?.anunciosPendientes || 0) > 0 && (
            <Link href={`/portal/${clienteId}/mas/anuncios`}>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <Badge variant="destructive" className="h-6 min-w-6 px-2">
                    {dashboardData?.anunciosPendientes}
                  </Badge>
                  <p className="text-sm">
                    Anuncio(s) sin leer
                  </p>
                  <ChevronRight className="h-5 w-5 text-muted-foreground ml-auto" />
                </CardContent>
              </Card>
            </Link>
          )}
        </div>
      </PullToRefresh>
    </PortalMobileLayout>
  );
}
