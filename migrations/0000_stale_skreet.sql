CREATE TABLE "actas_administrativas" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cliente_id" varchar NOT NULL,
	"empresa_id" varchar NOT NULL,
	"empleado_id" varchar NOT NULL,
	"numero_acta" varchar NOT NULL,
	"fecha_elaboracion" date NOT NULL,
	"tipo_falta" varchar NOT NULL,
	"descripcion_hechos" text NOT NULL,
	"fecha_incidente" date NOT NULL,
	"hora_incidente" varchar,
	"lugar_incidente" text,
	"testigos" text,
	"sancion_aplicada" varchar,
	"dias_suspension" integer,
	"monto_descuento" numeric(10, 2),
	"detalles_sancion" text,
	"fecha_aplicacion_sancion" date,
	"fecha_cumplimiento_sancion" date,
	"estatus" varchar DEFAULT 'pendiente' NOT NULL,
	"apelacion_presentada" boolean DEFAULT false,
	"detalles_apelacion" text,
	"fecha_apelacion" date,
	"resolucion_apelacion" text,
	"elaborado_por" varchar NOT NULL,
	"aprobado_por" varchar,
	"documentos_adjuntos" jsonb DEFAULT '[]'::jsonb,
	"notas_internas" text,
	"firmado_empleado" boolean DEFAULT false,
	"fecha_firma_empleado" timestamp,
	"firmado_testigo1" boolean DEFAULT false,
	"firmado_testigo2" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "actas_administrativas_numero_acta_unique" UNIQUE("numero_acta")
);
--> statement-breakpoint
CREATE TABLE "admin_audit_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_user_id" varchar NOT NULL,
	"admin_username" varchar NOT NULL,
	"action" varchar NOT NULL,
	"resource_type" varchar NOT NULL,
	"resource_id" varchar,
	"target_cliente_id" varchar,
	"target_empresa_id" varchar,
	"target_centro_trabajo_id" varchar,
	"details" jsonb,
	"previous_value" jsonb,
	"new_value" jsonb,
	"ip_address" varchar,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "asignaciones_personal_repse" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cliente_id" varchar NOT NULL,
	"empresa_id" varchar NOT NULL,
	"contrato_repse_id" varchar NOT NULL,
	"empleado_id" varchar NOT NULL,
	"fecha_asignacion" date NOT NULL,
	"fecha_fin_asignacion" date,
	"puesto_funcion" varchar NOT NULL,
	"descripcion_actividades" text,
	"salario_asignado" numeric(10, 2),
	"estatus" varchar DEFAULT 'activo',
	"notas" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attendance" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cliente_id" varchar NOT NULL,
	"empresa_id" varchar NOT NULL,
	"employee_id" varchar NOT NULL,
	"centro_trabajo_id" varchar,
	"turno_id" varchar,
	"date" date NOT NULL,
	"status" text NOT NULL,
	"clock_in" text,
	"clock_out" text,
	"horas_trabajadas" numeric(4, 2),
	"motivo_ausencia" text,
	"tipo_jornada" varchar DEFAULT 'normal',
	"notas" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "avisos_repse" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cliente_id" varchar NOT NULL,
	"tipo" varchar NOT NULL,
	"empresa_id" varchar NOT NULL,
	"contrato_repse_id" varchar,
	"descripcion" text NOT NULL,
	"fecha_evento" date,
	"fecha_limite" date NOT NULL,
	"estatus" varchar DEFAULT 'PENDIENTE',
	"fecha_presentacion" date,
	"trimestre" integer,
	"año" integer,
	"archivo_url" text,
	"archivo_nombre" varchar,
	"numero_folio_stps" varchar,
	"notas" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "baja_special_concepts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cliente_id" varchar NOT NULL,
	"empresa_id" varchar NOT NULL,
	"legal_case_id" varchar NOT NULL,
	"concept_type" text NOT NULL,
	"description" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bancos_layouts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cliente_id" varchar NOT NULL,
	"empresa_id" varchar NOT NULL,
	"nombre" varchar NOT NULL,
	"codigo_banco" varchar NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"configuracion_csv" jsonb NOT NULL,
	"descripcion" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "bancos_layouts_codigo_banco_unique" UNIQUE("codigo_banco")
);
--> statement-breakpoint
CREATE TABLE "candidatos" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cliente_id" varchar NOT NULL,
	"empresa_id" varchar NOT NULL,
	"nombre" varchar NOT NULL,
	"apellido_paterno" varchar NOT NULL,
	"apellido_materno" varchar,
	"email" varchar NOT NULL,
	"telefono" varchar NOT NULL,
	"telefono_secundario" varchar,
	"linkedin_url" varchar,
	"cv_url" varchar,
	"puesto_deseado" varchar,
	"salario_deseado" numeric,
	"disponibilidad" varchar,
	"fuente" varchar DEFAULT 'aplicacion_directa' NOT NULL,
	"referido_por" varchar,
	"empleado_referidor_id" varchar,
	"ciudad" varchar,
	"estado" varchar,
	"experiencia_anios" integer,
	"nivel_educacion" varchar,
	"carrera" varchar,
	"universidad" varchar,
	"competencias_clave" jsonb DEFAULT '[]'::jsonb,
	"idiomas" jsonb DEFAULT '[]'::jsonb,
	"notas" text,
	"documentos_adicionales" jsonb DEFAULT '[]'::jsonb,
	"estatus" varchar DEFAULT 'activo',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "cat_imss_config" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"anio" integer NOT NULL,
	"uma_bp" bigint NOT NULL,
	"salario_minimo_bp" bigint NOT NULL,
	"limite_superior_cotizacion_uma" integer DEFAULT 25 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "cat_imss_config_anio_unique" UNIQUE("anio")
);
--> statement-breakpoint
CREATE TABLE "cat_imss_cuotas" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"anio" integer NOT NULL,
	"ramo" varchar(100) NOT NULL,
	"concepto" varchar(255) NOT NULL,
	"patron_tasa_bp" integer,
	"trabajador_tasa_bp" integer,
	"patron_cuota_fija_bp" bigint,
	"trabajador_cuota_fija_bp" bigint,
	"base_calculo" varchar(50),
	"aplica_limite_superior" boolean DEFAULT true,
	"notas" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "cat_imss_cuotas_anio_ramo_concepto_unique" UNIQUE("anio","ramo","concepto")
);
--> statement-breakpoint
CREATE TABLE "cat_isr_tarifas" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"anio" integer NOT NULL,
	"periodo" varchar(20) NOT NULL,
	"limite_inferior_bp" bigint NOT NULL,
	"limite_superior_bp" bigint,
	"cuota_fija_bp" bigint NOT NULL,
	"tasa_excedente_bp" integer NOT NULL,
	"orden" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "cat_isr_tarifas_anio_periodo_orden_unique" UNIQUE("anio","periodo","orden")
);
--> statement-breakpoint
CREATE TABLE "cat_sat_tipos_deduccion" (
	"clave" varchar(10) PRIMARY KEY NOT NULL,
	"nombre" varchar(255) NOT NULL,
	"descripcion" text,
	"es_obligatoria" boolean DEFAULT false NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cat_sat_tipos_otro_pago" (
	"clave" varchar(10) PRIMARY KEY NOT NULL,
	"nombre" varchar(255) NOT NULL,
	"descripcion" text,
	"activo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cat_sat_tipos_percepcion" (
	"clave" varchar(10) PRIMARY KEY NOT NULL,
	"nombre" varchar(255) NOT NULL,
	"descripcion" text,
	"gravado" boolean DEFAULT true NOT NULL,
	"integra_sdi" boolean DEFAULT true NOT NULL,
	"es_imss" boolean DEFAULT false NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cat_subsidio_empleo" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"anio" integer NOT NULL,
	"periodo" varchar(20) NOT NULL,
	"limite_inferior_bp" bigint NOT NULL,
	"limite_superior_bp" bigint,
	"subsidio_bp" bigint NOT NULL,
	"orden" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "cat_subsidio_empleo_anio_periodo_orden_unique" UNIQUE("anio","periodo","orden")
);
--> statement-breakpoint
CREATE TABLE "centros_trabajo" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"empresa_id" varchar NOT NULL,
	"registro_patronal_id" varchar,
	"nombre" text NOT NULL,
	"descripcion" text,
	"calle" text,
	"numero_exterior" varchar,
	"numero_interior" varchar,
	"colonia" text,
	"municipio" text,
	"estado" text,
	"codigo_postal" varchar(5),
	"capacidad_empleados" integer,
	"telefono" varchar,
	"email" varchar,
	"responsable" text,
	"estatus" varchar DEFAULT 'activo',
	"notas" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clientes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nombre_comercial" text NOT NULL,
	"razon_social" text NOT NULL,
	"rfc" varchar(13) NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"fecha_alta" date DEFAULT CURRENT_DATE NOT NULL,
	"telefono" varchar,
	"email" varchar,
	"notas" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "clientes_rfc_unique" UNIQUE("rfc")
);
--> statement-breakpoint
CREATE TABLE "clientes_repse" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cliente_id" varchar NOT NULL,
	"empresa_id" varchar NOT NULL,
	"razon_social" varchar NOT NULL,
	"rfc" varchar NOT NULL,
	"nombre_comercial" varchar,
	"giro" varchar,
	"calle" varchar,
	"numero_exterior" varchar,
	"numero_interior" varchar,
	"colonia" varchar,
	"municipio" varchar,
	"estado" varchar,
	"codigo_postal" varchar,
	"telefono" varchar,
	"email" varchar,
	"contacto_principal" varchar,
	"puesto_contacto" varchar,
	"telefono_contacto" varchar,
	"email_contacto" varchar,
	"estatus" varchar DEFAULT 'activo',
	"notas" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conceptos_medio_pago" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cliente_id" varchar NOT NULL,
	"empresa_id" varchar NOT NULL,
	"nombre" varchar(200) NOT NULL,
	"tipo" varchar(20) NOT NULL,
	"formula" text NOT NULL,
	"limite_exento" text,
	"gravable_isr" boolean DEFAULT true NOT NULL,
	"integra_sbc" boolean DEFAULT false NOT NULL,
	"limite_anual" text,
	"activo" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "conceptos_medio_pago_nombre_unique" UNIQUE("nombre")
);
--> statement-breakpoint
CREATE TABLE "conceptos_medios_pago_rel" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cliente_id" varchar NOT NULL,
	"empresa_id" varchar NOT NULL,
	"concepto_id" varchar NOT NULL,
	"medio_pago_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "conceptos_medios_pago_rel_concepto_id_medio_pago_id_unique" UNIQUE("concepto_id","medio_pago_id")
);
--> statement-breakpoint
CREATE TABLE "conceptos_nomina" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cliente_id" varchar NOT NULL,
	"empresa_id" varchar NOT NULL,
	"codigo" varchar(50) NOT NULL,
	"nombre" varchar(255) NOT NULL,
	"tipo" varchar(20) NOT NULL,
	"sat_clave" varchar(10),
	"naturaleza" varchar(20) NOT NULL,
	"gravado" boolean DEFAULT true NOT NULL,
	"integra_sdi" boolean DEFAULT true NOT NULL,
	"afecta_isr" boolean DEFAULT true NOT NULL,
	"afecta_imss" boolean DEFAULT true NOT NULL,
	"tipo_calculo" varchar(50) NOT NULL,
	"formula" text,
	"base_calculo" varchar(50),
	"factor" numeric(18, 6),
	"orden_calculo" integer DEFAULT 100 NOT NULL,
	"mostrar_recibo" boolean DEFAULT true NOT NULL,
	"etiqueta_recibo" varchar(255),
	"grupo_recibo" varchar(50),
	"centro_trabajo_id" varchar,
	"activo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "conceptos_nomina_cliente_id_empresa_id_codigo_unique" UNIQUE("cliente_id","empresa_id","codigo")
);
--> statement-breakpoint
CREATE TABLE "configuration_change_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"change_type" text NOT NULL,
	"periodicidad" text,
	"changed_by" text NOT NULL,
	"change_date" timestamp DEFAULT now() NOT NULL,
	"previous_value" jsonb NOT NULL,
	"new_value" jsonb NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "contratos_repse" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cliente_id" varchar NOT NULL,
	"empresa_id" varchar NOT NULL,
	"registro_repse_id" varchar NOT NULL,
	"cliente_repse_id" varchar NOT NULL,
	"numero_contrato" varchar NOT NULL,
	"fecha_inicio" date NOT NULL,
	"fecha_fin" date,
	"servicios_especializados" text NOT NULL,
	"objeto_contrato" text,
	"monto_contrato" numeric(12, 2),
	"archivo_url" text,
	"archivo_nombre" varchar,
	"notificado_imss" boolean DEFAULT false,
	"numero_aviso_imss" varchar,
	"fecha_notificacion_imss" date,
	"estatus" varchar DEFAULT 'vigente',
	"notas" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "credenciales_sistemas" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"empresa_id" varchar,
	"registro_patronal_id" varchar,
	"tipo_sistema" varchar NOT NULL,
	"nombre_sistema" text NOT NULL,
	"usuario" text,
	"password_secret_key" text,
	"efirma_rfc" varchar(13),
	"efirma_cert_path" text,
	"efirma_key_path" text,
	"efirma_password_secret_key" text,
	"url" text,
	"descripcion" text,
	"fecha_ultimo_acceso" timestamp,
	"fecha_vencimiento" date,
	"notas_seguridad" text,
	"estatus" varchar DEFAULT 'activo',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "creditos_legales" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cliente_id" varchar NOT NULL,
	"empresa_id" varchar NOT NULL,
	"empleado_id" varchar NOT NULL,
	"tipo_credito" varchar NOT NULL,
	"numero_credito" varchar,
	"tipo_calculo_infonavit" varchar,
	"valor_descuento" numeric,
	"monto_total" numeric,
	"monto_por_periodo" numeric,
	"saldo_restante" numeric,
	"fecha_inicio" date NOT NULL,
	"fecha_termino" date,
	"beneficiario" varchar,
	"documento_legal" text,
	"archivo_url" text,
	"estado" varchar DEFAULT 'ACTIVO' NOT NULL,
	"descuento_automatico" boolean DEFAULT true,
	"notas" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "departments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cliente_id" varchar NOT NULL,
	"empresa_id" varchar NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "departments_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "empleados_centros_trabajo" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"empleado_id" varchar NOT NULL,
	"centro_trabajo_id" varchar NOT NULL,
	"turno_id" varchar NOT NULL,
	"fecha_inicio" date NOT NULL,
	"fecha_fin" date,
	"es_principal" boolean DEFAULT true,
	"hora_entrada_especifica" varchar,
	"hora_salida_especifica" varchar,
	"notas" text,
	"estatus" varchar DEFAULT 'activo',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employees" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cliente_id" varchar NOT NULL,
	"numero_empleado" varchar NOT NULL,
	"nombre" varchar NOT NULL,
	"apellido_paterno" varchar NOT NULL,
	"apellido_materno" varchar,
	"genero" varchar,
	"curp" varchar,
	"rfc" varchar,
	"nss" varchar,
	"estado_civil" varchar,
	"calle" varchar,
	"numero_exterior" varchar,
	"numero_interior" varchar,
	"colonia" varchar,
	"municipio" varchar,
	"estado" varchar,
	"codigo_postal" varchar,
	"telefono" varchar NOT NULL,
	"email" varchar NOT NULL,
	"correo" varchar,
	"contacto_emergencia" varchar,
	"parentesco_emergencia" varchar,
	"telefono_emergencia" varchar,
	"banco" varchar,
	"clabe" varchar,
	"sucursal" varchar,
	"forma_pago" varchar DEFAULT 'transferencia',
	"periodicidad_pago" varchar DEFAULT 'quincenal',
	"tipo_calculo_salario" varchar DEFAULT 'diario',
	"tipo_contrato" varchar DEFAULT 'indeterminado',
	"fecha_ingreso" date NOT NULL,
	"fecha_alta_imss" date,
	"fecha_terminacion" date,
	"reconoce_antiguedad" boolean DEFAULT false,
	"fecha_antiguedad" date,
	"modalidad_trabajo" varchar DEFAULT 'presencial',
	"lugar_trabajo" varchar,
	"puesto" varchar NOT NULL,
	"departamento" varchar NOT NULL,
	"funciones" text,
	"dias_laborales" varchar DEFAULT 'lunes_viernes',
	"horario" varchar,
	"tipo_jornada" varchar DEFAULT 'diurna',
	"tiempo_para_alimentos" varchar DEFAULT '30_minutos',
	"dias_descanso" varchar DEFAULT 'sabado_domingo',
	"salario_bruto_mensual" numeric NOT NULL,
	"esquema_pago" varchar DEFAULT 'tradicional',
	"salario_diario_real" numeric,
	"salario_diario_nominal" numeric,
	"salario_diario_exento" numeric,
	"sbc" numeric,
	"sdi" numeric,
	"sbc_bp" bigint,
	"sdi_bp" bigint,
	"tabla_imss" varchar DEFAULT 'fija',
	"dias_vacaciones_anuales" integer DEFAULT 12,
	"dias_vacaciones_disponibles" integer DEFAULT 12,
	"dias_vacaciones_usados" integer DEFAULT 0,
	"dias_aguinaldo_adicionales" integer DEFAULT 0,
	"dias_vacaciones_adicionales" integer DEFAULT 0,
	"credito_infonavit" varchar,
	"numero_fonacot" varchar,
	"otros_creditos" jsonb DEFAULT '{}'::jsonb,
	"estatus" varchar DEFAULT 'activo',
	"cliente_proyecto" varchar,
	"observaciones_internas" text,
	"timezone" varchar DEFAULT 'America/Mexico_City',
	"preferencias" jsonb DEFAULT '{}'::jsonb,
	"jefe_directo_id" varchar,
	"empresa_id" varchar NOT NULL,
	"registro_patronal_id" integer,
	"documento_contrato_id" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"puesto_id" varchar,
	"esquema_contratacion" varchar,
	"lugar_nacimiento" varchar,
	"entidad_nacimiento" varchar,
	"nacionalidad" varchar,
	"escolaridad" varchar,
	"periodo_prueba" boolean DEFAULT false,
	"duracion_prueba" integer,
	"dia_pago" varchar,
	"drive_id" text,
	"cuenta" numeric,
	"grupo_nomina_id" varchar
);
--> statement-breakpoint
CREATE TABLE "empresas" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cliente_id" varchar,
	"razon_social" text NOT NULL,
	"nombre_comercial" text,
	"rfc" varchar(13) NOT NULL,
	"regimen_fiscal" text,
	"actividad_economica" text,
	"calle" text,
	"numero_exterior" varchar,
	"numero_interior" varchar,
	"colonia" text,
	"municipio" text,
	"estado" text,
	"codigo_postal" varchar(5),
	"pais" varchar DEFAULT 'México',
	"telefono" varchar,
	"email" varchar,
	"sitio_web" text,
	"representante_legal" text,
	"rfc_representante" varchar(13),
	"curp_representante" varchar(18),
	"fecha_constitucion" date,
	"fecha_inicio_operaciones" date,
	"logo_url" text,
	"notas" text,
	"estatus" varchar DEFAULT 'activa',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "empresas_rfc_unique" UNIQUE("rfc")
);
--> statement-breakpoint
CREATE TABLE "entrevistas" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cliente_id" varchar NOT NULL,
	"empresa_id" varchar NOT NULL,
	"proceso_seleccion_id" varchar NOT NULL,
	"tipo" varchar DEFAULT 'rh' NOT NULL,
	"titulo" varchar NOT NULL,
	"fecha_hora" timestamp NOT NULL,
	"duracion_minutos" integer DEFAULT 60,
	"modalidad" varchar DEFAULT 'presencial',
	"ubicacion" varchar,
	"entrevistadores" jsonb DEFAULT '[]'::jsonb,
	"estatus" varchar DEFAULT 'programada',
	"calificacion" integer,
	"fortalezas" text,
	"areas_oportunidad" text,
	"recomendacion" varchar,
	"comentarios" text,
	"archivo_notas" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "etapas_seleccion" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cliente_id" varchar NOT NULL,
	"empresa_id" varchar NOT NULL,
	"nombre" varchar NOT NULL,
	"descripcion" text,
	"orden" integer NOT NULL,
	"color" varchar DEFAULT '#6366f1',
	"es_etapa_final" boolean DEFAULT false,
	"es_positiva" boolean DEFAULT true,
	"activa" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "evaluaciones" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cliente_id" varchar NOT NULL,
	"empresa_id" varchar NOT NULL,
	"proceso_seleccion_id" varchar NOT NULL,
	"tipo" varchar NOT NULL,
	"nombre" varchar NOT NULL,
	"descripcion" text,
	"fecha_aplicacion" timestamp,
	"fecha_limite" timestamp,
	"calificacion" numeric,
	"calificacion_maxima" numeric,
	"aprobada" boolean,
	"archivo_resultados" varchar,
	"comentarios" text,
	"aplicada_por" varchar,
	"estatus" varchar DEFAULT 'pendiente',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "grupos_nomina" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cliente_id" varchar NOT NULL,
	"empresa_id" varchar NOT NULL,
	"nombre" varchar NOT NULL,
	"tipo_periodo" varchar NOT NULL,
	"dia_inicio_semana" integer DEFAULT 1,
	"dia_corte" integer,
	"dia_pago" integer,
	"dias_calculo" integer,
	"descripcion" text,
	"activo" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "grupos_nomina_nombre_unique" UNIQUE("nombre")
);
--> statement-breakpoint
CREATE TABLE "hiring_process" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cliente_id" varchar NOT NULL,
	"empresa_id" varchar NOT NULL,
	"nombre" text NOT NULL,
	"apellido_paterno" text NOT NULL,
	"apellido_materno" text,
	"position" text NOT NULL,
	"department" text NOT NULL,
	"proposed_salary" numeric(10, 2) NOT NULL,
	"start_date" date NOT NULL,
	"stage" text DEFAULT 'oferta' NOT NULL,
	"status" text DEFAULT 'activo' NOT NULL,
	"contract_type" text NOT NULL,
	"contract_duration" text,
	"email" text,
	"phone" text,
	"rfc" varchar(13),
	"curp" varchar(18),
	"nss" varchar(11),
	"offer_letter_sent" text DEFAULT 'false',
	"offer_accepted_date" date,
	"documents_checklist" jsonb,
	"imss_number" text,
	"imss_registration_date" date,
	"contract_signed_date" date,
	"onboarding_completed_date" date,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "historial_proceso_seleccion" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cliente_id" varchar NOT NULL,
	"empresa_id" varchar NOT NULL,
	"proceso_seleccion_id" varchar NOT NULL,
	"etapa_anterior_id" varchar,
	"etapa_nueva_id" varchar NOT NULL,
	"comentario" text,
	"movido_por" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "horas_extras" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cliente_id" varchar NOT NULL,
	"empresa_id" varchar NOT NULL,
	"empleado_id" varchar NOT NULL,
	"centro_trabajo_id" varchar,
	"attendance_id" varchar,
	"fecha" date NOT NULL,
	"tipo_hora_extra" varchar DEFAULT 'dobles' NOT NULL,
	"cantidad_horas" numeric(4, 2) NOT NULL,
	"hora_inicio" varchar,
	"hora_fin" varchar,
	"motivo" text,
	"autorizado_por" varchar,
	"fecha_autorizacion" timestamp,
	"estatus" varchar DEFAULT 'pendiente',
	"monto_calculado" numeric(10, 2),
	"notas" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "incapacidades" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cliente_id" varchar NOT NULL,
	"empresa_id" varchar NOT NULL,
	"empleado_id" varchar NOT NULL,
	"tipo" varchar NOT NULL,
	"fecha_inicio" date NOT NULL,
	"fecha_fin" date NOT NULL,
	"dias_incapacidad" integer NOT NULL,
	"numero_certificado" varchar,
	"certificado_medico_url" text,
	"diagnostico" text,
	"medico_nombre" varchar,
	"unidad_medica" varchar,
	"porcentaje_pago" integer,
	"pago_patron_primeros_tres_dias" boolean DEFAULT false,
	"pago_imss_desde" date,
	"estatus" varchar DEFAULT 'activa' NOT NULL,
	"notas_internas" text,
	"registrado_por" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "incidencias_asistencia" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cliente_id" varchar NOT NULL,
	"empresa_id" varchar NOT NULL,
	"employee_id" varchar NOT NULL,
	"centro_trabajo_id" varchar,
	"fecha" date NOT NULL,
	"faltas" integer DEFAULT 0 NOT NULL,
	"retardos" integer DEFAULT 0 NOT NULL,
	"horas_extra" numeric(10, 2) DEFAULT '0' NOT NULL,
	"horas_descontadas" numeric(10, 2) DEFAULT '0' NOT NULL,
	"incapacidades" integer DEFAULT 0 NOT NULL,
	"permisos" integer DEFAULT 0 NOT NULL,
	"vacaciones" integer DEFAULT 0 NOT NULL,
	"dias_domingo" integer DEFAULT 0 NOT NULL,
	"notas" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "incidencias_nomina" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cliente_id" varchar NOT NULL,
	"empresa_id" varchar NOT NULL,
	"empleado_id" varchar NOT NULL,
	"periodo_id" varchar NOT NULL,
	"tipo_incidencia" varchar(50) NOT NULL,
	"fecha" date NOT NULL,
	"concepto_id" varchar,
	"cantidad" numeric(18, 4),
	"monto_bp" bigint,
	"porcentaje" numeric(10, 4),
	"descripcion" text,
	"justificada" boolean DEFAULT false,
	"documento_url" varchar(500),
	"estatus" varchar(20) DEFAULT 'pendiente' NOT NULL,
	"fecha_aprobacion" timestamp,
	"aprobado_por" varchar,
	"notas_rechazo" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" varchar
);
--> statement-breakpoint
CREATE TABLE "lawsuits" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cliente_id" varchar NOT NULL,
	"empresa_id" varchar NOT NULL,
	"title" text NOT NULL,
	"employee_name" text NOT NULL,
	"legal_case_id" varchar,
	"stage" text DEFAULT 'conciliacion' NOT NULL,
	"description" text,
	"document_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "legal_cases" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cliente_id" varchar NOT NULL,
	"empresa_id" varchar NOT NULL,
	"employee_id" varchar,
	"employee_name" text NOT NULL,
	"baja_category" text DEFAULT 'voluntaria' NOT NULL,
	"baja_type" text DEFAULT 'renuncia_voluntaria' NOT NULL,
	"case_type" text NOT NULL,
	"reason" text NOT NULL,
	"status" text DEFAULT 'calculo' NOT NULL,
	"mode" text NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"notes" text,
	"salario_diario" numeric(10, 2),
	"empleado_fecha_inicio" date,
	"calculo_aprobado" text DEFAULT 'false',
	"calculo_data" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "medios_pago" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cliente_id" varchar NOT NULL,
	"empresa_id" varchar NOT NULL,
	"nombre" varchar NOT NULL,
	"descripcion" text,
	"tipo_comprobante" varchar NOT NULL,
	"cuenta_deposito" varchar NOT NULL,
	"activo" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "medios_pago_nombre_unique" UNIQUE("nombre")
);
--> statement-breakpoint
CREATE TABLE "modulos" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"codigo" varchar NOT NULL,
	"nombre" varchar NOT NULL,
	"descripcion" text,
	"icono" varchar,
	"activo" boolean DEFAULT true NOT NULL,
	"orden" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "modulos_codigo_unique" UNIQUE("codigo")
);
--> statement-breakpoint
CREATE TABLE "nomina_movimientos" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cliente_id" varchar NOT NULL,
	"empresa_id" varchar NOT NULL,
	"empleado_id" varchar NOT NULL,
	"periodo_id" varchar NOT NULL,
	"concepto_id" varchar NOT NULL,
	"tipo" varchar(20) NOT NULL,
	"clave_sat" varchar(10),
	"concepto_nombre" varchar(255) NOT NULL,
	"importe_gravado_bp" bigint DEFAULT 0 NOT NULL,
	"importe_exento_bp" bigint DEFAULT 0 NOT NULL,
	"importe_total_bp" bigint DEFAULT 0 NOT NULL,
	"cantidad" numeric(18, 4),
	"factor" numeric(18, 6),
	"formula_aplicada" text,
	"origen" varchar(50),
	"incidencia_id" varchar,
	"integra_sdi" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nomina_resumen" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cliente_id" varchar NOT NULL,
	"empresa_id" varchar NOT NULL,
	"empleado_id" varchar NOT NULL,
	"periodo_id" varchar NOT NULL,
	"percepciones_gravadas_bp" bigint DEFAULT 0 NOT NULL,
	"percepciones_exentas_bp" bigint DEFAULT 0 NOT NULL,
	"total_percepciones_bp" bigint DEFAULT 0 NOT NULL,
	"isr_causado_bp" bigint DEFAULT 0 NOT NULL,
	"subsidio_aplicado_bp" bigint DEFAULT 0 NOT NULL,
	"subsidio_entregable_bp" bigint DEFAULT 0 NOT NULL,
	"isr_retenido_bp" bigint DEFAULT 0 NOT NULL,
	"imss_trabajador_bp" bigint DEFAULT 0 NOT NULL,
	"imss_patron_bp" bigint DEFAULT 0 NOT NULL,
	"total_otras_deducciones_bp" bigint DEFAULT 0 NOT NULL,
	"total_deducciones_bp" bigint DEFAULT 0 NOT NULL,
	"neto_pagar_bp" bigint DEFAULT 0 NOT NULL,
	"dias_trabajados" integer,
	"dias_faltas" integer DEFAULT 0,
	"horas_extra" numeric(10, 2) DEFAULT '0',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "nomina_resumen_empleado_id_periodo_id_unique" UNIQUE("empleado_id","periodo_id")
);
--> statement-breakpoint
CREATE TABLE "nominas" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cliente_id" varchar NOT NULL,
	"empresa_id" varchar NOT NULL,
	"tipo" varchar NOT NULL,
	"periodo" varchar NOT NULL,
	"frecuencia" varchar NOT NULL,
	"tipo_extraordinario" varchar,
	"status" varchar DEFAULT 'pre_nomina' NOT NULL,
	"banco_layout_id" varchar,
	"cuenta_cargo" varchar,
	"fecha_pago" date,
	"total_neto" numeric(12, 2) NOT NULL,
	"total_empleados" integer NOT NULL,
	"empleados_data" jsonb NOT NULL,
	"creado_por" varchar,
	"aprobado_por" varchar,
	"fecha_aprobacion" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ofertas" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cliente_id" varchar NOT NULL,
	"proceso_seleccion_id" varchar NOT NULL,
	"vacante_id" varchar NOT NULL,
	"candidato_id" varchar NOT NULL,
	"puesto" varchar NOT NULL,
	"departamento" varchar NOT NULL,
	"tipo_contrato" varchar DEFAULT 'indeterminado',
	"fecha_inicio_propuesta" date,
	"salario_bruto_mensual" numeric NOT NULL,
	"salario_diario" numeric,
	"prestaciones" text,
	"periodo_prueba" boolean DEFAULT false,
	"duracion_prueba_dias" integer,
	"modalidad_trabajo" varchar DEFAULT 'presencial',
	"ubicacion" varchar,
	"horario" varchar,
	"fecha_envio" date,
	"fecha_limite_respuesta" date,
	"estatus" varchar DEFAULT 'borrador',
	"documento_oferta" varchar,
	"notas" text,
	"empresa_id" varchar NOT NULL,
	"creado_por" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "pagos_creditos_descuentos" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cliente_id" varchar NOT NULL,
	"empresa_id" varchar NOT NULL,
	"credito_legal_id" varchar,
	"prestamo_interno_id" varchar,
	"empleado_id" varchar NOT NULL,
	"monto" numeric NOT NULL,
	"saldo_anterior" numeric NOT NULL,
	"saldo_nuevo" numeric NOT NULL,
	"fecha_pago" date NOT NULL,
	"periodo_nomina_id" varchar,
	"tipo_movimiento" varchar DEFAULT 'DESCUENTO_NOMINA' NOT NULL,
	"notas" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payroll_periods" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cliente_id" varchar NOT NULL,
	"empresa_id" varchar NOT NULL,
	"grupo_nomina_id" varchar NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"frequency" text NOT NULL,
	"year" integer NOT NULL,
	"period_number" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "payroll_periods_grupo_nomina_id_year_period_number_unique" UNIQUE("grupo_nomina_id","year","period_number")
);
--> statement-breakpoint
CREATE TABLE "periodos_nomina" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cliente_id" varchar NOT NULL,
	"empresa_id" varchar NOT NULL,
	"centro_trabajo_id" varchar,
	"tipo_periodo" varchar(20) NOT NULL,
	"numero_periodo" integer NOT NULL,
	"anio" integer NOT NULL,
	"fecha_inicio" date NOT NULL,
	"fecha_fin" date NOT NULL,
	"fecha_pago" date NOT NULL,
	"dias_periodo" integer NOT NULL,
	"dias_laborales" integer NOT NULL,
	"estatus" varchar(20) DEFAULT 'abierto' NOT NULL,
	"fecha_calculo" timestamp,
	"fecha_autorizacion" timestamp,
	"fecha_dispersion" timestamp,
	"fecha_timbrado" timestamp,
	"fecha_cierre" timestamp,
	"total_percepciones_bp" bigint,
	"total_deducciones_bp" bigint,
	"total_neto_bp" bigint,
	"total_empleados" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" varchar,
	CONSTRAINT "periodos_nomina_cliente_id_empresa_id_tipo_periodo_numero_periodo_anio_unique" UNIQUE("cliente_id","empresa_id","tipo_periodo","numero_periodo","anio")
);
--> statement-breakpoint
CREATE TABLE "prestamos_internos" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cliente_id" varchar NOT NULL,
	"empresa_id" varchar NOT NULL,
	"empleado_id" varchar NOT NULL,
	"monto_total" numeric NOT NULL,
	"plazo" integer NOT NULL,
	"tipo_plazo" varchar DEFAULT 'QUINCENAS' NOT NULL,
	"monto_por_periodo" numeric NOT NULL,
	"saldo_pendiente" numeric NOT NULL,
	"fecha_otorgamiento" date NOT NULL,
	"fecha_inicio" date NOT NULL,
	"fecha_estimada_termino" date NOT NULL,
	"fecha_termino" date,
	"descuento_automatico" boolean DEFAULT true,
	"estado" varchar DEFAULT 'ACTIVO' NOT NULL,
	"concepto" text,
	"notas" text,
	"autorizado_por" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "proceso_seleccion" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cliente_id" varchar NOT NULL,
	"empresa_id" varchar NOT NULL,
	"candidato_id" varchar NOT NULL,
	"vacante_id" varchar NOT NULL,
	"etapa_actual_id" varchar NOT NULL,
	"fecha_aplicacion" timestamp DEFAULT now() NOT NULL,
	"fecha_ultimo_movimiento" timestamp DEFAULT now(),
	"calificacion_general" integer,
	"estatus" varchar DEFAULT 'activo',
	"motivo_descarte" text,
	"notas" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "proceso_seleccion_candidato_id_vacante_id_unique" UNIQUE("candidato_id","vacante_id")
);
--> statement-breakpoint
CREATE TABLE "puestos" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cliente_id" varchar NOT NULL,
	"empresa_id" varchar NOT NULL,
	"clave_puesto" varchar NOT NULL,
	"nombre_puesto" varchar NOT NULL,
	"area" varchar,
	"departamento" varchar,
	"ubicacion" varchar,
	"nivel_jerarquico" varchar,
	"tipo_puesto" varchar,
	"reporta_a" varchar,
	"puestos_que_reportan" jsonb DEFAULT '[]'::jsonb,
	"proposito_general" text,
	"funciones_principales" jsonb DEFAULT '[]'::jsonb,
	"funciones_secundarias" jsonb DEFAULT '[]'::jsonb,
	"autoridad_y_decisiones" text,
	"relaciones" jsonb DEFAULT '[]'::jsonb,
	"formacion_academica" jsonb DEFAULT '{}'::jsonb,
	"experiencia_laboral" jsonb DEFAULT '{}'::jsonb,
	"conocimientos_tecnicos" jsonb DEFAULT '[]'::jsonb,
	"competencias_conductuales" jsonb DEFAULT '[]'::jsonb,
	"idiomas" jsonb DEFAULT '[]'::jsonb,
	"certificaciones" jsonb DEFAULT '[]'::jsonb,
	"condiciones_laborales" jsonb DEFAULT '{}'::jsonb,
	"compensacion_y_prestaciones" jsonb DEFAULT '{}'::jsonb,
	"indicadores_desempeno" jsonb DEFAULT '[]'::jsonb,
	"cumplimiento_legal" jsonb DEFAULT '{}'::jsonb,
	"estatus" varchar DEFAULT 'activo',
	"fecha_creacion" timestamp DEFAULT now() NOT NULL,
	"ultima_actualizacion" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "puestos_clave_puesto_unique" UNIQUE("clave_puesto")
);
--> statement-breakpoint
CREATE TABLE "registros_patronales" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"empresa_id" varchar NOT NULL,
	"numero_registro_patronal" varchar(11) NOT NULL,
	"nombre_centro_trabajo" text NOT NULL,
	"calle" text,
	"numero_exterior" varchar,
	"numero_interior" varchar,
	"colonia" text,
	"municipio" text,
	"estado" text,
	"codigo_postal" varchar(5),
	"clase_riesgo" varchar DEFAULT 'I' NOT NULL,
	"prima_riesgo" numeric(5, 4) DEFAULT '0.5000',
	"division_economica" text,
	"grupo_actividad" text,
	"fraccion_actividad" text,
	"descripcion_actividad" text,
	"fecha_registro" date,
	"fecha_baja" date,
	"estatus" varchar DEFAULT 'activo',
	"notas" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "registros_patronales_numero_registro_patronal_unique" UNIQUE("numero_registro_patronal")
);
--> statement-breakpoint
CREATE TABLE "registros_repse" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cliente_id" varchar NOT NULL,
	"empresa_id" varchar NOT NULL,
	"numero_registro" varchar NOT NULL,
	"fecha_emision" date NOT NULL,
	"fecha_vencimiento" date NOT NULL,
	"estatus" varchar DEFAULT 'vigente',
	"tipo_registro" varchar DEFAULT 'servicios_especializados',
	"archivo_url" text,
	"archivo_nombre" varchar,
	"alerta_vencimiento_90" boolean DEFAULT false,
	"alerta_vencimiento_60" boolean DEFAULT false,
	"alerta_vencimiento_30" boolean DEFAULT false,
	"notas" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settlements" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cliente_id" varchar NOT NULL,
	"empresa_id" varchar NOT NULL,
	"legal_case_id" varchar,
	"settlement_type" text NOT NULL,
	"employee_name" text,
	"salary" numeric(10, 2) NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"years_worked" numeric(5, 2) NOT NULL,
	"concepts" jsonb NOT NULL,
	"total_amount" numeric(12, 2) NOT NULL,
	"mode" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "solicitudes_permisos" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cliente_id" varchar NOT NULL,
	"empresa_id" varchar NOT NULL,
	"empleado_id" varchar NOT NULL,
	"tipo_permiso" varchar NOT NULL,
	"con_goce" boolean DEFAULT false NOT NULL,
	"fecha_inicio" date NOT NULL,
	"fecha_fin" date NOT NULL,
	"horas_permiso" numeric(5, 2),
	"dias_solicitados" numeric(5, 2) NOT NULL,
	"motivo" text NOT NULL,
	"documento_soporte_url" text,
	"estatus" varchar DEFAULT 'pendiente' NOT NULL,
	"fecha_solicitud" timestamp DEFAULT now() NOT NULL,
	"fecha_respuesta" timestamp,
	"aprobado_por" varchar,
	"comentarios_aprobador" text,
	"notas_internas" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "solicitudes_vacaciones" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cliente_id" varchar NOT NULL,
	"empresa_id" varchar NOT NULL,
	"empleado_id" varchar NOT NULL,
	"fecha_inicio" date NOT NULL,
	"fecha_fin" date NOT NULL,
	"dias_solicitados" integer NOT NULL,
	"dias_legales_corresponden" integer,
	"prima_vacacional" numeric(12, 2),
	"estatus" varchar DEFAULT 'pendiente' NOT NULL,
	"motivo" text,
	"fecha_solicitud" timestamp DEFAULT now() NOT NULL,
	"fecha_respuesta" timestamp,
	"aprobado_por" varchar,
	"comentarios_aprobador" text,
	"notas_empleado" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "turnos_centro_trabajo" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"centro_trabajo_id" varchar NOT NULL,
	"nombre" varchar NOT NULL,
	"descripcion" text,
	"hora_inicio" varchar NOT NULL,
	"hora_fin" varchar NOT NULL,
	"minutos_tolerancia_entrada" integer DEFAULT 10,
	"minutos_tolerancia_comida" integer DEFAULT 60,
	"trabaja_lunes" boolean DEFAULT true,
	"trabaja_martes" boolean DEFAULT true,
	"trabaja_miercoles" boolean DEFAULT true,
	"trabaja_jueves" boolean DEFAULT true,
	"trabaja_viernes" boolean DEFAULT true,
	"trabaja_sabado" boolean DEFAULT false,
	"trabaja_domingo" boolean DEFAULT false,
	"estatus" varchar DEFAULT 'activo',
	"notas" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"tipo_usuario" varchar DEFAULT 'cliente' NOT NULL,
	"cliente_id" varchar,
	"is_super_admin" boolean DEFAULT false NOT NULL,
	"nombre" text,
	"email" varchar,
	"activo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "usuarios_permisos" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" varchar NOT NULL,
	"scope_tipo" varchar NOT NULL,
	"cliente_id" varchar,
	"empresa_id" varchar,
	"centro_trabajo_id" varchar,
	"modulo_id" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "check_cliente_scope" CHECK (("usuarios_permisos"."scope_tipo" = 'cliente' AND "usuarios_permisos"."cliente_id" IS NOT NULL) OR "usuarios_permisos"."scope_tipo" != 'cliente'),
	CONSTRAINT "check_empresa_scope" CHECK (("usuarios_permisos"."scope_tipo" = 'empresa' AND "usuarios_permisos"."empresa_id" IS NOT NULL) OR "usuarios_permisos"."scope_tipo" != 'empresa'),
	CONSTRAINT "check_centro_scope" CHECK (("usuarios_permisos"."scope_tipo" = 'centro_trabajo' AND "usuarios_permisos"."centro_trabajo_id" IS NOT NULL) OR "usuarios_permisos"."scope_tipo" != 'centro_trabajo'),
	CONSTRAINT "check_modulo_scope" CHECK (("usuarios_permisos"."scope_tipo" = 'modulo' AND "usuarios_permisos"."modulo_id" IS NOT NULL) OR "usuarios_permisos"."scope_tipo" != 'modulo')
);
--> statement-breakpoint
CREATE TABLE "vacantes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cliente_id" varchar NOT NULL,
	"titulo" varchar NOT NULL,
	"puesto_id" varchar,
	"departamento" varchar NOT NULL,
	"numero_vacantes" integer DEFAULT 1 NOT NULL,
	"prioridad" varchar DEFAULT 'media' NOT NULL,
	"fecha_apertura" date DEFAULT CURRENT_DATE NOT NULL,
	"fecha_limite" date,
	"fecha_solicitud" date DEFAULT CURRENT_DATE NOT NULL,
	"estatus" varchar DEFAULT 'abierta' NOT NULL,
	"tipo_contrato" varchar DEFAULT 'indeterminado',
	"modalidad_trabajo" varchar DEFAULT 'presencial',
	"ubicacion" varchar,
	"centro_trabajo_id" varchar,
	"rango_salarial_min" numeric,
	"rango_salarial_max" numeric,
	"descripcion" text,
	"requisitos" text,
	"responsabilidades" text,
	"prestaciones" text,
	"conocimientos_tecnicos" jsonb DEFAULT '[]'::jsonb,
	"competencias_conductuales" jsonb DEFAULT '[]'::jsonb,
	"idiomas" jsonb DEFAULT '[]'::jsonb,
	"certificaciones" jsonb DEFAULT '[]'::jsonb,
	"condiciones_laborales" jsonb DEFAULT '{}'::jsonb,
	"empresa_id" varchar NOT NULL,
	"creado_por" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "actas_administrativas" ADD CONSTRAINT "actas_administrativas_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "actas_administrativas" ADD CONSTRAINT "actas_administrativas_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "actas_administrativas" ADD CONSTRAINT "actas_administrativas_empleado_id_employees_id_fk" FOREIGN KEY ("empleado_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_audit_logs" ADD CONSTRAINT "admin_audit_logs_admin_user_id_users_id_fk" FOREIGN KEY ("admin_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_audit_logs" ADD CONSTRAINT "admin_audit_logs_target_cliente_id_clientes_id_fk" FOREIGN KEY ("target_cliente_id") REFERENCES "public"."clientes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_audit_logs" ADD CONSTRAINT "admin_audit_logs_target_empresa_id_empresas_id_fk" FOREIGN KEY ("target_empresa_id") REFERENCES "public"."empresas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_audit_logs" ADD CONSTRAINT "admin_audit_logs_target_centro_trabajo_id_centros_trabajo_id_fk" FOREIGN KEY ("target_centro_trabajo_id") REFERENCES "public"."centros_trabajo"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asignaciones_personal_repse" ADD CONSTRAINT "asignaciones_personal_repse_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asignaciones_personal_repse" ADD CONSTRAINT "asignaciones_personal_repse_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asignaciones_personal_repse" ADD CONSTRAINT "asignaciones_personal_repse_contrato_repse_id_contratos_repse_id_fk" FOREIGN KEY ("contrato_repse_id") REFERENCES "public"."contratos_repse"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asignaciones_personal_repse" ADD CONSTRAINT "asignaciones_personal_repse_empleado_id_employees_id_fk" FOREIGN KEY ("empleado_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_turno_id_turnos_centro_trabajo_id_fk" FOREIGN KEY ("turno_id") REFERENCES "public"."turnos_centro_trabajo"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "avisos_repse" ADD CONSTRAINT "avisos_repse_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "avisos_repse" ADD CONSTRAINT "avisos_repse_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "avisos_repse" ADD CONSTRAINT "avisos_repse_contrato_repse_id_contratos_repse_id_fk" FOREIGN KEY ("contrato_repse_id") REFERENCES "public"."contratos_repse"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "baja_special_concepts" ADD CONSTRAINT "baja_special_concepts_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "baja_special_concepts" ADD CONSTRAINT "baja_special_concepts_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bancos_layouts" ADD CONSTRAINT "bancos_layouts_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bancos_layouts" ADD CONSTRAINT "bancos_layouts_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidatos" ADD CONSTRAINT "candidatos_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidatos" ADD CONSTRAINT "candidatos_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "centros_trabajo" ADD CONSTRAINT "centros_trabajo_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "centros_trabajo" ADD CONSTRAINT "centros_trabajo_registro_patronal_id_registros_patronales_id_fk" FOREIGN KEY ("registro_patronal_id") REFERENCES "public"."registros_patronales"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clientes_repse" ADD CONSTRAINT "clientes_repse_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clientes_repse" ADD CONSTRAINT "clientes_repse_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conceptos_medio_pago" ADD CONSTRAINT "conceptos_medio_pago_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conceptos_medio_pago" ADD CONSTRAINT "conceptos_medio_pago_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conceptos_medios_pago_rel" ADD CONSTRAINT "conceptos_medios_pago_rel_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conceptos_medios_pago_rel" ADD CONSTRAINT "conceptos_medios_pago_rel_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conceptos_medios_pago_rel" ADD CONSTRAINT "conceptos_medios_pago_rel_concepto_id_conceptos_medio_pago_id_fk" FOREIGN KEY ("concepto_id") REFERENCES "public"."conceptos_medio_pago"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conceptos_medios_pago_rel" ADD CONSTRAINT "conceptos_medios_pago_rel_medio_pago_id_medios_pago_id_fk" FOREIGN KEY ("medio_pago_id") REFERENCES "public"."medios_pago"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conceptos_nomina" ADD CONSTRAINT "conceptos_nomina_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conceptos_nomina" ADD CONSTRAINT "conceptos_nomina_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contratos_repse" ADD CONSTRAINT "contratos_repse_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contratos_repse" ADD CONSTRAINT "contratos_repse_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contratos_repse" ADD CONSTRAINT "contratos_repse_registro_repse_id_registros_repse_id_fk" FOREIGN KEY ("registro_repse_id") REFERENCES "public"."registros_repse"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contratos_repse" ADD CONSTRAINT "contratos_repse_cliente_repse_id_clientes_repse_id_fk" FOREIGN KEY ("cliente_repse_id") REFERENCES "public"."clientes_repse"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credenciales_sistemas" ADD CONSTRAINT "credenciales_sistemas_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credenciales_sistemas" ADD CONSTRAINT "credenciales_sistemas_registro_patronal_id_registros_patronales_id_fk" FOREIGN KEY ("registro_patronal_id") REFERENCES "public"."registros_patronales"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creditos_legales" ADD CONSTRAINT "creditos_legales_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creditos_legales" ADD CONSTRAINT "creditos_legales_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creditos_legales" ADD CONSTRAINT "creditos_legales_empleado_id_employees_id_fk" FOREIGN KEY ("empleado_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "departments" ADD CONSTRAINT "departments_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "departments" ADD CONSTRAINT "departments_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "empleados_centros_trabajo" ADD CONSTRAINT "empleados_centros_trabajo_empleado_id_employees_id_fk" FOREIGN KEY ("empleado_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "empleados_centros_trabajo" ADD CONSTRAINT "empleados_centros_trabajo_centro_trabajo_id_centros_trabajo_id_fk" FOREIGN KEY ("centro_trabajo_id") REFERENCES "public"."centros_trabajo"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "empleados_centros_trabajo" ADD CONSTRAINT "empleados_centros_trabajo_turno_id_turnos_centro_trabajo_id_fk" FOREIGN KEY ("turno_id") REFERENCES "public"."turnos_centro_trabajo"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "empresas" ADD CONSTRAINT "empresas_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entrevistas" ADD CONSTRAINT "entrevistas_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entrevistas" ADD CONSTRAINT "entrevistas_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entrevistas" ADD CONSTRAINT "entrevistas_proceso_seleccion_id_proceso_seleccion_id_fk" FOREIGN KEY ("proceso_seleccion_id") REFERENCES "public"."proceso_seleccion"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "etapas_seleccion" ADD CONSTRAINT "etapas_seleccion_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "etapas_seleccion" ADD CONSTRAINT "etapas_seleccion_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evaluaciones" ADD CONSTRAINT "evaluaciones_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evaluaciones" ADD CONSTRAINT "evaluaciones_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evaluaciones" ADD CONSTRAINT "evaluaciones_proceso_seleccion_id_proceso_seleccion_id_fk" FOREIGN KEY ("proceso_seleccion_id") REFERENCES "public"."proceso_seleccion"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grupos_nomina" ADD CONSTRAINT "grupos_nomina_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grupos_nomina" ADD CONSTRAINT "grupos_nomina_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hiring_process" ADD CONSTRAINT "hiring_process_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hiring_process" ADD CONSTRAINT "hiring_process_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "historial_proceso_seleccion" ADD CONSTRAINT "historial_proceso_seleccion_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "historial_proceso_seleccion" ADD CONSTRAINT "historial_proceso_seleccion_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "historial_proceso_seleccion" ADD CONSTRAINT "historial_proceso_seleccion_proceso_seleccion_id_proceso_seleccion_id_fk" FOREIGN KEY ("proceso_seleccion_id") REFERENCES "public"."proceso_seleccion"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "historial_proceso_seleccion" ADD CONSTRAINT "historial_proceso_seleccion_etapa_anterior_id_etapas_seleccion_id_fk" FOREIGN KEY ("etapa_anterior_id") REFERENCES "public"."etapas_seleccion"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "historial_proceso_seleccion" ADD CONSTRAINT "historial_proceso_seleccion_etapa_nueva_id_etapas_seleccion_id_fk" FOREIGN KEY ("etapa_nueva_id") REFERENCES "public"."etapas_seleccion"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "horas_extras" ADD CONSTRAINT "horas_extras_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "horas_extras" ADD CONSTRAINT "horas_extras_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "horas_extras" ADD CONSTRAINT "horas_extras_empleado_id_employees_id_fk" FOREIGN KEY ("empleado_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "horas_extras" ADD CONSTRAINT "horas_extras_centro_trabajo_id_centros_trabajo_id_fk" FOREIGN KEY ("centro_trabajo_id") REFERENCES "public"."centros_trabajo"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "horas_extras" ADD CONSTRAINT "horas_extras_attendance_id_attendance_id_fk" FOREIGN KEY ("attendance_id") REFERENCES "public"."attendance"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incapacidades" ADD CONSTRAINT "incapacidades_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incapacidades" ADD CONSTRAINT "incapacidades_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incapacidades" ADD CONSTRAINT "incapacidades_empleado_id_employees_id_fk" FOREIGN KEY ("empleado_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incidencias_asistencia" ADD CONSTRAINT "incidencias_asistencia_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incidencias_asistencia" ADD CONSTRAINT "incidencias_asistencia_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incidencias_nomina" ADD CONSTRAINT "incidencias_nomina_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incidencias_nomina" ADD CONSTRAINT "incidencias_nomina_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incidencias_nomina" ADD CONSTRAINT "incidencias_nomina_periodo_id_periodos_nomina_id_fk" FOREIGN KEY ("periodo_id") REFERENCES "public"."periodos_nomina"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incidencias_nomina" ADD CONSTRAINT "incidencias_nomina_concepto_id_conceptos_nomina_id_fk" FOREIGN KEY ("concepto_id") REFERENCES "public"."conceptos_nomina"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lawsuits" ADD CONSTRAINT "lawsuits_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lawsuits" ADD CONSTRAINT "lawsuits_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "legal_cases" ADD CONSTRAINT "legal_cases_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "legal_cases" ADD CONSTRAINT "legal_cases_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medios_pago" ADD CONSTRAINT "medios_pago_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medios_pago" ADD CONSTRAINT "medios_pago_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nomina_movimientos" ADD CONSTRAINT "nomina_movimientos_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nomina_movimientos" ADD CONSTRAINT "nomina_movimientos_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nomina_movimientos" ADD CONSTRAINT "nomina_movimientos_periodo_id_periodos_nomina_id_fk" FOREIGN KEY ("periodo_id") REFERENCES "public"."periodos_nomina"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nomina_movimientos" ADD CONSTRAINT "nomina_movimientos_concepto_id_conceptos_nomina_id_fk" FOREIGN KEY ("concepto_id") REFERENCES "public"."conceptos_nomina"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nomina_resumen" ADD CONSTRAINT "nomina_resumen_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nomina_resumen" ADD CONSTRAINT "nomina_resumen_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nomina_resumen" ADD CONSTRAINT "nomina_resumen_periodo_id_periodos_nomina_id_fk" FOREIGN KEY ("periodo_id") REFERENCES "public"."periodos_nomina"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nominas" ADD CONSTRAINT "nominas_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nominas" ADD CONSTRAINT "nominas_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nominas" ADD CONSTRAINT "nominas_banco_layout_id_bancos_layouts_id_fk" FOREIGN KEY ("banco_layout_id") REFERENCES "public"."bancos_layouts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ofertas" ADD CONSTRAINT "ofertas_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ofertas" ADD CONSTRAINT "ofertas_proceso_seleccion_id_proceso_seleccion_id_fk" FOREIGN KEY ("proceso_seleccion_id") REFERENCES "public"."proceso_seleccion"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ofertas" ADD CONSTRAINT "ofertas_vacante_id_vacantes_id_fk" FOREIGN KEY ("vacante_id") REFERENCES "public"."vacantes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ofertas" ADD CONSTRAINT "ofertas_candidato_id_candidatos_id_fk" FOREIGN KEY ("candidato_id") REFERENCES "public"."candidatos"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ofertas" ADD CONSTRAINT "ofertas_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pagos_creditos_descuentos" ADD CONSTRAINT "pagos_creditos_descuentos_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pagos_creditos_descuentos" ADD CONSTRAINT "pagos_creditos_descuentos_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pagos_creditos_descuentos" ADD CONSTRAINT "pagos_creditos_descuentos_credito_legal_id_creditos_legales_id_fk" FOREIGN KEY ("credito_legal_id") REFERENCES "public"."creditos_legales"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pagos_creditos_descuentos" ADD CONSTRAINT "pagos_creditos_descuentos_prestamo_interno_id_prestamos_internos_id_fk" FOREIGN KEY ("prestamo_interno_id") REFERENCES "public"."prestamos_internos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pagos_creditos_descuentos" ADD CONSTRAINT "pagos_creditos_descuentos_empleado_id_employees_id_fk" FOREIGN KEY ("empleado_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pagos_creditos_descuentos" ADD CONSTRAINT "pagos_creditos_descuentos_periodo_nomina_id_payroll_periods_id_fk" FOREIGN KEY ("periodo_nomina_id") REFERENCES "public"."payroll_periods"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_periods" ADD CONSTRAINT "payroll_periods_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_periods" ADD CONSTRAINT "payroll_periods_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_periods" ADD CONSTRAINT "payroll_periods_grupo_nomina_id_grupos_nomina_id_fk" FOREIGN KEY ("grupo_nomina_id") REFERENCES "public"."grupos_nomina"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "periodos_nomina" ADD CONSTRAINT "periodos_nomina_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "periodos_nomina" ADD CONSTRAINT "periodos_nomina_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prestamos_internos" ADD CONSTRAINT "prestamos_internos_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prestamos_internos" ADD CONSTRAINT "prestamos_internos_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prestamos_internos" ADD CONSTRAINT "prestamos_internos_empleado_id_employees_id_fk" FOREIGN KEY ("empleado_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proceso_seleccion" ADD CONSTRAINT "proceso_seleccion_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proceso_seleccion" ADD CONSTRAINT "proceso_seleccion_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proceso_seleccion" ADD CONSTRAINT "proceso_seleccion_candidato_id_candidatos_id_fk" FOREIGN KEY ("candidato_id") REFERENCES "public"."candidatos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proceso_seleccion" ADD CONSTRAINT "proceso_seleccion_vacante_id_vacantes_id_fk" FOREIGN KEY ("vacante_id") REFERENCES "public"."vacantes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proceso_seleccion" ADD CONSTRAINT "proceso_seleccion_etapa_actual_id_etapas_seleccion_id_fk" FOREIGN KEY ("etapa_actual_id") REFERENCES "public"."etapas_seleccion"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "puestos" ADD CONSTRAINT "puestos_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "puestos" ADD CONSTRAINT "puestos_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registros_patronales" ADD CONSTRAINT "registros_patronales_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registros_repse" ADD CONSTRAINT "registros_repse_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registros_repse" ADD CONSTRAINT "registros_repse_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solicitudes_permisos" ADD CONSTRAINT "solicitudes_permisos_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solicitudes_permisos" ADD CONSTRAINT "solicitudes_permisos_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solicitudes_permisos" ADD CONSTRAINT "solicitudes_permisos_empleado_id_employees_id_fk" FOREIGN KEY ("empleado_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solicitudes_vacaciones" ADD CONSTRAINT "solicitudes_vacaciones_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solicitudes_vacaciones" ADD CONSTRAINT "solicitudes_vacaciones_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solicitudes_vacaciones" ADD CONSTRAINT "solicitudes_vacaciones_empleado_id_employees_id_fk" FOREIGN KEY ("empleado_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "turnos_centro_trabajo" ADD CONSTRAINT "turnos_centro_trabajo_centro_trabajo_id_centros_trabajo_id_fk" FOREIGN KEY ("centro_trabajo_id") REFERENCES "public"."centros_trabajo"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usuarios_permisos" ADD CONSTRAINT "usuarios_permisos_usuario_id_users_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usuarios_permisos" ADD CONSTRAINT "usuarios_permisos_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usuarios_permisos" ADD CONSTRAINT "usuarios_permisos_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usuarios_permisos" ADD CONSTRAINT "usuarios_permisos_centro_trabajo_id_centros_trabajo_id_fk" FOREIGN KEY ("centro_trabajo_id") REFERENCES "public"."centros_trabajo"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usuarios_permisos" ADD CONSTRAINT "usuarios_permisos_modulo_id_modulos_id_fk" FOREIGN KEY ("modulo_id") REFERENCES "public"."modulos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vacantes" ADD CONSTRAINT "vacantes_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vacantes" ADD CONSTRAINT "vacantes_puesto_id_puestos_id_fk" FOREIGN KEY ("puesto_id") REFERENCES "public"."puestos"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vacantes" ADD CONSTRAINT "vacantes_centro_trabajo_id_centros_trabajo_id_fk" FOREIGN KEY ("centro_trabajo_id") REFERENCES "public"."centros_trabajo"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vacantes" ADD CONSTRAINT "vacantes_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "actas_administrativas_cliente_empresa_idx" ON "actas_administrativas" USING btree ("cliente_id","empresa_id");--> statement-breakpoint
CREATE INDEX "admin_audit_logs_admin_user_idx" ON "admin_audit_logs" USING btree ("admin_user_id");--> statement-breakpoint
CREATE INDEX "admin_audit_logs_action_idx" ON "admin_audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "admin_audit_logs_resource_idx" ON "admin_audit_logs" USING btree ("resource_type","resource_id");--> statement-breakpoint
CREATE INDEX "admin_audit_logs_created_at_idx" ON "admin_audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "admin_audit_logs_tenant_trace_idx" ON "admin_audit_logs" USING btree ("target_cliente_id","target_empresa_id","target_centro_trabajo_id");--> statement-breakpoint
CREATE INDEX "asignaciones_personal_repse_cliente_empresa_idx" ON "asignaciones_personal_repse" USING btree ("cliente_id","empresa_id");--> statement-breakpoint
CREATE INDEX "attendance_cliente_empresa_idx" ON "attendance" USING btree ("cliente_id","empresa_id");--> statement-breakpoint
CREATE INDEX "avisos_repse_cliente_empresa_idx" ON "avisos_repse" USING btree ("cliente_id","empresa_id");--> statement-breakpoint
CREATE INDEX "baja_special_concepts_cliente_empresa_idx" ON "baja_special_concepts" USING btree ("cliente_id","empresa_id");--> statement-breakpoint
CREATE INDEX "bancos_layouts_cliente_empresa_idx" ON "bancos_layouts" USING btree ("cliente_id","empresa_id");--> statement-breakpoint
CREATE INDEX "candidatos_cliente_empresa_idx" ON "candidatos" USING btree ("cliente_id","empresa_id");--> statement-breakpoint
CREATE INDEX "clientes_repse_cliente_empresa_idx" ON "clientes_repse" USING btree ("cliente_id","empresa_id");--> statement-breakpoint
CREATE INDEX "conceptos_medio_pago_cliente_empresa_idx" ON "conceptos_medio_pago" USING btree ("cliente_id","empresa_id");--> statement-breakpoint
CREATE INDEX "conceptos_medios_pago_rel_cliente_empresa_idx" ON "conceptos_medios_pago_rel" USING btree ("cliente_id","empresa_id");--> statement-breakpoint
CREATE INDEX "conceptos_nomina_cliente_empresa_idx" ON "conceptos_nomina" USING btree ("cliente_id","empresa_id");--> statement-breakpoint
CREATE INDEX "conceptos_nomina_tipo_idx" ON "conceptos_nomina" USING btree ("tipo");--> statement-breakpoint
CREATE INDEX "conceptos_nomina_orden_idx" ON "conceptos_nomina" USING btree ("orden_calculo");--> statement-breakpoint
CREATE INDEX "contratos_repse_cliente_empresa_idx" ON "contratos_repse" USING btree ("cliente_id","empresa_id");--> statement-breakpoint
CREATE INDEX "creditos_legales_cliente_empresa_idx" ON "creditos_legales" USING btree ("cliente_id","empresa_id");--> statement-breakpoint
CREATE INDEX "departments_cliente_empresa_idx" ON "departments" USING btree ("cliente_id","empresa_id");--> statement-breakpoint
CREATE INDEX "employees_cliente_empresa_idx" ON "employees" USING btree ("cliente_id","empresa_id");--> statement-breakpoint
CREATE INDEX "entrevistas_cliente_empresa_idx" ON "entrevistas" USING btree ("cliente_id","empresa_id");--> statement-breakpoint
CREATE INDEX "etapas_seleccion_cliente_empresa_idx" ON "etapas_seleccion" USING btree ("cliente_id","empresa_id");--> statement-breakpoint
CREATE INDEX "evaluaciones_cliente_empresa_idx" ON "evaluaciones" USING btree ("cliente_id","empresa_id");--> statement-breakpoint
CREATE INDEX "grupos_nomina_cliente_empresa_idx" ON "grupos_nomina" USING btree ("cliente_id","empresa_id");--> statement-breakpoint
CREATE INDEX "hiring_process_cliente_empresa_idx" ON "hiring_process" USING btree ("cliente_id","empresa_id");--> statement-breakpoint
CREATE INDEX "historial_proceso_seleccion_cliente_empresa_idx" ON "historial_proceso_seleccion" USING btree ("cliente_id","empresa_id");--> statement-breakpoint
CREATE INDEX "horas_extras_cliente_empresa_idx" ON "horas_extras" USING btree ("cliente_id","empresa_id");--> statement-breakpoint
CREATE INDEX "incapacidades_cliente_empresa_idx" ON "incapacidades" USING btree ("cliente_id","empresa_id");--> statement-breakpoint
CREATE INDEX "incidencias_asistencia_cliente_empresa_idx" ON "incidencias_asistencia" USING btree ("cliente_id","empresa_id");--> statement-breakpoint
CREATE INDEX "incidencias_nomina_cliente_empresa_idx" ON "incidencias_nomina" USING btree ("cliente_id","empresa_id");--> statement-breakpoint
CREATE INDEX "incidencias_nomina_empleado_idx" ON "incidencias_nomina" USING btree ("empleado_id");--> statement-breakpoint
CREATE INDEX "incidencias_nomina_periodo_idx" ON "incidencias_nomina" USING btree ("periodo_id");--> statement-breakpoint
CREATE INDEX "incidencias_nomina_estatus_idx" ON "incidencias_nomina" USING btree ("estatus");--> statement-breakpoint
CREATE INDEX "lawsuits_cliente_empresa_idx" ON "lawsuits" USING btree ("cliente_id","empresa_id");--> statement-breakpoint
CREATE INDEX "legal_cases_cliente_empresa_idx" ON "legal_cases" USING btree ("cliente_id","empresa_id");--> statement-breakpoint
CREATE INDEX "medios_pago_cliente_empresa_idx" ON "medios_pago" USING btree ("cliente_id","empresa_id");--> statement-breakpoint
CREATE INDEX "nomina_movimientos_cliente_empresa_idx" ON "nomina_movimientos" USING btree ("cliente_id","empresa_id");--> statement-breakpoint
CREATE INDEX "nomina_movimientos_empleado_idx" ON "nomina_movimientos" USING btree ("empleado_id");--> statement-breakpoint
CREATE INDEX "nomina_movimientos_periodo_idx" ON "nomina_movimientos" USING btree ("periodo_id");--> statement-breakpoint
CREATE INDEX "nomina_movimientos_concepto_idx" ON "nomina_movimientos" USING btree ("concepto_id");--> statement-breakpoint
CREATE INDEX "nomina_resumen_cliente_empresa_idx" ON "nomina_resumen" USING btree ("cliente_id","empresa_id");--> statement-breakpoint
CREATE INDEX "nomina_resumen_empleado_idx" ON "nomina_resumen" USING btree ("empleado_id");--> statement-breakpoint
CREATE INDEX "nomina_resumen_periodo_idx" ON "nomina_resumen" USING btree ("periodo_id");--> statement-breakpoint
CREATE INDEX "nominas_status_idx" ON "nominas" USING btree ("status");--> statement-breakpoint
CREATE INDEX "nominas_periodo_idx" ON "nominas" USING btree ("periodo");--> statement-breakpoint
CREATE INDEX "nominas_fecha_pago_idx" ON "nominas" USING btree ("fecha_pago");--> statement-breakpoint
CREATE INDEX "nominas_cliente_empresa_idx" ON "nominas" USING btree ("cliente_id","empresa_id");--> statement-breakpoint
CREATE INDEX "ofertas_cliente_empresa_idx" ON "ofertas" USING btree ("cliente_id","empresa_id");--> statement-breakpoint
CREATE INDEX "pagos_creditos_descuentos_cliente_empresa_idx" ON "pagos_creditos_descuentos" USING btree ("cliente_id","empresa_id");--> statement-breakpoint
CREATE INDEX "payroll_periods_cliente_empresa_idx" ON "payroll_periods" USING btree ("cliente_id","empresa_id");--> statement-breakpoint
CREATE INDEX "periodos_nomina_cliente_empresa_idx" ON "periodos_nomina" USING btree ("cliente_id","empresa_id");--> statement-breakpoint
CREATE INDEX "periodos_nomina_estatus_idx" ON "periodos_nomina" USING btree ("estatus");--> statement-breakpoint
CREATE INDEX "periodos_nomina_fecha_pago_idx" ON "periodos_nomina" USING btree ("fecha_pago");--> statement-breakpoint
CREATE INDEX "prestamos_internos_cliente_empresa_idx" ON "prestamos_internos" USING btree ("cliente_id","empresa_id");--> statement-breakpoint
CREATE INDEX "proceso_seleccion_cliente_empresa_idx" ON "proceso_seleccion" USING btree ("cliente_id","empresa_id");--> statement-breakpoint
CREATE INDEX "puestos_cliente_empresa_idx" ON "puestos" USING btree ("cliente_id","empresa_id");--> statement-breakpoint
CREATE INDEX "registros_repse_cliente_empresa_idx" ON "registros_repse" USING btree ("cliente_id","empresa_id");--> statement-breakpoint
CREATE INDEX "settlements_cliente_empresa_idx" ON "settlements" USING btree ("cliente_id","empresa_id");--> statement-breakpoint
CREATE INDEX "solicitudes_permisos_cliente_empresa_idx" ON "solicitudes_permisos" USING btree ("cliente_id","empresa_id");--> statement-breakpoint
CREATE INDEX "solicitudes_vacaciones_cliente_empresa_idx" ON "solicitudes_vacaciones" USING btree ("cliente_id","empresa_id");--> statement-breakpoint
CREATE INDEX "usuarios_permisos_usuario_scope_idx" ON "usuarios_permisos" USING btree ("usuario_id","scope_tipo");--> statement-breakpoint
CREATE INDEX "usuarios_permisos_cliente_idx" ON "usuarios_permisos" USING btree ("cliente_id") WHERE "usuarios_permisos"."scope_tipo" = 'cliente';--> statement-breakpoint
CREATE INDEX "usuarios_permisos_empresa_idx" ON "usuarios_permisos" USING btree ("empresa_id") WHERE "usuarios_permisos"."scope_tipo" = 'empresa';--> statement-breakpoint
CREATE INDEX "usuarios_permisos_centro_idx" ON "usuarios_permisos" USING btree ("centro_trabajo_id") WHERE "usuarios_permisos"."scope_tipo" = 'centro_trabajo';--> statement-breakpoint
CREATE INDEX "usuarios_permisos_modulo_idx" ON "usuarios_permisos" USING btree ("usuario_id","modulo_id") WHERE "usuarios_permisos"."scope_tipo" = 'modulo';--> statement-breakpoint
CREATE UNIQUE INDEX "unique_usuario_cliente" ON "usuarios_permisos" USING btree ("usuario_id","cliente_id") WHERE "usuarios_permisos"."scope_tipo" = 'cliente' AND "usuarios_permisos"."cliente_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_usuario_empresa" ON "usuarios_permisos" USING btree ("usuario_id","empresa_id") WHERE "usuarios_permisos"."scope_tipo" = 'empresa' AND "usuarios_permisos"."empresa_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_usuario_centro" ON "usuarios_permisos" USING btree ("usuario_id","centro_trabajo_id") WHERE "usuarios_permisos"."scope_tipo" = 'centro_trabajo' AND "usuarios_permisos"."centro_trabajo_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_usuario_modulo" ON "usuarios_permisos" USING btree ("usuario_id","modulo_id") WHERE "usuarios_permisos"."scope_tipo" = 'modulo' AND "usuarios_permisos"."modulo_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "vacantes_cliente_empresa_idx" ON "vacantes" USING btree ("cliente_id","empresa_id");