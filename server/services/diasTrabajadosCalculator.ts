/**
 * Calculador de Días Trabajados para Nómina
 * 
 * Este servicio calcula los días efectivos trabajados y cotizados
 * a partir de las incidencias del periodo de asistencia.
 * 
 * Diferenciación importante:
 * - DÍAS PAGADOS: Días por los que el empleado recibe sueldo
 * - DÍAS COTIZADOS IMSS: Días que cuentan para cotización IMSS (pueden diferir)
 * 
 * Reglas según LFT e IMSS:
 * - Faltas: No se pagan ni cotizan
 * - Incapacidades: No se pagan (IMSS paga subsidio desde día 4), pero SÍ cotizan
 * - Permisos con goce: Se pagan y cotizan
 * - Permisos sin goce: No se pagan ni cotizan
 * - Vacaciones: Se pagan y cotizan
 * - Días festivos trabajados: Se pagan doble y cotizan
 */

import { db } from "../db";
import { incidenciasAsistencia } from "@shared/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";

export interface PeriodoNomina {
  fechaInicio: Date;
  fechaFin: Date;
  diasNaturales: number;
  frecuencia: 'semanal' | 'catorcenal' | 'quincenal' | 'mensual';
}

export interface ResumenDiasTrabajados {
  empleadoId: string;
  periodo: PeriodoNomina;
  
  // Días del periodo
  diasNaturales: number;
  
  // Incidencias
  faltas: number;
  incapacidades: number;
  permisosConGoce: number;
  permisosSinGoce: number;
  vacaciones: number;
  diasFestivos: number;
  diasDomingo: number;
  retardos: number;
  horasExtra: number;
  
  // Días calculados
  diasPagados: number;        // Para cálculo de sueldo
  diasCotizadosIMSS: number;  // Para cálculo de cuotas IMSS
  diasTrabajadosEfectivos: number; // Días realmente trabajados (sin vacaciones, incapacidades, etc.)
  
  // Detalles adicionales
  detalles: {
    conceptoDias: string;
    cantidad: number;
    afectaPago: boolean;
    afectaCotizacion: boolean;
  }[];
}

export interface IncidenciasPeriodo {
  faltas: number;
  incapacidades: number;
  permisosConGoce: number;
  permisosSinGoce: number;
  vacaciones: number;
  diasFestivos: number;
  diasDomingo: number;
  retardos: number;
  horasExtra: number;
}

/**
 * Obtiene las incidencias de un empleado para un periodo específico
 * desde la tabla incidencias_asistencia
 */
export async function obtenerIncidenciasPeriodo(
  empleadoId: string,
  fechaInicio: Date,
  fechaFin: Date
): Promise<IncidenciasPeriodo> {
  const fechaInicioStr = fechaInicio.toISOString().split('T')[0];
  const fechaFinStr = fechaFin.toISOString().split('T')[0];

  const registros = await db
    .select({
      faltas: sql<number>`COALESCE(SUM(${incidenciasAsistencia.faltas}), 0)`,
      incapacidades: sql<number>`COALESCE(SUM(${incidenciasAsistencia.incapacidades}), 0)`,
      permisos: sql<number>`COALESCE(SUM(${incidenciasAsistencia.permisos}), 0)`,
      vacaciones: sql<number>`COALESCE(SUM(${incidenciasAsistencia.vacaciones}), 0)`,
      diasFestivos: sql<number>`COALESCE(SUM(${incidenciasAsistencia.diasFestivos}), 0)`,
      diasDomingo: sql<number>`COALESCE(SUM(${incidenciasAsistencia.diasDomingo}), 0)`,
      retardos: sql<number>`COALESCE(SUM(${incidenciasAsistencia.retardos}), 0)`,
      horasExtra: sql<number>`COALESCE(SUM(${incidenciasAsistencia.horasExtra}), 0)`,
    })
    .from(incidenciasAsistencia)
    .where(
      and(
        eq(incidenciasAsistencia.employeeId, empleadoId),
        gte(incidenciasAsistencia.fecha, fechaInicioStr),
        lte(incidenciasAsistencia.fecha, fechaFinStr)
      )
    );

  const resultado = registros[0] || {};

  return {
    faltas: Number(resultado.faltas) || 0,
    incapacidades: Number(resultado.incapacidades) || 0,
    permisosConGoce: 0, // Por ahora asumimos que todos los permisos son con goce
    permisosSinGoce: Number(resultado.permisos) || 0, // Se puede ajustar según tipo
    vacaciones: Number(resultado.vacaciones) || 0,
    diasFestivos: Number(resultado.diasFestivos) || 0,
    diasDomingo: Number(resultado.diasDomingo) || 0,
    retardos: Number(resultado.retardos) || 0,
    horasExtra: Number(resultado.horasExtra) || 0,
  };
}

/**
 * Calcula los días naturales entre dos fechas (inclusivo)
 */
export function calcularDiasNaturales(fechaInicio: Date, fechaFin: Date): number {
  const diffTime = fechaFin.getTime() - fechaInicio.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 para incluir ambos días
  return diffDays;
}

/**
 * Obtiene los días según la frecuencia de pago
 */
export function getDiasPorFrecuencia(frecuencia: PeriodoNomina['frecuencia']): number {
  switch (frecuencia) {
    case 'semanal': return 7;
    case 'catorcenal': return 14;
    case 'quincenal': return 15;
    case 'mensual': return 30;
    default: return 15;
  }
}

/**
 * Calcula el resumen completo de días trabajados para un empleado
 */
export async function calcularDiasTrabajados(
  empleadoId: string,
  periodo: PeriodoNomina
): Promise<ResumenDiasTrabajados> {
  const incidencias = await obtenerIncidenciasPeriodo(
    empleadoId,
    periodo.fechaInicio,
    periodo.fechaFin
  );

  const diasNaturales = periodo.diasNaturales || getDiasPorFrecuencia(periodo.frecuencia);

  // DÍAS PAGADOS = Días naturales - Faltas - Permisos sin goce
  // Nota: Incapacidades no restan de días pagados porque IMSS paga subsidio,
  // pero el patrón puede complementar según política interna
  const diasPagados = Math.max(0, 
    diasNaturales 
    - incidencias.faltas 
    - incidencias.permisosSinGoce
  );

  // DÍAS COTIZADOS IMSS = Días naturales - Faltas - Permisos sin goce
  // Las incapacidades SÍ cotizan (el patrón sigue pagando cuotas IMSS)
  // Las vacaciones SÍ cotizan
  const diasCotizadosIMSS = Math.max(0,
    diasNaturales
    - incidencias.faltas
    - incidencias.permisosSinGoce
  );

  // DÍAS TRABAJADOS EFECTIVOS = Días que realmente asistió a trabajar
  const diasTrabajadosEfectivos = Math.max(0,
    diasNaturales
    - incidencias.faltas
    - incidencias.incapacidades
    - incidencias.permisosConGoce
    - incidencias.permisosSinGoce
    - incidencias.vacaciones
  );

  const detalles = [
    { conceptoDias: 'Días naturales del periodo', cantidad: diasNaturales, afectaPago: true, afectaCotizacion: true },
    { conceptoDias: 'Faltas', cantidad: -incidencias.faltas, afectaPago: true, afectaCotizacion: true },
    { conceptoDias: 'Incapacidades (IMSS paga)', cantidad: incidencias.incapacidades, afectaPago: false, afectaCotizacion: true },
    { conceptoDias: 'Permisos con goce', cantidad: incidencias.permisosConGoce, afectaPago: true, afectaCotizacion: true },
    { conceptoDias: 'Permisos sin goce', cantidad: -incidencias.permisosSinGoce, afectaPago: true, afectaCotizacion: true },
    { conceptoDias: 'Vacaciones', cantidad: incidencias.vacaciones, afectaPago: true, afectaCotizacion: true },
    { conceptoDias: 'Días festivos trabajados', cantidad: incidencias.diasFestivos, afectaPago: true, afectaCotizacion: true },
    { conceptoDias: 'Días domingo trabajados', cantidad: incidencias.diasDomingo, afectaPago: true, afectaCotizacion: true },
  ].filter(d => d.cantidad !== 0);

  return {
    empleadoId,
    periodo,
    diasNaturales,
    ...incidencias,
    diasPagados,
    diasCotizadosIMSS,
    diasTrabajadosEfectivos,
    detalles,
  };
}

/**
 * Calcula días trabajados sin consultar la base de datos
 * (para uso cuando ya se tienen las incidencias)
 */
export function calcularDiasTrabajadosSync(
  empleadoId: string,
  periodo: PeriodoNomina,
  incidencias: IncidenciasPeriodo
): ResumenDiasTrabajados {
  const diasNaturales = periodo.diasNaturales || getDiasPorFrecuencia(periodo.frecuencia);

  const diasPagados = Math.max(0, 
    diasNaturales 
    - incidencias.faltas 
    - incidencias.permisosSinGoce
  );

  const diasCotizadosIMSS = Math.max(0,
    diasNaturales
    - incidencias.faltas
    - incidencias.permisosSinGoce
  );

  const diasTrabajadosEfectivos = Math.max(0,
    diasNaturales
    - incidencias.faltas
    - incidencias.incapacidades
    - incidencias.permisosConGoce
    - incidencias.permisosSinGoce
    - incidencias.vacaciones
  );

  const detalles = [
    { conceptoDias: 'Días naturales del periodo', cantidad: diasNaturales, afectaPago: true, afectaCotizacion: true },
    { conceptoDias: 'Faltas', cantidad: -incidencias.faltas, afectaPago: true, afectaCotizacion: true },
    { conceptoDias: 'Incapacidades (IMSS paga)', cantidad: incidencias.incapacidades, afectaPago: false, afectaCotizacion: true },
    { conceptoDias: 'Permisos con goce', cantidad: incidencias.permisosConGoce, afectaPago: true, afectaCotizacion: true },
    { conceptoDias: 'Permisos sin goce', cantidad: -incidencias.permisosSinGoce, afectaPago: true, afectaCotizacion: true },
    { conceptoDias: 'Vacaciones', cantidad: incidencias.vacaciones, afectaPago: true, afectaCotizacion: true },
    { conceptoDias: 'Días festivos trabajados', cantidad: incidencias.diasFestivos, afectaPago: true, afectaCotizacion: true },
    { conceptoDias: 'Días domingo trabajados', cantidad: incidencias.diasDomingo, afectaPago: true, afectaCotizacion: true },
  ].filter(d => d.cantidad !== 0);

  return {
    empleadoId,
    periodo,
    diasNaturales,
    ...incidencias,
    diasPagados,
    diasCotizadosIMSS,
    diasTrabajadosEfectivos,
    detalles,
  };
}

/**
 * Versión simplificada: calcula días usando valores por defecto
 * cuando no hay incidencias registradas
 */
export function calcularDiasSinIncidencias(
  diasPeriodo: number
): { diasPagados: number; diasCotizadosIMSS: number } {
  return {
    diasPagados: diasPeriodo,
    diasCotizadosIMSS: diasPeriodo,
  };
}
