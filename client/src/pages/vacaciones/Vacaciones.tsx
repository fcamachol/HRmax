import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, MoreVertical, Calendar, CheckCircle, XCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { type SolicitudVacaciones, type InsertSolicitudVacaciones, type SolicitudVacacionesWithEmpleado } from "@shared/schema";
import { VacacionesForm } from "@/components/vacaciones/VacacionesForm";

const statusLabels = {
  pendiente: "Pendiente",
  aprobada: "Aprobada",
  rechazada: "Rechazada",
  cancelada: "Cancelada"
};

const statusVariants = {
  pendiente: "secondary",
  aprobada: "default",
  rechazada: "destructive",
  cancelada: "outline"
} as const;

const statusIcons = {
  pendiente: Clock,
  aprobada: CheckCircle,
  rechazada: XCircle,
  cancelada: XCircle
};

type EstatusSolicitud = "pendiente" | "aprobada" | "rechazada" | "cancelada";

export default function Vacaciones() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<EstatusSolicitud | "todos">("todos");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSolicitud, setEditingSolicitud] = useState<SolicitudVacaciones | null>(null);
  const { toast } = useToast();

  const { data: solicitudes = [], isLoading } = useQuery<SolicitudVacacionesWithEmpleado[]>({
    queryKey: ["/api/vacaciones"],
  });

  const createSolicitudMutation = useMutation({
    mutationFn: async (data: InsertSolicitudVacaciones) => {
      const response = await apiRequest("POST", "/api/vacaciones", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vacaciones"] });
      setIsFormOpen(false);
      setEditingSolicitud(null);
      toast({
        title: "Solicitud creada",
        description: "La solicitud de vacaciones ha sido registrada exitosamente",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateSolicitudMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertSolicitudVacaciones> }) => {
      const response = await apiRequest("PATCH", `/api/vacaciones/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vacaciones"] });
      setIsFormOpen(false);
      setEditingSolicitud(null);
      toast({
        title: "Solicitud actualizada",
        description: "Los cambios han sido guardados exitosamente",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteSolicitudMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/vacaciones/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vacaciones"] });
      toast({
        title: "Solicitud eliminada",
        description: "La solicitud de vacaciones ha sido eliminada exitosamente",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const approveSolicitudMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("PATCH", `/api/vacaciones/${id}`, { estatus: "aprobada" });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vacaciones"] });
      toast({
        title: "Solicitud aprobada",
        description: "La solicitud de vacaciones ha sido aprobada",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const rejectSolicitudMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("PATCH", `/api/vacaciones/${id}`, { estatus: "rechazada" });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vacaciones"] });
      toast({
        title: "Solicitud rechazada",
        description: "La solicitud de vacaciones ha sido rechazada",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredSolicitudes = solicitudes.filter((solicitud) => {
    const searchLower = search.toLowerCase();
    const empleadoNombre = solicitud.empleado 
      ? `${solicitud.empleado.nombre} ${solicitud.empleado.apellidoPaterno} ${solicitud.empleado.apellidoMaterno || ''}`.trim()
      : '';
    const matchesSearch =
      !search ||
      empleadoNombre.toLowerCase().includes(searchLower) ||
      solicitud.empleado?.numeroEmpleado.toLowerCase().includes(searchLower);

    const matchesStatus = statusFilter === "todos" || solicitud.estatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleFormSubmit = (data: InsertSolicitudVacaciones) => {
    if (editingSolicitud) {
      updateSolicitudMutation.mutate({ id: editingSolicitud.id, data });
    } else {
      createSolicitudMutation.mutate(data);
    }
  };

  const handleFormClose = (open: boolean) => {
    setIsFormOpen(open);
    if (!open) {
      setEditingSolicitud(null);
    }
  };

  const handleEditSolicitud = (solicitud: SolicitudVacaciones) => {
    setEditingSolicitud(solicitud);
    setIsFormOpen(true);
  };

  const handleDeleteSolicitud = (id: string) => {
    if (confirm("¿Estás seguro de que deseas eliminar esta solicitud de vacaciones?")) {
      deleteSolicitudMutation.mutate(id);
    }
  };

  const handleApproveSolicitud = (id: string) => {
    if (confirm("¿Estás seguro de que deseas aprobar esta solicitud de vacaciones?")) {
      approveSolicitudMutation.mutate(id);
    }
  };

  const handleRejectSolicitud = (id: string) => {
    if (confirm("¿Estás seguro de que deseas rechazar esta solicitud de vacaciones?")) {
      rejectSolicitudMutation.mutate(id);
    }
  };

  const calculateDias = (fechaInicio: string, fechaFin: string): number => {
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    
    if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) return 0;
    if (fin < inicio) return 0;
    
    let count = 0;
    const current = new Date(inicio);
    
    while (current <= fin) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }
    
    return count;
  };

  return (
    <div className="px-6 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-semibold" data-testid="text-page-title">Vacaciones</h1>
            <p className="text-sm mt-1">Gestión de solicitudes de vacaciones</p>
          </div>
          <Button
            onClick={() => setIsFormOpen(true)}
            data-testid="button-nueva-solicitud"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nueva Solicitud
          </Button>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="flex gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" />
                <Input
                  placeholder="Buscar por nombre o número de empleado..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                  data-testid="input-buscar-vacaciones"
                />
              </div>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as EstatusSolicitud | "todos")}>
                <SelectTrigger className="w-[200px]" data-testid="select-status-filter">
                  <SelectValue placeholder="Filtrar por estatus" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los estatus</SelectItem>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="aprobada">Aprobada</SelectItem>
                  <SelectItem value="rechazada">Rechazada</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-sm">Cargando solicitudes...</p>
              </div>
            ) : filteredSolicitudes.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No hay solicitudes</h3>
                <p className="text-sm mb-6">
                  {search || statusFilter !== "todos"
                    ? "No se encontraron solicitudes con los filtros aplicados"
                    : "Comienza creando una nueva solicitud de vacaciones"}
                </p>
                {!search && statusFilter === "todos" && (
                  <Button onClick={() => setIsFormOpen(true)} data-testid="button-crear-primera-solicitud">
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Primera Solicitud
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empleado</TableHead>
                    <TableHead>Fecha Inicio</TableHead>
                    <TableHead>Fecha Fin</TableHead>
                    <TableHead>Días</TableHead>
                    <TableHead>Estatus</TableHead>
                    <TableHead>Observaciones</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSolicitudes.map((solicitud) => {
                    const estatus = solicitud.estatus as EstatusSolicitud;
                    const StatusIcon = statusIcons[estatus];
                    const dias = calculateDias(solicitud.fechaInicio, solicitud.fechaFin);
                    const empleadoNombre = solicitud.empleado 
                      ? `${solicitud.empleado.nombre} ${solicitud.empleado.apellidoPaterno} ${solicitud.empleado.apellidoMaterno || ''}`.trim()
                      : 'Empleado no encontrado';
                    
                    return (
                      <TableRow key={solicitud.id} data-testid={`row-solicitud-${solicitud.id}`}>
                        <TableCell className="font-medium" data-testid={`text-empleado-${solicitud.id}`}>
                          <div>
                            <div>{empleadoNombre}</div>
                            {solicitud.empleado && (
                              <div className="text-xs text-muted-foreground">{solicitud.empleado.numeroEmpleado}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell data-testid={`text-fecha-inicio-${solicitud.id}`}>
                          {format(new Date(solicitud.fechaInicio), "dd/MM/yyyy", { locale: es })}
                        </TableCell>
                        <TableCell data-testid={`text-fecha-fin-${solicitud.id}`}>
                          {format(new Date(solicitud.fechaFin), "dd/MM/yyyy", { locale: es })}
                        </TableCell>
                        <TableCell data-testid={`text-dias-${solicitud.id}`}>
                          {dias}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusVariants[estatus]} data-testid={`badge-estatus-${solicitud.id}`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusLabels[estatus]}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate" data-testid={`text-observaciones-${solicitud.id}`}>
                          {solicitud.motivo || "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" data-testid={`button-actions-${solicitud.id}`}>
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {solicitud.estatus === "pendiente" && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => handleApproveSolicitud(solicitud.id)}
                                    data-testid={`button-aprobar-${solicitud.id}`}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Aprobar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleRejectSolicitud(solicitud.id)}
                                    data-testid={`button-rechazar-${solicitud.id}`}
                                  >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Rechazar
                                  </DropdownMenuItem>
                                </>
                              )}
                              <DropdownMenuItem
                                onClick={() => handleEditSolicitud(solicitud)}
                                data-testid={`button-editar-${solicitud.id}`}
                              >
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteSolicitud(solicitud.id)}
                                className="text-destructive"
                                data-testid={`button-eliminar-${solicitud.id}`}
                              >
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <VacacionesForm
        open={isFormOpen}
        onOpenChange={handleFormClose}
        onSubmit={handleFormSubmit}
        initialData={editingSolicitud}
        isPending={createSolicitudMutation.isPending || updateSolicitudMutation.isPending}
      />
    </div>
  );
}
