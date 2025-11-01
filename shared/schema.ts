import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, integer, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const employees = pgTable("employees", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  rfc: varchar("rfc", { length: 13 }).notNull().unique(),
  curp: varchar("curp", { length: 18 }).notNull().unique(),
  nss: varchar("nss", { length: 11 }).notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  department: text("department").notNull(),
  position: text("position").notNull(),
  salary: decimal("salary", { precision: 10, scale: 2 }).notNull(),
  contractType: text("contract_type").notNull(),
  startDate: date("start_date").notNull(),
  status: text("status").notNull().default("active"),
  vacationDays: integer("vacation_days").notNull().default(12),
  sickDays: integer("sick_days").notNull().default(0),
});

export const departments = pgTable("departments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
});

export const payrollPeriods = pgTable("payroll_periods", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  frequency: text("frequency").notNull(),
  status: text("status").notNull().default("pending"),
});

export const attendance = pgTable("attendance", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").notNull(),
  date: date("date").notNull(),
  status: text("status").notNull(),
  clockIn: text("clock_in"),
  clockOut: text("clock_out"),
});

export const insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
});

export const insertDepartmentSchema = createInsertSchema(departments).omit({
  id: true,
});

export const insertPayrollPeriodSchema = createInsertSchema(payrollPeriods).omit({
  id: true,
});

export const insertAttendanceSchema = createInsertSchema(attendance).omit({
  id: true,
});

export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type Department = typeof departments.$inferSelect;
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;
export type PayrollPeriod = typeof payrollPeriods.$inferSelect;
export type InsertPayrollPeriod = z.infer<typeof insertPayrollPeriodSchema>;
export type Attendance = typeof attendance.$inferSelect;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
