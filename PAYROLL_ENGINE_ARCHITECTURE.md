# HRMax Payroll Engine - Ultimate Architecture

> Production-grade payroll calculation engine with NOI-level validation and extensibility
> Version: 2.0
> Date: January 2026

---

## 🎯 Design Goals

1. **Accuracy**: NOI-level precision with 4-decimal basis points
2. **Extensibility**: Easy to add new concepts without code changes
3. **Validation**: Strict pre/post calculation validations
4. **Auditability**: Complete calculation breakdown and trail
5. **Performance**: Sub-second payroll calculation for 1000+ employees
6. **Maintainability**: Clear separation of concerns, well-documented

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    PAYROLL ORCHESTRATOR                      │
│  - Coordinate entire payroll calculation flow                │
│  - Manage calculation order and dependencies                 │
│  - Apply validations at each step                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    CONCEPT REGISTRY                          │
│  - Dynamic concept definitions (DB + code)                   │
│  - Formula evaluation engine                                 │
│  - Dependency resolution                                     │
│  - Execution order calculation                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   CALCULATION ENGINES                        │
│  ┌──────────────┬──────────────┬──────────────┐            │
│  │  Perceptions │  Deductions  │ Other Payments│            │
│  │   Engine     │    Engine    │    Engine     │            │
│  └──────────────┴──────────────┴──────────────┘            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   VALIDATION FRAMEWORK                       │
│  - Pre-calculation validations                               │
│  - Post-calculation validations                              │
│  - Business rule enforcement                                 │
│  - Legal compliance checks                                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      AUDIT SYSTEM                            │
│  - Calculation breakdown                                     │
│  - Step-by-step trace                                        │
│  - Error logging                                             │
│  - Performance metrics                                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Core Components

### 1. Payroll Context (State Container)

```typescript
interface PayrollContext {
  // Employee data
  employee: Employee;
  period: PayrollPeriod;

  // Calculation results (accumulated)
  perceptions: Map<string, CalculatedConcept>;
  deductions: Map<string, CalculatedConcept>;
  otherPayments: Map<string, CalculatedConcept>;

  // Incidents
  incidents: Incident[];

  // Intermediate calculations
  calculations: {
    salarioDiarioBp: bigint;
    diasTrabajados: number;
    totalPerceptionesBp: bigint;
    totalPerceptionesGravadasBp: bigint;
    totalPerceptionesExentasBp: bigint;
    totalDeduccionesBp: bigint;
    netoPagarBp: bigint;
    // ... more
  };

  // Audit trail
  auditLog: AuditEntry[];

  // Errors and warnings
  errors: ValidationError[];
  warnings: ValidationWarning[];
}
```

### 2. Concept Definition System

```typescript
interface ConceptDefinition {
  // Metadata
  id: string;
  codigo: string;
  nombre: string;
  tipo: 'percepcion' | 'deduccion' | 'otro_pago';

  // SAT Classification
  satClave: string;

  // Tax treatment
  gravableISR: boolean;
  integraSDI: boolean;
  integraIMSS: boolean;

  // Calculation
  formula?: string;  // For dynamic concepts
  calculator?: ConceptCalculator;  // For complex/coded concepts

  // Dependencies
  dependsOn: string[];  // Other concept IDs needed before this

  // Validations
  validations: ValidationRule[];

  // Order
  executionOrder: number;

  // Limits
  limites?: {
    minimo?: bigint;
    maximo?: bigint;
    porcentajeMaximoSalario?: number;
  };
}

interface ConceptCalculator {
  calculate(context: PayrollContext): CalculatedConcept;
  validate?(context: PayrollContext, result: CalculatedConcept): ValidationResult;
}
```

### 3. Calculation Result

```typescript
interface CalculatedConcept {
  conceptoId: string;
  codigo: string;
  nombre: string;

  // Amounts
  montoBp: bigint;
  gravadoBp: bigint;
  exentoBp: bigint;

  // Metadata
  unidad?: number;  // Days, hours, etc.
  tasa?: number;    // Rate/percentage applied

  // Breakdown (for audit)
  breakdown: {
    formula?: string;
    variables?: Record<string, any>;
    steps?: CalculationStep[];
  };

  // SAT
  satClave: string;
}

interface CalculationStep {
  step: number;
  description: string;
  operation: string;
  input: any;
  output: any;
}
```

### 4. Validation Framework

```typescript
interface ValidationRule {
  id: string;
  name: string;
  type: 'pre' | 'post' | 'business';
  severity: 'error' | 'warning';

  validate(context: PayrollContext): ValidationResult;

  message: string;
  code: string;  // Error code for reference
}

interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

// Built-in validators
class SalarioMinimoValidator implements ValidationRule { }
class LimiteDeduccionesValidator implements ValidationRule { }
class TopeSBCValidator implements ValidationRule { }
class DiasTrabajadosValidator implements ValidationRule { }
// ... more
```

---

## 🔄 Calculation Flow

### Step-by-Step Process

```typescript
async function calcularNominaCompleta(
  employee: Employee,
  period: PayrollPeriod,
  incidents: Incident[]
): Promise<PayrollResult> {

  // 1. INITIALIZE CONTEXT
  const context = initializeContext(employee, period, incidents);

  // 2. PRE-VALIDATIONS
  const preValidation = await runPreValidations(context);
  if (!preValidation.valid) {
    throw new PayrollValidationError(preValidation.errors);
  }

  // 3. CALCULATE BASE VALUES
  calculateBaseValues(context);  // salarioDiario, diasTrabajados, etc.

  // 4. LOAD APPLICABLE CONCEPTS
  const concepts = await loadApplicableConcepts(employee, period);

  // 5. RESOLVE DEPENDENCIES & ORDER
  const orderedConcepts = resolveDependencies(concepts);

  // 6. EXECUTE PERCEPTIONS
  for (const concept of orderedConcepts.perceptions) {
    await executeConceptCalculation(context, concept);
  }

  // 7. CALCULATE TOTALS
  calculatePerceptionTotals(context);

  // 8. EXECUTE DEDUCTIONS
  for (const concept of orderedConcepts.deductions) {
    await executeConceptCalculation(context, concept);
  }

  // 9. VALIDATE DEDUCTION LIMITS
  validateDeductionLimits(context);

  // 10. CALCULATE NET PAY
  calculateNetPay(context);

  // 11. POST-VALIDATIONS
  const postValidation = await runPostValidations(context);
  if (!postValidation.valid) {
    throw new PayrollValidationError(postValidation.errors);
  }

  // 12. GENERATE RESULT
  return generatePayrollResult(context);
}
```

---

## 🧩 Concept Registry Design

### Database Schema (conceptos_medio_pago)

```sql
CREATE TABLE conceptos_medio_pago (
  id UUID PRIMARY KEY,
  cliente_id UUID NOT NULL,
  empresa_id UUID,

  -- Identification
  codigo VARCHAR(20) UNIQUE NOT NULL,
  nombre VARCHAR(200) NOT NULL,
  descripcion TEXT,

  -- Type
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('percepcion', 'deduccion', 'otro_pago')),

  -- SAT
  sat_clave VARCHAR(10),

  -- Tax treatment
  gravable_isr BOOLEAN DEFAULT false,
  integra_sdi BOOLEAN DEFAULT false,
  integra_imss BOOLEAN DEFAULT false,

  -- Calculation
  tipo_calculo VARCHAR(20) CHECK (tipo_calculo IN ('formula', 'codigo', 'manual')),
  formula TEXT,  -- Expression for formula-based
  codigo_calculador VARCHAR(100),  -- Function name for code-based

  -- Dependencies
  dependencias JSONB DEFAULT '[]',  -- Array of concept codes

  -- Execution
  orden_ejecucion INTEGER DEFAULT 0,

  -- Limits
  limite_minimo DECIMAL(12,2),
  limite_maximo DECIMAL(12,2),
  limite_porcentaje_salario DECIMAL(5,2),

  -- Validations
  validaciones JSONB DEFAULT '[]',

  -- Status
  activo BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_conceptos_tipo ON conceptos_medio_pago(tipo);
CREATE INDEX idx_conceptos_orden ON conceptos_medio_pago(orden_ejecucion);
CREATE INDEX idx_conceptos_activo ON conceptos_medio_pago(activo);
```

### Code Registry

```typescript
class ConceptRegistry {
  private concepts: Map<string, ConceptDefinition> = new Map();
  private calculators: Map<string, ConceptCalculator> = new Map();

  // Register coded concept
  registerConcept(definition: ConceptDefinition): void {
    this.concepts.set(definition.codigo, definition);
  }

  // Register calculator function
  registerCalculator(name: string, calculator: ConceptCalculator): void {
    this.calculators.set(name, calculator);
  }

  // Load from database
  async loadFromDatabase(clienteId: string, empresaId?: string): Promise<void> {
    const dbConcepts = await db.query.conceptosMedioPago.findMany({
      where: and(
        eq(conceptosMedioPago.clienteId, clienteId),
        empresaId ? eq(conceptosMedioPago.empresaId, empresaId) : undefined,
        eq(conceptosMedioPago.activo, true)
      )
    });

    for (const dbConcept of dbConcepts) {
      this.concepts.set(dbConcept.codigo, this.mapDbToDefinition(dbConcept));
    }
  }

  // Get applicable concepts for employee
  async getApplicableConcepts(
    employee: Employee,
    period: PayrollPeriod
  ): Promise<ConceptDefinition[]> {
    // Logic to determine which concepts apply
    // Based on: employee template, period type, incidents, etc.
  }

  // Resolve execution order
  resolveExecutionOrder(concepts: ConceptDefinition[]): ConceptDefinition[] {
    // Topological sort based on dependencies
    return topologicalSort(concepts);
  }
}
```

---

## 🎨 Built-in Concept Calculators

### Core Calculators (Always Available)

```typescript
// 1. Base Salary
class SalarioBaseCalculator implements ConceptCalculator {
  calculate(context: PayrollContext): CalculatedConcept {
    const montoBp = multiplicarBpPorTasa(
      context.employee.salarioDiarioBp,
      context.calculations.diasTrabajados * 10000
    );

    return {
      conceptoId: 'SALARIO_BASE',
      codigo: '001',
      nombre: 'Sueldo Base',
      montoBp,
      gravadoBp: montoBp,
      exentoBp: 0n,
      satClave: '001',
      breakdown: {
        formula: 'salario_diario × dias_trabajados',
        variables: {
          salario_diario: bpToPesos(context.employee.salarioDiarioBp),
          dias_trabajados: context.calculations.diasTrabajados
        }
      }
    };
  }
}

// 2. Overtime (Horas Extra)
class HorasExtraCalculator implements ConceptCalculator {
  calculate(context: PayrollContext): CalculatedConcept {
    const incident = context.incidents.find(i => i.tipo === 'horas_extra');
    if (!incident) return null;

    const { horasDobles, horasTriples } = incident.datos;
    const salarioHoraBp = dividirBp(context.employee.salarioDiarioBp, 8n);

    const result = calcularHorasExtra(
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
            input: bpToPesos(context.employee.salarioDiarioBp),
            output: bpToPesos(salarioHoraBp)
          },
          {
            step: 2,
            description: 'Calcular pago horas dobles (200%)',
            operation: 'salario_hora × 2 × horas_dobles',
            input: { salario_hora: bpToPesos(salarioHoraBp), horas: horasDobles },
            output: bpToPesos(result.pagoDoblesBp)
          },
          // ... more steps
        ]
      }
    };
  }

  validate(context: PayrollContext, result: CalculatedConcept): ValidationResult {
    const errors: ValidationError[] = [];

    // Max 9 hours per week for double time
    const horasDobles = result.unidad || 0;
    if (horasDobles > 9) {
      errors.push({
        code: 'HORAS_EXTRA_LIMITE_EXCEDIDO',
        message: 'Las horas dobles no pueden exceder 9 por semana',
        severity: 'error'
      });
    }

    return { valid: errors.length === 0, errors, warnings: [] };
  }
}

// 3. Sunday Premium
class PrimaDominicalCalculator implements ConceptCalculator {
  calculate(context: PayrollContext): CalculatedConcept {
    const incident = context.incidents.find(i => i.tipo === 'domingos_trabajados');
    if (!incident) return null;

    const domingosTrabajados = incident.cantidad;
    const salarioMinimoBp = pesosToBp(CONFIG_FISCAL_2026.salarioMinimo.general);

    // 25% extra for Sunday work
    const pagoBp = multiplicarBpPorTasa(
      context.employee.salarioDiarioBp,
      domingosTrabajados * 12500  // 1.25 × 10000
    );

    // Exempt up to 1 minimum wage per Sunday
    const limiteExentoBp = multiplicarBpPorTasa(
      salarioMinimoBp,
      domingosTrabajados * 10000
    );

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
      unidad: domingosTrabajados
    };
  }
}

// 4. Absences (Faltas)
class FaltasCalculator implements ConceptCalculator {
  calculate(context: PayrollContext): CalculatedConcept {
    const incident = context.incidents.find(i => i.tipo === 'faltas');
    if (!incident) return null;

    const diasFalta = incident.cantidad;

    // Deduct salary for absent days
    const descuentoBp = multiplicarBpPorTasa(
      context.employee.salarioDiarioBp,
      diasFalta * 10000
    );

    return {
      conceptoId: 'FALTAS',
      codigo: '020',  // SAT deduction code for absences
      nombre: 'Descuento por Faltas',
      montoBp: descuentoBp,
      gravadoBp: descuentoBp,
      exentoBp: 0n,
      satClave: '020',
      unidad: diasFalta
    };
  }
}

// 5. ISR
class ISRCalculator implements ConceptCalculator {
  calculate(context: PayrollContext): CalculatedConcept {
    const baseGravableBp = context.calculations.totalPerceptionesGravadasBp;

    const result = calcularISR2026(
      baseGravableBp,
      context.period.frecuencia,
      context.period.mes
    );

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
          subsidio: bpToPesos(result.subsidioEmpleoBp),
          isr_retenido: bpToPesos(result.isrRetenidoBp),
          tramo: result.tramoAplicado
        }
      }
    };
  }
}

// 6. IMSS Worker
class IMSSCalculator implements ConceptCalculator {
  calculate(context: PayrollContext): CalculatedConcept {
    const sdi = calcularSDI(context.employee.salarioDiarioBp);
    const sbc = calcularSBC(sdi);

    const result = calcularIMSSTrabajador(sbc, context.calculations.diasTrabajados);

    return {
      conceptoId: 'IMSS',
      codigo: '001',
      nombre: 'IMSS Trabajador',
      montoBp: result.totalBp,
      gravadoBp: result.totalBp,
      exentoBp: 0n,
      satClave: '001',
      breakdown: {
        variables: {
          sdi: bpToPesos(sdi),
          sbc: bpToPesos(sbc),
          desglose: result.desglose.map(d => ({
            concepto: d.concepto,
            monto: bpToPesos(d.montoBp)
          }))
        }
      }
    };
  }
}

// 7. Meal Vouchers
class ValesDespensaCalculator implements ConceptCalculator {
  calculate(context: PayrollContext): CalculatedConcept {
    const salarioMinimoBp = pesosToBp(CONFIG_FISCAL_2026.salarioMinimo.general);

    // 40% of minimum wage × days worked
    const valesBp = multiplicarBpPorTasa(
      salarioMinimoBp,
      context.calculations.diasTrabajados * 4000  // 0.40 × 10000
    );

    // Fully exempt if within limit
    return {
      conceptoId: 'VALES_DESPENSA',
      codigo: '029',
      nombre: 'Vales de Despensa',
      montoBp: valesBp,
      gravadoBp: 0n,
      exentoBp: valesBp,
      satClave: '029',
      unidad: context.calculations.diasTrabajados
    };
  }
}

// ... More calculators
```

---

## ✅ Validation System

### Pre-Calculation Validations

```typescript
class PreCalculationValidators {
  static empleadoActivo(context: PayrollContext): ValidationResult {
    if (context.employee.estatus !== 'activo') {
      return {
        valid: false,
        errors: [{
          code: 'EMPLEADO_INACTIVO',
          message: `Empleado ${context.employee.numeroEmpleado} no está activo`,
          severity: 'error'
        }],
        warnings: []
      };
    }
    return { valid: true, errors: [], warnings: [] };
  }

  static salarioMinimo(context: PayrollContext): ValidationResult {
    const salarioMinimoBp = pesosToBp(CONFIG_FISCAL_2026.salarioMinimo.general);

    if (compararBp(context.employee.salarioDiarioBp, salarioMinimoBp) < 0) {
      return {
        valid: false,
        errors: [{
          code: 'SALARIO_MENOR_MINIMO',
          message: `Salario ${bpToPesos(context.employee.salarioDiarioBp)} es menor al mínimo ${bpToPesos(salarioMinimoBp)}`,
          severity: 'error'
        }],
        warnings: []
      };
    }
    return { valid: true, errors: [], warnings: [] };
  }

  static diasTrabajados(context: PayrollContext): ValidationResult {
    const maxDias = {
      'semanal': 7,
      'catorcenal': 14,
      'quincenal': 15,
      'mensual': 31
    }[context.period.frecuencia];

    if (context.calculations.diasTrabajados > maxDias) {
      return {
        valid: false,
        errors: [{
          code: 'DIAS_TRABAJADOS_EXCEDIDOS',
          message: `Días trabajados ${context.calculations.diasTrabajados} excede el máximo ${maxDias}`,
          severity: 'error'
        }],
        warnings: []
      };
    }
    return { valid: true, errors: [], warnings: [] };
  }
}
```

### Post-Calculation Validations

```typescript
class PostCalculationValidators {
  static limiteDeduccionesLegal(context: PayrollContext): ValidationResult {
    // Maximum 30% of gross can be deducted (excluding ISR, IMSS, INFONAVIT)
    const deduccionesDiscrecionales = context.calculations.totalDeduccionesBp
      - (context.deductions.get('ISR')?.montoBp || 0n)
      - (context.deductions.get('IMSS')?.montoBp || 0n)
      - (context.deductions.get('INFONAVIT')?.montoBp || 0n);

    const limite30Pct = dividirBp(context.calculations.totalPerceptionesBp, 3n);

    if (compararBp(deduccionesDiscrecionales, limite30Pct) > 0) {
      return {
        valid: false,
        errors: [],
        warnings: [{
          code: 'DEDUCCIONES_EXCEDEN_30PCT',
          message: `Deducciones discrecionales ${bpToPesos(deduccionesDiscrecionales)} exceden el 30% del salario`,
          severity: 'warning'
        }]
      };
    }
    return { valid: true, errors: [], warnings: [] };
  }

  static netoPagarPositivo(context: PayrollContext): ValidationResult {
    if (compararBp(context.calculations.netoPagarBp, 0n) <= 0) {
      return {
        valid: false,
        errors: [{
          code: 'NETO_NEGATIVO_O_CERO',
          message: `Neto a pagar es ${bpToPesos(context.calculations.netoPagarBp)}`,
          severity: 'error'
        }],
        warnings: []
      };
    }
    return { valid: true, errors: [], warnings: [] };
  }

  static topeSBC(context: PayrollContext): ValidationResult {
    const sdi = calcularSDI(context.employee.salarioDiarioBp);
    const sbc = calcularSBC(sdi);

    const umaDiariaBp = pesosToBp(CONFIG_FISCAL_2026.uma.diaria);
    const topeMaxBp = multiplicarBpPorTasa(umaDiariaBp, 250000);  // 25 UMAs

    if (compararBp(sbc, topeMaxBp) > 0) {
      return {
        valid: true,
        errors: [],
        warnings: [{
          code: 'SBC_EXCEDE_TOPE',
          message: `SBC ${bpToPesos(sbc)} excede tope de 25 UMAs ${bpToPesos(topeMaxBp)}`,
          severity: 'warning'
        }]
      };
    }
    return { valid: true, errors: [], warnings: [] };
  }
}
```

---

## 📊 Audit Trail System

```typescript
interface AuditEntry {
  timestamp: Date;
  phase: 'init' | 'base' | 'perception' | 'deduction' | 'validation' | 'complete';
  action: string;
  conceptCode?: string;
  data: any;
  duration?: number;  // milliseconds
}

class AuditLogger {
  private entries: AuditEntry[] = [];

  log(phase: string, action: string, data: any): void {
    this.entries.push({
      timestamp: new Date(),
      phase: phase as any,
      action,
      data
    });
  }

  logCalculation(concept: ConceptDefinition, result: CalculatedConcept, duration: number): void {
    this.entries.push({
      timestamp: new Date(),
      phase: concept.tipo === 'percepcion' ? 'perception' : 'deduction',
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

  getReport(): AuditReport {
    return {
      totalDuration: this.entries.reduce((sum, e) => sum + (e.duration || 0), 0),
      phases: groupBy(this.entries, 'phase'),
      timeline: this.entries
    };
  }
}
```

---

## 🚀 Performance Considerations

1. **Lazy Loading**: Load concepts only when needed
2. **Caching**: Cache calculated values (SDI, SBC, etc.) within context
3. **Parallel Processing**: Calculate independent concepts in parallel
4. **Database Optimization**: Index on execution_order, tipo, activo
5. **Formula Compilation**: Pre-compile formulas once, reuse

---

## 🧪 Testing Strategy

```typescript
describe('Payroll Engine', () => {
  describe('Complete Calculation', () => {
    it('should calculate simple payroll correctly', async () => {
      const result = await calcularNominaCompleta(mockEmployee, mockPeriod, []);
      expect(result.neto).toBeCloseTo(expectedNeto);
    });

    it('should handle overtime correctly', async () => {
      const incidents = [{ tipo: 'horas_extra', cantidad: 5, datos: { horasDobles: 5 }}];
      const result = await calcularNominaCompleta(mockEmployee, mockPeriod, incidents);
      expect(result.perceptions).toHaveProperty('HORAS_EXTRA');
    });
  });

  describe('Validations', () => {
    it('should reject salary below minimum', async () => {
      const lowSalaryEmployee = { ...mockEmployee, salarioDiario: 100 };
      await expect(calcularNominaCompleta(lowSalaryEmployee, mockPeriod, []))
        .rejects.toThrow('SALARIO_MENOR_MINIMO');
    });
  });

  describe('Dynamic Concepts', () => {
    it('should evaluate formula-based concepts', async () => {
      await registry.registerConcept({
        codigo: 'BONO_TEST',
        formula: 'salario_base * 0.10',
        tipo: 'percepcion'
      });

      const result = await calcularNominaCompleta(mockEmployee, mockPeriod, []);
      expect(result.perceptions.get('BONO_TEST')).toBeDefined();
    });
  });
});
```

---

## 📋 Implementation Checklist

### Phase 1: Core Engine (Week 1)
- [ ] PayrollContext data structure
- [ ] ConceptRegistry with DB loading
- [ ] Formula evaluator integration
- [ ] Dependency resolver (topological sort)
- [ ] Basic orchestrator flow

### Phase 2: Calculators (Week 2)
- [ ] All perception calculators
- [ ] All deduction calculators
- [ ] ISR 2026 integration
- [ ] IMSS integration
- [ ] Other payments

### Phase 3: Validations (Week 3)
- [ ] Pre-calculation validators
- [ ] Post-calculation validators
- [ ] Business rule validators
- [ ] Validation framework

### Phase 4: Audit & Polish (Week 4)
- [ ] Audit trail system
- [ ] Performance optimization
- [ ] Error handling
- [ ] Comprehensive tests
- [ ] Documentation

---

This architecture provides:
- ✅ NOI-level validation rigor
- ✅ Easy extensibility (add concepts via DB or code)
- ✅ Complete audit trail
- ✅ Production-grade error handling
- ✅ Performance at scale

Ready to start implementation?
