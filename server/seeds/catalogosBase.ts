import { db } from "../db";
import {
  catBancos,
  catValoresUmaSmg,
  type CatBanco,
  type CatValorUmaSmg,
} from "@shared/schema";

/**
 * Seed data para catálogos base: Bancos y Valores UMA/SMG
 * Estos son catálogos globales del sistema, no multi-tenant
 */

// ============================================================================
// CATÁLOGO DE BANCOS (Códigos SAT)
// ============================================================================

type BancoSeed = Omit<CatBanco, "id" | "createdAt">;

const bancos: BancoSeed[] = [
  { codigoSat: "002", nombreCorto: "BANAMEX", nombreCompleto: "Banco Nacional de México, S.A.", longitudCuenta: 10, longitudClabe: 18, activo: true },
  { codigoSat: "012", nombreCorto: "BBVA", nombreCompleto: "BBVA México, S.A.", longitudCuenta: 10, longitudClabe: 18, activo: true },
  { codigoSat: "014", nombreCorto: "SANTANDER", nombreCompleto: "Banco Santander México, S.A.", longitudCuenta: 11, longitudClabe: 18, activo: true },
  { codigoSat: "021", nombreCorto: "HSBC", nombreCompleto: "HSBC México, S.A.", longitudCuenta: 10, longitudClabe: 18, activo: true },
  { codigoSat: "030", nombreCorto: "BAJIO", nombreCompleto: "Banco del Bajío, S.A.", longitudCuenta: 10, longitudClabe: 18, activo: true },
  { codigoSat: "036", nombreCorto: "INBURSA", nombreCompleto: "Banco Inbursa, S.A.", longitudCuenta: 11, longitudClabe: 18, activo: true },
  { codigoSat: "044", nombreCorto: "SCOTIABANK", nombreCompleto: "Scotiabank Inverlat, S.A.", longitudCuenta: 11, longitudClabe: 18, activo: true },
  { codigoSat: "058", nombreCorto: "BANREGIO", nombreCompleto: "Banco Regional de Monterrey, S.A.", longitudCuenta: 11, longitudClabe: 18, activo: true },
  { codigoSat: "072", nombreCorto: "BANORTE", nombreCompleto: "Banco Mercantil del Norte, S.A.", longitudCuenta: 10, longitudClabe: 18, activo: true },
  { codigoSat: "127", nombreCorto: "AZTECA", nombreCompleto: "Banco Azteca, S.A.", longitudCuenta: 10, longitudClabe: 18, activo: true },
  { codigoSat: "128", nombreCorto: "AUTOFIN", nombreCompleto: "Banco Autofin México, S.A.", longitudCuenta: 10, longitudClabe: 18, activo: true },
  { codigoSat: "137", nombreCorto: "BANCOPPEL", nombreCompleto: "BanCoppel, S.A.", longitudCuenta: 10, longitudClabe: 18, activo: true },
  { codigoSat: "138", nombreCorto: "ABC CAPITAL", nombreCompleto: "ABC Capital, S.A.", longitudCuenta: 10, longitudClabe: 18, activo: true },
  { codigoSat: "145", nombreCorto: "BBASE", nombreCompleto: "BBase, S.A.", longitudCuenta: 10, longitudClabe: 18, activo: true },
  { codigoSat: "646", nombreCorto: "STP", nombreCompleto: "Sistema de Transferencias y Pagos STP", longitudCuenta: 10, longitudClabe: 18, activo: true },
];

// ============================================================================
// VALORES UMA/SMG (Por vigencia)
// ============================================================================

type UmaSmgSeed = Omit<CatValorUmaSmg, "id" | "createdAt">;

const valoresUmaSmg: UmaSmgSeed[] = [
  // UMA 2024 (Feb 2024 - Ene 2025)
  { tipo: "UMA", valorDiario: "108.57", valorMensual: "3301.82", valorAnual: "39621.84", vigenciaDesde: "2024-02-01", vigenciaHasta: "2025-01-31" },
  // UMA 2025 (Feb 2025 - vigente)
  { tipo: "UMA", valorDiario: "113.14", valorMensual: "3441.02", valorAnual: "41292.24", vigenciaDesde: "2025-02-01", vigenciaHasta: null },
  
  // SMG 2024
  { tipo: "SMG", valorDiario: "248.93", valorMensual: "7571.88", valorAnual: "90862.56", vigenciaDesde: "2024-01-01", vigenciaHasta: "2024-12-31" },
  // SMG 2025
  { tipo: "SMG", valorDiario: "278.80", valorMensual: "8479.95", valorAnual: "101759.40", vigenciaDesde: "2025-01-01", vigenciaHasta: null },
  
  // SMG Zona Libre de la Frontera Norte 2024
  { tipo: "SMG_FRONTERA", valorDiario: "374.89", valorMensual: "11405.90", valorAnual: "136870.85", vigenciaDesde: "2024-01-01", vigenciaHasta: "2024-12-31" },
  // SMG Zona Libre de la Frontera Norte 2025
  { tipo: "SMG_FRONTERA", valorDiario: "419.88", valorMensual: "12770.17", valorAnual: "153242.04", vigenciaDesde: "2025-01-01", vigenciaHasta: null },
];

// ============================================================================
// FUNCIÓN DE SEED
// ============================================================================

export async function seedCatalogosBase() {
  console.log("🌱 Iniciando seed de catálogos base...");

  try {
    // Seed Bancos
    console.log("🏦 Seeding catálogo de bancos...");
    let insertedBancos = 0;
    for (const banco of bancos) {
      try {
        await db.insert(catBancos).values(banco).onConflictDoNothing();
        insertedBancos++;
      } catch (error) {
        // Skip duplicates
      }
    }
    console.log(`✅ Catálogo de bancos: ${insertedBancos} bancos procesados`);

    // Seed UMA/SMG values
    console.log("📊 Seeding valores UMA/SMG...");
    let insertedUmaSmg = 0;
    for (const valor of valoresUmaSmg) {
      try {
        await db.insert(catValoresUmaSmg).values(valor).onConflictDoNothing();
        insertedUmaSmg++;
      } catch (error) {
        // Skip duplicates
      }
    }
    console.log(`✅ Valores UMA/SMG: ${insertedUmaSmg} registros procesados`);

    console.log("✅ Seed de catálogos base completado!");
  } catch (error) {
    console.error("❌ Error en seed de catálogos base:", error);
    throw error;
  }
}

// Run standalone if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  await seedCatalogosBase();
  process.exit(0);
}
