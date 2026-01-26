import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, integer, date, timestamp, jsonb, uuid, boolean, numeric, unique, index, uniqueIndex, check, bigint } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const employees = pgTable("employees", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clienteId: varchar("cliente_id").notNull().references(() => clientes.id, { onDelete: "cascade" }),
  numeroEmpleado: varchar("numero_empleado").notNull(),
  nombre: varchar("nombre").notNull(),
  apellidoPaterno: varchar("apellido_paterno").notNull(),
  apellidoMaterno: varchar("apellido_materno"),
  genero: varchar("genero"),
  fechaNacimiento: date("fecha_nacimiento"),
  curp: varchar("curp"),
  rfc: varchar("rfc"),
  nss: varchar("nss"),
  estadoCivil: varchar("estado_civil"),
  calle: varchar("calle"),
  numeroExterior: varchar("numero_exterior"),
  numeroInterior: varchar("numero_interior"),
  colonia: varchar("colonia"),
  municipio: varchar("municipio"),
  estado: varchar("estado"),
  codigoPostal: varchar("codigo_postal"),
  telefono: varchar("telefono"),
  email: varchar("email"),
  correo: varchar("correo"),
  contactoEmergencia: varchar("contacto_emergencia"),
  parentescoEmergencia: varchar("parentesco_emergencia"),
  telefonoEmergencia: varchar("telefono_emergencia"),
  banco: varchar("banco"),
  clabe: varchar("clabe"),
  sucursal: varchar("sucursal"),
  formaPago: varchar("forma_pago").default("transferencia"),
  periodicidadPago: varchar("periodicidad_pago").default("quincenal"),
  tipoCalculoSalario: varchar("tipo_calculo_salario").default("diario"),
  tipoContrato: varchar("tipo_contrato").default("indeterminado"),
  fechaIngreso: date("fecha_ingreso").notNull(),
  fechaAltaImss: date("fecha_alta_imss"),
  fechaTerminacion: date("fecha_terminacion"),
  reconoceAntiguedad: boolean("reconoce_antiguedad").default(false),
  fechaAntiguedad: date("fecha_antiguedad"),
  modalidadTrabajo: varchar("modalidad_trabajo").default("presencial"),
  lugarTrabajo: varchar("lugar_trabajo"),
  centroTrabajoId: varchar("centro_trabajo_id"), // FK a centros_trabajo
  puesto: varchar("puesto"),
  departamento: varchar("departamento"),
  funciones: text("funciones"),
  diasLaborales: varchar("dias_laborales").default("lunes_viernes"),
  horario: varchar("horario"),
  tipoJornada: varchar("tipo_jornada").default("diurna"),
  tiempoParaAlimentos: varchar("tiempo_para_alimentos").default("30_minutos"),
  diasDescanso: varchar("dias_descanso").default("sabado_domingo"),
  salarioBrutoMensual: numeric("salario_bruto_mensual").notNull(),
  esquemaPago: varchar("esquema_pago").default("tradicional"),
  tipoEsquema: varchar("tipo_esquema").default("NETO"), // 'BRUTO' | 'NETO' - Define si el dato ancla es bruto o neto
  salarioDiarioReal: numeric("salario_diario_real"),
  salarioDiarioNominal: numeric("salario_diario_nominal"),
  salarioDiarioExento: numeric("salario_diario_exento"),
  medioPagoExentoId: varchar("medio_pago_exento_id"), // FK a medios_pago - Medio de pago para salario exento
  sbc: numeric("sbc"),
  sdi: numeric("sdi"),
  sbcBp: bigint("sbc_bp", { mode: "bigint" }), // Salario Base de Cotización en basis points (autoritativo)
  sdiBp: bigint("sdi_bp", { mode: "bigint" }), // Salario Diario Integrado en basis points (autoritativo)
  salarioMensualNetoBp: bigint("salario_mensual_neto_bp", { mode: "bigint" }), // Salario Mensual Neto en basis points
  horasSemanales: integer("horas_semanales").default(48), // Horas semanales (para contrato laboral)
  tablaImss: varchar("tabla_imss").default("fija"),
  diasVacacionesAnuales: integer("dias_vacaciones_anuales").default(12),
  diasVacacionesDisponibles: integer("dias_vacaciones_disponibles").default(12),
  diasVacacionesUsados: integer("dias_vacaciones_usados").default(0),
  diasAguinaldoAdicionales: integer("dias_aguinaldo_adicionales").default(0),
  diasVacacionesAdicionales: integer("dias_vacaciones_adicionales").default(0),
  
  // NUEVO SISTEMA DE PRESTACIONES Y KARDEX
  esquemaPrestacionesId: varchar("esquema_prestaciones_id"), // FK a cat_tablas_prestaciones (NULL = usa regla general)
  saldoVacacionesActual: numeric("saldo_vacaciones_actual", { precision: 10, scale: 2 }).default("0"), // Cache READ-ONLY del saldo (se calcula desde kardex)
  
  creditoInfonavit: varchar("credito_infonavit"),
  numeroFonacot: varchar("numero_fonacot"),
  otrosCreditos: jsonb("otros_creditos").default(sql`'{}'::jsonb`),
  estatus: varchar("estatus").default("activo"),
  clienteProyecto: varchar("cliente_proyecto"),
  observacionesInternas: text("observaciones_internas"),
  timezone: varchar("timezone").default("America/Mexico_City"),
  preferencias: jsonb("preferencias").default(sql`'{}'::jsonb`),
  jefeDirectoId: varchar("jefe_directo_id"),
  empresaId: varchar("empresa_id").notNull().references(() => empresas.id, { onDelete: "cascade" }),
  registroPatronalId: varchar("registro_patronal_id"),
  documentoContratoId: varchar("documento_contrato_id"),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
  puestoId: varchar("puesto_id"), // FK to puestos will be added later via migration
  esquemaContratacion: varchar("esquema_contratacion"),
  lugarNacimiento: varchar("lugar_nacimiento"),
  entidadNacimiento: varchar("entidad_nacimiento"),
  nacionalidad: varchar("nacionalidad"),
  escolaridad: varchar("escolaridad"),
  periodoPrueba: boolean("periodo_prueba").default(false),
  duracionPrueba: integer("duracion_prueba"),
  diaPago: varchar("dia_pago"),
  driveId: text("drive_id"),
  cuenta: numeric("cuenta"),
  grupoNominaId: varchar("grupo_nomina_id"),
  // Portal de Empleados
  portalActivo: boolean("portal_activo").notNull().default(true),
  portalPassword: text("portal_password"), // hashed, null until first login
}, (table) => ({
  clienteEmpresaIdx: index("employees_cliente_empresa_idx").on(table.clienteId, table.empresaId),
}));

// ============================================================================
// MODIFICACIONES DE PERSONAL - Historial de cambios en empleados
// ============================================================================

export const tiposModificacion = [
  "salario",
  "puesto",
  "centro_trabajo",
  "departamento",
  "jefe_directo",
  "cuenta_bancaria",
  "horario",
  "registro_patronal",
  "contrato",
  "estatus",
  "otro"
] as const;
export type TipoModificacion = typeof tiposModificacion[number];

export const modificacionesPersonal = pgTable("modificaciones_personal", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clienteId: varchar("cliente_id").notNull().references(() => clientes.id, { onDelete: "cascade" }),
  empresaId: varchar("empresa_id").notNull().references(() => empresas.id, { onDelete: "cascade" }),
  empleadoId: varchar("empleado_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  
  // Tipo y fecha de la modificación
  tipoModificacion: varchar("tipo_modificacion", { length: 50 }).notNull(), // salario, puesto, centro_trabajo, departamento, jefe_directo, otro
  fechaEfectiva: date("fecha_efectiva").notNull(), // Fecha en que el cambio entra en vigor
  
  // Valores anteriores (JSON para flexibilidad)
  valoresAnteriores: jsonb("valores_anteriores").notNull(),
  
  // Valores nuevos (JSON para flexibilidad)
  valoresNuevos: jsonb("valores_nuevos").notNull(),
  
  // Motivo y justificación
  motivo: text("motivo").notNull(), // promocion, ajuste_salarial, reestructura, transferencia, etc.
  justificacion: text("justificacion"), // Detalles adicionales del cambio
  
  // Documentos de soporte
  documentoUrl: varchar("documento_url", { length: 500 }), // URL del documento en object storage
  
  // Aprobación
  aprobadoPor: varchar("aprobado_por"), // ID del usuario que aprobó
  fechaAprobacion: timestamp("fecha_aprobacion"),
  
  // Estado de la modificación
  estatus: varchar("estatus", { length: 20 }).notNull().default("pendiente"), // pendiente, aprobada, rechazada, aplicada
  notasRechazo: text("notas_rechazo"),
  
  // Auditoría
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
  createdBy: varchar("created_by"), // ID del usuario que creó la modificación
}, (table) => ({
  clienteEmpresaIdx: index("modificaciones_personal_cliente_empresa_idx").on(table.clienteId, table.empresaId),
  empleadoIdx: index("modificaciones_personal_empleado_idx").on(table.empleadoId),
  tipoIdx: index("modificaciones_personal_tipo_idx").on(table.tipoModificacion),
  fechaEfectivaIdx: index("modificaciones_personal_fecha_efectiva_idx").on(table.fechaEfectiva),
  estatusIdx: index("modificaciones_personal_estatus_idx").on(table.estatus),
}));

export type ModificacionPersonal = typeof modificacionesPersonal.$inferSelect;
export const insertModificacionPersonalSchema = createInsertSchema(modificacionesPersonal).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  // Override JSONB fields to accept any JSON object structure
  valoresAnteriores: z.record(z.string(), z.unknown()),
  valoresNuevos: z.record(z.string(), z.unknown()),
});
export type InsertModificacionPersonal = z.infer<typeof insertModificacionPersonalSchema>;

export const departments = pgTable("departments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clienteId: varchar("cliente_id").notNull().references(() => clientes.id, { onDelete: "cascade" }),
  empresaId: varchar("empresa_id").notNull().references(() => empresas.id, { onDelete: "cascade" }),
  name: text("name").notNull().unique(),
}, (table) => ({
  clienteEmpresaIdx: index("departments_cliente_empresa_idx").on(table.clienteId, table.empresaId),
}));

export const gruposNomina = pgTable("grupos_nomina", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clienteId: varchar("cliente_id").notNull().references(() => clientes.id, { onDelete: "cascade" }),
  empresaId: varchar("empresa_id").notNull().references(() => empresas.id, { onDelete: "cascade" }),
  nombre: varchar("nombre").notNull().unique(),
  tipoPeriodo: varchar("tipo_periodo").notNull(), // semanal, catorcenal, quincenal, mensual
  diaInicioSemana: integer("dia_inicio_semana").default(1), // 0=domingo, 1=lunes, ..., 6=sábado
  diaCorte: integer("dia_corte"), // Día del mes para corte mensual/quincenal
  diaPago: integer("dia_pago"), // Día de pago: para semanal/catorcenal es día de semana (0-6), para quincenal/mensual es día del mes (1-31)
  diasCalculo: integer("dias_calculo"), // Días de anticipación para cálculos de pre-nómina (opcional)
  descripcion: text("descripcion"),
  activo: boolean("activo").default(true),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
}, (table) => ({
  clienteEmpresaIdx: index("grupos_nomina_cliente_empresa_idx").on(table.clienteId, table.empresaId),
}));

export const payrollPeriods = pgTable("payroll_periods", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clienteId: varchar("cliente_id").notNull().references(() => clientes.id, { onDelete: "cascade" }),
  empresaId: varchar("empresa_id").notNull().references(() => empresas.id, { onDelete: "cascade" }),
  grupoNominaId: varchar("grupo_nomina_id").notNull().references(() => gruposNomina.id, { onDelete: "cascade" }),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  frequency: text("frequency").notNull(), // semanal, catorcenal, quincenal, mensual
  year: integer("year").notNull(),
  periodNumber: integer("period_number").notNull(), // 1, 2, 3... número del periodo en el año
  status: text("status").notNull().default("pending"), // pending, processing, completed
  createdAt: timestamp("created_at").default(sql`now()`),
}, (table) => ({
  uniquePeriod: unique().on(table.grupoNominaId, table.year, table.periodNumber),
  clienteEmpresaIdx: index("payroll_periods_cliente_empresa_idx").on(table.clienteId, table.empresaId),
}));

export const mediosPago = pgTable("medios_pago", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clienteId: varchar("cliente_id").notNull().references(() => clientes.id, { onDelete: "cascade" }),
  empresaId: varchar("empresa_id").notNull().references(() => empresas.id, { onDelete: "cascade" }),
  nombre: varchar("nombre").notNull().unique(),
  descripcion: text("descripcion"),
  tipoComprobante: varchar("tipo_comprobante").notNull(), // factura, recibo_sin_iva
  cuentaDeposito: varchar("cuenta_deposito").notNull(),
  activo: boolean("activo").default(true),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
}, (table) => ({
  clienteEmpresaIdx: index("medios_pago_cliente_empresa_idx").on(table.clienteId, table.empresaId),
}));

export const tiposConcepto = ["percepcion", "deduccion"] as const;
export type TipoConcepto = typeof tiposConcepto[number];

// Niveles jerárquicos del catálogo de conceptos
export const nivelesConcepto = ["sat", "prevision_social", "bonos", "adicional"] as const;
export type NivelConcepto = typeof nivelesConcepto[number];

// Tipo de catálogo SAT al que pertenece
export const tiposSatCatalogo = ["percepcion", "deduccion", "otro_pago"] as const;
export type TipoSatCatalogo = typeof tiposSatCatalogo[number];

// Categorías predefinidas para conceptos de nómina (percepciones/deducciones)
export const categoriasConcepto = [
  "salario",
  "prevision_social",
  "vales",
  "plan_privado_pensiones",
  "sindicato",
  "horas_extra",
  "prestaciones_ley",
  "bonos_incentivos",
  "descuentos",
  "impuestos",
  "otros"
] as const;
export type CategoriaConcepto = typeof categoriasConcepto[number];

export const conceptosMedioPago = pgTable("conceptos_medio_pago", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clienteId: varchar("cliente_id").notNull().references(() => clientes.id, { onDelete: "cascade" }),
  empresaId: varchar("empresa_id").notNull().references(() => empresas.id, { onDelete: "cascade" }),
  nombre: varchar("nombre", { length: 200 }).notNull().unique(),
  tipo: varchar("tipo", { length: 20 }).notNull(), // percepcion, deduccion
  categoria: varchar("categoria", { length: 50 }).default("otros"), // Categoría para clasificación
  
  // Jerarquía del catálogo unificado
  nivel: varchar("nivel", { length: 30 }).default("adicional"), // sat, prevision_social, adicional
  satClave: varchar("sat_clave", { length: 10 }), // Clave del catálogo SAT (001, 002, etc.)
  satTipoCatalogo: varchar("sat_tipo_catalogo", { length: 20 }), // percepcion, deduccion, otro_pago
  fundamentoLegal: text("fundamento_legal"), // Referencia legal (LFT Art. X, LISR Art. Y)
  
  // Medio de pago (para prestaciones adicionales)
  medioPagoId: varchar("medio_pago_id").references(() => mediosPago.id, { onDelete: "set null" }),
  
  formula: text("formula").notNull(),
  limiteExento: text("limite_exento"), // Puede ser fórmula (ej: "3*UMA") o cantidad
  gravableISR: boolean("gravable_isr").notNull().default(true),
  integraSBC: boolean("integra_sbc").notNull().default(false),
  integraSalarioBase: boolean("integra_salario_base").notNull().default(false), // Si se incluye como parte del salario base
  limiteAnual: text("limite_anual"), // Puede ser fórmula o cantidad
  ordenCalculo: integer("orden_calculo").default(100), // Orden en que se calcula
  activo: boolean("activo").default(true),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
}, (table) => ({
  clienteEmpresaIdx: index("conceptos_medio_pago_cliente_empresa_idx").on(table.clienteId, table.empresaId),
  categoriaIdx: index("conceptos_medio_pago_categoria_idx").on(table.categoria),
  nivelIdx: index("conceptos_medio_pago_nivel_idx").on(table.nivel),
  satClaveIdx: index("conceptos_medio_pago_sat_clave_idx").on(table.satClave),
}));

// Tabla de relación muchos a muchos entre conceptos y medios de pago
export const conceptosMediosPagoRel = pgTable("conceptos_medios_pago_rel", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clienteId: varchar("cliente_id").notNull().references(() => clientes.id, { onDelete: "cascade" }),
  empresaId: varchar("empresa_id").notNull().references(() => empresas.id, { onDelete: "cascade" }),
  conceptoId: varchar("concepto_id").notNull().references(() => conceptosMedioPago.id, { onDelete: "cascade" }),
  medioPagoId: varchar("medio_pago_id").notNull().references(() => mediosPago.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").default(sql`now()`),
}, (table) => ({
  uniqueRelation: unique().on(table.conceptoId, table.medioPagoId),
  clienteEmpresaIdx: index("conceptos_medios_pago_rel_cliente_empresa_idx").on(table.clienteId, table.empresaId),
}));

// ============================================================================
// PLANTILLAS DE NÓMINA - Templates for payroll configurations
// ============================================================================

export const canalesConcepto = ["nomina", "exento"] as const;
export type CanalConcepto = typeof canalesConcepto[number];

export const plantillasNomina = pgTable("plantillas_nomina", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clienteId: varchar("cliente_id").notNull().references(() => clientes.id, { onDelete: "cascade" }),
  empresaId: varchar("empresa_id").notNull().references(() => empresas.id, { onDelete: "cascade" }),
  nombre: varchar("nombre", { length: 200 }).notNull(),
  descripcion: text("descripcion"),
  activo: boolean("activo").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
}, (table) => ({
  clienteEmpresaIdx: index("plantillas_nomina_cliente_empresa_idx").on(table.clienteId, table.empresaId),
  uniqueNombre: unique().on(table.clienteId, table.empresaId, table.nombre),
}));

export const plantillaConceptos = pgTable("plantilla_conceptos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clienteId: varchar("cliente_id").notNull().references(() => clientes.id, { onDelete: "cascade" }),
  empresaId: varchar("empresa_id").notNull().references(() => empresas.id, { onDelete: "cascade" }),
  plantillaId: varchar("plantilla_id").notNull().references(() => plantillasNomina.id, { onDelete: "cascade" }),
  // Legacy: referencia a conceptos_medio_pago (deprecated, use conceptoNominaId)
  conceptoId: varchar("concepto_id").references(() => conceptosMedioPago.id, { onDelete: "cascade" }),
  // Nueva: referencia a conceptos_nomina (tabla unificada)
  conceptoNominaId: varchar("concepto_nomina_id").references(() => conceptosNomina.id, { onDelete: "cascade" }),
  // Legacy: canal de pago (deprecated, usar medioPagoOverrideId)
  canal: varchar("canal", { length: 20 }),
  // Override del medio de pago para esta plantilla específica (si es null, usa el del concepto o nómina normal)
  medioPagoOverrideId: varchar("medio_pago_override_id").references(() => mediosPago.id, { onDelete: "set null" }),
  valorDefault: decimal("valor_default", { precision: 18, scale: 4 }), // Valor predeterminado opcional
  esObligatorio: boolean("es_obligatorio").notNull().default(false), // Si el concepto es obligatorio en esta plantilla
  // Legacy: integra salario base (deprecated, usar integraSalarioBaseOverride)
  integraSalarioBase: boolean("integra_salario_base"),
  // Override de integraSalarioBase para esta plantilla (si es null, usa el valor del concepto)
  integraSalarioBaseOverride: boolean("integra_salario_base_override"),
  orden: integer("orden").notNull().default(0), // Orden de aparición en la plantilla
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
}, (table) => ({
  clienteEmpresaIdx: index("plantilla_conceptos_cliente_empresa_idx").on(table.clienteId, table.empresaId),
  plantillaIdx: index("plantilla_conceptos_plantilla_idx").on(table.plantillaId),
}));

export const attendance = pgTable("attendance", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clienteId: varchar("cliente_id").notNull().references(() => clientes.id, { onDelete: "cascade" }),
  empresaId: varchar("empresa_id").notNull().references(() => empresas.id, { onDelete: "cascade" }),
  employeeId: varchar("employee_id").notNull(),
  centroTrabajoId: varchar("centro_trabajo_id"), // Centro de trabajo donde se registró la asistencia
  turnoId: varchar("turno_id").references(() => turnosCentroTrabajo.id, { onDelete: "set null" }), // Turno del empleado
  date: date("date").notNull(),
  status: text("status").notNull(), // presente, ausente, retardo, vacaciones, permiso, incapacidad
  clockIn: text("clock_in"),
  clockOut: text("clock_out"),
  horasTrabajadas: decimal("horas_trabajadas", { precision: 4, scale: 2 }), // Horas trabajadas calculadas
  motivoAusencia: text("motivo_ausencia"), // Si status es ausencia/permiso, el motivo
  tipoJornada: varchar("tipo_jornada").default("normal"), // normal, festivo, descanso
  notas: text("notas"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
}, (table) => ({
  clienteEmpresaIdx: index("attendance_cliente_empresa_idx").on(table.clienteId, table.empresaId),
}));

// Tipos de incidencias de asistencia
export const tiposIncidenciaAsistencia = ["falta", "retardo", "horas_extra", "horas_descontadas", "incapacidad", "permiso", "prima_dominical", "dia_festivo"] as const;
export type TipoIncidenciaAsistencia = typeof tiposIncidenciaAsistencia[number];

export const tipoIncidenciaLabels: Record<TipoIncidenciaAsistencia, string> = {
  falta: "Falta",
  retardo: "Retardo",
  horas_extra: "Horas Extra",
  horas_descontadas: "Horas Descontadas",
  incapacidad: "Incapacidad",
  permiso: "Permiso",
  prima_dominical: "Prima Dominical",
  dia_festivo: "Día Festivo",
};

// Días festivos oficiales DOF - LFT Artículo 74
// Estos son los días de descanso obligatorio con goce de salario
export const diasFestivosOficialesDOF: { fecha: string; nombre: string; tipo: 'fijo' | 'movil' }[] = [
  // Días fijos
  { fecha: "01-01", nombre: "Año Nuevo", tipo: "fijo" },
  { fecha: "05-01", nombre: "Día del Trabajo", tipo: "fijo" },
  { fecha: "09-16", nombre: "Día de la Independencia", tipo: "fijo" },
  { fecha: "12-25", nombre: "Navidad", tipo: "fijo" },
  // Días móviles (primer lunes de febrero, tercer lunes de marzo, tercer lunes de noviembre)
  // Nota: Estos se calculan dinámicamente
];

// Función para calcular días festivos móviles para un año específico
export function calcularDiasFestivosMoviles(year: number): { fecha: string; nombre: string }[] {
  const result: { fecha: string; nombre: string }[] = [];
  
  // Primer lunes de febrero - Día de la Constitución
  const feb1 = new Date(year, 1, 1);
  const primerLunesFeb = new Date(feb1);
  primerLunesFeb.setDate(1 + ((8 - feb1.getDay()) % 7));
  result.push({ 
    fecha: `${year}-02-${primerLunesFeb.getDate().toString().padStart(2, '0')}`, 
    nombre: "Día de la Constitución" 
  });
  
  // Tercer lunes de marzo - Natalicio de Benito Juárez
  const mar1 = new Date(year, 2, 1);
  const primerLunesMar = new Date(mar1);
  primerLunesMar.setDate(1 + ((8 - mar1.getDay()) % 7));
  const tercerLunesMar = new Date(primerLunesMar);
  tercerLunesMar.setDate(primerLunesMar.getDate() + 14);
  result.push({ 
    fecha: `${year}-03-${tercerLunesMar.getDate().toString().padStart(2, '0')}`, 
    nombre: "Natalicio de Benito Juárez" 
  });
  
  // Tercer lunes de noviembre - Día de la Revolución
  const nov1 = new Date(year, 10, 1);
  const primerLunesNov = new Date(nov1);
  primerLunesNov.setDate(1 + ((8 - nov1.getDay()) % 7));
  const tercerLunesNov = new Date(primerLunesNov);
  tercerLunesNov.setDate(primerLunesNov.getDate() + 14);
  result.push({ 
    fecha: `${year}-11-${tercerLunesNov.getDate().toString().padStart(2, '0')}`, 
    nombre: "Día de la Revolución" 
  });
  
  // 1 de diciembre cada 6 años (cambio de gobierno federal)
  // Próximo: 2024, 2030, 2036...
  if ((year - 2024) % 6 === 0) {
    result.push({ 
      fecha: `${year}-12-01`, 
      nombre: "Transmisión del Poder Ejecutivo Federal" 
    });
  }
  
  return result;
}

// Obtener todos los días festivos de un año
export function obtenerDiasFestivosDelAnio(year: number): { fecha: string; nombre: string }[] {
  const fijos = diasFestivosOficialesDOF
    .filter(d => d.tipo === 'fijo')
    .map(d => ({ fecha: `${year}-${d.fecha}`, nombre: d.nombre }));
  
  const moviles = calcularDiasFestivosMoviles(year);
  
  return [...fijos, ...moviles].sort((a, b) => a.fecha.localeCompare(b.fecha));
}

// Incidencias de asistencia por día con columnas expandibles
// Una fila por empleado por día con columnas para cada tipo de incidencia
export const incidenciasAsistencia = pgTable("incidencias_asistencia", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clienteId: varchar("cliente_id").notNull().references(() => clientes.id, { onDelete: "cascade" }),
  empresaId: varchar("empresa_id").notNull().references(() => empresas.id, { onDelete: "cascade" }),
  employeeId: varchar("employee_id").notNull(),
  centroTrabajoId: varchar("centro_trabajo_id"), // Centro de trabajo (opcional)
  fecha: date("fecha").notNull(), // Fecha del día
  // Columnas individuales por tipo de incidencia
  faltas: integer("faltas").notNull().default(0), // Número de faltas (0 o 1 por día)
  retardos: integer("retardos").notNull().default(0), // Número de retardos (0 o 1 por día)
  horasExtra: decimal("horas_extra", { precision: 10, scale: 2 }).notNull().default("0"), // Horas extra trabajadas
  horasDescontadas: decimal("horas_descontadas", { precision: 10, scale: 2 }).notNull().default("0"), // Horas a descontar
  incapacidades: integer("incapacidades").notNull().default(0), // Días de incapacidad (0 o 1 por día)
  permisos: integer("permisos").notNull().default(0), // Días de permiso (0 o 1 por día)
  vacaciones: integer("vacaciones").notNull().default(0), // Días de vacaciones (0 o 1 por día)
  diasDomingo: integer("dias_domingo").notNull().default(0), // Días domingo trabajados (0 o 1 por día) - Prima Dominical 25%
  diasFestivos: integer("dias_festivos").notNull().default(0), // Días festivos trabajados (0 o 1 por día) - LFT Art. 74, pago doble
  notas: text("notas"), // Observaciones del día
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
}, (table) => ({
  // Índice único: un registro por empleado por fecha por centro
  employeeDateIdx: sql`CREATE UNIQUE INDEX IF NOT EXISTS incidencias_empleado_fecha_centro_idx ON ${table} (employee_id, fecha, COALESCE(centro_trabajo_id, ''))`,
  clienteEmpresaIdx: index("incidencias_asistencia_cliente_empresa_idx").on(table.clienteId, table.empresaId),
}));

// ============================================================================
// MÓDULOS - Catálogo de módulos del sistema
// ============================================================================

export const modulos = pgTable("modulos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  codigo: varchar("codigo").notNull().unique(), // "nomina", "asistencia", etc.
  nombre: varchar("nombre").notNull(), // "Nómina", "Asistencia", etc.
  descripcion: text("descripcion"),
  icono: varchar("icono"), // Nombre del icono de lucide-react
  activo: boolean("activo").notNull().default(true),
  orden: integer("orden").notNull().default(0), // Para ordenar en el menú
  
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export type Modulo = typeof modulos.$inferSelect;
export const insertModuloSchema = createInsertSchema(modulos).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertModulo = z.infer<typeof insertModuloSchema>;

// ============================================================================
// USERS - Usuarios del sistema (MaxTalent y Clientes)
// ============================================================================

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  
  // Tipo de usuario y relación con cliente
  tipoUsuario: varchar("tipo_usuario").notNull().default("cliente"), // "maxtalent" | "cliente" | "empleado"
  clienteId: varchar("cliente_id").references(() => clientes.id), // Para tipo "cliente" o "empleado"
  
  // Rol del usuario dentro de su alcance
  // - "user": Usuario normal con permisos granulares
  // - "cliente_admin": Admin de cliente con acceso total a su cliente
  role: varchar("role").notNull().default("user"), // "user" | "cliente_admin"
  
  // Super Admin - permite bypass de permisos con auditoría completa (GLOBAL)
  isSuperAdmin: boolean("is_super_admin").notNull().default(false),
  
  // Información adicional
  nombre: text("nombre"),
  email: varchar("email"),
  activo: boolean("activo").notNull().default(true),

  // === PORTAL DE EMPLEADOS ===
  // Vinculación con empleado (solo para tipoUsuario = "empleado")
  empleadoId: varchar("empleado_id").references(() => employees.id, { onDelete: "set null" }),
  // Control de acceso al portal
  portalActivo: boolean("portal_activo").notNull().default(false),
  // Último acceso al portal (para auditoría)
  ultimoAccesoPortal: timestamp("ultimo_acceso_portal"),
  // Requiere cambio de contraseña (para primer login)
  requiereCambioPassword: boolean("requiere_cambio_password").notNull().default(false),

  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// ============================================================================
// USUARIOS PERMISOS - Sistema granular de permisos multi-nivel
// ============================================================================

export const usuariosPermisos = pgTable("usuarios_permisos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  usuarioId: varchar("usuario_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Tipo de scope del permiso
  scopeTipo: varchar("scope_tipo").notNull(), // "cliente" | "empresa" | "centro_trabajo" | "modulo"
  
  // Referencias opcionales según el scope_tipo
  clienteId: varchar("cliente_id").references(() => clientes.id),
  empresaId: varchar("empresa_id").references(() => empresas.id),
  centroTrabajoId: varchar("centro_trabajo_id").references(() => centrosTrabajo.id),
  moduloId: varchar("modulo_id").references(() => modulos.id),
  
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
}, (table) => ({
  // Índices para queries eficientes
  usuarioScopeIdx: index("usuarios_permisos_usuario_scope_idx").on(table.usuarioId, table.scopeTipo),
  clienteIdx: index("usuarios_permisos_cliente_idx").on(table.clienteId).where(sql`${table.scopeTipo} = 'cliente'`),
  empresaIdx: index("usuarios_permisos_empresa_idx").on(table.empresaId).where(sql`${table.scopeTipo} = 'empresa'`),
  centroIdx: index("usuarios_permisos_centro_idx").on(table.centroTrabajoId).where(sql`${table.scopeTipo} = 'centro_trabajo'`),
  moduloIdx: index("usuarios_permisos_modulo_idx").on(table.usuarioId, table.moduloId).where(sql`${table.scopeTipo} = 'modulo'`),
  
  // UNIQUE parciales para evitar duplicados por scope (usando uniqueIndex en lugar de unique)
  uniqueCliente: uniqueIndex("unique_usuario_cliente").on(table.usuarioId, table.clienteId).where(sql`${table.scopeTipo} = 'cliente' AND ${table.clienteId} IS NOT NULL`),
  uniqueEmpresa: uniqueIndex("unique_usuario_empresa").on(table.usuarioId, table.empresaId).where(sql`${table.scopeTipo} = 'empresa' AND ${table.empresaId} IS NOT NULL`),
  uniqueCentro: uniqueIndex("unique_usuario_centro").on(table.usuarioId, table.centroTrabajoId).where(sql`${table.scopeTipo} = 'centro_trabajo' AND ${table.centroTrabajoId} IS NOT NULL`),
  uniqueModulo: uniqueIndex("unique_usuario_modulo").on(table.usuarioId, table.moduloId).where(sql`${table.scopeTipo} = 'modulo' AND ${table.moduloId} IS NOT NULL`),
  
  // CHECK constraints para validar que el campo correcto esté filled según scopeTipo
  checkClienteScope: check("check_cliente_scope", sql`(${table.scopeTipo} = 'cliente' AND ${table.clienteId} IS NOT NULL) OR ${table.scopeTipo} != 'cliente'`),
  checkEmpresaScope: check("check_empresa_scope", sql`(${table.scopeTipo} = 'empresa' AND ${table.empresaId} IS NOT NULL) OR ${table.scopeTipo} != 'empresa'`),
  checkCentroScope: check("check_centro_scope", sql`(${table.scopeTipo} = 'centro_trabajo' AND ${table.centroTrabajoId} IS NOT NULL) OR ${table.scopeTipo} != 'centro_trabajo'`),
  checkModuloScope: check("check_modulo_scope", sql`(${table.scopeTipo} = 'modulo' AND ${table.moduloId} IS NOT NULL) OR ${table.scopeTipo} != 'modulo'`),
}));

export type UsuarioPermiso = typeof usuariosPermisos.$inferSelect;
export const insertUsuarioPermisoSchema = createInsertSchema(usuariosPermisos).omit({
  id: true,
  createdAt: true,
}).extend({
  scopeTipo: z.enum(["cliente", "empresa", "centro_trabajo", "modulo"]),
});
export type InsertUsuarioPermiso = z.infer<typeof insertUsuarioPermisoSchema>;

// ============================================================================
// ADMIN AUDIT LOGS - Registro de acciones de Super Admin
// ============================================================================

export const adminAuditLogs = pgTable("admin_audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Quién realizó la acción
  adminUserId: varchar("admin_user_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  adminUsername: varchar("admin_username").notNull(), // Denormalizado para auditoría
  
  // Qué acción se realizó
  action: varchar("action").notNull(), // "create_user", "update_user", "delete_user", "assign_permission", "remove_permission"
  resourceType: varchar("resource_type").notNull(), // "user", "permission", etc.
  resourceId: varchar("resource_id"), // ID del recurso afectado
  
  // Trazabilidad de tenant (para cumplimiento multi-tenant)
  targetClienteId: varchar("target_cliente_id").references(() => clientes.id),
  targetEmpresaId: varchar("target_empresa_id").references(() => empresas.id),
  targetCentroTrabajoId: varchar("target_centro_trabajo_id").references(() => centrosTrabajo.id),
  
  // Detalles de la acción
  details: jsonb("details"), // JSON con detalles específicos de la acción
  previousValue: jsonb("previous_value"), // Valor anterior (para updates)
  newValue: jsonb("new_value"), // Valor nuevo
  
  // Metadata
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
}, (table) => ({
  // Índices para búsquedas eficientes
  adminUserIdx: index("admin_audit_logs_admin_user_idx").on(table.adminUserId),
  actionIdx: index("admin_audit_logs_action_idx").on(table.action),
  resourceIdx: index("admin_audit_logs_resource_idx").on(table.resourceType, table.resourceId),
  createdAtIdx: index("admin_audit_logs_created_at_idx").on(table.createdAt),
  // Índice compuesto para trazabilidad por tenant
  tenantTraceIdx: index("admin_audit_logs_tenant_trace_idx").on(table.targetClienteId, table.targetEmpresaId, table.targetCentroTrabajoId),
}));

export type AdminAuditLog = typeof adminAuditLogs.$inferSelect;
export const insertAdminAuditLogSchema = createInsertSchema(adminAuditLogs).omit({
  id: true,
  createdAt: true,
});
export type InsertAdminAuditLog = z.infer<typeof insertAdminAuditLogSchema>;

export const configurationChangeLogs = pgTable("configuration_change_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  changeType: text("change_type").notNull(), // 'isr_table', 'subsidio_table', 'imss_rates', 'uma', etc.
  periodicidad: text("periodicidad"), // 'diaria', 'semanal', etc. - null for non-ISR changes
  changedBy: text("changed_by").notNull(), // Usuario que hizo el cambio
  changeDate: timestamp("change_date").notNull().default(sql`now()`),
  previousValue: jsonb("previous_value").notNull(), // Valor anterior (JSON)
  newValue: jsonb("new_value").notNull(), // Valor nuevo (JSON)
  description: text("description"), // Descripción del cambio
});

// Módulo Legal - Casos de despidos/renuncias (Bajas)
// Estados válidos del proceso de baja (sin detonante - el proceso inicia en cálculo)
export const legalCaseStatuses = ["calculo", "documentacion", "firma", "tramites", "entrega", "completado", "demanda"] as const;
export type LegalCaseStatus = typeof legalCaseStatuses[number];

// Categorías de bajas
export const bajaCategories = ["voluntaria", "involuntaria", "especial"] as const;
export type BajaCategory = typeof bajaCategories[number];

// Tipos de bajas por categoría
export const bajaTypes = {
  voluntaria: [
    "renuncia_voluntaria",
    "mutuo_acuerdo", 
    "jubilacion_pension",
    "renuncia_con_causa"
  ],
  involuntaria: [
    "despido_justificado",
    "despido_injustificado",
    "fin_de_contrato",
    "cierre_empresa",
    "inhabilitacion_legal"
  ],
  especial: [
    "fallecimiento",
    "incapacidad_permanente",
    "baja_administrativa"
  ]
} as const;

// Etiquetas legibles para tipos de bajas
export const bajaTypeLabels: Record<string, string> = {
  // Voluntarias
  renuncia_voluntaria: "Renuncia voluntaria",
  mutuo_acuerdo: "Mutuo acuerdo",
  jubilacion_pension: "Jubilación / Pensión",
  renuncia_con_causa: "Renuncia con causa (por falta del patrón)",
  // Involuntarias
  despido_justificado: "Despido justificado",
  despido_injustificado: "Despido injustificado",
  fin_de_contrato: "Fin de contrato",
  cierre_empresa: "Cierre de empresa / Reestructura",
  inhabilitacion_legal: "Inhabilitación legal",
  // Especiales
  fallecimiento: "Fallecimiento",
  incapacidad_permanente: "Incapacidad permanente",
  baja_administrativa: "Baja administrativa",
};

// Etiquetas de categorías
export const bajaCategoryLabels: Record<BajaCategory, string> = {
  voluntaria: "Voluntaria",
  involuntaria: "Involuntaria",
  especial: "Especial"
};

export const legalCases = pgTable("legal_cases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clienteId: varchar("cliente_id").notNull().references(() => clientes.id, { onDelete: "cascade" }),
  empresaId: varchar("empresa_id").notNull().references(() => empresas.id, { onDelete: "cascade" }),
  employeeId: varchar("employee_id"), // null para simulaciones
  employeeName: text("employee_name").notNull(), // Nombre del empleado
  bajaCategory: text("baja_category").notNull().default("voluntaria"), // 'voluntaria', 'involuntaria', 'especial'
  bajaType: text("baja_type").notNull().default("renuncia_voluntaria"), // Subtipo específico según categoría
  caseType: text("case_type").notNull(), // DEPRECATED: mantener por compatibilidad
  reason: text("reason").notNull(), // Motivo del despido/renuncia
  status: text("status").notNull().default("calculo"), // 'calculo', 'documentacion', 'firma', 'tramites', 'entrega', 'completado', 'demanda'
  mode: text("mode").notNull(), // 'simulacion' o 'real'
  startDate: date("start_date").notNull(), // Fecha de inicio del caso
  endDate: date("end_date"), // Fecha de terminación de la relación laboral
  notes: text("notes"), // Notas adicionales
  // Datos para cálculo de finiquito
  salarioDiario: decimal("salario_diario", { precision: 10, scale: 2 }), // Salario diario integrado
  empleadoFechaInicio: date("empleado_fecha_inicio"), // Fecha de inicio laboral del empleado
  calculoAprobado: text("calculo_aprobado").default("false"), // 'true' o 'false' - indica si el cálculo fue aprobado
  calculoData: jsonb("calculo_data"), // Desglose completo del cálculo aprobado
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
}, (table) => ({
  clienteEmpresaIdx: index("legal_cases_cliente_empresa_idx").on(table.clienteId, table.empresaId),
}));

// Conceptos especiales para bajas (descuentos o adicionales)
export const bajaSpecialConcepts = pgTable("baja_special_concepts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clienteId: varchar("cliente_id").notNull().references(() => clientes.id, { onDelete: "cascade" }),
  empresaId: varchar("empresa_id").notNull().references(() => empresas.id, { onDelete: "cascade" }),
  legalCaseId: varchar("legal_case_id").notNull(), // Vinculado al caso de baja
  conceptType: text("concept_type").notNull(), // 'descuento' o 'adicional'
  description: text("description").notNull(), // Descripción del concepto
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(), // Monto
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
}, (table) => ({
  clienteEmpresaIdx: index("baja_special_concepts_cliente_empresa_idx").on(table.clienteId, table.empresaId),
}));

// Liquidaciones y Finiquitos
export const settlements = pgTable("settlements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clienteId: varchar("cliente_id").notNull().references(() => clientes.id, { onDelete: "cascade" }),
  empresaId: varchar("empresa_id").notNull().references(() => empresas.id, { onDelete: "cascade" }),
  legalCaseId: varchar("legal_case_id"), // null para simulaciones independientes
  settlementType: text("settlement_type").notNull(), // 'liquidacion_injustificada', 'liquidacion_justificada', 'finiquito'
  employeeName: text("employee_name"), // Para simulaciones
  salary: decimal("salary", { precision: 10, scale: 2 }).notNull(),
  startDate: date("start_date").notNull(), // Fecha de inicio laboral
  endDate: date("end_date").notNull(), // Fecha de terminación
  yearsWorked: decimal("years_worked", { precision: 5, scale: 2 }).notNull(),
  concepts: jsonb("concepts").notNull(), // Desglose de conceptos calculados
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(),
  mode: text("mode").notNull(), // 'simulacion' o 'real'
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
}, (table) => ({
  clienteEmpresaIdx: index("settlements_cliente_empresa_idx").on(table.clienteId, table.empresaId),
}));

// Demandas laborales - Etapas del proceso legal
export const lawsuitStages = ["conciliacion", "contestacion", "desahogo", "alegatos", "sentencia", "cerrado"] as const;
export type LawsuitStage = typeof lawsuitStages[number];

export const lawsuits = pgTable("lawsuits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clienteId: varchar("cliente_id").notNull().references(() => clientes.id, { onDelete: "cascade" }),
  empresaId: varchar("empresa_id").notNull().references(() => empresas.id, { onDelete: "cascade" }),
  title: text("title").notNull(), // Título de la demanda
  employeeName: text("employee_name").notNull(), // Nombre del empleado demandante
  legalCaseId: varchar("legal_case_id"), // Vincula con un caso legal de bajas si existe
  stage: text("stage").notNull().default("conciliacion"), // Etapa actual del proceso
  description: text("description"), // Descripción detallada de la demanda
  documentUrl: text("document_url"), // URL del documento escaneado de la demanda
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
}, (table) => ({
  clienteEmpresaIdx: index("lawsuits_cliente_empresa_idx").on(table.clienteId, table.empresaId),
}));

export const insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Bulk import schema - only 5 required fields, rest are optional with defaults
export const bulkInsertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  // Make salarioBrutoMensual and numeroEmpleado optional for bulk import
  // Accept both string and number for salarioBrutoMensual
  salarioBrutoMensual: z.union([z.string(), z.number()]).optional().nullable().transform(v => v?.toString() ?? null),
  numeroEmpleado: z.string().optional().nullable(),
});

export const insertDepartmentSchema = createInsertSchema(departments).omit({
  id: true,
});

export const tiposPeriodoNomina = ["semanal", "catorcenal", "quincenal", "mensual"] as const;
export type TipoPeriodoNomina = typeof tiposPeriodoNomina[number];

export const insertGrupoNominaSchema = createInsertSchema(gruposNomina).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  tipoPeriodo: z.enum(tiposPeriodoNomina),
  employeeIds: z.array(z.string()).optional(), // Array de IDs de empleados a asignar al grupo
  clienteId: z.string().optional(), // Optional - backend will inject from session
  empresaId: z.string().optional(), // Optional - backend will inject from session
});

export const updateGrupoNominaSchema = insertGrupoNominaSchema.partial();

export const insertPayrollPeriodSchema = createInsertSchema(payrollPeriods).omit({
  id: true,
});

export const tiposComprobante = ["factura", "recibo_sin_iva"] as const;
export type TipoComprobante = typeof tiposComprobante[number];

export const insertMedioPagoSchema = createInsertSchema(mediosPago).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  tipoComprobante: z.enum(tiposComprobante),
});

export const updateMedioPagoSchema = insertMedioPagoSchema.partial();

export const insertConceptoMedioPagoSchema = createInsertSchema(conceptosMedioPago).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  tipo: z.enum(tiposConcepto),
  nivel: z.enum(nivelesConcepto).optional(),
  satTipoCatalogo: z.enum(tiposSatCatalogo).nullish(),
  mediosPagoIds: z.array(z.string()).optional(), // IDs de medios de pago a vincular (legacy)
});

export const updateConceptoMedioPagoSchema = insertConceptoMedioPagoSchema.partial();

// Plantillas de Nómina schemas
export const insertPlantillaNominaSchema = createInsertSchema(plantillasNomina).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updatePlantillaNominaSchema = insertPlantillaNominaSchema.partial();

export const insertPlantillaConceptoSchema = createInsertSchema(plantillaConceptos).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updatePlantillaConceptoSchema = insertPlantillaConceptoSchema.partial();

export const insertAttendanceSchema = createInsertSchema(attendance).omit({
  id: true,
});

export const insertIncidenciaAsistenciaSchema = createInsertSchema(incidenciasAsistencia).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateIncidenciaAsistenciaSchema = insertIncidenciaAsistenciaSchema.partial();

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

export const insertConfigurationChangeLogSchema = createInsertSchema(configurationChangeLogs).omit({
  id: true,
  changeDate: true,
});

export const insertLegalCaseSchema = createInsertSchema(legalCases).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateLegalCaseSchema = insertLegalCaseSchema.partial();

export const insertSettlementSchema = createInsertSchema(settlements).omit({
  id: true,
  createdAt: true,
});

export const insertBajaSpecialConceptSchema = createInsertSchema(bajaSpecialConcepts).omit({
  id: true,
  createdAt: true,
});

export const insertLawsuitSchema = createInsertSchema(lawsuits).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  stage: z.enum(lawsuitStages).default("conciliacion"),
});

// Separate update schema without defaults to prevent overwriting existing values
export const updateLawsuitSchema = insertLawsuitSchema.extend({
  stage: z.enum(lawsuitStages).optional(),
}).partial();

// Proceso de Altas (Contratación)
export const hiringStages = ["oferta", "documentos", "contrato", "alta_imss", "onboarding", "completado", "cancelado"] as const;
export type HiringStage = typeof hiringStages[number];

export const hiringStageLabels: Record<HiringStage, string> = {
  oferta: "Carta Oferta",
  documentos: "Recolección Documentos",
  contrato: "Firma de Contrato",
  alta_imss: "Alta IMSS",
  onboarding: "Onboarding",
  completado: "Completado",
  cancelado: "No Completado"
};

export const hiringProcess = pgTable("hiring_process", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clienteId: varchar("cliente_id").notNull().references(() => clientes.id, { onDelete: "cascade" }),
  empresaId: varchar("empresa_id").notNull().references(() => empresas.id, { onDelete: "cascade" }),
  nombre: text("nombre").notNull(), // Nombre del candidato
  apellidoPaterno: text("apellido_paterno").notNull(), // Apellido paterno
  apellidoMaterno: text("apellido_materno"), // Apellido materno (opcional)
  position: text("position").notNull().default(""), // Campo legacy - usar puestoId
  department: text("department").notNull().default(""), // Campo legacy - usar departamentoId
  puestoId: varchar("puesto_id").references(() => puestos.id, { onDelete: "set null" }), // Puesto ofrecido (FK)
  departamentoId: varchar("departamento_id").references(() => departamentos.id, { onDelete: "set null" }), // Departamento (FK)
  proposedSalary: decimal("proposed_salary", { precision: 10, scale: 2 }).notNull(), // Salario propuesto
  startDate: date("start_date").notNull(), // Fecha propuesta de inicio
  endDate: date("end_date"), // Fecha de fin (para contratos temporales, por obra o prueba)
  stage: text("stage").notNull().default("oferta"), // Etapa actual del proceso
  status: text("status").notNull().default("activo"), // 'activo', 'cancelado', 'completado'
  contractType: text("contract_type").notNull(), // Tipo de contrato
  contractDuration: text("contract_duration"), // Duración del contrato (para contratos temporales o por obra)
  diasPrueba: integer("dias_prueba"), // Días de prueba (30, 60, 90)
  // Datos personales del candidato
  email: text("email"),
  phone: text("phone"),
  rfc: varchar("rfc", { length: 13 }),
  curp: varchar("curp", { length: 18 }),
  nss: varchar("nss", { length: 11 }),
  genero: varchar("genero", { length: 1 }), // H o M extraído del CURP
  fechaNacimiento: date("fecha_nacimiento"), // Extraída del CURP
  lugarNacimiento: varchar("lugar_nacimiento"), // Estado de nacimiento extraído del CURP
  // Domicilio
  calle: varchar("calle"),
  numeroExterior: varchar("numero_exterior"),
  numeroInterior: varchar("numero_interior"),
  colonia: varchar("colonia"),
  municipio: varchar("municipio"),
  estado: varchar("estado"),
  codigoPostal: varchar("codigo_postal", { length: 5 }),
  // Contacto de emergencia
  contactoEmergencia: varchar("contacto_emergencia"),
  parentescoEmergencia: varchar("parentesco_emergencia"),
  telefonoEmergencia: varchar("telefono_emergencia", { length: 10 }),
  // Datos bancarios
  banco: varchar("banco"),
  cuenta: varchar("cuenta"), // Número de cuenta bancaria
  clabe: varchar("clabe", { length: 18 }),
  sucursal: varchar("sucursal"),
  formaPago: varchar("forma_pago"),
  // Centro de trabajo
  centroTrabajo: varchar("centro_trabajo"), // Campo legacy - usar centroTrabajoId
  centroTrabajoId: varchar("centro_trabajo_id").references(() => centrosTrabajo.id, { onDelete: "set null" }), // Centro de trabajo (FK)
  // Registro patronal
  registroPatronalId: varchar("registro_patronal_id").references(() => registrosPatronales.id, { onDelete: "set null" }), // Registro patronal (FK)
  // Empleado creado (cuando se completa el alta)
  empleadoId: varchar("empleado_id").references(() => employees.id, { onDelete: "set null" }), // NULL hasta que se complete el alta
  // Datos de la oferta
  offerLetterSent: text("offer_letter_sent").default("false"), // 'true' o 'false'
  offerAcceptedDate: date("offer_accepted_date"),
  // Documentos requeridos
  documentsChecklist: jsonb("documents_checklist"), // Lista de documentos recibidos
  // IMSS
  imssNumber: text("imss_number"), // Número de seguro social
  imssRegistrationDate: date("imss_registration_date"),
  // Contrato
  contractSignedDate: date("contract_signed_date"),
  // Onboarding
  onboardingCompletedDate: date("onboarding_completed_date"),
  notes: text("notes"), // Notas adicionales
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
}, (table) => ({
  clienteEmpresaIdx: index("hiring_process_cliente_empresa_idx").on(table.clienteId, table.empresaId),
}));

export const insertHiringProcessSchema = createInsertSchema(hiringProcess).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  stage: z.enum(hiringStages).default("oferta"),
});

export const updateHiringProcessSchema = insertHiringProcessSchema.extend({
  stage: z.enum(hiringStages).optional(),
}).partial();

export type HiringProcess = typeof hiringProcess.$inferSelect;
export type InsertHiringProcess = z.infer<typeof insertHiringProcessSchema>;

export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type Department = typeof departments.$inferSelect;
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;
export type GrupoNomina = typeof gruposNomina.$inferSelect;
export type InsertGrupoNomina = z.infer<typeof insertGrupoNominaSchema>;
export type PayrollPeriod = typeof payrollPeriods.$inferSelect;
export type InsertPayrollPeriod = z.infer<typeof insertPayrollPeriodSchema>;
export type MedioPago = typeof mediosPago.$inferSelect;
export type InsertMedioPago = z.infer<typeof insertMedioPagoSchema>;
export type ConceptoMedioPago = typeof conceptosMedioPago.$inferSelect;
export type InsertConceptoMedioPago = z.infer<typeof insertConceptoMedioPagoSchema>;
export type ConceptoMedioPagoRel = typeof conceptosMediosPagoRel.$inferSelect;

// Tipo extendido con relaciones para frontend
export type ConceptoMedioPagoWithRelations = ConceptoMedioPago & {
  mediosPagoIds: string[];
};

// Plantillas de Nómina types
export type PlantillaNomina = typeof plantillasNomina.$inferSelect;
export type InsertPlantillaNomina = z.infer<typeof insertPlantillaNominaSchema>;
export type PlantillaConcepto = typeof plantillaConceptos.$inferSelect;
export type InsertPlantillaConcepto = z.infer<typeof insertPlantillaConceptoSchema>;

// Tipo extendido para plantilla con sus conceptos
export type PlantillaNominaWithConceptos = PlantillaNomina & {
  conceptos: (PlantillaConcepto & {
    concepto: ConceptoNomina;
  })[];
};

export type Attendance = typeof attendance.$inferSelect;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type IncidenciaAsistencia = typeof incidenciasAsistencia.$inferSelect;
export type InsertIncidenciaAsistencia = z.infer<typeof insertIncidenciaAsistenciaSchema>;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

// Public user type - excludes sensitive fields like password
export type PublicUser = Omit<User, 'password'>;

// Schema for updating user - only allows specific non-sensitive fields
export const updateUserSchema = z.object({
  nombre: z.string().optional(),
  email: z.string().email().optional(),
  tipoUsuario: z.enum(["maxtalent", "cliente"]).optional(),
  clienteId: z.string().nullable().optional(),
  role: z.enum(["user", "cliente_admin"]).optional(),
  activo: z.boolean().optional(),
  isSuperAdmin: z.boolean().optional(),
});
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type ConfigurationChangeLog = typeof configurationChangeLogs.$inferSelect;
export type InsertConfigurationChangeLog = z.infer<typeof insertConfigurationChangeLogSchema>;
export type BajaSpecialConcept = typeof bajaSpecialConcepts.$inferSelect;
export type InsertBajaSpecialConcept = z.infer<typeof insertBajaSpecialConceptSchema>;
export type LegalCase = typeof legalCases.$inferSelect;
export type InsertLegalCase = z.infer<typeof insertLegalCaseSchema>;
export type Settlement = typeof settlements.$inferSelect;
export type InsertSettlement = z.infer<typeof insertSettlementSchema>;
export type Lawsuit = typeof lawsuits.$inferSelect;
export type InsertLawsuit = z.infer<typeof insertLawsuitSchema>;

// Empresas (Companies)
// ============================================================================
// CLIENTES - Clientes de MaxTalent (agrupan múltiples empresas)
// ============================================================================

export const clientes = pgTable("clientes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nombreComercial: text("nombre_comercial").notNull(),
  razonSocial: text("razon_social").notNull(),
  rfc: varchar("rfc", { length: 13 }).notNull().unique(),
  activo: boolean("activo").notNull().default(true),
  fechaAlta: date("fecha_alta").notNull().default(sql`CURRENT_DATE`),
  
  // Datos de contacto
  telefono: varchar("telefono"),
  email: varchar("email"),
  
  // Notas
  notas: text("notas"),

  // API Key for MCP/omnichannel integrations
  apiKey: varchar("api_key", { length: 64 }).unique(),
  apiKeyCreatedAt: timestamp("api_key_created_at"),

  // Esquema de prestaciones (vacaciones) por defecto para todos los empleados del cliente
  esquemaPrestacionesId: varchar("esquema_prestaciones_id"),

  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export type Cliente = typeof clientes.$inferSelect;
export const insertClienteSchema = createInsertSchema(clientes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertCliente = z.infer<typeof insertClienteSchema>;
export const updateClienteSchema = insertClienteSchema.partial();

// ============================================================================
// EMPRESAS - Empresas de los clientes
// ============================================================================

export const empresas = pgTable("empresas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clienteId: varchar("cliente_id").references(() => clientes.id, { onDelete: "cascade" }),
  razonSocial: text("razon_social").notNull(),
  nombreComercial: text("nombre_comercial"),
  rfc: varchar("rfc", { length: 13 }).notNull().unique(),
  regimenFiscal: text("regimen_fiscal"),
  actividadEconomica: text("actividad_economica"),
  // Domicilio fiscal
  calle: text("calle"),
  numeroExterior: varchar("numero_exterior"),
  numeroInterior: varchar("numero_interior"),
  colonia: text("colonia"),
  municipio: text("municipio"),
  estado: text("estado"),
  codigoPostal: varchar("codigo_postal", { length: 5 }),
  pais: varchar("pais").default("México"),
  // Datos de contacto
  telefono: varchar("telefono"),
  email: varchar("email"),
  sitioWeb: text("sitio_web"),
  // Representante legal
  representanteLegal: text("representante_legal"),
  rfcRepresentante: varchar("rfc_representante", { length: 13 }),
  curpRepresentante: varchar("curp_representante", { length: 18 }),
  // Información adicional
  fechaConstitucion: date("fecha_constitucion"),
  fechaInicioOperaciones: date("fecha_inicio_operaciones"),
  logoUrl: text("logo_url"),
  notas: text("notas"),
  // Plantilla de nómina favorita/default
  defaultPlantillaNominaId: varchar("default_plantilla_nomina_id"), // FK a plantillas_nomina (validado en app layer por orden de declaración)
  // Esquema de prestaciones (vacaciones) - sobreescribe el del cliente si se asigna
  esquemaPrestacionesId: varchar("esquema_prestaciones_id"),
  estatus: varchar("estatus").default("activa"), // activa, suspendida, inactiva
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const insertEmpresaSchema = createInsertSchema(empresas).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateEmpresaSchema = insertEmpresaSchema.partial();

export type Empresa = typeof empresas.$inferSelect;
export type InsertEmpresa = z.infer<typeof insertEmpresaSchema>;

// Registros Patronales (Employer Registrations)
// Clase de riesgo IMSS: I (mínimo), II (bajo), III (medio), IV (alto), V (máximo)
export const clasesRiesgo = ["I", "II", "III", "IV", "V"] as const;
export type ClaseRiesgo = typeof clasesRiesgo[number];

export const registrosPatronales = pgTable("registros_patronales", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  empresaId: varchar("empresa_id").notNull().references(() => empresas.id, { onDelete: "cascade" }),
  numeroRegistroPatronal: varchar("numero_registro_patronal", { length: 11 }).notNull().unique(), // 11 caracteres IMSS
  nombreCentroTrabajo: text("nombre_centro_trabajo").notNull(),
  // Domicilio del centro de trabajo
  calle: text("calle"),
  numeroExterior: varchar("numero_exterior"),
  numeroInterior: varchar("numero_interior"),
  colonia: text("colonia"),
  municipio: text("municipio"),
  estado: text("estado"),
  codigoPostal: varchar("codigo_postal", { length: 5 }),
  // Clasificación de riesgo IMSS
  claseRiesgo: varchar("clase_riesgo").notNull().default("I"), // I, II, III, IV, V
  primaRiesgo: decimal("prima_riesgo", { precision: 5, scale: 4 }).default("0.5000"), // Porcentaje (ej: 0.5000 = 0.5%)
  divisionEconomica: text("division_economica"),
  grupoActividad: text("grupo_actividad"),
  fraccionActividad: text("fraccion_actividad"),
  descripcionActividad: text("descripcion_actividad"),
  // Información de registro
  fechaRegistro: date("fecha_registro"),
  fechaBaja: date("fecha_baja"),
  estatus: varchar("estatus").default("activo"), // activo, suspendido, baja
  notas: text("notas"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const insertRegistroPatronalSchema = createInsertSchema(registrosPatronales).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  claseRiesgo: z.enum(clasesRiesgo).default("I"),
});

export const updateRegistroPatronalSchema = insertRegistroPatronalSchema.partial();

export type RegistroPatronal = typeof registrosPatronales.$inferSelect;
export type InsertRegistroPatronal = z.infer<typeof insertRegistroPatronalSchema>;

// Credenciales de Sistemas (System Credentials)
// Tipos de sistemas: imss_escritorio_virtual, sipare, infonavit, fonacot
export const tiposSistema = [
  "imss_escritorio_virtual",
  "sipare", 
  "infonavit_portal_empresarial",
  "fonacot",
  "idse",
  "sua",
  "otro"
] as const;
export type TipoSistema = typeof tiposSistema[number];

export const credencialesSistemas = pgTable("credenciales_sistemas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  empresaId: varchar("empresa_id").references(() => empresas.id, { onDelete: "cascade" }),
  registroPatronalId: varchar("registro_patronal_id").references(() => registrosPatronales.id, { onDelete: "cascade" }),
  tipoSistema: varchar("tipo_sistema").notNull(), // imss_escritorio_virtual, sipare, infonavit, fonacot, etc.
  nombreSistema: text("nombre_sistema").notNull(), // Nombre descriptivo
  // Credenciales - SEGURIDAD: NO almacenamos contraseñas directamente
  // Solo guardamos referencias a Replit Secrets que el usuario debe crear manualmente
  usuario: text("usuario"), // Usuario, RFC, o identificador del sistema
  passwordSecretKey: text("password_secret_key"), // OBLIGATORIO: Nombre del secret en Replit (ej: "EMPRESA_ABC_IMSS_PASSWORD")
  // e.firma (FIEL) para sistemas que la requieren
  efirmaRfc: varchar("efirma_rfc", { length: 13 }),
  efirmaCertPath: text("efirma_cert_path"), // Ruta al archivo .cer en object storage
  efirmaKeyPath: text("efirma_key_path"), // Ruta al archivo .key en object storage
  efirmaPasswordSecretKey: text("efirma_password_secret_key"), // Nombre del secret para contraseña de e.firma
  // Información adicional
  url: text("url"), // URL del sistema
  descripcion: text("descripcion"),
  fechaUltimoAcceso: timestamp("fecha_ultimo_acceso"),
  fechaVencimiento: date("fecha_vencimiento"), // Para certificados o contraseñas con vencimiento
  notasSeguridad: text("notas_seguridad"),
  estatus: varchar("estatus").default("activo"), // activo, vencido, inactivo
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const insertCredencialSistemaSchema = createInsertSchema(credencialesSistemas).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  tipoSistema: z.enum(tiposSistema),
});

export const updateCredencialSistemaSchema = insertCredencialSistemaSchema.partial();

export type CredencialSistema = typeof credencialesSistemas.$inferSelect;
export type InsertCredencialSistema = z.infer<typeof insertCredencialSistemaSchema>;

// Centros de Trabajo (Work Centers)
// Centros de trabajo independientes de registros patronales
export const centrosTrabajo = pgTable("centros_trabajo", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clienteId: varchar("cliente_id").notNull().references(() => clientes.id, { onDelete: "cascade" }),
  empresaId: varchar("empresa_id").notNull().references(() => empresas.id, { onDelete: "cascade" }),
  registroPatronalId: varchar("registro_patronal_id").references(() => registrosPatronales.id, { onDelete: "set null" }), // Opcional
  nombre: text("nombre").notNull(),
  descripcion: text("descripcion"),
  // Domicilio
  calle: text("calle"),
  numeroExterior: varchar("numero_exterior"),
  numeroInterior: varchar("numero_interior"),
  colonia: text("colonia"),
  municipio: text("municipio"),
  estado: text("estado"),
  codigoPostal: varchar("codigo_postal", { length: 5 }),
  // Información adicional
  capacidadEmpleados: integer("capacidad_empleados"), // Capacidad máxima de empleados
  telefono: varchar("telefono"),
  email: varchar("email"),
  responsable: text("responsable"), // Nombre del responsable del centro
  estatus: varchar("estatus").default("activo"), // activo, inactivo
  notas: text("notas"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const insertCentroTrabajoSchema = createInsertSchema(centrosTrabajo).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  clienteId: z.string().optional(), // Backend auto-derives from empresaId
});

export const updateCentroTrabajoSchema = insertCentroTrabajoSchema.partial();

export type CentroTrabajo = typeof centrosTrabajo.$inferSelect;
export type InsertCentroTrabajo = z.infer<typeof insertCentroTrabajoSchema>;

// Turnos de Centro de Trabajo
// Un centro de trabajo puede tener múltiples turnos (matutino, vespertino, nocturno, etc.)
export const turnosCentroTrabajo = pgTable("turnos_centro_trabajo", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  centroTrabajoId: varchar("centro_trabajo_id").notNull().references(() => centrosTrabajo.id, { onDelete: "cascade" }),
  nombre: varchar("nombre").notNull(), // "Matutino", "Vespertino", "Nocturno", "Turno A", etc.
  descripcion: text("descripcion"),
  // Horarios
  horaInicio: varchar("hora_inicio").notNull(), // Formato HH:MM (ej: "09:00")
  horaFin: varchar("hora_fin").notNull(), // Formato HH:MM (ej: "18:00")
  minutosToleranciaEntrada: integer("minutos_tolerancia_entrada").default(10),
  minutosToleranciaComida: integer("minutos_tolerancia_comida").default(60),
  // Días laborales
  trabajaLunes: boolean("trabaja_lunes").default(true),
  trabajaMartes: boolean("trabaja_martes").default(true),
  trabajaMiercoles: boolean("trabaja_miercoles").default(true),
  trabajaJueves: boolean("trabaja_jueves").default(true),
  trabajaViernes: boolean("trabaja_viernes").default(true),
  trabajaSabado: boolean("trabaja_sabado").default(false),
  trabajaDomingo: boolean("trabaja_domingo").default(false),
  // Estado
  estatus: varchar("estatus").default("activo"), // activo, inactivo
  notas: text("notas"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const insertTurnoCentroTrabajoSchema = createInsertSchema(turnosCentroTrabajo).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateTurnoCentroTrabajoSchema = insertTurnoCentroTrabajoSchema.partial();

export type TurnoCentroTrabajo = typeof turnosCentroTrabajo.$inferSelect;
export type InsertTurnoCentroTrabajo = z.infer<typeof insertTurnoCentroTrabajoSchema>;

// Departamentos
export const departamentos = pgTable("departamentos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  empresaId: varchar("empresa_id").notNull().references(() => empresas.id, { onDelete: "cascade" }),
  nombre: varchar("nombre").notNull(),
  descripcion: text("descripcion"),
  responsable: varchar("responsable"),
  telefono: varchar("telefono"),
  email: varchar("email"),
  presupuestoAnual: numeric("presupuesto_anual", { precision: 15, scale: 2 }),
  numeroEmpleados: integer("numero_empleados").default(0),
  estatus: varchar("estatus").default("activo"),
  notas: text("notas"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const insertDepartamentoSchema = createInsertSchema(departamentos).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  presupuestoAnual: z.string().transform(val => val === "" ? null : val).optional().nullable(),
});

export const updateDepartamentoSchema = insertDepartamentoSchema.partial();

export type Departamento = typeof departamentos.$inferSelect;
export type InsertDepartamento = z.infer<typeof insertDepartamentoSchema>;

// Asignación de Empleados a Turnos de Centros de Trabajo
export const empleadosCentrosTrabajo = pgTable("empleados_centros_trabajo", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  empleadoId: varchar("empleado_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  centroTrabajoId: varchar("centro_trabajo_id").notNull().references(() => centrosTrabajo.id, { onDelete: "cascade" }),
  turnoId: varchar("turno_id").notNull().references(() => turnosCentroTrabajo.id, { onDelete: "cascade" }), // Turno asignado
  fechaInicio: date("fecha_inicio").notNull(), // Fecha de inicio en este turno
  fechaFin: date("fecha_fin"), // Fecha de fin (null si es asignación actual)
  esPrincipal: boolean("es_principal").default(true), // Si es el turno principal del empleado
  // Horario específico para este empleado (puede sobrescribir el horario del turno)
  horaEntradaEspecifica: varchar("hora_entrada_especifica"), // Si tiene horario especial
  horaSalidaEspecifica: varchar("hora_salida_especifica"),
  notas: text("notas"),
  estatus: varchar("estatus").default("activo"), // activo, temporal, inactivo
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const insertEmpleadoCentroTrabajoSchema = createInsertSchema(empleadosCentrosTrabajo).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateEmpleadoCentroTrabajoSchema = insertEmpleadoCentroTrabajoSchema.partial();

export type EmpleadoCentroTrabajo = typeof empleadosCentrosTrabajo.$inferSelect;
export type InsertEmpleadoCentroTrabajo = z.infer<typeof insertEmpleadoCentroTrabajoSchema>;

// Horas Extras
export const tiposHoraExtra = ["dobles", "triples"] as const;
export type TipoHoraExtra = typeof tiposHoraExtra[number];

export const estatusHoraExtra = ["pendiente", "autorizada", "rechazada", "pagada"] as const;
export type EstatusHoraExtra = typeof estatusHoraExtra[number];

export const horasExtras = pgTable("horas_extras", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clienteId: varchar("cliente_id").notNull().references(() => clientes.id, { onDelete: "cascade" }),
  empresaId: varchar("empresa_id").notNull().references(() => empresas.id, { onDelete: "cascade" }),
  empleadoId: varchar("empleado_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  centroTrabajoId: varchar("centro_trabajo_id").references(() => centrosTrabajo.id, { onDelete: "set null" }),
  attendanceId: varchar("attendance_id").references(() => attendance.id, { onDelete: "set null" }), // Vinculado a asistencia
  fecha: date("fecha").notNull(),
  tipoHoraExtra: varchar("tipo_hora_extra").notNull().default("dobles"), // dobles (200%), triples (300%)
  cantidadHoras: decimal("cantidad_horas", { precision: 4, scale: 2 }).notNull(), // Horas trabajadas extra
  horaInicio: varchar("hora_inicio"), // Hora de inicio de horas extras
  horaFin: varchar("hora_fin"), // Hora de fin de horas extras
  motivo: text("motivo"), // Motivo de las horas extras
  autorizadoPor: varchar("autorizado_por"), // ID del supervisor que autorizó
  fechaAutorizacion: timestamp("fecha_autorizacion"),
  estatus: varchar("estatus").default("pendiente"), // pendiente, autorizada, rechazada, pagada
  montoCalculado: decimal("monto_calculado", { precision: 10, scale: 2 }), // Monto calculado a pagar
  notas: text("notas"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
}, (table) => ({
  clienteEmpresaIdx: index("horas_extras_cliente_empresa_idx").on(table.clienteId, table.empresaId),
}));

export const insertHoraExtraSchema = createInsertSchema(horasExtras).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  tipoHoraExtra: z.enum(tiposHoraExtra).default("dobles"),
  estatus: z.enum(estatusHoraExtra).default("pendiente"),
});

export const updateHoraExtraSchema = insertHoraExtraSchema.partial();

export type HoraExtra = typeof horasExtras.$inferSelect;
export type InsertHoraExtra = z.infer<typeof insertHoraExtraSchema>;

// ============================================================================
// MÓDULO REPSE (Registro de Prestadoras de Servicios Especializados)
// ============================================================================

// Clientes para REPSE
export const clientesREPSE = pgTable("clientes_repse", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clienteId: varchar("cliente_id").notNull().references(() => clientes.id, { onDelete: "cascade" }),
  empresaId: varchar("empresa_id").notNull().references(() => empresas.id, { onDelete: "cascade" }),
  razonSocial: varchar("razon_social").notNull(),
  rfc: varchar("rfc").notNull(),
  nombreComercial: varchar("nombre_comercial"),
  giro: varchar("giro"),
  calle: varchar("calle"),
  numeroExterior: varchar("numero_exterior"),
  numeroInterior: varchar("numero_interior"),
  colonia: varchar("colonia"),
  municipio: varchar("municipio"),
  estado: varchar("estado"),
  codigoPostal: varchar("codigo_postal"),
  telefono: varchar("telefono"),
  email: varchar("email"),
  contactoPrincipal: varchar("contacto_principal"),
  puestoContacto: varchar("puesto_contacto"),
  telefonoContacto: varchar("telefono_contacto"),
  emailContacto: varchar("email_contacto"),
  estatus: varchar("estatus").default("activo"), // activo, inactivo
  notas: text("notas"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
}, (table) => ({
  clienteEmpresaIdx: index("clientes_repse_cliente_empresa_idx").on(table.clienteId, table.empresaId),
}));

export const insertClienteREPSESchema = createInsertSchema(clientesREPSE).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateClienteREPSESchema = insertClienteREPSESchema.partial();

export type ClienteREPSE = typeof clientesREPSE.$inferSelect;
export type InsertClienteREPSE = z.infer<typeof insertClienteREPSESchema>;

// Registros REPSE de la Empresa
export const estatusREPSE = ["vigente", "suspendido", "vencido", "en_tramite"] as const;
export type EstatusREPSE = typeof estatusREPSE[number];

export const registrosREPSE = pgTable("registros_repse", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clienteId: varchar("cliente_id").notNull().references(() => clientes.id, { onDelete: "cascade" }),
  empresaId: varchar("empresa_id").notNull().references(() => empresas.id, { onDelete: "cascade" }),
  numeroRegistro: varchar("numero_registro").notNull(), // Número de registro REPSE
  fechaEmision: date("fecha_emision").notNull(),
  fechaVencimiento: date("fecha_vencimiento").notNull(), // 3 años después de emisión
  estatus: varchar("estatus").default("vigente"), // vigente, suspendido, vencido, en_tramite
  tipoRegistro: varchar("tipo_registro").default("servicios_especializados"), // servicios_especializados, obras_especializadas
  archivoUrl: text("archivo_url"), // URL del archivo PDF en Object Storage
  archivoNombre: varchar("archivo_nombre"), // Nombre original del archivo
  alertaVencimiento90: boolean("alerta_vencimiento_90").default(false), // Alert enviada 90 días antes
  alertaVencimiento60: boolean("alerta_vencimiento_60").default(false), // Alert enviada 60 días antes
  alertaVencimiento30: boolean("alerta_vencimiento_30").default(false), // Alert enviada 30 días antes
  notas: text("notas"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
}, (table) => ({
  clienteEmpresaIdx: index("registros_repse_cliente_empresa_idx").on(table.clienteId, table.empresaId),
}));

export const insertRegistroREPSESchema = createInsertSchema(registrosREPSE).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  estatus: z.enum(estatusREPSE).default("vigente"),
});

export const updateRegistroREPSESchema = insertRegistroREPSESchema.partial();

export type RegistroREPSE = typeof registrosREPSE.$inferSelect;
export type InsertRegistroREPSE = z.infer<typeof insertRegistroREPSESchema>;

// Contratos REPSE con Clientes
export const estatusContratoREPSE = ["vigente", "finalizado", "suspendido", "cancelado"] as const;
export type EstatusContratoREPSE = typeof estatusContratoREPSE[number];

export const contratosREPSE = pgTable("contratos_repse", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clienteId: varchar("cliente_id").notNull().references(() => clientes.id, { onDelete: "cascade" }),
  empresaId: varchar("empresa_id").notNull().references(() => empresas.id, { onDelete: "cascade" }),
  registroREPSEId: varchar("registro_repse_id").notNull().references(() => registrosREPSE.id, { onDelete: "cascade" }),
  clienteREPSEId: varchar("cliente_repse_id").notNull().references(() => clientesREPSE.id, { onDelete: "cascade" }),
  numeroContrato: varchar("numero_contrato").notNull(),
  fechaInicio: date("fecha_inicio").notNull(),
  fechaFin: date("fecha_fin"),
  serviciosEspecializados: text("servicios_especializados").notNull(), // Descripción de servicios prestados
  objetoContrato: text("objeto_contrato"),
  montoContrato: decimal("monto_contrato", { precision: 12, scale: 2 }),
  archivoUrl: text("archivo_url"), // URL del contrato PDF
  archivoNombre: varchar("archivo_nombre"),
  notificadoIMSS: boolean("notificado_imss").default(false),
  numeroAvisoIMSS: varchar("numero_aviso_imss"),
  fechaNotificacionIMSS: date("fecha_notificacion_imss"),
  estatus: varchar("estatus").default("vigente"), // vigente, finalizado, suspendido, cancelado
  notas: text("notas"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
}, (table) => ({
  clienteEmpresaIdx: index("contratos_repse_cliente_empresa_idx").on(table.clienteId, table.empresaId),
}));

export const insertContratoREPSESchema = createInsertSchema(contratosREPSE).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  estatus: z.enum(estatusContratoREPSE).default("vigente"),
  // Transform empty strings to null for optional date fields
  fechaFin: z.string().transform(val => val === "" ? null : val).nullable().optional(),
  fechaNotificacionIMSS: z.string().transform(val => val === "" ? null : val).nullable().optional(),
});

export const updateContratoREPSESchema = insertContratoREPSESchema.partial();

export type ContratoREPSE = typeof contratosREPSE.$inferSelect;
export type InsertContratoREPSE = z.infer<typeof insertContratoREPSESchema>;

// Asignación de Personal a Contratos REPSE
export const asignacionesPersonalREPSE = pgTable("asignaciones_personal_repse", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clienteId: varchar("cliente_id").notNull().references(() => clientes.id, { onDelete: "cascade" }),
  empresaId: varchar("empresa_id").notNull().references(() => empresas.id, { onDelete: "cascade" }),
  contratoREPSEId: varchar("contrato_repse_id").notNull().references(() => contratosREPSE.id, { onDelete: "cascade" }),
  empleadoId: varchar("empleado_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  fechaAsignacion: date("fecha_asignacion").notNull(),
  fechaFinAsignacion: date("fecha_fin_asignacion"), // Null si es asignación actual
  puestoFuncion: varchar("puesto_funcion").notNull(), // Puesto o función especializada
  descripcionActividades: text("descripcion_actividades"),
  salarioAsignado: decimal("salario_asignado", { precision: 10, scale: 2 }), // Salario para esta asignación
  estatus: varchar("estatus").default("activo"), // activo, finalizado, suspendido
  notas: text("notas"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
}, (table) => ({
  clienteEmpresaIdx: index("asignaciones_personal_repse_cliente_empresa_idx").on(table.clienteId, table.empresaId),
}));

export const insertAsignacionPersonalREPSESchema = createInsertSchema(asignacionesPersonalREPSE).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateAsignacionPersonalREPSESchema = insertAsignacionPersonalREPSESchema.partial();

export type AsignacionPersonalREPSE = typeof asignacionesPersonalREPSE.$inferSelect;
export type InsertAsignacionPersonalREPSE = z.infer<typeof insertAsignacionPersonalREPSESchema>;

// Avisos REPSE - Obligaciones de presentación periódica y por eventos
export const tiposAvisoREPSE = [
  "REPORTE_TRIMESTRAL",
  "NUEVO_CONTRATO", 
  "MODIFICACION_CONTRATO",
  "TERMINACION_CONTRATO",
  "CAMBIO_EMPRESA"
] as const;
export type TipoAvisoREPSE = typeof tiposAvisoREPSE[number];

export const estatusAvisoREPSE = ["PENDIENTE", "PRESENTADO", "VENCIDO"] as const;
export type EstatusAvisoREPSE = typeof estatusAvisoREPSE[number];

export const avisosREPSE = pgTable("avisos_repse", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clienteId: varchar("cliente_id").notNull().references(() => clientes.id, { onDelete: "cascade" }),
  tipo: varchar("tipo").notNull(), // REPORTE_TRIMESTRAL, NUEVO_CONTRATO, etc.
  empresaId: varchar("empresa_id").notNull().references(() => empresas.id, { onDelete: "cascade" }),
  contratoREPSEId: varchar("contrato_repse_id").references(() => contratosREPSE.id, { onDelete: "cascade" }), // Null para reportes trimestrales o cambios de empresa
  descripcion: text("descripcion").notNull(), // Descripción del aviso
  fechaEvento: date("fecha_evento"), // Fecha del evento que genera el aviso (firma, modificación, etc.)
  fechaLimite: date("fecha_limite").notNull(), // Fecha límite para presentar el aviso
  estatus: varchar("estatus").default("PENDIENTE"), // PENDIENTE, PRESENTADO, VENCIDO
  fechaPresentacion: date("fecha_presentacion"), // Cuándo se presentó el aviso
  trimestre: integer("trimestre"), // 1, 2, 3, 4 (solo para reportes trimestrales)
  año: integer("año"), // Año del trimestre (solo para reportes trimestrales)
  archivoUrl: text("archivo_url"), // URL del archivo de evidencia
  archivoNombre: varchar("archivo_nombre"), // Nombre del archivo
  numeroFolioSTPS: varchar("numero_folio_stps"), // Número de folio asignado por la STPS al presentar
  notas: text("notas"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
}, (table) => ({
  clienteEmpresaIdx: index("avisos_repse_cliente_empresa_idx").on(table.clienteId, table.empresaId),
}));

export const insertAvisoREPSESchema = createInsertSchema(avisosREPSE).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  tipo: z.enum(tiposAvisoREPSE),
  estatus: z.enum(estatusAvisoREPSE).default("PENDIENTE"),
});

export const updateAvisoREPSESchema = insertAvisoREPSESchema.partial();

export type AvisoREPSE = typeof avisosREPSE.$inferSelect;
export type InsertAvisoREPSE = z.infer<typeof insertAvisoREPSESchema>;

// ============================================================================
// CRÉDITOS Y DESCUENTOS
// ============================================================================

// Tipos de crédito legal
export const tiposCreditoLegal = [
  "INFONAVIT",
  "FONACOT",
  "PENSION_ALIMENTICIA",
  "EMBARGO",
] as const;

export const tiposCalculoInfonavit = [
  "CUOTA_FIJA",
  "PORCENTAJE",
  "FACTOR_DESCUENTO",
] as const;

export const estadosCredito = [
  "ACTIVO",
  "TERMINADO",
  "SUSPENDIDO",
  "CANCELADO",
] as const;

// Créditos Legales (INFONAVIT, FONACOT, Pensión Alimenticia, Embargos)
export const creditosLegales = pgTable("creditos_legales", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clienteId: varchar("cliente_id").notNull().references(() => clientes.id, { onDelete: "cascade" }),
  empresaId: varchar("empresa_id").notNull().references(() => empresas.id, { onDelete: "cascade" }),
  empleadoId: varchar("empleado_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  tipoCredito: varchar("tipo_credito").notNull(), // INFONAVIT, FONACOT, PENSION_ALIMENTICIA, EMBARGO
  
  // Campos INFONAVIT
  numeroCredito: varchar("numero_credito"), // Número de crédito INFONAVIT o FONACOT
  tipoCalculoInfonavit: varchar("tipo_calculo_infonavit"), // CUOTA_FIJA, PORCENTAJE, FACTOR_DESCUENTO
  valorDescuento: numeric("valor_descuento"), // Valor según tipo de cálculo (cuota, porcentaje o factor)
  
  // Campos generales
  montoTotal: numeric("monto_total"), // Monto total del crédito (FONACOT, préstamos)
  montoPorPeriodo: numeric("monto_por_periodo"), // Monto a descontar por periodo
  saldoRestante: numeric("saldo_restante"), // Saldo pendiente
  
  // Fechas
  fechaInicio: date("fecha_inicio").notNull(),
  fechaTermino: date("fecha_termino"),
  
  // Pensión alimenticia / Embargo
  beneficiario: varchar("beneficiario"), // Nombre del beneficiario
  documentoLegal: text("documento_legal"), // Referencia al documento legal
  archivoUrl: text("archivo_url"), // URL del archivo de evidencia
  
  // Control
  estado: varchar("estado").notNull().default("ACTIVO"), // ACTIVO, TERMINADO, SUSPENDIDO, CANCELADO
  descuentoAutomatico: boolean("descuento_automatico").default(true), // Si se descuenta automáticamente en nómina
  notas: text("notas"),
  
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
}, (table) => ({
  clienteEmpresaIdx: index("creditos_legales_cliente_empresa_idx").on(table.clienteId, table.empresaId),
}));

export const insertCreditoLegalSchema = createInsertSchema(creditosLegales).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  tipoCredito: z.enum(tiposCreditoLegal),
  estado: z.enum(estadosCredito).default("ACTIVO"),
  tipoCalculoInfonavit: z.enum(tiposCalculoInfonavit).optional(),
});

export const updateCreditoLegalSchema = insertCreditoLegalSchema.partial();

export type CreditoLegal = typeof creditosLegales.$inferSelect;
export type InsertCreditoLegal = z.infer<typeof insertCreditoLegalSchema>;

// Préstamos Internos
export const prestamosInternos = pgTable("prestamos_internos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clienteId: varchar("cliente_id").notNull().references(() => clientes.id, { onDelete: "cascade" }),
  empresaId: varchar("empresa_id").notNull().references(() => empresas.id, { onDelete: "cascade" }),
  empleadoId: varchar("empleado_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  
  // Datos del préstamo
  montoTotal: numeric("monto_total").notNull(),
  plazo: integer("plazo").notNull(), // Plazo en periodos de pago
  tipoPlazo: varchar("tipo_plazo").notNull().default("QUINCENAS"), // QUINCENAS, MESES
  montoPorPeriodo: numeric("monto_por_periodo").notNull(),
  saldoPendiente: numeric("saldo_pendiente").notNull(),
  
  // Fechas
  fechaOtorgamiento: date("fecha_otorgamiento").notNull(),
  fechaInicio: date("fecha_inicio").notNull(), // Fecha de inicio de descuentos
  fechaEstimadaTermino: date("fecha_estimada_termino").notNull(),
  fechaTermino: date("fecha_termino"), // Fecha real de terminación
  
  // Control de descuento automático
  descuentoAutomatico: boolean("descuento_automatico").default(true),
  
  // Estado
  estado: varchar("estado").notNull().default("ACTIVO"), // ACTIVO, TERMINADO, SUSPENDIDO, CANCELADO
  
  // Notas y detalles
  concepto: text("concepto"),
  notas: text("notas"),
  autorizadoPor: varchar("autorizado_por"), // Quién autorizó el préstamo
  
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
}, (table) => ({
  clienteEmpresaIdx: index("prestamos_internos_cliente_empresa_idx").on(table.clienteId, table.empresaId),
}));

export const insertPrestamoInternoSchema = createInsertSchema(prestamosInternos).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  estado: z.enum(estadosCredito).default("ACTIVO"),
  tipoPlazo: z.enum(["QUINCENAS", "MESES"]).default("QUINCENAS"),
});

export const updatePrestamoInternoSchema = insertPrestamoInternoSchema.partial();

export type PrestamoInterno = typeof prestamosInternos.$inferSelect;
export type InsertPrestamoInterno = z.infer<typeof insertPrestamoInternoSchema>;

// Pagos/Abonos de Créditos y Préstamos (Histórico)
export const pagosCreditosDescuentos = pgTable("pagos_creditos_descuentos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clienteId: varchar("cliente_id").notNull().references(() => clientes.id, { onDelete: "cascade" }),
  empresaId: varchar("empresa_id").notNull().references(() => empresas.id, { onDelete: "cascade" }),
  
  // Referencia al crédito o préstamo
  creditoLegalId: varchar("credito_legal_id").references(() => creditosLegales.id, { onDelete: "cascade" }),
  prestamoInternoId: varchar("prestamo_interno_id").references(() => prestamosInternos.id, { onDelete: "cascade" }),
  empleadoId: varchar("empleado_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  
  // Datos del pago
  monto: numeric("monto").notNull(),
  saldoAnterior: numeric("saldo_anterior").notNull(),
  saldoNuevo: numeric("saldo_nuevo").notNull(),
  
  // Fecha y periodo
  fechaPago: date("fecha_pago").notNull(),
  periodoNominaId: varchar("periodo_nomina_id").references(() => payrollPeriods.id, { onDelete: "set null" }),
  
  // Tipo de pago
  tipoMovimiento: varchar("tipo_movimiento").notNull().default("DESCUENTO_NOMINA"), // DESCUENTO_NOMINA, ABONO_MANUAL, LIQUIDACION
  
  // Observaciones
  notas: text("notas"),
  
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
}, (table) => ({
  clienteEmpresaIdx: index("pagos_creditos_descuentos_cliente_empresa_idx").on(table.clienteId, table.empresaId),
}));

export const insertPagoCreditoDescuentoSchema = createInsertSchema(pagosCreditosDescuentos).omit({
  id: true,
  createdAt: true,
}).extend({
  tipoMovimiento: z.enum(["DESCUENTO_NOMINA", "ABONO_MANUAL", "LIQUIDACION"]).default("DESCUENTO_NOMINA"),
});

export type PagoCreditoDescuento = typeof pagosCreditosDescuentos.$inferSelect;
export type InsertPagoCreditoDescuento = z.infer<typeof insertPagoCreditoDescuentoSchema>;

// Puestos (Organización)
export const puestos = pgTable("puestos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clienteId: varchar("cliente_id").notNull().references(() => clientes.id, { onDelete: "cascade" }),
  empresaId: varchar("empresa_id").notNull().references(() => empresas.id, { onDelete: "cascade" }),
  
  // Identificación
  clavePuesto: varchar("clave_puesto").notNull().unique(),
  nombrePuesto: varchar("nombre_puesto").notNull(),
  
  // Ubicación Organizacional
  area: varchar("area"),
  departamentoId: varchar("departamento_id").references(() => departamentos.id, { onDelete: "set null" }),
  centrosTrabajoIds: jsonb("centros_trabajo_ids").default(sql`'[]'::jsonb`), // Array de IDs de centros de trabajo
  nivelJerarquico: varchar("nivel_jerarquico"), // Operativo, Supervisor, Gerente, Director
  tipoPuesto: varchar("tipo_puesto"), // Operativo, Administrativo, Directivo
  
  // Jerarquía
  reportaA: varchar("reporta_a"), // ID del puesto superior (self-referencing, FK added after table definition)
  puestosQueReportan: jsonb("puestos_que_reportan").default(sql`'[]'::jsonb`), // Array de IDs
  
  // Propósito y Funciones
  propositoGeneral: text("proposito_general"),
  funcionesPrincipales: jsonb("funciones_principales").default(sql`'[]'::jsonb`), // Array de strings
  funcionesSecundarias: jsonb("funciones_secundarias").default(sql`'[]'::jsonb`), // Array de strings
  autoridadYDecisiones: text("autoridad_y_decisiones"),
  
  // Relaciones - Array de objetos: [{ tipo, conQuien, proposito }]
  relaciones: jsonb("relaciones").default(sql`'[]'::jsonb`),
  
  // Formación Académica - Objeto: { requerida, deseable }
  formacionAcademica: jsonb("formacion_academica").default(sql`'{}'::jsonb`),
  
  // Experiencia Laboral - Objeto: { requerida, deseable }
  experienciaLaboral: jsonb("experiencia_laboral").default(sql`'{}'::jsonb`),
  
  // Conocimientos y Competencias
  conocimientosTecnicos: jsonb("conocimientos_tecnicos").default(sql`'[]'::jsonb`), // Array de objetos: [{ conocimiento, nivel }]
  competenciasConductuales: jsonb("competencias_conductuales").default(sql`'[]'::jsonb`), // Array de strings
  
  // Idiomas - Array de objetos: [{ idioma, nivel }]
  idiomas: jsonb("idiomas").default(sql`'[]'::jsonb`),
  
  // Certificaciones
  certificaciones: jsonb("certificaciones").default(sql`'[]'::jsonb`), // Array de strings
  
  // Condiciones Laborales - Objeto con: horario, guardias, modalidad, requiereViaje, nivelEsfuerzoFisico, ambienteTrabajo
  condicionesLaborales: jsonb("condiciones_laborales").default(sql`'{}'::jsonb`),
  
  // Compensación y Prestaciones - Objeto con: rangoSalarialMin, rangoSalarialMax, tipoPago, prestaciones[]
  compensacionYPrestaciones: jsonb("compensacion_y_prestaciones").default(sql`'{}'::jsonb`),
  
  // Indicadores de Desempeño - Array de objetos: [{ indicador, metaSugerida }]
  indicadoresDesempeno: jsonb("indicadores_desempeno").default(sql`'[]'::jsonb`),
  
  // Cumplimiento Legal - Objeto con: nomsAplicables[], nivelRiesgo, equipoProteccion
  cumplimientoLegal: jsonb("cumplimiento_legal").default(sql`'{}'::jsonb`),
  
  // Estado
  estatus: varchar("estatus").default("activo"), // activo, inactivo
  
  // Prestaciones
  esquemaPrestacionesId: varchar("esquema_prestaciones_id"),
  
  // Auditoría
  fechaCreacion: timestamp("fecha_creacion").notNull().default(sql`now()`),
  ultimaActualizacion: timestamp("ultima_actualizacion").notNull().default(sql`now()`),
}, (table) => ({
  clienteEmpresaIdx: index("puestos_cliente_empresa_idx").on(table.clienteId, table.empresaId),
}));

export const insertPuestoSchema = createInsertSchema(puestos).omit({
  id: true,
  fechaCreacion: true,
  ultimaActualizacion: true,
}).extend({
  estatus: z.enum(["activo", "inactivo"]).default("activo"),
  centrosTrabajoIds: z.array(z.string()).default([]),
  puestosQueReportan: z.array(z.string()).default([]),
  funcionesPrincipales: z.array(z.string()).default([]),
  funcionesSecundarias: z.array(z.string()).default([]),
  relaciones: z.array(z.object({
    tipo: z.string(),
    conQuien: z.string(),
    proposito: z.string(),
  })).default([]),
  formacionAcademica: z.object({
    requerida: z.string().optional(),
    deseable: z.string().optional(),
  }).default({}),
  experienciaLaboral: z.object({
    requerida: z.string().optional(),
    deseable: z.string().optional(),
  }).default({}),
  conocimientosTecnicos: z.array(z.object({
    conocimiento: z.string(),
    nivel: z.string(),
  })).default([]),
  competenciasConductuales: z.array(z.string()).default([]),
  idiomas: z.array(z.object({
    idioma: z.string(),
    nivel: z.string(),
  })).default([]),
  certificaciones: z.array(z.string()).default([]),
  condicionesLaborales: z.object({
    tipoHorario: z.enum(["fijo", "variable"]).optional(),
    horaEntrada: z.string().optional(),
    horaSalida: z.string().optional(),
    descripcionHorario: z.string().optional(),
    horasSemanales: z.union([z.coerce.number().positive(), z.literal("").transform(() => undefined)]).optional(),
    tiempoComida: z.union([z.coerce.number().min(0.5, "El tiempo de comida mínimo es 30 minutos (0.5 horas)"), z.literal("").transform(() => undefined)]).optional(),
    horarioComidaInicio: z.string().optional(),
    horarioComidaFin: z.string().optional(),
    guardias: z.string().optional(),
    horasGuardias: z.union([z.coerce.number().positive(), z.literal("").transform(() => undefined)]).optional(),
    modalidad: z.string().optional(),
    requiereViaje: z.boolean().optional(),
    nivelEsfuerzoFisico: z.string().optional(),
    ambienteTrabajo: z.string().optional(),
  }).default({}).refine(
    (data) => {
      if (data.horarioComidaInicio && data.horarioComidaFin) {
        return data.horarioComidaFin > data.horarioComidaInicio;
      }
      return true;
    },
    {
      message: "El horario de fin de comida debe ser posterior al horario de inicio",
      path: ["horarioComidaFin"],
    }
  ),
  compensacionYPrestaciones: z.object({
    rangoSalarialMin: z.number().optional(),
    rangoSalarialMax: z.number().optional(),
    tipoPago: z.string().optional(),
    prestaciones: z.array(z.string()).optional(),
    prestacionesAdicionales: z.array(z.string()).optional(),
  }).default({}),
  indicadoresDesempeno: z.array(z.object({
    indicador: z.string(),
    metaSugerida: z.string(),
  })).default([]),
  cumplimientoLegal: z.object({
    nomsAplicables: z.array(z.string()).optional(),
    nivelRiesgo: z.string().optional(),
    equipoProteccion: z.string().optional(),
  }).default({}),
});

export const updatePuestoSchema = insertPuestoSchema.partial();

export type Puesto = typeof puestos.$inferSelect;
export type InsertPuesto = z.infer<typeof insertPuestoSchema>;

// ==================== MÓDULO DE RECLUTAMIENTO Y SELECCIÓN ====================

// Estados de vacantes
export const vacanteStatuses = ["abierta", "pausada", "cerrada", "cancelada"] as const;
export type VacanteStatus = typeof vacanteStatuses[number];

// Prioridades de vacantes
export const vacantePriorities = ["baja", "media", "alta", "urgente"] as const;
export type VacantePriority = typeof vacantePriorities[number];

// Tabla de Vacantes (Requisiciones de Personal)
export const vacantes = pgTable("vacantes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clienteId: varchar("cliente_id").notNull().references(() => clientes.id, { onDelete: "cascade" }),
  titulo: varchar("titulo").notNull(),
  puestoId: varchar("puesto_id").references(() => puestos.id, { onDelete: "set null" }),
  departamento: varchar("departamento").notNull(),
  numeroVacantes: integer("numero_vacantes").notNull().default(1),
  prioridad: varchar("prioridad").notNull().default("media"), // baja, media, alta, urgente
  fechaApertura: date("fecha_apertura").notNull().default(sql`CURRENT_DATE`),
  fechaLimite: date("fecha_limite"),
  fechaSolicitud: date("fecha_solicitud").notNull().default(sql`CURRENT_DATE`), // Fecha en que se solicitó la vacante
  estatus: varchar("estatus").notNull().default("abierta"), // abierta, pausada, cerrada, cancelada
  tipoContrato: varchar("tipo_contrato").default("indeterminado"),
  modalidadTrabajo: varchar("modalidad_trabajo").default("presencial"),
  ubicacion: varchar("ubicacion"),
  centroTrabajoId: varchar("centro_trabajo_id").references(() => centrosTrabajo.id, { onDelete: "set null" }),
  rangoSalarialMin: numeric("rango_salarial_min"),
  rangoSalarialMax: numeric("rango_salarial_max"),
  descripcion: text("descripcion"),
  requisitos: text("requisitos"),
  responsabilidades: text("responsabilidades"),
  prestaciones: text("prestaciones"),
  
  // Competencias (copiadas del puesto o personalizadas)
  conocimientosTecnicos: jsonb("conocimientos_tecnicos").default(sql`'[]'::jsonb`), // Array de {conocimiento, nivel}
  competenciasConductuales: jsonb("competencias_conductuales").default(sql`'[]'::jsonb`), // Array de strings
  idiomas: jsonb("idiomas").default(sql`'[]'::jsonb`), // Array de {idioma, nivel}
  certificaciones: jsonb("certificaciones").default(sql`'[]'::jsonb`), // Array de strings
  
  // Condiciones Laborales
  condicionesLaborales: jsonb("condiciones_laborales").default(sql`'{}'::jsonb`),
  
  empresaId: varchar("empresa_id").notNull().references(() => empresas.id, { onDelete: "cascade" }),
  creadoPor: varchar("creado_por"),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
}, (table) => ({
  clienteEmpresaIdx: index("vacantes_cliente_empresa_idx").on(table.clienteId, table.empresaId),
}));

// Fuentes de reclutamiento
export const fuentesReclutamiento = [
  "linkedin", "indeed", "computrabajo", "occmundial", "bumeran",
  "referido_empleado", "bolsa_universitaria", "redes_sociales",
  "portal_empresa", "agencia_reclutamiento", "feria_empleo",
  "aplicacion_directa", "headhunter", "otro"
] as const;
export type FuenteReclutamiento = typeof fuentesReclutamiento[number];

// Tabla de Candidatos
export const candidatos = pgTable("candidatos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clienteId: varchar("cliente_id").notNull().references(() => clientes.id, { onDelete: "cascade" }),
  empresaId: varchar("empresa_id").notNull().references(() => empresas.id, { onDelete: "cascade" }),
  nombre: varchar("nombre").notNull(),
  apellidoPaterno: varchar("apellido_paterno").notNull(),
  apellidoMaterno: varchar("apellido_materno"),
  email: varchar("email").notNull(),
  telefono: varchar("telefono").notNull(),
  telefonoSecundario: varchar("telefono_secundario"),
  linkedinUrl: varchar("linkedin_url"),
  cvUrl: varchar("cv_url"), // URL del CV en object storage
  puestoDeseado: varchar("puesto_deseado"),
  salarioDeseado: numeric("salario_deseado"),
  disponibilidad: varchar("disponibilidad"), // inmediata, 15_dias, 1_mes, etc.
  fuente: varchar("fuente").notNull().default("aplicacion_directa"), // linkedin, indeed, referido, etc.
  referidoPor: varchar("referido_por"), // Nombre de quien lo refirió
  empleadoReferidorId: varchar("empleado_referidor_id"), // ID del empleado que lo refirió
  ciudad: varchar("ciudad"),
  estado: varchar("estado"),
  experienciaAnios: integer("experiencia_anios"),
  nivelEducacion: varchar("nivel_educacion"), // secundaria, preparatoria, licenciatura, maestria, doctorado
  carrera: varchar("carrera"),
  universidad: varchar("universidad"),
  competenciasClave: jsonb("competencias_clave").default(sql`'[]'::jsonb`), // Array de strings
  idiomas: jsonb("idiomas").default(sql`'[]'::jsonb`), // Array de {idioma, nivel}
  notas: text("notas"),
  documentosAdicionales: jsonb("documentos_adicionales").default(sql`'[]'::jsonb`), // Array de {nombre, url}
  estatus: varchar("estatus").default("activo"), // activo, contratado, descartado, inactivo
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
}, (table) => ({
  clienteEmpresaIdx: index("candidatos_cliente_empresa_idx").on(table.clienteId, table.empresaId),
}));

// Etapas del proceso de selección (configurables por empresa)
export const etapasSeleccion = pgTable("etapas_seleccion", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clienteId: varchar("cliente_id").notNull().references(() => clientes.id, { onDelete: "cascade" }),
  empresaId: varchar("empresa_id").notNull().references(() => empresas.id, { onDelete: "cascade" }),
  nombre: varchar("nombre").notNull(),
  descripcion: text("descripcion"),
  orden: integer("orden").notNull(), // Orden en el pipeline
  color: varchar("color").default("#6366f1"), // Color para el Kanban
  esEtapaFinal: boolean("es_etapa_final").default(false), // Contratado o Descartado
  esPositiva: boolean("es_positiva").default(true), // true = contratado, false = descartado
  activa: boolean("activa").default(true),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
}, (table) => ({
  clienteEmpresaIdx: index("etapas_seleccion_cliente_empresa_idx").on(table.clienteId, table.empresaId),
}));

// Proceso de selección - Estado de cada candidato en cada vacante
export const procesoSeleccion = pgTable("proceso_seleccion", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clienteId: varchar("cliente_id").notNull().references(() => clientes.id, { onDelete: "cascade" }),
  empresaId: varchar("empresa_id").notNull().references(() => empresas.id, { onDelete: "cascade" }),
  candidatoId: varchar("candidato_id").notNull().references(() => candidatos.id, { onDelete: "cascade" }),
  vacanteId: varchar("vacante_id").notNull().references(() => vacantes.id, { onDelete: "cascade" }),
  etapaActualId: varchar("etapa_actual_id").notNull().references(() => etapasSeleccion.id, { onDelete: "restrict" }),
  fechaAplicacion: timestamp("fecha_aplicacion").notNull().default(sql`now()`),
  fechaUltimoMovimiento: timestamp("fecha_ultimo_movimiento").default(sql`now()`),
  calificacionGeneral: integer("calificacion_general"), // 1-10
  estatus: varchar("estatus").default("activo"), // activo, contratado, descartado
  motivoDescarte: text("motivo_descarte"),
  notas: text("notas"),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
}, (table) => ({
  // Un candidato puede aplicar a la misma vacante solo una vez
  candidatoVacanteIdx: unique().on(table.candidatoId, table.vacanteId),
  clienteEmpresaIdx: index("proceso_seleccion_cliente_empresa_idx").on(table.clienteId, table.empresaId),
}));

// Historial de movimientos en el proceso
export const historialProcesoSeleccion = pgTable("historial_proceso_seleccion", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clienteId: varchar("cliente_id").notNull().references(() => clientes.id, { onDelete: "cascade" }),
  empresaId: varchar("empresa_id").notNull().references(() => empresas.id, { onDelete: "cascade" }),
  procesoSeleccionId: varchar("proceso_seleccion_id").notNull().references(() => procesoSeleccion.id, { onDelete: "cascade" }),
  etapaAnteriorId: varchar("etapa_anterior_id").references(() => etapasSeleccion.id, { onDelete: "set null" }),
  etapaNuevaId: varchar("etapa_nueva_id").notNull().references(() => etapasSeleccion.id, { onDelete: "restrict" }),
  comentario: text("comentario"),
  movidoPor: varchar("movido_por"),
  createdAt: timestamp("created_at").default(sql`now()`),
}, (table) => ({
  clienteEmpresaIdx: index("historial_proceso_seleccion_cliente_empresa_idx").on(table.clienteId, table.empresaId),
}));

// Tipos de entrevistas
export const tiposEntrevista = ["telefonica", "rh", "tecnica", "gerencia", "panel", "caso_practico", "otra"] as const;
export type TipoEntrevista = typeof tiposEntrevista[number];

// Entrevistas programadas
export const entrevistas = pgTable("entrevistas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clienteId: varchar("cliente_id").notNull().references(() => clientes.id, { onDelete: "cascade" }),
  empresaId: varchar("empresa_id").notNull().references(() => empresas.id, { onDelete: "cascade" }),
  procesoSeleccionId: varchar("proceso_seleccion_id").notNull().references(() => procesoSeleccion.id, { onDelete: "cascade" }),
  tipo: varchar("tipo").notNull().default("rh"), // telefonica, rh, tecnica, gerencia, panel
  titulo: varchar("titulo").notNull(),
  fechaHora: timestamp("fecha_hora").notNull(),
  duracionMinutos: integer("duracion_minutos").default(60),
  modalidad: varchar("modalidad").default("presencial"), // presencial, virtual, telefonica
  ubicacion: varchar("ubicacion"), // Lugar físico o link de videollamada
  entrevistadores: jsonb("entrevistadores").default(sql`'[]'::jsonb`), // Array de {nombre, puesto, email}
  estatus: varchar("estatus").default("programada"), // programada, completada, cancelada, reprogramada
  calificacion: integer("calificacion"), // 1-10
  fortalezas: text("fortalezas"),
  areasOportunidad: text("areas_oportunidad"),
  recomendacion: varchar("recomendacion"), // aprobar, rechazar, siguiente_etapa
  comentarios: text("comentarios"),
  archivoNotas: varchar("archivo_notas"), // URL de archivo con notas de la entrevista
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
}, (table) => ({
  clienteEmpresaIdx: index("entrevistas_cliente_empresa_idx").on(table.clienteId, table.empresaId),
}));

// Evaluaciones técnicas o psicométricas
export const evaluaciones = pgTable("evaluaciones", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clienteId: varchar("cliente_id").notNull().references(() => clientes.id, { onDelete: "cascade" }),
  empresaId: varchar("empresa_id").notNull().references(() => empresas.id, { onDelete: "cascade" }),
  procesoSeleccionId: varchar("proceso_seleccion_id").notNull().references(() => procesoSeleccion.id, { onDelete: "cascade" }),
  tipo: varchar("tipo").notNull(), // tecnica, psicometrica, conocimientos, idiomas, etc.
  nombre: varchar("nombre").notNull(),
  descripcion: text("descripcion"),
  fechaAplicacion: timestamp("fecha_aplicacion"),
  fechaLimite: timestamp("fecha_limite"),
  calificacion: numeric("calificacion"),
  calificacionMaxima: numeric("calificacion_maxima"),
  aprobada: boolean("aprobada"),
  archivoResultados: varchar("archivo_resultados"), // URL del archivo de resultados
  comentarios: text("comentarios"),
  aplicadaPor: varchar("aplicada_por"),
  estatus: varchar("estatus").default("pendiente"), // pendiente, en_proceso, completada, vencida
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
}, (table) => ({
  clienteEmpresaIdx: index("evaluaciones_cliente_empresa_idx").on(table.clienteId, table.empresaId),
}));

// Ofertas de trabajo
export const ofertas = pgTable("ofertas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clienteId: varchar("cliente_id").notNull().references(() => clientes.id, { onDelete: "cascade" }),
  procesoSeleccionId: varchar("proceso_seleccion_id").notNull().references(() => procesoSeleccion.id, { onDelete: "cascade" }),
  vacanteId: varchar("vacante_id").notNull().references(() => vacantes.id, { onDelete: "restrict" }),
  candidatoId: varchar("candidato_id").notNull().references(() => candidatos.id, { onDelete: "restrict" }),
  puesto: varchar("puesto").notNull(),
  departamento: varchar("departamento").notNull(),
  tipoContrato: varchar("tipo_contrato").default("indeterminado"),
  fechaInicioPropuesta: date("fecha_inicio_propuesta"),
  salarioBrutoMensual: numeric("salario_bruto_mensual").notNull(),
  salarioDiario: numeric("salario_diario"),
  prestaciones: text("prestaciones"), // Descripción de prestaciones
  periodoPrueba: boolean("periodo_prueba").default(false),
  duracionPruebaDias: integer("duracion_prueba_dias"),
  modalidadTrabajo: varchar("modalidad_trabajo").default("presencial"),
  ubicacion: varchar("ubicacion"),
  horario: varchar("horario"),
  fechaEnvio: date("fecha_envio"),
  fechaLimiteRespuesta: date("fecha_limite_respuesta"),
  estatus: varchar("estatus").default("borrador"), // borrador, enviada, aceptada, rechazada, negociacion, vencida
  documentoOferta: varchar("documento_oferta"), // URL del documento de oferta generado
  notas: text("notas"),
  empresaId: varchar("empresa_id").notNull().references(() => empresas.id, { onDelete: "cascade" }),
  creadoPor: varchar("creado_por"),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
}, (table) => ({
  clienteEmpresaIdx: index("ofertas_cliente_empresa_idx").on(table.clienteId, table.empresaId),
}));

// Zod schemas para validación

export const insertVacanteSchema = createInsertSchema(vacantes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  numeroVacantes: z.coerce.number().int().positive().default(1),
  rangoSalarialMin: z.union([z.coerce.number().positive(), z.literal("").transform(() => undefined)]).optional(),
  rangoSalarialMax: z.union([z.coerce.number().positive(), z.literal("").transform(() => undefined)]).optional(),
  
  // Competencias (compartidas con Puestos)
  conocimientosTecnicos: z.array(z.object({
    conocimiento: z.string(),
    nivel: z.string(),
  })).default([]),
  competenciasConductuales: z.array(z.string()).default([]),
  idiomas: z.array(z.object({
    idioma: z.string(),
    nivel: z.string(),
  })).default([]),
  certificaciones: z.array(z.string()).default([]),
  
  // Condiciones Laborales (compartidas con Puestos)
  condicionesLaborales: z.object({
    tipoHorario: z.enum(["fijo", "variable"]).optional(),
    horaEntrada: z.string().optional(),
    horaSalida: z.string().optional(),
    descripcionHorario: z.string().optional(),
    horasSemanales: z.union([z.coerce.number().positive(), z.literal("").transform(() => undefined)]).optional(),
    tiempoComida: z.union([z.coerce.number().min(0.5, "El tiempo de comida mínimo es 30 minutos (0.5 horas)"), z.literal("").transform(() => undefined)]).optional(),
    horarioComidaInicio: z.string().optional(),
    horarioComidaFin: z.string().optional(),
    guardias: z.string().optional(),
    horasGuardias: z.union([z.coerce.number().positive(), z.literal("").transform(() => undefined)]).optional(),
    modalidad: z.string().optional(),
    requiereViaje: z.boolean().optional(),
    nivelEsfuerzoFisico: z.string().optional(),
    ambienteTrabajo: z.string().optional(),
  }).default({}).refine(
    (data) => {
      if (data.horarioComidaInicio && data.horarioComidaFin) {
        return data.horarioComidaFin > data.horarioComidaInicio;
      }
      return true;
    },
    {
      message: "El horario de fin de comida debe ser posterior al horario de inicio",
      path: ["horarioComidaFin"],
    }
  ),
});

export const insertCandidatoSchema = createInsertSchema(candidatos).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  salarioDeseado: z.union([z.coerce.number().positive(), z.literal("").transform(() => undefined)]).optional(),
  experienciaAnios: z.union([z.coerce.number().int().nonnegative(), z.literal("").transform(() => undefined)]).optional(),
  competenciasClave: z.array(z.string()).default([]),
  idiomas: z.array(z.object({
    idioma: z.string(),
    nivel: z.string(),
  })).default([]),
  documentosAdicionales: z.array(z.object({
    nombre: z.string(),
    url: z.string(),
  })).default([]),
});

export const insertEtapaSeleccionSchema = createInsertSchema(etapasSeleccion).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  orden: z.coerce.number().int().nonnegative(),
});

export const insertProcesoSeleccionSchema = createInsertSchema(procesoSeleccion).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  fechaAplicacion: true,
  fechaUltimoMovimiento: true,
}).extend({
  calificacionGeneral: z.union([z.coerce.number().int().min(1).max(10), z.literal("").transform(() => undefined)]).optional(),
});

export const insertEntrevistaSchema = createInsertSchema(entrevistas).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  duracionMinutos: z.coerce.number().int().positive().default(60),
  calificacion: z.union([z.coerce.number().int().min(1).max(10), z.literal("").transform(() => undefined)]).optional(),
  entrevistadores: z.array(z.object({
    nombre: z.string(),
    puesto: z.string().optional(),
    email: z.string().email().optional(),
  })).default([]),
});

export const insertEvaluacionSchema = createInsertSchema(evaluaciones).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  calificacion: z.union([z.coerce.number().positive(), z.literal("").transform(() => undefined)]).optional(),
  calificacionMaxima: z.union([z.coerce.number().positive(), z.literal("").transform(() => undefined)]).optional(),
});

export const insertOfertaSchema = createInsertSchema(ofertas).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  salarioBrutoMensual: z.coerce.number().positive(),
  salarioDiario: z.union([z.coerce.number().positive(), z.literal("").transform(() => undefined)]).optional(),
  duracionPruebaDias: z.union([z.coerce.number().int().positive(), z.literal("").transform(() => undefined)]).optional(),
});

// Export types
export type Vacante = typeof vacantes.$inferSelect;
export type InsertVacante = z.infer<typeof insertVacanteSchema>;

export type Candidato = typeof candidatos.$inferSelect;
export type InsertCandidato = z.infer<typeof insertCandidatoSchema>;

export type EtapaSeleccion = typeof etapasSeleccion.$inferSelect;
export type InsertEtapaSeleccion = z.infer<typeof insertEtapaSeleccionSchema>;

export type ProcesoSeleccion = typeof procesoSeleccion.$inferSelect;
export type InsertProcesoSeleccion = z.infer<typeof insertProcesoSeleccionSchema>;

export type Entrevista = typeof entrevistas.$inferSelect;
export type InsertEntrevista = z.infer<typeof insertEntrevistaSchema>;

export type Evaluacion = typeof evaluaciones.$inferSelect;
export type InsertEvaluacion = z.infer<typeof insertEvaluacionSchema>;

export type Oferta = typeof ofertas.$inferSelect;
export type InsertOferta = z.infer<typeof insertOfertaSchema>;

// ============================================================================
// CATÁLOGO DE TABLAS DE PRESTACIONES (Benefit Tables Catalog)
// ============================================================================
// Define cuántos días tocan por año según esquema (Ley, Sindicalizado, Confianza, etc.)
// Esta es la "Fuente de la Verdad" para prestaciones

export const catTablasPrestaciones = pgTable("cat_tablas_prestaciones", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  empresaId: varchar("empresa_id").references(() => empresas.id, { onDelete: "cascade" }), // NULL = Regla General del Sistema
  clienteId: varchar("cliente_id").references(() => clientes.id, { onDelete: "cascade" }), // Para multi-tenant
  
  // Ej: "Ley Federal del Trabajo 2024", "Directivos", "Operativos A", "Sindicalizados"
  nombreEsquema: varchar("nombre_esquema").notNull(),
  
  // La llave maestra: Años cumplidos
  aniosAntiguedad: integer("anios_antiguedad").notNull(), // 1, 2, 3...
  
  // Los Beneficios de ese año
  diasVacaciones: integer("dias_vacaciones").notNull(), // Ej: 12, 14, 16...
  diasAguinaldo: integer("dias_aguinaldo").notNull(), // Ej: 15, 20, 30...
  primaVacacionalPct: numeric("prima_vacacional_pct", { precision: 5, scale: 2 }).notNull(), // Ej: 25.00
  
  // El impacto financiero (Factor de Integración para SBC)
  // Fórmula: 1 + ((dias_aguinaldo + (dias_vacaciones * prima_vac_pct/100)) / 365)
  factorIntegracion: numeric("factor_integracion", { precision: 10, scale: 6 }), 
  
  activo: boolean("activo").default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
}, (table) => ({
  clienteEmpresaIdx: index("cat_tablas_prestaciones_cliente_empresa_idx").on(table.clienteId, table.empresaId),
  esquemaAniosIdx: index("cat_tablas_prestaciones_esquema_anios_idx").on(table.nombreEsquema, table.aniosAntiguedad),
}));

export const insertCatTablasPrestacionesSchema = createInsertSchema(catTablasPrestaciones).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  aniosAntiguedad: z.coerce.number().int().min(1),
  diasVacaciones: z.coerce.number().int().min(6),
  diasAguinaldo: z.coerce.number().int().min(15),
  primaVacacionalPct: z.coerce.number().min(25),
});

export type CatTablaPrestaciones = typeof catTablasPrestaciones.$inferSelect;
export type InsertCatTablaPrestaciones = z.infer<typeof insertCatTablasPrestacionesSchema>;

// ============================================================================
// KARDEX DE VACACIONES (Vacation Ledger)
// ============================================================================
// Aquí se registran los abonos (aniversarios) y cargos (vacaciones tomadas)
// Funciona como una "cuenta bancaria" de días de vacaciones

export const tiposMovimientoKardex = ["devengo", "disfrute", "caducidad", "finiquito", "ajuste"] as const;
export type TipoMovimientoKardex = typeof tiposMovimientoKardex[number];

export const kardexVacaciones = pgTable("kardex_vacaciones", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  empleadoId: varchar("empleado_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  clienteId: varchar("cliente_id").notNull().references(() => clientes.id, { onDelete: "cascade" }),
  empresaId: varchar("empresa_id").notNull().references(() => empresas.id, { onDelete: "cascade" }),
  
  // Vital para la caducidad (Los días prescriben a los 18 meses del año correspondiente)
  anioAntiguedad: integer("anio_antiguedad").notNull(), 
  
  // Tipo de movimiento:
  // 'devengo'   -> Aniversario laboral (Suma días, ej: +12)
  // 'disfrute'  -> Vacaciones tomadas (Resta días, ej: -3)
  // 'caducidad' -> Días perdidos por prescripción (Resta días)
  // 'finiquito' -> Días pagados al terminar relación laboral (Resta días)
  // 'ajuste'    -> Ajuste manual por corrección (Suma o resta)
  tipoMovimiento: varchar("tipo_movimiento").notNull(), 
  
  // Cantidad: Positivo suma saldo, Negativo resta saldo
  dias: numeric("dias", { precision: 10, scale: 2 }).notNull(), 
  
  // Snapshot del saldo después de este movimiento (para auditoría rápida)
  saldoDespuesMovimiento: numeric("saldo_despues_movimiento", { precision: 10, scale: 2 }), 
  
  // Control Financiero: ¿Ya se pagó la prima de estos días?
  primaPagada: boolean("prima_pagada").default(false),
  
  // Trazabilidad
  fechaMovimiento: date("fecha_movimiento").notNull().default(sql`CURRENT_DATE`),
  periodoNominaId: varchar("periodo_nomina_id"), // ¿En qué nómina se reflejó?
  solicitudVacacionesId: varchar("solicitud_vacaciones_id"), // Relación con solicitud si aplica
  observaciones: text("observaciones"), // Ej: "Solicitud #505 Semana Santa", "Aniversario año 3"
  
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  createdBy: varchar("created_by"), // Usuario que creó el registro
}, (table) => ({
  empleadoIdx: index("kardex_vacaciones_empleado_idx").on(table.empleadoId),
  empleadoAnioIdx: index("kardex_vacaciones_empleado_anio_idx").on(table.empleadoId, table.anioAntiguedad),
  clienteEmpresaIdx: index("kardex_vacaciones_cliente_empresa_idx").on(table.clienteId, table.empresaId),
  tipoMovimientoIdx: index("kardex_vacaciones_tipo_movimiento_idx").on(table.tipoMovimiento),
}));

export const insertKardexVacacionesSchema = createInsertSchema(kardexVacaciones).omit({
  id: true,
  createdAt: true,
}).extend({
  tipoMovimiento: z.enum(tiposMovimientoKardex),
  anioAntiguedad: z.coerce.number().int().min(1),
  dias: z.coerce.number(),
});

export type KardexVacaciones = typeof kardexVacaciones.$inferSelect;
export type InsertKardexVacaciones = z.infer<typeof insertKardexVacacionesSchema>;

// ============================================================================
// MÓDULO DE VACACIONES (Vacation Management)
// ============================================================================

// Estados de solicitudes de vacaciones
export const estatusSolicitudVacaciones = ["pendiente", "aprobada", "rechazada", "cancelada"] as const;
export type EstatusSolicitudVacaciones = typeof estatusSolicitudVacaciones[number];

export const solicitudesVacaciones = pgTable("solicitudes_vacaciones", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clienteId: varchar("cliente_id").notNull().references(() => clientes.id, { onDelete: "cascade" }),
  empresaId: varchar("empresa_id").notNull().references(() => empresas.id, { onDelete: "cascade" }),
  empleadoId: varchar("empleado_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  fechaInicio: date("fecha_inicio").notNull(),
  fechaFin: date("fecha_fin").notNull(),
  diasSolicitados: integer("dias_solicitados").notNull(), // Días laborales solicitados
  diasLegalesCorresponden: integer("dias_legales_corresponden"), // Días de vacaciones según LFT por antigüedad
  primaVacacional: numeric("prima_vacacional", { precision: 12, scale: 2 }), // 25% mínimo del salario por días de vacaciones
  estatus: varchar("estatus").notNull().default("pendiente"), // pendiente, aprobada, rechazada, cancelada
  motivo: text("motivo"), // Motivo/descripción del empleado
  fechaSolicitud: timestamp("fecha_solicitud").notNull().default(sql`now()`),
  fechaRespuesta: timestamp("fecha_respuesta"),
  aprobadoPor: varchar("aprobado_por"), // ID del supervisor/RH que aprobó - idealmente FK a employees/users
  comentariosAprobador: text("comentarios_aprobador"), // Comentarios del aprobador
  notasEmpleado: text("notas_empleado"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
}, (table) => ({
  // Index for common queries filtering by employee and date
  empleadoFechaIdx: sql`CREATE INDEX IF NOT EXISTS solicitudes_vacaciones_empleado_fecha_idx ON ${table} (empleado_id, fecha_inicio)`,
  empleadoEstatusIdx: sql`CREATE INDEX IF NOT EXISTS solicitudes_vacaciones_empleado_estatus_idx ON ${table} (empleado_id, estatus)`,
  clienteEmpresaIdx: index("solicitudes_vacaciones_cliente_empresa_idx").on(table.clienteId, table.empresaId),
}));

// ============================================================================
// MÓDULO DE INCAPACIDADES (Sick Leave Management)
// ============================================================================

// Tipos de incapacidad según IMSS
export const tiposIncapacidad = ["enfermedad_general", "riesgo_trabajo", "maternidad"] as const;
export type TipoIncapacidad = typeof tiposIncapacidad[number];

// Estados de incapacidades
export const estatusIncapacidad = ["activa", "cerrada", "rechazada_imss"] as const;
export type EstatusIncapacidad = typeof estatusIncapacidad[number];

export const incapacidades = pgTable("incapacidades", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clienteId: varchar("cliente_id").notNull().references(() => clientes.id, { onDelete: "cascade" }),
  empresaId: varchar("empresa_id").notNull().references(() => empresas.id, { onDelete: "cascade" }),
  empleadoId: varchar("empleado_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  tipo: varchar("tipo").notNull(), // enfermedad_general, riesgo_trabajo, maternidad
  fechaInicio: date("fecha_inicio").notNull(),
  fechaFin: date("fecha_fin").notNull(),
  diasIncapacidad: integer("dias_incapacidad").notNull(),
  
  // Certificado médico IMSS (SENSIBLE - requiere controles de acceso)
  numeroCertificado: varchar("numero_certificado"), // Número de folio ST-2 o ST-3
  certificadoMedicoUrl: text("certificado_medico_url"), // URL del documento en object storage (cifrado)
  
  // Información médica (SENSIBLE - datos de salud protegidos por LFPDPPP)
  diagnostico: text("diagnostico"),
  medicoNombre: varchar("medico_nombre"),
  unidadMedica: varchar("unidad_medica"), // Clínica IMSS
  
  // Información de pago según reglas IMSS
  porcentajePago: integer("porcentaje_pago"), // 60% enfermedad general, 100% riesgo trabajo/maternidad
  pagoPatronPrimerosTresDias: boolean("pago_patron_primeros_tres_dias").default(false), // Si patrón pagó primeros 3 días (voluntario)
  pagoIMSSDesde: date("pago_imss_desde"), // IMSS paga desde 4to día en enfermedad general, 1er día en otros
  
  // Control y notas
  estatus: varchar("estatus").notNull().default("activa"), // activa, cerrada, rechazada_imss
  notasInternas: text("notas_internas"),
  registradoPor: varchar("registrado_por"), // ID de quien lo registró - idealmente FK a employees/users
  
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
}, (table) => ({
  // Indexes for common queries filtering by employee, type, and status
  empleadoFechaIdx: sql`CREATE INDEX IF NOT EXISTS incapacidades_empleado_fecha_idx ON ${table} (empleado_id, fecha_inicio)`,
  empleadoEstatusIdx: sql`CREATE INDEX IF NOT EXISTS incapacidades_empleado_estatus_idx ON ${table} (empleado_id, estatus)`,
  empleadoTipoIdx: sql`CREATE INDEX IF NOT EXISTS incapacidades_empleado_tipo_idx ON ${table} (empleado_id, tipo)`,
  clienteEmpresaIdx: index("incapacidades_cliente_empresa_idx").on(table.clienteId, table.empresaId),
}));

// ============================================================================
// MÓDULO DE PERMISOS (Permission Requests)
// ============================================================================

// Tipos de permiso según LFT y políticas empresa
export const tiposPermiso = ["personal", "defuncion", "matrimonio", "paternidad", "medico", "tramite", "otro"] as const;
export type TipoPermiso = typeof tiposPermiso[number];

// Estados de solicitudes de permiso
export const estatusSolicitudPermiso = ["pendiente", "aprobada", "rechazada", "cancelada"] as const;
export type EstatusSolicitudPermiso = typeof estatusSolicitudPermiso[number];

export const solicitudesPermisos = pgTable("solicitudes_permisos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clienteId: varchar("cliente_id").notNull().references(() => clientes.id, { onDelete: "cascade" }),
  empresaId: varchar("empresa_id").notNull().references(() => empresas.id, { onDelete: "cascade" }),
  empleadoId: varchar("empleado_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  
  // Tipo y clasificación
  tipoPermiso: varchar("tipo_permiso").notNull(), // personal, defuncion, matrimonio, paternidad, medico, tramite, otro
  conGoce: boolean("con_goce").notNull().default(false), // Con o sin goce de sueldo
  
  // Fechas y duración
  fechaInicio: date("fecha_inicio").notNull(),
  fechaFin: date("fecha_fin").notNull(),
  horasPermiso: numeric("horas_permiso", { precision: 5, scale: 2 }), // Si es permiso por horas (parcial)
  diasSolicitados: numeric("dias_solicitados", { precision: 5, scale: 2 }).notNull(), // Puede ser fraccionario (0.5 días, etc)
  
  // Detalles de la solicitud
  motivo: text("motivo").notNull(), // Descripción del empleado
  documentoSoporteUrl: text("documento_soporte_url"), // Comprobantes (acta defunción, etc)
  
  // Aprobación
  estatus: varchar("estatus").notNull().default("pendiente"), // pendiente, aprobada, rechazada, cancelada
  fechaSolicitud: timestamp("fecha_solicitud").notNull().default(sql`now()`),
  fechaRespuesta: timestamp("fecha_respuesta"),
  aprobadoPor: varchar("aprobado_por"), // ID del supervisor/RH que aprobó - idealmente FK a employees/users
  comentariosAprobador: text("comentarios_aprobador"),
  
  // Control
  notasInternas: text("notas_internas"), // Notas de RH
  
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
}, (table) => ({
  // Indexes for common queries filtering by employee, date, and status
  empleadoFechaIdx: sql`CREATE INDEX IF NOT EXISTS solicitudes_permisos_empleado_fecha_idx ON ${table} (empleado_id, fecha_inicio)`,
  empleadoEstatusIdx: sql`CREATE INDEX IF NOT EXISTS solicitudes_permisos_empleado_estatus_idx ON ${table} (empleado_id, estatus)`,
  empleadoTipoIdx: sql`CREATE INDEX IF NOT EXISTS solicitudes_permisos_empleado_tipo_idx ON ${table} (empleado_id, tipo_permiso)`,
  clienteEmpresaIdx: index("solicitudes_permisos_cliente_empresa_idx").on(table.clienteId, table.empresaId),
}));

// ============================================================================
// INSERT SCHEMAS Y VALIDACIONES
// ============================================================================

// Base schema for solicitudes vacaciones
const baseSolicitudVacacionesSchema = createInsertSchema(solicitudesVacaciones).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  fechaSolicitud: true,
}).extend({
  diasSolicitados: z.coerce.number().int().positive("Debe solicitar al menos 1 día"),
  diasLegalesCorresponden: z.union([z.coerce.number().int().positive(), z.literal("").transform(() => undefined)]).optional(),
  primaVacacional: z.union([z.string().transform((v) => (v === "" ? undefined : v)), z.number(), z.undefined()]).optional(),
  fechaInicio: z.string().refine((val) => !isNaN(Date.parse(val)), "Fecha de inicio inválida"),
  fechaFin: z.string().refine((val) => !isNaN(Date.parse(val)), "Fecha de fin inválida"),
  estatus: z.enum(["pendiente", "aprobada", "rechazada", "cancelada"]).default("pendiente"),
});

export const insertSolicitudVacacionesSchema = baseSolicitudVacacionesSchema.refine(
  (data) => new Date(data.fechaFin) >= new Date(data.fechaInicio),
  {
    message: "La fecha de fin debe ser posterior o igual a la fecha de inicio",
    path: ["fechaFin"],
  }
);

// Update schema with conditional cross-field validation
export const updateSolicitudVacacionesSchema = baseSolicitudVacacionesSchema.partial().superRefine((data, ctx) => {
  // Only validate dates if both are provided
  if (data.fechaInicio && data.fechaFin) {
    if (new Date(data.fechaFin) < new Date(data.fechaInicio)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La fecha de fin debe ser posterior o igual a la fecha de inicio",
        path: ["fechaFin"],
      });
    }
  }
});

// Base schema for incapacidades
const baseIncapacidadSchema = createInsertSchema(incapacidades).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  tipo: z.enum(["enfermedad_general", "riesgo_trabajo", "maternidad"], {
    errorMap: () => ({ message: "Tipo de incapacidad inválido" }),
  }),
  diasIncapacidad: z.coerce.number().int().positive("Debe tener al menos 1 día de incapacidad"),
  porcentajePago: z.union([z.coerce.number().int().min(0).max(100), z.literal("").transform(() => undefined)]).optional(),
  fechaInicio: z.string().refine((val) => !isNaN(Date.parse(val)), "Fecha de inicio inválida"),
  fechaFin: z.string().refine((val) => !isNaN(Date.parse(val)), "Fecha de fin inválida"),
  estatus: z.enum(["activa", "cerrada", "rechazada_imss"]).default("activa"),
});

export const insertIncapacidadSchema = baseIncapacidadSchema.refine(
  (data) => new Date(data.fechaFin) >= new Date(data.fechaInicio),
  {
    message: "La fecha de fin debe ser posterior o igual a la fecha de inicio",
    path: ["fechaFin"],
  }
);

// Update schema with conditional cross-field validation
export const updateIncapacidadSchema = baseIncapacidadSchema.partial().superRefine((data, ctx) => {
  // Only validate dates if both are provided
  if (data.fechaInicio && data.fechaFin) {
    if (new Date(data.fechaFin) < new Date(data.fechaInicio)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La fecha de fin debe ser posterior o igual a la fecha de inicio",
        path: ["fechaFin"],
      });
    }
  }
});

// Base schema for solicitudes permisos
const baseSolicitudPermisoSchema = createInsertSchema(solicitudesPermisos).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  fechaSolicitud: true,
}).extend({
  tipoPermiso: z.enum(["personal", "defuncion", "matrimonio", "paternidad", "medico", "tramite", "otro"], {
    errorMap: () => ({ message: "Tipo de permiso inválido" }),
  }),
  diasSolicitados: z.union([z.string().transform((v) => (v === "" ? undefined : v)), z.number(), z.undefined()]).refine(
    (val) => val === undefined || Number(val) > 0,
    "Debe solicitar al menos 0.5 días"
  ),
  horasPermiso: z.union([z.string().transform((v) => (v === "" ? undefined : v)), z.number(), z.undefined()]).optional(),
  fechaInicio: z.string().refine((val) => !isNaN(Date.parse(val)), "Fecha de inicio inválida"),
  fechaFin: z.string().refine((val) => !isNaN(Date.parse(val)), "Fecha de fin inválida"),
  estatus: z.enum(["pendiente", "aprobada", "rechazada", "cancelada"]).default("pendiente"),
});

export const insertSolicitudPermisoSchema = baseSolicitudPermisoSchema.refine(
  (data) => new Date(data.fechaFin) >= new Date(data.fechaInicio),
  {
    message: "La fecha de fin debe ser posterior o igual a la fecha de inicio",
    path: ["fechaFin"],
  }
);

// Update schema with conditional cross-field validation
export const updateSolicitudPermisoSchema = baseSolicitudPermisoSchema.partial().superRefine((data, ctx) => {
  // Only validate dates if both are provided
  if (data.fechaInicio && data.fechaFin) {
    if (new Date(data.fechaFin) < new Date(data.fechaInicio)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La fecha de fin debe ser posterior o igual a la fecha de inicio",
        path: ["fechaFin"],
      });
    }
  }
});

// ============================================================================
// ACTAS ADMINISTRATIVAS
// ============================================================================

export const actasAdministrativas = pgTable("actas_administrativas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clienteId: varchar("cliente_id").notNull().references(() => clientes.id, { onDelete: "cascade" }),
  empresaId: varchar("empresa_id").notNull().references(() => empresas.id, { onDelete: "cascade" }),
  empleadoId: varchar("empleado_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  
  // Información del acta
  numeroActa: varchar("numero_acta").notNull().unique(), // Número correlativo del acta
  fechaElaboracion: date("fecha_elaboracion").notNull(), // Fecha en que se elabora el acta
  tipoFalta: varchar("tipo_falta").notNull(), // leve, grave, muy_grave
  
  // Descripción de los hechos
  descripcionHechos: text("descripcion_hechos").notNull(), // Descripción detallada de la falta o incidente
  fechaIncidente: date("fecha_incidente").notNull(), // Fecha en que ocurrió el incidente
  horaIncidente: varchar("hora_incidente"), // Hora del incidente (opcional)
  lugarIncidente: text("lugar_incidente"), // Lugar donde ocurrió
  
  // Testigos (opcional)
  testigos: text("testigos"), // Nombres de testigos, separados por comas o JSON
  
  // Sanción aplicada
  sancionAplicada: varchar("sancion_aplicada"), // suspension, amonestacion, descuento, despido, ninguna
  diasSuspension: integer("dias_suspension"), // Número de días de suspensión (si aplica)
  montoDescuento: numeric("monto_descuento", { precision: 10, scale: 2 }), // Monto del descuento (si aplica)
  detallesSancion: text("detalles_sancion"), // Detalles adicionales de la sanción
  
  // Fechas de aplicación
  fechaAplicacionSancion: date("fecha_aplicacion_sancion"), // Cuándo se aplicará la sanción
  fechaCumplimientoSancion: date("fecha_cumplimiento_sancion"), // Cuándo se cumplió/terminó la sanción
  
  // Estado y seguimiento
  estatus: varchar("estatus").notNull().default("pendiente"), // pendiente, aplicada, apelada, anulada, archivada
  apelacionPresentada: boolean("apelacion_presentada").default(false),
  detallesApelacion: text("detalles_apelacion"),
  fechaApelacion: date("fecha_apelacion"),
  resolucionApelacion: text("resolucion_apelacion"),
  
  // Responsables
  elaboradoPor: varchar("elaborado_por").notNull(), // ID del usuario que elaboró el acta
  aprobadoPor: varchar("aprobado_por"), // ID del superior que aprobó
  
  // Documentos y notas
  documentosAdjuntos: jsonb("documentos_adjuntos").default(sql`'[]'::jsonb`), // URLs de documentos
  notasInternas: text("notas_internas"), // Notas privadas de RH
  
  // Firmas (opcional para futuras integraciones digitales)
  firmadoEmpleado: boolean("firmado_empleado").default(false),
  fechaFirmaEmpleado: timestamp("fecha_firma_empleado"),
  firmadoTestigo1: boolean("firmado_testigo1").default(false),
  firmadoTestigo2: boolean("firmado_testigo2").default(false),
  
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
}, (table) => ({
  clienteEmpresaIdx: index("actas_administrativas_cliente_empresa_idx").on(table.clienteId, table.empresaId),
}));

// ============================================================================
// BANCOS LAYOUTS - Configuración de formatos CSV para dispersión bancaria
// ============================================================================

// Zod schemas para validar configuración CSV de layouts bancarios
export const csvMetadataItemSchema = z.object({
  fila: z.number().int().positive(),
  tipo: z.enum(["vacia", "header_cuenta", "header_fecha", "custom"]),
  contenido: z.string().optional(),
  formato: z.string().optional(),
});

export const csvColumnSchema = z.object({
  campo: z.string().min(1),
  nombre: z.string().min(1),
  formato: z.enum(["texto", "numerico", "decimal", "moneda_mx", "fijo"]).optional(),
  longitud: z.number().int().positive().optional(),
  relleno: z.string().length(1).optional(),
  alineacion: z.enum(["izquierda", "derecha"]).optional(),
  valorDefecto: z.string().optional(),
  prefijo: z.string().optional(),
  separadorMiles: z.string().optional(),
  decimales: z.number().int().nonnegative().optional(),
  sinPunto: z.boolean().optional(),
  mayusculas: z.boolean().optional(),
  opcional: z.boolean().optional(),
  comentario: z.string().optional(),
});

export const configuracionCsvSchema = z.object({
  delimitador: z.string().length(1),
  encoding: z.enum(["UTF-8", "ISO-8859-1", "Windows-1252"]),
  extension: z.enum(["csv", "txt"]),
  nombreArchivo: z.string().min(1),
  tieneMetadata: z.boolean().default(false),
  metadata: z.array(csvMetadataItemSchema).optional(),
  encabezados: z.array(z.string().min(1)).optional(),
  columnas: z.array(csvColumnSchema).nonempty(),
  parametrosEmpresa: z.object({
    cuentaCargo: z.enum(["required", "optional"]).optional(),
    fechaPago: z.enum(["required", "optional"]).optional(),
  }).optional(),
  validaciones: z.array(z.object({
    tipo: z.string(),
    valor: z.union([z.string(), z.number()]).optional(),
    descripcion: z.string().optional(),
  })).optional(),
}).strict();

export type ConfiguracionCsv = z.infer<typeof configuracionCsvSchema>;

export const bancosLayouts = pgTable("bancos_layouts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clienteId: varchar("cliente_id").notNull().references(() => clientes.id, { onDelete: "cascade" }),
  empresaId: varchar("empresa_id").notNull().references(() => empresas.id, { onDelete: "cascade" }),
  nombre: varchar("nombre").notNull(), // "Santander México"
  codigoBanco: varchar("codigo_banco").notNull().unique(), // "SANTANDER"
  activo: boolean("activo").notNull().default(true),
  
  // Configuración completa del formato CSV en JSONB
  configuracionCsv: jsonb("configuracion_csv").notNull(),
  // Estructura esperada:
  // {
  //   delimitador: ",",
  //   encoding: "UTF-8",
  //   extension: "csv",
  //   nombreArchivo: "NOMINA_SANTANDER_{{fecha}}.csv",
  //   tieneMetadata: true,
  //   metadata: [...],
  //   encabezados: [...],
  //   columnas: [...],
  //   parametrosEmpresa: { cuentaCargo: "required", fechaPago: "required" }
  // }
  
  descripcion: text("descripcion"), // Descripción adicional del layout
  
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
}, (table) => ({
  clienteEmpresaIdx: index("bancos_layouts_cliente_empresa_idx").on(table.clienteId, table.empresaId),
}));

export type BancoLayout = typeof bancosLayouts.$inferSelect;
export const insertBancoLayoutSchema = createInsertSchema(bancosLayouts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  configuracionCsv: configuracionCsvSchema,
});
export type InsertBancoLayout = z.infer<typeof insertBancoLayoutSchema>;

// ============================================================================
// NÓMINAS - Historial de nóminas procesadas
// ============================================================================

// Zod schemas para validar empleadosData en nóminas
export const nominaConceptoSchema = z.object({
  conceptoId: z.string().min(1),
  concepto: z.string().min(1),
  monto: z.number().nonnegative(),
});

export const nominaEmpleadoDataSchema = z.object({
  empleadoId: z.string().min(1),
  numeroEmpleado: z.string().min(1),
  nombre: z.string().min(1),
  apellidoPaterno: z.string().min(1),
  apellidoMaterno: z.string().nullable().optional(),
  cuentaBancaria: z.string().optional(), // Opcional: puede no tener cuenta bancaria configurada
  medioPagoId: z.string().optional(), // ID del medio de pago asignado al empleado para dispersión
  diasTrabajados: z.number().int().nonnegative().optional(), // Opcional: aguinaldo/prima vacacional no dependen de días
  salarioBase: z.number().nonnegative().optional(), // Opcional: algunos conceptos son fijos
  percepciones: z.array(nominaConceptoSchema).default([]),
  deducciones: z.array(nominaConceptoSchema).default([]),
  netoAPagar: z.number().nonnegative(),
});

export const empleadosDataSchema = z.array(nominaEmpleadoDataSchema).nonempty();

export type NominaEmpleadoData = z.infer<typeof nominaEmpleadoDataSchema>;
export type EmpleadosData = z.infer<typeof empleadosDataSchema>;

export const nominas = pgTable("nominas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clienteId: varchar("cliente_id").notNull().references(() => clientes.id, { onDelete: "cascade" }),
  empresaId: varchar("empresa_id").notNull().references(() => empresas.id, { onDelete: "cascade" }),
  
  // Información básica de la nómina
  tipo: varchar("tipo").notNull(), // "ordinaria" | "extraordinaria"
  periodo: varchar("periodo").notNull(), // Descripción del periodo
  frecuencia: varchar("frecuencia").notNull(), // "semanal" | "quincenal" | "catorcenal" | "mensual"
  tipoExtraordinario: varchar("tipo_extraordinario"), // Si es extraordinaria
  
  // Estado y procesamiento
  status: varchar("status").notNull().default("pre_nomina"), // "pre_nomina" | "approved" | "paid"
  
  // Información bancaria para dispersión
  bancoLayoutId: varchar("banco_layout_id").references(() => bancosLayouts.id),
  cuentaCargo: varchar("cuenta_cargo"), // Cuenta desde donde se dispersa
  fechaPago: date("fecha_pago"), // Fecha efectiva de pago
  
  // Totales
  totalNeto: numeric("total_neto", { precision: 12, scale: 2 }).notNull(),
  totalEmpleados: integer("total_empleados").notNull(),
  
  // Datos de empleados y conceptos (JSONB para flexibilidad)
  empleadosData: jsonb("empleados_data").notNull(),
  // Estructura:
  // [
  //   {
  //     empleadoId: "uuid",
  //     numeroEmpleado: "123",
  //     nombre: "...",
  //     apellidoPaterno: "...",
  //     apellidoMaterno: "...",
  //     cuentaBancaria: "...",
  //     diasTrabajados: 15,
  //     salarioBase: 5000.00,
  //     percepciones: [...],
  //     deducciones: [...],
  //     netoAPagar: 4500.00
  //   }
  // ]
  
  // Metadatos
  creadoPor: varchar("creado_por"), // Usuario que creó la nómina
  aprobadoPor: varchar("aprobado_por"), // Usuario que aprobó
  fechaAprobacion: timestamp("fecha_aprobacion"),
  
  // Timbrado CFDI (separado del status)
  fechaTimbrado: timestamp("fecha_timbrado"), // null = no timbrada, fecha = timbrada
  timbradoPor: varchar("timbrado_por"), // Usuario que timbró
  
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
}, (table) => ({
  statusIdx: index("nominas_status_idx").on(table.status),
  periodoIdx: index("nominas_periodo_idx").on(table.periodo),
  fechaPagoIdx: index("nominas_fecha_pago_idx").on(table.fechaPago),
  clienteEmpresaIdx: index("nominas_cliente_empresa_idx").on(table.clienteId, table.empresaId),
}));

export type Nomina = typeof nominas.$inferSelect;
export const insertNominaSchema = createInsertSchema(nominas).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  tipo: z.enum(["ordinaria", "extraordinaria"]),
  frecuencia: z.enum(["semanal", "quincenal", "catorcenal", "mensual", "extraordinaria"]),
  status: z.enum(["pre_nomina", "approved", "paid"]).default("pre_nomina"),
  totalNeto: z.union([z.string(), z.number()]),
  empleadosData: empleadosDataSchema,
});
export type InsertNomina = z.infer<typeof insertNominaSchema>;

export const updateNominaSchema = insertNominaSchema.partial();
export type UpdateNomina = z.infer<typeof updateNominaSchema>;

// ============================================================================
// LAYOUTS BANCARIOS GENERADOS - Archivos generados por nómina aprobada
// ============================================================================

export const layoutsGenerados = pgTable("layouts_generados", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clienteId: varchar("cliente_id").notNull().references(() => clientes.id, { onDelete: "cascade" }),
  empresaId: varchar("empresa_id").notNull().references(() => empresas.id, { onDelete: "cascade" }),
  nominaId: varchar("nomina_id").notNull().references(() => nominas.id, { onDelete: "cascade" }),
  medioPagoId: varchar("medio_pago_id").notNull().references(() => mediosPago.id, { onDelete: "cascade" }),
  bancoLayoutId: varchar("banco_layout_id").references(() => bancosLayouts.id),
  
  // Información del archivo
  nombreArchivo: varchar("nombre_archivo").notNull(),
  contenido: text("contenido").notNull(), // Contenido del archivo CSV/TXT
  formato: varchar("formato").notNull().default("csv"), // csv, txt, xlsx
  
  // Totales del layout
  totalRegistros: integer("total_registros").notNull(),
  totalMonto: numeric("total_monto", { precision: 14, scale: 2 }).notNull(),
  
  // Datos detallados de empleados en este layout
  empleadosLayout: jsonb("empleados_layout").notNull(),
  // Estructura:
  // [
  //   {
  //     empleadoId: "uuid",
  //     numeroEmpleado: "123",
  //     nombreCompleto: "...",
  //     cuentaBancaria: "...",
  //     monto: 4500.00,
  //     conceptos: [{ concepto: "...", monto: 100 }]
  //   }
  // ]
  
  // Metadatos
  generadoPor: varchar("generado_por"),
  fechaGeneracion: timestamp("fecha_generacion").notNull().default(sql`now()`),
  
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
}, (table) => ({
  nominaIdx: index("layouts_generados_nomina_idx").on(table.nominaId),
  medioPagoIdx: index("layouts_generados_medio_pago_idx").on(table.medioPagoId),
  clienteEmpresaIdx: index("layouts_generados_cliente_empresa_idx").on(table.clienteId, table.empresaId),
}));

export type LayoutGenerado = typeof layoutsGenerados.$inferSelect;

export const empleadoLayoutSchema = z.object({
  empleadoId: z.string(),
  numeroEmpleado: z.string(),
  nombreCompleto: z.string(),
  cuentaBancaria: z.string().optional(),
  monto: z.number(),
  conceptos: z.array(z.object({
    conceptoId: z.string().optional(),
    concepto: z.string(),
    monto: z.number(),
  })),
});

export const insertLayoutGeneradoSchema = createInsertSchema(layoutsGenerados).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  empleadosLayout: z.array(empleadoLayoutSchema),
  totalMonto: z.union([z.string(), z.number()]),
});

export type InsertLayoutGenerado = z.infer<typeof insertLayoutGeneradoSchema>;

// ============================================================================
// EXPORT TYPES
// ============================================================================

export type SolicitudVacaciones = typeof solicitudesVacaciones.$inferSelect;
export type InsertSolicitudVacaciones = z.infer<typeof insertSolicitudVacacionesSchema>;

export type Incapacidad = typeof incapacidades.$inferSelect;
export type InsertIncapacidad = z.infer<typeof insertIncapacidadSchema>;

export type SolicitudPermiso = typeof solicitudesPermisos.$inferSelect;
export type InsertSolicitudPermiso = z.infer<typeof insertSolicitudPermisoSchema>;

export type ActaAdministrativa = typeof actasAdministrativas.$inferSelect;

// Base schema for actas administrativas
const baseActaAdministrativaSchema = createInsertSchema(actasAdministrativas).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  tipoFalta: z.enum(["leve", "grave", "muy_grave"], {
    errorMap: () => ({ message: "Tipo de falta inválido" }),
  }),
  sancionAplicada: z.enum(["ninguna", "amonestacion", "suspension", "descuento", "despido"], {
    errorMap: () => ({ message: "Tipo de sanción inválido" }),
  }).optional(),
  estatus: z.enum(["pendiente", "aplicada", "apelada", "anulada", "archivada"]).default("pendiente"),
  fechaElaboracion: z.string().refine((val) => !isNaN(Date.parse(val)), "Fecha de elaboración inválida"),
  fechaIncidente: z.string().refine((val) => !isNaN(Date.parse(val)), "Fecha de incidente inválida"),
  diasSuspension: z.union([z.string().transform((v) => (v === "" ? undefined : v)), z.number(), z.undefined()]).optional(),
  montoDescuento: z.union([z.string().transform((v) => (v === "" ? undefined : v)), z.number(), z.undefined()]).optional(),
});

export const insertActaAdministrativaSchema = baseActaAdministrativaSchema;
export const updateActaAdministrativaSchema = baseActaAdministrativaSchema.partial();
export type InsertActaAdministrativa = z.infer<typeof insertActaAdministrativaSchema>;

// ============================================================================
// ENRICHED TYPES WITH EMPLOYEE DATA
// ============================================================================

export interface EmpleadoBasicInfo {
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string | null;
  numeroEmpleado: string;
  puesto: string;
  departamento: string;
}

export interface SolicitudVacacionesWithEmpleado extends SolicitudVacaciones {
  empleado: EmpleadoBasicInfo;
}

export interface IncapacidadWithEmpleado extends Incapacidad {
  empleado: EmpleadoBasicInfo;
}

export interface SolicitudPermisoWithEmpleado extends SolicitudPermiso {
  empleado: EmpleadoBasicInfo;
}

export interface ActaAdministrativaWithEmpleado extends ActaAdministrativa {
  empleado: EmpleadoBasicInfo;
}

// ============================================================================
// SISTEMA DE NÓMINA - CATÁLOGOS SAT CFDI 4.0 (GLOBALES)
// ============================================================================

// Catálogo SAT: Tipos de Percepción
export const catSatTiposPercepcion = pgTable("cat_sat_tipos_percepcion", {
  clave: varchar("clave", { length: 10 }).primaryKey(),
  nombre: varchar("nombre", { length: 255 }).notNull(),
  descripcion: text("descripcion"),
  gravado: boolean("gravado").notNull().default(true),
  integraSdi: boolean("integra_sdi").notNull().default(true), // ¿Integra para IMSS?
  esImss: boolean("es_imss").notNull().default(false), // ¿Es pago de IMSS?
  activo: boolean("activo").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export type CatSatTipoPercepcion = typeof catSatTiposPercepcion.$inferSelect;
export const insertCatSatTipoPercepcionSchema = createInsertSchema(catSatTiposPercepcion).omit({
  createdAt: true,
  updatedAt: true,
});
export type InsertCatSatTipoPercepcion = z.infer<typeof insertCatSatTipoPercepcionSchema>;

// Catálogo: Tipos de Horas Extra según LFT
export const catTiposHorasExtra = pgTable("cat_tipos_horas_extra", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clave: varchar("clave", { length: 10 }).notNull().unique(), // 'dobles', 'triples'
  nombre: varchar("nombre", { length: 100 }).notNull(),
  descripcion: text("descripcion"),
  tasaPorcentaje: integer("tasa_porcentaje").notNull(), // 200 para dobles, 300 para triples
  tasaFactor: decimal("tasa_factor", { precision: 5, scale: 2 }).notNull(), // 2.00 o 3.00
  limiteHorasSemanal: integer("limite_horas_semanal"), // 9 para dobles, NULL para triples
  articuloLft: varchar("articulo_lft", { length: 20 }).notNull(), // Art. 67 o Art. 68
  fundamentoLegal: text("fundamento_legal").notNull(), // Texto completo del artículo
  satClave: varchar("sat_clave", { length: 10 }).default("019"), // Clave SAT para horas extra
  exentoIsr: boolean("exento_isr").notNull().default(false), // Las dobles pueden ser exentas
  observaciones: text("observaciones"),
  activo: boolean("activo").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export type CatTipoHoraExtra = typeof catTiposHorasExtra.$inferSelect;
export const insertCatTipoHoraExtraSchema = createInsertSchema(catTiposHorasExtra).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertCatTipoHoraExtra = z.infer<typeof insertCatTipoHoraExtraSchema>;

// Datos predefinidos para tipos de horas extra (para seed)
export const TIPOS_HORAS_EXTRA_LFT = [
  {
    clave: 'dobles',
    nombre: 'Horas Extra Dobles',
    descripcion: 'Primeras 9 horas semanales de tiempo extra',
    tasaPorcentaje: 200,
    tasaFactor: '2.00',
    limiteHorasSemanal: 9,
    articuloLft: 'Art. 67 LFT',
    fundamentoLegal: 'Las horas de trabajo extraordinario se pagarán con un ciento por ciento más del salario que corresponda a las horas de la jornada.',
    satClave: '019',
    exentoIsr: true,
    observaciones: 'Exentas de ISR si no exceden el 50% del salario mensual (LISR Art. 93 fracc. I)',
  },
  {
    clave: 'triples',
    nombre: 'Horas Extra Triples',
    descripcion: 'Horas que exceden las primeras 9 horas semanales',
    tasaPorcentaje: 300,
    tasaFactor: '3.00',
    limiteHorasSemanal: null,
    articuloLft: 'Art. 68 LFT',
    fundamentoLegal: 'La prolongación del tiempo extraordinario que exceda de nueve horas a la semana, obliga al patrón a pagar al trabajador el tiempo excedente con un doscientos por ciento más del salario que corresponda a las horas de la jornada.',
    satClave: '019',
    exentoIsr: false,
    observaciones: 'Siempre gravadas para ISR. El patrón debe evitar que el tiempo extra exceda las 9 horas semanales.',
  },
] as const;

// Catálogo SAT: Tipos de Deducción
export const catSatTiposDeduccion = pgTable("cat_sat_tipos_deduccion", {
  clave: varchar("clave", { length: 10 }).primaryKey(),
  nombre: varchar("nombre", { length: 255 }).notNull(),
  descripcion: text("descripcion"),
  esObligatoria: boolean("es_obligatoria").notNull().default(false),
  activo: boolean("activo").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export type CatSatTipoDeduccion = typeof catSatTiposDeduccion.$inferSelect;
export const insertCatSatTipoDeduccionSchema = createInsertSchema(catSatTiposDeduccion).omit({
  createdAt: true,
  updatedAt: true,
});
export type InsertCatSatTipoDeduccion = z.infer<typeof insertCatSatTipoDeduccionSchema>;

// Catálogo SAT: Tipos de Otro Pago
export const catSatTiposOtroPago = pgTable("cat_sat_tipos_otro_pago", {
  clave: varchar("clave", { length: 10 }).primaryKey(),
  nombre: varchar("nombre", { length: 255 }).notNull(),
  descripcion: text("descripcion"),
  activo: boolean("activo").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export type CatSatTipoOtroPago = typeof catSatTiposOtroPago.$inferSelect;
export const insertCatSatTipoOtroPagoSchema = createInsertSchema(catSatTiposOtroPago).omit({
  createdAt: true,
  updatedAt: true,
});
export type InsertCatSatTipoOtroPago = z.infer<typeof insertCatSatTipoOtroPagoSchema>;

// ============================================================================
// SISTEMA DE NÓMINA - TABLAS FISCALES 2025 (GLOBALES CON BASIS POINTS)
// ============================================================================

// Tabla ISR: Tarifas por período (diario, semanal, decenal, catorcenal, quincenal, mensual)
export const catIsrTarifas = pgTable("cat_isr_tarifas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  anio: integer("anio").notNull(),
  periodo: varchar("periodo", { length: 20 }).notNull(), // 'mensual', 'quincenal', 'semanal', 'diario', 'catorcenal', 'decenal'
  limiteInferiorBp: bigint("limite_inferior_bp", { mode: "bigint" }).notNull(), // En basis points
  limiteSuperiorBp: bigint("limite_superior_bp", { mode: "bigint" }), // NULL para último rango
  cuotaFijaBp: bigint("cuota_fija_bp", { mode: "bigint" }).notNull(),
  tasaExcedenteBp: integer("tasa_excedente_bp").notNull(), // Tasa en basis points (10% = 1000 bp)
  orden: integer("orden").notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
}, (table) => ({
  uniquePeriodo: unique().on(table.anio, table.periodo, table.orden),
}));

export type CatIsrTarifa = typeof catIsrTarifas.$inferSelect;
export const insertCatIsrTarifaSchema = createInsertSchema(catIsrTarifas).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertCatIsrTarifa = z.infer<typeof insertCatIsrTarifaSchema>;

// Tabla Subsidio al Empleo
export const catSubsidioEmpleo = pgTable("cat_subsidio_empleo", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  anio: integer("anio").notNull(),
  periodo: varchar("periodo", { length: 20 }).notNull(),
  limiteInferiorBp: bigint("limite_inferior_bp", { mode: "bigint" }).notNull(),
  limiteSuperiorBp: bigint("limite_superior_bp", { mode: "bigint" }),
  subsidioBp: bigint("subsidio_bp", { mode: "bigint" }).notNull(), // Subsidio en basis points
  orden: integer("orden").notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
}, (table) => ({
  uniquePeriodo: unique().on(table.anio, table.periodo, table.orden),
}));

export type CatSubsidioEmpleo = typeof catSubsidioEmpleo.$inferSelect;
export const insertCatSubsidioEmpleoSchema = createInsertSchema(catSubsidioEmpleo).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertCatSubsidioEmpleo = z.infer<typeof insertCatSubsidioEmpleoSchema>;

// Configuración IMSS por año
export const catImssConfig = pgTable("cat_imss_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  anio: integer("anio").notNull().unique(),
  umaBp: bigint("uma_bp", { mode: "bigint" }).notNull(), // UMA en basis points
  salarioMinimoBp: bigint("salario_minimo_bp", { mode: "bigint" }).notNull(), // Salario mínimo en bp
  limiteSuperiorCotizacionUma: integer("limite_superior_cotizacion_uma").notNull().default(25), // 25 UMAs
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export type CatImssConfig = typeof catImssConfig.$inferSelect;
export const insertCatImssConfigSchema = createInsertSchema(catImssConfig).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertCatImssConfig = z.infer<typeof insertCatImssConfigSchema>;

// Cuotas IMSS (Ramos de Seguro)
export const catImssCuotas = pgTable("cat_imss_cuotas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  anio: integer("anio").notNull(),
  ramo: varchar("ramo", { length: 100 }).notNull(),
  concepto: varchar("concepto", { length: 255 }).notNull(),
  patronTasaBp: integer("patron_tasa_bp"), // Tasa patrón en basis points (5.5% = 550 bp)
  trabajadorTasaBp: integer("trabajador_tasa_bp"), // Tasa trabajador en basis points
  patronCuotaFijaBp: bigint("patron_cuota_fija_bp", { mode: "bigint" }), // Cuota fija patrón en bp
  trabajadorCuotaFijaBp: bigint("trabajador_cuota_fija_bp", { mode: "bigint" }), // Cuota fija trabajador en bp
  baseCalculo: varchar("base_calculo", { length: 50 }), // 'sbc', 'uma', 'excedente_3uma'
  aplicaLimiteSuperior: boolean("aplica_limite_superior").default(true),
  notas: text("notas"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
}, (table) => ({
  uniqueConcepto: unique().on(table.anio, table.ramo, table.concepto),
}));

export type CatImssCuota = typeof catImssCuotas.$inferSelect;
export const insertCatImssCuotaSchema = createInsertSchema(catImssCuotas).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertCatImssCuota = z.infer<typeof insertCatImssCuotaSchema>;

// Tasas Progresivas de Cesantía y Vejez (Reforma 2020-2030)
// Las cuotas patronales de CyV aumentan gradualmente según el nivel salarial
export const catCesantiaVejezTasas = pgTable("cat_cesantia_vejez_tasas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  anio: integer("anio").notNull(),
  orden: integer("orden").notNull(), // Para ordenar los rangos
  rangoDescripcion: varchar("rango_descripcion", { length: 100 }).notNull(), // "1.00 SM", "1.01 - 1.50 UMA", etc.
  limiteInferiorUma: numeric("limite_inferior_uma", { precision: 10, scale: 4 }).notNull(), // En múltiplos de UMA
  limiteSuperiorUma: numeric("limite_superior_uma", { precision: 10, scale: 4 }), // NULL = sin límite superior
  patronTasaBp: integer("patron_tasa_bp").notNull(), // Tasa patronal en basis points (315 = 3.15%)
  trabajadorTasaBp: integer("trabajador_tasa_bp").notNull().default(113), // Fija 1.125% para trabajador
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
}, (table) => ({
  uniqueRango: unique().on(table.anio, table.orden),
}));

export type CatCesantiaVejezTasa = typeof catCesantiaVejezTasas.$inferSelect;
export const insertCatCesantiaVejezTasaSchema = createInsertSchema(catCesantiaVejezTasas).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertCatCesantiaVejezTasa = z.infer<typeof insertCatCesantiaVejezTasaSchema>;

// Prima de Riesgo de Trabajo por Empresa
// Cada empresa tiene su propia prima según su clase y siniestralidad
export const catPrimasRiesgoTrabajo = pgTable("cat_primas_riesgo_trabajo", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  empresaId: varchar("empresa_id").notNull().references(() => empresas.id, { onDelete: "cascade" }),
  registroPatronalId: integer("registro_patronal_id"), // Opcional, puede variar por registro patronal
  anio: integer("anio").notNull(),
  claseRiesgo: integer("clase_riesgo").notNull(), // 1-5 según clasificación IMSS
  primaTasaBp: integer("prima_tasa_bp").notNull(), // Prima en basis points (50 = 0.50%, mínimo legal)
  primaMinimaBp: integer("prima_minima_bp").notNull().default(50), // 0.50% mínimo
  primaMaximaBp: integer("prima_maxima_bp").notNull().default(1500), // 15.00% máximo
  fechaActualizacion: date("fecha_actualizacion"), // Fecha de última actualización de siniestralidad
  notas: text("notas"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
}, (table) => ({
  uniqueEmpresaAnio: unique().on(table.empresaId, table.registroPatronalId, table.anio),
}));

export type CatPrimaRiesgoTrabajo = typeof catPrimasRiesgoTrabajo.$inferSelect;
export const insertCatPrimaRiesgoTrabajoSchema = createInsertSchema(catPrimasRiesgoTrabajo).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertCatPrimaRiesgoTrabajo = z.infer<typeof insertCatPrimaRiesgoTrabajoSchema>;

// ============================================================================
// SISTEMA DE NÓMINA - TABLAS CORE (CON MULTI-TENANCY)
// ============================================================================

// Conceptos de Nómina (Percepciones/Deducciones/Otros Pagos configurables)
// Categorías predefinidas para conceptos de nómina
export const categoriasConceptoNomina = [
  "salario",
  "prevision_social",
  "vales",
  "plan_privado_pensiones",
  "sindicato",
  "horas_extra",
  "prestaciones_ley",
  "bonos_incentivos",
  "descuentos",
  "impuestos",
  "otros"
] as const;
export type CategoriaConceptoNomina = typeof categoriasConceptoNomina[number];

export const conceptosNomina = pgTable("conceptos_nomina", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clienteId: varchar("cliente_id").notNull().references(() => clientes.id, { onDelete: "cascade" }),
  empresaId: varchar("empresa_id").notNull().references(() => empresas.id, { onDelete: "cascade" }),
  codigo: varchar("codigo", { length: 50 }).notNull(), // Código interno único por cliente
  nombre: varchar("nombre", { length: 255 }).notNull(),
  tipo: varchar("tipo", { length: 20 }).notNull(), // 'percepcion', 'deduccion', 'otro_pago'
  categoria: varchar("categoria", { length: 50 }).default("otros"), // Categoría para clasificar conceptos
  satClave: varchar("sat_clave", { length: 10 }), // Referencia a catálogos SAT
  naturaleza: varchar("naturaleza", { length: 20 }).notNull(), // 'ordinaria', 'extraordinaria', 'mixta'
  
  // Configuración fiscal
  gravado: boolean("gravado").notNull().default(true),
  integraSdi: boolean("integra_sdi").notNull().default(true), // ¿Integra Salario Diario Integrado?
  afectaIsr: boolean("afecta_isr").notNull().default(true),
  afectaImss: boolean("afecta_imss").notNull().default(true),
  
  // Fórmula de cálculo
  tipoCalculo: varchar("tipo_calculo", { length: 50 }).notNull(), // 'fijo', 'variable', 'formula', 'porcentaje', 'dias', 'horas'
  formula: text("formula"), // Fórmula JavaScript o SQL
  baseCalculo: varchar("base_calculo", { length: 50 }), // 'sueldo_base', 'sdi', 'percepciones_gravadas', etc.
  factor: decimal("factor", { precision: 18, scale: 6 }), // Factor multiplicador
  
  // Prioridad de cálculo
  ordenCalculo: integer("orden_calculo").notNull().default(100),
  
  // Configuración de display
  mostrarRecibo: boolean("mostrar_recibo").notNull().default(true),
  etiquetaRecibo: varchar("etiqueta_recibo", { length: 255 }),
  grupoRecibo: varchar("grupo_recibo", { length: 50 }), // Para agrupar en recibo
  
  // Medio de pago alternativo (opcional - si es null, se paga por nómina normal)
  medioPagoId: varchar("medio_pago_id").references(() => mediosPago.id, { onDelete: "set null" }),
  
  // Si el concepto forma parte del desglose del salario base (no suma al total, solo muestra)
  integraSalarioBase: boolean("integra_salario_base").notNull().default(false),
  
  // Multi-tenancy y auditoría
  centroTrabajoId: varchar("centro_trabajo_id"),
  activo: boolean("activo").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
}, (table) => ({
  uniqueCodigoClienteEmpresa: unique().on(table.clienteId, table.empresaId, table.codigo),
  clienteEmpresaIdx: index("conceptos_nomina_cliente_empresa_idx").on(table.clienteId, table.empresaId),
  tipoIdx: index("conceptos_nomina_tipo_idx").on(table.tipo),
  categoriaIdx: index("conceptos_nomina_categoria_idx").on(table.categoria),
  ordenIdx: index("conceptos_nomina_orden_idx").on(table.ordenCalculo),
  medioPagoIdx: index("conceptos_nomina_medio_pago_idx").on(table.medioPagoId),
}));

export type ConceptoNomina = typeof conceptosNomina.$inferSelect;
export const insertConceptoNominaSchema = createInsertSchema(conceptosNomina).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertConceptoNomina = z.infer<typeof insertConceptoNominaSchema>;

// Períodos de Nómina
export const periodosNomina = pgTable("periodos_nomina", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clienteId: varchar("cliente_id").notNull().references(() => clientes.id, { onDelete: "cascade" }),
  empresaId: varchar("empresa_id").notNull().references(() => empresas.id, { onDelete: "cascade" }),
  grupoNominaId: varchar("grupo_nomina_id").notNull().references(() => gruposNomina.id, { onDelete: "cascade" }),
  centroTrabajoId: varchar("centro_trabajo_id"),
  
  // Información del período
  tipoPeriodo: varchar("tipo_periodo", { length: 20 }).notNull(), // 'semanal', 'quincenal', 'decenal', 'catorcenal', 'mensual'
  numeroPeriodo: integer("numero_periodo").notNull(),
  anio: integer("anio").notNull(),
  fechaInicio: date("fecha_inicio").notNull(),
  fechaFin: date("fecha_fin").notNull(),
  fechaPago: date("fecha_pago").notNull(),
  
  // Días del período
  diasPeriodo: integer("dias_periodo").notNull(),
  diasLaborales: integer("dias_laborales").notNull(),
  
  // Estado del período
  estatus: varchar("estatus", { length: 20 }).notNull().default("abierto"), // 'abierto', 'calculado', 'autorizado', 'dispersado', 'timbrado', 'cerrado'
  fechaCalculo: timestamp("fecha_calculo"),
  fechaAutorizacion: timestamp("fecha_autorizacion"),
  fechaDispersion: timestamp("fecha_dispersion"),
  fechaTimbrado: timestamp("fecha_timbrado"),
  fechaCierre: timestamp("fecha_cierre"),
  
  // Totales del período (en basis points)
  totalPercepcionesBp: bigint("total_percepciones_bp", { mode: "bigint" }),
  totalDeduccionesBp: bigint("total_deducciones_bp", { mode: "bigint" }),
  totalNetoBp: bigint("total_neto_bp", { mode: "bigint" }),
  totalEmpleados: integer("total_empleados"),
  
  // Auditoría
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
  createdBy: varchar("created_by"),
}, (table) => ({
  uniquePeriodoClienteEmpresa: unique().on(table.clienteId, table.empresaId, table.tipoPeriodo, table.numeroPeriodo, table.anio),
  clienteEmpresaIdx: index("periodos_nomina_cliente_empresa_idx").on(table.clienteId, table.empresaId),
  estatusIdx: index("periodos_nomina_estatus_idx").on(table.estatus),
  fechaPagoIdx: index("periodos_nomina_fecha_pago_idx").on(table.fechaPago),
}));

export type PeriodoNomina = typeof periodosNomina.$inferSelect;
export const insertPeriodoNominaSchema = createInsertSchema(periodosNomina).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertPeriodoNomina = z.infer<typeof insertPeriodoNominaSchema>;

// Incidencias de Nómina
export const incidenciasNomina = pgTable("incidencias_nomina", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clienteId: varchar("cliente_id").notNull().references(() => clientes.id, { onDelete: "cascade" }),
  empresaId: varchar("empresa_id").notNull().references(() => empresas.id, { onDelete: "cascade" }),
  empleadoId: varchar("empleado_id").notNull(),
  periodoId: varchar("periodo_id").notNull().references(() => periodosNomina.id),
  
  // Información de la incidencia
  tipoIncidencia: varchar("tipo_incidencia", { length: 50 }).notNull(), // 'falta', 'retardo', 'permiso', 'incapacidad', 'vacaciones', 'hora_extra', 'bono', 'descuento'
  fecha: date("fecha").notNull(),
  conceptoId: varchar("concepto_id").references(() => conceptosNomina.id), // Referencia a conceptos_nomina
  
  // Valores
  cantidad: decimal("cantidad", { precision: 18, scale: 4 }), // Horas, días, etc.
  montoBp: bigint("monto_bp", { mode: "bigint" }), // Monto en basis points
  porcentaje: decimal("porcentaje", { precision: 10, scale: 4 }), // Para incapacidades
  
  // Justificación y documentos
  descripcion: text("descripcion"),
  justificada: boolean("justificada").default(false),
  documentoUrl: varchar("documento_url", { length: 500 }),
  
  // Estado
  estatus: varchar("estatus", { length: 20 }).notNull().default("pendiente"), // 'pendiente', 'aprobada', 'rechazada', 'aplicada'
  fechaAprobacion: timestamp("fecha_aprobacion"),
  aprobadoPor: varchar("aprobado_por"),
  notasRechazo: text("notas_rechazo"),
  
  // Auditoría
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
  createdBy: varchar("created_by"),
}, (table) => ({
  clienteEmpresaIdx: index("incidencias_nomina_cliente_empresa_idx").on(table.clienteId, table.empresaId),
  empleadoIdx: index("incidencias_nomina_empleado_idx").on(table.empleadoId),
  periodoIdx: index("incidencias_nomina_periodo_idx").on(table.periodoId),
  estatusIdx: index("incidencias_nomina_estatus_idx").on(table.estatus),
}));

export type IncidenciaNomina = typeof incidenciasNomina.$inferSelect;
export const insertIncidenciaNominaSchema = createInsertSchema(incidenciasNomina).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertIncidenciaNomina = z.infer<typeof insertIncidenciaNominaSchema>;

// Movimientos de Nómina (desglose por concepto)
export const nominaMovimientos = pgTable("nomina_movimientos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clienteId: varchar("cliente_id").notNull().references(() => clientes.id, { onDelete: "cascade" }),
  empresaId: varchar("empresa_id").notNull().references(() => empresas.id, { onDelete: "cascade" }),
  empleadoId: varchar("empleado_id").notNull(),
  periodoId: varchar("periodo_id").notNull().references(() => periodosNomina.id),
  conceptoId: varchar("concepto_id").notNull().references(() => conceptosNomina.id),
  
  // Valores del movimiento
  tipo: varchar("tipo", { length: 20 }).notNull(), // 'percepcion', 'deduccion', 'otro_pago'
  claveSat: varchar("clave_sat", { length: 10 }),
  conceptoNombre: varchar("concepto_nombre", { length: 255 }).notNull(),
  
  // Importes en basis points
  importeGravadoBp: bigint("importe_gravado_bp", { mode: "bigint" }).notNull().default(sql`0`),
  importeExentoBp: bigint("importe_exento_bp", { mode: "bigint" }).notNull().default(sql`0`),
  importeTotalBp: bigint("importe_total_bp", { mode: "bigint" }).notNull().default(sql`0`),
  
  // Detalles del cálculo
  cantidad: decimal("cantidad", { precision: 18, scale: 4 }), // Días, horas, unidades
  factor: decimal("factor", { precision: 18, scale: 6 }), // Factor aplicado
  formulaAplicada: text("formula_aplicada"), // Fórmula que se usó
  
  // Origen del movimiento
  origen: varchar("origen", { length: 50 }), // 'ordinario', 'incidencia', 'ajuste', 'retroactivo'
  incidenciaId: varchar("incidencia_id"),
  
  // Integración SDI
  integraSdi: boolean("integra_sdi").notNull().default(false),
  
  // Auditoría
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
}, (table) => ({
  clienteEmpresaIdx: index("nomina_movimientos_cliente_empresa_idx").on(table.clienteId, table.empresaId),
  empleadoIdx: index("nomina_movimientos_empleado_idx").on(table.empleadoId),
  periodoIdx: index("nomina_movimientos_periodo_idx").on(table.periodoId),
  conceptoIdx: index("nomina_movimientos_concepto_idx").on(table.conceptoId),
}));

export type NominaMovimiento = typeof nominaMovimientos.$inferSelect;
export const insertNominaMovimientoSchema = createInsertSchema(nominaMovimientos).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertNominaMovimiento = z.infer<typeof insertNominaMovimientoSchema>;

// Resumen de Nómina (totales por empleado)
export const nominaResumen = pgTable("nomina_resumen", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clienteId: varchar("cliente_id").notNull().references(() => clientes.id, { onDelete: "cascade" }),
  empresaId: varchar("empresa_id").notNull().references(() => empresas.id, { onDelete: "cascade" }),
  empleadoId: varchar("empleado_id").notNull(),
  periodoId: varchar("periodo_id").notNull().references(() => periodosNomina.id),
  
  // Totales en basis points
  percepcionesGravadasBp: bigint("percepciones_gravadas_bp", { mode: "bigint" }).notNull().default(sql`0`),
  percepcionesExentasBp: bigint("percepciones_exentas_bp", { mode: "bigint" }).notNull().default(sql`0`),
  totalPercepcionesBp: bigint("total_percepciones_bp", { mode: "bigint" }).notNull().default(sql`0`),
  
  // ISR y Subsidio
  isrCausadoBp: bigint("isr_causado_bp", { mode: "bigint" }).notNull().default(sql`0`),
  subsidioAplicadoBp: bigint("subsidio_aplicado_bp", { mode: "bigint" }).notNull().default(sql`0`),
  subsidioEntregableBp: bigint("subsidio_entregable_bp", { mode: "bigint" }).notNull().default(sql`0`),
  isrRetenidoBp: bigint("isr_retenido_bp", { mode: "bigint" }).notNull().default(sql`0`),
  
  // IMSS
  imssTrabajadorBp: bigint("imss_trabajador_bp", { mode: "bigint" }).notNull().default(sql`0`),
  imssPatronBp: bigint("imss_patron_bp", { mode: "bigint" }).notNull().default(sql`0`),
  
  // Otras deducciones
  totalOtrasDeduccionesBp: bigint("total_otras_deducciones_bp", { mode: "bigint" }).notNull().default(sql`0`),
  totalDeduccionesBp: bigint("total_deducciones_bp", { mode: "bigint" }).notNull().default(sql`0`),
  
  // Neto a pagar
  netoPagarBp: bigint("neto_pagar_bp", { mode: "bigint" }).notNull().default(sql`0`),
  
  // Días trabajados
  diasTrabajados: integer("dias_trabajados"),
  diasFaltas: integer("dias_faltas").default(0),
  horasExtra: decimal("horas_extra", { precision: 10, scale: 2 }).default("0"),
  
  // Auditoría
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
}, (table) => ({
  uniqueEmpleadoPeriodo: unique().on(table.empleadoId, table.periodoId),
  clienteEmpresaIdx: index("nomina_resumen_cliente_empresa_idx").on(table.clienteId, table.empresaId),
  empleadoIdx: index("nomina_resumen_empleado_idx").on(table.empleadoId),
  periodoIdx: index("nomina_resumen_periodo_idx").on(table.periodoId),
}));

export type NominaResumen = typeof nominaResumen.$inferSelect;
export const insertNominaResumenSchema = createInsertSchema(nominaResumen).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertNominaResumen = z.infer<typeof insertNominaResumenSchema>;

// ============================================================================
// NUEVO SISTEMA MODULAR DE PRESTACIONES
// ============================================================================
// Sistema de tres niveles: Esquema → Puesto → Empleado (aditivo)
// LFT es siempre la base, los "superiores" son adicionales

// Catálogo de tipos de beneficio
export const categoriasBeneficio = ["legal", "adicional"] as const;
export type CategoriaBeneficio = typeof categoriasBeneficio[number];

export const unidadesBeneficio = ["dias", "porcentaje", "monto_fijo", "porcentaje_salario"] as const;
export type UnidadBeneficio = typeof unidadesBeneficio[number];

export const tiposBeneficio = pgTable("tipos_beneficio", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  codigo: varchar("codigo", { length: 50 }).notNull().unique(),
  nombre: varchar("nombre", { length: 100 }).notNull(),
  descripcion: text("descripcion"),
  categoria: varchar("categoria", { length: 20 }).notNull(), // legal, adicional
  unidad: varchar("unidad", { length: 30 }).notNull(), // dias, porcentaje, monto_fijo, porcentaje_salario
  valorMinimoLegal: numeric("valor_minimo_legal", { precision: 10, scale: 2 }), // Valor mínimo según LFT (NULL si no aplica)
  afectaFactorIntegracion: boolean("afecta_factor_integracion").default(false),
  orden: integer("orden").default(0), // Para ordenar en UI
  activo: boolean("activo").default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertTipoBeneficioSchema = createInsertSchema(tiposBeneficio).omit({
  id: true,
  createdAt: true,
}).extend({
  categoria: z.enum(categoriasBeneficio),
  unidad: z.enum(unidadesBeneficio),
});

export type TipoBeneficio = typeof tiposBeneficio.$inferSelect;
export type InsertTipoBeneficio = z.infer<typeof insertTipoBeneficioSchema>;

// Esquemas de prestaciones (nombrados y configurables)
export const esquemasPresta = pgTable("esquemas_prestaciones", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clienteId: varchar("cliente_id").references(() => clientes.id, { onDelete: "cascade" }),
  empresaId: varchar("empresa_id").references(() => empresas.id, { onDelete: "cascade" }),
  nombre: varchar("nombre", { length: 100 }).notNull(),
  descripcion: text("descripcion"),
  esLey: boolean("es_ley").default(false), // TRUE = Es el esquema LFT base (read-only)
  activo: boolean("activo").default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
}, (table) => ({
  clienteEmpresaIdx: index("esquemas_prestaciones_cliente_empresa_idx").on(table.clienteId, table.empresaId),
}));

export const insertEsquemaPrestaSchema = createInsertSchema(esquemasPresta).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type EsquemaPresta = typeof esquemasPresta.$inferSelect;
export type InsertEsquemaPresta = z.infer<typeof insertEsquemaPrestaSchema>;

// Tabla de vacaciones por esquema (años → días)
export const esquemaVacaciones = pgTable("esquema_vacaciones", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  esquemaId: varchar("esquema_id").notNull().references(() => esquemasPresta.id, { onDelete: "cascade" }),
  aniosAntiguedad: integer("anios_antiguedad").notNull(), // 0, 1, 2, 3...
  diasVacaciones: integer("dias_vacaciones").notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
}, (table) => ({
  esquemaAniosIdx: unique().on(table.esquemaId, table.aniosAntiguedad),
}));

export const insertEsquemaVacacionesSchema = createInsertSchema(esquemaVacaciones).omit({
  id: true,
  createdAt: true,
}).extend({
  aniosAntiguedad: z.coerce.number().int().min(0),
  diasVacaciones: z.coerce.number().int().min(1),
});

export type EsquemaVacacionesRow = typeof esquemaVacaciones.$inferSelect;
export type InsertEsquemaVacacionesRow = z.infer<typeof insertEsquemaVacacionesSchema>;

// Beneficios configurados por esquema (primas, aguinaldo, vales, etc.)
export const esquemaBeneficios = pgTable("esquema_beneficios", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  esquemaId: varchar("esquema_id").notNull().references(() => esquemasPresta.id, { onDelete: "cascade" }),
  tipoBeneficioId: varchar("tipo_beneficio_id").notNull().references(() => tiposBeneficio.id, { onDelete: "cascade" }),
  valor: numeric("valor", { precision: 10, scale: 2 }).notNull(), // Según unidad del tipo
  activo: boolean("activo").default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
}, (table) => ({
  esquemaTipoIdx: unique().on(table.esquemaId, table.tipoBeneficioId),
}));

export const insertEsquemaBeneficioSchema = createInsertSchema(esquemaBeneficios).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  valor: z.coerce.number(),
});

export type EsquemaBeneficio = typeof esquemaBeneficios.$inferSelect;
export type InsertEsquemaBeneficio = z.infer<typeof insertEsquemaBeneficioSchema>;

// Beneficios adicionales por puesto (sobre el esquema)
export const puestoBeneficiosExtra = pgTable("puesto_beneficios_extra", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  puestoId: varchar("puesto_id").notNull().references(() => puestos.id, { onDelete: "cascade" }),
  tipoBeneficioId: varchar("tipo_beneficio_id").notNull().references(() => tiposBeneficio.id, { onDelete: "cascade" }),
  valorExtra: numeric("valor_extra", { precision: 10, scale: 2 }).notNull(), // Adicional al esquema
  activo: boolean("activo").default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
}, (table) => ({
  puestoTipoIdx: unique().on(table.puestoId, table.tipoBeneficioId),
}));

export const insertPuestoBeneficioExtraSchema = createInsertSchema(puestoBeneficiosExtra).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  valorExtra: z.coerce.number(),
});

export type PuestoBeneficioExtra = typeof puestoBeneficiosExtra.$inferSelect;
export type InsertPuestoBeneficioExtra = z.infer<typeof insertPuestoBeneficioExtraSchema>;

// Beneficios adicionales por empleado (sobre puesto + esquema)
export const empleadoBeneficiosExtra = pgTable("empleado_beneficios_extra", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  empleadoId: varchar("empleado_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  tipoBeneficioId: varchar("tipo_beneficio_id").notNull().references(() => tiposBeneficio.id, { onDelete: "cascade" }),
  valorExtra: numeric("valor_extra", { precision: 10, scale: 2 }).notNull(), // Adicional al puesto
  activo: boolean("activo").default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
}, (table) => ({
  empleadoTipoIdx: unique().on(table.empleadoId, table.tipoBeneficioId),
}));

export const insertEmpleadoBeneficioExtraSchema = createInsertSchema(empleadoBeneficiosExtra).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  valorExtra: z.coerce.number(),
});

export type EmpleadoBeneficioExtra = typeof empleadoBeneficiosExtra.$inferSelect;
export type InsertEmpleadoBeneficioExtra = z.infer<typeof insertEmpleadoBeneficioExtraSchema>;

// ============================================================================
// CATÁLOGOS GEOGRÁFICOS (Requeridos para CFDI)
// ============================================================================

export const catPaises = pgTable("cat_paises", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  codigo: varchar("codigo", { length: 3 }).notNull().unique(), // ISO 3166-1 alpha-3
  nombre: varchar("nombre", { length: 100 }).notNull(),
  activo: boolean("activo").default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export type CatPais = typeof catPaises.$inferSelect;
export const insertCatPaisSchema = createInsertSchema(catPaises).omit({
  id: true,
  createdAt: true,
});
export type InsertCatPais = z.infer<typeof insertCatPaisSchema>;

export const catEstados = pgTable("cat_estados", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  paisId: varchar("pais_id").references(() => catPaises.id),
  codigo: varchar("codigo", { length: 10 }).notNull(),
  nombre: varchar("nombre", { length: 100 }).notNull(),
  codigoSat: varchar("codigo_sat", { length: 3 }), // Código SAT para CFDI
  activo: boolean("activo").default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
}, (table) => ({
  paisCodigoIdx: unique().on(table.paisId, table.codigo),
}));

export type CatEstado = typeof catEstados.$inferSelect;
export const insertCatEstadoSchema = createInsertSchema(catEstados).omit({
  id: true,
  createdAt: true,
});
export type InsertCatEstado = z.infer<typeof insertCatEstadoSchema>;

export const catMunicipios = pgTable("cat_municipios", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  estadoId: varchar("estado_id").references(() => catEstados.id),
  codigo: varchar("codigo", { length: 10 }).notNull(),
  nombre: varchar("nombre", { length: 200 }).notNull(),
  activo: boolean("activo").default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
}, (table) => ({
  estadoIdx: index("cat_municipios_estado_idx").on(table.estadoId),
}));

export type CatMunicipio = typeof catMunicipios.$inferSelect;
export const insertCatMunicipioSchema = createInsertSchema(catMunicipios).omit({
  id: true,
  createdAt: true,
});
export type InsertCatMunicipio = z.infer<typeof insertCatMunicipioSchema>;

export const catCodigosPostales = pgTable("cat_codigos_postales", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  codigoPostal: varchar("codigo_postal", { length: 5 }).notNull(),
  colonia: varchar("colonia", { length: 200 }).notNull(),
  municipioId: varchar("municipio_id").references(() => catMunicipios.id),
  tipoAsentamiento: varchar("tipo_asentamiento", { length: 50 }),
  activo: boolean("activo").default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
}, (table) => ({
  cpIdx: index("cat_cp_codigo_idx").on(table.codigoPostal),
  municipioIdx: index("cat_cp_municipio_idx").on(table.municipioId),
}));

export type CatCodigoPostal = typeof catCodigosPostales.$inferSelect;
export const insertCatCodigoPostalSchema = createInsertSchema(catCodigosPostales).omit({
  id: true,
  createdAt: true,
});
export type InsertCatCodigoPostal = z.infer<typeof insertCatCodigoPostalSchema>;

// ============================================================================
// CATÁLOGO DE BANCOS (Códigos SAT)
// ============================================================================

export const catBancos = pgTable("cat_bancos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  codigoSat: varchar("codigo_sat", { length: 3 }).notNull().unique(),
  nombreCorto: varchar("nombre_corto", { length: 50 }).notNull(),
  nombreCompleto: varchar("nombre_completo", { length: 200 }),
  longitudCuenta: integer("longitud_cuenta"),
  longitudClabe: integer("longitud_clabe").default(18),
  activo: boolean("activo").default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export type CatBanco = typeof catBancos.$inferSelect;
export const insertCatBancoSchema = createInsertSchema(catBancos).omit({
  id: true,
  createdAt: true,
});
export type InsertCatBanco = z.infer<typeof insertCatBancoSchema>;

// ============================================================================
// CATÁLOGO DE VALORES UMA/SMG (Por vigencia)
// ============================================================================

export const tiposUmaSmg = ["UMA", "SMG", "SMG_FRONTERA"] as const;
export type TipoUmaSmg = typeof tiposUmaSmg[number];

export const catValoresUmaSmg = pgTable("cat_valores_uma_smg", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tipo: varchar("tipo", { length: 20 }).notNull(), // 'UMA', 'SMG', 'SMG_FRONTERA'
  valorDiario: numeric("valor_diario", { precision: 10, scale: 2 }).notNull(),
  valorMensual: numeric("valor_mensual", { precision: 12, scale: 2 }).notNull(),
  valorAnual: numeric("valor_anual", { precision: 14, scale: 2 }).notNull(),
  vigenciaDesde: date("vigencia_desde").notNull(),
  vigenciaHasta: date("vigencia_hasta"), // NULL = vigente
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
}, (table) => ({
  tipoVigenciaIdx: unique().on(table.tipo, table.vigenciaDesde),
}));

export type CatValorUmaSmg = typeof catValoresUmaSmg.$inferSelect;
export const insertCatValorUmaSmgSchema = createInsertSchema(catValoresUmaSmg).omit({
  id: true,
  createdAt: true,
}).extend({
  valorDiario: z.coerce.number(),
  valorMensual: z.coerce.number(),
  valorAnual: z.coerce.number(),
});
export type InsertCatValorUmaSmg = z.infer<typeof insertCatValorUmaSmgSchema>;

// ============================================================================
// KARDEX DE COMPENSACIÓN (Historial de cambios salariales)
// ============================================================================

export const tiposOperacionKardex = ["alta", "modificacion", "correccion", "baja"] as const;
export type TipoOperacionKardex = typeof tiposOperacionKardex[number];

export const tiposIncrementoSalario = ["anual", "promocion", "ajuste_mercado", "minimo", "antiguedad", "evaluacion", "otro"] as const;
export type TipoIncrementoSalario = typeof tiposIncrementoSalario[number];

export const kardexCompensation = pgTable("kardex_compensation", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clienteId: varchar("cliente_id").notNull().references(() => clientes.id, { onDelete: "cascade" }),
  empresaId: varchar("empresa_id").notNull().references(() => empresas.id, { onDelete: "cascade" }),
  empleadoId: varchar("empleado_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  
  operacion: varchar("operacion", { length: 20 }).notNull().default("modificacion"), // alta, modificacion, correccion, baja
  fechaMovimiento: timestamp("fecha_movimiento").notNull().default(sql`now()`),
  fechaEfectiva: date("fecha_efectiva").notNull(),
  
  // Valores anteriores
  salarioDiarioAnterior: numeric("salario_diario_anterior", { precision: 12, scale: 2 }),
  salarioDiarioNominalAnterior: numeric("salario_diario_nominal_anterior", { precision: 12, scale: 2 }),
  sbcAnterior: numeric("sbc_anterior", { precision: 12, scale: 2 }),
  sdiAnterior: numeric("sdi_anterior", { precision: 12, scale: 2 }),
  
  // Valores nuevos
  salarioDiarioNuevo: numeric("salario_diario_nuevo", { precision: 12, scale: 2 }),
  salarioDiarioNominalNuevo: numeric("salario_diario_nominal_nuevo", { precision: 12, scale: 2 }),
  sbcNuevo: numeric("sbc_nuevo", { precision: 12, scale: 2 }),
  sdiNuevo: numeric("sdi_nuevo", { precision: 12, scale: 2 }),
  
  // Contexto
  motivo: varchar("motivo", { length: 200 }),
  tipoIncremento: varchar("tipo_incremento", { length: 50 }), // anual, promocion, ajuste_mercado, minimo, etc.
  porcentajeIncremento: numeric("porcentaje_incremento", { precision: 6, scale: 2 }),
  documentoSoporte: varchar("documento_soporte", { length: 500 }),
  
  // Enlace IMSS (para movimientos que requieren aviso)
  imssMovimientoId: varchar("imss_movimiento_id"),
  
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  createdBy: varchar("created_by"),
}, (table) => ({
  empleadoIdx: index("kardex_compensation_empleado_idx").on(table.empleadoId),
  fechaIdx: index("kardex_compensation_fecha_idx").on(table.fechaEfectiva),
  clienteEmpresaIdx: index("kardex_compensation_cliente_empresa_idx").on(table.clienteId, table.empresaId),
}));

export type KardexCompensation = typeof kardexCompensation.$inferSelect;
export const insertKardexCompensationSchema = createInsertSchema(kardexCompensation).omit({
  id: true,
  createdAt: true,
}).extend({
  salarioDiarioAnterior: z.coerce.number().optional().nullable(),
  salarioDiarioNominalAnterior: z.coerce.number().optional().nullable(),
  sbcAnterior: z.coerce.number().optional().nullable(),
  sdiAnterior: z.coerce.number().optional().nullable(),
  salarioDiarioNuevo: z.coerce.number().optional().nullable(),
  salarioDiarioNominalNuevo: z.coerce.number().optional().nullable(),
  sbcNuevo: z.coerce.number().optional().nullable(),
  sdiNuevo: z.coerce.number().optional().nullable(),
  porcentajeIncremento: z.coerce.number().optional().nullable(),
});
export type InsertKardexCompensation = z.infer<typeof insertKardexCompensationSchema>;

// ============================================================================
// KARDEX DE EMPLEO (Historial de cambios de estatus, registro patronal, contrato)
// ============================================================================

export const kardexEmployment = pgTable("kardex_employment", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clienteId: varchar("cliente_id").notNull().references(() => clientes.id, { onDelete: "cascade" }),
  empresaId: varchar("empresa_id").notNull().references(() => empresas.id, { onDelete: "cascade" }),
  empleadoId: varchar("empleado_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  
  operacion: varchar("operacion", { length: 20 }).notNull().default("modificacion"), // alta, modificacion, correccion, baja
  fechaMovimiento: timestamp("fecha_movimiento").notNull().default(sql`now()`),
  fechaEfectiva: date("fecha_efectiva").notNull(),
  
  campoModificado: varchar("campo_modificado", { length: 50 }).notNull(), // estatus, registro_patronal, tipo_contrato, etc.
  valorAnterior: text("valor_anterior"),
  valorNuevo: text("valor_nuevo"),
  
  motivo: varchar("motivo", { length: 200 }),
  documentoSoporte: varchar("documento_soporte", { length: 500 }),
  
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  createdBy: varchar("created_by"),
}, (table) => ({
  empleadoIdx: index("kardex_employment_empleado_idx").on(table.empleadoId),
  fechaIdx: index("kardex_employment_fecha_idx").on(table.fechaEfectiva),
  campoIdx: index("kardex_employment_campo_idx").on(table.campoModificado),
  clienteEmpresaIdx: index("kardex_employment_cliente_empresa_idx").on(table.clienteId, table.empresaId),
}));

export type KardexEmployment = typeof kardexEmployment.$inferSelect;
export const insertKardexEmploymentSchema = createInsertSchema(kardexEmployment).omit({
  id: true,
  createdAt: true,
});
export type InsertKardexEmployment = z.infer<typeof insertKardexEmploymentSchema>;

// ============================================================================
// KARDEX DE CONDICIONES LABORALES (Historial de cambios de puesto, depto, jornada)
// ============================================================================

export const kardexLaborConditions = pgTable("kardex_labor_conditions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clienteId: varchar("cliente_id").notNull().references(() => clientes.id, { onDelete: "cascade" }),
  empresaId: varchar("empresa_id").notNull().references(() => empresas.id, { onDelete: "cascade" }),
  empleadoId: varchar("empleado_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  
  operacion: varchar("operacion", { length: 20 }).notNull().default("modificacion"), // alta, modificacion, correccion, baja
  fechaMovimiento: timestamp("fecha_movimiento").notNull().default(sql`now()`),
  fechaEfectiva: date("fecha_efectiva").notNull(),
  
  campoModificado: varchar("campo_modificado", { length: 50 }).notNull(), // puesto, departamento, jornada, horario, modalidad, etc.
  valorAnterior: text("valor_anterior"),
  valorNuevo: text("valor_nuevo"),
  valorAnteriorId: varchar("valor_anterior_id"), // Para FK (puestoId, departamentoId)
  valorNuevoId: varchar("valor_nuevo_id"),
  
  motivo: varchar("motivo", { length: 200 }),
  documentoSoporte: varchar("documento_soporte", { length: 500 }),
  
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  createdBy: varchar("created_by"),
}, (table) => ({
  empleadoIdx: index("kardex_labor_empleado_idx").on(table.empleadoId),
  fechaIdx: index("kardex_labor_fecha_idx").on(table.fechaEfectiva),
  campoIdx: index("kardex_labor_campo_idx").on(table.campoModificado),
  clienteEmpresaIdx: index("kardex_labor_cliente_empresa_idx").on(table.clienteId, table.empresaId),
}));

export type KardexLaborConditions = typeof kardexLaborConditions.$inferSelect;
export const insertKardexLaborConditionsSchema = createInsertSchema(kardexLaborConditions).omit({
  id: true,
  createdAt: true,
});
export type InsertKardexLaborConditions = z.infer<typeof insertKardexLaborConditionsSchema>;

// ============================================================================
// CUENTAS BANCARIAS DE EMPLEADOS (Multi-cuenta con porcentajes de dispersión)
// ============================================================================

export const employeeBankAccounts = pgTable("employee_bank_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clienteId: varchar("cliente_id").notNull().references(() => clientes.id, { onDelete: "cascade" }),
  empresaId: varchar("empresa_id").notNull().references(() => empresas.id, { onDelete: "cascade" }),
  empleadoId: varchar("empleado_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  
  bancoId: varchar("banco_id").references(() => catBancos.id),
  bancoNombre: varchar("banco_nombre", { length: 100 }),
  clabe: varchar("clabe", { length: 18 }),
  cuenta: varchar("cuenta", { length: 20 }),
  sucursal: varchar("sucursal", { length: 20 }),
  
  tipoCuenta: varchar("tipo_cuenta", { length: 50 }).default("nomina"), // nomina, ahorro, cheques
  porcentajeDispersion: numeric("porcentaje_dispersion", { precision: 5, scale: 2 }).default("100.00"),
  montoFijoDispersion: numeric("monto_fijo_dispersion", { precision: 12, scale: 2 }),
  
  isPrimary: boolean("is_primary").default(false),
  isActive: boolean("is_active").default(true),
  
  effectiveFrom: date("effective_from").default(sql`CURRENT_DATE`),
  effectiveTo: date("effective_to"),
  
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  createdBy: varchar("created_by"),
}, (table) => ({
  empleadoIdx: index("employee_bank_empleado_idx").on(table.empleadoId),
  activeIdx: index("employee_bank_active_idx").on(table.empleadoId, table.isActive),
  clienteEmpresaIdx: index("employee_bank_cliente_empresa_idx").on(table.clienteId, table.empresaId),
}));

export type EmployeeBankAccount = typeof employeeBankAccounts.$inferSelect;
export const insertEmployeeBankAccountSchema = createInsertSchema(employeeBankAccounts).omit({
  id: true,
  createdAt: true,
}).extend({
  porcentajeDispersion: z.coerce.number().optional(),
  montoFijoDispersion: z.coerce.number().optional().nullable(),
});
export type InsertEmployeeBankAccount = z.infer<typeof insertEmployeeBankAccountSchema>;

// ============================================================================
// KARDEX DE CUENTAS BANCARIAS (Historial de cambios en cuentas)
// ============================================================================

export const kardexBankAccounts = pgTable("kardex_bank_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clienteId: varchar("cliente_id").notNull().references(() => clientes.id, { onDelete: "cascade" }),
  empresaId: varchar("empresa_id").notNull().references(() => empresas.id, { onDelete: "cascade" }),
  empleadoId: varchar("empleado_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  bankAccountId: varchar("bank_account_id").references(() => employeeBankAccounts.id),
  
  operacion: varchar("operacion", { length: 20 }).notNull(), // alta, modificacion, baja
  fechaMovimiento: timestamp("fecha_movimiento").notNull().default(sql`now()`),
  
  campoModificado: varchar("campo_modificado", { length: 50 }),
  valorAnterior: text("valor_anterior"),
  valorNuevo: text("valor_nuevo"),
  
  motivo: varchar("motivo", { length: 200 }),
  
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  createdBy: varchar("created_by"),
}, (table) => ({
  empleadoIdx: index("kardex_bank_empleado_idx").on(table.empleadoId),
  bankAccountIdx: index("kardex_bank_account_idx").on(table.bankAccountId),
  clienteEmpresaIdx: index("kardex_bank_cliente_empresa_idx").on(table.clienteId, table.empresaId),
}));

export type KardexBankAccount = typeof kardexBankAccounts.$inferSelect;
export const insertKardexBankAccountSchema = createInsertSchema(kardexBankAccounts).omit({
  id: true,
  createdAt: true,
});
export type InsertKardexBankAccount = z.infer<typeof insertKardexBankAccountSchema>;

// ============================================================================
// CFDI NÓMINA (Seguimiento de CFDIs timbrados)
// ============================================================================

export const estatusCfdi = ["pendiente", "timbrado", "cancelado"] as const;
export type EstatusCfdi = typeof estatusCfdi[number];

export const tiposNominaCfdi = ["O", "E"] as const; // O=Ordinaria, E=Extraordinaria
export type TipoNominaCfdi = typeof tiposNominaCfdi[number];

export const cfdiNomina = pgTable("cfdi_nomina", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clienteId: varchar("cliente_id").notNull().references(() => clientes.id, { onDelete: "cascade" }),
  empresaId: varchar("empresa_id").notNull().references(() => empresas.id, { onDelete: "cascade" }),
  empleadoId: varchar("empleado_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  periodoNominaId: varchar("periodo_nomina_id").notNull().references(() => periodosNomina.id, { onDelete: "cascade" }),
  nominaResumenId: varchar("nomina_resumen_id").references(() => nominaResumen.id),
  
  // Identificación CFDI
  uuidFiscal: varchar("uuid_fiscal", { length: 36 }).unique(),
  serie: varchar("serie", { length: 10 }),
  folio: varchar("folio", { length: 30 }),
  
  // Fechas clave
  fechaTimbrado: timestamp("fecha_timbrado"),
  fechaEmision: timestamp("fecha_emision"),
  
  // Montos
  subtotal: numeric("subtotal", { precision: 14, scale: 2 }),
  descuento: numeric("descuento", { precision: 14, scale: 2 }),
  total: numeric("total", { precision: 14, scale: 2 }),
  
  // Campos complemento nómina
  tipoNomina: varchar("tipo_nomina", { length: 1 }), // O=Ordinaria, E=Extraordinaria
  fechaPago: date("fecha_pago"),
  fechaInicioPago: date("fecha_inicio_pago"),
  fechaFinPago: date("fecha_fin_pago"),
  numDiasPagados: numeric("num_dias_pagados", { precision: 6, scale: 2 }),
  totalPercepciones: numeric("total_percepciones", { precision: 14, scale: 2 }),
  totalDeducciones: numeric("total_deducciones", { precision: 14, scale: 2 }),
  totalOtrosPagos: numeric("total_otros_pagos", { precision: 14, scale: 2 }),
  
  // Estatus
  estatus: varchar("estatus", { length: 20 }).notNull().default("pendiente"), // pendiente, timbrado, cancelado
  fechaCancelacion: timestamp("fecha_cancelacion"),
  motivoCancelacion: varchar("motivo_cancelacion", { length: 200 }),
  uuidSustitucion: varchar("uuid_sustitucion", { length: 36 }),
  
  // Referencia a almacenamiento
  storageBucket: varchar("storage_bucket", { length: 100 }),
  storagePath: varchar("storage_path", { length: 500 }), // e.g., "cfdi/2024/01/uuid.xml"
  xmlHash: varchar("xml_hash", { length: 64 }), // SHA-256
  
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
}, (table) => ({
  empleadoIdx: index("cfdi_nomina_empleado_idx").on(table.empleadoId),
  periodoIdx: index("cfdi_nomina_periodo_idx").on(table.periodoNominaId),
  uuidIdx: index("cfdi_nomina_uuid_idx").on(table.uuidFiscal),
  estatusIdx: index("cfdi_nomina_estatus_idx").on(table.estatus),
  clienteEmpresaIdx: index("cfdi_nomina_cliente_empresa_idx").on(table.clienteId, table.empresaId),
}));

export type CfdiNomina = typeof cfdiNomina.$inferSelect;
export const insertCfdiNominaSchema = createInsertSchema(cfdiNomina).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  subtotal: z.coerce.number().optional().nullable(),
  descuento: z.coerce.number().optional().nullable(),
  total: z.coerce.number().optional().nullable(),
  numDiasPagados: z.coerce.number().optional().nullable(),
  totalPercepciones: z.coerce.number().optional().nullable(),
  totalDeducciones: z.coerce.number().optional().nullable(),
  totalOtrosPagos: z.coerce.number().optional().nullable(),
});
export type InsertCfdiNomina = z.infer<typeof insertCfdiNominaSchema>;

// ============================================================================
// PHASE 2: IMSS Movimientos Afiliatorios
// ============================================================================

export const tiposMovimientoImss = ["alta", "baja", "modificacion_salario", "reingreso"] as const;
export type TipoMovimientoImss = typeof tiposMovimientoImss[number];

export const estatusMovimientoImss = ["pendiente", "enviado", "aceptado", "rechazado"] as const;
export type EstatusMovimientoImss = typeof estatusMovimientoImss[number];

export const imssMovimientos = pgTable("imss_movimientos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clienteId: varchar("cliente_id").notNull().references(() => clientes.id, { onDelete: "cascade" }),
  empresaId: varchar("empresa_id").notNull().references(() => empresas.id, { onDelete: "cascade" }),
  empleadoId: varchar("empleado_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  registroPatronalId: varchar("registro_patronal_id").references(() => registrosPatronales.id, { onDelete: "set null" }),
  kardexCompensationId: varchar("kardex_compensation_id").references(() => kardexCompensation.id, { onDelete: "set null" }),
  
  tipoMovimiento: varchar("tipo_movimiento", { length: 30 }).notNull(), // alta, baja, modificacion_salario, reingreso
  fechaMovimiento: date("fecha_movimiento").notNull(), // Fecha efectiva del movimiento
  fechaPresentacionImss: date("fecha_presentacion_imss"), // Fecha en que se presentó ante IMSS
  estatus: varchar("estatus", { length: 20 }).notNull().default("pendiente"), // pendiente, enviado, aceptado, rechazado
  
  nss: varchar("nss", { length: 11 }), // Snapshot del NSS al momento del movimiento
  sbcDecimal: numeric("sbc_decimal", { precision: 12, scale: 4 }), // SBC en decimal
  sbcBp: bigint("sbc_bp", { mode: "bigint" }), // SBC en basis points (autoridad)
  
  numeroAcuse: varchar("numero_acuse", { length: 50 }), // Número de acuse de IMSS
  folioMovimiento: varchar("folio_movimiento", { length: 50 }), // Folio interno
  
  motivoBaja: varchar("motivo_baja", { length: 10 }), // Código SAT catálogo motivo baja (1-7)
  fechaBaja: date("fecha_baja"), // Para movimientos tipo baja
  
  observaciones: text("observaciones"),
  motivoRechazo: text("motivo_rechazo"), // Si IMSS rechazó el movimiento
  
  registradoPor: varchar("registrado_por", { length: 100 }),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
}, (table) => ({
  empleadoIdx: index("imss_movimientos_empleado_idx").on(table.empleadoId),
  fechaIdx: index("imss_movimientos_fecha_idx").on(table.fechaMovimiento),
  estatusIdx: index("imss_movimientos_estatus_idx").on(table.estatus),
  tipoIdx: index("imss_movimientos_tipo_idx").on(table.tipoMovimiento),
  registroPatronalIdx: index("imss_movimientos_reg_patronal_idx").on(table.registroPatronalId),
  clienteEmpresaIdx: index("imss_movimientos_cliente_empresa_idx").on(table.clienteId, table.empresaId),
}));

export type ImssMovimiento = typeof imssMovimientos.$inferSelect;
export const insertImssMovimientoSchema = createInsertSchema(imssMovimientos).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  tipoMovimiento: z.enum(tiposMovimientoImss),
  estatus: z.enum(estatusMovimientoImss).optional(),
  sbcDecimal: z.coerce.number().optional().nullable(),
});
export type InsertImssMovimiento = z.infer<typeof insertImssMovimientoSchema>;

// ============================================================================
// PHASE 2: SUA Bimestres - Control de cuotas bimestrales IMSS
// ============================================================================

export const estatusSuaBimestre = ["pendiente", "calculado", "archivo_generado", "pagado", "vencido"] as const;
export type EstatusSuaBimestre = typeof estatusSuaBimestre[number];

export const suaBimestres = pgTable("sua_bimestres", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clienteId: varchar("cliente_id").notNull().references(() => clientes.id, { onDelete: "cascade" }),
  empresaId: varchar("empresa_id").notNull().references(() => empresas.id, { onDelete: "cascade" }),
  registroPatronalId: varchar("registro_patronal_id").notNull().references(() => registrosPatronales.id, { onDelete: "cascade" }),
  
  ejercicio: integer("ejercicio").notNull(), // Año (2024, 2025, etc.)
  bimestre: integer("bimestre").notNull(), // 1=Ene-Feb, 2=Mar-Abr, 3=May-Jun, 4=Jul-Ago, 5=Sep-Oct, 6=Nov-Dic
  
  fechaInicioPeriodo: date("fecha_inicio_periodo").notNull(),
  fechaFinPeriodo: date("fecha_fin_periodo").notNull(),
  fechaLimitePago: date("fecha_limite_pago"), // Día 17 del mes siguiente al bimestre
  
  // Importes calculados y pagados
  importePatronBp: bigint("importe_patron_bp", { mode: "bigint" }), // Cuotas patrón en basis points
  importeTrabajadorBp: bigint("importe_trabajador_bp", { mode: "bigint" }), // Cuotas trabajador en basis points
  importeTotalBp: bigint("importe_total_bp", { mode: "bigint" }), // Total en basis points
  importeTotalDecimal: numeric("importe_total_decimal", { precision: 14, scale: 2 }), // Total en decimal
  
  importePagadoBp: bigint("importe_pagado_bp", { mode: "bigint" }), // Monto efectivamente pagado
  importePagadoDecimal: numeric("importe_pagado_decimal", { precision: 14, scale: 2 }),
  
  diferenciaBp: bigint("diferencia_bp", { mode: "bigint" }), // Diferencia (pagado - calculado)
  
  // Datos de generación de archivo
  fechaCalculo: timestamp("fecha_calculo"), // Cuando se calcularon las cuotas
  fechaGeneracionArchivo: timestamp("fecha_generacion_archivo"),
  archivoNombre: varchar("archivo_nombre", { length: 200 }), // Nombre del archivo SUA
  archivoPath: varchar("archivo_path", { length: 500 }), // Ruta en object storage
  archivoHash: varchar("archivo_hash", { length: 64 }), // SHA-256 del archivo
  
  // Datos de pago
  fechaPago: date("fecha_pago"),
  lineaCaptura: varchar("linea_captura", { length: 100 }),
  bancoRecaudador: varchar("banco_recaudador", { length: 100 }),
  folioComprobante: varchar("folio_comprobante", { length: 100 }),
  
  estatus: varchar("estatus", { length: 20 }).notNull().default("pendiente"),
  
  // Conteo de empleados
  numEmpleados: integer("num_empleados"), // Empleados incluidos en el bimestre
  
  notas: text("notas"),
  registradoPor: varchar("registrado_por", { length: 100 }),
  
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
}, (table) => ({
  registroPatronalBimestreUnique: unique().on(table.registroPatronalId, table.ejercicio, table.bimestre),
  ejercicioBimestreIdx: index("sua_bimestres_ejercicio_bimestre_idx").on(table.ejercicio, table.bimestre),
  estatusIdx: index("sua_bimestres_estatus_idx").on(table.estatus),
  clienteEmpresaIdx: index("sua_bimestres_cliente_empresa_idx").on(table.clienteId, table.empresaId),
}));

export type SuaBimestre = typeof suaBimestres.$inferSelect;
export const insertSuaBimestreSchema = createInsertSchema(suaBimestres).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  estatus: z.enum(estatusSuaBimestre).optional(),
  importeTotalDecimal: z.coerce.number().optional().nullable(),
  importePagadoDecimal: z.coerce.number().optional().nullable(),
});
export type InsertSuaBimestre = z.infer<typeof insertSuaBimestreSchema>;

// ============================================================================
// COMPENSACIÓN TRABAJADOR - Paquete de compensación con vigencias (Dato ancla)
// Soporta esquemas BRUTO y NETO
// ============================================================================

export const tiposEsquemaCompensacion = ["BRUTO", "NETO"] as const;
export type TipoEsquemaCompensacion = typeof tiposEsquemaCompensacion[number];

export const compensacionTrabajador = pgTable("compensacion_trabajador", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clienteId: varchar("cliente_id").notNull().references(() => clientes.id, { onDelete: "cascade" }),
  empresaId: varchar("empresa_id").notNull().references(() => empresas.id, { onDelete: "cascade" }),
  empleadoId: varchar("empleado_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  
  // Tipo de esquema - canonical source for this compensation package
  esquemaTipo: varchar("esquema_tipo").default("NETO"), // 'BRUTO' | 'NETO'
  
  // Vigencia del paquete de compensación
  vigenciaDesde: date("vigencia_desde").notNull(),
  vigenciaHasta: date("vigencia_hasta"), // NULL = vigente actualmente
  
  // Dato ancla según esquema_tipo
  netoDeseadoBp: bigint("neto_deseado_bp", { mode: "bigint" }), // Neto mensual en basis points (ancla para NETO)
  salarioDiarioBp: bigint("salario_diario_bp", { mode: "bigint" }), // Salario diario en basis points (ancla para BRUTO)
  
  // Distribución del paquete (montos fijos mensuales en basis points)
  previsionSocialBp: bigint("prevision_social_bp", { mode: "bigint" }),
  premioPuntualidadBp: bigint("premio_puntualidad_bp", { mode: "bigint" }),
  premioAsistenciaBp: bigint("premio_asistencia_bp", { mode: "bigint" }),
  fondoAhorroBp: bigint("fondo_ahorro_bp", { mode: "bigint" }),
  valesDespensaBp: bigint("vales_despensa_bp", { mode: "bigint" }),
  
  // Campos adicionales de distribución
  otrosConceptosBp: bigint("otros_conceptos_bp", { mode: "bigint" }),
  distribucionDetalle: jsonb("distribucion_detalle").default(sql`'{}'::jsonb`), // Para conceptos personalizados
  
  notas: text("notas"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
  createdBy: varchar("created_by"),
}, (table) => ({
  empleadoIdx: index("compensacion_trabajador_empleado_idx").on(table.empleadoId),
  vigenciaIdx: index("compensacion_trabajador_vigencia_idx").on(table.vigenciaDesde, table.vigenciaHasta),
  clienteEmpresaIdx: index("compensacion_trabajador_cliente_empresa_idx").on(table.clienteId, table.empresaId),
}));

export type CompensacionTrabajador = typeof compensacionTrabajador.$inferSelect;
export const insertCompensacionTrabajadorSchema = createInsertSchema(compensacionTrabajador).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertCompensacionTrabajador = z.infer<typeof insertCompensacionTrabajadorSchema>;

// ============================================================================
// COMPENSACIÓN CALCULADA - Valores derivados por periodo (recalculables)
// Se recalcula cuando cambian tablas ISR, UMA, IMSS
// ============================================================================

export const compensacionCalculada = pgTable("compensacion_calculada", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clienteId: varchar("cliente_id").notNull().references(() => clientes.id, { onDelete: "cascade" }),
  empresaId: varchar("empresa_id").notNull().references(() => empresas.id, { onDelete: "cascade" }),
  empleadoId: varchar("empleado_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  compensacionTrabajadorId: varchar("compensacion_trabajador_id").notNull().references(() => compensacionTrabajador.id, { onDelete: "cascade" }),
  
  fechaCalculo: timestamp("fecha_calculo").notNull().default(sql`now()`),
  
  // Valores derivados en basis points
  salarioDiarioBp: bigint("salario_diario_bp", { mode: "bigint" }), // Calculado si esquema NETO
  salarioBaseMensualBp: bigint("salario_base_mensual_bp", { mode: "bigint" }),
  brutoTotalBp: bigint("bruto_total_bp", { mode: "bigint" }),
  netoCalculadoBp: bigint("neto_calculado_bp", { mode: "bigint" }), // Para verificar vs neto_deseado
  
  // SBC y factor de integración
  sbcBp: bigint("sbc_bp", { mode: "bigint" }),
  factorIntegracionBp: bigint("factor_integracion_bp", { mode: "bigint" }), // Ejemplo: 10452 = 1.0452
  
  // Valores UMA utilizados en el cálculo
  umaUtilizadaBp: bigint("uma_utilizada_bp", { mode: "bigint" }),
  fechaUma: date("fecha_uma"),
  
  // Desglose ISR/IMSS calculado
  isrMensualBp: bigint("isr_mensual_bp", { mode: "bigint" }),
  imssObreroMensualBp: bigint("imss_obrero_mensual_bp", { mode: "bigint" }),
  subsidioEmpleoBp: bigint("subsidio_empleo_bp", { mode: "bigint" }),
  
  // Varianza entre neto deseado y neto calculado
  varianzaBp: bigint("varianza_bp", { mode: "bigint" }), // neto_calculado - neto_deseado
  varianzaAlerta: boolean("varianza_alerta").default(false), // true si varianza excede umbral
  
  notas: text("notas"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
}, (table) => ({
  empleadoIdx: index("compensacion_calculada_empleado_idx").on(table.empleadoId),
  fechaIdx: index("compensacion_calculada_fecha_idx").on(table.fechaCalculo),
  compensacionIdx: index("compensacion_calculada_comp_idx").on(table.compensacionTrabajadorId),
  clienteEmpresaIdx: index("compensacion_calculada_cliente_empresa_idx").on(table.clienteId, table.empresaId),
}));

export type CompensacionCalculada = typeof compensacionCalculada.$inferSelect;
export const insertCompensacionCalculadaSchema = createInsertSchema(compensacionCalculada).omit({
  id: true,
  createdAt: true,
});
export type InsertCompensacionCalculada = z.infer<typeof insertCompensacionCalculadaSchema>;

// ============================================================================
// EXENTO CAP CONFIGS - Configuración de topes por medio/concepto (defaults)
// ============================================================================

export const unidadesTope = ["MXN", "UMA"] as const;
export type UnidadTope = typeof unidadesTope[number];

export const exentoCapConfigs = pgTable("exento_cap_configs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clienteId: varchar("cliente_id").notNull().references(() => clientes.id, { onDelete: "cascade" }),
  empresaId: varchar("empresa_id").notNull().references(() => empresas.id, { onDelete: "cascade" }),
  
  // Referencia al medio de pago o concepto
  medioPagoId: varchar("medio_pago_id").references(() => mediosPago.id, { onDelete: "cascade" }),
  conceptoId: varchar("concepto_id").references(() => conceptosMedioPago.id, { onDelete: "cascade" }),
  
  nombre: varchar("nombre", { length: 100 }).notNull(), // Nombre descriptivo (ej: "Sindicato - Tope Mensual")
  
  // Topes (NULL = sin límite)
  topeMensualBp: bigint("tope_mensual_bp", { mode: "bigint" }), // Tope mensual en basis points
  topeAnualBp: bigint("tope_anual_bp", { mode: "bigint" }), // Tope anual en basis points
  unidadTopeMensual: varchar("unidad_tope_mensual", { length: 10 }).default("MXN"), // 'MXN' | 'UMA'
  unidadTopeAnual: varchar("unidad_tope_anual", { length: 10 }).default("MXN"), // 'MXN' | 'UMA'
  
  // Para topes en UMAs, cuántas UMAs
  topeMensualUmas: numeric("tope_mensual_umas", { precision: 10, scale: 2 }),
  topeAnualUmas: numeric("tope_anual_umas", { precision: 10, scale: 2 }),
  
  // Prioridad en la cascada (1 = primero, 2 = segundo, etc.)
  prioridadCascada: integer("prioridad_cascada").notNull().default(1),
  
  activo: boolean("activo").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
}, (table) => ({
  medioPagoIdx: index("exento_cap_configs_medio_pago_idx").on(table.medioPagoId),
  conceptoIdx: index("exento_cap_configs_concepto_idx").on(table.conceptoId),
  prioridadIdx: index("exento_cap_configs_prioridad_idx").on(table.prioridadCascada),
  clienteEmpresaIdx: index("exento_cap_configs_cliente_empresa_idx").on(table.clienteId, table.empresaId),
}));

export type ExentoCapConfig = typeof exentoCapConfigs.$inferSelect;
export const insertExentoCapConfigSchema = createInsertSchema(exentoCapConfigs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  topeMensualUmas: z.coerce.number().optional().nullable(),
  topeAnualUmas: z.coerce.number().optional().nullable(),
});
export type InsertExentoCapConfig = z.infer<typeof insertExentoCapConfigSchema>;

// ============================================================================
// EMPLOYEE EXENTO CAPS - Overrides de topes por empleado
// Si el empleado no tiene override, usa el default de exento_cap_configs
// ============================================================================

export const employeeExentoCaps = pgTable("employee_exento_caps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clienteId: varchar("cliente_id").notNull().references(() => clientes.id, { onDelete: "cascade" }),
  empresaId: varchar("empresa_id").notNull().references(() => empresas.id, { onDelete: "cascade" }),
  empleadoId: varchar("empleado_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  exentoCapConfigId: varchar("exento_cap_config_id").notNull().references(() => exentoCapConfigs.id, { onDelete: "cascade" }),
  
  // Overrides (NULL = usa el default)
  topeMensualOverrideBp: bigint("tope_mensual_override_bp", { mode: "bigint" }),
  topeAnualOverrideBp: bigint("tope_anual_override_bp", { mode: "bigint" }),
  topeMensualUmasOverride: numeric("tope_mensual_umas_override", { precision: 10, scale: 2 }),
  topeAnualUmasOverride: numeric("tope_anual_umas_override", { precision: 10, scale: 2 }),
  
  // Puede deshabilitar un config para este empleado
  deshabilitado: boolean("deshabilitado").notNull().default(false),
  
  notas: text("notas"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
}, (table) => ({
  empleadoConfigUnique: unique().on(table.empleadoId, table.exentoCapConfigId),
  empleadoIdx: index("employee_exento_caps_empleado_idx").on(table.empleadoId),
  configIdx: index("employee_exento_caps_config_idx").on(table.exentoCapConfigId),
  clienteEmpresaIdx: index("employee_exento_caps_cliente_empresa_idx").on(table.clienteId, table.empresaId),
}));

export type EmployeeExentoCap = typeof employeeExentoCaps.$inferSelect;
export const insertEmployeeExentoCapSchema = createInsertSchema(employeeExentoCaps).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  topeMensualUmasOverride: z.coerce.number().optional().nullable(),
  topeAnualUmasOverride: z.coerce.number().optional().nullable(),
});
export type InsertEmployeeExentoCap = z.infer<typeof insertEmployeeExentoCapSchema>;

// ============================================================================
// PAYROLL EXENTO LEDGER - Registro de cada peso pagado por concepto/subconcepto
// Track completo de pagos exentos con consumo de topes
// ============================================================================

export const payrollExentoLedger = pgTable("payroll_exento_ledger", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clienteId: varchar("cliente_id").notNull().references(() => clientes.id, { onDelete: "cascade" }),
  empresaId: varchar("empresa_id").notNull().references(() => empresas.id, { onDelete: "cascade" }),
  empleadoId: varchar("empleado_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  periodoNominaId: varchar("periodo_nomina_id").references(() => payrollPeriods.id, { onDelete: "set null" }),
  
  // Referencia al config de tope utilizado
  exentoCapConfigId: varchar("exento_cap_config_id").references(() => exentoCapConfigs.id, { onDelete: "set null" }),
  employeeExentoCapId: varchar("employee_exento_cap_id").references(() => employeeExentoCaps.id, { onDelete: "set null" }),
  
  // Medio de pago y concepto
  medioPagoId: varchar("medio_pago_id").references(() => mediosPago.id, { onDelete: "set null" }),
  conceptoId: varchar("concepto_id").references(() => conceptosMedioPago.id, { onDelete: "set null" }),
  subconceptoNombre: varchar("subconcepto_nombre", { length: 100 }), // Nombre libre para subconceptos
  
  // Fecha del registro
  fechaRegistro: date("fecha_registro").notNull(),
  ejercicio: integer("ejercicio").notNull(), // Año para tracking anual
  mes: integer("mes").notNull(), // Mes para tracking mensual (1-12)
  
  // Montos pagados en basis points
  montoExentoBp: bigint("monto_exento_bp", { mode: "bigint" }).notNull(),
  montoGravadoBp: bigint("monto_gravado_bp", { mode: "bigint" }),
  
  // Tracking de consumo de topes
  consumoMensualPrevioBp: bigint("consumo_mensual_previo_bp", { mode: "bigint" }), // Acumulado antes de este registro
  consumoMensualPosteriorBp: bigint("consumo_mensual_posterior_bp", { mode: "bigint" }), // Acumulado después
  consumoAnualPrevioBp: bigint("consumo_anual_previo_bp", { mode: "bigint" }),
  consumoAnualPosteriorBp: bigint("consumo_anual_posterior_bp", { mode: "bigint" }),
  
  // Topes efectivos aplicados (snapshot al momento del cálculo)
  topeMensualEfectivoBp: bigint("tope_mensual_efectivo_bp", { mode: "bigint" }),
  topeAnualEfectivoBp: bigint("tope_anual_efectivo_bp", { mode: "bigint" }),
  
  // UMA utilizada para conversión (si aplica)
  umaUtilizadaBp: bigint("uma_utilizada_bp", { mode: "bigint" }),
  
  // Flags de estado
  capMensualAgotado: boolean("cap_mensual_agotado").default(false),
  capAnualAgotado: boolean("cap_anual_agotado").default(false),
  fuenteCap: varchar("fuente_cap", { length: 20 }).default("default"), // 'default' | 'override'
  
  // ISR impact
  esGravableIsr: boolean("es_gravable_isr").default(false),
  integraSbc: boolean("integra_sbc").default(false),
  
  notas: text("notas"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
}, (table) => ({
  empleadoIdx: index("payroll_exento_ledger_empleado_idx").on(table.empleadoId),
  periodoIdx: index("payroll_exento_ledger_periodo_idx").on(table.periodoNominaId),
  ejercicioMesIdx: index("payroll_exento_ledger_ejercicio_mes_idx").on(table.ejercicio, table.mes),
  medioPagoIdx: index("payroll_exento_ledger_medio_pago_idx").on(table.medioPagoId),
  conceptoIdx: index("payroll_exento_ledger_concepto_idx").on(table.conceptoId),
  clienteEmpresaIdx: index("payroll_exento_ledger_cliente_empresa_idx").on(table.clienteId, table.empresaId),
  empleadoEjercicioIdx: index("payroll_exento_ledger_empleado_ejercicio_idx").on(table.empleadoId, table.ejercicio),
}));

export type PayrollExentoLedger = typeof payrollExentoLedger.$inferSelect;
export const insertPayrollExentoLedgerSchema = createInsertSchema(payrollExentoLedger).omit({
  id: true,
  createdAt: true,
});
export type InsertPayrollExentoLedger = z.infer<typeof insertPayrollExentoLedgerSchema>;

// ============================================================================
// ONBOARDING AUDIT TABLE - HR Due Diligence Wizard (Database Persistence)
// ============================================================================

export const onboardingAudits = pgTable("onboarding_audits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clienteId: varchar("cliente_id").notNull().references(() => clientes.id, { onDelete: "cascade" }),
  section1: jsonb("section_1").default(sql`'{}'::jsonb`),
  section2: jsonb("section_2").default(sql`'{}'::jsonb`),
  section3: jsonb("section_3").default(sql`'{}'::jsonb`),
  section4: jsonb("section_4").default(sql`'{}'::jsonb`),
  section5: jsonb("section_5").default(sql`'{}'::jsonb`),
  section6: jsonb("section_6").default(sql`'{}'::jsonb`),
  section7: jsonb("section_7").default(sql`'{}'::jsonb`),
  section8: jsonb("section_8").default(sql`'{}'::jsonb`),
  section9: jsonb("section_9").default(sql`'{}'::jsonb`),
  section10: jsonb("section_10").default(sql`'{}'::jsonb`),
  section11: jsonb("section_11").default(sql`'{}'::jsonb`),
  section12: jsonb("section_12").default(sql`'{}'::jsonb`),
  sectionStatus: jsonb("section_status").default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
}, (table) => ({
  clienteIdx: index("onboarding_audits_cliente_idx").on(table.clienteId),
}));

export type OnboardingAuditRecord = typeof onboardingAudits.$inferSelect;
export const insertOnboardingAuditSchema = createInsertSchema(onboardingAudits).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertOnboardingAudit = z.infer<typeof insertOnboardingAuditSchema>;

// ============================================================================
// ONBOARDING AUDIT ZOD SCHEMAS - For form validation
// ============================================================================

export const sectionStatusSchema = z.enum(["pending", "in_progress", "completed"]);
export type SectionStatus = z.infer<typeof sectionStatusSchema>;

export const yesNoNaSchema = z.enum(["yes", "no", "na", ""]);
export type YesNoNa = z.infer<typeof yesNoNaSchema>;

export const documentStatusSchema = z.object({
  received: z.boolean().default(false),
  valid: z.boolean().default(false),
  observations: z.string().default(""),
  fileUrl: z.string().default(""),
});
export type DocumentStatus = z.infer<typeof documentStatusSchema>;

// Section schemas - simplified versions for the onboarding wizard
export const onboardingSection1Schema = z.object({
  identification: z.object({
    razonSocial: z.string().default(""),
    razonSocialValidated: z.boolean().default(false),
    nombreComercial: z.string().default(""),
    nombreComercialValidated: z.boolean().default(false),
    rfc: z.string().default(""),
    rfcValidated: z.boolean().default(false),
    regimenFiscal: z.string().default(""),
    regimenFiscalValidated: z.boolean().default(false),
    fechaConstitucion: z.string().default(""),
    fechaConstitucionValidated: z.boolean().default(false),
    objetoSocial: z.string().default(""),
    objetoSocialValidated: z.boolean().default(false),
    domicilioFiscal: z.string().default(""),
    domicilioFiscalValidated: z.boolean().default(false),
    telefonoPrincipal: z.string().default(""),
    telefonoPrincipalValidated: z.boolean().default(false),
    sitioWeb: z.string().default(""),
    sitioWebValidated: z.boolean().default(false),
    numeroEmpleados: z.number().default(0),
  }).default({}),
  legalRepresentative: z.object({
    nombreCompleto: z.string().default(""),
    nombreCompletoValidated: z.boolean().default(false),
    cargo: z.string().default(""),
    cargoValidated: z.boolean().default(false),
    rfc: z.string().default(""),
    rfcValidated: z.boolean().default(false),
    curp: z.string().default(""),
    curpValidated: z.boolean().default(false),
    tipoPoder: z.string().default(""),
    tipoPoderValidated: z.boolean().default(false),
    vigenciaPoder: z.string().default(""),
    vigenciaPoderValidated: z.boolean().default(false),
    notariaEscritura: z.string().default(""),
    notariaEscrituraValidated: z.boolean().default(false),
  }).default({}),
  corporateDocuments: z.record(z.string(), documentStatusSchema).default({}),
  businessOperations: z.object({
    actividadPrincipal: z.string().default(""),
    sucursales: z.array(z.object({
      nombre: z.string().default(""),
      estado: z.string().default(""),
      direccion: z.string().default(""),
      empleados: z.number().default(0),
    })).default([]),
  }).default({}),
}).default({});

export const onboardingAuditSchema = z.object({
  id: z.number().optional(),
  clienteId: z.number(),
  section1: onboardingSection1Schema.default({}),
  section2: z.record(z.string(), z.any()).default({}),
  section3: z.record(z.string(), z.any()).default({}),
  section4: z.record(z.string(), z.any()).default({}),
  section5: z.record(z.string(), z.any()).default({}),
  section6: z.record(z.string(), z.any()).default({}),
  section7: z.record(z.string(), z.any()).default({}),
  section8: z.record(z.string(), z.any()).default({}),
  section9: z.record(z.string(), z.any()).default({}),
  section10: z.record(z.string(), z.any()).default({}),
  section11: z.record(z.string(), z.any()).default({}),
  section12: z.record(z.string(), z.any()).default({}),
  sectionStatus: z.record(z.string(), sectionStatusSchema).default({}),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type OnboardingAudit = z.infer<typeof onboardingAuditSchema>;
export type Section1 = z.infer<typeof onboardingSection1Schema>;

// ============================================================================
// PORTAL DE EMPLEADOS - Employee Self-Service Portal
// ============================================================================

// Anuncios (Announcements)
export const anuncios = pgTable("anuncios", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clienteId: varchar("cliente_id").notNull().references(() => clientes.id, { onDelete: "cascade" }),
  empresaId: varchar("empresa_id").references(() => empresas.id, { onDelete: "cascade" }),

  titulo: varchar("titulo", { length: 200 }).notNull(),
  contenido: text("contenido").notNull(),
  tipo: varchar("tipo").notNull().default("informativo"), // informativo, urgente, evento, politica
  imagenUrl: text("imagen_url"),

  // Visibilidad
  visibleParaTodos: boolean("visible_para_todos").default(true),
  departamentosIds: jsonb("departamentos_ids").default(sql`'[]'::jsonb`), // IDs de departamentos específicos
  centrosTrabajoIds: jsonb("centros_trabajo_ids").default(sql`'[]'::jsonb`), // IDs de centros de trabajo

  // Programación
  fechaPublicacion: timestamp("fecha_publicacion").notNull().default(sql`now()`),
  fechaExpiracion: timestamp("fecha_expiracion"),

  // Engagement
  requiereConfirmacion: boolean("requiere_confirmacion").default(false),
  fijado: boolean("fijado").default(false), // Pinned al inicio

  // Auditoría
  publicadoPor: varchar("publicado_por"),
  estatus: varchar("estatus").default("activo"), // borrador, activo, expirado, archivado

  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
}, (table) => ({
  clienteIdx: index("anuncios_cliente_idx").on(table.clienteId),
  fechaPublicacionIdx: index("anuncios_fecha_publicacion_idx").on(table.fechaPublicacion),
  estatusIdx: index("anuncios_estatus_idx").on(table.estatus),
}));

export type Anuncio = typeof anuncios.$inferSelect;
export const insertAnuncioSchema = createInsertSchema(anuncios).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertAnuncio = z.infer<typeof insertAnuncioSchema>;

// Anuncios Leídos - Track read/confirmed announcements
export const anunciosLeidos = pgTable("anuncios_leidos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  anuncioId: varchar("anuncio_id").notNull().references(() => anuncios.id, { onDelete: "cascade" }),
  empleadoId: varchar("empleado_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  leidoAt: timestamp("leido_at").notNull().default(sql`now()`),
  confirmadoAt: timestamp("confirmado_at"), // Si requiereConfirmacion = true
}, (table) => ({
  anuncioEmpleadoIdx: uniqueIndex("anuncios_leidos_anuncio_empleado_idx").on(table.anuncioId, table.empleadoId),
}));

export type AnuncioLeido = typeof anunciosLeidos.$inferSelect;

// Mensajes Internos (Internal Messages)
export const mensajes = pgTable("mensajes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clienteId: varchar("cliente_id").notNull().references(() => clientes.id, { onDelete: "cascade" }),

  // Participantes
  remitenteId: varchar("remitente_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  destinatarioId: varchar("destinatario_id").notNull().references(() => employees.id, { onDelete: "cascade" }),

  // Contenido
  asunto: varchar("asunto", { length: 200 }).notNull(),
  contenido: text("contenido").notNull(),

  // Soporte de hilos
  hiloId: varchar("hilo_id"), // Auto-referencia para hilos de conversación
  esRespuesta: boolean("es_respuesta").default(false),

  // Estado
  leidoAt: timestamp("leido_at"),
  archivadoRemitente: boolean("archivado_remitente").default(false),
  archivadoDestinatario: boolean("archivado_destinatario").default(false),
  eliminadoRemitente: boolean("eliminado_remitente").default(false),
  eliminadoDestinatario: boolean("eliminado_destinatario").default(false),

  createdAt: timestamp("created_at").notNull().default(sql`now()`),
}, (table) => ({
  remitenteIdx: index("mensajes_remitente_idx").on(table.remitenteId),
  destinatarioIdx: index("mensajes_destinatario_idx").on(table.destinatarioId),
  hiloIdx: index("mensajes_hilo_idx").on(table.hiloId),
}));

export type Mensaje = typeof mensajes.$inferSelect;
export const insertMensajeSchema = createInsertSchema(mensajes).omit({
  id: true,
  createdAt: true,
});
export type InsertMensaje = z.infer<typeof insertMensajeSchema>;

// Documentos de Empleado (Employee Documents)
export const documentosEmpleado = pgTable("documentos_empleado", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clienteId: varchar("cliente_id").notNull().references(() => clientes.id, { onDelete: "cascade" }),
  empresaId: varchar("empresa_id").references(() => empresas.id, { onDelete: "cascade" }),
  empleadoId: varchar("empleado_id").notNull().references(() => employees.id, { onDelete: "cascade" }),

  // Información del documento
  nombre: varchar("nombre", { length: 200 }).notNull(),
  descripcion: text("descripcion"),
  categoria: varchar("categoria").notNull(), // contrato, recibo_nomina, constancia, identificacion, comprobante_domicilio, otro

  // Almacenamiento
  archivoUrl: text("archivo_url").notNull(),
  archivoNombre: varchar("archivo_nombre", { length: 255 }).notNull(),
  archivoTipo: varchar("archivo_tipo", { length: 100 }), // MIME type
  archivoTamano: integer("archivo_tamano"), // bytes

  // Control de acceso
  visibleParaEmpleado: boolean("visible_para_empleado").default(true),
  subidoPorEmpleado: boolean("subido_por_empleado").default(false),

  // Auditoría
  subidoPor: varchar("subido_por"),
  fechaVencimiento: date("fecha_vencimiento"),
  estatus: varchar("estatus").default("activo"), // activo, vencido, archivado

  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
}, (table) => ({
  empleadoIdx: index("documentos_empleado_empleado_idx").on(table.empleadoId),
  categoriaIdx: index("documentos_empleado_categoria_idx").on(table.categoria),
}));

export type DocumentoEmpleado = typeof documentosEmpleado.$inferSelect;
export const insertDocumentoEmpleadoSchema = createInsertSchema(documentosEmpleado).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertDocumentoEmpleado = z.infer<typeof insertDocumentoEmpleadoSchema>;

// Configuración de Workflows (Workflow Configuration)
export const workflowConfigurations = pgTable("workflow_configurations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clienteId: varchar("cliente_id").notNull().references(() => clientes.id, { onDelete: "cascade" }),
  empresaId: varchar("empresa_id").references(() => empresas.id, { onDelete: "cascade" }),

  // A qué tipo de solicitud aplica
  tipoSolicitud: varchar("tipo_solicitud").notNull(), // vacaciones, permiso, documento, cambio_datos

  // Pasos del workflow (array ordenado de aprobadores)
  // [{ orden: 1, tipoAprobador: "jefe_directo" | "rh" | "gerencia" | "usuario_especifico", usuarioId?: string }]
  pasos: jsonb("pasos").notNull(),

  // Condiciones de auto-aprobación
  autoAprobarDiasMenoresA: integer("auto_aprobar_dias_menores_a"), // Auto-aprobar si < X días

  activo: boolean("activo").default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
}, (table) => ({
  clienteTipoIdx: uniqueIndex("workflow_config_cliente_tipo_idx").on(table.clienteId, table.empresaId, table.tipoSolicitud),
}));

export type WorkflowConfiguration = typeof workflowConfigurations.$inferSelect;
export const insertWorkflowConfigurationSchema = createInsertSchema(workflowConfigurations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertWorkflowConfiguration = z.infer<typeof insertWorkflowConfigurationSchema>;

// Aprobaciones (Approval records for any request type)
export const aprobaciones = pgTable("aprobaciones", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),

  // Referencia a la solicitud (polimórfico)
  tipoSolicitud: varchar("tipo_solicitud").notNull(), // vacaciones, permiso, etc.
  solicitudId: varchar("solicitud_id").notNull(), // ID de la solicitud

  // Paso del workflow
  pasoOrden: integer("paso_orden").notNull(),

  // Aprobador
  aprobadorId: varchar("aprobador_id").notNull().references(() => users.id),

  // Decisión
  decision: varchar("decision").notNull().default("pendiente"), // pendiente, aprobado, rechazado
  comentarios: text("comentarios"),

  fechaDecision: timestamp("fecha_decision"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
}, (table) => ({
  solicitudIdx: index("aprobaciones_solicitud_idx").on(table.tipoSolicitud, table.solicitudId),
  aprobadorIdx: index("aprobaciones_aprobador_idx").on(table.aprobadorId),
  pendientesIdx: index("aprobaciones_pendientes_idx").on(table.aprobadorId, table.decision),
}));

export type Aprobacion = typeof aprobaciones.$inferSelect;
export const insertAprobacionSchema = createInsertSchema(aprobaciones).omit({
  id: true,
  createdAt: true,
});
export type InsertAprobacion = z.infer<typeof insertAprobacionSchema>;

// Notificaciones (Notifications)
export const notificaciones = pgTable("notificaciones", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),

  usuarioId: varchar("usuario_id").notNull().references(() => users.id, { onDelete: "cascade" }),

  tipo: varchar("tipo").notNull(), // solicitud_aprobada, solicitud_rechazada, nuevo_anuncio, nuevo_mensaje, recordatorio
  titulo: varchar("titulo", { length: 200 }).notNull(),
  contenido: text("contenido"),

  // Referencia a entidad relacionada
  referenciaId: varchar("referencia_id"),
  referenciaTipo: varchar("referencia_tipo"), // vacaciones, permiso, anuncio, mensaje

  // Estado
  leidaAt: timestamp("leida_at"),

  createdAt: timestamp("created_at").notNull().default(sql`now()`),
}, (table) => ({
  usuarioIdx: index("notificaciones_usuario_idx").on(table.usuarioId),
  noLeidasIdx: index("notificaciones_no_leidas_idx").on(table.usuarioId, table.leidaAt),
}));

export type Notificacion = typeof notificaciones.$inferSelect;
export const insertNotificacionSchema = createInsertSchema(notificaciones).omit({
  id: true,
  createdAt: true,
});
export type InsertNotificacion = z.infer<typeof insertNotificacionSchema>;

// =========================================
// CURSOS Y CAPACITACIONES (Training & Courses LMS)
// =========================================

// 1. Course Categories
export const categoriasCursos = pgTable("categorias_cursos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clienteId: varchar("cliente_id").notNull().references(() => clientes.id, { onDelete: "cascade" }),
  nombre: varchar("nombre", { length: 100 }).notNull(),
  descripcion: text("descripcion"),
  color: varchar("color", { length: 7 }), // Hex color code
  icono: varchar("icono", { length: 50 }), // Lucide icon name
  orden: integer("orden").default(0),
  activo: boolean("activo").default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
}, (table) => ({
  clienteIdx: index("categorias_cursos_cliente_idx").on(table.clienteId),
}));

export type CategoriaCurso = typeof categoriasCursos.$inferSelect;
export const insertCategoriaCursoSchema = createInsertSchema(categoriasCursos).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertCategoriaCurso = z.infer<typeof insertCategoriaCursoSchema>;

// 2. Courses (Main course catalog)
export const cursos = pgTable("cursos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clienteId: varchar("cliente_id").notNull().references(() => clientes.id, { onDelete: "cascade" }),
  empresaId: varchar("empresa_id").references(() => empresas.id, { onDelete: "cascade" }),

  // Basic info
  codigo: varchar("codigo", { length: 50 }).notNull(),
  nombre: varchar("nombre", { length: 200 }).notNull(),
  descripcion: text("descripcion"),
  imagenUrl: varchar("imagen_url", { length: 500 }),

  // Classification
  categoriaId: varchar("categoria_id").references(() => categoriasCursos.id, { onDelete: "set null" }),
  dificultad: varchar("dificultad", { length: 20 }), // 'basico', 'intermedio', 'avanzado'
  duracionEstimadaMinutos: integer("duracion_estimada_minutos"),

  // Course type
  tipoCapacitacion: varchar("tipo_capacitacion", { length: 30 }).notNull(), // 'obligatoria', 'opcional', 'induccion', 'certificacion'
  tipoEvaluacion: varchar("tipo_evaluacion", { length: 30 }), // 'quiz', 'assessment', 'certification_exam', 'none'
  calificacionMinima: integer("calificacion_minima").default(70),
  intentosMaximos: integer("intentos_maximos"), // null = unlimited

  // Prerequisites
  prerequisitosCursoIds: jsonb("prerequisitos_curso_ids"), // Array of course IDs

  // Status
  estatus: varchar("estatus", { length: 20 }).default("borrador"), // 'borrador', 'publicado', 'archivado'
  fechaPublicacion: timestamp("fecha_publicacion"),

  // Renewal
  requiereRenovacion: boolean("requiere_renovacion").default(false),
  periodoRenovacionMeses: integer("periodo_renovacion_meses"),

  // Audit
  createdBy: varchar("created_by"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
}, (table) => ({
  clienteIdx: index("cursos_cliente_idx").on(table.clienteId),
  estatusIdx: index("cursos_estatus_idx").on(table.estatus),
  categoriaIdx: index("cursos_categoria_idx").on(table.categoriaId),
  codigoClienteUnique: unique("cursos_codigo_cliente_unique").on(table.clienteId, table.codigo),
}));

export type Curso = typeof cursos.$inferSelect;
export const insertCursoSchema = createInsertSchema(cursos).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertCurso = z.infer<typeof insertCursoSchema>;

// 3. Course Modules
export const modulosCurso = pgTable("modulos_curso", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cursoId: varchar("curso_id").notNull().references(() => cursos.id, { onDelete: "cascade" }),

  nombre: varchar("nombre", { length: 200 }).notNull(),
  descripcion: text("descripcion"),
  orden: integer("orden").notNull(),
  duracionEstimadaMinutos: integer("duracion_estimada_minutos"),

  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
}, (table) => ({
  cursoIdx: index("modulos_curso_curso_idx").on(table.cursoId),
  ordenIdx: index("modulos_curso_orden_idx").on(table.cursoId, table.orden),
}));

export type ModuloCurso = typeof modulosCurso.$inferSelect;
export const insertModuloCursoSchema = createInsertSchema(modulosCurso).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertModuloCurso = z.infer<typeof insertModuloCursoSchema>;

// 4. Course Lessons
export const leccionesCurso = pgTable("lecciones_curso", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  moduloId: varchar("modulo_id").notNull().references(() => modulosCurso.id, { onDelete: "cascade" }),

  nombre: varchar("nombre", { length: 200 }).notNull(),
  descripcion: text("descripcion"),
  orden: integer("orden").notNull(),
  duracionEstimadaMinutos: integer("duracion_estimada_minutos"),

  // Content type determines which fields are used
  tipoContenido: varchar("tipo_contenido", { length: 20 }).notNull(), // 'video', 'texto', 'documento', 'link', 'quiz'
  contenido: jsonb("contenido"), // Flexible content storage

  // For video content
  videoUrl: varchar("video_url", { length: 500 }),
  videoProveedor: varchar("video_proveedor", { length: 20 }), // 'youtube', 'vimeo', 'upload'

  // For document/file content
  archivoUrl: varchar("archivo_url", { length: 500 }),
  archivoNombre: varchar("archivo_nombre", { length: 255 }),
  archivoTipo: varchar("archivo_tipo", { length: 100 }), // MIME type

  // For quiz lessons
  quizId: varchar("quiz_id"), // Will reference quizzesCurso after it's created

  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
}, (table) => ({
  moduloIdx: index("lecciones_curso_modulo_idx").on(table.moduloId),
  ordenIdx: index("lecciones_curso_orden_idx").on(table.moduloId, table.orden),
}));

export type LeccionCurso = typeof leccionesCurso.$inferSelect;
export const insertLeccionCursoSchema = createInsertSchema(leccionesCurso).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertLeccionCurso = z.infer<typeof insertLeccionCursoSchema>;

// 5. Quizzes
export const quizzesCurso = pgTable("quizzes_curso", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cursoId: varchar("curso_id").notNull().references(() => cursos.id, { onDelete: "cascade" }),
  moduloId: varchar("modulo_id").references(() => modulosCurso.id, { onDelete: "cascade" }),

  nombre: varchar("nombre", { length: 200 }).notNull(),
  descripcion: text("descripcion"),
  tipo: varchar("tipo", { length: 30 }).notNull(), // 'quiz', 'assessment', 'certification_exam'

  // Settings
  tiempoLimiteMinutos: integer("tiempo_limite_minutos"),
  calificacionMinima: integer("calificacion_minima").default(70),
  intentosMaximos: integer("intentos_maximos"), // null = unlimited
  mostrarRespuestasCorrectas: boolean("mostrar_respuestas_correctas").default(true),
  ordenAleatorio: boolean("orden_aleatorio").default(false),
  mezclasOpciones: boolean("mezclar_opciones").default(false),

  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
}, (table) => ({
  cursoIdx: index("quizzes_curso_curso_idx").on(table.cursoId),
  moduloIdx: index("quizzes_curso_modulo_idx").on(table.moduloId),
}));

export type QuizCurso = typeof quizzesCurso.$inferSelect;
export const insertQuizCursoSchema = createInsertSchema(quizzesCurso).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertQuizCurso = z.infer<typeof insertQuizCursoSchema>;

// 6. Quiz Questions
export const preguntasQuiz = pgTable("preguntas_quiz", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  quizId: varchar("quiz_id").notNull().references(() => quizzesCurso.id, { onDelete: "cascade" }),

  tipoPregunta: varchar("tipo_pregunta", { length: 30 }).notNull(), // 'multiple_choice', 'true_false', 'multiple_select', 'free_text'
  pregunta: text("pregunta").notNull(),
  explicacion: text("explicacion"), // Shown after answering

  // Options for choice questions - Array of { id: string, texto: string, esCorrecta: boolean }
  opciones: jsonb("opciones"),
  puntos: integer("puntos").default(1),
  orden: integer("orden").notNull(),

  createdAt: timestamp("created_at").notNull().default(sql`now()`),
}, (table) => ({
  quizIdx: index("preguntas_quiz_quiz_idx").on(table.quizId),
  ordenIdx: index("preguntas_quiz_orden_idx").on(table.quizId, table.orden),
}));

export type PreguntaQuiz = typeof preguntasQuiz.$inferSelect;
export const insertPreguntaQuizSchema = createInsertSchema(preguntasQuiz).omit({
  id: true,
  createdAt: true,
});
export type InsertPreguntaQuiz = z.infer<typeof insertPreguntaQuizSchema>;

// 7. Assignment Rules (for auto-assignment)
export const reglasAsignacionCursos = pgTable("reglas_asignacion_cursos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clienteId: varchar("cliente_id").notNull().references(() => clientes.id, { onDelete: "cascade" }),
  cursoId: varchar("curso_id").notNull().references(() => cursos.id, { onDelete: "cascade" }),

  nombre: varchar("nombre", { length: 200 }).notNull(),
  descripcion: text("descripcion"),

  // Trigger type
  tipoTrigger: varchar("tipo_trigger", { length: 30 }).notNull(), // 'new_hire', 'position_change', 'department_change', 'renewal', 'manual'

  // Target criteria (all optional, combined with AND logic)
  empresaIds: jsonb("empresa_ids"), // Array of empresa IDs
  departamentoIds: jsonb("departamento_ids"), // Array of department names
  puestoIds: jsonb("puesto_ids"), // Array of position names
  centroTrabajoIds: jsonb("centro_trabajo_ids"), // Array of centro trabajo IDs

  // Timing
  diasParaCompletar: integer("dias_para_completar"),
  esObligatorio: boolean("es_obligatorio").default(true),

  // For renewal rules
  periodoRenovacionMeses: integer("periodo_renovacion_meses"),

  activo: boolean("activo").default(true),
  prioridad: integer("prioridad").default(0),

  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
}, (table) => ({
  clienteIdx: index("reglas_asignacion_cursos_cliente_idx").on(table.clienteId),
  cursoIdx: index("reglas_asignacion_cursos_curso_idx").on(table.cursoId),
  activoIdx: index("reglas_asignacion_cursos_activo_idx").on(table.activo),
}));

export type ReglaAsignacionCurso = typeof reglasAsignacionCursos.$inferSelect;
export const insertReglaAsignacionCursoSchema = createInsertSchema(reglasAsignacionCursos).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertReglaAsignacionCurso = z.infer<typeof insertReglaAsignacionCursoSchema>;

// 8. Course Assignments (individual employee assignments)
export const asignacionesCursos = pgTable("asignaciones_cursos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clienteId: varchar("cliente_id").notNull().references(() => clientes.id, { onDelete: "cascade" }),
  empresaId: varchar("empresa_id").notNull().references(() => empresas.id, { onDelete: "cascade" }),
  empleadoId: varchar("empleado_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  cursoId: varchar("curso_id").notNull().references(() => cursos.id, { onDelete: "cascade" }),

  // Assignment metadata
  reglaAsignacionId: varchar("regla_asignacion_id").references(() => reglasAsignacionCursos.id, { onDelete: "set null" }),
  asignadoPor: varchar("asignado_por"), // User ID who assigned
  tipoAsignacion: varchar("tipo_asignacion", { length: 30 }).notNull(), // 'manual', 'auto_new_hire', 'auto_renewal', 'auto_position_change', 'auto_department_change'
  esObligatorio: boolean("es_obligatorio").default(false),

  // Dates
  fechaAsignacion: timestamp("fecha_asignacion").notNull().default(sql`now()`),
  fechaVencimiento: date("fecha_vencimiento"),
  fechaInicio: timestamp("fecha_inicio"),
  fechaCompletado: timestamp("fecha_completado"),

  // Progress
  estatus: varchar("estatus", { length: 20 }).default("asignado"), // 'asignado', 'en_progreso', 'completado', 'vencido', 'fallido'
  porcentajeProgreso: integer("porcentaje_progreso").default(0),

  // Assessment results
  calificacionFinal: integer("calificacion_final"),
  aprobado: boolean("aprobado"),
  intentosRealizados: integer("intentos_realizados").default(0),

  // Certificate
  certificadoGenerado: boolean("certificado_generado").default(false),
  certificadoUrl: varchar("certificado_url", { length: 500 }),
  fechaCertificado: timestamp("fecha_certificado"),

  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
}, (table) => ({
  clienteIdx: index("asignaciones_cursos_cliente_idx").on(table.clienteId),
  empleadoIdx: index("asignaciones_cursos_empleado_idx").on(table.empleadoId),
  cursoIdx: index("asignaciones_cursos_curso_idx").on(table.cursoId),
  estatusIdx: index("asignaciones_cursos_estatus_idx").on(table.estatus),
  vencimientoIdx: index("asignaciones_cursos_vencimiento_idx").on(table.fechaVencimiento),
}));

export type AsignacionCurso = typeof asignacionesCursos.$inferSelect;
export const insertAsignacionCursoSchema = createInsertSchema(asignacionesCursos).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertAsignacionCurso = z.infer<typeof insertAsignacionCursoSchema>;

// 9. Lesson Progress (granular tracking)
export const progresoLecciones = pgTable("progreso_lecciones", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  asignacionId: varchar("asignacion_id").notNull().references(() => asignacionesCursos.id, { onDelete: "cascade" }),
  leccionId: varchar("leccion_id").notNull().references(() => leccionesCurso.id, { onDelete: "cascade" }),

  estatus: varchar("estatus", { length: 20 }).default("pendiente"), // 'pendiente', 'en_progreso', 'completado'
  porcentajeProgreso: integer("porcentaje_progreso").default(0),

  fechaInicio: timestamp("fecha_inicio"),
  fechaCompletado: timestamp("fecha_completado"),
  tiempoInvertidoSegundos: integer("tiempo_invertido_segundos").default(0),

  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
}, (table) => ({
  asignacionIdx: index("progreso_lecciones_asignacion_idx").on(table.asignacionId),
  leccionIdx: index("progreso_lecciones_leccion_idx").on(table.leccionId),
  uniqueProgress: unique("progreso_lecciones_unique").on(table.asignacionId, table.leccionId),
}));

export type ProgresoLeccion = typeof progresoLecciones.$inferSelect;
export const insertProgresoLeccionSchema = createInsertSchema(progresoLecciones).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertProgresoLeccion = z.infer<typeof insertProgresoLeccionSchema>;

// 10. Quiz Attempts
export const intentosQuiz = pgTable("intentos_quiz", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  asignacionId: varchar("asignacion_id").notNull().references(() => asignacionesCursos.id, { onDelete: "cascade" }),
  quizId: varchar("quiz_id").notNull().references(() => quizzesCurso.id, { onDelete: "cascade" }),
  empleadoId: varchar("empleado_id").notNull().references(() => employees.id, { onDelete: "cascade" }),

  numeroIntento: integer("numero_intento").notNull(),

  fechaInicio: timestamp("fecha_inicio").notNull(),
  fechaFin: timestamp("fecha_fin"),
  tiempoUtilizadoSegundos: integer("tiempo_utilizado_segundos"),

  // Answers - Array of { preguntaId: string, respuesta: any, esCorrecta: boolean, puntosObtenidos: number }
  respuestas: jsonb("respuestas"),

  puntosObtenidos: integer("puntos_obtenidos"),
  puntosMaximos: integer("puntos_maximos"),
  calificacion: integer("calificacion"), // percentage
  aprobado: boolean("aprobado"),

  estatus: varchar("estatus", { length: 20 }).default("en_progreso"), // 'en_progreso', 'completado', 'abandonado', 'tiempo_agotado'

  createdAt: timestamp("created_at").notNull().default(sql`now()`),
}, (table) => ({
  asignacionIdx: index("intentos_quiz_asignacion_idx").on(table.asignacionId),
  quizIdx: index("intentos_quiz_quiz_idx").on(table.quizId),
  empleadoIdx: index("intentos_quiz_empleado_idx").on(table.empleadoId),
}));

export type IntentoQuiz = typeof intentosQuiz.$inferSelect;
export const insertIntentoQuizSchema = createInsertSchema(intentosQuiz).omit({
  id: true,
  createdAt: true,
});
export type InsertIntentoQuiz = z.infer<typeof insertIntentoQuizSchema>;

// 11. Certificates
export const certificadosCursos = pgTable("certificados_cursos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clienteId: varchar("cliente_id").notNull().references(() => clientes.id, { onDelete: "cascade" }),
  asignacionId: varchar("asignacion_id").notNull().references(() => asignacionesCursos.id, { onDelete: "cascade" }),
  empleadoId: varchar("empleado_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  cursoId: varchar("curso_id").notNull().references(() => cursos.id, { onDelete: "cascade" }),

  codigoCertificado: varchar("codigo_certificado", { length: 50 }).notNull().unique(),
  fechaEmision: timestamp("fecha_emision").notNull().default(sql`now()`),
  fechaVencimiento: date("fecha_vencimiento"),

  calificacionObtenida: integer("calificacion_obtenida"),
  archivoUrl: varchar("archivo_url", { length: 500 }),

  estatus: varchar("estatus", { length: 20 }).default("activo"), // 'activo', 'vencido', 'revocado'

  createdAt: timestamp("created_at").notNull().default(sql`now()`),
}, (table) => ({
  clienteIdx: index("certificados_cursos_cliente_idx").on(table.clienteId),
  empleadoIdx: index("certificados_cursos_empleado_idx").on(table.empleadoId),
  cursoIdx: index("certificados_cursos_curso_idx").on(table.cursoId),
  codigoIdx: uniqueIndex("certificados_cursos_codigo_idx").on(table.codigoCertificado),
}));

export type CertificadoCurso = typeof certificadosCursos.$inferSelect;
export const insertCertificadoCursoSchema = createInsertSchema(certificadosCursos).omit({
  id: true,
  createdAt: true,
});
export type InsertCertificadoCurso = z.infer<typeof insertCertificadoCursoSchema>;

// ============================================================================
// ANONYMOUS REPORTING SYSTEM (Denuncias Anónimas / Whistleblower)
// NOM-035-STPS-2018 Compliant - Psychosocial Risk Prevention
// ============================================================================

// Report categories
export const categoriasDenuncia = ["harassment_abuse", "ethics_compliance", "suggestions", "safety_concerns"] as const;
export type CategoriaDenuncia = (typeof categoriasDenuncia)[number];

export const categoriasDenunciaLabels: Record<CategoriaDenuncia, string> = {
  harassment_abuse: "Acoso y Abuso",
  ethics_compliance: "Ética y Cumplimiento",
  suggestions: "Sugerencias",
  safety_concerns: "Seguridad en el Trabajo"
};

// Report statuses
export const estatusDenuncia = ["nuevo", "en_revision", "en_investigacion", "resuelto", "cerrado", "descartado"] as const;
export type EstatusDenuncia = (typeof estatusDenuncia)[number];

export const estatusDenunciaLabels: Record<EstatusDenuncia, string> = {
  nuevo: "Nuevo",
  en_revision: "En Revisión",
  en_investigacion: "En Investigación",
  resuelto: "Resuelto",
  cerrado: "Cerrado",
  descartado: "Descartado"
};

// Priority levels
export const prioridadDenuncia = ["baja", "normal", "alta", "urgente"] as const;
export type PrioridadDenuncia = (typeof prioridadDenuncia)[number];

// Main anonymous reports table
export const denunciasAnonimas = pgTable("denuncias_anonimas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),

  // Multi-tenant isolation
  clienteId: varchar("cliente_id").notNull().references(() => clientes.id, { onDelete: "cascade" }),
  empresaId: varchar("empresa_id").references(() => empresas.id, { onDelete: "set null" }),

  // Anonymous access credentials (Case Number + PIN for anonymous follow-up)
  caseNumber: varchar("case_number", { length: 20 }).notNull().unique(),
  pinHash: varchar("pin_hash", { length: 255 }).notNull(),

  // Report content
  categoria: varchar("categoria", { length: 50 }).notNull(),
  subcategoria: varchar("subcategoria", { length: 100 }),
  titulo: varchar("titulo", { length: 255 }).notNull(),
  descripcion: text("descripcion").notNull(),

  // Optional incident details
  fechaIncidente: date("fecha_incidente"),
  ubicacionDescripcion: text("ubicacion_descripcion"),

  // Identity disclosure (opt-in only - reporter chooses to identify themselves)
  reporteroDeseaIdentificarse: boolean("reportero_desea_identificarse").notNull().default(false),
  reporteroNombre: varchar("reportero_nombre", { length: 255 }),
  reporteroContacto: varchar("reportero_contacto", { length: 255 }),

  // Workflow
  estatus: varchar("estatus", { length: 30 }).notNull().default("nuevo"),
  prioridad: varchar("prioridad", { length: 20 }).notNull().default("normal"),

  // Assignment
  asignadoA: varchar("asignado_a").references(() => users.id, { onDelete: "set null" }),
  fechaAsignacion: timestamp("fecha_asignacion"),

  // Resolution
  resolucionTipo: varchar("resolucion_tipo", { length: 50 }),
  resolucionDescripcion: text("resolucion_descripcion"),
  notasInternas: text("notas_internas"), // Only visible to admins, never to reporter

  // Anonymous notifications (optional email that can't be traced to employee)
  emailAnonimo: varchar("email_anonimo", { length: 255 }),
  notificarPorEmail: boolean("notificar_por_email").notNull().default(false),

  // SLA tracking
  fechaLimiteRevision: timestamp("fecha_limite_revision"),
  fechaLimiteResolucion: timestamp("fecha_limite_resolucion"),

  // Timestamps
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
  resolvedAt: timestamp("resolved_at"),
}, (table) => ({
  clienteIdx: index("denuncias_anonimas_cliente_idx").on(table.clienteId),
  empresaIdx: index("denuncias_anonimas_empresa_idx").on(table.empresaId),
  estatusIdx: index("denuncias_anonimas_estatus_idx").on(table.estatus),
  caseNumberIdx: uniqueIndex("denuncias_anonimas_case_number_idx").on(table.caseNumber),
  createdAtIdx: index("denuncias_anonimas_created_at_idx").on(table.createdAt),
}));

export type DenunciaAnonima = typeof denunciasAnonimas.$inferSelect;
export const insertDenunciaAnonimaSchema = createInsertSchema(denunciasAnonimas).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  resolvedAt: true,
});
export type InsertDenunciaAnonima = z.infer<typeof insertDenunciaAnonimaSchema>;

// Two-way anonymous communication messages
export const denunciaMensajes = pgTable("denuncia_mensajes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  denunciaId: varchar("denuncia_id").notNull().references(() => denunciasAnonimas.id, { onDelete: "cascade" }),

  contenido: text("contenido").notNull(),

  // Who sent the message
  tipoRemitente: varchar("tipo_remitente", { length: 20 }).notNull(), // 'reporter' | 'investigator'
  investigadorId: varchar("investigador_id").references(() => users.id, { onDelete: "set null" }), // Only set for investigator messages

  // Read tracking for reporter
  leidoPorReportero: boolean("leido_por_reportero").notNull().default(false),
  fechaLecturaReportero: timestamp("fecha_lectura_reportero"),

  // Read tracking for investigator
  leidoPorInvestigador: boolean("leido_por_investigador").notNull().default(false),
  fechaLecturaInvestigador: timestamp("fecha_lectura_investigador"),

  createdAt: timestamp("created_at").notNull().default(sql`now()`),
}, (table) => ({
  denunciaIdx: index("denuncia_mensajes_denuncia_idx").on(table.denunciaId),
  createdAtIdx: index("denuncia_mensajes_created_at_idx").on(table.createdAt),
}));

export type DenunciaMensaje = typeof denunciaMensajes.$inferSelect;
export const insertDenunciaMensajeSchema = createInsertSchema(denunciaMensajes).omit({
  id: true,
  createdAt: true,
});
export type InsertDenunciaMensaje = z.infer<typeof insertDenunciaMensajeSchema>;

// File attachments for reports
export const denunciaAdjuntos = pgTable("denuncia_adjuntos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  denunciaId: varchar("denuncia_id").notNull().references(() => denunciasAnonimas.id, { onDelete: "cascade" }),
  mensajeId: varchar("mensaje_id").references(() => denunciaMensajes.id, { onDelete: "cascade" }), // Optional - can be attached to initial report or a message

  nombreArchivo: varchar("nombre_archivo", { length: 255 }).notNull(),
  tipoMime: varchar("tipo_mime", { length: 100 }).notNull(),
  tamanioBytes: integer("tamanio_bytes").notNull(),
  storagePath: varchar("storage_path", { length: 500 }).notNull(),

  // Who uploaded
  subidoPor: varchar("subido_por", { length: 20 }).notNull(), // 'reporter' | 'investigator'
  investigadorId: varchar("investigador_id").references(() => users.id, { onDelete: "set null" }),

  createdAt: timestamp("created_at").notNull().default(sql`now()`),
}, (table) => ({
  denunciaIdx: index("denuncia_adjuntos_denuncia_idx").on(table.denunciaId),
  mensajeIdx: index("denuncia_adjuntos_mensaje_idx").on(table.mensajeId),
}));

export type DenunciaAdjunto = typeof denunciaAdjuntos.$inferSelect;
export const insertDenunciaAdjuntoSchema = createInsertSchema(denunciaAdjuntos).omit({
  id: true,
  createdAt: true,
});
export type InsertDenunciaAdjunto = z.infer<typeof insertDenunciaAdjuntoSchema>;

// Admin audit log - tracks admin actions only, NEVER reporter actions (to preserve anonymity)
export const denunciaAuditLog = pgTable("denuncia_audit_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  denunciaId: varchar("denuncia_id").notNull().references(() => denunciasAnonimas.id, { onDelete: "cascade" }),

  usuarioId: varchar("usuario_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  usuarioNombre: varchar("usuario_nombre", { length: 255 }).notNull(),

  accion: varchar("accion", { length: 50 }).notNull(), // 'viewed', 'status_changed', 'assigned', 'message_sent', 'resolved', etc.
  detalles: jsonb("detalles"), // Additional context { from: 'nuevo', to: 'en_revision' }

  createdAt: timestamp("created_at").notNull().default(sql`now()`),
}, (table) => ({
  denunciaIdx: index("denuncia_audit_log_denuncia_idx").on(table.denunciaId),
  usuarioIdx: index("denuncia_audit_log_usuario_idx").on(table.usuarioId),
  createdAtIdx: index("denuncia_audit_log_created_at_idx").on(table.createdAt),
}));

export type DenunciaAuditLog = typeof denunciaAuditLog.$inferSelect;
export const insertDenunciaAuditLogSchema = createInsertSchema(denunciaAuditLog).omit({
  id: true,
  createdAt: true,
});
export type InsertDenunciaAuditLog = z.infer<typeof insertDenunciaAuditLogSchema>;

// Per-cliente configuration for the anonymous reporting system
export const denunciaConfiguracion = pgTable("denuncia_configuracion", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clienteId: varchar("cliente_id").notNull().unique().references(() => clientes.id, { onDelete: "cascade" }),

  // Feature toggles
  habilitado: boolean("habilitado").notNull().default(true),
  permitirAnonimo: boolean("permitir_anonimo").notNull().default(true),
  permitirAdjuntos: boolean("permitir_adjuntos").notNull().default(true),

  // Which categories are enabled for this cliente
  categoriasHabilitadas: jsonb("categorias_habilitadas").notNull().default(sql`'["harassment_abuse", "ethics_compliance", "suggestions", "safety_concerns"]'::jsonb`),

  // SLA configuration
  horasParaRevision: integer("horas_para_revision").notNull().default(72), // 72 hours default
  diasParaResolucion: integer("dias_para_resolucion").notNull().default(30), // 30 days default

  // Notifications
  notificarAdminNuevaDenuncia: boolean("notificar_admin_nueva_denuncia").notNull().default(true),
  emailsNotificacion: jsonb("emails_notificacion"), // Array of emails to notify on new reports

  // Customization
  textoPoliticaPrivacidad: text("texto_politica_privacidad"),

  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
}, (table) => ({
  clienteIdx: uniqueIndex("denuncia_configuracion_cliente_idx").on(table.clienteId),
}));

export type DenunciaConfiguracion = typeof denunciaConfiguracion.$inferSelect;
export const insertDenunciaConfiguracionSchema = createInsertSchema(denunciaConfiguracion).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertDenunciaConfiguracion = z.infer<typeof insertDenunciaConfiguracionSchema>;

// ============================================================================
// DOCUMENT TEMPLATES SYSTEM - Plantillas de Documentos
// Contracts, Cartas Patronales, and other HR documents
// ============================================================================

// Document types enum
export const tiposPlantillaDocumento = [
  "contrato_laboral",
  "contrato_confidencialidad",
  "carta_oferta",
  "carta_finiquito",
  "carta_liquidacion",
  "constancia_laboral",
  "carta_recomendacion",
  "carta_renuncia",
  "acta_administrativa",
  "aviso_privacidad",
  "recibo_nomina",
  "otro"
] as const;
export type TipoPlantillaDocumento = (typeof tiposPlantillaDocumento)[number];

export const tiposPlantillaDocumentoLabels: Record<TipoPlantillaDocumento, string> = {
  contrato_laboral: "Contrato Laboral",
  contrato_confidencialidad: "Contrato de Confidencialidad",
  carta_oferta: "Carta de Oferta",
  carta_finiquito: "Carta de Finiquito",
  carta_liquidacion: "Carta de Liquidación",
  constancia_laboral: "Constancia Laboral",
  carta_recomendacion: "Carta de Recomendación",
  carta_renuncia: "Carta de Renuncia",
  acta_administrativa: "Acta Administrativa",
  aviso_privacidad: "Aviso de Privacidad",
  recibo_nomina: "Recibo de Nómina",
  otro: "Otro"
};

// Template status enum
export const estatusPlantillaDocumento = ["borrador", "publicada", "archivada"] as const;
export type EstatusPlantillaDocumento = (typeof estatusPlantillaDocumento)[number];

// Event types for assignment rules
export const tiposEventoPlantilla = ["alta", "baja", "promocion", "renovacion", "cambio_puesto", "cambio_salario", "otro"] as const;
export type TipoEventoPlantilla = (typeof tiposEventoPlantilla)[number];

// 1. Template Categories
export const categoriasPlantillaDocumento = pgTable("categorias_plantilla_documento", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clienteId: varchar("cliente_id").notNull().references(() => clientes.id, { onDelete: "cascade" }),
  nombre: varchar("nombre", { length: 100 }).notNull(),
  descripcion: text("descripcion"),
  icono: varchar("icono", { length: 50 }), // Lucide icon name
  orden: integer("orden").default(0),
  activo: boolean("activo").default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
}, (table) => ({
  clienteIdx: index("categorias_plantilla_doc_cliente_idx").on(table.clienteId),
}));

export type CategoriaPlantillaDocumento = typeof categoriasPlantillaDocumento.$inferSelect;
export const insertCategoriaPlantillaDocumentoSchema = createInsertSchema(categoriasPlantillaDocumento).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertCategoriaPlantillaDocumento = z.infer<typeof insertCategoriaPlantillaDocumentoSchema>;

// 2. Main Templates Table
export const plantillasDocumento = pgTable("plantillas_documento", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clienteId: varchar("cliente_id").notNull().references(() => clientes.id, { onDelete: "cascade" }),

  // Basic Info
  nombre: varchar("nombre", { length: 200 }).notNull(),
  descripcion: text("descripcion"),
  codigo: varchar("codigo", { length: 50 }), // Internal reference code

  // Classification
  categoriaId: varchar("categoria_id").references(() => categoriasPlantillaDocumento.id, { onDelete: "set null" }),
  tipoDocumento: varchar("tipo_documento", { length: 50 }).notNull().default("otro"),

  // Template Content (TipTap JSON format)
  contenido: jsonb("contenido").notNull(),

  // Page Configuration
  tamanioPapel: varchar("tamanio_papel", { length: 20 }).default("letter"), // 'letter', 'legal', 'a4'
  orientacion: varchar("orientacion", { length: 20 }).default("portrait"), // 'portrait', 'landscape'
  margenes: jsonb("margenes").default(sql`'{"top": 72, "right": 72, "bottom": 72, "left": 72}'::jsonb`),

  // Header/Footer
  encabezado: jsonb("encabezado"), // TipTap JSON for header
  piePagina: jsonb("pie_pagina"), // TipTap JSON for footer
  mostrarNumeroPagina: boolean("mostrar_numero_pagina").default(false),

  // Variables metadata
  variablesUsadas: jsonb("variables_usadas"), // Array of variable keys used in template
  variablesCustomDefinidas: jsonb("variables_custom_definidas"), // Custom variables defined for this template

  // Status & Versioning
  version: integer("version").notNull().default(1),
  estatus: varchar("estatus", { length: 20 }).default("borrador"), // 'borrador', 'publicada', 'archivada'
  esDefault: boolean("es_default").default(false), // Default template for this type

  // Audit
  createdBy: varchar("created_by"),
  updatedBy: varchar("updated_by"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
}, (table) => ({
  clienteIdx: index("plantillas_doc_cliente_idx").on(table.clienteId),
  tipoIdx: index("plantillas_doc_tipo_idx").on(table.tipoDocumento),
  codigoClienteUnique: unique("plantillas_doc_codigo_cliente_unique").on(table.clienteId, table.codigo),
}));

export type PlantillaDocumento = typeof plantillasDocumento.$inferSelect;
export const insertPlantillaDocumentoSchema = createInsertSchema(plantillasDocumento).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  contenido: z.any(), // TipTap JSON document
  margenes: z.object({
    top: z.number(),
    right: z.number(),
    bottom: z.number(),
    left: z.number(),
  }).optional(),
  encabezado: z.any().optional(),
  piePagina: z.any().optional(),
  variablesUsadas: z.array(z.string()).optional(),
  variablesCustomDefinidas: z.array(z.object({
    key: z.string(),
    label: z.string(),
    descripcion: z.string().optional(),
    tipo: z.enum(["texto", "numero", "fecha", "moneda"]).default("texto"),
    requerida: z.boolean().default(false),
    valorDefault: z.string().optional(),
  })).optional(),
});
export type InsertPlantillaDocumento = z.infer<typeof insertPlantillaDocumentoSchema>;

// 3. Template Version History (Full Versioning with Rollback)
export const plantillasDocumentoVersiones = pgTable("plantillas_documento_versiones", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  plantillaId: varchar("plantilla_id").notNull().references(() => plantillasDocumento.id, { onDelete: "cascade" }),
  version: integer("version").notNull(),

  // Full snapshot of template at this version
  contenido: jsonb("contenido").notNull(),
  encabezado: jsonb("encabezado"),
  piePagina: jsonb("pie_pagina"),
  margenes: jsonb("margenes"),
  tamanioPapel: varchar("tamanio_papel", { length: 20 }),
  orientacion: varchar("orientacion", { length: 20 }),
  variablesUsadas: jsonb("variables_usadas"),
  variablesCustomDefinidas: jsonb("variables_custom_definidas"),

  // Change info
  cambios: text("cambios"), // Description of changes
  creadoPor: varchar("creado_por"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
}, (table) => ({
  plantillaVersionIdx: unique("plantilla_version_unique").on(table.plantillaId, table.version),
  plantillaIdx: index("plantillas_doc_versiones_plantilla_idx").on(table.plantillaId),
}));

export type PlantillaDocumentoVersion = typeof plantillasDocumentoVersiones.$inferSelect;
export const insertPlantillaDocumentoVersionSchema = createInsertSchema(plantillasDocumentoVersiones).omit({
  id: true,
  createdAt: true,
});
export type InsertPlantillaDocumentoVersion = z.infer<typeof insertPlantillaDocumentoVersionSchema>;

// 4. Template Assets (logos, signatures, stamps)
export const plantillasDocumentoAssets = pgTable("plantillas_documento_assets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clienteId: varchar("cliente_id").notNull().references(() => clientes.id, { onDelete: "cascade" }),
  nombre: varchar("nombre", { length: 200 }).notNull(),
  tipo: varchar("tipo", { length: 30 }).notNull(), // 'logo', 'firma', 'sello', 'imagen'
  url: varchar("url", { length: 500 }).notNull(),
  mimeType: varchar("mime_type", { length: 100 }),
  tamanioBytes: integer("tamanio_bytes"),
  ancho: integer("ancho"),
  alto: integer("alto"),
  activo: boolean("activo").default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
}, (table) => ({
  clienteIdx: index("plantillas_doc_assets_cliente_idx").on(table.clienteId),
  tipoIdx: index("plantillas_doc_assets_tipo_idx").on(table.tipo),
}));

export type PlantillaDocumentoAsset = typeof plantillasDocumentoAssets.$inferSelect;
export const insertPlantillaDocumentoAssetSchema = createInsertSchema(plantillasDocumentoAssets).omit({
  id: true,
  createdAt: true,
});
export type InsertPlantillaDocumentoAsset = z.infer<typeof insertPlantillaDocumentoAssetSchema>;

// 5. Template Assignment Rules (determines which template to use based on context)
export const reglasAsignacionPlantilla = pgTable("reglas_asignacion_plantilla", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clienteId: varchar("cliente_id").notNull().references(() => clientes.id, { onDelete: "cascade" }),
  plantillaId: varchar("plantilla_id").notNull().references(() => plantillasDocumento.id, { onDelete: "cascade" }),

  nombre: varchar("nombre", { length: 200 }).notNull(),
  descripcion: text("descripcion"),

  // Criteria - when to suggest/use this template
  tipoEvento: varchar("tipo_evento", { length: 50 }), // alta, baja, promocion, renovacion, etc.

  // Scope filters (null = applies to all)
  empresaIds: jsonb("empresa_ids"), // Array of empresa IDs or null for all
  departamentos: jsonb("departamentos"), // Array of department names or null
  puestoIds: jsonb("puesto_ids"), // Array of puesto IDs or null
  tiposContrato: jsonb("tipos_contrato"), // Array of contract types or null

  // Priority for when multiple rules match
  prioridad: integer("prioridad").default(0),

  // Options
  esObligatoria: boolean("es_obligatoria").default(false), // Must generate on event
  autoGenerar: boolean("auto_generar").default(false), // Auto-generate on event

  activo: boolean("activo").default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
}, (table) => ({
  clienteIdx: index("reglas_asig_plantilla_cliente_idx").on(table.clienteId),
  plantillaIdx: index("reglas_asig_plantilla_plantilla_idx").on(table.plantillaId),
  tipoEventoIdx: index("reglas_asig_plantilla_tipo_evento_idx").on(table.tipoEvento),
}));

export type ReglaAsignacionPlantilla = typeof reglasAsignacionPlantilla.$inferSelect;
export const insertReglaAsignacionPlantillaSchema = createInsertSchema(reglasAsignacionPlantilla).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  empresaIds: z.array(z.string()).nullable().optional(),
  departamentos: z.array(z.string()).nullable().optional(),
  puestoIds: z.array(z.string()).nullable().optional(),
  tiposContrato: z.array(z.string()).nullable().optional(),
});
export type InsertReglaAsignacionPlantilla = z.infer<typeof insertReglaAsignacionPlantillaSchema>;

// 6. Generated Documents Log (audit trail)
export const documentosGenerados = pgTable("documentos_generados", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clienteId: varchar("cliente_id").notNull().references(() => clientes.id, { onDelete: "cascade" }),
  empresaId: varchar("empresa_id").references(() => empresas.id, { onDelete: "set null" }),
  plantillaId: varchar("plantilla_id").notNull().references(() => plantillasDocumento.id, { onDelete: "restrict" }),
  plantillaVersion: integer("plantilla_version").notNull(),
  empleadoId: varchar("empleado_id").references(() => employees.id, { onDelete: "set null" }),

  // Generated file info
  archivoUrl: varchar("archivo_url", { length: 500 }),
  nombreArchivo: varchar("nombre_archivo", { length: 255 }),

  // Variables snapshot at generation time
  variablesUsadas: jsonb("variables_usadas"), // All variables and their values at generation
  variablesCustom: jsonb("variables_custom"), // Custom variable values provided

  estatus: varchar("estatus", { length: 20 }).default("generado"), // 'generado', 'firmado', 'anulado'
  generadoPor: varchar("generado_por"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
}, (table) => ({
  clienteIdx: index("docs_generados_cliente_idx").on(table.clienteId),
  empleadoIdx: index("docs_generados_empleado_idx").on(table.empleadoId),
  plantillaIdx: index("docs_generados_plantilla_idx").on(table.plantillaId),
  createdAtIdx: index("docs_generados_created_at_idx").on(table.createdAt),
}));

export type DocumentoGenerado = typeof documentosGenerados.$inferSelect;
export const insertDocumentoGeneradoSchema = createInsertSchema(documentosGenerados).omit({
  id: true,
  createdAt: true,
});
export type InsertDocumentoGenerado = z.infer<typeof insertDocumentoGeneradoSchema>;
