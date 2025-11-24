import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Search, MoreVertical, Minus } from "lucide-react";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import type { Puesto, InsertPuesto } from "@shared/schema";
import { PuestoQuickView } from "@/components/PuestoQuickView";
import { PuestoDetailView } from "@/components/PuestoDetailView";
import { PuestoForm } from "@/components/PuestoForm";
import { AsignarEmpleadosPuesto } from "@/components/AsignarEmpleadosPuesto";
import { QuitarEmpleadosPuesto } from "@/components/QuitarEmpleadosPuesto";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function Puestos() {
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "quick" | "detail">("list");
  const [selectedPuestoId, setSelectedPuestoId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPuesto, setEditingPuesto] = useState<Puesto | null>(null);
  const [assigningPuesto, setAssigningPuesto] = useState<{ id: string; nombre: string } | null>(null);
  const [removingPuesto, setRemovingPuesto] = useState<{ id: string; nombre: string } | null>(null);
  const { toast } = useToast();

  const { data: puestos = [], isLoading } = useQuery<Puesto[]>({
    queryKey: ["/api/puestos"],
  });

  const { data: employeeCounts = {} } = useQuery<Record<string, number>>({
    queryKey: ["/api/puestos/employees/counts"],
  });

  const createPuestoMutation = useMutation({
    mutationFn: async (data: InsertPuesto) => {
      const response = await apiRequest("POST", "/api/puestos", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/puestos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/puestos/employees/counts"] });
      setIsFormOpen(false);
      setEditingPuesto(null);
      toast({
        title: "Puesto creado",
        description: "El puesto ha sido creado exitosamente",
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

  const updatePuestoMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: InsertPuesto }) => {
      const response = await apiRequest("PATCH", `/api/puestos/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/puestos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/puestos/employees/counts"] });
      setIsFormOpen(false);
      setEditingPuesto(null);
      toast({
        title: "Puesto actualizado",
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

  const filteredPuestos = puestos.filter((puesto) =>
    search === ""
      ? true
      : puesto.nombrePuesto.toLowerCase().includes(search.toLowerCase()) ||
        puesto.clavePuesto.toLowerCase().includes(search.toLowerCase()) ||
        puesto.area?.toLowerCase().includes(search.toLowerCase())
  );

  const selectedPuesto = puestos.find((p) => p.id === selectedPuestoId);

  const handleViewPuesto = (id: string) => {
    setSelectedPuestoId(id);
    setViewMode("quick");
  };

  const handleEditPuesto = (puesto: Puesto) => {
    setEditingPuesto(puesto);
    setIsFormOpen(true);
  };

  const getPuestoFormValues = (puesto: Puesto | null): Partial<InsertPuesto> | undefined => {
    if (!puesto) return undefined;
    
    return {
      nombrePuesto: puesto.nombrePuesto,
      clavePuesto: puesto.clavePuesto,
      departamentoId: puesto.departamentoId,
      area: puesto.area,
      centrosTrabajoIds: puesto.centrosTrabajoIds as string[],
      nivelJerarquico: puesto.nivelJerarquico,
      tipoPuesto: puesto.tipoPuesto,
      reportaA: puesto.reportaA,
      puestosQueReportan: puesto.puestosQueReportan as string[],
      propositoGeneral: puesto.propositoGeneral,
      funcionesPrincipales: puesto.funcionesPrincipales as string[],
      funcionesSecundarias: puesto.funcionesSecundarias as string[],
      autoridadYDecisiones: puesto.autoridadYDecisiones,
      relaciones: puesto.relaciones as any,
      formacionAcademica: puesto.formacionAcademica as any,
      experienciaLaboral: puesto.experienciaLaboral as any,
      conocimientosTecnicos: puesto.conocimientosTecnicos as any,
      competenciasConductuales: puesto.competenciasConductuales as string[],
      idiomas: puesto.idiomas as any,
      certificaciones: puesto.certificaciones as string[],
      condicionesLaborales: {
        ...(puesto.condicionesLaborales as any),
        tipoHorario: (puesto.condicionesLaborales as any)?.tipoHorario,
        horaEntrada: (puesto.condicionesLaborales as any)?.horaEntrada,
        horaSalida: (puesto.condicionesLaborales as any)?.horaSalida,
        descripcionHorario: (puesto.condicionesLaborales as any)?.descripcionHorario,
        horasSemanales: (puesto.condicionesLaborales as any)?.horasSemanales,
      },
      compensacionYPrestaciones: {
        ...(puesto.compensacionYPrestaciones as any),
        prestacionesAdicionales: (puesto.compensacionYPrestaciones as any)?.prestacionesAdicionales || [],
      },
      indicadoresDesempeno: puesto.indicadoresDesempeno as any,
      cumplimientoLegal: puesto.cumplimientoLegal as any,
      estatus: (puesto.estatus as "activo" | "inactivo") ?? "activo",
    };
  };

  const handleFormSubmit = (data: InsertPuesto) => {
    if (editingPuesto) {
      updatePuestoMutation.mutate({ id: editingPuesto.id, data });
    } else {
      createPuestoMutation.mutate(data);
    }
  };

  const handleFormClose = (open: boolean) => {
    setIsFormOpen(open);
    if (!open) {
      setEditingPuesto(null);
    }
  };

  const handleViewDetails = () => {
    setViewMode("detail");
  };

  const handleBackToQuickView = () => {
    setViewMode("quick");
  };

  const handleCloseViews = () => {
    setViewMode("list");
    setSelectedPuestoId(null);
  };

  const getEmployeeCount = (puestoId: string) => {
    return employeeCounts[puestoId] ?? 0;
  };

  const formatCurrency = (amount: number | undefined) => {
    if (!amount) return "No especificado";
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  if (viewMode === "quick" && selectedPuesto) {
    return (
      <PuestoQuickView
        puesto={selectedPuesto}
        employeeCount={getEmployeeCount(selectedPuesto.id)}
        onViewDetails={handleViewDetails}
        onClose={handleCloseViews}
      />
    );
  }

  if (viewMode === "detail" && selectedPuesto) {
    return (
      <PuestoDetailView
        puesto={selectedPuesto}
        onBackToQuickView={handleBackToQuickView}
        onClose={handleCloseViews}
      />
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold" data-testid="text-page-heading">
          Puestos
        </h1>
        <p className="text-muted-foreground" data-testid="text-page-description">
          Gestiona las descripciones de puesto de la organización
        </p>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, clave, área o departamento..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
              data-testid="input-search"
            />
          </div>
        </div>
        <Button onClick={() => setIsFormOpen(true)} data-testid="button-create-puesto">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Puesto
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Cargando puestos...</p>
        </div>
      ) : filteredPuestos.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <p className="text-muted-foreground">
            {search
              ? "No se encontraron puestos con ese criterio"
              : "No hay puestos registrados"}
          </p>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Clave</TableHead>
                <TableHead>Nombre del Puesto</TableHead>
                <TableHead>Área / Departamento</TableHead>
                <TableHead>Nivel Jerárquico</TableHead>
                <TableHead># Empleados</TableHead>
                <TableHead>Rango Salarial</TableHead>
                <TableHead>Estatus</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPuestos.map((puesto) => {
                const compensacion = puesto.compensacionYPrestaciones as any;
                return (
                  <TableRow key={puesto.id} data-testid={`row-puesto-${puesto.id}`}>
                    <TableCell className="font-medium">
                      {puesto.clavePuesto}
                    </TableCell>
                    <TableCell>{puesto.nombrePuesto}</TableCell>
                    <TableCell>
                      {puesto.area || "No especificado"}
                    </TableCell>
                    <TableCell>
                      {puesto.nivelJerarquico || "No especificado"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => setRemovingPuesto({ id: puesto.id, nombre: puesto.nombrePuesto })}
                          disabled={getEmployeeCount(puesto.id) === 0}
                          data-testid={`button-remove-employees-${puesto.id}`}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <Badge variant="secondary">{getEmployeeCount(puesto.id)}</Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => setAssigningPuesto({ id: puesto.id, nombre: puesto.nombrePuesto })}
                          data-testid={`button-assign-employees-${puesto.id}`}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      {compensacion?.rangoSalarialMin && compensacion?.rangoSalarialMax
                        ? `${formatCurrency(compensacion.rangoSalarialMin)} - ${formatCurrency(compensacion.rangoSalarialMax)}`
                        : "No especificado"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          puesto.estatus === "activo" ? "default" : "secondary"
                        }
                      >
                        {puesto.estatus === "activo" ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            data-testid={`button-actions-${puesto.id}`}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => handleViewPuesto(puesto.id)}
                            data-testid={`button-view-${puesto.id}`}
                          >
                            Ver detalles
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleEditPuesto(puesto)}
                            data-testid={`button-edit-${puesto.id}`}
                          >
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            data-testid={`button-delete-${puesto.id}`}
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
        </div>
      )}

      <PuestoForm
        open={isFormOpen}
        onOpenChange={handleFormClose}
        onSubmit={handleFormSubmit}
        mode={editingPuesto ? "edit" : "create"}
        defaultValues={getPuestoFormValues(editingPuesto)}
      />

      <AsignarEmpleadosPuesto
        open={!!assigningPuesto}
        onOpenChange={(open) => !open && setAssigningPuesto(null)}
        puestoId={assigningPuesto?.id || ""}
        puestoNombre={assigningPuesto?.nombre || ""}
      />

      <QuitarEmpleadosPuesto
        open={!!removingPuesto}
        onOpenChange={(open) => !open && setRemovingPuesto(null)}
        puestoId={removingPuesto?.id || ""}
        puestoNombre={removingPuesto?.nombre || ""}
      />
    </div>
  );
}
