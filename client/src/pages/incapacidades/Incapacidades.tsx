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
import { Plus, Search, MoreVertical, FileText, Heart, Baby } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { type Incapacidad, type InsertIncapacidad } from "@shared/schema";
import { IncapacidadForm } from "@/components/incapacidades/IncapacidadForm";

const tipoLabels = {
  enfermedad_general: "Enfermedad General",
  riesgo_trabajo: "Riesgo de Trabajo",
  maternidad: "Maternidad"
};

const tipoIcons = {
  enfermedad_general: Heart,
  riesgo_trabajo: FileText,
  maternidad: Baby
};

type TipoIncapacidad = "enfermedad_general" | "riesgo_trabajo" | "maternidad";

export default function Incapacidades() {
  const [search, setSearch] = useState("");
  const [tipoFilter, setTipoFilter] = useState<TipoIncapacidad | "todos">("todos");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingIncapacidad, setEditingIncapacidad] = useState<Incapacidad | null>(null);
  const { toast } = useToast();

  const { data: incapacidades = [], isLoading } = useQuery<Incapacidad[]>({
    queryKey: ["/api/incapacidades"],
  });

  const createIncapacidadMutation = useMutation({
    mutationFn: async (data: InsertIncapacidad) => {
      const response = await apiRequest("POST", "/api/incapacidades", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/incapacidades"] });
      setIsFormOpen(false);
      setEditingIncapacidad(null);
      toast({
        title: "Incapacidad registrada",
        description: "La incapacidad ha sido registrada exitosamente",
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

  const updateIncapacidadMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertIncapacidad> }) => {
      const response = await apiRequest("PATCH", `/api/incapacidades/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/incapacidades"] });
      setIsFormOpen(false);
      setEditingIncapacidad(null);
      toast({
        title: "Incapacidad actualizada",
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

  const deleteIncapacidadMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/incapacidades/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/incapacidades"] });
      toast({
        title: "Incapacidad eliminada",
        description: "La incapacidad ha sido eliminada exitosamente",
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

  const filteredIncapacidades = incapacidades.filter((incapacidad) => {
    const searchLower = search.toLowerCase();
    const matchesSearch =
      !search ||
      incapacidad.empleadoId.toLowerCase().includes(searchLower) ||
      incapacidad.numeroCertificado?.toLowerCase().includes(searchLower);

    const matchesTipo = tipoFilter === "todos" || incapacidad.tipo === tipoFilter;

    return matchesSearch && matchesTipo;
  });

  const handleFormSubmit = (data: InsertIncapacidad) => {
    if (editingIncapacidad) {
      updateIncapacidadMutation.mutate({ id: editingIncapacidad.id, data });
    } else {
      createIncapacidadMutation.mutate(data);
    }
  };

  const handleFormClose = (open: boolean) => {
    setIsFormOpen(open);
    if (!open) {
      setEditingIncapacidad(null);
    }
  };

  const handleEditIncapacidad = (incapacidad: Incapacidad) => {
    setEditingIncapacidad(incapacidad);
    setIsFormOpen(true);
  };

  const handleDeleteIncapacidad = (id: string) => {
    if (confirm("¿Estás seguro de que deseas eliminar este registro de incapacidad?")) {
      deleteIncapacidadMutation.mutate(id);
    }
  };

  return (
    <div className="px-6 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-semibold" data-testid="text-page-title">Incapacidades</h1>
            <p className="text-sm mt-1">Gestión de incapacidades IMSS</p>
          </div>
          <Button
            onClick={() => setIsFormOpen(true)}
            data-testid="button-nueva-incapacidad"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nueva Incapacidad
          </Button>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="flex gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" />
                <Input
                  placeholder="Buscar por ID de empleado o número de certificado..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                  data-testid="input-search"
                />
              </div>
              <Select value={tipoFilter} onValueChange={(value) => setTipoFilter(value as TipoIncapacidad | "todos")}>
                <SelectTrigger className="w-[220px]" data-testid="select-tipo-filter">
                  <SelectValue placeholder="Filtrar por tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los tipos</SelectItem>
                  <SelectItem value="enfermedad_general">Enfermedad General</SelectItem>
                  <SelectItem value="riesgo_trabajo">Riesgo de Trabajo</SelectItem>
                  <SelectItem value="maternidad">Maternidad</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-sm">Cargando incapacidades...</p>
              </div>
            ) : filteredIncapacidades.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No hay incapacidades</h3>
                <p className="text-sm mb-6">
                  {search || tipoFilter !== "todos"
                    ? "No se encontraron incapacidades con los filtros aplicados"
                    : "Comienza registrando una nueva incapacidad"}
                </p>
                {!search && tipoFilter === "todos" && (
                  <Button onClick={() => setIsFormOpen(true)} data-testid="button-crear-primera-incapacidad">
                    <Plus className="h-4 w-4 mr-2" />
                    Registrar Primera Incapacidad
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empleado ID</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Fecha Inicio</TableHead>
                    <TableHead>Fecha Fin</TableHead>
                    <TableHead>Días</TableHead>
                    <TableHead>Certificado</TableHead>
                    <TableHead>% Pago</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredIncapacidades.map((incapacidad) => {
                    const tipo = incapacidad.tipo as TipoIncapacidad;
                    const TipoIcon = tipoIcons[tipo];
                    
                    return (
                      <TableRow key={incapacidad.id} data-testid={`row-incapacidad-${incapacidad.id}`}>
                        <TableCell className="font-medium" data-testid={`text-empleado-${incapacidad.id}`}>
                          {incapacidad.empleadoId}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" data-testid={`badge-tipo-${incapacidad.id}`}>
                            <TipoIcon className="h-3 w-3 mr-1" />
                            {tipoLabels[tipo]}
                          </Badge>
                        </TableCell>
                        <TableCell data-testid={`text-fecha-inicio-${incapacidad.id}`}>
                          {format(new Date(incapacidad.fechaInicio), "dd/MM/yyyy", { locale: es })}
                        </TableCell>
                        <TableCell data-testid={`text-fecha-fin-${incapacidad.id}`}>
                          {format(new Date(incapacidad.fechaFin), "dd/MM/yyyy", { locale: es })}
                        </TableCell>
                        <TableCell data-testid={`text-dias-${incapacidad.id}`}>
                          {incapacidad.diasIncapacidad}
                        </TableCell>
                        <TableCell className="max-w-xs truncate" data-testid={`text-certificado-${incapacidad.id}`}>
                          {incapacidad.numeroCertificado || "-"}
                        </TableCell>
                        <TableCell data-testid={`text-porcentaje-${incapacidad.id}`}>
                          {incapacidad.porcentajePago ? `${incapacidad.porcentajePago}%` : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" data-testid={`button-actions-${incapacidad.id}`}>
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleEditIncapacidad(incapacidad)}
                                data-testid={`button-editar-${incapacidad.id}`}
                              >
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteIncapacidad(incapacidad.id)}
                                className="text-destructive"
                                data-testid={`button-eliminar-${incapacidad.id}`}
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

      <IncapacidadForm
        open={isFormOpen}
        onOpenChange={handleFormClose}
        onSubmit={handleFormSubmit}
        initialData={editingIncapacidad}
        isPending={createIncapacidadMutation.isPending || updateIncapacidadMutation.isPending}
      />
    </div>
  );
}
