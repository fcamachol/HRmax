/**
 * Catálogos de datos para México
 */

export interface Estado {
  codigo: string; // Código de 2 letras usado en CURP
  nombre: string;
  abreviatura: string; // Abreviatura común
}

export const ESTADOS_MEXICO: Estado[] = [
  { codigo: 'AS', nombre: 'Aguascalientes', abreviatura: 'Ags.' },
  { codigo: 'BC', nombre: 'Baja California', abreviatura: 'BC' },
  { codigo: 'BS', nombre: 'Baja California Sur', abreviatura: 'BCS' },
  { codigo: 'CC', nombre: 'Campeche', abreviatura: 'Camp.' },
  { codigo: 'CS', nombre: 'Chiapas', abreviatura: 'Chis.' },
  { codigo: 'CH', nombre: 'Chihuahua', abreviatura: 'Chih.' },
  { codigo: 'CL', nombre: 'Coahuila', abreviatura: 'Coah.' },
  { codigo: 'CM', nombre: 'Colima', abreviatura: 'Col.' },
  { codigo: 'DF', nombre: 'Ciudad de México', abreviatura: 'CDMX' },
  { codigo: 'DG', nombre: 'Durango', abreviatura: 'Dgo.' },
  { codigo: 'GT', nombre: 'Guanajuato', abreviatura: 'Gto.' },
  { codigo: 'GR', nombre: 'Guerrero', abreviatura: 'Gro.' },
  { codigo: 'HG', nombre: 'Hidalgo', abreviatura: 'Hgo.' },
  { codigo: 'JC', nombre: 'Jalisco', abreviatura: 'Jal.' },
  { codigo: 'MC', nombre: 'México', abreviatura: 'Edomex' },
  { codigo: 'MN', nombre: 'Michoacán', abreviatura: 'Mich.' },
  { codigo: 'MS', nombre: 'Morelos', abreviatura: 'Mor.' },
  { codigo: 'NT', nombre: 'Nayarit', abreviatura: 'Nay.' },
  { codigo: 'NL', nombre: 'Nuevo León', abreviatura: 'NL' },
  { codigo: 'OC', nombre: 'Oaxaca', abreviatura: 'Oax.' },
  { codigo: 'PL', nombre: 'Puebla', abreviatura: 'Pue.' },
  { codigo: 'QT', nombre: 'Querétaro', abreviatura: 'Qro.' },
  { codigo: 'QR', nombre: 'Quintana Roo', abreviatura: 'Q. Roo' },
  { codigo: 'SP', nombre: 'San Luis Potosí', abreviatura: 'SLP' },
  { codigo: 'SL', nombre: 'Sinaloa', abreviatura: 'Sin.' },
  { codigo: 'SR', nombre: 'Sonora', abreviatura: 'Son.' },
  { codigo: 'TC', nombre: 'Tabasco', abreviatura: 'Tab.' },
  { codigo: 'TS', nombre: 'Tamaulipas', abreviatura: 'Tamps.' },
  { codigo: 'TL', nombre: 'Tlaxcala', abreviatura: 'Tlax.' },
  { codigo: 'VZ', nombre: 'Veracruz', abreviatura: 'Ver.' },
  { codigo: 'YN', nombre: 'Yucatán', abreviatura: 'Yuc.' },
  { codigo: 'ZS', nombre: 'Zacatecas', abreviatura: 'Zac.' },
  { codigo: 'NE', nombre: 'Nacido en el Extranjero', abreviatura: 'Extranjero' },
];

export const BANCOS_MEXICO = [
  'ABC Capital',
  'Actinver',
  'Afirme',
  'Autofin',
  'Azteca',
  'Bajío',
  'Bankaool',
  'Banorte',
  'Banregio',
  'BBVA México',
  'Citibanamex',
  'Compartamos',
  'Consubanco',
  'GBM',
  'HSBC',
  'Inbursa',
  'Inmobiliario Mexicano',
  'Intercam',
  'Invex',
  'Mifel',
  'Monex',
  'Multiva',
  'Santander',
  'Scotiabank',
  'Ve por Más',
];

export const FORMAS_PAGO = [
  { value: 'transferencia', label: 'Transferencia Bancaria' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'tarjeta', label: 'Tarjeta de Nómina' },
];

export const PERIODICIDAD_PAGO = [
  { value: 'semanal', label: 'Semanal' },
  { value: 'quincenal', label: 'Quincenal' },
  { value: 'mensual', label: 'Mensual' },
  { value: 'decenal', label: 'Decenal' },
];

export const TIPOS_CONTRATO = [
  { value: 'indeterminado', label: 'Indeterminado' },
  { value: 'temporal', label: 'Temporal' },
  { value: 'por_obra', label: 'Por Obra Determinada' },
  { value: 'prueba', label: 'Prueba' },
  { value: 'honorarios', label: 'Honorarios' },
  { value: 'practicante', label: 'Practicante' },
];

export const DIAS_PRUEBA = [
  { value: '30', label: '30 días' },
  { value: '60', label: '60 días' },
  { value: '90', label: '90 días' },
];

export const PARENTESCOS = [
  'Madre',
  'Padre',
  'Esposo(a)',
  'Hijo(a)',
  'Hermano(a)',
  'Tío(a)',
  'Primo(a)',
  'Abuelo(a)',
  'Otro',
];
