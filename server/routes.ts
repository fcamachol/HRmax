import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertConfigurationChangeLogSchema, 
  insertLegalCaseSchema,
  insertSettlementSchema,
  insertLawsuitSchema,
  updateLawsuitSchema,
  insertEmployeeSchema,
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
  insertHoraExtraSchema,
  updateHoraExtraSchema
} from "@shared/schema";
import { calcularFiniquito, calcularLiquidacionInjustificada, calcularLiquidacionJustificada } from "@shared/liquidaciones";
import { ObjectStorageService } from "./objectStorage";
import { analyzeLawsuitDocument } from "./documentAnalyzer";

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
      const employees = req.body;
      
      if (!Array.isArray(employees)) {
        return res.status(400).json({ message: "Expected array of employees" });
      }

      // Validate each employee
      const validatedEmployees = employees.map((emp, index) => {
        try {
          return insertEmployeeSchema.parse(emp);
        } catch (error: any) {
          throw new Error(`Employee at index ${index}: ${error.message}`);
        }
      });

      // Create all employees
      const created = await storage.createBulkEmployees(validatedEmployees);
      
      res.json({ created: created.length, employees: created });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/employees", async (req, res) => {
    try {
      const employees = await storage.getEmployees();
      res.json(employees);
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
      res.json(employee);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/employees/:id", async (req, res) => {
    try {
      const { id } = req.params;
      // Validate partial update with insertEmployeeSchema (will reject unknown fields)
      const validatedData = insertEmployeeSchema.partial().parse(req.body);
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

  const httpServer = createServer(app);

  return httpServer;
}
