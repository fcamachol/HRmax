// Motor de cálculos de nómina para México
// Usa las tablas de configuración para calcular ISR, IMSS, y conceptos de previsión social

import { Parser } from 'expr-eval';

export type Periodicidad = 'diaria' | 'semanal' | 'decenal' | 'quincenal' | 'mensual';

export interface ISRTramo {
  limiteInferior: number;
  limiteSuperior: number | null;
  cuotaFija: number;
  porcentajeExcedente: number;
}

export interface SubsidioTramo {
  limiteInferior: number;
  limiteSuperior: number | null;
  subsidio: number;
}

export interface ISRTabla {
  periodicidad: Periodicidad;
  tramos: ISRTramo[];
  subsidioTramos: SubsidioTramo[];
}

export interface IMSSCuota {
  concepto: string;
  porcentajeObrero: number;
  porcentajePatronal: number;
}

export interface ConfiguracionNomina {
  uma: {
    diaria: number;
    mensual: number;
    anual: number;
  };
  salarioMinimo: {
    zonaGeneral: number;
    zonaFrontera: number;
  };
  isrTablas: {
    diaria: ISRTabla;
    semanal: ISRTabla;
    decenal: ISRTabla;
    quincenal: ISRTabla;
    mensual: ISRTabla;
  };
  imssCuotas: IMSSCuota[];
  infonavitTasa: number; // 5%
}

export interface ConceptoFormula {
  id: string;
  nombre: string;
  tipo: 'percepcion' | 'deduccion';
  formula: string;
  limiteExento?: string;
  gravableISR: boolean;
  integraSBC: boolean;
}

export interface EmpleadoNomina {
  salarioBase: number;
  salarioDiario: number;
  sbc: number; // Salario Base de Cotización
  diasTrabajados: number;
  zona: 'general' | 'frontera';
}

export interface ResultadoCalculoConcepto {
  concepto: string;
  monto: number;
  gravado: number;
  exento: number;
}

export interface ResultadoNomina {
  percepciones: ResultadoCalculoConcepto[];
  deducciones: ResultadoCalculoConcepto[];
  totalPercepciones: number;
  totalDeducciones: number;
  netoAPagar: number;
  baseGravableISR: number;
  isr: number;
  subsidioEmpleo: number;
  isrRetenido: number;
}

/**
 * Configuración por defecto México 2025
 */
export const configuracionDefault: ConfiguracionNomina = {
  uma: {
    diaria: 113.14,
    mensual: 3439.46,
    anual: 41273.52,
  },
  salarioMinimo: {
    zonaGeneral: 278.80,
    zonaFrontera: 419.88,
  },
  isrTablas: {
    diaria: {
      periodicidad: 'diaria',
      tramos: [
        { limiteInferior: 0.01, limiteSuperior: 298.42, cuotaFija: 0.00, porcentajeExcedente: 1.92 },
        { limiteInferior: 298.43, limiteSuperior: 2532.96, cuotaFija: 5.73, porcentajeExcedente: 6.40 },
        { limiteInferior: 2532.97, limiteSuperior: 4451.20, cuotaFija: 148.74, porcentajeExcedente: 10.88 },
        { limiteInferior: 4451.21, limiteSuperior: 5174.24, cuotaFija: 357.53, porcentajeExcedente: 16.00 },
        { limiteInferior: 5174.25, limiteSuperior: 6195.06, cuotaFija: 473.22, porcentajeExcedente: 17.92 },
        { limiteInferior: 6195.07, limiteSuperior: 12494.60, cuotaFija: 656.19, porcentajeExcedente: 21.36 },
        { limiteInferior: 12494.61, limiteSuperior: 19693.12, cuotaFija: 2001.64, porcentajeExcedente: 23.52 },
        { limiteInferior: 19693.13, limiteSuperior: 37597.18, cuotaFija: 3694.61, porcentajeExcedente: 30.00 },
        { limiteInferior: 37597.19, limiteSuperior: 50130.12, cuotaFija: 9065.86, porcentajeExcedente: 32.00 },
        { limiteInferior: 50130.13, limiteSuperior: 150389.67, cuotaFija: 13076.39, porcentajeExcedente: 34.00 },
        { limiteInferior: 150389.68, limiteSuperior: null, cuotaFija: 47164.63, porcentajeExcedente: 35.00 },
      ],
      subsidioTramos: [
        { limiteInferior: 0.01, limiteSuperior: 51.95, subsidio: 15.62 },
        { limiteInferior: 51.96, limiteSuperior: 440.58, subsidio: 15.61 },
        { limiteInferior: 440.59, limiteSuperior: 774.38, subsidio: 15.05 },
        { limiteInferior: 774.39, limiteSuperior: 902.15, subsidio: 14.27 },
        { limiteInferior: 902.16, limiteSuperior: 2653.38, subsidio: 13.88 },
        { limiteInferior: 2653.39, limiteSuperior: 3084.23, subsidio: 11.88 },
        { limiteInferior: 3084.24, limiteSuperior: 3746.15, subsidio: 9.49 },
        { limiteInferior: 3746.16, limiteSuperior: 4470.00, subsidio: 6.16 },
        { limiteInferior: 4470.01, limiteSuperior: null, subsidio: 0 },
      ],
    },
    semanal: {
      periodicidad: 'semanal',
      tramos: [
        { limiteInferior: 0.01, limiteSuperior: 2088.91, cuotaFija: 0.00, porcentajeExcedente: 1.92 },
        { limiteInferior: 2088.92, limiteSuperior: 17730.72, cuotaFija: 40.11, porcentajeExcedente: 6.40 },
        { limiteInferior: 17730.73, limiteSuperior: 31158.22, cuotaFija: 1041.19, porcentajeExcedente: 10.88 },
        { limiteInferior: 31158.23, limiteSuperior: 36219.66, cuotaFija: 2502.69, porcentajeExcedente: 16.00 },
        { limiteInferior: 36219.67, limiteSuperior: 43364.94, cuotaFija: 3312.51, porcentajeExcedente: 17.92 },
        { limiteInferior: 43364.95, limiteSuperior: 87461.96, cuotaFija: 4593.31, porcentajeExcedente: 21.36 },
        { limiteInferior: 87461.97, limiteSuperior: 137851.64, cuotaFija: 14011.47, porcentajeExcedente: 23.52 },
        { limiteInferior: 137851.65, limiteSuperior: 263180.25, cuotaFija: 25862.30, porcentajeExcedente: 30.00 },
        { limiteInferior: 263180.26, limiteSuperior: 350909.24, cuotaFija: 63460.99, porcentajeExcedente: 32.00 },
        { limiteInferior: 350909.25, limiteSuperior: 1052727.71, cuotaFija: 91534.24, porcentajeExcedente: 34.00 },
        { limiteInferior: 1052727.72, limiteSuperior: null, cuotaFija: 330152.37, porcentajeExcedente: 35.00 },
      ],
      subsidioTramos: [
        { limiteInferior: 0.01, limiteSuperior: 363.65, subsidio: 109.34 },
        { limiteInferior: 363.66, limiteSuperior: 3084.06, subsidio: 109.27 },
        { limiteInferior: 3084.07, limiteSuperior: 5420.66, subsidio: 105.35 },
        { limiteInferior: 5420.67, limiteSuperior: 6315.05, subsidio: 99.89 },
        { limiteInferior: 6315.06, limiteSuperior: 18573.66, subsidio: 97.16 },
        { limiteInferior: 18573.67, limiteSuperior: 21589.61, subsidio: 83.16 },
        { limiteInferior: 21589.62, limiteSuperior: 26223.05, subsidio: 66.43 },
        { limiteInferior: 26223.06, limiteSuperior: 31290.00, subsidio: 43.12 },
        { limiteInferior: 31290.01, limiteSuperior: null, subsidio: 0 },
      ],
    },
    decenal: {
      periodicidad: 'decenal',
      tramos: [
        { limiteInferior: 0.01, limiteSuperior: 2984.16, cuotaFija: 0.00, porcentajeExcedente: 1.92 },
        { limiteInferior: 2984.17, limiteSuperior: 25329.60, cuotaFija: 57.30, porcentajeExcedente: 6.40 },
        { limiteInferior: 25329.61, limiteSuperior: 44512.02, cuotaFija: 1487.41, porcentajeExcedente: 10.88 },
        { limiteInferior: 44512.03, limiteSuperior: 51742.37, cuotaFija: 3575.27, porcentajeExcedente: 16.00 },
        { limiteInferior: 51742.38, limiteSuperior: 61950.63, cuotaFija: 4732.16, porcentajeExcedente: 17.92 },
        { limiteInferior: 61950.64, limiteSuperior: 124945.96, cuotaFija: 6561.87, porcentajeExcedente: 21.36 },
        { limiteInferior: 124945.97, limiteSuperior: 196931.20, cuotaFija: 20016.39, porcentajeExcedente: 23.52 },
        { limiteInferior: 196931.21, limiteSuperior: 375971.79, cuotaFija: 36946.14, porcentajeExcedente: 30.00 },
        { limiteInferior: 375971.80, limiteSuperior: 501301.20, cuotaFija: 90658.56, porcentajeExcedente: 32.00 },
        { limiteInferior: 501301.21, limiteSuperior: 1503896.73, cuotaFija: 130763.91, porcentajeExcedente: 34.00 },
        { limiteInferior: 1503896.74, limiteSuperior: null, cuotaFija: 471646.25, porcentajeExcedente: 35.00 },
      ],
      subsidioTramos: [
        { limiteInferior: 0.01, limiteSuperior: 519.50, subsidio: 156.20 },
        { limiteInferior: 519.51, limiteSuperior: 4405.80, subsidio: 156.10 },
        { limiteInferior: 4405.81, limiteSuperior: 7743.80, subsidio: 150.50 },
        { limiteInferior: 7743.81, limiteSuperior: 9021.50, subsidio: 142.70 },
        { limiteInferior: 9021.51, limiteSuperior: 26533.80, subsidio: 138.80 },
        { limiteInferior: 26533.81, limiteSuperior: 30842.30, subsidio: 118.80 },
        { limiteInferior: 30842.31, limiteSuperior: 37461.50, subsidio: 94.90 },
        { limiteInferior: 37461.51, limiteSuperior: 44700.00, subsidio: 61.60 },
        { limiteInferior: 44700.01, limiteSuperior: null, subsidio: 0 },
      ],
    },
    quincenal: {
      periodicidad: 'quincenal',
      tramos: [
        { limiteInferior: 0.01, limiteSuperior: 4476.25, cuotaFija: 0.00, porcentajeExcedente: 1.92 },
        { limiteInferior: 4476.26, limiteSuperior: 37992.28, cuotaFija: 85.94, porcentajeExcedente: 6.40 },
        { limiteInferior: 37992.29, limiteSuperior: 66768.04, cuotaFija: 2230.97, porcentajeExcedente: 10.88 },
        { limiteInferior: 66768.05, limiteSuperior: 77614.90, cuotaFija: 5361.78, porcentajeExcedente: 16.00 },
        { limiteInferior: 77614.91, limiteSuperior: 92926.29, cuotaFija: 7097.27, porcentajeExcedente: 17.92 },
        { limiteInferior: 92926.30, limiteSuperior: 187418.94, cuotaFija: 9841.07, porcentajeExcedente: 21.36 },
        { limiteInferior: 187418.95, limiteSuperior: 295398.00, cuotaFija: 30024.70, porcentajeExcedente: 23.52 },
        { limiteInferior: 295398.01, limiteSuperior: 563963.42, cuotaFija: 55421.37, porcentajeExcedente: 30.00 },
        { limiteInferior: 563963.43, limiteSuperior: 751951.23, cuotaFija: 135990.99, porcentajeExcedente: 32.00 },
        { limiteInferior: 751951.24, limiteSuperior: 2255853.69, cuotaFija: 196147.08, porcentajeExcedente: 34.00 },
        { limiteInferior: 2255853.70, limiteSuperior: null, cuotaFija: 707473.92, porcentajeExcedente: 35.00 },
      ],
      subsidioTramos: [
        { limiteInferior: 0.01, limiteSuperior: 779.25, subsidio: 237.50 },
        { limiteInferior: 779.26, limiteSuperior: 6608.70, subsidio: 237.40 },
        { limiteInferior: 6608.71, limiteSuperior: 11615.70, subsidio: 228.95 },
        { limiteInferior: 11615.71, limiteSuperior: 13532.25, subsidio: 217.05 },
        { limiteInferior: 13532.26, limiteSuperior: 39800.70, subsidio: 211.20 },
        { limiteInferior: 39800.71, limiteSuperior: 46263.45, subsidio: 180.90 },
        { limiteInferior: 46263.46, limiteSuperior: 56192.25, subsidio: 144.45 },
        { limiteInferior: 56192.26, limiteSuperior: 67050.00, subsidio: 93.80 },
        { limiteInferior: 67050.01, limiteSuperior: null, subsidio: 0 },
      ],
    },
    mensual: {
      periodicidad: 'mensual',
      tramos: [
        { limiteInferior: 0.01, limiteSuperior: 8952.49, cuotaFija: 0.00, porcentajeExcedente: 1.92 },
        { limiteInferior: 8952.50, limiteSuperior: 75984.55, cuotaFija: 171.88, porcentajeExcedente: 6.40 },
        { limiteInferior: 75984.56, limiteSuperior: 133536.07, cuotaFija: 4461.94, porcentajeExcedente: 10.88 },
        { limiteInferior: 133536.08, limiteSuperior: 155229.80, cuotaFija: 10723.55, porcentajeExcedente: 16.00 },
        { limiteInferior: 155229.81, limiteSuperior: 185852.57, cuotaFija: 14194.54, porcentajeExcedente: 17.92 },
        { limiteInferior: 185852.58, limiteSuperior: 374837.88, cuotaFija: 19682.13, porcentajeExcedente: 21.36 },
        { limiteInferior: 374837.89, limiteSuperior: 590795.99, cuotaFija: 60049.40, porcentajeExcedente: 23.52 },
        { limiteInferior: 590796.00, limiteSuperior: 1127926.84, cuotaFija: 110842.74, porcentajeExcedente: 30.00 },
        { limiteInferior: 1127926.85, limiteSuperior: 1503902.46, cuotaFija: 271981.99, porcentajeExcedente: 32.00 },
        { limiteInferior: 1503902.47, limiteSuperior: 4511707.37, cuotaFija: 392294.17, porcentajeExcedente: 34.00 },
        { limiteInferior: 4511707.38, limiteSuperior: null, cuotaFija: 1414947.85, porcentajeExcedente: 35.00 },
      ],
      subsidioTramos: [
        { limiteInferior: 0.01, limiteSuperior: 1558.50, subsidio: 475.00 },
        { limiteInferior: 1558.51, limiteSuperior: 13217.40, subsidio: 474.80 },
        { limiteInferior: 13217.41, limiteSuperior: 23231.40, subsidio: 457.90 },
        { limiteInferior: 23231.41, limiteSuperior: 27064.50, subsidio: 434.10 },
        { limiteInferior: 27064.51, limiteSuperior: 79601.40, subsidio: 422.40 },
        { limiteInferior: 79601.41, limiteSuperior: 92526.90, subsidio: 361.80 },
        { limiteInferior: 92526.91, limiteSuperior: 112384.50, subsidio: 288.90 },
        { limiteInferior: 112384.51, limiteSuperior: 134100.00, subsidio: 187.60 },
        { limiteInferior: 134100.01, limiteSuperior: null, subsidio: 0 },
      ],
    },
  },
  imssCuotas: [
    { concepto: 'Enfermedades y Maternidad (Cuota Fija)', porcentajeObrero: 0.0, porcentajePatronal: 20.40 },
    { concepto: 'Enfermedades y Maternidad (Excedente 3 UMAs)', porcentajeObrero: 0.40, porcentajePatronal: 1.10 },
    { concepto: 'Invalidez y Vida', porcentajeObrero: 0.625, porcentajePatronal: 1.75 },
    { concepto: 'Retiro', porcentajeObrero: 0.0, porcentajePatronal: 2.0 },
    { concepto: 'Cesantía y Vejez', porcentajeObrero: 1.125, porcentajePatronal: 3.15 },
    { concepto: 'Guarderías y Prestaciones Sociales', porcentajeObrero: 0.0, porcentajePatronal: 1.0 },
  ],
  infonavitTasa: 5.0,
};

/**
 * Calcula el ISR según la tabla correspondiente a la periodicidad
 */
export function calcularISR(
  baseGravable: number,
  periodicidad: Periodicidad,
  config: ConfiguracionNomina = configuracionDefault
): { isr: number; subsidioEmpleo: number; isrRetenido: number } {
  const tabla = config.isrTablas[periodicidad];
  
  // Buscar el tramo ISR correspondiente
  const tramo = tabla.tramos.find(
    (t) =>
      baseGravable >= t.limiteInferior &&
      (t.limiteSuperior === null || baseGravable <= t.limiteSuperior)
  );

  if (!tramo) {
    return { isr: 0, subsidioEmpleo: 0, isrRetenido: 0 };
  }

  // Cálculo ISR: (Base Gravable - Límite Inferior) × % Excedente + Cuota Fija
  const excedente = baseGravable - tramo.limiteInferior;
  const isr = excedente * (tramo.porcentajeExcedente / 100) + tramo.cuotaFija;

  // Buscar el tramo de subsidio al empleo correspondiente
  const tramoSubsidio = tabla.subsidioTramos.find(
    (t) =>
      baseGravable >= t.limiteInferior &&
      (t.limiteSuperior === null || baseGravable <= t.limiteSuperior)
  );

  const subsidioEmpleo = tramoSubsidio ? tramoSubsidio.subsidio : 0;

  // ISR Retenido = ISR - Subsidio al Empleo
  const isrRetenido = Math.max(0, isr - subsidioEmpleo);

  return {
    isr: Math.round(isr * 100) / 100,
    subsidioEmpleo: Math.round(subsidioEmpleo * 100) / 100,
    isrRetenido: Math.round(isrRetenido * 100) / 100,
  };
}

/**
 * Calcula el IMSS del trabajador basado en el SBC
 */
export function calcularIMSSTrabajador(
  sbc: number,
  config: ConfiguracionNomina = configuracionDefault
): number {
  const umaDiaria = config.uma.diaria;
  const limiteExcedente = 3 * umaDiaria; // 3 UMAs
  
  let totalIMSS = 0;

  config.imssCuotas.forEach((cuota) => {
    if (cuota.concepto.includes('Excedente 3 UMAs') && sbc > limiteExcedente) {
      // Solo se aplica al excedente de 3 UMAs
      const excedente = sbc - limiteExcedente;
      totalIMSS += excedente * (cuota.porcentajeObrero / 100);
    } else if (!cuota.concepto.includes('Excedente')) {
      // Cuotas fijas se aplican sobre el SBC completo o sobre 3 UMAs
      const base = cuota.concepto.includes('Cuota Fija') ? Math.min(sbc, limiteExcedente) : sbc;
      totalIMSS += base * (cuota.porcentajeObrero / 100);
    }
  });

  return Math.round(totalIMSS * 100) / 100;
}

/**
 * Lista de variables permitidas en las fórmulas de nómina
 * Cualquier variable no listada aquí será rechazada
 */
const ALLOWED_FORMULA_VARIABLES = new Set([
  'SALARIO_BASE', 'SALARIO_DIARIO', 'SALARIO_PERIODO', 'SALARIO_HORA',
  'SBC', 'SDI', 'DIAS_TRABAJADOS', 'DIAS_PERIODO', 'DIAS_AGUINALDO',
  'UMA_DIARIA', 'UMA_MENSUAL', 'UMA_ANUAL',
  'SALARIO_MINIMO', 'SMG_DIARIO', 'SMG_MENSUAL',
  'HORAS_EXTRA_DOBLES', 'HORAS_EXTRA_TRIPLES',
  'DIAS_VACACIONES', 'ANTIGUEDAD_ANOS', 'DIAS_FESTIVOS_TRABAJADOS',
  'MONTO_VALES', 'MONTO_FONDO_AHORRO', 'PORCENTAJE_PTU',
  'CUOTA_IMSS', 'ISR_RETENIDO', 'SUBSIDIO_EMPLEO',
  'DESCUENTO_INFONAVIT', 'DESCUENTO_FONACOT',
  'salario_base', 'salario_diario', 'sbc', 'dias_trabajados',
  'uma_diaria', 'uma_mensual', 'uma_anual', 'salario_minimo'
]);

/**
 * Funciones matemáticas permitidas en fórmulas
 */
const ALLOWED_FUNCTIONS = ['min', 'max', 'abs', 'round', 'ceil', 'floor'];

/**
 * Valida que una fórmula solo contenga caracteres, funciones y variables permitidos
 * @returns true si la fórmula es segura, false si contiene elementos no permitidos
 */
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

/**
 * Evalúa una fórmula dinámica para un concepto usando parser seguro
 * Usa expr-eval para evitar vulnerabilidades de ejecución de código arbitrario
 * Solo permite operaciones matemáticas básicas y variables de nómina definidas
 */
export function evaluarFormula(
  formula: string,
  empleado: EmpleadoNomina,
  config: ConfiguracionNomina = configuracionDefault
): number {
  const variables: Record<string, number> = {
    SALARIO_BASE: empleado.salarioBase,
    SALARIO_DIARIO: empleado.salarioDiario,
    SBC: empleado.sbc,
    DIAS_TRABAJADOS: empleado.diasTrabajados,
    UMA_DIARIA: config.uma.diaria,
    UMA_MENSUAL: config.uma.mensual,
    UMA_ANUAL: config.uma.anual,
    SALARIO_MINIMO: empleado.zona === 'frontera' 
      ? config.salarioMinimo.zonaFrontera 
      : config.salarioMinimo.zonaGeneral,
    salario_base: empleado.salarioBase,
    salario_diario: empleado.salarioDiario,
    sbc: empleado.sbc,
    dias_trabajados: empleado.diasTrabajados,
    uma_diaria: config.uma.diaria,
    uma_mensual: config.uma.mensual,
    uma_anual: config.uma.anual,
    salario_minimo: empleado.zona === 'frontera' 
      ? config.salarioMinimo.zonaFrontera 
      : config.salarioMinimo.zonaGeneral,
  };

  const validacion = validarFormula(formula, variables);
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
    const resultado = expr.evaluate(variables);
    
    if (typeof resultado !== 'number' || isNaN(resultado) || !isFinite(resultado)) {
      console.error('Resultado de fórmula inválido:', formula, resultado);
      return 0;
    }
    
    return Math.round(resultado * 100) / 100;
  } catch (error) {
    console.error('Error evaluando fórmula:', formula, error);
    return 0;
  }
}

/**
 * Calcula una nómina completa
 */
export function calcularNomina(
  empleado: EmpleadoNomina,
  conceptos: ConceptoFormula[],
  periodicidad: Periodicidad,
  config: ConfiguracionNomina = configuracionDefault
): ResultadoNomina {
  const percepciones: ResultadoCalculoConcepto[] = [];
  const deducciones: ResultadoCalculoConcepto[] = [];
  let baseGravableISR = 0;

  // Calcular percepciones
  conceptos
    .filter((c) => c.tipo === 'percepcion')
    .forEach((concepto) => {
      const monto = evaluarFormula(concepto.formula, empleado, config);
      const gravado = concepto.gravableISR ? monto : 0;
      const exento = monto - gravado;

      percepciones.push({
        concepto: concepto.nombre,
        monto,
        gravado,
        exento,
      });

      baseGravableISR += gravado;
    });

  // Calcular IMSS del trabajador
  const imss = calcularIMSSTrabajador(empleado.sbc, config);
  deducciones.push({
    concepto: 'IMSS',
    monto: imss,
    gravado: 0,
    exento: imss,
  });

  // Calcular ISR
  const { isr, subsidioEmpleo, isrRetenido } = calcularISR(baseGravableISR, periodicidad, config);
  if (isrRetenido > 0) {
    deducciones.push({
      concepto: 'ISR',
      monto: isrRetenido,
      gravado: 0,
      exento: isrRetenido,
    });
  }

  // Calcular otras deducciones
  conceptos
    .filter((c) => c.tipo === 'deduccion' && c.nombre !== 'IMSS' && c.nombre !== 'ISR')
    .forEach((concepto) => {
      const monto = evaluarFormula(concepto.formula, empleado, config);
      deducciones.push({
        concepto: concepto.nombre,
        monto,
        gravado: 0,
        exento: monto,
      });
    });

  const totalPercepciones = percepciones.reduce((sum, p) => sum + p.monto, 0);
  const totalDeducciones = deducciones.reduce((sum, d) => sum + d.monto, 0);
  const netoAPagar = totalPercepciones - totalDeducciones;

  return {
    percepciones,
    deducciones,
    totalPercepciones: Math.round(totalPercepciones * 100) / 100,
    totalDeducciones: Math.round(totalDeducciones * 100) / 100,
    netoAPagar: Math.round(netoAPagar * 100) / 100,
    baseGravableISR: Math.round(baseGravableISR * 100) / 100,
    isr: Math.round(isr * 100) / 100,
    subsidioEmpleo,
    isrRetenido: Math.round(isrRetenido * 100) / 100,
  };
}
