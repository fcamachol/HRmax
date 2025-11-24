import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Users, Search, Settings } from "lucide-react";
import { PrestacionesEmpleadoOverride } from "@/components/PrestacionesEmpleadoOverride";

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

export function EmpleadosOverridesManager() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [overrideDialogOpen, setOverrideDialogOpen] = useState(false);

  // Obtener empleados
  const { data: employees, isLoading: loadingEmployees } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  // Obtener puestos
  const { data: puestos } = useQuery<Puesto[]>({
    queryKey: ["/api/puestos"],
  });

  // Obtener esquemas
  const { data: esquemas } = useQuery<EsquemaPrestaciones[]>({
    queryKey: ["/api/cat-tablas-prestaciones"],
  });

  const getEsquemaNombre = (esquemaId: string | null) => {
    if (!esquemaId) return "LFT 2024 (Estándar)";
    const esquema = esquemas?.find((e) => e.id === esquemaId);
    return esquema?.nombreEsquema || "Desconocido";
  };

  const getPuestoNombre = (puestoId: string | null) => {
    if (!puestoId) return "Sin puesto";
    const puesto = puestos?.find((p) => p.id === puestoId);
    return puesto?.nombrePuesto || "Desconocido";
  };

  const getEsquemaPuesto = (puestoId: string | null) => {
    if (!puestoId) return null;
    const puesto = puestos?.find((p) => p.id === puestoId);
    return puesto?.esquemaPrestacionesId || null;
  };

  const handleConfigureOverride = (employee: Employee) => {
    setSelectedEmployee(employee);
    setOverrideDialogOpen(true);
  };

  const handleDialogClose = () => {
    setOverrideDialogOpen(false);
    setSelectedEmployee(null);
  };

  // Filtrado
  const filteredEmployees = employees?.filter((emp) => {
    const fullName = `${emp.nombre} ${emp.apellidoPaterno} ${emp.apellidoMaterno || ""}`.toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase());
    return matchesSearch;
  }) || [];

  if (loadingEmployees) {
    return (
      <div className="flex items-center justify-center py-8" data-testid="loading-empleados-overrides">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <Card data-testid="card-empleados-overrides">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Configuración Individual por Empleado
          </CardTitle>
          <CardDescription>
            Asigna esquemas de prestaciones específicos a empleados individuales.
            Los empleados sin override heredan las prestaciones de su puesto.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Búsqueda */}
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar empleado..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
              data-testid="input-search-empleados"
            />
          </div>

          {/* Tabla */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empleado</TableHead>
                <TableHead>Puesto</TableHead>
                <TableHead>Esquema del Puesto</TableHead>
                <TableHead>Override Individual</TableHead>
                <TableHead>Esquema Efectivo</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.length > 0 ? (
                filteredEmployees.map((emp) => {
                  const tieneOverride = !!emp.esquemaPrestacionesId;
                  const esquemaPuesto = getEsquemaPuesto(emp.puestoId);
                  const esquemaEfectivo = emp.esquemaPrestacionesId || esquemaPuesto;

                  return (
                    <TableRow key={emp.id} data-testid={`row-empleado-${emp.id}`}>
                      <TableCell className="font-medium" data-testid={`text-nombre-${emp.id}`}>
                        {emp.nombre} {emp.apellidoPaterno}
                      </TableCell>
                      <TableCell data-testid={`text-puesto-${emp.id}`}>
                        {getPuestoNombre(emp.puestoId)}
                      </TableCell>
                      <TableCell data-testid={`text-esquema-puesto-${emp.id}`}>
                        <Badge variant="outline">
                          {getEsquemaNombre(esquemaPuesto)}
                        </Badge>
                      </TableCell>
                      <TableCell data-testid={`text-override-${emp.id}`}>
                        {tieneOverride ? (
                          <Badge variant="default">
                            Sí - {getEsquemaNombre(emp.esquemaPrestacionesId)}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">No - Usa del puesto</Badge>
                        )}
                      </TableCell>
                      <TableCell data-testid={`text-esquema-efectivo-${emp.id}`}>
                        <Badge variant={tieneOverride ? "default" : "outline"}>
                          {getEsquemaNombre(esquemaEfectivo)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleConfigureOverride(emp)}
                          data-testid={`button-configurar-${emp.id}`}
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Configurar
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No hay empleados registrados
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog de override */}
      {selectedEmployee && (
        <PrestacionesEmpleadoOverride
          employee={{
            id: selectedEmployee.id,
            nombre: selectedEmployee.nombre,
            apellidoPaterno: selectedEmployee.apellidoPaterno,
            apellidoMaterno: selectedEmployee.apellidoMaterno,
            puestoId: selectedEmployee.puestoId,
            esquemaPrestacionesId: selectedEmployee.esquemaPrestacionesId,
          }}
          open={overrideDialogOpen}
          onOpenChange={handleDialogClose}
        />
      )}
    </>
  );
}
