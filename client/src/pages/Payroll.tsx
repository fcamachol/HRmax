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
import { 
  Calculator, 
  Download, 
  Send, 
  Filter, 
  Users, 
  Plus, 
  Trash2, 
  Upload, 
  FileSpreadsheet,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye
} from "lucide-react";
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

interface Nomina {
  id: string;
  type: "ordinaria" | "extraordinaria";
  period: string;
  frequency: string;
  extraordinaryType?: string;
  employeeIds: string[];
  status: "draft" | "calculated" | "approved" | "paid";
  createdAt: Date;
  totalNet: number;
  employeeCount: number;
}

export default function Payroll() {
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<"list" | "create">("list");
  const [currentStep, setCurrentStep] = useState(0);
  
  // Form state
  const [nominaType, setNominaType] = useState<"ordinaria" | "extraordinaria">("ordinaria");
  const [extraordinaryType, setExtraordinaryType] = useState("");
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

  // Existing nominas
  const [nominas, setNominas] = useState<Nomina[]>([
    {
      id: "1",
      type: "ordinaria",
      period: "1-15 Nov 2025",
      frequency: "quincenal",
      employeeIds: ["1", "2", "3", "4", "5", "6"],
      status: "paid",
      createdAt: new Date("2025-11-15"),
      totalNet: 87430,
      employeeCount: 6,
    },
    {
      id: "2",
      type: "extraordinaria",
      period: "Aguinaldo 2025",
      frequency: "extraordinaria",
      extraordinaryType: "aguinaldo",
      employeeIds: ["1", "2", "3", "4", "5", "6"],
      status: "paid",
      createdAt: new Date("2025-12-15"),
      totalNet: 124500,
      employeeCount: 6,
    },
    {
      id: "3",
      type: "ordinaria",
      period: "16-31 Oct 2025",
      frequency: "quincenal",
      employeeIds: ["1", "2", "3", "4", "5", "6"],
      status: "paid",
      createdAt: new Date("2025-10-31"),
      totalNet: 85200,
      employeeCount: 6,
    },
    {
      id: "4",
      type: "extraordinaria",
      period: "Bono Productividad Q3",
      frequency: "extraordinaria",
      extraordinaryType: "bono",
      employeeIds: ["1", "6"],
      status: "approved",
      createdAt: new Date("2025-09-30"),
      totalNet: 35000,
      employeeCount: 2,
    },
    {
      id: "5",
      type: "ordinaria",
      period: "1-15 Oct 2025",
      frequency: "quincenal",
      employeeIds: ["1", "2", "3", "4"],
      status: "approved",
      createdAt: new Date("2025-10-15"),
      totalNet: 58100,
      employeeCount: 4,
    },
  ]);

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

  const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(new Set());

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
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
        setConceptValues(conceptValues.filter(
          cv => !(cv.employeeId === employeeId && cv.conceptId === conceptId)
        ));
      } else {
        setConceptValues(conceptValues.map(cv =>
          cv.employeeId === employeeId && cv.conceptId === conceptId
            ? { ...cv, amount }
            : cv
        ));
      }
    } else if (amount > 0) {
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
    const baseDeductions = employee.salary * 0.1888;
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
    setConceptValues(conceptValues.filter(cv => cv.conceptId !== conceptId));
    toast({
      title: "Concepto eliminado",
      description: `"${concept?.name}" ha sido eliminado`,
    });
  };

  const startNewNomina = () => {
    setViewMode("create");
    setCurrentStep(0);
    setSelectedEmployees(new Set());
    setNominaType("ordinaria");
    setExtraordinaryType("");
    setSelectedPeriod("");
    setConceptValues([]);
  };

  const cancelNomina = () => {
    setViewMode("list");
    setCurrentStep(0);
    setSelectedEmployees(new Set());
    setNominaType("ordinaria");
    setExtraordinaryType("");
    setSelectedPeriod("");
  };

  const createNomina = () => {
    const newNomina: Nomina = {
      id: Date.now().toString(),
      type: nominaType,
      period: nominaType === "ordinaria" ? selectedPeriod : extraordinaryType,
      frequency: nominaType === "ordinaria" ? selectedFrequency : "extraordinaria",
      extraordinaryType: nominaType === "extraordinaria" ? extraordinaryType : undefined,
      employeeIds: Array.from(selectedEmployees),
      status: "draft",
      createdAt: new Date(),
      totalNet: totalNetPay,
      employeeCount: selectedEmployees.size,
    };

    setNominas([newNomina, ...nominas]);
    setViewMode("list");
    setCurrentStep(0);
    
    toast({
      title: "Nómina creada",
      description: `Nómina ${nominaType} para ${selectedEmployees.size} empleados - ${formatCurrency(totalNetPay)}`,
    });
  };

  const nextStep = () => {
    if (currentStep === 0 && selectedEmployees.size === 0) {
      toast({
        title: "Error",
        description: "Selecciona al menos un empleado",
        variant: "destructive",
      });
      return;
    }
    setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const getStatusIcon = (status: Nomina["status"]) => {
    switch (status) {
      case "draft":
        return <Clock className="h-4 w-4 text-muted-foreground" />;
      case "calculated":
        return <Calculator className="h-4 w-4 text-blue-500" />;
      case "approved":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "paid":
        return <CheckCircle2 className="h-4 w-4 text-primary" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: Nomina["status"]) => {
    const variants = {
      draft: "secondary" as const,
      calculated: "outline" as const,
      approved: "default" as const,
      paid: "default" as const,
    };

    const labels = {
      draft: "Borrador",
      calculated: "Calculada",
      approved: "Aprobada",
      paid: "Pagada",
    };

    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  const allSelected = filteredEmployees.every(emp => selectedEmployees.has(emp.id));
  const percepciones = concepts.filter(c => c.type === "percepcion");
  const deducciones = concepts.filter(c => c.type === "deduccion");

  if (viewMode === "list") {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-semibold">Nóminas</h1>
            <p className="text-muted-foreground mt-2">
              Gestiona y procesa las nóminas de tu empresa
            </p>
          </div>
          <Button onClick={startNewNomina} data-testid="button-new-nomina">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Nómina
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Historial de Nóminas</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Periodo</TableHead>
                  <TableHead>Frecuencia</TableHead>
                  <TableHead>Empleados</TableHead>
                  <TableHead className="text-right">Monto Neto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {nominas.map((nomina) => (
                  <TableRow key={nomina.id} data-testid={`row-nomina-${nomina.id}`}>
                    <TableCell>
                      <Badge variant={nomina.type === "extraordinaria" ? "default" : "outline"}>
                        {nomina.type === "extraordinaria" ? "Extraordinaria" : "Ordinaria"}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{nomina.period}</TableCell>
                    <TableCell className="capitalize">{nomina.frequency}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {nomina.employeeCount}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold">
                      {formatCurrency(nomina.totalNet)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(nomina.status)}
                        {getStatusBadge(nomina.status)}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(nomina.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" data-testid={`button-view-nomina-${nomina.id}`}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Create mode with tabs
  const steps = [
    { id: 0, name: "Empleados", description: "Selecciona empleados o grupo" },
    { id: 1, name: "Incidencias", description: "Agrega bonos y deducciones" },
    { id: 2, name: "Resumen", description: "Revisa y crea la nómina" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-semibold">Nueva Nómina</h1>
          <p className="text-muted-foreground mt-2">
            Sigue los pasos para crear una nueva nómina
          </p>
        </div>
        <Button variant="outline" onClick={cancelNomina} data-testid="button-cancel">
          Cancelar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <Tabs value={currentStep.toString()} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              {steps.map((step) => (
                <TabsTrigger
                  key={step.id}
                  value={step.id.toString()}
                  disabled={step.id > currentStep}
                  onClick={() => step.id < currentStep && setCurrentStep(step.id)}
                  data-testid={`tab-step-${step.id}`}
                >
                  <div className="flex flex-col items-start gap-1">
                    <span className="font-semibold">{step.name}</span>
                    <span className="text-xs text-muted-foreground">{step.description}</span>
                  </div>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="min-h-96">
          {currentStep === 0 && (
            <div className="space-y-6">
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nomina-type">Tipo de Nómina</Label>
                  <Select value={nominaType} onValueChange={(v) => setNominaType(v as "ordinaria" | "extraordinaria")}>
                    <SelectTrigger id="nomina-type" data-testid="select-nomina-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ordinaria">Ordinaria</SelectItem>
                      <SelectItem value="extraordinaria">Extraordinaria</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {nominaType === "ordinaria" ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="frequency">Frecuencia de Pago</Label>
                      <Select value={selectedFrequency} onValueChange={setSelectedFrequency}>
                        <SelectTrigger id="frequency" data-testid="select-frequency">
                          <SelectValue />
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
                          <SelectItem value="16-30 Nov 2025">16-30 Nov 2025</SelectItem>
                          <SelectItem value="1-15 Nov 2025">1-15 Nov 2025</SelectItem>
                          <SelectItem value="16-31 Oct 2025">16-31 Oct 2025</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="extraordinary-type">Tipo de Pago Extraordinario</Label>
                      <Select value={extraordinaryType} onValueChange={setExtraordinaryType}>
                        <SelectTrigger id="extraordinary-type" data-testid="select-extraordinary-type">
                          <SelectValue placeholder="Selecciona tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="aguinaldo">Aguinaldo</SelectItem>
                          <SelectItem value="ptu">Reparto de Utilidades (PTU)</SelectItem>
                          <SelectItem value="bono">Bono Especial</SelectItem>
                          <SelectItem value="prima-vacacional">Prima Vacacional</SelectItem>
                          <SelectItem value="finiquito">Finiquito</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="extraordinary-description">Descripción</Label>
                      <Input
                        id="extraordinary-description"
                        placeholder="ej. Aguinaldo 2025"
                        value={selectedPeriod}
                        onChange={(e) => setSelectedPeriod(e.target.value)}
                        data-testid="input-extraordinary-description"
                      />
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label htmlFor="department">Filtrar por Depto.</Label>
                  <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                    <SelectTrigger id="department" data-testid="select-department-filter">
                      <SelectValue />
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
                        data-testid="checkbox-select-all"
                      />
                    </TableHead>
                    <TableHead>Empleado</TableHead>
                    <TableHead>RFC</TableHead>
                    <TableHead>Departamento</TableHead>
                    <TableHead className="text-right">Salario Base</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employeesToShow.map((employee) => (
                    <TableRow 
                      key={employee.id}
                      className={selectedEmployees.has(employee.id) ? "bg-muted/30" : ""}
                      data-testid={`row-employee-${employee.id}`}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedEmployees.has(employee.id)}
                          onCheckedChange={() => toggleEmployee(employee.id)}
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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold">Edición de Incidencias</h3>
                  <p className="text-sm text-muted-foreground">
                    Agrega percepciones y deducciones para {selectedEmployees.size} empleados
                  </p>
                </div>
                <div className="flex gap-2">
                  <Dialog open={isCsvUploadOpen} onOpenChange={setIsCsvUploadOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" data-testid="button-upload-csv">
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
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCsvUploadOpen(false)}>
                          Cancelar
                        </Button>
                        <Button data-testid="button-import-csv">
                          Importar
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
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
                              <SelectItem value="percepcion">Percepción</SelectItem>
                              <SelectItem value="deduccion">Deducción</SelectItem>
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
                </div>
              </div>

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
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold">Resumen de Nómina</h3>
                <p className="text-sm text-muted-foreground">
                  Revisa los totales antes de crear la nómina
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Información General</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tipo de Nómina</span>
                      <Badge variant={nominaType === "extraordinaria" ? "default" : "outline"}>
                        {nominaType === "extraordinaria" ? "Extraordinaria" : "Ordinaria"}
                      </Badge>
                    </div>
                    {nominaType === "ordinaria" ? (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Periodo</span>
                          <span className="font-medium">{selectedPeriod}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Frecuencia</span>
                          <span className="font-medium capitalize">{selectedFrequency}</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Tipo</span>
                          <span className="font-medium capitalize">{extraordinaryType}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Descripción</span>
                          <span className="font-medium">{selectedPeriod}</span>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Empleados</span>
                      <span className="font-medium">{selectedEmployees.size}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Totales</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Salarios Base</span>
                      <span className="font-mono">{formatCurrency(totalSalary)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Percepciones</span>
                      <span className="font-mono text-primary">{formatCurrency(totalEarnings)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Deducciones</span>
                      <span className="font-mono text-destructive">{formatCurrency(totalDeductions)}</span>
                    </div>
                    <div className="h-px bg-border" />
                    <div className="flex justify-between">
                      <span className="font-semibold">Neto Total</span>
                      <span className="font-mono font-bold text-lg text-primary">
                        {formatCurrency(totalNetPay)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Detalle por Empleado</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Empleado</TableHead>
                        <TableHead className="text-right">Salario Base</TableHead>
                        <TableHead className="text-right">Percepciones</TableHead>
                        <TableHead className="text-right">Deducciones</TableHead>
                        <TableHead className="text-right">Neto a Pagar</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedEmployeesData.map((employee) => (
                        <TableRow key={employee.id}>
                          <TableCell className="font-medium">{employee.name}</TableCell>
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
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
        <div className="border-t p-6 flex justify-between">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0}
            data-testid="button-prev-step"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Anterior
          </Button>
          {currentStep < 2 ? (
            <Button onClick={nextStep} data-testid="button-next-step">
              Siguiente
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={createNomina} data-testid="button-create-nomina">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Crear Nómina
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
