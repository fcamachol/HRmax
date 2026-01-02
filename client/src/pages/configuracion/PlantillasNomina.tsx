import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Plus,
  Pencil,
  Trash2,
  FileText,
  DollarSign,
  Gift,
  AlertCircle,
  Check,
  X,
  Star,
  StarOff,
  Building2,
  Heart,
  Trophy,
  Sparkles,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { 
  PlantillaNomina, 
  PlantillaNominaWithConceptos,
  PlantillaConcepto,
  ConceptoMedioPago,
  Empresa,
  Cliente
} from "@shared/schema";

const formatCurrency = (value: number | string | null) => {
  const numValue = typeof value === "string" ? parseFloat(value) : value;
  if (numValue === null || numValue === undefined || isNaN(numValue)) return "-";
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(numValue);
};

const nivelConfig = {
  sat: { 
    label: "SAT - Catálogo Oficial", 
    icon: Building2, 
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950/50"
  },
  prevision_social: { 
    label: "Previsión Social", 
    icon: Heart, 
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/50"
  },
  bonos: { 
    label: "Bonos e Incentivos", 
    icon: Trophy, 
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-50 dark:bg-amber-950/50"
  },
  adicional: { 
    label: "Conceptos Adicionales", 
    icon: Sparkles, 
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-50 dark:bg-purple-950/50"
  },
} as const;

type NivelKey = keyof typeof nivelConfig;

export default function PlantillasNomina() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isConceptoDialogOpen, setIsConceptoDialogOpen] = useState(false);
  const [editingPlantilla, setEditingPlantilla] = useState<PlantillaNominaWithConceptos | null>(null);
  const [selectedPlantillaId, setSelectedPlantillaId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    activo: true,
    clienteId: "",
    empresaId: "",
  });

  const [conceptoFormData, setConceptoFormData] = useState({
    conceptoId: "",
    canal: "nomina" as "nomina" | "exento",
    valorDefault: "",
    esObligatorio: false,
    orden: 0,
  });

  const { data: clientes = [] } = useQuery<Cliente[]>({
    queryKey: ["/api/clientes"],
  });

  const { data: empresas = [] } = useQuery<Empresa[]>({
    queryKey: ["/api/empresas"],
  });

  useEffect(() => {
    if (clientes.length > 0 && !formData.clienteId) {
      setFormData(prev => ({ ...prev, clienteId: clientes[0].id }));
    }
  }, [clientes, formData.clienteId]);

  useEffect(() => {
    if (empresas.length > 0 && !formData.empresaId) {
      setFormData(prev => ({ ...prev, empresaId: empresas[0].id }));
    }
  }, [empresas, formData.empresaId]);

  const { data: plantillas = [], isLoading } = useQuery<PlantillaNomina[]>({
    queryKey: ["/api/plantillas-nomina"],
  });

  const { data: conceptosDisponibles = [] } = useQuery<ConceptoMedioPago[]>({
    queryKey: ["/api/conceptos-medio-pago"],
  });

  const { data: selectedPlantillaData } = useQuery<PlantillaNominaWithConceptos>({
    queryKey: ["/api/plantillas-nomina", selectedPlantillaId],
    enabled: !!selectedPlantillaId,
  });

  // Query to get the current empresa's default plantilla
  const { data: empresaData } = useQuery<Empresa>({
    queryKey: ["/api/empresas", formData.empresaId],
    enabled: !!formData.empresaId,
  });

  const defaultPlantillaId = empresaData?.defaultPlantillaNominaId;

  // Mutation to set default plantilla
  const setDefaultPlantillaMutation = useMutation({
    mutationFn: async ({ empresaId, plantillaId }: { empresaId: string; plantillaId: string | null }) => {
      return await apiRequest("PUT", `/api/empresas/${empresaId}/plantilla-default`, { plantillaId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/empresas"] });
      queryClient.invalidateQueries({ queryKey: ["/api/empresas", formData.empresaId] });
      toast({
        title: "Plantilla predeterminada actualizada",
        description: "La plantilla se ha establecido como predeterminada para esta empresa.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo establecer la plantilla predeterminada",
        variant: "destructive",
      });
    },
  });

  const createPlantillaMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiRequest("POST", "/api/plantillas-nomina", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/plantillas-nomina"] });
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: "Plantilla creada",
        description: "La plantilla de nómina se ha creado correctamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear la plantilla",
        variant: "destructive",
      });
    },
  });

  const updatePlantillaMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof formData> }) => {
      return await apiRequest("PATCH", `/api/plantillas-nomina/${id}`, data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/plantillas-nomina"] });
      queryClient.invalidateQueries({ queryKey: ["/api/plantillas-nomina", variables.id] });
      setIsDialogOpen(false);
      setEditingPlantilla(null);
      resetForm();
      toast({
        title: "Plantilla actualizada",
        description: "La plantilla de nómina se ha actualizado correctamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar la plantilla",
        variant: "destructive",
      });
    },
  });

  const deletePlantillaMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/plantillas-nomina/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/plantillas-nomina"] });
      if (selectedPlantillaId) {
        setSelectedPlantillaId(null);
      }
      toast({
        title: "Plantilla eliminada",
        description: "La plantilla de nómina se ha eliminado correctamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar la plantilla",
        variant: "destructive",
      });
    },
  });

  const addConceptoMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/plantilla-conceptos", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/plantillas-nomina", selectedPlantillaId] });
      setIsConceptoDialogOpen(false);
      resetConceptoForm();
      toast({
        title: "Concepto agregado",
        description: "El concepto se ha agregado a la plantilla.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo agregar el concepto",
        variant: "destructive",
      });
    },
  });

  const removeConceptoMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/plantilla-conceptos/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/plantillas-nomina", selectedPlantillaId] });
      toast({
        title: "Concepto eliminado",
        description: "El concepto se ha eliminado de la plantilla.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el concepto",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      nombre: "",
      descripcion: "",
      activo: true,
      clienteId: clientes.length > 0 ? clientes[0].id : "",
      empresaId: empresas.length > 0 ? empresas[0].id : "",
    });
  };

  const resetConceptoForm = () => {
    setConceptoFormData({
      conceptoId: "",
      canal: "nomina",
      valorDefault: "",
      esObligatorio: false,
      orden: 0,
    });
  };

  const handleEdit = (plantilla: PlantillaNomina) => {
    setFormData({
      nombre: plantilla.nombre,
      descripcion: plantilla.descripcion || "",
      activo: plantilla.activo,
      clienteId: plantilla.clienteId,
      empresaId: plantilla.empresaId,
    });
    setEditingPlantilla(plantilla as PlantillaNominaWithConceptos);
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.nombre.trim()) {
      toast({
        title: "Error",
        description: "El nombre de la plantilla es requerido",
        variant: "destructive",
      });
      return;
    }

    if (!formData.clienteId || !formData.empresaId) {
      toast({
        title: "Error",
        description: "Esperando datos de cliente y empresa...",
        variant: "destructive",
      });
      return;
    }

    if (editingPlantilla) {
      updatePlantillaMutation.mutate({ id: editingPlantilla.id, data: formData });
    } else {
      createPlantillaMutation.mutate(formData);
    }
  };

  const handleAddConcepto = () => {
    if (!conceptoFormData.conceptoId) {
      toast({
        title: "Error",
        description: "Selecciona un concepto",
        variant: "destructive",
      });
      return;
    }

    if (!selectedPlantillaData || !selectedPlantillaData.clienteId || !selectedPlantillaData.empresaId) {
      toast({
        title: "Error",
        description: "Cargando datos de la plantilla, espera un momento...",
        variant: "destructive",
      });
      return;
    }

    addConceptoMutation.mutate({
      plantillaId: selectedPlantillaId,
      conceptoId: conceptoFormData.conceptoId,
      canal: conceptoFormData.canal,
      valorDefault: conceptoFormData.valorDefault ? parseFloat(conceptoFormData.valorDefault) : null,
      esObligatorio: conceptoFormData.esObligatorio,
      orden: conceptoFormData.orden,
      clienteId: selectedPlantillaData.clienteId,
      empresaId: selectedPlantillaData.empresaId,
    });
  };

  const conceptosNomina = selectedPlantillaData?.conceptos?.filter(c => c.canal === "nomina") || [];
  const conceptosExentos = selectedPlantillaData?.conceptos?.filter(c => c.canal === "exento") || [];

  const conceptosYaAgregados = selectedPlantillaData?.conceptos?.map(c => c.conceptoId) || [];
  const conceptosDisponiblesParaAgregar = conceptosDisponibles.filter(
    c => !conceptosYaAgregados.includes(c.id)
  );

  const conceptosAgrupadosPorNivel = (["sat", "prevision_social", "bonos", "adicional"] as NivelKey[]).reduce((acc, nivel) => {
    const conceptosDelNivel = conceptosDisponiblesParaAgregar.filter(
      c => (c.nivel || "adicional") === nivel
    );
    if (conceptosDelNivel.length > 0) {
      acc[nivel] = conceptosDelNivel;
    }
    return acc;
  }, {} as Record<NivelKey, ConceptoMedioPago[]>);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Plantillas de Nómina</h1>
          <p className="text-muted-foreground">
            Configura plantillas con conceptos predefinidos para diferentes tipos de empleados
          </p>
        </div>
        <Button 
          onClick={() => {
            resetForm();
            setEditingPlantilla(null);
            setIsDialogOpen(true);
          }} 
          disabled={clientes.length === 0 || empresas.length === 0}
          data-testid="button-new-plantilla"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nueva Plantilla
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Plantillas</CardTitle>
            <CardDescription>Selecciona una plantilla para ver sus conceptos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoading ? (
              <div className="text-center py-4 text-muted-foreground">Cargando...</div>
            ) : plantillas.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No hay plantillas configuradas</p>
                <p className="text-sm">Crea tu primera plantilla para comenzar</p>
              </div>
            ) : (
              plantillas.map((plantilla) => {
                const isDefault = defaultPlantillaId === plantilla.id;
                return (
                  <div
                    key={plantilla.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedPlantillaId === plantilla.id
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted/50"
                    } ${isDefault ? "ring-2 ring-yellow-500/50" : ""}`}
                    onClick={() => setSelectedPlantillaId(plantilla.id)}
                    data-testid={`card-plantilla-${plantilla.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{plantilla.nombre}</span>
                          {isDefault && (
                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          )}
                        </div>
                        {plantilla.descripcion && (
                          <div className="text-sm text-muted-foreground line-clamp-1">
                            {plantilla.descripcion}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDefaultPlantillaMutation.mutate({
                              empresaId: plantilla.empresaId,
                              plantillaId: isDefault ? null : plantilla.id,
                            });
                          }}
                          title={isDefault ? "Quitar como predeterminada" : "Establecer como predeterminada"}
                          data-testid={`button-set-default-${plantilla.id}`}
                        >
                          {isDefault ? (
                            <StarOff className="h-4 w-4 text-yellow-500" />
                          ) : (
                            <Star className="h-4 w-4 text-muted-foreground hover:text-yellow-500" />
                          )}
                        </Button>
                        <Badge variant={plantilla.activo ? "default" : "secondary"}>
                          {plantilla.activo ? "Activa" : "Inactiva"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">
                  {selectedPlantillaData?.nombre || "Selecciona una plantilla"}
                </CardTitle>
                <CardDescription>
                  {selectedPlantillaData?.descripcion || "Los conceptos se muestran aquí"}
                </CardDescription>
              </div>
              {selectedPlantillaData && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(selectedPlantillaData)}
                    data-testid="button-edit-plantilla"
                  >
                    <Pencil className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deletePlantillaMutation.mutate(selectedPlantillaData.id)}
                    data-testid="button-delete-plantilla"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Eliminar
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      resetConceptoForm();
                      setIsConceptoDialogOpen(true);
                    }}
                    data-testid="button-add-concepto"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Agregar Concepto
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!selectedPlantillaData ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p>Selecciona una plantilla de la lista para ver sus conceptos</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <Card className="border-primary/20 bg-primary/5">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="h-5 w-5 text-primary" />
                        <span className="font-semibold">Canal Nómina</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Conceptos gravables que integran al SBC (Salario Base de Cotización)
                      </p>
                      <div className="text-2xl font-bold text-primary mt-2">
                        {conceptosNomina.length} conceptos
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-green-500/20 bg-green-500/5">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Gift className="h-5 w-5 text-green-600 dark:text-green-400" />
                        <span className="font-semibold">Canal Exento</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Conceptos exentos que NO integran al SBC (sindicato, vales, etc.)
                      </p>
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400 mt-2">
                        {conceptosExentos.length} conceptos
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Accordion type="multiple" defaultValue={["nomina", "exento"]} className="space-y-2">
                  <AccordionItem value="nomina" className="border rounded-lg">
                    <AccordionTrigger className="px-4 hover:no-underline">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-primary" />
                        <span>Conceptos de Nómina (Integran SBC)</span>
                        <Badge variant="outline" className="ml-2">{conceptosNomina.length}</Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      {conceptosNomina.length === 0 ? (
                        <div className="text-center py-4 text-muted-foreground">
                          No hay conceptos de nómina configurados
                        </div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Concepto</TableHead>
                              <TableHead>Tipo</TableHead>
                              <TableHead>Fórmula</TableHead>
                              <TableHead>Valor Default</TableHead>
                              <TableHead>Obligatorio</TableHead>
                              <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {conceptosNomina.map((pc) => (
                              <TableRow key={pc.id}>
                                <TableCell className="font-medium">{pc.concepto.nombre}</TableCell>
                                <TableCell>
                                  <Badge variant={pc.concepto.tipo === "percepcion" ? "default" : "destructive"}>
                                    {pc.concepto.tipo === "percepcion" ? "Percepción" : "Deducción"}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <code className="text-xs bg-muted px-2 py-1 rounded">
                                    {pc.concepto.formula || "-"}
                                  </code>
                                </TableCell>
                                <TableCell className="font-mono">
                                  {pc.valorDefault ? formatCurrency(pc.valorDefault) : "-"}
                                </TableCell>
                                <TableCell>
                                  {pc.esObligatorio ? (
                                    <Check className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <X className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeConceptoMutation.mutate(pc.id)}
                                    data-testid={`button-remove-concepto-${pc.id}`}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="exento" className="border rounded-lg">
                    <AccordionTrigger className="px-4 hover:no-underline">
                      <div className="flex items-center gap-2">
                        <Gift className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <span>Conceptos Exentos (No integran SBC)</span>
                        <Badge variant="outline" className="ml-2">{conceptosExentos.length}</Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      {conceptosExentos.length === 0 ? (
                        <div className="text-center py-4 text-muted-foreground">
                          No hay conceptos exentos configurados
                        </div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Concepto</TableHead>
                              <TableHead>Tipo</TableHead>
                              <TableHead>Fórmula</TableHead>
                              <TableHead>Valor Default</TableHead>
                              <TableHead>Obligatorio</TableHead>
                              <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {conceptosExentos.map((pc) => (
                              <TableRow key={pc.id}>
                                <TableCell className="font-medium">{pc.concepto.nombre}</TableCell>
                                <TableCell>
                                  <Badge variant={pc.concepto.tipo === "percepcion" ? "default" : "destructive"}>
                                    {pc.concepto.tipo === "percepcion" ? "Percepción" : "Deducción"}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <code className="text-xs bg-muted px-2 py-1 rounded">
                                    {pc.concepto.formula || "-"}
                                  </code>
                                </TableCell>
                                <TableCell className="font-mono">
                                  {pc.valorDefault ? formatCurrency(pc.valorDefault) : "-"}
                                </TableCell>
                                <TableCell>
                                  {pc.esObligatorio ? (
                                    <Check className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <X className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeConceptoMutation.mutate(pc.id)}
                                    data-testid={`button-remove-concepto-exento-${pc.id}`}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                <Card className="border-orange-500/20 bg-orange-500/5">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5" />
                      <div>
                        <div className="font-semibold text-orange-600 dark:text-orange-400">
                          Impacto en Cálculos
                        </div>
                        <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                          <li>
                            <strong>SBC (Salario Base de Cotización):</strong> Solo conceptos del canal "Nómina"
                          </li>
                          <li>
                            <strong>Salario Diario Real:</strong> Suma de conceptos Nómina + Exentos
                          </li>
                          <li>
                            <strong>Horas Extra / Vacaciones / Bonos:</strong> Se calculan sobre el Salario Diario Real
                          </li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingPlantilla ? "Editar Plantilla" : "Nueva Plantilla de Nómina"}
            </DialogTitle>
            <DialogDescription>
              {editingPlantilla
                ? "Modifica los datos de la plantilla"
                : "Crea una nueva plantilla para agrupar conceptos de nómina"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre de la Plantilla</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Ej: Operativos, Administrativos, Ejecutivos"
                data-testid="input-plantilla-nombre"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Descripción opcional de la plantilla"
                rows={3}
                data-testid="input-plantilla-descripcion"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="activo">Plantilla Activa</Label>
              <Switch
                id="activo"
                checked={formData.activo}
                onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
                data-testid="switch-plantilla-activo"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={createPlantillaMutation.isPending || updatePlantillaMutation.isPending}
              data-testid="button-save-plantilla"
            >
              {editingPlantilla ? "Guardar Cambios" : "Crear Plantilla"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isConceptoDialogOpen} onOpenChange={setIsConceptoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Concepto a Plantilla</DialogTitle>
            <DialogDescription>
              Selecciona un concepto y configura cómo se aplicará en esta plantilla
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="concepto">Concepto del Catálogo</Label>
              <Select
                value={conceptoFormData.conceptoId}
                onValueChange={(value) => setConceptoFormData({ ...conceptoFormData, conceptoId: value })}
              >
                <SelectTrigger data-testid="select-concepto">
                  <SelectValue placeholder="Selecciona un concepto del catálogo" />
                </SelectTrigger>
                <SelectContent className="max-h-[400px]">
                  {Object.entries(conceptosAgrupadosPorNivel).map(([nivel, conceptos]) => {
                    const config = nivelConfig[nivel as NivelKey];
                    const IconComponent = config.icon;
                    return (
                      <SelectGroup key={nivel}>
                        <SelectLabel className={`flex items-center gap-2 ${config.color} font-semibold`}>
                          <IconComponent className="h-4 w-4" />
                          {config.label}
                        </SelectLabel>
                        {conceptos.map((concepto) => (
                          <SelectItem key={concepto.id} value={concepto.id}>
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant={concepto.tipo === "percepcion" ? "default" : "destructive"} 
                                className="text-xs"
                              >
                                {concepto.tipo === "percepcion" ? "P" : "D"}
                              </Badge>
                              <span>{concepto.nombre}</span>
                              {concepto.satClave && (
                                <span className="text-xs text-muted-foreground">
                                  ({concepto.satClave})
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    );
                  })}
                  {Object.keys(conceptosAgrupadosPorNivel).length === 0 && (
                    <div className="py-4 text-center text-muted-foreground text-sm">
                      Todos los conceptos ya están agregados a esta plantilla
                    </div>
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Los conceptos provienen del Catálogo de Conceptos unificado
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="canal">Canal de Pago</Label>
              <Select
                value={conceptoFormData.canal}
                onValueChange={(value: "nomina" | "exento") => 
                  setConceptoFormData({ ...conceptoFormData, canal: value })
                }
              >
                <SelectTrigger data-testid="select-canal">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nomina">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-primary" />
                      <span>Nómina (Integra SBC)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="exento">
                    <div className="flex items-center gap-2">
                      <Gift className="h-4 w-4 text-green-600" />
                      <span>Exento (No integra SBC)</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {conceptoFormData.canal === "nomina" 
                  ? "Los conceptos de nómina se usan para calcular el SBC (cuotas IMSS)"
                  : "Los conceptos exentos no integran al SBC pero sí al salario real"}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="valorDefault">Valor Predeterminado (opcional)</Label>
              <Input
                id="valorDefault"
                type="number"
                step="0.01"
                value={conceptoFormData.valorDefault}
                onChange={(e) => setConceptoFormData({ ...conceptoFormData, valorDefault: e.target.value })}
                placeholder="0.00"
                data-testid="input-valor-default"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="esObligatorio">Concepto Obligatorio</Label>
                <p className="text-xs text-muted-foreground">
                  Los conceptos obligatorios siempre se incluyen en la nómina
                </p>
              </div>
              <Switch
                id="esObligatorio"
                checked={conceptoFormData.esObligatorio}
                onCheckedChange={(checked) => 
                  setConceptoFormData({ ...conceptoFormData, esObligatorio: checked })
                }
                data-testid="switch-obligatorio"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConceptoDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleAddConcepto}
              disabled={addConceptoMutation.isPending}
              data-testid="button-add-concepto-confirm"
            >
              Agregar Concepto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
