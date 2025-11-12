import { db } from "../db";
import {
  catSatTiposPercepcion,
  catSatTiposDeduccion,
  catSatTiposOtroPago,
  catIsrTarifas,
  catSubsidioEmpleo,
  catImssConfig,
  catImssCuotas,
  type CatSatTipoPercepcion,
  type CatSatTipoDeduccion,
  type CatSatTipoOtroPago,
  type CatIsrTarifa,
  type CatSubsidioEmpleo,
  type CatImssConfig,
  type CatImssCuota,
} from "@shared/schema";
import { porcentajeToBp, pesosToBp } from "@shared/basisPoints";

/**
 * Seed data para catálogos de nómina y tablas fiscales mexicanas 2025
 */

// ============================================================================
// CATÁLOGOS SAT CFDI 4.0
// ============================================================================

const percepciones: Omit<CatSatTipoPercepcion, "createdAt" | "updatedAt">[] = [
  { clave: "001", nombre: "Sueldos, Salarios, Rayas y Jornales", gravado: true, integraSdi: true, esImss: false },
  { clave: "002", nombre: "Gratificación Anual (Aguinaldo)", gravado: true, integraSdi: true, esImss: false },
  { clave: "019", nombre: "Horas Extra", gravado: true, integraSdi: true, esImss: false },
  { clave: "020", nombre: "Prima Dominical", gravado: true, integraSdi: true, esImss: false },
  { clave: "021", nombre: "Prima Vacacional", gravado: true, integraSdi: true, esImss: false },
  { clave: "034", nombre: "Otros Ingresos por Salarios", gravado: true, integraSdi: true, esImss: false },
  { clave: "050", nombre: "Viáticos", gravado: true, integraSdi: false, esImss: false },
];

const deducciones: Omit<CatSatTipoDeduccion, "createdAt" | "updatedAt" | "descripcion">[] = [
  { clave: "001", nombre: "Seguridad Social" },
  { clave: "002", nombre: "ISR" },
  { clave: "003", nombre: "Aportaciones a Retiro, Cesantía en Edad Avanzada y Vejez" },
  { clave: "005", nombre: "Aportaciones a Fondo de Vivienda" },
  { clave: "006", nombre: "Descuento por Incapacidad" },
  { clave: "007", nombre: "Pensión Alimenticia" },
  { clave: "012", nombre: "Anticipo de Salarios" },
  { clave: "020", nombre: "Ausencias (Ausentismo)" },
];

const otrosPagos: Omit<CatSatTipoOtroPago, "createdAt" | "updatedAt" | "descripcion">[] = [
  { clave: "002", nombre: "Subsidio para el Empleo (Efectivamente Entregado al Trabajador)" },
  { clave: "003", nombre: "Viáticos (entregados al trabajador)" },
  { clave: "999", nombre: "Pagos Distintos a los Listados (No Considerados Ingresos Fiscales)" },
];

// ============================================================================
// TABLAS ISR 2025
// ============================================================================

type TablaISRBase = Omit<CatIsrTarifa, "id" | "createdAt" | "updatedAt">;

const tablaISR_Mensual: TablaISRBase[] = [
  { orden: 1, periodo: "mensual", anio: 2025, limiteInferiorBp: pesosToBp(0.01), limiteSuperiorBp: pesosToBp(746.04), cuotaFijaBp: pesosToBp(0), tasaExcedenteBp: porcentajeToBp(1.92) },
  { orden: 2, periodo: "mensual", anio: 2025, limiteInferiorBp: pesosToBp(746.05), limiteSuperiorBp: pesosToBp(6332.05), cuotaFijaBp: pesosToBp(14.32), tasaExcedenteBp: porcentajeToBp(6.40) },
  { orden: 3, periodo: "mensual", anio: 2025, limiteInferiorBp: pesosToBp(6332.06), limiteSuperiorBp: pesosToBp(11128.01), cuotaFijaBp: pesosToBp(371.83), tasaExcedenteBp: porcentajeToBp(10.88) },
  { orden: 4, periodo: "mensual", anio: 2025, limiteInferiorBp: pesosToBp(11128.02), limiteSuperiorBp: pesosToBp(12935.82), cuotaFijaBp: pesosToBp(893.63), tasaExcedenteBp: porcentajeToBp(16.00) },
  { orden: 5, periodo: "mensual", anio: 2025, limiteInferiorBp: pesosToBp(12935.83), limiteSuperiorBp: pesosToBp(15487.71), cuotaFijaBp: pesosToBp(1182.88), tasaExcedenteBp: porcentajeToBp(17.92) },
  { orden: 6, periodo: "mensual", anio: 2025, limiteInferiorBp: pesosToBp(15487.72), limiteSuperiorBp: pesosToBp(31236.49), cuotaFijaBp: pesosToBp(1640.18), tasaExcedenteBp: porcentajeToBp(21.36) },
  { orden: 7, periodo: "mensual", anio: 2025, limiteInferiorBp: pesosToBp(31236.50), limiteSuperiorBp: pesosToBp(49233.00), cuotaFijaBp: pesosToBp(5004.12), tasaExcedenteBp: porcentajeToBp(23.52) },
  { orden: 8, periodo: "mensual", anio: 2025, limiteInferiorBp: pesosToBp(49233.01), limiteSuperiorBp: pesosToBp(93993.90), cuotaFijaBp: pesosToBp(9236.89), tasaExcedenteBp: porcentajeToBp(30.00) },
  { orden: 9, periodo: "mensual", anio: 2025, limiteInferiorBp: pesosToBp(93993.91), limiteSuperiorBp: pesosToBp(125325.20), cuotaFijaBp: pesosToBp(22665.17), tasaExcedenteBp: porcentajeToBp(32.00) },
  { orden: 10, periodo: "mensual", anio: 2025, limiteInferiorBp: pesosToBp(125325.21), limiteSuperiorBp: pesosToBp(375975.61), cuotaFijaBp: pesosToBp(32691.18), tasaExcedenteBp: porcentajeToBp(34.00) },
  { orden: 11, periodo: "mensual", anio: 2025, limiteInferiorBp: pesosToBp(375975.62), limiteSuperiorBp: null, cuotaFijaBp: pesosToBp(117912.32), tasaExcedenteBp: porcentajeToBp(35.00) },
];

const tablaISR_Quincenal: TablaISRBase[] = tablaISR_Mensual.map(f => ({
  ...f,
  periodo: "quincenal",
  limiteInferiorBp: f.limiteInferiorBp / BigInt(2),
  limiteSuperiorBp: f.limiteSuperiorBp ? f.limiteSuperiorBp / BigInt(2) : null,
  cuotaFijaBp: f.cuotaFijaBp / BigInt(2),
}));

const tablaISR_Catorcenal: TablaISRBase[] = tablaISR_Mensual.map(f => ({
  ...f,
  periodo: "catorcenal",
  limiteInferiorBp: (f.limiteInferiorBp * BigInt(14)) / BigInt(30),
  limiteSuperiorBp: f.limiteSuperiorBp ? (f.limiteSuperiorBp * BigInt(14)) / BigInt(30) : null,
  cuotaFijaBp: (f.cuotaFijaBp * BigInt(14)) / BigInt(30),
}));

const tablaISR_Semanal: TablaISRBase[] = tablaISR_Mensual.map(f => ({
  ...f,
  periodo: "semanal",
  limiteInferiorBp: (f.limiteInferiorBp * BigInt(7)) / BigInt(30),
  limiteSuperiorBp: f.limiteSuperiorBp ? (f.limiteSuperiorBp * BigInt(7)) / BigInt(30) : null,
  cuotaFijaBp: (f.cuotaFijaBp * BigInt(7)) / BigInt(30),
}));

// ============================================================================
// TABLAS SUBSIDIO 2025
// ============================================================================

type TablaSubsidioBase = Omit<CatSubsidioEmpleo, "id" | "createdAt" | "updatedAt">;

const tablaSubsidio_Mensual: TablaSubsidioBase[] = [
  { orden: 1, periodo: "mensual", anio: 2025, limiteInferiorBp: pesosToBp(0.01), limiteSuperiorBp: pesosToBp(1768.96), subsidioBp: pesosToBp(407.02) },
  { orden: 2, periodo: "mensual", anio: 2025, limiteInferiorBp: pesosToBp(1768.97), limiteSuperiorBp: pesosToBp(2653.38), subsidioBp: pesosToBp(406.83) },
  { orden: 3, periodo: "mensual", anio: 2025, limiteInferiorBp: pesosToBp(2653.39), limiteSuperiorBp: pesosToBp(3472.84), subsidioBp: pesosToBp(406.62) },
  { orden: 4, periodo: "mensual", anio: 2025, limiteInferiorBp: pesosToBp(3472.85), limiteSuperiorBp: pesosToBp(3537.87), subsidioBp: pesosToBp(392.77) },
  { orden: 5, periodo: "mensual", anio: 2025, limiteInferiorBp: pesosToBp(3537.88), limiteSuperiorBp: pesosToBp(4446.15), subsidioBp: pesosToBp(382.46) },
  { orden: 6, periodo: "mensual", anio: 2025, limiteInferiorBp: pesosToBp(4446.16), limiteSuperiorBp: pesosToBp(4717.18), subsidioBp: pesosToBp(354.23) },
  { orden: 7, periodo: "mensual", anio: 2025, limiteInferiorBp: pesosToBp(4717.19), limiteSuperiorBp: pesosToBp(5335.42), subsidioBp: pesosToBp(324.87) },
  { orden: 8, periodo: "mensual", anio: 2025, limiteInferiorBp: pesosToBp(5335.43), limiteSuperiorBp: pesosToBp(6224.67), subsidioBp: pesosToBp(294.63) },
  { orden: 9, periodo: "mensual", anio: 2025, limiteInferiorBp: pesosToBp(6224.68), limiteSuperiorBp: pesosToBp(7113.90), subsidioBp: pesosToBp(253.54) },
  { orden: 10, periodo: "mensual", anio: 2025, limiteInferiorBp: pesosToBp(7113.91), limiteSuperiorBp: pesosToBp(7382.33), subsidioBp: pesosToBp(217.61) },
  { orden: 11, periodo: "mensual", anio: 2025, limiteInferiorBp: pesosToBp(7382.34), limiteSuperiorBp: null, subsidioBp: pesosToBp(0) },
];

const tablaSubsidio_Quincenal: TablaSubsidioBase[] = tablaSubsidio_Mensual.map(f => ({
  ...f,
  periodo: "quincenal",
  limiteInferiorBp: f.limiteInferiorBp / BigInt(2),
  limiteSuperiorBp: f.limiteSuperiorBp ? f.limiteSuperiorBp / BigInt(2) : null,
  subsidioBp: f.subsidioBp / BigInt(2),
}));

const tablaSubsidio_Catorcenal: TablaSubsidioBase[] = tablaSubsidio_Mensual.map(f => ({
  ...f,
  periodo: "catorcenal",
  limiteInferiorBp: (f.limiteInferiorBp * BigInt(14)) / BigInt(30),
  limiteSuperiorBp: f.limiteSuperiorBp ? (f.limiteSuperiorBp * BigInt(14)) / BigInt(30) : null,
  subsidioBp: (f.subsidioBp * BigInt(14)) / BigInt(30),
}));

const tablaSubsidio_Semanal: TablaSubsidioBase[] = tablaSubsidio_Mensual.map(f => ({
  ...f,
  periodo: "semanal",
  limiteInferiorBp: (f.limiteInferiorBp * BigInt(7)) / BigInt(30),
  limiteSuperiorBp: f.limiteSuperiorBp ? (f.limiteSuperiorBp * BigInt(7)) / BigInt(30) : null,
  subsidioBp: (f.subsidioBp * BigInt(7)) / BigInt(30),
}));

// ============================================================================
// CONFIGURACIÓN IMSS 2025
// ============================================================================

type ConfigIMSSBase = Omit<CatImssConfig, "id" | "createdAt" | "updatedAt">;

const configIMSS: ConfigIMSSBase[] = [
  {
    anio: 2025,
    umaBp: pesosToBp(108.57),
    salarioMinimoBp: pesosToBp(278.80),
    limiteSuperiorCotizacionUma: 25,
  },
];

// ============================================================================
// CUOTAS IMSS 2025
// ============================================================================

type CuotaIMSSBase = Omit<CatImssCuota, "id" | "createdAt" | "updatedAt" | "patronCuotaFijaBp" | "trabajadorCuotaFijaBp" | "notas">;

const cuotasIMSS: CuotaIMSSBase[] = [
  // Enfermedad y Maternidad - Cuota Fija
  { anio: 2025, ramo: "enfermedad_maternidad", concepto: "Cuota Fija - Patrón", patronTasaBp: porcentajeToBp(13.9), trabajadorTasaBp: null, baseCalculo: "sbc", aplicaLimiteSuperior: false },
  { anio: 2025, ramo: "enfermedad_maternidad", concepto: "Cuota Fija - Trabajador", patronTasaBp: null, trabajadorTasaBp: porcentajeToBp(0.4), baseCalculo: "sbc", aplicaLimiteSuperior: false },
  
  // Enfermedad y Maternidad - Excedente 3 UMAs
  { anio: 2025, ramo: "enfermedad_maternidad", concepto: "Excedente 3 UMAs - Patrón", patronTasaBp: porcentajeToBp(1.1), trabajadorTasaBp: null, baseCalculo: "excedente_3uma", aplicaLimiteSuperior: false },
  { anio: 2025, ramo: "enfermedad_maternidad", concepto: "Excedente 3 UMAs - Trabajador", patronTasaBp: null, trabajadorTasaBp: porcentajeToBp(0.4), baseCalculo: "excedente_3uma", aplicaLimiteSuperior: false },
  
  // Prestaciones en Dinero
  { anio: 2025, ramo: "prestaciones_dinero", concepto: "Prestaciones en Dinero - Patrón", patronTasaBp: porcentajeToBp(0.7), trabajadorTasaBp: null, baseCalculo: "sbc", aplicaLimiteSuperior: false },
  { anio: 2025, ramo: "prestaciones_dinero", concepto: "Prestaciones en Dinero - Trabajador", patronTasaBp: null, trabajadorTasaBp: porcentajeToBp(0.25), baseCalculo: "sbc", aplicaLimiteSuperior: false },
  
  // Invalidez y Vida
  { anio: 2025, ramo: "invalidez_vida", concepto: "Invalidez y Vida - Patrón", patronTasaBp: porcentajeToBp(1.75), trabajadorTasaBp: null, baseCalculo: "sbc", aplicaLimiteSuperior: false },
  { anio: 2025, ramo: "invalidez_vida", concepto: "Invalidez y Vida - Trabajador", patronTasaBp: null, trabajadorTasaBp: porcentajeToBp(0.625), baseCalculo: "sbc", aplicaLimiteSuperior: false },
  
  // Retiro, Cesantía y Vejez
  { anio: 2025, ramo: "retiro", concepto: "Retiro - Patrón", patronTasaBp: porcentajeToBp(2), trabajadorTasaBp: null, baseCalculo: "sbc", aplicaLimiteSuperior: true },
  { anio: 2025, ramo: "cesantia_vejez", concepto: "Cesantía y Vejez - Patrón", patronTasaBp: porcentajeToBp(3.15), trabajadorTasaBp: null, baseCalculo: "sbc", aplicaLimiteSuperior: true },
  { anio: 2025, ramo: "cesantia_vejez", concepto: "Cesantía y Vejez - Trabajador", patronTasaBp: null, trabajadorTasaBp: porcentajeToBp(1.125), baseCalculo: "sbc", aplicaLimiteSuperior: true },
  
  // Infonavit
  { anio: 2025, ramo: "infonavit", concepto: "Infonavit - Patrón", patronTasaBp: porcentajeToBp(5), trabajadorTasaBp: null, baseCalculo: "sbc", aplicaLimiteSuperior: true },
];

// ============================================================================
// FUNCIÓN DE SEED
// ============================================================================

export async function seedPayrollCatalogs() {
  console.log("🌱 Starting payroll catalogs seed...");

  try {
    console.log("📋 Seeding SAT Catalogos...");
    await db.insert(catSatTiposPercepcion).values(percepciones).onConflictDoNothing();
    await db.insert(catSatTiposDeduccion).values(deducciones).onConflictDoNothing();
    await db.insert(catSatTiposOtroPago).values(otrosPagos).onConflictDoNothing();

    console.log("💰 Seeding ISR Tables 2025...");
    const todasTablasISR = [
      ...tablaISR_Mensual,
      ...tablaISR_Quincenal,
      ...tablaISR_Catorcenal,
      ...tablaISR_Semanal,
    ];
    await db.insert(catIsrTarifas).values(todasTablasISR).onConflictDoNothing();

    console.log("🎁 Seeding Subsidio al Empleo Tables 2025...");
    const todasTablasSubsidio = [
      ...tablaSubsidio_Mensual,
      ...tablaSubsidio_Quincenal,
      ...tablaSubsidio_Catorcenal,
      ...tablaSubsidio_Semanal,
    ];
    await db.insert(catSubsidioEmpleo).values(todasTablasSubsidio).onConflictDoNothing();

    console.log("⚕️ Seeding IMSS Config 2025...");
    await db.insert(catImssConfig).values(configIMSS).onConflictDoNothing();

    console.log("📊 Seeding IMSS Cuotas 2025...");
    await db.insert(catImssCuotas).values(cuotasIMSS).onConflictDoNothing();

    console.log("✅ Payroll catalogs seed completed successfully!");
  } catch (error) {
    console.error("❌ Error seeding payroll catalogs:", error);
    throw error;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await seedPayrollCatalogs();
  process.exit(0);
}
