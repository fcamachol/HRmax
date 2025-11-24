import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertDepartamentoSchema, type InsertDepartamento, type Departamento, type Empresa } from "@shared/schema";

interface DepartamentoFormProps {
  departamento?: Departamento;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function DepartamentoForm({ departamento, onSuccess, onCancel }: DepartamentoFormProps) {
  const { toast } = useToast();
  const isEditing = !!departamento;

  const { data: empresas = [] } = useQuery<Empresa[]>({
    queryKey: ["/api/empresas"],
  });

  const form = useForm<InsertDepartamento>({
    resolver: zodResolver(insertDepartamentoSchema),
    defaultValues: departamento || {
      empresaId: "",
      nombre: "",
      descripcion: "",
      responsable: "",
      telefono: "",
      email: "",
      presupuestoAnual: "",
      numeroEmpleados: 0,
      estatus: "activo",
      notas: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertDepartamento) => {
      const endpoint = isEditing ? `/api/departamentos/${departamento.id}` : "/api/departamentos";
      const method = isEditing ? "PATCH" : "POST";
      return await apiRequest(method, endpoint, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/departamentos"] });
      toast({
        title: isEditing ? "Departamento actualizado" : "Departamento creado",
        description: isEditing
          ? "El departamento ha sido actualizado correctamente"
          : "El departamento ha sido creado correctamente",
      });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar el departamento",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertDepartamento) => {
    createMutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="empresaId"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Empresa *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-empresa">
                      <SelectValue placeholder="Seleccionar empresa" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {empresas.map((empresa) => (
                      <SelectItem key={empresa.id} value={empresa.id}>
                        {empresa.razonSocial}
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
            name="nombre"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Nombre del Departamento *</FormLabel>
                <FormControl>
                  <Input {...field} data-testid="input-nombre" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="descripcion"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Descripción</FormLabel>
                <FormControl>
                  <Textarea {...field} value={field.value || ""} data-testid="input-descripcion" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="responsable"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Responsable</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ""} data-testid="input-responsable" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="telefono"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Teléfono</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ""} data-testid="input-telefono" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" {...field} value={field.value || ""} data-testid="input-email" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="presupuestoAnual"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Presupuesto Anual</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} value={field.value || ""} data-testid="input-presupuesto" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="numeroEmpleados"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número de Empleados</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    {...field} 
                    value={field.value || 0}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    data-testid="input-numero-empleados" 
                  />
                </FormControl>
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
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-estatus">
                      <SelectValue placeholder="Seleccionar estatus" />
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

          <FormField
            control={form.control}
            name="notas"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Notas</FormLabel>
                <FormControl>
                  <Textarea {...field} value={field.value || ""} data-testid="input-notas" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex gap-2 justify-end">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} data-testid="button-cancel">
              Cancelar
            </Button>
          )}
          <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit">
            {createMutation.isPending ? "Guardando..." : isEditing ? "Actualizar" : "Crear"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
