/**
 * Cálculos de Liquidaciones y Finiquitos según la Ley Federal del Trabajo de México
 */

interface CalculoBase {
  salarioDiario: number;
  fechaIngreso: Date;
  fechaSalida: Date;
  salarioMensual: number;
}

interface ConceptoLiquidacion {
  concepto: string;
  formula: string;
  base: number;
  cantidad: number;
  monto: number;
}

interface ResultadoLiquidacion {
  conceptos: ConceptoLiquidacion[];
  total: number;
  tipo: 'finiquito' | 'liquidacion_injustificada' | 'liquidacion_justificada';
  yearsWorked: number;
}

/**
 * Calcula años trabajados con decimales
 */
function calcularAntiguedad(fechaIngreso: Date, fechaSalida: Date): number {
  const diffMs = fechaSalida.getTime() - fechaIngreso.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays / 365.25;
}

/**
 * Calcula días trabajados en el periodo actual (para salarios pendientes)
 */
function calcularDiasTrabajadosPeriodo(fechaSalida: Date): number {
  const diaDelMes = fechaSalida.getDate();
  return diaDelMes;
}

/**
 * Calcula aguinaldo proporcional
 * Base: 15 días de salario mínimo anual (LFT Art. 87)
 */
function calcularAguinaldoProporcional(salarioDiario: number, fechaIngreso: Date, fechaSalida: Date): ConceptoLiquidacion {
  const diasDelAnio = 365;
  const diasAguinaldo = 15;
  
  // Días trabajados en el año actual
  const inicioAnio = new Date(fechaSalida.getFullYear(), 0, 1);
  const fechaInicio = fechaIngreso > inicioAnio ? fechaIngreso : inicioAnio;
  const diasTrabajadosAnio = Math.floor((fechaSalida.getTime() - fechaInicio.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  
  const aguinaldoProporcional = (diasAguinaldo / diasDelAnio) * diasTrabajadosAnio * salarioDiario;
  
  return {
    concepto: "Aguinaldo Proporcional",
    formula: `(${diasAguinaldo} días / ${diasDelAnio}) × ${diasTrabajadosAnio} días × $${salarioDiario.toFixed(2)}`,
    base: salarioDiario,
    cantidad: (diasAguinaldo / diasDelAnio) * diasTrabajadosAnio,
    monto: aguinaldoProporcional,
  };
}

/**
 * Calcula vacaciones proporcionales
 * Base: Según años de antigüedad (LFT Art. 76)
 * - 1 año: 12 días
 * - 2 años: 14 días
 * - 3 años: 16 días
 * - 4 años: 18 días
 * - 5-9 años: 20 días
 * - 10-14 años: 22 días
 * - 15-19 años: 24 días
 * - 20-24 años: 26 días
 * - 25-29 años: 28 días
 * - 30+ años: 30 días
 */
function obtenerDiasVacaciones(antiguedad: number): number {
  if (antiguedad < 1) return 12;
  if (antiguedad < 2) return 12;
  if (antiguedad < 3) return 14;
  if (antiguedad < 4) return 16;
  if (antiguedad < 5) return 18;
  if (antiguedad < 10) return 20;
  if (antiguedad < 15) return 22;
  if (antiguedad < 20) return 24;
  if (antiguedad < 25) return 26;
  if (antiguedad < 30) return 28;
  return 30;
}

function calcularVacacionesProporcionales(salarioDiario: number, fechaIngreso: Date, fechaSalida: Date): ConceptoLiquidacion {
  const antiguedad = calcularAntiguedad(fechaIngreso, fechaSalida);
  const diasVacaciones = obtenerDiasVacaciones(antiguedad);
  
  // Días trabajados en el año actual
  const inicioAnio = new Date(fechaSalida.getFullYear(), 0, 1);
  const fechaInicio = fechaIngreso > inicioAnio ? fechaIngreso : inicioAnio;
  const diasTrabajadosAnio = Math.floor((fechaSalida.getTime() - fechaInicio.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  
  const vacacionesProporcionales = (diasVacaciones / 365) * diasTrabajadosAnio * salarioDiario;
  
  return {
    concepto: "Vacaciones Proporcionales",
    formula: `(${diasVacaciones} días / 365) × ${diasTrabajadosAnio} días × $${salarioDiario.toFixed(2)}`,
    base: salarioDiario,
    cantidad: (diasVacaciones / 365) * diasTrabajadosAnio,
    monto: vacacionesProporcionales,
  };
}

/**
 * Calcula prima vacacional (25% de vacaciones según LFT Art. 80)
 */
function calcularPrimaVacacional(salarioDiario: number, fechaIngreso: Date, fechaSalida: Date): ConceptoLiquidacion {
  const vacaciones = calcularVacacionesProporcionales(salarioDiario, fechaIngreso, fechaSalida);
  const primaVacacional = vacaciones.monto * 0.25;
  
  return {
    concepto: "Prima Vacacional (25%)",
    formula: `${vacaciones.cantidad.toFixed(2)} días × 25% × $${salarioDiario.toFixed(2)}`,
    base: salarioDiario,
    cantidad: vacaciones.cantidad * 0.25,
    monto: primaVacacional,
  };
}

/**
 * Calcula saldo de días trabajados no pagados
 */
function calcularSaldoDiasTrabajados(salarioDiario: number, fechaSalida: Date): ConceptoLiquidacion {
  const diasTrabajados = calcularDiasTrabajadosPeriodo(fechaSalida);
  const monto = diasTrabajados * salarioDiario;
  
  return {
    concepto: "Saldo de Días Trabajados",
    formula: `${diasTrabajados} días × $${salarioDiario.toFixed(2)}`,
    base: salarioDiario,
    cantidad: diasTrabajados,
    monto: monto,
  };
}

/**
 * Calcula indemnización constitucional (3 meses de salario - LFT Art. 50)
 */
function calcularIndemnizacionConstitucional(salarioDiario: number): ConceptoLiquidacion {
  const mesesIndemnizacion = 3;
  const diasPorMes = 30;
  const monto = salarioDiario * diasPorMes * mesesIndemnizacion;
  
  return {
    concepto: "Indemnización Constitucional",
    formula: `${mesesIndemnizacion} meses × 30 días × $${salarioDiario.toFixed(2)}`,
    base: salarioDiario,
    cantidad: diasPorMes * mesesIndemnizacion,
    monto: monto,
  };
}

/**
 * Calcula prima de antigüedad (12 días por año - LFT Art. 162)
 */
function calcularPrimaAntiguedad(salarioDiario: number, fechaIngreso: Date, fechaSalida: Date): ConceptoLiquidacion {
  const antiguedad = calcularAntiguedad(fechaIngreso, fechaSalida);
  const diasPorAnio = 12;
  const cantidad = antiguedad * diasPorAnio;
  const monto = cantidad * salarioDiario;
  
  return {
    concepto: "Prima de Antigüedad",
    formula: `${antiguedad.toFixed(2)} años × ${diasPorAnio} días × $${salarioDiario.toFixed(2)}`,
    base: salarioDiario,
    cantidad: cantidad,
    monto: monto,
  };
}

/**
 * Calcula 20 días por año trabajado (LFT Art. 50)
 */
function calcularVeinteDiasPorAnio(salarioDiario: number, fechaIngreso: Date, fechaSalida: Date): ConceptoLiquidacion {
  const antiguedad = calcularAntiguedad(fechaIngreso, fechaSalida);
  const diasPorAnio = 20;
  const cantidad = antiguedad * diasPorAnio;
  const monto = cantidad * salarioDiario;
  
  return {
    concepto: "20 Días por Año Trabajado",
    formula: `${antiguedad.toFixed(2)} años × ${diasPorAnio} días × $${salarioDiario.toFixed(2)}`,
    base: salarioDiario,
    cantidad: cantidad,
    monto: monto,
  };
}

/**
 * Calcula FINIQUITO (renuncia voluntaria)
 */
export function calcularFiniquito(datos: CalculoBase): ResultadoLiquidacion {
  const { salarioDiario, fechaIngreso, fechaSalida } = datos;
  
  const conceptos: ConceptoLiquidacion[] = [
    calcularSaldoDiasTrabajados(salarioDiario, fechaSalida),
    calcularAguinaldoProporcional(salarioDiario, fechaIngreso, fechaSalida),
    calcularVacacionesProporcionales(salarioDiario, fechaIngreso, fechaSalida),
    calcularPrimaVacacional(salarioDiario, fechaIngreso, fechaSalida),
  ];
  
  const total = conceptos.reduce((sum, concepto) => sum + concepto.monto, 0);
  const yearsWorked = calcularAntiguedad(fechaIngreso, fechaSalida);
  
  return {
    conceptos,
    total,
    tipo: 'finiquito',
    yearsWorked,
  };
}

/**
 * Calcula LIQUIDACIÓN POR DESPIDO INJUSTIFICADO
 * Incluye indemnización constitucional, prima de antigüedad y 20 días por año
 */
export function calcularLiquidacionInjustificada(datos: CalculoBase): ResultadoLiquidacion {
  const { salarioDiario, fechaIngreso, fechaSalida } = datos;
  
  const conceptos: ConceptoLiquidacion[] = [
    calcularSaldoDiasTrabajados(salarioDiario, fechaSalida),
    calcularAguinaldoProporcional(salarioDiario, fechaIngreso, fechaSalida),
    calcularVacacionesProporcionales(salarioDiario, fechaIngreso, fechaSalida),
    calcularPrimaVacacional(salarioDiario, fechaIngreso, fechaSalida),
    calcularIndemnizacionConstitucional(salarioDiario),
    calcularPrimaAntiguedad(salarioDiario, fechaIngreso, fechaSalida),
    calcularVeinteDiasPorAnio(salarioDiario, fechaIngreso, fechaSalida),
  ];
  
  const total = conceptos.reduce((sum, concepto) => sum + concepto.monto, 0);
  const yearsWorked = calcularAntiguedad(fechaIngreso, fechaSalida);
  
  return {
    conceptos,
    total,
    tipo: 'liquidacion_injustificada',
    yearsWorked,
  };
}

/**
 * Calcula LIQUIDACIÓN POR DESPIDO JUSTIFICADO
 * Solo incluye prestaciones proporcionales y prima de antigüedad (si aplica)
 * NO incluye indemnización ni 20 días por año
 */
export function calcularLiquidacionJustificada(datos: CalculoBase): ResultadoLiquidacion {
  const { salarioDiario, fechaIngreso, fechaSalida } = datos;
  
  const conceptos: ConceptoLiquidacion[] = [
    calcularSaldoDiasTrabajados(salarioDiario, fechaSalida),
    calcularAguinaldoProporcional(salarioDiario, fechaIngreso, fechaSalida),
    calcularVacacionesProporcionales(salarioDiario, fechaIngreso, fechaSalida),
    calcularPrimaVacacional(salarioDiario, fechaIngreso, fechaSalida),
    calcularPrimaAntiguedad(salarioDiario, fechaIngreso, fechaSalida),
  ];
  
  const total = conceptos.reduce((sum, concepto) => sum + concepto.monto, 0);
  const yearsWorked = calcularAntiguedad(fechaIngreso, fechaSalida);
  
  return {
    conceptos,
    total,
    tipo: 'liquidacion_justificada',
    yearsWorked,
  };
}

// Mantener compatibilidad con código existente
export function calcularLiquidacion(datos: CalculoBase): ResultadoLiquidacion {
  return calcularLiquidacionInjustificada(datos);
}
