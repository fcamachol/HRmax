import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Users,
  UserPlus,
  Filter,
  Search,
  CheckCircle,
  Clock,
  AlertCircle,
  MoreHorizontal,
  Trash2,
  Eye,
  Send,
  Calendar,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useCliente } from "@/contexts/ClienteContext";
import { AsignarCursoDialog } from "@/components/cursos/AsignarCursoDialog";
import type { AsignacionCurso, Curso, Employee } from "@shared/schema";

interface AsignacionConDetalles extends AsignacionCurso {
  curso: Curso;
  empleado: Employee;
}

export default function Asignaciones() {
  const { clienteActual } = useCliente();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [estatusFilter, setEstatusFilter] = useState<string>("todos");
  const [cursoFilter, setCursoFilter] = useState<string>("todos");
  const [asignarDialogOpen, setAsignarDialogOpen] = useState(false);

  const { data: asignaciones = [], isLoading } = useQuery<AsignacionConDetalles[]>({
    queryKey: ["/api/asignaciones-cursos", clienteActual?.id],
    enabled: !!clienteActual?.id,
  });

  const { data: cursos = [] } = useQuery<Curso[]>({
    queryKey: ["/api/cursos", clienteActual?.id],
    enabled: !!clienteActual?.id,
  });

  const eliminarMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/asignaciones-cursos/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/asignaciones-cursos"] });
      toast({ title: "Asignación eliminada" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const reenviarNotificacionMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("POST", `/api/asignaciones-cursos/${id}/notificar`);
    },
    onSuccess: () => {
      toast({ title: "Notificación enviada" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const filteredAsignaciones = asignaciones.filter((a) => {
    const matchesSearch =
      a.empleado?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.empleado?.apellidoPaterno?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.curso?.nombre?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesEstatus = estatusFilter === "todos" || a.estatus === estatusFilter;
    const matchesCurso = cursoFilter === "todos" || a.cursoId === cursoFilter;

    return matchesSearch && matchesEstatus && matchesCurso;
  });

  const stats = {
    total: asignaciones.length,
    enProgreso: asignaciones.filter((a) => a.estatus === "en_progreso").length,
    completados: asignaciones.filter((a) => a.estatus === "completado").length,
    vencidos: asignaciones.filter((a) => a.estatus === "vencido").length,
  };

  const getEstatusColor = (estatus: string) => {
    switch (estatus) {
      case "completado":
        return "bg-green-100 text-green-800";
      case "en_progreso":
        return "bg-blue-100 text-blue-800";
      case "asignado":
        return "bg-gray-100 text-gray-800";
      case "vencido":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getEstatusLabel = (estatus: string) => {
    switch (estatus) {
      case "completado":
        return "Completado";
      case "en_progreso":
        return "En progreso";
      case "asignado":
        return "Asignado";
      case "vencido":
        return "Vencido";
      default:
        return estatus;
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Asignaciones de Cursos</h1>
          <p className="text-muted-foreground">
            Gestiona las asignaciones de cursos a empleados
          </p>
        </div>
        <Button onClick={() => setAsignarDialogOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Asignar Curso
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total asignaciones</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.enProgreso}</p>
                <p className="text-sm text-muted-foreground">En progreso</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.completados}</p>
                <p className="text-sm text-muted-foreground">Completados</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.vencidos}</p>
                <p className="text-sm text-muted-foreground">Vencidos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por empleado o curso..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={estatusFilter} onValueChange={setEstatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Estatus" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estatus</SelectItem>
                <SelectItem value="asignado">Asignado</SelectItem>
                <SelectItem value="en_progreso">En progreso</SelectItem>
                <SelectItem value="completado">Completado</SelectItem>
                <SelectItem value="vencido">Vencido</SelectItem>
              </SelectContent>
            </Select>
            <Select value={cursoFilter} onValueChange={setCursoFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Curso" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los cursos</SelectItem>
                {cursos.map((curso) => (
                  <SelectItem key={curso.id} value={curso.id}>
                    {curso.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empleado</TableHead>
                <TableHead>Curso</TableHead>
                <TableHead>Progreso</TableHead>
                <TableHead>Estatus</TableHead>
                <TableHead>Fecha Asignación</TableHead>
                <TableHead>Fecha Vencimiento</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Cargando...
                  </TableCell>
                </TableRow>
              ) : filteredAsignaciones.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No hay asignaciones que mostrar
                  </TableCell>
                </TableRow>
              ) : (
                filteredAsignaciones.map((asignacion) => (
                  <TableRow key={asignacion.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {asignacion.empleado?.nombre} {asignacion.empleado?.apellidoPaterno}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {asignacion.empleado?.numeroEmpleado}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{asignacion.curso?.nombre}</p>
                        {asignacion.esObligatorio && (
                          <Badge variant="destructive" className="text-xs mt-1">
                            Obligatorio
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="w-32">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span>{asignacion.porcentajeProgreso || 0}%</span>
                        </div>
                        <Progress value={asignacion.porcentajeProgreso || 0} className="h-2" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getEstatusColor(asignacion.estatus)}>
                        {getEstatusLabel(asignacion.estatus)}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(asignacion.fechaAsignacion)}</TableCell>
                    <TableCell>
                      {asignacion.fechaVencimiento ? (
                        <span
                          className={
                            new Date(asignacion.fechaVencimiento) < new Date()
                              ? "text-red-600"
                              : ""
                          }
                        >
                          {formatDate(asignacion.fechaVencimiento)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Sin fecha límite</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => reenviarNotificacionMutation.mutate(asignacion.id)}
                          >
                            <Send className="h-4 w-4 mr-2" />
                            Reenviar notificación
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => eliminarMutation.mutate(asignacion.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AsignarCursoDialog
        open={asignarDialogOpen}
        onOpenChange={setAsignarDialogOpen}
      />
    </div>
  );
}
