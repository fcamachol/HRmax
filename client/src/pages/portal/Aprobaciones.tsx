import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle,
  XCircle,
  Clock,
  Umbrella,
  FileText,
  AlertCircle,
  ChevronRight,
  Loader2,
  Calendar,
  User,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PortalMobileLayout } from "@/components/portal/layout/PortalMobileLayout";
import { PullToRefresh } from "@/components/portal/layout/PullToRefresh";
import { BottomSheet } from "@/components/portal/layout/BottomSheet";
import { usePortalAuth } from "@/contexts/PortalAuthContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ApprovalRequest {
  id: number;
  tipo: "vacaciones" | "permiso" | "documento" | "otro";
  empleadoId: number;
  empleadoNombre: string;
  empleadoFoto?: string;
  empleadoPuesto: string;
  fechaSolicitud: string;
  fechaInicio?: string;
  fechaFin?: string;
  diasSolicitados?: number;
  motivo?: string;
  estado: "pendiente" | "aprobado" | "rechazado";
  comentarioAprobador?: string;
}

type FilterType = "pendiente" | "aprobado" | "rechazado" | "todos";
type TabType = "pendientes" | "historial";

export default function PortalAprobaciones() {
  const { clienteId, employee } = usePortalAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>("pendientes");
  const [filter, setFilter] = useState<FilterType>("todos");
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
  const [comment, setComment] = useState("");

  // Fetch pending approvals
  const { data: pendingRequests, isLoading: loadingPending, refetch: refetchPending } = useQuery({
    queryKey: ["/api/portal/aprobaciones"],
    queryFn: async () => {
      const res = await fetch("/api/portal/aprobaciones", {
        credentials: "include",
      });
      if (!res.ok) return [];
      return res.json() as Promise<ApprovalRequest[]>;
    },
  });

  // Fetch approval history
  const { data: historyRequests, isLoading: loadingHistory, refetch: refetchHistory } = useQuery({
    queryKey: ["/api/portal/aprobaciones/historial"],
    queryFn: async () => {
      const res = await fetch("/api/portal/aprobaciones/historial", {
        credentials: "include",
      });
      if (!res.ok) return [];
      return res.json() as Promise<ApprovalRequest[]>;
    },
    enabled: activeTab === "historial",
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async ({ id, comentario }: { id: number; comentario?: string }) => {
      const res = await fetch(`/api/portal/aprobaciones/${id}/aprobar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ comentario }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Error al aprobar solicitud");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Solicitud aprobada",
        description: "La solicitud ha sido aprobada correctamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/portal/aprobaciones"] });
      setSelectedRequest(null);
      setComment("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ id, comentario }: { id: number; comentario?: string }) => {
      const res = await fetch(`/api/portal/aprobaciones/${id}/rechazar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ comentario }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Error al rechazar solicitud");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Solicitud rechazada",
        description: "La solicitud ha sido rechazada",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/portal/aprobaciones"] });
      setSelectedRequest(null);
      setComment("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleRefresh = async () => {
    if (activeTab === "pendientes") {
      await refetchPending();
    } else {
      await refetchHistory();
    }
  };

  const getTypeIcon = (tipo: ApprovalRequest["tipo"]) => {
    switch (tipo) {
      case "vacaciones":
        return <Umbrella className="h-5 w-5 text-blue-600" />;
      case "permiso":
        return <Clock className="h-5 w-5 text-purple-600" />;
      case "documento":
        return <FileText className="h-5 w-5 text-orange-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-600" />;
    }
  };

  const getTypeLabel = (tipo: ApprovalRequest["tipo"]) => {
    switch (tipo) {
      case "vacaciones":
        return "Vacaciones";
      case "permiso":
        return "Permiso";
      case "documento":
        return "Documento";
      default:
        return "Solicitud";
    }
  };

  const getTypeColor = (tipo: ApprovalRequest["tipo"]) => {
    switch (tipo) {
      case "vacaciones":
        return "bg-blue-100";
      case "permiso":
        return "bg-purple-100";
      case "documento":
        return "bg-orange-100";
      default:
        return "bg-gray-100";
    }
  };

  const getStatusBadge = (estado: ApprovalRequest["estado"]) => {
    switch (estado) {
      case "aprobado":
        return (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
            <CheckCircle className="h-3 w-3 mr-1" />
            Aprobado
          </Badge>
        );
      case "rechazado":
        return (
          <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
            <XCircle className="h-3 w-3 mr-1" />
            Rechazado
          </Badge>
        );
      default:
        return (
          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
            <Clock className="h-3 w-3 mr-1" />
            Pendiente
          </Badge>
        );
    }
  };

  const getInitials = (nombre: string) => {
    const parts = nombre.split(" ");
    return parts.length >= 2
      ? `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase()
      : nombre.substring(0, 2).toUpperCase();
  };

  const requests = activeTab === "pendientes" ? pendingRequests : historyRequests;
  const isLoading = activeTab === "pendientes" ? loadingPending : loadingHistory;

  const filteredRequests = requests?.filter((req) => {
    if (filter === "todos") return true;
    return req.estado === filter;
  });

  const pendingCount = pendingRequests?.length || 0;

  return (
    <PortalMobileLayout title="Aprobaciones">
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="bg-[#f6f6f8] min-h-screen px-4 py-4 space-y-4">
          {/* Summary Card */}
          {pendingCount > 0 && (
            <Card className="bg-gradient-to-br from-amber-500 to-orange-500 text-white border-0 shadow-lg">
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
                    <Clock className="h-7 w-7" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold">{pendingCount}</p>
                    <p className="text-sm text-white/80">
                      solicitud{pendingCount !== 1 ? "es" : ""} pendiente
                      {pendingCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tabs - Pill Style */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("pendientes")}
              className={cn(
                "flex-1 py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2",
                activeTab === "pendientes"
                  ? "bg-[#135bec] text-white shadow-md"
                  : "bg-white text-gray-600 hover:bg-gray-100"
              )}
            >
              Pendientes
              {pendingCount > 0 && (
                <Badge className={cn(
                  "h-5 min-w-5 px-1.5",
                  activeTab === "pendientes"
                    ? "bg-white/20 text-white hover:bg-white/20"
                    : "bg-amber-500 text-white hover:bg-amber-500"
                )}>
                  {pendingCount}
                </Badge>
              )}
            </button>
            <button
              onClick={() => setActiveTab("historial")}
              className={cn(
                "flex-1 py-3 rounded-xl text-sm font-semibold transition-all",
                activeTab === "historial"
                  ? "bg-[#135bec] text-white shadow-md"
                  : "bg-white text-gray-600 hover:bg-gray-100"
              )}
            >
              Historial
            </button>
          </div>

          {/* Filter (only for history) */}
          {activeTab === "historial" && (
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {(
                [
                  { key: "todos", label: "Todos" },
                  { key: "aprobado", label: "Aprobados" },
                  { key: "rechazado", label: "Rechazados" },
                ] as const
              ).map((option) => (
                <button
                  key={option.key}
                  onClick={() => setFilter(option.key)}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all shrink-0",
                    filter === option.key
                      ? "bg-gray-800 text-white"
                      : "bg-white text-gray-600 hover:bg-gray-100"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}

          {/* Requests List */}
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="bg-white border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-12 h-12 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-32 mb-2" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                      <Skeleton className="h-6 w-20" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredRequests && filteredRequests.length > 0 ? (
            <div className="space-y-2 pb-20">
              {filteredRequests.map((request) => (
                <Card
                  key={request.id}
                  className="bg-white border-0 shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-[0.99]"
                  onClick={() => setSelectedRequest(request)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="w-11 h-11 border-2 border-white shadow-sm">
                        <AvatarImage
                          src={request.empleadoFoto}
                          alt={request.empleadoNombre}
                        />
                        <AvatarFallback className="bg-gray-200 text-gray-600 text-sm">
                          {getInitials(request.empleadoNombre)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm text-gray-900 truncate">
                            {request.empleadoNombre}
                          </span>
                          <div
                            className={cn(
                              "w-6 h-6 rounded-lg flex items-center justify-center",
                              getTypeColor(request.tipo)
                            )}
                          >
                            {getTypeIcon(request.tipo)}
                          </div>
                        </div>
                        <p className="text-xs text-gray-500">
                          {getTypeLabel(request.tipo)}
                          {request.diasSolicitados &&
                            ` · ${request.diasSolicitados} día${
                              request.diasSolicitados !== 1 ? "s" : ""
                            }`}
                        </p>
                        {request.fechaInicio && (
                          <p className="text-xs text-[#135bec] mt-1">
                            <Calendar className="h-3 w-3 inline mr-1" />
                            {format(new Date(request.fechaInicio), "d MMM", {
                              locale: es,
                            })}
                            {request.fechaFin &&
                              request.fechaFin !== request.fechaInicio &&
                              ` - ${format(new Date(request.fechaFin), "d MMM", {
                                locale: es,
                              })}`}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {getStatusBadge(request.estado)}
                        <span className="text-[10px] text-gray-400">
                          {format(new Date(request.fechaSolicitud), "d MMM", {
                            locale: es,
                          })}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-white border-0 shadow-sm">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
                <p className="text-gray-600 font-medium mb-1">
                  {activeTab === "pendientes"
                    ? "No hay solicitudes pendientes"
                    : "No hay historial de aprobaciones"}
                </p>
                <p className="text-sm text-gray-500">
                  {activeTab === "pendientes"
                    ? "Estás al día con las aprobaciones"
                    : "Las solicitudes aprobadas o rechazadas aparecerán aquí"}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </PullToRefresh>

      {/* Request Detail Bottom Sheet */}
      <BottomSheet
        isOpen={!!selectedRequest}
        onClose={() => {
          setSelectedRequest(null);
          setComment("");
        }}
        title="Detalle de Solicitud"
        height="auto"
      >
        {selectedRequest && (
          <div className="p-4 space-y-4">
            {/* Employee Info */}
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
              <Avatar className="w-14 h-14 border-2 border-white shadow-sm">
                <AvatarImage
                  src={selectedRequest.empleadoFoto}
                  alt={selectedRequest.empleadoNombre}
                />
                <AvatarFallback className="bg-gray-200 text-gray-600">
                  {getInitials(selectedRequest.empleadoNombre)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-gray-900">
                  {selectedRequest.empleadoNombre}
                </p>
                <p className="text-sm text-gray-500">
                  {selectedRequest.empleadoPuesto}
                </p>
              </div>
            </div>

            {/* Request Details */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Tipo</span>
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "w-6 h-6 rounded-lg flex items-center justify-center",
                      getTypeColor(selectedRequest.tipo)
                    )}
                  >
                    {getTypeIcon(selectedRequest.tipo)}
                  </div>
                  <span className="font-medium text-sm">
                    {getTypeLabel(selectedRequest.tipo)}
                  </span>
                </div>
              </div>

              {selectedRequest.fechaInicio && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Fechas</span>
                  <span className="font-medium text-sm">
                    {format(new Date(selectedRequest.fechaInicio), "d MMM yyyy", {
                      locale: es,
                    })}
                    {selectedRequest.fechaFin &&
                      selectedRequest.fechaFin !== selectedRequest.fechaInicio &&
                      ` - ${format(new Date(selectedRequest.fechaFin), "d MMM yyyy", {
                        locale: es,
                      })}`}
                  </span>
                </div>
              )}

              {selectedRequest.diasSolicitados && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Días</span>
                  <span className="font-medium text-sm">
                    {selectedRequest.diasSolicitados} día
                    {selectedRequest.diasSolicitados !== 1 ? "s" : ""}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Solicitado</span>
                <span className="text-sm text-gray-600">
                  {format(
                    new Date(selectedRequest.fechaSolicitud),
                    "d MMM yyyy, HH:mm",
                    { locale: es }
                  )}
                </span>
              </div>

              {selectedRequest.motivo && (
                <div>
                  <span className="text-sm text-gray-500 block mb-1">Motivo</span>
                  <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                    {selectedRequest.motivo}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Estado</span>
                {getStatusBadge(selectedRequest.estado)}
              </div>
            </div>

            {/* Actions for pending requests */}
            {selectedRequest.estado === "pendiente" && (
              <div className="space-y-3 pt-4 border-t border-gray-100">
                <Textarea
                  placeholder="Comentario (opcional)"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="min-h-[80px]"
                />
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                    disabled={rejectMutation.isPending || approveMutation.isPending}
                    onClick={() =>
                      rejectMutation.mutate({
                        id: selectedRequest.id,
                        comentario: comment || undefined,
                      })
                    }
                  >
                    {rejectMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <XCircle className="h-4 w-4 mr-2" />
                    )}
                    Rechazar
                  </Button>
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    disabled={approveMutation.isPending || rejectMutation.isPending}
                    onClick={() =>
                      approveMutation.mutate({
                        id: selectedRequest.id,
                        comentario: comment || undefined,
                      })
                    }
                  >
                    {approveMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    Aprobar
                  </Button>
                </div>
              </div>
            )}

            {/* Show approver comment if exists */}
            {selectedRequest.comentarioAprobador && (
              <div className="pt-4 border-t border-gray-100">
                <span className="text-sm text-gray-500 block mb-1">
                  Comentario del aprobador
                </span>
                <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                  {selectedRequest.comentarioAprobador}
                </p>
              </div>
            )}
          </div>
        )}
      </BottomSheet>
    </PortalMobileLayout>
  );
}
