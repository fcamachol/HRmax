# Cambios Fiscales y de Nómina 2026 - HRMax

> Documento actualizado: 2 de enero de 2026
> Sistema HRMax con soporte completo para normativa fiscal 2026

---

## 📋 Resumen Ejecutivo

El sistema HRMax ha sido actualizado para cumplir con todas las regulaciones fiscales y laborales de México vigentes desde el 1 de enero de 2026. Este documento detalla todos los cambios implementados.

---

## 💰 Salarios Mínimos 2026

### Actualización Official (Vigente desde 1 de enero de 2026)

**Fuente:** CONASAMI - DOF 03/12/2025

| Zona | Salario 2025 | Salario 2026 | Incremento | % |
|------|--------------|--------------|------------|---|
| **General** | $278.80 | **$315.04** | $36.24 | **13%** |
| **Frontera Norte** | $419.88 | **$440.87** | $20.99 | **5%** |

### Impacto Mensual y Quincenal

**Zona General:**
- Mensual (30 días): $9,451.20
- Quincenal (15 días): $4,725.60

**Zona Frontera Norte:**
- Mensual (30 días): $13,226.10
- Quincenal (15 días): $6,613.05

### Implementación en HRMax

```typescript
// Configuración actualizada en shared/payrollEngine.ts
export const CONFIG_FISCAL_2026: ConfiguracionFiscal = {
  salarioMinimo: {
    general: 315.04,    // ✅ Actualizado
    frontera: 440.87,   // ✅ Actualizado
  },
  // ...
};
```

---

## 📊 UMA 2026 (Unidad de Medida y Actualización)

### Estado Actual

⚠️ **PENDIENTE DE PUBLICACIÓN OFICIAL**

El INEGI publicará el nuevo valor de la UMA durante los primeros días de enero de 2026, con vigencia a partir del **1 de febrero de 2026**.

### UMA 2025 (Vigente hasta 31/01/2026)

| Periodo | Valor |
|---------|-------|
| Diaria | $113.14 |
| Mensual | $3,439.46 |
| Anual | $41,273.52 |

### Cálculo de UMA 2026

El nuevo valor se calculará con la fórmula:

```
UMA 2026 = UMA 2025 × (1 + Inflación Diciembre 2025)
```

### Implementación en HRMax

```typescript
// Estado actual en shared/payrollEngine.ts
export const CONFIG_FISCAL_2026: ConfiguracionFiscal = {
  uma: {
    diaria: 113.14,      // PENDIENTE: Se actualizará en enero 2026
    mensual: 3439.46,    // PENDIENTE: Se actualizará en enero 2026
    anual: 41273.52,     // PENDIENTE: Se actualizará en enero 2026
  },
  // ...
};
```

**Acción requerida:** Actualizar estos valores cuando INEGI publique la UMA 2026.

---

## 🧾 Tablas ISR 2026

### Factor de Actualización

**Fuente:** Anexo 8 RMF 2026 - DOF 28/12/2025

- **Factor:** 1.1321
- **Inflación acumulada:** 13.21%
- **Fundamento:** Artículo 152 LISR (actualización cuando inflación > 10%)

### Cambios en las Tablas

✅ **Actualizados:**
- Límites inferiores (×1.1321)
- Límites superiores (×1.1321)
- Cuotas fijas (×1.1321)

❌ **Sin cambios:**
- Tasas porcentuales (se mantienen: 1.92%, 6.40%, 10.88%, 16.00%, 17.92%, 21.36%, 23.52%, 30.00%, 32.00%, 34.00%, 35.00%)

### Ejemplo de Actualización - Tabla Mensual

| Tramo | Límite Inferior 2025 | Límite Inferior 2026 | Cuota Fija 2025 | Cuota Fija 2026 | Tasa |
|-------|---------------------|---------------------|-----------------|-----------------|------|
| 1 | $0.01 - $746.04 | $0.01 - $844.59 | $0.00 | $0.00 | 1.92% |
| 2 | $746.05 - $6,332.05 | $844.60 - $7,168.45 | $14.32 | $16.22 | 6.40% |
| 3 | $6,332.06 - $11,128.01 | $7,168.46 - $12,599.66 | $371.83 | $420.94 | 10.88% |
| ... | ... | ... | ... | ... | ... |

### Tablas Disponibles

HRMax incluye tablas ISR 2026 completas para:

- ✅ Mensual
- ✅ Quincenal
- ✅ Catorcenal
- ✅ Semanal
- ✅ Diario

### Implementación

```typescript
// Uso de las tablas 2026
import { calcularISR2026, TABLAS_ISR_2026 } from '@/shared/payrollEngine';

const resultado = calcularISR2026(
  pesosToBp(15000),  // Base gravable quincenal
  'quincenal',
  1  // Mes (enero = 1, febrero = 2, etc.)
);
```

---

## 💸 Subsidio al Empleo 2026

### Cambios Principales

**Fuente:** DOF 31/12/2025

| Concepto | 2025 | 2026 |
|----------|------|------|
| **Subsidio Mensual** | $475.00 | $536.21 (ene) / $536.22 (feb-dic) |
| **Límite de Ingreso** | $10,171.00 | $11,492.66 |
| **Fórmula** | 13.8% de UMA | 15.59% de UMA (ene) / 15.02% (feb-dic) |

### Regla Transitoria Enero 2026

Debido a que la UMA 2026 entra en vigor el 1 de febrero:

- **Enero 2026:** 15.59% de UMA 2025 = **$536.21**
- **Febrero-Diciembre 2026:** 15.02% de UMA 2026 = **$536.22** (pendiente ajuste)

### Cálculo por Periodicidad

**Enero 2026:**

| Periodo | Límite de Ingreso | Subsidio Aplicable |
|---------|-------------------|-------------------|
| Mensual | $11,492.66 | $536.21 |
| Quincenal | $5,668.75 | $264.58 |
| Catorcenal | $5,290.49 | $246.95 |
| Semanal | $2,645.24 | $123.47 |
| Diario | $377.89 | $17.64 |

**Febrero-Diciembre 2026:**

| Periodo | Límite de Ingreso | Subsidio Aplicable |
|---------|-------------------|-------------------|
| Mensual | $11,492.66 | $536.22 |
| Quincenal | $5,668.75 | $264.58 |
| Catorcenal | $5,290.49 | $246.96 |
| Semanal | $2,645.24 | $123.48 |
| Diario | $377.89 | $17.64 |

### Requisitos para Aplicar

✅ Ingreso gravable mensual ≤ $11,492.66
✅ Empleado activo
✅ Excluye: aguinaldos, finiquitos, indemnizaciones, PTU

### Implementación

```typescript
// Uso del subsidio 2026
import { calcularSubsidio2026 } from '@/shared/payrollEngine';

const subsidio = calcularSubsidio2026(
  pesosToBp(5000),  // Ingreso gravable quincenal
  'quincenal',
  1  // Mes (enero = 1)
);
```

---

## 🔧 Funciones Nuevas en HRMax

### 1. `calcularISR2026()`

Calcula el ISR usando las tablas actualizadas de 2026.

**Firma:**
```typescript
function calcularISR2026(
  baseGravableBp: bigint,
  periodo: TipoPeriodo,
  mes?: number
): {
  isrBp: bigint;
  subsidioEmpleoBp: bigint;
  isrRetenidoBp: bigint;
  tramoAplicado: number;
}
```

**Parámetros:**
- `baseGravableBp`: Base gravable en basis points
- `periodo`: 'diario' | 'semanal' | 'catorcenal' | 'quincenal' | 'mensual'
- `mes`: Mes del año (1-12), por defecto 1 (enero)

**Retorna:**
- `isrBp`: ISR calculado antes de subsidio
- `subsidioEmpleoBp`: Subsidio al empleo aplicable
- `isrRetenidoBp`: ISR final a retener (ISR - Subsidio, mínimo 0)
- `tramoAplicado`: Número de tramo fiscal (1-11)

**Ejemplo:**
```typescript
const resultado = calcularISR2026(
  pesosToBp(15000),
  'quincenal',
  3  // Marzo
);

console.log(`ISR: ${bpToPesos(resultado.isrBp)}`);
console.log(`Subsidio: ${bpToPesos(resultado.subsidioEmpleoBp)}`);
console.log(`ISR a retener: ${bpToPesos(resultado.isrRetenidoBp)}`);
```

### 2. `calcularSubsidio2026()`

Calcula el subsidio al empleo con las reglas de 2026.

**Firma:**
```typescript
function calcularSubsidio2026(
  ingresoGravableBp: bigint,
  periodo: TipoPeriodo,
  mes?: number
): bigint
```

**Ejemplo:**
```typescript
const subsidio = calcularSubsidio2026(
  pesosToBp(5000),
  'quincenal',
  1  // Enero
);
// Retorna: 2645800n (=$264.58 en bp)
```

### 3. Constantes Nuevas

```typescript
// Configuración fiscal 2026
export const CONFIG_FISCAL_2026: ConfiguracionFiscal

// Tablas ISR 2026
export const TABLAS_ISR_2026: Record<TipoPeriodo, TablaISR>

// Configuración subsidio 2026
export const CONFIG_SUBSIDIO_2026: ConfigSubsidio
export const CONFIG_SUBSIDIO_2026_ENERO: ConfigSubsidio

// Tablas de subsidio precalculadas
export const SUBSIDIOS_POR_PERIODO_2026: Record<TipoPeriodo, {...}>
export const SUBSIDIOS_POR_PERIODO_2026_ENERO: Record<TipoPeriodo, {...}>
```

---

## 📝 Ejemplo Completo de Cálculo 2026

### Caso: Empleado con salario quincenal de $15,000

```typescript
import {
  pesosToBp,
  bpToPesos,
  calcularISR2026,
  CONFIG_FISCAL_2026
} from '@/shared/payrollEngine';

// Datos del empleado
const salarioQuincenal = 15000;
const baseGravableBp = pesosToBp(salarioQuincenal);

// Calcular ISR para marzo 2026
const resultado = calcularISR2026(
  baseGravableBp,
  'quincenal',
  3  // Marzo
);

console.log('=== CÁLCULO ISR QUINCENAL 2026 ===');
console.log(`Salario: $${salarioQuincenal.toFixed(2)}`);
console.log(`ISR Causado: $${bpToPesos(resultado.isrBp).toFixed(2)}`);
console.log(`Subsidio Empleo: $${bpToPesos(resultado.subsidioEmpleoBp).toFixed(2)}`);
console.log(`ISR a Retener: $${bpToPesos(resultado.isrRetenidoBp).toFixed(2)}`);
console.log(`Tramo Fiscal: ${resultado.tramoAplicado}`);

// Salida esperada (marzo 2026):
// ISR Causado: $2,685.00 (aproximado)
// Subsidio Empleo: $264.58
// ISR a Retener: $2,420.42
```

---

## 🚨 Diferencias Clave 2025 vs 2026

### ISR

| Concepto | 2025 | 2026 | Cambio |
|----------|------|------|--------|
| Factor de actualización | 1.0 (sin cambio) | 1.1321 | +13.21% |
| Tramo 1 mensual | $0.01 - $746.04 | $0.01 - $844.59 | +13.21% |
| Tasa máxima | 35% | 35% | Sin cambio |

### Subsidio al Empleo

| Concepto | 2025 | 2026 | Cambio |
|----------|------|------|--------|
| Monto mensual | $475.00 | $536.21/$536.22 | +12.89% |
| Límite ingreso | $10,171.00 | $11,492.66 | +13.00% |
| % de UMA | 13.8% | 15.59%/15.02% | Variable |

### Salario Mínimo

| Zona | 2025 | 2026 | Cambio |
|------|------|------|--------|
| General | $278.80 | $315.04 | +13.00% |
| Frontera | $419.88 | $440.87 | +5.00% |

---

## ✅ Checklist de Migración

### Para Implementadores

- [x] Actualizar `CONFIG_FISCAL_2026` con salarios mínimos
- [ ] Actualizar `CONFIG_FISCAL_2026` con UMA 2026 (cuando INEGI publique)
- [x] Implementar `TABLAS_ISR_2026`
- [x] Implementar `CONFIG_SUBSIDIO_2026` y `CONFIG_SUBSIDIO_2026_ENERO`
- [x] Crear función `calcularISR2026()`
- [x] Crear función `calcularSubsidio2026()`
- [ ] Actualizar interfaces de usuario para usar tablas 2026
- [ ] Migrar nóminas existentes a cálculos 2026
- [ ] Ejecutar pruebas de validación con casos reales

### Para Usuarios

- [ ] Verificar que los empleados tengan salarios actualizados
- [ ] Revisar que los grupos de nómina usen las tablas 2026
- [ ] Validar cálculos de ISR en nóminas de prueba
- [ ] Comparar resultados con períodos anteriores
- [ ] Generar reportes de impacto fiscal

---

## 🧪 Casos de Prueba

### Caso 1: Salario Bajo (Debe recibir subsidio completo)

```typescript
const salario = 3000; // Quincenal
const resultado = calcularISR2026(pesosToBp(salario), 'quincenal', 2);

// Esperado:
// - ISR causado: ~$42.00
// - Subsidio: $264.58
// - ISR final: $0 (subsidio mayor que ISR)
```

### Caso 2: Salario Medio (Subsidio parcial)

```typescript
const salario = 8000; // Quincenal
const resultado = calcularISR2026(pesosToBp(salario), 'quincenal', 2);

// Esperado:
// - ISR causado: ~$880.00
// - Subsidio: $264.58
// - ISR final: ~$615.42
```

### Caso 3: Salario Alto (Sin subsidio)

```typescript
const salario = 20000; // Quincenal
const resultado = calcularISR2026(pesosToBp(salario), 'quincenal', 2);

// Esperado:
// - ISR causado: ~$3,900.00
// - Subsidio: $0 (excede límite)
// - ISR final: ~$3,900.00
```

---

## 🔗 Referencias y Fuentes

### Documentos Oficiales

1. **Salarios Mínimos 2026**
   - [CONASAMI - Incremento 2026](https://www.gob.mx/conasami/articulos/incremento-a-los-salarios-minimos-para-2026)
   - [DOF - Tabla de Salarios Mínimos 2026](https://www.gob.mx/cms/uploads/attachment/file/1041076/Tabla_de_Salarios_M_nimos_2026.pdf)

2. **Tablas ISR 2026**
   - [ContadorMx - Tablas ISR 2026](https://contadormx.com/tablas-isr-2026/)
   - [ElConta.mx - Anexo 8 RMF 2026](https://elconta.mx/tablas-y-tarifas-isr-2026-anexo-8-de-la-resolucion-miscelanea-fiscal-2026/)

3. **UMA 2026**
   - [INEGI - UMA](https://www.inegi.org.mx/temas/uma/)
   - [Comunicado INEGI UMA 2025](https://www.inegi.org.mx/contenidos/saladeprensa/boletines/2025/uma/uma2025.pdf)

4. **Subsidio al Empleo 2026**
   - [ContadorMx - Subsidio 2026](https://contadormx.com/tabla-de-subsidio-al-empleo-2026/)
   - [ElConta.mx - Subsidio 2026](https://elconta.mx/resumen-del-nuevo-subsidio-para-el-empleo-2026/)

### Legislación

- Ley del ISR - Artículo 152 (Actualización de tarifas)
- Ley Federal del Trabajo
- Resolución Miscelánea Fiscal 2026 - Anexo 8

---

## 📞 Soporte y Contacto

Para dudas sobre la implementación de los cambios 2026 en HRMax:

- **Documentación técnica:** `/shared/payrollEngine.ts`
- **Casos de prueba:** `/test-nomina-calculations.ts`
- **Equipo de desarrollo:** Max Talent HR SA de CV

---

**Última actualización:** 2 de enero de 2026
**Versión del documento:** 1.0
**Sistema:** HRMax Payroll Engine v2026.1

---

> ⚠️ **Nota Importante:** Este documento será actualizado cuando el INEGI publique el valor oficial de la UMA 2026 (esperado en enero 2026, vigente desde febrero 2026).
