import { db } from "../db";
import { modulos } from "@shared/schema";
import { sql } from "drizzle-orm";

interface ModuloSeed {
  codigo: string;
  nombre: string;
  descripcion: string;
  icono: string;
  orden: number;
}

const modulosSeed: ModuloSeed[] = [
  {
    codigo: "dashboard",
    nombre: "Dashboard",
    descripcion: "Panel principal con métricas y resumen general",
    icono: "LayoutDashboard",
    orden: 1,
  },
  {
    codigo: "personal",
    nombre: "Personal",
    descripcion: "Gestión de empleados: altas, bajas, reingresos, cambios",
    icono: "Users",
    orden: 2,
  },
  {
    codigo: "nomina",
    nombre: "Nómina",
    descripcion: "Procesamiento de nómina y grupos de nómina",
    icono: "DollarSign",
    orden: 3,
  },
  {
    codigo: "asistencia",
    nombre: "Asistencia",
    descripcion: "Control de asistencia y reloj checador",
    icono: "Clock",
    orden: 4,
  },
  {
    codigo: "organizacion",
    nombre: "Organización",
    descripcion: "Puestos y centros de trabajo",
    icono: "Building2",
    orden: 5,
  },
  {
    codigo: "reclutamiento",
    nombre: "Reclutamiento y Selección",
    descripcion: "Vacantes, candidatos y proceso de selección",
    icono: "UserPlus",
    orden: 6,
  },
  {
    codigo: "beneficios",
    nombre: "Beneficios",
    descripcion: "Vacaciones, incapacidades y permisos",
    icono: "Gift",
    orden: 7,
  },
  {
    codigo: "actas_administrativas",
    nombre: "Actas Administrativas",
    descripcion: "Registro y seguimiento de actas administrativas",
    icono: "FileText",
    orden: 8,
  },
  {
    codigo: "creditos",
    nombre: "Créditos",
    descripcion: "Gestión de créditos legales y préstamos internos",
    icono: "CreditCard",
    orden: 9,
  },
  {
    codigo: "empresas",
    nombre: "Empresas",
    descripcion: "Administración de empresas y registros patronales",
    icono: "Factory",
    orden: 10,
  },
  {
    codigo: "legal",
    nombre: "Legal",
    descripcion: "Casos legales y demandas",
    icono: "Scale",
    orden: 11,
  },
  {
    codigo: "repse",
    nombre: "REPSE",
    descripcion: "Cumplimiento REPSE: registros, contratos, avisos",
    icono: "FileCheck",
    orden: 12,
  },
  {
    codigo: "reportes",
    nombre: "Reportes",
    descripcion: "Reportes y análisis",
    icono: "BarChart3",
    orden: 13,
  },
  {
    codigo: "configuracion",
    nombre: "Configuración",
    descripcion: "Configuración general del sistema",
    icono: "Settings",
    orden: 14,
  },
  {
    codigo: "cursos_capacitaciones",
    nombre: "Cursos y Evaluaciones",
    descripcion: "Gestión de cursos, capacitaciones y desarrollo del personal",
    icono: "GraduationCap",
    orden: 15,
  },
];

export async function seedModulos() {
  console.log("🌱 Seeding módulos...");
  
  try {
    for (const modulo of modulosSeed) {
      await db
        .insert(modulos)
        .values({
          codigo: modulo.codigo,
          nombre: modulo.nombre,
          descripcion: modulo.descripcion,
          icono: modulo.icono,
          activo: true,
          orden: modulo.orden,
        })
        .onConflictDoUpdate({
          target: modulos.codigo,
          set: {
            nombre: sql`excluded.nombre`,
            descripcion: sql`excluded.descripcion`,
            icono: sql`excluded.icono`,
            orden: sql`excluded.orden`,
          },
        });
    }
    
    console.log(`✅ ${modulosSeed.length} módulos seeded successfully`);
  } catch (error) {
    console.error("❌ Error seeding módulos:", error);
    throw error;
  }
}
