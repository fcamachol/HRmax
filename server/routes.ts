import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { storage } from "./storage";
import { VARIABLES_FORMULA } from "./seeds/conceptosLegales";
import { generarLayoutsBancarios, getLayoutsGeneradosForNomina, getLayoutContent } from "./layoutGenerator";
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
  insertSuaBimestreSchema
} from "@shared/schema";
import { calcularFiniquito, calcularLiquidacionInjustificada, calcularLiquidacionJustificada } from "@shared/liquidaciones";
import { ObjectStorageService } from "./objectStorage";
import { analyzeLawsuitDocument } from "./documentAnalyzer";
import { requireSuperAdmin } from "./auth/middleware";
import bcrypt from "bcrypt";

export async function registerRoutes(app: Express): Promise<Server> {
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
      
      // Filter registros patronales by empresas in this cliente
      const clienteEmpresaIds = new Set(clienteEmpresas.map(e => e.id));
      const clienteRegistros = allRegistrosPatronales.filter((rp: any) => 
        clienteEmpresaIds.has(rp.empresaId)
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
        
        // Remove helper fields not in schema
        delete resolved.empresa;
        delete resolved.registroPatronal;
        
        return resolved;
      });

      // Validate each employee with relaxed bulk schema, then apply defaults
      const validatedEmployees = resolvedEmployees.map((emp: any, index: number) => {
        try {
          const validated = bulkInsertEmployeeSchema.parse(emp);
          // Apply defaults for DB required fields after validation
          return {
            ...validated,
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
      
      res.json({ created: created.length, employees: created });
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
      
      // Filtrar por empresa (returns active employees by default)
      if (empresaId) {
        // Get all centros for this empresa
        const centros = await storage.getCentrosTrabajoByEmpresa(empresaId as string);
        const centroIds = centros.map(c => c.id);
        
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
        const employees = await storage.getEmployeesByCentroAndGrupo(
          centroTrabajoId as string, 
          grupoNominaId as string
        );
        return res.json(serializeEmployees(employees));
      }
      
      // Filtrar solo por centro
      if (centroTrabajoId) {
        const employees = await storage.getEmployeesByCentroTrabajo(centroTrabajoId as string);
        return res.json(serializeEmployees(employees));
      }
      
      // Filtrar solo por grupo de nómina
      if (grupoNominaId) {
        const employees = await storage.getEmployeesByGrupoNomina(grupoNominaId as string);
        return res.json(serializeEmployees(employees));
      }
      
      const employees = await storage.getEmployees();
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
      const validatedData = req.body as Partial<typeof employees.$inferInsert>;
      const updated = await storage.updateEmployee(id, validatedData);
      res.json(updated);
    } catch (error: any) {
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

  // Modificaciones de Personal
  app.post("/api/modificaciones-personal", async (req, res) => {
    try {
      const { insertModificacionPersonalSchema } = await import("@shared/schema");
      const validatedData = insertModificacionPersonalSchema.parse(req.body);
      const modificacion = await storage.createModificacionPersonal(validatedData);
      res.json(modificacion);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/modificaciones-personal", async (req, res) => {
    try {
      const { empleadoId, tipo, estatus } = req.query;
      
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
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
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

      const objectStorageService = new ObjectStorageService();
      const normalizedPath = objectStorageService.normalizeObjectEntityPath(documentUrl);
      
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
      const validatedData = insertCentroTrabajoSchema.parse(req.body);
      const centro = await storage.createCentroTrabajo(validatedData);
      res.json(centro);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/centros-trabajo", async (req, res) => {
    try {
      const { empresaId } = req.query;
      if (empresaId) {
        const centros = await storage.getCentrosTrabajoByEmpresa(empresaId as string);
        return res.json(centros);
      }
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
  app.post("/api/incidencias-asistencia", async (req, res) => {
    try {
      const validatedData = insertIncidenciaAsistenciaSchema.parse(req.body);
      const incidencia = await storage.createIncidenciaAsistencia(validatedData);
      res.json(incidencia);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/incidencias-asistencia", async (req, res) => {
    try {
      const { fechaInicio, fechaFin, centroTrabajoId, empleadoId } = req.query;
      
      if (fechaInicio && fechaFin) {
        const incidencias = await storage.getIncidenciasAsistenciaByPeriodo(
          fechaInicio as string, 
          fechaFin as string, 
          centroTrabajoId as string | undefined
        );
        return res.json(incidencias);
      }
      
      if (empleadoId) {
        const incidencias = await storage.getIncidenciasAsistenciaByEmpleado(empleadoId as string);
        return res.json(incidencias);
      }
      
      const incidencias = await storage.getIncidenciasAsistencia();
      res.json(incidencias);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/incidencias-asistencia/:id", async (req, res) => {
    try {
      const incidencia = await storage.getIncidenciaAsistencia(req.params.id);
      if (!incidencia) {
        return res.status(404).json({ message: "Incidencia de asistencia no encontrada" });
      }
      res.json(incidencia);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/incidencias-asistencia/:id", async (req, res) => {
    try {
      const validatedData = updateIncidenciaAsistenciaSchema.parse(req.body);
      const incidencia = await storage.updateIncidenciaAsistencia(req.params.id, validatedData);
      res.json(incidencia);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/incidencias-asistencia/:id", async (req, res) => {
    try {
      await storage.deleteIncidenciaAsistencia(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Grupos de Nómina
  app.post("/api/grupos-nomina", async (req, res) => {
    try {
      const validatedData = insertGrupoNominaSchema.parse(req.body);
      const { employeeIds, ...grupoData } = validatedData;
      
      const grupo = await storage.createGrupoNomina(grupoData);
      
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
      res.json(grupo);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/grupos-nomina/:id", async (req, res) => {
    try {
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

  // Conceptos de Medios de Pago
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
      const conceptos = await storage.getConceptosMedioPago();
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

  // Plantillas de Nómina
  app.post("/api/plantillas-nomina", async (req, res) => {
    try {
      const validatedData = insertPlantillaNominaSchema.parse(req.body);
      const plantilla = await storage.createPlantillaNomina(validatedData);
      res.json(plantilla);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/plantillas-nomina", async (req, res) => {
    try {
      const { clienteId, empresaId } = req.query;
      if (clienteId && empresaId) {
        const plantillas = await storage.getPlantillasNominaByEmpresa(
          clienteId as string,
          empresaId as string
        );
        res.json(plantillas);
      } else {
        const plantillas = await storage.getPlantillasNomina();
        res.json(plantillas);
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/plantillas-nomina/:id", async (req, res) => {
    try {
      const plantilla = await storage.getPlantillaNomina(req.params.id);
      if (!plantilla) {
        return res.status(404).json({ message: "Plantilla no encontrada" });
      }
      res.json(plantilla);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/plantillas-nomina/:id", async (req, res) => {
    try {
      const partialData = updatePlantillaNominaSchema.parse(req.body);
      const plantilla = await storage.updatePlantillaNomina(req.params.id, partialData);
      res.json(plantilla);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/plantillas-nomina/:id", async (req, res) => {
    try {
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
        const periodos = await storage.getPeriodosNominaByGrupo(grupoNominaId as string);
        return res.json(periodos);
      }
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
      res.json(periodo);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/periodos-nomina", async (req, res) => {
    try {
      const validatedData = insertPeriodoNominaSchema.parse(req.body);
      const periodo = await storage.createPeriodoNomina(validatedData);
      res.json(periodo);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/periodos-nomina/:id", async (req, res) => {
    try {
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
      res.json(concepto);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/conceptos-nomina", async (req, res) => {
    try {
      const validatedData = insertConceptoNominaSchema.parse(req.body);
      const concepto = await storage.createConceptoNomina(validatedData);
      res.json(concepto);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // ============================================================================
  // NÓMINA - Incidencias
  // ============================================================================

  app.get("/api/incidencias-nomina", async (req, res) => {
    try {
      const { periodoId, empleadoId } = req.query;
      if (periodoId) {
        const incidencias = await storage.getIncidenciasNominaByPeriodo(periodoId as string);
        return res.json(incidencias);
      }
      if (empleadoId) {
        const incidencias = await storage.getIncidenciasNominaByEmpleado(empleadoId as string);
        return res.json(incidencias);
      }
      const incidencias = await storage.getIncidenciasNomina();
      res.json(incidencias);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/incidencias-nomina/:id", async (req, res) => {
    try {
      const incidencia = await storage.getIncidenciaNomina(req.params.id);
      if (!incidencia) {
        return res.status(404).json({ message: "Incidencia no encontrada" });
      }
      res.json(incidencia);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/incidencias-nomina", async (req, res) => {
    try {
      const validatedData = insertIncidenciaNominaSchema.parse(req.body);
      const incidencia = await storage.createIncidenciaNomina(validatedData);
      res.json(incidencia);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/incidencias-nomina/:id", async (req, res) => {
    try {
      const incidencia = await storage.updateIncidenciaNomina(req.params.id, req.body);
      res.json(incidencia);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/incidencias-nomina/:id", async (req, res) => {
    try {
      await storage.deleteIncidenciaNomina(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ============================================================================
  // NÓMINA - Movimientos
  // ============================================================================

  app.get("/api/nomina-movimientos", async (req, res) => {
    try {
      const { periodoId, empleadoId } = req.query;
      if (periodoId) {
        const movimientos = await storage.getNominaMovimientosByPeriodo(periodoId as string);
        return res.json(movimientos);
      }
      if (empleadoId) {
        const movimientos = await storage.getNominaMovimientosByEmpleado(empleadoId as string);
        return res.json(movimientos);
      }
      const movimientos = await storage.getNominaMovimientos();
      res.json(movimientos);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/nomina-movimientos/:id", async (req, res) => {
    try {
      const movimiento = await storage.getNominaMovimiento(req.params.id);
      if (!movimiento) {
        return res.status(404).json({ message: "Movimiento no encontrado" });
      }
      res.json(movimiento);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ============================================================================
  // NÓMINAS - CRUD Operations
  // ============================================================================

  app.get("/api/nominas", async (req, res) => {
    try {
      const { status, periodo, empresaId } = req.query;
      
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

  app.get("/api/nominas/:id", async (req, res) => {
    try {
      const nomina = await storage.getNomina(req.params.id);
      if (!nomina) {
        return res.status(404).json({ message: "Nómina no encontrada" });
      }
      res.json(nomina);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/nominas", async (req, res) => {
    try {
      const nomina = await storage.createNomina(req.body);
      res.json(nomina);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/nominas/:id", async (req, res) => {
    try {
      const nomina = await storage.updateNomina(req.params.id, req.body);
      res.json(nomina);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/nominas/:id", async (req, res) => {
    try {
      await storage.deleteNomina(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/nominas/:id/aprobar", async (req, res) => {
    try {
      const { id } = req.params;
      const { aprobadoPor } = req.body;
      
      const nomina = await storage.updateNominaStatus(id, "approved", aprobadoPor);
      
      let layouts: any[] = [];
      try {
        layouts = await generarLayoutsBancarios(id, aprobadoPor);
      } catch (layoutError: any) {
        console.warn(`[NOMINA APROBADA] No se pudieron generar layouts: ${layoutError.message}`);
      }
      
      res.json({
        success: true,
        message: "Nómina aprobada exitosamente",
        nomina,
        layouts: layouts.map(l => ({
          id: l.id,
          nombreArchivo: l.nombreArchivo,
          medioPagoId: l.medioPagoId,
          totalRegistros: l.totalRegistros,
          totalMonto: l.totalMonto,
        }))
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/nominas/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const { status, aprobadoPor } = req.body;
      
      if (!status) {
        return res.status(400).json({ message: "El status es requerido" });
      }
      
      const nomina = await storage.updateNominaStatus(id, status, aprobadoPor);
      
      if (status === "approved") {
        try {
          const layouts = await generarLayoutsBancarios(id, aprobadoPor);
          return res.json({
            success: true,
            nomina,
            layouts: layouts.map(l => ({
              id: l.id,
              nombreArchivo: l.nombreArchivo,
              medioPagoId: l.medioPagoId,
              totalRegistros: l.totalRegistros,
              totalMonto: l.totalMonto,
            }))
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

  app.post("/api/nominas/:nominaId/generar-layouts", async (req, res) => {
    try {
      const { nominaId } = req.params;
      const { generadoPor } = req.body;
      
      const layouts = await generarLayoutsBancarios(nominaId, generadoPor);
      res.json({ 
        success: true, 
        message: `Se generaron ${layouts.length} layout(s)`,
        layouts: layouts.map(l => ({
          id: l.id,
          nombreArchivo: l.nombreArchivo,
          medioPagoId: l.medioPagoId,
          totalRegistros: l.totalRegistros,
          totalMonto: l.totalMonto,
          formato: l.formato,
        }))
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/nominas/:nominaId/layouts", async (req, res) => {
    try {
      const { nominaId } = req.params;
      const layouts = await getLayoutsGeneradosForNomina(nominaId);
      res.json(layouts);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/layouts/:layoutId/download", async (req, res) => {
    try {
      const { layoutId } = req.params;
      const layout = await getLayoutContent(layoutId);
      
      if (!layout) {
        return res.status(404).json({ message: "Layout no encontrado" });
      }
      
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="${layout.nombreArchivo}"`);
      res.send(layout.contenido);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/layouts/:layoutId", async (req, res) => {
    try {
      const { layoutId } = req.params;
      const layout = await storage.getLayoutGenerado(layoutId);
      
      if (!layout) {
        return res.status(404).json({ message: "Layout no encontrado" });
      }
      
      res.json(layout);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/layouts/:layoutId", async (req, res) => {
    try {
      const { layoutId } = req.params;
      await storage.deleteLayoutGenerado(layoutId);
      res.json({ success: true });
    } catch (error: any) {
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
  
  app.post("/api/vacaciones", async (req, res) => {
    try {
      const validated = insertSolicitudVacacionesSchema.parse(req.body);
      
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

  const httpServer = createServer(app);

  return httpServer;
}
