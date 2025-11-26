import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Users, Search, Settings, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Employee {
  id: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno?: string;
  puestoId: string | null;
}

interface Puesto {
  id: string;
  nombrePuesto: string;
  esquemaPrestacionesId: string | null;
}

interface EsquemaPresta {
  id: string;
  nombre: string;
  esLey: boolean;
}

interface TipoBeneficio {
  id: string;
  codigo: string;
  nombre: string;
  unidad: string;
}

interface EmpleadoBeneficioExtra {
  id: string;
  empleadoId: string;
  tipoBeneficioId: string;
  valorExtra: string;
  activo: boolean;
}

interface PuestoBeneficioExtra {
  id: string;
  puestoId: string;
  tipoBeneficioId: string;
  valorExtra: string;
  activo: boolean;
}

export function EmpleadosOverridesManager() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [overrideDialogOpen, setOverrideDialogOpen] = useState(false);

  const { data: employees, isLoading: loadingEmployees } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const { data: puestos } = useQuery<Puesto[]>({
    queryKey: ["/api/puestos"],
  });

  const { data: esquemas } = useQuery<EsquemaPresta[]>({
    queryKey: ["/api/esquemas-prestaciones"],
  });

  const { data: tiposBeneficio } = useQuery<TipoBeneficio[]>({
    queryKey: ["/api/tipos-beneficio"],
  });

  const getEsquemaNombre = (esquemaId: string | null) => {
    if (!esquemaId) return "LFT 2024";
    const esquema = esquemas?.find((e) => e.id === esquemaId);
    return esquema?.nombre || "Desconocido";
  };

  const getPuesto = (puestoId: string | null): Puesto | undefined => {
    if (!puestoId) return undefined;
    return puestos?.find((p) => p.id === puestoId);
  };

  const handleConfigureOverride = (employee: Employee) => {
    setSelectedEmployee(employee);
    setOverrideDialogOpen(true);
  };

  const filteredEmployees = employees?.filter((emp) => {
    const fullName = `${emp.nombre} ${emp.apellidoPaterno} ${emp.apellidoMaterno || ""}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  }) || [];

  if (loadingEmployees) {
    return (
      <div className="flex items-center justify-center py-8" data-testid="loading-empleados-overrides">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <Card data-testid="card-empleados-overrides">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Beneficios Individuales por Empleado
          </CardTitle>
          <CardDescription>
            Agrega beneficios adicionales a empleados específicos.
            Estos beneficios se suman a los del puesto y esquema base.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar empleado..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
              data-testid="input-search-empleados"
            />
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empleado</TableHead>
                <TableHead>Puesto</TableHead>
                <TableHead>Esquema Base</TableHead>
                <TableHead className="text-right">Beneficios Extra</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.length > 0 ? (
                filteredEmployees.map((emp) => {
                  const puesto = getPuesto(emp.puestoId);
                  const esquemaId = puesto?.esquemaPrestacionesId || null;

                  return (
                    <TableRow key={emp.id} data-testid={`row-empleado-${emp.id}`}>
                      <TableCell className="font-medium" data-testid={`text-nombre-${emp.id}`}>
                        {emp.nombre} {emp.apellidoPaterno} {emp.apellidoMaterno || ""}
                      </TableCell>
                      <TableCell data-testid={`text-puesto-${emp.id}`}>
                        {puesto?.nombrePuesto || "Sin puesto"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" data-testid={`badge-esquema-${emp.id}`}>
                          {getEsquemaNombre(esquemaId)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleConfigureOverride(emp)}
                          data-testid={`button-configurar-${emp.id}`}
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Configurar
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No hay empleados registrados
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedEmployee && (
        <EmpleadoBeneficiosExtraDialog
          employee={selectedEmployee}
          puesto={getPuesto(selectedEmployee.puestoId)}
          tiposBeneficio={tiposBeneficio || []}
          open={overrideDialogOpen}
          onOpenChange={setOverrideDialogOpen}
        />
      )}
    </>
  );
}

function EmpleadoBeneficiosExtraDialog({
  employee,
  puesto,
  tiposBeneficio,
  open,
  onOpenChange,
}: {
  employee: Employee;
  puesto: Puesto | undefined;
  tiposBeneficio: TipoBeneficio[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const [newRows, setNewRows] = useState<Array<{ tipoBeneficioId: string; valorExtra: string }>>([]);

  const { data: empleadoExtras, isLoading: loadingEmpleadoExtras } = useQuery<EmpleadoBeneficioExtra[]>({
    queryKey: ["/api/employees", employee.id, "beneficios-extra"],
    enabled: open,
  });

  const { data: puestoExtras } = useQuery<PuestoBeneficioExtra[]>({
    queryKey: ["/api/puestos", puesto?.id, "beneficios-extra"],
    enabled: open && !!puesto?.id,
  });

  const addExtraMutation = useMutation({
    mutationFn: async (data: { tipoBeneficioId: string; valorExtra: string }) => {
      return await apiRequest("POST", `/api/employees/${employee.id}/beneficios-extra`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees", employee.id, "beneficios-extra"] });
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
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
      return await apiRequest("DELETE", `/api/empleado-beneficios-extra/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees", employee.id, "beneficios-extra"] });
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
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
      case "dias": return "días";
      case "porcentaje": return "%";
      case "monto_fijo": return "$";
      case "porcentaje_salario": return "% salario";
      default: return tipo.unidad;
    }
  };

  const addNewRow = () => {
    const usedIds = [...(empleadoExtras?.map(e => e.tipoBeneficioId) || []), ...newRows.map(r => r.tipoBeneficioId)];
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

  const activePuestoExtras = puestoExtras?.filter(e => e.activo) || [];
  const activeEmpleadoExtras = empleadoExtras?.filter(e => e.activo) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto" data-testid="dialog-empleado-extras">
        <DialogHeader>
          <DialogTitle>
            Beneficios para {employee.nombre} {employee.apellidoPaterno}
          </DialogTitle>
          <DialogDescription>
            Configura beneficios adicionales para este empleado.
          </DialogDescription>
        </DialogHeader>

        {loadingEmpleadoExtras ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {activePuestoExtras.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">
                  Beneficios Extra del Puesto ({puesto?.nombrePuesto})
                </h4>
                <div className="rounded-lg bg-muted/50 p-3 space-y-2">
                  {activePuestoExtras.map((extra) => (
                    <div key={extra.id} className="flex justify-between text-sm">
                      <span>{getTipoNombre(extra.tipoBeneficioId)}</span>
                      <span className="font-medium">+{extra.valorExtra} {getUnidadLabel(extra.tipoBeneficioId)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <h4 className="text-sm font-medium">Beneficios Extra Individuales</h4>
              
              {activeEmpleadoExtras.length > 0 && (
                <div className="space-y-2">
                  {activeEmpleadoExtras.map((extra) => (
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
                disabled={tiposBeneficio.length <= activeEmpleadoExtras.length + newRows.length}
                data-testid="button-add-extra-row"
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Beneficio Extra
              </Button>
            </div>
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
