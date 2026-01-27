-- Migration: Add verification fields to incapacidades table
-- These fields support the portal workflow where employees can submit incapacidades
-- and HR can verify or reject them

-- Add verification columns
ALTER TABLE incapacidades ADD COLUMN IF NOT EXISTS verificado BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE incapacidades ADD COLUMN IF NOT EXISTS verificado_por VARCHAR;
ALTER TABLE incapacidades ADD COLUMN IF NOT EXISTS fecha_verificacion TIMESTAMP;
ALTER TABLE incapacidades ADD COLUMN IF NOT EXISTS motivo_rechazo TEXT;
ALTER TABLE incapacidades ADD COLUMN IF NOT EXISTS origen_registro VARCHAR NOT NULL DEFAULT 'admin';

-- Index for faster lookups of pending verifications
CREATE INDEX IF NOT EXISTS incapacidades_verificado_idx ON incapacidades(verificado, origen_registro);

-- Add new status value to existing records constraint (if any)
-- Note: The estatus column now accepts: activa, cerrada, rechazada_imss, rechazada_documentos
