import { useState, useMemo } from "react";
import { Check } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Curso, Employee, Departamento, Puesto } from "@shared/schema";

const asignarSchema = z.object({
  cursoId: z.string().min(1, "Selecciona un curso"),
  fechaVencimiento: z.string().optional(),
  esObligatorio: z.boolean().default(true),
});

type AsignarForm = z.infer<typeof asignarSchema>;

interface AsignarCursoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clienteId: string | null;
  cursos: Curso[];
  empleados: Employee[];
  departamentos: Departamento[];
  puestos: Puesto[];
}

export function AsignarCursoDialog({
  open,
  onOpenChange,
  clienteId,
  cursos,
  empleados,
  departamentos,
  puestos,
}: AsignarCursoDialogProps) {
  const { toast } = useToast();
  const [assignMode, setAssignMode] = useState<"individual" | "filtro">("individual");
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [departamentoFilter, setDepartamentoFilter] = useState<string>("all");
  const [puestoFilter, setPuestoFilter] = useState<string>("all");

  const form = useForm<AsignarForm>({
    resolver: zodResolver(asignarSchema),
    defaultValues: {
      cursoId: "",
      fechaVencimiento: "",
      esObligatorio: true,
    },
  });

  const asignarMutation = useMutation({
    mutationFn: async (data: {
      cursoId: string;
      empleadoIds: string[];
      fechaVencimiento?: string;
      esObligatorio: boolean;
    }) => {
      return (await apiRequest("POST", "/api/asignaciones-cursos/bulk", {
        ...data,
        clienteId,
      })).json();
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/asignaciones-cursos"] });
      toast({
        title: "Curso asignado",
        description: `Se asignó el curso a ${result.asignados} empleado(s)`,
      });
      handleClose(false);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const activeEmpleados = useMemo(() => {
    // Include employees that are active or don't have a status set (null/undefined defaults to active)
    // Also handle case-insensitive comparison
    return empleados.filter((e) => !e.estatus || e.estatus.toLowerCase() === "activo");
  }, [empleados]);

  const filteredEmployees = useMemo(() => {
    return activeEmpleados.filter((e) => {
      if (departamentoFilter !== "all" && e.departamentoId !== departamentoFilter) return false;
      if (puestoFilter !== "all" && e.puestoId !== puestoFilter) return false;
      return true;
    });
  }, [activeEmpleados, departamentoFilter, puestoFilter]);

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      form.reset();
      setSelectedEmployees([]);
      setAssignMode("individual");
      setDepartamentoFilter("all");
      setPuestoFilter("all");
    }
    onOpenChange(isOpen);
  };

  const toggleEmployee = (employeeId: string) => {
    setSelectedEmployees((prev) =>
      prev.includes(employeeId)
        ? prev.filter((id) => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const selectAll = () => {
    setSelectedEmployees(activeEmpleados.map((e) => e.id));
  };

  const clearSelection = () => {
    setSelectedEmployees([]);
  };

  const onSubmit = (data: AsignarForm) => {
    let empleadoIds: string[] = [];

    if (assignMode === "individual") {
      empleadoIds = selectedEmployees;
    } else if (assignMode === "filtro") {
      empleadoIds = filteredEmployees.map((e) => e.id);
    }

    if (empleadoIds.length === 0) {
      toast({
        title: "Error",
        description: "Selecciona al menos un empleado",
        variant: "destructive",
      });
      return;
    }

    asignarMutation.mutate({
      cursoId: data.cursoId,
      empleadoIds,
      fechaVencimiento: data.fechaVencimiento || undefined,
      esObligatorio: data.esObligatorio,
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Asignar Curso</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
            <div className="space-y-4 flex-shrink-0">
              <FormField
                control={form.control}
                name="cursoId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Curso</FormLabel>
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

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="fechaVencimiento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha límite (opcional)</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="esObligatorio"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2 pt-8">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="!mt-0">Curso obligatorio</FormLabel>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex-1 overflow-hidden mt-4">
              <Tabs value={assignMode} onValueChange={(v) => setAssignMode(v as "individual" | "filtro")}>
                <TabsList className="w-full">
                  <TabsTrigger value="individual" className="flex-1">
                    Individual
                  </TabsTrigger>
                  <TabsTrigger value="filtro" className="flex-1">
                    Por filtro
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="individual" className="mt-4 h-[300px] flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">
                      {selectedEmployees.length} de {activeEmpleados.length} seleccionados
                    </span>
                    <div className="space-x-2">
                      <Button type="button" variant="outline" size="sm" onClick={selectAll}>
                        Seleccionar todos
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={clearSelection}>
                        Limpiar
                      </Button>
                    </div>
                  </div>
                  <ScrollArea className="flex-1 border rounded-md">
                    <div className="p-2 space-y-1">
                      {activeEmpleados.map((empleado) => {
                        const isSelected = selectedEmployees.includes(empleado.id);
                        return (
                          <div
                            key={empleado.id}
                            className={`flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-muted ${
                              isSelected ? "bg-primary/10" : ""
                            }`}
                            onClick={() => toggleEmployee(empleado.id)}
                          >
                            <div
                              className={`h-4 w-4 shrink-0 rounded-sm border ${
                                isSelected
                                  ? "bg-primary border-primary"
                                  : "border-primary"
                              } flex items-center justify-center`}
                            >
                              {isSelected && (
                                <Check className="h-3 w-3 text-primary-foreground" />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">
                                {empleado.nombre} {empleado.apellidoPaterno}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {empleado.numeroEmpleado}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="filtro" className="mt-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Departamento</label>
                      <Select
                        value={departamentoFilter}
                        onValueChange={setDepartamentoFilter}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          {departamentos.map((d) => (
                            <SelectItem key={d.id} value={d.id}>
                              {d.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Puesto</label>
                      <Select value={puestoFilter} onValueChange={setPuestoFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          {puestos.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-2">
                      Empleados que recibirán el curso:
                    </p>
                    <p className="text-2xl font-bold">{filteredEmployees.length}</p>
                    {filteredEmployees.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {filteredEmployees.slice(0, 5).map((e) => (
                          <Badge key={e.id} variant="secondary" className="text-xs">
                            {e.nombre} {e.apellidoPaterno}
                          </Badge>
                        ))}
                        {filteredEmployees.length > 5 && (
                          <Badge variant="outline" className="text-xs">
                            +{filteredEmployees.length - 5} más
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => handleClose(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={asignarMutation.isPending}>
                {asignarMutation.isPending ? "Asignando..." : "Asignar Curso"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
