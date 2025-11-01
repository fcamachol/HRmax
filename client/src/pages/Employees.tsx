import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmployeeTable } from "@/components/EmployeeTable";
import { Plus, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EmployeeForm } from "@/components/EmployeeForm";

export default function Employees() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const mockEmployees = [
    {
      id: "1",
      firstName: "María",
      lastName: "García López",
      rfc: "GACM850101AB1",
      department: "Ventas",
      position: "Gerente de Ventas",
      status: "active",
    },
    {
      id: "2",
      firstName: "Juan",
      lastName: "Pérez Martínez",
      rfc: "PEXJ900215CD2",
      department: "IT",
      position: "Desarrollador Senior",
      status: "active",
    },
    {
      id: "3",
      firstName: "Ana",
      lastName: "Martínez Sánchez",
      rfc: "MASA920310EF3",
      department: "RRHH",
      position: "Coordinadora RH",
      status: "active",
    },
    {
      id: "4",
      firstName: "Carlos",
      lastName: "López Rodríguez",
      rfc: "LORC880520GH4",
      department: "Finanzas",
      position: "Contador",
      status: "on leave",
    },
    {
      id: "5",
      firstName: "Laura",
      lastName: "Hernández Torres",
      rfc: "HETL950705IJ5",
      department: "Operaciones",
      position: "Supervisor",
      status: "active",
    },
  ];

  const filteredEmployees = mockEmployees.filter(
    (emp) =>
      emp.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.rfc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Empleados</h1>
        <p className="text-muted-foreground mt-2">
          Gestiona la información de todos los empleados
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o RFC..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-employees"
          />
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-employee">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Empleado
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Agregar Nuevo Empleado</DialogTitle>
            </DialogHeader>
            <EmployeeForm
              onSubmit={(data) => {
                console.log("Employee created:", data);
                setIsDialogOpen(false);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <EmployeeTable
        employees={filteredEmployees}
        onView={(id) => console.log("View employee:", id)}
        onEdit={(id) => console.log("Edit employee:", id)}
        onDelete={(id) => console.log("Delete employee:", id)}
      />
    </div>
  );
}
