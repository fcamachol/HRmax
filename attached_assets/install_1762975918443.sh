#!/bin/bash

# =====================================================
# INSTALADOR AUTOMÁTICO DEL SISTEMA DE NÓMINA
# Max Talent HR SA de CV
# =====================================================

echo "╔═══════════════════════════════════════════════════════╗"
echo "║   SISTEMA DE NÓMINA SUPERIOR A NOI                    ║"
echo "║   Instalador Automático v1.0                          ║"
echo "║   Max Talent HR SA de CV                              ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir mensajes
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

# Función para verificar si un comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# =====================================================
# 1. VERIFICAR DEPENDENCIAS
# =====================================================

echo ""
print_info "Verificando dependencias..."

if ! command_exists psql; then
    print_error "PostgreSQL no está instalado o no está en el PATH"
    print_info "Por favor instala PostgreSQL 14 o superior"
    exit 1
fi

print_success "PostgreSQL encontrado"

# =====================================================
# 2. SOLICITAR CREDENCIALES
# =====================================================

echo ""
print_info "Configuración de conexión a PostgreSQL"
echo ""

read -p "Host [localhost]: " DB_HOST
DB_HOST=${DB_HOST:-localhost}

read -p "Puerto [5432]: " DB_PORT
DB_PORT=${DB_PORT:-5432}

read -p "Usuario [postgres]: " DB_USER
DB_USER=${DB_USER:-postgres}

read -sp "Contraseña: " DB_PASS
echo ""

read -p "Base de datos [nomina_db]: " DB_NAME
DB_NAME=${DB_NAME:-nomina_db}

# =====================================================
# 3. VERIFICAR CONEXIÓN
# =====================================================

echo ""
print_info "Verificando conexión a PostgreSQL..."

export PGPASSWORD="$DB_PASS"

if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "postgres" -c "SELECT 1" >/dev/null 2>&1; then
    print_success "Conexión exitosa"
else
    print_error "No se pudo conectar a PostgreSQL"
    print_info "Verifica tus credenciales e intenta de nuevo"
    exit 1
fi

# =====================================================
# 4. CREAR BASE DE DATOS (si no existe)
# =====================================================

echo ""
print_info "Verificando base de datos '$DB_NAME'..."

DB_EXISTS=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "postgres" -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'")

if [ "$DB_EXISTS" = "1" ]; then
    print_warning "La base de datos '$DB_NAME' ya existe"
    read -p "¿Deseas continuar? Esto agregará/actualizará las tablas [s/N]: " CONTINUE
    if [[ ! "$CONTINUE" =~ ^[SsYy]$ ]]; then
        print_info "Instalación cancelada"
        exit 0
    fi
else
    print_info "Creando base de datos '$DB_NAME'..."
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "postgres" -c "CREATE DATABASE $DB_NAME" >/dev/null 2>&1
    
    if [ $? -eq 0 ]; then
        print_success "Base de datos creada exitosamente"
    else
        print_error "Error al crear la base de datos"
        exit 1
    fi
fi

# =====================================================
# 5. INSTALAR SCHEMA
# =====================================================

echo ""
print_info "Instalando schema de nómina..."
echo ""

if [ ! -f "schema_nomina_completo.sql" ]; then
    print_error "No se encuentra el archivo 'schema_nomina_completo.sql'"
    print_info "Asegúrate de estar en el directorio correcto"
    exit 1
fi

psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "schema_nomina_completo.sql" 2>&1 | while IFS= read -r line; do
    if [[ "$line" == *"ERROR"* ]]; then
        print_error "$line"
    else
        echo "  $line"
    fi
done

if [ ${PIPESTATUS[0]} -eq 0 ]; then
    print_success "Schema instalado exitosamente"
else
    print_error "Error al instalar schema"
    exit 1
fi

# =====================================================
# 6. INSTALAR FUNCIONES DE CÁLCULO
# =====================================================

echo ""
print_info "Instalando funciones de cálculo..."
echo ""

if [ ! -f "funciones_calculo_nomina.sql" ]; then
    print_error "No se encuentra el archivo 'funciones_calculo_nomina.sql'"
    exit 1
fi

psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "funciones_calculo_nomina.sql" 2>&1 | while IFS= read -r line; do
    if [[ "$line" == *"ERROR"* ]]; then
        print_error "$line"
    else
        echo "  $line"
    fi
done

if [ ${PIPESTATUS[0]} -eq 0 ]; then
    print_success "Funciones instaladas exitosamente"
else
    print_error "Error al instalar funciones"
    exit 1
fi

# =====================================================
# 7. VERIFICAR INSTALACIÓN
# =====================================================

echo ""
print_info "Verificando instalación..."
echo ""

# Verificar tablas
TABLAS=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc "
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'cat_sat_tipos_percepcion',
    'cat_sat_tipos_deduccion',
    'cat_isr_tarifas',
    'cat_subsidio_empleo',
    'cat_imss_config',
    'cat_imss_cuotas',
    'conceptos_nomina',
    'periodos_nomina',
    'incidencias_nomina',
    'nomina_movimientos',
    'nomina_resumen_empleado',
    'formulas_predefinidas',
    'nomina_audit_log'
);")

if [ "$TABLAS" -ge 13 ]; then
    print_success "Tablas verificadas: $TABLAS/13"
else
    print_warning "Tablas encontradas: $TABLAS/13 (esperadas 13+)"
fi

# Verificar funciones
FUNCIONES=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc "
SELECT COUNT(*) FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE 'calcular_%';")

if [ "$FUNCIONES" -ge 12 ]; then
    print_success "Funciones verificadas: $FUNCIONES/12"
else
    print_warning "Funciones encontradas: $FUNCIONES/12 (esperadas 12+)"
fi

# Verificar datos en catálogos
PERCEPCIONES=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc "SELECT COUNT(*) FROM cat_sat_tipos_percepcion;")
DEDUCCIONES=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc "SELECT COUNT(*) FROM cat_sat_tipos_deduccion;")
ISR_TARIFAS=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc "SELECT COUNT(*) FROM cat_isr_tarifas;")

if [ "$PERCEPCIONES" -gt 0 ]; then
    print_success "Catálogo SAT Percepciones: $PERCEPCIONES registros"
else
    print_error "No se encontraron percepciones en el catálogo SAT"
fi

if [ "$DEDUCCIONES" -gt 0 ]; then
    print_success "Catálogo SAT Deducciones: $DEDUCCIONES registros"
else
    print_error "No se encontraron deducciones en el catálogo SAT"
fi

if [ "$ISR_TARIFAS" -gt 0 ]; then
    print_success "Tablas ISR 2025: $ISR_TARIFAS rangos"
else
    print_error "No se encontraron tarifas ISR"
fi

# =====================================================
# 8. PRUEBAS BÁSICAS
# =====================================================

echo ""
print_info "Ejecutando pruebas básicas..."
echo ""

# Prueba 1: Conversión de basis points
TEST1=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc "SELECT bp_to_pesos(pesos_to_bp(15000.00));")
if [ "$TEST1" = "15000.00" ]; then
    print_success "Conversión basis points: OK"
else
    print_error "Conversión basis points: FALLO (esperado 15000.00, obtenido $TEST1)"
fi

# Prueba 2: Cálculo de ISR
TEST2=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc "SELECT bp_to_pesos(calcular_isr(pesos_to_bp(15000), 'mensual', 2025));")
if [ ! -z "$TEST2" ] && [ "$TEST2" != "0.00" ]; then
    print_success "Cálculo ISR: OK ($TEST2)"
else
    print_error "Cálculo ISR: FALLO"
fi

# Prueba 3: Cálculo de SDI
TEST3=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc "SELECT bp_to_pesos(calcular_sdi(pesos_to_bp(500), 15, 6, 0.25));")
if [ ! -z "$TEST3" ] && [ "$TEST3" != "0.00" ]; then
    print_success "Cálculo SDI: OK ($TEST3)"
else
    print_error "Cálculo SDI: FALLO"
fi

# Prueba 4: Cálculo IMSS
TEST4=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc "SELECT bp_to_pesos(total_imss_trabajador_bp) FROM calcular_imss_trabajador(pesos_to_bp(800), 2025);")
if [ ! -z "$TEST4" ] && [ "$TEST4" != "0.00" ]; then
    print_success "Cálculo IMSS: OK ($TEST4)"
else
    print_error "Cálculo IMSS: FALLO"
fi

# =====================================================
# 9. CREAR DATOS DE EJEMPLO (OPCIONAL)
# =====================================================

echo ""
read -p "¿Deseas instalar datos de ejemplo para pruebas? [s/N]: " INSTALL_EXAMPLES

if [[ "$INSTALL_EXAMPLES" =~ ^[SsYy]$ ]]; then
    print_info "Instalando datos de ejemplo..."
    
    # Crear cliente de prueba
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
    INSERT INTO clientes (id, razon_social, rfc) 
    VALUES ('demo-cliente-001', 'Empresa Demo SA de CV', 'EDE010101ABC')
    ON CONFLICT (id) DO NOTHING;" >/dev/null 2>&1
    
    # Crear empresa de prueba
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
    INSERT INTO empresas (id, cliente_id, razon_social, rfc, registro_patronal) 
    VALUES ('demo-empresa-001', 'demo-cliente-001', 'Empresa Demo SA de CV', 'EDE010101ABC', 'A1234567890')
    ON CONFLICT (id) DO NOTHING;" >/dev/null 2>&1
    
    print_success "Datos de ejemplo instalados"
    print_info "Cliente: demo-cliente-001"
    print_info "Empresa: demo-empresa-001"
fi

# =====================================================
# 10. RESUMEN FINAL
# =====================================================

echo ""
echo "╔═══════════════════════════════════════════════════════╗"
echo "║   INSTALACIÓN COMPLETADA                              ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""

print_success "Sistema de nómina instalado exitosamente"
echo ""
print_info "Detalles de la instalación:"
echo "  • Base de datos: $DB_NAME"
echo "  • Host: $DB_HOST:$DB_PORT"
echo "  • Tablas: $TABLAS"
echo "  • Funciones: $FUNCIONES"
echo "  • Percepciones SAT: $PERCEPCIONES"
echo "  • Deducciones SAT: $DEDUCCIONES"
echo "  • Tarifas ISR: $ISR_TARIFAS"
echo ""

print_info "Próximos pasos:"
echo "  1. Lee el archivo README.md para documentación completa"
echo "  2. Revisa ejemplos_practicos_uso.sql para casos de uso"
echo "  3. Consulta ventajas_competitivas_vs_noi.md para el roadmap"
echo ""

print_info "Para probar el sistema:"
echo "  psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f ejemplos_practicos_uso.sql"
echo ""

print_info "Para conectarte:"
echo "  psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME"
echo ""

print_success "¡Listo para empezar a calcular nómina! 🚀"
echo ""

# Crear archivo de configuración para fácil acceso
cat > .env.nomina << EOF
DB_HOST=$DB_HOST
DB_PORT=$DB_PORT
DB_USER=$DB_USER
DB_NAME=$DB_NAME
EOF

print_info "Configuración guardada en .env.nomina"
echo ""

# =====================================================
# INSTALACIÓN DE TABLAS ISR ADICIONALES
# =====================================================

echo ""
read -p "¿Deseas instalar tablas ISR para TODOS los períodos (diario, semanal, etc.)? [S/n]: " INSTALL_ALL_PERIODS

if [[ ! "$INSTALL_ALL_PERIODS" =~ ^[Nn]$ ]]; then
    if [ -f "tablas_isr_todos_periodos.sql" ]; then
        print_info "Instalando tablas ISR para todos los períodos..."
        echo ""
        
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "tablas_isr_todos_periodos.sql" 2>&1 | while IFS= read -r line; do
            if [[ "$line" == *"ERROR"* ]]; then
                print_error "$line"
            elif [[ "$line" == *"NOTICE"* ]]; then
                print_info "${line#*NOTICE:  }"
            fi
        done
        
        if [ ${PIPESTATUS[0]} -eq 0 ]; then
            print_success "Tablas ISR completas instaladas"
            
            # Verificar períodos
            PERIODOS=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc "
            SELECT STRING_AGG(DISTINCT periodo, ', ' ORDER BY periodo) 
            FROM cat_isr_tarifas 
            WHERE anio = 2025;")
            
            print_info "Períodos disponibles: $PERIODOS"
        else
            print_error "Error al instalar tablas ISR completas"
        fi
    else
        print_warning "Archivo tablas_isr_todos_periodos.sql no encontrado"
    fi
fi

