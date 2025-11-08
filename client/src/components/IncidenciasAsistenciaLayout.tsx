import { useState, useEffect } from "react";
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
import { Loader2, Save, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type {
  Employee,
  IncidenciaAsistencia,
  InsertIncidenciaAsistencia,
} from "@shared/schema";

interface IncidenciasAsistenciaLayoutProps {
  fechaInicio: string;
  fechaFin: string;
  centroTrabajoId?: string;
  employees: Employee[];
  incidenciasAsistencia: IncidenciaAsistencia[];
  isLoading: boolean;
}

interface IncidenciaRow {
  employeeId: string;
  employeeName: string;
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

export function IncidenciasAsistenciaLayout({
  fechaInicio,
  fechaFin,
  centroTrabajoId,
  employees,
  incidenciasAsistencia,
  isLoading,
}: IncidenciasAsistenciaLayoutProps) {
  const { toast } = useToast();
  const [incidenciasData, setIncidenciasData] = useState<IncidenciaRow[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Inicializar datos del grid
  useEffect(() => {
    const initialData: IncidenciaRow[] = employees.map((emp) => {
      const existingIncidencia = incidenciasAsistencia.find(
        (inc) => inc.employeeId === emp.id
      );

      return {
        employeeId: emp.id!,
        employeeName: `${emp.nombre} ${emp.apellidoPaterno} ${emp.apellidoMaterno || ""}`.trim(),
        faltas: existingIncidencia?.faltas || 0,
        retardos: existingIncidencia?.retardos || 0,
        horasExtra: parseFloat(existingIncidencia?.horasExtra || "0"),
        horasDescontadas: parseFloat(existingIncidencia?.horasDescontadas || "0"),
        incapacidades: existingIncidencia?.incapacidades || 0,
        permisos: existingIncidencia?.permisos || 0,
        notas: existingIncidencia?.notas || "",
        existingId: existingIncidencia?.id,
        hasChanges: false,
      };
    });

    setIncidenciasData(initialData);
  }, [employees, incidenciasAsistencia]);

  const updateIncidenciaValue = (
    employeeId: string,
    field: keyof Omit<IncidenciaRow, "employeeId" | "employeeName" | "existingId" | "hasChanges">,
    value: number | string
  ) => {
    setIncidenciasData((prev) =>
      prev.map((row) =>
        row.employeeId === employeeId
          ? { ...row, [field]: value, hasChanges: true }
          : row
      )
    );
  };

  const saveIncidenciasMutation = useMutation({
    mutationFn: async (row: IncidenciaRow) => {
      const data: InsertIncidenciaAsistencia = {
        employeeId: row.employeeId,
        fechaInicio,
        fechaFin,
        centroTrabajoId: centroTrabajoId || null,
        faltas: row.faltas || 0,
        retardos: row.retardos || 0,
        horasExtra: (row.horasExtra || 0).toString(),
        horasDescontadas: (row.horasDescontadas || 0).toString(),
        incapacidades: row.incapacidades || 0,
        permisos: row.permisos || 0,
        notas: row.notas || null,
      };

      if (row.existingId) {
        // Actualizar registro existente
        return await apiRequest("PATCH", `/api/incidencias-asistencia/${row.existingId}`, data);
      } else {
        // Crear nuevo registro
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
    const changedRows = incidenciasData.filter((row) => row.hasChanges);

    if (changedRows.length === 0) {
      toast({
        title: "Sin cambios",
        description: "No hay cambios para guardar",
      });
      setIsSaving(false);
      return;
    }

    try {
      // Guardar todas las filas modificadas
      for (const row of changedRows) {
        await saveIncidenciasMutation.mutateAsync(row);
      }

      // Invalidar cache y resetear estado de cambios
      await queryClient.invalidateQueries({
        queryKey: ["/api/incidencias-asistencia"],
      });

      setIncidenciasData((prev) =>
        prev.map((row) => ({ ...row, hasChanges: false }))
      );

      toast({
        title: "Guardado exitoso",
        description: `Se guardaron ${changedRows.length} registros de incidencias`,
      });
    } catch (error) {
      // Error ya manejado por el mutation
    } finally {
      setIsSaving(false);
    }
  };

  const hasAnyChanges = incidenciasData.some((row) => row.hasChanges);

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
              No hay empleados registrados para mostrar incidencias
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Registro de Incidencias</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Periodo: {fechaInicio} al {fechaFin}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {hasAnyChanges && (
              <Badge variant="secondary">
                {incidenciasData.filter((r) => r.hasChanges).length} cambios sin guardar
              </Badge>
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
                <TableHead className="min-w-[200px] sticky left-0 bg-background z-10">
                  Empleado
                </TableHead>
                <TableHead className="text-center min-w-[100px]">
                  Faltas
                </TableHead>
                <TableHead className="text-center min-w-[100px]">
                  Retardos
                </TableHead>
                <TableHead className="text-center min-w-[120px]">
                  Horas Extra
                </TableHead>
                <TableHead className="text-center min-w-[140px]">
                  Horas Descontadas
                </TableHead>
                <TableHead className="text-center min-w-[130px]">
                  Incapacidades
                </TableHead>
                <TableHead className="text-center min-w-[100px]">
                  Permisos
                </TableHead>
                <TableHead className="min-w-[200px]">
                  Notas
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {incidenciasData.map((row) => (
                <TableRow
                  key={row.employeeId}
                  className={row.hasChanges ? "bg-muted/50" : ""}
                  data-testid={`row-incidencia-${row.employeeId}`}
                >
                  <TableCell className="font-medium sticky left-0 bg-background z-10">
                    {row.employeeName}
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      value={row.faltas}
                      onChange={(e) =>
                        updateIncidenciaValue(
                          row.employeeId,
                          "faltas",
                          parseInt(e.target.value) || 0
                        )
                      }
                      className="text-center"
                      data-testid={`input-faltas-${row.employeeId}`}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      value={row.retardos}
                      onChange={(e) =>
                        updateIncidenciaValue(
                          row.employeeId,
                          "retardos",
                          parseInt(e.target.value) || 0
                        )
                      }
                      className="text-center"
                      data-testid={`input-retardos-${row.employeeId}`}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      step="0.5"
                      value={row.horasExtra}
                      onChange={(e) =>
                        updateIncidenciaValue(
                          row.employeeId,
                          "horasExtra",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="text-center"
                      data-testid={`input-horas-extra-${row.employeeId}`}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      step="0.5"
                      value={row.horasDescontadas}
                      onChange={(e) =>
                        updateIncidenciaValue(
                          row.employeeId,
                          "horasDescontadas",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="text-center"
                      data-testid={`input-horas-descontadas-${row.employeeId}`}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      value={row.incapacidades}
                      onChange={(e) =>
                        updateIncidenciaValue(
                          row.employeeId,
                          "incapacidades",
                          parseInt(e.target.value) || 0
                        )
                      }
                      className="text-center"
                      data-testid={`input-incapacidades-${row.employeeId}`}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      value={row.permisos}
                      onChange={(e) =>
                        updateIncidenciaValue(
                          row.employeeId,
                          "permisos",
                          parseInt(e.target.value) || 0
                        )
                      }
                      className="text-center"
                      data-testid={`input-permisos-${row.employeeId}`}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="text"
                      value={row.notas}
                      onChange={(e) =>
                        updateIncidenciaValue(
                          row.employeeId,
                          "notas",
                          e.target.value
                        )
                      }
                      placeholder="Notas adicionales..."
                      data-testid={`input-notas-${row.employeeId}`}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
