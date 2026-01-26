import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Settings,
  Plus,
  Trash2,
  Edit,
  ToggleLeft,
  ToggleRight,
  Zap,
  Users,
  Building2,
  Briefcase,
  Calendar,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { useCliente } from "@/contexts/ClienteContext";
import { ReglaAsignacionDialog } from "@/components/cursos/ReglaAsignacionDialog";
import type { ReglaAsignacionCurso, Curso, Departamento, Puesto } from "@shared/schema";

interface ReglaConDetalles extends ReglaAsignacionCurso {
  curso: Curso;
  departamento?: Departamento;
  puesto?: Puesto;
}

export default function ReglasAsignacion() {
  const { clienteActual } = useCliente();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRegla, setEditingRegla] = useState<ReglaConDetalles | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: reglas = [], isLoading } = useQuery<ReglaConDetalles[]>({
    queryKey: ["/api/reglas-asignacion-cursos", clienteActual?.id],
    enabled: !!clienteActual?.id,
  });

  const toggleActivaMutation = useMutation({
    mutationFn: async ({ id, activa }: { id: string; activa: boolean }) => {
      return (await apiRequest("PATCH", `/api/reglas-asignacion-cursos/${id}`, { activa })).json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reglas-asignacion-cursos"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const eliminarMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/reglas-asignacion-cursos/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reglas-asignacion-cursos"] });
      toast({ title: "Regla eliminada" });
      setDeleteId(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const ejecutarReglasMutation = useMutation({
    mutationFn: async () => {
      return (await apiRequest("POST", "/api/reglas-asignacion-cursos/ejecutar")).json();
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/asignaciones-cursos"] });
      toast({
        title: "Reglas ejecutadas",
        description: `Se crearon ${result.asignaciones} nuevas asignaciones`,
      });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleEdit = (regla: ReglaConDetalles) => {
    setEditingRegla(regla);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingRegla(null);
  };

  const getTipoEventoIcon = (tipo: string) => {
    switch (tipo) {
      case "nuevo_ingreso":
        return <Users className="h-4 w-4" />;
      case "cambio_departamento":
        return <Building2 className="h-4 w-4" />;
      case "cambio_puesto":
        return <Briefcase className="h-4 w-4" />;
      case "fecha_renovacion":
        return <Calendar className="h-4 w-4" />;
      default:
        return <Zap className="h-4 w-4" />;
    }
  };

  const getTipoEventoLabel = (tipo: string) => {
    switch (tipo) {
      case "nuevo_ingreso":
        return "Nuevo ingreso";
      case "cambio_departamento":
        return "Cambio de departamento";
      case "cambio_puesto":
        return "Cambio de puesto";
      case "fecha_renovacion":
        return "Renovación anual";
      default:
        return tipo;
    }
  };

  const getCriteriosLabel = (regla: ReglaConDetalles) => {
    const criterios: string[] = [];
    if (regla.departamento) criterios.push(`Depto: ${regla.departamento.nombre}`);
    if (regla.puesto) criterios.push(`Puesto: ${regla.puesto.nombre}`);
    if (!regla.departamentoId && !regla.puestoId) criterios.push("Todos los empleados");
    return criterios.join(", ");
  };

  const reglasActivas = reglas.filter((r) => r.activa);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reglas de Asignación Automática</h1>
          <p className="text-muted-foreground">
            Configura reglas para asignar cursos automáticamente
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => ejecutarReglasMutation.mutate()}
            disabled={ejecutarReglasMutation.isPending || reglasActivas.length === 0}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${ejecutarReglasMutation.isPending ? "animate-spin" : ""}`} />
            Ejecutar reglas
          </Button>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Regla
          </Button>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Nuevos Ingresos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Asigna cursos automáticamente cuando un empleado es dado de alta
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Cambios Organizacionales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Asigna cursos cuando hay cambios de departamento o puesto
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Renovaciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Reasigna cursos periódicamente para mantener certificaciones
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Rules table */}
      <Card>
        <CardHeader>
          <CardTitle>Reglas Configuradas</CardTitle>
          <CardDescription>
            {reglasActivas.length} regla(s) activa(s) de {reglas.length} total
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Curso</TableHead>
                <TableHead>Evento</TableHead>
                <TableHead>Criterios</TableHead>
                <TableHead>Días para completar</TableHead>
                <TableHead>Activa</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Cargando...
                  </TableCell>
                </TableRow>
              ) : reglas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No hay reglas configuradas. Crea una para comenzar.
                  </TableCell>
                </TableRow>
              ) : (
                reglas.map((regla) => (
                  <TableRow key={regla.id}>
                    <TableCell className="font-medium">{regla.nombre}</TableCell>
                    <TableCell>{regla.curso?.nombre}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="flex items-center gap-1 w-fit">
                        {getTipoEventoIcon(regla.tipoEvento)}
                        {getTipoEventoLabel(regla.tipoEvento)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {getCriteriosLabel(regla)}
                    </TableCell>
                    <TableCell>
                      {regla.diasParaCompletar ? `${regla.diasParaCompletar} días` : "Sin límite"}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={regla.activa}
                        onCheckedChange={(checked) =>
                          toggleActivaMutation.mutate({ id: regla.id, activa: checked })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(regla)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-600"
                          onClick={() => setDeleteId(regla.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ReglaAsignacionDialog
        open={dialogOpen}
        onOpenChange={handleCloseDialog}
        regla={editingRegla}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar regla?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La regla dejará de asignar cursos automáticamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteId && eliminarMutation.mutate(deleteId)}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
