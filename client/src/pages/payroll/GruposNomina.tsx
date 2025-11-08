import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Plus, 
  Trash2, 
  Users,
  CheckCircle2,
  XCircle
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
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
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { GrupoNomina } from "@shared/schema";
import { CreateGrupoNominaDialog } from "@/components/CreateGrupoNominaDialog";

export default function GruposNomina() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<string | null>(null);

  const { data: gruposNomina = [], isLoading } = useQuery<GrupoNomina[]>({
    queryKey: ["/api/grupos-nomina"],
  });

  const deleteGroup = async (groupId: string) => {
    try {
      await apiRequest("DELETE", `/api/grupos-nomina/${groupId}`, undefined);
      
      queryClient.invalidateQueries({ queryKey: ["/api/grupos-nomina"] });
      
      toast({
        title: "Grupo eliminado",
        description: "El grupo de nómina ha sido eliminado exitosamente",
      });
    } catch (error: any) {
      toast({
        title: "Error al eliminar grupo",
        description: error.message || "No se pudo eliminar el grupo de nómina",
        variant: "destructive",
      });
    } finally {
      setGroupToDelete(null);
    }
  };

  const getPeriodoLabel = (tipoPeriodo: string) => {
    const labels = {
      semanal: "Semanal (~52 periodos/año)",
      catorcenal: "Catorcenal (~26 periodos/año)",
      quincenal: "Quincenal (24 periodos/año)",
      mensual: "Mensual (12 periodos/año)",
    };
    return labels[tipoPeriodo as keyof typeof labels] || tipoPeriodo;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Grupos de Nómina</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona los grupos de nómina y su configuración de periodicidad
          </p>
        </div>
        <CreateGrupoNominaDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          trigger={
            <DialogTrigger asChild>
              <Button data-testid="button-create-grupo">
                <Plus className="h-4 w-4 mr-2" />
                Crear Grupo
              </Button>
            </DialogTrigger>
          }
        />
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Cargando grupos de nómina...</p>
          </CardContent>
        </Card>
      ) : gruposNomina.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay grupos de nómina</h3>
            <p className="text-muted-foreground mb-4">
              Crea tu primer grupo para comenzar a organizar la nómina
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Crear Primer Grupo
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Grupos Configurados</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Periodicidad</TableHead>
                  <TableHead>Día de Pago</TableHead>
                  <TableHead>Días Cálculo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {gruposNomina.map((grupo) => (
                  <TableRow key={grupo.id} data-testid={`row-grupo-${grupo.id}`}>
                    <TableCell className="font-medium">{grupo.nombre}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getPeriodoLabel(grupo.tipoPeriodo)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {grupo.diaPago !== null && grupo.diaPago !== undefined ? (
                        grupo.tipoPeriodo === "semanal" || grupo.tipoPeriodo === "catorcenal" ? (
                          ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"][grupo.diaPago]
                        ) : (
                          `Día ${grupo.diaPago}`
                        )
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {grupo.diasCalculo ? `${grupo.diasCalculo} días` : <span className="text-muted-foreground">-</span>}
                    </TableCell>
                    <TableCell>
                      {grupo.activo ? (
                        <Badge variant="default" className="gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Activo
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <XCircle className="h-3 w-3" />
                          Inactivo
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {grupo.descripcion || <span className="text-muted-foreground">-</span>}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setGroupToDelete(grupo.id!)}
                        data-testid={`button-delete-grupo-${grupo.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={!!groupToDelete} onOpenChange={(open) => !open && setGroupToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar grupo de nómina?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará el grupo y todos los periodos de pago asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => groupToDelete && deleteGroup(groupToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
