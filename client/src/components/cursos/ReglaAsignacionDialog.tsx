import { useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useCliente } from "@/contexts/ClienteContext";
import type { Curso, Departamento, Puesto, ReglaAsignacionCurso } from "@shared/schema";

const reglaSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  cursoId: z.string().min(1, "Selecciona un curso"),
  tipoEvento: z.enum(["nuevo_ingreso", "cambio_departamento", "cambio_puesto", "fecha_renovacion"]),
  departamentoId: z.string().optional(),
  puestoId: z.string().optional(),
  diasParaCompletar: z.coerce.number().min(1).optional().nullable(),
  activa: z.boolean().default(true),
  prioridad: z.coerce.number().min(1).default(1),
});

type ReglaForm = z.infer<typeof reglaSchema>;

interface ReglaAsignacionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  regla?: ReglaAsignacionCurso | null;
}

export function ReglaAsignacionDialog({ open, onOpenChange, regla }: ReglaAsignacionDialogProps) {
  const { selectedCliente } = useCliente();
  const { toast } = useToast();
  const isEditing = !!regla;

  const form = useForm<ReglaForm>({
    resolver: zodResolver(reglaSchema),
    defaultValues: {
      nombre: "",
      cursoId: "",
      tipoEvento: "nuevo_ingreso",
      departamentoId: "",
      puestoId: "",
      diasParaCompletar: null,
      activa: true,
      prioridad: 1,
    },
  });

  useEffect(() => {
    if (regla) {
      form.reset({
        nombre: regla.nombre,
        cursoId: regla.cursoId,
        tipoEvento: regla.tipoEvento as any,
        departamentoId: regla.departamentoId || "",
        puestoId: regla.puestoId || "",
        diasParaCompletar: regla.diasParaCompletar,
        activa: regla.activa,
        prioridad: regla.prioridad || 1,
      });
    } else {
      form.reset({
        nombre: "",
        cursoId: "",
        tipoEvento: "nuevo_ingreso",
        departamentoId: "",
        puestoId: "",
        diasParaCompletar: null,
        activa: true,
        prioridad: 1,
      });
    }
  }, [regla, form]);

  const { data: cursos = [] } = useQuery<Curso[]>({
    queryKey: ["/api/cursos", selectedCliente?.id],
    enabled: !!selectedCliente?.id && open,
  });

  const { data: departamentos = [] } = useQuery<Departamento[]>({
    queryKey: ["/api/departamentos", selectedCliente?.id],
    enabled: !!selectedCliente?.id && open,
  });

  const { data: puestos = [] } = useQuery<Puesto[]>({
    queryKey: ["/api/puestos", selectedCliente?.id],
    enabled: !!selectedCliente?.id && open,
  });

  const crearMutation = useMutation({
    mutationFn: async (data: ReglaForm) => {
      const payload = {
        ...data,
        departamentoId: data.departamentoId || null,
        puestoId: data.puestoId || null,
      };
      return (await apiRequest("POST", "/api/reglas-asignacion-cursos", payload)).json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reglas-asignacion-cursos"] });
      toast({ title: "Regla creada" });
      handleClose();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const actualizarMutation = useMutation({
    mutationFn: async (data: ReglaForm) => {
      const payload = {
        ...data,
        departamentoId: data.departamentoId || null,
        puestoId: data.puestoId || null,
      };
      return (await apiRequest("PATCH", `/api/reglas-asignacion-cursos/${regla!.id}`, payload)).json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reglas-asignacion-cursos"] });
      toast({ title: "Regla actualizada" });
      handleClose();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleClose = () => {
    form.reset();
    onOpenChange(false);
  };

  const onSubmit = (data: ReglaForm) => {
    if (isEditing) {
      actualizarMutation.mutate(data);
    } else {
      crearMutation.mutate(data);
    }
  };

  const isPending = crearMutation.isPending || actualizarMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Regla" : "Nueva Regla de Asignación"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre de la regla</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Inducción para nuevos empleados" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cursoId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Curso a asignar</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar curso" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {cursos
                        .filter((c) => c.estatus === "publicado")
                        .map((curso) => (
                          <SelectItem key={curso.id} value={curso.id}>
                            {curso.nombre}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tipoEvento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Evento disparador</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="nuevo_ingreso">Nuevo ingreso</SelectItem>
                      <SelectItem value="cambio_departamento">Cambio de departamento</SelectItem>
                      <SelectItem value="cambio_puesto">Cambio de puesto</SelectItem>
                      <SelectItem value="fecha_renovacion">Renovación periódica</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {field.value === "nuevo_ingreso" && "Se asignará cuando un empleado sea dado de alta"}
                    {field.value === "cambio_departamento" && "Se asignará cuando un empleado cambie de departamento"}
                    {field.value === "cambio_puesto" && "Se asignará cuando un empleado cambie de puesto"}
                    {field.value === "fecha_renovacion" && "Se reasignará periódicamente según configuración"}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="departamentoId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Departamento (opcional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Todos los departamentos</SelectItem>
                        {departamentos.map((d) => (
                          <SelectItem key={d.id} value={d.id}>
                            {d.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="puestoId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Puesto (opcional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Todos los puestos</SelectItem>
                        {puestos.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="diasParaCompletar"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Días para completar (opcional)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      placeholder="Sin límite"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                    />
                  </FormControl>
                  <FormDescription>
                    Fecha límite calculada desde la asignación
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="activa"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <FormLabel>Regla activa</FormLabel>
                    <FormDescription>
                      La regla se ejecutará automáticamente
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Guardando..." : isEditing ? "Guardar cambios" : "Crear regla"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
