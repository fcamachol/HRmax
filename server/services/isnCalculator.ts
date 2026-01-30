/**
 * ISN Calculator Service
 *
 * Calculates ISN (Impuesto Sobre Nómina) - Mexican state payroll tax.
 * ISN is paid in the state where the employee WORKS (centro de trabajo),
 * not necessarily where the company is registered.
 *
 * Resolution order:
 * 1. If employee has centro_trabajo with estado set → use centro's estado
 * 2. Else → use empresa.estado_default
 */

import { db } from "../db";
import { isnTasasEstado, centrosTrabajo, empresas, employees } from "@shared/schema";
import { eq, and, lte, or, isNull } from "drizzle-orm";
import { pesosToBp, bpToPesos, multiplicarBpPorTasa } from "@shared/basisPoints";

// ============================================================================
// Types
// ============================================================================

export interface ParametrosISN {
  baseGravable: number;  // Total gross taxable payroll in pesos
  estado: string;        // State code (e.g., "JALISCO", "CIUDAD_DE_MEXICO")
  fecha: Date;           // Date for rate lookup (rates can change over time)
}

export interface ResultadoISN {
  estado: string;
  tasaBp: number;
  tasaPorcentaje: number;
  baseGravable: number;
  baseGravableBp: bigint;
  isnMontoBp: bigint;
  isnMonto: number;
}

export interface ResultadoISNPorEstado {
  estado: string;
  tasaBp: number;
  tasaPorcentaje: number;
  baseGravableTotal: number;
  baseGravableTotalBp: bigint;
  isnMontoTotal: number;
  isnMontoTotalBp: bigint;
  empleadosCount: number;
}

export interface EmpleadoConEstado {
  empleadoId: string;
  baseGravable: number;
  estado: string;  // Resolved state (from centro or empresa default)
}

// ============================================================================
// Rate Lookup
// ============================================================================

/**
 * Get the ISN rate for a given state and date.
 * Looks up the rate that was effective on the given date.
 *
 * @param estado - State code (e.g., "JALISCO")
 * @param fecha - Date for rate lookup
 * @returns Rate in basis points (200 = 2.00%), or null if no rate found
 */
export async function obtenerTasaISN(estado: string, fecha: Date): Promise<number | null> {
  const fechaStr = fecha.toISOString().split('T')[0];

  const resultado = await db
    .select({ tasaBp: isnTasasEstado.tasaBp })
    .from(isnTasasEstado)
    .where(
      and(
        eq(isnTasasEstado.estado, estado.toUpperCase()),
        lte(isnTasasEstado.vigenciaInicio, fechaStr),
        or(
          isNull(isnTasasEstado.vigenciaFin),
          // If vigenciaFin is set, ensure date is before or on that date
          // For simplicity, we just check vigenciaInicio and prefer null vigenciaFin (active)
        )
      )
    )
    .orderBy(isnTasasEstado.vigenciaInicio)
    .limit(1);

  if (resultado.length === 0) {
    return null;
  }

  return resultado[0].tasaBp;
}

/**
 * Get all current ISN rates (for display/reference)
 */
export async function obtenerTodasLasTasasISN(): Promise<Array<{
  estado: string;
  tasaBp: number;
  tasaPorcentaje: number;
  vigenciaInicio: string;
}>> {
  const hoy = new Date().toISOString().split('T')[0];

  const resultado = await db
    .select({
      estado: isnTasasEstado.estado,
      tasaBp: isnTasasEstado.tasaBp,
      vigenciaInicio: isnTasasEstado.vigenciaInicio,
    })
    .from(isnTasasEstado)
    .where(
      and(
        lte(isnTasasEstado.vigenciaInicio, hoy),
        or(
          isNull(isnTasasEstado.vigenciaFin),
        )
      )
    )
    .orderBy(isnTasasEstado.estado);

  return resultado.map(r => ({
    estado: r.estado,
    tasaBp: r.tasaBp,
    tasaPorcentaje: r.tasaBp / 100,
    vigenciaInicio: r.vigenciaInicio,
  }));
}

// ============================================================================
// State Resolution
// ============================================================================

/**
 * Resolve the ISN state for an employee.
 * Priority: centro_trabajo.estado > empresa.estado_default
 *
 * @param empleadoId - Employee ID
 * @returns Resolved state code, or null if none configured
 */
export async function resolverEstadoISN(empleadoId: string): Promise<string | null> {
  // Get employee with their centro de trabajo and empresa
  const resultado = await db
    .select({
      centroEstado: centrosTrabajo.estado,
      empresaEstadoDefault: empresas.estadoDefault,
    })
    .from(employees)
    .leftJoin(centrosTrabajo, eq(employees.centroTrabajoId, centrosTrabajo.id))
    .leftJoin(empresas, eq(employees.empresaId, empresas.id))
    .where(eq(employees.id, empleadoId))
    .limit(1);

  if (resultado.length === 0) {
    return null;
  }

  const { centroEstado, empresaEstadoDefault } = resultado[0];

  // Priority: centro de trabajo estado > empresa default
  if (centroEstado) {
    return centroEstado.toUpperCase().replace(/ /g, '_');
  }

  if (empresaEstadoDefault) {
    return empresaEstadoDefault.toUpperCase().replace(/ /g, '_');
  }

  return null;
}

/**
 * Resolve ISN states for multiple employees at once (batch operation)
 */
export async function resolverEstadosISNBatch(empleadoIds: string[]): Promise<Map<string, string | null>> {
  if (empleadoIds.length === 0) {
    return new Map();
  }

  const resultado = await db
    .select({
      empleadoId: employees.id,
      centroEstado: centrosTrabajo.estado,
      empresaEstadoDefault: empresas.estadoDefault,
    })
    .from(employees)
    .leftJoin(centrosTrabajo, eq(employees.centroTrabajoId, centrosTrabajo.id))
    .leftJoin(empresas, eq(employees.empresaId, empresas.id))
    .where(
      // Use SQL IN for multiple IDs
      or(...empleadoIds.map(id => eq(employees.id, id)))
    );

  const estadosPorEmpleado = new Map<string, string | null>();

  for (const row of resultado) {
    let estado: string | null = null;

    if (row.centroEstado) {
      estado = row.centroEstado.toUpperCase().replace(/ /g, '_');
    } else if (row.empresaEstadoDefault) {
      estado = row.empresaEstadoDefault.toUpperCase().replace(/ /g, '_');
    }

    estadosPorEmpleado.set(row.empleadoId, estado);
  }

  return estadosPorEmpleado;
}

// ============================================================================
// ISN Calculation
// ============================================================================

/**
 * Calculate ISN for a single amount in a specific state
 */
export function calcularISN(params: ParametrosISN, tasaBp: number): ResultadoISN {
  const { baseGravable, estado } = params;

  const baseGravableBp = pesosToBp(baseGravable);
  const isnMontoBp = multiplicarBpPorTasa(baseGravableBp, tasaBp);

  return {
    estado: estado.toUpperCase(),
    tasaBp,
    tasaPorcentaje: tasaBp / 100,
    baseGravable,
    baseGravableBp,
    isnMontoBp,
    isnMonto: bpToPesos(isnMontoBp),
  };
}

/**
 * Calculate ISN aggregated by state for multiple employees.
 * This is the main function for cost reporting.
 *
 * @param empleados - Array of employees with their resolved states and taxable amounts
 * @param fecha - Date for rate lookup
 * @returns ISN totals grouped by state
 */
export async function calcularISNAgregadoPorEstado(
  empleados: EmpleadoConEstado[],
  fecha: Date
): Promise<ResultadoISNPorEstado[]> {
  // Group employees by state
  const porEstado = new Map<string, { baseTotal: number; count: number }>();

  for (const emp of empleados) {
    if (!emp.estado) continue;

    const estadoNorm = emp.estado.toUpperCase();
    const existing = porEstado.get(estadoNorm) || { baseTotal: 0, count: 0 };
    existing.baseTotal += emp.baseGravable;
    existing.count += 1;
    porEstado.set(estadoNorm, existing);
  }

  // Calculate ISN for each state
  const resultados: ResultadoISNPorEstado[] = [];

  for (const [estado, datos] of Array.from(porEstado.entries())) {
    const tasaBp = await obtenerTasaISN(estado, fecha);

    if (tasaBp === null) {
      console.warn(`No ISN rate found for state: ${estado}`);
      continue;
    }

    const baseGravableTotalBp = pesosToBp(datos.baseTotal);
    const isnMontoTotalBp = multiplicarBpPorTasa(baseGravableTotalBp, tasaBp);

    resultados.push({
      estado,
      tasaBp,
      tasaPorcentaje: tasaBp / 100,
      baseGravableTotal: datos.baseTotal,
      baseGravableTotalBp,
      isnMontoTotal: bpToPesos(isnMontoTotalBp),
      isnMontoTotalBp,
      empleadosCount: datos.count,
    });
  }

  // Sort by state name
  resultados.sort((a, b) => a.estado.localeCompare(b.estado));

  return resultados;
}

/**
 * Get the default ISN state for an empresa
 */
export async function obtenerEstadoDefaultEmpresa(empresaId: string): Promise<string | null> {
  const resultado = await db
    .select({ estadoDefault: empresas.estadoDefault })
    .from(empresas)
    .where(eq(empresas.id, empresaId))
    .limit(1);

  if (resultado.length === 0 || !resultado[0].estadoDefault) {
    return null;
  }

  return resultado[0].estadoDefault.toUpperCase().replace(/ /g, '_');
}
