/**
 * Inverse Payroll Calculator
 * 
 * Calculates the gross salary (bruto) needed to achieve a desired net salary (neto_deseado).
 * Uses Newton-Raphson style iteration since the relationship between gross and net is non-linear
 * due to progressive ISR tax tables and IMSS contributions.
 * 
 * The algorithm:
 * 1. Start with an initial estimate (neto_deseado * 1.35 for typical tax burden)
 * 2. Calculate net from that gross using standard payroll formulas
 * 3. Estimate marginal retention rate (dNet/dBruto) using ISR bracket + IMSS rate
 * 4. Newton step: bruto_new = bruto - varianza / derivative
 * 5. Repeat until convergence (difference < threshold)
 * 
 * This ensures employees with NETO compensation receive their guaranteed net amount.
 */

import { 
  pesosToBp, 
  bpToPesos, 
  multiplicarBpPorTasa, 
  dividirBp, 
  sumarBp, 
  restarBp
} from '@shared/basisPoints';

import {
  calcularISR,
  calcularIMSSTrabajador,
  CONFIG_FISCAL_2025,
  TABLAS_ISR_2025,
  type TipoPeriodo
} from '@shared/payrollEngine';

interface CalculoInversoInput {
  netoDeseadoBp: bigint;
  diasPeriodo?: number;
  periodo?: TipoPeriodo;
  maxIteraciones?: number;
  toleranciaBp?: bigint;
}

interface CalculoInversoResult {
  brutoMensualBp: bigint;
  salarioDiarioBp: bigint;
  netoCalculadoBp: bigint;
  isrMensualBp: bigint;
  imssObreroMensualBp: bigint;
  subsidioEmpleoBp: bigint;
  varianzaBp: bigint;
  iteraciones: number;
  convergencia: boolean;
}

const DIAS_MES_DEFAULT = 30;

/**
 * Estimates the marginal effective tax rate (1 - dNet/dBruto)
 * Uses ISR marginal rate from current bracket + approximate IMSS rate
 * 
 * @param baseGravableBp - Current ISR base in basis points
 * @param periodo - Tax period
 * @returns Marginal retention rate as a decimal (0.0 to 1.0)
 */
function estimarTasaMarginalRetencion(baseGravableBp: bigint, periodo: TipoPeriodo): number {
  const tablaISR = TABLAS_ISR_2025[periodo];
  let tasaISRBp = 0;
  
  // Find current ISR bracket marginal rate
  for (const tramo of tablaISR.tramos) {
    if (baseGravableBp >= tramo.limiteInferiorBp &&
        (tramo.limiteSuperiorBp === null || baseGravableBp <= tramo.limiteSuperiorBp)) {
      tasaISRBp = tramo.tasaExcedenteBp;
      break;
    }
  }
  
  // ISR marginal rate from bracket (tasaExcedenteBp is already in basis points, e.g., 1200 = 12%)
  const tasaISR = tasaISRBp / 10000;
  
  // Approximate IMSS worker rate (varies by SBC but ~2.5-3% is typical)
  const tasaIMSS = 0.025;
  
  // Total marginal retention rate
  return tasaISR + tasaIMSS;
}

/**
 * Calcula el bruto necesario para lograr un neto deseado específico.
 * Usa iteración Newton-Raphson para encontrar el bruto correcto.
 * 
 * Uses actual IMSS formulas from payrollEngine for accurate tier-based calculations.
 * 
 * @param input - Parámetros del cálculo
 * @returns Resultado con bruto calculado y desglose de deducciones
 */
export function calcularBrutoDesdeNeto(input: CalculoInversoInput): CalculoInversoResult {
  const {
    netoDeseadoBp,
    diasPeriodo = DIAS_MES_DEFAULT,
    periodo = 'mensual',
    maxIteraciones = 100, // Increased for more challenging cases
    toleranciaBp = BigInt(100), // 0.01 pesos de tolerancia
  } = input;

  // Initial estimate: typical gross is 1.35x net considering taxes
  let brutoEstimadoBp = multiplicarBpPorTasa(netoDeseadoBp, 13500);
  let iteraciones = 0;
  let convergencia = false;
  let ultimoResultado: CalculoInversoResult | null = null;
  
  // Track previous variance for oscillation detection
  let varianzaAnterior: bigint | null = null;

  while (iteraciones < maxIteraciones) {
    iteraciones++;

    // Calculate daily salary from monthly gross (for SBC/IMSS calculations)
    const salarioDiarioBp = dividirBp(brutoEstimadoBp, diasPeriodo);
    
    // Calculate IMSS worker contributions using actual formulas
    // Uses tier-based rates from CUOTAS_IMSS_2025 including 3 UMA cap logic
    const { totalBp: imssObreroMensualBp } = calcularIMSSTrabajador(
      salarioDiarioBp,
      diasPeriodo
    );
    
    // Base gravable ISR = Bruto - IMSS obrero
    const baseGravableISR = restarBp(brutoEstimadoBp, imssObreroMensualBp);
    
    // Calculate ISR with subsidy using actual tables
    const { isrBp, subsidioEmpleoBp, isrRetenidoBp } = calcularISR(baseGravableISR, periodo);
    
    // Net = Gross - ISR retained - IMSS obrero
    const netoCalculadoBp = restarBp(brutoEstimadoBp, sumarBp(isrRetenidoBp, imssObreroMensualBp));
    
    // Calculate variance between calculated net and desired net
    const varianzaBp = restarBp(netoCalculadoBp, netoDeseadoBp);
    const varianzaAbs = varianzaBp < BigInt(0) ? -varianzaBp : varianzaBp;

    ultimoResultado = {
      brutoMensualBp: brutoEstimadoBp,
      salarioDiarioBp,
      netoCalculadoBp,
      isrMensualBp: isrBp,
      imssObreroMensualBp,
      subsidioEmpleoBp,
      varianzaBp,
      iteraciones,
      convergencia: false,
    };

    // Check convergence
    if (varianzaAbs <= toleranciaBp) {
      convergencia = true;
      ultimoResultado.convergencia = true;
      break;
    }

    // Estimate marginal retention rate for Newton step
    const tasaRetencion = estimarTasaMarginalRetencion(baseGravableISR, periodo);
    
    // dNet/dBruto = 1 - tasaRetencion (the actual derivative)
    // Newton step: bruto_new = bruto - varianza / dNetdBruto
    let dNetdBruto = 1 - tasaRetencion;
    
    // Apply damping ONLY when derivative is outside valid range [0, 1]
    // For most cases, derivative should be in (0.5, 1) - no damping needed
    let dampingFactor = 1.0;
    if (dNetdBruto <= 0 || dNetdBruto > 1) {
      // Invalid derivative (100%+ retention) - use safe default
      dNetdBruto = 0.7;
      dampingFactor = 0.5;
    } else if (dNetdBruto < 0.3) {
      // Very high retention - apply damping for stability
      dampingFactor = 0.7;
    }
    
    // Convert varianza to number for calculation, then back to bigint
    const varianzaNum = Number(varianzaBp);
    const adjustmentNum = Math.round((varianzaNum / dNetdBruto) * dampingFactor);
    let adjustmentBp = BigInt(adjustmentNum);
    
    // Detect oscillation - if variance changed sign, halve the step
    if (varianzaAnterior !== null) {
      const signoActual = varianzaBp > BigInt(0);
      const signoAnterior = varianzaAnterior > BigInt(0);
      if (signoActual !== signoAnterior) {
        // Oscillation detected - reduce step to break oscillation
        adjustmentBp = adjustmentBp / BigInt(2);
      }
    }
    
    brutoEstimadoBp = restarBp(brutoEstimadoBp, adjustmentBp);
    varianzaAnterior = varianzaBp;
    
    // Safety: gross must always be >= net (can't have negative deductions net)
    if (brutoEstimadoBp < netoDeseadoBp) {
      brutoEstimadoBp = netoDeseadoBp;
    }
    
    // Safety: prevent runaway growth
    const maxBrutoBp = multiplicarBpPorTasa(netoDeseadoBp, 25000); // 2.5x net as upper bound
    if (brutoEstimadoBp > maxBrutoBp) {
      brutoEstimadoBp = maxBrutoBp;
    }
  }

  return ultimoResultado || {
    brutoMensualBp: netoDeseadoBp,
    salarioDiarioBp: dividirBp(netoDeseadoBp, diasPeriodo),
    netoCalculadoBp: netoDeseadoBp,
    isrMensualBp: BigInt(0),
    imssObreroMensualBp: BigInt(0),
    subsidioEmpleoBp: BigInt(0),
    varianzaBp: BigInt(0),
    iteraciones,
    convergencia: false,
  };
}

/**
 * Calcula el neto resultante de un bruto dado.
 * Función directa (sin iteración) para esquemas BRUTO.
 * 
 * Uses actual IMSS formulas from payrollEngine for accurate calculations.
 * 
 * @param brutoMensualBp - Salario bruto mensual en basis points
 * @param diasPeriodo - Días del periodo (default 30)
 * @param periodo - Periodo de nómina (default mensual)
 * @returns Desglose de salario con neto calculado
 */
export function calcularNetoDesdebruto(
  brutoMensualBp: bigint,
  diasPeriodo: number = DIAS_MES_DEFAULT,
  periodo: TipoPeriodo = 'mensual'
): Omit<CalculoInversoResult, 'iteraciones' | 'convergencia' | 'varianzaBp'> & { netoDeseadoBp: null } {
  const salarioDiarioBp = dividirBp(brutoMensualBp, diasPeriodo);
  
  // Calculate IMSS using actual tier-based formulas
  const { totalBp: imssObreroMensualBp } = calcularIMSSTrabajador(
    salarioDiarioBp,
    diasPeriodo
  );
  
  // Base gravable ISR = Bruto - IMSS obrero
  const baseGravableISR = restarBp(brutoMensualBp, imssObreroMensualBp);
  
  // Calculate ISR with subsidy
  const { isrBp, subsidioEmpleoBp, isrRetenidoBp } = calcularISR(baseGravableISR, periodo);
  
  // Net = Gross - ISR retained - IMSS obrero
  const netoCalculadoBp = restarBp(brutoMensualBp, sumarBp(isrRetenidoBp, imssObreroMensualBp));

  return {
    brutoMensualBp,
    salarioDiarioBp,
    netoCalculadoBp,
    netoDeseadoBp: null,
    isrMensualBp: isrBp,
    imssObreroMensualBp,
    subsidioEmpleoBp,
  };
}

/**
 * Recalcula la compensación completa de un empleado basado en su esquema.
 * - NETO: Usa neto_deseado como ancla, calcula bruto necesario
 * - BRUTO: Usa bruto como ancla, calcula neto resultante
 * 
 * @param esquemaTipo - 'BRUTO' o 'NETO'
 * @param valorAnclaBp - Valor ancla mensual en basis points
 * @param diasPeriodo - Días del periodo
 * @param periodo - Periodo de nómina
 * @returns Resultado del cálculo completo
 */
export function recalcularCompensacion(
  esquemaTipo: 'BRUTO' | 'NETO',
  valorAnclaBp: bigint,
  diasPeriodo: number = DIAS_MES_DEFAULT,
  periodo: TipoPeriodo = 'mensual'
): CalculoInversoResult {
  if (esquemaTipo === 'NETO') {
    return calcularBrutoDesdeNeto({
      netoDeseadoBp: valorAnclaBp,
      diasPeriodo,
      periodo,
    });
  } else {
    const resultado = calcularNetoDesdebruto(valorAnclaBp, diasPeriodo, periodo);
    return {
      ...resultado,
      varianzaBp: BigInt(0),
      iteraciones: 1,
      convergencia: true,
    };
  }
}
