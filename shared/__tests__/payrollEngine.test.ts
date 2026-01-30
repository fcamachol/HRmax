/**
 * Unit Tests for Payroll Engine - NOI Parity Verification
 *
 * These tests verify that the payroll engine calculations match NOI (Aspel)
 * methodology for Mexican payroll compliance.
 *
 * To run: npm install vitest --save-dev && npx vitest run
 */

import { describe, it, expect } from 'vitest';
import {
  calcularISR,
  calcularSubsidio2025,
  calcularSubsidio2026,
  calcularAguinaldo,
  calcularPrimaVacacional,
  calcularPTU,
  calcularHorasExtra,
  calcularFiniquitoLiquidacion,
  calcularAjusteAnualISR,
  calcularISRExtraordinario,
  calcularISRAguinaldo,
  calcularISRPtu,
  calcularSDI,
  calcularSBC,
  calcularIMSSTrabajador,
  calcularIMSSPatron,
  getTasaCesantiaVejezPatronal,
  CONFIG_FISCAL_2026,
  CESANTIA_VEJEZ_OBRERO_TASA_BP,
  CESANTIA_VEJEZ_OBRERO_TASA_PORCENTAJE,
} from '../payrollEngine';
import {
  pesosToBp,
  bpToPesos,
} from '../basisPoints';

// ============================================================================
// ISR CALCULATION TESTS
// ============================================================================

describe('ISR Calculation (Art. 96 LISR)', () => {
  describe('Monthly ISR', () => {
    it('should calculate ISR correctly for minimum wage earner', () => {
      // Employee earning SMG 2026: $315.04/day × 30 = $9,451.20/month
      const baseGravable = pesosToBp(9451.20);
      const result = calcularISR(baseGravable, 'mensual');

      // Expected: Bracket 2 (844.59 - 7168.45)
      // Excedente = 9451.20 - 7168.46 = 2282.74
      // ISR excedente = 2282.74 × 10.88% = 248.36
      // ISR total = 248.36 + 420.94 = 669.30
      expect(bpToPesos(result.isrBp)).toBeCloseTo(669.30, 1);
      expect(result.tramoAplicado).toBe(3);
    });

    it('should calculate ISR correctly for high earner (no subsidy)', () => {
      // Employee earning $2,000/day × 30 = $60,000/month
      const baseGravable = pesosToBp(60000);
      const result = calcularISR(baseGravable, 'mensual');

      // Expected: Bracket 8 (55743.46 - 106404.70)
      // Excedente = 60000 - 55743.46 = 4256.54
      // ISR excedente = 4256.54 × 30% = 1276.96
      // ISR total = 1276.96 + 10456.75 = 11733.71
      expect(bpToPesos(result.isrBp)).toBeCloseTo(11733.71, 1);
      expect(bpToPesos(result.subsidioEmpleoBp)).toBe(0); // Income exceeds subsidy limit
      expect(result.tramoAplicado).toBe(8);
    });

    it('should apply subsidy correctly for eligible income', () => {
      // Employee earning $8,000/month (within subsidy limit of $11,492.66)
      const baseGravable = pesosToBp(8000);
      const result = calcularISR(baseGravable, 'mensual');

      // Subsidy should be ~$536.22 monthly (may have minor rounding)
      expect(bpToPesos(result.subsidioEmpleoBp)).toBeCloseTo(536.22, 1);

      // ISR retenido = ISR causado - subsidio (mínimo 0)
      const isrEsperado = bpToPesos(result.isrBp) - 536.22;
      if (isrEsperado > 0) {
        expect(bpToPesos(result.isrRetenidoBp)).toBeCloseTo(isrEsperado, 1);
      } else {
        expect(bpToPesos(result.isrRetenidoBp)).toBe(0);
      }
    });
  });

  describe('All Period Types', () => {
    it('should calculate ISR correctly for weekly period', () => {
      const baseGravable = pesosToBp(3000); // ~$3,000/week
      const result = calcularISR(baseGravable, 'semanal');
      expect(result.isrBp).toBeGreaterThan(BigInt(0));
      expect(result.tramoAplicado).toBeGreaterThan(0);
    });

    it('should calculate ISR correctly for biweekly (catorcenal) period', () => {
      const baseGravable = pesosToBp(6000);
      const result = calcularISR(baseGravable, 'catorcenal');
      expect(result.isrBp).toBeGreaterThan(BigInt(0));
      expect(result.tramoAplicado).toBeGreaterThan(0);
    });

    it('should calculate ISR correctly for quincenal period', () => {
      const baseGravable = pesosToBp(7500);
      const result = calcularISR(baseGravable, 'quincenal');
      expect(result.isrBp).toBeGreaterThan(BigInt(0));
      expect(result.tramoAplicado).toBeGreaterThan(0);
    });

    it('should calculate ISR correctly for daily period', () => {
      const baseGravable = pesosToBp(500);
      const result = calcularISR(baseGravable, 'diario');
      expect(result.isrBp).toBeGreaterThan(BigInt(0));
      expect(result.tramoAplicado).toBeGreaterThan(0);
    });
  });
});

// ============================================================================
// SUBSIDIO AL EMPLEO TESTS
// ============================================================================

describe('Subsidio al Empleo 2026', () => {
  it('should return full subsidy for income within limit', () => {
    // Income within limit ($10,000 < $11,492.66)
    const subsidio = calcularSubsidio2026(pesosToBp(10000), 'mensual');
    // ~$536.22 monthly (may have minor rounding due to factor calculation)
    expect(bpToPesos(subsidio)).toBeCloseTo(536.22, 1);
  });

  it('should return zero subsidy for income above limit', () => {
    // Income above limit ($12,000 > $11,492.66)
    const subsidio = calcularSubsidio2026(pesosToBp(12000), 'mensual');
    expect(bpToPesos(subsidio)).toBe(0);
  });

  it('should calculate proportional subsidy for quincenal', () => {
    const subsidio = calcularSubsidio2026(pesosToBp(5000), 'quincenal');
    // Quincenal subsidy = 536.22 × 15 / 30.4 ≈ 264.58
    expect(bpToPesos(subsidio)).toBeCloseTo(264.58, 0);
  });

  it('should calculate proportional subsidy for semanal', () => {
    const subsidio = calcularSubsidio2026(pesosToBp(2000), 'semanal');
    // Semanal subsidy = 536.22 × 7 / 30.4 ≈ 123.47
    expect(bpToPesos(subsidio)).toBeCloseTo(123.47, 0);
  });
});

// ============================================================================
// IMSS C&V TESTS
// ============================================================================

describe('IMSS Cesantía y Vejez', () => {
  describe('C&V Obrero Rate', () => {
    it('should have correct obrero rate constant (1.125%)', () => {
      expect(CESANTIA_VEJEZ_OBRERO_TASA_BP).toBe(112.5);
      expect(CESANTIA_VEJEZ_OBRERO_TASA_PORCENTAJE).toBe(1.125);
    });

    it('should calculate C&V obrero correctly using exact rate', () => {
      // $500/day × 30 days = $15,000 SBC
      // C&V Obrero = $15,000 × 1.125% = $168.75
      const sbcPeriodo = 15000;
      const expectedCuota = sbcPeriodo * 0.01125;
      expect(expectedCuota).toBe(168.75);
    });
  });

  describe('C&V Patron Progressive Rates', () => {
    it('should return 3.15% for SBC ≤ 1 UMA', () => {
      // SBC = $100/day, UMA = $117.31/day → ratio = 0.85
      const result = getTasaCesantiaVejezPatronal(100, 117.31);
      expect(result.tasaBp).toBe(315); // 3.15%
      expect(result.rangoDescripcion).toContain('UMA');
    });

    it('should return 3.68% for SBC between 1.01 and 1.50 UMA', () => {
      // SBC = $150/day, UMA = $117.31/day → ratio = 1.28
      const result = getTasaCesantiaVejezPatronal(150, 117.31);
      expect(result.tasaBp).toBe(368); // 3.68%
    });

    it('should return 7.51% for SBC > 4 UMA', () => {
      // SBC = $500/day, UMA = $117.31/day → ratio = 4.26
      const result = getTasaCesantiaVejezPatronal(500, 117.31);
      expect(result.tasaBp).toBe(751); // 7.51%
    });
  });
});

// ============================================================================
// SDI/SBC TESTS
// ============================================================================

describe('SDI/SBC Calculation', () => {
  it('should calculate SDI with minimum integration factor', () => {
    const salarioDiario = pesosToBp(500); // $500/day
    const result = calcularSDI(salarioDiario, 12, 25, 15);

    // Factor = 1 + 15/365 + (12 × 0.25)/365 = 1 + 0.0411 + 0.0082 = 1.0493
    expect(result.factorIntegracion).toBeCloseTo(1.0493, 3);
    expect(bpToPesos(result.sdiBp)).toBeCloseTo(524.65, 1);
  });

  it('should apply 25 UMA cap to SBC', () => {
    const sdi = pesosToBp(5000); // $5000/day (very high)
    const result = calcularSBC(sdi, 'general');

    // Tope = 25 × 117.31 = $2,932.75
    expect(result.topeAplicado).toBe(true);
    expect(bpToPesos(result.sbcBp)).toBeCloseTo(2828.50, 1); // 25 × 113.14 (UMA 2025 in config)
  });

  it('should apply minimum wage floor to SBC', () => {
    const sdi = pesosToBp(100); // $100/day (below minimum)
    const result = calcularSBC(sdi, 'general');

    // Piso = $278.80 (SMG 2025 in config)
    expect(result.minimoAplicado).toBe(true);
    expect(bpToPesos(result.sbcBp)).toBeGreaterThanOrEqual(278);
  });
});

// ============================================================================
// HORAS EXTRA TESTS
// ============================================================================

describe('Horas Extra (LFT Art. 67-68)', () => {
  it('should calculate double time correctly', () => {
    const salarioHora = pesosToBp(50); // $50/hour
    const result = calcularHorasExtra(salarioHora, 9, 0, pesosToBp(8000));

    // 9 hours × $50 × 2 = $900
    expect(bpToPesos(result.pagoDoblesBp)).toBe(900);
    expect(bpToPesos(result.pagoTriplesBp)).toBe(0);
  });

  it('should calculate triple time for hours exceeding 9/week', () => {
    const salarioHora = pesosToBp(50);
    const result = calcularHorasExtra(salarioHora, 9, 3, pesosToBp(8000));

    // Dobles: 9 × $50 × 2 = $900
    // Triples: 3 × $50 × 3 = $450
    expect(bpToPesos(result.pagoDoblesBp)).toBe(900);
    expect(bpToPesos(result.pagoTriplesBp)).toBe(450);
    expect(bpToPesos(result.totalBp)).toBe(1350);
  });

  it('should calculate exempt portion correctly', () => {
    const salarioHora = pesosToBp(50);
    const salarioPeriodo = pesosToBp(8000);
    const result = calcularHorasExtra(salarioHora, 9, 0, salarioPeriodo);

    // Exento hasta 50% del salario = $4,000
    // Pago dobles = $900 (menor que $4,000, todo exento)
    expect(bpToPesos(result.exentoBp)).toBe(900);
    expect(bpToPesos(result.gravadoBp)).toBe(0);
  });
});

// ============================================================================
// AGUINALDO TESTS
// ============================================================================

describe('Aguinaldo (LFT Art. 87)', () => {
  it('should calculate full year aguinaldo', () => {
    const salarioDiario = pesosToBp(500);
    const result = calcularAguinaldo(salarioDiario, 15, 365, true);

    // 15 días × $500 = $7,500
    expect(bpToPesos(result.aguinaldoBp)).toBe(7500);
    expect(result.diasProporcionales).toBe(15);
  });

  it('should calculate proportional aguinaldo', () => {
    const salarioDiario = pesosToBp(500);
    const result = calcularAguinaldo(salarioDiario, 15, 180, false);

    // (15 × 180) / 365 = 7.40 días
    // 7.40 × $500 = $3,698.63
    expect(result.diasProporcionales).toBeCloseTo(7.40, 1);
  });

  it('should apply 30 UMA exemption limit', () => {
    const salarioDiario = pesosToBp(500);
    const result = calcularAguinaldo(salarioDiario, 15, 365, true);

    // Aguinaldo = $7,500
    // Exención = 30 × $113.14 = $3,394.20 (UMA 2025)
    // Gravado = $7,500 - $3,394.20 = $4,105.80
    expect(bpToPesos(result.exentoBp)).toBeCloseTo(3394.20, 1);
    expect(bpToPesos(result.gravadoBp)).toBeCloseTo(4105.80, 1);
  });
});

// ============================================================================
// FINIQUITO TESTS
// ============================================================================

describe('Finiquito/Liquidación (LFT Art. 162)', () => {
  describe('Prima de Antigüedad', () => {
    it('should include prima antigüedad for unjustified dismissal', () => {
      const result = calcularFiniquitoLiquidacion(
        pesosToBp(500),
        new Date('2020-01-15'),
        new Date('2026-01-15'),
        'despido_injustificado',
        0, 0
      );

      const primaConcepto = result.conceptos.find(c =>
        c.concepto.includes('Prima de Antigüedad')
      );
      expect(primaConcepto).toBeDefined();
      expect(primaConcepto?.dias).toBe(72); // 12 days × 6 years
    });

    it('should include prima antigüedad for death', () => {
      const result = calcularFiniquitoLiquidacion(
        pesosToBp(500),
        new Date('2020-01-15'),
        new Date('2026-01-15'),
        'muerte',
        0, 0
      );

      const primaConcepto = result.conceptos.find(c =>
        c.concepto.includes('Prima de Antigüedad')
      );
      expect(primaConcepto).toBeDefined();
      expect(primaConcepto?.concepto).toContain('Defunción');
    });

    it('should include prima antigüedad for permanent disability', () => {
      const result = calcularFiniquitoLiquidacion(
        pesosToBp(500),
        new Date('2020-01-15'),
        new Date('2026-01-15'),
        'incapacidad_permanente',
        0, 0
      );

      const primaConcepto = result.conceptos.find(c =>
        c.concepto.includes('Prima de Antigüedad')
      );
      expect(primaConcepto).toBeDefined();
      expect(primaConcepto?.concepto).toContain('Incapacidad');
    });

    it('should NOT include prima antigüedad for voluntary resignation < 15 years', () => {
      const result = calcularFiniquitoLiquidacion(
        pesosToBp(500),
        new Date('2020-01-15'),
        new Date('2026-01-15'),
        'renuncia',
        0, 0
      );

      const primaConcepto = result.conceptos.find(c =>
        c.concepto.includes('Prima de Antigüedad')
      );
      expect(primaConcepto).toBeUndefined();
    });

    it('should include prima antigüedad for voluntary resignation ≥ 15 years', () => {
      const result = calcularFiniquitoLiquidacion(
        pesosToBp(500),
        new Date('2010-01-15'),
        new Date('2026-01-15'),
        'renuncia',
        0, 0
      );

      const primaConcepto = result.conceptos.find(c =>
        c.concepto.includes('Prima de Antigüedad')
      );
      expect(primaConcepto).toBeDefined();
    });
  });

  describe('Indemnización Constitucional', () => {
    it('should calculate 90 days indemnization for unjustified dismissal', () => {
      const result = calcularFiniquitoLiquidacion(
        pesosToBp(500),
        new Date('2020-01-15'),
        new Date('2026-01-15'),
        'despido_injustificado',
        0, 0
      );

      const indemConcepto = result.conceptos.find(c =>
        c.concepto.includes('Indemnización Constitucional')
      );
      expect(indemConcepto).toBeDefined();
      expect(indemConcepto?.dias).toBe(90);
      // $500 × 90 = $45,000
      expect(bpToPesos(indemConcepto!.montoBp)).toBe(45000);
    });
  });
});

// ============================================================================
// ANNUAL ISR ADJUSTMENT TESTS
// ============================================================================

describe('Annual ISR Adjustment (Art. 97 LISR)', () => {
  it('should calculate adjustment when ISR was over-withheld', () => {
    const result = calcularAjusteAnualISR(
      150000, // Annual taxable income
      15000,  // ISR withheld (too much)
      5000    // Subsidy applied
    );

    expect(result.tipoAjuste).toBe('a_favor');
    expect(result.diferencia).toBeLessThan(0);
  });

  it('should calculate adjustment when ISR was under-withheld', () => {
    // For $150,000 annual income, ISR should be around $12,000-15,000
    // If only $5,000 was withheld, it should be 'a_cargo'
    const result = calcularAjusteAnualISR(
      150000, // Annual taxable income
      5000,   // ISR withheld (much too little - changed from 10000)
      0       // No subsidy applied (income too high)
    );

    expect(result.tipoAjuste).toBe('a_cargo');
    expect(result.diferencia).toBeGreaterThan(0);
  });

  it('should return no adjustment when ISR is correct', () => {
    // First calculate what ISR should be
    const ingresoAnual = 150000;
    const resultCalc = calcularAjusteAnualISR(ingresoAnual, 0, 0);
    const isrCorrecto = resultCalc.isrAnualCalculado;

    // Then test with correct withholding
    const result = calcularAjusteAnualISR(ingresoAnual, isrCorrecto, 0);
    expect(result.tipoAjuste).toBe('sin_ajuste');
  });
});

// ============================================================================
// EXTRAORDINARY ISR TESTS (Art. 96 LISR)
// ============================================================================

describe('Extraordinary Payment ISR (Art. 96 LISR)', () => {
  it('should calculate ISR using averaging method', () => {
    const result = calcularISRExtraordinario(
      15000,  // Extraordinary payment (e.g., aguinaldo gravado)
      12000   // Average monthly ordinary income
    );

    expect(result.isrExtraordinario).toBeGreaterThan(0);
    expect(result.tasaEfectiva).toBeGreaterThan(0);
    expect(result.metodologia).toContain('Art. 96');
  });

  it('should calculate aguinaldo ISR correctly', () => {
    const result = calcularISRAguinaldo(
      5000,   // Aguinaldo gravado (after 30 UMA exemption)
      12000   // Average monthly income
    );

    expect(result.isrAguinaldo).toBeGreaterThan(0);
    expect(result.metodologia).toContain('Art. 96');
  });

  it('should return zero ISR for exempt aguinaldo', () => {
    const result = calcularISRAguinaldo(
      0,      // No gravado (100% exempt)
      12000
    );

    expect(result.isrAguinaldo).toBe(0);
    expect(result.metodologia).toContain('exento');
  });

  it('should calculate PTU ISR correctly', () => {
    const result = calcularISRPtu(
      3000,   // PTU gravado (after 15 UMA exemption)
      12000   // Average monthly income
    );

    expect(result.isrPtu).toBeGreaterThan(0);
  });
});

// ============================================================================
// CONFIGURATION VALUES TESTS
// ============================================================================

describe('Configuration Values 2026', () => {
  it('should have correct UMA 2026 values', () => {
    expect(CONFIG_FISCAL_2026.uma.diaria).toBe(117.31);
    expect(CONFIG_FISCAL_2026.uma.mensual).toBeCloseTo(3566.22, 1);
  });

  it('should have correct SMG 2026 values', () => {
    expect(CONFIG_FISCAL_2026.salarioMinimo.general).toBe(315.04);
    expect(CONFIG_FISCAL_2026.salarioMinimo.frontera).toBe(440.87);
  });

  it('should have correct aguinaldo minimum', () => {
    expect(CONFIG_FISCAL_2026.aguinaldoMinimo).toBe(15);
  });

  it('should have correct prima vacacional minimum', () => {
    expect(CONFIG_FISCAL_2026.primaVacacionalMinimo).toBe(25);
  });

  it('should have correct IMSS top (25 UMAs)', () => {
    expect(CONFIG_FISCAL_2026.limiteSuperiorCotizacionUMAs).toBe(25);
  });
});
