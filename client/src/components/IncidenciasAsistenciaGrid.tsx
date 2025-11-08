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
import { Loader2, Save, Users, ChevronDown, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type {
  Employee,
  IncidenciaAsistencia,
  InsertIncidenciaAsistencia,
} from "@shared/schema";
import { format, eachDayOfInterval, parseISO } from "date-fns";
import { es } from "date-fns/locale";

interface IncidenciasAsistenciaGridProps {
  fechaInicio: string;
  fechaFin: string;
  centroTrabajoId?: string;
  employees: Employee[];
  incidenciasAsistencia: IncidenciaAsistencia[];
  isLoading: boolean;
}

type IncidenciaTipo = "faltas" | "retardos" | "horasExtra" | "horasDescontadas" | "incapacidades" | "permisos";

interface DailyIncidencia {
  fecha: string;
  centroTrabajoId: string | null;
  faltas: number;
  retardos: number;
  horasExtra: number;
  horasDescontadas: number;
  incapacidades: number;
  permisos: number;
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
};

export function IncidenciasAsistenciaGrid({
  fechaInicio,
  fechaFin,
  centroTrabajoId,
  employees,
  incidenciasAsistencia,
  isLoading,
}: IncidenciasAsistenciaGridProps) {
  const { toast } = useToast();
  const [employeeData, setEmployeeData] = useState<Map<string, EmployeeIncidencias>>(new Map());
  const [expandedColumns, setExpandedColumns] = useState<Set<IncidenciaTipo>>(new Set());
  const [isSaving, setIsSaving] = useState(false);

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
          notas: existing?.notas || "",
          existingId: existing?.id,
          hasChanges: false,
        });
      });

      newData.set(emp.id!, {
        employeeId: emp.id!,
        employeeName: `${emp.nombre} ${emp.apellidoPaterno} ${emp.apellidoMaterno || ""}`.trim(),
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
            employeeId: empData.employeeId,
            fecha: dayData.fecha,
            centroTrabajoId: dayData.centroTrabajoId,
            faltas: dayData.faltas || 0,
            retardos: dayData.retardos || 0,
            horasExtra: (dayData.horasExtra || 0).toString(),
            horasDescontadas: (dayData.horasDescontadas || 0).toString(),
            incapacidades: dayData.incapacidades || 0,
            permisos: dayData.permisos || 0,
            notas: dayData.notas || null,
          });
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

  const incidenciaTipos: IncidenciaTipo[] = [
    "faltas",
    "retardos",
    "horasExtra",
    "horasDescontadas",
    "incapacidades",
    "permisos",
  ];

  return (
    <Card>
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
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[200px] sticky left-0 bg-background z-20">
                  Empleado
                </TableHead>
                {incidenciaTipos.map((tipo) => {
                  const isExpanded = expandedColumns.has(tipo);
                  if (isExpanded) {
                    return (
                      <TableHead
                        key={tipo}
                        colSpan={dateRange.length}
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
                    if (isExpanded) {
                      return dateRange.map((date) => (
                        <TableHead
                          key={`${tipo}-${date.toISOString()}`}
                          className="text-center text-xs min-w-[80px] border-l border-border"
                        >
                          {format(date, "dd MMM", { locale: es })}
                        </TableHead>
                      ));
                    } else {
                      return <TableHead key={tipo} className="border-l border-border"></TableHead>;
                    }
                  })}
                </TableRow>
              )}
            </TableHeader>
            <TableBody>
              {Array.from(employeeData.values()).map((empData) => (
                <TableRow
                  key={empData.employeeId}
                  data-testid={`row-incidencia-${empData.employeeId}`}
                >
                  <TableCell className="font-medium sticky left-0 bg-background z-10">
                    {empData.employeeName}
                  </TableCell>
                  {incidenciaTipos.map((tipo) => {
                    const isExpanded = expandedColumns.has(tipo);
                    if (isExpanded) {
                      return dateRange.map((date) => {
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
                      const total = calculateTotal(empData, tipo);
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
