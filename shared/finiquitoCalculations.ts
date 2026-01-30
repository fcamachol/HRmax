/**
 * Cálculos de Finiquito y Liquidación según Ley Federal del Trabajo (México)
 */

export interface FiniquitoInput {
  salarioDiario: number;
  fechaInicio: string; // Fecha de inicio laboral (YYYY-MM-DD)
  fechaTerminacion: string; // Fecha de terminación (YYYY-MM-DD)
  bajaType: string; // Tipo de baja
  diasAguinaldoPagados?: number; // Días de aguinaldo ya pagados en el año
  diasVacacionesTomadas?: number; // Días de vacaciones ya tomados en el año (LEGACY - usar saldoVacacionesKardex)

  // NUEVO: Saldo real de vacaciones desde el kardex
  // Este es el valor correcto a usar para finiquito (incluye carryover de años anteriores)
  saldoVacacionesKardex?: number;

  // Prima vacacional personalizada (si la empresa da más del 25%)
  primaVacacionalPct?: number;
}

export interface FiniquitoConcept {
  concepto: string;
  descripcion: string;
  calculo: string; // Explicación del cálculo
  monto: number;
}

export interface FiniquitoResult {
  conceptos: FiniquitoConcept[];
  total: number;
  desglose: {
    subtotalPercepciones: number;
    subtotalDeducciones: number;
    netoAPagar: number;
  };
  informacionLaboral: {
    salarioDiario: number;
    fechaInicio: string;
    fechaTerminacion: string;
    añosTrabajados: number;
    diasTrabajados: number;
  };
}

/**
 * Calcula los años trabajados entre dos fechas
 */
function calcularAñosTrabajados(fechaInicio: string, fechaFin: string): number {
  const inicio = new Date(fechaInicio);
  const fin = new Date(fechaFin);
  
  const diffTime = fin.getTime() - inicio.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  return diffDays / 365.25;
}

/**
 * Calcula los días trabajados entre dos fechas
 */
function calcularDiasTrabajados(fechaInicio: string, fechaFin: string): number {
  const inicio = new Date(fechaInicio);
  const fin = new Date(fechaFin);
  
  const diffTime = fin.getTime() - inicio.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Determina los días de aguinaldo según la antigüedad
 * Mínimo legal: 15 días. Muchas empresas dan más.
 */
function obtenerDiasAguinaldoAnual(): number {
  return 15; // Mínimo legal
}

/**
 * Determina los días de vacaciones según la antigüedad
 * LFT Art. 76 (REFORMADO 2024 - TABLA CORRECTA):
 * - Primer año de servicio (0-1 año): 12 días
 * - Segundo año de servicio (1-2 años): 14 días
 * - Tercer año de servicio (2-3 años): 16 días
 * - Cuarto año de servicio (3-4 años): 18 días
 * - Quinto al noveno año (4-9 años): 20 días
 * - A partir del décimo: +2 días cada 5 años (22, 24, 26...)
 */
function obtenerDiasVacaciones(años: number): number {
  if (años < 1) return 12;  // Primer año (0-1 año trabajado)
  if (años < 2) return 14;  // Segundo año (1-2 años trabajados)
  if (años < 3) return 16;  // Tercer año (2-3 años trabajados)
  if (años < 4) return 18;  // Cuarto año (3-4 años trabajados)
  if (años < 10) return 20; // Quinto al noveno año (4-9 años trabajados)
  
  // A partir del décimo año: 20 días base + 2 días cada 5 años después del quinto
  // Año 10-14: 22 días, Año 15-19: 24 días, etc.
  const quinqueniosAdicionales = Math.floor((años - 5) / 5);
  return 20 + (quinqueniosAdicionales * 2);
}

/**
 * Calcula el aguinaldo proporcional
 */
function calcularAguinaldoProporcional(
  salarioDiario: number,
  fechaTerminacion: string,
  diasPagados: number = 0
): FiniquitoConcept {
  const fechaFin = new Date(fechaTerminacion);
  const añoActual = fechaFin.getFullYear();
  const inicioAño = new Date(añoActual, 0, 1);
  
  // Días trabajados en el año actual
  const diffTime = fechaFin.getTime() - inicioAño.getTime();
  const diasTrabajadosEnAño = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  
  const diasAguinaldoAnual = obtenerDiasAguinaldoAnual();
  const diasProporcionales = (diasTrabajadosEnAño / 365) * diasAguinaldoAnual;
  const diasAPagar = diasProporcionales - diasPagados;
  
  const monto = salarioDiario * diasAPagar;
  
  return {
    concepto: "Aguinaldo Proporcional",
    descripcion: `${diasAPagar.toFixed(2)} días de aguinaldo proporcional`,
    calculo: `${diasTrabajadosEnAño} días trabajados / 365 × ${diasAguinaldoAnual} días - ${diasPagados} días pagados = ${diasAPagar.toFixed(2)} días × $${salarioDiario.toFixed(2)}`,
    monto: Math.round(monto * 100) / 100,
  };
}

/**
 * Calcula vacaciones proporcionales no gozadas
 * IMPORTANTE: Si se proporciona saldoKardex, se usa ese valor (incluye carryover)
 * Si no, se calcula proporcionalmente (método legacy)
 */
function calcularVacacionesProporcionales(
  salarioDiario: number,
  fechaInicio: string,
  fechaTerminacion: string,
  diasTomadas: number = 0,
  saldoKardex?: number
): FiniquitoConcept {
  // MÉTODO PREFERIDO: Usar saldo real del kardex
  // Esto incluye días de años anteriores que no se han disfrutado
  if (saldoKardex !== undefined && saldoKardex >= 0) {
    const monto = salarioDiario * saldoKardex;

    return {
      concepto: "Vacaciones Pendientes (Kardex)",
      descripcion: `${saldoKardex.toFixed(2)} días de vacaciones pendientes según kardex`,
      calculo: `Saldo kardex: ${saldoKardex.toFixed(2)} días × $${salarioDiario.toFixed(2)}`,
      monto: Math.round(monto * 100) / 100,
    };
  }

  // MÉTODO LEGACY: Cálculo proporcional (para compatibilidad)
  const años = calcularAñosTrabajados(fechaInicio, fechaTerminacion);
  const diasVacacionesAnuales = obtenerDiasVacaciones(años);

  // Calcular días proporcionales del último año
  const fechaFin = new Date(fechaTerminacion);
  const añoActual = fechaFin.getFullYear();
  const añoAniversario = new Date(añoActual, new Date(fechaInicio).getMonth(), new Date(fechaInicio).getDate());

  let diasTrabajadosDesdeAniversario = 0;
  if (fechaFin >= añoAniversario) {
    const diffTime = fechaFin.getTime() - añoAniversario.getTime();
    diasTrabajadosDesdeAniversario = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  } else {
    const añoAnterior = new Date(añoActual - 1, new Date(fechaInicio).getMonth(), new Date(fechaInicio).getDate());
    const diffTime = fechaFin.getTime() - añoAnterior.getTime();
    diasTrabajadosDesdeAniversario = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  const diasProporcionales = (diasTrabajadosDesdeAniversario / 365) * diasVacacionesAnuales;
  const diasAPagar = Math.max(0, diasProporcionales - diasTomadas);

  const monto = salarioDiario * diasAPagar;

  return {
    concepto: "Vacaciones Proporcionales",
    descripcion: `${diasAPagar.toFixed(2)} días de vacaciones no gozadas`,
    calculo: `${diasTrabajadosDesdeAniversario} días desde aniversario / 365 × ${diasVacacionesAnuales} días - ${diasTomadas} días tomados = ${diasAPagar.toFixed(2)} días × $${salarioDiario.toFixed(2)}`,
    monto: Math.round(monto * 100) / 100,
  };
}

/**
 * Calcula la prima vacacional (mínimo 25% del salario de vacaciones - Art. 80 LFT)
 * Acepta porcentaje personalizado si la empresa ofrece más del mínimo legal
 */
function calcularPrimaVacacional(
  vacacionesProporcionales: FiniquitoConcept,
  primaVacacionalPct: number = 25
): FiniquitoConcept {
  // Extraer los días de la descripción de vacaciones
  const diasMatch = vacacionesProporcionales.descripcion.match(/(\d+\.?\d*)/);
  const dias = diasMatch ? parseFloat(diasMatch[1]) : 0;

  // Asegurar mínimo del 25% según LFT
  const porcentajeAplicar = Math.max(25, primaVacacionalPct);
  const monto = vacacionesProporcionales.monto * (porcentajeAplicar / 100);

  return {
    concepto: "Prima Vacacional",
    descripcion: `${porcentajeAplicar}% sobre vacaciones (Art. 80 LFT)`,
    calculo: `$${vacacionesProporcionales.monto.toFixed(2)} × ${porcentajeAplicar}% = $${monto.toFixed(2)}`,
    monto: Math.round(monto * 100) / 100,
  };
}

/**
 * Calcula la prima de antigüedad (12 días por año trabajado)
 * Solo aplica en ciertos tipos de terminación
 */
function calcularPrimaAntiguedad(
  salarioDiario: number,
  fechaInicio: string,
  fechaTerminacion: string,
  bajaType: string
): FiniquitoConcept | null {
  // Prima de antigüedad aplica en:
  // - Despido injustificado
  // - Renuncia con causa (por falta del patrón)
  // - Cierre de empresa
  // - Incapacidad permanente
  // - Fallecimiento
  const tiposQueCubren = [
    'despido_injustificado',
    'renuncia_con_causa',
    'cierre_empresa',
    'incapacidad_permanente',
    'fallecimiento'
  ];
  
  if (!tiposQueCubren.includes(bajaType)) {
    return null;
  }
  
  const años = calcularAñosTrabajados(fechaInicio, fechaTerminacion);
  
  // La prima de antigüedad es de 12 días de salario por cada año de servicio
  // Topado a 2 veces el salario mínimo (aproximadamente $400 por día en 2024)
  const salarioMinimoGeneral = 248.93; // 2024
  const salarioTopado = Math.min(salarioDiario, salarioMinimoGeneral * 2);
  
  const monto = salarioTopado * 12 * años;
  
  return {
    concepto: "Prima de Antigüedad",
    descripcion: `12 días por año trabajado (Art. 162 LFT)`,
    calculo: `${años.toFixed(2)} años × 12 días × $${salarioTopado.toFixed(2)} (topado a 2× SM)`,
    monto: Math.round(monto * 100) / 100,
  };
}

/**
 * Calcula la indemnización constitucional (3 meses de salario)
 * Solo aplica en despido injustificado
 */
function calcularIndemnizacionConstitucional(
  salarioDiario: number,
  bajaType: string
): FiniquitoConcept | null {
  if (bajaType !== 'despido_injustificado') {
    return null;
  }
  
  const monto = salarioDiario * 90; // 3 meses = 90 días
  
  return {
    concepto: "Indemnización Constitucional",
    descripcion: "3 meses de salario (Art. 50 LFT)",
    calculo: `90 días × $${salarioDiario.toFixed(2)}`,
    monto: Math.round(monto * 100) / 100,
  };
}

/**
 * Calcula la indemnización de 20 días por año
 * Solo aplica en despido injustificado
 */
function calcularIndemnizacion20Dias(
  salarioDiario: number,
  fechaInicio: string,
  fechaTerminacion: string,
  bajaType: string
): FiniquitoConcept | null {
  if (bajaType !== 'despido_injustificado') {
    return null;
  }
  
  const años = calcularAñosTrabajados(fechaInicio, fechaTerminacion);
  const monto = salarioDiario * 20 * años;
  
  return {
    concepto: "Indemnización 20 Días por Año",
    descripcion: "20 días de salario por cada año trabajado (Art. 50 LFT)",
    calculo: `${años.toFixed(2)} años × 20 días × $${salarioDiario.toFixed(2)}`,
    monto: Math.round(monto * 100) / 100,
  };
}

/**
 * Función principal para calcular el finiquito completo
 */
export function calcularFiniquito(input: FiniquitoInput): FiniquitoResult {
  const conceptos: FiniquitoConcept[] = [];
  
  // Calcular información laboral
  const años = calcularAñosTrabajados(input.fechaInicio, input.fechaTerminacion);
  const dias = calcularDiasTrabajados(input.fechaInicio, input.fechaTerminacion);
  
  // 1. Aguinaldo proporcional
  const aguinaldo = calcularAguinaldoProporcional(
    input.salarioDiario,
    input.fechaTerminacion,
    input.diasAguinaldoPagados || 0
  );
  conceptos.push(aguinaldo);
  
  // 2. Vacaciones proporcionales
  // PRIORIDAD: Usar saldo del kardex si está disponible (incluye carryover)
  const vacaciones = calcularVacacionesProporcionales(
    input.salarioDiario,
    input.fechaInicio,
    input.fechaTerminacion,
    input.diasVacacionesTomadas || 0,
    input.saldoVacacionesKardex // Nuevo: saldo real del kardex
  );
  conceptos.push(vacaciones);

  // 3. Prima vacacional (usa porcentaje personalizado si existe)
  const primaVacacional = calcularPrimaVacacional(
    vacaciones,
    input.primaVacacionalPct || 25
  );
  conceptos.push(primaVacacional);
  
  // 4. Prima de antigüedad (si aplica)
  const primaAntiguedad = calcularPrimaAntiguedad(
    input.salarioDiario,
    input.fechaInicio,
    input.fechaTerminacion,
    input.bajaType
  );
  if (primaAntiguedad) {
    conceptos.push(primaAntiguedad);
  }
  
  // 5. Indemnización constitucional (si aplica)
  const indemnizacionConst = calcularIndemnizacionConstitucional(
    input.salarioDiario,
    input.bajaType
  );
  if (indemnizacionConst) {
    conceptos.push(indemnizacionConst);
  }
  
  // 6. Indemnización 20 días por año (si aplica)
  const indemnizacion20 = calcularIndemnizacion20Dias(
    input.salarioDiario,
    input.fechaInicio,
    input.fechaTerminacion,
    input.bajaType
  );
  if (indemnizacion20) {
    conceptos.push(indemnizacion20);
  }
  
  // Calcular totales
  const total = conceptos.reduce((sum, c) => sum + c.monto, 0);
  
  return {
    conceptos,
    total: Math.round(total * 100) / 100,
    desglose: {
      subtotalPercepciones: Math.round(total * 100) / 100,
      subtotalDeducciones: 0, // Por ahora sin deducciones
      netoAPagar: Math.round(total * 100) / 100,
    },
    informacionLaboral: {
      salarioDiario: input.salarioDiario,
      fechaInicio: input.fechaInicio,
      fechaTerminacion: input.fechaTerminacion,
      añosTrabajados: Math.round(años * 100) / 100,
      diasTrabajados: dias,
    },
  };
}

/**
 * Determina el tipo de documento según el tipo de baja
 */
export function obtenerTipoDocumento(bajaType: string): 'finiquito' | 'liquidacion' {
  const tiposLiquidacion = [
    'despido_injustificado',
    'renuncia_con_causa',
    'cierre_empresa',
  ];
  
  return tiposLiquidacion.includes(bajaType) ? 'liquidacion' : 'finiquito';
}
