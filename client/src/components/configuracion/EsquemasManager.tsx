import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Edit, Trash2, Gift, Search, Eye, ChevronDown, ChevronRight } from "lucide-react";
import { EsquemaFormDialog } from "@/components/configuracion/EsquemaFormDialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface EsquemaPresta {
  id: string;
  nombre: string;
  descripcion: string | null;
  esLey: boolean;
  activo: boolean;
}

interface EsquemaVacaciones {
  id: string;
  esquemaId: string;
  aniosAntiguedad: number;
  diasVacaciones: number;
}

interface TipoBeneficio {
  id: string;
  codigo: string;
  nombre: string;
  unidad: string;
}

interface EsquemaBeneficio {
  id: string;
  esquemaId: string;
  tipoBeneficioId: string;
  valor: string;
  activo: boolean;
}

export function EsquemasManager() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEsquema, setSelectedEsquema] = useState<EsquemaPresta | undefined>();
  const [expandedEsquemas, setExpandedEsquemas] = useState<Set<string>>(new Set());

  const { data: esquemas, isLoading } = useQuery<EsquemaPresta[]>({
    queryKey: ["/api/esquemas-prestaciones"],
  });

  const { data: tiposBeneficio } = useQuery<TipoBeneficio[]>({
    queryKey: ["/api/tipos-beneficio"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/esquemas-prestaciones/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/esquemas-prestaciones"] });
      toast({
        title: "Esquema eliminado",
        description: "El esquema de prestaciones ha sido eliminado correctamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el esquema",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (esquema: EsquemaPresta) => {
    setSelectedEsquema(esquema);
    setDialogOpen(true);
  };

  const handleDelete = (esquema: EsquemaPresta) => {
    if (esquema.esLey) {
      toast({
        title: "No permitido",
        description: "No se puede eliminar el esquema de Ley Federal del Trabajo.",
        variant: "destructive",
      });
      return;
    }
    if (confirm("¿Estás seguro de eliminar este esquema de prestaciones? Esto puede afectar a puestos y empleados que lo usen.")) {
      deleteMutation.mutate(esquema.id);
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedEsquema(undefined);
  };

  const toggleExpanded = (id: string) => {
    setExpandedEsquemas(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const filteredEsquemas = esquemas?.filter((esquema) => {
    if (esquema.esLey) return false;
    const matchesSearch = esquema.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      esquema.descripcion?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  }) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8" data-testid="loading-esquemas">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card data-testid="card-esquemas">
      <CardHeader>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5" />
              Catálogo de Esquemas de Prestaciones
            </CardTitle>
            <CardDescription>
              Configura los diferentes esquemas de prestaciones que aplican en tu organización.
              Cada esquema define vacaciones, aguinaldo, primas y beneficios adicionales.
            </CardDescription>
          </div>
          <Button onClick={() => setDialogOpen(true)} data-testid="button-nuevo-esquema">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Esquema
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
            data-testid="input-search-esquemas"
          />
        </div>

        <div className="space-y-4">
          {filteredEsquemas.length > 0 ? (
            filteredEsquemas.map((esquema) => (
              <EsquemaCard
                key={esquema.id}
                esquema={esquema}
                tiposBeneficio={tiposBeneficio || []}
                isExpanded={expandedEsquemas.has(esquema.id)}
                onToggleExpand={() => toggleExpanded(esquema.id)}
                onEdit={() => handleEdit(esquema)}
                onDelete={() => handleDelete(esquema)}
                isDeleting={deleteMutation.isPending}
              />
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Gift className="mx-auto h-12 w-12 mb-4" />
              <p>No hay esquemas de prestaciones personalizados.</p>
              <p className="text-sm mt-2">Los empleados usarán las prestaciones mínimas de ley (LFT 2024).</p>
            </div>
          )}
        </div>
      </CardContent>

      <EsquemaFormDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        esquema={selectedEsquema}
        tiposBeneficio={tiposBeneficio || []}
      />
    </Card>
  );
}

function EsquemaCard({
  esquema,
  tiposBeneficio,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
  isDeleting,
}: {
  esquema: EsquemaPresta;
  tiposBeneficio: TipoBeneficio[];
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const { data: vacaciones } = useQuery<EsquemaVacaciones[]>({
    queryKey: ["/api/esquemas-prestaciones", esquema.id, "vacaciones"],
    enabled: isExpanded,
  });

  const { data: beneficios } = useQuery<EsquemaBeneficio[]>({
    queryKey: ["/api/esquemas-prestaciones", esquema.id, "beneficios"],
    enabled: isExpanded,
  });

  const getBeneficioNombre = (tipoBeneficioId: string) => {
    return tiposBeneficio.find(t => t.id === tipoBeneficioId)?.nombre || "Desconocido";
  };

  const getBeneficioUnidad = (tipoBeneficioId: string) => {
    return tiposBeneficio.find(t => t.id === tipoBeneficioId)?.unidad || "";
  };

  const formatValor = (valor: string, unidad: string) => {
    const v = parseFloat(valor);
    switch (unidad) {
      case "dias":
        return `${v} días`;
      case "porcentaje":
        return `${v}%`;
      case "monto_fijo":
        return `$${v.toLocaleString("es-MX")}`;
      case "porcentaje_salario":
        return `${v}% del salario`;
      default:
        return valor;
    }
  };

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggleExpand}>
      <div className="rounded-lg border">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon" data-testid={`button-expand-${esquema.id}`}>
                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <div>
              <h3 className="font-medium" data-testid={`text-nombre-${esquema.id}`}>{esquema.nombre}</h3>
              {esquema.descripcion && (
                <p className="text-sm text-muted-foreground">{esquema.descripcion}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={esquema.activo ? "default" : "secondary"} data-testid={`badge-estado-${esquema.id}`}>
              {esquema.activo ? "Activo" : "Inactivo"}
            </Badge>
            <Button variant="ghost" size="icon" onClick={onEdit} data-testid={`button-edit-${esquema.id}`}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              disabled={isDeleting || esquema.esLey}
              data-testid={`button-delete-${esquema.id}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <CollapsibleContent>
          <div className="border-t p-4 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-medium mb-2 text-sm">Beneficios Configurados</h4>
                {beneficios && beneficios.length > 0 ? (
                  <div className="space-y-2">
                    {beneficios.filter(b => b.activo).map((ben) => (
                      <div key={ben.id} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{getBeneficioNombre(ben.tipoBeneficioId)}</span>
                        <span className="font-medium">{formatValor(ben.valor, getBeneficioUnidad(ben.tipoBeneficioId))}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Sin beneficios adicionales configurados</p>
                )}
              </div>

              <div>
                <h4 className="font-medium mb-2 text-sm">Tabla de Vacaciones</h4>
                {vacaciones && vacaciones.length > 0 ? (
                  <div className="max-h-48 overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="py-1 text-xs">Años</TableHead>
                          <TableHead className="py-1 text-xs text-right">Días</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {vacaciones.sort((a, b) => a.aniosAntiguedad - b.aniosAntiguedad).slice(0, 5).map((vac) => (
                          <TableRow key={vac.id}>
                            <TableCell className="py-1 text-sm">{vac.aniosAntiguedad}</TableCell>
                            <TableCell className="py-1 text-sm text-right">{vac.diasVacaciones}</TableCell>
                          </TableRow>
                        ))}
                        {vacaciones.length > 5 && (
                          <TableRow>
                            <TableCell colSpan={2} className="py-1 text-xs text-center text-muted-foreground">
                              +{vacaciones.length - 5} años más...
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Usa tabla de vacaciones LFT</p>
                )}
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
