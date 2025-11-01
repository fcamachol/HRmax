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
import { Calculator, Download, Send, Filter, Users, Plus, Trash2, Upload, FileSpreadsheet, Edit } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface NominaGroup {
  id: string;
  name: string;
  employeeIds: string[];
  createdAt: Date;
}

interface Incidencia {
  id: string;
  employeeId: string;
  type: "percepcion" | "deduccion";
  concept: string;
  amount: number;
  description: string;
  date: Date;
}

export default function Payroll() {
  const { toast } = useToast();
  const [selectedPeriod, setSelectedPeriod] = useState("");
  const [selectedFrequency, setSelectedFrequency] = useState("quincenal");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isIncidenciasOpen, setIsIncidenciasOpen] = useState(false);
  const [isCsvUploadOpen, setIsCsvUploadOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  
  // Incidencia form state
  const [incidenciaEmployeeId, setIncidenciaEmployeeId] = useState("");
  const [incidenciaType, setIncidenciaType] = useState<"percepcion" | "deduccion">("percepcion");
  const [incidenciaConcept, setIncidenciaConcept] = useState("");
  const [incidenciaAmount, setIncidenciaAmount] = useState("");
  const [incidenciaDescription, setIncidenciaDescription] = useState("");
  
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

  const [incidencias, setIncidencias] = useState<Incidencia[]>([
    {
      id: "1",
      employeeId: "1",
      type: "percepcion",
      concept: "Bono de Productividad",
      amount: 2500,
      description: "Cumplimiento de meta mensual",
      date: new Date("2025-11-01"),
    },
    {
      id: "2",
      employeeId: "2",
      type: "percepcion",
      concept: "Tiempo Extra",
      amount: 1200,
      description: "4 horas extras",
      date: new Date("2025-11-01"),
    },
    {
      id: "3",
      employeeId: "5",
      type: "deduccion",
      concept: "Falta",
      amount: 380,
      description: "1 día de ausencia injustificada",
      date: new Date("2025-11-01"),
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

  const calculateEmployeePayroll = (employeeId: string) => {
    const employee = allEmployees.find(e => e.id === employeeId);
    if (!employee) return { earnings: 0, deductions: 0, netPay: 0 };

    const employeeIncidencias = incidencias.filter(inc => inc.employeeId === employeeId);
    
    const bonuses = employeeIncidencias
      .filter(inc => inc.type === "percepcion")
      .reduce((sum, inc) => sum + inc.amount, 0);
    
    const incidents = employeeIncidencias
      .filter(inc => inc.type === "deduccion")
      .reduce((sum, inc) => sum + inc.amount, 0);

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

  const addIncidencia = () => {
    if (!incidenciaEmployeeId || !incidenciaConcept || !incidenciaAmount) {
      toast({
        title: "Error",
        description: "Todos los campos son requeridos",
        variant: "destructive",
      });
      return;
    }

    const newIncidencia: Incidencia = {
      id: Date.now().toString(),
      employeeId: incidenciaEmployeeId,
      type: incidenciaType,
      concept: incidenciaConcept,
      amount: parseFloat(incidenciaAmount),
      description: incidenciaDescription,
      date: new Date(),
    };

    setIncidencias([...incidencias, newIncidencia]);
    
    // Reset form
    setIncidenciaEmployeeId("");
    setIncidenciaConcept("");
    setIncidenciaAmount("");
    setIncidenciaDescription("");
    
    toast({
      title: "Incidencia agregada",
      description: `${incidenciaType === "percepcion" ? "Bono" : "Deducción"} de ${formatCurrency(newIncidencia.amount)}`,
    });
  };

  const deleteIncidencia = (id: string) => {
    setIncidencias(incidencias.filter(inc => inc.id !== id));
    toast({
      title: "Incidencia eliminada",
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
      const newIncidencias: Incidencia[] = [];

      // Skip header row
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const [employeeId, type, concept, amount, description] = line.split(',');
        
        if (employeeId && type && concept && amount) {
          newIncidencias.push({
            id: `csv-${Date.now()}-${i}`,
            employeeId: employeeId.trim(),
            type: type.trim().toLowerCase() as "percepcion" | "deduccion",
            concept: concept.trim(),
            amount: parseFloat(amount.trim()),
            description: description?.trim() || "",
            date: new Date(),
          });
        }
      }

      setIncidencias([...incidencias, ...newIncidencias]);
      setIsCsvUploadOpen(false);
      setCsvFile(null);
      
      toast({
        title: "CSV importado",
        description: `${newIncidencias.length} incidencias agregadas`,
      });
    };

    reader.readAsText(csvFile);
  };

  const downloadCsvTemplate = () => {
    const template = `employeeId,type,concept,amount,description
1,percepcion,Bono de Productividad,2500,Cumplimiento de meta
2,percepcion,Tiempo Extra,1200,4 horas extras
3,deduccion,Falta,380,Ausencia injustificada`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plantilla-incidencias.csv';
    a.click();
  };

  const allSelected = filteredEmployees.every(emp => selectedEmployees.has(emp.id));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-semibold">Nómina</h1>
          <p className="text-muted-foreground mt-2">
            Selecciona empleados y procesa la nómina
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
                  Sube un archivo CSV con bonos y deducciones
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
                    employeeId,type,concept,amount,description
                  </code>
                  <p className="text-xs text-muted-foreground">
                    type: "percepcion" o "deduccion"
                  </p>
                  <Button 
                    variant="link" 
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
          <Dialog open={isIncidenciasOpen} onOpenChange={setIsIncidenciasOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-incidencia">
                <Plus className="h-4 w-4 mr-2" />
                Agregar Incidencia
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Gestión de Incidencias</DialogTitle>
                <DialogDescription>
                  Agrega bonos, comisiones, tiempo extra, faltas y otras incidencias
                </DialogDescription>
              </DialogHeader>
              <Tabs defaultValue="add" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="add">Agregar Nueva</TabsTrigger>
                  <TabsTrigger value="list">Ver Incidencias ({incidencias.length})</TabsTrigger>
                </TabsList>
                <TabsContent value="add" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="employee">Empleado</Label>
                      <Select value={incidenciaEmployeeId} onValueChange={setIncidenciaEmployeeId}>
                        <SelectTrigger id="employee" data-testid="select-incidencia-employee">
                          <SelectValue placeholder="Selecciona empleado" />
                        </SelectTrigger>
                        <SelectContent>
                          {allEmployees.map((emp) => (
                            <SelectItem key={emp.id} value={emp.id}>
                              {emp.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="type">Tipo</Label>
                      <Select value={incidenciaType} onValueChange={(v) => setIncidenciaType(v as "percepcion" | "deduccion")}>
                        <SelectTrigger id="type" data-testid="select-incidencia-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percepcion">Percepción (Bono/Extra)</SelectItem>
                          <SelectItem value="deduccion">Deducción (Falta/Descuento)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="concept">Concepto</Label>
                      <Input
                        id="concept"
                        placeholder="ej. Bono de Productividad"
                        value={incidenciaConcept}
                        onChange={(e) => setIncidenciaConcept(e.target.value)}
                        data-testid="input-incidencia-concept"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="amount">Monto</Label>
                      <Input
                        id="amount"
                        type="number"
                        placeholder="0.00"
                        value={incidenciaAmount}
                        onChange={(e) => setIncidenciaAmount(e.target.value)}
                        data-testid="input-incidencia-amount"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Descripción (opcional)</Label>
                    <Input
                      id="description"
                      placeholder="ej. Cumplimiento de meta mensual"
                      value={incidenciaDescription}
                      onChange={(e) => setIncidenciaDescription(e.target.value)}
                      data-testid="input-incidencia-description"
                    />
                  </div>
                  <Button onClick={addIncidencia} className="w-full" data-testid="button-save-incidencia">
                    Agregar Incidencia
                  </Button>
                </TabsContent>
                <TabsContent value="list" className="space-y-2">
                  <div className="max-h-96 overflow-y-auto space-y-2">
                    {incidencias.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        No hay incidencias registradas
                      </p>
                    ) : (
                      incidencias.map((inc) => {
                        const employee = allEmployees.find(e => e.id === inc.employeeId);
                        return (
                          <div key={inc.id} className="flex items-start justify-between p-3 border rounded-md">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-sm">{employee?.name}</p>
                                <Badge variant={inc.type === "percepcion" ? "default" : "destructive"}>
                                  {inc.type === "percepcion" ? "Percepción" : "Deducción"}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">{inc.concept}</p>
                              {inc.description && (
                                <p className="text-xs text-muted-foreground mt-1">{inc.description}</p>
                              )}
                              <p className="font-mono font-semibold text-sm mt-2">
                                {formatCurrency(inc.amount)}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteIncidencia(inc.id)}
                              data-testid={`button-delete-incidencia-${inc.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </TabsContent>
              </Tabs>
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
              {incidencias.length > 0 && (
                <Badge variant="outline" data-testid="badge-incidencias-count">
                  <Edit className="h-3 w-3 mr-1" />
                  {incidencias.length} incidencias
                </Badge>
              )}
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
              {employeesToShow.map((employee) => {
                const employeeIncidencias = incidencias.filter(inc => inc.employeeId === employee.id);
                return (
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
                    <TableCell>
                      <div>
                        <p className="font-medium">{employee.name}</p>
                        {employeeIncidencias.length > 0 && (
                          <p className="text-xs text-muted-foreground">
                            {employeeIncidencias.length} incidencia{employeeIncidencias.length > 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                    </TableCell>
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
                );
              })}
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
    </div>
  );
}
