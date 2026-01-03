# HRMax Payroll Engine - Testing Guide

## Overview

This document describes the comprehensive test suite for the HRMax Payroll Engine V2. The test suite ensures accuracy, compliance, and reliability across all payroll calculations.

## Test Coverage

### 📊 Test Statistics

- **Total Test Suites**: 9
- **Total Test Cases**: 50+
- **Code Coverage Target**: 90%+
- **Test Types**: Unit, Integration, Performance

### 🎯 Coverage Areas

1. **2026 Fiscal Configuration** (4 tests)
   - Minimum wage validation
   - ISR table verification
   - Subsidio al empleo configuration

2. **ISR Calculator** (6 tests)
   - Monthly period calculations
   - Quincenal period calculations
   - Subsidio al empleo for low income
   - Minimum wage earner scenarios
   - High income calculations

3. **Individual Calculators** (15 tests)
   - Salario Base (2 tests)
   - Horas Extra (4 tests)
   - Faltas (1 test)
   - Prima Dominical (1 test)
   - Vales de Despensa (1 test)
   - And more...

4. **Validation Framework** (12 tests)
   - Pre-calculation validations (4 tests)
   - Post-calculation validations (4 tests)
   - Business rule validations (4 tests)

5. **Orchestrator Integration** (8 tests)
   - Complete payroll flow
   - Dependency resolution
   - Overtime handling
   - Absence deductions
   - Audit trail generation
   - Error scenarios

6. **Edge Cases** (5 tests)
   - Minimum wage employees
   - Zero hours overtime
   - High salary scenarios
   - Fractional day calculations

7. **Performance** (1 test)
   - Sub-second calculation verification

## Setup Instructions

### 1. Install Dependencies

```bash
npm install -D vitest @vitest/ui
```

### 2. Update package.json Scripts

Add the following scripts to your `package.json`:

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest --watch"
  }
}
```

### 3. Install Coverage Provider (Optional)

```bash
npm install -D @vitest/coverage-v8
```

## Running Tests

### Run All Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Run Tests with UI

```bash
npm run test:ui
```

This opens an interactive web interface showing:
- Test results in real-time
- Code coverage
- Test execution timeline
- Detailed error messages

### Run Tests with Coverage

```bash
npm run test:coverage
```

Coverage report will be generated in `coverage/` directory.

### Run Specific Test Suite

```bash
npm test payrollEngine.test.ts
```

### Run Tests Matching Pattern

```bash
npm test -t "ISR Calculator"
```

## Test Structure

### Test File Organization

```
shared/
├── payrollEngine.ts          # Core engine (tested)
├── payrollEngineV2.ts        # Orchestrator (tested)
├── payrollCalculators.ts     # Calculators (tested)
├── payrollValidators.ts      # Validators (tested)
└── payrollEngine.test.ts     # Test suite
```

### Test Suite Structure

Each test suite follows this pattern:

```typescript
describe('Component Name', () => {
  // Setup
  beforeEach(() => {
    // Initialize test data
  });

  describe('Feature/Function Name', () => {
    it('should do something specific', () => {
      // Arrange
      const input = createTestData();

      // Act
      const result = functionUnderTest(input);

      // Assert
      expect(result).toBe(expectedValue);
    });
  });
});
```

## Key Test Scenarios

### 1. Basic Payroll Calculation

```typescript
const employee = createTestEmployee({
  salarioDiarioBp: pesosToBp(600), // $600/day
});

const period = createTestPeriod({
  diasLaborales: 11, // Quincenal
});

const result = await orchestrator.calcularNominaCompleta(
  employee,
  period,
  []
);

// Expected:
// - Base salary: $6,600 (600 × 11)
// - ISR deduction
// - IMSS deduction
// - Net pay > 0
```

### 2. Overtime Calculation

```typescript
const incidents = [{
  tipo: 'horas_extra',
  cantidad: 5,
  datos: { horasDobles: 5, horasTriples: 0 },
  aprobado: true,
}];

// Expected:
// - Overtime pay calculated at 200% rate
// - Exemption applied (first 9 hours/week)
// - Warning if exceeds 9 hours/week
```

### 3. Absence Deduction

```typescript
const incidents = [{
  tipo: 'falta',
  cantidad: 2, // 2 days absent
  aprobado: true,
}];

// Expected:
// - Deduction: $1,200 (600 × 2)
// - Reduced net pay
```

### 4. Validation Failure

```typescript
const employee = createTestEmployee({
  estatus: 'inactivo', // Inactive employee
});

// Expected:
// - Throws PayrollValidationError
// - Error code: 'EMPLEADO_INACTIVO'
```

## Test Data Fixtures

### createTestEmployee()

Creates a standard test employee with:
- Salary: $600/day ($18,000/month)
- Status: Active
- Contract: Indefinite
- Period: Quincenal

```typescript
const employee = createTestEmployee({
  salarioDiarioBp: pesosToBp(800), // Override salary
  estatus: 'inactivo', // Override status
});
```

### createTestPeriod()

Creates a standard payroll period:
- Frequency: Quincenal
- Working days: 11
- Year: 2026
- Month: January

```typescript
const period = createTestPeriod({
  diasLaborales: 15, // Override working days
  frecuencia: 'mensual', // Override frequency
});
```

## Assertion Examples

### Testing Calculations

```typescript
// Exact match
expect(result.montoBp).toBe(pesosToBp(6600));

// Close match (within 2 decimals)
expect(bpToPesos(result.montoBp)).toBeCloseTo(6600, 2);

// Greater than
expect(result.netoPagar).toBeGreaterThan(0);

// Contains
expect(result.percepciones).toContainEqual(
  expect.objectContaining({ codigo: 'SALARIO_BASE' })
);
```

### Testing Validations

```typescript
// Validation passed
expect(validationResult.valid).toBe(true);
expect(validationResult.errors).toHaveLength(0);

// Validation failed
expect(validationResult.valid).toBe(false);
expect(validationResult.errors).toHaveLength(1);
expect(validationResult.errors[0].code).toBe('ERROR_CODE');
```

### Testing Errors

```typescript
// Should throw specific error
await expect(
  orchestrator.calcularNominaCompleta(employee, period, [])
).rejects.toThrow(PayrollValidationError);

// Error message contains text
await expect(
  calculator.calculate(context)
).rejects.toThrow(/salary/i);
```

## Continuous Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm test
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
```

## Writing New Tests

### 1. Add Test for New Calculator

```typescript
describe('MiNuevoCalculator', () => {
  it('should calculate correctly', async () => {
    // Arrange
    context.incidents = [{ tipo: 'mi_nuevo_concepto', ... }];

    // Act
    const calculator = BUILTIN_CALCULATORS.MI_NUEVO;
    const result = await calculator.calculate(context);

    // Assert
    expect(result).not.toBeNull();
    expect(result?.montoBp).toBe(expectedValue);
  });
});
```

### 2. Add Test for New Validator

```typescript
describe('MiNuevoValidator', () => {
  it('should validate new rule', async () => {
    // Arrange
    const validator = new MiNuevoValidator();
    validationFramework.registerValidator(validator);

    // Act
    const result = await validationFramework.runValidations(context, 'pre');

    // Assert
    expect(result.valid).toBe(true);
  });
});
```

### 3. Add Integration Test

```typescript
it('should handle complex scenario', async () => {
  // Arrange: Set up employee with multiple incidents
  const employee = createTestEmployee();
  const period = createTestPeriod();
  const incidents = [
    { tipo: 'horas_extra', ... },
    { tipo: 'falta', ... },
    { tipo: 'vales_despensa', ... },
  ];

  // Act
  const result = await orchestrator.calcularNominaCompleta(
    employee,
    period,
    incidents
  );

  // Assert: Verify complete calculation
  expect(result.percepciones.length).toBe(3);
  expect(result.deducciones.length).toBeGreaterThan(0);
  expect(result.netoPagar).toBeGreaterThan(0);
  expect(result.auditTrail.length).toBeGreaterThan(10);
});
```

## Troubleshooting

### Tests Fail with "Cannot find module"

Ensure path aliases are configured in `vitest.config.ts`:

```typescript
resolve: {
  alias: {
    '@/shared': path.resolve(__dirname, './shared'),
  },
}
```

### Tests Timeout

Increase timeout in `vitest.config.ts`:

```typescript
test: {
  testTimeout: 30000, // 30 seconds
}
```

### Coverage Not Generated

Install coverage provider:

```bash
npm install -D @vitest/coverage-v8
```

## Best Practices

1. **Test One Thing**: Each test should verify a single behavior
2. **Descriptive Names**: Use clear, descriptive test names
3. **AAA Pattern**: Arrange, Act, Assert
4. **Independent Tests**: Tests should not depend on each other
5. **Use Fixtures**: Reuse test data via `createTestEmployee()` etc.
6. **Test Edge Cases**: Always test boundary conditions
7. **Test Errors**: Verify error handling and validation
8. **Keep Tests Fast**: Tests should run in under 1 second each
9. **Mock External Calls**: Don't make real API/DB calls in tests
10. **Update Tests**: When code changes, update tests immediately

## Test Metrics

### Expected Results

When running the complete test suite, you should see:

```
✓ 2026 Fiscal Configuration (4 tests)
✓ ISR Calculator 2026 (6 tests)
✓ Payroll Calculators (15 tests)
  ✓ SalarioBaseCalculator (2 tests)
  ✓ HorasExtraCalculator (4 tests)
  ✓ FaltasCalculator (1 test)
  ✓ PrimaDominicalCalculator (1 test)
  ✓ ValesDespensaCalculator (1 test)
✓ Validation Framework (12 tests)
  ✓ Pre-Calculation Validations (4 tests)
  ✓ Post-Calculation Validations (4 tests)
  ✓ Business Rule Validations (4 tests)
✓ PayrollOrchestrator (8 tests)
✓ Edge Cases (5 tests)
✓ Performance (1 test)

Test Files  1 passed (1)
     Tests  51 passed (51)
  Start at  14:30:15
  Duration  850ms
```

### Coverage Goals

- **Statements**: 90%+
- **Branches**: 85%+
- **Functions**: 90%+
- **Lines**: 90%+

## Next Steps

1. **Install Vitest**: `npm install -D vitest @vitest/ui`
2. **Run Tests**: `npm test`
3. **Review Coverage**: `npm run test:coverage`
4. **Add Tests**: For custom calculators/validators
5. **CI Integration**: Add to GitHub Actions
6. **Monitor**: Track test results and coverage over time

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Mexican Payroll Regulations](https://www.sat.gob.mx/)

---

**Test with Confidence!** 🧪✅

The comprehensive test suite ensures that every payroll calculation is accurate, compliant, and reliable for production use.
