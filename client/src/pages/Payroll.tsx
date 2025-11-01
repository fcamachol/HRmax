import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Calculator, Download, Send, Filter, Users, Plus, Trash2, Upload, FileSpreadsheet } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface NominaGroup {
  id: string;
  name: string;
  employeeIds: string[];
  createdAt: Date;
}

interface ConceptValue {
  employeeId: string;
  conceptId: string;
  amount: number;
}

interface Concept {
  id: string;
  name: string;
  type: "percepcion" | "deduccion";
}

export default function Payroll() {
  const { toast } = useToast();
  const [selectedPeriod, setSelectedPeriod] = useState("");
  const [selectedFrequency, setSelectedFrequency] = useState("quincenal");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isCsvUploadOpen, setIsCsvUploadOpen] = useState(false);
  const [isAddConceptOpen, setIsAddConceptOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  
  // New concept form
  const [newConceptName, setNewConceptName] = useState("");
  const [newConceptType, setNewConceptType] = useState<"percepcion" | "deduccion">("percepcion");
  
  // Mock payroll data for multiple employees
  const allEmployees = [
    {
      id: "1",
      name: "María García López",
      rfc: "GACM850101AB1",
      department: "Ventas",
      salary: 15000,
    },
    {
      id: "2",
      name: "Juan Pérez Martínez",
      rfc: "PEXJ900215CD2",
      department: "IT",
      salary: 12000,
    },
    {
      id: "3",
      name: "Ana Martínez Sánchez",
      rfc: "MASA920310EF3",
      department: "RRHH",
      salary: 18000,
    },
    {
      id: "4",
      name: "Carlos López Rodríguez",
      rfc: "LORC880520GH4",
      department: "Finanzas",
      salary: 16000,
    },
    {
      id: "5",
      name: "Laura Hernández Torres",
      rfc: "HETL950705IJ5",
      department: "Operaciones",
      salary: 10000,
    },
    {
      id: "6",
      name: "Roberto Sánchez Villa",
      rfc: "SAVR870830KL6",
      department: "Ventas",
      salary: 13000,
    },
  ];

  // Predefined concepts (like columns in Excel)
  const [concepts, setConcepts] = useState<Concept[]>([
    { id: "bono-productividad", name: "Bono Productividad", type: "percepcion" },
    { id: "comisiones", name: "Comisiones", type: "percepcion" },
    { id: "tiempo-extra", name: "Tiempo Extra", type: "percepcion" },
    { id: "premio-asistencia", name: "Premio Asistencia", type: "percepcion" },
    { id: "faltas", name: "Faltas", type: "deduccion" },
    { id: "retardos", name: "Retardos", type: "deduccion" },
    { id: "prestamo", name: "Préstamo", type: "deduccion" },
  ]);

  // Values for each employee-concept combination
  const [conceptValues, setConceptValues] = useState<ConceptValue[]>([
    { employeeId: "1", conceptId: "bono-productividad", amount: 2500 },
    { employeeId: "2", conceptId: "tiempo-extra", amount: 1200 },
    { employeeId: "5", conceptId: "faltas", amount: 380 },
  ]);

  // TODO: remove mock functionality - this should be stored in backend
  const [nominaGroups, setNominaGroups] = useState<NominaGroup[]>([
    {
      id: "1",
      name: "Equipo de Ventas",
      employeeIds: ["1", "6"],
      createdAt: new Date("2025-01-15"),
    },
    {
      id: "2",
      name: "Administrativos",
      employeeIds: ["3", "4"],
      createdAt: new Date("2025-01-20"),
    },
  ]);

  const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(
    new Set(allEmployees.map(emp => emp.id))
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount);
  };

  const getConceptValue = (employeeId: string, conceptId: string): number => {
    const value = conceptValues.find(
      cv => cv.employeeId === employeeId && cv.conceptId === conceptId
    );
    return value?.amount || 0;
  };

  const updateConceptValue = (employeeId: string, conceptId: string, amount: number) => {
    const existing = conceptValues.find(
      cv => cv.employeeId === employeeId && cv.conceptId === conceptId
    );

    if (existing) {
      if (amount === 0) {
        // Remove if amount is 0
        setConceptValues(conceptValues.filter(
          cv => !(cv.employeeId === employeeId && cv.conceptId === conceptId)
        ));
      } else {
        // Update existing
        setConceptValues(conceptValues.map(cv =>
          cv.employeeId === employeeId && cv.conceptId === conceptId
            ? { ...cv, amount }
            : cv
        ));
      }
    } else if (amount > 0) {
      // Add new
      setConceptValues([...conceptValues, { employeeId, conceptId, amount }]);
    }
  };

  const calculateEmployeePayroll = (employeeId: string) => {
    const employee = allEmployees.find(e => e.id === employeeId);
    if (!employee) return { earnings: 0, deductions: 0, netPay: 0 };

    const employeeValues = conceptValues.filter(cv => cv.employeeId === employeeId);
    
    const bonuses = employeeValues
      .filter(cv => {
        const concept = concepts.find(c => c.id === cv.conceptId);
        return concept?.type === "percepcion";
      })
      .reduce((sum, cv) => sum + cv.amount, 0);
    
    const incidents = employeeValues
      .filter(cv => {
        const concept = concepts.find(c => c.id === cv.conceptId);
        return concept?.type === "deduccion";
      })
      .reduce((sum, cv) => sum + cv.amount, 0);

    const earnings = employee.salary + bonuses;
    const baseDeductions = employee.salary * 0.1888; // ISR + IMSS + Infonavit
    const deductions = baseDeductions + incidents;
    const netPay = earnings - deductions;

    return { earnings, deductions, netPay };
  };

  const filteredEmployees = allEmployees.filter(emp => 
    departmentFilter === "all" || emp.department === departmentFilter
  );

  const employeesToShow = filteredEmployees.map(emp => ({
    ...emp,
    ...calculateEmployeePayroll(emp.id),
  }));

  const selectedEmployeesData = employeesToShow.filter(emp => selectedEmployees.has(emp.id));

  const totalSalary = selectedEmployeesData.reduce((sum, emp) => sum + emp.salary, 0);
  const totalEarnings = selectedEmployeesData.reduce((sum, emp) => sum + emp.earnings, 0);
  const totalDeductions = selectedEmployeesData.reduce((sum, emp) => sum + emp.deductions, 0);
  const totalNetPay = selectedEmployeesData.reduce((sum, emp) => sum + emp.netPay, 0);

  const toggleEmployee = (id: string) => {
    const newSelected = new Set(selectedEmployees);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedEmployees(newSelected);
    setSelectedGroup("");
  };

  const selectAll = () => {
    setSelectedEmployees(new Set(filteredEmployees.map(emp => emp.id)));
    setSelectedGroup("");
  };

  const deselectAll = () => {
    setSelectedEmployees(new Set());
    setSelectedGroup("");
  };

  const loadGroup = (groupId: string) => {
    const group = nominaGroups.find(g => g.id === groupId);
    if (group) {
      setSelectedEmployees(new Set(group.employeeIds));
      setSelectedGroup(groupId);
      toast({
        title: "Grupo cargado",
        description: `${group.name} - ${group.employeeIds.length} empleados seleccionados`,
      });
    }
  };

  const createGroup = () => {
    if (!newGroupName.trim()) {
      toast({
        title: "Error",
        description: "El nombre del grupo es requerido",
        variant: "destructive",
      });
      return;
    }

    if (selectedEmployees.size === 0) {
      toast({
        title: "Error",
        description: "Selecciona al menos un empleado para el grupo",
        variant: "destructive",
      });
      return;
    }

    const newGroup: NominaGroup = {
      id: Date.now().toString(),
      name: newGroupName,
      employeeIds: Array.from(selectedEmployees),
      createdAt: new Date(),
    };

    setNominaGroups([...nominaGroups, newGroup]);
    setNewGroupName("");
    setIsCreateGroupOpen(false);
    
    toast({
      title: "Grupo creado",
      description: `"${newGroup.name}" con ${newGroup.employeeIds.length} empleados`,
    });
  };

  const deleteGroup = (groupId: string) => {
    const group = nominaGroups.find(g => g.id === groupId);
    setNominaGroups(nominaGroups.filter(g => g.id !== groupId));
    if (selectedGroup === groupId) {
      setSelectedGroup("");
    }
    toast({
      title: "Grupo eliminado",
      description: `"${group?.name}" ha sido eliminado`,
    });
  };

  const addConcept = () => {
    if (!newConceptName.trim()) {
      toast({
        title: "Error",
        description: "El nombre del concepto es requerido",
        variant: "destructive",
      });
      return;
    }

    const newConcept: Concept = {
      id: `custom-${Date.now()}`,
      name: newConceptName,
      type: newConceptType,
    };

    setConcepts([...concepts, newConcept]);
    setNewConceptName("");
    setIsAddConceptOpen(false);
    
    toast({
      title: "Concepto agregado",
      description: `"${newConcept.name}" agregado como ${newConcept.type}`,
    });
  };

  const deleteConcept = (conceptId: string) => {
    const concept = concepts.find(c => c.id === conceptId);
    setConcepts(concepts.filter(c => c.id !== conceptId));
    // Also remove all values for this concept
    setConceptValues(conceptValues.filter(cv => cv.conceptId !== conceptId));
    toast({
      title: "Concepto eliminado",
      description: `"${concept?.name}" ha sido eliminado`,
    });
  };

  const handleCsvUpload = () => {
    if (!csvFile) {
      toast({
        title: "Error",
        description: "Selecciona un archivo CSV",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      const newValues: ConceptValue[] = [];

      // Skip header row
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const [employeeId, conceptId, amount] = line.split(',');
        
        if (employeeId && conceptId && amount) {
          newValues.push({
            employeeId: employeeId.trim(),
            conceptId: conceptId.trim(),
            amount: parseFloat(amount.trim()),
          });
        }
      }

      setConceptValues([...conceptValues, ...newValues]);
      setIsCsvUploadOpen(false);
      setCsvFile(null);
      
      toast({
        title: "CSV importado",
        description: `${newValues.length} valores agregados`,
      });
    };

    reader.readAsText(csvFile);
  };

  const downloadCsvTemplate = () => {
    const template = `employeeId,conceptId,amount
1,bono-productividad,2500
2,tiempo-extra,1200
3,faltas,380`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plantilla-incidencias.csv';
    a.click();
  };

  const allSelected = filteredEmployees.every(emp => selectedEmployees.has(emp.id));

  const percepciones = concepts.filter(c => c.type === "percepcion");
  const deducciones = concepts.filter(c => c.type === "deduccion");

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-semibold">Nómina</h1>
          <p className="text-muted-foreground mt-2">
            Selecciona empleados y edita incidencias
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCsvUploadOpen} onOpenChange={setIsCsvUploadOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" data-testid="button-upload-csv">
                <Upload className="h-4 w-4 mr-2" />
                Importar CSV
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Importar Incidencias desde CSV</DialogTitle>
                <DialogDescription>
                  Sube un archivo CSV con valores de incidencias
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="csv-file">Archivo CSV</Label>
                  <Input
                    id="csv-file"
                    type="file"
                    accept=".csv"
                    onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                    data-testid="input-csv-file"
                  />
                </div>
                <div className="rounded-md border p-4 space-y-2">
                  <p className="text-sm font-medium">Formato esperado:</p>
                  <code className="text-xs block bg-muted p-2 rounded">
                    employeeId,conceptId,amount
                  </code>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={downloadCsvTemplate}
                    className="h-auto p-0"
                    data-testid="button-download-template"
                  >
                    <FileSpreadsheet className="h-3 w-3 mr-1" />
                    Descargar plantilla
                  </Button>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCsvUploadOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCsvUpload} data-testid="button-import-csv">
                  Importar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Configuración de Nómina</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="frequency">Frecuencia de Pago</Label>
                <Select value={selectedFrequency} onValueChange={setSelectedFrequency}>
                  <SelectTrigger id="frequency" data-testid="select-frequency">
                    <SelectValue placeholder="Selecciona frecuencia" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="semanal">Semanal</SelectItem>
                    <SelectItem value="quincenal">Quincenal</SelectItem>
                    <SelectItem value="mensual">Mensual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="period">Periodo de Nómina</Label>
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger id="period" data-testid="select-period">
                    <SelectValue placeholder="Selecciona periodo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="current">1-15 Nov 2025</SelectItem>
                    <SelectItem value="prev">16-31 Oct 2025</SelectItem>
                    <SelectItem value="prev2">1-15 Oct 2025</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Filtrar por Depto.</Label>
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger id="department" data-testid="select-department-filter">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="Ventas">Ventas</SelectItem>
                    <SelectItem value="IT">IT</SelectItem>
                    <SelectItem value="RRHH">RRHH</SelectItem>
                    <SelectItem value="Finanzas">Finanzas</SelectItem>
                    <SelectItem value="Operaciones">Operaciones</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="group">Grupos de Nómina</Label>
              <div className="flex gap-2 mt-2">
                <Select value={selectedGroup} onValueChange={loadGroup}>
                  <SelectTrigger id="group" data-testid="select-nomina-group">
                    <SelectValue placeholder="Cargar un grupo..." />
                  </SelectTrigger>
                  <SelectContent>
                    {nominaGroups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        <div className="flex items-center gap-2">
                          <Users className="h-3 w-3" />
                          {group.name} ({group.employeeIds.length})
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Dialog open={isCreateGroupOpen} onOpenChange={setIsCreateGroupOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="icon" data-testid="button-create-group">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Crear Grupo de Nómina</DialogTitle>
                      <DialogDescription>
                        Guarda la selección actual como un grupo reutilizable
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
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
                      <div className="rounded-md border p-4">
                        <p className="text-sm font-medium mb-2">Empleados seleccionados:</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedEmployees.size} empleados en este grupo
                        </p>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsCreateGroupOpen(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={createGroup} data-testid="button-save-group">
                        Guardar Grupo
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              {nominaGroups.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Grupos guardados:</p>
                  <div className="flex flex-wrap gap-2">
                    {nominaGroups.map((group) => (
                      <Badge
                        key={group.id}
                        variant={selectedGroup === group.id ? "default" : "secondary"}
                        className="gap-2"
                      >
                        <Users className="h-3 w-3" />
                        {group.name} ({group.employeeIds.length})
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteGroup(group.id);
                          }}
                          className="ml-1 hover:text-destructive"
                          data-testid={`button-delete-group-${group.id}`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={selectAll}
                data-testid="button-select-all"
              >
                Seleccionar Todos
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={deselectAll}
                data-testid="button-deselect-all"
              >
                Deseleccionar Todos
              </Button>
              <div className="flex-1" />
              <Badge variant="secondary" data-testid="badge-selected-count">
                {selectedEmployees.size} de {allEmployees.length} seleccionados
              </Badge>
            </div>

            <div className="pt-4 border-t">
              <h3 className="text-sm font-semibold mb-4">Tasas Fiscales Aplicadas</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Tasa ISR</p>
                  <p className="font-mono">10.88%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Tasa IMSS</p>
                  <p className="font-mono">5.00%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Tasa Infonavit</p>
                  <p className="font-mono">3.00%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">UMA Diaria</p>
                  <p className="font-mono">$108.57</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumen de Selección</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Empleados Seleccionados</span>
                <span className="font-semibold" data-testid="text-total-employees">
                  {selectedEmployees.size}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Salarios Base</span>
                <span className="font-mono">{formatCurrency(totalSalary)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Percepciones</span>
                <span className="font-mono text-primary">{formatCurrency(totalEarnings)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Deducciones</span>
                <span className="font-mono text-destructive">{formatCurrency(totalDeductions)}</span>
              </div>
              <div className="h-px bg-border my-2" />
              <div className="flex justify-between">
                <span className="font-semibold">Neto Total a Pagar</span>
                <span className="font-mono font-bold text-lg text-primary" data-testid="text-total-net-pay">
                  {formatCurrency(totalNetPay)}
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-4">
              <Button 
                className="w-full" 
                disabled={selectedEmployees.size === 0}
                data-testid="button-calculate"
              >
                <Calculator className="h-4 w-4 mr-2" />
                Calcular Nómina
              </Button>
              <Button 
                className="w-full" 
                variant="outline" 
                disabled={selectedEmployees.size === 0}
                data-testid="button-download"
              >
                <Download className="h-4 w-4 mr-2" />
                Descargar Recibos
              </Button>
              <Button 
                className="w-full"
                disabled={selectedEmployees.size === 0}
                data-testid="button-send"
              >
                <Send className="h-4 w-4 mr-2" />
                Enviar por Email
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
          <CardTitle>Selección de Empleados</CardTitle>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {filteredEmployees.length} empleados
            </span>
          </div>
        </CardHeader>
        <CardContent>
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
                    aria-label="Seleccionar todos"
                    data-testid="checkbox-select-all"
                  />
                </TableHead>
                <TableHead>Empleado</TableHead>
                <TableHead>RFC</TableHead>
                <TableHead>Departamento</TableHead>
                <TableHead className="text-right">Salario Base</TableHead>
                <TableHead className="text-right">Percepciones</TableHead>
                <TableHead className="text-right">Deducciones</TableHead>
                <TableHead className="text-right">Neto a Pagar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employeesToShow.map((employee) => (
                <TableRow 
                  key={employee.id} 
                  data-testid={`row-payroll-${employee.id}`}
                  className={selectedEmployees.has(employee.id) ? "bg-muted/30" : ""}
                >
                  <TableCell>
                    <Checkbox
                      checked={selectedEmployees.has(employee.id)}
                      onCheckedChange={() => toggleEmployee(employee.id)}
                      aria-label={`Seleccionar ${employee.name}`}
                      data-testid={`checkbox-employee-${employee.id}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{employee.name}</TableCell>
                  <TableCell>
                    <span className="font-mono text-sm uppercase tracking-wide">
                      {employee.rfc}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{employee.department}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(employee.salary)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-primary">
                    {formatCurrency(employee.earnings)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-destructive">
                    {formatCurrency(employee.deductions)}
                  </TableCell>
                  <TableCell className="text-right font-mono font-semibold">
                    {formatCurrency(employee.netPay)}
                  </TableCell>
                </TableRow>
              ))}
              {selectedEmployeesData.length > 0 && (
                <TableRow className="font-semibold bg-muted/50">
                  <TableCell></TableCell>
                  <TableCell colSpan={3}>TOTALES ({selectedEmployees.size} empleados)</TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(totalSalary)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-primary">
                    {formatCurrency(totalEarnings)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-destructive">
                    {formatCurrency(totalDeductions)}
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold text-lg">
                    {formatCurrency(totalNetPay)}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedEmployees.size > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
            <div>
              <CardTitle>Incidencias - Edición Rápida</CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                Edita percepciones y deducciones en formato Excel
              </p>
            </div>
            <Dialog open={isAddConceptOpen} onOpenChange={setIsAddConceptOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" data-testid="button-add-concept">
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Concepto
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Agregar Nuevo Concepto</DialogTitle>
                  <DialogDescription>
                    Crea una nueva columna para registrar percepciones o deducciones
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="concept-name">Nombre del Concepto</Label>
                    <Input
                      id="concept-name"
                      placeholder="ej. Vales de Despensa"
                      value={newConceptName}
                      onChange={(e) => setNewConceptName(e.target.value)}
                      data-testid="input-concept-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="concept-type">Tipo</Label>
                    <Select value={newConceptType} onValueChange={(v) => setNewConceptType(v as "percepcion" | "deduccion")}>
                      <SelectTrigger id="concept-type" data-testid="select-concept-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percepcion">Percepción (suma al salario)</SelectItem>
                        <SelectItem value="deduccion">Deducción (resta del salario)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddConceptOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={addConcept} data-testid="button-save-concept">
                    Agregar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 bg-background z-10 min-w-48">Empleado</TableHead>
                    {percepciones.map((concept) => (
                      <TableHead key={concept.id} className="text-right min-w-36">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs text-primary">{concept.name}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => deleteConcept(concept.id)}
                            data-testid={`button-delete-concept-${concept.id}`}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableHead>
                    ))}
                    {deducciones.map((concept) => (
                      <TableHead key={concept.id} className="text-right min-w-36">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs text-destructive">{concept.name}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => deleteConcept(concept.id)}
                            data-testid={`button-delete-concept-${concept.id}`}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedEmployeesData.map((employee) => (
                    <TableRow key={employee.id} data-testid={`row-incidencia-grid-${employee.id}`}>
                      <TableCell className="sticky left-0 bg-background z-10 font-medium">
                        {employee.name}
                      </TableCell>
                      {percepciones.map((concept) => (
                        <TableCell key={concept.id} className="text-right">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            className="text-right font-mono"
                            value={getConceptValue(employee.id, concept.id) || ""}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value) || 0;
                              updateConceptValue(employee.id, concept.id, value);
                            }}
                            data-testid={`input-${employee.id}-${concept.id}`}
                          />
                        </TableCell>
                      ))}
                      {deducciones.map((concept) => (
                        <TableCell key={concept.id} className="text-right">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            className="text-right font-mono"
                            value={getConceptValue(employee.id, concept.id) || ""}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value) || 0;
                              updateConceptValue(employee.id, concept.id, value);
                            }}
                            data-testid={`input-${employee.id}-${concept.id}`}
                          />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
