import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { Plus, Upload, X, ImageIcon } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { CategoriaCursoFormDialog } from "./CategoriaCursoFormDialog";
import type { Curso, CategoriaCurso } from "@shared/schema";

const cursoFormSchema = z.object({
  codigo: z.string().min(1, "El código es requerido"),
  nombre: z.string().min(1, "El nombre es requerido"),
  descripcion: z.string().optional(),
  imagenUrl: z.string().optional(),
  categoriaId: z.string().optional(),
  dificultad: z.enum(["basico", "intermedio", "avanzado"]).optional(),
  duracionEstimadaMinutos: z.number().min(0).optional(),
  tipoCapacitacion: z.enum(["obligatoria", "opcional", "induccion", "certificacion"]),
  tipoEvaluacion: z.enum(["quiz", "assessment", "certification_exam", "none"]).optional(),
  calificacionMinima: z.number().min(0).max(100).default(70),
  intentosMaximos: z.number().min(1).optional(),
  requiereRenovacion: z.boolean().default(false),
  periodoRenovacionMeses: z.number().min(1).optional(),
});

type CursoFormValues = z.infer<typeof cursoFormSchema>;

interface CursoFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  curso: Curso | null;
  categorias: CategoriaCurso[];
}

export function CursoFormDialog({
  open,
  onOpenChange,
  curso,
  categorias,
}: CursoFormDialogProps) {
  const { toast } = useToast();
  const isEditing = !!curso;
  const [isCategoriaFormOpen, setIsCategoriaFormOpen] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const form = useForm<CursoFormValues>({
    resolver: zodResolver(cursoFormSchema),
    defaultValues: {
      codigo: "",
      nombre: "",
      descripcion: "",
      imagenUrl: undefined,
      categoriaId: undefined,
      dificultad: undefined,
      duracionEstimadaMinutos: undefined,
      tipoCapacitacion: "opcional",
      tipoEvaluacion: "none",
      calificacionMinima: 70,
      intentosMaximos: undefined,
      requiereRenovacion: false,
      periodoRenovacionMeses: undefined,
    },
  });

  useEffect(() => {
    if (curso) {
      form.reset({
        codigo: curso.codigo,
        nombre: curso.nombre,
        descripcion: curso.descripcion || "",
        imagenUrl: curso.imagenUrl || undefined,
        categoriaId: curso.categoriaId || undefined,
        dificultad: (curso.dificultad as any) || undefined,
        duracionEstimadaMinutos: curso.duracionEstimadaMinutos || undefined,
        tipoCapacitacion: (curso.tipoCapacitacion as any) || "opcional",
        tipoEvaluacion: (curso.tipoEvaluacion as any) || "none",
        calificacionMinima: curso.calificacionMinima || 70,
        intentosMaximos: curso.intentosMaximos || undefined,
        requiereRenovacion: curso.requiereRenovacion || false,
        periodoRenovacionMeses: curso.periodoRenovacionMeses || undefined,
      });
    } else {
      form.reset({
        codigo: "",
        nombre: "",
        descripcion: "",
        imagenUrl: undefined,
        categoriaId: undefined,
        dificultad: undefined,
        duracionEstimadaMinutos: undefined,
        tipoCapacitacion: "opcional",
        tipoEvaluacion: "none",
        calificacionMinima: 70,
        intentosMaximos: undefined,
        requiereRenovacion: false,
        periodoRenovacionMeses: undefined,
      });
    }
  }, [curso, form]);

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
    mutationFn: async (data: CursoFormValues) => {
      const response = await apiRequest("POST", "/api/cursos", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cursos"] });
      onOpenChange(false);
      toast({
        title: "Curso creado",
        description: "El curso ha sido creado exitosamente. Ahora puedes agregar contenido.",
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

  const updateMutation = useMutation({
    mutationFn: async (data: CursoFormValues) => {
      const response = await apiRequest("PATCH", `/api/cursos/${curso!.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cursos"] });
      onOpenChange(false);
      toast({
        title: "Curso actualizado",
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

  const onSubmit = (data: CursoFormValues) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const requiereRenovacion = form.watch("requiereRenovacion");
  const tipoEvaluacion = form.watch("tipoEvaluacion");

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Curso" : "Nuevo Curso"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifica la información básica del curso"
              : "Define la información básica del curso. Después podrás agregar módulos y contenido."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="codigo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código *</FormLabel>
                    <FormControl>
                      <Input placeholder="CURSO-001" {...field} />
                    </FormControl>
                    <FormDescription>
                      Identificador único del curso
                    </FormDescription>
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
                            <SelectValue placeholder="Seleccionar categoría" />
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
                  <FormLabel>Nombre del Curso *</FormLabel>
                  <FormControl>
                    <Input placeholder="Inducción a la Empresa" {...field} />
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
                      placeholder="Describe el objetivo y contenido del curso..."
                      rows={3}
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
                  <FormLabel>Imagen del Curso</FormLabel>
                  <FormControl>
                    <div className="space-y-3">
                      {field.value ? (
                        <div className="relative w-full h-32 rounded-lg overflow-hidden border bg-muted">
                          <img
                            src={field.value}
                            alt="Imagen del curso"
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
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted transition-colors">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            {isUploadingImage ? (
                              <p className="text-sm text-muted-foreground">Subiendo...</p>
                            ) : (
                              <>
                                <ImageIcon className="w-8 h-8 mb-2 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">
                                  Clic para subir imagen
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  PNG, JPG (máx. 5MB)
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

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="tipoCapacitacion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Capacitación *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="obligatoria">Obligatoria</SelectItem>
                        <SelectItem value="opcional">Opcional</SelectItem>
                        <SelectItem value="induccion">Inducción</SelectItem>
                        <SelectItem value="certificacion">Certificación</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dificultad"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dificultad</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="basico">Básico</SelectItem>
                        <SelectItem value="intermedio">Intermedio</SelectItem>
                        <SelectItem value="avanzado">Avanzado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="duracionEstimadaMinutos"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duración (minutos)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="60"
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

            <div className="border-t pt-4">
              <h3 className="font-medium mb-4">Evaluación</h3>
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="tipoEvaluacion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Evaluación</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Sin evaluación</SelectItem>
                          <SelectItem value="quiz">Quiz (básico)</SelectItem>
                          <SelectItem value="assessment">Evaluación</SelectItem>
                          <SelectItem value="certification_exam">Examen de certificación</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {tipoEvaluacion && tipoEvaluacion !== "none" && (
                  <>
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
                          <FormDescription>
                            Dejar vacío para ilimitados
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-medium mb-4">Renovación</h3>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="requiereRenovacion"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Requiere Renovación</FormLabel>
                        <FormDescription>
                          El curso debe repetirse periódicamente
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {requiereRenovacion && (
                  <FormField
                    control={form.control}
                    name="periodoRenovacionMeses"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Período de Renovación (meses)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            placeholder="12"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormDescription>
                          Cada cuántos meses debe repetirse el curso
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </div>

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
                  : "Crear curso"}
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
