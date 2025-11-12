-- =====================================================
-- TABLAS ISR Y SUBSIDIO AL EMPLEO 2025 - COMPLETAS
-- Todos los períodos: Diario, Semanal, Decenal, Quincenal, Mensual
-- =====================================================

-- =====================================================
-- 1. ISR DIARIO 2025
-- =====================================================

-- Tabla ISR DIARIO (Artículo 96 LISR - Tabla Diaria)
INSERT INTO cat_isr_tarifas (anio, periodo, limite_inferior_bp, limite_superior_bp, cuota_fija_bp, tasa_excedente_bp, orden) VALUES
(2025, 'diario', 0, 2149600, 0, 192, 1),          -- $0.01 - $214.96, Cuota: $0.00, Tasa: 1.92%
(2025, 'diario', 2150000, 1822913300, 41300, 640, 2),     -- $215.00 - $1,822.91
(2025, 'diario', 1822913400, 3205259900, 1106100, 1088, 3),   -- $1,822.91 - $3,205.26
(2025, 'diario', 3205260000, 3734007600, 2609700, 1600, 4),   -- $3,205.26 - $3,734.01
(2025, 'diario', 3734007700, 4451213200, 3455800, 1792, 5),   -- $3,734.01 - $4,451.21
(2025, 'diario', 4451213300, 8357839900, 4739200, 2136, 6),   -- $4,451.21 - $8,357.84
(2025, 'diario', 8357840000, 12503679900, 13086300, 2352, 7),  -- $8,357.84 - $12,503.68
(2025, 'diario', 12503680000, 16671583200, 22839400, 3000, 8), -- $12,503.68 - $16,671.58
(2025, 'diario', 16671583300, 25000710900, 35333200, 3200, 9), -- $16,671.58 - $25,000.71
(2025, 'diario', 25000711000, 100000000000, 62007700, 3400, 10); -- $25,000.71 - En adelante

-- =====================================================
-- 2. ISR SEMANAL 2025
-- =====================================================

-- Tabla ISR SEMANAL
INSERT INTO cat_isr_tarifas (anio, periodo, limite_inferior_bp, limite_superior_bp, cuota_fija_bp, tasa_excedente_bp, orden) VALUES
(2025, 'semanal', 0, 15047200, 0, 192, 1),          -- $0.01 - $1,504.72, Cuota: $0.00, Tasa: 1.92%
(2025, 'semanal', 15047300, 127603930000, 288900, 640, 2),     -- $1,504.73 - $12,760.39
(2025, 'semanal', 127603940000, 224368190000, 7742700, 1088, 3),   -- $12,760.39 - $22,436.82
(2025, 'semanal', 224368200000, 261380530000, 18267900, 1600, 4),  -- $22,436.82 - $26,138.05
(2025, 'semanal', 261380540000, 311549210000, 24190600, 1792, 5),  -- $26,138.05 - $31,154.92
(2025, 'semanal', 311549220000, 585048790000, 33174400, 2136, 6),  -- $31,154.92 - $58,504.88
(2025, 'semanal', 585048800000, 875258790000, 91604100, 2352, 7),  -- $58,504.88 - $87,525.88
(2025, 'semanal', 875258800000, 1167010820000, 159875800, 3000, 8), -- $87,525.88 - $116,701.08
(2025, 'semanal', 1167010830000, 1750049760000, 247332600, 3200, 9), -- $116,701.08 - $175,004.98
(2025, 'semanal', 1750049770000, 100000000000000, 434053900, 3400, 10); -- $175,004.98 - En adelante

-- =====================================================
-- 3. ISR DECENAL (10 DÍAS) 2025
-- =====================================================

-- Tabla ISR DECENAL
INSERT INTO cat_isr_tarifas (anio, periodo, limite_inferior_bp, limite_superior_bp, cuota_fija_bp, tasa_excedente_bp, orden) VALUES
(2025, 'decenal', 0, 21496300, 0, 192, 1),          -- $0.01 - $2,149.63, Cuota: $0.00, Tasa: 1.92%
(2025, 'decenal', 21496400, 182291330000, 412700, 640, 2),     -- $2,149.63 - $18,229.13
(2025, 'decenal', 182291340000, 320525990000, 11060900, 1088, 3),   -- $18,229.13 - $32,052.60
(2025, 'decenal', 320526000000, 373400760000, 26096900, 1600, 4),   -- $32,052.60 - $37,340.08
(2025, 'decenal', 373400770000, 445121320000, 34558200, 1792, 5),   -- $37,340.08 - $44,512.13
(2025, 'decenal', 445121330000, 835783990000, 47392000, 2136, 6),   -- $44,512.13 - $83,578.40
(2025, 'decenal', 835784000000, 1250367990000, 130862900, 2352, 7),  -- $83,578.40 - $125,036.80
(2025, 'decenal', 1250368000000, 1667158320000, 228394300, 3000, 8), -- $125,036.80 - $166,715.83
(2025, 'decenal', 1667158330000, 2500071090000, 353332300, 3200, 9), -- $166,715.83 - $250,007.11
(2025, 'decenal', 2500071100000, 100000000000000, 620077000, 3400, 10); -- $250,007.11 - En adelante

-- =====================================================
-- 4. ISR QUINCENAL 2025
-- =====================================================

-- Tabla ISR QUINCENAL (ya incluida pero la repito para completitud)
INSERT INTO cat_isr_tarifas (anio, periodo, limite_inferior_bp, limite_superior_bp, cuota_fija_bp, tasa_excedente_bp, orden) VALUES
(2025, 'quincenal', 0, 32244900, 0, 192, 1),          -- $0.01 - $3,224.49, Cuota: $0.00, Tasa: 1.92%
(2025, 'quincenal', 32245000, 273437000000, 619000, 640, 2),     -- $3,224.49 - $27,343.70
(2025, 'quincenal', 273437010000, 480788990000, 16591400, 1088, 3),   -- $27,343.70 - $48,078.90
(2025, 'quincenal', 480789000000, 560101140000, 39145400, 1600, 4),   -- $48,078.90 - $56,010.11
(2025, 'quincenal', 560101150000, 667681980000, 51837300, 1792, 5),   -- $56,010.11 - $66,768.20
(2025, 'quincenal', 667682000000, 1253675980000, 71088000, 2136, 6),  -- $66,768.20 - $125,367.60
(2025, 'quincenal', 1253676000000, 1875551980000, 196294400, 2352, 7), -- $125,367.60 - $187,555.20
(2025, 'quincenal', 1875552000000, 2500737490000, 342591400, 3000, 8), -- $187,555.20 - $250,073.75
(2025, 'quincenal', 2500737500000, 3750106630000, 529998600, 3200, 9), -- $250,073.75 - $375,010.66
(2025, 'quincenal', 3750106640000, 100000000000000, 930115500, 3400, 10); -- $375,010.66 - En adelante

-- =====================================================
-- 5. ISR CATORCENA (14 DÍAS) 2025
-- =====================================================

-- Tabla ISR CATORCENA (14 días)
INSERT INTO cat_isr_tarifas (anio, periodo, limite_inferior_bp, limite_superior_bp, cuota_fija_bp, tasa_excedente_bp, orden) VALUES
(2025, 'catorcena', 0, 30094840, 0, 192, 1),          -- $0.01 - $3,009.48, Cuota: $0.00, Tasa: 1.92%
(2025, 'catorcena', 30094850, 255207860000, 577800, 640, 2),     -- $3,009.48 - $25,520.79
(2025, 'catorcena', 255207870000, 448736380000, 15485300, 1088, 3),   -- $25,520.79 - $44,873.64
(2025, 'catorcena', 448736390000, 522761060000, 36535800, 1600, 4),   -- $44,873.64 - $52,276.11
(2025, 'catorcena', 522761070000, 623169840000, 48381400, 1792, 5),   -- $52,276.11 - $62,316.98
(2025, 'catorcena', 623169850000, 1170096380000, 66344300, 2136, 6),  -- $62,316.98 - $117,009.64
(2025, 'catorcena', 1170096390000, 1750515170000, 183208500, 2352, 7), -- $117,009.64 - $175,051.52
(2025, 'catorcena', 1750515180000, 2333630490000, 319751600, 3000, 8), -- $175,051.52 - $233,363.05
(2025, 'catorcena', 2333630500000, 3500099280000, 494465500, 3200, 9), -- $233,363.05 - $350,009.93
(2025, 'catorcena', 3500099290000, 100000000000000, 868107600, 3400, 10); -- $350,009.93 - En adelante

-- =====================================================
-- SUBSIDIO AL EMPLEO - TODOS LOS PERÍODOS 2025
-- =====================================================

-- =====================================================
-- 1. SUBSIDIO AL EMPLEO DIARIO 2025
-- =====================================================

INSERT INTO cat_subsidio_empleo (anio, periodo, limite_inferior_bp, limite_superior_bp, subsidio_bp, orden) VALUES
-- Tabla diaria
(2025, 'diario', 10, 600000, 135960, 1),              -- $0.01 - $60.00, Subsidio: $13.596
(2025, 'diario', 600100, 650000, 135940, 2),          -- $60.01 - $65.00
(2025, 'diario', 650100, 1150000, 129920, 3),         -- $65.01 - $115.00
(2025, 'diario', 1150100, 1316600, 129340, 4),        -- $115.01 - $131.66
(2025, 'diario', 1316700, 1633300, 116120, 5),        -- $131.67 - $163.33
(2025, 'diario', 1633400, 1966600, 106820, 6),        -- $163.34 - $196.66
(2025, 'diario', 1966700, 2566600, 97540, 7),         -- $196.67 - $256.66
(2025, 'diario', 2566700, 100000000, 0, 8);           -- $256.67 - En adelante

-- =====================================================
-- 2. SUBSIDIO AL EMPLEO SEMANAL 2025
-- =====================================================

INSERT INTO cat_subsidio_empleo (anio, periodo, limite_inferior_bp, limite_superior_bp, subsidio_bp, orden) VALUES
-- Tabla semanal
(2025, 'semanal', 10, 4200000, 951720, 1),            -- $0.01 - $420.00, Subsidio: $95.172
(2025, 'semanal', 4200100, 4550000, 951580, 2),       -- $420.01 - $455.00
(2025, 'semanal', 4550100, 8050000, 909440, 3),       -- $455.01 - $805.00
(2025, 'semanal', 8050100, 9216200, 905380, 4),       -- $805.01 - $921.62
(2025, 'semanal', 9216300, 11433100, 812840, 5),      -- $921.63 - $1,143.31
(2025, 'semanal', 11433200, 13766200, 747740, 6),     -- $1,143.32 - $1,376.62
(2025, 'semanal', 13766300, 17966200, 682780, 7),     -- $1,376.63 - $1,796.62
(2025, 'semanal', 17966300, 100000000, 0, 8);         -- $1,796.63 - En adelante

-- =====================================================
-- 3. SUBSIDIO AL EMPLEO DECENAL 2025
-- =====================================================

INSERT INTO cat_subsidio_empleo (anio, periodo, limite_inferior_bp, limite_superior_bp, subsidio_bp, orden) VALUES
-- Tabla decenal (10 días)
(2025, 'decenal', 10, 6000000, 1359600, 1),           -- $0.01 - $600.00, Subsidio: $135.96
(2025, 'decenal', 6000100, 6500000, 1359400, 2),      -- $600.01 - $650.00
(2025, 'decenal', 6500100, 11500000, 1299200, 3),     -- $650.01 - $1,150.00
(2025, 'decenal', 11500100, 13166000, 1293400, 4),    -- $1,150.01 - $1,316.60
(2025, 'decenal', 13166100, 16333000, 1161200, 5),    -- $1,316.61 - $1,633.30
(2025, 'decenal', 16333100, 19666000, 1068200, 6),    -- $1,633.31 - $1,966.60
(2025, 'decenal', 19666100, 25666000, 975400, 7),     -- $1,966.61 - $2,566.60
(2025, 'decenal', 25666100, 100000000, 0, 8);         -- $2,566.61 - En adelante

-- =====================================================
-- 4. SUBSIDIO AL EMPLEO QUINCENAL 2025
-- =====================================================

INSERT INTO cat_subsidio_empleo (anio, periodo, limite_inferior_bp, limite_superior_bp, subsidio_bp, orden) VALUES
-- Tabla quincenal (ya incluida pero la repito)
(2025, 'quincenal', 10, 9000000, 2039400, 1),         -- $0.01 - $900.00, Subsidio: $203.94
(2025, 'quincenal', 9000100, 9750000, 2039100, 2),    -- $900.01 - $975.00
(2025, 'quincenal', 9750100, 17250000, 1948800, 3),   -- $975.01 - $1,725.00
(2025, 'quincenal', 17250100, 19749000, 1940100, 4),  -- $1,725.01 - $1,974.90
(2025, 'quincenal', 19749100, 24499500, 1741800, 5),  -- $1,974.91 - $2,449.95
(2025, 'quincenal', 24499600, 29499000, 1602300, 6),  -- $2,449.96 - $2,949.90
(2025, 'quincenal', 29499100, 38499000, 1463100, 7),  -- $2,949.91 - $3,849.90
(2025, 'quincenal', 38499100, 100000000, 0, 8);       -- $3,849.91 - En adelante

-- =====================================================
-- 5. SUBSIDIO AL EMPLEO CATORCENA 2025
-- =====================================================

INSERT INTO cat_subsidio_empleo (anio, periodo, limite_inferior_bp, limite_superior_bp, subsidio_bp, orden) VALUES
-- Tabla catorcena (14 días)
(2025, 'catorcena', 10, 8400000, 1903440, 1),         -- $0.01 - $840.00, Subsidio: $190.344
(2025, 'catorcena', 8400100, 9100000, 1903160, 2),    -- $840.01 - $910.00
(2025, 'catorcena', 9100100, 16100000, 1819216, 3),   -- $910.01 - $1,610.00
(2025, 'catorcena', 16100100, 18432800, 1810760, 4),  -- $1,610.01 - $1,843.28
(2025, 'catorcena', 18432900, 22866200, 1625960, 5),  -- $1,843.29 - $2,286.62
(2025, 'catorcena', 22866300, 27532400, 1495480, 6),  -- $2,286.63 - $2,753.24
(2025, 'catorcena', 27532500, 35732400, 1365892, 7),  -- $2,753.25 - $3,573.24
(2025, 'catorcena', 35732500, 100000000, 0, 8);       -- $3,573.25 - En adelante

-- =====================================================
-- COMENTARIOS Y NOTAS
-- =====================================================

COMMENT ON TABLE cat_isr_tarifas IS 'Tabla de ISR 2025 para todos los períodos de pago: diario, semanal, decenal, quincenal, catorcena y mensual. Usa basis points para precisión de 4 decimales.';

COMMENT ON TABLE cat_subsidio_empleo IS 'Tabla de Subsidio al Empleo 2025 para todos los períodos de pago. Usa basis points para precisión de 4 decimales.';

-- =====================================================
-- FUNCIONES AUXILIARES ACTUALIZADAS
-- =====================================================

-- Actualizar la función calcular_isr para validar períodos
CREATE OR REPLACE FUNCTION calcular_isr(
    p_percepciones_gravadas_bp BIGINT,
    p_periodo VARCHAR(20),
    p_anio INTEGER
) RETURNS BIGINT AS $$
DECLARE
    v_limite_inferior_bp BIGINT;
    v_cuota_fija_bp BIGINT;
    v_excedente_bp BIGINT;
    v_tasa_excedente_bp INTEGER;
    v_impuesto_excedente_bp BIGINT;
    v_isr_causado_bp BIGINT;
BEGIN
    -- Validar que el período sea válido
    IF p_periodo NOT IN ('diario', 'semanal', 'decenal', 'quincenal', 'catorcena', 'mensual') THEN
        RAISE EXCEPTION 'Período inválido: %. Debe ser: diario, semanal, decenal, quincenal, catorcena o mensual', p_periodo;
    END IF;
    
    -- Buscar el rango aplicable en la tabla ISR
    SELECT 
        limite_inferior_bp,
        cuota_fija_bp,
        tasa_excedente_bp
    INTO 
        v_limite_inferior_bp,
        v_cuota_fija_bp,
        v_tasa_excedente_bp
    FROM cat_isr_tarifas
    WHERE anio = p_anio
        AND periodo = p_periodo
        AND p_percepciones_gravadas_bp >= limite_inferior_bp
        AND (limite_superior_bp IS NULL OR p_percepciones_gravadas_bp <= limite_superior_bp)
    LIMIT 1;
    
    -- Si no se encuentra tarifa, retornar 0
    IF NOT FOUND THEN
        RAISE WARNING 'No se encontró tarifa ISR para el período % año % con ingreso %', p_periodo, p_anio, p_percepciones_gravadas_bp;
        RETURN 0;
    END IF;
    
    -- Calcular excedente del límite inferior
    v_excedente_bp := p_percepciones_gravadas_bp - v_limite_inferior_bp;
    
    -- Calcular impuesto sobre el excedente
    v_impuesto_excedente_bp := (v_excedente_bp * v_tasa_excedente_bp) / 10000;
    
    -- ISR = Cuota fija + Impuesto sobre excedente
    v_isr_causado_bp := v_cuota_fija_bp + v_impuesto_excedente_bp;
    
    RETURN v_isr_causado_bp;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Actualizar la función calcular_subsidio_empleo para validar períodos
CREATE OR REPLACE FUNCTION calcular_subsidio_empleo(
    p_sueldo_gravado_bp BIGINT,
    p_isr_causado_bp BIGINT,
    p_periodo VARCHAR(20),
    p_anio INTEGER
) RETURNS TABLE(
    subsidio_entregable_bp BIGINT,
    subsidio_aplicado_credito_bp BIGINT,
    isr_a_retener_bp BIGINT
) AS $$
DECLARE
    v_subsidio_tabla_bp BIGINT;
BEGIN
    -- Validar que el período sea válido
    IF p_periodo NOT IN ('diario', 'semanal', 'decenal', 'quincenal', 'catorcena', 'mensual') THEN
        RAISE EXCEPTION 'Período inválido: %. Debe ser: diario, semanal, decenal, quincenal, catorcena o mensual', p_periodo;
    END IF;
    
    -- Buscar subsidio en tabla según salario
    SELECT subsidio_bp
    INTO v_subsidio_tabla_bp
    FROM cat_subsidio_empleo
    WHERE anio = p_anio
        AND periodo = p_periodo
        AND p_sueldo_gravado_bp >= limite_inferior_bp
        AND (limite_superior_bp IS NULL OR p_sueldo_gravado_bp <= limite_superior_bp)
    LIMIT 1;
    
    -- Si no se encuentra, subsidio = 0
    IF v_subsidio_tabla_bp IS NULL THEN
        v_subsidio_tabla_bp := 0;
    END IF;
    
    -- Determinar subsidio entregable vs aplicado a crédito
    IF p_isr_causado_bp = 0 THEN
        -- Todo el subsidio se entrega al trabajador
        subsidio_entregable_bp := v_subsidio_tabla_bp;
        subsidio_aplicado_credito_bp := 0;
        isr_a_retener_bp := 0;
    ELSIF p_isr_causado_bp < v_subsidio_tabla_bp THEN
        -- Subsidio mayor que ISR: diferencia se entrega
        subsidio_aplicado_credito_bp := p_isr_causado_bp;
        subsidio_entregable_bp := v_subsidio_tabla_bp - p_isr_causado_bp;
        isr_a_retener_bp := 0;
    ELSE
        -- ISR mayor que subsidio: todo se aplica a crédito
        subsidio_aplicado_credito_bp := v_subsidio_tabla_bp;
        subsidio_entregable_bp := 0;
        isr_a_retener_bp := p_isr_causado_bp - v_subsidio_tabla_bp;
    END IF;
    
    RETURN QUERY SELECT 
        subsidio_entregable_bp,
        subsidio_aplicado_credito_bp,
        isr_a_retener_bp;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- EJEMPLOS DE USO CON TODOS LOS PERÍODOS
-- =====================================================

/*
-- ISR DIARIO
SELECT bp_to_pesos(calcular_isr(pesos_to_bp(500), 'diario', 2025)) as isr_diario;

-- ISR SEMANAL
SELECT bp_to_pesos(calcular_isr(pesos_to_bp(3500), 'semanal', 2025)) as isr_semanal;

-- ISR DECENAL
SELECT bp_to_pesos(calcular_isr(pesos_to_bp(5000), 'decenal', 2025)) as isr_decenal;

-- ISR QUINCENAL
SELECT bp_to_pesos(calcular_isr(pesos_to_bp(7500), 'quincenal', 2025)) as isr_quincenal;

-- ISR CATORCENA
SELECT bp_to_pesos(calcular_isr(pesos_to_bp(7000), 'catorcena', 2025)) as isr_catorcena;

-- ISR MENSUAL
SELECT bp_to_pesos(calcular_isr(pesos_to_bp(15000), 'mensual', 2025)) as isr_mensual;

-- COMPARATIVA DE PERÍODOS PARA EL MISMO SUELDO MENSUAL ($15,000)
SELECT 
    'Diario' as periodo,
    500.00 as sueldo,
    bp_to_pesos(calcular_isr(pesos_to_bp(500), 'diario', 2025)) as isr,
    bp_to_pesos(calcular_isr(pesos_to_bp(500), 'diario', 2025)) * 30 as isr_mensual_equiv
UNION ALL
SELECT 
    'Semanal',
    3571.43,
    bp_to_pesos(calcular_isr(pesos_to_bp(3571.43), 'semanal', 2025)),
    bp_to_pesos(calcular_isr(pesos_to_bp(3571.43), 'semanal', 2025)) * 4.2
UNION ALL
SELECT 
    'Decenal',
    5000.00,
    bp_to_pesos(calcular_isr(pesos_to_bp(5000), 'decenal', 2025)),
    bp_to_pesos(calcular_isr(pesos_to_bp(5000), 'decenal', 2025)) * 3
UNION ALL
SELECT 
    'Quincenal',
    7500.00,
    bp_to_pesos(calcular_isr(pesos_to_bp(7500), 'quincenal', 2025)),
    bp_to_pesos(calcular_isr(pesos_to_bp(7500), 'quincenal', 2025)) * 2
UNION ALL
SELECT 
    'Catorcena',
    7000.00,
    bp_to_pesos(calcular_isr(pesos_to_bp(7000), 'catorcena', 2025)),
    bp_to_pesos(calcular_isr(pesos_to_bp(7000), 'catorcena', 2025)) * 2.14
UNION ALL
SELECT 
    'Mensual',
    15000.00,
    bp_to_pesos(calcular_isr(pesos_to_bp(15000), 'mensual', 2025)),
    bp_to_pesos(calcular_isr(pesos_to_bp(15000), 'mensual', 2025));
*/

-- =====================================================
-- VERIFICACIÓN DE INSTALACIÓN
-- =====================================================

-- Verificar que todas las tablas ISR estén completas
SELECT 
    periodo,
    COUNT(*) as num_rangos,
    MIN(bp_to_pesos(limite_inferior_bp)) as minimo,
    MAX(bp_to_pesos(COALESCE(limite_superior_bp, 100000000))) as maximo
FROM cat_isr_tarifas
WHERE anio = 2025
GROUP BY periodo
ORDER BY 
    CASE periodo 
        WHEN 'diario' THEN 1
        WHEN 'semanal' THEN 2
        WHEN 'decenal' THEN 3
        WHEN 'catorcena' THEN 4
        WHEN 'quincenal' THEN 5
        WHEN 'mensual' THEN 6
    END;

-- Verificar que todas las tablas de subsidio estén completas
SELECT 
    periodo,
    COUNT(*) as num_rangos,
    MIN(bp_to_pesos(limite_inferior_bp)) as minimo,
    MAX(bp_to_pesos(COALESCE(limite_superior_bp, 100000000))) as maximo,
    MAX(bp_to_pesos(subsidio_bp)) as subsidio_maximo
FROM cat_subsidio_empleo
WHERE anio = 2025
GROUP BY periodo
ORDER BY 
    CASE periodo 
        WHEN 'diario' THEN 1
        WHEN 'semanal' THEN 2
        WHEN 'decenal' THEN 3
        WHEN 'catorcena' THEN 4
        WHEN 'quincenal' THEN 5
        WHEN 'mensual' THEN 6
    END;

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================
