-- =====================================================
-- SISTEMA DE NÓMINA SUPERIOR A NOI
-- Diseñado para México con CFDI 4.0, ISR, IMSS, Subsidio
-- =====================================================

-- =====================================================
-- 1. CATÁLOGOS SAT (Compliance CFDI 4.0)
-- =====================================================

-- Tabla: Tipos de Percepción SAT
CREATE TABLE cat_sat_tipos_percepcion (
    clave VARCHAR(10) PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    gravado BOOLEAN NOT NULL DEFAULT true,
    integra_sdi BOOLEAN NOT NULL DEFAULT true, -- ¿Integra para IMSS?
    es_imss BOOLEAN NOT NULL DEFAULT false, -- ¿Es pago de IMSS?
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Insertar catálogo oficial SAT de percepciones
INSERT INTO cat_sat_tipos_percepcion (clave, nombre, gravado, integra_sdi) VALUES
('001', 'Sueldos, Salarios, Rayas y Jornales', true, true),
('002', 'Gratificación Anual (Aguinaldo)', true, true),
('003', 'Participación de los Trabajadores en las Utilidades (PTU)', true, false),
('004', 'Reembolso de Gastos Médicos, Dentales y Hospitalarios', false, false),
('005', 'Fondo de Ahorro', false, false),
('006', 'Caja de Ahorro', false, false),
('009', 'Contribuciones a Cargo del Trabajador Pagadas por el Patrón', false, false),
('010', 'Premios por Puntualidad', true, true),
('011', 'Prima de Seguro de Vida', false, false),
('012', 'Seguro de Gastos Médicos Mayores', false, false),
('013', 'Cuotas Sindicales Pagadas por el Patrón', false, false),
('014', 'Subsidios por Incapacidad', true, false),
('015', 'Becas para Trabajadores y/o Hijos', false, false),
('019', 'Horas Extra', true, true),
('020', 'Prima Dominical', true, true),
('021', 'Prima Vacacional', true, true),
('022', 'Prima por Antigüedad', true, false),
('023', 'Pagos por Separación', true, false),
('024', 'Seguro de Retiro', false, false),
('025', 'Indemnizaciones', false, false),
('028', 'Subsidio para el Empleo (Efectivamente Entregado)', true, false),
('029', 'Subsidio para el Empleo (Aplicado a Crédito de Nómina)', true, false),
('038', 'Vales de Despensa', false, false),
('039', 'Vales de Restaurante', false, false),
('044', 'Jubilaciones, Pensiones o Haberes de Retiro', true, false),
('045', 'Ingresos en Acciones o Títulos Valor', true, false),
('046', 'Ingresos Asimilados a Salarios', true, false),
('047', 'Alimentación Diferente a Vales', false, false),
('048', 'Habitación', false, false),
('049', 'Premios por Asistencia', true, true),
('050', 'Viáticos', false, false);

-- Tabla: Tipos de Deducción SAT
CREATE TABLE cat_sat_tipos_deduccion (
    clave VARCHAR(10) PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    es_obligatoria BOOLEAN NOT NULL DEFAULT false,
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Insertar catálogo oficial SAT de deducciones
INSERT INTO cat_sat_tipos_deduccion (clave, nombre, es_obligatoria) VALUES
('001', 'Seguridad Social', true),
('002', 'ISR', true),
('003', 'Aportaciones a Retiro, Cesantía en Edad Avanzada y Vejez', false),
('004', 'Otros', false),
('005', 'Aportaciones a Fondo de Vivienda', true),
('006', 'Descuento por Incapacidad', true),
('007', 'Pensión Alimenticia', true),
('008', 'Renta', false),
('009', 'Préstamos Provenientes del Fondo Nacional de la Vivienda para los Trabajadores', false),
('010', 'Pago por Crédito de Vivienda', false),
('011', 'Pago de Abonos INFONACOT', false),
('012', 'Anticipo de Salarios', false),
('013', 'Pagos Hechos con Exceso al Trabajador', false),
('014', 'Errores', false),
('015', 'Pérdidas', false),
('016', 'Averías', false),
('017', 'Adquisición de Artículos Producidos por la Empresa', false),
('018', 'Cuotas para la Constitución y Fomento de Sociedades Cooperativas', false),
('019', 'Cuotas Sindicales', false),
('020', 'Ausencia (Ausentismo)', false),
('021', 'Cuotas Obrero Patronales', false),
('022', 'Impuestos Locales', false),
('023', 'Aportaciones Voluntarias', false),
('024', 'Ajuste en Gratificación Anual (Aguinaldo) Exento', false),
('025', 'Ajuste en Gratificación Anual (Aguinaldo) Gravado', false),
('026', 'Ajuste en Participación de los Trabajadores en las Utilidades PTU Exento', false),
('027', 'Ajuste en Participación de los Trabajadores en las Utilidades PTU Gravado', false),
('028', 'Ajuste en Reembolso de Gastos Médicos Dentales y Hospitalarios Exento', false),
('029', 'Ajuste en Fondo de Ahorro Exento', false),
('030', 'Ajuste en Caja de Ahorro Exento', false),
('031', 'Ajuste en Contribuciones a Cargo del Trabajador Pagadas por el Patrón Exento', false),
('032', 'Ajuste en Premios por Puntualidad Gravado', false),
('033', 'Ajuste en Prima de Seguro de Vida Exento', false),
('034', 'Ajuste en Seguro de Gastos Médicos Mayores Exento', false),
('035', 'Ajuste en Cuotas Sindicales Pagadas por el Patrón Exento', false),
('036', 'Ajuste en Subsidios por Incapacidad Gravado', false),
('037', 'Ajuste en Becas para Trabajadores y/o Hijos Exento', false),
('038', 'Ajuste en Horas Extra Gravado', false),
('039', 'Ajuste en Prima Dominical Gravado', false),
('040', 'Ajuste en Prima Vacacional Gravado', false),
('041', 'Ajuste en Prima por Antigüedad Gravado', false),
('042', 'Ajuste en Pagos por Separación Gravado', false),
('043', 'Ajuste en Seguro de Retiro Exento', false),
('044', 'Ajuste en Indemnizaciones Exento', false),
('045', 'Ajuste en Reembolso por Funeral Exento', false),
('046', 'Ajuste en Cuotas de Seguridad Social Pagadas por el Patrón Exento', false),
('047', 'Ajuste en Comisiones Gravado', false),
('048', 'Ajuste en Vales de Despensa Exento', false),
('049', 'Ajuste en Vales de Restaurante Exento', false),
('050', 'Ajuste en Vales de Gasolina Exento', false),
('051', 'Ajuste en Vales de Ropa Exento', false),
('052', 'Ajuste en Ayuda para Renta Exento', false),
('053', 'Ajuste en Ayuda para Artículos Escolares Exento', false),
('054', 'Ajuste en Ayuda para Anteojos Exento', false),
('055', 'Ajuste en Ayuda para Transporte Exento', false),
('056', 'Ajuste en Ayuda para Gastos de Funeral Exento', false),
('057', 'Ajuste en Otros Ingresos por Salarios Exento', false),
('058', 'Ajuste en Otros Ingresos por Salarios Gravado', false),
('059', 'Ajuste en Jubilaciones, Pensiones o Haberes de Retiro en Parcialidades Exento', false),
('060', 'Ajuste en Jubilaciones, Pensiones o Haberes de Retiro en Parcialidades Gravado', false),
('061', 'Ajuste en Jubilaciones, Pensiones o Haberes de Retiro en una Sola Exhibición Exento', false),
('062', 'Ajuste en Jubilaciones, Pensiones o Haberes de Retiro en una Sola Exhibición Gravado', false),
('063', 'Ajuste en Indemnizaciones por Separación Exento', false),
('064', 'Ajuste en Indemnizaciones por Separación Gravado', false),
('107', 'Ajuste en Subsidio para el Empleo (Efectivamente Entregado)', false),
('108', 'Ajuste en Subsidio para el Empleo (Aplicado a Crédito de Nómina)', false);

-- Tabla: Tipos de Otro Pago SAT
CREATE TABLE cat_sat_tipos_otro_pago (
    clave VARCHAR(10) PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

INSERT INTO cat_sat_tipos_otro_pago (clave, nombre) VALUES
('001', 'Reintegro de ISR Pagado en Exceso (Siempre que no haya sido enterado al SAT)'),
('002', 'Subsidio para el Empleo (Efectivamente Entregado al Trabajador)'),
('003', 'Viáticos'),
('004', 'Aplicación de Saldo a Favor por Compensación Anual'),
('005', 'Reintegro de ISR Retenido en Exceso de Ejercicio Anterior (Siempre que no haya sido enterado al SAT)'),
('999', 'Pagos Distintos a los Listados');

-- =====================================================
-- 2. TABLAS FISCALES ISR (Usando Basis Points para precisión)
-- =====================================================

-- Tabla: ISR Tarifas (Basis Points para máxima precisión)
CREATE TABLE cat_isr_tarifas (
    id VARCHAR(50) PRIMARY KEY DEFAULT gen_random_uuid(),
    anio INTEGER NOT NULL,
    periodo VARCHAR(20) NOT NULL, -- 'mensual', 'quincenal', 'semanal', 'diario'
    limite_inferior_bp BIGINT NOT NULL, -- En basis points (1 peso = 10,000 bp)
    limite_superior_bp BIGINT, -- NULL para último rango
    cuota_fija_bp BIGINT NOT NULL,
    tasa_excedente_bp INTEGER NOT NULL, -- Tasa en basis points (10% = 1000 bp)
    orden INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(anio, periodo, orden)
);

-- Insertar tabla ISR 2025 MENSUAL (Artículo 96 LISR)
INSERT INTO cat_isr_tarifas (anio, periodo, limite_inferior_bp, limite_superior_bp, cuota_fija_bp, tasa_excedente_bp, orden) VALUES
(2025, 'mensual', 0, 6449900, 0, 192, 1), -- $0.00 - $644.99, Cuota: $0.00, Tasa: 1.92%
(2025, 'mensual', 6450000, 54687400, 123900, 640, 2), -- $645.00 - $5,468.74
(2025, 'mensual', 54687500, 96157800, 3318200, 1088, 3), -- $5,468.75 - $9,615.78
(2025, 'mensual', 96157900, 112020299, 7829100, 1600, 4), -- $9,615.79 - $11,202.03
(2025, 'mensual', 112020300, 133536399, 10367400, 1792, 5), -- $11,202.03 - $13,353.64
(2025, 'mensual', 133536400, 250735199, 14217600, 2136, 6), -- $13,353.64 - $25,073.52
(2025, 'mensual', 250735200, 375110399, 39259000, 2352, 7), -- $25,073.52 - $37,511.04
(2025, 'mensual', 375110400, 500147499, 68518300, 3000, 8), -- $37,511.04 - $50,014.75
(2025, 'mensual', 500147500, 750221299, 105999600, 3200, 9), -- $50,014.75 - $75,022.13
(2025, 'mensual', 750221300, 10000000000, 186023200, 3400, 10), -- $75,022.13 - En adelante
-- Último rango sin límite superior

-- Tabla: Subsidio al Empleo (Basis Points)
CREATE TABLE cat_subsidio_empleo (
    id VARCHAR(50) PRIMARY KEY DEFAULT gen_random_uuid(),
    anio INTEGER NOT NULL,
    periodo VARCHAR(20) NOT NULL,
    limite_inferior_bp BIGINT NOT NULL,
    limite_superior_bp BIGINT,
    subsidio_bp BIGINT NOT NULL, -- Subsidio en basis points
    orden INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(anio, periodo, orden)
);

-- Insertar tabla Subsidio al Empleo 2025 MENSUAL
INSERT INTO cat_subsidio_empleo (anio, periodo, limite_inferior_bp, limite_superior_bp, subsidio_bp, orden) VALUES
(2025, 'mensual', 0, 18000000, 4078800, 1), -- $0.01 - $1,800.00, Subsidio: $407.88
(2025, 'mensual', 18000100, 19500000, 4078200, 2), -- $1,800.01 - $1,950.00
(2025, 'mensual', 19500100, 34500000, 3897600, 3), -- $1,950.01 - $3,450.00
(2025, 'mensual', 34500100, 39500000, 3880200, 4), -- $3,450.01 - $3,950.00
(2025, 'mensual', 39500100, 49000000, 3483600, 5), -- $3,950.01 - $4,900.00
(2025, 'mensual', 49000100, 59000000, 3204600, 6), -- $4,900.01 - $5,900.00
(2025, 'mensual', 59000100, 77000000, 2926200, 7), -- $5,900.01 - $7,700.00
(2025, 'mensual', 77000100, 10000000000, 0, 8); -- $7,700.01 - En adelante

-- =====================================================
-- 3. TABLAS IMSS (Cuotas Obrero-Patronales)
-- =====================================================

-- Tabla: Configuración IMSS por Año
CREATE TABLE cat_imss_config (
    id VARCHAR(50) PRIMARY KEY DEFAULT gen_random_uuid(),
    anio INTEGER NOT NULL UNIQUE,
    uma_bp BIGINT NOT NULL, -- UMA en basis points
    salario_minimo_bp BIGINT NOT NULL, -- Salario mínimo en basis points
    limite_superior_cotizacion_uma INTEGER NOT NULL DEFAULT 25, -- 25 UMAs
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Configuración IMSS 2025
INSERT INTO cat_imss_config (anio, uma_bp, salario_minimo_bp, limite_superior_cotizacion_uma) VALUES
(2025, 1138300, 2486400, 25); -- UMA: $113.83, SM: $248.64

-- Tabla: Cuotas IMSS (Ramos de Seguro)
CREATE TABLE cat_imss_cuotas (
    id VARCHAR(50) PRIMARY KEY DEFAULT gen_random_uuid(),
    anio INTEGER NOT NULL,
    ramo VARCHAR(100) NOT NULL,
    concepto VARCHAR(255) NOT NULL,
    patron_tasa_bp INTEGER, -- Tasa patrón en basis points (5.5% = 550 bp)
    trabajador_tasa_bp INTEGER, -- Tasa trabajador en basis points
    patron_cuota_fija_bp BIGINT, -- Cuota fija patrón en bp
    trabajador_cuota_fija_bp BIGINT, -- Cuota fija trabajador en bp
    base_calculo VARCHAR(50), -- 'sbc', 'uma', 'excedente_3uma'
    aplica_limite_superior BOOLEAN DEFAULT true,
    notas TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(anio, ramo, concepto)
);

-- Insertar cuotas IMSS 2025
INSERT INTO cat_imss_cuotas (anio, ramo, concepto, patron_tasa_bp, trabajador_tasa_bp, patron_cuota_fija_bp, trabajador_cuota_fija_bp, base_calculo, aplica_limite_superior, notas) VALUES
-- Enfermedad y Maternidad
(2025, 'enfermedad_maternidad', 'Cuota Fija', 20400, 0, NULL, NULL, 'uma', false, 'Patrón 20.40% de 1 UMA'),
(2025, 'enfermedad_maternidad', 'Excedente 3 UMAs', 110, 40, NULL, NULL, 'excedente_3uma', true, 'Patrón 1.10%, Trabajador 0.40% sobre excedente de 3 UMAs'),
(2025, 'enfermedad_maternidad', 'Prestaciones en Dinero', 70, 25, NULL, NULL, 'sbc', true, 'Patrón 0.70%, Trabajador 0.25%'),
(2025, 'enfermedad_maternidad', 'Gastos Médicos Pensionados', 105, 38, NULL, NULL, 'sbc', true, 'Patrón 1.05%, Trabajador 0.38%'),
-- Invalidez y Vida
(2025, 'invalidez_vida', 'Invalidez y Vida', 175, 63, NULL, NULL, 'sbc', true, 'Patrón 1.75%, Trabajador 0.63%'),
-- Riesgos de Trabajo
(2025, 'riesgos_trabajo', 'Riesgos de Trabajo', 54320, 0, NULL, NULL, 'sbc', true, 'Prima media nacional 5.432% (variable por empresa)'),
-- Guarderías y Prestaciones Sociales
(2025, 'guarderias', 'Guarderías y Prestaciones Sociales', 100, 0, NULL, NULL, 'sbc', true, 'Patrón 1.00%'),
-- Retiro, Cesantía y Vejez
(2025, 'retiro', 'Retiro', 200, 0, NULL, NULL, 'sbc', true, 'Patrón 2.00%'),
(2025, 'cesantia_vejez', 'Cesantía y Vejez', 315, 113, NULL, NULL, 'sbc', true, 'Patrón 3.15%, Trabajador 1.13%'),
-- INFONAVIT
(2025, 'infonavit', 'Aportación Infonavit', 500, 0, NULL, NULL, 'sbc', true, 'Patrón 5.00%');

-- =====================================================
-- 4. CONCEPTOS DE NÓMINA (Configurables con Fórmulas)
-- =====================================================

-- Tabla: Conceptos de Nómina
CREATE TABLE conceptos_nomina (
    id VARCHAR(50) PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id VARCHAR(50) NOT NULL,
    codigo VARCHAR(50) NOT NULL, -- Código interno único por cliente
    nombre VARCHAR(255) NOT NULL,
    tipo VARCHAR(20) NOT NULL, -- 'percepcion', 'deduccion', 'otro_pago'
    sat_clave VARCHAR(10), -- Referencia a catálogos SAT
    naturaleza VARCHAR(20) NOT NULL, -- 'ordinaria', 'extraordinaria', 'mixta'
    
    -- Configuración fiscal
    gravado BOOLEAN NOT NULL DEFAULT true,
    integra_sdi BOOLEAN NOT NULL DEFAULT true, -- ¿Integra Salario Diario Integrado?
    afecta_isr BOOLEAN NOT NULL DEFAULT true,
    afecta_imss BOOLEAN NOT NULL DEFAULT true,
    
    -- Fórmula de cálculo
    tipo_calculo VARCHAR(50) NOT NULL, -- 'fijo', 'variable', 'formula', 'porcentaje', 'dias', 'horas'
    formula TEXT, -- Fórmula JavaScript o SQL
    base_calculo VARCHAR(50), -- 'sueldo_base', 'sdi', 'percepciones_gravadas', etc.
    factor DECIMAL(18, 6), -- Factor multiplicador
    
    -- Prioridad de cálculo
    orden_calculo INTEGER NOT NULL DEFAULT 100,
    
    -- Configuración de display
    mostrar_recibo BOOLEAN NOT NULL DEFAULT true,
    etiqueta_recibo VARCHAR(255),
    grupo_recibo VARCHAR(50), -- Para agrupar en recibo
    
    -- Multi-tenancy y auditoría
    empresa_id VARCHAR(50),
    centro_trabajo_id VARCHAR(50),
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    CONSTRAINT fk_conceptos_cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id),
    CONSTRAINT unique_codigo_cliente UNIQUE (cliente_id, codigo)
);

-- Índices para performance
CREATE INDEX idx_conceptos_tipo ON conceptos_nomina(tipo);
CREATE INDEX idx_conceptos_orden ON conceptos_nomina(orden_calculo);
CREATE INDEX idx_conceptos_cliente ON conceptos_nomina(cliente_id);

-- Insertar conceptos estándar de nómina mexicana
INSERT INTO conceptos_nomina (cliente_id, codigo, nombre, tipo, sat_clave, tipo_calculo, formula, orden_calculo, gravado, integra_sdi, naturaleza) VALUES
-- PERCEPCIONES
('default', 'P001', 'Sueldo Base', 'percepcion', '001', 'formula', 'sueldo_base_mensual / dias_mes * dias_laborados', 10, true, true, 'ordinaria'),
('default', 'P002', 'Aguinaldo', 'percepcion', '002', 'formula', 'sueldo_diario * 15', 200, true, true, 'extraordinaria'),
('default', 'P003', 'Prima Vacacional', 'percepcion', '021', 'formula', 'sueldo_diario * dias_vacaciones * 0.25', 210, true, true, 'extraordinaria'),
('default', 'P004', 'Prima Dominical', 'percepcion', '020', 'formula', 'sueldo_diario * domingos_laborados * 0.25', 50, true, true, 'ordinaria'),
('default', 'P005', 'Horas Extra Dobles', 'percepcion', '019', 'formula', '(sueldo_base_mensual / dias_mes / horas_jornada) * horas_extra_dobles * 2', 60, true, true, 'ordinaria'),
('default', 'P006', 'Horas Extra Triples', 'percepcion', '019', 'formula', '(sueldo_base_mensual / dias_mes / horas_jornada) * horas_extra_triples * 3', 61, true, true, 'ordinaria'),
('default', 'P007', 'Bono de Puntualidad', 'percepcion', '010', 'formula', 'sueldo_base_mensual * 0.10', 70, true, true, 'ordinaria'),
('default', 'P008', 'Bono de Asistencia', 'percepcion', '049', 'formula', 'sueldo_base_mensual * 0.10', 71, true, true, 'ordinaria'),
('default', 'P009', 'Vales de Despensa', 'percepcion', '038', 'fijo', NULL, 80, false, false, 'ordinaria'),
('default', 'P010', 'Subsidio al Empleo', 'percepcion', '028', 'automatico', 'calcular_subsidio_empleo(isr_causado, sueldo_gravado)', 900, true, false, 'ordinaria'),

-- DEDUCCIONES
('default', 'D001', 'ISR', 'deduccion', '002', 'automatico', 'calcular_isr(percepciones_gravadas)', 1000, false, false, 'ordinaria'),
('default', 'D002', 'IMSS', 'deduccion', '001', 'automatico', 'calcular_imss_trabajador(sbc)', 1010, false, false, 'ordinaria'),
('default', 'D003', 'Infonavit', 'deduccion', '010', 'automatico', 'calcular_infonavit(sbc, tipo_descuento)', 1020, false, false, 'ordinaria'),
('default', 'D004', 'Faltas', 'deduccion', '020', 'formula', 'sueldo_diario * dias_falta', 20, false, false, 'ordinaria'),
('default', 'D005', 'Incapacidades', 'deduccion', '006', 'formula', 'sueldo_diario * dias_incapacidad * factor_incapacidad', 21, false, false, 'ordinaria'),
('default', 'D006', 'Préstamo Personal', 'deduccion', '004', 'variable', NULL, 500, false, false, 'ordinaria'),
('default', 'D007', 'Pensión Alimenticia', 'deduccion', '007', 'variable', NULL, 510, false, false, 'ordinaria'),
('default', 'D008', 'Crédito Infonavit', 'deduccion', '009', 'variable', NULL, 520, false, false, 'ordinaria'),
('default', 'D009', 'Fonacot', 'deduccion', '011', 'variable', NULL, 530, false, false, 'ordinaria');

-- =====================================================
-- 5. PERÍODOS DE NÓMINA
-- =====================================================

CREATE TABLE periodos_nomina (
    id VARCHAR(50) PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id VARCHAR(50) NOT NULL,
    empresa_id VARCHAR(50) NOT NULL,
    centro_trabajo_id VARCHAR(50),
    
    -- Información del período
    tipo_periodo VARCHAR(20) NOT NULL, -- 'semanal', 'quincenal', 'decenal', 'mensual'
    numero_periodo INTEGER NOT NULL,
    anio INTEGER NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    fecha_pago DATE NOT NULL,
    
    -- Días del período
    dias_periodo INTEGER NOT NULL,
    dias_laborales INTEGER NOT NULL,
    
    -- Estado del período
    estatus VARCHAR(20) NOT NULL DEFAULT 'abierto', -- 'abierto', 'calculado', 'autorizado', 'dispersado', 'timbrado', 'cerrado'
    fecha_calculo TIMESTAMP,
    fecha_autorizacion TIMESTAMP,
    fecha_dispersion TIMESTAMP,
    fecha_timbrado TIMESTAMP,
    fecha_cierre TIMESTAMP,
    
    -- Totales del período
    total_percepciones_bp BIGINT,
    total_deducciones_bp BIGINT,
    total_neto_bp BIGINT,
    total_empleados INTEGER,
    
    -- Multi-tenancy
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by VARCHAR(50),
    
    CONSTRAINT fk_periodo_cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id),
    CONSTRAINT fk_periodo_empresa FOREIGN KEY (empresa_id) REFERENCES empresas(id),
    CONSTRAINT unique_periodo UNIQUE (cliente_id, empresa_id, tipo_periodo, numero_periodo, anio)
);

CREATE INDEX idx_periodo_estatus ON periodos_nomina(estatus);
CREATE INDEX idx_periodo_empresa ON periodos_nomina(empresa_id);
CREATE INDEX idx_periodo_fecha_pago ON periodos_nomina(fecha_pago);

-- =====================================================
-- 6. INCIDENCIAS DE NÓMINA
-- =====================================================

CREATE TABLE incidencias_nomina (
    id VARCHAR(50) PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id VARCHAR(50) NOT NULL,
    empresa_id VARCHAR(50) NOT NULL,
    empleado_id VARCHAR(50) NOT NULL,
    periodo_id VARCHAR(50) NOT NULL,
    
    -- Información de la incidencia
    tipo_incidencia VARCHAR(50) NOT NULL, -- 'falta', 'retardo', 'permiso', 'incapacidad', 'vacaciones', 'hora_extra', 'bono', 'descuento'
    fecha DATE NOT NULL,
    concepto_id VARCHAR(50), -- Referencia a conceptos_nomina
    
    -- Valores
    cantidad DECIMAL(18, 4), -- Horas, días, etc.
    monto_bp BIGINT, -- Monto en basis points
    porcentaje DECIMAL(10, 4), -- Para incapacidades
    
    -- Justificación y documentos
    descripcion TEXT,
    justificada BOOLEAN DEFAULT false,
    documento_url VARCHAR(500),
    
    -- Estado
    estatus VARCHAR(20) NOT NULL DEFAULT 'pendiente', -- 'pendiente', 'aprobada', 'rechazada', 'aplicada'
    fecha_aprobacion TIMESTAMP,
    aprobado_por VARCHAR(50),
    notas_rechazo TEXT,
    
    -- Auditoría
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by VARCHAR(50),
    
    CONSTRAINT fk_incidencia_empleado FOREIGN KEY (empleado_id) REFERENCES empleados(id),
    CONSTRAINT fk_incidencia_periodo FOREIGN KEY (periodo_id) REFERENCES periodos_nomina(id),
    CONSTRAINT fk_incidencia_concepto FOREIGN KEY (concepto_id) REFERENCES conceptos_nomina(id)
);

CREATE INDEX idx_incidencia_empleado ON incidencias_nomina(empleado_id);
CREATE INDEX idx_incidencia_periodo ON incidencias_nomina(periodo_id);
CREATE INDEX idx_incidencia_estatus ON incidencias_nomina(estatus);

-- =====================================================
-- 7. CÁLCULO DE NÓMINA (Movimientos)
-- =====================================================

CREATE TABLE nomina_movimientos (
    id VARCHAR(50) PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id VARCHAR(50) NOT NULL,
    empresa_id VARCHAR(50) NOT NULL,
    empleado_id VARCHAR(50) NOT NULL,
    periodo_id VARCHAR(50) NOT NULL,
    concepto_id VARCHAR(50) NOT NULL,
    
    -- Valores del movimiento
    tipo VARCHAR(20) NOT NULL, -- 'percepcion', 'deduccion', 'otro_pago'
    clave_sat VARCHAR(10),
    concepto_nombre VARCHAR(255) NOT NULL,
    
    -- Importes en basis points
    importe_gravado_bp BIGINT NOT NULL DEFAULT 0,
    importe_exento_bp BIGINT NOT NULL DEFAULT 0,
    importe_total_bp BIGINT NOT NULL DEFAULT 0,
    
    -- Detalles del cálculo
    cantidad DECIMAL(18, 4), -- Días, horas, unidades
    factor DECIMAL(18, 6), -- Factor aplicado
    formula_aplicada TEXT, -- Fórmula que se usó
    
    -- Origen del movimiento
    origen VARCHAR(50), -- 'ordinario', 'incidencia', 'ajuste', 'retroactivo'
    incidencia_id VARCHAR(50),
    
    -- Integración SDI
    integra_sdi BOOLEAN NOT NULL DEFAULT false,
    
    -- Auditoría
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    CONSTRAINT fk_movimiento_empleado FOREIGN KEY (empleado_id) REFERENCES empleados(id),
    CONSTRAINT fk_movimiento_periodo FOREIGN KEY (periodo_id) REFERENCES periodos_nomina(id),
    CONSTRAINT fk_movimiento_concepto FOREIGN KEY (concepto_id) REFERENCES conceptos_nomina(id),
    CONSTRAINT fk_movimiento_incidencia FOREIGN KEY (incidencia_id) REFERENCES incidencias_nomina(id)
);

CREATE INDEX idx_movimiento_empleado ON nomina_movimientos(empleado_id);
CREATE INDEX idx_movimiento_periodo ON nomina_movimientos(periodo_id);
CREATE INDEX idx_movimiento_tipo ON nomina_movimientos(tipo);

-- =====================================================
-- 8. RESUMEN DE NÓMINA POR EMPLEADO
-- =====================================================

CREATE TABLE nomina_resumen_empleado (
    id VARCHAR(50) PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id VARCHAR(50) NOT NULL,
    empresa_id VARCHAR(50) NOT NULL,
    empleado_id VARCHAR(50) NOT NULL,
    periodo_id VARCHAR(50) NOT NULL,
    
    -- Días trabajados
    dias_laborados INTEGER NOT NULL,
    dias_falta INTEGER NOT NULL DEFAULT 0,
    dias_incapacidad INTEGER NOT NULL DEFAULT 0,
    dias_vacaciones INTEGER NOT NULL DEFAULT 0,
    horas_extra DECIMAL(10, 2) NOT NULL DEFAULT 0,
    
    -- Percepciones
    total_percepciones_ordinarias_bp BIGINT NOT NULL DEFAULT 0,
    total_percepciones_extraordinarias_bp BIGINT NOT NULL DEFAULT 0,
    total_percepciones_gravadas_bp BIGINT NOT NULL DEFAULT 0,
    total_percepciones_exentas_bp BIGINT NOT NULL DEFAULT 0,
    total_percepciones_bp BIGINT NOT NULL DEFAULT 0,
    
    -- Deducciones
    total_deducciones_obligatorias_bp BIGINT NOT NULL DEFAULT 0,
    total_deducciones_otras_bp BIGINT NOT NULL DEFAULT 0,
    total_deducciones_bp BIGINT NOT NULL DEFAULT 0,
    
    -- Desglose de deducciones obligatorias
    isr_retenido_bp BIGINT NOT NULL DEFAULT 0,
    imss_trabajador_bp BIGINT NOT NULL DEFAULT 0,
    subsidio_aplicado_bp BIGINT NOT NULL DEFAULT 0,
    
    -- Otros pagos
    total_otros_pagos_bp BIGINT NOT NULL DEFAULT 0,
    
    -- Neto a pagar
    neto_pagar_bp BIGINT NOT NULL DEFAULT 0,
    
    -- Datos para cálculos
    sueldo_base_bp BIGINT NOT NULL,
    sdi_bp BIGINT NOT NULL, -- Salario Diario Integrado
    sbc_bp BIGINT NOT NULL, -- Salario Base de Cotización IMSS
    
    -- CFDI 4.0
    uuid VARCHAR(100), -- UUID del timbrado
    fecha_timbrado TIMESTAMP,
    xml_url VARCHAR(500),
    pdf_url VARCHAR(500),
    
    -- Estado
    estatus VARCHAR(20) NOT NULL DEFAULT 'calculado', -- 'calculado', 'autorizado', 'dispersado', 'timbrado'
    fecha_calculo TIMESTAMP NOT NULL DEFAULT NOW(),
    fecha_autorizacion TIMESTAMP,
    fecha_dispersion TIMESTAMP,
    
    -- Dispersión
    metodo_pago VARCHAR(50), -- 'transferencia', 'efectivo', 'cheque'
    banco VARCHAR(100),
    cuenta VARCHAR(50),
    clabe VARCHAR(18),
    referencia_dispersion VARCHAR(100),
    
    -- Auditoría
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    CONSTRAINT fk_resumen_empleado FOREIGN KEY (empleado_id) REFERENCES empleados(id),
    CONSTRAINT fk_resumen_periodo FOREIGN KEY (periodo_id) REFERENCES periodos_nomina(id),
    CONSTRAINT unique_empleado_periodo UNIQUE (empleado_id, periodo_id)
);

CREATE INDEX idx_resumen_empleado ON nomina_resumen_empleado(empleado_id);
CREATE INDEX idx_resumen_periodo ON nomina_resumen_empleado(periodo_id);
CREATE INDEX idx_resumen_estatus ON nomina_resumen_empleado(estatus);

-- =====================================================
-- 9. CONFIGURACIÓN DE EMPLEADOS PARA NÓMINA
-- =====================================================

-- Agregar campos a la tabla empleados existente
ALTER TABLE empleados ADD COLUMN IF NOT EXISTS sueldo_base_bp BIGINT; -- Sueldo base en basis points
ALTER TABLE empleados ADD COLUMN IF NOT EXISTS sdi_bp BIGINT; -- Salario Diario Integrado
ALTER TABLE empleados ADD COLUMN IF NOT EXISTS sbc_bp BIGINT; -- Salario Base de Cotización IMSS
ALTER TABLE empleados ADD COLUMN IF NOT EXISTS tipo_periodo_pago VARCHAR(20) DEFAULT 'quincenal'; -- 'semanal', 'quincenal', 'mensual'
ALTER TABLE empleados ADD COLUMN IF NOT EXISTS tipo_jornada VARCHAR(20) DEFAULT 'diurna'; -- 'diurna', 'nocturna', 'mixta'
ALTER TABLE empleados ADD COLUMN IF NOT EXISTS horas_jornada INTEGER DEFAULT 8;
ALTER TABLE empleados ADD COLUMN IF NOT EXISTS prima_riesgo_bp INTEGER DEFAULT 54320; -- Prima de riesgo trabajo (5.432%)
ALTER TABLE empleados ADD COLUMN IF NOT EXISTS tiene_infonavit BOOLEAN DEFAULT false;
ALTER TABLE empleados ADD COLUMN IF NOT EXISTS tipo_descuento_infonavit VARCHAR(20); -- 'cuota_fija', 'vsm', 'porcentaje'
ALTER TABLE empleados ADD COLUMN IF NOT EXISTS valor_descuento_infonavit_bp BIGINT;
ALTER TABLE empleados ADD COLUMN IF NOT EXISTS tiene_fonacot BOOLEAN DEFAULT false;
ALTER TABLE empleados ADD COLUMN IF NOT EXISTS descuento_fonacot_bp BIGINT;
ALTER TABLE empleados ADD COLUMN IF NOT EXISTS pension_alimenticia_bp BIGINT;
ALTER TABLE empleados ADD COLUMN IF NOT EXISTS banco_pago VARCHAR(100);
ALTER TABLE empleados ADD COLUMN IF NOT EXISTS cuenta_pago VARCHAR(50);
ALTER TABLE empleados ADD COLUMN IF NOT EXISTS clabe_pago VARCHAR(18);
ALTER TABLE empleados ADD COLUMN IF NOT EXISTS metodo_pago VARCHAR(20) DEFAULT 'transferencia'; -- 'transferencia', 'efectivo', 'cheque'

-- =====================================================
-- 10. AUDITORÍA Y LOGGING DE NÓMINA
-- =====================================================

CREATE TABLE nomina_audit_log (
    id VARCHAR(50) PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id VARCHAR(50) NOT NULL,
    usuario_id VARCHAR(50) NOT NULL,
    
    -- Información de la acción
    accion VARCHAR(100) NOT NULL, -- 'calcular_nomina', 'autorizar_nomina', 'dispersar_nomina', 'timbrar_nomina', 'ajuste_manual', etc.
    entidad VARCHAR(50) NOT NULL, -- 'periodo', 'empleado', 'movimiento', 'incidencia'
    entidad_id VARCHAR(50) NOT NULL,
    
    -- Detalles del cambio
    valores_anteriores JSONB,
    valores_nuevos JSONB,
    diferencias JSONB,
    
    -- Metadata
    ip_address VARCHAR(50),
    user_agent TEXT,
    notas TEXT,
    
    -- Timestamp
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    CONSTRAINT fk_audit_cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id),
    CONSTRAINT fk_audit_usuario FOREIGN KEY (usuario_id) REFERENCES users(id)
);

CREATE INDEX idx_audit_cliente ON nomina_audit_log(cliente_id);
CREATE INDEX idx_audit_accion ON nomina_audit_log(accion);
CREATE INDEX idx_audit_fecha ON nomina_audit_log(created_at);

-- =====================================================
-- 11. PLANTILLAS DE FÓRMULAS PREDEFINIDAS
-- =====================================================

CREATE TABLE formulas_predefinidas (
    id VARCHAR(50) PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL UNIQUE,
    descripcion TEXT,
    categoria VARCHAR(50) NOT NULL, -- 'isr', 'imss', 'percepciones', 'deducciones', 'utilidades'
    formula TEXT NOT NULL,
    parametros JSONB, -- Parámetros que requiere la fórmula
    ejemplos TEXT,
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Insertar fórmulas predefinidas útiles
INSERT INTO formulas_predefinidas (nombre, descripcion, categoria, formula, parametros, ejemplos) VALUES
('Sueldo Diario', 'Calcula el sueldo diario basado en el período de pago', 'percepciones', 
'CASE tipo_periodo 
    WHEN ''mensual'' THEN sueldo_base_mensual / 30.4
    WHEN ''quincenal'' THEN sueldo_base_quincenal / 15
    WHEN ''semanal'' THEN sueldo_base_semanal / 7
END',
'{"tipo_periodo": "string", "sueldo_base": "numeric"}',
'Para un sueldo mensual de $15,000: 15000 / 30.4 = $493.42 diarios'),

('Salario Diario Integrado', 'Calcula el SDI incluyendo aguinaldo y prima vacacional', 'percepciones',
'sueldo_diario * (1 + (dias_aguinaldo / 365) + (dias_vacaciones * 0.25 / 365))',
'{"sueldo_diario": "numeric", "dias_aguinaldo": "integer", "dias_vacaciones": "integer"}',
'SD $500 + 15 días aguinaldo + 6 días vacaciones = $520.55 SDI'),

('Hora Extra Doble', 'Calcula el pago de hora extra doble (primeras 9 horas semanales)', 'percepciones',
'(sueldo_base_mensual / dias_mes / horas_jornada) * horas_extra_dobles * 2',
'{"sueldo_base_mensual": "numeric", "dias_mes": "integer", "horas_jornada": "integer", "horas_extra_dobles": "numeric"}',
'Sueldo $15,000 / 30 días / 8 horas = $62.50/hora * 2 = $125/hora extra'),

('Hora Extra Triple', 'Calcula el pago de hora extra triple (después de 9 horas semanales)', 'percepciones',
'(sueldo_base_mensual / dias_mes / horas_jornada) * horas_extra_triples * 3',
'{"sueldo_base_mensual": "numeric", "dias_mes": "integer", "horas_jornada": "integer", "horas_extra_triples": "numeric"}',
'Sueldo $15,000 / 30 días / 8 horas = $62.50/hora * 3 = $187.50/hora extra'),

('Aguinaldo Proporcional', 'Calcula aguinaldo proporcional según días trabajados en el año', 'percepciones',
'sueldo_diario * 15 * (dias_trabajados_anio / 365)',
'{"sueldo_diario": "numeric", "dias_trabajados_anio": "integer"}',
'SD $500 * 15 días * (180/365) = $3,698.63'),

('Prima Vacacional', 'Calcula prima vacacional (25% de días de vacaciones)', 'percepciones',
'sueldo_diario * dias_vacaciones * 0.25',
'{"sueldo_diario": "numeric", "dias_vacaciones": "integer"}',
'SD $500 * 6 días * 0.25 = $750'),

('Descuento por Falta', 'Descuento proporcional por faltas', 'deducciones',
'sueldo_diario * dias_falta',
'{"sueldo_diario": "numeric", "dias_falta": "integer"}',
'SD $500 * 2 faltas = $1,000 descuento'),

('Incapacidad General', 'Descuento por incapacidad (60% los primeros 3 días, IMSS paga después)', 'deducciones',
'CASE 
    WHEN dias_incapacidad <= 3 THEN sueldo_diario * dias_incapacidad * 0.60
    ELSE sueldo_diario * 3 * 0.60
END',
'{"sueldo_diario": "numeric", "dias_incapacidad": "integer"}',
'SD $500 * 3 días * 0.60 = $900 descuento'),

('SBC Tope IMSS', 'Calcula el Salario Base de Cotización con tope de 25 UMAs', 'imss',
'LEAST(sdi, uma * 25)',
'{"sdi": "numeric", "uma": "numeric"}',
'SDI $800, UMA $113.83: MIN($800, $2,845.75) = $800');

-- =====================================================
-- 12. VISTAS ÚTILES PARA REPORTES
-- =====================================================

-- Vista: Nómina completa por período
CREATE OR REPLACE VIEW v_nomina_completa AS
SELECT 
    p.id as periodo_id,
    p.tipo_periodo,
    p.numero_periodo,
    p.anio,
    p.fecha_inicio,
    p.fecha_fin,
    p.fecha_pago,
    e.id as empresa_id,
    e.razon_social,
    emp.id as empleado_id,
    emp.numero_empleado,
    emp.nombre,
    emp.apellido_paterno,
    emp.apellido_materno,
    emp.rfc,
    emp.nss,
    r.dias_laborados,
    r.total_percepciones_bp / 10000.0 as total_percepciones,
    r.total_deducciones_bp / 10000.0 as total_deducciones,
    r.neto_pagar_bp / 10000.0 as neto_pagar,
    r.isr_retenido_bp / 10000.0 as isr_retenido,
    r.imss_trabajador_bp / 10000.0 as imss_trabajador,
    r.estatus,
    r.uuid,
    r.fecha_timbrado
FROM periodos_nomina p
INNER JOIN empresas e ON p.empresa_id = e.id
INNER JOIN nomina_resumen_empleado r ON p.id = r.periodo_id
INNER JOIN empleados emp ON r.empleado_id = emp.id
WHERE p.estatus != 'cerrado';

-- Vista: Movimientos detallados de nómina
CREATE OR REPLACE VIEW v_movimientos_nomina AS
SELECT 
    m.id as movimiento_id,
    p.tipo_periodo,
    p.numero_periodo,
    p.anio,
    emp.numero_empleado,
    emp.nombre || ' ' || emp.apellido_paterno || ' ' || COALESCE(emp.apellido_materno, '') as nombre_completo,
    m.tipo,
    m.concepto_nombre,
    m.clave_sat,
    m.importe_gravado_bp / 10000.0 as importe_gravado,
    m.importe_exento_bp / 10000.0 as importe_exento,
    m.importe_total_bp / 10000.0 as importe_total,
    m.cantidad,
    m.formula_aplicada,
    m.origen
FROM nomina_movimientos m
INNER JOIN periodos_nomina p ON m.periodo_id = p.id
INNER JOIN empleados emp ON m.empleado_id = emp.id;

-- Vista: Incidencias pendientes de aprobar
CREATE OR REPLACE VIEW v_incidencias_pendientes AS
SELECT 
    i.id as incidencia_id,
    e.razon_social as empresa,
    emp.numero_empleado,
    emp.nombre || ' ' || emp.apellido_paterno as nombre_completo,
    i.tipo_incidencia,
    i.fecha,
    i.cantidad,
    i.monto_bp / 10000.0 as monto,
    i.descripcion,
    i.created_at as fecha_registro,
    u.nombre as registrado_por
FROM incidencias_nomina i
INNER JOIN empleados emp ON i.empleado_id = emp.id
INNER JOIN empresas e ON i.empresa_id = e.id
LEFT JOIN users u ON i.created_by = u.id
WHERE i.estatus = 'pendiente';

-- =====================================================
-- 13. FUNCIONES AUXILIARES PARA CONVERSIÓN
-- =====================================================

-- Función: Convertir pesos a basis points
CREATE OR REPLACE FUNCTION pesos_to_bp(pesos NUMERIC)
RETURNS BIGINT AS $$
BEGIN
    RETURN (pesos * 10000)::BIGINT;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Función: Convertir basis points a pesos
CREATE OR REPLACE FUNCTION bp_to_pesos(bp BIGINT)
RETURNS NUMERIC(18, 2) AS $$
BEGIN
    RETURN (bp::NUMERIC / 10000)::NUMERIC(18, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Función: Convertir porcentaje a basis points
CREATE OR REPLACE FUNCTION porcentaje_to_bp(porcentaje NUMERIC)
RETURNS INTEGER AS $$
BEGIN
    RETURN (porcentaje * 100)::INTEGER;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- COMENTARIOS FINALES
-- =====================================================

COMMENT ON TABLE conceptos_nomina IS 'Catálogo maestro de conceptos de nómina configurables con fórmulas personalizadas';
COMMENT ON TABLE periodos_nomina IS 'Períodos de nómina con control de estados y workflow de cálculo';
COMMENT ON TABLE nomina_movimientos IS 'Movimientos individuales de nómina por empleado y concepto';
COMMENT ON TABLE nomina_resumen_empleado IS 'Resumen consolidado de nómina por empleado con totales y CFDI';
COMMENT ON TABLE incidencias_nomina IS 'Incidencias que afectan nómina: faltas, extras, bonos, descuentos';
COMMENT ON TABLE cat_isr_tarifas IS 'Tablas oficiales de ISR usando basis points para precisión de 4 decimales';
COMMENT ON TABLE cat_subsidio_empleo IS 'Tabla de subsidio al empleo usando basis points';
COMMENT ON TABLE cat_imss_cuotas IS 'Catálogo de cuotas IMSS obrero-patronales con basis points';

-- =====================================================
-- ÍNDICES ADICIONALES PARA OPTIMIZACIÓN
-- =====================================================

CREATE INDEX idx_nomina_empleado_periodo ON nomina_resumen_empleado(empleado_id, periodo_id);
CREATE INDEX idx_movimientos_concepto ON nomina_movimientos(concepto_id);
CREATE INDEX idx_incidencias_fecha ON incidencias_nomina(fecha);
CREATE INDEX idx_incidencias_tipo ON incidencias_nomina(tipo_incidencia);
CREATE INDEX idx_periodos_empresa_fecha ON periodos_nomina(empresa_id, fecha_inicio);
