import { 
  type User, 
  type InsertUser,
  type Employee,
  type InsertEmployee,
  type ConfigurationChangeLog,
  type InsertConfigurationChangeLog,
  type LegalCase,
  type InsertLegalCase,
  type Settlement,
  type InsertSettlement,
  type Lawsuit,
  type InsertLawsuit,
  type BajaSpecialConcept,
  type InsertBajaSpecialConcept,
  type HiringProcess,
  type InsertHiringProcess,
  type Empresa,
  type InsertEmpresa,
  type RegistroPatronal,
  type InsertRegistroPatronal,
  type CredencialSistema,
  type InsertCredencialSistema,
  type CentroTrabajo,
  type InsertCentroTrabajo,
  type TurnoCentroTrabajo,
  type InsertTurnoCentroTrabajo,
  type EmpleadoCentroTrabajo,
  type InsertEmpleadoCentroTrabajo,
  type HoraExtra,
  type InsertHoraExtra,
  type Attendance,
  type InsertAttendance,
  type IncidenciaAsistencia,
  type InsertIncidenciaAsistencia,
  type GrupoNomina,
  type InsertGrupoNomina,
  type PayrollPeriod,
  type InsertPayrollPeriod,
  type ClienteREPSE,
  type InsertClienteREPSE,
  type RegistroREPSE,
  type InsertRegistroREPSE,
  type ContratoREPSE,
  type InsertContratoREPSE,
  type AsignacionPersonalREPSE,
  type InsertAsignacionPersonalREPSE,
  type AvisoREPSE,
  type InsertAvisoREPSE,
  configurationChangeLogs,
  legalCases,
  settlements,
  lawsuits,
  bajaSpecialConcepts,
  hiringProcess,
  users,
  employees,
  empresas,
  registrosPatronales,
  credencialesSistemas,
  centrosTrabajo,
  turnosCentroTrabajo,
  empleadosCentrosTrabajo,
  horasExtras,
  attendance,
  incidenciasAsistencia,
  gruposNomina,
  payrollPeriods,
  clientesREPSE,
  registrosREPSE,
  contratosREPSE,
  asignacionesPersonalREPSE,
  avisosREPSE
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Employees
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  createBulkEmployees(employees: InsertEmployee[]): Promise<Employee[]>;
  getEmployee(id: string): Promise<Employee | undefined>;
  getEmployees(): Promise<Employee[]>;
  getEmployeesByCentroTrabajo(centroTrabajoId: string): Promise<Employee[]>;
  updateEmployee(id: string, updates: Partial<InsertEmployee>): Promise<Employee>;
  deleteEmployee(id: string): Promise<void>;
  
  // Configuration Change Logs
  createChangeLog(log: InsertConfigurationChangeLog): Promise<ConfigurationChangeLog>;
  getChangeLogs(limit?: number): Promise<ConfigurationChangeLog[]>;
  getChangeLogsByType(changeType: string, periodicidad?: string): Promise<ConfigurationChangeLog[]>;
  
  // Legal Cases
  createLegalCase(legalCase: InsertLegalCase): Promise<LegalCase>;
  getLegalCase(id: string): Promise<LegalCase | undefined>;
  getLegalCases(mode?: string): Promise<LegalCase[]>;
  updateLegalCase(id: string, updates: Partial<InsertLegalCase>): Promise<LegalCase>;
  deleteLegalCase(id: string): Promise<void>;
  
  // Settlements
  createSettlement(settlement: InsertSettlement): Promise<Settlement>;
  getSettlement(id: string): Promise<Settlement | undefined>;
  getSettlements(mode?: string): Promise<Settlement[]>;
  getSettlementsByLegalCase(legalCaseId: string): Promise<Settlement[]>;
  deleteSettlement(id: string): Promise<void>;
  
  // Lawsuits (Demandas)
  createLawsuit(lawsuit: InsertLawsuit): Promise<Lawsuit>;
  getLawsuit(id: string): Promise<Lawsuit | undefined>;
  getLawsuits(): Promise<Lawsuit[]>;
  updateLawsuit(id: string, updates: Partial<InsertLawsuit>): Promise<Lawsuit>;
  deleteLawsuit(id: string): Promise<void>;
  
  // Baja Special Concepts
  createBajaSpecialConcept(concept: InsertBajaSpecialConcept): Promise<BajaSpecialConcept>;
  getBajaSpecialConcepts(legalCaseId: string): Promise<BajaSpecialConcept[]>;
  deleteBajaSpecialConcept(id: string): Promise<void>;
  
  // Hiring Process (Altas)
  createHiringProcess(process: InsertHiringProcess): Promise<HiringProcess>;
  getHiringProcess(id: string): Promise<HiringProcess | undefined>;
  getHiringProcesses(): Promise<HiringProcess[]>;
  updateHiringProcess(id: string, updates: Partial<InsertHiringProcess>): Promise<HiringProcess>;
  deleteHiringProcess(id: string): Promise<void>;
  
  getLawsuitByLegalCaseId(legalCaseId: string): Promise<Lawsuit | undefined>;
  
  // Empresas
  createEmpresa(empresa: InsertEmpresa): Promise<Empresa>;
  getEmpresa(id: string): Promise<Empresa | undefined>;
  getEmpresas(): Promise<Empresa[]>;
  updateEmpresa(id: string, updates: Partial<InsertEmpresa>): Promise<Empresa>;
  deleteEmpresa(id: string): Promise<void>;
  
  // Registros Patronales
  createRegistroPatronal(registro: InsertRegistroPatronal): Promise<RegistroPatronal>;
  getRegistroPatronal(id: string): Promise<RegistroPatronal | undefined>;
  getRegistrosPatronales(): Promise<RegistroPatronal[]>;
  getRegistrosPatronalesByEmpresa(empresaId: string): Promise<RegistroPatronal[]>;
  updateRegistroPatronal(id: string, updates: Partial<InsertRegistroPatronal>): Promise<RegistroPatronal>;
  deleteRegistroPatronal(id: string): Promise<void>;
  
  // Credenciales de Sistemas
  createCredencialSistema(credencial: InsertCredencialSistema): Promise<CredencialSistema>;
  getCredencialSistema(id: string): Promise<CredencialSistema | undefined>;
  getCredencialesSistemas(): Promise<CredencialSistema[]>;
  getCredencialesByEmpresa(empresaId: string): Promise<CredencialSistema[]>;
  getCredencialesByRegistroPatronal(registroPatronalId: string): Promise<CredencialSistema[]>;
  updateCredencialSistema(id: string, updates: Partial<InsertCredencialSistema>): Promise<CredencialSistema>;
  deleteCredencialSistema(id: string): Promise<void>;
  
  // Centros de Trabajo
  createCentroTrabajo(centro: InsertCentroTrabajo): Promise<CentroTrabajo>;
  getCentroTrabajo(id: string): Promise<CentroTrabajo | undefined>;
  getCentrosTrabajo(): Promise<CentroTrabajo[]>;
  getCentrosTrabajoByEmpresa(empresaId: string): Promise<CentroTrabajo[]>;
  updateCentroTrabajo(id: string, updates: Partial<InsertCentroTrabajo>): Promise<CentroTrabajo>;
  deleteCentroTrabajo(id: string): Promise<void>;
  
  // Turnos de Centro de Trabajo
  createTurnoCentroTrabajo(turno: InsertTurnoCentroTrabajo): Promise<TurnoCentroTrabajo>;
  getTurnoCentroTrabajo(id: string): Promise<TurnoCentroTrabajo | undefined>;
  getTurnosCentroTrabajo(): Promise<TurnoCentroTrabajo[]>;
  getTurnosCentroTrabajoByCentro(centroTrabajoId: string): Promise<TurnoCentroTrabajo[]>;
  updateTurnoCentroTrabajo(id: string, updates: Partial<InsertTurnoCentroTrabajo>): Promise<TurnoCentroTrabajo>;
  deleteTurnoCentroTrabajo(id: string): Promise<void>;
  
  // Empleados Centros de Trabajo (Asignaciones)
  createEmpleadoCentroTrabajo(asignacion: InsertEmpleadoCentroTrabajo): Promise<EmpleadoCentroTrabajo>;
  getEmpleadoCentroTrabajo(id: string): Promise<EmpleadoCentroTrabajo | undefined>;
  getEmpleadosCentrosTrabajo(): Promise<EmpleadoCentroTrabajo[]>;
  getEmpleadosCentrosTrabajoByEmpleado(empleadoId: string): Promise<EmpleadoCentroTrabajo[]>;
  getEmpleadosCentrosTabajoByCentro(centroTrabajoId: string): Promise<EmpleadoCentroTrabajo[]>;
  updateEmpleadoCentroTrabajo(id: string, updates: Partial<InsertEmpleadoCentroTrabajo>): Promise<EmpleadoCentroTrabajo>;
  deleteEmpleadoCentroTrabajo(id: string): Promise<void>;
  
  // Attendance (Asistencias)
  createAttendance(attendance: InsertAttendance): Promise<Attendance>;
  getAttendance(id: string): Promise<Attendance | undefined>;
  getAttendances(): Promise<Attendance[]>;
  getAttendancesByEmpleado(empleadoId: string): Promise<Attendance[]>;
  getAttendancesByCentro(centroTrabajoId: string): Promise<Attendance[]>;
  getAttendancesByDate(date: string): Promise<Attendance[]>;
  updateAttendance(id: string, updates: Partial<InsertAttendance>): Promise<Attendance>;
  deleteAttendance(id: string): Promise<void>;
  
  // Incidencias de Asistencia (layout por periodo)
  createIncidenciaAsistencia(incidencia: InsertIncidenciaAsistencia): Promise<IncidenciaAsistencia>;
  getIncidenciaAsistencia(id: string): Promise<IncidenciaAsistencia | undefined>;
  getIncidenciasAsistencia(): Promise<IncidenciaAsistencia[]>;
  getIncidenciasAsistenciaByPeriodo(fechaInicio: string, fechaFin: string, centroTrabajoId?: string): Promise<IncidenciaAsistencia[]>;
  getIncidenciasAsistenciaByEmpleado(empleadoId: string): Promise<IncidenciaAsistencia[]>;
  updateIncidenciaAsistencia(id: string, updates: Partial<InsertIncidenciaAsistencia>): Promise<IncidenciaAsistencia>;
  deleteIncidenciaAsistencia(id: string): Promise<void>;

  // Grupos de Nómina
  createGrupoNomina(grupo: InsertGrupoNomina): Promise<GrupoNomina>;
  getGrupoNomina(id: string): Promise<GrupoNomina | undefined>;
  getGruposNomina(): Promise<GrupoNomina[]>;
  updateGrupoNomina(id: string, updates: Partial<InsertGrupoNomina>): Promise<GrupoNomina>;
  deleteGrupoNomina(id: string): Promise<void>;
  
  // Payroll Periods
  createPayrollPeriods(periods: InsertPayrollPeriod[]): Promise<PayrollPeriod[]>;
  getPayrollPeriodsByGrupo(grupoNominaId: string, year?: number): Promise<PayrollPeriod[]>;
  generatePayrollPeriodsForYear(grupoNominaId: string, year: number): Promise<PayrollPeriod[]>;
  
  // Horas Extras
  createHoraExtra(horaExtra: InsertHoraExtra): Promise<HoraExtra>;
  getHoraExtra(id: string): Promise<HoraExtra | undefined>;
  getHorasExtras(): Promise<HoraExtra[]>;
  getHorasExtrasByEmpleado(empleadoId: string): Promise<HoraExtra[]>;
  getHorasExtrasByCentro(centroTrabajoId: string): Promise<HoraExtra[]>;
  getHorasExtrasByEstatus(estatus: string): Promise<HoraExtra[]>;
  updateHoraExtra(id: string, updates: Partial<InsertHoraExtra>): Promise<HoraExtra>;
  deleteHoraExtra(id: string): Promise<void>;
  
  // REPSE - Clientes
  createClienteREPSE(cliente: InsertClienteREPSE): Promise<ClienteREPSE>;
  getClienteREPSE(id: string): Promise<ClienteREPSE | undefined>;
  getClientesREPSE(): Promise<ClienteREPSE[]>;
  updateClienteREPSE(id: string, updates: Partial<InsertClienteREPSE>): Promise<ClienteREPSE>;
  deleteClienteREPSE(id: string): Promise<void>;
  
  // REPSE - Registros REPSE
  createRegistroREPSE(registro: InsertRegistroREPSE): Promise<RegistroREPSE>;
  getRegistroREPSE(id: string): Promise<RegistroREPSE | undefined>;
  getRegistrosREPSE(): Promise<RegistroREPSE[]>;
  getRegistrosREPSEByEmpresa(empresaId: string): Promise<RegistroREPSE[]>;
  updateRegistroREPSE(id: string, updates: Partial<InsertRegistroREPSE>): Promise<RegistroREPSE>;
  deleteRegistroREPSE(id: string): Promise<void>;
  
  // REPSE - Contratos
  createContratoREPSE(contrato: InsertContratoREPSE): Promise<ContratoREPSE>;
  getContratoREPSE(id: string): Promise<ContratoREPSE | undefined>;
  getContratosREPSE(): Promise<ContratoREPSE[]>;
  getContratosREPSEByEmpresa(empresaId: string): Promise<ContratoREPSE[]>;
  getContratosREPSEByCliente(clienteId: string): Promise<ContratoREPSE[]>;
  getContratosREPSEByRegistro(registroREPSEId: string): Promise<ContratoREPSE[]>;
  updateContratoREPSE(id: string, updates: Partial<InsertContratoREPSE>): Promise<ContratoREPSE>;
  deleteContratoREPSE(id: string): Promise<void>;
  
  // REPSE - Asignaciones de Personal
  createAsignacionPersonalREPSE(asignacion: InsertAsignacionPersonalREPSE): Promise<AsignacionPersonalREPSE>;
  getAsignacionPersonalREPSE(id: string): Promise<AsignacionPersonalREPSE | undefined>;
  getAsignacionesPersonalREPSE(): Promise<AsignacionPersonalREPSE[]>;
  getAsignacionesPersonalREPSEByContrato(contratoREPSEId: string): Promise<AsignacionPersonalREPSE[]>;
  getAsignacionesPersonalREPSEByEmpleado(empleadoId: string): Promise<AsignacionPersonalREPSE[]>;
  updateAsignacionPersonalREPSE(id: string, updates: Partial<InsertAsignacionPersonalREPSE>): Promise<AsignacionPersonalREPSE>;
  deleteAsignacionPersonalREPSE(id: string): Promise<void>;
  
  // REPSE - Avisos
  createAvisoREPSE(aviso: InsertAvisoREPSE): Promise<AvisoREPSE>;
  getAvisoREPSE(id: string): Promise<AvisoREPSE | undefined>;
  getAvisosREPSE(): Promise<AvisoREPSE[]>;
  getAvisosREPSEByEmpresa(empresaId: string): Promise<AvisoREPSE[]>;
  getAvisosREPSEByContrato(contratoREPSEId: string): Promise<AvisoREPSE[]>;
  getAvisosREPSEPendientes(): Promise<AvisoREPSE[]>; // Solo avisos pendientes
  getAvisosREPSEPresentados(): Promise<AvisoREPSE[]>; // Solo avisos presentados
  updateAvisoREPSE(id: string, updates: Partial<InsertAvisoREPSE>): Promise<AvisoREPSE>;
  deleteAvisoREPSE(id: string): Promise<void>;
  marcarAvisoPresentado(id: string, fechaPresentacion: string, numeroFolioSTPS?: string): Promise<AvisoREPSE>; // Helper para marcar como presentado
  generarAvisosTrimestrales(empresaId: string, año: number): Promise<AvisoREPSE[]>; // Generar avisos trimestrales para un año
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Employees
  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    const [newEmployee] = await db
      .insert(employees)
      .values(employee)
      .returning();
    return newEmployee;
  }

  async createBulkEmployees(employeeList: InsertEmployee[]): Promise<Employee[]> {
    if (employeeList.length === 0) {
      return [];
    }
    
    const newEmployees = await db
      .insert(employees)
      .values(employeeList)
      .returning();
    return newEmployees;
  }

  async getEmployee(id: string): Promise<Employee | undefined> {
    const [employee] = await db
      .select()
      .from(employees)
      .where(eq(employees.id, id));
    return employee || undefined;
  }

  async getEmployees(): Promise<Employee[]> {
    return await db
      .select()
      .from(employees)
      .where(eq(employees.estatus, 'activo'));
  }

  async getEmployeesByCentroTrabajo(centroTrabajoId: string): Promise<Employee[]> {
    // JOIN con empleados_centros_trabajo para obtener solo empleados asignados al centro
    const empleadosDelCentro = await db
      .select({ employee: employees })
      .from(employees)
      .innerJoin(empleadosCentrosTrabajo, eq(employees.id, empleadosCentrosTrabajo.empleadoId))
      .where(
        and(
          eq(empleadosCentrosTrabajo.centroTrabajoId, centroTrabajoId),
          eq(empleadosCentrosTrabajo.estatus, 'activo'),
          eq(employees.estatus, 'activo')
        )
      );
    
    return empleadosDelCentro.map(row => row.employee);
  }

  async getEmployeesByGrupoNomina(grupoNominaId: string): Promise<Employee[]> {
    return await db
      .select()
      .from(employees)
      .where(
        and(
          eq(employees.grupoNominaId, grupoNominaId),
          eq(employees.estatus, 'activo')
        )
      );
  }

  async getEmployeesByCentroAndGrupo(centroTrabajoId: string, grupoNominaId: string): Promise<Employee[]> {
    const empleadosDelCentro = await db
      .select({ employee: employees })
      .from(employees)
      .innerJoin(empleadosCentrosTrabajo, eq(employees.id, empleadosCentrosTrabajo.empleadoId))
      .where(
        and(
          eq(empleadosCentrosTrabajo.centroTrabajoId, centroTrabajoId),
          eq(empleadosCentrosTrabajo.estatus, 'activo'),
          eq(employees.grupoNominaId, grupoNominaId),
          eq(employees.estatus, 'activo')
        )
      );
    
    return empleadosDelCentro.map(row => row.employee);
  }

  async updateEmployee(id: string, updates: Partial<InsertEmployee>): Promise<Employee> {
    const [updated] = await db
      .update(employees)
      .set(updates)
      .where(eq(employees.id, id))
      .returning();
    return updated;
  }

  async deleteEmployee(id: string): Promise<void> {
    await db
      .delete(employees)
      .where(eq(employees.id, id));
  }

  async createChangeLog(log: InsertConfigurationChangeLog): Promise<ConfigurationChangeLog> {
    const [changeLog] = await db
      .insert(configurationChangeLogs)
      .values(log)
      .returning();
    return changeLog;
  }

  async getChangeLogs(limit: number = 100): Promise<ConfigurationChangeLog[]> {
    return await db
      .select()
      .from(configurationChangeLogs)
      .orderBy(desc(configurationChangeLogs.changeDate))
      .limit(limit);
  }

  async getChangeLogsByType(changeType: string, periodicidad?: string): Promise<ConfigurationChangeLog[]> {
    if (periodicidad) {
      return await db
        .select()
        .from(configurationChangeLogs)
        .where(
          and(
            eq(configurationChangeLogs.changeType, changeType),
            eq(configurationChangeLogs.periodicidad, periodicidad)
          )
        )
        .orderBy(desc(configurationChangeLogs.changeDate))
        .limit(50);
    }
    
    return await db
      .select()
      .from(configurationChangeLogs)
      .where(eq(configurationChangeLogs.changeType, changeType))
      .orderBy(desc(configurationChangeLogs.changeDate))
      .limit(50);
  }

  // Legal Cases
  async createLegalCase(legalCase: InsertLegalCase): Promise<LegalCase> {
    const [newCase] = await db
      .insert(legalCases)
      .values(legalCase)
      .returning();
    return newCase;
  }

  async getLegalCase(id: string): Promise<LegalCase | undefined> {
    const [legalCase] = await db
      .select()
      .from(legalCases)
      .where(eq(legalCases.id, id));
    return legalCase || undefined;
  }

  async getLegalCases(mode?: string): Promise<LegalCase[]> {
    if (mode) {
      return await db
        .select()
        .from(legalCases)
        .where(eq(legalCases.mode, mode))
        .orderBy(desc(legalCases.createdAt));
    }
    return await db
      .select()
      .from(legalCases)
      .orderBy(desc(legalCases.createdAt));
  }

  async updateLegalCase(id: string, updates: Partial<InsertLegalCase>): Promise<LegalCase> {
    const [updated] = await db
      .update(legalCases)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(legalCases.id, id))
      .returning();
    return updated;
  }

  async deleteLegalCase(id: string): Promise<void> {
    await db
      .delete(legalCases)
      .where(eq(legalCases.id, id));
  }

  // Settlements
  async createSettlement(settlement: InsertSettlement): Promise<Settlement> {
    const [newSettlement] = await db
      .insert(settlements)
      .values(settlement)
      .returning();
    return newSettlement;
  }

  async getSettlement(id: string): Promise<Settlement | undefined> {
    const [settlement] = await db
      .select()
      .from(settlements)
      .where(eq(settlements.id, id));
    return settlement || undefined;
  }

  async getSettlements(mode?: string): Promise<Settlement[]> {
    if (mode) {
      return await db
        .select()
        .from(settlements)
        .where(eq(settlements.mode, mode))
        .orderBy(desc(settlements.createdAt));
    }
    return await db
      .select()
      .from(settlements)
      .orderBy(desc(settlements.createdAt));
  }

  async getSettlementsByLegalCase(legalCaseId: string): Promise<Settlement[]> {
    return await db
      .select()
      .from(settlements)
      .where(eq(settlements.legalCaseId, legalCaseId))
      .orderBy(desc(settlements.createdAt));
  }

  async deleteSettlement(id: string): Promise<void> {
    await db
      .delete(settlements)
      .where(eq(settlements.id, id));
  }

  // Lawsuits (Demandas)
  async createLawsuit(lawsuit: InsertLawsuit): Promise<Lawsuit> {
    const [newLawsuit] = await db
      .insert(lawsuits)
      .values(lawsuit)
      .returning();
    return newLawsuit;
  }

  async getLawsuit(id: string): Promise<Lawsuit | undefined> {
    const [lawsuit] = await db
      .select()
      .from(lawsuits)
      .where(eq(lawsuits.id, id));
    return lawsuit || undefined;
  }

  async getLawsuits(): Promise<Lawsuit[]> {
    return await db
      .select()
      .from(lawsuits)
      .orderBy(desc(lawsuits.createdAt));
  }

  async getLawsuitByLegalCaseId(legalCaseId: string): Promise<Lawsuit | undefined> {
    const [lawsuit] = await db
      .select()
      .from(lawsuits)
      .where(eq(lawsuits.legalCaseId, legalCaseId));
    return lawsuit || undefined;
  }

  async updateLawsuit(id: string, updates: Partial<InsertLawsuit>): Promise<Lawsuit> {
    const [updated] = await db
      .update(lawsuits)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(lawsuits.id, id))
      .returning();
    return updated;
  }

  async deleteLawsuit(id: string): Promise<void> {
    await db
      .delete(lawsuits)
      .where(eq(lawsuits.id, id));
  }
  
  async createBajaSpecialConcept(concept: InsertBajaSpecialConcept): Promise<BajaSpecialConcept> {
    const [created] = await db
      .insert(bajaSpecialConcepts)
      .values(concept)
      .returning();
    return created;
  }
  
  async getBajaSpecialConcepts(legalCaseId: string): Promise<BajaSpecialConcept[]> {
    return await db
      .select()
      .from(bajaSpecialConcepts)
      .where(eq(bajaSpecialConcepts.legalCaseId, legalCaseId))
      .orderBy(desc(bajaSpecialConcepts.createdAt));
  }
  
  async deleteBajaSpecialConcept(id: string): Promise<void> {
    await db
      .delete(bajaSpecialConcepts)
      .where(eq(bajaSpecialConcepts.id, id));
  }
  
  // Hiring Process (Altas)
  async createHiringProcess(process: InsertHiringProcess): Promise<HiringProcess> {
    const [newProcess] = await db
      .insert(hiringProcess)
      .values(process)
      .returning();
    return newProcess;
  }

  async getHiringProcess(id: string): Promise<HiringProcess | undefined> {
    const [process] = await db
      .select()
      .from(hiringProcess)
      .where(eq(hiringProcess.id, id));
    return process || undefined;
  }

  async getHiringProcesses(): Promise<HiringProcess[]> {
    return await db
      .select()
      .from(hiringProcess)
      .orderBy(desc(hiringProcess.createdAt));
  }

  async updateHiringProcess(id: string, updates: Partial<InsertHiringProcess>): Promise<HiringProcess> {
    const [updated] = await db
      .update(hiringProcess)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(hiringProcess.id, id))
      .returning();
    return updated;
  }

  async deleteHiringProcess(id: string): Promise<void> {
    await db
      .delete(hiringProcess)
      .where(eq(hiringProcess.id, id));
  }

  // Empresas
  async createEmpresa(empresa: InsertEmpresa): Promise<Empresa> {
    const [newEmpresa] = await db
      .insert(empresas)
      .values(empresa)
      .returning();
    return newEmpresa;
  }

  async getEmpresa(id: string): Promise<Empresa | undefined> {
    const [empresa] = await db
      .select()
      .from(empresas)
      .where(eq(empresas.id, id));
    return empresa || undefined;
  }

  async getEmpresas(): Promise<Empresa[]> {
    return await db
      .select()
      .from(empresas)
      .orderBy(desc(empresas.createdAt));
  }

  async updateEmpresa(id: string, updates: Partial<InsertEmpresa>): Promise<Empresa> {
    const [updated] = await db
      .update(empresas)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(empresas.id, id))
      .returning();
    return updated;
  }

  async deleteEmpresa(id: string): Promise<void> {
    await db
      .delete(empresas)
      .where(eq(empresas.id, id));
  }

  // Registros Patronales
  async createRegistroPatronal(registro: InsertRegistroPatronal): Promise<RegistroPatronal> {
    const [newRegistro] = await db
      .insert(registrosPatronales)
      .values(registro)
      .returning();
    return newRegistro;
  }

  async getRegistroPatronal(id: string): Promise<RegistroPatronal | undefined> {
    const [registro] = await db
      .select()
      .from(registrosPatronales)
      .where(eq(registrosPatronales.id, id));
    return registro || undefined;
  }

  async getRegistrosPatronales(): Promise<RegistroPatronal[]> {
    return await db
      .select()
      .from(registrosPatronales)
      .orderBy(desc(registrosPatronales.createdAt));
  }

  async getRegistrosPatronalesByEmpresa(empresaId: string): Promise<RegistroPatronal[]> {
    return await db
      .select()
      .from(registrosPatronales)
      .where(eq(registrosPatronales.empresaId, empresaId))
      .orderBy(desc(registrosPatronales.createdAt));
  }

  async updateRegistroPatronal(id: string, updates: Partial<InsertRegistroPatronal>): Promise<RegistroPatronal> {
    const [updated] = await db
      .update(registrosPatronales)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(registrosPatronales.id, id))
      .returning();
    return updated;
  }

  async deleteRegistroPatronal(id: string): Promise<void> {
    await db
      .delete(registrosPatronales)
      .where(eq(registrosPatronales.id, id));
  }

  // Credenciales de Sistemas
  async createCredencialSistema(credencial: InsertCredencialSistema): Promise<CredencialSistema> {
    const [newCredencial] = await db
      .insert(credencialesSistemas)
      .values(credencial)
      .returning();
    return newCredencial;
  }

  async getCredencialSistema(id: string): Promise<CredencialSistema | undefined> {
    const [credencial] = await db
      .select()
      .from(credencialesSistemas)
      .where(eq(credencialesSistemas.id, id));
    return credencial || undefined;
  }

  async getCredencialesSistemas(): Promise<CredencialSistema[]> {
    return await db
      .select()
      .from(credencialesSistemas)
      .orderBy(desc(credencialesSistemas.createdAt));
  }

  async getCredencialesByEmpresa(empresaId: string): Promise<CredencialSistema[]> {
    return await db
      .select()
      .from(credencialesSistemas)
      .where(eq(credencialesSistemas.empresaId, empresaId))
      .orderBy(desc(credencialesSistemas.createdAt));
  }

  async getCredencialesByRegistroPatronal(registroPatronalId: string): Promise<CredencialSistema[]> {
    return await db
      .select()
      .from(credencialesSistemas)
      .where(eq(credencialesSistemas.registroPatronalId, registroPatronalId))
      .orderBy(desc(credencialesSistemas.createdAt));
  }

  async updateCredencialSistema(id: string, updates: Partial<InsertCredencialSistema>): Promise<CredencialSistema> {
    const [updated] = await db
      .update(credencialesSistemas)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(credencialesSistemas.id, id))
      .returning();
    return updated;
  }

  async deleteCredencialSistema(id: string): Promise<void> {
    await db
      .delete(credencialesSistemas)
      .where(eq(credencialesSistemas.id, id));
  }

  // Centros de Trabajo
  async createCentroTrabajo(centro: InsertCentroTrabajo): Promise<CentroTrabajo> {
    const [newCentro] = await db
      .insert(centrosTrabajo)
      .values(centro)
      .returning();
    return newCentro;
  }

  async getCentroTrabajo(id: string): Promise<CentroTrabajo | undefined> {
    const [centro] = await db
      .select()
      .from(centrosTrabajo)
      .where(eq(centrosTrabajo.id, id));
    return centro || undefined;
  }

  async getCentrosTrabajo(): Promise<CentroTrabajo[]> {
    return await db
      .select()
      .from(centrosTrabajo)
      .orderBy(desc(centrosTrabajo.createdAt));
  }

  async getCentrosTrabajoByEmpresa(empresaId: string): Promise<CentroTrabajo[]> {
    return await db
      .select()
      .from(centrosTrabajo)
      .where(eq(centrosTrabajo.empresaId, empresaId))
      .orderBy(desc(centrosTrabajo.createdAt));
  }

  async updateCentroTrabajo(id: string, updates: Partial<InsertCentroTrabajo>): Promise<CentroTrabajo> {
    const [updated] = await db
      .update(centrosTrabajo)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(centrosTrabajo.id, id))
      .returning();
    return updated;
  }

  async deleteCentroTrabajo(id: string): Promise<void> {
    await db
      .delete(centrosTrabajo)
      .where(eq(centrosTrabajo.id, id));
  }

  // Turnos de Centro de Trabajo
  async createTurnoCentroTrabajo(turno: InsertTurnoCentroTrabajo): Promise<TurnoCentroTrabajo> {
    const [newTurno] = await db
      .insert(turnosCentroTrabajo)
      .values(turno)
      .returning();
    return newTurno;
  }

  async getTurnoCentroTrabajo(id: string): Promise<TurnoCentroTrabajo | undefined> {
    const [turno] = await db
      .select()
      .from(turnosCentroTrabajo)
      .where(eq(turnosCentroTrabajo.id, id));
    return turno || undefined;
  }

  async getTurnosCentroTrabajo(): Promise<TurnoCentroTrabajo[]> {
    return await db
      .select()
      .from(turnosCentroTrabajo)
      .orderBy(desc(turnosCentroTrabajo.createdAt));
  }

  async getTurnosCentroTrabajoByCentro(centroTrabajoId: string): Promise<TurnoCentroTrabajo[]> {
    return await db
      .select()
      .from(turnosCentroTrabajo)
      .where(eq(turnosCentroTrabajo.centroTrabajoId, centroTrabajoId))
      .orderBy(desc(turnosCentroTrabajo.createdAt));
  }

  async updateTurnoCentroTrabajo(id: string, updates: Partial<InsertTurnoCentroTrabajo>): Promise<TurnoCentroTrabajo> {
    const [updated] = await db
      .update(turnosCentroTrabajo)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(turnosCentroTrabajo.id, id))
      .returning();
    return updated;
  }

  async deleteTurnoCentroTrabajo(id: string): Promise<void> {
    await db
      .delete(turnosCentroTrabajo)
      .where(eq(turnosCentroTrabajo.id, id));
  }

  // Empleados Centros de Trabajo (Asignaciones)
  async createEmpleadoCentroTrabajo(asignacion: InsertEmpleadoCentroTrabajo): Promise<EmpleadoCentroTrabajo> {
    const [newAsignacion] = await db
      .insert(empleadosCentrosTrabajo)
      .values(asignacion)
      .returning();
    return newAsignacion;
  }

  async getEmpleadoCentroTrabajo(id: string): Promise<EmpleadoCentroTrabajo | undefined> {
    const [asignacion] = await db
      .select()
      .from(empleadosCentrosTrabajo)
      .where(eq(empleadosCentrosTrabajo.id, id));
    return asignacion || undefined;
  }

  async getEmpleadosCentrosTrabajo(): Promise<EmpleadoCentroTrabajo[]> {
    return await db
      .select()
      .from(empleadosCentrosTrabajo)
      .orderBy(desc(empleadosCentrosTrabajo.createdAt));
  }

  async getEmpleadosCentrosTrabajoByEmpleado(empleadoId: string): Promise<EmpleadoCentroTrabajo[]> {
    return await db
      .select()
      .from(empleadosCentrosTrabajo)
      .where(eq(empleadosCentrosTrabajo.empleadoId, empleadoId))
      .orderBy(desc(empleadosCentrosTrabajo.createdAt));
  }

  async getEmpleadosCentrosTabajoByCentro(centroTrabajoId: string): Promise<EmpleadoCentroTrabajo[]> {
    return await db
      .select()
      .from(empleadosCentrosTrabajo)
      .where(eq(empleadosCentrosTrabajo.centroTrabajoId, centroTrabajoId))
      .orderBy(desc(empleadosCentrosTrabajo.createdAt));
  }

  async updateEmpleadoCentroTrabajo(id: string, updates: Partial<InsertEmpleadoCentroTrabajo>): Promise<EmpleadoCentroTrabajo> {
    const [updated] = await db
      .update(empleadosCentrosTrabajo)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(empleadosCentrosTrabajo.id, id))
      .returning();
    return updated;
  }

  async deleteEmpleadoCentroTrabajo(id: string): Promise<void> {
    await db
      .delete(empleadosCentrosTrabajo)
      .where(eq(empleadosCentrosTrabajo.id, id));
  }

  // Attendance (Asistencias)
  async createAttendance(attendanceData: InsertAttendance): Promise<Attendance> {
    const [newAttendance] = await db
      .insert(attendance)
      .values(attendanceData)
      .returning();
    return newAttendance;
  }

  async getAttendance(id: string): Promise<Attendance | undefined> {
    const [attendanceRecord] = await db
      .select()
      .from(attendance)
      .where(eq(attendance.id, id));
    return attendanceRecord || undefined;
  }

  async getAttendances(): Promise<Attendance[]> {
    return await db
      .select()
      .from(attendance)
      .orderBy(desc(attendance.date));
  }

  async getAttendancesByEmpleado(empleadoId: string): Promise<Attendance[]> {
    return await db
      .select()
      .from(attendance)
      .where(eq(attendance.employeeId, empleadoId))
      .orderBy(desc(attendance.date));
  }

  async getAttendancesByCentro(centroTrabajoId: string): Promise<Attendance[]> {
    return await db
      .select()
      .from(attendance)
      .where(eq(attendance.centroTrabajoId, centroTrabajoId))
      .orderBy(desc(attendance.date));
  }

  async getAttendancesByDate(date: string): Promise<Attendance[]> {
    return await db
      .select()
      .from(attendance)
      .where(eq(attendance.date, date))
      .orderBy(desc(attendance.createdAt));
  }

  async updateAttendance(id: string, updates: Partial<InsertAttendance>): Promise<Attendance> {
    const [updated] = await db
      .update(attendance)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(attendance.id, id))
      .returning();
    return updated;
  }

  async deleteAttendance(id: string): Promise<void> {
    await db
      .delete(attendance)
      .where(eq(attendance.id, id));
  }

  // Incidencias de Asistencia
  async createIncidenciaAsistencia(incidenciaData: InsertIncidenciaAsistencia): Promise<IncidenciaAsistencia> {
    const [newIncidencia] = await db
      .insert(incidenciasAsistencia)
      .values(incidenciaData)
      .returning();
    return newIncidencia;
  }

  async getIncidenciaAsistencia(id: string): Promise<IncidenciaAsistencia | undefined> {
    const [incidencia] = await db
      .select()
      .from(incidenciasAsistencia)
      .where(eq(incidenciasAsistencia.id, id));
    return incidencia || undefined;
  }

  async getIncidenciasAsistencia(): Promise<IncidenciaAsistencia[]> {
    return await db
      .select()
      .from(incidenciasAsistencia)
      .orderBy(desc(incidenciasAsistencia.fecha));
  }

  async getIncidenciasAsistenciaByPeriodo(fechaInicio: string, fechaFin: string, centroTrabajoId?: string): Promise<IncidenciaAsistencia[]> {
    const conditions = [
      gte(incidenciasAsistencia.fecha, fechaInicio), // fecha >= fechaInicio
      lte(incidenciasAsistencia.fecha, fechaFin)     // fecha <= fechaFin
    ];

    if (centroTrabajoId) {
      conditions.push(eq(incidenciasAsistencia.centroTrabajoId, centroTrabajoId));
    }

    return await db
      .select()
      .from(incidenciasAsistencia)
      .where(and(...conditions))
      .orderBy(incidenciasAsistencia.employeeId, incidenciasAsistencia.fecha);
  }

  async getIncidenciasAsistenciaByEmpleado(empleadoId: string): Promise<IncidenciaAsistencia[]> {
    return await db
      .select()
      .from(incidenciasAsistencia)
      .where(eq(incidenciasAsistencia.employeeId, empleadoId))
      .orderBy(desc(incidenciasAsistencia.fecha));
  }

  async updateIncidenciaAsistencia(id: string, updates: Partial<InsertIncidenciaAsistencia>): Promise<IncidenciaAsistencia> {
    const [updated] = await db
      .update(incidenciasAsistencia)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(incidenciasAsistencia.id, id))
      .returning();
    return updated;
  }

  async deleteIncidenciaAsistencia(id: string): Promise<void> {
    await db
      .delete(incidenciasAsistencia)
      .where(eq(incidenciasAsistencia.id, id));
  }

  // Grupos de Nómina
  async createGrupoNomina(grupo: InsertGrupoNomina): Promise<GrupoNomina> {
    const [newGrupo] = await db
      .insert(gruposNomina)
      .values(grupo)
      .returning();
    return newGrupo!;
  }

  async getGrupoNomina(id: string): Promise<GrupoNomina | undefined> {
    const [grupo] = await db
      .select()
      .from(gruposNomina)
      .where(eq(gruposNomina.id, id));
    return grupo;
  }

  async getGruposNomina(): Promise<GrupoNomina[]> {
    return await db
      .select()
      .from(gruposNomina)
      .orderBy(gruposNomina.nombre);
  }

  async updateGrupoNomina(id: string, updates: Partial<InsertGrupoNomina>): Promise<GrupoNomina> {
    const [updated] = await db
      .update(gruposNomina)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(gruposNomina.id, id))
      .returning();
    return updated!;
  }

  async deleteGrupoNomina(id: string): Promise<void> {
    await db
      .delete(gruposNomina)
      .where(eq(gruposNomina.id, id));
  }

  // Payroll Periods
  async createPayrollPeriods(periods: InsertPayrollPeriod[]): Promise<PayrollPeriod[]> {
    if (periods.length === 0) return [];
    
    const created = await db
      .insert(payrollPeriods)
      .values(periods)
      .returning();
    return created;
  }

  async getPayrollPeriodsByGrupo(grupoNominaId: string, year?: number): Promise<PayrollPeriod[]> {
    const conditions = [eq(payrollPeriods.grupoNominaId, grupoNominaId)];
    
    if (year) {
      conditions.push(eq(payrollPeriods.year, year));
    }
    
    return await db
      .select()
      .from(payrollPeriods)
      .where(and(...conditions))
      .orderBy(payrollPeriods.year, payrollPeriods.periodNumber);
  }

  async generatePayrollPeriodsForYear(grupoNominaId: string, year: number): Promise<PayrollPeriod[]> {
    // Obtener el grupo para saber el tipo de periodo
    const grupo = await this.getGrupoNomina(grupoNominaId);
    if (!grupo) {
      throw new Error('Grupo de nómina no encontrado');
    }

    const periods: InsertPayrollPeriod[] = [];
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31);
    
    let periodNumber = 1;
    let currentDate = new Date(startOfYear);

    switch (grupo.tipoPeriodo) {
      case 'semanal': {
        // Periodos semanales - aproximadamente 52 periodos al año
        while (currentDate <= endOfYear) {
          // Ajustar al día de inicio de semana configurado
          const dayOfWeek = currentDate.getDay();
          const targetDay = grupo.diaInicioSemana || 1; // Default: lunes
          
          if (dayOfWeek !== targetDay) {
            const diff = (targetDay - dayOfWeek + 7) % 7;
            currentDate.setDate(currentDate.getDate() + (diff === 0 ? 7 : diff));
          }
          
          const periodStart = new Date(currentDate);
          const periodEnd = new Date(currentDate);
          periodEnd.setDate(periodEnd.getDate() + 6);
          
          // Solo agregar si el periodo empieza en este año
          if (periodStart.getFullYear() === year) {
            periods.push({
              grupoNominaId,
              startDate: periodStart.toISOString().split('T')[0],
              endDate: periodEnd.toISOString().split('T')[0],
              frequency: 'semanal',
              year,
              periodNumber: periodNumber++,
              status: 'pending'
            });
          }
          
          currentDate.setDate(currentDate.getDate() + 7);
        }
        break;
      }
      
      case 'catorcenal': {
        // Periodos catorcenales - aproximadamente 26 periodos al año
        while (currentDate <= endOfYear) {
          const dayOfWeek = currentDate.getDay();
          const targetDay = grupo.diaInicioSemana || 1;
          
          if (dayOfWeek !== targetDay) {
            const diff = (targetDay - dayOfWeek + 7) % 7;
            currentDate.setDate(currentDate.getDate() + (diff === 0 ? 7 : diff));
          }
          
          const periodStart = new Date(currentDate);
          const periodEnd = new Date(currentDate);
          periodEnd.setDate(periodEnd.getDate() + 13);
          
          if (periodStart.getFullYear() === year) {
            periods.push({
              grupoNominaId,
              startDate: periodStart.toISOString().split('T')[0],
              endDate: periodEnd.toISOString().split('T')[0],
              frequency: 'catorcenal',
              year,
              periodNumber: periodNumber++,
              status: 'pending'
            });
          }
          
          currentDate.setDate(currentDate.getDate() + 14);
        }
        break;
      }
      
      case 'quincenal': {
        // Periodos quincenales - 24 periodos al año (2 por mes)
        for (let month = 0; month < 12; month++) {
          // Primera quincena: 1-15
          periods.push({
            grupoNominaId,
            startDate: new Date(year, month, 1).toISOString().split('T')[0],
            endDate: new Date(year, month, 15).toISOString().split('T')[0],
            frequency: 'quincenal',
            year,
            periodNumber: periodNumber++,
            status: 'pending'
          });
          
          // Segunda quincena: 16-último día del mes
          const lastDay = new Date(year, month + 1, 0).getDate();
          periods.push({
            grupoNominaId,
            startDate: new Date(year, month, 16).toISOString().split('T')[0],
            endDate: new Date(year, month, lastDay).toISOString().split('T')[0],
            frequency: 'quincenal',
            year,
            periodNumber: periodNumber++,
            status: 'pending'
          });
        }
        break;
      }
      
      case 'mensual': {
        // Periodos mensuales - 12 periodos al año
        for (let month = 0; month < 12; month++) {
          const lastDay = new Date(year, month + 1, 0).getDate();
          periods.push({
            grupoNominaId,
            startDate: new Date(year, month, 1).toISOString().split('T')[0],
            endDate: new Date(year, month, lastDay).toISOString().split('T')[0],
            frequency: 'mensual',
            year,
            periodNumber: periodNumber++,
            status: 'pending'
          });
        }
        break;
      }
      
      default:
        throw new Error(`Tipo de periodo no válido: ${grupo.tipoPeriodo}`);
    }

    // Insertar todos los periodos en la base de datos
    return await this.createPayrollPeriods(periods);
  }

  // Horas Extras
  async createHoraExtra(horaExtra: InsertHoraExtra): Promise<HoraExtra> {
    const [newHoraExtra] = await db
      .insert(horasExtras)
      .values(horaExtra)
      .returning();
    return newHoraExtra;
  }

  async getHoraExtra(id: string): Promise<HoraExtra | undefined> {
    const [horaExtra] = await db
      .select()
      .from(horasExtras)
      .where(eq(horasExtras.id, id));
    return horaExtra || undefined;
  }

  async getHorasExtras(): Promise<HoraExtra[]> {
    return await db
      .select()
      .from(horasExtras)
      .orderBy(desc(horasExtras.fecha));
  }

  async getHorasExtrasByEmpleado(empleadoId: string): Promise<HoraExtra[]> {
    return await db
      .select()
      .from(horasExtras)
      .where(eq(horasExtras.empleadoId, empleadoId))
      .orderBy(desc(horasExtras.fecha));
  }

  async getHorasExtrasByCentro(centroTrabajoId: string): Promise<HoraExtra[]> {
    return await db
      .select()
      .from(horasExtras)
      .where(eq(horasExtras.centroTrabajoId, centroTrabajoId))
      .orderBy(desc(horasExtras.fecha));
  }

  async getHorasExtrasByEstatus(estatus: string): Promise<HoraExtra[]> {
    return await db
      .select()
      .from(horasExtras)
      .where(eq(horasExtras.estatus, estatus))
      .orderBy(desc(horasExtras.fecha));
  }

  async updateHoraExtra(id: string, updates: Partial<InsertHoraExtra>): Promise<HoraExtra> {
    const [updated] = await db
      .update(horasExtras)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(horasExtras.id, id))
      .returning();
    return updated;
  }

  async deleteHoraExtra(id: string): Promise<void> {
    await db
      .delete(horasExtras)
      .where(eq(horasExtras.id, id));
  }

  // ============================================================================
  // REPSE - Clientes
  // ============================================================================
  
  async createClienteREPSE(cliente: InsertClienteREPSE): Promise<ClienteREPSE> {
    const [newCliente] = await db
      .insert(clientesREPSE)
      .values(cliente)
      .returning();
    return newCliente;
  }

  async getClienteREPSE(id: string): Promise<ClienteREPSE | undefined> {
    const [cliente] = await db
      .select()
      .from(clientesREPSE)
      .where(eq(clientesREPSE.id, id));
    return cliente || undefined;
  }

  async getClientesREPSE(): Promise<ClienteREPSE[]> {
    return await db
      .select()
      .from(clientesREPSE)
      .orderBy(desc(clientesREPSE.razonSocial));
  }

  async updateClienteREPSE(id: string, updates: Partial<InsertClienteREPSE>): Promise<ClienteREPSE> {
    const [updated] = await db
      .update(clientesREPSE)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(clientesREPSE.id, id))
      .returning();
    return updated;
  }

  async deleteClienteREPSE(id: string): Promise<void> {
    await db
      .delete(clientesREPSE)
      .where(eq(clientesREPSE.id, id));
  }

  // ============================================================================
  // REPSE - Registros REPSE
  // ============================================================================
  
  async createRegistroREPSE(registro: InsertRegistroREPSE): Promise<RegistroREPSE> {
    const [newRegistro] = await db
      .insert(registrosREPSE)
      .values(registro)
      .returning();
    return newRegistro;
  }

  async getRegistroREPSE(id: string): Promise<RegistroREPSE | undefined> {
    const [registro] = await db
      .select()
      .from(registrosREPSE)
      .where(eq(registrosREPSE.id, id));
    return registro || undefined;
  }

  async getRegistrosREPSE(): Promise<RegistroREPSE[]> {
    return await db
      .select()
      .from(registrosREPSE)
      .orderBy(desc(registrosREPSE.fechaEmision));
  }

  async getRegistrosREPSEByEmpresa(empresaId: string): Promise<RegistroREPSE[]> {
    return await db
      .select()
      .from(registrosREPSE)
      .where(eq(registrosREPSE.empresaId, empresaId))
      .orderBy(desc(registrosREPSE.fechaEmision));
  }

  async updateRegistroREPSE(id: string, updates: Partial<InsertRegistroREPSE>): Promise<RegistroREPSE> {
    const [updated] = await db
      .update(registrosREPSE)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(registrosREPSE.id, id))
      .returning();
    return updated;
  }

  async deleteRegistroREPSE(id: string): Promise<void> {
    await db
      .delete(registrosREPSE)
      .where(eq(registrosREPSE.id, id));
  }

  // ============================================================================
  // REPSE - Contratos
  // ============================================================================
  
  async createContratoREPSE(contrato: InsertContratoREPSE): Promise<ContratoREPSE> {
    const [newContrato] = await db
      .insert(contratosREPSE)
      .values(contrato)
      .returning();
    return newContrato;
  }

  async getContratoREPSE(id: string): Promise<ContratoREPSE | undefined> {
    const [contrato] = await db
      .select()
      .from(contratosREPSE)
      .where(eq(contratosREPSE.id, id));
    return contrato || undefined;
  }

  async getContratosREPSE(): Promise<ContratoREPSE[]> {
    return await db
      .select()
      .from(contratosREPSE)
      .orderBy(desc(contratosREPSE.fechaInicio));
  }

  async getContratosREPSEByEmpresa(empresaId: string): Promise<ContratoREPSE[]> {
    return await db
      .select()
      .from(contratosREPSE)
      .where(eq(contratosREPSE.empresaId, empresaId))
      .orderBy(desc(contratosREPSE.fechaInicio));
  }

  async getContratosREPSEByCliente(clienteId: string): Promise<ContratoREPSE[]> {
    return await db
      .select()
      .from(contratosREPSE)
      .where(eq(contratosREPSE.clienteId, clienteId))
      .orderBy(desc(contratosREPSE.fechaInicio));
  }

  async getContratosREPSEByRegistro(registroREPSEId: string): Promise<ContratoREPSE[]> {
    return await db
      .select()
      .from(contratosREPSE)
      .where(eq(contratosREPSE.registroREPSEId, registroREPSEId))
      .orderBy(desc(contratosREPSE.fechaInicio));
  }

  async updateContratoREPSE(id: string, updates: Partial<InsertContratoREPSE>): Promise<ContratoREPSE> {
    const [updated] = await db
      .update(contratosREPSE)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(contratosREPSE.id, id))
      .returning();
    return updated;
  }

  async deleteContratoREPSE(id: string): Promise<void> {
    await db
      .delete(contratosREPSE)
      .where(eq(contratosREPSE.id, id));
  }

  // ============================================================================
  // REPSE - Asignaciones de Personal
  // ============================================================================
  
  async createAsignacionPersonalREPSE(asignacion: InsertAsignacionPersonalREPSE): Promise<AsignacionPersonalREPSE> {
    const [newAsignacion] = await db
      .insert(asignacionesPersonalREPSE)
      .values(asignacion)
      .returning();
    return newAsignacion;
  }

  async getAsignacionPersonalREPSE(id: string): Promise<AsignacionPersonalREPSE | undefined> {
    const [asignacion] = await db
      .select()
      .from(asignacionesPersonalREPSE)
      .where(eq(asignacionesPersonalREPSE.id, id));
    return asignacion || undefined;
  }

  async getAsignacionesPersonalREPSE(): Promise<AsignacionPersonalREPSE[]> {
    return await db
      .select()
      .from(asignacionesPersonalREPSE)
      .orderBy(desc(asignacionesPersonalREPSE.fechaAsignacion));
  }

  async getAsignacionesPersonalREPSEByContrato(contratoREPSEId: string): Promise<AsignacionPersonalREPSE[]> {
    return await db
      .select()
      .from(asignacionesPersonalREPSE)
      .where(eq(asignacionesPersonalREPSE.contratoREPSEId, contratoREPSEId))
      .orderBy(desc(asignacionesPersonalREPSE.fechaAsignacion));
  }

  async getAsignacionesPersonalREPSEByEmpleado(empleadoId: string): Promise<AsignacionPersonalREPSE[]> {
    return await db
      .select()
      .from(asignacionesPersonalREPSE)
      .where(eq(asignacionesPersonalREPSE.empleadoId, empleadoId))
      .orderBy(desc(asignacionesPersonalREPSE.fechaAsignacion));
  }

  async updateAsignacionPersonalREPSE(id: string, updates: Partial<InsertAsignacionPersonalREPSE>): Promise<AsignacionPersonalREPSE> {
    const [updated] = await db
      .update(asignacionesPersonalREPSE)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(asignacionesPersonalREPSE.id, id))
      .returning();
    return updated;
  }

  async deleteAsignacionPersonalREPSE(id: string): Promise<void> {
    await db
      .delete(asignacionesPersonalREPSE)
      .where(eq(asignacionesPersonalREPSE.id, id));
  }

  // ============================================================================
  // REPSE - Avisos
  // ============================================================================
  
  async createAvisoREPSE(aviso: InsertAvisoREPSE): Promise<AvisoREPSE> {
    const [newAviso] = await db
      .insert(avisosREPSE)
      .values(aviso)
      .returning();
    return newAviso;
  }

  async getAvisoREPSE(id: string): Promise<AvisoREPSE | undefined> {
    const [aviso] = await db
      .select()
      .from(avisosREPSE)
      .where(eq(avisosREPSE.id, id));
    return aviso || undefined;
  }

  async getAvisosREPSE(): Promise<AvisoREPSE[]> {
    return await db
      .select()
      .from(avisosREPSE)
      .orderBy(desc(avisosREPSE.fechaLimite));
  }

  async getAvisosREPSEByEmpresa(empresaId: string): Promise<AvisoREPSE[]> {
    return await db
      .select()
      .from(avisosREPSE)
      .where(eq(avisosREPSE.empresaId, empresaId))
      .orderBy(desc(avisosREPSE.fechaLimite));
  }

  async getAvisosREPSEByContrato(contratoREPSEId: string): Promise<AvisoREPSE[]> {
    return await db
      .select()
      .from(avisosREPSE)
      .where(eq(avisosREPSE.contratoREPSEId, contratoREPSEId))
      .orderBy(desc(avisosREPSE.fechaLimite));
  }

  async getAvisosREPSEPendientes(): Promise<AvisoREPSE[]> {
    return await db
      .select()
      .from(avisosREPSE)
      .where(eq(avisosREPSE.estatus, "PENDIENTE"))
      .orderBy(avisosREPSE.fechaLimite); // Ordenar por fecha límite ascendente (los más urgentes primero)
  }

  async updateAvisoREPSE(id: string, updates: Partial<InsertAvisoREPSE>): Promise<AvisoREPSE> {
    const [updatedAviso] = await db
      .update(avisosREPSE)
      .set(updates)
      .where(eq(avisosREPSE.id, id))
      .returning();
    return updatedAviso;
  }

  async deleteAvisoREPSE(id: string): Promise<void> {
    await db
      .delete(avisosREPSE)
      .where(eq(avisosREPSE.id, id));
  }

  async marcarAvisoPresentado(id: string, fechaPresentacion: string, numeroFolioSTPS?: string): Promise<AvisoREPSE> {
    const updates: Partial<InsertAvisoREPSE> = {
      estatus: "PRESENTADO",
      fechaPresentacion,
    };
    if (numeroFolioSTPS) {
      updates.numeroFolioSTPS = numeroFolioSTPS;
    }
    return this.updateAvisoREPSE(id, updates);
  }

  async getAvisosREPSEPresentados(): Promise<AvisoREPSE[]> {
    return await db
      .select()
      .from(avisosREPSE)
      .where(eq(avisosREPSE.estatus, "PRESENTADO"))
      .orderBy(desc(avisosREPSE.fechaPresentacion));
  }

  async generarAvisosTrimestrales(empresaId: string, año: number): Promise<AvisoREPSE[]> {
    const avisos: AvisoREPSE[] = [];
    
    const trimestresFechasLimite = [
      { trimestre: 1, mes: 4, dia: 17 },
      { trimestre: 2, mes: 7, dia: 17 },
      { trimestre: 3, mes: 10, dia: 17 },
      { trimestre: 4, mes: 1, dia: 17, añoLimite: año + 1 },
    ];

    for (const { trimestre, mes, dia, añoLimite } of trimestresFechasLimite) {
      const añoParaFechaLimite = añoLimite || año;
      const fechaLimite = new Date(añoParaFechaLimite, mes - 1, dia);
      const fechaLimiteStr = fechaLimite.toISOString().split('T')[0];

      const avisosExistentes = await db
        .select()
        .from(avisosREPSE)
        .where(
          and(
            eq(avisosREPSE.empresaId, empresaId),
            eq(avisosREPSE.tipo, "REPORTE_TRIMESTRAL"),
            eq(avisosREPSE.trimestre, trimestre),
            eq(avisosREPSE.año, año)
          )
        );

      if (avisosExistentes.length === 0) {
        const nuevoAviso = await this.createAvisoREPSE({
          tipo: "REPORTE_TRIMESTRAL",
          empresaId,
          descripcion: `Reporte Trimestral Q${trimestre} ${año} - REPSE`,
          fechaLimite: fechaLimiteStr,
          trimestre,
          año,
          estatus: "PENDIENTE",
        });
        avisos.push(nuevoAviso);
      } else {
        avisos.push(avisosExistentes[0]);
      }
    }

    return avisos;
  }
}

export const storage = new DatabaseStorage();
