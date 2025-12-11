import { 
  type User, 
  type InsertUser,
  type PublicUser,
  type UpdateUser,
  updateUserSchema,
  type AdminAuditLog,
  type InsertAdminAuditLog,
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
  type Departamento,
  type InsertDepartamento,
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
  type MedioPago,
  type InsertMedioPago,
  type ConceptoMedioPago,
  type InsertConceptoMedioPago,
  type ConceptoMedioPagoWithRelations,
  type PlantillaNomina,
  type InsertPlantillaNomina,
  type PlantillaConcepto,
  type InsertPlantillaConcepto,
  type PlantillaNominaWithConceptos,
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
  type CreditoLegal,
  type InsertCreditoLegal,
  type PrestamoInterno,
  type InsertPrestamoInterno,
  type PagoCreditoDescuento,
  type InsertPagoCreditoDescuento,
  type Puesto,
  type InsertPuesto,
  type Vacante,
  type InsertVacante,
  type Candidato,
  type InsertCandidato,
  type EtapaSeleccion,
  type InsertEtapaSeleccion,
  type ProcesoSeleccion,
  type InsertProcesoSeleccion,
  type Entrevista,
  type InsertEntrevista,
  type Evaluacion,
  type InsertEvaluacion,
  type Oferta,
  type InsertOferta,
  type SolicitudVacaciones,
  type InsertSolicitudVacaciones,
  type CatTablaPrestaciones,
  type InsertCatTablaPrestaciones,
  type KardexVacaciones,
  type InsertKardexVacaciones,
  type Incapacidad,
  type InsertIncapacidad,
  type SolicitudPermiso,
  type InsertSolicitudPermiso,
  type ActaAdministrativa,
  type InsertActaAdministrativa,
  type BancoLayout,
  type InsertBancoLayout,
  type Nomina,
  type InsertNomina,
  type ConceptoNomina,
  type InsertConceptoNomina,
  type PeriodoNomina,
  type InsertPeriodoNomina,
  type IncidenciaNomina,
  type InsertIncidenciaNomina,
  type TipoBeneficio,
  type InsertTipoBeneficio,
  type EsquemaPresta,
  type InsertEsquemaPresta,
  type EsquemaVacacionesRow,
  type InsertEsquemaVacacionesRow,
  type EsquemaBeneficio,
  type InsertEsquemaBeneficio,
  type PuestoBeneficioExtra,
  type InsertPuestoBeneficioExtra,
  type EmpleadoBeneficioExtra,
  type InsertEmpleadoBeneficioExtra,
  type CatBanco,
  type InsertCatBanco,
  type CatValorUmaSmg,
  type InsertCatValorUmaSmg,
  type KardexCompensation,
  type InsertKardexCompensation,
  type CfdiNomina,
  type InsertCfdiNomina,
  type ImssMovimiento,
  type InsertImssMovimiento,
  type SuaBimestre,
  type InsertSuaBimestre,
  type NominaMovimiento,
  type InsertNominaMovimiento,
  type NominaResumen,
  type InsertNominaResumen,
  type LayoutGenerado,
  type InsertLayoutGenerado,
  type Cliente,
  type InsertCliente,
  type Modulo,
  type InsertModulo,
  type UsuarioPermiso,
  type InsertUsuarioPermiso,
  type ModificacionPersonal,
  type InsertModificacionPersonal,
  modificacionesPersonal,
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
  departamentos,
  empleadosCentrosTrabajo,
  horasExtras,
  attendance,
  incidenciasAsistencia,
  gruposNomina,
  mediosPago,
  conceptosMedioPago,
  conceptosMediosPagoRel,
  plantillasNomina,
  plantillaConceptos,
  payrollPeriods,
  clientesREPSE,
  registrosREPSE,
  contratosREPSE,
  asignacionesPersonalREPSE,
  avisosREPSE,
  creditosLegales,
  prestamosInternos,
  pagosCreditosDescuentos,
  puestos,
  vacantes,
  candidatos,
  etapasSeleccion,
  procesoSeleccion,
  historialProcesoSeleccion,
  entrevistas,
  evaluaciones,
  ofertas,
  solicitudesVacaciones,
  catTablasPrestaciones,
  kardexVacaciones,
  incapacidades,
  bancosLayouts,
  nominas,
  conceptosNomina,
  periodosNomina,
  incidenciasNomina,
  nominaMovimientos,
  nominaResumen,
  solicitudesPermisos,
  actasAdministrativas,
  clientes,
  modulos,
  usuariosPermisos,
  adminAuditLogs,
  tiposBeneficio,
  esquemasPresta,
  esquemaVacaciones,
  esquemaBeneficios,
  puestoBeneficiosExtra,
  empleadoBeneficiosExtra,
  layoutsGenerados,
  catBancos,
  catValoresUmaSmg,
  kardexCompensation,
  cfdiNomina,
  imssMovimientos,
  suaBimestres,
  type EmployeeBankAccount,
  type InsertEmployeeBankAccount,
  employeeBankAccounts,
  type KardexEmployment,
  type InsertKardexEmployment,
  kardexEmployment,
  type KardexLaborConditions,
  type InsertKardexLaborConditions,
  kardexLaborConditions,
  type KardexBankAccounts,
  type InsertKardexBankAccounts,
  kardexBankAccounts,
  type CatPais,
  catPaises,
  type CatEstado,
  catEstados,
  type CatMunicipio,
  catMunicipios,
  type CatCodigoPostal,
  catCodigosPostales
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, not, inArray, isNull } from "drizzle-orm";

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
  
  // Modificaciones de Personal (Personnel Modifications)
  createModificacionPersonal(modificacion: InsertModificacionPersonal): Promise<ModificacionPersonal>;
  getModificacionPersonal(id: string): Promise<ModificacionPersonal | undefined>;
  getModificacionesPersonal(): Promise<ModificacionPersonal[]>;
  getModificacionesPersonalByEmpleado(empleadoId: string): Promise<ModificacionPersonal[]>;
  getModificacionesPersonalByTipo(tipoModificacion: string): Promise<ModificacionPersonal[]>;
  getModificacionesPersonalByEstatus(estatus: string): Promise<ModificacionPersonal[]>;
  updateModificacionPersonal(id: string, updates: Partial<InsertModificacionPersonal>): Promise<ModificacionPersonal>;
  deleteModificacionPersonal(id: string): Promise<void>;
  aprobarModificacionPersonal(id: string, aprobadoPor: string): Promise<ModificacionPersonal>;
  rechazarModificacionPersonal(id: string, notasRechazo: string): Promise<ModificacionPersonal>;
  aplicarModificacionPersonal(id: string): Promise<ModificacionPersonal>;
  
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
  
  // Departamentos
  createDepartamento(departamento: InsertDepartamento): Promise<Departamento>;
  getDepartamento(id: string): Promise<Departamento | undefined>;
  getDepartamentos(): Promise<Departamento[]>;
  getDepartamentosByEmpresa(empresaId: string): Promise<Departamento[]>;
  updateDepartamento(id: string, updates: Partial<InsertDepartamento>): Promise<Departamento>;
  deleteDepartamento(id: string): Promise<void>;
  
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
  assignEmployeesToGrupoNomina(grupoNominaId: string, employeeIds: string[]): Promise<void>;
  
  // Medios de Pago
  createMedioPago(medioPago: InsertMedioPago): Promise<MedioPago>;
  getMedioPago(id: string): Promise<MedioPago | undefined>;
  getMediosPago(): Promise<MedioPago[]>;
  updateMedioPago(id: string, updates: Partial<InsertMedioPago>): Promise<MedioPago>;
  deleteMedioPago(id: string): Promise<void>;

  // Conceptos de Medios de Pago
  createConceptoMedioPago(concepto: InsertConceptoMedioPago): Promise<ConceptoMedioPagoWithRelations>;
  getConceptoMedioPago(id: string): Promise<ConceptoMedioPagoWithRelations | undefined>;
  getConceptosMedioPago(): Promise<ConceptoMedioPagoWithRelations[]>;
  updateConceptoMedioPago(id: string, updates: Partial<InsertConceptoMedioPago>): Promise<ConceptoMedioPagoWithRelations>;
  deleteConceptoMedioPago(id: string): Promise<void>;
  
  // Plantillas de Nómina
  createPlantillaNomina(plantilla: InsertPlantillaNomina): Promise<PlantillaNomina>;
  getPlantillaNomina(id: string): Promise<PlantillaNominaWithConceptos | undefined>;
  getPlantillasNomina(): Promise<PlantillaNomina[]>;
  getPlantillasNominaByEmpresa(clienteId: string, empresaId: string): Promise<PlantillaNomina[]>;
  updatePlantillaNomina(id: string, updates: Partial<InsertPlantillaNomina>): Promise<PlantillaNomina>;
  deletePlantillaNomina(id: string): Promise<void>;
  
  // Plantilla Conceptos
  addConceptoToPlantilla(data: InsertPlantillaConcepto): Promise<PlantillaConcepto>;
  updatePlantillaConcepto(id: string, updates: Partial<InsertPlantillaConcepto>): Promise<PlantillaConcepto>;
  removeConceptoFromPlantilla(id: string): Promise<void>;
  getConceptosByPlantilla(plantillaId: string): Promise<(PlantillaConcepto & { concepto: ConceptoMedioPago })[]>;
  
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
  
  // Créditos Legales (INFONAVIT, FONACOT, Pensión Alimenticia, Embargo)
  createCreditoLegal(credito: InsertCreditoLegal): Promise<CreditoLegal>;
  getCreditoLegal(id: string): Promise<CreditoLegal | undefined>;
  getCreditosLegales(): Promise<CreditoLegal[]>;
  getCreditosLegalesByEmpleado(empleadoId: string): Promise<CreditoLegal[]>;
  getCreditosLegalesActivos(): Promise<CreditoLegal[]>;
  getCreditosLegalesByTipo(tipoCredito: string): Promise<CreditoLegal[]>;
  updateCreditoLegal(id: string, updates: Partial<InsertCreditoLegal>): Promise<CreditoLegal>;
  deleteCreditoLegal(id: string): Promise<void>;
  
  // Préstamos Internos
  createPrestamoInterno(prestamo: InsertPrestamoInterno): Promise<PrestamoInterno>;
  getPrestamoInterno(id: string): Promise<PrestamoInterno | undefined>;
  getPrestamosInternos(): Promise<PrestamoInterno[]>;
  getPrestamosInternosByEmpleado(empleadoId: string): Promise<PrestamoInterno[]>;
  getPrestamosInternosActivos(): Promise<PrestamoInterno[]>;
  updatePrestamoInterno(id: string, updates: Partial<InsertPrestamoInterno>): Promise<PrestamoInterno>;
  deletePrestamoInterno(id: string): Promise<void>;
  
  // Pagos de Créditos y Descuentos
  createPagoCreditoDescuento(pago: InsertPagoCreditoDescuento): Promise<PagoCreditoDescuento>;
  getPagoCreditoDescuento(id: string): Promise<PagoCreditoDescuento | undefined>;
  getPagosCreditosDescuentos(): Promise<PagoCreditoDescuento[]>;
  getPagosCreditosDescuentosByEmpleado(empleadoId: string): Promise<PagoCreditoDescuento[]>;
  getPagosCreditosDescuentosByCreditoLegal(creditoLegalId: string): Promise<PagoCreditoDescuento[]>;
  getPagosCreditosDescuentosByPrestamoInterno(prestamoInternoId: string): Promise<PagoCreditoDescuento[]>;
  deletePagoCreditoDescuento(id: string): Promise<void>;
  
  // Puestos (Organización)
  createPuesto(puesto: InsertPuesto): Promise<Puesto>;
  getPuesto(id: string): Promise<Puesto | undefined>;
  getPuestos(): Promise<Puesto[]>;
  getPuestosByClavePuesto(clavePuesto: string): Promise<Puesto | undefined>;
  getPuestosByDepartamento(departamento: string): Promise<Puesto[]>;
  getPuestosActivos(): Promise<Puesto[]>;
  updatePuesto(id: string, updates: Partial<InsertPuesto>): Promise<Puesto>;
  deletePuesto(id: string): Promise<void>;
  getEmployeeCountByPuesto(puestoId: string): Promise<number>;
  getEmployeesByPuesto(puestoId: string): Promise<Employee[]>;
  getAllEmployeeCountsByPuesto(): Promise<Record<string, number>>;
  
  // Reclutamiento y Selección - Vacantes
  createVacante(vacante: InsertVacante): Promise<Vacante>;
  getVacante(id: string): Promise<Vacante | undefined>;
  getVacantes(): Promise<Vacante[]>;
  getVacantesActivas(): Promise<Vacante[]>;
  getVacantesByEstatus(estatus: string): Promise<Vacante[]>;
  updateVacante(id: string, updates: Partial<InsertVacante>): Promise<Vacante>;
  deleteVacante(id: string): Promise<void>;
  
  // Reclutamiento y Selección - Candidatos
  createCandidato(candidato: InsertCandidato): Promise<Candidato>;
  getCandidato(id: string): Promise<Candidato | undefined>;
  getCandidatos(): Promise<Candidato[]>;
  getCandidatosActivos(): Promise<Candidato[]>;
  updateCandidato(id: string, updates: Partial<InsertCandidato>): Promise<Candidato>;
  deleteCandidato(id: string): Promise<void>;
  
  // Reclutamiento y Selección - Etapas de Selección
  createEtapaSeleccion(etapa: InsertEtapaSeleccion): Promise<EtapaSeleccion>;
  getEtapaSeleccion(id: string): Promise<EtapaSeleccion | undefined>;
  getEtapasSeleccion(): Promise<EtapaSeleccion[]>;
  getEtapasSeleccionActivas(): Promise<EtapaSeleccion[]>;
  updateEtapaSeleccion(id: string, updates: Partial<InsertEtapaSeleccion>): Promise<EtapaSeleccion>;
  deleteEtapaSeleccion(id: string): Promise<void>;
  
  // Reclutamiento y Selección - Proceso de Selección
  createProcesoSeleccion(proceso: InsertProcesoSeleccion): Promise<ProcesoSeleccion>;
  getProcesoSeleccion(id: string): Promise<ProcesoSeleccion | undefined>;
  getProcesosSeleccion(): Promise<ProcesoSeleccion[]>;
  getProcesosByVacante(vacanteId: string): Promise<ProcesoSeleccion[]>;
  getProcesosByCandidato(candidatoId: string): Promise<ProcesoSeleccion[]>;
  getProcesosByEtapa(etapaId: string): Promise<ProcesoSeleccion[]>;
  updateProcesoSeleccion(id: string, updates: Partial<InsertProcesoSeleccion>): Promise<ProcesoSeleccion>;
  deleteProcesoSeleccion(id: string): Promise<void>;
  
  // Reclutamiento y Selección - Entrevistas
  createEntrevista(entrevista: InsertEntrevista): Promise<Entrevista>;
  getEntrevista(id: string): Promise<Entrevista | undefined>;
  getEntrevistas(): Promise<Entrevista[]>;
  getEntrevistasByProceso(procesoId: string): Promise<Entrevista[]>;
  updateEntrevista(id: string, updates: Partial<InsertEntrevista>): Promise<Entrevista>;
  deleteEntrevista(id: string): Promise<void>;
  
  // Reclutamiento y Selección - Evaluaciones
  createEvaluacion(evaluacion: InsertEvaluacion): Promise<Evaluacion>;
  getEvaluacion(id: string): Promise<Evaluacion | undefined>;
  getEvaluaciones(): Promise<Evaluacion[]>;
  getEvaluacionesByProceso(procesoId: string): Promise<Evaluacion[]>;
  updateEvaluacion(id: string, updates: Partial<InsertEvaluacion>): Promise<Evaluacion>;
  deleteEvaluacion(id: string): Promise<void>;
  
  // Reclutamiento y Selección - Ofertas
  createOferta(oferta: InsertOferta): Promise<Oferta>;
  getOferta(id: string): Promise<Oferta | undefined>;
  getOfertas(): Promise<Oferta[]>;
  getOfertasByVacante(vacanteId: string): Promise<Oferta[]>;
  getOfertasByCandidato(candidatoId: string): Promise<Oferta[]>;
  updateOferta(id: string, updates: Partial<InsertOferta>): Promise<Oferta>;
  deleteOferta(id: string): Promise<void>;
  
  // Vacaciones (Vacation Management)
  createSolicitudVacaciones(solicitud: InsertSolicitudVacaciones): Promise<SolicitudVacaciones>;
  getSolicitudVacaciones(id: string): Promise<SolicitudVacaciones | undefined>;
  getSolicitudesVacaciones(): Promise<SolicitudVacaciones[]>;
  getSolicitudesVacacionesByEmpleado(empleadoId: string): Promise<SolicitudVacaciones[]>;
  getSolicitudesVacacionesByEstatus(estatus: string): Promise<SolicitudVacaciones[]>;
  updateSolicitudVacaciones(id: string, updates: Partial<InsertSolicitudVacaciones>): Promise<SolicitudVacaciones>;
  deleteSolicitudVacaciones(id: string): Promise<void>;
  
  // Catálogo de Tablas de Prestaciones
  createCatTablaPrestaciones(tabla: InsertCatTablaPrestaciones): Promise<CatTablaPrestaciones>;
  getCatTablaPrestaciones(id: string): Promise<CatTablaPrestaciones | undefined>;
  getCatTablasPrestaciones(): Promise<CatTablaPrestaciones[]>;
  getCatTablasPrestacionesByEsquema(nombreEsquema: string): Promise<CatTablaPrestaciones[]>;
  getCatTablasPrestacionesByEmpresa(empresaId: string): Promise<CatTablaPrestaciones[]>;
  getCatTablaPrestacionesByAnios(nombreEsquema: string, anios: number): Promise<CatTablaPrestaciones | undefined>;
  updateCatTablaPrestaciones(id: string, updates: Partial<InsertCatTablaPrestaciones>): Promise<CatTablaPrestaciones>;
  deleteCatTablaPrestaciones(id: string): Promise<void>;
  
  // Kardex de Vacaciones
  createKardexVacaciones(kardex: InsertKardexVacaciones): Promise<KardexVacaciones>;
  getKardexVacaciones(id: string): Promise<KardexVacaciones | undefined>;
  getKardexVacacionesByEmpleado(empleadoId: string): Promise<KardexVacaciones[]>;
  getKardexVacacionesByEmpleadoYAnio(empleadoId: string, anioAntiguedad: number): Promise<KardexVacaciones[]>;
  getSaldoVacacionesEmpleado(empleadoId: string): Promise<number>;
  updateKardexVacaciones(id: string, updates: Partial<InsertKardexVacaciones>): Promise<KardexVacaciones>;
  deleteKardexVacaciones(id: string): Promise<void>;
  
  // Nuevo Sistema Modular de Prestaciones
  // Tipos de Beneficio (catalog)
  getTiposBeneficio(): Promise<TipoBeneficio[]>;
  getTipoBeneficio(id: string): Promise<TipoBeneficio | undefined>;
  getTipoBeneficioByCodigo(codigo: string): Promise<TipoBeneficio | undefined>;
  
  // Esquemas de Prestaciones
  createEsquemaPresta(esquema: InsertEsquemaPresta): Promise<EsquemaPresta>;
  getEsquemaPresta(id: string): Promise<EsquemaPresta | undefined>;
  getEsquemasPresta(): Promise<EsquemaPresta[]>;
  getEsquemasPrestaActivos(): Promise<EsquemaPresta[]>;
  updateEsquemaPresta(id: string, updates: Partial<InsertEsquemaPresta>): Promise<EsquemaPresta>;
  deleteEsquemaPresta(id: string): Promise<void>;
  
  // Tabla de Vacaciones por Esquema
  createEsquemaVacaciones(row: InsertEsquemaVacacionesRow): Promise<EsquemaVacacionesRow>;
  getEsquemaVacaciones(esquemaId: string): Promise<EsquemaVacacionesRow[]>;
  updateEsquemaVacacionesRow(id: string, updates: Partial<InsertEsquemaVacacionesRow>): Promise<EsquemaVacacionesRow>;
  deleteEsquemaVacacionesRow(id: string): Promise<void>;
  deleteEsquemaVacacionesByEsquema(esquemaId: string): Promise<void>;
  
  // Beneficios por Esquema
  createEsquemaBeneficio(beneficio: InsertEsquemaBeneficio): Promise<EsquemaBeneficio>;
  getEsquemaBeneficios(esquemaId: string): Promise<EsquemaBeneficio[]>;
  updateEsquemaBeneficio(id: string, updates: Partial<InsertEsquemaBeneficio>): Promise<EsquemaBeneficio>;
  deleteEsquemaBeneficio(id: string): Promise<void>;
  deleteEsquemaBeneficiosByEsquema(esquemaId: string): Promise<void>;
  
  // Beneficios Extra por Puesto
  createPuestoBeneficioExtra(beneficio: InsertPuestoBeneficioExtra): Promise<PuestoBeneficioExtra>;
  getPuestoBeneficiosExtra(puestoId: string): Promise<PuestoBeneficioExtra[]>;
  updatePuestoBeneficioExtra(id: string, updates: Partial<InsertPuestoBeneficioExtra>): Promise<PuestoBeneficioExtra>;
  deletePuestoBeneficioExtra(id: string): Promise<void>;
  
  // Beneficios Extra por Empleado
  createEmpleadoBeneficioExtra(beneficio: InsertEmpleadoBeneficioExtra): Promise<EmpleadoBeneficioExtra>;
  getEmpleadoBeneficiosExtra(empleadoId: string): Promise<EmpleadoBeneficioExtra[]>;
  updateEmpleadoBeneficioExtra(id: string, updates: Partial<InsertEmpleadoBeneficioExtra>): Promise<EmpleadoBeneficioExtra>;
  deleteEmpleadoBeneficioExtra(id: string): Promise<void>;
  
  // Incapacidades (Sick Leave Management)
  createIncapacidad(incapacidad: InsertIncapacidad): Promise<Incapacidad>;
  getIncapacidad(id: string): Promise<Incapacidad | undefined>;
  getIncapacidades(): Promise<Incapacidad[]>;
  getIncapacidadesByEmpleado(empleadoId: string): Promise<Incapacidad[]>;
  getIncapacidadesByTipo(tipo: string): Promise<Incapacidad[]>;
  getIncapacidadesByEstatus(estatus: string): Promise<Incapacidad[]>;
  updateIncapacidad(id: string, updates: Partial<InsertIncapacidad>): Promise<Incapacidad>;
  deleteIncapacidad(id: string): Promise<void>;
  
  // Permisos (Permission Requests)
  createSolicitudPermiso(solicitud: InsertSolicitudPermiso): Promise<SolicitudPermiso>;
  getSolicitudPermiso(id: string): Promise<SolicitudPermiso | undefined>;
  getSolicitudesPermisos(): Promise<SolicitudPermiso[]>;
  getSolicitudesPermisosByEmpleado(empleadoId: string): Promise<SolicitudPermiso[]>;
  getSolicitudesPermisosByEstatus(estatus: string): Promise<SolicitudPermiso[]>;
  getSolicitudesPermisosByTipo(tipoPermiso: string): Promise<SolicitudPermiso[]>;
  updateSolicitudPermiso(id: string, updates: Partial<InsertSolicitudPermiso>): Promise<SolicitudPermiso>;
  deleteSolicitudPermiso(id: string): Promise<void>;
  
  // Actas Administrativas
  createActaAdministrativa(acta: InsertActaAdministrativa): Promise<ActaAdministrativa>;
  getActaAdministrativa(id: string): Promise<ActaAdministrativa | undefined>;
  getActasAdministrativas(): Promise<ActaAdministrativa[]>;
  getActasAdministrativasByEmpleado(empleadoId: string): Promise<ActaAdministrativa[]>;
  getActasAdministrativasByEstatus(estatus: string): Promise<ActaAdministrativa[]>;
  updateActaAdministrativa(id: string, updates: Partial<InsertActaAdministrativa>): Promise<ActaAdministrativa>;
  deleteActaAdministrativa(id: string): Promise<void>;
  
  // Bancos Layouts
  createBancoLayout(layout: InsertBancoLayout): Promise<BancoLayout>;
  getBancoLayout(id: string): Promise<BancoLayout | undefined>;
  getBancosLayouts(): Promise<BancoLayout[]>;
  getBancoLayoutByCodigo(codigoBanco: string): Promise<BancoLayout | undefined>;
  getActiveBancosLayouts(): Promise<BancoLayout[]>;
  updateBancoLayout(id: string, updates: Partial<InsertBancoLayout>): Promise<BancoLayout>;
  deleteBancoLayout(id: string): Promise<void>;
  
  // Nóminas
  createNomina(nomina: InsertNomina): Promise<Nomina>;
  getNomina(id: string): Promise<Nomina | undefined>;
  getNominas(): Promise<Nomina[]>;
  getNominasByStatus(status: string): Promise<Nomina[]>;
  getNominasByPeriodo(periodo: string): Promise<Nomina[]>;
  updateNominaStatus(id: string, status: string, aprobadoPor?: string): Promise<Nomina>;
  updateNomina(id: string, updates: Partial<InsertNomina>): Promise<Nomina>;
  deleteNomina(id: string): Promise<void>;

  // Conceptos de Nómina (SAT catalog mappings)
  createConceptoNomina(concepto: InsertConceptoNomina): Promise<ConceptoNomina>;
  getConceptoNomina(id: string): Promise<ConceptoNomina | undefined>;
  getConceptosNomina(): Promise<ConceptoNomina[]>;
  getConceptosNominaActivos(): Promise<ConceptoNomina[]>;
  updateConceptoNomina(id: string, updates: Partial<InsertConceptoNomina>): Promise<ConceptoNomina>;
  deleteConceptoNomina(id: string): Promise<void>;

  // Períodos de Nómina
  createPeriodoNomina(periodo: InsertPeriodoNomina): Promise<PeriodoNomina>;
  getPeriodoNomina(id: string): Promise<PeriodoNomina | undefined>;
  getPeriodosNomina(): Promise<PeriodoNomina[]>;
  getPeriodosNominaByGrupo(grupoNominaId: string): Promise<PeriodoNomina[]>;
  getPeriodosNominaByEmpresa(empresaId: string): Promise<PeriodoNomina[]>;
  updatePeriodoNomina(id: string, updates: Partial<InsertPeriodoNomina>): Promise<PeriodoNomina>;
  deletePeriodoNomina(id: string): Promise<void>;

  // Incidencias de Nómina (overtime, bonuses, deductions)
  createIncidenciaNomina(incidencia: InsertIncidenciaNomina): Promise<IncidenciaNomina>;
  getIncidenciaNomina(id: string): Promise<IncidenciaNomina | undefined>;
  getIncidenciasNomina(): Promise<IncidenciaNomina[]>;
  getIncidenciasNominaByPeriodo(periodoNominaId: string): Promise<IncidenciaNomina[]>;
  getIncidenciasNominaByEmpleado(empleadoId: string): Promise<IncidenciaNomina[]>;
  updateIncidenciaNomina(id: string, updates: Partial<InsertIncidenciaNomina>): Promise<IncidenciaNomina>;
  deleteIncidenciaNomina(id: string): Promise<void>;

  // Movimientos de Nómina (detailed payroll line items)
  createNominaMovimiento(movimiento: InsertNominaMovimiento): Promise<NominaMovimiento>;
  getNominaMovimiento(id: string): Promise<NominaMovimiento | undefined>;
  getNominaMovimientos(): Promise<NominaMovimiento[]>;
  getNominaMovimientosByPeriodo(periodoNominaId: string): Promise<NominaMovimiento[]>;
  getNominaMovimientosByEmpleado(empleadoId: string): Promise<NominaMovimiento[]>;
  deleteNominaMovimiento(id: string): Promise<void>;

  // Resumen de Nómina (payroll summary per employee)
  createNominaResumen(resumen: InsertNominaResumen): Promise<NominaResumen>;
  getNominaResumen(id: string): Promise<NominaResumen | undefined>;
  getNominaResumenes(): Promise<NominaResumen[]>;
  getNominaResumenesByPeriodo(periodoNominaId: string): Promise<NominaResumen[]>;
  getNominaResumenesByEmpleado(empleadoId: string): Promise<NominaResumen[]>;
  deleteNominaResumen(id: string): Promise<void>;
  
  // Clientes
  createCliente(cliente: InsertCliente): Promise<Cliente>;
  getCliente(id: string): Promise<Cliente | undefined>;
  getClientes(): Promise<Cliente[]>;
  getClientesActivos(): Promise<Cliente[]>;
  updateCliente(id: string, updates: Partial<InsertCliente>): Promise<Cliente>;
  deleteCliente(id: string): Promise<void>;
  
  // Módulos
  createModulo(modulo: InsertModulo): Promise<Modulo>;
  getModulo(id: string): Promise<Modulo | undefined>;
  getModulos(): Promise<Modulo[]>;
  getModulosActivos(): Promise<Modulo[]>;
  updateModulo(id: string, updates: Partial<InsertModulo>): Promise<Modulo>;
  deleteModulo(id: string): Promise<void>;
  
  // Usuarios Permisos
  createUsuarioPermiso(permiso: InsertUsuarioPermiso): Promise<UsuarioPermiso>;
  getUsuarioPermiso(id: string): Promise<UsuarioPermiso | undefined>;
  getUsuariosPermisos(): Promise<UsuarioPermiso[]>;
  getPermisosByUsuario(usuarioId: string): Promise<UsuarioPermiso[]>;
  getPermisosByCliente(clienteId: string): Promise<UsuarioPermiso[]>;
  getPermisosByEmpresa(empresaId: string): Promise<UsuarioPermiso[]>;
  updateUsuarioPermiso(id: string, updates: Partial<InsertUsuarioPermiso>): Promise<UsuarioPermiso>;
  deleteUsuarioPermiso(id: string): Promise<void>;
  
  // Helper methods for business logic and validation
  
  // Vacaciones helpers
  checkVacacionesOverlap(empleadoId: string, fechaInicio: string, fechaFin: string, excludeId?: string): Promise<SolicitudVacaciones[]>;
  getPendingVacacionesApprovals(): Promise<SolicitudVacaciones[]>;
  getEmpleadoVacationBalance(empleadoId: string, year: number): Promise<{ disponibles: number, usados: number, pendientes: number }>;
  
  // Incapacidades helpers - with access control
  checkIncapacidadesOverlap(empleadoId: string, fechaInicio: string, fechaFin: string, excludeId?: string): Promise<Incapacidad[]>;
  getIncapacidadesScopedByUser(userId: string, isAdmin: boolean): Promise<Incapacidad[]>; // Access control for sensitive data
  getIncapacidadSecure(id: string, userId: string, isAdmin: boolean): Promise<Incapacidad | undefined>; // Masked data for non-admins
  
  // Permisos helpers
  checkPermisosOverlap(empleadoId: string, fechaInicio: string, fechaFin: string, excludeId?: string): Promise<SolicitudPermiso[]>;
  getPendingPermisosApprovals(): Promise<SolicitudPermiso[]>;
  
  // Super Admin methods
  getAllUsers(): Promise<PublicUser[]>;
  updateUser(id: string, updates: UpdateUser): Promise<User>;
  deleteUser(id: string, actingUserId: string): Promise<void>;
  createAdminAuditLog(log: InsertAdminAuditLog): Promise<AdminAuditLog>;
  getAdminAuditLogs(limit?: number): Promise<AdminAuditLog[]>;
  
  // Layouts Generados (Bank layouts generated from approved payroll)
  createLayoutGenerado(layout: InsertLayoutGenerado): Promise<LayoutGenerado>;
  getLayoutGenerado(id: string): Promise<LayoutGenerado | undefined>;
  getLayoutsGenerados(): Promise<LayoutGenerado[]>;
  getLayoutsGeneradosByNomina(nominaId: string): Promise<LayoutGenerado[]>;
  getLayoutsGeneradosByMedioPago(medioPagoId: string): Promise<LayoutGenerado[]>;
  deleteLayoutGenerado(id: string): Promise<void>;
  deleteLayoutsGeneradosByNomina(nominaId: string): Promise<void>;
  
  // Catálogo de Bancos
  getCatBancos(): Promise<CatBanco[]>;
  getCatBanco(id: string): Promise<CatBanco | undefined>;
  getCatBancoByCodigoSat(codigoSat: string): Promise<CatBanco | undefined>;
  createCatBanco(banco: InsertCatBanco): Promise<CatBanco>;
  
  // Catálogo de Valores UMA/SMG
  getCatValoresUmaSmg(): Promise<CatValorUmaSmg[]>;
  getCatValorUmaSmgVigente(tipo: string, fecha?: string): Promise<CatValorUmaSmg | undefined>;
  createCatValorUmaSmg(valor: InsertCatValorUmaSmg): Promise<CatValorUmaSmg>;
  
  // Kardex Compensation (Historial de cambios salariales)
  createKardexCompensation(kardex: InsertKardexCompensation): Promise<KardexCompensation>;
  getKardexCompensation(id: string): Promise<KardexCompensation | undefined>;
  getKardexCompensationByEmpleado(empleadoId: string): Promise<KardexCompensation[]>;
  getKardexCompensationByEmpresa(empresaId: string): Promise<KardexCompensation[]>;
  
  // CFDI Nómina (Seguimiento de timbrado)
  createCfdiNomina(cfdi: InsertCfdiNomina): Promise<CfdiNomina>;
  getCfdiNomina(id: string): Promise<CfdiNomina | undefined>;
  getCfdiNominaByUuid(uuid: string): Promise<CfdiNomina | undefined>;
  getCfdiNominasByEmpleado(empleadoId: string): Promise<CfdiNomina[]>;
  getCfdiNominasByPeriodo(periodoId: string): Promise<CfdiNomina[]>;
  updateCfdiNomina(id: string, updates: Partial<InsertCfdiNomina>): Promise<CfdiNomina>;
  
  // IMSS Movimientos Afiliatorios (Phase 2)
  createImssMovimiento(movimiento: InsertImssMovimiento): Promise<ImssMovimiento>;
  getImssMovimiento(id: string): Promise<ImssMovimiento | undefined>;
  getImssMovimientosByEmpleado(empleadoId: string): Promise<ImssMovimiento[]>;
  getImssMovimientosByEmpresa(empresaId: string, filters?: { estatus?: string; tipoMovimiento?: string; fechaDesde?: string; fechaHasta?: string }): Promise<ImssMovimiento[]>;
  getImssMovimientosByRegistroPatronal(registroPatronalId: string): Promise<ImssMovimiento[]>;
  getImssMovimientosPendientes(empresaId?: string): Promise<ImssMovimiento[]>;
  updateImssMovimiento(id: string, updates: Partial<InsertImssMovimiento>): Promise<ImssMovimiento>;
  deleteImssMovimiento(id: string): Promise<void>;
  
  // SUA Bimestres (Phase 2)
  createSuaBimestre(bimestre: InsertSuaBimestre): Promise<SuaBimestre>;
  getSuaBimestre(id: string): Promise<SuaBimestre | undefined>;
  getSuaBimestreByPeriodo(registroPatronalId: string, ejercicio: number, bimestre: number): Promise<SuaBimestre | undefined>;
  getSuaBimestresByEmpresa(empresaId: string, ejercicio?: number): Promise<SuaBimestre[]>;
  getSuaBimestresByRegistroPatronal(registroPatronalId: string, ejercicio?: number): Promise<SuaBimestre[]>;
  getSuaBimestresPendientes(empresaId?: string): Promise<SuaBimestre[]>;
  updateSuaBimestre(id: string, updates: Partial<InsertSuaBimestre>): Promise<SuaBimestre>;
  deleteSuaBimestre(id: string): Promise<void>;
  
  // Employee Bank Accounts (Multi-account payment dispersion)
  createEmployeeBankAccount(account: InsertEmployeeBankAccount): Promise<EmployeeBankAccount>;
  getEmployeeBankAccount(id: string): Promise<EmployeeBankAccount | undefined>;
  getEmployeeBankAccountsByEmpleado(empleadoId: string): Promise<EmployeeBankAccount[]>;
  getEmployeeBankAccountsByEmpresa(empresaId: string): Promise<EmployeeBankAccount[]>;
  getEmployeeBankAccountByClabe(clabe: string): Promise<EmployeeBankAccount | undefined>;
  updateEmployeeBankAccount(id: string, updates: Partial<InsertEmployeeBankAccount>): Promise<EmployeeBankAccount>;
  deleteEmployeeBankAccount(id: string): Promise<void>;
  
  // Kardex Employment (Status/Contract tracking)
  createKardexEmployment(kardex: InsertKardexEmployment): Promise<KardexEmployment>;
  getKardexEmployment(id: string): Promise<KardexEmployment | undefined>;
  getKardexEmploymentByEmpleado(empleadoId: string): Promise<KardexEmployment[]>;
  getKardexEmploymentByEmpresa(empresaId: string): Promise<KardexEmployment[]>;
  
  // Kardex Labor Conditions (Position/Department tracking)
  createKardexLaborConditions(kardex: InsertKardexLaborConditions): Promise<KardexLaborConditions>;
  getKardexLaborConditions(id: string): Promise<KardexLaborConditions | undefined>;
  getKardexLaborConditionsByEmpleado(empleadoId: string): Promise<KardexLaborConditions[]>;
  getKardexLaborConditionsByEmpresa(empresaId: string): Promise<KardexLaborConditions[]>;
  
  // Kardex Bank Accounts (Bank info change tracking)
  createKardexBankAccounts(kardex: InsertKardexBankAccounts): Promise<KardexBankAccounts>;
  getKardexBankAccounts(id: string): Promise<KardexBankAccounts | undefined>;
  getKardexBankAccountsByEmpleado(empleadoId: string): Promise<KardexBankAccounts[]>;
  getKardexBankAccountsByEmpresa(empresaId: string): Promise<KardexBankAccounts[]>;
  
  // Geographic Catalogs (CFDI compliance)
  getCatPaises(): Promise<CatPais[]>;
  getCatPais(id: string): Promise<CatPais | undefined>;
  getCatPaisByCodigo(codigoPais: string): Promise<CatPais | undefined>;
  
  getCatEstados(): Promise<CatEstado[]>;
  getCatEstado(id: string): Promise<CatEstado | undefined>;
  getCatEstadosByCodigo(codigoPais: string): Promise<CatEstado[]>;
  getCatEstadoByCodigo(codigoPais: string, codigoEstado: string): Promise<CatEstado | undefined>;
  
  getCatMunicipios(): Promise<CatMunicipio[]>;
  getCatMunicipio(id: string): Promise<CatMunicipio | undefined>;
  getCatMunicipiosByEstado(codigoPais: string, codigoEstado: string): Promise<CatMunicipio[]>;
  
  getCatCodigosPostales(codigoPais: string, codigoEstado: string): Promise<CatCodigoPostal[]>;
  getCatCodigoPostal(id: string): Promise<CatCodigoPostal | undefined>;
  getCatCodigoPostalByCodigo(codigoPostal: string): Promise<CatCodigoPostal | undefined>;
  getCatCodigosPostalesByMunicipio(codigoPais: string, codigoEstado: string, codigoMunicipio: string): Promise<CatCodigoPostal[]>;
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
    // Calculate salarioDiarioExento automatically
    const employeeWithExento = this.calculateSalarioDiarioExento(employee);
    
    const [newEmployee] = await db
      .insert(employees)
      .values(employeeWithExento)
      .returning();
    return newEmployee;
  }
  
  // Helper function to calculate Salario Diario Exento
  private calculateSalarioDiarioExento<T extends Partial<InsertEmployee>>(data: T): T {
    const salarioDiarioReal = data.salarioDiarioReal ? parseFloat(String(data.salarioDiarioReal)) : null;
    const salarioDiarioNominal = data.salarioDiarioNominal ? parseFloat(String(data.salarioDiarioNominal)) : null;
    
    // Formula: Exento = Real - Nominal. If Nominal doesn't exist, Exento = 0
    let salarioDiarioExento: string | null = null;
    
    if (salarioDiarioReal !== null) {
      if (salarioDiarioNominal !== null && salarioDiarioNominal > 0) {
        const exento = Math.max(0, salarioDiarioReal - salarioDiarioNominal);
        salarioDiarioExento = exento.toFixed(4);
      } else {
        // If Nominal doesn't exist, Exento = 0
        salarioDiarioExento = "0";
      }
    }
    
    return {
      ...data,
      salarioDiarioExento,
    };
  }

  async createBulkEmployees(employeeList: InsertEmployee[]): Promise<Employee[]> {
    if (employeeList.length === 0) {
      return [];
    }
    
    // Calculate salarioDiarioExento for all employees
    const employeesWithExento = employeeList.map(emp => this.calculateSalarioDiarioExento(emp));
    
    const newEmployees = await db
      .insert(employees)
      .values(employeesWithExento)
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
    const existingEmployee = await this.getEmployee(id);
    
    // Recalculate salarioDiarioExento if salary fields are being updated
    let updatesWithExento = updates;
    if ('salarioDiarioReal' in updates || 'salarioDiarioNominal' in updates) {
      // Merge existing values with updates to calculate correctly
      const mergedData = {
        salarioDiarioReal: updates.salarioDiarioReal ?? existingEmployee?.salarioDiarioReal,
        salarioDiarioNominal: updates.salarioDiarioNominal ?? existingEmployee?.salarioDiarioNominal,
      };
      const { salarioDiarioExento } = this.calculateSalarioDiarioExento(mergedData);
      updatesWithExento = { ...updates, salarioDiarioExento };
    }
    
    const [updated] = await db
      .update(employees)
      .set(updatesWithExento)
      .where(eq(employees.id, id))
      .returning();
    
    if (existingEmployee) {
      await this.trackSalaryChanges(existingEmployee, updated, updates);
    }
    
    return updated;
  }
  
  private async trackSalaryChanges(
    before: Employee, 
    after: Employee, 
    _updates: Partial<InsertEmployee>
  ): Promise<void> {
    const parseNumeric = (val: string | number | bigint | null | undefined): number | undefined => {
      if (val === null || val === undefined) return undefined;
      if (typeof val === 'bigint') return Number(val);
      if (typeof val === 'number') return val;
      const parsed = parseFloat(val);
      return isNaN(parsed) ? undefined : parsed;
    };
    
    const bpToDecimal = (bp: bigint | null | undefined): number | undefined => {
      if (bp === null || bp === undefined) return undefined;
      return Number(bp) / 10000;
    };
    
    const numericEquals = (a: number | undefined, b: number | undefined): boolean => {
      if (a === undefined && b === undefined) return true;
      if (a === undefined || b === undefined) return false;
      return Math.abs(a - b) < 0.001;
    };
    
    const salarioBefore = parseNumeric(before.salarioDiarioReal);
    const salarioAfter = parseNumeric(after.salarioDiarioReal);
    
    const sbcDecimalBefore = parseNumeric(before.sbc);
    const sbcDecimalAfter = parseNumeric(after.sbc);
    const sbcBpBefore = bpToDecimal(before.sbcBp);
    const sbcBpAfter = bpToDecimal(after.sbcBp);
    
    const sdiDecimalBefore = parseNumeric(before.sdi);
    const sdiDecimalAfter = parseNumeric(after.sdi);
    const sdiBpBefore = bpToDecimal(before.sdiBp);
    const sdiBpAfter = bpToDecimal(after.sdiBp);
    
    const salarioChanged = !numericEquals(salarioBefore, salarioAfter);
    const sbcDecimalChanged = !numericEquals(sbcDecimalBefore, sbcDecimalAfter);
    const sbcBpChanged = !numericEquals(sbcBpBefore, sbcBpAfter);
    const sdiDecimalChanged = !numericEquals(sdiDecimalBefore, sdiDecimalAfter);
    const sdiBpChanged = !numericEquals(sdiBpBefore, sdiBpAfter);
    
    const sbcChanged = sbcDecimalChanged || sbcBpChanged;
    const sdiChanged = sdiDecimalChanged || sdiBpChanged;
    
    if (!salarioChanged && !sbcChanged && !sdiChanged) return;
    
    const changedFields: string[] = [];
    if (salarioChanged) changedFields.push('salarioDiarioReal');
    if (sbcDecimalChanged) changedFields.push('sbc');
    if (sbcBpChanged) changedFields.push('sbcBp');
    if (sdiDecimalChanged) changedFields.push('sdi');
    if (sdiBpChanged) changedFields.push('sdiBp');
    
    const tipoCambio = salarioChanged ? 'CAMBIO_SALARIO' : sbcChanged ? 'CAMBIO_SBC' : 'CAMBIO_SDI';
    
    const sbcBefore = sbcBpBefore ?? sbcDecimalBefore;
    const sbcAfter = sbcBpAfter ?? sbcDecimalAfter;
    const sdiBefore = sdiBpBefore ?? sdiDecimalBefore;
    const sdiAfter = sdiBpAfter ?? sdiDecimalAfter;
    
    const fechaEfectiva = new Date().toISOString().split('T')[0];
    
    const kardexEntry: InsertKardexCompensation = {
      empleadoId: after.id,
      empresaId: after.empresaId,
      tipoCambio,
      fechaEfectiva,
      salarioDiarioAnterior: salarioBefore,
      salarioDiarioNuevo: salarioAfter,
      sbcAnterior: sbcBefore,
      sbcNuevo: sbcAfter,
      sdiAnterior: sdiBefore,
      sdiNuevo: sdiAfter,
      motivo: `Actualización automática: ${changedFields.join(', ')}`,
      registradoPor: 'SISTEMA',
    };
    
    const kardex = await this.createKardexCompensation(kardexEntry);
    
    if (sbcChanged && after.nss) {
      const sbcBpValue = after.sbcBp ?? (sbcDecimalAfter !== undefined ? BigInt(Math.round(sbcDecimalAfter * 10000)) : null);
      const sbcDecimalValue = sbcBpAfter ?? sbcDecimalAfter ?? sbcBefore ?? null;
      
      const imssMovimiento: InsertImssMovimiento = {
        clienteId: after.clienteId,
        empresaId: after.empresaId,
        empleadoId: after.id,
        registroPatronalId: after.registroPatronalId ?? null,
        kardexCompensationId: kardex.id,
        tipoMovimiento: 'modificacion_salario',
        fechaMovimiento: fechaEfectiva,
        estatus: 'pendiente',
        nss: after.nss,
        sbcDecimal: sbcDecimalValue,
        sbcBp: sbcBpValue,
        observaciones: `Cambio automático de SBC: ${sbcBefore?.toFixed(4) ?? 'N/A'} → ${sbcAfter?.toFixed(4) ?? 'N/A'}`,
        registradoPor: 'SISTEMA',
      };
      
      await this.createImssMovimiento(imssMovimiento);
    }
  }

  async deleteEmployee(id: string): Promise<void> {
    await db
      .delete(employees)
      .where(eq(employees.id, id));
  }

  // Modificaciones de Personal
  async createModificacionPersonal(modificacion: InsertModificacionPersonal): Promise<ModificacionPersonal> {
    const [newModificacion] = await db
      .insert(modificacionesPersonal)
      .values(modificacion)
      .returning();

    const valoresNuevos = modificacion.valoresNuevos as Record<string, any>;
    const empleadoUpdate: Record<string, any> = {};

    switch (modificacion.tipoModificacion) {
      case 'salario':
        if (valoresNuevos.salarioBrutoMensual !== undefined) {
          empleadoUpdate.salarioBrutoMensual = valoresNuevos.salarioBrutoMensual;
        }
        break;
      case 'puesto':
        if (valoresNuevos.puesto !== undefined) {
          empleadoUpdate.puesto = valoresNuevos.puesto;
        }
        break;
      case 'centro_trabajo':
        if (valoresNuevos.lugarTrabajo !== undefined) {
          empleadoUpdate.lugarTrabajo = valoresNuevos.lugarTrabajo;
        }
        
        if (valoresNuevos.centroTrabajoId) {
          await db
            .update(empleadosCentrosTrabajo)
            .set({ fechaFin: modificacion.fechaEfectiva })
            .where(
              and(
                eq(empleadosCentrosTrabajo.empleadoId, modificacion.empleadoId),
                isNull(empleadosCentrosTrabajo.fechaFin)
              )
            );

          const turnos = await db
            .select()
            .from(turnosCentroTrabajo)
            .where(eq(turnosCentroTrabajo.centroTrabajoId, valoresNuevos.centroTrabajoId))
            .limit(1);

          if (turnos.length > 0) {
            await db
              .insert(empleadosCentrosTrabajo)
              .values({
                empleadoId: modificacion.empleadoId,
                centroTrabajoId: valoresNuevos.centroTrabajoId,
                turnoId: turnos[0].id,
                fechaInicio: modificacion.fechaEfectiva,
                esPrincipal: true,
              });
          }
        }
        break;
      case 'departamento':
        if (valoresNuevos.departamento !== undefined) {
          empleadoUpdate.departamento = valoresNuevos.departamento;
        }
        break;
      case 'jefe_directo':
        if (valoresNuevos.jefeDirecto !== undefined) {
          empleadoUpdate.jefeDirecto = valoresNuevos.jefeDirecto;
        }
        break;
    }

    if (Object.keys(empleadoUpdate).length > 0) {
      await db
        .update(employees)
        .set(empleadoUpdate)
        .where(eq(employees.id, modificacion.empleadoId));
    }

    return newModificacion;
  }

  async getModificacionPersonal(id: string): Promise<ModificacionPersonal | undefined> {
    const [modificacion] = await db
      .select()
      .from(modificacionesPersonal)
      .where(eq(modificacionesPersonal.id, id));
    return modificacion || undefined;
  }

  async getModificacionesPersonal(): Promise<ModificacionPersonal[]> {
    return await db
      .select()
      .from(modificacionesPersonal)
      .orderBy(desc(modificacionesPersonal.createdAt));
  }

  async getModificacionesPersonalByEmpleado(empleadoId: string): Promise<ModificacionPersonal[]> {
    return await db
      .select()
      .from(modificacionesPersonal)
      .where(eq(modificacionesPersonal.empleadoId, empleadoId))
      .orderBy(desc(modificacionesPersonal.fechaEfectiva));
  }

  async getModificacionesPersonalByTipo(tipoModificacion: string): Promise<ModificacionPersonal[]> {
    return await db
      .select()
      .from(modificacionesPersonal)
      .where(eq(modificacionesPersonal.tipoModificacion, tipoModificacion))
      .orderBy(desc(modificacionesPersonal.createdAt));
  }

  async getModificacionesPersonalByEstatus(estatus: string): Promise<ModificacionPersonal[]> {
    return await db
      .select()
      .from(modificacionesPersonal)
      .where(eq(modificacionesPersonal.estatus, estatus))
      .orderBy(desc(modificacionesPersonal.createdAt));
  }

  async updateModificacionPersonal(id: string, updates: Partial<InsertModificacionPersonal>): Promise<ModificacionPersonal> {
    const [updated] = await db
      .update(modificacionesPersonal)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(modificacionesPersonal.id, id))
      .returning();
    return updated;
  }

  async deleteModificacionPersonal(id: string): Promise<void> {
    await db
      .delete(modificacionesPersonal)
      .where(eq(modificacionesPersonal.id, id));
  }

  async aprobarModificacionPersonal(id: string, aprobadoPor: string): Promise<ModificacionPersonal> {
    const [updated] = await db
      .update(modificacionesPersonal)
      .set({ 
        estatus: 'aprobada',
        aprobadoPor,
        fechaAprobacion: new Date(),
        updatedAt: new Date()
      })
      .where(eq(modificacionesPersonal.id, id))
      .returning();
    return updated;
  }

  async rechazarModificacionPersonal(id: string, notasRechazo: string): Promise<ModificacionPersonal> {
    const [updated] = await db
      .update(modificacionesPersonal)
      .set({ 
        estatus: 'rechazada',
        notasRechazo,
        updatedAt: new Date()
      })
      .where(eq(modificacionesPersonal.id, id))
      .returning();
    return updated;
  }

  async aplicarModificacionPersonal(id: string): Promise<ModificacionPersonal> {
    const modificacion = await db
      .select()
      .from(modificacionesPersonal)
      .where(eq(modificacionesPersonal.id, id))
      .limit(1)
      .then(rows => rows[0]);

    if (!modificacion) {
      throw new Error('Modificación no encontrada');
    }

    const valoresNuevos = modificacion.valoresNuevos as Record<string, any>;
    const empleadoUpdate: Record<string, any> = {};

    switch (modificacion.tipoModificacion) {
      case 'salario':
        if (valoresNuevos.salarioBrutoMensual !== undefined) {
          empleadoUpdate.salarioBrutoMensual = valoresNuevos.salarioBrutoMensual;
        }
        break;
      case 'puesto':
        if (valoresNuevos.puesto !== undefined) {
          empleadoUpdate.puesto = valoresNuevos.puesto;
        }
        break;
      case 'centro_trabajo':
        if (valoresNuevos.lugarTrabajo !== undefined) {
          empleadoUpdate.lugarTrabajo = valoresNuevos.lugarTrabajo;
        }
        break;
      case 'departamento':
        if (valoresNuevos.departamento !== undefined) {
          empleadoUpdate.departamento = valoresNuevos.departamento;
        }
        break;
      case 'jefe_directo':
        if (valoresNuevos.jefeDirecto !== undefined) {
          empleadoUpdate.jefeDirecto = valoresNuevos.jefeDirecto;
        }
        break;
    }

    if (Object.keys(empleadoUpdate).length > 0) {
      await db
        .update(employees)
        .set(empleadoUpdate)
        .where(eq(employees.id, modificacion.empleadoId));
    }

    const [updated] = await db
      .update(modificacionesPersonal)
      .set({ 
        estatus: 'aplicada',
        updatedAt: new Date()
      })
      .where(eq(modificacionesPersonal.id, id))
      .returning();
    return updated;
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

  // Departamentos
  async createDepartamento(departamento: InsertDepartamento): Promise<Departamento> {
    const [newDepartamento] = await db
      .insert(departamentos)
      .values(departamento)
      .returning();
    return newDepartamento;
  }

  async getDepartamento(id: string): Promise<Departamento | undefined> {
    const [departamento] = await db
      .select()
      .from(departamentos)
      .where(eq(departamentos.id, id));
    return departamento || undefined;
  }

  async getDepartamentos(): Promise<Departamento[]> {
    return await db
      .select()
      .from(departamentos)
      .orderBy(desc(departamentos.createdAt));
  }

  async getDepartamentosByEmpresa(empresaId: string): Promise<Departamento[]> {
    return await db
      .select()
      .from(departamentos)
      .where(eq(departamentos.empresaId, empresaId))
      .orderBy(desc(departamentos.createdAt));
  }

  async updateDepartamento(id: string, updates: Partial<InsertDepartamento>): Promise<Departamento> {
    const [updated] = await db
      .update(departamentos)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(departamentos.id, id))
      .returning();
    return updated;
  }

  async deleteDepartamento(id: string): Promise<void> {
    await db
      .delete(departamentos)
      .where(eq(departamentos.id, id));
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

  async assignEmployeesToGrupoNomina(grupoNominaId: string, employeeIds: string[]): Promise<void> {
    // Primero, desasignar todos los empleados que estaban en este grupo
    // pero que no están en la nueva lista
    await db
      .update(employees)
      .set({ grupoNominaId: null })
      .where(
        and(
          eq(employees.grupoNominaId, grupoNominaId),
          not(inArray(employees.id, employeeIds.length > 0 ? employeeIds : ['']))
        )
      );

    // Luego, asignar los nuevos empleados al grupo
    if (employeeIds.length > 0) {
      await db
        .update(employees)
        .set({ grupoNominaId })
        .where(inArray(employees.id, employeeIds));
    }
  }

  // Medios de Pago
  async createMedioPago(medioPago: InsertMedioPago): Promise<MedioPago> {
    const [newMedioPago] = await db
      .insert(mediosPago)
      .values(medioPago)
      .returning();
    return newMedioPago!;
  }

  async getMedioPago(id: string): Promise<MedioPago | undefined> {
    const [medioPago] = await db
      .select()
      .from(mediosPago)
      .where(eq(mediosPago.id, id));
    return medioPago;
  }

  async getMediosPago(): Promise<MedioPago[]> {
    return await db
      .select()
      .from(mediosPago)
      .orderBy(mediosPago.nombre);
  }

  async updateMedioPago(id: string, updates: Partial<InsertMedioPago>): Promise<MedioPago> {
    const [updated] = await db
      .update(mediosPago)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(mediosPago.id, id))
      .returning();
    return updated!;
  }

  async deleteMedioPago(id: string): Promise<void> {
    await db
      .delete(mediosPago)
      .where(eq(mediosPago.id, id));
  }

  // Conceptos de Medios de Pago
  async createConceptoMedioPago(concepto: InsertConceptoMedioPago): Promise<ConceptoMedioPagoWithRelations> {
    const { mediosPagoIds, ...conceptoData } = concepto;
    
    return await db.transaction(async (tx) => {
      // Crear el concepto
      const [newConcepto] = await tx
        .insert(conceptosMedioPago)
        .values(conceptoData)
        .returning();
      
      // Crear las relaciones si hay medios de pago
      if (mediosPagoIds && mediosPagoIds.length > 0) {
        const relations: typeof conceptosMediosPagoRel.$inferInsert[] = mediosPagoIds.map((medioPagoId) => ({
          clienteId: newConcepto!.clienteId,
          empresaId: newConcepto!.empresaId,
          conceptoId: newConcepto!.id,
          medioPagoId,
        }));
        await tx.insert(conceptosMediosPagoRel).values(relations);
      }
      
      return {
        ...newConcepto!,
        mediosPagoIds: mediosPagoIds || [],
      };
    });
  }

  async getConceptoMedioPago(id: string): Promise<ConceptoMedioPagoWithRelations | undefined> {
    // Obtener el concepto
    const [concepto] = await db
      .select()
      .from(conceptosMedioPago)
      .where(eq(conceptosMedioPago.id, id));
    
    if (!concepto) return undefined;
    
    // Obtener las relaciones
    const relaciones = await db
      .select({ medioPagoId: conceptosMediosPagoRel.medioPagoId })
      .from(conceptosMediosPagoRel)
      .where(eq(conceptosMediosPagoRel.conceptoId, id));
    
    return {
      ...concepto,
      mediosPagoIds: relaciones.map((r) => r.medioPagoId),
    };
  }

  async getConceptosMedioPago(): Promise<ConceptoMedioPagoWithRelations[]> {
    // Obtener todos los conceptos
    const conceptos = await db
      .select()
      .from(conceptosMedioPago)
      .orderBy(conceptosMedioPago.nombre);
    
    // Obtener todas las relaciones de una vez
    const todasRelaciones = await db
      .select()
      .from(conceptosMediosPagoRel);
    
    // Mapear las relaciones a cada concepto
    return conceptos.map((concepto) => ({
      ...concepto,
      mediosPagoIds: todasRelaciones
        .filter((r) => r.conceptoId === concepto.id)
        .map((r) => r.medioPagoId),
    }));
  }

  async updateConceptoMedioPago(id: string, updates: Partial<InsertConceptoMedioPago>): Promise<ConceptoMedioPagoWithRelations> {
    const { mediosPagoIds, ...conceptoUpdates } = updates;
    
    return await db.transaction(async (tx) => {
      // Actualizar el concepto
      const [updatedConcepto] = await tx
        .update(conceptosMedioPago)
        .set({ ...conceptoUpdates, updatedAt: new Date() })
        .where(eq(conceptosMedioPago.id, id))
        .returning();
      
      // Si se proporcionaron mediosPagoIds, actualizar las relaciones
      if (mediosPagoIds !== undefined) {
        // Eliminar todas las relaciones existentes
        await tx
          .delete(conceptosMediosPagoRel)
          .where(eq(conceptosMediosPagoRel.conceptoId, id));
        
        // Insertar las nuevas relaciones
        if (mediosPagoIds.length > 0) {
          const relations: typeof conceptosMediosPagoRel.$inferInsert[] = mediosPagoIds.map((medioPagoId) => ({
            clienteId: updatedConcepto!.clienteId,
            empresaId: updatedConcepto!.empresaId,
            conceptoId: id,
            medioPagoId,
          }));
          await tx.insert(conceptosMediosPagoRel).values(relations);
        }
      }
      
      // Obtener las relaciones actuales
      const relaciones = await tx
        .select({ medioPagoId: conceptosMediosPagoRel.medioPagoId })
        .from(conceptosMediosPagoRel)
        .where(eq(conceptosMediosPagoRel.conceptoId, id));
      
      return {
        ...updatedConcepto!,
        mediosPagoIds: relaciones.map((r) => r.medioPagoId),
      };
    });
  }

  async deleteConceptoMedioPago(id: string): Promise<void> {
    await db
      .delete(conceptosMedioPago)
      .where(eq(conceptosMedioPago.id, id));
    // Las relaciones se eliminan en cascada
  }

  // Plantillas de Nómina
  async createPlantillaNomina(plantilla: InsertPlantillaNomina): Promise<PlantillaNomina> {
    const [newPlantilla] = await db
      .insert(plantillasNomina)
      .values(plantilla)
      .returning();
    return newPlantilla!;
  }

  async getPlantillaNomina(id: string): Promise<PlantillaNominaWithConceptos | undefined> {
    const plantilla = await db
      .select()
      .from(plantillasNomina)
      .where(eq(plantillasNomina.id, id))
      .limit(1);
    
    if (!plantilla[0]) return undefined;
    
    const conceptos = await this.getConceptosByPlantilla(id);
    
    return {
      ...plantilla[0],
      conceptos,
    };
  }

  async getPlantillasNomina(): Promise<PlantillaNomina[]> {
    return await db
      .select()
      .from(plantillasNomina)
      .orderBy(plantillasNomina.nombre);
  }

  async getPlantillasNominaByEmpresa(clienteId: string, empresaId: string): Promise<PlantillaNomina[]> {
    return await db
      .select()
      .from(plantillasNomina)
      .where(
        and(
          eq(plantillasNomina.clienteId, clienteId),
          eq(plantillasNomina.empresaId, empresaId)
        )
      )
      .orderBy(plantillasNomina.nombre);
  }

  async updatePlantillaNomina(id: string, updates: Partial<InsertPlantillaNomina>): Promise<PlantillaNomina> {
    const [updated] = await db
      .update(plantillasNomina)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(plantillasNomina.id, id))
      .returning();
    return updated!;
  }

  async deletePlantillaNomina(id: string): Promise<void> {
    await db
      .delete(plantillasNomina)
      .where(eq(plantillasNomina.id, id));
  }

  // Plantilla Conceptos
  async addConceptoToPlantilla(data: InsertPlantillaConcepto): Promise<PlantillaConcepto> {
    const [newConcepto] = await db
      .insert(plantillaConceptos)
      .values(data)
      .returning();
    return newConcepto!;
  }

  async updatePlantillaConcepto(id: string, updates: Partial<InsertPlantillaConcepto>): Promise<PlantillaConcepto> {
    const [updated] = await db
      .update(plantillaConceptos)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(plantillaConceptos.id, id))
      .returning();
    return updated!;
  }

  async removeConceptoFromPlantilla(id: string): Promise<void> {
    await db
      .delete(plantillaConceptos)
      .where(eq(plantillaConceptos.id, id));
  }

  async getConceptosByPlantilla(plantillaId: string): Promise<(PlantillaConcepto & { concepto: ConceptoMedioPago })[]> {
    const results = await db
      .select({
        plantillaConcepto: plantillaConceptos,
        concepto: conceptosMedioPago,
      })
      .from(plantillaConceptos)
      .innerJoin(conceptosMedioPago, eq(plantillaConceptos.conceptoId, conceptosMedioPago.id))
      .where(eq(plantillaConceptos.plantillaId, plantillaId))
      .orderBy(plantillaConceptos.orden);
    
    return results.map((r) => ({
      ...r.plantillaConcepto,
      concepto: r.concepto,
    }));
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
    // Verificar si ya existen periodos para este grupo y año
    const existingPeriods = await this.getPayrollPeriodsByGrupo(grupoNominaId, year);
    if (existingPeriods.length > 0) {
      return existingPeriods;
    }
    
    // Obtener el grupo para saber el tipo de periodo
    const grupo = await this.getGrupoNomina(grupoNominaId);
    if (!grupo) {
      throw new Error('Grupo de nómina no encontrado');
    }

    const periods: InsertPayrollPeriod[] = [];
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31);
    
    // Derivar tenant IDs del grupo para multi-tenancy
    const { clienteId, empresaId } = grupo;
    
    let periodNumber = 1;
    let currentDate = new Date(startOfYear);

    switch (grupo.tipoPeriodo) {
      case 'semanal': {
        // Periodos semanales - aproximadamente 52-53 periodos al año
        const targetDay = grupo.diaInicioSemana || 1; // Default: lunes
        const firstDayOfWeek = currentDate.getDay();
        
        // Ajustar al primer día de semana configurado
        if (firstDayOfWeek !== targetDay) {
          const diff = (targetDay - firstDayOfWeek + 7) % 7;
          if (diff > 0) {
            currentDate.setDate(currentDate.getDate() + diff);
          }
        }
        
        // Si el primer día de semana no es el 1 de enero, crear periodo parcial
        if (currentDate.getDate() > 1) {
          const partialEnd = new Date(currentDate);
          partialEnd.setDate(partialEnd.getDate() - 1);
          
          periods.push({
            clienteId,
            empresaId,
            grupoNominaId,
            startDate: startOfYear.toISOString().split('T')[0],
            endDate: partialEnd.toISOString().split('T')[0],
            frequency: 'semanal',
            year,
            periodNumber: periodNumber++,
            status: 'pending'
          });
        }
        
        // Generar periodos semanales completos
        while (currentDate <= endOfYear) {
          const periodStart = new Date(currentDate);
          const periodEnd = new Date(currentDate);
          periodEnd.setDate(periodEnd.getDate() + 6);
          
          // Solo agregar si el periodo empieza en este año
          if (periodStart.getFullYear() === year) {
            periods.push({
              clienteId,
              empresaId,
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
        // Periodos catorcenales - aproximadamente 26-27 periodos al año
        const targetDay = grupo.diaInicioSemana || 1;
        const firstDayOfWeek = currentDate.getDay();
        
        // Ajustar al primer día de semana configurado
        if (firstDayOfWeek !== targetDay) {
          const diff = (targetDay - firstDayOfWeek + 7) % 7;
          if (diff > 0) {
            currentDate.setDate(currentDate.getDate() + diff);
          }
        }
        
        // Si el primer día de semana no es el 1 de enero, crear periodo parcial
        if (currentDate.getDate() > 1) {
          const partialEnd = new Date(currentDate);
          partialEnd.setDate(partialEnd.getDate() - 1);
          
          periods.push({
            clienteId,
            empresaId,
            grupoNominaId,
            startDate: startOfYear.toISOString().split('T')[0],
            endDate: partialEnd.toISOString().split('T')[0],
            frequency: 'catorcenal',
            year,
            periodNumber: periodNumber++,
            status: 'pending'
          });
        }
        
        // Generar periodos catorcenales completos
        while (currentDate <= endOfYear) {
          const periodStart = new Date(currentDate);
          const periodEnd = new Date(currentDate);
          periodEnd.setDate(periodEnd.getDate() + 13);
          
          if (periodStart.getFullYear() === year) {
            periods.push({
              clienteId,
              empresaId,
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
            clienteId,
            empresaId,
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
            clienteId,
            empresaId,
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
            clienteId,
            empresaId,
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
    
    // Derivar clienteId desde empresa para multi-tenancy
    const empresa = await this.getEmpresa(empresaId);
    if (!empresa) {
      throw new Error('Empresa no encontrada');
    }
    const { clienteId } = empresa;
    
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
          clienteId,
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

  // ============================================================================
  // CRÉDITOS Y DESCUENTOS - Implementaciones
  // ============================================================================

  // Créditos Legales
  async createCreditoLegal(credito: InsertCreditoLegal): Promise<CreditoLegal> {
    const [created] = await db.insert(creditosLegales).values(credito).returning();
    return created;
  }

  async getCreditoLegal(id: string): Promise<CreditoLegal | undefined> {
    const [credito] = await db.select().from(creditosLegales).where(eq(creditosLegales.id, id));
    return credito;
  }

  async getCreditosLegales(): Promise<CreditoLegal[]> {
    return db.select().from(creditosLegales).orderBy(desc(creditosLegales.createdAt));
  }

  async getCreditosLegalesByEmpleado(empleadoId: string): Promise<CreditoLegal[]> {
    return db.select().from(creditosLegales).where(eq(creditosLegales.empleadoId, empleadoId)).orderBy(desc(creditosLegales.createdAt));
  }

  async getCreditosLegalesActivos(): Promise<CreditoLegal[]> {
    return db.select().from(creditosLegales).where(eq(creditosLegales.estado, "ACTIVO")).orderBy(desc(creditosLegales.createdAt));
  }

  async getCreditosLegalesByTipo(tipoCredito: string): Promise<CreditoLegal[]> {
    return db.select().from(creditosLegales).where(eq(creditosLegales.tipoCredito, tipoCredito)).orderBy(desc(creditosLegales.createdAt));
  }

  async updateCreditoLegal(id: string, updates: Partial<InsertCreditoLegal>): Promise<CreditoLegal> {
    const [updated] = await db.update(creditosLegales).set(updates).where(eq(creditosLegales.id, id)).returning();
    return updated;
  }

  async deleteCreditoLegal(id: string): Promise<void> {
    await db.delete(creditosLegales).where(eq(creditosLegales.id, id));
  }

  // Préstamos Internos
  async createPrestamoInterno(prestamo: InsertPrestamoInterno): Promise<PrestamoInterno> {
    const [created] = await db.insert(prestamosInternos).values(prestamo).returning();
    return created;
  }

  async getPrestamoInterno(id: string): Promise<PrestamoInterno | undefined> {
    const [prestamo] = await db.select().from(prestamosInternos).where(eq(prestamosInternos.id, id));
    return prestamo;
  }

  async getPrestamosInternos(): Promise<PrestamoInterno[]> {
    return db.select().from(prestamosInternos).orderBy(desc(prestamosInternos.createdAt));
  }

  async getPrestamosInternosByEmpleado(empleadoId: string): Promise<PrestamoInterno[]> {
    return db.select().from(prestamosInternos).where(eq(prestamosInternos.empleadoId, empleadoId)).orderBy(desc(prestamosInternos.createdAt));
  }

  async getPrestamosInternosActivos(): Promise<PrestamoInterno[]> {
    return db.select().from(prestamosInternos).where(eq(prestamosInternos.estado, "ACTIVO")).orderBy(desc(prestamosInternos.createdAt));
  }

  async updatePrestamoInterno(id: string, updates: Partial<InsertPrestamoInterno>): Promise<PrestamoInterno> {
    const [updated] = await db.update(prestamosInternos).set(updates).where(eq(prestamosInternos.id, id)).returning();
    return updated;
  }

  async deletePrestamoInterno(id: string): Promise<void> {
    await db.delete(prestamosInternos).where(eq(prestamosInternos.id, id));
  }

  // Pagos de Créditos y Descuentos
  async createPagoCreditoDescuento(pago: InsertPagoCreditoDescuento): Promise<PagoCreditoDescuento> {
    const [created] = await db.insert(pagosCreditosDescuentos).values(pago).returning();
    return created;
  }

  async getPagoCreditoDescuento(id: string): Promise<PagoCreditoDescuento | undefined> {
    const [pago] = await db.select().from(pagosCreditosDescuentos).where(eq(pagosCreditosDescuentos.id, id));
    return pago;
  }

  async getPagosCreditosDescuentos(): Promise<PagoCreditoDescuento[]> {
    return db.select().from(pagosCreditosDescuentos).orderBy(desc(pagosCreditosDescuentos.createdAt));
  }

  async getPagosCreditosDescuentosByEmpleado(empleadoId: string): Promise<PagoCreditoDescuento[]> {
    return db.select().from(pagosCreditosDescuentos).where(eq(pagosCreditosDescuentos.empleadoId, empleadoId)).orderBy(desc(pagosCreditosDescuentos.createdAt));
  }

  async getPagosCreditosDescuentosByCreditoLegal(creditoLegalId: string): Promise<PagoCreditoDescuento[]> {
    return db.select().from(pagosCreditosDescuentos).where(eq(pagosCreditosDescuentos.creditoLegalId, creditoLegalId)).orderBy(desc(pagosCreditosDescuentos.createdAt));
  }

  async getPagosCreditosDescuentosByPrestamoInterno(prestamoInternoId: string): Promise<PagoCreditoDescuento[]> {
    return db.select().from(pagosCreditosDescuentos).where(eq(pagosCreditosDescuentos.prestamoInternoId, prestamoInternoId)).orderBy(desc(pagosCreditosDescuentos.createdAt));
  }

  async deletePagoCreditoDescuento(id: string): Promise<void> {
    await db.delete(pagosCreditosDescuentos).where(eq(pagosCreditosDescuentos.id, id));
  }

  // Puestos (Organización)
  async createPuesto(puesto: InsertPuesto): Promise<Puesto> {
    const [created] = await db.insert(puestos).values(puesto).returning();
    return created;
  }

  async getPuesto(id: string): Promise<Puesto | undefined> {
    const [puesto] = await db.select().from(puestos).where(eq(puestos.id, id));
    return puesto;
  }

  async getPuestos(): Promise<Puesto[]> {
    return db.select().from(puestos).orderBy(puestos.nombrePuesto);
  }

  async getPuestosByClavePuesto(clavePuesto: string): Promise<Puesto | undefined> {
    const [puesto] = await db.select().from(puestos).where(eq(puestos.clavePuesto, clavePuesto));
    return puesto;
  }

  async getPuestosByDepartamento(departamento: string): Promise<Puesto[]> {
    return db.select().from(puestos).where(eq(puestos.departamento, departamento)).orderBy(puestos.nombrePuesto);
  }

  async getPuestosActivos(): Promise<Puesto[]> {
    return db.select().from(puestos).where(eq(puestos.estatus, "activo")).orderBy(puestos.nombrePuesto);
  }

  async updatePuesto(id: string, updates: Partial<InsertPuesto>): Promise<Puesto> {
    const [updated] = await db.update(puestos).set({
      ...updates,
      ultimaActualizacion: new Date(),
    }).where(eq(puestos.id, id)).returning();
    return updated;
  }

  async deletePuesto(id: string): Promise<void> {
    await db.delete(puestos).where(eq(puestos.id, id));
  }

  async getEmployeeCountByPuesto(puestoId: string): Promise<number> {
    const empleados = await db.select().from(employees).where(eq(employees.puestoId, puestoId));
    return empleados.length;
  }

  async getEmployeesByPuesto(puestoId: string): Promise<Employee[]> {
    return db.select().from(employees).where(eq(employees.puestoId, puestoId));
  }

  async getAllEmployeeCountsByPuesto(): Promise<Record<string, number>> {
    const allEmployees = await db.select({
      puestoId: employees.puestoId
    }).from(employees);

    const counts: Record<string, number> = {};
    allEmployees.forEach((emp) => {
      if (emp.puestoId) {
        counts[emp.puestoId] = (counts[emp.puestoId] || 0) + 1;
      }
    });
    
    return counts;
  }

  // ==================== Reclutamiento y Selección - Vacantes ====================
  
  async createVacante(vacante: InsertVacante): Promise<Vacante> {
    const data = {
      ...vacante,
      rangoSalarialMin: vacante.rangoSalarialMin ? String(vacante.rangoSalarialMin) : undefined,
      rangoSalarialMax: vacante.rangoSalarialMax ? String(vacante.rangoSalarialMax) : undefined,
    };
    const [created] = await db.insert(vacantes).values(data).returning();
    return created;
  }

  async getVacante(id: string): Promise<Vacante | undefined> {
    const [vacante] = await db.select().from(vacantes).where(eq(vacantes.id, id));
    return vacante;
  }

  async getVacantes(): Promise<Vacante[]> {
    return db.select().from(vacantes).orderBy(desc(vacantes.createdAt));
  }

  async getVacantesActivas(): Promise<Vacante[]> {
    return db.select().from(vacantes).where(eq(vacantes.estatus, "abierta")).orderBy(desc(vacantes.fechaApertura));
  }

  async getVacantesByEstatus(estatus: string): Promise<Vacante[]> {
    return db.select().from(vacantes).where(eq(vacantes.estatus, estatus)).orderBy(desc(vacantes.fechaApertura));
  }

  async updateVacante(id: string, updates: Partial<InsertVacante>): Promise<Vacante> {
    const data = {
      ...updates,
      rangoSalarialMin: updates.rangoSalarialMin !== undefined ? (updates.rangoSalarialMin ? String(updates.rangoSalarialMin) : null) : undefined,
      rangoSalarialMax: updates.rangoSalarialMax !== undefined ? (updates.rangoSalarialMax ? String(updates.rangoSalarialMax) : null) : undefined,
      updatedAt: new Date(),
    };
    const [updated] = await db.update(vacantes).set(data).where(eq(vacantes.id, id)).returning();
    return updated;
  }

  async deleteVacante(id: string): Promise<void> {
    await db.delete(vacantes).where(eq(vacantes.id, id));
  }

  // ==================== Reclutamiento y Selección - Candidatos ====================
  
  async createCandidato(candidato: InsertCandidato): Promise<Candidato> {
    const data = {
      ...candidato,
      salarioDeseado: candidato.salarioDeseado ? String(candidato.salarioDeseado) : undefined,
    };
    const [created] = await db.insert(candidatos).values(data).returning();
    return created;
  }

  async getCandidato(id: string): Promise<Candidato | undefined> {
    const [candidato] = await db.select().from(candidatos).where(eq(candidatos.id, id));
    return candidato;
  }

  async getCandidatos(): Promise<Candidato[]> {
    return db.select().from(candidatos).orderBy(desc(candidatos.createdAt));
  }

  async getCandidatosActivos(): Promise<Candidato[]> {
    return db.select().from(candidatos).where(eq(candidatos.estatus, "activo")).orderBy(desc(candidatos.createdAt));
  }

  async updateCandidato(id: string, updates: Partial<InsertCandidato>): Promise<Candidato> {
    const data = {
      ...updates,
      salarioDeseado: updates.salarioDeseado !== undefined ? (updates.salarioDeseado ? String(updates.salarioDeseado) : null) : undefined,
      updatedAt: new Date(),
    };
    const [updated] = await db.update(candidatos).set(data).where(eq(candidatos.id, id)).returning();
    return updated;
  }

  async deleteCandidato(id: string): Promise<void> {
    await db.delete(candidatos).where(eq(candidatos.id, id));
  }

  // ==================== Reclutamiento y Selección - Etapas de Selección ====================
  
  async createEtapaSeleccion(etapa: InsertEtapaSeleccion): Promise<EtapaSeleccion> {
    const [created] = await db.insert(etapasSeleccion).values(etapa).returning();
    return created;
  }

  async getEtapaSeleccion(id: string): Promise<EtapaSeleccion | undefined> {
    const [etapa] = await db.select().from(etapasSeleccion).where(eq(etapasSeleccion.id, id));
    return etapa;
  }

  async getEtapasSeleccion(): Promise<EtapaSeleccion[]> {
    return db.select().from(etapasSeleccion).orderBy(etapasSeleccion.orden);
  }

  async getEtapasSeleccionActivas(): Promise<EtapaSeleccion[]> {
    return db.select().from(etapasSeleccion).where(eq(etapasSeleccion.activa, true)).orderBy(etapasSeleccion.orden);
  }

  async updateEtapaSeleccion(id: string, updates: Partial<InsertEtapaSeleccion>): Promise<EtapaSeleccion> {
    const [updated] = await db.update(etapasSeleccion).set({
      ...updates,
      updatedAt: new Date(),
    }).where(eq(etapasSeleccion.id, id)).returning();
    return updated;
  }

  async deleteEtapaSeleccion(id: string): Promise<void> {
    await db.delete(etapasSeleccion).where(eq(etapasSeleccion.id, id));
  }

  // ==================== Reclutamiento y Selección - Proceso de Selección ====================
  
  async createProcesoSeleccion(proceso: InsertProcesoSeleccion): Promise<ProcesoSeleccion> {
    const [created] = await db.insert(procesoSeleccion).values(proceso).returning();
    return created;
  }

  async getProcesoSeleccion(id: string): Promise<ProcesoSeleccion | undefined> {
    const [proceso] = await db.select().from(procesoSeleccion).where(eq(procesoSeleccion.id, id));
    return proceso;
  }

  async getProcesosSeleccion(): Promise<ProcesoSeleccion[]> {
    return db.select().from(procesoSeleccion).orderBy(desc(procesoSeleccion.fechaAplicacion));
  }

  async getProcesosByVacante(vacanteId: string): Promise<ProcesoSeleccion[]> {
    return db.select().from(procesoSeleccion).where(eq(procesoSeleccion.vacanteId, vacanteId)).orderBy(desc(procesoSeleccion.fechaAplicacion));
  }

  async getProcesosByCandidato(candidatoId: string): Promise<ProcesoSeleccion[]> {
    return db.select().from(procesoSeleccion).where(eq(procesoSeleccion.candidatoId, candidatoId)).orderBy(desc(procesoSeleccion.fechaAplicacion));
  }

  async getProcesosByEtapa(etapaId: string): Promise<ProcesoSeleccion[]> {
    return db.select().from(procesoSeleccion).where(eq(procesoSeleccion.etapaActualId, etapaId)).orderBy(desc(procesoSeleccion.fechaUltimoMovimiento));
  }

  async updateProcesoSeleccion(id: string, updates: Partial<InsertProcesoSeleccion>): Promise<ProcesoSeleccion> {
    const [updated] = await db.update(procesoSeleccion).set({
      ...updates,
      fechaUltimoMovimiento: new Date(),
      updatedAt: new Date(),
    }).where(eq(procesoSeleccion.id, id)).returning();
    return updated;
  }

  async deleteProcesoSeleccion(id: string): Promise<void> {
    await db.delete(procesoSeleccion).where(eq(procesoSeleccion.id, id));
  }

  // ==================== Reclutamiento y Selección - Entrevistas ====================
  
  async createEntrevista(entrevista: InsertEntrevista): Promise<Entrevista> {
    const [created] = await db.insert(entrevistas).values(entrevista).returning();
    return created;
  }

  async getEntrevista(id: string): Promise<Entrevista | undefined> {
    const [entrevista] = await db.select().from(entrevistas).where(eq(entrevistas.id, id));
    return entrevista;
  }

  async getEntrevistas(): Promise<Entrevista[]> {
    return db.select().from(entrevistas).orderBy(desc(entrevistas.fechaHora));
  }

  async getEntrevistasByProceso(procesoId: string): Promise<Entrevista[]> {
    return db.select().from(entrevistas).where(eq(entrevistas.procesoSeleccionId, procesoId)).orderBy(desc(entrevistas.fechaHora));
  }

  async updateEntrevista(id: string, updates: Partial<InsertEntrevista>): Promise<Entrevista> {
    const [updated] = await db.update(entrevistas).set({
      ...updates,
      updatedAt: new Date(),
    }).where(eq(entrevistas.id, id)).returning();
    return updated;
  }

  async deleteEntrevista(id: string): Promise<void> {
    await db.delete(entrevistas).where(eq(entrevistas.id, id));
  }

  // ==================== Reclutamiento y Selección - Evaluaciones ====================
  
  async createEvaluacion(evaluacion: InsertEvaluacion): Promise<Evaluacion> {
    const data = {
      ...evaluacion,
      calificacion: evaluacion.calificacion ? String(evaluacion.calificacion) : undefined,
      calificacionMaxima: evaluacion.calificacionMaxima ? String(evaluacion.calificacionMaxima) : undefined,
    };
    const [created] = await db.insert(evaluaciones).values(data).returning();
    return created;
  }

  async getEvaluacion(id: string): Promise<Evaluacion | undefined> {
    const [evaluacion] = await db.select().from(evaluaciones).where(eq(evaluaciones.id, id));
    return evaluacion;
  }

  async getEvaluaciones(): Promise<Evaluacion[]> {
    return db.select().from(evaluaciones).orderBy(desc(evaluaciones.createdAt));
  }

  async getEvaluacionesByProceso(procesoId: string): Promise<Evaluacion[]> {
    return db.select().from(evaluaciones).where(eq(evaluaciones.procesoSeleccionId, procesoId)).orderBy(desc(evaluaciones.createdAt));
  }

  async updateEvaluacion(id: string, updates: Partial<InsertEvaluacion>): Promise<Evaluacion> {
    const data = {
      ...updates,
      calificacion: updates.calificacion !== undefined ? (updates.calificacion ? String(updates.calificacion) : null) : undefined,
      calificacionMaxima: updates.calificacionMaxima !== undefined ? (updates.calificacionMaxima ? String(updates.calificacionMaxima) : null) : undefined,
      updatedAt: new Date(),
    };
    const [updated] = await db.update(evaluaciones).set(data).where(eq(evaluaciones.id, id)).returning();
    return updated;
  }

  async deleteEvaluacion(id: string): Promise<void> {
    await db.delete(evaluaciones).where(eq(evaluaciones.id, id));
  }

  // ==================== Reclutamiento y Selección - Ofertas ====================
  
  async createOferta(oferta: InsertOferta): Promise<Oferta> {
    const data = {
      ...oferta,
      salarioBrutoMensual: String(oferta.salarioBrutoMensual),
      salarioDiario: oferta.salarioDiario ? String(oferta.salarioDiario) : undefined,
    };
    const [created] = await db.insert(ofertas).values(data).returning();
    return created;
  }

  async getOferta(id: string): Promise<Oferta | undefined> {
    const [oferta] = await db.select().from(ofertas).where(eq(ofertas.id, id));
    return oferta;
  }

  async getOfertas(): Promise<Oferta[]> {
    return db.select().from(ofertas).orderBy(desc(ofertas.createdAt));
  }

  async getOfertasByVacante(vacanteId: string): Promise<Oferta[]> {
    return db.select().from(ofertas).where(eq(ofertas.vacanteId, vacanteId)).orderBy(desc(ofertas.createdAt));
  }

  async getOfertasByCandidato(candidatoId: string): Promise<Oferta[]> {
    return db.select().from(ofertas).where(eq(ofertas.candidatoId, candidatoId)).orderBy(desc(ofertas.createdAt));
  }

  async updateOferta(id: string, updates: Partial<InsertOferta>): Promise<Oferta> {
    const data = {
      ...updates,
      salarioBrutoMensual: updates.salarioBrutoMensual !== undefined ? String(updates.salarioBrutoMensual) : undefined,
      salarioDiario: updates.salarioDiario !== undefined ? (updates.salarioDiario ? String(updates.salarioDiario) : null) : undefined,
      updatedAt: new Date(),
    };
    const [updated] = await db.update(ofertas).set(data).where(eq(ofertas.id, id)).returning();
    return updated;
  }

  async deleteOferta(id: string): Promise<void> {
    await db.delete(ofertas).where(eq(ofertas.id, id));
  }

  // ==================== Vacaciones (Vacation Management) ====================
  
  async createSolicitudVacaciones(solicitud: InsertSolicitudVacaciones): Promise<SolicitudVacaciones> {
    const data = {
      ...solicitud,
      primaVacacional: solicitud.primaVacacional ? String(solicitud.primaVacacional) : undefined,
    };
    const [created] = await db.insert(solicitudesVacaciones).values(data).returning();
    return created;
  }

  async getSolicitudVacaciones(id: string): Promise<SolicitudVacaciones | undefined> {
    const [solicitud] = await db.select().from(solicitudesVacaciones).where(eq(solicitudesVacaciones.id, id));
    return solicitud;
  }

  async getSolicitudesVacaciones(): Promise<SolicitudVacaciones[]> {
    const results = await db
      .select({
        solicitud: solicitudesVacaciones,
        empleado: {
          nombre: employees.nombre,
          apellidoPaterno: employees.apellidoPaterno,
          apellidoMaterno: employees.apellidoMaterno,
          numeroEmpleado: employees.numeroEmpleado,
          puesto: employees.puesto,
          departamento: employees.departamento,
        },
      })
      .from(solicitudesVacaciones)
      .leftJoin(employees, eq(solicitudesVacaciones.empleadoId, employees.id))
      .orderBy(desc(solicitudesVacaciones.fechaSolicitud));

    return results.map((r) => ({
      ...r.solicitud,
      empleado: r.empleado as any,
    })) as any;
  }

  async getSolicitudesVacacionesByEmpleado(empleadoId: string): Promise<SolicitudVacaciones[]> {
    return db.select().from(solicitudesVacaciones).where(eq(solicitudesVacaciones.empleadoId, empleadoId)).orderBy(desc(solicitudesVacaciones.fechaSolicitud));
  }

  async getSolicitudesVacacionesByEstatus(estatus: string): Promise<SolicitudVacaciones[]> {
    return db.select().from(solicitudesVacaciones).where(eq(solicitudesVacaciones.estatus, estatus)).orderBy(desc(solicitudesVacaciones.fechaSolicitud));
  }

  async updateSolicitudVacaciones(id: string, updates: Partial<InsertSolicitudVacaciones>): Promise<SolicitudVacaciones> {
    const data = {
      ...updates,
      primaVacacional: updates.primaVacacional !== undefined ? (updates.primaVacacional ? String(updates.primaVacacional) : null) : undefined,
      updatedAt: new Date(),
    };
    const [updated] = await db.update(solicitudesVacaciones).set(data).where(eq(solicitudesVacaciones.id, id)).returning();
    return updated;
  }

  async deleteSolicitudVacaciones(id: string): Promise<void> {
    await db.delete(solicitudesVacaciones).where(eq(solicitudesVacaciones.id, id));
  }

  // ==================== Catálogo de Tablas de Prestaciones ====================
  
  async createCatTablaPrestaciones(tabla: InsertCatTablaPrestaciones): Promise<CatTablaPrestaciones> {
    const data = {
      ...tabla,
      primaVacacionalPct: tabla.primaVacacionalPct !== undefined ? String(tabla.primaVacacionalPct) : undefined,
      factorIntegracion: tabla.factorIntegracion !== undefined ? String(tabla.factorIntegracion) : undefined,
    };
    const [created] = await db.insert(catTablasPrestaciones).values(data as any).returning();
    return created;
  }

  async getCatTablaPrestaciones(id: string): Promise<CatTablaPrestaciones | undefined> {
    const [tabla] = await db.select().from(catTablasPrestaciones).where(eq(catTablasPrestaciones.id, id));
    return tabla;
  }

  async getCatTablasPrestaciones(): Promise<CatTablaPrestaciones[]> {
    return db.select().from(catTablasPrestaciones).orderBy(catTablasPrestaciones.nombreEsquema, catTablasPrestaciones.aniosAntiguedad);
  }

  async getCatTablasPrestacionesByEsquema(nombreEsquema: string): Promise<CatTablaPrestaciones[]> {
    return db.select().from(catTablasPrestaciones)
      .where(eq(catTablasPrestaciones.nombreEsquema, nombreEsquema))
      .orderBy(catTablasPrestaciones.aniosAntiguedad);
  }

  async getCatTablasPrestacionesByEmpresa(empresaId: string): Promise<CatTablaPrestaciones[]> {
    return db.select().from(catTablasPrestaciones)
      .where(eq(catTablasPrestaciones.empresaId, empresaId))
      .orderBy(catTablasPrestaciones.nombreEsquema, catTablasPrestaciones.aniosAntiguedad);
  }

  async getCatTablaPrestacionesByAnios(nombreEsquema: string, anios: number): Promise<CatTablaPrestaciones | undefined> {
    const [tabla] = await db.select().from(catTablasPrestaciones)
      .where(and(
        eq(catTablasPrestaciones.nombreEsquema, nombreEsquema),
        eq(catTablasPrestaciones.aniosAntiguedad, anios)
      ));
    return tabla;
  }

  async updateCatTablaPrestaciones(id: string, updates: Partial<InsertCatTablaPrestaciones>): Promise<CatTablaPrestaciones> {
    const data = {
      ...updates,
      primaVacacionalPct: updates.primaVacacionalPct !== undefined ? String(updates.primaVacacionalPct) : undefined,
      factorIntegracion: updates.factorIntegracion !== undefined ? String(updates.factorIntegracion) : undefined,
      updatedAt: new Date(),
    };
    const [updated] = await db.update(catTablasPrestaciones).set(data as any).where(eq(catTablasPrestaciones.id, id)).returning();
    return updated;
  }

  async deleteCatTablaPrestaciones(id: string): Promise<void> {
    await db.delete(catTablasPrestaciones).where(eq(catTablasPrestaciones.id, id));
  }

  // ==================== Kardex de Vacaciones ====================
  
  async createKardexVacaciones(kardex: InsertKardexVacaciones): Promise<KardexVacaciones> {
    const data = {
      ...kardex,
      dias: String(kardex.dias),
      saldoDespuesMovimiento: kardex.saldoDespuesMovimiento !== undefined ? String(kardex.saldoDespuesMovimiento) : undefined,
    };
    const [created] = await db.insert(kardexVacaciones).values(data as any).returning();
    return created;
  }

  async getKardexVacaciones(id: string): Promise<KardexVacaciones | undefined> {
    const [kardex] = await db.select().from(kardexVacaciones).where(eq(kardexVacaciones.id, id));
    return kardex;
  }

  async getKardexVacacionesByEmpleado(empleadoId: string): Promise<KardexVacaciones[]> {
    return db.select().from(kardexVacaciones)
      .where(eq(kardexVacaciones.empleadoId, empleadoId))
      .orderBy(kardexVacaciones.fechaMovimiento, kardexVacaciones.createdAt);
  }

  async getKardexVacacionesByEmpleadoYAnio(empleadoId: string, anioAntiguedad: number): Promise<KardexVacaciones[]> {
    return db.select().from(kardexVacaciones)
      .where(and(
        eq(kardexVacaciones.empleadoId, empleadoId),
        eq(kardexVacaciones.anioAntiguedad, anioAntiguedad)
      ))
      .orderBy(kardexVacaciones.fechaMovimiento);
  }

  async getSaldoVacacionesEmpleado(empleadoId: string): Promise<number> {
    const movimientos = await this.getKardexVacacionesByEmpleado(empleadoId);
    
    // Sumar todos los movimientos (positivos y negativos)
    const saldo = movimientos.reduce((total, mov) => {
      const dias = typeof mov.dias === 'string' ? parseFloat(mov.dias) : Number(mov.dias);
      return total + dias;
    }, 0);
    
    return saldo;
  }

  async updateKardexVacaciones(id: string, updates: Partial<InsertKardexVacaciones>): Promise<KardexVacaciones> {
    const data = {
      ...updates,
      dias: updates.dias !== undefined ? String(updates.dias) : undefined,
      saldoDespuesMovimiento: updates.saldoDespuesMovimiento !== undefined ? String(updates.saldoDespuesMovimiento) : undefined,
    };
    const [updated] = await db.update(kardexVacaciones).set(data as any).where(eq(kardexVacaciones.id, id)).returning();
    return updated;
  }

  async deleteKardexVacaciones(id: string): Promise<void> {
    await db.delete(kardexVacaciones).where(eq(kardexVacaciones.id, id));
  }

  // ==================== Incapacidades (Sick Leave Management) ====================
  
  async createIncapacidad(incapacidad: InsertIncapacidad): Promise<Incapacidad> {
    const [created] = await db.insert(incapacidades).values(incapacidad).returning();
    return created;
  }

  async getIncapacidad(id: string): Promise<Incapacidad | undefined> {
    const [incapacidad] = await db.select().from(incapacidades).where(eq(incapacidades.id, id));
    return incapacidad;
  }

  async getIncapacidades(): Promise<Incapacidad[]> {
    const results = await db
      .select({
        incapacidad: incapacidades,
        empleado: {
          nombre: employees.nombre,
          apellidoPaterno: employees.apellidoPaterno,
          apellidoMaterno: employees.apellidoMaterno,
          numeroEmpleado: employees.numeroEmpleado,
          puesto: employees.puesto,
          departamento: employees.departamento,
        },
      })
      .from(incapacidades)
      .leftJoin(employees, eq(incapacidades.empleadoId, employees.id))
      .orderBy(desc(incapacidades.createdAt));

    return results.map((r) => ({
      ...r.incapacidad,
      empleado: r.empleado as any,
    })) as any;
  }

  async getIncapacidadesByEmpleado(empleadoId: string): Promise<Incapacidad[]> {
    return db.select().from(incapacidades).where(eq(incapacidades.empleadoId, empleadoId)).orderBy(desc(incapacidades.fechaInicio));
  }

  async getIncapacidadesByTipo(tipo: string): Promise<Incapacidad[]> {
    return db.select().from(incapacidades).where(eq(incapacidades.tipo, tipo)).orderBy(desc(incapacidades.fechaInicio));
  }

  async getIncapacidadesByEstatus(estatus: string): Promise<Incapacidad[]> {
    return db.select().from(incapacidades).where(eq(incapacidades.estatus, estatus)).orderBy(desc(incapacidades.fechaInicio));
  }

  async updateIncapacidad(id: string, updates: Partial<InsertIncapacidad>): Promise<Incapacidad> {
    const data = {
      ...updates,
      updatedAt: new Date(),
    };
    const [updated] = await db.update(incapacidades).set(data).where(eq(incapacidades.id, id)).returning();
    return updated;
  }

  async deleteIncapacidad(id: string): Promise<void> {
    await db.delete(incapacidades).where(eq(incapacidades.id, id));
  }

  // ==================== Permisos (Permission Requests) ====================
  
  async createSolicitudPermiso(solicitud: InsertSolicitudPermiso): Promise<SolicitudPermiso> {
    const data = {
      ...solicitud,
      diasSolicitados: String(solicitud.diasSolicitados),
      horasPermiso: solicitud.horasPermiso ? String(solicitud.horasPermiso) : undefined,
    };
    const [created] = await db.insert(solicitudesPermisos).values(data).returning();
    return created;
  }

  async getSolicitudPermiso(id: string): Promise<SolicitudPermiso | undefined> {
    const [solicitud] = await db.select().from(solicitudesPermisos).where(eq(solicitudesPermisos.id, id));
    return solicitud;
  }

  async getSolicitudesPermisos(): Promise<SolicitudPermiso[]> {
    const results = await db
      .select({
        solicitud: solicitudesPermisos,
        empleado: {
          nombre: employees.nombre,
          apellidoPaterno: employees.apellidoPaterno,
          apellidoMaterno: employees.apellidoMaterno,
          numeroEmpleado: employees.numeroEmpleado,
          puesto: employees.puesto,
          departamento: employees.departamento,
        },
      })
      .from(solicitudesPermisos)
      .leftJoin(employees, eq(solicitudesPermisos.empleadoId, employees.id))
      .orderBy(desc(solicitudesPermisos.fechaSolicitud));

    return results.map((r) => ({
      ...r.solicitud,
      empleado: r.empleado as any,
    })) as any;
  }

  async getSolicitudesPermisosByEmpleado(empleadoId: string): Promise<SolicitudPermiso[]> {
    return db.select().from(solicitudesPermisos).where(eq(solicitudesPermisos.empleadoId, empleadoId)).orderBy(desc(solicitudesPermisos.fechaSolicitud));
  }

  async getSolicitudesPermisosByEstatus(estatus: string): Promise<SolicitudPermiso[]> {
    return db.select().from(solicitudesPermisos).where(eq(solicitudesPermisos.estatus, estatus)).orderBy(desc(solicitudesPermisos.fechaSolicitud));
  }

  async getSolicitudesPermisosByTipo(tipoPermiso: string): Promise<SolicitudPermiso[]> {
    return db.select().from(solicitudesPermisos).where(eq(solicitudesPermisos.tipoPermiso, tipoPermiso)).orderBy(desc(solicitudesPermisos.fechaSolicitud));
  }

  async updateSolicitudPermiso(id: string, updates: Partial<InsertSolicitudPermiso>): Promise<SolicitudPermiso> {
    const data = {
      ...updates,
      diasSolicitados: updates.diasSolicitados !== undefined ? String(updates.diasSolicitados) : undefined,
      horasPermiso: updates.horasPermiso !== undefined ? (updates.horasPermiso ? String(updates.horasPermiso) : null) : undefined,
      updatedAt: new Date(),
    };
    const [updated] = await db.update(solicitudesPermisos).set(data).where(eq(solicitudesPermisos.id, id)).returning();
    return updated;
  }

  async deleteSolicitudPermiso(id: string): Promise<void> {
    await db.delete(solicitudesPermisos).where(eq(solicitudesPermisos.id, id));
  }

  // ==================== Actas Administrativas ====================
  
  async createActaAdministrativa(acta: InsertActaAdministrativa): Promise<ActaAdministrativa> {
    const data = {
      ...acta,
      diasSuspension: acta.diasSuspension !== undefined ? (acta.diasSuspension !== null ? (typeof acta.diasSuspension === 'string' ? Number(acta.diasSuspension) : acta.diasSuspension) : null) : null,
      montoDescuento: acta.montoDescuento !== undefined ? (acta.montoDescuento !== null ? String(acta.montoDescuento) : null) : null,
    };
    const [created] = await db.insert(actasAdministrativas).values(data).returning();
    return created;
  }

  async getActaAdministrativa(id: string): Promise<ActaAdministrativa | undefined> {
    const [acta] = await db.select().from(actasAdministrativas).where(eq(actasAdministrativas.id, id));
    return acta;
  }

  async getActasAdministrativas(): Promise<ActaAdministrativa[]> {
    const results = await db
      .select({
        acta: actasAdministrativas,
        empleado: {
          nombre: employees.nombre,
          apellidoPaterno: employees.apellidoPaterno,
          apellidoMaterno: employees.apellidoMaterno,
          numeroEmpleado: employees.numeroEmpleado,
          puesto: employees.puesto,
          departamento: employees.departamento,
        },
      })
      .from(actasAdministrativas)
      .leftJoin(employees, eq(actasAdministrativas.empleadoId, employees.id))
      .orderBy(desc(actasAdministrativas.fechaElaboracion));

    return results.map((r) => ({
      ...r.acta,
      empleado: r.empleado as any,
    })) as any;
  }

  async getActasAdministrativasByEmpleado(empleadoId: string): Promise<ActaAdministrativa[]> {
    return db.select().from(actasAdministrativas).where(eq(actasAdministrativas.empleadoId, empleadoId)).orderBy(desc(actasAdministrativas.fechaElaboracion));
  }

  async getActasAdministrativasByEstatus(estatus: string): Promise<ActaAdministrativa[]> {
    return db.select().from(actasAdministrativas).where(eq(actasAdministrativas.estatus, estatus)).orderBy(desc(actasAdministrativas.fechaElaboracion));
  }

  async updateActaAdministrativa(id: string, updates: Partial<InsertActaAdministrativa>): Promise<ActaAdministrativa> {
    const data = {
      ...updates,
      diasSuspension: updates.diasSuspension !== undefined ? 
        (updates.diasSuspension !== null ? (typeof updates.diasSuspension === 'string' ? Number(updates.diasSuspension) : updates.diasSuspension) : null) 
        : undefined,
      montoDescuento: updates.montoDescuento !== undefined ? 
        (updates.montoDescuento !== null ? String(updates.montoDescuento) : null) 
        : undefined,
      updatedAt: new Date(),
    };
    const [updated] = await db.update(actasAdministrativas).set(data).where(eq(actasAdministrativas.id, id)).returning();
    return updated;
  }

  async deleteActaAdministrativa(id: string): Promise<void> {
    await db.delete(actasAdministrativas).where(eq(actasAdministrativas.id, id));
  }

  // ==================== Helper Methods for Business Logic ====================

  // Vacaciones helpers
  async checkVacacionesOverlap(empleadoId: string, fechaInicio: string, fechaFin: string, excludeId?: string): Promise<SolicitudVacaciones[]> {
    let query = db.select().from(solicitudesVacaciones).where(
      and(
        eq(solicitudesVacaciones.empleadoId, empleadoId),
        not(eq(solicitudesVacaciones.estatus, "cancelada")),
        not(eq(solicitudesVacaciones.estatus, "rechazada")),
        // Check for date overlap: (start1 <= end2) AND (end1 >= start2)
        lte(solicitudesVacaciones.fechaInicio, fechaFin),
        gte(solicitudesVacaciones.fechaFin, fechaInicio)
      )
    );

    const results = await query;
    
    // Exclude current record if updating
    if (excludeId) {
      return results.filter(r => r.id !== excludeId);
    }
    return results;
  }

  async getPendingVacacionesApprovals(): Promise<SolicitudVacaciones[]> {
    return db.select().from(solicitudesVacaciones)
      .where(eq(solicitudesVacaciones.estatus, "pendiente"))
      .orderBy(desc(solicitudesVacaciones.fechaSolicitud));
  }

  async getEmpleadoVacationBalance(empleadoId: string, year: number): Promise<{ disponibles: number, usados: number, pendientes: number }> {
    // Get approved and pending vacation requests for the year
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;
    
    const solicitudes = await db.select().from(solicitudesVacaciones).where(
      and(
        eq(solicitudesVacaciones.empleadoId, empleadoId),
        gte(solicitudesVacaciones.fechaInicio, startDate),
        lte(solicitudesVacaciones.fechaInicio, endDate)
      )
    );

    const usados = solicitudes
      .filter(s => s.estatus === "aprobada")
      .reduce((sum, s) => sum + Number(s.diasSolicitados), 0);
    
    const pendientes = solicitudes
      .filter(s => s.estatus === "pendiente")
      .reduce((sum, s) => sum + Number(s.diasSolicitados), 0);

    // Get employee info to calculate legal vacation days based on seniority
    const [employee] = await db.select().from(employees).where(eq(employees.id, empleadoId));
    
    let disponibles = 12; // Default: 1 year = 12 days per LFT Art 76
    
    if (employee && employee.fechaIngreso) {
      const ingreso = new Date(employee.fechaIngreso);
      const yearsWorked = year - ingreso.getFullYear();
      
      // LFT Art 76 - vacation days based on years of service
      if (yearsWorked >= 1 && yearsWorked < 2) disponibles = 12;
      else if (yearsWorked >= 2 && yearsWorked < 3) disponibles = 14;
      else if (yearsWorked >= 3 && yearsWorked < 4) disponibles = 16;
      else if (yearsWorked >= 4 && yearsWorked < 5) disponibles = 18;
      else if (yearsWorked >= 5 && yearsWorked < 10) disponibles = 20;
      else if (yearsWorked >= 10 && yearsWorked < 15) disponibles = 22;
      else if (yearsWorked >= 15 && yearsWorked < 20) disponibles = 24;
      else if (yearsWorked >= 20 && yearsWorked < 25) disponibles = 26;
      else if (yearsWorked >= 25 && yearsWorked < 30) disponibles = 28;
      else if (yearsWorked >= 30) disponibles = 30;
    }

    return {
      disponibles: disponibles - usados,
      usados,
      pendientes,
    };
  }

  // Incapacidades helpers - with access control for sensitive medical data
  async checkIncapacidadesOverlap(empleadoId: string, fechaInicio: string, fechaFin: string, excludeId?: string): Promise<Incapacidad[]> {
    let query = db.select().from(incapacidades).where(
      and(
        eq(incapacidades.empleadoId, empleadoId),
        not(eq(incapacidades.estatus, "rechazada_imss")),
        // Check for date overlap
        lte(incapacidades.fechaInicio, fechaFin),
        gte(incapacidades.fechaFin, fechaInicio)
      )
    );

    const results = await query;
    
    // Exclude current record if updating
    if (excludeId) {
      return results.filter(r => r.id !== excludeId);
    }
    return results;
  }

  async getIncapacidadesScopedByUser(userId: string, isAdmin: boolean): Promise<Incapacidad[]> {
    if (isAdmin) {
      // Admins see all incapacidades
      return db.select().from(incapacidades).orderBy(desc(incapacidades.createdAt));
    } else {
      // Non-admins only see their own incapacidades
      // Assuming userId maps to empleadoId (this should be joined with users table in production)
      return db.select().from(incapacidades)
        .where(eq(incapacidades.empleadoId, userId))
        .orderBy(desc(incapacidades.createdAt));
    }
  }

  async getIncapacidadSecure(id: string, userId: string, isAdmin: boolean): Promise<Incapacidad | undefined> {
    const [incapacidad] = await db.select().from(incapacidades).where(eq(incapacidades.id, id));
    
    if (!incapacidad) {
      return undefined;
    }

    // Access control: non-admins can only access their own records
    if (!isAdmin && incapacidad.empleadoId !== userId) {
      return undefined;
    }

    // For non-admins, mask sensitive medical information
    if (!isAdmin) {
      return {
        ...incapacidad,
        diagnostico: "[INFORMACIÓN MÉDICA CONFIDENCIAL]",
        medicoNombre: null,
        unidadMedica: null,
        notasInternas: null,
      };
    }

    return incapacidad;
  }

  // Permisos helpers
  async checkPermisosOverlap(empleadoId: string, fechaInicio: string, fechaFin: string, excludeId?: string): Promise<SolicitudPermiso[]> {
    let query = db.select().from(solicitudesPermisos).where(
      and(
        eq(solicitudesPermisos.empleadoId, empleadoId),
        not(eq(solicitudesPermisos.estatus, "cancelada")),
        not(eq(solicitudesPermisos.estatus, "rechazada")),
        // Check for date overlap
        lte(solicitudesPermisos.fechaInicio, fechaFin),
        gte(solicitudesPermisos.fechaFin, fechaInicio)
      )
    );

    const results = await query;
    
    // Exclude current record if updating
    if (excludeId) {
      return results.filter(r => r.id !== excludeId);
    }
    return results;
  }

  async getPendingPermisosApprovals(): Promise<SolicitudPermiso[]> {
    return db.select().from(solicitudesPermisos)
      .where(eq(solicitudesPermisos.estatus, "pendiente"))
      .orderBy(desc(solicitudesPermisos.fechaSolicitud));
  }

  // Bancos Layouts
  async createBancoLayout(layout: InsertBancoLayout): Promise<BancoLayout> {
    const [result] = await db.insert(bancosLayouts).values(layout).returning();
    return result;
  }

  async getBancoLayout(id: string): Promise<BancoLayout | undefined> {
    const [result] = await db.select().from(bancosLayouts).where(eq(bancosLayouts.id, id));
    return result || undefined;
  }

  async getBancosLayouts(): Promise<BancoLayout[]> {
    return db.select().from(bancosLayouts).orderBy(bancosLayouts.nombre);
  }

  async getBancoLayoutByCodigo(codigoBanco: string): Promise<BancoLayout | undefined> {
    const [result] = await db.select().from(bancosLayouts).where(eq(bancosLayouts.codigoBanco, codigoBanco));
    return result || undefined;
  }

  async getActiveBancosLayouts(): Promise<BancoLayout[]> {
    return db.select().from(bancosLayouts)
      .where(eq(bancosLayouts.activo, true))
      .orderBy(bancosLayouts.nombre);
  }

  async updateBancoLayout(id: string, updates: Partial<InsertBancoLayout>): Promise<BancoLayout> {
    const [result] = await db
      .update(bancosLayouts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(bancosLayouts.id, id))
      .returning();
    return result;
  }

  async deleteBancoLayout(id: string): Promise<void> {
    await db.update(bancosLayouts)
      .set({ activo: false, updatedAt: new Date() })
      .where(eq(bancosLayouts.id, id));
  }

  // Nóminas
  async createNomina(nomina: InsertNomina): Promise<Nomina> {
    const data = {
      ...nomina,
      totalNeto: typeof nomina.totalNeto === 'number' ? String(nomina.totalNeto) : nomina.totalNeto,
    };
    const [result] = await db.insert(nominas).values(data).returning();
    return result;
  }

  async getNomina(id: string): Promise<Nomina | undefined> {
    const [result] = await db.select().from(nominas).where(eq(nominas.id, id));
    return result || undefined;
  }

  async getNominas(): Promise<Nomina[]> {
    return db.select().from(nominas).orderBy(desc(nominas.createdAt));
  }

  async getNominasByStatus(status: string): Promise<Nomina[]> {
    return db.select().from(nominas)
      .where(eq(nominas.status, status))
      .orderBy(desc(nominas.createdAt));
  }

  async getNominasByPeriodo(periodo: string): Promise<Nomina[]> {
    return db.select().from(nominas)
      .where(eq(nominas.periodo, periodo))
      .orderBy(desc(nominas.fechaPago));
  }

  async updateNominaStatus(id: string, status: string, aprobadoPor?: string): Promise<Nomina> {
    const updates: any = {
      status,
      updatedAt: new Date()
    };
    
    if (aprobadoPor) {
      updates.aprobadoPor = aprobadoPor;
      updates.fechaAprobacion = new Date();
    }
    
    const [result] = await db
      .update(nominas)
      .set(updates)
      .where(eq(nominas.id, id))
      .returning();
    return result;
  }

  async updateNomina(id: string, updates: Partial<InsertNomina>): Promise<Nomina> {
    const data = {
      ...updates,
      totalNeto: updates.totalNeto !== undefined ? (typeof updates.totalNeto === 'number' ? String(updates.totalNeto) : updates.totalNeto) : undefined,
      updatedAt: new Date(),
    };
    const [result] = await db
      .update(nominas)
      .set(data)
      .where(eq(nominas.id, id))
      .returning();
    return result;
  }

  async deleteNomina(id: string): Promise<void> {
    await db.delete(nominas).where(eq(nominas.id, id));
  }

  // Conceptos de Nómina
  async createConceptoNomina(concepto: InsertConceptoNomina): Promise<ConceptoNomina> {
    const [result] = await db.insert(conceptosNomina).values(concepto).returning();
    return result;
  }

  async getConceptoNomina(id: string): Promise<ConceptoNomina | undefined> {
    const [result] = await db.select().from(conceptosNomina).where(eq(conceptosNomina.id, id));
    return result || undefined;
  }

  async getConceptosNomina(): Promise<ConceptoNomina[]> {
    return db.select().from(conceptosNomina).orderBy(conceptosNomina.nombre);
  }

  async getConceptosNominaActivos(): Promise<ConceptoNomina[]> {
    return db.select().from(conceptosNomina)
      .where(eq(conceptosNomina.activo, true))
      .orderBy(conceptosNomina.nombre);
  }

  async updateConceptoNomina(id: string, updates: Partial<InsertConceptoNomina>): Promise<ConceptoNomina> {
    const [result] = await db
      .update(conceptosNomina)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(conceptosNomina.id, id))
      .returning();
    return result;
  }

  async deleteConceptoNomina(id: string): Promise<void> {
    await db.delete(conceptosNomina).where(eq(conceptosNomina.id, id));
  }

  // Períodos de Nómina
  async createPeriodoNomina(periodo: InsertPeriodoNomina): Promise<PeriodoNomina> {
    const [result] = await db.insert(periodosNomina).values(periodo).returning();
    return result;
  }

  async getPeriodoNomina(id: string): Promise<PeriodoNomina | undefined> {
    const [result] = await db.select().from(periodosNomina).where(eq(periodosNomina.id, id));
    return result || undefined;
  }

  async getPeriodosNomina(): Promise<PeriodoNomina[]> {
    return db.select().from(periodosNomina)
      .orderBy(desc(periodosNomina.fechaInicio));
  }

  async getPeriodosNominaByGrupo(grupoNominaId: string): Promise<PeriodoNomina[]> {
    return db.select().from(periodosNomina)
      .where(eq(periodosNomina.grupoNominaId, grupoNominaId))
      .orderBy(desc(periodosNomina.fechaInicio));
  }

  async getPeriodosNominaByEmpresa(empresaId: string): Promise<PeriodoNomina[]> {
    return db.select().from(periodosNomina)
      .where(eq(periodosNomina.empresaId, empresaId))
      .orderBy(desc(periodosNomina.fechaInicio));
  }

  async updatePeriodoNomina(id: string, updates: Partial<InsertPeriodoNomina>): Promise<PeriodoNomina> {
    const [result] = await db
      .update(periodosNomina)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(periodosNomina.id, id))
      .returning();
    return result;
  }

  async deletePeriodoNomina(id: string): Promise<void> {
    await db.delete(periodosNomina).where(eq(periodosNomina.id, id));
  }

  // Incidencias de Nómina
  async createIncidenciaNomina(incidencia: InsertIncidenciaNomina): Promise<IncidenciaNomina> {
    const [result] = await db.insert(incidenciasNomina).values(incidencia).returning();
    return result;
  }

  async getIncidenciaNomina(id: string): Promise<IncidenciaNomina | undefined> {
    const [result] = await db.select().from(incidenciasNomina).where(eq(incidenciasNomina.id, id));
    return result || undefined;
  }

  async getIncidenciasNomina(): Promise<IncidenciaNomina[]> {
    return db.select().from(incidenciasNomina).orderBy(desc(incidenciasNomina.createdAt));
  }

  async getIncidenciasNominaByPeriodo(periodoNominaId: string): Promise<IncidenciaNomina[]> {
    return db.select().from(incidenciasNomina)
      .where(eq(incidenciasNomina.periodoId, periodoNominaId))
      .orderBy(incidenciasNomina.empleadoId);
  }

  async getIncidenciasNominaByEmpleado(empleadoId: string): Promise<IncidenciaNomina[]> {
    return db.select().from(incidenciasNomina)
      .where(eq(incidenciasNomina.empleadoId, empleadoId))
      .orderBy(desc(incidenciasNomina.createdAt));
  }

  async updateIncidenciaNomina(id: string, updates: Partial<InsertIncidenciaNomina>): Promise<IncidenciaNomina> {
    const [result] = await db
      .update(incidenciasNomina)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(incidenciasNomina.id, id))
      .returning();
    return result;
  }

  async deleteIncidenciaNomina(id: string): Promise<void> {
    await db.delete(incidenciasNomina).where(eq(incidenciasNomina.id, id));
  }

  // Movimientos de Nómina
  async createNominaMovimiento(movimiento: InsertNominaMovimiento): Promise<NominaMovimiento> {
    const [result] = await db.insert(nominaMovimientos).values(movimiento).returning();
    return result;
  }

  async getNominaMovimiento(id: string): Promise<NominaMovimiento | undefined> {
    const [result] = await db.select().from(nominaMovimientos).where(eq(nominaMovimientos.id, id));
    return result || undefined;
  }

  async getNominaMovimientos(): Promise<NominaMovimiento[]> {
    return db.select().from(nominaMovimientos).orderBy(desc(nominaMovimientos.createdAt));
  }

  async getNominaMovimientosByPeriodo(periodoNominaId: string): Promise<NominaMovimiento[]> {
    return db.select().from(nominaMovimientos)
      .where(eq(nominaMovimientos.periodoId, periodoNominaId))
      .orderBy(nominaMovimientos.empleadoId, nominaMovimientos.conceptoId);
  }

  async getNominaMovimientosByEmpleado(empleadoId: string): Promise<NominaMovimiento[]> {
    return db.select().from(nominaMovimientos)
      .where(eq(nominaMovimientos.empleadoId, empleadoId))
      .orderBy(desc(nominaMovimientos.createdAt));
  }

  async deleteNominaMovimiento(id: string): Promise<void> {
    await db.delete(nominaMovimientos).where(eq(nominaMovimientos.id, id));
  }

  // Resumen de Nómina
  async createNominaResumen(resumen: InsertNominaResumen): Promise<NominaResumen> {
    const [result] = await db.insert(nominaResumen).values(resumen).returning();
    return result;
  }

  async getNominaResumen(id: string): Promise<NominaResumen | undefined> {
    const [result] = await db.select().from(nominaResumen).where(eq(nominaResumen.id, id));
    return result || undefined;
  }

  async getNominaResumenes(): Promise<NominaResumen[]> {
    return db.select().from(nominaResumen).orderBy(desc(nominaResumen.createdAt));
  }

  async getNominaResumenesByPeriodo(periodoNominaId: string): Promise<NominaResumen[]> {
    return db.select().from(nominaResumen)
      .where(eq(nominaResumen.periodoId, periodoNominaId))
      .orderBy(nominaResumen.empleadoId);
  }

  async getNominaResumenesByEmpleado(empleadoId: string): Promise<NominaResumen[]> {
    return db.select().from(nominaResumen)
      .where(eq(nominaResumen.empleadoId, empleadoId))
      .orderBy(desc(nominaResumen.createdAt));
  }

  async deleteNominaResumen(id: string): Promise<void> {
    await db.delete(nominaResumen).where(eq(nominaResumen.id, id));
  }

  // Clientes
  async createCliente(cliente: InsertCliente): Promise<Cliente> {
    const [result] = await db.insert(clientes).values(cliente).returning();
    return result;
  }

  async getCliente(id: string): Promise<Cliente | undefined> {
    const [result] = await db.select().from(clientes).where(eq(clientes.id, id));
    return result || undefined;
  }

  async getClientes(): Promise<Cliente[]> {
    return db.select().from(clientes).orderBy(clientes.nombreComercial);
  }

  async getClientesActivos(): Promise<Cliente[]> {
    return db.select().from(clientes)
      .where(eq(clientes.activo, true))
      .orderBy(clientes.nombreComercial);
  }

  async updateCliente(id: string, updates: Partial<InsertCliente>): Promise<Cliente> {
    const [result] = await db
      .update(clientes)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(clientes.id, id))
      .returning();
    return result;
  }

  async deleteCliente(id: string): Promise<void> {
    await db.update(clientes)
      .set({ activo: false, updatedAt: new Date() })
      .where(eq(clientes.id, id));
  }

  // Módulos
  async createModulo(modulo: InsertModulo): Promise<Modulo> {
    const [result] = await db.insert(modulos).values(modulo).returning();
    return result;
  }

  async getModulo(id: string): Promise<Modulo | undefined> {
    const [result] = await db.select().from(modulos).where(eq(modulos.id, id));
    return result || undefined;
  }

  async getModulos(): Promise<Modulo[]> {
    return db.select().from(modulos).orderBy(modulos.orden);
  }

  async getModulosActivos(): Promise<Modulo[]> {
    return db.select().from(modulos)
      .where(eq(modulos.activo, true))
      .orderBy(modulos.orden);
  }

  async updateModulo(id: string, updates: Partial<InsertModulo>): Promise<Modulo> {
    const [result] = await db
      .update(modulos)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(modulos.id, id))
      .returning();
    return result;
  }

  async deleteModulo(id: string): Promise<void> {
    await db.update(modulos)
      .set({ activo: false, updatedAt: new Date() })
      .where(eq(modulos.id, id));
  }

  // Usuarios Permisos
  async createUsuarioPermiso(permiso: InsertUsuarioPermiso): Promise<UsuarioPermiso> {
    const [result] = await db.insert(usuariosPermisos).values(permiso).returning();
    return result;
  }

  async getUsuarioPermiso(id: string): Promise<UsuarioPermiso | undefined> {
    const [result] = await db.select().from(usuariosPermisos).where(eq(usuariosPermisos.id, id));
    return result || undefined;
  }

  async getUsuariosPermisos(): Promise<UsuarioPermiso[]> {
    return db.select().from(usuariosPermisos);
  }

  async getPermisosByUsuario(usuarioId: string): Promise<UsuarioPermiso[]> {
    return db.select().from(usuariosPermisos).where(eq(usuariosPermisos.usuarioId, usuarioId));
  }

  async getPermisosByCliente(clienteId: string): Promise<UsuarioPermiso[]> {
    return db.select().from(usuariosPermisos).where(eq(usuariosPermisos.clienteId, clienteId));
  }

  async getPermisosByEmpresa(empresaId: string): Promise<UsuarioPermiso[]> {
    return db.select().from(usuariosPermisos).where(eq(usuariosPermisos.empresaId, empresaId));
  }

  async updateUsuarioPermiso(id: string, updates: Partial<InsertUsuarioPermiso>): Promise<UsuarioPermiso> {
    const [result] = await db
      .update(usuariosPermisos)
      .set(updates)
      .where(eq(usuariosPermisos.id, id))
      .returning();
    return result;
  }

  async deleteUsuarioPermiso(id: string): Promise<void> {
    await db.delete(usuariosPermisos).where(eq(usuariosPermisos.id, id));
  }

  // Super Admin methods
  async getAllUsers(): Promise<PublicUser[]> {
    // Exclude sensitive fields like password
    // Note: users table has minimal fields; detailed personal data lives in employees table
    return db.select({
      id: users.id,
      username: users.username,
      nombre: users.nombre,
      email: users.email,
      tipoUsuario: users.tipoUsuario,
      clienteId: users.clienteId,
      role: users.role,
      activo: users.activo,
      isSuperAdmin: users.isSuperAdmin,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    }).from(users);
  }

  async updateUser(id: string, updates: UpdateUser): Promise<User> {
    // Validate updates at runtime - only allows safe fields
    const validatedUpdates = updateUserSchema.parse(updates);
    
    const [result] = await db
      .update(users)
      .set(validatedUpdates)
      .where(eq(users.id, id))
      .returning();
    
    if (!result) {
      throw new Error(`Usuario con ID ${id} no encontrado`);
    }
    
    return result;
  }

  async deleteUser(id: string, actingUserId: string): Promise<void> {
    // Prevent self-deletion (required parameter ensures check cannot be bypassed)
    if (id === actingUserId) {
      throw new Error(`No puedes eliminar tu propia cuenta de super admin`);
    }

    // Check if user exists first
    const user = await this.getUser(id);
    if (!user) {
      throw new Error(`Usuario con ID ${id} no encontrado`);
    }
    
    try {
      await db.delete(users).where(eq(users.id, id));
    } catch (error: any) {
      // Handle FK constraint violations with a clear message
      if (error.code === '23503' || error.message?.includes('foreign key')) {
        throw new Error(`No se puede eliminar el usuario porque tiene registros asociados (permisos, logs de auditoría, etc.)`);
      }
      throw error;
    }
  }

  async createAdminAuditLog(log: InsertAdminAuditLog): Promise<AdminAuditLog> {
    const [result] = await db
      .insert(adminAuditLogs)
      .values(log)
      .returning();
    return result;
  }

  async getAdminAuditLogs(limit?: number): Promise<AdminAuditLog[]> {
    const query = db.select().from(adminAuditLogs).orderBy(desc(adminAuditLogs.createdAt));
    if (limit) {
      return query.limit(limit);
    }
    return query;
  }

  // ==================== Nuevo Sistema Modular de Prestaciones ====================

  // Tipos de Beneficio
  async getTiposBeneficio(): Promise<TipoBeneficio[]> {
    return db.select().from(tiposBeneficio).orderBy(tiposBeneficio.orden);
  }

  async getTipoBeneficio(id: string): Promise<TipoBeneficio | undefined> {
    const [result] = await db.select().from(tiposBeneficio).where(eq(tiposBeneficio.id, id));
    return result;
  }

  async getTipoBeneficioByCodigo(codigo: string): Promise<TipoBeneficio | undefined> {
    const [result] = await db.select().from(tiposBeneficio).where(eq(tiposBeneficio.codigo, codigo));
    return result;
  }

  // Esquemas de Prestaciones
  async createEsquemaPresta(esquema: InsertEsquemaPresta): Promise<EsquemaPresta> {
    const [result] = await db.insert(esquemasPresta).values(esquema).returning();
    return result;
  }

  async getEsquemaPresta(id: string): Promise<EsquemaPresta | undefined> {
    const [result] = await db.select().from(esquemasPresta).where(eq(esquemasPresta.id, id));
    return result;
  }

  async getEsquemasPresta(): Promise<EsquemaPresta[]> {
    return db.select().from(esquemasPresta).orderBy(esquemasPresta.nombre);
  }

  async getEsquemasPrestaActivos(): Promise<EsquemaPresta[]> {
    return db.select().from(esquemasPresta)
      .where(eq(esquemasPresta.activo, true))
      .orderBy(esquemasPresta.nombre);
  }

  async updateEsquemaPresta(id: string, updates: Partial<InsertEsquemaPresta>): Promise<EsquemaPresta> {
    const [result] = await db.update(esquemasPresta)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(esquemasPresta.id, id))
      .returning();
    return result;
  }

  async deleteEsquemaPresta(id: string): Promise<void> {
    await db.delete(esquemasPresta).where(eq(esquemasPresta.id, id));
  }

  // Tabla de Vacaciones por Esquema
  async createEsquemaVacaciones(row: InsertEsquemaVacacionesRow): Promise<EsquemaVacacionesRow> {
    const [result] = await db.insert(esquemaVacaciones).values(row).returning();
    return result;
  }

  async getEsquemaVacaciones(esquemaId: string): Promise<EsquemaVacacionesRow[]> {
    return db.select().from(esquemaVacaciones)
      .where(eq(esquemaVacaciones.esquemaId, esquemaId))
      .orderBy(esquemaVacaciones.aniosAntiguedad);
  }

  async updateEsquemaVacacionesRow(id: string, updates: Partial<InsertEsquemaVacacionesRow>): Promise<EsquemaVacacionesRow> {
    const [result] = await db.update(esquemaVacaciones)
      .set(updates)
      .where(eq(esquemaVacaciones.id, id))
      .returning();
    return result;
  }

  async deleteEsquemaVacacionesRow(id: string): Promise<void> {
    await db.delete(esquemaVacaciones).where(eq(esquemaVacaciones.id, id));
  }

  async deleteEsquemaVacacionesByEsquema(esquemaId: string): Promise<void> {
    await db.delete(esquemaVacaciones).where(eq(esquemaVacaciones.esquemaId, esquemaId));
  }

  // Beneficios por Esquema
  async createEsquemaBeneficio(beneficio: InsertEsquemaBeneficio): Promise<EsquemaBeneficio> {
    const data = {
      ...beneficio,
      valor: String(beneficio.valor),
    };
    const [result] = await db.insert(esquemaBeneficios).values(data as any).returning();
    return result;
  }

  async getEsquemaBeneficios(esquemaId: string): Promise<EsquemaBeneficio[]> {
    return db.select().from(esquemaBeneficios)
      .where(eq(esquemaBeneficios.esquemaId, esquemaId));
  }

  async updateEsquemaBeneficio(id: string, updates: Partial<InsertEsquemaBeneficio>): Promise<EsquemaBeneficio> {
    const data = {
      ...updates,
      valor: updates.valor !== undefined ? String(updates.valor) : undefined,
      updatedAt: new Date(),
    };
    const [result] = await db.update(esquemaBeneficios)
      .set(data as any)
      .where(eq(esquemaBeneficios.id, id))
      .returning();
    return result;
  }

  async deleteEsquemaBeneficio(id: string): Promise<void> {
    await db.delete(esquemaBeneficios).where(eq(esquemaBeneficios.id, id));
  }

  async deleteEsquemaBeneficiosByEsquema(esquemaId: string): Promise<void> {
    await db.delete(esquemaBeneficios).where(eq(esquemaBeneficios.esquemaId, esquemaId));
  }

  // Beneficios Extra por Puesto
  async createPuestoBeneficioExtra(beneficio: InsertPuestoBeneficioExtra): Promise<PuestoBeneficioExtra> {
    const data = {
      ...beneficio,
      valorExtra: String(beneficio.valorExtra),
    };
    const [result] = await db.insert(puestoBeneficiosExtra).values(data as any).returning();
    return result;
  }

  async getPuestoBeneficiosExtra(puestoId: string): Promise<PuestoBeneficioExtra[]> {
    return db.select().from(puestoBeneficiosExtra)
      .where(eq(puestoBeneficiosExtra.puestoId, puestoId));
  }

  async updatePuestoBeneficioExtra(id: string, updates: Partial<InsertPuestoBeneficioExtra>): Promise<PuestoBeneficioExtra> {
    const data = {
      ...updates,
      valorExtra: updates.valorExtra !== undefined ? String(updates.valorExtra) : undefined,
      updatedAt: new Date(),
    };
    const [result] = await db.update(puestoBeneficiosExtra)
      .set(data as any)
      .where(eq(puestoBeneficiosExtra.id, id))
      .returning();
    return result;
  }

  async deletePuestoBeneficioExtra(id: string): Promise<void> {
    await db.delete(puestoBeneficiosExtra).where(eq(puestoBeneficiosExtra.id, id));
  }

  // Beneficios Extra por Empleado
  async createEmpleadoBeneficioExtra(beneficio: InsertEmpleadoBeneficioExtra): Promise<EmpleadoBeneficioExtra> {
    const data = {
      ...beneficio,
      valorExtra: String(beneficio.valorExtra),
    };
    const [result] = await db.insert(empleadoBeneficiosExtra).values(data as any).returning();
    return result;
  }

  async getEmpleadoBeneficiosExtra(empleadoId: string): Promise<EmpleadoBeneficioExtra[]> {
    return db.select().from(empleadoBeneficiosExtra)
      .where(eq(empleadoBeneficiosExtra.empleadoId, empleadoId));
  }

  async updateEmpleadoBeneficioExtra(id: string, updates: Partial<InsertEmpleadoBeneficioExtra>): Promise<EmpleadoBeneficioExtra> {
    const data = {
      ...updates,
      valorExtra: updates.valorExtra !== undefined ? String(updates.valorExtra) : undefined,
      updatedAt: new Date(),
    };
    const [result] = await db.update(empleadoBeneficiosExtra)
      .set(data as any)
      .where(eq(empleadoBeneficiosExtra.id, id))
      .returning();
    return result;
  }

  async deleteEmpleadoBeneficioExtra(id: string): Promise<void> {
    await db.delete(empleadoBeneficiosExtra).where(eq(empleadoBeneficiosExtra.id, id));
  }

  // ===== BENEFITS RESOLUTION ENGINE =====
  // Resolves total benefits for an employee using 3-tier additive cascade:
  // 1. LFT baseline (minimum by law)
  // 2. Esquema level (from puesto or employee's assigned scheme)
  // 3. Puesto extras (additive benefits at position level)
  // 4. Empleado extras (additive benefits at employee level)

  async getLFTEsquemaId(): Promise<string | undefined> {
    const [lftEsquema] = await db.select({ id: esquemasPresta.id })
      .from(esquemasPresta)
      .where(eq(esquemasPresta.esLey, true))
      .limit(1);
    return lftEsquema?.id;
  }

  async resolveEmployeeBenefits(empleadoId: string): Promise<{
    esquema: EsquemaPresta | null;
    vacacionesPorAnio: EsquemaVacacionesRow[];
    beneficiosBase: Array<EsquemaBeneficio & { tipoBeneficio: TipoBeneficio }>;
    puestoExtras: Array<PuestoBeneficioExtra & { tipoBeneficio: TipoBeneficio }>;
    empleadoExtras: Array<EmpleadoBeneficioExtra & { tipoBeneficio: TipoBeneficio }>;
    totales: Map<string, { tipoBeneficio: TipoBeneficio; valorTotal: number; fuentes: string[] }>;
    usandoSistemaLegacy?: boolean;
  }> {
    const employee = await this.getEmployee(empleadoId);
    if (!employee) {
      throw new Error(`Empleado no encontrado: ${empleadoId}`);
    }

    const tiposList = await db.select().from(tiposBeneficio);
    const tiposMap = new Map<string, TipoBeneficio>(tiposList.map(t => [t.id, t]));

    let esquemaId: string | undefined;
    let puestoId: string | undefined;
    let legacyEsquemaId: string | undefined;

    if (employee.puestoId) {
      const puesto = await this.getPuesto(employee.puestoId);
      if (puesto) {
        puestoId = puesto.id;
        if (puesto.esquemaPrestacionesId) {
          const esquemaCheck = await this.getEsquemaPresta(puesto.esquemaPrestacionesId);
          if (esquemaCheck) {
            esquemaId = puesto.esquemaPrestacionesId;
          } else {
            legacyEsquemaId = puesto.esquemaPrestacionesId;
          }
        }
      }
    }

    const lftEsquemaId = await this.getLFTEsquemaId();
    if (!esquemaId && !legacyEsquemaId) {
      esquemaId = lftEsquemaId;
    }

    let esquema: EsquemaPresta | null = null;
    let vacacionesPorAnio: EsquemaVacacionesRow[] = [];
    let beneficiosBase: Array<EsquemaBeneficio & { tipoBeneficio: TipoBeneficio }> = [];
    let usandoSistemaLegacy = false;

    if (legacyEsquemaId && !esquemaId) {
      let legacyRows = await db.select().from(catTablasPrestaciones)
        .where(eq(catTablasPrestaciones.id, legacyEsquemaId))
        .limit(1);
      
      if (legacyRows.length === 0) {
        legacyRows = await db.select().from(catTablasPrestaciones)
          .where(eq(catTablasPrestaciones.nombreEsquema, legacyEsquemaId))
          .limit(1);
      }
      
      const legacyRow = legacyRows[0];
      if (legacyRow) {
        usandoSistemaLegacy = true;
        const allLegacyRows = await db.select().from(catTablasPrestaciones)
          .where(eq(catTablasPrestaciones.nombreEsquema, legacyRow.nombreEsquema))
          .orderBy(catTablasPrestaciones.aniosAntiguedad);
        
        vacacionesPorAnio = allLegacyRows.map(row => ({
          id: row.id,
          esquemaId: legacyRow.nombreEsquema,
          aniosAntiguedad: row.aniosAntiguedad,
          diasVacaciones: row.diasVacaciones,
          createdAt: row.createdAt,
        }));

        const aguinaldoTipo = tiposList.find(t => t.codigo === "aguinaldo");
        const primaVacTipo = tiposList.find(t => t.codigo === "prima_vacacional");
        
        if (aguinaldoTipo) {
          beneficiosBase.push({
            id: `legacy-aguinaldo-${legacyRow.nombreEsquema}`,
            esquemaId: legacyRow.nombreEsquema,
            tipoBeneficioId: aguinaldoTipo.id,
            valor: String(legacyRow.diasAguinaldo),
            activo: true,
            createdAt: legacyRow.createdAt,
            updatedAt: legacyRow.updatedAt,
            tipoBeneficio: aguinaldoTipo,
          });
        }
        if (primaVacTipo && legacyRow.primaVacacionalPct) {
          beneficiosBase.push({
            id: `legacy-primavac-${legacyRow.nombreEsquema}`,
            esquemaId: legacyRow.nombreEsquema,
            tipoBeneficioId: primaVacTipo.id,
            valor: String(legacyRow.primaVacacionalPct),
            activo: true,
            createdAt: legacyRow.createdAt,
            updatedAt: legacyRow.updatedAt,
            tipoBeneficio: primaVacTipo,
          });
        }
      } else {
        esquemaId = lftEsquemaId;
      }
    }

    if (!usandoSistemaLegacy && esquemaId) {
      esquema = await this.getEsquemaPresta(esquemaId) || null;
      vacacionesPorAnio = await this.getEsquemaVacaciones(esquemaId);
      const esquemaBeneficiosList = await this.getEsquemaBeneficios(esquemaId);
      beneficiosBase = esquemaBeneficiosList
        .filter(b => b.activo)
        .map(b => ({
          ...b,
          tipoBeneficio: tiposMap.get(b.tipoBeneficioId)!,
        }))
        .filter(b => b.tipoBeneficio);
    }

    let puestoExtras: Array<PuestoBeneficioExtra & { tipoBeneficio: TipoBeneficio }> = [];
    if (puestoId) {
      const puestoExtrasList = await this.getPuestoBeneficiosExtra(puestoId);
      puestoExtras = puestoExtrasList
        .filter(b => b.activo)
        .map(b => ({
          ...b,
          tipoBeneficio: tiposMap.get(b.tipoBeneficioId)!,
        }))
        .filter(b => b.tipoBeneficio);
    }

    const empleadoExtrasList = await this.getEmpleadoBeneficiosExtra(empleadoId);
    const empleadoExtras = empleadoExtrasList
      .filter(b => b.activo)
      .map(b => ({
        ...b,
        tipoBeneficio: tiposMap.get(b.tipoBeneficioId)!,
      }))
      .filter(b => b.tipoBeneficio);

    const totales = new Map<string, { tipoBeneficio: TipoBeneficio; valorTotal: number; fuentes: string[] }>();

    for (const ben of beneficiosBase) {
      const existing = totales.get(ben.tipoBeneficioId);
      const valor = parseFloat(ben.valor);
      if (existing) {
        existing.valorTotal += valor;
        existing.fuentes.push("esquema");
      } else {
        totales.set(ben.tipoBeneficioId, {
          tipoBeneficio: ben.tipoBeneficio,
          valorTotal: valor,
          fuentes: ["esquema"],
        });
      }
    }

    for (const ben of puestoExtras) {
      const existing = totales.get(ben.tipoBeneficioId);
      const valor = parseFloat(ben.valorExtra);
      if (existing) {
        existing.valorTotal += valor;
        existing.fuentes.push("puesto");
      } else {
        totales.set(ben.tipoBeneficioId, {
          tipoBeneficio: ben.tipoBeneficio,
          valorTotal: valor,
          fuentes: ["puesto"],
        });
      }
    }

    for (const ben of empleadoExtras) {
      const existing = totales.get(ben.tipoBeneficioId);
      const valor = parseFloat(ben.valorExtra);
      if (existing) {
        existing.valorTotal += valor;
        existing.fuentes.push("empleado");
      } else {
        totales.set(ben.tipoBeneficioId, {
          tipoBeneficio: ben.tipoBeneficio,
          valorTotal: valor,
          fuentes: ["empleado"],
        });
      }
    }

    return {
      esquema,
      vacacionesPorAnio,
      beneficiosBase,
      puestoExtras,
      empleadoExtras,
      totales,
      usandoSistemaLegacy,
    };
  }

  async resolveVacationDays(empleadoId: string, aniosAntiguedad: number): Promise<{
    diasVacaciones: number;
    esquema: EsquemaPresta | null;
    fuente: "esquema" | "lft" | "legacy";
  }> {
    const employee = await this.getEmployee(empleadoId);
    if (!employee) {
      throw new Error(`Empleado no encontrado: ${empleadoId}`);
    }

    let esquemaId: string | undefined;
    let legacyEsquemaId: string | undefined;

    if (employee.puestoId) {
      const puesto = await this.getPuesto(employee.puestoId);
      if (puesto?.esquemaPrestacionesId) {
        const esquemaCheck = await this.getEsquemaPresta(puesto.esquemaPrestacionesId);
        if (esquemaCheck) {
          esquemaId = puesto.esquemaPrestacionesId;
        } else {
          legacyEsquemaId = puesto.esquemaPrestacionesId;
        }
      }
    }

    const lftEsquemaId = await this.getLFTEsquemaId();

    let vacaciones: EsquemaVacacionesRow[] = [];
    let esquema: EsquemaPresta | null = null;
    let fuente: "esquema" | "lft" | "legacy" = "lft";

    if (esquemaId) {
      vacaciones = await this.getEsquemaVacaciones(esquemaId);
      if (vacaciones.length > 0) {
        esquema = await this.getEsquemaPresta(esquemaId) || null;
        fuente = "esquema";
      }
    }

    if (vacaciones.length === 0 && legacyEsquemaId) {
      let legacyRows = await db.select().from(catTablasPrestaciones)
        .where(eq(catTablasPrestaciones.id, legacyEsquemaId))
        .limit(1);
      
      if (legacyRows.length === 0) {
        legacyRows = await db.select().from(catTablasPrestaciones)
          .where(eq(catTablasPrestaciones.nombreEsquema, legacyEsquemaId))
          .limit(1);
      }
      
      const legacyRow = legacyRows[0];
      if (legacyRow) {
        const allLegacyRows = await db.select().from(catTablasPrestaciones)
          .where(eq(catTablasPrestaciones.nombreEsquema, legacyRow.nombreEsquema))
          .orderBy(catTablasPrestaciones.aniosAntiguedad);
        vacaciones = allLegacyRows.map(row => ({
          id: row.id,
          esquemaId: legacyRow.nombreEsquema,
          aniosAntiguedad: row.aniosAntiguedad,
          diasVacaciones: row.diasVacaciones,
          createdAt: row.createdAt,
        }));
        fuente = "legacy";
      }
    }

    if (vacaciones.length === 0 && lftEsquemaId) {
      vacaciones = await this.getEsquemaVacaciones(lftEsquemaId);
      esquema = await this.getEsquemaPresta(lftEsquemaId) || null;
      fuente = "lft";
    }

    let diasVacaciones = 12;
    for (const row of vacaciones) {
      if (aniosAntiguedad >= row.aniosAntiguedad) {
        diasVacaciones = row.diasVacaciones;
      } else {
        break;
      }
    }

    return { diasVacaciones, esquema, fuente };
  }

  // ============================================================================
  // LAYOUTS GENERADOS - Bank layouts generated from approved payroll
  // ============================================================================

  async createLayoutGenerado(layout: InsertLayoutGenerado): Promise<LayoutGenerado> {
    const [created] = await db
      .insert(layoutsGenerados)
      .values({
        ...layout,
        empleadosLayout: layout.empleadosLayout as unknown as Record<string, unknown>,
      })
      .returning();
    return created;
  }

  async getLayoutGenerado(id: string): Promise<LayoutGenerado | undefined> {
    const [layout] = await db.select().from(layoutsGenerados).where(eq(layoutsGenerados.id, id));
    return layout || undefined;
  }

  async getLayoutsGenerados(): Promise<LayoutGenerado[]> {
    return db.select().from(layoutsGenerados).orderBy(desc(layoutsGenerados.fechaGeneracion));
  }

  async getLayoutsGeneradosByNomina(nominaId: string): Promise<LayoutGenerado[]> {
    return db.select().from(layoutsGenerados)
      .where(eq(layoutsGenerados.nominaId, nominaId))
      .orderBy(desc(layoutsGenerados.fechaGeneracion));
  }

  async getLayoutsGeneradosByMedioPago(medioPagoId: string): Promise<LayoutGenerado[]> {
    return db.select().from(layoutsGenerados)
      .where(eq(layoutsGenerados.medioPagoId, medioPagoId))
      .orderBy(desc(layoutsGenerados.fechaGeneracion));
  }

  async deleteLayoutGenerado(id: string): Promise<void> {
    await db.delete(layoutsGenerados).where(eq(layoutsGenerados.id, id));
  }

  async deleteLayoutsGeneradosByNomina(nominaId: string): Promise<void> {
    await db.delete(layoutsGenerados).where(eq(layoutsGenerados.nominaId, nominaId));
  }

  // ============================================================================
  // CATÁLOGO DE BANCOS
  // ============================================================================

  async getCatBancos(): Promise<CatBanco[]> {
    return db.select().from(catBancos).where(eq(catBancos.activo, true)).orderBy(catBancos.nombreCorto);
  }

  async getCatBanco(id: string): Promise<CatBanco | undefined> {
    const [banco] = await db.select().from(catBancos).where(eq(catBancos.id, id));
    return banco || undefined;
  }

  async getCatBancoByCodigoSat(codigoSat: string): Promise<CatBanco | undefined> {
    const [banco] = await db.select().from(catBancos).where(eq(catBancos.codigoSat, codigoSat));
    return banco || undefined;
  }

  async createCatBanco(banco: InsertCatBanco): Promise<CatBanco> {
    const [created] = await db.insert(catBancos).values(banco).returning();
    return created;
  }

  // ============================================================================
  // CATÁLOGO DE VALORES UMA/SMG
  // ============================================================================

  async getCatValoresUmaSmg(): Promise<CatValorUmaSmg[]> {
    return db.select().from(catValoresUmaSmg).orderBy(desc(catValoresUmaSmg.vigenciaDesde));
  }

  async getCatValorUmaSmgVigente(tipo: string, fecha?: string): Promise<CatValorUmaSmg | undefined> {
    const targetDate = fecha || new Date().toISOString().split('T')[0];
    const [valor] = await db.select().from(catValoresUmaSmg)
      .where(and(
        eq(catValoresUmaSmg.tipo, tipo),
        lte(catValoresUmaSmg.vigenciaDesde, targetDate)
      ))
      .orderBy(desc(catValoresUmaSmg.vigenciaDesde))
      .limit(1);
    return valor || undefined;
  }

  async createCatValorUmaSmg(valor: InsertCatValorUmaSmg): Promise<CatValorUmaSmg> {
    const [created] = await db.insert(catValoresUmaSmg).values(valor).returning();
    return created;
  }

  // ============================================================================
  // KARDEX COMPENSATION (Historial de cambios salariales)
  // ============================================================================

  async createKardexCompensation(kardex: InsertKardexCompensation): Promise<KardexCompensation> {
    const [created] = await db.insert(kardexCompensation).values(kardex).returning();
    return created;
  }

  async getKardexCompensation(id: string): Promise<KardexCompensation | undefined> {
    const [kardex] = await db.select().from(kardexCompensation).where(eq(kardexCompensation.id, id));
    return kardex || undefined;
  }

  async getKardexCompensationByEmpleado(empleadoId: string): Promise<KardexCompensation[]> {
    return db.select().from(kardexCompensation)
      .where(eq(kardexCompensation.empleadoId, empleadoId))
      .orderBy(desc(kardexCompensation.fechaEfectiva));
  }

  async getKardexCompensationByEmpresa(empresaId: string): Promise<KardexCompensation[]> {
    return db.select().from(kardexCompensation)
      .where(eq(kardexCompensation.empresaId, empresaId))
      .orderBy(desc(kardexCompensation.fechaEfectiva));
  }

  // ============================================================================
  // CFDI NÓMINA (Seguimiento de timbrado)
  // ============================================================================

  async createCfdiNomina(cfdi: InsertCfdiNomina): Promise<CfdiNomina> {
    const [created] = await db.insert(cfdiNomina).values(cfdi).returning();
    return created;
  }

  async getCfdiNomina(id: string): Promise<CfdiNomina | undefined> {
    const [cfdi] = await db.select().from(cfdiNomina).where(eq(cfdiNomina.id, id));
    return cfdi || undefined;
  }

  async getCfdiNominaByUuid(uuid: string): Promise<CfdiNomina | undefined> {
    const [cfdi] = await db.select().from(cfdiNomina).where(eq(cfdiNomina.uuidFiscal, uuid));
    return cfdi || undefined;
  }

  async getCfdiNominasByEmpleado(empleadoId: string): Promise<CfdiNomina[]> {
    return db.select().from(cfdiNomina)
      .where(eq(cfdiNomina.empleadoId, empleadoId))
      .orderBy(desc(cfdiNomina.fechaTimbrado));
  }

  async getCfdiNominasByPeriodo(periodoId: string): Promise<CfdiNomina[]> {
    return db.select().from(cfdiNomina)
      .where(eq(cfdiNomina.periodoNominaId, periodoId))
      .orderBy(cfdiNomina.empleadoId);
  }

  async updateCfdiNomina(id: string, updates: Partial<InsertCfdiNomina>): Promise<CfdiNomina> {
    const [updated] = await db.update(cfdiNomina)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(cfdiNomina.id, id))
      .returning();
    return updated;
  }

  // ============================================================================
  // IMSS MOVIMIENTOS AFILIATORIOS (Phase 2)
  // ============================================================================

  async createImssMovimiento(movimiento: InsertImssMovimiento): Promise<ImssMovimiento> {
    const [created] = await db.insert(imssMovimientos).values(movimiento).returning();
    return created;
  }

  async getImssMovimiento(id: string): Promise<ImssMovimiento | undefined> {
    const [movimiento] = await db.select().from(imssMovimientos).where(eq(imssMovimientos.id, id));
    return movimiento || undefined;
  }

  async getImssMovimientosByEmpleado(empleadoId: string): Promise<ImssMovimiento[]> {
    return db.select().from(imssMovimientos)
      .where(eq(imssMovimientos.empleadoId, empleadoId))
      .orderBy(desc(imssMovimientos.fechaMovimiento));
  }

  async getImssMovimientosByEmpresa(
    empresaId: string, 
    filters?: { estatus?: string; tipoMovimiento?: string; fechaDesde?: string; fechaHasta?: string }
  ): Promise<ImssMovimiento[]> {
    const conditions = [eq(imssMovimientos.empresaId, empresaId)];
    
    if (filters?.estatus) {
      conditions.push(eq(imssMovimientos.estatus, filters.estatus));
    }
    if (filters?.tipoMovimiento) {
      conditions.push(eq(imssMovimientos.tipoMovimiento, filters.tipoMovimiento));
    }
    if (filters?.fechaDesde) {
      conditions.push(gte(imssMovimientos.fechaMovimiento, filters.fechaDesde));
    }
    if (filters?.fechaHasta) {
      conditions.push(lte(imssMovimientos.fechaMovimiento, filters.fechaHasta));
    }
    
    return db.select().from(imssMovimientos)
      .where(and(...conditions))
      .orderBy(desc(imssMovimientos.fechaMovimiento));
  }

  async getImssMovimientosByRegistroPatronal(registroPatronalId: string): Promise<ImssMovimiento[]> {
    return db.select().from(imssMovimientos)
      .where(eq(imssMovimientos.registroPatronalId, registroPatronalId))
      .orderBy(desc(imssMovimientos.fechaMovimiento));
  }

  async getImssMovimientosPendientes(empresaId?: string): Promise<ImssMovimiento[]> {
    const conditions = [eq(imssMovimientos.estatus, "pendiente")];
    if (empresaId) {
      conditions.push(eq(imssMovimientos.empresaId, empresaId));
    }
    return db.select().from(imssMovimientos)
      .where(and(...conditions))
      .orderBy(desc(imssMovimientos.fechaMovimiento));
  }

  async updateImssMovimiento(id: string, updates: Partial<InsertImssMovimiento>): Promise<ImssMovimiento> {
    const [updated] = await db.update(imssMovimientos)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(imssMovimientos.id, id))
      .returning();
    return updated;
  }

  async deleteImssMovimiento(id: string): Promise<void> {
    await db.delete(imssMovimientos).where(eq(imssMovimientos.id, id));
  }

  // ============================================================================
  // SUA BIMESTRES (Phase 2)
  // ============================================================================

  async createSuaBimestre(bimestre: InsertSuaBimestre): Promise<SuaBimestre> {
    const [created] = await db.insert(suaBimestres).values(bimestre).returning();
    return created;
  }

  async getSuaBimestre(id: string): Promise<SuaBimestre | undefined> {
    const [bimestre] = await db.select().from(suaBimestres).where(eq(suaBimestres.id, id));
    return bimestre || undefined;
  }

  async getSuaBimestreByPeriodo(
    registroPatronalId: string, 
    ejercicio: number, 
    bimestre: number
  ): Promise<SuaBimestre | undefined> {
    const [result] = await db.select().from(suaBimestres)
      .where(and(
        eq(suaBimestres.registroPatronalId, registroPatronalId),
        eq(suaBimestres.ejercicio, ejercicio),
        eq(suaBimestres.bimestre, bimestre)
      ));
    return result || undefined;
  }

  async getSuaBimestresByEmpresa(empresaId: string, ejercicio?: number): Promise<SuaBimestre[]> {
    const conditions = [eq(suaBimestres.empresaId, empresaId)];
    if (ejercicio) {
      conditions.push(eq(suaBimestres.ejercicio, ejercicio));
    }
    return db.select().from(suaBimestres)
      .where(and(...conditions))
      .orderBy(desc(suaBimestres.ejercicio), desc(suaBimestres.bimestre));
  }

  async getSuaBimestresByRegistroPatronal(registroPatronalId: string, ejercicio?: number): Promise<SuaBimestre[]> {
    const conditions = [eq(suaBimestres.registroPatronalId, registroPatronalId)];
    if (ejercicio) {
      conditions.push(eq(suaBimestres.ejercicio, ejercicio));
    }
    return db.select().from(suaBimestres)
      .where(and(...conditions))
      .orderBy(desc(suaBimestres.ejercicio), desc(suaBimestres.bimestre));
  }

  async getSuaBimestresPendientes(empresaId?: string): Promise<SuaBimestre[]> {
    const conditions = [eq(suaBimestres.estatus, "pendiente")];
    if (empresaId) {
      conditions.push(eq(suaBimestres.empresaId, empresaId));
    }
    return db.select().from(suaBimestres)
      .where(and(...conditions))
      .orderBy(desc(suaBimestres.ejercicio), desc(suaBimestres.bimestre));
  }

  async updateSuaBimestre(id: string, updates: Partial<InsertSuaBimestre>): Promise<SuaBimestre> {
    const [updated] = await db.update(suaBimestres)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(suaBimestres.id, id))
      .returning();
    return updated;
  }

  async deleteSuaBimestre(id: string): Promise<void> {
    await db.delete(suaBimestres).where(eq(suaBimestres.id, id));
  }

  // ============================================================================
  // EMPLOYEE BANK ACCOUNTS (Multi-account payment dispersion)
  // ============================================================================

  async createEmployeeBankAccount(account: InsertEmployeeBankAccount): Promise<EmployeeBankAccount> {
    const [created] = await db.insert(employeeBankAccounts).values(account).returning();
    return created;
  }

  async getEmployeeBankAccount(id: string): Promise<EmployeeBankAccount | undefined> {
    const [account] = await db.select().from(employeeBankAccounts).where(eq(employeeBankAccounts.id, id));
    return account || undefined;
  }

  async getEmployeeBankAccountsByEmpleado(empleadoId: string): Promise<EmployeeBankAccount[]> {
    return db.select().from(employeeBankAccounts)
      .where(eq(employeeBankAccounts.empleadoId, empleadoId))
      .orderBy(desc(employeeBankAccounts.esPrincipal), employeeBankAccounts.createdAt);
  }

  async getEmployeeBankAccountsByEmpresa(empresaId: string): Promise<EmployeeBankAccount[]> {
    return db.select().from(employeeBankAccounts)
      .where(eq(employeeBankAccounts.empresaId, empresaId))
      .orderBy(employeeBankAccounts.empleadoId, desc(employeeBankAccounts.esPrincipal));
  }

  async getEmployeeBankAccountByClabe(clabe: string): Promise<EmployeeBankAccount | undefined> {
    const [account] = await db.select().from(employeeBankAccounts).where(eq(employeeBankAccounts.clabe, clabe));
    return account || undefined;
  }

  async updateEmployeeBankAccount(id: string, updates: Partial<InsertEmployeeBankAccount>): Promise<EmployeeBankAccount> {
    const [updated] = await db.update(employeeBankAccounts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(employeeBankAccounts.id, id))
      .returning();
    return updated;
  }

  async deleteEmployeeBankAccount(id: string): Promise<void> {
    await db.delete(employeeBankAccounts).where(eq(employeeBankAccounts.id, id));
  }

  // ============================================================================
  // KARDEX EMPLOYMENT (Status/Contract tracking)
  // ============================================================================

  async createKardexEmployment(kardex: InsertKardexEmployment): Promise<KardexEmployment> {
    const [created] = await db.insert(kardexEmployment).values(kardex).returning();
    return created;
  }

  async getKardexEmployment(id: string): Promise<KardexEmployment | undefined> {
    const [kardex] = await db.select().from(kardexEmployment).where(eq(kardexEmployment.id, id));
    return kardex || undefined;
  }

  async getKardexEmploymentByEmpleado(empleadoId: string): Promise<KardexEmployment[]> {
    return db.select().from(kardexEmployment)
      .where(eq(kardexEmployment.empleadoId, empleadoId))
      .orderBy(desc(kardexEmployment.fechaEfectiva));
  }

  async getKardexEmploymentByEmpresa(empresaId: string): Promise<KardexEmployment[]> {
    return db.select().from(kardexEmployment)
      .where(eq(kardexEmployment.empresaId, empresaId))
      .orderBy(desc(kardexEmployment.fechaEfectiva));
  }

  // ============================================================================
  // KARDEX LABOR CONDITIONS (Position/Department tracking)
  // ============================================================================

  async createKardexLaborConditions(kardex: InsertKardexLaborConditions): Promise<KardexLaborConditions> {
    const [created] = await db.insert(kardexLaborConditions).values(kardex).returning();
    return created;
  }

  async getKardexLaborConditions(id: string): Promise<KardexLaborConditions | undefined> {
    const [kardex] = await db.select().from(kardexLaborConditions).where(eq(kardexLaborConditions.id, id));
    return kardex || undefined;
  }

  async getKardexLaborConditionsByEmpleado(empleadoId: string): Promise<KardexLaborConditions[]> {
    return db.select().from(kardexLaborConditions)
      .where(eq(kardexLaborConditions.empleadoId, empleadoId))
      .orderBy(desc(kardexLaborConditions.fechaEfectiva));
  }

  async getKardexLaborConditionsByEmpresa(empresaId: string): Promise<KardexLaborConditions[]> {
    return db.select().from(kardexLaborConditions)
      .where(eq(kardexLaborConditions.empresaId, empresaId))
      .orderBy(desc(kardexLaborConditions.fechaEfectiva));
  }

  // ============================================================================
  // KARDEX BANK ACCOUNTS (Bank info change tracking)
  // ============================================================================

  async createKardexBankAccounts(kardex: InsertKardexBankAccounts): Promise<KardexBankAccounts> {
    const [created] = await db.insert(kardexBankAccounts).values(kardex).returning();
    return created;
  }

  async getKardexBankAccounts(id: string): Promise<KardexBankAccounts | undefined> {
    const [kardex] = await db.select().from(kardexBankAccounts).where(eq(kardexBankAccounts.id, id));
    return kardex || undefined;
  }

  async getKardexBankAccountsByEmpleado(empleadoId: string): Promise<KardexBankAccounts[]> {
    return db.select().from(kardexBankAccounts)
      .where(eq(kardexBankAccounts.empleadoId, empleadoId))
      .orderBy(desc(kardexBankAccounts.fechaEfectiva));
  }

  async getKardexBankAccountsByEmpresa(empresaId: string): Promise<KardexBankAccounts[]> {
    return db.select().from(kardexBankAccounts)
      .where(eq(kardexBankAccounts.empresaId, empresaId))
      .orderBy(desc(kardexBankAccounts.fechaEfectiva));
  }

  // ============================================================================
  // GEOGRAPHIC CATALOGS (CFDI compliance)
  // ============================================================================

  async getCatPaises(): Promise<CatPais[]> {
    return db.select().from(catPaises).orderBy(catPaises.nombre);
  }

  async getCatPais(id: string): Promise<CatPais | undefined> {
    const [pais] = await db.select().from(catPaises).where(eq(catPaises.id, id));
    return pais || undefined;
  }

  async getCatPaisByCodigo(codigoPais: string): Promise<CatPais | undefined> {
    const [pais] = await db.select().from(catPaises).where(eq(catPaises.codigoPais, codigoPais));
    return pais || undefined;
  }

  async getCatEstados(): Promise<CatEstado[]> {
    return db.select().from(catEstados).orderBy(catEstados.nombre);
  }

  async getCatEstado(id: string): Promise<CatEstado | undefined> {
    const [estado] = await db.select().from(catEstados).where(eq(catEstados.id, id));
    return estado || undefined;
  }

  async getCatEstadosByCodigo(codigoPais: string): Promise<CatEstado[]> {
    return db.select().from(catEstados)
      .where(eq(catEstados.codigoPais, codigoPais))
      .orderBy(catEstados.nombre);
  }

  async getCatEstadoByCodigo(codigoPais: string, codigoEstado: string): Promise<CatEstado | undefined> {
    const [estado] = await db.select().from(catEstados)
      .where(and(
        eq(catEstados.codigoPais, codigoPais),
        eq(catEstados.codigoEstado, codigoEstado)
      ));
    return estado || undefined;
  }

  async getCatMunicipios(): Promise<CatMunicipio[]> {
    return db.select().from(catMunicipios).orderBy(catMunicipios.nombre);
  }

  async getCatMunicipio(id: string): Promise<CatMunicipio | undefined> {
    const [municipio] = await db.select().from(catMunicipios).where(eq(catMunicipios.id, id));
    return municipio || undefined;
  }

  async getCatMunicipiosByEstado(codigoPais: string, codigoEstado: string): Promise<CatMunicipio[]> {
    return db.select().from(catMunicipios)
      .where(and(
        eq(catMunicipios.codigoPais, codigoPais),
        eq(catMunicipios.codigoEstado, codigoEstado)
      ))
      .orderBy(catMunicipios.nombre);
  }

  async getCatCodigosPostales(codigoPais: string, codigoEstado: string): Promise<CatCodigoPostal[]> {
    return db.select().from(catCodigosPostales)
      .where(and(
        eq(catCodigosPostales.codigoPais, codigoPais),
        eq(catCodigosPostales.codigoEstado, codigoEstado)
      ))
      .orderBy(catCodigosPostales.codigoPostal);
  }

  async getCatCodigoPostal(id: string): Promise<CatCodigoPostal | undefined> {
    const [cp] = await db.select().from(catCodigosPostales).where(eq(catCodigosPostales.id, id));
    return cp || undefined;
  }

  async getCatCodigoPostalByCodigo(codigoPostal: string): Promise<CatCodigoPostal | undefined> {
    const [cp] = await db.select().from(catCodigosPostales).where(eq(catCodigosPostales.codigoPostal, codigoPostal));
    return cp || undefined;
  }

  async getCatCodigosPostalesByMunicipio(codigoPais: string, codigoEstado: string, codigoMunicipio: string): Promise<CatCodigoPostal[]> {
    return db.select().from(catCodigosPostales)
      .where(and(
        eq(catCodigosPostales.codigoPais, codigoPais),
        eq(catCodigosPostales.codigoEstado, codigoEstado),
        eq(catCodigosPostales.codigoMunicipio, codigoMunicipio)
      ))
      .orderBy(catCodigosPostales.codigoPostal);
  }
}

export const storage = new DatabaseStorage();
