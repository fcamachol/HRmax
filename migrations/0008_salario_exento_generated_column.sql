-- Migration: Convert salario_diario_exento to a generated column
-- This ensures the value is always computed as: Real - Nominal
-- Automatically backfills existing records with the correct value

-- Drop the existing column
ALTER TABLE employees DROP COLUMN IF EXISTS salario_diario_exento;

-- Add as generated column (always computed from real - nominal)
ALTER TABLE employees
ADD COLUMN salario_diario_exento numeric
GENERATED ALWAYS AS (
  GREATEST(0, COALESCE(salario_diario_real, 0) - COALESCE(salario_diario_nominal, 0))
) STORED;
