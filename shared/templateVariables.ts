// ============================================================================
// DOCUMENT TEMPLATE VARIABLES SYSTEM
// Defines all available variables for document templates and interpolation logic
// ============================================================================

export interface TemplateVariable {
  label: string;
  example?: string;
  format?: "currency" | "date_long" | "date_short" | "number" | "text";
  description?: string;
}

export interface TemplateVariableCategory {
  label: string;
  icon: string;
  description?: string;
  variables: Record<string, TemplateVariable>;
}

// All available template variables organized by category
export const templateVariableCategories: Record<string, TemplateVariableCategory> = {
  empleado: {
    label: "Datos del Empleado",
    icon: "User",
    variables: {
      "empleado.nombreCompleto": {
        label: "Nombre completo",
        example: "Juan Pérez García",
        description: "Nombre, apellido paterno y materno del empleado"
      },
      "empleado.nombre": {
        label: "Nombre(s)",
        example: "Juan",
      },
      "empleado.apellidoPaterno": {
        label: "Apellido Paterno",
        example: "Pérez",
      },
      "empleado.apellidoMaterno": {
        label: "Apellido Materno",
        example: "García",
      },
      "empleado.rfc": {
        label: "RFC",
        example: "PEGJ850101ABC",
        description: "Registro Federal de Contribuyentes"
      },
      "empleado.curp": {
        label: "CURP",
        example: "PEGJ850101HDFRRL09",
        description: "Clave Única de Registro de Población"
      },
      "empleado.nss": {
        label: "NSS (IMSS)",
        example: "12345678901",
        description: "Número de Seguro Social"
      },
      "empleado.numeroEmpleado": {
        label: "Número de Empleado",
        example: "EMP-001",
      },
      "empleado.puesto": {
        label: "Puesto",
        example: "Gerente de Ventas",
      },
      "empleado.departamento": {
        label: "Departamento",
        example: "Comercial",
      },
      "empleado.salarioMensual": {
        label: "Salario Mensual Bruto",
        example: "$25,000.00",
        format: "currency",
      },
      "empleado.salarioMensualLetra": {
        label: "Salario Mensual en Letra",
        example: "Veinticinco mil pesos 00/100 M.N.",
        description: "Salario mensual escrito en palabras"
      },
      "empleado.salarioDiario": {
        label: "Salario Diario",
        example: "$833.33",
        format: "currency",
      },
      "empleado.sbc": {
        label: "Salario Base de Cotización",
        example: "$850.00",
        format: "currency",
      },
      "empleado.sdi": {
        label: "Salario Diario Integrado",
        example: "$875.00",
        format: "currency",
      },
      "empleado.fechaIngreso": {
        label: "Fecha de Ingreso",
        example: "15 de enero de 2020",
        format: "date_long",
      },
      "empleado.fechaIngresoCorta": {
        label: "Fecha de Ingreso (corta)",
        example: "15/01/2020",
        format: "date_short",
      },
      "empleado.fechaTerminacion": {
        label: "Fecha de Terminación",
        example: "31 de diciembre de 2024",
        format: "date_long",
      },
      "empleado.fechaAltaImss": {
        label: "Fecha de Alta IMSS",
        example: "15 de enero de 2020",
        format: "date_long",
      },
      "empleado.tipoContrato": {
        label: "Tipo de Contrato",
        example: "Por tiempo indeterminado",
      },
      "empleado.email": {
        label: "Correo Electrónico",
        example: "juan.perez@empresa.com",
      },
      "empleado.telefono": {
        label: "Teléfono",
        example: "55 1234 5678",
      },
      "empleado.domicilioCompleto": {
        label: "Domicilio Completo",
        example: "Av. Reforma 123, Col. Centro, CDMX, 06000",
        description: "Dirección completa del empleado"
      },
      "empleado.calle": {
        label: "Calle",
        example: "Av. Reforma",
      },
      "empleado.numeroExterior": {
        label: "Número Exterior",
        example: "123",
      },
      "empleado.numeroInterior": {
        label: "Número Interior",
        example: "Depto. 4",
      },
      "empleado.colonia": {
        label: "Colonia",
        example: "Centro",
      },
      "empleado.municipio": {
        label: "Municipio/Alcaldía",
        example: "Cuauhtémoc",
      },
      "empleado.estado": {
        label: "Estado",
        example: "Ciudad de México",
      },
      "empleado.codigoPostal": {
        label: "Código Postal",
        example: "06000",
      },
      "empleado.banco": {
        label: "Banco",
        example: "BBVA",
      },
      "empleado.cuenta": {
        label: "Número de Cuenta",
        example: "1234567890",
      },
      "empleado.clabe": {
        label: "CLABE Interbancaria",
        example: "012180001234567897",
      },
      "empleado.diasVacaciones": {
        label: "Días de Vacaciones Anuales",
        example: "12",
        format: "number",
      },
      "empleado.diasVacacionesDisponibles": {
        label: "Días de Vacaciones Disponibles",
        example: "8",
        format: "number",
      },
      "empleado.antiguedadAnios": {
        label: "Antigüedad (años)",
        example: "4",
        format: "number",
      },
      "empleado.antiguedadMeses": {
        label: "Antigüedad (meses)",
        example: "51",
        format: "number",
      },
      "empleado.antiguedadTexto": {
        label: "Antigüedad (texto)",
        example: "4 años y 3 meses",
      },
      "empleado.estadoCivil": {
        label: "Estado Civil",
        example: "Casado(a)",
      },
      "empleado.genero": {
        label: "Género",
        example: "Masculino",
      },
      "empleado.fechaNacimiento": {
        label: "Fecha de Nacimiento",
        example: "1 de enero de 1985",
        format: "date_long",
      },
      "empleado.edad": {
        label: "Edad",
        example: "40",
        format: "number",
      },
      "empleado.nacionalidad": {
        label: "Nacionalidad",
        example: "Mexicana",
      },
      "empleado.escolaridad": {
        label: "Escolaridad",
        example: "Licenciatura",
      },
      "empleado.horario": {
        label: "Horario de Trabajo",
        example: "9:00 a 18:00",
      },
      "empleado.diasLaborales": {
        label: "Días Laborales",
        example: "Lunes a Viernes",
      },
      "empleado.horasSemanales": {
        label: "Horas Semanales",
        example: "48",
        format: "number",
      },
      "empleado.tipoJornada": {
        label: "Tipo de Jornada",
        example: "Diurna",
      },
      "empleado.periodicidadPago": {
        label: "Periodicidad de Pago",
        example: "Quincenal",
      },
      "empleado.formaPago": {
        label: "Forma de Pago",
        example: "Transferencia bancaria",
      },
      "empleado.funciones": {
        label: "Funciones del Puesto",
        example: "Gestión de equipo de ventas, elaboración de reportes...",
      },
      "empleado.jefeDirecto": {
        label: "Jefe Directo",
        example: "María López Hernández",
      },
      "empleado.centroTrabajo": {
        label: "Centro de Trabajo",
        example: "Oficinas Centrales",
      },
      "empleado.lugarTrabajo": {
        label: "Lugar de Trabajo",
        example: "Av. Insurgentes Sur 1234, Col. Del Valle",
      },
      "empleado.modalidadTrabajo": {
        label: "Modalidad de Trabajo",
        example: "Presencial",
      },
    }
  },
  empresa: {
    label: "Datos de la Empresa",
    icon: "Building2",
    variables: {
      "empresa.nombreComercial": {
        label: "Nombre Comercial",
        example: "Acme Corp",
      },
      "empresa.razonSocial": {
        label: "Razón Social",
        example: "Acme Corporation S.A. de C.V.",
        description: "Nombre legal de la empresa"
      },
      "empresa.rfc": {
        label: "RFC",
        example: "ACO851001XYZ",
      },
      "empresa.regimenFiscal": {
        label: "Régimen Fiscal",
        example: "601 - General de Ley Personas Morales",
      },
      "empresa.domicilioCompleto": {
        label: "Domicilio Fiscal Completo",
        example: "Av. Principal 456, Col. Industrial, Monterrey, NL, 64000",
      },
      "empresa.calle": {
        label: "Calle",
        example: "Av. Principal",
      },
      "empresa.numero": {
        label: "Número",
        example: "456",
      },
      "empresa.colonia": {
        label: "Colonia",
        example: "Industrial",
      },
      "empresa.municipio": {
        label: "Municipio",
        example: "Monterrey",
      },
      "empresa.estado": {
        label: "Estado",
        example: "Nuevo León",
      },
      "empresa.codigoPostal": {
        label: "Código Postal",
        example: "64000",
      },
      "empresa.telefono": {
        label: "Teléfono",
        example: "81 1234 5678",
      },
      "empresa.email": {
        label: "Correo Electrónico",
        example: "contacto@acmecorp.com",
      },
      "empresa.representanteLegal": {
        label: "Representante Legal",
        example: "María López Hernández",
      },
      "empresa.registroPatronal": {
        label: "Registro Patronal IMSS",
        example: "A1234567890",
      },
    }
  },
  documento: {
    label: "Datos del Documento",
    icon: "FileText",
    variables: {
      "documento.fechaActual": {
        label: "Fecha Actual",
        example: "25 de enero de 2025",
        format: "date_long",
      },
      "documento.fechaActualCorta": {
        label: "Fecha Actual (corta)",
        example: "25/01/2025",
        format: "date_short",
      },
      "documento.lugarFecha": {
        label: "Lugar y Fecha",
        example: "Ciudad de México, a 25 de enero de 2025",
      },
      "documento.anioActual": {
        label: "Año Actual",
        example: "2025",
      },
      "documento.mesActual": {
        label: "Mes Actual",
        example: "enero",
      },
      "documento.mesActualMayuscula": {
        label: "Mes Actual (Mayúscula)",
        example: "Enero",
      },
      "documento.diaActual": {
        label: "Día Actual",
        example: "25",
      },
      "documento.diaSemanaActual": {
        label: "Día de la Semana",
        example: "sábado",
      },
    }
  },
  custom: {
    label: "Variables Personalizadas",
    icon: "Settings",
    description: "Variables definidas por el usuario al generar el documento",
    variables: {}
  }
};

// Helper to get all variables as a flat list
export function getAllTemplateVariables(): Array<{
  key: string;
  category: string;
  categoryLabel: string;
  variable: TemplateVariable;
}> {
  const result: Array<{
    key: string;
    category: string;
    categoryLabel: string;
    variable: TemplateVariable;
  }> = [];

  for (const [categoryKey, category] of Object.entries(templateVariableCategories)) {
    if (categoryKey === "custom") continue; // Skip custom - it's dynamic
    for (const [varKey, variable] of Object.entries(category.variables)) {
      result.push({
        key: varKey,
        category: categoryKey,
        categoryLabel: category.label,
        variable,
      });
    }
  }

  return result;
}

// Get nested value from object using dot notation
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((acc: unknown, part: string) => {
    if (acc && typeof acc === 'object' && part in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
}

// Format value based on type
function formatValue(value: unknown, format?: string): string {
  if (value === null || value === undefined) return '';

  switch (format) {
    case 'currency':
      const num = typeof value === 'number' ? value : parseFloat(String(value));
      if (isNaN(num)) return String(value);
      return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
      }).format(num);

    case 'date_long':
      const dateLong = value instanceof Date ? value : new Date(String(value));
      if (isNaN(dateLong.getTime())) return String(value);
      return dateLong.toLocaleDateString('es-MX', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

    case 'date_short':
      const dateShort = value instanceof Date ? value : new Date(String(value));
      if (isNaN(dateShort.getTime())) return String(value);
      return dateShort.toLocaleDateString('es-MX', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });

    case 'number':
      const numVal = typeof value === 'number' ? value : parseFloat(String(value));
      if (isNaN(numVal)) return String(value);
      return new Intl.NumberFormat('es-MX').format(numVal);

    default:
      return String(value);
  }
}

// Variable data types for interpolation
export interface VariableData {
  empleado?: Record<string, unknown>;
  empresa?: Record<string, unknown>;
  documento?: Record<string, unknown>;
  custom?: Record<string, unknown>;
}

// Main interpolation function - replaces {{variables}} with actual values
export function interpolateVariables(content: string, data: VariableData): string {
  return content.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
    const trimmedPath = path.trim();
    const [category, ...fieldParts] = trimmedPath.split('.');
    const field = fieldParts.join('.');

    // Get the category data
    const categoryData = data[category as keyof VariableData];
    if (!categoryData) return match; // Keep placeholder if category not found

    // Get the value
    const value = field ? getNestedValue(categoryData as Record<string, unknown>, field) : undefined;
    if (value === undefined || value === null) return match; // Keep placeholder if not found

    // Get format from variable definition if available
    const varDef = templateVariableCategories[category]?.variables[trimmedPath];
    const format = varDef?.format;

    return formatValue(value, format);
  });
}

// Build employee variables from employee data
export function buildEmpleadoVariables(empleado: Record<string, unknown> | null): Record<string, unknown> {
  if (!empleado) return {};

  const nombre = String(empleado.nombre || '');
  const apellidoPaterno = String(empleado.apellidoPaterno || '');
  const apellidoMaterno = String(empleado.apellidoMaterno || '');
  const nombreCompleto = [nombre, apellidoPaterno, apellidoMaterno].filter(Boolean).join(' ');

  // Calculate address
  const domicilioParts = [
    empleado.calle,
    empleado.numeroExterior && `#${empleado.numeroExterior}`,
    empleado.numeroInterior && `Int. ${empleado.numeroInterior}`,
    empleado.colonia && `Col. ${empleado.colonia}`,
    empleado.municipio,
    empleado.estado,
    empleado.codigoPostal && `C.P. ${empleado.codigoPostal}`,
  ].filter(Boolean);
  const domicilioCompleto = domicilioParts.join(', ');

  // Calculate seniority
  const fechaIngreso = empleado.fechaIngreso ? new Date(String(empleado.fechaIngreso)) : null;
  let antiguedadAnios = 0;
  let antiguedadMeses = 0;
  let antiguedadTexto = '';

  if (fechaIngreso && !isNaN(fechaIngreso.getTime())) {
    const now = new Date();
    const diffMs = now.getTime() - fechaIngreso.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    antiguedadAnios = Math.floor(diffDays / 365);
    antiguedadMeses = Math.floor((diffDays % 365) / 30);

    const parts = [];
    if (antiguedadAnios > 0) parts.push(`${antiguedadAnios} año${antiguedadAnios > 1 ? 's' : ''}`);
    if (antiguedadMeses > 0) parts.push(`${antiguedadMeses} mes${antiguedadMeses > 1 ? 'es' : ''}`);
    antiguedadTexto = parts.join(' y ') || 'menos de un mes';
  }

  // Calculate age
  const fechaNacimiento = empleado.fechaNacimiento ? new Date(String(empleado.fechaNacimiento)) : null;
  let edad = 0;
  if (fechaNacimiento && !isNaN(fechaNacimiento.getTime())) {
    const now = new Date();
    edad = now.getFullYear() - fechaNacimiento.getFullYear();
    const m = now.getMonth() - fechaNacimiento.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < fechaNacimiento.getDate())) {
      edad--;
    }
  }

  // Map contract types
  const tipoContratoMap: Record<string, string> = {
    indeterminado: 'Por tiempo indeterminado',
    temporal: 'Por tiempo determinado',
    por_obra: 'Por obra determinada',
    honorarios: 'Por honorarios',
  };

  // Map estado civil
  const estadoCivilMap: Record<string, string> = {
    soltero: 'Soltero(a)',
    casado: 'Casado(a)',
    divorciado: 'Divorciado(a)',
    viudo: 'Viudo(a)',
    union_libre: 'Unión Libre',
  };

  // Map periodicidad
  const periodicidadMap: Record<string, string> = {
    semanal: 'Semanal',
    catorcenal: 'Catorcenal',
    quincenal: 'Quincenal',
    mensual: 'Mensual',
  };

  // Map forma pago
  const formaPagoMap: Record<string, string> = {
    transferencia: 'Transferencia bancaria',
    efectivo: 'Efectivo',
    cheque: 'Cheque',
  };

  // Map tipo jornada
  const tipoJornadaMap: Record<string, string> = {
    diurna: 'Diurna',
    nocturna: 'Nocturna',
    mixta: 'Mixta',
  };

  // Map dias laborales
  const diasLaboralesMap: Record<string, string> = {
    lunes_viernes: 'Lunes a Viernes',
    lunes_sabado: 'Lunes a Sábado',
    variable: 'Variable',
  };

  // Map modalidad trabajo
  const modalidadTrabajoMap: Record<string, string> = {
    presencial: 'Presencial',
    remoto: 'Remoto',
    hibrido: 'Híbrido',
  };

  // Calculate salary values
  const salarioBrutoMensual = empleado.salarioBrutoMensual ? parseFloat(String(empleado.salarioBrutoMensual)) : 0;
  const salarioDiario = salarioBrutoMensual / 30;

  return {
    nombreCompleto,
    nombre,
    apellidoPaterno,
    apellidoMaterno,
    rfc: empleado.rfc || '',
    curp: empleado.curp || '',
    nss: empleado.nss || '',
    numeroEmpleado: empleado.numeroEmpleado || '',
    puesto: empleado.puesto || '',
    departamento: empleado.departamento || '',
    salarioMensual: salarioBrutoMensual,
    salarioMensualLetra: numeroALetras(salarioBrutoMensual),
    salarioDiario,
    sbc: empleado.sbc ? parseFloat(String(empleado.sbc)) : 0,
    sdi: empleado.sdi ? parseFloat(String(empleado.sdi)) : 0,
    fechaIngreso: empleado.fechaIngreso,
    fechaIngresoCorta: empleado.fechaIngreso,
    fechaTerminacion: empleado.fechaTerminacion,
    fechaAltaImss: empleado.fechaAltaImss,
    tipoContrato: tipoContratoMap[String(empleado.tipoContrato)] || empleado.tipoContrato || '',
    email: empleado.email || '',
    telefono: empleado.telefono || '',
    domicilioCompleto,
    calle: empleado.calle || '',
    numeroExterior: empleado.numeroExterior || '',
    numeroInterior: empleado.numeroInterior || '',
    colonia: empleado.colonia || '',
    municipio: empleado.municipio || '',
    estado: empleado.estado || '',
    codigoPostal: empleado.codigoPostal || '',
    banco: empleado.banco || '',
    cuenta: empleado.cuenta || '',
    clabe: empleado.clabe || '',
    diasVacaciones: empleado.diasVacacionesAnuales || 12,
    diasVacacionesDisponibles: empleado.diasVacacionesDisponibles || 0,
    antiguedadAnios,
    antiguedadMeses: antiguedadAnios * 12 + antiguedadMeses,
    antiguedadTexto,
    estadoCivil: estadoCivilMap[String(empleado.estadoCivil)] || empleado.estadoCivil || '',
    genero: empleado.genero === 'M' ? 'Masculino' : empleado.genero === 'F' ? 'Femenino' : empleado.genero || '',
    fechaNacimiento: empleado.fechaNacimiento,
    edad,
    nacionalidad: empleado.nacionalidad || 'Mexicana',
    escolaridad: empleado.escolaridad || '',
    horario: empleado.horario || '',
    diasLaborales: diasLaboralesMap[String(empleado.diasLaborales)] || empleado.diasLaborales || '',
    horasSemanales: empleado.horasSemanales || 48,
    tipoJornada: tipoJornadaMap[String(empleado.tipoJornada)] || empleado.tipoJornada || '',
    periodicidadPago: periodicidadMap[String(empleado.periodicidadPago)] || empleado.periodicidadPago || '',
    formaPago: formaPagoMap[String(empleado.formaPago)] || empleado.formaPago || '',
    funciones: empleado.funciones || '',
    centroTrabajo: '', // TODO: Get from centroTrabajoId
    lugarTrabajo: empleado.lugarTrabajo || '',
    modalidadTrabajo: modalidadTrabajoMap[String(empleado.modalidadTrabajo)] || empleado.modalidadTrabajo || '',
  };
}

// Build empresa variables from empresa data
export function buildEmpresaVariables(empresa: Record<string, unknown> | null): Record<string, unknown> {
  if (!empresa) return {};

  // Build full address
  const domicilioParts = [
    empresa.calle,
    empresa.numero && `#${empresa.numero}`,
    empresa.colonia && `Col. ${empresa.colonia}`,
    empresa.municipio,
    empresa.estado,
    empresa.codigoPostal && `C.P. ${empresa.codigoPostal}`,
  ].filter(Boolean);
  const domicilioCompleto = domicilioParts.join(', ');

  return {
    nombreComercial: empresa.nombreComercial || '',
    razonSocial: empresa.razonSocial || '',
    rfc: empresa.rfc || '',
    regimenFiscal: empresa.regimenFiscal || '',
    domicilioCompleto,
    calle: empresa.calle || '',
    numero: empresa.numero || '',
    colonia: empresa.colonia || '',
    municipio: empresa.municipio || '',
    estado: empresa.estado || '',
    codigoPostal: empresa.codigoPostal || '',
    telefono: empresa.telefono || '',
    email: empresa.email || '',
    representanteLegal: empresa.representanteLegal || '',
    registroPatronal: '', // TODO: Get from registroPatronalId
  };
}

// Build document variables (current date, etc)
export function buildDocumentoVariables(lugar?: string): Record<string, unknown> {
  const now = new Date();
  const meses = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];
  const diasSemana = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

  const dia = now.getDate();
  const mes = meses[now.getMonth()];
  const mesMayuscula = mes.charAt(0).toUpperCase() + mes.slice(1);
  const anio = now.getFullYear();
  const diaSemana = diasSemana[now.getDay()];

  const lugarDefault = lugar || 'Ciudad de México';
  const lugarFecha = `${lugarDefault}, a ${dia} de ${mes} de ${anio}`;

  return {
    fechaActual: now,
    fechaActualCorta: now,
    lugarFecha,
    anioActual: String(anio),
    mesActual: mes,
    mesActualMayuscula: mesMayuscula,
    diaActual: String(dia),
    diaSemanaActual: diaSemana,
  };
}

// Convert number to words (Spanish) - simplified version
function numeroALetras(num: number): string {
  if (num === 0) return 'Cero pesos 00/100 M.N.';

  const unidades = ['', 'un', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
  const decenas = ['', 'diez', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
  const especiales = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
  const centenas = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

  const convertirGrupo = (n: number): string => {
    if (n === 0) return '';
    if (n === 100) return 'cien';

    let resultado = '';
    const c = Math.floor(n / 100);
    const d = Math.floor((n % 100) / 10);
    const u = n % 10;

    if (c > 0) resultado += centenas[c] + ' ';

    if (d === 1 && u > 0) {
      resultado += especiales[u];
    } else if (d === 2 && u > 0) {
      resultado += 'veinti' + unidades[u];
    } else {
      if (d > 0) resultado += decenas[d];
      if (d > 0 && u > 0) resultado += ' y ';
      if (u > 0) resultado += unidades[u];
    }

    return resultado.trim();
  };

  const entero = Math.floor(num);
  const centavos = Math.round((num - entero) * 100);

  let resultado = '';
  const millones = Math.floor(entero / 1000000);
  const miles = Math.floor((entero % 1000000) / 1000);
  const unidadesNum = entero % 1000;

  if (millones > 0) {
    if (millones === 1) {
      resultado += 'un millón ';
    } else {
      resultado += convertirGrupo(millones) + ' millones ';
    }
  }

  if (miles > 0) {
    if (miles === 1) {
      resultado += 'mil ';
    } else {
      resultado += convertirGrupo(miles) + ' mil ';
    }
  }

  if (unidadesNum > 0) {
    resultado += convertirGrupo(unidadesNum);
  }

  resultado = resultado.trim();
  resultado = resultado.charAt(0).toUpperCase() + resultado.slice(1);

  const centavosStr = centavos.toString().padStart(2, '0');
  return `${resultado} pesos ${centavosStr}/100 M.N.`;
}

// Sample data for preview
export function getSampleEmpleadoData(): Record<string, unknown> {
  return {
    nombre: 'Juan',
    apellidoPaterno: 'Pérez',
    apellidoMaterno: 'García',
    rfc: 'PEGJ850101ABC',
    curp: 'PEGJ850101HDFRRL09',
    nss: '12345678901',
    numeroEmpleado: 'EMP-001',
    puesto: 'Gerente de Ventas',
    departamento: 'Comercial',
    salarioBrutoMensual: '25000',
    fechaIngreso: '2020-01-15',
    tipoContrato: 'indeterminado',
    email: 'juan.perez@empresa.com',
    telefono: '55 1234 5678',
    calle: 'Av. Reforma',
    numeroExterior: '123',
    colonia: 'Centro',
    municipio: 'Cuauhtémoc',
    estado: 'Ciudad de México',
    codigoPostal: '06000',
    banco: 'BBVA',
    cuenta: '1234567890',
    clabe: '012180001234567897',
    diasVacacionesAnuales: 12,
    estadoCivil: 'casado',
    genero: 'M',
    fechaNacimiento: '1985-01-01',
    horario: '9:00 a 18:00',
    diasLaborales: 'lunes_viernes',
    horasSemanales: 48,
    tipoJornada: 'diurna',
    periodicidadPago: 'quincenal',
    formaPago: 'transferencia',
    modalidadTrabajo: 'presencial',
  };
}

export function getSampleEmpresaData(): Record<string, unknown> {
  return {
    nombreComercial: 'Acme Corp',
    razonSocial: 'Acme Corporation S.A. de C.V.',
    rfc: 'ACO851001XYZ',
    regimenFiscal: '601 - General de Ley Personas Morales',
    calle: 'Av. Principal',
    numero: '456',
    colonia: 'Industrial',
    municipio: 'Monterrey',
    estado: 'Nuevo León',
    codigoPostal: '64000',
    telefono: '81 1234 5678',
    email: 'contacto@acmecorp.com',
    representanteLegal: 'María López Hernández',
  };
}
