import { storage } from "./storage";
import type { 
  NominaEmpleadoData,
  LayoutGenerado,
  InsertLayoutGenerado,
  MedioPago
} from "@shared/schema";
import { format } from "date-fns";

interface EmpleadoLayoutData {
  empleadoId: string;
  numeroEmpleado: string;
  nombreCompleto: string;
  cuentaBancaria?: string;
  monto: number;
  conceptos: Array<{
    conceptoId?: string;
    concepto: string;
    monto: number;
  }>;
}

export async function generarLayoutsBancarios(
  nominaId: string,
  generadoPor?: string
): Promise<LayoutGenerado[]> {
  const nomina = await storage.getNomina(nominaId);
  if (!nomina) {
    throw new Error(`Nómina ${nominaId} no encontrada`);
  }

  if (nomina.status !== "approved") {
    throw new Error(`La nómina debe estar aprobada para generar layouts. Estado actual: ${nomina.status}`);
  }

  const empleadosData = nomina.empleadosData as NominaEmpleadoData[];
  if (!empleadosData || empleadosData.length === 0) {
    throw new Error("La nómina no tiene empleados");
  }

  await storage.deleteLayoutsGeneradosByNomina(nominaId);

  const allMediosPago = await storage.getMediosPago();
  const mediosPago = allMediosPago.filter((mp: MedioPago) => mp.empresaId === nomina.empresaId);
  const mediosPagoMap = new Map<string, MedioPago>();
  for (const mp of mediosPago) {
    mediosPagoMap.set(mp.id, mp);
  }

  let defaultMedioPagoId: string | null = null;
  if (mediosPago.length > 0) {
    defaultMedioPagoId = mediosPago[0].id;
  }

  if (!defaultMedioPagoId) {
    throw new Error("No hay medios de pago configurados para esta empresa");
  }

  const layoutsByMedioPago = new Map<string, EmpleadoLayoutData[]>();

  for (const empleado of empleadosData) {
    const medioPagoId = empleado.medioPagoId || defaultMedioPagoId;
    
    if (!mediosPagoMap.has(medioPagoId)) {
      console.warn(`[LAYOUT] Medio de pago ${medioPagoId} no encontrado para empleado ${empleado.numeroEmpleado}, usando default`);
      if (!layoutsByMedioPago.has(defaultMedioPagoId)) {
        layoutsByMedioPago.set(defaultMedioPagoId, []);
      }
    } else {
      if (!layoutsByMedioPago.has(medioPagoId)) {
        layoutsByMedioPago.set(medioPagoId, []);
      }
    }

    const targetMedioPagoId = mediosPagoMap.has(medioPagoId) ? medioPagoId : defaultMedioPagoId;
    
    const allConceptos = [
      ...(empleado.percepciones || []).map(p => ({
        conceptoId: p.conceptoId,
        concepto: p.concepto,
        monto: p.monto,
      })),
      ...(empleado.deducciones || []).map(d => ({
        conceptoId: d.conceptoId,
        concepto: d.concepto,
        monto: -d.monto,
      }))
    ];

    layoutsByMedioPago.get(targetMedioPagoId)!.push({
      empleadoId: empleado.empleadoId,
      numeroEmpleado: empleado.numeroEmpleado,
      nombreCompleto: `${empleado.apellidoPaterno} ${empleado.apellidoMaterno || ""} ${empleado.nombre}`.trim(),
      cuentaBancaria: empleado.cuentaBancaria,
      monto: empleado.netoAPagar,
      conceptos: allConceptos,
    });
  }

  const layoutsGenerados: LayoutGenerado[] = [];
  const fechaHoy = format(new Date(), "yyyyMMdd");

  const layoutEntries = Array.from(layoutsByMedioPago.entries());
  for (const [medioPagoId, empleados] of layoutEntries) {
    const medioPago = mediosPagoMap.get(medioPagoId);
    if (!medioPago) continue;

    const empleadosConMontoPositivo = empleados.filter((e: EmpleadoLayoutData) => e.monto > 0);
    if (empleadosConMontoPositivo.length === 0) continue;

    const totalMonto = empleadosConMontoPositivo.reduce((sum: number, e: EmpleadoLayoutData) => sum + e.monto, 0);
    const totalRegistros = empleadosConMontoPositivo.length;

    const nombreArchivo = `LAYOUT_${medioPago.nombre.replace(/\s+/g, "_").toUpperCase()}_${fechaHoy}.csv`;
    
    const contenido = generarContenidoCSV(empleadosConMontoPositivo, medioPago);

    const layoutData: InsertLayoutGenerado = {
      clienteId: nomina.clienteId,
      empresaId: nomina.empresaId,
      nominaId: nomina.id,
      medioPagoId: medioPagoId,
      bancoLayoutId: nomina.bancoLayoutId || undefined,
      nombreArchivo,
      contenido,
      formato: "csv",
      totalRegistros,
      totalMonto,
      empleadosLayout: empleadosConMontoPositivo,
      generadoPor,
    };

    const layoutGenerado = await storage.createLayoutGenerado(layoutData);
    layoutsGenerados.push(layoutGenerado);
  }

  return layoutsGenerados;
}

function generarContenidoCSV(
  empleados: EmpleadoLayoutData[],
  medioPago: MedioPago
): string {
  const headers = [
    "NUMERO_EMPLEADO",
    "NOMBRE_COMPLETO",
    "CUENTA_BANCARIA",
    "MONTO",
    "CUENTA_DEPOSITO",
  ];

  const rows = empleados.map(emp => [
    emp.numeroEmpleado,
    `"${emp.nombreCompleto}"`,
    emp.cuentaBancaria || "",
    emp.monto.toFixed(2),
    medioPago.cuentaDeposito,
  ]);

  const totalMonto = empleados.reduce((sum: number, e: EmpleadoLayoutData) => sum + e.monto, 0);
  
  let csv = headers.join(",") + "\n";
  csv += rows.map(row => row.join(",")).join("\n");
  csv += "\n";
  csv += `TOTAL,${empleados.length} REGISTROS,,,${totalMonto.toFixed(2)}`;

  return csv;
}

export async function getLayoutsGeneradosForNomina(nominaId: string): Promise<LayoutGenerado[]> {
  return storage.getLayoutsGeneradosByNomina(nominaId);
}

export async function getLayoutContent(layoutId: string): Promise<{ contenido: string; nombreArchivo: string; formato: string } | null> {
  const layout = await storage.getLayoutGenerado(layoutId);
  if (!layout) return null;
  
  return {
    contenido: layout.contenido,
    nombreArchivo: layout.nombreArchivo,
    formato: layout.formato,
  };
}
