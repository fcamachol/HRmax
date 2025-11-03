import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save, X, History } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { ConfigurationChangeLog } from "@shared/schema";

type Periodicidad = "diaria" | "semanal" | "decenal" | "quincenal" | "mensual";

interface ISRTramo {
  limiteInferior: number;
  limiteSuperior: number | null;
  cuotaFija: number;
  porcentajeExcedente: number;
}

interface SubsidioTramo {
  limiteInferior: number;
  limiteSuperior: number | null;
  subsidio: number;
}

interface EditISRDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  periodicidad: Periodicidad;
  isrTramos: ISRTramo[];
  subsidioTramos: SubsidioTramo[];
  onSave: (isrTramos: ISRTramo[], subsidioTramos: SubsidioTramo[]) => void;
}

export function EditISRDialog({
  open,
  onOpenChange,
  periodicidad,
  isrTramos: initialISRTramos,
  subsidioTramos: initialSubsidioTramos,
  onSave,
}: EditISRDialogProps) {
  const [isrTramos, setIsrTramos] = useState<ISRTramo[]>(initialISRTramos);
  const [subsidioTramos, setSubsidioTramos] = useState<SubsidioTramo[]>(initialSubsidioTramos);
  const [description, setDescription] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const { toast } = useToast();

  // Resincronizar estado local cuando cambien las props
  useEffect(() => {
    setIsrTramos(initialISRTramos);
  }, [periodicidad, initialISRTramos]);

  useEffect(() => {
    setSubsidioTramos(initialSubsidioTramos);
  }, [periodicidad, initialSubsidioTramos]);

  // Resetear descripción y vista de historial al cambiar periodicidad
  useEffect(() => {
    setDescription("");
    setShowHistory(false);
  }, [periodicidad]);

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return "En adelante";
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const updateISRTramo = (index: number, field: keyof ISRTramo, value: string) => {
    const newTramos = [...isrTramos];
    const numValue = field === 'limiteSuperior' && value === '' 
      ? null 
      : parseFloat(value);
    newTramos[index] = {
      ...newTramos[index],
      [field]: numValue,
    };
    setIsrTramos(newTramos);
  };

  const updateSubsidioTramo = (index: number, field: keyof SubsidioTramo, value: string) => {
    const newTramos = [...subsidioTramos];
    const numValue = field === 'limiteSuperior' && value === '' 
      ? null 
      : parseFloat(value);
    newTramos[index] = {
      ...newTramos[index],
      [field]: numValue,
    };
    setSubsidioTramos(newTramos);
  };

  const saveLogMutation = useMutation({
    mutationFn: async (logData: any) => {
      return await apiRequest("POST", "/api/configuration/change-log", logData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/configuration/change-logs"] });
    },
  });

  const handleSave = async () => {
    // Validar que los datos sean correctos
    const isValid = isrTramos.every(t => 
      !isNaN(t.limiteInferior) && 
      !isNaN(t.cuotaFija) && 
      !isNaN(t.porcentajeExcedente)
    );

    if (!isValid) {
      toast({
        title: "Error de validación",
        description: "Por favor verifica que todos los valores numéricos sean válidos",
        variant: "destructive",
      });
      return;
    }

    try {
      // Guardar log de cambio ISR
      await saveLogMutation.mutateAsync({
        changeType: 'isr_table',
        periodicidad,
        changedBy: 'Admin', // TODO: usar usuario real
        previousValue: { tramos: initialISRTramos },
        newValue: { tramos: isrTramos },
        description: description || `Actualización de tabla ISR ${periodicidad}`,
      });

      // Guardar log de cambio Subsidio
      await saveLogMutation.mutateAsync({
        changeType: 'subsidio_table',
        periodicidad,
        changedBy: 'Admin', // TODO: usar usuario real
        previousValue: { tramos: initialSubsidioTramos },
        newValue: { tramos: subsidioTramos },
        description: description || `Actualización de tabla subsidio ${periodicidad}`,
      });

      onSave(isrTramos, subsidioTramos);
      toast({
        title: "Cambios guardados",
        description: `Las tablas de ${periodicidad} han sido actualizadas correctamente`,
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error al guardar",
        description: "No se pudieron guardar los cambios",
        variant: "destructive",
      });
    }
  };

  // Query para obtener historial
  const { data: changeLogs } = useQuery<ConfigurationChangeLog[]>({
    queryKey: ["/api/configuration/change-logs", "isr_table", periodicidad],
    enabled: showHistory && open,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Editar Tablas ISR y Subsidio - {periodicidad.charAt(0).toUpperCase() + periodicidad.slice(1)}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
              data-testid="button-toggle-history"
            >
              <History className="w-4 h-4 mr-2" />
              {showHistory ? "Ocultar" : "Ver"} Historial
            </Button>
          </DialogTitle>
          <DialogDescription>
            Modifica los valores de las tablas ISR y subsidio al empleo. Los cambios se registrarán en el historial.
          </DialogDescription>
        </DialogHeader>

        {showHistory && changeLogs && changeLogs.length > 0 && (
          <div className="mb-4 p-4 bg-muted rounded-md">
            <h3 className="font-semibold mb-2">Historial de Cambios</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {changeLogs.slice(0, 10).map((log) => (
                <div key={log.id} className="text-sm border-l-2 border-primary pl-3 py-1">
                  <div className="flex justify-between">
                    <span className="font-medium">{log.changedBy}</span>
                    <span className="text-muted-foreground text-xs">
                      {new Date(log.changeDate).toLocaleString('es-MX')}
                    </span>
                  </div>
                  {log.description && (
                    <p className="text-muted-foreground text-xs">{log.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <Label htmlFor="description">Descripción del cambio (opcional)</Label>
            <Textarea
              id="description"
              data-testid="input-change-description"
              placeholder="Ej: Actualización según Anexo 8 RMF 2025"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2">Tabla ISR</h3>
            <div className="border rounded-md overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Límite Inferior</TableHead>
                    <TableHead>Límite Superior</TableHead>
                    <TableHead>Cuota Fija</TableHead>
                    <TableHead>% Excedente</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isrTramos.map((tramo, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          value={tramo.limiteInferior}
                          onChange={(e) => updateISRTramo(index, 'limiteInferior', e.target.value)}
                          data-testid={`input-isr-limite-inferior-${index}`}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          value={tramo.limiteSuperior ?? ''}
                          onChange={(e) => updateISRTramo(index, 'limiteSuperior', e.target.value)}
                          placeholder="En adelante"
                          data-testid={`input-isr-limite-superior-${index}`}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          value={tramo.cuotaFija}
                          onChange={(e) => updateISRTramo(index, 'cuotaFija', e.target.value)}
                          data-testid={`input-isr-cuota-fija-${index}`}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          value={tramo.porcentajeExcedente}
                          onChange={(e) => updateISRTramo(index, 'porcentajeExcedente', e.target.value)}
                          data-testid={`input-isr-porcentaje-${index}`}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2">Tabla Subsidio al Empleo</h3>
            <div className="border rounded-md overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Límite Inferior</TableHead>
                    <TableHead>Límite Superior</TableHead>
                    <TableHead>Subsidio</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subsidioTramos.map((tramo, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          value={tramo.limiteInferior}
                          onChange={(e) => updateSubsidioTramo(index, 'limiteInferior', e.target.value)}
                          data-testid={`input-subsidio-limite-inferior-${index}`}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          value={tramo.limiteSuperior ?? ''}
                          onChange={(e) => updateSubsidioTramo(index, 'limiteSuperior', e.target.value)}
                          placeholder="En adelante"
                          data-testid={`input-subsidio-limite-superior-${index}`}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          value={tramo.subsidio}
                          onChange={(e) => updateSubsidioTramo(index, 'subsidio', e.target.value)}
                          data-testid={`input-subsidio-monto-${index}`}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-testid="button-cancel-edit"
          >
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={saveLogMutation.isPending}
            data-testid="button-save-changes"
          >
            <Save className="w-4 h-4 mr-2" />
            {saveLogMutation.isPending ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
