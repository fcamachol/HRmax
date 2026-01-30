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
import { employees, empresas, centrosTrabajo, gruposNomina, type PagoAdicional } from "@shared/schema";
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
  // Campos adicionales para compatibilidad con ResultadoNomina del frontend
  concepto?: string;  // Alias de nombre
  monto?: number;     // Alias de importe
  gravado?: number;   // Importe gravado
  exento?: number;    // Importe exento
}

export interface ConceptoDeduccion {
  clave: string;
  nombre: string;
  base: number;
  tasa?: number;
  importe: number;
  fundamentoLegal?: string;
  // Campos adicionales para compatibilidad con ResultadoNomina del frontend
  concepto?: string;  // Alias de nombre
  monto?: number;     // Alias de importe
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

  // Total real que recibe el empleado (neto CFDI + SDE)
  // Separado para compliance: netoAPagar es oficial (CFDI), netoAPagarTotal incluye pago por fuera
  netoAPagarTotal: number;

  // Pago adicional (SDE) - NO aparece en CFDI
  pagoAdicional?: PagoAdicional;
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

/**
 * Calcula un concepto de nómina dividiendo el monto entre parte nominal y SDE.
 * El SDE (Salario Diario Exento) es la parte del salario que NO aparece en CFDI.
 *
 * @param concepto - Nombre del concepto
 * @param salarioDiarioNominal - Salario diario nominal (aparece en CFDI)
 * @param salarioDiarioExento - Salario diario exento (pago adicional, no en CFDI)
 * @param factor - Multiplicador (ej: 2 para horas dobles, 1 para días normales)
 * @param cantidad - Cantidad de unidades (días, horas, etc.)
 * @returns Objeto con el concepto y montos separados para nominal y SDE
 */
function calcularConceptoConSDE(
  concepto: string,
  salarioDiarioNominal: number,
  salarioDiarioExento: number,
  factor: number,
  cantidad: number,
): { concepto: string; montoNominal: number; montoSDE: number } {
  const salarioDiarioReal = salarioDiarioNominal + salarioDiarioExento;
  const montoTotal = salarioDiarioReal * factor * cantidad;

  // Si no hay SDE, todo va a nominal
  if (salarioDiarioExento <= 0 || salarioDiarioReal <= 0) {
    return { concepto, montoNominal: montoTotal, montoSDE: 0 };
  }

  const proporcionNominal = salarioDiarioNominal / salarioDiarioReal;
  return {
    concepto,
    montoNominal: montoTotal * proporcionNominal,
    montoSDE: montoTotal * (1 - proporcionNominal),
  };
}

/**
 * Calcula un concepto usando tarifa por hora con división nominal/SDE.
 *
 * @param concepto - Nombre del concepto
 * @param salarioDiarioNominal - Salario diario nominal
 * @param salarioDiarioExento - Salario diario exento
 * @param horas - Número de horas
 * @param multiplicador - Multiplicador de tarifa (2 para doble, 3 para triple)
 * @returns Objeto con el concepto y montos separados
 */
function calcularConceptoPorHoraConSDE(
  concepto: string,
  salarioDiarioNominal: number,
  salarioDiarioExento: number,
  horas: number,
  multiplicador: number,
): { concepto: string; montoNominal: number; montoSDE: number } {
  const salarioDiarioReal = salarioDiarioNominal + salarioDiarioExento;
  const tarifaHoraReal = salarioDiarioReal / 8;
  const montoTotal = tarifaHoraReal * horas * multiplicador;

  // Si no hay SDE, todo va a nominal
  if (salarioDiarioExento <= 0 || salarioDiarioReal <= 0) {
    return { concepto, montoNominal: montoTotal, montoSDE: 0 };
  }

  const proporcionNominal = salarioDiarioNominal / salarioDiarioReal;
  return {
    concepto,
    montoNominal: montoTotal * proporcionNominal,
    montoSDE: montoTotal * (1 - proporcionNominal),
  };
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
  // IMPORTANTE: SBC y SDI siempre usan salario NOMINAL - SDE nunca integra a seguro social
  const sbc = parseFloat(emp.sbc || emp.salarioDiarioNominal || '0');
  const sdi = parseFloat(emp.sdi || emp.sbc || emp.salarioDiarioNominal || '0');

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
    // MEJORADO: Usar el desglose de horas extra del calculador de días
    horasExtraDobles: resumenDias?.horasExtraDetalle?.horasDobles || resumenDias?.horasExtra || 0,
    horasExtraTriples: resumenDias?.horasExtraDetalle?.horasTriples || 0,
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

  // Variables para deducciones adicionales de plantilla
  const deduccionesPlantilla: ConceptoDeduccion[] = [];

  // Acumulador de conceptos SDE para el pago adicional (ambas ramas lo usan)
  const conceptosSDE: { concepto: string; monto: number }[] = [];

  if (usandoPlantilla && conceptosPlantilla.length > 0) {
    // Para plantillas, agregamos SDE del sueldo base si existe
    // (la plantilla solo maneja la parte nominal, el SDE es adicional)
    if (salarioDiarioExento > 0) {
      conceptosSDE.push({
        concepto: 'Sueldo Base',
        monto: salarioDiarioExento * diasPagados,
      });
    }
    // Usar conceptos de la plantilla predeterminada
    for (const concepto of conceptosPlantilla) {
      if (concepto.tipo === 'percepcion' && concepto.importe > 0) {
        // Calcular base diaria y días para mantener semántica: importe = base * tasa
        // Proteger contra diasPagados = 0 (empleado en licencia/incapacidad)
        const tasaDias = diasPagados > 0 ? diasPagados : 1;
        const baseDiaria = concepto.importe / tasaDias;
        
        // Para conceptos mixtos (gravado + exento), creamos dos filas separadas
        if (concepto.tipoGravable === 'mixto' && concepto.importeGravado > 0 && concepto.importeExento > 0) {
          // Fila gravada
          const gravadoBp = pesosToBp(concepto.importeGravado);
          const baseGravadaDiaria = concepto.importeGravado / tasaDias;
          percepcionesInternas.push({
            clave: concepto.clave,
            nombre: `${concepto.nombre} (Gravado)`,
            tipo: 'gravado',
            base: baseGravadaDiaria,
            tasa: tasaDias,
            importe: concepto.importeGravado,
            importeBp: gravadoBp,
            fundamentoLegal: concepto.fundamentoLegal,
          });
          
          // Fila exenta - mantiene la misma clave SAT base
          const exentoBp = pesosToBp(concepto.importeExento);
          const baseExentaDiaria = concepto.importeExento / tasaDias;
          percepcionesInternas.push({
            clave: concepto.clave,
            nombre: `${concepto.nombre} (Exento)`,
            tipo: 'exento',
            base: baseExentaDiaria,
            tasa: tasaDias,
            importe: concepto.importeExento,
            importeBp: exentoBp,
            fundamentoLegal: concepto.fundamentoLegal,
          });
        } else {
          // Concepto simple: todo gravado o todo exento
          const importeBp = pesosToBp(concepto.importe);
          percepcionesInternas.push({
            clave: concepto.clave,
            nombre: concepto.nombre,
            tipo: concepto.tipoGravable === 'exento' ? 'exento' : 'gravado',
            base: baseDiaria,
            tasa: tasaDias,
            importe: concepto.importe,
            importeBp,
            fundamentoLegal: concepto.fundamentoLegal,
          });
        }
      } else if (concepto.tipo === 'deduccion' && concepto.importe > 0) {
        // Agregar deducciones de la plantilla (ej: Infonavit, préstamos)
        deduccionesPlantilla.push({
          clave: concepto.clave,
          nombre: concepto.nombre,
          base: concepto.importe,
          importe: concepto.importe,
          fundamentoLegal: concepto.fundamentoLegal,
        });
      }
    }
  } else {
    // Fallback: usar percepciones hardcodeadas si no hay plantilla

    // Sueldo base nominal (gravado) - SOLO la parte nominal va al CFDI
    // La parte SDE se acumula por separado en pagoAdicional
    const sueldoNominalBp = pesosToBp(salarioDiarioNominal * diasPagados);
    percepcionesInternas.push({
      clave: 'P001',
      nombre: 'Sueldo Base',
      tipo: 'gravado',
      base: salarioDiarioNominal,
      tasa: diasPagados,
      importe: bpToPesos(sueldoNominalBp),
      importeBp: sueldoNominalBp,
      fundamentoLegal: 'LFT Art. 82-89',
    });

    // SDE del sueldo base (si aplica) - usa el conceptosSDE declarado arriba
    if (salarioDiarioExento > 0) {
      conceptosSDE.push({
        concepto: 'Sueldo Base',
        monto: salarioDiarioExento * diasPagados,
      });
    }

    // Horas extra DOBLES (si hay) - LFT Art. 67: Primeras 9 horas semanales al 200%
    const horasDobles = resumenDias?.horasExtraDetalle?.horasDobles || 0;
    if (horasDobles > 0) {
      const resultHorasDobles = calcularConceptoPorHoraConSDE(
        'Horas Extra Dobles (200%)',
        salarioDiarioNominal,
        salarioDiarioExento,
        horasDobles,
        2, // 200%
      );

      // Parte nominal va al CFDI
      const horasExtraDoblesBp = pesosToBp(resultHorasDobles.montoNominal);
      percepcionesInternas.push({
        clave: 'P019',
        nombre: 'Horas Extra Dobles (200%)',
        tipo: 'exento', // Exentas hasta 50% del salario según LISR Art. 93 Fracc. I
        base: salarioDiarioNominal / 8,
        tasa: horasDobles * 2,
        importe: bpToPesos(horasExtraDoblesBp),
        importeBp: horasExtraDoblesBp,
        fundamentoLegal: 'LFT Art. 67, LISR Art. 93 Fracc. I',
      });

      // Parte SDE va al pago adicional
      if (resultHorasDobles.montoSDE > 0) {
        conceptosSDE.push({
          concepto: 'Horas Extra Dobles (200%)',
          monto: resultHorasDobles.montoSDE,
        });
      }
    }

    // Horas extra TRIPLES (si hay) - LFT Art. 68: Excedente de 9 horas semanales al 300%
    const horasTriples = resumenDias?.horasExtraDetalle?.horasTriples || 0;
    if (horasTriples > 0) {
      const resultHorasTriples = calcularConceptoPorHoraConSDE(
        'Horas Extra Triples (300%)',
        salarioDiarioNominal,
        salarioDiarioExento,
        horasTriples,
        3, // 300%
      );

      // Parte nominal va al CFDI
      const horasExtraTriplesBp = pesosToBp(resultHorasTriples.montoNominal);
      percepcionesInternas.push({
        clave: 'P019',
        nombre: 'Horas Extra Triples (300%)',
        tipo: 'gravado', // Las horas triples son gravables
        base: salarioDiarioNominal / 8,
        tasa: horasTriples * 3,
        importe: bpToPesos(horasExtraTriplesBp),
        importeBp: horasExtraTriplesBp,
        fundamentoLegal: 'LFT Art. 68',
      });

      // Parte SDE va al pago adicional
      if (resultHorasTriples.montoSDE > 0) {
        conceptosSDE.push({
          concepto: 'Horas Extra Triples (300%)',
          monto: resultHorasTriples.montoSDE,
        });
      }
    }

    // Días festivos trabajados (pago doble adicional) - LFT Art. 74-75
    // El día festivo ya se paga como parte del sueldo base, aquí se agrega el EXTRA (1x más)
    if (resumenDias && resumenDias.diasFestivos > 0) {
      const resultFestivo = calcularConceptoConSDE(
        'Días Festivos Trabajados (Extra)',
        salarioDiarioNominal,
        salarioDiarioExento,
        1, // 1x adicional (el día ya está pagado en sueldo base)
        resumenDias.diasFestivos,
      );

      // Parte nominal va al CFDI
      const festivoBp = pesosToBp(resultFestivo.montoNominal);
      percepcionesInternas.push({
        clave: 'P028',
        nombre: 'Días Festivos Trabajados (Extra)',
        tipo: 'gravado',
        base: salarioDiarioNominal,
        tasa: resumenDias.diasFestivos,
        importe: bpToPesos(festivoBp),
        importeBp: festivoBp,
        fundamentoLegal: 'LFT Art. 74-75',
      });

      // Parte SDE va al pago adicional
      if (resultFestivo.montoSDE > 0) {
        conceptosSDE.push({
          concepto: 'Días Festivos Trabajados (Extra)',
          monto: resultFestivo.montoSDE,
        });
      }
    }

    // Prima dominical (25%) - LFT Art. 71
    if (resumenDias && resumenDias.diasDomingo > 0) {
      const resultPrimaDom = calcularConceptoConSDE(
        'Prima Dominical (25%)',
        salarioDiarioNominal,
        salarioDiarioExento,
        0.25, // 25%
        resumenDias.diasDomingo,
      );

      // Parte nominal va al CFDI
      const primaDomBp = pesosToBp(resultPrimaDom.montoNominal);
      percepcionesInternas.push({
        clave: 'P020',
        nombre: 'Prima Dominical (25%)',
        tipo: 'exento',
        base: salarioDiarioNominal * 0.25,
        tasa: resumenDias.diasDomingo,
        importe: bpToPesos(primaDomBp),
        importeBp: primaDomBp,
        fundamentoLegal: 'LFT Art. 71, LISR Art. 93 Fracc. I',
      });

      // Parte SDE va al pago adicional
      if (resultPrimaDom.montoSDE > 0) {
        conceptosSDE.push({
          concepto: 'Prima Dominical (25%)',
          monto: resultPrimaDom.montoSDE,
        });
      }
    }
  }

  // Construir objeto pagoAdicional si hay SDE (aplica tanto para plantilla como fallback)
  let pagoAdicional: PagoAdicional | undefined;
  if (salarioDiarioExento > 0 && conceptosSDE.length > 0) {
    const montoTotalSDE = conceptosSDE.reduce((sum, c) => sum + c.monto, 0);
    pagoAdicional = {
      salarioDiarioExento,
      diasPagados,
      montoBase: salarioDiarioExento * diasPagados,
      conceptos: conceptosSDE,
      montoTotal: montoTotalSDE,
      medioPagoId: emp.medioPagoExentoId || undefined,
    };
  }

  // Totales de percepciones (usando BigInt internamente)
  const totalPercepcionesBp = percepcionesInternas.reduce((sum, p) => sumarBp(sum, p.importeBp), BigInt(0));
  
  // Totales gravado/exento: ahora que las filas están separadas correctamente,
  // usamos el tipo de cada percepción interna
  const totalPercepcionesGravadasBp = percepcionesInternas
    .filter(p => p.tipo === 'gravado')
    .reduce((sum, p) => sumarBp(sum, p.importeBp), BigInt(0));
  const totalPercepcionesExentasBp = percepcionesInternas
    .filter(p => p.tipo === 'exento')
    .reduce((sum, p) => sumarBp(sum, p.importeBp), BigInt(0));
  
  // Convertir a formato de respuesta compatible con frontend (sin BigInt)
  // El frontend espera: { concepto, monto, gravado, exento }
  const percepciones: ConceptoPercepcion[] = percepcionesInternas.map(({ importeBp, nombre, importe, tipo, ...rest }) => ({
    ...rest,
    nombre,
    tipo,
    importe,
    // Campos adicionales para compatibilidad con ResultadoNomina del frontend
    concepto: nombre,
    monto: importe,
    gravado: tipo === 'gravado' ? importe : 0,
    exento: tipo === 'exento' ? importe : 0,
  }));

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
    const nombreISR = 'ISR (Retención)';
    deducciones.push({
      clave: 'D002',
      nombre: nombreISR,
      base: bpToPesos(baseISRBp),
      importe: isrNeto,
      fundamentoLegal: 'LISR Art. 96',
      concepto: nombreISR,
      monto: isrNeto,
    });
  }

  // IMSS Obrero
  for (const cuota of resultadoIMSS.cuotasObrero) {
    const nombreCuota = `IMSS ${cuota.concepto}`;
    deducciones.push({
      clave: 'D001',
      nombre: nombreCuota,
      base: cuota.base,
      tasa: cuota.tasaPorcentaje,
      importe: cuota.monto,
      fundamentoLegal: 'LSS Art. 25, 106, 147',
      concepto: nombreCuota,
      monto: cuota.monto,
    });
  }

  // Deducciones de la plantilla (Infonavit, préstamos, etc.)
  for (const deduccion of deduccionesPlantilla) {
    deducciones.push({
      ...deduccion,
      concepto: deduccion.nombre,
      monto: deduccion.importe,
    });
  }

  // Subsidio al empleo (si aplica, es una percepción negativa / reducción de ISR)
  // Ya está considerado en isrNeto

  // Total deducciones (calculado desde importe en pesos)
  const totalDeduccionesBp = deducciones.reduce((sum, d) => sumarBp(sum, pesosToBp(d.importe)), BigInt(0));

  // 8. Calcular neto a pagar
  const netoBp = restarBp(totalPercepcionesBp, totalDeduccionesBp);

  // IMPORTANTE 2025: El subsidio al empleo ya NO se entrega al trabajador
  // si excede el ISR causado (DOF 31/12/2024, Art. Décimo Transitorio).
  // El subsidio solo reduce el ISR a $0, sin entregar diferencia.
  // Por lo tanto, NO se suma nada adicional al neto.
  const netoFinal = bpToPesos(netoBp);

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
    incidencias: resumenDias ? (() => {
      // Extract monetary values from percepciones for incidencias summary
      const horasDoblesPago = percepciones.find(p => p.nombre.includes('Horas Extra Dobles'))?.importe || 0;
      const horasTriplesPago = percepciones.find(p => p.nombre.includes('Horas Extra Triples'))?.importe || 0;
      const primaDominical = percepciones.find(p => p.nombre.includes('Prima Dominical'))?.importe || 0;
      const pagoFestivos = percepciones.find(p => p.nombre.includes('Días Festivos'))?.importe || 0;
      const vacacionesPago = percepciones.find(p => p.clave === 'P001' && p.nombre.includes('Vacaciones'))?.importe || 0;
      const primaVacacional = percepciones.find(p => p.nombre.includes('Prima Vacacional'))?.importe || 0;

      return {
        faltas: resumenDias.faltas,
        incapacidades: resumenDias.incapacidades,
        permisos: resumenDias.permisosSinGoce + resumenDias.permisosConGoce,
        vacaciones: resumenDias.vacaciones,
        diasFestivos: resumenDias.diasFestivos,
        diasDomingo: resumenDias.diasDomingo || 0,
        horasExtra: resumenDias.horasExtra,
        horasExtraDobles: resumenDias.horasExtraDetalle?.horasDobles || 0,
        horasExtraTriples: resumenDias.horasExtraDetalle?.horasTriples || 0,
        retardos: resumenDias.retardos || 0,
        // Monetary values
        primaDominical,
        pagoFestivos,
        horasDoblesPago,
        horasTriplesPago,
        vacacionesPago,
        primaVacacional,
      };
    })() : undefined,
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
    // Total real que recibe el empleado: neto oficial + SDE (pago por fuera)
    netoAPagarTotal: netoFinal + (pagoAdicional?.montoTotal || 0),
    // Pago adicional (SDE) - solo si hay salario exento configurado
    pagoAdicional,
  };
}
