import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertCircle, Gift } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Employee {
  id: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno?: string;
  puestoId: string | null;
  esquemaPrestacionesId: string | null;
}

interface Puesto {
  id: string;
  nombrePuesto: string;
  esquemaPrestacionesId: string | null;
}

interface EsquemaPrestaciones {
  id: string;
  nombreEsquema: string;
}

interface PrestacionesEmpleadoOverrideProps {
  employee: Employee;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PrestacionesEmpleadoOverride({
  employee,
  open,
  onOpenChange,
}: PrestacionesEmpleadoOverrideProps) {
  const { toast } = useToast();
  const [selectedEsquema, setSelectedEsquema] = useState<string | null>(
    employee.esquemaPrestacionesId
  );

  // Sincronizar el estado local con el empleado actual cada vez que cambie o se abra el diálogo
  useEffect(() => {
    if (open) {
      setSelectedEsquema(employee.esquemaPrestacionesId);
    }
  }, [employee.id, employee.esquemaPrestacionesId, open]);

  // Obtener el puesto del empleado para mostrar el esquema por defecto
  const { data: puesto } = useQuery<Puesto>({
    queryKey: ["/api/puestos", employee.puestoId],
    enabled: !!employee.puestoId,
  });

  // Obtener todos los esquemas disponibles
  const { data: esquemas, isLoading: loadingEsquemas, isError: errorEsquemas } = useQuery<EsquemaPrestaciones[]>({
    queryKey: ["/api/cat-tablas-prestaciones"],
  });

  // Mutación para guardar el override
  const saveMutation = useMutation({
    mutationFn: async (esquemaId: string | null) => {
      return await apiRequest("PATCH", `/api/employees/${employee.id}/prestaciones`, {
        esquemaPrestacionesId: esquemaId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees", employee.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      toast({
        title: "Prestaciones actualizadas",
        description: "La configuración especial de prestaciones ha sido guardada correctamente.",
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar la configuración",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    // Validación final: no guardar si los esquemas no han cargado
    if (loadingEsquemas || !esquemas || errorEsquemas) {
      return;
    }
    // Validar que selectedEsquema sea explícitamente null o string no vacío
    if (selectedEsquema !== null && (typeof selectedEsquema !== 'string' || selectedEsquema.trim() === '')) {
      return;
    }
    saveMutation.mutate(selectedEsquema);
  };

  // Obtener el nombre del esquema
  const getEsquemaNombre = (esquemaId: string | null) => {
    if (!esquemaId) return "LFT 2024 (Estándar)";
    const esquema = esquemas?.find((e) => e.id === esquemaId);
    return esquema?.nombreEsquema || "Desconocido";
  };

  // Determinar el esquema que se está usando actualmente (del puesto)
  const esquemaPuesto = puesto?.esquemaPrestacionesId;
  const usandoOverride = !!employee.esquemaPrestacionesId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" data-testid="dialog-prestaciones-override">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Configuración Especial de Prestaciones
          </DialogTitle>
          <DialogDescription>
            Asigna un esquema de prestaciones específico para{" "}
            <span className="font-semibold">
              {employee.nombre} {employee.apellidoPaterno}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Información actual */}
          <div className="space-y-2">
            <Label>Estado actual</Label>
            <div className="rounded-md border p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Esquema del puesto:</span>
                <Badge variant="outline" data-testid="badge-esquema-puesto">
                  {getEsquemaNombre(esquemaPuesto ?? null)}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Configuración especial:</span>
                <Badge variant={usandoOverride ? "default" : "secondary"} data-testid="badge-override-estado">
                  {usandoOverride ? "Sí - Override activo" : "No - Usa del puesto"}
                </Badge>
              </div>
            </div>
          </div>

          {/* Selector de esquema */}
          <div className="space-y-2">
            <Label htmlFor="select-esquema">Seleccionar esquema de prestaciones</Label>
            {errorEsquemas ? (
              <Alert variant="destructive" data-testid="alert-error-esquemas">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Error al cargar los esquemas de prestaciones. Por favor, intenta cerrar y abrir el diálogo nuevamente.
                </AlertDescription>
              </Alert>
            ) : (
              <Select
                value={selectedEsquema || "null"}
                onValueChange={(value) => setSelectedEsquema(value === "null" ? null : value)}
                disabled={loadingEsquemas || saveMutation.isPending || !esquemas}
              >
              <SelectTrigger id="select-esquema" data-testid="select-esquema-override">
                <SelectValue placeholder="Seleccionar..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="null">
                  Usar esquema del puesto ({getEsquemaNombre(esquemaPuesto ?? null)})
                </SelectItem>
                {esquemas?.map((esquema) => (
                  <SelectItem key={esquema.id} value={esquema.id}>
                    {esquema.nombreEsquema}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            )}
          </div>

          {/* Alerta informativa */}
          {selectedEsquema !== employee.esquemaPrestacionesId && (
            <Alert data-testid="alert-cambio-pendiente">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {selectedEsquema === null
                  ? "Se removerá la configuración especial y el empleado usará el esquema de su puesto."
                  : "Se aplicará una configuración especial de prestaciones a este empleado, sin importar su puesto."}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saveMutation.isPending}
            data-testid="button-cancelar-override"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={
              saveMutation.isPending || 
              selectedEsquema === employee.esquemaPrestacionesId ||
              loadingEsquemas ||
              !esquemas ||
              errorEsquemas ||
              (selectedEsquema !== null && selectedEsquema.trim() === '')
            }
            data-testid="button-guardar-override"
          >
            {saveMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              "Guardar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
