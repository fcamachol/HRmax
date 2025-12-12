/**
 * Compensation Service - Compatibility Layer
 * 
 * Provides salary data for payroll calculations by reading from the new
 * compensation tables (compensacion_trabajador, compensacion_calculada)
 * with automatic fallback to employee record if no compensation exists.
 * 
 * This allows gradual migration from the old single-table approach
 * to the new dual-compensation system (BRUTO/NETO).
 */

import { db } from '../db';
import { 
  employees, 
  compensacionTrabajador, 
  compensacionCalculada,
  type Employee,
  type CompensacionTrabajador,
  type CompensacionCalculada
} from '@shared/schema';
import { eq, and, lte, gte, desc, isNull, or } from 'drizzle-orm';
import { bpToPesos, pesosToBp, dividirBpRedondeado } from '@shared/basisPoints';

export interface SalarioParaNomina {
  empleadoId: string;
  esquemaTipo: 'BRUTO' | 'NETO';
  salarioDiarioBp: bigint;
  salarioDiarioNominalBp: bigint | null;
  netoDeseadoBp: bigint | null;
  brutoTotalBp: bigint | null;
  sbcBp: bigint | null;
  factorIntegracionBp: bigint | null;
  fuente: 'compensacion_trabajador' | 'employee_legacy';
  vigenciaDesde: Date | null;
  vigenciaHasta: Date | null;
  distribucion: {
    previsionSocialBp: bigint | null;
    premioPuntualidadBp: bigint | null;
    premioAsistenciaBp: bigint | null;
    fondoAhorroBp: bigint | null;
    valesDespensaBp: bigint | null;
    otrosConceptosBp: bigint | null;
  } | null;
}

/**
 * Obtiene los datos de salario para un empleado en una fecha específica.
 * Primero busca en compensacion_trabajador, si no existe usa el registro de employee.
 * 
 * @param empleadoId - ID del empleado (string UUID)
 * @param fechaReferencia - Fecha para determinar la vigencia de compensación (default: hoy)
 * @returns Datos de salario normalizados para uso en nómina
 */
export async function getSalarioParaNomina(
  empleadoId: string,
  fechaReferencia: Date = new Date()
): Promise<SalarioParaNomina | null> {
  const fechaRef = fechaReferencia.toISOString().split('T')[0];
  
  const compensacion = await db
    .select()
    .from(compensacionTrabajador)
    .where(
      and(
        eq(compensacionTrabajador.empleadoId, empleadoId),
        lte(compensacionTrabajador.vigenciaDesde, fechaRef),
        or(
          isNull(compensacionTrabajador.vigenciaHasta),
          gte(compensacionTrabajador.vigenciaHasta, fechaRef)
        )
      )
    )
    .orderBy(desc(compensacionTrabajador.vigenciaDesde))
    .limit(1);

  if (compensacion.length > 0) {
    const comp = compensacion[0];
    
    const calculada = await db
      .select()
      .from(compensacionCalculada)
      .where(eq(compensacionCalculada.compensacionTrabajadorId, comp.id))
      .orderBy(desc(compensacionCalculada.fechaCalculo))
      .limit(1);
    
    const calc = calculada.length > 0 ? calculada[0] : null;
    
    const employee = await db
      .select()
      .from(employees)
      .where(eq(employees.id, empleadoId))
      .limit(1);
    
    const emp = employee.length > 0 ? employee[0] : null;
    
    // Use esquemaTipo from compensacion_trabajador as canonical source
    // Fall back to employee.tipoEsquema only for legacy records without esquemaTipo
    const esquema = (comp.esquemaTipo || emp?.tipoEsquema || 'NETO') as 'BRUTO' | 'NETO';
    
    // Prioritize stored daily salary; only derive from monthly if daily is absent
    // For NETO scheme: salarioDiarioBp is the daily net
    // For BRUTO scheme: salarioDiarioBp is the daily gross
    let salarioDiarioBpValue: bigint;
    if (comp.salarioDiarioBp) {
      // Use explicitly stored daily salary
      salarioDiarioBpValue = comp.salarioDiarioBp;
    } else if (calc?.salarioDiarioBp) {
      // Use calculated daily salary from compensacion_calculada
      salarioDiarioBpValue = calc.salarioDiarioBp;
    } else if (comp.netoDeseadoBp) {
      // Derive from monthly neto deseado with rounding (for legacy NETO records)
      // Uses rounding division to prevent cents truncation
      salarioDiarioBpValue = dividirBpRedondeado(comp.netoDeseadoBp, 30);
    } else {
      salarioDiarioBpValue = BigInt(0);
    }
    
    return {
      empleadoId,
      esquemaTipo: esquema,
      salarioDiarioBp: salarioDiarioBpValue,
      salarioDiarioNominalBp: null,
      netoDeseadoBp: comp.netoDeseadoBp,
      brutoTotalBp: calc?.brutoTotalBp || null,
      sbcBp: calc?.sbcBp || null,
      factorIntegracionBp: calc?.factorIntegracionBp || null,
      fuente: 'compensacion_trabajador',
      vigenciaDesde: comp.vigenciaDesde ? new Date(comp.vigenciaDesde) : null,
      vigenciaHasta: comp.vigenciaHasta ? new Date(comp.vigenciaHasta) : null,
      distribucion: {
        previsionSocialBp: comp.previsionSocialBp,
        premioPuntualidadBp: comp.premioPuntualidadBp,
        premioAsistenciaBp: comp.premioAsistenciaBp,
        fondoAhorroBp: comp.fondoAhorroBp,
        valesDespensaBp: comp.valesDespensaBp,
        otrosConceptosBp: comp.otrosConceptosBp,
      },
    };
  }
  
  const employee = await db
    .select()
    .from(employees)
    .where(eq(employees.id, empleadoId))
    .limit(1);

  if (employee.length === 0) {
    return null;
  }

  const emp = employee[0];
  
  const salarioDiarioBp = emp.salarioDiarioReal 
    ? pesosToBp(parseFloat(emp.salarioDiarioReal))
    : BigInt(0);
  
  const salarioDiarioNominalBp = emp.salarioDiarioNominal 
    ? pesosToBp(parseFloat(emp.salarioDiarioNominal))
    : null;
  
  const sbcBp = emp.sbc 
    ? pesosToBp(parseFloat(emp.sbc))
    : null;
  
  return {
    empleadoId,
    esquemaTipo: (emp.tipoEsquema || 'NETO') as 'BRUTO' | 'NETO',
    salarioDiarioBp,
    salarioDiarioNominalBp,
    netoDeseadoBp: salarioDiarioBp * BigInt(30),
    brutoTotalBp: null,
    sbcBp,
    factorIntegracionBp: null,
    fuente: 'employee_legacy',
    vigenciaDesde: emp.fechaIngreso ? new Date(emp.fechaIngreso) : null,
    vigenciaHasta: null,
    distribucion: null,
  };
}

/**
 * Obtiene salarios para múltiples empleados en una fecha específica.
 * Optimizado para cálculos de nómina masivos.
 * 
 * @param empleadoIds - Array de IDs de empleados (string UUIDs)
 * @param fechaReferencia - Fecha para determinar la vigencia
 * @returns Map de empleadoId -> SalarioParaNomina
 */
export async function getSalariosParaNomina(
  empleadoIds: string[],
  fechaReferencia: Date = new Date()
): Promise<Map<string, SalarioParaNomina>> {
  const result = new Map<string, SalarioParaNomina>();
  
  const salarios = await Promise.all(
    empleadoIds.map(id => getSalarioParaNomina(id, fechaReferencia))
  );
  
  for (let i = 0; i < empleadoIds.length; i++) {
    const salario = salarios[i];
    if (salario) {
      result.set(empleadoIds[i], salario);
    }
  }
  
  return result;
}

/**
 * Determina si un empleado tiene compensación configurada en las nuevas tablas.
 * Útil para validar si se puede usar el sistema dual o se requiere migración.
 * 
 * @param empleadoId - ID del empleado (string UUID)
 * @returns true si tiene compensacion_trabajador configurada
 */
export async function tieneCompensacionConfigurada(
  empleadoId: string
): Promise<boolean> {
  const compensacion = await db
    .select({ id: compensacionTrabajador.id })
    .from(compensacionTrabajador)
    .where(eq(compensacionTrabajador.empleadoId, empleadoId))
    .limit(1);
  
  return compensacion.length > 0;
}

/**
 * Obtiene el historial de compensaciones de un empleado.
 * Incluye todas las vigencias pasadas, presentes y futuras.
 * 
 * @param empleadoId - ID del empleado (string UUID)
 * @returns Array de compensaciones ordenadas por vigencia (más reciente primero)
 */
export async function getHistorialCompensaciones(
  empleadoId: string
): Promise<CompensacionTrabajador[]> {
  return db
    .select()
    .from(compensacionTrabajador)
    .where(eq(compensacionTrabajador.empleadoId, empleadoId))
    .orderBy(desc(compensacionTrabajador.vigenciaDesde));
}
