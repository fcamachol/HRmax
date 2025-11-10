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
import { insertMedioPagoSchema, type InsertMedioPago, type MedioPago } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface MedioPagoFormProps {
  open: boolean;
  onClose: () => void;
  medioPago?: MedioPago;
}

export function MedioPagoForm({ open, onClose, medioPago }: MedioPagoFormProps) {
  const isEditing = !!medioPago;

  const getDefaultValues = (): InsertMedioPago => {
    if (medioPago) {
      return {
        nombre: medioPago.nombre,
        descripcion: medioPago.descripcion || undefined,
        tipoComprobante: medioPago.tipoComprobante as "factura" | "recibo_sin_iva",
        cuentaDeposito: medioPago.cuentaDeposito,
        activo: medioPago.activo ?? true,
      };
    }
    return {
      nombre: "",
      descripcion: undefined,
      tipoComprobante: "factura",
      cuentaDeposito: "",
      activo: true,
    };
  };

  const form = useForm<InsertMedioPago>({
    resolver: zodResolver(insertMedioPagoSchema),
    defaultValues: getDefaultValues(),
  });

  useEffect(() => {
    if (open) {
      form.reset(getDefaultValues());
    }
  }, [open, medioPago]);

  const createMutation = useMutation({
    mutationFn: (data: InsertMedioPago) => apiRequest("POST", "/api/medios-pago", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/medios-pago"] });
      onClose();
      form.reset();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: InsertMedioPago) =>
      apiRequest("PATCH", `/api/medios-pago/${medioPago?.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/medios-pago"] });
      onClose();
    },
  });

  const onSubmit = (data: InsertMedioPago) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Medio de Pago" : "Nuevo Medio de Pago"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifica los detalles del medio de pago"
              : "Registra un nuevo medio de pago (monedero electrónico, sindicato)"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Medio de Pago</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ej: Saldazo, Spin, Sindicato XYZ..."
                      {...field}
                      data-testid="input-nombre"
                    />
                  </FormControl>
                  <FormDescription>
                    Nombre de la plataforma o entidad de pago
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="descripcion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Información adicional sobre este medio de pago..."
                      className="resize-none"
                      rows={3}
                      {...field}
                      value={field.value || ""}
                      data-testid="input-descripcion"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tipoComprobante"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Comprobante</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-tipo-comprobante">
                        <SelectValue placeholder="Selecciona el tipo de comprobante" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="factura">Factura</SelectItem>
                      <SelectItem value="recibo_sin_iva">Recibo sin IVA</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Tipo de documento que emite este medio de pago
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cuentaDeposito"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cuenta de Depósito</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Número de cuenta o identificador..."
                      {...field}
                      data-testid="input-cuenta-deposito"
                    />
                  </FormControl>
                  <FormDescription>
                    Cuenta o identificador para depósitos a este medio
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="activo"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value ?? true}
                      onCheckedChange={field.onChange}
                      data-testid="checkbox-activo"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Medio de pago activo
                    </FormLabel>
                    <FormDescription>
                      Los medios de pago inactivos no aparecerán en las opciones de nómina
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isPending}
                data-testid="button-cancel"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                data-testid="button-submit"
              >
                {isPending ? "Guardando..." : isEditing ? "Guardar Cambios" : "Crear Medio de Pago"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
