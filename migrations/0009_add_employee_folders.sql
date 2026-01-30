-- Migration: Add Employee Folders (carpetas_empleado) table
-- This enables a Google Drive-like document management system for HR

-- Create carpetas_empleado table
CREATE TABLE IF NOT EXISTS "carpetas_empleado" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "cliente_id" varchar NOT NULL REFERENCES "clientes"("id") ON DELETE CASCADE,
  "empleado_id" varchar NOT NULL REFERENCES "employees"("id") ON DELETE CASCADE,
  "nombre" varchar(200) NOT NULL,
  "parent_id" varchar REFERENCES "carpetas_empleado"("id") ON DELETE CASCADE,
  "tipo" varchar DEFAULT 'custom' NOT NULL,  -- 'system' | 'custom'
  "icono" varchar(50),
  "color" varchar(20),
  "visible_para_empleado" boolean DEFAULT false NOT NULL,
  "orden" integer DEFAULT 0,
  "created_by" varchar REFERENCES "users"("id") ON DELETE SET NULL,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

-- Add indexes for carpetas_empleado
CREATE INDEX IF NOT EXISTS "carpetas_empleado_empleado_idx" ON "carpetas_empleado"("empleado_id");
CREATE INDEX IF NOT EXISTS "carpetas_empleado_parent_idx" ON "carpetas_empleado"("parent_id");
CREATE INDEX IF NOT EXISTS "carpetas_empleado_cliente_idx" ON "carpetas_empleado"("cliente_id");

-- Add carpeta_id column to documentos_empleado
ALTER TABLE "documentos_empleado"
ADD COLUMN IF NOT EXISTS "carpeta_id" varchar REFERENCES "carpetas_empleado"("id") ON DELETE SET NULL;

-- Add index for carpeta_id
CREATE INDEX IF NOT EXISTS "documentos_empleado_carpeta_idx" ON "documentos_empleado"("carpeta_id");
