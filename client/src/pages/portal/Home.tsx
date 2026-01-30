import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  Timer,
  Receipt,
  Calendar,
  FolderOpen,
  ClipboardList,
  GraduationCap,
  Users,
  LogIn,
  LogOut,
  Loader2,
  UtensilsCrossed,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PortalMobileLayout } from "@/components/portal/layout/PortalMobileLayout";
import { PullToRefresh } from "@/components/portal/layout/PullToRefresh";
import { DocumentSolicitationBanner } from "@/components/portal/DocumentSolicitationBanner";
import { MissingDocumentsBanner } from "@/components/portal/MissingDocumentsBanner";
import { usePortalAuth } from "@/contexts/PortalAuthContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Anuncio {
  id: number;
  titulo: string;
  contenido: string;
  tipo: "info" | "alerta" | "cultural";
  imagen?: string;
  etiqueta?: string;
}

interface TodayStatus {
  checkedIn: boolean;
  horaEntrada: string | null;
  horaSalida: string | null;
  lunchOut: string | null;
  lunchIn: string | null;
  canCheckIn: boolean;
  canCheckOut: boolean;
  canLunchOut: boolean;
  canLunchIn: boolean;
}

export default function PortalHome() {
  const [, navigate] = useLocation();
  const { employee, clienteId } = usePortalAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentTime, setCurrentTime] = useState(format(new Date(), "hh:mm a"));
  const today = new Date();
  const formattedDate = format(today, "EEEE, d MMM", { locale: es });
  const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  // Update time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(format(new Date(), "hh:mm a"));
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Fetch dashboard data
  const { data: dashboardData, refetch, isLoading } = useQuery({
    queryKey: ["/api/portal/dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/portal/dashboard", {
        credentials: "include",
      });
      if (!res.ok) {
        // Fallback: diasVacacionesDisponibles on employee now contains saldoVacacionesActual from kardex
        return {
          vacacionesDisponibles: employee?.diasVacacionesDisponibles || 0,
          solicitudesPendientes: 0,
          pendientesAprobar: 0,
          ultimoRecibo: null,
          anunciosPendientes: 0,
          anuncios: [] as Anuncio[],
          esAprobador: false,
          ultimaEntrada: null,
          documentosNuevos: 0,
        };
      }
      return res.json();
    },
  });

  // Fetch today's attendance status
  const { data: todayStatus, refetch: refetchTodayStatus } = useQuery({
    queryKey: ["/api/portal/asistencia/hoy"],
    queryFn: async () => {
      const res = await fetch("/api/portal/asistencia/hoy", {
        credentials: "include",
      });
      if (!res.ok) {
        return {
          checkedIn: false,
          horaEntrada: null,
          horaSalida: null,
          canCheckIn: true,
          canCheckOut: false,
        } as TodayStatus;
      }
      return res.json() as Promise<TodayStatus>;
    },
  });

  // Fetch pending document solicitations
  const { data: solicitudesPendientes = [], refetch: refetchSolicitudes } = useQuery({
    queryKey: ["/api/portal/solicitudes-documentos"],
    queryFn: async () => {
      const res = await fetch("/api/portal/solicitudes-documentos", {
        credentials: "include",
      });
      if (!res.ok) return [];
      return res.json();
    },
  });

  // Fetch missing required documents
  const { data: docsFaltantes } = useQuery({
    queryKey: ["/api/portal/documentos-faltantes"],
    queryFn: async () => {
      const res = await fetch("/api/portal/documentos-faltantes", {
        credentials: "include",
      });
      if (!res.ok) return { documentosFaltantes: [], total: 5, completados: 0 };
      return res.json();
    },
  });

  // Check-in mutation
  const checkInMutation = useMutation({
    mutationFn: async () => {
      const now = new Date();
      const localTime = format(now, "HH:mm:ss");
      const localDate = format(now, "yyyy-MM-dd");

      const res = await fetch("/api/portal/asistencia/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ localTime, localDate }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Error al registrar entrada");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Entrada registrada",
        description: `Hora de entrada: ${format(new Date(), "HH:mm")}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/portal/asistencia"] });
      queryClient.invalidateQueries({ queryKey: ["/api/portal/dashboard"] });
      refetchTodayStatus();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Check-out mutation
  const checkOutMutation = useMutation({
    mutationFn: async () => {
      const now = new Date();
      const localTime = format(now, "HH:mm:ss");
      const localDate = format(now, "yyyy-MM-dd");

      const res = await fetch("/api/portal/asistencia/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ localTime, localDate }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Error al registrar salida");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Salida registrada",
        description: `Hora de salida: ${format(new Date(), "HH:mm")}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/portal/asistencia"] });
      queryClient.invalidateQueries({ queryKey: ["/api/portal/dashboard"] });
      refetchTodayStatus();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Lunch out mutation
  const lunchOutMutation = useMutation({
    mutationFn: async () => {
      const now = new Date();
      const localTime = format(now, "HH:mm:ss");
      const localDate = format(now, "yyyy-MM-dd");

      const res = await fetch("/api/portal/asistencia/lunch-out", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ localTime, localDate }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Error al registrar salida a comida");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Salida a comida registrada",
        description: `Hora: ${format(new Date(), "HH:mm")}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/portal/asistencia"] });
      refetchTodayStatus();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Lunch in mutation
  const lunchInMutation = useMutation({
    mutationFn: async () => {
      const now = new Date();
      const localTime = format(now, "HH:mm:ss");
      const localDate = format(now, "yyyy-MM-dd");

      const res = await fetch("/api/portal/asistencia/lunch-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ localTime, localDate }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Error al registrar regreso de comida");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Regreso de comida registrado",
        description: `Hora: ${format(new Date(), "HH:mm")}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/portal/asistencia"] });
      refetchTodayStatus();
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
    await Promise.all([refetch(), refetchTodayStatus(), refetchSolicitudes()]);
  };

  const getFirstName = () => {
    return employee?.nombre?.split(" ")[0] || "Usuario";
  };

  const anuncios: Anuncio[] = (dashboardData?.anuncios as Anuncio[]) || [];

  // Determine button state
  const canCheckIn = todayStatus?.canCheckIn ?? true;
  const canCheckOut = todayStatus?.canCheckOut ?? false;
  const canLunchOut = todayStatus?.canLunchOut ?? false;
  const canLunchIn = todayStatus?.canLunchIn ?? false;
  const isProcessing = checkInMutation.isPending || checkOutMutation.isPending || lunchOutMutation.isPending || lunchInMutation.isPending;

  const handleAttendanceAction = () => {
    if (canLunchIn) {
      lunchInMutation.mutate();
    } else if (canLunchOut) {
      lunchOutMutation.mutate();
    } else if (canCheckIn) {
      checkInMutation.mutate();
    } else if (canCheckOut) {
      checkOutMutation.mutate();
    }
  };

  // Determine which action to show
  const getButtonConfig = () => {
    if (canLunchIn) {
      return {
        label: "Regreso Comida",
        icon: UtensilsCrossed,
        className: "bg-amber-500 hover:bg-amber-600 shadow-amber-500/20 text-white",
      };
    }
    if (canLunchOut) {
      return {
        label: "Salida Comida",
        icon: UtensilsCrossed,
        className: "bg-amber-500 hover:bg-amber-600 shadow-amber-500/20 text-white",
      };
    }
    if (canCheckOut) {
      return {
        label: "Registrar Salida",
        icon: LogOut,
        className: "bg-orange-500 hover:bg-orange-600 shadow-orange-500/20 text-white",
      };
    }
    return {
      label: "Registrar Entrada",
      icon: LogIn,
      className: "bg-[#135bec] hover:bg-[#135bec]/90 shadow-[#135bec]/20 text-white",
    };
  };

  const buttonConfig = getButtonConfig();

  // Dashboard tiles config
  const dashboardTiles = [
    {
      id: "recibos",
      title: "Recibos",
      subtitle: "Ver último pago",
      icon: Receipt,
      iconBg: "bg-green-50",
      iconColor: "text-green-600",
      path: `/portal/${clienteId}/recibos`,
    },
    {
      id: "asistencias",
      title: "Asistencias",
      subtitle: todayStatus?.horaEntrada
        ? `Check-in: ${todayStatus.horaEntrada}`
        : "Sin registro hoy",
      subtitleColor: todayStatus?.horaEntrada ? "text-green-600 font-bold" : "text-gray-500",
      icon: Calendar,
      iconBg: "bg-blue-50",
      iconColor: "text-[#135bec]",
      path: `/portal/${clienteId}/asistencia`,
    },
    {
      id: "documentos",
      title: "Documentos",
      subtitle: (() => {
        const solicited = dashboardData?.documentosSolicitados || 0;
        const missing = docsFaltantes?.documentosFaltantes?.length || 0;
        const total = solicited + missing;
        if (total > 0) {
          const parts = [];
          if (solicited > 0) parts.push(`${solicited} solicitado${solicited > 1 ? 's' : ''}`);
          if (missing > 0) parts.push(`${missing} faltante${missing > 1 ? 's' : ''}`);
          return parts.join(', ');
        }
        if (dashboardData?.documentosNuevos) return `${dashboardData.documentosNuevos} nuevos`;
        return "Ver documentos";
      })(),
      subtitleColor: ((dashboardData?.documentosSolicitados || 0) + (docsFaltantes?.documentosFaltantes?.length || 0)) > 0
        ? "text-rose-600 font-semibold"
        : "text-gray-500",
      showDot: ((dashboardData?.documentosSolicitados || 0) + (docsFaltantes?.documentosFaltantes?.length || 0)) > 0 || (dashboardData?.documentosNuevos || 0) > 0,
      icon: FolderOpen,
      iconBg: ((dashboardData?.documentosSolicitados || 0) + (docsFaltantes?.documentosFaltantes?.length || 0)) > 0 ? "bg-rose-50" : "bg-orange-50",
      iconColor: ((dashboardData?.documentosSolicitados || 0) + (docsFaltantes?.documentosFaltantes?.length || 0)) > 0 ? "text-rose-600" : "text-orange-600",
      path: `/portal/${clienteId}/documentos`,
    },
    {
      id: "solicitudes",
      title: "Solicitudes",
      subtitle: dashboardData?.solicitudesPendientes
        ? "Vacaciones pendientes"
        : "Sin pendientes",
      subtitleColor: dashboardData?.solicitudesPendientes ? "text-orange-500" : "text-gray-500",
      icon: ClipboardList,
      iconBg: "bg-cyan-50",
      iconColor: "text-cyan-600",
      path: `/portal/${clienteId}/solicitudes`,
    },
    {
      id: "capacitacion",
      title: "Capacitación",
      subtitle: "Mis cursos",
      icon: GraduationCap,
      iconBg: "bg-purple-50",
      iconColor: "text-purple-600",
      path: `/portal/${clienteId}/cursos`,
    },
    {
      id: "directorio",
      title: "Directorio",
      subtitle: "Buscar colegas",
      icon: Users,
      iconBg: "bg-indigo-50",
      iconColor: "text-indigo-600",
      path: `/portal/${clienteId}/directorio`,
    },
  ];

  return (
    <PortalMobileLayout showHeader={false}>
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="bg-[#f6f6f8] min-h-screen pb-24">
          {/* Top App Bar */}
          <div className="sticky top-0 z-40 bg-[#f6f6f8]/95 backdrop-blur-sm border-b border-gray-200/50 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative shrink-0">
                <div
                  className="bg-center bg-no-repeat bg-cover rounded-full w-10 h-10 border-2 border-white shadow-sm bg-gradient-to-br from-[#135bec] to-blue-400 flex items-center justify-center text-white font-bold text-sm"
                >
                  {getFirstName().charAt(0)}
                </div>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Bienvenido</p>
                <h2 className="text-gray-900 text-lg font-bold leading-tight tracking-tight">
                  Hola, {getFirstName()}
                </h2>
              </div>
            </div>
            <button
              onClick={() => navigate(`/portal/${clienteId}/notificaciones`)}
              className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Bell className="h-6 w-6" />
              {(dashboardData?.anunciosPendientes || 0) > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white" />
              )}
            </button>
          </div>

          {/* Clock In / Quick Action */}
          <div className="px-4 mt-5">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-sm text-gray-500 font-medium">{capitalizedDate}</span>
                <span className="text-xl font-bold text-gray-900">{currentTime}</span>
              </div>
              <Button
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold shadow-lg transition-all active:scale-95",
                  buttonConfig.className
                )}
                disabled={isProcessing || (!canCheckIn && !canCheckOut && !canLunchOut && !canLunchIn)}
                onClick={handleAttendanceAction}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Registrando...</span>
                  </>
                ) : (
                  <>
                    <buttonConfig.icon className="h-5 w-5" />
                    <span>{buttonConfig.label}</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Document Solicitation Banner */}
          <DocumentSolicitationBanner
            solicitudes={solicitudesPendientes}
            onNavigate={() => navigate(`/portal/${clienteId}/documentos?tab=solicitados`)}
          />

          {/* Missing Documents Banner */}
          <MissingDocumentsBanner
            documentosFaltantes={docsFaltantes?.documentosFaltantes || []}
            onNavigate={() => navigate(`/portal/${clienteId}/documentos?tab=personales`)}
          />

          {/* Section: Anuncios Importantes */}
          {anuncios.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center justify-between px-4 pb-3">
                <h3 className="text-gray-900 text-lg font-bold tracking-tight">Anuncios Importantes</h3>
                <Link href={`/portal/${clienteId}/mas/anuncios`}>
                  <span className="text-sm font-medium text-[#135bec] hover:text-[#135bec]/80">Ver todo</span>
                </Link>
              </div>
              <div className="flex overflow-x-auto no-scrollbar gap-4 px-4 pb-4 snap-x snap-mandatory">
                {anuncios.slice(0, 5).map((anuncio) => (
                  <div
                    key={anuncio.id}
                    className="snap-center shrink-0 w-[280px] flex flex-col gap-3 rounded-xl bg-white p-3 shadow-sm border border-gray-100"
                  >
                    <div
                      className="w-full h-36 bg-center bg-cover rounded-lg relative overflow-hidden bg-gradient-to-br from-[#135bec] to-blue-400"
                      style={anuncio.imagen ? { backgroundImage: `url("${anuncio.imagen}")` } : {}}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      {anuncio.etiqueta && (
                        <span className="absolute bottom-2 left-2 bg-[#135bec]/90 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                          {anuncio.etiqueta}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-gray-900 text-base font-bold leading-tight">{anuncio.titulo}</p>
                      <p className="text-gray-500 text-sm mt-1 line-clamp-1">{anuncio.contenido}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section: Dashboard Tiles */}
          <div className="mt-4 px-4">
            <h3 className="text-gray-900 text-lg font-bold tracking-tight mb-3">Mi Resumen</h3>
            {isLoading ? (
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex flex-col gap-3 rounded-xl bg-white p-4 border border-gray-100 shadow-sm">
                    <Skeleton className="w-12 h-12 rounded-lg" />
                    <div className="flex flex-col gap-1">
                      <Skeleton className="h-5 w-20" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {dashboardTiles.map((tile) => (
                  <Link key={tile.id} href={tile.path}>
                    <div className="flex flex-col gap-3 rounded-xl bg-white p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group active:scale-[0.98]">
                      <div className={cn(
                        "w-12 h-12 rounded-lg flex items-center justify-center",
                        tile.iconBg || "bg-blue-50"
                      )}>
                        <tile.icon className={cn("h-6 w-6", tile.iconColor || "text-[#135bec]")} />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <h2 className="text-gray-900 text-base font-semibold">{tile.title}</h2>
                        <div className="flex items-center gap-1.5">
                          {tile.showDot && (
                            <span className="flex w-2 h-2 rounded-full bg-red-500" />
                          )}
                          <p className={cn(
                            "text-xs font-medium",
                            tile.subtitleColor || "text-gray-500"
                          )}>
                            {tile.subtitle}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Additional Content Spacing */}
          <div className="h-8" />
        </div>
      </PullToRefresh>
    </PortalMobileLayout>
  );
}
