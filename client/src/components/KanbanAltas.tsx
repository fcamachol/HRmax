import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, MoreVertical, Trash2, Edit, User, DollarSign, Calendar, FileText, Phone, Mail, MapPin, CreditCard, Building2, Briefcase } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { HiringProcess } from "@shared/schema";
import { hiringStageLabels } from "@shared/schema";
import { AltaWizard } from "./AltaWizard";
import { CartaOferta } from "./CartaOferta";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, useDraggable, useDroppable, rectIntersection } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

type HiringStage = 'oferta' | 'documentos' | 'contrato' | 'alta_imss' | 'onboarding' | 'completado' | 'cancelado';

const STAGES: { value: HiringStage; label: string; color: string; description: string }[] = [
  { value: 'oferta', label: '1. Carta Oferta', color: 'bg-blue-100 dark:bg-blue-900/30', description: 'Generación y envío de oferta' },
  { value: 'documentos', label: '2. Documentos', color: 'bg-purple-100 dark:bg-purple-900/30', description: 'Recopilación documental' },
  { value: 'contrato', label: '3. Contrato', color: 'bg-indigo-100 dark:bg-indigo-900/30', description: 'Firma de contrato laboral' },
  { value: 'alta_imss', label: '4. Alta IMSS', color: 'bg-cyan-100 dark:bg-cyan-900/30', description: 'Registro ante el IMSS' },
  { value: 'onboarding', label: '5. Onboarding', color: 'bg-teal-100 dark:bg-teal-900/30', description: 'Integración y capacitación' },
  { value: 'completado', label: '6. Completado', color: 'bg-green-100 dark:bg-green-900/30', description: 'Proceso finalizado' },
  { value: 'cancelado', label: '7. No Completado', color: 'bg-red-100 dark:bg-red-900/30', description: 'Proceso cancelado o no finalizado' },
];

function DraggableCard({ process, stage, onEdit, onDelete, onShowCarta, onCardClick, isDragging }: {
  process: HiringProcess;
  stage: HiringStage;
  onEdit: (process: HiringProcess) => void;
  onDelete: (id: string) => void;
  onShowCarta: (process: HiringProcess) => void;
  onCardClick: (process: HiringProcess, e: React.MouseEvent) => void;
  isDragging?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging: isDraggingLocal } = useDraggable({
    id: process.id,
    data: { stage }, // Agregar data para saber de qué stage viene
  });

  const [wasDragging, setWasDragging] = useState(false);

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging || isDraggingLocal ? 0.5 : 1,
  };

  const handleClick = (e: React.MouseEvent) => {
    // Si acabamos de arrastrar, no abrir el modal
    if (wasDragging) {
      setWasDragging(false);
      return;
    }
    onCardClick(process, e);
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="hover-elevate cursor-move"
      data-testid={`card-process-${process.id}`}
      onClick={handleClick}
      onMouseUp={() => {
        if (isDraggingLocal) {
          setWasDragging(true);
        }
      }}
      {...attributes}
      {...listeners}
    >
      <CardHeader className="p-2 space-y-1">
        <div className="flex justify-between items-start gap-1">
          <CardTitle className="text-sm font-medium line-clamp-1 flex-1" data-testid={`text-process-name-${process.id}`}>
            {process.nombre} {process.apellidoPaterno}{process.apellidoMaterno ? ' ' + process.apellidoMaterno : ''}
          </CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
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
              <DropdownMenuItem 
                onClick={(e) => { e.stopPropagation(); onEdit(process); }} 
                data-testid={`menu-edit-${process.id}`}
              >
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </DropdownMenuItem>
              {stage === 'oferta' && (
                <DropdownMenuItem
                  onClick={(e) => { e.stopPropagation(); onShowCarta(process); }}
                  data-testid={`menu-carta-oferta-${process.id}`}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Generar Carta Oferta
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={(e) => { e.stopPropagation(); onDelete(process.id); }}
                className="text-destructive"
                data-testid={`menu-delete-${process.id}`}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {process.position && (
          <Badge variant="secondary" className="text-xs w-fit mt-1">
            {process.position}
          </Badge>
        )}
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
  );
}

function DroppableColumn({ stage, stageProcesses, onEdit, onDelete, onShowCarta, onCardClick, activeId }: {
  stage: { value: HiringStage; label: string; color: string; description: string };
  stageProcesses: HiringProcess[];
  onEdit: (process: HiringProcess) => void;
  onDelete: (id: string) => void;
  onShowCarta: (process: HiringProcess) => void;
  onCardClick: (process: HiringProcess, e: React.MouseEvent) => void;
  activeId: string | null;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.value,
  });

  return (
    <div className="flex flex-col gap-2">
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

      <div 
        ref={setNodeRef} 
        className={`flex flex-col gap-2 min-h-[200px] p-2 rounded-md transition-colors ${
          isOver ? 'bg-accent/20 border-2 border-accent border-dashed' : ''
        }`}
      >
        {stageProcesses.map((process) => (
          <DraggableCard
            key={process.id}
            process={process}
            stage={stage.value}
            onEdit={onEdit}
            onDelete={onDelete}
            onShowCarta={onShowCarta}
            onCardClick={onCardClick}
            isDragging={activeId === process.id}
          />
        ))}
      </div>
    </div>
  );
}

export function KanbanAltas() {
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [editingProcess, setEditingProcess] = useState<HiringProcess | null>(null);
  const [showCartaModal, setShowCartaModal] = useState(false);
  const [selectedProcessForCarta, setSelectedProcessForCarta] = useState<HiringProcess | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedProcess, setSelectedProcess] = useState<HiringProcess | null>(null);
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

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over) {
      const processId = active.id as string;
      const newStage = over.id as HiringStage;
      
      // over.id siempre será un stage porque solo las columnas son droppables
      if (STAGES.some(s => s.value === newStage)) {
        const currentProcess = processes.find(p => p.id === processId);
        if (currentProcess && currentProcess.stage !== newStage) {
          handleMoveStage(processId, newStage);
        }
      }
    }
    
    setActiveId(null);
  };

  const handleCardClick = (process: HiringProcess, e: React.MouseEvent) => {
    // Evitar abrir detalles si se hizo click en el menú
    if ((e.target as HTMLElement).closest('button[data-testid^="button-menu"]')) {
      return;
    }
    setSelectedProcess(process);
    setShowDetailsModal(true);
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

  const activeProcess = activeId ? processes.find(p => p.id === activeId) : null;

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

      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd} collisionDetection={rectIntersection}>
        <div className="grid grid-cols-7 gap-4">
          {STAGES.map((stage) => {
            const stageProcesses = getProcessesByStage(stage.value);
            return (
              <DroppableColumn
                key={stage.value}
                stage={stage}
                stageProcesses={stageProcesses}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onShowCarta={handleShowCarta}
                onCardClick={handleCardClick}
                activeId={activeId}
              />
            );
          })}
        </div>
        <DragOverlay>
          {activeProcess ? (
            <Card className="opacity-90 shadow-xl rotate-3">
              <CardHeader className="p-2 space-y-1">
                <Badge variant="default" className="text-xs w-fit">
                  {activeProcess.position}
                </Badge>
                <CardTitle className="text-xs">
                  {activeProcess.nombre} {activeProcess.apellidoPaterno}
                </CardTitle>
              </CardHeader>
            </Card>
          ) : null}
        </DragOverlay>
      </DndContext>

      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle data-testid="text-details-dialog-title">Detalles del Proceso de Contratación</DialogTitle>
            <DialogDescription>
              Información completa del candidato y proceso
            </DialogDescription>
          </DialogHeader>
          {selectedProcess && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Datos Personales
                  </h3>
                  <div className="space-y-1 text-sm">
                    <p><strong>Nombre:</strong> {selectedProcess.nombre} {selectedProcess.apellidoPaterno} {selectedProcess.apellidoMaterno || ''}</p>
                    <p><strong>Email:</strong> {selectedProcess.email || 'N/A'}</p>
                    <p><strong>Teléfono:</strong> {selectedProcess.phone || 'N/A'}</p>
                    <p><strong>CURP:</strong> {selectedProcess.curp || 'N/A'}</p>
                    <p><strong>RFC:</strong> {selectedProcess.rfc || 'N/A'}</p>
                    <p><strong>NSS:</strong> {selectedProcess.nss || 'N/A'}</p>
                    {selectedProcess.genero && <p><strong>Género:</strong> {selectedProcess.genero === 'H' ? 'Hombre' : 'Mujer'}</p>}
                    {selectedProcess.fechaNacimiento && <p><strong>Fecha de Nacimiento:</strong> {selectedProcess.fechaNacimiento}</p>}
                    {selectedProcess.lugarNacimiento && <p><strong>Lugar de Nacimiento:</strong> {selectedProcess.lugarNacimiento}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Datos Laborales
                  </h3>
                  <div className="space-y-1 text-sm">
                    <p><strong>Puesto:</strong> {selectedProcess.position}</p>
                    <p><strong>Departamento:</strong> {selectedProcess.department}</p>
                    <p><strong>Salario:</strong> ${parseFloat(selectedProcess.proposedSalary).toLocaleString('es-MX')}</p>
                    <p><strong>Tipo de Contrato:</strong> {selectedProcess.contractType}</p>
                    {selectedProcess.contractDuration && <p><strong>Duración:</strong> {selectedProcess.contractDuration}</p>}
                    <p><strong>Fecha de Inicio:</strong> {selectedProcess.startDate}</p>
                    {selectedProcess.endDate && <p><strong>Fecha de Fin:</strong> {selectedProcess.endDate}</p>}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Domicilio
                </h3>
                <div className="text-sm">
                  <p>
                    {selectedProcess.calle && `${selectedProcess.calle} `}
                    {selectedProcess.numeroExterior && `#${selectedProcess.numeroExterior}`}
                    {selectedProcess.numeroInterior && ` Int. ${selectedProcess.numeroInterior}`}
                  </p>
                  <p>
                    {selectedProcess.colonia && `${selectedProcess.colonia}, `}
                    {selectedProcess.municipio && `${selectedProcess.municipio}, `}
                    {selectedProcess.estado}
                  </p>
                  {selectedProcess.codigoPostal && <p>C.P. {selectedProcess.codigoPostal}</p>}
                </div>
              </div>

              {(selectedProcess.contactoEmergencia || selectedProcess.banco) && (
                <div className="grid grid-cols-2 gap-4">
                  {selectedProcess.contactoEmergencia && (
                    <div className="space-y-2">
                      <h3 className="font-semibold flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Contacto de Emergencia
                      </h3>
                      <div className="space-y-1 text-sm">
                        <p><strong>Nombre:</strong> {selectedProcess.contactoEmergencia}</p>
                        <p><strong>Parentesco:</strong> {selectedProcess.parentescoEmergencia || 'N/A'}</p>
                        <p><strong>Teléfono:</strong> {selectedProcess.telefonoEmergencia || 'N/A'}</p>
                      </div>
                    </div>
                  )}

                  {selectedProcess.banco && (
                    <div className="space-y-2">
                      <h3 className="font-semibold flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Datos Bancarios
                      </h3>
                      <div className="space-y-1 text-sm">
                        <p><strong>Banco:</strong> {selectedProcess.banco}</p>
                        <p><strong>CLABE:</strong> {selectedProcess.clabe || 'N/A'}</p>
                        <p><strong>Forma de Pago:</strong> {selectedProcess.formaPago || 'N/A'}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowDetailsModal(false)}>
                  Cerrar
                </Button>
                <Button onClick={() => {
                  setShowDetailsModal(false);
                  handleEdit(selectedProcess);
                }}>
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
            <DialogDescription>
              Genera e imprime la carta oferta para el candidato
            </DialogDescription>
          </DialogHeader>
          {selectedProcessForCarta && (
            <CartaOferta process={selectedProcessForCarta} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
