import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
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
import { insertSolicitudVacacionesSchema, type InsertSolicitudVacaciones, type SolicitudVacaciones } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { EmployeeCombobox } from "@/components/EmployeeCombobox";

interface VacacionesFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: InsertSolicitudVacaciones) => void;
  initialData?: SolicitudVacaciones | null;
  isPending?: boolean;
}

export function VacacionesForm({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  isPending = false,
}: VacacionesFormProps) {
  const form = useForm<InsertSolicitudVacaciones>({
    resolver: zodResolver(insertSolicitudVacacionesSchema),
    defaultValues: initialData
      ? {
          empleadoId: initialData.empleadoId,
          fechaInicio: initialData.fechaInicio,
          fechaFin: initialData.fechaFin,
          diasSolicitados: initialData.diasSolicitados,
          estatus: initialData.estatus as "pendiente" | "aprobada" | "rechazada" | "cancelada",
          motivo: initialData.motivo || undefined,
        }
      : {
          empleadoId: "",
          fechaInicio: new Date().toISOString().split('T')[0],
          fechaFin: new Date().toISOString().split('T')[0],
          diasSolicitados: 0,
          estatus: "pendiente" as const,
          motivo: undefined,
        },
  });

  const empleadoId = form.watch("empleadoId");
  const fechaInicio = form.watch("fechaInicio");
  const fechaFin = form.watch("fechaFin");
  
  const { data: saldoData, isLoading: isLoadingBalance, error: balanceError } = useQuery<{ disponibles: number }>({
    queryKey: ["/api/vacaciones/balance", empleadoId],
    queryFn: async () => {
      const response = await fetch(`/api/vacaciones/balance/${empleadoId}`);
      if (!response.ok) throw new Error("Error al obtener saldo de vacaciones");
      return response.json();
    },
    enabled: !!empleadoId && empleadoId.trim().length > 0,
  });

  useEffect(() => {
    const dias = calculateDias();
    if (dias !== null) {
      form.setValue("diasSolicitados", dias, { shouldValidate: true });
    } else {
      form.setValue("diasSolicitados", 0, { shouldValidate: true });
    }
  }, [fechaInicio, fechaFin]);

  const handleSubmit = (data: InsertSolicitudVacaciones) => {
    onSubmit(data);
  };

  const calculateDias = (): number | null => {
    const fechaInicio = form.watch("fechaInicio");
    const fechaFin = form.watch("fechaFin");
    
    if (!fechaInicio || !fechaFin) return null;
    
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    
    if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) return null;
    if (fin < inicio) return null;
    
    let count = 0;
    const current = new Date(inicio);
    
    while (current <= fin) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }
    
    return count;
  };

  const dias = calculateDias();
  const saldoDisponible = saldoData?.disponibles ?? 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" data-testid="dialog-vacaciones-form">
        <DialogHeader>
          <DialogTitle data-testid="text-dialog-title">
            {initialData ? "Editar Solicitud de Vacaciones" : "Nueva Solicitud de Vacaciones"}
          </DialogTitle>
          <DialogDescription>
            {initialData
              ? "Modifica los datos de la solicitud de vacaciones"
              : "Crea una nueva solicitud de vacaciones. Los días disponibles se calculan según la Ley Federal del Trabajo Art. 76"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
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
                name="estatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estatus *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      data-testid="select-estatus"
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar estatus" />
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

            {dias !== null && (
              <Card>
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium mb-1">Días Solicitados</p>
                      <p className="text-2xl font-semibold" data-testid="text-dias-solicitados">{dias}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1">Días Disponibles</p>
                      {isLoadingBalance ? (
                        <p className="text-sm">Cargando...</p>
                      ) : balanceError ? (
                        <p className="text-sm text-destructive">Error al cargar saldo</p>
                      ) : saldoData ? (
                        <>
                          <p className="text-2xl font-semibold" data-testid="text-dias-disponibles">{saldoDisponible}</p>
                          {dias && dias > saldoDisponible && (
                            <div className="flex items-center gap-2 mt-2 text-destructive">
                              <AlertCircle className="h-4 w-4" />
                              <p className="text-xs">Saldo insuficiente</p>
                            </div>
                          )}
                        </>
                      ) : empleadoId ? (
                        <p className="text-sm">No disponible</p>
                      ) : (
                        <p className="text-sm">-</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <FormField
              control={form.control}
              name="motivo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motivo</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value || ""}
                      placeholder="Motivo de la solicitud de vacaciones..."
                      className="resize-none"
                      rows={3}
                      data-testid="input-motivo"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-4">
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
                {isPending ? "Guardando..." : initialData ? "Guardar Cambios" : "Crear Solicitud"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
