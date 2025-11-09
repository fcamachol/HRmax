import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPuestoSchema } from "@shared/schema";
import { z } from "zod";
import { Button } from "@/components/ui/button";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const puestoFormSchema = insertPuestoSchema.extend({
  nombrePuesto: z.string().min(1, "El nombre del puesto es requerido"),
  clavePuesto: z.string().min(1, "La clave del puesto es requerida"),
});

type PuestoFormValues = z.infer<typeof puestoFormSchema>;

interface PuestoFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: PuestoFormValues) => void;
  defaultValues?: Partial<PuestoFormValues>;
}

export function PuestoForm({ open, onOpenChange, onSubmit, defaultValues }: PuestoFormProps) {
  const form = useForm<PuestoFormValues>({
    resolver: zodResolver(puestoFormSchema),
    defaultValues: defaultValues || {
      nombrePuesto: "",
      clavePuesto: "",
      departamento: "",
      area: "",
      nivelJerarquico: "",
      propositoGeneral: "",
      estatus: "activo",
    },
  });

  const handleSubmit = (data: PuestoFormValues) => {
    onSubmit(data);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuevo Puesto</DialogTitle>
          <DialogDescription>
            Crea una nueva descripción de puesto para la organización
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nombrePuesto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del Puesto *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej: Gerente de Recursos Humanos"
                        {...field}
                        data-testid="input-nombre-puesto"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="clavePuesto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Clave del Puesto *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej: GRH-001"
                        {...field}
                        data-testid="input-clave-puesto"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="departamento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Departamento</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej: Recursos Humanos"
                        {...field}
                        value={field.value || ""}
                        data-testid="input-departamento"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="area"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Área</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej: Administración"
                        {...field}
                        value={field.value || ""}
                        data-testid="input-area"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nivelJerarquico"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nivel Jerárquico</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value || undefined}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-nivel-jerarquico">
                          <SelectValue placeholder="Selecciona un nivel" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Operativo">Operativo</SelectItem>
                        <SelectItem value="Técnico">Técnico</SelectItem>
                        <SelectItem value="Supervisión">Supervisión</SelectItem>
                        <SelectItem value="Jefatura">Jefatura</SelectItem>
                        <SelectItem value="Gerencia">Gerencia</SelectItem>
                        <SelectItem value="Dirección">Dirección</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="estatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estatus</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value || "activo"}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-estatus">
                          <SelectValue placeholder="Selecciona estatus" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="activo">Activo</SelectItem>
                        <SelectItem value="inactivo">Inactivo</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="propositoGeneral"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Propósito General del Puesto</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe el propósito principal y la razón de ser de este puesto..."
                      className="resize-none"
                      rows={4}
                      {...field}
                      value={field.value || ""}
                      data-testid="textarea-proposito-general"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel-puesto"
              >
                Cancelar
              </Button>
              <Button type="submit" data-testid="button-submit-puesto">
                Crear Puesto
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
