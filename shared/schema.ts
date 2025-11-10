import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, integer, date, timestamp, jsonb, uuid, boolean, numeric, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const employees = pgTable("employees", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  numeroEmpleado: varchar("numero_empleado").notNull(),
  nombre: varchar("nombre").notNull(),
  apellidoPaterno: varchar("apellido_paterno").notNull(),
  apellidoMaterno: varchar("apellido_materno"),
  genero: varchar("genero"),
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
  telefono: varchar("telefono").notNull(),
  email: varchar("email").notNull(),
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
  puesto: varchar("puesto").notNull(),
  departamento: varchar("departamento").notNull(),
  funciones: text("funciones"),
  diasLaborales: varchar("dias_laborales").default("lunes_viernes"),
  horario: varchar("horario"),
  tipoJornada: varchar("tipo_jornada").default("diurna"),
  tiempoParaAlimentos: varchar("tiempo_para_alimentos").default("30_minutos"),
  diasDescanso: varchar("dias_descanso").default("sabado_domingo"),
  salarioBrutoMensual: numeric("salario_bruto_mensual").notNull(),
  esquemaPago: varchar("esquema_pago").default("tradicional"),
  salarioDiarioReal: numeric("salario_diario_real"),
  salarioDiarioNominal: numeric("salario_diario_nominal"),
  salarioDiarioExento: numeric("salario_diario_exento"),
  sbc: numeric("sbc"),
  sdi: numeric("sdi"),
  tablaImss: varchar("tabla_imss").default("fija"),
  diasVacacionesAnuales: integer("dias_vacaciones_anuales").default(12),
  diasVacacionesDisponibles: integer("dias_vacaciones_disponibles").default(12),
  diasVacacionesUsados: integer("dias_vacaciones_usados").default(0),
  diasAguinaldoAdicionales: integer("dias_aguinaldo_adicionales").default(0),
  diasVacacionesAdicionales: integer("dias_vacaciones_adicionales").default(0),
  creditoInfonavit: varchar("credito_infonavit"),
  numeroFonacot: varchar("numero_fonacot"),
  otrosCreditos: jsonb("otros_creditos").default(sql`'{}'::jsonb`),
  estatus: varchar("estatus").default("activo"),
  clienteProyecto: varchar("cliente_proyecto"),
  observacionesInternas: text("observaciones_internas"),
  timezone: varchar("timezone").default("America/Mexico_City"),
  preferencias: jsonb("preferencias").default(sql`'{}'::jsonb`),
  jefeDirectoId: varchar("jefe_directo_id"),
  empresaId: varchar("empresa_id"),
  registroPatronalId: integer("registro_patronal_id"),
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
});

export const departments = pgTable("departments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
});

export const gruposNomina = pgTable("grupos_nomina", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
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
});

export const payrollPeriods = pgTable("payroll_periods", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
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
}));

export const mediosPago = pgTable("medios_pago", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nombre: varchar("nombre").notNull().unique(),
  descripcion: text("descripcion"),
  tipoComprobante: varchar("tipo_comprobante").notNull(), // factura, recibo_sin_iva
  cuentaDeposito: varchar("cuenta_deposito").notNull(),
  activo: boolean("activo").default(true),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
});

export const tiposConcepto = ["percepcion", "deduccion"] as const;
export type TipoConcepto = typeof tiposConcepto[number];

export const conceptosMedioPago = pgTable("conceptos_medio_pago", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nombre: varchar("nombre", { length: 200 }).notNull().unique(),
  tipo: varchar("tipo", { length: 20 }).notNull(), // percepcion, deduccion
  formula: text("formula").notNull(),
  limiteExento: text("limite_exento"), // Puede ser fórmula (ej: "3*UMA") o cantidad
  gravableISR: boolean("gravable_isr").notNull().default(true),
  integraSBC: boolean("integra_sbc").notNull().default(false),
  limiteAnual: text("limite_anual"), // Puede ser fórmula o cantidad
  activo: boolean("activo").default(true),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
});

// Tabla de relación muchos a muchos entre conceptos y medios de pago
export const conceptosMediosPagoRel = pgTable("conceptos_medios_pago_rel", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conceptoId: varchar("concepto_id").notNull().references(() => conceptosMedioPago.id, { onDelete: "cascade" }),
  medioPagoId: varchar("medio_pago_id").notNull().references(() => mediosPago.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").default(sql`now()`),
}, (table) => ({
  uniqueRelation: unique().on(table.conceptoId, table.medioPagoId),
}));

export const attendance = pgTable("attendance", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
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
});

// Tipos de incidencias de asistencia
export const tiposIncidenciaAsistencia = ["falta", "retardo", "horas_extra", "horas_descontadas", "incapacidad", "permiso"] as const;
export type TipoIncidenciaAsistencia = typeof tiposIncidenciaAsistencia[number];

export const tipoIncidenciaLabels: Record<TipoIncidenciaAsistencia, string> = {
  falta: "Falta",
  retardo: "Retardo",
  horas_extra: "Horas Extra",
  horas_descontadas: "Horas Descontadas",
  incapacidad: "Incapacidad",
  permiso: "Permiso",
};

// Incidencias de asistencia por día con columnas expandibles
// Una fila por empleado por día con columnas para cada tipo de incidencia
export const incidenciasAsistencia = pgTable("incidencias_asistencia", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
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
  notas: text("notas"), // Observaciones del día
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
}, (table) => ({
  // Índice único: un registro por empleado por fecha por centro
  employeeDateIdx: sql`CREATE UNIQUE INDEX IF NOT EXISTS incidencias_empleado_fecha_centro_idx ON ${table} (employee_id, fecha, COALESCE(centro_trabajo_id, ''))`,
}));

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

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
});

// Conceptos especiales para bajas (descuentos o adicionales)
export const bajaSpecialConcepts = pgTable("baja_special_concepts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  legalCaseId: varchar("legal_case_id").notNull(), // Vinculado al caso de baja
  conceptType: text("concept_type").notNull(), // 'descuento' o 'adicional'
  description: text("description").notNull(), // Descripción del concepto
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(), // Monto
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Liquidaciones y Finiquitos
export const settlements = pgTable("settlements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
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
});

// Demandas laborales - Etapas del proceso legal
export const lawsuitStages = ["conciliacion", "contestacion", "desahogo", "alegatos", "sentencia", "cerrado"] as const;
export type LawsuitStage = typeof lawsuitStages[number];

export const lawsuits = pgTable("lawsuits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(), // Título de la demanda
  employeeName: text("employee_name").notNull(), // Nombre del empleado demandante
  legalCaseId: varchar("legal_case_id"), // Vincula con un caso legal de bajas si existe
  stage: text("stage").notNull().default("conciliacion"), // Etapa actual del proceso
  description: text("description"), // Descripción detallada de la demanda
  documentUrl: text("document_url"), // URL del documento escaneado de la demanda
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
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
  mediosPagoIds: z.array(z.string()).optional(), // IDs de medios de pago a vincular
});

export const updateConceptoMedioPagoSchema = insertConceptoMedioPagoSchema.partial();

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
  nombre: text("nombre").notNull(), // Nombre del candidato
  apellidoPaterno: text("apellido_paterno").notNull(), // Apellido paterno
  apellidoMaterno: text("apellido_materno"), // Apellido materno (opcional)
  position: text("position").notNull(), // Puesto ofrecido
  department: text("department").notNull(), // Departamento
  proposedSalary: decimal("proposed_salary", { precision: 10, scale: 2 }).notNull(), // Salario propuesto
  startDate: date("start_date").notNull(), // Fecha propuesta de inicio
  stage: text("stage").notNull().default("oferta"), // Etapa actual del proceso
  status: text("status").notNull().default("activo"), // 'activo', 'cancelado', 'completado'
  contractType: text("contract_type").notNull(), // Tipo de contrato
  contractDuration: text("contract_duration"), // Duración del contrato (para contratos temporales o por obra)
  // Datos personales del candidato
  email: text("email"),
  phone: text("phone"),
  rfc: varchar("rfc", { length: 13 }),
  curp: varchar("curp", { length: 18 }),
  nss: varchar("nss", { length: 11 }),
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
});

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
export type Attendance = typeof attendance.$inferSelect;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type IncidenciaAsistencia = typeof incidenciasAsistencia.$inferSelect;
export type InsertIncidenciaAsistencia = z.infer<typeof insertIncidenciaAsistenciaSchema>;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
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
export const empresas = pgTable("empresas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
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
});

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
});

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
});

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
  empresaId: varchar("empresa_id").notNull().references(() => empresas.id, { onDelete: "cascade" }),
  registroREPSEId: varchar("registro_repse_id").notNull().references(() => registrosREPSE.id, { onDelete: "cascade" }),
  clienteId: varchar("cliente_id").notNull().references(() => clientesREPSE.id, { onDelete: "cascade" }),
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
});

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
});

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
});

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
});

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
});

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
});

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
  
  // Identificación
  clavePuesto: varchar("clave_puesto").notNull().unique(),
  nombrePuesto: varchar("nombre_puesto").notNull(),
  
  // Ubicación Organizacional
  area: varchar("area"),
  departamento: varchar("departamento"),
  ubicacion: varchar("ubicacion"),
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
  
  // Auditoría
  fechaCreacion: timestamp("fecha_creacion").notNull().default(sql`now()`),
  ultimaActualizacion: timestamp("ultima_actualizacion").notNull().default(sql`now()`),
});

export const insertPuestoSchema = createInsertSchema(puestos).omit({
  id: true,
  fechaCreacion: true,
  ultimaActualizacion: true,
}).extend({
  estatus: z.enum(["activo", "inactivo"]).default("activo"),
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
  
  empresaId: varchar("empresa_id"),
  creadoPor: varchar("creado_por"),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
});

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
});

// Etapas del proceso de selección (configurables por empresa)
export const etapasSeleccion = pgTable("etapas_seleccion", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nombre: varchar("nombre").notNull(),
  descripcion: text("descripcion"),
  orden: integer("orden").notNull(), // Orden en el pipeline
  color: varchar("color").default("#6366f1"), // Color para el Kanban
  esEtapaFinal: boolean("es_etapa_final").default(false), // Contratado o Descartado
  esPositiva: boolean("es_positiva").default(true), // true = contratado, false = descartado
  activa: boolean("activa").default(true),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
});

// Proceso de selección - Estado de cada candidato en cada vacante
export const procesoSeleccion = pgTable("proceso_seleccion", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
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
}));

// Historial de movimientos en el proceso
export const historialProcesoSeleccion = pgTable("historial_proceso_seleccion", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  procesoSeleccionId: varchar("proceso_seleccion_id").notNull().references(() => procesoSeleccion.id, { onDelete: "cascade" }),
  etapaAnteriorId: varchar("etapa_anterior_id").references(() => etapasSeleccion.id, { onDelete: "set null" }),
  etapaNuevaId: varchar("etapa_nueva_id").notNull().references(() => etapasSeleccion.id, { onDelete: "restrict" }),
  comentario: text("comentario"),
  movidoPor: varchar("movido_por"),
  createdAt: timestamp("created_at").default(sql`now()`),
});

// Tipos de entrevistas
export const tiposEntrevista = ["telefonica", "rh", "tecnica", "gerencia", "panel", "caso_practico", "otra"] as const;
export type TipoEntrevista = typeof tiposEntrevista[number];

// Entrevistas programadas
export const entrevistas = pgTable("entrevistas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
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
});

// Evaluaciones técnicas o psicométricas
export const evaluaciones = pgTable("evaluaciones", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
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
});

// Ofertas de trabajo
export const ofertas = pgTable("ofertas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
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
  empresaId: varchar("empresa_id"),
  creadoPor: varchar("creado_por"),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
});

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
// MÓDULO DE VACACIONES (Vacation Management)
// ============================================================================

// Estados de solicitudes de vacaciones
export const estatusSolicitudVacaciones = ["pendiente", "aprobada", "rechazada", "cancelada"] as const;
export type EstatusSolicitudVacaciones = typeof estatusSolicitudVacaciones[number];

export const solicitudesVacaciones = pgTable("solicitudes_vacaciones", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
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
});

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
