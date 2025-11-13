import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { PeriodoNomina, GrupoNomina } from "@shared/schema";
import { Plus, Calendar, Users, DollarSign } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Periodos() {
  const [location, setLocation] = useState();
  const { toast } = useToast();
  const [selectedGrupoId, setSelectedGrupoId] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());

  const { data: gruposNomina = [], isLoading: isLoadingGrupos } = useQuery<GrupoNomina[]>({
    queryKey: ["/api/grupos-nomina"],
  });

  const { data: periodos = [], isLoading: isLoadingPeriodos } = useQuery<PeriodoNomina[]>({
    queryKey: ["/api/periodos-nomina", selectedGrupoId],
    enabled: !!selectedGrupoId,
  });

  const generatePeriodsMutation = useMutation({
    mutationFn: async (data: { grupoNominaId: string; year: number }) => {
      return await apiRequest(
        `/api/payroll-periods/generate/${data.grupoNominaId}/${data.year}`,
        "POST",
        {}
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/periodos-nomina"] });
      toast({
        title: "Períodos generados",
        description: "Los períodos de nómina se generaron correctamente",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudieron generar los períodos",
      });
    },
  });

  const handleGeneratePeriods = () => {
    if (!selectedGrupoId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Selecciona un grupo de nómina",
      });
      return;
    }

    generatePeriodsMutation.mutate({
      grupoNominaId: selectedGrupoId,
      year: parseInt(selectedYear),
    });
  };

  const getStatusColor = (estatus: string) => {
    switch (estatus) {
      case "abierto":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "calculado":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "autorizado":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "dispersado":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "timbrado":
        return "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200";
      case "cerrado":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getStatusLabel = (estatus: string) => {
    switch (estatus) {
      case "abierto":
        return "Abierto";
      case "calculado":
        return "Calculado";
      case "autorizado":
        return "Autorizado";
      case "dispersado":
        return "Dispersado";
      case "timbrado":
        return "Timbrado";
      case "cerrado":
        return "Cerrado";
      default:
        return estatus;
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Períodos de Nómina</h1>
          <p className="text-muted-foreground">
            Administra los períodos de pago para cada grupo de nómina
          </p>
        </div>
        <Button onClick={handleGeneratePeriods} disabled={!selectedGrupoId || generatePeriodsMutation.isPending} data-testid="button-generate-periods">
          <Plus className="mr-2 h-4 w-4" />
          {generatePeriodsMutation.isPending ? "Generando..." : "Generar Períodos"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Períodos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{periodos.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {periodos.filter((p) => p.estatus === "abierto").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Cerrados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {periodos.filter((p) => p.estatus === "cerrado").length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Grupo de Nómina</label>
            <Select value={selectedGrupoId} onValueChange={setSelectedGrupoId}>
              <SelectTrigger data-testid="select-grupo-nomina">
                <SelectValue placeholder="Selecciona un grupo" />
              </SelectTrigger>
              <SelectContent>
                {gruposNomina.map((grupo) => (
                  <SelectItem key={grupo.id} value={grupo.id}>
                    {grupo.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-40">
            <label className="text-sm font-medium mb-2 block">Año</label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger data-testid="select-year">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[2023, 2024, 2025, 2026].map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {isLoadingPeriodos ? (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">Cargando períodos...</p>
          </CardContent>
        </Card>
      ) : periodos.length === 0 && selectedGrupoId ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                No hay períodos generados para este grupo
              </p>
              <p className="text-sm text-muted-foreground">
                Haz clic en "Generar Períodos" para crear los períodos del año seleccionado
              </p>
            </div>
          </CardContent>
        </Card>
      ) : periodos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {periodos.map((periodo) => (
            <Card key={periodo.id} className="hover-elevate" data-testid={`card-periodo-${periodo.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    Período #{periodo.numeroPeriodo}
                  </CardTitle>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(periodo.estatus)}`}
                  >
                    {getStatusLabel(periodo.estatus)}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {new Date(periodo.fechaInicio).toLocaleDateString("es-MX")} -{" "}
                      {new Date(periodo.fechaFin).toLocaleDateString("es-MX")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground capitalize">
                      {periodo.tipoPeriodo}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Año {periodo.anio}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <p className="text-muted-foreground">
                Selecciona un grupo de nómina para ver los períodos
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
