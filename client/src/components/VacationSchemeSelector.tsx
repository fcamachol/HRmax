import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CalendarDays, X, ChevronDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EsquemaPresta {
  id: string;
  nombre: string;
  descripcion: string | null;
  esLey: boolean;
  activo: boolean;
}

interface VacationSchemeSelectorProps {
  entityType: "cliente" | "empresa";
  entityId: string;
  currentSchemeId: string | null | undefined;
  entityName?: string;
  onSuccess?: () => void;
}

export function VacationSchemeSelector({
  entityType,
  entityId,
  currentSchemeId,
  entityName,
  onSuccess,
}: VacationSchemeSelectorProps) {
  const { toast } = useToast();

  const { data: esquemas, isLoading: loadingEsquemas } = useQuery<EsquemaPresta[]>({
    queryKey: ["/api/esquemas-prestaciones"],
  });

  const { data: currentScheme, isLoading: loadingCurrent } = useQuery<EsquemaPresta>({
    queryKey: [`/api/esquemas-prestaciones/${currentSchemeId}`],
    enabled: !!currentSchemeId,
  });

  const assignMutation = useMutation({
    mutationFn: async (esquemaPrestacionesId: string | null) => {
      const endpoint = entityType === "cliente"
        ? `/api/clientes/${entityId}/esquema-prestaciones`
        : `/api/empresas/${entityId}/esquema-prestaciones`;
      return await apiRequest("PATCH", endpoint, { esquemaPrestacionesId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/${entityType}s`] });
      queryClient.invalidateQueries({ queryKey: [`/api/${entityType}s/${entityId}`] });
      toast({
        title: "Esquema actualizado",
        description: `El esquema de vacaciones ha sido ${currentSchemeId ? "actualizado" : "asignado"} correctamente.`,
      });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el esquema",
        variant: "destructive",
      });
    },
  });

  const removeMutation = useMutation({
    mutationFn: async () => {
      const endpoint = entityType === "cliente"
        ? `/api/clientes/${entityId}/esquema-prestaciones`
        : `/api/empresas/${entityId}/esquema-prestaciones`;
      return await apiRequest("PATCH", endpoint, { esquemaPrestacionesId: null });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/${entityType}s`] });
      queryClient.invalidateQueries({ queryKey: [`/api/${entityType}s/${entityId}`] });
      toast({
        title: "Esquema removido",
        description: "El esquema de vacaciones ha sido removido. Se usará el nivel superior o LFT por defecto.",
      });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo remover el esquema",
        variant: "destructive",
      });
    },
  });

  const handleSelectChange = (value: string) => {
    if (value === "__none__") {
      return; // Do nothing for placeholder
    }
    assignMutation.mutate(value);
  };

  const handleRemove = () => {
    if (confirm("¿Estás seguro de remover el esquema asignado? Los empleados usarán el esquema del nivel superior o LFT por defecto.")) {
      removeMutation.mutate();
    }
  };

  const activeEsquemas = esquemas?.filter(e => e.activo && !e.esLey) || [];
  const isLoading = loadingEsquemas || loadingCurrent;
  const isMutating = assignMutation.isPending || removeMutation.isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <CalendarDays className="h-5 w-5" />
          Esquema de Vacaciones
        </CardTitle>
        <CardDescription>
          {entityType === "cliente"
            ? "Asigna un esquema de vacaciones que aplique a todas las empresas y empleados de este cliente."
            : "Asigna un esquema de vacaciones que aplique a todos los empleados de esta empresa. Sobreescribe el esquema del cliente si está definido."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Current scheme display */}
            {currentSchemeId && currentScheme ? (
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge variant="secondary">Asignado</Badge>
                  <div>
                    <p className="font-medium">{currentScheme.nombre}</p>
                    {currentScheme.descripcion && (
                      <p className="text-sm text-muted-foreground">{currentScheme.descripcion}</p>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemove}
                  disabled={isMutating}
                >
                  {removeMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                </Button>
              </div>
            ) : (
              <div className="p-3 bg-muted/50 rounded-lg border border-dashed">
                <p className="text-sm text-muted-foreground">
                  Sin esquema asignado. {entityType === "empresa"
                    ? "Se usará el esquema del cliente o LFT por defecto."
                    : "Se usará LFT (Ley Federal del Trabajo) por defecto."}
                </p>
              </div>
            )}

            {/* Selector */}
            <div className="flex gap-2">
              <Select
                value={currentSchemeId || "__none__"}
                onValueChange={handleSelectChange}
                disabled={isMutating}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Seleccionar esquema..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__" disabled>
                    Seleccionar esquema...
                  </SelectItem>
                  {activeEsquemas.map((esquema) => (
                    <SelectItem key={esquema.id} value={esquema.id}>
                      <div className="flex flex-col">
                        <span>{esquema.nombre}</span>
                        {esquema.descripcion && (
                          <span className="text-xs text-muted-foreground">{esquema.descripcion}</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Help text */}
            <p className="text-xs text-muted-foreground">
              Los esquemas de vacaciones se gestionan en Configuracion → Prestaciones → Catalogo de Esquemas.
              La prioridad de asignacion es: Empleado → Puesto → Empresa → Cliente → LFT.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
