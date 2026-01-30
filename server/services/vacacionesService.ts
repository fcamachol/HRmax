/**
 * Servicio de Gestión de Vacaciones
 *
 * Este servicio maneja:
 * - Sincronización del saldo de vacaciones (kardex → employee cache)
 * - Caducidad automática de días (prescripción a 18 meses según LFT Art. 516)
 * - Cálculo de prima vacacional
 * - Devengo de vacaciones por aniversario
 *
 * LFT Referencias:
 * - Art. 76: Días de vacaciones por antigüedad
 * - Art. 80: Prima vacacional (25% mínimo)
 * - Art. 516: Prescripción de vacaciones (1 año desde que son exigibles)
 */

import { db } from "../db";
import {
  employees,
  kardexVacaciones,
  catTablasPrestaciones,
  solicitudesVacaciones,
  type KardexVacaciones,
  type Employee,
} from "@shared/schema";
import { eq, and, sql, lte, isNull, or, desc, asc } from "drizzle-orm";

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export interface SaldoVacacionesDetalle {
  empleadoId: string;
  saldoTotal: number;
  saldoPorAnio: {
    anioAntiguedad: number;
    diasDevengados: number;
    diasDisfrutados: number;
    diasCaducados: number;
    diasAjustes: number;
    saldoNeto: number;
    fechaDevengo?: string;
    fechaCaducidad?: string; // Fecha límite para usar estos días
    estaVencido: boolean;
  }[];
  movimientos: KardexVacaciones[];
}

export interface ResultadoDevengo {
  success: boolean;
  kardexCreado?: KardexVacaciones;
  diasDevengados: number;
  nuevoSaldo: number;
  mensaje: string;
}

export interface ResultadoCaducidad {
  empleadoId: string;
  diasCaducados: number;
  anioAntiguedad: number;
  kardexCreado?: KardexVacaciones;
}

export interface ResultadoProcesoCaducidad {
  procesados: number;
  empleadosAfectados: ResultadoCaducidad[];
  errores: string[];
}

// ============================================================================
// CONSTANTES
// ============================================================================

// Días de vacaciones según LFT Art. 76 (Reforma 2023)
const DIAS_VACACIONES_LFT: Record<number, number> = {
  1: 12,   // Primer año
  2: 14,   // Segundo año
  3: 16,   // Tercer año
  4: 18,   // Cuarto año
  5: 20,   // Quinto año
  // Del año 6 al 10: 20 días
  // Del año 11 al 15: 22 días (se suman 2 cada 5 años)
  // Del año 16 al 20: 24 días
  // etc.
};

/**
 * Obtiene los días de vacaciones según antigüedad (LFT Art. 76)
 */
export function getDiasVacacionesPorAntiguedad(aniosAntiguedad: number): number {
  if (aniosAntiguedad <= 0) return 0;
  if (aniosAntiguedad <= 4) return DIAS_VACACIONES_LFT[aniosAntiguedad] || 12;
  if (aniosAntiguedad <= 9) return 20;

  // A partir del año 10, se suman 2 días cada 5 años
  const quinqueniosAdicionales = Math.floor((aniosAntiguedad - 5) / 5);
  return 20 + (quinqueniosAdicionales * 2);
}

// ============================================================================
// FUNCIONES DE SALDO
// ============================================================================

/**
 * Calcula el saldo actual de vacaciones de un empleado desde el kardex
 * Esta es la fuente de verdad (no el cache en employees)
 */
export async function calcularSaldoVacaciones(empleadoId: string): Promise<SaldoVacacionesDetalle> {
  const movimientos = await db
    .select()
    .from(kardexVacaciones)
    .where(eq(kardexVacaciones.empleadoId, empleadoId))
    .orderBy(asc(kardexVacaciones.anioAntiguedad), asc(kardexVacaciones.fechaMovimiento));

  // Agrupar por año de antigüedad
  const porAnio = new Map<number, {
    devengados: number;
    disfrutados: number;
    caducados: number;
    ajustes: number;
    fechaDevengo?: string;
  }>();

  for (const mov of movimientos) {
    const anio = mov.anioAntiguedad;
    if (!porAnio.has(anio)) {
      porAnio.set(anio, { devengados: 0, disfrutados: 0, caducados: 0, ajustes: 0 });
    }

    const datos = porAnio.get(anio)!;
    const dias = parseFloat(mov.dias as string);

    switch (mov.tipoMovimiento) {
      case 'devengo':
        datos.devengados += dias;
        datos.fechaDevengo = mov.fechaMovimiento;
        break;
      case 'disfrute':
        datos.disfrutados += Math.abs(dias); // Los disfrutes son negativos
        break;
      case 'caducidad':
        datos.caducados += Math.abs(dias);
        break;
      case 'finiquito':
        datos.disfrutados += Math.abs(dias); // Finiquito cuenta como usado
        break;
      case 'ajuste':
        datos.ajustes += dias; // Puede ser positivo o negativo
        break;
    }
  }

  // Calcular fecha de caducidad para cada año
  // Según LFT Art. 516: 1 año desde que son exigibles (18 meses desde aniversario)
  const hoy = new Date();
  const saldoPorAnio = Array.from(porAnio.entries()).map(([anio, datos]) => {
    const saldoNeto = datos.devengados - datos.disfrutados - datos.caducados + datos.ajustes;

    // La fecha de caducidad es 18 meses después del aniversario
    let fechaCaducidad: string | undefined;
    let estaVencido = false;

    if (datos.fechaDevengo) {
      const fechaDevengo = new Date(datos.fechaDevengo);
      const fechaCad = new Date(fechaDevengo);
      fechaCad.setMonth(fechaCad.getMonth() + 18);
      fechaCaducidad = fechaCad.toISOString().split('T')[0];
      estaVencido = hoy > fechaCad && saldoNeto > 0;
    }

    return {
      anioAntiguedad: anio,
      diasDevengados: datos.devengados,
      diasDisfrutados: datos.disfrutados,
      diasCaducados: datos.caducados,
      diasAjustes: datos.ajustes,
      saldoNeto: Math.max(0, saldoNeto),
      fechaDevengo: datos.fechaDevengo,
      fechaCaducidad,
      estaVencido,
    };
  });

  const saldoTotal = saldoPorAnio.reduce((sum, a) => sum + a.saldoNeto, 0);

  return {
    empleadoId,
    saldoTotal,
    saldoPorAnio,
    movimientos,
  };
}

/**
 * Sincroniza el saldo de vacaciones del kardex al cache del empleado
 * Debe llamarse después de cada movimiento en el kardex
 */
export async function sincronizarSaldoVacacionesEmpleado(empleadoId: string): Promise<number> {
  const detalle = await calcularSaldoVacaciones(empleadoId);

  // Actualizar el cache en la tabla employees
  await db
    .update(employees)
    .set({
      saldoVacacionesActual: String(detalle.saldoTotal),
      updatedAt: new Date(),
    })
    .where(eq(employees.id, empleadoId));

  return detalle.saldoTotal;
}

/**
 * Sincroniza el saldo de vacaciones para todos los empleados
 * Útil para corrección masiva o migración
 */
export async function sincronizarTodosSaldosVacaciones(
  clienteId?: string,
  empresaId?: string
): Promise<{ actualizados: number; errores: string[] }> {
  // Construir condiciones dinámicamente
  const conditions = [eq(employees.estatus, 'activo')];

  if (clienteId) {
    conditions.push(eq(employees.clienteId, clienteId));
  }
  if (empresaId) {
    conditions.push(eq(employees.empresaId, empresaId!));
  }

  const empleadosActivos = await db
    .select({ id: employees.id })
    .from(employees)
    .where(and(...conditions));

  let actualizados = 0;
  const errores: string[] = [];

  for (const emp of empleadosActivos) {
    try {
      await sincronizarSaldoVacacionesEmpleado(emp.id);
      actualizados++;
    } catch (error) {
      errores.push(`Error sincronizando empleado ${emp.id}: ${error}`);
    }
  }

  return { actualizados, errores };
}

// ============================================================================
// FUNCIONES DE DEVENGO (ANNIVERSARY ACCRUAL)
// ============================================================================

/**
 * Registra el devengo de vacaciones por aniversario laboral
 */
export async function registrarDevengoVacaciones(
  empleadoId: string,
  clienteId: string,
  empresaId: string,
  anioAntiguedad: number,
  diasVacaciones?: number,
  fechaAniversario?: Date,
  createdBy?: string
): Promise<ResultadoDevengo> {
  // Verificar si ya existe devengo para este año
  const existente = await db
    .select()
    .from(kardexVacaciones)
    .where(and(
      eq(kardexVacaciones.empleadoId, empleadoId),
      eq(kardexVacaciones.anioAntiguedad, anioAntiguedad),
      eq(kardexVacaciones.tipoMovimiento, 'devengo')
    ));

  if (existente.length > 0) {
    return {
      success: false,
      diasDevengados: 0,
      nuevoSaldo: 0,
      mensaje: `Ya existe devengo para el año de antigüedad ${anioAntiguedad}`,
    };
  }

  // Determinar días de vacaciones
  let dias = diasVacaciones;
  if (!dias) {
    // Buscar en tabla de prestaciones de la empresa o usar LFT
    const prestaciones = await db
      .select()
      .from(catTablasPrestaciones)
      .where(and(
        eq(catTablasPrestaciones.empresaId, empresaId),
        eq(catTablasPrestaciones.aniosAntiguedad, anioAntiguedad)
      ))
      .limit(1);

    if (prestaciones.length > 0) {
      dias = prestaciones[0].diasVacaciones;
    } else {
      dias = getDiasVacacionesPorAntiguedad(anioAntiguedad);
    }
  }

  // Calcular saldo actual para el snapshot
  const saldoActual = await calcularSaldoVacaciones(empleadoId);
  const nuevoSaldo = saldoActual.saldoTotal + dias;

  // Crear el registro de devengo
  const [kardexCreado] = await db
    .insert(kardexVacaciones)
    .values({
      empleadoId,
      clienteId,
      empresaId,
      anioAntiguedad,
      tipoMovimiento: 'devengo',
      dias: String(dias),
      saldoDespuesMovimiento: String(nuevoSaldo),
      fechaMovimiento: fechaAniversario?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
      observaciones: `Devengo automático por ${anioAntiguedad}° aniversario laboral`,
      createdBy,
    })
    .returning();

  // Sincronizar el saldo en el empleado
  await sincronizarSaldoVacacionesEmpleado(empleadoId);

  return {
    success: true,
    kardexCreado,
    diasDevengados: dias,
    nuevoSaldo,
    mensaje: `Se devengaron ${dias} días de vacaciones por el año ${anioAntiguedad}`,
  };
}

// ============================================================================
// FUNCIONES DE CADUCIDAD (PRESCRIPTION AUTOMATION)
// ============================================================================

/**
 * Procesa la caducidad de vacaciones vencidas para un empleado
 * Según LFT Art. 516: Las vacaciones prescriben en 1 año desde que son exigibles
 * En la práctica: 18 meses desde el aniversario laboral
 */
export async function procesarCaducidadEmpleado(
  empleadoId: string,
  fechaCorte?: Date
): Promise<ResultadoCaducidad[]> {
  const fechaLimite = fechaCorte || new Date();
  const detalle = await calcularSaldoVacaciones(empleadoId);
  const resultados: ResultadoCaducidad[] = [];

  for (const anio of detalle.saldoPorAnio) {
    // Solo procesar si hay saldo y está vencido
    if (anio.saldoNeto > 0 && anio.estaVencido && anio.fechaCaducidad) {
      const fechaCaducidad = new Date(anio.fechaCaducidad);

      if (fechaLimite >= fechaCaducidad) {
        // Obtener datos del empleado para clienteId y empresaId
        const [empleado] = await db
          .select()
          .from(employees)
          .where(eq(employees.id, empleadoId));

        if (!empleado) continue;

        // Calcular nuevo saldo
        const saldoActual = await calcularSaldoVacaciones(empleadoId);
        const nuevoSaldo = saldoActual.saldoTotal - anio.saldoNeto;

        // Crear movimiento de caducidad
        const [kardexCreado] = await db
          .insert(kardexVacaciones)
          .values({
            empleadoId,
            clienteId: empleado.clienteId,
            empresaId: empleado.empresaId!,
            anioAntiguedad: anio.anioAntiguedad,
            tipoMovimiento: 'caducidad',
            dias: String(-anio.saldoNeto), // Negativo porque resta
            saldoDespuesMovimiento: String(nuevoSaldo),
            fechaMovimiento: fechaLimite.toISOString().split('T')[0],
            observaciones: `Caducidad automática: ${anio.saldoNeto} días del año ${anio.anioAntiguedad} prescritos (LFT Art. 516). Fecha límite: ${anio.fechaCaducidad}`,
            createdBy: 'SISTEMA_CADUCIDAD',
          })
          .returning();

        resultados.push({
          empleadoId,
          diasCaducados: anio.saldoNeto,
          anioAntiguedad: anio.anioAntiguedad,
          kardexCreado,
        });
      }
    }
  }

  // Sincronizar saldo si hubo caducidades
  if (resultados.length > 0) {
    await sincronizarSaldoVacacionesEmpleado(empleadoId);
  }

  return resultados;
}

/**
 * Proceso batch de caducidad para todos los empleados
 * Diseñado para ejecutarse como cron job (ej: diario o semanal)
 */
export async function procesarCaducidadMasiva(
  clienteId?: string,
  empresaId?: string,
  fechaCorte?: Date
): Promise<ResultadoProcesoCaducidad> {
  // Construir condiciones dinámicamente
  const conditions = [eq(employees.estatus, 'activo')];

  if (clienteId) {
    conditions.push(eq(employees.clienteId, clienteId));
  }
  if (empresaId) {
    conditions.push(eq(employees.empresaId, empresaId!));
  }

  const empleadosActivos = await db
    .select({ id: employees.id })
    .from(employees)
    .where(and(...conditions));

  const empleadosAfectados: ResultadoCaducidad[] = [];
  const errores: string[] = [];
  let procesados = 0;

  for (const emp of empleadosActivos) {
    try {
      const resultados = await procesarCaducidadEmpleado(emp.id, fechaCorte);
      empleadosAfectados.push(...resultados);
      procesados++;
    } catch (error) {
      errores.push(`Error procesando caducidad para empleado ${emp.id}: ${error}`);
    }
  }

  return {
    procesados,
    empleadosAfectados,
    errores,
  };
}

// ============================================================================
// FUNCIONES DE PRIMA VACACIONAL
// ============================================================================

/**
 * Calcula la prima vacacional para un periodo de vacaciones
 * Mínimo 25% según LFT Art. 80
 */
export async function calcularPrimaVacacional(
  empleadoId: string,
  diasVacaciones: number,
  salarioDiario: number,
  empresaId?: string
): Promise<{ primaVacacional: number; porcentaje: number }> {
  let porcentaje = 25; // Mínimo LFT

  // Buscar si la empresa tiene un porcentaje mayor
  if (empresaId) {
    const [empleado] = await db
      .select({ esquemaPrestacionesId: employees.esquemaPrestacionesId })
      .from(employees)
      .where(eq(employees.id, empleadoId));

    if (empleado?.esquemaPrestacionesId) {
      const [prestacion] = await db
        .select({ primaVacacionalPct: catTablasPrestaciones.primaVacacionalPct })
        .from(catTablasPrestaciones)
        .where(eq(catTablasPrestaciones.id, empleado.esquemaPrestacionesId));

      if (prestacion?.primaVacacionalPct) {
        const pctEmpresa = parseFloat(prestacion.primaVacacionalPct as string);
        if (pctEmpresa > porcentaje) {
          porcentaje = pctEmpresa;
        }
      }
    }
  }

  const primaVacacional = salarioDiario * diasVacaciones * (porcentaje / 100);

  return {
    primaVacacional: Math.round(primaVacacional * 100) / 100,
    porcentaje,
  };
}

/**
 * Registra el disfrute de vacaciones con prima vacacional
 * Debe llamarse cuando se aprueba una solicitud de vacaciones
 */
export async function registrarDisfruteVacaciones(
  empleadoId: string,
  clienteId: string,
  empresaId: string,
  diasDisfrutados: number,
  fechaInicio: string,
  fechaFin: string,
  solicitudVacacionesId?: string,
  salarioDiario?: number,
  createdBy?: string
): Promise<{
  kardexCreado: KardexVacaciones;
  primaVacacional?: number;
  nuevoSaldo: number;
}> {
  // Calcular de qué año de antigüedad se descuentan los días (FIFO - primero el más antiguo)
  const detalle = await calcularSaldoVacaciones(empleadoId);

  // Ordenar por año para usar FIFO
  const aniosConSaldo = detalle.saldoPorAnio
    .filter(a => a.saldoNeto > 0)
    .sort((a, b) => a.anioAntiguedad - b.anioAntiguedad);

  if (aniosConSaldo.length === 0) {
    throw new Error('El empleado no tiene saldo de vacaciones disponible');
  }

  // Usar el año más antiguo que tenga saldo
  const anioAUsar = aniosConSaldo[0].anioAntiguedad;

  // Calcular nuevo saldo
  const nuevoSaldo = detalle.saldoTotal - diasDisfrutados;

  // Crear movimiento de disfrute
  const [kardexCreado] = await db
    .insert(kardexVacaciones)
    .values({
      empleadoId,
      clienteId,
      empresaId,
      anioAntiguedad: anioAUsar,
      tipoMovimiento: 'disfrute',
      dias: String(-diasDisfrutados), // Negativo porque resta
      saldoDespuesMovimiento: String(nuevoSaldo),
      fechaMovimiento: fechaInicio,
      solicitudVacacionesId,
      observaciones: `Vacaciones del ${fechaInicio} al ${fechaFin} (${diasDisfrutados} días)`,
      createdBy,
    })
    .returning();

  // Sincronizar saldo
  await sincronizarSaldoVacacionesEmpleado(empleadoId);

  // Calcular prima vacacional si se proporcionó salario
  let primaVacacional: number | undefined;
  if (salarioDiario) {
    const resultado = await calcularPrimaVacacional(empleadoId, diasDisfrutados, salarioDiario, empresaId);
    primaVacacional = resultado.primaVacacional;
  }

  return {
    kardexCreado,
    primaVacacional,
    nuevoSaldo,
  };
}

// ============================================================================
// FUNCIONES DE FINIQUITO
// ============================================================================

/**
 * Obtiene el saldo de vacaciones para finiquito
 * Incluye todos los días pendientes que se deben pagar
 */
export async function obtenerSaldoParaFiniquito(empleadoId: string): Promise<{
  diasPendientes: number;
  detallePorAnio: { anio: number; dias: number }[];
}> {
  const detalle = await calcularSaldoVacaciones(empleadoId);

  const detallePorAnio = detalle.saldoPorAnio
    .filter(a => a.saldoNeto > 0)
    .map(a => ({ anio: a.anioAntiguedad, dias: a.saldoNeto }));

  const diasPendientes = detallePorAnio.reduce((sum, a) => sum + a.dias, 0);

  return {
    diasPendientes,
    detallePorAnio,
  };
}

/**
 * Registra el pago de vacaciones por finiquito
 */
export async function registrarFiniquitoVacaciones(
  empleadoId: string,
  clienteId: string,
  empresaId: string,
  fechaFiniquito: string,
  createdBy?: string
): Promise<{
  kardexEntries: KardexVacaciones[];
  totalDiasPagados: number;
}> {
  const saldoFiniquito = await obtenerSaldoParaFiniquito(empleadoId);
  const kardexEntries: KardexVacaciones[] = [];
  let saldoAcumulado = saldoFiniquito.diasPendientes;

  for (const anio of saldoFiniquito.detallePorAnio) {
    saldoAcumulado -= anio.dias;

    const [kardex] = await db
      .insert(kardexVacaciones)
      .values({
        empleadoId,
        clienteId,
        empresaId,
        anioAntiguedad: anio.anio,
        tipoMovimiento: 'finiquito',
        dias: String(-anio.dias),
        saldoDespuesMovimiento: String(saldoAcumulado),
        fechaMovimiento: fechaFiniquito,
        primaPagada: true,
        observaciones: `Pago por finiquito: ${anio.dias} días del año ${anio.anio}`,
        createdBy,
      })
      .returning();

    kardexEntries.push(kardex);
  }

  // Sincronizar saldo (debería quedar en 0)
  await sincronizarSaldoVacacionesEmpleado(empleadoId);

  return {
    kardexEntries,
    totalDiasPagados: saldoFiniquito.diasPendientes,
  };
}
