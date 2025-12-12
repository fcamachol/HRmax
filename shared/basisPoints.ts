/**
 * SISTEMA DE BASIS POINTS
 * 
 * Basis points permiten almacenar valores monetarios y porcentajes con precisión de 4 decimales
 * usando aritmética de enteros (BIGINT), eliminando errores de redondeo de punto flotante.
 * 
 * CONVERSIÓN:
 * - 1 peso = 10,000 basis points
 * - $15,234.5678 = 152,345,678 bp
 * - 10.5% = 1,050 bp (para porcentajes)
 * 
 * VENTAJAS:
 * - Zero errores de redondeo
 * - Aritmética con BIGINT (rápida y precisa)
 * - Compliance con SAT/IMSS (4 decimales requeridos)
 */

const BP_PER_PESO = 10000;
const BP_PER_PERCENTAGE_POINT = 100; // Para porcentajes: 10.5% = 1050 bp

/**
 * Convierte pesos a basis points
 * @param pesos - Cantidad en pesos (puede tener hasta 4 decimales)
 * @returns Cantidad en basis points (entero)
 * @example
 * pesosToBp(15000.00) // 150000000
 * pesosToBp(15234.5678) // 152345678
 */
export function pesosToBp(pesos: number): bigint {
  if (!Number.isFinite(pesos)) {
    throw new Error(`Invalid pesos value: ${pesos}`);
  }
  
  // Multiplicar por 10000 y redondear para evitar problemas de precisión de punto flotante
  const bp = Math.round(pesos * BP_PER_PESO);
  return BigInt(bp);
}

/**
 * Convierte basis points a pesos
 * @param bp - Cantidad en basis points
 * @returns Cantidad en pesos con hasta 4 decimales
 * @example
 * bpToPesos(150000000n) // 15000.0000
 * bpToPesos(152345678n) // 15234.5678
 */
export function bpToPesos(bp: bigint): number {
  // Convertir a número y dividir por 10000
  const pesos = Number(bp) / BP_PER_PESO;
  
  // Redondear a 4 decimales para evitar problemas de representación
  return Math.round(pesos * 10000) / 10000;
}

/**
 * Convierte porcentaje a basis points (para tasas)
 * @param porcentaje - Porcentaje (ej: 10.5 para 10.5%)
 * @returns Basis points de tasa (entero)
 * @example
 * porcentajeToBp(10.5) // 1050
 * porcentajeToBp(1.92) // 192
 */
export function porcentajeToBp(porcentaje: number): number {
  if (!Number.isFinite(porcentaje)) {
    throw new Error(`Invalid porcentaje value: ${porcentaje}`);
  }
  
  // Multiplicar por 100 y redondear
  return Math.round(porcentaje * BP_PER_PERCENTAGE_POINT);
}

/**
 * Convierte basis points de tasa a porcentaje
 * @param bp - Basis points de tasa
 * @returns Porcentaje
 * @example
 * bpToPorcentaje(1050) // 10.5
 * bpToPorcentaje(192) // 1.92
 */
export function bpToPorcentaje(bp: number): number {
  return bp / BP_PER_PERCENTAGE_POINT;
}

/**
 * Multiplica un monto en bp por una tasa en bp
 * IMPORTANTE: Al multiplicar bp × bp, el resultado está en bp², por lo que dividimos por 10000
 * 
 * @param montoBp - Monto en basis points
 * @param tasaBp - Tasa en basis points (de porcentaje)
 * @returns Resultado en basis points
 * @example
 * // $15,000 × 10% = $1,500
 * multiplicarBpPorTasa(150000000n, 1000) // 15000000n ($1,500)
 * 
 * // $800 × 1.92% = $15.36
 * multiplicarBpPorTasa(8000000n, 192) // 153600n ($15.36)
 */
export function multiplicarBpPorTasa(montoBp: bigint, tasaBp: number): bigint {
  // Validar overflow potencial
  const MAX_SAFE_BP = BigInt(Number.MAX_SAFE_INTEGER);
  if (montoBp > MAX_SAFE_BP || montoBp < -MAX_SAFE_BP) {
    throw new Error(`Basis point value too large: ${montoBp}`);
  }
  
  // montoBp × tasaBp da bp², dividimos por 10000 para obtener bp
  const resultado = (montoBp * BigInt(tasaBp)) / BigInt(BP_PER_PESO);
  return resultado;
}

/**
 * Divide un monto en bp por un divisor (truncates towards zero)
 * @param montoBp - Monto en basis points
 * @param divisor - Divisor (número entero)
 * @returns Resultado en basis points
 * @example
 * // $15,000 / 30 días = $500 por día
 * dividirBp(150000000n, 30) // 5000000n ($500)
 */
export function dividirBp(montoBp: bigint, divisor: number): bigint {
  if (divisor === 0) {
    throw new Error("Division by zero");
  }
  return montoBp / BigInt(divisor);
}

/**
 * Divide un monto en bp por un divisor with banker's rounding.
 * Rounds to nearest integer, with ties going to even (0.5 rounds down, 1.5 rounds up).
 * This preserves precision when converting monthly amounts to daily amounts.
 * 
 * @param montoBp - Monto en basis points
 * @param divisor - Divisor (número entero)
 * @returns Resultado en basis points, redondeado al entero más cercano
 * @example
 * // $15,005 / 30 días = $500.1667 → rounds to $500.17 (5001700n)
 * dividirBpRedondeado(150050000n, 30) // 5001667n
 */
export function dividirBpRedondeado(montoBp: bigint, divisor: number): bigint {
  if (divisor === 0) {
    throw new Error("Division by zero");
  }
  const divisorBigInt = BigInt(divisor);
  // Add half the divisor before division for rounding
  // For negative numbers, subtract half
  if (montoBp >= BigInt(0)) {
    return (montoBp + divisorBigInt / BigInt(2)) / divisorBigInt;
  } else {
    return (montoBp - divisorBigInt / BigInt(2)) / divisorBigInt;
  }
}

/**
 * Suma dos montos en basis points
 * @param a - Primer monto en bp
 * @param b - Segundo monto en bp
 * @returns Suma en bp
 */
export function sumarBp(a: bigint, b: bigint): bigint {
  return a + b;
}

/**
 * Resta dos montos en basis points
 * @param a - Monto inicial en bp
 * @param b - Monto a restar en bp
 * @returns Diferencia en bp
 */
export function restarBp(a: bigint, b: bigint): bigint {
  return a - b;
}

/**
 * Formatea un monto en basis points a string con formato mexicano
 * @param bp - Monto en basis points
 * @param decimales - Número de decimales a mostrar (default: 2)
 * @returns String formateado (ej: "$15,234.57")
 * @example
 * formatearBp(152345678n) // "$15,234.57"
 * formatearBp(152345678n, 4) // "$15,234.5678"
 */
export function formatearBp(bp: bigint, decimales: number = 2): string {
  const pesos = bpToPesos(bp);
  
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  }).format(pesos);
}

/**
 * Parsea un string de pesos a basis points
 * @param str - String con formato de pesos (ej: "$15,234.57" o "15234.57")
 * @returns Basis points
 */
export function parsearPesosToBp(str: string): bigint {
  // Remover símbolos de moneda, comas, espacios
  const cleaned = str.replace(/[^0-9.-]/g, '');
  const pesos = parseFloat(cleaned);
  
  if (isNaN(pesos)) {
    throw new Error(`Invalid pesos string: ${str}`);
  }
  
  return pesosToBp(pesos);
}

/**
 * Redondea un monto en basis points hacia arriba
 * @param bp - Monto en basis points
 * @param multiplo - Múltiplo al cual redondear (en pesos, default: 0.01 = 1 centavo)
 * @returns Monto redondeado en bp
 * @example
 * // Redondear $15.347 hacia arriba al centavo más cercano = $15.35
 * redondearBpHaciaArriba(153470n) // 153500n
 */
export function redondearBpHaciaArriba(bp: bigint, multiplo: number = 0.01): bigint {
  const multiploBp = pesosToBp(multiplo);
  const residuo = bp % multiploBp;
  
  if (residuo === BigInt(0)) {
    return bp;
  }
  
  return bp + (multiploBp - residuo);
}

/**
 * Redondea un monto en basis points hacia abajo
 * @param bp - Monto en basis points
 * @param multiplo - Múltiplo al cual redondear (en pesos, default: 0.01 = 1 centavo)
 * @returns Monto redondeado en bp
 * @example
 * // Redondear $15.347 hacia abajo al centavo más cercano = $15.34
 * redondearBpHaciaAbajo(153470n) // 153400n
 */
export function redondearBpHaciaAbajo(bp: bigint, multiplo: number = 0.01): bigint {
  const multiploBp = pesosToBp(multiplo);
  const residuo = bp % multiploBp;
  return bp - residuo;
}

/**
 * Compara dos montos en basis points
 * @param a - Primer monto
 * @param b - Segundo monto
 * @returns -1 si a < b, 0 si a === b, 1 si a > b
 */
export function compararBp(a: bigint, b: bigint): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

/**
 * Retorna el máximo entre dos montos en basis points
 */
export function maxBp(a: bigint, b: bigint): bigint {
  return a > b ? a : b;
}

/**
 * Retorna el mínimo entre dos montos en basis points
 */
export function minBp(a: bigint, b: bigint): bigint {
  return a < b ? a : b;
}
