/**
 * Servicio de Desglose de Nómina
 * 
 * Genera el desglose completo de nómina para un empleado:
 * - Percepciones (sueldo, bonos, horas extra, etc.)
 * - Deducciones (IMSS, ISR, Infonavit, etc.)
 * - Neto a pagar
 * 
 * Integra el módulo de asistencia para calcular días trabajados reales.
 */

import { db } from "../db";
import { employees, empresas, centrosTrabajo, gruposNomina } from "@shared/schema";
import { eq } from "drizzle-orm";
import { 
  pesosToBp, 
  bpToPesos, 
  multiplicarBpPorTasa,
  sumarBp,
  restarBp,
} from "@shared/basisPoints";
import { 
  calcularISR, 
  calcularSubsidio2025,
  CONFIG_FISCAL_2025,
  type TipoPeriodo 
} from "@shared/payrollEngine";
import { calcularCuotasIMSS, type ConfiguracionIMSS, type EmpleadoIMSS } from "./imssCalculator";
import { 
  calcularDiasTrabajados, 
  calcularDiasSinIncidencias,
  type PeriodoNomina,
  type ResumenDiasTrabajados,
  getDiasPorFrecuencia
} from "./diasTrabajadosCalculator";
import {
  obtenerPlantillaPredeterminada,
  evaluarConceptosPlantilla,
  generarVariablesNomina,
  type VariablesNomina,
  type ConceptoEvaluado,
} from "./plantillaConceptosService";

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export interface ParametrosDesglose {
  empleadoId: string;
  fechaInicio: Date;
  fechaFin: Date;
  frecuencia: 'semanal' | 'catorcenal' | 'quincenal' | 'mensual';
  diasPeriodo?: number; // Si no se especifica, se calcula por frecuencia
  usarIncidencias?: boolean; // Si true, consulta módulo de asistencia
}

export interface ConceptoPercepcion {
  clave: string;
  nombre: string;
  tipo: 'gravado' | 'exento';
  base: number;
  tasa?: number;
  importe: number;
  fundamentoLegal?: string;
}

export interface ConceptoDeduccion {
  clave: string;
  nombre: string;
  base: number;
  tasa?: number;
  importe: number;
  fundamentoLegal?: string;
}

export interface DesgloseIMSS {
  cuotasObrero: {
    concepto: string;
    base: number;
    tasa: number;
    importe: number;
  }[];
  cuotasPatronal: {
    concepto: string;
    base: number;
    tasa: number;
    importe: number;
  }[];
  totalObrero: number;
  totalPatronal: number;
}

export interface DesgloseNominaCompleto {
  // Información del empleado
  empleado: {
    id: string;
    nombreCompleto: string;
    rfc?: string;
    curp?: string;
    nss?: string;
    empresa: string;
    centroTrabajo?: string;
    puesto?: string;
  };

  // Información del periodo
  periodo: {
    fechaInicio: string;
    fechaFin: string;
    frecuencia: string;
    diasNaturales: number;
    diasPagados: number;
    diasCotizadosIMSS: number;
  };

  // Incidencias
  incidencias?: {
    faltas: number;
    incapacidades: number;
    permisos: number;
    vacaciones: number;
    diasFestivos: number;
    horasExtra: number;
  };

  // Salarios base
  salarios: {
    salarioDiarioReal: number;
    salarioDiarioNominal: number;
    salarioDiarioExento: number;
    sbc: number;
    sdi: number;
  };

  // Percepciones
  percepciones: ConceptoPercepcion[];
  totalPercepciones: number;
  totalPercepcionesGravadas: number;
  totalPercepcionesExentas: number;

  // Deducciones
  deducciones: ConceptoDeduccion[];
  totalDeducciones: number;

  // Desglose IMSS detallado
  desgloseIMSS: DesgloseIMSS;

  // ISR
  isr: {
    baseGravable: number;
    isrAntesSubsidio: number;
    subsidioEmpleo: number;
    isrNeto: number;
  };

  // Totales
  netoAPagar: number;
  costoTotalEmpresa: number;
}

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

function mapFrecuenciaToPeriodo(frecuencia: string): TipoPeriodo {
  switch (frecuencia) {
    case 'semanal': return 'semanal';
    case 'catorcenal': return 'catorcenal';
    case 'quincenal': return 'quincenal';
    case 'mensual': return 'mensual';
    default: return 'quincenal';
  }
}

// ============================================================================
// FUNCIÓN PRINCIPAL
// ============================================================================

export async function generarDesgloseNomina(
  params: ParametrosDesglose
): Promise<DesgloseNominaCompleto> {
  const { empleadoId, fechaInicio, fechaFin, frecuencia, usarIncidencias = true } = params;

  // 1. Obtener datos del empleado
  const empleadoData = await db
    .select({
      empleado: employees,
      empresa: empresas,
    })
    .from(employees)
    .leftJoin(empresas, eq(employees.empresaId, empresas.id))
    .where(eq(employees.id, empleadoId))
    .limit(1);

  if (!empleadoData.length || !empleadoData[0].empleado) {
    throw new Error(`Empleado no encontrado: ${empleadoId}`);
  }

  const emp = empleadoData[0].empleado;
  const empresa = empleadoData[0].empresa;

  // 2. Calcular días trabajados
  const diasPeriodo = params.diasPeriodo || getDiasPorFrecuencia(frecuencia);
  
  let diasPagados: number;
  let diasCotizadosIMSS: number;
  let resumenDias: ResumenDiasTrabajados | null = null;

  if (usarIncidencias) {
    const periodo: PeriodoNomina = {
      fechaInicio,
      fechaFin,
      diasNaturales: diasPeriodo,
      frecuencia,
    };
    resumenDias = await calcularDiasTrabajados(empleadoId, periodo);
    diasPagados = resumenDias.diasPagados;
    diasCotizadosIMSS = resumenDias.diasCotizadosIMSS;
  } else {
    const diasCalc = calcularDiasSinIncidencias(diasPeriodo);
    diasPagados = diasCalc.diasPagados;
    diasCotizadosIMSS = diasCalc.diasCotizadosIMSS;
  }

  // 3. Obtener salarios (convertir de string a number)
  const salarioDiarioReal = parseFloat(emp.salarioDiarioReal || '0');
  const salarioDiarioNominal = parseFloat(emp.salarioDiarioNominal || '0');
  const salarioDiarioExento = salarioDiarioReal - salarioDiarioNominal;
  const sbc = parseFloat(emp.sbc || emp.salarioDiarioReal || '0');
  const sdi = parseFloat(emp.sdi || emp.sbc || emp.salarioDiarioReal || '0');

  // 4. Calcular percepciones usando la plantilla predeterminada
  interface PercepcionInterna extends ConceptoPercepcion {
    importeBp: bigint;
  }
  const percepcionesInternas: PercepcionInterna[] = [];

  // Generar variables de nómina para evaluación de fórmulas
  const variablesNomina: VariablesNomina = generarVariablesNomina({
    salarioDiarioReal,
    salarioDiarioNominal,
    sbc,
    sdi,
    diasTrabajados: diasPagados,
    diasPeriodo,
    diasPagados,
    horasExtraDobles: resumenDias?.horasExtra || 0,
    horasExtraTriples: 0,
    diasVacaciones: resumenDias?.vacaciones || 0,
    antiguedadAnos: 1,
    diasFestivosTrabajados: resumenDias?.diasFestivos || 0,
    diasDomingo: resumenDias?.diasDomingo || 0,
    umaDiaria: CONFIG_FISCAL_2025.uma.diaria,
    smgDiario: CONFIG_FISCAL_2025.salarioMinimo.general,
  });

  // Intentar obtener plantilla predeterminada de la empresa
  let usandoPlantilla = false;
  let conceptosPlantilla: ConceptoEvaluado[] = [];

  if (emp.empresaId) {
    const plantilla = await obtenerPlantillaPredeterminada(emp.empresaId);
    if (plantilla && plantilla.conceptos.length > 0) {
      const resultado = evaluarConceptosPlantilla(plantilla, variablesNomina);
      conceptosPlantilla = resultado.conceptosEvaluados;
      usandoPlantilla = true;
    }
  }

  if (usandoPlantilla && conceptosPlantilla.length > 0) {
    // Usar conceptos de la plantilla predeterminada
    for (const concepto of conceptosPlantilla) {
      if (concepto.tipo === 'percepcion' && concepto.importe > 0) {
        const importeBp = pesosToBp(concepto.importe);
        percepcionesInternas.push({
          clave: concepto.clave,
          nombre: concepto.nombre,
          tipo: concepto.tipoGravable === 'exento' ? 'exento' : 
                concepto.tipoGravable === 'gravado' ? 'gravado' : 'gravado',
          base: concepto.importeGravado > 0 ? concepto.importeGravado : concepto.importe,
          importe: concepto.importe,
          importeBp,
          fundamentoLegal: concepto.fundamentoLegal,
        });
      }
    }
  } else {
    // Fallback: usar percepciones hardcodeadas si no hay plantilla

    // Sueldo base nominal (gravado)
    const sueldoNominalBp = pesosToBp(salarioDiarioNominal * diasPagados);
    percepcionesInternas.push({
      clave: 'P001',
      nombre: 'Sueldo Base (Nominal)',
      tipo: 'gravado',
      base: salarioDiarioNominal,
      tasa: diasPagados,
      importe: bpToPesos(sueldoNominalBp),
      importeBp: sueldoNominalBp,
      fundamentoLegal: 'LFT Art. 82-89',
    });

    // Percepción adicional exenta
    if (salarioDiarioExento > 0) {
      const percepcionExentaBp = pesosToBp(salarioDiarioExento * diasPagados);
      percepcionesInternas.push({
        clave: 'P002',
        nombre: 'Percepción Adicional Diaria (Exento)',
        tipo: 'exento',
        base: salarioDiarioExento,
        tasa: diasPagados,
        importe: bpToPesos(percepcionExentaBp),
        importeBp: percepcionExentaBp,
        fundamentoLegal: 'LISR Art. 93',
      });
    }

    // Horas extra (si hay)
    if (resumenDias && resumenDias.horasExtra > 0) {
      const horasExtraImporte = (salarioDiarioReal / 8) * resumenDias.horasExtra * 2;
      const horasExtraBp = pesosToBp(horasExtraImporte);
      percepcionesInternas.push({
        clave: 'P019',
        nombre: 'Horas Extra Dobles',
        tipo: 'exento',
        base: salarioDiarioReal / 8,
        tasa: resumenDias.horasExtra * 2,
        importe: bpToPesos(horasExtraBp),
        importeBp: horasExtraBp,
        fundamentoLegal: 'LFT Art. 67-68, LISR Art. 93 Fracc. I',
      });
    }

    // Días festivos trabajados (pago doble adicional)
    if (resumenDias && resumenDias.diasFestivos > 0) {
      const festivoImporte = salarioDiarioReal * resumenDias.diasFestivos;
      const festivoBp = pesosToBp(festivoImporte);
      percepcionesInternas.push({
        clave: 'P028',
        nombre: 'Días Festivos Trabajados (Extra)',
        tipo: 'gravado',
        base: salarioDiarioReal,
        tasa: resumenDias.diasFestivos,
        importe: bpToPesos(festivoBp),
        importeBp: festivoBp,
        fundamentoLegal: 'LFT Art. 74-75',
      });
    }

    // Prima dominical (25%)
    if (resumenDias && resumenDias.diasDomingo > 0) {
      const primaDomImporte = salarioDiarioReal * resumenDias.diasDomingo * 0.25;
      const primaDomBp = pesosToBp(primaDomImporte);
      percepcionesInternas.push({
        clave: 'P020',
        nombre: 'Prima Dominical (25%)',
        tipo: 'exento',
        base: salarioDiarioReal * 0.25,
        tasa: resumenDias.diasDomingo,
        importe: bpToPesos(primaDomBp),
        importeBp: primaDomBp,
        fundamentoLegal: 'LFT Art. 71, LISR Art. 93 Fracc. I',
      });
    }
  }

  // Totales de percepciones (usando BigInt internamente)
  const totalPercepcionesBp = percepcionesInternas.reduce((sum, p) => sumarBp(sum, p.importeBp), BigInt(0));
  const totalPercepcionesGravadasBp = percepcionesInternas
    .filter(p => p.tipo === 'gravado')
    .reduce((sum, p) => sumarBp(sum, p.importeBp), BigInt(0));
  const totalPercepcionesExentasBp = percepcionesInternas
    .filter(p => p.tipo === 'exento')
    .reduce((sum, p) => sumarBp(sum, p.importeBp), BigInt(0));
  
  // Convertir a formato de respuesta (sin BigInt)
  const percepciones: ConceptoPercepcion[] = percepcionesInternas.map(({ importeBp, ...rest }) => rest);

  // 5. Calcular IMSS
  const configIMSS: ConfiguracionIMSS = {
    anio: 2025,
    umaDiaria: CONFIG_FISCAL_2025.uma.diaria,
    umaMensual: CONFIG_FISCAL_2025.uma.mensual,
    salarioMinimoDiario: CONFIG_FISCAL_2025.salarioMinimo.general,
    topeUmas: CONFIG_FISCAL_2025.limiteSuperiorCotizacionUMAs,
  };

  const empleadoIMSS: EmpleadoIMSS = {
    empleadoId,
    sbcDiario: sbc,
    diasCotizados: diasCotizadosIMSS,
    empresaId: emp.empresaId || undefined,
  };

  const resultadoIMSS = await calcularCuotasIMSS(empleadoIMSS, configIMSS);

  // 6. Calcular ISR
  const periodoISR = mapFrecuenciaToPeriodo(frecuencia);
  const baseGravableBp = totalPercepcionesGravadasBp;
  
  // Restar IMSS obrero de la base gravable para ISR
  const baseISRBp = restarBp(baseGravableBp, pesosToBp(resultadoIMSS.totalObrero));
  
  const isrResult = calcularISR(baseISRBp, periodoISR);
  const subsidioEmpleoBp = calcularSubsidio2025(baseISRBp, periodoISR);
  
  const isrAntesSubsidio = bpToPesos(isrResult.isrBp);
  const subsidioEmpleo = bpToPesos(subsidioEmpleoBp);
  const isrNeto = Math.max(0, isrAntesSubsidio - subsidioEmpleo);

  // 7. Armar deducciones
  const deducciones: ConceptoDeduccion[] = [];

  // ISR (si es positivo)
  if (isrNeto > 0) {
    deducciones.push({
      clave: 'D002',
      nombre: 'ISR (Retención)',
      base: bpToPesos(baseISRBp),
      importe: isrNeto,
      fundamentoLegal: 'LISR Art. 96',
    });
  }

  // IMSS Obrero
  for (const cuota of resultadoIMSS.cuotasObrero) {
    deducciones.push({
      clave: 'D001',
      nombre: `IMSS ${cuota.concepto}`,
      base: cuota.base,
      tasa: cuota.tasaPorcentaje,
      importe: cuota.monto,
      fundamentoLegal: 'LSS Art. 25, 106, 147',
    });
  }

  // Subsidio al empleo (si aplica, es una percepción negativa / reducción de ISR)
  // Ya está considerado en isrNeto

  // Total deducciones (calculado desde importe en pesos)
  const totalDeduccionesBp = deducciones.reduce((sum, d) => sumarBp(sum, pesosToBp(d.importe)), BigInt(0));

  // 8. Calcular neto a pagar
  const netoBp = restarBp(totalPercepcionesBp, totalDeduccionesBp);
  
  // Agregar subsidio si ISR es menor que subsidio
  let netoFinal = bpToPesos(netoBp);
  if (subsidioEmpleo > isrAntesSubsidio) {
    netoFinal += (subsidioEmpleo - isrAntesSubsidio);
  }

  // 9. Costo total empresa
  const costoTotalEmpresa = bpToPesos(totalPercepcionesBp) + resultadoIMSS.totalPatronal;

  // 10. Armar respuesta
  return {
    empleado: {
      id: emp.id,
      nombreCompleto: `${emp.nombre} ${emp.apellidoPaterno} ${emp.apellidoMaterno || ''}`.trim(),
      rfc: emp.rfc || undefined,
      curp: emp.curp || undefined,
      nss: emp.nss || undefined,
      empresa: empresa?.nombreComercial || empresa?.razonSocial || 'N/A',
      puesto: emp.puesto || undefined,
    },
    periodo: {
      fechaInicio: fechaInicio.toISOString().split('T')[0],
      fechaFin: fechaFin.toISOString().split('T')[0],
      frecuencia,
      diasNaturales: diasPeriodo,
      diasPagados,
      diasCotizadosIMSS,
    },
    incidencias: resumenDias ? {
      faltas: resumenDias.faltas,
      incapacidades: resumenDias.incapacidades,
      permisos: resumenDias.permisosSinGoce + resumenDias.permisosConGoce,
      vacaciones: resumenDias.vacaciones,
      diasFestivos: resumenDias.diasFestivos,
      horasExtra: resumenDias.horasExtra,
    } : undefined,
    salarios: {
      salarioDiarioReal,
      salarioDiarioNominal,
      salarioDiarioExento,
      sbc,
      sdi,
    },
    percepciones,
    totalPercepciones: bpToPesos(totalPercepcionesBp),
    totalPercepcionesGravadas: bpToPesos(totalPercepcionesGravadasBp),
    totalPercepcionesExentas: bpToPesos(totalPercepcionesExentasBp),
    deducciones,
    totalDeducciones: bpToPesos(totalDeduccionesBp),
    desgloseIMSS: {
      cuotasObrero: resultadoIMSS.cuotasObrero.map(c => ({
        concepto: c.concepto,
        base: c.base,
        tasa: c.tasaPorcentaje,
        importe: c.monto,
      })),
      cuotasPatronal: resultadoIMSS.cuotasPatronal.map(c => ({
        concepto: c.concepto,
        base: c.base,
        tasa: c.tasaPorcentaje,
        importe: c.monto,
      })),
      totalObrero: resultadoIMSS.totalObrero,
      totalPatronal: resultadoIMSS.totalPatronal,
    },
    isr: {
      baseGravable: bpToPesos(baseISRBp),
      isrAntesSubsidio,
      subsidioEmpleo,
      isrNeto,
    },
    netoAPagar: netoFinal,
    costoTotalEmpresa,
  };
}
