import { db } from "../db";
import { conceptosMedioPago, clientes, empresas, categoriasConcepto, type CategoriaConcepto } from "@shared/schema";
import { eq } from "drizzle-orm";

interface ConceptoLegal {
  nombre: string;
  tipo: "percepcion" | "deduccion";
  categoria: CategoriaConcepto;
  formula: string;
  limiteExento: string | null;
  gravableISR: boolean;
  integraSBC: boolean;
  limiteAnual: string | null;
  fundamentoLegal: string;
}

const CONCEPTOS_LEGALES: ConceptoLegal[] = [
  // ============================================================================
  // PERCEPCIONES - SALARIO
  // ============================================================================
  {
    nombre: "Sueldo Base",
    tipo: "percepcion",
    categoria: "salario",
    formula: "SALARIO_DIARIO * DIAS_TRABAJADOS",
    limiteExento: null,
    gravableISR: true,
    integraSBC: true,
    limiteAnual: null,
    fundamentoLegal: "LFT Art. 82-89",
  },
  // ============================================================================
  // PERCEPCIONES - PRESTACIONES DE LEY
  // ============================================================================
  {
    nombre: "Prima Vacacional",
    tipo: "percepcion",
    categoria: "prestaciones_ley",
    formula: "SALARIO_DIARIO * DIAS_VACACIONES * 0.25",
    limiteExento: "15 * UMA_DIARIA",
    gravableISR: true,
    integraSBC: true,
    limiteAnual: null,
    fundamentoLegal: "LFT Art. 80, LISR Art. 93 Fracc. XIV",
  },
  {
    nombre: "Aguinaldo",
    tipo: "percepcion",
    categoria: "prestaciones_ley",
    formula: "SALARIO_DIARIO * DIAS_AGUINALDO",
    limiteExento: "30 * UMA_DIARIA",
    gravableISR: true,
    integraSBC: true,
    limiteAnual: null,
    fundamentoLegal: "LFT Art. 87, LISR Art. 93 Fracc. XIV (mínimo 15 días, proporcional si menos de 1 año)",
  },
  {
    nombre: "Prima Dominical",
    tipo: "percepcion",
    categoria: "prestaciones_ley",
    formula: "SALARIO_DIARIO * DOMINGOS_TRABAJADOS * 0.25",
    limiteExento: "1 * UMA_SEMANAL",
    gravableISR: true,
    integraSBC: true,
    limiteAnual: null,
    fundamentoLegal: "LFT Art. 71, LISR Art. 93 Fracc. I",
  },
  // ============================================================================
  // PERCEPCIONES - HORAS EXTRA
  // ============================================================================
  {
    nombre: "Horas Extra Dobles",
    tipo: "percepcion",
    categoria: "horas_extra",
    formula: "SALARIO_HORA * HORAS_EXTRA_DOBLES * 2",
    limiteExento: "MIN(SALARIO_HORA * MIN(HORAS_EXTRA_DOBLES, 9) * 2, SALARIO_PERIODO * 0.5)",
    gravableISR: true,
    integraSBC: false,
    limiteAnual: null,
    fundamentoLegal: "LFT Art. 67-68, LISR Art. 93 Fracc. I (exento primeras 9 hrs/semana hasta 50% salario)",
  },
  {
    nombre: "Horas Extra Triples",
    tipo: "percepcion",
    categoria: "horas_extra",
    formula: "SALARIO_HORA * HORAS_EXTRA_TRIPLES * 3",
    limiteExento: null,
    gravableISR: true,
    integraSBC: false,
    limiteAnual: null,
    fundamentoLegal: "LFT Art. 68",
  },
  // ============================================================================
  // PERCEPCIONES - PRESTACIONES DE LEY (continuación)
  // ============================================================================
  {
    nombre: "PTU (Reparto de Utilidades)",
    tipo: "percepcion",
    categoria: "prestaciones_ley",
    formula: "PTU_CALCULADO",
    limiteExento: "15 * UMA_DIARIA",
    gravableISR: true,
    integraSBC: false,
    limiteAnual: null,
    fundamentoLegal: "LFT Art. 117-131, LISR Art. 93 Fracc. XIV",
  },
  {
    nombre: "Días Festivos Laborados",
    tipo: "percepcion",
    categoria: "prestaciones_ley",
    formula: "SALARIO_DIARIO * DIAS_FESTIVOS_TRABAJADOS * 2",
    limiteExento: null,
    gravableISR: true,
    integraSBC: true,
    limiteAnual: null,
    fundamentoLegal: "LFT Art. 74-75",
  },
  {
    nombre: "Vacaciones Pagadas",
    tipo: "percepcion",
    categoria: "prestaciones_ley",
    formula: "SALARIO_DIARIO * DIAS_VACACIONES",
    limiteExento: null,
    gravableISR: true,
    integraSBC: true,
    limiteAnual: null,
    fundamentoLegal: "LFT Art. 76-81",
  },
  {
    nombre: "Prima de Antigüedad",
    tipo: "percepcion",
    categoria: "prestaciones_ley",
    formula: "12 * SALARIO_DIARIO * AÑOS_SERVICIO",
    limiteExento: "90 * UMA_DIARIA * AÑOS_SERVICIO",
    gravableISR: true,
    integraSBC: false,
    limiteAnual: null,
    fundamentoLegal: "LFT Art. 162, LISR Art. 93 Fracc. XIII",
  },
  {
    nombre: "Indemnización 3 Meses",
    tipo: "percepcion",
    categoria: "prestaciones_ley",
    formula: "SALARIO_DIARIO * 90",
    limiteExento: "90 * UMA_DIARIA por cada año",
    gravableISR: true,
    integraSBC: false,
    limiteAnual: null,
    fundamentoLegal: "LFT Art. 48, 50, LISR Art. 93 Fracc. XIII",
  },
  {
    nombre: "20 Días por Año",
    tipo: "percepcion",
    categoria: "prestaciones_ley",
    formula: "SALARIO_DIARIO * 20 * AÑOS_SERVICIO",
    limiteExento: "90 * UMA_DIARIA * AÑOS_SERVICIO",
    gravableISR: true,
    integraSBC: false,
    limiteAnual: null,
    fundamentoLegal: "LFT Art. 50, LISR Art. 93 Fracc. XIII",
  },
  // ============================================================================
  // PERCEPCIONES - VALES
  // ============================================================================
  {
    nombre: "Vales de Despensa",
    tipo: "percepcion",
    categoria: "vales",
    formula: "MONTO_VALES",
    limiteExento: "0.40 * UMA_MENSUAL",
    gravableISR: false,
    integraSBC: false,
    limiteAnual: null,
    fundamentoLegal: "LISR Art. 93 Fracc. VIII",
  },
  // ============================================================================
  // PERCEPCIONES - PREVISIÓN SOCIAL
  // ============================================================================
  {
    nombre: "Fondo de Ahorro Empresa",
    tipo: "percepcion",
    categoria: "prevision_social",
    formula: "APORTACION_EMPRESA",
    limiteExento: "13% SALARIO si aportación igual patrón/trabajador",
    gravableISR: false,
    integraSBC: false,
    limiteAnual: "1.3 * UMA_ANUAL",
    fundamentoLegal: "LISR Art. 93 Fracc. XI",
  },
  {
    nombre: "Subsidio al Empleo",
    tipo: "percepcion",
    categoria: "prevision_social",
    formula: "SUBSIDIO_TABLA_2025(BASE_GRAVABLE)",
    limiteExento: "MONTO_TOTAL",
    gravableISR: false,
    integraSBC: false,
    limiteAnual: null,
    fundamentoLegal: "LISR Art. 98",
  },
  // ============================================================================
  // PERCEPCIONES - BONOS E INCENTIVOS
  // ============================================================================
  {
    nombre: "Bono de Puntualidad",
    tipo: "percepcion",
    categoria: "bonos_incentivos",
    formula: "MONTO_BONO",
    limiteExento: "10% SALARIO_PERIODO",
    gravableISR: true,
    integraSBC: false,
    limiteAnual: null,
    fundamentoLegal: "LISR Art. 93 Fracc. I",
  },
  {
    nombre: "Bono de Asistencia",
    tipo: "percepcion",
    categoria: "bonos_incentivos",
    formula: "MONTO_BONO",
    limiteExento: "10% SALARIO_PERIODO",
    gravableISR: true,
    integraSBC: false,
    limiteAnual: null,
    fundamentoLegal: "LISR Art. 93 Fracc. I",
  },
  {
    nombre: "Comisiones",
    tipo: "percepcion",
    categoria: "bonos_incentivos",
    formula: "MONTO_COMISION",
    limiteExento: null,
    gravableISR: true,
    integraSBC: true,
    limiteAnual: null,
    fundamentoLegal: "LFT Art. 285-291",
  },
  {
    nombre: "Gratificación Especial",
    tipo: "percepcion",
    categoria: "bonos_incentivos",
    formula: "MONTO_GRATIFICACION",
    limiteExento: null,
    gravableISR: true,
    integraSBC: true,
    limiteAnual: null,
    fundamentoLegal: "LFT Art. 84",
  },
  // ============================================================================
  // DEDUCCIONES - IMPUESTOS
  // ============================================================================
  {
    nombre: "ISR (Impuesto Sobre la Renta)",
    tipo: "deduccion",
    categoria: "impuestos",
    formula: "TABLA_ISR_2025(BASE_GRAVABLE) - SUBSIDIO_EMPLEO",
    limiteExento: null,
    gravableISR: false,
    integraSBC: false,
    limiteAnual: null,
    fundamentoLegal: "LISR Art. 96, 97, 98",
  },
  {
    nombre: "IMSS Trabajador - Enfermedad y Maternidad",
    tipo: "deduccion",
    categoria: "impuestos",
    formula: "MAX(0, SBC_DIARIO - 3*UMA_DIARIA) * DIAS_PERIODO * 0.004",
    limiteExento: null,
    gravableISR: false,
    integraSBC: false,
    limiteAnual: null,
    fundamentoLegal: "LSS Art. 25, 106",
  },
  {
    nombre: "IMSS Trabajador - Invalidez y Vida",
    tipo: "deduccion",
    categoria: "impuestos",
    formula: "SBC_PERIODO * 0.00625",
    limiteExento: null,
    gravableISR: false,
    integraSBC: false,
    limiteAnual: null,
    fundamentoLegal: "LSS Art. 25, 147",
  },
  {
    nombre: "IMSS Trabajador - Cesantía y Vejez",
    tipo: "deduccion",
    categoria: "impuestos",
    formula: "SBC_PERIODO * 0.01125",
    limiteExento: null,
    gravableISR: false,
    integraSBC: false,
    limiteAnual: null,
    fundamentoLegal: "LSS Art. 25, 168",
  },
  {
    nombre: "IMSS Trabajador Total",
    tipo: "deduccion",
    categoria: "impuestos",
    formula: "IMSS_ENF_MAT + IMSS_INV_VIDA + IMSS_CES_VEJEZ",
    limiteExento: null,
    gravableISR: false,
    integraSBC: false,
    limiteAnual: null,
    fundamentoLegal: "LSS Art. 25",
  },
  // ============================================================================
  // DEDUCCIONES - DESCUENTOS
  // ============================================================================
  {
    nombre: "Infonavit (Crédito Vivienda)",
    tipo: "deduccion",
    categoria: "descuentos",
    formula: "DESCUENTO_INFONAVIT",
    limiteExento: null,
    gravableISR: false,
    integraSBC: false,
    limiteAnual: null,
    fundamentoLegal: "Ley Infonavit Art. 29 Fracc. III",
  },
  {
    nombre: "Fonacot (Crédito)",
    tipo: "deduccion",
    categoria: "descuentos",
    formula: "DESCUENTO_FONACOT",
    limiteExento: null,
    gravableISR: false,
    integraSBC: false,
    limiteAnual: null,
    fundamentoLegal: "Ley Fonacot Art. 97 Fracc. IV",
  },
  {
    nombre: "Pensión Alimenticia",
    tipo: "deduccion",
    categoria: "descuentos",
    formula: "MONTO_PENSION o SALARIO_NETO * PORCENTAJE",
    limiteExento: null,
    gravableISR: false,
    integraSBC: false,
    limiteAnual: null,
    fundamentoLegal: "LFT Art. 110 Fracc. V",
  },
  {
    nombre: "Préstamo Empresa",
    tipo: "deduccion",
    categoria: "descuentos",
    formula: "ABONO_PRESTAMO",
    limiteExento: null,
    gravableISR: false,
    integraSBC: false,
    limiteAnual: null,
    fundamentoLegal: "LFT Art. 110 Fracc. I",
  },
  {
    nombre: "Horas no Laboradas",
    tipo: "deduccion",
    categoria: "descuentos",
    formula: "SALARIO_HORA * HORAS_AUSENTES",
    limiteExento: null,
    gravableISR: false,
    integraSBC: false,
    limiteAnual: null,
    fundamentoLegal: "LFT Art. 82",
  },
  {
    nombre: "Días no Laborados",
    tipo: "deduccion",
    categoria: "descuentos",
    formula: "SALARIO_DIARIO * DIAS_AUSENTES",
    limiteExento: null,
    gravableISR: false,
    integraSBC: false,
    limiteAnual: null,
    fundamentoLegal: "LFT Art. 82",
  },
  {
    nombre: "Anticipo de Sueldo",
    tipo: "deduccion",
    categoria: "descuentos",
    formula: "MONTO_ANTICIPO",
    limiteExento: null,
    gravableISR: false,
    integraSBC: false,
    limiteAnual: null,
    fundamentoLegal: "LFT Art. 110 Fracc. I",
  },
  // ============================================================================
  // DEDUCCIONES - SINDICATO
  // ============================================================================
  {
    nombre: "Cuota Sindical",
    tipo: "deduccion",
    categoria: "sindicato",
    formula: "SALARIO_PERIODO * PORCENTAJE_SINDICAL",
    limiteExento: null,
    gravableISR: false,
    integraSBC: false,
    limiteAnual: null,
    fundamentoLegal: "LFT Art. 110 Fracc. VI",
  },
  // ============================================================================
  // DEDUCCIONES - PREVISIÓN SOCIAL
  // ============================================================================
  {
    nombre: "Fondo de Ahorro Trabajador",
    tipo: "deduccion",
    categoria: "prevision_social",
    formula: "APORTACION_TRABAJADOR",
    limiteExento: null,
    gravableISR: false,
    integraSBC: false,
    limiteAnual: null,
    fundamentoLegal: "LFT Art. 110 Fracc. IV",
  },
  {
    nombre: "Caja de Ahorro",
    tipo: "deduccion",
    categoria: "prevision_social",
    formula: "APORTACION_CAJA",
    limiteExento: null,
    gravableISR: false,
    integraSBC: false,
    limiteAnual: null,
    fundamentoLegal: "LFT Art. 110 Fracc. IV",
  },
];

export async function seedConceptosLegales(): Promise<void> {
  console.log("🌱 Seeding conceptos legales con fórmulas...");

  const [cliente] = await db.select().from(clientes).limit(1);
  const [empresa] = await db.select().from(empresas).limit(1);

  if (!cliente || !empresa) {
    console.log("⚠️ No hay cliente o empresa en el sistema. Saltando seed de conceptos legales.");
    return;
  }

  let insertados = 0;
  let actualizados = 0;
  let omitidos = 0;
  let errores = 0;

  for (const concepto of CONCEPTOS_LEGALES) {
    try {
      const existing = await db
        .select()
        .from(conceptosMedioPago)
        .where(eq(conceptosMedioPago.nombre, concepto.nombre))
        .limit(1);

      if (existing.length > 0) {
        const existingConcepto = existing[0];
        if (existingConcepto.categoria !== concepto.categoria) {
          await db
            .update(conceptosMedioPago)
            .set({ categoria: concepto.categoria })
            .where(eq(conceptosMedioPago.id, existingConcepto.id));
          actualizados++;
        } else {
          omitidos++;
        }
      } else {
        await db.insert(conceptosMedioPago).values({
          clienteId: cliente.id,
          empresaId: empresa.id,
          nombre: concepto.nombre,
          tipo: concepto.tipo,
          categoria: concepto.categoria,
          formula: concepto.formula,
          limiteExento: concepto.limiteExento,
          gravableISR: concepto.gravableISR,
          integraSBC: concepto.integraSBC,
          limiteAnual: concepto.limiteAnual,
          activo: true,
        });
        insertados++;
      }
    } catch (error: any) {
      if (!error.message?.includes("duplicate key")) {
        console.error(`Error insertando concepto ${concepto.nombre}:`, error.message);
        errores++;
      }
    }
  }

  console.log(`✅ Conceptos legales: ${insertados} insertados, ${actualizados} actualizados, ${omitidos} sin cambios, ${errores} errores`);
}

export const VARIABLES_FORMULA = [
  { variable: "SALARIO_DIARIO", descripcion: "Salario diario del empleado", ejemplo: "350.00" },
  { variable: "SALARIO_HORA", descripcion: "Salario por hora (SALARIO_DIARIO / 8)", ejemplo: "43.75" },
  { variable: "SALARIO_PERIODO", descripcion: "Salario del periodo completo", ejemplo: "5,250.00" },
  { variable: "DIAS_TRABAJADOS", descripcion: "Días trabajados en el periodo", ejemplo: "15" },
  { variable: "DIAS_PERIODO", descripcion: "Total de días del periodo de nómina", ejemplo: "15" },
  { variable: "DIAS_TRABAJADOS_ANIO", descripcion: "Días trabajados en el año", ejemplo: "180" },
  { variable: "DIAS_VACACIONES", descripcion: "Días de vacaciones según antigüedad (LFT Art. 76)", ejemplo: "12" },
  { variable: "DIAS_AGUINALDO", descripcion: "Días de aguinaldo a pagar (mínimo 15, proporcional)", ejemplo: "15" },
  { variable: "AÑOS_SERVICIO", descripcion: "Años de antigüedad del empleado", ejemplo: "3" },
  { variable: "UMA_DIARIA", descripcion: "Unidad de Medida y Actualización diaria 2025", ejemplo: "113.14" },
  { variable: "UMA_MENSUAL", descripcion: "UMA mensual (UMA_DIARIA * 30.4)", ejemplo: "3,439.46" },
  { variable: "UMA_ANUAL", descripcion: "UMA anual (UMA_DIARIA * 365)", ejemplo: "41,296.10" },
  { variable: "SALARIO_MINIMO", descripcion: "Salario mínimo diario general 2025", ejemplo: "278.80" },
  { variable: "SALARIO_MINIMO_FRONTERA", descripcion: "Salario mínimo diario zona frontera 2025", ejemplo: "419.88" },
  { variable: "SBC_DIARIO", descripcion: "Salario Base de Cotización diario", ejemplo: "380.50" },
  { variable: "SBC_PERIODO", descripcion: "SBC del periodo (SBC_DIARIO * DIAS_PERIODO)", ejemplo: "5,707.50" },
  { variable: "SDI", descripcion: "Salario Diario Integrado", ejemplo: "385.00" },
  { variable: "BASE_GRAVABLE", descripcion: "Base gravable para ISR del periodo", ejemplo: "4,800.00" },
  { variable: "HORAS_EXTRA_DOBLES", descripcion: "Horas extra dobles trabajadas", ejemplo: "6" },
  { variable: "HORAS_EXTRA_TRIPLES", descripcion: "Horas extra triples trabajadas", ejemplo: "3" },
  { variable: "DOMINGOS_TRABAJADOS", descripcion: "Cantidad de domingos trabajados en el periodo", ejemplo: "2" },
  { variable: "DIAS_FESTIVOS_TRABAJADOS", descripcion: "Días festivos oficiales trabajados", ejemplo: "1" },
  { variable: "MONTO_VALES", descripcion: "Monto de vales de despensa", ejemplo: "1,200.00" },
  { variable: "PORCENTAJE_SINDICAL", descripcion: "Porcentaje de cuota sindical acordado", ejemplo: "0.02" },
  { variable: "DESCUENTO_INFONAVIT", descripcion: "Descuento quincenal por crédito Infonavit", ejemplo: "850.00" },
  { variable: "DESCUENTO_FONACOT", descripcion: "Descuento por crédito Fonacot", ejemplo: "500.00" },
];
