import { useState, useEffect, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, Users, ChevronDown, ChevronRight, Trash2, Search, Maximize2, Minimize2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type {
  Employee,
  IncidenciaAsistencia,
  InsertIncidenciaAsistencia,
} from "@shared/schema";
import { obtenerDiasFestivosDelAnio } from "@shared/schema";
import { format, eachDayOfInterval, parseISO, isSunday, getYear } from "date-fns";
import { es } from "date-fns/locale";

interface IncidenciasAsistenciaGridProps {
  fechaInicio: string;
  fechaFin: string;
  centroTrabajoId?: string;
  clienteId: string;
  empresaId: string;
  employees: Employee[];
  incidenciasAsistencia: IncidenciaAsistencia[];
  isLoading: boolean;
}

type IncidenciaTipo = "faltas" | "retardos" | "horasExtra" | "horasDescontadas" | "incapacidades" | "permisos" | "vacaciones" | "diasDomingo" | "diasFestivos";

interface DailyIncidencia {
  fecha: string;
  centroTrabajoId: string | null;
  faltas: number;
  retardos: number;
  horasExtra: number;
  horasDescontadas: number;
  incapacidades: number;
  permisos: number;
  vacaciones: number;
  diasDomingo: number;
  diasFestivos: number;
  notas: string;
  existingId?: string;
  hasChanges: boolean;
}

interface EmployeeIncidencias {
  employeeId: string;
  employeeName: string;
  dailyData: Map<string, DailyIncidencia>;
}

const INCIDENCIA_LABELS: Record<IncidenciaTipo, string> = {
  faltas: "Faltas",
  retardos: "Retardos",
  horasExtra: "Horas Extra",
  horasDescontadas: "Horas Desc.",
  incapacidades: "Incapacidades",
  permisos: "Permisos",
  vacaciones: "Vacaciones",
  diasDomingo: "Prima Dom.",
  diasFestivos: "Días Festivos",
};

export function IncidenciasAsistenciaGrid({
  fechaInicio,
  fechaFin,
  centroTrabajoId,
  clienteId,
  empresaId,
  employees,
  incidenciasAsistencia,
  isLoading,
}: IncidenciasAsistenciaGridProps) {
  const { toast } = useToast();
  const [employeeData, setEmployeeData] = useState<Map<string, EmployeeIncidencias>>(new Map());
  const [expandedColumns, setExpandedColumns] = useState<Set<IncidenciaTipo>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);

  const dateRange = useMemo(() => {
    try {
      return eachDayOfInterval({
        start: parseISO(fechaInicio),
        end: parseISO(fechaFin),
      });
    } catch {
      return [];
    }
  }, [fechaInicio, fechaFin]);

  useEffect(() => {
    const newData = new Map<string, EmployeeIncidencias>();

    employees.forEach((emp) => {
      const dailyData = new Map<string, DailyIncidencia>();
      
      dateRange.forEach((date) => {
        const dateStr = format(date, "yyyy-MM-dd");
        const existing = incidenciasAsistencia.find(
          (inc) => inc.employeeId === emp.id && inc.fecha === dateStr
        );

        dailyData.set(dateStr, {
          fecha: dateStr,
          centroTrabajoId: existing?.centroTrabajoId || centroTrabajoId || null,
          faltas: existing?.faltas || 0,
          retardos: existing?.retardos || 0,
          horasExtra: parseFloat(existing?.horasExtra || "0"),
          horasDescontadas: parseFloat(existing?.horasDescontadas || "0"),
          incapacidades: existing?.incapacidades || 0,
          permisos: existing?.permisos || 0,
          vacaciones: existing?.vacaciones || 0,
          diasDomingo: existing?.diasDomingo || 0,
          diasFestivos: (existing as any)?.diasFestivos || 0,
          notas: existing?.notas || "",
          existingId: existing?.id,
          hasChanges: false,
        });
      });

      const apellidoMaterno = emp.apellidoMaterno ? ` ${emp.apellidoMaterno}` : "";
      const employeeName = `${emp.apellidoPaterno}${apellidoMaterno}, ${emp.nombre}`;
      
      newData.set(emp.id!, {
        employeeId: emp.id!,
        employeeName,
        dailyData,
      });
    });

    setEmployeeData(newData);
  }, [employees, incidenciasAsistencia, dateRange]);

  const toggleColumnExpansion = (tipo: IncidenciaTipo) => {
    setExpandedColumns((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(tipo)) {
        newSet.delete(tipo);
      } else {
        newSet.add(tipo);
      }
      return newSet;
    });
  };

  const updateDailyValue = (
    employeeId: string,
    fecha: string,
    field: IncidenciaTipo | "notas",
    value: number | string
  ) => {
    setEmployeeData((prev) => {
      const newData = new Map(prev);
      const empData = newData.get(employeeId);
      if (!empData) return prev;

      const newDailyData = new Map(empData.dailyData);
      const dayData = newDailyData.get(fecha);
      if (!dayData) return prev;

      newDailyData.set(fecha, {
        ...dayData,
        [field]: value,
        hasChanges: true,
      });

      newData.set(employeeId, {
        ...empData,
        dailyData: newDailyData,
      });

      return newData;
    });
  };

  const calculateTotal = (empData: EmployeeIncidencias, field: IncidenciaTipo): number => {
    let total = 0;
    empData.dailyData.forEach((day) => {
      total += day[field];
    });
    return total;
  };

  const saveIncidenciasMutation = useMutation({
    mutationFn: async (data: InsertIncidenciaAsistencia & { id?: string }) => {
      if (data.id) {
        return await apiRequest("PATCH", `/api/incidencias-asistencia/${data.id}`, data);
      } else {
        return await apiRequest("POST", "/api/incidencias-asistencia", data);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error al guardar",
        description: error.message || "No se pudieron guardar las incidencias",
        variant: "destructive",
      });
    },
  });

  const handleSaveAll = async () => {
    setIsSaving(true);
    const changedRecords: Array<InsertIncidenciaAsistencia & { id?: string }> = [];

    employeeData.forEach((empData) => {
      empData.dailyData.forEach((dayData) => {
        if (dayData.hasChanges) {
          changedRecords.push({
            id: dayData.existingId,
            clienteId,
            empresaId,
            employeeId: empData.employeeId,
            fecha: dayData.fecha,
            centroTrabajoId: dayData.centroTrabajoId,
            faltas: dayData.faltas || 0,
            retardos: dayData.retardos || 0,
            horasExtra: (dayData.horasExtra || 0).toString(),
            horasDescontadas: (dayData.horasDescontadas || 0).toString(),
            incapacidades: dayData.incapacidades || 0,
            permisos: dayData.permisos || 0,
            vacaciones: dayData.vacaciones || 0,
            diasDomingo: dayData.diasDomingo || 0,
            diasFestivos: dayData.diasFestivos || 0,
            notas: dayData.notas || null,
          } as any);
        }
      });
    });

    if (changedRecords.length === 0) {
      toast({
        title: "Sin cambios",
        description: "No hay cambios para guardar",
      });
      setIsSaving(false);
      return;
    }

    try {
      for (const record of changedRecords) {
        await saveIncidenciasMutation.mutateAsync(record);
      }

      await queryClient.invalidateQueries({
        queryKey: ["/api/incidencias-asistencia"],
      });

      setEmployeeData((prev) => {
        const newData = new Map(prev);
        newData.forEach((empData, empId) => {
          const newDailyData = new Map(empData.dailyData);
          newDailyData.forEach((dayData, date) => {
            if (dayData.hasChanges) {
              newDailyData.set(date, { ...dayData, hasChanges: false });
            }
          });
          newData.set(empId, { ...empData, dailyData: newDailyData });
        });
        return newData;
      });

      toast({
        title: "Guardado exitoso",
        description: `Se guardaron ${changedRecords.length} registros`,
      });
    } catch (error) {
    } finally {
      setIsSaving(false);
    }
  };

  const hasAnyChanges = useMemo(() => {
    let hasChanges = false;
    employeeData.forEach((empData) => {
      empData.dailyData.forEach((dayData) => {
        if (dayData.hasChanges) {
          hasChanges = true;
        }
      });
    });
    return hasChanges;
  }, [employeeData]);

  const changesCount = useMemo(() => {
    let count = 0;
    employeeData.forEach((empData) => {
      empData.dailyData.forEach((dayData) => {
        if (dayData.hasChanges) count++;
      });
    });
    return count;
  }, [employeeData]);

  const filteredAndSortedEmployees = useMemo(() => {
    const empArray = Array.from(employeeData.values());
    
    const filtered = searchTerm
      ? empArray.filter((emp) =>
          emp.employeeName.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : empArray;
    
    return filtered.sort((a, b) => a.employeeName.localeCompare(b.employeeName));
  }, [employeeData, searchTerm]);

  const incidenciaTipos: IncidenciaTipo[] = [
    "faltas",
    "retardos",
    "horasExtra",
    "horasDescontadas",
    "incapacidades",
    "permisos",
    "vacaciones",
    "diasDomingo",
    "diasFestivos",
  ];

  const domingosPeriodo = useMemo(() => {
    return dateRange.filter(date => isSunday(date));
  }, [dateRange]);

  const diasFestivosPeriodo = useMemo(() => {
    if (dateRange.length === 0) return [];
    const years = new Set(dateRange.map(d => getYear(d)));
    const todosFestivos: string[] = [];
    years.forEach(year => {
      const festivosAnio = obtenerDiasFestivosDelAnio(year);
      festivosAnio.forEach(f => todosFestivos.push(f.fecha));
    });
    return dateRange.filter(date => {
      const dateStr = format(date, "yyyy-MM-dd");
      return todosFestivos.includes(dateStr);
    });
  }, [dateRange]);

  const getFilteredDates = (tipo: IncidenciaTipo): Date[] => {
    if (tipo === "diasDomingo") return domingosPeriodo;
    if (tipo === "diasFestivos") return diasFestivosPeriodo;
    return dateRange;
  };

  const getNombreFestivo = (dateStr: string): string => {
    const year = parseInt(dateStr.substring(0, 4));
    const festivos = obtenerDiasFestivosDelAnio(year);
    const festivo = festivos.find(f => f.fecha === dateStr);
    return festivo?.nombre || "";
  };

  const handleDiscardChanges = () => {
    setEmployeeData((prev) => {
      const newData = new Map(prev);
      newData.forEach((empData, empId) => {
        const newDailyData = new Map(empData.dailyData);
        newDailyData.forEach((dayData, date) => {
          if (dayData.hasChanges) {
            const original = incidenciasAsistencia.find(
              (inc) => inc.employeeId === empId && inc.fecha === date
            );
            if (original) {
              newDailyData.set(date, {
                fecha: date,
                centroTrabajoId: original.centroTrabajoId || null,
                faltas: original.faltas || 0,
                retardos: original.retardos || 0,
                horasExtra: parseFloat(original.horasExtra || "0"),
                horasDescontadas: parseFloat(original.horasDescontadas || "0"),
                incapacidades: original.incapacidades || 0,
                permisos: original.permisos || 0,
                vacaciones: original.vacaciones || 0,
                diasDomingo: original.diasDomingo || 0,
                diasFestivos: (original as any).diasFestivos || 0,
                notas: original.notas || "",
                existingId: original.id,
                hasChanges: false,
              });
            } else {
              newDailyData.set(date, {
                fecha: date,
                centroTrabajoId: centroTrabajoId || null,
                faltas: 0,
                retardos: 0,
                horasExtra: 0,
                horasDescontadas: 0,
                incapacidades: 0,
                permisos: 0,
                vacaciones: 0,
                diasDomingo: 0,
                diasFestivos: 0,
                notas: "",
                hasChanges: false,
              });
            }
          }
        });
        newData.set(empId, { ...empData, dailyData: newDailyData });
      });
      return newData;
    });
    
    toast({
      title: "Cambios descartados",
      description: "Se han revertido todos los cambios sin guardar",
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (employees.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Sin empleados</h3>
            <p className="text-sm text-muted-foreground">
              No hay empleados asignados a este centro de trabajo
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={isFullscreen ? "fixed inset-0 z-50 flex flex-col" : ""}>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle>Registro de Incidencias</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Periodo: {format(parseISO(fechaInicio), "dd MMM yyyy", { locale: es })} al{" "}
              {format(parseISO(fechaFin), "dd MMM yyyy", { locale: es })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {hasAnyChanges && (
              <Badge variant="secondary">{changesCount} cambios sin guardar</Badge>
            )}
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsFullscreen(!isFullscreen)}
              data-testid="button-toggle-fullscreen"
              title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleDiscardChanges}
              disabled={!hasAnyChanges}
              data-testid="button-descartar-cambios"
              title="Descartar cambios"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button
              onClick={handleSaveAll}
              disabled={!hasAnyChanges || isSaving}
              data-testid="button-guardar-incidencias"
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              Guardar Cambios
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className={isFullscreen ? "flex-1 overflow-auto" : ""}>
        <div className={isFullscreen ? "h-full overflow-auto" : "overflow-x-auto"}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[200px] sticky left-0 bg-background z-20">
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Buscar empleado..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="h-8"
                      data-testid="input-buscar-empleado"
                    />
                  </div>
                </TableHead>
                {incidenciaTipos.map((tipo) => {
                  const isExpanded = expandedColumns.has(tipo);
                  const filteredDates = getFilteredDates(tipo);
                  const hasDates = filteredDates.length > 0;
                  
                  // Si no hay fechas válidas para este tipo, mostrar indicador
                  if (!hasDates && (tipo === "diasDomingo" || tipo === "diasFestivos")) {
                    return (
                      <TableHead
                        key={tipo}
                        className="text-center min-w-[120px] border-l border-border"
                      >
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="text-xs font-normal">{INCIDENCIA_LABELS[tipo]}</span>
                          <span className="text-xs text-muted-foreground">Sin días</span>
                        </div>
                      </TableHead>
                    );
                  }
                  
                  if (isExpanded) {
                    return (
                      <TableHead
                        key={tipo}
                        colSpan={filteredDates.length}
                        className="text-center border-l border-border"
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleColumnExpansion(tipo)}
                          className="h-auto p-1"
                          data-testid={`button-collapse-${tipo}`}
                        >
                          <ChevronDown className="h-4 w-4 mr-1" />
                          {INCIDENCIA_LABELS[tipo]}
                          {(tipo === "diasDomingo" || tipo === "diasFestivos") && (
                            <span className="ml-1 text-xs text-muted-foreground">({filteredDates.length})</span>
                          )}
                        </Button>
                      </TableHead>
                    );
                  } else {
                    return (
                      <TableHead
                        key={tipo}
                        className="text-center min-w-[120px] border-l border-border"
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleColumnExpansion(tipo)}
                          className="h-auto p-1"
                          data-testid={`button-expand-${tipo}`}
                        >
                          <ChevronRight className="h-4 w-4 mr-1" />
                          {INCIDENCIA_LABELS[tipo]}
                          {(tipo === "diasDomingo" || tipo === "diasFestivos") && hasDates && (
                            <span className="ml-1 text-xs text-muted-foreground">({filteredDates.length})</span>
                          )}
                        </Button>
                      </TableHead>
                    );
                  }
                })}
              </TableRow>
              {expandedColumns.size > 0 && (
                <TableRow className="bg-muted/50">
                  <TableHead className="sticky left-0 bg-muted/50 z-20"></TableHead>
                  {incidenciaTipos.map((tipo) => {
                    const isExpanded = expandedColumns.has(tipo);
                    const filteredDates = getFilteredDates(tipo);
                    const hasDates = filteredDates.length > 0;
                    
                    // Si no hay fechas para diasDomingo o diasFestivos, mostrar celda vacía
                    if (!hasDates && (tipo === "diasDomingo" || tipo === "diasFestivos")) {
                      return <TableHead key={tipo} className="border-l border-border"></TableHead>;
                    }
                    
                    if (isExpanded) {
                      return filteredDates.map((date) => {
                        const dateStr = format(date, "yyyy-MM-dd");
                        const nombreFestivo = tipo === "diasFestivos" ? getNombreFestivo(dateStr) : "";
                        return (
                          <TableHead
                            key={`${tipo}-${date.toISOString()}`}
                            className="text-center text-xs min-w-[80px] border-l border-border"
                            title={nombreFestivo}
                          >
                            <div className="flex flex-col items-center">
                              <span>{format(date, "dd MMM", { locale: es })}</span>
                              {tipo === "diasFestivos" && nombreFestivo && (
                                <span className="text-[10px] text-muted-foreground truncate max-w-[70px]">
                                  {nombreFestivo}
                                </span>
                              )}
                            </div>
                          </TableHead>
                        );
                      });
                    } else {
                      return <TableHead key={tipo} className="border-l border-border"></TableHead>;
                    }
                  })}
                </TableRow>
              )}
            </TableHeader>
            <TableBody>
              {filteredAndSortedEmployees.map((empData) => (
                <TableRow
                  key={empData.employeeId}
                  data-testid={`row-incidencia-${empData.employeeId}`}
                >
                  <TableCell className="font-medium sticky left-0 bg-background z-10">
                    {empData.employeeName}
                  </TableCell>
                  {incidenciaTipos.map((tipo) => {
                    const isExpanded = expandedColumns.has(tipo);
                    const filteredDates = getFilteredDates(tipo);
                    const hasDates = filteredDates.length > 0;
                    
                    // Si no hay fechas para diasDomingo o diasFestivos, mostrar celda vacía
                    if (!hasDates && (tipo === "diasDomingo" || tipo === "diasFestivos")) {
                      return (
                        <TableCell
                          key={tipo}
                          className="text-center text-muted-foreground border-l border-border"
                        >
                          -
                        </TableCell>
                      );
                    }
                    
                    if (isExpanded) {
                      return filteredDates.map((date) => {
                        const dateStr = format(date, "yyyy-MM-dd");
                        const dayData = empData.dailyData.get(dateStr);
                        if (!dayData) return <TableCell key={dateStr}></TableCell>;

                        return (
                          <TableCell
                            key={`${tipo}-${dateStr}`}
                            className="p-1 border-l border-border"
                          >
                            <Input
                              type="number"
                              min="0"
                              max={tipo === "diasDomingo" || tipo === "diasFestivos" || tipo === "faltas" ? "1" : undefined}
                              step={tipo === "horasExtra" || tipo === "horasDescontadas" ? "0.5" : "1"}
                              value={dayData[tipo]}
                              onChange={(e) =>
                                updateDailyValue(
                                  empData.employeeId,
                                  dateStr,
                                  tipo,
                                  tipo === "horasExtra" || tipo === "horasDescontadas"
                                    ? parseFloat(e.target.value) || 0
                                    : parseInt(e.target.value) || 0
                                )
                              }
                              className="text-center text-sm h-8"
                              data-testid={`input-${tipo}-${empData.employeeId}-${dateStr}`}
                            />
                          </TableCell>
                        );
                      });
                    } else {
                      // Calcular total solo sobre las fechas filtradas
                      let total = 0;
                      filteredDates.forEach((date) => {
                        const dateStr = format(date, "yyyy-MM-dd");
                        const dayData = empData.dailyData.get(dateStr);
                        if (dayData) total += dayData[tipo];
                      });
                      
                      return (
                        <TableCell
                          key={tipo}
                          className="text-center font-medium border-l border-border"
                        >
                          {total > 0 ? (
                            <Badge variant="secondary" data-testid={`total-${tipo}-${empData.employeeId}`}>
                              {total}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </TableCell>
                      );
                    }
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
