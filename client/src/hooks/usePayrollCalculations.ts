import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

// Types matching the backend response from payrollBreakdownService
export interface ConceptoPercepcion {
  clave: string;
  nombre: string;
  tipo: 'gravado' | 'exento';
  base: number;
  tasa?: number;
  importe: number;
  fundamentoLegal?: string;
  concepto?: string;
  monto?: number;
  gravado?: number;
  exento?: number;
}

export interface ConceptoDeduccion {
  clave: string;
  nombre: string;
  base: number;
  tasa?: number;
  importe: number;
  fundamentoLegal?: string;
  concepto?: string;
  monto?: number;
}

export interface CuotaIMSS {
  concepto: string;
  base: number;
  tasa: number;
  importe: number;
}

export interface PagoAdicional {
  salarioDiarioExento: number;
  diasPagados: number;
  montoBase: number;
  conceptos: { concepto: string; monto: number }[];
  montoTotal: number;
}

export interface DesgloseNomina {
  empleado: {
    id: string;
    nombreCompleto: string;
    rfc?: string;
    curp?: string;
    nss?: string;
    empresa: string;
    puesto?: string;
  };
  periodo: {
    fechaInicio: string;
    fechaFin: string;
    frecuencia: string;
    diasNaturales: number;
    diasPagados: number;
    diasCotizadosIMSS: number;
  };
  incidencias?: {
    faltas: number;
    incapacidades: number;
    permisos: number;
    vacaciones: number;
    diasFestivos: number;
    diasDomingo: number;
    horasExtra: number;
    horasExtraDobles: number;
    horasExtraTriples: number;
    retardos: number;
    // Monetary values for premium payments
    primaDominical: number;
    pagoFestivos: number;
    horasDoblesPago: number;
    horasTriplesPago: number;
    vacacionesPago: number;
    primaVacacional: number;
  };
  salarios: {
    salarioDiarioReal: number;
    salarioDiarioNominal: number;
    salarioDiarioExento: number;
    sbc: number;
    sdi: number;
  };
  percepciones: ConceptoPercepcion[];
  totalPercepciones: number;
  totalPercepcionesGravadas: number;
  totalPercepcionesExentas: number;
  deducciones: ConceptoDeduccion[];
  totalDeducciones: number;
  desgloseIMSS: {
    cuotasObrero: CuotaIMSS[];
    cuotasPatronal: CuotaIMSS[];
    totalObrero: number;
    totalPatronal: number;
  };
  isr: {
    baseGravable: number;
    isrAntesSubsidio: number;
    subsidioEmpleo: number;
    isrNeto: number;
  };
  netoAPagar: number;
  costoTotalEmpresa: number;
  netoAPagarTotal: number;
  pagoAdicional?: PagoAdicional;
  // Error field for failed calculations
  error?: string;
  empleadoId?: string;
}

export interface DesgloseNominaBatchResponse {
  desgloses: DesgloseNomina[];
}

export interface UsePayrollCalculationsParams {
  empleadoIds: string[];
  fechaInicio: string;
  fechaFin: string;
  frecuencia: 'semanal' | 'quincenal' | 'mensual';
  usarIncidencias?: boolean;
  enabled?: boolean;
}

export function usePayrollCalculations({
  empleadoIds,
  fechaInicio,
  fechaFin,
  frecuencia,
  usarIncidencias = true,
  enabled = true,
}: UsePayrollCalculationsParams) {
  return useQuery<DesgloseNominaBatchResponse>({
    queryKey: ["/api/nomina/desglose-batch", { empleadoIds, fechaInicio, fechaFin, frecuencia, usarIncidencias }],
    queryFn: async () => {
      const response = await apiRequest("POST", "/api/nomina/desglose-batch", {
        empleadoIds,
        fechaInicio,
        fechaFin,
        frecuencia,
        usarIncidencias,
      });
      return response.json();
    },
    enabled: enabled && empleadoIds.length > 0 && !!fechaInicio && !!fechaFin,
    staleTime: 30000, // Cache for 30 seconds
    refetchOnWindowFocus: false,
  });
}

// Helper to map backend desglose to UI-compatible format
export function mapDesgloseToEmployeeCalculation(desglose: DesgloseNomina) {
  if (desglose.error) {
    return null;
  }

  const totalIMSS = desglose.desgloseIMSS.totalObrero;

  return {
    id: desglose.empleado.id,
    nombreCompleto: desglose.empleado.nombreCompleto,
    rfc: desglose.empleado.rfc,
    curp: desglose.empleado.curp,
    nss: desglose.empleado.nss,
    empresa: desglose.empleado.empresa,
    puesto: desglose.empleado.puesto,

    // Salarios
    salarioDiarioReal: desglose.salarios.salarioDiarioReal,
    salarioDiarioNominal: desglose.salarios.salarioDiarioNominal,
    salarioDiarioExento: desglose.salarios.salarioDiarioExento,
    sbc: desglose.salarios.sbc,
    sdi: desglose.salarios.sdi,

    // Periodo
    daysWorked: desglose.periodo.diasPagados,
    periodDays: desglose.periodo.diasNaturales,
    diasCotizadosIMSS: desglose.periodo.diasCotizadosIMSS,

    // Incidencias
    absences: desglose.incidencias?.faltas || 0,
    incapacidades: desglose.incidencias?.incapacidades || 0,
    vacaciones: desglose.incidencias?.vacaciones || 0,
    horasExtra: desglose.incidencias?.horasExtra || 0,
    diasFestivos: desglose.incidencias?.diasFestivos || 0,
    diasDomingo: desglose.incidencias?.diasDomingo || 0,
    horasExtraDobles: desglose.incidencias?.horasExtraDobles || 0,
    horasExtraTriples: desglose.incidencias?.horasExtraTriples || 0,
    retardos: desglose.incidencias?.retardos || 0,
    // Monetary values for premium payments
    primaDominical: desglose.incidencias?.primaDominical || 0,
    pagoFestivos: desglose.incidencias?.pagoFestivos || 0,
    horasDoblesPago: desglose.incidencias?.horasDoblesPago || 0,
    horasTriplesPago: desglose.incidencias?.horasTriplesPago || 0,
    vacacionesPago: desglose.incidencias?.vacacionesPago || 0,
    primaVacacional: desglose.incidencias?.primaVacacional || 0,

    // Percepciones
    percepciones: desglose.percepciones,
    totalPercepciones: desglose.totalPercepciones,
    totalPercepcionesGravadas: desglose.totalPercepcionesGravadas,
    totalPercepcionesExentas: desglose.totalPercepcionesExentas,
    earnings: desglose.totalPercepciones,

    // Calcular baseSalary desde percepciones de sueldo
    baseSalary: desglose.percepciones
      .filter(p => p.clave === 'P001')
      .reduce((sum, p) => sum + p.importe, 0),

    // Deducciones
    deducciones: desglose.deducciones,
    totalDeducciones: desglose.totalDeducciones,
    deductions: desglose.totalDeducciones,

    // IMSS
    desgloseIMSS: desglose.desgloseIMSS,
    totalIMSS,
    imssObrero: totalIMSS,
    imssPatronal: desglose.desgloseIMSS.totalPatronal,

    // ISR
    isr: desglose.isr,
    isrCausado: desglose.isr.isrAntesSubsidio,
    subsidioEmpleo: desglose.isr.subsidioEmpleo,
    isrRetenido: desglose.isr.isrNeto,
    baseGravable: desglose.isr.baseGravable,
    // Calculate approximate ISR rate from the tramo
    isrTasa: desglose.isr.isrAntesSubsidio > 0
      ? (desglose.isr.isrAntesSubsidio / desglose.isr.baseGravable) * 100
      : 0,

    // Netos
    netoAPagar: desglose.netoAPagar,
    netPay: desglose.netoAPagar,
    netoAPagarTotal: desglose.netoAPagarTotal,
    costoTotalEmpresa: desglose.costoTotalEmpresa,

    // Pago adicional (SDE)
    pagoAdicional: desglose.pagoAdicional,

    // Flags
    hasBackendCalculation: true,
  };
}
