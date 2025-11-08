import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, MapPin, Pencil, Trash2, Users, Clock } from "lucide-react";
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
import type { CentroTrabajo, Empresa } from "@shared/schema";
import CentroTrabajoForm from "@/components/CentroTrabajoForm";
import AsignacionEmpleados from "@/components/AsignacionEmpleados";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function CentrosTrabajo() {
  const [selectedCentro, setSelectedCentro] = useState<CentroTrabajo | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCentro, setEditingCentro] = useState<CentroTrabajo | null>(null);
  const { toast } = useToast();

  const { data: centros = [], isLoading } = useQuery<CentroTrabajo[]>({
    queryKey: ["/api/centros-trabajo"],
  });

  const { data: empresas = [] } = useQuery<Empresa[]>({
    queryKey: ["/api/empresas"],
  });

  const deleteCentroMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/centros-trabajo/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/centros-trabajo"] });
      toast({
        title: "Centro de trabajo eliminado",
        description: "El centro de trabajo ha sido eliminado correctamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el centro de trabajo",
        variant: "destructive",
      });
    },
  });

  const handleCentroCreated = () => {
    setIsFormOpen(false);
    setEditingCentro(null);
    queryClient.invalidateQueries({ queryKey: ["/api/centros-trabajo"] });
  };

  const handleEdit = (centro: CentroTrabajo) => {
    setEditingCentro(centro);
    setIsFormOpen(true);
  };

  const getEmpresaName = (empresaId: string) => {
    const empresa = empresas.find(e => e.id === empresaId);
    return empresa?.razonSocial || "N/A";
  };

  const formatDireccion = (centro: CentroTrabajo): string | null => {
    const parts = [
      centro.calle,
      centro.numeroExterior && `#${centro.numeroExterior}`,
      centro.colonia,
      centro.municipio,
      centro.estado,
      centro.codigoPostal && `CP ${centro.codigoPostal}`
    ].filter(Boolean);
    
    return parts.length > 0 ? parts.join(', ') : null;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Cargando centros de trabajo...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Centros de Trabajo</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona los centros de trabajo, horarios y asignación de empleados
          </p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setEditingCentro(null);
        }}>
          <DialogTrigger asChild>
            <Button data-testid="button-nuevo-centro">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Centro
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCentro ? "Editar Centro de Trabajo" : "Crear Centro de Trabajo"}
              </DialogTitle>
              <DialogDescription>
                {editingCentro ? "Actualiza la información del centro de trabajo" : "Agrega un nuevo centro de trabajo al sistema"}
              </DialogDescription>
            </DialogHeader>
            <CentroTrabajoForm
              centro={editingCentro}
              onSuccess={handleCentroCreated}
              onCancel={() => {
                setIsFormOpen(false);
                setEditingCentro(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {centros.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay centros de trabajo registrados</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Comienza agregando tu primer centro de trabajo al sistema
            </p>
            <Button onClick={() => setIsFormOpen(true)} data-testid="button-crear-primer-centro">
              <Plus className="mr-2 h-4 w-4" />
              Crear Primer Centro
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {centros.map((centro) => (
            <Card key={centro.id} className="hover-elevate" data-testid={`card-centro-${centro.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">
                      {centro.nombre}
                    </CardTitle>
                    <CardDescription className="mt-1 truncate">
                      {getEmpresaName(centro.empresaId)}
                    </CardDescription>
                  </div>
                  <Badge variant={centro.estatus === 'activo' ? 'default' : 'secondary'}>
                    {centro.estatus === 'activo' ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {formatDireccion(centro) && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground line-clamp-2">{formatDireccion(centro)}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-muted-foreground">
                        Entrada: {centro.horaEntrada} - Salida: {centro.horaSalida}
                      </span>
                      {centro.turno && (
                        <span className="text-xs text-muted-foreground">
                          Turno: {centro.turno}
                        </span>
                      )}
                    </div>
                  </div>

                  {centro.descripcion && (
                    <p className="text-muted-foreground text-xs line-clamp-2 mt-2">
                      {centro.descripcion}
                    </p>
                  )}
                </div>

                <div className="flex gap-2 mt-4">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => setSelectedCentro(centro)}
                        data-testid={`button-gestionar-${centro.id}`}
                      >
                        <Users className="mr-2 h-4 w-4" />
                        Gestionar
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>{centro.nombre}</DialogTitle>
                        <DialogDescription>
                          Gestiona empleados y configuración del centro de trabajo
                        </DialogDescription>
                      </DialogHeader>
                      <Tabs defaultValue="empleados" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="empleados">Empleados Asignados</TabsTrigger>
                          <TabsTrigger value="info">Información</TabsTrigger>
                        </TabsList>
                        <TabsContent value="empleados" className="mt-4">
                          <AsignacionEmpleados centroTrabajoId={centro.id!} />
                        </TabsContent>
                        <TabsContent value="info" className="mt-4 space-y-4">
                          <div className="grid gap-4 md:grid-cols-2">
                            <div>
                              <h4 className="text-sm font-medium text-muted-foreground mb-2">Información General</h4>
                              <dl className="space-y-2">
                                <div>
                                  <dt className="text-sm font-medium">Nombre</dt>
                                  <dd className="text-sm text-muted-foreground">{centro.nombre}</dd>
                                </div>
                                <div>
                                  <dt className="text-sm font-medium">Empresa</dt>
                                  <dd className="text-sm text-muted-foreground">{getEmpresaName(centro.empresaId)}</dd>
                                </div>
                                {formatDireccion(centro) && (
                                  <div>
                                    <dt className="text-sm font-medium">Dirección</dt>
                                    <dd className="text-sm text-muted-foreground">{formatDireccion(centro)}</dd>
                                  </div>
                                )}
                                {centro.descripcion && (
                                  <div>
                                    <dt className="text-sm font-medium">Descripción</dt>
                                    <dd className="text-sm text-muted-foreground">{centro.descripcion}</dd>
                                  </div>
                                )}
                              </dl>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-muted-foreground mb-2">Horarios y Turnos</h4>
                              <dl className="space-y-2">
                                <div>
                                  <dt className="text-sm font-medium">Horario de Entrada</dt>
                                  <dd className="text-sm text-muted-foreground">{centro.horaEntrada}</dd>
                                </div>
                                <div>
                                  <dt className="text-sm font-medium">Horario de Salida</dt>
                                  <dd className="text-sm text-muted-foreground">{centro.horaSalida}</dd>
                                </div>
                                {centro.turno && (
                                  <div>
                                    <dt className="text-sm font-medium">Turno</dt>
                                    <dd className="text-sm text-muted-foreground">{centro.turno}</dd>
                                  </div>
                                )}
                                {centro.registroPatronalId && (
                                  <div>
                                    <dt className="text-sm font-medium">Registro Patronal</dt>
                                    <dd className="text-sm text-muted-foreground">Vinculado</dd>
                                  </div>
                                )}
                              </dl>
                            </div>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </DialogContent>
                  </Dialog>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(centro)}
                    data-testid={`button-editar-${centro.id}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        data-testid={`button-eliminar-${centro.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar centro de trabajo?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción no se puede deshacer. Se eliminará el centro "{centro.nombre}" y todas sus asignaciones.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteCentroMutation.mutate(centro.id!)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
