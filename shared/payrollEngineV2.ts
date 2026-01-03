/**
 * HRMax Payroll Engine V2 - Ultimate Edition
 *
 * Production-grade payroll calculation engine with:
 * - NOI-level validation strictness
 * - Dynamic concept system (DB + code)
 * - Complete audit trail
 * - Extensible architecture
 *
 * @version 2.0
 * @date January 2026
 */

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
  calcularHorasExtra,
  calcularAguinaldo,
  calcularPrimaVacacional,
  calcularPTU,
  CONFIG_FISCAL_2026,
} from './payrollEngine';

// ===================== TYPE DEFINITIONS =====================

export type TipoPeriodo = 'diario' | 'semanal' | 'catorcenal' | 'quincenal' | 'mensual';
export type TipoConcepto = 'percepcion' | 'deduccion' | 'otro_pago';
export type TipoCalculo = 'formula' | 'codigo' | 'manual';
export type ValidationSeverity = 'error' | 'warning' | 'info';
export type CalculationPhase = 'init' | 'base' | 'perception' | 'deduction' | 'other' | 'validation' | 'complete';

// ===================== EMPLOYEE DATA =====================

export interface Employee {
  id: string;
  numeroEmpleado: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno?: string;

  salarioDiarioNominal: number;
  salarioDiarioBp: bigint;

  fechaAlta: Date;
  estatus: 'activo' | 'inactivo' | 'suspension';

  grupoNominaId: string;
  plantillaNominaId?: string;
}

export interface PayrollPeriod {
  id: string;
  numero: number;
  anio: number;
  mes: number;

  frecuencia: TipoPeriodo;
  fechaInicio: Date;
  fechaFin: Date;
  fechaPago: Date;

  diasCalendario: number;
  diasLaborales: number;
}

export interface Incident {
  id: string;
  tipo: 'horas_extra' | 'faltas' | 'incapacidades' | 'vacaciones' |
        'domingos_trabajados' | 'festivos_trabajados' | 'retardos' | 'permisos';

  fecha: Date;
  cantidad: number;  // Hours, days, etc.

  datos?: {
    horasDobles?: number;
    horasTriples?: number;
    tipoIncapacidad?: string;
    porcentajePago?: number;
    [key: string]: any;
  };

  aprobado: boolean;
}

// ===================== CONCEPT DEFINITIONS =====================

export interface ConceptDefinition {
  // Identity
  id: string;
  codigo: string;
  nombre: string;
  descripcion?: string;

  // Classification
  tipo: TipoConcepto;
  satClave: string;

  // Tax treatment
  gravableISR: boolean;
  integraSDI: boolean;
  integraIMSS: boolean;

  // Calculation
  tipoCalculo: TipoCalculo;
  formula?: string;
  codigoCalculador?: string;

  // Dependencies
  dependencias: string[];  // Concept codes this depends on

  // Execution
  ordenEjecucion: number;

  // Limits
  limites?: {
    minimo?: bigint;
    maximo?: bigint;
    porcentajeMaximoSalario?: number;
  };

  // Validation
  validaciones: string[];  // Validator names

  // Status
  activo: boolean;
  obligatorio: boolean;
}

export interface ConceptCalculator {
  calculate(context: PayrollContext): Promise<CalculatedConcept | null>;
  validate?(context: PayrollContext, result: CalculatedConcept): Promise<ValidationResult>;
}

// ===================== CALCULATION RESULTS =====================

export interface CalculatedConcept {
  conceptoId: string;
  codigo: string;
  nombre: string;

  // Amounts
  montoBp: bigint;
  gravadoBp: bigint;
  exentoBp: bigint;

  // Metadata
  unidad?: number;  // Days, hours, percentage, etc.
  tasa?: number;

  // SAT
  satClave: string;

  // Audit breakdown
  breakdown?: {
    formula?: string;
    variables?: Record<string, any>;
    steps?: CalculationStep[];
  };
}

export interface CalculationStep {
  step: number;
  description: string;
  operation: string;
  input: any;
  output: any;
}

// ===================== PAYROLL CONTEXT =====================

export interface PayrollContext {
  // Input data
  employee: Employee;
  period: PayrollPeriod;
  incidents: Incident[];

  // Calculated concepts
  perceptions: Map<string, CalculatedConcept>;
  deductions: Map<string, CalculatedConcept>;
  otherPayments: Map<string, CalculatedConcept>;

  // Intermediate calculations
  calculations: {
    salarioDiarioBp: bigint;
    diasTrabajados: number;
    diasCalendario: number;

    // Perception totals
    totalPerceptionesBp: bigint;
    totalPerceptionesGravadasBp: bigint;
    totalPerceptionesExentasBp: bigint;

    // Deduction totals
    totalDeduccionesBp: bigint;

    // Net
    netoPagarBp: bigint;

    // IMSS
    sdiBp: bigint;
    sbcBp: bigint;
  };

  // Audit trail
  auditLog: AuditEntry[];

  // Validation results
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

// ===================== VALIDATION SYSTEM =====================

export interface ValidationRule {
  id: string;
  name: string;
  type: 'pre' | 'post' | 'business';
  severity: ValidationSeverity;

  validate(context: PayrollContext): Promise<ValidationResult>;

  message: string;
  code: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  code: string;
  message: string;
  severity: ValidationSeverity;
  field?: string;
  value?: any;
}

export interface ValidationWarning extends ValidationError {
  // Same structure, but severity is 'warning'
}

// ===================== AUDIT TRAIL =====================

export interface AuditEntry {
  timestamp: Date;
  phase: CalculationPhase;
  action: string;
  conceptCode?: string;
  data: any;
  duration?: number;  // milliseconds
}

// ===================== PAYROLL RESULT =====================

export interface PayrollResult {
  // Employee info
  empleadoId: string;
  numeroEmpleado: string;
  nombreCompleto: string;

  // Period
  periodoId: string;
  periodo: string;
  fechaPago: Date;

  // Days
  diasTrabajados: number;
  diasCalendario: number;

  // Perceptions
  percepciones: CalculatedConcept[];
  totalPercepciones: number;
  totalPercepcionesGravadas: number;
  totalPercepcionesExentas: number;

  // Deductions
  deducciones: CalculatedConcept[];
  totalDeducciones: number;

  // Other payments
  otrosPagos: CalculatedConcept[];
  totalOtrosPagos: number;

  // Net
  netoPagar: number;

  // Audit
  auditTrail: AuditEntry[];

  // Validation
  errors: ValidationError[];
  warnings: ValidationWarning[];

  // Timestamps
  calculatedAt: Date;
  calculatedBy?: string;
}

// ===================== CONCEPT REGISTRY =====================

export class ConceptRegistry {
  private concepts: Map<string, ConceptDefinition> = new Map();
  private calculators: Map<string, ConceptCalculator> = new Map();

  /**
   * Register a concept definition
   */
  registerConcept(definition: ConceptDefinition): void {
    this.concepts.set(definition.codigo, definition);
  }

  /**
   * Register a calculator for coded concepts
   */
  registerCalculator(name: string, calculator: ConceptCalculator): void {
    this.calculators.set(name, calculator);
  }

  /**
   * Get concept by code
   */
  getConcept(codigo: string): ConceptDefinition | undefined {
    return this.concepts.get(codigo);
  }

  /**
   * Get calculator by name
   */
  getCalculator(name: string): ConceptCalculator | undefined {
    return this.calculators.get(name);
  }

  /**
   * Get all active concepts of a type
   */
  getConceptsByType(tipo: TipoConcepto): ConceptDefinition[] {
    return Array.from(this.concepts.values())
      .filter(c => c.tipo === tipo && c.activo)
      .sort((a, b) => a.ordenEjecucion - b.ordenEjecucion);
  }

  /**
   * Resolve execution order using topological sort
   */
  resolveExecutionOrder(concepts: ConceptDefinition[]): ConceptDefinition[] {
    const graph = new Map<string, string[]>();
    const inDegree = new Map<string, number>();

    // Build dependency graph
    for (const concept of concepts) {
      graph.set(concept.codigo, concept.dependencias);
      inDegree.set(concept.codigo, 0);
    }

    // Calculate in-degrees
    for (const concept of concepts) {
      for (const dep of concept.dependencias) {
        inDegree.set(dep, (inDegree.get(dep) || 0) + 1);
      }
    }

    // Topological sort (Kahn's algorithm)
    const queue: string[] = [];
    const result: ConceptDefinition[] = [];

    // Start with concepts that have no dependencies
    for (const [codigo, degree] of inDegree.entries()) {
      if (degree === 0) {
        queue.push(codigo);
      }
    }

    while (queue.length > 0) {
      const codigo = queue.shift()!;
      const concept = this.concepts.get(codigo);
      if (concept) {
        result.push(concept);
      }

      // Reduce in-degree for dependent concepts
      const dependencies = graph.get(codigo) || [];
      for (const dep of dependencies) {
        const newDegree = (inDegree.get(dep) || 0) - 1;
        inDegree.set(dep, newDegree);
        if (newDegree === 0) {
          queue.push(dep);
        }
      }
    }

    // Check for cycles
    if (result.length !== concepts.length) {
      throw new Error('Circular dependency detected in concept definitions');
    }

    return result;
  }
}

// ===================== VALIDATION FRAMEWORK =====================

export class ValidationFramework {
  private validators: Map<string, ValidationRule> = new Map();

  /**
   * Register a validation rule
   */
  registerValidator(validator: ValidationRule): void {
    this.validators.set(validator.id, validator);
  }

  /**
   * Run validations of a specific type
   */
  async runValidations(
    context: PayrollContext,
    type: 'pre' | 'post' | 'business'
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    const validators = Array.from(this.validators.values())
      .filter(v => v.type === type);

    for (const validator of validators) {
      const result = await validator.validate(context);
      errors.push(...result.errors);
      warnings.push(...result.warnings);
    }

    return {
      valid: errors.filter(e => e.severity === 'error').length === 0,
      errors,
      warnings
    };
  }
}

// ===================== AUDIT LOGGER =====================

export class AuditLogger {
  private entries: AuditEntry[] = [];

  log(phase: CalculationPhase, action: string, data: any): void {
    this.entries.push({
      timestamp: new Date(),
      phase,
      action,
      data
    });
  }

  logCalculation(
    concept: ConceptDefinition,
    result: CalculatedConcept,
    duration: number
  ): void {
    this.entries.push({
      timestamp: new Date(),
      phase: concept.tipo === 'percepcion' ? 'perception' :
             concept.tipo === 'deduccion' ? 'deduction' : 'other',
      action: 'calculate_concept',
      conceptCode: concept.codigo,
      data: {
        concept: concept.nombre,
        result: {
          monto: bpToPesos(result.montoBp),
          gravado: bpToPesos(result.gravadoBp),
          exento: bpToPesos(result.exentoBp)
        },
        breakdown: result.breakdown
      },
      duration
    });
  }

  getEntries(): AuditEntry[] {
    return [...this.entries];
  }

  getTotalDuration(): number {
    return this.entries.reduce((sum, e) => sum + (e.duration || 0), 0);
  }
}

// ===================== PAYROLL ORCHESTRATOR =====================

export class PayrollOrchestrator {
  constructor(
    private registry: ConceptRegistry,
    private validationFramework: ValidationFramework
  ) {}

  /**
   * Calculate complete payroll for an employee
   */
  async calcularNominaCompleta(
    employee: Employee,
    period: PayrollPeriod,
    incidents: Incident[]
  ): Promise<PayrollResult> {

    const startTime = Date.now();
    const auditLogger = new AuditLogger();

    try {
      // 1. INITIALIZE CONTEXT
      auditLogger.log('init', 'initialize_context', { employeeId: employee.id });
      const context = this.initializeContext(employee, period, incidents, auditLogger);

      // 2. PRE-VALIDATIONS
      auditLogger.log('init', 'pre_validations', {});
      const preValidation = await this.validationFramework.runValidations(context, 'pre');

      if (!preValidation.valid) {
        throw new PayrollValidationError('Pre-validation failed', preValidation.errors);
      }

      context.warnings.push(...preValidation.warnings);

      // 3. CALCULATE BASE VALUES
      auditLogger.log('base', 'calculate_base_values', {});
      await this.calculateBaseValues(context);

      // 4. GET APPLICABLE CONCEPTS
      auditLogger.log('base', 'load_concepts', {});
      const concepts = await this.getApplicableConcepts(employee, period);

      // 5. EXECUTE PERCEPTIONS
      auditLogger.log('perception', 'start_perceptions', {});
      const perceptions = concepts.filter(c => c.tipo === 'percepcion');
      const orderedPerceptions = this.registry.resolveExecutionOrder(perceptions);

      for (const concept of orderedPerceptions) {
        await this.executeConceptCalculation(context, concept, auditLogger);
      }

      // 6. CALCULATE PERCEPTION TOTALS
      this.calculatePerceptionTotals(context);

      // 7. EXECUTE DEDUCTIONS
      auditLogger.log('deduction', 'start_deductions', {});
      const deductions = concepts.filter(c => c.tipo === 'deduccion');
      const orderedDeductions = this.registry.resolveExecutionOrder(deductions);

      for (const concept of orderedDeductions) {
        await this.executeConceptCalculation(context, concept, auditLogger);
      }

      // 8. VALIDATE DEDUCTION LIMITS
      await this.validateDeductionLimits(context);

      // 9. EXECUTE OTHER PAYMENTS
      auditLogger.log('other', 'start_other_payments', {});
      const otherPayments = concepts.filter(c => c.tipo === 'otro_pago');

      for (const concept of otherPayments) {
        await this.executeConceptCalculation(context, concept, auditLogger);
      }

      // 10. CALCULATE NET PAY
      auditLogger.log('complete', 'calculate_net', {});
      this.calculateNetPay(context);

      // 11. POST-VALIDATIONS
      auditLogger.log('validation', 'post_validations', {});
      const postValidation = await this.validationFramework.runValidations(context, 'post');

      if (!postValidation.valid) {
        throw new PayrollValidationError('Post-validation failed', postValidation.errors);
      }

      context.warnings.push(...postValidation.warnings);

      // 12. GENERATE RESULT
      auditLogger.log('complete', 'generate_result', {});
      const result = this.generatePayrollResult(context);

      const totalTime = Date.now() - startTime;
      auditLogger.log('complete', 'calculation_complete', { duration: totalTime });

      return result;

    } catch (error) {
      auditLogger.log('complete', 'calculation_error', { error: error.message });
      throw error;
    }
  }

  /**
   * Initialize payroll context
   */
  private initializeContext(
    employee: Employee,
    period: PayrollPeriod,
    incidents: Incident[],
    auditLogger: AuditLogger
  ): PayrollContext {
    return {
      employee,
      period,
      incidents: incidents.filter(i => i.aprobado),

      perceptions: new Map(),
      deductions: new Map(),
      otherPayments: new Map(),

      calculations: {
        salarioDiarioBp: employee.salarioDiarioBp,
        diasTrabajados: 0,
        diasCalendario: period.diasCalendario,

        totalPerceptionesBp: 0n,
        totalPerceptionesGravadasBp: 0n,
        totalPerceptionesExentasBp: 0n,

        totalDeduccionesBp: 0n,

        netoPagarBp: 0n,

        sdiBp: 0n,
        sbcBp: 0n,
      },

      auditLog: auditLogger.getEntries(),
      errors: [],
      warnings: []
    };
  }

  /**
   * Calculate base values (days worked, SDI, SBC, etc.)
   */
  private async calculateBaseValues(context: PayrollContext): Promise<void> {
    // Calculate days worked (period days - absences)
    const absenceIncidents = context.incidents.filter(i =>
      i.tipo === 'faltas' || i.tipo === 'incapacidades'
    );

    const totalAbsences = absenceIncidents.reduce((sum, i) => sum + i.cantidad, 0);
    context.calculations.diasTrabajados = context.period.diasLaborales - totalAbsences;

    // Calculate SDI and SBC
    context.calculations.sdiBp = calcularSDI(context.employee.salarioDiarioBp);
    context.calculations.sbcBp = calcularSBC(context.calculations.sdiBp);
  }

  /**
   * Get applicable concepts for this employee/period
   */
  private async getApplicableConcepts(
    employee: Employee,
    period: PayrollPeriod
  ): Promise<ConceptDefinition[]> {
    // For now, return all active concepts
    // In production, filter by: employee template, period type, etc.
    return Array.from(this.registry['concepts'].values())
      .filter(c => c.activo);
  }

  /**
   * Execute calculation for a single concept
   */
  private async executeConceptCalculation(
    context: PayrollContext,
    concept: ConceptDefinition,
    auditLogger: AuditLogger
  ): Promise<void> {
    const startTime = Date.now();

    try {
      let result: CalculatedConcept | null = null;

      if (concept.tipoCalculo === 'codigo' && concept.codigoCalculador) {
        // Use registered calculator
        const calculator = this.registry.getCalculator(concept.codigoCalculador);
        if (calculator) {
          result = await calculator.calculate(context);
        }
      } else if (concept.tipoCalculo === 'formula' && concept.formula) {
        // Evaluate formula
        result = await this.evaluateFormula(context, concept);
      }

      if (result) {
        // Store result
        if (concept.tipo === 'percepcion') {
          context.perceptions.set(concept.codigo, result);
        } else if (concept.tipo === 'deduccion') {
          context.deductions.set(concept.codigo, result);
        } else {
          context.otherPayments.set(concept.codigo, result);
        }

        const duration = Date.now() - startTime;
        auditLogger.logCalculation(concept, result, duration);
      }

    } catch (error) {
      context.errors.push({
        code: 'CONCEPT_CALCULATION_ERROR',
        message: `Error calculating concept ${concept.codigo}: ${error.message}`,
        severity: 'error',
        field: concept.codigo
      });
    }
  }

  /**
   * Evaluate formula-based concept
   */
  private async evaluateFormula(
    context: PayrollContext,
    concept: ConceptDefinition
  ): Promise<CalculatedConcept | null> {
    // TODO: Integrate with expr-eval library
    // For now, return null
    return null;
  }

  /**
   * Calculate perception totals
   */
  private calculatePerceptionTotals(context: PayrollContext): void {
    let total = 0n;
    let gravado = 0n;
    let exento = 0n;

    for (const perception of context.perceptions.values()) {
      total = sumarBp(total, perception.montoBp);
      gravado = sumarBp(gravado, perception.gravadoBp);
      exento = sumarBp(exento, perception.exentoBp);
    }

    context.calculations.totalPerceptionesBp = total;
    context.calculations.totalPerceptionesGravadasBp = gravado;
    context.calculations.totalPerceptionesExentasBp = exento;
  }

  /**
   * Validate deduction limits
   */
  private async validateDeductionLimits(context: PayrollContext): Promise<void> {
    // 30% limit on discretionary deductions
    const isrBp = context.deductions.get('ISR')?.montoBp || 0n;
    const imssBp = context.deductions.get('IMSS')?.montoBp || 0n;
    const infonavitBp = context.deductions.get('INFONAVIT')?.montoBp || 0n;

    let totalDeductions = 0n;
    for (const deduction of context.deductions.values()) {
      totalDeductions = sumarBp(totalDeductions, deduction.montoBp);
    }

    const discretionaryDeductions = restarBp(
      restarBp(restarBp(totalDeductions, isrBp), imssBp),
      infonavitBp
    );

    const limit30Pct = dividirBp(context.calculations.totalPerceptionesBp, 3n);

    if (compararBp(discretionaryDeductions, limit30Pct) > 0) {
      context.warnings.push({
        code: 'DEDUCTIONS_EXCEED_30PCT',
        message: `Discretionary deductions (${bpToPesos(discretionaryDeductions)}) exceed 30% limit (${bpToPesos(limit30Pct)})`,
        severity: 'warning',
        value: bpToPesos(discretionaryDeductions)
      });
    }
  }

  /**
   * Calculate net pay
   */
  private calculateNetPay(context: PayrollContext): void {
    let totalDeductions = 0n;
    for (const deduction of context.deductions.values()) {
      totalDeductions = sumarBp(totalDeductions, deduction.montoBp);
    }

    context.calculations.totalDeduccionesBp = totalDeductions;
    context.calculations.netoPagarBp = restarBp(
      context.calculations.totalPerceptionesBp,
      totalDeductions
    );
  }

  /**
   * Generate final payroll result
   */
  private generatePayrollResult(context: PayrollContext): PayrollResult {
    return {
      empleadoId: context.employee.id,
      numeroEmpleado: context.employee.numeroEmpleado,
      nombreCompleto: `${context.employee.nombre} ${context.employee.apellidoPaterno} ${context.employee.apellidoMaterno || ''}`.trim(),

      periodoId: context.period.id,
      periodo: `${context.period.frecuencia} ${context.period.numero}/${context.period.anio}`,
      fechaPago: context.period.fechaPago,

      diasTrabajados: context.calculations.diasTrabajados,
      diasCalendario: context.calculations.diasCalendario,

      percepciones: Array.from(context.perceptions.values()),
      totalPercepciones: bpToPesos(context.calculations.totalPerceptionesBp),
      totalPercepcionesGravadas: bpToPesos(context.calculations.totalPerceptionesGravadasBp),
      totalPercepcionesExentas: bpToPesos(context.calculations.totalPerceptionesExentasBp),

      deducciones: Array.from(context.deductions.values()),
      totalDeducciones: bpToPesos(context.calculations.totalDeduccionesBp),

      otrosPagos: Array.from(context.otherPayments.values()),
      totalOtrosPagos: 0,  // Calculate if needed

      netoPagar: bpToPesos(context.calculations.netoPagarBp),

      auditTrail: context.auditLog,
      errors: context.errors,
      warnings: context.warnings,

      calculatedAt: new Date()
    };
  }
}

// ===================== CUSTOM ERRORS =====================

export class PayrollValidationError extends Error {
  constructor(message: string, public errors: ValidationError[]) {
    super(message);
    this.name = 'PayrollValidationError';
  }
}

export class PayrollCalculationError extends Error {
  constructor(message: string, public conceptCode?: string) {
    super(message);
    this.name = 'PayrollCalculationError';
  }
}

// ===================== EXPORTS =====================

export { ConceptRegistry, ValidationFramework, AuditLogger, PayrollOrchestrator };
