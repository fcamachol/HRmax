import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  Download,
  TrendingUp,
  Users,
  CheckCircle,
  Clock,
  AlertCircle,
  GraduationCap,
  Calendar,
  FileSpreadsheet,
  Award,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useCliente } from "@/contexts/ClienteContext";
import type { Curso, AsignacionCurso, Employee, Departamento } from "@shared/schema";

interface AsignacionConDetalles extends AsignacionCurso {
  curso: Curso;
  empleado: Employee;
}

export default function Reportes() {
  const { clienteActual } = useCliente();
  const { toast } = useToast();
  const [periodo, setPeriodo] = useState<string>("mes");
  const [departamentoFilter, setDepartamentoFilter] = useState<string>("todos");

  const { data: cursos = [] } = useQuery<Curso[]>({
    queryKey: ["/api/cursos", clienteActual?.id],
    enabled: !!clienteActual?.id,
  });

  const { data: asignaciones = [] } = useQuery<AsignacionConDetalles[]>({
    queryKey: ["/api/asignaciones-cursos", clienteActual?.id],
    enabled: !!clienteActual?.id,
  });

  const { data: departamentos = [] } = useQuery<Departamento[]>({
    queryKey: ["/api/departamentos", clienteActual?.id],
    enabled: !!clienteActual?.id,
  });

  const { data: empleados = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees", clienteActual?.id],
    enabled: !!clienteActual?.id,
  });

  // Filter by date period
  const getDateFilter = () => {
    const now = new Date();
    switch (periodo) {
      case "semana":
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case "mes":
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case "trimestre":
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      case "año":
        return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      default:
        return new Date(0);
    }
  };

  const filteredAsignaciones = asignaciones.filter((a) => {
    const dateFilter = getDateFilter();
    const assignDate = new Date(a.fechaAsignacion);
    const matchesPeriodo = periodo === "todos" || assignDate >= dateFilter;
    const matchesDepartamento =
      departamentoFilter === "todos" || a.empleado?.departamentoId === departamentoFilter;
    return matchesPeriodo && matchesDepartamento;
  });

  // Calculate metrics
  const totalAsignaciones = filteredAsignaciones.length;
  const completadas = filteredAsignaciones.filter((a) => a.estatus === "completado").length;
  const enProgreso = filteredAsignaciones.filter((a) => a.estatus === "en_progreso").length;
  const vencidas = filteredAsignaciones.filter((a) => a.estatus === "vencido").length;
  const pendientes = filteredAsignaciones.filter((a) => a.estatus === "asignado").length;

  const tasaCompletado = totalAsignaciones > 0 ? Math.round((completadas / totalAsignaciones) * 100) : 0;

  // Calculate average completion time (in days)
  const completadasConFecha = filteredAsignaciones.filter(
    (a) => a.estatus === "completado" && a.fechaCompletado && a.fechaAsignacion
  );
  const avgCompletionDays =
    completadasConFecha.length > 0
      ? Math.round(
          completadasConFecha.reduce((sum, a) => {
            const start = new Date(a.fechaAsignacion).getTime();
            const end = new Date(a.fechaCompletado!).getTime();
            return sum + (end - start) / (1000 * 60 * 60 * 24);
          }, 0) / completadasConFecha.length
        )
      : 0;

  // Courses with most assignments
  const cursoStats = cursos.map((curso) => {
    const asignacionesCurso = filteredAsignaciones.filter((a) => a.cursoId === curso.id);
    const completados = asignacionesCurso.filter((a) => a.estatus === "completado").length;
    return {
      ...curso,
      totalAsignaciones: asignacionesCurso.length,
      completados,
      tasaCompletado: asignacionesCurso.length > 0 ? Math.round((completados / asignacionesCurso.length) * 100) : 0,
    };
  }).sort((a, b) => b.totalAsignaciones - a.totalAsignaciones);

  // Department stats
  const departamentoStats = departamentos.map((depto) => {
    const asignacionesDepto = filteredAsignaciones.filter(
      (a) => a.empleado?.departamentoId === depto.id
    );
    const completados = asignacionesDepto.filter((a) => a.estatus === "completado").length;
    const empleadosDepto = empleados.filter((e) => e.departamentoId === depto.id && e.estatus === "activo");
    return {
      ...depto,
      totalEmpleados: empleadosDepto.length,
      totalAsignaciones: asignacionesDepto.length,
      completados,
      tasaCompletado: asignacionesDepto.length > 0 ? Math.round((completados / asignacionesDepto.length) * 100) : 0,
    };
  }).sort((a, b) => b.totalAsignaciones - a.totalAsignaciones);

  // Employees with pending courses (for compliance)
  const empleadosConPendientes = empleados
    .filter((e) => e.estatus === "activo")
    .map((emp) => {
      const asignacionesEmp = filteredAsignaciones.filter((a) => a.empleadoId === emp.id);
      const pendientes = asignacionesEmp.filter((a) => a.estatus !== "completado");
      const vencidos = asignacionesEmp.filter((a) => a.estatus === "vencido");
      const obligatoriosPendientes = pendientes.filter((a) => a.esObligatorio);
      return {
        ...emp,
        totalAsignaciones: asignacionesEmp.length,
        pendientes: pendientes.length,
        vencidos: vencidos.length,
        obligatoriosPendientes: obligatoriosPendientes.length,
      };
    })
    .filter((e) => e.obligatoriosPendientes > 0)
    .sort((a, b) => b.obligatoriosPendientes - a.obligatoriosPendientes);

  const handleExportCSV = (type: string) => {
    let csvContent = "";
    let filename = "";

    if (type === "general") {
      filename = `reporte_capacitacion_${new Date().toISOString().split("T")[0]}.csv`;
      csvContent = "Empleado,Número,Curso,Estado,Fecha Asignación,Fecha Límite,Progreso\n";
      filteredAsignaciones.forEach((a) => {
        csvContent += `"${a.empleado?.nombre} ${a.empleado?.apellidoPaterno}",${a.empleado?.numeroEmpleado},"${a.curso?.nombre}",${a.estatus},${a.fechaAsignacion || ""},${a.fechaVencimiento || ""},${a.porcentajeProgreso || 0}%\n`;
      });
    } else if (type === "stps") {
      filename = `dc3_stps_${new Date().toISOString().split("T")[0]}.csv`;
      csvContent = "RFC,CURP,Nombre,Apellido Paterno,Apellido Materno,Curso,Fecha Inicio,Fecha Fin,Horas,Calificación\n";
      filteredAsignaciones
        .filter((a) => a.estatus === "completado")
        .forEach((a) => {
          csvContent += `${a.empleado?.rfc || ""},${a.empleado?.curp || ""},"${a.empleado?.nombre}","${a.empleado?.apellidoPaterno}","${a.empleado?.apellidoMaterno || ""}","${a.curso?.nombre}",${a.fechaAsignacion || ""},${a.fechaCompletado || ""},${(a.curso?.duracionEstimadaMinutos || 0) / 60},${a.calificacionFinal || ""}\n`;
        });
    } else if (type === "pendientes") {
      filename = `cursos_pendientes_${new Date().toISOString().split("T")[0]}.csv`;
      csvContent = "Empleado,Número,Departamento,Cursos Obligatorios Pendientes,Cursos Vencidos\n";
      empleadosConPendientes.forEach((e) => {
        const depto = departamentos.find((d) => d.id === e.departamentoId);
        csvContent += `"${e.nombre} ${e.apellidoPaterno}",${e.numeroEmpleado},"${depto?.nombre || ""}",${e.obligatoriosPendientes},${e.vencidos}\n`;
      });
    }

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    toast({ title: "Reporte exportado", description: `Se descargó ${filename}` });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Reportes de Capacitación
          </h1>
          <p className="text-muted-foreground">
            Análisis y métricas de los programas de capacitación
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semana">Última semana</SelectItem>
              <SelectItem value="mes">Último mes</SelectItem>
              <SelectItem value="trimestre">Último trimestre</SelectItem>
              <SelectItem value="año">Último año</SelectItem>
              <SelectItem value="todos">Todo el tiempo</SelectItem>
            </SelectContent>
          </Select>
          <Select value={departamentoFilter} onValueChange={setDepartamentoFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Departamento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {departamentos.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalAsignaciones}</p>
                <p className="text-sm text-muted-foreground">Total asignaciones</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completadas}</p>
                <p className="text-sm text-muted-foreground">Completadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{tasaCompletado}%</p>
                <p className="text-sm text-muted-foreground">Tasa completado</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{avgCompletionDays}</p>
                <p className="text-sm text-muted-foreground">Días promedio</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{vencidas}</p>
                <p className="text-sm text-muted-foreground">Vencidas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs with detailed reports */}
      <Tabs defaultValue="cursos">
        <TabsList>
          <TabsTrigger value="cursos">Por Curso</TabsTrigger>
          <TabsTrigger value="departamentos">Por Departamento</TabsTrigger>
          <TabsTrigger value="compliance">Cumplimiento</TabsTrigger>
          <TabsTrigger value="exportar">Exportar</TabsTrigger>
        </TabsList>

        <TabsContent value="cursos" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Rendimiento por Curso</CardTitle>
              <CardDescription>
                Métricas de cada curso ordenadas por número de asignaciones
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Curso</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-center">Asignaciones</TableHead>
                    <TableHead className="text-center">Completados</TableHead>
                    <TableHead>Tasa Completado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cursoStats.slice(0, 10).map((curso) => (
                    <TableRow key={curso.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{curso.nombre}</p>
                          <p className="text-xs text-muted-foreground">{curso.codigo}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={curso.tipoCapacitacion === "obligatoria" ? "destructive" : "secondary"}>
                          {curso.tipoCapacitacion === "obligatoria" ? "Obligatorio" : "Opcional"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">{curso.totalAsignaciones}</TableCell>
                      <TableCell className="text-center">{curso.completados}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={curso.tasaCompletado} className="w-20 h-2" />
                          <span className="text-sm">{curso.tasaCompletado}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="departamentos" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Rendimiento por Departamento</CardTitle>
              <CardDescription>
                Progreso de capacitación por área organizacional
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Departamento</TableHead>
                    <TableHead className="text-center">Empleados</TableHead>
                    <TableHead className="text-center">Asignaciones</TableHead>
                    <TableHead className="text-center">Completados</TableHead>
                    <TableHead>Tasa Completado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {departamentoStats.map((depto) => (
                    <TableRow key={depto.id}>
                      <TableCell className="font-medium">{depto.nombre}</TableCell>
                      <TableCell className="text-center">{depto.totalEmpleados}</TableCell>
                      <TableCell className="text-center">{depto.totalAsignaciones}</TableCell>
                      <TableCell className="text-center">{depto.completados}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={depto.tasaCompletado} className="w-20 h-2" />
                          <span className="text-sm">{depto.tasaCompletado}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                Empleados con Cursos Obligatorios Pendientes
              </CardTitle>
              <CardDescription>
                Lista de empleados que no han completado capacitaciones obligatorias
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {empleadosConPendientes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-2" />
                  <p>Todos los empleados están al día con sus capacitaciones obligatorias</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empleado</TableHead>
                      <TableHead>Número</TableHead>
                      <TableHead className="text-center">Obligatorios Pendientes</TableHead>
                      <TableHead className="text-center">Vencidos</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {empleadosConPendientes.map((emp) => (
                      <TableRow key={emp.id}>
                        <TableCell className="font-medium">
                          {emp.nombre} {emp.apellidoPaterno}
                        </TableCell>
                        <TableCell>{emp.numeroEmpleado}</TableCell>
                        <TableCell className="text-center">{emp.obligatoriosPendientes}</TableCell>
                        <TableCell className="text-center">
                          {emp.vencidos > 0 ? (
                            <Badge variant="destructive">{emp.vencidos}</Badge>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>
                          {emp.vencidos > 0 ? (
                            <Badge variant="destructive">Requiere atención</Badge>
                          ) : (
                            <Badge variant="secondary">En proceso</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exportar" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="cursor-pointer hover:border-primary" onClick={() => handleExportCSV("general")}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileSpreadsheet className="h-5 w-5" />
                  Reporte General
                </CardTitle>
                <CardDescription>
                  Todas las asignaciones con estado, fechas y progreso
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar CSV
                </Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:border-primary" onClick={() => handleExportCSV("stps")}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Award className="h-5 w-5" />
                  Formato DC-3 (STPS)
                </CardTitle>
                <CardDescription>
                  Constancia de habilidades para la STPS
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar CSV
                </Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:border-primary" onClick={() => handleExportCSV("pendientes")}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <AlertCircle className="h-5 w-5" />
                  Cursos Pendientes
                </CardTitle>
                <CardDescription>
                  Empleados con capacitaciones obligatorias pendientes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar CSV
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
