import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, integer, date, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const employees = pgTable("employees", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  rfc: varchar("rfc", { length: 13 }).notNull().unique(),
  curp: varchar("curp", { length: 18 }).notNull().unique(),
  nss: varchar("nss", { length: 11 }).notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  department: text("department").notNull(),
  position: text("position").notNull(),
  salary: decimal("salary", { precision: 10, scale: 2 }).notNull(),
  contractType: text("contract_type").notNull(),
  startDate: date("start_date").notNull(),
  status: text("status").notNull().default("active"),
  vacationDays: integer("vacation_days").notNull().default(12),
  sickDays: integer("sick_days").notNull().default(0),
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
  date: date("date").notNull(),
  status: text("status").notNull(),
  clockIn: text("clock_in"),
  clockOut: text("clock_out"),
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
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
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

export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type Department = typeof departments.$inferSelect;
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;
export type PayrollPeriod = typeof payrollPeriods.$inferSelect;
export type InsertPayrollPeriod = z.infer<typeof insertPayrollPeriodSchema>;
export type Attendance = typeof attendance.$inferSelect;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
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
