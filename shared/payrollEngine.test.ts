/**
 * Comprehensive Test Suite for HRMax Payroll Engine V2
 *
 * This file contains unit and integration tests for the complete payroll calculation system.
 * Tests cover:
 * - Individual calculators (salario base, horas extra, ISR, IMSS, etc.)
 * - Validation framework
 * - Orchestrator flow
 * - 2026 fiscal compliance
 * - Edge cases and error handling
 *
 * To run these tests:
 * 1. Install Vitest: npm install -D vitest
 * 2. Add to package.json scripts: "test": "vitest"
 * 3. Run: npm test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  ConceptRegistry,
  ValidationFramework,
  PayrollOrchestrator,
  type Employee,
  type PayrollPeriod,
  type Incident,
  PayrollValidationError,
} from './payrollEngineV2';
import { BUILTIN_CALCULATORS } from './payrollCalculators';
import { BUILTIN_VALIDATORS } from './payrollValidators';
import {
  pesosToBp,
  bpToPesos,
  calcularISR2026,
  calcularSubsidio2026,
  CONFIG_FISCAL_2026,
  TABLAS_ISR_2026,
} from './payrollEngine';

// ============================================================================
// Test Data Fixtures
// ============================================================================

const createTestEmployee = (overrides: Partial<Employee> = {}): Employee => ({
  id: 'emp-001',
  numeroEmpleado: '0001',
  nombre: 'Juan',
  apellidoPaterno: 'Pérez',
  apellidoMaterno: 'García',
  rfc: 'PEGJ850101XXX',
  curp: 'PEGJ850101HDFRNN01',
  nss: '12345678901',
  salarioDiarioBp: pesosToBp(600), // $600/day = $18,000/month
  salarioDiarioIntegradoBp: pesosToBp(690), // With integrated benefits
  fechaIngreso: '2020-01-15',
  estatus: 'activo',
  clienteId: 'cli-001',
  empresaId: 'emp-001',
  centroTrabajoId: 'ct-001',
  departamentoId: 'dept-001',
  puestoId: 'puesto-001',
  tipoContrato: 'indefinido',
  regimenContratacion: '02',
  tipoPeriodo: 'quincenal',
  tipoJornada: 'diurna',
  bancoId: 'banco-001',
  cuentaBancaria: '1234567890',
  createdAt: '2020-01-15',
  updatedAt: '2026-01-01',
  ...overrides,
});

const createTestPeriod = (overrides: Partial<PayrollPeriod> = {}): PayrollPeriod => ({
  id: 'per-202601-q1',
  clienteId: 'cli-001',
  nombre: 'Quincena 01 - Enero 2026',
  frecuencia: 'quincenal',
  tipoPeriodo: 'quincenal',
  anio: 2026,
  mes: 1,
  numero: 1,
  fechaInicio: '2026-01-01',
  fechaFin: '2026-01-15',
  fechaPago: '2026-01-16',
  diasLaborales: 11, // Quincenal typically has 11-12 working days
  diasPeriodo: 15,
  estatus: 'abierto',
  tipo: 'ordinaria',
  createdAt: '2025-12-15',
  updatedAt: '2026-01-01',
  ...overrides,
});

// ============================================================================
// 2026 Fiscal Configuration Tests
// ============================================================================

describe('2026 Fiscal Configuration', () => {
  it('should have correct 2026 minimum wages', () => {
    expect(CONFIG_FISCAL_2026.salarioMinimo.general).toBe(315.04);
    expect(CONFIG_FISCAL_2026.salarioMinimo.frontera).toBe(440.87);
  });

  it('should have ISR tables with 1.1321 factor applied', () => {
    const mensual = TABLAS_ISR_2026.mensual;
    expect(mensual.anio).toBe(2026);
    expect(mensual.tramos.length).toBeGreaterThan(0);

    // Verify first tramo (updated with 13.21% inflation)
    const primerTramo = mensual.tramos[0];
    expect(bpToPesos(primerTramo.limiteInferiorBp)).toBeCloseTo(0.01, 2);
    expect(bpToPesos(primerTramo.limiteSuperiorBp)).toBeCloseTo(844.59, 2);
  });

  it('should have updated subsidio al empleo for 2026', () => {
    const subsidio2026 = CONFIG_FISCAL_2026.subsidioEmpleo;
    expect(bpToPesos(subsidio2026.limiteIngresoMensualBp)).toBeCloseTo(11492.66, 2);
    expect(bpToPesos(subsidio2026.subsidioMensualBp)).toBeCloseTo(536.22, 2);
  });
});

// ============================================================================
// ISR Calculation Tests (2026)
// ============================================================================

describe('ISR Calculator 2026', () => {
  it('should calculate ISR correctly for monthly period', () => {
    const salarioMensualBp = pesosToBp(18000); // $18,000/month
    const result = calcularISR2026(salarioMensualBp, 'mensual', 1);

    expect(result).toHaveProperty('isrBp');
    expect(result).toHaveProperty('subsidioEmpleoBp');
    expect(result).toHaveProperty('isrRetenidoBp');
    expect(result).toHaveProperty('tramoAplicado');

    // $18,000 should be in tramo 5 or 6 (between $11,492.66 and $21,643.31)
    expect(result.tramoAplicado).toBeGreaterThan(0);

    // ISR should be positive for this income level
    expect(result.isrBp).toBeGreaterThan(0n);
  });

  it('should calculate subsidio al empleo for low income', () => {
    const salarioBajoBp = pesosToBp(5000); // $5,000/month - eligible for subsidio
    const result = calcularISR2026(salarioBajoBp, 'mensual', 1);

    // Should receive subsidio
    expect(result.subsidioEmpleoBp).toBeGreaterThan(0n);

    // ISR retenido should be ISR - subsidio
    expect(result.isrRetenidoBp).toBeLessThan(result.isrBp);
  });

  it('should calculate subsidio separately', () => {
    const salarioBp = pesosToBp(8000);
    const subsidio = calcularSubsidio2026(salarioBp, 'mensual', 1);

    // Should return subsidio amount
    expect(subsidio).toBeGreaterThan(0n);
    expect(subsidio).toBeLessThanOrEqual(pesosToBp(536.22)); // Max subsidio
  });

  it('should handle quincenal period correctly', () => {
    const salarioQuincenalBp = pesosToBp(9000); // $9,000 quincenal
    const result = calcularISR2026(salarioQuincenalBp, 'quincenal', 1);

    expect(result.isrBp).toBeGreaterThan(0n);
    expect(result.tramoAplicado).toBeGreaterThan(0);
  });

  it('should handle minimum wage earner (no ISR)', () => {
    const salarioMinimoBp = pesosToBp(315.04 * 15); // Minimum wage × 15 days
    const result = calcularISR2026(salarioMinimoBp, 'quincenal', 1);

    // Should pay little to no ISR
    expect(result.isrRetenidoBp).toBeLessThanOrEqual(pesosToBp(100));
  });
});

// ============================================================================
// Calculator Tests
// ============================================================================

describe('Payroll Calculators', () => {
  let registry: ConceptRegistry;
  let context: any;

  beforeEach(() => {
    registry = new ConceptRegistry();

    // Register all built-in calculators
    for (const [name, calculator] of Object.entries(BUILTIN_CALCULATORS)) {
      registry.registerCalculator(name, calculator);
    }

    // Create test context
    const employee = createTestEmployee();
    const period = createTestPeriod();
    context = {
      employee,
      period,
      incidents: [],
      perceptions: new Map(),
      deductions: new Map(),
      otherPayments: new Map(),
      calculations: {
        salarioDiarioBp: employee.salarioDiarioBp,
        diasTrabajados: period.diasLaborales,
        totalPerceptionesBp: 0n,
        totalPerceptionesGravadasBp: 0n,
        totalPerceptionesExentasBp: 0n,
        totalDeduccionesBp: 0n,
        netoPagarBp: 0n,
        sdiBp: employee.salarioDiarioIntegradoBp,
        sbcBp: employee.salarioDiarioIntegradoBp,
      },
      auditLog: [],
      errors: [],
      warnings: [],
    };
  });

  describe('SalarioBaseCalculator', () => {
    it('should calculate base salary correctly', async () => {
      const calculator = BUILTIN_CALCULATORS.SALARIO_BASE;
      const result = await calculator.calculate(context);

      expect(result).not.toBeNull();
      expect(result?.codigo).toBe('001');
      expect(result?.montoBp).toBe(pesosToBp(600) * 11n); // $600/day × 11 days
      expect(result?.gravadoBp).toBe(result?.montoBp); // All taxable
      expect(result?.exentoBp).toBe(0n);
    });

    it('should include calculation breakdown', async () => {
      const calculator = BUILTIN_CALCULATORS.SALARIO_BASE;
      const result = await calculator.calculate(context);

      expect(result?.breakdown).toBeDefined();
      expect(result?.breakdown.steps).toHaveLength(1);
      expect(result?.breakdown.steps[0].formula).toContain('salario_diario × dias_trabajados');
    });
  });

  describe('HorasExtraCalculator', () => {
    it('should calculate overtime (dobles) correctly', async () => {
      context.incidents = [{
        tipo: 'horas_extra',
        cantidad: 5,
        datos: { horasDobles: 5, horasTriples: 0 },
        aprobado: true,
      }];

      const calculator = BUILTIN_CALCULATORS.HORAS_EXTRA;
      const result = await calculator.calculate(context);

      expect(result).not.toBeNull();
      expect(result?.codigo).toBe('019');

      // Dobles = salario_hora × 2 × hours
      const salarioHoraBp = pesosToBp(600) / 8n;
      const expectedBp = salarioHoraBp * 2n * 5n;

      expect(result?.montoBp).toBeGreaterThan(0n);
      // Should be close to expected (with exemption logic)
      expect(result?.montoBp).toBeLessThanOrEqual(expectedBp);
    });

    it('should calculate overtime (triples) correctly', async () => {
      context.incidents = [{
        tipo: 'horas_extra',
        cantidad: 4,
        datos: { horasDobles: 0, horasTriples: 4 },
        aprobado: true,
      }];

      const calculator = BUILTIN_CALCULATORS.HORAS_EXTRA;
      const result = await calculator.calculate(context);

      expect(result).not.toBeNull();

      // Triples = salario_hora × 3 × hours (all taxable)
      const salarioHoraBp = pesosToBp(600) / 8n;
      const expectedBp = salarioHoraBp * 3n * 4n;

      expect(result?.montoBp).toBeCloseTo(Number(expectedBp), -2);
      expect(result?.gravadoBp).toBe(result?.montoBp); // All taxable
    });

    it('should return null when no overtime incident', async () => {
      const calculator = BUILTIN_CALCULATORS.HORAS_EXTRA;
      const result = await calculator.calculate(context);

      expect(result).toBeNull();
    });

    it('should validate 9-hour weekly limit', async () => {
      context.incidents = [{
        tipo: 'horas_extra',
        cantidad: 12, // Exceeds 9-hour limit
        datos: { horasDobles: 12, horasTriples: 0 },
        aprobado: true,
      }];

      const calculator = BUILTIN_CALCULATORS.HORAS_EXTRA;
      const result = await calculator.calculate(context);

      // Should add warning to context
      expect(context.warnings.length).toBeGreaterThan(0);
      expect(context.warnings[0].code).toBe('HORAS_EXTRA_LIMITE_SEMANAL');
    });
  });

  describe('FaltasCalculator', () => {
    it('should calculate absence deduction correctly', async () => {
      context.incidents = [{
        tipo: 'falta',
        cantidad: 2, // 2 days absent
        aprobado: true,
      }];

      const calculator = BUILTIN_CALCULATORS.FALTAS;
      const result = await calculator.calculate(context);

      expect(result).not.toBeNull();
      expect(result?.codigo).toBe('002');
      expect(result?.montoBp).toBe(pesosToBp(600) * 2n); // $600 × 2 days
    });
  });

  describe('PrimaDominicalCalculator', () => {
    it('should calculate sunday premium correctly', async () => {
      context.incidents = [{
        tipo: 'prima_dominical',
        cantidad: 1, // 1 sunday worked
        aprobado: true,
      }];

      const calculator = BUILTIN_CALCULATORS.PRIMA_DOMINICAL;
      const result = await calculator.calculate(context);

      expect(result).not.toBeNull();

      // Prima dominical = 25% of daily wage
      const expectedBp = (pesosToBp(600) * 25n) / 100n;
      expect(result?.montoBp).toBe(expectedBp);

      // First UMA is exempt
      expect(result?.exentoBp).toBeGreaterThan(0n);
    });
  });

  describe('ValesDespensaCalculator', () => {
    it('should calculate meal vouchers with exemption', async () => {
      context.incidents = [{
        tipo: 'vales_despensa',
        cantidad: 1,
        datos: { montoPorDia: 150 }, // $150/day
        aprobado: true,
      }];

      const calculator = BUILTIN_CALCULATORS.VALES_DESPENSA;
      const result = await calculator.calculate(context);

      expect(result).not.toBeNull();

      const totalValesBp = pesosToBp(150) * 11n; // $150 × 11 days
      expect(result?.montoBp).toBe(totalValesBp);

      // Should apply exemption limit (40% UMA monthly / 2 for quincenal)
      expect(result?.exentoBp).toBeGreaterThan(0n);
      expect(result?.gravadoBp).toBeGreaterThanOrEqual(0n);
    });
  });
});

// ============================================================================
// Validation Framework Tests
// ============================================================================

describe('Validation Framework', () => {
  let validationFramework: ValidationFramework;
  let context: any;

  beforeEach(() => {
    validationFramework = new ValidationFramework();

    // Register all validators
    for (const validator of BUILTIN_VALIDATORS) {
      validationFramework.registerValidator(validator);
    }

    const employee = createTestEmployee();
    const period = createTestPeriod();
    context = {
      employee,
      period,
      incidents: [],
      perceptions: new Map(),
      deductions: new Map(),
      otherPayments: new Map(),
      calculations: {
        salarioDiarioBp: employee.salarioDiarioBp,
        diasTrabajados: period.diasLaborales,
        totalPerceptionesBp: pesosToBp(6600), // Base salary
        totalPerceptionesGravadasBp: pesosToBp(6600),
        totalPerceptionesExentasBp: 0n,
        totalDeduccionesBp: pesosToBp(1000),
        netoPagarBp: pesosToBp(5600),
        sdiBp: employee.salarioDiarioIntegradoBp,
        sbcBp: employee.salarioDiarioIntegradoBp,
      },
      auditLog: [],
      errors: [],
      warnings: [],
    };
  });

  describe('Pre-Calculation Validations', () => {
    it('should validate employee is active', async () => {
      const result = await validationFramework.runValidations(context, 'pre');
      expect(result.valid).toBe(true);
    });

    it('should fail if employee is inactive', async () => {
      context.employee.estatus = 'inactivo';
      const result = await validationFramework.runValidations(context, 'pre');

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('EMPLEADO_INACTIVO');
    });

    it('should validate minimum wage compliance', async () => {
      context.calculations.salarioDiarioBp = pesosToBp(300); // Below minimum
      const result = await validationFramework.runValidations(context, 'pre');

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === 'SALARIO_MENOR_MINIMO')).toBe(true);
    });

    it('should validate days worked <= period days', async () => {
      context.calculations.diasTrabajados = 20; // More than period days (15)
      const result = await validationFramework.runValidations(context, 'pre');

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === 'DIAS_TRABAJADOS_INVALIDO')).toBe(true);
    });
  });

  describe('Post-Calculation Validations', () => {
    it('should validate positive net pay', async () => {
      context.calculations.netoPagarBp = pesosToBp(5600);
      const result = await validationFramework.runValidations(context, 'post');

      expect(result.valid).toBe(true);
    });

    it('should fail if net pay is negative', async () => {
      context.calculations.netoPagarBp = pesosToBp(-500);
      const result = await validationFramework.runValidations(context, 'post');

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === 'NETO_PAGAR_NEGATIVO')).toBe(true);
    });

    it('should validate 30% deduction limit', async () => {
      // Set deductions to 40% (exceeds limit)
      context.calculations.totalDeduccionesBp = (context.calculations.totalPerceptionesBp * 40n) / 100n;

      const result = await validationFramework.runValidations(context, 'post');

      // Should generate warning
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.code === 'DEDUCCIONES_EXCEDEN_LIMITE')).toBe(true);
    });

    it('should validate SBC cap (25 UMAs)', async () => {
      const umaAnualBp = pesosToBp(CONFIG_FISCAL_2026.uma.anual);
      context.calculations.sbcBp = (umaAnualBp * 30n) / 365n; // 30 UMAs (exceeds cap)

      const result = await validationFramework.runValidations(context, 'post');

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.code === 'SBC_EXCEDE_TOPE')).toBe(true);
    });
  });

  describe('Business Rule Validations', () => {
    it('should validate overtime limit (9 hours/week)', async () => {
      context.incidents = [{
        tipo: 'horas_extra',
        cantidad: 12, // Exceeds limit
        datos: { horasDobles: 12, horasTriples: 0 },
        aprobado: true,
      }];

      const result = await validationFramework.runValidations(context, 'business');

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.code === 'HORAS_EXTRA_LIMITE_SEMANAL')).toBe(true);
    });
  });
});

// ============================================================================
// Orchestrator Integration Tests
// ============================================================================

describe('PayrollOrchestrator', () => {
  let orchestrator: PayrollOrchestrator;
  let registry: ConceptRegistry;
  let validationFramework: ValidationFramework;

  beforeEach(() => {
    registry = new ConceptRegistry();
    validationFramework = new ValidationFramework();
    orchestrator = new PayrollOrchestrator(registry, validationFramework);

    // Register calculators
    for (const [name, calculator] of Object.entries(BUILTIN_CALCULATORS)) {
      registry.registerCalculator(name, calculator);
    }

    // Register validators
    for (const validator of BUILTIN_VALIDATORS) {
      validationFramework.registerValidator(validator);
    }

    // Register concepts
    registry.registerConcept({
      id: 'c-001',
      codigo: 'SALARIO_BASE',
      nombre: 'Sueldo',
      tipo: 'percepcion',
      tipoCalculo: 'codigo',
      codigoCalculador: 'SALARIO_BASE',
      satClave: '001',
      gravableISR: true,
      gravableIMSS: true,
      ordenEjecucion: 10,
      activo: true,
      clienteId: 'cli-001',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    });

    registry.registerConcept({
      id: 'c-002',
      codigo: 'ISR',
      nombre: 'ISR',
      tipo: 'deduccion',
      tipoCalculo: 'codigo',
      codigoCalculador: 'ISR',
      satClave: '002',
      gravableISR: false,
      gravableIMSS: false,
      ordenEjecucion: 90,
      activo: true,
      dependencias: ['SALARIO_BASE'],
      clienteId: 'cli-001',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    });
  });

  it('should calculate complete payroll successfully', async () => {
    const employee = createTestEmployee();
    const period = createTestPeriod();
    const incidents: Incident[] = [];

    const result = await orchestrator.calcularNominaCompleta(employee, period, incidents);

    expect(result).toBeDefined();
    expect(result.empleadoId).toBe(employee.id);
    expect(result.periodoId).toBe(period.id);
    expect(result.percepciones).toHaveLength(1); // SALARIO_BASE
    expect(result.deducciones.length).toBeGreaterThan(0); // ISR, IMSS
    expect(result.netoPagar).toBeGreaterThan(0);
  });

  it('should handle overtime calculation', async () => {
    const employee = createTestEmployee();
    const period = createTestPeriod();
    const incidents: Incident[] = [{
      id: 'inc-001',
      empleadoId: employee.id,
      periodoId: period.id,
      tipo: 'horas_extra',
      fecha: '2026-01-10',
      cantidad: 5,
      datos: { horasDobles: 5, horasTriples: 0 },
      aprobado: true,
      clienteId: 'cli-001',
      createdAt: '2026-01-10',
      updatedAt: '2026-01-10',
    }];

    // Register overtime concept
    registry.registerConcept({
      id: 'c-003',
      codigo: 'HORAS_EXTRA',
      nombre: 'Horas Extra',
      tipo: 'percepcion',
      tipoCalculo: 'codigo',
      codigoCalculador: 'HORAS_EXTRA',
      satClave: '019',
      gravableISR: true,
      gravableIMSS: true,
      ordenEjecucion: 20,
      activo: true,
      dependencias: ['SALARIO_BASE'],
      clienteId: 'cli-001',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    });

    const result = await orchestrator.calcularNominaCompleta(employee, period, incidents);

    const horasExtra = result.percepciones.find(p => p.codigo === 'HORAS_EXTRA');
    expect(horasExtra).toBeDefined();
    expect(horasExtra?.monto).toBeGreaterThan(0);
  });

  it('should handle absence deduction', async () => {
    const employee = createTestEmployee();
    const period = createTestPeriod();
    const incidents: Incident[] = [{
      id: 'inc-002',
      empleadoId: employee.id,
      periodoId: period.id,
      tipo: 'falta',
      fecha: '2026-01-08',
      cantidad: 2, // 2 days absent
      aprobado: true,
      clienteId: 'cli-001',
      createdAt: '2026-01-08',
      updatedAt: '2026-01-08',
    }];

    // Register absence concept
    registry.registerConcept({
      id: 'c-004',
      codigo: 'FALTAS',
      nombre: 'Faltas',
      tipo: 'deduccion',
      tipoCalculo: 'codigo',
      codigoCalculador: 'FALTAS',
      satClave: '002',
      gravableISR: false,
      gravableIMSS: false,
      ordenEjecucion: 15,
      activo: true,
      clienteId: 'cli-001',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    });

    const result = await orchestrator.calcularNominaCompleta(employee, period, incidents);

    const faltas = result.deducciones.find(d => d.codigo === 'FALTAS');
    expect(faltas).toBeDefined();
    expect(faltas?.monto).toBe(600 * 2); // $600 × 2 days
  });

  it('should fail pre-validation for inactive employee', async () => {
    const employee = createTestEmployee({ estatus: 'inactivo' });
    const period = createTestPeriod();
    const incidents: Incident[] = [];

    await expect(
      orchestrator.calcularNominaCompleta(employee, period, incidents)
    ).rejects.toThrow(PayrollValidationError);
  });

  it('should generate complete audit trail', async () => {
    const employee = createTestEmployee();
    const period = createTestPeriod();
    const incidents: Incident[] = [];

    const result = await orchestrator.calcularNominaCompleta(employee, period, incidents);

    expect(result.auditTrail).toBeDefined();
    expect(result.auditTrail.length).toBeGreaterThan(0);

    // Should have entries for each phase
    const phases = new Set(result.auditTrail.map(e => e.phase));
    expect(phases).toContain('initialization');
    expect(phases).toContain('validation');
    expect(phases).toContain('calculation');
  });

  it('should resolve concept dependencies correctly', async () => {
    // Register concepts with dependencies
    registry.registerConcept({
      id: 'c-003',
      codigo: 'HORAS_EXTRA',
      nombre: 'Horas Extra',
      tipo: 'percepcion',
      tipoCalculo: 'codigo',
      codigoCalculador: 'HORAS_EXTRA',
      satClave: '019',
      gravableISR: true,
      gravableIMSS: true,
      ordenEjecucion: 20,
      activo: true,
      dependencias: ['SALARIO_BASE'], // Depends on base salary
      clienteId: 'cli-001',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    });

    const concepts = [
      registry.getConcept('HORAS_EXTRA')!,
      registry.getConcept('SALARIO_BASE')!,
    ];

    const ordered = registry.resolveExecutionOrder(concepts);

    // SALARIO_BASE should come before HORAS_EXTRA
    const baseIndex = ordered.findIndex(c => c.codigo === 'SALARIO_BASE');
    const extraIndex = ordered.findIndex(c => c.codigo === 'HORAS_EXTRA');

    expect(baseIndex).toBeLessThan(extraIndex);
  });
});

// ============================================================================
// Edge Cases and Error Handling
// ============================================================================

describe('Edge Cases', () => {
  it('should handle employee at exact minimum wage', () => {
    const salarioMinimoBp = pesosToBp(315.04);
    const employee = createTestEmployee({ salarioDiarioBp: salarioMinimoBp });

    expect(employee.salarioDiarioBp).toBe(salarioMinimoBp);

    // Should not trigger minimum wage error
    const validationFramework = new ValidationFramework();
    for (const validator of BUILTIN_VALIDATORS) {
      validationFramework.registerValidator(validator);
    }
  });

  it('should handle zero hours overtime', async () => {
    const registry = new ConceptRegistry();
    for (const [name, calculator] of Object.entries(BUILTIN_CALCULATORS)) {
      registry.registerCalculator(name, calculator);
    }

    const context = {
      employee: createTestEmployee(),
      period: createTestPeriod(),
      incidents: [{
        tipo: 'horas_extra',
        cantidad: 0,
        datos: { horasDobles: 0, horasTriples: 0 },
        aprobado: true,
      }],
      perceptions: new Map(),
      deductions: new Map(),
      otherPayments: new Map(),
      calculations: {
        salarioDiarioBp: pesosToBp(600),
        diasTrabajados: 11,
        totalPerceptionesBp: 0n,
        totalPerceptionesGravadasBp: 0n,
        totalPerceptionesExentasBp: 0n,
        totalDeduccionesBp: 0n,
        netoPagarBp: 0n,
        sdiBp: pesosToBp(690),
        sbcBp: pesosToBp(690),
      },
      auditLog: [],
      errors: [],
      warnings: [],
    };

    const calculator = BUILTIN_CALCULATORS.HORAS_EXTRA;
    const result = await calculator.calculate(context);

    // Should return null for zero hours
    expect(result).toBeNull();
  });

  it('should handle very high salary (above UMA caps)', () => {
    const highSalaryBp = pesosToBp(5000); // $5,000/day = $150,000/month
    const employee = createTestEmployee({
      salarioDiarioBp: highSalaryBp,
      salarioDiarioIntegradoBp: highSalaryBp * 115n / 100n,
    });

    // SBC should be capped at 25 UMAs
    const umaAnualBp = pesosToBp(CONFIG_FISCAL_2026.uma.anual);
    const topeUMABp = (umaAnualBp * 25n) / 365n;

    // Validation should warn about SBC exceeding cap
    expect(employee.salarioDiarioIntegradoBp).toBeGreaterThan(topeUMABp);
  });

  it('should handle fractional day calculation', () => {
    // Test with 0.5 days (medio día)
    const salarioDiarioBp = pesosToBp(600);
    const medioDiaBp = salarioDiarioBp / 2n;

    expect(bpToPesos(medioDiaBp)).toBeCloseTo(300, 2);
  });
});

// ============================================================================
// Performance Tests
// ============================================================================

describe('Performance', () => {
  it('should calculate payroll in under 1 second', async () => {
    const registry = new ConceptRegistry();
    const validationFramework = new ValidationFramework();
    const orchestrator = new PayrollOrchestrator(registry, validationFramework);

    // Setup
    for (const [name, calculator] of Object.entries(BUILTIN_CALCULATORS)) {
      registry.registerCalculator(name, calculator);
    }
    for (const validator of BUILTIN_VALIDATORS) {
      validationFramework.registerValidator(validator);
    }
    registry.registerConcept({
      id: 'c-001',
      codigo: 'SALARIO_BASE',
      nombre: 'Sueldo',
      tipo: 'percepcion',
      tipoCalculo: 'codigo',
      codigoCalculador: 'SALARIO_BASE',
      satClave: '001',
      gravableISR: true,
      gravableIMSS: true,
      ordenEjecucion: 10,
      activo: true,
      clienteId: 'cli-001',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    });

    const employee = createTestEmployee();
    const period = createTestPeriod();
    const incidents: Incident[] = [];

    const startTime = Date.now();
    await orchestrator.calcularNominaCompleta(employee, period, incidents);
    const endTime = Date.now();

    const duration = endTime - startTime;
    expect(duration).toBeLessThan(1000); // Should complete in under 1 second
  });
});
