import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface CreateGrupoNominaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export function CreateGrupoNominaDialog({
  open,
  onOpenChange,
  trigger,
}: CreateGrupoNominaDialogProps) {
  const { toast } = useToast();
  
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupTipoPeriodo, setNewGroupTipoPeriodo] = useState<"semanal" | "catorcenal" | "quincenal" | "mensual">("quincenal");
  const [newGroupDiaInicioSemana, setNewGroupDiaInicioSemana] = useState<number>(1);
  const [newGroupDiaCorte, setNewGroupDiaCorte] = useState<number>(15);
  const [newGroupDiaPago, setNewGroupDiaPago] = useState<number>(5);
  const [newGroupDiaPagoMes, setNewGroupDiaPagoMes] = useState<number>(15);
  const [newGroupDiasCalculo, setNewGroupDiasCalculo] = useState<number>(2);
  const [newGroupDescripcion, setNewGroupDescripcion] = useState("");

  const resetForm = () => {
    setNewGroupName("");
    setNewGroupTipoPeriodo("quincenal");
    setNewGroupDiaInicioSemana(1);
    setNewGroupDiaCorte(15);
    setNewGroupDiaPago(5);
    setNewGroupDiaPagoMes(15);
    setNewGroupDiasCalculo(2);
    setNewGroupDescripcion("");
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  const createGroup = async () => {
    if (!newGroupName.trim()) {
      toast({
        title: "Error",
        description: "El nombre del grupo es requerido",
        variant: "destructive",
      });
      return;
    }

    const groupNameForToast = newGroupName;
    const tipoPeriodoForToast = newGroupTipoPeriodo;

    try {
      const grupoData = {
        nombre: newGroupName,
        tipoPeriodo: newGroupTipoPeriodo,
        diaInicioSemana: (newGroupTipoPeriodo === "semanal" || newGroupTipoPeriodo === "catorcenal") 
          ? newGroupDiaInicioSemana 
          : undefined,
        diaCorte: (newGroupTipoPeriodo === "quincenal" || newGroupTipoPeriodo === "mensual") 
          ? newGroupDiaCorte 
          : undefined,
        diaPago: (newGroupTipoPeriodo === "semanal" || newGroupTipoPeriodo === "catorcenal")
          ? newGroupDiaPago
          : (newGroupTipoPeriodo === "quincenal" || newGroupTipoPeriodo === "mensual")
            ? newGroupDiaPagoMes
            : undefined,
        diasCalculo: newGroupDiasCalculo || undefined,
        descripcion: newGroupDescripcion || undefined,
        activo: true,
      };

      await apiRequest("POST", "/api/grupos-nomina", grupoData);

      onOpenChange(false);
      
      queryClient.invalidateQueries({ queryKey: ["/api/grupos-nomina"] });
      
      toast({
        title: "Grupo creado exitosamente",
        description: `"${groupNameForToast}" con periodicidad ${tipoPeriodoForToast}. Los periodos de pago se generaron automáticamente.`,
      });
    } catch (error: any) {
      toast({
        title: "Error al crear grupo",
        description: error.message || "No se pudo crear el grupo de nómina",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger}
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Crear Grupo de Nómina</DialogTitle>
          <DialogDescription>
            Define la periodicidad y configuración del grupo de nómina
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 overflow-y-auto flex-1">
          <div className="space-y-2">
            <Label htmlFor="group-name">Nombre del Grupo</Label>
            <Input
              id="group-name"
              placeholder="ej. Equipo de Ventas"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              data-testid="input-group-name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tipo-periodo">Periodicidad de Pago</Label>
            <Select 
              value={newGroupTipoPeriodo} 
              onValueChange={(v) => setNewGroupTipoPeriodo(v as any)}
            >
              <SelectTrigger id="tipo-periodo" data-testid="select-tipo-periodo">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="semanal">Semanal (~52 periodos/año)</SelectItem>
                <SelectItem value="catorcenal">Catorcenal (~26 periodos/año)</SelectItem>
                <SelectItem value="quincenal">Quincenal (24 periodos/año)</SelectItem>
                <SelectItem value="mensual">Mensual (12 periodos/año)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(newGroupTipoPeriodo === "semanal" || newGroupTipoPeriodo === "catorcenal") && (
            <div className="space-y-2">
              <Label htmlFor="dia-inicio-semana">Día de Inicio de Semana</Label>
              <Select 
                value={newGroupDiaInicioSemana.toString()} 
                onValueChange={(v) => setNewGroupDiaInicioSemana(parseInt(v))}
              >
                <SelectTrigger id="dia-inicio-semana" data-testid="select-dia-inicio-semana">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Domingo</SelectItem>
                  <SelectItem value="1">Lunes</SelectItem>
                  <SelectItem value="2">Martes</SelectItem>
                  <SelectItem value="3">Miércoles</SelectItem>
                  <SelectItem value="4">Jueves</SelectItem>
                  <SelectItem value="5">Viernes</SelectItem>
                  <SelectItem value="6">Sábado</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Los periodos se alinearán a este día de la semana
              </p>
            </div>
          )}

          {(newGroupTipoPeriodo === "quincenal" || newGroupTipoPeriodo === "mensual") && (
            <div className="space-y-2">
              <Label htmlFor="dia-corte">Día de Corte</Label>
              <Input
                id="dia-corte"
                type="number"
                min="1"
                max="31"
                value={newGroupDiaCorte}
                onChange={(e) => setNewGroupDiaCorte(parseInt(e.target.value) || 15)}
                data-testid="input-dia-corte"
              />
              <p className="text-xs text-muted-foreground">
                {newGroupTipoPeriodo === "quincenal" 
                  ? "Para quincenas: 1-15 y 16-fin de mes" 
                  : "Día del mes para el corte de nómina"}
              </p>
            </div>
          )}

          {(newGroupTipoPeriodo === "semanal" || newGroupTipoPeriodo === "catorcenal") && (
            <div className="space-y-2">
              <Label htmlFor="dia-pago">Día de Pago</Label>
              <Select 
                value={newGroupDiaPago.toString()} 
                onValueChange={(v) => setNewGroupDiaPago(parseInt(v))}
              >
                <SelectTrigger id="dia-pago" data-testid="select-dia-pago">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Domingo</SelectItem>
                  <SelectItem value="1">Lunes</SelectItem>
                  <SelectItem value="2">Martes</SelectItem>
                  <SelectItem value="3">Miércoles</SelectItem>
                  <SelectItem value="4">Jueves</SelectItem>
                  <SelectItem value="5">Viernes</SelectItem>
                  <SelectItem value="6">Sábado</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Día de la semana en que se realiza el pago
              </p>
            </div>
          )}

          {(newGroupTipoPeriodo === "quincenal" || newGroupTipoPeriodo === "mensual") && (
            <div className="space-y-2">
              <Label htmlFor="dia-pago-mes">Día de Pago</Label>
              <Input
                id="dia-pago-mes"
                type="number"
                min="1"
                max="31"
                value={newGroupDiaPagoMes}
                onChange={(e) => setNewGroupDiaPagoMes(parseInt(e.target.value) || 15)}
                data-testid="input-dia-pago-mes"
              />
              <p className="text-xs text-muted-foreground">
                Día del mes en que se realiza el pago
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="dias-calculo">Días de Cálculo (opcional)</Label>
            <Input
              id="dias-calculo"
              type="number"
              min="0"
              max="30"
              value={newGroupDiasCalculo}
              onChange={(e) => setNewGroupDiasCalculo(parseInt(e.target.value) || 0)}
              data-testid="input-dias-calculo"
            />
            <p className="text-xs text-muted-foreground">
              Días de anticipación para hacer los cálculos de pre-nómina (ej. 2 días)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción (opcional)</Label>
            <Input
              id="descripcion"
              placeholder="ej. Nómina semanal para personal operativo"
              value={newGroupDescripcion}
              onChange={(e) => setNewGroupDescripcion(e.target.value)}
              data-testid="input-descripcion"
            />
          </div>
          
          <div className="rounded-md border p-4 bg-muted/30">
            <p className="text-sm font-medium mb-1">Información Importante</p>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
              <li>Los periodos de pago se generarán automáticamente para el año actual y próximo</li>
              <li>Los empleados deben ser asignados al grupo desde su perfil individual</li>
              <li>La configuración de periodicidad no puede modificarse después de crear el grupo</li>
            </ul>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={createGroup} data-testid="button-save-group">
            Guardar Grupo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
