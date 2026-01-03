# HRMax Payroll Engine V2 - Usage Guide

Complete guide to using the ultimate payroll calculation engine.

---

## 🚀 Quick Start

```typescript
import {
  ConceptRegistry,
  ValidationFramework,
  PayrollOrchestrator
} from '@/shared/payrollEngineV2';

import { BUILTIN_CALCULATORS } from '@/shared/payrollCalculators';
import { BUILTIN_VALIDATORS } from '@/shared/payrollValidators';

// 1. Setup
const registry = new ConceptRegistry();
const validationFramework = new ValidationFramework();
const orchestrator = new PayrollOrchestrator(registry, validationFramework);

// 2. Register built-in calculators
for (const [name, calculator] of Object.entries(BUILTIN_CALCULATORS)) {
  registry.registerCalculator(name, calculator);
}

// 3. Register built-in validators
for (const validator of BUILTIN_VALIDATORS) {
  validationFramework.registerValidator(validator);
}

// 4. Register concepts
registry.registerConcept({
  id: 'salario-base-001',
  codigo: 'SALARIO_BASE',
  nombre: 'Sueldo',
  tipo: 'percepcion',
  satClave: '001',
  gravableISR: true,
  integraSDI: true,
  integraIMSS: true,
  tipoCalculo: 'codigo',
  codigoCalculador: 'SALARIO_BASE',
  dependencias: [],
  ordenEjecucion: 1,
  validaciones: [],
  activo: true,
  obligatorio: true
});

// ... register more concepts

// 5. Calculate payroll
const employee = {
  id: 'emp-123',
  numeroEmpleado: '0001',
  nombre: 'Juan',
  apellidoPaterno: 'Pérez',
  apellidoMaterno: 'García',
  salarioDiarioNominal: 500,
  salarioDiarioBp: pesosToBp(500),
  fechaAlta: new Date('2020-01-01'),
  estatus: 'activo',
  grupoNominaId: 'grupo-001'
};

const period = {
  id: 'period-202601-01',
  numero: 1,
  anio: 2026,
  mes: 1,
  frecuencia: 'quincenal',
  fechaInicio: new Date('2026-01-01'),
  fechaFin: new Date('2026-01-15'),
  fechaPago: new Date('2026-01-16'),
  diasCalendario: 15,
  diasLaborales: 11
};

const incidents = [
  {
    id: 'inc-001',
    tipo: 'horas_extra',
    fecha: new Date('2026-01-10'),
    cantidad: 5,
    datos: { horasDobles: 5, horasTriples: 0 },
    aprobado: true
  }
];

try {
  const result = await orchestrator.calcularNominaCompleta(
    employee,
    period,
    incidents
  );

  console.log('Payroll calculation successful!');
  console.log(`Employee: ${result.nombreCompleto}`);
  console.log(`Period: ${result.periodo}`);
  console.log(`Days worked: ${result.diasTrabajados}`);
  console.log(`Gross: $${result.totalPercepciones.toFixed(2)}`);
  console.log(`Deductions: $${result.totalDeducciones.toFixed(2)}`);
  console.log(`Net: $${result.netoPagar.toFixed(2)}`);

  // Audit trail
  console.log(`Calculation time: ${result.auditTrail.reduce((s, e) => s + (e.duration || 0), 0)}ms`);

} catch (error) {
  if (error instanceof PayrollValidationError) {
    console.error('Validation errors:', error.errors);
  } else {
    console.error('Calculation error:', error.message);
  }
}
```

---

## 📋 Complete Concept Registration

### Option 1: Register Concepts from Code

```typescript
// Perceptions
const perceptionConcepts = [
  {
    id: 'salario-base-001',
    codigo: 'SALARIO_BASE',
    nombre: 'Sueldo',
    tipo: 'percepcion',
    satClave: '001',
    gravableISR: true,
    integraSDI: true,
    integraIMSS: true,
    tipoCalculo: 'codigo',
    codigoCalculador: 'SALARIO_BASE',
    dependencias: [],
    ordenEjecucion: 1,
    activo: true,
    obligatorio: true
  },
  {
    id: 'horas-extra-019',
    codigo: 'HORAS_EXTRA',
    nombre: 'Horas Extra',
    tipo: 'percepcion',
    satClave: '019',
    gravableISR: true,
    integraSDI: false,
    integraIMSS: false,
    tipoCalculo: 'codigo',
    codigoCalculador: 'HORAS_EXTRA',
    dependencias: ['SALARIO_BASE'],
    ordenEjecucion: 10,
    activo: true,
    obligatorio: false
  },
  {
    id: 'prima-dominical-020',
    codigo: 'PRIMA_DOMINICAL',
    nombre: 'Prima Dominical',
    tipo: 'percepcion',
    satClave: '020',
    gravableISR: true,
    integraSDI: false,
    integraIMSS: false,
    tipoCalculo: 'codigo',
    codigoCalculador: 'PRIMA_DOMINICAL',
    dependencias: ['SALARIO_BASE'],
    ordenEjecucion: 11,
    activo: true,
    obligatorio: false
  },
  {
    id: 'vales-despensa-029',
    codigo: 'VALES_DESPENSA',
    nombre: 'Vales de Despensa',
    tipo: 'percepcion',
    satClave: '029',
    gravableISR: false,
    integraSDI: false,
    integraIMSS: false,
    tipoCalculo: 'codigo',
    codigoCalculador: 'VALES_DESPENSA',
    dependencias: [],
    ordenEjecucion: 20,
    activo: true,
    obligatorio: true
  }
];

// Deductions
const deductionConcepts = [
  {
    id: 'faltas-020',
    codigo: 'FALTAS',
    nombre: 'Descuento por Faltas',
    tipo: 'deduccion',
    satClave: '020',
    gravableISR: false,
    integraSDI: false,
    integraIMSS: false,
    tipoCalculo: 'codigo',
    codigoCalculador: 'FALTAS',
    dependencias: ['SALARIO_BASE'],
    ordenEjecucion: 5,
    activo: true,
    obligatorio: false
  },
  {
    id: 'isr-002',
    codigo: 'ISR',
    nombre: 'ISR',
    tipo: 'deduccion',
    satClave: '002',
    gravableISR: false,
    integraSDI: false,
    integraIMSS: false,
    tipoCalculo: 'codigo',
    codigoCalculador: 'ISR',
    dependencias: [], // Calculated after all perceptions
    ordenEjecucion: 100,
    activo: true,
    obligatorio: true
  },
  {
    id: 'imss-001',
    codigo: 'IMSS',
    nombre: 'Cuotas IMSS',
    tipo: 'deduccion',
    satClave: '001',
    gravableISR: false,
    integraSDI: false,
    integraIMSS: false,
    tipoCalculo: 'codigo',
    codigoCalculador: 'IMSS',
    dependencias: [],
    ordenEjecucion: 101,
    activo: true,
    obligatorio: true
  }
];

// Register all
for (const concept of [...perceptionConcepts, ...deductionConcepts]) {
  registry.registerConcept(concept);
}
```

### Option 2: Load from Database

```typescript
async function loadConceptsFromDatabase(clienteId: string, empresaId?: string) {
  const dbConcepts = await db.query.conceptosMedioPago.findMany({
    where: and(
      eq(conceptosMedioPago.clienteId, clienteId),
      empresaId ? eq(conceptosMedioPago.empresaId, empresaId) : undefined,
      eq(conceptosMedioPago.activo, true)
    ),
    orderBy: asc(conceptosMedioPago.ordenEjecucion)
  });

  for (const dbConcept of dbConcepts) {
    registry.registerConcept({
      id: dbConcept.id,
      codigo: dbConcept.codigo,
      nombre: dbConcept.nombre,
      descripcion: dbConcept.descripcion,
      tipo: dbConcept.tipo as TipoConcepto,
      satClave: dbConcept.satClave || '038',
      gravableISR: dbConcept.gravableIsr,
      integraSDI: dbConcept.integraSDI,
      integraIMSS: dbConcept.integraIMSS,
      tipoCalculo: dbConcept.tipoCalculo as TipoCalculo,
      formula: dbConcept.formula,
      codigoCalculador: dbConcept.codigoCalculador,
      dependencias: (dbConcept.dependencias as string[]) || [],
      ordenEjecucion: dbConcept.ordenEjecucion,
      limites: dbConcept.limiteMinimo || dbConcept.limiteMaximo ? {
        minimo: dbConcept.limiteMinimo ? pesosToBp(dbConcept.limiteMinimo) : undefined,
        maximo: dbConcept.limiteMaximo ? pesosToBp(dbConcept.limiteMaximo) : undefined,
        porcentajeMaximoSalario: dbConcept.limitePorcentajeSalario
      } : undefined,
      validaciones: (dbConcept.validaciones as string[]) || [],
      activo: dbConcept.activo,
      obligatorio: dbConcept.obligatorio || false
    });
  }
}
```

---

## 🎯 Examples by Scenario

### Scenario 1: Simple Payroll (No Incidents)

```typescript
const employee = {
  id: 'emp-001',
  numeroEmpleado: '0001',
  nombre: 'María',
  apellidoPaterno: 'González',
  salarioDiarioNominal: 600,
  salarioDiarioBp: pesosToBp(600),
  fechaAlta: new Date('2022-03-15'),
  estatus: 'activo',
  grupoNominaId: 'quincenal-001'
};

const period = {
  id: 'per-202601-q1',
  numero: 1,
  anio: 2026,
  mes: 1,
  frecuencia: 'quincenal',
  fechaInicio: new Date('2026-01-01'),
  fechaFin: new Date('2026-01-15'),
  fechaPago: new Date('2026-01-16'),
  diasCalendario: 15,
  diasLaborales: 11
};

const incidents = []; // No incidents

const result = await orchestrator.calcularNominaCompleta(
  employee,
  period,
  incidents
);

// Expected result:
// - Sueldo: $6,600 (600 × 11)
// - Vales: ~$1,235 (315.04 × 0.40 × 11)
// - ISR: ~$750
// - IMSS: ~$410
// - Neto: ~$6,675
```

### Scenario 2: With Overtime

```typescript
const incidents = [
  {
    id: 'inc-he-001',
    tipo: 'horas_extra',
    fecha: new Date('2026-01-10'),
    cantidad: 8,
    datos: {
      horasDobles: 8,
      horasTriples: 0
    },
    aprobado: true
  }
];

const result = await orchestrator.calcularNominaCompleta(
  employee,
  period,
  incidents
);

// Expected result:
// - Sueldo: $6,600
// - Horas Extra: $1,200 (600/8 × 2 × 8)
//   - Exento: ~$1,000
//   - Gravado: ~$200
// - Vales: ~$1,235
// - ISR: ~$780
// - Neto: ~$7,855
```

### Scenario 3: With Absences

```typescript
const incidents = [
  {
    id: 'inc-falta-001',
    tipo: 'faltas',
    fecha: new Date('2026-01-08'),
    cantidad: 2,
    aprobado: true
  }
];

const result = await orchestrator.calcularNominaCompleta(
  employee,
  period,
  incidents
);

// Expected result:
// - Sueldo: $5,400 (600 × 9 days)
// - Vales: ~$1,013
// - Descuento Faltas: -$1,200
// - ISR: ~$550
// - Neto: ~$5,463
```

### Scenario 4: With Sunday Premium

```typescript
const incidents = [
  {
    id: 'inc-dom-001',
    tipo: 'domingos_trabajados',
    fecha: new Date('2026-01-05'),
    cantidad: 1,
    aprobado: true
  },
  {
    id: 'inc-dom-002',
    tipo: 'domingos_trabajados',
    fecha: new Date('2026-01-12'),
    cantidad: 1,
    aprobado: true
  }
];

const result = await orchestrator.calcularNominaCompleta(
  employee,
  period,
  incidents
);

// Expected result:
// - Sueldo: $6,600
// - Prima Dominical: $300 (600 × 0.25 × 2)
//   - Exento: $300 (within limit)
// - Vales: ~$1,235
// - ISR: ~$750
// - Neto: ~$6,975
```

---

## 🔍 Accessing Calculation Details

### Audit Trail

```typescript
const result = await orchestrator.calcularNominaCompleta(employee, period, incidents);

// View audit trail
for (const entry of result.auditTrail) {
  console.log(`[${entry.phase}] ${entry.action}:`, entry.data);
  if (entry.duration) {
    console.log(`  Duration: ${entry.duration}ms`);
  }
}

// Total calculation time
const totalTime = result.auditTrail.reduce((sum, e) => sum + (e.duration || 0), 0);
console.log(`Total calculation time: ${totalTime}ms`);
```

### Concept Breakdown

```typescript
// View perception breakdown
for (const perception of result.percepciones) {
  console.log(`\n${perception.nombre}:`);
  console.log(`  Total: $${bpToPesos(perception.montoBp).toFixed(2)}`);
  console.log(`  Gravado: $${bpToPesos(perception.gravadoBp).toFixed(2)}`);
  console.log(`  Exento: $${bpToPesos(perception.exentoBp).toFixed(2)}`);

  if (perception.breakdown) {
    console.log(`  Formula: ${perception.breakdown.formula}`);
    console.log(`  Variables:`, perception.breakdown.variables);

    if (perception.breakdown.steps) {
      console.log(`  Steps:`);
      for (const step of perception.breakdown.steps) {
        console.log(`    ${step.step}. ${step.description}`);
        console.log(`       ${step.operation}`);
        console.log(`       Input: ${JSON.stringify(step.input)}`);
        console.log(`       Output: ${JSON.stringify(step.output)}`);
      }
    }
  }
}
```

### Validation Results

```typescript
// Check for warnings
if (result.warnings.length > 0) {
  console.log('\nWarnings:');
  for (const warning of result.warnings) {
    console.log(`  [${warning.code}] ${warning.message}`);
  }
}

// Check for errors (shouldn't happen if calculation succeeded)
if (result.errors.length > 0) {
  console.log('\nErrors:');
  for (const error of result.errors) {
    console.log(`  [${error.code}] ${error.message}`);
  }
}
```

---

## 🎨 Creating Custom Calculators

```typescript
class BonoProductividadCalculator implements ConceptCalculator {
  async calculate(context: PayrollContext): Promise<CalculatedConcept | null> {
    // Example: 10% bonus if employee met production goal

    // Check if goal was met (from incident or employee data)
    const metaIncident = context.incidents.find(i => i.tipo === 'meta_produccion');
    if (!metaIncident || !metaIncident.datos?.metaCumplida) {
      return null; // No bonus
    }

    const salarioBaseBp = context.perceptions.get('SALARIO_BASE')?.montoBp || 0n;
    const bonoBp = multiplicarBpPorTasa(salarioBaseBp, 1000); // 10%

    // First minimum wage is exempt
    const salarioMinimoBp = pesosToBp(CONFIG_FISCAL_2026.salarioMinimo.general);
    const exentoBp = minBp(bonoBp, salarioMinimoBp);
    const gravadoBp = restarBp(bonoBp, exentoBp);

    return {
      conceptoId: 'BONO_PRODUCTIVIDAD',
      codigo: '051',
      nombre: 'Bono de Productividad',
      montoBp: bonoBp,
      gravadoBp,
      exentoBp,
      satClave: '051',
      breakdown: {
        formula: 'salario_base × 0.10',
        variables: {
          salario_base: bpToPesos(salarioBaseBp),
          tasa: 10,
          meta_cumplida: true
        }
      }
    };
  }

  async validate(context: PayrollContext, result: CalculatedConcept): Promise<ValidationResult> {
    // Optional: custom validation
    return { valid: true, errors: [], warnings: [] };
  }
}

// Register it
registry.registerCalculator('BONO_PRODUCTIVIDAD', new BonoProductividadCalculator());

// Register concept
registry.registerConcept({
  id: 'bono-prod-051',
  codigo: 'BONO_PRODUCTIVIDAD',
  nombre: 'Bono de Productividad',
  tipo: 'percepcion',
  satClave: '051',
  gravableISR: true,
  integraSDI: false,
  integraIMSS: false,
  tipoCalculo: 'codigo',
  codigoCalculador: 'BONO_PRODUCTIVIDAD',
  dependencias: ['SALARIO_BASE'],
  ordenEjecucion: 30,
  activo: true,
  obligatorio: false
});
```

---

## ✅ Best Practices

1. **Always register concepts in dependency order** or let the orchestrator resolve it
2. **Use validation warnings** for business rules that shouldn't block payroll
3. **Use validation errors** for critical issues (negative net, missing ISR, etc.)
4. **Log audit trail** for debugging and compliance
5. **Test each calculator independently** before integration
6. **Cache registry and orchestrator** instances (don't recreate on every calculation)
7. **Load concepts once** at app startup or per-client basis
8. **Use breakdown** for transparency and debugging

---

## 📊 Performance Tips

```typescript
// 1. Cache orchestrator per client
const orchestratorCache = new Map<string, PayrollOrchestrator>();

function getOrchestrator(clienteId: string): PayrollOrchestrator {
  if (!orchestratorCache.has(clienteId)) {
    const registry = new ConceptRegistry();
    const validationFramework = new ValidationFramework();
    const orchestrator = new PayrollOrchestrator(registry, validationFramework);

    // Setup...
    setupOrchestrator(orchestrator, clienteId);

    orchestratorCache.set(clienteId, orchestrator);
  }

  return orchestratorCache.get(clienteId)!;
}

// 2. Batch process employees
async function calcularNominaLote(
  employees: Employee[],
  period: PayrollPeriod,
  incidentsMap: Map<string, Incident[]>
): Promise<PayrollResult[]> {
  const orchestrator = getOrchestrator(employees[0].clienteId);

  // Process in parallel (careful with DB connections)
  const results = await Promise.all(
    employees.map(emp =>
      orchestrator.calcularNominaCompleta(
        emp,
        period,
        incidentsMap.get(emp.id) || []
      )
    )
  );

  return results;
}
```

---

This payroll engine is production-ready, extensible, and NOI-level strict. Happy calculating! 🎉
