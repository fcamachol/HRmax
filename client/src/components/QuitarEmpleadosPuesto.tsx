import { useState, useEffect } from "react";
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
import { Search, UserMinus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface QuitarEmpleadosPuestoProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  puestoId: string;
  puestoNombre: string;
}

export function QuitarEmpleadosPuesto({
  open,
  onOpenChange,
  puestoId,
  puestoNombre,
}: QuitarEmpleadosPuestoProps) {
  const [search, setSearch] = useState("");
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const { toast } = useToast();

  // Reset state when dialog opens or closes
  useEffect(() => {
    if (!open) {
      setSelectedEmployeeIds([]);
      setSearch("");
    }
  }, [open]);

  const { data: employees = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/employees"],
    enabled: open,
  });

  const removeMutation = useMutation({
    mutationFn: async (employeeIds: string[]) => {
      // Actualizar cada empleado para quitar el puestoId (establecer a null)
      await Promise.all(
        employeeIds.map((employeeId) =>
          apiRequest("PATCH", `/api/employees/${employeeId}`, {
            puestoId: null,
          })
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      queryClient.invalidateQueries({ queryKey: ["/api/puestos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/puestos/employees/counts"] });
      toast({
        title: "Empleados removidos",
        description: `${selectedEmployeeIds.length} empleado(s) removido(s) del puesto correctamente`,
      });
      setSelectedEmployeeIds([]);
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudieron remover los empleados",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (selectedEmployeeIds.length === 0) {
      toast({
        title: "Selecciona al menos un empleado",
        description: "Debes seleccionar al menos un empleado para remover",
        variant: "destructive",
      });
      return;
    }
    removeMutation.mutate(selectedEmployeeIds);
  };

  const toggleEmployee = (employeeId: string) => {
    setSelectedEmployeeIds((prev) =>
      prev.includes(employeeId)
        ? prev.filter((id) => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  // Filtrar solo empleados asignados a este puesto
  const assignedEmployees = employees.filter(
    (emp) => emp.puestoId === puestoId
  );

  const filteredEmployees = assignedEmployees.filter((emp) => {
    const searchLower = search.toLowerCase();
    return (
      emp.nombre?.toLowerCase().includes(searchLower) ||
      emp.apellidoPaterno?.toLowerCase().includes(searchLower) ||
      emp.apellidoMaterno?.toLowerCase().includes(searchLower) ||
      emp.numeroEmpleado?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Quitar Empleados</DialogTitle>
          <DialogDescription>
            Puesto: <span className="font-semibold">{puestoNombre}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar empleados por nombre o número..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
                data-testid="input-search-employees-remove"
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
                ? "No se encontraron empleados asignados"
                : assignedEmployees.length === 0
                ? "No hay empleados asignados a este puesto"
                : "No se encontraron empleados"}
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto border rounded-md">
              <div className="p-2 space-y-1">
                {filteredEmployees.map((employee) => (
                  <div
                    key={employee.id}
                    className="flex items-center gap-3 p-3 rounded-md hover-elevate"
                    data-testid={`employee-item-remove-${employee.id}`}
                  >
                    <Checkbox
                      checked={selectedEmployeeIds.includes(employee.id)}
                      onCheckedChange={() => toggleEmployee(employee.id)}
                      data-testid={`checkbox-employee-remove-${employee.id}`}
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
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedEmployeeIds.length > 0 && (
            <div className="mt-3 p-3 bg-destructive/10 rounded-md">
              <p className="text-sm font-medium text-destructive">
                <UserMinus className="inline h-4 w-4 mr-1" />
                {selectedEmployeeIds.length} empleado(s) seleccionado(s) para remover
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-testid="button-cancel-remove"
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={
              selectedEmployeeIds.length === 0 || removeMutation.isPending
            }
            data-testid="button-submit-remove"
          >
            {removeMutation.isPending
              ? "Removiendo..."
              : `Quitar ${selectedEmployeeIds.length > 0 ? `(${selectedEmployeeIds.length})` : ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
