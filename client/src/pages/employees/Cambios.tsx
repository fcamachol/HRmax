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
import { RefreshCw, Plus, Check, X, Play, Filter, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useCliente } from "@/contexts/ClienteContext";
import type { ModificacionPersonal, Employee, Puesto, CentroTrabajo } from "@shared/schema";

export default function Cambios() {
  const { clienteId } = useCliente();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filterTipo, setFilterTipo] = useState<string>("all");
  const [filterEstatus, setFilterEstatus] = useState<string>("all");

  const { data: modificaciones = [], isLoading } = useQuery<ModificacionPersonal[]>({
    queryKey: ["/api/modificaciones-personal", { clienteId }],
    queryFn: async () => {
      const res = await fetch(`/api/modificaciones-personal?clienteId=${clienteId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Error al cargar modificaciones");
      return res.json();
    },
    enabled: !!clienteId,
  });

  const { data: empleados = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees", { clienteId }],
    queryFn: async () => {
      const res = await fetch(`/api/employees?clienteId=${clienteId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Error al cargar empleados");
      return res.json();
    },
    enabled: !!clienteId,
  });

  const { data: puestos = [] } = useQuery<Puesto[]>({
    queryKey: ["/api/puestos", { clienteId }],
    queryFn: async () => {
      const res = await fetch(`/api/puestos?clienteId=${clienteId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Error al cargar puestos");
      return res.json();
    },
    enabled: !!clienteId,
  });

  const { data: centrosTrabajo = [] } = useQuery<CentroTrabajo[]>({
    queryKey: ["/api/centros-trabajo", { clienteId }],
    queryFn: async () => {
      const res = await fetch(`/api/centros-trabajo?clienteId=${clienteId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Error al cargar centros de trabajo");
      return res.json();
    },
    enabled: !!clienteId,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any | any[]) => {
      // Si es un array, crear múltiples modificaciones
      if (Array.isArray(data)) {
        return Promise.all(
          data.map((mod) => apiRequest("POST", "/api/modificaciones-personal", mod))
        );
      }
      // Si es un solo objeto, crear una modificación
      return apiRequest("POST", "/api/modificaciones-personal", data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/modificaciones-personal"] });
      const count = Array.isArray(variables) ? variables.length : 1;
      toast({
        title: count > 1 ? "Modificaciones creadas" : "Modificación creada",
        description: count > 1
          ? `Se han registrado ${count} modificaciones correctamente`
          : "La modificación se ha registrado correctamente",
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
      // Invalidate both modificaciones and employees cache since applying changes the employee data
      queryClient.invalidateQueries({ queryKey: ["/api/modificaciones-personal"] });
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
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
      cuenta_bancaria: "Cuenta Bancaria",
      horario: "Horario de Trabajo",
      registro_patronal: "Registro Patronal",
      contrato: "Tipo de Contrato",
      estatus: "Estatus de Empleo",
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
              <SelectItem value="cuenta_bancaria">Cuenta Bancaria</SelectItem>
              <SelectItem value="horario">Horario de Trabajo</SelectItem>
              <SelectItem value="registro_patronal">Registro Patronal</SelectItem>
              <SelectItem value="contrato">Tipo de Contrato</SelectItem>
              <SelectItem value="estatus">Estatus de Empleo</SelectItem>
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
          <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Registrar Modificación de Personal</DialogTitle>
              <DialogDescription>
                Registra un cambio en los datos de un empleado
              </DialogDescription>
            </DialogHeader>
            <div className="overflow-y-auto flex-1">
              <ModificacionForm
                empleados={empleados}
                puestos={puestos}
                centrosTrabajo={centrosTrabajo}
                onSubmit={(data) => createMutation.mutate(data)}
                isPending={createMutation.isPending}
              />
            </div>
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
                    <TableHead>Creado por</TableHead>
                    <TableHead>Aprobado por</TableHead>
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
                        <span className="text-sm text-muted-foreground">
                          {mod.createdBy || "Sistema"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {mod.aprobadoPor || "-"}
                        </span>
                      </TableCell>
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

type Cambio = {
  id: string;
  tipoModificacion: string;
  valoresNuevos: Record<string, any>;
};

function ModificacionForm({
  empleados,
  puestos,
  centrosTrabajo,
  onSubmit,
  isPending,
}: {
  empleados: Employee[];
  puestos: Puesto[];
  centrosTrabajo: CentroTrabajo[];
  onSubmit: (data: any) => void;
  isPending: boolean;
}) {
  const [formData, setFormData] = useState<{
    empleadoId: string;
    fechaEfectiva: string;
    motivo: string;
    justificacion: string;
    cambios: Cambio[];
  }>({
    empleadoId: "",
    fechaEfectiva: format(new Date(), "yyyy-MM-dd"),
    motivo: "",
    justificacion: "",
    cambios: [],
  });

  const agregarCambio = () => {
    const nuevoCambio: Cambio = {
      id: `cambio-${Date.now()}`,
      tipoModificacion: "",
      valoresNuevos: {},
    };
    setFormData({
      ...formData,
      cambios: [...formData.cambios, nuevoCambio],
    });
  };

  const eliminarCambio = (id: string) => {
    setFormData({
      ...formData,
      cambios: formData.cambios.filter((c) => c.id !== id),
    });
  };

  const actualizarCambio = (id: string, updates: Partial<Cambio>) => {
    setFormData({
      ...formData,
      cambios: formData.cambios.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const empleado = empleados.find((e) => e.id === formData.empleadoId);
    if (!empleado) return;
    if (formData.cambios.length === 0) return;

    // Crear una modificación por cada cambio
    const modificaciones = formData.cambios.map((cambio) => {
      let valoresAnteriores: any = {};
      let valoresNuevos: any = {};

      switch (cambio.tipoModificacion) {
        case "salario":
          valoresAnteriores = { salarioBrutoMensual: empleado.salarioBrutoMensual };
          valoresNuevos = { salarioBrutoMensual: cambio.valoresNuevos.salarioBrutoMensual };
          break;
        case "puesto":
          valoresAnteriores = { puesto: empleado.puesto };
          valoresNuevos = { puesto: cambio.valoresNuevos.puesto };
          break;
        case "centro_trabajo":
          valoresAnteriores = { lugarTrabajo: empleado.lugarTrabajo };
          valoresNuevos = { lugarTrabajo: cambio.valoresNuevos.lugarTrabajo };
          break;
        case "departamento":
          valoresAnteriores = { departamento: empleado.departamento };
          valoresNuevos = { departamento: cambio.valoresNuevos.departamento };
          break;
        case "jefe_directo":
          valoresAnteriores = { jefeDirecto: empleado.jefeDirecto };
          valoresNuevos = { jefeDirecto: cambio.valoresNuevos.jefeDirecto };
          break;
        case "cuenta_bancaria":
          valoresAnteriores = {
            banco: empleado.banco,
            clabe: empleado.clabe,
            cuenta: empleado.cuenta,
            sucursal: empleado.sucursal,
          };
          valoresNuevos = {
            banco: cambio.valoresNuevos.banco,
            clabe: cambio.valoresNuevos.clabe,
            cuenta: cambio.valoresNuevos.cuenta,
            sucursal: cambio.valoresNuevos.sucursal,
          };
          break;
        case "horario":
          valoresAnteriores = {
            horario: empleado.horario,
            diasLaborales: empleado.diasLaborales,
            tipoJornada: empleado.tipoJornada,
          };
          valoresNuevos = {
            horario: cambio.valoresNuevos.horario,
            diasLaborales: cambio.valoresNuevos.diasLaborales,
            tipoJornada: cambio.valoresNuevos.tipoJornada,
          };
          break;
        case "registro_patronal":
          valoresAnteriores = { registroPatronalId: empleado.registroPatronalId };
          valoresNuevos = { registroPatronalId: cambio.valoresNuevos.registroPatronalId };
          break;
        case "contrato":
          valoresAnteriores = {
            tipoContrato: empleado.tipoContrato,
            esquemaContratacion: empleado.esquemaContratacion,
          };
          valoresNuevos = {
            tipoContrato: cambio.valoresNuevos.tipoContrato,
            esquemaContratacion: cambio.valoresNuevos.esquemaContratacion,
          };
          break;
        case "estatus":
          valoresAnteriores = { estatus: empleado.estatus || "activo" };
          valoresNuevos = { estatus: cambio.valoresNuevos.estatus };
          break;
        case "otro":
          valoresAnteriores = {};
          valoresNuevos = { descripcion: cambio.valoresNuevos.descripcion };
          break;
      }

      return {
        empleadoId: formData.empleadoId,
        tipoModificacion: cambio.tipoModificacion,
        fechaEfectiva: formData.fechaEfectiva,
        motivo: formData.motivo,
        justificacion: formData.justificacion,
        valoresAnteriores,
        valoresNuevos,
        clienteId: empleado.clienteId,
        empresaId: empleado.empresaId,
        estatus: "pendiente",
      };
    });

    // Enviar todas las modificaciones
    onSubmit(modificaciones);
  };

  const selectedEmployee = empleados.find((e) => e.id === formData.empleadoId);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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

      <div className="grid grid-cols-2 gap-4">
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

        <div className="space-y-2">
          <Label htmlFor="motivo">Motivo General</Label>
          <Input
            id="motivo"
            value={formData.motivo}
            onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
            placeholder="ej: Promoción, Reubicación"
            data-testid="input-motivo"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="justificacion">Justificación General (opcional)</Label>
        <Textarea
          id="justificacion"
          value={formData.justificacion}
          onChange={(e) =>
            setFormData({ ...formData, justificacion: e.target.value })
          }
          placeholder="Detalles adicionales sobre los cambios"
          rows={2}
          data-testid="input-justificacion"
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-base">Cambios a Aplicar</Label>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={agregarCambio}
            data-testid="button-agregar-cambio"
          >
            <Plus className="h-4 w-4 mr-1" />
            Agregar Cambio
          </Button>
        </div>

        <div className="space-y-3">
          {formData.cambios.length === 0 && (
            <div className="p-4 border border-dashed rounded-md text-center text-sm text-muted-foreground">
              Haz clic en "Agregar Cambio" para incluir modificaciones
            </div>
          )}

          {formData.cambios.map((cambio) => (
            <CambioCard
              key={cambio.id}
              cambio={cambio}
              empleado={selectedEmployee}
              puestos={puestos}
              centrosTrabajo={centrosTrabajo}
              onUpdate={(updates) => actualizarCambio(cambio.id, updates)}
              onRemove={() => eliminarCambio(cambio.id)}
            />
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t sticky bottom-0 bg-background">
        <Button
          type="submit"
          disabled={isPending || formData.cambios.length === 0}
          data-testid="button-submit"
        >
          {isPending ? "Guardando..." : `Registrar ${formData.cambios.length} Cambio${formData.cambios.length !== 1 ? 's' : ''}`}
        </Button>
      </div>
    </form>
  );
}

function CambioCard({
  cambio,
  empleado,
  puestos,
  centrosTrabajo,
  onUpdate,
  onRemove,
}: {
  cambio: Cambio;
  empleado: Employee | undefined;
  puestos: Puesto[];
  centrosTrabajo: CentroTrabajo[];
  onUpdate: (updates: Partial<Cambio>) => void;
  onRemove: () => void;
}) {
  const [showNewPuestoDialog, setShowNewPuestoDialog] = useState(false);
  const [showNewCentroDialog, setShowNewCentroDialog] = useState(false);
  const [newPuestoName, setNewPuestoName] = useState("");
  const [newCentroName, setNewCentroName] = useState("");
  const { toast } = useToast();
  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 space-y-2">
            <Label>Tipo de Cambio</Label>
            <Select
              value={cambio.tipoModificacion}
              onValueChange={(value) =>
                onUpdate({ tipoModificacion: value, valoresNuevos: {} })
              }
            >
              <SelectTrigger data-testid={`select-tipo-${cambio.id}`}>
                <SelectValue placeholder="Seleccionar tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="salario">Cambio de Salario</SelectItem>
                <SelectItem value="puesto">Cambio de Puesto</SelectItem>
                <SelectItem value="centro_trabajo">Cambio de Centro de Trabajo</SelectItem>
                <SelectItem value="departamento">Cambio de Departamento</SelectItem>
                <SelectItem value="jefe_directo">Cambio de Jefe Directo</SelectItem>
                <SelectItem value="cuenta_bancaria">Cuenta Bancaria</SelectItem>
                <SelectItem value="horario">Horario de Trabajo</SelectItem>
                <SelectItem value="registro_patronal">Registro Patronal</SelectItem>
                <SelectItem value="contrato">Tipo de Contrato</SelectItem>
                <SelectItem value="estatus">Estatus de Empleo</SelectItem>
                <SelectItem value="otro">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={onRemove}
            data-testid={`button-remove-${cambio.id}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        {empleado && cambio.tipoModificacion && (
          <>
            <div className="space-y-2">
              <Label>Valor Actual</Label>
              <div className="p-2 bg-muted rounded-md text-sm">
                {cambio.tipoModificacion === "salario" && (
                  <div>Salario: ${empleado.salarioBrutoMensual}</div>
                )}
                {cambio.tipoModificacion === "puesto" && (
                  <div>Puesto: {empleado.puesto}</div>
                )}
                {cambio.tipoModificacion === "centro_trabajo" && (
                  <div>Centro: {empleado.lugarTrabajo || "No especificado"}</div>
                )}
                {cambio.tipoModificacion === "departamento" && (
                  <div>Departamento: {empleado.departamento}</div>
                )}
                {cambio.tipoModificacion === "jefe_directo" && (
                  <div>Jefe Directo: {empleado.jefeDirecto || "No especificado"}</div>
                )}
                {cambio.tipoModificacion === "cuenta_bancaria" && (
                  <div className="space-y-1">
                    <div>Banco: {empleado.banco || "No especificado"}</div>
                    <div>CLABE: {empleado.clabe || "No especificado"}</div>
                    <div>Cuenta: {empleado.cuenta || "No especificado"}</div>
                    <div>Sucursal: {empleado.sucursal || "No especificado"}</div>
                  </div>
                )}
                {cambio.tipoModificacion === "horario" && (
                  <div className="space-y-1">
                    <div>Horario: {empleado.horario || "No especificado"}</div>
                    <div>Días Laborales: {empleado.diasLaborales || "No especificado"}</div>
                    <div>Tipo Jornada: {empleado.tipoJornada || "No especificado"}</div>
                  </div>
                )}
                {cambio.tipoModificacion === "registro_patronal" && (
                  <div>Registro Patronal ID: {empleado.registroPatronalId || "No especificado"}</div>
                )}
                {cambio.tipoModificacion === "contrato" && (
                  <div className="space-y-1">
                    <div>Tipo Contrato: {empleado.tipoContrato || "No especificado"}</div>
                    <div>Esquema: {empleado.esquemaContratacion || "No especificado"}</div>
                  </div>
                )}
                {cambio.tipoModificacion === "estatus" && (
                  <div>Estatus: {empleado.estatus || "activo"}</div>
                )}
                {cambio.tipoModificacion === "otro" && (
                  <div>Ver campos adicionales abajo</div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Nuevo Valor</Label>
                {(cambio.tipoModificacion === "puesto" || cambio.tipoModificacion === "centro_trabajo") && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (cambio.tipoModificacion === "puesto") {
                        setShowNewPuestoDialog(true);
                      } else {
                        setShowNewCentroDialog(true);
                      }
                    }}
                    data-testid={`button-add-new-${cambio.id}`}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Nuevo
                  </Button>
                )}
              </div>
              
              {cambio.tipoModificacion === "salario" && (
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Nuevo salario"
                  value={cambio.valoresNuevos.salarioBrutoMensual || ""}
                  onChange={(e) =>
                    onUpdate({
                      valoresNuevos: { salarioBrutoMensual: e.target.value },
                    })
                  }
                  data-testid={`input-valor-${cambio.id}`}
                />
              )}

              {cambio.tipoModificacion === "puesto" && (
                <Select
                  value={cambio.valoresNuevos.puesto || ""}
                  onValueChange={(value) =>
                    onUpdate({
                      valoresNuevos: { puesto: value },
                    })
                  }
                >
                  <SelectTrigger data-testid={`select-puesto-${cambio.id}`}>
                    <SelectValue placeholder="Seleccionar puesto" />
                  </SelectTrigger>
                  <SelectContent>
                    {puestos.map((puesto) => (
                      <SelectItem key={puesto.id} value={puesto.nombrePuesto}>
                        {puesto.nombrePuesto}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {cambio.tipoModificacion === "centro_trabajo" && (
                <Select
                  value={cambio.valoresNuevos.centroTrabajoId || ""}
                  onValueChange={(value) => {
                    const centro = centrosTrabajo.find(c => c.id === value);
                    onUpdate({
                      valoresNuevos: { 
                        centroTrabajoId: value,
                        lugarTrabajo: centro?.nombre || ""
                      },
                    });
                  }}
                >
                  <SelectTrigger data-testid={`select-centro-${cambio.id}`}>
                    <SelectValue placeholder="Seleccionar centro de trabajo" />
                  </SelectTrigger>
                  <SelectContent>
                    {centrosTrabajo.map((centro) => (
                      <SelectItem key={centro.id} value={centro.id}>
                        {centro.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {cambio.tipoModificacion === "departamento" && (
                <Input
                  type="text"
                  placeholder="Nuevo departamento"
                  value={cambio.valoresNuevos.departamento || ""}
                  onChange={(e) =>
                    onUpdate({
                      valoresNuevos: { departamento: e.target.value },
                    })
                  }
                  data-testid={`input-valor-${cambio.id}`}
                />
              )}

              {cambio.tipoModificacion === "jefe_directo" && (
                <Input
                  type="text"
                  placeholder="Nombre del nuevo jefe directo"
                  value={cambio.valoresNuevos.jefeDirecto || ""}
                  onChange={(e) =>
                    onUpdate({
                      valoresNuevos: { jefeDirecto: e.target.value },
                    })
                  }
                  data-testid={`input-valor-${cambio.id}`}
                />
              )}

              {cambio.tipoModificacion === "cuenta_bancaria" && (
                <div className="space-y-3">
                  <Input
                    type="text"
                    placeholder="Banco"
                    value={cambio.valoresNuevos.banco || ""}
                    onChange={(e) =>
                      onUpdate({
                        valoresNuevos: { ...cambio.valoresNuevos, banco: e.target.value },
                      })
                    }
                  />
                  <Input
                    type="text"
                    placeholder="CLABE (18 dígitos)"
                    maxLength={18}
                    value={cambio.valoresNuevos.clabe || ""}
                    onChange={(e) =>
                      onUpdate({
                        valoresNuevos: { ...cambio.valoresNuevos, clabe: e.target.value },
                      })
                    }
                  />
                  <Input
                    type="text"
                    placeholder="Número de cuenta"
                    value={cambio.valoresNuevos.cuenta || ""}
                    onChange={(e) =>
                      onUpdate({
                        valoresNuevos: { ...cambio.valoresNuevos, cuenta: e.target.value },
                      })
                    }
                  />
                  <Input
                    type="text"
                    placeholder="Sucursal"
                    value={cambio.valoresNuevos.sucursal || ""}
                    onChange={(e) =>
                      onUpdate({
                        valoresNuevos: { ...cambio.valoresNuevos, sucursal: e.target.value },
                      })
                    }
                  />
                </div>
              )}

              {cambio.tipoModificacion === "horario" && (
                <div className="space-y-3">
                  <Input
                    type="text"
                    placeholder="Horario (ej: 9:00 - 18:00)"
                    value={cambio.valoresNuevos.horario || ""}
                    onChange={(e) =>
                      onUpdate({
                        valoresNuevos: { ...cambio.valoresNuevos, horario: e.target.value },
                      })
                    }
                  />
                  <Input
                    type="text"
                    placeholder="Días laborales (ej: Lunes a Viernes)"
                    value={cambio.valoresNuevos.diasLaborales || ""}
                    onChange={(e) =>
                      onUpdate({
                        valoresNuevos: { ...cambio.valoresNuevos, diasLaborales: e.target.value },
                      })
                    }
                  />
                  <Select
                    value={cambio.valoresNuevos.tipoJornada || ""}
                    onValueChange={(value) =>
                      onUpdate({
                        valoresNuevos: { ...cambio.valoresNuevos, tipoJornada: value },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tipo de jornada" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="diurna">Diurna</SelectItem>
                      <SelectItem value="nocturna">Nocturna</SelectItem>
                      <SelectItem value="mixta">Mixta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {cambio.tipoModificacion === "registro_patronal" && (
                <Input
                  type="text"
                  placeholder="ID de Registro Patronal"
                  value={cambio.valoresNuevos.registroPatronalId || ""}
                  onChange={(e) =>
                    onUpdate({
                      valoresNuevos: { registroPatronalId: e.target.value },
                    })
                  }
                  data-testid={`input-valor-${cambio.id}`}
                />
              )}

              {cambio.tipoModificacion === "contrato" && (
                <div className="space-y-3">
                  <Select
                    value={cambio.valoresNuevos.tipoContrato || ""}
                    onValueChange={(value) =>
                      onUpdate({
                        valoresNuevos: { ...cambio.valoresNuevos, tipoContrato: value },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tipo de contrato" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="indefinido">Indefinido</SelectItem>
                      <SelectItem value="temporal">Temporal</SelectItem>
                      <SelectItem value="obra_determinada">Obra Determinada</SelectItem>
                      <SelectItem value="tiempo_determinado">Tiempo Determinado</SelectItem>
                      <SelectItem value="capacitacion">Capacitación</SelectItem>
                      <SelectItem value="periodo_prueba">Periodo de Prueba</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={cambio.valoresNuevos.esquemaContratacion || ""}
                    onValueChange={(value) =>
                      onUpdate({
                        valoresNuevos: { ...cambio.valoresNuevos, esquemaContratacion: value },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Esquema de contratación" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nomina">Nómina</SelectItem>
                      <SelectItem value="asimilados">Asimilados a Salarios</SelectItem>
                      <SelectItem value="honorarios">Honorarios</SelectItem>
                      <SelectItem value="outsourcing">Outsourcing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {cambio.tipoModificacion === "estatus" && (
                <Select
                  value={cambio.valoresNuevos.estatus || ""}
                  onValueChange={(value) =>
                    onUpdate({
                      valoresNuevos: { estatus: value },
                    })
                  }
                >
                  <SelectTrigger data-testid={`select-estatus-${cambio.id}`}>
                    <SelectValue placeholder="Nuevo estatus" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activo">Activo</SelectItem>
                    <SelectItem value="inactivo">Inactivo (Baja)</SelectItem>
                    <SelectItem value="licencia">Licencia</SelectItem>
                    <SelectItem value="incapacidad">Incapacidad</SelectItem>
                    <SelectItem value="vacaciones">Vacaciones</SelectItem>
                  </SelectContent>
                </Select>
              )}

              {cambio.tipoModificacion === "otro" && (
                <Textarea
                  placeholder="Describe el cambio a realizar..."
                  value={cambio.valoresNuevos.descripcion || ""}
                  onChange={(e) =>
                    onUpdate({
                      valoresNuevos: { descripcion: e.target.value },
                    })
                  }
                  rows={3}
                />
              )}
            </div>

          </>
        )}
      </CardContent>

      <Dialog open={showNewPuestoDialog} onOpenChange={setShowNewPuestoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Nuevo Puesto</DialogTitle>
            <DialogDescription>
              Ingresa el nombre del nuevo puesto
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPuestoName">Nombre del Puesto</Label>
              <Input
                id="newPuestoName"
                value={newPuestoName}
                onChange={(e) => setNewPuestoName(e.target.value)}
                placeholder="ej: Desarrollador Senior"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowNewPuestoDialog(false);
                  setNewPuestoName("");
                }}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={async () => {
                  if (!newPuestoName.trim() || !empleado) return;
                  try {
                    await apiRequest("POST", "/api/puestos", {
                      nombrePuesto: newPuestoName.trim(),
                      clavePuesto: `PUESTO-${Date.now()}`,
                      clienteId: empleado.clienteId,
                      empresaId: empleado.empresaId,
                    });
                    queryClient.invalidateQueries({ queryKey: ["/api/puestos"] });
                    onUpdate({ valoresNuevos: { puesto: newPuestoName.trim() } });
                    setShowNewPuestoDialog(false);
                    setNewPuestoName("");
                    toast({
                      title: "Puesto creado",
                      description: "El nuevo puesto se ha agregado correctamente",
                    });
                  } catch (error: any) {
                    toast({
                      title: "Error",
                      description: error.message || "No se pudo crear el puesto",
                      variant: "destructive",
                    });
                  }
                }}
              >
                Crear Puesto
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showNewCentroDialog} onOpenChange={setShowNewCentroDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Nuevo Centro de Trabajo</DialogTitle>
            <DialogDescription>
              Ingresa el nombre del nuevo centro de trabajo
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newCentroName">Nombre del Centro</Label>
              <Input
                id="newCentroName"
                value={newCentroName}
                onChange={(e) => setNewCentroName(e.target.value)}
                placeholder="ej: Oficina Central CDMX"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowNewCentroDialog(false);
                  setNewCentroName("");
                }}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={async () => {
                  if (!newCentroName.trim() || !empleado) return;
                  try {
                    await apiRequest("POST", "/api/centros-trabajo", {
                      nombre: newCentroName.trim(),
                      empresaId: empleado.empresaId,
                    });
                    queryClient.invalidateQueries({ queryKey: ["/api/centros-trabajo"] });
                    onUpdate({ valoresNuevos: { lugarTrabajo: newCentroName.trim() } });
                    setShowNewCentroDialog(false);
                    setNewCentroName("");
                    toast({
                      title: "Centro de trabajo creado",
                      description: "El nuevo centro de trabajo se ha agregado correctamente",
                    });
                  } catch (error: any) {
                    toast({
                      title: "Error",
                      description: error.message || "No se pudo crear el centro de trabajo",
                      variant: "destructive",
                    });
                  }
                }}
              >
                Crear Centro
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
