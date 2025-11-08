import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { EmpleadoCentroTrabajo, Employee, InsertEmpleadoCentroTrabajo } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertEmpleadoCentroTrabajoSchema } from "@shared/schema";
import { Loader2 } from "lucide-react";

interface AsignacionEmpleadosProps {
  centroTrabajoId: string;
}

export default function AsignacionEmpleados({ centroTrabajoId }: AsignacionEmpleadosProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAsignacion, setEditingAsignacion] = useState<EmpleadoCentroTrabajo | null>(null);
  const { toast } = useToast();

  const { data: asignaciones = [], isLoading } = useQuery<EmpleadoCentroTrabajo[]>({
    queryKey: ["/api/empleados-centros-trabajo", centroTrabajoId],
    queryFn: () =>
      fetch(`/api/empleados-centros-trabajo?centroTrabajoId=${centroTrabajoId}`).then((res) =>
        res.json()
      ),
  });

  const { data: empleados = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const deleteAsignacionMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/empleados-centros-trabajo/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/empleados-centros-trabajo", centroTrabajoId] });
      toast({
        title: "Asignación eliminada",
        description: "El empleado ha sido desasignado del centro de trabajo",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar la asignación",
        variant: "destructive",
      });
    },
  });

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingAsignacion(null);
    queryClient.invalidateQueries({ queryKey: ["/api/empleados-centros-trabajo", centroTrabajoId] });
  };

  const handleEdit = (asignacion: EmpleadoCentroTrabajo) => {
    setEditingAsignacion(asignacion);
    setIsFormOpen(true);
  };

  const getEmpleadoName = (empleadoId: string) => {
    const empleado = empleados.find((e) => e.id === empleadoId);
    return empleado
      ? `${empleado.firstName} ${empleado.lastName}`
      : "Empleado no encontrado";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-muted-foreground">Cargando asignaciones...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {asignaciones.length} empleado(s) asignado(s)
        </p>
        <Dialog
          open={isFormOpen}
          onOpenChange={(open) => {
            setIsFormOpen(open);
            if (!open) setEditingAsignacion(null);
          }}
        >
          <DialogTrigger asChild>
            <Button size="sm" data-testid="button-asignar-empleado">
              <Plus className="mr-2 h-4 w-4" />
              Asignar Empleado
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingAsignacion ? "Editar Asignación" : "Asignar Empleado"}
              </DialogTitle>
              <DialogDescription>
                {editingAsignacion
                  ? "Actualiza las fechas de asignación del empleado"
                  : "Asigna un empleado a este centro de trabajo"}
              </DialogDescription>
            </DialogHeader>
            <AsignacionForm
              centroTrabajoId={centroTrabajoId}
              asignacion={editingAsignacion}
              onSuccess={handleFormSuccess}
              onCancel={() => {
                setIsFormOpen(false);
                setEditingAsignacion(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {asignaciones.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <UserPlus className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              No hay empleados asignados
            </h3>
            <p className="text-sm text-muted-foreground mb-4 text-center">
              Comienza asignando empleados a este centro de trabajo
            </p>
            <Button onClick={() => setIsFormOpen(true)} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Asignar Primer Empleado
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {asignaciones.map((asignacion) => (
            <Card key={asignacion.id} className="hover-elevate">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium">
                      {getEmpleadoName(asignacion.empleadoId)}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        Desde: {new Date(asignacion.fechaInicio).toLocaleDateString()}
                      </span>
                      {asignacion.fechaFin && (
                        <>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground">
                            Hasta: {new Date(asignacion.fechaFin).toLocaleDateString()}
                          </span>
                        </>
                      )}
                      {!asignacion.fechaFin && (
                        <Badge variant="default" className="text-xs">
                          Activo
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(asignacion)}
                      data-testid={`button-editar-asignacion-${asignacion.id}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          data-testid={`button-eliminar-asignacion-${asignacion.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            ¿Eliminar asignación?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción no se puede deshacer. Se eliminará la
                            asignación del empleado a este centro de trabajo.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() =>
                              deleteAsignacionMutation.mutate(asignacion.id!)
                            }
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

interface AsignacionFormProps {
  centroTrabajoId: string;
  asignacion?: EmpleadoCentroTrabajo | null;
  onSuccess: () => void;
  onCancel: () => void;
}

function AsignacionForm({
  centroTrabajoId,
  asignacion,
  onSuccess,
  onCancel,
}: AsignacionFormProps) {
  const { toast } = useToast();
  const isEditing = !!asignacion;

  const { data: empleados = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const form = useForm<InsertEmpleadoCentroTrabajo>({
    resolver: zodResolver(insertEmpleadoCentroTrabajoSchema),
    defaultValues: {
      empleadoId: asignacion?.empleadoId || "",
      centroTrabajoId: centroTrabajoId,
      fechaInicio: asignacion?.fechaInicio
        ? new Date(asignacion.fechaInicio).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      fechaFin: asignacion?.fechaFin
        ? new Date(asignacion.fechaFin).toISOString().split("T")[0]
        : undefined,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: InsertEmpleadoCentroTrabajo) => {
      if (isEditing && asignacion?.id) {
        return await apiRequest(
          "PATCH",
          `/api/empleados-centros-trabajo/${asignacion.id}`,
          data
        );
      }
      return await apiRequest("POST", "/api/empleados-centros-trabajo", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/empleados-centros-trabajo", centroTrabajoId] });
      toast({
        title: isEditing ? "Asignación actualizada" : "Empleado asignado",
        description: isEditing
          ? "La asignación ha sido actualizada correctamente"
          : "El empleado ha sido asignado al centro de trabajo",
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar la asignación",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertEmpleadoCentroTrabajo) => {
    mutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="empleadoId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Empleado</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={isEditing}
              >
                <FormControl>
                  <SelectTrigger data-testid="select-empleado">
                    <SelectValue placeholder="Selecciona un empleado" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {empleados.map((empleado) => (
                    <SelectItem key={empleado.id} value={empleado.id!}>
                      {empleado.firstName} {empleado.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="fechaInicio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fecha de Inicio</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="date"
                  data-testid="input-fecha-inicio"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="fechaFin"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fecha de Fin (Opcional)</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value || ""}
                  type="date"
                  placeholder="Dejar vacío para asignación indefinida"
                  data-testid="input-fecha-fin"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={mutation.isPending}
            data-testid="button-cancelar-asignacion"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={mutation.isPending}
            data-testid="button-guardar-asignacion"
          >
            {mutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {isEditing ? "Actualizar" : "Asignar"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
