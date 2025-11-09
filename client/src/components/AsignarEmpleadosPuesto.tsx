import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Search, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface AsignarEmpleadosPuestoProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  puestoId: string;
  puestoNombre: string;
}

export function AsignarEmpleadosPuesto({
  open,
  onOpenChange,
  puestoId,
  puestoNombre,
}: AsignarEmpleadosPuestoProps) {
  const [search, setSearch] = useState("");
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const { toast } = useToast();

  const { data: employees = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/employees"],
    enabled: open,
  });

  const assignMutation = useMutation({
    mutationFn: async (employeeIds: string[]) => {
      // Actualizar cada empleado con el nuevo puestoId
      await Promise.all(
        employeeIds.map((employeeId) =>
          apiRequest("PATCH", `/api/employees/${employeeId}`, {
            puestoId: puestoId,
          })
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      queryClient.invalidateQueries({ queryKey: ["/api/puestos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/puestos/employees/counts"] });
      toast({
        title: "Empleados asignados",
        description: `${selectedEmployeeIds.length} empleado(s) asignado(s) al puesto correctamente`,
      });
      setSelectedEmployeeIds([]);
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudieron asignar los empleados",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (selectedEmployeeIds.length === 0) {
      toast({
        title: "Selecciona al menos un empleado",
        description: "Debes seleccionar al menos un empleado para asignar",
        variant: "destructive",
      });
      return;
    }
    assignMutation.mutate(selectedEmployeeIds);
  };

  const toggleEmployee = (employeeId: string) => {
    setSelectedEmployeeIds((prev) =>
      prev.includes(employeeId)
        ? prev.filter((id) => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  // Filtrar empleados: excluir los que ya están asignados a este puesto
  const availableEmployees = employees.filter(
    (emp) => emp.puestoId !== puestoId
  );

  const filteredEmployees = availableEmployees.filter((emp) => {
    const searchLower = search.toLowerCase();
    return (
      emp.nombre?.toLowerCase().includes(searchLower) ||
      emp.apellidoPaterno?.toLowerCase().includes(searchLower) ||
      emp.apellidoMaterno?.toLowerCase().includes(searchLower) ||
      emp.numeroEmpleado?.toLowerCase().includes(searchLower)
    );
  });

  // Empleados actualmente asignados a este puesto
  const assignedEmployees = employees.filter(
    (emp) => emp.puestoId === puestoId
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Asignar Empleados</DialogTitle>
          <DialogDescription>
            Puesto: <span className="font-semibold">{puestoNombre}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Empleados actualmente asignados */}
          {assignedEmployees.length > 0 && (
            <div className="mb-4 p-3 border rounded-md bg-muted/50">
              <h4 className="text-sm font-medium mb-2">
                Empleados Asignados Actualmente ({assignedEmployees.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {assignedEmployees.map((emp) => (
                  <Badge key={emp.id} variant="secondary">
                    {emp.nombre} {emp.apellidoPaterno}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar empleados por nombre o número..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
                data-testid="input-search-employees"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Cargando empleados...
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground border rounded-md">
              {search
                ? "No se encontraron empleados disponibles"
                : "No hay empleados disponibles para asignar"}
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto border rounded-md">
              <div className="p-2 space-y-1">
                {filteredEmployees.map((employee) => (
                  <div
                    key={employee.id}
                    className="flex items-center gap-3 p-3 rounded-md hover-elevate"
                    data-testid={`employee-item-${employee.id}`}
                  >
                    <Checkbox
                      checked={selectedEmployeeIds.includes(employee.id)}
                      onCheckedChange={() => toggleEmployee(employee.id)}
                      data-testid={`checkbox-employee-${employee.id}`}
                    />
                    <div className="flex-1">
                      <div className="font-medium">
                        {employee.nombre} {employee.apellidoPaterno}{" "}
                        {employee.apellidoMaterno}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {employee.numeroEmpleado}
                        {employee.departamento && ` • ${employee.departamento}`}
                      </div>
                    </div>
                    {employee.puestoId && (
                      <Badge variant="outline" className="text-xs">
                        Asignado a otro puesto
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedEmployeeIds.length > 0 && (
            <div className="mt-3 p-3 bg-primary/10 rounded-md">
              <p className="text-sm font-medium">
                <UserPlus className="inline h-4 w-4 mr-1" />
                {selectedEmployeeIds.length} empleado(s) seleccionado(s)
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-testid="button-cancel-assign"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              selectedEmployeeIds.length === 0 || assignMutation.isPending
            }
            data-testid="button-submit-assign"
          >
            {assignMutation.isPending
              ? "Asignando..."
              : `Asignar ${selectedEmployeeIds.length > 0 ? `(${selectedEmployeeIds.length})` : ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
