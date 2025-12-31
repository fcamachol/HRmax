# PeopleOps - Sistema de Recursos Humanos y Nómina para México

## Overview
PeopleOps is a comprehensive HR and payroll management system designed for Mexican businesses. Its primary purpose is to centralize employee data, manage payroll in compliance with Mexican tax regulations (ISR, IMSS, Infonavit), track attendance, and generate essential reports. The system supports complex payroll scenarios and aims to provide a modern, user-friendly SaaS experience. Key capabilities include modules for hiring (Altas), employee terminations (Bajas), multi-company management, and various HR functionalities. PeopleOps's ambition is to streamline HR operations, reduce compliance risks, and enhance human capital management for its users in Mexico.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The frontend is built with React 18, TypeScript, and Vite, featuring a modern SaaS aesthetic inspired by Linear and Notion. It utilizes `shadcn/ui` components, Tailwind CSS, and custom design tokens, offering both dark and light modes. `wouter` is used for routing.

### Technical Implementations
**Frontend**: Employs `@tanstack/react-query` for server state management and React Hook Form with Zod for validation.
**Backend**: An Express.js and Node.js backend provides a RESTful API. `tsx` is used for development and `esbuild` for production.
**Database**: PostgreSQL (Neon serverless) with Drizzle ORM for type-safe schemas and migrations, using Spanish column names.
**Payroll Engine**: A core engine calculates ISR, IMSS, and Subsidy based on 2025 Mexican tax tables, supporting various payment frequencies with `bigint` for precise 4-decimal calculations using basis points. It handles complete tax tables for ISR, Subsidio al Empleo, IMSS Cuotas, UMA, and Salario Mínimo for 2025, along with SAT CFDI 4.0 catalogs. It includes a secure formula evaluator with strict whitelist validation.
**Authentication & Authorization**: Features a multi-tenant permission system with hierarchical scope resolution (`cliente` → `empresa` → `centro_trabajo` → `módulo`), `requirePermission` middleware, and session-based authentication with HttpOnly cookies. It supports internal (MaxTalent) and client user types with granular access control. Multi-tenant data isolation is enforced at the API level.
**Super Admin System**: Independent authentication portal, cross-tenant user management, and audit trails.
**Vacation & Benefits System**: Configurable benefits catalog and a ledger-based system (`kardex_vacaciones`) for tracking vacation accrual, usage, and expiration, compliant with LFT Art. 76.
**Overtime Hours System**: Implements overtime pay per LFT Articles 67 and 68 (Horas Dobles/Triples) including ISR exento/gravado calculations per LISR Art. 93.
**Basis Points Helper Library**: Provides functions for safe arithmetic with 4-decimal precision using `bigint`.
**Legal Concepts Catalog**: Pre-seeded catalog with 34 Mexican payroll concepts including formulas for ISR, IMSS, Prima Vacacional, Aguinaldo, Horas Extra, etc., categorized and with `limiteExento` for tax-exempt calculations.
**SAT Catalogs**: Includes `cat_bancos` (Mexican banks), `cat_valores_uma_smg` (UMA, SMG values with validity dates), and geographic catalogs (`cat_paises`, `cat_estados`, `cat_municipios`, `cat_codigos_postales`).
**Salary Change Tracking (Kardex Compensation)**: `kardex_compensation` table automatically tracks salary changes (salarioDiario, SBC, SDI).
**CFDI Nómina Tracking**: `cfdi_nomina` table stores CFDI 4.0 XML references, timbrado dates, PAC info, and status tracking, supporting cancellation.
**IMSS Movement Tracking**: `imss_movimientos` tracks employee movements (alta, baja, modificacion_salario, reingreso) automatically linked to `kardex_compensation`.
**SUA Bimestral Tracking**: `sua_bimestres` manages IMSS bimonthly payment periods with status workflow and tracks montos.
**IMSS Calculation Engine**: Server-side calculator reading rates from catalog tables, supporting progressive Cesantía y Vejez rates and all 5 IMSS ramos with 4-decimal precision using basis points.
**SUA/IDSE File Generators**: Services for generating official IMSS files (SUA for bimonthly payments, IDSE for affiliate movements).
**Employee History System**: Database triggers automatically populate kardex tables for employment status (`kardex_employment`), labor conditions (`kardex_labor_conditions`), and bank account changes (`kardex_bank_accounts`). Supports multi-account payroll dispersion via `employee_bank_accounts`.
**Hiring to Employee Flow**: "Completar Alta" workflow to create employees from hiring process data, mapping personal data, address, bank accounts, and organizational assignments.
**Dual Compensation System (BRUTO/NETO)**: Supports both gross and net salary schemes with `compensacion_trabajador` (anchor table) and `compensacion_calculada` (derived values). Includes an inverse payroll calculator using a Newton-Raphson style iteration to calculate BRUTO from a NETO target.
**Cascading Exempt Payment System**: Three-layer ledger (`exento_cap_configs`, `employee_exento_caps`, `payroll_exento_ledger`) for tracking and applying tax-exempt caps with per-employee overrides and cascade allocation.
**UMA Helper Functions**: Provides real-time UMA-to-MXN conversions from `cat_valores_uma_smg`.

### Feature Specifications
*   **Bajas (Terminations)**: Multi-step wizard for severance calculation, letter generation, and Kanban workflow, including finiquito/liquidación calculations with LISR exento/gravado splits.
*   **Altas (Hiring)**: Multi-step wizard, offer letter generation, document management, and Kanban tracking.
*   **Empresas (Company Management)**: Supports multi-company management with fiscal data, `Registros Patronales`, and secure credential management.
*   **Centros de Trabajo & Multi-Shift System**: Manages work centers and configurable shifts for attendance.
*   **Grupos de Nómina (Payroll Groups)**: Defines configurable payroll groups with different payment frequencies.
*   **Payroll Module (Nómina)**: Manages payroll creation and data consistency.
*   **Attendance Module (Asistencia)**: Period-based tracking with mass incident capture.
*   **Recruitment & Selection Module**: Manages job openings, candidate tracking, and automated linking.
*   **Personal Management - Actas Administrativas**: Tracks disciplinary actions and incident documentation.
*   **Configuration - Medios de Pago**: Manages payment platforms.
*   **IMSS Module**: Manages IMSS movements and bimonthly payment tracking.
*   **CSV Bulk Employee Import**: Multi-step wizard for importing employees from CSV, supporting 78+ fields, flexible header mapping, tenant-aware processing, and automatic kardex population.

## External Dependencies

*   **Database & Infrastructure**: `@neondatabase/serverless`, `drizzle-orm`, `drizzle-kit`.
*   **UI Framework & Components**: `@radix-ui/**`, `tailwindcss`, `lucide-react`.
*   **Form Management**: `react-hook-form`, `@hookform/resolvers`, `zod`, `drizzle-zod`.
*   **Data Fetching**: `@tanstack/react-query`.
*   **Date Handling**: `date-fns`.
*   **Object Storage**: `Replit Object Storage`.