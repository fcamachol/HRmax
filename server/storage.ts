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
  configurationChangeLogs,
  legalCases,
  settlements,
  lawsuits,
  bajaSpecialConcepts,
  users,
  employees
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Employees
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  getEmployee(id: string): Promise<Employee | undefined>;
  getEmployees(): Promise<Employee[]>;
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
      .where(eq(employees.status, 'active'));
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
}

export const storage = new DatabaseStorage();
