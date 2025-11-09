import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Search, MoreVertical, Briefcase, Calendar } from "lucide-react";
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { VacanteForm } from "@/components/reclutamiento/VacanteForm";
import { VacanteRequisitosDialog } from "@/components/reclutamiento/VacanteRequisitosDialog";
import type { Vacante, InsertVacante, Puesto, VacanteStatus, VacantePriority, CentroTrabajo } from "@shared/schema";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function Vacantes() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<VacanteStatus | "todas">("todas");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVacante, setEditingVacante] = useState<Vacante | null>(null);
  const [requisitosVacante, setRequisitosVacante] = useState<Vacante | null>(null);
  const [isRequisitosOpen, setIsRequisitosOpen] = useState(false);
  const { toast } = useToast();

  const { data: vacantes = [], isLoading } = useQuery<Vacante[]>({
    queryKey: ["/api/vacantes"],
  });

  const { data: puestos = [] } = useQuery<Puesto[]>({
    queryKey: ["/api/puestos"],
  });

  const { data: centrosTrabajo = [] } = useQuery<CentroTrabajo[]>({
    queryKey: ["/api/centros-trabajo"],
  });

  const createVacanteMutation = useMutation({
    mutationFn: async (data: InsertVacante) => {
      const response = await apiRequest("POST", "/api/vacantes", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vacantes"] });
      setIsFormOpen(false);
      setEditingVacante(null);
      toast({
        title: "Vacante creada",
        description: "La vacante ha sido creada exitosamente",
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

  const updateVacanteMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertVacante> }) => {
      const response = await apiRequest("PATCH", `/api/vacantes/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vacantes"] });
      setIsFormOpen(false);
      setEditingVacante(null);
      toast({
        title: "Vacante actualizada",
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

  const deleteVacanteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/vacantes/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vacantes"] });
      toast({
        title: "Vacante eliminada",
        description: "La vacante ha sido eliminada exitosamente",
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

  const filteredVacantes = vacantes.filter((vacante) => {
    const matchesSearch = search === ""
      ? true
      : vacante.titulo.toLowerCase().includes(search.toLowerCase()) ||
        vacante.departamento.toLowerCase().includes(search.toLowerCase()) ||
        vacante.ubicacion?.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === "todas" || vacante.estatus === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleFormSubmit = (data: InsertVacante) => {
    if (editingVacante) {
      updateVacanteMutation.mutate({ id: editingVacante.id, data });
    } else {
      createVacanteMutation.mutate(data);
    }
  };

  const handleFormClose = (open: boolean) => {
    setIsFormOpen(open);
    if (!open) {
      setEditingVacante(null);
    }
  };

  const handleEditVacante = (vacante: Vacante) => {
    setEditingVacante(vacante);
    setIsFormOpen(true);
  };

  const handleDeleteVacante = (id: string) => {
    if (confirm("¿Estás seguro de que deseas eliminar esta vacante?")) {
      deleteVacanteMutation.mutate(id);
    }
  };

  const handleChangeStatus = (id: string, newStatus: VacanteStatus) => {
    updateVacanteMutation.mutate({ 
      id, 
      data: { estatus: newStatus } 
    });
  };

  const handleViewRequisitos = (vacante: Vacante) => {
    setRequisitosVacante(vacante);
    setIsRequisitosOpen(true);
  };

  const getPuestoNombre = (puestoId: string | null) => {
    if (!puestoId) return "Sin puesto asignado";
    const puesto = puestos.find(p => p.id === puestoId);
    return puesto ? puesto.nombrePuesto : "Puesto no encontrado";
  };

  const getCentroTrabajoNombre = (centroId: string | null) => {
    if (!centroId) return "-";
    const centro = centrosTrabajo.find(c => c.id === centroId);
    return centro ? centro.nombre : "-";
  };

  const getStatusBadge = (status: VacanteStatus) => {
    const variants: Record<VacanteStatus, { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
      abierta: { variant: "default", label: "Abierta" },
      pausada: { variant: "secondary", label: "Pausada" },
      cerrada: { variant: "outline", label: "Cerrada" },
      cancelada: { variant: "destructive", label: "Cancelada" },
    };
    
    const config = variants[status];
    return <Badge variant={config.variant} data-testid={`badge-status-${status}`}>{config.label}</Badge>;
  };

  const getPriorityBadge = (priority: VacantePriority) => {
    const variants: Record<VacantePriority, { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
      baja: { variant: "secondary", label: "Baja" },
      media: { variant: "outline", label: "Media" },
      alta: { variant: "default", label: "Alta" },
      urgente: { variant: "destructive", label: "Urgente" },
    };
    
    const config = variants[priority];
    return <Badge variant={config.variant} data-testid={`badge-priority-${priority}`}>{config.label}</Badge>;
  };

  const formatCurrency = (amount: string | null | undefined) => {
    if (!amount) return "-";
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(parseFloat(amount));
  };

  const formatDate = (date: string | null | undefined) => {
    if (!date) return "-";
    return format(new Date(date), "dd MMM yyyy", { locale: es });
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-heading">
            Vacantes
          </h1>
          <p className="text-muted-foreground">
            Gestiona las requisiciones de personal y vacantes abiertas
          </p>
        </div>
        <Button
          onClick={() => setIsFormOpen(true)}
          data-testid="button-create-vacante"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nueva Vacante
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por título, departamento, ubicación..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
                data-testid="input-search"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as VacanteStatus | "todas")}
            >
              <SelectTrigger className="w-[200px]" data-testid="select-status-filter">
                <SelectValue placeholder="Filtrar por estatus" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                <SelectItem value="abierta">Abiertas</SelectItem>
                <SelectItem value="pausada">Pausadas</SelectItem>
                <SelectItem value="cerrada">Cerradas</SelectItem>
                <SelectItem value="cancelada">Canceladas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Puesto</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead>Centro de Trabajo</TableHead>
                  <TableHead className="text-center"># Vacantes</TableHead>
                  <TableHead>Prioridad</TableHead>
                  <TableHead>Rango Salarial</TableHead>
                  <TableHead>Fecha Límite</TableHead>
                  <TableHead>Estatus</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      Cargando vacantes...
                    </TableCell>
                  </TableRow>
                ) : filteredVacantes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <Briefcase className="h-8 w-8 text-muted-foreground/50" />
                        <p>No se encontraron vacantes</p>
                        {search || statusFilter !== "todas" ? (
                          <Button
                            variant="ghost"
                            onClick={() => {
                              setSearch("");
                              setStatusFilter("todas");
                            }}
                            data-testid="button-clear-filters"
                          >
                            Limpiar filtros
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredVacantes.map((vacante) => (
                    <TableRow key={vacante.id} data-testid={`row-vacante-${vacante.id}`}>
                      <TableCell className="font-medium">
                        {vacante.titulo}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {getPuestoNombre(vacante.puestoId)}
                      </TableCell>
                      <TableCell>{vacante.departamento}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {getCentroTrabajoNombre(vacante.centroTrabajoId)}
                      </TableCell>
                      <TableCell className="text-center">{vacante.numeroVacantes}</TableCell>
                      <TableCell>{getPriorityBadge(vacante.prioridad as VacantePriority)}</TableCell>
                      <TableCell className="text-sm">
                        {vacante.rangoSalarialMin || vacante.rangoSalarialMax ? (
                          <div>
                            {formatCurrency(vacante.rangoSalarialMin)} - {formatCurrency(vacante.rangoSalarialMax)}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">No especificado</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {vacante.fechaLimite ? (
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-3 w-3" />
                            {formatDate(vacante.fechaLimite)}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">Sin límite</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(vacante.estatus as VacanteStatus)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              data-testid={`button-actions-${vacante.id}`}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => handleViewRequisitos(vacante)}
                              data-testid={`button-view-requisitos-${vacante.id}`}
                            >
                              Ver Requisitos
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleEditVacante(vacante)}
                              data-testid={`button-edit-${vacante.id}`}
                            >
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel className="text-xs text-muted-foreground">
                              Cambiar Estatus
                            </DropdownMenuLabel>
                            {vacante.estatus !== "abierta" && (
                              <DropdownMenuItem
                                onClick={() => handleChangeStatus(vacante.id, "abierta")}
                                data-testid={`button-status-abierta-${vacante.id}`}
                              >
                                Marcar como Abierta
                              </DropdownMenuItem>
                            )}
                            {vacante.estatus !== "pausada" && (
                              <DropdownMenuItem
                                onClick={() => handleChangeStatus(vacante.id, "pausada")}
                                data-testid={`button-status-pausada-${vacante.id}`}
                              >
                                Pausar
                              </DropdownMenuItem>
                            )}
                            {vacante.estatus !== "cerrada" && (
                              <DropdownMenuItem
                                onClick={() => handleChangeStatus(vacante.id, "cerrada")}
                                data-testid={`button-status-cerrada-${vacante.id}`}
                              >
                                Cerrar
                              </DropdownMenuItem>
                            )}
                            {vacante.estatus !== "cancelada" && (
                              <DropdownMenuItem
                                onClick={() => handleChangeStatus(vacante.id, "cancelada")}
                                data-testid={`button-status-cancelada-${vacante.id}`}
                              >
                                Cancelar
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeleteVacante(vacante.id)}
                              className="text-destructive"
                              data-testid={`button-delete-${vacante.id}`}
                            >
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
          </div>
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={handleFormClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle data-testid="text-form-title">
              {editingVacante ? "Editar Vacante" : "Nueva Vacante"}
            </DialogTitle>
            <DialogDescription>
              {editingVacante 
                ? "Modifica la información de la vacante"
                : "Completa la información para crear una nueva requisición de personal"}
            </DialogDescription>
          </DialogHeader>
          <VacanteForm
            vacante={editingVacante}
            puestos={puestos}
            onSubmit={handleFormSubmit}
            onCancel={() => handleFormClose(false)}
            isSubmitting={createVacanteMutation.isPending || updateVacanteMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      <VacanteRequisitosDialog
        vacante={requisitosVacante}
        open={isRequisitosOpen}
        onOpenChange={setIsRequisitosOpen}
      />
    </div>
  );
}
