# NominaHub - Sistema de Recursos Humanos y Nómina para México

## Overview
NominaHub is a comprehensive HR and payroll management system for Mexican businesses. It centralizes employee data, handles payroll compliant with Mexican tax regulations (ISR, IMSS, Infonavit), tracks attendance, and generates essential reports. The system supports complex payroll scenarios, offering a modern SaaS-style interface. Key modules include Altas (hiring with onboarding and document management), Bajas (employee termination with severance calculation), and extensive multi-company management. NominaHub aims to streamline HR processes, reduce compliance risks, and provide a user-friendly experience for managing human capital in Mexico.

## User Preferences
Preferred communication style: Simple, everyday language.

## Recent Changes - Vacation & Benefits System (2025-01-24)

**Status**: ✅ COMPLETE - Configurable vacation/benefits management with ledger-based tracking and LFT Art. 76 compliance

### Completed Components:
1. ✅ **Database Schema** - Architect approved
   - `cat_tablas_prestaciones`: Configurable benefits catalog (vacation days, aguinaldo, prima vacacional by year)
   - `kardex_vacaciones`: Ledger system tracking devengo, disfrute, caducidad, finiquito movements
   - Extended `employees` table with `esquema_prestaciones_id` and `saldo_vacaciones_actual` fields

2. ✅ **LFT Art. 76 Bug Fix** - Architect approved
   - Corrected `obtenerDiasVacaciones()` in finiquitoCalculations.ts
   - Fixed 2-day deficit: year 2 now correctly returns 14 días (was 12)
   - Proper interpretation: "segundo año de servicio" = 1-2 años trabajados, not 2-3 años

3. ✅ **Seed Data** - `server/seeds/prestacionesLFT.ts`
   - 60 rows total: 30 for LFT 2024 + 30 for Puestos de Confianza
   - Accurate vacation progression: 12→14→16→18→20 (años 1-5), then +2 every 5 years
   - Auto-calculates factor de integración for SBC
   - Executable script: `npx tsx server/seeds/prestacionesLFT.ts`

4. ✅ **Storage Layer** - Architect approved
   - CRUD operations for `cat_tablas_prestaciones` and `kardex_vacaciones`
   - `getSaldoVacacionesEmpleado()`: Calculates current balance from ledger
   - Proper numeric-to-string conversions for PostgreSQL numeric fields

5. ✅ **Database Migration** - Applied manually via execute_sql_tool
   - Created both new tables with indexes
   - Extended employees table with ALTER TABLE
   - Seed executed successfully with 60 prestaciones rows

### Technical Decisions:
- **Why catalog system?** Different companies/unions have varying vacation policies beyond LFT minimum
- **Why kardex ledger?** Audit trail for devengo (accrual), disfrute (usage), caducidad (18-month expiration per LFT Art. 81)
- **Schema naming?** Spanish fields match existing convention (aniosAntiguedad, diasVacaciones, primaVacacionalPct)
- **Factor de integración?** Pre-calculated for SBC: 1 + ((aguinaldo + (vacaciones × prima%)) / 365)
- **Saldo cache?** READ-ONLY field in employees for performance; source of truth is kardex

## Recent Changes - Payroll System Complete (2025-01-12)

**Status**: ✅ COMPLETE - Full payroll infrastructure with seed data, calculations, and Mexican tax compliance

### Completed Components:
1. ✅ **Basis Points Helper Library** - `shared/basisPoints.ts`
   - Conversion functions: `pesosToBp()`, `bpToPesos()`, `porcentajeToBp()`
   - Safe arithmetic: `sumarBp()`, `restarBp()`, `multiplicarBpPorTasa()`, `dividirBp()`
   - 4 decimal precision (10,000 basis points = 1 peso)
   - Uses `Math.trunc()` instead of `Math.round()` to prevent upward rounding errors

2. ✅ **Payroll Database Schema** - 12 new tables in `shared/schema.ts`
   - **SAT Catalogs (Global)**: `catSatTiposPercepcion`, `catSatTiposDeduccion`, `catSatTiposOtroPago`
   - **Fiscal Tables (Global, bigint)**: `catIsrTarifas`, `catSubsidioEmpleo`, `catImssConfig`, `catImssCuotas`
   - **Core Payroll (Tenant-scoped)**: `conceptosNomina`, `periodosNomina`, `incidenciasNomina`, `nominaMovimientos`, `nominaResumen`
   - **Employee Extensions**: Added `sbcBp` and `sdiBp` to employees table

3. ✅ **Migration Applied Manually** - Due to drizzle-kit push TTY issues
   - Created all 12 tables via `execute_sql_tool`
   - Applied 15 foreign key constraints
   - Created 17 performance indexes
   - Extended employees table with ALTER TABLE
   - All SQL extracted from `migrations/0000_stale_skreet.sql`

4. ✅ **Payroll Calculation Functions** - `shared/payrollCalculations.ts`
   - `calcularISR()` - Income tax with progressive rates for all periods
   - `calcularSubsidio()` - Employment subsidy lookup
   - `calcularIMSS()` - Social security contributions (13 ramos)
   - `calcularSDI()` - Integrated daily salary (SDI)
   - `calcularSBC()` - Contribution base salary (SBC)
   - `calcularHorasExtra()` - Overtime with double/triple rates
   - All use bigint arithmetic with Math.trunc() for exact precision

5. ✅ **Seed Data** - `server/seeds/payrollCatalogs.ts`
   - **SAT CFDI 4.0 Catalogs**: 7 percepciones, 8 deducciones, 3 otros pagos
   - **ISR Tables 2025**: 11 brackets × 4 periods (44 rows total)
   - **Subsidio Tables 2025**: 11 brackets × 4 periods (44 rows total)
   - **IMSS Config 2025**: UMA=$108.57, Salario Mínimo=$278.80, Tope=25 UMAs
   - **IMSS Cuotas 2025**: 12 quotas (patrón/trabajador split)
   - Executable script: `npx tsx server/seeds/payrollCatalogs.ts`

### Technical Decisions:
- **Why bigint?** Mexican tax law requires exact calculations to 4 decimals; floating point causes rounding errors
- **Why basis points?** 1 peso = 10,000 bp ensures integer arithmetic without precision loss
- **Manual migration?** `drizzle-kit push` blocks on interactive prompts in non-TTY Replit environment
- **Global vs tenant tables?** SAT/IMSS catalogs are standard across all clients; payroll data is tenant-isolated
- **Schema naming?** camelCase in TypeScript/Drizzle (limiteInferiorBp, cuotaFijaBp) for consistency
- **Math.trunc vs Math.round?** Prevents upward rounding that causes overpayment in UMA caps and overtime

## Recent Changes - Super Admin Portal (2025-01-11)

**Status**: ✅ COMPLETE - Fully functional Super Admin portal with independent authentication

### Completed Components:
1. ✅ **Database Schema** - Architect approved
   - `users.isSuperAdmin: boolean` (default: false)
   - `users.created_at`, `users.updated_at` timestamps
   - `admin_audit_logs` table with tenant traceability (clienteId, empresaId, centroTrabajoId)
   - FK on adminUserId with ON DELETE RESTRICT to preserve audit trail
   - Migration applied via ALTER TABLE

2. ✅ **Type Safety** - Architect approved
   - `PublicUser = Omit<User, 'password'>` - excludes sensitive fields
   - `UpdateUser` Zod schema - validates only safe fields (nombre, email, tipoUsuario, clienteId, activo, isSuperAdmin)
   - Prevents password hash exposure

3. ✅ **Authorization Middleware** - Architect approved
   - `requireSuperAdmin` validates user.isSuperAdmin flag
   - mockAuthMiddleware extended to support "X-Username" header
   - Request.user interface includes username field

4. ✅ **Storage Layer** - Architect approved
   - `getAllUsers()`: Returns PublicUser[] without password
   - `updateUser()`: Runtime validation with updateUserSchema.parse(), before/after audit snapshots
   - `deleteUser()`: Prevents self-deletion, requires actingUserId
   - `createAdminAuditLog()`: Records admin actions with full context
   - `getAdminAuditLogs()`: Retrieves audit trail

5. ✅ **API Routes** - Architect approved
   - POST /api/admin/login - Bcrypt authentication (cost 12)
   - GET /api/admin/users - List all users (requireSuperAdmin)
   - POST /api/admin/users - Create user with uniqueness checks, super admin elevation guard
   - PATCH /api/admin/users/:id - Update user with audit logging
   - DELETE /api/admin/users/:id - Delete user with audit logging

6. ✅ **Authentication Flow** - Architect approved
   - Independent login page at /super-admin/login
   - localStorage-based session storage
   - Automatic header injection (X-User-Id, X-Username, X-Is-Super-Admin, X-User-Type)
   - getSuperAdminHeaders() in queryClient.ts for all requests
   - Logout functionality with localStorage cleanup

7. ✅ **Frontend UI** - Architect approved
   - SuperAdminLogin.tsx - Independent login page
   - SuperAdmin.tsx - Complete user management interface
   - Integrated in App.tsx with separate layout (outside main sidebar)
   - Auth check and auto-redirect to login

8. ✅ **Seed Data** - Complete
   - Initial super admin created via server/seed-superadmin.ts
   - Credentials: username=superadmin, password=Admin123!
   - ID: 5e672c59-1f2c-43b1-a331-73e6e391e2ae

### Security Model:
- Super admins bypass normal permission hierarchy
- All mutations logged to admin_audit_logs with before/after snapshots
- Self-deletion prevented via required actingUserId
- Password updates prohibited via updateUser endpoint
- Bcrypt cost factor 12 for password hashing
- Username uniqueness enforced
- Only existing super admins can elevate other users to super admin

### Access Instructions:
1. Navigate to `/super-admin/login`
2. Login with: username=`superadmin`, password=`Admin123!`
3. Portal accessible at `/super-admin`

## System Architecture

### UI/UX Decisions
The frontend uses React 18, TypeScript, and Vite, with a modern SaaS aesthetic inspired by Linear and Notion. It's built with shadcn/ui components, Tailwind CSS, and custom design tokens, supporting dark and light modes. `wouter` handles routing.

### Technical Implementations
**Frontend**: Employs @tanstack/react-query for server state management and React Hook Form with Zod for validation.
**Backend**: An Express.js and Node.js backend provides a RESTful API. `tsx` is used for development and `esbuild` for production.
**Database**: PostgreSQL (Neon serverless) with Drizzle ORM for type-safe schemas and migrations, using Spanish column names.
**Payroll Engine**: A core engine calculates ISR, IMSS, and Subsidy based on 2025 tax tables, supporting various payment frequencies.
**Authentication & Authorization**: Features a multi-tenant permission system with hierarchical scope resolution (cliente → empresa → centro_trabajo → módulo), `requirePermission` middleware, and mock authentication for development. Supports MaxTalent (internal) and Cliente user types with granular access control.
**Super Admin System**: Complete infrastructure with independent authentication portal, cross-tenant user management, audit trail, and bcrypt password hashing. Accessible at `/super-admin/login` with credentials: superadmin/Admin123!.

### Feature Specifications
*   **Bajas (Terminations)**: Multi-step wizard for severance calculation, letter generation, and Kanban workflow.
*   **Altas (Hiring)**: Multi-step wizard, offer letter generation, document management (Replit Object Storage), and Kanban tracking.
*   **Empresas (Company Management)**: Supports multi-company management with fiscal data, `Registros Patronales`, and secure credential management (Replit Secrets).
*   **Centros de Trabajo & Multi-Shift System**: Manages work centers and configurable shifts for attendance tracking.
*   **Grupos de Nómina (Payroll Groups)**: Defines configurable payroll groups with different payment frequencies and automatic period generation.
*   **Payroll Module (Nómina)**: Manages payroll creation and data consistency.
*   **Attendance Module (Asistencia)**: Period-based tracking with mass incident capture in an Excel-like grid.
*   **Recruitment & Selection Module**:
    *   **Vacantes (Job Openings)**: CRUD interface for job postings with search and filters.
    *   **Candidatos (Candidates)**: Comprehensive candidate database with a 4-tab form, search, and filters.
    *   **Candidate-Vacancy Linking**: Automated workflow linking candidates to job openings with default selection stages.
*   **Personal Management - Actas Administrativas (Administrative Records)**: Tracks disciplinary actions with fault classification, incident documentation, sanction management, appeal process tracking, and comprehensive search/filters.
*   **Configuration - Medios de Pago (Payment Methods)**: Manages payment platforms (electronic wallets, unions) with CRUD operations, active status toggles, and search/filters.

## External Dependencies

*   **Database & Infrastructure**: `@neondatabase/serverless`, `drizzle-orm`, `drizzle-kit`.
*   **UI Framework & Components**: `@radix-ui/**`, `tailwindcss`, `lucide-react`.
*   **Form Management**: `react-hook-form`, `@hookform/resolvers`, `zod`, `drizzle-zod`.
*   **Data Fetching**: `@tanstack/react-query`.
*   **Date Handling**: `date-fns`.
*   **Object Storage**: `Replit Object Storage`.