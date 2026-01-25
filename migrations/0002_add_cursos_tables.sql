-- 1. Categorias Cursos
CREATE TABLE IF NOT EXISTS "categorias_cursos" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "cliente_id" varchar NOT NULL REFERENCES "clientes"("id") ON DELETE CASCADE,
  "nombre" varchar(100) NOT NULL,
  "descripcion" text,
  "color" varchar(7),
  "icono" varchar(50),
  "orden" integer DEFAULT 0,
  "activo" boolean DEFAULT true,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "categorias_cursos_cliente_idx" ON "categorias_cursos"("cliente_id");

-- 2. Cursos
CREATE TABLE IF NOT EXISTS "cursos" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "cliente_id" varchar NOT NULL REFERENCES "clientes"("id") ON DELETE CASCADE,
  "empresa_id" varchar REFERENCES "empresas"("id") ON DELETE CASCADE,
  "codigo" varchar(50) NOT NULL,
  "nombre" varchar(200) NOT NULL,
  "descripcion" text,
  "imagen_url" varchar(500),
  "categoria_id" varchar REFERENCES "categorias_cursos"("id") ON DELETE SET NULL,
  "dificultad" varchar(20),
  "duracion_estimada_minutos" integer,
  "tipo_capacitacion" varchar(30) NOT NULL,
  "tipo_evaluacion" varchar(30),
  "calificacion_minima" integer DEFAULT 70,
  "intentos_maximos" integer,
  "prerequisitos_curso_ids" jsonb,
  "estatus" varchar(20) DEFAULT 'borrador',
  "fecha_publicacion" timestamp,
  "requiere_renovacion" boolean DEFAULT false,
  "periodo_renovacion_meses" integer,
  "created_by" varchar,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "cursos_cliente_idx" ON "cursos"("cliente_id");
CREATE INDEX IF NOT EXISTS "cursos_estatus_idx" ON "cursos"("estatus");
CREATE INDEX IF NOT EXISTS "cursos_categoria_idx" ON "cursos"("categoria_id");
CREATE UNIQUE INDEX IF NOT EXISTS "cursos_codigo_cliente_unique" ON "cursos"("cliente_id", "codigo");

-- 3. Modulos Curso
CREATE TABLE IF NOT EXISTS "modulos_curso" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "curso_id" varchar NOT NULL REFERENCES "cursos"("id") ON DELETE CASCADE,
  "nombre" varchar(200) NOT NULL,
  "descripcion" text,
  "orden" integer NOT NULL,
  "duracion_estimada_minutos" integer,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "modulos_curso_curso_idx" ON "modulos_curso"("curso_id");
CREATE INDEX IF NOT EXISTS "modulos_curso_orden_idx" ON "modulos_curso"("curso_id", "orden");

-- 4. Lecciones Curso
CREATE TABLE IF NOT EXISTS "lecciones_curso" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "modulo_id" varchar NOT NULL REFERENCES "modulos_curso"("id") ON DELETE CASCADE,
  "nombre" varchar(200) NOT NULL,
  "descripcion" text,
  "orden" integer NOT NULL,
  "duracion_estimada_minutos" integer,
  "tipo_contenido" varchar(20) NOT NULL,
  "contenido" jsonb,
  "video_url" varchar(500),
  "video_proveedor" varchar(20),
  "archivo_url" varchar(500),
  "archivo_nombre" varchar(255),
  "archivo_tipo" varchar(100),
  "quiz_id" varchar,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "lecciones_curso_modulo_idx" ON "lecciones_curso"("modulo_id");
CREATE INDEX IF NOT EXISTS "lecciones_curso_orden_idx" ON "lecciones_curso"("modulo_id", "orden");

-- 5. Quizzes Curso
CREATE TABLE IF NOT EXISTS "quizzes_curso" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "curso_id" varchar NOT NULL REFERENCES "cursos"("id") ON DELETE CASCADE,
  "modulo_id" varchar REFERENCES "modulos_curso"("id") ON DELETE CASCADE,
  "nombre" varchar(200) NOT NULL,
  "descripcion" text,
  "tipo" varchar(30) NOT NULL,
  "tiempo_limite_minutos" integer,
  "calificacion_minima" integer DEFAULT 70,
  "intentos_maximos" integer,
  "mostrar_respuestas_correctas" boolean DEFAULT true,
  "orden_aleatorio" boolean DEFAULT false,
  "mezclar_opciones" boolean DEFAULT false,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "quizzes_curso_curso_idx" ON "quizzes_curso"("curso_id");
CREATE INDEX IF NOT EXISTS "quizzes_curso_modulo_idx" ON "quizzes_curso"("modulo_id");

-- 6. Preguntas Quiz
CREATE TABLE IF NOT EXISTS "preguntas_quiz" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "quiz_id" varchar NOT NULL REFERENCES "quizzes_curso"("id") ON DELETE CASCADE,
  "tipo_pregunta" varchar(30) NOT NULL,
  "pregunta" text NOT NULL,
  "explicacion" text,
  "opciones" jsonb,
  "puntos" integer DEFAULT 1,
  "orden" integer NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "preguntas_quiz_quiz_idx" ON "preguntas_quiz"("quiz_id");
CREATE INDEX IF NOT EXISTS "preguntas_quiz_orden_idx" ON "preguntas_quiz"("quiz_id", "orden");

-- 7. Reglas Asignacion Cursos
CREATE TABLE IF NOT EXISTS "reglas_asignacion_cursos" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "cliente_id" varchar NOT NULL REFERENCES "clientes"("id") ON DELETE CASCADE,
  "curso_id" varchar NOT NULL REFERENCES "cursos"("id") ON DELETE CASCADE,
  "nombre" varchar(200) NOT NULL,
  "descripcion" text,
  "tipo_trigger" varchar(30) NOT NULL,
  "empresa_ids" jsonb,
  "departamento_ids" jsonb,
  "puesto_ids" jsonb,
  "centro_trabajo_ids" jsonb,
  "dias_para_completar" integer,
  "es_obligatorio" boolean DEFAULT true,
  "periodo_renovacion_meses" integer,
  "activo" boolean DEFAULT true,
  "prioridad" integer DEFAULT 0,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "reglas_asignacion_cursos_cliente_idx" ON "reglas_asignacion_cursos"("cliente_id");
CREATE INDEX IF NOT EXISTS "reglas_asignacion_cursos_curso_idx" ON "reglas_asignacion_cursos"("curso_id");
CREATE INDEX IF NOT EXISTS "reglas_asignacion_cursos_activo_idx" ON "reglas_asignacion_cursos"("activo");

-- 8. Asignaciones Cursos
CREATE TABLE IF NOT EXISTS "asignaciones_cursos" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "cliente_id" varchar NOT NULL REFERENCES "clientes"("id") ON DELETE CASCADE,
  "empresa_id" varchar NOT NULL REFERENCES "empresas"("id") ON DELETE CASCADE,
  "empleado_id" varchar NOT NULL REFERENCES "employees"("id") ON DELETE CASCADE,
  "curso_id" varchar NOT NULL REFERENCES "cursos"("id") ON DELETE CASCADE,
  "regla_asignacion_id" varchar REFERENCES "reglas_asignacion_cursos"("id") ON DELETE SET NULL,
  "asignado_por" varchar,
  "tipo_asignacion" varchar(30) NOT NULL,
  "es_obligatorio" boolean DEFAULT false,
  "fecha_asignacion" timestamp NOT NULL DEFAULT now(),
  "fecha_vencimiento" date,
  "fecha_inicio" timestamp,
  "fecha_completado" timestamp,
  "estatus" varchar(20) DEFAULT 'asignado',
  "porcentaje_progreso" integer DEFAULT 0,
  "calificacion_final" integer,
  "aprobado" boolean,
  "intentos_realizados" integer DEFAULT 0,
  "certificado_generado" boolean DEFAULT false,
  "certificado_url" varchar(500),
  "fecha_certificado" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "asignaciones_cursos_cliente_idx" ON "asignaciones_cursos"("cliente_id");
CREATE INDEX IF NOT EXISTS "asignaciones_cursos_empleado_idx" ON "asignaciones_cursos"("empleado_id");
CREATE INDEX IF NOT EXISTS "asignaciones_cursos_curso_idx" ON "asignaciones_cursos"("curso_id");
CREATE INDEX IF NOT EXISTS "asignaciones_cursos_estatus_idx" ON "asignaciones_cursos"("estatus");
CREATE INDEX IF NOT EXISTS "asignaciones_cursos_vencimiento_idx" ON "asignaciones_cursos"("fecha_vencimiento");

-- 9. Progreso Lecciones
CREATE TABLE IF NOT EXISTS "progreso_lecciones" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "asignacion_id" varchar NOT NULL REFERENCES "asignaciones_cursos"("id") ON DELETE CASCADE,
  "leccion_id" varchar NOT NULL REFERENCES "lecciones_curso"("id") ON DELETE CASCADE,
  "estatus" varchar(20) DEFAULT 'pendiente',
  "porcentaje_progreso" integer DEFAULT 0,
  "fecha_inicio" timestamp,
  "fecha_completado" timestamp,
  "tiempo_invertido_segundos" integer DEFAULT 0,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "progreso_lecciones_unique" UNIQUE ("asignacion_id", "leccion_id")
);

CREATE INDEX IF NOT EXISTS "progreso_lecciones_asignacion_idx" ON "progreso_lecciones"("asignacion_id");
CREATE INDEX IF NOT EXISTS "progreso_lecciones_leccion_idx" ON "progreso_lecciones"("leccion_id");

-- 10. Intentos Quiz
CREATE TABLE IF NOT EXISTS "intentos_quiz" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "asignacion_id" varchar NOT NULL REFERENCES "asignaciones_cursos"("id") ON DELETE CASCADE,
  "quiz_id" varchar NOT NULL REFERENCES "quizzes_curso"("id") ON DELETE CASCADE,
  "empleado_id" varchar NOT NULL REFERENCES "employees"("id") ON DELETE CASCADE,
  "numero_intento" integer NOT NULL,
  "fecha_inicio" timestamp NOT NULL,
  "fecha_fin" timestamp,
  "tiempo_utilizado_segundos" integer,
  "respuestas" jsonb,
  "puntos_obtenidos" integer,
  "puntos_maximos" integer,
  "calificacion" integer,
  "aprobado" boolean,
  "estatus" varchar(20) DEFAULT 'en_progreso',
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "intentos_quiz_asignacion_idx" ON "intentos_quiz"("asignacion_id");
CREATE INDEX IF NOT EXISTS "intentos_quiz_quiz_idx" ON "intentos_quiz"("quiz_id");
CREATE INDEX IF NOT EXISTS "intentos_quiz_empleado_idx" ON "intentos_quiz"("empleado_id");

-- 11. Certificados Cursos
CREATE TABLE IF NOT EXISTS "certificados_cursos" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "cliente_id" varchar NOT NULL REFERENCES "clientes"("id") ON DELETE CASCADE,
  "asignacion_id" varchar NOT NULL REFERENCES "asignaciones_cursos"("id") ON DELETE CASCADE,
  "empleado_id" varchar NOT NULL REFERENCES "employees"("id") ON DELETE CASCADE,
  "curso_id" varchar NOT NULL REFERENCES "cursos"("id") ON DELETE CASCADE,
  "codigo_certificado" varchar(50) NOT NULL UNIQUE,
  "fecha_emision" timestamp NOT NULL DEFAULT now(),
  "fecha_vencimiento" date,
  "calificacion_obtenida" integer,
  "archivo_url" varchar(500),
  "estatus" varchar(20) DEFAULT 'activo',
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "certificados_cursos_cliente_idx" ON "certificados_cursos"("cliente_id");
CREATE INDEX IF NOT EXISTS "certificados_cursos_empleado_idx" ON "certificados_cursos"("empleado_id");
CREATE INDEX IF NOT EXISTS "certificados_cursos_curso_idx" ON "certificados_cursos"("curso_id");
CREATE UNIQUE INDEX IF NOT EXISTS "certificados_cursos_codigo_idx" ON "certificados_cursos"("codigo_certificado");
