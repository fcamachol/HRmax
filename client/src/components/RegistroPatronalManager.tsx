import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Trash2, Pencil, Building, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { RegistroPatronal, InsertRegistroPatronal } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertRegistroPatronalSchema, clasesRiesgo } from "@shared/schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
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

interface RegistroPatronalManagerProps {
  empresaId: string;
}

export default function RegistroPatronalManager({ empresaId }: RegistroPatronalManagerProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRegistro, setEditingRegistro] = useState<RegistroPatronal | null>(null);
  const { toast } = useToast();

  const { data: registros = [], isLoading } = useQuery<RegistroPatronal[]>({
    queryKey: ["/api/registros-patronales", empresaId],
    queryFn: async () => {
      const response = await fetch(`/api/registros-patronales?empresaId=${empresaId}`);
      if (!response.ok) throw new Error("Error al cargar registros patronales");
      return response.json();
    },
  });

  const deleteRegistroMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/registros-patronales/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/registros-patronales", empresaId] });
      toast({
        title: "Registro patronal eliminado",
        description: "El registro patronal ha sido eliminado correctamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el registro patronal",
        variant: "destructive",
      });
    },
  });

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingRegistro(null);
  };

  const handleSuccess = () => {
    handleFormClose();
    queryClient.invalidateQueries({ queryKey: ["/api/registros-patronales", empresaId] });
  };

  if (isLoading) {
    return <div className="text-center py-4 text-muted-foreground">Cargando registros patronales...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Gestiona los registros patronales (IMSS) de esta empresa
        </p>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button size="sm" data-testid="button-nuevo-registro-patronal">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Registro
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingRegistro ? "Editar Registro Patronal" : "Nuevo Registro Patronal"}
              </DialogTitle>
              <DialogDescription>
                Configura el registro patronal IMSS y su clase de riesgo
              </DialogDescription>
            </DialogHeader>
            <RegistroPatronalForm
              empresaId={empresaId}
              registro={editingRegistro || undefined}
              onSuccess={handleSuccess}
              onCancel={handleFormClose}
            />
          </DialogContent>
        </Dialog>
      </div>

      {registros.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Building className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground mb-3">
              No hay registros patronales configurados
            </p>
            <Button size="sm" onClick={() => setIsFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Agregar Primer Registro
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {registros.map((registro) => (
            <Card key={registro.id} className="hover-elevate" data-testid={`card-registro-${registro.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate">
                      {registro.nombreCentroTrabajo}
                    </CardTitle>
                    <CardDescription className="mt-1 font-mono text-sm">
                      {registro.numeroRegistroPatronal}
                    </CardDescription>
                  </div>
                  <Badge variant={registro.estatus === 'activo' ? 'default' : 'secondary'}>
                    {registro.estatus}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Clase de Riesgo IMSS:</span>
                    <Badge variant="outline" className="font-mono">
                      Clase {registro.claseRiesgo}
                    </Badge>
                  </div>
                  {registro.primaRiesgo && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Prima de Riesgo:</span>
                      <span className="font-medium">{parseFloat(registro.primaRiesgo).toFixed(5)}%</span>
                    </div>
                  )}
                  {registro.municipio && registro.estado && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Ubicación:</span>
                      <span>{registro.municipio}, {registro.estado}</span>
                    </div>
                  )}
                  {registro.descripcionActividad && (
                    <div className="mt-2 pt-2 border-t">
                      <p className="text-xs text-muted-foreground">
                        {registro.descripcionActividad}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingRegistro(registro);
                      setIsFormOpen(true);
                    }}
                    data-testid={`button-editar-registro-${registro.id}`}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        data-testid={`button-eliminar-registro-${registro.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar registro patronal?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción eliminará permanentemente el registro patronal "{registro.nombreCentroTrabajo}".
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteRegistroMutation.mutate(registro.id!)}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

interface RegistroPatronalFormProps {
  empresaId: string;
  registro?: RegistroPatronal;
  onSuccess?: () => void;
  onCancel?: () => void;
}

function RegistroPatronalForm({ empresaId, registro, onSuccess, onCancel }: RegistroPatronalFormProps) {
  const { toast } = useToast();
  const isEditing = !!registro;

  const form = useForm<InsertRegistroPatronal>({
    resolver: zodResolver(insertRegistroPatronalSchema),
    defaultValues: registro || {
      empresaId,
      numeroRegistroPatronal: "",
      nombreCentroTrabajo: "",
      calle: "",
      numeroExterior: "",
      numeroInterior: "",
      colonia: "",
      municipio: "",
      estado: "",
      codigoPostal: "",
      claseRiesgo: "I",
      primaRiesgo: "0.50000",
      divisionEconomica: "",
      grupoActividad: "",
      fraccionActividad: "",
      descripcionActividad: "",
      estatus: "activo",
      notas: "",
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: InsertRegistroPatronal) => {
      // Convert numeric fields to strings
      const payload = {
        ...data,
        primaRiesgo: data.primaRiesgo?.toString() || "0.50000",
      };
      
      const endpoint = isEditing ? `/api/registros-patronales/${registro.id}` : "/api/registros-patronales";
      const method = isEditing ? "PATCH" : "POST";
      return await apiRequest(method, endpoint, payload);
    },
    onSuccess: () => {
      toast({
        title: isEditing ? "Registro actualizado" : "Registro creado",
        description: isEditing
          ? "El registro patronal ha sido actualizado correctamente"
          : "El registro patronal ha sido creado correctamente",
      });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar el registro patronal",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertRegistroPatronal) => {
    saveMutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="numeroRegistroPatronal"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número de Registro Patronal (IMSS) *</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    maxLength={11}
                    placeholder="12345678901"
                    className="font-mono"
                    data-testid="input-numero-registro-patronal"
                  />
                </FormControl>
                <FormDescription className="text-xs">
                  11 caracteres asignados por el IMSS
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="nombreCentroTrabajo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre del Centro de Trabajo *</FormLabel>
                <FormControl>
                  <Input {...field} data-testid="input-nombre-centro-trabajo" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="claseRiesgo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Clase de Riesgo IMSS *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value || "I"}>
                  <FormControl>
                    <SelectTrigger data-testid="select-clase-riesgo">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {clasesRiesgo.map((clase) => (
                      <SelectItem key={clase} value={clase}>
                        Clase {clase} - {
                          clase === 'I' ? 'Mínimo' :
                          clase === 'II' ? 'Bajo' :
                          clase === 'III' ? 'Medio' :
                          clase === 'IV' ? 'Alto' : 'Máximo'
                        }
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription className="text-xs">
                  Según catálogo de actividades del IMSS
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="primaRiesgo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prima de Riesgo (%)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value || ""}
                    type="number"
                    step="0.00001"
                    min="0"
                    max="15"
                    placeholder="0.50000"
                    data-testid="input-prima-riesgo"
                  />
                </FormControl>
                <FormDescription className="text-xs">
                  Porcentaje de prima (ej: 1.51952 = 1.51952%)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium">Ubicación del Centro de Trabajo</h4>
          <div className="grid gap-4 md:grid-cols-3">
            <FormField
              control={form.control}
              name="calle"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Calle</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="numeroExterior"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>No. Ext</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="colonia"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Colonia</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="municipio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Municipio</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="estado"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium">Clasificación de Actividad Económica</h4>
          <div className="grid gap-4 md:grid-cols-3">
            <FormField
              control={form.control}
              name="divisionEconomica"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>División</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} placeholder="Ej: Industria Manufacturera" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="grupoActividad"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Grupo</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} placeholder="Ej: Fabricación de..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fraccionActividad"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fracción</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} placeholder="Ej: 123-45" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="descripcionActividad"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descripción de Actividad</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    value={field.value || ""}
                    rows={2}
                    placeholder="Descripción detallada de las actividades realizadas en este centro de trabajo..."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="estatus"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estatus</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value || "activo"}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="activo">Activo</SelectItem>
                    <SelectItem value="suspendido">Suspendido</SelectItem>
                    <SelectItem value="baja">Baja</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notas"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notas</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  value={field.value || ""}
                  rows={2}
                  placeholder="Información adicional sobre este registro patronal..."
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          )}
          <Button type="submit" disabled={saveMutation.isPending}>
            {saveMutation.isPending
              ? isEditing
                ? "Actualizando..."
                : "Creando..."
              : isEditing
              ? "Actualizar"
              : "Crear Registro"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
