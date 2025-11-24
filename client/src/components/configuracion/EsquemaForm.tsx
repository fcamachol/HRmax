import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const esquemaFormSchema = z.object({
  nombreEsquema: z.string().min(1, "El nombre del esquema es requerido"),
  aniosAntiguedad: z.coerce.number().int().min(1, "Debe ser al menos 1 año"),
  diasVacaciones: z.coerce.number().int().min(1, "Debe ser al menos 1 día"),
  diasAguinaldo: z.coerce.number().int().min(15, "Mínimo legal: 15 días"),
  primaVacacionalPct: z.coerce.number().min(25, "Mínimo legal: 25%").max(100),
  activo: z.boolean().default(true),
});

type EsquemaFormValues = z.infer<typeof esquemaFormSchema>;

interface EsquemaFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: {
    id: string;
    nombreEsquema: string;
    aniosAntiguedad: number;
    diasVacaciones: number;
    diasAguinaldo: number;
    primaVacacionalPct: string;
    activo: boolean;
  };
}

export function EsquemaForm({ open, onOpenChange, defaultValues }: EsquemaFormProps) {
  const { toast } = useToast();
  const isEditing = !!defaultValues?.id;

  const form = useForm<EsquemaFormValues>({
    resolver: zodResolver(esquemaFormSchema),
    defaultValues: {
      nombreEsquema: defaultValues?.nombreEsquema || "",
      aniosAntiguedad: defaultValues?.aniosAntiguedad || 1,
      diasVacaciones: defaultValues?.diasVacaciones || 12,
      diasAguinaldo: defaultValues?.diasAguinaldo || 15,
      primaVacacionalPct: parseFloat(defaultValues?.primaVacacionalPct || "25"),
      activo: defaultValues?.activo ?? true,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: EsquemaFormValues) => {
      // Calcular factor de integración
      const factorIntegracion = 1 + ((data.diasAguinaldo + (data.diasVacaciones * data.primaVacacionalPct / 100)) / 365);
      
      const payload = {
        ...data,
        factorIntegracion: factorIntegracion.toFixed(6),
      };

      if (isEditing) {
        return await apiRequest("PATCH", `/api/cat-tablas-prestaciones/${defaultValues.id}`, payload);
      } else {
        return await apiRequest("POST", "/api/cat-tablas-prestaciones", payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cat-tablas-prestaciones"] });
      toast({
        title: isEditing ? "Esquema actualizado" : "Esquema creado",
        description: `El esquema de prestaciones ha sido ${isEditing ? "actualizado" : "creado"} correctamente.`,
      });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || `No se pudo ${isEditing ? "actualizar" : "crear"} el esquema`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EsquemaFormValues) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]" data-testid="dialog-esquema-form">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Esquema de Prestaciones" : "Nuevo Esquema de Prestaciones"}
          </DialogTitle>
          <DialogDescription>
            Configura los beneficios para un año de antigüedad específico.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nombreEsquema"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Esquema</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Ej: LFT 2024, Puestos de Confianza, Sindicalizados"
                      data-testid="input-nombre-esquema"
                    />
                  </FormControl>
                  <FormDescription>
                    Nombre que identifica este conjunto de prestaciones
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="aniosAntiguedad"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Años de Antigüedad</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      min="1"
                      placeholder="1"
                      data-testid="input-anios-antiguedad"
                    />
                  </FormControl>
                  <FormDescription>
                    Año de antigüedad al que aplican estas prestaciones
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="diasVacaciones"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Días Vacaciones</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min="1"
                        placeholder="12"
                        data-testid="input-dias-vacaciones"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="diasAguinaldo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Días Aguinaldo</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min="15"
                        placeholder="15"
                        data-testid="input-dias-aguinaldo"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="primaVacacionalPct"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prima Vacacional (%)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min="25"
                        max="100"
                        step="0.01"
                        placeholder="25"
                        data-testid="input-prima-vacacional"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="activo"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      data-testid="checkbox-activo"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Activo</FormLabel>
                    <FormDescription>
                      Los esquemas inactivos no se pueden asignar a nuevos puestos o empleados
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={mutation.isPending}
                data-testid="button-cancelar-esquema"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={mutation.isPending} data-testid="button-guardar-esquema">
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? "Actualizar" : "Crear"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
