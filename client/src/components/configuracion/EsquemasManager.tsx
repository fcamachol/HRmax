import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Edit, Trash2, Gift, Search } from "lucide-react";
import { EsquemaForm } from "@/components/configuracion/EsquemaForm";

interface EsquemaPrestaciones {
  id: string;
  nombreEsquema: string;
  aniosAntiguedad: number;
  diasVacaciones: number;
  diasAguinaldo: number;
  primaVacacionalPct: string;
  factorIntegracion: string | null;
  activo: boolean;
}

export function EsquemasManager() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEsquema, setSelectedEsquema] = useState<EsquemaPrestaciones | undefined>();

  // Obtener todos los esquemas
  const { data: esquemas, isLoading } = useQuery<EsquemaPrestaciones[]>({
    queryKey: ["/api/cat-tablas-prestaciones"],
  });

  // Mutación para eliminar
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/cat-tablas-prestaciones/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cat-tablas-prestaciones"] });
      toast({
        title: "Esquema eliminado",
        description: "El esquema de prestaciones ha sido eliminado correctamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el esquema",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (esquema: EsquemaPrestaciones) => {
    setSelectedEsquema(esquema);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("¿Estás seguro de eliminar este esquema de prestaciones? Esto puede afectar a puestos y empleados que lo usen.")) {
      deleteMutation.mutate(id);
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedEsquema(undefined);
  };

  // Filtrado
  const filteredEsquemas = esquemas?.filter((esquema) => {
    const matchesSearch = esquema.nombreEsquema?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  }) || [];

  // Agrupar por nombre de esquema
  const groupedEsquemas = filteredEsquemas.reduce((acc, esquema) => {
    if (!acc[esquema.nombreEsquema]) {
      acc[esquema.nombreEsquema] = [];
    }
    acc[esquema.nombreEsquema].push(esquema);
    return acc;
  }, {} as Record<string, EsquemaPrestaciones[]>);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8" data-testid="loading-esquemas">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card data-testid="card-esquemas">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5" />
              Catálogo de Esquemas de Prestaciones
            </CardTitle>
            <CardDescription>
              Configura los diferentes esquemas de prestaciones que aplican en tu organización.
              Cada esquema define vacaciones, aguinaldo y prima vacacional por años de antigüedad.
            </CardDescription>
          </div>
          <Button onClick={() => setDialogOpen(true)} data-testid="button-nuevo-esquema">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Esquema
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Búsqueda */}
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre de esquema..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
            data-testid="input-search-esquemas"
          />
        </div>

        {/* Tabla agrupada por esquema */}
        <div className="space-y-6">
          {Object.entries(groupedEsquemas).map(([nombreEsquema, rows]) => (
            <div key={nombreEsquema} className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{nombreEsquema}</h3>
                <Badge variant="outline">{rows.length} año(s) configurado(s)</Badge>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Años Antigüedad</TableHead>
                    <TableHead>Días Vacaciones</TableHead>
                    <TableHead>Días Aguinaldo</TableHead>
                    <TableHead>Prima Vacacional</TableHead>
                    <TableHead>Factor Integración</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((esquema) => (
                    <TableRow key={esquema.id} data-testid={`row-esquema-${esquema.id}`}>
                      <TableCell className="font-medium" data-testid={`text-anios-${esquema.id}`}>
                        Año {esquema.aniosAntiguedad}
                      </TableCell>
                      <TableCell data-testid={`text-vacaciones-${esquema.id}`}>
                        {esquema.diasVacaciones} días
                      </TableCell>
                      <TableCell data-testid={`text-aguinaldo-${esquema.id}`}>
                        {esquema.diasAguinaldo} días
                      </TableCell>
                      <TableCell data-testid={`text-prima-${esquema.id}`}>
                        {esquema.primaVacacionalPct}%
                      </TableCell>
                      <TableCell data-testid={`text-factor-${esquema.id}`}>
                        {esquema.factorIntegracion || "N/A"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={esquema.activo ? "default" : "secondary"} data-testid={`badge-estado-${esquema.id}`}>
                          {esquema.activo ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(esquema)}
                            data-testid={`button-edit-${esquema.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(esquema.id)}
                            disabled={deleteMutation.isPending}
                            data-testid={`button-delete-${esquema.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ))}
          {Object.keys(groupedEsquemas).length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No hay esquemas de prestaciones registrados.
            </div>
          )}
        </div>
      </CardContent>

      {/* Dialog de formulario */}
      <EsquemaForm
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        defaultValues={selectedEsquema}
      />
    </Card>
  );
}
