# NominaHub - Sistema de Recursos Humanos y Nómina para México

## Overview

NominaHub is a comprehensive HR and payroll management system specifically designed for Mexican businesses. It manages employee data, calculates payroll compliant with Mexican tax regulations (ISR, IMSS, Infonavit), tracks attendance, and generates reports. The system supports complex payroll scenarios including various payment frequencies and legal requirements (RFC, CURP, NSS), offering a modern SaaS-style interface. Key modules include Bajas (employee termination with severance calculation) and Altas (employee hiring with onboarding and document management).

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React 18 with TypeScript using Vite.
**Design System**: Modern SaaS aesthetic inspired by Linear, Notion, and Gusto, utilizing shadcn/ui components, Tailwind CSS, custom design tokens, and dark/light mode.
**Routing**: wouter.
**State Management**: @tanstack/react-query for server state; React Context for themes; React Hook Form with Zod for validation.
**Key Design Decisions**: Component-based, type-safe forms, separation of logic from UI, custom typography.

### Backend Architecture

**Framework**: Express.js with TypeScript on Node.js.
**API Design**: RESTful API with JSON responses, modular endpoint management, middleware for logging and parsing.
**Server Configuration**: tsx for development, esbuild for production, Vite for HMR.

### Data Storage

**Database**: PostgreSQL (Neon serverless).
**ORM**: Drizzle ORM with type-safe schemas, Zod integration, and migration support.
**Schema Design**: Tables for `employees`, `departments`, `payroll_periods`, `attendance`, `users`, `configurationChangeLogs`, `hiring_process`, `bajas` (terminations), `empresas` (companies), `registrosPatronales` (IMSS employer registrations), `credencialesSistemas` (government system credentials), `centros_trabajo` (work centers), `turnos_centro_trabajo` (shifts per work center), and `empleados_centros_trabajo` (employee-shift assignments). UUID primary keys and audit logging are standard. Spanish column names are used throughout to match Mexican business requirements.

### Payroll Calculation Engine

**Functionality**: Located in `shared/calculations.ts`, it handles ISR, IMSS, and Subsidy calculations using 2025 tax tables. Supports exempt vs. taxable income separation and configurable deduction formulas for various payment frequencies.
**Key Design Decisions**: Shared client/server logic, pure functions, configuration-driven tables.

### Authentication & Authorization

**Current State**: Basic user schema and session storage infrastructure are in place, ready for full session-based authentication implementation.

### Feature Specifications

**Bajas Module (Employee Termination)**:
- **Automatic Calculation Engine**: Calculates severance (finiquito/liquidación) per Mexican labor law, including Aguinaldo, Vacaciones, Prima vacacional, Prima de antigüedad, and indemnización.
- **Multi-Step Wizard**: Guides through basic info, calculation display, documentation, and final authorization.
- **Termination Letter Generation**: Produces legally compliant letters with detailed breakdowns.
- **Kanban Board**: Visual workflow management for legal cases (Cálculo, Documentación, Firma, etc.).

**Altas Module (Employee Hiring)**:
- **Multi-Step Hiring Wizard**: Manages candidate info, offer details, and a document checklist.
- **Kanban Board Workflow**: Tracks hiring processes through stages: Carta Oferta, Documentos, Contrato, Alta IMSS, Onboarding, Completado, No Completado.
- **Offer Letter Generation**: Creates professional job offer letters.
- **Document Upload & Management**: Uses Replit Object Storage for file uploads, tracking document status and URLs. Special handling for NSS (National Social Security number). Supports various contract types (Planta, Temporal, Por Obra Determinada, Honorarios, Practicante).

**Empresas Module (Company Management)**:
- **Multi-Company Support**: Manage multiple companies with full fiscal and legal data (RFC, razón social, domicilio fiscal, representante legal).
- **Registros Patronales (IMSS)**: Track multiple IMSS employer registrations per company with risk classes (I-V), premium rates, and activity classifications.
- **Sistema de Credenciales**: Secure credential management for government systems (IMSS Escritorio Virtual, SIPARE, Infonavit Portal Empresarial, Fonacot, IDSE, SUA).
- **Replit Secrets Integration**: Passwords are NEVER stored in the database. Only secret key references are stored, with clear UI warnings and documentation links about creating Replit Secrets.
- **e.firma Support**: Optional e.firma (FIEL) configuration for systems requiring digital signatures, with secure storage of certificate paths and password references.

**Centros de Trabajo & Multi-Shift System**:
- **Work Centers (Centros de Trabajo)**: Manage multiple work centers per company with general information (nombre, empresa, domicilio).
- **Multiple Shifts per Center (Turnos)**: Each work center supports multiple shifts with individual configurations:
  - Schedule definition (horaInicio, horaFin) in HH:MM format
  - Working days per shift (trabajaLunes, trabajaMartes, etc.)
  - Tolerance settings (minutosToleranciaEntrada, minutosToleranciaComida)
  - Active/inactive status tracking
- **Employee-Shift Assignments**: Employees are assigned to specific shifts (not just centers), enabling precise attendance tracking with shift context.
- **Attendance Integration**: Clock-in/out system (Reloj Checador) automatically captures employee's active shift, storing turnoId in attendance records for accurate reporting.
- **Shift Display**: Attendance records show complete shift information (nombre, horaInicio-horaFin) for context and reporting.
- **CRUD Operations**: Full create, read, update, delete operations for shifts via TurnosManager.tsx component with real-time updates.

**Grupos de Nómina (Payroll Groups)**:
- **Configurable Pay Periods**: Define payroll groups with different payment frequencies (semanal, catorcenal, quincenal, mensual).
- **Period Configuration**: Each group specifies:
  - Tipo de Periodo: semanal (weekly), catorcenal (biweekly), quincenal (twice monthly), mensual (monthly)
  - Día de inicio de semana (configurable starting day for weekly/biweekly periods)
  - Día de corte (optional cutoff day for monthly/quincenal periods)
  - Día de pago: For weekly/biweekly (day of week 0-6), for bimonthly/monthly (day of month 1-31)
  - Días de cálculo: Optional field for all period types - number of days in advance for pre-payroll calculations
- **Interactive Creation Dialog**: Enhanced "Crear Grupo de Nómina" dialog features:
  - Period Type selector with period count indicators (e.g., "Semanal (~52 periodos/año)")
  - Conditional field display: Shows diaInicioSemana and diaPago for weekly/biweekly, diaCorte and diaPago for bimonthly/monthly
  - Días de cálculo field (optional, for all period types) - allows specifying advance calculation days (e.g., 2 days before payday)
  - Real-time field validation and helpful tooltips
  - Information panel explaining automatic period generation and key features
- **Automatic Period Generation**: When a payroll group is created, the system automatically generates payroll periods for the current year and next year:
  - Semanal: ~52-53 periods per year, aligned to configured start day (includes partial first period if needed)
  - Catorcenal: ~26-27 periods per year, aligned to configured start day (includes partial first period if needed)
  - Quincenal: 24 periods per year (1-15 and 16-end of month for each month)
  - Mensual: 12 periods per year (full months)
- **Full Year Coverage**: Period generation ensures complete coverage from January 1st through December 31st, creating partial periods when needed to avoid coverage gaps.
- **Duplicate Prevention**: Built-in checks prevent regenerating periods for the same group and year. Unique constraint on (grupoNominaId, year, periodNumber) enforces data integrity.
- **Employee Assignment**: Employees are assigned to specific payroll groups via grupoNominaId field.
- **Attendance Integration**: Attendance module supports filtering by payroll group, with automatic period calculation based on group configuration.
- **Smart Period Selection**: When a payroll group is selected, quick access buttons automatically calculate "Periodo Actual" and "Periodo Anterior" based on the group's payment frequency and current date.
- **Combined Filtering**: Attendance tracking supports filtering by both work center (centroTrabajoId) and payroll group (grupoNominaId) simultaneously for precise reporting.

**Payroll Module (Nómina)**:
- **Real-time API Integration**: Uses `useQuery` to fetch payroll groups from `/api/grupos-nomina`, ensuring consistency with Attendance and other modules.
- **Dynamic Group Selection**: Displays active payroll groups in dropdown, showing group name and period type (e.g., "Ventas (quincenal)").
- **Group Management**: 
  - Create new groups via dialog with automatic period generation
  - Delete groups with API confirmation
  - Load group configuration to filter/manage payroll for specific employee groups
- **Data Consistency**: All payroll group data sourced from single API endpoint, eliminating hardcoded/mock data.

**Attendance Module (Asistencia) - Redesigned**:
- **Period-Based Tracking**: Excel-like grid for mass incident capture per period (fechaInicio/fechaFin), replacing day-by-day clock-in/out tracking.
- **Incident Types**: Separate columns for each type:
  - Faltas (absences) - integer count
  - Retardos (tardiness) - integer count  
  - Horas Extra (overtime) - decimal hours
  - Horas Descontadas (discounted hours) - decimal hours
  - Incapacidades (medical leave) - integer count
  - Permisos (permissions) - integer count
- **Dual Filtering System**: 
  - Work Center Filter: Filter incidents by work center
  - Payroll Group Filter: Filter incidents by payroll group (grupos de nómina)
  - Combined Filtering: Both filters work together for precise employee and incident selection
- **Grid Layout**: Employees in rows, incident types in columns (similar to Payroll module pattern).
- **Real-time Stats**: Dashboard cards showing totals for each incident type across the selected period.
- **Query Optimization**: Structured queryKey with custom queryFn for proper cache invalidation and URL parameter handling.
- **Smart Period Selection**: 
  - Manual date range selection
  - Quick access buttons for current week/month (when no payroll group selected)
  - Automatic period calculation based on payroll group's payment frequency (when group selected)

## External Dependencies

### Database & Infrastructure
- **@neondatabase/serverless**: PostgreSQL hosting.
- **drizzle-orm**, **drizzle-kit**: ORM and migration tools.
- **ws**: WebSocket support for Neon.

### UI Framework & Components
- **@radix-ui/**: Accessible UI primitives.
- **tailwindcss**: Utility-first CSS.
- **class-variance-authority**: Variant-based styling.
- **lucide-react**: Icon library.

### Form Management
- **react-hook-form**, **@hookform/resolvers**: Form state and validation.
- **zod**, **drizzle-zod**: Schema validation and Drizzle integration.

### Data Fetching
- **@tanstack/react-query**: Server state management and caching.

### Date Handling
- **date-fns**: Date utility functions.

### Development Tools
- **vite**, **@vitejs/plugin-react**: Build tool and React integration.
- **tsx**: TypeScript execution.
- **esbuild**: Production bundling.
- **@replit/** plugins: Replit-specific enhancements.

### Fonts
- **Google Fonts CDN**: Inter, JetBrains Mono.

### Object Storage
- **Replit Object Storage**: For document uploads (requires configuration).