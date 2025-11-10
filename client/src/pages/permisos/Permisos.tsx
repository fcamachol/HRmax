import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Clock, CheckCircle, XCircle, User, Calendar } from "lucide-react";
import { PermisoForm } from "@/components/permisos/PermisoForm";
import type { Permiso } from "@shared/schema";

export default function Permisos() {
  const [searchTerm, setSearchTerm] = useState("");
  const [tipoFilter, setTipoFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPermiso, setSelectedPermiso] = useState<Permiso | undefined>();

  const { data: permisos = [], isLoading } = useQuery<Permiso[]>({
    queryKey: ["/api/permisos"],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/permisos/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/permisos"] });
    },
  });

  const filteredPermisos = permisos.filter((permiso) => {
    const matchesSearch = permiso.id?.toString().includes(searchTerm.toLowerCase());
    const matchesTipo = tipoFilter === "all" || permiso.tipo === tipoFilter;
    const matchesStatus = statusFilter === "all" || permiso.status === statusFilter;
    return matchesSearch && matchesTipo && matchesStatus;
  });

  const handleEdit = (permiso: Permiso) => {
    setSelectedPermiso(permiso);
    setDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("¿Estás seguro de eliminar este permiso?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedPermiso(undefined);
  };

  const getTipoBadge = (tipo: string) => {
    const tipoMap = {
      permiso_personal: { label: "Personal", icon: User },
      permiso_medico: { label: "Médico", icon: Clock },
      permiso_oficial: { label: "Oficial", icon: Calendar },
    };
    const config = tipoMap[tipo as keyof typeof tipoMap] || { label: tipo, icon: Clock };
    const Icon = config.icon;
    return (
      <Badge variant="outline" className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pendiente: { label: "Pendiente", icon: Clock, variant: "secondary" as const },
      aprobado: { label: "Aprobado", icon: CheckCircle, variant: "default" as const },
      rechazado: { label: "Rechazado", icon: XCircle, variant: "destructive" as const },
    };
    const config = statusMap[status as keyof typeof statusMap] || {
      label: status,
      icon: Clock,
      variant: "secondary" as const,
    };
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Permisos</h1>
          <p className="text-muted-foreground">
            Gestión de solicitudes de permisos del personal
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} data-testid="button-nuevo-permiso">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Permiso
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="input-buscar-permisos"
          />
        </div>
        <Select value={tipoFilter} onValueChange={setTipoFilter}>
          <SelectTrigger className="w-48" data-testid="select-tipo-filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            <SelectItem value="permiso_personal">Personal</SelectItem>
            <SelectItem value="permiso_medico">Médico</SelectItem>
            <SelectItem value="permiso_oficial">Oficial</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48" data-testid="select-status-filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="pendiente">Pendiente</SelectItem>
            <SelectItem value="aprobado">Aprobado</SelectItem>
            <SelectItem value="rechazado">Rechazado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Empleado</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha Inicio</TableHead>
              <TableHead>Fecha Fin</TableHead>
              <TableHead>Horas</TableHead>
              <TableHead>Motivo</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  Cargando permisos...
                </TableCell>
              </TableRow>
            ) : filteredPermisos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  No se encontraron permisos
                </TableCell>
              </TableRow>
            ) : (
              filteredPermisos.map((permiso) => (
                <TableRow key={permiso.id} data-testid={`row-permiso-${permiso.id}`}>
                  <TableCell className="font-medium" data-testid={`text-permiso-id-${permiso.id}`}>
                    {permiso.id}
                  </TableCell>
                  <TableCell data-testid={`text-empleado-id-${permiso.id}`}>
                    {permiso.empleadoId}
                  </TableCell>
                  <TableCell>{getTipoBadge(permiso.tipo)}</TableCell>
                  <TableCell>{getStatusBadge(permiso.status)}</TableCell>
                  <TableCell>
                    {new Date(permiso.fechaHoraInicio).toLocaleDateString('es-MX', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </TableCell>
                  <TableCell>
                    {new Date(permiso.fechaHoraFin).toLocaleDateString('es-MX', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </TableCell>
                  <TableCell>{permiso.horasSolicitadas || 0}h</TableCell>
                  <TableCell className="max-w-xs truncate" data-testid={`text-motivo-${permiso.id}`}>
                    {permiso.motivo || "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(permiso)}
                        data-testid={`button-editar-permiso-${permiso.id}`}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(permiso.id!)}
                        data-testid={`button-eliminar-permiso-${permiso.id}`}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <PermisoForm
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        initialData={selectedPermiso}
      />
    </div>
  );
}
