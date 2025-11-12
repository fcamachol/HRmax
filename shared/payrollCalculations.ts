/**
 * Cálculos de Nómina para México
 * 
 * Este módulo implementa los cálculos de nómina según la legislación fiscal mexicana:
 * - ISR (Impuesto Sobre la Renta)
 * - Subsidio al Empleo
 * - IMSS (Instituto Mexicano del Seguro Social)
 * - SDI (Salario Diario Integrado)
 * - SBC (Salario Base de Cotización)
 * - Horas Extra
 * 
 * Todos los cálculos usan basis points (1 peso = 10,000 bp) para precisión de 4 decimales.
 */

import {
  pesosToBp,
  bpToPesos,
  porcentajeToBp,
  sumarBp,
  restarBp,
  multiplicarBpPorTasa,
  dividirBp,
} from './basisPoints';

/**
 * Periodos de pago soportados
 */
export type PeriodoPago = 
  | 'diario'
  | 'semanal'
  | 'decenal'
  | 'quincenal'
  | 'mensual';

/**
 * Fila de la tabla de ISR
 */
export interface TablaISR {
  limite_inferior_bp: bigint;
  limite_superior_bp: bigint;
  cuota_fija_bp: bigint;
  porcentaje_excedente_bp: number; // tasa como bp integer (fits in number)
}

/**
 * Fila de la tabla de Subsidio al Empleo
 */
export interface TablaSubsidio {
  limite_inferior_bp: bigint;
  limite_superior_bp: bigint;
  subsidio_bp: bigint; // monto monetario
}

/**
 * Configuración de cuotas IMSS
 */
export interface CuotaIMSS {
  ramo: string;
  tipo: 'obrero' | 'patronal';
  tasa_bp: number; // tasa como bp integer (fits in number)
  aplica_uma: boolean;
  topado: boolean;
}

/**
 * Configuración general del IMSS
 */
export interface ConfigIMSS {
  uma_diaria_bp: bigint; // monto monetario
  uma_mensual_bp: bigint; // monto monetario
  uma_anual_bp: bigint; // monto monetario
  salario_minimo_diario_bp: bigint; // monto monetario
  tope_sbc_uma: number; // múltiplo de UMA (simple number)
}

/**
 * Resultado del cálculo de ISR
 */
export interface ResultadoISR {
  ingreso_gravable_bp: bigint;
  limite_inferior_bp: bigint;
  excedente_bp: bigint;
  cuota_fija_bp: bigint;
  impuesto_marginal_bp: bigint;
  isr_antes_subsidio_bp: bigint;
  subsidio_bp: bigint;
  isr_final_bp: bigint;
  tasa_efectiva_bp: bigint; // como porcentaje en bp
}

/**
 * Resultado del cálculo de IMSS
 */
export interface ResultadoIMSS {
  sbc_bp: bigint;
  cuotas_obrero: Array<{
    ramo: string;
    base_bp: bigint;
    tasa_bp: number; // tasa como bp integer
    monto_bp: bigint;
  }>;
  cuotas_patronal: Array<{
    ramo: string;
    base_bp: bigint;
    tasa_bp: number; // tasa como bp integer
    monto_bp: bigint;
  }>;
  total_obrero_bp: bigint;
  total_patronal_bp: bigint;
  total_bp: bigint;
}

/**
 * Resultado del cálculo de Horas Extra
 */
export interface ResultadoHorasExtra {
  horas_dobles: number;
  horas_triples: number;
  monto_dobles_bp: bigint;
  monto_triples_bp: bigint;
  total_bp: bigint;
  gravado_bp: bigint;
  exento_bp: bigint;
}

/**
 * Encuentra la fila correcta en la tabla de ISR para un ingreso dado
 */
function encontrarFilaISR(ingreso_bp: bigint, tabla: TablaISR[]): TablaISR | null {
  for (const fila of tabla) {
    if (ingreso_bp >= fila.limite_inferior_bp && ingreso_bp <= fila.limite_superior_bp) {
      return fila;
    }
  }
  return null;
}

/**
 * Encuentra la fila correcta en la tabla de Subsidio para un ingreso dado
 */
function encontrarFilaSubsidio(ingreso_bp: bigint, tabla: TablaSubsidio[]): TablaSubsidio | null {
  for (const fila of tabla) {
    if (ingreso_bp >= fila.limite_inferior_bp && ingreso_bp <= fila.limite_superior_bp) {
      return fila;
    }
  }
  return null;
}

/**
 * Calcula ISR según las tablas del SAT para el periodo especificado
 * 
 * @param ingreso_gravable_bp - Ingreso gravable en basis points
 * @param tabla_isr - Tabla de ISR del periodo correspondiente
 * @param tabla_subsidio - Tabla de Subsidio del periodo correspondiente
 * @returns Resultado del cálculo de ISR con subsidio aplicado
 */
export function calcularISR(
  ingreso_gravable_bp: bigint,
  tabla_isr: TablaISR[],
  tabla_subsidio: TablaSubsidio[]
): ResultadoISR {
  if (ingreso_gravable_bp <= BigInt(0)) {
    return {
      ingreso_gravable_bp: BigInt(0),
      limite_inferior_bp: BigInt(0),
      excedente_bp: BigInt(0),
      cuota_fija_bp: BigInt(0),
      impuesto_marginal_bp: BigInt(0),
      isr_antes_subsidio_bp: BigInt(0),
      subsidio_bp: BigInt(0),
      isr_final_bp: BigInt(0),
      tasa_efectiva_bp: BigInt(0),
    };
  }

  const fila_isr = encontrarFilaISR(ingreso_gravable_bp, tabla_isr);
  if (!fila_isr) {
    throw new Error(`No se encontró fila en tabla ISR para ingreso: ${bpToPesos(ingreso_gravable_bp)}`);
  }

  // Calcular excedente sobre límite inferior
  const excedente_bp = restarBp(ingreso_gravable_bp, fila_isr.limite_inferior_bp);

  // Calcular impuesto marginal: excedente * porcentaje_excedente
  const impuesto_marginal_bp = multiplicarBpPorTasa(excedente_bp, fila_isr.porcentaje_excedente_bp);

  // ISR antes de subsidio = cuota_fija + impuesto_marginal
  const isr_antes_subsidio_bp = sumarBp(fila_isr.cuota_fija_bp, impuesto_marginal_bp);

  // Calcular subsidio al empleo
  const fila_subsidio = encontrarFilaSubsidio(ingreso_gravable_bp, tabla_subsidio);
  const subsidio_bp = fila_subsidio ? fila_subsidio.subsidio_bp : BigInt(0);

  // ISR final = ISR - Subsidio (no puede ser negativo)
  let isr_final_bp = restarBp(isr_antes_subsidio_bp, subsidio_bp);
  if (isr_final_bp < BigInt(0)) {
    isr_final_bp = BigInt(0);
  }

  // Calcular tasa efectiva: (ISR / Ingreso) * 100 (como porcentaje en bp)
  // Mantener todo en bigint para evitar pérdida de precisión
  let tasa_efectiva_bp = BigInt(0);
  if (ingreso_gravable_bp > BigInt(0)) {
    // (ISR * 100 * 10000) / Ingreso = porcentaje en bp
    tasa_efectiva_bp = (isr_final_bp * BigInt(100 * 10000)) / ingreso_gravable_bp;
  }

  return {
    ingreso_gravable_bp,
    limite_inferior_bp: fila_isr.limite_inferior_bp,
    excedente_bp,
    cuota_fija_bp: fila_isr.cuota_fija_bp,
    impuesto_marginal_bp,
    isr_antes_subsidio_bp,
    subsidio_bp,
    isr_final_bp,
    tasa_efectiva_bp,
  };
}

/**
 * Calcula Subsidio al Empleo
 * 
 * @param ingreso_gravable_bp - Ingreso gravable en basis points
 * @param tabla_subsidio - Tabla de Subsidio del periodo correspondiente
 * @returns Monto del subsidio en basis points
 */
export function calcularSubsidio(
  ingreso_gravable_bp: bigint,
  tabla_subsidio: TablaSubsidio[]
): bigint {
  if (ingreso_gravable_bp <= BigInt(0)) {
    return BigInt(0);
  }

  const fila = encontrarFilaSubsidio(ingreso_gravable_bp, tabla_subsidio);
  return fila ? fila.subsidio_bp : BigInt(0);
}

/**
 * Calcula Salario Diario Integrado (SDI)
 * 
 * SDI = Salario Diario + (Aguinaldo/365.25) + (Prima Vacacional/365.25) + (Otras prestaciones/365.25)
 * 
 * @param salario_diario_bp - Salario diario en basis points
 * @param dias_aguinaldo - Días de aguinaldo al año (mínimo 15)
 * @param dias_vacaciones - Días de vacaciones
 * @param porcentaje_prima_vacacional_bp - Porcentaje de prima vacacional en bp (25% = 2500 bp)
 * @param otras_prestaciones_anuales_bp - Otras prestaciones anuales en bp
 * @returns SDI en basis points
 */
export function calcularSDI(
  salario_diario_bp: bigint,
  dias_aguinaldo: number = 15,
  dias_vacaciones: number = 12,
  porcentaje_prima_vacacional_bp: number = porcentajeToBp(25), // 25% en bp
  otras_prestaciones_anuales_bp: bigint = BigInt(0)
): bigint {
  // Para dividir por 365.25 (fracción), convertir a bp y usar division entera
  const dias_anio_bp = BigInt(Math.trunc(365.25 * 10000)); // 365.25 en bp = 3,652,500

  // Aguinaldo diario = (Salario * Días Aguinaldo) / 365.25
  const aguinaldo_anual_bp = salario_diario_bp * BigInt(dias_aguinaldo);
  const aguinaldo_diario_bp = (aguinaldo_anual_bp * BigInt(10000)) / dias_anio_bp;

  // Prima vacacional diaria = (Salario * Días Vacaciones * Prima%) / 365.25
  const vacaciones_bp = salario_diario_bp * BigInt(dias_vacaciones);
  const prima_vacacional_anual_bp = multiplicarBpPorTasa(vacaciones_bp, porcentaje_prima_vacacional_bp);
  const prima_vacacional_diaria_bp = (prima_vacacional_anual_bp * BigInt(10000)) / dias_anio_bp;

  // Otras prestaciones diarias
  const otras_prestaciones_diarias_bp = (otras_prestaciones_anuales_bp * BigInt(10000)) / dias_anio_bp;

  // SDI = Salario + Aguinaldo Diario + Prima Vacacional Diaria + Otras
  let sdi_bp = salario_diario_bp;
  sdi_bp = sumarBp(sdi_bp, aguinaldo_diario_bp);
  sdi_bp = sumarBp(sdi_bp, prima_vacacional_diaria_bp);
  sdi_bp = sumarBp(sdi_bp, otras_prestaciones_diarias_bp);

  return sdi_bp;
}

/**
 * Calcula Salario Base de Cotización (SBC) limitado por topes del IMSS
 * 
 * SBC = min(SDI, UMA * Tope)
 * 
 * @param sdi_bp - Salario Diario Integrado en basis points
 * @param config_imss - Configuración del IMSS con UMA y topes
 * @returns SBC en basis points (topado según IMSS)
 */
export function calcularSBC(
  sdi_bp: bigint,
  config_imss: ConfigIMSS
): bigint {
  // Tope SBC = UMA diaria * tope_sbc_uma (mantener precisión con bp)
  // tope_sbc_uma es number (ej. 25 o 25.5), convertir a bp y multiplicar
  const tope_factor_bp = BigInt(Math.trunc(config_imss.tope_sbc_uma * 10000));
  const tope_sbc_bp = (config_imss.uma_diaria_bp * tope_factor_bp) / BigInt(10000);

  // SBC = min(SDI, Tope)
  return sdi_bp > tope_sbc_bp ? tope_sbc_bp : sdi_bp;
}

/**
 * Calcula cuotas del IMSS (obrero y patronal)
 * 
 * @param sbc_bp - Salario Base de Cotización en basis points
 * @param cuotas_imss - Configuración de cuotas IMSS
 * @param config_imss - Configuración general IMSS
 * @returns Resultado con desglose de cuotas obrero y patronal
 */
export function calcularIMSS(
  sbc_bp: bigint,
  cuotas_imss: CuotaIMSS[],
  config_imss: ConfigIMSS
): ResultadoIMSS {
  const cuotas_obrero: Array<{
    ramo: string;
    base_bp: bigint;
    tasa_bp: number;
    monto_bp: bigint;
  }> = [];

  const cuotas_patronal: Array<{
    ramo: string;
    base_bp: bigint;
    tasa_bp: number;
    monto_bp: bigint;
  }> = [];

  for (const cuota of cuotas_imss) {
    let base_bp = sbc_bp;

    // Si aplica UMA, la base es (SBC - 3*UMA)+ limitado a 0
    if (cuota.aplica_uma) {
      const tres_umas_bp = config_imss.uma_diaria_bp * BigInt(3);
      base_bp = sbc_bp > tres_umas_bp ? restarBp(sbc_bp, tres_umas_bp) : BigInt(0);
    }

    // Si está topado, aplicar tope de 25 UMAs
    if (cuota.topado) {
      const tope_bp = config_imss.uma_diaria_bp * BigInt(25);
      if (base_bp > tope_bp) {
        base_bp = tope_bp;
      }
    }

    // Calcular monto = base * tasa
    const monto_bp = multiplicarBpPorTasa(base_bp, cuota.tasa_bp);

    const cuota_calculada = {
      ramo: cuota.ramo,
      base_bp,
      tasa_bp: cuota.tasa_bp,
      monto_bp,
    };

    if (cuota.tipo === 'obrero') {
      cuotas_obrero.push(cuota_calculada);
    } else {
      cuotas_patronal.push(cuota_calculada);
    }
  }

  // Calcular totales
  const total_obrero_bp = cuotas_obrero.reduce(
    (sum, c) => sumarBp(sum, c.monto_bp),
    BigInt(0)
  );

  const total_patronal_bp = cuotas_patronal.reduce(
    (sum, c) => sumarBp(sum, c.monto_bp),
    BigInt(0)
  );

  const total_bp = sumarBp(total_obrero_bp, total_patronal_bp);

  return {
    sbc_bp,
    cuotas_obrero,
    cuotas_patronal,
    total_obrero_bp,
    total_patronal_bp,
    total_bp,
  };
}

/**
 * Calcula pago de horas extra según LFT
 * 
 * - Primeras 9 horas semanales: 200% (dobles)
 * - Horas adicionales: 300% (triples)
 * - Exento de ISR: 5 SMG (salarios mínimos generales) semanales
 * 
 * @param salario_hora_bp - Salario por hora ordinaria en basis points
 * @param horas_extra - Total de horas extra trabajadas
 * @param config_imss - Configuración IMSS para obtener salario mínimo
 * @returns Resultado con desglose de horas dobles, triples, gravado y exento
 */
export function calcularHorasExtra(
  salario_hora_bp: bigint,
  horas_extra: number,
  config_imss: ConfigIMSS
): ResultadoHorasExtra {
  // Límite de horas dobles: 9 horas semanales
  const limite_horas_dobles = 9;
  
  const horas_dobles = Math.min(horas_extra, limite_horas_dobles);
  const horas_triples = Math.max(0, horas_extra - limite_horas_dobles);

  // Monto horas dobles: horas * salario_hora * 2 (mantener fracciones de horas)
  const horas_dobles_bp = BigInt(Math.trunc(horas_dobles * 10000));
  const monto_dobles_bp = (salario_hora_bp * horas_dobles_bp * BigInt(2)) / BigInt(10000);

  // Monto horas triples: horas * salario_hora * 3 (mantener fracciones de horas)
  const horas_triples_bp = BigInt(Math.trunc(horas_triples * 10000));
  const monto_triples_bp = (salario_hora_bp * horas_triples_bp * BigInt(3)) / BigInt(10000);

  const total_bp = sumarBp(monto_dobles_bp, monto_triples_bp);

  // Límite exento: 5 salarios mínimos semanales (simple multiplicación entera)
  const limite_exento_semanal_bp = config_imss.salario_minimo_diario_bp * BigInt(5 * 7);

  // Exento = min(Total, Límite)
  const exento_bp = total_bp > limite_exento_semanal_bp
    ? limite_exento_semanal_bp
    : total_bp;

  // Gravado = Total - Exento
  const gravado_bp = restarBp(total_bp, exento_bp);

  return {
    horas_dobles,
    horas_triples,
    monto_dobles_bp,
    monto_triples_bp,
    total_bp,
    gravado_bp,
    exento_bp,
  };
}

/**
 * Convierte ingreso de un periodo a otro
 * 
 * @param ingreso_bp - Ingreso en el periodo origen
 * @param periodo_origen - Periodo de origen
 * @param periodo_destino - Periodo de destino
 * @returns Ingreso convertido al periodo destino
 */
export function convertirPeriodo(
  ingreso_bp: bigint,
  periodo_origen: PeriodoPago,
  periodo_destino: PeriodoPago
): bigint {
  // Factores de conversión a diario
  const factores: Record<PeriodoPago, number> = {
    diario: 1,
    semanal: 7,
    decenal: 10,
    quincenal: 15,
    mensual: 30,
  };

  // Convertir a diario (simple división entera)
  const ingreso_diario_bp = ingreso_bp / BigInt(factores[periodo_origen]);

  // Convertir al periodo destino (simple multiplicación entera)
  return ingreso_diario_bp * BigInt(factores[periodo_destino]);
}
