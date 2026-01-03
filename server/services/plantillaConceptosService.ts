/**
 * Servicio de Plantilla de Conceptos
 * 
 * Obtiene la plantilla predeterminada de una empresa con sus conceptos
 * y proporciona funciones para evaluar las fórmulas de cada concepto.
 */

import { db } from "../db";
import { 
  empresas, 
  plantillasNomina, 
  plantillaConceptos, 
  conceptosNomina 
} from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { Parser } from "expr-eval";
import type { 
  PlantillaNominaWithConceptos, 
  ConceptoNomina, 
  PlantillaConcepto 
} from "@shared/schema";

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export interface VariablesNomina {
  // Salarios base
  SALARIO_BASE: number;
  SALARIO_DIARIO: number;
  SALARIO_DIARIO_REAL: number;
  SALARIO_DIARIO_NOMINAL: number;
  SALARIO_PERIODO: number;
  SALARIO_HORA: number;
  SBC: number;
  SDI: number;
  // Días
  DIAS_TRABAJADOS: number;
  DIAS_PERIODO: number;
  DIAS_PAGADOS: number;
  DIAS_AGUINALDO: number;
  // UMA y Salario Mínimo
  UMA_DIARIA: number;
  UMA_MENSUAL: number;
  UMA_ANUAL: number;
  SMG_DIARIO: number;
  SMG_MENSUAL: number;
  SALARIO_MINIMO: number;
  // Incidencias
  HORAS_EXTRA_DOBLES: number;
  HORAS_EXTRA_TRIPLES: number;
  DIAS_VACACIONES: number;
  ANTIGUEDAD_ANOS: number;
  DIAS_FESTIVOS_TRABAJADOS: number;
  DIAS_DOMINGO: number;
  // Deducciones y beneficios (valores opcionales, default 0)
  DESCUENTO_INFONAVIT: number;
  DESCUENTO_FONACOT: number;
  MONTO_VALES: number;
  MONTO_FONDO_AHORRO: number;
  PORCENTAJE_PTU: number;
  CUOTA_IMSS: number;
  ISR_RETENIDO: number;
  SUBSIDIO_EMPLEO: number;
}

export interface ConceptoEvaluado {
  id: string;
  clave: string;
  nombre: string;
  tipo: 'percepcion' | 'deduccion';
  tipoGravable: 'gravado' | 'exento' | 'mixto';
  categoria: string;
  nivel: string;
  formula: string;
  importe: number;
  importeGravado: number;
  importeExento: number;
  limiteExento?: number;
  fundamentoLegal?: string;
  canal: 'nomina' | 'exento';
  esObligatorio: boolean;
  integraSalarioBase: boolean; // Si es parte del desglose del salario base (no suma adicional)
  orden: number;
}

export interface PlantillaConConceptosEvaluados {
  plantilla: PlantillaNominaWithConceptos;
  conceptosEvaluados: ConceptoEvaluado[];
  totalPercepciones: number;
  totalPercepcionesGravadas: number;
  totalPercepcionesExentas: number;
  totalDeducciones: number;
}

// ============================================================================
// CONSTANTES
// ============================================================================

// Variables permitidas en evaluación de fórmulas del catálogo unificado
// Incluye todas las variables que pueden aparecer en fórmulas del catálogo
const ALLOWED_FORMULA_VARIABLES = new Set([
  // Salarios base
  'SALARIO_BASE', 'SALARIO_DIARIO', 'SALARIO_DIARIO_REAL', 'SALARIO_DIARIO_NOMINAL',
  'SALARIO_PERIODO', 'SALARIO_HORA', 'SBC', 'SDI', 
  // Días
  'DIAS_TRABAJADOS', 'DIAS_PERIODO', 'DIAS_PAGADOS', 'DIAS_AGUINALDO',
  // UMA y Salario Mínimo
  'UMA_DIARIA', 'UMA_MENSUAL', 'UMA_ANUAL',
  'SMG_DIARIO', 'SMG_MENSUAL', 'SALARIO_MINIMO',
  // Incidencias
  'HORAS_EXTRA_DOBLES', 'HORAS_EXTRA_TRIPLES',
  'DIAS_VACACIONES', 'ANTIGUEDAD_ANOS', 'DIAS_FESTIVOS_TRABAJADOS', 'DIAS_DOMINGO',
  // Deducciones y beneficios (valores opcionales con defaults en 0)
  'DESCUENTO_INFONAVIT', 'DESCUENTO_FONACOT',
  'MONTO_VALES', 'MONTO_FONDO_AHORRO', 'PORCENTAJE_PTU',
  'CUOTA_IMSS', 'ISR_RETENIDO', 'SUBSIDIO_EMPLEO',
]);

const ALLOWED_FUNCTIONS = ['min', 'max', 'abs', 'round', 'ceil', 'floor'];

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

function validarFormula(formula: string, variables: Record<string, number>): { valid: boolean; error?: string } {
  const normalizada = formula
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/\bMIN\b/gi, 'min')
    .replace(/\bMAX\b/gi, 'max')
    .replace(/\bABS\b/gi, 'abs')
    .replace(/\bROUND\b/gi, 'round')
    .replace(/\bCEIL\b/gi, 'ceil')
    .replace(/\bFLOOR\b/gi, 'floor');
  
  const variablesEnFormula = normalizada.match(/[a-zA-Z_][a-zA-Z0-9_]*/g) || [];
  
  for (const varName of variablesEnFormula) {
    const isAllowedFunction = ALLOWED_FUNCTIONS.includes(varName.toLowerCase());
    const isAllowedVariable = ALLOWED_FORMULA_VARIABLES.has(varName) || variables[varName] !== undefined;
    
    if (!isAllowedFunction && !isAllowedVariable) {
      return { valid: false, error: `Variable o función no permitida: ${varName}` };
    }
  }
  
  const patronPermitido = /^[\d\s+\-*/().,%a-zA-Z_]+$/;
  if (!patronPermitido.test(normalizada)) {
    return { valid: false, error: 'Caracteres no permitidos en la fórmula' };
  }
  
  return { valid: true };
}

function evaluarFormulaNomina(
  formula: string,
  variables: VariablesNomina
): number {
  if (!formula || formula.trim() === '' || formula === '0') {
    return 0;
  }

  const vars: Record<string, number> = { ...variables } as Record<string, number>;

  const validacion = validarFormula(formula, vars);
  if (!validacion.valid) {
    console.error('Fórmula rechazada por seguridad:', formula, validacion.error);
    return 0;
  }

  let formulaNormalizada = formula
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/\bMIN\b/gi, 'min')
    .replace(/\bMAX\b/gi, 'max')
    .replace(/\bABS\b/gi, 'abs')
    .replace(/\bROUND\b/gi, 'round')
    .replace(/\bCEIL\b/gi, 'ceil')
    .replace(/\bFLOOR\b/gi, 'floor');

  try {
    const parser = new Parser();
    const expr = parser.parse(formulaNormalizada);
    const resultado = expr.evaluate(vars);
    
    if (typeof resultado !== 'number' || isNaN(resultado) || !isFinite(resultado)) {
      console.error('Resultado de fórmula inválido:', formula, resultado);
      return 0;
    }
    
    return Math.round(resultado * 10000) / 10000;
  } catch (error) {
    console.error('Error evaluando fórmula:', formula, error);
    return 0;
  }
}

function evaluarLimiteExento(
  limiteExento: string | null | undefined,
  variables: VariablesNomina
): number | undefined {
  if (!limiteExento || limiteExento.trim() === '') {
    return undefined;
  }

  // Si es un número directo
  const numDirecto = parseFloat(limiteExento);
  if (!isNaN(numDirecto)) {
    return numDirecto;
  }

  // Si es una fórmula (ej: "3*UMA_DIARIA")
  return evaluarFormulaNomina(limiteExento, variables);
}

function calcularImportesGravadoExento(
  importe: number,
  gravableISR: boolean,
  limiteExento: number | undefined
): { gravado: number; exento: number } {
  if (!gravableISR) {
    // Todo es exento
    return { gravado: 0, exento: importe };
  }

  if (limiteExento === undefined || limiteExento <= 0) {
    // Todo es gravado
    return { gravado: importe, exento: 0 };
  }

  // Tiene límite exento
  const exento = Math.min(importe, limiteExento);
  const gravado = Math.max(0, importe - limiteExento);
  
  return { gravado, exento };
}

// ============================================================================
// FUNCIONES PRINCIPALES
// ============================================================================

/**
 * Obtiene la plantilla predeterminada de una empresa con todos sus conceptos
 */
export async function obtenerPlantillaPredeterminada(
  empresaId: string
): Promise<PlantillaNominaWithConceptos | null> {
  // Obtener empresa para saber cuál es su plantilla default
  const empresaData = await db
    .select()
    .from(empresas)
    .where(eq(empresas.id, empresaId))
    .limit(1);

  if (!empresaData[0] || !empresaData[0].defaultPlantillaNominaId) {
    return null;
  }

  const plantillaId = empresaData[0].defaultPlantillaNominaId;

  // Obtener la plantilla
  const plantillaData = await db
    .select()
    .from(plantillasNomina)
    .where(eq(plantillasNomina.id, plantillaId))
    .limit(1);

  if (!plantillaData[0]) {
    return null;
  }

  // Obtener los conceptos de la plantilla con datos del catálogo
  const conceptosData = await db
    .select({
      plantillaConcepto: plantillaConceptos,
      concepto: conceptosNomina,
    })
    .from(plantillaConceptos)
    .innerJoin(conceptosNomina, eq(plantillaConceptos.conceptoNominaId, conceptosNomina.id))
    .where(eq(plantillaConceptos.plantillaId, plantillaId))
    .orderBy(plantillaConceptos.orden);

  const conceptos = conceptosData.map(row => ({
    ...row.plantillaConcepto,
    concepto: row.concepto,
  }));

  return {
    ...plantillaData[0],
    conceptos,
  };
}

/**
 * Evalúa todos los conceptos de una plantilla con las variables de nómina dadas
 */
export function evaluarConceptosPlantilla(
  plantilla: PlantillaNominaWithConceptos,
  variables: VariablesNomina
): PlantillaConConceptosEvaluados {
  const conceptosEvaluados: ConceptoEvaluado[] = [];
  let totalPercepciones = 0;
  let totalPercepcionesGravadas = 0;
  let totalPercepcionesExentas = 0;
  let totalDeducciones = 0;

  for (const pc of plantilla.conceptos) {
    const concepto = pc.concepto;
    
    // Si hay valorDefault en la plantilla, usarlo; sino evaluar fórmula
    let importe = 0;
    if (pc.valorDefault) {
      importe = parseFloat(pc.valorDefault);
    } else if (concepto.formula && concepto.formula !== '0') {
      importe = evaluarFormulaNomina(concepto.formula, variables);
    }

    // Calcular límite exento (conceptosNomina no tiene limiteExento, usar undefined)
    const limiteExento = undefined;

    // Usar afectaIsr del nuevo schema (equivalente a gravableISR)
    const esGravable = concepto.afectaIsr ?? concepto.gravado;
    
    // Calcular gravado vs exento
    const { gravado, exento } = calcularImportesGravadoExento(
      importe,
      esGravable,
      limiteExento
    );

    // Determinar tipo gravable
    let tipoGravable: 'gravado' | 'exento' | 'mixto' = 'exento';
    if (gravado > 0 && exento > 0) {
      tipoGravable = 'mixto';
    } else if (gravado > 0) {
      tipoGravable = 'gravado';
    }

    // Generar clave basada en código o SAT clave si existe
    const claveBase = concepto.satClave || concepto.codigo || concepto.id.substring(0, 6).toUpperCase();
    const clave = concepto.tipo === 'percepcion' ? `P${claveBase}` : `D${claveBase}`;

    // Verificar si el concepto integra al salario base (override de plantilla o valor del concepto)
    const integraSalarioBase = pc.integraSalarioBaseOverride ?? concepto.integraSalarioBase ?? false;

    // Determinar canal: si tiene medioPagoId (override o del concepto), es 'exento', sino 'nomina'
    const medioPagoEfectivo = pc.medioPagoOverrideId || concepto.medioPagoId;
    const canal: 'nomina' | 'exento' = medioPagoEfectivo ? 'exento' : 'nomina';

    const conceptoEvaluado: ConceptoEvaluado = {
      id: concepto.id,
      clave,
      nombre: concepto.nombre,
      tipo: concepto.tipo as 'percepcion' | 'deduccion',
      tipoGravable,
      categoria: concepto.categoria || 'otros',
      nivel: 'adicional', // conceptosNomina no tiene nivel, usar default
      formula: concepto.formula || '',
      importe,
      importeGravado: gravado,
      importeExento: exento,
      limiteExento,
      fundamentoLegal: undefined, // conceptosNomina no tiene fundamentoLegal
      canal,
      esObligatorio: pc.esObligatorio,
      integraSalarioBase,
      orden: pc.orden,
    };

    conceptosEvaluados.push(conceptoEvaluado);

    // Acumular totales - los conceptos que integran salario base NO suman al total
    // ya que son parte del desglose del salario base, no percepciones adicionales
    if (concepto.tipo === 'percepcion') {
      if (!integraSalarioBase) {
        totalPercepciones += importe;
        totalPercepcionesGravadas += gravado;
        totalPercepcionesExentas += exento;
      }
      // Si integraSalarioBase=true, el concepto se muestra pero no suma al total
    } else {
      totalDeducciones += importe;
    }
  }

  return {
    plantilla,
    conceptosEvaluados,
    totalPercepciones: Math.round(totalPercepciones * 100) / 100,
    totalPercepcionesGravadas: Math.round(totalPercepcionesGravadas * 100) / 100,
    totalPercepcionesExentas: Math.round(totalPercepcionesExentas * 100) / 100,
    totalDeducciones: Math.round(totalDeducciones * 100) / 100,
  };
}

/**
 * Obtiene y evalúa la plantilla predeterminada de una empresa
 */
export async function obtenerYEvaluarPlantillaPredeterminada(
  empresaId: string,
  variables: VariablesNomina
): Promise<PlantillaConConceptosEvaluados | null> {
  const plantilla = await obtenerPlantillaPredeterminada(empresaId);
  
  if (!plantilla) {
    return null;
  }

  return evaluarConceptosPlantilla(plantilla, variables);
}

/**
 * Genera las variables de nómina a partir de datos del empleado y periodo
 */
export function generarVariablesNomina(params: {
  salarioDiarioReal: number;
  salarioDiarioNominal: number;
  sbc: number;
  sdi: number;
  diasTrabajados: number;
  diasPeriodo: number;
  diasPagados: number;
  horasExtraDobles?: number;
  horasExtraTriples?: number;
  diasVacaciones?: number;
  antiguedadAnos?: number;
  diasFestivosTrabajados?: number;
  diasDomingo?: number;
  umaDiaria?: number;
  smgDiario?: number;
}): VariablesNomina {
  const {
    salarioDiarioReal,
    salarioDiarioNominal,
    sbc,
    sdi,
    diasTrabajados,
    diasPeriodo,
    diasPagados,
    horasExtraDobles = 0,
    horasExtraTriples = 0,
    diasVacaciones = 0,
    antiguedadAnos = 0,
    diasFestivosTrabajados = 0,
    diasDomingo = 0,
    umaDiaria = 113.14,
    smgDiario = 278.80,
  } = params;

  return {
    // Salarios base
    SALARIO_BASE: salarioDiarioNominal,
    SALARIO_DIARIO: salarioDiarioReal,
    SALARIO_DIARIO_REAL: salarioDiarioReal,
    SALARIO_DIARIO_NOMINAL: salarioDiarioNominal,
    SALARIO_PERIODO: salarioDiarioReal * diasPagados,
    SALARIO_HORA: salarioDiarioReal / 8,
    SBC: sbc,
    SDI: sdi,
    // Días
    DIAS_TRABAJADOS: diasTrabajados,
    DIAS_PERIODO: diasPeriodo,
    DIAS_PAGADOS: diasPagados,
    DIAS_AGUINALDO: 15,
    // UMA y Salario Mínimo
    UMA_DIARIA: umaDiaria,
    UMA_MENSUAL: umaDiaria * 30.4,
    UMA_ANUAL: umaDiaria * 365,
    SALARIO_MINIMO: smgDiario,
    SMG_DIARIO: smgDiario,
    SMG_MENSUAL: smgDiario * 30.4,
    // Incidencias
    HORAS_EXTRA_DOBLES: horasExtraDobles,
    HORAS_EXTRA_TRIPLES: horasExtraTriples,
    DIAS_VACACIONES: diasVacaciones,
    ANTIGUEDAD_ANOS: antiguedadAnos,
    DIAS_FESTIVOS_TRABAJADOS: diasFestivosTrabajados,
    DIAS_DOMINGO: diasDomingo,
    // Deducciones y beneficios (defaults en 0 - se pueden sobrescribir en el cálculo)
    DESCUENTO_INFONAVIT: 0,
    DESCUENTO_FONACOT: 0,
    MONTO_VALES: 0,
    MONTO_FONDO_AHORRO: 0,
    PORCENTAJE_PTU: 0,
    CUOTA_IMSS: 0,
    ISR_RETENIDO: 0,
    SUBSIDIO_EMPLEO: 0,
  };
}
