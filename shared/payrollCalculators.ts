/**
 * Built-in Concept Calculators for HRMax Payroll Engine
 *
 * These calculators handle common payroll concepts with proper
 * tax treatment, legal compliance, and audit trails.
 */

import {
  PayrollContext,
  CalculatedConcept,
  ConceptCalculator,
  ValidationResult,
} from './payrollEngineV2';

import {
  pesosToBp,
  bpToPesos,
  porcentajeToBp,
  multiplicarBpPorTasa,
  dividirBp,
  sumarBp,
  restarBp,
  compararBp,
  minBp,
  maxBp,
} from './basisPoints';

import {
  calcularISR2026,
  calcularSubsidio2026,
  calcularIMSSTrabajador,
  calcularSDI,
  calcularSBC,
  calcularHorasExtra as calcularHorasExtraEngine,
  calcularAguinaldo as calcularAguinaldoEngine,
  calcularPrimaVacacional as calcularPrimaVacacionalEngine,
  CONFIG_FISCAL_2026,
} from './payrollEngine';

// ===================== PERCEPCIONES =====================

/**
 * Calculator: Base Salary (Sueldo/Salario)
 * SAT: 001
 */
export class SalarioBaseCalculator implements ConceptCalculator {
  async calculate(context: PayrollContext): Promise<CalculatedConcept | null> {
    const montoBp = multiplicarBpPorTasa(
      context.calculations.salarioDiarioBp,
      context.calculations.diasTrabajados * 10000
    );

    return {
      conceptoId: 'SALARIO_BASE',
      codigo: '001',
      nombre: 'Sueldo',
      montoBp,
      gravadoBp: montoBp,
      exentoBp: 0n,
      satClave: '001',
      unidad: context.calculations.diasTrabajados,
      breakdown: {
        formula: 'salario_diario × dias_trabajados',
        variables: {
          salario_diario: bpToPesos(context.calculations.salarioDiarioBp),
          dias_trabajados: context.calculations.diasTrabajados,
        },
      },
    };
  }
}

/**
 * Calculator: Overtime (Horas Extra)
 * SAT: 019
 */
export class HorasExtraCalculator implements ConceptCalculator {
  async calculate(context: PayrollContext): Promise<CalculatedConcept | null> {
    const incident = context.incidents.find((i) => i.tipo === 'horas_extra');
    if (!incident || !incident.datos) return null;

    const { horasDobles = 0, horasTriples = 0 } = incident.datos;
    if (horasDobles === 0 && horasTriples === 0) return null;

    const salarioHoraBp = dividirBp(context.calculations.salarioDiarioBp, 8n);

    const result = calcularHorasExtraEngine(
      salarioHoraBp,
      horasDobles,
      horasTriples,
      context.calculations.totalPerceptionesBp
    );

    return {
      conceptoId: 'HORAS_EXTRA',
      codigo: '019',
      nombre: 'Horas Extra',
      montoBp: result.totalBp,
      gravadoBp: result.gravadoBp,
      exentoBp: result.exentoBp,
      satClave: '019',
      unidad: horasDobles + horasTriples,
      breakdown: {
        steps: [
          {
            step: 1,
            description: 'Calcular salario por hora',
            operation: 'salario_diario / 8',
            input: bpToPesos(context.calculations.salarioDiarioBp),
            output: bpToPesos(salarioHoraBp),
          },
          {
            step: 2,
            description: 'Pago horas dobles (200%)',
            operation: 'salario_hora × 2 × horas_dobles',
            input: { salario_hora: bpToPesos(salarioHoraBp), horas: horasDobles },
            output: bpToPesos(result.pagoDoblesBp),
          },
          {
            step: 3,
            description: 'Pago horas triples (300%)',
            operation: 'salario_hora × 3 × horas_triples',
            input: { salario_hora: bpToPesos(salarioHoraBp), horas: horasTriples },
            output: bpToPesos(result.pagoTriplesBp),
          },
          {
            step: 4,
            description: 'Calcular exención (50% salario mensual, max 9 hrs)',
            operation: 'Aplicar límites fiscales',
            input: { total: bpToPesos(result.totalBp) },
            output: {
              exento: bpToPesos(result.exentoBp),
              gravado: bpToPesos(result.gravadoBp),
            },
          },
        ],
      },
    };
  }

  async validate(context: PayrollContext, result: CalculatedConcept): Promise<ValidationResult> {
    const errors = [];
    const warnings = [];

    const incident = context.incidents.find((i) => i.tipo === 'horas_extra');
    if (incident?.datos?.horasDobles > 9) {
      warnings.push({
        code: 'HORAS_DOBLES_EXCEDEN_LIMITE',
        message: `Horas dobles (${incident.datos.horasDobles}) exceden el límite recomendado de 9 horas semanales`,
        severity: 'warning' as const,
        field: 'horasDobles',
        value: incident.datos.horasDobles,
      });
    }

    return { valid: errors.length === 0, errors, warnings };
  }
}

/**
 * Calculator: Sunday Premium (Prima Dominical)
 * SAT: 020
 */
export class PrimaDominicalCalculator implements ConceptCalculator {
  async calculate(context: PayrollContext): Promise<CalculatedConcept | null> {
    const incident = context.incidents.find((i) => i.tipo === 'domingos_trabajados');
    if (!incident || incident.cantidad === 0) return null;

    const domingosTrabajados = incident.cantidad;
    const salarioMinimoBp = pesosToBp(CONFIG_FISCAL_2026.salarioMinimo.general);

    // 25% extra for Sunday work (LFT Art. 71)
    const pagoBp = multiplicarBpPorTasa(
      context.calculations.salarioDiarioBp,
      domingosTrabajados * 12500 // 1.25 × 10000
    );

    // Exempt up to 1 minimum wage per Sunday
    const limiteExentoBp = multiplicarBpPorTasa(salarioMinimoBp, domingosTrabajados * 10000);

    const exentoBp = minBp(pagoBp, limiteExentoBp);
    const gravadoBp = restarBp(pagoBp, exentoBp);

    return {
      conceptoId: 'PRIMA_DOMINICAL',
      codigo: '020',
      nombre: 'Prima Dominical',
      montoBp: pagoBp,
      gravadoBp,
      exentoBp,
      satClave: '020',
      unidad: domingosTrabajados,
      tasa: 25,
      breakdown: {
        formula: 'salario_diario × 1.25 × domingos_trabajados',
        variables: {
          salario_diario: bpToPesos(context.calculations.salarioDiarioBp),
          domingos: domingosTrabajados,
          pago_total: bpToPesos(pagoBp),
          limite_exento: bpToPesos(limiteExentoBp),
          exento: bpToPesos(exentoBp),
          gravado: bpToPesos(gravadoBp),
        },
      },
    };
  }
}

/**
 * Calculator: Holiday Pay (Días Festivos Trabajados)
 * SAT: 038 (Otros ingresos por salarios)
 */
export class DiasFestivosCalculator implements ConceptCalculator {
  async calculate(context: PayrollContext): Promise<CalculatedConcept | null> {
    const incident = context.incidents.find((i) => i.tipo === 'festivos_trabajados');
    if (!incident || incident.cantidad === 0) return null;

    const festivosTrabajados = incident.cantidad;
    const salarioMinimoBp = pesosToBp(CONFIG_FISCAL_2026.salarioMinimo.general);

    // 200% of daily salary (LFT Art. 75)
    const pagoBp = multiplicarBpPorTasa(
      context.calculations.salarioDiarioBp,
      festivosTrabajados * 20000 // 2.0 × 10000
    );

    // Exempt up to 1 minimum wage per holiday
    const limiteExentoBp = multiplicarBpPorTasa(salarioMinimoBp, festivosTrabajados * 10000);

    const exentoBp = minBp(pagoBp, limiteExentoBp);
    const gravadoBp = restarBp(pagoBp, exentoBp);

    return {
      conceptoId: 'DIAS_FESTIVOS',
      codigo: '038',
      nombre: 'Días Festivos Trabajados',
      montoBp: pagoBp,
      gravadoBp,
      exentoBp,
      satClave: '038',
      unidad: festivosTrabajados,
      tasa: 200,
      breakdown: {
        formula: 'salario_diario × 2.0 × festivos_trabajados',
        variables: {
          salario_diario: bpToPesos(context.calculations.salarioDiarioBp),
          festivos: festivosTrabajados,
        },
      },
    };
  }
}

/**
 * Calculator: Meal Vouchers (Vales de Despensa)
 * SAT: 029
 */
export class ValesDespensaCalculator implements ConceptCalculator {
  async calculate(context: PayrollContext): Promise<CalculatedConcept | null> {
    const salarioMinimoBp = pesosToBp(CONFIG_FISCAL_2026.salarioMinimo.general);

    // 40% of minimum wage × days worked
    const valesBp = multiplicarBpPorTasa(
      salarioMinimoBp,
      context.calculations.diasTrabajados * 4000 // 0.40 × 10000
    );

    // Fully exempt if within 40% limit
    return {
      conceptoId: 'VALES_DESPENSA',
      codigo: '029',
      nombre: 'Vales de Despensa',
      montoBp: valesBp,
      gravadoBp: 0n,
      exentoBp: valesBp,
      satClave: '029',
      unidad: context.calculations.diasTrabajados,
      tasa: 40,
      breakdown: {
        formula: 'salario_minimo × 0.40 × dias_trabajados',
        variables: {
          salario_minimo: bpToPesos(salarioMinimoBp),
          dias_trabajados: context.calculations.diasTrabajados,
          total: bpToPesos(valesBp),
        },
      },
    };
  }
}

/**
 * Calculator: Aguinaldo (Year-end Bonus)
 * SAT: 002
 */
export class AguinaldoCalculator implements ConceptCalculator {
  async calculate(context: PayrollContext): Promise<CalculatedConcept | null> {
    // Only calculate in December or extraordinary payroll
    if (context.period.mes !== 12) return null;

    const diasAguinaldo = 15; // Legal minimum
    const diasTrabajadosAnio = 365; // Calculate based on actual year

    const result = calcularAguinaldoEngine(
      context.calculations.salarioDiarioBp,
      diasAguinaldo,
      diasTrabajadosAnio,
      true // Full aguinaldo
    );

    return {
      conceptoId: 'AGUINALDO',
      codigo: '002',
      nombre: 'Aguinaldo',
      montoBp: result.aguinaldoBp,
      gravadoBp: result.gravadoBp,
      exentoBp: result.exentoBp,
      satClave: '002',
      unidad: result.diasProporcionales,
      breakdown: {
        formula: 'salario_diario × dias_aguinaldo',
        variables: {
          salario_diario: bpToPesos(context.calculations.salarioDiarioBp),
          dias_aguinaldo: diasAguinaldo,
          limite_exento: '30 UMAs',
        },
      },
    };
  }
}

/**
 * Calculator: Vacation Premium (Prima Vacacional)
 * SAT: 021
 */
export class PrimaVacacionalCalculator implements ConceptCalculator {
  async calculate(context: PayrollContext): Promise<CalculatedConcept | null> {
    // Only when vacation incident exists
    const incident = context.incidents.find((i) => i.tipo === 'vacaciones');
    if (!incident || incident.cantidad === 0) return null;

    const diasVacaciones = incident.cantidad;

    const result = calcularPrimaVacacionalEngine(
      context.calculations.salarioDiarioBp,
      diasVacaciones,
      25 // 25% minimum
    );

    return {
      conceptoId: 'PRIMA_VACACIONAL',
      codigo: '021',
      nombre: 'Prima Vacacional',
      montoBp: result.primaBp,
      gravadoBp: result.gravadoBp,
      exentoBp: result.exentoBp,
      satClave: '021',
      unidad: diasVacaciones,
      tasa: 25,
      breakdown: {
        formula: 'salario_diario × dias_vacaciones × 0.25',
        variables: {
          salario_diario: bpToPesos(context.calculations.salarioDiarioBp),
          dias_vacaciones: diasVacaciones,
          limite_exento: '15 UMAs',
        },
      },
    };
  }
}

// ===================== DEDUCCIONES =====================

/**
 * Calculator: Absences (Faltas)
 * SAT: 020 (Ausencia/Ausentismo)
 */
export class FaltasCalculator implements ConceptCalculator {
  async calculate(context: PayrollContext): Promise<CalculatedConcept | null> {
    const incident = context.incidents.find((i) => i.tipo === 'faltas');
    if (!incident || incident.cantidad === 0) return null;

    const diasFalta = incident.cantidad;

    // Deduct salary for absent days
    const descuentoBp = multiplicarBpPorTasa(
      context.calculations.salarioDiarioBp,
      diasFalta * 10000
    );

    return {
      conceptoId: 'FALTAS',
      codigo: '020',
      nombre: 'Descuento por Faltas',
      montoBp: descuentoBp,
      gravadoBp: descuentoBp,
      exentoBp: 0n,
      satClave: '020',
      unidad: diasFalta,
      breakdown: {
        formula: 'salario_diario × dias_falta',
        variables: {
          salario_diario: bpToPesos(context.calculations.salarioDiarioBp),
          dias_falta: diasFalta,
        },
      },
    };
  }
}

/**
 * Calculator: Sick Leave (Incapacidades)
 * SAT: 006 (Descuento por incapacidad)
 */
export class IncapacidadesCalculator implements ConceptCalculator {
  async calculate(context: PayrollContext): Promise<CalculatedConcept | null> {
    const incident = context.incidents.find((i) => i.tipo === 'incapacidades');
    if (!incident || incident.cantidad === 0) return null;

    const diasIncapacidad = incident.cantidad;
    const tipoIncapacidad = incident.datos?.tipoIncapacidad || 'enfermedad_general';

    let diasPagoPatron = 0;
    let porcentajePago = 60;

    if (tipoIncapacidad === 'riesgo_trabajo') {
      // Work risk: IMSS pays from day 1 at 100%
      porcentajePago = 100;
      diasPagoPatron = 0;
    } else if (tipoIncapacidad === 'maternidad') {
      // Maternity: IMSS pays 100% from day 1
      porcentajePago = 100;
      diasPagoPatron = 0;
    } else {
      // General illness: employer pays 100% days 1-3, IMSS 60% from day 4
      diasPagoPatron = Math.min(3, diasIncapacidad);
      porcentajePago = 60;
    }

    // Discount: full salary for all sick days
    const descuentoBp = multiplicarBpPorTasa(
      context.calculations.salarioDiarioBp,
      diasIncapacidad * 10000
    );

    return {
      conceptoId: 'INCAPACIDADES',
      codigo: '006',
      nombre: 'Descuento por Incapacidad',
      montoBp: descuentoBp,
      gravadoBp: descuentoBp,
      exentoBp: 0n,
      satClave: '006',
      unidad: diasIncapacidad,
      breakdown: {
        variables: {
          dias_incapacidad: diasIncapacidad,
          tipo: tipoIncapacidad,
          dias_pago_patron: diasPagoPatron,
          porcentaje_pago_imss: porcentajePago,
          descuento_total: bpToPesos(descuentoBp),
        },
      },
    };
  }
}

/**
 * Calculator: ISR (Income Tax)
 * SAT: 002
 */
export class ISRCalculator implements ConceptCalculator {
  async calculate(context: PayrollContext): Promise<CalculatedConcept | null> {
    const baseGravableBp = context.calculations.totalPerceptionesGravadasBp;

    if (compararBp(baseGravableBp, 0n) <= 0) {
      return null; // No taxable income
    }

    const result = calcularISR2026(baseGravableBp, context.period.frecuencia, context.period.mes);

    return {
      conceptoId: 'ISR',
      codigo: '002',
      nombre: 'ISR',
      montoBp: result.isrRetenidoBp,
      gravadoBp: result.isrRetenidoBp,
      exentoBp: 0n,
      satClave: '002',
      breakdown: {
        variables: {
          base_gravable: bpToPesos(baseGravableBp),
          isr_causado: bpToPesos(result.isrBp),
          subsidio_empleo: bpToPesos(result.subsidioEmpleoBp),
          isr_retenido: bpToPesos(result.isrRetenidoBp),
          tramo_fiscal: result.tramoAplicado,
        },
      },
    };
  }
}

/**
 * Calculator: IMSS Worker (Social Security)
 * SAT: 001 (Seguridad Social)
 */
export class IMSSCalculator implements ConceptCalculator {
  async calculate(context: PayrollContext): Promise<CalculatedConcept | null> {
    const result = calcularIMSSTrabajador(
      context.calculations.sbcBp,
      context.calculations.diasTrabajados
    );

    if (compararBp(result.totalBp, 0n) <= 0) {
      return null;
    }

    return {
      conceptoId: 'IMSS',
      codigo: '001',
      nombre: 'Cuotas IMSS Trabajador',
      montoBp: result.totalBp,
      gravadoBp: result.totalBp,
      exentoBp: 0n,
      satClave: '001',
      breakdown: {
        variables: {
          sdi: bpToPesos(context.calculations.sdiBp),
          sbc: bpToPesos(context.calculations.sbcBp),
          dias_trabajados: context.calculations.diasTrabajados,
          desglose: result.desglose.map((d) => ({
            concepto: d.concepto,
            monto: bpToPesos(d.montoBp),
          })),
          total: bpToPesos(result.totalBp),
        },
      },
    };
  }
}

/**
 * Calculator: Loan Payment (Descuento por Préstamo)
 * SAT: 106 (Préstamos)
 */
export class PrestamoCalculator implements ConceptCalculator {
  async calculate(context: PayrollContext): Promise<CalculatedConcept | null> {
    // TODO: Load loan data from employee record
    // For now, return null
    return null;
  }

  async validate(context: PayrollContext, result: CalculatedConcept): Promise<ValidationResult> {
    const errors = [];
    const warnings = [];

    // Validate that loan deduction doesn't exceed 30% of net pay
    const netBeforeLoan = restarBp(
      context.calculations.totalPerceptionesBp,
      context.calculations.totalDeduccionesBp
    );

    const limit30Pct = dividirBp(netBeforeLoan, 3n);

    if (compararBp(result.montoBp, limit30Pct) > 0) {
      errors.push({
        code: 'LOAN_EXCEEDS_30PCT',
        message: `Loan payment (${bpToPesos(result.montoBp)}) exceeds 30% limit (${bpToPesos(limit30Pct)})`,
        severity: 'error',
        value: bpToPesos(result.montoBp),
      });
    }

    return { valid: errors.length === 0, errors, warnings };
  }
}

/**
 * Calculator: Alimony (Pensión Alimenticia)
 * SAT: 007
 */
export class PensionAlimenticiaCalculator implements ConceptCalculator {
  async calculate(context: PayrollContext): Promise<CalculatedConcept | null> {
    // TODO: Load alimony data from employee record
    // For now, return null
    return null;
  }

  async validate(context: PayrollContext, result: CalculatedConcept): Promise<ValidationResult> {
    // Alimony can exceed normal limits (court order)
    return { valid: true, errors: [], warnings: [] };
  }
}

// ===================== EXPORT ALL CALCULATORS =====================

export const BUILTIN_CALCULATORS = {
  // Perceptions
  SALARIO_BASE: new SalarioBaseCalculator(),
  HORAS_EXTRA: new HorasExtraCalculator(),
  PRIMA_DOMINICAL: new PrimaDominicalCalculator(),
  DIAS_FESTIVOS: new DiasFestivosCalculator(),
  VALES_DESPENSA: new ValesDespensaCalculator(),
  AGUINALDO: new AguinaldoCalculator(),
  PRIMA_VACACIONAL: new PrimaVacacionalCalculator(),

  // Deductions
  FALTAS: new FaltasCalculator(),
  INCAPACIDADES: new IncapacidadesCalculator(),
  ISR: new ISRCalculator(),
  IMSS: new IMSSCalculator(),
  PRESTAMO: new PrestamoCalculator(),
  PENSION_ALIMENTICIA: new PensionAlimenticiaCalculator(),
};
