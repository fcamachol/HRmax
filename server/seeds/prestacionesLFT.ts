/**
 * SEED DATA: Tablas de Prestaciones LFT 2024
 * 
 * Este archivo contiene los datos semilla para la tabla cat_tablas_prestaciones
 * según el Artículo 76 de la Ley Federal del Trabajo (LFT) reformada en 2024.
 * 
 * TABLA CORRECTA DE VACACIONES LFT (Art. 76):
 * - Año 1: 12 días
 * - Año 2: 14 días (+2)
 * - Año 3: 16 días (+2)
 * - Año 4: 18 días (+2)
 * - Años 5-9: 20 días
 * - A partir del año 10: +2 días cada 5 años (22, 24, 26...)
 * 
 * AGUINALDO (Art. 87 LFT):
 * - Mínimo legal: 15 días
 * 
 * PRIMA VACACIONAL (Art. 80 LFT):
 * - Mínimo legal: 25%
 */

import { db } from "../db";
import { catTablasPrestaciones } from "@shared/schema";

interface PrestacionRow {
  nombreEsquema: string;
  aniosAntiguedad: number;
  diasVacaciones: number;
  diasAguinaldo: number;
  primaVacacionalPct: string;
  factorIntegracion: string;
  empresaId?: string;
  clienteId?: string;
  activo: boolean;
}

/**
 * Calcula el factor de integración para SBC
 * Fórmula: 1 + ((dias_aguinaldo + (dias_vacaciones * prima_vac_pct/100)) / 365)
 */
function calcularFactorIntegracion(
  diasVacaciones: number,
  diasAguinaldo: number,
  primaVacacionalPct: number
): string {
  const primaVacacional = diasVacaciones * (primaVacacionalPct / 100);
  const factor = 1 + ((diasAguinaldo + primaVacacional) / 365);
  return factor.toFixed(6);
}

/**
 * Genera la tabla de prestaciones según LFT 2024
 * Proyecta hasta 30 años de antigüedad
 */
function generarTablaLFT2024(): PrestacionRow[] {
  const tabla: PrestacionRow[] = [];
  const diasAguinaldo = 15; // Mínimo legal
  const primaVacacionalPct = 25; // Mínimo legal
  
  for (let anio = 1; anio <= 30; anio++) {
    let diasVacaciones: number;
    
    // Aplicar tabla LFT Art. 76 (CORRECTA)
    if (anio === 1) {
      diasVacaciones = 12;
    } else if (anio === 2) {
      diasVacaciones = 14;
    } else if (anio === 3) {
      diasVacaciones = 16;
    } else if (anio === 4) {
      diasVacaciones = 18;
    } else if (anio < 10) {
      // Años 5-9
      diasVacaciones = 20;
    } else {
      // Año 10 en adelante: 20 días base + 2 días cada 5 años
      const quinqueniosAdicionales = Math.floor((anio - 5) / 5);
      diasVacaciones = 20 + (quinqueniosAdicionales * 2);
    }
    
    const factorIntegracion = calcularFactorIntegracion(
      diasVacaciones,
      diasAguinaldo,
      primaVacacionalPct
    );
    
    tabla.push({
      nombreEsquema: "Ley Federal del Trabajo 2024",
      aniosAntiguedad: anio,
      diasVacaciones,
      diasAguinaldo,
      primaVacacionalPct: primaVacacionalPct.toFixed(2),
      factorIntegracion,
      activo: true,
    });
  }
  
  return tabla;
}

/**
 * Genera esquema de prestaciones superiores para puestos de confianza
 * Ejemplo: más días de aguinaldo y vacaciones
 */
function generarEsquemaPuestosConfianza(): PrestacionRow[] {
  const tabla: PrestacionRow[] = [];
  const diasAguinaldo = 30; // Días superiores
  const primaVacacionalPct = 35; // Prima superior
  
  for (let anio = 1; anio <= 30; anio++) {
    let diasVacaciones: number;
    
    // Esquema mejorado: +4 días sobre LFT
    if (anio === 1) {
      diasVacaciones = 16; // LFT: 12 + 4
    } else if (anio === 2) {
      diasVacaciones = 18; // LFT: 14 + 4
    } else if (anio === 3) {
      diasVacaciones = 20; // LFT: 16 + 4
    } else if (anio === 4) {
      diasVacaciones = 22; // LFT: 18 + 4
    } else if (anio < 10) {
      diasVacaciones = 24; // LFT: 20 + 4
    } else {
      const quinqueniosAdicionales = Math.floor((anio - 5) / 5);
      diasVacaciones = 24 + (quinqueniosAdicionales * 2);
    }
    
    const factorIntegracion = calcularFactorIntegracion(
      diasVacaciones,
      diasAguinaldo,
      primaVacacionalPct
    );
    
    tabla.push({
      nombreEsquema: "Puestos de Confianza",
      aniosAntiguedad: anio,
      diasVacaciones,
      diasAguinaldo,
      primaVacacionalPct: primaVacacionalPct.toFixed(2),
      factorIntegracion,
      activo: true,
    });
  }
  
  return tabla;
}

/**
 * Ejecuta el seed de prestaciones
 */
async function seedPrestaciones() {
  console.log("🌱 Iniciando seed de Tablas de Prestaciones...\n");
  
  try {
    // Generar datos
    const tablaLFT = generarTablaLFT2024();
    const tablaConfianza = generarEsquemaPuestosConfianza();
    const todasLasPrestaciones = [...tablaLFT, ...tablaConfianza];
    
    console.log(`📊 Generadas ${todasLasPrestaciones.length} filas de prestaciones:`);
    console.log(`   - ${tablaLFT.length} filas para LFT 2024`);
    console.log(`   - ${tablaConfianza.length} filas para Puestos de Confianza\n`);
    
    // Insertar en base de datos
    console.log("💾 Insertando datos en cat_tablas_prestaciones...");
    await db.insert(catTablasPrestaciones).values(todasLasPrestaciones);
    
    console.log("✅ Seed de prestaciones completado exitosamente\n");
    
    // Mostrar tabla de ejemplo (primeros 10 años LFT)
    console.log("📋 Tabla LFT 2024 (primeros 10 años):");
    console.log("┌─────┬────────────┬──────────┬─────────────────┬───────────────┐");
    console.log("│ Año │ Vacaciones │ Aguinaldo│ Prima Vac. (%) │ Factor Integ. │");
    console.log("├─────┼────────────┼──────────┼─────────────────┼───────────────┤");
    
    tablaLFT.slice(0, 10).forEach(row => {
      console.log(
        `│ ${row.aniosAntiguedad.toString().padEnd(3)} │ ${row.diasVacaciones.toString().padEnd(10)} │ ${row.diasAguinaldo.toString().padEnd(8)} │ ${row.primaVacacionalPct.padEnd(15)} │ ${row.factorIntegracion.padEnd(13)} │`
      );
    });
    
    console.log("└─────┴────────────┴──────────┴─────────────────┴───────────────┘\n");
    
  } catch (error) {
    console.error("❌ Error al ejecutar seed de prestaciones:", error);
    throw error;
  }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  seedPrestaciones()
    .then(() => {
      console.log("🎉 Proceso completado");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Error fatal:", error);
      process.exit(1);
    });
}

export { seedPrestaciones, generarTablaLFT2024, generarEsquemaPuestosConfianza };
