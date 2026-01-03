import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Plus,
  Pencil,
  Trash2,
  Calculator,
  HelpCircle,
  Search,
  DollarSign,
  Minus,
  Check,
  X,
  Copy,
  Code,
  Scale,
  Building2,
  AlertTriangle,
  Lock,
  Shield,
  Sparkles,
  CreditCard,
  Trophy,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { ConceptoMedioPago, Cliente, Empresa, CategoriaConcepto, MedioPago } from "@shared/schema";
import { categoriasConcepto } from "@shared/schema";

interface FormulaVariable {
  variable: string;
  descripcion: string;
  ejemplo: string;
}

interface CatalogoAgrupado {
  sat: ConceptoMedioPago[];
  previsionSocial: ConceptoMedioPago[];
  bonos: ConceptoMedioPago[];
  adicional: ConceptoMedioPago[];
}

const CATEGORIA_LABELS: Record<CategoriaConcepto, string> = {
  salario: "Salario",
  prevision_social: "Previsión Social",
  vales: "Vales",
  plan_privado_pensiones: "Plan Privado de Pensiones",
  sindicato: "Sindicato",
  horas_extra: "Horas Extra",
  prestaciones_ley: "Prestaciones de Ley",
  bonos_incentivos: "Bonos e Incentivos",
  descuentos: "Descuentos",
  impuestos: "Impuestos",
  otros: "Otros",
};

export default function ConceptosNomina() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [editingConcepto, setEditingConcepto] = useState<ConceptoMedioPago | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"todos" | "percepcion" | "deduccion">("todos");
  const [filterCategoria, setFilterCategoria] = useState<CategoriaConcepto | "todos">("todos");
  const [customCategoria, setCustomCategoria] = useState("");
  const [showCustomCategoria, setShowCustomCategoria] = useState(false);
  
  const [formData, setFormData] = useState({
    nombre: "",
    tipo: "percepcion" as "percepcion" | "deduccion",
    categoria: "otros" as CategoriaConcepto | string,
    formula: "",
    limiteExento: "",
    gravableISR: true,
    integraSBC: false,
    limiteAnual: "",
    clienteId: "",
    empresaId: "",
    activo: true,
    nivel: "adicional" as "sat" | "prevision_social" | "bonos" | "adicional",
    medioPagoId: "none" as string,
  });

  const { data: clientes = [] } = useQuery<Cliente[]>({
    queryKey: ["/api/clientes"],
  });

  const { data: empresas = [] } = useQuery<Empresa[]>({
    queryKey: ["/api/empresas"],
  });

  const { data: catalogo, isLoading } = useQuery<CatalogoAgrupado>({
    queryKey: ["/api/catalogo-conceptos"],
  });

  const conceptosSat = catalogo?.sat || [];
  const conceptosPrevision = catalogo?.previsionSocial || [];
  const conceptosBonos = catalogo?.bonos || [];
  const conceptosAdicional = catalogo?.adicional || [];

  const { data: variables = [] } = useQuery<FormulaVariable[]>({
    queryKey: ["/api/formula-variables"],
  });

  const { data: mediosPago = [] } = useQuery<MedioPago[]>({
    queryKey: ["/api/medios-pago"],
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

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("POST", "/api/conceptos-medio-pago", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/catalogo-conceptos"] });
      toast({ title: "Concepto creado correctamente" });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: "Error al crear concepto", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof formData> }) => {
      const response = await apiRequest("PATCH", `/api/conceptos-medio-pago/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/catalogo-conceptos"] });
      toast({ title: "Concepto actualizado correctamente" });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: "Error al actualizar concepto", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/conceptos-medio-pago/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/catalogo-conceptos"] });
      toast({ title: "Concepto eliminado correctamente" });
    },
    onError: (error: Error) => {
      toast({ title: "Error al eliminar concepto", description: error.message, variant: "destructive" });
    },
  });

  const toggleSalarioBaseMutation = useMutation({
    mutationFn: async ({ id, integraSalarioBase }: { id: string; integraSalarioBase: boolean }) => {
      const response = await apiRequest("PATCH", `/api/conceptos-medio-pago/${id}`, { integraSalarioBase });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/catalogo-conceptos"] });
      toast({ title: "Configuración actualizada" });
    },
    onError: (error: Error) => {
      toast({ title: "Error al actualizar", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      nombre: "",
      tipo: "percepcion",
      categoria: "otros",
      formula: "",
      limiteExento: "",
      gravableISR: true,
      integraSBC: false,
      limiteAnual: "",
      clienteId: clientes[0]?.id || "",
      empresaId: empresas[0]?.id || "",
      activo: true,
      nivel: "adicional",
      medioPagoId: "none",
    });
    setEditingConcepto(null);
    setShowCustomCategoria(false);
    setCustomCategoria("");
  };

  const handleEdit = (concepto: ConceptoMedioPago) => {
    setEditingConcepto(concepto);
    const categoria = concepto.categoria || "otros";
    const isCustomCategoria = !categoriasConcepto.includes(categoria as CategoriaConcepto);
    
    setFormData({
      nombre: concepto.nombre,
      tipo: concepto.tipo as "percepcion" | "deduccion",
      categoria: isCustomCategoria ? "otros" : categoria,
      formula: concepto.formula || "",
      limiteExento: concepto.limiteExento || "",
      gravableISR: concepto.gravableISR ?? true,
      integraSBC: concepto.integraSBC ?? false,
      limiteAnual: concepto.limiteAnual || "",
      clienteId: concepto.clienteId,
      empresaId: concepto.empresaId,
      activo: concepto.activo ?? true,
      nivel: (concepto.nivel || "adicional") as "sat" | "prevision_social" | "bonos" | "adicional",
      medioPagoId: concepto.medioPagoId || "none",
    });
    
    if (isCustomCategoria) {
      setShowCustomCategoria(true);
      setCustomCategoria(categoria);
    } else {
      setShowCustomCategoria(false);
      setCustomCategoria("");
    }
    
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.nombre || !formData.formula) {
      toast({ title: "Error", description: "Nombre y fórmula son requeridos", variant: "destructive" });
      return;
    }

    const dataToSubmit = {
      ...formData,
      categoria: showCustomCategoria && customCategoria.trim() 
        ? customCategoria.trim() 
        : formData.categoria,
      medioPagoId: formData.medioPagoId === "none" || !formData.medioPagoId ? "" : formData.medioPagoId,
    };

    if (editingConcepto) {
      updateMutation.mutate({ id: editingConcepto.id, data: dataToSubmit });
    } else {
      createMutation.mutate(dataToSubmit);
    }
  };

  const insertVariable = (variable: string) => {
    setFormData(prev => ({
      ...prev,
      formula: prev.formula + variable,
    }));
  };

  const applyFilters = (conceptos: ConceptoMedioPago[]) => {
    return conceptos.filter(c => {
      const matchesSearch = c.nombre.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === "todos" || c.tipo === filterType;
      const matchesCategoria = filterCategoria === "todos" || (c.categoria || "otros") === filterCategoria;
      return matchesSearch && matchesType && matchesCategoria;
    });
  };

  const filteredSat = applyFilters(conceptosSat);
  const filteredPrevision = applyFilters(conceptosPrevision);
  const filteredBonos = applyFilters(conceptosBonos);
  const filteredAdicional = applyFilters(conceptosAdicional);

  const getCategoriaLabel = (categoria: string | null | undefined): string => {
    if (!categoria) return CATEGORIA_LABELS.otros;
    return CATEGORIA_LABELS[categoria as CategoriaConcepto] || categoria;
  };

  const ConceptoRow = ({ concepto, nivel }: { concepto: ConceptoMedioPago; nivel: 'sat' | 'prevision_social' | 'bonos' | 'adicional' }) => {
    const isSat = nivel === 'sat';
    const isReadOnly = isSat;
    
    return (
      <TableRow key={concepto.id} data-testid={`row-concepto-${concepto.id}`}>
        <TableCell>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{concepto.nombre}</span>
              {concepto.satClave && (
                <Badge variant="outline" className="text-xs font-mono">
                  {concepto.satClave}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Badge 
                variant="secondary" 
                className={`text-xs ${concepto.tipo === 'percepcion' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}
              >
                {concepto.tipo === 'percepcion' ? 'Percepción' : 'Deducción'}
              </Badge>
              {!concepto.activo && (
                <Badge variant="secondary" className="text-xs">Inactivo</Badge>
              )}
            </div>
          </div>
        </TableCell>
        <TableCell>
          <Badge variant="outline" className="text-xs font-normal">
            {getCategoriaLabel(concepto.categoria)}
          </Badge>
        </TableCell>
        <TableCell className="font-mono text-xs max-w-[250px]">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="truncate cursor-help">
                {concepto.formula || "-"}
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-md">
              <pre className="text-xs whitespace-pre-wrap">{concepto.formula || "Sin fórmula"}</pre>
            </TooltipContent>
          </Tooltip>
        </TableCell>
        <TableCell className="text-xs">
          {concepto.limiteExento || "-"}
        </TableCell>
        <TableCell className="text-center">
          {concepto.gravableISR ? (
            <Check className="h-4 w-4 text-amber-600 mx-auto" />
          ) : (
            <X className="h-4 w-4 text-muted-foreground mx-auto" />
          )}
        </TableCell>
        <TableCell className="text-center">
          {concepto.integraSBC ? (
            <Check className="h-4 w-4 text-blue-600 mx-auto" />
          ) : (
            <X className="h-4 w-4 text-muted-foreground mx-auto" />
          )}
        </TableCell>
        {(nivel === 'sat' || nivel === 'prevision_social') && (
          <TableCell className="text-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex justify-center">
                  <Switch
                    checked={concepto.integraSalarioBase ?? false}
                    onCheckedChange={(checked) => {
                      toggleSalarioBaseMutation.mutate({
                        id: concepto.id,
                        integraSalarioBase: checked,
                      });
                    }}
                    disabled={toggleSalarioBaseMutation.isPending}
                    data-testid={`switch-salario-base-${concepto.id}`}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                {concepto.integraSalarioBase 
                  ? "Este concepto se incluye como parte del salario base" 
                  : "Activar para incluir en el salario base"}
              </TooltipContent>
            </Tooltip>
          </TableCell>
        )}
        <TableCell>
          {isReadOnly ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center justify-center">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                Concepto SAT oficial (solo lectura)
              </TooltipContent>
            </Tooltip>
          ) : (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleEdit(concepto)}
                data-testid={`button-edit-concepto-${concepto.id}`}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (confirm("¿Estás seguro de eliminar este concepto?")) {
                    deleteMutation.mutate(concepto.id);
                  }
                }}
                data-testid={`button-delete-concepto-${concepto.id}`}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          )}
        </TableCell>
      </TableRow>
    );
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Calculator className="h-6 w-6" />
            Catálogo de Conceptos
          </h1>
          <p className="text-muted-foreground">
            Gestiona percepciones y deducciones con fórmulas de cálculo
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setIsHelpOpen(true)}
            data-testid="button-help-formulas"
          >
            <HelpCircle className="h-4 w-4 mr-2" />
            Variables
          </Button>
          <Button
            onClick={() => {
              resetForm();
              setIsDialogOpen(true);
            }}
            data-testid="button-new-concepto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Concepto
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar conceptos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                data-testid="input-search-conceptos"
              />
            </div>
            <Select value={filterType} onValueChange={(v) => setFilterType(v as typeof filterType)}>
              <SelectTrigger className="w-[160px]" data-testid="select-filter-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los tipos</SelectItem>
                <SelectItem value="percepcion">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    Percepciones
                  </div>
                </SelectItem>
                <SelectItem value="deduccion">
                  <div className="flex items-center gap-2">
                    <Minus className="h-4 w-4 text-red-600" />
                    Deducciones
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterCategoria} onValueChange={(v) => setFilterCategoria(v as typeof filterCategoria)}>
              <SelectTrigger className="w-[200px]" data-testid="select-filter-categoria">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas las categorías</SelectItem>
                {categoriasConcepto.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {CATEGORIA_LABELS[cat]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              Cargando conceptos...
            </div>
          ) : (
            <Tabs defaultValue="sat" className="w-full">
              <TabsList className="w-full justify-start px-4 h-auto flex-wrap gap-1">
                <TabsTrigger value="sat" className="flex items-center gap-2" data-testid="tab-sat">
                  <Lock className="h-4 w-4 text-blue-600" />
                  Catálogo SAT
                  <Badge variant="secondary">{filteredSat.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="prevision" className="flex items-center gap-2" data-testid="tab-prevision">
                  <Shield className="h-4 w-4 text-emerald-600" />
                  Previsión Social
                  <Badge variant="secondary">{filteredPrevision.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="bonos" className="flex items-center gap-2" data-testid="tab-bonos">
                  <Trophy className="h-4 w-4 text-amber-600" />
                  Bonos
                  <Badge variant="secondary">{filteredBonos.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="adicional" className="flex items-center gap-2" data-testid="tab-adicional">
                  <Sparkles className="h-4 w-4 text-purple-600" />
                  Adicionales
                  <Badge variant="secondary">{filteredAdicional.length}</Badge>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="sat" className="m-0">
                <div className="px-4 py-2 bg-blue-50 dark:bg-blue-950/30 border-b text-sm text-blue-700 dark:text-blue-300 flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Conceptos oficiales del catálogo SAT CFDI 4.0 (solo lectura)
                </div>
                <ScrollArea className="h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre / Clave SAT</TableHead>
                        <TableHead>Categoría</TableHead>
                        <TableHead>Fórmula</TableHead>
                        <TableHead>Límite Exento</TableHead>
                        <TableHead className="text-center w-[100px]">Grava ISR</TableHead>
                        <TableHead className="text-center w-[100px]">Integra SBC</TableHead>
                        <TableHead className="text-center w-[120px]">En Salario Base</TableHead>
                        <TableHead className="w-[100px]">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSat.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                            No hay conceptos SAT registrados
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredSat.map((c) => <ConceptoRow key={c.id} concepto={c} nivel="sat" />)
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="prevision" className="m-0">
                <div className="px-4 py-2 bg-emerald-50 dark:bg-emerald-950/30 border-b text-sm text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Beneficios de previsión social configurables dentro de límites SAT
                </div>
                <ScrollArea className="h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre / Tipo</TableHead>
                        <TableHead>Categoría</TableHead>
                        <TableHead>Fórmula</TableHead>
                        <TableHead>Límite Exento</TableHead>
                        <TableHead className="text-center w-[100px]">Grava ISR</TableHead>
                        <TableHead className="text-center w-[100px]">Integra SBC</TableHead>
                        <TableHead className="text-center w-[120px]">En Salario Base</TableHead>
                        <TableHead className="w-[100px]">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPrevision.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                            No hay conceptos de previsión social registrados
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredPrevision.map((c) => <ConceptoRow key={c.id} concepto={c} nivel="prevision_social" />)
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="bonos" className="m-0">
                <div className="px-4 py-2 bg-amber-50 dark:bg-amber-950/30 border-b text-sm text-amber-700 dark:text-amber-300 flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  Bonos e incentivos personalizados configurables por la empresa
                </div>
                <ScrollArea className="h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre / Tipo</TableHead>
                        <TableHead>Categoría</TableHead>
                        <TableHead>Fórmula</TableHead>
                        <TableHead>Límite Exento</TableHead>
                        <TableHead className="text-center w-[100px]">Grava ISR</TableHead>
                        <TableHead className="text-center w-[100px]">Integra SBC</TableHead>
                        <TableHead className="w-[100px]">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBonos.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                            No hay bonos registrados. Crea bonos personalizados para tu empresa.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredBonos.map((c) => <ConceptoRow key={c.id} concepto={c} nivel="bonos" />)
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="adicional" className="m-0">
                <div className="px-4 py-2 bg-purple-50 dark:bg-purple-950/30 border-b text-sm text-purple-700 dark:text-purple-300 flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Prestaciones adicionales personalizables con medio de pago configurable
                </div>
                <ScrollArea className="h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre / Tipo</TableHead>
                        <TableHead>Categoría</TableHead>
                        <TableHead>Fórmula</TableHead>
                        <TableHead>Límite Exento</TableHead>
                        <TableHead className="text-center w-[100px]">Grava ISR</TableHead>
                        <TableHead className="text-center w-[100px]">Integra SBC</TableHead>
                        <TableHead className="w-[100px]">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAdicional.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                            No hay prestaciones adicionales registradas
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredAdicional.map((c) => <ConceptoRow key={c.id} concepto={c} nivel="adicional" />)
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              {editingConcepto ? "Editar Concepto" : "Nuevo Concepto"}
            </DialogTitle>
            <DialogDescription>
              Define la fórmula de cálculo y propiedades fiscales del concepto
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto max-h-[60vh] pr-4">
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre del Concepto *</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Ej: Prima Vacacional"
                  data-testid="input-concepto-nombre"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo *</Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(v: "percepcion" | "deduccion") => setFormData({ ...formData, tipo: v })}
                >
                  <SelectTrigger data-testid="select-concepto-tipo">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percepcion">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        Percepción
                      </div>
                    </SelectItem>
                    <SelectItem value="deduccion">
                      <div className="flex items-center gap-2">
                        <Minus className="h-4 w-4 text-red-600" />
                        Deducción
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="categoria">Categoría</Label>
                <Select
                  value={formData.categoria}
                  onValueChange={(v) => {
                    if (v === "__custom__") {
                      setShowCustomCategoria(true);
                      setFormData({ ...formData, categoria: "otros" });
                    } else {
                      setShowCustomCategoria(false);
                      setCustomCategoria("");
                      setFormData({ ...formData, categoria: v });
                    }
                  }}
                >
                  <SelectTrigger data-testid="select-concepto-categoria">
                    <SelectValue placeholder="Selecciona categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoriasConcepto.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {CATEGORIA_LABELS[cat]}
                      </SelectItem>
                    ))}
                    <SelectItem value="__custom__">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Plus className="h-3 w-3" />
                        Categoría personalizada...
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {showCustomCategoria && (
                <div className="space-y-2">
                  <Label htmlFor="customCategoria">Nombre de Categoría</Label>
                  <Input
                    id="customCategoria"
                    value={customCategoria}
                    onChange={(e) => setCustomCategoria(e.target.value)}
                    placeholder="Ej: Compensaciones especiales"
                    data-testid="input-concepto-custom-categoria"
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="formula">Fórmula de Cálculo *</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsHelpOpen(true)}
                  className="h-auto py-1 text-xs"
                >
                  <Code className="h-3 w-3 mr-1" />
                  Ver Variables
                </Button>
              </div>
              <Textarea
                id="formula"
                value={formData.formula}
                onChange={(e) => setFormData({ ...formData, formula: e.target.value })}
                placeholder="Ej: SALARIO_DIARIO * DIAS_VACACIONES * 0.25"
                className="font-mono text-sm"
                rows={3}
                data-testid="input-concepto-formula"
              />
              <p className="text-xs text-muted-foreground">
                Usa variables como SALARIO_DIARIO, UMA_DIARIA, DIAS_TRABAJADOS, etc.
              </p>
              <FormulaPreview formula={formData.formula} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="limiteExento">Límite Exento ISR</Label>
                <Input
                  id="limiteExento"
                  value={formData.limiteExento}
                  onChange={(e) => setFormData({ ...formData, limiteExento: e.target.value })}
                  placeholder="Ej: 15 * UMA_DIARIA"
                  className="font-mono text-sm"
                  data-testid="input-concepto-limite-exento"
                />
                <p className="text-xs text-muted-foreground">
                  Puede ser una fórmula o cantidad fija
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="limiteAnual">Límite Anual</Label>
                <Input
                  id="limiteAnual"
                  value={formData.limiteAnual}
                  onChange={(e) => setFormData({ ...formData, limiteAnual: e.target.value })}
                  placeholder="Ej: 1.3 * UMA_ANUAL"
                  className="font-mono text-sm"
                  data-testid="input-concepto-limite-anual"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nivel">Nivel del Catálogo</Label>
                <Select
                  value={formData.nivel}
                  onValueChange={(v: "sat" | "prevision_social" | "bonos" | "adicional") => setFormData({ ...formData, nivel: v })}
                >
                  <SelectTrigger data-testid="select-concepto-nivel">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sat">
                      <div className="flex items-center gap-2">
                        <Lock className="h-4 w-4 text-blue-600" />
                        Catálogo SAT
                      </div>
                    </SelectItem>
                    <SelectItem value="prevision_social">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-emerald-600" />
                        Previsión Social
                      </div>
                    </SelectItem>
                    <SelectItem value="bonos">
                      <div className="flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-amber-600" />
                        Bonos
                      </div>
                    </SelectItem>
                    <SelectItem value="adicional">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-purple-600" />
                        Adicionales
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formData.nivel === "adicional" && (
                <div className="space-y-2">
                  <Label htmlFor="medioPago">Medio de Pago</Label>
                  <Select
                    value={formData.medioPagoId}
                    onValueChange={(v) => setFormData({ ...formData, medioPagoId: v })}
                  >
                    <SelectTrigger data-testid="select-concepto-medio-pago">
                      <SelectValue placeholder="Selecciona medio de pago" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        <span className="text-muted-foreground">Sin medio de pago específico</span>
                      </SelectItem>
                      {mediosPago.map((mp) => (
                        <SelectItem key={mp.id} value={mp.id}>
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4" />
                            {mp.nombre}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Define cómo se pagará esta prestación adicional
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4 pt-2">
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <Label htmlFor="gravableISR" className="text-sm">Grava ISR</Label>
                  <p className="text-xs text-muted-foreground">Se suma a base gravable</p>
                </div>
                <Switch
                  id="gravableISR"
                  checked={formData.gravableISR}
                  onCheckedChange={(checked) => setFormData({ ...formData, gravableISR: checked })}
                  data-testid="switch-concepto-gravable"
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <Label htmlFor="integraSBC" className="text-sm">Integra SBC</Label>
                  <p className="text-xs text-muted-foreground">Para cuotas IMSS</p>
                </div>
                <Switch
                  id="integraSBC"
                  checked={formData.integraSBC}
                  onCheckedChange={(checked) => setFormData({ ...formData, integraSBC: checked })}
                  data-testid="switch-concepto-sbc"
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <Label htmlFor="activo" className="text-sm">Activo</Label>
                  <p className="text-xs text-muted-foreground">Disponible para usar</p>
                </div>
                <Switch
                  id="activo"
                  checked={formData.activo}
                  onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
                  data-testid="switch-concepto-activo"
                />
              </div>
            </div>
          </div>
          </div>
          <DialogFooter className="flex-shrink-0 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
              data-testid="button-save-concepto"
            >
              {editingConcepto ? "Guardar Cambios" : "Crear Concepto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isHelpOpen} onOpenChange={setIsHelpOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              Variables para Fórmulas
            </DialogTitle>
            <DialogDescription>
              Usa estas variables en tus fórmulas de cálculo. Haz clic para copiar.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[500px] pr-4">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="salario">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Variables de Salario
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid gap-2">
                    {variables
                      .filter(v => v.variable.includes("SALARIO") || v.variable.includes("SDI") || v.variable.includes("SBC"))
                      .map((v) => (
                        <VariableCard key={v.variable} variable={v} onCopy={insertVariable} />
                      ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="dias">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <Calculator className="h-4 w-4" />
                    Variables de Días y Periodo
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid gap-2">
                    {variables
                      .filter(v => v.variable.includes("DIAS") || v.variable.includes("AÑOS") || v.variable.includes("PERIODO"))
                      .map((v) => (
                        <VariableCard key={v.variable} variable={v} onCopy={insertVariable} />
                      ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="uma">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <Scale className="h-4 w-4" />
                    UMA y Salario Mínimo
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid gap-2">
                    {variables
                      .filter(v => v.variable.includes("UMA") || v.variable.includes("MINIMO"))
                      .map((v) => (
                        <VariableCard key={v.variable} variable={v} onCopy={insertVariable} />
                      ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="otros">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Horas Extra, Descuentos y Otros
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid gap-2">
                    {variables
                      .filter(v => 
                        v.variable.includes("HORAS") || 
                        v.variable.includes("DOMINGOS") ||
                        v.variable.includes("FESTIVOS") ||
                        v.variable.includes("VALES") ||
                        v.variable.includes("SINDICAL") ||
                        v.variable.includes("INFONAVIT") ||
                        v.variable.includes("FONACOT") ||
                        v.variable.includes("GRAVABLE")
                      )
                      .map((v) => (
                        <VariableCard key={v.variable} variable={v} onCopy={insertVariable} />
                      ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <div className="mt-6 p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Ejemplos de Fórmulas</h4>
              <div className="space-y-2 text-sm font-mono">
                <p><strong>Prima Vacacional:</strong> SALARIO_DIARIO * DIAS_VACACIONES * 0.25</p>
                <p><strong>Aguinaldo proporcional:</strong> SALARIO_DIARIO * 15 * (DIAS_TRABAJADOS_ANIO / 365)</p>
                <p><strong>Horas Extra Dobles:</strong> SALARIO_HORA * HORAS_EXTRA_DOBLES * 2</p>
                <p><strong>Prima Dominical:</strong> SALARIO_DIARIO * DOMINGOS_TRABAJADOS * 0.25</p>
                <p><strong>Descuento IMSS E&M:</strong> MAX(0, SBC_DIARIO - 3*UMA_DIARIA) * DIAS_PERIODO * 0.004</p>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function VariableCard({ variable, onCopy }: { variable: FormulaVariable; onCopy: (v: string) => void }) {
  const { toast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(variable.variable);
    onCopy(variable.variable);
    toast({ title: "Variable copiada", description: variable.variable });
  };

  return (
    <div
      className="flex items-center justify-between p-3 border rounded-lg hover-elevate cursor-pointer"
      onClick={handleCopy}
      data-testid={`variable-${variable.variable}`}
    >
      <div className="flex-1">
        <code className="text-sm font-bold text-primary">{variable.variable}</code>
        <p className="text-xs text-muted-foreground mt-1">{variable.descripcion}</p>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="font-mono text-xs">
          ${variable.ejemplo}
        </Badge>
        <Copy className="h-4 w-4 text-muted-foreground" />
      </div>
    </div>
  );
}

const EXAMPLE_VALUES: Record<string, number> = {
  SALARIO_DIARIO: 350.00,
  SALARIO_HORA: 43.75,
  SALARIO_PERIODO: 5250.00,
  DIAS_TRABAJADOS: 15,
  DIAS_PERIODO: 15,
  DIAS_TRABAJADOS_ANIO: 180,
  DIAS_VACACIONES: 12,
  DIAS_AGUINALDO: 15,
  AÑOS_SERVICIO: 3,
  UMA_DIARIA: 113.14,
  UMA_MENSUAL: 3439.46,
  UMA_ANUAL: 41296.10,
  SALARIO_MINIMO: 278.80,
  SALARIO_MINIMO_FRONTERA: 419.88,
  SBC_DIARIO: 380.50,
  SBC_PERIODO: 5707.50,
  SDI: 385.00,
  BASE_GRAVABLE: 4800.00,
  HORAS_EXTRA_DOBLES: 6,
  HORAS_EXTRA_TRIPLES: 3,
  DOMINGOS_TRABAJADOS: 2,
  DIAS_FESTIVOS_TRABAJADOS: 1,
  MONTO_VALES: 1200.00,
  PORCENTAJE_SINDICAL: 0.02,
  DESCUENTO_INFONAVIT: 850.00,
  DESCUENTO_FONACOT: 500.00,
};

function FormulaPreview({ formula }: { formula: string }) {
  if (!formula || formula.trim().length === 0) {
    return null;
  }

  let substituted = formula;
  const usedVariables: { name: string; value: number }[] = [];
  
  for (const [variable, value] of Object.entries(EXAMPLE_VALUES)) {
    if (formula.includes(variable)) {
      usedVariables.push({ name: variable, value });
      substituted = substituted.replace(new RegExp(`\\b${variable}\\b`, 'g'), String(value));
    }
  }

  const unknownVars = formula.match(/\b[A-Z_]{3,}\b/g)?.filter(v => !EXAMPLE_VALUES[v]) || [];

  return (
    <div className="mt-2 p-3 bg-muted rounded-lg border" data-testid="formula-preview">
      <div className="flex items-center gap-2 mb-2">
        <Calculator className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">Vista previa con valores de ejemplo</span>
      </div>
      
      {unknownVars.length > 0 && (
        <div className="flex items-center gap-2 text-amber-600 mb-2">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-xs">Variables no reconocidas: {unknownVars.join(", ")}</span>
        </div>
      )}
      
      <div className="space-y-2">
        {usedVariables.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {usedVariables.map(v => (
              <Badge key={v.name} variant="outline" className="font-mono text-xs">
                {v.name} = ${v.value.toLocaleString("es-MX")}
              </Badge>
            ))}
          </div>
        )}
        
        <div className="p-2 bg-background rounded border">
          <div className="text-xs text-muted-foreground mb-1">Fórmula con valores:</div>
          <code className="text-sm font-mono break-all">{substituted}</code>
        </div>
        
        <p className="text-xs text-muted-foreground">
          El cálculo final se realiza en el motor de nómina con los valores reales del empleado.
        </p>
      </div>
    </div>
  );
}
