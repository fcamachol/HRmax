import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Umbrella,
  Clock,
  Calendar as CalendarIcon,
  Loader2,
  CalendarDays,
  Info,
  ChevronRight,
  Send,
  Plane,
  Ban,
  Home,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PortalMobileLayout } from "@/components/portal/layout/PortalMobileLayout";
import { BottomSheet } from "@/components/portal/layout/BottomSheet";
import { PullToRefresh } from "@/components/portal/layout/PullToRefresh";
import { usePortalAuth } from "@/contexts/PortalAuthContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format, differenceInCalendarDays } from "date-fns";
import { es } from "date-fns/locale";

type RequestStatus = "pendiente" | "aprobada" | "rechazada" | "cancelada";
type MainTab = "mis_solicitudes" | "por_aprobar";
type FilterTab = "todos" | "vacaciones" | "permisos" | "horas_extra";

interface Request {
  id: string;
  tipo: "vacaciones" | "permiso" | "horas_extra" | "home_office";
  fechaInicio: string;
  fechaFin: string;
  dias: number;
  estatus: RequestStatus;
  motivo?: string;
  fechaSolicitud?: string;
  createdAt?: string;
}

const statusConfig: Record<RequestStatus, { label: string; bgColor: string; textColor: string }> = {
  pendiente: { label: "Pendiente", bgColor: "bg-yellow-100", textColor: "text-yellow-700" },
  aprobada: { label: "Aprobado", bgColor: "bg-green-100", textColor: "text-green-700" },
  rechazada: { label: "Rechazado", bgColor: "bg-red-100", textColor: "text-red-700" },
  cancelada: { label: "Cancelado", bgColor: "bg-gray-100", textColor: "text-gray-700" },
};

const tipoConfig: Record<string, { label: string; icon: typeof Plane; bgColor: string; iconColor: string }> = {
  vacaciones: { label: "Vacaciones", icon: Plane, bgColor: "bg-blue-50", iconColor: "text-[#135bec]" },
  permiso: { label: "Permiso Personal", icon: Ban, bgColor: "bg-red-50", iconColor: "text-red-600" },
  horas_extra: { label: "Horas Extra", icon: Clock, bgColor: "bg-green-50", iconColor: "text-green-600" },
  home_office: { label: "Home Office", icon: Home, bgColor: "bg-purple-50", iconColor: "text-purple-600" },
};

const tiposPermiso = [
  { value: "personal", label: "Personal" },
  { value: "defuncion", label: "Defunción" },
  { value: "matrimonio", label: "Matrimonio" },
  { value: "paternidad", label: "Paternidad" },
  { value: "medico", label: "Médico" },
  { value: "tramite", label: "Trámite" },
  { value: "otro", label: "Otro" },
];

function RequestCard({ request }: { request: Request }) {
  const status = statusConfig[request.estatus];
  const tipo = tipoConfig[request.tipo] || tipoConfig.permiso;
  const Icon = tipo.icon;

  return (
    <div className="group flex flex-col bg-white rounded-xl p-4 shadow-sm border border-gray-100 cursor-pointer active:scale-[0.99] transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <div className={cn(
            "flex items-center justify-center rounded-lg shrink-0 w-10 h-10",
            tipo.bgColor
          )}>
            <Icon className={cn("h-5 w-5", tipo.iconColor)} />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-0.5">
              <p className="text-base font-semibold text-gray-900 leading-tight">
                {tipo.label}
              </p>
              <span className={cn(
                "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide",
                status.bgColor,
                status.textColor
              )}>
                {status.label}
              </span>
            </div>
            <p className="text-gray-500 text-sm">
              {format(new Date(request.fechaInicio), "d MMM", { locale: es })}
              {request.fechaFin !== request.fechaInicio && (
                <> - {format(new Date(request.fechaFin), "d MMM", { locale: es })}</>
              )}
              {request.dias && <> • {request.dias} día{request.dias !== 1 ? "s" : ""}</>}
            </p>
          </div>
        </div>
        <ChevronRight className="h-5 w-5 text-gray-400 mt-1" />
      </div>
    </div>
  );
}

// Group requests by month
function groupRequestsByMonth(requests: Request[]) {
  const groups: Record<string, Request[]> = {};

  requests.forEach(request => {
    try {
      // fechaSolicitud could be a timestamp string, try to parse it
      const dateValue = request.fechaSolicitud || request.createdAt || new Date().toISOString();
      const date = new Date(dateValue);

      // Check if date is valid
      if (isNaN(date.getTime())) {
        // Fallback to current month if date is invalid
        const monthKey = format(new Date(), "MMMM yyyy", { locale: es });
        if (!groups[monthKey]) {
          groups[monthKey] = [];
        }
        groups[monthKey].push(request);
        return;
      }

      const monthKey = format(date, "MMMM yyyy", { locale: es });
      if (!groups[monthKey]) {
        groups[monthKey] = [];
      }
      groups[monthKey].push(request);
    } catch (e) {
      // If grouping fails, use a default group
      const defaultKey = "Recientes";
      if (!groups[defaultKey]) {
        groups[defaultKey] = [];
      }
      groups[defaultKey].push(request);
    }
  });

  return groups;
}

export default function PortalSolicitudes() {
  const [mainTab, setMainTab] = useState<MainTab>("mis_solicitudes");
  const [filterTab, setFilterTab] = useState<FilterTab>("todos");
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [requestType, setRequestType] = useState<"vacaciones" | "permiso" | null>(null);

  // Vacation form state
  const [vacFechaInicio, setVacFechaInicio] = useState<Date | undefined>();
  const [vacFechaFin, setVacFechaFin] = useState<Date | undefined>();
  const [vacMotivo, setVacMotivo] = useState("");

  // Permission form state
  const [permTipoPermiso, setPermTipoPermiso] = useState("");
  const [permConGoce, setPermConGoce] = useState(false);
  const [permFechaInicio, setPermFechaInicio] = useState<Date | undefined>();
  const [permFechaFin, setPermFechaFin] = useState<Date | undefined>();
  const [permMotivo, setPermMotivo] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { employee } = usePortalAuth();

  // Check if user is a manager/approver
  const isManager = employee?.esAprobador || false;

  // Fetch vacation balance
  const { data: saldoVacaciones } = useQuery({
    queryKey: ["/api/portal/vacaciones/saldo"],
    queryFn: async () => {
      const res = await fetch("/api/portal/vacaciones/saldo", {
        credentials: "include",
      });
      if (!res.ok) return { disponibles: 0, usados: 0, anuales: 0 };
      return res.json();
    },
  });

  // Calculate days for vacation
  const diasVacaciones = vacFechaInicio && vacFechaFin
    ? Math.max(1, differenceInCalendarDays(vacFechaFin, vacFechaInicio) + 1)
    : 0;

  // Calculate days for permission
  const diasPermiso = permFechaInicio && permFechaFin
    ? Math.max(1, differenceInCalendarDays(permFechaFin, permFechaInicio) + 1)
    : 0;

  // Vacation mutation
  const vacacionesMutation = useMutation({
    mutationFn: async (data: { fechaInicio: string; fechaFin: string; diasSolicitados: number; motivo?: string }) => {
      const res = await fetch("/api/portal/vacaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Error al solicitar vacaciones");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Solicitud enviada",
        description: "Tu solicitud de vacaciones fue registrada correctamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/portal/solicitudes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/portal/vacaciones/saldo"] });
      resetVacationForm();
      setRequestType(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Permission mutation
  const permisoMutation = useMutation({
    mutationFn: async (data: {
      tipoPermiso: string;
      conGoce: boolean;
      fechaInicio: string;
      fechaFin: string;
      diasSolicitados: number;
      motivo: string
    }) => {
      const res = await fetch("/api/portal/permisos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Error al solicitar permiso");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Solicitud enviada",
        description: "Tu solicitud de permiso fue registrada correctamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/portal/solicitudes"] });
      resetPermissionForm();
      setRequestType(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetVacationForm = () => {
    setVacFechaInicio(undefined);
    setVacFechaFin(undefined);
    setVacMotivo("");
  };

  const resetPermissionForm = () => {
    setPermTipoPermiso("");
    setPermConGoce(false);
    setPermFechaInicio(undefined);
    setPermFechaFin(undefined);
    setPermMotivo("");
  };

  const handleNewRequest = (type: "vacaciones" | "permiso") => {
    setRequestType(type);
    setShowNewRequest(true);
  };

  const handleCloseSheet = () => {
    setRequestType(null);
    resetVacationForm();
    resetPermissionForm();
  };

  const handleSubmitVacaciones = () => {
    if (!vacFechaInicio || !vacFechaFin) {
      toast({
        title: "Error",
        description: "Selecciona las fechas de inicio y fin",
        variant: "destructive",
      });
      return;
    }

    if (diasVacaciones > (saldoVacaciones?.disponibles || 0)) {
      toast({
        title: "Error",
        description: `Solo tienes ${saldoVacaciones?.disponibles || 0} días disponibles`,
        variant: "destructive",
      });
      return;
    }

    vacacionesMutation.mutate({
      fechaInicio: format(vacFechaInicio, "yyyy-MM-dd"),
      fechaFin: format(vacFechaFin, "yyyy-MM-dd"),
      diasSolicitados: diasVacaciones,
      motivo: vacMotivo || undefined,
    });
  };

  const handleSubmitPermiso = () => {
    if (!permTipoPermiso) {
      toast({
        title: "Error",
        description: "Selecciona el tipo de permiso",
        variant: "destructive",
      });
      return;
    }

    if (!permFechaInicio || !permFechaFin) {
      toast({
        title: "Error",
        description: "Selecciona las fechas de inicio y fin",
        variant: "destructive",
      });
      return;
    }

    if (!permMotivo.trim()) {
      toast({
        title: "Error",
        description: "El motivo es requerido",
        variant: "destructive",
      });
      return;
    }

    permisoMutation.mutate({
      tipoPermiso: permTipoPermiso,
      conGoce: permConGoce,
      fechaInicio: format(permFechaInicio, "yyyy-MM-dd"),
      fechaFin: format(permFechaFin, "yyyy-MM-dd"),
      diasSolicitados: diasPermiso,
      motivo: permMotivo,
    });
  };

  // Fetch requests
  const { data: requests, isLoading, refetch } = useQuery({
    queryKey: ["/api/portal/solicitudes"],
    queryFn: async () => {
      const res = await fetch("/api/portal/solicitudes", {
        credentials: "include",
      });
      if (!res.ok) {
        console.error("Error fetching solicitudes:", res.status);
        return [];
      }
      const data = await res.json();
      console.log("Solicitudes data:", data);
      return data as Request[];
    },
  });

  // Filter requests client-side based on filterTab
  const filteredRequests = requests?.filter(r => {
    if (filterTab === "todos") return true;
    if (filterTab === "vacaciones") return r.tipo === "vacaciones";
    if (filterTab === "permisos") return r.tipo === "permiso";
    if (filterTab === "horas_extra") return r.tipo === "horas_extra";
    return true;
  });

  // Fetch pending approvals count (only for managers)
  const { data: pendingApprovals } = useQuery({
    queryKey: ["/api/portal/aprobaciones/pendientes"],
    queryFn: async () => {
      const res = await fetch("/api/portal/aprobaciones/pendientes", {
        credentials: "include",
      });
      if (!res.ok) return { count: 0 };
      return res.json();
    },
    enabled: isManager, // Only fetch if user is a manager
  });

  const handleRefresh = async () => {
    await refetch();
  };

  const groupedRequests = filteredRequests ? groupRequestsByMonth(filteredRequests) : {};

  return (
    <PortalMobileLayout title="Solicitudes">
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="bg-[#f6f6f8] min-h-screen">
          {/* Segmented Tabs - Only show for managers */}
          {isManager && (
            <div className="px-4 py-4 sticky top-14 z-40 bg-[#f6f6f8]">
              <div className="flex h-12 w-full items-center justify-center rounded-lg bg-gray-200 p-1">
                <button
                  onClick={() => setMainTab("mis_solicitudes")}
                  className={cn(
                    "flex h-full flex-1 items-center justify-center rounded-md transition-all duration-200 text-sm font-medium",
                    mainTab === "mis_solicitudes"
                      ? "bg-white shadow-sm text-[#135bec] font-semibold"
                      : "text-gray-500 hover:text-gray-700"
                  )}
                >
                  Mis Solicitudes
                </button>
                <button
                  onClick={() => setMainTab("por_aprobar")}
                  className={cn(
                    "flex h-full flex-1 items-center justify-center rounded-md transition-all duration-200 text-sm font-medium gap-2",
                    mainTab === "por_aprobar"
                      ? "bg-white shadow-sm text-[#135bec] font-semibold"
                      : "text-gray-500 hover:text-gray-700"
                  )}
                >
                  Por Aprobar
                  {(pendingApprovals?.count || 0) > 0 && (
                    <span className="bg-red-100 text-red-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {pendingApprovals?.count}
                    </span>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Filter Chips */}
          <div className={cn(
            "w-full overflow-x-auto scrollbar-hide px-4 pb-4",
            !isManager && "pt-4" // Add top padding when segmented tabs are hidden
          )}>
            <div className="flex gap-2 min-w-max">
              {(
                [
                  { key: "todos", label: "Todos" },
                  { key: "vacaciones", label: "Vacaciones" },
                  { key: "horas_extra", label: "Horas Extra" },
                  { key: "permisos", label: "Permisos" },
                ] as const
              ).map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => setFilterTab(filter.key)}
                  className={cn(
                    "flex h-8 items-center justify-center px-4 rounded-full text-sm font-medium transition-all active:scale-95",
                    filterTab === filter.key
                      ? "bg-[#135bec] text-white shadow-sm"
                      : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                  )}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* Request List */}
          <div className="px-4 pb-24">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <div className="flex items-start gap-3">
                      <Skeleton className="w-10 h-10 rounded-lg" />
                      <div className="flex-1">
                        <Skeleton className="h-5 w-32 mb-2" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : !filteredRequests?.length ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="bg-gray-100 rounded-full p-6 mb-4">
                  <Send className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">No hay solicitudes</h3>
                <p className="text-sm text-gray-500 mt-2">Tus solicitudes aparecerán aquí.</p>
              </div>
            ) : (
              Object.entries(groupedRequests).map(([month, monthRequests]) => (
                <div key={month}>
                  {/* Month Header */}
                  <div className="pt-6 pb-2">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      {month.charAt(0).toUpperCase() + month.slice(1)}
                    </h3>
                  </div>
                  {/* Month Requests */}
                  <div className="flex flex-col gap-3">
                    {monthRequests.map((request) => (
                      <RequestCard key={request.id} request={request} />
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </PullToRefresh>

      {/* Floating Action Button */}
      <div className="fixed bottom-24 right-4 z-40">
        <Button
          size="lg"
          className="rounded-full h-14 w-14 shadow-[0_4px_12px_rgba(19,91,236,0.4)] bg-[#135bec] hover:bg-[#0f4ed8] hover:shadow-[0_6px_16px_rgba(19,91,236,0.5)] active:scale-90 transition-all"
          onClick={() => setShowNewRequest(true)}
        >
          <Plus className="h-7 w-7" />
          <span className="sr-only">Nueva solicitud</span>
        </Button>
      </div>

      {/* New Request Type Selection */}
      <BottomSheet
        isOpen={showNewRequest && !requestType}
        onClose={() => setShowNewRequest(false)}
        title="Nueva solicitud"
        height="auto"
      >
        <div className="p-4 space-y-3">
          <p className="text-sm text-gray-500 mb-4">
            Selecciona el tipo de solicitud:
          </p>
          <Card
            className="bg-white border-0 shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-[0.98]"
            onClick={() => handleNewRequest("vacaciones")}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Plane className="h-5 w-5 text-[#135bec]" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm text-gray-900">Vacaciones</p>
                  <p className="text-xs text-gray-500">
                    Solicitar días de descanso
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </div>
            </CardContent>
          </Card>
          <Card
            className="bg-white border-0 shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-[0.98]"
            onClick={() => handleNewRequest("permiso")}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-purple-50 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm text-gray-900">Permiso</p>
                  <p className="text-xs text-gray-500">
                    Solicitar permiso especial
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      </BottomSheet>

      {/* Vacation Request Form */}
      <BottomSheet
        isOpen={requestType === "vacaciones"}
        onClose={handleCloseSheet}
        title="Solicitar vacaciones"
        height="full"
      >
        <div className="p-4 space-y-5 pb-8">
          {/* Vacation Balance Card */}
          <Card className="bg-gradient-to-br from-[#135bec] to-blue-600 text-white border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <CalendarDays className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-white/80">Días disponibles</p>
                  <p className="text-3xl font-bold">{saldoVacaciones?.disponibles || 0}</p>
                </div>
                <div className="ml-auto text-right text-sm">
                  <p className="text-white/70">Usados: {saldoVacaciones?.usados || 0}</p>
                  <p className="text-white/70">Anuales: {saldoVacaciones?.anuales || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Date Selection */}
          <div className="space-y-4">
            {/* Start Date */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Fecha de inicio</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal h-11",
                      !vacFechaInicio && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {vacFechaInicio ? (
                      format(vacFechaInicio, "PPP", { locale: es })
                    ) : (
                      <span>Selecciona fecha de inicio</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={vacFechaInicio}
                    onSelect={(date) => {
                      setVacFechaInicio(date);
                      if (date && (!vacFechaFin || vacFechaFin < date)) {
                        setVacFechaFin(date);
                      }
                    }}
                    disabled={(date) => date < new Date()}
                    initialFocus
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* End Date */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Fecha de fin</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal h-11",
                      !vacFechaFin && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {vacFechaFin ? (
                      format(vacFechaFin, "PPP", { locale: es })
                    ) : (
                      <span>Selecciona fecha de fin</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={vacFechaFin}
                    onSelect={setVacFechaFin}
                    disabled={(date) => date < (vacFechaInicio || new Date())}
                    initialFocus
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Days Summary */}
            {diasVacaciones > 0 && (
              <Card className={cn(
                "border-2",
                diasVacaciones > (saldoVacaciones?.disponibles || 0)
                  ? "border-red-200 bg-red-50"
                  : "border-green-200 bg-green-50"
              )}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Días solicitados</p>
                    <p className="text-2xl font-bold">{diasVacaciones}</p>
                  </div>
                  {diasVacaciones > (saldoVacaciones?.disponibles || 0) && (
                    <div className="flex items-center gap-2 text-red-600 text-sm">
                      <Info className="h-4 w-4" />
                      <span>Excede el saldo disponible</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Reason */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Motivo (opcional)</Label>
              <Textarea
                placeholder="Agrega un comentario o motivo..."
                value={vacMotivo}
                onChange={(e) => setVacMotivo(e.target.value)}
                className="min-h-[80px]"
              />
            </div>
          </div>

          {/* Submit Button */}
          <Button
            className="w-full h-12 bg-[#135bec] hover:bg-[#0f4ed8]"
            disabled={
              !vacFechaInicio ||
              !vacFechaFin ||
              diasVacaciones > (saldoVacaciones?.disponibles || 0) ||
              vacacionesMutation.isPending
            }
            onClick={handleSubmitVacaciones}
          >
            {vacacionesMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              "Solicitar vacaciones"
            )}
          </Button>
        </div>
      </BottomSheet>

      {/* Permission Request Form */}
      <BottomSheet
        isOpen={requestType === "permiso"}
        onClose={handleCloseSheet}
        title="Solicitar permiso"
        height="full"
      >
        <div className="p-4 space-y-5 pb-8">
          {/* Permission Type */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Tipo de permiso</Label>
            <Select value={permTipoPermiso} onValueChange={setPermTipoPermiso}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Selecciona el tipo de permiso" />
              </SelectTrigger>
              <SelectContent>
                {tiposPermiso.map((tipo) => (
                  <SelectItem key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* With/Without Pay */}
          <Card className="bg-white border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm text-gray-900">Con goce de sueldo</p>
                  <p className="text-xs text-gray-500">
                    {permConGoce ? "Se pagará durante el permiso" : "Sin pago durante el permiso"}
                  </p>
                </div>
                <Switch
                  checked={permConGoce}
                  onCheckedChange={setPermConGoce}
                />
              </div>
            </CardContent>
          </Card>

          {/* Date Selection */}
          <div className="space-y-4">
            {/* Start Date */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Fecha de inicio</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal h-11",
                      !permFechaInicio && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {permFechaInicio ? (
                      format(permFechaInicio, "PPP", { locale: es })
                    ) : (
                      <span>Selecciona fecha de inicio</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={permFechaInicio}
                    onSelect={(date) => {
                      setPermFechaInicio(date);
                      if (date && (!permFechaFin || permFechaFin < date)) {
                        setPermFechaFin(date);
                      }
                    }}
                    initialFocus
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* End Date */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Fecha de fin</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal h-11",
                      !permFechaFin && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {permFechaFin ? (
                      format(permFechaFin, "PPP", { locale: es })
                    ) : (
                      <span>Selecciona fecha de fin</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={permFechaFin}
                    onSelect={setPermFechaFin}
                    disabled={(date) => permFechaInicio ? date < permFechaInicio : false}
                    initialFocus
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Days Summary */}
            {diasPermiso > 0 && (
              <Card className="border-2 border-purple-200 bg-purple-50">
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600">Días solicitados</p>
                  <p className="text-2xl font-bold text-purple-700">{diasPermiso}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Motivo <span className="text-red-500">*</span></Label>
            <Textarea
              placeholder="Describe el motivo del permiso..."
              value={permMotivo}
              onChange={(e) => setPermMotivo(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          {/* Submit Button */}
          <Button
            className="w-full h-12 bg-purple-600 hover:bg-purple-700"
            disabled={
              !permTipoPermiso ||
              !permFechaInicio ||
              !permFechaFin ||
              !permMotivo.trim() ||
              permisoMutation.isPending
            }
            onClick={handleSubmitPermiso}
          >
            {permisoMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              "Solicitar permiso"
            )}
          </Button>
        </div>
      </BottomSheet>
    </PortalMobileLayout>
  );
}
