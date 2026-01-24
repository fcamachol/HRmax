import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmployeeTable } from "@/components/EmployeeTable";
import { EmployeeQuickView } from "@/components/EmployeeQuickView";
import { EmployeeDetailView } from "@/components/EmployeeDetailView";
import { Plus, Search, Upload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EmployeeForm } from "@/components/EmployeeForm";
import { CSVEmployeeUploader } from "@/components/CSVEmployeeUploader";
import { useQuery } from "@tanstack/react-query";
import type { Employee } from "@shared/schema";

type ViewMode = "list" | "quick" | "detail";

export default function Employees() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCSVDialogOpen, setIsCSVDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const { data: employees = [], isLoading } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.apellidoPaterno.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (emp.apellidoMaterno?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (emp.rfc?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      emp.numeroEmpleado.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedEmployee = selectedEmployeeId 
    ? employees.find(emp => emp.id === selectedEmployeeId)
    : null;

  const handleViewEmployee = (id: string) => {
    setSelectedEmployeeId(id);
    setViewMode("quick");
  };

  const handleViewDetails = () => {
    setViewMode("detail");
  };

  const handleBackToQuickView = () => {
    setViewMode("quick");
  };

  const handleCloseViews = () => {
    setViewMode("list");
    setSelectedEmployeeId(null);
    setIsEditing(false);
  };

  const handleEditEmployee = (id: string) => {
    setSelectedEmployeeId(id);
    setViewMode("detail");
    setIsEditing(true);
  };

  const handleStartEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleEditSuccess = () => {
    setIsEditing(false);
  };

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
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setIsCSVDialogOpen(true)}
            data-testid="button-import-csv"
          >
            <Upload className="h-4 w-4 mr-2" />
            Importar CSV
          </Button>
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
                onSuccess={() => {
                  setIsDialogOpen(false);
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <CSVEmployeeUploader
        open={isCSVDialogOpen}
        onOpenChange={setIsCSVDialogOpen}
      />

      <EmployeeTable
        employees={filteredEmployees}
        onView={handleViewEmployee}
        onEdit={handleEditEmployee}
        onDelete={(id) => console.log("Delete employee:", id)}
      />

      {/* Vista rápida del empleado */}
      {viewMode === "quick" && selectedEmployee && (
        <EmployeeQuickView
          employee={selectedEmployee}
          onViewDetails={handleViewDetails}
          onClose={handleCloseViews}
        />
      )}

      {/* Vista detallada del empleado */}
      {viewMode === "detail" && selectedEmployee && (
        <EmployeeDetailView
          employee={selectedEmployee}
          onBack={handleBackToQuickView}
          onEdit={handleStartEdit}
          isEditing={isEditing}
          onCancelEdit={handleCancelEdit}
          onSaveSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
}
