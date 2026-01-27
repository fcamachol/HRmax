import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
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
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { CategoriaCurso } from "@shared/schema";

const PRESET_COLORS = [
  { value: "#EF4444", name: "Rojo" },
  { value: "#F97316", name: "Naranja" },
  { value: "#F59E0B", name: "Ámbar" },
  { value: "#EAB308", name: "Amarillo" },
  { value: "#84CC16", name: "Lima" },
  { value: "#22C55E", name: "Verde" },
  { value: "#10B981", name: "Esmeralda" },
  { value: "#14B8A6", name: "Teal" },
  { value: "#06B6D4", name: "Cyan" },
  { value: "#0EA5E9", name: "Celeste" },
  { value: "#3B82F6", name: "Azul" },
  { value: "#6366F1", name: "Índigo" },
  { value: "#8B5CF6", name: "Violeta" },
  { value: "#A855F7", name: "Púrpura" },
  { value: "#D946EF", name: "Fucsia" },
  { value: "#EC4899", name: "Rosa" },
];

const categoriaFormSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  descripcion: z.string().optional(),
  color: z.string().optional(),
  icono: z.string().optional(),
  orden: z.number().int().min(0).optional(),
});

type CategoriaFormValues = z.infer<typeof categoriaFormSchema>;

interface CategoriaCursoFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoria: CategoriaCurso | null;
  onSuccess?: (categoria: CategoriaCurso) => void;
}

export function CategoriaCursoFormDialog({
  open,
  onOpenChange,
  categoria,
  onSuccess,
}: CategoriaCursoFormDialogProps) {
  const { toast } = useToast();
  const isEditing = !!categoria;

  const form = useForm<CategoriaFormValues>({
    resolver: zodResolver(categoriaFormSchema),
    defaultValues: {
      nombre: "",
      descripcion: "",
      color: "",
      icono: "",
      orden: 0,
    },
  });

  useEffect(() => {
    if (categoria) {
      form.reset({
        nombre: categoria.nombre,
        descripcion: categoria.descripcion || "",
        color: categoria.color || "",
        icono: categoria.icono || "",
        orden: categoria.orden || 0,
      });
    } else {
      form.reset({
        nombre: "",
        descripcion: "",
        color: "",
        icono: "",
        orden: 0,
      });
    }
  }, [categoria, form]);

  const createMutation = useMutation({
    mutationFn: async (data: CategoriaFormValues) => {
      const payload = {
        ...data,
        color: data.color || null,
        icono: data.icono || null,
        descripcion: data.descripcion || null,
      };
      const response = await apiRequest("POST", "/api/categorias-cursos", payload);
      return response.json();
    },
    onSuccess: (newCategoria: CategoriaCurso) => {
      queryClient.invalidateQueries({ queryKey: ["/api/categorias-cursos"] });
      onOpenChange(false);
      toast({
        title: "Categoría creada",
        description: "La categoría ha sido creada exitosamente.",
      });
      onSuccess?.(newCategoria);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: CategoriaFormValues) => {
      const payload = {
        ...data,
        color: data.color || null,
        icono: data.icono || null,
        descripcion: data.descripcion || null,
      };
      const response = await apiRequest("PATCH", `/api/categorias-cursos/${categoria!.id}`, payload);
      return response.json();
    },
    onSuccess: (updatedCategoria: CategoriaCurso) => {
      queryClient.invalidateQueries({ queryKey: ["/api/categorias-cursos"] });
      onOpenChange(false);
      toast({
        title: "Categoría actualizada",
        description: "Los cambios han sido guardados exitosamente.",
      });
      onSuccess?.(updatedCategoria);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CategoriaFormValues) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Categoría" : "Nueva Categoría"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifica la información de la categoría"
              : "Crea una nueva categoría para organizar tus cursos"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre *</FormLabel>
                  <FormControl>
                    <Input placeholder="Seguridad Industrial" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="descripcion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Cursos relacionados con seguridad en el trabajo..."
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <FormControl>
                    <div className="flex flex-wrap gap-2">
                      {PRESET_COLORS.map((color) => (
                        <button
                          key={color.value}
                          type="button"
                          title={color.name}
                          onClick={() => field.onChange(field.value === color.value ? "" : color.value)}
                          className={cn(
                            "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all hover:scale-110",
                            field.value === color.value
                              ? "border-gray-900 dark:border-white ring-2 ring-offset-2 ring-gray-400"
                              : "border-transparent"
                          )}
                          style={{ backgroundColor: color.value }}
                        >
                          {field.value === color.value && (
                            <Check className="h-4 w-4 text-white drop-shadow-md" />
                          )}
                        </button>
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "Guardando..."
                  : isEditing
                  ? "Guardar cambios"
                  : "Crear categoría"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
