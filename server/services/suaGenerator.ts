/**
 * Generador de Archivos SUA (Sistema Único de Autodeterminación)
 * 
 * Este servicio genera los archivos de texto que se cargan en el SUA del IMSS
 * para el pago de cuotas obrero-patronales bimestrales.
 * 
 * Formatos soportados:
 * - Archivo de movimientos (.sua)
 * - Archivo de empleados para cálculo
 * - Archivo de pagos
 */

import { bpToPesos, pesosToBp } from "@shared/basisPoints";
import type { ResultadoBimestral, ResultadoCuotasIMSS } from "./imssCalculator";

// ============================================================================
// TIPOS
// ============================================================================

export interface DatosPatron {
  registroPatronal: string; // 11 caracteres
  rfc: string; // 13 caracteres
  razonSocial: string;
  claseRiesgo: number; // 1-5
  primaTasaBp: number; // Prima de riesgo en bp
}

export interface DatosEmpleadoSUA {
  nss: string; // 11 caracteres
  curp: string; // 18 caracteres
  rfc: string; // 13 caracteres
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  sbcDiario: number;
  sbcDiarioBp?: bigint;
  diasCotizados: number;
  fechaMovimiento?: Date;
  tipoMovimiento?: string; // 'alta', 'baja', 'modificacion'
}

export interface ArchivoSUA {
  nombreArchivo: string;
  contenido: string;
  registros: number;
  checksum: string;
}

// ============================================================================
// CONSTANTES DE FORMATO
// ============================================================================

const TIPO_REGISTRO = {
  ENCABEZADO: '01',
  PATRON: '02',
  EMPLEADO: '03',
  MOVIMIENTO: '04',
  CUOTAS: '05',
  TOTALES: '09',
};

const TIPO_MOVIMIENTO_SUA = {
  alta: '08',
  baja: '02',
  modificacion_salario: '07',
  reingreso: '08',
};

// ============================================================================
// FUNCIONES DE FORMATEO
// ============================================================================

function padLeft(str: string, length: number, char: string = ' '): string {
  return str.slice(0, length).padStart(length, char);
}

function padRight(str: string, length: number, char: string = ' '): string {
  return str.slice(0, length).padEnd(length, char);
}

function formatMonto(monto: number, enteros: number = 10, decimales: number = 2): string {
  const montoAbs = Math.abs(monto);
  const parteEntera = Math.floor(montoAbs);
  const parteDecimal = Math.round((montoAbs - parteEntera) * Math.pow(10, decimales));
  
  const strEntero = parteEntera.toString().padStart(enteros, '0');
  const strDecimal = parteDecimal.toString().padStart(decimales, '0');
  
  return strEntero + strDecimal;
}

function formatFecha(fecha: Date): string {
  const dd = fecha.getDate().toString().padStart(2, '0');
  const mm = (fecha.getMonth() + 1).toString().padStart(2, '0');
  const yyyy = fecha.getFullYear().toString();
  return `${dd}${mm}${yyyy}`;
}

function formatFechaCorta(fecha: Date): string {
  const mm = (fecha.getMonth() + 1).toString().padStart(2, '0');
  const yyyy = fecha.getFullYear().toString();
  return `${mm}${yyyy}`;
}

function limpiarTexto(texto: string): string {
  return texto
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^A-Z0-9 ]/g, '')
    .trim();
}

function calcularChecksum(contenido: string): string {
  let sum = 0;
  for (let i = 0; i < contenido.length; i++) {
    sum = (sum + contenido.charCodeAt(i)) % 10000;
  }
  return sum.toString().padStart(4, '0');
}

// ============================================================================
// GENERADORES DE REGISTROS
// ============================================================================

function generarRegistroEncabezado(
  patron: DatosPatron,
  bimestre: number,
  ejercicio: number,
  totalEmpleados: number,
  fechaGeneracion: Date
): string {
  const campos = [
    TIPO_REGISTRO.ENCABEZADO,                           // 2: Tipo registro
    padRight(patron.registroPatronal, 11),              // 11: Registro patronal
    padRight(patron.rfc, 13),                           // 13: RFC
    bimestre.toString().padStart(2, '0'),               // 2: Bimestre (01-06)
    ejercicio.toString(),                               // 4: Ejercicio
    formatFecha(fechaGeneracion),                       // 8: Fecha generación
    totalEmpleados.toString().padStart(6, '0'),         // 6: Total empleados
    padRight('SUA 3.5.4', 20),                          // 20: Versión SUA
    ''.padEnd(33, ' '),                                 // 33: Filler
  ];
  
  return campos.join('');
}

function generarRegistroEmpleado(
  empleado: DatosEmpleadoSUA,
  resultado: ResultadoCuotasIMSS,
  bimestre: number,
  ejercicio: number
): string {
  const campos = [
    TIPO_REGISTRO.EMPLEADO,                             // 2: Tipo registro
    padRight(empleado.nss, 11),                         // 11: NSS
    padRight(empleado.curp, 18),                        // 18: CURP
    padRight(empleado.rfc || '', 13),                   // 13: RFC
    padRight(limpiarTexto(empleado.apellidoPaterno), 27), // 27: Apellido paterno
    padRight(limpiarTexto(empleado.apellidoMaterno || ''), 27), // 27: Apellido materno
    padRight(limpiarTexto(empleado.nombre), 27),        // 27: Nombre
    formatMonto(empleado.sbcDiario, 6, 2),              // 8: SBC diario (6.2)
    empleado.diasCotizados.toString().padStart(2, '0'), // 2: Días cotizados
    bimestre.toString().padStart(2, '0'),               // 2: Bimestre
    ejercicio.toString(),                               // 4: Ejercicio
    formatMonto(resultado.totalObrero, 8, 2),           // 10: Cuotas obrero
    formatMonto(resultado.totalPatronal, 8, 2),         // 10: Cuotas patronal
    ''.padEnd(20, ' '),                                 // 20: Filler
  ];
  
  return campos.join('');
}

function generarRegistroCuotas(
  resultado: ResultadoCuotasIMSS,
  bimestre: number,
  ejercicio: number
): string[] {
  const registros: string[] = [];
  
  // Generar un registro por cada ramo
  for (const ramo of resultado.desglosePorRamo) {
    const campos = [
      TIPO_REGISTRO.CUOTAS,                              // 2: Tipo registro
      padRight(ramo.ramo.toUpperCase().slice(0, 30), 30), // 30: Código ramo
      formatMonto(ramo.obrero, 8, 2),                    // 10: Cuota obrero
      formatMonto(ramo.patronal, 8, 2),                  // 10: Cuota patronal
      formatMonto(ramo.total, 8, 2),                     // 10: Total
      bimestre.toString().padStart(2, '0'),              // 2: Bimestre
      ejercicio.toString(),                              // 4: Ejercicio
      ''.padEnd(32, ' '),                                // 32: Filler
    ];
    
    registros.push(campos.join(''));
  }
  
  return registros;
}

function generarRegistroTotales(
  resultado: ResultadoBimestral
): string {
  const campos = [
    TIPO_REGISTRO.TOTALES,                              // 2: Tipo registro
    resultado.empleados.length.toString().padStart(6, '0'), // 6: Total empleados
    formatMonto(resultado.totalesObrero, 10, 2),        // 12: Total obrero
    formatMonto(resultado.totalesPatronal, 10, 2),      // 12: Total patronal
    formatMonto(resultado.totalesGeneral, 10, 2),       // 12: Total general
    resultado.bimestre.toString().padStart(2, '0'),     // 2: Bimestre
    resultado.ejercicio.toString(),                     // 4: Ejercicio
    ''.padEnd(50, ' '),                                 // 50: Filler
  ];
  
  return campos.join('');
}

// ============================================================================
// FUNCIONES PRINCIPALES DE GENERACIÓN
// ============================================================================

/**
 * Genera archivo SUA para cálculo de cuotas bimestrales
 */
export function generarArchivoSUA(
  patron: DatosPatron,
  empleados: DatosEmpleadoSUA[],
  resultado: ResultadoBimestral
): ArchivoSUA {
  const lineas: string[] = [];
  const fechaGeneracion = new Date();
  
  // Encabezado
  lineas.push(generarRegistroEncabezado(
    patron,
    resultado.bimestre,
    resultado.ejercicio,
    empleados.length,
    fechaGeneracion
  ));
  
  // Empleados con sus cuotas
  for (let i = 0; i < empleados.length; i++) {
    const empleado = empleados[i];
    const resultadoEmpleado = resultado.empleados[i];
    
    if (resultadoEmpleado) {
      lineas.push(generarRegistroEmpleado(
        empleado,
        resultadoEmpleado,
        resultado.bimestre,
        resultado.ejercicio
      ));
    }
  }
  
  // Registro de totales
  lineas.push(generarRegistroTotales(resultado));
  
  const contenido = lineas.join('\r\n');
  const checksum = calcularChecksum(contenido);
  
  // Nombre del archivo: RP_BIMESTRE_EJERCICIO.sua
  const nombreArchivo = `${patron.registroPatronal}_B${resultado.bimestre}_${resultado.ejercicio}.sua`;
  
  return {
    nombreArchivo,
    contenido,
    registros: lineas.length,
    checksum,
  };
}

/**
 * Genera archivo de movimientos afiliatorios (para carga en SUA)
 */
export function generarArchivoMovimientos(
  patron: DatosPatron,
  movimientos: Array<DatosEmpleadoSUA & { tipoMovimiento: string; fechaMovimiento: Date }>
): ArchivoSUA {
  const lineas: string[] = [];
  const fechaGeneracion = new Date();
  
  // Encabezado
  const encabezado = [
    TIPO_REGISTRO.ENCABEZADO,
    padRight(patron.registroPatronal, 11),
    padRight(patron.rfc, 13),
    formatFecha(fechaGeneracion),
    movimientos.length.toString().padStart(6, '0'),
    padRight('MOVIMIENTOS', 20),
    ''.padEnd(43, ' '),
  ];
  lineas.push(encabezado.join(''));
  
  // Movimientos
  for (const mov of movimientos) {
    const tipoMov = TIPO_MOVIMIENTO_SUA[mov.tipoMovimiento as keyof typeof TIPO_MOVIMIENTO_SUA] || '99';
    
    const registro = [
      TIPO_REGISTRO.MOVIMIENTO,                         // 2
      padRight(mov.nss, 11),                            // 11
      padRight(mov.curp, 18),                           // 18
      padRight(mov.rfc || '', 13),                      // 13
      padRight(limpiarTexto(mov.apellidoPaterno), 27),  // 27
      padRight(limpiarTexto(mov.apellidoMaterno || ''), 27), // 27
      padRight(limpiarTexto(mov.nombre), 27),           // 27
      tipoMov,                                          // 2: Tipo movimiento
      formatFecha(mov.fechaMovimiento),                 // 8: Fecha movimiento
      formatMonto(mov.sbcDiario, 6, 2),                 // 8: SBC
      ''.padEnd(30, ' '),                               // 30: Filler
    ];
    
    lineas.push(registro.join(''));
  }
  
  const contenido = lineas.join('\r\n');
  const checksum = calcularChecksum(contenido);
  
  const nombreArchivo = `${patron.registroPatronal}_MOV_${formatFecha(fechaGeneracion)}.sua`;
  
  return {
    nombreArchivo,
    contenido,
    registros: lineas.length,
    checksum,
  };
}

/**
 * Genera archivo CSV de resumen para consulta
 */
export function generarResumenCSV(resultado: ResultadoBimestral): string {
  const lineas: string[] = [];
  
  // Encabezado
  lineas.push('NSS,Nombre,SBC Diario,Días,Cuotas Obrero,Cuotas Patronal,Total');
  
  // Empleados (usamos empleadoId como placeholder para NSS)
  for (const emp of resultado.empleados) {
    lineas.push([
      emp.empleadoId,
      '', // Nombre no disponible en resultado
      emp.sbcDiario.toFixed(2),
      emp.diasCotizados.toString(),
      emp.totalObrero.toFixed(2),
      emp.totalPatronal.toFixed(2),
      emp.total.toFixed(2),
    ].join(','));
  }
  
  // Línea de totales
  lineas.push([
    'TOTALES',
    '',
    '',
    '',
    resultado.totalesObrero.toFixed(2),
    resultado.totalesPatronal.toFixed(2),
    resultado.totalesGeneral.toFixed(2),
  ].join(','));
  
  return lineas.join('\n');
}

/**
 * Genera reporte de desglose por ramo en formato texto
 */
export function generarReporteRamos(resultado: ResultadoBimestral): string {
  const lineas: string[] = [];
  
  lineas.push('='.repeat(80));
  lineas.push(`REPORTE DE CUOTAS IMSS - BIMESTRE ${resultado.bimestre}/${resultado.ejercicio}`);
  lineas.push('='.repeat(80));
  lineas.push('');
  lineas.push(`Empresa: ${resultado.empresaId}`);
  lineas.push(`Período: ${resultado.fechaInicio.toLocaleDateString('es-MX')} al ${resultado.fechaFin.toLocaleDateString('es-MX')}`);
  lineas.push(`Total empleados: ${resultado.empleados.length}`);
  lineas.push('');
  lineas.push('-'.repeat(80));
  lineas.push(padRight('RAMO', 35) + padLeft('OBRERO', 15) + padLeft('PATRONAL', 15) + padLeft('TOTAL', 15));
  lineas.push('-'.repeat(80));
  
  for (const ramo of resultado.desglosePorRamo) {
    lineas.push(
      padRight(ramo.ramo.replace(/_/g, ' ').toUpperCase(), 35) +
      padLeft(`$${ramo.obrero.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, 15) +
      padLeft(`$${ramo.patronal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, 15) +
      padLeft(`$${ramo.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, 15)
    );
  }
  
  lineas.push('-'.repeat(80));
  lineas.push(
    padRight('TOTALES', 35) +
    padLeft(`$${resultado.totalesObrero.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, 15) +
    padLeft(`$${resultado.totalesPatronal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, 15) +
    padLeft(`$${resultado.totalesGeneral.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, 15)
  );
  lineas.push('='.repeat(80));
  
  return lineas.join('\n');
}
