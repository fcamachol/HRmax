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
import { Plus, Search, Clock, CheckCircle, XCircle, Calendar, Users, FileText } from "lucide-react";
import { PermisoForm } from "@/components/permisos/PermisoForm";
import type { SolicitudPermiso } from "@shared/schema";

export default function Permisos() {
  const [searchTerm, setSearchTerm] = useState("");
  const [tipoFilter, setTipoFilter] = useState<string>("all");
  const [estatusFilter, setEstatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPermiso, setSelectedPermiso] = useState<SolicitudPermiso | undefined>();

  const { data: permisos = [], isLoading } = useQuery<SolicitudPermiso[]>({
    queryKey: ["/api/permisos"],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/permisos/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/permisos"] });
    },
  });

  const filteredPermisos = permisos.filter((permiso) => {
    const matchesSearch = permiso.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         permiso.empleadoId?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTipo = tipoFilter === "all" || permiso.tipoPermiso === tipoFilter;
    const matchesEstatus = estatusFilter === "all" || permiso.estatus === estatusFilter;
    return matchesSearch && matchesTipo && matchesEstatus;
  });

  const handleEdit = (permiso: SolicitudPermiso) => {
    setSelectedPermiso(permiso);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("¿Estás seguro de eliminar esta solicitud de permiso?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedPermiso(undefined);
  };

  const getTipoBadge = (tipo: string) => {
    const tipoMap: Record<string, { label: string; icon: any }> = {
      personal: { label: "Personal", icon: Users },
      defuncion: { label: "Defunción", icon: Calendar },
      matrimonio: { label: "Matrimonio", icon: Calendar },
      paternidad: { label: "Paternidad", icon: Users },
      medico: { label: "Médico", icon: FileText },
      tramite: { label: "Trámite", icon: FileText },
      otro: { label: "Otro", icon: FileText },
    };
    const config = tipoMap[tipo] || { label: tipo, icon: FileText };
    const Icon = config.icon;
    return (
      <Badge variant="outline" className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getEstatusBadge = (estatus: string) => {
    const estatusMap: Record<string, { label: string; icon: any; variant: any }> = {
      pendiente: { label: "Pendiente", icon: Clock, variant: "secondary" as const },
      aprobada: { label: "Aprobada", icon: CheckCircle, variant: "default" as const },
      rechazada: { label: "Rechazada", icon: XCircle, variant: "destructive" as const },
      cancelada: { label: "Cancelada", icon: XCircle, variant: "outline" as const },
    };
    const config = estatusMap[estatus] || {
      label: estatus,
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
          Nueva Solicitud
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por ID o empleado..."
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
            <SelectItem value="personal">Personal</SelectItem>
            <SelectItem value="defuncion">Defunción</SelectItem>
            <SelectItem value="matrimonio">Matrimonio</SelectItem>
            <SelectItem value="paternidad">Paternidad</SelectItem>
            <SelectItem value="medico">Médico</SelectItem>
            <SelectItem value="tramite">Trámite</SelectItem>
            <SelectItem value="otro">Otro</SelectItem>
          </SelectContent>
        </Select>
        <Select value={estatusFilter} onValueChange={setEstatusFilter}>
          <SelectTrigger className="w-48" data-testid="select-estatus-filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="pendiente">Pendiente</SelectItem>
            <SelectItem value="aprobada">Aprobada</SelectItem>
            <SelectItem value="rechazada">Rechazada</SelectItem>
            <SelectItem value="cancelada">Cancelada</SelectItem>
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
              <TableHead>Días</TableHead>
              <TableHead>Con Goce</TableHead>
              <TableHead>Motivo</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8">
                  Cargando solicitudes...
                </TableCell>
              </TableRow>
            ) : filteredPermisos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                  No se encontraron solicitudes de permiso
                </TableCell>
              </TableRow>
            ) : (
              filteredPermisos.map((permiso) => (
                <TableRow key={permiso.id} data-testid={`row-permiso-${permiso.id}`}>
                  <TableCell className="font-medium max-w-[100px] truncate" data-testid={`text-permiso-id-${permiso.id}`}>
                    {permiso.id}
                  </TableCell>
                  <TableCell data-testid={`text-empleado-id-${permiso.id}`}>
                    {permiso.empleadoId}
                  </TableCell>
                  <TableCell>{getTipoBadge(permiso.tipoPermiso)}</TableCell>
                  <TableCell>{getEstatusBadge(permiso.estatus)}</TableCell>
                  <TableCell>
                    {new Date(permiso.fechaInicio).toLocaleDateString('es-MX', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </TableCell>
                  <TableCell>
                    {new Date(permiso.fechaFin).toLocaleDateString('es-MX', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </TableCell>
                  <TableCell>{permiso.diasSolicitados || 0} días</TableCell>
                  <TableCell>
                    <Badge variant={permiso.conGoce ? "default" : "outline"}>
                      {permiso.conGoce ? "Sí" : "No"}
                    </Badge>
                  </TableCell>
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
