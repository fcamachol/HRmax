import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useToast } from "@/hooks/use-toast";
import { Loader2, Briefcase } from "lucide-react";

interface Puesto {
  id: string;
  nombrePuesto: string;
  clavePuesto: string;
  esquemaPrestacionesId: string | null;
  estatus: string;
}

interface EsquemaPrestaciones {
  id: string;
  nombreEsquema: string;
}

export function PrestacionesPorPuestoManager() {
  const { toast } = useToast();
  const [selectedPuesto, setSelectedPuesto] = useState<string | null>(null);
  const [selectedEsquema, setSelectedEsquema] = useState<string | null>(null);

  // Obtener todos los puestos
  const { data: puestos, isLoading: loadingPuestos } = useQuery<Puesto[]>({
    queryKey: ["/api/puestos"],
  });

  // Obtener todos los esquemas de prestaciones disponibles
  const { data: esquemas, isLoading: loadingEsquemas, isError: errorEsquemas } = useQuery<EsquemaPrestaciones[]>({
    queryKey: ["/api/cat-tablas-prestaciones"],
  });

  // Mutación para asignar esquema a puesto
  const assignMutation = useMutation({
    mutationFn: async ({ puestoId, esquemaId }: { puestoId: string; esquemaId: string | null }) => {
      return await apiRequest("PATCH", `/api/puestos/${puestoId}/prestaciones`, {
        esquemaPrestacionesId: esquemaId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/puestos"] });
      toast({
        title: "Prestaciones actualizadas",
        description: "El esquema de prestaciones ha sido asignado correctamente al puesto.",
      });
      setSelectedPuesto(null);
      setSelectedEsquema(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo asignar el esquema de prestaciones",
        variant: "destructive",
      });
    },
  });

  const handleAssign = (puestoId: string, esquemaId: string | null) => {
    // Validación final: no guardar si los esquemas no han cargado
    if (loadingEsquemas || !esquemas || errorEsquemas) {
      return;
    }
    // Validar que esquemaId sea explícitamente null o string no vacío
    if (esquemaId !== null && (typeof esquemaId !== 'string' || esquemaId.trim() === '')) {
      return;
    }
    assignMutation.mutate({ puestoId, esquemaId });
  };

  // Obtener nombre del esquema por ID
  const getEsquemaNombre = (esquemaId: string | null) => {
    if (!esquemaId) return "LFT 2024 (Estándar)";
    const esquema = esquemas?.find((e) => e.id === esquemaId);
    return esquema?.nombreEsquema || "Desconocido";
  };

  if (loadingPuestos || loadingEsquemas) {
    return (
      <div className="flex items-center justify-center py-8" data-testid="loading-prestaciones-puestos">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card data-testid="card-prestaciones-puestos">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="h-5 w-5" />
          Prestaciones por Puesto
        </CardTitle>
        <CardDescription>
          Configura qué esquema de prestaciones aplica a cada puesto. Los empleados heredarán
          automáticamente las prestaciones de su puesto (a menos que tengan un override individual).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Clave</TableHead>
              <TableHead>Puesto</TableHead>
              <TableHead>Esquema Actual</TableHead>
              <TableHead>Asignar Esquema</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {puestos && puestos.length > 0 ? (
              puestos.map((puesto) => (
                <TableRow key={puesto.id} data-testid={`row-puesto-${puesto.id}`}>
                  <TableCell className="font-mono text-sm" data-testid={`text-clave-${puesto.id}`}>
                    {puesto.clavePuesto}
                  </TableCell>
                  <TableCell data-testid={`text-nombre-${puesto.id}`}>
                    {puesto.nombrePuesto}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" data-testid={`badge-esquema-${puesto.id}`}>
                      {getEsquemaNombre(puesto.esquemaPrestacionesId)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={selectedPuesto === puesto.id ? (selectedEsquema || "") : ""}
                      onValueChange={(value) => {
                        setSelectedPuesto(puesto.id);
                        setSelectedEsquema(value === "null" ? null : value);
                      }}
                      disabled={loadingEsquemas || !esquemas || errorEsquemas}
                      data-testid={`select-esquema-${puesto.id}`}
                    >
                      <SelectTrigger className="w-[250px]">
                        <SelectValue placeholder="Seleccionar esquema..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="null">LFT 2024 (Estándar)</SelectItem>
                        {esquemas?.map((esquema) => (
                          <SelectItem key={esquema.id} value={esquema.id}>
                            {esquema.nombreEsquema}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      onClick={() => handleAssign(puesto.id, selectedEsquema)}
                      disabled={
                        selectedPuesto !== puesto.id || 
                        assignMutation.isPending ||
                        loadingEsquemas ||
                        !esquemas ||
                        errorEsquemas ||
                        (selectedEsquema !== null && selectedEsquema.trim() === '')
                      }
                      data-testid={`button-asignar-${puesto.id}`}
                    >
                      {assignMutation.isPending && selectedPuesto === puesto.id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Asignando...
                        </>
                      ) : (
                        "Asignar"
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No hay puestos registrados
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
