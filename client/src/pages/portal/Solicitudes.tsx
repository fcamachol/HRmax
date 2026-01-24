import { useState } from "react";
import { useSearchParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Plus, Umbrella, Clock, Filter } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PortalMobileLayout } from "@/components/portal/layout/PortalMobileLayout";
import { BottomSheet } from "@/components/portal/layout/BottomSheet";
import { PullToRefresh } from "@/components/portal/layout/PullToRefresh";
import { cn } from "@/lib/utils";

type RequestStatus = "pendiente" | "aprobada" | "rechazada" | "cancelada";

interface Request {
  id: string;
  tipo: "vacaciones" | "permiso";
  fechaInicio: string;
  fechaFin: string;
  dias: number;
  estatus: RequestStatus;
  motivo?: string;
  fechaSolicitud: string;
}

const statusConfig: Record<RequestStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pendiente: { label: "Pendiente", variant: "secondary" },
  aprobada: { label: "Aprobada", variant: "default" },
  rechazada: { label: "Rechazada", variant: "destructive" },
  cancelada: { label: "Cancelada", variant: "outline" },
};

function RequestCard({ request }: { request: Request }) {
  const status = statusConfig[request.estatus];
  const isVacaciones = request.tipo === "vacaciones";

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
              isVacaciones ? "bg-blue-100 dark:bg-blue-900/30" : "bg-purple-100 dark:bg-purple-900/30"
            )}
          >
            {isVacaciones ? (
              <Umbrella className="h-5 w-5 text-blue-600" />
            ) : (
              <Clock className="h-5 w-5 text-purple-600" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium text-sm">
                {isVacaciones ? "Vacaciones" : "Permiso"}
              </p>
              <Badge variant={status.variant} className="text-xs">
                {status.label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {new Date(request.fechaInicio).toLocaleDateString("es-MX", {
                day: "numeric",
                month: "short",
              })}
              {request.fechaFin !== request.fechaInicio && (
                <>
                  {" - "}
                  {new Date(request.fechaFin).toLocaleDateString("es-MX", {
                    day: "numeric",
                    month: "short",
                  })}
                </>
              )}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {request.dias} día{request.dias !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RequestList({ tipo }: { tipo: "all" | "vacaciones" | "permisos" }) {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["/api/portal/solicitudes", tipo],
    queryFn: async () => {
      // TODO: Replace with actual API call
      const mockData: Request[] = [];
      return mockData;
    },
  });

  const handleRefresh = async () => {
    await refetch();
  };

  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Skeleton className="w-10 h-10 rounded-lg" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          {tipo === "vacaciones" ? (
            <Umbrella className="h-8 w-8 text-muted-foreground" />
          ) : tipo === "permisos" ? (
            <Clock className="h-8 w-8 text-muted-foreground" />
          ) : (
            <Filter className="h-8 w-8 text-muted-foreground" />
          )}
        </div>
        <p className="text-muted-foreground">
          No tienes solicitudes
          {tipo !== "all" && ` de ${tipo === "vacaciones" ? "vacaciones" : "permisos"}`}
        </p>
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="space-y-3 p-4">
        {data.map((request) => (
          <RequestCard key={request.id} request={request} />
        ))}
      </div>
    </PullToRefresh>
  );
}

export default function PortalSolicitudes() {
  const searchParams = new URLSearchParams(window.location.search);
  const initialTab = searchParams.get("tab") || "todas";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [requestType, setRequestType] = useState<"vacaciones" | "permiso" | null>(null);

  const handleNewRequest = (type: "vacaciones" | "permiso") => {
    setRequestType(type);
    setShowNewRequest(true);
  };

  return (
    <PortalMobileLayout title="Mis Solicitudes">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
        <div className="px-4 pt-2 pb-3 border-b bg-background sticky top-14 z-30">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="todas">Todas</TabsTrigger>
            <TabsTrigger value="vacaciones">Vacaciones</TabsTrigger>
            <TabsTrigger value="permisos">Permisos</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="todas" className="flex-1 mt-0">
          <RequestList tipo="all" />
        </TabsContent>
        <TabsContent value="vacaciones" className="flex-1 mt-0">
          <RequestList tipo="vacaciones" />
        </TabsContent>
        <TabsContent value="permisos" className="flex-1 mt-0">
          <RequestList tipo="permisos" />
        </TabsContent>
      </Tabs>

      {/* Floating Action Button */}
      <div className="fixed bottom-20 right-4 flex flex-col gap-2 z-40">
        <Button
          size="lg"
          className="rounded-full h-14 w-14 shadow-lg"
          onClick={() => handleNewRequest("vacaciones")}
        >
          <Plus className="h-6 w-6" />
          <span className="sr-only">Nueva solicitud</span>
        </Button>
      </div>

      {/* New Request Type Selection */}
      <BottomSheet
        isOpen={showNewRequest && !requestType}
        onClose={() => setShowNewRequest(false)}
        title="Nueva solicitud"
      >
        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full h-auto py-4 justify-start"
            onClick={() => handleNewRequest("vacaciones")}
          >
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-3">
              <Umbrella className="h-5 w-5 text-blue-600" />
            </div>
            <div className="text-left">
              <p className="font-medium">Vacaciones</p>
              <p className="text-xs text-muted-foreground">
                Solicitar días de descanso
              </p>
            </div>
          </Button>
          <Button
            variant="outline"
            className="w-full h-auto py-4 justify-start"
            onClick={() => handleNewRequest("permiso")}
          >
            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mr-3">
              <Clock className="h-5 w-5 text-purple-600" />
            </div>
            <div className="text-left">
              <p className="font-medium">Permiso</p>
              <p className="text-xs text-muted-foreground">
                Solicitar permiso especial
              </p>
            </div>
          </Button>
        </div>
      </BottomSheet>

      {/* Vacation Request Form */}
      <BottomSheet
        isOpen={requestType === "vacaciones"}
        onClose={() => setRequestType(null)}
        title="Solicitar vacaciones"
        height="full"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Formulario de vacaciones - Por implementar
          </p>
          <Button className="w-full" onClick={() => setRequestType(null)}>
            Cerrar
          </Button>
        </div>
      </BottomSheet>

      {/* Permission Request Form */}
      <BottomSheet
        isOpen={requestType === "permiso"}
        onClose={() => setRequestType(null)}
        title="Solicitar permiso"
        height="full"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Formulario de permiso - Por implementar
          </p>
          <Button className="w-full" onClick={() => setRequestType(null)}>
            Cerrar
          </Button>
        </div>
      </BottomSheet>
    </PortalMobileLayout>
  );
}
