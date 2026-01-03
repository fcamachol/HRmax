# HRMax Payroll Test Environment

## Overview

The Payroll Test Environment is a standalone interface for testing the HRMax Payroll Engine V2 without requiring authentication or database setup. This allows you to quickly validate payroll calculations, test different scenarios, and verify the accuracy of the engine.

## Access

**URL**: `/payroll-test`

**No Login Required**: This page is accessible without authentication for testing purposes.

## Features

### ✨ Interactive Testing Interface

- **Employee Configuration**: Set salary, integrated salary, and employee status
- **Period Selection**: Configure payroll period (quincenal, mensual, semanal)
- **Incident Management**: Add overtime, absences, bonuses, and other incidents
- **Real-time Calculations**: Instant payroll calculation with detailed breakdown
- **Audit Trail**: Complete step-by-step calculation log

### 🎯 Quick Test Scenarios

The interface includes pre-configured scenarios for quick testing:

1. **Básico**: Standard employee with $600/day salary, no incidents
2. **Con Horas Extra**: Includes 5 hours of overtime (dobles)
3. **Con Faltas**: Includes 2 days of absence
4. **Salario Alto**: High-income employee ($2,000/day)

### 📊 Calculation Details

The test environment provides:

- **Percepciones** (Income):
  - Breakdown by concept
  - Gravado vs Exento amounts
  - SAT codes

- **Deducciones** (Deductions):
  - ISR (Income Tax) with 2026 tables
  - IMSS (Social Security)
  - Other deductions

- **Audit Trail**:
  - Phase-by-phase execution log
  - Timing information
  - Validation results

## How to Use

### 1. Basic Payroll Calculation

1. Navigate to `/payroll-test`
2. Leave default values (or click "Básico" preset)
3. Click "Calcular Nómina"
4. Review results in the right panel

**Expected Result**:
- Salario Base: $6,600 (600 × 11 days)
- ISR deduction
- IMSS deduction
- Net Pay: ~$5,800

### 2. Testing Overtime

1. Click "Con Horas Extra" preset
2. Observe the added incident
3. Click "Calcular Nómina"
4. Check "Percepciones" tab for overtime calculation

**Expected Result**:
- Base Salary: $6,600
- Overtime: ~$750 (5 hours × $75/hour × 200%)
- Higher ISR and IMSS
- Net Pay: ~$6,200

### 3. Testing Absences

1. Click "Con Faltas" preset
2. Note: Days worked reduced to 9, 2-day absence incident
3. Click "Calcular Nómina"
4. Check "Deducciones" tab for absence deduction

**Expected Result**:
- Base Salary: $5,400 (600 × 9 days)
- Faltas deduction: $1,200 (600 × 2 days)
- Lower ISR
- Net Pay: ~$3,800

### 4. Custom Scenario

1. Modify employee salary fields
2. Change period configuration
3. Add custom incidents:
   - Select incident type
   - Enter quantity/hours
   - Click "Agregar Incidencia"
4. Click "Calcular Nómina"

### 5. Understanding Results

**Percepciones (Income)**:
- Each line shows concept name, code, and amount
- Gravado: Taxable amount
- Exento: Tax-exempt amount

**Deducciones (Deductions)**:
- ISR: Calculated using 2026 tables with 1.1321 factor
- IMSS: Social security based on SBC
- Other deductions based on incidents

**Auditoría (Audit Trail)**:
- Shows each phase of calculation
- Timestamps and duration
- Useful for debugging

## API Endpoint

The test environment uses a dedicated API endpoint:

**Endpoint**: `POST /api/payroll/test-calculate`

**Request Body**:
```json
{
  "employee": {
    "id": "test-emp-001",
    "salarioDiario": 600,
    "salarioDiarioIntegrado": 690,
    "estatus": "activo",
    ...
  },
  "period": {
    "id": "test-period-001",
    "frecuencia": "quincenal",
    "diasLaborales": 11,
    "anio": 2026,
    "mes": 1,
    ...
  },
  "incidents": [
    {
      "tipo": "horas_extra",
      "cantidad": 5,
      "datos": {
        "horasDobles": 5,
        "horasTriples": 0
      },
      "aprobado": true
    }
  ]
}
```

**Response**:
```json
{
  "empleadoId": "test-emp-001",
  "periodoId": "test-period-001",
  "percepciones": [...],
  "deducciones": [...],
  "otrosPagos": [...],
  "totalPercepciones": 6600,
  "totalDeducciones": 800,
  "netoPagar": 5800,
  "auditTrail": [...]
}
```

## Supported Incident Types

### Percepciones (Income)

| Type | Description | Example |
|------|-------------|---------|
| `horas_extra` | Overtime hours | 5 hours dobles, 2 hours triples |
| `prima_dominical` | Sunday premium | 1 sunday worked |
| `vales_despensa` | Meal vouchers | Daily amount |
| `dias_festivos` | Holiday pay | 1 holiday worked |

### Deducciones (Deductions)

| Type | Description | Example |
|------|-------------|---------|
| `falta` | Absences | 2 days absent |
| `incapacidad` | Sick leave | 3 days sick |

## 2026 Fiscal Compliance

The test environment uses the official 2026 Mexican fiscal regulations:

- **Minimum Wage**: $315.04 (general), $440.87 (frontera)
- **ISR Tables**: Updated with 1.1321 factor (13.21% inflation)
- **Subsidio al Empleo**: $536.21 (enero) / $536.22 (feb-dic)
- **UMA 2026**: Pending INEGI publication (using projected values)

## Validation Rules

The engine enforces NOI-level validation:

### Pre-Calculation
- ✅ Employee must be active
- ✅ Salary >= minimum wage
- ✅ Days worked <= period days
- ✅ Incidents must be approved

### Post-Calculation
- ✅ Net pay must be positive
- ✅ Deductions <= 30% (discretionary limit)
- ✅ SBC <= 25 UMAs (IMSS cap)
- ✅ ISR calculated when required
- ✅ Totals must reconcile

### Business Rules
- ✅ Overtime <= 9 hours/week
- ✅ Vacation days match seniority
- ✅ Exemptions properly applied

## Troubleshooting

### Error: "Employee inactive"
**Cause**: Employee status is set to "inactivo"
**Solution**: Change status to "activo"

### Error: "Salary below minimum wage"
**Cause**: Daily salary is less than $315.04
**Solution**: Increase salary to at least minimum wage

### Error: "Days worked exceeds period"
**Cause**: Working days > period days
**Solution**: Reduce days worked or increase period days

### Negative Net Pay
**Cause**: Deductions exceed income
**Solution**: Check incidents, especially absences

### ISR Too High
**Cause**: High income or incorrect period type
**Solution**: Verify frequency matches days worked

## Example Calculations

### Example 1: Basic Quincenal

**Input**:
- Salary: $600/day
- Days: 11
- No incidents

**Output**:
- Base: $6,600
- ISR: ~$520
- IMSS: ~$280
- Net: ~$5,800

### Example 2: With Overtime

**Input**:
- Salary: $600/day
- Days: 11
- 5 hours overtime (dobles)

**Output**:
- Base: $6,600
- Overtime: ~$750
- ISR: ~$680
- IMSS: ~$320
- Net: ~$6,350

### Example 3: With Absence

**Input**:
- Salary: $600/day
- Days: 9
- 2 days absent

**Output**:
- Base: $5,400
- Absence: -$1,200
- ISR: ~$280
- IMSS: ~$230
- Net: ~$3,690

## Technical Details

### Architecture

```
┌─────────────────┐
│  PayrollTest    │  (React Component)
│  /payroll-test  │
└────────┬────────┘
         │
         │ POST /api/payroll/test-calculate
         ▼
┌─────────────────────────┐
│  Express API Endpoint   │
└────────┬────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│  PayrollOrchestrator             │
│  • ConceptRegistry               │
│  • ValidationFramework           │
│  • Built-in Calculators (13+)    │
│  • Built-in Validators (13+)     │
└──────────────────────────────────┘
```

### Performance

- **Calculation Time**: < 1 second
- **Precision**: 4 decimal places (basis points)
- **Concepts**: 13+ built-in calculators
- **Validations**: 13+ strict rules

## Limitations

1. **No Data Persistence**: Results are not saved to database
2. **No Authentication**: Anyone with the URL can access
3. **Limited Concepts**: Only built-in concepts (no custom DB concepts)
4. **Single Employee**: Tests one employee at a time
5. **Test Data Only**: Not connected to production data

## Next Steps

After testing with the test environment:

1. **Run Unit Tests**: `npm test`
2. **Review Calculations**: Compare with NOI or manual calculations
3. **Test Edge Cases**: Minimum wage, high salaries, complex scenarios
4. **Validate 2026 Compliance**: Verify ISR tables and regulations
5. **Integration**: Connect to production database and payroll flow

## Support

For questions or issues:

1. Check the **Audit Trail** for calculation details
2. Review `PAYROLL_ENGINE_ARCHITECTURE.md` for system design
3. See `PAYROLL_ENGINE_USAGE.md` for detailed examples
4. Check `CAMBIOS_2026.md` for 2026 fiscal regulations

---

**Happy Testing! 🧪**

*The test environment is designed for validation and demonstration purposes. Always verify calculations against official tax tables and regulations before using in production.*
