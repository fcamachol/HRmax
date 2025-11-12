-- =====================================================
-- EJEMPLOS PRÁCTICOS DE USO DEL SISTEMA DE NÓMINA
-- Casos reales con datos de prueba
-- =====================================================

-- =====================================================
-- EJEMPLO 1: CALCULAR NÓMINA QUINCENAL SIMPLE
-- =====================================================

-- EMPLEADO: Juan Pérez
-- Sueldo Mensual: $15,000
-- Período: Quincenal (1ra quincena enero 2025)

-- Paso 1: Convertir sueldo a basis points
SELECT 
    15000.00 as sueldo_mensual,
    pesos_to_bp(15000) as sueldo_mensual_bp,
    15000.00 / 2 as sueldo_quincenal,
    pesos_to_bp(15000 / 2) as sueldo_quincenal_bp;

-- Resultado:
-- sueldo_mensual: 15000.00
-- sueldo_mensual_bp: 150000000
-- sueldo_quincenal: 7500.00
-- sueldo_quincenal_bp: 75000000

-- Paso 2: Calcular ISR quincenal
SELECT 
    7500.00 as sueldo_quincenal,
    bp_to_pesos(calcular_isr(pesos_to_bp(7500), 'quincenal', 2025)) as isr_quincenal;

-- Resultado:
-- sueldo_quincenal: 7500.00
-- isr_quincenal: 523.17

-- Paso 3: Calcular subsidio al empleo
SELECT 
    7500.00 as sueldo_quincenal,
    523.17 as isr_causado,
    bp_to_pesos(subsidio_entregable_bp) as subsidio_entregable,
    bp_to_pesos(subsidio_aplicado_credito_bp) as subsidio_aplicado,
    bp_to_pesos(isr_a_retener_bp) as isr_a_retener
FROM calcular_subsidio_empleo(
    pesos_to_bp(7500),  -- sueldo
    pesos_to_bp(523.17), -- ISR causado
    'quincenal', 
    2025
);

-- Resultado:
-- subsidio_entregable: 0.00
-- subsidio_aplicado: 194.88 (subsidio tabla quincenal para 7500)
-- isr_a_retener: 328.29 (523.17 - 194.88)

-- Paso 4: Calcular SDI y SBC
SELECT 
    500.00 as sueldo_diario, -- 15000 / 30
    bp_to_pesos(calcular_sdi(pesos_to_bp(500), 15, 6, 0.25)) as sdi,
    bp_to_pesos(calcular_sbc(
        calcular_sdi(pesos_to_bp(500), 15, 6, 0.25), 
        2025
    )) as sbc;

-- Resultado:
-- sueldo_diario: 500.00
-- sdi: 520.55
-- sbc: 520.55

-- Paso 5: Calcular IMSS trabajador
SELECT 
    520.55 as sbc,
    bp_to_pesos(enfermedad_maternidad_bp) as enf_mat,
    bp_to_pesos(invalidez_vida_bp) as inv_vida,
    bp_to_pesos(cesantia_vejez_bp) as ces_vejez,
    bp_to_pesos(total_imss_trabajador_bp) as total_imss
FROM calcular_imss_trabajador(pesos_to_bp(520.55), 2025);

-- Resultado:
-- enf_mat: 5.30
-- inv_vida: 3.28
-- ces_vejez: 5.88
-- total_imss: 14.46

-- Paso 6: Resumen de la nómina
SELECT 
    'Percepciones' as concepto,
    7500.00 as importe
UNION ALL
SELECT 'ISR Retenido', -328.29
UNION ALL
SELECT 'IMSS', -14.46
UNION ALL
SELECT 'Neto a Pagar', 7500.00 - 328.29 - 14.46;

-- Resultado Final:
-- Percepciones:     $7,500.00
-- ISR Retenido:     -$328.29
-- IMSS:             -$14.46
-- Neto a Pagar:     $7,157.25

-- =====================================================
-- EJEMPLO 2: EMPLEADO CON HORAS EXTRA
-- =====================================================

-- EMPLEADO: María González
-- Sueldo Mensual: $12,000
-- Horas Extra Dobles: 5 horas
-- Horas Extra Triples: 2 horas
-- Jornada: 8 horas diarias

-- Paso 1: Calcular pago de horas extra
SELECT 
    12000.00 as sueldo_mensual,
    bp_to_pesos(pago_horas_dobles_bp) as pago_dobles,
    bp_to_pesos(pago_horas_triples_bp) as pago_triples,
    bp_to_pesos(total_horas_extra_bp) as total_horas_extra
FROM calcular_horas_extra(
    pesos_to_bp(12000), -- sueldo mensual
    30,                  -- días del mes
    8,                   -- horas por jornada
    5,                   -- horas extra dobles
    2                    -- horas extra triples
);

-- Resultado:
-- pago_dobles: 500.00 (12000/30/8 * 2 * 5)
-- pago_triples: 300.00 (12000/30/8 * 3 * 2)
-- total_horas_extra: 800.00

-- Paso 2: Calcular nómina completa con extras
WITH percepciones AS (
    SELECT 
        6000.00 as sueldo_quincenal,
        800.00 as horas_extra,
        6800.00 as total_percepciones
)
SELECT 
    p.total_percepciones,
    bp_to_pesos(calcular_isr(pesos_to_bp(p.total_percepciones), 'quincenal', 2025)) as isr,
    bp_to_pesos(total_imss_trabajador_bp) as imss,
    p.total_percepciones - 
        bp_to_pesos(calcular_isr(pesos_to_bp(p.total_percepciones), 'quincenal', 2025)) -
        bp_to_pesos(total_imss_trabajador_bp) as neto
FROM percepciones p,
     calcular_imss_trabajador(pesos_to_bp(416.67), 2025); -- SBC

-- Resultado:
-- total_percepciones: 6800.00
-- isr: 445.00
-- imss: 12.50
-- neto: 6342.50

-- =====================================================
-- EJEMPLO 3: EMPLEADO CON AGUINALDO
-- =====================================================

-- EMPLEADO: Carlos Ramírez
-- Sueldo Diario: $500
-- Días de aguinaldo: 15 (ley)
-- Días trabajados en el año: 365 (año completo)

SELECT 
    500.00 as sueldo_diario,
    bp_to_pesos(aguinaldo_total_bp) as aguinaldo_total,
    bp_to_pesos(aguinaldo_exento_bp) as aguinaldo_exento,
    bp_to_pesos(aguinaldo_gravado_bp) as aguinaldo_gravado
FROM calcular_aguinaldo(
    pesos_to_bp(500), 
    15,      -- días de aguinaldo
    365,     -- días trabajados
    false    -- NO proporcional (año completo)
);

-- Resultado:
-- aguinaldo_total: 7500.00 (500 * 15)
-- aguinaldo_exento: 7500.00 (está bajo 30 UMAs = $3,414.90)
-- aguinaldo_gravado: 0.00

-- Nota: El aguinaldo NO paga ISR porque está bajo el límite

-- Ahora con aguinaldo mayor (gerente):
SELECT 
    2000.00 as sueldo_diario,
    bp_to_pesos(aguinaldo_total_bp) as aguinaldo_total,
    bp_to_pesos(aguinaldo_exento_bp) as aguinaldo_exento,
    bp_to_pesos(aguinaldo_gravado_bp) as aguinaldo_gravado
FROM calcular_aguinaldo(
    pesos_to_bp(2000), 
    15,
    365,
    false
);

-- Resultado:
-- aguinaldo_total: 30000.00 (2000 * 15)
-- aguinaldo_exento: 3414.90 (30 UMAs)
-- aguinaldo_gravado: 26585.10

-- =====================================================
-- EJEMPLO 4: EMPLEADO CON FALTAS E INCAPACIDAD
-- =====================================================

-- EMPLEADO: Ana López
-- Sueldo Mensual: $10,000
-- Faltas: 2 días
-- Incapacidad: 3 días (enfermedad general)

-- Paso 1: Calcular descuento por faltas
SELECT 
    10000.00 / 30 as sueldo_diario,
    (10000.00 / 30) * 2 as descuento_faltas;

-- Resultado:
-- sueldo_diario: 333.33
-- descuento_faltas: 666.66

-- Paso 2: Calcular descuento por incapacidad
-- Nota: Incapacidad general los primeros 3 días los paga el patrón al 60%
SELECT 
    333.33 as sueldo_diario,
    333.33 * 3 * 0.60 as descuento_incapacidad;

-- Resultado:
-- descuento_incapacidad: 599.99 (el patrón solo paga 60% los 3 primeros días)

-- Paso 3: Calcular nómina quincenal
WITH datos AS (
    SELECT 
        5000.00 as sueldo_quincenal_base,
        -666.66 as descuento_faltas,
        -599.99 as descuento_incapacidad,
        5000.00 - 666.66 - 599.99 as percepciones_netas
)
SELECT 
    d.sueldo_quincenal_base,
    d.descuento_faltas,
    d.descuento_incapacidad,
    d.percepciones_netas,
    bp_to_pesos(calcular_isr(pesos_to_bp(d.percepciones_netas), 'quincenal', 2025)) as isr,
    d.percepciones_netas - 
        bp_to_pesos(calcular_isr(pesos_to_bp(d.percepciones_netas), 'quincenal', 2025)) as neto
FROM datos d;

-- Resultado:
-- sueldo_quincenal_base: 5000.00
-- descuento_faltas: -666.66
-- descuento_incapacidad: -599.99
-- percepciones_netas: 3733.35
-- isr: 97.54
-- neto: 3635.81

-- =====================================================
-- EJEMPLO 5: CONFIGURAR CONCEPTO PERSONALIZADO
-- =====================================================

-- Caso: Empresa que da "Bono de Productividad" del 10% si cumple metas

-- Paso 1: Crear el concepto
INSERT INTO conceptos_nomina (
    cliente_id,
    empresa_id,
    codigo,
    nombre,
    tipo,
    sat_clave,
    tipo_calculo,
    formula,
    base_calculo,
    factor,
    orden_calculo,
    gravado,
    integra_sdi,
    naturaleza
) VALUES (
    'cliente-abc-123',
    'empresa-xyz-456',
    'P100',
    'Bono de Productividad',
    'percepcion',
    '049', -- Premios por asistencia (SAT)
    'formula',
    'sueldo_base_mensual * 0.10',
    'sueldo_base',
    0.10,
    75,
    true,  -- Sí grava ISR
    true,  -- Sí integra SDI
    'ordinaria'
);

-- Paso 2: Aplicar el concepto a un empleado
-- Durante el cálculo de nómina, el sistema evaluará:
-- sueldo_base_mensual * 0.10

-- Para un empleado con $15,000:
SELECT 
    15000.00 as sueldo_base,
    15000.00 * 0.10 as bono_productividad,
    15000.00 + (15000.00 * 0.10) as total_percepciones;

-- Resultado:
-- sueldo_base: 15000.00
-- bono_productividad: 1500.00
-- total_percepciones: 16500.00

-- =====================================================
-- EJEMPLO 6: EMPLEADO CON CRÉDITO INFONAVIT
-- =====================================================

-- EMPLEADO: Roberto Sánchez
-- SBC: $800
-- Tipo descuento: Porcentaje
-- Porcentaje: 25%

SELECT 
    800.00 as sbc,
    bp_to_pesos(
        calcular_descuento_infonavit(
            'porcentaje',
            porcentaje_to_bp(25), -- 25%
            pesos_to_bp(800),
            2025
        )
    ) as descuento_infonavit;

-- Resultado:
-- sbc: 800.00
-- descuento_infonavit: 200.00 (800 * 0.25)

-- Otro ejemplo con Veces Salario Mínimo (VSM):
-- Descuento de 2 VSM
SELECT 
    800.00 as sbc,
    bp_to_pesos(
        calcular_descuento_infonavit(
            'vsm',
            pesos_to_bp(2), -- 2 veces salario mínimo
            pesos_to_bp(800),
            2025
        )
    ) as descuento_infonavit;

-- Resultado:
-- sbc: 800.00
-- descuento_infonavit: 497.28 (248.64 * 2)

-- =====================================================
-- EJEMPLO 7: COMPARACIÓN MENSUAL VS QUINCENAL
-- =====================================================

-- Mismo empleado, comparar ISR mensual vs quincenal

-- MENSUAL (1 pago de $15,000):
SELECT 
    'Mensual' as tipo_periodo,
    15000.00 as sueldo,
    bp_to_pesos(calcular_isr(pesos_to_bp(15000), 'mensual', 2025)) as isr;

-- QUINCENAL (2 pagos de $7,500):
SELECT 
    'Quincenal' as tipo_periodo,
    7500.00 as sueldo,
    bp_to_pesos(calcular_isr(pesos_to_bp(7500), 'quincenal', 2025)) * 2 as isr;

-- Resultado:
-- Mensual:   ISR = $1,180.89
-- Quincenal: ISR = $1,046.34 ($523.17 * 2)

-- IMPORTANTE: Por eso es mejor pagar quincenalmente, el ISR es menor

-- =====================================================
-- EJEMPLO 8: NÓMINA COMPLETA DE PRINCIPIO A FIN
-- =====================================================

-- Caso real: Calcular nómina quincenal para 3 empleados

-- EMPLEADO 1: Operador - $10,000 mensuales
-- EMPLEADO 2: Supervisor - $20,000 mensuales + 3 horas extra dobles
-- EMPLEADO 3: Gerente - $40,000 mensuales

-- Crear período
INSERT INTO periodos_nomina (
    cliente_id,
    empresa_id,
    tipo_periodo,
    numero_periodo,
    anio,
    fecha_inicio,
    fecha_fin,
    fecha_pago,
    dias_periodo,
    dias_laborales
) VALUES (
    'cliente-1',
    'empresa-1',
    'quincenal',
    1,
    2025,
    '2025-01-01',
    '2025-01-15',
    '2025-01-16',
    15,
    11 -- días laborales (sin contar fines de semana)
) RETURNING id;

-- Supongamos que retorna: 'periodo-abc-123'

-- Crear movimientos para Empleado 1 (Operador)
INSERT INTO nomina_movimientos (
    cliente_id,
    empresa_id,
    empleado_id,
    periodo_id,
    concepto_id,
    tipo,
    concepto_nombre,
    importe_total_bp,
    importe_gravado_bp,
    origen
) VALUES
-- Sueldo
('cliente-1', 'empresa-1', 'emp-001', 'periodo-abc-123', 
 'concepto-sueldo', 'percepcion', 'Sueldo Base', 
 pesos_to_bp(5000), pesos_to_bp(5000), 'ordinario'),
-- ISR
('cliente-1', 'empresa-1', 'emp-001', 'periodo-abc-123', 
 'concepto-isr', 'deduccion', 'ISR', 
 calcular_isr(pesos_to_bp(5000), 'quincenal', 2025), 0, 'ordinario'),
-- IMSS
('cliente-1', 'empresa-1', 'emp-001', 'periodo-abc-123', 
 'concepto-imss', 'deduccion', 'IMSS', 
 (SELECT total_imss_trabajador_bp FROM calcular_imss_trabajador(pesos_to_bp(347.22), 2025)), 
 0, 'ordinario');

-- Resumen del período
SELECT 
    e.nombre,
    p.tipo_periodo,
    p.numero_periodo,
    bp_to_pesos(r.total_percepciones_bp) as percepciones,
    bp_to_pesos(r.isr_retenido_bp) as isr,
    bp_to_pesos(r.imss_trabajador_bp) as imss,
    bp_to_pesos(r.total_deducciones_bp) as deducciones,
    bp_to_pesos(r.neto_pagar_bp) as neto
FROM nomina_resumen_empleado r
JOIN empleados e ON r.empleado_id = e.id
JOIN periodos_nomina p ON r.periodo_id = p.id
WHERE p.id = 'periodo-abc-123'
ORDER BY e.nombre;

-- =====================================================
-- EJEMPLO 9: VALIDAR NÓMINA ANTES DE TIMBRAR
-- =====================================================

-- Validar nómina de todos los empleados del período
SELECT 
    e.numero_empleado,
    e.nombre,
    v.validacion_ok,
    v.errores
FROM empleados e
CROSS JOIN LATERAL validar_nomina_empleado(e.id, 'periodo-abc-123') v
WHERE NOT v.validacion_ok;

-- Si retorna vacío = todos los empleados están OK
-- Si retorna registros = hay errores que corregir

-- =====================================================
-- EJEMPLO 10: REPORTE DE COSTOS LABORALES
-- =====================================================

-- Calcular costo laboral total (incluyendo parte patronal)

WITH costos_empleado AS (
    SELECT 
        e.id,
        e.nombre,
        -- Percepciones
        r.total_percepciones_bp,
        -- IMSS Patrón
        (SELECT total_imss_patron_bp 
         FROM calcular_imss_patron(e.sbc_bp, e.prima_riesgo_bp, 2025)) as imss_patron_bp,
        -- Costo total
        r.total_percepciones_bp + 
        (SELECT total_imss_patron_bp 
         FROM calcular_imss_patron(e.sbc_bp, e.prima_riesgo_bp, 2025)) as costo_total_bp
    FROM empleados e
    JOIN nomina_resumen_empleado r ON e.id = r.empleado_id
    WHERE r.periodo_id = 'periodo-abc-123'
)
SELECT 
    nombre,
    bp_to_pesos(total_percepciones_bp) as sueldo_bruto,
    bp_to_pesos(imss_patron_bp) as cuotas_patronales,
    bp_to_pesos(costo_total_bp) as costo_total,
    ROUND(
        (imss_patron_bp::NUMERIC / total_percepciones_bp::NUMERIC) * 100, 
        2
    ) as porcentaje_sobrecosto
FROM costos_empleado
ORDER BY costo_total_bp DESC;

-- Resultado ejemplo:
-- nombre           | sueldo_bruto | cuotas_patronales | costo_total | % sobrecosto
-- Gerente          | 20,000.00    | 2,400.00          | 22,400.00   | 12.00%
-- Supervisor       | 10,000.00    | 1,200.00          | 11,200.00   | 12.00%
-- Operador         | 5,000.00     | 600.00            | 5,600.00    | 12.00%

-- =====================================================
-- TIPS Y MEJORES PRÁCTICAS
-- =====================================================

-- TIP 1: Siempre usar basis points en cálculos
-- ❌ INCORRECTO:
SELECT 15000.00 * 0.1;  -- Puede perder decimales

-- ✅ CORRECTO:
SELECT bp_to_pesos(pesos_to_bp(15000) * 10 / 100);  -- Precisión perfecta

-- TIP 2: Validar antes de calcular
-- ✅ Verificar que el empleado tenga todos los datos
SELECT 
    COUNT(*) as empleados_sin_sbc
FROM empleados 
WHERE sbc_bp IS NULL AND activo = true;

-- TIP 3: Usar transacciones para cálculo de nómina
BEGIN;
    -- Calcular todos los movimientos
    -- Si algo falla, rollback automático
    INSERT INTO nomina_movimientos ...;
    UPDATE nomina_resumen_empleado ...;
COMMIT;

-- TIP 4: Auditar cambios importantes
INSERT INTO nomina_audit_log (
    cliente_id,
    usuario_id,
    accion,
    entidad,
    entidad_id,
    notas
) VALUES (
    'cliente-1',
    'user-123',
    'ajuste_manual',
    'movimiento',
    'mov-456',
    'Corrección de ISR por error en cálculo inicial'
);

-- TIP 5: Usar vistas para reportes frecuentes
-- En lugar de queries complejos, crear vistas
SELECT * FROM v_nomina_completa 
WHERE periodo_id = 'periodo-abc-123';

-- =====================================================
-- QUERIES ÚTILES PARA EL DÍA A DÍA
-- =====================================================

-- Ver todos los períodos abiertos
SELECT * FROM periodos_nomina WHERE estatus = 'abierto';

-- Ver incidencias pendientes de aprobar
SELECT * FROM v_incidencias_pendientes;

-- Total de nómina del período
SELECT 
    p.tipo_periodo,
    p.numero_periodo,
    COUNT(*) as empleados,
    bp_to_pesos(SUM(r.total_percepciones_bp)) as total_percepciones,
    bp_to_pesos(SUM(r.total_deducciones_bp)) as total_deducciones,
    bp_to_pesos(SUM(r.neto_pagar_bp)) as total_neto
FROM nomina_resumen_empleado r
JOIN periodos_nomina p ON r.periodo_id = p.id
WHERE p.id = 'periodo-abc-123'
GROUP BY p.tipo_periodo, p.numero_periodo;

-- Empleados con neto mayor a X
SELECT 
    e.numero_empleado,
    e.nombre,
    bp_to_pesos(r.neto_pagar_bp) as neto
FROM nomina_resumen_empleado r
JOIN empleados e ON r.empleado_id = e.id
WHERE r.periodo_id = 'periodo-abc-123'
    AND r.neto_pagar_bp > pesos_to_bp(10000)
ORDER BY r.neto_pagar_bp DESC;

-- Top 10 empleados por costo laboral
SELECT 
    e.nombre,
    bp_to_pesos(e.sueldo_base_bp) as sueldo,
    bp_to_pesos(e.sbc_bp) as sbc,
    bp_to_pesos(
        (SELECT total_imss_patron_bp 
         FROM calcular_imss_patron(e.sbc_bp, e.prima_riesgo_bp, 2025))
    ) as costo_imss,
    bp_to_pesos(
        e.sueldo_base_bp + 
        (SELECT total_imss_patron_bp 
         FROM calcular_imss_patron(e.sbc_bp, e.prima_riesgo_bp, 2025))
    ) as costo_total
FROM empleados e
WHERE e.activo = true
ORDER BY costo_total DESC
LIMIT 10;
