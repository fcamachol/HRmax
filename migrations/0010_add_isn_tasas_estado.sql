-- Migration: Add ISN (Impuesto Sobre Nomina) configuration
-- ISN is a state payroll tax paid where the employee WORKS (centro de trabajo)
-- The empresa.estado_default provides the default state, overridden by centro_trabajo.estado

-- Part A: Add default estado to empresas table
ALTER TABLE empresas
ADD COLUMN estado_default VARCHAR(50);

-- Part B: Create ISN rates configuration table
CREATE TABLE isn_tasas_estado (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  estado VARCHAR(50) NOT NULL,
  tasa_bp INTEGER NOT NULL,
  vigencia_inicio DATE NOT NULL,
  vigencia_fin DATE,
  notas TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(estado, vigencia_inicio)
);

-- Seed with 2025 rates (all Mexican states)
INSERT INTO isn_tasas_estado (estado, tasa_bp, vigencia_inicio, notas) VALUES
('AGUASCALIENTES', 250, '2025-01-01', '2.5%'),
('BAJA_CALIFORNIA', 175, '2025-01-01', '1.75%'),
('BAJA_CALIFORNIA_SUR', 250, '2025-01-01', '2.5%'),
('CAMPECHE', 200, '2025-01-01', '2%'),
('CHIAPAS', 200, '2025-01-01', '2%'),
('CHIHUAHUA', 300, '2025-01-01', '3%'),
('CIUDAD_DE_MEXICO', 400, '2025-01-01', '4% - Updated Dec 2024'),
('COAHUILA', 200, '2025-01-01', '2%'),
('COLIMA', 200, '2025-01-01', '2%'),
('DURANGO', 200, '2025-01-01', '2%'),
('GUANAJUATO', 289, '2025-01-01', '2.89%'),
('GUERRERO', 200, '2025-01-01', '2%'),
('HIDALGO', 250, '2025-01-01', '2.5%'),
('JALISCO', 200, '2025-01-01', '2%'),
('ESTADO_DE_MEXICO', 300, '2025-01-01', '3%'),
('MICHOACAN', 200, '2025-01-01', '2%'),
('MORELOS', 200, '2025-01-01', '2%'),
('NAYARIT', 200, '2025-01-01', '2%'),
('NUEVO_LEON', 300, '2025-01-01', '3%'),
('OAXACA', 300, '2025-01-01', '3%'),
('PUEBLA', 300, '2025-01-01', '3%'),
('QUERETARO', 200, '2025-01-01', '2%'),
('QUINTANA_ROO', 300, '2025-01-01', '3%'),
('SAN_LUIS_POTOSI', 250, '2025-01-01', '2.5%'),
('SINALOA', 265, '2025-01-01', '2.65%'),
('SONORA', 170, '2025-01-01', '1.7%'),
('TABASCO', 250, '2025-01-01', '2.5%'),
('TAMAULIPAS', 300, '2025-01-01', '3%'),
('TLAXCALA', 300, '2025-01-01', '3%'),
('VERACRUZ', 300, '2025-01-01', '3%'),
('YUCATAN', 250, '2025-01-01', '2.5%'),
('ZACATECAS', 250, '2025-01-01', '2.5%');
