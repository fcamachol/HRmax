import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  insertConceptoMedioPagoSchema,
  type InsertConceptoMedioPago,
  type ConceptoMedioPagoWithRelations,
  type MedioPago,
} from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface ConceptoMedioPagoFormProps {
  open: boolean;
  onClose: () => void;
  concepto: ConceptoMedioPagoWithRelations | null;
}

export function ConceptoMedioPagoForm({ open, onClose, concepto }: ConceptoMedioPagoFormProps) {
  const { toast } = useToast();
  const isEditing = !!concepto;

  const { data: mediosPago = [] } = useQuery<MedioPago[]>({
    queryKey: ["/api/medios-pago"],
  });

  const form = useForm<InsertConceptoMedioPago>({
    resolver: zodResolver(insertConceptoMedioPagoSchema),
    defaultValues: {
      nombre: "",
      tipo: "percepcion",
      formula: "",
      limiteExento: "",
      limiteAnual: "",
      gravableISR: false,
      integraSBC: false,
      activo: true,
      mediosPagoIds: [],
    },
  });

  useEffect(() => {
    if (concepto) {
      form.reset({
        nombre: concepto.nombre,
        tipo: concepto.tipo as "percepcion" | "deduccion",
        formula: concepto.formula || "",
        limiteExento: concepto.limiteExento ?? "",
        limiteAnual: concepto.limiteAnual ?? "",
        gravableISR: concepto.gravableISR,
        integraSBC: concepto.integraSBC,
        activo: concepto.activo ?? true,
        mediosPagoIds: concepto.mediosPagoIds || [],
      });
    } else {
      form.reset({
        nombre: "",
        tipo: "percepcion",
        formula: "",
        limiteExento: "",
        limiteAnual: "",
        gravableISR: false,
        integraSBC: false,
        activo: true,
        mediosPagoIds: [],
      });
    }
  }, [concepto, form]);

  const createMutation = useMutation({
    mutationFn: async (data: InsertConceptoMedioPago) => {
      await apiRequest("POST", "/api/conceptos-medio-pago", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conceptos-medio-pago"] });
      toast({
        title: "Concepto creado",
        description: "El concepto de medio de pago ha sido creado exitosamente",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el concepto",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: InsertConceptoMedioPago) => {
      await apiRequest("PATCH", `/api/conceptos-medio-pago/${concepto!.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conceptos-medio-pago"] });
      toast({
        title: "Concepto actualizado",
        description: "El concepto de medio de pago ha sido actualizado exitosamente",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el concepto",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertConceptoMedioPago) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const handleToggleMedioPago = (medioPagoId: string) => {
    const current = form.getValues("mediosPagoIds") || [];
    if (current.includes(medioPagoId)) {
      form.setValue(
        "mediosPagoIds",
        current.filter((id) => id !== medioPagoId)
      );
    } else {
      form.setValue("mediosPagoIds", [...current, medioPagoId]);
    }
  };

  const selectedMediosPago = form.watch("mediosPagoIds") || [];
  const selectedMediosData = mediosPago.filter((m) => selectedMediosPago.includes(m.id!));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Concepto" : "Nuevo Concepto de Medio de Pago"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Actualiza la información del concepto de medio de pago"
              : "Crea un nuevo concepto con fórmula dinámica para cálculos"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ej: Comisión Saldazo"
                      {...field}
                      data-testid="input-concepto-nombre"
                    />
                  </FormControl>
                  <FormDescription>
                    Nombre único del concepto
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tipo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-concepto-tipo">
                        <SelectValue placeholder="Selecciona el tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="percepcion">Percepción</SelectItem>
                      <SelectItem value="deduccion">Deducción</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Si el concepto suma o resta del salario
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="formula"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fórmula</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ej: SUELDO * 0.03"
                      {...field}
                      className="font-mono text-sm"
                      rows={3}
                      data-testid="textarea-concepto-formula"
                    />
                  </FormControl>
                  <FormDescription>
                    Fórmula de cálculo (puede usar variables como SUELDO, UMA, etc.)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="limiteExento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Límite Exento</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej: 3*UMA o 1000"
                        {...field}
                        value={field.value ?? ""}
                        className="font-mono text-sm"
                        data-testid="input-concepto-limite-exento"
                      />
                    </FormControl>
                    <FormDescription>
                      Monto o fórmula del límite exento
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="limiteAnual"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Límite Anual</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej: 5*UMA o 5000"
                        {...field}
                        value={field.value ?? ""}
                        className="font-mono text-sm"
                        data-testid="input-concepto-limite-anual"
                      />
                    </FormControl>
                    <FormDescription>
                      Monto o fórmula del límite anual
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="gravableISR"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="checkbox-concepto-gravable-isr"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Gravable para ISR</FormLabel>
                      <FormDescription>
                        Marca si este concepto es gravable para el Impuesto Sobre la Renta
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="integraSBC"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="checkbox-concepto-integra-sbc"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Integra Salario Base de Cotización</FormLabel>
                      <FormDescription>
                        Marca si este concepto integra al SBC para cálculo de cuotas IMSS
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="activo"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value ?? true}
                        onCheckedChange={field.onChange}
                        data-testid="checkbox-concepto-activo"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Activo</FormLabel>
                      <FormDescription>
                        El concepto estará disponible para usar en cálculos
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-3">
              <FormLabel>Medios de Pago Asociados</FormLabel>
              <FormDescription>
                Selecciona los medios de pago donde aplicará este concepto
              </FormDescription>
              
              {selectedMediosData.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedMediosData.map((medio) => (
                    <Badge
                      key={medio.id}
                      variant="secondary"
                      className="gap-1"
                      data-testid={`badge-selected-medio-${medio.id}`}
                    >
                      {medio.nombre}
                      <button
                        type="button"
                        onClick={() => handleToggleMedioPago(medio.id!)}
                        className="ml-1 hover:bg-muted rounded-sm"
                        data-testid={`button-remove-medio-${medio.id}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              <div className="border rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
                {mediosPago.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No hay medios de pago disponibles
                  </p>
                ) : (
                  mediosPago.map((medio) => {
                    const isSelected = selectedMediosPago.includes(medio.id!);
                    return (
                      <div
                        key={medio.id}
                        className="flex items-start space-x-3 py-2"
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleToggleMedioPago(medio.id!)}
                          data-testid={`checkbox-medio-${medio.id}`}
                        />
                        <div className="flex-1 space-y-1">
                          <label className="text-sm font-medium leading-none cursor-pointer">
                            {medio.nombre}
                          </label>
                          {medio.descripcion && (
                            <p className="text-xs text-muted-foreground">
                              {medio.descripcion}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                data-testid="button-cancelar"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                data-testid="button-guardar-concepto"
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "Guardando..."
                  : isEditing
                  ? "Actualizar"
                  : "Crear"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
