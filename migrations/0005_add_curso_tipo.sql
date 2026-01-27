-- Add tipo field to cursos table to distinguish between courses and evaluations
ALTER TABLE cursos ADD COLUMN IF NOT EXISTS tipo varchar(20) DEFAULT 'curso';
