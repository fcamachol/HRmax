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
import { Plus, Search, FileText, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { ActaAdministrativaForm } from "@/components/actas-administrativas/ActaAdministrativaForm";
import type { ActaAdministrativa, ActaAdministrativaWithEmpleado } from "@shared/schema";

export default function ActasAdministrativas() {
  const [searchTerm, setSearchTerm] = useState("");
  const [tipoFaltaFilter, setTipoFaltaFilter] = useState<string>("all");
  const [estatusFilter, setEstatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedActa, setSelectedActa] = useState<ActaAdministrativa | undefined>();

  const { data: actas = [], isLoading } = useQuery<ActaAdministrativaWithEmpleado[]>({
    queryKey: ["/api/actas-administrativas"],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/actas-administrativas/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/actas-administrativas"] });
    },
  });

  const filteredActas = actas.filter((acta) => {
    const empleadoNombre = acta.empleado 
      ? `${acta.empleado.nombre} ${acta.empleado.apellidoPaterno} ${acta.empleado.apellidoMaterno || ''}`.trim()
      : '';
    const matchesSearch = acta.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         empleadoNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         acta.empleado?.numeroEmpleado?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         acta.numeroActa?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTipoFalta = tipoFaltaFilter === "all" || acta.tipoFalta === tipoFaltaFilter;
    const matchesEstatus = estatusFilter === "all" || acta.estatus === estatusFilter;
    return matchesSearch && matchesTipoFalta && matchesEstatus;
  });

  const handleEdit = (acta: ActaAdministrativa) => {
    setSelectedActa(acta);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("¿Estás seguro de eliminar esta acta administrativa?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedActa(undefined);
  };

  const getTipoFaltaBadge = (tipo: string) => {
    const tipoMap: Record<string, { label: string; variant: any }> = {
      leve: { label: "Leve", variant: "secondary" as const },
      grave: { label: "Grave", variant: "default" as const },
      muy_grave: { label: "Muy Grave", variant: "destructive" as const },
    };
    const config = tipoMap[tipo] || { label: tipo, variant: "secondary" as const };
    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    );
  };

  const getEstatusBadge = (estatus: string) => {
    const estatusMap: Record<string, { label: string; icon: any; variant: any }> = {
      pendiente: { label: "Pendiente", icon: Clock, variant: "secondary" as const },
      aplicada: { label: "Aplicada", icon: CheckCircle, variant: "default" as const },
      apelada: { label: "Apelada", icon: AlertCircle, variant: "destructive" as const },
      anulada: { label: "Anulada", icon: FileText, variant: "outline" as const },
      archivada: { label: "Archivada", icon: FileText, variant: "outline" as const },
    };
    const config = estatusMap[estatus] || {
      label: estatus,
      icon: FileText,
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
          <h1 className="text-3xl font-bold">Actas Administrativas</h1>
          <p className="text-muted-foreground">
            Gestión de actas administrativas y sanciones disciplinarias
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} data-testid="button-nueva-acta">
          <Plus className="h-4 w-4 mr-2" />
          Nueva Acta
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, número de empleado o número de acta..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="input-buscar-actas"
          />
        </div>
        <Select value={tipoFaltaFilter} onValueChange={setTipoFaltaFilter}>
          <SelectTrigger className="w-48" data-testid="select-tipo-falta-filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            <SelectItem value="leve">Leve</SelectItem>
            <SelectItem value="grave">Grave</SelectItem>
            <SelectItem value="muy_grave">Muy Grave</SelectItem>
          </SelectContent>
        </Select>
        <Select value={estatusFilter} onValueChange={setEstatusFilter}>
          <SelectTrigger className="w-48" data-testid="select-estatus-filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="pendiente">Pendiente</SelectItem>
            <SelectItem value="aplicada">Aplicada</SelectItem>
            <SelectItem value="apelada">Apelada</SelectItem>
            <SelectItem value="anulada">Anulada</SelectItem>
            <SelectItem value="archivada">Archivada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número Acta</TableHead>
              <TableHead>Empleado</TableHead>
              <TableHead>Tipo Falta</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha Elaboración</TableHead>
              <TableHead>Sanción</TableHead>
              <TableHead>Hechos</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  Cargando actas administrativas...
                </TableCell>
              </TableRow>
            ) : filteredActas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No se encontraron actas administrativas
                </TableCell>
              </TableRow>
            ) : (
              filteredActas.map((acta) => {
                const empleadoNombre = acta.empleado 
                  ? `${acta.empleado.nombre} ${acta.empleado.apellidoPaterno} ${acta.empleado.apellidoMaterno || ''}`.trim()
                  : 'Empleado no encontrado';
                return (
                  <TableRow key={acta.id} data-testid={`row-acta-${acta.id}`}>
                    <TableCell className="font-medium" data-testid={`text-numero-acta-${acta.id}`}>
                      {acta.numeroActa || "-"}
                    </TableCell>
                    <TableCell data-testid={`text-empleado-id-${acta.id}`}>
                      <div>
                        <div>{empleadoNombre}</div>
                        {acta.empleado && (
                          <div className="text-xs text-muted-foreground">{acta.empleado.numeroEmpleado}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getTipoFaltaBadge(acta.tipoFalta)}</TableCell>
                    <TableCell>{getEstatusBadge(acta.estatus)}</TableCell>
                    <TableCell>
                      {new Date(acta.fechaElaboracion).toLocaleDateString('es-MX', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {acta.sancionAplicada === "amonestacion" && "Amonestación"}
                        {acta.sancionAplicada === "suspension" && acta.diasSuspension && `Suspensión (${acta.diasSuspension} días)`}
                        {acta.sancionAplicada === "descuento" && acta.montoDescuento && `Descuento ($${acta.montoDescuento})`}
                        {acta.sancionAplicada === "despido" && "Despido"}
                        {acta.sancionAplicada === "ninguna" && "Ninguna"}
                        {!acta.sancionAplicada && "-"}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate" data-testid={`text-hechos-${acta.id}`}>
                      {acta.descripcionHechos || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(acta)}
                          data-testid={`button-editar-acta-${acta.id}`}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(acta.id!)}
                          data-testid={`button-eliminar-acta-${acta.id}`}
                        >
                          Eliminar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <ActaAdministrativaForm
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        initialData={selectedActa}
      />
    </div>
  );
}
