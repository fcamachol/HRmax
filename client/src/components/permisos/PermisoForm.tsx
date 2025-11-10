import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { insertPermisoSchema, type InsertPermiso, type Permiso } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Info } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface PermisoFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Permiso;
}

export function PermisoForm({ open, onOpenChange, initialData }: PermisoFormProps) {
  const isEditing = !!initialData;

  // Helper to normalize datetime to YYYY-MM-DDTHH:MM format
  const normalizeDatetime = (datetime: string | undefined) => {
    if (!datetime) return undefined;
    return datetime.slice(0, 16);
  };

  const getDefaultValues = (): InsertPermiso => {
    if (initialData) {
      return {
        empleadoId: initialData.empleadoId,
        tipo: initialData.tipo as "permiso_personal" | "permiso_medico" | "permiso_oficial",
        fechaHoraInicio: normalizeDatetime(initialData.fechaHoraInicio)!,
        fechaHoraFin: normalizeDatetime(initialData.fechaHoraFin)!,
        horasSolicitadas: initialData.horasSolicitadas || undefined,
        motivo: initialData.motivo || undefined,
        status: initialData.status as "pendiente" | "aprobado" | "rechazado",
        aprobadoPorId: initialData.aprobadoPorId || undefined,
        fechaAprobacion: normalizeDatetime(initialData.fechaAprobacion) || undefined,
        comentariosAprobacion: initialData.comentariosAprobacion || undefined,
      };
    }
    return {
      empleadoId: "",
      tipo: "permiso_personal" as const,
      fechaHoraInicio: new Date().toISOString().slice(0, 16),
      fechaHoraFin: new Date().toISOString().slice(0, 16),
      horasSolicitadas: undefined,
      motivo: undefined,
      status: "pendiente" as const,
      aprobadoPorId: undefined,
      fechaAprobacion: undefined,
      comentariosAprobacion: undefined,
    };
  };

  const form = useForm<InsertPermiso>({
    resolver: zodResolver(insertPermisoSchema),
    defaultValues: getDefaultValues(),
  });

  // Reset form when dialog opens or initialData changes
  useEffect(() => {
    if (open) {
      form.reset(getDefaultValues());
    }
  }, [open, initialData]);

  const fechaHoraInicio = form.watch("fechaHoraInicio");
  const fechaHoraFin = form.watch("fechaHoraFin");
  const status = form.watch("status");

  // Auto-calculate horasSolicitadas when dates change
  useEffect(() => {
    if (fechaHoraInicio && fechaHoraFin) {
      const inicio = new Date(fechaHoraInicio);
      const fin = new Date(fechaHoraFin);
      
      if (fin > inicio) {
        const diffMs = fin.getTime() - inicio.getTime();
        const diffHours = Math.round(diffMs / (1000 * 60 * 60) * 10) / 10; // Round to 1 decimal
        form.setValue("horasSolicitadas", diffHours, { shouldValidate: true });
      } else {
        // Clear stale value when interval is invalid (end <= start)
        form.setValue("horasSolicitadas", undefined, { shouldValidate: true });
      }
    } else {
      // Clear when either date is missing
      form.setValue("horasSolicitadas", undefined, { shouldValidate: true });
    }
  }, [fechaHoraInicio, fechaHoraFin, form]);

  // Auto-set fechaAprobacion when status changes to aprobado/rechazado
  useEffect(() => {
    if ((status === "aprobado" || status === "rechazado") && !form.getValues("fechaAprobacion")) {
      form.setValue("fechaAprobacion", new Date().toISOString().slice(0, 16), { shouldValidate: true });
    }
  }, [status, form]);

  const createMutation = useMutation({
    mutationFn: (data: InsertPermiso) => apiRequest("POST", "/api/permisos", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/permisos"] });
      onOpenChange(false);
      form.reset();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: InsertPermiso) =>
      apiRequest("PATCH", `/api/permisos/${initialData?.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/permisos"] });
      onOpenChange(false);
    },
  });

  const onSubmit = (data: InsertPermiso) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Permiso" : "Nuevo Permiso"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifica los detalles del permiso o actualiza su estado"
              : "Registra una nueva solicitud de permiso"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="empleadoId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ID del Empleado *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Ingresa el ID del empleado"
                        data-testid="input-empleado-id"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Permiso *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-tipo-permiso">
                          <SelectValue placeholder="Selecciona tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="permiso_personal">Personal</SelectItem>
                        <SelectItem value="permiso_medico">Médico</SelectItem>
                        <SelectItem value="permiso_oficial">Oficial</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-xs">
                      Selecciona el tipo de permiso solicitado
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="fechaHoraInicio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha y Hora Inicio *</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          {...field}
                          data-testid="input-fecha-hora-inicio"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fechaHoraFin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha y Hora Fin *</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          {...field}
                          data-testid="input-fecha-hora-fin"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="horasSolicitadas"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horas Solicitadas</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        disabled
                        data-testid="input-horas-solicitadas"
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Se calcula automáticamente según las fechas seleccionadas
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="motivo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Motivo del Permiso</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        value={field.value ?? ""}
                        placeholder="Describe el motivo del permiso..."
                        rows={3}
                        data-testid="textarea-motivo"
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Proporciona detalles sobre la razón del permiso
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center gap-2">
                <h3 className="font-medium">Estado y Aprobación</h3>
                <Info className="h-4 w-4 text-muted-foreground" />
              </div>

              <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                <CardContent className="pt-4">
                  <div className="flex gap-2 text-sm text-blue-800 dark:text-blue-200">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <p>
                      El estado determina si el permiso está pendiente, aprobado o rechazado.
                      Al cambiar a "Aprobado" o "Rechazado", se debe indicar quién aprobó y agregar comentarios.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-status">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pendiente">Pendiente</SelectItem>
                        <SelectItem value="aprobado">Aprobado</SelectItem>
                        <SelectItem value="rechazado">Rechazado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {(status === "aprobado" || status === "rechazado") && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="aprobadoPorId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Aprobado/Rechazado Por</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value ?? ""}
                              placeholder="ID del aprobador"
                              data-testid="input-aprobado-por"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="fechaAprobacion"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fecha de Aprobación</FormLabel>
                          <FormControl>
                            <Input
                              type="datetime-local"
                              {...field}
                              value={field.value ?? ""}
                              data-testid="input-fecha-aprobacion"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="comentariosAprobacion"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Comentarios de Aprobación</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            value={field.value ?? ""}
                            placeholder="Comentarios sobre la decisión..."
                            rows={2}
                            data-testid="textarea-comentarios-aprobacion"
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Agrega comentarios sobre la aprobación o rechazo
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
                data-testid="button-cancelar"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending} data-testid="button-guardar">
                {isPending ? "Guardando..." : isEditing ? "Actualizar" : "Crear"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
