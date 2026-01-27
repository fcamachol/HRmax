import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Clock,
  LogIn,
  LogOut,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Timer,
  ChevronRight,
  ChevronLeft,
  UtensilsCrossed,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PortalMobileLayout } from "@/components/portal/layout/PortalMobileLayout";
import { PullToRefresh } from "@/components/portal/layout/PullToRefresh";
import { usePortalAuth } from "@/contexts/PortalAuthContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format, startOfWeek, addDays, isSameDay, isToday } from "date-fns";
import { es } from "date-fns/locale";

interface AttendanceRecord {
  id: number;
  fecha: string;
  horaEntrada: string | null;
  horaSalida: string | null;
  tipoIncidencia: string | null;
  horasExtras: number;
  observaciones: string | null;
}

interface AttendanceSummary {
  diasTrabajados: number;
  diasFaltas: number;
  diasRetardos: number;
  horasExtrasTotal: number;
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

const DAYS_OF_WEEK = ["L", "M", "X", "J", "V", "S", "D"];

type TabType = "asistencia" | "horasExtra";

interface OvertimeRecord {
  id: number;
  fecha: string;
  horas: number;
  tipo: "dobles" | "triples";
  motivo: string;
}

export default function PortalAsistencia() {
  const { clienteId } = usePortalAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>("asistencia");
  const [selectedWeekStart, setSelectedWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );

  // Fetch overtime records
  const { data: overtimeRecords, isLoading: loadingOvertime } = useQuery({
    queryKey: ["/api/portal/asistencia/horas-extra"],
    queryFn: async () => {
      const res = await fetch("/api/portal/asistencia/horas-extra", {
        credentials: "include",
      });
      if (!res.ok) return [] as OvertimeRecord[];
      return res.json() as Promise<OvertimeRecord[]>;
    },
    enabled: activeTab === "horasExtra",
  });

  // Calculate overtime totals
  const overtimeTotals = {
    dobles: overtimeRecords?.filter(r => r.tipo === "dobles").reduce((acc, r) => acc + r.horas, 0) || 0,
    triples: overtimeRecords?.filter(r => r.tipo === "triples").reduce((acc, r) => acc + r.horas, 0) || 0,
  };

  // Fetch today's status
  const { data: todayStatus, isLoading: loadingToday, refetch: refetchToday } = useQuery({
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

  // Fetch weekly attendance
  const { data: weeklyAttendance, isLoading: loadingWeekly, refetch: refetchWeekly } = useQuery({
    queryKey: ["/api/portal/asistencia", format(selectedWeekStart, "yyyy-MM-dd")],
    queryFn: async () => {
      const res = await fetch(
        `/api/portal/asistencia?weekStart=${format(selectedWeekStart, "yyyy-MM-dd")}`,
        { credentials: "include" }
      );
      if (!res.ok) return [];
      return res.json() as Promise<AttendanceRecord[]>;
    },
  });

  // Fetch monthly summary
  const { data: summary, isLoading: loadingSummary, refetch: refetchSummary } = useQuery({
    queryKey: ["/api/portal/asistencia/resumen"],
    queryFn: async () => {
      const res = await fetch("/api/portal/asistencia/resumen", {
        credentials: "include",
      });
      if (!res.ok) {
        return {
          diasTrabajados: 0,
          diasFaltas: 0,
          diasRetardos: 0,
          horasExtrasTotal: 0,
        } as AttendanceSummary;
      }
      return res.json() as Promise<AttendanceSummary>;
    },
  });

  // Check-in mutation
  const checkInMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/portal/asistencia/checkin", {
        method: "POST",
        credentials: "include",
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
      refetchToday();
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
      const res = await fetch("/api/portal/asistencia/checkout", {
        method: "POST",
        credentials: "include",
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
      refetchToday();
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
      const res = await fetch("/api/portal/asistencia/lunch-out", {
        method: "POST",
        credentials: "include",
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
      refetchToday();
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
      const res = await fetch("/api/portal/asistencia/lunch-in", {
        method: "POST",
        credentials: "include",
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
      refetchToday();
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
    await Promise.all([refetchToday(), refetchWeekly(), refetchSummary()]);
  };

  const goToPreviousWeek = () => {
    setSelectedWeekStart((prev) => addDays(prev, -7));
  };

  const goToNextWeek = () => {
    setSelectedWeekStart((prev) => addDays(prev, 7));
  };

  const getWeekDays = () => {
    return Array.from({ length: 7 }, (_, i) => addDays(selectedWeekStart, i));
  };

  const getAttendanceForDate = (date: Date) => {
    return weeklyAttendance?.find((record) =>
      isSameDay(new Date(record.fecha), date)
    );
  };

  const getStatusColor = (record: AttendanceRecord | undefined, date: Date) => {
    if (!record) {
      if (date > new Date()) return "bg-gray-100 text-gray-400"; // Future
      return "bg-red-100 text-red-600"; // Absent
    }
    if (record.tipoIncidencia === "falta") return "bg-red-100 text-red-600";
    if (record.tipoIncidencia === "retardo") return "bg-amber-100 text-amber-600";
    if (record.tipoIncidencia === "vacaciones") return "bg-cyan-100 text-cyan-600";
    if (record.tipoIncidencia === "incapacidad") return "bg-orange-100 text-orange-600";
    if (record.tipoIncidencia === "permiso") return "bg-purple-100 text-purple-600";
    if (record.horaEntrada && record.horaSalida) return "bg-green-100 text-green-600";
    if (record.horaEntrada) return "bg-blue-100 text-blue-600";
    return "bg-gray-100 text-gray-400";
  };

  const currentTime = format(new Date(), "HH:mm");

  return (
    <PortalMobileLayout title="Asistencia">
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="bg-[#f6f6f8] min-h-screen px-4 py-4 space-y-4">
          {/* Tab Navigation */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("asistencia")}
              className={cn(
                "flex-1 py-3 rounded-xl text-sm font-semibold transition-all",
                activeTab === "asistencia"
                  ? "bg-[#135bec] text-white shadow-md"
                  : "bg-white text-gray-600 hover:bg-gray-100"
              )}
            >
              Asistencia
            </button>
            <button
              onClick={() => setActiveTab("horasExtra")}
              className={cn(
                "flex-1 py-3 rounded-xl text-sm font-semibold transition-all",
                activeTab === "horasExtra"
                  ? "bg-[#135bec] text-white shadow-md"
                  : "bg-white text-gray-600 hover:bg-gray-100"
              )}
            >
              Horas Extra
            </button>
          </div>

          {activeTab === "asistencia" ? (
            <>
          {/* Today's Status Card */}
          <Card className="bg-gradient-to-br from-[#135bec] to-blue-600 text-white overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-white/80">Hoy</p>
                  <p className="text-lg font-semibold">
                    {format(new Date(), "EEEE, d MMM", { locale: es })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold font-mono">{currentTime}</p>
                </div>
              </div>

              {loadingToday ? (
                <div className="flex gap-3">
                  <Skeleton className="h-12 flex-1 bg-white/20" />
                  <Skeleton className="h-12 flex-1 bg-white/20" />
                </div>
              ) : (
                <>
                  {/* Status indicators */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-4 text-sm">
                    <div className="flex items-center gap-2">
                      <LogIn className="h-4 w-4" />
                      <span>
                        Entrada: {todayStatus?.horaEntrada?.slice(0, 5) || "--:--"}
                      </span>
                    </div>
                    {(todayStatus?.lunchOut || todayStatus?.lunchIn) && (
                      <div className="flex items-center gap-2">
                        <UtensilsCrossed className="h-4 w-4" />
                        <span>
                          Comida: {todayStatus?.lunchOut?.slice(0, 5) || "--:--"} - {todayStatus?.lunchIn?.slice(0, 5) || "--:--"}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <LogOut className="h-4 w-4" />
                      <span>
                        Salida: {todayStatus?.horaSalida?.slice(0, 5) || "--:--"}
                      </span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-3">
                    <Button
                      className="flex-1 bg-white/20 hover:bg-white/30 text-white border-0"
                      disabled={!todayStatus?.canCheckIn || checkInMutation.isPending}
                      onClick={() => checkInMutation.mutate()}
                    >
                      <LogIn className="h-4 w-4 mr-2" />
                      {checkInMutation.isPending ? "Registrando..." : "Entrada"}
                    </Button>
                    {todayStatus?.canLunchOut && (
                      <Button
                        className="flex-1 bg-amber-500/80 hover:bg-amber-500 text-white border-0"
                        disabled={lunchOutMutation.isPending}
                        onClick={() => lunchOutMutation.mutate()}
                      >
                        <UtensilsCrossed className="h-4 w-4 mr-2" />
                        {lunchOutMutation.isPending ? "Registrando..." : "Comida"}
                      </Button>
                    )}
                    {todayStatus?.canLunchIn && (
                      <Button
                        className="flex-1 bg-amber-500/80 hover:bg-amber-500 text-white border-0"
                        disabled={lunchInMutation.isPending}
                        onClick={() => lunchInMutation.mutate()}
                      >
                        <UtensilsCrossed className="h-4 w-4 mr-2" />
                        {lunchInMutation.isPending ? "Registrando..." : "Regreso"}
                      </Button>
                    )}
                    <Button
                      className="flex-1 bg-white/20 hover:bg-white/30 text-white border-0"
                      disabled={!todayStatus?.canCheckOut || checkOutMutation.isPending}
                      onClick={() => checkOutMutation.mutate()}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      {checkOutMutation.isPending ? "Registrando..." : "Salida"}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Weekly Calendar */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-gray-900">
                  Semana
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={goToPreviousWeek}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-gray-600 min-w-[120px] text-center">
                    {format(selectedWeekStart, "d MMM", { locale: es })} -{" "}
                    {format(addDays(selectedWeekStart, 6), "d MMM", { locale: es })}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={goToNextWeek}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {loadingWeekly ? (
                <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 rounded-lg" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-7 gap-2">
                  {getWeekDays().map((date, index) => {
                    const record = getAttendanceForDate(date);
                    const statusColor = getStatusColor(record, date);
                    const today = isToday(date);

                    return (
                      <div
                        key={index}
                        className={cn(
                          "flex flex-col items-center justify-center p-2 rounded-xl transition-all",
                          statusColor,
                          today && "ring-2 ring-[#135bec] ring-offset-2"
                        )}
                      >
                        <span className="text-[10px] font-medium opacity-70">
                          {DAYS_OF_WEEK[index]}
                        </span>
                        <span className="text-lg font-semibold">
                          {format(date, "d")}
                        </span>
                        {record?.horaEntrada && (
                          <span className="text-[9px] font-mono">
                            {record.horaEntrada.slice(0, 5)}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Legend */}
              <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span>Completo</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <span>Retardo</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span>Falta</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                  <div className="w-3 h-3 rounded-full bg-cyan-500" />
                  <span>Vacaciones</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                  <div className="w-3 h-3 rounded-full bg-orange-500" />
                  <span>Incapacidad</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Monthly Summary */}
          <div>
            <h2 className="text-sm font-semibold text-gray-500 mb-3 px-1">
              Resumen del mes
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <Card className="shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      {loadingSummary ? (
                        <Skeleton className="h-6 w-8" />
                      ) : (
                        <p className="text-xl font-bold text-gray-900">
                          {summary?.diasTrabajados || 0}
                        </p>
                      )}
                      <p className="text-xs text-gray-500">Días trabajados</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                      <XCircle className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      {loadingSummary ? (
                        <Skeleton className="h-6 w-8" />
                      ) : (
                        <p className="text-xl font-bold text-gray-900">
                          {summary?.diasFaltas || 0}
                        </p>
                      )}
                      <p className="text-xs text-gray-500">Faltas</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                      <AlertTriangle className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      {loadingSummary ? (
                        <Skeleton className="h-6 w-8" />
                      ) : (
                        <p className="text-xl font-bold text-gray-900">
                          {summary?.diasRetardos || 0}
                        </p>
                      )}
                      <p className="text-xs text-gray-500">Retardos</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                      <Timer className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      {loadingSummary ? (
                        <Skeleton className="h-6 w-8" />
                      ) : (
                        <p className="text-xl font-bold text-gray-900">
                          {summary?.horasExtrasTotal || 0}h
                        </p>
                      )}
                      <p className="text-xs text-gray-500">Horas extra</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
            </>
          ) : (
            <>
              {/* Overtime Tab Content */}
              {/* Overtime Summary Cards */}
              <div className="grid grid-cols-2 gap-3">
                <Card className="bg-white border-0 shadow-sm">
                  <CardContent className="p-4 text-center">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-2">
                      <Timer className="h-6 w-6 text-blue-600" />
                    </div>
                    {loadingOvertime ? (
                      <Skeleton className="h-8 w-12 mx-auto mb-1" />
                    ) : (
                      <p className="text-2xl font-bold text-gray-900">
                        {overtimeTotals.dobles}h
                      </p>
                    )}
                    <p className="text-xs text-gray-500">Horas Dobles</p>
                    <Badge className="mt-2 bg-blue-100 text-blue-700 hover:bg-blue-100 text-[10px]">
                      x2
                    </Badge>
                  </CardContent>
                </Card>

                <Card className="bg-white border-0 shadow-sm">
                  <CardContent className="p-4 text-center">
                    <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-2">
                      <Timer className="h-6 w-6 text-purple-600" />
                    </div>
                    {loadingOvertime ? (
                      <Skeleton className="h-8 w-12 mx-auto mb-1" />
                    ) : (
                      <p className="text-2xl font-bold text-gray-900">
                        {overtimeTotals.triples}h
                      </p>
                    )}
                    <p className="text-xs text-gray-500">Horas Triples</p>
                    <Badge className="mt-2 bg-purple-100 text-purple-700 hover:bg-purple-100 text-[10px]">
                      x3
                    </Badge>
                  </CardContent>
                </Card>
              </div>

              {/* Total Overtime Card */}
              <Card className="bg-gradient-to-br from-[#135bec] to-blue-600 text-white border-0 shadow-lg">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white/80">Total este mes</p>
                      <p className="text-3xl font-bold mt-1">
                        {overtimeTotals.dobles + overtimeTotals.triples}h
                      </p>
                    </div>
                    <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
                      <Clock className="h-7 w-7 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Overtime Records List */}
              <div>
                <h2 className="text-sm font-semibold text-gray-500 mb-3 px-1">
                  Detalle de horas extra
                </h2>
                {loadingOvertime ? (
                  <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Card key={i} className="bg-white border-0 shadow-sm">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <Skeleton className="w-10 h-10 rounded-xl" />
                            <div className="flex-1">
                              <Skeleton className="h-4 w-24 mb-2" />
                              <Skeleton className="h-3 w-32" />
                            </div>
                            <Skeleton className="h-6 w-12" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : overtimeRecords && overtimeRecords.length > 0 ? (
                  <div className="space-y-2 pb-20">
                    {overtimeRecords.map((record) => (
                      <Card key={record.id} className="bg-white border-0 shadow-sm">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center",
                                record.tipo === "dobles"
                                  ? "bg-blue-100"
                                  : "bg-purple-100"
                              )}
                            >
                              <Timer
                                className={cn(
                                  "h-5 w-5",
                                  record.tipo === "dobles"
                                    ? "text-blue-600"
                                    : "text-purple-600"
                                )}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm text-gray-900">
                                {format(new Date(record.fecha), "EEEE, d MMM", {
                                  locale: es,
                                })}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {record.motivo}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-base text-gray-900">
                                {record.horas}h
                              </p>
                              <Badge
                                className={cn(
                                  "text-[10px]",
                                  record.tipo === "dobles"
                                    ? "bg-blue-100 text-blue-700 hover:bg-blue-100"
                                    : "bg-purple-100 text-purple-700 hover:bg-purple-100"
                                )}
                              >
                                {record.tipo === "dobles" ? "x2" : "x3"}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="bg-white border-0 shadow-sm">
                    <CardContent className="p-8 text-center">
                      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                        <Timer className="h-8 w-8 text-gray-400" />
                      </div>
                      <p className="text-gray-600 font-medium mb-1">
                        Sin horas extra
                      </p>
                      <p className="text-sm text-gray-500">
                        No tienes horas extra registradas este mes
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </>
          )}
        </div>
      </PullToRefresh>
    </PortalMobileLayout>
  );
}
