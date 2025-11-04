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

const KANBAN_COLUMNS = [
  { id: "pendiente", title: "Pendiente", color: "bg-yellow-100 dark:bg-yellow-900/30" },
  { id: "en_proceso", title: "En Proceso", color: "bg-blue-100 dark:bg-blue-900/30" },
  { id: "documentacion", title: "Documentación", color: "bg-purple-100 dark:bg-purple-900/30" },
  { id: "aprobado", title: "Aprobado", color: "bg-green-100 dark:bg-green-900/30" },
  { id: "completado", title: "Completado", color: "bg-gray-100 dark:bg-gray-900/30" },
  { id: "demanda", title: "Demanda", color: "bg-red-100 dark:bg-red-900/30" },
];

export function CasosLegalesKanban() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newCase, setNewCase] = useState({
    employeeId: "",
    employeeName: "",
    caseType: "renuncia",
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
        caseType: "renuncia",
        reason: "",
        startDate: new Date().toISOString().split('T')[0],
        endDate: "",
        notes: "",
      });
      toast({
        title: "Caso creado",
        description: "El caso legal ha sido creado exitosamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al crear caso",
        variant: "destructive",
      });
    },
  });

  const updateCaseStatusMutation = useMutation({
    mutationFn: async ({ id, status, legalCase }: { id: string; status: string; legalCase?: LegalCase }) => {
      // Si se mueve a "demanda", crear automáticamente una demanda vinculada
      if (status === "demanda" && legalCase) {
        await apiRequest("POST", "/api/legal/lawsuits", {
          title: `Demanda - ${legalCase.reason}`,
          employeeName: legalCase.employeeName,
          legalCaseId: legalCase.id,
          stage: "conciliacion",
          description: `Demanda generada automáticamente desde baja. Motivo: ${legalCase.reason}. Notas: ${legalCase.notes || 'N/A'}`,
        });
      }
      return await apiRequest("PATCH", `/api/legal/cases/${id}`, { status });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/legal/cases"] });
      queryClient.invalidateQueries({ queryKey: ["/api/legal/lawsuits"] });
      toast({
        title: "Estado actualizado",
        description: variables.status === "demanda" 
          ? "La baja se ha convertido en demanda. Se ha creado automáticamente en el módulo de Demandas."
          : "El estado del caso ha sido actualizado",
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
        title: "Caso eliminado",
        description: "El caso ha sido eliminado exitosamente",
      });
    },
  });

  const handleCreateCase = () => {
    if (!newCase.employeeName || !newCase.reason || !newCase.endDate) {
      toast({
        title: "Campos incompletos",
        description: "Por favor completa todos los campos requeridos",
        variant: "destructive",
      });
      return;
    }

    createCaseMutation.mutate({
      ...newCase,
      mode: "real",
      status: "pendiente",
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
          Cargando casos legales...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Tablero Kanban - Casos Legales</h2>
          <p className="text-muted-foreground mt-1">
            Gestiona el flujo de procesos legales de despidos y renuncias
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-nuevo-caso">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Caso Legal
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Caso Legal</DialogTitle>
              <DialogDescription>
                Registra un nuevo caso de despido o renuncia
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
                  <Label htmlFor="case-type">Tipo de Caso *</Label>
                  <Select 
                    value={newCase.caseType} 
                    onValueChange={(value) => setNewCase({ ...newCase, caseType: value })}
                  >
                    <SelectTrigger id="case-type" data-testid="select-case-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="renuncia">Renuncia Voluntaria</SelectItem>
                      <SelectItem value="despido">Despido</SelectItem>
                    </SelectContent>
                  </Select>
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
                  data-testid="button-crear-caso"
                >
                  {createCaseMutation.isPending ? "Creando..." : "Crear Caso"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {KANBAN_COLUMNS.map((column) => (
          <div key={column.id} className="space-y-3">
            <div className={`p-3 rounded-md ${column.color}`}>
              <h3 className="font-semibold text-sm">{column.title}</h3>
              <Badge variant="outline" className="mt-1">
                {getCasesByStatus(column.id).length} casos
              </Badge>
            </div>

            <div className="space-y-2">
              {getCasesByStatus(column.id).map((legalCase) => (
                <Card 
                  key={legalCase.id} 
                  className="hover-elevate cursor-pointer"
                  data-testid={`case-card-${legalCase.id}`}
                >
                  <CardHeader className="p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <Badge variant={legalCase.caseType === 'despido' ? 'destructive' : 'default'}>
                        {legalCase.caseType === 'despido' ? 'Despido' : 'Renuncia'}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => deleteCaseMutation.mutate(legalCase.id)}
                        data-testid={`button-delete-${legalCase.id}`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <CardTitle className="text-sm line-clamp-2">{legalCase.reason}</CardTitle>
                    <CardDescription className="text-xs">
                      Termina: {formatDate(legalCase.endDate)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <Select
                      value={legalCase.status}
                      onValueChange={(value) => 
                        updateCaseStatusMutation.mutate({ 
                          id: legalCase.id, 
                          status: value, 
                          legalCase: legalCase 
                        })
                      }
                    >
                      <SelectTrigger className="h-8 text-xs" data-testid={`select-status-${legalCase.id}`}>
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
                    {legalCase.notes && (
                      <div className="mt-2 p-2 bg-muted rounded text-xs">
                        <FileText className="h-3 w-3 inline mr-1" />
                        {legalCase.notes}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              {getCasesByStatus(column.id).length === 0 && (
                <Card className="border-dashed">
                  <CardContent className="p-4 text-center text-sm text-muted-foreground">
                    Sin casos
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
