-- =====================================================
-- FUNCIONES DE CÁLCULO AUTOMÁTICO DE NÓMINA
-- Sistema superior a NOI con precisión de 4 decimales
-- =====================================================

-- =====================================================
-- 1. FUNCIÓN: CALCULAR ISR (Con basis points)
-- =====================================================

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
        RETURN 0;
    END IF;
    
    -- Calcular excedente del límite inferior
    v_excedente_bp := p_percepciones_gravadas_bp - v_limite_inferior_bp;
    
    -- Calcular impuesto sobre el excedente
    -- (excedente * tasa) / 10000 porque la tasa está en basis points
    v_impuesto_excedente_bp := (v_excedente_bp * v_tasa_excedente_bp) / 10000;
    
    -- ISR = Cuota fija + Impuesto sobre excedente
    v_isr_causado_bp := v_cuota_fija_bp + v_impuesto_excedente_bp;
    
    RETURN v_isr_causado_bp;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Ejemplo de uso:
-- SELECT bp_to_pesos(calcular_isr(pesos_to_bp(15000), 'mensual', 2025));

COMMENT ON FUNCTION calcular_isr IS 'Calcula ISR usando basis points para precisión de 4 decimales. Soporta períodos: mensual, quincenal, semanal, diario';

-- =====================================================
-- 2. FUNCIÓN: CALCULAR SUBSIDIO AL EMPLEO
-- =====================================================

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

-- Ejemplo de uso:
-- SELECT * FROM calcular_subsidio_empleo(pesos_to_bp(5000), pesos_to_bp(250), 'mensual', 2025);

COMMENT ON FUNCTION calcular_subsidio_empleo IS 'Calcula subsidio al empleo determinando cuánto se entrega al trabajador vs cuánto se aplica al crédito de ISR';

-- =====================================================
-- 3. FUNCIÓN: CALCULAR SALARIO DIARIO INTEGRADO (SDI)
-- =====================================================

CREATE OR REPLACE FUNCTION calcular_sdi(
    p_sueldo_diario_bp BIGINT,
    p_dias_aguinaldo INTEGER DEFAULT 15,
    p_dias_vacaciones INTEGER DEFAULT 6,
    p_prima_vacacional NUMERIC DEFAULT 0.25
) RETURNS BIGINT AS $$
DECLARE
    v_factor_integracion NUMERIC;
    v_sdi_bp BIGINT;
BEGIN
    -- Factor de integración = 1 + (aguinaldo/365) + (vacaciones * prima_vac / 365)
    v_factor_integracion := 1.0 + 
        (p_dias_aguinaldo::NUMERIC / 365.0) + 
        ((p_dias_vacaciones::NUMERIC * p_prima_vacacional) / 365.0);
    
    -- SDI = Sueldo Diario * Factor de Integración
    v_sdi_bp := (p_sueldo_diario_bp * v_factor_integracion)::BIGINT;
    
    RETURN v_sdi_bp;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Ejemplo de uso:
-- SELECT bp_to_pesos(calcular_sdi(pesos_to_bp(500), 15, 6, 0.25));

COMMENT ON FUNCTION calcular_sdi IS 'Calcula Salario Diario Integrado considerando aguinaldo y prima vacacional';

-- =====================================================
-- 4. FUNCIÓN: CALCULAR SALARIO BASE DE COTIZACIÓN (SBC)
-- =====================================================

CREATE OR REPLACE FUNCTION calcular_sbc(
    p_sdi_bp BIGINT,
    p_anio INTEGER
) RETURNS BIGINT AS $$
DECLARE
    v_uma_bp BIGINT;
    v_limite_superior_bp BIGINT;
    v_sbc_bp BIGINT;
BEGIN
    -- Obtener UMA del año
    SELECT uma_bp, uma_bp * limite_superior_cotizacion_uma
    INTO v_uma_bp, v_limite_superior_bp
    FROM cat_imss_config
    WHERE anio = p_anio;
    
    -- Si no se encuentra config, usar valores default 2025
    IF NOT FOUND THEN
        v_uma_bp := 1138300; -- $113.83
        v_limite_superior_bp := v_uma_bp * 25; -- 25 UMAs
    END IF;
    
    -- SBC no puede ser menor a 1 UMA ni mayor a 25 UMAs
    v_sbc_bp := GREATEST(v_uma_bp, LEAST(p_sdi_bp, v_limite_superior_bp));
    
    RETURN v_sbc_bp;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Ejemplo de uso:
-- SELECT bp_to_pesos(calcular_sbc(pesos_to_bp(800), 2025));

COMMENT ON FUNCTION calcular_sbc IS 'Calcula Salario Base de Cotización IMSS con tope de 25 UMAs';

-- =====================================================
-- 5. FUNCIÓN: CALCULAR CUOTAS IMSS TRABAJADOR
-- =====================================================

CREATE OR REPLACE FUNCTION calcular_imss_trabajador(
    p_sbc_bp BIGINT,
    p_anio INTEGER
) RETURNS TABLE(
    enfermedad_maternidad_bp BIGINT,
    invalidez_vida_bp BIGINT,
    cesantia_vejez_bp BIGINT,
    total_imss_trabajador_bp BIGINT
) AS $$
DECLARE
    v_uma_bp BIGINT;
    v_tres_umas_bp BIGINT;
    v_excedente_3uma_bp BIGINT;
    v_enf_mat_excedente_bp BIGINT;
    v_enf_mat_dinero_bp BIGINT;
    v_enf_mat_pensionados_bp BIGINT;
    v_invalidez_vida_bp BIGINT;
    v_cesantia_vejez_bp BIGINT;
    v_total_bp BIGINT;
BEGIN
    -- Obtener UMA
    SELECT uma_bp INTO v_uma_bp
    FROM cat_imss_config
    WHERE anio = p_anio;
    
    IF NOT FOUND THEN
        v_uma_bp := 1138300; -- Default 2025
    END IF;
    
    v_tres_umas_bp := v_uma_bp * 3;
    
    -- Calcular excedente de 3 UMAs
    IF p_sbc_bp > v_tres_umas_bp THEN
        v_excedente_3uma_bp := p_sbc_bp - v_tres_umas_bp;
    ELSE
        v_excedente_3uma_bp := 0;
    END IF;
    
    -- Enfermedad y Maternidad
    -- 1. Excedente 3 UMAs: 0.40%
    v_enf_mat_excedente_bp := (v_excedente_3uma_bp * 40) / 10000;
    
    -- 2. Prestaciones en Dinero: 0.25%
    v_enf_mat_dinero_bp := (p_sbc_bp * 25) / 10000;
    
    -- 3. Gastos Médicos Pensionados: 0.38%
    v_enf_mat_pensionados_bp := (p_sbc_bp * 38) / 10000;
    
    enfermedad_maternidad_bp := v_enf_mat_excedente_bp + v_enf_mat_dinero_bp + v_enf_mat_pensionados_bp;
    
    -- Invalidez y Vida: 0.63%
    invalidez_vida_bp := (p_sbc_bp * 63) / 10000;
    
    -- Cesantía y Vejez: 1.13%
    cesantia_vejez_bp := (p_sbc_bp * 113) / 10000;
    
    -- Total
    total_imss_trabajador_bp := enfermedad_maternidad_bp + invalidez_vida_bp + cesantia_vejez_bp;
    
    RETURN QUERY SELECT 
        enfermedad_maternidad_bp,
        invalidez_vida_bp,
        cesantia_vejez_bp,
        total_imss_trabajador_bp;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Ejemplo de uso:
-- SELECT * FROM calcular_imss_trabajador(pesos_to_bp(800), 2025);

COMMENT ON FUNCTION calcular_imss_trabajador IS 'Calcula todas las cuotas IMSS del trabajador: Enfermedad y Maternidad, Invalidez y Vida, Cesantía y Vejez';

-- =====================================================
-- 6. FUNCIÓN: CALCULAR CUOTAS IMSS PATRÓN
-- =====================================================

CREATE OR REPLACE FUNCTION calcular_imss_patron(
    p_sbc_bp BIGINT,
    p_prima_riesgo_bp INTEGER,
    p_anio INTEGER
) RETURNS TABLE(
    enfermedad_maternidad_bp BIGINT,
    invalidez_vida_bp BIGINT,
    riesgos_trabajo_bp BIGINT,
    guarderias_bp BIGINT,
    retiro_bp BIGINT,
    cesantia_vejez_bp BIGINT,
    infonavit_bp BIGINT,
    total_imss_patron_bp BIGINT
) AS $$
DECLARE
    v_uma_bp BIGINT;
    v_tres_umas_bp BIGINT;
    v_excedente_3uma_bp BIGINT;
    v_enf_mat_cuota_fija_bp BIGINT;
    v_enf_mat_excedente_bp BIGINT;
    v_enf_mat_dinero_bp BIGINT;
    v_enf_mat_pensionados_bp BIGINT;
    v_invalidez_vida_bp BIGINT;
    v_riesgos_trabajo_bp BIGINT;
    v_guarderias_bp BIGINT;
    v_retiro_bp BIGINT;
    v_cesantia_vejez_bp BIGINT;
    v_infonavit_bp BIGINT;
    v_total_bp BIGINT;
BEGIN
    -- Obtener UMA
    SELECT uma_bp INTO v_uma_bp
    FROM cat_imss_config
    WHERE anio = p_anio;
    
    IF NOT FOUND THEN
        v_uma_bp := 1138300; -- Default 2025
    END IF;
    
    v_tres_umas_bp := v_uma_bp * 3;
    
    -- Calcular excedente de 3 UMAs
    IF p_sbc_bp > v_tres_umas_bp THEN
        v_excedente_3uma_bp := p_sbc_bp - v_tres_umas_bp;
    ELSE
        v_excedente_3uma_bp := 0;
    END IF;
    
    -- Enfermedad y Maternidad
    -- 1. Cuota Fija: 20.40% de 1 UMA
    v_enf_mat_cuota_fija_bp := (v_uma_bp * 2040) / 10000;
    
    -- 2. Excedente 3 UMAs: 1.10%
    v_enf_mat_excedente_bp := (v_excedente_3uma_bp * 110) / 10000;
    
    -- 3. Prestaciones en Dinero: 0.70%
    v_enf_mat_dinero_bp := (p_sbc_bp * 70) / 10000;
    
    -- 4. Gastos Médicos Pensionados: 1.05%
    v_enf_mat_pensionados_bp := (p_sbc_bp * 105) / 10000;
    
    enfermedad_maternidad_bp := v_enf_mat_cuota_fija_bp + v_enf_mat_excedente_bp + 
                                v_enf_mat_dinero_bp + v_enf_mat_pensionados_bp;
    
    -- Invalidez y Vida: 1.75%
    invalidez_vida_bp := (p_sbc_bp * 175) / 10000;
    
    -- Riesgos de Trabajo: Prima variable (default 5.432%)
    riesgos_trabajo_bp := (p_sbc_bp * p_prima_riesgo_bp) / 10000;
    
    -- Guarderías: 1.00%
    guarderias_bp := (p_sbc_bp * 100) / 10000;
    
    -- Retiro: 2.00%
    retiro_bp := (p_sbc_bp * 200) / 10000;
    
    -- Cesantía y Vejez: 3.15%
    cesantia_vejez_bp := (p_sbc_bp * 315) / 10000;
    
    -- INFONAVIT: 5.00%
    infonavit_bp := (p_sbc_bp * 500) / 10000;
    
    -- Total
    total_imss_patron_bp := enfermedad_maternidad_bp + invalidez_vida_bp + riesgos_trabajo_bp +
                           guarderias_bp + retiro_bp + cesantia_vejez_bp + infonavit_bp;
    
    RETURN QUERY SELECT 
        enfermedad_maternidad_bp,
        invalidez_vida_bp,
        riesgos_trabajo_bp,
        guarderias_bp,
        retiro_bp,
        cesantia_vejez_bp,
        infonavit_bp,
        total_imss_patron_bp;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Ejemplo de uso:
-- SELECT * FROM calcular_imss_patron(pesos_to_bp(800), 54320, 2025);

COMMENT ON FUNCTION calcular_imss_patron IS 'Calcula todas las cuotas IMSS patronales incluyendo INFONAVIT';

-- =====================================================
-- 7. FUNCIÓN: CALCULAR DESCUENTO INFONAVIT
-- =====================================================

CREATE OR REPLACE FUNCTION calcular_descuento_infonavit(
    p_tipo_descuento VARCHAR(20),
    p_valor_descuento_bp BIGINT,
    p_sbc_bp BIGINT,
    p_anio INTEGER
) RETURNS BIGINT AS $$
DECLARE
    v_salario_minimo_bp BIGINT;
    v_descuento_bp BIGINT;
BEGIN
    -- Obtener salario mínimo
    SELECT salario_minimo_bp INTO v_salario_minimo_bp
    FROM cat_imss_config
    WHERE anio = p_anio;
    
    IF NOT FOUND THEN
        v_salario_minimo_bp := 2486400; -- Default 2025: $248.64
    END IF;
    
    -- Calcular según tipo de descuento
    CASE p_tipo_descuento
        WHEN 'cuota_fija' THEN
            -- Cuota fija en pesos
            v_descuento_bp := p_valor_descuento_bp;
            
        WHEN 'vsm' THEN
            -- Veces salario mínimo (VSM)
            -- p_valor_descuento_bp contiene el factor * 10000
            v_descuento_bp := (v_salario_minimo_bp * p_valor_descuento_bp) / 10000;
            
        WHEN 'porcentaje' THEN
            -- Porcentaje del SBC
            v_descuento_bp := (p_sbc_bp * p_valor_descuento_bp) / 10000;
            
        ELSE
            v_descuento_bp := 0;
    END CASE;
    
    RETURN v_descuento_bp;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Ejemplo de uso:
-- Cuota fija de $500:
-- SELECT bp_to_pesos(calcular_descuento_infonavit('cuota_fija', pesos_to_bp(500), pesos_to_bp(800), 2025));
-- 
-- 2 VSM:
-- SELECT bp_to_pesos(calcular_descuento_infonavit('vsm', pesos_to_bp(2), pesos_to_bp(800), 2025));
--
-- 10% del SBC:
-- SELECT bp_to_pesos(calcular_descuento_infonavit('porcentaje', porcentaje_to_bp(10), pesos_to_bp(800), 2025));

COMMENT ON FUNCTION calcular_descuento_infonavit IS 'Calcula descuento de crédito INFONAVIT según tipo: cuota_fija, vsm (veces salario mínimo) o porcentaje';

-- =====================================================
-- 8. FUNCIÓN: CALCULAR HORAS EXTRA
-- =====================================================

CREATE OR REPLACE FUNCTION calcular_horas_extra(
    p_sueldo_base_bp BIGINT,
    p_dias_mes INTEGER,
    p_horas_jornada INTEGER,
    p_horas_extra_dobles NUMERIC,
    p_horas_extra_triples NUMERIC
) RETURNS TABLE(
    pago_horas_dobles_bp BIGINT,
    pago_horas_triples_bp BIGINT,
    total_horas_extra_bp BIGINT
) AS $$
DECLARE
    v_valor_hora_bp BIGINT;
    v_pago_dobles_bp BIGINT;
    v_pago_triples_bp BIGINT;
    v_total_bp BIGINT;
BEGIN
    -- Calcular valor de la hora ordinaria
    v_valor_hora_bp := p_sueldo_base_bp / p_dias_mes / p_horas_jornada;
    
    -- Horas extra dobles (primeras 9 horas semanales): pagan al 200%
    v_pago_dobles_bp := (v_valor_hora_bp * 2 * p_horas_extra_dobles)::BIGINT;
    
    -- Horas extra triples (después de 9 horas semanales): pagan al 300%
    v_pago_triples_bp := (v_valor_hora_bp * 3 * p_horas_extra_triples)::BIGINT;
    
    v_total_bp := v_pago_dobles_bp + v_pago_triples_bp;
    
    RETURN QUERY SELECT 
        v_pago_dobles_bp,
        v_pago_triples_bp,
        v_total_bp;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Ejemplo de uso:
-- SELECT * FROM calcular_horas_extra(pesos_to_bp(15000), 30, 8, 5, 2);

COMMENT ON FUNCTION calcular_horas_extra IS 'Calcula pago de horas extra dobles y triples según LFT';

-- =====================================================
-- 9. FUNCIÓN: CALCULAR AGUINALDO
-- =====================================================

CREATE OR REPLACE FUNCTION calcular_aguinaldo(
    p_sueldo_diario_bp BIGINT,
    p_dias_aguinaldo INTEGER,
    p_dias_trabajados_anio INTEGER,
    p_proporcional BOOLEAN DEFAULT true
) RETURNS TABLE(
    aguinaldo_total_bp BIGINT,
    aguinaldo_exento_bp BIGINT,
    aguinaldo_gravado_bp BIGINT
) AS $$
DECLARE
    v_aguinaldo_bp BIGINT;
    v_uma_bp BIGINT;
    v_limite_exento_bp BIGINT;
    v_exento_bp BIGINT;
    v_gravado_bp BIGINT;
BEGIN
    -- Calcular aguinaldo
    IF p_proporcional THEN
        v_aguinaldo_bp := (p_sueldo_diario_bp * p_dias_aguinaldo * p_dias_trabajados_anio / 365)::BIGINT;
    ELSE
        v_aguinaldo_bp := (p_sueldo_diario_bp * p_dias_aguinaldo)::BIGINT;
    END IF;
    
    -- Obtener UMA para límite de exención (30 UMAs)
    SELECT uma_bp * 30 INTO v_limite_exento_bp
    FROM cat_imss_config
    WHERE anio = EXTRACT(YEAR FROM CURRENT_DATE);
    
    IF NOT FOUND THEN
        v_limite_exento_bp := 1138300 * 30; -- Default 2025
    END IF;
    
    -- Determinar parte exenta y gravada
    IF v_aguinaldo_bp <= v_limite_exento_bp THEN
        v_exento_bp := v_aguinaldo_bp;
        v_gravado_bp := 0;
    ELSE
        v_exento_bp := v_limite_exento_bp;
        v_gravado_bp := v_aguinaldo_bp - v_limite_exento_bp;
    END IF;
    
    RETURN QUERY SELECT 
        v_aguinaldo_bp,
        v_exento_bp,
        v_gravado_bp;
END;
$$ LANGUAGE plpgsql;

-- Ejemplo de uso:
-- SELECT * FROM calcular_aguinaldo(pesos_to_bp(500), 15, 365, false);

COMMENT ON FUNCTION calcular_aguinaldo IS 'Calcula aguinaldo con separación de parte exenta (30 UMAs) y gravada';

-- =====================================================
-- 10. FUNCIÓN: CALCULAR PRIMA VACACIONAL
-- =====================================================

CREATE OR REPLACE FUNCTION calcular_prima_vacacional(
    p_sueldo_diario_bp BIGINT,
    p_dias_vacaciones INTEGER,
    p_porcentaje_prima NUMERIC DEFAULT 0.25
) RETURNS TABLE(
    prima_vacacional_total_bp BIGINT,
    prima_vacacional_exenta_bp BIGINT,
    prima_vacacional_gravada_bp BIGINT
) AS $$
DECLARE
    v_prima_bp BIGINT;
    v_uma_bp BIGINT;
    v_limite_exento_bp BIGINT;
    v_exento_bp BIGINT;
    v_gravado_bp BIGINT;
BEGIN
    -- Calcular prima vacacional (25% de días de vacaciones)
    v_prima_bp := (p_sueldo_diario_bp * p_dias_vacaciones * p_porcentaje_prima)::BIGINT;
    
    -- Obtener UMA para límite de exención (15 UMAs)
    SELECT uma_bp * 15 INTO v_limite_exento_bp
    FROM cat_imss_config
    WHERE anio = EXTRACT(YEAR FROM CURRENT_DATE);
    
    IF NOT FOUND THEN
        v_limite_exento_bp := 1138300 * 15; -- Default 2025
    END IF;
    
    -- Determinar parte exenta y gravada
    IF v_prima_bp <= v_limite_exento_bp THEN
        v_exento_bp := v_prima_bp;
        v_gravado_bp := 0;
    ELSE
        v_exento_bp := v_limite_exento_bp;
        v_gravado_bp := v_prima_bp - v_limite_exento_bp;
    END IF;
    
    RETURN QUERY SELECT 
        v_prima_bp,
        v_exento_bp,
        v_gravado_bp;
END;
$$ LANGUAGE plpgsql;

-- Ejemplo de uso:
-- SELECT * FROM calcular_prima_vacacional(pesos_to_bp(500), 6, 0.25);

COMMENT ON FUNCTION calcular_prima_vacacional IS 'Calcula prima vacacional con separación de parte exenta (15 UMAs) y gravada';

-- =====================================================
-- 11. FUNCIÓN MAESTRA: CALCULAR NÓMINA COMPLETA
-- =====================================================

CREATE OR REPLACE FUNCTION calcular_nomina_empleado(
    p_empleado_id VARCHAR(50),
    p_periodo_id VARCHAR(50)
) RETURNS TABLE(
    empleado_id VARCHAR(50),
    periodo_id VARCHAR(50),
    percepciones_gravadas_bp BIGINT,
    percepciones_exentas_bp BIGINT,
    total_percepciones_bp BIGINT,
    isr_causado_bp BIGINT,
    subsidio_aplicado_bp BIGINT,
    subsidio_entregable_bp BIGINT,
    isr_retenido_bp BIGINT,
    imss_trabajador_bp BIGINT,
    total_deducciones_bp BIGINT,
    neto_pagar_bp BIGINT
) AS $$
DECLARE
    v_percepciones_gravadas_bp BIGINT;
    v_percepciones_exentas_bp BIGINT;
    v_total_percepciones_bp BIGINT;
    v_isr_causado_bp BIGINT;
    v_subsidio RECORD;
    v_imss_trabajador RECORD;
    v_total_deducciones_bp BIGINT;
    v_neto_pagar_bp BIGINT;
    v_periodo_tipo VARCHAR(20);
    v_anio INTEGER;
    v_sbc_bp BIGINT;
BEGIN
    -- Obtener tipo de período y año
    SELECT tipo_periodo, anio INTO v_periodo_tipo, v_anio
    FROM periodos_nomina
    WHERE id = p_periodo_id;
    
    -- Obtener SBC del empleado
    SELECT sbc_bp INTO v_sbc_bp
    FROM empleados
    WHERE id = p_empleado_id;
    
    -- Calcular percepciones
    SELECT 
        COALESCE(SUM(CASE WHEN importe_gravado_bp > 0 THEN importe_gravado_bp ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN importe_exento_bp > 0 THEN importe_exento_bp ELSE 0 END), 0),
        COALESCE(SUM(importe_total_bp), 0)
    INTO v_percepciones_gravadas_bp, v_percepciones_exentas_bp, v_total_percepciones_bp
    FROM nomina_movimientos
    WHERE empleado_id = p_empleado_id
        AND periodo_id = p_periodo_id
        AND tipo = 'percepcion';
    
    -- Calcular ISR
    v_isr_causado_bp := calcular_isr(v_percepciones_gravadas_bp, v_periodo_tipo, v_anio);
    
    -- Calcular subsidio al empleo
    SELECT * INTO v_subsidio
    FROM calcular_subsidio_empleo(v_percepciones_gravadas_bp, v_isr_causado_bp, v_periodo_tipo, v_anio);
    
    -- Calcular IMSS trabajador
    SELECT total_imss_trabajador_bp INTO v_imss_trabajador
    FROM calcular_imss_trabajador(v_sbc_bp, v_anio);
    
    -- Calcular deducciones (sin ISR ni IMSS que ya calculamos)
    SELECT COALESCE(SUM(importe_total_bp), 0)
    INTO v_total_deducciones_bp
    FROM nomina_movimientos
    WHERE empleado_id = p_empleado_id
        AND periodo_id = p_periodo_id
        AND tipo = 'deduccion'
        AND concepto_id NOT IN (
            SELECT id FROM conceptos_nomina WHERE codigo IN ('D001', 'D002')
        );
    
    -- Sumar ISR y IMSS a deducciones
    v_total_deducciones_bp := v_total_deducciones_bp + v_subsidio.isr_a_retener_bp + v_imss_trabajador.total_imss_trabajador_bp;
    
    -- Calcular neto a pagar
    v_neto_pagar_bp := v_total_percepciones_bp + v_subsidio.subsidio_entregable_bp - v_total_deducciones_bp;
    
    RETURN QUERY SELECT 
        p_empleado_id,
        p_periodo_id,
        v_percepciones_gravadas_bp,
        v_percepciones_exentas_bp,
        v_total_percepciones_bp,
        v_isr_causado_bp,
        v_subsidio.subsidio_aplicado_credito_bp,
        v_subsidio.subsidio_entregable_bp,
        v_subsidio.isr_a_retener_bp,
        v_imss_trabajador.total_imss_trabajador_bp,
        v_total_deducciones_bp,
        v_neto_pagar_bp;
END;
$$ LANGUAGE plpgsql;

-- Ejemplo de uso:
-- SELECT * FROM calcular_nomina_empleado('emp-123', 'periodo-456');

COMMENT ON FUNCTION calcular_nomina_empleado IS 'Función maestra que calcula toda la nómina de un empleado: percepciones, ISR, subsidio, IMSS y neto';

-- =====================================================
-- 12. FUNCIÓN: VALIDAR CÁLCULO DE NÓMINA
-- =====================================================

CREATE OR REPLACE FUNCTION validar_nomina_empleado(
    p_empleado_id VARCHAR(50),
    p_periodo_id VARCHAR(50)
) RETURNS TABLE(
    validacion_ok BOOLEAN,
    errores TEXT[]
) AS $$
DECLARE
    v_errores TEXT[] := ARRAY[]::TEXT[];
    v_tiene_percepciones BOOLEAN;
    v_tiene_deducciones BOOLEAN;
    v_neto_pagar_bp BIGINT;
BEGIN
    -- Verificar que tenga al menos una percepción
    SELECT COUNT(*) > 0 INTO v_tiene_percepciones
    FROM nomina_movimientos
    WHERE empleado_id = p_empleado_id
        AND periodo_id = p_periodo_id
        AND tipo = 'percepcion';
    
    IF NOT v_tiene_percepciones THEN
        v_errores := array_append(v_errores, 'El empleado no tiene percepciones registradas');
    END IF;
    
    -- Verificar que tenga deducciones obligatorias (ISR, IMSS)
    SELECT COUNT(*) > 0 INTO v_tiene_deducciones
    FROM nomina_movimientos
    WHERE empleado_id = p_empleado_id
        AND periodo_id = p_periodo_id
        AND tipo = 'deduccion'
        AND concepto_id IN (
            SELECT id FROM conceptos_nomina WHERE codigo IN ('D001', 'D002')
        );
    
    IF NOT v_tiene_deducciones THEN
        v_errores := array_append(v_errores, 'Faltan deducciones obligatorias (ISR o IMSS)');
    END IF;
    
    -- Verificar que el neto sea positivo
    SELECT neto_pagar_bp INTO v_neto_pagar_bp
    FROM nomina_resumen_empleado
    WHERE empleado_id = p_empleado_id
        AND periodo_id = p_periodo_id;
    
    IF v_neto_pagar_bp IS NOT NULL AND v_neto_pagar_bp <= 0 THEN
        v_errores := array_append(v_errores, 'El neto a pagar es cero o negativo');
    END IF;
    
    -- Retornar resultado
    RETURN QUERY SELECT 
        (array_length(v_errores, 1) IS NULL OR array_length(v_errores, 1) = 0),
        v_errores;
END;
$$ LANGUAGE plpgsql;

-- Ejemplo de uso:
-- SELECT * FROM validar_nomina_empleado('emp-123', 'periodo-456');

COMMENT ON FUNCTION validar_nomina_empleado IS 'Valida que el cálculo de nómina de un empleado esté completo y correcto';

-- =====================================================
-- EJEMPLOS DE USO COMPLETO
-- =====================================================

/*
-- Ejemplo 1: Calcular ISR de un sueldo mensual de $15,000
SELECT 
    15000.00 as sueldo_mensual,
    bp_to_pesos(calcular_isr(pesos_to_bp(15000), 'mensual', 2025)) as isr_mensual;

-- Ejemplo 2: Calcular SDI y SBC
SELECT 
    500.00 as sueldo_diario,
    bp_to_pesos(calcular_sdi(pesos_to_bp(500), 15, 6, 0.25)) as sdi,
    bp_to_pesos(calcular_sbc(calcular_sdi(pesos_to_bp(500), 15, 6, 0.25), 2025)) as sbc;

-- Ejemplo 3: Calcular IMSS completo
SELECT 
    800.00 as sbc,
    bp_to_pesos(enfermedad_maternidad_bp) as enf_mat,
    bp_to_pesos(invalidez_vida_bp) as inv_vida,
    bp_to_pesos(cesantia_vejez_bp) as ces_vejez,
    bp_to_pesos(total_imss_trabajador_bp) as total_imss
FROM calcular_imss_trabajador(pesos_to_bp(800), 2025);

-- Ejemplo 4: Calcular aguinaldo con exención
SELECT 
    bp_to_pesos(aguinaldo_total_bp) as total,
    bp_to_pesos(aguinaldo_exento_bp) as exento,
    bp_to_pesos(aguinaldo_gravado_bp) as gravado
FROM calcular_aguinaldo(pesos_to_bp(500), 15, 365, false);

-- Ejemplo 5: Calcular horas extra
SELECT 
    bp_to_pesos(pago_horas_dobles_bp) as dobles,
    bp_to_pesos(pago_horas_triples_bp) as triples,
    bp_to_pesos(total_horas_extra_bp) as total
FROM calcular_horas_extra(pesos_to_bp(15000), 30, 8, 5, 2);
*/
