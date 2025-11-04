import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { LegalCase } from "@shared/schema";
import { 
  bajaCategories, 
  bajaTypes, 
  bajaTypeLabels, 
  bajaCategoryLabels,
  type BajaCategory 
} from "@shared/schema";

const KANBAN_COLUMNS = [
  { id: "detonante", title: "1. Detonante", color: "bg-yellow-100 dark:bg-yellow-900/30", description: "Inicio del proceso de baja" },
  { id: "calculo", title: "2. Cálculo", color: "bg-blue-100 dark:bg-blue-900/30", description: "Cálculo de finiquito/liquidación" },
  { id: "documentacion", title: "3. Documentación", color: "bg-purple-100 dark:bg-purple-900/30", description: "Revisión documental y expediente" },
  { id: "firma", title: "4. Firma/Junta", color: "bg-indigo-100 dark:bg-indigo-900/30", description: "Presentación ante autoridad" },
  { id: "tramites", title: "5. Trámites", color: "bg-cyan-100 dark:bg-cyan-900/30", description: "IMSS, INFONAVIT, CFDI" },
  { id: "entrega", title: "6. Entrega", color: "bg-teal-100 dark:bg-teal-900/30", description: "Cierre y documentos finales" },
  { id: "completado", title: "7. Completado", color: "bg-green-100 dark:bg-green-900/30", description: "Seguimiento post-baja" },
  { id: "demanda", title: "8. Demanda", color: "bg-red-100 dark:bg-red-900/30", description: "Escalado a proceso legal" },
];

// Mapeo de bajaType a caseType legacy para compatibilidad hacia atrás
const bajaTypeToLegacyCaseType = (bajaType: string): string => {
  // Mapear tipos específicos a categorías legacy
  if (bajaType === 'despido_justificado') return 'despido_justificado';
  if (bajaType === 'despido_injustificado') return 'despido_injustificado';
  if (bajaType.includes('renuncia')) return 'renuncia';
  if (bajaType === 'fin_de_contrato') return 'despido_justificado';
  if (bajaType === 'cierre_empresa') return 'despido_injustificado';
  if (bajaType === 'inhabilitacion_legal') return 'despido_justificado';
  if (bajaType === 'mutuo_acuerdo') return 'renuncia';
  if (bajaType === 'jubilacion_pension') return 'renuncia';
  if (bajaType === 'fallecimiento') return 'renuncia';
  if (bajaType === 'incapacidad_permanente') return 'renuncia';
  if (bajaType === 'baja_administrativa') return 'renuncia';
  return 'renuncia'; // Default
};

export function CasosLegalesKanban() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newCase, setNewCase] = useState({
    employeeId: "",
    employeeName: "",
    bajaCategory: "voluntaria" as "voluntaria" | "involuntaria" | "especial",
    bajaType: "renuncia_voluntaria",
    caseType: "renuncia", // Mantener por compatibilidad
    reason: "",
    startDate: new Date().toISOString().split('T')[0],
    endDate: "",
    notes: "",
  });
  const { toast } = useToast();

  const { data: cases = [], isLoading } = useQuery<LegalCase[]>({
    queryKey: ["/api/legal/cases", "real"],
    queryFn: async () => {
      const response = await fetch("/api/legal/cases?mode=real");
      if (!response.ok) throw new Error("Failed to fetch cases");
      return response.json();
    },
  });

  const createCaseMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/legal/cases", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/legal/cases"] });
      setIsDialogOpen(false);
      setNewCase({
        employeeId: "",
        employeeName: "",
        bajaCategory: "voluntaria",
        bajaType: "renuncia_voluntaria",
        caseType: bajaTypeToLegacyCaseType("renuncia_voluntaria"),
        reason: "",
        startDate: new Date().toISOString().split('T')[0],
        endDate: "",
        notes: "",
      });
      toast({
        title: "Baja registrada",
        description: "La baja del empleado ha sido registrada exitosamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al registrar baja",
        variant: "destructive",
      });
    },
  });

  const updateCaseStatusMutation = useMutation({
    mutationFn: async ({ id, status, legalCase, previousStatus }: { 
      id: string; 
      status: string; 
      legalCase?: LegalCase;
      previousStatus?: string;
    }) => {
      // Primero actualizar el status de la baja
      const result = await apiRequest("PATCH", `/api/legal/cases/${id}`, { status });
      
      let lawsuitCreated = false;
      let lawsuitExisted = false;
      
      // Solo si la actualización fue exitosa Y el nuevo status es "demanda"
      if (status === "demanda" && legalCase) {
        try {
          // El servidor verificará duplicados antes de crear
          await apiRequest("POST", "/api/legal/lawsuits", {
            title: `Demanda - ${legalCase.reason}`,
            employeeName: legalCase.employeeName,
            legalCaseId: legalCase.id,
            stage: "conciliacion",
            description: `Demanda generada automáticamente desde baja. Motivo: ${legalCase.reason}. Notas: ${legalCase.notes || 'N/A'}`,
          });
          lawsuitCreated = true;
        } catch (lawsuitError: any) {
          if (lawsuitError.status === 409) {
            // Duplicado - la demanda ya existía
            lawsuitExisted = true;
          } else {
            // Otro error - intentar rollback
            let rollbackSucceeded = false;
            try {
              await apiRequest("PATCH", `/api/legal/cases/${id}`, { 
                status: previousStatus || "detonante" 
              });
              rollbackSucceeded = true;
            } catch (rollbackError) {
              // Rollback falló - error crítico
            }
            
            // Lanzar error apropiado después del intento de rollback
            if (rollbackSucceeded) {
              throw new Error("No se pudo crear la demanda. La baja ha sido revertida a su estado anterior.");
            } else {
              throw new Error("Error crítico: no se pudo crear la demanda ni revertir el estado de la baja.");
            }
          }
        }
      }
      
      return { ...result, lawsuitCreated, lawsuitExisted };
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/legal/cases"] });
      queryClient.invalidateQueries({ queryKey: ["/api/legal/lawsuits"] });
      
      let description = "El estado de la baja ha sido actualizado";
      if (variables.status === "demanda") {
        if (data.lawsuitCreated) {
          description = "La baja se ha convertido en demanda. Se ha creado automáticamente en el módulo Legal > Demandas.";
        } else if (data.lawsuitExisted) {
          description = "La baja se ha movido a demanda. Ya existe una demanda vinculada en el módulo Legal > Demandas.";
        }
      }
      
      toast({
        title: "Estado actualizado",
        description,
      });
    },
    onError: (error: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/legal/cases"] });
      toast({
        title: "Error al actualizar estado",
        description: error.message || "No se pudo actualizar el estado de la baja",
        variant: "destructive",
      });
    },
  });

  const deleteCaseMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/legal/cases/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/legal/cases"] });
      toast({
        title: "Baja eliminada",
        description: "El registro de baja ha sido eliminado exitosamente",
      });
    },
  });

  const handleCreateCase = () => {
    if (!newCase.employeeName || !newCase.reason || !newCase.endDate) {
      toast({
        title: "Campos incompletos",
        description: "Por favor completa el nombre del empleado, motivo y fecha de terminación",
        variant: "destructive",
      });
      return;
    }

    createCaseMutation.mutate({
      ...newCase,
      mode: "real",
      status: "detonante",
    });
  };

  const getCasesByStatus = (status: string) => {
    return cases.filter(c => c.status === status);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Sin fecha";
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          Cargando bajas de empleados...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gestión de Bajas</h2>
          <p className="text-muted-foreground mt-1">
            Administra el proceso de baja de empleados desde el inicio hasta la finalización
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-nueva-baja">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Baja
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Registrar Nueva Baja</DialogTitle>
              <DialogDescription>
                Inicia el proceso de baja de un empleado (renuncia voluntaria o despido)
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="employee-name">Nombre del Empleado *</Label>
                <Input
                  id="employee-name"
                  placeholder="Ej: Juan Pérez García"
                  value={newCase.employeeName}
                  onChange={(e) => setNewCase({ ...newCase, employeeName: e.target.value })}
                  data-testid="input-employee-name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="baja-category">Categoría de Baja *</Label>
                  <Select 
                    value={newCase.bajaCategory} 
                    onValueChange={(value: BajaCategory) => {
                      const firstType = bajaTypes[value][0];
                      const legacyCaseType = bajaTypeToLegacyCaseType(firstType);
                      setNewCase({ 
                        ...newCase, 
                        bajaCategory: value,
                        bajaType: firstType,
                        caseType: legacyCaseType
                      });
                    }}
                  >
                    <SelectTrigger id="baja-category" data-testid="select-baja-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {bajaCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {bajaCategoryLabels[category]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="baja-type">Tipo Específico *</Label>
                  <Select 
                    value={newCase.bajaType} 
                    onValueChange={(value) => {
                      const legacyCaseType = bajaTypeToLegacyCaseType(value);
                      setNewCase({ 
                        ...newCase, 
                        bajaType: value,
                        caseType: legacyCaseType
                      });
                    }}
                  >
                    <SelectTrigger id="baja-type" data-testid="select-baja-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {bajaTypes[newCase.bajaCategory].map((type) => (
                        <SelectItem key={type} value={type}>
                          {bajaTypeLabels[type]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="end-date">Fecha de Terminación *</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={newCase.endDate}
                  onChange={(e) => setNewCase({ ...newCase, endDate: e.target.value })}
                  data-testid="input-end-date"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Motivo *</Label>
                <Input
                  id="reason"
                  placeholder="Ej: Reducción de personal, incumplimiento de contrato, etc."
                  value={newCase.reason}
                  onChange={(e) => setNewCase({ ...newCase, reason: e.target.value })}
                  data-testid="input-reason"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notas Adicionales</Label>
                <Textarea
                  id="notes"
                  placeholder="Información adicional relevante..."
                  value={newCase.notes}
                  onChange={(e) => setNewCase({ ...newCase, notes: e.target.value })}
                  data-testid="textarea-notes"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  data-testid="button-cancel"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleCreateCase} 
                  disabled={createCaseMutation.isPending}
                  data-testid="button-crear-baja"
                >
                  {createCaseMutation.isPending ? "Registrando..." : "Registrar Baja"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-3">
        {KANBAN_COLUMNS.map((column) => (
          <div key={column.id} className="space-y-2">
            <div className={`p-2 rounded-md ${column.color}`}>
              <h3 className="font-semibold text-xs">{column.title}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{column.description}</p>
              <Badge variant="outline" className="mt-1 text-xs">
                {getCasesByStatus(column.id).length}
              </Badge>
            </div>

            <div className="space-y-2">
              {getCasesByStatus(column.id).map((legalCase) => (
                <Card 
                  key={legalCase.id} 
                  className="hover-elevate cursor-pointer"
                  data-testid={`case-card-${legalCase.id}`}
                >
                  <CardHeader className="p-2 space-y-1">
                    <div className="flex justify-between items-start gap-1">
                      <div className="flex flex-col gap-0.5">
                        <Badge 
                          variant={
                            legalCase.bajaCategory === 'involuntaria' ? 'destructive' : 
                            legalCase.bajaCategory === 'especial' ? 'secondary' : 
                            'default'
                          } 
                          className="text-xs"
                        >
                          {bajaCategoryLabels[legalCase.bajaCategory as BajaCategory]}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {bajaTypeLabels[legalCase.bajaType]}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={() => deleteCaseMutation.mutate(legalCase.id)}
                        data-testid={`button-delete-${legalCase.id}`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <CardTitle className="text-xs line-clamp-1">{legalCase.employeeName || legalCase.reason}</CardTitle>
                    <CardDescription className="text-xs">
                      {formatDate(legalCase.endDate)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-2 pt-0">
                    <Select
                      value={legalCase.status}
                      onValueChange={(value) => 
                        updateCaseStatusMutation.mutate({ 
                          id: legalCase.id, 
                          status: value, 
                          legalCase: legalCase,
                          previousStatus: legalCase.status
                        })
                      }
                    >
                      <SelectTrigger className="h-7 text-xs" data-testid={`select-status-${legalCase.id}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {KANBAN_COLUMNS.map((col) => (
                          <SelectItem key={col.id} value={col.id}>
                            {col.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>
              ))}

              {getCasesByStatus(column.id).length === 0 && (
                <Card className="border-dashed">
                  <CardContent className="p-2 text-center text-xs text-muted-foreground">
                    Vacío
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
