import { useState, useMemo, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Parser } from "expr-eval";
import { usePayrollCalculations, mapDesgloseToEmployeeCalculation, type DesgloseNomina } from "@/hooks/usePayrollCalculations";
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
  FileText,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  ChevronDown,
  ChevronRight,
  XCircle,
  Calendar,
  Star,
  Sun,
  MinusCircle,
  Loader2,
  Search,
  DollarSign,
  AlertTriangle
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
import type { GrupoNomina, Employee, IncidenciaAsistencia, PlantillaNomina, PlantillaNominaWithConceptos, Empresa } from "@shared/schema";
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

interface EmployeePayrollDetail {
  id: string;
  name: string;
  rfc: string;
  department: string | null;
  // Salarios separados para compliance
  salarioDiarioReal: number;      // Total: nominal + exento (lo que realmente gana)
  salarioDiarioNominal: number;   // Solo para IMSS/ISR (aparece en CFDI)
  salarioDiarioExento: number;    // SDE - pago por fuera (no CFDI)
  salary: number;                 // Alias de salarioDiarioReal para compatibilidad
  baseSalary: number;             // Salario base del periodo (salarioDiarioReal * diasTrabajados)
  daysWorked: number;
  periodDays: number;
  absences: number;
  incapacities: number;
  diasDomingo: number;
  diasFestivos: number;
  diasVacaciones: number;
  primaDominical: number;
  pagoFestivos: number;
  horasExtra: number;
  horasDobles: number;
  horasTriples: number;
  horasDoblesPago: number;
  horasTriplesPago: number;
  horasExtraPago: number;
  horasExtraExento: number;
  horasExtraGravado: number;
  vacacionesPago: number;
  primaVacacional: number;
  horasDescontadas: number;
  descuentoHoras: number;
  retardos: number;
  imssTotal: number;
  imssExcedente3Umas: number;
  imssPrestacionesDinero: number;
  imssGastosMedicos: number;
  imssInvalidezVida: number;
  imssCesantiaVejez: number;
  isrCausado: number;
  subsidioEmpleo: number;
  isrRetenido: number;
  isrTasa: number;
  sbcDiario: number;
  sdiDiario: number;
  earnings: number;
  deductions: number;
  netPay: number;
  netoAPagarTotal: number;
  percepciones: { id: string; name: string; amount: number; integraSalarioBase?: boolean }[];
  deducciones: { id: string; name: string; amount: number }[];
  // Backend percepciones (detailed with clave/nombre/importe)
  backendPercepciones?: { clave: string; nombre: string; importe: number }[];
  // Pago adicional (SDE)
  pagoAdicional?: {
    salarioDiarioExento: number;
    diasPagados: number;
    montoBase: number;
    conceptos: { concepto: string; monto: number }[];
    montoTotal: number;
  };
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
  totalEarnings: number;
  totalPercepcionesNomina?: number;
  totalPercepcionesSDE?: number;
  totalDeductions: number;
  totalSalary: number;
  employeeCount: number;
  editable?: boolean;
  employeeDetails?: EmployeePayrollDetail[];
  periodRange?: { start: string; end: string };
  fechaTimbrado?: Date | null;
  timbradoPor?: string | null;
}

export default function Payroll() {
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<"list" | "create">("list");
  const [currentStep, setCurrentStep] = useState(0);
  const [isCreatingNomina, setIsCreatingNomina] = useState(false);
  
  // Fetch grupos de nómina from API
  const { data: gruposNomina = [] } = useQuery<GrupoNomina[]>({
    queryKey: ["/api/grupos-nomina"],
  });

  // Fetch real employees from API
  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  // Fetch empresas for plantilla lookup
  const { data: empresas = [], isLoading: isLoadingEmpresas } = useQuery<Empresa[]>({
    queryKey: ["/api/empresas"],
  });

  // Get first empresa (for demo/single-tenant scenarios)
  const currentEmpresaId = empresas.length > 0 ? empresas[0].id : null;
  const currentEmpresa = empresas.find(e => e.id === currentEmpresaId);

  // Fetch plantillas for the current empresa
  const { data: plantillas = [], isLoading: isLoadingPlantillas } = useQuery<PlantillaNomina[]>({
    queryKey: ["/api/plantillas-nomina", { clienteId: currentEmpresa?.clienteId, empresaId: currentEmpresaId }],
    queryFn: async () => {
      if (!currentEmpresa?.clienteId || !currentEmpresaId) return [];
      const res = await fetch(`/api/plantillas-nomina?clienteId=${currentEmpresa.clienteId}&empresaId=${currentEmpresaId}`, { credentials: "include" });
      if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
      return res.json();
    },
    enabled: !!currentEmpresaId && !!currentEmpresa?.clienteId,
  });

  // Determine if the plantilla selector should be shown (only when data is ready)
  const showPlantillaSelector = !isLoadingEmpresas && !isLoadingPlantillas && plantillas.length > 0;

  // Get the default plantilla ID from the empresa
  const defaultPlantillaId = currentEmpresa?.defaultPlantillaNominaId || null;

  // Form state
  const [nominaType, setNominaType] = useState<"ordinaria" | "extraordinaria">("ordinaria");
  const [extraordinaryType, setExtraordinaryType] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("");
  const [selectedFrequency, setSelectedFrequency] = useState("quincenal");
  const [selectedPlantillaId, setSelectedPlantillaId] = useState<string | null>(null);

  // Fetch the selected plantilla with its concepts (must be after selectedPlantillaId is declared)
  // Include currentEmpresaId in queryKey to ensure refetch when empresa changes
  const { data: selectedPlantillaData, isLoading: isLoadingPlantillaData } = useQuery<PlantillaNominaWithConceptos>({
    queryKey: ["/api/plantillas-nomina", selectedPlantillaId, { empresaId: currentEmpresaId }],
    queryFn: async () => {
      if (!selectedPlantillaId || selectedPlantillaId === "none") return null;
      const res = await fetch(`/api/plantillas-nomina/${selectedPlantillaId}`, { credentials: "include" });
      if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
      return res.json();
    },
    enabled: !!selectedPlantillaId && selectedPlantillaId !== "none",
    staleTime: 0, // Always refetch to ensure fresh data
  });

  // Sync selectedPlantillaId with defaultPlantillaId when empresa changes or default updates
  useEffect(() => {
    // Only run when we have a valid empresa (query has resolved)
    if (currentEmpresaId) {
      // Set to the default (which may be null meaning "no template")
      setSelectedPlantillaId(defaultPlantillaId);
    }
  }, [currentEmpresaId, defaultPlantillaId]);

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
  const [empresaFilter, setEmpresaFilter] = useState("all");
  const [employeeSearch, setEmployeeSearch] = useState("");
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
  const allEmployees = employees.map(emp => {
    // Salarios diarios para SDE (pago por fuera)
    const salarioDiarioReal = parseFloat(emp.salarioDiarioReal || '0');
    const salarioDiarioNominal = parseFloat(emp.salarioDiarioNominal || '0');
    const salarioDiarioExento = parseFloat(emp.salarioDiarioExento || '0');

    // Si hay salarioDiarioReal, calcular mensual desde ahí; sino usar salarioBrutoMensual como fallback
    const salaryMensual = salarioDiarioReal > 0
      ? salarioDiarioReal * 30
      : parseFloat(emp.salarioBrutoMensual || '0');

    return {
      id: emp.id!,
      name: `${emp.nombre} ${emp.apellidoPaterno} ${emp.apellidoMaterno || ''}`.trim(),
      rfc: emp.rfc || '',
      department: emp.departamento,
      empresaId: emp.empresaId || '',
      // Salarios para cálculos
      salary: salaryMensual,  // Salario real mensual (para cálculos de pago total)
      salarioDiarioReal,      // Salario diario real (nominal + exento)
      salarioDiarioNominal,   // Salario diario nominal (solo para IMSS/ISR)
      salarioDiarioExento,    // SDE - pago por fuera
      grupoNominaId: emp.grupoNominaId || null,
    };
  });

  // Fetch backend payroll calculations for all employees
  // This is the single source of truth for ISR, IMSS, and other calculations
  const employeeIds = useMemo(() => allEmployees.map(e => e.id), [allEmployees]);

  const { data: payrollBatchData, isLoading: isLoadingPayroll } = usePayrollCalculations({
    empleadoIds: employeeIds,
    fechaInicio: queryPeriodRange.start,
    fechaFin: queryPeriodRange.end,
    frecuencia: selectedFrequency as 'semanal' | 'quincenal' | 'mensual',
    usarIncidencias: true,
    enabled: employeeIds.length > 0,
  });

  // Create a lookup map for backend calculations
  const backendCalculationsMap = useMemo(() => {
    const map = new Map<string, ReturnType<typeof mapDesgloseToEmployeeCalculation>>();
    if (payrollBatchData?.desgloses) {
      for (const desglose of payrollBatchData.desgloses) {
        const mapped = mapDesgloseToEmployeeCalculation(desglose as DesgloseNomina);
        if (mapped) {
          map.set(mapped.id, mapped);
        }
      }
    }
    return map;
  }, [payrollBatchData]);

  // Fetch existing nominas from API
  const { data: nominasFromApi = [], refetch: refetchNominas } = useQuery<any[]>({
    queryKey: ["/api/nominas"],
  });

  // Transform API nominas to local format
  const nominas: Nomina[] = useMemo(() => {
    return nominasFromApi.map((n: any) => {
      // Transform empleadosData from DB format to EmployeePayrollDetail format
      const employeeDetails: EmployeePayrollDetail[] = (n.empleadosData || []).map((e: any) => {
        // Calcular salarios: si hay salarioDiarioReal usar ese, sino calcular desde salarioBase
        const salarioDiarioReal = e.salarioDiarioReal || e.salarioBase || 0;
        const salarioDiarioNominal = e.salarioDiarioNominal || salarioDiarioReal;
        const salarioDiarioExento = e.salarioDiarioExento || (salarioDiarioReal - salarioDiarioNominal);

        return {
        id: e.empleadoId,
        name: e.nombre || '',
        rfc: e.rfc || '',
        department: e.departamento || null,
        // Salarios separados para compliance
        salarioDiarioReal,
        salarioDiarioNominal,
        salarioDiarioExento,
        salary: salarioDiarioReal,  // Lo que realmente gana (para cálculos de pago total)
        baseSalary: e.salarioBase || 0,
        daysWorked: e.diasTrabajados || 0,
        periodDays: e.diasPeriodo || 15,
        absences: e.faltas || 0,
        incapacities: e.incapacidades || 0,
        diasDomingo: e.diasDomingo || 0,
        diasFestivos: e.diasFestivos || 0,
        diasVacaciones: e.diasVacaciones || 0,
        primaDominical: e.primaDominical || 0,
        pagoFestivos: e.pagoFestivos || 0,
        horasExtra: e.horasExtra || 0,
        horasDobles: e.horasDobles || 0,
        horasTriples: e.horasTriples || 0,
        horasDoblesPago: e.horasDoblesPago || 0,
        horasTriplesPago: e.horasTriplesPago || 0,
        horasExtraPago: e.horasExtraPago || 0,
        horasExtraExento: e.horasExtraExento || 0,
        horasExtraGravado: e.horasExtraGravado || 0,
        vacacionesPago: e.vacacionesPago || 0,
        primaVacacional: e.primaVacacional || 0,
        horasDescontadas: e.horasDescontadas || 0,
        descuentoHoras: e.descuentoHoras || 0,
        retardos: e.retardos || 0,
        // IMSS individual breakdowns (use saved values if available)
        imssTotal: e.imssTotal || 0,
        imssExcedente3Umas: e.imssExcedente3Umas || 0,
        imssPrestacionesDinero: e.imssPrestacionesDinero || 0,
        imssGastosMedicos: e.imssGastosMedicos || 0,
        imssInvalidezVida: e.imssInvalidezVida || 0,
        imssCesantiaVejez: e.imssCesantiaVejez || 0,
        // ISR details
        isrCausado: e.isrCausado || 0,
        subsidioEmpleo: e.subsidioEmpleo || 0,
        isrRetenido: e.isrRetenido || 0,
        isrTasa: e.isrTasa || 0,
        sbcDiario: 0,
        sdiDiario: 0,
        // Use saved totalPercepciones if available (matches Step 2 calculation), fallback to recalculate
        earnings: e.totalPercepciones ?? (e.backendPercepciones && e.backendPercepciones.length > 0
          ? (e.backendPercepciones || []).reduce((sum: number, p: any) => sum + (p.importe || 0), 0)
          : (e.percepciones || []).reduce((sum: number, p: any) => sum + (p.monto || 0), 0)),
        // Use saved totalDeducciones if available, fallback to recalculate
        deductions: e.totalDeducciones ?? ((e.deducciones || []).reduce((sum: number, d: any) => sum + (d.monto || 0), 0) + (e.imssTotal || 0) + (e.isrRetenido || 0)),
        netPay: e.netoAPagar || 0,
        netoAPagarTotal: e.netoAPagarTotal || e.netoAPagar || 0,
        // Pago adicional (SDE)
        pagoAdicional: e.pagoAdicional,
        // Backend percepciones (detailed with clave/nombre/importe)
        backendPercepciones: e.backendPercepciones,
        percepciones: (e.percepciones || []).map((p: any) => ({
          id: p.conceptoId || p.id || '',
          name: p.nombre || '',
          amount: p.monto || 0,
        })),
        deducciones: (e.deducciones || []).map((d: any) => ({
          id: d.conceptoId || d.id || '',
          name: d.nombre || '',
          amount: d.monto || 0,
        })),
      }});

      // Calculate totals from employee details
      // Split percepciones into Nómina (goes in CFDI) and SDE (exentas, paid separately)
      const totalPercepcionesSDE = employeeDetails.reduce((sum, e) => sum + (e.pagoAdicional?.montoTotal || 0), 0);
      // totalPercepcionesNomina = total earnings WITHOUT SDE (the CFDI amount)
      const totalPercepcionesNomina = employeeDetails.reduce((sum, e) => {
        // e.earnings includes SDE if saved with totalPercepciones, so subtract it
        const sdeAmount = e.pagoAdicional?.montoTotal || 0;
        return sum + (e.earnings - sdeAmount);
      }, 0);
      // Combined total for backwards compatibility
      const totalEarnings = totalPercepcionesNomina + totalPercepcionesSDE;
      const totalDeductions = employeeDetails.reduce((sum, e) => sum + e.deductions, 0);
      const totalSalary = employeeDetails.reduce((sum, e) => sum + e.baseSalary, 0);

      return {
        id: n.id,
        type: n.tipo as "ordinaria" | "extraordinaria",
        period: n.periodo,
        frequency: n.frecuencia,
        extraordinaryType: n.tipoExtraordinario,
        employeeIds: (n.empleadosData || []).map((e: any) => e.empleadoId),
        status: n.status as "draft" | "pre_nomina" | "approved" | "paid",
        createdAt: new Date(n.createdAt),
        totalNet: parseFloat(n.totalNeto) || 0,
        totalEarnings,
        totalPercepcionesNomina,
        totalPercepcionesSDE,
        totalDeductions,
        totalSalary,
        employeeCount: n.totalEmpleados || 0,
        editable: n.status === "pre_nomina",
        employeeDetails,
      };
    });
  }, [nominasFromApi]);
  
  // State for viewing nomina detail modal
  const [selectedNominaToView, setSelectedNominaToView] = useState<Nomina | null>(null);
  const [isNominaDetailOpen, setIsNominaDetailOpen] = useState(false);

  // Default concepts (used when no plantilla is selected)
  const defaultConcepts: Concept[] = [
    { id: "bono-productividad", name: "Bono Productividad", type: "percepcion" },
    { id: "comisiones", name: "Comisiones", type: "percepcion" },
    { id: "tiempo-extra", name: "Tiempo Extra", type: "percepcion" },
    { id: "premio-asistencia", name: "Premio Asistencia", type: "percepcion" },
    { id: "vacaciones", name: "Vacaciones", type: "percepcion" },
    { id: "prima-vacacional", name: "Prima Vacacional (25%)", type: "percepcion" },
    { id: "faltas", name: "Faltas", type: "deduccion" },
    { id: "retardos", name: "Retardos", type: "deduccion" },
    { id: "prestamo", name: "Préstamo", type: "deduccion" },
  ];

  // Predefined concepts (like columns in Excel) - updated from plantilla or defaults
  const [concepts, setConcepts] = useState<Concept[]>(defaultConcepts);

  // Load concepts from selected plantilla when it changes
  useEffect(() => {
    // Case 1: No plantilla selected - use defaults
    if (!selectedPlantillaId || selectedPlantillaId === "none") {
      setConcepts(defaultConcepts);
      setConceptValues([]);
      return;
    }
    
    // Case 2: Plantilla selected but still loading - wait for data
    if (isLoadingPlantillaData) {
      return;
    }
    
    // Case 3: Plantilla selected and data loaded
    if (selectedPlantillaData) {
      if (selectedPlantillaData.conceptos && selectedPlantillaData.conceptos.length > 0) {
        // Map plantilla concepts to the Concept format used by the grid
        const plantillaConcepts: Concept[] = selectedPlantillaData.conceptos.map(pc => {
          // Map tipo to percepcion/deduccion - handle various SAT types
          let conceptType: "percepcion" | "deduccion" = "percepcion";
          const tipo = pc.concepto.tipo?.toLowerCase() || "";
          if (tipo.includes("deduccion") || tipo.includes("descuento")) {
            conceptType = "deduccion";
          }
          return {
            id: pc.concepto.id,
            name: pc.concepto.nombre,
            type: conceptType,
          };
        });
        setConcepts(plantillaConcepts);
      } else {
        // Plantilla has no concepts - use empty array (not defaults)
        setConcepts([]);
      }
      // Reset concept values when switching plantillas to avoid stale data
      setConceptValues([]);
    }
  }, [selectedPlantillaData, selectedPlantillaId, isLoadingPlantillaData]);

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

  const evaluateFormulaForEmployee = useCallback((formula: string, employeeCalc: any, employee: any) => {
    if (!formula || !employeeCalc) return 0;
    
    const parser = new Parser();
    const periodDays = selectedFrequency === "semanal" ? 7 
                     : selectedFrequency === "quincenal" ? 15 
                     : 30;
    
    const salarioDiario = employee?.salary ? employee.salary / 30 : 0;
    const salarioPeriodo = salarioDiario * periodDays;
    
    const baseVars: Record<string, number> = {
      SALARIO_PERIODO: salarioPeriodo,
      SALARIO_DIARIO: salarioDiario,
      SALARIO_MENSUAL: employee?.salary || 0,
      DIAS_PERIODO: periodDays,
      DIAS_TRABAJADOS: employeeCalc.daysWorked || 0,
      FALTAS: employeeCalc.absences || 0,
      INCAPACIDADES: employeeCalc.incapacities || 0,
      HORAS_EXTRA: employeeCalc.horasExtra || 0,
      SALARIO_BASE: employeeCalc.baseSalary || 0,
      SBC_DIARIO: employeeCalc.sbcDiario || 0,
      SDI_DIARIO: employeeCalc.sdiDiario || 0,
      MONTO_BONO: salarioPeriodo * 0.10,
      DESCUENTO_INFONAVIT: 0,
      DESCUENTO_FONACOT: 0,
      MONTO_VALES: 0,
      MONTO_FONDO_AHORRO: 0,
      PORCENTAJE_PTU: 0,
      CUOTA_IMSS: employeeCalc.imssTotal || 0,
      ISR_RETENIDO: employeeCalc.isrRetenido || 0,
      SUBSIDIO_EMPLEO: employeeCalc.subsidioEmpleo || 0,
    };
    
    const variables: Record<string, number> = {};
    for (const [key, value] of Object.entries(baseVars)) {
      variables[key] = value;
      variables[key.toLowerCase()] = value;
    }
    
    try {
      const cleanFormula = formula.replace(/[^a-zA-Z0-9_+\-*/().* ]/g, '').trim();
      if (!cleanFormula) return 0;
      const expr = parser.parse(cleanFormula);
      const result = expr.evaluate(variables);
      return typeof result === 'number' && isFinite(result) ? Math.round(result * 100) / 100 : 0;
    } catch (error) {
      console.warn('Error evaluating formula:', formula, error);
      return 0;
    }
  }, [selectedFrequency]);

  const getEmployeeConceptBreakdown = (employeeId: string, employeeCalc?: any) => {
    const employeeValues = conceptValues.filter(cv => cv.employeeId === employeeId);
    const employee = allEmployees.find(e => e.id === employeeId);
    
    const manualPercepciones = employeeValues
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
          integraSalarioBase: false, // Conceptos manuales no integran salario base
        };
      });
    
    const manualDeducciones = employeeValues
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
    
    const plantillaPercepciones: { id: string; name: string; amount: number; integraSalarioBase?: boolean }[] = [];
    const plantillaDeducciones: { id: string; name: string; amount: number }[] = [];
    
    if (selectedPlantillaData?.conceptos && employeeCalc && employee) {
      const sortedConceptos = [...selectedPlantillaData.conceptos].sort((a, b) => (a.orden || 0) - (b.orden || 0));
      
      for (const plantillaConcepto of sortedConceptos) {
        const conceptoData = plantillaConcepto.concepto;
        if (!conceptoData || conceptoData.activo === false) continue;
        
        const amount = evaluateFormulaForEmployee(conceptoData.formula ?? '', employeeCalc, employee);
        if (amount <= 0) continue;
        
        // Override de plantilla tiene prioridad, sino usar valor del concepto
        const integraSalarioBase = plantillaConcepto.integraSalarioBaseOverride ?? conceptoData.integraSalarioBase ?? false;
        
        const item = {
          id: plantillaConcepto.id,
          name: conceptoData.nombre || 'Concepto',
          amount,
          integraSalarioBase,
        };
        
        if (conceptoData.tipo === 'percepcion') {
          plantillaPercepciones.push(item);
        } else if (conceptoData.tipo === 'deduccion') {
          plantillaDeducciones.push(item);
        }
      }
    }
    
    const percepciones = [...plantillaPercepciones, ...manualPercepciones];
    const deducciones = [...plantillaDeducciones, ...manualDeducciones];
    
    // Excluir conceptos que integran salario base del total (son parte del desglose, no suman)
    const totalPlantillaPercepciones = plantillaPercepciones
      .filter(p => !p.integraSalarioBase)
      .reduce((sum, p) => sum + p.amount, 0);
    const totalPlantillaDeducciones = plantillaDeducciones.reduce((sum, d) => sum + d.amount, 0);
    
    return { 
      percepciones, 
      deducciones,
      totalPlantillaPercepciones,
      totalPlantillaDeducciones,
      hasPlantilla: plantillaPercepciones.length > 0 || plantillaDeducciones.length > 0
    };
  };

  // Empty calculation result for when backend data is not available
  const getEmptyCalculation = () => ({
    baseSalary: 0,
    horasExtraPago: 0,
    horasDoblesPago: 0,
    horasTriplesPago: 0,
    horasExtraExento: 0,
    horasExtraGravado: 0,
    horasExtra: 0,
    horasDobles: 0,
    horasTriples: 0,
    primaDominical: 0,
    diasFestivos: 0,
    pagoFestivos: 0,
    vacacionesPago: 0,
    primaVacacional: 0,
    earnings: 0,
    deductions: 0,
    netPay: 0,
    daysWorked: 0,
    periodDays: 0,
    absences: 0,
    incapacities: 0,
    diasDomingo: 0,
    diasVacaciones: 0,
    imssTotal: 0,
    imssExcedente3Umas: 0,
    imssPrestacionesDinero: 0,
    imssGastosMedicos: 0,
    imssInvalidezVida: 0,
    imssCesantiaVejez: 0,
    isrCausado: 0,
    subsidioEmpleo: 0,
    isrRetenido: 0,
    sbcDiario: 0,
    sdiDiario: 0,
    horasDescontadas: 0,
    descuentoHoras: 0,
    retardos: 0,
    isrTasa: 0,
    // SDE (salario diario exento) fields
    salarioDiarioReal: 0,
    salarioDiarioNominal: 0,
    salarioDiarioExento: 0,
    pagoAdicional: undefined,
    netoAPagarTotal: 0,
    backendPercepciones: [],
  });

  // Get payroll calculation from backend (single source of truth - NO FALLBACK)
  const getEmployeePayrollFromBackend = (employeeId: string) => {
    const backendCalc = backendCalculationsMap.get(employeeId);
    if (!backendCalc) {
      return getEmptyCalculation();
    }

    return {
      // From backend calculation (correct ISR/IMSS values)
      baseSalary: backendCalc.baseSalary,
      earnings: backendCalc.earnings,
      deductions: backendCalc.deductions,
      netPay: backendCalc.netPay,
      daysWorked: backendCalc.daysWorked,
      periodDays: backendCalc.periodDays,
      absences: backendCalc.absences,
      incapacities: backendCalc.incapacidades || 0,
      diasVacaciones: backendCalc.vacaciones,
      diasFestivos: backendCalc.diasFestivos,
      horasExtra: backendCalc.horasExtra,
      // IMSS from backend - extract individual cuotas from desgloseIMSS
      imssTotal: backendCalc.totalIMSS,
      imssExcedente3Umas: backendCalc.desgloseIMSS?.cuotasObrero?.find(c => c.concepto.toLowerCase().includes('excedente'))?.importe || 0,
      imssPrestacionesDinero: backendCalc.desgloseIMSS?.cuotasObrero?.find(c => c.concepto.toLowerCase().includes('prestaciones en dinero'))?.importe || 0,
      imssGastosMedicos: backendCalc.desgloseIMSS?.cuotasObrero?.find(c => c.concepto.toLowerCase().includes('gastos médicos') || c.concepto.toLowerCase().includes('gastos medicos'))?.importe || 0,
      imssInvalidezVida: backendCalc.desgloseIMSS?.cuotasObrero?.find(c => c.concepto.toLowerCase().includes('invalidez'))?.importe || 0,
      imssCesantiaVejez: backendCalc.desgloseIMSS?.cuotasObrero?.find(c => c.concepto.toLowerCase().includes('cesantía') || c.concepto.toLowerCase().includes('cesantia'))?.importe || 0,
      // ISR from backend (correctly calculated on salarioDiarioNominal)
      isrCausado: backendCalc.isrCausado,
      subsidioEmpleo: backendCalc.subsidioEmpleo,
      isrRetenido: backendCalc.isrRetenido,
      isrTasa: backendCalc.isrTasa,
      // Salaries from backend
      sbcDiario: backendCalc.sbc,
      sdiDiario: backendCalc.sdi,
      // Daily salaries for SDE display (salario diario exento)
      salarioDiarioReal: backendCalc.salarioDiarioReal,
      salarioDiarioNominal: backendCalc.salarioDiarioNominal,
      salarioDiarioExento: backendCalc.salarioDiarioExento,
      // Pago adicional (SDE) - pago por fuera
      pagoAdicional: backendCalc.pagoAdicional,
      netoAPagarTotal: backendCalc.netoAPagarTotal,
      // Backend percepciones (includes Sueldo Base)
      backendPercepciones: backendCalc.percepciones,
      // Additional incidencias fields from backend
      diasDomingo: backendCalc.diasDomingo || 0,
      horasDobles: backendCalc.horasExtraDobles || 0,
      horasTriples: backendCalc.horasExtraTriples || 0,
      horasDoblesPago: backendCalc.horasDoblesPago || 0,
      horasTriplesPago: backendCalc.horasTriplesPago || 0,
      horasExtraPago: (backendCalc.horasDoblesPago || 0) + (backendCalc.horasTriplesPago || 0),
      horasExtraExento: 0,
      horasExtraGravado: 0,
      primaDominical: backendCalc.primaDominical || 0,
      pagoFestivos: backendCalc.pagoFestivos || 0,
      vacacionesPago: backendCalc.vacacionesPago || 0,
      primaVacacional: backendCalc.primaVacacional || 0,
      horasDescontadas: 0,
      descuentoHoras: 0,
      retardos: backendCalc.retardos || 0,
    };
  };

  // DELETED: All frontend payroll calculation logic has been removed.
  // Calculations now come exclusively from the backend via usePayrollCalculations hook.
  // This ensures a single source of truth for ISR, IMSS, and all payroll values.


  const filteredEmployees = allEmployees.filter(emp => {
    const matchesEmpresa = empresaFilter === "all" || emp.empresaId === empresaFilter;
    const matchesGroup = !selectedGroup || emp.grupoNominaId === selectedGroup;

    // Search filter
    if (employeeSearch) {
      const query = employeeSearch.toLowerCase();
      const matchesSearch = emp.name.toLowerCase().includes(query) ||
                            emp.rfc.toLowerCase().includes(query);
      return matchesEmpresa && matchesGroup && matchesSearch;
    }

    return matchesEmpresa && matchesGroup;
  });

  const employeesToShow = filteredEmployees.map(emp => ({
    ...emp,
    ...getEmployeePayrollFromBackend(emp.id),
  }));

  // For steps 1, 2 and submission, use ALL selected employees regardless of current filters
  const selectedEmployeesData = allEmployees
    .filter(emp => selectedEmployees.has(emp.id))
    .map(emp => ({
      ...emp,
      ...getEmployeePayrollFromBackend(emp.id),
    }));

  const totalSalary = selectedEmployeesData.reduce((sum, emp) => sum + emp.salary, 0);
  
  const getEmployeeTotalPercepciones = (emp: typeof selectedEmployeesData[0]) => {
    const breakdown = getEmployeeConceptBreakdown(emp.id, emp);
    const extrasPercepciones = emp.primaDominical + emp.pagoFestivos + emp.horasDoblesPago + emp.horasTriplesPago + emp.vacacionesPago + emp.primaVacacional;
    // Excluir conceptos que integran salario base del total (son parte del desglose, no suman)
    const conceptosPercepciones = breakdown.percepciones
      .filter(p => !p.integraSalarioBase)
      .reduce((s, p) => s + p.amount, 0);
    if (breakdown.hasPlantilla && conceptosPercepciones > 0) {
      return conceptosPercepciones + extrasPercepciones;
    }
    return emp.earnings;
  };
  
  const totalEarnings = selectedEmployeesData.reduce((sum, emp) => sum + getEmployeeTotalPercepciones(emp) + (emp.pagoAdicional?.montoTotal || 0), 0);
  const totalDeductions = selectedEmployeesData.reduce((sum, emp) => sum + emp.deductions, 0);
  const totalNetPay = selectedEmployeesData.reduce((sum, emp) => sum + (emp.netoAPagarTotal || (getEmployeeTotalPercepciones(emp) - emp.deductions)), 0);

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
      // Sync frequency to match the group's tipoPeriodo
      setSelectedFrequency(group.tipoPeriodo);
      // Pre-select all employees that belong to this group
      const groupEmployees = allEmployees.filter(emp => emp.grupoNominaId === groupId);
      setSelectedEmployees(new Set(groupEmployees.map(emp => emp.id)));
      toast({
        title: "Grupo cargado",
        description: `Grupo "${group.nombre}" seleccionado - ${groupEmployees.length} empleados encontrados`,
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

  // Auto-update period when frequency changes (only in create mode)
  useEffect(() => {
    if (viewMode === "create" && nominaType === "ordinaria") {
      setSelectedPeriod(getCurrentPeriod(selectedFrequency));
    }
  }, [selectedFrequency, viewMode, nominaType]);

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

  const createPreNomina = async () => {
    if (isCreatingNomina) return;
    
    if (!currentEmpresa) {
      toast({
        title: "Error",
        description: "No se encontró la empresa actual",
        variant: "destructive",
      });
      return;
    }

    if (selectedEmployeesData.length === 0) {
      toast({
        title: "Error",
        description: "No hay empleados seleccionados",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingNomina(true);

    try {
      // Build employee details for API (simplified format for storage)
      const empleadosData = selectedEmployeesData.map(emp => {
        const breakdown = getEmployeeConceptBreakdown(emp.id, emp);
        // Calculate total percepciones using same logic as Step 2 display
        const totalPercepciones = getEmployeeTotalPercepciones(emp) + (emp.pagoAdicional?.montoTotal || 0);
        return {
          empleadoId: emp.id,
          nombre: emp.name,
          rfc: emp.rfc,
          departamento: emp.department,
          salarioBase: emp.baseSalary,
          // Pre-calculated totals (to ensure dialog shows same values as Step 2)
          totalPercepciones,
          totalDeducciones: emp.deductions,
          diasTrabajados: emp.daysWorked,
          diasPeriodo: emp.periodDays,
          // Incidencias
          faltas: emp.absences,
          incapacidades: emp.incapacities,
          diasDomingo: emp.diasDomingo,
          diasFestivos: emp.diasFestivos,
          diasVacaciones: emp.diasVacaciones,
          horasExtra: emp.horasExtra,
          horasDobles: emp.horasDobles,
          horasTriples: emp.horasTriples,
          horasDoblesPago: emp.horasDoblesPago,
          horasTriplesPago: emp.horasTriplesPago,
          horasExtraPago: emp.horasExtraPago,
          horasExtraExento: emp.horasExtraExento,
          horasExtraGravado: emp.horasExtraGravado,
          primaDominical: emp.primaDominical,
          pagoFestivos: emp.pagoFestivos,
          vacacionesPago: emp.vacacionesPago,
          primaVacacional: emp.primaVacacional,
          horasDescontadas: emp.horasDescontadas,
          descuentoHoras: emp.descuentoHoras,
          retardos: emp.retardos,
          // Salarios SDE
          salarioDiarioReal: emp.salarioDiarioReal,
          salarioDiarioNominal: emp.salarioDiarioNominal,
          salarioDiarioExento: emp.salarioDiarioExento,
          // Pago adicional (SDE)
          pagoAdicional: emp.pagoAdicional,
          // Backend percepciones (detailed with clave/nombre/importe)
          backendPercepciones: emp.backendPercepciones,
          percepciones: breakdown.percepciones.map(p => ({
            conceptoId: p.id,
            nombre: p.name,
            monto: p.amount,
          })),
          deducciones: breakdown.deducciones.map(d => ({
            conceptoId: d.id,
            nombre: d.name,
            monto: d.amount,
          })),
          // IMSS individual breakdowns
          imssTotal: emp.imssTotal,
          imssPrestacionesDinero: emp.imssPrestacionesDinero,
          imssGastosMedicos: emp.imssGastosMedicos,
          imssInvalidezVida: emp.imssInvalidezVida,
          imssCesantiaVejez: emp.imssCesantiaVejez,
          imssExcedente3Umas: emp.imssExcedente3Umas,
          // ISR details
          isrCausado: emp.isrCausado,
          isrRetenido: emp.isrRetenido,
          isrTasa: emp.isrTasa,
          subsidioEmpleo: emp.subsidioEmpleo,
          netoAPagar: emp.netPay,
          netoAPagarTotal: emp.netoAPagarTotal,
        };
      });

      const nominaPayload = {
        clienteId: currentEmpresa.clienteId,
        empresaId: currentEmpresa.id,
        tipo: nominaType,
        periodo: nominaType === "ordinaria" ? selectedPeriod : extraordinaryType,
        frecuencia: nominaType === "ordinaria" ? selectedFrequency : "extraordinaria",
        tipoExtraordinario: nominaType === "extraordinaria" ? extraordinaryType : null,
        status: "pre_nomina",
        totalNeto: totalNetPay,
        totalEmpleados: selectedEmployees.size,
        empleadosData: empleadosData,
      };

      await apiRequest("POST", "/api/nominas", nominaPayload);
      await refetchNominas();
      queryClient.invalidateQueries({ queryKey: ["/api/nominas"] });
      
      setViewMode("list");
      setCurrentStep(0);
      
      toast({
        title: "Pre-Nómina creada",
        description: `Pre-nómina ${nominaType} para ${selectedEmployees.size} empleados - ${formatCurrency(totalNetPay)}. Requiere aprobación.`,
      });
    } catch (error: any) {
      toast({
        title: "Error al guardar",
        description: error.message || "No se pudo guardar la pre-nómina",
        variant: "destructive",
      });
    } finally {
      setIsCreatingNomina(false);
    }
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

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "secondary" | "outline" | "default"> = {
      draft: "secondary",
      pre_nomina: "outline",
      approved: "default",
      paid: "default",
    };

    const labels: Record<string, string> = {
      draft: "Borrador",
      pre_nomina: "Pre-Nómina",
      approved: "Aprobada",
      paid: "Pagada",
    };

    return <Badge variant={variants[status] || "secondary"}>{labels[status] || status}</Badge>;
  };

  // Function to view nomina details
  const viewNominaDetail = (nomina: Nomina) => {
    setSelectedNominaToView(nomina);
    setIsNominaDetailOpen(true);
  };

  // Function to approve nomina
  const approveNomina = async (nominaId: string) => {
    try {
      await apiRequest("POST", `/api/nominas/${nominaId}/aprobar`, {});
      await refetchNominas();
      setIsNominaDetailOpen(false);
      setSelectedNominaToView(null);
      toast({
        title: "Nómina aprobada",
        description: "La nómina ha sido aprobada exitosamente y está lista para pago.",
      });
    } catch (error: any) {
      toast({
        title: "Error al aprobar",
        description: error.message || "No se pudo aprobar la nómina",
        variant: "destructive",
      });
    }
  };

  // Function to make changes - go back to wizard with data preloaded
  const makeChangesToNomina = async (nomina: Nomina) => {
    // Set up the wizard with the nomina's data
    setNominaType(nomina.type);
    setSelectedFrequency(nomina.frequency);
    setSelectedPeriod(nomina.period);
    setExtraordinaryType(nomina.extraordinaryType || "");
    setSelectedEmployees(new Set(nomina.employeeIds));
    
    // Close modal and switch to wizard at step 1 (incidencias)
    setIsNominaDetailOpen(false);
    setSelectedNominaToView(null);
    setViewMode("create");
    setCurrentStep(1); // Go directly to incidencias step
    
    // Delete the old nomina from the backend since we're editing it
    try {
      await apiRequest("DELETE", `/api/nominas/${nomina.id}`);
      await refetchNominas();
    } catch (error) {
      console.error("Error deleting nomina for editing:", error);
    }
    
    toast({
      title: "Editando nómina",
      description: "Puedes modificar las incidencias y volver a crear la pre-nómina.",
    });
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
                      <div className="flex flex-col items-start gap-1">
                        {nomina.status === "paid" && nomina.fechaTimbrado ? (
                          <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                            <CheckCircle2 className="h-4 w-4" />
                            <span className="text-xs font-medium">Timbrada</span>
                          </div>
                        ) : null}
                        <div className="flex items-center gap-2">
                          {getStatusIcon(nomina.status)}
                          {getStatusBadge(nomina.status)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(nomina.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => viewNominaDetail(nomina)}
                        data-testid={`button-view-nomina-${nomina.id}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Modal de Detalle de Nómina */}
        <Dialog open={isNominaDetailOpen} onOpenChange={setIsNominaDetailOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            {selectedNominaToView && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3">
                    <span>Detalle de Nómina</span>
                    <Badge variant={selectedNominaToView.type === "extraordinaria" ? "default" : "outline"}>
                      {selectedNominaToView.type === "extraordinaria" ? "Extraordinaria" : "Ordinaria"}
                    </Badge>
                    <div className="flex flex-col items-start gap-1">
                      {selectedNominaToView.status === "paid" && selectedNominaToView.fechaTimbrado ? (
                        <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                          <CheckCircle2 className="h-4 w-4" />
                          <span className="text-xs font-medium">Timbrada</span>
                        </div>
                      ) : null}
                      {getStatusBadge(selectedNominaToView.status)}
                    </div>
                  </DialogTitle>
                  <DialogDescription>
                    Periodo: {selectedNominaToView.period} ({selectedNominaToView.frequency})
                    {selectedNominaToView.periodRange && (
                      <span className="ml-2 text-xs">
                        ({selectedNominaToView.periodRange.start} al {selectedNominaToView.periodRange.end})
                      </span>
                    )}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                  {/* Resumen de Totales */}
                  <div className="grid grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="pt-4">
                        <div className="text-sm text-muted-foreground">Empleados</div>
                        <div className="text-2xl font-bold">{selectedNominaToView.employeeCount}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="text-sm text-muted-foreground">Percepciones Nómina</div>
                        <div className="text-2xl font-bold text-primary font-mono">
                          {formatCurrency(selectedNominaToView.totalPercepcionesNomina || 0)}
                        </div>
                        {(selectedNominaToView.totalPercepcionesSDE || 0) > 0 && (
                          <>
                            <div className="text-sm text-muted-foreground mt-2">Percepciones Exentas (SDE)</div>
                            <div className="text-lg font-bold text-green-600 dark:text-green-400 font-mono">
                              {formatCurrency(selectedNominaToView.totalPercepcionesSDE || 0)}
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="text-sm text-muted-foreground">Total Deducciones</div>
                        <div className="text-2xl font-bold text-destructive font-mono">
                          {formatCurrency(selectedNominaToView.totalDeductions || 0)}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="text-sm text-muted-foreground">Neto a Pagar</div>
                        <div className="text-2xl font-bold text-primary font-mono">
                          {formatCurrency(selectedNominaToView.totalNet)}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Total de Incidencias */}
                  {selectedNominaToView.employeeDetails && selectedNominaToView.employeeDetails.length > 0 && (() => {
                    // Helper to get SDE amount from pagoAdicional.conceptos
                    const getPagoAdicionalMonto = (conceptos: { concepto: string; monto: number }[] | undefined, searchTerm: string) =>
                      conceptos?.find(c => c.concepto.toLowerCase().includes(searchTerm.toLowerCase()))?.monto || 0;

                    const totales = selectedNominaToView.employeeDetails.reduce((acc, emp) => {
                      const sdeConceptos = emp.pagoAdicional?.conceptos;
                      return {
                        // Incidencias count
                        faltas: acc.faltas + (emp.absences || 0),
                        incapacidades: acc.incapacidades + (emp.incapacities || 0),
                        diasDomingo: acc.diasDomingo + (emp.diasDomingo || 0),
                        diasFestivos: acc.diasFestivos + (emp.diasFestivos || 0),
                        diasVacaciones: acc.diasVacaciones + (emp.diasVacaciones || 0),
                        horasDobles: acc.horasDobles + (emp.horasDobles || 0),
                        horasTriples: acc.horasTriples + (emp.horasTriples || 0),
                        horasDescontadas: acc.horasDescontadas + (emp.horasDescontadas || 0),
                        retardos: acc.retardos + (emp.retardos || 0),
                        // Monetary totals for premium payments (nominal)
                        primaDominicalTotal: acc.primaDominicalTotal + (emp.primaDominical || 0),
                        pagoFestivosTotal: acc.pagoFestivosTotal + (emp.pagoFestivos || 0),
                        horasExtraTotal: acc.horasExtraTotal + (emp.horasDoblesPago || 0) + (emp.horasTriplesPago || 0),
                        vacacionesPagoTotal: acc.vacacionesPagoTotal + (emp.vacacionesPago || 0),
                        primaVacacionalTotal: acc.primaVacacionalTotal + (emp.primaVacacional || 0),
                        // SDE (exento) totals from pagoAdicional.conceptos
                        primaDominicalSDE: acc.primaDominicalSDE + getPagoAdicionalMonto(sdeConceptos, 'Prima Dominical'),
                        pagoFestivosSDE: acc.pagoFestivosSDE + getPagoAdicionalMonto(sdeConceptos, 'Días Festivos'),
                        horasDoblesSDE: acc.horasDoblesSDE + getPagoAdicionalMonto(sdeConceptos, 'Horas Extra Dobles'),
                        horasTriplesSDE: acc.horasTriplesSDE + getPagoAdicionalMonto(sdeConceptos, 'Horas Extra Triples'),
                        vacacionesSDE: acc.vacacionesSDE + getPagoAdicionalMonto(sdeConceptos, 'Vacaciones'),
                        primaVacacionalSDE: acc.primaVacacionalSDE + getPagoAdicionalMonto(sdeConceptos, 'Prima Vacacional'),
                      };
                    }, {
                      faltas: 0, incapacidades: 0, diasDomingo: 0, diasFestivos: 0, diasVacaciones: 0,
                      horasDobles: 0, horasTriples: 0, horasDescontadas: 0, retardos: 0,
                      primaDominicalTotal: 0, pagoFestivosTotal: 0, horasExtraTotal: 0,
                      vacacionesPagoTotal: 0, primaVacacionalTotal: 0,
                      primaDominicalSDE: 0, pagoFestivosSDE: 0, horasDoblesSDE: 0, horasTriplesSDE: 0,
                      vacacionesSDE: 0, primaVacacionalSDE: 0,
                    });

                    const hasIncidencias = totales.faltas > 0 || totales.incapacidades > 0 ||
                      totales.diasDomingo > 0 || totales.diasFestivos > 0 || totales.diasVacaciones > 0 ||
                      totales.horasDobles > 0 || totales.horasTriples > 0 || totales.horasDescontadas > 0 ||
                      totales.retardos > 0;

                    return (
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center gap-2">
                            <AlertCircle className="h-4 w-4" />
                            Total de Incidencias del Periodo
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {hasIncidencias ? (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              {totales.faltas > 0 && (
                                <div className="flex items-center gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                                  <div className="p-2 rounded-full bg-destructive/20">
                                    <XCircle className="h-4 w-4 text-destructive" />
                                  </div>
                                  <div>
                                    <div className="text-xs text-muted-foreground">Faltas</div>
                                    <div className="text-lg font-bold text-destructive">{totales.faltas} días</div>
                                  </div>
                                </div>
                              )}
                              {totales.incapacidades > 0 && (
                                <div className="flex items-center gap-3 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                                  <div className="p-2 rounded-full bg-orange-500/20">
                                    <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                                  </div>
                                  <div>
                                    <div className="text-xs text-muted-foreground">Incapacidades</div>
                                    <div className="text-lg font-bold text-orange-600 dark:text-orange-400">{totales.incapacidades} días</div>
                                  </div>
                                </div>
                              )}
                              {totales.diasDomingo > 0 && (
                                <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
                                  <div className="p-2 rounded-full bg-primary/20">
                                    <Calendar className="h-4 w-4 text-primary" />
                                  </div>
                                  <div>
                                    <div className="text-xs text-muted-foreground">Domingos Trabajados</div>
                                    <div className="text-lg font-bold text-primary">{totales.diasDomingo} días</div>
                                  </div>
                                </div>
                              )}
                              {totales.diasFestivos > 0 && (
                                <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                                  <div className="p-2 rounded-full bg-purple-500/20">
                                    <Star className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                  </div>
                                  <div>
                                    <div className="text-xs text-muted-foreground">Días Festivos</div>
                                    <div className="text-lg font-bold text-purple-600 dark:text-purple-400">{totales.diasFestivos} días</div>
                                  </div>
                                </div>
                              )}
                              {totales.diasVacaciones > 0 && (
                                <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                                  <div className="p-2 rounded-full bg-green-500/20">
                                    <Sun className="h-4 w-4 text-green-600 dark:text-green-400" />
                                  </div>
                                  <div>
                                    <div className="text-xs text-muted-foreground">Días de Vacaciones</div>
                                    <div className="text-lg font-bold text-green-600 dark:text-green-400">{totales.diasVacaciones} días</div>
                                  </div>
                                </div>
                              )}
                              {(totales.horasDobles > 0 || totales.horasTriples > 0) && (
                                <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                                  <div className="p-2 rounded-full bg-blue-500/20">
                                    <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                  </div>
                                  <div>
                                    <div className="text-xs text-muted-foreground">Horas Extra</div>
                                    <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                      {totales.horasDobles + totales.horasTriples}h
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      ({totales.horasDobles}h dobles, {totales.horasTriples}h triples)
                                    </div>
                                  </div>
                                </div>
                              )}
                              {totales.horasDescontadas > 0 && (
                                <div className="flex items-center gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                                  <div className="p-2 rounded-full bg-red-500/20">
                                    <MinusCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                                  </div>
                                  <div>
                                    <div className="text-xs text-muted-foreground">Horas Descontadas</div>
                                    <div className="text-lg font-bold text-red-600 dark:text-red-400">{totales.horasDescontadas}h</div>
                                  </div>
                                </div>
                              )}
                              {totales.retardos > 0 && (
                                <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                  <div className="p-2 rounded-full bg-amber-500/20">
                                    <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                  </div>
                                  <div>
                                    <div className="text-xs text-muted-foreground">Retardos</div>
                                    <div className="text-lg font-bold text-amber-600 dark:text-amber-400">{totales.retardos}</div>
                                  </div>
                                </div>
                              )}
                              {/* Pagos Adicionales por Incidencias (Nominal + SDE) */}
                              {(totales.primaDominicalTotal > 0 || totales.pagoFestivosTotal > 0 ||
                                totales.horasExtraTotal > 0 || totales.vacacionesPagoTotal > 0 ||
                                totales.primaDominicalSDE > 0 || totales.pagoFestivosSDE > 0 ||
                                totales.horasDoblesSDE > 0 || totales.horasTriplesSDE > 0) && (
                                <div className="col-span-full mt-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
                                  <div className="text-sm font-medium mb-3 flex items-center gap-2">
                                    <DollarSign className="h-4 w-4 text-primary" />
                                    Pagos Adicionales por Incidencias
                                  </div>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    {(totales.primaDominicalTotal > 0 || totales.primaDominicalSDE > 0) && (
                                      <div>
                                        <div className="text-muted-foreground">Prima Dominical (25%)</div>
                                        <div className="font-mono font-semibold text-primary">
                                          +{formatCurrency(totales.primaDominicalTotal + totales.primaDominicalSDE)}
                                        </div>
                                        {totales.primaDominicalSDE > 0 && (
                                          <div className="text-xs text-muted-foreground">
                                            Nómina: {formatCurrency(totales.primaDominicalTotal)} + SDE: {formatCurrency(totales.primaDominicalSDE)}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                    {(totales.pagoFestivosTotal > 0 || totales.pagoFestivosSDE > 0) && (
                                      <div>
                                        <div className="text-muted-foreground">Días Festivos (3x)</div>
                                        <div className="font-mono font-semibold text-primary">
                                          +{formatCurrency(totales.pagoFestivosTotal + totales.pagoFestivosSDE)}
                                        </div>
                                        {totales.pagoFestivosSDE > 0 && (
                                          <div className="text-xs text-muted-foreground">
                                            Nómina: {formatCurrency(totales.pagoFestivosTotal)} + SDE: {formatCurrency(totales.pagoFestivosSDE)}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                    {(totales.horasExtraTotal > 0 || totales.horasDoblesSDE > 0 || totales.horasTriplesSDE > 0) && (
                                      <div>
                                        <div className="text-muted-foreground">Horas Extra</div>
                                        <div className="font-mono font-semibold text-primary">
                                          +{formatCurrency(totales.horasExtraTotal + totales.horasDoblesSDE + totales.horasTriplesSDE)}
                                        </div>
                                        {(totales.horasDoblesSDE > 0 || totales.horasTriplesSDE > 0) && (
                                          <div className="text-xs text-muted-foreground">
                                            Nómina: {formatCurrency(totales.horasExtraTotal)} + SDE: {formatCurrency(totales.horasDoblesSDE + totales.horasTriplesSDE)}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                    {(totales.vacacionesPagoTotal > 0 || totales.primaVacacionalTotal > 0 ||
                                      totales.vacacionesSDE > 0 || totales.primaVacacionalSDE > 0) && (
                                      <div>
                                        <div className="text-muted-foreground">Vacaciones + Prima</div>
                                        <div className="font-mono font-semibold text-primary">
                                          +{formatCurrency(totales.vacacionesPagoTotal + totales.primaVacacionalTotal + totales.vacacionesSDE + totales.primaVacacionalSDE)}
                                        </div>
                                        {(totales.vacacionesSDE > 0 || totales.primaVacacionalSDE > 0) && (
                                          <div className="text-xs text-muted-foreground">
                                            Nómina: {formatCurrency(totales.vacacionesPagoTotal + totales.primaVacacionalTotal)} + SDE: {formatCurrency(totales.vacacionesSDE + totales.primaVacacionalSDE)}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-center py-4 text-muted-foreground">
                              <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-600 dark:text-green-400" />
                              Sin incidencias en este periodo
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })()}

                  {/* Advertencias de Cumplimiento LFT */}
                  {selectedNominaToView.employeeDetails && selectedNominaToView.employeeDetails.length > 0 && (() => {
                    const warnings: { type: 'warning' | 'info'; message: string; detail: string }[] = [];

                    // Calculate totales for warnings
                    const wTotales = selectedNominaToView.employeeDetails.reduce((acc, emp) => ({
                      horasDobles: acc.horasDobles + (emp.horasDobles || 0),
                      horasTriples: acc.horasTriples + (emp.horasTriples || 0),
                      diasFestivos: acc.diasFestivos + (emp.diasFestivos || 0),
                    }), { horasDobles: 0, horasTriples: 0, diasFestivos: 0 });

                    // Check overtime limits (Art. 66-68 LFT: max 9 hrs/week)
                    const employeesWithExcessiveOvertime = selectedNominaToView.employeeDetails.filter(
                      emp => ((emp.horasDobles || 0) + (emp.horasTriples || 0)) > 9
                    );
                    if (employeesWithExcessiveOvertime.length > 0) {
                      warnings.push({
                        type: 'warning',
                        message: `${employeesWithExcessiveOvertime.length} empleado(s) con horas extra excesivas (>9 hrs/semana)`,
                        detail: 'Art. 66-68 LFT: Máximo 9 horas extra por semana'
                      });
                    }

                    // Check for triple hours (indicates excessive overtime)
                    if (wTotales.horasTriples > 0) {
                      warnings.push({
                        type: 'info',
                        message: `${wTotales.horasTriples} horas triples generadas (pago al 300%)`,
                        detail: 'Art. 68 LFT: Horas que exceden 9/semana se pagan triple'
                      });
                    }

                    // Check for worked holidays
                    if (wTotales.diasFestivos > 0) {
                      warnings.push({
                        type: 'info',
                        message: `${wTotales.diasFestivos} día(s) festivo(s) trabajados - pago triple aplicado`,
                        detail: 'Art. 75 LFT: Días festivos obligatorios se pagan al 300%'
                      });
                    }

                    if (warnings.length === 0) return null;

                    return (
                      <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium flex items-center gap-2 text-amber-700 dark:text-amber-400">
                            <AlertTriangle className="h-4 w-4" />
                            Puntos de Atención ({warnings.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {warnings.map((w, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-sm">
                              {w.type === 'warning' ? (
                                <AlertTriangle className="h-4 w-4 mt-0.5 text-amber-600 dark:text-amber-400" />
                              ) : (
                                <AlertCircle className="h-4 w-4 mt-0.5 text-blue-500" />
                              )}
                              <div>
                                <div className={w.type === 'warning' ? 'text-amber-700 dark:text-amber-400' : 'text-muted-foreground'}>
                                  {w.message}
                                </div>
                                <div className="text-xs text-muted-foreground">{w.detail}</div>
                              </div>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    );
                  })()}

                  {/* Detalle por Empleado */}
                  {selectedNominaToView.employeeDetails && selectedNominaToView.employeeDetails.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Detalle por Empleado</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Accordion type="multiple" className="space-y-2">
                          {selectedNominaToView.employeeDetails.map((employee) => (
                            <AccordionItem 
                              key={employee.id} 
                              value={employee.id}
                              className="border rounded-lg px-4"
                              data-testid={`accordion-detail-employee-${employee.id}`}
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
                                      <div className="font-mono text-primary">{formatCurrency(employee.earnings + (employee.pagoAdicional?.montoTotal || 0))}</div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-muted-foreground text-xs">Deducciones</div>
                                      <div className="font-mono text-destructive">{formatCurrency(employee.deductions)}</div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-muted-foreground text-xs">Neto</div>
                                      <div className="font-mono font-semibold text-lg">{formatCurrency(employee.netoAPagarTotal || employee.netPay)}</div>
                                    </div>
                                  </div>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="pt-4 pb-2">
                                <div className="grid grid-cols-3 gap-4">
                                  {/* Salario Neto Real */}
                                  <Card>
                                    <CardHeader className="pb-3">
                                      <CardTitle className="text-sm font-medium">Salario Neto Real</CardTitle>
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
                                      {employee.diasFestivos > 0 && (
                                        <div className="flex justify-between text-purple-600 dark:text-purple-400">
                                          <span>Días festivos trabajados</span>
                                          <span className="font-mono">+{employee.diasFestivos}</span>
                                        </div>
                                      )}
                                      {employee.diasVacaciones > 0 && (
                                        <div className="flex justify-between text-green-600 dark:text-green-400">
                                          <span>Días de vacaciones</span>
                                          <span className="font-mono">+{employee.diasVacaciones}</span>
                                        </div>
                                      )}
                                      {(employee.horasDobles > 0 || employee.horasTriples > 0) && (
                                        <div className="flex justify-between text-blue-600 dark:text-blue-400">
                                          <span>Horas extra</span>
                                          <span className="font-mono">+{employee.horasDobles + employee.horasTriples}h</span>
                                        </div>
                                      )}
                                      <div className="h-px bg-border my-2" />
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Salario diario</span>
                                        <span className="font-mono">{formatCurrency(employee.salarioDiarioReal || employee.salary / 30)}</span>
                                      </div>
                                      {employee.salarioDiarioExento > 0 && (
                                        <>
                                          <div className="flex justify-between text-xs">
                                            <span className="text-muted-foreground pl-2">- Nominal (CFDI)</span>
                                            <span className="font-mono">{formatCurrency(employee.salarioDiarioNominal)}</span>
                                          </div>
                                          <div className="flex justify-between text-xs">
                                            <span className="text-green-600 dark:text-green-400 pl-2">- Exento (SDE)</span>
                                            <span className="font-mono text-green-600 dark:text-green-400">{formatCurrency(employee.salarioDiarioExento)}</span>
                                          </div>
                                        </>
                                      )}
                                      <div className="flex justify-between font-semibold">
                                        <span>Salario proporcional</span>
                                        <span className="font-mono">{formatCurrency(employee.baseSalary)}</span>
                                      </div>
                                    </CardContent>
                                  </Card>

                                  {/* Desglose de Percepciones */}
                                  <Card>
                                    <CardHeader className="pb-3">
                                      <CardTitle className="text-sm font-medium">Desglose de Percepciones</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2 text-sm">
                                      {/* Backend percepciones (includes Sueldo Base) */}
                                      {employee.backendPercepciones && employee.backendPercepciones.length > 0 ? (
                                        employee.backendPercepciones.map((p: any, idx: number) => (
                                          <div key={idx} className="flex justify-between gap-2">
                                            <span className="text-muted-foreground">
                                              {p.clave === 'P001' && employee.absences > 0
                                                ? `${p.nombre} (${employee.daysWorked}/${employee.periodDays} días)`
                                                : p.nombre}
                                            </span>
                                            <span className="font-mono text-primary">{formatCurrency(p.importe)}</span>
                                          </div>
                                        ))
                                      ) : (
                                        <>
                                          {employee.percepciones.map((concepto) => (
                                            <div key={concepto.id} className="flex justify-between gap-2">
                                              <span className="text-muted-foreground">{concepto.name}</span>
                                              <span className="font-mono text-primary">{formatCurrency(concepto.amount)}</span>
                                            </div>
                                          ))}
                                        </>
                                      )}
                                      {employee.primaDominical > 0 && (
                                        <div className="flex justify-between">
                                          <span className="text-muted-foreground">Prima Dominical (25%)</span>
                                          <span className="font-mono text-primary">{formatCurrency(employee.primaDominical)}</span>
                                        </div>
                                      )}
                                      {employee.pagoFestivos > 0 && (
                                        <div className="flex justify-between">
                                          <span className="text-muted-foreground">Días Festivos ({employee.diasFestivos}d × 200%)</span>
                                          <span className="font-mono text-purple-600 dark:text-purple-400">{formatCurrency(employee.pagoFestivos)}</span>
                                        </div>
                                      )}
                                      {(employee.horasDoblesPago > 0 || employee.horasTriplesPago > 0) && (
                                        <div className="space-y-1">
                                          <div className="font-medium text-foreground">Horas Extra:</div>
                                          {employee.horasDoblesPago > 0 && (
                                            <div className="flex justify-between pl-3">
                                              <span className="text-muted-foreground">
                                                Dobles {employee.horasDobles}h (200%)
                                              </span>
                                              <span className="font-mono text-primary">{formatCurrency(employee.horasDoblesPago)}</span>
                                            </div>
                                          )}
                                          {employee.horasTriplesPago > 0 && (
                                            <div className="flex justify-between pl-3">
                                              <span className="text-muted-foreground">
                                                Triples {employee.horasTriples}h (300%)
                                              </span>
                                              <span className="font-mono text-primary">{formatCurrency(employee.horasTriplesPago)}</span>
                                            </div>
                                          )}
                                          {(employee.horasExtraExento > 0 || employee.horasExtraGravado > 0) && (
                                            <div className="pl-3 pt-1 border-t border-dashed border-muted mt-1">
                                              <div className="flex justify-between text-xs">
                                                <span className="text-green-600 dark:text-green-400">Exento ISR</span>
                                                <span className="font-mono text-green-600 dark:text-green-400">{formatCurrency(employee.horasExtraExento)}</span>
                                              </div>
                                              <div className="flex justify-between text-xs">
                                                <span className="text-orange-600 dark:text-orange-400">Gravado ISR</span>
                                                <span className="font-mono text-orange-600 dark:text-orange-400">{formatCurrency(employee.horasExtraGravado)}</span>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                      {employee.vacacionesPago > 0 && (
                                        <div className="flex justify-between">
                                          <span className="text-muted-foreground">Vacaciones ({employee.diasVacaciones} días)</span>
                                          <span className="font-mono text-primary">{formatCurrency(employee.vacacionesPago)}</span>
                                        </div>
                                      )}
                                      {employee.primaVacacional > 0 && (
                                        <div className="flex justify-between">
                                          <span className="text-muted-foreground">Prima Vacacional (25%)</span>
                                          <span className="font-mono text-primary">{formatCurrency(employee.primaVacacional)}</span>
                                        </div>
                                      )}
                                      {(!employee.backendPercepciones || employee.backendPercepciones.length === 0) && employee.percepciones.length === 0 && employee.primaDominical === 0 && employee.pagoFestivos === 0 && employee.horasDoblesPago === 0 && employee.horasTriplesPago === 0 && employee.vacacionesPago === 0 && employee.primaVacacional === 0 && !employee.pagoAdicional && (
                                        <div className="text-muted-foreground text-center py-4">
                                          Sin percepciones configuradas
                                        </div>
                                      )}
                                      {/* Pago Adicional (SDE) - en verde */}
                                      {employee.pagoAdicional && employee.pagoAdicional.montoTotal > 0 && (
                                        <>
                                          <div className="h-px bg-green-200 dark:bg-green-800 my-2" />
                                          <div className="text-xs text-green-600 dark:text-green-400 font-medium mb-1">Pago Adicional (SDE):</div>
                                          {employee.pagoAdicional.conceptos.map((concepto: any, idx: number) => (
                                            <div key={idx} className="flex justify-between gap-2">
                                              <span className="text-green-600 dark:text-green-400">{concepto.concepto}</span>
                                              <span className="font-mono text-green-600 dark:text-green-400">{formatCurrency(concepto.monto)}</span>
                                            </div>
                                          ))}
                                        </>
                                      )}
                                      <div className="h-px bg-border my-2" />
                                      <div className="flex justify-between font-semibold">
                                        <span>Total Percepciones</span>
                                        <span className="font-mono text-primary">{formatCurrency(employee.earnings + (employee.pagoAdicional?.montoTotal || 0))}</span>
                                      </div>
                                    </CardContent>
                                  </Card>

                                  {/* Deducciones */}
                                  <Card>
                                    <CardHeader className="pb-3">
                                      <CardTitle className="text-sm font-medium">Deducciones</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2 text-sm">
                                      <div className="space-y-1">
                                        <div className="font-medium text-foreground">IMSS Trabajador:</div>
                                        <div className="flex justify-between pl-3">
                                          <span className="text-muted-foreground">Prestaciones en Dinero (0.25%)</span>
                                          <span className="font-mono text-destructive">{formatCurrency(employee.imssPrestacionesDinero)}</span>
                                        </div>
                                        <div className="flex justify-between pl-3">
                                          <span className="text-muted-foreground">Gastos Médicos (0.375%)</span>
                                          <span className="font-mono text-destructive">{formatCurrency(employee.imssGastosMedicos)}</span>
                                        </div>
                                        <div className="flex justify-between pl-3">
                                          <span className="text-muted-foreground">Invalidez y Vida (0.625%)</span>
                                          <span className="font-mono text-destructive">{formatCurrency(employee.imssInvalidezVida)}</span>
                                        </div>
                                        <div className="flex justify-between pl-3">
                                          <span className="text-muted-foreground">Cesantía y Vejez (1.125%)</span>
                                          <span className="font-mono text-destructive">{formatCurrency(employee.imssCesantiaVejez)}</span>
                                        </div>
                                        {employee.imssExcedente3Umas > 0 && (
                                          <div className="flex justify-between pl-3">
                                            <span className="text-muted-foreground">Excedente 3 UMAs (0.40%)</span>
                                            <span className="font-mono text-destructive">{formatCurrency(employee.imssExcedente3Umas)}</span>
                                          </div>
                                        )}
                                        <div className="flex justify-between pl-3 pt-1 border-t border-dashed border-muted">
                                          <span className="text-muted-foreground font-medium">Subtotal IMSS</span>
                                          <span className="font-mono text-destructive font-medium">{formatCurrency(employee.imssTotal)}</span>
                                        </div>
                                      </div>
                                      
                                      {employee.descuentoHoras > 0 && (
                                        <div className="space-y-1 pt-2">
                                          <div className="font-medium text-foreground">Descuentos por Tiempo:</div>
                                          <div className="flex justify-between pl-3">
                                            <span className="text-muted-foreground">
                                              Horas descontadas ({employee.horasDescontadas} hrs × salario normal)
                                            </span>
                                            <span className="font-mono text-destructive">{formatCurrency(employee.descuentoHoras)}</span>
                                          </div>
                                          <div className="flex justify-between pl-3 text-xs text-muted-foreground italic">
                                            <span>* Reduce la base gravable del ISR</span>
                                          </div>
                                        </div>
                                      )}

                                      <div className="space-y-1 pt-2">
                                        <div className="font-medium text-foreground">ISR (Impuesto Sobre la Renta) - Tasa {(employee.isrTasa ?? 0).toFixed(2)}%:</div>
                                        <div className="flex justify-between pl-3">
                                          <span className="text-muted-foreground">ISR Causado</span>
                                          <span className="font-mono text-destructive">{formatCurrency(employee.isrCausado)}</span>
                                        </div>
                                        {employee.subsidioEmpleo > 0 && (
                                          <div className="flex justify-between pl-3">
                                            <span className="text-green-600 dark:text-green-400">(-) Subsidio al Empleo</span>
                                            <span className="font-mono text-green-600 dark:text-green-400">-{formatCurrency(employee.subsidioEmpleo)}</span>
                                          </div>
                                        )}
                                        <div className="flex justify-between pl-3 pt-1 border-t border-dashed border-muted">
                                          <span className="text-muted-foreground font-medium">ISR a Retener</span>
                                          <span className="font-mono text-destructive font-medium">{formatCurrency(employee.isrRetenido)}</span>
                                        </div>
                                      </div>
                                      
                                      {employee.deducciones.length > 0 && (
                                        <div className="space-y-1 pt-2">
                                          <div className="font-medium text-foreground">Otras Deducciones:</div>
                                          {employee.deducciones.map((concepto) => (
                                            <div key={concepto.id} className="flex justify-between pl-3">
                                              <span className="text-muted-foreground">{concepto.name}</span>
                                              <span className="font-mono text-destructive">{formatCurrency(concepto.amount)}</span>
                                            </div>
                                          ))}
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
                          ))}
                        </Accordion>
                      </CardContent>
                    </Card>
                  )}
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                  {selectedNominaToView.status === "pre_nomina" && (
                    <>
                      <Button 
                        variant="outline" 
                        onClick={() => makeChangesToNomina(selectedNominaToView)}
                        data-testid="button-make-changes"
                      >
                        Realizar Cambios
                      </Button>
                      <Button 
                        onClick={() => approveNomina(selectedNominaToView.id)}
                        data-testid="button-approve-nomina"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Aprobar Nómina
                      </Button>
                    </>
                  )}
                  {selectedNominaToView.status === "approved" && (
                    <div className="flex flex-wrap gap-2 w-full justify-between">
                      <div className="flex gap-2">
                        <Button 
                          variant="outline"
                          onClick={async () => {
                            try {
                              const response = await fetch(`/api/nominas/${selectedNominaToView.id}/layout-bancario/bbva`, {
                                credentials: 'include'
                              });
                              if (!response.ok) throw new Error('Error al generar layout');
                              const blob = await response.blob();
                              const disposition = response.headers.get('Content-Disposition');
                              const filenameMatch = disposition?.match(/filename="(.+)"/);
                              const filename = filenameMatch ? filenameMatch[1] : 'DISPERSION_BBVA.txt';
                              const url = window.URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = filename;
                              document.body.appendChild(a);
                              a.click();
                              window.URL.revokeObjectURL(url);
                              a.remove();
                              toast({ title: "Layout descargado", description: `Archivo ${filename} generado` });
                            } catch (error: any) {
                              toast({ title: "Error", description: error.message, variant: "destructive" });
                            }
                          }}
                          data-testid="button-download-layout-bbva"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Layout BBVA
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={async () => {
                            try {
                              const response = await fetch(`/api/nominas/${selectedNominaToView.id}/layout-bancario/santander`, {
                                credentials: 'include'
                              });
                              if (!response.ok) throw new Error('Error al generar layout');
                              const blob = await response.blob();
                              const disposition = response.headers.get('Content-Disposition');
                              const filenameMatch = disposition?.match(/filename="(.+)"/);
                              const filename = filenameMatch ? filenameMatch[1] : 'DISPERSION_SANTANDER.txt';
                              const url = window.URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = filename;
                              document.body.appendChild(a);
                              a.click();
                              window.URL.revokeObjectURL(url);
                              a.remove();
                              toast({ title: "Layout descargado", description: `Archivo ${filename} generado` });
                            } catch (error: any) {
                              toast({ title: "Error", description: error.message, variant: "destructive" });
                            }
                          }}
                          data-testid="button-download-layout-santander"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Layout Santander
                        </Button>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          onClick={async () => {
                            try {
                              await apiRequest("POST", `/api/nominas/${selectedNominaToView.id}/pagar`, {});
                              await refetchNominas();
                              setIsNominaDetailOpen(false);
                              setSelectedNominaToView(null);
                              toast({ title: "Nómina pagada", description: "La nómina ha sido marcada como pagada exitosamente." });
                            } catch (error: any) {
                              toast({ title: "Error", description: error.message, variant: "destructive" });
                            }
                          }}
                          data-testid="button-mark-paid"
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Pagado
                        </Button>
                        <Button variant="outline" onClick={() => setIsNominaDetailOpen(false)}>
                          Cerrar
                        </Button>
                      </div>
                    </div>
                  )}
                  {selectedNominaToView.status === "paid" && (
                    <div className="flex flex-col gap-3 w-full">
                      <div className="flex items-center gap-2">
                        {(selectedNominaToView as any).fechaTimbrado ? (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" data-testid="badge-timbrada">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Timbrada
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100" data-testid="badge-timbrado-pendiente">
                            <Clock className="h-3 w-3 mr-1" />
                            Timbrado Pendiente
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 w-full justify-between">
                        <div className="flex gap-2">
                          <Button 
                            variant="outline"
                            onClick={async () => {
                              try {
                                const response = await fetch(`/api/nominas/${selectedNominaToView.id}/layout-bancario/bbva`, {
                                  credentials: 'include'
                                });
                                if (!response.ok) throw new Error('Error al generar layout');
                                const blob = await response.blob();
                                const disposition = response.headers.get('Content-Disposition');
                                const filenameMatch = disposition?.match(/filename="(.+)"/);
                                const filename = filenameMatch ? filenameMatch[1] : 'DISPERSION_BBVA.txt';
                                const url = window.URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = filename;
                                document.body.appendChild(a);
                                a.click();
                                window.URL.revokeObjectURL(url);
                                a.remove();
                                toast({ title: "Layout descargado", description: `Archivo ${filename} generado` });
                              } catch (error: any) {
                                toast({ title: "Error", description: error.message, variant: "destructive" });
                              }
                            }}
                            data-testid="button-download-layout-bbva-paid"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Layout BBVA
                          </Button>
                          <Button 
                            variant="outline"
                            onClick={async () => {
                              try {
                                const response = await fetch(`/api/nominas/${selectedNominaToView.id}/layout-bancario/santander`, {
                                  credentials: 'include'
                                });
                                if (!response.ok) throw new Error('Error al generar layout');
                                const blob = await response.blob();
                                const disposition = response.headers.get('Content-Disposition');
                                const filenameMatch = disposition?.match(/filename="(.+)"/);
                                const filename = filenameMatch ? filenameMatch[1] : 'DISPERSION_SANTANDER.txt';
                                const url = window.URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = filename;
                                document.body.appendChild(a);
                                a.click();
                                window.URL.revokeObjectURL(url);
                                a.remove();
                                toast({ title: "Layout descargado", description: `Archivo ${filename} generado` });
                              } catch (error: any) {
                                toast({ title: "Error", description: error.message, variant: "destructive" });
                              }
                            }}
                            data-testid="button-download-layout-santander-paid"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Layout Santander
                          </Button>
                        </div>
                        <div className="flex gap-2">
                          {!(selectedNominaToView as any).fechaTimbrado && (
                            <Button 
                              onClick={async () => {
                                try {
                                  await apiRequest("POST", `/api/nominas/${selectedNominaToView.id}/timbrar`, {});
                                  await refetchNominas();
                                  setIsNominaDetailOpen(false);
                                  setSelectedNominaToView(null);
                                  toast({ title: "Recibos timbrados", description: "Los recibos de nómina han sido timbrados exitosamente." });
                                } catch (error: any) {
                                  toast({ title: "Error", description: error.message, variant: "destructive" });
                                }
                              }}
                              data-testid="button-timbrar"
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              Timbrar Recibos
                            </Button>
                          )}
                          <Button variant="outline" onClick={() => setIsNominaDetailOpen(false)}>
                            Cerrar
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
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
              {/* Plantilla Selector */}
              {showPlantillaSelector && (
                <div className="p-4 bg-muted/30 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="plantilla" className="text-sm font-medium">Plantilla de Nómina</Label>
                      <p className="text-xs text-muted-foreground">
                        {isLoadingPlantillaData 
                          ? "Cargando conceptos de la plantilla..." 
                          : "Usa una plantilla predefinida para cargar los conceptos automáticamente"
                        }
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isLoadingPlantillaData && (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      )}
                      <Select 
                        value={selectedPlantillaId || "none"} 
                        onValueChange={(v) => setSelectedPlantillaId(v === "none" ? null : v)}
                        disabled={isLoadingPlantillaData}
                      >
                        <SelectTrigger id="plantilla" className="w-64" data-testid="select-plantilla">
                          <SelectValue placeholder="Selecciona plantilla" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sin plantilla</SelectItem>
                          {plantillas.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              <div className="flex items-center gap-2">
                                {p.id === defaultPlantillaId && <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />}
                                {p.nombre}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

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
                  <Label htmlFor="empresa">Filtrar por Empresa</Label>
                  <Select value={empresaFilter} onValueChange={setEmpresaFilter}>
                    <SelectTrigger id="empresa" data-testid="select-empresa-filter">
                      <SelectValue />
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
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nombre o RFC..."
                    value={employeeSearch}
                    onChange={(e) => setEmployeeSearch(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-payroll-employees"
                  />
                </div>
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
                    <TableHead className="text-right">Salario Neto Real</TableHead>
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
                const firstEmployee = selectedEmployeesArray[0];
                const clienteId = firstEmployee?.clienteId || "";
                const empresaId = firstEmployee?.empresaId || "";

                return (
                  <IncidenciasAsistenciaGrid
                    fechaInicio={queryPeriodRange.start}
                    fechaFin={queryPeriodRange.end}
                    clienteId={clienteId}
                    empresaId={empresaId}
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
              {isLoadingPayroll ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-muted-foreground">Calculando nómina...</p>
                </div>
              ) : (
              <>
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

              {/* Total de Incidencias del Periodo - Step 2 */}
              {selectedEmployeesData.length > 0 && (() => {
                // Helper to get SDE amount from pagoAdicional.conceptos
                const getPagoAdicionalMonto = (conceptos: { concepto: string; monto: number }[] | undefined, searchTerm: string) =>
                  conceptos?.find(c => c.concepto.toLowerCase().includes(searchTerm.toLowerCase()))?.monto || 0;

                const totales = selectedEmployeesData.reduce((acc, emp) => {
                  const sdeConceptos = emp.pagoAdicional?.conceptos;
                  return {
                    // Incidencias count
                    faltas: acc.faltas + (emp.absences || 0),
                    incapacidades: acc.incapacidades + (emp.incapacities || 0),
                    diasDomingo: acc.diasDomingo + (emp.diasDomingo || 0),
                    diasFestivos: acc.diasFestivos + (emp.diasFestivos || 0),
                    diasVacaciones: acc.diasVacaciones + (emp.diasVacaciones || 0),
                    horasDobles: acc.horasDobles + (emp.horasDobles || 0),
                    horasTriples: acc.horasTriples + (emp.horasTriples || 0),
                    horasDescontadas: acc.horasDescontadas + (emp.horasDescontadas || 0),
                    retardos: acc.retardos + (emp.retardos || 0),
                    // Monetary totals for premium payments (nominal)
                    primaDominicalTotal: acc.primaDominicalTotal + (emp.primaDominical || 0),
                    pagoFestivosTotal: acc.pagoFestivosTotal + (emp.pagoFestivos || 0),
                    horasExtraTotal: acc.horasExtraTotal + (emp.horasDoblesPago || 0) + (emp.horasTriplesPago || 0),
                    vacacionesPagoTotal: acc.vacacionesPagoTotal + (emp.vacacionesPago || 0),
                    primaVacacionalTotal: acc.primaVacacionalTotal + (emp.primaVacacional || 0),
                    // SDE (exento) totals from pagoAdicional.conceptos
                    primaDominicalSDE: acc.primaDominicalSDE + getPagoAdicionalMonto(sdeConceptos, 'Prima Dominical'),
                    pagoFestivosSDE: acc.pagoFestivosSDE + getPagoAdicionalMonto(sdeConceptos, 'Días Festivos'),
                    horasDoblesSDE: acc.horasDoblesSDE + getPagoAdicionalMonto(sdeConceptos, 'Horas Extra Dobles'),
                    horasTriplesSDE: acc.horasTriplesSDE + getPagoAdicionalMonto(sdeConceptos, 'Horas Extra Triples'),
                    vacacionesSDE: acc.vacacionesSDE + getPagoAdicionalMonto(sdeConceptos, 'Vacaciones'),
                    primaVacacionalSDE: acc.primaVacacionalSDE + getPagoAdicionalMonto(sdeConceptos, 'Prima Vacacional'),
                  };
                }, {
                  faltas: 0, incapacidades: 0, diasDomingo: 0, diasFestivos: 0, diasVacaciones: 0,
                  horasDobles: 0, horasTriples: 0, horasDescontadas: 0, retardos: 0,
                  primaDominicalTotal: 0, pagoFestivosTotal: 0, horasExtraTotal: 0,
                  vacacionesPagoTotal: 0, primaVacacionalTotal: 0,
                  primaDominicalSDE: 0, pagoFestivosSDE: 0, horasDoblesSDE: 0, horasTriplesSDE: 0,
                  vacacionesSDE: 0, primaVacacionalSDE: 0,
                });

                const hasIncidencias = totales.faltas > 0 || totales.incapacidades > 0 ||
                  totales.diasDomingo > 0 || totales.diasFestivos > 0 || totales.diasVacaciones > 0 ||
                  totales.horasDobles > 0 || totales.horasTriples > 0 || totales.horasDescontadas > 0 ||
                  totales.retardos > 0;

                // Compliance warnings
                const warnings: { type: 'warning' | 'info'; message: string; detail: string }[] = [];
                const employeesWithExcessiveOvertime = selectedEmployeesData.filter(
                  emp => ((emp.horasDobles || 0) + (emp.horasTriples || 0)) > 9
                );
                if (employeesWithExcessiveOvertime.length > 0) {
                  warnings.push({
                    type: 'warning',
                    message: `${employeesWithExcessiveOvertime.length} empleado(s) con horas extra excesivas (>9 hrs/semana)`,
                    detail: 'Art. 66-68 LFT: Máximo 9 horas extra por semana'
                  });
                }
                if (totales.horasTriples > 0) {
                  warnings.push({
                    type: 'info',
                    message: `${totales.horasTriples} horas triples generadas (pago al 300%)`,
                    detail: 'Art. 68 LFT: Horas que exceden 9/semana se pagan triple'
                  });
                }
                if (totales.diasFestivos > 0) {
                  warnings.push({
                    type: 'info',
                    message: `${totales.diasFestivos} día(s) festivo(s) trabajados - pago triple aplicado`,
                    detail: 'Art. 75 LFT: Días festivos obligatorios se pagan al 300%'
                  });
                }

                return (
                  <>
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" />
                          Total de Incidencias del Periodo
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {hasIncidencias ? (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {totales.faltas > 0 && (
                              <div className="flex items-center gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                                <div className="p-2 rounded-full bg-destructive/20">
                                  <XCircle className="h-4 w-4 text-destructive" />
                                </div>
                                <div>
                                  <div className="text-xs text-muted-foreground">Faltas</div>
                                  <div className="text-lg font-bold text-destructive">{totales.faltas} días</div>
                                </div>
                              </div>
                            )}
                            {totales.incapacidades > 0 && (
                              <div className="flex items-center gap-3 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                                <div className="p-2 rounded-full bg-orange-500/20">
                                  <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                                </div>
                                <div>
                                  <div className="text-xs text-muted-foreground">Incapacidades</div>
                                  <div className="text-lg font-bold text-orange-600 dark:text-orange-400">{totales.incapacidades} días</div>
                                </div>
                              </div>
                            )}
                            {totales.diasDomingo > 0 && (
                              <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
                                <div className="p-2 rounded-full bg-primary/20">
                                  <Calendar className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                  <div className="text-xs text-muted-foreground">Domingos Trabajados</div>
                                  <div className="text-lg font-bold text-primary">{totales.diasDomingo} días</div>
                                </div>
                              </div>
                            )}
                            {totales.diasFestivos > 0 && (
                              <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                                <div className="p-2 rounded-full bg-purple-500/20">
                                  <Star className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                  <div className="text-xs text-muted-foreground">Días Festivos</div>
                                  <div className="text-lg font-bold text-purple-600 dark:text-purple-400">{totales.diasFestivos} días</div>
                                </div>
                              </div>
                            )}
                            {totales.diasVacaciones > 0 && (
                              <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                                <div className="p-2 rounded-full bg-green-500/20">
                                  <Sun className="h-4 w-4 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                  <div className="text-xs text-muted-foreground">Días de Vacaciones</div>
                                  <div className="text-lg font-bold text-green-600 dark:text-green-400">{totales.diasVacaciones} días</div>
                                </div>
                              </div>
                            )}
                            {(totales.horasDobles > 0 || totales.horasTriples > 0) && (
                              <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                                <div className="p-2 rounded-full bg-blue-500/20">
                                  <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                  <div className="text-xs text-muted-foreground">Horas Extra</div>
                                  <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                    {totales.horasDobles + totales.horasTriples}h
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    ({totales.horasDobles}h dobles, {totales.horasTriples}h triples)
                                  </div>
                                </div>
                              </div>
                            )}
                            {totales.horasDescontadas > 0 && (
                              <div className="flex items-center gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                                <div className="p-2 rounded-full bg-red-500/20">
                                  <MinusCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                                </div>
                                <div>
                                  <div className="text-xs text-muted-foreground">Horas Descontadas</div>
                                  <div className="text-lg font-bold text-red-600 dark:text-red-400">{totales.horasDescontadas}h</div>
                                </div>
                              </div>
                            )}
                            {totales.retardos > 0 && (
                              <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                <div className="p-2 rounded-full bg-amber-500/20">
                                  <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                </div>
                                <div>
                                  <div className="text-xs text-muted-foreground">Retardos</div>
                                  <div className="text-lg font-bold text-amber-600 dark:text-amber-400">{totales.retardos}</div>
                                </div>
                              </div>
                            )}
                            {/* Pagos Adicionales por Incidencias (Nominal + SDE) */}
                            {(totales.primaDominicalTotal > 0 || totales.pagoFestivosTotal > 0 ||
                              totales.horasExtraTotal > 0 || totales.vacacionesPagoTotal > 0 ||
                              totales.primaDominicalSDE > 0 || totales.pagoFestivosSDE > 0 ||
                              totales.horasDoblesSDE > 0 || totales.horasTriplesSDE > 0) && (
                              <div className="col-span-full mt-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
                                <div className="text-sm font-medium mb-3 flex items-center gap-2">
                                  <DollarSign className="h-4 w-4 text-primary" />
                                  Pagos Adicionales por Incidencias
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                  {(totales.primaDominicalTotal > 0 || totales.primaDominicalSDE > 0) && (
                                    <div>
                                      <div className="text-muted-foreground">Prima Dominical (25%)</div>
                                      <div className="font-mono font-semibold text-primary">
                                        +{formatCurrency(totales.primaDominicalTotal + totales.primaDominicalSDE)}
                                      </div>
                                      {totales.primaDominicalSDE > 0 && (
                                        <div className="text-xs text-muted-foreground">
                                          Nómina: {formatCurrency(totales.primaDominicalTotal)} + SDE: {formatCurrency(totales.primaDominicalSDE)}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  {(totales.pagoFestivosTotal > 0 || totales.pagoFestivosSDE > 0) && (
                                    <div>
                                      <div className="text-muted-foreground">Días Festivos (3x)</div>
                                      <div className="font-mono font-semibold text-primary">
                                        +{formatCurrency(totales.pagoFestivosTotal + totales.pagoFestivosSDE)}
                                      </div>
                                      {totales.pagoFestivosSDE > 0 && (
                                        <div className="text-xs text-muted-foreground">
                                          Nómina: {formatCurrency(totales.pagoFestivosTotal)} + SDE: {formatCurrency(totales.pagoFestivosSDE)}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  {(totales.horasExtraTotal > 0 || totales.horasDoblesSDE > 0 || totales.horasTriplesSDE > 0) && (
                                    <div>
                                      <div className="text-muted-foreground">Horas Extra</div>
                                      <div className="font-mono font-semibold text-primary">
                                        +{formatCurrency(totales.horasExtraTotal + totales.horasDoblesSDE + totales.horasTriplesSDE)}
                                      </div>
                                      {(totales.horasDoblesSDE > 0 || totales.horasTriplesSDE > 0) && (
                                        <div className="text-xs text-muted-foreground">
                                          Nómina: {formatCurrency(totales.horasExtraTotal)} + SDE: {formatCurrency(totales.horasDoblesSDE + totales.horasTriplesSDE)}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  {(totales.vacacionesPagoTotal > 0 || totales.primaVacacionalTotal > 0 ||
                                    totales.vacacionesSDE > 0 || totales.primaVacacionalSDE > 0) && (
                                    <div>
                                      <div className="text-muted-foreground">Vacaciones + Prima</div>
                                      <div className="font-mono font-semibold text-primary">
                                        +{formatCurrency(totales.vacacionesPagoTotal + totales.primaVacacionalTotal + totales.vacacionesSDE + totales.primaVacacionalSDE)}
                                      </div>
                                      {(totales.vacacionesSDE > 0 || totales.primaVacacionalSDE > 0) && (
                                        <div className="text-xs text-muted-foreground">
                                          Nómina: {formatCurrency(totales.vacacionesPagoTotal + totales.primaVacacionalTotal)} + SDE: {formatCurrency(totales.vacacionesSDE + totales.primaVacacionalSDE)}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-4 text-muted-foreground">
                            <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-600 dark:text-green-400" />
                            Sin incidencias en este periodo
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Advertencias de Cumplimiento LFT */}
                    {warnings.length > 0 && (
                      <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium flex items-center gap-2 text-amber-700 dark:text-amber-400">
                            <AlertTriangle className="h-4 w-4" />
                            Puntos de Atención ({warnings.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {warnings.map((w, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-sm">
                              {w.type === 'warning' ? (
                                <AlertTriangle className="h-4 w-4 mt-0.5 text-amber-600 dark:text-amber-400" />
                              ) : (
                                <AlertCircle className="h-4 w-4 mt-0.5 text-blue-500" />
                              )}
                              <div>
                                <div className={w.type === 'warning' ? 'text-amber-700 dark:text-amber-400' : 'text-muted-foreground'}>
                                  {w.message}
                                </div>
                                <div className="text-xs text-muted-foreground">{w.detail}</div>
                              </div>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    )}
                  </>
                );
              })()}

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
                      const breakdown = getEmployeeConceptBreakdown(employee.id, employee);
                      const salarioDiario = employee.salary / 30;
                      const totalPercepciones = getEmployeeTotalPercepciones(employee);
                      
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
                                  <div className="font-mono text-primary">{formatCurrency(totalPercepciones + (employee.pagoAdicional?.montoTotal || 0))}</div>
                                </div>
                                <div className="text-right">
                                  <div className="text-muted-foreground text-xs">Deducciones</div>
                                  <div className="font-mono text-destructive">{formatCurrency(employee.deductions)}</div>
                                </div>
                                <div className="text-right">
                                  <div className="text-muted-foreground text-xs">Neto</div>
                                  <div className="font-mono font-semibold text-lg">{formatCurrency(employee.netoAPagarTotal || (totalPercepciones - employee.deductions))}</div>
                                </div>
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="pt-4 pb-2">
                            <div className="grid grid-cols-3 gap-4">
                              {/* Salario Neto Real */}
                              <Card>
                                <CardHeader className="pb-3">
                                  <CardTitle className="text-sm font-medium">Salario Neto Real</CardTitle>
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
                                  {employee.diasFestivos > 0 && (
                                    <div className="flex justify-between text-purple-600 dark:text-purple-400">
                                      <span>Días festivos trabajados</span>
                                      <span className="font-mono">+{employee.diasFestivos}</span>
                                    </div>
                                  )}
                                  {employee.diasVacaciones > 0 && (
                                    <div className="flex justify-between text-green-600 dark:text-green-400">
                                      <span>Días de vacaciones</span>
                                      <span className="font-mono">+{employee.diasVacaciones}</span>
                                    </div>
                                  )}
                                  {(employee.horasDobles > 0 || employee.horasTriples > 0) && (
                                    <div className="flex justify-between text-blue-600 dark:text-blue-400">
                                      <span>Horas extra</span>
                                      <span className="font-mono">+{employee.horasDobles + employee.horasTriples}h</span>
                                    </div>
                                  )}
                                  <div className="h-px bg-border my-2" />
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Salario diario</span>
                                    <span className="font-mono">{formatCurrency(salarioDiario)}</span>
                                  </div>
                                  {employee.salarioDiarioExento > 0 && (
                                    <>
                                      <div className="flex justify-between text-xs">
                                        <span className="text-muted-foreground pl-2">- Nominal (CFDI)</span>
                                        <span className="font-mono">{formatCurrency(employee.salarioDiarioNominal)}</span>
                                      </div>
                                      <div className="flex justify-between text-xs">
                                        <span className="text-green-600 dark:text-green-400 pl-2">- Exento (SDE)</span>
                                        <span className="font-mono text-green-600 dark:text-green-400">{formatCurrency(employee.salarioDiarioExento)}</span>
                                      </div>
                                    </>
                                  )}
                                  <div className="flex justify-between font-semibold">
                                    <span>Salario proporcional</span>
                                    <span className="font-mono">{formatCurrency(employee.baseSalary)}</span>
                                  </div>
                                </CardContent>
                              </Card>

                              {/* Desglose de Percepciones */}
                              <Card>
                                <CardHeader className="pb-3">
                                  <CardTitle className="text-sm font-medium">Desglose de Percepciones</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2 text-sm">
                                  {/* Backend percepciones (includes Sueldo Base) */}
                                  {employee.backendPercepciones && employee.backendPercepciones.length > 0 ? (
                                    employee.backendPercepciones.map((p, idx) => (
                                      <div key={idx} className="flex justify-between gap-2">
                                        <span className="text-muted-foreground">
                                          {p.clave === 'P001' && employee.absences > 0
                                            ? `${p.nombre} (${employee.daysWorked}/${employee.periodDays} días)`
                                            : p.nombre}
                                        </span>
                                        <span className="font-mono text-primary">{formatCurrency(p.importe)}</span>
                                      </div>
                                    ))
                                  ) : (
                                    <>
                                      {breakdown.percepciones.map((concepto) => (
                                        <div key={concepto.id} className="flex justify-between gap-2">
                                          <span className="text-muted-foreground">{concepto.name}</span>
                                          <span className="font-mono text-primary">{formatCurrency(concepto.amount)}</span>
                                        </div>
                                      ))}
                                    </>
                                  )}
                                  {employee.primaDominical > 0 && (
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Prima Dominical (25%)</span>
                                      <span className="font-mono text-primary">{formatCurrency(employee.primaDominical)}</span>
                                    </div>
                                  )}
                                  {employee.pagoFestivos > 0 && (
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Días Festivos ({employee.diasFestivos}d × 200%)</span>
                                      <span className="font-mono text-purple-600 dark:text-purple-400">{formatCurrency(employee.pagoFestivos)}</span>
                                    </div>
                                  )}
                                  {(employee.horasDoblesPago > 0 || employee.horasTriplesPago > 0) && (
                                    <div className="space-y-1">
                                      <div className="font-medium text-foreground">Horas Extra:</div>
                                      {employee.horasDoblesPago > 0 && (
                                        <div className="flex justify-between pl-3">
                                          <span className="text-muted-foreground">
                                            Dobles {employee.horasDobles}h (200%)
                                          </span>
                                          <span className="font-mono text-primary">{formatCurrency(employee.horasDoblesPago)}</span>
                                        </div>
                                      )}
                                      {employee.horasTriplesPago > 0 && (
                                        <div className="flex justify-between pl-3">
                                          <span className="text-muted-foreground">
                                            Triples {employee.horasTriples}h (300%)
                                          </span>
                                          <span className="font-mono text-primary">{formatCurrency(employee.horasTriplesPago)}</span>
                                        </div>
                                      )}
                                      {(employee.horasExtraExento > 0 || employee.horasExtraGravado > 0) && (
                                        <div className="pl-3 pt-1 border-t border-dashed border-muted mt-1">
                                          <div className="flex justify-between text-xs">
                                            <span className="text-green-600 dark:text-green-400">Exento ISR</span>
                                            <span className="font-mono text-green-600 dark:text-green-400">{formatCurrency(employee.horasExtraExento)}</span>
                                          </div>
                                          <div className="flex justify-between text-xs">
                                            <span className="text-orange-600 dark:text-orange-400">Gravado ISR</span>
                                            <span className="font-mono text-orange-600 dark:text-orange-400">{formatCurrency(employee.horasExtraGravado)}</span>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  {employee.vacacionesPago > 0 && (
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Vacaciones ({employee.diasVacaciones} días)</span>
                                      <span className="font-mono text-primary">{formatCurrency(employee.vacacionesPago)}</span>
                                    </div>
                                  )}
                                  {employee.primaVacacional > 0 && (
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Prima Vacacional (25%)</span>
                                      <span className="font-mono text-primary">{formatCurrency(employee.primaVacacional)}</span>
                                    </div>
                                  )}
                                  {(!employee.backendPercepciones || employee.backendPercepciones.length === 0) && breakdown.percepciones.length === 0 && employee.primaDominical === 0 && employee.pagoFestivos === 0 && employee.horasDoblesPago === 0 && employee.horasTriplesPago === 0 && employee.vacacionesPago === 0 && employee.primaVacacional === 0 && !employee.pagoAdicional && (
                                    <div className="text-muted-foreground text-center py-4">
                                      Sin percepciones configuradas
                                    </div>
                                  )}
                                  {/* Pago Adicional (SDE) - en verde */}
                                  {employee.pagoAdicional && employee.pagoAdicional.montoTotal > 0 && (
                                    <>
                                      <div className="h-px bg-green-200 dark:bg-green-800 my-2" />
                                      <div className="text-xs text-green-600 dark:text-green-400 font-medium mb-1">Pago Adicional (SDE):</div>
                                      {employee.pagoAdicional.conceptos.map((concepto, idx) => (
                                        <div key={idx} className="flex justify-between gap-2">
                                          <span className="text-green-600 dark:text-green-400">{concepto.concepto}</span>
                                          <span className="font-mono text-green-600 dark:text-green-400">{formatCurrency(concepto.monto)}</span>
                                        </div>
                                      ))}
                                    </>
                                  )}
                                  <div className="h-px bg-border my-2" />
                                  <div className="flex justify-between font-semibold">
                                    <span>Total Percepciones</span>
                                    <span className="font-mono text-primary">{formatCurrency(totalPercepciones + (employee.pagoAdicional?.montoTotal || 0))}</span>
                                  </div>
                                </CardContent>
                              </Card>

                              {/* Deducciones */}
                              <Card>
                                <CardHeader className="pb-3">
                                  <CardTitle className="text-sm font-medium">Deducciones</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2 text-sm">
                                  {/* IMSS Trabajador */}
                                  <div className="space-y-1">
                                    <div className="font-medium text-foreground">IMSS Trabajador:</div>
                                    <div className="flex justify-between pl-3">
                                      <span className="text-muted-foreground">Enf. y Mat. - Prestaciones en Dinero (0.25%)</span>
                                      <span className="font-mono text-destructive">{formatCurrency(employee.imssPrestacionesDinero)}</span>
                                    </div>
                                    <div className="flex justify-between pl-3">
                                      <span className="text-muted-foreground">Enf. y Mat. - Gastos Médicos (0.375%)</span>
                                      <span className="font-mono text-destructive">{formatCurrency(employee.imssGastosMedicos)}</span>
                                    </div>
                                    <div className="flex justify-between pl-3">
                                      <span className="text-muted-foreground">Invalidez y Vida (0.625%)</span>
                                      <span className="font-mono text-destructive">{formatCurrency(employee.imssInvalidezVida)}</span>
                                    </div>
                                    <div className="flex justify-between pl-3">
                                      <span className="text-muted-foreground">Cesantía y Vejez (1.125%)</span>
                                      <span className="font-mono text-destructive">{formatCurrency(employee.imssCesantiaVejez)}</span>
                                    </div>
                                    {employee.imssExcedente3Umas > 0 && (
                                      <div className="flex justify-between pl-3">
                                        <span className="text-muted-foreground">Excedente 3 UMAs (0.40%)</span>
                                        <span className="font-mono text-destructive">{formatCurrency(employee.imssExcedente3Umas)}</span>
                                      </div>
                                    )}
                                    <div className="flex justify-between pl-3 pt-1 border-t border-dashed border-muted">
                                      <span className="text-muted-foreground font-medium">Subtotal IMSS</span>
                                      <span className="font-mono text-destructive font-medium">{formatCurrency(employee.imssTotal)}</span>
                                    </div>
                                  </div>

                                  {/* Descuento por horas (retardos/ausencias parciales) - antes de ISR porque afecta la base gravable */}
                                  {employee.descuentoHoras > 0 && (
                                    <div className="space-y-1 pt-2">
                                      <div className="font-medium text-foreground">Descuentos por Tiempo:</div>
                                      <div className="flex justify-between pl-3">
                                        <span className="text-muted-foreground">
                                          Horas descontadas ({employee.horasDescontadas} hrs × salario normal)
                                        </span>
                                        <span className="font-mono text-destructive">{formatCurrency(employee.descuentoHoras)}</span>
                                      </div>
                                      <div className="flex justify-between pl-3 text-xs text-muted-foreground italic">
                                        <span>* Reduce la base gravable del ISR</span>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {/* ISR */}
                                  <div className="space-y-1 pt-2">
                                    <div className="font-medium text-foreground">ISR (Impuesto Sobre la Renta) - Tasa {(employee.isrTasa ?? 0).toFixed(2)}%:</div>
                                    <div className="flex justify-between pl-3">
                                      <span className="text-muted-foreground">ISR Causado</span>
                                      <span className="font-mono text-destructive">{formatCurrency(employee.isrCausado)}</span>
                                    </div>
                                    {employee.subsidioEmpleo > 0 && (
                                      <div className="flex justify-between pl-3">
                                        <span className="text-green-600 dark:text-green-400">(-) Subsidio al Empleo</span>
                                        <span className="font-mono text-green-600 dark:text-green-400">-{formatCurrency(employee.subsidioEmpleo)}</span>
                                      </div>
                                    )}
                                    <div className="flex justify-between pl-3 pt-1 border-t border-dashed border-muted">
                                      <span className="text-muted-foreground font-medium">ISR a Retener</span>
                                      <span className="font-mono text-destructive font-medium">{formatCurrency(employee.isrRetenido)}</span>
                                    </div>
                                  </div>
                                  
                                  {/* Otras deducciones */}
                                  {breakdown.deducciones.length > 0 && (
                                    <div className="space-y-1 pt-2">
                                      <div className="font-medium text-foreground">Otras Deducciones:</div>
                                      {breakdown.deducciones.map((concepto) => (
                                        <div key={concepto.id} className="flex justify-between pl-3">
                                          <span className="text-muted-foreground">{concepto.name}</span>
                                          <span className="font-mono text-destructive">{formatCurrency(concepto.amount)}</span>
                                        </div>
                                      ))}
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
              </>
              )}
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
            <Button 
              onClick={createPreNomina} 
              disabled={isCreatingNomina}
              data-testid="button-create-pre-nomina"
            >
              {isCreatingNomina ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Creando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Crear Pre-Nómina
                </>
              )}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
