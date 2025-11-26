import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2 } from "lucide-react";

const esquemaFormSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  descripcion: z.string().optional(),
  activo: z.boolean().default(true),
});

type EsquemaFormValues = z.infer<typeof esquemaFormSchema>;

interface EsquemaPresta {
  id: string;
  nombre: string;
  descripcion: string | null;
  esLey: boolean;
  activo: boolean;
}

interface TipoBeneficio {
  id: string;
  codigo: string;
  nombre: string;
  unidad: string;
  valorMinimoLegal: string | null;
}

interface EsquemaVacaciones {
  id: string;
  esquemaId: string;
  aniosAntiguedad: number;
  diasVacaciones: number;
}

interface EsquemaBeneficio {
  id: string;
  esquemaId: string;
  tipoBeneficioId: string;
  valor: string;
  activo: boolean;
}

interface EsquemaFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  esquema?: EsquemaPresta;
  tiposBeneficio: TipoBeneficio[];
}

export function EsquemaFormDialog({ open, onOpenChange, esquema, tiposBeneficio }: EsquemaFormDialogProps) {
  const { toast } = useToast();
  const isEditing = !!esquema?.id;

  const [vacacionesRows, setVacacionesRows] = useState<Array<{ aniosAntiguedad: number; diasVacaciones: number }>>([]);
  const [beneficiosRows, setBeneficiosRows] = useState<Array<{ tipoBeneficioId: string; valor: string }>>([]);

  const { data: existingVacaciones } = useQuery<EsquemaVacaciones[]>({
    queryKey: ["/api/esquemas-prestaciones", esquema?.id, "vacaciones"],
    enabled: isEditing && open,
  });

  const { data: existingBeneficios } = useQuery<EsquemaBeneficio[]>({
    queryKey: ["/api/esquemas-prestaciones", esquema?.id, "beneficios"],
    enabled: isEditing && open,
  });

  useEffect(() => {
    if (existingVacaciones && isEditing) {
      setVacacionesRows(
        existingVacaciones.map(v => ({
          aniosAntiguedad: v.aniosAntiguedad,
          diasVacaciones: v.diasVacaciones,
        }))
      );
    } else if (!isEditing) {
      setVacacionesRows([
        { aniosAntiguedad: 1, diasVacaciones: 12 },
        { aniosAntiguedad: 2, diasVacaciones: 14 },
        { aniosAntiguedad: 3, diasVacaciones: 16 },
        { aniosAntiguedad: 4, diasVacaciones: 18 },
        { aniosAntiguedad: 5, diasVacaciones: 20 },
      ]);
    }
  }, [existingVacaciones, isEditing, open]);

  useEffect(() => {
    if (existingBeneficios && isEditing) {
      setBeneficiosRows(
        existingBeneficios.filter(b => b.activo).map(b => ({
          tipoBeneficioId: b.tipoBeneficioId,
          valor: b.valor,
        }))
      );
    } else if (!isEditing) {
      const aguinaldo = tiposBeneficio.find(t => t.codigo === "AGUINALDO");
      const primaVac = tiposBeneficio.find(t => t.codigo === "PRIMA_VACACIONAL");
      const rows = [];
      if (aguinaldo) rows.push({ tipoBeneficioId: aguinaldo.id, valor: "15" });
      if (primaVac) rows.push({ tipoBeneficioId: primaVac.id, valor: "25" });
      setBeneficiosRows(rows);
    }
  }, [existingBeneficios, tiposBeneficio, isEditing, open]);

  const form = useForm<EsquemaFormValues>({
    resolver: zodResolver(esquemaFormSchema),
    defaultValues: {
      nombre: "",
      descripcion: "",
      activo: true,
    },
  });

  useEffect(() => {
    if (esquema && open) {
      form.reset({
        nombre: esquema.nombre,
        descripcion: esquema.descripcion || "",
        activo: esquema.activo,
      });
    } else if (!esquema && open) {
      form.reset({
        nombre: "",
        descripcion: "",
        activo: true,
      });
    }
  }, [esquema, open, form]);

  const createMutation = useMutation({
    mutationFn: async (data: { esquema: EsquemaFormValues; vacaciones: typeof vacacionesRows; beneficios: typeof beneficiosRows }) => {
      const esquemaRes = await apiRequest("POST", "/api/esquemas-prestaciones", data.esquema);
      const newEsquema = await esquemaRes.json();

      for (const vac of data.vacaciones) {
        await apiRequest("POST", `/api/esquemas-prestaciones/${newEsquema.id}/vacaciones`, vac);
      }

      for (const ben of data.beneficios) {
        await apiRequest("POST", `/api/esquemas-prestaciones/${newEsquema.id}/beneficios`, ben);
      }

      return newEsquema;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/esquemas-prestaciones"] });
      toast({
        title: "Esquema creado",
        description: "El esquema de prestaciones ha sido creado correctamente.",
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el esquema",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { esquema: EsquemaFormValues }) => {
      return await apiRequest("PATCH", `/api/esquemas-prestaciones/${esquema!.id}`, data.esquema);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/esquemas-prestaciones"] });
      queryClient.invalidateQueries({ queryKey: ["/api/esquemas-prestaciones", esquema!.id, "vacaciones"] });
      queryClient.invalidateQueries({ queryKey: ["/api/esquemas-prestaciones", esquema!.id, "beneficios"] });
      toast({
        title: "Esquema actualizado",
        description: "El esquema de prestaciones ha sido actualizado correctamente.",
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el esquema",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EsquemaFormValues) => {
    if (isEditing) {
      updateMutation.mutate({ esquema: data });
    } else {
      createMutation.mutate({ esquema: data, vacaciones: vacacionesRows, beneficios: beneficiosRows });
    }
  };

  const addVacacionRow = () => {
    const maxYear = Math.max(0, ...vacacionesRows.map(v => v.aniosAntiguedad));
    setVacacionesRows([...vacacionesRows, { aniosAntiguedad: maxYear + 1, diasVacaciones: 12 }]);
  };

  const removeVacacionRow = (index: number) => {
    setVacacionesRows(vacacionesRows.filter((_, i) => i !== index));
  };

  const updateVacacionRow = (index: number, field: "aniosAntiguedad" | "diasVacaciones", value: number) => {
    const updated = [...vacacionesRows];
    updated[index][field] = value;
    setVacacionesRows(updated);
  };

  const addBeneficioRow = () => {
    const usedIds = beneficiosRows.map(b => b.tipoBeneficioId);
    const available = tiposBeneficio.filter(t => !usedIds.includes(t.id));
    if (available.length > 0) {
      setBeneficiosRows([...beneficiosRows, { tipoBeneficioId: available[0].id, valor: "0" }]);
    }
  };

  const removeBeneficioRow = (index: number) => {
    setBeneficiosRows(beneficiosRows.filter((_, i) => i !== index));
  };

  const updateBeneficioRow = (index: number, field: "tipoBeneficioId" | "valor", value: string) => {
    const updated = [...beneficiosRows];
    updated[index][field] = value;
    setBeneficiosRows(updated);
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  const getUnidadLabel = (tipoBeneficioId: string) => {
    const tipo = tiposBeneficio.find(t => t.id === tipoBeneficioId);
    if (!tipo) return "";
    switch (tipo.unidad) {
      case "dias": return "días";
      case "porcentaje": return "%";
      case "monto_fijo": return "$";
      case "porcentaje_salario": return "% salario";
      default: return tipo.unidad;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto" data-testid="dialog-esquema-form">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Esquema de Prestaciones" : "Nuevo Esquema de Prestaciones"}
          </DialogTitle>
          <DialogDescription>
            Configura el nombre, beneficios y tabla de vacaciones del esquema.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="vacaciones">Vacaciones</TabsTrigger>
                <TabsTrigger value="beneficios">Beneficios</TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="space-y-4 mt-4">
                <FormField
                  control={form.control}
                  name="nombre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre del Esquema</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Ej: Ejecutivos, Sindicalizados, Administrativos"
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
                  name="descripcion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción (opcional)</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Descripción del esquema..."
                          rows={3}
                          data-testid="input-descripcion-esquema"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="activo"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Activo</FormLabel>
                        <FormDescription>
                          Los esquemas inactivos no se pueden asignar a nuevos puestos
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-activo"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="vacaciones" className="space-y-4 mt-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Define los días de vacaciones por antigüedad
                  </p>
                  <Button type="button" variant="outline" size="sm" onClick={addVacacionRow} data-testid="button-add-vacacion">
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Año
                  </Button>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Años de Antigüedad</TableHead>
                      <TableHead>Días de Vacaciones</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vacacionesRows.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Input
                            type="number"
                            min="1"
                            value={row.aniosAntiguedad}
                            onChange={(e) => updateVacacionRow(index, "aniosAntiguedad", parseInt(e.target.value) || 1)}
                            className="w-24"
                            data-testid={`input-vac-anios-${index}`}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="1"
                            value={row.diasVacaciones}
                            onChange={(e) => updateVacacionRow(index, "diasVacaciones", parseInt(e.target.value) || 1)}
                            className="w-24"
                            data-testid={`input-vac-dias-${index}`}
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeVacacionRow(index)}
                            data-testid={`button-remove-vac-${index}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="beneficios" className="space-y-4 mt-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Configura aguinaldo, primas y otros beneficios
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addBeneficioRow}
                    disabled={beneficiosRows.length >= tiposBeneficio.length}
                    data-testid="button-add-beneficio"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Beneficio
                  </Button>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo de Beneficio</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {beneficiosRows.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <select
                            value={row.tipoBeneficioId}
                            onChange={(e) => updateBeneficioRow(index, "tipoBeneficioId", e.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            data-testid={`select-beneficio-tipo-${index}`}
                          >
                            {tiposBeneficio.map((tipo) => (
                              <option key={tipo.id} value={tipo.id}>
                                {tipo.nombre}
                              </option>
                            ))}
                          </select>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              step="0.01"
                              value={row.valor}
                              onChange={(e) => updateBeneficioRow(index, "valor", e.target.value)}
                              className="w-24"
                              data-testid={`input-beneficio-valor-${index}`}
                            />
                            <span className="text-sm text-muted-foreground">
                              {getUnidadLabel(row.tipoBeneficioId)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeBeneficioRow(index)}
                            data-testid={`button-remove-beneficio-${index}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
                data-testid="button-cancelar-esquema"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending} data-testid="button-guardar-esquema">
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? "Actualizar" : "Crear"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
