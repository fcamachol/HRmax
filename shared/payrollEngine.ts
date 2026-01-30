/**
 * MOTOR DE NÓMINA NOMINAHUB - CLASE MUNDIAL
 * Superior a NOI con cumplimiento completo SAT/IMSS 2026
 *
 * Características:
 * - Cálculos con precisión de 4 decimales usando basis points
 * - Tablas fiscales 2026 completas (ISR, Subsidio, IMSS)
 * - Soporte para todas las periodicidades (diario, semanal, catorcenal, quincenal, mensual)
 * - Cumplimiento CFDI 4.0 con claves SAT
 * - Cálculos de SBC/SDI automáticos
 * - Horas extra con límites exentos y gravables
 * - Aguinaldo, vacaciones, prima vacacional
 * - PTU con límites de exención
 * - Finiquito y liquidación completos
 * - Auditoría con desglose de fórmulas
 *
 * ACTUALIZADO ENERO 2026:
 * - UMA 2026: $117.31 diario (vigente desde 1 Feb 2026)
 * - Salario Mínimo 2026: $315.04 general, $440.87 frontera
 * - Tablas ISR 2026: Factor actualización 1.13213 (DOF 28/12/2025)
 * - Subsidio al Empleo 2026: Cuota fija $536.22 mensual (15.02% UMA)
 * - Cuotas IMSS C&V 2026: Tasas progresivas (4to incremento reforma 2020)
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
  anio: number;
  uma: {
    diaria: number;
    mensual: number;
    anual: number;
    vigenciaDesde: string; // Fecha de inicio de vigencia
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

// Configuración 2025 (para enero 2026 y cálculos retroactivos)
export const CONFIG_FISCAL_2025: ConfiguracionFiscal = {
  anio: 2025,
  uma: {
    diaria: 113.14,
    mensual: 3439.46,
    anual: 41273.52,
    vigenciaDesde: '2025-02-01',
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

// Configuración 2026 (vigente desde 1 Ene 2026 para SMG, 1 Feb 2026 para UMA)
export const CONFIG_FISCAL_2026: ConfiguracionFiscal = {
  anio: 2026,
  uma: {
    diaria: 117.31,       // +3.69% vs 2025 (INEGI 8 Ene 2026)
    mensual: 3566.22,     // 117.31 × 30.4
    anual: 42794.64,      // 3566.22 × 12
    vigenciaDesde: '2026-02-01',
  },
  salarioMinimo: {
    general: 315.04,      // +13% vs 2025 (CONASAMI 3 Dic 2025)
    frontera: 440.87,     // +5% vs 2025
  },
  diasAnio: 365,
  aguinaldoMinimo: 15,
  primaVacacionalMinimo: 25,
  limiteSuperiorCotizacionUMAs: 25,
  factorintegracionMinimo: 1.0452,
};

// Alias para configuración actual (2026)
export type ConfiguracionFiscal2025 = ConfiguracionFiscal; // Compatibilidad

/**
 * Obtiene la configuración fiscal vigente para una fecha dada
 * @param fecha Fecha para determinar la configuración (default: hoy)
 * @returns Configuración fiscal vigente
 */
export function getConfiguracionFiscalVigente(fecha: Date = new Date()): ConfiguracionFiscal {
  const anio = fecha.getFullYear();
  const mes = fecha.getMonth() + 1;

  // 2026 o posterior
  if (anio >= 2026) {
    // En enero 2026, UMA sigue siendo 2025, pero SMG ya es 2026
    if (anio === 2026 && mes === 1) {
      return {
        ...CONFIG_FISCAL_2026,
        uma: CONFIG_FISCAL_2025.uma, // UMA 2025 en enero 2026
      };
    }
    return CONFIG_FISCAL_2026;
  }

  return CONFIG_FISCAL_2025;
}

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

// ===================== TABLAS ISR 2026 =====================

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

// TABLA ISR 2026 OFICIAL - Anexo 8 RMF 2026 DOF 28/12/2025
// Factor de actualización: 1.13213 (inflación acumulada Nov 2022 - Nov 2025 > 10%)
// Fuente: https://www.sat.gob.mx/minisitio/NormatividadRMFyRGCE/documentos2026/rmf/anexos/Anexo-8-RMF-2026_DOF-28122025.pdf
export const TABLAS_ISR_2026: Record<TipoPeriodo, TablaISR> = {
  mensual: {
    periodo: 'mensual',
    anio: 2026,
    tramos: [
      { limiteInferiorBp: pesosToBp(0.01), limiteSuperiorBp: pesosToBp(844.58), cuotaFijaBp: pesosToBp(0), tasaExcedenteBp: porcentajeToBp(1.92) },
      { limiteInferiorBp: pesosToBp(844.59), limiteSuperiorBp: pesosToBp(7168.45), cuotaFijaBp: pesosToBp(16.21), tasaExcedenteBp: porcentajeToBp(6.40) },
      { limiteInferiorBp: pesosToBp(7168.46), limiteSuperiorBp: pesosToBp(12598.85), cuotaFijaBp: pesosToBp(420.94), tasaExcedenteBp: porcentajeToBp(10.88) },
      { limiteInferiorBp: pesosToBp(12598.86), limiteSuperiorBp: pesosToBp(14645.07), cuotaFijaBp: pesosToBp(1011.51), tasaExcedenteBp: porcentajeToBp(16.00) },
      { limiteInferiorBp: pesosToBp(14645.08), limiteSuperiorBp: pesosToBp(17534.48), cuotaFijaBp: pesosToBp(1338.90), tasaExcedenteBp: porcentajeToBp(17.92) },
      { limiteInferiorBp: pesosToBp(17534.49), limiteSuperiorBp: pesosToBp(35367.89), cuotaFijaBp: pesosToBp(1856.61), tasaExcedenteBp: porcentajeToBp(21.36) },
      { limiteInferiorBp: pesosToBp(35367.90), limiteSuperiorBp: pesosToBp(55743.45), cuotaFijaBp: pesosToBp(5664.45), tasaExcedenteBp: porcentajeToBp(23.52) },
      { limiteInferiorBp: pesosToBp(55743.46), limiteSuperiorBp: pesosToBp(106404.70), cuotaFijaBp: pesosToBp(10456.75), tasaExcedenteBp: porcentajeToBp(30.00) },
      { limiteInferiorBp: pesosToBp(106404.71), limiteSuperiorBp: pesosToBp(141874.82), cuotaFijaBp: pesosToBp(25654.62), tasaExcedenteBp: porcentajeToBp(32.00) },
      { limiteInferiorBp: pesosToBp(141874.83), limiteSuperiorBp: pesosToBp(425624.45), cuotaFijaBp: pesosToBp(37005.01), tasaExcedenteBp: porcentajeToBp(34.00) },
      { limiteInferiorBp: pesosToBp(425624.46), limiteSuperiorBp: null, cuotaFijaBp: pesosToBp(133479.89), tasaExcedenteBp: porcentajeToBp(35.00) },
    ],
  },
  // Quincenal (DOF Anexo 8 RMF 2026)
  quincenal: {
    periodo: 'quincenal',
    anio: 2026,
    tramos: [
      { limiteInferiorBp: pesosToBp(0.01), limiteSuperiorBp: pesosToBp(422.29), cuotaFijaBp: pesosToBp(0), tasaExcedenteBp: porcentajeToBp(1.92) },
      { limiteInferiorBp: pesosToBp(422.30), limiteSuperiorBp: pesosToBp(3584.23), cuotaFijaBp: pesosToBp(8.11), tasaExcedenteBp: porcentajeToBp(6.40) },
      { limiteInferiorBp: pesosToBp(3584.24), limiteSuperiorBp: pesosToBp(6299.43), cuotaFijaBp: pesosToBp(210.47), tasaExcedenteBp: porcentajeToBp(10.88) },
      { limiteInferiorBp: pesosToBp(6299.44), limiteSuperiorBp: pesosToBp(7322.54), cuotaFijaBp: pesosToBp(505.76), tasaExcedenteBp: porcentajeToBp(16.00) },
      { limiteInferiorBp: pesosToBp(7322.55), limiteSuperiorBp: pesosToBp(8767.24), cuotaFijaBp: pesosToBp(669.45), tasaExcedenteBp: porcentajeToBp(17.92) },
      { limiteInferiorBp: pesosToBp(8767.25), limiteSuperiorBp: pesosToBp(17683.95), cuotaFijaBp: pesosToBp(928.31), tasaExcedenteBp: porcentajeToBp(21.36) },
      { limiteInferiorBp: pesosToBp(17683.96), limiteSuperiorBp: pesosToBp(27871.73), cuotaFijaBp: pesosToBp(2832.23), tasaExcedenteBp: porcentajeToBp(23.52) },
      { limiteInferiorBp: pesosToBp(27871.74), limiteSuperiorBp: pesosToBp(53202.35), cuotaFijaBp: pesosToBp(5228.38), tasaExcedenteBp: porcentajeToBp(30.00) },
      { limiteInferiorBp: pesosToBp(53202.36), limiteSuperiorBp: pesosToBp(70937.41), cuotaFijaBp: pesosToBp(12827.31), tasaExcedenteBp: porcentajeToBp(32.00) },
      { limiteInferiorBp: pesosToBp(70937.42), limiteSuperiorBp: pesosToBp(212812.23), cuotaFijaBp: pesosToBp(18502.51), tasaExcedenteBp: porcentajeToBp(34.00) },
      { limiteInferiorBp: pesosToBp(212812.24), limiteSuperiorBp: null, cuotaFijaBp: pesosToBp(66739.95), tasaExcedenteBp: porcentajeToBp(35.00) },
    ],
  },
  // Catorcenal (DOF Anexo 8 RMF 2026)
  catorcenal: {
    periodo: 'catorcenal',
    anio: 2026,
    tramos: [
      { limiteInferiorBp: pesosToBp(0.01), limiteSuperiorBp: pesosToBp(394.14), cuotaFijaBp: pesosToBp(0), tasaExcedenteBp: porcentajeToBp(1.92) },
      { limiteInferiorBp: pesosToBp(394.15), limiteSuperiorBp: pesosToBp(3345.28), cuotaFijaBp: pesosToBp(7.57), tasaExcedenteBp: porcentajeToBp(6.40) },
      { limiteInferiorBp: pesosToBp(3345.29), limiteSuperiorBp: pesosToBp(5879.46), cuotaFijaBp: pesosToBp(196.44), tasaExcedenteBp: porcentajeToBp(10.88) },
      { limiteInferiorBp: pesosToBp(5879.47), limiteSuperiorBp: pesosToBp(6834.37), cuotaFijaBp: pesosToBp(472.04), tasaExcedenteBp: porcentajeToBp(16.00) },
      { limiteInferiorBp: pesosToBp(6834.38), limiteSuperiorBp: pesosToBp(8182.76), cuotaFijaBp: pesosToBp(624.82), tasaExcedenteBp: porcentajeToBp(17.92) },
      { limiteInferiorBp: pesosToBp(8182.77), limiteSuperiorBp: pesosToBp(16505.02), cuotaFijaBp: pesosToBp(866.42), tasaExcedenteBp: porcentajeToBp(21.36) },
      { limiteInferiorBp: pesosToBp(16505.03), limiteSuperiorBp: pesosToBp(26013.61), cuotaFijaBp: pesosToBp(2643.41), tasaExcedenteBp: porcentajeToBp(23.52) },
      { limiteInferiorBp: pesosToBp(26013.62), limiteSuperiorBp: pesosToBp(49655.53), cuotaFijaBp: pesosToBp(4879.82), tasaExcedenteBp: porcentajeToBp(30.00) },
      { limiteInferiorBp: pesosToBp(49655.54), limiteSuperiorBp: pesosToBp(66208.25), cuotaFijaBp: pesosToBp(11972.16), tasaExcedenteBp: porcentajeToBp(32.00) },
      { limiteInferiorBp: pesosToBp(66208.26), limiteSuperiorBp: pesosToBp(198624.75), cuotaFijaBp: pesosToBp(17269.01), tasaExcedenteBp: porcentajeToBp(34.00) },
      { limiteInferiorBp: pesosToBp(198624.76), limiteSuperiorBp: null, cuotaFijaBp: pesosToBp(62290.62), tasaExcedenteBp: porcentajeToBp(35.00) },
    ],
  },
  // Semanal (DOF Anexo 8 RMF 2026)
  semanal: {
    periodo: 'semanal',
    anio: 2026,
    tramos: [
      { limiteInferiorBp: pesosToBp(0.01), limiteSuperiorBp: pesosToBp(197.07), cuotaFijaBp: pesosToBp(0), tasaExcedenteBp: porcentajeToBp(1.92) },
      { limiteInferiorBp: pesosToBp(197.08), limiteSuperiorBp: pesosToBp(1672.64), cuotaFijaBp: pesosToBp(3.78), tasaExcedenteBp: porcentajeToBp(6.40) },
      { limiteInferiorBp: pesosToBp(1672.65), limiteSuperiorBp: pesosToBp(2939.73), cuotaFijaBp: pesosToBp(98.22), tasaExcedenteBp: porcentajeToBp(10.88) },
      { limiteInferiorBp: pesosToBp(2939.74), limiteSuperiorBp: pesosToBp(3417.18), cuotaFijaBp: pesosToBp(236.02), tasaExcedenteBp: porcentajeToBp(16.00) },
      { limiteInferiorBp: pesosToBp(3417.19), limiteSuperiorBp: pesosToBp(4091.38), cuotaFijaBp: pesosToBp(312.41), tasaExcedenteBp: porcentajeToBp(17.92) },
      { limiteInferiorBp: pesosToBp(4091.39), limiteSuperiorBp: pesosToBp(8252.51), cuotaFijaBp: pesosToBp(433.21), tasaExcedenteBp: porcentajeToBp(21.36) },
      { limiteInferiorBp: pesosToBp(8252.52), limiteSuperiorBp: pesosToBp(13006.81), cuotaFijaBp: pesosToBp(1321.71), tasaExcedenteBp: porcentajeToBp(23.52) },
      { limiteInferiorBp: pesosToBp(13006.82), limiteSuperiorBp: pesosToBp(24827.76), cuotaFijaBp: pesosToBp(2439.91), tasaExcedenteBp: porcentajeToBp(30.00) },
      { limiteInferiorBp: pesosToBp(24827.77), limiteSuperiorBp: pesosToBp(33104.12), cuotaFijaBp: pesosToBp(5986.08), tasaExcedenteBp: porcentajeToBp(32.00) },
      { limiteInferiorBp: pesosToBp(33104.13), limiteSuperiorBp: pesosToBp(99312.37), cuotaFijaBp: pesosToBp(8634.51), tasaExcedenteBp: porcentajeToBp(34.00) },
      { limiteInferiorBp: pesosToBp(99312.38), limiteSuperiorBp: null, cuotaFijaBp: pesosToBp(31145.31), tasaExcedenteBp: porcentajeToBp(35.00) },
    ],
  },
  // Diario (DOF Anexo 8 RMF 2026)
  diario: {
    periodo: 'diario',
    anio: 2026,
    tramos: [
      { limiteInferiorBp: pesosToBp(0.01), limiteSuperiorBp: pesosToBp(28.15), cuotaFijaBp: pesosToBp(0), tasaExcedenteBp: porcentajeToBp(1.92) },
      { limiteInferiorBp: pesosToBp(28.16), limiteSuperiorBp: pesosToBp(238.95), cuotaFijaBp: pesosToBp(0.54), tasaExcedenteBp: porcentajeToBp(6.40) },
      { limiteInferiorBp: pesosToBp(238.96), limiteSuperiorBp: pesosToBp(419.96), cuotaFijaBp: pesosToBp(14.03), tasaExcedenteBp: porcentajeToBp(10.88) },
      { limiteInferiorBp: pesosToBp(419.97), limiteSuperiorBp: pesosToBp(488.17), cuotaFijaBp: pesosToBp(33.72), tasaExcedenteBp: porcentajeToBp(16.00) },
      { limiteInferiorBp: pesosToBp(488.18), limiteSuperiorBp: pesosToBp(584.48), cuotaFijaBp: pesosToBp(44.63), tasaExcedenteBp: porcentajeToBp(17.92) },
      { limiteInferiorBp: pesosToBp(584.49), limiteSuperiorBp: pesosToBp(1178.93), cuotaFijaBp: pesosToBp(61.89), tasaExcedenteBp: porcentajeToBp(21.36) },
      { limiteInferiorBp: pesosToBp(1178.94), limiteSuperiorBp: pesosToBp(1858.12), cuotaFijaBp: pesosToBp(188.82), tasaExcedenteBp: porcentajeToBp(23.52) },
      { limiteInferiorBp: pesosToBp(1858.13), limiteSuperiorBp: pesosToBp(3546.82), cuotaFijaBp: pesosToBp(348.56), tasaExcedenteBp: porcentajeToBp(30.00) },
      { limiteInferiorBp: pesosToBp(3546.83), limiteSuperiorBp: pesosToBp(4729.16), cuotaFijaBp: pesosToBp(855.15), tasaExcedenteBp: porcentajeToBp(32.00) },
      { limiteInferiorBp: pesosToBp(4729.17), limiteSuperiorBp: pesosToBp(14187.48), cuotaFijaBp: pesosToBp(1233.50), tasaExcedenteBp: porcentajeToBp(34.00) },
      { limiteInferiorBp: pesosToBp(14187.49), limiteSuperiorBp: null, cuotaFijaBp: pesosToBp(4449.33), tasaExcedenteBp: porcentajeToBp(35.00) },
    ],
  },
};

// TABLA ISR ANUAL 2026 - Para cálculo anual y ajustes (mensual × 12)
// Art. 152 LISR - Cálculo anual del impuesto
export const TABLA_ISR_ANUAL_2026: TablaISR = {
  periodo: 'mensual', // Usamos 'mensual' como tipo base pero los valores son anuales
  anio: 2026,
  tramos: [
    { limiteInferiorBp: pesosToBp(0.01), limiteSuperiorBp: pesosToBp(10134.96), cuotaFijaBp: pesosToBp(0), tasaExcedenteBp: porcentajeToBp(1.92) },
    { limiteInferiorBp: pesosToBp(10134.97), limiteSuperiorBp: pesosToBp(86021.40), cuotaFijaBp: pesosToBp(194.52), tasaExcedenteBp: porcentajeToBp(6.40) },
    { limiteInferiorBp: pesosToBp(86021.41), limiteSuperiorBp: pesosToBp(151186.20), cuotaFijaBp: pesosToBp(5051.28), tasaExcedenteBp: porcentajeToBp(10.88) },
    { limiteInferiorBp: pesosToBp(151186.21), limiteSuperiorBp: pesosToBp(175740.84), cuotaFijaBp: pesosToBp(12138.12), tasaExcedenteBp: porcentajeToBp(16.00) },
    { limiteInferiorBp: pesosToBp(175740.85), limiteSuperiorBp: pesosToBp(210413.76), cuotaFijaBp: pesosToBp(16066.80), tasaExcedenteBp: porcentajeToBp(17.92) },
    { limiteInferiorBp: pesosToBp(210413.77), limiteSuperiorBp: pesosToBp(424414.68), cuotaFijaBp: pesosToBp(22279.32), tasaExcedenteBp: porcentajeToBp(21.36) },
    { limiteInferiorBp: pesosToBp(424414.69), limiteSuperiorBp: pesosToBp(668921.40), cuotaFijaBp: pesosToBp(67973.40), tasaExcedenteBp: porcentajeToBp(23.52) },
    { limiteInferiorBp: pesosToBp(668921.41), limiteSuperiorBp: pesosToBp(1276856.40), cuotaFijaBp: pesosToBp(125481.00), tasaExcedenteBp: porcentajeToBp(30.00) },
    { limiteInferiorBp: pesosToBp(1276856.41), limiteSuperiorBp: pesosToBp(1702497.84), cuotaFijaBp: pesosToBp(307855.44), tasaExcedenteBp: porcentajeToBp(32.00) },
    { limiteInferiorBp: pesosToBp(1702497.85), limiteSuperiorBp: pesosToBp(5107493.40), cuotaFijaBp: pesosToBp(444060.12), tasaExcedenteBp: porcentajeToBp(34.00) },
    { limiteInferiorBp: pesosToBp(5107493.41), limiteSuperiorBp: null, cuotaFijaBp: pesosToBp(1601758.68), tasaExcedenteBp: porcentajeToBp(35.00) },
  ],
};

// Alias para compatibilidad (usar TABLAS_ISR_2026 internamente)
export const TABLAS_ISR_2025 = TABLAS_ISR_2026;

// ===================== SUBSIDIO AL EMPLEO 2026 =====================
// DOF 31/12/2025 - Actualización del subsidio para 2026
// Cuota fija: 15.02% de la UMA mensual
// Límite de ingresos: $11,492.66 mensuales
// Enero 2026 transitorio: 15.59% sobre UMA 2025

export interface ConfigSubsidio {
  anio: number;
  porcentajeUMA: number;           // Porcentaje de la UMA mensual
  limiteIngresoMensual: number;    // Límite de ingresos mensuales
  subsidioMensual: number;         // Monto mensual del subsidio
  limiteIngresoMensualBp: bigint;
  subsidioMensualBp: bigint;
}

// Configuración 2025 (para enero 2026)
export const CONFIG_SUBSIDIO_2025: ConfigSubsidio = {
  anio: 2025,
  porcentajeUMA: 13.8,
  limiteIngresoMensual: 10171.00,
  subsidioMensual: 475.00,
  limiteIngresoMensualBp: pesosToBp(10171.00),
  subsidioMensualBp: pesosToBp(475.00),
};

// Configuración 2026 (vigente desde 1 Feb 2026)
// DOF 31/12/2025: Subsidio = 15.02% de UMA mensual = 3566.22 × 0.1502 = $535.65 ≈ $536.22
export const CONFIG_SUBSIDIO_2026: ConfigSubsidio = {
  anio: 2026,
  porcentajeUMA: 15.02,
  limiteIngresoMensual: 11492.66,  // Actualizado DOF 31/12/2025
  subsidioMensual: 536.22,          // 3566.22 × 15.02%
  limiteIngresoMensualBp: pesosToBp(11492.66),
  subsidioMensualBp: pesosToBp(536.22),
};

// Días por periodo para conversiones
export const DIAS_PERIODO: Record<TipoPeriodo, number> = {
  mensual: 30.4,
  quincenal: 15,
  catorcenal: 14,
  semanal: 7,
  diario: 1,
};

// Factores de conversión por periodo (días / 30.4)
const FACTORES_PERIODO: Record<TipoPeriodo, number> = {
  mensual: 1,
  quincenal: 15 / 30.4,
  catorcenal: 14 / 30.4,
  semanal: 7 / 30.4,
  diario: 1 / 30.4,
};

/**
 * Obtiene la configuración de subsidio vigente para una fecha
 */
export function getConfigSubsidioVigente(fecha: Date = new Date()): ConfigSubsidio {
  const anio = fecha.getFullYear();
  const mes = fecha.getMonth() + 1;

  // Enero 2026 usa configuración especial (UMA 2025 con porcentaje 15.59%)
  if (anio === 2026 && mes === 1) {
    return {
      anio: 2026,
      porcentajeUMA: 15.59,
      limiteIngresoMensual: 11492.66,
      subsidioMensual: 536.21, // 113.14 × 15.59% × 30.4
      limiteIngresoMensualBp: pesosToBp(11492.66),
      subsidioMensualBp: pesosToBp(536.21),
    };
  }

  if (anio >= 2026) {
    return CONFIG_SUBSIDIO_2026;
  }

  return CONFIG_SUBSIDIO_2025;
}

/**
 * Calcula el subsidio al empleo 2026 según el esquema de cuota fija
 * @param ingresoGravableBp Ingreso gravable del periodo en basis points
 * @param periodo Tipo de periodo de nómina
 * @param fecha Fecha para determinar configuración vigente
 * @returns Subsidio aplicable en basis points
 */
export function calcularSubsidio2025(
  ingresoGravableBp: bigint,
  periodo: TipoPeriodo,
  fecha: Date = new Date()
): bigint {
  const config = getConfigSubsidioVigente(fecha);

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

// Alias para función 2026
export const calcularSubsidio2026 = calcularSubsidio2025;

// Montos de subsidio precalculados por periodo para 2026
export const SUBSIDIOS_POR_PERIODO_2026: Record<TipoPeriodo, { limiteBp: bigint; subsidioBp: bigint }> = {
  mensual: {
    limiteBp: CONFIG_SUBSIDIO_2026.limiteIngresoMensualBp,
    subsidioBp: CONFIG_SUBSIDIO_2026.subsidioMensualBp
  },
  quincenal: {
    limiteBp: pesosToBp(5671.38),   // 11492.66 × 15 / 30.4
    subsidioBp: pesosToBp(264.58)   // 536.22 × 15 / 30.4
  },
  catorcenal: {
    limiteBp: pesosToBp(5293.29),   // 11492.66 × 14 / 30.4
    subsidioBp: pesosToBp(246.94)   // 536.22 × 14 / 30.4
  },
  semanal: {
    limiteBp: pesosToBp(2646.64),   // 11492.66 × 7 / 30.4
    subsidioBp: pesosToBp(123.47)   // 536.22 × 7 / 30.4
  },
  diario: {
    limiteBp: pesosToBp(378.05),    // 11492.66 / 30.4
    subsidioBp: pesosToBp(17.64)    // 536.22 / 30.4
  },
};

// Alias para compatibilidad
export const SUBSIDIOS_POR_PERIODO_2025 = SUBSIDIOS_POR_PERIODO_2026;

// ===================== CUOTAS IMSS 2026 =====================

export interface CuotaIMSS {
  ramo: string;
  concepto: string;
  patronTasaBp: number;
  trabajadorTasaBp: number;
  baseCalculo: 'sbc' | 'excedente_3uma' | 'uma_fijo';
  aplicaTopeCotizacion: boolean;
}

// Cuotas IMSS 2026 (SIN Cesantía y Vejez - esa se calcula aparte por ser progresiva)
export const CUOTAS_IMSS_2026: CuotaIMSS[] = [
  { ramo: 'Enfermedades y Maternidad', concepto: 'Cuota Fija (hasta 3 UMA)', patronTasaBp: porcentajeToBp(20.40), trabajadorTasaBp: 0, baseCalculo: 'uma_fijo', aplicaTopeCotizacion: false },
  { ramo: 'Enfermedades y Maternidad', concepto: 'Excedente 3 UMAs - Prestaciones en Especie', patronTasaBp: porcentajeToBp(1.10), trabajadorTasaBp: porcentajeToBp(0.40), baseCalculo: 'excedente_3uma', aplicaTopeCotizacion: true },
  { ramo: 'Enfermedades y Maternidad', concepto: 'Prestaciones en Dinero', patronTasaBp: porcentajeToBp(0.70), trabajadorTasaBp: porcentajeToBp(0.25), baseCalculo: 'sbc', aplicaTopeCotizacion: true },
  { ramo: 'Enfermedades y Maternidad', concepto: 'Gastos Médicos Pensionados', patronTasaBp: porcentajeToBp(1.05), trabajadorTasaBp: porcentajeToBp(0.375), baseCalculo: 'sbc', aplicaTopeCotizacion: true },
  { ramo: 'Invalidez y Vida', concepto: 'Invalidez y Vida', patronTasaBp: porcentajeToBp(1.75), trabajadorTasaBp: porcentajeToBp(0.625), baseCalculo: 'sbc', aplicaTopeCotizacion: true },
  { ramo: 'Riesgos de Trabajo', concepto: 'Riesgos de Trabajo (Prima Media)', patronTasaBp: porcentajeToBp(0.54355), trabajadorTasaBp: 0, baseCalculo: 'sbc', aplicaTopeCotizacion: true },
  { ramo: 'Guarderías y Prestaciones Sociales', concepto: 'Guarderías', patronTasaBp: porcentajeToBp(1.00), trabajadorTasaBp: 0, baseCalculo: 'sbc', aplicaTopeCotizacion: true },
  { ramo: 'Retiro', concepto: 'Retiro', patronTasaBp: porcentajeToBp(2.00), trabajadorTasaBp: 0, baseCalculo: 'sbc', aplicaTopeCotizacion: true },
  { ramo: 'INFONAVIT', concepto: 'Aportación Vivienda', patronTasaBp: porcentajeToBp(5.00), trabajadorTasaBp: 0, baseCalculo: 'sbc', aplicaTopeCotizacion: true },
];

// Alias para compatibilidad
export const CUOTAS_IMSS_2025 = CUOTAS_IMSS_2026;

// ===================== CESANTÍA Y VEJEZ 2026 - TASAS PROGRESIVAS =====================
// Reforma de pensiones 2020 (DOF 16/12/2020): Incremento gradual hasta 2030
// 2026 = Cuarto año de incremento

export interface TasaCesantiaVejez {
  rangoDescripcion: string;
  limiteInferiorUMA: number;
  limiteSuperiorUMA: number | null;
  patronTasaBp: number;       // Progresiva según rango
  trabajadorTasaBp: number;   // Fija 1.125%
}

// Tasas Cesantía y Vejez 2026 - Cuarto incremento reforma 2020
// NOTA: Los rangos se comparan contra UMA (Art. Décimo Transitorio, DOF 16/12/2020)
export const TASAS_CESANTIA_VEJEZ_2026: TasaCesantiaVejez[] = [
  { rangoDescripcion: 'Hasta 1.00 UMA', limiteInferiorUMA: 0, limiteSuperiorUMA: 1.00, patronTasaBp: porcentajeToBp(3.150), trabajadorTasaBp: porcentajeToBp(1.125) },
  { rangoDescripcion: '1.01 - 1.50 UMA', limiteInferiorUMA: 1.01, limiteSuperiorUMA: 1.50, patronTasaBp: porcentajeToBp(3.680), trabajadorTasaBp: porcentajeToBp(1.125) },
  { rangoDescripcion: '1.51 - 2.00 UMA', limiteInferiorUMA: 1.51, limiteSuperiorUMA: 2.00, patronTasaBp: porcentajeToBp(4.850), trabajadorTasaBp: porcentajeToBp(1.125) },
  { rangoDescripcion: '2.01 - 2.50 UMA', limiteInferiorUMA: 2.01, limiteSuperiorUMA: 2.50, patronTasaBp: porcentajeToBp(5.560), trabajadorTasaBp: porcentajeToBp(1.125) },
  { rangoDescripcion: '2.51 - 3.00 UMA', limiteInferiorUMA: 2.51, limiteSuperiorUMA: 3.00, patronTasaBp: porcentajeToBp(6.030), trabajadorTasaBp: porcentajeToBp(1.125) },
  { rangoDescripcion: '3.01 - 3.50 UMA', limiteInferiorUMA: 3.01, limiteSuperiorUMA: 3.50, patronTasaBp: porcentajeToBp(6.360), trabajadorTasaBp: porcentajeToBp(1.125) },
  { rangoDescripcion: '3.51 - 4.00 UMA', limiteInferiorUMA: 3.51, limiteSuperiorUMA: 4.00, patronTasaBp: porcentajeToBp(6.610), trabajadorTasaBp: porcentajeToBp(1.125) },
  { rangoDescripcion: '4.01+ UMA', limiteInferiorUMA: 4.01, limiteSuperiorUMA: null, patronTasaBp: porcentajeToBp(7.510), trabajadorTasaBp: porcentajeToBp(1.125) },
];

// Cuota obrera FIJA de Cesantía y Vejez (Art. 168 LSS)
// NOTA: 1.125% = 112.5 basis points (decimal, no entero)
// Para cálculos exactos usar: (monto * 1125) / 100000
// El valor 112.5 se usa para display, el cálculo real debe ser con la fórmula de arriba
export const CESANTIA_VEJEZ_OBRERO_TASA_BP = 112.5; // 1.125% exacto
export const CESANTIA_VEJEZ_OBRERO_TASA_PORCENTAJE = 1.125;

/**
 * Obtiene la tasa patronal de Cesantía y Vejez según el SBC del trabajador
 * @param sbcDiario SBC diario del trabajador
 * @param umaDiaria UMA diaria vigente
 * @returns Tasa patronal en basis points y descripción del rango
 */
export function getTasaCesantiaVejezPatronal(
  sbcDiario: number,
  umaDiaria: number = CONFIG_FISCAL_2026.uma.diaria
): { tasaBp: number; rangoDescripcion: string } {
  const ratioSbcUma = sbcDiario / umaDiaria;

  for (const tasa of TASAS_CESANTIA_VEJEZ_2026) {
    const limInf = tasa.limiteInferiorUMA;
    const limSup = tasa.limiteSuperiorUMA ?? Infinity;

    if (ratioSbcUma >= limInf && ratioSbcUma <= limSup) {
      return {
        tasaBp: tasa.patronTasaBp,
        rangoDescripcion: tasa.rangoDescripcion,
      };
    }
  }

  // Fallback al rango más alto
  const ultimoRango = TASAS_CESANTIA_VEJEZ_2026[TASAS_CESANTIA_VEJEZ_2026.length - 1];
  return {
    tasaBp: ultimoRango.patronTasaBp,
    rangoDescripcion: ultimoRango.rangoDescripcion,
  };
}

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
    // Renuncia voluntaria con 15+ años: Prima de Antigüedad aplica (Art. 162 LFT)
    const salarioBasePrimaAntiguedad = minBp(salarioDiarioBp, multiplicarBpPorTasa(pesosToBp(CONFIG_FISCAL_2025.salarioMinimo.general), 20000));
    const primaAntiguedadBp = multiplicarBpPorTasa(salarioBasePrimaAntiguedad, aniosCompletos * 120000);
    conceptos.push({
      concepto: `Prima de Antigüedad (12 días × ${aniosCompletos} años)`,
      dias: 12 * aniosCompletos,
      montoBp: primaAntiguedadBp,
      exentoBp: primaAntiguedadBp,
      gravadoBp: BigInt(0),
    });
  } else if (tipoSeparacion === 'muerte' && aniosCompletos > 0) {
    // Muerte del trabajador: Prima de Antigüedad aplica sin importar antigüedad (Art. 162 fracc. III LFT)
    const salarioBasePrimaAntiguedad = minBp(salarioDiarioBp, multiplicarBpPorTasa(pesosToBp(CONFIG_FISCAL_2025.salarioMinimo.general), 20000));
    const primaAntiguedadBp = multiplicarBpPorTasa(salarioBasePrimaAntiguedad, aniosCompletos * 120000);
    conceptos.push({
      concepto: `Prima de Antigüedad por Defunción (12 días × ${aniosCompletos} años)`,
      dias: 12 * aniosCompletos,
      montoBp: primaAntiguedadBp,
      exentoBp: primaAntiguedadBp, // Exento por ser pago por muerte (Art. 93 fracc. XIII LISR)
      gravadoBp: BigInt(0),
    });
  } else if (tipoSeparacion === 'incapacidad_permanente' && aniosCompletos > 0) {
    // Incapacidad permanente: Prima de Antigüedad aplica sin importar antigüedad (Art. 162 fracc. III LFT)
    const salarioBasePrimaAntiguedad = minBp(salarioDiarioBp, multiplicarBpPorTasa(pesosToBp(CONFIG_FISCAL_2025.salarioMinimo.general), 20000));
    const primaAntiguedadBp = multiplicarBpPorTasa(salarioBasePrimaAntiguedad, aniosCompletos * 120000);
    conceptos.push({
      concepto: `Prima de Antigüedad por Incapacidad Permanente (12 días × ${aniosCompletos} años)`,
      dias: 12 * aniosCompletos,
      montoBp: primaAntiguedadBp,
      exentoBp: primaAntiguedadBp, // Exento por incapacidad permanente (Art. 93 fracc. IV LISR)
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

// ===================== CÁLCULO ANUAL DE ISR (Art. 97 LISR) =====================

export interface ResultadoAjusteAnualISR {
  ingresoGravableAnual: number;
  isrAnualCalculado: number;
  isrRetenidoTotal: number;
  subsidioAplicadoAnual: number;
  diferencia: number;
  tipoAjuste: 'a_favor' | 'a_cargo' | 'sin_ajuste';
  subsidioNoAplicado: number;
  desglose: {
    tramoAplicado: number;
    baseExcedente: number;
    isrExcedente: number;
    cuotaFija: number;
  };
}

/**
 * Calcula el ajuste anual de ISR según Art. 97 LISR
 *
 * NOI Methodology:
 * 1. Suma todos los ingresos gravables del año
 * 2. Calcula ISR usando tabla anual
 * 3. Compara con ISR retenido durante el año
 * 4. Genera ajuste (a favor = devolución, a cargo = retención adicional)
 *
 * @param ingresoGravableAnual Total de ingresos gravables del año
 * @param isrRetenidoAnual Total de ISR retenido durante el año
 * @param subsidioAplicadoAnual Total de subsidio aplicado durante el año
 * @returns Resultado del ajuste anual
 */
export function calcularAjusteAnualISR(
  ingresoGravableAnual: number,
  isrRetenidoAnual: number,
  subsidioAplicadoAnual: number
): ResultadoAjusteAnualISR {
  const ingresoGravableBp = pesosToBp(ingresoGravableAnual);

  // Calcular ISR anual usando tabla anual
  let tramoAplicado = 0;
  let isrAnualBp = BigInt(0);
  let baseExcedenteBp = BigInt(0);
  let isrExcedenteBp = BigInt(0);
  let cuotaFijaBp = BigInt(0);

  for (let i = 0; i < TABLA_ISR_ANUAL_2026.tramos.length; i++) {
    const tramo = TABLA_ISR_ANUAL_2026.tramos[i];
    const enTramo = compararBp(ingresoGravableBp, tramo.limiteInferiorBp) >= 0 &&
      (tramo.limiteSuperiorBp === null || compararBp(ingresoGravableBp, tramo.limiteSuperiorBp) <= 0);

    if (enTramo) {
      tramoAplicado = i + 1;
      baseExcedenteBp = restarBp(ingresoGravableBp, tramo.limiteInferiorBp);
      isrExcedenteBp = multiplicarBpPorTasa(baseExcedenteBp, tramo.tasaExcedenteBp);
      cuotaFijaBp = tramo.cuotaFijaBp;
      isrAnualBp = sumarBp(isrExcedenteBp, tramo.cuotaFijaBp);
      break;
    }
  }

  const isrAnualCalculado = bpToPesos(isrAnualBp);

  // Calcular subsidio anual aplicable (límite mensual × 12)
  // NOTA 2025+: El subsidio máximo anual es $6,434.64 (536.22 × 12)
  const subsidioAnualMaximo = CONFIG_SUBSIDIO_2026.subsidioMensual * 12;
  const subsidioAplicable = Math.min(subsidioAplicadoAnual, subsidioAnualMaximo);

  // El ISR neto anual es ISR calculado - subsidio aplicado (no puede ser negativo post-2025)
  const isrNetoAnual = Math.max(0, isrAnualCalculado - subsidioAplicable);

  // Diferencia = ISR que debió retener - ISR que retuvo
  const diferencia = isrNetoAnual - isrRetenidoAnual;

  // Subsidio no aplicado (cuando subsidio > ISR)
  const subsidioNoAplicado = subsidioAplicable > isrAnualCalculado
    ? subsidioAplicable - isrAnualCalculado
    : 0;

  // Determinar tipo de ajuste
  let tipoAjuste: 'a_favor' | 'a_cargo' | 'sin_ajuste';
  if (Math.abs(diferencia) < 1) { // Tolerancia de $1
    tipoAjuste = 'sin_ajuste';
  } else if (diferencia > 0) {
    tipoAjuste = 'a_cargo'; // Trabajador debe al patrón
  } else {
    tipoAjuste = 'a_favor'; // Patrón debe al trabajador
  }

  return {
    ingresoGravableAnual,
    isrAnualCalculado,
    isrRetenidoTotal: isrRetenidoAnual,
    subsidioAplicadoAnual: subsidioAplicable,
    diferencia: Math.round(diferencia * 100) / 100,
    tipoAjuste,
    subsidioNoAplicado: Math.round(subsidioNoAplicado * 100) / 100,
    desglose: {
      tramoAplicado,
      baseExcedente: bpToPesos(baseExcedenteBp),
      isrExcedente: bpToPesos(isrExcedenteBp),
      cuotaFija: bpToPesos(cuotaFijaBp),
    },
  };
}

// ===================== ISR PARA PAGOS EXTRAORDINARIOS (Art. 96 LISR) =====================

export interface ResultadoISRExtraordinario {
  pagoExtraordinario: number;
  promedioMensualOrdinario: number;
  isrExtraordinarioBp: bigint;
  isrExtraordinario: number;
  tasaEfectiva: number;
  metodologia: string;
  desglose: {
    ingresoMensualConExtra: number;
    isrMensualConExtra: number;
    isrMensualSinExtra: number;
    diferenciaIsrMensual: number;
    factorMultiplicador: number;
  };
}

/**
 * Calcula ISR para pagos extraordinarios usando método de promedio (Art. 96 LISR)
 *
 * NOI usa este método para: Aguinaldo, PTU, Prima Vacacional, Bonos
 *
 * Método:
 * 1. Calcula promedio mensual de ingresos ordinarios (últimos 12 meses o YTD)
 * 2. Suma 1/12 del pago extraordinario al promedio mensual
 * 3. Calcula ISR mensual sobre el monto combinado
 * 4. Resta ISR mensual sobre el promedio solo
 * 5. Multiplica la diferencia por 12 para obtener ISR anual sobre el extraordinario
 *
 * @param pagoExtraordinario Monto del pago extraordinario
 * @param promedioMensualOrdinario Promedio mensual de ingresos ordinarios
 * @returns Resultado del cálculo de ISR extraordinario
 */
export function calcularISRExtraordinario(
  pagoExtraordinario: number,
  promedioMensualOrdinario: number
): ResultadoISRExtraordinario {
  const pagoExtraordinarioBp = pesosToBp(pagoExtraordinario);
  const promedioOrdinarioBp = pesosToBp(promedioMensualOrdinario);

  // Paso 1: Dividir el pago extraordinario entre 12 para obtener el incremento mensual
  const incrementoMensualBp = dividirBp(pagoExtraordinarioBp, 12);

  // Paso 2: Sumar el incremento al promedio mensual ordinario
  const ingresoMensualConExtraBp = sumarBp(promedioOrdinarioBp, incrementoMensualBp);

  // Paso 3: Calcular ISR sobre ingreso mensual CON el extraordinario
  const isrConExtra = calcularISR(ingresoMensualConExtraBp, 'mensual');

  // Paso 4: Calcular ISR sobre ingreso mensual SIN el extraordinario
  const isrSinExtra = calcularISR(promedioOrdinarioBp, 'mensual');

  // Paso 5: La diferencia de ISR mensual representa el ISR marginal por el extraordinario
  const diferenciaIsrMensualBp = restarBp(isrConExtra.isrBp, isrSinExtra.isrBp);

  // Paso 6: Multiplicar por 12 para obtener el ISR total sobre el extraordinario
  // NOTA: Usamos el resultado antes del subsidio porque el subsidio se aplica globalmente
  const isrExtraordinarioBp = multiplicarBpPorTasa(diferenciaIsrMensualBp, 120000); // × 12

  // Calcular tasa efectiva
  const isrExtraordinario = bpToPesos(isrExtraordinarioBp);
  const tasaEfectiva = pagoExtraordinario > 0
    ? (isrExtraordinario / pagoExtraordinario) * 100
    : 0;

  return {
    pagoExtraordinario,
    promedioMensualOrdinario,
    isrExtraordinarioBp,
    isrExtraordinario: Math.round(isrExtraordinario * 100) / 100,
    tasaEfectiva: Math.round(tasaEfectiva * 100) / 100,
    metodologia: 'Art. 96 LISR - Método de promedio (NOI compatible)',
    desglose: {
      ingresoMensualConExtra: bpToPesos(ingresoMensualConExtraBp),
      isrMensualConExtra: bpToPesos(isrConExtra.isrBp),
      isrMensualSinExtra: bpToPesos(isrSinExtra.isrBp),
      diferenciaIsrMensual: bpToPesos(diferenciaIsrMensualBp),
      factorMultiplicador: 12,
    },
  };
}

/**
 * Calcula ISR para aguinaldo usando el método de Art. 96 LISR
 *
 * @param aguinaldoGravado Parte gravada del aguinaldo (después de exención 30 UMAs)
 * @param promedioMensualOrdinario Promedio mensual de ingresos ordinarios del año
 * @returns ISR a retener sobre el aguinaldo
 */
export function calcularISRAguinaldo(
  aguinaldoGravado: number,
  promedioMensualOrdinario: number
): { isrAguinaldo: number; tasaEfectiva: number; metodologia: string } {
  if (aguinaldoGravado <= 0) {
    return {
      isrAguinaldo: 0,
      tasaEfectiva: 0,
      metodologia: 'Aguinaldo 100% exento (≤ 30 UMAs)',
    };
  }

  const resultado = calcularISRExtraordinario(aguinaldoGravado, promedioMensualOrdinario);

  return {
    isrAguinaldo: resultado.isrExtraordinario,
    tasaEfectiva: resultado.tasaEfectiva,
    metodologia: resultado.metodologia,
  };
}

/**
 * Calcula ISR para PTU usando el método de Art. 96 LISR
 *
 * @param ptuGravado Parte gravada del PTU (después de exención 15 UMAs)
 * @param promedioMensualOrdinario Promedio mensual de ingresos ordinarios
 * @returns ISR a retener sobre el PTU
 */
export function calcularISRPtu(
  ptuGravado: number,
  promedioMensualOrdinario: number
): { isrPtu: number; tasaEfectiva: number; metodologia: string } {
  if (ptuGravado <= 0) {
    return {
      isrPtu: 0,
      tasaEfectiva: 0,
      metodologia: 'PTU 100% exento (≤ 15 UMAs)',
    };
  }

  const resultado = calcularISRExtraordinario(ptuGravado, promedioMensualOrdinario);

  return {
    isrPtu: resultado.isrExtraordinario,
    tasaEfectiva: resultado.tasaEfectiva,
    metodologia: resultado.metodologia,
  };
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
