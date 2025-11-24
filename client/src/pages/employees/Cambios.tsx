import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { RefreshCw, Plus, Check, X, Play, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { ModificacionPersonal, Employee } from "@shared/schema";

export default function Cambios() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filterTipo, setFilterTipo] = useState<string>("all");
  const [filterEstatus, setFilterEstatus] = useState<string>("all");

  const { data: modificaciones = [], isLoading } = useQuery<ModificacionPersonal[]>({
    queryKey: ["/api/modificaciones-personal"],
  });

  const { data: empleados = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/modificaciones-personal", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/modificaciones-personal"] });
      toast({
        title: "Modificación creada",
        description: "La modificación se ha registrado correctamente",
      });
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear la modificación",
        variant: "destructive",
      });
    },
  });

  const aprobarMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("POST", `/api/modificaciones-personal/${id}/aprobar`, { aprobadoPor: "admin" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/modificaciones-personal"] });
      toast({
        title: "Modificación aprobada",
        description: "La modificación se ha aprobado correctamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo aprobar la modificación",
        variant: "destructive",
      });
    },
  });

  const rechazarMutation = useMutation({
    mutationFn: async ({ id, notas }: { id: string; notas: string }) => {
      return apiRequest("POST", `/api/modificaciones-personal/${id}/rechazar`, { notasRechazo: notas });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/modificaciones-personal"] });
      toast({
        title: "Modificación rechazada",
        description: "La modificación se ha rechazado",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo rechazar la modificación",
        variant: "destructive",
      });
    },
  });

  const aplicarMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("POST", `/api/modificaciones-personal/${id}/aplicar`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/modificaciones-personal"] });
      toast({
        title: "Modificación aplicada",
        description: "La modificación se ha aplicado al empleado",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo aplicar la modificación",
        variant: "destructive",
      });
    },
  });

  const filteredModificaciones = modificaciones.filter((mod) => {
    if (filterTipo !== "all" && mod.tipoModificacion !== filterTipo) return false;
    if (filterEstatus !== "all" && mod.estatus !== filterEstatus) return false;
    return true;
  });

  const getEmpleadoNombre = (empleadoId: string) => {
    const empleado = empleados.find((e) => e.id === empleadoId);
    return empleado ? `${empleado.nombre} ${empleado.apellidoPaterno}` : "Desconocido";
  };

  const getEstatusColor = (estatus: string) => {
    switch (estatus) {
      case "pendiente":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "aprobada":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "rechazada":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case "aplicada":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      default:
        return "";
    }
  };

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      salario: "Cambio de Salario",
      puesto: "Cambio de Puesto",
      centro_trabajo: "Cambio de Centro de Trabajo",
      departamento: "Cambio de Departamento",
      jefe_directo: "Cambio de Jefe Directo",
      otro: "Otro",
    };
    return labels[tipo] || tipo;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Cambios</h1>
        <p className="text-muted-foreground mt-2">
          Gestión de cambios de salario, puesto y centro de trabajo
        </p>
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filterTipo} onValueChange={setFilterTipo}>
            <SelectTrigger className="w-[200px]" data-testid="select-filter-tipo">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              <SelectItem value="salario">Cambio de Salario</SelectItem>
              <SelectItem value="puesto">Cambio de Puesto</SelectItem>
              <SelectItem value="centro_trabajo">Cambio de Centro</SelectItem>
              <SelectItem value="departamento">Cambio de Departamento</SelectItem>
              <SelectItem value="jefe_directo">Cambio de Jefe</SelectItem>
              <SelectItem value="otro">Otro</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterEstatus} onValueChange={setFilterEstatus}>
            <SelectTrigger className="w-[180px]" data-testid="select-filter-estatus">
              <SelectValue placeholder="Estatus" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estatus</SelectItem>
              <SelectItem value="pendiente">Pendiente</SelectItem>
              <SelectItem value="aprobada">Aprobada</SelectItem>
              <SelectItem value="rechazada">Rechazada</SelectItem>
              <SelectItem value="aplicada">Aplicada</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-nueva-modificacion">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Modificación
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Registrar Modificación de Personal</DialogTitle>
              <DialogDescription>
                Registra un cambio en los datos de un empleado
              </DialogDescription>
            </DialogHeader>
            <ModificacionForm
              empleados={empleados}
              onSubmit={(data) => createMutation.mutate(data)}
              isPending={createMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-primary" />
            <CardTitle>Historial de Modificaciones</CardTitle>
          </div>
          <CardDescription>
            Registro completo de cambios en el personal
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Cargando modificaciones...
            </div>
          ) : filteredModificaciones.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No se encontraron modificaciones
            </div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empleado</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Fecha Efectiva</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead>Estatus</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredModificaciones.map((mod) => (
                    <TableRow key={mod.id} data-testid={`row-modificacion-${mod.id}`}>
                      <TableCell className="font-medium">
                        {getEmpleadoNombre(mod.empleadoId)}
                      </TableCell>
                      <TableCell>{getTipoLabel(mod.tipoModificacion)}</TableCell>
                      <TableCell>
                        {mod.fechaEfectiva
                          ? format(new Date(mod.fechaEfectiva), "dd MMM yyyy", { locale: es })
                          : "-"}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{mod.motivo}</TableCell>
                      <TableCell>
                        <Badge className={getEstatusColor(mod.estatus)} variant="outline">
                          {mod.estatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {mod.estatus === "pendiente" && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => aprobarMutation.mutate(mod.id)}
                                disabled={aprobarMutation.isPending}
                                data-testid={`button-aprobar-${mod.id}`}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  rechazarMutation.mutate({
                                    id: mod.id,
                                    notas: "Rechazado por el administrador",
                                  })
                                }
                                disabled={rechazarMutation.isPending}
                                data-testid={`button-rechazar-${mod.id}`}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {mod.estatus === "aprobada" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => aplicarMutation.mutate(mod.id)}
                              disabled={aplicarMutation.isPending}
                              data-testid={`button-aplicar-${mod.id}`}
                            >
                              <Play className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ModificacionForm({
  empleados,
  onSubmit,
  isPending,
}: {
  empleados: Employee[];
  onSubmit: (data: any) => void;
  isPending: boolean;
}) {
  const [formData, setFormData] = useState<{
    empleadoId: string;
    tipoModificacion: string;
    fechaEfectiva: string;
    motivo: string;
    justificacion: string;
    valoresAnteriores: Record<string, any>;
    valoresNuevos: Record<string, any>;
    incluyeCambioSalario?: boolean;
  }>({
    empleadoId: "",
    tipoModificacion: "",
    fechaEfectiva: format(new Date(), "yyyy-MM-dd"),
    motivo: "",
    justificacion: "",
    valoresAnteriores: {},
    valoresNuevos: {},
    incluyeCambioSalario: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Get employee data for current values
    const empleado = empleados.find((e) => e.id === formData.empleadoId);
    if (!empleado) return;

    // Build valores anteriores and nuevos based on tipo
    let valoresAnteriores: any = {};
    let valoresNuevos: any = {};

    switch (formData.tipoModificacion) {
      case "salario":
        valoresAnteriores = { salarioBrutoMensual: empleado.salarioBrutoMensual };
        valoresNuevos = { salarioBrutoMensual: formData.valoresNuevos.salarioBrutoMensual };
        break;
      case "puesto":
        valoresAnteriores = { puesto: empleado.puesto };
        valoresNuevos = { puesto: formData.valoresNuevos.puesto };
        // Si se incluye cambio de salario opcional
        if (formData.incluyeCambioSalario && formData.valoresNuevos.salarioBrutoMensual) {
          valoresAnteriores.salarioBrutoMensual = empleado.salarioBrutoMensual;
          valoresNuevos.salarioBrutoMensual = formData.valoresNuevos.salarioBrutoMensual;
        }
        break;
      case "centro_trabajo":
        valoresAnteriores = { lugarTrabajo: empleado.lugarTrabajo };
        valoresNuevos = { lugarTrabajo: formData.valoresNuevos.lugarTrabajo };
        break;
      case "departamento":
        valoresAnteriores = { departamento: empleado.departamento };
        valoresNuevos = { departamento: formData.valoresNuevos.departamento };
        break;
    }

    const payload = {
      empleadoId: formData.empleadoId,
      tipoModificacion: formData.tipoModificacion,
      fechaEfectiva: formData.fechaEfectiva,
      motivo: formData.motivo,
      justificacion: formData.justificacion,
      valoresAnteriores,
      valoresNuevos,
      clienteId: empleado.clienteId,
      empresaId: empleado.empresaId,
      estatus: "pendiente",
    };

    onSubmit(payload);
  };

  const selectedEmployee = empleados.find((e) => e.id === formData.empleadoId);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="empleadoId">Empleado</Label>
        <Select
          value={formData.empleadoId}
          onValueChange={(value) =>
            setFormData({ ...formData, empleadoId: value })
          }
        >
          <SelectTrigger data-testid="select-empleado">
            <SelectValue placeholder="Seleccionar empleado" />
          </SelectTrigger>
          <SelectContent>
            {empleados.map((emp) => (
              <SelectItem key={emp.id} value={emp.id}>
                {emp.nombre} {emp.apellidoPaterno} - {emp.numeroEmpleado}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="tipoModificacion">Tipo de Modificación</Label>
        <Select
          value={formData.tipoModificacion}
          onValueChange={(value) =>
            setFormData({ ...formData, tipoModificacion: value })
          }
        >
          <SelectTrigger data-testid="select-tipo">
            <SelectValue placeholder="Seleccionar tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="salario">Cambio de Salario</SelectItem>
            <SelectItem value="puesto">Cambio de Puesto</SelectItem>
            <SelectItem value="centro_trabajo">Cambio de Centro de Trabajo</SelectItem>
            <SelectItem value="departamento">Cambio de Departamento</SelectItem>
            <SelectItem value="jefe_directo">Cambio de Jefe Directo</SelectItem>
            <SelectItem value="otro">Otro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="fechaEfectiva">Fecha Efectiva</Label>
        <Input
          id="fechaEfectiva"
          type="date"
          value={formData.fechaEfectiva}
          onChange={(e) =>
            setFormData({ ...formData, fechaEfectiva: e.target.value })
          }
          data-testid="input-fecha-efectiva"
        />
      </div>

      {selectedEmployee && formData.tipoModificacion && (
        <div className="space-y-2">
          <Label>Valor Actual</Label>
          <div className="p-3 bg-muted rounded-md text-sm space-y-1">
            {formData.tipoModificacion === "salario" && (
              <div>Salario Actual: ${selectedEmployee.salarioBrutoMensual}</div>
            )}
            {formData.tipoModificacion === "puesto" && (
              <>
                <div>Puesto Actual: {selectedEmployee.puesto}</div>
                {formData.incluyeCambioSalario && (
                  <div>Salario Actual: ${selectedEmployee.salarioBrutoMensual}</div>
                )}
              </>
            )}
            {formData.tipoModificacion === "centro_trabajo" && (
              <div>Centro Actual: {selectedEmployee.lugarTrabajo || "No especificado"}</div>
            )}
            {formData.tipoModificacion === "departamento" && (
              <div>Departamento Actual: {selectedEmployee.departamento}</div>
            )}
          </div>
        </div>
      )}

      {formData.tipoModificacion && (
        <div className="space-y-2">
          <Label htmlFor="nuevoValor">Nuevo Valor</Label>
          {formData.tipoModificacion === "salario" ? (
            <Input
              id="nuevoValor"
              type="number"
              step="0.01"
              placeholder="Nuevo salario"
              onChange={(e) =>
                setFormData({
                  ...formData,
                  valoresNuevos: { salarioBrutoMensual: e.target.value },
                })
              }
              data-testid="input-nuevo-valor"
            />
          ) : (
            <Input
              id="nuevoValor"
              type="text"
              placeholder="Nuevo valor"
              onChange={(e) =>
                setFormData({
                  ...formData,
                  valoresNuevos: {
                    [formData.tipoModificacion === "centro_trabajo"
                      ? "lugarTrabajo"
                      : formData.tipoModificacion]: e.target.value,
                  },
                })
              }
              data-testid="input-nuevo-valor"
            />
          )}
        </div>
      )}

      {formData.tipoModificacion === "puesto" && (
        <>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="incluyeCambioSalario"
              checked={formData.incluyeCambioSalario}
              onCheckedChange={(checked) =>
                setFormData({
                  ...formData,
                  incluyeCambioSalario: checked === true,
                  valoresNuevos: {
                    ...formData.valoresNuevos,
                    ...(checked !== true && { salarioBrutoMensual: undefined }),
                  },
                })
              }
              data-testid="checkbox-cambio-salario"
            />
            <Label
              htmlFor="incluyeCambioSalario"
              className="text-sm font-normal cursor-pointer"
            >
              Incluir cambio de salario (opcional)
            </Label>
          </div>

          {formData.incluyeCambioSalario && (
            <div className="space-y-2">
              <Label htmlFor="nuevoSalario">Nuevo Salario</Label>
              <Input
                id="nuevoSalario"
                type="number"
                step="0.01"
                placeholder="Nuevo salario bruto mensual"
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    valoresNuevos: {
                      ...formData.valoresNuevos,
                      salarioBrutoMensual: e.target.value,
                    },
                  })
                }
                data-testid="input-nuevo-salario"
              />
            </div>
          )}
        </>
      )}

      <div className="space-y-2">
        <Label htmlFor="motivo">Motivo</Label>
        <Input
          id="motivo"
          value={formData.motivo}
          onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
          placeholder="ej: Promoción, Ajuste de mercado"
          required
          data-testid="input-motivo"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="justificacion">Justificación (opcional)</Label>
        <Textarea
          id="justificacion"
          value={formData.justificacion}
          onChange={(e) =>
            setFormData({ ...formData, justificacion: e.target.value })
          }
          placeholder="Detalles adicionales sobre el cambio"
          rows={3}
          data-testid="input-justificacion"
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit" disabled={isPending} data-testid="button-submit">
          {isPending ? "Guardando..." : "Registrar Modificación"}
        </Button>
      </div>
    </form>
  );
}
