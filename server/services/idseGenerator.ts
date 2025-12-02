/**
 * Generador de Archivos IDSE (IMSS Desde Su Empresa)
 * 
 * Este servicio genera los archivos de texto para envío de movimientos
 * afiliatorios al IMSS a través del portal IDSE.
 * 
 * Formatos soportados:
 * - Altas (tipo 08)
 * - Bajas (tipo 02)
 * - Modificaciones de salario (tipo 07)
 * - Reingresos (tipo 08)
 * - Movimientos varios
 */

// ============================================================================
// TIPOS
// ============================================================================

export interface DatosPatronIDSE {
  registroPatronal: string; // 11 caracteres (sin guiones)
  rfc: string; // 13 caracteres
  razonSocial: string;
  curpRepresentante?: string;
}

export interface MovimientoIDSE {
  nss: string; // 11 caracteres
  curp: string; // 18 caracteres
  rfc?: string; // 13 caracteres (opcional)
  apellidoPaterno: string;
  apellidoMaterno?: string;
  nombre: string;
  tipoMovimiento: 'alta' | 'baja' | 'modificacion_salario' | 'reingreso';
  fechaMovimiento: Date;
  sbcDiario: number;
  
  // Campos adicionales para altas
  tipoTrabajador?: string; // 1=Permanente, 2=Eventual Ciudad, 3=Eventual Campo
  tipoSalario?: string; // 0=Fijo, 1=Variable, 2=Mixto
  jefeEspecial?: string; // 0=No, 1=Sí
  semanaReducida?: string; // 0=No, 1-5=Días
  unidadMedica?: string; // Clave UMF
  
  // Campos adicionales para bajas
  causaBaja?: string; // 1=Término contrato, 2=Separación voluntaria, etc.
  
  // Campos para auditoría
  folio?: string;
  observaciones?: string;
}

export interface ArchivoIDSE {
  nombreArchivo: string;
  contenido: string;
  registros: number;
  checksum: string;
  tipoArchivo: 'alta' | 'baja' | 'modificacion' | 'mixto';
}

export interface ResultadoEnvioIDSE {
  exito: boolean;
  folioAcuse?: string;
  fechaEnvio?: Date;
  errores?: string[];
}

// ============================================================================
// CONSTANTES DE FORMATO IDSE
// ============================================================================

const TIPO_MOVIMIENTO_IDSE = {
  alta: '08',
  baja: '02',
  modificacion_salario: '07',
  reingreso: '08',
};

const CAUSA_BAJA_IDSE = {
  terminoContrato: '1',
  separacionVoluntaria: '2',
  abandonoEmpleo: '3',
  defuncion: '4',
  clausuraEmpresa: '5',
  ausentismo: '6',
  pensionIncapacidad: '7',
  pensionInvalidez: '8',
  pensionCesantia: '9',
  otro: 'A',
};

const TIPO_TRABAJADOR = {
  permanente: '1',
  eventualCiudad: '2',
  eventualCampo: '3',
};

const TIPO_SALARIO = {
  fijo: '0',
  variable: '1',
  mixto: '2',
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

function formatMonto(monto: number, enteros: number = 6, decimales: number = 2): string {
  const montoAbs = Math.abs(monto);
  const parteEntera = Math.floor(montoAbs);
  const parteDecimal = Math.round((montoAbs - parteEntera) * Math.pow(10, decimales));
  
  const strEntero = parteEntera.toString().padStart(enteros, '0');
  const strDecimal = parteDecimal.toString().padStart(decimales, '0');
  
  return strEntero + strDecimal;
}

function formatFechaIDSE(fecha: Date): string {
  const dd = fecha.getDate().toString().padStart(2, '0');
  const mm = (fecha.getMonth() + 1).toString().padStart(2, '0');
  const yyyy = fecha.getFullYear().toString();
  return `${dd}${mm}${yyyy}`;
}

function limpiarTexto(texto: string): string {
  return texto
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^A-Z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function limpiarRegistroPatronal(rp: string): string {
  // Remover guiones y espacios
  return rp.replace(/[-\s]/g, '').slice(0, 11);
}

function calcularDigitoVerificador(nss: string): string {
  // Algoritmo Módulo 10 para NSS
  const pesos = [1, 2, 1, 2, 1, 2, 1, 2, 1, 2];
  let suma = 0;
  
  for (let i = 0; i < 10 && i < nss.length; i++) {
    let producto = parseInt(nss[i]) * pesos[i];
    if (producto >= 10) {
      producto = Math.floor(producto / 10) + (producto % 10);
    }
    suma += producto;
  }
  
  const residuo = suma % 10;
  return residuo === 0 ? '0' : (10 - residuo).toString();
}

function calcularChecksum(contenido: string): string {
  let sum = 0;
  for (let i = 0; i < contenido.length; i++) {
    sum = (sum + contenido.charCodeAt(i)) % 10000;
  }
  return sum.toString().padStart(4, '0');
}

// ============================================================================
// GENERADORES DE REGISTROS IDSE
// ============================================================================

function generarRegistroAlta(mov: MovimientoIDSE, patron: DatosPatronIDSE): string {
  const campos = [
    limpiarRegistroPatronal(patron.registroPatronal),   // 11: Registro patronal
    padRight(mov.nss, 11),                              // 11: NSS
    padRight(limpiarTexto(mov.apellidoPaterno), 27),    // 27: Apellido paterno
    padRight(limpiarTexto(mov.apellidoMaterno || ''), 27), // 27: Apellido materno
    padRight(limpiarTexto(mov.nombre), 27),             // 27: Nombre
    formatMonto(mov.sbcDiario, 6, 2),                   // 8: SBC diario
    mov.tipoTrabajador || TIPO_TRABAJADOR.permanente,   // 1: Tipo trabajador
    mov.tipoSalario || TIPO_SALARIO.fijo,               // 1: Tipo salario
    mov.jefeEspecial || '0',                            // 1: Jefe especial
    formatFechaIDSE(mov.fechaMovimiento),               // 8: Fecha alta
    padRight(mov.unidadMedica || '', 3),                // 3: Clave UMF
    mov.semanaReducida || '0',                          // 1: Semana reducida
    padRight(mov.curp, 18),                             // 18: CURP
    TIPO_MOVIMIENTO_IDSE.alta,                          // 2: Tipo movimiento
  ];
  
  return campos.join('');
}

function generarRegistroBaja(mov: MovimientoIDSE, patron: DatosPatronIDSE): string {
  const campos = [
    limpiarRegistroPatronal(patron.registroPatronal),   // 11: Registro patronal
    padRight(mov.nss, 11),                              // 11: NSS
    padRight(limpiarTexto(mov.apellidoPaterno), 27),    // 27: Apellido paterno
    padRight(limpiarTexto(mov.apellidoMaterno || ''), 27), // 27: Apellido materno
    padRight(limpiarTexto(mov.nombre), 27),             // 27: Nombre
    formatFechaIDSE(mov.fechaMovimiento),               // 8: Fecha baja
    mov.causaBaja || CAUSA_BAJA_IDSE.terminoContrato,   // 1: Causa baja
    padRight(mov.curp, 18),                             // 18: CURP
    TIPO_MOVIMIENTO_IDSE.baja,                          // 2: Tipo movimiento
  ];
  
  return campos.join('');
}

function generarRegistroModificacion(mov: MovimientoIDSE, patron: DatosPatronIDSE): string {
  const campos = [
    limpiarRegistroPatronal(patron.registroPatronal),   // 11: Registro patronal
    padRight(mov.nss, 11),                              // 11: NSS
    padRight(limpiarTexto(mov.apellidoPaterno), 27),    // 27: Apellido paterno
    padRight(limpiarTexto(mov.apellidoMaterno || ''), 27), // 27: Apellido materno
    padRight(limpiarTexto(mov.nombre), 27),             // 27: Nombre
    formatMonto(mov.sbcDiario, 6, 2),                   // 8: SBC diario nuevo
    formatFechaIDSE(mov.fechaMovimiento),               // 8: Fecha modificación
    padRight(mov.curp, 18),                             // 18: CURP
    TIPO_MOVIMIENTO_IDSE.modificacion_salario,          // 2: Tipo movimiento
  ];
  
  return campos.join('');
}

// ============================================================================
// FUNCIONES PRINCIPALES DE GENERACIÓN
// ============================================================================

/**
 * Genera archivo IDSE para altas
 */
export function generarArchivoAltas(
  patron: DatosPatronIDSE,
  movimientos: MovimientoIDSE[]
): ArchivoIDSE {
  const altas = movimientos.filter(m => m.tipoMovimiento === 'alta' || m.tipoMovimiento === 'reingreso');
  const lineas: string[] = [];
  
  for (const mov of altas) {
    lineas.push(generarRegistroAlta(mov, patron));
  }
  
  const contenido = lineas.join('\r\n');
  const checksum = calcularChecksum(contenido);
  const fechaStr = formatFechaIDSE(new Date());
  
  return {
    nombreArchivo: `${limpiarRegistroPatronal(patron.registroPatronal)}_ALTAS_${fechaStr}.txt`,
    contenido,
    registros: lineas.length,
    checksum,
    tipoArchivo: 'alta',
  };
}

/**
 * Genera archivo IDSE para bajas
 */
export function generarArchivoBajas(
  patron: DatosPatronIDSE,
  movimientos: MovimientoIDSE[]
): ArchivoIDSE {
  const bajas = movimientos.filter(m => m.tipoMovimiento === 'baja');
  const lineas: string[] = [];
  
  for (const mov of bajas) {
    lineas.push(generarRegistroBaja(mov, patron));
  }
  
  const contenido = lineas.join('\r\n');
  const checksum = calcularChecksum(contenido);
  const fechaStr = formatFechaIDSE(new Date());
  
  return {
    nombreArchivo: `${limpiarRegistroPatronal(patron.registroPatronal)}_BAJAS_${fechaStr}.txt`,
    contenido,
    registros: lineas.length,
    checksum,
    tipoArchivo: 'baja',
  };
}

/**
 * Genera archivo IDSE para modificaciones de salario
 */
export function generarArchivoModificaciones(
  patron: DatosPatronIDSE,
  movimientos: MovimientoIDSE[]
): ArchivoIDSE {
  const modificaciones = movimientos.filter(m => m.tipoMovimiento === 'modificacion_salario');
  const lineas: string[] = [];
  
  for (const mov of modificaciones) {
    lineas.push(generarRegistroModificacion(mov, patron));
  }
  
  const contenido = lineas.join('\r\n');
  const checksum = calcularChecksum(contenido);
  const fechaStr = formatFechaIDSE(new Date());
  
  return {
    nombreArchivo: `${limpiarRegistroPatronal(patron.registroPatronal)}_MODIF_${fechaStr}.txt`,
    contenido,
    registros: lineas.length,
    checksum,
    tipoArchivo: 'modificacion',
  };
}

/**
 * Genera todos los archivos IDSE agrupados por tipo de movimiento
 */
export function generarArchivosIDSE(
  patron: DatosPatronIDSE,
  movimientos: MovimientoIDSE[]
): ArchivoIDSE[] {
  const archivos: ArchivoIDSE[] = [];
  
  const altas = movimientos.filter(m => m.tipoMovimiento === 'alta' || m.tipoMovimiento === 'reingreso');
  const bajas = movimientos.filter(m => m.tipoMovimiento === 'baja');
  const modificaciones = movimientos.filter(m => m.tipoMovimiento === 'modificacion_salario');
  
  if (altas.length > 0) {
    archivos.push(generarArchivoAltas(patron, altas));
  }
  
  if (bajas.length > 0) {
    archivos.push(generarArchivoBajas(patron, bajas));
  }
  
  if (modificaciones.length > 0) {
    archivos.push(generarArchivoModificaciones(patron, modificaciones));
  }
  
  return archivos;
}

/**
 * Valida un NSS según el algoritmo del IMSS
 */
export function validarNSS(nss: string): { valido: boolean; mensaje?: string } {
  if (!nss || nss.length !== 11) {
    return { valido: false, mensaje: 'El NSS debe tener 11 dígitos' };
  }
  
  if (!/^\d{11}$/.test(nss)) {
    return { valido: false, mensaje: 'El NSS debe contener solo números' };
  }
  
  const digitoCalculado = calcularDigitoVerificador(nss.slice(0, 10));
  if (nss[10] !== digitoCalculado) {
    return { valido: false, mensaje: 'Dígito verificador inválido' };
  }
  
  return { valido: true };
}

/**
 * Valida un CURP según las reglas del RENAPO
 */
export function validarCURP(curp: string): { valido: boolean; mensaje?: string } {
  if (!curp || curp.length !== 18) {
    return { valido: false, mensaje: 'El CURP debe tener 18 caracteres' };
  }
  
  const patronCURP = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z\d]\d$/;
  if (!patronCURP.test(curp.toUpperCase())) {
    return { valido: false, mensaje: 'Formato de CURP inválido' };
  }
  
  return { valido: true };
}

/**
 * Valida un movimiento antes de generar el archivo
 */
export function validarMovimiento(mov: MovimientoIDSE): { valido: boolean; errores: string[] } {
  const errores: string[] = [];
  
  // Validar NSS
  const validacionNSS = validarNSS(mov.nss);
  if (!validacionNSS.valido) {
    errores.push(`NSS: ${validacionNSS.mensaje}`);
  }
  
  // Validar CURP
  const validacionCURP = validarCURP(mov.curp);
  if (!validacionCURP.valido) {
    errores.push(`CURP: ${validacionCURP.mensaje}`);
  }
  
  // Validar SBC
  if (mov.tipoMovimiento !== 'baja') {
    if (!mov.sbcDiario || mov.sbcDiario <= 0) {
      errores.push('SBC diario debe ser mayor a 0');
    }
    
    // Validar SBC mínimo (salario mínimo)
    const salarioMinimo = 278.80; // 2025
    if (mov.sbcDiario < salarioMinimo) {
      errores.push(`SBC diario no puede ser menor al salario mínimo ($${salarioMinimo})`);
    }
  }
  
  // Validar nombre
  if (!mov.nombre || mov.nombre.trim().length < 2) {
    errores.push('Nombre es requerido');
  }
  
  if (!mov.apellidoPaterno || mov.apellidoPaterno.trim().length < 2) {
    errores.push('Apellido paterno es requerido');
  }
  
  // Validar fecha
  if (!mov.fechaMovimiento) {
    errores.push('Fecha de movimiento es requerida');
  }
  
  return {
    valido: errores.length === 0,
    errores,
  };
}

/**
 * Genera resumen de movimientos para visualización
 */
export function generarResumenMovimientos(movimientos: MovimientoIDSE[]): {
  totalAltas: number;
  totalBajas: number;
  totalModificaciones: number;
  totalReingresos: number;
  resumen: Array<{ tipo: string; cantidad: number; sbcPromedio: number }>;
} {
  const altas = movimientos.filter(m => m.tipoMovimiento === 'alta');
  const bajas = movimientos.filter(m => m.tipoMovimiento === 'baja');
  const modificaciones = movimientos.filter(m => m.tipoMovimiento === 'modificacion_salario');
  const reingresos = movimientos.filter(m => m.tipoMovimiento === 'reingreso');
  
  const calcularSBCPromedio = (movs: MovimientoIDSE[]) => {
    if (movs.length === 0) return 0;
    const suma = movs.reduce((acc, m) => acc + (m.sbcDiario || 0), 0);
    return Math.round((suma / movs.length) * 100) / 100;
  };
  
  return {
    totalAltas: altas.length,
    totalBajas: bajas.length,
    totalModificaciones: modificaciones.length,
    totalReingresos: reingresos.length,
    resumen: [
      { tipo: 'Altas', cantidad: altas.length, sbcPromedio: calcularSBCPromedio(altas) },
      { tipo: 'Bajas', cantidad: bajas.length, sbcPromedio: 0 },
      { tipo: 'Modificaciones de Salario', cantidad: modificaciones.length, sbcPromedio: calcularSBCPromedio(modificaciones) },
      { tipo: 'Reingresos', cantidad: reingresos.length, sbcPromedio: calcularSBCPromedio(reingresos) },
    ],
  };
}
