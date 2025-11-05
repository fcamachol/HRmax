import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, MoreVertical, Trash2, Edit, User, DollarSign, Calendar, FileText } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { HiringProcess } from "@shared/schema";
import { hiringStageLabels } from "@shared/schema";
import { AltaWizard } from "./AltaWizard";
import { CartaOferta } from "./CartaOferta";

type HiringStage = 'oferta' | 'documentos' | 'alta_imss' | 'contrato' | 'onboarding' | 'completado';

const STAGES: { value: HiringStage; label: string; color: string; description: string }[] = [
  { value: 'oferta', label: '1. Carta Oferta', color: 'bg-blue-100 dark:bg-blue-900/30', description: 'Generación y envío de oferta' },
  { value: 'documentos', label: '2. Documentos', color: 'bg-purple-100 dark:bg-purple-900/30', description: 'Recopilación documental' },
  { value: 'alta_imss', label: '3. Alta IMSS', color: 'bg-indigo-100 dark:bg-indigo-900/30', description: 'Registro ante el IMSS' },
  { value: 'contrato', label: '4. Contrato', color: 'bg-cyan-100 dark:bg-cyan-900/30', description: 'Firma de contrato laboral' },
  { value: 'onboarding', label: '5. Onboarding', color: 'bg-teal-100 dark:bg-teal-900/30', description: 'Integración y capacitación' },
  { value: 'completado', label: '6. Completado', color: 'bg-green-100 dark:bg-green-900/30', description: 'Proceso finalizado' },
];

export function KanbanAltas() {
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [editingProcess, setEditingProcess] = useState<HiringProcess | null>(null);
  const [showCartaModal, setShowCartaModal] = useState(false);
  const [selectedProcessForCarta, setSelectedProcessForCarta] = useState<HiringProcess | null>(null);
  const { toast } = useToast();

  const { data: processes = [], isLoading } = useQuery<HiringProcess[]>({
    queryKey: ['/api/hiring/processes'],
  });

  const updateProcessMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<HiringProcess> }) => {
      return await apiRequest("PATCH", `/api/hiring/processes/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/hiring/processes'] });
      toast({
        title: "Proceso actualizado",
        description: "El proceso ha sido actualizado exitosamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al actualizar proceso",
        variant: "destructive",
      });
    },
  });

  const deleteProcessMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/hiring/processes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/hiring/processes'] });
      toast({
        title: "Proceso eliminado",
        description: "El proceso ha sido eliminado exitosamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al eliminar proceso",
        variant: "destructive",
      });
    },
  });

  const handleMoveStage = (processId: string, newStage: HiringStage) => {
    updateProcessMutation.mutate({
      id: processId,
      data: { stage: newStage },
    });
  };

  const handleEdit = (process: HiringProcess) => {
    setEditingProcess(process);
    setIsWizardOpen(true);
  };

  const handleDelete = (processId: string) => {
    if (confirm("¿Estás seguro de eliminar este proceso de contratación?")) {
      deleteProcessMutation.mutate(processId);
    }
  };

  const handleNewProcess = () => {
    setEditingProcess(null);
    setIsWizardOpen(true);
  };

  const handleShowCarta = (process: HiringProcess) => {
    setSelectedProcessForCarta(process);
    setShowCartaModal(true);
  };

  const getProcessesByStage = (stage: HiringStage) => {
    return processes.filter((p) => p.stage === stage && p.status === 'activo');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Cargando procesos de contratación...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold" data-testid="text-kanban-title">Procesos de Contratación</h2>
          <p className="text-muted-foreground">Gestiona el proceso de alta de nuevos empleados</p>
        </div>
        <Button onClick={handleNewProcess} data-testid="button-new-process">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Proceso
        </Button>
      </div>

      <div className="grid grid-cols-6 gap-4">
        {STAGES.map((stage) => {
          const stageProcesses = getProcessesByStage(stage.value);
          
          return (
            <div key={stage.value} className="flex flex-col gap-2">
              <div className={`p-2 rounded-md ${stage.color} min-h-[88px] flex flex-col justify-between`}>
                <div>
                  <h3 className="font-semibold text-xs" data-testid={`text-stage-${stage.value}`}>
                    {stage.label}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                    {stage.description}
                  </p>
                </div>
                <Badge variant="outline" className="mt-1 text-xs w-fit" data-testid={`badge-count-${stage.value}`}>
                  {stageProcesses.length}
                </Badge>
              </div>

              <div className="flex flex-col gap-2 min-h-[200px]">
                {stageProcesses.map((process) => (
                  <Card 
                    key={process.id} 
                    className="hover-elevate cursor-pointer"
                    data-testid={`card-process-${process.id}`}
                  >
                    <CardHeader className="p-2 space-y-1">
                      <div className="flex justify-between items-start gap-1">
                        <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                          <Badge 
                            variant="default"
                            className="text-xs w-fit"
                          >
                            {process.position}
                          </Badge>
                          <span className="text-xs text-muted-foreground line-clamp-1">
                            {process.department}
                          </span>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-5 w-5 flex-shrink-0"
                              data-testid={`button-menu-${process.id}`}
                            >
                              <MoreVertical className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(process)} data-testid={`menu-edit-${process.id}`}>
                              <Edit className="w-4 h-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            {stage.value === 'oferta' && (
                              <DropdownMenuItem 
                                onClick={() => handleShowCarta(process)}
                                data-testid={`menu-carta-oferta-${process.id}`}
                              >
                                <FileText className="w-4 h-4 mr-2" />
                                Generar Carta Oferta
                              </DropdownMenuItem>
                            )}
                            {stage.value !== 'oferta' && (
                              <DropdownMenuItem 
                                onClick={() => {
                                  const currentIndex = STAGES.findIndex(s => s.value === stage.value);
                                  if (currentIndex > 0) {
                                    handleMoveStage(process.id, STAGES[currentIndex - 1].value);
                                  }
                                }}
                                data-testid={`menu-move-back-${process.id}`}
                              >
                                Mover Atrás
                              </DropdownMenuItem>
                            )}
                            {stage.value !== 'completado' && (
                              <DropdownMenuItem 
                                onClick={() => {
                                  const currentIndex = STAGES.findIndex(s => s.value === stage.value);
                                  if (currentIndex < STAGES.length - 1) {
                                    handleMoveStage(process.id, STAGES[currentIndex + 1].value);
                                  }
                                }}
                                data-testid={`menu-move-forward-${process.id}`}
                              >
                                Mover Adelante
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem 
                              onClick={() => handleDelete(process.id)}
                              className="text-destructive"
                              data-testid={`menu-delete-${process.id}`}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <CardTitle className="text-xs line-clamp-1" data-testid={`text-process-name-${process.id}`}>
                        {process.candidateName}
                      </CardTitle>
                      <CardDescription className="text-xs line-clamp-1 flex items-center gap-1" data-testid={`text-process-salary-${process.id}`}>
                        <DollarSign className="h-3 w-3" />
                        ${parseFloat(process.proposedSalary).toLocaleString('es-MX')}
                      </CardDescription>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span data-testid={`text-process-date-${process.id}`}>
                          {process.startDate}
                        </span>
                      </div>
                      {process.contractType && (
                        <Badge variant="outline" className="text-xs mt-1" data-testid={`badge-contract-${process.id}`}>
                          {process.contractType}
                        </Badge>
                      )}
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <AltaWizard
        open={isWizardOpen}
        onOpenChange={(open) => {
          setIsWizardOpen(open);
          if (!open) {
            setEditingProcess(null);
          }
        }}
        existingProcess={editingProcess}
      />

      <Dialog open={showCartaModal} onOpenChange={setShowCartaModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle data-testid="text-carta-dialog-title">Carta Oferta de Empleo</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Genera e imprime la carta oferta para el candidato
            </p>
          </DialogHeader>
          {selectedProcessForCarta && (
            <CartaOferta process={selectedProcessForCarta} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
