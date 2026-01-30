/**
 * Motor de Cálculo de Cuotas IMSS 2026
 *
 * Este servicio implementa el cálculo completo de cuotas obrero-patronales
 * del Instituto Mexicano del Seguro Social, incluyendo:
 *
 * - Enfermedad y Maternidad (Cuota Fija sobre 3 UMAs + Excedente + Gastos Médicos Pensionados)
 * - Riesgo de Trabajo (Prima variable por empresa)
 * - Invalidez y Vida
 * - Retiro
 * - Cesantía y Vejez (Tasas progresivas 2026 - 4to incremento reforma 2020)
 * - Guarderías y Prestaciones Sociales
 * - Infonavit (5% patronal)
 *
 * ACTUALIZADO 2026:
 * - UMA 2026: $117.31 diario (vigente desde 1 Feb 2026)
 * - Tasas C&V 2026: 3.15% - 7.51% patronal según nivel salarial
 * - Cuota obrera C&V: 1.125% (fija)
 *
 * Todos los cálculos usan basis points (1 peso = 10,000 bp) para precisión de 4 decimales.
 */

import { db } from "../db";
import { 
  catImssCuotas, 
  catCesantiaVejezTasas, 
  catValoresUmaSmg,
  catPrimasRiesgoTrabajo,
  type CatImssCuota,
  type CatCesantiaVejezTasa,
  type CatValorUmaSmg,
  type CatPrimaRiesgoTrabajo,
} from "@shared/schema";
import { eq, and, lte, gte, isNull, or, desc } from "drizzle-orm";
import {
  pesosToBp,
  bpToPesos,
  multiplicarBpPorTasa,
  sumarBp,
  restarBp,
  minBp,
  maxBp,
} from "@shared/basisPoints";

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export interface ConfiguracionIMSS {
  anio: number;
  umaDiaria: number;
  umaMensual: number;
  salarioMinimoDiario: number;
  topeUmas: number; // Típicamente 25 UMAs
}

export interface EmpleadoIMSS {
  empleadoId: string;
  sbcDiario: number; // Salario Base de Cotización diario
  diasCotizados: number; // Días del período (bimestre o mes)
  empresaId?: string; // Para obtener prima de riesgo específica
  registroPatronalId?: number;
}

export interface CuotaCalculada {
  ramo: string;
  concepto: string;
  base: number; // En pesos
  baseBp: bigint;
  tasaBp: number;
  tasaPorcentaje: number;
  montoBp: bigint;
  monto: number; // En pesos
}

export interface ResultadoCuotasIMSS {
  empleadoId: string;
  sbcDiario: number;
  sbcMensual: number;
  diasCotizados: number;
  
  cuotasObrero: CuotaCalculada[];
  cuotasPatronal: CuotaCalculada[];
  
  totalObreroBp: bigint;
  totalPatronalBp: bigint;
  totalBp: bigint;
  
  totalObrero: number;
  totalPatronal: number;
  total: number;
  
  desglosePorRamo: {
    ramo: string;
    obrero: number;
    patronal: number;
    total: number;
  }[];
}

export interface ResultadoBimestral {
  empresaId: string;
  registroPatronalId?: number;
  ejercicio: number;
  bimestre: number; // 1-6
  fechaInicio: Date;
  fechaFin: Date;
  
  empleados: ResultadoCuotasIMSS[];
  
  // Totales en basis points (authoritative source)
  totalesObreroBp: bigint;
  totalesPatronalBp: bigint;
  totalesGeneralBp: bigint;
  
  // Totales en pesos (derived from BP for display)
  totalesObrero: number;
  totalesPatronal: number;
  totalesGeneral: number;
  
  desglosePorRamo: {
    ramo: string;
    obreroBp: bigint;
    patronalBp: bigint;
    totalBp: bigint;
    obrero: number;
    patronal: number;
    total: number;
  }[];
}

// ============================================================================
// CACHE DE CATÁLOGOS
// ============================================================================

interface CacheData {
  cuotas: CatImssCuota[];
  cesantiaVejezTasas: CatCesantiaVejezTasa[];
  valoresUmaSmg: CatValorUmaSmg[];
  primasRiesgo: Map<string, CatPrimaRiesgoTrabajo>;
  timestamp: number;
}

let cache: CacheData | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

async function loadCatalogData(anio: number): Promise<CacheData> {
  const now = Date.now();
  
  if (cache && (now - cache.timestamp) < CACHE_TTL) {
    return cache;
  }
  
  const [cuotas, cesantiaVejezTasas, valoresUmaSmg, primasRiesgo] = await Promise.all([
    db.select().from(catImssCuotas).where(eq(catImssCuotas.anio, anio)),
    db.select().from(catCesantiaVejezTasas).where(eq(catCesantiaVejezTasas.anio, anio)).orderBy(catCesantiaVejezTasas.orden),
    db.select().from(catValoresUmaSmg),
    db.select().from(catPrimasRiesgoTrabajo).where(eq(catPrimasRiesgoTrabajo.anio, anio)),
  ]);
  
  const primasRiesgoMap = new Map<string, CatPrimaRiesgoTrabajo>();
  for (const prima of primasRiesgo) {
    const key = `${prima.empresaId}-${prima.registroPatronalId ?? 'default'}`;
    primasRiesgoMap.set(key, prima);
  }
  
  cache = {
    cuotas,
    cesantiaVejezTasas,
    valoresUmaSmg,
    primasRiesgo: primasRiesgoMap,
    timestamp: now,
  };
  
  return cache;
}

// ============================================================================
// FUNCIONES DE UTILIDAD
// ============================================================================

function getValorVigente(
  valores: CatValorUmaSmg[], 
  tipo: 'UMA' | 'SMG' | 'SMG_FRONTERA',
  fecha: Date
): CatValorUmaSmg | undefined {
  const fechaStr = fecha.toISOString().split('T')[0];
  
  return valores
    .filter(v => v.tipo === tipo)
    .filter(v => v.vigenciaDesde <= fechaStr)
    .filter(v => !v.vigenciaHasta || v.vigenciaHasta >= fechaStr)
    .sort((a, b) => b.vigenciaDesde.localeCompare(a.vigenciaDesde))[0];
}

function getTasaCesantiaVejezPatronal(
  tasas: CatCesantiaVejezTasa[],
  sbcDiario: number,
  umaDiaria: number
): { tasaBp: number; rangoDescripcion: string } {
  const ratioSbcUma = sbcDiario / umaDiaria;
  
  for (const tasa of tasas) {
    const limInf = parseFloat(tasa.limiteInferiorUma);
    const limSup = tasa.limiteSuperiorUma ? parseFloat(tasa.limiteSuperiorUma) : Infinity;
    
    if (ratioSbcUma >= limInf && ratioSbcUma <= limSup) {
      return {
        tasaBp: tasa.patronTasaBp,
        rangoDescripcion: tasa.rangoDescripcion,
      };
    }
  }
  
  // Fallback al rango más alto si no encuentra
  const ultimoRango = tasas[tasas.length - 1];
  return {
    tasaBp: ultimoRango?.patronTasaBp ?? 642, // 6.42% máximo 2025
    rangoDescripcion: ultimoRango?.rangoDescripcion ?? '4.01+ UMA',
  };
}

function getPrimaRiesgoTrabajo(
  primasRiesgo: Map<string, CatPrimaRiesgoTrabajo>,
  empresaId: string,
  registroPatronalId?: number
): number {
  const key = `${empresaId}-${registroPatronalId ?? 'default'}`;
  const prima = primasRiesgo.get(key);
  
  if (prima) {
    return prima.primaTasaBp;
  }
  
  // Fallback: buscar prima general de la empresa
  const keyGeneral = `${empresaId}-default`;
  const primaGeneral = primasRiesgo.get(keyGeneral);
  
  if (primaGeneral) {
    return primaGeneral.primaTasaBp;
  }
  
  // Default: prima mínima (0.50%)
  return 50;
}

// ============================================================================
// FUNCIONES PRINCIPALES DE CÁLCULO
// ============================================================================

/**
 * Calcula las cuotas IMSS para un empleado en un período
 */
export async function calcularCuotasIMSS(
  empleado: EmpleadoIMSS,
  config: ConfiguracionIMSS
): Promise<ResultadoCuotasIMSS> {
  const catalogos = await loadCatalogData(config.anio);
  
  const { sbcDiario, diasCotizados, empleadoId } = empleado;
  
  // Convertir SBC a basis points
  const sbcDiarioBp = pesosToBp(sbcDiario);
  const sbcMensualBp = sbcDiarioBp * BigInt(30);
  const sbcPeriodoBp = sbcDiarioBp * BigInt(diasCotizados);
  
  // Valores UMA en basis points
  const umaDiariaBp = pesosToBp(config.umaDiaria);
  const tresUmasBp = umaDiariaBp * BigInt(3);
  const topeUmasBp = umaDiariaBp * BigInt(config.topeUmas);
  
  // SBC topado a 25 UMAs
  const sbcTopadoDiarioBp = minBp(sbcDiarioBp, topeUmasBp);
  const sbcTopadoPeriodoBp = sbcTopadoDiarioBp * BigInt(diasCotizados);
  
  // Excedente sobre 3 UMAs (para EyM)
  const excedente3UmasDiarioBp = sbcDiarioBp > tresUmasBp 
    ? restarBp(minBp(sbcDiarioBp, topeUmasBp), tresUmasBp)
    : BigInt(0);
  const excedente3UmasPeriodoBp = excedente3UmasDiarioBp * BigInt(diasCotizados);
  
  // Base UMA para cuota fija EyM (20.40% sobre 3 UMAs - Art. 106 LSS)
  // IMPORTANTE: La cuota fija patronal se calcula sobre 3 UMAs, NO sobre 1 UMA
  const umaBaseEyMBp = tresUmasBp * BigInt(diasCotizados);
  
  const cuotasObrero: CuotaCalculada[] = [];
  const cuotasPatronal: CuotaCalculada[] = [];
  
  // Obtener tasa progresiva de Cesantía y Vejez
  const cesantiaVejezTasa = getTasaCesantiaVejezPatronal(
    catalogos.cesantiaVejezTasas,
    sbcDiario,
    config.umaDiaria
  );
  
  // Obtener prima de riesgo de trabajo
  const primaRiesgoBp = empleado.empresaId 
    ? getPrimaRiesgoTrabajo(catalogos.primasRiesgo, empleado.empresaId, empleado.registroPatronalId)
    : 50; // Mínimo 0.50%
  
  // Procesar cada cuota del catálogo
  for (const cuota of catalogos.cuotas) {
    let baseBp: bigint;
    
    // Determinar base de cálculo
    switch (cuota.baseCalculo) {
      case 'uma':
        baseBp = umaBaseEyMBp;
        break;
      case 'excedente_3uma':
        baseBp = excedente3UmasPeriodoBp;
        break;
      case 'sbc':
      default:
        baseBp = cuota.aplicaLimiteSuperior ? sbcTopadoPeriodoBp : sbcPeriodoBp;
        break;
    }
    
    // Calcular cuota patronal
    if (cuota.patronTasaBp) {
      let tasaBp = cuota.patronTasaBp;
      
      // Caso especial: Riesgo de Trabajo usa prima específica de la empresa
      if (cuota.ramo === 'riesgo_trabajo') {
        tasaBp = primaRiesgoBp;
      }
      
      const montoBp = multiplicarBpPorTasa(baseBp, tasaBp);
      
      cuotasPatronal.push({
        ramo: cuota.ramo,
        concepto: cuota.concepto,
        base: bpToPesos(baseBp),
        baseBp,
        tasaBp,
        tasaPorcentaje: tasaBp / 100,
        montoBp,
        monto: bpToPesos(montoBp),
      });
    }
    
    // Calcular cuota obrero
    if (cuota.trabajadorTasaBp) {
      const montoBp = multiplicarBpPorTasa(baseBp, cuota.trabajadorTasaBp);
      
      cuotasObrero.push({
        ramo: cuota.ramo,
        concepto: cuota.concepto,
        base: bpToPesos(baseBp),
        baseBp,
        tasaBp: cuota.trabajadorTasaBp,
        tasaPorcentaje: cuota.trabajadorTasaBp / 100,
        montoBp,
        monto: bpToPesos(montoBp),
      });
    }
  }
  
  // Agregar Cesantía y Vejez con tasas progresivas
  // Patronal (tasa progresiva según nivel salarial)
  const cesantiaPatronalMontoBp = multiplicarBpPorTasa(sbcTopadoPeriodoBp, cesantiaVejezTasa.tasaBp);
  cuotasPatronal.push({
    ramo: 'cesantia_vejez',
    concepto: `Cesantía y Vejez - Patrón (${cesantiaVejezTasa.rangoDescripcion})`,
    base: bpToPesos(sbcTopadoPeriodoBp),
    baseBp: sbcTopadoPeriodoBp,
    tasaBp: cesantiaVejezTasa.tasaBp,
    tasaPorcentaje: cesantiaVejezTasa.tasaBp / 100,
    montoBp: cesantiaPatronalMontoBp,
    monto: bpToPesos(cesantiaPatronalMontoBp),
  });

  // Obrero Cesantía y Vejez (tasa FIJA 1.125% - Art. 168 LSS)
  // IMPORTANTE: La tasa obrero NO es progresiva, siempre es 1.125%
  // Usamos 1125 / 10 para mantener precisión exacta (1.125% = 112.5 bp)
  // Cálculo: (sbcTopadoPeriodoBp * 1125) / 100000 = sbcTopadoPeriodoBp * 1.125%
  const cesantiaObreroMontoBp = (sbcTopadoPeriodoBp * BigInt(1125)) / BigInt(100000);
  // C&V Obrero rate: exactly 1.125% (Art. 168 LSS)
  const CESANTIA_VEJEZ_OBRERO_TASA_PORCENTAJE = 1.125;
  cuotasObrero.push({
    ramo: 'cesantia_vejez',
    concepto: 'Cesantía y Vejez - Trabajador',
    base: bpToPesos(sbcTopadoPeriodoBp),
    baseBp: sbcTopadoPeriodoBp,
    tasaBp: 112.5, // 1.125% in basis points (for display)
    tasaPorcentaje: CESANTIA_VEJEZ_OBRERO_TASA_PORCENTAJE,
    montoBp: cesantiaObreroMontoBp,
    monto: bpToPesos(cesantiaObreroMontoBp),
  });

  // Calcular totales
  const totalObreroBp = cuotasObrero.reduce((sum, c) => sumarBp(sum, c.montoBp), BigInt(0));
  const totalPatronalBp = cuotasPatronal.reduce((sum, c) => sumarBp(sum, c.montoBp), BigInt(0));
  const totalBp = sumarBp(totalObreroBp, totalPatronalBp);
  
  // Desglose por ramo
  const ramosSet = new Set([...cuotasObrero.map(c => c.ramo), ...cuotasPatronal.map(c => c.ramo)]);
  const ramosUnicos = Array.from(ramosSet);
  const desglosePorRamo = ramosUnicos.map(ramo => {
    const obrero = cuotasObrero.filter(c => c.ramo === ramo).reduce((sum, c) => sum + c.monto, 0);
    const patronal = cuotasPatronal.filter(c => c.ramo === ramo).reduce((sum, c) => sum + c.monto, 0);
    return {
      ramo,
      obrero: Math.round(obrero * 100) / 100,
      patronal: Math.round(patronal * 100) / 100,
      total: Math.round((obrero + patronal) * 100) / 100,
    };
  });
  
  return {
    empleadoId,
    sbcDiario,
    sbcMensual: sbcDiario * 30,
    diasCotizados,
    cuotasObrero,
    cuotasPatronal,
    totalObreroBp,
    totalPatronalBp,
    totalBp,
    totalObrero: bpToPesos(totalObreroBp),
    totalPatronal: bpToPesos(totalPatronalBp),
    total: bpToPesos(totalBp),
    desglosePorRamo,
  };
}

/**
 * Obtiene la configuración IMSS para un año dado
 */
export async function getConfiguracionIMSS(anio: number, fecha?: Date): Promise<ConfiguracionIMSS> {
  const catalogos = await loadCatalogData(anio);
  const fechaRef = fecha ?? new Date();
  
  const umaVigente = getValorVigente(catalogos.valoresUmaSmg, 'UMA', fechaRef);
  const smgVigente = getValorVigente(catalogos.valoresUmaSmg, 'SMG', fechaRef);
  
  if (!umaVigente || !smgVigente) {
    throw new Error(`No se encontraron valores UMA/SMG vigentes para el año ${anio}`);
  }
  
  return {
    anio,
    umaDiaria: parseFloat(umaVigente.valorDiario),
    umaMensual: parseFloat(umaVigente.valorMensual),
    salarioMinimoDiario: parseFloat(smgVigente.valorDiario),
    topeUmas: 25,
  };
}

/**
 * Calcula las cuotas bimestrales para un conjunto de empleados
 */
export async function calcularCuotasBimestrales(
  empresaId: string,
  empleados: EmpleadoIMSS[],
  ejercicio: number,
  bimestre: number // 1-6
): Promise<ResultadoBimestral> {
  // Calcular fechas del bimestre
  const mesInicio = (bimestre - 1) * 2 + 1; // 1, 3, 5, 7, 9, 11
  const mesFin = mesInicio + 1;
  
  const fechaInicio = new Date(ejercicio, mesInicio - 1, 1);
  const fechaFin = new Date(ejercicio, mesFin, 0); // Último día del mes par
  
  // Días del bimestre
  const diasBimestre = Math.round((fechaFin.getTime() - fechaInicio.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  
  // Obtener configuración IMSS
  const config = await getConfiguracionIMSS(ejercicio, fechaInicio);
  
  // Calcular cuotas para cada empleado
  const resultadosEmpleados: ResultadoCuotasIMSS[] = [];
  
  for (const empleado of empleados) {
    const empleadoConDias: EmpleadoIMSS = {
      ...empleado,
      diasCotizados: empleado.diasCotizados || diasBimestre,
      empresaId,
    };
    
    const resultado = await calcularCuotasIMSS(empleadoConDias, config);
    resultadosEmpleados.push(resultado);
  }
  
  // Calcular totales usando basis points (authoritative)
  const totalesObreroBp = resultadosEmpleados.reduce((sum, e) => sumarBp(sum, e.totalObreroBp), BigInt(0));
  const totalesPatronalBp = resultadosEmpleados.reduce((sum, e) => sumarBp(sum, e.totalPatronalBp), BigInt(0));
  const totalesGeneralBp = sumarBp(totalesObreroBp, totalesPatronalBp);
  
  // Consolidar desglose por ramo usando basis points
  const ramosMap = new Map<string, { obreroBp: bigint; patronalBp: bigint; totalBp: bigint }>();
  
  for (const resultado of resultadosEmpleados) {
    // Aggregate from cuotas (which have basis point values)
    for (const cuota of resultado.cuotasObrero) {
      const existing = ramosMap.get(cuota.ramo) || { obreroBp: BigInt(0), patronalBp: BigInt(0), totalBp: BigInt(0) };
      ramosMap.set(cuota.ramo, {
        obreroBp: sumarBp(existing.obreroBp, cuota.montoBp),
        patronalBp: existing.patronalBp,
        totalBp: sumarBp(existing.totalBp, cuota.montoBp),
      });
    }
    for (const cuota of resultado.cuotasPatronal) {
      const existing = ramosMap.get(cuota.ramo) || { obreroBp: BigInt(0), patronalBp: BigInt(0), totalBp: BigInt(0) };
      ramosMap.set(cuota.ramo, {
        obreroBp: existing.obreroBp,
        patronalBp: sumarBp(existing.patronalBp, cuota.montoBp),
        totalBp: sumarBp(existing.totalBp, cuota.montoBp),
      });
    }
  }
  
  const desglosePorRamo = Array.from(ramosMap.entries()).map(([ramo, valores]) => ({
    ramo,
    obreroBp: valores.obreroBp,
    patronalBp: valores.patronalBp,
    totalBp: valores.totalBp,
    obrero: bpToPesos(valores.obreroBp),
    patronal: bpToPesos(valores.patronalBp),
    total: bpToPesos(valores.totalBp),
  }));
  
  return {
    empresaId,
    ejercicio,
    bimestre,
    fechaInicio,
    fechaFin,
    empleados: resultadosEmpleados,
    totalesObreroBp,
    totalesPatronalBp,
    totalesGeneralBp,
    totalesObrero: bpToPesos(totalesObreroBp),
    totalesPatronal: bpToPesos(totalesPatronalBp),
    totalesGeneral: bpToPesos(totalesGeneralBp),
    desglosePorRamo,
  };
}

/**
 * Obtiene los rangos de Cesantía y Vejez para un año
 */
export async function getRangosCesantiaVejez(anio: number): Promise<CatCesantiaVejezTasa[]> {
  const catalogos = await loadCatalogData(anio);
  return catalogos.cesantiaVejezTasas;
}

/**
 * Obtiene las cuotas IMSS del catálogo para un año
 */
export async function getCuotasIMSS(anio: number): Promise<CatImssCuota[]> {
  const catalogos = await loadCatalogData(anio);
  return catalogos.cuotas;
}

/**
 * Limpia la caché de catálogos
 */
export function clearCache(): void {
  cache = null;
}
