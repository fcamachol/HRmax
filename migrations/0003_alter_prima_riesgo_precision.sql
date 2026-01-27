-- Increase prima_riesgo precision from decimal(5,4) to decimal(7,5) to allow 5 decimal places
-- This allows values like 1.51952 instead of being limited to 1.5195
ALTER TABLE registros_patronales
ALTER COLUMN prima_riesgo TYPE decimal(7,5);
