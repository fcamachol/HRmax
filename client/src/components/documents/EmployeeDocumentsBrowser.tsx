import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EmployeeDocumentManager } from "./EmployeeDocumentManager";
import { useCliente } from "@/contexts/ClienteContext";
import { Search, Users, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Employee } from "@shared/schema";

interface EmployeeDocumentsBrowserProps {
  initialEmployeeId?: string;
}

export function EmployeeDocumentsBrowser({ initialEmployeeId }: EmployeeDocumentsBrowserProps) {
  const { clienteId } = useCliente();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(initialEmployeeId || null);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: employees = [], isLoading } = useQuery<Employee[]>({
    queryKey: ["/api/employees", { clienteId }],
    queryFn: async () => {
      const res = await fetch(`/api/employees?clienteId=${clienteId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Error al cargar empleados");
      return res.json();
    },
    enabled: !!clienteId,
  });

  const filteredEmployees = employees.filter((emp) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const fullName = `${emp.nombre} ${emp.apellidoPaterno} ${emp.apellidoMaterno || ""}`.toLowerCase();
    return (
      fullName.includes(query) ||
      emp.numeroEmpleado.toLowerCase().includes(query) ||
      (emp.departamento?.toLowerCase() || "").includes(query)
    );
  });

  const selectedEmployee = selectedEmployeeId
    ? employees.find((emp) => emp.id === selectedEmployeeId)
    : null;

  return (
    <div className="flex h-[calc(100vh-280px)] border rounded-lg overflow-hidden bg-background">
      {/* Employee Sidebar */}
      <div className="w-72 border-r flex flex-col bg-muted/20">
        {/* Search Header */}
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar empleado..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Employee List */}
        <ScrollArea className="flex-1">
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground">
              Cargando empleados...
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No se encontraron empleados
            </div>
          ) : (
            <div className="p-2">
              {filteredEmployees.map((emp) => (
                <button
                  key={emp.id}
                  onClick={() => setSelectedEmployeeId(emp.id)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-md transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    selectedEmployeeId === emp.id
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground"
                  )}
                >
                  <div className="font-medium text-sm truncate">
                    {emp.nombre} {emp.apellidoPaterno} {emp.apellidoMaterno || ""}
                  </div>
                  <div
                    className={cn(
                      "text-xs truncate",
                      selectedEmployeeId === emp.id
                        ? "text-primary-foreground/70"
                        : "text-muted-foreground"
                    )}
                  >
                    {emp.departamento || emp.puesto || `#${emp.numeroEmpleado}`}
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer stats */}
        <div className="p-3 border-t text-xs text-muted-foreground">
          {filteredEmployees.length} de {employees.length} empleados
        </div>
      </div>

      {/* Document Manager Area */}
      <div className="flex-1 flex flex-col">
        {selectedEmployee ? (
          <>
            {/* Header with employee name */}
            <div className="px-4 py-3 border-b bg-muted/30">
              <h3 className="font-medium">
                Documentos de: {selectedEmployee.nombre} {selectedEmployee.apellidoPaterno}
              </h3>
              <p className="text-sm text-muted-foreground">
                {selectedEmployee.departamento && `${selectedEmployee.departamento} • `}
                {selectedEmployee.puesto || `Empleado #${selectedEmployee.numeroEmpleado}`}
              </p>
            </div>
            {/* Document Manager */}
            <div className="flex-1 overflow-hidden">
              <EmployeeDocumentManager
                empleadoId={selectedEmployeeId!}
                empleadoNombre={`${selectedEmployee.nombre} ${selectedEmployee.apellidoPaterno}`}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <FolderOpen className="h-16 w-16 mb-4 opacity-30" />
            <p className="text-lg font-medium">Selecciona un empleado</p>
            <p className="text-sm">
              Elige un empleado de la lista para ver sus documentos
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
