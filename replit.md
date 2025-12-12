# PeopleOps - Sistema de Recursos Humanos y Nómina para México

## Overview
PeopleOps is a comprehensive HR and payroll management system designed for Mexican businesses. Its primary purpose is to centralize employee data, manage payroll in compliance with Mexican tax regulations (ISR, IMSS, Infonavit), track attendance, and generate essential reports. The system supports complex payroll scenarios and aims to provide a modern, user-friendly SaaS experience. Key capabilities include modules for hiring (Altas), employee terminations (Bajas), and multi-company management. PeopleOps's ambition is to streamline HR operations, reduce compliance risks, and enhance human capital management for its users in Mexico.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The frontend is built with React 18, TypeScript, and Vite, featuring a modern SaaS aesthetic inspired by Linear and Notion. It utilizes `shadcn/ui` components, Tailwind CSS, and custom design tokens, offering both dark and light modes. `wouter` is used for routing.

### Technical Implementations
**Frontend**: Employs `@tanstack/react-query` for server state management and React Hook Form with Zod for validation.
**Backend**: An Express.js and Node.js backend provides a RESTful API. `tsx` is used for development and `esbuild` for production.
**Database**: PostgreSQL (Neon serverless) with Drizzle ORM for type-safe schemas and migrations, using Spanish column names.
**Payroll Engine**: A core engine calculates ISR, IMSS, and Subsidy based on 2025 Mexican tax tables, supporting various payment frequencies with `bigint` for precise 4-decimal calculations using basis points to avoid floating-point errors. It handles complete tax tables for ISR, Subsidio al Empleo, IMSS Cuotas, UMA, and Salario Mínimo for 2025, along with SAT CFDI 4.0 catalogs.
**Salary Calculation Formula**: Salario Diario Exento = Salario Diario Real - Salario Diario Nominal. If Salario Diario Nominal doesn't exist, the Exento is 0.
**Authentication & Authorization**: Features a multi-tenant permission system with hierarchical scope resolution (cliente → empresa → centro_trabajo → módulo), `requirePermission` middleware, and mock authentication for development. It supports internal (MaxTalent) and client user types with granular access control.
**Super Admin System**: Includes an independent authentication portal, cross-tenant user management, audit trails, and bcrypt password hashing. Accessible at `/super-admin/login`.
**Vacation & Benefits System**: Configurable benefits catalog (`cat_tablas_prestaciones`) and a ledger-based system (`kardex_vacaciones`) for tracking vacation accrual, usage, and expiration, compliant with LFT Art. 76.
**Overtime Hours System**: Complete implementation of overtime pay per LFT Articles 67 and 68. Horas Dobles (first 9 weekly hours at 200%) and Horas Triples (exceeding 9 weekly hours at 300%). Includes ISR exento/gravado calculations per LISR Art. 93. Catalog table `cat_tipos_horas_extra` stores the legal foundation and rates.
**Basis Points Helper Library**: A shared library (`shared/basisPoints.ts`) provides functions for converting pesos to basis points and performing safe arithmetic with 4-decimal precision using `Math.trunc()` to prevent rounding errors.
**Formula Evaluator (Secure)**: The payroll engine uses `expr-eval` library with strict whitelist validation for safe formula evaluation. Only allowed variables (SALARIO_DIARIO, UMA_DIARIA, etc.) and functions (min, max, abs, round, ceil, floor) are permitted. Formulas are validated against a whitelist before parsing to prevent code injection.
**Legal Concepts Catalog**: Pre-seeded catalog (`conceptos_medio_pago`) with 34 Mexican payroll concepts including formulas for ISR, IMSS, Prima Vacacional 25%, Aguinaldo 15 días, Horas Extra 2x/3x, etc. Includes `limiteExento` for tax-exempt calculations per LISR. Concepts are organized into 11 categories: salario, prevision_social, vales, plan_privado_pensiones, sindicato, horas_extra, prestaciones_ley, bonos_incentivos, descuentos, impuestos, and otros. The seed function (`server/seeds/conceptosLegales.ts`) auto-assigns categories to existing concepts.
**SAT Catalogs Phase 1**: 
  - `cat_bancos`: 15 Mexican banks with SAT codes (`codigo_sat`), account lengths (`longitud_cuenta`, `longitud_clabe`) for bank layout generation. Seeded at startup via `server/seeds/catalogosBase.ts`.
  - `cat_valores_uma_smg`: UMA, SMG, SMG_FRONTERA values with `vigencia_desde`/`vigencia_hasta` dates for historical tax calculations. Includes 2024-2025 values.
**Salary Change Tracking (Kardex Compensation)**: Table `kardex_compensation` automatically tracks salary changes (salarioDiario, SBC, SDI) via `storage.trackSalaryChanges()`. Records before/after values, effective date, and change type (CAMBIO_SALARIO, CAMBIO_SBC, CAMBIO_SDI, PROMOCION, AJUSTE_INFLACION).
**CFDI Nómina Tracking**: Table `cfdi_nomina` stores CFDI 4.0 XML references with `uuid_fiscal`, timbrado dates, PAC info, and status tracking. Supports cancelación with motivo codes per SAT.
**IMSS Movement Tracking (Phase 2)**: Table `imss_movimientos` tracks employee movements (alta, baja, modificacion_salario, reingreso) with automatic linkage to `kardex_compensation` via `kardexCompensationId`. Stores dual decimal/BP SBC values (`sbcDecimal`, `sbcBp`) for precise audit trails. Movements are auto-created when salary changes are detected via `trackSalaryChanges()`, prioritizing basis-point values as authoritative source. Endpoints validated with Zod schemas.
**SUA Bimestral Tracking (Phase 2)**: Table `sua_bimestres` manages IMSS bimonthly payment periods using `ejercicio`/`bimestre` (1-6) with status workflow: pendiente → calculado → pagado/vencido. Tracks montos (obrero, patronal, total) and payment dates. Full CRUD API with Zod validation.
**IMSS Calculation Engine (Phase 3)**: Server-side calculator (`server/services/imssCalculator.ts`) that reads rates from catalog tables instead of hardcoded values. Supports progressive Cesantía y Vejez rates (3.15%-6.42%) based on SBC/UMA ratio with 8 tiers from 1.00 SM to 4.01+ UMA per 2025 tables. All 5 IMSS ramos calculated: Enfermedades y Maternidad (especie/dinero), Invalidez y Vida, Cesantía y Vejez, and Riesgo de Trabajo. Uses basis points (`bigint`) for 4-decimal precision.
**SUA/IDSE File Generators (Phase 3)**: Services for generating official IMSS files:
  - `suaGenerator.ts`: Generates SUA files with pipe-delimited format for bimonthly payment uploads. Includes employee records, cuota breakdowns, and totals with checksums.
  - `idseGenerator.ts`: Generates IDSE files with fixed-width columns for affiliate movements (altas, bajas, modificaciones de salario, reingresos). Includes NSS/CURP validation with Módulo 10 algorithm.
**Employee History System (Phase 2)**: Option B architecture where employees table is the source of truth with automatic kardex triggers:
  - `kardex_employment`: Tracks employment status changes (estatus, motivo_baja, fecha_baja, fecha_reingreso). Created via database trigger `trg_kardex_employment`.
  - `kardex_labor_conditions`: Tracks labor condition changes (turno, jornada, tipo_contrato, horas_semanales). Created via database trigger `trg_kardex_labor_conditions`.
  - `kardex_bank_accounts`: Tracks bank account changes on employee record (banco_id, clabe, numero_cuenta). Created via database trigger `trg_kardex_bank_accounts`.
  - `employee_bank_accounts`: Multi-account support table with dispersion percentages, priority ordering, and activo flag. Supports payroll dispersion across multiple accounts.
  - Triggers use OLD/NEW row comparison to detect changes and atomically create kardex entries.
**Geographic Catalogs**: Standard SAT geographic reference tables:
  - `cat_paises`: Country catalog with ISO codes
  - `cat_estados`: State/region catalog with country reference
  - `cat_municipios`: Municipality catalog with state reference
  - `cat_codigos_postales`: Postal code catalog with municipality reference and asentamiento details
**Hiring to Employee Flow**: Complete "Completar Alta" workflow:
  - `hiringProcess.empleadoId`: Links completed hiring process to materialized employee
  - `/api/hiring/processes/:id/completar-alta` endpoint: Creates employee from hiring process data, updates status to "completado"
  - Supports mapping all personal data, address, bank accounts, and organizational assignments
**Dual Compensation System (BRUTO/NETO)**: Complete compensation architecture supporting both gross and net salary schemes:
  - `compensacion_trabajador`: Anchor table with vigencia dates. Stores `esquema_tipo` (BRUTO/NETO), `neto_deseado_bp`/`bruto_bp` as anchor, and package distribution percentages (% salario nominal, % exento, % bonos).
  - `compensacion_calculada`: Derived values per calculation with full breakdown of ISR, IMSS, Net Real, subsidies. Links to compensation package with `fechaCalculo` for audit.
  - All 119 existing employees migrated to NETO scheme with neto_deseado = salarioDiarioReal × 30.
**Cascading Exempt Payment System**: Three-layer ledger with per-employee cap overrides:
  - `exento_cap_configs`: Default caps per medio/concepto per empresa. Supports MXN or UMA units with monthly AND annual limits. `prioridadCascada` for allocation order.
  - `employee_exento_caps`: Per-employee overrides inheriting from defaults. If null, uses company default.
  - `payroll_exento_ledger`: Every peso paid tracked with concepto/subconcepto detail, cap consumption (monthly/annual), UMA snapshot for ISR compliance.
  - Effective cap = min(monthlyRemaining, annualRemaining) during cascade allocation.
**UMA Helper Functions**: `shared/umaHelper.ts` provides real-time UMA-to-MXN conversions querying `cat_valores_uma_smg` with vigencia date filtering.

### Feature Specifications
*   **Bajas (Terminations)**: Multi-step wizard for severance calculation, letter generation, and Kanban workflow. Includes comprehensive finiquito/liquidación calculations with LISR exento/gravado splits.
*   **Altas (Hiring)**: Multi-step wizard, offer letter generation, document management, and Kanban tracking.
*   **Empresas (Company Management)**: Supports multi-company management with fiscal data, `Registros Patronales`, and secure credential management.
*   **Centros de Trabajo & Multi-Shift System**: Manages work centers and configurable shifts for attendance tracking.
*   **Grupos de Nómina (Payroll Groups)**: Defines configurable payroll groups with different payment frequencies and automatic period generation.
*   **Payroll Module (Nómina)**: Manages payroll creation and data consistency.
*   **Attendance Module (Asistencia)**: Period-based tracking with mass incident capture.
*   **Recruitment & Selection Module**: Includes management of job openings (Vacantes), candidate tracking (Candidatos), and automated candidate-vacancy linking.
*   **Personal Management - Actas Administrativas (Administrative Records)**: Tracks disciplinary actions, incident documentation, and sanction management.
*   **Configuration - Medios de Pago (Payment Methods)**: Manages payment platforms with CRUD operations.
*   **IMSS Module (Phase 2)**: Complete IMSS movement management with Movimientos page (list, filter, create/edit movements) and SUA Bimestres page (bimonthly payment tracking with status management).
*   **CSV Bulk Employee Import**: Multi-step wizard (`CSVEmployeeUploader.tsx`) for importing employees from CSV files. Features:
  - Supports 78+ employee fields with flexible Spanish/English header mapping
  - Empresa name-to-ID resolution (matches by `nombreComercial` or `razonSocial`)
  - Banco name-to-nombre resolution using `cat_bancos` catalog
  - Validation for RFC, CURP, NSS, email, and other field formats
  - Preview mode with error highlighting before import
  - Downloadable CSV template with all supported fields
  - Tenant-aware: imports are scoped to the selected cliente via `ClienteContext`
  - Triggers automatic kardex population via Option B database triggers
  - Security: MaxTalent users can import to any cliente; client users restricted to their own clienteId (NOTE: requires real authentication in production)

## External Dependencies

*   **Database & Infrastructure**: `@neondatabase/serverless`, `drizzle-orm`, `drizzle-kit`.
*   **UI Framework & Components**: `@radix-ui/**`, `tailwindcss`, `lucide-react`.
*   **Form Management**: `react-hook-form`, `@hookform/resolvers`, `zod`, `drizzle-zod`.
*   **Data Fetching**: `@tanstack/react-query`.
*   **Date Handling**: `date-fns`.
*   **Object Storage**: `Replit Object Storage`.