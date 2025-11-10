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
import { insertActaAdministrativaSchema, type InsertActaAdministrativa, type ActaAdministrativa } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Info } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { EmployeeCombobox } from "@/components/EmployeeCombobox";

interface ActaAdministrativaFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: ActaAdministrativa;
}

export function ActaAdministrativaForm({ open, onOpenChange, initialData }: ActaAdministrativaFormProps) {
  const isEditing = !!initialData;

  const getDefaultValues = (): InsertActaAdministrativa => {
    if (initialData) {
      return {
        empleadoId: initialData.empleadoId,
        numeroActa: initialData.numeroActa,
        fechaElaboracion: initialData.fechaElaboracion,
        tipoFalta: initialData.tipoFalta as "leve" | "grave" | "muy_grave",
        descripcionHechos: initialData.descripcionHechos,
        fechaIncidente: initialData.fechaIncidente,
        horaIncidente: initialData.horaIncidente || undefined,
        lugarIncidente: initialData.lugarIncidente || undefined,
        testigos: initialData.testigos || undefined,
        sancionAplicada: initialData.sancionAplicada as "suspension" | "amonestacion" | "descuento" | "despido" | "ninguna" | undefined,
        diasSuspension: initialData.diasSuspension || undefined,
        montoDescuento: initialData.montoDescuento || undefined,
        detallesSancion: initialData.detallesSancion || undefined,
        fechaAplicacionSancion: initialData.fechaAplicacionSancion || undefined,
        fechaCumplimientoSancion: initialData.fechaCumplimientoSancion || undefined,
        estatus: initialData.estatus as "pendiente" | "aplicada" | "apelada" | "anulada" | "archivada",
        apelacionPresentada: initialData.apelacionPresentada ?? false,
        elaboradoPor: initialData.elaboradoPor,
        aprobadoPor: initialData.aprobadoPor || undefined,
        detallesApelacion: initialData.detallesApelacion || undefined,
        fechaApelacion: initialData.fechaApelacion || undefined,
        resolucionApelacion: initialData.resolucionApelacion || undefined,
        documentosAdjuntos: initialData.documentosAdjuntos || undefined,
        notasInternas: initialData.notasInternas || undefined,
        firmadoEmpleado: initialData.firmadoEmpleado ?? false,
        fechaFirmaEmpleado: initialData.fechaFirmaEmpleado || undefined,
        firmadoTestigo1: initialData.firmadoTestigo1 ?? false,
        firmadoTestigo2: initialData.firmadoTestigo2 ?? false,
      };
    }
    return {
      empleadoId: "",
      numeroActa: "",
      fechaElaboracion: new Date().toISOString().split('T')[0],
      tipoFalta: "leve" as const,
      descripcionHechos: "",
      fechaIncidente: new Date().toISOString().split('T')[0],
      horaIncidente: undefined,
      lugarIncidente: undefined,
      testigos: undefined,
      sancionAplicada: undefined,
      diasSuspension: undefined,
      montoDescuento: undefined,
      detallesSancion: undefined,
      fechaAplicacionSancion: undefined,
      fechaCumplimientoSancion: undefined,
      estatus: "pendiente" as const,
      apelacionPresentada: false,
      elaboradoPor: "",
      aprobadoPor: undefined,
      detallesApelacion: undefined,
      fechaApelacion: undefined,
      resolucionApelacion: undefined,
      documentosAdjuntos: undefined,
      notasInternas: undefined,
      firmadoEmpleado: false,
      fechaFirmaEmpleado: undefined,
      firmadoTestigo1: false,
      firmadoTestigo2: false,
    };
  };

  const form = useForm<InsertActaAdministrativa>({
    resolver: zodResolver(insertActaAdministrativaSchema),
    defaultValues: getDefaultValues(),
  });

  useEffect(() => {
    if (open) {
      form.reset(getDefaultValues());
    }
  }, [open, initialData]);

  const sancionAplicada = form.watch("sancionAplicada");

  const createMutation = useMutation({
    mutationFn: (data: InsertActaAdministrativa) => apiRequest("POST", "/api/actas-administrativas", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/actas-administrativas"] });
      onOpenChange(false);
      form.reset();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: InsertActaAdministrativa) =>
      apiRequest("PATCH", `/api/actas-administrativas/${initialData?.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/actas-administrativas"] });
      onOpenChange(false);
    },
  });

  const onSubmit = (data: InsertActaAdministrativa) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Acta Administrativa" : "Nueva Acta Administrativa"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifica los detalles del acta administrativa"
              : "Registra una nueva acta administrativa disciplinaria"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <div className="text-sm font-medium">Información del Empleado</div>
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

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="numeroActa"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número de Acta *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="ACT-2024-001"
                          data-testid="input-numero-acta"
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Número correlativo único del acta
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fechaElaboracion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha Elaboración *</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          data-testid="input-fecha-elaboracion"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="tipoFalta"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Falta *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-tipo-falta">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="leve">Leve</SelectItem>
                        <SelectItem value="grave">Grave</SelectItem>
                        <SelectItem value="muy_grave">Muy Grave</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-xs">
                      Clasificación según gravedad de la falta
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4 border-t pt-4">
              <div className="text-sm font-medium">Descripción del Incidente</div>

              <FormField
                control={form.control}
                name="descripcionHechos"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción de los Hechos *</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Describe detalladamente los hechos que dieron lugar a esta acta..."
                        rows={4}
                        data-testid="textarea-descripcion-hechos"
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Proporciona una descripción clara y detallada del incidente
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="fechaIncidente"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha del Incidente *</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          data-testid="input-fecha-incidente"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="horaIncidente"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hora del Incidente</FormLabel>
                      <FormControl>
                        <Input
                          type="time"
                          {...field}
                          value={field.value ?? ""}
                          placeholder="HH:MM"
                          data-testid="input-hora-incidente"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lugarIncidente"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lugar del Incidente</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          placeholder="Ej: Oficina, Almacén"
                          data-testid="input-lugar-incidente"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="testigos"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Testigos</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        value={field.value ?? ""}
                        placeholder="Nombres de los testigos presentes..."
                        rows={2}
                        data-testid="textarea-testigos"
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Lista de personas que presenciaron el incidente
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4 border-t pt-4">
              <div className="text-sm font-medium">Sanción Aplicada</div>

              <FormField
                control={form.control}
                name="sancionAplicada"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Sanción</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value ?? ""}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-sancion-aplicada">
                          <SelectValue placeholder="Selecciona sanción" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ninguna">Ninguna</SelectItem>
                        <SelectItem value="amonestacion">Amonestación</SelectItem>
                        <SelectItem value="suspension">Suspensión</SelectItem>
                        <SelectItem value="descuento">Descuento Económico</SelectItem>
                        <SelectItem value="despido">Despido</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {sancionAplicada === "suspension" && (
                <FormField
                  control={form.control}
                  name="diasSuspension"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Días de Suspensión</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          data-testid="input-dias-suspension"
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Número de días de suspensión sin goce de sueldo
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {sancionAplicada === "descuento" && (
                <FormField
                  control={form.control}
                  name="montoDescuento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monto del Descuento</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          placeholder="0.00"
                          data-testid="input-monto-descuento"
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Monto en pesos mexicanos a descontar
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="detallesSancion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Detalles de la Sanción</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        value={field.value ?? ""}
                        placeholder="Detalles adicionales sobre la sanción aplicada..."
                        rows={2}
                        data-testid="textarea-detalles-sancion"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="fechaAplicacionSancion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha Aplicación Sanción</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          value={field.value ?? ""}
                          data-testid="input-fecha-aplicacion"
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Cuándo se aplicará la sanción
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fechaCumplimientoSancion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha Cumplimiento Sanción</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          value={field.value ?? ""}
                          data-testid="input-fecha-cumplimiento"
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Cuándo se cumplió/terminó la sanción
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center gap-2">
                <h3 className="font-medium">Estado y Documentación</h3>
                <Info className="h-4 w-4 text-muted-foreground" />
              </div>

              <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                <CardContent className="pt-4">
                  <div className="flex gap-2 text-sm text-blue-800 dark:text-blue-200">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <p>
                      El estado del acta determina su situación actual: pendiente de aplicación, aplicada, 
                      si está en proceso de apelación, o si ha sido anulada/archivada.
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
                        <SelectItem value="aplicada">Aplicada</SelectItem>
                        <SelectItem value="apelada">Apelada</SelectItem>
                        <SelectItem value="anulada">Anulada</SelectItem>
                        <SelectItem value="archivada">Archivada</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="elaboradoPor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Elaborado Por *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="ID del responsable de RH"
                        data-testid="input-elaborado-por"
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      ID del usuario de RH que elabora el acta
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="aprobadoPor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Aprobado Por</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        placeholder="ID del superior que aprueba"
                        data-testid="input-aprobado-por"
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      ID del supervisor o gerente que aprueba el acta
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="apelacionPresentada"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value ?? false}
                        onCheckedChange={field.onChange}
                        data-testid="checkbox-apelacion"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm cursor-pointer">
                        Apelación Presentada
                      </FormLabel>
                      <FormDescription className="text-xs">
                        Indica si el empleado ha presentado un recurso de apelación
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notasInternas"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas Internas</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        value={field.value ?? ""}
                        placeholder="Notas confidenciales de RH..."
                        rows={2}
                        data-testid="textarea-notas-internas"
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Información confidencial para uso interno de RH
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
              <Button 
                type="submit" 
                disabled={isPending}
                data-testid="button-guardar"
              >
                {isPending ? "Guardando..." : isEditing ? "Actualizar" : "Crear Acta"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
