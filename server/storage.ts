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
  type NominaMovimiento,
  type InsertNominaMovimiento,
  type NominaResumen,
  type InsertNominaResumen,
  type Cliente,
  type InsertCliente,
  type Modulo,
  type InsertModulo,
  type UsuarioPermiso,
  type InsertUsuarioPermiso,
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
  mediosPago,
  conceptosMedioPago,
  conceptosMediosPagoRel,
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
  adminAuditLogs
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, not, inArray } from "drizzle-orm";

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
}

export const storage = new DatabaseStorage();
