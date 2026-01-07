/**
 * Bank Layout Service
 * Generates bank dispersion files (layouts bancarios) for Mexican payroll
 * Supports BBVA and Santander formats
 */

interface EmployeePaymentData {
  nombre: string;
  rfc: string;
  clabe: string;
  numeroCuenta?: string;
  banco?: string;
  netoAPagar: number;
  referencia?: string;
}

interface LayoutConfig {
  empresaNombre: string;
  empresaRfc: string;
  convenio?: string;
  cuentaConcentradora?: string;
  fechaPago: Date;
  secuencia?: number;
}

/**
 * Remove accents and special characters, convert to uppercase
 */
function normalizeText(text: string, maxLength: number): string {
  const normalized = text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^A-Za-z0-9\s]/g, '') // Remove special chars
    .toUpperCase()
    .trim();
  return normalized.substring(0, maxLength).padEnd(maxLength, ' ');
}

/**
 * Format amount for bank files (cents, zero-padded)
 */
function formatAmount(amount: number, length: number): string {
  const cents = Math.round(amount * 100);
  return cents.toString().padStart(length, '0');
}

/**
 * Format date as YYYYMMDD
 */
function formatDateYYYYMMDD(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}${month}${day}`;
}

/**
 * Format date as DDMMYYYY
 */
function formatDateDDMMYYYY(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${day}${month}${year}`;
}

/**
 * Generate BBVA (Bancomer) Nómina Empresarial layout
 * Fixed-width text format with H (header), D (detail), T (trailer) records
 */
export function generateBBVALayout(
  employees: EmployeePaymentData[],
  config: LayoutConfig
): string {
  const lines: string[] = [];
  const fechaStr = formatDateYYYYMMDD(config.fechaPago);
  const secuencia = (config.secuencia || 1).toString().padStart(6, '0');
  const convenio = (config.convenio || '0000000000000001').padStart(16, '0');

  // Header record (H)
  // Format: H + convenio(16) + fecha(8) + secuencia(6) + filler
  const header = 'H' + 
    convenio + 
    fechaStr + 
    secuencia + 
    ''.padEnd(69, ' ');
  lines.push(header);

  // Detail records (D)
  let totalAmount = 0;
  employees.forEach((emp, index) => {
    const consecutivo = (index + 1).toString().padStart(6, '0');
    const clabe = (emp.clabe || '').padStart(18, '0').substring(0, 18);
    const importe = formatAmount(emp.netoAPagar, 15);
    const nombre = normalizeText(emp.nombre, 40);
    const referencia = normalizeText(emp.referencia || `NOMINA${consecutivo}`, 20);

    // Detail: D + consecutivo(6) + CLABE(18) + importe(15) + nombre(40) + referencia(20) + filler
    const detail = 'D' + 
      consecutivo + 
      clabe + 
      importe + 
      nombre + 
      referencia;
    lines.push(detail);
    totalAmount += emp.netoAPagar;
  });

  // Trailer record (T)
  // Format: T + total_registros(6) + suma_importes(17) + filler
  const totalRegistros = employees.length.toString().padStart(6, '0');
  const sumaImportes = formatAmount(totalAmount, 17);
  const trailer = 'T' + 
    totalRegistros + 
    sumaImportes + 
    ''.padEnd(76, ' ');
  lines.push(trailer);

  return lines.join('\r\n');
}

/**
 * Generate Santander Nómina layout
 * Fixed-width format with 01 (header), 02 (detail), 04 (trailer) records
 */
export function generateSantanderLayout(
  employees: EmployeePaymentData[],
  config: LayoutConfig
): string {
  const lines: string[] = [];
  const fechaStr = formatDateDDMMYYYY(config.fechaPago);
  const codigoCliente = (config.convenio || '00000000').padStart(8, '0');
  const layoutId = 'NOM001';

  // Header record (01)
  // Format: 01 + codigo_cliente(8) + fecha(8) + layout_id(6) + empresa(40) + filler
  const empresaNombre = normalizeText(config.empresaNombre, 40);
  const header = '01' + 
    codigoCliente + 
    fechaStr + 
    layoutId + 
    empresaNombre + 
    ''.padEnd(36, ' ');
  lines.push(header);

  // Detail records (02)
  let totalAmount = 0;
  employees.forEach((emp, index) => {
    const secuencia = (index + 1).toString().padStart(6, '0');
    const clabe = (emp.clabe || '').padStart(18, '0').substring(0, 18);
    const importe = formatAmount(emp.netoAPagar, 15);
    const nombre = normalizeText(emp.nombre, 40);
    const referencia = normalizeText(emp.referencia || 'PAGO NOMINA', 30);
    const descripcion = normalizeText('PAGO NOMINA QUINCENAL', 40);

    // Detail: 02 + secuencia(6) + CLABE(18) + importe(15) + nombre(40) + referencia(30) + descripcion(40)
    const detail = '02' + 
      secuencia + 
      clabe + 
      importe + 
      nombre + 
      referencia +
      descripcion;
    lines.push(detail);
    totalAmount += emp.netoAPagar;
  });

  // Trailer record (04)
  // Format: 04 + total_registros(6) + suma_importes(17) + filler
  const totalRegistros = employees.length.toString().padStart(6, '0');
  const sumaImportes = formatAmount(totalAmount, 17);
  const trailer = '04' + 
    totalRegistros + 
    sumaImportes + 
    ''.padEnd(75, ' ');
  lines.push(trailer);

  return lines.join('\r\n');
}

/**
 * Generate bank layout based on bank type
 */
export function generateBankLayout(
  bank: 'bbva' | 'santander',
  employees: EmployeePaymentData[],
  config: LayoutConfig
): { content: string; filename: string; mimeType: string } {
  const fechaStr = formatDateYYYYMMDD(config.fechaPago);
  
  let content: string;
  let filename: string;

  switch (bank) {
    case 'bbva':
      content = generateBBVALayout(employees, config);
      filename = `DISPERSION_BBVA_${fechaStr}.txt`;
      break;
    case 'santander':
      content = generateSantanderLayout(employees, config);
      filename = `DISPERSION_SANTANDER_${fechaStr}.txt`;
      break;
    default:
      throw new Error(`Banco no soportado: ${bank}`);
  }

  return {
    content,
    filename,
    mimeType: 'text/plain',
  };
}

export type { EmployeePaymentData, LayoutConfig };
