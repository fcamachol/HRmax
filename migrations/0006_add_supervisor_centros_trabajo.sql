-- Migration: Add supervisor_centros_trabajo table
-- This table links supervisor users to the centros de trabajo they manage

CREATE TABLE IF NOT EXISTS supervisor_centros_trabajo (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  centro_trabajo_id VARCHAR NOT NULL REFERENCES centros_trabajo(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(usuario_id, centro_trabajo_id)
);

-- Index for faster lookups by user
CREATE INDEX IF NOT EXISTS idx_supervisor_centros_usuario ON supervisor_centros_trabajo(usuario_id);

-- Index for faster lookups by centro
CREATE INDEX IF NOT EXISTS idx_supervisor_centros_centro ON supervisor_centros_trabajo(centro_trabajo_id);
