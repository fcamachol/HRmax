/**
 * MOTOR DE NÓMINA NOMINAHUB - CLASE MUNDIAL
 * Superior a NOI con cumplimiento completo SAT/IMSS 2025
 * 
 * Características:
 * - Cálculos con precisión de 4 decimales usando basis points
 * - Tablas fiscales 2025 completas (ISR, Subsidio, IMSS)
 * - Soporte para todas las periodicidades (diario, semanal, catorcenal, quincenal, mensual)
 * - Cumplimiento CFDI 4.0 con claves SAT
 * - Cálculos de SBC/SDI automáticos
 * - Horas extra con límites exentos y gravables
 * - Aguinaldo, vacaciones, prima vacacional
 * - PTU con límites de exención
 * - Finiquito y liquidación completos
 * - Auditoría con desglose de fórmulas
 */

import {
  pesosToBp,
  bpToPesos,
  porcentajeToBp,
  bpToPorcentaje,
  multiplicarBpPorTasa,
  dividirBp,
  sumarBp,
  restarBp,
  compararBp,
  minBp,
  maxBp,
} from './basisPoints';

// ===================== TIPOS Y ENUMS =====================

export type TipoPeriodo = 'diario' | 'semanal' | 'catorcenal' | 'quincenal' | 'mensual';
export type TipoContrato = 'indeterminado' | 'determinado' | 'temporal' | 'estacional' | 'prueba' | 'capacitacion';
export type TipoRegimen = 'asalariado' | 'asimilado' | 'mixto';
export type TipoJornada = 'diurna' | 'nocturna' | 'mixta' | 'reducida';
export type ZonaSalario = 'general' | 'frontera';
export type TipoSeparacion = 'renuncia' | 'despido_justificado' | 'despido_injustificado' | 'muerte' | 'incapacidad_permanente';

export interface ConfiguracionFiscal {
  uma: {
    diaria: number;
    mensual: number;
    anual: number;
  };
  salarioMinimo: {
    general: number;
    frontera: number;
  };
  diasAnio: number;
  aguinaldoMinimo: number;
  primaVacacionalMinimo: number;
  limiteSuperiorCotizacionUMAs: number;
  factorintegracionMinimo: number;
}

export const CONFIG_FISCAL_2025: ConfiguracionFiscal = {
  uma: {
    diaria: 113.14,
    mensual: 3439.46,
    anual: 41273.52,
  },
  salarioMinimo: {
    general: 278.80,
    frontera: 419.88,
  },
  diasAnio: 365,
  aguinaldoMinimo: 15,
  primaVacacionalMinimo: 25,
  limiteSuperiorCotizacionUMAs: 25,
  factorintegracionMinimo: 1.0452,
};

// CONFIG FISCAL 2026 - Vigente a partir del 1 de enero de 2026
// Fuente: CONASAMI - DOF 03/12/2025
// Nota: UMA 2026 se publicará por INEGI en enero 2026 (vigencia desde 01/02/2026)
//       Por ahora se mantiene UMA 2025 hasta su actualización oficial
export const CONFIG_FISCAL_2026: ConfiguracionFiscal = {
  uma: {
    diaria: 113.14,      // PENDIENTE: Se actualizará en enero 2026 por INEGI
    mensual: 3439.46,    // PENDIENTE: Se actualizará en enero 2026 por INEGI
    anual: 41273.52,     // PENDIENTE: Se actualizará en enero 2026 por INEGI
  },
  salarioMinimo: {
    general: 315.04,     // Incremento 13% (278.80 → 315.04) - Vigente 01/01/2026
    frontera: 440.87,    // Incremento 5% (419.88 → 440.87) - Vigente 01/01/2026
  },
  diasAnio: 365,
  aguinaldoMinimo: 15,
  primaVacacionalMinimo: 25,
  limiteSuperiorCotizacionUMAs: 25,
  factorintegracionMinimo: 1.0452,
};

// ===================== TIPOS DE HORAS EXTRA LFT =====================

export interface TipoHoraExtra {
  clave: 'dobles' | 'triples';
  nombre: string;
  descripcion: string;
  tasaPorcentaje: number;
  tasaFactor: number;
  limiteHorasSemanal: number | null;
  articuloLft: string;
  fundamentoLegal: string;
  satClave: string;
  exentoIsr: boolean;
  observaciones: string;
}

export const TIPOS_HORAS_EXTRA: Record<string, TipoHoraExtra> = {
  dobles: {
    clave: 'dobles',
    nombre: 'Horas Extra Dobles',
    descripcion: 'Primeras 9 horas semanales de tiempo extra',
    tasaPorcentaje: 200,
    tasaFactor: 2.0,
    limiteHorasSemanal: 9,
    articuloLft: 'Art. 67 LFT',
    fundamentoLegal: 'Las horas de trabajo extraordinario se pagarán con un ciento por ciento más del salario que corresponda a las horas de la jornada.',
    satClave: '019',
    exentoIsr: true,
    observaciones: 'Exentas de ISR si no exceden el 50% del salario mensual (LISR Art. 93 fracc. I)',
  },
  triples: {
    clave: 'triples',
    nombre: 'Horas Extra Triples',
    descripcion: 'Horas que exceden las primeras 9 horas semanales',
    tasaPorcentaje: 300,
    tasaFactor: 3.0,
    limiteHorasSemanal: null,
    articuloLft: 'Art. 68 LFT',
    fundamentoLegal: 'La prolongación del tiempo extraordinario que exceda de nueve horas a la semana, obliga al patrón a pagar al trabajador el tiempo excedente con un doscientos por ciento más del salario que corresponda a las horas de la jornada.',
    satClave: '019',
    exentoIsr: false,
    observaciones: 'Siempre gravadas para ISR. El patrón debe evitar que el tiempo extra exceda las 9 horas semanales.',
  },
};

// ===================== TABLAS ISR 2025 =====================

export interface TramoISR {
  limiteInferiorBp: bigint;
  limiteSuperiorBp: bigint | null;
  cuotaFijaBp: bigint;
  tasaExcedenteBp: number;
}

export interface TablaISR {
  periodo: TipoPeriodo;
  anio: number;
  tramos: TramoISR[];
}

// TABLA ISR 2025 OFICIAL - Anexo 8 RMF 2025 DOF 30/12/2024
// Nota: Las tablas 2025 NO cambiaron respecto a 2024 (inflación < 10% Art. 152 LISR)
export const TABLAS_ISR_2025: Record<TipoPeriodo, TablaISR> = {
  mensual: {
    periodo: 'mensual',
    anio: 2025,
    tramos: [
      { limiteInferiorBp: pesosToBp(0.01), limiteSuperiorBp: pesosToBp(746.04), cuotaFijaBp: pesosToBp(0), tasaExcedenteBp: porcentajeToBp(1.92) },
      { limiteInferiorBp: pesosToBp(746.05), limiteSuperiorBp: pesosToBp(6332.05), cuotaFijaBp: pesosToBp(14.32), tasaExcedenteBp: porcentajeToBp(6.40) },
      { limiteInferiorBp: pesosToBp(6332.06), limiteSuperiorBp: pesosToBp(11128.01), cuotaFijaBp: pesosToBp(371.83), tasaExcedenteBp: porcentajeToBp(10.88) },
      { limiteInferiorBp: pesosToBp(11128.02), limiteSuperiorBp: pesosToBp(12935.82), cuotaFijaBp: pesosToBp(893.63), tasaExcedenteBp: porcentajeToBp(16.00) },
      { limiteInferiorBp: pesosToBp(12935.83), limiteSuperiorBp: pesosToBp(15487.71), cuotaFijaBp: pesosToBp(1182.88), tasaExcedenteBp: porcentajeToBp(17.92) },
      { limiteInferiorBp: pesosToBp(15487.72), limiteSuperiorBp: pesosToBp(31236.49), cuotaFijaBp: pesosToBp(1640.18), tasaExcedenteBp: porcentajeToBp(21.36) },
      { limiteInferiorBp: pesosToBp(31236.50), limiteSuperiorBp: pesosToBp(49233.00), cuotaFijaBp: pesosToBp(5004.12), tasaExcedenteBp: porcentajeToBp(23.52) },
      { limiteInferiorBp: pesosToBp(49233.01), limiteSuperiorBp: pesosToBp(93993.90), cuotaFijaBp: pesosToBp(9236.89), tasaExcedenteBp: porcentajeToBp(30.00) },
      { limiteInferiorBp: pesosToBp(93993.91), limiteSuperiorBp: pesosToBp(125325.20), cuotaFijaBp: pesosToBp(22665.17), tasaExcedenteBp: porcentajeToBp(32.00) },
      { limiteInferiorBp: pesosToBp(125325.21), limiteSuperiorBp: pesosToBp(375975.61), cuotaFijaBp: pesosToBp(32691.18), tasaExcedenteBp: porcentajeToBp(34.00) },
      { limiteInferiorBp: pesosToBp(375975.62), limiteSuperiorBp: null, cuotaFijaBp: pesosToBp(117912.32), tasaExcedenteBp: porcentajeToBp(35.00) },
    ],
  },
  // Quincenal = Mensual / 2 (DOF Anexo 8 RMF 2025)
  quincenal: {
    periodo: 'quincenal',
    anio: 2025,
    tramos: [
      { limiteInferiorBp: pesosToBp(0.01), limiteSuperiorBp: pesosToBp(373.02), cuotaFijaBp: pesosToBp(0), tasaExcedenteBp: porcentajeToBp(1.92) },
      { limiteInferiorBp: pesosToBp(373.03), limiteSuperiorBp: pesosToBp(3166.03), cuotaFijaBp: pesosToBp(7.16), tasaExcedenteBp: porcentajeToBp(6.40) },
      { limiteInferiorBp: pesosToBp(3166.04), limiteSuperiorBp: pesosToBp(5564.01), cuotaFijaBp: pesosToBp(185.92), tasaExcedenteBp: porcentajeToBp(10.88) },
      { limiteInferiorBp: pesosToBp(5564.02), limiteSuperiorBp: pesosToBp(6467.91), cuotaFijaBp: pesosToBp(446.82), tasaExcedenteBp: porcentajeToBp(16.00) },
      { limiteInferiorBp: pesosToBp(6467.92), limiteSuperiorBp: pesosToBp(7743.86), cuotaFijaBp: pesosToBp(591.44), tasaExcedenteBp: porcentajeToBp(17.92) },
      { limiteInferiorBp: pesosToBp(7743.87), limiteSuperiorBp: pesosToBp(15618.25), cuotaFijaBp: pesosToBp(820.09), tasaExcedenteBp: porcentajeToBp(21.36) },
      { limiteInferiorBp: pesosToBp(15618.26), limiteSuperiorBp: pesosToBp(24616.50), cuotaFijaBp: pesosToBp(2502.06), tasaExcedenteBp: porcentajeToBp(23.52) },
      { limiteInferiorBp: pesosToBp(24616.51), limiteSuperiorBp: pesosToBp(46996.95), cuotaFijaBp: pesosToBp(4618.45), tasaExcedenteBp: porcentajeToBp(30.00) },
      { limiteInferiorBp: pesosToBp(46996.96), limiteSuperiorBp: pesosToBp(62662.60), cuotaFijaBp: pesosToBp(11332.59), tasaExcedenteBp: porcentajeToBp(32.00) },
      { limiteInferiorBp: pesosToBp(62662.61), limiteSuperiorBp: pesosToBp(187987.81), cuotaFijaBp: pesosToBp(16345.59), tasaExcedenteBp: porcentajeToBp(34.00) },
      { limiteInferiorBp: pesosToBp(187987.82), limiteSuperiorBp: null, cuotaFijaBp: pesosToBp(58956.16), tasaExcedenteBp: porcentajeToBp(35.00) },
    ],
  },
  // Catorcenal = Mensual * 14/30 (DOF Anexo 8 RMF 2025)
  catorcenal: {
    periodo: 'catorcenal',
    anio: 2025,
    tramos: [
      { limiteInferiorBp: pesosToBp(0.01), limiteSuperiorBp: pesosToBp(348.15), cuotaFijaBp: pesosToBp(0), tasaExcedenteBp: porcentajeToBp(1.92) },
      { limiteInferiorBp: pesosToBp(348.16), limiteSuperiorBp: pesosToBp(2954.96), cuotaFijaBp: pesosToBp(6.68), tasaExcedenteBp: porcentajeToBp(6.40) },
      { limiteInferiorBp: pesosToBp(2954.97), limiteSuperiorBp: pesosToBp(5193.07), cuotaFijaBp: pesosToBp(173.52), tasaExcedenteBp: porcentajeToBp(10.88) },
      { limiteInferiorBp: pesosToBp(5193.08), limiteSuperiorBp: pesosToBp(6036.72), cuotaFijaBp: pesosToBp(417.03), tasaExcedenteBp: porcentajeToBp(16.00) },
      { limiteInferiorBp: pesosToBp(6036.73), limiteSuperiorBp: pesosToBp(7227.60), cuotaFijaBp: pesosToBp(552.01), tasaExcedenteBp: porcentajeToBp(17.92) },
      { limiteInferiorBp: pesosToBp(7227.61), limiteSuperiorBp: pesosToBp(14577.03), cuotaFijaBp: pesosToBp(765.42), tasaExcedenteBp: porcentajeToBp(21.36) },
      { limiteInferiorBp: pesosToBp(14577.04), limiteSuperiorBp: pesosToBp(22975.40), cuotaFijaBp: pesosToBp(2335.26), tasaExcedenteBp: porcentajeToBp(23.52) },
      { limiteInferiorBp: pesosToBp(22975.41), limiteSuperiorBp: pesosToBp(43863.82), cuotaFijaBp: pesosToBp(4310.55), tasaExcedenteBp: porcentajeToBp(30.00) },
      { limiteInferiorBp: pesosToBp(43863.83), limiteSuperiorBp: pesosToBp(58485.10), cuotaFijaBp: pesosToBp(10577.08), tasaExcedenteBp: porcentajeToBp(32.00) },
      { limiteInferiorBp: pesosToBp(58485.11), limiteSuperiorBp: pesosToBp(175455.29), cuotaFijaBp: pesosToBp(15255.88), tasaExcedenteBp: porcentajeToBp(34.00) },
      { limiteInferiorBp: pesosToBp(175455.30), limiteSuperiorBp: null, cuotaFijaBp: pesosToBp(55025.75), tasaExcedenteBp: porcentajeToBp(35.00) },
    ],
  },
  // Semanal = Mensual * 7/30 (DOF Anexo 8 RMF 2025)
  semanal: {
    periodo: 'semanal',
    anio: 2025,
    tramos: [
      { limiteInferiorBp: pesosToBp(0.01), limiteSuperiorBp: pesosToBp(174.08), cuotaFijaBp: pesosToBp(0), tasaExcedenteBp: porcentajeToBp(1.92) },
      { limiteInferiorBp: pesosToBp(174.09), limiteSuperiorBp: pesosToBp(1477.48), cuotaFijaBp: pesosToBp(3.34), tasaExcedenteBp: porcentajeToBp(6.40) },
      { limiteInferiorBp: pesosToBp(1477.49), limiteSuperiorBp: pesosToBp(2596.54), cuotaFijaBp: pesosToBp(86.76), tasaExcedenteBp: porcentajeToBp(10.88) },
      { limiteInferiorBp: pesosToBp(2596.55), limiteSuperiorBp: pesosToBp(3018.36), cuotaFijaBp: pesosToBp(208.52), tasaExcedenteBp: porcentajeToBp(16.00) },
      { limiteInferiorBp: pesosToBp(3018.37), limiteSuperiorBp: pesosToBp(3613.80), cuotaFijaBp: pesosToBp(276.01), tasaExcedenteBp: porcentajeToBp(17.92) },
      { limiteInferiorBp: pesosToBp(3613.81), limiteSuperiorBp: pesosToBp(7288.52), cuotaFijaBp: pesosToBp(382.71), tasaExcedenteBp: porcentajeToBp(21.36) },
      { limiteInferiorBp: pesosToBp(7288.53), limiteSuperiorBp: pesosToBp(11487.70), cuotaFijaBp: pesosToBp(1167.63), tasaExcedenteBp: porcentajeToBp(23.52) },
      { limiteInferiorBp: pesosToBp(11487.71), limiteSuperiorBp: pesosToBp(21931.91), cuotaFijaBp: pesosToBp(2155.27), tasaExcedenteBp: porcentajeToBp(30.00) },
      { limiteInferiorBp: pesosToBp(21931.92), limiteSuperiorBp: pesosToBp(29242.55), cuotaFijaBp: pesosToBp(5288.54), tasaExcedenteBp: porcentajeToBp(32.00) },
      { limiteInferiorBp: pesosToBp(29242.56), limiteSuperiorBp: pesosToBp(87727.64), cuotaFijaBp: pesosToBp(7627.94), tasaExcedenteBp: porcentajeToBp(34.00) },
      { limiteInferiorBp: pesosToBp(87727.65), limiteSuperiorBp: null, cuotaFijaBp: pesosToBp(27512.88), tasaExcedenteBp: porcentajeToBp(35.00) },
    ],
  },
  // Diario = Mensual / 30 (DOF Anexo 8 RMF 2025)
  diario: {
    periodo: 'diario',
    anio: 2025,
    tramos: [
      { limiteInferiorBp: pesosToBp(0.01), limiteSuperiorBp: pesosToBp(24.87), cuotaFijaBp: pesosToBp(0), tasaExcedenteBp: porcentajeToBp(1.92) },
      { limiteInferiorBp: pesosToBp(24.88), limiteSuperiorBp: pesosToBp(211.07), cuotaFijaBp: pesosToBp(0.48), tasaExcedenteBp: porcentajeToBp(6.40) },
      { limiteInferiorBp: pesosToBp(211.08), limiteSuperiorBp: pesosToBp(370.93), cuotaFijaBp: pesosToBp(12.39), tasaExcedenteBp: porcentajeToBp(10.88) },
      { limiteInferiorBp: pesosToBp(370.94), limiteSuperiorBp: pesosToBp(431.19), cuotaFijaBp: pesosToBp(29.79), tasaExcedenteBp: porcentajeToBp(16.00) },
      { limiteInferiorBp: pesosToBp(431.20), limiteSuperiorBp: pesosToBp(516.26), cuotaFijaBp: pesosToBp(39.43), tasaExcedenteBp: porcentajeToBp(17.92) },
      { limiteInferiorBp: pesosToBp(516.27), limiteSuperiorBp: pesosToBp(1041.22), cuotaFijaBp: pesosToBp(54.67), tasaExcedenteBp: porcentajeToBp(21.36) },
      { limiteInferiorBp: pesosToBp(1041.23), limiteSuperiorBp: pesosToBp(1641.10), cuotaFijaBp: pesosToBp(166.80), tasaExcedenteBp: porcentajeToBp(23.52) },
      { limiteInferiorBp: pesosToBp(1641.11), limiteSuperiorBp: pesosToBp(3133.13), cuotaFijaBp: pesosToBp(307.90), tasaExcedenteBp: porcentajeToBp(30.00) },
      { limiteInferiorBp: pesosToBp(3133.14), limiteSuperiorBp: pesosToBp(4177.51), cuotaFijaBp: pesosToBp(755.51), tasaExcedenteBp: porcentajeToBp(32.00) },
      { limiteInferiorBp: pesosToBp(4177.52), limiteSuperiorBp: pesosToBp(12532.52), cuotaFijaBp: pesosToBp(1089.71), tasaExcedenteBp: porcentajeToBp(34.00) },
      { limiteInferiorBp: pesosToBp(12532.53), limiteSuperiorBp: null, cuotaFijaBp: pesosToBp(3930.41), tasaExcedenteBp: porcentajeToBp(35.00) },
    ],
  },
};

// ===================== TABLAS ISR 2026 =====================
// TABLA ISR 2026 OFICIAL - Anexo 8 RMF 2026 DOF 28/12/2025
// Factor de actualización: 1.1321 (inflación acumulada 13.21% Art. 152 LISR)
// Se actualizan límites y cuotas fijas, las tasas porcentuales se mantienen
export const TABLAS_ISR_2026: Record<TipoPeriodo, TablaISR> = {
  mensual: {
    periodo: 'mensual',
    anio: 2026,
    tramos: [
      { limiteInferiorBp: pesosToBp(0.01), limiteSuperiorBp: pesosToBp(844.59), cuotaFijaBp: pesosToBp(0), tasaExcedenteBp: porcentajeToBp(1.92) },
      { limiteInferiorBp: pesosToBp(844.60), limiteSuperiorBp: pesosToBp(7168.45), cuotaFijaBp: pesosToBp(16.22), tasaExcedenteBp: porcentajeToBp(6.40) },
      { limiteInferiorBp: pesosToBp(7168.46), limiteSuperiorBp: pesosToBp(12599.66), cuotaFijaBp: pesosToBp(420.94), tasaExcedenteBp: porcentajeToBp(10.88) },
      { limiteInferiorBp: pesosToBp(12599.67), limiteSuperiorBp: pesosToBp(14643.97), cuotaFijaBp: pesosToBp(1011.68), tasaExcedenteBp: porcentajeToBp(16.00) },
      { limiteInferiorBp: pesosToBp(14643.98), limiteSuperiorBp: pesosToBp(17529.77), cuotaFijaBp: pesosToBp(1338.77), tasaExcedenteBp: porcentajeToBp(17.92) },
      { limiteInferiorBp: pesosToBp(17529.78), limiteSuperiorBp: pesosToBp(35360.60), cuotaFijaBp: pesosToBp(1856.47), tasaExcedenteBp: porcentajeToBp(21.36) },
      { limiteInferiorBp: pesosToBp(35360.61), limiteSuperiorBp: pesosToBp(55741.63), cuotaFijaBp: pesosToBp(5665.17), tasaExcedenteBp: porcentajeToBp(23.52) },
      { limiteInferiorBp: pesosToBp(55741.64), limiteSuperiorBp: pesosToBp(106431.92), cuotaFijaBp: pesosToBp(10459.38), tasaExcedenteBp: porcentajeToBp(30.00) },
      { limiteInferiorBp: pesosToBp(106431.93), limiteSuperiorBp: pesosToBp(141909.23), cuotaFijaBp: pesosToBp(25666.46), tasaExcedenteBp: porcentajeToBp(32.00) },
      { limiteInferiorBp: pesosToBp(141909.24), limiteSuperiorBp: pesosToBp(425727.71), cuotaFijaBp: pesosToBp(37019.30), tasaExcedenteBp: porcentajeToBp(34.00) },
      { limiteInferiorBp: pesosToBp(425727.72), limiteSuperiorBp: null, cuotaFijaBp: pesosToBp(133517.58), tasaExcedenteBp: porcentajeToBp(35.00) },
    ],
  },
  quincenal: {
    periodo: 'quincenal',
    anio: 2026,
    tramos: [
      { limiteInferiorBp: pesosToBp(0.01), limiteSuperiorBp: pesosToBp(422.30), cuotaFijaBp: pesosToBp(0), tasaExcedenteBp: porcentajeToBp(1.92) },
      { limiteInferiorBp: pesosToBp(422.31), limiteSuperiorBp: pesosToBp(3584.23), cuotaFijaBp: pesosToBp(8.11), tasaExcedenteBp: porcentajeToBp(6.40) },
      { limiteInferiorBp: pesosToBp(3584.24), limiteSuperiorBp: pesosToBp(6299.83), cuotaFijaBp: pesosToBp(210.47), tasaExcedenteBp: porcentajeToBp(10.88) },
      { limiteInferiorBp: pesosToBp(6299.84), limiteSuperiorBp: pesosToBp(7321.99), cuotaFijaBp: pesosToBp(505.84), tasaExcedenteBp: porcentajeToBp(16.00) },
      { limiteInferiorBp: pesosToBp(7322.00), limiteSuperiorBp: pesosToBp(8764.89), cuotaFijaBp: pesosToBp(669.39), tasaExcedenteBp: porcentajeToBp(17.92) },
      { limiteInferiorBp: pesosToBp(8764.90), limiteSuperiorBp: pesosToBp(17680.30), cuotaFijaBp: pesosToBp(928.24), tasaExcedenteBp: porcentajeToBp(21.36) },
      { limiteInferiorBp: pesosToBp(17680.31), limiteSuperiorBp: pesosToBp(27870.82), cuotaFijaBp: pesosToBp(2832.59), tasaExcedenteBp: porcentajeToBp(23.52) },
      { limiteInferiorBp: pesosToBp(27870.83), limiteSuperiorBp: pesosToBp(53215.96), cuotaFijaBp: pesosToBp(5229.69), tasaExcedenteBp: porcentajeToBp(30.00) },
      { limiteInferiorBp: pesosToBp(53215.97), limiteSuperiorBp: pesosToBp(70954.62), cuotaFijaBp: pesosToBp(12833.23), tasaExcedenteBp: porcentajeToBp(32.00) },
      { limiteInferiorBp: pesosToBp(70954.63), limiteSuperiorBp: pesosToBp(212863.86), cuotaFijaBp: pesosToBp(18509.65), tasaExcedenteBp: porcentajeToBp(34.00) },
      { limiteInferiorBp: pesosToBp(212863.87), limiteSuperiorBp: null, cuotaFijaBp: pesosToBp(66758.79), tasaExcedenteBp: porcentajeToBp(35.00) },
    ],
  },
  catorcenal: {
    periodo: 'catorcenal',
    anio: 2026,
    tramos: [
      { limiteInferiorBp: pesosToBp(0.01), limiteSuperiorBp: pesosToBp(394.14), cuotaFijaBp: pesosToBp(0), tasaExcedenteBp: porcentajeToBp(1.92) },
      { limiteInferiorBp: pesosToBp(394.15), limiteSuperiorBp: pesosToBp(3345.31), cuotaFijaBp: pesosToBp(7.56), tasaExcedenteBp: porcentajeToBp(6.40) },
      { limiteInferiorBp: pesosToBp(3345.32), limiteSuperiorBp: pesosToBp(5879.85), cuotaFijaBp: pesosToBp(196.44), tasaExcedenteBp: porcentajeToBp(10.88) },
      { limiteInferiorBp: pesosToBp(5879.86), limiteSuperiorBp: pesosToBp(6833.38), cuotaFijaBp: pesosToBp(472.11), tasaExcedenteBp: porcentajeToBp(16.00) },
      { limiteInferiorBp: pesosToBp(6833.39), limiteSuperiorBp: pesosToBp(8183.38), cuotaFijaBp: pesosToBp(624.64), tasaExcedenteBp: porcentajeToBp(17.92) },
      { limiteInferiorBp: pesosToBp(8183.39), limiteSuperiorBp: pesosToBp(16502.28), cuotaFijaBp: pesosToBp(866.56), tasaExcedenteBp: porcentajeToBp(21.36) },
      { limiteInferiorBp: pesosToBp(16502.29), limiteSuperiorBp: pesosToBp(26012.09), cuotaFijaBp: pesosToBp(2643.75), tasaExcedenteBp: porcentajeToBp(23.52) },
      { limiteInferiorBp: pesosToBp(26012.10), limiteSuperiorBp: pesosToBp(49667.56), cuotaFijaBp: pesosToBp(4880.90), tasaExcedenteBp: porcentajeToBp(30.00) },
      { limiteInferiorBp: pesosToBp(49667.57), limiteSuperiorBp: pesosToBp(66217.30), cuotaFijaBp: pesosToBp(11977.54), tasaExcedenteBp: porcentajeToBp(32.00) },
      { limiteInferiorBp: pesosToBp(66217.31), limiteSuperiorBp: pesosToBp(198651.89), cuotaFijaBp: pesosToBp(17273.46), tasaExcedenteBp: porcentajeToBp(34.00) },
      { limiteInferiorBp: pesosToBp(198651.90), limiteSuperiorBp: null, cuotaFijaBp: pesosToBp(62281.02), tasaExcedenteBp: porcentajeToBp(35.00) },
    ],
  },
  semanal: {
    periodo: 'semanal',
    anio: 2026,
    tramos: [
      { limiteInferiorBp: pesosToBp(0.01), limiteSuperiorBp: pesosToBp(197.07), cuotaFijaBp: pesosToBp(0), tasaExcedenteBp: porcentajeToBp(1.92) },
      { limiteInferiorBp: pesosToBp(197.08), limiteSuperiorBp: pesosToBp(1672.66), cuotaFijaBp: pesosToBp(3.78), tasaExcedenteBp: porcentajeToBp(6.40) },
      { limiteInferiorBp: pesosToBp(1672.67), limiteSuperiorBp: pesosToBp(2939.93), cuotaFijaBp: pesosToBp(98.22), tasaExcedenteBp: porcentajeToBp(10.88) },
      { limiteInferiorBp: pesosToBp(2939.94), limiteSuperiorBp: pesosToBp(3416.69), cuotaFijaBp: pesosToBp(236.06), tasaExcedenteBp: porcentajeToBp(16.00) },
      { limiteInferiorBp: pesosToBp(3416.70), limiteSuperiorBp: pesosToBp(4091.69), cuotaFijaBp: pesosToBp(312.32), tasaExcedenteBp: porcentajeToBp(17.92) },
      { limiteInferiorBp: pesosToBp(4091.70), limiteSuperiorBp: pesosToBp(8251.14), cuotaFijaBp: pesosToBp(433.28), tasaExcedenteBp: porcentajeToBp(21.36) },
      { limiteInferiorBp: pesosToBp(8251.15), limiteSuperiorBp: pesosToBp(13006.05), cuotaFijaBp: pesosToBp(1321.88), tasaExcedenteBp: porcentajeToBp(23.52) },
      { limiteInferiorBp: pesosToBp(13006.06), limiteSuperiorBp: pesosToBp(24833.78), cuotaFijaBp: pesosToBp(2440.45), tasaExcedenteBp: porcentajeToBp(30.00) },
      { limiteInferiorBp: pesosToBp(24833.79), limiteSuperiorBp: pesosToBp(33108.65), cuotaFijaBp: pesosToBp(5988.77), tasaExcedenteBp: porcentajeToBp(32.00) },
      { limiteInferiorBp: pesosToBp(33108.66), limiteSuperiorBp: pesosToBp(99325.95), cuotaFijaBp: pesosToBp(8636.73), tasaExcedenteBp: porcentajeToBp(34.00) },
      { limiteInferiorBp: pesosToBp(99325.96), limiteSuperiorBp: null, cuotaFijaBp: pesosToBp(31140.51), tasaExcedenteBp: porcentajeToBp(35.00) },
    ],
  },
  diario: {
    periodo: 'diario',
    anio: 2026,
    tramos: [
      { limiteInferiorBp: pesosToBp(0.01), limiteSuperiorBp: pesosToBp(28.15), cuotaFijaBp: pesosToBp(0), tasaExcedenteBp: porcentajeToBp(1.92) },
      { limiteInferiorBp: pesosToBp(28.16), limiteSuperiorBp: pesosToBp(238.95), cuotaFijaBp: pesosToBp(0.54), tasaExcedenteBp: porcentajeToBp(6.40) },
      { limiteInferiorBp: pesosToBp(238.96), limiteSuperiorBp: pesosToBp(419.99), cuotaFijaBp: pesosToBp(14.03), tasaExcedenteBp: porcentajeToBp(10.88) },
      { limiteInferiorBp: pesosToBp(420.00), limiteSuperiorBp: pesosToBp(488.10), cuotaFijaBp: pesosToBp(33.72), tasaExcedenteBp: porcentajeToBp(16.00) },
      { limiteInferiorBp: pesosToBp(488.11), limiteSuperiorBp: pesosToBp(584.53), cuotaFijaBp: pesosToBp(44.62), tasaExcedenteBp: porcentajeToBp(17.92) },
      { limiteInferiorBp: pesosToBp(584.54), limiteSuperiorBp: pesosToBp(1178.74), cuotaFijaBp: pesosToBp(61.90), tasaExcedenteBp: porcentajeToBp(21.36) },
      { limiteInferiorBp: pesosToBp(1178.75), limiteSuperiorBp: pesosToBp(1858.01), cuotaFijaBp: pesosToBp(188.84), tasaExcedenteBp: porcentajeToBp(23.52) },
      { limiteInferiorBp: pesosToBp(1858.02), limiteSuperiorBp: pesosToBp(3547.68), cuotaFijaBp: pesosToBp(348.63), tasaExcedenteBp: porcentajeToBp(30.00) },
      { limiteInferiorBp: pesosToBp(3547.69), limiteSuperiorBp: pesosToBp(4729.81), cuotaFijaBp: pesosToBp(855.53), tasaExcedenteBp: porcentajeToBp(32.00) },
      { limiteInferiorBp: pesosToBp(4729.82), limiteSuperiorBp: pesosToBp(14189.42), cuotaFijaBp: pesosToBp(1233.81), tasaExcedenteBp: porcentajeToBp(34.00) },
      { limiteInferiorBp: pesosToBp(14189.43), limiteSuperiorBp: null, cuotaFijaBp: pesosToBp(4450.08), tasaExcedenteBp: porcentajeToBp(35.00) },
    ],
  },
};

// ===================== SUBSIDIO AL EMPLEO 2025 =====================
// CAMBIO IMPORTANTE: A partir de 2025, el subsidio cambió drásticamente.
// DOF 31/12/2024 - Art. Décimo Transitorio Reforma Fiscal
// Ya NO es una tabla con múltiples rangos - ahora es CUOTA FIJA:
// - $475.00 mensuales si ingreso ≤ $10,171
// - $0 si ingreso > $10,171
// El subsidio es 13.8% de la UMA mensual ($3,439.46 × 0.138 = $474.65 ≈ $475)

export interface ConfigSubsidio {
  limiteIngresoMensualBp: bigint;
  subsidioMensualBp: bigint;
}

// Configuración simplificada para 2025
export const CONFIG_SUBSIDIO_2025: ConfigSubsidio = {
  limiteIngresoMensualBp: pesosToBp(10171.00),
  subsidioMensualBp: pesosToBp(475.00),
};

// ===================== SUBSIDIO AL EMPLEO 2026 =====================
// DOF 31/12/2025 - Actualización del subsidio al empleo para 2026
// El subsidio se calcula como porcentaje de la UMA mensual:
// - ENERO 2026: 15.59% de UMA 2025 = 15.59% × $3,439.46 = $536.21
// - FEB-DIC 2026: 15.02% de UMA 2026 (se actualizará cuando INEGI publique UMA 2026)
// - Límite de ingreso: $11,492.66 mensuales (vs $10,171 en 2025)

export const CONFIG_SUBSIDIO_2026_ENERO: ConfigSubsidio = {
  limiteIngresoMensualBp: pesosToBp(11492.66),
  subsidioMensualBp: pesosToBp(536.21),  // 15.59% de UMA 2025 para enero 2026
};

export const CONFIG_SUBSIDIO_2026: ConfigSubsidio = {
  limiteIngresoMensualBp: pesosToBp(11492.66),
  subsidioMensualBp: pesosToBp(536.22),  // 15.02% de UMA 2026 (PENDIENTE: actualizar con UMA 2026 oficial)
};

// Factores de conversión por periodo (días / 30.4)
const FACTORES_PERIODO: Record<TipoPeriodo, number> = {
  mensual: 1,           // 30.4 / 30.4
  quincenal: 0.4934,    // 15 / 30.4
  catorcenal: 0.4605,   // 14 / 30.4
  semanal: 0.2303,      // 7 / 30.4
  diario: 0.0329,       // 1 / 30.4
};

// Días por periodo para límite de ingreso
const DIAS_PERIODO: Record<TipoPeriodo, number> = {
  mensual: 30.4,
  quincenal: 15,
  catorcenal: 14,
  semanal: 7,
  diario: 1,
};

/**
 * Calcula el subsidio al empleo 2025 según el nuevo esquema de cuota fija
 * @param ingresoGravableBp Ingreso gravable del periodo en basis points
 * @param periodo Tipo de periodo de nómina
 * @returns Subsidio aplicable en basis points
 */
export function calcularSubsidio2025(
  ingresoGravableBp: bigint,
  periodo: TipoPeriodo
): bigint {
  // Calcular límite de ingreso proporcional al periodo
  const limiteIngresoPeriodo = BigInt(
    Math.trunc(Number(CONFIG_SUBSIDIO_2025.limiteIngresoMensualBp) * DIAS_PERIODO[periodo] / 30.4)
  );
  
  // Si el ingreso supera el límite, no hay subsidio
  if (ingresoGravableBp > limiteIngresoPeriodo) {
    return BigInt(0);
  }
  
  // Calcular subsidio proporcional al periodo
  const subsidio = BigInt(
    Math.trunc(Number(CONFIG_SUBSIDIO_2025.subsidioMensualBp) * FACTORES_PERIODO[periodo])
  );
  
  return subsidio;
}

// Montos de subsidio precalculados por periodo para referencia rápida
export const SUBSIDIOS_POR_PERIODO_2025: Record<TipoPeriodo, { limiteBp: bigint; subsidioBp: bigint }> = {
  mensual: { 
    limiteBp: CONFIG_SUBSIDIO_2025.limiteIngresoMensualBp, 
    subsidioBp: CONFIG_SUBSIDIO_2025.subsidioMensualBp 
  },
  quincenal: { 
    limiteBp: pesosToBp(5018.59),  // 10171 * 15 / 30.4
    subsidioBp: pesosToBp(234.38)  // 475 * 15 / 30.4
  },
  catorcenal: { 
    limiteBp: pesosToBp(4683.99),  // 10171 * 14 / 30.4
    subsidioBp: pesosToBp(218.75)  // 475 * 14 / 30.4
  },
  semanal: { 
    limiteBp: pesosToBp(2341.99),  // 10171 * 7 / 30.4
    subsidioBp: pesosToBp(109.38)  // 475 * 7 / 30.4
  },
  diario: {
    limiteBp: pesosToBp(334.57),   // 10171 / 30.4
    subsidioBp: pesosToBp(15.63)   // 475 / 30.4
  },
};

/**
 * Calcula el subsidio al empleo 2026 según el nuevo esquema de cuota fija
 * @param ingresoGravableBp Ingreso gravable del periodo en basis points
 * @param periodo Tipo de periodo de nómina
 * @param mes Mes del año (1-12). Enero usa configuración especial
 * @returns Subsidio aplicable en basis points
 */
export function calcularSubsidio2026(
  ingresoGravableBp: bigint,
  periodo: TipoPeriodo,
  mes: number = 1
): bigint {
  // Seleccionar configuración según el mes
  const config = mes === 1 ? CONFIG_SUBSIDIO_2026_ENERO : CONFIG_SUBSIDIO_2026;

  // Calcular límite de ingreso proporcional al periodo
  const limiteIngresoPeriodo = BigInt(
    Math.trunc(Number(config.limiteIngresoMensualBp) * DIAS_PERIODO[periodo] / 30.4)
  );

  // Si el ingreso supera el límite, no hay subsidio
  if (ingresoGravableBp > limiteIngresoPeriodo) {
    return BigInt(0);
  }

  // Calcular subsidio proporcional al periodo
  const subsidio = BigInt(
    Math.trunc(Number(config.subsidioMensualBp) * FACTORES_PERIODO[periodo])
  );

  return subsidio;
}

// Montos de subsidio precalculados por periodo para 2026 (enero)
export const SUBSIDIOS_POR_PERIODO_2026_ENERO: Record<TipoPeriodo, { limiteBp: bigint; subsidioBp: bigint }> = {
  mensual: {
    limiteBp: CONFIG_SUBSIDIO_2026_ENERO.limiteIngresoMensualBp,
    subsidioBp: CONFIG_SUBSIDIO_2026_ENERO.subsidioMensualBp
  },
  quincenal: {
    limiteBp: pesosToBp(5668.75),  // 11492.66 * 15 / 30.4
    subsidioBp: pesosToBp(264.58)  // 536.21 * 15 / 30.4
  },
  catorcenal: {
    limiteBp: pesosToBp(5290.49),  // 11492.66 * 14 / 30.4
    subsidioBp: pesosToBp(246.95)  // 536.21 * 14 / 30.4
  },
  semanal: {
    limiteBp: pesosToBp(2645.24),  // 11492.66 * 7 / 30.4
    subsidioBp: pesosToBp(123.47)  // 536.21 * 7 / 30.4
  },
  diario: {
    limiteBp: pesosToBp(377.89),   // 11492.66 / 30.4
    subsidioBp: pesosToBp(17.64)   // 536.21 / 30.4
  },
};

// Montos de subsidio precalculados por periodo para 2026 (febrero-diciembre)
export const SUBSIDIOS_POR_PERIODO_2026: Record<TipoPeriodo, { limiteBp: bigint; subsidioBp: bigint }> = {
  mensual: {
    limiteBp: CONFIG_SUBSIDIO_2026.limiteIngresoMensualBp,
    subsidioBp: CONFIG_SUBSIDIO_2026.subsidioMensualBp
  },
  quincenal: {
    limiteBp: pesosToBp(5668.75),  // 11492.66 * 15 / 30.4
    subsidioBp: pesosToBp(264.58)  // 536.22 * 15 / 30.4
  },
  catorcenal: {
    limiteBp: pesosToBp(5290.49),  // 11492.66 * 14 / 30.4
    subsidioBp: pesosToBp(246.96)  // 536.22 * 14 / 30.4
  },
  semanal: {
    limiteBp: pesosToBp(2645.24),  // 11492.66 * 7 / 30.4
    subsidioBp: pesosToBp(123.48)  // 536.22 * 7 / 30.4
  },
  diario: {
    limiteBp: pesosToBp(377.89),   // 11492.66 / 30.4
    subsidioBp: pesosToBp(17.64)   // 536.22 / 30.4
  },
};

// ===================== CUOTAS IMSS 2025 =====================

export interface CuotaIMSS {
  ramo: string;
  concepto: string;
  patronTasaBp: number;
  trabajadorTasaBp: number;
  baseCalculo: 'sbc' | 'excedente_3uma' | 'uma_fijo';
  aplicaTopeCotizacion: boolean;
}

export const CUOTAS_IMSS_2025: CuotaIMSS[] = [
  { ramo: 'Enfermedades y Maternidad', concepto: 'Cuota Fija (hasta 3 UMA)', patronTasaBp: porcentajeToBp(20.40), trabajadorTasaBp: 0, baseCalculo: 'uma_fijo', aplicaTopeCotizacion: false },
  { ramo: 'Enfermedades y Maternidad', concepto: 'Excedente 3 UMAs - Prestaciones en Especie', patronTasaBp: porcentajeToBp(1.10), trabajadorTasaBp: porcentajeToBp(0.40), baseCalculo: 'excedente_3uma', aplicaTopeCotizacion: true },
  { ramo: 'Enfermedades y Maternidad', concepto: 'Prestaciones en Dinero', patronTasaBp: porcentajeToBp(0.70), trabajadorTasaBp: porcentajeToBp(0.25), baseCalculo: 'sbc', aplicaTopeCotizacion: true },
  { ramo: 'Enfermedades y Maternidad', concepto: 'Gastos Médicos Pensionados', patronTasaBp: porcentajeToBp(1.05), trabajadorTasaBp: porcentajeToBp(0.375), baseCalculo: 'sbc', aplicaTopeCotizacion: true },
  { ramo: 'Invalidez y Vida', concepto: 'Invalidez y Vida', patronTasaBp: porcentajeToBp(1.75), trabajadorTasaBp: porcentajeToBp(0.625), baseCalculo: 'sbc', aplicaTopeCotizacion: true },
  { ramo: 'Riesgos de Trabajo', concepto: 'Riesgos de Trabajo (Prima Media)', patronTasaBp: porcentajeToBp(0.54355), trabajadorTasaBp: 0, baseCalculo: 'sbc', aplicaTopeCotizacion: true },
  { ramo: 'Guarderías y Prestaciones Sociales', concepto: 'Guarderías', patronTasaBp: porcentajeToBp(1.00), trabajadorTasaBp: 0, baseCalculo: 'sbc', aplicaTopeCotizacion: true },
  { ramo: 'Retiro', concepto: 'Retiro', patronTasaBp: porcentajeToBp(2.00), trabajadorTasaBp: 0, baseCalculo: 'sbc', aplicaTopeCotizacion: true },
  { ramo: 'Cesantía en Edad Avanzada y Vejez', concepto: 'CEAV Patrón', patronTasaBp: porcentajeToBp(4.241), trabajadorTasaBp: porcentajeToBp(1.125), baseCalculo: 'sbc', aplicaTopeCotizacion: true },
  { ramo: 'INFONAVIT', concepto: 'Aportación Vivienda', patronTasaBp: porcentajeToBp(5.00), trabajadorTasaBp: 0, baseCalculo: 'sbc', aplicaTopeCotizacion: true },
];

// ===================== FUNCIONES DE CÁLCULO =====================

/**
 * Calcula ISR con tabla 2025
 * Fórmula: (Base Gravable - Límite Inferior) × Tasa Excedente + Cuota Fija
 * 
 * NOTA 2025: El subsidio al empleo cambió a cuota fija $475 mensual si ingreso ≤ $10,171
 */
export function calcularISR(
  baseGravableBp: bigint,
  periodo: TipoPeriodo
): { isrBp: bigint; subsidioEmpleoBp: bigint; isrRetenidoBp: bigint; tramoAplicado: number } {
  const tablaISR = TABLAS_ISR_2025[periodo];
  
  let tramoAplicado = 0;
  let isrBp = BigInt(0);
  
  // Calcular ISR según tabla progresiva
  for (let i = 0; i < tablaISR.tramos.length; i++) {
    const tramo = tablaISR.tramos[i];
    const enTramo = compararBp(baseGravableBp, tramo.limiteInferiorBp) >= 0 &&
      (tramo.limiteSuperiorBp === null || compararBp(baseGravableBp, tramo.limiteSuperiorBp) <= 0);
    
    if (enTramo) {
      tramoAplicado = i + 1;
      const excedenteBp = restarBp(baseGravableBp, tramo.limiteInferiorBp);
      const isrExcedenteBp = multiplicarBpPorTasa(excedenteBp, tramo.tasaExcedenteBp);
      isrBp = sumarBp(isrExcedenteBp, tramo.cuotaFijaBp);
      break;
    }
  }
  
  // Calcular subsidio al empleo 2025 (cuota fija, NO tabla tradicional)
  const subsidioEmpleoBp = calcularSubsidio2025(baseGravableBp, periodo);
  
  // ISR retenido = ISR causado - Subsidio (mínimo 0)
  // NOTA 2025: Si subsidio > ISR, la diferencia NO se entrega al trabajador
  const isrRetenidoBp = maxBp(restarBp(isrBp, subsidioEmpleoBp), BigInt(0));
  
  return { isrBp, subsidioEmpleoBp, isrRetenidoBp, tramoAplicado };
}

/**
 * Calcula ISR con tabla 2026
 * Fórmula: (Base Gravable - Límite Inferior) × Tasa Excedente + Cuota Fija
 *
 * NOTA 2026: El subsidio al empleo aumenta a $536.21 (enero) / $536.22 (feb-dic)
 * con límite de ingreso de $11,492.66 mensuales (vs $10,171 en 2025)
 */
export function calcularISR2026(
  baseGravableBp: bigint,
  periodo: TipoPeriodo,
  mes: number = 1
): { isrBp: bigint; subsidioEmpleoBp: bigint; isrRetenidoBp: bigint; tramoAplicado: number } {
  const tablaISR = TABLAS_ISR_2026[periodo];

  let tramoAplicado = 0;
  let isrBp = BigInt(0);

  // Calcular ISR según tabla progresiva 2026
  for (let i = 0; i < tablaISR.tramos.length; i++) {
    const tramo = tablaISR.tramos[i];
    const enTramo = compararBp(baseGravableBp, tramo.limiteInferiorBp) >= 0 &&
      (tramo.limiteSuperiorBp === null || compararBp(baseGravableBp, tramo.limiteSuperiorBp) <= 0);

    if (enTramo) {
      tramoAplicado = i + 1;
      const excedenteBp = restarBp(baseGravableBp, tramo.limiteInferiorBp);
      const isrExcedenteBp = multiplicarBpPorTasa(excedenteBp, tramo.tasaExcedenteBp);
      isrBp = sumarBp(isrExcedenteBp, tramo.cuotaFijaBp);
      break;
    }
  }

  // Calcular subsidio al empleo 2026 (cuota fija mejorada)
  const subsidioEmpleoBp = calcularSubsidio2026(baseGravableBp, periodo, mes);

  // ISR retenido = ISR causado - Subsidio (mínimo 0)
  const isrRetenidoBp = maxBp(restarBp(isrBp, subsidioEmpleoBp), BigInt(0));

  return { isrBp, subsidioEmpleoBp, isrRetenidoBp, tramoAplicado };
}

/**
 * Calcula cuotas IMSS trabajador
 */
export function calcularIMSSTrabajador(
  sbcDiarioBp: bigint,
  diasPeriodo: number
): { totalBp: bigint; desglose: { concepto: string; montoBp: bigint }[] } {
  const umaDiariaBp = pesosToBp(CONFIG_FISCAL_2025.uma.diaria);
  const topeCotizacionBp = multiplicarBpPorTasa(umaDiariaBp, CONFIG_FISCAL_2025.limiteSuperiorCotizacionUMAs * 10000);
  const limite3UMAsBp = multiplicarBpPorTasa(umaDiariaBp, 30000);
  
  const sbcTopeBp = minBp(sbcDiarioBp, topeCotizacionBp);
  const sbcPeriodoBp = multiplicarBpPorTasa(sbcTopeBp, diasPeriodo * 10000);
  
  const desglose: { concepto: string; montoBp: bigint }[] = [];
  let totalBp = BigInt(0);
  
  for (const cuota of CUOTAS_IMSS_2025) {
    if (cuota.trabajadorTasaBp === 0) continue;
    
    let baseBp: bigint;
    if (cuota.baseCalculo === 'excedente_3uma') {
      const excedente = restarBp(sbcDiarioBp, limite3UMAsBp);
      if (compararBp(excedente, BigInt(0)) <= 0) continue;
      baseBp = multiplicarBpPorTasa(excedente, diasPeriodo * 10000);
    } else {
      baseBp = sbcPeriodoBp;
    }
    
    const cuotaBp = multiplicarBpPorTasa(baseBp, cuota.trabajadorTasaBp);
    if (compararBp(cuotaBp, BigInt(0)) > 0) {
      desglose.push({ concepto: cuota.concepto, montoBp: cuotaBp });
      totalBp = sumarBp(totalBp, cuotaBp);
    }
  }
  
  return { totalBp, desglose };
}

/**
 * Calcula cuotas IMSS patrón
 */
export function calcularIMSSPatron(
  sbcDiarioBp: bigint,
  diasPeriodo: number,
  primaRiesgoTrabajo?: number
): { totalBp: bigint; desglose: { concepto: string; montoBp: bigint }[] } {
  const umaDiariaBp = pesosToBp(CONFIG_FISCAL_2025.uma.diaria);
  const topeCotizacionBp = multiplicarBpPorTasa(umaDiariaBp, CONFIG_FISCAL_2025.limiteSuperiorCotizacionUMAs * 10000);
  const limite3UMAsBp = multiplicarBpPorTasa(umaDiariaBp, 30000);
  
  const sbcTopeBp = minBp(sbcDiarioBp, topeCotizacionBp);
  const sbcPeriodoBp = multiplicarBpPorTasa(sbcTopeBp, diasPeriodo * 10000);
  
  const desglose: { concepto: string; montoBp: bigint }[] = [];
  let totalBp = BigInt(0);
  
  for (const cuota of CUOTAS_IMSS_2025) {
    let tasaPatronBp = cuota.patronTasaBp;
    if (cuota.concepto.includes('Riesgos') && primaRiesgoTrabajo !== undefined) {
      tasaPatronBp = porcentajeToBp(primaRiesgoTrabajo);
    }
    
    if (tasaPatronBp === 0) continue;
    
    let baseBp: bigint;
    if (cuota.baseCalculo === 'uma_fijo') {
      baseBp = multiplicarBpPorTasa(limite3UMAsBp, diasPeriodo * 10000);
    } else if (cuota.baseCalculo === 'excedente_3uma') {
      const excedente = restarBp(sbcDiarioBp, limite3UMAsBp);
      if (compararBp(excedente, BigInt(0)) <= 0) continue;
      baseBp = multiplicarBpPorTasa(excedente, diasPeriodo * 10000);
    } else {
      baseBp = sbcPeriodoBp;
    }
    
    const cuotaBp = multiplicarBpPorTasa(baseBp, tasaPatronBp);
    if (compararBp(cuotaBp, BigInt(0)) > 0) {
      desglose.push({ concepto: cuota.concepto, montoBp: cuotaBp });
      totalBp = sumarBp(totalBp, cuotaBp);
    }
  }
  
  return { totalBp, desglose };
}

/**
 * Calcula el Salario Diario Integrado (SDI)
 * SDI = Salario Diario × Factor de Integración
 */
export function calcularSDI(
  salarioDiarioBp: bigint,
  diasVacaciones: number,
  primaVacacionalPct: number = 25,
  diasAguinaldo: number = 15
): { sdiBp: bigint; factorIntegracion: number } {
  const factorAguinaldo = diasAguinaldo / CONFIG_FISCAL_2025.diasAnio;
  const factorPrimaVacacional = (diasVacaciones * (primaVacacionalPct / 100)) / CONFIG_FISCAL_2025.diasAnio;
  const factorIntegracion = 1 + factorAguinaldo + factorPrimaVacacional;
  
  const sdiBp = multiplicarBpPorTasa(salarioDiarioBp, Math.round(factorIntegracion * 10000));
  
  return { sdiBp, factorIntegracion };
}

/**
 * Calcula el Salario Base de Cotización (SBC)
 * Aplica tope de 25 UMAs y mínimo de 1 salario mínimo
 */
export function calcularSBC(
  sdiBp: bigint,
  zona: ZonaSalario = 'general'
): { sbcBp: bigint; topeAplicado: boolean; minimoAplicado: boolean } {
  const umaDiariaBp = pesosToBp(CONFIG_FISCAL_2025.uma.diaria);
  const salarioMinimoBp = pesosToBp(zona === 'frontera' ? CONFIG_FISCAL_2025.salarioMinimo.frontera : CONFIG_FISCAL_2025.salarioMinimo.general);
  const topeCotizacionBp = multiplicarBpPorTasa(umaDiariaBp, CONFIG_FISCAL_2025.limiteSuperiorCotizacionUMAs * 10000);
  
  let sbcBp = sdiBp;
  let topeAplicado = false;
  let minimoAplicado = false;
  
  if (compararBp(sbcBp, topeCotizacionBp) > 0) {
    sbcBp = topeCotizacionBp;
    topeAplicado = true;
  }
  
  if (compararBp(sbcBp, salarioMinimoBp) < 0) {
    sbcBp = salarioMinimoBp;
    minimoAplicado = true;
  }
  
  return { sbcBp, topeAplicado, minimoAplicado };
}

/**
 * Calcula horas extra con límites exentos y gravables
 * LFT Art. 67-68: Hasta 9 hrs/semana al doble, después al triple
 * LISR: Primeras 9 hrs/semana exentas si no exceden 50% del salario
 */
export function calcularHorasExtra(
  salarioPorHoraBp: bigint,
  horasDobles: number,
  horasTriples: number,
  salarioPeriodoBp: bigint
): {
  pagoDoblesBp: bigint;
  pagoTriplesBp: bigint;
  totalBp: bigint;
  exentoBp: bigint;
  gravadoBp: bigint;
} {
  const pagoDoblesBp = multiplicarBpPorTasa(salarioPorHoraBp, horasDobles * 20000);
  const pagoTriplesBp = multiplicarBpPorTasa(salarioPorHoraBp, horasTriples * 30000);
  const totalBp = sumarBp(pagoDoblesBp, pagoTriplesBp);
  
  const limite50PctSalarioBp = dividirBp(salarioPeriodoBp, 2);
  const exentoPotencialBp = minBp(pagoDoblesBp, limite50PctSalarioBp);
  
  const exentoBp = horasDobles <= 9 ? exentoPotencialBp : BigInt(0);
  const gravadoBp = restarBp(totalBp, exentoBp);
  
  return { pagoDoblesBp, pagoTriplesBp, totalBp, exentoBp, gravadoBp };
}

/**
 * Calcula aguinaldo
 * LFT Art. 87: Mínimo 15 días de salario
 */
export function calcularAguinaldo(
  salarioDiarioBp: bigint,
  diasAguinaldo: number,
  diasTrabajadosAnio: number,
  esAguinaldoCompleto: boolean = false
): {
  aguinaldoBp: bigint;
  diasProporcionales: number;
  exentoBp: bigint;
  gravadoBp: bigint;
} {
  const diasProporcionales = esAguinaldoCompleto ? diasAguinaldo : (diasAguinaldo * diasTrabajadosAnio) / CONFIG_FISCAL_2025.diasAnio;
  const aguinaldoBp = multiplicarBpPorTasa(salarioDiarioBp, Math.round(diasProporcionales * 10000));
  
  const umaDiariaBp = pesosToBp(CONFIG_FISCAL_2025.uma.diaria);
  const limiteExentoBp = multiplicarBpPorTasa(umaDiariaBp, 300000);
  
  const exentoBp = minBp(aguinaldoBp, limiteExentoBp);
  const gravadoBp = maxBp(restarBp(aguinaldoBp, exentoBp), BigInt(0));
  
  return { aguinaldoBp, diasProporcionales, exentoBp, gravadoBp };
}

/**
 * Calcula prima vacacional
 * LFT Art. 80: Mínimo 25% del salario de vacaciones
 */
export function calcularPrimaVacacional(
  salarioDiarioBp: bigint,
  diasVacaciones: number,
  primaPct: number = 25
): {
  primaBp: bigint;
  exentoBp: bigint;
  gravadoBp: bigint;
} {
  const vacacionesBp = multiplicarBpPorTasa(salarioDiarioBp, Math.round(diasVacaciones * 10000));
  const primaBp = multiplicarBpPorTasa(vacacionesBp, Math.round(primaPct * 100));
  
  const umaDiariaBp = pesosToBp(CONFIG_FISCAL_2025.uma.diaria);
  const limiteExentoBp = multiplicarBpPorTasa(umaDiariaBp, 150000);
  
  const exentoBp = minBp(primaBp, limiteExentoBp);
  const gravadoBp = maxBp(restarBp(primaBp, exentoBp), BigInt(0));
  
  return { primaBp, exentoBp, gravadoBp };
}

/**
 * Calcula PTU (Participación de los Trabajadores en las Utilidades)
 * LFT Art. 117-131: 10% de utilidades, 50% proporcional a días y 50% proporcional a salarios
 */
export function calcularPTU(
  ptuTotalEmpresa: number,
  diasTrabajadosEmpleado: number,
  salarioDiarioEmpleado: number,
  totalDiasTrabajadosTodos: number,
  totalSalariosDiariosTodos: number
): {
  ptuBp: bigint;
  porcionDiasBp: bigint;
  porcionSalariosBp: bigint;
  exentoBp: bigint;
  gravadoBp: bigint;
} {
  const ptu50Pct = ptuTotalEmpresa / 2;
  
  const porcionDias = (ptu50Pct * diasTrabajadosEmpleado) / totalDiasTrabajadosTodos;
  const porcionSalarios = (ptu50Pct * salarioDiarioEmpleado) / totalSalariosDiariosTodos;
  
  const ptuTotal = porcionDias + porcionSalarios;
  const ptuBp = pesosToBp(ptuTotal);
  const porcionDiasBp = pesosToBp(porcionDias);
  const porcionSalariosBp = pesosToBp(porcionSalarios);
  
  const umaDiariaBp = pesosToBp(CONFIG_FISCAL_2025.uma.diaria);
  const limiteExentoBp = multiplicarBpPorTasa(umaDiariaBp, 150000);
  
  const exentoBp = minBp(ptuBp, limiteExentoBp);
  const gravadoBp = maxBp(restarBp(ptuBp, exentoBp), BigInt(0));
  
  return { ptuBp, porcionDiasBp, porcionSalariosBp, exentoBp, gravadoBp };
}

/**
 * Calcula días de vacaciones según LFT 2024
 * Art. 76: 12 días primer año, +2 por año hasta 5 años, después +2 cada 5 años
 */
export function obtenerDiasVacacionesLFT(aniosAntiguedad: number): number {
  if (aniosAntiguedad < 1) return 0;
  if (aniosAntiguedad === 1) return 12;
  if (aniosAntiguedad === 2) return 14;
  if (aniosAntiguedad === 3) return 16;
  if (aniosAntiguedad === 4) return 18;
  if (aniosAntiguedad === 5) return 20;
  
  const quinqueniosAdicionales = Math.floor((aniosAntiguedad - 5) / 5);
  return 20 + (quinqueniosAdicionales * 2);
}

/**
 * Calcula finiquito/liquidación completo
 */
export function calcularFiniquitoLiquidacion(
  salarioDiarioBp: bigint,
  fechaIngreso: Date,
  fechaSalida: Date,
  tipoSeparacion: TipoSeparacion,
  diasVacacionesTomadas: number,
  diasAguinaldoPagados: number = 0
): {
  conceptos: {
    concepto: string;
    dias: number;
    montoBp: bigint;
    exentoBp: bigint;
    gravadoBp: bigint;
  }[];
  totalBp: bigint;
  totalExentoBp: bigint;
  totalGravadoBp: bigint;
} {
  const conceptos: { concepto: string; dias: number; montoBp: bigint; exentoBp: bigint; gravadoBp: bigint }[] = [];
  const umaDiariaBp = pesosToBp(CONFIG_FISCAL_2025.uma.diaria);
  
  const msPerDay = 1000 * 60 * 60 * 24;
  const antiguedadMs = fechaSalida.getTime() - fechaIngreso.getTime();
  const aniosAntiguedad = antiguedadMs / (msPerDay * 365);
  const aniosCompletos = Math.floor(aniosAntiguedad);
  
  const inicioAnio = new Date(fechaSalida.getFullYear(), 0, 1);
  const diasDelAnioTrabajados = Math.floor((fechaSalida.getTime() - Math.max(fechaIngreso.getTime(), inicioAnio.getTime())) / msPerDay) + 1;
  
  const diasVacacionesCorresponden = obtenerDiasVacacionesLFT(aniosCompletos || 1);
  const diasVacacionesPendientes = Math.max(0, (diasVacacionesCorresponden * diasDelAnioTrabajados / 365) - diasVacacionesTomadas);
  
  if (diasVacacionesPendientes > 0) {
    const montoBp = multiplicarBpPorTasa(salarioDiarioBp, Math.round(diasVacacionesPendientes * 10000));
    conceptos.push({
      concepto: 'Vacaciones Proporcionales',
      dias: diasVacacionesPendientes,
      montoBp,
      exentoBp: montoBp,
      gravadoBp: BigInt(0),
    });
    
    const prima = calcularPrimaVacacional(salarioDiarioBp, diasVacacionesPendientes);
    conceptos.push({
      concepto: 'Prima Vacacional (25%)',
      dias: diasVacacionesPendientes * 0.25,
      montoBp: prima.primaBp,
      exentoBp: prima.exentoBp,
      gravadoBp: prima.gravadoBp,
    });
  }
  
  const aguinaldoProporcionalDias = Math.max(0, (15 * diasDelAnioTrabajados / 365) - diasAguinaldoPagados);
  if (aguinaldoProporcionalDias > 0) {
    const aguinaldo = calcularAguinaldo(salarioDiarioBp, 15, diasDelAnioTrabajados);
    conceptos.push({
      concepto: 'Aguinaldo Proporcional',
      dias: aguinaldo.diasProporcionales,
      montoBp: aguinaldo.aguinaldoBp,
      exentoBp: aguinaldo.exentoBp,
      gravadoBp: aguinaldo.gravadoBp,
    });
  }
  
  if (tipoSeparacion === 'despido_injustificado') {
    const dias90Bp = multiplicarBpPorTasa(salarioDiarioBp, 900000);
    const limiteExento90Bp = multiplicarBpPorTasa(umaDiariaBp, 900000);
    conceptos.push({
      concepto: 'Indemnización Constitucional (3 meses)',
      dias: 90,
      montoBp: dias90Bp,
      exentoBp: minBp(dias90Bp, limiteExento90Bp),
      gravadoBp: maxBp(restarBp(dias90Bp, limiteExento90Bp), BigInt(0)),
    });
    
    if (aniosCompletos > 0) {
      const dias20Bp = multiplicarBpPorTasa(salarioDiarioBp, aniosCompletos * 200000);
      const limiteExento20Bp = multiplicarBpPorTasa(umaDiariaBp, aniosCompletos * 200000);
      conceptos.push({
        concepto: `20 días por año de servicio (${aniosCompletos} años)`,
        dias: 20 * aniosCompletos,
        montoBp: dias20Bp,
        exentoBp: minBp(dias20Bp, limiteExento20Bp),
        gravadoBp: maxBp(restarBp(dias20Bp, limiteExento20Bp), BigInt(0)),
      });
    }
    
    if (aniosCompletos > 0) {
      const diasPrimaAntiguedad = Math.min(12, aniosAntiguedad > 15 ? aniosAntiguedad : 12);
      const salarioBasePrimaAntiguedad = minBp(salarioDiarioBp, multiplicarBpPorTasa(pesosToBp(CONFIG_FISCAL_2025.salarioMinimo.general), 20000));
      const primaAntiguedadBp = multiplicarBpPorTasa(salarioBasePrimaAntiguedad, aniosCompletos * diasPrimaAntiguedad * 10000);
      conceptos.push({
        concepto: `Prima de Antigüedad (12 días × ${aniosCompletos} años)`,
        dias: 12 * aniosCompletos,
        montoBp: primaAntiguedadBp,
        exentoBp: primaAntiguedadBp,
        gravadoBp: BigInt(0),
      });
    }
  } else if (tipoSeparacion === 'renuncia' && aniosCompletos >= 15) {
    const salarioBasePrimaAntiguedad = minBp(salarioDiarioBp, multiplicarBpPorTasa(pesosToBp(CONFIG_FISCAL_2025.salarioMinimo.general), 20000));
    const primaAntiguedadBp = multiplicarBpPorTasa(salarioBasePrimaAntiguedad, aniosCompletos * 120000);
    conceptos.push({
      concepto: `Prima de Antigüedad (12 días × ${aniosCompletos} años)`,
      dias: 12 * aniosCompletos,
      montoBp: primaAntiguedadBp,
      exentoBp: primaAntiguedadBp,
      gravadoBp: BigInt(0),
    });
  }
  
  let totalBp = BigInt(0);
  let totalExentoBp = BigInt(0);
  let totalGravadoBp = BigInt(0);
  
  for (const concepto of conceptos) {
    totalBp = sumarBp(totalBp, concepto.montoBp);
    totalExentoBp = sumarBp(totalExentoBp, concepto.exentoBp);
    totalGravadoBp = sumarBp(totalGravadoBp, concepto.gravadoBp);
  }
  
  return { conceptos, totalBp, totalExentoBp, totalGravadoBp };
}

// ===================== CLAVES SAT CFDI 4.0 =====================

export const SAT_TIPOS_PERCEPCION = {
  '001': { clave: '001', descripcion: 'Sueldos, Salarios Rayas y Jornales' },
  '002': { clave: '002', descripcion: 'Gratificación Anual (Aguinaldo)' },
  '003': { clave: '003', descripcion: 'Participación de los Trabajadores en las Utilidades PTU' },
  '004': { clave: '004', descripcion: 'Reembolso de Gastos Médicos Dentales y Hospitalarios' },
  '005': { clave: '005', descripcion: 'Fondo de Ahorro' },
  '006': { clave: '006', descripcion: 'Caja de ahorro' },
  '009': { clave: '009', descripcion: 'Contribuciones a Cargo del Trabajador Pagadas por el Patrón' },
  '010': { clave: '010', descripcion: 'Premios por puntualidad' },
  '011': { clave: '011', descripcion: 'Prima de Seguro de vida' },
  '012': { clave: '012', descripcion: 'Seguro de Gastos Médicos Mayores' },
  '013': { clave: '013', descripcion: 'Cuotas Sindicales Pagadas por el Patrón' },
  '014': { clave: '014', descripcion: 'Subsidios por incapacidad' },
  '015': { clave: '015', descripcion: 'Becas para trabajadores y/o hijos' },
  '019': { clave: '019', descripcion: 'Horas extra' },
  '020': { clave: '020', descripcion: 'Prima dominical' },
  '021': { clave: '021', descripcion: 'Prima vacacional' },
  '022': { clave: '022', descripcion: 'Prima por antigüedad' },
  '023': { clave: '023', descripcion: 'Pagos por separación' },
  '024': { clave: '024', descripcion: 'Seguro de retiro' },
  '025': { clave: '025', descripcion: 'Indemnizaciones' },
  '026': { clave: '026', descripcion: 'Reembolso por funeral' },
  '027': { clave: '027', descripcion: 'Cuotas de seguridad social pagadas por el patrón' },
  '028': { clave: '028', descripcion: 'Comisiones' },
  '029': { clave: '029', descripcion: 'Vales de despensa' },
  '030': { clave: '030', descripcion: 'Vales de restaurante' },
  '031': { clave: '031', descripcion: 'Vales de gasolina' },
  '032': { clave: '032', descripcion: 'Vales de ropa' },
  '033': { clave: '033', descripcion: 'Ayuda para renta' },
  '034': { clave: '034', descripcion: 'Ayuda para artículos escolares' },
  '035': { clave: '035', descripcion: 'Ayuda para anteojos' },
  '036': { clave: '036', descripcion: 'Ayuda para transporte' },
  '037': { clave: '037', descripcion: 'Ayuda para gastos de funeral' },
  '038': { clave: '038', descripcion: 'Otros ingresos por salarios' },
  '039': { clave: '039', descripcion: 'Jubilaciones, pensiones o haberes de retiro' },
  '044': { clave: '044', descripcion: 'Jubilaciones, pensiones o haberes de retiro en parcialidades' },
  '045': { clave: '045', descripcion: 'Ingresos en acciones o títulos valor que representan bienes' },
  '046': { clave: '046', descripcion: 'Ingresos asimilados a salarios' },
  '047': { clave: '047', descripcion: 'Alimentación' },
  '048': { clave: '048', descripcion: 'Habitación' },
  '049': { clave: '049', descripcion: 'Premios por asistencia' },
  '050': { clave: '050', descripcion: 'Viáticos' },
  '051': { clave: '051', descripcion: 'Pagos por gratificaciones, primas, compensaciones, recompensas u otros' },
  '052': { clave: '052', descripcion: 'Pagos de retiro SAR INFONAVIT' },
} as const;

export const SAT_TIPOS_DEDUCCION = {
  '001': { clave: '001', descripcion: 'Seguridad social' },
  '002': { clave: '002', descripcion: 'ISR' },
  '003': { clave: '003', descripcion: 'Aportaciones a retiro, cesantía en edad avanzada y vejez' },
  '004': { clave: '004', descripcion: 'Otros' },
  '005': { clave: '005', descripcion: 'Aportaciones a Fondo de vivienda' },
  '006': { clave: '006', descripcion: 'Descuento por incapacidad' },
  '007': { clave: '007', descripcion: 'Pensión alimenticia' },
  '008': { clave: '008', descripcion: 'Renta' },
  '009': { clave: '009', descripcion: 'Préstamos provenientes del Fondo Nacional de la Vivienda para los Trabajadores' },
  '010': { clave: '010', descripcion: 'Pago por crédito de vivienda' },
  '011': { clave: '011', descripcion: 'Pago de abonos INFONACOT' },
  '012': { clave: '012', descripcion: 'Anticipo de salarios' },
  '013': { clave: '013', descripcion: 'Pagos hechos con exceso al trabajador' },
  '014': { clave: '014', descripcion: 'Errores' },
  '015': { clave: '015', descripcion: 'Pérdidas' },
  '016': { clave: '016', descripcion: 'Averías' },
  '017': { clave: '017', descripcion: 'Adquisición de artículos producidos por la empresa o establecimiento' },
  '018': { clave: '018', descripcion: 'Cuotas para la constitución y fomento de sociedades cooperativas y de cajas de ahorro' },
  '019': { clave: '019', descripcion: 'Cuotas sindicales' },
  '020': { clave: '020', descripcion: 'Ausencia (Ausentismo)' },
  '021': { clave: '021', descripcion: 'Cuotas obrero patronales' },
  '022': { clave: '022', descripcion: 'Impuestos Locales' },
  '023': { clave: '023', descripcion: 'Aportaciones voluntarias' },
  '024': { clave: '024', descripcion: 'Ajuste en Gratificación Anual (Aguinaldo) Exento' },
  '025': { clave: '025', descripcion: 'Ajuste en Gratificación Anual (Aguinaldo) Gravado' },
  '026': { clave: '026', descripcion: 'Ajuste en Participación de los Trabajadores en las Utilidades PTU Gravado' },
  '027': { clave: '027', descripcion: 'Ajuste en Viáticos Gravados' },
  '028': { clave: '028', descripcion: 'Ajuste en Viáticos Exentos' },
  '029': { clave: '029', descripcion: 'Ajuste en Prima Dominical Gravada' },
  '030': { clave: '030', descripcion: 'Ajuste en Prima Dominical Exenta' },
  '031': { clave: '031', descripcion: 'Ajuste en Prima Vacacional Gravada' },
  '032': { clave: '032', descripcion: 'Ajuste en Prima Vacacional Exenta' },
  '033': { clave: '033', descripcion: 'Ajuste en Prima por Antigüedad Gravada' },
  '034': { clave: '034', descripcion: 'Ajuste en Prima por Antigüedad Exenta' },
  '035': { clave: '035', descripcion: 'Ajuste en Pagos por Separación Gravado' },
  '036': { clave: '036', descripcion: 'Ajuste en Pagos por Separación Exento' },
  '037': { clave: '037', descripcion: 'Ajuste en Indemnizaciones Gravado' },
  '038': { clave: '038', descripcion: 'Ajuste en Indemnizaciones Exento' },
  '039': { clave: '039', descripcion: 'Ajuste en Reembolso de Gastos Médicos Dentales y Hospitalarios Gravado' },
  '040': { clave: '040', descripcion: 'Ajuste en Reembolso de Gastos Médicos Dentales y Hospitalarios Exento' },
  '041': { clave: '041', descripcion: 'Ajuste en Fondo de Ahorro Gravado' },
  '042': { clave: '042', descripcion: 'Ajuste en Caja de Ahorro Gravado' },
  '043': { clave: '043', descripcion: 'Ajuste en Contribuciones a Cargo del Trabajador Pagadas por el Patrón Gravado' },
  '044': { clave: '044', descripcion: 'Ajuste en Contribuciones a Cargo del Trabajador Pagadas por el Patrón Exento' },
  '045': { clave: '045', descripcion: 'Ajuste en Premios por Puntualidad Gravado' },
  '046': { clave: '046', descripcion: 'Ajuste en Premios por Asistencia Gravado' },
  '047': { clave: '047', descripcion: 'Ajuste en Horas Extra Gravado' },
  '048': { clave: '048', descripcion: 'Ajuste en Horas Extra Exento' },
  '049': { clave: '049', descripcion: 'Ajuste en Jubilaciones, Pensiones o Haberes de Retiro Gravado' },
  '050': { clave: '050', descripcion: 'Ajuste en Jubilaciones, Pensiones o Haberes de Retiro Exento' },
  '051': { clave: '051', descripcion: 'Ajuste en Ingresos Asimilados a Salarios Gravado' },
  '052': { clave: '052', descripcion: 'Ajuste en Alimentación Gravado' },
  '053': { clave: '053', descripcion: 'Ajuste en Alimentación Exento' },
  '054': { clave: '054', descripcion: 'Ajuste en Habitación Gravado' },
  '055': { clave: '055', descripcion: 'Ajuste en Habitación Exento' },
  '056': { clave: '056', descripcion: 'Ajuste en Premios por Productividad Gravado' },
  '057': { clave: '057', descripcion: 'Ajuste en Viáticos Entregados al Trabajador Gravado' },
  '058': { clave: '058', descripcion: 'Ajuste en Viáticos Entregados al Trabajador Exento' },
  '059': { clave: '059', descripcion: 'Ajuste en Ayuda para Gastos de Funeral Gravado' },
  '060': { clave: '060', descripcion: 'Ajuste en Ayuda para Gastos de Funeral Exento' },
  '101': { clave: '101', descripcion: 'ISR Retenido de ejercicio anterior' },
  '102': { clave: '102', descripcion: 'Ajuste a deducciones registradas en nóminas anteriores' },
  '103': { clave: '103', descripcion: 'Ajuste a deducciones por exceso al trabajador registradas en nóminas anteriores' },
  '104': { clave: '104', descripcion: 'Pérdida' },
  '105': { clave: '105', descripcion: 'Ausencias' },
  '106': { clave: '106', descripcion: 'Préstamos' },
  '107': { clave: '107', descripcion: 'Ajuste al Subsidio Causado' },
} as const;

export const SAT_OTROS_PAGOS = {
  '001': { clave: '001', descripcion: 'Reintegro de ISR pagado en exceso (siempre que no haya sido enterado al SAT)' },
  '002': { clave: '002', descripcion: 'Subsidio para el empleo (efectivamente entregado al trabajador)' },
  '003': { clave: '003', descripcion: 'Viáticos (entregados al trabajador)' },
  '004': { clave: '004', descripcion: 'Aplicación de saldo a favor por compensación anual' },
  '005': { clave: '005', descripcion: 'Reintegro de ISR retenido en exceso de ejercicio anterior (siempre que no haya sido enterado al SAT)' },
  '006': { clave: '006', descripcion: 'Alimentos en bienes (Exento de ISR)' },
  '007': { clave: '007', descripcion: 'ISR ajustado por subsidio' },
  '008': { clave: '008', descripcion: 'Subsidio efectivamente entregado que no correspondía (Aplica sólo cuando el Subs' },
  '009': { clave: '009', descripcion: 'Pago en especie' },
  '999': { clave: '999', descripcion: 'Pagos distintos a los listados y que no deben considerarse como ingreso por sueldos, salarios o ingresos asimilados' },
} as const;

// ===================== CONVERSORES DE PESOS =====================

export function bpToDisplay(bp: bigint): string {
  const pesos = bpToPesos(bp);
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(pesos);
}

export function displayToBp(display: string): bigint {
  const clean = display.replace(/[$,\s]/g, '');
  return pesosToBp(parseFloat(clean) || 0);
}
