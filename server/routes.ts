import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { randomUUID } from "crypto";
import { z } from "zod";
import { storage } from "./storage";
import { emitDenunciaUpdate, emitDenunciaCaseUpdate } from "./websocket";
import { db } from "./db";
import { eq, and, gte, lte, ne, inArray, desc, sql } from "drizzle-orm";
import { VARIABLES_FORMULA } from "./seeds/conceptosLegales";
import { generarLayoutsBancarios, generarTodosLosLayouts, getLayoutsGeneradosForNomina, getLayoutContent } from "./layoutGenerator";
import { 
  insertConfigurationChangeLogSchema, 
  insertLegalCaseSchema,
  insertSettlementSchema,
  insertLawsuitSchema,
  updateLawsuitSchema,
  insertEmployeeSchema,
  bulkInsertEmployeeSchema,
  insertBajaSpecialConceptSchema,
  insertHiringProcessSchema,
  updateHiringProcessSchema,
  insertEmpresaSchema,
  updateEmpresaSchema,
  insertRegistroPatronalSchema,
  updateRegistroPatronalSchema,
  insertCredencialSistemaSchema,
  updateCredencialSistemaSchema,
  insertCentroTrabajoSchema,
  updateCentroTrabajoSchema,
  insertTurnoCentroTrabajoSchema,
  updateTurnoCentroTrabajoSchema,
  insertEmpleadoCentroTrabajoSchema,
  updateEmpleadoCentroTrabajoSchema,
  insertAttendanceSchema,
  insertIncidenciaAsistenciaSchema,
  updateIncidenciaAsistenciaSchema,
  insertGrupoNominaSchema,
  updateGrupoNominaSchema,
  insertHoraExtraSchema,
  updateHoraExtraSchema,
  insertClienteREPSESchema,
  updateClienteREPSESchema,
  insertRegistroREPSESchema,
  updateRegistroREPSESchema,
  insertContratoREPSESchema,
  updateContratoREPSESchema,
  insertAsignacionPersonalREPSESchema,
  updateAsignacionPersonalREPSESchema,
  insertAvisoREPSESchema,
  updateAvisoREPSESchema,
  insertCreditoLegalSchema,
  updateCreditoLegalSchema,
  insertPrestamoInternoSchema,
  updatePrestamoInternoSchema,
  insertPagoCreditoDescuentoSchema,
  insertPuestoSchema,
  updatePuestoSchema,
  insertVacanteSchema,
  insertCandidatoSchema,
  insertEtapaSeleccionSchema,
  insertProcesoSeleccionSchema,
  insertEntrevistaSchema,
  insertEvaluacionSchema,
  insertOfertaSchema,
  insertSolicitudVacacionesSchema,
  updateSolicitudVacacionesSchema,
  insertIncapacidadSchema,
  insertIncapacidadPortalSchema,
  updateIncapacidadSchema,
  insertSolicitudPermisoSchema,
  updateSolicitudPermisoSchema,
  insertActaAdministrativaSchema,
  updateActaAdministrativaSchema,
  insertMedioPagoSchema,
  updateMedioPagoSchema,
  insertConceptoMedioPagoSchema,
  updateConceptoMedioPagoSchema,
  insertPlantillaNominaSchema,
  updatePlantillaNominaSchema,
  insertPlantillaConceptoSchema,
  updatePlantillaConceptoSchema,
  insertClienteSchema,
  updateClienteSchema,
  insertModuloSchema,
  insertUsuarioPermisoSchema,
  updateUserSchema,
  insertUserSchema,
  insertPeriodoNominaSchema,
  insertIncidenciaNominaSchema,
  insertConceptoNominaSchema,
  insertNominaMovimientoSchema,
  insertImssMovimientoSchema,
  insertSuaBimestreSchema,
  insertCompensacionTrabajadorSchema,
  insertCompensacionCalculadaSchema,
  insertExentoCapConfigSchema,
  insertEmployeeExentoCapSchema,
  insertPayrollExentoLedgerSchema,
  // Cursos y Evaluaciones
  insertCategoriaCursoSchema,
  insertCursoSchema,
  insertModuloCursoSchema,
  insertLeccionCursoSchema,
  insertQuizCursoSchema,
  insertPreguntaQuizSchema,
  insertReglaAsignacionCursoSchema,
  insertAsignacionCursoSchema,
  insertProgresoLeccionSchema,
  insertIntentoQuizSchema,
  insertCertificadoCursoSchema,
  // Portal API tables
  attendance,
  incidenciasAsistencia,
  employees,
  departamentos,
  puestos,
  documentosGenerados,
  solicitudesDocumentos,
  solicitudesVacaciones,
  solicitudesPermisos,
  incapacidades,
  // Document Solicitations (HR requesting documents from employees)
  solicitudesDocumentosRH,
  insertSolicitudDocumentoRHSchema,
  documentosEmpleado
} from "@shared/schema";
import { calcularFiniquito, calcularLiquidacionInjustificada, calcularLiquidacionJustificada } from "@shared/liquidaciones";
import { supabaseStorage } from "./supabaseStorage";
import { analyzeLawsuitDocument } from "./documentAnalyzer";
import { requireSuperAdmin, requireEmployeeAuth, requireClienteAdmin, requireAuth, requireSupervisorOrAdmin, getSupervisorScope } from "./auth/middleware";
import bcrypt from "bcrypt";

// Helper function to get the effective clienteId for data filtering
// Client users are restricted to their own clienteId
// MaxTalent users can access any client based on the request query
function getEffectiveClienteId(req: Request): string | null {
  const user = req.user;

  // If user is a client user, always use their assigned clienteId
  if (user?.tipoUsuario === "cliente" && user?.clienteId) {
    return user.clienteId;
  }

  // For MaxTalent users, use the clienteId from query if provided
  const queryClienteId = req.query.clienteId as string | undefined;
  return queryClienteId || null;
}

// Alias for backwards compatibility
const getClienteIdFromRequest = getEffectiveClienteId;

// Helper function to verify access to a specific clienteId
function canAccessCliente(req: Request, targetClienteId: string): boolean {
  const user = req.user;
  
  // MaxTalent users can access any client
  if (user?.tipoUsuario === "maxtalent") {
    return true;
  }
  
  // Client users can only access their own client
  if (user?.tipoUsuario === "cliente" && user?.clienteId) {
    return user.clienteId === targetClienteId;
  }
  
  // If no user or no clienteId, deny access
  return false;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // ==================== SEED MOCK EMPLOYEES (Dev only) ====================
  if (process.env.NODE_ENV !== "production") {
    app.post("/api/seed/mock-employees", async (req, res) => {
      try {
        const seedModulePath = ["./seeds", "mockEmployees"].join("/");
        const { seedMockEmployees } = await import(seedModulePath);
        await seedMockEmployees();
        res.json({ message: "20 mock employees created successfully" });
      } catch (error: any) {
        res.status(500).json({ message: error.message });
      }
    });
  }

  // Configuration Change Logs
  app.post("/api/configuration/change-log", async (req, res) => {
    try {
      const validatedData = insertConfigurationChangeLogSchema.parse(req.body);
      const log = await storage.createChangeLog(validatedData);
      res.json(log);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/configuration/change-logs", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const logs = await storage.getChangeLogs(limit);
      res.json(logs);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/configuration/change-logs/:changeType", async (req, res) => {
    try {
      const { changeType } = req.params;
      const periodicidad = req.query.periodicidad as string | undefined;
      const logs = await storage.getChangeLogsByType(changeType, periodicidad);
      res.json(logs);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Employees
  app.post("/api/employees", async (req, res) => {
    try {
      const validatedData = insertEmployeeSchema.parse(req.body);
      const employee = await storage.createEmployee(validatedData);
      res.json(employee);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/employees/bulk", async (req, res) => {
    try {
      const { employees: employeeList, clienteId, resolveReferences } = req.body;
      
      if (!Array.isArray(employeeList)) {
        return res.status(400).json({ message: "Se esperaba un arreglo de empleados" });
      }
      
      if (!clienteId) {
        return res.status(400).json({ message: "Debes seleccionar un cliente primero" });
      }
      
      // Security: Validate clienteId access based on user type
      const user = req.user;
      if (user) {
        // MaxTalent users can import to any client
        // Client users can only import to their own client
        if (user.tipoUsuario !== "maxtalent" && user.clienteId !== clienteId) {
          return res.status(403).json({ 
            message: "No tienes permiso para importar empleados a este cliente" 
          });
        }
      }

      // Get lookup tables for this cliente
      const empresas = await storage.getEmpresas();
      const clienteEmpresas = empresas.filter(e => e.clienteId === clienteId);
      const bancos = await storage.getCatBancos();
      const allRegistrosPatronales = await storage.getRegistrosPatronales();
      const allCentrosTrabajo = await storage.getCentrosTrabajo();
      
      // Filter registros patronales by empresas in this cliente
      const clienteEmpresaIds = new Set(clienteEmpresas.map(e => e.id));
      const clienteRegistros = allRegistrosPatronales.filter((rp: any) => 
        clienteEmpresaIds.has(rp.empresaId)
      );
      
      // Filter centros de trabajo by empresas in this cliente
      const clienteCentros = allCentrosTrabajo.filter((ct: any) => 
        clienteEmpresaIds.has(ct.empresaId)
      );
      
      // Resolve references and set defaults for required fields
      let resolvedEmployees = employeeList.map((emp: any, idx: number) => {
        const resolved = { ...emp, clienteId };
        
        // Resolve empresa by nombre comercial or razón social
        if (emp.empresa && !emp.empresaId) {
          const empresa = clienteEmpresas.find(e => 
            e.nombreComercial?.toLowerCase() === emp.empresa.toLowerCase() ||
            e.razonSocial?.toLowerCase() === emp.empresa.toLowerCase()
          );
          if (empresa) {
            resolved.empresaId = empresa.id;
          }
        }
        
        // Resolve registroPatronalId by numero (filter by client's registros only)
        if (emp.registroPatronal && !emp.registroPatronalId) {
          const regPatronal = clienteRegistros.find((rp: any) => 
            rp.numeroRegistroPatronal === emp.registroPatronal
          );
          if (regPatronal) {
            resolved.registroPatronalId = regPatronal.id;
          }
        }
        // If registroPatronalId is a string, try to find it in client's registros
        if (emp.registroPatronalId && typeof emp.registroPatronalId === 'string') {
          const regPatronal = clienteRegistros.find((rp: any) => 
            rp.numeroRegistroPatronal === emp.registroPatronalId || rp.id === emp.registroPatronalId
          );
          if (regPatronal) {
            resolved.registroPatronalId = regPatronal.id;
          } else {
            delete resolved.registroPatronalId; // Remove invalid reference
          }
        }
        
        // Resolve banco by nombre
        if (emp.banco && typeof emp.banco === 'string') {
          const banco = bancos.find((b: any) => 
            b.nombre?.toLowerCase() === emp.banco.toLowerCase() ||
            b.nombreCorto?.toLowerCase() === emp.banco.toLowerCase()
          );
          if (banco) {
            resolved.banco = banco.nombre;
          }
        }
        
        // Resolve centroTrabajoId by nombre (lugarTrabajo or centroTrabajo field)
        const centroNombre = emp.centroTrabajo || emp.lugarTrabajo;
        if (centroNombre && typeof centroNombre === 'string' && !emp.centroTrabajoId) {
          // If empresaId is resolved, filter by that empresa first
          const centrosToSearch = resolved.empresaId 
            ? clienteCentros.filter((ct: any) => ct.empresaId === resolved.empresaId)
            : clienteCentros;
          
          const centro = centrosToSearch.find((ct: any) => 
            ct.nombre?.toLowerCase() === centroNombre.toLowerCase() ||
            ct.codigo?.toLowerCase() === centroNombre.toLowerCase()
          );
          if (centro) {
            resolved.centroTrabajoId = centro.id;
            resolved.lugarTrabajo = centro.nombre; // Also set lugarTrabajo for display
          }
        }
        
        // Remove helper fields not in schema
        delete resolved.empresa;
        delete resolved.registroPatronal;
        delete resolved.centroTrabajo; // Remove helper field (use centroTrabajoId)
        
        return resolved;
      });

      // Get default empresa for this cliente (first one if available)
      const defaultEmpresaId = clienteEmpresas.length > 0 ? clienteEmpresas[0].id : null;

      // Validate each employee with relaxed bulk schema, then apply defaults
      const validatedEmployees = resolvedEmployees.map((emp: any, index: number) => {
        try {
          const validated = bulkInsertEmployeeSchema.parse(emp);
          // Apply defaults for DB required fields after validation
          return {
            ...validated,
            empresaId: validated.empresaId || defaultEmpresaId,
            numeroEmpleado: validated.numeroEmpleado || `EMP-${Date.now()}-${index + 1}`,
            telefono: validated.telefono || null,
            email: validated.email || null,
            puesto: validated.puesto || null,
            departamento: validated.departamento || null,
            salarioBrutoMensual: validated.salarioBrutoMensual || "0",
          };
        } catch (error: any) {
          throw new Error(`Fila ${index + 2}: ${error.message}`);
        }
      });

      // Create all employees (database triggers auto-create kardex entries)
      const created = await storage.createBulkEmployees(validatedEmployees);
      
      // Serialize BigInt values before returning
      const serialized = created.map((emp: any) => ({
        ...emp,
        sbcBp: emp.sbcBp?.toString() ?? null,
        sdiBp: emp.sdiBp?.toString() ?? null,
        salarioMensualNetoBp: emp.salarioMensualNetoBp?.toString() ?? null,
      }));
      
      res.json({ created: created.length, employees: serialized });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Helper to serialize BigInt values to strings for JSON response
  const serializeEmployee = (emp: any) => ({
    ...emp,
    sbcBp: emp.sbcBp?.toString() ?? null,
    sdiBp: emp.sdiBp?.toString() ?? null,
    salarioMensualNetoBp: emp.salarioMensualNetoBp?.toString() ?? null,
  });
  
  const serializeEmployees = (emps: any[]) => emps.map(serializeEmployee);

  app.get("/api/employees", async (req, res) => {
    try {
      const { centroTrabajoId, grupoNominaId, empresaId, activo } = req.query;
      const effectiveClienteId = getEffectiveClienteId(req);

      // Get supervisor scope if user is authenticated
      let supervisorScope: { isFullAccess: boolean; centroIds?: string[] } | null = null;
      if (req.user?.id) {
        supervisorScope = await getSupervisorScope(req.user.id, req.user.role, req.user.tipoUsuario, req.user.isSuperAdmin);
      }

      // Helper function to filter employees by supervisor scope
      const filterBySupervisorScope = (employees: any[]) => {
        if (!supervisorScope || supervisorScope.isFullAccess) return employees;
        if (!supervisorScope.centroIds || supervisorScope.centroIds.length === 0) return [];
        return employees.filter(e => e.centroTrabajoId && supervisorScope!.centroIds!.includes(e.centroTrabajoId));
      };

      // Filtrar por empresa (returns active employees by default)
      if (empresaId) {
        // Verify access if user is a client user
        const empresa = await storage.getEmpresa(empresaId as string);
        if (empresa?.clienteId && !canAccessCliente(req, empresa.clienteId)) {
          return res.status(403).json({ message: "No tienes acceso a los empleados de esta empresa" });
        }

        // Get all centros for this empresa
        const centros = await storage.getCentrosTrabajoByEmpresa(empresaId as string);
        let centroIds = centros.map(c => c.id);

        // For supervisors, only include their assigned centros
        if (supervisorScope && !supervisorScope.isFullAccess && supervisorScope.centroIds) {
          centroIds = centroIds.filter(cid => supervisorScope!.centroIds!.includes(cid));
        }

        // Get employees from all centros
        const allEmployees = [];
        for (const centroId of centroIds) {
          const empsByCentro = await storage.getEmployeesByCentroTrabajo(centroId);
          allEmployees.push(...empsByCentro);
        }

        // Filter by active status if specified
        if (activo === "true") {
          const activeEmployees = allEmployees.filter(e => e.estatus === "activo");
          return res.json(serializeEmployees(activeEmployees));
        }

        return res.json(serializeEmployees(allEmployees));
      }

      // Filtrar por ambos: centro y grupo
      if (centroTrabajoId && grupoNominaId) {
        // Verify centro access for client users
        const centro = await storage.getCentroTrabajo(centroTrabajoId as string);
        if (centro?.empresaId) {
          const empresa = await storage.getEmpresa(centro.empresaId);
          if (empresa?.clienteId && !canAccessCliente(req, empresa.clienteId)) {
            return res.status(403).json({ message: "No tienes acceso a este centro de trabajo" });
          }
        }

        // For supervisors, verify they have access to this centro
        if (supervisorScope && !supervisorScope.isFullAccess && !supervisorScope.centroIds?.includes(centroTrabajoId as string)) {
          return res.status(403).json({ message: "No tienes acceso a este centro de trabajo" });
        }

        const employees = await storage.getEmployeesByCentroAndGrupo(
          centroTrabajoId as string,
          grupoNominaId as string
        );
        return res.json(serializeEmployees(employees));
      }

      // Filtrar solo por centro
      if (centroTrabajoId) {
        // Verify centro access for client users
        const centro = await storage.getCentroTrabajo(centroTrabajoId as string);
        if (centro?.empresaId) {
          const empresa = await storage.getEmpresa(centro.empresaId);
          if (empresa?.clienteId && !canAccessCliente(req, empresa.clienteId)) {
            return res.status(403).json({ message: "No tienes acceso a este centro de trabajo" });
          }
        }

        // For supervisors, verify they have access to this centro
        if (supervisorScope && !supervisorScope.isFullAccess && !supervisorScope.centroIds?.includes(centroTrabajoId as string)) {
          return res.status(403).json({ message: "No tienes acceso a este centro de trabajo" });
        }

        const employees = await storage.getEmployeesByCentroTrabajo(centroTrabajoId as string);
        return res.json(serializeEmployees(employees));
      }

      // Filtrar solo por grupo de nómina
      if (grupoNominaId) {
        // Verify grupo access for client users
        const grupo = await storage.getGrupoNomina(grupoNominaId as string);
        if (grupo?.clienteId && !canAccessCliente(req, grupo.clienteId)) {
          return res.status(403).json({ message: "No tienes acceso a este grupo de nómina" });
        }

        let employees = await storage.getEmployeesByGrupoNomina(grupoNominaId as string);
        // Apply supervisor scoping
        employees = filterBySupervisorScope(employees);
        return res.json(serializeEmployees(employees));
      }

      // If user has a clienteId restriction, filter employees
      if (effectiveClienteId) {
        let employees = await storage.getEmployeesByCliente(effectiveClienteId);
        // Apply supervisor scoping
        employees = filterBySupervisorScope(employees);
        return res.json(serializeEmployees(employees));
      }

      // MaxTalent users without specific client filter get all employees
      let employees = await storage.getEmployees();
      // Apply supervisor scoping (in case a supervisor somehow doesn't have clienteId set)
      employees = filterBySupervisorScope(employees);
      res.json(serializeEmployees(employees));
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/employees/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const employee = await storage.getEmployee(id);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }

      // Verify access for client users
      if (employee.clienteId && !canAccessCliente(req, employee.clienteId)) {
        return res.status(403).json({ message: "No tienes acceso a este empleado" });
      }

      // For supervisors, verify they have access to this employee's centro
      if (req.user?.id) {
        const scope = await getSupervisorScope(req.user.id, req.user.role, req.user.tipoUsuario, req.user.isSuperAdmin);
        if (!scope.isFullAccess && employee.centroTrabajoId && !scope.centroIds?.includes(employee.centroTrabajoId)) {
          return res.status(403).json({ message: "No tienes acceso a este empleado" });
        }
      }

      res.json(serializeEmployee(employee));
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/employees/:id", async (req, res) => {
    try {
      const { id } = req.params;
      // Accept any partial updates without strict validation
      // This allows flexibility for salary updates and other modifications
      // Remove fields that should not be updated directly
      const { id: _id, createdAt, updatedAt, ...validatedData } = req.body;
      const updated = await storage.updateEmployee(id, validatedData);
      res.json(serializeEmployee(updated));
    } catch (error: any) {
      console.error("PATCH /api/employees/:id error:", error);
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/employees/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteEmployee(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Fix employees without empresaId - assign them to the first empresa of their cliente
  app.post("/api/employees/fix-empresa", async (req, res) => {
    try {
      const { clienteId, clienteName } = req.body;

      let targetClienteId = clienteId;

      // If clienteName provided, find the cliente by name
      if (!targetClienteId && clienteName) {
        const allClientes = await storage.getClientes();
        const cliente = allClientes.find((c: any) =>
          c.nombreComercial?.toLowerCase().includes(clienteName.toLowerCase()) ||
          c.razonSocial?.toLowerCase().includes(clienteName.toLowerCase())
        );
        if (cliente) {
          targetClienteId = cliente.id;
        }
      }

      if (!targetClienteId) {
        return res.status(400).json({ message: "clienteId o clienteName requerido" });
      }

      // Get first empresa for this cliente
      const clienteEmpresas = await storage.getEmpresasByCliente(targetClienteId);
      if (clienteEmpresas.length === 0) {
        return res.status(400).json({ message: "El cliente no tiene empresas registradas" });
      }
      const defaultEmpresaId = clienteEmpresas[0].id;

      // Get all employees for this cliente without empresaId
      const allEmployees = await storage.getEmployees(targetClienteId);
      const employeesWithoutEmpresa = allEmployees.filter((e: any) => !e.empresaId);

      // Update each employee
      let updated = 0;
      for (const emp of employeesWithoutEmpresa) {
        await storage.updateEmployee(emp.id, { empresaId: defaultEmpresaId });
        updated++;
      }

      res.json({
        message: `Se actualizaron ${updated} empleados`,
        clienteId: targetClienteId,
        empresaAsignada: clienteEmpresas[0].razonSocial || clienteEmpresas[0].nombreComercial,
        empleadosActualizados: updated
      });
    } catch (error: any) {
      console.error("Error fixing employees empresa:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Modificaciones de Personal
  app.post("/api/modificaciones-personal", async (req, res) => {
    try {
      const { insertModificacionPersonalSchema } = await import("@shared/schema");
      // Add createdBy from session if not provided
      const dataWithCreatedBy = {
        ...req.body,
        createdBy: req.body.createdBy || req.session?.user?.id || req.session?.user?.username || "sistema",
      };
      const validatedData = insertModificacionPersonalSchema.parse(dataWithCreatedBy);
      const modificacion = await storage.createModificacionPersonal(validatedData);
      res.json(modificacion);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/modificaciones-personal", async (req, res) => {
    try {
      const { empleadoId, tipo, estatus, clienteId } = req.query;
      const effectiveClienteId = (clienteId as string) || getEffectiveClienteId(req);

      if (empleadoId) {
        const modificaciones = await storage.getModificacionesPersonalByEmpleado(empleadoId as string);
        return res.json(modificaciones);
      }

      if (tipo) {
        const modificaciones = await storage.getModificacionesPersonalByTipo(tipo as string);
        return res.json(modificaciones);
      }

      if (estatus) {
        const modificaciones = await storage.getModificacionesPersonalByEstatus(estatus as string);
        return res.json(modificaciones);
      }

      // Filter by clienteId if available, otherwise return all (for backward compatibility)
      if (effectiveClienteId) {
        const modificaciones = await storage.getModificacionesPersonalByCliente(effectiveClienteId);
        return res.json(modificaciones);
      }

      const modificaciones = await storage.getModificacionesPersonal();
      res.json(modificaciones);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/modificaciones-personal/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const modificacion = await storage.getModificacionPersonal(id);
      if (!modificacion) {
        return res.status(404).json({ message: "Modificación no encontrada" });
      }
      res.json(modificacion);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/modificaciones-personal/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { insertModificacionPersonalSchema } = await import("@shared/schema");
      const validatedData = insertModificacionPersonalSchema.partial().parse(req.body);
      const updated = await storage.updateModificacionPersonal(id, validatedData);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/modificaciones-personal/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteModificacionPersonal(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/modificaciones-personal/:id/aprobar", async (req, res) => {
    try {
      const { id } = req.params;
      const { aprobadoPor } = req.body;
      if (!aprobadoPor) {
        return res.status(400).json({ message: "aprobadoPor es requerido" });
      }
      const modificacion = await storage.aprobarModificacionPersonal(id, aprobadoPor);
      res.json(modificacion);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/modificaciones-personal/:id/rechazar", async (req, res) => {
    try {
      const { id } = req.params;
      const { notasRechazo } = req.body;
      if (!notasRechazo) {
        return res.status(400).json({ message: "notasRechazo es requerido" });
      }
      const modificacion = await storage.rechazarModificacionPersonal(id, notasRechazo);
      res.json(modificacion);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/modificaciones-personal/:id/aplicar", async (req, res) => {
    try {
      const { id } = req.params;
      const modificacion = await storage.aplicarModificacionPersonal(id);
      res.json(modificacion);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Legal Cases
  app.post("/api/legal/cases", async (req, res) => {
    try {
      const validatedData = insertLegalCaseSchema.parse(req.body);
      const legalCase = await storage.createLegalCase(validatedData);
      res.json(legalCase);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/legal/cases", async (req, res) => {
    try {
      const mode = req.query.mode as string | undefined;
      const cases = await storage.getLegalCases(mode);
      res.json(cases);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/legal/cases/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const legalCase = await storage.getLegalCase(id);
      if (!legalCase) {
        return res.status(404).json({ message: "Case not found" });
      }
      res.json(legalCase);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/legal/cases/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { updateLegalCaseSchema } = await import("@shared/schema");
      const validatedData = updateLegalCaseSchema.parse(req.body);
      const updated = await storage.updateLegalCase(id, validatedData);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/legal/cases/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteLegalCase(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Baja Special Concepts
  app.post("/api/legal/cases/:legalCaseId/special-concepts", async (req, res) => {
    try {
      const { legalCaseId } = req.params;
      const validatedData = insertBajaSpecialConceptSchema.parse({
        ...req.body,
        legalCaseId
      });
      const concept = await storage.createBajaSpecialConcept(validatedData);
      res.json(concept);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/legal/cases/:legalCaseId/special-concepts", async (req, res) => {
    try {
      const { legalCaseId } = req.params;
      const concepts = await storage.getBajaSpecialConcepts(legalCaseId);
      res.json(concepts);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/legal/special-concepts/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteBajaSpecialConcept(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Settlements
  app.post("/api/legal/settlements", async (req, res) => {
    try {
      const validatedData = insertSettlementSchema.parse(req.body);
      const settlement = await storage.createSettlement(validatedData);
      res.json(settlement);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/legal/settlements", async (req, res) => {
    try {
      const mode = req.query.mode as string | undefined;
      const legalCaseId = req.query.legalCaseId as string | undefined;
      
      if (legalCaseId) {
        const settlements = await storage.getSettlementsByLegalCase(legalCaseId);
        return res.json(settlements);
      }
      
      const settlements = await storage.getSettlements(mode);
      res.json(settlements);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/legal/settlements/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const settlement = await storage.getSettlement(id);
      if (!settlement) {
        return res.status(404).json({ message: "Settlement not found" });
      }
      res.json(settlement);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/legal/settlements/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteSettlement(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Lawsuits (Demandas)
  app.post("/api/legal/lawsuits", async (req, res) => {
    try {
      // Convert 'none' to undefined for legalCaseId (frontend uses 'none' for "no case")
      const body = {
        ...req.body,
        legalCaseId: req.body.legalCaseId === 'none' ? undefined : req.body.legalCaseId
      };
      
      const validatedData = insertLawsuitSchema.parse(body);
      
      // Si se está vinculando a un caso legal, verificar que no exista ya una demanda para ese caso
      if (validatedData.legalCaseId) {
        const duplicate = await storage.getLawsuitByLegalCaseId(validatedData.legalCaseId);
        
        if (duplicate) {
          return res.status(409).json({ 
            message: "Ya existe una demanda vinculada a este caso legal",
            existingLawsuitId: duplicate.id 
          });
        }
      }
      
      const lawsuit = await storage.createLawsuit(validatedData);
      res.json(lawsuit);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/legal/lawsuits", async (req, res) => {
    try {
      const lawsuits = await storage.getLawsuits();
      res.json(lawsuits);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/legal/lawsuits/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const lawsuit = await storage.getLawsuit(id);
      if (!lawsuit) {
        return res.status(404).json({ message: "Lawsuit not found" });
      }
      res.json(lawsuit);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/legal/lawsuits/:id", async (req, res) => {
    try {
      const { id } = req.params;
      // Convert 'none' to undefined for legalCaseId (frontend uses 'none' for "no case")
      const body = {
        ...req.body,
        legalCaseId: req.body.legalCaseId === 'none' ? undefined : req.body.legalCaseId
      };
      // Validate partial update with updateLawsuitSchema (no defaults, validates stage enum if provided)
      const validatedData = updateLawsuitSchema.parse(body);
      const updated = await storage.updateLawsuit(id, validatedData);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/legal/lawsuits/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteLawsuit(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Hiring Process (Altas)
  app.post("/api/hiring/processes", async (req, res) => {
    try {
      const validatedData = insertHiringProcessSchema.parse(req.body);
      const process = await storage.createHiringProcess(validatedData);
      res.json(process);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/hiring/processes", async (req, res) => {
    try {
      const processes = await storage.getHiringProcesses();
      res.json(processes);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/hiring/processes/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const process = await storage.getHiringProcess(id);
      if (!process) {
        return res.status(404).json({ message: "Hiring process not found" });
      }
      res.json(process);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/hiring/processes/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = updateHiringProcessSchema.parse(req.body);
      const updated = await storage.updateHiringProcess(id, validatedData);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/hiring/processes/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteHiringProcess(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Completar Alta - Materializar empleado desde proceso de contratación
  app.post("/api/hiring/processes/:id/completar-alta", async (req, res) => {
    try {
      const { id } = req.params;
      const process = await storage.getHiringProcess(id);
      
      if (!process) {
        return res.status(404).json({ message: "Proceso de contratación no encontrado" });
      }
      
      if (process.empleadoId) {
        return res.status(400).json({ message: "Este proceso ya tiene un empleado asociado" });
      }
      
      if (process.status !== "activo") {
        return res.status(400).json({ message: "El proceso debe estar activo para completar el alta" });
      }
      
      const employeeData = {
        clienteId: process.clienteId,
        empresaId: process.empresaId,
        nombre: process.nombre,
        apellidoPaterno: process.apellidoPaterno,
        apellidoMaterno: process.apellidoMaterno || undefined,
        email: process.email || undefined,
        telefono: process.phone || undefined,
        rfc: process.rfc || undefined,
        curp: process.curp || undefined,
        nss: process.nss || undefined,
        genero: process.genero || undefined,
        fechaNacimiento: process.fechaNacimiento || undefined,
        calle: process.calle || undefined,
        numeroExterior: process.numeroExterior || undefined,
        numeroInterior: process.numeroInterior || undefined,
        colonia: process.colonia || undefined,
        municipio: process.municipio || undefined,
        estado: process.estado || undefined,
        codigoPostal: process.codigoPostal || undefined,
        contactoEmergenciaNombre: process.contactoEmergencia || undefined,
        contactoEmergenciaParentesco: process.parentescoEmergencia || undefined,
        contactoEmergenciaTelefono: process.telefonoEmergencia || undefined,
        bancoId: undefined as string | undefined,
        numeroCuenta: process.cuenta || undefined,
        clabe: process.clabe || undefined,
        puestoId: process.puestoId || undefined,
        departamentoId: process.departamentoId || undefined,
        centroTrabajoId: process.centroTrabajoId || undefined,
        registroPatronalId: process.registroPatronalId || undefined,
        fechaIngreso: process.startDate,
        tipoContrato: process.contractType || "indeterminado",
        salarioDiario: process.proposedSalary ? String(parseFloat(process.proposedSalary) / 30) : "0",
        estatus: "activo",
        jornadaLaboral: "completa",
      };
      
      const employee = await storage.createEmployee(employeeData);
      
      await storage.updateHiringProcess(id, {
        empleadoId: employee.id,
        status: "completado",
        stage: "completado",
      });
      
      res.status(201).json({
        message: "Alta completada exitosamente",
        employee,
        hiringProcessId: id,
      });
    } catch (error: any) {
      console.error("Error completing alta:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Object Storage endpoints for document upload
  app.post("/api/objects/upload", async (req, res) => {
    try {
      const { signedUrl, path } = await supabaseStorage.getSignedUploadUrl("documentos-empleados");
      res.json({ uploadURL: signedUrl, path });
    } catch (error: any) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ message: "Failed to get upload URL" });
    }
  });

  // Analyze lawsuit document using OpenAI
  app.post("/api/legal/lawsuits/analyze-document", async (req, res) => {
    try {
      const { documentUrl } = req.body;

      if (!documentUrl) {
        return res.status(400).json({ message: "documentUrl is required" });
      }

      const normalizedPath = supabaseStorage.normalizeStoragePath(documentUrl);

      const extractedData = await analyzeLawsuitDocument(documentUrl);

      res.json({
        ...extractedData,
        documentUrl: normalizedPath
      });
    } catch (error: any) {
      console.error("Error analyzing document:", error);
      res.status(500).json({ message: "Failed to analyze document" });
    }
  });

  // Cálculo de liquidaciones/finiquitos
  app.post("/api/legal/calculate-settlement", async (req, res) => {
    try {
      const { salarioDiario, salarioMensual, fechaIngreso, fechaSalida, tipo } = req.body;
      
      const datos = {
        salarioDiario: parseFloat(salarioDiario),
        salarioMensual: parseFloat(salarioMensual),
        fechaIngreso: new Date(fechaIngreso),
        fechaSalida: new Date(fechaSalida),
      };
      
      let resultado;
      switch (tipo) {
        case 'liquidacion_injustificada':
          resultado = calcularLiquidacionInjustificada(datos);
          break;
        case 'liquidacion_justificada':
          resultado = calcularLiquidacionJustificada(datos);
          break;
        case 'finiquito':
          resultado = calcularFiniquito(datos);
          break;
        // Mantener compatibilidad con llamadas antiguas
        case 'liquidacion':
          resultado = calcularLiquidacionInjustificada(datos);
          break;
        default:
          return res.status(400).json({ message: "Tipo de cálculo inválido" });
      }
      
      res.json(resultado);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Empresas
  app.post("/api/empresas", async (req, res) => {
    try {
      const validatedData = insertEmpresaSchema.parse(req.body);
      const empresa = await storage.createEmpresa(validatedData);
      res.json(empresa);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/empresas", async (req, res) => {
    try {
      const effectiveClienteId = getEffectiveClienteId(req);
      
      // If user has a clienteId restriction, filter empresas
      if (effectiveClienteId) {
        const empresas = await storage.getEmpresasByCliente(effectiveClienteId);
        return res.json(empresas);
      }
      
      // MaxTalent users without specific client filter get all empresas
      const empresas = await storage.getEmpresas();
      res.json(empresas);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/empresas/:id", async (req, res) => {
    try {
      const empresa = await storage.getEmpresa(req.params.id);
      if (!empresa) {
        return res.status(404).json({ message: "Empresa no encontrada" });
      }
      
      // Verify access for client users
      if (empresa.clienteId && !canAccessCliente(req, empresa.clienteId)) {
        return res.status(403).json({ message: "No tienes acceso a esta empresa" });
      }
      
      res.json(empresa);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/empresas/:id", async (req, res) => {
    try {
      const validatedData = updateEmpresaSchema.parse(req.body);
      const empresa = await storage.updateEmpresa(req.params.id, validatedData);
      res.json(empresa);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/empresas/:id", async (req, res) => {
    try {
      await storage.deleteEmpresa(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Obtener plantilla default de una empresa con detalles
  app.get("/api/empresas/:id/plantilla-default", async (req, res) => {
    try {
      const empresa = await storage.getEmpresa(req.params.id);
      if (!empresa) {
        return res.status(404).json({ message: "Empresa no encontrada" });
      }
      
      if (!empresa.defaultPlantillaNominaId) {
        return res.json({ plantilla: null, message: "No hay plantilla default configurada" });
      }
      
      const plantilla = await storage.getPlantillaNomina(empresa.defaultPlantillaNominaId);
      if (!plantilla) {
        return res.json({ plantilla: null, message: "Plantilla default no encontrada" });
      }
      
      res.json({ plantilla });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Establecer plantilla default de una empresa
  app.put("/api/empresas/:id/plantilla-default", async (req, res) => {
    try {
      const { plantillaId } = req.body;
      
      const empresa = await storage.getEmpresa(req.params.id);
      if (!empresa) {
        return res.status(404).json({ message: "Empresa no encontrada" });
      }
      
      // Validar que la plantilla existe y pertenece a la empresa
      if (plantillaId) {
        const plantilla = await storage.getPlantillaNomina(plantillaId);
        if (!plantilla) {
          return res.status(400).json({ message: "Plantilla no encontrada" });
        }
        if (plantilla.empresaId !== empresa.id) {
          return res.status(400).json({ message: "La plantilla no pertenece a esta empresa" });
        }
      }
      
      const updated = await storage.updateEmpresa(req.params.id, {
        defaultPlantillaNominaId: plantillaId || null
      });
      
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Registros Patronales
  app.post("/api/registros-patronales", async (req, res) => {
    try {
      const validatedData = insertRegistroPatronalSchema.parse(req.body);
      const registro = await storage.createRegistroPatronal(validatedData);
      res.json(registro);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/registros-patronales", async (req, res) => {
    try {
      const { empresaId } = req.query;
      if (empresaId) {
        const registros = await storage.getRegistrosPatronalesByEmpresa(empresaId as string);
        return res.json(registros);
      }
      const registros = await storage.getRegistrosPatronales();
      res.json(registros);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/registros-patronales/:id", async (req, res) => {
    try {
      const registro = await storage.getRegistroPatronal(req.params.id);
      if (!registro) {
        return res.status(404).json({ message: "Registro patronal no encontrado" });
      }
      res.json(registro);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/registros-patronales/:id", async (req, res) => {
    try {
      const validatedData = updateRegistroPatronalSchema.parse(req.body);
      const registro = await storage.updateRegistroPatronal(req.params.id, validatedData);
      res.json(registro);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/registros-patronales/:id", async (req, res) => {
    try {
      await storage.deleteRegistroPatronal(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Credenciales de Sistemas
  app.post("/api/credenciales", async (req, res) => {
    try {
      const validatedData = insertCredencialSistemaSchema.parse(req.body);
      const credencial = await storage.createCredencialSistema(validatedData);
      res.json(credencial);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/credenciales", async (req, res) => {
    try {
      const { empresaId, registroPatronalId } = req.query;
      if (empresaId) {
        const credenciales = await storage.getCredencialesByEmpresa(empresaId as string);
        return res.json(credenciales);
      }
      if (registroPatronalId) {
        const credenciales = await storage.getCredencialesByRegistroPatronal(registroPatronalId as string);
        return res.json(credenciales);
      }
      const credenciales = await storage.getCredencialesSistemas();
      res.json(credenciales);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/credenciales/:id", async (req, res) => {
    try {
      const credencial = await storage.getCredencialSistema(req.params.id);
      if (!credencial) {
        return res.status(404).json({ message: "Credencial no encontrada" });
      }
      res.json(credencial);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/credenciales/:id", async (req, res) => {
    try {
      const validatedData = updateCredencialSistemaSchema.parse(req.body);
      const credencial = await storage.updateCredencialSistema(req.params.id, validatedData);
      res.json(credencial);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/credenciales/:id", async (req, res) => {
    try {
      await storage.deleteCredencialSistema(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Centros de Trabajo
  app.post("/api/centros-trabajo", async (req, res) => {
    try {
      let dataWithClienteId = { ...req.body };
      
      // Auto-derive clienteId from empresa if not provided
      if (!dataWithClienteId.clienteId && dataWithClienteId.empresaId) {
        const empresa = await storage.getEmpresa(dataWithClienteId.empresaId);
        if (empresa) {
          dataWithClienteId.clienteId = empresa.clienteId;
        }
      }
      
      const validatedData = insertCentroTrabajoSchema.parse(dataWithClienteId);
      const centro = await storage.createCentroTrabajo(validatedData);
      res.json(centro);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/centros-trabajo", requireAuth, async (req, res) => {
    try {
      const { empresaId } = req.query;
      if (empresaId) {
        const centros = await storage.getCentrosTrabajoByEmpresa(empresaId as string);
        return res.json(centros);
      }
      // If user has clienteId, filter centros to only show their client's
      if (req.user?.clienteId) {
        const centros = await storage.getCentrosTrabajoByCliente(req.user.clienteId);
        return res.json(centros);
      }
      // Fallback for super admins or users without clienteId
      const centros = await storage.getCentrosTrabajo();
      res.json(centros);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/centros-trabajo/:id", async (req, res) => {
    try {
      const centro = await storage.getCentroTrabajo(req.params.id);
      if (!centro) {
        return res.status(404).json({ message: "Centro de trabajo no encontrado" });
      }
      res.json(centro);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/centros-trabajo/:id", async (req, res) => {
    try {
      const validatedData = updateCentroTrabajoSchema.parse(req.body);
      const centro = await storage.updateCentroTrabajo(req.params.id, validatedData);
      res.json(centro);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/centros-trabajo/:id", async (req, res) => {
    try {
      await storage.deleteCentroTrabajo(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Departamentos
  app.post("/api/departamentos", async (req, res) => {
    try {
      const { insertDepartamentoSchema } = await import("@shared/schema");
      const validatedData = insertDepartamentoSchema.parse(req.body);
      const departamento = await storage.createDepartamento(validatedData);
      res.json(departamento);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/departamentos", async (req, res) => {
    try {
      const { empresaId } = req.query;
      if (empresaId) {
        const departamentos = await storage.getDepartamentosByEmpresa(empresaId as string);
        return res.json(departamentos);
      }
      const departamentos = await storage.getDepartamentos();
      res.json(departamentos);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/departamentos/:id", async (req, res) => {
    try {
      const departamento = await storage.getDepartamento(req.params.id);
      if (!departamento) {
        return res.status(404).json({ message: "Departamento no encontrado" });
      }
      res.json(departamento);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/departamentos/:id", async (req, res) => {
    try {
      const { updateDepartamentoSchema } = await import("@shared/schema");
      const validatedData = updateDepartamentoSchema.parse(req.body);
      const departamento = await storage.updateDepartamento(req.params.id, validatedData);
      res.json(departamento);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/departamentos/:id", async (req, res) => {
    try {
      await storage.deleteDepartamento(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Turnos de Centro de Trabajo
  app.post("/api/turnos-centro-trabajo", async (req, res) => {
    try {
      const validatedData = insertTurnoCentroTrabajoSchema.parse(req.body);
      const turno = await storage.createTurnoCentroTrabajo(validatedData);
      res.json(turno);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/turnos-centro-trabajo", async (req, res) => {
    try {
      const { centroTrabajoId } = req.query;
      if (centroTrabajoId) {
        const turnos = await storage.getTurnosCentroTrabajoByCentro(centroTrabajoId as string);
        return res.json(turnos);
      }
      const turnos = await storage.getTurnosCentroTrabajo();
      res.json(turnos);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/turnos-centro-trabajo/:id", async (req, res) => {
    try {
      const turno = await storage.getTurnoCentroTrabajo(req.params.id);
      if (!turno) {
        return res.status(404).json({ message: "Turno no encontrado" });
      }
      res.json(turno);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/turnos-centro-trabajo/:id", async (req, res) => {
    try {
      const validatedData = updateTurnoCentroTrabajoSchema.parse(req.body);
      const turno = await storage.updateTurnoCentroTrabajo(req.params.id, validatedData);
      res.json(turno);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/turnos-centro-trabajo/:id", async (req, res) => {
    try {
      await storage.deleteTurnoCentroTrabajo(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Empleados Centros de Trabajo (Asignaciones)
  app.post("/api/empleados-centros-trabajo", async (req, res) => {
    try {
      const validatedData = insertEmpleadoCentroTrabajoSchema.parse(req.body);
      const asignacion = await storage.createEmpleadoCentroTrabajo(validatedData);
      res.json(asignacion);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/empleados-centros-trabajo", async (req, res) => {
    try {
      const { empleadoId, centroTrabajoId } = req.query;
      if (empleadoId) {
        const asignaciones = await storage.getEmpleadosCentrosTrabajoByEmpleado(empleadoId as string);
        return res.json(asignaciones);
      }
      if (centroTrabajoId) {
        const asignaciones = await storage.getEmpleadosCentrosTabajoByCentro(centroTrabajoId as string);
        return res.json(asignaciones);
      }
      const asignaciones = await storage.getEmpleadosCentrosTrabajo();
      res.json(asignaciones);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/empleados-centros-trabajo/:id", async (req, res) => {
    try {
      const asignacion = await storage.getEmpleadoCentroTrabajo(req.params.id);
      if (!asignacion) {
        return res.status(404).json({ message: "Asignación no encontrada" });
      }
      res.json(asignacion);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/empleados-centros-trabajo/:id", async (req, res) => {
    try {
      const validatedData = updateEmpleadoCentroTrabajoSchema.parse(req.body);
      const asignacion = await storage.updateEmpleadoCentroTrabajo(req.params.id, validatedData);
      res.json(asignacion);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/empleados-centros-trabajo/:id", async (req, res) => {
    try {
      await storage.deleteEmpleadoCentroTrabajo(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Attendance (Asistencias)
  app.post("/api/attendance", async (req, res) => {
    try {
      const validatedData = insertAttendanceSchema.parse(req.body);
      const attendance = await storage.createAttendance(validatedData);
      res.json(attendance);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/attendance", async (req, res) => {
    try {
      const { empleadoId, centroTrabajoId, date } = req.query;
      if (empleadoId) {
        const attendances = await storage.getAttendancesByEmpleado(empleadoId as string);
        return res.json(attendances);
      }
      if (centroTrabajoId) {
        const attendances = await storage.getAttendancesByCentro(centroTrabajoId as string);
        return res.json(attendances);
      }
      if (date) {
        const attendances = await storage.getAttendancesByDate(date as string);
        return res.json(attendances);
      }
      const attendances = await storage.getAttendances();
      res.json(attendances);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/attendance/:id", async (req, res) => {
    try {
      const attendance = await storage.getAttendance(req.params.id);
      if (!attendance) {
        return res.status(404).json({ message: "Registro de asistencia no encontrado" });
      }
      res.json(attendance);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/attendance/:id", async (req, res) => {
    try {
      const validatedData = insertAttendanceSchema.partial().parse(req.body);
      const attendance = await storage.updateAttendance(req.params.id, validatedData);
      res.json(attendance);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/attendance/:id", async (req, res) => {
    try {
      await storage.deleteAttendance(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Incidencias de Asistencia
  app.post("/api/incidencias-asistencia", requireSupervisorOrAdmin, async (req, res) => {
    try {
      const validatedData = insertIncidenciaAsistenciaSchema.parse(req.body);

      // For supervisors, validate they can access this employee's centro
      if (req.user!.role === 'supervisor') {
        const scope = await getSupervisorScope(req.user!.id, req.user!.role, req.user!.tipoUsuario, req.user!.isSuperAdmin);
        if (!scope.isFullAccess && validatedData.centroTrabajoId) {
          if (!scope.centroIds?.includes(validatedData.centroTrabajoId)) {
            return res.status(403).json({ message: "No tiene acceso a este centro de trabajo" });
          }
        }
      }

      const incidencia = await storage.createIncidenciaAsistencia(validatedData);
      res.json(incidencia);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/incidencias-asistencia", requireSupervisorOrAdmin, async (req, res) => {
    try {
      const effectiveClienteId = getEffectiveClienteId(req);
      const { fechaInicio, fechaFin, centroTrabajoId, empleadoId } = req.query;

      // Get supervisor scope to filter results
      const scope = await getSupervisorScope(req.user!.id, req.user!.role, req.user!.tipoUsuario, req.user!.isSuperAdmin);

      if (fechaInicio && fechaFin) {
        let incidencias = await storage.getIncidenciasAsistenciaByPeriodo(
          fechaInicio as string,
          fechaFin as string,
          centroTrabajoId as string | undefined,
          effectiveClienteId || undefined
        );

        // Filter by supervisor's centros if not full access
        if (!scope.isFullAccess && scope.centroIds) {
          incidencias = incidencias.filter(i => i.centroTrabajoId && scope.centroIds!.includes(i.centroTrabajoId));
        }

        return res.json(incidencias);
      }

      if (empleadoId) {
        // For supervisors, verify employee belongs to their centros
        if (!scope.isFullAccess) {
          const employee = await storage.getEmployee(empleadoId as string);
          if (employee && employee.centroTrabajoId && !scope.centroIds?.includes(employee.centroTrabajoId)) {
            return res.status(403).json({ message: "No tiene acceso a este empleado" });
          }
        }
        const incidencias = await storage.getIncidenciasAsistenciaByEmpleado(empleadoId as string);
        return res.json(incidencias);
      }

      let incidencias = await storage.getIncidenciasAsistencia();

      // Filter by supervisor's centros if not full access
      if (!scope.isFullAccess && scope.centroIds) {
        incidencias = incidencias.filter(i => i.centroTrabajoId && scope.centroIds!.includes(i.centroTrabajoId));
      }

      res.json(incidencias);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/incidencias-asistencia/:id", requireSupervisorOrAdmin, async (req, res) => {
    try {
      const incidencia = await storage.getIncidenciaAsistencia(req.params.id);
      if (!incidencia) {
        return res.status(404).json({ message: "Incidencia de asistencia no encontrada" });
      }

      // For supervisors, verify incidencia belongs to their centros
      const scope = await getSupervisorScope(req.user!.id, req.user!.role, req.user!.tipoUsuario, req.user!.isSuperAdmin);
      if (!scope.isFullAccess && incidencia.centroTrabajoId && !scope.centroIds?.includes(incidencia.centroTrabajoId)) {
        return res.status(403).json({ message: "No tiene acceso a esta incidencia" });
      }

      res.json(incidencia);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/incidencias-asistencia/:id", requireSupervisorOrAdmin, async (req, res) => {
    try {
      // Verify supervisor access before updating
      const existingIncidencia = await storage.getIncidenciaAsistencia(req.params.id);
      if (!existingIncidencia) {
        return res.status(404).json({ message: "Incidencia no encontrada" });
      }

      const scope = await getSupervisorScope(req.user!.id, req.user!.role, req.user!.tipoUsuario, req.user!.isSuperAdmin);
      if (!scope.isFullAccess && existingIncidencia.centroTrabajoId && !scope.centroIds?.includes(existingIncidencia.centroTrabajoId)) {
        return res.status(403).json({ message: "No tiene acceso a esta incidencia" });
      }

      const validatedData = updateIncidenciaAsistenciaSchema.parse(req.body);
      const incidencia = await storage.updateIncidenciaAsistencia(req.params.id, validatedData);
      res.json(incidencia);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/incidencias-asistencia/:id", requireSupervisorOrAdmin, async (req, res) => {
    try {
      // Verify supervisor access before deleting
      const existingIncidencia = await storage.getIncidenciaAsistencia(req.params.id);
      if (!existingIncidencia) {
        return res.status(404).json({ message: "Incidencia no encontrada" });
      }

      const scope = await getSupervisorScope(req.user!.id, req.user!.role, req.user!.tipoUsuario, req.user!.isSuperAdmin);
      if (!scope.isFullAccess && existingIncidencia.centroTrabajoId && !scope.centroIds?.includes(existingIncidencia.centroTrabajoId)) {
        return res.status(403).json({ message: "No tiene acceso a esta incidencia" });
      }

      await storage.deleteIncidenciaAsistencia(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Grupos de Nómina
  app.post("/api/grupos-nomina", async (req, res) => {
    try {
      const user = req.user as any;
      if (!user) {
        return res.status(401).json({ message: "No autenticado" });
      }
      
      const validatedData = insertGrupoNominaSchema.parse(req.body);
      const { employeeIds, ...grupoData } = validatedData;
      
      // Get clienteId from user session
      const clienteId = user.clienteId;
      if (!clienteId) {
        return res.status(400).json({ message: "Usuario no tiene cliente asignado" });
      }
      
      // Get first empresa for this cliente if not provided
      let empresaId = grupoData.empresaId;
      if (!empresaId) {
        const empresas = await storage.getEmpresasByCliente(clienteId);
        if (empresas.length === 0) {
          return res.status(400).json({ message: "No hay empresas configuradas para este cliente" });
        }
        empresaId = empresas[0].id;
      }
      
      const grupo = await storage.createGrupoNomina({
        ...grupoData,
        clienteId,
        empresaId,
      });
      
      // Generar automáticamente periodos de pago para año actual y próximo
      const currentYear = new Date().getFullYear();
      await storage.generatePayrollPeriodsForYear(grupo.id!, currentYear);
      await storage.generatePayrollPeriodsForYear(grupo.id!, currentYear + 1);
      
      // Asignar empleados al grupo si se proporcionaron
      if (employeeIds && employeeIds.length > 0) {
        await storage.assignEmployeesToGrupoNomina(grupo.id!, employeeIds);
      }
      
      res.json(grupo);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/grupos-nomina", async (req, res) => {
    try {
      // For client users, filter by their clienteId
      const clienteId = getClienteIdFromRequest(req);
      if (clienteId) {
        const grupos = await storage.getGruposNominaByCliente(clienteId);
        return res.json(grupos);
      }
      // MaxTalent users can see all
      const grupos = await storage.getGruposNomina();
      res.json(grupos);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/grupos-nomina/:id", async (req, res) => {
    try {
      const grupo = await storage.getGrupoNomina(req.params.id);
      if (!grupo) {
        return res.status(404).json({ message: "Grupo de nómina no encontrado" });
      }
      // Verify client access
      if (grupo.clienteId && !canAccessCliente(req, grupo.clienteId)) {
        return res.status(403).json({ message: "No tienes acceso a este grupo de nómina" });
      }
      res.json(grupo);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/grupos-nomina/:id", async (req, res) => {
    try {
      // Verify access before updating
      const existingGrupo = await storage.getGrupoNomina(req.params.id);
      if (existingGrupo?.clienteId && !canAccessCliente(req, existingGrupo.clienteId)) {
        return res.status(403).json({ message: "No tienes acceso a este grupo de nómina" });
      }

      const validatedData = updateGrupoNominaSchema.parse(req.body);
      const { employeeIds, ...grupoData } = validatedData;

      const grupo = await storage.updateGrupoNomina(req.params.id, grupoData);

      // Reasignar empleados al grupo si se proporcionaron
      if (employeeIds !== undefined) {
        await storage.assignEmployeesToGrupoNomina(req.params.id, employeeIds);
      }

      res.json(grupo);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/grupos-nomina/:id", async (req, res) => {
    try {
      // Verify access before deleting
      const existingGrupo = await storage.getGrupoNomina(req.params.id);
      if (existingGrupo?.clienteId && !canAccessCliente(req, existingGrupo.clienteId)) {
        return res.status(403).json({ message: "No tienes acceso a este grupo de nómina" });
      }
      await storage.deleteGrupoNomina(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Medios de Pago
  app.post("/api/medios-pago", async (req, res) => {
    try {
      const validatedData = insertMedioPagoSchema.parse(req.body);
      const medioPago = await storage.createMedioPago(validatedData);
      res.json(medioPago);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/medios-pago", async (req, res) => {
    try {
      const mediosPago = await storage.getMediosPago();
      res.json(mediosPago);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/medios-pago/:id", async (req, res) => {
    try {
      const medioPago = await storage.getMedioPago(req.params.id);
      if (!medioPago) {
        return res.status(404).json({ message: "Medio de pago no encontrado" });
      }
      res.json(medioPago);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/medios-pago/:id", async (req, res) => {
    try {
      const partialData = updateMedioPagoSchema.parse(req.body);
      const existing = await storage.getMedioPago(req.params.id);
      if (!existing) {
        return res.status(404).json({ message: "Medio de pago no encontrado" });
      }
      const merged = { ...existing, ...partialData };
      const validatedData = insertMedioPagoSchema.parse(merged);
      const medioPago = await storage.updateMedioPago(req.params.id, validatedData);
      res.json(medioPago);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/medios-pago/:id", async (req, res) => {
    try {
      await storage.deleteMedioPago(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ============================================================================
  // CATÁLOGO DE CONCEPTOS UNIFICADO (Single Source of Truth)
  // ============================================================================
  
  // Obtener catálogo agrupado por nivel (SAT, Previsión Social, Adicionales)
  app.get("/api/catalogo-conceptos", async (req, res) => {
    try {
      const catalogo = await storage.getCatalogoConceptosAgrupado();
      res.json(catalogo);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Obtener catálogos SAT oficiales (para selectores)
  app.get("/api/sat-catalogos", async (req, res) => {
    try {
      const catalogos = await storage.getSatCatalogos();
      res.json(catalogos);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Conceptos de Medios de Pago (legacy endpoint, ahora con filtro por nivel)
  app.post("/api/conceptos-medio-pago", async (req, res) => {
    try {
      const validatedData = insertConceptoMedioPagoSchema.parse(req.body);
      const concepto = await storage.createConceptoMedioPago(validatedData);
      res.json(concepto);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/conceptos-medio-pago", async (req, res) => {
    try {
      const { nivel } = req.query;
      const conceptos = await storage.getConceptosMedioPago(nivel as string | undefined);
      res.json(conceptos);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/conceptos-medio-pago/:id", async (req, res) => {
    try {
      const concepto = await storage.getConceptoMedioPago(req.params.id);
      if (!concepto) {
        return res.status(404).json({ message: "Concepto no encontrado" });
      }
      res.json(concepto);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/conceptos-medio-pago/:id", async (req, res) => {
    try {
      // Step 1: Validate partial data
      const partialData = updateConceptoMedioPagoSchema.parse(req.body);
      
      // Step 2: Load existing concepto
      const existing = await storage.getConceptoMedioPago(req.params.id);
      
      // Step 3: Return 404 if missing
      if (!existing) {
        return res.status(404).json({ message: "Concepto no encontrado" });
      }
      
      // Step 4: Merge existing with partial (strip metadata first)
      const { id, createdAt, updatedAt, mediosPagoIds: existingMedios, ...existingClean } = existing;
      const merged = { ...existingClean, ...partialData };
      
      // Step 5: Re-validate with full schema
      const validatedData = insertConceptoMedioPagoSchema.parse(merged);
      
      // Step 6: Persist
      const concepto = await storage.updateConceptoMedioPago(req.params.id, validatedData);
      res.json(concepto);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/conceptos-medio-pago/:id", async (req, res) => {
    try {
      await storage.deleteConceptoMedioPago(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Variables disponibles para fórmulas
  app.get("/api/formula-variables", (_req, res) => {
    res.json(VARIABLES_FORMULA);
  });

  // Plantillas de Nómina (Protected with auth and client filtering)
  app.post("/api/plantillas-nomina", requireAuth, async (req, res) => {
    try {
      const validatedData = insertPlantillaNominaSchema.parse(req.body);
      // Verify client access for the plantilla being created
      if (validatedData.clienteId && !canAccessCliente(req, validatedData.clienteId)) {
        return res.status(403).json({ message: "No tiene acceso a crear plantillas para este cliente" });
      }
      const plantilla = await storage.createPlantillaNomina(validatedData);
      res.json(plantilla);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/plantillas-nomina", requireAuth, async (req, res) => {
    try {
      const { empresaId } = req.query;
      const effectiveClienteId = getEffectiveClienteId(req);

      // Client users MUST have a clienteId
      if (req.user?.tipoUsuario === "cliente" && !effectiveClienteId) {
        return res.status(403).json({ message: "No tiene cliente asignado" });
      }

      if (effectiveClienteId && empresaId) {
        const plantillas = await storage.getPlantillasNominaByEmpresa(
          effectiveClienteId,
          empresaId as string
        );
        return res.json(plantillas);
      }

      if (effectiveClienteId) {
        const plantillas = await storage.getPlantillasNominaByCliente(effectiveClienteId);
        return res.json(plantillas);
      }

      // Only MaxTalent users can see all
      if (req.user?.tipoUsuario !== "maxtalent") {
        return res.status(403).json({ message: "Acceso denegado" });
      }

      const plantillas = await storage.getPlantillasNomina();
      res.json(plantillas);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/plantillas-nomina/:id", requireAuth, async (req, res) => {
    try {
      const plantilla = await storage.getPlantillaNomina(req.params.id);
      if (!plantilla) {
        return res.status(404).json({ message: "Plantilla no encontrada" });
      }
      // Verify client access
      if (!canAccessCliente(req, plantilla.clienteId)) {
        return res.status(403).json({ message: "No tiene acceso a esta plantilla" });
      }
      res.json(plantilla);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/plantillas-nomina/:id", requireAuth, async (req, res) => {
    try {
      // Verify access to existing plantilla
      const existing = await storage.getPlantillaNomina(req.params.id);
      if (!existing) {
        return res.status(404).json({ message: "Plantilla no encontrada" });
      }
      if (!canAccessCliente(req, existing.clienteId)) {
        return res.status(403).json({ message: "No tiene acceso a esta plantilla" });
      }
      const partialData = updatePlantillaNominaSchema.parse(req.body);
      const plantilla = await storage.updatePlantillaNomina(req.params.id, partialData);
      res.json(plantilla);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/plantillas-nomina/:id", requireAuth, async (req, res) => {
    try {
      // Verify access to existing plantilla
      const existing = await storage.getPlantillaNomina(req.params.id);
      if (!existing) {
        return res.status(404).json({ message: "Plantilla no encontrada" });
      }
      if (!canAccessCliente(req, existing.clienteId)) {
        return res.status(403).json({ message: "No tiene acceso a esta plantilla" });
      }
      await storage.deletePlantillaNomina(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Plantilla Conceptos
  app.post("/api/plantilla-conceptos", async (req, res) => {
    try {
      const validatedData = insertPlantillaConceptoSchema.parse(req.body);
      const concepto = await storage.addConceptoToPlantilla(validatedData);
      res.json(concepto);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/plantilla-conceptos/:plantillaId", async (req, res) => {
    try {
      const conceptos = await storage.getConceptosByPlantilla(req.params.plantillaId);
      res.json(conceptos);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/plantilla-conceptos/:id", async (req, res) => {
    try {
      const partialData = updatePlantillaConceptoSchema.parse(req.body);
      const concepto = await storage.updatePlantillaConcepto(req.params.id, partialData);
      res.json(concepto);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/plantilla-conceptos/:id", async (req, res) => {
    try {
      await storage.removeConceptoFromPlantilla(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Payroll Periods
  app.get("/api/payroll-periods/:grupoNominaId", async (req, res) => {
    try {
      const { grupoNominaId } = req.params;
      const { year } = req.query;
      
      const periods = await storage.getPayrollPeriodsByGrupo(
        grupoNominaId,
        year ? parseInt(year as string) : undefined
      );
      res.json(periods);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/payroll-periods/generate/:grupoNominaId/:year", async (req, res) => {
    try {
      const { grupoNominaId, year } = req.params;
      const periods = await storage.generatePayrollPeriodsForYear(
        grupoNominaId,
        parseInt(year)
      );
      res.json({ success: true, count: periods.length, periods });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Horas Extras
  app.post("/api/horas-extras", async (req, res) => {
    try {
      const validatedData = insertHoraExtraSchema.parse(req.body);
      const horaExtra = await storage.createHoraExtra(validatedData);
      res.json(horaExtra);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/horas-extras", async (req, res) => {
    try {
      const { empleadoId, centroTrabajoId, estatus } = req.query;
      if (empleadoId) {
        const horasExtras = await storage.getHorasExtrasByEmpleado(empleadoId as string);
        return res.json(horasExtras);
      }
      if (centroTrabajoId) {
        const horasExtras = await storage.getHorasExtrasByCentro(centroTrabajoId as string);
        return res.json(horasExtras);
      }
      if (estatus) {
        const horasExtras = await storage.getHorasExtrasByEstatus(estatus as string);
        return res.json(horasExtras);
      }
      const horasExtras = await storage.getHorasExtras();
      res.json(horasExtras);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/horas-extras/:id", async (req, res) => {
    try {
      const horaExtra = await storage.getHoraExtra(req.params.id);
      if (!horaExtra) {
        return res.status(404).json({ message: "Hora extra no encontrada" });
      }
      res.json(horaExtra);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/horas-extras/:id", async (req, res) => {
    try {
      const validatedData = updateHoraExtraSchema.parse(req.body);
      const horaExtra = await storage.updateHoraExtra(req.params.id, validatedData);
      res.json(horaExtra);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/horas-extras/:id", async (req, res) => {
    try {
      await storage.deleteHoraExtra(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ============================================================================
  // NÓMINA - Periodos
  // ============================================================================

  app.get("/api/periodos-nomina", async (req, res) => {
    try {
      const { grupoNominaId } = req.query;
      if (grupoNominaId) {
        // Verify access to the grupo
        const grupo = await storage.getGrupoNomina(grupoNominaId as string);
        if (grupo?.clienteId && !canAccessCliente(req, grupo.clienteId)) {
          return res.status(403).json({ message: "No tienes acceso a este grupo de nómina" });
        }
        const periodos = await storage.getPeriodosNominaByGrupo(grupoNominaId as string);
        return res.json(periodos);
      }
      // For client users, filter by their clienteId
      const clienteId = getClienteIdFromRequest(req);
      if (clienteId) {
        const periodos = await storage.getPeriodosNominaByCliente(clienteId);
        return res.json(periodos);
      }
      // MaxTalent users can see all
      const periodos = await storage.getPeriodosNomina();
      res.json(periodos);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/periodos-nomina/:id", async (req, res) => {
    try {
      const periodo = await storage.getPeriodoNomina(req.params.id);
      if (!periodo) {
        return res.status(404).json({ message: "Periodo no encontrado" });
      }
      // Verify client access
      if (periodo.clienteId && !canAccessCliente(req, periodo.clienteId)) {
        return res.status(403).json({ message: "No tienes acceso a este periodo" });
      }
      res.json(periodo);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/periodos-nomina", async (req, res) => {
    try {
      const validatedData = insertPeriodoNominaSchema.parse(req.body);
      // Verify client access before creating
      if (validatedData.clienteId && !canAccessCliente(req, validatedData.clienteId)) {
        return res.status(403).json({ message: "No tienes acceso a crear periodos para este cliente" });
      }
      const periodo = await storage.createPeriodoNomina(validatedData);
      res.json(periodo);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/periodos-nomina/:id", async (req, res) => {
    try {
      // Verify access before updating
      const existingPeriodo = await storage.getPeriodoNomina(req.params.id);
      if (existingPeriodo?.clienteId && !canAccessCliente(req, existingPeriodo.clienteId)) {
        return res.status(403).json({ message: "No tienes acceso a este periodo" });
      }
      const periodo = await storage.updatePeriodoNomina(req.params.id, req.body);
      res.json(periodo);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // ============================================================================
  // NÓMINA - Conceptos
  // ============================================================================

  app.get("/api/conceptos-nomina", async (req, res) => {
    try {
      // For client users, filter by their clienteId
      const clienteId = getClienteIdFromRequest(req);
      if (clienteId) {
        const conceptos = await storage.getConceptosNominaByCliente(clienteId);
        return res.json(conceptos);
      }
      // MaxTalent users can see all
      const conceptos = await storage.getConceptosNomina();
      res.json(conceptos);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/conceptos-nomina/:id", async (req, res) => {
    try {
      const concepto = await storage.getConceptoNomina(req.params.id);
      if (!concepto) {
        return res.status(404).json({ message: "Concepto no encontrado" });
      }
      // Verify client access
      if (concepto.clienteId && !canAccessCliente(req, concepto.clienteId)) {
        return res.status(403).json({ message: "No tienes acceso a este concepto" });
      }
      res.json(concepto);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/conceptos-nomina", async (req, res) => {
    try {
      const validatedData = insertConceptoNominaSchema.parse(req.body);
      // Verify client access before creating
      if (validatedData.clienteId && !canAccessCliente(req, validatedData.clienteId)) {
        return res.status(403).json({ message: "No tienes acceso a crear conceptos para este cliente" });
      }
      const concepto = await storage.createConceptoNomina(validatedData);
      res.json(concepto);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // ============================================================================
  // NÓMINA - Incidencias (Protected with auth and client filtering)
  // ============================================================================

  app.get("/api/incidencias-nomina", requireAuth, async (req, res) => {
    try {
      const { periodoId, empleadoId } = req.query;
      const clienteId = getEffectiveClienteId(req);

      if (periodoId) {
        // Verify access to the periodo
        const periodo = await storage.getPeriodoNomina(periodoId as string);
        if (periodo?.clienteId && !canAccessCliente(req, periodo.clienteId)) {
          return res.status(403).json({ message: "No tiene acceso a este periodo" });
        }
        const incidencias = await storage.getIncidenciasNominaByPeriodo(periodoId as string);
        return res.json(incidencias);
      }
      if (empleadoId) {
        // Verify access to the employee
        const empleado = await storage.getEmployee(empleadoId as string);
        if (empleado?.clienteId && !canAccessCliente(req, empleado.clienteId)) {
          return res.status(403).json({ message: "No tiene acceso a este empleado" });
        }
        const incidencias = await storage.getIncidenciasNominaByEmpleado(empleadoId as string);
        return res.json(incidencias);
      }

      // For client users, filter by their clienteId
      if (clienteId) {
        const incidencias = await storage.getIncidenciasNominaByCliente(clienteId);
        return res.json(incidencias);
      }

      // Only MaxTalent users can see all
      if (req.user?.tipoUsuario !== "maxtalent") {
        return res.status(403).json({ message: "Acceso denegado" });
      }

      const incidencias = await storage.getIncidenciasNomina();
      res.json(incidencias);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/incidencias-nomina/:id", requireAuth, async (req, res) => {
    try {
      const incidencia = await storage.getIncidenciaNomina(req.params.id);
      if (!incidencia) {
        return res.status(404).json({ message: "Incidencia no encontrada" });
      }
      // Verify client access
      if (!canAccessCliente(req, incidencia.clienteId)) {
        return res.status(403).json({ message: "No tiene acceso a esta incidencia" });
      }
      res.json(incidencia);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/incidencias-nomina", requireAuth, async (req, res) => {
    try {
      const validatedData = insertIncidenciaNominaSchema.parse(req.body);
      // Verify client access for the incidencia being created
      if (validatedData.clienteId && !canAccessCliente(req, validatedData.clienteId)) {
        return res.status(403).json({ message: "No tiene acceso a crear incidencias para este cliente" });
      }
      const incidencia = await storage.createIncidenciaNomina(validatedData);
      res.json(incidencia);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/incidencias-nomina/:id", requireAuth, async (req, res) => {
    try {
      // Verify access to existing incidencia
      const existing = await storage.getIncidenciaNomina(req.params.id);
      if (!existing) {
        return res.status(404).json({ message: "Incidencia no encontrada" });
      }
      if (!canAccessCliente(req, existing.clienteId)) {
        return res.status(403).json({ message: "No tiene acceso a esta incidencia" });
      }
      const incidencia = await storage.updateIncidenciaNomina(req.params.id, req.body);
      res.json(incidencia);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/incidencias-nomina/:id", requireAuth, async (req, res) => {
    try {
      // Verify access to existing incidencia
      const existing = await storage.getIncidenciaNomina(req.params.id);
      if (!existing) {
        return res.status(404).json({ message: "Incidencia no encontrada" });
      }
      if (!canAccessCliente(req, existing.clienteId)) {
        return res.status(403).json({ message: "No tiene acceso a esta incidencia" });
      }
      await storage.deleteIncidenciaNomina(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ============================================================================
  // NÓMINA - Movimientos (Protected with auth and client filtering)
  // ============================================================================

  app.get("/api/nomina-movimientos", requireAuth, async (req, res) => {
    try {
      const { periodoId, empleadoId } = req.query;
      if (periodoId) {
        // Verify access to the periodo
        const periodo = await storage.getPeriodoNomina(periodoId as string);
        if (periodo?.clienteId && !canAccessCliente(req, periodo.clienteId)) {
          return res.status(403).json({ message: "No tienes acceso a este periodo" });
        }
        const movimientos = await storage.getNominaMovimientosByPeriodo(periodoId as string);
        return res.json(movimientos);
      }
      if (empleadoId) {
        // Verify access to the employee
        const empleado = await storage.getEmployee(empleadoId as string);
        if (empleado?.clienteId && !canAccessCliente(req, empleado.clienteId)) {
          return res.status(403).json({ message: "No tienes acceso a este empleado" });
        }
        const movimientos = await storage.getNominaMovimientosByEmpleado(empleadoId as string);
        return res.json(movimientos);
      }
      // For client users, filter by their clienteId
      const clienteId = getClienteIdFromRequest(req);
      if (clienteId) {
        const movimientos = await storage.getNominaMovimientosByCliente(clienteId);
        return res.json(movimientos);
      }
      // Only MaxTalent users can see all
      if (req.user?.tipoUsuario !== "maxtalent") {
        return res.status(403).json({ message: "Acceso denegado" });
      }
      const movimientos = await storage.getNominaMovimientos();
      res.json(movimientos);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/nomina-movimientos/:id", requireAuth, async (req, res) => {
    try {
      const movimiento = await storage.getNominaMovimiento(req.params.id);
      if (!movimiento) {
        return res.status(404).json({ message: "Movimiento no encontrado" });
      }
      // Verify client access
      if (movimiento.clienteId && !canAccessCliente(req, movimiento.clienteId)) {
        return res.status(403).json({ message: "No tienes acceso a este movimiento" });
      }
      res.json(movimiento);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ============================================================================
  // NÓMINAS - DESGLOSE POR EMPLEADO
  // ============================================================================

  app.get("/api/nomina/desglose/:empleadoId", async (req, res) => {
    try {
      const { empleadoId } = req.params;
      const { fechaInicio, fechaFin, frecuencia, diasPeriodo, usarIncidencias } = req.query;
      
      // Validar empleado existe
      const empleado = await storage.getEmployee(empleadoId);
      if (!empleado) {
        return res.status(404).json({ message: "Empleado no encontrado" });
      }
      
      // Verificar acceso para usuarios de cliente (skip si no hay sesión - API interna)
      const user = req.user;
      if (user && empleado.clienteId && !canAccessCliente(req, empleado.clienteId)) {
        return res.status(403).json({ message: "No tienes acceso a este empleado" });
      }
      
      // Parsear fechas o usar defaults (quincena actual)
      const hoy = new Date();
      const diaDelMes = hoy.getDate();
      let inicio: Date;
      let fin: Date;
      
      if (fechaInicio && fechaFin) {
        inicio = new Date(fechaInicio as string);
        fin = new Date(fechaFin as string);
      } else {
        // Default: quincena actual
        if (diaDelMes <= 15) {
          inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
          fin = new Date(hoy.getFullYear(), hoy.getMonth(), 15);
        } else {
          inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 16);
          fin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
        }
      }
      
      const { generarDesgloseNomina } = await import("./services/payrollBreakdownService");
      
      const desglose = await generarDesgloseNomina({
        empleadoId,
        fechaInicio: inicio,
        fechaFin: fin,
        frecuencia: (frecuencia as any) || 'quincenal',
        diasPeriodo: diasPeriodo ? parseInt(diasPeriodo as string) : undefined,
        usarIncidencias: usarIncidencias !== 'false',
      });
      
      res.json(desglose);
    } catch (error: any) {
      console.error('[DESGLOSE NOMINA ERROR]', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Batch endpoint para calcular desglose de múltiples empleados
  app.post("/api/nomina/desglose-batch", async (req, res) => {
    try {
      const { empleadoIds, fechaInicio, fechaFin, frecuencia, diasPeriodo, usarIncidencias } = req.body;

      if (!empleadoIds || !Array.isArray(empleadoIds) || empleadoIds.length === 0) {
        return res.status(400).json({ message: "empleadoIds debe ser un array no vacío" });
      }

      // Parsear fechas o usar defaults (quincena actual)
      const hoy = new Date();
      const diaDelMes = hoy.getDate();
      let inicio: Date;
      let fin: Date;

      if (fechaInicio && fechaFin) {
        inicio = new Date(fechaInicio);
        fin = new Date(fechaFin);
      } else {
        // Default: quincena actual
        if (diaDelMes <= 15) {
          inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
          fin = new Date(hoy.getFullYear(), hoy.getMonth(), 15);
        } else {
          inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 16);
          fin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
        }
      }

      const { generarDesgloseNomina } = await import("./services/payrollBreakdownService");

      // Procesar todos los empleados en paralelo
      const resultados = await Promise.allSettled(
        empleadoIds.map(async (empleadoId: string) => {
          // Verificar que el empleado existe
          const empleado = await storage.getEmployee(empleadoId);
          if (!empleado) {
            throw new Error(`Empleado ${empleadoId} no encontrado`);
          }

          // Verificar acceso si hay sesión
          const user = req.user;
          if (user && empleado.clienteId && !canAccessCliente(req, empleado.clienteId)) {
            throw new Error(`Sin acceso al empleado ${empleadoId}`);
          }

          return generarDesgloseNomina({
            empleadoId,
            fechaInicio: inicio,
            fechaFin: fin,
            frecuencia: frecuencia || 'quincenal',
            diasPeriodo: diasPeriodo ? parseInt(diasPeriodo) : undefined,
            usarIncidencias: usarIncidencias !== false,
          });
        })
      );

      // Mapear resultados - incluir errores para debugging
      const desgloses = resultados.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          console.error(`[DESGLOSE BATCH] Error para empleado ${empleadoIds[index]}:`, result.reason);
          return {
            empleadoId: empleadoIds[index],
            error: result.reason?.message || 'Error desconocido',
          };
        }
      });

      res.json({ desgloses });
    } catch (error: any) {
      console.error('[DESGLOSE BATCH ERROR]', error);
      res.status(500).json({ message: error.message });
    }
  });

  // ============================================================================
  // COSTOS DE NÓMINA - Aggregated payroll costs reporting
  // ============================================================================

  app.get("/api/costos-nomina", requireAuth, async (req, res) => {
    try {
      const clienteId = getEffectiveClienteId(req);
      if (!clienteId) {
        return res.status(400).json({ message: "Cliente ID required" });
      }

      const { empresaId, fechaInicio, fechaFin } = req.query as {
        empresaId?: string;
        fechaInicio: string;
        fechaFin: string;
      };

      if (!fechaInicio || !fechaFin) {
        return res.status(400).json({ message: "Date range required (fechaInicio, fechaFin)" });
      }

      const { obtenerCostosNomina } = await import("./services/costosNominaService");
      const resultado = await obtenerCostosNomina({
        clienteId,
        empresaId,
        fechaInicio,
        fechaFin,
      });

      res.json(resultado);
    } catch (error: any) {
      console.error("[COSTOS NOMINA ERROR]", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get ISN rates by state (for reference/display)
  app.get("/api/isn-tasas", requireAuth, async (req, res) => {
    try {
      const { obtenerTodasLasTasasISN } = await import("./services/isnCalculator");
      const tasas = await obtenerTodasLasTasasISN();
      res.json(tasas);
    } catch (error: any) {
      console.error("[ISN TASAS ERROR]", error);
      res.status(500).json({ message: error.message });
    }
  });

  // ============================================================================
  // NÓMINAS - CRUD Operations (Protected with auth and client filtering)
  // ============================================================================

  app.get("/api/nominas", requireAuth, async (req, res) => {
    try {
      const { status, periodo } = req.query;
      const clienteId = getEffectiveClienteId(req);

      // Client users MUST have a clienteId and can only see their own data
      if (req.user?.tipoUsuario === "cliente" && !clienteId) {
        return res.status(403).json({ message: "No tiene cliente asignado" });
      }

      // Filter by clienteId if available (required for cliente users, optional for maxtalent)
      if (clienteId) {
        if (status) {
          const nominas = await storage.getNominasByClienteAndStatus(clienteId, status as string);
          return res.json(nominas);
        }
        if (periodo) {
          const nominas = await storage.getNominasByClienteAndPeriodo(clienteId, periodo as string);
          return res.json(nominas);
        }
        const nominas = await storage.getNominasByCliente(clienteId);
        return res.json(nominas);
      }

      // Only MaxTalent users can see all nominas (when no clienteId specified)
      if (req.user?.tipoUsuario !== "maxtalent") {
        return res.status(403).json({ message: "Acceso denegado" });
      }

      if (status) {
        const nominas = await storage.getNominasByStatus(status as string);
        return res.json(nominas);
      }
      if (periodo) {
        const nominas = await storage.getNominasByPeriodo(periodo as string);
        return res.json(nominas);
      }

      const nominas = await storage.getNominas();
      res.json(nominas);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/nominas/:id", requireAuth, async (req, res) => {
    try {
      const nomina = await storage.getNomina(req.params.id);
      if (!nomina) {
        return res.status(404).json({ message: "Nómina no encontrada" });
      }
      // Verify client access
      if (!canAccessCliente(req, nomina.clienteId)) {
        return res.status(403).json({ message: "No tiene acceso a esta nómina" });
      }
      res.json(nomina);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/nominas", requireAuth, async (req, res) => {
    try {
      // Verify client access for the nomina being created
      if (req.body.clienteId && !canAccessCliente(req, req.body.clienteId)) {
        return res.status(403).json({ message: "No tiene acceso a crear nóminas para este cliente" });
      }
      const nomina = await storage.createNomina(req.body);
      res.json(nomina);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/nominas/:id", requireAuth, async (req, res) => {
    try {
      // Verify access to existing nomina
      const existing = await storage.getNomina(req.params.id);
      if (!existing) {
        return res.status(404).json({ message: "Nómina no encontrada" });
      }
      if (!canAccessCliente(req, existing.clienteId)) {
        return res.status(403).json({ message: "No tiene acceso a esta nómina" });
      }
      const nomina = await storage.updateNomina(req.params.id, req.body);
      res.json(nomina);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/nominas/:id", requireAuth, async (req, res) => {
    try {
      // Verify access to existing nomina
      const existing = await storage.getNomina(req.params.id);
      if (!existing) {
        return res.status(404).json({ message: "Nómina no encontrada" });
      }
      if (!canAccessCliente(req, existing.clienteId)) {
        return res.status(403).json({ message: "No tiene acceso a esta nómina" });
      }
      await storage.deleteNomina(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/nominas/:id/aprobar", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { aprobadoPor } = req.body;

      // Verify access to nomina
      const existing = await storage.getNomina(id);
      if (!existing) {
        return res.status(404).json({ message: "Nómina no encontrada" });
      }
      if (!canAccessCliente(req, existing.clienteId)) {
        return res.status(403).json({ message: "No tiene acceso a esta nómina" });
      }

      const nomina = await storage.updateNominaStatus(id, "approved", aprobadoPor);

      // Generar layouts de nómina y pagos adicionales (SDE)
      let layoutsNomina: any[] = [];
      let layoutsPagosAdicionales: any[] = [];
      try {
        const result = await generarTodosLosLayouts(id, aprobadoPor);
        layoutsNomina = result.layoutsNomina;
        layoutsPagosAdicionales = result.layoutsPagosAdicionales;
      } catch (layoutError: any) {
        console.warn(`[NOMINA APROBADA] No se pudieron generar layouts: ${layoutError.message}`);
      }

      const allLayouts = [...layoutsNomina, ...layoutsPagosAdicionales];

      res.json({
        success: true,
        message: "Nómina aprobada exitosamente",
        nomina,
        layouts: allLayouts.map(l => ({
          id: l.id,
          nombreArchivo: l.nombreArchivo,
          medioPagoId: l.medioPagoId,
          tipoLayout: l.tipoLayout,
          totalRegistros: l.totalRegistros,
          totalMonto: l.totalMonto,
        })),
        layoutsNomina: layoutsNomina.length,
        layoutsPagosAdicionales: layoutsPagosAdicionales.length,
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Mark nomina as paid
  app.post("/api/nominas/:id/pagar", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { pagadoPor } = req.body;

      const nomina = await storage.getNomina(id);
      if (!nomina) {
        return res.status(404).json({ message: "Nómina no encontrada" });
      }

      // Verify access to nomina
      if (!canAccessCliente(req, nomina.clienteId)) {
        return res.status(403).json({ message: "No tiene acceso a esta nómina" });
      }

      if (nomina.status !== "approved") {
        return res.status(400).json({ message: "La nómina debe estar aprobada antes de marcarla como pagada" });
      }

      const nominaActualizada = await storage.updateNominaStatus(id, "paid", pagadoPor);
      
      res.json({
        success: true,
        message: "Nómina marcada como pagada",
        nomina: nominaActualizada
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Mark nomina as stamped (timbrada) - sets fechaTimbrado without changing status
  app.post("/api/nominas/:id/timbrar", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { timbradoPor } = req.body;

      const nomina = await storage.getNomina(id);
      if (!nomina) {
        return res.status(404).json({ message: "Nómina no encontrada" });
      }

      // Verify access to nomina
      if (!canAccessCliente(req, nomina.clienteId)) {
        return res.status(403).json({ message: "No tiene acceso a esta nómina" });
      }

      if (nomina.status !== "paid") {
        return res.status(400).json({ message: "La nómina debe estar pagada antes de timbrar los recibos" });
      }

      // Update fechaTimbrado without changing status
      const nominaActualizada = await storage.updateNominaTimbrado(id, timbradoPor);
      
      res.json({
        success: true,
        message: "Recibos timbrados exitosamente",
        nomina: nominaActualizada
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/nominas/:id/status", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { status, aprobadoPor } = req.body;

      if (!status) {
        return res.status(400).json({ message: "El status es requerido" });
      }

      // Verify access to nomina
      const existing = await storage.getNomina(id);
      if (!existing) {
        return res.status(404).json({ message: "Nómina no encontrada" });
      }
      if (!canAccessCliente(req, existing.clienteId)) {
        return res.status(403).json({ message: "No tiene acceso a esta nómina" });
      }

      const nomina = await storage.updateNominaStatus(id, status, aprobadoPor);
      
      if (status === "approved") {
        try {
          const { layoutsNomina, layoutsPagosAdicionales } = await generarTodosLosLayouts(id, aprobadoPor);
          const allLayouts = [...layoutsNomina, ...layoutsPagosAdicionales];
          return res.json({
            success: true,
            nomina,
            layouts: allLayouts.map(l => ({
              id: l.id,
              nombreArchivo: l.nombreArchivo,
              medioPagoId: l.medioPagoId,
              tipoLayout: l.tipoLayout,
              totalRegistros: l.totalRegistros,
              totalMonto: l.totalMonto,
            })),
            layoutsNomina: layoutsNomina.length,
            layoutsPagosAdicionales: layoutsPagosAdicionales.length,
          });
        } catch (layoutError: any) {
          console.warn(`[NOMINA STATUS] No se pudieron generar layouts: ${layoutError.message}`);
        }
      }
      
      res.json({ success: true, nomina });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // ============================================================================
  // LAYOUTS BANCARIOS - Generación y descarga de layouts para dispersión
  // ============================================================================

  app.post("/api/nominas/:nominaId/generar-layouts", requireAuth, async (req, res) => {
    try {
      const { nominaId } = req.params;
      const { generadoPor } = req.body;

      // Verify access to nomina
      const nomina = await storage.getNomina(nominaId);
      if (!nomina) {
        return res.status(404).json({ message: "Nómina no encontrada" });
      }
      if (!canAccessCliente(req, nomina.clienteId)) {
        return res.status(403).json({ message: "No tiene acceso a esta nómina" });
      }

      // Generar tanto layouts de nómina como pagos adicionales (SDE)
      const { layoutsNomina, layoutsPagosAdicionales } = await generarTodosLosLayouts(nominaId, generadoPor);
      const allLayouts = [...layoutsNomina, ...layoutsPagosAdicionales];

      res.json({
        success: true,
        message: `Se generaron ${allLayouts.length} layout(s) (${layoutsNomina.length} nómina, ${layoutsPagosAdicionales.length} pagos adicionales)`,
        layouts: allLayouts.map(l => ({
          id: l.id,
          nombreArchivo: l.nombreArchivo,
          medioPagoId: l.medioPagoId,
          tipoLayout: l.tipoLayout,
          totalRegistros: l.totalRegistros,
          totalMonto: l.totalMonto,
          formato: l.formato,
        })),
        layoutsNomina: layoutsNomina.length,
        layoutsPagosAdicionales: layoutsPagosAdicionales.length,
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/nominas/:nominaId/layouts", requireAuth, async (req, res) => {
    try {
      const { nominaId } = req.params;

      // Verify access to nomina
      const nomina = await storage.getNomina(nominaId);
      if (!nomina) {
        return res.status(404).json({ message: "Nómina no encontrada" });
      }
      if (!canAccessCliente(req, nomina.clienteId)) {
        return res.status(403).json({ message: "No tiene acceso a esta nómina" });
      }

      const layouts = await getLayoutsGeneradosForNomina(nominaId);
      res.json(layouts);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/layouts/:layoutId/download", requireAuth, async (req, res) => {
    try {
      const { layoutId } = req.params;
      const layout = await getLayoutContent(layoutId);

      if (!layout) {
        return res.status(404).json({ message: "Layout no encontrado" });
      }

      // Verify access via nomina
      if (layout.nominaId) {
        const nomina = await storage.getNomina(layout.nominaId);
        if (nomina && !canAccessCliente(req, nomina.clienteId)) {
          return res.status(403).json({ message: "No tiene acceso a este layout" });
        }
      }

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="${layout.nombreArchivo}"`);
      res.send(layout.contenido);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/layouts/:layoutId", requireAuth, async (req, res) => {
    try {
      const { layoutId } = req.params;
      const layout = await storage.getLayoutGenerado(layoutId);

      if (!layout) {
        return res.status(404).json({ message: "Layout no encontrado" });
      }

      // Verify access via nomina
      if (layout.nominaId) {
        const nomina = await storage.getNomina(layout.nominaId);
        if (nomina && !canAccessCliente(req, nomina.clienteId)) {
          return res.status(403).json({ message: "No tiene acceso a este layout" });
        }
      }

      res.json(layout);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/layouts/:layoutId", requireAuth, async (req, res) => {
    try {
      const { layoutId } = req.params;
      const layout = await storage.getLayoutGenerado(layoutId);

      if (!layout) {
        return res.status(404).json({ message: "Layout no encontrado" });
      }

      // Verify access via nomina
      if (layout.nominaId) {
        const nomina = await storage.getNomina(layout.nominaId);
        if (nomina && !canAccessCliente(req, nomina.clienteId)) {
          return res.status(403).json({ message: "No tiene acceso a este layout" });
        }
      }

      await storage.deleteLayoutGenerado(layoutId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Direct BBVA/Santander layout generation endpoint
  app.get("/api/nominas/:nominaId/layout-bancario/:banco", requireAuth, async (req, res) => {
    try {
      const { nominaId, banco } = req.params;

      if (banco !== 'bbva' && banco !== 'santander') {
        return res.status(400).json({ message: "Banco no soportado. Use 'bbva' o 'santander'" });
      }

      const nomina = await storage.getNomina(nominaId);
      if (!nomina) {
        return res.status(404).json({ message: "Nómina no encontrada" });
      }

      // Verify client access
      if (!canAccessCliente(req, nomina.clienteId)) {
        return res.status(403).json({ message: "No tiene acceso a esta nómina" });
      }

      if (nomina.status !== "approved") {
        return res.status(400).json({ message: "La nómina debe estar aprobada para generar layouts bancarios" });
      }

      const empleadosData = nomina.empleadosData as any[];
      if (!empleadosData || empleadosData.length === 0) {
        return res.status(400).json({ message: "La nómina no tiene empleados" });
      }

      // Get empresa info for the layout
      const empresa = await storage.getEmpresa(nomina.empresaId);
      const empresaNombre = empresa?.razonSocial || 'EMPRESA';
      const empresaRfc = empresa?.rfc || 'XXXXXXXXXXX';

      // Import the bank layout service
      const { generateBankLayout } = await import("./services/bankLayoutService");

      // Transform employee data for the layout
      const employees = empleadosData.map((emp: any) => ({
        nombre: emp.nombreCompleto || `${emp.apellidoPaterno || ''} ${emp.apellidoMaterno || ''} ${emp.nombre || ''}`.trim() || emp.nombre || 'EMPLEADO',
        rfc: emp.rfc || '',
        clabe: emp.clabe || emp.cuentaBancaria || '000000000000000000',
        numeroCuenta: emp.cuentaBancaria,
        banco: emp.banco,
        netoAPagar: emp.netoAPagar || 0,
        referencia: `NOM${nominaId.substring(0, 8)}`,
      }));

      const config = {
        empresaNombre,
        empresaRfc,
        convenio: empresa?.convenioDispersion || undefined,
        fechaPago: new Date(),
        secuencia: 1,
      };

      const { content, filename, mimeType } = generateBankLayout(banco, employees, config);

      res.setHeader("Content-Type", mimeType);
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.send(content);
    } catch (error: any) {
      console.error("[LAYOUT BANCARIO] Error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // ============================================================================
  // REPSE - Clientes
  // ============================================================================

  app.post("/api/clientes-repse", async (req, res) => {
    try {
      const validatedData = insertClienteREPSESchema.parse(req.body);
      const cliente = await storage.createClienteREPSE(validatedData);
      res.json(cliente);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/clientes-repse", async (req, res) => {
    try {
      const clientes = await storage.getClientesREPSE();
      res.json(clientes);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/clientes-repse/:id", async (req, res) => {
    try {
      const cliente = await storage.getClienteREPSE(req.params.id);
      if (!cliente) {
        return res.status(404).json({ message: "Cliente no encontrado" });
      }
      res.json(cliente);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/clientes-repse/:id", async (req, res) => {
    try {
      const validatedData = updateClienteREPSESchema.parse(req.body);
      const cliente = await storage.updateClienteREPSE(req.params.id, validatedData);
      res.json(cliente);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/clientes-repse/:id", async (req, res) => {
    try {
      await storage.deleteClienteREPSE(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ============================================================================
  // REPSE - Registros REPSE
  // ============================================================================

  app.post("/api/registros-repse", async (req, res) => {
    try {
      const validatedData = insertRegistroREPSESchema.parse(req.body);
      const registro = await storage.createRegistroREPSE(validatedData);
      res.json(registro);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/registros-repse", async (req, res) => {
    try {
      const { empresaId } = req.query;
      if (empresaId) {
        const registros = await storage.getRegistrosREPSEByEmpresa(empresaId as string);
        return res.json(registros);
      }
      const registros = await storage.getRegistrosREPSE();
      res.json(registros);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/registros-repse/:id", async (req, res) => {
    try {
      const registro = await storage.getRegistroREPSE(req.params.id);
      if (!registro) {
        return res.status(404).json({ message: "Registro REPSE no encontrado" });
      }
      res.json(registro);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/registros-repse/:id", async (req, res) => {
    try {
      const validatedData = updateRegistroREPSESchema.parse(req.body);
      const registro = await storage.updateRegistroREPSE(req.params.id, validatedData);
      res.json(registro);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/registros-repse/:id", async (req, res) => {
    try {
      await storage.deleteRegistroREPSE(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ============================================================================
  // REPSE - Contratos
  // ============================================================================

  app.post("/api/contratos-repse", async (req, res) => {
    try {
      const validatedData = insertContratoREPSESchema.parse(req.body);
      console.log("[POST /api/contratos-repse] Creating contract:", validatedData);
      const contrato = await storage.createContratoREPSE(validatedData);
      console.log("[POST /api/contratos-repse] Contract created:", contrato.id);
      
      // Validar que fechaInicio no sea null antes de crear aviso
      if (!contrato.fechaInicio) {
        return res.status(400).json({ 
          message: "No se puede crear aviso: fechaInicio es requerida" 
        });
      }
      
      // Crear aviso automático para nuevo contrato (30 días de plazo)
      const fechaEvento = new Date(contrato.fechaInicio);
      const fechaLimite = new Date(fechaEvento);
      fechaLimite.setDate(fechaLimite.getDate() + 30);
      
      // Obtener información del cliente para la descripción
      const cliente = await storage.getClienteREPSE(contrato.clienteId);
      console.log("[POST /api/contratos-repse] Cliente fetched:", cliente?.razonSocial ?? "N/A");
      const descripcion = cliente 
        ? `Aviso de nuevo contrato con ${cliente.razonSocial} - Contrato ${contrato.numeroContrato}`
        : `Aviso de nuevo contrato - Contrato ${contrato.numeroContrato}`;
      
      // Derivar clienteId desde empresa para multi-tenancy
      const empresa = await storage.getEmpresa(contrato.empresaId);
      if (!empresa) {
        throw new Error('Empresa no encontrada');
      }
      
      console.log("[POST /api/contratos-repse] Creating aviso:", {
        tipo: "NUEVO_CONTRATO",
        clienteId: empresa.clienteId,
        empresaId: contrato.empresaId,
        contratoREPSEId: contrato.id,
        descripcion,
        fechaEvento: contrato.fechaInicio,
        fechaLimite: fechaLimite.toISOString().split('T')[0],
      });
      
      const aviso = await storage.createAvisoREPSE({
        clienteId: empresa.clienteId,
        tipo: "NUEVO_CONTRATO",
        empresaId: contrato.empresaId,
        contratoREPSEId: contrato.id,
        descripcion,
        fechaEvento: contrato.fechaInicio,
        fechaLimite: fechaLimite.toISOString().split('T')[0],
        estatus: "PENDIENTE",
      });
      console.log("[POST /api/contratos-repse] Aviso created:", aviso.id);
      
      res.json(contrato);
    } catch (error: any) {
      console.error("[POST /api/contratos-repse] Error:", error);
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/contratos-repse", async (req, res) => {
    try {
      const { empresaId, clienteId, registroREPSEId } = req.query;
      if (empresaId) {
        const contratos = await storage.getContratosREPSEByEmpresa(empresaId as string);
        return res.json(contratos);
      }
      if (clienteId) {
        const contratos = await storage.getContratosREPSEByCliente(clienteId as string);
        return res.json(contratos);
      }
      if (registroREPSEId) {
        const contratos = await storage.getContratosREPSEByRegistro(registroREPSEId as string);
        return res.json(contratos);
      }
      const contratos = await storage.getContratosREPSE();
      res.json(contratos);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/contratos-repse/:id", async (req, res) => {
    try {
      const contrato = await storage.getContratoREPSE(req.params.id);
      if (!contrato) {
        return res.status(404).json({ message: "Contrato REPSE no encontrado" });
      }
      res.json(contrato);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/contratos-repse/:id", async (req, res) => {
    try {
      const validatedData = updateContratoREPSESchema.parse(req.body);
      const contratoAnterior = await storage.getContratoREPSE(req.params.id);
      const contrato = await storage.updateContratoREPSE(req.params.id, validatedData);
      
      // Derivar clienteId desde empresa para multi-tenancy (usado en avisos)
      const empresa = await storage.getEmpresa(contrato.empresaId);
      if (!empresa) {
        throw new Error('Empresa no encontrada');
      }
      
      // Verificar si el estatus cambió a finalizado o cancelado (terminación de contrato)
      if (contratoAnterior && 
          contratoAnterior.estatus !== contrato.estatus &&
          (contrato.estatus === "finalizado" || contrato.estatus === "cancelado")) {
        
        const ahora = new Date();
        const fechaLimite = new Date(ahora);
        fechaLimite.setDate(fechaLimite.getDate() + 30);
        
        // Usar fechaFin si está disponible, sino fecha actual
        const fechaEventoStr: string = contrato.fechaFin ?? ahora.toISOString().split('T')[0];
        
        const cliente = await storage.getClienteREPSE(contrato.clienteId);
        const descripcion = cliente 
          ? `Aviso de terminación de contrato con ${cliente.razonSocial} - Contrato ${contrato.numeroContrato}`
          : `Aviso de terminación de contrato - Contrato ${contrato.numeroContrato}`;
        
        await storage.createAvisoREPSE({
          clienteId: empresa.clienteId,
          tipo: "TERMINACION_CONTRATO",
          empresaId: contrato.empresaId,
          contratoREPSEId: contrato.id,
          descripcion,
          fechaEvento: fechaEventoStr,
          fechaLimite: fechaLimite.toISOString().split('T')[0],
          estatus: "PENDIENTE",
        });
      } 
      // Si no es terminación pero hubo cambios significativos, crear aviso de modificación
      else if (contratoAnterior && 
               (validatedData.serviciosEspecializados || 
                validatedData.fechaFin || 
                validatedData.montoContrato)) {
        
        const ahora = new Date();
        const fechaLimite = new Date(ahora);
        fechaLimite.setDate(fechaLimite.getDate() + 30);
        
        // Usar fechaInicio si está disponible, sino fecha actual
        const fechaEventoStr: string = contrato.fechaInicio ?? ahora.toISOString().split('T')[0];
        
        const cliente = await storage.getClienteREPSE(contrato.clienteId);
        const descripcion = cliente 
          ? `Aviso de modificación de contrato con ${cliente.razonSocial} - Contrato ${contrato.numeroContrato}`
          : `Aviso de modificación de contrato - Contrato ${contrato.numeroContrato}`;
        
        await storage.createAvisoREPSE({
          clienteId: empresa.clienteId,
          tipo: "MODIFICACION_CONTRATO",
          empresaId: contrato.empresaId,
          contratoREPSEId: contrato.id,
          descripcion,
          fechaEvento: fechaEventoStr,
          fechaLimite: fechaLimite.toISOString().split('T')[0],
          estatus: "PENDIENTE",
        });
      }
      
      res.json(contrato);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/contratos-repse/:id", async (req, res) => {
    try {
      await storage.deleteContratoREPSE(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ============================================================================
  // REPSE - Asignaciones de Personal
  // ============================================================================

  app.post("/api/asignaciones-personal-repse", async (req, res) => {
    try {
      const validatedData = insertAsignacionPersonalREPSESchema.parse(req.body);
      const asignacion = await storage.createAsignacionPersonalREPSE(validatedData);
      res.json(asignacion);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/asignaciones-personal-repse", async (req, res) => {
    try {
      const { contratoREPSEId, empleadoId } = req.query;
      if (contratoREPSEId) {
        const asignaciones = await storage.getAsignacionesPersonalREPSEByContrato(contratoREPSEId as string);
        return res.json(asignaciones);
      }
      if (empleadoId) {
        const asignaciones = await storage.getAsignacionesPersonalREPSEByEmpleado(empleadoId as string);
        return res.json(asignaciones);
      }
      const asignaciones = await storage.getAsignacionesPersonalREPSE();
      res.json(asignaciones);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/asignaciones-personal-repse/:id", async (req, res) => {
    try {
      const asignacion = await storage.getAsignacionPersonalREPSE(req.params.id);
      if (!asignacion) {
        return res.status(404).json({ message: "Asignación de personal no encontrada" });
      }
      res.json(asignacion);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/asignaciones-personal-repse/:id", async (req, res) => {
    try {
      const validatedData = updateAsignacionPersonalREPSESchema.parse(req.body);
      const asignacion = await storage.updateAsignacionPersonalREPSE(req.params.id, validatedData);
      res.json(asignacion);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/asignaciones-personal-repse/:id", async (req, res) => {
    try {
      await storage.deleteAsignacionPersonalREPSE(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ============================================================================
  // REPSE - Avisos
  // ============================================================================

  app.post("/api/avisos-repse", async (req, res) => {
    try {
      const validated = insertAvisoREPSESchema.parse(req.body);
      const aviso = await storage.createAvisoREPSE(validated);
      res.status(201).json(aviso);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/avisos-repse", async (req, res) => {
    try {
      const avisos = await storage.getAvisosREPSE();
      res.json(avisos);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/avisos-repse/pendientes", async (req, res) => {
    try {
      const avisos = await storage.getAvisosREPSEPendientes();
      res.json(avisos);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/avisos-repse/empresa/:empresaId", async (req, res) => {
    try {
      const avisos = await storage.getAvisosREPSEByEmpresa(req.params.empresaId);
      res.json(avisos);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/avisos-repse/contrato/:contratoId", async (req, res) => {
    try {
      const avisos = await storage.getAvisosREPSEByContrato(req.params.contratoId);
      res.json(avisos);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/avisos-repse/:id", async (req, res) => {
    try {
      const aviso = await storage.getAvisoREPSE(req.params.id);
      if (!aviso) {
        return res.status(404).json({ message: "Aviso no encontrado" });
      }
      res.json(aviso);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/avisos-repse/:id", async (req, res) => {
    try {
      const validated = updateAvisoREPSESchema.parse(req.body);
      const aviso = await storage.updateAvisoREPSE(req.params.id, validated);
      res.json(aviso);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/avisos-repse/:id/presentar", async (req, res) => {
    try {
      const { fechaPresentacion, numeroFolioSTPS } = req.body;
      if (!fechaPresentacion) {
        return res.status(400).json({ message: "fechaPresentacion es requerida" });
      }
      const aviso = await storage.marcarAvisoPresentado(req.params.id, fechaPresentacion, numeroFolioSTPS);
      res.json(aviso);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/avisos-repse/:id", async (req, res) => {
    try {
      await storage.deleteAvisoREPSE(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/avisos-repse-presentados", async (req, res) => {
    try {
      const avisos = await storage.getAvisosREPSEPresentados();
      res.json(avisos);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/avisos-repse/generar-trimestrales", async (req, res) => {
    try {
      const { empresaId, año } = req.body;
      if (!empresaId || !año) {
        return res.status(400).json({ message: "empresaId y año son requeridos" });
      }
      const avisos = await storage.generarAvisosTrimestrales(empresaId, año);
      res.json(avisos);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // ============================================================================
  // CRÉDITOS Y DESCUENTOS
  // ============================================================================

  // Créditos Legales
  app.post("/api/creditos-legales", async (req, res) => {
    try {
      const validated = insertCreditoLegalSchema.parse(req.body);
      const credito = await storage.createCreditoLegal(validated);
      res.status(201).json(credito);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/creditos-legales", async (req, res) => {
    try {
      const creditos = await storage.getCreditosLegales();
      res.json(creditos);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/creditos-legales/activos", async (req, res) => {
    try {
      const creditos = await storage.getCreditosLegalesActivos();
      res.json(creditos);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/creditos-legales/tipo/:tipoCredito", async (req, res) => {
    try {
      const creditos = await storage.getCreditosLegalesByTipo(req.params.tipoCredito);
      res.json(creditos);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/creditos-legales/empleado/:empleadoId", async (req, res) => {
    try {
      const creditos = await storage.getCreditosLegalesByEmpleado(req.params.empleadoId);
      res.json(creditos);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/creditos-legales/:id", async (req, res) => {
    try {
      const credito = await storage.getCreditoLegal(req.params.id);
      if (!credito) {
        return res.status(404).json({ message: "Crédito no encontrado" });
      }
      res.json(credito);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/creditos-legales/:id", async (req, res) => {
    try {
      const validated = updateCreditoLegalSchema.parse(req.body);
      const credito = await storage.updateCreditoLegal(req.params.id, validated);
      res.json(credito);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/creditos-legales/:id", async (req, res) => {
    try {
      await storage.deleteCreditoLegal(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Préstamos Internos
  app.post("/api/prestamos-internos", async (req, res) => {
    try {
      const validated = insertPrestamoInternoSchema.parse(req.body);
      const prestamo = await storage.createPrestamoInterno(validated);
      res.status(201).json(prestamo);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/prestamos-internos", async (req, res) => {
    try {
      const prestamos = await storage.getPrestamosInternos();
      res.json(prestamos);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/prestamos-internos/activos", async (req, res) => {
    try {
      const prestamos = await storage.getPrestamosInternosActivos();
      res.json(prestamos);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/prestamos-internos/empleado/:empleadoId", async (req, res) => {
    try {
      const prestamos = await storage.getPrestamosInternosByEmpleado(req.params.empleadoId);
      res.json(prestamos);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/prestamos-internos/:id", async (req, res) => {
    try {
      const prestamo = await storage.getPrestamoInterno(req.params.id);
      if (!prestamo) {
        return res.status(404).json({ message: "Préstamo no encontrado" });
      }
      res.json(prestamo);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/prestamos-internos/:id", async (req, res) => {
    try {
      const validated = updatePrestamoInternoSchema.parse(req.body);
      const prestamo = await storage.updatePrestamoInterno(req.params.id, validated);
      res.json(prestamo);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/prestamos-internos/:id", async (req, res) => {
    try {
      await storage.deletePrestamoInterno(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Pagos de Créditos y Descuentos
  app.post("/api/pagos-creditos-descuentos", async (req, res) => {
    try {
      const validated = insertPagoCreditoDescuentoSchema.parse(req.body);
      const pago = await storage.createPagoCreditoDescuento(validated);
      res.status(201).json(pago);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/pagos-creditos-descuentos", async (req, res) => {
    try {
      const pagos = await storage.getPagosCreditosDescuentos();
      res.json(pagos);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/pagos-creditos-descuentos/empleado/:empleadoId", async (req, res) => {
    try {
      const pagos = await storage.getPagosCreditosDescuentosByEmpleado(req.params.empleadoId);
      res.json(pagos);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/pagos-creditos-descuentos/credito-legal/:creditoLegalId", async (req, res) => {
    try {
      const pagos = await storage.getPagosCreditosDescuentosByCreditoLegal(req.params.creditoLegalId);
      res.json(pagos);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/pagos-creditos-descuentos/prestamo-interno/:prestamoInternoId", async (req, res) => {
    try {
      const pagos = await storage.getPagosCreditosDescuentosByPrestamoInterno(req.params.prestamoInternoId);
      res.json(pagos);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/pagos-creditos-descuentos/:id", async (req, res) => {
    try {
      await storage.deletePagoCreditoDescuento(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Puestos (Organización)
  app.post("/api/puestos", async (req, res) => {
    try {
      const validated = insertPuestoSchema.parse(req.body);
      const puesto = await storage.createPuesto(validated);
      res.status(201).json(puesto);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Bulk create puestos
  app.post("/api/puestos/bulk", async (req, res) => {
    try {
      const { puestos, clienteId, empresaId } = req.body;
      if (!Array.isArray(puestos) || puestos.length === 0) {
        return res.status(400).json({ message: "Se requiere un array de puestos" });
      }
      
      const createdPuestos = [];
      const existing = await storage.getPuestos();
      
      for (const puestoData of puestos) {
        // Check if puesto already exists
        const exists = existing.find(p => 
          p.nombrePuesto.toLowerCase() === puestoData.nombre.toLowerCase()
        );
        
        if (!exists) {
          const clave = `${puestoData.nombre.substring(0, 10).toUpperCase().replace(/\s+/g, '_')}_${Date.now()}`;
          const validated = insertPuestoSchema.parse({
            nombrePuesto: puestoData.nombre,
            clavePuesto: clave,
            clienteId,
            empresaId,
            estatus: "activo",
          });
          const created = await storage.createPuesto(validated);
          createdPuestos.push(created);
        }
      }
      
      res.status(201).json({ created: createdPuestos.length, puestos: createdPuestos });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/puestos", async (req, res) => {
    try {
      const puestos = await storage.getPuestos();
      res.json(puestos);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/puestos/activos", async (req, res) => {
    try {
      const puestos = await storage.getPuestosActivos();
      res.json(puestos);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/puestos/:id", async (req, res) => {
    try {
      const puesto = await storage.getPuesto(req.params.id);
      if (!puesto) {
        return res.status(404).json({ message: "Puesto no encontrado" });
      }
      res.json(puesto);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/puestos/:id", async (req, res) => {
    try {
      const validated = updatePuestoSchema.parse(req.body);
      const puesto = await storage.updatePuesto(req.params.id, validated);
      res.json(puesto);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/puestos/:id", async (req, res) => {
    try {
      await storage.deletePuesto(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/puestos/:id/employees", async (req, res) => {
    try {
      const employees = await storage.getEmployeesByPuesto(req.params.id);
      res.json(employees);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/puestos/:id/employees/count", async (req, res) => {
    try {
      const count = await storage.getEmployeeCountByPuesto(req.params.id);
      res.json({ count });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/puestos/employees/counts", async (req, res) => {
    try {
      const counts = await storage.getAllEmployeeCountsByPuesto();
      res.json(counts);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ==================== RECLUTAMIENTO Y SELECCIÓN - VACANTES ====================
  
  app.post("/api/vacantes", async (req, res) => {
    try {
      const validated = insertVacanteSchema.parse(req.body);
      const vacante = await storage.createVacante(validated);
      res.status(201).json(vacante);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/vacantes", async (req, res) => {
    try {
      const vacantes = await storage.getVacantes();
      res.json(vacantes);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/vacantes/activas", async (req, res) => {
    try {
      const vacantes = await storage.getVacantesActivas();
      res.json(vacantes);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/vacantes/:id", async (req, res) => {
    try {
      const vacante = await storage.getVacante(req.params.id);
      if (!vacante) {
        return res.status(404).json({ message: "Vacante no encontrada" });
      }
      res.json(vacante);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/vacantes/:id", async (req, res) => {
    try {
      const validated = insertVacanteSchema.partial().parse(req.body);
      const vacante = await storage.updateVacante(req.params.id, validated);
      res.json(vacante);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/vacantes/:id", async (req, res) => {
    try {
      await storage.deleteVacante(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ==================== RECLUTAMIENTO Y SELECCIÓN - CANDIDATOS ====================
  
  app.post("/api/candidatos", async (req, res) => {
    try {
      const validated = insertCandidatoSchema.parse(req.body);
      const candidato = await storage.createCandidato(validated);
      res.status(201).json(candidato);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/candidatos", async (req, res) => {
    try {
      const candidatos = await storage.getCandidatos();
      res.json(candidatos);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/candidatos/activos", async (req, res) => {
    try {
      const candidatos = await storage.getCandidatosActivos();
      res.json(candidatos);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/candidatos/:id", async (req, res) => {
    try {
      const candidato = await storage.getCandidato(req.params.id);
      if (!candidato) {
        return res.status(404).json({ message: "Candidato no encontrado" });
      }
      res.json(candidato);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/candidatos/:id", async (req, res) => {
    try {
      const validated = insertCandidatoSchema.partial().parse(req.body);
      const candidato = await storage.updateCandidato(req.params.id, validated);
      res.json(candidato);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/candidatos/:id", async (req, res) => {
    try {
      await storage.deleteCandidato(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ==================== RECLUTAMIENTO Y SELECCIÓN - ETAPAS DE SELECCIÓN ====================
  
  app.post("/api/etapas-seleccion", async (req, res) => {
    try {
      const validated = insertEtapaSeleccionSchema.parse(req.body);
      const etapa = await storage.createEtapaSeleccion(validated);
      res.status(201).json(etapa);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/etapas-seleccion", async (req, res) => {
    try {
      const etapas = await storage.getEtapasSeleccion();
      res.json(etapas);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/etapas-seleccion/activas", async (req, res) => {
    try {
      const etapas = await storage.getEtapasSeleccionActivas();
      res.json(etapas);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/etapas-seleccion/:id", async (req, res) => {
    try {
      const etapa = await storage.getEtapaSeleccion(req.params.id);
      if (!etapa) {
        return res.status(404).json({ message: "Etapa no encontrada" });
      }
      res.json(etapa);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/etapas-seleccion/:id", async (req, res) => {
    try {
      const validated = insertEtapaSeleccionSchema.partial().parse(req.body);
      const etapa = await storage.updateEtapaSeleccion(req.params.id, validated);
      res.json(etapa);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/etapas-seleccion/:id", async (req, res) => {
    try {
      await storage.deleteEtapaSeleccion(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ==================== RECLUTAMIENTO Y SELECCIÓN - PROCESO DE SELECCIÓN ====================
  
  app.post("/api/proceso-seleccion", async (req, res) => {
    try {
      const validated = insertProcesoSeleccionSchema.parse(req.body);
      const proceso = await storage.createProcesoSeleccion(validated);
      res.status(201).json(proceso);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/proceso-seleccion", async (req, res) => {
    try {
      const procesos = await storage.getProcesosSeleccion();
      res.json(procesos);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/proceso-seleccion/vacante/:vacanteId", async (req, res) => {
    try {
      const procesos = await storage.getProcesosByVacante(req.params.vacanteId);
      res.json(procesos);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/proceso-seleccion/candidato/:candidatoId", async (req, res) => {
    try {
      const procesos = await storage.getProcesosByCandidato(req.params.candidatoId);
      res.json(procesos);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/proceso-seleccion/etapa/:etapaId", async (req, res) => {
    try {
      const procesos = await storage.getProcesosByEtapa(req.params.etapaId);
      res.json(procesos);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/proceso-seleccion/:id", async (req, res) => {
    try {
      const proceso = await storage.getProcesoSeleccion(req.params.id);
      if (!proceso) {
        return res.status(404).json({ message: "Proceso no encontrado" });
      }
      res.json(proceso);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/proceso-seleccion/:id", async (req, res) => {
    try {
      const validated = insertProcesoSeleccionSchema.partial().parse(req.body);
      const proceso = await storage.updateProcesoSeleccion(req.params.id, validated);
      res.json(proceso);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/proceso-seleccion/:id", async (req, res) => {
    try {
      await storage.deleteProcesoSeleccion(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ==================== RECLUTAMIENTO Y SELECCIÓN - ENTREVISTAS ====================
  
  app.post("/api/entrevistas", async (req, res) => {
    try {
      const validated = insertEntrevistaSchema.parse(req.body);
      const entrevista = await storage.createEntrevista(validated);
      res.status(201).json(entrevista);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/entrevistas", async (req, res) => {
    try {
      const entrevistas = await storage.getEntrevistas();
      res.json(entrevistas);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/entrevistas/proceso/:procesoId", async (req, res) => {
    try {
      const entrevistas = await storage.getEntrevistasByProceso(req.params.procesoId);
      res.json(entrevistas);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/entrevistas/:id", async (req, res) => {
    try {
      const entrevista = await storage.getEntrevista(req.params.id);
      if (!entrevista) {
        return res.status(404).json({ message: "Entrevista no encontrada" });
      }
      res.json(entrevista);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/entrevistas/:id", async (req, res) => {
    try {
      const validated = insertEntrevistaSchema.partial().parse(req.body);
      const entrevista = await storage.updateEntrevista(req.params.id, validated);
      res.json(entrevista);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/entrevistas/:id", async (req, res) => {
    try {
      await storage.deleteEntrevista(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ==================== RECLUTAMIENTO Y SELECCIÓN - EVALUACIONES ====================
  
  app.post("/api/evaluaciones", async (req, res) => {
    try {
      const validated = insertEvaluacionSchema.parse(req.body);
      const evaluacion = await storage.createEvaluacion(validated);
      res.status(201).json(evaluacion);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/evaluaciones", async (req, res) => {
    try {
      const evaluaciones = await storage.getEvaluaciones();
      res.json(evaluaciones);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/evaluaciones/proceso/:procesoId", async (req, res) => {
    try {
      const evaluaciones = await storage.getEvaluacionesByProceso(req.params.procesoId);
      res.json(evaluaciones);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/evaluaciones/:id", async (req, res) => {
    try {
      const evaluacion = await storage.getEvaluacion(req.params.id);
      if (!evaluacion) {
        return res.status(404).json({ message: "Evaluación no encontrada" });
      }
      res.json(evaluacion);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/evaluaciones/:id", async (req, res) => {
    try {
      const validated = insertEvaluacionSchema.partial().parse(req.body);
      const evaluacion = await storage.updateEvaluacion(req.params.id, validated);
      res.json(evaluacion);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/evaluaciones/:id", async (req, res) => {
    try {
      await storage.deleteEvaluacion(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ==================== RECLUTAMIENTO Y SELECCIÓN - OFERTAS ====================
  
  app.post("/api/ofertas", async (req, res) => {
    try {
      const validated = insertOfertaSchema.parse(req.body);
      const oferta = await storage.createOferta(validated);
      res.status(201).json(oferta);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/ofertas", async (req, res) => {
    try {
      const ofertas = await storage.getOfertas();
      res.json(ofertas);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/ofertas/vacante/:vacanteId", async (req, res) => {
    try {
      const ofertas = await storage.getOfertasByVacante(req.params.vacanteId);
      res.json(ofertas);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/ofertas/candidato/:candidatoId", async (req, res) => {
    try {
      const ofertas = await storage.getOfertasByCandidato(req.params.candidatoId);
      res.json(ofertas);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/ofertas/:id", async (req, res) => {
    try {
      const oferta = await storage.getOferta(req.params.id);
      if (!oferta) {
        return res.status(404).json({ message: "Oferta no encontrada" });
      }
      res.json(oferta);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/ofertas/:id", async (req, res) => {
    try {
      const validated = insertOfertaSchema.partial().parse(req.body);
      const oferta = await storage.updateOferta(req.params.id, validated);
      res.json(oferta);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/ofertas/:id", async (req, res) => {
    try {
      await storage.deleteOferta(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ==================== MÓDULO DE VACACIONES ====================

  // API Key middleware for MCP/omnichannel integrations
  const apiKeyAuth = async (req: Request, res: any, next: any) => {
    const apiKey = req.headers['x-api-key'] as string;
    if (apiKey) {
      const cliente = await storage.getClienteByApiKey(apiKey);
      if (cliente) {
        // Inject clienteId from API key lookup
        (req as any).user = {
          ...(req as any).user,
          clienteId: cliente.id,
          apiKeyAuth: true, // Flag to indicate API key authentication
        };
      }
    }
    next();
  };

  // Apply API key middleware to all vacation routes
  app.use("/api/vacaciones", apiKeyAuth);

  app.post("/api/vacaciones", async (req, res) => {
    try {
      // Auto-inject clienteId and empresaId from user session or API key
      const user = (req as any).user;
      if (!user?.clienteId) {
        return res.status(401).json({ message: "Usuario no autenticado o sin cliente asignado" });
      }
      
      // Get empresaId from user's assigned empresa or first available
      let empresaId = user.empresaId;
      if (!empresaId) {
        const empresas = await storage.getEmpresas(user.clienteId);
        if (empresas.length === 0) {
          return res.status(400).json({ message: "No hay empresas disponibles para este cliente" });
        }
        empresaId = empresas[0].id;
      }
      
      const dataWithTenant = {
        ...req.body,
        clienteId: user.clienteId,
        empresaId: empresaId,
      };
      
      const validated = insertSolicitudVacacionesSchema.parse(dataWithTenant);
      
      // Check for overlapping vacation requests
      const overlaps = await storage.checkVacacionesOverlap(
        validated.empleadoId,
        validated.fechaInicio,
        validated.fechaFin
      );
      
      if (overlaps.length > 0) {
        return res.status(409).json({ 
          message: "Ya existe una solicitud de vacaciones en este período",
          conflictos: overlaps
        });
      }
      
      const solicitud = await storage.createSolicitudVacaciones(validated);
      res.status(201).json(solicitud);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/vacaciones", async (req, res) => {
    try {
      const solicitudes = await storage.getSolicitudesVacaciones();
      res.json(solicitudes);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/vacaciones/pending-approvals", async (req, res) => {
    try {
      const pending = await storage.getPendingVacacionesApprovals();
      res.json(pending);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/vacaciones/balance/:empleadoId", async (req, res) => {
    try {
      const year = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear();
      const balance = await storage.getEmpleadoVacationBalance(req.params.empleadoId, year);
      res.json(balance);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/vacaciones/empleado/:empleadoId", async (req, res) => {
    try {
      const solicitudes = await storage.getSolicitudesVacacionesByEmpleado(req.params.empleadoId);
      res.json(solicitudes);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/vacaciones/:id", async (req, res) => {
    try {
      const solicitud = await storage.getSolicitudVacaciones(req.params.id);
      if (!solicitud) {
        return res.status(404).json({ message: "Solicitud de vacaciones no encontrada" });
      }
      res.json(solicitud);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/vacaciones/:id", async (req, res) => {
    try {
      // Step 1: Validate partial update
      const partialUpdate = updateSolicitudVacacionesSchema.parse(req.body);

      // Step 2: Load existing record
      const existing = await storage.getSolicitudVacaciones(req.params.id);
      if (!existing) {
        return res.status(404).json({ message: "Solicitud de vacaciones no encontrada" });
      }

      // Step 3: Merge partial update with existing record
      const merged = {
        ...existing,
        ...partialUpdate,
      };

      // Step 4: Re-validate the complete merged object with cross-field checks
      const fullyValidated = insertSolicitudVacacionesSchema.parse(merged);

      // Step 5: Check for overlaps if dates changed
      if (partialUpdate.fechaInicio || partialUpdate.fechaFin) {
        const overlaps = await storage.checkVacacionesOverlap(
          existing.empleadoId,
          fullyValidated.fechaInicio,
          fullyValidated.fechaFin,
          req.params.id
        );

        if (overlaps.length > 0) {
          return res.status(409).json({
            message: "Ya existe una solicitud de vacaciones en este período",
            conflictos: overlaps
          });
        }
      }

      // Step 6: Persist the validated update
      const solicitud = await storage.updateSolicitudVacaciones(req.params.id, partialUpdate);

      // Step 7: Auto-mark attendance as "vacaciones" when approved
      if (partialUpdate.estatus === "aprobada" && existing.estatus !== "aprobada") {
        try {
          const employee = await storage.getEmployee(existing.empleadoId);
          if (employee) {
            // Generate all dates between fechaInicio and fechaFin
            const startDate = new Date(existing.fechaInicio);
            const endDate = new Date(existing.fechaFin);

            for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
              const dateStr = d.toISOString().split('T')[0];

              // Check if attendance already exists for this date
              const existingAttendance = await storage.getAttendanceByEmpleadoAndDate(
                existing.empleadoId,
                dateStr
              );

              if (!existingAttendance) {
                // Create attendance record with status "vacaciones"
                await storage.createAttendance({
                  clienteId: existing.clienteId,
                  empresaId: existing.empresaId,
                  employeeId: existing.empleadoId,
                  date: dateStr,
                  status: "vacaciones",
                  notas: `Vacaciones aprobadas - Solicitud #${existing.id}`,
                });
              }
            }

            // Step 8: Create kardex disfrute entry and calculate prima vacacional
            try {
              const { registrarDisfruteVacaciones, calcularPrimaVacacional } = await import('./services/vacacionesService');
              const salarioDiario = parseFloat(employee.salarioDiarioReal || employee.sbc || '0');

              // Register the vacation consumption in kardex
              const resultado = await registrarDisfruteVacaciones(
                existing.empleadoId,
                existing.clienteId,
                existing.empresaId,
                existing.diasSolicitados,
                existing.fechaInicio,
                existing.fechaFin,
                existing.id,
                salarioDiario,
                partialUpdate.aprobadoPor
              );

              // Update solicitud with prima vacacional calculated
              if (resultado.primaVacacional) {
                await storage.updateSolicitudVacaciones(existing.id, {
                  primaVacacional: String(resultado.primaVacacional),
                });
              }

              console.log(`Kardex vacaciones actualizado para empleado ${existing.empleadoId}: -${existing.diasSolicitados} días, prima vacacional: $${resultado.primaVacacional || 0}`);
            } catch (kardexError) {
              // Log error but don't fail - vacation was approved, kardex can be fixed manually
              console.error("Error registrando disfrute en kardex:", kardexError);
            }
          }
        } catch (attendanceError) {
          // Log error but don't fail the request - vacation was approved
          console.error("Error creating attendance records for vacation:", attendanceError);
        }
      }

      res.json(solicitud);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/vacaciones/:id", async (req, res) => {
    try {
      await storage.deleteSolicitudVacaciones(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ==================== SERVICIO DE VACACIONES (Kardex, Caducidad, Saldos) ====================

  /**
   * Obtiene el detalle completo del saldo de vacaciones de un empleado
   * Incluye desglose por año de antigüedad y fechas de caducidad
   */
  app.get("/api/vacaciones/saldo/:empleadoId", async (req, res) => {
    try {
      const { calcularSaldoVacaciones } = await import('./services/vacacionesService');
      const detalle = await calcularSaldoVacaciones(req.params.empleadoId);
      res.json(detalle);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  /**
   * Sincroniza el saldo de vacaciones del kardex al cache del empleado
   */
  app.post("/api/vacaciones/sincronizar-saldo/:empleadoId", async (req, res) => {
    try {
      const { sincronizarSaldoVacacionesEmpleado } = await import('./services/vacacionesService');
      const nuevoSaldo = await sincronizarSaldoVacacionesEmpleado(req.params.empleadoId);
      res.json({ success: true, nuevoSaldo });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  /**
   * Sincroniza saldos de vacaciones para todos los empleados
   * Útil para corrección masiva o después de migración
   */
  app.post("/api/vacaciones/sincronizar-todos", async (req, res) => {
    try {
      const { sincronizarTodosSaldosVacaciones } = await import('./services/vacacionesService');
      const { clienteId, empresaId } = req.body;
      const resultado = await sincronizarTodosSaldosVacaciones(clienteId, empresaId);
      res.json(resultado);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  /**
   * Registra devengo de vacaciones por aniversario laboral
   */
  app.post("/api/vacaciones/devengo", async (req, res) => {
    try {
      const { registrarDevengoVacaciones } = await import('./services/vacacionesService');
      const { empleadoId, clienteId, empresaId, anioAntiguedad, diasVacaciones, fechaAniversario, createdBy } = req.body;

      if (!empleadoId || !clienteId || !empresaId || !anioAntiguedad) {
        return res.status(400).json({ message: "empleadoId, clienteId, empresaId y anioAntiguedad son requeridos" });
      }

      const resultado = await registrarDevengoVacaciones(
        empleadoId,
        clienteId,
        empresaId,
        anioAntiguedad,
        diasVacaciones,
        fechaAniversario ? new Date(fechaAniversario) : undefined,
        createdBy
      );

      if (!resultado.success) {
        return res.status(400).json({ message: resultado.mensaje });
      }

      res.json(resultado);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  /**
   * Procesa caducidad de vacaciones para un empleado específico
   */
  app.post("/api/vacaciones/caducidad/:empleadoId", async (req, res) => {
    try {
      const { procesarCaducidadEmpleado } = await import('./services/vacacionesService');
      const { fechaCorte } = req.body;
      const resultados = await procesarCaducidadEmpleado(
        req.params.empleadoId,
        fechaCorte ? new Date(fechaCorte) : undefined
      );
      res.json({
        empleadoId: req.params.empleadoId,
        diasCaducados: resultados.reduce((sum, r) => sum + r.diasCaducados, 0),
        detalles: resultados
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  /**
   * Proceso batch de caducidad de vacaciones
   * Diseñado para ejecutarse como cron job (diario o semanal)
   * Procesa todos los empleados activos y marca días vencidos
   */
  app.post("/api/vacaciones/caducidad-batch", async (req, res) => {
    try {
      const { procesarCaducidadMasiva } = await import('./services/vacacionesService');
      const { clienteId, empresaId, fechaCorte } = req.body;

      console.log(`[CADUCIDAD BATCH] Iniciando proceso de caducidad de vacaciones`);
      const resultado = await procesarCaducidadMasiva(
        clienteId,
        empresaId,
        fechaCorte ? new Date(fechaCorte) : undefined
      );

      console.log(`[CADUCIDAD BATCH] Completado: ${resultado.procesados} empleados procesados, ${resultado.empleadosAfectados.length} con días caducados`);

      res.json({
        success: true,
        ...resultado,
        resumen: {
          totalEmpleadosProcesados: resultado.procesados,
          totalEmpleadosConCaducidad: resultado.empleadosAfectados.length,
          totalDiasCaducados: resultado.empleadosAfectados.reduce((sum, e) => sum + e.diasCaducados, 0),
          errores: resultado.errores.length
        }
      });
    } catch (error: any) {
      console.error(`[CADUCIDAD BATCH] Error:`, error);
      res.status(500).json({ message: error.message });
    }
  });

  /**
   * Obtiene el saldo de vacaciones para finiquito
   * Retorna los días pendientes desglosados por año
   */
  app.get("/api/vacaciones/finiquito/:empleadoId", async (req, res) => {
    try {
      const { obtenerSaldoParaFiniquito } = await import('./services/vacacionesService');
      const saldo = await obtenerSaldoParaFiniquito(req.params.empleadoId);
      res.json(saldo);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ==================== MÓDULO DE INCAPACIDADES ====================
  
  app.post("/api/incapacidades", async (req, res) => {
    try {
      const validated = insertIncapacidadSchema.parse(req.body);

      // Check for overlapping incapacidades
      const overlaps = await storage.checkIncapacidadesOverlap(
        validated.empleadoId,
        validated.fechaInicio,
        validated.fechaFin
      );

      if (overlaps.length > 0) {
        return res.status(409).json({
          message: "Ya existe una incapacidad registrada en este período",
          conflictos: overlaps
        });
      }

      const incapacidad = await storage.createIncapacidad(validated);

      // Auto-mark attendance as "incapacidad" for all days in the period
      try {
        const startDate = new Date(validated.fechaInicio);
        const endDate = new Date(validated.fechaFin);

        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().split('T')[0];

          // Check if attendance already exists for this date
          const existingAttendance = await storage.getAttendanceByEmpleadoAndDate(
            validated.empleadoId,
            dateStr
          );

          if (!existingAttendance) {
            // Create attendance record with status "incapacidad"
            await storage.createAttendance({
              clienteId: validated.clienteId,
              empresaId: validated.empresaId,
              employeeId: validated.empleadoId,
              date: dateStr,
              status: "incapacidad",
              notas: `Incapacidad ${validated.tipo} - Folio: ${validated.numeroCertificado || 'Sin folio'}`,
            });
          }
        }
      } catch (attendanceError) {
        // Log error but don't fail the request - incapacidad was created
        console.error("Error creating attendance records for incapacidad:", attendanceError);
      }

      res.status(201).json(incapacidad);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/incapacidades", async (req, res) => {
    try {
      // TODO: Get actual user context from req.user and check isAdmin
      // For now, assume admin access - implement proper auth later
      const userId = req.query.userId as string || "";
      const isAdmin = true; // TODO: Get from req.user.isAdmin
      
      const incapacidades = await storage.getIncapacidadesScopedByUser(userId, isAdmin);
      res.json(incapacidades);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/incapacidades/secure/:id", async (req, res) => {
    try {
      // TODO: Get actual user context from req.user
      const userId = req.query.userId as string || "";
      const isAdmin = true; // TODO: Get from req.user.isAdmin
      
      const incapacidad = await storage.getIncapacidadSecure(req.params.id, userId, isAdmin);
      if (!incapacidad) {
        return res.status(404).json({ message: "Incapacidad no encontrada o acceso no autorizado" });
      }
      res.json(incapacidad);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/incapacidades/empleado/:empleadoId", async (req, res) => {
    try {
      const incapacidades = await storage.getIncapacidadesByEmpleado(req.params.empleadoId);
      res.json(incapacidades);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/incapacidades/:id", async (req, res) => {
    try {
      const incapacidad = await storage.getIncapacidad(req.params.id);
      if (!incapacidad) {
        return res.status(404).json({ message: "Incapacidad no encontrada" });
      }
      res.json(incapacidad);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/incapacidades/:id", async (req, res) => {
    try {
      // Step 1: Validate partial update
      const partialUpdate = updateIncapacidadSchema.parse(req.body);
      
      // Step 2: Load existing record
      const existing = await storage.getIncapacidad(req.params.id);
      if (!existing) {
        return res.status(404).json({ message: "Incapacidad no encontrada" });
      }
      
      // Step 3: Merge partial update with existing record
      const merged = {
        ...existing,
        ...partialUpdate,
      };
      
      // Step 4: Re-validate the complete merged object with cross-field checks
      const fullyValidated = insertIncapacidadSchema.parse(merged);
      
      // Step 5: Check for overlaps if dates changed
      if (partialUpdate.fechaInicio || partialUpdate.fechaFin) {
        const overlaps = await storage.checkIncapacidadesOverlap(
          existing.empleadoId,
          fullyValidated.fechaInicio,
          fullyValidated.fechaFin,
          req.params.id
        );
        
        if (overlaps.length > 0) {
          return res.status(409).json({ 
            message: "Ya existe una incapacidad registrada en este período",
            conflictos: overlaps
          });
        }
      }
      
      // Step 6: Persist the validated update
      const incapacidad = await storage.updateIncapacidad(req.params.id, partialUpdate);
      res.json(incapacidad);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/incapacidades/:id", async (req, res) => {
    try {
      await storage.deleteIncapacidad(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get incapacidades pending verification (for admin review)
  app.get("/api/incapacidades/pendientes-verificacion", async (req, res) => {
    try {
      const pendientes = await storage.getIncapacidadesPendientesVerificacion();
      res.json(pendientes);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Verify incapacidad (admin action)
  app.post("/api/incapacidades/:id/verificar", async (req, res) => {
    try {
      const { id } = req.params;
      const verificadoPor = req.body.verificadoPor || "admin"; // TODO: Get from session

      // Get the incapacidad first
      const incapacidad = await storage.getIncapacidad(id);
      if (!incapacidad) {
        return res.status(404).json({ message: "Incapacidad no encontrada" });
      }

      if (incapacidad.verificado) {
        return res.status(400).json({ message: "Esta incapacidad ya fue verificada" });
      }

      // Verify the incapacidad
      const updated = await storage.verificarIncapacidad(id, verificadoPor);

      // Create attendance records for all days in the period
      try {
        const startDate = new Date(incapacidad.fechaInicio);
        const endDate = new Date(incapacidad.fechaFin);

        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().split('T')[0];

          const existingAttendance = await storage.getAttendanceByEmpleadoAndDate(
            incapacidad.empleadoId,
            dateStr
          );

          if (!existingAttendance) {
            await storage.createAttendance({
              clienteId: incapacidad.clienteId,
              empresaId: incapacidad.empresaId,
              employeeId: incapacidad.empleadoId,
              date: dateStr,
              status: "incapacidad",
              notas: `Incapacidad ${incapacidad.tipo} - Folio: ${incapacidad.numeroCertificado || 'Sin folio'}`,
            });
          }
        }
      } catch (attendanceError) {
        console.error("Error creating attendance records for incapacidad:", attendanceError);
      }

      res.json({ ...updated, message: "Incapacidad verificada correctamente" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Reject incapacidad and convert to falta (admin action)
  app.post("/api/incapacidades/:id/rechazar", async (req, res) => {
    try {
      const { id } = req.params;
      const { motivo, tipoFalta } = req.body; // tipoFalta: "justificada" | "injustificada"

      if (!motivo) {
        return res.status(400).json({ message: "El motivo de rechazo es requerido" });
      }

      if (!tipoFalta || !["justificada", "injustificada"].includes(tipoFalta)) {
        return res.status(400).json({ message: "Tipo de falta inválido. Debe ser 'justificada' o 'injustificada'" });
      }

      // Get the incapacidad first
      const incapacidad = await storage.getIncapacidad(id);
      if (!incapacidad) {
        return res.status(404).json({ message: "Incapacidad no encontrada" });
      }

      if (incapacidad.verificado) {
        return res.status(400).json({ message: "No se puede rechazar una incapacidad ya verificada" });
      }

      // Create attendance records as falta
      try {
        const startDate = new Date(incapacidad.fechaInicio);
        const endDate = new Date(incapacidad.fechaFin);
        const attendanceStatus = tipoFalta === "justificada" ? "falta_justificada" : "falta";

        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().split('T')[0];

          const existingAttendance = await storage.getAttendanceByEmpleadoAndDate(
            incapacidad.empleadoId,
            dateStr
          );

          if (!existingAttendance) {
            await storage.createAttendance({
              clienteId: incapacidad.clienteId,
              empresaId: incapacidad.empresaId,
              employeeId: incapacidad.empleadoId,
              date: dateStr,
              status: attendanceStatus,
              notas: `Incapacidad rechazada: ${motivo}`,
            });
          }
        }
      } catch (attendanceError) {
        console.error("Error creating attendance records for rejected incapacidad:", attendanceError);
      }

      // Mark incapacidad as rejected
      const updated = await storage.rechazarIncapacidad(id, motivo);

      res.json({
        ...updated,
        message: `Incapacidad rechazada. Días marcados como falta ${tipoFalta}.`
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ==================== MÓDULO DE PERMISOS ====================
  
  app.post("/api/permisos", async (req, res) => {
    try {
      const validated = insertSolicitudPermisoSchema.parse(req.body);
      
      // Check for overlapping permisos
      const overlaps = await storage.checkPermisosOverlap(
        validated.empleadoId,
        validated.fechaInicio,
        validated.fechaFin
      );
      
      if (overlaps.length > 0) {
        return res.status(409).json({ 
          message: "Ya existe una solicitud de permiso en este período",
          conflictos: overlaps
        });
      }
      
      const solicitud = await storage.createSolicitudPermiso(validated);
      res.status(201).json(solicitud);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/permisos", async (req, res) => {
    try {
      const solicitudes = await storage.getSolicitudesPermisos();
      res.json(solicitudes);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/permisos/pending-approvals", async (req, res) => {
    try {
      const pending = await storage.getPendingPermisosApprovals();
      res.json(pending);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/permisos/empleado/:empleadoId", async (req, res) => {
    try {
      const solicitudes = await storage.getSolicitudesPermisosByEmpleado(req.params.empleadoId);
      res.json(solicitudes);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/permisos/:id", async (req, res) => {
    try {
      const solicitud = await storage.getSolicitudPermiso(req.params.id);
      if (!solicitud) {
        return res.status(404).json({ message: "Solicitud de permiso no encontrada" });
      }
      res.json(solicitud);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/permisos/:id", async (req, res) => {
    try {
      // Step 1: Validate partial update
      const partialUpdate = updateSolicitudPermisoSchema.parse(req.body);
      
      // Step 2: Load existing record
      const existing = await storage.getSolicitudPermiso(req.params.id);
      if (!existing) {
        return res.status(404).json({ message: "Solicitud de permiso no encontrada" });
      }
      
      // Step 3: Merge partial update with existing record
      const merged = {
        ...existing,
        ...partialUpdate,
      };
      
      // Step 4: Re-validate the complete merged object with cross-field checks
      const fullyValidated = insertSolicitudPermisoSchema.parse(merged);
      
      // Step 5: Check for overlaps if dates changed
      if (partialUpdate.fechaInicio || partialUpdate.fechaFin) {
        const overlaps = await storage.checkPermisosOverlap(
          existing.empleadoId,
          fullyValidated.fechaInicio,
          fullyValidated.fechaFin,
          req.params.id
        );
        
        if (overlaps.length > 0) {
          return res.status(409).json({ 
            message: "Ya existe una solicitud de permiso en este período",
            conflictos: overlaps
          });
        }
      }
      
      // Step 6: Persist the validated update
      const solicitud = await storage.updateSolicitudPermiso(req.params.id, partialUpdate);
      res.json(solicitud);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/permisos/:id", async (req, res) => {
    try {
      await storage.deleteSolicitudPermiso(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ==================== MÓDULO DE ACTAS ADMINISTRATIVAS ====================
  
  app.post("/api/actas-administrativas", async (req, res) => {
    try {
      const validated = insertActaAdministrativaSchema.parse(req.body);
      const acta = await storage.createActaAdministrativa(validated);
      res.status(201).json(acta);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/actas-administrativas", async (req, res) => {
    try {
      const actas = await storage.getActasAdministrativas();
      res.json(actas);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/actas-administrativas/empleado/:empleadoId", async (req, res) => {
    try {
      const actas = await storage.getActasAdministrativasByEmpleado(req.params.empleadoId);
      res.json(actas);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/actas-administrativas/estatus/:estatus", async (req, res) => {
    try {
      const actas = await storage.getActasAdministrativasByEstatus(req.params.estatus);
      res.json(actas);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/actas-administrativas/:id", async (req, res) => {
    try {
      const acta = await storage.getActaAdministrativa(req.params.id);
      if (!acta) {
        return res.status(404).json({ message: "Acta administrativa no encontrada" });
      }
      res.json(acta);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/actas-administrativas/:id", async (req, res) => {
    try {
      // Step 1: Validate partial update
      const partialUpdate = updateActaAdministrativaSchema.parse(req.body);
      
      // Step 2: Load existing record
      const existing = await storage.getActaAdministrativa(req.params.id);
      if (!existing) {
        return res.status(404).json({ message: "Acta administrativa no encontrada" });
      }
      
      // Step 3: Merge partial update with existing record
      const merged = {
        ...existing,
        ...partialUpdate,
      };
      
      // Step 4: Re-validate the complete merged object with cross-field checks
      const fullyValidated = insertActaAdministrativaSchema.parse(merged);
      
      // Step 5: Persist the validated update
      const acta = await storage.updateActaAdministrativa(req.params.id, partialUpdate);
      res.json(acta);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/actas-administrativas/:id", async (req, res) => {
    try {
      await storage.deleteActaAdministrativa(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ==================== HELPER ENDPOINT - INICIALIZAR ETAPAS DE SELECCIÓN ====================
  
  app.post("/api/etapas-seleccion/inicializar", async (req, res) => {
    try {
      const { clienteId, empresaId } = req.body;
      
      if (!clienteId || !empresaId) {
        return res.status(400).json({ message: "clienteId y empresaId son requeridos" });
      }
      
      const etapasExistentes = await storage.getEtapasSeleccion();
      
      // Si ya existen etapas, no hacer nada
      if (etapasExistentes.length > 0) {
        return res.json({ 
          message: "Las etapas de selección ya están inicializadas",
          etapas: etapasExistentes 
        });
      }

      // Crear etapas predeterminadas
      const etapasPredeterminadas = [
        {
          nombre: "Nueva aplicación",
          descripcion: "Candidato recién aplicado a la vacante",
          orden: 1,
          color: "#6366f1",
          esEtapaFinal: false,
          esPositiva: true,
          activa: true,
        },
        {
          nombre: "Revisión de CV",
          descripcion: "Revisión inicial del curriculum vitae",
          orden: 2,
          color: "#8b5cf6",
          esEtapaFinal: false,
          esPositiva: true,
          activa: true,
        },
        {
          nombre: "Entrevista RH",
          descripcion: "Entrevista con recursos humanos",
          orden: 3,
          color: "#3b82f6",
          esEtapaFinal: false,
          esPositiva: true,
          activa: true,
        },
        {
          nombre: "Entrevista Técnica",
          descripcion: "Evaluación técnica con el área solicitante",
          orden: 4,
          color: "#06b6d4",
          esEtapaFinal: false,
          esPositiva: true,
          activa: true,
        },
        {
          nombre: "Evaluación Final",
          descripcion: "Evaluación con gerencia o dirección",
          orden: 5,
          color: "#10b981",
          esEtapaFinal: false,
          esPositiva: true,
          activa: true,
        },
        {
          nombre: "Oferta Laboral",
          descripcion: "Generación y envío de oferta laboral",
          orden: 6,
          color: "#14b8a6",
          esEtapaFinal: false,
          esPositiva: true,
          activa: true,
        },
        {
          nombre: "Contratado",
          descripcion: "Candidato contratado exitosamente",
          orden: 7,
          color: "#22c55e",
          esEtapaFinal: true,
          esPositiva: true,
          activa: true,
        },
        {
          nombre: "Descartado",
          descripcion: "Candidato descartado del proceso",
          orden: 8,
          color: "#ef4444",
          esEtapaFinal: true,
          esPositiva: false,
          activa: true,
        },
      ];

      const etapasCreadas = [];
      for (const etapa of etapasPredeterminadas) {
        const created = await storage.createEtapaSeleccion({
          ...etapa,
          clienteId,
          empresaId
        });
        etapasCreadas.push(created);
      }

      res.status(201).json({
        message: "Etapas de selección inicializadas exitosamente",
        etapas: etapasCreadas
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ==================== SISTEMA - CLIENTES ====================
  
  app.post("/api/clientes", async (req, res) => {
    try {
      const validated = insertClienteSchema.parse(req.body);
      const cliente = await storage.createCliente(validated);
      res.status(201).json(cliente);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/clientes", async (req, res) => {
    try {
      const clientes = await storage.getClientes();
      res.json(clientes);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/clientes/activos", async (req, res) => {
    try {
      const clientes = await storage.getClientesActivos();
      res.json(clientes);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/clientes/:id", async (req, res) => {
    try {
      const cliente = await storage.getCliente(req.params.id);
      if (!cliente) {
        return res.status(404).json({ message: "Cliente no encontrado" });
      }
      res.json(cliente);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/clientes/:id", async (req, res) => {
    try {
      const validated = insertClienteSchema.partial().parse(req.body);
      const cliente = await storage.updateCliente(req.params.id, validated);
      res.json(cliente);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/clientes/:id", async (req, res) => {
    try {
      await storage.deleteCliente(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ==================== ESQUEMAS DE VACACIONES - ASIGNACIÓN ====================

  // Assign vacation scheme to Cliente
  app.patch("/api/clientes/:id/esquema-prestaciones", async (req, res) => {
    try {
      const { esquemaPrestacionesId } = req.body;

      // Validate scheme exists if provided
      if (esquemaPrestacionesId) {
        const esquema = await storage.getEsquemaPresta(esquemaPrestacionesId);
        if (!esquema) {
          return res.status(404).json({ message: "Esquema de prestaciones no encontrado" });
        }
      }

      const updated = await storage.updateCliente(req.params.id, {
        esquemaPrestacionesId: esquemaPrestacionesId || null
      });
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Assign vacation scheme to Empresa
  app.patch("/api/empresas/:id/esquema-prestaciones", async (req, res) => {
    try {
      const { esquemaPrestacionesId } = req.body;

      // Validate scheme exists if provided
      if (esquemaPrestacionesId) {
        const esquema = await storage.getEsquemaPresta(esquemaPrestacionesId);
        if (!esquema) {
          return res.status(404).json({ message: "Esquema de prestaciones no encontrado" });
        }
      }

      const updated = await storage.updateEmpresa(req.params.id, {
        esquemaPrestacionesId: esquemaPrestacionesId || null
      });
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Diagnostic endpoint: show effective vacation scheme for employee
  app.get("/api/employees/:id/vacation-scheme", async (req, res) => {
    try {
      const employee = await storage.getEmployee(req.params.id);
      if (!employee) {
        return res.status(404).json({ message: "Empleado no encontrado" });
      }

      if (!employee.fechaIngreso) {
        return res.status(400).json({ message: "Empleado sin fecha de ingreso" });
      }

      const fechaIngreso = new Date(employee.fechaIngreso);
      const aniosAntiguedad = Math.floor(
        (Date.now() - fechaIngreso.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
      );

      const resolution = await storage.resolveVacationDays(req.params.id, aniosAntiguedad);

      res.json({
        empleadoId: req.params.id,
        empleadoNombre: employee.nombre,
        aniosAntiguedad,
        diasVacaciones: resolution.diasVacaciones,
        esquema: resolution.esquema,
        fuente: resolution.fuente,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ==================== SISTEMA - MÓDULOS ====================
  
  app.get("/api/modulos", async (req, res) => {
    try {
      const modulos = await storage.getModulos();
      res.json(modulos);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/modulos/activos", async (req, res) => {
    try {
      const modulos = await storage.getModulosActivos();
      res.json(modulos);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/modulos/:id", async (req, res) => {
    try {
      const modulo = await storage.getModulo(req.params.id);
      if (!modulo) {
        return res.status(404).json({ message: "Módulo no encontrado" });
      }
      res.json(modulo);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ==================== SISTEMA - PERMISOS DE USUARIOS ====================
  
  app.post("/api/usuarios-permisos", async (req, res) => {
    try {
      const validated = insertUsuarioPermisoSchema.parse(req.body);
      const permiso = await storage.createUsuarioPermiso(validated);
      res.status(201).json(permiso);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/usuarios-permisos", async (req, res) => {
    try {
      const { usuarioId } = req.query;
      
      if (usuarioId) {
        const permisos = await storage.getPermisosByUsuario(usuarioId as string);
        return res.json(permisos);
      }
      
      const permisos = await storage.getUsuariosPermisos();
      res.json(permisos);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/usuarios-permisos/:id", async (req, res) => {
    try {
      const permiso = await storage.getUsuarioPermiso(req.params.id);
      if (!permiso) {
        return res.status(404).json({ message: "Permiso no encontrado" });
      }
      res.json(permiso);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/usuarios-permisos/:id", async (req, res) => {
    try {
      await storage.deleteUsuarioPermiso(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ==================== USER AUTHENTICATION ====================
  
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ message: "Usuario y contraseña son requeridos" });
      }

      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        return res.status(401).json({ message: "Credenciales inválidas" });
      }

      if (!user.activo) {
        return res.status(403).json({ message: "Usuario desactivado. Contacte al administrador." });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Credenciales inválidas" });
      }

      // Store user in session
      req.session.user = {
        id: user.id,
        username: user.username,
        nombre: user.nombre,
        email: user.email,
        tipoUsuario: user.tipoUsuario,
        clienteId: user.clienteId,
        role: user.role,
        isSuperAdmin: user.isSuperAdmin,
      };

      const { password: _, ...publicUser } = user;
      res.json({ 
        success: true, 
        user: publicUser,
        message: "Login exitoso" 
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session?.user) {
      return res.status(401).json({ message: "No autenticado" });
    }
    
    try {
      const user = await storage.getUser(req.session.user.id);
      if (!user) {
        return res.status(401).json({ message: "Usuario no encontrado" });
      }
      const { password: _, ...publicUser } = user;
      res.json({ user: publicUser });
    } catch (error: any) {
      res.status(401).json({ message: "Sesión inválida" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Error al cerrar sesión" });
      }
      res.clearCookie('connect.sid');
      res.json({ success: true, message: "Sesión cerrada" });
    });
  });

  // ==================== SUPER ADMIN - AUTHENTICATION ====================
  
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ message: "Username y password son requeridos" });
      }

      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        return res.status(401).json({ message: "Credenciales inválidas" });
      }

      if (!user.isSuperAdmin) {
        return res.status(403).json({ message: "Acceso denegado. Solo super administradores pueden acceder." });
      }

      if (!user.activo) {
        return res.status(403).json({ message: "Usuario desactivado. Contacte al administrador." });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Credenciales inválidas" });
      }

      // Store super admin user in session
      req.session.user = {
        id: user.id,
        username: user.username,
        nombre: user.nombre,
        email: user.email,
        tipoUsuario: user.tipoUsuario,
        clienteId: user.clienteId,
        isSuperAdmin: true,
      };

      const { password: _, ...publicUser } = user;
      res.json({ 
        success: true, 
        user: publicUser,
        message: "Login exitoso" 
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ==================== SUPER ADMIN - USER MANAGEMENT ====================
  
  app.get("/api/admin/users", requireSuperAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/users", requireSuperAdmin, async (req, res) => {
    try {
      const validated = insertUserSchema.parse(req.body);
      
      // Check username uniqueness
      const existingUser = await storage.getUserByUsername(validated.username);
      if (existingUser) {
        return res.status(400).json({ message: "El nombre de usuario ya existe" });
      }

      // Only super admins can create other super admins
      if (validated.isSuperAdmin && !req.user!.isSuperAdmin) {
        return res.status(403).json({ message: "Solo super administradores pueden crear otros super administradores" });
      }
      
      // Hash password with bcrypt (cost factor 12 per architect recommendation)
      const hashedPassword = await bcrypt.hash(validated.password, 12);
      
      const newUser = await storage.createUser({
        ...validated,
        password: hashedPassword
      });
      
      // Create audit log
      await storage.createAdminAuditLog({
        adminUserId: req.user!.id,
        adminUsername: req.user!.username,
        action: 'create_user',
        resourceType: 'user',
        resourceId: newUser.id,
        newValue: { 
          username: newUser.username, 
          tipoUsuario: newUser.tipoUsuario,
          isSuperAdmin: newUser.isSuperAdmin 
        },
        targetClienteId: newUser.clienteId || null,
        targetEmpresaId: null,
        targetCentroTrabajoId: null
      });
      
      // Return public user (without password)
      const { password, ...publicUser } = newUser;
      res.status(201).json(publicUser);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/admin/users/:id", requireSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      
      // Validate only safe fields can be updated
      const validated = updateUserSchema.parse(req.body);

      // Only super admins can elevate users to super admin
      if (validated.isSuperAdmin && !req.user!.isSuperAdmin) {
        return res.status(403).json({ message: "Solo super administradores pueden elevar otros usuarios a super administrador" });
      }
      
      // Get current user state for audit log
      const currentUser = await storage.getUser(id);
      if (!currentUser) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }

      // Update user (storage layer validates at runtime)
      const updatedUser = await storage.updateUser(id, validated);
      
      // Create audit log with before/after snapshot
      await storage.createAdminAuditLog({
        adminUserId: req.user!.id,
        adminUsername: req.user!.username,
        action: 'update_user',
        resourceType: 'user',
        resourceId: id,
        previousValue: {
          nombre: currentUser.nombre,
          email: currentUser.email,
          tipoUsuario: currentUser.tipoUsuario,
          clienteId: currentUser.clienteId,
          activo: currentUser.activo,
          isSuperAdmin: currentUser.isSuperAdmin
        },
        newValue: validated,
        targetClienteId: updatedUser.clienteId || null,
        targetEmpresaId: null,
        targetCentroTrabajoId: null
      });
      
      // Return public user
      const { password, ...publicUser } = updatedUser;
      res.json(publicUser);
    } catch (error: any) {
      if (error.message?.includes("no existe")) {
        return res.status(404).json({ message: error.message });
      }
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/admin/users/:id", requireSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      
      // Get user info for audit log before deletion
      const targetUser = await storage.getUser(id);
      if (!targetUser) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }

      // Delete user (storage layer prevents self-deletion)
      await storage.deleteUser(id, req.user!.id);
      
      // Create audit log after successful deletion
      await storage.createAdminAuditLog({
        adminUserId: req.user!.id,
        adminUsername: req.user!.username,
        action: 'delete_user',
        resourceType: 'user',
        resourceId: id,
        previousValue: { 
          username: targetUser.username,
          tipoUsuario: targetUser.tipoUsuario,
          isSuperAdmin: targetUser.isSuperAdmin
        },
        targetClienteId: targetUser.clienteId || null,
        targetEmpresaId: null,
        targetCentroTrabajoId: null
      });
      
      res.json({ success: true, message: "Usuario eliminado correctamente" });
    } catch (error: any) {
      if (error.message?.includes("no existe")) {
        return res.status(404).json({ message: error.message });
      }
      if (error.message?.includes("auto-eliminación")) {
        return res.status(403).json({ message: error.message });
      }
      if (error.message?.includes("tiene permisos asignados") || error.message?.includes("violates foreign key")) {
        return res.status(409).json({ message: "No se puede eliminar el usuario porque tiene permisos asignados. Elimine los permisos primero." });
      }
      res.status(500).json({ message: error.message });
    }
  });

  // ==================== CLIENTE ADMIN - USER MANAGEMENT ====================
  // These endpoints allow cliente_admin users to manage users within their own client account

  app.get("/api/usuarios", requireClienteAdmin, async (req, res) => {
    try {
      const clienteId = req.user!.clienteId!;
      const users = await storage.getUsersByClienteId(clienteId);
      res.json(users);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/usuarios", requireClienteAdmin, async (req, res) => {
    try {
      const clienteId = req.user!.clienteId!;
      const actingUserRole = req.user!.role;
      const validated = insertUserSchema.parse(req.body);

      // Force tipoUsuario to 'cliente' and clienteId to user's cliente
      validated.tipoUsuario = 'cliente';
      validated.clienteId = clienteId;

      // Prevent creating super admins
      if (validated.isSuperAdmin) {
        return res.status(403).json({ message: "No puede crear usuarios super administrador" });
      }

      // Role hierarchy enforcement:
      // - cliente_master can create any role (user, cliente_admin)
      // - cliente_admin can only create 'user' role
      // - No one can create cliente_master (only super admin can do that)
      if (validated.role === 'cliente_master') {
        return res.status(403).json({ message: "No puede crear usuarios con rol de Administrador Principal" });
      }
      if (validated.role === 'cliente_admin' && actingUserRole !== 'cliente_master') {
        return res.status(403).json({ message: "Solo el Administrador Principal puede crear otros administradores" });
      }

      // Check username uniqueness
      const existingUser = await storage.getUserByUsername(validated.username);
      if (existingUser) {
        return res.status(400).json({ message: "El nombre de usuario ya existe" });
      }

      // Hash password with bcrypt (cost factor 12)
      const hashedPassword = await bcrypt.hash(validated.password, 12);

      const newUser = await storage.createUser({
        ...validated,
        password: hashedPassword,
        isSuperAdmin: false, // Ensure cannot create super admins
      });

      // Create audit log
      await storage.createAdminAuditLog({
        adminUserId: req.user!.id,
        adminUsername: req.user!.username,
        action: 'create_user',
        resourceType: 'user',
        resourceId: newUser.id,
        newValue: {
          username: newUser.username,
          tipoUsuario: newUser.tipoUsuario,
          role: newUser.role,
        },
        targetClienteId: clienteId,
        targetEmpresaId: null,
        targetCentroTrabajoId: null,
      });

      // Return public user (without password)
      const { password, ...publicUser } = newUser;
      res.status(201).json(publicUser);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/usuarios/:id", requireClienteAdmin, async (req, res) => {
    try {
      console.log("PATCH /api/usuarios/:id - req.body:", JSON.stringify(req.body));
      const { id } = req.params;
      const clienteId = req.user!.clienteId!;
      const actingUserRole = req.user!.role;

      // Get user and verify they belong to this client
      const targetUser = await storage.getUser(id);
      if (!targetUser) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }

      if (targetUser.clienteId !== clienteId) {
        return res.status(403).json({ message: "No tiene permisos para modificar este usuario" });
      }

      // Ensure req.body is an object
      if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({ message: "Datos de actualización inválidos" });
      }

      // Validate only safe fields can be updated
      const validated = updateUserSchema.parse(req.body);

      // Prevent setting isSuperAdmin
      if (validated.isSuperAdmin) {
        return res.status(403).json({ message: "No puede elevar usuarios a super administrador" });
      }

      // Role hierarchy enforcement for editing:
      // - cliente_master can edit anyone (except changing to cliente_master)
      // - cliente_admin can only edit 'user' role users
      if (targetUser.role === 'cliente_master' && actingUserRole !== 'cliente_master') {
        return res.status(403).json({ message: "No tiene permisos para modificar al Administrador Principal" });
      }
      if (targetUser.role === 'cliente_admin' && actingUserRole !== 'cliente_master') {
        return res.status(403).json({ message: "Solo el Administrador Principal puede modificar otros administradores" });
      }
      if (validated.role === 'cliente_master') {
        return res.status(403).json({ message: "No puede asignar el rol de Administrador Principal" });
      }
      if (validated.role === 'cliente_admin' && actingUserRole !== 'cliente_master') {
        return res.status(403).json({ message: "Solo el Administrador Principal puede asignar el rol de administrador" });
      }

      // If user is modifying their own account, prevent role change (lock-out prevention)
      if (id === req.user!.id && validated.role && validated.role !== req.user!.role) {
        return res.status(403).json({ message: "No puede cambiar su propio rol" });
      }

      const updatedUser = await storage.updateUser(id, validated);

      // Create audit log
      await storage.createAdminAuditLog({
        adminUserId: req.user!.id,
        adminUsername: req.user!.username,
        action: 'update_user',
        resourceType: 'user',
        resourceId: id,
        previousValue: {
          nombre: targetUser.nombre ?? null,
          email: targetUser.email ?? null,
          role: targetUser.role ?? null,
          activo: targetUser.activo ?? null,
        },
        newValue: validated ? { ...validated } : {},
        targetClienteId: clienteId,
        targetEmpresaId: null,
        targetCentroTrabajoId: null,
      });

      const { password, ...publicUser } = updatedUser;
      res.json(publicUser);
    } catch (error: any) {
      console.error("PATCH /api/usuarios/:id - ERROR:", error);
      console.error("Stack trace:", error.stack);
      if (error.message?.includes("no encontrado")) {
        return res.status(404).json({ message: error.message });
      }
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/usuarios/:id", requireClienteAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const clienteId = req.user!.clienteId!;
      const actingUserRole = req.user!.role;

      // Prevent self-deletion
      if (id === req.user!.id) {
        return res.status(403).json({ message: "No puede eliminar su propia cuenta" });
      }

      // Get user and verify they belong to this client
      const targetUser = await storage.getUser(id);
      if (!targetUser) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }

      if (targetUser.clienteId !== clienteId) {
        return res.status(403).json({ message: "No tiene permisos para eliminar este usuario" });
      }

      // Role hierarchy enforcement for deletion:
      // - cliente_master cannot be deleted (only deactivated or deleted by super admin)
      // - cliente_admin can only be deleted by cliente_master
      // - user can be deleted by cliente_admin or cliente_master
      if (targetUser.role === 'cliente_master') {
        return res.status(403).json({ message: "No se puede eliminar al Administrador Principal" });
      }
      if (targetUser.role === 'cliente_admin' && actingUserRole !== 'cliente_master') {
        return res.status(403).json({ message: "Solo el Administrador Principal puede eliminar otros administradores" });
      }

      // Delete user
      await storage.deleteUser(id, req.user!.id);

      // Create audit log
      await storage.createAdminAuditLog({
        adminUserId: req.user!.id,
        adminUsername: req.user!.username,
        action: 'delete_user',
        resourceType: 'user',
        resourceId: id,
        previousValue: {
          username: targetUser.username,
          tipoUsuario: targetUser.tipoUsuario,
          role: targetUser.role,
        },
        targetClienteId: clienteId,
        targetEmpresaId: null,
        targetCentroTrabajoId: null,
      });

      res.json({ success: true, message: "Usuario eliminado correctamente" });
    } catch (error: any) {
      if (error.message?.includes("no encontrado")) {
        return res.status(404).json({ message: error.message });
      }
      if (error.message?.includes("tiene registros asociados") || error.message?.includes("violates foreign key")) {
        return res.status(409).json({ message: "No se puede eliminar el usuario porque tiene permisos asignados. Elimine los permisos primero." });
      }
      res.status(500).json({ message: error.message });
    }
  });

  // ==================== SUPERVISOR-CENTRO ASSIGNMENTS ====================
  // These endpoints manage which centros de trabajo a supervisor user can manage

  // Get centros assigned to a user (for supervisor role)
  app.get("/api/usuarios/:id/centros", requireClienteAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const clienteId = req.user!.clienteId!;

      // Verify the target user belongs to this client
      const targetUser = await storage.getUser(id);
      if (!targetUser) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }
      if (targetUser.clienteId !== clienteId) {
        return res.status(403).json({ message: "No tiene permisos para ver este usuario" });
      }

      // Get assigned centros
      const centros = await storage.getSupervisorCentros(id);
      res.json(centros);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Set centros for a supervisor user (replace all assignments)
  app.post("/api/usuarios/:id/centros", requireClienteAdmin, async (req, res) => {
    try {
      console.log("POST /api/usuarios/:id/centros - START");
      console.log("req.body:", JSON.stringify(req.body));
      console.log("req.params:", JSON.stringify(req.params));

      const { id } = req.params;
      const { centroIds } = req.body as { centroIds: string[] };
      const clienteId = req.user!.clienteId!;
      console.log("clienteId:", clienteId);

      if (!Array.isArray(centroIds)) {
        console.log("centroIds is not an array");
        return res.status(400).json({ message: "centroIds debe ser un arreglo" });
      }
      console.log("centroIds:", centroIds);

      // Verify the target user belongs to this client
      console.log("Getting target user...");
      const targetUser = await storage.getUser(id);
      if (!targetUser) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }
      console.log("targetUser found:", targetUser.id);

      if (targetUser.clienteId !== clienteId) {
        return res.status(403).json({ message: "No tiene permisos para modificar este usuario" });
      }

      // Verify all centros belong to this client
      if (centroIds.length > 0) {
        console.log("Getting centros for client...");
        const allCentros = await storage.getCentrosTrabajoByCliente(clienteId);
        console.log("allCentros count:", allCentros.length);
        const validCentroIds = new Set(allCentros.map(c => c.id));
        const invalidCentros = centroIds.filter(cid => !validCentroIds.has(cid));
        if (invalidCentros.length > 0) {
          return res.status(400).json({ message: "Algunos centros de trabajo no pertenecen a este cliente" });
        }
      }

      // Set the supervisor's centro assignments
      console.log("Setting supervisor centros...");
      await storage.setSupervisorCentros(id, centroIds);
      console.log("Supervisor centros set successfully");

      // Create audit log
      console.log("Creating audit log...");
      await storage.createAdminAuditLog({
        adminUserId: req.user!.id,
        adminUsername: req.user!.username,
        action: 'set_supervisor_centros',
        resourceType: 'user',
        resourceId: id,
        newValue: { centroIds },
        targetClienteId: clienteId,
        targetEmpresaId: null,
        targetCentroTrabajoId: null,
      });
      console.log("Audit log created");

      res.json({ success: true, message: "Centros de trabajo asignados correctamente" });
    } catch (error: any) {
      console.error("POST /api/usuarios/:id/centros - ERROR:", error);
      console.error("Stack trace:", error.stack);
      res.status(500).json({ message: error.message });
    }
  });

  // Get current user's assigned centros (for supervisors to know their scope)
  app.get("/api/usuarios/me/centros", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const centros = await storage.getSupervisorCentros(userId);
      res.json(centros);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ==================== CLIENTES - GESTIÓN DE CLIENTES ====================

  app.get("/api/clientes", requireSuperAdmin, async (req, res) => {
    try {
      const clientes = await storage.getClientes();
      res.json(clientes);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/clientes", requireSuperAdmin, async (req, res) => {
    try {
      const validatedData = insertClienteSchema.parse(req.body);
      
      // Check RFC uniqueness
      const existingCliente = await storage.getClientes();
      if (existingCliente.some(c => c.rfc === validatedData.rfc)) {
        return res.status(400).json({ message: "El RFC ya existe en el sistema" });
      }

      const cliente = await storage.createCliente(validatedData);
      
      // Create audit log
      await storage.createAdminAuditLog({
        adminUserId: req.user!.id,
        adminUsername: req.user!.username,
        action: 'create_cliente',
        resourceType: 'cliente',
        resourceId: cliente.id,
        newValue: {
          nombreComercial: cliente.nombreComercial,
          razonSocial: cliente.razonSocial,
          rfc: cliente.rfc
        },
        targetClienteId: cliente.id,
        targetEmpresaId: null,
        targetCentroTrabajoId: null
      });
      
      res.json(cliente);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/clientes/:id", requireSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      
      // Get current state for audit log
      const currentCliente = await storage.getCliente(id);
      if (!currentCliente) {
        return res.status(404).json({ message: "Cliente no encontrado" });
      }

      const validatedData = updateClienteSchema.parse(req.body);
      
      // Check RFC uniqueness if RFC is being updated
      if (validatedData.rfc && validatedData.rfc !== currentCliente.rfc) {
        const existingCliente = await storage.getClientes();
        if (existingCliente.some(c => c.rfc === validatedData.rfc && c.id !== id)) {
          return res.status(400).json({ message: "El RFC ya existe en el sistema" });
        }
      }

      const updatedCliente = await storage.updateCliente(id, validatedData);
      
      // Create audit log
      await storage.createAdminAuditLog({
        adminUserId: req.user!.id,
        adminUsername: req.user!.username,
        action: 'update_cliente',
        resourceType: 'cliente',
        resourceId: id,
        previousValue: {
          nombreComercial: currentCliente.nombreComercial,
          razonSocial: currentCliente.razonSocial,
          rfc: currentCliente.rfc,
          activo: currentCliente.activo
        },
        newValue: {
          nombreComercial: updatedCliente.nombreComercial,
          razonSocial: updatedCliente.razonSocial,
          rfc: updatedCliente.rfc,
          activo: updatedCliente.activo
        },
        targetClienteId: id,
        targetEmpresaId: null,
        targetCentroTrabajoId: null
      });
      
      res.json(updatedCliente);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/clientes/:id", requireSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      
      // Get cliente info for audit log before deletion
      const cliente = await storage.getCliente(id);
      if (!cliente) {
        return res.status(404).json({ message: "Cliente no encontrado" });
      }

      await storage.deleteCliente(id);
      
      // Create audit log after successful deletion
      await storage.createAdminAuditLog({
        adminUserId: req.user!.id,
        adminUsername: req.user!.username,
        action: 'delete_cliente',
        resourceType: 'cliente',
        resourceId: id,
        previousValue: {
          nombreComercial: cliente.nombreComercial,
          razonSocial: cliente.razonSocial,
          rfc: cliente.rfc
        },
        targetClienteId: id,
        targetEmpresaId: null,
        targetCentroTrabajoId: null
      });
      
      res.json({ success: true, message: "Cliente eliminado correctamente" });
    } catch (error: any) {
      if (error.message?.includes("violates foreign key")) {
        return res.status(409).json({ message: "No se puede eliminar el cliente porque tiene empresas asociadas. Elimine las empresas primero." });
      }
      res.status(500).json({ message: error.message });
    }
  });

  // ==================== Prestaciones ====================
  
  // Obtener todos los esquemas de prestaciones disponibles
  app.get("/api/cat-tablas-prestaciones", async (req, res) => {
    try {
      const { clienteId, empresaId, nombreEsquema } = req.query;
      
      const filters: any = {};
      if (clienteId) filters.clienteId = clienteId as string;
      if (empresaId) filters.empresaId = empresaId as string;
      if (nombreEsquema) filters.nombreEsquema = nombreEsquema as string;
      
      const tablas = await storage.getCatTablasPrestaciones(filters);
      res.json(tablas);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Obtener un esquema de prestaciones específico
  app.get("/api/cat-tablas-prestaciones/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const tabla = await storage.getCatTablaPrestaciones(id);
      
      if (!tabla) {
        return res.status(404).json({ message: "Esquema de prestaciones no encontrado" });
      }
      
      res.json(tabla);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Crear un nuevo esquema de prestaciones
  app.post("/api/cat-tablas-prestaciones", async (req, res) => {
    try {
      const newEsquema = await storage.createCatTablaPrestaciones(req.body);
      res.status(201).json(newEsquema);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Actualizar un esquema de prestaciones
  app.patch("/api/cat-tablas-prestaciones/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const tabla = await storage.getCatTablaPrestaciones(id);
      
      if (!tabla) {
        return res.status(404).json({ message: "Esquema de prestaciones no encontrado" });
      }
      
      const updated = await storage.updateCatTablaPrestaciones(id, req.body);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Eliminar un esquema de prestaciones
  app.delete("/api/cat-tablas-prestaciones/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const tabla = await storage.getCatTablaPrestaciones(id);
      
      if (!tabla) {
        return res.status(404).json({ message: "Esquema de prestaciones no encontrado" });
      }
      
      await storage.deleteCatTablaPrestaciones(id);
      res.status(204).send();
    } catch (error: any) {
      if (error.message?.includes("foreign key") || error.message?.includes("referenced")) {
        return res.status(409).json({ 
          message: "No se puede eliminar este esquema porque está siendo usado por puestos o empleados" 
        });
      }
      res.status(500).json({ message: error.message });
    }
  });

  // Schema de validación para prestaciones
  const updatePrestacionesSchema = z.object({
    esquemaPrestacionesId: z.union([
      z.string()
        .transform((val) => val.trim())
        .refine((val) => val.length > 0, {
          message: "esquemaPrestacionesId no puede ser un string vacío o solo espacios"
        }),
      z.null()
    ])
  }).strict();

  // Asignar esquema de prestaciones a un puesto
  app.patch("/api/puestos/:id/prestaciones", async (req, res) => {
    try {
      const { id } = req.params;
      
      // Validar el payload con Zod
      const validation = updatePrestacionesSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Payload inválido",
          errors: validation.error.errors 
        });
      }
      
      const { esquemaPrestacionesId } = validation.data;
      
      // Verificar que el puesto existe
      const puesto = await storage.getPuesto(id);
      if (!puesto) {
        return res.status(404).json({ message: "Puesto no encontrado" });
      }
      
      // Verificar que el esquema existe si se proporciona
      if (esquemaPrestacionesId) {
        const esquema = await storage.getCatTablaPrestaciones(esquemaPrestacionesId);
        if (!esquema) {
          return res.status(404).json({ message: "Esquema de prestaciones no encontrado" });
        }
      }
      
      // Actualizar el puesto
      const updated = await storage.updatePuesto(id, { esquemaPrestacionesId });
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Configurar override de prestaciones para un empleado
  app.patch("/api/employees/:id/prestaciones", async (req, res) => {
    try {
      const { id } = req.params;
      
      // Validar el payload con Zod
      const validation = updatePrestacionesSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Payload inválido",
          errors: validation.error.errors 
        });
      }
      
      const { esquemaPrestacionesId } = validation.data;
      
      // Verificar que el empleado existe
      const employee = await storage.getEmployee(id);
      if (!employee) {
        return res.status(404).json({ message: "Empleado no encontrado" });
      }
      
      // Verificar que el esquema existe si se proporciona
      if (esquemaPrestacionesId) {
        const esquema = await storage.getCatTablaPrestaciones(esquemaPrestacionesId);
        if (!esquema) {
          return res.status(404).json({ message: "Esquema de prestaciones no encontrado" });
        }
      }
      
      // Actualizar el empleado
      const updated = await storage.updateEmployee(id, { esquemaPrestacionesId });
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // ==================== Nuevo Sistema Modular de Prestaciones ====================

  // Tipos de Beneficio (catalog - read only)
  app.get("/api/tipos-beneficio", async (req, res) => {
    try {
      const tipos = await storage.getTiposBeneficio();
      res.json(tipos);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Esquemas de Prestaciones
  app.get("/api/esquemas-prestaciones", async (req, res) => {
    try {
      const { activos } = req.query;
      const esquemas = activos === "true" 
        ? await storage.getEsquemasPrestaActivos()
        : await storage.getEsquemasPresta();
      res.json(esquemas);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/esquemas-prestaciones/:id", async (req, res) => {
    try {
      const esquema = await storage.getEsquemaPresta(req.params.id);
      if (!esquema) {
        return res.status(404).json({ message: "Esquema no encontrado" });
      }
      res.json(esquema);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/esquemas-prestaciones", async (req, res) => {
    try {
      const esquema = await storage.createEsquemaPresta(req.body);
      res.status(201).json(esquema);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/esquemas-prestaciones/:id", async (req, res) => {
    try {
      const esquema = await storage.getEsquemaPresta(req.params.id);
      if (!esquema) {
        return res.status(404).json({ message: "Esquema no encontrado" });
      }
      if (esquema.esLey) {
        return res.status(403).json({ message: "No se puede modificar el esquema de ley" });
      }
      const updated = await storage.updateEsquemaPresta(req.params.id, req.body);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/esquemas-prestaciones/:id", async (req, res) => {
    try {
      const esquema = await storage.getEsquemaPresta(req.params.id);
      if (!esquema) {
        return res.status(404).json({ message: "Esquema no encontrado" });
      }
      if (esquema.esLey) {
        return res.status(403).json({ message: "No se puede eliminar el esquema de ley" });
      }
      await storage.deleteEsquemaPresta(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Tabla de Vacaciones por Esquema
  app.get("/api/esquemas-prestaciones/:id/vacaciones", async (req, res) => {
    try {
      const vacaciones = await storage.getEsquemaVacaciones(req.params.id);
      res.json(vacaciones);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/esquemas-prestaciones/:id/vacaciones", async (req, res) => {
    try {
      const esquema = await storage.getEsquemaPresta(req.params.id);
      if (!esquema) {
        return res.status(404).json({ message: "Esquema no encontrado" });
      }
      if (esquema.esLey) {
        return res.status(403).json({ message: "No se puede modificar el esquema de ley" });
      }
      const row = await storage.createEsquemaVacaciones({
        ...req.body,
        esquemaId: req.params.id,
      });
      res.status(201).json(row);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/esquema-vacaciones/:id", async (req, res) => {
    try {
      const updated = await storage.updateEsquemaVacacionesRow(req.params.id, req.body);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/esquema-vacaciones/:id", async (req, res) => {
    try {
      await storage.deleteEsquemaVacacionesRow(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Beneficios por Esquema
  app.get("/api/esquemas-prestaciones/:id/beneficios", async (req, res) => {
    try {
      const beneficios = await storage.getEsquemaBeneficios(req.params.id);
      res.json(beneficios);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/esquemas-prestaciones/:id/beneficios", async (req, res) => {
    try {
      const esquema = await storage.getEsquemaPresta(req.params.id);
      if (!esquema) {
        return res.status(404).json({ message: "Esquema no encontrado" });
      }
      if (esquema.esLey) {
        return res.status(403).json({ message: "No se puede modificar el esquema de ley" });
      }
      const beneficio = await storage.createEsquemaBeneficio({
        ...req.body,
        esquemaId: req.params.id,
      });
      res.status(201).json(beneficio);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/esquema-beneficios/:id", async (req, res) => {
    try {
      const updated = await storage.updateEsquemaBeneficio(req.params.id, req.body);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/esquema-beneficios/:id", async (req, res) => {
    try {
      await storage.deleteEsquemaBeneficio(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Beneficios Extra por Puesto
  app.get("/api/puestos/:id/beneficios-extra", async (req, res) => {
    try {
      const beneficios = await storage.getPuestoBeneficiosExtra(req.params.id);
      res.json(beneficios);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/puestos/:id/beneficios-extra", async (req, res) => {
    try {
      const beneficio = await storage.createPuestoBeneficioExtra({
        ...req.body,
        puestoId: req.params.id,
      });
      res.status(201).json(beneficio);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/puesto-beneficios-extra/:id", async (req, res) => {
    try {
      const updated = await storage.updatePuestoBeneficioExtra(req.params.id, req.body);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/puesto-beneficios-extra/:id", async (req, res) => {
    try {
      await storage.deletePuestoBeneficioExtra(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Beneficios Extra por Empleado
  app.get("/api/employees/:id/beneficios-extra", async (req, res) => {
    try {
      const beneficios = await storage.getEmpleadoBeneficiosExtra(req.params.id);
      res.json(beneficios);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/employees/:id/beneficios-extra", async (req, res) => {
    try {
      const beneficio = await storage.createEmpleadoBeneficioExtra({
        ...req.body,
        empleadoId: req.params.id,
      });
      res.status(201).json(beneficio);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/empleado-beneficios-extra/:id", async (req, res) => {
    try {
      const updated = await storage.updateEmpleadoBeneficioExtra(req.params.id, req.body);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/empleado-beneficios-extra/:id", async (req, res) => {
    try {
      await storage.deleteEmpleadoBeneficioExtra(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ===== BENEFITS RESOLUTION API =====
  // Returns total resolved benefits for an employee using 3-tier additive cascade
  // Supports both new modular system (esquemasPresta) and legacy (catTablasPrestaciones)
  app.get("/api/employees/:id/beneficios-resueltos", async (req, res) => {
    try {
      const result = await storage.resolveEmployeeBenefits(req.params.id);
      const totalesArray = Array.from(result.totales.entries()).map(([tipoBeneficioId, data]) => ({
        tipoBeneficioId,
        tipoBeneficio: data.tipoBeneficio,
        valorTotal: data.valorTotal,
        fuentes: data.fuentes,
      }));
      res.json({
        esquema: result.esquema,
        vacacionesPorAnio: result.vacacionesPorAnio,
        beneficiosBase: result.beneficiosBase,
        puestoExtras: result.puestoExtras,
        empleadoExtras: result.empleadoExtras,
        totales: totalesArray,
        usandoSistemaLegacy: result.usandoSistemaLegacy || false,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Returns vacation days for an employee based on seniority
  app.get("/api/employees/:id/vacaciones-resueltas", async (req, res) => {
    try {
      const aniosAntiguedad = parseInt(req.query.anios as string) || 0;
      const result = await storage.resolveVacationDays(req.params.id, aniosAntiguedad);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ==================== CATÁLOGO DE BANCOS ====================
  
  app.get("/api/catalogos/bancos", async (req, res) => {
    try {
      const bancos = await storage.getCatBancos();
      res.json(bancos);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/catalogos/bancos/:id", async (req, res) => {
    try {
      const banco = await storage.getCatBanco(req.params.id);
      if (!banco) {
        return res.status(404).json({ message: "Banco no encontrado" });
      }
      res.json(banco);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/catalogos/bancos/codigo-sat/:codigoSat", async (req, res) => {
    try {
      const banco = await storage.getCatBancoByCodigoSat(req.params.codigoSat);
      if (!banco) {
        return res.status(404).json({ message: "Banco no encontrado" });
      }
      res.json(banco);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ==================== CATÁLOGO DE VALORES UMA/SMG ====================
  
  app.get("/api/catalogos/uma-smg", async (req, res) => {
    try {
      const valores = await storage.getCatValoresUmaSmg();
      res.json(valores);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/catalogos/uma-smg/vigente", async (req, res) => {
    try {
      const tipo = (req.query.tipo as string) || "UMA";
      const fecha = req.query.fecha as string;
      const valor = await storage.getCatValorUmaSmgVigente(tipo, fecha);
      if (!valor) {
        return res.status(404).json({ message: `No se encontró valor ${tipo} vigente` });
      }
      res.json(valor);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ==================== KARDEX COMPENSATION (Historial salarial) ====================
  
  app.get("/api/kardex-compensation", async (req, res) => {
    try {
      const { empleadoId, empresaId } = req.query;
      let kardex;
      if (empleadoId) {
        kardex = await storage.getKardexCompensationByEmpleado(empleadoId as string);
      } else if (empresaId) {
        kardex = await storage.getKardexCompensationByEmpresa(empresaId as string);
      } else {
        return res.status(400).json({ message: "Se requiere empleadoId o empresaId" });
      }
      res.json(kardex);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/kardex-compensation/:id", async (req, res) => {
    try {
      const kardex = await storage.getKardexCompensation(req.params.id);
      if (!kardex) {
        return res.status(404).json({ message: "Registro no encontrado" });
      }
      res.json(kardex);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/employees/:id/kardex-compensation", async (req, res) => {
    try {
      const kardex = await storage.getKardexCompensationByEmpleado(req.params.id);
      res.json(kardex);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ==================== CFDI NÓMINA (Seguimiento de timbrado) ====================
  
  app.get("/api/cfdi-nomina", async (req, res) => {
    try {
      const { empleadoId, periodoId } = req.query;
      let cfdis;
      if (empleadoId) {
        cfdis = await storage.getCfdiNominasByEmpleado(empleadoId as string);
      } else if (periodoId) {
        cfdis = await storage.getCfdiNominasByPeriodo(periodoId as string);
      } else {
        return res.status(400).json({ message: "Se requiere empleadoId o periodoId" });
      }
      res.json(cfdis);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/cfdi-nomina/:id", async (req, res) => {
    try {
      const cfdi = await storage.getCfdiNomina(req.params.id);
      if (!cfdi) {
        return res.status(404).json({ message: "CFDI no encontrado" });
      }
      res.json(cfdi);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/cfdi-nomina/uuid/:uuid", async (req, res) => {
    try {
      const cfdi = await storage.getCfdiNominaByUuid(req.params.uuid);
      if (!cfdi) {
        return res.status(404).json({ message: "CFDI no encontrado" });
      }
      res.json(cfdi);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ==================== IMSS MOVIMIENTOS AFILIATORIOS (Phase 2) ====================
  
  app.get("/api/imss/movimientos", async (req, res) => {
    try {
      const { empresaId, empleadoId, registroPatronalId, estatus, tipoMovimiento, fechaDesde, fechaHasta, pendientes } = req.query;
      let movimientos;
      
      if (pendientes === "true") {
        movimientos = await storage.getImssMovimientosPendientes(empresaId as string | undefined);
      } else if (empleadoId) {
        movimientos = await storage.getImssMovimientosByEmpleado(empleadoId as string);
      } else if (registroPatronalId) {
        movimientos = await storage.getImssMovimientosByRegistroPatronal(registroPatronalId as string);
      } else if (empresaId) {
        movimientos = await storage.getImssMovimientosByEmpresa(empresaId as string, {
          estatus: estatus as string | undefined,
          tipoMovimiento: tipoMovimiento as string | undefined,
          fechaDesde: fechaDesde as string | undefined,
          fechaHasta: fechaHasta as string | undefined
        });
      } else {
        return res.status(400).json({ message: "Se requiere empresaId, empleadoId o registroPatronalId" });
      }
      res.json(movimientos);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/imss/movimientos/:id", async (req, res) => {
    try {
      const movimiento = await storage.getImssMovimiento(req.params.id);
      if (!movimiento) {
        return res.status(404).json({ message: "Movimiento no encontrado" });
      }
      res.json(movimiento);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/imss/movimientos", async (req, res) => {
    try {
      const validatedData = insertImssMovimientoSchema.parse(req.body);
      const movimiento = await storage.createImssMovimiento(validatedData);
      res.status(201).json(movimiento);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Datos inválidos", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  const updateImssMovimientoSchema = insertImssMovimientoSchema.partial();
  
  app.patch("/api/imss/movimientos/:id", async (req, res) => {
    try {
      const validatedData = updateImssMovimientoSchema.parse(req.body);
      const movimiento = await storage.updateImssMovimiento(req.params.id, validatedData);
      res.json(movimiento);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Datos inválidos", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/imss/movimientos/:id/enviar", async (req, res) => {
    try {
      const movimiento = await storage.updateImssMovimiento(req.params.id, {
        estatus: "enviado",
        fechaPresentacionImss: new Date().toISOString().split("T")[0]
      });
      res.json(movimiento);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/imss/movimientos/:id/aceptar", async (req, res) => {
    try {
      const { numeroAcuse } = req.body;
      const movimiento = await storage.updateImssMovimiento(req.params.id, {
        estatus: "aceptado",
        numeroAcuse
      });
      res.json(movimiento);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/imss/movimientos/:id/rechazar", async (req, res) => {
    try {
      const { motivoRechazo } = req.body;
      const movimiento = await storage.updateImssMovimiento(req.params.id, {
        estatus: "rechazado",
        motivoRechazo
      });
      res.json(movimiento);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/imss/movimientos/:id", async (req, res) => {
    try {
      await storage.deleteImssMovimiento(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ==================== SUA BIMESTRES (Phase 2) ====================
  
  app.get("/api/sua/bimestres", async (req, res) => {
    try {
      const { empresaId, registroPatronalId, ejercicio, pendientes } = req.query;
      let bimestres;
      
      if (pendientes === "true") {
        bimestres = await storage.getSuaBimestresPendientes(empresaId as string | undefined);
      } else if (registroPatronalId) {
        bimestres = await storage.getSuaBimestresByRegistroPatronal(
          registroPatronalId as string, 
          ejercicio ? parseInt(ejercicio as string) : undefined
        );
      } else if (empresaId) {
        bimestres = await storage.getSuaBimestresByEmpresa(
          empresaId as string,
          ejercicio ? parseInt(ejercicio as string) : undefined
        );
      } else {
        return res.status(400).json({ message: "Se requiere empresaId o registroPatronalId" });
      }
      res.json(bimestres);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/sua/bimestres/:id", async (req, res) => {
    try {
      const bimestre = await storage.getSuaBimestre(req.params.id);
      if (!bimestre) {
        return res.status(404).json({ message: "Bimestre no encontrado" });
      }
      res.json(bimestre);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/sua/bimestres/periodo/:registroPatronalId/:ejercicio/:bimestre", async (req, res) => {
    try {
      const { registroPatronalId, ejercicio, bimestre } = req.params;
      const result = await storage.getSuaBimestreByPeriodo(
        registroPatronalId,
        parseInt(ejercicio),
        parseInt(bimestre)
      );
      if (!result) {
        return res.status(404).json({ message: "Bimestre no encontrado" });
      }
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/sua/bimestres", async (req, res) => {
    try {
      const validatedData = insertSuaBimestreSchema.parse(req.body);
      const bimestre = await storage.createSuaBimestre(validatedData);
      res.status(201).json(bimestre);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Datos inválidos", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  const updateSuaBimestreSchema = insertSuaBimestreSchema.partial();

  app.patch("/api/sua/bimestres/:id", async (req, res) => {
    try {
      const validatedData = updateSuaBimestreSchema.parse(req.body);
      const bimestre = await storage.updateSuaBimestre(req.params.id, validatedData);
      res.json(bimestre);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Datos inválidos", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/sua/bimestres/:id/calcular", async (req, res) => {
    try {
      const bimestre = await storage.updateSuaBimestre(req.params.id, {
        estatus: "calculado",
        fechaCalculo: new Date()
      });
      res.json(bimestre);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/sua/bimestres/:id/generar-archivo", async (req, res) => {
    try {
      const { archivoNombre, archivoPath, archivoHash } = req.body;
      const bimestre = await storage.updateSuaBimestre(req.params.id, {
        estatus: "archivo_generado",
        fechaGeneracionArchivo: new Date(),
        archivoNombre,
        archivoPath,
        archivoHash
      });
      res.json(bimestre);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/sua/bimestres/:id/registrar-pago", async (req, res) => {
    try {
      const { fechaPago, lineaCaptura, bancoRecaudador, folioComprobante, importePagadoDecimal } = req.body;
      const importePagadoBp = importePagadoDecimal ? BigInt(Math.round(importePagadoDecimal * 10000)) : undefined;
      
      const bimestre = await storage.updateSuaBimestre(req.params.id, {
        estatus: "pagado",
        fechaPago,
        lineaCaptura,
        bancoRecaudador,
        folioComprobante,
        importePagadoDecimal,
        importePagadoBp
      });
      res.json(bimestre);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/sua/bimestres/:id", async (req, res) => {
    try {
      await storage.deleteSuaBimestre(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ==================== IMSS CALCULATION ENGINE (Phase 3) ====================
  
  app.get("/api/imss/configuracion/:anio", async (req, res) => {
    try {
      const { getConfiguracionIMSS } = await import("./services/imssCalculator");
      const anio = parseInt(req.params.anio);
      const config = await getConfiguracionIMSS(anio);
      res.json(config);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/imss/cuotas-catalogo/:anio", async (req, res) => {
    try {
      const { getCuotasIMSS } = await import("./services/imssCalculator");
      const anio = parseInt(req.params.anio);
      const cuotas = await getCuotasIMSS(anio);
      res.json(cuotas);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/imss/cesantia-vejez-tasas/:anio", async (req, res) => {
    try {
      const { getRangosCesantiaVejez } = await import("./services/imssCalculator");
      const anio = parseInt(req.params.anio);
      const tasas = await getRangosCesantiaVejez(anio);
      res.json(tasas);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/imss/calcular-cuotas", async (req, res) => {
    try {
      const { calcularCuotasIMSS, getConfiguracionIMSS } = await import("./services/imssCalculator");
      const { empleado, anio } = req.body;
      
      if (!empleado || !anio) {
        return res.status(400).json({ message: "Se requiere empleado y anio" });
      }
      
      const config = await getConfiguracionIMSS(anio);
      const resultado = await calcularCuotasIMSS(empleado, config);
      
      res.json({
        ...resultado,
        totalObreroBp: resultado.totalObreroBp.toString(),
        totalPatronalBp: resultado.totalPatronalBp.toString(),
        totalBp: resultado.totalBp.toString(),
        cuotasObrero: resultado.cuotasObrero.map(c => ({
          ...c,
          baseBp: c.baseBp.toString(),
          montoBp: c.montoBp.toString(),
        })),
        cuotasPatronal: resultado.cuotasPatronal.map(c => ({
          ...c,
          baseBp: c.baseBp.toString(),
          montoBp: c.montoBp.toString(),
        })),
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/imss/calcular-bimestre", async (req, res) => {
    try {
      const { calcularCuotasBimestrales } = await import("./services/imssCalculator");
      const { empresaId, empleados, ejercicio, bimestre } = req.body;
      
      if (!empresaId || !empleados || !ejercicio || !bimestre) {
        return res.status(400).json({ 
          message: "Se requiere empresaId, empleados, ejercicio y bimestre" 
        });
      }
      
      const resultado = await calcularCuotasBimestrales(
        empresaId,
        empleados,
        ejercicio,
        bimestre
      );
      
      res.json({
        ...resultado,
        // Serialize bimestral totals (bigint to string)
        totalesObreroBp: resultado.totalesObreroBp.toString(),
        totalesPatronalBp: resultado.totalesPatronalBp.toString(),
        totalesGeneralBp: resultado.totalesGeneralBp.toString(),
        // Serialize desglose per ramo (bigint to string)
        desglosePorRamo: resultado.desglosePorRamo.map(r => ({
          ...r,
          obreroBp: r.obreroBp.toString(),
          patronalBp: r.patronalBp.toString(),
          totalBp: r.totalBp.toString(),
        })),
        // Serialize employee-level data
        empleados: resultado.empleados.map(e => ({
          ...e,
          totalObreroBp: e.totalObreroBp.toString(),
          totalPatronalBp: e.totalPatronalBp.toString(),
          totalBp: e.totalBp.toString(),
          cuotasObrero: e.cuotasObrero.map(c => ({
            ...c,
            baseBp: c.baseBp.toString(),
            montoBp: c.montoBp.toString(),
          })),
          cuotasPatronal: e.cuotasPatronal.map(c => ({
            ...c,
            baseBp: c.baseBp.toString(),
            montoBp: c.montoBp.toString(),
          })),
        })),
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ==================== SUA/IDSE FILE GENERATION (Phase 3) ====================
  
  app.post("/api/sua/generar-archivo", async (req, res) => {
    try {
      const { generarArchivoSUA, generarReporteRamos, generarResumenCSV } = await import("./services/suaGenerator");
      const { patron, empleados, resultado } = req.body;
      
      if (!patron || !empleados || !resultado) {
        return res.status(400).json({ 
          message: "Se requiere patron, empleados y resultado del cálculo" 
        });
      }
      
      const archivoSUA = generarArchivoSUA(patron, empleados, resultado);
      const reporteRamos = generarReporteRamos(resultado);
      const resumenCSV = generarResumenCSV(resultado);
      
      res.json({
        archivo: archivoSUA,
        reporteRamos,
        resumenCSV,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/idse/generar-archivos", async (req, res) => {
    try {
      const { generarArchivosIDSE, validarMovimiento, generarResumenMovimientos } = await import("./services/idseGenerator");
      const { patron, movimientos } = req.body;
      
      if (!patron || !movimientos || !Array.isArray(movimientos)) {
        return res.status(400).json({ 
          message: "Se requiere patron y array de movimientos" 
        });
      }
      
      // Validar todos los movimientos
      const validaciones = movimientos.map((m: any) => ({
        nss: m.nss,
        ...validarMovimiento(m)
      }));
      
      const movimientosInvalidos = validaciones.filter((v: any) => !v.valido);
      
      if (movimientosInvalidos.length > 0) {
        return res.status(400).json({
          message: "Hay movimientos con errores de validación",
          errores: movimientosInvalidos,
        });
      }
      
      const archivos = generarArchivosIDSE(patron, movimientos);
      const resumen = generarResumenMovimientos(movimientos);
      
      res.json({
        archivos,
        resumen,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/idse/validar-movimientos", async (req, res) => {
    try {
      const { validarMovimiento, validarNSS, validarCURP } = await import("./services/idseGenerator");
      const { movimientos } = req.body;
      
      if (!movimientos || !Array.isArray(movimientos)) {
        return res.status(400).json({ message: "Se requiere array de movimientos" });
      }
      
      const validaciones = movimientos.map((m: any) => ({
        nss: m.nss,
        curp: m.curp,
        nombre: m.nombre,
        ...validarMovimiento(m),
        validacionNSS: validarNSS(m.nss),
        validacionCURP: validarCURP(m.curp),
      }));
      
      const todosValidos = validaciones.every((v: any) => v.valido);
      
      res.json({
        todosValidos,
        validaciones,
        totalValidos: validaciones.filter((v: any) => v.valido).length,
        totalInvalidos: validaciones.filter((v: any) => !v.valido).length,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ==================== EMPLOYEE BANK ACCOUNTS ====================
  
  app.get("/api/employees/:empleadoId/bank-accounts", async (req, res) => {
    try {
      const { empleadoId } = req.params;
      const accounts = await storage.getEmployeeBankAccountsByEmpleado(empleadoId);
      res.json(accounts);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/employees/:empleadoId/bank-accounts", async (req, res) => {
    try {
      const { empleadoId } = req.params;
      const account = await storage.createEmployeeBankAccount({
        ...req.body,
        empleadoId,
      });
      res.status(201).json(account);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/bank-accounts/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const account = await storage.updateEmployeeBankAccount(id, req.body);
      res.json(account);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/bank-accounts/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteEmployeeBankAccount(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ==================== KARDEX HISTORY (Read-only) ====================
  
  app.get("/api/employees/:empleadoId/kardex/compensation", async (req, res) => {
    try {
      const { empleadoId } = req.params;
      const kardex = await storage.getKardexCompensationByEmpleado(empleadoId);
      res.json(kardex);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/employees/:empleadoId/kardex/employment", async (req, res) => {
    try {
      const { empleadoId } = req.params;
      const kardex = await storage.getKardexEmploymentByEmpleado(empleadoId);
      res.json(kardex);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/employees/:empleadoId/kardex/labor-conditions", async (req, res) => {
    try {
      const { empleadoId } = req.params;
      const kardex = await storage.getKardexLaborConditionsByEmpleado(empleadoId);
      res.json(kardex);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/employees/:empleadoId/kardex/bank-accounts", async (req, res) => {
    try {
      const { empleadoId } = req.params;
      const kardex = await storage.getKardexBankAccountsByEmpleado(empleadoId);
      res.json(kardex);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/employees/:empleadoId/kardex/vacaciones", async (req, res) => {
    try {
      const { empleadoId } = req.params;
      const kardex = await storage.getKardexVacacionesByEmpleado(empleadoId);
      res.json(kardex);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Complete kardex history for an employee
  app.get("/api/employees/:empleadoId/kardex", async (req, res) => {
    try {
      const { empleadoId } = req.params;
      
      const [compensation, employment, laborConditions, bankAccounts, vacaciones] = await Promise.all([
        storage.getKardexCompensationByEmpleado(empleadoId),
        storage.getKardexEmploymentByEmpleado(empleadoId),
        storage.getKardexLaborConditionsByEmpleado(empleadoId),
        storage.getKardexBankAccountsByEmpleado(empleadoId),
        storage.getKardexVacacionesByEmpleado(empleadoId),
      ]);
      
      res.json({
        compensation,
        employment,
        laborConditions,
        bankAccounts,
        vacaciones,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ==================== GEOGRAPHIC CATALOGS (Read-only) ====================
  
  app.get("/api/catalogs/paises", async (req, res) => {
    try {
      const paises = await storage.getCatPaises();
      res.json(paises);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/catalogs/estados", async (req, res) => {
    try {
      const { codigoPais } = req.query;
      if (codigoPais) {
        const estados = await storage.getCatEstadosByCodigo(codigoPais as string);
        res.json(estados);
      } else {
        const estados = await storage.getCatEstados();
        res.json(estados);
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/catalogs/municipios", async (req, res) => {
    try {
      const { codigoPais, codigoEstado } = req.query;
      if (codigoPais && codigoEstado) {
        const municipios = await storage.getCatMunicipiosByEstado(codigoPais as string, codigoEstado as string);
        res.json(municipios);
      } else {
        const municipios = await storage.getCatMunicipios();
        res.json(municipios);
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/catalogs/codigos-postales", async (req, res) => {
    try {
      const { codigoPais, codigoEstado, codigoMunicipio, codigoPostal } = req.query;
      
      if (codigoPostal) {
        const cp = await storage.getCatCodigoPostalByCodigo(codigoPostal as string);
        res.json(cp ? [cp] : []);
      } else if (codigoPais && codigoEstado && codigoMunicipio) {
        const cps = await storage.getCatCodigosPostalesByMunicipio(
          codigoPais as string, 
          codigoEstado as string, 
          codigoMunicipio as string
        );
        res.json(cps);
      } else if (codigoPais && codigoEstado) {
        const cps = await storage.getCatCodigosPostales(codigoPais as string, codigoEstado as string);
        res.json(cps);
      } else {
        res.status(400).json({ message: "Se requiere al menos codigoPais y codigoEstado" });
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ============================================================================
  // Compensación Trabajador API (BRUTO/NETO System)
  // ============================================================================

  app.get("/api/compensaciones/empleado/:empleadoId", async (req, res) => {
    try {
      const { empleadoId } = req.params;
      // Verify access to the employee
      const empleado = await storage.getEmployee(empleadoId);
      if (empleado?.clienteId && !canAccessCliente(req, empleado.clienteId)) {
        return res.status(403).json({ message: "No tienes acceso a este empleado" });
      }
      const compensaciones = await storage.getCompensacionTrabajadorByEmpleado(empleadoId);
      res.json(compensaciones);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/compensaciones/empleado/:empleadoId/vigente", async (req, res) => {
    try {
      const { empleadoId } = req.params;
      // Verify access to the employee
      const empleado = await storage.getEmployee(empleadoId);
      if (empleado?.clienteId && !canAccessCliente(req, empleado.clienteId)) {
        return res.status(403).json({ message: "No tienes acceso a este empleado" });
      }
      const { fecha } = req.query;
      const compensacion = await storage.getCompensacionTrabajadorVigente(
        empleadoId,
        fecha ? new Date(fecha as string) : undefined
      );
      res.json(compensacion || null);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/compensaciones", async (req, res) => {
    try {
      const validatedData = insertCompensacionTrabajadorSchema.parse(req.body);
      // Verify client access before creating
      if (validatedData.clienteId && !canAccessCliente(req, validatedData.clienteId)) {
        return res.status(403).json({ message: "No tienes acceso a crear compensaciones para este cliente" });
      }
      const compensacion = await storage.createCompensacionTrabajador(validatedData);
      res.status(201).json(compensacion);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/compensaciones/:id", async (req, res) => {
    try {
      const { id } = req.params;
      // Verify access before updating
      const existingComp = await storage.getCompensacionTrabajador(id);
      if (existingComp?.clienteId && !canAccessCliente(req, existingComp.clienteId)) {
        return res.status(403).json({ message: "No tienes acceso a esta compensación" });
      }
      const validatedData = insertCompensacionTrabajadorSchema.partial().parse(req.body);
      const compensacion = await storage.updateCompensacionTrabajador(id, validatedData);
      res.json(compensacion);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });
  
  // ============================================================================
  // Compensación Calculada API (Derived values)
  // ============================================================================

  app.get("/api/compensaciones-calculadas/empleado/:empleadoId", async (req, res) => {
    try {
      const { empleadoId } = req.params;
      // Verify access to the employee
      const empleado = await storage.getEmployee(empleadoId);
      if (empleado?.clienteId && !canAccessCliente(req, empleado.clienteId)) {
        return res.status(403).json({ message: "No tienes acceso a este empleado" });
      }
      const calculadas = await storage.getCompensacionCalculadaByEmpleado(empleadoId);
      res.json(calculadas);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/compensaciones-calculadas/empleado/:empleadoId/ultima", async (req, res) => {
    try {
      const { empleadoId } = req.params;
      // Verify access to the employee
      const empleado = await storage.getEmployee(empleadoId);
      if (empleado?.clienteId && !canAccessCliente(req, empleado.clienteId)) {
        return res.status(403).json({ message: "No tienes acceso a este empleado" });
      }
      const calculada = await storage.getCompensacionCalculadaLatest(empleadoId);
      res.json(calculada || null);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/compensaciones-calculadas", async (req, res) => {
    try {
      const validatedData = insertCompensacionCalculadaSchema.parse(req.body);
      // Verify client access before creating
      if (validatedData.clienteId && !canAccessCliente(req, validatedData.clienteId)) {
        return res.status(403).json({ message: "No tienes acceso a crear compensaciones calculadas para este cliente" });
      }
      const calculada = await storage.createCompensacionCalculada(validatedData);
      res.status(201).json(calculada);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });
  
  // ============================================================================
  // Exento Cap Configs API (Default caps per empresa)
  // ============================================================================
  
  app.get("/api/exento-caps/empresa/:empresaId", async (req, res) => {
    try {
      const { empresaId } = req.params;
      const configs = await storage.getExentoCapConfigsByEmpresa(empresaId);
      res.json(configs);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.get("/api/exento-caps/medio-pago/:medioPagoId", async (req, res) => {
    try {
      const { medioPagoId } = req.params;
      const configs = await storage.getExentoCapConfigsByMedioPago(medioPagoId);
      res.json(configs);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.get("/api/exento-caps/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const config = await storage.getExentoCapConfig(id);
      if (!config) {
        return res.status(404).json({ message: "Config not found" });
      }
      res.json(config);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.post("/api/exento-caps", async (req, res) => {
    try {
      const validatedData = insertExentoCapConfigSchema.parse(req.body);
      const config = await storage.createExentoCapConfig(validatedData);
      res.status(201).json(config);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });
  
  app.patch("/api/exento-caps/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertExentoCapConfigSchema.partial().parse(req.body);
      const config = await storage.updateExentoCapConfig(id, validatedData);
      res.json(config);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });
  
  app.delete("/api/exento-caps/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteExentoCapConfig(id);
      res.status(204).end();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // ============================================================================
  // Employee Exento Caps API (Per-employee overrides)
  // ============================================================================
  
  app.get("/api/employee-exento-caps/empleado/:empleadoId", async (req, res) => {
    try {
      const { empleadoId } = req.params;
      const caps = await storage.getEmployeeExentoCapsByEmpleado(empleadoId);
      res.json(caps);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.get("/api/employee-exento-caps/empleado/:empleadoId/efectivos", async (req, res) => {
    try {
      const { empleadoId } = req.params;
      const capsEfectivos = await storage.getEmployeeExentoCapsEfectivos(empleadoId);
      res.json(capsEfectivos);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.post("/api/employee-exento-caps", async (req, res) => {
    try {
      const validatedData = insertEmployeeExentoCapSchema.parse(req.body);
      const cap = await storage.createEmployeeExentoCap(validatedData);
      res.status(201).json(cap);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });
  
  app.patch("/api/employee-exento-caps/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertEmployeeExentoCapSchema.partial().parse(req.body);
      const cap = await storage.updateEmployeeExentoCap(id, validatedData);
      res.json(cap);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });
  
  app.delete("/api/employee-exento-caps/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteEmployeeExentoCap(id);
      res.status(204).end();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // ============================================================================
  // Payroll Exento Ledger API (Cap consumption tracking)
  // ============================================================================

  app.get("/api/payroll-exento-ledger/empleado/:empleadoId", async (req, res) => {
    try {
      const { empleadoId } = req.params;
      // Verify access to the employee
      const empleado = await storage.getEmployee(empleadoId);
      if (empleado?.clienteId && !canAccessCliente(req, empleado.clienteId)) {
        return res.status(403).json({ message: "No tienes acceso a este empleado" });
      }
      const { ejercicio } = req.query;
      const ledger = await storage.getPayrollExentoLedgerByEmpleado(
        empleadoId,
        ejercicio ? parseInt(ejercicio as string) : undefined
      );
      res.json(ledger);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/payroll-exento-ledger/periodo/:periodoNominaId", async (req, res) => {
    try {
      const { periodoNominaId } = req.params;
      // Verify access to the periodo
      const periodo = await storage.getPeriodoNomina(periodoNominaId);
      if (periodo?.clienteId && !canAccessCliente(req, periodo.clienteId)) {
        return res.status(403).json({ message: "No tienes acceso a este periodo" });
      }
      const ledger = await storage.getPayrollExentoLedgerByPeriodo(periodoNominaId);
      res.json(ledger);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/payroll-exento-ledger/consumo/:empleadoId/:exentoCapConfigId", async (req, res) => {
    try {
      const { empleadoId, exentoCapConfigId } = req.params;
      // Verify access to the employee
      const empleado = await storage.getEmployee(empleadoId);
      if (empleado?.clienteId && !canAccessCliente(req, empleado.clienteId)) {
        return res.status(403).json({ message: "No tienes acceso a este empleado" });
      }
      const { ejercicio, mes } = req.query;

      if (!ejercicio) {
        return res.status(400).json({ message: "Se requiere ejercicio" });
      }

      const consumo = await storage.getConsumoAcumulado(
        empleadoId,
        exentoCapConfigId,
        parseInt(ejercicio as string),
        mes ? parseInt(mes as string) : undefined
      );

      res.json({
        consumoMensualBp: consumo.consumoMensualBp.toString(),
        consumoAnualBp: consumo.consumoAnualBp.toString()
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.post("/api/payroll-exento-ledger", async (req, res) => {
    try {
      const validatedData = insertPayrollExentoLedgerSchema.parse(req.body);
      const ledger = await storage.createPayrollExentoLedger(validatedData);
      res.status(201).json(ledger);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });
  
  // ============================================================================
  // Compensation Service API (Compatibility Layer)
  // ============================================================================
  
  app.get("/api/empleados/:id/salario-nomina", async (req, res) => {
    try {
      const { id } = req.params;
      const { fecha } = req.query;
      const { getSalarioParaNomina } = await import('./services/compensationService');
      
      const fechaRef = fecha ? new Date(fecha as string) : new Date();
      const salario = await getSalarioParaNomina(id, fechaRef);
      
      if (!salario) {
        return res.status(404).json({ message: "Empleado no encontrado" });
      }
      
      res.json({
        ...salario,
        salarioDiarioBp: salario.salarioDiarioBp.toString(),
        salarioDiarioNominalBp: salario.salarioDiarioNominalBp?.toString() || null,
        netoDeseadoBp: salario.netoDeseadoBp?.toString() || null,
        brutoTotalBp: salario.brutoTotalBp?.toString() || null,
        sbcBp: salario.sbcBp?.toString() || null,
        factorIntegracionBp: salario.factorIntegracionBp?.toString() || null,
        distribucion: salario.distribucion ? {
          previsionSocialBp: salario.distribucion.previsionSocialBp?.toString() || null,
          premioPuntualidadBp: salario.distribucion.premioPuntualidadBp?.toString() || null,
          premioAsistenciaBp: salario.distribucion.premioAsistenciaBp?.toString() || null,
          fondoAhorroBp: salario.distribucion.fondoAhorroBp?.toString() || null,
          valesDespensaBp: salario.distribucion.valesDespensaBp?.toString() || null,
          otrosConceptosBp: salario.distribucion.otrosConceptosBp?.toString() || null,
        } : null,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.get("/api/empleados/:id/tiene-compensacion", async (req, res) => {
    try {
      const { id } = req.params;
      const { tieneCompensacionConfigurada } = await import('./services/compensationService');
      
      const tiene = await tieneCompensacionConfigurada(id);
      res.json({ tieneCompensacion: tiene });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.get("/api/empleados/:id/historial-compensaciones", async (req, res) => {
    try {
      const { id } = req.params;
      const { getHistorialCompensaciones } = await import('./services/compensationService');
      
      const historial = await getHistorialCompensaciones(id);
      res.json(historial);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // ============================================================================
  // Inverse Payroll Calculator API
  // ============================================================================
  
  app.post("/api/calculo-inverso/bruto-desde-neto", async (req, res) => {
    try {
      const { netoDeseadoBp, diasPeriodo, periodo } = req.body;
      const { calcularBrutoDesdeNeto } = await import('./services/inversePayrollCalculator');
      
      if (!netoDeseadoBp) {
        return res.status(400).json({ message: "netoDeseadoBp es requerido" });
      }
      
      const resultado = calcularBrutoDesdeNeto({
        netoDeseadoBp: BigInt(netoDeseadoBp),
        diasPeriodo,
        periodo,
      });
      
      res.json({
        brutoMensualBp: resultado.brutoMensualBp.toString(),
        salarioDiarioBp: resultado.salarioDiarioBp.toString(),
        netoCalculadoBp: resultado.netoCalculadoBp.toString(),
        isrMensualBp: resultado.isrMensualBp.toString(),
        imssObreroMensualBp: resultado.imssObreroMensualBp.toString(),
        subsidioEmpleoBp: resultado.subsidioEmpleoBp.toString(),
        varianzaBp: resultado.varianzaBp.toString(),
        iteraciones: resultado.iteraciones,
        convergencia: resultado.convergencia,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.post("/api/calculo-inverso/neto-desde-bruto", async (req, res) => {
    try {
      const { brutoMensualBp, diasPeriodo, periodo } = req.body;
      const { calcularNetoDesdebruto } = await import('./services/inversePayrollCalculator');
      
      if (!brutoMensualBp) {
        return res.status(400).json({ message: "brutoMensualBp es requerido" });
      }
      
      const resultado = calcularNetoDesdebruto(
        BigInt(brutoMensualBp),
        diasPeriodo,
        periodo
      );
      
      res.json({
        brutoMensualBp: resultado.brutoMensualBp.toString(),
        salarioDiarioBp: resultado.salarioDiarioBp.toString(),
        netoCalculadoBp: resultado.netoCalculadoBp.toString(),
        isrMensualBp: resultado.isrMensualBp.toString(),
        imssObreroMensualBp: resultado.imssObreroMensualBp.toString(),
        subsidioEmpleoBp: resultado.subsidioEmpleoBp.toString(),
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.post("/api/calculo-inverso/recalcular-compensacion", async (req, res) => {
    try {
      const { esquemaTipo, valorAnclaBp, diasPeriodo, periodo } = req.body;
      const { recalcularCompensacion } = await import('./services/inversePayrollCalculator');
      
      if (!esquemaTipo || !valorAnclaBp) {
        return res.status(400).json({ message: "esquemaTipo y valorAnclaBp son requeridos" });
      }
      
      if (esquemaTipo !== 'BRUTO' && esquemaTipo !== 'NETO') {
        return res.status(400).json({ message: "esquemaTipo debe ser 'BRUTO' o 'NETO'" });
      }
      
      const resultado = recalcularCompensacion(
        esquemaTipo,
        BigInt(valorAnclaBp),
        diasPeriodo,
        periodo
      );
      
      res.json({
        brutoMensualBp: resultado.brutoMensualBp.toString(),
        salarioDiarioBp: resultado.salarioDiarioBp.toString(),
        netoCalculadoBp: resultado.netoCalculadoBp.toString(),
        isrMensualBp: resultado.isrMensualBp.toString(),
        imssObreroMensualBp: resultado.imssObreroMensualBp.toString(),
        subsidioEmpleoBp: resultado.subsidioEmpleoBp.toString(),
        varianzaBp: resultado.varianzaBp.toString(),
        iteraciones: resultado.iteraciones,
        convergencia: resultado.convergencia,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // ============================================================================
  // UMA Vigente API
  // ============================================================================
  
  app.get("/api/uma/vigente", async (req, res) => {
    try {
      const { fecha } = req.query;
      const uma = await storage.getUmaVigente(fecha ? new Date(fecha as string) : undefined);
      res.json(uma || null);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ============================================================================
  // Onboarding Audit API (HR Due Diligence Wizard)
  // ============================================================================
  
  app.get("/api/onboarding/audit/:clienteId", async (req, res) => {
    try {
      const clienteId = req.params.clienteId;
      let audit = await storage.getOnboardingAuditByCliente(clienteId);
      
      if (!audit) {
        audit = await storage.createOnboardingAudit({
          clienteId,
          section1: {},
          section2: {},
          section3: {},
          section4: {},
          section5: {},
          section6: {},
          section7: {},
          section8: {},
          section9: {},
          section10: {},
          section11: {},
          section12: {},
          sectionStatus: {},
        });
      }
      
      res.json(audit);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.put("/api/onboarding/audit/:clienteId", async (req, res) => {
    try {
      const clienteId = req.params.clienteId;
      const updates = req.body;
      
      let existing = await storage.getOnboardingAuditByCliente(clienteId);
      
      if (!existing) {
        existing = await storage.createOnboardingAudit({
          clienteId,
          section1: {},
          section2: {},
          section3: {},
          section4: {},
          section5: {},
          section6: {},
          section7: {},
          section8: {},
          section9: {},
          section10: {},
          section11: {},
          section12: {},
          sectionStatus: {},
        });
      }
      
      const updated = await storage.updateOnboardingAudit(existing.id, {
        section1: updates.section1,
        section2: updates.section2,
        section3: updates.section3,
        section4: updates.section4,
        section5: updates.section5,
        section6: updates.section6,
        section7: updates.section7,
        section8: updates.section8,
        section9: updates.section9,
        section10: updates.section10,
        section11: updates.section11,
        section12: updates.section12,
        sectionStatus: updates.sectionStatus,
      });
      
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ============================================================================
  // PORTAL DE EMPLEADOS - Employee Self-Service API
  // ============================================================================

  // Portal - Get client info by ID (validates portal access)
  app.get("/api/portal/:clienteId/info", async (req, res) => {
    try {
      const { clienteId } = req.params;
      const cliente = await storage.getCliente(clienteId);

      if (!cliente) {
        return res.status(404).json({ message: "Cliente no encontrado" });
      }

      if (!cliente.activo) {
        return res.status(403).json({ message: "Portal no disponible" });
      }

      res.json({
        clienteId: cliente.id,
        nombreComercial: cliente.nombreComercial,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Portal Authentication - Login for employees using RFC
  app.post("/api/portal/:clienteId/auth/login", async (req, res) => {
    try {
      const { clienteId } = req.params;
      const { rfc, password } = req.body;

      // Validate client ID
      const cliente = await storage.getCliente(clienteId);
      if (!cliente) {
        return res.status(404).json({ message: "Portal no encontrado" });
      }

      if (!rfc) {
        return res.status(400).json({ message: "RFC es requerido" });
      }

      const employee = await storage.getEmployeeByRfc(rfc.toUpperCase());

      if (!employee) {
        return res.status(401).json({ message: "RFC no encontrado" });
      }

      // Verify employee belongs to this client
      if (employee.clienteId !== cliente.id) {
        return res.status(401).json({ message: "RFC no encontrado" });
      }

      // Check if portal access is enabled
      if (!employee.portalActivo) {
        return res.status(403).json({ message: "Acceso al portal no habilitado. Contacte a Recursos Humanos." });
      }

      // Check if employee is active
      if (employee.estatus !== "activo") {
        return res.status(403).json({ message: "Empleado inactivo. Contacte a Recursos Humanos." });
      }

      // First login - no password set yet
      if (!employee.portalPassword) {
        return res.status(200).json({
          requiresPasswordSetup: true,
          employeeId: employee.id,
          employeeName: `${employee.nombre} ${employee.apellidoPaterno}`,
          message: "Primera vez. Configure su contraseña."
        });
      }

      // Password is required for login after setup
      if (!password) {
        return res.status(400).json({ message: "Contraseña es requerida" });
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, employee.portalPassword);

      if (!isPasswordValid) {
        return res.status(401).json({ message: "Contraseña incorrecta" });
      }

      // Store employee in session
      req.session.user = {
        id: employee.id,
        username: employee.rfc,
        nombre: employee.nombre,
        email: employee.email || employee.correo,
        tipoUsuario: "empleado",
        clienteId: employee.clienteId,
        empresaId: employee.empresaId,
        empleadoId: employee.id,
        portalActivo: employee.portalActivo,
      };

      // Explicitly save session to ensure it's persisted before response
      await new Promise<void>((resolve, reject) => {
        req.session.save((err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      res.json({
        success: true,
        employee: {
          id: employee.id,
          nombre: employee.nombre,
          apellidoPaterno: employee.apellidoPaterno,
          apellidoMaterno: employee.apellidoMaterno,
          numeroEmpleado: employee.numeroEmpleado,
          email: employee.email || employee.correo,
          telefono: employee.telefono,
          puesto: employee.puesto,
          departamento: employee.departamento,
          fechaIngreso: employee.fechaIngreso,
          diasVacacionesDisponibles: parseFloat(employee.saldoVacacionesActual as string) || 0,
        },
        message: "Login exitoso"
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Portal Authentication - Setup password for first login
  app.post("/api/portal/:clienteId/auth/setup-password", async (req, res) => {
    try {
      const { clienteId } = req.params;
      const { rfc, password } = req.body;

      // Validate client ID
      const cliente = await storage.getCliente(clienteId);
      if (!cliente) {
        return res.status(404).json({ message: "Portal no encontrado" });
      }

      if (!rfc || !password) {
        return res.status(400).json({ message: "RFC y contraseña son requeridos" });
      }

      if (password.length < 6) {
        return res.status(400).json({ message: "La contraseña debe tener al menos 6 caracteres" });
      }

      const employee = await storage.getEmployeeByRfc(rfc.toUpperCase());

      if (!employee) {
        return res.status(404).json({ message: "RFC no encontrado" });
      }

      // Verify employee belongs to this client
      if (employee.clienteId !== cliente.id) {
        return res.status(404).json({ message: "RFC no encontrado" });
      }

      // Only allow if no password set yet
      if (employee.portalPassword) {
        return res.status(400).json({ message: "Contraseña ya configurada. Use la opción de recuperar contraseña." });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      await storage.updateEmployee(employee.id, { portalPassword: hashedPassword });

      res.json({ success: true, message: "Contraseña configurada exitosamente" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Portal Auth - Get current employee
  app.get("/api/portal/:clienteId/auth/me", async (req, res) => {
    if (!req.session?.user) {
      return res.status(401).json({ message: "No autenticado" });
    }

    try {
      // Session now stores employee ID directly
      const empleadoId = req.session.user.empleadoId;
      if (!empleadoId) {
        return res.status(401).json({ message: "Sesión inválida" });
      }

      const employee = await storage.getEmployee(empleadoId);
      if (!employee) {
        return res.status(401).json({ message: "Empleado no encontrado" });
      }

      // Check portal access is still enabled
      if (!employee.portalActivo) {
        return res.status(403).json({ message: "Acceso al portal no habilitado" });
      }

      res.json({
        employee: {
          id: employee.id,
          nombre: employee.nombre,
          apellidoPaterno: employee.apellidoPaterno,
          apellidoMaterno: employee.apellidoMaterno,
          numeroEmpleado: employee.numeroEmpleado,
          email: employee.email || employee.correo,
          telefono: employee.telefono,
          puesto: employee.puesto,
          departamento: employee.departamento,
          fechaIngreso: employee.fechaIngreso,
          diasVacacionesDisponibles: parseFloat(employee.saldoVacacionesActual as string) || 0,
          rfc: employee.rfc,
          curp: employee.curp,
          nss: employee.nss,
          banco: employee.banco,
          clabe: employee.clabe,
          calle: employee.calle,
          numeroExterior: employee.numeroExterior,
          colonia: employee.colonia,
          municipio: employee.municipio,
          estado: employee.estado,
          codigoPostal: employee.codigoPostal,
          tipoContrato: employee.tipoContrato,
          horario: employee.horario,
        },
      });
    } catch (error: any) {
      res.status(401).json({ message: "Sesión inválida" });
    }
  });

  // Portal Auth - Logout
  app.post("/api/portal/:clienteId/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Error al cerrar sesión" });
      }
      res.clearCookie("connect.sid");
      res.json({ success: true, message: "Sesión cerrada" });
    });
  });

  // Portal Dashboard - Get dashboard data for employee
  app.get("/api/portal/dashboard", requireEmployeeAuth, async (req, res) => {
    try {
      const empleadoId = req.user?.empleadoId || req.session?.user?.empleadoId;
      if (!empleadoId) {
        return res.status(400).json({ message: "No hay empleado asociado" });
      }

      const employee = await storage.getEmployee(empleadoId);
      if (!employee) {
        return res.status(404).json({ message: "Empleado no encontrado" });
      }

      // Get vacation balance from kardex saldo (source of truth)
      const vacacionesDisponibles = parseFloat(employee.saldoVacacionesActual as string) || 0;

      // Get pending requests count (vacaciones + permisos)
      let solicitudesPendientes = 0;
      try {
        const vacacionesPendientes = await db
          .select({ count: sql<number>`count(*)` })
          .from(solicitudesVacaciones)
          .where(
            and(
              eq(solicitudesVacaciones.empleadoId, empleadoId),
              eq(solicitudesVacaciones.estatus, 'pendiente')
            )
          );
        const permisosPendientes = await db
          .select({ count: sql<number>`count(*)` })
          .from(solicitudesPermisos)
          .where(
            and(
              eq(solicitudesPermisos.empleadoId, empleadoId),
              eq(solicitudesPermisos.estatus, 'pendiente')
            )
          );
        solicitudesPendientes = Number(vacacionesPendientes[0]?.count || 0) + Number(permisosPendientes[0]?.count || 0);
      } catch (e) {
        // Tables might not exist, default to 0
        solicitudesPendientes = 0;
      }

      // TODO: Get latest payslip when nominas endpoint is ready
      const ultimoRecibo = null;

      // TODO: Get unread announcements count
      const anunciosPendientes = 0;

      // Get pending document solicitations count
      let documentosSolicitados = 0;
      try {
        documentosSolicitados = await storage.countSolicitudesDocumentosRHPendientesByEmpleado(empleadoId);
      } catch (e) {
        documentosSolicitados = 0;
      }

      // Get missing required documents count
      let documentosFaltantes = 0;
      try {
        const requiredDocTypes = ["ine", "curp", "comprobante_domicilio", "rfc", "nss"];
        const uploadedDocs = await db
          .select({ tipoDocumento: documentosEmpleado.tipoDocumento })
          .from(documentosEmpleado)
          .where(and(
            eq(documentosEmpleado.empleadoId, empleadoId),
            eq(documentosEmpleado.subidoPorEmpleado, true),
            eq(documentosEmpleado.estatus, "activo")
          ));
        const uploadedTypes = new Set(uploadedDocs.map(d => d.tipoDocumento).filter(Boolean));
        documentosFaltantes = requiredDocTypes.filter(type => !uploadedTypes.has(type)).length;
      } catch (e) {
        documentosFaltantes = 0;
      }

      res.json({
        vacacionesDisponibles,
        solicitudesPendientes,
        ultimoRecibo,
        anunciosPendientes,
        documentosSolicitados,
        documentosFaltantes,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Portal Profile - Get employee profile
  app.get("/api/portal/profile", requireEmployeeAuth, async (req, res) => {
    try {
      const empleadoId = req.user?.empleadoId || req.session?.user?.empleadoId;
      if (!empleadoId) {
        return res.status(400).json({ message: "No hay empleado asociado" });
      }

      const employee = await storage.getEmployee(empleadoId);
      if (!employee) {
        return res.status(404).json({ message: "Empleado no encontrado" });
      }

      res.json(employee);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Portal Profile - Update employee profile (identification & banking)
  app.patch("/api/portal/profile", requireEmployeeAuth, async (req, res) => {
    try {
      const empleadoId = req.user?.empleadoId || req.session?.user?.empleadoId;
      if (!empleadoId) {
        return res.status(400).json({ message: "No hay empleado asociado" });
      }

      const employee = await storage.getEmployee(empleadoId);
      if (!employee) {
        return res.status(404).json({ message: "Empleado no encontrado" });
      }

      const { rfc, curp, nss, banco, clabe } = req.body;

      // Build update object with only allowed fields
      const updateData: Record<string, string | undefined> = {};

      // Validate RFC format (13 chars for persona física)
      if (rfc !== undefined) {
        if (rfc && rfc.length !== 13) {
          return res.status(400).json({ message: "El RFC debe tener 13 caracteres" });
        }
        updateData.rfc = rfc || undefined;
      }

      // Validate CURP format (18 chars)
      if (curp !== undefined) {
        if (curp && curp.length !== 18) {
          return res.status(400).json({ message: "El CURP debe tener 18 caracteres" });
        }
        updateData.curp = curp || undefined;
      }

      // Validate NSS format (11 digits)
      if (nss !== undefined) {
        if (nss && (nss.length !== 11 || !/^\d+$/.test(nss))) {
          return res.status(400).json({ message: "El NSS debe tener 11 dígitos" });
        }
        updateData.nss = nss || undefined;
      }

      // Validate CLABE format (18 digits)
      if (clabe !== undefined) {
        if (clabe && (clabe.length !== 18 || !/^\d+$/.test(clabe))) {
          return res.status(400).json({ message: "La CLABE debe tener 18 dígitos" });
        }
        updateData.clabe = clabe || undefined;
      }

      // Banco doesn't need validation
      if (banco !== undefined) {
        updateData.banco = banco || undefined;
      }

      // Update employee
      if (Object.keys(updateData).length > 0) {
        await storage.updateEmployee(empleadoId, updateData);
      }

      const updatedEmployee = await storage.getEmployee(empleadoId);
      res.json({
        success: true,
        message: "Perfil actualizado correctamente",
        employee: updatedEmployee
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Portal Vacaciones - Get employee's vacation requests
  app.get("/api/portal/vacaciones", requireEmployeeAuth, async (req, res) => {
    try {
      const empleadoId = req.user?.empleadoId || req.session?.user?.empleadoId;
      if (!empleadoId) {
        return res.status(400).json({ message: "No hay empleado asociado" });
      }

      const vacaciones = await storage.getSolicitudesVacacionesByEmpleado(empleadoId);
      res.json(vacaciones);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Portal Vacaciones - Get vacation balance (using kardex + calculated values)
  app.get("/api/portal/vacaciones/saldo", requireEmployeeAuth, async (req, res) => {
    try {
      const empleadoId = req.user?.empleadoId || req.session?.user?.empleadoId;
      if (!empleadoId) {
        return res.status(400).json({ message: "No hay empleado asociado" });
      }

      const employee = await storage.getEmployee(empleadoId);
      if (!employee) {
        return res.status(404).json({ message: "Empleado no encontrado" });
      }

      // Calculate antigüedad from fechaIngreso
      let aniosAntiguedad = 0;
      if (employee.fechaIngreso) {
        const fechaIngreso = new Date(employee.fechaIngreso);
        const hoy = new Date();
        aniosAntiguedad = Math.floor((hoy.getTime() - fechaIngreso.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
        if (aniosAntiguedad < 1) aniosAntiguedad = 1; // At least 1 year for calculation purposes
      }

      // Get calculated annual days from scheme + antigüedad
      const { calcularSaldoVacaciones } = await import('./services/vacacionesService');
      const saldoDetalle = await calcularSaldoVacaciones(empleadoId);
      const resolution = await storage.resolveVacationDays(empleadoId, aniosAntiguedad);

      // Calculate used days from kardex (sum of disfrutados across all years)
      const diasUsados = saldoDetalle.saldoPorAnio.reduce((sum, a) => sum + a.diasDisfrutados, 0);

      res.json({
        disponibles: saldoDetalle.saldoTotal,
        usados: diasUsados,
        anuales: resolution.diasVacaciones,
        fuente: resolution.fuente,
        detallePorAnio: saldoDetalle.saldoPorAnio,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Portal Vacaciones - Create vacation request
  app.post("/api/portal/vacaciones", requireEmployeeAuth, async (req, res) => {
    try {
      const empleadoId = req.user?.empleadoId || req.session?.user?.empleadoId;
      if (!empleadoId) {
        return res.status(400).json({ message: "No hay empleado asociado" });
      }

      const employee = await storage.getEmployee(empleadoId);
      if (!employee) {
        return res.status(404).json({ message: "Empleado no encontrado" });
      }

      if (!employee.clienteId) {
        return res.status(400).json({ message: "El empleado no tiene cliente asignado" });
      }

      if (!employee.empresaId) {
        return res.status(400).json({ message: "El empleado no tiene empresa asignada. Contacta a Recursos Humanos." });
      }

      const validated = insertSolicitudVacacionesSchema.parse({
        ...req.body,
        clienteId: employee.clienteId,
        empresaId: employee.empresaId,
        empleadoId: empleadoId,
        estatus: "pendiente",
      });

      // Check if employee has enough days (use kardex saldo as source of truth)
      const diasDisponibles = parseFloat(employee.saldoVacacionesActual as string) || 0;
      if (validated.diasSolicitados > diasDisponibles) {
        return res.status(400).json({
          message: `Solo tienes ${diasDisponibles} días disponibles`
        });
      }

      const solicitud = await storage.createSolicitudVacaciones(validated);
      res.status(201).json(solicitud);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Datos inválidos", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  // Portal Permisos - Get employee's permission requests
  app.get("/api/portal/permisos", requireEmployeeAuth, async (req, res) => {
    try {
      const empleadoId = req.user?.empleadoId || req.session?.user?.empleadoId;
      if (!empleadoId) {
        return res.status(400).json({ message: "No hay empleado asociado" });
      }

      const permisos = await storage.getPermisosByEmpleado(empleadoId);
      res.json(permisos);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Portal Permisos - Create permission request
  app.post("/api/portal/permisos", requireEmployeeAuth, async (req, res) => {
    try {
      const empleadoId = req.user?.empleadoId || req.session?.user?.empleadoId;
      if (!empleadoId) {
        return res.status(400).json({ message: "No hay empleado asociado" });
      }

      const employee = await storage.getEmployee(empleadoId);
      if (!employee) {
        return res.status(404).json({ message: "Empleado no encontrado" });
      }

      if (!employee.clienteId) {
        return res.status(400).json({ message: "El empleado no tiene cliente asignado" });
      }

      if (!employee.empresaId) {
        return res.status(400).json({ message: "El empleado no tiene empresa asignada. Contacta a Recursos Humanos." });
      }

      const validated = insertSolicitudPermisoSchema.parse({
        ...req.body,
        clienteId: employee.clienteId,
        empresaId: employee.empresaId,
        empleadoId: empleadoId,
        estatus: "pendiente",
      });

      const solicitud = await storage.createSolicitudPermiso(validated);
      res.status(201).json(solicitud);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Datos inválidos", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  // Portal Incapacidades - Get employee's incapacidades (read-only)
  app.get("/api/portal/incapacidades", requireEmployeeAuth, async (req, res) => {
    try {
      const empleadoId = req.user?.empleadoId || req.session?.user?.empleadoId;
      if (!empleadoId) {
        return res.status(400).json({ message: "No hay empleado asociado" });
      }

      const incapacidades = await storage.getIncapacidadesByEmpleado(empleadoId);
      res.json(incapacidades);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Portal Incapacidades - Submit new incapacidad (pending verification)
  app.post("/api/portal/incapacidades", requireEmployeeAuth, async (req, res) => {
    try {
      const empleadoId = req.user?.empleadoId || req.session?.user?.empleadoId;

      if (!empleadoId) {
        return res.status(400).json({ message: "No hay empleado asociado" });
      }

      // Get employee to fetch clienteId and empresaId
      const employee = await storage.getEmployee(empleadoId);
      if (!employee) {
        return res.status(404).json({ message: "Empleado no encontrado" });
      }

      if (!employee.clienteId || !employee.empresaId) {
        return res.status(400).json({ message: "El empleado no tiene cliente o empresa asignada" });
      }

      // Validate request body
      const validated = insertIncapacidadPortalSchema.parse(req.body);

      // Check for overlapping incapacidades
      const overlaps = await storage.checkIncapacidadesOverlap(
        empleadoId,
        validated.fechaInicio,
        validated.fechaFin
      );

      if (overlaps.length > 0) {
        return res.status(409).json({
          message: "Ya existe una incapacidad registrada en este período",
          conflictos: overlaps
        });
      }

      // Calculate payment percentage based on type
      let porcentajePago = 60;
      if (validated.tipo === "riesgo_trabajo" || validated.tipo === "maternidad") {
        porcentajePago = 100;
      }

      // Create incapacidad with portal-specific defaults
      const incapacidad = await storage.createIncapacidad({
        clienteId: employee.clienteId,
        empresaId: employee.empresaId,
        empleadoId,
        tipo: validated.tipo,
        fechaInicio: validated.fechaInicio,
        fechaFin: validated.fechaFin,
        diasIncapacidad: validated.diasIncapacidad,
        numeroCertificado: validated.numeroCertificado || null,
        certificadoMedicoUrl: validated.certificadoMedicoUrl || null,
        unidadMedica: validated.unidadMedica || null,
        medicoNombre: validated.medicoNombre || null,
        porcentajePago,
        estatus: "activa",
        verificado: false, // Portal submissions need verification
        origenRegistro: "portal",
        registradoPor: empleadoId,
      });

      // Note: Attendance records are NOT created here - they are created when HR verifies

      res.status(201).json({
        ...incapacidad,
        message: "Incapacidad reportada. Será verificada por RH."
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Portal Notifications - Get unread count
  app.get("/api/portal/notificaciones/count", requireEmployeeAuth, async (req, res) => {
    try {
      // TODO: Implement when notifications table is ready
      res.json({ count: 0 });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Portal Solicitudes - Get all requests (vacaciones + permisos)
  app.get("/api/portal/solicitudes", requireEmployeeAuth, async (req, res) => {
    try {
      const empleadoId = req.user?.empleadoId || req.session?.user?.empleadoId;
      if (!empleadoId) {
        return res.status(400).json({ message: "No hay empleado asociado" });
      }

      const tipo = req.query.tipo as string | undefined;

      let vacacionesList: any[] = [];
      let permisosList: any[] = [];
      let incapacidadesList: any[] = [];

      // Query database directly like dashboard does
      if (!tipo || tipo === "all" || tipo === "vacaciones") {
        const vacacionesData = await db
          .select()
          .from(solicitudesVacaciones)
          .where(eq(solicitudesVacaciones.empleadoId, empleadoId))
          .orderBy(desc(solicitudesVacaciones.fechaSolicitud));

        vacacionesList = vacacionesData.map(v => ({
          ...v,
          tipo: "vacaciones",
          dias: v.diasSolicitados,
        }));
      }

      if (!tipo || tipo === "all" || tipo === "permisos") {
        const permisosData = await db
          .select()
          .from(solicitudesPermisos)
          .where(eq(solicitudesPermisos.empleadoId, empleadoId))
          .orderBy(desc(solicitudesPermisos.fechaSolicitud));

        permisosList = permisosData.map(p => ({
          ...p,
          tipo: "permiso",
          dias: Number(p.diasSolicitados),
        }));
      }

      if (!tipo || tipo === "all" || tipo === "incapacidades") {
        const incapacidadesData = await db
          .select()
          .from(incapacidades)
          .where(eq(incapacidades.empleadoId, empleadoId))
          .orderBy(desc(incapacidades.createdAt));

        incapacidadesList = incapacidadesData.map(i => ({
          ...i,
          tipo: "incapacidad",
          dias: i.diasIncapacidad,
          fechaSolicitud: i.createdAt,
          // Map verification status to estatus for display
          estatus: i.motivoRechazo ? "rechazada" : (i.verificado ? "aprobada" : "pendiente"),
          verificado: i.verificado,
          motivoRechazo: i.motivoRechazo,
        }));
      }

      // Combine and sort by date
      const solicitudes = [...vacacionesList, ...permisosList, ...incapacidadesList].sort(
        (a, b) => new Date(b.fechaSolicitud).getTime() - new Date(a.fechaSolicitud).getTime()
      );

      res.json(solicitudes);
    } catch (error: any) {
      console.error("Error fetching solicitudes:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // ============================================================================
  // CURSOS Y CAPACITACIONES (Training & Courses LMS)
  // ============================================================================

  // --- Course Categories ---
  app.get("/api/categorias-cursos", async (req, res) => {
    try {
      const clienteId = getEffectiveClienteId(req);
      if (!clienteId) {
        return res.status(400).json({ message: "Cliente ID requerido. Pasa ?clienteId=XXX en la URL." });
      }
      const categorias = await storage.getCategoriasCursos(clienteId);
      res.json(categorias);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/categorias-cursos", async (req, res) => {
    try {
      const clienteId = req.session?.user?.clienteId;
      if (!clienteId) {
        return res.status(400).json({ message: "Cliente ID requerido" });
      }
      const validated = insertCategoriaCursoSchema.parse({ ...req.body, clienteId });
      const categoria = await storage.createCategoriaCurso(validated);
      res.status(201).json(categoria);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Datos inválidos", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/categorias-cursos/:id", async (req, res) => {
    try {
      const categoria = await storage.updateCategoriaCurso(req.params.id, req.body);
      res.json(categoria);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/categorias-cursos/:id", async (req, res) => {
    try {
      await storage.deleteCategoriaCurso(req.params.id);
      res.json({ message: "Categoría eliminada" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // --- Courses ---
  app.get("/api/cursos", async (req, res) => {
    try {
      const clienteId = getEffectiveClienteId(req);
      if (!clienteId) {
        return res.status(400).json({ message: "Cliente ID requerido. Pasa ?clienteId=XXX en la URL." });
      }
      const estatus = req.query.estatus as string | undefined;
      const cursos = await storage.getCursos(clienteId, estatus);
      res.json(cursos);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/cursos/:id", async (req, res) => {
    try {
      const curso = await storage.getCurso(req.params.id);
      if (!curso) {
        return res.status(404).json({ message: "Curso no encontrado" });
      }
      res.json(curso);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/cursos/:id/completo", async (req, res) => {
    try {
      const cursoCompleto = await storage.getCursoCompleto(req.params.id);
      if (!cursoCompleto) {
        return res.status(404).json({ message: "Curso no encontrado" });
      }
      res.json(cursoCompleto);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/cursos", async (req, res) => {
    try {
      const clienteId = req.session?.user?.clienteId;
      const userId = req.session?.user?.id;
      if (!clienteId) {
        return res.status(400).json({ message: "Cliente ID requerido" });
      }
      const validated = insertCursoSchema.parse({
        ...req.body,
        clienteId,
        createdBy: userId
      });
      const curso = await storage.createCurso(validated);
      res.status(201).json(curso);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Datos inválidos", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/cursos/:id", async (req, res) => {
    try {
      const curso = await storage.updateCurso(req.params.id, req.body);
      res.json(curso);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/cursos/:id", async (req, res) => {
    try {
      await storage.deleteCurso(req.params.id);
      res.json({ message: "Curso eliminado" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/cursos/:id/publicar", async (req, res) => {
    try {
      const curso = await storage.publicarCurso(req.params.id);
      res.json(curso);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/cursos/:id/archivar", async (req, res) => {
    try {
      const curso = await storage.archivarCurso(req.params.id);
      res.json(curso);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // --- Course Modules ---
  app.get("/api/cursos/:cursoId/modulos", async (req, res) => {
    try {
      const modulos = await storage.getModulosCurso(req.params.cursoId);
      res.json(modulos);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/cursos/:cursoId/modulos", async (req, res) => {
    try {
      const validated = insertModuloCursoSchema.parse({
        ...req.body,
        cursoId: req.params.cursoId
      });
      const modulo = await storage.createModuloCurso(validated);
      res.status(201).json(modulo);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Datos inválidos", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/cursos/:cursoId/modulos/:id", async (req, res) => {
    try {
      const modulo = await storage.updateModuloCurso(req.params.id, req.body);
      res.json(modulo);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/cursos/:cursoId/modulos/:id", async (req, res) => {
    try {
      await storage.deleteModuloCurso(req.params.id);
      res.json({ message: "Módulo eliminado" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/cursos/:cursoId/modulos/reordenar", async (req, res) => {
    try {
      const { ordenIds } = req.body;
      if (!Array.isArray(ordenIds)) {
        return res.status(400).json({ message: "ordenIds debe ser un array" });
      }
      await storage.reordenarModulosCurso(req.params.cursoId, ordenIds);
      res.json({ message: "Módulos reordenados" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // --- Course Lessons ---
  app.get("/api/modulos/:moduloId/lecciones", async (req, res) => {
    try {
      const lecciones = await storage.getLeccionesCurso(req.params.moduloId);
      res.json(lecciones);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/modulos/:moduloId/lecciones", async (req, res) => {
    try {
      const validated = insertLeccionCursoSchema.parse({
        ...req.body,
        moduloId: req.params.moduloId
      });
      const leccion = await storage.createLeccionCurso(validated);
      res.status(201).json(leccion);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Datos inválidos", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/lecciones/:id", async (req, res) => {
    try {
      const leccion = await storage.getLeccionCurso(req.params.id);
      if (!leccion) {
        return res.status(404).json({ message: "Lección no encontrada" });
      }
      res.json(leccion);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/lecciones/:id", async (req, res) => {
    try {
      const leccion = await storage.updateLeccionCurso(req.params.id, req.body);
      res.json(leccion);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/lecciones/:id", async (req, res) => {
    try {
      await storage.deleteLeccionCurso(req.params.id);
      res.json({ message: "Lección eliminada" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // --- Quizzes ---
  app.get("/api/cursos/:cursoId/quizzes", async (req, res) => {
    try {
      const quizzes = await storage.getQuizzesCurso(req.params.cursoId);
      // Include preguntas for each quiz
      const quizzesConPreguntas = await Promise.all(
        quizzes.map(async (quiz) => {
          const preguntas = await storage.getPreguntasQuiz(quiz.id);
          return { ...quiz, preguntas };
        })
      );
      res.json(quizzesConPreguntas);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/cursos/:cursoId/quizzes", async (req, res) => {
    try {
      const validated = insertQuizCursoSchema.parse({
        ...req.body,
        cursoId: req.params.cursoId
      });
      const quiz = await storage.createQuizCurso(validated);
      res.status(201).json(quiz);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Datos inválidos", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/quizzes/:id", async (req, res) => {
    try {
      const quiz = await storage.getQuizCurso(req.params.id);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz no encontrado" });
      }
      res.json(quiz);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/quizzes/:id", async (req, res) => {
    try {
      const quiz = await storage.updateQuizCurso(req.params.id, req.body);
      res.json(quiz);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/quizzes/:id", async (req, res) => {
    try {
      await storage.deleteQuizCurso(req.params.id);
      res.json({ message: "Quiz eliminado" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // --- Quiz Questions ---
  app.get("/api/quizzes/:quizId/preguntas", async (req, res) => {
    try {
      const preguntas = await storage.getPreguntasQuiz(req.params.quizId);
      res.json(preguntas);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/quizzes/:quizId/preguntas", async (req, res) => {
    try {
      const validated = insertPreguntaQuizSchema.parse({
        ...req.body,
        quizId: req.params.quizId
      });
      const pregunta = await storage.createPreguntaQuiz(validated);
      res.status(201).json(pregunta);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Datos inválidos", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/preguntas/:id", async (req, res) => {
    try {
      const pregunta = await storage.updatePreguntaQuiz(req.params.id, req.body);
      res.json(pregunta);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/preguntas/:id", async (req, res) => {
    try {
      await storage.deletePreguntaQuiz(req.params.id);
      res.json({ message: "Pregunta eliminada" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // --- Assignment Rules ---
  app.get("/api/reglas-asignacion-cursos", async (req, res) => {
    try {
      const clienteId = req.session?.user?.clienteId;
      if (!clienteId) {
        return res.status(400).json({ message: "Cliente ID requerido" });
      }
      const activo = req.query.activo === "true" ? true : req.query.activo === "false" ? false : undefined;
      const reglas = await storage.getReglasAsignacionCursos(clienteId, activo);

      // Enrich with course, departamento, and puesto details
      const reglasConDetalles = await Promise.all(
        reglas.map(async (regla) => {
          const [curso, departamento, puesto] = await Promise.all([
            storage.getCurso(regla.cursoId),
            regla.departamentoId ? storage.getDepartamento(regla.departamentoId) : null,
            regla.puestoId ? storage.getPuesto(regla.puestoId) : null,
          ]);
          return { ...regla, curso, departamento, puesto };
        })
      );

      res.json(reglasConDetalles);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/cursos/:cursoId/reglas-asignacion", async (req, res) => {
    try {
      const reglas = await storage.getReglasAsignacionByCurso(req.params.cursoId);
      res.json(reglas);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/reglas-asignacion-cursos", async (req, res) => {
    try {
      const clienteId = req.session?.user?.clienteId;
      if (!clienteId) {
        return res.status(400).json({ message: "Cliente ID requerido" });
      }
      const validated = insertReglaAsignacionCursoSchema.parse({ ...req.body, clienteId });
      const regla = await storage.createReglaAsignacionCurso(validated);
      res.status(201).json(regla);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Datos inválidos", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/reglas-asignacion-cursos/:id", async (req, res) => {
    try {
      const regla = await storage.updateReglaAsignacionCurso(req.params.id, req.body);
      res.json(regla);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/reglas-asignacion-cursos/:id", async (req, res) => {
    try {
      await storage.deleteReglaAsignacionCurso(req.params.id);
      res.json({ message: "Regla eliminada" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Execute assignment rules manually
  app.post("/api/reglas-asignacion-cursos/ejecutar", async (req, res) => {
    try {
      const clienteId = req.session?.user?.clienteId;
      const userId = req.session?.user?.id;
      if (!clienteId) {
        return res.status(400).json({ message: "Cliente ID requerido" });
      }

      // Get all active rules for this client
      const reglas = await storage.getReglasAsignacionCursos(clienteId);
      const reglasActivas = reglas.filter(r => r.activa);

      let totalAsignaciones = 0;

      for (const regla of reglasActivas) {
        // Get employees matching this rule's criteria
        const empleados = await storage.getEmployees(clienteId);
        const empleadosFiltrados = empleados.filter(e => {
          if (e.estatus !== "activo") return false;
          if (regla.departamentoId && e.departamentoId !== regla.departamentoId) return false;
          if (regla.puestoId && e.puestoId !== regla.puestoId) return false;
          return true;
        });

        // Get existing assignments for this course
        const asignacionesExistentes = await storage.getAsignacionesCursos(clienteId, { cursoId: regla.cursoId });
        const empleadosYaAsignados = new Set(asignacionesExistentes.map(a => a.empleadoId));

        // Create assignments for employees not yet assigned
        const empleadosSinAsignar = empleadosFiltrados.filter(e => !empleadosYaAsignados.has(e.id));

        if (empleadosSinAsignar.length > 0) {
          const fechaVencimiento = regla.diasParaCompletar
            ? new Date(Date.now() + regla.diasParaCompletar * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            : null;

          await storage.createAsignacionesCursosBulk({
            clienteId,
            cursoId: regla.cursoId,
            empleadoIds: empleadosSinAsignar.map(e => e.id),
            asignadoPor: userId!,
            esObligatorio: true,
            fechaVencimiento,
            origen: "regla_automatica",
            reglaOrigenId: regla.id,
          });

          totalAsignaciones += empleadosSinAsignar.length;
        }
      }

      res.json({ asignaciones: totalAsignaciones, reglasEjecutadas: reglasActivas.length });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // --- Course Assignments ---
  app.get("/api/asignaciones-cursos", async (req, res) => {
    try {
      const clienteId = getEffectiveClienteId(req);
      if (!clienteId) {
        return res.status(400).json({ message: "Cliente ID requerido. Pasa ?clienteId=XXX en la URL." });
      }
      const filters = {
        empleadoId: req.query.empleadoId as string | undefined,
        cursoId: req.query.cursoId as string | undefined,
        estatus: req.query.estatus as string | undefined,
        esObligatorio: req.query.esObligatorio === "true" ? true : req.query.esObligatorio === "false" ? false : undefined
      };
      const asignaciones = await storage.getAsignacionesCursos(clienteId, filters);

      // Enrich with employee and course details
      const asignacionesConDetalles = await Promise.all(
        asignaciones.map(async (asig) => {
          const [curso, empleado] = await Promise.all([
            storage.getCurso(asig.cursoId),
            storage.getEmployee(asig.empleadoId),
          ]);
          return { ...asig, curso, empleado };
        })
      );

      res.json(asignacionesConDetalles);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/asignaciones-cursos/vencidas", async (req, res) => {
    try {
      const clienteId = getEffectiveClienteId(req);
      if (!clienteId) {
        return res.status(400).json({ message: "Cliente ID requerido. Pasa ?clienteId=XXX en la URL." });
      }
      const asignaciones = await storage.getAsignacionesCursosVencidas(clienteId);
      res.json(asignaciones);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/asignaciones-cursos/:id", async (req, res) => {
    try {
      const asignacion = await storage.getAsignacionCurso(req.params.id);
      if (!asignacion) {
        return res.status(404).json({ message: "Asignación no encontrada" });
      }
      res.json(asignacion);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/asignaciones-cursos", async (req, res) => {
    try {
      const clienteId = req.body.clienteId || getEffectiveClienteId(req);
      const userId = req.session?.user?.id;
      if (!clienteId) {
        return res.status(400).json({ message: "Cliente ID requerido" });
      }
      const validated = insertAsignacionCursoSchema.parse({
        ...req.body,
        clienteId,
        asignadoPor: userId
      });
      const asignacion = await storage.createAsignacionCurso(validated);
      res.status(201).json(asignacion);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Datos inválidos", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  // Bulk assignment
  app.post("/api/asignaciones-cursos/bulk", async (req, res) => {
    try {
      console.log("Bulk assignment request body:", JSON.stringify(req.body, null, 2));

      // Get clienteId from body (for MaxTalent users) or session (for client users)
      const clienteId = req.body.clienteId || getEffectiveClienteId(req);
      const userId = req.session?.user?.id;
      if (!clienteId) {
        return res.status(400).json({ message: "Cliente ID requerido" });
      }

      const { empleadoIds, cursoId, cursoIds: cursoIdsParam, empresaId, tipoAsignacion, esObligatorio, diasParaCompletar, fechaVencimiento: bodyFechaVencimiento } = req.body;
      // Support both cursoId (single) and cursoIds (array)
      const cursoIds = cursoIdsParam || (cursoId ? [cursoId] : []);

      if (!Array.isArray(empleadoIds) || empleadoIds.length === 0) {
        return res.status(400).json({ message: "empleadoIds debe ser un array con al menos un elemento" });
      }
      if (!Array.isArray(cursoIds) || cursoIds.length === 0) {
        return res.status(400).json({ message: "Debe especificar al menos un curso" });
      }

      // Support fechaVencimiento from body or calculate from diasParaCompletar
      const fechaVencimiento = bodyFechaVencimiento || (diasParaCompletar
        ? new Date(Date.now() + diasParaCompletar * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        : null);

      // Get employee data to fetch empresaId for each employee
      const employeeData = await storage.getEmployeesByIds(empleadoIds);
      console.log("Employee data fetched:", employeeData.map(e => ({ id: e.id, empresaId: e.empresaId })));
      const employeeMap = new Map(employeeData.map(e => [e.id, e]));

      // Get default empresa for cliente if needed
      let defaultEmpresaId = empresaId;
      if (!defaultEmpresaId) {
        const clienteEmpresas = await storage.getEmpresasByCliente(clienteId);
        console.log("Cliente empresas:", clienteEmpresas.map(e => ({ id: e.id, nombre: e.razonSocial })));
        if (clienteEmpresas.length > 0) {
          defaultEmpresaId = clienteEmpresas[0].id;
        }
      }
      console.log("Default empresaId:", defaultEmpresaId);

      const asignaciones = [];
      for (const empleadoId of empleadoIds) {
        const employee = employeeMap.get(empleadoId);
        if (!employee) continue; // Skip if employee not found

        const empEmpresaId = employee.empresaId || defaultEmpresaId;
        if (!empEmpresaId) continue; // Skip if no empresaId available

        for (const cursoId of cursoIds) {
          asignaciones.push({
            clienteId,
            empresaId: empEmpresaId,
            empleadoId,
            cursoId,
            tipoAsignacion: tipoAsignacion || 'manual',
            esObligatorio: esObligatorio ?? false,
            asignadoPor: userId,
            fechaVencimiento
          });
        }
      }

      console.log("Asignaciones to create:", JSON.stringify(asignaciones, null, 2));

      if (asignaciones.length === 0) {
        return res.status(400).json({
          message: "No se pudieron crear asignaciones. Verifica que los empleados seleccionados tengan una empresa asignada."
        });
      }

      const created = await storage.createAsignacionesCursosBulk(asignaciones);
      res.status(201).json({ asignados: created.length, asignaciones: created });
    } catch (error: any) {
      console.error("Error in bulk assignment:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/asignaciones-cursos/:id", async (req, res) => {
    try {
      const asignacion = await storage.updateAsignacionCurso(req.params.id, req.body);
      res.json(asignacion);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/asignaciones-cursos/:id", async (req, res) => {
    try {
      await storage.deleteAsignacionCurso(req.params.id);
      res.json({ message: "Asignación eliminada" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Re-send notification (placeholder - integrate with your notification system)
  app.post("/api/asignaciones-cursos/:id/notificar", async (req, res) => {
    try {
      const asignacion = await storage.getAsignacionCurso(req.params.id);
      if (!asignacion) {
        return res.status(404).json({ message: "Asignación no encontrada" });
      }
      // TODO: Integrate with notification system (email, push, etc.)
      // For now, just return success
      res.json({ message: "Notificación enviada" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // --- Certificates ---
  app.get("/api/certificados-cursos", async (req, res) => {
    try {
      const clienteId = req.session?.user?.clienteId;
      if (!clienteId) {
        return res.status(400).json({ message: "Cliente ID requerido" });
      }
      const filters = {
        empleadoId: req.query.empleadoId as string | undefined,
        cursoId: req.query.cursoId as string | undefined,
        estatus: req.query.estatus as string | undefined
      };
      const certificados = await storage.getCertificadosCursos(clienteId, filters);

      // Enrich with employee and course details
      const certificadosConDetalles = await Promise.all(
        certificados.map(async (cert) => {
          const [curso, empleado] = await Promise.all([
            storage.getCurso(cert.cursoId),
            storage.getEmployee(cert.empleadoId),
          ]);
          return { ...cert, curso, empleado };
        })
      );

      res.json(certificadosConDetalles);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/certificados-cursos/verificar/:codigo", async (req, res) => {
    try {
      const certificado = await storage.getCertificadoByCodigo(req.params.codigo);
      if (!certificado) {
        return res.status(404).json({ message: "Certificado no encontrado", valido: false });
      }
      res.json({ ...certificado, valido: certificado.estatus === 'activo' });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ============================================================================
  // PORTAL - Cursos y Evaluaciones (Employee Portal)
  // ============================================================================

  // Get employee's assigned courses
  app.get("/api/portal/mis-cursos", requireEmployeeAuth, async (req, res) => {
    try {
      const empleadoId = req.user?.empleadoId || req.session?.user?.empleadoId;
      if (!empleadoId) {
        return res.status(400).json({ message: "No hay empleado asociado" });
      }

      const asignaciones = await storage.getAsignacionesCursosByEmpleado(empleadoId);

      // Enrich with course details
      const cursosConDetalles = await Promise.all(
        asignaciones.map(async (asignacion) => {
          const curso = await storage.getCurso(asignacion.cursoId);
          return {
            ...asignacion,
            curso
          };
        })
      );

      res.json(cursosConDetalles);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get specific course for player
  app.get("/api/portal/cursos/:asignacionId", requireEmployeeAuth, async (req, res) => {
    try {
      const empleadoId = req.session?.user?.empleadoId;
      const asignacion = await storage.getAsignacionCurso(req.params.asignacionId);

      if (!asignacion || asignacion.empleadoId !== empleadoId) {
        return res.status(404).json({ message: "Curso no encontrado" });
      }

      const cursoCompleto = await storage.getCursoCompleto(asignacion.cursoId);
      const progresos = await storage.getProgresoLeccionesByAsignacion(asignacion.id);

      res.json({
        asignacion,
        ...cursoCompleto,
        progresos
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Start a course
  app.post("/api/portal/cursos/:asignacionId/iniciar", requireEmployeeAuth, async (req, res) => {
    try {
      const empleadoId = req.session?.user?.empleadoId;
      const asignacion = await storage.getAsignacionCurso(req.params.asignacionId);

      if (!asignacion || asignacion.empleadoId !== empleadoId) {
        return res.status(404).json({ message: "Curso no encontrado" });
      }

      if (asignacion.estatus !== 'asignado') {
        return res.status(400).json({ message: "El curso ya fue iniciado" });
      }

      const updated = await storage.iniciarCurso(req.params.asignacionId);
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Mark lesson as complete
  app.post("/api/portal/lecciones/:leccionId/completar", requireEmployeeAuth, async (req, res) => {
    try {
      const empleadoId = req.session?.user?.empleadoId;
      const { asignacionId, tiempoSegundos } = req.body;

      const asignacion = await storage.getAsignacionCurso(asignacionId);
      if (!asignacion || asignacion.empleadoId !== empleadoId) {
        return res.status(403).json({ message: "No autorizado" });
      }

      const progreso = await storage.completarLeccion(asignacionId, req.params.leccionId, tiempoSegundos);

      // Update overall course progress
      const porcentaje = await storage.calcularProgresoCurso(asignacionId);
      await storage.updateAsignacionCurso(asignacionId, { porcentajeProgreso: porcentaje });

      res.json(progreso);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Update lesson progress (partial)
  app.post("/api/portal/lecciones/:leccionId/progreso", requireEmployeeAuth, async (req, res) => {
    try {
      const empleadoId = req.session?.user?.empleadoId;
      const { asignacionId, porcentajeProgreso, tiempoSegundos } = req.body;

      const asignacion = await storage.getAsignacionCurso(asignacionId);
      if (!asignacion || asignacion.empleadoId !== empleadoId) {
        return res.status(403).json({ message: "No autorizado" });
      }

      let progreso = await storage.getProgresoLeccion(asignacionId, req.params.leccionId);

      if (progreso) {
        progreso = await storage.updateProgresoLeccion(progreso.id, {
          porcentajeProgreso,
          estatus: porcentajeProgreso >= 100 ? 'completado' : 'en_progreso',
          tiempoInvertidoSegundos: (progreso.tiempoInvertidoSegundos || 0) + (tiempoSegundos || 0),
          fechaCompletado: porcentajeProgreso >= 100 ? new Date() : undefined
        });
      } else {
        progreso = await storage.createProgresoLeccion({
          asignacionId,
          leccionId: req.params.leccionId,
          porcentajeProgreso,
          estatus: porcentajeProgreso >= 100 ? 'completado' : 'en_progreso',
          fechaInicio: new Date(),
          tiempoInvertidoSegundos: tiempoSegundos || 0,
          fechaCompletado: porcentajeProgreso >= 100 ? new Date() : undefined
        });
      }

      res.json(progreso);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Start quiz attempt
  app.post("/api/portal/quizzes/:quizId/iniciar", requireEmployeeAuth, async (req, res) => {
    try {
      const empleadoId = req.user?.empleadoId || req.session?.user?.empleadoId;
      const { asignacionId } = req.body;

      if (!empleadoId) {
        return res.status(400).json({ message: "No hay empleado asociado" });
      }

      const asignacion = await storage.getAsignacionCurso(asignacionId);
      if (!asignacion || asignacion.empleadoId !== empleadoId) {
        return res.status(403).json({ message: "No autorizado" });
      }

      const quiz = await storage.getQuizCurso(req.params.quizId);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz no encontrado" });
      }

      // Check attempt limits
      const intentosAnteriores = await storage.getIntentosQuiz(asignacionId, req.params.quizId);
      if (quiz.intentosMaximos && intentosAnteriores.length >= quiz.intentosMaximos) {
        return res.status(400).json({ message: "Has alcanzado el máximo de intentos permitidos" });
      }

      const intento = await storage.createIntentoQuiz({
        asignacionId,
        quizId: req.params.quizId,
        empleadoId,
        numeroIntento: intentosAnteriores.length + 1,
        fechaInicio: new Date(),
        estatus: 'en_progreso'
      });

      // Get questions (optionally shuffled)
      let preguntas = await storage.getPreguntasQuiz(req.params.quizId);
      if (quiz.ordenAleatorio) {
        preguntas = preguntas.sort(() => Math.random() - 0.5);
      }

      res.status(201).json({
        intento,
        preguntas: preguntas.map(p => ({
          ...p,
          // Remove correct answers from response
          opciones: quiz.tipo === 'certification_exam'
            ? (p.opciones as any[])?.map(o => ({ id: o.id, texto: o.texto }))
            : p.opciones
        })),
        tiempoLimiteMinutos: quiz.tiempoLimiteMinutos
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Submit quiz
  app.post("/api/portal/intentos/:intentoId/finalizar", requireEmployeeAuth, async (req, res) => {
    try {
      const empleadoId = req.session?.user?.empleadoId;
      const { respuestas } = req.body;

      const intento = await storage.getIntentoQuiz(req.params.intentoId);
      if (!intento || intento.empleadoId !== empleadoId) {
        return res.status(403).json({ message: "No autorizado" });
      }

      if (intento.estatus !== 'en_progreso') {
        return res.status(400).json({ message: "Este intento ya fue finalizado" });
      }

      // Get quiz questions to grade
      const preguntas = await storage.getPreguntasQuiz(intento.quizId);
      const quiz = await storage.getQuizCurso(intento.quizId);

      let puntosObtenidos = 0;
      let puntosMaximos = 0;
      const respuestasCalificadas = [];

      for (const pregunta of preguntas) {
        const respuesta = respuestas?.find((r: any) => r.preguntaId === pregunta.id);
        const puntosPregunta = pregunta.puntos || 1;
        puntosMaximos += puntosPregunta;

        let esCorrecta = false;
        if (respuesta && pregunta.opciones) {
          const opciones = pregunta.opciones as { id: string; texto: string; esCorrecta: boolean }[];

          if (pregunta.tipoPregunta === 'multiple_choice' || pregunta.tipoPregunta === 'true_false') {
            const opcionCorrecta = opciones.find(o => o.esCorrecta);
            esCorrecta = opcionCorrecta?.id === respuesta.respuesta;
          } else if (pregunta.tipoPregunta === 'multiple_select') {
            const correctasIds = opciones.filter(o => o.esCorrecta).map(o => o.id).sort();
            const seleccionadasIds = (respuesta.respuesta || []).sort();
            esCorrecta = JSON.stringify(correctasIds) === JSON.stringify(seleccionadasIds);
          }
        }

        if (esCorrecta) {
          puntosObtenidos += puntosPregunta;
        }

        respuestasCalificadas.push({
          preguntaId: pregunta.id,
          respuesta: respuesta?.respuesta,
          esCorrecta,
          puntosObtenidos: esCorrecta ? puntosPregunta : 0
        });
      }

      const intentoFinalizado = await storage.finalizarIntentoQuiz(
        req.params.intentoId,
        respuestasCalificadas,
        puntosObtenidos,
        puntosMaximos
      );

      // Update assignment if passed
      if (intentoFinalizado.aprobado) {
        const asignacion = await storage.getAsignacionCurso(intento.asignacionId);
        if (asignacion) {
          await storage.updateAsignacionCurso(intento.asignacionId, {
            intentosRealizados: (asignacion.intentosRealizados || 0) + 1,
            calificacionFinal: intentoFinalizado.calificacion ?? undefined,
            aprobado: true
          });
        }
      }

      // Return result with correct answers if allowed
      const mostrarRespuestas = quiz?.mostrarRespuestasCorrectas && quiz.tipo !== 'certification_exam';

      res.json({
        ...intentoFinalizado,
        respuestasCorrectas: mostrarRespuestas ? respuestasCalificadas : undefined
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get employee's certificates
  app.get("/api/portal/certificados", requireEmployeeAuth, async (req, res) => {
    try {
      const empleadoId = req.user?.empleadoId || req.session?.user?.empleadoId;
      if (!empleadoId) {
        return res.status(400).json({ message: "No hay empleado asociado" });
      }

      const certificados = await storage.getCertificadosByEmpleado(empleadoId);
      res.json(certificados);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Submit quiz (combined init + submit for simpler UX)
  app.post("/api/portal/quiz/:quizId/submit", requireEmployeeAuth, async (req, res) => {
    try {
      const empleadoId = req.user?.empleadoId || req.session?.user?.empleadoId;
      const { asignacionId, respuestas } = req.body;

      if (!empleadoId) {
        return res.status(400).json({ message: "No hay empleado asociado" });
      }

      const asignacion = await storage.getAsignacionCurso(asignacionId);
      if (!asignacion || asignacion.empleadoId !== empleadoId) {
        return res.status(403).json({ message: "No autorizado" });
      }

      const quiz = await storage.getQuizCurso(req.params.quizId);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz no encontrado" });
      }

      // Check attempt limits
      const intentosAnteriores = await storage.getIntentosQuiz(asignacionId, req.params.quizId);
      if (quiz.intentosMaximos && intentosAnteriores.length >= quiz.intentosMaximos) {
        return res.status(400).json({ message: "Has alcanzado el máximo de intentos permitidos" });
      }

      // Create the attempt
      const intento = await storage.createIntentoQuiz({
        asignacionId,
        quizId: req.params.quizId,
        empleadoId,
        numeroIntento: intentosAnteriores.length + 1,
        fechaInicio: new Date(),
        estatus: 'en_progreso'
      });

      // Get quiz questions to grade
      const preguntas = await storage.getPreguntasQuiz(req.params.quizId);

      let puntosObtenidos = 0;
      let puntosMaximos = 0;
      const correctAnswers: Record<string, boolean> = {};
      const respuestasCalificadas = [];

      for (const pregunta of preguntas) {
        const respuestaUsuario = respuestas?.[pregunta.id];
        const puntosPregunta = pregunta.puntos || 1;
        puntosMaximos += puntosPregunta;

        let esCorrecta = false;
        const opciones = pregunta.opciones as { id?: string; texto: string; esCorrecta?: boolean }[] | null;

        if (respuestaUsuario !== undefined && opciones) {
          if (pregunta.tipoPregunta === 'true_false') {
            // For true/false, check if answer matches correcta field
            const correctAnswer = opciones.find(o => o.esCorrecta)?.texto?.toLowerCase();
            esCorrecta = (respuestaUsuario === 'true' && correctAnswer === 'verdadero') ||
                         (respuestaUsuario === 'false' && correctAnswer === 'falso');
          } else if (pregunta.tipoPregunta === 'multiple_choice') {
            // For multiple choice, respuestaUsuario is the index as string
            const selectedIndex = parseInt(respuestaUsuario, 10);
            esCorrecta = !isNaN(selectedIndex) && opciones[selectedIndex]?.esCorrecta === true;
          } else if (pregunta.tipoPregunta === 'multiple_select') {
            // For multiple select, compare arrays of correct indices
            const correctIndices = opciones
              .map((o, i) => o.esCorrecta ? String(i) : null)
              .filter(Boolean)
              .sort();
            const selectedIndices = (Array.isArray(respuestaUsuario) ? respuestaUsuario : []).sort();
            esCorrecta = JSON.stringify(correctIndices) === JSON.stringify(selectedIndices);
          }
        }

        if (esCorrecta) {
          puntosObtenidos += puntosPregunta;
        }

        correctAnswers[pregunta.id] = esCorrecta;

        respuestasCalificadas.push({
          preguntaId: pregunta.id,
          respuesta: respuestaUsuario,
          esCorrecta,
          puntosObtenidos: esCorrecta ? puntosPregunta : 0
        });
      }

      const calificacion = puntosMaximos > 0 ? Math.round((puntosObtenidos / puntosMaximos) * 100) : 0;
      const minScore = quiz.calificacionMinima || 70;
      const passed = calificacion >= minScore;

      // Finalize the attempt
      await storage.finalizarIntentoQuiz(
        intento.id,
        respuestasCalificadas,
        puntosObtenidos,
        puntosMaximos
      );

      // Find the lesson that has this quiz and mark it complete
      const cursoCompleto = await storage.getCursoCompleto(asignacion.cursoId);
      if (cursoCompleto) {
        for (const modulo of cursoCompleto.modulos) {
          for (const leccion of modulo.lecciones) {
            if ((leccion as any).quizId === req.params.quizId) {
              await storage.completarLeccion(asignacionId, leccion.id, 0);
              break;
            }
          }
        }
      }

      // Update course progress
      const porcentaje = await storage.calcularProgresoCurso(asignacionId);
      await storage.updateAsignacionCurso(asignacionId, {
        porcentajeProgreso: porcentaje,
        intentosRealizados: (asignacion.intentosRealizados || 0) + 1,
        ...(passed ? { calificacionFinal: calificacion, aprobado: true } : {})
      });

      res.json({
        score: calificacion,
        passed,
        minScore,
        correctAnswers
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ============================================================================
  // PORTAL - ASISTENCIA (Attendance)
  // ============================================================================

  // Get today's attendance status
  app.get("/api/portal/asistencia/hoy", requireEmployeeAuth, async (req, res) => {
    try {
      const empleadoId = req.user?.empleadoId || req.session?.user?.empleadoId;
      if (!empleadoId) {
        return res.status(400).json({ message: "No hay empleado asociado" });
      }

      const today = new Date().toISOString().split('T')[0];

      // Check if there's an attendance record for today
      const todayRecord = await db
        .select()
        .from(attendance)
        .where(
          and(
            eq(attendance.employeeId, empleadoId),
            eq(attendance.date, today)
          )
        )
        .limit(1);

      const record = todayRecord[0];

      // Check if current time is within lunch window (1:00 PM - 2:00 PM)
      // TEMP: Always allow lunch for testing
      const isLunchWindow = true;
      // const now = new Date();
      // const currentHour = now.getHours();
      // const isLunchWindow = currentHour >= 13 && currentHour < 14;

      res.json({
        checkedIn: !!record?.clockIn,
        horaEntrada: record?.clockIn || null,
        horaSalida: record?.clockOut || null,
        lunchOut: record?.lunchOut || null,
        lunchIn: record?.lunchIn || null,
        canCheckIn: !record?.clockIn,
        canCheckOut: !!record?.clockIn && !record?.clockOut && (!record?.lunchOut || !!record?.lunchIn),
        canLunchOut: isLunchWindow && !!record?.clockIn && !record?.lunchOut && !record?.clockOut,
        canLunchIn: !!record?.lunchOut && !record?.lunchIn,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get attendance records for a week
  app.get("/api/portal/asistencia", requireEmployeeAuth, async (req, res) => {
    try {
      const empleadoId = req.user?.empleadoId || req.session?.user?.empleadoId;
      if (!empleadoId) {
        return res.status(400).json({ message: "No hay empleado asociado" });
      }

      const weekStart = req.query.weekStart
        ? new Date(req.query.weekStart as string).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      const weekEndStr = weekEnd.toISOString().split('T')[0];

      const records = await db
        .select()
        .from(attendance)
        .where(
          and(
            eq(attendance.employeeId, empleadoId),
            gte(attendance.date, weekStart),
            lte(attendance.date, weekEndStr)
          )
        )
        .orderBy(attendance.date);

      // Map to frontend format
      res.json(records.map(r => ({
        id: r.id,
        fecha: r.date,
        horaEntrada: r.clockIn,
        horaSalida: r.clockOut,
        estado: r.status,
        tipoIncidencia: r.status, // For color mapping (vacaciones, incapacidad, falta, retardo, etc.)
      })));
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get monthly attendance summary
  app.get("/api/portal/asistencia/resumen", requireEmployeeAuth, async (req, res) => {
    try {
      const empleadoId = req.user?.empleadoId || req.session?.user?.empleadoId;
      if (!empleadoId) {
        return res.status(400).json({ message: "No hay empleado asociado" });
      }

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

      const records = await db
        .select()
        .from(attendance)
        .where(
          and(
            eq(attendance.employeeId, empleadoId),
            gte(attendance.date, monthStart),
            lte(attendance.date, monthEnd)
          )
        );

      // Also get incidences
      const incidencias = await db
        .select()
        .from(incidenciasAsistencia)
        .where(
          and(
            eq(incidenciasAsistencia.empleadoId, empleadoId),
            gte(incidenciasAsistencia.fecha, monthStart),
            lte(incidenciasAsistencia.fecha, monthEnd)
          )
        );

      const diasTrabajados = records.filter(r => r.clockIn && r.clockOut).length;
      const diasFaltas = incidencias.filter(i => i.tipoIncidencia === 'falta').length;
      const diasRetardos = incidencias.filter(i => i.tipoIncidencia === 'retardo').length;
      const horasExtrasTotal = incidencias
        .filter(i => i.tipoIncidencia === 'horas_extra')
        .reduce((sum, i) => sum + (Number(i.horasExtras) || 0), 0);

      res.json({
        diasTrabajados,
        diasFaltas,
        diasRetardos,
        horasExtrasTotal,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Check in
  app.post("/api/portal/asistencia/checkin", requireEmployeeAuth, async (req, res) => {
    try {
      const empleadoId = req.user?.empleadoId || req.session?.user?.empleadoId;
      const clienteId = req.user?.clienteId || req.session?.user?.clienteId;

      if (!empleadoId || !clienteId) {
        return res.status(400).json({ message: "No hay empleado asociado" });
      }

      // Fetch empresaId from employee record
      const emp = await db.select({ empresaId: employees.empresaId }).from(employees).where(eq(employees.id, empleadoId)).limit(1);
      const empresaId = emp[0]?.empresaId;

      if (!empresaId) {
        return res.status(400).json({ message: "No tienes una empresa asignada. Contacta a Recursos Humanos." });
      }

      // Use client's local time if provided, otherwise fallback to server time
      const { localTime, localDate } = req.body || {};
      const today = localDate || new Date().toISOString().split('T')[0];

      // Check if already checked in today
      const existing = await db
        .select()
        .from(attendance)
        .where(
          and(
            eq(attendance.employeeId, empleadoId),
            eq(attendance.date, today)
          )
        )
        .limit(1);

      if (existing[0]?.clockIn) {
        return res.status(400).json({ message: "Ya registraste tu entrada hoy" });
      }

      const clockIn = localTime || new Date().toTimeString().slice(0, 8);

      if (existing[0]) {
        // Update existing record
        await db
          .update(attendance)
          .set({ clockIn, status: 'presente' })
          .where(eq(attendance.id, existing[0].id));
      } else {
        // Create new record
        await db.insert(attendance).values({
          employeeId: empleadoId,
          clienteId,
          empresaId,
          date: today,
          clockIn,
          status: 'presente',
        });
      }

      res.json({ success: true, horaEntrada: clockIn });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Check out
  app.post("/api/portal/asistencia/checkout", requireEmployeeAuth, async (req, res) => {
    try {
      const empleadoId = req.user?.empleadoId || req.session?.user?.empleadoId;
      if (!empleadoId) {
        return res.status(400).json({ message: "No hay empleado asociado" });
      }

      // Use client's local time if provided, otherwise fallback to server time
      const { localTime, localDate } = req.body || {};
      const today = localDate || new Date().toISOString().split('T')[0];

      // Find today's record
      const existing = await db
        .select()
        .from(attendance)
        .where(
          and(
            eq(attendance.employeeId, empleadoId),
            eq(attendance.date, today)
          )
        )
        .limit(1);

      if (!existing[0]?.clockIn) {
        return res.status(400).json({ message: "Primero debes registrar tu entrada" });
      }

      if (existing[0]?.clockOut) {
        return res.status(400).json({ message: "Ya registraste tu salida hoy" });
      }

      const clockOut = localTime || new Date().toTimeString().slice(0, 8);

      await db
        .update(attendance)
        .set({ clockOut })
        .where(eq(attendance.id, existing[0].id));

      res.json({ success: true, horaSalida: clockOut });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Lunch out (salida a comida)
  app.post("/api/portal/asistencia/lunch-out", requireEmployeeAuth, async (req, res) => {
    try {
      const empleadoId = req.user?.empleadoId || req.session?.user?.empleadoId;
      if (!empleadoId) {
        return res.status(400).json({ message: "No hay empleado asociado" });
      }

      // Check if current time is within lunch window (1:00 PM - 2:00 PM)
      // TEMP: Disabled for testing
      // const now = new Date();
      // const currentHour = now.getHours();
      // if (currentHour < 13 || currentHour >= 14) {
      //   return res.status(400).json({ message: "El horario de comida es de 1:00 PM a 2:00 PM" });
      // }

      const { localTime, localDate } = req.body || {};
      const today = localDate || new Date().toISOString().split('T')[0];

      // Find today's record
      const existing = await db
        .select()
        .from(attendance)
        .where(
          and(
            eq(attendance.employeeId, empleadoId),
            eq(attendance.date, today)
          )
        )
        .limit(1);

      if (!existing[0]?.clockIn) {
        return res.status(400).json({ message: "Primero debes registrar tu entrada" });
      }

      if (existing[0]?.lunchOut) {
        return res.status(400).json({ message: "Ya registraste tu salida a comida hoy" });
      }

      if (existing[0]?.clockOut) {
        return res.status(400).json({ message: "Ya registraste tu salida final" });
      }

      const lunchOut = localTime || new Date().toTimeString().slice(0, 8);

      await db
        .update(attendance)
        .set({ lunchOut })
        .where(eq(attendance.id, existing[0].id));

      res.json({ success: true, lunchOut });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Lunch in (regreso de comida)
  app.post("/api/portal/asistencia/lunch-in", requireEmployeeAuth, async (req, res) => {
    try {
      const empleadoId = req.user?.empleadoId || req.session?.user?.empleadoId;
      if (!empleadoId) {
        return res.status(400).json({ message: "No hay empleado asociado" });
      }

      const { localTime, localDate } = req.body || {};
      const today = localDate || new Date().toISOString().split('T')[0];

      // Find today's record
      const existing = await db
        .select()
        .from(attendance)
        .where(
          and(
            eq(attendance.employeeId, empleadoId),
            eq(attendance.date, today)
          )
        )
        .limit(1);

      if (!existing[0]?.lunchOut) {
        return res.status(400).json({ message: "Primero debes registrar tu salida a comida" });
      }

      if (existing[0]?.lunchIn) {
        return res.status(400).json({ message: "Ya registraste tu regreso de comida hoy" });
      }

      const lunchIn = localTime || new Date().toTimeString().slice(0, 8);

      await db
        .update(attendance)
        .set({ lunchIn })
        .where(eq(attendance.id, existing[0].id));

      res.json({ success: true, lunchIn });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ============================================================================
  // PORTAL - DOCUMENTOS (Documents)
  // ============================================================================

  // Get employee's documents
  app.get("/api/portal/documentos", requireEmployeeAuth, async (req, res) => {
    try {
      const empleadoId = req.user?.empleadoId || req.session?.user?.empleadoId;
      if (!empleadoId) {
        return res.status(400).json({ message: "No hay empleado asociado" });
      }

      // Get documents from solicitudesDocumentos (portal requests)
      const docs = await db
        .select()
        .from(solicitudesDocumentos)
        .where(eq(solicitudesDocumentos.empleadoId, empleadoId))
        .orderBy(desc(solicitudesDocumentos.fechaSolicitud));

      res.json(docs.map(doc => ({
        id: doc.id,
        tipo: doc.tipoDocumento,
        tipoLabel: doc.nombre,
        nombre: doc.nombre,
        fechaGeneracion: doc.fechaGeneracion || doc.fechaSolicitud,
        estado: doc.estado,
        urlDescarga: doc.urlDescarga,
        tamanio: doc.tamanio,
        categoria: doc.categoria,
      })));
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get available document types
  app.get("/api/portal/documentos/tipos", requireEmployeeAuth, async (req, res) => {
    try {
      // Return standard document types employees can request
      res.json([
        {
          id: "constancia_laboral",
          nombre: "Constancia Laboral",
          descripcion: "Documento que acredita tu relación laboral",
          tiempoEstimado: "1-2 días hábiles",
        },
        {
          id: "constancia_ingresos",
          nombre: "Constancia de Ingresos",
          descripcion: "Documento con tu información salarial",
          tiempoEstimado: "1-2 días hábiles",
        },
        {
          id: "carta_recomendacion",
          nombre: "Carta de Recomendación",
          descripcion: "Carta oficial de recomendación laboral",
          tiempoEstimado: "3-5 días hábiles",
        },
      ]);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Request a document
  app.post("/api/portal/documentos/solicitar", requireEmployeeAuth, async (req, res) => {
    try {
      const empleadoId = req.user?.empleadoId || req.session?.user?.empleadoId;
      const clienteId = req.user?.clienteId || req.session?.user?.clienteId;
      if (!empleadoId || !clienteId) {
        return res.status(400).json({ message: "No hay empleado asociado" });
      }

      const { tipoDocumento } = req.body;
      if (!tipoDocumento) {
        return res.status(400).json({ message: "Tipo de documento requerido" });
      }

      // Map document type to readable name
      const nombreMap: Record<string, string> = {
        constancia_laboral: "Constancia Laboral",
        constancia_ingresos: "Constancia de Ingresos",
        carta_recomendacion: "Carta de Recomendación",
      };

      const nombre = nombreMap[tipoDocumento] || tipoDocumento.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());

      // Create a pending document request
      const doc = await db.insert(solicitudesDocumentos).values({
        empleadoId,
        clienteId,
        tipoDocumento,
        nombre,
        estado: 'pendiente',
        categoria: 'otros',
      }).returning();

      res.json({ success: true, documento: doc[0] });
    } catch (error: any) {
      console.error("Error creating document request:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get employee's personal documents (INE, CURP, RFC, etc.)
  app.get("/api/portal/documentos/personales", requireEmployeeAuth, async (req, res) => {
    try {
      const empleadoId = req.user?.empleadoId || req.session?.user?.empleadoId;
      if (!empleadoId) {
        return res.status(400).json({ message: "No hay empleado asociado" });
      }

      // Get personal documents uploaded by employee
      const docs = await db
        .select()
        .from(documentosEmpleado)
        .where(and(
          eq(documentosEmpleado.empleadoId, empleadoId),
          eq(documentosEmpleado.subidoPorEmpleado, true),
          eq(documentosEmpleado.estatus, "activo")
        ))
        .orderBy(desc(documentosEmpleado.createdAt));

      res.json(docs.map(doc => ({
        id: doc.id,
        tipo: doc.tipoDocumento || doc.categoria,
        tipoLabel: doc.nombre,
        nombre: doc.nombre,
        fechaGeneracion: doc.createdAt,
        estado: "generado" as const,
        urlDescarga: doc.archivoUrl,
        tamanio: doc.archivoTamano ? `${Math.round(doc.archivoTamano / 1024)} KB` : undefined,
        categoria: doc.categoria,
      })));
    } catch (error: any) {
      console.error("Error fetching personal documents:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get upload URL for personal document
  app.get("/api/portal/documentos/personales/upload-url", requireEmployeeAuth, async (req, res) => {
    try {
      const empleadoId = req.user?.empleadoId || req.session?.user?.empleadoId;
      if (!empleadoId) {
        return res.status(400).json({ message: "No hay empleado asociado" });
      }

      // Get signed upload URL from Supabase
      const filePath = `empleados/${empleadoId}/${randomUUID()}_upload`;
      const { signedUrl } = await supabaseStorage.getSignedUploadUrl("documentos-empleados", filePath);

      res.json({ uploadURL: signedUrl, path: filePath });
    } catch (error: any) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Complete personal document upload (after client uploads to signed URL)
  app.post("/api/portal/documentos/personales/complete-upload", requireEmployeeAuth, async (req, res) => {
    try {
      const empleadoId = req.user?.empleadoId || req.session?.user?.empleadoId;
      const clienteId = req.user?.clienteId || req.session?.user?.clienteId;
      if (!empleadoId || !clienteId) {
        return res.status(400).json({ message: "No hay empleado asociado" });
      }

      const { tipoDocumento, archivoUrl, archivoNombre, archivoTipo, archivoTamano } = req.body;

      if (!tipoDocumento) {
        return res.status(400).json({ message: "Tipo de documento requerido" });
      }
      if (!archivoUrl || !archivoNombre) {
        return res.status(400).json({ message: "Información del archivo incompleta" });
      }

      // Map document type to readable name and category
      const docTypeMap: Record<string, { nombre: string; categoria: string }> = {
        ine: { nombre: "INE / IFE", categoria: "identificacion" },
        curp: { nombre: "CURP", categoria: "identificacion" },
        comprobante_domicilio: { nombre: "Comprobante de Domicilio", categoria: "comprobante_domicilio" },
        acta_nacimiento: { nombre: "Acta de Nacimiento", categoria: "identificacion" },
        rfc: { nombre: "Constancia RFC", categoria: "identificacion" },
        nss: { nombre: "NSS / IMSS", categoria: "identificacion" },
      };

      const docInfo = docTypeMap[tipoDocumento] || {
        nombre: tipoDocumento.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
        categoria: "otro"
      };

      // Normalize the path for Supabase storage
      const normalizedPath = supabaseStorage.normalizeStoragePath(archivoUrl);

      // Check if document of this type already exists
      const existingDoc = await db
        .select()
        .from(documentosEmpleado)
        .where(and(
          eq(documentosEmpleado.empleadoId, empleadoId),
          eq(documentosEmpleado.tipoDocumento, tipoDocumento),
          eq(documentosEmpleado.subidoPorEmpleado, true),
          eq(documentosEmpleado.estatus, "activo")
        ))
        .limit(1);

      // If exists, archive the old one
      if (existingDoc.length > 0) {
        await db
          .update(documentosEmpleado)
          .set({ estatus: "archivado", updatedAt: new Date() })
          .where(eq(documentosEmpleado.id, existingDoc[0].id));
      }

      // Create new document record
      const [documento] = await db.insert(documentosEmpleado).values({
        clienteId,
        empleadoId,
        nombre: docInfo.nombre,
        descripcion: `Documento personal: ${docInfo.nombre}`,
        categoria: docInfo.categoria,
        tipoDocumento,
        archivoUrl: normalizedPath,
        archivoNombre,
        archivoTipo: archivoTipo || "application/octet-stream",
        archivoTamano: archivoTamano || 0,
        visibleParaEmpleado: true,
        subidoPorEmpleado: true,
        subidoPor: empleadoId,
        estatus: "activo",
      }).returning();

      res.json({
        success: true,
        documento: {
          id: documento.id,
          tipo: documento.tipoDocumento,
          nombre: documento.nombre,
        }
      });
    } catch (error: any) {
      console.error("Error completing personal document upload:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get missing required documents for employee
  app.get("/api/portal/documentos-faltantes", requireEmployeeAuth, async (req, res) => {
    try {
      const empleadoId = req.user?.empleadoId || req.session?.user?.empleadoId;
      if (!empleadoId) {
        return res.status(400).json({ message: "No hay empleado asociado" });
      }

      // Required document types
      const requiredDocTypes = [
        { tipo: "ine", nombre: "INE / IFE", descripcion: "Identificación oficial vigente" },
        { tipo: "curp", nombre: "CURP", descripcion: "Clave Única de Registro de Población" },
        { tipo: "comprobante_domicilio", nombre: "Comprobante de Domicilio", descripcion: "Recibo de luz, agua o teléfono (max 3 meses)" },
        { tipo: "rfc", nombre: "Constancia RFC", descripcion: "Constancia de situación fiscal" },
        { tipo: "nss", nombre: "NSS / IMSS", descripcion: "Número de Seguro Social" },
      ];

      // Get employee's uploaded personal documents
      const uploadedDocs = await db
        .select({ tipoDocumento: documentosEmpleado.tipoDocumento })
        .from(documentosEmpleado)
        .where(and(
          eq(documentosEmpleado.empleadoId, empleadoId),
          eq(documentosEmpleado.subidoPorEmpleado, true),
          eq(documentosEmpleado.estatus, "activo")
        ));

      const uploadedTypes = new Set(uploadedDocs.map(d => d.tipoDocumento).filter(Boolean));

      // Calculate missing documents
      const missing = requiredDocTypes.filter(doc => !uploadedTypes.has(doc.tipo));

      res.json({
        documentosFaltantes: missing.map(doc => ({
          tipo: doc.tipo,
          nombre: doc.nombre,
          descripcion: doc.descripcion,
          requerido: true,
        })),
        total: requiredDocTypes.length,
        completados: requiredDocTypes.length - missing.length,
      });
    } catch (error: any) {
      console.error("Error fetching missing documents:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // ============================================================================
  // PORTAL - DOCUMENT SOLICITATIONS (Documents requested by HR)
  // ============================================================================

  // Get pending document solicitations for current employee
  app.get("/api/portal/solicitudes-documentos", requireEmployeeAuth, async (req, res) => {
    try {
      const empleadoId = req.user?.empleadoId || req.session?.user?.empleadoId;
      if (!empleadoId) {
        return res.status(400).json({ message: "No hay empleado asociado" });
      }

      const solicitudes = await storage.getSolicitudesDocumentosRHPendientesByEmpleado(empleadoId);
      res.json(solicitudes);
    } catch (error: any) {
      console.error("Error fetching document solicitations:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get all document solicitations for current employee (all statuses)
  app.get("/api/portal/solicitudes-documentos/todas", requireEmployeeAuth, async (req, res) => {
    try {
      const empleadoId = req.user?.empleadoId || req.session?.user?.empleadoId;
      if (!empleadoId) {
        return res.status(400).json({ message: "No hay empleado asociado" });
      }

      const solicitudes = await storage.getSolicitudesDocumentosRHByEmpleado(empleadoId);
      res.json(solicitudes);
    } catch (error: any) {
      console.error("Error fetching document solicitations:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get upload URL for document solicitation response
  app.get("/api/portal/solicitudes-documentos/:id/upload-url", requireEmployeeAuth, async (req, res) => {
    try {
      const empleadoId = req.user?.empleadoId || req.session?.user?.empleadoId;
      if (!empleadoId) {
        return res.status(400).json({ message: "No hay empleado asociado" });
      }

      const { id } = req.params;

      // Verify solicitation belongs to this employee
      const solicitud = await storage.getSolicitudDocumentoRH(id);
      if (!solicitud) {
        return res.status(404).json({ message: "Solicitud no encontrada" });
      }
      if (solicitud.empleadoId !== empleadoId) {
        return res.status(403).json({ message: "No tienes permiso para esta solicitud" });
      }
      if (solicitud.estatus !== "pendiente") {
        return res.status(400).json({ message: "Esta solicitud ya fue atendida" });
      }

      // Get signed upload URL from Supabase
      const filePath = `empleados/${empleadoId}/solicitudes/${id}/${randomUUID()}_upload`;
      const { signedUrl } = await supabaseStorage.getSignedUploadUrl("documentos-empleados", filePath);

      res.json({ uploadURL: signedUrl, path: filePath });
    } catch (error: any) {
      console.error("Error getting upload URL for solicitation:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Complete document upload for solicitation (after client uploads to signed URL)
  app.post("/api/portal/solicitudes-documentos/:id/complete-upload", requireEmployeeAuth, async (req, res) => {
    try {
      const empleadoId = req.user?.empleadoId || req.session?.user?.empleadoId;
      const clienteId = req.user?.clienteId || req.session?.user?.clienteId;
      if (!empleadoId || !clienteId) {
        return res.status(400).json({ message: "No hay empleado asociado" });
      }

      const { id } = req.params;
      const { archivoUrl, archivoNombre, archivoTipo, archivoTamano } = req.body;

      if (!archivoUrl || !archivoNombre) {
        return res.status(400).json({ message: "Información del archivo incompleta" });
      }

      // Verify solicitation belongs to this employee
      const solicitud = await storage.getSolicitudDocumentoRH(id);
      if (!solicitud) {
        return res.status(404).json({ message: "Solicitud no encontrada" });
      }
      if (solicitud.empleadoId !== empleadoId) {
        return res.status(403).json({ message: "No tienes permiso para esta solicitud" });
      }
      if (solicitud.estatus !== "pendiente") {
        return res.status(400).json({ message: "Esta solicitud ya fue atendida" });
      }

      // Normalize the path for Supabase storage
      const normalizedPath = supabaseStorage.normalizeStoragePath(archivoUrl);

      // Create document record in documentosEmpleado
      const [documento] = await db.insert(documentosEmpleado).values({
        clienteId,
        empresaId: solicitud.empresaId,
        empleadoId,
        nombre: solicitud.nombreDocumento,
        descripcion: `Documento solicitado: ${solicitud.tipoDocumento}`,
        categoria: "identificacion",
        archivoUrl: normalizedPath,
        archivoNombre,
        archivoTipo: archivoTipo || "application/octet-stream",
        archivoTamano: archivoTamano || 0,
        visibleParaEmpleado: true,
        subidoPorEmpleado: true,
        subidoPor: empleadoId,
        estatus: "activo",
      }).returning();

      // Update solicitation status
      await storage.entregarSolicitudDocumentoRH(id, documento.id);

      res.json({ success: true, documento });
    } catch (error: any) {
      console.error("Error completing document upload for solicitation:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // ============================================================================
  // ADMIN - DOCUMENT SOLICITATIONS (HR requesting documents from employees)
  // ============================================================================

  // Get all document solicitations for a client
  app.get("/api/solicitudes-documentos-rh", requireAuth, async (req, res) => {
    try {
      const clienteId = req.session?.user?.clienteId;
      if (!clienteId) {
        return res.status(400).json({ message: "Cliente no identificado" });
      }

      const { empleadoId, estatus } = req.query;

      let solicitudes = await storage.getSolicitudesDocumentosRHByCliente(clienteId);

      // Filter by empleadoId if provided
      if (empleadoId) {
        solicitudes = solicitudes.filter(s => s.empleadoId === empleadoId);
      }

      // Filter by estatus if provided
      if (estatus) {
        solicitudes = solicitudes.filter(s => s.estatus === estatus);
      }

      res.json(solicitudes);
    } catch (error: any) {
      console.error("Error fetching document solicitations:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get a single document solicitation
  app.get("/api/solicitudes-documentos-rh/:id", requireAuth, async (req, res) => {
    try {
      const solicitud = await storage.getSolicitudDocumentoRH(req.params.id);
      if (!solicitud) {
        return res.status(404).json({ message: "Solicitud no encontrada" });
      }
      res.json(solicitud);
    } catch (error: any) {
      console.error("Error fetching document solicitation:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Create a new document solicitation (HR requesting from employee)
  app.post("/api/solicitudes-documentos-rh", requireAuth, async (req, res) => {
    try {
      const solicitadoPor = req.session?.user?.id;
      const clienteId = req.session?.user?.clienteId;
      if (!solicitadoPor || !clienteId) {
        return res.status(400).json({ message: "Usuario no identificado" });
      }

      const validated = insertSolicitudDocumentoRHSchema.parse({
        ...req.body,
        clienteId,
        solicitadoPor,
      });

      const solicitud = await storage.createSolicitudDocumentoRH(validated);

      // TODO: Create notification for employee
      // This would be added when notification system is fully implemented

      res.status(201).json(solicitud);
    } catch (error: any) {
      console.error("Error creating document solicitation:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Update a document solicitation (approve/reject)
  app.patch("/api/solicitudes-documentos-rh/:id", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.user?.id;
      if (!userId) {
        return res.status(400).json({ message: "Usuario no identificado" });
      }

      const { id } = req.params;
      const { estatus, notasRechazo } = req.body;

      const solicitud = await storage.getSolicitudDocumentoRH(id);
      if (!solicitud) {
        return res.status(404).json({ message: "Solicitud no encontrada" });
      }

      let updated;
      if (estatus === "aprobado") {
        updated = await storage.aprobarSolicitudDocumentoRH(id, userId);
      } else if (estatus === "rechazado") {
        updated = await storage.rechazarSolicitudDocumentoRH(id, userId, notasRechazo || "");
      } else {
        updated = await storage.updateSolicitudDocumentoRH(id, req.body);
      }

      res.json(updated);
    } catch (error: any) {
      console.error("Error updating document solicitation:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Delete/cancel a document solicitation
  app.delete("/api/solicitudes-documentos-rh/:id", requireAuth, async (req, res) => {
    try {
      const solicitud = await storage.getSolicitudDocumentoRH(req.params.id);
      if (!solicitud) {
        return res.status(404).json({ message: "Solicitud no encontrada" });
      }

      // Only allow deleting pending solicitations
      if (solicitud.estatus !== "pendiente") {
        return res.status(400).json({ message: "Solo se pueden cancelar solicitudes pendientes" });
      }

      await storage.deleteSolicitudDocumentoRH(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting document solicitation:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // ============================================================================
  // PORTAL - DIRECTORIO (Employee Directory)
  // ============================================================================

  // Get departments for filter - derive from employee data
  app.get("/api/portal/directorio/departamentos", requireEmployeeAuth, async (req, res) => {
    try {
      const clienteId = req.session?.user?.clienteId;
      if (!clienteId) {
        return res.status(400).json({ message: "Cliente no identificado" });
      }

      // Get distinct departments from employees
      const empDepts = await db
        .selectDistinct({ departamento: employees.departamento })
        .from(employees)
        .where(
          and(
            eq(employees.clienteId, clienteId),
            eq(employees.estatus, 'activo')
          )
        );

      // Get counts for each department
      const deptsWithCounts = await Promise.all(
        empDepts
          .filter(d => d.departamento)
          .map(async (dept, index) => {
            const count = await db
              .select({ count: sql<number>`count(*)` })
              .from(employees)
              .where(
                and(
                  eq(employees.clienteId, clienteId),
                  eq(employees.departamento, dept.departamento!),
                  eq(employees.estatus, 'activo')
                )
              );
            return {
              id: index + 1,
              nombre: dept.departamento,
              empleadosCount: Number(count[0]?.count) || 0,
            };
          })
      );

      res.json(deptsWithCounts.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || '')));
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get employee directory
  app.get("/api/portal/directorio", requireEmployeeAuth, async (req, res) => {
    try {
      const clienteId = req.session?.user?.clienteId;
      if (!clienteId) {
        return res.status(400).json({ message: "Cliente no identificado" });
      }

      const { departamento, buscar } = req.query;

      let query = db
        .select({
          id: employees.id,
          nombre: employees.nombre,
          apellidoPaterno: employees.apellidoPaterno,
          apellidoMaterno: employees.apellidoMaterno,
          email: employees.email,
          telefono: employees.telefono,
          puesto: employees.puesto,
          departamento: employees.departamento,
        })
        .from(employees)
        .where(
          and(
            eq(employees.clienteId, clienteId),
            eq(employees.estatus, 'activo'),
            eq(employees.portalActivo, true)
          )
        )
        .orderBy(employees.nombre);

      let results = await query;

      // Filter by department if specified
      if (departamento && departamento !== 'todos') {
        results = results.filter(e =>
          e.departamento && String(e.departamento).toLowerCase().includes(String(departamento).toLowerCase())
        );
      }

      // Search filter
      if (buscar) {
        const searchLower = (buscar as string).toLowerCase();
        results = results.filter(e => {
          const fullName = `${e.nombre} ${e.apellidoPaterno} ${e.apellidoMaterno || ''}`.toLowerCase();
          return fullName.includes(searchLower);
        });
      }

      // Map to expected format
      res.json(results.map(e => ({
        id: e.id,
        nombre: e.nombre,
        apellidoPaterno: e.apellidoPaterno,
        apellidoMaterno: e.apellidoMaterno,
        email: e.email,
        telefonoExtension: e.telefono,
        fotoUrl: null,
        puesto: e.puesto,
        departamento: e.departamento,
      })));
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ============================================================================
  // PORTAL - APROBACIONES (Manager Approvals)
  // ============================================================================

  // Get pending approvals count (for header badge)
  app.get("/api/portal/aprobaciones/count", requireEmployeeAuth, async (req, res) => {
    try {
      const empleadoId = req.session?.user?.empleadoId;
      const clienteId = req.session?.user?.clienteId;
      if (!empleadoId || !clienteId) {
        return res.json({ count: 0, isManager: false });
      }

      // Check if this employee is a manager (has subordinates)
      const subordinates = await db
        .select({ id: employees.id })
        .from(employees)
        .where(
          and(
            eq(employees.jefeDirectoId, empleadoId),
            eq(employees.estatus, 'activo')
          )
        );

      if (subordinates.length === 0) {
        return res.json({ count: 0, isManager: false });
      }

      const subordinateIds = subordinates.map(s => s.id);

      // Count pending vacation requests from subordinates
      const pendingVacaciones = await db
        .select({ count: sql<number>`count(*)` })
        .from(solicitudesVacaciones)
        .where(
          and(
            inArray(solicitudesVacaciones.empleadoId, subordinateIds),
            eq(solicitudesVacaciones.estatus, 'pendiente')
          )
        );

      // Count pending permission requests from subordinates
      const pendingPermisos = await db
        .select({ count: sql<number>`count(*)` })
        .from(solicitudesPermisos)
        .where(
          and(
            inArray(solicitudesPermisos.empleadoId, subordinateIds),
            eq(solicitudesPermisos.estatus, 'pendiente')
          )
        );

      const total = (pendingVacaciones[0]?.count || 0) + (pendingPermisos[0]?.count || 0);

      res.json({ count: total, isManager: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get pending approvals for manager
  app.get("/api/portal/aprobaciones", requireEmployeeAuth, async (req, res) => {
    try {
      const empleadoId = req.session?.user?.empleadoId;
      if (!empleadoId) {
        return res.status(400).json({ message: "No hay empleado asociado" });
      }

      // Get subordinates
      const subordinates = await db
        .select()
        .from(employees)
        .where(
          and(
            eq(employees.jefeDirectoId, empleadoId),
            eq(employees.estatus, 'activo')
          )
        );

      if (subordinates.length === 0) {
        return res.json([]);
      }

      const subordinateIds = subordinates.map(s => s.id);
      const subordinateMap = new Map(subordinates.map(s => [s.id, s]));

      // Get pending vacation requests
      const vacaciones = await db
        .select()
        .from(solicitudesVacaciones)
        .where(
          and(
            inArray(solicitudesVacaciones.empleadoId, subordinateIds),
            eq(solicitudesVacaciones.estatus, 'pendiente')
          )
        );

      // Get pending permission requests
      const permisos = await db
        .select()
        .from(solicitudesPermisos)
        .where(
          and(
            inArray(solicitudesPermisos.empleadoId, subordinateIds),
            eq(solicitudesPermisos.estatus, 'pendiente')
          )
        );

      const results = [
        ...vacaciones.map(v => {
          const emp = subordinateMap.get(v.empleadoId);
          return {
            id: v.id,
            tipo: 'vacaciones' as const,
            empleadoId: v.empleadoId,
            empleadoNombre: emp ? `${emp.nombre} ${emp.apellidoPaterno}` : 'Empleado',
            empleadoFoto: emp?.fotoUrl,
            empleadoPuesto: '',
            fechaSolicitud: v.fechaSolicitud,
            fechaInicio: v.fechaInicio,
            fechaFin: v.fechaFin,
            diasSolicitados: v.diasSolicitados,
            motivo: v.comentarios,
            estado: v.estatus,
          };
        }),
        ...permisos.map(p => {
          const emp = subordinateMap.get(p.empleadoId);
          return {
            id: p.id,
            tipo: 'permiso' as const,
            empleadoId: p.empleadoId,
            empleadoNombre: emp ? `${emp.nombre} ${emp.apellidoPaterno}` : 'Empleado',
            empleadoFoto: emp?.fotoUrl,
            empleadoPuesto: '',
            fechaSolicitud: p.fechaSolicitud,
            fechaInicio: p.fechaInicio,
            fechaFin: p.fechaFin,
            diasSolicitados: null,
            motivo: p.motivo,
            estado: p.estatus,
          };
        }),
      ].sort((a, b) =>
        new Date(b.fechaSolicitud).getTime() - new Date(a.fechaSolicitud).getTime()
      );

      res.json(results);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get approval history
  app.get("/api/portal/aprobaciones/historial", requireEmployeeAuth, async (req, res) => {
    try {
      const empleadoId = req.session?.user?.empleadoId;
      if (!empleadoId) {
        return res.status(400).json({ message: "No hay empleado asociado" });
      }

      // Get subordinates
      const subordinates = await db
        .select()
        .from(employees)
        .where(eq(employees.jefeDirectoId, empleadoId));

      if (subordinates.length === 0) {
        return res.json([]);
      }

      const subordinateIds = subordinates.map(s => s.id);
      const subordinateMap = new Map(subordinates.map(s => [s.id, s]));

      // Get processed requests (not pending)
      const vacaciones = await db
        .select()
        .from(solicitudesVacaciones)
        .where(
          and(
            inArray(solicitudesVacaciones.empleadoId, subordinateIds),
            ne(solicitudesVacaciones.estatus, 'pendiente')
          )
        )
        .orderBy(desc(solicitudesVacaciones.fechaSolicitud))
        .limit(50);

      const permisos = await db
        .select()
        .from(solicitudesPermisos)
        .where(
          and(
            inArray(solicitudesPermisos.empleadoId, subordinateIds),
            ne(solicitudesPermisos.estatus, 'pendiente')
          )
        )
        .orderBy(desc(solicitudesPermisos.fechaSolicitud))
        .limit(50);

      const results = [
        ...vacaciones.map(v => {
          const emp = subordinateMap.get(v.empleadoId);
          return {
            id: v.id,
            tipo: 'vacaciones' as const,
            empleadoId: v.empleadoId,
            empleadoNombre: emp ? `${emp.nombre} ${emp.apellidoPaterno}` : 'Empleado',
            empleadoFoto: emp?.fotoUrl,
            empleadoPuesto: '',
            fechaSolicitud: v.fechaSolicitud,
            fechaInicio: v.fechaInicio,
            fechaFin: v.fechaFin,
            diasSolicitados: v.diasSolicitados,
            motivo: v.comentarios,
            estado: v.estatus,
            comentarioAprobador: v.comentariosAprobador,
          };
        }),
        ...permisos.map(p => {
          const emp = subordinateMap.get(p.empleadoId);
          return {
            id: p.id,
            tipo: 'permiso' as const,
            empleadoId: p.empleadoId,
            empleadoNombre: emp ? `${emp.nombre} ${emp.apellidoPaterno}` : 'Empleado',
            empleadoFoto: emp?.fotoUrl,
            empleadoPuesto: '',
            fechaSolicitud: p.fechaSolicitud,
            fechaInicio: p.fechaInicio,
            fechaFin: p.fechaFin,
            diasSolicitados: null,
            motivo: p.motivo,
            estado: p.estatus,
            comentarioAprobador: p.comentariosAprobador,
          };
        }),
      ].sort((a, b) =>
        new Date(b.fechaSolicitud).getTime() - new Date(a.fechaSolicitud).getTime()
      );

      res.json(results);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Approve a request
  app.post("/api/portal/aprobaciones/:id/aprobar", requireEmployeeAuth, async (req, res) => {
    try {
      const empleadoId = req.session?.user?.empleadoId;
      if (!empleadoId) {
        return res.status(400).json({ message: "No hay empleado asociado" });
      }

      const { comentario } = req.body;
      const requestId = parseInt(req.params.id);

      // Try to find and update vacation request first
      const vacacion = await db
        .select()
        .from(solicitudesVacaciones)
        .where(eq(solicitudesVacaciones.id, requestId))
        .limit(1);

      if (vacacion[0]) {
        // Verify manager has authority
        const emp = await db
          .select()
          .from(employees)
          .where(eq(employees.id, vacacion[0].empleadoId))
          .limit(1);

        if (emp[0]?.jefeDirectoId !== empleadoId) {
          return res.status(403).json({ message: "No tienes permiso para aprobar esta solicitud" });
        }

        await db
          .update(solicitudesVacaciones)
          .set({
            estatus: 'aprobado',
            fechaAprobacion: new Date(),
            aprobadorId: empleadoId,
            comentariosAprobador: comentario,
          })
          .where(eq(solicitudesVacaciones.id, requestId));

        return res.json({ success: true });
      }

      // Try permission request
      const permiso = await db
        .select()
        .from(solicitudesPermisos)
        .where(eq(solicitudesPermisos.id, requestId))
        .limit(1);

      if (permiso[0]) {
        const emp = await db
          .select()
          .from(employees)
          .where(eq(employees.id, permiso[0].empleadoId))
          .limit(1);

        if (emp[0]?.jefeDirectoId !== empleadoId) {
          return res.status(403).json({ message: "No tienes permiso para aprobar esta solicitud" });
        }

        await db
          .update(solicitudesPermisos)
          .set({
            estatus: 'aprobado',
            fechaAprobacion: new Date(),
            aprobadorId: empleadoId,
            comentariosAprobador: comentario,
          })
          .where(eq(solicitudesPermisos.id, requestId));

        return res.json({ success: true });
      }

      res.status(404).json({ message: "Solicitud no encontrada" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Reject a request
  app.post("/api/portal/aprobaciones/:id/rechazar", requireEmployeeAuth, async (req, res) => {
    try {
      const empleadoId = req.session?.user?.empleadoId;
      if (!empleadoId) {
        return res.status(400).json({ message: "No hay empleado asociado" });
      }

      const { comentario } = req.body;
      const requestId = parseInt(req.params.id);

      // Try vacation request first
      const vacacion = await db
        .select()
        .from(solicitudesVacaciones)
        .where(eq(solicitudesVacaciones.id, requestId))
        .limit(1);

      if (vacacion[0]) {
        const emp = await db
          .select()
          .from(employees)
          .where(eq(employees.id, vacacion[0].empleadoId))
          .limit(1);

        if (emp[0]?.jefeDirectoId !== empleadoId) {
          return res.status(403).json({ message: "No tienes permiso para rechazar esta solicitud" });
        }

        await db
          .update(solicitudesVacaciones)
          .set({
            estatus: 'rechazado',
            fechaAprobacion: new Date(),
            aprobadorId: empleadoId,
            comentariosAprobador: comentario,
          })
          .where(eq(solicitudesVacaciones.id, requestId));

        return res.json({ success: true });
      }

      // Try permission request
      const permiso = await db
        .select()
        .from(solicitudesPermisos)
        .where(eq(solicitudesPermisos.id, requestId))
        .limit(1);

      if (permiso[0]) {
        const emp = await db
          .select()
          .from(employees)
          .where(eq(employees.id, permiso[0].empleadoId))
          .limit(1);

        if (emp[0]?.jefeDirectoId !== empleadoId) {
          return res.status(403).json({ message: "No tienes permiso para rechazar esta solicitud" });
        }

        await db
          .update(solicitudesPermisos)
          .set({
            estatus: 'rechazado',
            fechaAprobacion: new Date(),
            aprobadorId: empleadoId,
            comentariosAprobador: comentario,
          })
          .where(eq(solicitudesPermisos.id, requestId));

        return res.json({ success: true });
      }

      res.status(404).json({ message: "Solicitud no encontrada" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ============================================================================
  // DOCUMENT TEMPLATES - Plantillas de Documentos
  // ============================================================================

  // --- Template Categories ---
  app.get("/api/plantillas-documento/categorias", async (req, res) => {
    try {
      const clienteId = getEffectiveClienteId(req);
      if (!clienteId) {
        return res.status(400).json({ message: "Cliente ID required" });
      }
      const categorias = await storage.getCategoriasPlantillaDocumento(clienteId);
      res.json(categorias);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/plantillas-documento/categorias", async (req, res) => {
    try {
      const clienteId = getEffectiveClienteId(req);
      if (!clienteId) {
        return res.status(400).json({ message: "Cliente ID required" });
      }
      const categoria = await storage.createCategoriaPlantillaDocumento({
        ...req.body,
        clienteId,
      });
      res.json(categoria);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/plantillas-documento/categorias/:id", async (req, res) => {
    try {
      const categoria = await storage.updateCategoriaPlantillaDocumento(req.params.id, req.body);
      res.json(categoria);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/plantillas-documento/categorias/:id", async (req, res) => {
    try {
      await storage.deleteCategoriaPlantillaDocumento(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // --- Get template variables metadata ---
  app.get("/api/plantillas-documento/variables", async (_req, res) => {
    try {
      const { templateVariableCategories, getAllTemplateVariables } = await import("@shared/templateVariables");
      res.json({
        categories: templateVariableCategories,
        flatList: getAllTemplateVariables(),
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // --- Templates CRUD ---
  app.get("/api/plantillas-documento", async (req, res) => {
    try {
      const clienteId = getEffectiveClienteId(req);
      if (!clienteId) {
        return res.status(400).json({ message: "Cliente ID required" });
      }
      const tipoDocumento = req.query.tipo as string | undefined;
      const templates = await storage.getPlantillasDocumento(clienteId, tipoDocumento);
      res.json(templates);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/plantillas-documento/:id", async (req, res) => {
    try {
      const template = await storage.getPlantillaDocumentoById(req.params.id);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      res.json(template);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/plantillas-documento", async (req, res) => {
    try {
      const clienteId = getEffectiveClienteId(req);
      if (!clienteId) {
        return res.status(400).json({ message: "Cliente ID required" });
      }
      const template = await storage.createPlantillaDocumento({
        ...req.body,
        clienteId,
        createdBy: req.session?.user?.id,
      });
      res.json(template);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/plantillas-documento/:id", async (req, res) => {
    try {
      const template = await storage.updatePlantillaDocumento(req.params.id, {
        ...req.body,
        updatedBy: req.session?.user?.id,
      });
      res.json(template);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/plantillas-documento/:id", async (req, res) => {
    try {
      await storage.deletePlantillaDocumento(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // --- Template Versions ---
  app.get("/api/plantillas-documento/:id/versiones", async (req, res) => {
    try {
      const versiones = await storage.getPlantillaDocumentoVersiones(req.params.id);
      res.json(versiones);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/plantillas-documento/:id/restaurar/:version", async (req, res) => {
    try {
      const version = parseInt(req.params.version, 10);
      if (isNaN(version)) {
        return res.status(400).json({ message: "Invalid version number" });
      }
      const template = await storage.restaurarPlantillaDocumentoVersion(
        req.params.id,
        version,
        req.session?.user?.id
      );
      res.json(template);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // --- Template Assets ---
  app.get("/api/plantillas-documento/assets", async (req, res) => {
    try {
      const clienteId = getEffectiveClienteId(req);
      if (!clienteId) {
        return res.status(400).json({ message: "Cliente ID required" });
      }
      const tipo = req.query.tipo as string | undefined;
      const assets = await storage.getPlantillaDocumentoAssets(clienteId, tipo);
      res.json(assets);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/plantillas-documento/assets", async (req, res) => {
    try {
      const clienteId = getEffectiveClienteId(req);
      if (!clienteId) {
        return res.status(400).json({ message: "Cliente ID required" });
      }
      const asset = await storage.createPlantillaDocumentoAsset({
        ...req.body,
        clienteId,
      });
      res.json(asset);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/plantillas-documento/assets/:id", async (req, res) => {
    try {
      await storage.deletePlantillaDocumentoAsset(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // --- Assignment Rules ---
  app.get("/api/plantillas-documento/reglas-asignacion", async (req, res) => {
    try {
      const clienteId = getEffectiveClienteId(req);
      if (!clienteId) {
        return res.status(400).json({ message: "Cliente ID required" });
      }
      const plantillaId = req.query.plantillaId as string | undefined;
      const reglas = await storage.getReglasAsignacionPlantilla(clienteId, plantillaId);
      res.json(reglas);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/plantillas-documento/reglas-asignacion", async (req, res) => {
    try {
      const clienteId = getEffectiveClienteId(req);
      if (!clienteId) {
        return res.status(400).json({ message: "Cliente ID required" });
      }
      const regla = await storage.createReglaAsignacionPlantilla({
        ...req.body,
        clienteId,
      });
      res.json(regla);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/plantillas-documento/reglas-asignacion/:id", async (req, res) => {
    try {
      const regla = await storage.updateReglaAsignacionPlantilla(req.params.id, req.body);
      res.json(regla);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/plantillas-documento/reglas-asignacion/:id", async (req, res) => {
    try {
      await storage.deleteReglaAsignacionPlantilla(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get suggested templates based on context
  app.get("/api/plantillas-documento/sugeridas", async (req, res) => {
    try {
      const clienteId = getEffectiveClienteId(req);
      if (!clienteId) {
        return res.status(400).json({ message: "Cliente ID required" });
      }
      const context = {
        tipoEvento: req.query.tipoEvento as string | undefined,
        empresaId: req.query.empresaId as string | undefined,
        departamento: req.query.departamento as string | undefined,
        puestoId: req.query.puestoId as string | undefined,
        tipoContrato: req.query.tipoContrato as string | undefined,
      };
      const plantillas = await storage.getPlantillasSugeridas(clienteId, context);
      res.json(plantillas);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // --- Preview template with sample or real data ---
  app.post("/api/plantillas-documento/:id/preview", async (req, res) => {
    try {
      const template = await storage.getPlantillaDocumentoById(req.params.id);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }

      const { empleadoId, empresaId, customVariables } = req.body;
      const {
        buildEmpleadoVariables,
        buildEmpresaVariables,
        buildDocumentoVariables,
        getSampleEmpleadoData,
        getSampleEmpresaData,
      } = await import("@shared/templateVariables");

      // Get real or sample data
      let empleadoData = getSampleEmpleadoData();
      let empresaData = getSampleEmpresaData();

      if (empleadoId) {
        const empleado = await storage.getEmployee(empleadoId);
        if (empleado) {
          empleadoData = empleado as any;
        }
      }

      if (empresaId) {
        const empresa = await storage.getEmpresa(empresaId);
        if (empresa) {
          empresaData = empresa as any;
        }
      }

      res.json({
        template,
        variables: {
          empleado: buildEmpleadoVariables(empleadoData),
          empresa: buildEmpresaVariables(empresaData),
          documento: buildDocumentoVariables(),
          custom: customVariables || {},
        },
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // --- Generate PDF from template ---
  app.post("/api/plantillas-documento/:id/generar-pdf", async (req, res) => {
    try {
      const template = await storage.getPlantillaDocumentoById(req.params.id);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }

      const clienteId = getEffectiveClienteId(req);
      if (!clienteId) {
        return res.status(400).json({ message: "Cliente ID required" });
      }

      const { empleadoId, empresaId, customVariables } = req.body;
      const {
        buildEmpleadoVariables,
        buildEmpresaVariables,
        buildDocumentoVariables,
      } = await import("@shared/templateVariables");

      // Get data
      let empleadoData: Record<string, unknown> = {};
      let empresaData: Record<string, unknown> = {};

      if (empleadoId) {
        const empleado = await storage.getEmployee(empleadoId);
        if (empleado) {
          empleadoData = empleado as any;
        }
      }

      if (empresaId) {
        const empresa = await storage.getEmpresa(empresaId);
        if (empresa) {
          empresaData = empresa as any;
        }
      }

      const variableData = {
        empleado: buildEmpleadoVariables(empleadoData),
        empresa: buildEmpresaVariables(empresaData),
        documento: buildDocumentoVariables(),
        custom: customVariables || {},
      };

      // For now, return the data for client-side PDF generation
      // Server-side PDF generation with Puppeteer will be added later
      const generatedDoc = await storage.createDocumentoGenerado({
        clienteId,
        empresaId,
        plantillaId: template.id,
        plantillaVersion: template.version,
        empleadoId,
        nombreArchivo: `${template.nombre}_${new Date().toISOString().slice(0, 10)}.pdf`,
        variablesUsadas: variableData,
        variablesCustom: customVariables,
        generadoPor: req.session?.user?.id,
      });

      res.json({
        documento: generatedDoc,
        template,
        variables: variableData,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // --- Generated Documents History ---
  app.get("/api/documentos-generados", async (req, res) => {
    try {
      const clienteId = getEffectiveClienteId(req);
      if (!clienteId) {
        return res.status(400).json({ message: "Cliente ID required" });
      }
      const documentos = await storage.getDocumentosGenerados(clienteId, {
        empleadoId: req.query.empleadoId as string | undefined,
        plantillaId: req.query.plantillaId as string | undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
      });
      res.json(documentos);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/documentos-generados/:id", async (req, res) => {
    try {
      const documento = await storage.getDocumentoGenerado(req.params.id);
      if (!documento) {
        return res.status(404).json({ message: "Document not found" });
      }
      res.json(documento);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ============================================================================
  // ANONYMOUS REPORTING SYSTEM (Denuncias Anónimas)
  // Public endpoints - no authentication required
  // ============================================================================

  // Helper to generate case number (e.g., DEN-2024-000001)
  function generateCaseNumber(): string {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 999999).toString().padStart(6, '0');
    return `DEN-${year}-${random}`;
  }

  // Helper to generate a 6-digit PIN
  function generatePin(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // PUBLIC: Get organization info by clienteId for the anonymous portal
  app.get("/api/denuncia/:clienteId/info", async (req, res) => {
    try {
      const { clienteId } = req.params;

      const cliente = await storage.getCliente(clienteId);
      if (!cliente || !cliente.activo) {
        return res.status(404).json({ message: "Organización no encontrada" });
      }

      // Get configuration
      const config = await storage.getDenunciaConfiguracion(cliente.id);
      if (config && !config.habilitado) {
        return res.status(403).json({ message: "El sistema de denuncias no está habilitado" });
      }

      res.json({
        cliente: {
          nombreComercial: cliente.nombreComercial,
        },
        config: config ? {
          categoriasHabilitadas: config.categoriasHabilitadas,
          permitirAdjuntos: config.permitirAdjuntos,
          mensajeBienvenida: config.mensajeBienvenida,
        } : {
          categoriasHabilitadas: ["harassment_abuse", "ethics_compliance", "suggestions", "safety_concerns"],
          permitirAdjuntos: true,
          mensajeBienvenida: null,
        },
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // PUBLIC: Submit anonymous report
  app.post("/api/denuncia/:clienteId/submit", async (req, res) => {
    try {
      const { clienteId } = req.params;
      const { categoria, titulo, descripcion, emailAnonimo, notificarPorEmail, adjuntos } = req.body;

      // Validate organization
      const cliente = await storage.getCliente(clienteId);
      if (!cliente || !cliente.activo) {
        return res.status(404).json({ message: "Organización no encontrada" });
      }

      // Check if reporting is enabled
      const config = await storage.getDenunciaConfiguracion(cliente.id);
      if (config && !config.habilitado) {
        return res.status(403).json({ message: "El sistema de denuncias no está habilitado" });
      }

      // Generate case number and PIN
      const caseNumber = generateCaseNumber();
      const pin = generatePin();
      const pinHash = await bcrypt.hash(pin, 10);

      // Create the report (empresaId is now optional/null)
      const denuncia = await storage.createDenuncia({
        clienteId: cliente.id,
        empresaId: null,
        caseNumber,
        pinHash,
        categoria,
        titulo,
        descripcion,
        estatus: "nuevo",
        prioridad: "normal",
        emailAnonimo: emailAnonimo || null,
        notificarPorEmail: notificarPorEmail || false,
      });

      // Create attachments if provided
      if (adjuntos && Array.isArray(adjuntos) && adjuntos.length > 0) {
        for (const adjunto of adjuntos) {
          await storage.createDenunciaAdjunto({
            denunciaId: denuncia.id,
            nombreArchivo: adjunto.nombreArchivo,
            tipoMime: adjunto.tipoMime,
            tamanioBytes: adjunto.tamanioBytes,
            storagePath: adjunto.storagePath,
            subidoPor: "reporter",
          });
        }
      }

      // Return case number and PIN (only time PIN is shown in plain text)
      res.json({
        success: true,
        caseNumber: denuncia.caseNumber,
        pin, // Only returned once, user must save it
        message: "Tu denuncia ha sido registrada. Guarda tu número de caso y PIN para dar seguimiento.",
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // PUBLIC: Verify case access (check case number + PIN)
  app.post("/api/denuncia/verify", async (req, res) => {
    try {
      const { caseNumber, pin } = req.body;

      const denuncia = await storage.getDenunciaByCaseNumber(caseNumber);
      if (!denuncia) {
        return res.status(404).json({ message: "Caso no encontrado" });
      }

      const pinValid = await bcrypt.compare(pin, denuncia.pinHash);
      if (!pinValid) {
        return res.status(401).json({ message: "PIN incorrecto" });
      }

      // Get messages (without admin-only info, excluding internal notes)
      const mensajes = await storage.getDenunciaMensajes(denuncia.id);
      const mensajesPublicos = mensajes
        .filter(m => m.tipoRemitente !== "internal_note")
        .map(m => ({
          id: m.id,
          contenido: m.contenido,
          tipoRemitente: m.tipoRemitente,
          createdAt: m.createdAt,
        }));

      res.json({
        success: true,
        denuncia: {
          caseNumber: denuncia.caseNumber,
          categoria: denuncia.categoria,
          titulo: denuncia.titulo,
          descripcion: denuncia.descripcion,
          estatus: denuncia.estatus,
          prioridad: denuncia.prioridad,
          resolucionDescripcion: denuncia.resolucionDescripcion,
          createdAt: denuncia.createdAt,
          resolvedAt: denuncia.resolvedAt,
        },
        mensajes: mensajesPublicos,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // PUBLIC: Add message to case (from reporter)
  app.post("/api/denuncia/message", async (req, res) => {
    try {
      const { caseNumber, pin, contenido } = req.body;

      const denuncia = await storage.getDenunciaByCaseNumber(caseNumber);
      if (!denuncia) {
        return res.status(404).json({ message: "Caso no encontrado" });
      }

      const pinValid = await bcrypt.compare(pin, denuncia.pinHash);
      if (!pinValid) {
        return res.status(401).json({ message: "PIN incorrecto" });
      }

      // Check case isn't closed
      if (denuncia.estatus === "cerrado" || denuncia.estatus === "descartado") {
        return res.status(400).json({ message: "Este caso ya está cerrado" });
      }

      const mensaje = await storage.createDenunciaMensaje({
        denunciaId: denuncia.id,
        contenido,
        tipoRemitente: "reporter",
        leidoPorReportero: true,
        leidoPorInvestigador: false,
      });

      // Emit WebSocket event for real-time updates (to both ID and case number rooms)
      emitDenunciaUpdate(denuncia.id, "new-message", { denunciaId: denuncia.id });
      emitDenunciaCaseUpdate(denuncia.caseNumber, "new-message", { caseNumber: denuncia.caseNumber });

      res.json({
        success: true,
        mensaje: {
          id: mensaje.id,
          contenido: mensaje.contenido,
          tipoRemitente: mensaje.tipoRemitente,
          createdAt: mensaje.createdAt,
        },
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ============================================================================
  // ADMIN DENUNCIAS API - Authenticated endpoints
  // ============================================================================

  // Get all denuncias for a cliente
  app.get("/api/denuncias", async (req, res) => {
    try {
      const clienteId = getEffectiveClienteId(req);
      if (!clienteId) {
        return res.status(400).json({ message: "Cliente ID required" });
      }

      const denuncias = await storage.getDenunciasByCliente(clienteId);

      // Get unread message counts for each denuncia
      const denunciasWithCounts = await Promise.all(
        denuncias.map(async (d) => {
          const mensajes = await storage.getDenunciaMensajes(d.id);
          const unreadCount = mensajes.filter(m => m.tipoRemitente === "reporter" && !m.leidoPorInvestigador).length;
          return {
            ...d,
            unreadMessageCount: unreadCount,
            pinHash: undefined, // Never expose pin hash
          };
        })
      );

      res.json(denunciasWithCounts);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get single denuncia details (admin view)
  app.get("/api/denuncias/:id", async (req, res) => {
    try {
      const clienteId = getEffectiveClienteId(req);
      if (!clienteId) {
        return res.status(400).json({ message: "Cliente ID required" });
      }

      const denuncia = await storage.getDenuncia(req.params.id);
      if (!denuncia || denuncia.clienteId !== clienteId) {
        return res.status(404).json({ message: "Denuncia no encontrada" });
      }

      const mensajes = await storage.getDenunciaMensajes(denuncia.id);
      const adjuntos = await storage.getDenunciaAdjuntos(denuncia.id);
      const auditLog = await storage.getDenunciaAuditLog(denuncia.id);

      res.json({
        ...denuncia,
        pinHash: undefined,
        mensajes,
        adjuntos,
        auditLog,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Update denuncia (change status, priority, add internal notes)
  app.patch("/api/denuncias/:id", async (req, res) => {
    try {
      const clienteId = getEffectiveClienteId(req);
      if (!clienteId) {
        return res.status(400).json({ message: "Cliente ID required" });
      }

      const denuncia = await storage.getDenuncia(req.params.id);
      if (!denuncia || denuncia.clienteId !== clienteId) {
        return res.status(404).json({ message: "Denuncia no encontrada" });
      }

      const { estatus, prioridad, notasInternas, resolucionDescripcion, asignadoAId } = req.body;

      const updates: any = {};
      if (estatus) updates.estatus = estatus;
      if (prioridad) updates.prioridad = prioridad;
      if (notasInternas !== undefined) updates.notasInternas = notasInternas;
      if (resolucionDescripcion !== undefined) updates.resolucionDescripcion = resolucionDescripcion;
      if (asignadoAId !== undefined) updates.asignadoAId = asignadoAId;

      // Set resolved date if status is resuelto or cerrado
      if (estatus === "resuelto" || estatus === "cerrado") {
        updates.resolvedAt = new Date();
      }

      const updated = await storage.updateDenuncia(req.params.id, updates);

      // Log the action
      const user = req.session?.user;
      if (user) {
        await storage.createDenunciaAuditLog({
          denunciaId: denuncia.id,
          usuarioId: user.id,
          usuarioNombre: user.nombre || user.email,
          accion: `Actualización: ${Object.keys(updates).join(', ')}`,
          detalles: updates,
        });
      }

      res.json({ ...updated, pinHash: undefined });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Admin adds message to denuncia
  app.post("/api/denuncias/:id/mensaje", async (req, res) => {
    try {
      const clienteId = getEffectiveClienteId(req);
      if (!clienteId) {
        return res.status(400).json({ message: "Cliente ID required" });
      }

      const denuncia = await storage.getDenuncia(req.params.id);
      if (!denuncia || denuncia.clienteId !== clienteId) {
        return res.status(404).json({ message: "Denuncia no encontrada" });
      }

      const { contenido } = req.body;
      const user = req.session?.user;

      const mensaje = await storage.createDenunciaMensaje({
        denunciaId: denuncia.id,
        contenido,
        tipoRemitente: "investigator",
        ...(user?.id && { investigadorId: user.id }),
      });

      // Log the action
      if (user) {
        await storage.createDenunciaAuditLog({
          denunciaId: denuncia.id,
          usuarioId: user.id,
          usuarioNombre: user.nombre || user.email,
          accion: "Envió mensaje al reportante",
          detalles: { mensajeId: mensaje.id },
        });
      }

      // Emit WebSocket event for real-time updates (to both ID and case number rooms)
      emitDenunciaUpdate(denuncia.id, "new-message", { denunciaId: denuncia.id });
      emitDenunciaCaseUpdate(denuncia.caseNumber, "new-message", { caseNumber: denuncia.caseNumber });

      res.json(mensaje);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Admin adds internal note to denuncia (not visible to reporter)
  app.post("/api/denuncias/:id/nota-interna", async (req, res) => {
    try {
      const clienteId = getEffectiveClienteId(req);
      if (!clienteId) {
        return res.status(400).json({ message: "Cliente ID required" });
      }

      const denuncia = await storage.getDenuncia(req.params.id);
      if (!denuncia || denuncia.clienteId !== clienteId) {
        return res.status(404).json({ message: "Denuncia no encontrada" });
      }

      const { contenido } = req.body;
      const user = req.session?.user;

      const mensaje = await storage.createDenunciaMensaje({
        denunciaId: denuncia.id,
        contenido,
        tipoRemitente: "internal_note",
        ...(user?.id && { investigadorId: user.id }),
      });

      // Log the action
      if (user) {
        await storage.createDenunciaAuditLog({
          denunciaId: denuncia.id,
          usuarioId: user.id,
          usuarioNombre: user.nombre || user.email,
          accion: "Agregó nota interna",
          detalles: { mensajeId: mensaje.id },
        });
      }

      // Emit WebSocket event for real-time updates (internal notes only visible to admins)
      emitDenunciaUpdate(denuncia.id, "new-message", { denunciaId: denuncia.id });

      res.json(mensaje);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Mark messages as read
  app.post("/api/denuncias/:id/mark-read", async (req, res) => {
    try {
      const clienteId = getEffectiveClienteId(req);
      if (!clienteId) {
        return res.status(400).json({ message: "Cliente ID required" });
      }

      const denuncia = await storage.getDenuncia(req.params.id);
      if (!denuncia || denuncia.clienteId !== clienteId) {
        return res.status(404).json({ message: "Denuncia no encontrada" });
      }

      // Mark all reporter messages as read by investigator
      const mensajes = await storage.getDenunciaMensajes(denuncia.id);
      for (const m of mensajes) {
        if (m.tipoRemitente === "reporter" && !m.leidoPorInvestigador) {
          await storage.markDenunciaMensajeRead(m.id, "investigator");
        }
      }

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get/Update denuncia configuration for cliente
  app.get("/api/denuncias/config", async (req, res) => {
    try {
      const clienteId = getEffectiveClienteId(req);
      if (!clienteId) {
        return res.status(400).json({ message: "Cliente ID required" });
      }

      const config = await storage.getDenunciaConfiguracion(clienteId);
      res.json(config || {
        clienteId,
        habilitado: true,
        permitirAnonimo: true,
        permitirAdjuntos: true,
        categoriasHabilitadas: ["harassment_abuse", "ethics_compliance", "suggestions", "safety_concerns"],
        diasParaResolucion: 30,
        notificarAdminNuevaDenuncia: true,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/denuncias/config", async (req, res) => {
    try {
      const clienteId = getEffectiveClienteId(req);
      if (!clienteId) {
        return res.status(400).json({ message: "Cliente ID required" });
      }

      const config = await storage.upsertDenunciaConfiguracion({
        ...req.body,
        clienteId,
      });

      res.json(config);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ============================================================================
  // Employee Document Folders (Google Drive-like structure for HR)
  // ============================================================================

  // Get all folders for an employee (as tree)
  app.get("/api/employees/:empleadoId/carpetas", async (req, res) => {
    try {
      const { empleadoId } = req.params;
      const clienteId = getEffectiveClienteId(req);

      if (!clienteId) {
        return res.status(400).json({ message: "Cliente ID required" });
      }

      // Initialize default folders if none exist
      let folders = await storage.getCarpetasEmpleado(empleadoId);
      if (folders.length === 0) {
        folders = await storage.initializeDefaultCarpetas(clienteId, empleadoId, (req as any).user?.id);
      }

      res.json(folders);
    } catch (error: any) {
      console.error("Error getting employee folders:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Create a new folder
  app.post("/api/employees/:empleadoId/carpetas", async (req, res) => {
    try {
      const { empleadoId } = req.params;
      const clienteId = getEffectiveClienteId(req);

      if (!clienteId) {
        return res.status(400).json({ message: "Cliente ID required" });
      }

      const folder = await storage.createCarpetaEmpleado({
        ...req.body,
        clienteId,
        empleadoId,
        tipo: "custom",
        createdBy: (req as any).user?.id,
      });

      res.json(folder);
    } catch (error: any) {
      console.error("Error creating folder:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Update a folder
  app.patch("/api/employees/:empleadoId/carpetas/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const folder = await storage.updateCarpetaEmpleado(id, req.body);
      res.json(folder);
    } catch (error: any) {
      console.error("Error updating folder:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Delete a folder
  app.delete("/api/employees/:empleadoId/carpetas/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteCarpetaEmpleado(id);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting folder:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // ============================================================================
  // Employee Documents (with folder support)
  // ============================================================================

  // Get documents for an employee (optionally filtered by folder)
  app.get("/api/employees/:empleadoId/documentos", async (req, res) => {
    try {
      const { empleadoId } = req.params;
      const { carpetaId } = req.query;

      let documents;
      if (carpetaId === "root") {
        documents = await storage.getDocumentosEmpleadoByFolder(empleadoId, null);
      } else if (carpetaId && typeof carpetaId === "string") {
        documents = await storage.getDocumentosEmpleadoByFolder(empleadoId, carpetaId);
      } else {
        documents = await storage.getDocumentosEmpleado(empleadoId);
      }

      res.json(documents);
    } catch (error: any) {
      console.error("Error getting employee documents:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get upload URL for a document
  app.get("/api/employees/:empleadoId/documentos/upload-url", async (req, res) => {
    try {
      const { empleadoId } = req.params;
      const filePath = `empleados/${empleadoId}/${randomUUID()}_upload`;
      const { signedUrl } = await supabaseStorage.getSignedUploadUrl("documentos-empleados", filePath);
      res.json({ uploadURL: signedUrl, path: filePath });
    } catch (error: any) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ message: "Failed to get upload URL" });
    }
  });

  // Create document record (after upload)
  app.post("/api/employees/:empleadoId/documentos", async (req, res) => {
    try {
      const { empleadoId } = req.params;
      const clienteId = getEffectiveClienteId(req);

      if (!clienteId) {
        return res.status(400).json({ message: "Cliente ID required" });
      }

      const { archivoUrl, ...rest } = req.body;

      // Normalize the URL for Supabase storage
      const normalizedUrl = supabaseStorage.normalizeStoragePath(archivoUrl);

      const documento = await storage.createDocumentoEmpleado({
        ...rest,
        clienteId,
        empleadoId,
        archivoUrl: normalizedUrl,
        subidoPor: (req as any).user?.id,
      });

      res.json(documento);
    } catch (error: any) {
      console.error("Error creating document:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Update document
  app.patch("/api/employees/:empleadoId/documentos/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const documento = await storage.updateDocumentoEmpleado(id, req.body);
      res.json(documento);
    } catch (error: any) {
      console.error("Error updating document:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Delete document
  app.delete("/api/employees/:empleadoId/documentos/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteDocumentoEmpleado(id);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting document:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Bulk move documents to a folder
  app.post("/api/employees/:empleadoId/documentos/bulk-move", async (req, res) => {
    try {
      const { documentoIds, carpetaId } = req.body;

      if (!Array.isArray(documentoIds) || documentoIds.length === 0) {
        return res.status(400).json({ message: "documentoIds array required" });
      }

      const documents = await storage.bulkMoveDocumentosToFolder(
        documentoIds,
        carpetaId === "root" ? null : carpetaId
      );

      res.json(documents);
    } catch (error: any) {
      console.error("Error bulk moving documents:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Search documents
  app.get("/api/employees/:empleadoId/documentos/search", async (req, res) => {
    try {
      const { empleadoId } = req.params;
      const { q } = req.query;

      if (!q || typeof q !== "string") {
        return res.status(400).json({ message: "Search query 'q' required" });
      }

      const documents = await storage.searchDocumentosEmpleado(empleadoId, q);
      res.json(documents);
    } catch (error: any) {
      console.error("Error searching documents:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Download document (get signed URL for viewing/downloading)
  app.get("/api/employees/:empleadoId/documentos/:id/download", async (req, res) => {
    try {
      const { id } = req.params;
      const documento = await storage.getDocumentoEmpleado(id);

      if (!documento) {
        return res.status(404).json({ message: "Document not found" });
      }

      // Parse the stored path to get bucket and file path
      const { bucket, path } = supabaseStorage.parsePath(documento.archivoUrl);

      // Stream the file to response from Supabase
      await supabaseStorage.downloadObject(bucket, path, res);
    } catch (error: any) {
      console.error("Error downloading document:", error);
      if (!res.headersSent) {
        res.status(500).json({ message: error.message });
      }
    }
  });

  // ============================================================================
  // Portal: Employee Folder Access (visible folders only)
  // ============================================================================

  app.get("/api/portal/carpetas", requireEmployeeAuth, async (req, res) => {
    try {
      const empleadoId = (req as any).empleadoId;
      const clienteId = getEffectiveClienteId(req);

      if (!clienteId || !empleadoId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      // Initialize default folders if none exist
      let folders = await storage.getCarpetasEmpleado(empleadoId);
      if (folders.length === 0) {
        folders = await storage.initializeDefaultCarpetas(clienteId, empleadoId);
      }

      // Filter to only visible folders for employees
      const visibleFolders = folders.filter(f => f.visibleParaEmpleado);
      res.json(visibleFolders);
    } catch (error: any) {
      console.error("Error getting portal folders:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/portal/carpetas/:carpetaId/documentos", requireEmployeeAuth, async (req, res) => {
    try {
      const empleadoId = (req as any).empleadoId;
      const { carpetaId } = req.params;

      if (!empleadoId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      // Verify folder is visible to employee
      const folder = await storage.getCarpetaEmpleado(carpetaId);
      if (!folder || folder.empleadoId !== empleadoId || !folder.visibleParaEmpleado) {
        return res.status(404).json({ message: "Folder not found" });
      }

      const documents = await storage.getDocumentosEmpleadoByFolder(empleadoId, carpetaId);
      res.json(documents);
    } catch (error: any) {
      console.error("Error getting folder documents:", error);
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
