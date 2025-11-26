import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
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
  Eye,
  ChevronDown,
  ChevronRight
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { GrupoNomina, Employee, IncidenciaAsistencia } from "@shared/schema";
import { CreateGrupoNominaDialog } from "@/components/CreateGrupoNominaDialog";
import { IncidenciasAsistenciaGrid } from "@/components/IncidenciasAsistenciaGrid";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays } from "date-fns";

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
  status: "draft" | "pre_nomina" | "approved" | "paid";
  createdAt: Date;
  totalNet: number;
  employeeCount: number;
  editable?: boolean;
}

export default function Payroll() {
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<"list" | "create">("list");
  const [currentStep, setCurrentStep] = useState(0);
  
  // Fetch grupos de nómina from API
  const { data: gruposNomina = [] } = useQuery<GrupoNomina[]>({
    queryKey: ["/api/grupos-nomina"],
  });

  // Fetch real employees from API
  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  // Form state
  const [nominaType, setNominaType] = useState<"ordinaria" | "extraordinaria">("ordinaria");
  const [extraordinaryType, setExtraordinaryType] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("");
  const [selectedFrequency, setSelectedFrequency] = useState("quincenal");

  // Calculate period range using useMemo
  const queryPeriodRange = useMemo(() => {
    const today = new Date();
    
    // Helper function
    const getDefaultRange = (freq: string): { start: string; end: string } => {
      if (freq === "semanal") {
        return {
          start: format(startOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd"),
          end: format(endOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd"),
        };
      } else if (freq === "quincenal") {
        const day = today.getDate();
        if (day <= 15) {
          return {
            start: format(new Date(today.getFullYear(), today.getMonth(), 1), "yyyy-MM-dd"),
            end: format(new Date(today.getFullYear(), today.getMonth(), 15), "yyyy-MM-dd"),
          };
        } else {
          return {
            start: format(new Date(today.getFullYear(), today.getMonth(), 16), "yyyy-MM-dd"),
            end: format(endOfMonth(today), "yyyy-MM-dd"),
          };
        }
      } else {
        return {
          start: format(startOfMonth(today), "yyyy-MM-dd"),
          end: format(endOfMonth(today), "yyyy-MM-dd"),
        };
      }
    };

    if (!selectedPeriod) {
      return getDefaultRange(selectedFrequency);
    }
    
    // Parse period string like "1-15 Nov 2025" or "16-30 Nov 2025"
    const periodMatch = selectedPeriod.match(/(\d+)-(\d+)\s+(\w+)\s+(\d+)/);
    if (periodMatch) {
      const [, startDayStr, endDayStr, monthStr, yearStr] = periodMatch;
      const monthMap: Record<string, string> = {
        'Ene': '01', 'Feb': '02', 'Mar': '03', 'Abr': '04',
        'May': '05', 'Jun': '06', 'Jul': '07', 'Ago': '08',
        'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dic': '12'
      };
      const startDay = parseInt(startDayStr);
      const endDay = parseInt(endDayStr);
      const month = monthMap[monthStr];
      const year = parseInt(yearStr);
      
      if (startDay > endDay) {
        const endDate = new Date(year, parseInt(month) - 1, endDay);
        const startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 6);
        return {
          start: format(startDate, "yyyy-MM-dd"),
          end: format(endDate, "yyyy-MM-dd"),
        };
      }
      
      return {
        start: `${year}-${month}-${startDayStr.padStart(2, '0')}`,
        end: `${year}-${month}-${endDayStr.padStart(2, '0')}`,
      };
    }
    
    return getDefaultRange(selectedFrequency);
  }, [selectedPeriod, selectedFrequency]);

  // Fetch incidencias de asistencia from API filtered by period
  const { data: incidenciasAsistencia = [] } = useQuery<IncidenciaAsistencia[]>({
    queryKey: ["/api/incidencias-asistencia", { fechaInicio: queryPeriodRange.start, fechaFin: queryPeriodRange.end }],
    queryFn: async ({ queryKey }) => {
      const [path, params] = queryKey as [string, { fechaInicio: string; fechaFin: string }];
      const searchParams = new URLSearchParams();
      searchParams.append("fechaInicio", params.fechaInicio);
      searchParams.append("fechaFin", params.fechaFin);
      const url = `${path}?${searchParams.toString()}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }
      return res.json();
    },
  });
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isCsvUploadOpen, setIsCsvUploadOpen] = useState(false);
  const [isAddConceptOpen, setIsAddConceptOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  
  // New concept form
  const [newConceptName, setNewConceptName] = useState("");
  const [newConceptType, setNewConceptType] = useState<"percepcion" | "deduccion">("percepcion");
  
  // Expandable incidencias columns
  const [expandedConcepts, setExpandedConcepts] = useState<Set<string>>(new Set());
  
  // Transform API employees to format needed by the component
  const allEmployees = employees.map(emp => ({
    id: emp.id!,
    name: `${emp.nombre} ${emp.apellidoPaterno} ${emp.apellidoMaterno || ''}`.trim(),
    rfc: emp.rfc || '',
    department: emp.departamento,
    salary: parseFloat(emp.salarioBrutoMensual || '0'),
  }));

  // Existing nominas (will be populated from API in the future)
  const [nominas, setNominas] = useState<Nomina[]>([]);

  // Predefined concepts (like columns in Excel)
  const [concepts, setConcepts] = useState<Concept[]>([
    { id: "bono-productividad", name: "Bono Productividad", type: "percepcion" },
    { id: "comisiones", name: "Comisiones", type: "percepcion" },
    { id: "tiempo-extra", name: "Tiempo Extra", type: "percepcion" },
    { id: "premio-asistencia", name: "Premio Asistencia", type: "percepcion" },
    { id: "vacaciones", name: "Vacaciones", type: "percepcion" },
    { id: "prima-vacacional", name: "Prima Vacacional (25%)", type: "percepcion" },
    { id: "faltas", name: "Faltas", type: "deduccion" },
    { id: "retardos", name: "Retardos", type: "deduccion" },
    { id: "prestamo", name: "Préstamo", type: "deduccion" },
  ]);

  // Values for each employee-concept combination
  const [conceptValues, setConceptValues] = useState<ConceptValue[]>([]);


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

  const getEmployeeConceptBreakdown = (employeeId: string) => {
    const employeeValues = conceptValues.filter(cv => cv.employeeId === employeeId);
    
    const percepciones = employeeValues
      .filter(cv => {
        const concept = concepts.find(c => c.id === cv.conceptId);
        return concept?.type === "percepcion";
      })
      .map(cv => {
        const concept = concepts.find(c => c.id === cv.conceptId);
        return {
          id: cv.conceptId,
          name: concept?.name || "",
          amount: cv.amount,
        };
      });
    
    const deducciones = employeeValues
      .filter(cv => {
        const concept = concepts.find(c => c.id === cv.conceptId);
        return concept?.type === "deduccion";
      })
      .map(cv => {
        const concept = concepts.find(c => c.id === cv.conceptId);
        return {
          id: cv.conceptId,
          name: concept?.name || "",
          amount: cv.amount,
        };
      });
    
    return { percepciones, deducciones };
  };

  const calculateEmployeePayroll = (employeeId: string) => {
    const employee = allEmployees.find(e => e.id === employeeId);
    if (!employee) return { 
      baseSalary: 0,
      primaDominical: 0,
      earnings: 0, 
      deductions: 0, 
      netPay: 0,
      daysWorked: 0,
      periodDays: 0,
      absences: 0,
      incapacities: 0,
      diasDomingo: 0
    };

    // Calcular días del periodo según frecuencia
    const periodDays = selectedFrequency === "semanal" ? 7 
                     : selectedFrequency === "quincenal" ? 15 
                     : 30;

    // Contar incidencias del empleado en el periodo (ya filtradas por la query)
    const employeeIncidencias = incidenciasAsistencia.filter(inc => 
      inc.employeeId === employeeId
    );

    const totalAbsences = employeeIncidencias.reduce((sum, inc) => sum + (inc.faltas || 0), 0);
    const totalIncapacities = employeeIncidencias.reduce((sum, inc) => sum + (inc.incapacidades || 0), 0);
    const totalDiasDomingo = employeeIncidencias.reduce((sum, inc) => sum + (inc.diasDomingo || 0), 0);
    
    // Calcular días trabajados
    const daysWorked = Math.max(0, periodDays - totalAbsences - totalIncapacities);
    
    // Calcular salario proporcional
    const baseSalary = (employee.salary / 30) * daysWorked;
    
    // Calcular prima dominical (25% del salario diario por cada domingo trabajado)
    const salarioDiario = employee.salary / 30;
    const primaDominical = salarioDiario * 0.25 * totalDiasDomingo;

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

    const earnings = baseSalary + primaDominical + bonuses;
    const baseDeductions = baseSalary * 0.1888; // Aplicar deducciones sobre salario proporcional
    const deductions = baseDeductions + incidents;
    const netPay = earnings - deductions;

    return { 
      baseSalary,
      primaDominical,
      earnings, 
      deductions, 
      netPay,
      daysWorked,
      periodDays,
      absences: totalAbsences,
      incapacities: totalIncapacities,
      diasDomingo: totalDiasDomingo
    };
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
    const group = gruposNomina.find((g: GrupoNomina) => g.id === groupId);
    if (group) {
      setSelectedGroup(groupId);
      toast({
        title: "Grupo cargado",
        description: `Grupo "${group.nombre}" seleccionado para nómina`,
      });
    }
  };

  const deleteGroup = async (groupId: string) => {
    const group = gruposNomina.find((g: GrupoNomina) => g.id === groupId);
    try {
      await apiRequest("DELETE", `/api/grupos-nomina/${groupId}`, undefined);
      
      if (selectedGroup === groupId) {
        setSelectedGroup("");
      }
      
      // Invalidate cache to refresh groups list
      queryClient.invalidateQueries({ queryKey: ["/api/grupos-nomina"] });
      
      toast({
        title: "Grupo eliminado",
        description: `"${group?.nombre}" ha sido eliminado`,
      });
    } catch (error: any) {
      toast({
        title: "Error al eliminar grupo",
        description: error.message || "No se pudo eliminar el grupo de nómina",
        variant: "destructive",
      });
    }
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

  const toggleConceptExpansion = (conceptId: string) => {
    setExpandedConcepts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(conceptId)) {
        newSet.delete(conceptId);
      } else {
        newSet.add(conceptId);
      }
      return newSet;
    });
  };

  // Helper function to calculate current period based on frequency
  const getCurrentPeriod = (frequency: string): string => {
    const today = new Date();
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    
    if (frequency === "quincenal") {
      const day = today.getDate();
      const month = monthNames[today.getMonth()];
      const year = today.getFullYear();
      
      if (day <= 15) {
        return `1-15 ${month} ${year}`;
      } else {
        const lastDay = endOfMonth(today).getDate();
        return `16-${lastDay} ${month} ${year}`;
      }
    } else if (frequency === "semanal") {
      const startWeek = startOfWeek(today, { weekStartsOn: 1 });
      const endWeek = endOfWeek(today, { weekStartsOn: 1 });
      // Use end week's month/year for consistent formatting
      const month = monthNames[endWeek.getMonth()];
      const year = endWeek.getFullYear();
      
      return `${startWeek.getDate()}-${endWeek.getDate()} ${month} ${year}`;
    } else {
      // mensual
      const month = monthNames[today.getMonth()];
      const year = today.getFullYear();
      return `1-${endOfMonth(today).getDate()} ${month} ${year}`;
    }
  };

  // Generate period options based on frequency
  const getPeriodOptions = (frequency: string): string[] => {
    const today = new Date();
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const periods: string[] = [];
    
    if (frequency === "quincenal") {
      // Generate 6 quincenal periods (current + 5 previous)
      let currentDate = new Date(today);
      for (let i = 0; i < 6; i++) {
        const day = currentDate.getDate();
        const month = monthNames[currentDate.getMonth()];
        const year = currentDate.getFullYear();
        
        if (day <= 15) {
          periods.push(`1-15 ${month} ${year}`);
          // Move to previous quincenal (16-end of previous month)
          currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0); // Last day of previous month
        } else {
          const lastDay = endOfMonth(currentDate).getDate();
          periods.push(`16-${lastDay} ${month} ${year}`);
          // Move to first half of same month
          currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 15);
        }
      }
    } else if (frequency === "semanal") {
      // Generate 6 weekly periods
      let currentDate = new Date(today);
      for (let i = 0; i < 6; i++) {
        const startWeek = startOfWeek(currentDate, { weekStartsOn: 1 });
        const endWeek = endOfWeek(currentDate, { weekStartsOn: 1 });
        // Use end week's month/year for consistent formatting
        const month = monthNames[endWeek.getMonth()];
        const year = endWeek.getFullYear();
        
        periods.push(`${startWeek.getDate()}-${endWeek.getDate()} ${month} ${year}`);
        
        // Move to previous week
        currentDate = addDays(currentDate, -7);
      }
    } else {
      // Generate 6 monthly periods
      for (let i = 0; i < 6; i++) {
        const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const month = monthNames[date.getMonth()];
        const year = date.getFullYear();
        const lastDay = endOfMonth(date).getDate();
        periods.push(`1-${lastDay} ${month} ${year}`);
      }
    }
    
    return periods;
  };

  const startNewNomina = () => {
    setViewMode("create");
    setCurrentStep(0);
    setSelectedEmployees(new Set());
    setNominaType("ordinaria");
    setExtraordinaryType("");
    // Pre-select current period for ordinary payroll
    setSelectedPeriod(getCurrentPeriod(selectedFrequency));
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

  const createPreNomina = () => {
    const newNomina: Nomina = {
      id: Date.now().toString(),
      type: nominaType,
      period: nominaType === "ordinaria" ? selectedPeriod : extraordinaryType,
      frequency: nominaType === "ordinaria" ? selectedFrequency : "extraordinaria",
      extraordinaryType: nominaType === "extraordinaria" ? extraordinaryType : undefined,
      employeeIds: Array.from(selectedEmployees),
      status: "pre_nomina",
      createdAt: new Date(),
      totalNet: totalNetPay,
      employeeCount: selectedEmployees.size,
      editable: true,
    };

    setNominas([newNomina, ...nominas]);
    setViewMode("list");
    setCurrentStep(0);
    
    toast({
      title: "Pre-Nómina creada",
      description: `Pre-nómina ${nominaType} para ${selectedEmployees.size} empleados - ${formatCurrency(totalNetPay)}. Requiere aprobación.`,
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
      case "pre_nomina":
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
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
      pre_nomina: "outline" as const,
      approved: "default" as const,
      paid: "default" as const,
    };

    const labels = {
      draft: "Borrador",
      pre_nomina: "Pre-Nómina",
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
                          {getPeriodOptions(selectedFrequency).map((period) => (
                            <SelectItem key={period} value={period}>
                              {period}
                            </SelectItem>
                          ))}
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
                      {gruposNomina.filter(g => g.activo).map((group) => (
                        <SelectItem key={group.id} value={group.id!}>
                          <div className="flex items-center gap-2">
                            <Users className="h-3 w-3" />
                            {group.nombre} ({group.tipoPeriodo})
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <CreateGrupoNominaDialog
                    open={isCreateGroupOpen}
                    onOpenChange={setIsCreateGroupOpen}
                    trigger={
                      <DialogTrigger asChild>
                        <Button variant="outline" size="icon" data-testid="button-create-group">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                    }
                  />
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

              {(() => {
                const selectedEmployeesArray = employees.filter(emp => 
                  selectedEmployees.has(emp.id!)
                );

                return (
                  <IncidenciasAsistenciaGrid
                    fechaInicio={queryPeriodRange.start}
                    fechaFin={queryPeriodRange.end}
                    employees={selectedEmployeesArray}
                    incidenciasAsistencia={incidenciasAsistencia}
                    isLoading={false}
                  />
                );
              })()}
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
                  <p className="text-sm text-muted-foreground">
                    Haz clic en cada empleado para ver el desglose detallado
                  </p>
                </CardHeader>
                <CardContent>
                  <Accordion type="multiple" className="space-y-2">
                    {selectedEmployeesData.map((employee) => {
                      const breakdown = getEmployeeConceptBreakdown(employee.id);
                      const salarioDiario = employee.salary / 30;
                      
                      return (
                        <AccordionItem 
                          key={employee.id} 
                          value={employee.id}
                          className="border rounded-lg px-4"
                          data-testid={`accordion-employee-${employee.id}`}
                        >
                          <AccordionTrigger className="hover:no-underline">
                            <div className="flex items-center justify-between w-full pr-4">
                              <div className="flex items-center gap-4">
                                <span className="font-semibold">{employee.name}</span>
                                <Badge variant="outline" className="font-mono">
                                  {employee.daysWorked}/{employee.periodDays} días
                                </Badge>
                              </div>
                              <div className="flex items-center gap-6 text-sm">
                                <div className="text-right">
                                  <div className="text-muted-foreground text-xs">Base</div>
                                  <div className="font-mono">{formatCurrency(employee.baseSalary)}</div>
                                </div>
                                <div className="text-right">
                                  <div className="text-muted-foreground text-xs">Percepciones</div>
                                  <div className="font-mono text-primary">{formatCurrency(employee.earnings)}</div>
                                </div>
                                <div className="text-right">
                                  <div className="text-muted-foreground text-xs">Deducciones</div>
                                  <div className="font-mono text-destructive">{formatCurrency(employee.deductions)}</div>
                                </div>
                                <div className="text-right">
                                  <div className="text-muted-foreground text-xs">Neto</div>
                                  <div className="font-mono font-semibold text-lg">{formatCurrency(employee.netPay)}</div>
                                </div>
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="pt-4 pb-2">
                            <div className="grid grid-cols-3 gap-4">
                              {/* Salario Base */}
                              <Card>
                                <CardHeader className="pb-3">
                                  <CardTitle className="text-sm font-medium">Salario Base</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Días del periodo</span>
                                    <span className="font-mono">{employee.periodDays}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Días trabajados</span>
                                    <span className="font-mono">{employee.daysWorked}</span>
                                  </div>
                                  {employee.absences > 0 && (
                                    <div className="flex justify-between text-destructive">
                                      <span>Faltas</span>
                                      <span className="font-mono">-{employee.absences}</span>
                                    </div>
                                  )}
                                  {employee.incapacities > 0 && (
                                    <div className="flex justify-between text-orange-600">
                                      <span>Incapacidades</span>
                                      <span className="font-mono">-{employee.incapacities}</span>
                                    </div>
                                  )}
                                  {employee.diasDomingo > 0 && (
                                    <div className="flex justify-between text-primary">
                                      <span>Domingos trabajados</span>
                                      <span className="font-mono">+{employee.diasDomingo}</span>
                                    </div>
                                  )}
                                  <div className="h-px bg-border my-2" />
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Salario diario</span>
                                    <span className="font-mono">{formatCurrency(salarioDiario)}</span>
                                  </div>
                                  <div className="flex justify-between font-semibold">
                                    <span>Salario proporcional</span>
                                    <span className="font-mono">{formatCurrency(employee.baseSalary)}</span>
                                  </div>
                                </CardContent>
                              </Card>

                              {/* Percepciones Adicionales */}
                              <Card>
                                <CardHeader className="pb-3">
                                  <CardTitle className="text-sm font-medium">Percepciones Adicionales</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2 text-sm">
                                  {employee.primaDominical > 0 && (
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Prima Dominical (25%)</span>
                                      <span className="font-mono text-primary">{formatCurrency(employee.primaDominical)}</span>
                                    </div>
                                  )}
                                  {breakdown.percepciones.map((concepto) => (
                                    <div key={concepto.id} className="flex justify-between">
                                      <span className="text-muted-foreground">{concepto.name}</span>
                                      <span className="font-mono text-primary">{formatCurrency(concepto.amount)}</span>
                                    </div>
                                  ))}
                                  {employee.primaDominical === 0 && breakdown.percepciones.length === 0 && (
                                    <div className="text-muted-foreground text-center py-4">
                                      Sin percepciones adicionales
                                    </div>
                                  )}
                                  <div className="h-px bg-border my-2" />
                                  <div className="flex justify-between font-semibold">
                                    <span>Total Percepciones</span>
                                    <span className="font-mono text-primary">{formatCurrency(employee.earnings)}</span>
                                  </div>
                                </CardContent>
                              </Card>

                              {/* Deducciones */}
                              <Card>
                                <CardHeader className="pb-3">
                                  <CardTitle className="text-sm font-medium">Deducciones</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Deducciones base (ISR/IMSS)</span>
                                    <span className="font-mono text-destructive">{formatCurrency(employee.baseSalary * 0.1888)}</span>
                                  </div>
                                  {breakdown.deducciones.map((concepto) => (
                                    <div key={concepto.id} className="flex justify-between">
                                      <span className="text-muted-foreground">{concepto.name}</span>
                                      <span className="font-mono text-destructive">{formatCurrency(concepto.amount)}</span>
                                    </div>
                                  ))}
                                  {breakdown.deducciones.length === 0 && (
                                    <div className="text-muted-foreground text-center py-4">
                                      Sin deducciones adicionales
                                    </div>
                                  )}
                                  <div className="h-px bg-border my-2" />
                                  <div className="flex justify-between font-semibold">
                                    <span>Total Deducciones</span>
                                    <span className="font-mono text-destructive">{formatCurrency(employee.deductions)}</span>
                                  </div>
                                </CardContent>
                              </Card>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
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
            <Button onClick={createPreNomina} data-testid="button-create-pre-nomina">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Crear Pre-Nómina
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
