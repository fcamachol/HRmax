import { db } from "../db";
import { employees, empresas, clientes } from "@shared/schema";
import { eq } from "drizzle-orm";

/**
 * Seed 20 mock employees across all salary ranges for demo purposes
 * Salary ranges: minimum wage to executive level
 */

// Mexican first names
const nombres = [
  "Carlos", "María", "José", "Ana", "Juan", "Laura", "Miguel", "Sofía",
  "Francisco", "Gabriela", "Pedro", "Fernanda", "Luis", "Valentina",
  "Roberto", "Camila", "Jorge", "Isabella", "Ricardo", "Mariana"
];

// Mexican last names
const apellidosPaternos = [
  "García", "Martínez", "López", "Hernández", "González", "Rodríguez",
  "Pérez", "Sánchez", "Ramírez", "Torres", "Flores", "Rivera",
  "Gómez", "Díaz", "Cruz", "Morales", "Reyes", "Jiménez", "Ruiz", "Vargas"
];

const apellidosMaternos = [
  "Mendoza", "Ortiz", "Castro", "Rojas", "Aguilar", "Medina",
  "Chávez", "Vega", "Ramos", "Herrera", "Guerrero", "Santos",
  "Molina", "Delgado", "Silva", "Campos", "Navarro", "Domínguez", "Estrada", "Luna"
];

// Departments
const departamentos = [
  "Recursos Humanos", "Contabilidad", "Ventas", "Operaciones",
  "Tecnología", "Marketing", "Administración", "Producción",
  "Logística", "Calidad"
];

// Positions with salary ranges (monthly gross in MXN)
const puestosSalarios = [
  { puesto: "Auxiliar de Limpieza", min: 9500, max: 11000 },
  { puesto: "Recepcionista", min: 10000, max: 13000 },
  { puesto: "Asistente Administrativo", min: 11000, max: 15000 },
  { puesto: "Auxiliar Contable", min: 12000, max: 16000 },
  { puesto: "Vendedor Jr", min: 12000, max: 18000 },
  { puesto: "Técnico de Soporte", min: 14000, max: 20000 },
  { puesto: "Analista de RRHH", min: 18000, max: 25000 },
  { puesto: "Contador General", min: 22000, max: 32000 },
  { puesto: "Desarrollador de Software", min: 25000, max: 45000 },
  { puesto: "Gerente de Ventas", min: 35000, max: 55000 },
  { puesto: "Gerente de Operaciones", min: 40000, max: 65000 },
  { puesto: "Director de Área", min: 55000, max: 85000 },
  { puesto: "Director General", min: 80000, max: 150000 },
];

// Mexican states
const estados = [
  "Ciudad de México", "Estado de México", "Jalisco", "Nuevo León",
  "Puebla", "Guanajuato", "Querétaro", "Veracruz"
];

// Banks
const bancos = ["BBVA", "BANAMEX", "SANTANDER", "BANORTE", "HSBC", "SCOTIABANK"];

function generateCURP(nombre: string, apellidoP: string, apellidoM: string, fechaNac: Date, genero: string): string {
  const year = fechaNac.getFullYear().toString().slice(2);
  const month = (fechaNac.getMonth() + 1).toString().padStart(2, '0');
  const day = fechaNac.getDate().toString().padStart(2, '0');
  const gen = genero === 'masculino' ? 'H' : 'M';
  const estado = 'DF';

  const ap = apellidoP.toUpperCase().replace(/[^A-Z]/g, '');
  const am = apellidoM.toUpperCase().replace(/[^A-Z]/g, '');
  const nom = nombre.toUpperCase().replace(/[^A-Z]/g, '');

  const curp = `${ap.charAt(0)}${ap.match(/[AEIOU]/)?.[0] || 'X'}${am.charAt(0)}${nom.charAt(0)}${year}${month}${day}${gen}${estado}${ap.charAt(1) || 'X'}${am.charAt(1) || 'X'}${nom.charAt(1) || 'X'}00`;
  return curp.slice(0, 18);
}

function generateRFC(nombre: string, apellidoP: string, apellidoM: string, fechaNac: Date): string {
  const year = fechaNac.getFullYear().toString().slice(2);
  const month = (fechaNac.getMonth() + 1).toString().padStart(2, '0');
  const day = fechaNac.getDate().toString().padStart(2, '0');

  const ap = apellidoP.toUpperCase().replace(/[^A-Z]/g, '');
  const am = apellidoM.toUpperCase().replace(/[^A-Z]/g, '');
  const nom = nombre.toUpperCase().replace(/[^A-Z]/g, '');

  const homoclave = String.fromCharCode(65 + Math.floor(Math.random() * 26)) +
                    String.fromCharCode(65 + Math.floor(Math.random() * 26)) +
                    Math.floor(Math.random() * 10);

  return `${ap.charAt(0)}${ap.match(/[AEIOU]/)?.[0] || 'X'}${am.charAt(0)}${nom.charAt(0)}${year}${month}${day}${homoclave}`;
}

function generateNSS(): string {
  const digits = Array(11).fill(0).map(() => Math.floor(Math.random() * 10)).join('');
  return digits;
}

function generateCLABE(): string {
  const digits = Array(18).fill(0).map(() => Math.floor(Math.random() * 10)).join('');
  return digits;
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomSalary(min: number, max: number): number {
  return Math.round((min + Math.random() * (max - min)) / 100) * 100;
}

export async function seedMockEmployees() {
  console.log("Starting mock employees seed...");

  // Get first cliente and empresa, or create them if they don't exist
  let clientesList = await db.select().from(clientes).limit(1);
  let clienteId: string;

  if (clientesList.length === 0) {
    console.log("No clientes found. Creating demo cliente...");
    const [newCliente] = await db.insert(clientes).values({
      nombreComercial: "Demo Corp",
      razonSocial: "Demo Corporation S.A. de C.V.",
      rfc: "DCO010101ABC",
      email: "admin@democorp.com",
      telefono: "5512345678",
      activo: true,
    }).returning();
    clienteId = newCliente.id;
    console.log(`Created cliente: ${clienteId}`);
  } else {
    clienteId = clientesList[0].id;
  }

  let empresasList = await db.select().from(empresas).where(eq(empresas.clienteId, clienteId)).limit(1);
  let empresaId: string;

  if (empresasList.length === 0) {
    console.log("No empresas found. Creating demo empresa...");
    const [newEmpresa] = await db.insert(empresas).values({
      clienteId,
      razonSocial: "Demo Corporation S.A. de C.V.",
      nombreComercial: "Demo Corp",
      rfc: "DCO010101ABC",
      regimenFiscal: "601",
      codigoPostalFiscal: "06600",
      correoElectronico: "facturacion@democorp.com",
      representanteLegal: "Juan Pérez García",
      actividadEconomica: "Servicios de consultoría",
      estatus: "activa",
    }).returning();
    empresaId = newEmpresa.id;
    console.log(`Created empresa: ${empresaId}`);
  } else {
    empresaId = empresasList[0].id;
  }

  console.log(`Using clienteId: ${clienteId}, empresaId: ${empresaId}`);

  // Generate 20 employees across salary ranges
  const mockEmployees = [];

  for (let i = 0; i < 20; i++) {
    const nombre = nombres[i];
    const apellidoPaterno = apellidosPaternos[i];
    const apellidoMaterno = apellidosMaternos[i];
    const genero = i % 2 === 0 ? 'masculino' : 'femenino';

    // Birth date between 1970 and 2000
    const fechaNacimiento = randomDate(new Date(1970, 0, 1), new Date(2000, 11, 31));

    // Hire date between 2018 and 2025
    const fechaIngreso = randomDate(new Date(2018, 0, 1), new Date(2025, 6, 1));

    // Select position based on index to ensure coverage of all salary ranges
    const puestoIdx = Math.floor((i / 20) * puestosSalarios.length);
    const puestoInfo = puestosSalarios[Math.min(puestoIdx + Math.floor(i / 2), puestosSalarios.length - 1)];
    const salarioBrutoMensual = randomSalary(puestoInfo.min, puestoInfo.max);

    const curp = generateCURP(nombre, apellidoPaterno, apellidoMaterno, fechaNacimiento, genero);
    const rfc = generateRFC(nombre, apellidoPaterno, apellidoMaterno, fechaNacimiento);
    const nss = generateNSS();

    mockEmployees.push({
      clienteId,
      empresaId,
      numeroEmpleado: `EMP-${String(i + 1).padStart(4, '0')}`,
      nombre,
      apellidoPaterno,
      apellidoMaterno,
      genero,
      fechaNacimiento: fechaNacimiento.toISOString().split('T')[0],
      curp,
      rfc,
      nss,
      estadoCivil: randomElement(['soltero', 'casado', 'union_libre', 'divorciado']),
      estado: randomElement(estados),
      codigoPostal: String(10000 + Math.floor(Math.random() * 89999)),
      telefono: `55${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
      email: `${nombre.toLowerCase()}.${apellidoPaterno.toLowerCase()}@ejemplo.com`,
      banco: randomElement(bancos),
      clabe: generateCLABE(),
      formaPago: 'transferencia',
      periodicidadPago: randomElement(['quincenal', 'mensual', 'semanal']),
      tipoContrato: 'indeterminado',
      fechaIngreso: fechaIngreso.toISOString().split('T')[0],
      fechaAltaImss: fechaIngreso.toISOString().split('T')[0],
      puesto: puestoInfo.puesto,
      departamento: randomElement(departamentos),
      tipoJornada: 'diurna',
      salarioBrutoMensual: String(salarioBrutoMensual),
      tipoEsquema: 'BRUTO',
      estatus: 'activo',
    });
  }

  // Insert employees
  console.log(`Inserting ${mockEmployees.length} mock employees...`);

  for (const emp of mockEmployees) {
    try {
      await db.insert(employees).values(emp);
      console.log(`Created: ${emp.numeroEmpleado} - ${emp.nombre} ${emp.apellidoPaterno} - ${emp.puesto} - $${emp.salarioBrutoMensual}/mes`);
    } catch (error: any) {
      console.error(`Error creating ${emp.numeroEmpleado}: ${error.message}`);
    }
  }

  console.log("Mock employees seed completed!");
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedMockEmployees()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
