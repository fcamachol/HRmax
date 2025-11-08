import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
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
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  insertTurnoCentroTrabajoSchema,
  type InsertTurnoCentroTrabajo,
  type TurnoCentroTrabajo,
} from "@shared/schema";
import { Plus, Pencil, Trash2, Clock, Loader2 } from "lucide-react";

interface TurnosManagerProps {
  centroTrabajoId: string;
  centroTrabajoNombre: string;
}

export default function TurnosManager({ centroTrabajoId, centroTrabajoNombre }: TurnosManagerProps) {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTurno, setEditingTurno] = useState<TurnoCentroTrabajo | null>(null);
  const [turnoToDelete, setTurnoToDelete] = useState<TurnoCentroTrabajo | null>(null);

  const { data: turnos = [], isLoading } = useQuery<TurnoCentroTrabajo[]>({
    queryKey: ["/api/turnos-centro-trabajo", centroTrabajoId],
    queryFn: async () => {
      const response = await fetch(`/api/turnos-centro-trabajo?centroTrabajoId=${centroTrabajoId}`);
      if (!response.ok) throw new Error("Error al cargar turnos");
      return response.json();
    },
  });

  const form = useForm<InsertTurnoCentroTrabajo>({
    resolver: zodResolver(insertTurnoCentroTrabajoSchema),
    defaultValues: {
      centroTrabajoId,
      nombre: "",
      descripcion: "",
      horaInicio: "09:00",
      horaFin: "18:00",
      minutosToleranciaEntrada: 10,
      minutosToleranciaComida: 60,
      trabajaLunes: true,
      trabajaMartes: true,
      trabajaMiercoles: true,
      trabajaJueves: true,
      trabajaViernes: true,
      trabajaSabado: false,
      trabajaDomingo: false,
      estatus: "activo",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: InsertTurnoCentroTrabajo) => {
      if (editingTurno?.id) {
        return await apiRequest("PATCH", `/api/turnos-centro-trabajo/${editingTurno.id}`, data);
      }
      return await apiRequest("POST", "/api/turnos-centro-trabajo", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/turnos-centro-trabajo"] });
      toast({
        title: editingTurno ? "Turno actualizado" : "Turno creado",
        description: editingTurno
          ? "El turno ha sido actualizado correctamente"
          : "El turno ha sido creado correctamente",
      });
      setIsDialogOpen(false);
      setEditingTurno(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar el turno",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/turnos-centro-trabajo/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/turnos-centro-trabajo"] });
      toast({
        title: "Turno eliminado",
        description: "El turno ha sido eliminado correctamente",
      });
      setTurnoToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el turno",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (turno: TurnoCentroTrabajo) => {
    setEditingTurno(turno);
    form.reset({
      centroTrabajoId: turno.centroTrabajoId,
      nombre: turno.nombre,
      descripcion: turno.descripcion || "",
      horaInicio: turno.horaInicio,
      horaFin: turno.horaFin,
      minutosToleranciaEntrada: turno.minutosToleranciaEntrada || 10,
      minutosToleranciaComida: turno.minutosToleranciaComida || 60,
      trabajaLunes: turno.trabajaLunes || false,
      trabajaMartes: turno.trabajaMartes || false,
      trabajaMiercoles: turno.trabajaMiercoles || false,
      trabajaJueves: turno.trabajaJueves || false,
      trabajaViernes: turno.trabajaViernes || false,
      trabajaSabado: turno.trabajaSabado || false,
      trabajaDomingo: turno.trabajaDomingo || false,
      estatus: turno.estatus || "activo",
      notas: turno.notas || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (turno: TurnoCentroTrabajo) => {
    setTurnoToDelete(turno);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingTurno(null);
    form.reset({
      centroTrabajoId,
      nombre: "",
      descripcion: "",
      horaInicio: "09:00",
      horaFin: "18:00",
      minutosToleranciaEntrada: 10,
      minutosToleranciaComida: 60,
      trabajaLunes: true,
      trabajaMartes: true,
      trabajaMiercoles: true,
      trabajaJueves: true,
      trabajaViernes: true,
      trabajaSabado: false,
      trabajaDomingo: false,
      estatus: "activo",
    });
  };

  const onSubmit = (data: InsertTurnoCentroTrabajo) => {
    mutation.mutate(data);
  };

  const getDiasLaborales = (turno: TurnoCentroTrabajo): string[] => {
    const dias: string[] = [];
    if (turno.trabajaLunes) dias.push("Lun");
    if (turno.trabajaMartes) dias.push("Mar");
    if (turno.trabajaMiercoles) dias.push("Mié");
    if (turno.trabajaJueves) dias.push("Jue");
    if (turno.trabajaViernes) dias.push("Vie");
    if (turno.trabajaSabado) dias.push("Sáb");
    if (turno.trabajaDomingo) dias.push("Dom");
    return dias;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Turnos de {centroTrabajoNombre}</h2>
          <p className="text-sm text-muted-foreground">
            Gestiona los diferentes turnos laborales de este centro de trabajo
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleDialogClose()} data-testid="button-agregar-turno">
              <Plus className="mr-2 h-4 w-4" />
              Agregar Turno
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTurno ? "Editar Turno" : "Nuevo Turno"}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="nombre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre del Turno</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Ej: Matutino, Vespertino, Nocturno"
                          data-testid="input-nombre-turno"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="horaInicio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hora de Inicio</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="time"
                            data-testid="input-hora-inicio-turno"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="horaFin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hora de Fin</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="time"
                            data-testid="input-hora-fin-turno"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-3">
                  <FormLabel>Días Laborales</FormLabel>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <FormField
                      control={form.control}
                      name="trabajaLunes"
                      render={({ field }) => (
                        <FormItem className="flex items-center gap-2 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value || false}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-dia-lunes"
                            />
                          </FormControl>
                          <FormLabel className="!mt-0 cursor-pointer">Lunes</FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="trabajaMartes"
                      render={({ field }) => (
                        <FormItem className="flex items-center gap-2 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value || false}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-dia-martes"
                            />
                          </FormControl>
                          <FormLabel className="!mt-0 cursor-pointer">Martes</FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="trabajaMiercoles"
                      render={({ field }) => (
                        <FormItem className="flex items-center gap-2 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value || false}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-dia-miercoles"
                            />
                          </FormControl>
                          <FormLabel className="!mt-0 cursor-pointer">Miércoles</FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="trabajaJueves"
                      render={({ field }) => (
                        <FormItem className="flex items-center gap-2 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value || false}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-dia-jueves"
                            />
                          </FormControl>
                          <FormLabel className="!mt-0 cursor-pointer">Jueves</FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="trabajaViernes"
                      render={({ field }) => (
                        <FormItem className="flex items-center gap-2 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value || false}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-dia-viernes"
                            />
                          </FormControl>
                          <FormLabel className="!mt-0 cursor-pointer">Viernes</FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="trabajaSabado"
                      render={({ field }) => (
                        <FormItem className="flex items-center gap-2 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value || false}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-dia-sabado"
                            />
                          </FormControl>
                          <FormLabel className="!mt-0 cursor-pointer">Sábado</FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="trabajaDomingo"
                      render={({ field }) => (
                        <FormItem className="flex items-center gap-2 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value || false}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-dia-domingo"
                            />
                          </FormControl>
                          <FormLabel className="!mt-0 cursor-pointer">Domingo</FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleDialogClose}
                    disabled={mutation.isPending}
                    data-testid="button-cancelar-turno"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={mutation.isPending}
                    data-testid="button-guardar-turno"
                  >
                    {mutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {editingTurno ? "Actualizar" : "Crear"} Turno
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : turnos.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No hay turnos configurados para este centro de trabajo
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Agrega el primer turno haciendo clic en "Agregar Turno"
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {turnos.map((turno) => (
            <Card key={turno.id} data-testid={`card-turno-${turno.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{turno.nombre}</CardTitle>
                    <CardDescription>
                      {turno.horaInicio} - {turno.horaFin}
                    </CardDescription>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(turno)}
                      data-testid={`button-editar-turno-${turno.id}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(turno)}
                      data-testid={`button-eliminar-turno-${turno.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Días laborales
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {getDiasLaborales(turno).map((dia) => (
                        <span
                          key={dia}
                          className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
                        >
                          {dia}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!turnoToDelete} onOpenChange={() => setTurnoToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente el turno "{turnoToDelete?.nombre}".
              Los empleados asignados a este turno quedarán sin asignación.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancelar-eliminar-turno">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => turnoToDelete && deleteMutation.mutate(turnoToDelete.id!)}
              disabled={deleteMutation.isPending}
              data-testid="button-confirmar-eliminar-turno"
            >
              {deleteMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
