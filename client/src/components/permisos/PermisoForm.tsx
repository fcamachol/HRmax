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
import { Checkbox } from "@/components/ui/checkbox";
import { insertSolicitudPermisoSchema, type InsertSolicitudPermiso, type SolicitudPermiso } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Info } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { EmployeeCombobox } from "@/components/EmployeeCombobox";

interface PermisoFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: SolicitudPermiso;
}

export function PermisoForm({ open, onOpenChange, initialData }: PermisoFormProps) {
  const isEditing = !!initialData;

  const getDefaultValues = (): InsertSolicitudPermiso => {
    if (initialData) {
      return {
        empleadoId: initialData.empleadoId,
        tipoPermiso: initialData.tipoPermiso as "personal" | "defuncion" | "matrimonio" | "paternidad" | "medico" | "tramite" | "otro",
        conGoce: initialData.conGoce ?? false,
        fechaInicio: initialData.fechaInicio,
        fechaFin: initialData.fechaFin,
        horasPermiso: initialData.horasPermiso || undefined,
        diasSolicitados: initialData.diasSolicitados,
        motivo: initialData.motivo,
        documentoSoporteUrl: initialData.documentoSoporteUrl || undefined,
        estatus: initialData.estatus as "pendiente" | "aprobada" | "rechazada" | "cancelada",
        fechaRespuesta: initialData.fechaRespuesta || undefined,
        aprobadoPor: initialData.aprobadoPor || undefined,
        comentariosAprobador: initialData.comentariosAprobador || undefined,
        notasInternas: initialData.notasInternas || undefined,
      };
    }
    return {
      empleadoId: "",
      tipoPermiso: "personal" as const,
      conGoce: false,
      fechaInicio: new Date().toISOString().split('T')[0],
      fechaFin: new Date().toISOString().split('T')[0],
      horasPermiso: undefined,
      diasSolicitados: 1,
      motivo: "",
      documentoSoporteUrl: undefined,
      estatus: "pendiente" as const,
      fechaRespuesta: undefined,
      aprobadoPor: undefined,
      comentariosAprobador: undefined,
      notasInternas: undefined,
    };
  };

  const form = useForm<InsertSolicitudPermiso>({
    resolver: zodResolver(insertSolicitudPermisoSchema),
    defaultValues: getDefaultValues(),
  });

  // Reset form when dialog opens or initialData changes
  useEffect(() => {
    if (open) {
      form.reset(getDefaultValues());
    }
  }, [open, initialData]);

  const fechaInicio = form.watch("fechaInicio");
  const fechaFin = form.watch("fechaFin");
  const estatus = form.watch("estatus");

  // Auto-calculate diasSolicitados when dates change
  useEffect(() => {
    if (fechaInicio && fechaFin) {
      const inicio = new Date(fechaInicio);
      const fin = new Date(fechaFin);
      
      if (fin >= inicio) {
        const diffTime = fin.getTime() - inicio.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Include both days
        form.setValue("diasSolicitados", diffDays, { shouldValidate: true });
      } else {
        // Clear if invalid range
        form.setValue("diasSolicitados", 0, { shouldValidate: true });
      }
    }
  }, [fechaInicio, fechaFin, form]);

  const createMutation = useMutation({
    mutationFn: (data: InsertSolicitudPermiso) => apiRequest("POST", "/api/permisos", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/permisos"] });
      onOpenChange(false);
      form.reset();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: InsertSolicitudPermiso) =>
      apiRequest("PATCH", `/api/permisos/${initialData?.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/permisos"] });
      onOpenChange(false);
    },
  });

  const onSubmit = (data: InsertSolicitudPermiso) => {
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
            {isEditing ? "Editar Solicitud de Permiso" : "Nueva Solicitud de Permiso"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifica los detalles de la solicitud o actualiza su estado"
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
                    <FormLabel>Empleado *</FormLabel>
                    <FormControl>
                      <EmployeeCombobox
                        value={field.value}
                        onChange={field.onChange}
                        testId="combobox-empleado"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tipoPermiso"
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
                        <SelectItem value="personal">Personal</SelectItem>
                        <SelectItem value="defuncion">Defunción</SelectItem>
                        <SelectItem value="matrimonio">Matrimonio</SelectItem>
                        <SelectItem value="paternidad">Paternidad</SelectItem>
                        <SelectItem value="medico">Médico</SelectItem>
                        <SelectItem value="tramite">Trámite</SelectItem>
                        <SelectItem value="otro">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-xs">
                      Selecciona el tipo de permiso según LFT y políticas de la empresa
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="conGoce"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value ?? false}
                        onCheckedChange={field.onChange}
                        data-testid="checkbox-con-goce"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm cursor-pointer">
                        Con goce de sueldo
                      </FormLabel>
                      <FormDescription className="text-xs">
                        Indica si el permiso será pagado
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="fechaInicio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha Inicio *</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
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
                      <FormLabel>Fecha Fin *</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          data-testid="input-fecha-fin"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="diasSolicitados"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Días Solicitados *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.5"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          disabled
                          data-testid="input-dias-solicitados"
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Se calcula automáticamente según las fechas
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="horasPermiso"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Horas (Permiso Parcial)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.5"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          placeholder="Opcional"
                          data-testid="input-horas-permiso"
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Si es permiso por horas, especifica cuántas
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="motivo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Motivo *</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Describe el motivo del permiso..."
                        rows={3}
                        data-testid="textarea-motivo"
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Proporciona una descripción clara del permiso solicitado
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="documentoSoporteUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL Documento de Soporte</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        placeholder="https://..."
                        data-testid="input-documento-url"
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      URL del documento que respalda la solicitud (acta defunción, cita médica, etc.)
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
                      El estado determina si la solicitud está pendiente, aprobada, rechazada o cancelada.
                      Al cambiar a "Aprobada" o "Rechazada", se debe indicar quién aprobó y agregar comentarios.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <FormField
                control={form.control}
                name="estatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-estatus">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pendiente">Pendiente</SelectItem>
                        <SelectItem value="aprobada">Aprobada</SelectItem>
                        <SelectItem value="rechazada">Rechazada</SelectItem>
                        <SelectItem value="cancelada">Cancelada</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {(estatus === "aprobada" || estatus === "rechazada") && (
                <>
                  <FormField
                    control={form.control}
                    name="aprobadoPor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Aprobado/Rechazado Por</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value ?? ""}
                            placeholder="ID del supervisor/RH"
                            data-testid="input-aprobado-por"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="comentariosAprobador"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Comentarios del Aprobador</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            value={field.value ?? ""}
                            placeholder="Comentarios sobre la decisión..."
                            rows={2}
                            data-testid="textarea-comentarios-aprobador"
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

              <FormField
                control={form.control}
                name="notasInternas"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas Internas (RH)</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        value={field.value ?? ""}
                        placeholder="Notas de uso interno..."
                        rows={2}
                        data-testid="textarea-notas-internas"
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Notas para uso interno del departamento de RH
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
