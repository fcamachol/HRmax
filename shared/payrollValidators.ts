/**
 * Built-in Validation Rules for HRMax Payroll Engine
 *
 * NOI-level strict validations to ensure legal compliance
 * and data integrity.
 */

import {
  PayrollContext,
  ValidationRule,
  ValidationResult,
  ValidationError,
  ValidationWarning,
} from './payrollEngineV2';

import { pesosToBp, bpToPesos, compararBp, dividirBp } from './basisPoints';

import { CONFIG_FISCAL_2026, calcularSBC } from './payrollEngine';

// ===================== PRE-CALCULATION VALIDATORS =====================

/**
 * Validate employee is active
 */
export class EmpleadoActivoValidator implements ValidationRule {
  id = 'empleado_activo';
  name = 'Empleado Activo';
  type = 'pre' as const;
  severity = 'error' as const;
  code = 'EMPLEADO_INACTIVO';
  message = 'El empleado debe estar activo para calcular nómina';

  async validate(context: PayrollContext): Promise<ValidationResult> {
    if (context.employee.estatus !== 'activo') {
      return {
        valid: false,
        errors: [
          {
            code: this.code,
            message: `Empleado ${context.employee.numeroEmpleado} no está activo (estatus: ${context.employee.estatus})`,
            severity: this.severity,
            field: 'employee.estatus',
            value: context.employee.estatus,
          },
        ],
        warnings: [],
      };
    }

    return { valid: true, errors: [], warnings: [] };
  }
}

/**
 * Validate salary meets minimum wage
 */
export class SalarioMinimoValidator implements ValidationRule {
  id = 'salario_minimo';
  name = 'Salario Mínimo Legal';
  type = 'pre' as const;
  severity = 'error' as const;
  code = 'SALARIO_MENOR_MINIMO';
  message = 'El salario debe ser mayor o igual al mínimo legal';

  async validate(context: PayrollContext): Promise<ValidationResult> {
    const salarioMinimoBp = pesosToBp(CONFIG_FISCAL_2026.salarioMinimo.general);
    const salarioEmpleadoBp = context.calculations.salarioDiarioBp;

    if (compararBp(salarioEmpleadoBp, salarioMinimoBp) < 0) {
      return {
        valid: false,
        errors: [
          {
            code: this.code,
            message: `Salario diario ${bpToPesos(salarioEmpleadoBp)} es menor al mínimo legal ${bpToPesos(salarioMinimoBp)}`,
            severity: this.severity,
            field: 'employee.salarioDiario',
            value: bpToPesos(salarioEmpleadoBp),
          },
        ],
        warnings: [],
      };
    }

    return { valid: true, errors: [], warnings: [] };
  }
}

/**
 * Validate worked days don't exceed period days
 */
export class DiasTrabajadosValidator implements ValidationRule {
  id = 'dias_trabajados';
  name = 'Días Trabajados Válidos';
  type = 'pre' as const;
  severity = 'error' as const;
  code = 'DIAS_TRABAJADOS_INVALIDOS';
  message = 'Los días trabajados no pueden exceder los días del período';

  async validate(context: PayrollContext): Promise<ValidationResult> {
    const maxDias = context.period.diasLaborales;
    const diasTrabajados = context.calculations.diasTrabajados;

    if (diasTrabajados < 0) {
      return {
        valid: false,
        errors: [
          {
            code: this.code,
            message: `Días trabajados no puede ser negativo (${diasTrabajados})`,
            severity: this.severity,
            field: 'calculations.diasTrabajados',
            value: diasTrabajados,
          },
        ],
        warnings: [],
      };
    }

    if (diasTrabajados > maxDias) {
      return {
        valid: false,
        errors: [
          {
            code: this.code,
            message: `Días trabajados (${diasTrabajados}) excede días del período (${maxDias})`,
            severity: this.severity,
            field: 'calculations.diasTrabajados',
            value: diasTrabajados,
          },
        ],
        warnings: [],
      };
    }

    return { valid: true, errors: [], warnings: [] };
  }
}

/**
 * Validate all incidents are approved
 */
export class IncidenciasAprobadasValidator implements ValidationRule {
  id = 'incidencias_aprobadas';
  name = 'Incidencias Aprobadas';
  type = 'pre' as const;
  severity = 'warning' as const;
  code = 'INCIDENCIAS_NO_APROBADAS';
  message = 'Todas las incidencias deben estar aprobadas';

  async validate(context: PayrollContext): Promise<ValidationResult> {
    const warnings: ValidationWarning[] = [];

    const unapprovedIncidents = context.incidents.filter((i) => !i.aprobado);

    if (unapprovedIncidents.length > 0) {
      warnings.push({
        code: this.code,
        message: `Hay ${unapprovedIncidents.length} incidencia(s) sin aprobar que no se procesarán`,
        severity: 'warning',
        value: unapprovedIncidents.map((i) => i.id),
      });
    }

    return { valid: true, errors: [], warnings };
  }
}

// ===================== POST-CALCULATION VALIDATORS =====================

/**
 * Validate net pay is positive
 */
export class NetoPositivoValidator implements ValidationRule {
  id = 'neto_positivo';
  name = 'Neto a Pagar Positivo';
  type = 'post' as const;
  severity = 'error' as const;
  code = 'NETO_NEGATIVO_O_CERO';
  message = 'El neto a pagar debe ser positivo';

  async validate(context: PayrollContext): Promise<ValidationResult> {
    const netoBp = context.calculations.netoPagarBp;

    if (compararBp(netoBp, 0n) <= 0) {
      return {
        valid: false,
        errors: [
          {
            code: this.code,
            message: `El neto a pagar es ${bpToPesos(netoBp)} (debe ser positivo)`,
            severity: this.severity,
            field: 'calculations.netoPagar',
            value: bpToPesos(netoBp),
          },
        ],
        warnings: [],
      };
    }

    return { valid: true, errors: [], warnings: [] };
  }
}

/**
 * Validate deductions don't exceed 30% of gross (excluding ISR, IMSS, INFONAVIT)
 */
export class LimiteDeduccionesValidator implements ValidationRule {
  id = 'limite_deducciones';
  name = 'Límite de Deducciones (30%)';
  type = 'post' as const;
  severity = 'warning' as const;
  code = 'DEDUCCIONES_EXCEDEN_30PCT';
  message = 'Las deducciones discrecionales no deben exceder el 30% del salario bruto';

  async validate(context: PayrollContext): Promise<ValidationResult> {
    const warnings: ValidationWarning[] = [];

    // Exclude mandatory deductions
    const isrBp = context.deductions.get('ISR')?.montoBp || 0n;
    const imssBp = context.deductions.get('IMSS')?.montoBp || 0n;
    const infonavitBp = context.deductions.get('INFONAVIT')?.montoBp || 0n;

    let totalDeduccionesBp = 0n;
    for (const deduction of context.deductions.values()) {
      totalDeduccionesBp += deduction.montoBp;
    }

    const deduccionesDiscrecionales = totalDeduccionesBp - isrBp - imssBp - infonavitBp;

    const limite30Pct = dividirBp(context.calculations.totalPerceptionesBp, 3n);

    if (compararBp(deduccionesDiscrecionales, limite30Pct) > 0) {
      warnings.push({
        code: this.code,
        message: `Deducciones discrecionales (${bpToPesos(deduccionesDiscrecionales)}) exceden el 30% del salario bruto (${bpToPesos(limite30Pct)})`,
        severity: 'warning',
        field: 'deductions',
        value: {
          discretionary: bpToPesos(deduccionesDiscrecionales),
          limit: bpToPesos(limite30Pct),
        },
      });
    }

    return { valid: true, errors: [], warnings };
  }
}

/**
 * Validate SBC doesn't exceed 25 UMAs
 */
export class TopeSBCValidator implements ValidationRule {
  id = 'tope_sbc';
  name = 'Tope SBC (25 UMAs)';
  type = 'post' as const;
  severity = 'warning' as const;
  code = 'SBC_EXCEDE_TOPE';
  message = 'El SBC excede el tope de 25 UMAs';

  async validate(context: PayrollContext): Promise<ValidationResult> {
    const warnings: ValidationWarning[] = [];

    const sbcBp = context.calculations.sbcBp;
    const umaDiariaBp = pesosToBp(CONFIG_FISCAL_2026.uma.diaria);
    const topeSBCBp = umaDiariaBp * BigInt(25);

    if (compararBp(sbcBp, topeSBCBp) > 0) {
      warnings.push({
        code: this.code,
        message: `SBC (${bpToPesos(sbcBp)}) excede el tope de 25 UMAs (${bpToPesos(topeSBCBp)})`,
        severity: 'warning',
        field: 'calculations.sbc',
        value: {
          sbc: bpToPesos(sbcBp),
          tope: bpToPesos(topeSBCBp),
        },
      });
    }

    return { valid: true, errors: [], warnings };
  }
}

/**
 * Validate ISR was calculated
 */
export class ISRCalculadoValidator implements ValidationRule {
  id = 'isr_calculado';
  name = 'ISR Calculado';
  type = 'post' as const;
  severity = 'error' as const;
  code = 'ISR_NO_CALCULADO';
  message = 'El ISR debe ser calculado si hay ingresos gravables';

  async validate(context: PayrollContext): Promise<ValidationResult> {
    const baseGravableBp = context.calculations.totalPerceptionesGravadasBp;
    const isrCalculado = context.deductions.has('ISR');

    if (compararBp(baseGravableBp, 0n) > 0 && !isrCalculado) {
      return {
        valid: false,
        errors: [
          {
            code: this.code,
            message: `Hay ingresos gravables (${bpToPesos(baseGravableBp)}) pero el ISR no fue calculado`,
            severity: this.severity,
            field: 'deductions.ISR',
          },
        ],
        warnings: [],
      };
    }

    return { valid: true, errors: [], warnings: [] };
  }
}

/**
 * Validate IMSS was calculated
 */
export class IMSSCalculadoValidator implements ValidationRule {
  id = 'imss_calculado';
  name = 'IMSS Calculado';
  type = 'post' as const;
  severity = 'error' as const;
  code = 'IMSS_NO_CALCULADO';
  message = 'El IMSS debe ser calculado';

  async validate(context: PayrollContext): Promise<ValidationResult> {
    const imssCalculado = context.deductions.has('IMSS');

    if (!imssCalculado && context.calculations.diasTrabajados > 0) {
      return {
        valid: false,
        errors: [
          {
            code: this.code,
            message: 'El IMSS no fue calculado',
            severity: this.severity,
            field: 'deductions.IMSS',
          },
        ],
        warnings: [],
      };
    }

    return { valid: true, errors: [], warnings: [] };
  }
}

/**
 * Validate perception totals match sum of individual concepts
 */
export class TotalesPercepcionesValidator implements ValidationRule {
  id = 'totales_percepciones';
  name = 'Totales de Percepciones';
  type = 'post' as const;
  severity = 'error' as const;
  code = 'TOTALES_PERCEPCIONES_INCORRECTOS';
  message = 'Los totales de percepciones no cuadran';

  async validate(context: PayrollContext): Promise<ValidationResult> {
    let sumaBp = 0n;
    let sumaGravadoBp = 0n;
    let sumaExentoBp = 0n;

    for (const perception of context.perceptions.values()) {
      sumaBp += perception.montoBp;
      sumaGravadoBp += perception.gravadoBp;
      sumaExentoBp += perception.exentoBp;
    }

    const errors: ValidationError[] = [];

    if (sumaBp !== context.calculations.totalPerceptionesBp) {
      errors.push({
        code: this.code,
        message: `Total percepciones calculado (${bpToPesos(sumaBp)}) no coincide con el registrado (${bpToPesos(context.calculations.totalPerceptionesBp)})`,
        severity: this.severity,
        field: 'calculations.totalPercepciones',
      });
    }

    if (sumaGravadoBp !== context.calculations.totalPerceptionesGravadasBp) {
      errors.push({
        code: this.code,
        message: `Total gravado calculado (${bpToPesos(sumaGravadoBp)}) no coincide con el registrado (${bpToPesos(context.calculations.totalPerceptionesGravadasBp)})`,
        severity: this.severity,
        field: 'calculations.totalPercepcionesGravadas',
      });
    }

    return { valid: errors.length === 0, errors, warnings: [] };
  }
}

/**
 * Validate deduction totals match sum of individual concepts
 */
export class TotalesDeduccionesValidator implements ValidationRule {
  id = 'totales_deducciones';
  name = 'Totales de Deducciones';
  type = 'post' as const;
  severity = 'error' as const;
  code = 'TOTALES_DEDUCCIONES_INCORRECTOS';
  message = 'Los totales de deducciones no cuadran';

  async validate(context: PayrollContext): Promise<ValidationResult> {
    let sumaBp = 0n;

    for (const deduction of context.deductions.values()) {
      sumaBp += deduction.montoBp;
    }

    if (sumaBp !== context.calculations.totalDeduccionesBp) {
      return {
        valid: false,
        errors: [
          {
            code: this.code,
            message: `Total deducciones calculado (${bpToPesos(sumaBp)}) no coincide con el registrado (${bpToPesos(context.calculations.totalDeduccionesBp)})`,
            severity: this.severity,
            field: 'calculations.totalDeducciones',
          },
        ],
        warnings: [],
      };
    }

    return { valid: true, errors: [], warnings: [] };
  }
}

// ===================== BUSINESS RULE VALIDATORS =====================

/**
 * Validate overtime hours don't exceed legal limits
 */
export class HorasExtraLimitesValidator implements ValidationRule {
  id = 'horas_extra_limites';
  name = 'Límites de Horas Extra';
  type = 'business' as const;
  severity = 'warning' as const;
  code = 'HORAS_EXTRA_EXCEDEN_LIMITES';
  message = 'Las horas extra exceden los límites recomendados';

  async validate(context: PayrollContext): Promise<ValidationResult> {
    const warnings: ValidationWarning[] = [];

    const incident = context.incidents.find((i) => i.tipo === 'horas_extra');
    if (!incident?.datos) {
      return { valid: true, errors: [], warnings: [] };
    }

    const horasDobles = incident.datos.horasDobles || 0;
    const horasTriples = incident.datos.horasTriples || 0;
    const totalHoras = horasDobles + horasTriples;

    // LFT limits
    if (horasDobles > 9) {
      warnings.push({
        code: this.code,
        message: `Horas dobles (${horasDobles}) exceden el límite semanal de 9 horas`,
        severity: 'warning',
        field: 'incidents.horasExtra.horasDobles',
        value: horasDobles,
      });
    }

    if (totalHoras > 9) {
      warnings.push({
        code: this.code,
        message: `Total de horas extra (${totalHoras}) excede las 9 horas semanales recomendadas`,
        severity: 'warning',
        field: 'incidents.horasExtra.total',
        value: totalHoras,
      });
    }

    return { valid: true, errors: [], warnings };
  }
}

/**
 * Validate vacation days by seniority
 */
export class DiasVacacionesValidator implements ValidationRule {
  id = 'dias_vacaciones';
  name = 'Días de Vacaciones por Antigüedad';
  type = 'business' as const;
  severity = 'warning' as const;
  code = 'DIAS_VACACIONES_INCORRECTOS';
  message = 'Los días de vacaciones no corresponden a la antigüedad';

  async validate(context: PayrollContext): Promise<ValidationResult> {
    const warnings: ValidationWarning[] = [];

    const incident = context.incidents.find((i) => i.tipo === 'vacaciones');
    if (!incident) {
      return { valid: true, errors: [], warnings: [] };
    }

    // Calculate seniority
    const fechaAlta = context.employee.fechaAlta;
    const hoy = new Date();
    const aniosAntiguedad = Math.floor(
      (hoy.getTime() - fechaAlta.getTime()) / (1000 * 60 * 60 * 24 * 365)
    );

    // Calculate expected vacation days (LFT Art. 76)
    let diasEsperados = 12; // First year
    if (aniosAntiguedad >= 2 && aniosAntiguedad <= 5) {
      diasEsperados = 12 + (aniosAntiguedad - 1) * 2;
    } else if (aniosAntiguedad > 5) {
      diasEsperados = 20 + Math.floor((aniosAntiguedad - 5) / 5) * 2;
    }

    if (incident.cantidad > diasEsperados) {
      warnings.push({
        code: this.code,
        message: `Días de vacaciones solicitados (${incident.cantidad}) exceden los días correspondientes por antigüedad (${diasEsperados} días para ${aniosAntiguedad} años)`,
        severity: 'warning',
        field: 'incidents.vacaciones.cantidad',
        value: { solicitados: incident.cantidad, esperados: diasEsperados },
      });
    }

    return { valid: true, errors: [], warnings };
  }
}

// ===================== EXPORT ALL VALIDATORS =====================

export const BUILTIN_VALIDATORS = [
  // Pre-calculation
  new EmpleadoActivoValidator(),
  new SalarioMinimoValidator(),
  new DiasTrabajadosValidator(),
  new IncidenciasAprobadasValidator(),

  // Post-calculation
  new NetoPositivoValidator(),
  new LimiteDeduccionesValidator(),
  new TopeSBCValidator(),
  new ISRCalculadoValidator(),
  new IMSSCalculadoValidator(),
  new TotalesPercepcionesValidator(),
  new TotalesDeduccionesValidator(),

  // Business rules
  new HorasExtraLimitesValidator(),
  new DiasVacacionesValidator(),
];
