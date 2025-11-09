import { useState, useEffect } from "react";
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
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search } from "lucide-react";

type GrupoNomina = {
  id: string;
  nombre: string;
  tipoPeriodo: "semanal" | "catorcenal" | "quincenal" | "mensual";
  diaInicioSemana?: number;
  diaCorte?: number;
  diaPago?: number;
  diasCalculo?: number;
  descripcion?: string;
  activo: boolean;
};

type Employee = {
  id: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno?: string;
  numeroEmpleado: string;
  grupoNominaId?: string;
};

interface CreateGrupoNominaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger?: React.ReactNode;
  grupoToEdit?: GrupoNomina | null;
  mode?: "create" | "edit";
}

export function CreateGrupoNominaDialog({
  open,
  onOpenChange,
  trigger,
  grupoToEdit = null,
  mode = "create",
}: CreateGrupoNominaDialogProps) {
  const { toast } = useToast();
  const isEditMode = mode === "edit" || !!grupoToEdit;
  
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupTipoPeriodo, setNewGroupTipoPeriodo] = useState<"semanal" | "catorcenal" | "quincenal" | "mensual">("quincenal");
  const [newGroupDiaInicioSemana, setNewGroupDiaInicioSemana] = useState<number>(1);
  const [newGroupDiaCorte, setNewGroupDiaCorte] = useState<number>(15);
  const [newGroupDiaPago, setNewGroupDiaPago] = useState<number>(5);
  const [newGroupDiaPagoMes, setNewGroupDiaPagoMes] = useState<number>(15);
  const [newGroupDiasCalculo, setNewGroupDiasCalculo] = useState<number>(2);
  const [newGroupDescripcion, setNewGroupDescripcion] = useState("");
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Cargar empleados y grupos de nómina
  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
    enabled: open,
  });

  const { data: gruposNomina = [] } = useQuery<GrupoNomina[]>({
    queryKey: ["/api/grupos-nomina"],
    enabled: open,
  });

  const resetForm = () => {
    setNewGroupName("");
    setNewGroupTipoPeriodo("quincenal");
    setNewGroupDiaInicioSemana(1);
    setNewGroupDiaCorte(15);
    setNewGroupDiaPago(5);
    setNewGroupDiaPagoMes(15);
    setNewGroupDiasCalculo(2);
    setNewGroupDescripcion("");
    setSelectedEmployeeIds([]);
    setSearchTerm("");
  };

  // Filtrar y ordenar empleados
  const filteredAndSortedEmployees = employees
    .filter(emp => {
      if (!searchTerm) return true;
      const fullName = `${emp.apellidoPaterno} ${emp.apellidoMaterno || ""} ${emp.nombre}`.toLowerCase();
      return fullName.includes(searchTerm.toLowerCase());
    })
    .sort((a, b) => {
      // Primero, separar empleados asignados a otros grupos (al final)
      const aAssignedToOther = a.grupoNominaId && a.grupoNominaId !== grupoToEdit?.id;
      const bAssignedToOther = b.grupoNominaId && b.grupoNominaId !== grupoToEdit?.id;
      
      if (aAssignedToOther && !bAssignedToOther) return 1;
      if (!aAssignedToOther && bAssignedToOther) return -1;
      
      // Luego ordenar por apellido paterno, materno, nombre
      const comparePaterno = a.apellidoPaterno.localeCompare(b.apellidoPaterno, 'es');
      if (comparePaterno !== 0) return comparePaterno;
      
      const compareMaterno = (a.apellidoMaterno || "").localeCompare(b.apellidoMaterno || "", 'es');
      if (compareMaterno !== 0) return compareMaterno;
      
      return a.nombre.localeCompare(b.nombre, 'es');
    });

  // Funciones de selección
  const toggleEmployee = (employeeId: string) => {
    if (selectedEmployeeIds.includes(employeeId)) {
      setSelectedEmployeeIds(selectedEmployeeIds.filter(id => id !== employeeId));
    } else {
      setSelectedEmployeeIds([...selectedEmployeeIds, employeeId]);
    }
  };

  const selectAll = () => {
    // Merge filtered employees with existing selections (union)
    const filteredIds = filteredAndSortedEmployees.map(emp => emp.id);
    const mergedIds = Array.from(new Set([...selectedEmployeeIds, ...filteredIds]));
    setSelectedEmployeeIds(mergedIds);
  };

  const deselectAll = () => {
    // Remove only filtered employees from selection, keep others
    const filteredIds = new Set(filteredAndSortedEmployees.map(emp => emp.id));
    setSelectedEmployeeIds(selectedEmployeeIds.filter(id => !filteredIds.has(id)));
  };

  const allSelected = filteredAndSortedEmployees.length > 0 && 
    filteredAndSortedEmployees.every(emp => selectedEmployeeIds.includes(emp.id));

  // Cargar datos del grupo cuando está en modo edición
  useEffect(() => {
    if (open && grupoToEdit) {
      setNewGroupName(grupoToEdit.nombre);
      setNewGroupTipoPeriodo(grupoToEdit.tipoPeriodo);
      setNewGroupDiaInicioSemana(grupoToEdit.diaInicioSemana ?? 1);
      setNewGroupDiaCorte(grupoToEdit.diaCorte ?? 15);
      setNewGroupDiaPago(grupoToEdit.diaPago ?? 5);
      setNewGroupDiaPagoMes(grupoToEdit.diaPago ?? 15);
      setNewGroupDiasCalculo(grupoToEdit.diasCalculo ?? 2);
      setNewGroupDescripcion(grupoToEdit.descripcion ?? "");
      
      // Cargar empleados del grupo
      const employeesInGroup = employees.filter(emp => emp.grupoNominaId === grupoToEdit.id);
      setSelectedEmployeeIds(employeesInGroup.map(emp => emp.id));
    } else if (open && !grupoToEdit) {
      resetForm();
    }
  }, [open, grupoToEdit, employees]);

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  const saveGroup = async () => {
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
        activo: isEditMode ? grupoToEdit?.activo ?? true : true,
        employeeIds: selectedEmployeeIds,
      };

      if (isEditMode && grupoToEdit) {
        // Modo edición
        await apiRequest("PATCH", `/api/grupos-nomina/${grupoToEdit.id}`, grupoData);
        toast({
          title: "Grupo actualizado exitosamente",
          description: `"${groupNameForToast}" ha sido actualizado.`,
        });
      } else {
        // Modo creación
        await apiRequest("POST", "/api/grupos-nomina", grupoData);
        toast({
          title: "Grupo creado exitosamente",
          description: `"${groupNameForToast}" con periodicidad ${tipoPeriodoForToast}. Los periodos de pago se generaron automáticamente.`,
        });
      }

      onOpenChange(false);
      
      queryClient.invalidateQueries({ queryKey: ["/api/grupos-nomina"] });
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
    } catch (error: any) {
      toast({
        title: isEditMode ? "Error al actualizar grupo" : "Error al crear grupo",
        description: error.message || "No se pudo procesar la solicitud",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger}
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Editar Grupo de Nómina" : "Crear Grupo de Nómina"}</DialogTitle>
          <DialogDescription>
            {isEditMode ? "Modifica la configuración del grupo de nómina" : "Define la periodicidad y configuración del grupo de nómina"}
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

          <div className="space-y-3">
            <Label>Empleados del Grupo</Label>
            
            {/* Buscador */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar empleado por nombre o apellido..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                data-testid="input-search-employee"
              />
            </div>

            {/* Controles de selección */}
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={selectAll}
                disabled={filteredAndSortedEmployees.length === 0}
                data-testid="button-select-all-employees"
              >
                Seleccionar Todos
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={deselectAll}
                disabled={selectedEmployeeIds.length === 0}
                data-testid="button-deselect-all-employees"
              >
                Deseleccionar Todos
              </Button>
              <div className="flex-1" />
              <Badge variant="secondary" data-testid="badge-selected-count">
                {selectedEmployeeIds.length} de {employees.length} seleccionados
              </Badge>
            </div>

            {/* Tabla de empleados */}
            <div className="rounded-md border max-h-80 overflow-y-auto">
              {employees.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-sm text-muted-foreground">No hay empleados disponibles</p>
                </div>
              ) : filteredAndSortedEmployees.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-sm text-muted-foreground">No se encontraron empleados con ese criterio de búsqueda</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={allSelected}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              selectAll();
                            } else {
                              deselectAll();
                            }
                          }}
                          data-testid="checkbox-select-all-header"
                        />
                      </TableHead>
                      <TableHead>Empleado</TableHead>
                      <TableHead>Grupo Asignado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAndSortedEmployees.map((employee) => {
                      const assignedGroup = employee.grupoNominaId 
                        ? gruposNomina.find(g => g.id === employee.grupoNominaId)
                        : null;
                      const isAssignedToOtherGroup = assignedGroup && assignedGroup.id !== grupoToEdit?.id;
                      
                      return (
                        <TableRow 
                          key={employee.id}
                          className={selectedEmployeeIds.includes(employee.id) ? "bg-muted/30" : ""}
                          data-testid={`row-employee-${employee.id}`}
                        >
                          <TableCell>
                            <Checkbox
                              checked={selectedEmployeeIds.includes(employee.id)}
                              onCheckedChange={() => toggleEmployee(employee.id)}
                              data-testid={`checkbox-employee-${employee.id}`}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            {employee.apellidoPaterno} {employee.apellidoMaterno || ""} {employee.nombre}
                          </TableCell>
                          <TableCell>
                            {isAssignedToOtherGroup ? (
                              <Badge variant="secondary" className="text-xs">
                                {assignedGroup.nombre}
                              </Badge>
                            ) : assignedGroup && assignedGroup.id === grupoToEdit?.id ? (
                              <Badge variant="outline" className="text-xs">
                                Este grupo
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">Sin asignar</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
          
          <div className="rounded-md border p-4 bg-muted/30">
            <p className="text-sm font-medium mb-1">Información Importante</p>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
              {!isEditMode && <li>Los periodos de pago se generarán automáticamente para el año actual y próximo</li>}
              <li>Puedes asignar o reasignar empleados a este grupo seleccionándolos en la lista</li>
              <li>La configuración de periodicidad {isEditMode ? "no puede modificarse" : "no podrá modificarse después de crear el grupo"}</li>
            </ul>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={saveGroup} data-testid="button-save-group">
            {isEditMode ? "Actualizar Grupo" : "Guardar Grupo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
