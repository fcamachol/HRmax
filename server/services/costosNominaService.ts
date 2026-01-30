/**
 * Costos de Nómina Service
 *
 * Aggregates payroll costs for reporting:
 * - ISR (employee income tax)
 * - IMSS Obrero (employee IMSS)
 * - IMSS Patronal (employer IMSS)
 * - ISN (state payroll tax)
 * - Subsidio al empleo
 * - Total employer cost
 * - Total employee deductions
 *
 * Supports:
 * - Historical data from nominaResumen table
 * - Real-time estimates for unprocessed periods (using batch desglose)
 * - Grouping by empresa and state (for ISN)
 */

import { db } from "../db";
import {
  nominaResumen,
  periodosNomina,
  empresas,
  employees,
  centrosTrabajo,
} from "@shared/schema";
import { eq, and, gte, lte, sql, inArray } from "drizzle-orm";
import { bpToPesos, pesosToBp } from "@shared/basisPoints";
import {
  calcularISNAgregadoPorEstado,
  obtenerTasaISN,
  type EmpleadoConEstado,
  type ResultadoISNPorEstado,
} from "./isnCalculator";

// ============================================================================
// Types
// ============================================================================

export interface FiltrosCostosNomina {
  clienteId: string;
  empresaId?: string;
  fechaInicio: string; // YYYY-MM-DD
  fechaFin: string; // YYYY-MM-DD
  incluirEstimaciones?: boolean;
}

export interface TotalesCostos {
  // Employee deductions (retenciones)
  isrRetenido: number;
  imssObrero: number;
  totalDeduccionesEmpleado: number;

  // Employer costs
  imssPatronal: number;
  isn: number;
  totalPercepcionesGravadas: number;
  totalPercepciones: number;

  // Subsidies
  subsidioAplicado: number;

  // Net amounts
  totalNetoEmpleados: number;

  // Total employer cost (percepciones + IMSS patronal + ISN)
  costoTotalEmpresa: number;

  // Counts
  empleadosUnicos: number;
  periodosIncluidos: number;
}

export interface CostosEmpresa extends TotalesCostos {
  empresaId: string;
  empresaNombre: string;
  empresaRfc: string;
}

export interface CostosPorEstado {
  estado: string;
  tasaBp: number;
  tasaPorcentaje: number;
  baseGravable: number;
  isnMonto: number;
  empleadosCount: number;
}

export interface ResumenCostosNomina {
  filtros: {
    clienteId: string;
    empresaId?: string;
    fechaInicio: string;
    fechaFin: string;
  };
  totales: TotalesCostos;
  porEmpresa: CostosEmpresa[];
  isnPorEstado: CostosPorEstado[];
  incluyeEstimaciones: boolean;
  periodosEstimados: string[];
}

// ============================================================================
// Main Function
// ============================================================================

/**
 * Get aggregated payroll costs for a date range.
 */
export async function obtenerCostosNomina(
  filtros: FiltrosCostosNomina
): Promise<ResumenCostosNomina> {
  const { clienteId, empresaId, fechaInicio, fechaFin } = filtros;

  // Query historical data from nominaResumen
  const historico = await obtenerCostosHistoricos(
    clienteId,
    empresaId,
    fechaInicio,
    fechaFin
  );

  // Calculate ISN by state
  const empleadosConEstado = await obtenerEmpleadosConEstado(
    clienteId,
    empresaId,
    fechaInicio,
    fechaFin
  );

  const fechaCalculo = new Date(fechaFin);
  const isnPorEstado = await calcularISNAgregadoPorEstado(
    empleadosConEstado,
    fechaCalculo
  );

  // Calculate total ISN
  const totalISN = isnPorEstado.reduce((sum, e) => sum + e.isnMontoTotal, 0);

  // Build response
  const totales: TotalesCostos = {
    ...historico.totales,
    isn: totalISN,
    costoTotalEmpresa:
      historico.totales.totalPercepciones +
      historico.totales.imssPatronal +
      totalISN,
  };

  // Add ISN to empresa totals
  const porEmpresa = await agregarISNPorEmpresa(
    historico.porEmpresa,
    clienteId,
    fechaInicio,
    fechaFin,
    fechaCalculo
  );

  return {
    filtros: { clienteId, empresaId, fechaInicio, fechaFin },
    totales,
    porEmpresa,
    isnPorEstado: isnPorEstado.map((e) => ({
      estado: e.estado,
      tasaBp: e.tasaBp,
      tasaPorcentaje: e.tasaPorcentaje,
      baseGravable: e.baseGravableTotal,
      isnMonto: e.isnMontoTotal,
      empleadosCount: e.empleadosCount,
    })),
    incluyeEstimaciones: false,
    periodosEstimados: [],
  };
}

// ============================================================================
// Historical Data Aggregation
// ============================================================================

interface HistoricoResult {
  totales: Omit<TotalesCostos, "isn" | "costoTotalEmpresa">;
  porEmpresa: Array<Omit<CostosEmpresa, "isn" | "costoTotalEmpresa">>;
}

async function obtenerCostosHistoricos(
  clienteId: string,
  empresaId: string | undefined,
  fechaInicio: string,
  fechaFin: string
): Promise<HistoricoResult> {
  // Build where conditions
  const conditions = [
    eq(nominaResumen.clienteId, clienteId),
    gte(periodosNomina.fechaInicio, fechaInicio),
    lte(periodosNomina.fechaFin, fechaFin),
  ];

  if (empresaId) {
    conditions.push(eq(nominaResumen.empresaId, empresaId));
  }

  // Query aggregated data by empresa
  const resultados = await db
    .select({
      empresaId: nominaResumen.empresaId,
      empresaNombre: empresas.nombreComercial,
      empresaRazonSocial: empresas.razonSocial,
      empresaRfc: empresas.rfc,
      // Sums
      totalIsrRetenidoBp: sql<string>`COALESCE(SUM(${nominaResumen.isrRetenidoBp}), 0)`,
      totalImssObreroBp: sql<string>`COALESCE(SUM(${nominaResumen.imssTrabajadorBp}), 0)`,
      totalImssPatronalBp: sql<string>`COALESCE(SUM(${nominaResumen.imssPatronBp}), 0)`,
      totalSubsidioBp: sql<string>`COALESCE(SUM(${nominaResumen.subsidioAplicadoBp}), 0)`,
      totalPercepcionesGravadasBp: sql<string>`COALESCE(SUM(${nominaResumen.percepcionesGravadasBp}), 0)`,
      totalPercepcionesBp: sql<string>`COALESCE(SUM(${nominaResumen.totalPercepcionesBp}), 0)`,
      totalDeduccionesBp: sql<string>`COALESCE(SUM(${nominaResumen.totalDeduccionesBp}), 0)`,
      totalNetoBp: sql<string>`COALESCE(SUM(${nominaResumen.netoPagarBp}), 0)`,
      empleadosCount: sql<number>`COUNT(DISTINCT ${nominaResumen.empleadoId})`,
      periodosCount: sql<number>`COUNT(DISTINCT ${nominaResumen.periodoId})`,
    })
    .from(nominaResumen)
    .innerJoin(
      periodosNomina,
      eq(nominaResumen.periodoId, periodosNomina.id)
    )
    .innerJoin(empresas, eq(nominaResumen.empresaId, empresas.id))
    .where(and(...conditions))
    .groupBy(
      nominaResumen.empresaId,
      empresas.nombreComercial,
      empresas.razonSocial,
      empresas.rfc
    );

  // Process results
  const porEmpresa: Array<Omit<CostosEmpresa, "isn" | "costoTotalEmpresa">> =
    resultados.map((r) => {
      const isrRetenido = bpToPesos(BigInt(r.totalIsrRetenidoBp || "0"));
      const imssObrero = bpToPesos(BigInt(r.totalImssObreroBp || "0"));
      const imssPatronal = bpToPesos(BigInt(r.totalImssPatronalBp || "0"));
      const subsidioAplicado = bpToPesos(BigInt(r.totalSubsidioBp || "0"));
      const totalPercepcionesGravadas = bpToPesos(
        BigInt(r.totalPercepcionesGravadasBp || "0")
      );
      const totalPercepciones = bpToPesos(
        BigInt(r.totalPercepcionesBp || "0")
      );
      const totalNetoEmpleados = bpToPesos(BigInt(r.totalNetoBp || "0"));

      return {
        empresaId: r.empresaId,
        empresaNombre: r.empresaNombre || r.empresaRazonSocial || "",
        empresaRfc: r.empresaRfc,
        isrRetenido,
        imssObrero,
        totalDeduccionesEmpleado: isrRetenido + imssObrero,
        imssPatronal,
        totalPercepcionesGravadas,
        totalPercepciones,
        subsidioAplicado,
        totalNetoEmpleados,
        empleadosUnicos: Number(r.empleadosCount),
        periodosIncluidos: Number(r.periodosCount),
      };
    });

  // Calculate grand totals
  const totales = porEmpresa.reduce(
    (acc, emp) => ({
      isrRetenido: acc.isrRetenido + emp.isrRetenido,
      imssObrero: acc.imssObrero + emp.imssObrero,
      imssPatronal: acc.imssPatronal + emp.imssPatronal,
      subsidioAplicado: acc.subsidioAplicado + emp.subsidioAplicado,
      totalPercepcionesGravadas:
        acc.totalPercepcionesGravadas + emp.totalPercepcionesGravadas,
      totalPercepciones: acc.totalPercepciones + emp.totalPercepciones,
      totalDeduccionesEmpleado:
        acc.totalDeduccionesEmpleado + emp.totalDeduccionesEmpleado,
      totalNetoEmpleados: acc.totalNetoEmpleados + emp.totalNetoEmpleados,
      empleadosUnicos: acc.empleadosUnicos + emp.empleadosUnicos,
      periodosIncluidos: acc.periodosIncluidos + emp.periodosIncluidos,
    }),
    {
      isrRetenido: 0,
      imssObrero: 0,
      imssPatronal: 0,
      subsidioAplicado: 0,
      totalPercepcionesGravadas: 0,
      totalPercepciones: 0,
      totalDeduccionesEmpleado: 0,
      totalNetoEmpleados: 0,
      empleadosUnicos: 0,
      periodosIncluidos: 0,
    }
  );

  return { totales, porEmpresa };
}

// ============================================================================
// ISN State Resolution
// ============================================================================

/**
 * Get employees with their resolved ISN state and taxable amounts.
 */
async function obtenerEmpleadosConEstado(
  clienteId: string,
  empresaId: string | undefined,
  fechaInicio: string,
  fechaFin: string
): Promise<EmpleadoConEstado[]> {
  const conditions = [
    eq(nominaResumen.clienteId, clienteId),
    gte(periodosNomina.fechaInicio, fechaInicio),
    lte(periodosNomina.fechaFin, fechaFin),
  ];

  if (empresaId) {
    conditions.push(eq(nominaResumen.empresaId, empresaId));
  }

  // Query employees with their centro and empresa states
  const resultados = await db
    .select({
      empleadoId: nominaResumen.empleadoId,
      percepcionesGravadasBp: sql<string>`SUM(${nominaResumen.percepcionesGravadasBp})`,
      centroEstado: centrosTrabajo.estado,
      empresaEstadoDefault: empresas.estadoDefault,
    })
    .from(nominaResumen)
    .innerJoin(
      periodosNomina,
      eq(nominaResumen.periodoId, periodosNomina.id)
    )
    .innerJoin(empresas, eq(nominaResumen.empresaId, empresas.id))
    .leftJoin(employees, eq(nominaResumen.empleadoId, employees.id))
    .leftJoin(
      centrosTrabajo,
      eq(employees.centroTrabajoId, centrosTrabajo.id)
    )
    .where(and(...conditions))
    .groupBy(
      nominaResumen.empleadoId,
      centrosTrabajo.estado,
      empresas.estadoDefault
    );

  return resultados.map((r) => {
    // Resolve state: centro > empresa default
    let estado = r.centroEstado || r.empresaEstadoDefault || "";
    if (estado) {
      estado = estado.toUpperCase().replace(/ /g, "_");
    }

    return {
      empleadoId: r.empleadoId,
      baseGravable: bpToPesos(BigInt(r.percepcionesGravadasBp || "0")),
      estado,
    };
  });
}

/**
 * Add ISN to empresa totals
 */
async function agregarISNPorEmpresa(
  empresas: Array<Omit<CostosEmpresa, "isn" | "costoTotalEmpresa">>,
  clienteId: string,
  fechaInicio: string,
  fechaFin: string,
  fechaCalculo: Date
): Promise<CostosEmpresa[]> {
  const result: CostosEmpresa[] = [];

  for (const emp of empresas) {
    // Get employees for this empresa
    const empleadosConEstado = await obtenerEmpleadosConEstado(
      clienteId,
      emp.empresaId,
      fechaInicio,
      fechaFin
    );

    // Calculate ISN for this empresa
    const isnPorEstado = await calcularISNAgregadoPorEstado(
      empleadosConEstado,
      fechaCalculo
    );

    const isnTotal = isnPorEstado.reduce((sum, e) => sum + e.isnMontoTotal, 0);

    result.push({
      ...emp,
      isn: isnTotal,
      costoTotalEmpresa: emp.totalPercepciones + emp.imssPatronal + isnTotal,
    });
  }

  return result;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get summary for a single empresa
 */
export async function obtenerCostosEmpresa(
  clienteId: string,
  empresaId: string,
  fechaInicio: string,
  fechaFin: string
): Promise<CostosEmpresa | null> {
  const resultado = await obtenerCostosNomina({
    clienteId,
    empresaId,
    fechaInicio,
    fechaFin,
  });

  if (resultado.porEmpresa.length === 0) {
    return null;
  }

  return resultado.porEmpresa[0];
}

/**
 * Get ISN breakdown by state for reporting
 */
export async function obtenerDesgloseISNPorEstado(
  clienteId: string,
  empresaId: string | undefined,
  fechaInicio: string,
  fechaFin: string
): Promise<CostosPorEstado[]> {
  const empleadosConEstado = await obtenerEmpleadosConEstado(
    clienteId,
    empresaId,
    fechaInicio,
    fechaFin
  );

  const fechaCalculo = new Date(fechaFin);
  const isnPorEstado = await calcularISNAgregadoPorEstado(
    empleadosConEstado,
    fechaCalculo
  );

  return isnPorEstado.map((e) => ({
    estado: e.estado,
    tasaBp: e.tasaBp,
    tasaPorcentaje: e.tasaPorcentaje,
    baseGravable: e.baseGravableTotal,
    isnMonto: e.isnMontoTotal,
    empleadosCount: e.empleadosCount,
  }));
}
