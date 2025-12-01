import { useState, useMemo, useEffect } from "react";
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
  ChevronRight,
  XCircle,
  Calendar,
  Star,
  Sun,
  MinusCircle
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
import type { GrupoNomina, Employee, IncidenciaAsistencia, PlantillaNomina, Empresa } from "@shared/schema";
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
  department: string;
  salary: number;
  baseSalary: number;
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
  percepciones: { id: string; name: string; amount: number }[];
  deducciones: { id: string; name: string; amount: number }[];
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
  totalDeductions: number;
  totalSalary: number;
  employeeCount: number;
  editable?: boolean;
  employeeDetails?: EmployeePayrollDetail[];
  periodRange?: { start: string; end: string };
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
  
  // State for viewing nomina detail modal
  const [selectedNominaToView, setSelectedNominaToView] = useState<Nomina | null>(null);
  const [isNominaDetailOpen, setIsNominaDetailOpen] = useState(false);

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
      isrTasa: 0
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
    const totalDiasFestivos = employeeIncidencias.reduce((sum, inc) => sum + ((inc as any).diasFestivos || 0), 0);
    const totalVacaciones = employeeIncidencias.reduce((sum, inc) => sum + (inc.vacaciones || 0), 0);
    const totalHorasExtra = employeeIncidencias.reduce((sum, inc) => sum + parseFloat(inc.horasExtra || "0"), 0);
    const totalHorasDescontadas = employeeIncidencias.reduce((sum, inc) => sum + parseFloat(inc.horasDescontadas || "0"), 0);
    
    // Calcular días trabajados (descontar faltas, incapacidades y vacaciones del salario base)
    // Las vacaciones se pagan por separado como percepción adicional
    const daysWorked = Math.max(0, periodDays - totalAbsences - totalIncapacities - totalVacaciones);
    
    // Calcular salario proporcional
    const salarioDiario = employee.salary / 30;
    const baseSalary = salarioDiario * daysWorked;
    
    // Calcular salario por hora (jornada de 8 horas)
    const salarioPorHora = salarioDiario / 8;
    
    // Calcular horas extra por semana según LFT Art. 67 y 68
    // El límite de 9 horas dobles es SEMANAL, no por período
    // Agrupar incidencias por semana ISO (lunes a domingo) y aplicar el límite de 9 hrs por cada semana
    const calcularHorasExtraPorSemana = () => {
      // Agrupar horas extra por semana ISO usando date-fns
      const horasPorSemana: Record<string, number> = {};
      
      employeeIncidencias.forEach(inc => {
        const horasDelDia = parseFloat(inc.horasExtra || "0");
        if (horasDelDia > 0 && inc.fecha) {
          // Parsear fecha como local (evitar problemas de timezone)
          const [year, month, day] = inc.fecha.split('-').map(Number);
          const fecha = new Date(year, month - 1, day);
          
          // Obtener inicio de semana ISO (lunes) usando date-fns
          const inicioSemana = startOfWeek(fecha, { weekStartsOn: 1 }); // 1 = lunes
          const claveSemana = format(inicioSemana, 'yyyy-MM-dd');
          
          horasPorSemana[claveSemana] = (horasPorSemana[claveSemana] || 0) + horasDelDia;
        }
      });
      
      // Calcular dobles y triples por cada semana (límite 9 dobles por semana)
      let totalDobles = 0;
      let totalTriples = 0;
      
      Object.values(horasPorSemana).forEach(horasSemana => {
        const doblesSemana = Math.min(horasSemana, 9);
        const triplesSemana = Math.max(0, horasSemana - 9);
        totalDobles += doblesSemana;
        totalTriples += triplesSemana;
      });
      
      return { totalDobles, totalTriples };
    };
    
    const { totalDobles, totalTriples } = calcularHorasExtraPorSemana();
    const horasDobles = totalDobles;
    const horasTriples = totalTriples;
    
    // Horas dobles: salario por hora × 2 (Art. 67 LFT)
    const horasDoblesPago = salarioPorHora * 2 * horasDobles;
    // Horas triples: salario por hora × 3 (Art. 68 LFT)
    const horasTriplesPago = salarioPorHora * 3 * horasTriples;
    // Total horas extra
    const horasExtraPago = horasDoblesPago + horasTriplesPago;
    
    // Cálculo ISR para horas extra según LISR Art. 93 fracción I
    // Las horas dobles (primeras 9 semanales) están exentas de ISR
    // El límite de exención es el MENOR de:
    // - 50% del salario semanal
    // - 5 UMAs semanales (UMA 2025 = $113.14 diario × 7 = $792.00 × 5 = $3,960)
    const UMA_DIARIA_2025 = 113.14;
    const limite5UmasSemanal = UMA_DIARIA_2025 * 7 * 5; // 5 UMAs semanales
    const salarioSemanal = salarioDiario * 7;
    const limite50PctSemanal = salarioSemanal * 0.5;
    
    // Calcular exento/gravado por semana
    const calcularExentoGravadoPorSemana = () => {
      const horasPorSemana: Record<string, { dobles: number; triples: number }> = {};
      
      employeeIncidencias.forEach(inc => {
        const horasDelDia = parseFloat(inc.horasExtra || "0");
        if (horasDelDia > 0 && inc.fecha) {
          const [year, month, day] = inc.fecha.split('-').map(Number);
          const fecha = new Date(year, month - 1, day);
          const inicioSemana = startOfWeek(fecha, { weekStartsOn: 1 });
          const claveSemana = format(inicioSemana, 'yyyy-MM-dd');
          
          if (!horasPorSemana[claveSemana]) {
            horasPorSemana[claveSemana] = { dobles: 0, triples: 0 };
          }
          
          const totalSemana = horasPorSemana[claveSemana].dobles + horasPorSemana[claveSemana].triples + horasDelDia;
          const doblesSemana = Math.min(totalSemana, 9);
          const triplesSemana = Math.max(0, totalSemana - 9);
          
          horasPorSemana[claveSemana] = { dobles: doblesSemana, triples: triplesSemana };
        }
      });
      
      let totalExento = 0;
      let totalGravado = 0;
      
      Object.values(horasPorSemana).forEach(({ dobles, triples }) => {
        const pagoDoblesSemana = salarioPorHora * 2 * dobles;
        const pagoTriplesSemana = salarioPorHora * 3 * triples;
        
        // Límite exento: el menor entre 50% salario semanal y 5 UMAs
        const limiteExentoSemana = Math.min(limite50PctSemanal, limite5UmasSemanal);
        
        // Solo las dobles pueden ser exentas
        const exentoSemana = Math.min(pagoDoblesSemana, limiteExentoSemana);
        const gravadoDoblesSemana = Math.max(0, pagoDoblesSemana - limiteExentoSemana);
        
        totalExento += exentoSemana;
        totalGravado += gravadoDoblesSemana + pagoTriplesSemana;
      });
      
      return { totalExento, totalGravado };
    };
    
    const { totalExento, totalGravado } = calcularExentoGravadoPorSemana();
    const horasExtraExento = totalExento;
    const horasExtraGravado = totalGravado;
    
    // Calcular prima dominical (25% del salario diario por cada domingo trabajado)
    const primaDominical = salarioDiario * 0.25 * totalDiasDomingo;
    
    // Calcular pago de días festivos trabajados (LFT Art. 75)
    // Si el empleado trabaja en día festivo, se le paga salario doble adicional al ordinario
    // Total: salario triple (1 ordinario + 2 adicionales)
    // Como el salario ordinario ya está incluido en baseSalary, solo agregamos el doble adicional
    const pagoFestivos = salarioDiario * 2 * totalDiasFestivos;
    
    // Calcular pago de vacaciones (salario diario * días de vacaciones)
    const vacacionesPago = salarioDiario * totalVacaciones;
    
    // Calcular prima vacacional (25% del pago de vacaciones según LFT Art. 80)
    const primaVacacional = vacacionesPago * 0.25;
    
    // Calcular descuento por horas no trabajadas (retardos, salidas tempranas, etc.)
    // Se descuenta a salario normal (no doble ni triple)
    const descuentoHoras = salarioPorHora * totalHorasDescontadas;

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

    // Total de percepciones: salario base + horas extra + prima dominical + vacaciones + prima vacacional + bonos
    const earnings = baseSalary + horasExtraPago + primaDominical + pagoFestivos + vacacionesPago + primaVacacional + bonuses;
    
    // ========== CÁLCULO DE DEDUCCIONES POR CONCEPTO ==========
    // Factor de integración para SBC (Salario Base de Cotización)
    const FACTOR_INTEGRACION = 1.0452; // Mínimo legal para SDI
    // UMA_DIARIA_2025 ya definida arriba (113.14)
    const LIMITE_25_UMAS = UMA_DIARIA_2025 * 25; // Tope de cotización diario
    
    // Calcular SDI y SBC
    const sdiDiario = salarioDiario * FACTOR_INTEGRACION;
    const sbcDiario = Math.min(sdiDiario, LIMITE_25_UMAS); // Aplicar tope
    const sbcPeriodo = sbcDiario * periodDays;
    
    // ========== IMSS TRABAJADOR (Cuotas Obreras 2025) ==========
    // Calculamos sobre el SBC del período
    const limite3UmasDiario = UMA_DIARIA_2025 * 3;
    const excedente3Umas = Math.max(0, sbcDiario - limite3UmasDiario);
    const excedente3UmasPeriodo = excedente3Umas * periodDays;
    
    // Desglose IMSS Trabajador:
    // 1. Enf. y Mat. - Excedente 3 UMAs Prestaciones en Especie: 0.40%
    const imssExcedente3Umas = excedente3UmasPeriodo * 0.0040;
    // 2. Enf. y Mat. - Prestaciones en Dinero: 0.25%
    const imssPrestacionesDinero = sbcPeriodo * 0.0025;
    // 3. Enf. y Mat. - Gastos Médicos Pensionados: 0.375%
    const imssGastosMedicos = sbcPeriodo * 0.00375;
    // 4. Invalidez y Vida: 0.625%
    const imssInvalidezVida = sbcPeriodo * 0.00625;
    // 5. Cesantía en Edad Avanzada y Vejez (CEAV): 1.125%
    const imssCesantiaVejez = sbcPeriodo * 0.01125;
    
    // Total IMSS Trabajador
    const totalIMSS = imssExcedente3Umas + imssPrestacionesDinero + imssGastosMedicos + imssInvalidezVida + imssCesantiaVejez;
    
    // ========== ISR (Impuesto Sobre la Renta) ==========
    // Base gravable = Todas las percepciones gravables - descuentos - IMSS
    // Percepciones gravables: salario, horas extra gravado, prima dominical, vacaciones, prima vacacional, bonos
    // Descuentos: horas descontadas (retardos, ausencias parciales) reducen la base gravable
    // Exenciones: horas extra exentas (ya consideradas)
    const percepcionesGravables = baseSalary + horasExtraGravado + primaDominical + pagoFestivos + vacacionesPago + primaVacacional + bonuses;
    const baseGravable = Math.max(0, percepcionesGravables - descuentoHoras - totalIMSS);
    
    // Tabla ISR 2025 según período (DOF Anexo 8 RMF 2025)
    const calcularISRPeriodo = (base: number, periodo: string): { isr: number; subsidio: number; tasaMarginal: number } => {
      // Tablas ISR 2025 por período
      const tablasISR: Record<string, { limiteInf: number; cuotaFija: number; tasa: number }[]> = {
        semanal: [
          { limiteInf: 0.01, cuotaFija: 0, tasa: 0.0192 },
          { limiteInf: 186.51, cuotaFija: 3.58, tasa: 0.0640 },
          { limiteInf: 1583.01, cuotaFija: 92.96, tasa: 0.1088 },
          { limiteInf: 2782.00, cuotaFija: 223.41, tasa: 0.1600 },
          { limiteInf: 3233.95, cuotaFija: 295.72, tasa: 0.1792 },
          { limiteInf: 3871.93, cuotaFija: 410.04, tasa: 0.2136 },
          { limiteInf: 7809.12, cuotaFija: 1251.03, tasa: 0.2352 },
          { limiteInf: 12308.25, cuotaFija: 2309.22, tasa: 0.3000 },
          { limiteInf: 23498.47, cuotaFija: 5666.29, tasa: 0.3200 },
          { limiteInf: 31331.30, cuotaFija: 8172.79, tasa: 0.3400 },
          { limiteInf: 93993.90, cuotaFija: 29478.08, tasa: 0.3500 },
        ],
        quincenal: [
          { limiteInf: 0.01, cuotaFija: 0, tasa: 0.0192 },
          { limiteInf: 373.02, cuotaFija: 7.16, tasa: 0.0640 },
          { limiteInf: 3166.03, cuotaFija: 185.92, tasa: 0.1088 },
          { limiteInf: 5564.01, cuotaFija: 446.82, tasa: 0.1600 },
          { limiteInf: 6467.91, cuotaFija: 591.44, tasa: 0.1792 },
          { limiteInf: 7743.86, cuotaFija: 820.09, tasa: 0.2136 },
          { limiteInf: 15618.25, cuotaFija: 2502.06, tasa: 0.2352 },
          { limiteInf: 24616.50, cuotaFija: 4618.45, tasa: 0.3000 },
          { limiteInf: 46996.95, cuotaFija: 11332.59, tasa: 0.3200 },
          { limiteInf: 62662.60, cuotaFija: 16345.59, tasa: 0.3400 },
          { limiteInf: 187987.81, cuotaFija: 58956.16, tasa: 0.3500 },
        ],
        mensual: [
          { limiteInf: 0.01, cuotaFija: 0, tasa: 0.0192 },
          { limiteInf: 746.05, cuotaFija: 14.32, tasa: 0.0640 },
          { limiteInf: 6332.06, cuotaFija: 371.83, tasa: 0.1088 },
          { limiteInf: 11128.02, cuotaFija: 893.63, tasa: 0.1600 },
          { limiteInf: 12935.83, cuotaFija: 1182.88, tasa: 0.1792 },
          { limiteInf: 15487.72, cuotaFija: 1640.18, tasa: 0.2136 },
          { limiteInf: 31236.50, cuotaFija: 5004.12, tasa: 0.2352 },
          { limiteInf: 49233.01, cuotaFija: 9236.89, tasa: 0.3000 },
          { limiteInf: 93993.91, cuotaFija: 22665.17, tasa: 0.3200 },
          { limiteInf: 125325.21, cuotaFija: 32691.18, tasa: 0.3400 },
          { limiteInf: 375975.62, cuotaFija: 117912.32, tasa: 0.3500 },
        ],
      };
      
      // Tablas Subsidio al Empleo 2025 (DOF Anexo 8 RMF 2025)
      const tablasSubsidio: Record<string, { limiteInf: number; limiteSup: number; subsidio: number }[]> = {
        semanal: [
          { limiteInf: 0.01, limiteSup: 407.33, subsidio: 93.73 },
          { limiteInf: 407.34, limiteSup: 610.96, subsidio: 93.66 },
          { limiteInf: 610.97, limiteSup: 799.68, subsidio: 93.66 },
          { limiteInf: 799.69, limiteSup: 814.66, subsidio: 90.44 },
          { limiteInf: 814.67, limiteSup: 1023.75, subsidio: 88.06 },
          { limiteInf: 1023.76, limiteSup: 1086.19, subsidio: 81.55 },
          { limiteInf: 1086.20, limiteSup: 1228.57, subsidio: 74.83 },
          { limiteInf: 1228.58, limiteSup: 1433.32, subsidio: 67.83 },
          { limiteInf: 1433.33, limiteSup: 1638.07, subsidio: 58.38 },
          { limiteInf: 1638.08, limiteSup: 1699.09, subsidio: 50.12 },
          { limiteInf: 1699.10, limiteSup: 2543.50, subsidio: 0 },
        ],
        quincenal: [
          { limiteInf: 0.01, limiteSup: 814.66, subsidio: 187.47 },
          { limiteInf: 814.67, limiteSup: 1221.93, subsidio: 187.32 },
          { limiteInf: 1221.94, limiteSup: 1599.36, subsidio: 187.32 },
          { limiteInf: 1599.37, limiteSup: 1629.32, subsidio: 180.88 },
          { limiteInf: 1629.33, limiteSup: 2047.49, subsidio: 176.12 },
          { limiteInf: 2047.50, limiteSup: 2172.37, subsidio: 163.09 },
          { limiteInf: 2172.38, limiteSup: 2457.13, subsidio: 149.66 },
          { limiteInf: 2457.14, limiteSup: 2866.63, subsidio: 135.65 },
          { limiteInf: 2866.64, limiteSup: 3276.13, subsidio: 116.76 },
          { limiteInf: 3276.14, limiteSup: 3398.17, subsidio: 100.24 },
          { limiteInf: 3398.18, limiteSup: 5087.00, subsidio: 0 },
        ],
        mensual: [
          { limiteInf: 0.01, limiteSup: 1768.96, subsidio: 407.02 },
          { limiteInf: 1768.97, limiteSup: 2653.38, subsidio: 406.83 },
          { limiteInf: 2653.39, limiteSup: 3472.84, subsidio: 406.62 },
          { limiteInf: 3472.85, limiteSup: 3537.87, subsidio: 392.77 },
          { limiteInf: 3537.88, limiteSup: 4446.15, subsidio: 382.46 },
          { limiteInf: 4446.16, limiteSup: 4717.18, subsidio: 354.23 },
          { limiteInf: 4717.19, limiteSup: 5335.42, subsidio: 324.87 },
          { limiteInf: 5335.43, limiteSup: 6224.67, subsidio: 294.63 },
          { limiteInf: 6224.68, limiteSup: 7113.90, subsidio: 253.54 },
          { limiteInf: 7113.91, limiteSup: 7382.33, subsidio: 217.61 },
          { limiteInf: 7382.34, limiteSup: 10171.00, subsidio: 0 },
        ],
      };
      
      const tablaISR = tablasISR[periodo] || tablasISR['quincenal'];
      let tramoAplicado = tablaISR[0];
      
      for (const tramo of tablaISR) {
        if (base >= tramo.limiteInf) {
          tramoAplicado = tramo;
        }
      }
      
      const excedente = Math.max(0, base - tramoAplicado.limiteInf);
      const isr = tramoAplicado.cuotaFija + (excedente * tramoAplicado.tasa);
      const tasaMarginal = tramoAplicado.tasa * 100; // Porcentaje del tramo aplicado
      
      // Buscar subsidio al empleo en tabla
      const tablaSubsidio = tablasSubsidio[periodo] || tablasSubsidio['quincenal'];
      let subsidio = 0;
      
      for (const tramo of tablaSubsidio) {
        if (base >= tramo.limiteInf && base <= tramo.limiteSup) {
          subsidio = tramo.subsidio;
          break;
        }
      }
      
      return { isr: Math.max(0, isr), subsidio, tasaMarginal };
    };
    
    const periodoISR = selectedFrequency === 'semanal' ? 'semanal' : selectedFrequency === 'mensual' ? 'mensual' : 'quincenal';
    const { isr: isrCausado, subsidio: subsidioEmpleo, tasaMarginal: isrTasa } = calcularISRPeriodo(baseGravable, periodoISR);
    const isrRetenido = Math.max(0, isrCausado - subsidioEmpleo);
    
    // ========== TOTALES ==========
    const baseDeductions = totalIMSS + isrRetenido;
    const deductions = baseDeductions + descuentoHoras + incidents;
    const netPay = earnings - deductions;

    return { 
      baseSalary,
      horasExtraPago,
      horasDoblesPago,
      horasTriplesPago,
      horasExtraExento,
      horasExtraGravado,
      horasExtra: totalHorasExtra,
      horasDobles,
      horasTriples,
      primaDominical,
      diasFestivos: totalDiasFestivos,
      pagoFestivos,
      vacacionesPago,
      primaVacacional,
      earnings, 
      deductions, 
      netPay,
      daysWorked,
      periodDays,
      absences: totalAbsences,
      incapacities: totalIncapacities,
      diasDomingo: totalDiasDomingo,
      diasVacaciones: totalVacaciones,
      // Desglose deducciones
      imssTotal: totalIMSS,
      imssExcedente3Umas,
      imssPrestacionesDinero,
      imssGastosMedicos,
      imssInvalidezVida,
      imssCesantiaVejez,
      isrCausado,
      subsidioEmpleo,
      isrRetenido,
      sbcDiario,
      sdiDiario,
      // Horas descontadas
      horasDescontadas: totalHorasDescontadas,
      descuentoHoras,
      // Tasa ISR
      isrTasa
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
    // Build employee details with all calculation data
    const employeeDetails: EmployeePayrollDetail[] = selectedEmployeesData.map(emp => {
      const breakdown = getEmployeeConceptBreakdown(emp.id);
      return {
        id: emp.id,
        name: emp.name,
        rfc: emp.rfc,
        department: emp.department,
        salary: emp.salary,
        baseSalary: emp.baseSalary,
        daysWorked: emp.daysWorked,
        periodDays: emp.periodDays,
        absences: emp.absences,
        incapacities: emp.incapacities,
        diasDomingo: emp.diasDomingo,
        diasFestivos: emp.diasFestivos,
        diasVacaciones: emp.diasVacaciones,
        primaDominical: emp.primaDominical,
        pagoFestivos: emp.pagoFestivos,
        horasExtra: emp.horasExtra,
        horasDobles: emp.horasDobles,
        horasTriples: emp.horasTriples,
        horasDoblesPago: emp.horasDoblesPago,
        horasTriplesPago: emp.horasTriplesPago,
        horasExtraPago: emp.horasExtraPago,
        horasExtraExento: emp.horasExtraExento,
        horasExtraGravado: emp.horasExtraGravado,
        vacacionesPago: emp.vacacionesPago,
        primaVacacional: emp.primaVacacional,
        horasDescontadas: emp.horasDescontadas,
        descuentoHoras: emp.descuentoHoras,
        imssTotal: emp.imssTotal,
        imssExcedente3Umas: emp.imssExcedente3Umas,
        imssPrestacionesDinero: emp.imssPrestacionesDinero,
        imssGastosMedicos: emp.imssGastosMedicos,
        imssInvalidezVida: emp.imssInvalidezVida,
        imssCesantiaVejez: emp.imssCesantiaVejez,
        isrCausado: emp.isrCausado,
        subsidioEmpleo: emp.subsidioEmpleo,
        isrRetenido: emp.isrRetenido,
        isrTasa: emp.isrTasa,
        sbcDiario: emp.sbcDiario,
        sdiDiario: emp.sdiDiario,
        earnings: emp.earnings,
        deductions: emp.deductions,
        netPay: emp.netPay,
        percepciones: breakdown.percepciones,
        deducciones: breakdown.deducciones,
      };
    });

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
      totalEarnings: totalEarnings,
      totalDeductions: totalDeductions,
      totalSalary: totalSalary,
      employeeCount: selectedEmployees.size,
      editable: true,
      employeeDetails: employeeDetails,
      periodRange: { ...queryPeriodRange },
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

  // Function to view nomina details
  const viewNominaDetail = (nomina: Nomina) => {
    setSelectedNominaToView(nomina);
    setIsNominaDetailOpen(true);
  };

  // Function to approve nomina
  const approveNomina = (nominaId: string) => {
    setNominas(nominas.map(n => 
      n.id === nominaId 
        ? { ...n, status: "approved" as const, editable: false }
        : n
    ));
    setIsNominaDetailOpen(false);
    setSelectedNominaToView(null);
    toast({
      title: "Nómina aprobada",
      description: "La nómina ha sido aprobada exitosamente y está lista para pago.",
    });
  };

  // Function to make changes - go back to wizard with data preloaded
  const makeChangesToNomina = (nomina: Nomina) => {
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
    
    // Remove the old nomina since we're editing it
    setNominas(nominas.filter(n => n.id !== nomina.id));
    
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
                      <div className="flex items-center gap-2">
                        {getStatusIcon(nomina.status)}
                        {getStatusBadge(nomina.status)}
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
                    {getStatusBadge(selectedNominaToView.status)}
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
                        <div className="text-sm text-muted-foreground">Total Percepciones</div>
                        <div className="text-2xl font-bold text-primary font-mono">
                          {formatCurrency(selectedNominaToView.totalEarnings || 0)}
                        </div>
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
                    const totales = selectedNominaToView.employeeDetails.reduce((acc, emp) => ({
                      faltas: acc.faltas + (emp.absences || 0),
                      incapacidades: acc.incapacidades + (emp.incapacities || 0),
                      diasDomingo: acc.diasDomingo + (emp.diasDomingo || 0),
                      diasFestivos: acc.diasFestivos + (emp.diasFestivos || 0),
                      diasVacaciones: acc.diasVacaciones + (emp.diasVacaciones || 0),
                      horasDobles: acc.horasDobles + (emp.horasDobles || 0),
                      horasTriples: acc.horasTriples + (emp.horasTriples || 0),
                      horasDescontadas: acc.horasDescontadas + (emp.horasDescontadas || 0),
                    }), {
                      faltas: 0,
                      incapacidades: 0,
                      diasDomingo: 0,
                      diasFestivos: 0,
                      diasVacaciones: 0,
                      horasDobles: 0,
                      horasTriples: 0,
                      horasDescontadas: 0,
                    });

                    const hasIncidencias = totales.faltas > 0 || totales.incapacidades > 0 || 
                      totales.diasDomingo > 0 || totales.diasFestivos > 0 || totales.diasVacaciones > 0 ||
                      totales.horasDobles > 0 || totales.horasTriples > 0 || totales.horasDescontadas > 0;

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
                                      {employee.diasFestivos > 0 && (
                                        <div className="flex justify-between text-purple-600 dark:text-purple-400">
                                          <span>Días festivos trabajados</span>
                                          <span className="font-mono">+{employee.diasFestivos}</span>
                                        </div>
                                      )}
                                      <div className="h-px bg-border my-2" />
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Salario diario</span>
                                        <span className="font-mono">{formatCurrency(employee.salary / 30)}</span>
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
                                                Dobles {employee.horasDobles} (200%)
                                              </span>
                                              <span className="font-mono text-primary">{formatCurrency(employee.horasDoblesPago)}</span>
                                            </div>
                                          )}
                                          {employee.horasTriplesPago > 0 && (
                                            <div className="flex justify-between pl-3">
                                              <span className="text-muted-foreground">
                                                Triples {employee.horasTriples} (300%)
                                              </span>
                                              <span className="font-mono text-primary">{formatCurrency(employee.horasTriplesPago)}</span>
                                            </div>
                                          )}
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
                                      {employee.percepciones.map((concepto) => (
                                        <div key={concepto.id} className="flex justify-between">
                                          <span className="text-muted-foreground">{concepto.name}</span>
                                          <span className="font-mono text-primary">{formatCurrency(concepto.amount)}</span>
                                        </div>
                                      ))}
                                      {employee.primaDominical === 0 && employee.pagoFestivos === 0 && employee.horasDoblesPago === 0 && employee.horasTriplesPago === 0 && employee.vacacionesPago === 0 && employee.primaVacacional === 0 && employee.percepciones.length === 0 && (
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
                                              Horas descontadas ({employee.horasDescontadas} hrs)
                                            </span>
                                            <span className="font-mono text-destructive">{formatCurrency(employee.descuentoHoras)}</span>
                                          </div>
                                        </div>
                                      )}
                                      
                                      <div className="space-y-1 pt-2">
                                        <div className="font-medium text-foreground">ISR - Tasa {employee.isrTasa.toFixed(2)}%:</div>
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
                    <Button variant="outline" onClick={() => setIsNominaDetailOpen(false)}>
                      Cerrar
                    </Button>
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
                        Usa una plantilla predefinida para cargar los conceptos automáticamente
                      </p>
                    </div>
                    <Select 
                      value={selectedPlantillaId || "none"} 
                      onValueChange={(v) => setSelectedPlantillaId(v === "none" ? null : v)}
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
                                  {employee.diasFestivos > 0 && (
                                    <div className="flex justify-between text-purple-600 dark:text-purple-400">
                                      <span>Días festivos trabajados</span>
                                      <span className="font-mono">+{employee.diasFestivos}</span>
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
                                            Dobles {employee.horasDobles} (200%)
                                          </span>
                                          <span className="font-mono text-primary">{formatCurrency(employee.horasDoblesPago)}</span>
                                        </div>
                                      )}
                                      {employee.horasTriplesPago > 0 && (
                                        <div className="flex justify-between pl-3">
                                          <span className="text-muted-foreground">
                                            Triples {employee.horasTriples} (300%)
                                          </span>
                                          <span className="font-mono text-primary">{formatCurrency(employee.horasTriplesPago)}</span>
                                        </div>
                                      )}
                                      {/* Desglose ISR: Exento / Gravado */}
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
                                  {breakdown.percepciones.map((concepto) => (
                                    <div key={concepto.id} className="flex justify-between">
                                      <span className="text-muted-foreground">{concepto.name}</span>
                                      <span className="font-mono text-primary">{formatCurrency(concepto.amount)}</span>
                                    </div>
                                  ))}
                                  {employee.primaDominical === 0 && employee.pagoFestivos === 0 && employee.horasDoblesPago === 0 && employee.horasTriplesPago === 0 && employee.vacacionesPago === 0 && employee.primaVacacional === 0 && breakdown.percepciones.length === 0 && (
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
                                    <div className="font-medium text-foreground">ISR (Impuesto Sobre la Renta) - Tasa {employee.isrTasa.toFixed(2)}%:</div>
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
