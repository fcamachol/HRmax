-- =====================================================
-- TABLAS ISR Y SUBSIDIO 2025 - TODOS LOS PERÍODOS
-- Diario, Semanal, Decenal, Catorcenal, Quincenal, Mensual
-- Artículo 96 LISR y Decreto Subsidio al Empleo
-- =====================================================

-- =====================================================
-- 1. TABLA ISR 2025 - DIARIO
-- =====================================================

INSERT INTO cat_isr_tarifas (anio, periodo, limite_inferior_bp, limite_superior_bp, cuota_fija_bp, tasa_excedente_bp, orden) VALUES
(2025, 'diario', 0, 214999, 0, 192, 1),              -- $0.01 - $21.49, Cuota: $0.00, Tasa: 1.92%
(2025, 'diario', 215000, 1822910, 4130, 640, 2),     -- $21.50 - $182.29
(2025, 'diario', 1822920, 3205259, 110610, 1088, 3), -- $182.30 - $320.52
(2025, 'diario', 3205260, 3734009, 260970, 1600, 4), -- $320.53 - $373.40
(2025, 'diario', 3734010, 4451213, 345580, 1792, 5), -- $373.41 - $445.12
(2025, 'diario', 4451214, 8357839, 473920, 2136, 6), -- $445.13 - $835.78
(2025, 'diario', 8357840, 12503679, 1308630, 2352, 7), -- $835.79 - $1,250.36
(2025, 'diario', 12503680, 16671583, 2283950, 3000, 8), -- $1,250.37 - $1,667.15
(2025, 'diario', 16671584, 25000710, 3533320, 3200, 9), -- $1,667.16 - $2,500.07
(2025, 'diario', 25000711, 10000000000, 6200770, 3400, 10); -- $2,500.08 - En adelante

-- =====================================================
-- 2. TABLA ISR 2025 - SEMANAL
-- =====================================================

INSERT INTO cat_isr_tarifas (anio, periodo, limite_inferior_bp, limite_superior_bp, cuota_fija_bp, tasa_excedente_bp, orden) VALUES
(2025, 'semanal', 0, 1504990, 0, 192, 1),              -- $0.01 - $150.49
(2025, 'semanal', 1505000, 12760370, 28900, 640, 2),   -- $150.50 - $1,276.03
(2025, 'semanal', 12760380, 22436813, 774270, 1088, 3), -- $1,276.04 - $2,243.68
(2025, 'semanal', 22436814, 26138063, 1826790, 1600, 4), -- $2,243.69 - $2,613.80
(2025, 'semanal', 26138064, 31158491, 2419060, 1792, 5), -- $2,613.81 - $3,115.84
(2025, 'semanal', 31158492, 58504873, 3317440, 2136, 6), -- $3,115.85 - $5,850.48
(2025, 'semanal', 58504874, 87525753, 9160410, 2352, 7), -- $5,850.49 - $8,752.57
(2025, 'semanal', 87525754, 116700881, 15987650, 3000, 8), -- $8,752.58 - $11,670.08
(2025, 'semanal', 116700882, 175004970, 24733240, 3200, 9), -- $11,670.09 - $17,500.49
(2025, 'semanal', 175004971, 10000000000, 43405390, 3400, 10); -- $17,500.50 - En adelante

-- =====================================================
-- 3. TABLA ISR 2025 - DECENAL (10 días)
-- =====================================================

INSERT INTO cat_isr_tarifas (anio, periodo, limite_inferior_bp, limite_superior_bp, cuota_fija_bp, tasa_excedente_bp, orden) VALUES
(2025, 'decenal', 0, 2149980, 0, 192, 1),              -- $0.01 - $214.99
(2025, 'decenal', 2150000, 18229100, 41300, 640, 2),   -- $215.00 - $1,822.91
(2025, 'decenal', 18229110, 32052590, 1106100, 1088, 3), -- $1,822.92 - $3,205.25
(2025, 'decenal', 32052600, 37340090, 2609700, 1600, 4), -- $3,205.26 - $3,734.00
(2025, 'decenal', 37340100, 44512130, 3455800, 1792, 5), -- $3,734.01 - $4,451.21
(2025, 'decenal', 44512140, 83578390, 4739200, 2136, 6), -- $4,451.22 - $8,357.83
(2025, 'decenal', 83578400, 125036790, 13086300, 2352, 7), -- $8,357.84 - $12,503.67
(2025, 'decenal', 125036800, 166715830, 22839500, 3000, 8), -- $12,503.68 - $16,671.58
(2025, 'decenal', 166715840, 250007100, 35333200, 3200, 9), -- $16,671.59 - $25,000.70
(2025, 'decenal', 250007110, 10000000000, 62007700, 3400, 10); -- $25,000.71 - En adelante

-- =====================================================
-- 4. TABLA ISR 2025 - CATORCENAL (14 días)
-- =====================================================

INSERT INTO cat_isr_tarifas (anio, periodo, limite_inferior_bp, limite_superior_bp, cuota_fija_bp, tasa_excedente_bp, orden) VALUES
(2025, 'catorcenal', 0, 3009970, 0, 192, 1),              -- $0.01 - $300.99
(2025, 'catorcenal', 3010000, 25520740, 57820, 640, 2),   -- $301.00 - $2,552.07
(2025, 'catorcenal', 25520750, 44873626, 1548540, 1088, 3), -- $2,552.08 - $4,487.36
(2025, 'catorcenal', 44873627, 52276126, 3653580, 1600, 4), -- $4,487.37 - $5,227.61
(2025, 'catorcenal', 52276127, 62316982, 4838120, 1792, 5), -- $5,227.62 - $6,231.69
(2025, 'catorcenal', 62316983, 117009746, 6634880, 2136, 6), -- $6,231.70 - $11,700.97
(2025, 'catorcenal', 117009747, 175051506, 18320820, 2352, 7), -- $11,700.98 - $17,505.15
(2025, 'catorcenal', 175051507, 233401762, 31975300, 3000, 8), -- $17,505.16 - $23,340.17
(2025, 'catorcenal', 233401763, 350009940, 49466480, 3200, 9), -- $23,340.18 - $35,000.99
(2025, 'catorcenal', 350009941, 10000000000, 86810780, 3400, 10); -- $35,001.00 - En adelante

-- =====================================================
-- 5. TABLA ISR 2025 - QUINCENAL
-- =====================================================

INSERT INTO cat_isr_tarifas (anio, periodo, limite_inferior_bp, limite_superior_bp, cuota_fija_bp, tasa_excedente_bp, orden) VALUES
(2025, 'quincenal', 0, 3224950, 0, 192, 1),              -- $0.01 - $322.49
(2025, 'quincenal', 3225000, 27343650, 61950, 640, 2),   -- $322.50 - $2,734.36
(2025, 'quincenal', 27343660, 48078900, 1659050, 1088, 3), -- $2,734.37 - $4,807.89
(2025, 'quincenal', 48078910, 56010150, 3914550, 1600, 4), -- $4,807.90 - $5,601.01
(2025, 'quincenal', 56010160, 66768200, 5183700, 1792, 5), -- $5,601.02 - $6,676.82
(2025, 'quincenal', 66768210, 125367600, 7108800, 2136, 6), -- $6,676.83 - $12,536.76
(2025, 'quincenal', 125367610, 187555200, 19629500, 2352, 7), -- $12,536.77 - $18,755.52
(2025, 'quincenal', 187555210, 250073750, 34259150, 3000, 8), -- $18,755.53 - $25,007.37
(2025, 'quincenal', 250073760, 375010650, 52999800, 3200, 9), -- $25,007.38 - $37,501.06
(2025, 'quincenal', 375010660, 10000000000, 93011600, 3400, 10); -- $37,501.07 - En adelante

-- =====================================================
-- 6. TABLA ISR 2025 - MENSUAL (Ya incluida anteriormente)
-- =====================================================
-- Ya existe en schema_nomina_completo.sql
-- Solo para referencia:

/*
INSERT INTO cat_isr_tarifas (anio, periodo, limite_inferior_bp, limite_superior_bp, cuota_fija_bp, tasa_excedente_bp, orden) VALUES
(2025, 'mensual', 0, 6449900, 0, 192, 1),
(2025, 'mensual', 6450000, 54687400, 123900, 640, 2),
(2025, 'mensual', 54687500, 96157800, 3318200, 1088, 3),
(2025, 'mensual', 96157900, 112020299, 7829100, 1600, 4),
(2025, 'mensual', 112020300, 133536399, 10367400, 1792, 5),
(2025, 'mensual', 133536400, 250735199, 14217600, 2136, 6),
(2025, 'mensual', 250735200, 375110399, 39259000, 2352, 7),
(2025, 'mensual', 375110400, 500147499, 68518300, 3000, 8),
(2025, 'mensual', 500147500, 750221299, 105999600, 3200, 9),
(2025, 'mensual', 750221300, 10000000000, 186023200, 3400, 10);
*/

-- =====================================================
-- SUBSIDIO AL EMPLEO 2025 - DIARIO
-- =====================================================

INSERT INTO cat_subsidio_empleo (anio, periodo, limite_inferior_bp, limite_superior_bp, subsidio_bp, orden) VALUES
(2025, 'diario', 0, 600000, 135960, 1),         -- $0.01 - $60.00, Subsidio: $13.59
(2025, 'diario', 600100, 650000, 135940, 2),    -- $60.01 - $65.00
(2025, 'diario', 650100, 1150000, 129920, 3),   -- $65.01 - $115.00
(2025, 'diario', 1150100, 1316660, 129340, 4),  -- $115.01 - $131.66
(2025, 'diario', 1316670, 1633330, 116120, 5),  -- $131.67 - $163.33
(2025, 'diario', 1633340, 1966660, 106820, 6),  -- $163.34 - $196.66
(2025, 'diario', 1966670, 2566660, 97540, 7),   -- $196.67 - $256.66
(2025, 'diario', 2566670, 10000000000, 0, 8);   -- $256.67 - En adelante

-- =====================================================
-- SUBSIDIO AL EMPLEO 2025 - SEMANAL
-- =====================================================

INSERT INTO cat_subsidio_empleo (anio, periodo, limite_inferior_bp, limite_superior_bp, subsidio_bp, orden) VALUES
(2025, 'semanal', 0, 4200000, 951720, 1),        -- $0.01 - $420.00, Subsidio: $95.17
(2025, 'semanal', 4200100, 4550000, 951580, 2),  -- $420.01 - $455.00
(2025, 'semanal', 4550100, 8050000, 909440, 3),  -- $455.01 - $805.00
(2025, 'semanal', 8050100, 9216620, 905380, 4),  -- $805.01 - $921.66
(2025, 'semanal', 9216630, 11433310, 812840, 5), -- $921.67 - $1,143.33
(2025, 'semanal', 11433320, 13766620, 747740, 6), -- $1,143.34 - $1,376.66
(2025, 'semanal', 13766630, 17966620, 682780, 7), -- $1,376.67 - $1,796.66
(2025, 'semanal', 17966630, 10000000000, 0, 8);  -- $1,796.67 - En adelante

-- =====================================================
-- SUBSIDIO AL EMPLEO 2025 - DECENAL (10 DÍAS)
-- =====================================================

INSERT INTO cat_subsidio_empleo (anio, periodo, limite_inferior_bp, limite_superior_bp, subsidio_bp, orden) VALUES
(2025, 'decenal', 0, 6000000, 1359600, 1),        -- $0.01 - $600.00
(2025, 'decenal', 6000100, 6500000, 1359400, 2),  -- $600.01 - $650.00
(2025, 'decenal', 6500100, 11500000, 1299200, 3), -- $650.01 - $1,150.00
(2025, 'decenal', 11500100, 13166600, 1293400, 4), -- $1,150.01 - $1,316.66
(2025, 'decenal', 13166610, 16333300, 1161200, 5), -- $1,316.67 - $1,633.33
(2025, 'decenal', 16333310, 19666600, 1068200, 6), -- $1,633.34 - $1,966.66
(2025, 'decenal', 19666610, 25666600, 975400, 7),  -- $1,966.67 - $2,566.66
(2025, 'decenal', 25666610, 10000000000, 0, 8);   -- $2,566.67 - En adelante

-- =====================================================
-- SUBSIDIO AL EMPLEO 2025 - CATORCENAL (14 DÍAS)
-- =====================================================

INSERT INTO cat_subsidio_empleo (anio, periodo, limite_inferior_bp, limite_superior_bp, subsidio_bp, orden) VALUES
(2025, 'catorcenal', 0, 8400000, 1903440, 1),      -- $0.01 - $840.00
(2025, 'catorcenal', 8400100, 9100000, 1903160, 2), -- $840.01 - $910.00
(2025, 'catorcenal', 9100100, 16100000, 1818880, 3), -- $910.01 - $1,610.00
(2025, 'catorcenal', 16100100, 18433240, 1810760, 4), -- $1,610.01 - $1,843.32
(2025, 'catorcenal', 18433250, 22866620, 1625680, 5), -- $1,843.33 - $2,286.66
(2025, 'catorcenal', 22866630, 27533240, 1495480, 6), -- $2,286.67 - $2,753.32
(2025, 'catorcenal', 27533250, 35933240, 1365560, 7), -- $2,753.33 - $3,593.32
(2025, 'catorcenal', 35933250, 10000000000, 0, 8);   -- $3,593.33 - En adelante

-- =====================================================
-- SUBSIDIO AL EMPLEO 2025 - QUINCENAL
-- =====================================================

INSERT INTO cat_subsidio_empleo (anio, periodo, limite_inferior_bp, limite_superior_bp, subsidio_bp, orden) VALUES
(2025, 'quincenal', 0, 9000000, 2039400, 1),       -- $0.01 - $900.00
(2025, 'quincenal', 9000100, 9750000, 2039100, 2), -- $900.01 - $975.00
(2025, 'quincenal', 9750100, 17250000, 1948800, 3), -- $975.01 - $1,725.00
(2025, 'quincenal', 17250100, 19750000, 1940100, 4), -- $1,725.01 - $1,975.00
(2025, 'quincenal', 19750100, 24500000, 1741800, 5), -- $1,975.01 - $2,450.00
(2025, 'quincenal', 24500100, 29500000, 1602300, 6), -- $2,450.01 - $2,950.00
(2025, 'quincenal', 29500100, 38500000, 1463100, 7), -- $2,950.01 - $3,850.00
(2025, 'quincenal', 38500100, 10000000000, 0, 8);   -- $3,850.01 - En adelante

-- =====================================================
-- SUBSIDIO AL EMPLEO 2025 - MENSUAL
-- =====================================================
-- Ya incluido en schema_nomina_completo.sql
-- Solo para referencia:

/*
INSERT INTO cat_subsidio_empleo (anio, periodo, limite_inferior_bp, limite_superior_bp, subsidio_bp, orden) VALUES
(2025, 'mensual', 0, 18000000, 4078800, 1),
(2025, 'mensual', 18000100, 19500000, 4078200, 2),
(2025, 'mensual', 19500100, 34500000, 3897600, 3),
(2025, 'mensual', 34500100, 39500000, 3880200, 4),
(2025, 'mensual', 39500100, 49000000, 3483600, 5),
(2025, 'mensual', 49000100, 59000000, 3204600, 6),
(2025, 'mensual', 59000100, 77000000, 2926200, 7),
(2025, 'mensual', 77000100, 10000000000, 0, 8);
*/

-- =====================================================
-- VERIFICACIÓN DE INSTALACIÓN
-- =====================================================

-- Verificar cuántas tarifas ISR tenemos por período
SELECT 
    periodo,
    COUNT(*) as rangos,
    MIN(bp_to_pesos(limite_inferior_bp)) as limite_min,
    MAX(bp_to_pesos(COALESCE(limite_superior_bp, limite_inferior_bp))) as limite_max
FROM cat_isr_tarifas
WHERE anio = 2025
GROUP BY periodo
ORDER BY 
    CASE periodo
        WHEN 'diario' THEN 1
        WHEN 'semanal' THEN 2
        WHEN 'decenal' THEN 3
        WHEN 'catorcenal' THEN 4
        WHEN 'quincenal' THEN 5
        WHEN 'mensual' THEN 6
    END;

-- Verificar cuántas tarifas de Subsidio tenemos por período
SELECT 
    periodo,
    COUNT(*) as rangos,
    MIN(bp_to_pesos(limite_inferior_bp)) as limite_min,
    MAX(bp_to_pesos(COALESCE(limite_superior_bp, limite_inferior_bp))) as limite_max,
    MAX(bp_to_pesos(subsidio_bp)) as subsidio_max
FROM cat_subsidio_empleo
WHERE anio = 2025
GROUP BY periodo
ORDER BY 
    CASE periodo
        WHEN 'diario' THEN 1
        WHEN 'semanal' THEN 2
        WHEN 'decenal' THEN 3
        WHEN 'catorcenal' THEN 4
        WHEN 'quincenal' THEN 5
        WHEN 'mensual' THEN 6
    END;

-- =====================================================
-- EJEMPLOS DE USO
-- =====================================================

-- Ejemplo 1: ISR Diario de $500
SELECT 
    'Diario' as periodo,
    500.00 as sueldo_diario,
    bp_to_pesos(calcular_isr(pesos_to_bp(500), 'diario', 2025)) as isr_diario;

-- Ejemplo 2: ISR Semanal de $3,500
SELECT 
    'Semanal' as periodo,
    3500.00 as sueldo_semanal,
    bp_to_pesos(calcular_isr(pesos_to_bp(3500), 'semanal', 2025)) as isr_semanal;

-- Ejemplo 3: ISR Catorcenal de $7,000
SELECT 
    'Catorcenal' as periodo,
    7000.00 as sueldo_catorcenal,
    bp_to_pesos(calcular_isr(pesos_to_bp(7000), 'catorcenal', 2025)) as isr_catorcenal;

-- Ejemplo 4: Comparar ISR en diferentes períodos del mismo sueldo mensual
WITH sueldo_mensual AS (
    SELECT 15000.00 as sueldo
)
SELECT 
    periodo,
    sueldo_periodo,
    bp_to_pesos(calcular_isr(pesos_to_bp(sueldo_periodo), periodo, 2025)) as isr_periodo,
    bp_to_pesos(calcular_isr(pesos_to_bp(sueldo_periodo), periodo, 2025)) * factor_anual as isr_anual_proyectado
FROM (
    SELECT 'Diario' as periodo, (SELECT sueldo FROM sueldo_mensual) / 30 as sueldo_periodo, 365 as factor_anual
    UNION ALL
    SELECT 'Semanal', (SELECT sueldo FROM sueldo_mensual) / 4.33, 52
    UNION ALL
    SELECT 'Decenal', (SELECT sueldo FROM sueldo_mensual) / 3, 36
    UNION ALL
    SELECT 'Catorcenal', (SELECT sueldo FROM sueldo_mensual) / 2.14, 26
    UNION ALL
    SELECT 'Quincenal', (SELECT sueldo FROM sueldo_mensual) / 2, 24
    UNION ALL
    SELECT 'Mensual', (SELECT sueldo FROM sueldo_mensual), 12
) periodos
ORDER BY 
    CASE periodo
        WHEN 'Diario' THEN 1
        WHEN 'Semanal' THEN 2
        WHEN 'Decenal' THEN 3
        WHEN 'Catorcenal' THEN 4
        WHEN 'Quincenal' THEN 5
        WHEN 'Mensual' THEN 6
    END;

-- Ejemplo 5: Subsidio al Empleo por período
SELECT 
    periodo,
    sueldo,
    bp_to_pesos(subsidio_entregable_bp) as subsidio_entregable,
    bp_to_pesos(subsidio_aplicado_credito_bp) as subsidio_aplicado,
    bp_to_pesos(isr_a_retener_bp) as isr_a_retener
FROM (
    SELECT 'Diario' as periodo, 100.00 as sueldo
    UNION ALL SELECT 'Semanal', 700.00
    UNION ALL SELECT 'Decenal', 1000.00
    UNION ALL SELECT 'Catorcenal', 1400.00
    UNION ALL SELECT 'Quincenal', 1500.00
    UNION ALL SELECT 'Mensual', 3000.00
) periodos
CROSS JOIN LATERAL (
    SELECT * FROM calcular_subsidio_empleo(
        pesos_to_bp(sueldo),
        calcular_isr(pesos_to_bp(sueldo), periodo, 2025),
        periodo,
        2025
    )
) subsidio
ORDER BY 
    CASE periodo
        WHEN 'Diario' THEN 1
        WHEN 'Semanal' THEN 2
        WHEN 'Decenal' THEN 3
        WHEN 'Catorcenal' THEN 4
        WHEN 'Quincenal' THEN 5
        WHEN 'Mensual' THEN 6
    END;

-- =====================================================
-- COMENTARIOS Y NOTAS
-- =====================================================

COMMENT ON TABLE cat_isr_tarifas IS 'Tablas oficiales de ISR 2025 para todos los períodos de pago: diario, semanal, decenal, catorcenal, quincenal y mensual. Artículo 96 LISR.';
COMMENT ON TABLE cat_subsidio_empleo IS 'Tablas de Subsidio al Empleo 2025 para todos los períodos de pago. Decreto del Subsidio al Empleo.';

-- =====================================================
-- TIPS IMPORTANTES
-- =====================================================

/*
NOTA 1: PERIODICIDAD DE PAGO EN MÉXICO
======================================
- Diario: Para trabajadores por día (jornaleros, eventuales)
- Semanal: Común en manufactura, construcción
- Decenal: Poco común, algunos sectores específicos
- Catorcenal: Raro, principalmente gobierno
- Quincenal: MÁS COMÚN - mayoría de empresas
- Mensual: Ejecutivos, directores

NOTA 2: DIFERENCIAS DE ISR POR PERÍODO
======================================
El ISR pagado puede variar según el período:
- Mensual: ISR más alto (menos períodos al año)
- Quincenal: ISR medio-alto
- Semanal: ISR más bajo (más períodos al año)

Por eso muchas empresas prefieren pago quincenal/semanal.

NOTA 3: SUBSIDIO AL EMPLEO
===========================
El subsidio al empleo favorece salarios más bajos.
A mayor frecuencia de pago, mayor beneficio del subsidio.

NOTA 4: CONVERSIÓN ENTRE PERÍODOS
==================================
Para convertir sueldo mensual a otros períodos:
- Diario: mensual / 30.4 (promedio días por mes)
- Semanal: mensual / 4.33 (52 semanas / 12 meses)
- Decenal: mensual / 3 (3 decenas por mes)
- Catorcenal: mensual / 2.14 (26 catorcenas / 12 meses)
- Quincenal: mensual / 2

NOTA 5: ACTUALIZACIÓN DE TABLAS
================================
Estas tablas deben actualizarse cada año cuando:
1. SAT publica nuevas tarifas ISR (generalmente en diciembre)
2. Se actualiza la UMA (enero de cada año)
3. Cambia el Subsidio al Empleo (decreto presidencial)

Para actualizar:
1. Obtener tablas oficiales del SAT
2. Convertir a basis points (* 10000)
3. Ejecutar INSERT con nuevo anio = 2026
4. Las funciones automáticamente usarán las nuevas tablas
*/

-- =====================================================
-- RESUMEN DE INSTALACIÓN
-- =====================================================

DO $$
DECLARE
    total_isr INTEGER;
    total_subsidio INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_isr FROM cat_isr_tarifas WHERE anio = 2025;
    SELECT COUNT(*) INTO total_subsidio FROM cat_subsidio_empleo WHERE anio = 2025;
    
    RAISE NOTICE '═══════════════════════════════════════════════════════';
    RAISE NOTICE 'INSTALACIÓN COMPLETADA - TABLAS ISR Y SUBSIDIO 2025';
    RAISE NOTICE '═══════════════════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE 'Tarifas ISR instaladas:        % registros', total_isr;
    RAISE NOTICE 'Tarifas Subsidio instaladas:   % registros', total_subsidio;
    RAISE NOTICE '';
    RAISE NOTICE 'Períodos soportados:';
    RAISE NOTICE '  ✓ Diario';
    RAISE NOTICE '  ✓ Semanal';
    RAISE NOTICE '  ✓ Decenal (10 días)';
    RAISE NOTICE '  ✓ Catorcenal (14 días)';
    RAISE NOTICE '  ✓ Quincenal (15 días)';
    RAISE NOTICE '  ✓ Mensual (30 días)';
    RAISE NOTICE '';
    RAISE NOTICE 'Sistema listo para calcular nómina con cualquier periodicidad';
    RAISE NOTICE '═══════════════════════════════════════════════════════';
END $$;
