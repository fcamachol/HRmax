import { db } from "../db";
import { sql } from "drizzle-orm";

/**
 * Migración de estados del módulo de bajas
 * Convierte estados antiguos a los nuevos del proceso de 8 pasos
 * Se ejecuta automáticamente al iniciar el servidor
 */
export async function migrateLegalCaseStatuses() {
  try {
    console.log("🔄 Iniciando migración de estados de bajas...");
    
    const result = await db.execute(sql`
      UPDATE legal_cases
      SET status = CASE
        WHEN status = 'pendiente' THEN 'detonante'
        WHEN status = 'en_proceso' THEN 'calculo'
        WHEN status = 'aprobado' THEN 'firma'
        ELSE status
      END
      WHERE status IN ('pendiente', 'en_proceso', 'aprobado')
    `);
    
    console.log(`✅ Migración completada: ${result.rowCount || 0} registros actualizados`);
  } catch (error) {
    console.error("❌ Error en migración de estados:", error);
    // No lanzamos el error para no detener el servidor
  }
}
