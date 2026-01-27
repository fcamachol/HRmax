-- Migration: Add salary fields to hiring_process table for IMSS integration
-- These fields are needed to properly generate IDSE files with SDI values

ALTER TABLE hiring_process
ADD COLUMN IF NOT EXISTS salario_diario_nominal NUMERIC(12, 2),
ADD COLUMN IF NOT EXISTS salario_diario_exento NUMERIC(12, 2),
ADD COLUMN IF NOT EXISTS sdi NUMERIC(12, 2),
ADD COLUMN IF NOT EXISTS esquema_pago VARCHAR(20) DEFAULT 'tradicional',
ADD COLUMN IF NOT EXISTS periodicidad_pago VARCHAR(20) DEFAULT 'quincenal';

-- Add comments for documentation
COMMENT ON COLUMN hiring_process.salario_diario_nominal IS 'Salario diario nominal - base para cálculos fiscales e IMSS';
COMMENT ON COLUMN hiring_process.salario_diario_exento IS 'Salario diario exento - porción no gravable (para esquema mixto)';
COMMENT ON COLUMN hiring_process.sdi IS 'Salario Diario Integrado - calculado automáticamente (nominal × factor integración)';
COMMENT ON COLUMN hiring_process.esquema_pago IS 'Esquema de pago: tradicional (100% nominal) o mixto (nominal + exento)';
COMMENT ON COLUMN hiring_process.periodicidad_pago IS 'Periodicidad de pago: semanal, catorcenal, quincenal, mensual';
