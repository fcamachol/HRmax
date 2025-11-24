import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Building, Pencil, Trash2, Users } from "lucide-react";
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
import type { Departamento, Empresa } from "@shared/schema";
import DepartamentoForm from "@/components/DepartamentoForm";

export default function Departamentos() {
  const [selectedDepartamento, setSelectedDepartamento] = useState<Departamento | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { toast } = useToast();

  const { data: departamentos = [], isLoading } = useQuery<Departamento[]>({
    queryKey: ["/api/departamentos"],
  });

  const { data: empresas = [] } = useQuery<Empresa[]>({
    queryKey: ["/api/empresas"],
  });

  const deleteDepartamentoMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/departamentos/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/departamentos"] });
      toast({
        title: "Departamento eliminado",
        description: "El departamento ha sido eliminado correctamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el departamento",
        variant: "destructive",
      });
    },
  });

  const handleDepartamentoCreated = () => {
    setIsFormOpen(false);
    setSelectedDepartamento(null);
    queryClient.invalidateQueries({ queryKey: ["/api/departamentos"] });
  };

  const getEmpresaNombre = (empresaId: string) => {
    return empresas.find((e) => e.id === empresaId)?.razonSocial || "Sin empresa";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Cargando departamentos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Departamentos</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona los departamentos de tu organización
          </p>
        </div>

        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setSelectedDepartamento(null)} data-testid="button-nuevo-departamento">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Departamento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedDepartamento ? "Editar Departamento" : "Nuevo Departamento"}
              </DialogTitle>
              <DialogDescription>
                {selectedDepartamento
                  ? "Actualiza la información del departamento"
                  : "Registra un nuevo departamento"}
              </DialogDescription>
            </DialogHeader>
            <DepartamentoForm
              departamento={selectedDepartamento || undefined}
              onSuccess={handleDepartamentoCreated}
              onCancel={() => setIsFormOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {departamentos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">No hay departamentos registrados</p>
            <p className="text-muted-foreground text-sm mb-4">
              Crea tu primer departamento para comenzar
            </p>
            <Button onClick={() => setIsFormOpen(true)} data-testid="button-crear-primero">
              <Plus className="h-4 w-4 mr-2" />
              Crear Departamento
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {departamentos.map((departamento) => (
            <Card key={departamento.id} data-testid={`card-departamento-${departamento.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{departamento.nombre}</CardTitle>
                    <CardDescription className="mt-1">
                      {getEmpresaNombre(departamento.empresaId)}
                    </CardDescription>
                  </div>
                  <Badge variant={departamento.estatus === "activo" ? "default" : "secondary"}>
                    {departamento.estatus}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {departamento.descripcion && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {departamento.descripcion}
                  </p>
                )}

                <div className="space-y-2 text-sm">
                  {departamento.responsable && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Responsable:</span>
                      <span>{departamento.responsable}</span>
                    </div>
                  )}
                  {departamento.numeroEmpleados !== undefined && (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{departamento.numeroEmpleados} empleados</span>
                    </div>
                  )}
                  {departamento.presupuestoAnual && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Presupuesto:</span>
                      <span>${parseFloat(departamento.presupuestoAnual).toLocaleString()}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setSelectedDepartamento(departamento);
                      setIsFormOpen(true);
                    }}
                    data-testid={`button-editar-${departamento.id}`}
                  >
                    <Pencil className="h-3 w-3 mr-1" />
                    Editar
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        data-testid={`button-eliminar-${departamento.id}`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar departamento?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción no se puede deshacer. El departamento "{departamento.nombre}"
                          será eliminado permanentemente.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteDepartamentoMutation.mutate(departamento.id)}
                          data-testid={`button-confirmar-eliminar-${departamento.id}`}
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
