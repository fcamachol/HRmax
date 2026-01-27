import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import { Plus, Upload, X, ImageIcon, ClipboardCheck } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { CategoriaCursoFormDialog } from "./CategoriaCursoFormDialog";
import { useCliente } from "@/contexts/ClienteContext";
import type { Curso, CategoriaCurso } from "@shared/schema";

const evaluacionFormSchema = z.object({
  codigo: z.string().min(1, "El código es requerido"),
  nombre: z.string().min(1, "El nombre es requerido"),
  descripcion: z.string().optional(),
  imagenUrl: z.string().optional(),
  categoriaId: z.string().optional(),
  calificacionMinima: z.number().min(0).max(100).default(70),
  intentosMaximos: z.number().min(1).optional(),
});

type EvaluacionFormValues = z.infer<typeof evaluacionFormSchema>;

interface EvaluacionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  evaluacion: Curso | null;
  categorias: CategoriaCurso[];
}

export function EvaluacionFormDialog({
  open,
  onOpenChange,
  evaluacion,
  categorias,
}: EvaluacionFormDialogProps) {
  const { toast } = useToast();
  const { clienteId } = useCliente();
  const [, setLocation] = useLocation();
  const isEditing = !!evaluacion;
  const [isCategoriaFormOpen, setIsCategoriaFormOpen] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const form = useForm<EvaluacionFormValues>({
    resolver: zodResolver(evaluacionFormSchema),
    defaultValues: {
      codigo: "",
      nombre: "",
      descripcion: "",
      imagenUrl: undefined,
      categoriaId: undefined,
      calificacionMinima: 70,
      intentosMaximos: undefined,
    },
  });

  useEffect(() => {
    if (evaluacion) {
      form.reset({
        codigo: evaluacion.codigo,
        nombre: evaluacion.nombre,
        descripcion: evaluacion.descripcion || "",
        imagenUrl: evaluacion.imagenUrl || undefined,
        categoriaId: evaluacion.categoriaId || undefined,
        calificacionMinima: evaluacion.calificacionMinima || 70,
        intentosMaximos: evaluacion.intentosMaximos || undefined,
      });
    } else {
      form.reset({
        codigo: "",
        nombre: "",
        descripcion: "",
        imagenUrl: undefined,
        categoriaId: undefined,
        calificacionMinima: 70,
        intentosMaximos: undefined,
      });
    }
  }, [evaluacion, form]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Imagen muy grande",
        description: "La imagen debe ser menor a 5MB",
        variant: "destructive",
      });
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Archivo inválido",
        description: "Solo se permiten imágenes",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingImage(true);
    try {
      const response = await apiRequest("POST", "/api/objects/upload");
      const { uploadURL } = await response.json();

      const uploadResponse = await fetch(uploadURL, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error("Error al subir imagen");
      }

      const imageUrl = uploadURL.split("?")[0];
      form.setValue("imagenUrl", imageUrl);
      toast({
        title: "Imagen subida",
        description: "La imagen se ha subido correctamente",
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Error",
        description: "No se pudo subir la imagen",
        variant: "destructive",
      });
    } finally {
      setIsUploadingImage(false);
      event.target.value = "";
    }
  };

  const createMutation = useMutation({
    mutationFn: async (data: EvaluacionFormValues) => {
      const payload = {
        ...data,
        tipo: "evaluacion",
        tipoCapacitacion: "opcional",
        tipoEvaluacion: "assessment",
      };
      const response = await apiRequest("POST", "/api/cursos", payload);
      return response.json();
    },
    onSuccess: (newEvaluacion: Curso) => {
      queryClient.invalidateQueries({ queryKey: ["/api/cursos"] });
      onOpenChange(false);
      toast({
        title: "Evaluación creada",
        description: "Ahora puedes agregar las preguntas de la evaluación.",
      });
      // Redirect to builder to add quiz questions
      setLocation(`/${clienteId}/cursos-capacitaciones/${newEvaluacion.id}/editar`);
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
    mutationFn: async (data: EvaluacionFormValues) => {
      const response = await apiRequest("PATCH", `/api/cursos/${evaluacion!.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cursos"] });
      onOpenChange(false);
      toast({
        title: "Evaluación actualizada",
        description: "Los cambios han sido guardados exitosamente.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EvaluacionFormValues) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-sky-500" />
              {isEditing ? "Editar Evaluación" : "Nueva Evaluación"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Modifica la información de la evaluación"
                : "Crea una evaluación para medir conocimientos o competencias"}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="codigo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código *</FormLabel>
                      <FormControl>
                        <Input placeholder="EVAL-001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="categoriaId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoría</FormLabel>
                      <div className="flex gap-2">
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Seleccionar" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categorias.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.nombre}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setIsCategoriaFormOpen(true)}
                          title="Agregar nueva categoría"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="nombre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre de la Evaluación *</FormLabel>
                    <FormControl>
                      <Input placeholder="Evaluación de Seguridad Industrial" {...field} />
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
                        placeholder="Describe el objetivo de esta evaluación..."
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
                name="imagenUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Imagen</FormLabel>
                    <FormControl>
                      <div className="space-y-3">
                        {field.value ? (
                          <div className="relative w-full h-28 rounded-lg overflow-hidden border bg-muted">
                            <img
                              src={field.value}
                              alt="Imagen de la evaluación"
                              className="w-full h-full object-cover"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute top-2 right-2 h-6 w-6"
                              onClick={() => form.setValue("imagenUrl", undefined)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted transition-colors">
                            <div className="flex flex-col items-center justify-center py-4">
                              {isUploadingImage ? (
                                <p className="text-sm text-muted-foreground">Subiendo...</p>
                              ) : (
                                <>
                                  <ImageIcon className="w-6 h-6 mb-1 text-muted-foreground" />
                                  <p className="text-xs text-muted-foreground">
                                    Clic para subir imagen (opcional)
                                  </p>
                                </>
                              )}
                            </div>
                            <input
                              type="file"
                              className="hidden"
                              accept="image/*"
                              onChange={handleImageUpload}
                              disabled={isUploadingImage}
                            />
                          </label>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="calificacionMinima"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Calificación Mínima (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="intentosMaximos"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Intentos Máximos</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          placeholder="Ilimitados"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="bg-sky-500 hover:bg-sky-600"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? "Guardando..."
                    : isEditing
                    ? "Guardar cambios"
                    : "Crear y agregar preguntas"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <CategoriaCursoFormDialog
        open={isCategoriaFormOpen}
        onOpenChange={setIsCategoriaFormOpen}
        categoria={null}
        onSuccess={(newCategoria) => {
          form.setValue("categoriaId", newCategoria.id);
        }}
      />
    </>
  );
}
