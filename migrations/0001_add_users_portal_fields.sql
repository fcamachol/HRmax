ALTER TABLE users
  ADD COLUMN IF NOT EXISTS empleado_id varchar REFERENCES employees(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS role varchar NOT NULL DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS portal_activo boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ultimo_acceso_portal timestamp,
  ADD COLUMN IF NOT EXISTS requiere_cambio_password boolean NOT NULL DEFAULT false;
