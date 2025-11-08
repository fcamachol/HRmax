import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, integer, date, timestamp, jsonb, uuid, boolean, numeric } from "drizzle-orm/pg-core";
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
  puestoId: varchar("puesto_id"),
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
});

export const departments = pgTable("departments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
});

export const payrollPeriods = pgTable("payroll_periods", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  frequency: text("frequency").notNull(),
  status: text("status").notNull().default("pending"),
});

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

// Incidencias de asistencia por periodo (estilo layout de nómina)
// Una fila por empleado por periodo con columnas para cada tipo de incidencia
export const incidenciasAsistencia = pgTable("incidencias_asistencia", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").notNull(),
  centroTrabajoId: varchar("centro_trabajo_id"), // Centro de trabajo (opcional)
  fechaInicio: date("fecha_inicio").notNull(), // Fecha de inicio del periodo
  fechaFin: date("fecha_fin").notNull(), // Fecha de fin del periodo
  // Columnas individuales por tipo de incidencia
  faltas: integer("faltas").notNull().default(0), // Número de faltas
  retardos: integer("retardos").notNull().default(0), // Número de retardos
  horasExtra: decimal("horas_extra", { precision: 10, scale: 2 }).notNull().default("0"), // Horas extra trabajadas
  horasDescontadas: decimal("horas_descontadas", { precision: 10, scale: 2 }).notNull().default("0"), // Horas a descontar
  incapacidades: integer("incapacidades").notNull().default(0), // Días de incapacidad
  permisos: integer("permisos").notNull().default(0), // Días de permiso
  notas: text("notas"), // Observaciones generales
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

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

export const insertPayrollPeriodSchema = createInsertSchema(payrollPeriods).omit({
  id: true,
});

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
export type PayrollPeriod = typeof payrollPeriods.$inferSelect;
export type InsertPayrollPeriod = z.infer<typeof insertPayrollPeriodSchema>;
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
