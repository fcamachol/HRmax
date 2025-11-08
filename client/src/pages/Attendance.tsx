import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, addDays, startOfWeek, endOfWeek } from "date-fns";
import { es } from "date-fns/locale";
import {
  Calendar,
  Filter,
  Users,
  AlertCircle,
  XCircle,
  Clock,
  Timer,
  FileText,
  HeartPulse,
  MinusCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type {
  Employee,
  CentroTrabajo,
  IncidenciaAsistencia,
} from "@shared/schema";
import { IncidenciasAsistenciaLayout } from "@/components/IncidenciasAsistenciaLayout";

export default function Attendance() {
  const [activeTab, setActiveTab] = useState<"registro" | "historial">("registro");
  
  // Periodo selection - default to current week
  const today = new Date();
  const [fechaInicio, setFechaInicio] = useState<string>(
    format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd')
  );
  const [fechaFin, setFechaFin] = useState<string>(
    format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd')
  );
  const [selectedCentro, setSelectedCentro] = useState<string>("all");

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const { data: centrosTrabajo = [] } = useQuery<CentroTrabajo[]>({
    queryKey: ["/api/centros-trabajo"],
  });

  // Query de incidencias con queryKey estructurado para correcta invalidación de caché
  const { data: incidenciasAsistencia = [], isLoading } = useQuery<IncidenciaAsistencia[]>({
    queryKey: [
      "/api/incidencias-asistencia",
      { fechaInicio, fechaFin, centroTrabajoId: selectedCentro !== "all" ? selectedCentro : undefined }
    ],
    queryFn: async ({ queryKey }) => {
      const [path, params] = queryKey as [string, Record<string, string | undefined>];
      const searchParams = new URLSearchParams();
      
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value);
        }
      });
      
      const url = `${path}?${searchParams.toString()}`;
      const res = await fetch(url, { credentials: "include" });
      
      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }
      
      return res.json();
    },
  });

  // Mostrar todos los empleados siempre para permitir registrar incidencias en cualquier centro
  // Las incidencias ya están filtradas por centro en la query, y al crear nuevas se usa el centro seleccionado
  const filteredEmployees = employees;

  // Estadísticas calculadas de las incidencias del periodo
  const stats = {
    totalIncidencias: incidenciasAsistencia.length,
    faltas: incidenciasAsistencia.reduce((sum, inc) => sum + (inc.faltas || 0), 0),
    retardos: incidenciasAsistencia.reduce((sum, inc) => sum + (inc.retardos || 0), 0),
    horasExtra: incidenciasAsistencia.reduce((sum, inc) => sum + (inc.horasExtra || 0), 0),
    incapacidades: incidenciasAsistencia.reduce((sum, inc) => sum + (inc.incapacidades || 0), 0),
    permisos: incidenciasAsistencia.reduce((sum, inc) => sum + (inc.permisos || 0), 0),
  };

  const setCurrentWeek = () => {
    const today = new Date();
    setFechaInicio(format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd'));
    setFechaFin(format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd'));
  };

  const setCurrentMonth = () => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    setFechaInicio(format(firstDay, 'yyyy-MM-dd'));
    setFechaFin(format(lastDay, 'yyyy-MM-dd'));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Asistencia</h1>
          <p className="text-muted-foreground mt-2">
            Gestiona incidencias de asistencia por periodo
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList>
          <TabsTrigger value="registro" data-testid="tab-registro">
            <Calendar className="h-4 w-4 mr-2" />
            Registro por Periodo
          </TabsTrigger>
          <TabsTrigger value="historial" data-testid="tab-historial">
            <FileText className="h-4 w-4 mr-2" />
            Historial
          </TabsTrigger>
        </TabsList>

        <TabsContent value="registro" className="space-y-6">
          {/* Filtros de Periodo y Centro */}
          <Card>
            <CardHeader>
              <CardTitle>Selección de Periodo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="fecha-inicio">Fecha Inicio</Label>
                  <Input
                    id="fecha-inicio"
                    type="date"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    data-testid="input-fecha-inicio"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fecha-fin">Fecha Fin</Label>
                  <Input
                    id="fecha-fin"
                    type="date"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                    data-testid="input-fecha-fin"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="centro-trabajo">Centro de Trabajo</Label>
                  <Select value={selectedCentro} onValueChange={setSelectedCentro}>
                    <SelectTrigger id="centro-trabajo" data-testid="select-centro-trabajo">
                      <SelectValue placeholder="Selecciona centro" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los centros</SelectItem>
                      {centrosTrabajo.map((centro) => (
                        <SelectItem key={centro.id} value={centro.id!}>
                          {centro.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Accesos Rápidos</Label>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={setCurrentWeek}
                      data-testid="button-semana-actual"
                    >
                      Semana Actual
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={setCurrentMonth}
                      data-testid="button-mes-actual"
                    >
                      Mes Actual
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Estadísticas del Periodo */}
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Faltas</CardTitle>
                <XCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {stats.faltas}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total del periodo
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Retardos</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {stats.retardos}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total del periodo
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Horas Extra</CardTitle>
                <Timer className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {stats.horasExtra}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total de horas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">H. Descontadas</CardTitle>
                <MinusCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {incidenciasAsistencia.reduce((sum, inc) => sum + (inc.horasDescontadas || 0), 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total de horas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Incapacidades</CardTitle>
                <HeartPulse className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {stats.incapacidades}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total del periodo
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Permisos</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {stats.permisos}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total del periodo
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Mensaje informativo sobre el filtro */}
          {selectedCentro !== "all" && (
            <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      Filtrado por Centro de Trabajo
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Mostrando incidencias del centro seleccionado. Las nuevas incidencias se registrarán para este centro.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Grid de Incidencias */}
          <IncidenciasAsistenciaLayout
            fechaInicio={fechaInicio}
            fechaFin={fechaFin}
            centroTrabajoId={selectedCentro !== "all" ? selectedCentro : undefined}
            employees={filteredEmployees}
            incidenciasAsistencia={incidenciasAsistencia}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="historial" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Incidencias</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  Próximamente
                </h3>
                <p className="text-sm text-muted-foreground">
                  Visualiza el historial de incidencias de asistencia
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
