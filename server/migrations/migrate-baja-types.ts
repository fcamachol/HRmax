import { db } from "../db";
import { sql } from "drizzle-orm";

/**
 * Migración de tipos de bajas
 * Convierte caseType antiguo a nueva estructura bajaCategory + bajaType
 * Se ejecuta automáticamente al iniciar el servidor
 */
export async function migrateBajaTypes() {
  try {
    console.log("🔄 Iniciando migración de tipos de bajas...");
    
    // Mapear caseType antiguo a nueva estructura
    const result = await db.execute(sql`
      UPDATE legal_cases
      SET 
        baja_category = CASE
          WHEN case_type IN ('renuncia', 'renuncia_voluntaria') THEN 'voluntaria'
          WHEN case_type IN ('despido', 'despido_justificado', 'despido_injustificado') THEN 'involuntaria'
          ELSE 'voluntaria'
        END,
        baja_type = CASE
          WHEN case_type = 'renuncia' OR case_type = 'renuncia_voluntaria' THEN 'renuncia_voluntaria'
          WHEN case_type = 'despido_justificado' THEN 'despido_justificado'
          WHEN case_type = 'despido_injustificado' OR case_type = 'despido' THEN 'despido_injustificado'
          WHEN case_type = 'finiquito' THEN 'renuncia_voluntaria'
          WHEN case_type = 'liquidacion' THEN 'despido_injustificado'
          ELSE 'renuncia_voluntaria'
        END
      WHERE baja_category = 'voluntaria' AND baja_type = 'renuncia_voluntaria'
    `);
    
    console.log(`✅ Migración de tipos completada: ${result.rowCount || 0} registros actualizados`);
  } catch (error) {
    console.error("❌ Error en migración de tipos de bajas:", error);
    // No lanzamos el error para no detener el servidor
  }
}
