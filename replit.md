# NominaHub - Sistema de Recursos Humanos y Nómina para México

## Overview
NominaHub is a comprehensive HR and payroll management system designed for Mexican businesses. It centralizes employee data, handles payroll compliant with Mexican tax regulations (ISR, IMSS, Infonavit), tracks attendance, and generates essential reports. The system supports complex payroll scenarios, offering a modern SaaS-style interface. Key modules include Altas (hiring with onboarding and document management) and Bajas (employee termination with severance calculation). NominaHub aims to streamline HR processes, reduce compliance risks, and provide a user-friendly experience for managing human capital in Mexico.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The frontend is built with React 18 and TypeScript, using Vite for development. It features a modern SaaS aesthetic inspired by platforms like Linear and Notion, implemented with shadcn/ui components, Tailwind CSS, and custom design tokens, supporting both dark and light modes. Routing is handled by `wouter`.

### Technical Implementations
**Frontend**: Uses @tanstack/react-query for server state management and React Hook Form with Zod for robust form validation.
**Backend**: Utilizes Express.js with TypeScript on Node.js, providing a RESTful API with JSON responses and modular endpoint management. `tsx` is used for development and `esbuild` for production.
**Database**: PostgreSQL (Neon serverless) is the chosen database, managed with Drizzle ORM for type-safe schemas and migrations. Spanish column names are used for compliance.
**Payroll Engine**: A core payroll calculation engine handles ISR, IMSS, and Subsidy calculations based on 2025 tax tables, supporting various payment frequencies and income types.
**Authentication & Authorization**: 
- Multi-tenant permission system with hierarchical scope resolution (cliente → empresa → centro_trabajo → módulo)
- Authorization middleware (`requirePermission`) validates user access before executing route handlers
- Mock authentication middleware for development (X-User-Id header) - to be replaced with session-based auth
- Permission helper (`checkUserPermission`) implements complete hierarchical resolution with module-level fallback
- Support for two user types: MaxTalent (internal) and Cliente (customer) with granular access control

### Feature Specifications
*   **Bajas (Terminations)**: Multi-step wizard for severance calculation (finiquito/liquidación) compliant with Mexican labor law, termination letter generation, and a Kanban board for workflow management.
*   **Altas (Hiring)**: Multi-step hiring wizard, offer letter generation, document upload and management (using Replit Object Storage), and a Kanban board to track hiring stages. Supports various contract types.
*   **Empresas (Company Management)**: Supports multi-company management with full fiscal data, `Registros Patronales` (IMSS employer registrations), and secure credential management for government systems (integrating with Replit Secrets for sensitive data). E.firma support is also included.
*   **Centros de Trabajo & Multi-Shift System**: Manages multiple work centers and configurable shifts per center, including schedules, working days, and tolerance settings. Employees are assigned to specific shifts for precise attendance tracking.
*   **Grupos de Nómina (Payroll Groups)**: Allows defining configurable payroll groups with different payment frequencies (weekly, biweekly, twice monthly, monthly). It features automatic generation of payroll periods for the current and next year, ensuring full year coverage. Employees can be assigned to specific payroll groups.
*   **Payroll Module (Nómina)**: Provides interfaces for creating and managing payroll, dynamically selecting payroll groups, and ensuring data consistency via API integration.
*   **Attendance Module (Asistencia)**: Redesigned for period-based tracking, allowing mass incident capture (absences, tardiness, overtime, medical leave, etc.) in an Excel-like grid. Features dual filtering by work center and payroll group, and smart period selection.
*   **Recruitment & Selection Module (Reclutamiento y Selección)**:
    *   **Vacantes (Job Openings)**: Full CRUD interface with dialog form capturing requisitos, salario, ubicación, fecha solicitud, and status management. Table displays key info with date tracking (fecha solicitud always shown, última modificación when updated). Features search, filters, and quick-access requisitos detail dialog.
    *   **Candidatos (Candidates)**: Comprehensive candidate database with 4-tab form (General info, Professional profile, Education & Skills, Documents & Notes). Table displays avatar, full name, desired position, years of experience, contact info (email/phone stacked), source badge, status badge, and registration date. Features search (by name, email, phone, position), filters (status, source), and status management actions (activo, contratado, descartado, inactivo). Supports dynamic skill chips, language proficiency tracking, and referral tracking.
    *   **Candidate-Vacancy Linking (Proceso de Selección)**: Automated workflow linking candidates to job openings. When creating a candidate, users can optionally select a vacancy to trigger automatic creation of a selection process (procesoSeleccion) record with default "Nueva aplicación" stage. Backend endpoint `/api/etapas-seleccion/inicializar` seeds 8 default selection stages if not present. Candidates table includes "Vacante Vinculada" column showing linked vacancy (título + departamento) using precomputed maps for O(n) performance. Form properly normalizes empty vacancy selection (empty string → undefined) to support "banco de candidatos" (candidate pool without specific vacancy). Edit mode displays current link as read-only. Error handling includes graceful fallback when etapas or procesoSeleccion creation fails, with user notifications.
*   **Personal Management - Actas Administrativas (Administrative Records)**: Comprehensive disciplinary action tracking system compliant with Mexican labor law. Features include:
    *   **Fault Classification**: Three-tier severity system (leve, grave, muy_grave) aligned with Mexican labor regulations
    *   **Incident Documentation**: Detailed capture of incident date, time, location, description, and witness statements
    *   **Sanction Management**: Supports multiple sanction types (amonestación, suspensión con días, descuento con monto, despido, ninguna) with conditional field validation
    *   **Appeal Process**: Tracks appeal status (apelación_presentada) with dedicated workflow states
    *   **Status Tracking**: Full lifecycle management (pendiente, aplicada, apelada, anulada, archivada) with visual badges
    *   **Employee Enrichment**: Storage layer performs leftJoin with employees table to provide complete employee context in all responses
    *   **Search & Filters**: Real-time search by employee name, numero empleado, or numero acta, with dual filters by tipo de falta and estatus
    *   **Form Validation**: Comprehensive validation using Zod schemas with cross-field conditional logic (e.g., diasSuspension required when sancionAplicada = 'suspension')
    *   **PATCH Pattern**: Implements 5-step merge-and-validate workflow matching other personal management modules for data integrity
    *   **Internal Controls**: Supports elaborado_por, aprobado_por fields, internal notes, and detailed sanction descriptions for audit trail
*   **Configuration - Medios de Pago (Payment Methods)**: Manages payment platforms for payroll disbursement, specifically monederos electrónicos (electronic wallets like Saldazo, Spin) and sindicatos (union-managed payment systems). Features include:
    *   **Platform Management**: CRUD operations for payment method records (nombre, descripción, tipo comprobante, cuenta depósito)
    *   **Document Type**: Supports two receipt types (factura, recibo sin IVA) for tax compliance
    *   **Active Status**: Toggle to enable/disable payment methods without deletion for audit trail preservation
    *   **Search & Filters**: Real-time search by payment method name with visual badge indicators for active/inactive status
    *   **Form Validation**: Comprehensive validation using Zod schemas ensuring unique payment method names and proper field requirements
    *   **PATCH Pattern**: Implements 5-step merge-and-validate workflow for data integrity matching other configuration modules
    *   **Sidebar Integration**: Organized under collapsible "Configuración" section with route path /configuration/medios-pago
    *   **Testing Coverage**: Complete data-testid attributes on all interactive elements for automated e2e testing
    *   **Scope**: Exclusively for payment platforms (monederos, sindicatos) - NOT for regular transfers, cash, or checks

## External Dependencies

### Database & Infrastructure
*   **@neondatabase/serverless**: PostgreSQL hosting.
*   **drizzle-orm**, **drizzle-kit**: ORM and migration tools.

### UI Framework & Components
*   **@radix-ui/**: Accessible UI primitives.
*   **tailwindcss**: Utility-first CSS framework.
*   **lucide-react**: Icon library.

### Form Management
*   **react-hook-form**, **@hookform/resolvers**: Form state and validation.
*   **zod**, **drizzle-zod**: Schema validation.

### Data Fetching
*   **@tanstack/react-query**: Server state management.

### Date Handling
*   **date-fns**: Date utility library.

### Object Storage
*   **Replit Object Storage**: For document and file uploads.

## Authorization & Permissions System

### Multi-Tenant Permission Model
NominaHub implements a hierarchical permission system supporting four scope levels:
1. **Módulo** (global): User has access to all data within a module regardless of scope
2. **Cliente**: User has access to all empresas and centros de trabajo under a specific client
3. **Empresa**: User has access to all centros de trabajo under a specific company
4. **Centro de Trabajo**: User has access only to a specific work center

### Permission Resolution Flow
Permissions are resolved in hierarchical order:
- Direct scope match → Inherited scope (centro→empresa→cliente) → Module-level → Denial
- Example: When checking empresa access, system verifies empresa permission, then falls back to cliente permission, then module permission

### Implementation Files
- **server/auth/permissions.ts**: Core permission checking logic with `checkUserPermission` function
- **server/auth/middleware.ts**: Express middleware for route protection
  - `requirePermission(moduleCode, options)`: Main authorization middleware
  - `mockAuthMiddleware`: Development-only mock authentication (uses X-User-Id header)
  - `requireMaxTalentUser`: Restricts access to internal MaxTalent users
  - `requireClienteScope`: Ensures user has cliente assignment

### Database Tables
- **clientes**: Client/tenant records with soft deletes
- **modulos**: System modules catalog (Dashboard, Personal, Nómina, Asistencia, etc.)
- **usuarios_permisos**: User-module-scope permission mappings with CHECK constraints and partial unique indexes
- **users**: Extended with `tipo_usuario` (maxtalent/cliente) and nullable `cliente_id`

### API Routes
- `/api/clientes`: Cliente management (restricted to MaxTalent)
- `/api/modulos`: Module catalog (read-only)
- `/api/usuarios-permisos`: Permission assignment and management

### Development vs Production
- **Development**: Uses `mockAuthMiddleware` reading user info from request headers
- **Production**: To be implemented with proper session-based authentication
- Transition path: Replace `mockAuthMiddleware` in `server/index.ts` with session middleware

### Module Codes
Pre-seeded system modules: dashboard, personal, nomina, asistencia, organizacion, reclutamiento, beneficios, actas, configuracion, reportes, legal, repse, creditos, empresas

## Component Documentation

### CreateGrupoNominaDialog - Professional Employee Selection
**Location**: `client/src/components/CreateGrupoNominaDialog.tsx`

Dual-mode component for creating and editing payroll groups with professional table-based employee selection interface.

**Key Features**:
- **Table Layout**: Similar to Payroll page with columns for Checkbox, Employee Name, and Assigned Group
- **Employee Display**: Shows "Apellido Paterno Apellido Materno Nombre(s)" (employee number/clave not shown)
- **Smart Ordering**: Unassigned employees first, then alphabetically by apellidos, employees assigned to other groups at the end
- **Search Functionality**: Real-time filtering by nombre or apellidos with visual Search icon
- **Bulk Selection**: "Seleccionar Todos" and "Deseleccionar Todos" buttons with header checkbox
- **Selection Preservation**: Critical fix - selections persist across search filters using union-based selection (not replacement)
- **Group Display**: Shows actual group name for employees assigned to other groups, "Este grupo" badge for current group, or "Sin asignar"
- **Visual Feedback**: Selected rows highlighted with bg-muted/30, counter badge showing "X de Y seleccionados"
- **Data Sources**: Loads employees from /api/employees and grupos-nomina from /api/grupos-nomina