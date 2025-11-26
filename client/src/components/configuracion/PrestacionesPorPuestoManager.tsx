import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Briefcase, Search, Check, Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Puesto {
  id: string;
  nombrePuesto: string;
  clavePuesto: string;
  esquemaPrestacionesId: string | null;
  estatus: string;
}

interface EsquemaPresta {
  id: string;
  nombre: string;
  esLey: boolean;
  activo: boolean;
}

interface TipoBeneficio {
  id: string;
  codigo: string;
  nombre: string;
  unidad: string;
}

interface PuestoBeneficioExtra {
  id: string;
  puestoId: string;
  tipoBeneficioId: string;
  valorExtra: string;
  activo: boolean;
}

export function PrestacionesPorPuestoManager() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPuesto, setSelectedPuesto] = useState<Puesto | null>(null);
  const [extraDialogOpen, setExtraDialogOpen] = useState(false);

  const { data: puestos, isLoading: loadingPuestos } = useQuery<Puesto[]>({
    queryKey: ["/api/puestos"],
  });

  const { data: esquemas, isLoading: loadingEsquemas } = useQuery<EsquemaPresta[]>({
    queryKey: ["/api/esquemas-prestaciones"],
  });

  const { data: tiposBeneficio } = useQuery<TipoBeneficio[]>({
    queryKey: ["/api/tipos-beneficio"],
  });

  const assignMutation = useMutation({
    mutationFn: async ({ puestoId, esquemaId }: { puestoId: string; esquemaId: string | null }) => {
      return await apiRequest("PATCH", `/api/puestos/${puestoId}/prestaciones`, {
        esquemaPrestacionesId: esquemaId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/puestos"] });
      toast({
        title: "Prestaciones actualizadas",
        description: "El esquema de prestaciones ha sido asignado correctamente al puesto.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo asignar el esquema de prestaciones",
        variant: "destructive",
      });
    },
  });

  const getEsquemaNombre = (esquemaId: string | null) => {
    if (!esquemaId) return "LFT 2024 (Mínimos de Ley)";
    const esquema = esquemas?.find((e) => e.id === esquemaId);
    return esquema?.nombre || "Desconocido";
  };

  const handleAssignEsquema = (puestoId: string, esquemaId: string) => {
    const finalId = esquemaId === "lft" ? null : esquemaId;
    assignMutation.mutate({ puestoId, esquemaId: finalId });
  };

  const handleOpenExtras = (puesto: Puesto) => {
    setSelectedPuesto(puesto);
    setExtraDialogOpen(true);
  };

  const filteredPuestos = puestos?.filter((puesto) =>
    puesto.nombrePuesto.toLowerCase().includes(searchTerm.toLowerCase()) ||
    puesto.clavePuesto.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const activeEsquemas = esquemas?.filter(e => e.activo) || [];

  if (loadingPuestos || loadingEsquemas) {
    return (
      <div className="flex items-center justify-center py-8" data-testid="loading-prestaciones-puestos">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <Card data-testid="card-prestaciones-puestos">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Prestaciones por Puesto
          </CardTitle>
          <CardDescription>
            Asigna esquemas de prestaciones a cada puesto. Los empleados heredarán
            automáticamente las prestaciones de su puesto (a menos que tengan un override individual).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar puesto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
              data-testid="input-search-puestos"
            />
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Clave</TableHead>
                <TableHead>Puesto</TableHead>
                <TableHead>Esquema Actual</TableHead>
                <TableHead>Cambiar Esquema</TableHead>
                <TableHead className="text-right">Beneficios Extra</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPuestos.length > 0 ? (
                filteredPuestos.map((puesto) => (
                  <TableRow key={puesto.id} data-testid={`row-puesto-${puesto.id}`}>
                    <TableCell className="font-mono text-sm" data-testid={`text-clave-${puesto.id}`}>
                      {puesto.clavePuesto}
                    </TableCell>
                    <TableCell data-testid={`text-nombre-${puesto.id}`}>
                      {puesto.nombrePuesto}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" data-testid={`badge-esquema-${puesto.id}`}>
                        {getEsquemaNombre(puesto.esquemaPrestacionesId)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={puesto.esquemaPrestacionesId || "lft"}
                        onValueChange={(value) => handleAssignEsquema(puesto.id, value)}
                        disabled={assignMutation.isPending}
                        data-testid={`select-esquema-${puesto.id}`}
                      >
                        <SelectTrigger className="w-[250px]">
                          <SelectValue placeholder="Seleccionar esquema..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="lft">LFT 2024 (Mínimos de Ley)</SelectItem>
                          {activeEsquemas.filter(e => !e.esLey).map((esquema) => (
                            <SelectItem key={esquema.id} value={esquema.id}>
                              {esquema.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenExtras(puesto)}
                        data-testid={`button-extras-${puesto.id}`}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Extras
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No hay puestos registrados
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedPuesto && (
        <PuestoBeneficiosExtraDialog
          puesto={selectedPuesto}
          tiposBeneficio={tiposBeneficio || []}
          open={extraDialogOpen}
          onOpenChange={setExtraDialogOpen}
        />
      )}
    </>
  );
}

function PuestoBeneficiosExtraDialog({
  puesto,
  tiposBeneficio,
  open,
  onOpenChange,
}: {
  puesto: Puesto;
  tiposBeneficio: TipoBeneficio[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const [newRows, setNewRows] = useState<Array<{ tipoBeneficioId: string; valorExtra: string }>>([]);

  const { data: existingExtras, isLoading } = useQuery<PuestoBeneficioExtra[]>({
    queryKey: ["/api/puestos", puesto.id, "beneficios-extra"],
    enabled: open,
  });

  const addExtraMutation = useMutation({
    mutationFn: async (data: { tipoBeneficioId: string; valorExtra: string }) => {
      return await apiRequest("POST", `/api/puestos/${puesto.id}/beneficios-extra`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/puestos", puesto.id, "beneficios-extra"] });
      queryClient.invalidateQueries({ queryKey: ["/api/puestos"] });
      toast({ title: "Beneficio extra agregado" });
      setNewRows([]);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo agregar el beneficio",
        variant: "destructive",
      });
    },
  });

  const deleteExtraMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/puesto-beneficios-extra/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/puestos", puesto.id, "beneficios-extra"] });
      queryClient.invalidateQueries({ queryKey: ["/api/puestos"] });
      toast({ title: "Beneficio extra eliminado" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el beneficio",
        variant: "destructive",
      });
    },
  });

  const getTipoNombre = (tipoBeneficioId: string) => {
    return tiposBeneficio.find(t => t.id === tipoBeneficioId)?.nombre || "Desconocido";
  };

  const getUnidadLabel = (tipoBeneficioId: string) => {
    const tipo = tiposBeneficio.find(t => t.id === tipoBeneficioId);
    if (!tipo) return "";
    switch (tipo.unidad) {
      case "dias": return "días extra";
      case "porcentaje": return "% extra";
      case "monto_fijo": return "$ extra";
      case "porcentaje_salario": return "% salario extra";
      default: return tipo.unidad;
    }
  };

  const addNewRow = () => {
    const usedIds = [...(existingExtras?.map(e => e.tipoBeneficioId) || []), ...newRows.map(r => r.tipoBeneficioId)];
    const available = tiposBeneficio.filter(t => !usedIds.includes(t.id));
    if (available.length > 0) {
      setNewRows([...newRows, { tipoBeneficioId: available[0].id, valorExtra: "0" }]);
    }
  };

  const saveNewRows = () => {
    newRows.forEach(row => {
      addExtraMutation.mutate(row);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" data-testid="dialog-puesto-extras">
        <DialogHeader>
          <DialogTitle>Beneficios Extra para {puesto.nombrePuesto}</DialogTitle>
          <DialogDescription>
            Agrega beneficios adicionales que se suman al esquema base del puesto.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {existingExtras && existingExtras.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Beneficios Extra Actuales</h4>
                {existingExtras.filter(e => e.activo).map((extra) => (
                  <div key={extra.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <span className="font-medium">{getTipoNombre(extra.tipoBeneficioId)}</span>
                      <span className="ml-2 text-muted-foreground">
                        +{extra.valorExtra} {getUnidadLabel(extra.tipoBeneficioId)}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteExtraMutation.mutate(extra.id)}
                      disabled={deleteExtraMutation.isPending}
                      data-testid={`button-delete-extra-${extra.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {newRows.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Nuevos Beneficios</h4>
                {newRows.map((row, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <select
                      value={row.tipoBeneficioId}
                      onChange={(e) => {
                        const updated = [...newRows];
                        updated[index].tipoBeneficioId = e.target.value;
                        setNewRows(updated);
                      }}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      data-testid={`select-new-tipo-${index}`}
                    >
                      {tiposBeneficio.map((tipo) => (
                        <option key={tipo.id} value={tipo.id}>
                          {tipo.nombre}
                        </option>
                      ))}
                    </select>
                    <Input
                      type="number"
                      step="0.01"
                      value={row.valorExtra}
                      onChange={(e) => {
                        const updated = [...newRows];
                        updated[index].valorExtra = e.target.value;
                        setNewRows(updated);
                      }}
                      className="w-24"
                      data-testid={`input-new-valor-${index}`}
                    />
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      {getUnidadLabel(row.tipoBeneficioId)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setNewRows(newRows.filter((_, i) => i !== index))}
                      data-testid={`button-remove-new-${index}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <Button
              variant="outline"
              onClick={addNewRow}
              className="w-full"
              disabled={tiposBeneficio.length <= (existingExtras?.length || 0) + newRows.length}
              data-testid="button-add-extra-row"
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar Beneficio Extra
            </Button>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
          {newRows.length > 0 && (
            <Button onClick={saveNewRows} disabled={addExtraMutation.isPending} data-testid="button-save-extras">
              {addExtraMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
