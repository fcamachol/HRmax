/**
 * Seed completo de catálogos SAT CFDI 4.0 y tablas fiscales 2025
 * Motor de nómina NominaHub - Clase mundial superior a NOI
 */

import { db } from "../db";
import { 
  catSatTiposPercepcion, 
  catSatTiposDeduccion, 
  catSatTiposOtroPago,
  catIsrTarifas,
  catSubsidioEmpleo 
} from "@shared/schema";
import { pesosToBp, porcentajeToBp } from "@shared/basisPoints";

const SAT_PERCEPCIONES_COMPLETO = [
  { clave: '001', descripcion: 'Sueldos, Salarios Rayas y Jornales', gravado: true, exento: false },
  { clave: '002', descripcion: 'Gratificación Anual (Aguinaldo)', gravado: true, exento: true },
  { clave: '003', descripcion: 'Participación de los Trabajadores en las Utilidades PTU', gravado: true, exento: true },
  { clave: '004', descripcion: 'Reembolso de Gastos Médicos Dentales y Hospitalarios', gravado: true, exento: true },
  { clave: '005', descripcion: 'Fondo de Ahorro', gravado: true, exento: true },
  { clave: '006', descripcion: 'Caja de ahorro', gravado: true, exento: true },
  { clave: '009', descripcion: 'Contribuciones a Cargo del Trabajador Pagadas por el Patrón', gravado: true, exento: true },
  { clave: '010', descripcion: 'Premios por puntualidad', gravado: true, exento: false },
  { clave: '011', descripcion: 'Prima de Seguro de vida', gravado: false, exento: true },
  { clave: '012', descripcion: 'Seguro de Gastos Médicos Mayores', gravado: false, exento: true },
  { clave: '013', descripcion: 'Cuotas Sindicales Pagadas por el Patrón', gravado: true, exento: true },
  { clave: '014', descripcion: 'Subsidios por incapacidad', gravado: false, exento: true },
  { clave: '015', descripcion: 'Becas para trabajadores y/o hijos', gravado: false, exento: true },
  { clave: '019', descripcion: 'Horas extra', gravado: true, exento: true },
  { clave: '020', descripcion: 'Prima dominical', gravado: true, exento: true },
  { clave: '021', descripcion: 'Prima vacacional', gravado: true, exento: true },
  { clave: '022', descripcion: 'Prima por antigüedad', gravado: true, exento: true },
  { clave: '023', descripcion: 'Pagos por separación', gravado: true, exento: true },
  { clave: '024', descripcion: 'Seguro de retiro', gravado: false, exento: true },
  { clave: '025', descripcion: 'Indemnizaciones', gravado: true, exento: true },
  { clave: '026', descripcion: 'Reembolso por funeral', gravado: false, exento: true },
  { clave: '027', descripcion: 'Cuotas de seguridad social pagadas por el patrón', gravado: true, exento: true },
  { clave: '028', descripcion: 'Comisiones', gravado: true, exento: false },
  { clave: '029', descripcion: 'Vales de despensa', gravado: true, exento: true },
  { clave: '030', descripcion: 'Vales de restaurante', gravado: true, exento: true },
  { clave: '031', descripcion: 'Vales de gasolina', gravado: true, exento: true },
  { clave: '032', descripcion: 'Vales de ropa', gravado: true, exento: true },
  { clave: '033', descripcion: 'Ayuda para renta', gravado: true, exento: false },
  { clave: '034', descripcion: 'Ayuda para artículos escolares', gravado: true, exento: true },
  { clave: '035', descripcion: 'Ayuda para anteojos', gravado: true, exento: true },
  { clave: '036', descripcion: 'Ayuda para transporte', gravado: true, exento: true },
  { clave: '037', descripcion: 'Ayuda para gastos de funeral', gravado: true, exento: true },
  { clave: '038', descripcion: 'Otros ingresos por salarios', gravado: true, exento: false },
  { clave: '039', descripcion: 'Jubilaciones, pensiones o haberes de retiro', gravado: true, exento: true },
  { clave: '044', descripcion: 'Jubilaciones, pensiones o haberes de retiro en parcialidades', gravado: true, exento: true },
  { clave: '045', descripcion: 'Ingresos en acciones o títulos valor que representan bienes', gravado: true, exento: false },
  { clave: '046', descripcion: 'Ingresos asimilados a salarios', gravado: true, exento: false },
  { clave: '047', descripcion: 'Alimentación', gravado: true, exento: true },
  { clave: '048', descripcion: 'Habitación', gravado: true, exento: true },
  { clave: '049', descripcion: 'Premios por asistencia', gravado: true, exento: false },
  { clave: '050', descripcion: 'Viáticos', gravado: true, exento: true },
  { clave: '051', descripcion: 'Pagos por gratificaciones, primas, compensaciones, recompensas u otros', gravado: true, exento: true },
  { clave: '052', descripcion: 'Pagos de retiro SAR INFONAVIT', gravado: true, exento: true },
];

const SAT_DEDUCCIONES_COMPLETO = [
  { clave: '001', descripcion: 'Seguridad social' },
  { clave: '002', descripcion: 'ISR' },
  { clave: '003', descripcion: 'Aportaciones a retiro, cesantía en edad avanzada y vejez' },
  { clave: '004', descripcion: 'Otros' },
  { clave: '005', descripcion: 'Aportaciones a Fondo de vivienda' },
  { clave: '006', descripcion: 'Descuento por incapacidad' },
  { clave: '007', descripcion: 'Pensión alimenticia' },
  { clave: '008', descripcion: 'Renta' },
  { clave: '009', descripcion: 'Préstamos provenientes del Fondo Nacional de la Vivienda para los Trabajadores' },
  { clave: '010', descripcion: 'Pago por crédito de vivienda' },
  { clave: '011', descripcion: 'Pago de abonos INFONACOT' },
  { clave: '012', descripcion: 'Anticipo de salarios' },
  { clave: '013', descripcion: 'Pagos hechos con exceso al trabajador' },
  { clave: '014', descripcion: 'Errores' },
  { clave: '015', descripcion: 'Pérdidas' },
  { clave: '016', descripcion: 'Averías' },
  { clave: '017', descripcion: 'Adquisición de artículos producidos por la empresa' },
  { clave: '018', descripcion: 'Cuotas para constitución de sociedades cooperativas y cajas de ahorro' },
  { clave: '019', descripcion: 'Cuotas sindicales' },
  { clave: '020', descripcion: 'Ausencia (Ausentismo)' },
  { clave: '021', descripcion: 'Cuotas obrero patronales' },
  { clave: '022', descripcion: 'Impuestos Locales' },
  { clave: '023', descripcion: 'Aportaciones voluntarias' },
  { clave: '101', descripcion: 'ISR Retenido de ejercicio anterior' },
  { clave: '102', descripcion: 'Ajuste a deducciones registradas en nóminas anteriores' },
  { clave: '105', descripcion: 'Ausencias' },
  { clave: '106', descripcion: 'Préstamos' },
  { clave: '107', descripcion: 'Ajuste al Subsidio Causado' },
];

const SAT_OTROS_PAGOS_COMPLETO = [
  { clave: '001', descripcion: 'Reintegro de ISR pagado en exceso (no enterado al SAT)' },
  { clave: '002', descripcion: 'Subsidio para el empleo (efectivamente entregado al trabajador)' },
  { clave: '003', descripcion: 'Viáticos (entregados al trabajador)' },
  { clave: '004', descripcion: 'Aplicación de saldo a favor por compensación anual' },
  { clave: '005', descripcion: 'Reintegro de ISR retenido en exceso de ejercicio anterior' },
  { clave: '006', descripcion: 'Alimentos en bienes (Exento de ISR)' },
  { clave: '007', descripcion: 'ISR ajustado por subsidio' },
  { clave: '008', descripcion: 'Subsidio efectivamente entregado que no correspondía' },
  { clave: '009', descripcion: 'Pago en especie' },
  { clave: '999', descripcion: 'Pagos distintos (no son ingreso por sueldos)' },
];

// ===================== TABLAS ISR 2025 - TODAS LAS PERIODICIDADES =====================
// Fuente: DOF Anexo 8 RMF 2025 (30/12/2024)
// Las tablas 2025 NO cambiaron respecto a 2024 (inflación < 10% Art. 152 LISR)

type TipoTarifa = { limInf: number; limSup: number | null; cuotaFija: number; tasaExc: number };
type TipoPeriodo = 'mensual' | 'quincenal' | 'catorcenal' | 'semanal' | 'diario';

const ISR_MENSUAL_2025: TipoTarifa[] = [
  { limInf: 0.01, limSup: 746.04, cuotaFija: 0, tasaExc: 1.92 },
  { limInf: 746.05, limSup: 6332.05, cuotaFija: 14.32, tasaExc: 6.40 },
  { limInf: 6332.06, limSup: 11128.01, cuotaFija: 371.83, tasaExc: 10.88 },
  { limInf: 11128.02, limSup: 12935.82, cuotaFija: 893.63, tasaExc: 16.00 },
  { limInf: 12935.83, limSup: 15487.71, cuotaFija: 1182.88, tasaExc: 17.92 },
  { limInf: 15487.72, limSup: 31236.49, cuotaFija: 1640.18, tasaExc: 21.36 },
  { limInf: 31236.50, limSup: 49233.00, cuotaFija: 5004.12, tasaExc: 23.52 },
  { limInf: 49233.01, limSup: 93993.90, cuotaFija: 9236.89, tasaExc: 30.00 },
  { limInf: 93993.91, limSup: 125325.20, cuotaFija: 22665.17, tasaExc: 32.00 },
  { limInf: 125325.21, limSup: 375975.61, cuotaFija: 32691.18, tasaExc: 34.00 },
  { limInf: 375975.62, limSup: null, cuotaFija: 117912.32, tasaExc: 35.00 },
];

// Quincenal = Mensual / 2
const ISR_QUINCENAL_2025: TipoTarifa[] = [
  { limInf: 0.01, limSup: 373.02, cuotaFija: 0, tasaExc: 1.92 },
  { limInf: 373.03, limSup: 3166.03, cuotaFija: 7.16, tasaExc: 6.40 },
  { limInf: 3166.04, limSup: 5564.01, cuotaFija: 185.92, tasaExc: 10.88 },
  { limInf: 5564.02, limSup: 6467.91, cuotaFija: 446.82, tasaExc: 16.00 },
  { limInf: 6467.92, limSup: 7743.86, cuotaFija: 591.44, tasaExc: 17.92 },
  { limInf: 7743.87, limSup: 15618.25, cuotaFija: 820.09, tasaExc: 21.36 },
  { limInf: 15618.26, limSup: 24616.50, cuotaFija: 2502.06, tasaExc: 23.52 },
  { limInf: 24616.51, limSup: 46996.95, cuotaFija: 4618.45, tasaExc: 30.00 },
  { limInf: 46996.96, limSup: 62662.60, cuotaFija: 11332.59, tasaExc: 32.00 },
  { limInf: 62662.61, limSup: 187987.81, cuotaFija: 16345.59, tasaExc: 34.00 },
  { limInf: 187987.82, limSup: null, cuotaFija: 58956.16, tasaExc: 35.00 },
];

// Catorcenal = Mensual * 14/30
const ISR_CATORCENAL_2025: TipoTarifa[] = [
  { limInf: 0.01, limSup: 348.15, cuotaFija: 0, tasaExc: 1.92 },
  { limInf: 348.16, limSup: 2954.96, cuotaFija: 6.68, tasaExc: 6.40 },
  { limInf: 2954.97, limSup: 5193.07, cuotaFija: 173.52, tasaExc: 10.88 },
  { limInf: 5193.08, limSup: 6036.72, cuotaFija: 417.03, tasaExc: 16.00 },
  { limInf: 6036.73, limSup: 7227.60, cuotaFija: 552.01, tasaExc: 17.92 },
  { limInf: 7227.61, limSup: 14577.03, cuotaFija: 765.42, tasaExc: 21.36 },
  { limInf: 14577.04, limSup: 22975.40, cuotaFija: 2335.26, tasaExc: 23.52 },
  { limInf: 22975.41, limSup: 43863.82, cuotaFija: 4310.55, tasaExc: 30.00 },
  { limInf: 43863.83, limSup: 58485.10, cuotaFija: 10577.08, tasaExc: 32.00 },
  { limInf: 58485.11, limSup: 175455.29, cuotaFija: 15255.88, tasaExc: 34.00 },
  { limInf: 175455.30, limSup: null, cuotaFija: 55025.75, tasaExc: 35.00 },
];

// Semanal = Mensual * 7/30
const ISR_SEMANAL_2025: TipoTarifa[] = [
  { limInf: 0.01, limSup: 174.08, cuotaFija: 0, tasaExc: 1.92 },
  { limInf: 174.09, limSup: 1477.48, cuotaFija: 3.34, tasaExc: 6.40 },
  { limInf: 1477.49, limSup: 2596.54, cuotaFija: 86.76, tasaExc: 10.88 },
  { limInf: 2596.55, limSup: 3018.36, cuotaFija: 208.52, tasaExc: 16.00 },
  { limInf: 3018.37, limSup: 3613.80, cuotaFija: 276.01, tasaExc: 17.92 },
  { limInf: 3613.81, limSup: 7288.52, cuotaFija: 382.71, tasaExc: 21.36 },
  { limInf: 7288.53, limSup: 11487.70, cuotaFija: 1167.63, tasaExc: 23.52 },
  { limInf: 11487.71, limSup: 21931.91, cuotaFija: 2155.27, tasaExc: 30.00 },
  { limInf: 21931.92, limSup: 29242.55, cuotaFija: 5288.54, tasaExc: 32.00 },
  { limInf: 29242.56, limSup: 87727.64, cuotaFija: 7627.94, tasaExc: 34.00 },
  { limInf: 87727.65, limSup: null, cuotaFija: 27512.88, tasaExc: 35.00 },
];

// Diario = Mensual / 30
const ISR_DIARIO_2025: TipoTarifa[] = [
  { limInf: 0.01, limSup: 24.87, cuotaFija: 0, tasaExc: 1.92 },
  { limInf: 24.88, limSup: 211.07, cuotaFija: 0.48, tasaExc: 6.40 },
  { limInf: 211.08, limSup: 370.93, cuotaFija: 12.39, tasaExc: 10.88 },
  { limInf: 370.94, limSup: 431.19, cuotaFija: 29.79, tasaExc: 16.00 },
  { limInf: 431.20, limSup: 516.26, cuotaFija: 39.43, tasaExc: 17.92 },
  { limInf: 516.27, limSup: 1041.22, cuotaFija: 54.67, tasaExc: 21.36 },
  { limInf: 1041.23, limSup: 1641.10, cuotaFija: 166.80, tasaExc: 23.52 },
  { limInf: 1641.11, limSup: 3133.13, cuotaFija: 307.90, tasaExc: 30.00 },
  { limInf: 3133.14, limSup: 4177.51, cuotaFija: 755.51, tasaExc: 32.00 },
  { limInf: 4177.52, limSup: 12532.52, cuotaFija: 1089.71, tasaExc: 34.00 },
  { limInf: 12532.53, limSup: null, cuotaFija: 3930.41, tasaExc: 35.00 },
];

const TABLAS_ISR_2025: Record<TipoPeriodo, TipoTarifa[]> = {
  mensual: ISR_MENSUAL_2025,
  quincenal: ISR_QUINCENAL_2025,
  catorcenal: ISR_CATORCENAL_2025,
  semanal: ISR_SEMANAL_2025,
  diario: ISR_DIARIO_2025,
};

// ===================== SUBSIDIO AL EMPLEO 2025 =====================
// IMPORTANTE: A partir de 2025, el subsidio cambió drásticamente (DOF 31/12/2024)
// Ya NO es tabla con rangos - ahora es CUOTA FIJA:
// - $475.00 mensuales si ingreso ≤ $10,171
// - $0 si ingreso > $10,171
// El cálculo se hace en payrollEngine.ts, aquí solo documentamos para referencia
const SUBSIDIO_2025_CONFIG = {
  limiteIngresoMensual: 10171.00,
  subsidioMensual: 475.00,
  periodos: {
    mensual: { limite: 10171.00, subsidio: 475.00 },
    quincenal: { limite: 5018.59, subsidio: 234.38 },
    catorcenal: { limite: 4683.99, subsidio: 218.75 },
    semanal: { limite: 2341.99, subsidio: 109.38 },
    diario: { limite: 334.57, subsidio: 15.63 },
  }
};

async function seedSATCatalogs() {
  console.log("🔄 Actualizando catálogos SAT CFDI 4.0...");
  
  for (const percepcion of SAT_PERCEPCIONES_COMPLETO) {
    await db.insert(catSatTiposPercepcion)
      .values({
        clave: percepcion.clave,
        nombre: percepcion.descripcion,
        descripcion: percepcion.descripcion,
        gravado: percepcion.gravado,
      })
      .onConflictDoUpdate({
        target: catSatTiposPercepcion.clave,
        set: { 
          nombre: percepcion.descripcion,
          descripcion: percepcion.descripcion,
          gravado: percepcion.gravado,
        },
      });
  }
  console.log(`  ✅ ${SAT_PERCEPCIONES_COMPLETO.length} tipos de percepción actualizados`);
  
  for (const deduccion of SAT_DEDUCCIONES_COMPLETO) {
    await db.insert(catSatTiposDeduccion)
      .values({
        clave: deduccion.clave,
        nombre: deduccion.descripcion,
        descripcion: deduccion.descripcion,
      })
      .onConflictDoUpdate({
        target: catSatTiposDeduccion.clave,
        set: { 
          nombre: deduccion.descripcion,
          descripcion: deduccion.descripcion,
        },
      });
  }
  console.log(`  ✅ ${SAT_DEDUCCIONES_COMPLETO.length} tipos de deducción actualizados`);
  
  for (const otroPago of SAT_OTROS_PAGOS_COMPLETO) {
    await db.insert(catSatTiposOtroPago)
      .values({
        clave: otroPago.clave,
        nombre: otroPago.descripcion,
        descripcion: otroPago.descripcion,
      })
      .onConflictDoUpdate({
        target: catSatTiposOtroPago.clave,
        set: { 
          nombre: otroPago.descripcion,
          descripcion: otroPago.descripcion,
        },
      });
  }
  console.log(`  ✅ ${SAT_OTROS_PAGOS_COMPLETO.length} tipos de otros pagos actualizados`);
}

async function seedISRAllPeriodos() {
  console.log("🔄 Seeding tablas ISR 2025 - 5 periodos...");
  
  const periodos: TipoPeriodo[] = ['mensual', 'quincenal', 'catorcenal', 'semanal', 'diario'];
  let totalInserted = 0;
  
  for (const periodo of periodos) {
    const tabla = TABLAS_ISR_2025[periodo];
    for (let i = 0; i < tabla.length; i++) {
      const tramo = tabla[i];
      await db.insert(catIsrTarifas)
        .values({
          anio: 2025,
          periodo: periodo,
          limiteInferiorBp: pesosToBp(tramo.limInf),
          limiteSuperiorBp: tramo.limSup ? pesosToBp(tramo.limSup) : null,
          cuotaFijaBp: pesosToBp(tramo.cuotaFija),
          tasaExcedenteBp: porcentajeToBp(tramo.tasaExc),
          orden: i + 1,
        })
        .onConflictDoNothing();
      totalInserted++;
    }
    console.log(`  ✅ ISR ${periodo} 2025: ${tabla.length} tramos`);
  }
  
  console.log(`  📊 Total ISR insertado: ${totalInserted} registros`);
}

async function seedSubsidio2025() {
  console.log("🔄 Documentando Subsidio al Empleo 2025 (cuota fija)...");
  
  // El subsidio 2025 es cuota fija, NO tabla tradicional
  // Solo insertamos un registro de referencia por periodo
  const periodos: TipoPeriodo[] = ['mensual', 'quincenal', 'catorcenal', 'semanal', 'diario'];
  
  for (const periodo of periodos) {
    const config = SUBSIDIO_2025_CONFIG.periodos[periodo];
    await db.insert(catSubsidioEmpleo)
      .values({
        anio: 2025,
        periodo: periodo,
        limiteInferiorBp: pesosToBp(0.01),
        limiteSuperiorBp: pesosToBp(config.limite),
        subsidioBp: pesosToBp(config.subsidio),
        orden: 1,
      })
      .onConflictDoNothing();
    
    // Registro para ingresos superiores al límite (subsidio = 0)
    await db.insert(catSubsidioEmpleo)
      .values({
        anio: 2025,
        periodo: periodo,
        limiteInferiorBp: pesosToBp(config.limite + 0.01),
        limiteSuperiorBp: null,
        subsidioBp: pesosToBp(0),
        orden: 2,
      })
      .onConflictDoNothing();
  }
  
  console.log("  ✅ Subsidio 2025: $475 mensual si ingreso ≤ $10,171");
  console.log("  📊 Total Subsidio: 10 registros (2 por periodo × 5 periodos)");
}

async function main() {
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║  NOMINAHUB - Motor de Nómina Clase Mundial                   ║");
  console.log("║  Seed de Catálogos SAT CFDI 4.0 y Tablas Fiscales 2025       ║");
  console.log("╚══════════════════════════════════════════════════════════════╝\n");
  
  try {
    await seedSATCatalogs();
    await seedISRAllPeriodos();
    await seedSubsidio2025();
    
    console.log("\n✅ Seed completado exitosamente");
    console.log("\n📊 Resumen:");
    console.log(`   - Tipos de percepción SAT: ${SAT_PERCEPCIONES_COMPLETO.length}`);
    console.log(`   - Tipos de deducción SAT: ${SAT_DEDUCCIONES_COMPLETO.length}`);
    console.log(`   - Tipos otros pagos SAT: ${SAT_OTROS_PAGOS_COMPLETO.length}`);
    console.log("   - Tablas ISR 2025: 5 periodos × 11 tramos = 55 registros");
    console.log("   - Subsidio 2025: Cuota fija $475/mes (10 registros referencia)");
    console.log("\n📋 Cambio importante Subsidio 2025:");
    console.log("   DOF 31/12/2024 - Art. Décimo Transitorio");
    console.log("   - $475.00 mensuales si ingreso ≤ $10,171");
    console.log("   - $0 si ingreso > $10,171");
    console.log("   - Si subsidio > ISR, diferencia NO se entrega al trabajador");
    
  } catch (error) {
    console.error("❌ Error en seed:", error);
    process.exit(1);
  }
  
  process.exit(0);
}

main();
