/**
 * Utilidades para extraer información del CURP mexicano
 * 
 * Estructura del CURP (18 caracteres):
 * - Posiciones 0-3: Primera letra apellido paterno + primera vocal interna apellido paterno + primera letra apellido materno + primera letra nombre
 * - Posiciones 4-9: Fecha de nacimiento (AAMMDD)
 * - Posición 10: Género (H=Hombre, M=Mujer)
 * - Posiciones 11-12: Estado de nacimiento (código de 2 letras)
 * - Posiciones 13-15: Consonantes internas
 * - Posiciones 16-17: Homoclave
 */

export interface CURPData {
  fechaNacimiento: string; // YYYY-MM-DD
  edad: number;
  genero: 'H' | 'M' | null;
  estadoNacimiento: string; // Código de 2 letras
  rfcParcial: string; // Primeras 10 posiciones del RFC (sin homoclave)
  valido: boolean;
  errores: string[];
}

/**
 * Valida el formato básico del CURP
 */
export function validarFormatoCURP(curp: string): { valido: boolean; errores: string[] } {
  const errores: string[] = [];
  
  if (!curp) {
    errores.push('El CURP es requerido');
    return { valido: false, errores };
  }
  
  const curpUpper = curp.toUpperCase().trim();
  
  if (curpUpper.length !== 18) {
    errores.push('El CURP debe tener 18 caracteres');
  }
  
  // Validar formato general: 4 letras, 6 dígitos, 1 letra, 2 letras, 3 consonantes, 2 alfanuméricos
  const formatoRegex = /^[A-Z]{4}\d{6}[HM][A-Z]{2}[B-DF-HJ-NP-TV-Z]{3}[A-Z0-9]{2}$/;
  if (!formatoRegex.test(curpUpper)) {
    errores.push('El formato del CURP no es válido');
  }
  
  return { valido: errores.length === 0, errores };
}

/**
 * Extrae la fecha de nacimiento del CURP
 */
function extraerFechaNacimiento(curp: string): { fecha: string; edad: number } | null {
  if (curp.length < 10) return null;
  
  const curpUpper = curp.toUpperCase();
  const año = curpUpper.substring(4, 6);
  const mes = curpUpper.substring(6, 8);
  const dia = curpUpper.substring(8, 10);
  
  // Determinar el siglo (asumimos que años 00-30 son 2000s, 31-99 son 1900s)
  const añoCompleto = parseInt(año) <= 30 ? `20${año}` : `19${año}`;
  
  const fechaNacimiento = `${añoCompleto}-${mes}-${dia}`;
  
  // Calcular edad
  const hoy = new Date();
  const nacimiento = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const mesActual = hoy.getMonth();
  const mesNacimiento = nacimiento.getMonth();
  
  if (mesActual < mesNacimiento || (mesActual === mesNacimiento && hoy.getDate() < nacimiento.getDate())) {
    edad--;
  }
  
  return { fecha: fechaNacimiento, edad };
}

/**
 * Extrae el género del CURP
 */
function extraerGenero(curp: string): 'H' | 'M' | null {
  if (curp.length < 11) return null;
  
  const generoChar = curp.charAt(10).toUpperCase();
  if (generoChar === 'H' || generoChar === 'M') {
    return generoChar;
  }
  
  return null;
}

/**
 * Extrae el código del estado de nacimiento
 */
function extraerEstadoNacimiento(curp: string): string {
  if (curp.length < 13) return '';
  
  return curp.substring(11, 13).toUpperCase();
}

/**
 * Genera las primeras 10 posiciones del RFC a partir del CURP
 * El RFC completo necesita 3 caracteres más de homoclave que no se pueden derivar del CURP
 */
function generarRFCParcial(curp: string): string {
  if (curp.length < 10) return '';
  
  // Las primeras 10 posiciones del RFC son las primeras 10 del CURP
  return curp.substring(0, 10).toUpperCase();
}

/**
 * Extrae toda la información posible del CURP
 */
export function extraerDatosCURP(curp: string): CURPData {
  const validacion = validarFormatoCURP(curp);
  
  if (!validacion.valido) {
    return {
      fechaNacimiento: '',
      edad: 0,
      genero: null,
      estadoNacimiento: '',
      rfcParcial: '',
      valido: false,
      errores: validacion.errores,
    };
  }
  
  const curpUpper = curp.toUpperCase().trim();
  const fechaData = extraerFechaNacimiento(curpUpper);
  
  return {
    fechaNacimiento: fechaData?.fecha || '',
    edad: fechaData?.edad || 0,
    genero: extraerGenero(curpUpper),
    estadoNacimiento: extraerEstadoNacimiento(curpUpper),
    rfcParcial: generarRFCParcial(curpUpper),
    valido: true,
    errores: [],
  };
}

/**
 * Obtiene el nombre completo del estado a partir del código CURP
 */
export function obtenerNombreEstado(codigoEstado: string): string {
  const estados: Record<string, string> = {
    'AS': 'Aguascalientes',
    'BC': 'Baja California',
    'BS': 'Baja California Sur',
    'CC': 'Campeche',
    'CS': 'Chiapas',
    'CH': 'Chihuahua',
    'CL': 'Coahuila',
    'CM': 'Colima',
    'DF': 'Ciudad de México',
    'DG': 'Durango',
    'GT': 'Guanajuato',
    'GR': 'Guerrero',
    'HG': 'Hidalgo',
    'JC': 'Jalisco',
    'MC': 'México',
    'MN': 'Michoacán',
    'MS': 'Morelos',
    'NT': 'Nayarit',
    'NL': 'Nuevo León',
    'OC': 'Oaxaca',
    'PL': 'Puebla',
    'QT': 'Querétaro',
    'QR': 'Quintana Roo',
    'SP': 'San Luis Potosí',
    'SL': 'Sinaloa',
    'SR': 'Sonora',
    'TC': 'Tabasco',
    'TS': 'Tamaulipas',
    'TL': 'Tlaxcala',
    'VZ': 'Veracruz',
    'YN': 'Yucatán',
    'ZS': 'Zacatecas',
    'NE': 'Nacido en el Extranjero',
  };
  
  return estados[codigoEstado.toUpperCase()] || codigoEstado;
}
