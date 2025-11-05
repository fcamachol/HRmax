import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, MoreVertical, Trash2, Edit, Upload, FileCheck } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ObjectUploader } from "@/components/ObjectUploader";
import type { Lawsuit, LegalCase } from "@shared/schema";

type LawsuitStage = 'conciliacion' | 'contestacion' | 'desahogo' | 'alegatos' | 'sentencia' | 'cerrado';

const STAGES: { value: LawsuitStage; label: string; color: string }[] = [
  { value: 'conciliacion', label: 'Conciliación', color: 'bg-blue-500' },
  { value: 'contestacion', label: 'Contestación', color: 'bg-purple-500' },
  { value: 'desahogo', label: 'Desahogo', color: 'bg-yellow-500' },
  { value: 'alegatos', label: 'Alegatos', color: 'bg-orange-500' },
  { value: 'sentencia', label: 'Sentencia', color: 'bg-red-500' },
  { value: 'cerrado', label: 'Cerrado', color: 'bg-gray-500' },
];

export function KanbanDemandas() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLawsuit, setEditingLawsuit] = useState<Lawsuit | null>(null);
  const [extractedData, setExtractedData] = useState<{
    title: string;
    employeeName: string;
    description: string;
    documentUrl: string;
  } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  const { data: lawsuits = [], isLoading } = useQuery<Lawsuit[]>({
    queryKey: ['/api/legal/lawsuits'],
  });

  const { data: legalCases = [] } = useQuery<LegalCase[]>({
    queryKey: ['/api/legal/cases'],
  });

  const createLawsuitMutation = useMutation({
    mutationFn: async (data: Partial<Lawsuit>) => {
      return await apiRequest("POST", "/api/legal/lawsuits", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/legal/lawsuits'] });
      setIsDialogOpen(false);
      toast({
        title: "Demanda creada",
        description: "La demanda ha sido creada exitosamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al crear demanda",
        variant: "destructive",
      });
    },
  });

  const updateLawsuitMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Lawsuit> }) => {
      return await apiRequest("PATCH", `/api/legal/lawsuits/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/legal/lawsuits'] });
      setEditingLawsuit(null);
      setIsDialogOpen(false);
      toast({
        title: "Demanda actualizada",
        description: "La demanda ha sido actualizada exitosamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al actualizar demanda",
        variant: "destructive",
      });
    },
  });

  const deleteLawsuitMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/legal/lawsuits/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/legal/lawsuits'] });
      toast({
        title: "Demanda eliminada",
        description: "La demanda ha sido eliminada exitosamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al eliminar demanda",
        variant: "destructive",
      });
    },
  });

  const handleGetUploadUrl = async () => {
    const response = await apiRequest("POST", "/api/objects/upload");
    return {
      method: "PUT" as const,
      url: response.uploadURL,
    };
  };

  const handleDocumentUploadComplete = async (result: { uploadURL: string }) => {
    if (!result.uploadURL) {
      toast({
        title: "Error",
        description: "No se pudo obtener la URL del documento",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const analysisResult = await apiRequest("POST", "/api/legal/lawsuits/analyze-document", {
        documentUrl: result.uploadURL,
      });

      setExtractedData(analysisResult);
      toast({
        title: "Documento analizado",
        description: "Se ha extraído la información automáticamente del documento",
      });
    } catch (error: any) {
      toast({
        title: "Error al analizar",
        description: error.message || "No se pudo analizar el documento",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data = {
      title: formData.get('title') as string,
      employeeName: formData.get('employeeName') as string,
      legalCaseId: formData.get('legalCaseId') as string || null,
      stage: (formData.get('stage') as LawsuitStage) || 'conciliacion',
      description: formData.get('description') as string || '',
      documentUrl: extractedData?.documentUrl || editingLawsuit?.documentUrl || null,
    };

    if (editingLawsuit) {
      updateLawsuitMutation.mutate({ id: editingLawsuit.id, data });
    } else {
      createLawsuitMutation.mutate(data);
    }
  };

  const handleMoveStage = (lawsuitId: string, newStage: LawsuitStage) => {
    updateLawsuitMutation.mutate({
      id: lawsuitId,
      data: { stage: newStage },
    });
  };

  const handleEdit = (lawsuit: Lawsuit) => {
    setEditingLawsuit(lawsuit);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar esta demanda?')) {
      deleteLawsuitMutation.mutate(id);
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingLawsuit(null);
    setExtractedData(null);
  };

  const getLawsuitsByStage = (stage: LawsuitStage) => {
    return lawsuits.filter(lawsuit => lawsuit.stage === stage);
  };

  const getNextStage = (currentStage: LawsuitStage): LawsuitStage | null => {
    const currentIndex = STAGES.findIndex(s => s.value === currentStage);
    if (currentIndex < STAGES.length - 1) {
      return STAGES[currentIndex + 1].value as LawsuitStage;
    }
    return null;
  };

  const getPreviousStage = (currentStage: LawsuitStage): LawsuitStage | null => {
    const currentIndex = STAGES.findIndex(s => s.value === currentStage);
    if (currentIndex > 0) {
      return STAGES[currentIndex - 1].value as LawsuitStage;
    }
    return null;
  };

  if (isLoading) {
    return <div className="p-6">Cargando demandas...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Demandas Laborales</h2>
          <p className="text-muted-foreground">
            Gestión del flujo de demandas desde conciliación hasta cierre
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingLawsuit(null)} data-testid="button-nueva-demanda">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Demanda
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingLawsuit ? 'Editar Demanda' : 'Nueva Demanda'}
              </DialogTitle>
              <DialogDescription>
                {editingLawsuit 
                  ? 'Actualiza la información de la demanda' 
                  : 'Registra una nueva demanda laboral. Puedes subir un documento escaneado para extraer información automáticamente.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!editingLawsuit && (
                <div className="space-y-2">
                  <Label>Subir Documento (Opcional)</Label>
                  <div className="flex items-center gap-2">
                    <ObjectUploader
                      maxNumberOfFiles={1}
                      maxFileSize={10485760}
                      onGetUploadParameters={handleGetUploadUrl}
                      onComplete={handleDocumentUploadComplete}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {extractedData ? 'Cambiar Documento' : 'Subir Documento'}
                    </ObjectUploader>
                    {extractedData && (
                      <Badge variant="secondary" className="gap-1">
                        <FileCheck className="h-3 w-3" />
                        Documento analizado
                      </Badge>
                    )}
                    {isAnalyzing && (
                      <Badge variant="secondary">
                        Analizando...
                      </Badge>
                    )}
                  </div>
                  {extractedData && (
                    <p className="text-sm text-muted-foreground">
                      Se han prellenado los campos con la información extraída del documento
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  name="title"
                  key={extractedData?.title || editingLawsuit?.title}
                  defaultValue={extractedData?.title || editingLawsuit?.title}
                  placeholder="Ej: Demanda por despido injustificado"
                  required
                  data-testid="input-title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="employeeName">Nombre del Empleado *</Label>
                <Input
                  id="employeeName"
                  name="employeeName"
                  key={extractedData?.employeeName || editingLawsuit?.employeeName}
                  defaultValue={extractedData?.employeeName || editingLawsuit?.employeeName}
                  placeholder="Ej: Juan Pérez"
                  required
                  data-testid="input-employee-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="legalCaseId">Caso Legal (Opcional)</Label>
                <Select name="legalCaseId" defaultValue={editingLawsuit?.legalCaseId || 'none'}>
                  <SelectTrigger id="legalCaseId" data-testid="select-legal-case">
                    <SelectValue placeholder="Seleccionar caso legal..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin caso legal asociado</SelectItem>
                    {legalCases.map((legalCase) => (
                      <SelectItem key={legalCase.id} value={legalCase.id}>
                        {legalCase.caseType}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="stage">Etapa *</Label>
                <Select name="stage" defaultValue={editingLawsuit?.stage || 'conciliacion'}>
                  <SelectTrigger id="stage" data-testid="select-stage">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STAGES.map((stage) => (
                      <SelectItem key={stage.value} value={stage.value}>
                        {stage.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  name="description"
                  key={extractedData?.description || editingLawsuit?.description}
                  defaultValue={extractedData?.description || editingLawsuit?.description || ''}
                  placeholder="Detalles de la demanda..."
                  rows={4}
                  data-testid="textarea-description"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={createLawsuitMutation.isPending || updateLawsuitMutation.isPending}
                  data-testid="button-submit-demanda"
                >
                  {editingLawsuit ? 'Actualizar' : 'Crear'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {STAGES.map((stage) => {
          const stageLawsuits = getLawsuitsByStage(stage.value);
          
          return (
            <div key={stage.value} className="space-y-3">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${stage.color}`} />
                <h3 className="font-semibold text-sm">{stage.label}</h3>
                <Badge variant="secondary" className="ml-auto">
                  {stageLawsuits.length}
                </Badge>
              </div>

              <div className="space-y-2 min-h-[200px]">
                {stageLawsuits.map((lawsuit) => (
                  <Card key={lawsuit.id} className="hover-elevate" data-testid={`card-lawsuit-${lawsuit.id}`}>
                    <CardHeader className="p-3 pb-2 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-sm font-medium line-clamp-2">
                          {lawsuit.title}
                        </CardTitle>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-6 w-6"
                              data-testid={`button-menu-${lawsuit.id}`}
                            >
                              <MoreVertical className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(lawsuit)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(lawsuit.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <CardDescription className="text-xs">
                        {lawsuit.employeeName}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-3 pt-0 space-y-2">
                      {lawsuit.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {lawsuit.description}
                        </p>
                      )}
                      
                      <div className="flex gap-1 flex-wrap">
                        {getPreviousStage(lawsuit.stage as LawsuitStage) && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMoveStage(lawsuit.id, getPreviousStage(lawsuit.stage as LawsuitStage)!)}
                            className="h-6 text-xs"
                            data-testid={`button-prev-${lawsuit.id}`}
                          >
                            ← Atrás
                          </Button>
                        )}
                        {getNextStage(lawsuit.stage as LawsuitStage) && (
                          <Button
                            size="sm"
                            onClick={() => handleMoveStage(lawsuit.id, getNextStage(lawsuit.stage as LawsuitStage)!)}
                            className="h-6 text-xs"
                            data-testid={`button-next-${lawsuit.id}`}
                          >
                            Siguiente →
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {stageLawsuits.length === 0 && (
                  <div className="text-center text-sm text-muted-foreground py-8">
                    Sin demandas
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
