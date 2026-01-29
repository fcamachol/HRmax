import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmployeeTable } from "@/components/EmployeeTable";
import { EmployeeQuickView } from "@/components/EmployeeQuickView";
import { EmployeeDetailView } from "@/components/EmployeeDetailView";
import { Plus, Search, Upload, Download, ChevronDown } from "lucide-react";
import Papa from "papaparse";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmployeeForm } from "@/components/EmployeeForm";
import { CSVEmployeeUploader } from "@/components/CSVEmployeeUploader";
import { useQuery } from "@tanstack/react-query";
import { useCliente } from "@/contexts/ClienteContext";
import type { Employee, Empresa } from "@shared/schema";

type ViewMode = "list" | "quick" | "detail";

// Mapeo de campos a encabezados en español para exportación CSV
const CSV_COLUMN_HEADERS: Record<string, string> = {
  id: "ID",
  numeroEmpleado: "Número de Empleado",
  nombre: "Nombre",
  apellidoPaterno: "Apellido Paterno",
  apellidoMaterno: "Apellido Materno",
  genero: "Género",
  fechaNacimiento: "Fecha de Nacimiento",
  curp: "CURP",
  rfc: "RFC",
  nss: "NSS",
  estadoCivil: "Estado Civil",
  calle: "Calle",
  numeroExterior: "Número Exterior",
  numeroInterior: "Número Interior",
  colonia: "Colonia",
  municipio: "Municipio",
  estado: "Estado",
  codigoPostal: "Código Postal",
  telefono: "Teléfono",
  email: "Email",
  correo: "Correo",
  contactoEmergencia: "Contacto de Emergencia",
  parentescoEmergencia: "Parentesco Emergencia",
  telefonoEmergencia: "Teléfono Emergencia",
  banco: "Banco",
  clabe: "CLABE",
  sucursal: "Sucursal",
  cuenta: "Cuenta",
  formaPago: "Forma de Pago",
  periodicidadPago: "Periodicidad de Pago",
  tipoCalculoSalario: "Tipo Cálculo Salario",
  tipoContrato: "Tipo de Contrato",
  fechaIngreso: "Fecha de Ingreso",
  fechaAltaImss: "Fecha Alta IMSS",
  fechaTerminacion: "Fecha de Terminación",
  reconoceAntiguedad: "Reconoce Antigüedad",
  fechaAntiguedad: "Fecha Antigüedad",
  modalidadTrabajo: "Modalidad de Trabajo",
  lugarTrabajo: "Lugar de Trabajo",
  centroTrabajoId: "Centro de Trabajo ID",
  puesto: "Puesto",
  departamento: "Departamento",
  funciones: "Funciones",
  diasLaborales: "Días Laborales",
  horario: "Horario",
  tipoJornada: "Tipo de Jornada",
  tiempoParaAlimentos: "Tiempo para Alimentos",
  diasDescanso: "Días de Descanso",
  salarioBrutoMensual: "Salario Bruto Mensual",
  esquemaPago: "Esquema de Pago",
  tipoEsquema: "Tipo de Esquema",
  salarioDiarioReal: "Salario Diario Real",
  salarioDiarioNominal: "Salario Diario Nominal",
  salarioDiarioExento: "Salario Diario Exento",
  sbc: "SBC",
  sdi: "SDI",
  horasSemanales: "Horas Semanales",
  tablaImss: "Tabla IMSS",
  diasVacacionesAnuales: "Días Vacaciones Anuales",
  diasVacacionesDisponibles: "Días Vacaciones Disponibles",
  diasVacacionesUsados: "Días Vacaciones Usados",
  diasAguinaldoAdicionales: "Días Aguinaldo Adicionales",
  diasVacacionesAdicionales: "Días Vacaciones Adicionales",
  esquemaPrestacionesId: "Esquema Prestaciones ID",
  saldoVacacionesActual: "Saldo Vacaciones Actual",
  creditoInfonavit: "Crédito Infonavit",
  numeroFonacot: "Número Fonacot",
  estatus: "Estatus",
  clienteProyecto: "Cliente/Proyecto",
  observacionesInternas: "Observaciones Internas",
  timezone: "Zona Horaria",
  jefeDirectoId: "Jefe Directo ID",
  empresaId: "Empresa ID",
  registroPatronalId: "Registro Patronal ID",
  documentoContratoId: "Documento Contrato ID",
  createdAt: "Fecha Creación",
  updatedAt: "Fecha Actualización",
  puestoId: "Puesto ID",
  esquemaContratacion: "Esquema Contratación",
  lugarNacimiento: "Lugar de Nacimiento",
  entidadNacimiento: "Entidad de Nacimiento",
  nacionalidad: "Nacionalidad",
  escolaridad: "Escolaridad",
  periodoPrueba: "Periodo de Prueba",
  duracionPrueba: "Duración Prueba",
  diaPago: "Día de Pago",
  grupoNominaId: "Grupo Nómina ID",
  portalActivo: "Portal Activo",
};

export default function Employees() {
  const { clienteId } = useCliente();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCSVDialogOpen, setIsCSVDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [empresaFilter, setEmpresaFilter] = useState<string>("all");
  const [departamentoFilter, setDepartamentoFilter] = useState<string>("all");
  const [puestoFilter, setPuestoFilter] = useState<string>("all");

  const { data: employees = [], isLoading } = useQuery<Employee[]>({
    queryKey: ["/api/employees", { clienteId }],
    queryFn: async () => {
      const res = await fetch(`/api/employees?clienteId=${clienteId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Error al cargar empleados");
      return res.json();
    },
    enabled: !!clienteId,
  });

  const { data: empresas = [] } = useQuery<Empresa[]>({
    queryKey: ["/api/empresas", { clienteId }],
    queryFn: async () => {
      const res = await fetch(`/api/empresas?clienteId=${clienteId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Error al cargar empresas");
      return res.json();
    },
    enabled: !!clienteId,
  });

  const filteredEmployees = employees.filter((emp) => {
    // Apply dropdown filters
    if (empresaFilter !== "all" && emp.empresaId !== empresaFilter) return false;
    if (departamentoFilter !== "all" && emp.departamento !== departamentoFilter) return false;
    if (puestoFilter !== "all" && emp.puesto !== puestoFilter) return false;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        emp.nombre.toLowerCase().includes(query) ||
        emp.apellidoPaterno.toLowerCase().includes(query) ||
        (emp.apellidoMaterno?.toLowerCase() || "").includes(query) ||
        (emp.rfc?.toLowerCase() || "").includes(query) ||
        emp.numeroEmpleado.toLowerCase().includes(query)
      );
    }
    return true;
  });

  // Extract unique values for filters
  const uniqueDepartamentos = [...new Set(employees.map(e => e.departamento).filter(Boolean))].sort();
  const uniquePuestos = [...new Set(employees.map(e => e.puesto).filter(Boolean))].sort();

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

  const handleExportCSV = (exportAll: boolean) => {
    const dataToExport = exportAll ? employees : filteredEmployees;

    if (dataToExport.length === 0) {
      return;
    }

    // Preparar datos con encabezados en español
    const columns = Object.keys(CSV_COLUMN_HEADERS);
    const exportData = dataToExport.map((emp) => {
      const row: Record<string, unknown> = {};
      columns.forEach((col) => {
        const header = CSV_COLUMN_HEADERS[col];
        const value = emp[col as keyof Employee];
        // Convertir valores especiales
        if (value === null || value === undefined) {
          row[header] = "";
        } else if (typeof value === "boolean") {
          row[header] = value ? "Sí" : "No";
        } else if (value instanceof Date) {
          row[header] = value.toISOString().split("T")[0];
        } else {
          row[header] = value;
        }
      });
      return row;
    });

    const csv = Papa.unparse(exportData, {
      header: true,
    });

    // Agregar BOM para soporte de caracteres especiales en Excel
    const bom = "\uFEFF";
    const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `empleados_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" data-testid="button-export-csv">
                <Download className="h-4 w-4 mr-2" />
                Descargar
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => handleExportCSV(false)}
                disabled={filteredEmployees.length === 0}
              >
                Exportar filtrados ({filteredEmployees.length} empleados)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleExportCSV(true)}
                disabled={employees.length === 0}
              >
                Exportar todos ({employees.length} empleados)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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

      {/* Filtros */}
      <div className="flex flex-wrap gap-4">
        <Select value={empresaFilter} onValueChange={setEmpresaFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Empresa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las empresas</SelectItem>
            {empresas.map((emp) => (
              <SelectItem key={emp.id} value={emp.id}>
                {emp.nombreComercial || emp.razonSocial}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={departamentoFilter} onValueChange={setDepartamentoFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Departamento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los departamentos</SelectItem>
            {uniqueDepartamentos.map((dep) => (
              <SelectItem key={dep} value={dep!}>
                {dep}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={puestoFilter} onValueChange={setPuestoFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Puesto" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los puestos</SelectItem>
            {uniquePuestos.map((puesto) => (
              <SelectItem key={puesto} value={puesto!}>
                {puesto}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

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
