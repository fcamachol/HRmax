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
  sbcBp: bigint("sbc_bp", { mode: "bigint" }), // Salario Base de Cotización en basis points (autoritativo)
  sdiBp: bigint("sdi_bp", { mode: "bigint" }), // Salario Diario Integrado en basis points (autoritativo)
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
}, (table) => ({
  clienteEmpresaIdx: index("employees_cliente_empresa_idx").on(table.clienteId, table.empresaId),
}));

// ============================================================================
// MODIFICACIONES DE PERSONAL - Historial de cambios en empleados
// ============================================================================

export const tiposModificacion = ["salario", "puesto", "centro_trabajo", "departamento", "jefe_directo", "otro"] as const;
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
  formula: text("formula").notNull(),
  limiteExento: text("limite_exento"), // Puede ser fórmula (ej: "3*UMA") o cantidad
  gravableISR: boolean("gravable_isr").notNull().default(true),
  integraSBC: boolean("integra_sbc").notNull().default(false),
  limiteAnual: text("limite_anual"), // Puede ser fórmula o cantidad
  activo: boolean("activo").default(true),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
}, (table) => ({
  clienteEmpresaIdx: index("conceptos_medio_pago_cliente_empresa_idx").on(table.clienteId, table.empresaId),
  categoriaIdx: index("conceptos_medio_pago_categoria_idx").on(table.categoria),
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
  conceptoId: varchar("concepto_id").notNull().references(() => conceptosMedioPago.id, { onDelete: "cascade" }),
  canal: varchar("canal", { length: 20 }).notNull().default("nomina"), // "nomina" (gravable, integra SBC) | "exento" (no integra SBC)
  valorDefault: decimal("valor_default", { precision: 18, scale: 4 }), // Valor predeterminado opcional
  esObligatorio: boolean("es_obligatorio").notNull().default(false), // Si el concepto es obligatorio en esta plantilla
  orden: integer("orden").notNull().default(0), // Orden de aparición en la plantilla
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
}, (table) => ({
  clienteEmpresaIdx: index("plantilla_conceptos_cliente_empresa_idx").on(table.clienteId, table.empresaId),
  plantillaIdx: index("plantilla_conceptos_plantilla_idx").on(table.plantillaId),
  uniqueConcepto: unique().on(table.plantillaId, table.conceptoId),
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
  tipoUsuario: varchar("tipo_usuario").notNull().default("cliente"), // "maxtalent" | "cliente"
  clienteId: varchar("cliente_id").references(() => clientes.id), // Solo para tipo "cliente"
  
  // Super Admin - permite bypass de permisos con auditoría completa
  isSuperAdmin: boolean("is_super_admin").notNull().default(false),
  
  // Información adicional
  nombre: text("nombre"),
  email: varchar("email"),
  activo: boolean("activo").notNull().default(true),
  
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
}).extend({
  canal: z.enum(canalesConcepto),
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
  clabe: varchar("clabe", { length: 18 }),
  sucursal: varchar("sucursal"),
  formaPago: varchar("forma_pago"),
  // Centro de trabajo
  centroTrabajo: varchar("centro_trabajo"), // Campo legacy - usar centroTrabajoId
  centroTrabajoId: varchar("centro_trabajo_id").references(() => centrosTrabajo.id, { onDelete: "set null" }), // Centro de trabajo (FK)
  // Registro patronal
  registroPatronalId: varchar("registro_patronal_id").references(() => registrosPatronales.id, { onDelete: "set null" }), // Registro patronal (FK)
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
    concepto: ConceptoMedioPago;
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
