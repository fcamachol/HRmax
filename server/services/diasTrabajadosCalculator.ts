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
 * - Incapacidades por Enfermedad General:
 *   - Días 1-3: Patrón paga 100% (opcional) o 0% - SÍ cotizan
 *   - Días 4+: IMSS paga 60% del SBC - SÍ cotizan
 * - Incapacidades por Riesgo de Trabajo: IMSS paga 100% desde día 1 - SÍ cotizan
 * - Incapacidades por Maternidad: IMSS paga 100% desde día 1 - SÍ cotizan
 * - Permisos con goce: Se pagan y cotizan
 * - Permisos sin goce: No se pagan ni cotizan
 * - Vacaciones: Se pagan y cotizan
 * - Días festivos trabajados: Se pagan doble y cotizan
 */

import { db } from "../db";
import { incidenciasAsistencia, incapacidades, horasExtras } from "@shared/schema";
import { eq, and, gte, lte, sql, or, notInArray } from "drizzle-orm";

// Estatus de incapacidades que NO deben considerarse en el cálculo de nómina
const ESTATUS_INCAPACIDAD_EXCLUIDOS = ["rechazada_imss", "rechazada_documentos"];

// Límite de horas dobles semanales según LFT Art. 67
const LIMITE_HORAS_DOBLES_SEMANAL = 9;

export interface PeriodoNomina {
  fechaInicio: Date;
  fechaFin: Date;
  diasNaturales: number;
  frecuencia: 'semanal' | 'catorcenal' | 'quincenal' | 'mensual';
}

// Tipos de incapacidad según IMSS
export type TipoIncapacidad = 'enfermedad_general' | 'riesgo_trabajo' | 'maternidad';

export interface IncapacidadDetalle {
  tipo: TipoIncapacidad;
  diasTotales: number;
  diasPrimerosTres: number; // Solo para enfermedad general
  diasRestantes: number;
  porcentajePagoIMSS: number; // 60% enfermedad general, 100% RT/maternidad
  pagoPatronPrimerosTres: boolean; // Si patrón decidió pagar primeros 3 días
}

export interface HorasExtraDetalle {
  horasDobles: number;     // Primeras 9 horas semanales (200%)
  horasTriples: number;    // Excedente de 9 horas semanales (300%)
  horasTotales: number;    // Total de horas extra
}

export interface ResumenDiasTrabajados {
  empleadoId: string;
  periodo: PeriodoNomina;

  // Días del periodo
  diasNaturales: number;

  // Incidencias
  faltas: number;
  incapacidades: number;
  incapacidadesDetalle: IncapacidadDetalle[];
  permisosConGoce: number;
  permisosSinGoce: number;
  vacaciones: number;
  diasFestivos: number;
  diasDomingo: number;
  retardos: number;
  horasExtra: number;

  // NUEVO: Desglose de horas extra según LFT Art. 67-68
  horasExtraDetalle: HorasExtraDetalle;

  // Días calculados
  diasPagados: number;        // Para cálculo de sueldo (considera incapacidades correctamente)
  diasPagadosPatron: number;  // Días que el patrón paga directamente
  diasPagadosIMSS: number;    // Días que IMSS paga (subsidio)
  diasCotizadosIMSS: number;  // Para cálculo de cuotas IMSS
  diasTrabajadosEfectivos: number; // Días realmente trabajados

  // Detalles adicionales
  detalles: {
    conceptoDias: string;
    cantidad: number;
    afectaPago: boolean;
    afectaCotizacion: boolean;
    observaciones?: string;
  }[];
}

export interface IncidenciasPeriodo {
  faltas: number;
  incapacidades: number;
  incapacidadesDetalle: IncapacidadDetalle[];
  permisosConGoce: number;
  permisosSinGoce: number;
  vacaciones: number;
  diasFestivos: number;
  diasDomingo: number;
  retardos: number;
  horasExtra: number;

  // NUEVO: Desglose de horas extra según LFT
  horasExtraDobles: number;   // Primeras 9 horas semanales (200%)
  horasExtraTriples: number;  // Excedente (300%)
}

/**
 * Obtiene las incidencias de un empleado para un periodo específico
 * desde la tabla incidencias_asistencia, con detalle de incapacidades
 */
export async function obtenerIncidenciasPeriodo(
  empleadoId: string,
  fechaInicio: Date,
  fechaFin: Date
): Promise<IncidenciasPeriodo> {
  const fechaInicioStr = fechaInicio.toISOString().split('T')[0];
  const fechaFinStr = fechaFin.toISOString().split('T')[0];

  // Obtener resumen de incidencias básicas
  // Nota: La tabla incidencias_asistencia solo tiene campo 'permisos' (sin distinción de tipo)
  // Para distinguir con/sin goce, se tendría que consultar la tabla solicitudesPermisos
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

  // Obtener detalle de incapacidades del periodo
  let incapacidadesDetalle: IncapacidadDetalle[] = [];

  try {
    // IMPORTANTE: Solo considerar incapacidades activas o cerradas
    // Excluir las rechazadas (rechazada_imss, rechazada_documentos) para evitar
    // que afecten incorrectamente el cálculo de días pagados
    const incapacidadesDB = await db
      .select()
      .from(incapacidades)
      .where(
        and(
          eq(incapacidades.empleadoId, empleadoId),
          // Filtrar solo incapacidades válidas (no rechazadas)
          notInArray(incapacidades.estatus, ESTATUS_INCAPACIDAD_EXCLUIDOS),
          // Verificar que la incapacidad esté verificada (para las del portal)
          eq(incapacidades.verificado, true),
          // Verificar superposición de fechas con el periodo
          or(
            and(
              gte(incapacidades.fechaInicio, fechaInicioStr),
              lte(incapacidades.fechaInicio, fechaFinStr)
            ),
            and(
              gte(incapacidades.fechaFin, fechaInicioStr),
              lte(incapacidades.fechaFin, fechaFinStr)
            ),
            and(
              lte(incapacidades.fechaInicio, fechaInicioStr),
              gte(incapacidades.fechaFin, fechaFinStr)
            )
          )
        )
      );

    incapacidadesDetalle = incapacidadesDB.map(inc => {
      const tipoIncapacidad = mapTipoIncapacidad(inc.tipo);
      const diasTotales = inc.diasIncapacidad || calcularDiasIncapacidad(
        new Date(inc.fechaInicio),
        inc.fechaFin ? new Date(inc.fechaFin) : new Date(inc.fechaInicio),
        fechaInicio,
        fechaFin
      );

      // Para enfermedad general: primeros 3 días el patrón puede pagar (opcional)
      // Del día 4 en adelante, IMSS paga 60%
      const esEnfermedadGeneral = tipoIncapacidad === 'enfermedad_general';
      const diasPrimerosTres = esEnfermedadGeneral ? Math.min(3, diasTotales) : 0;
      const diasRestantes = esEnfermedadGeneral ? Math.max(0, diasTotales - 3) : diasTotales;

      return {
        tipo: tipoIncapacidad,
        diasTotales,
        diasPrimerosTres,
        diasRestantes,
        porcentajePagoIMSS: esEnfermedadGeneral ? 60 : 100,
        pagoPatronPrimerosTres: inc.pagoPatronPrimerosTresDias ?? false,
      };
    });
  } catch {
    // Si no existe la tabla incapacidades o hay error, usar datos básicos
    const diasIncapacidad = Number(resultado.incapacidades) || 0;
    if (diasIncapacidad > 0) {
      incapacidadesDetalle = [{
        tipo: 'enfermedad_general',
        diasTotales: diasIncapacidad,
        diasPrimerosTres: Math.min(3, diasIncapacidad),
        diasRestantes: Math.max(0, diasIncapacidad - 3),
        porcentajePagoIMSS: 60,
        pagoPatronPrimerosTres: false,
      }];
    }
  }

  // Obtener desglose de horas extra (dobles vs triples) de la tabla horas_extras
  let horasExtraDobles = 0;
  let horasExtraTriples = 0;

  try {
    const horasExtrasDB = await db
      .select({
        tipoHoraExtra: horasExtras.tipoHoraExtra,
        cantidadHoras: horasExtras.cantidadHoras,
      })
      .from(horasExtras)
      .where(
        and(
          eq(horasExtras.empleadoId, empleadoId),
          gte(horasExtras.fecha, fechaInicioStr),
          lte(horasExtras.fecha, fechaFinStr),
          eq(horasExtras.estatus, 'autorizada') // Solo contar horas autorizadas
        )
      );

    for (const he of horasExtrasDB) {
      const horas = parseFloat(he.cantidadHoras as string) || 0;
      if (he.tipoHoraExtra === 'triples') {
        horasExtraTriples += horas;
      } else {
        horasExtraDobles += horas;
      }
    }
  } catch {
    // Error de tabla - continuamos con el fallback abajo
  }

  // Fallback: Si no hay registros en horas_extras pero sí en incidencias_asistencia,
  // calcular el desglose basándose en horas totales de incidencias_asistencia
  // Según LFT Art. 67: Primeras 9 horas semanales son dobles, excedente es triple
  if (horasExtraDobles === 0 && horasExtraTriples === 0) {
    const horasTotales = Number(resultado.horasExtra) || 0;
    if (horasTotales > 0) {
      const semanasEnPeriodo = Math.ceil((new Date(fechaFinStr).getTime() - new Date(fechaInicioStr).getTime()) / (7 * 24 * 60 * 60 * 1000));
      const limiteDoblesPeriodo = LIMITE_HORAS_DOBLES_SEMANAL * semanasEnPeriodo;

      horasExtraDobles = Math.min(horasTotales, limiteDoblesPeriodo);
      horasExtraTriples = Math.max(0, horasTotales - limiteDoblesPeriodo);
    }
  }

  // Por defecto, todos los permisos se tratan como con goce
  // Para un cálculo más preciso, se debería consultar solicitudesPermisos
  const totalPermisos = Number(resultado.permisos) || 0;

  return {
    faltas: Number(resultado.faltas) || 0,
    incapacidades: Number(resultado.incapacidades) || 0,
    incapacidadesDetalle,
    permisosConGoce: totalPermisos, // Asumimos con goce por defecto
    permisosSinGoce: 0, // Se puede mejorar consultando solicitudesPermisos
    vacaciones: Number(resultado.vacaciones) || 0,
    diasFestivos: Number(resultado.diasFestivos) || 0,
    diasDomingo: Number(resultado.diasDomingo) || 0,
    retardos: Number(resultado.retardos) || 0,
    horasExtra: Number(resultado.horasExtra) || 0,
    horasExtraDobles,
    horasExtraTriples,
  };
}

/**
 * Mapea el tipo de incapacidad de la BD al tipo interno
 */
function mapTipoIncapacidad(tipo: string | null): TipoIncapacidad {
  switch (tipo?.toLowerCase()) {
    case 'riesgo_trabajo':
    case 'accidente_trabajo':
    case 'enfermedad_trabajo':
      return 'riesgo_trabajo';
    case 'maternidad':
      return 'maternidad';
    default:
      return 'enfermedad_general';
  }
}

/**
 * Calcula días de incapacidad dentro del periodo de nómina
 */
function calcularDiasIncapacidad(
  fechaInicioInc: Date,
  fechaFinInc: Date,
  fechaInicioPeriodo: Date,
  fechaFinPeriodo: Date
): number {
  const inicio = fechaInicioInc > fechaInicioPeriodo ? fechaInicioInc : fechaInicioPeriodo;
  const fin = fechaFinInc < fechaFinPeriodo ? fechaFinInc : fechaFinPeriodo;

  if (fin < inicio) return 0;

  const diffTime = fin.getTime() - inicio.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

/**
 * Calcula los días naturales entre dos fechas (inclusivo)
 */
export function calcularDiasNaturales(fechaInicio: Date, fechaFin: Date): number {
  const diffTime = fechaFin.getTime() - fechaInicio.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
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
 * con reglas correctas de IMSS para incapacidades
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

  return calcularDiasTrabajadosConIncidencias(empleadoId, periodo, incidencias);
}

/**
 * Calcula días trabajados con incidencias ya obtenidas
 * Implementa reglas correctas de IMSS
 */
function calcularDiasTrabajadosConIncidencias(
  empleadoId: string,
  periodo: PeriodoNomina,
  incidencias: IncidenciasPeriodo
): ResumenDiasTrabajados {
  const diasNaturales = periodo.diasNaturales || getDiasPorFrecuencia(periodo.frecuencia);

  // Calcular días de incapacidad que paga el patrón vs IMSS
  let diasIncapacidadPatron = 0;
  let diasIncapacidadIMSS = 0;

  for (const inc of incidencias.incapacidadesDetalle) {
    if (inc.tipo === 'enfermedad_general') {
      // Enfermedad general: primeros 3 días puede pagar patrón (opcional)
      if (inc.pagoPatronPrimerosTres) {
        diasIncapacidadPatron += inc.diasPrimerosTres;
      }
      // Del día 4+ IMSS paga 60%
      diasIncapacidadIMSS += inc.diasRestantes;
    } else {
      // Riesgo de trabajo y maternidad: IMSS paga 100% desde día 1
      diasIncapacidadIMSS += inc.diasTotales;
    }
  }

  // DÍAS PAGADOS POR PATRÓN:
  // = Días naturales - Faltas - Permisos sin goce - Incapacidades (excepto primeros 3 si patrón paga)
  const diasPagadosPatron = Math.max(0,
    diasNaturales
    - incidencias.faltas
    - incidencias.permisosSinGoce
    - (incidencias.incapacidades - diasIncapacidadPatron) // Restar incapacidades que NO paga patrón
  );

  // DÍAS PAGADOS TOTALES (lo que recibe el empleado)
  // = Días pagados patrón + Días primeros 3 si patrón paga + Vacaciones permanecen
  const diasPagados = diasPagadosPatron;

  // DÍAS COTIZADOS IMSS = Días naturales - Faltas - Permisos sin goce
  // Las incapacidades SÍ cotizan (el patrón sigue pagando cuotas IMSS)
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

  // Construir detalles con observaciones
  const detalles = [
    {
      conceptoDias: 'Días naturales del periodo',
      cantidad: diasNaturales,
      afectaPago: true,
      afectaCotizacion: true
    },
    {
      conceptoDias: 'Faltas',
      cantidad: -incidencias.faltas,
      afectaPago: true,
      afectaCotizacion: true,
      observaciones: 'No se pagan ni cotizan'
    },
  ];

  // Agregar detalle de incapacidades
  for (const inc of incidencias.incapacidadesDetalle) {
    if (inc.tipo === 'enfermedad_general') {
      if (inc.diasPrimerosTres > 0) {
        detalles.push({
          conceptoDias: `Incapacidad EG (días 1-3)`,
          cantidad: inc.diasPrimerosTres,
          afectaPago: inc.pagoPatronPrimerosTres,
          afectaCotizacion: true,
          observaciones: inc.pagoPatronPrimerosTres
            ? 'Patrón paga 100%'
            : 'Sin pago (Art. 96 LSS)'
        });
      }
      if (inc.diasRestantes > 0) {
        detalles.push({
          conceptoDias: `Incapacidad EG (día 4+)`,
          cantidad: inc.diasRestantes,
          afectaPago: false,
          afectaCotizacion: true,
          observaciones: 'IMSS paga 60% del SBC'
        });
      }
    } else {
      detalles.push({
        conceptoDias: `Incapacidad ${inc.tipo === 'riesgo_trabajo' ? 'RT' : 'Maternidad'}`,
        cantidad: inc.diasTotales,
        afectaPago: false,
        afectaCotizacion: true,
        observaciones: 'IMSS paga 100% desde día 1'
      });
    }
  }

  detalles.push(
    {
      conceptoDias: 'Permisos con goce',
      cantidad: incidencias.permisosConGoce,
      afectaPago: true,
      afectaCotizacion: true,
      observaciones: 'Se pagan y cotizan'
    },
    {
      conceptoDias: 'Permisos sin goce',
      cantidad: -incidencias.permisosSinGoce,
      afectaPago: true,
      afectaCotizacion: true,
      observaciones: 'No se pagan ni cotizan'
    },
    {
      conceptoDias: 'Vacaciones',
      cantidad: incidencias.vacaciones,
      afectaPago: true,
      afectaCotizacion: true,
      observaciones: 'Se pagan y cotizan'
    },
    {
      conceptoDias: 'Días festivos trabajados',
      cantidad: incidencias.diasFestivos,
      afectaPago: true,
      afectaCotizacion: true,
      observaciones: 'Pago doble (Art. 75 LFT)'
    },
    {
      conceptoDias: 'Días domingo trabajados',
      cantidad: incidencias.diasDomingo,
      afectaPago: true,
      afectaCotizacion: true,
      observaciones: 'Prima dominical 25%'
    },
  );

  // Agregar detalles de horas extra si hay
  if (incidencias.horasExtraDobles > 0) {
    detalles.push({
      conceptoDias: 'Horas extra dobles (200%)',
      cantidad: incidencias.horasExtraDobles,
      afectaPago: true,
      afectaCotizacion: false,
      observaciones: 'LFT Art. 67 - Primeras 9 hrs/semana'
    });
  }

  if (incidencias.horasExtraTriples > 0) {
    detalles.push({
      conceptoDias: 'Horas extra triples (300%)',
      cantidad: incidencias.horasExtraTriples,
      afectaPago: true,
      afectaCotizacion: false,
      observaciones: 'LFT Art. 68 - Excedente de 9 hrs/semana'
    });
  }

  // Construir el detalle de horas extra
  const horasExtraDetalle: HorasExtraDetalle = {
    horasDobles: incidencias.horasExtraDobles || 0,
    horasTriples: incidencias.horasExtraTriples || 0,
    horasTotales: (incidencias.horasExtraDobles || 0) + (incidencias.horasExtraTriples || 0),
  };

  return {
    empleadoId,
    periodo,
    diasNaturales,
    ...incidencias,
    horasExtraDetalle,
    diasPagados,
    diasPagadosPatron,
    diasPagadosIMSS: diasIncapacidadIMSS,
    diasCotizadosIMSS,
    diasTrabajadosEfectivos,
    detalles: detalles.filter(d => d.cantidad !== 0),
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
  return calcularDiasTrabajadosConIncidencias(empleadoId, periodo, incidencias);
}

/**
 * Versión simplificada: calcula días usando valores por defecto
 * cuando no hay incidencias registradas
 */
export function calcularDiasSinIncidencias(
  diasPeriodo: number
): { diasPagados: number; diasCotizadosIMSS: number; diasPagadosPatron: number; diasPagadosIMSS: number } {
  return {
    diasPagados: diasPeriodo,
    diasCotizadosIMSS: diasPeriodo,
    diasPagadosPatron: diasPeriodo,
    diasPagadosIMSS: 0,
  };
}
