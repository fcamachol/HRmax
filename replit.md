# NominaHub - Sistema de Recursos Humanos y Nómina para México

## Overview

NominaHub is a comprehensive HR and payroll management system specifically designed for Mexican businesses. The application handles employee management, payroll calculations with Mexican tax regulations (ISR, IMSS, Infonavit), attendance tracking, and reporting. It provides a modern SaaS-style interface with support for complex payroll scenarios including different payment frequencies (daily, weekly, biweekly, monthly) and Mexican-specific legal requirements (RFC, CURP, NSS).

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React 18 with TypeScript using Vite as the build tool

**Design System**: The application follows a modern SaaS productivity platform design approach, inspired by Linear, Notion, and Gusto. The UI is built with:
- shadcn/ui components (Radix UI primitives with custom styling)
- Tailwind CSS for utility-first styling
- Custom design tokens defined in CSS variables for theming
- Dark/light mode support via ThemeProvider context

**Routing**: wouter (lightweight client-side routing library)

**State Management**: 
- @tanstack/react-query for server state management and caching
- React Context for theme management
- React Hook Form with zod for form validation

**Key Design Decisions**:
- Component-based architecture with reusable UI primitives
- Type-safe forms using zod schemas and react-hook-form
- Separation of business logic (calculations) from presentation components
- Custom typography system using Inter (primary) and JetBrains Mono (for financial/legal data)

### Backend Architecture

**Framework**: Express.js with TypeScript running on Node.js

**API Design**: RESTful API with JSON responses
- Route registration pattern for modular endpoint management
- Middleware for request logging and JSON parsing
- Raw body capture for potential webhook integrations

**Key Endpoints**:
- `/api/configuration/change-log` - Configuration change tracking
- `/api/configuration/change-logs` - Retrieve configuration history
- `/api/configuration/change-logs/:changeType` - Filter changes by type

**Server Configuration**:
- Development mode uses tsx for TypeScript execution
- Production build uses esbuild for bundling
- Vite integration for HMR in development
- Static file serving in production

### Data Storage

**Database**: PostgreSQL (via Neon serverless)

**ORM**: Drizzle ORM with:
- Type-safe schema definitions
- Zod integration for runtime validation
- Migration support via drizzle-kit

**Schema Design**:
- `employees` - Core employee data (RFC, CURP, NSS, salary, department, position)
- `departments` - Organizational structure
- `payroll_periods` - Pay period tracking
- `attendance` - Daily attendance records
- `users` - System user authentication
- `configurationChangeLogs` - Audit trail for system configuration changes

**Key Design Decisions**:
- UUID primary keys for all tables
- Separate tables for normalized data (departments)
- Audit logging for regulatory compliance
- Support for multiple contract types and employment statuses

### Payroll Calculation Engine

**Location**: `shared/calculations.ts`

**Functionality**:
- ISR (Income Tax) calculations with 2025 tax tables for all periodicities
- IMSS (Social Security) contribution calculations
- Subsidy (subsidio al empleo) calculations
- Support for exempt vs taxable income separation
- Configurable deduction formulas

**Key Design Decisions**:
- Shared between client and server for consistency
- Pure functions for testability
- Configuration-driven tables (UMA, minimum wage, tax brackets)
- Support for multiple payment frequencies (daily, weekly, biweekly, monthly)

### Authentication & Authorization

**Current State**: Basic user schema defined but authentication not fully implemented
- User table with username/password fields
- Session storage infrastructure (connect-pg-simple) available
- Ready for implementation of session-based authentication

## External Dependencies

### Database & Infrastructure
- **@neondatabase/serverless** - PostgreSQL database hosting with serverless driver
- **drizzle-orm** - TypeScript ORM for database operations
- **drizzle-kit** - Database migration tooling
- **ws** - WebSocket support for Neon database connections

### UI Framework & Components
- **@radix-ui/** packages - Unstyled, accessible UI primitives (30+ components)
- **tailwindcss** - Utility-first CSS framework
- **class-variance-authority** - Variant-based component styling
- **lucide-react** - Icon library

### Form Management
- **react-hook-form** - Form state management
- **@hookform/resolvers** - Form validation resolvers
- **zod** - Schema validation
- **drizzle-zod** - Drizzle to Zod schema conversion

### Data Fetching
- **@tanstack/react-query** - Server state management and caching

### Date Handling
- **date-fns** - Date utility functions for payroll calculations

### Development Tools
- **vite** - Build tool and dev server
- **@vitejs/plugin-react** - React integration for Vite
- **tsx** - TypeScript execution for development
- **esbuild** - Production bundling
- **@replit/** plugins - Replit-specific development enhancements

### Fonts
- **Google Fonts CDN** - Inter (primary UI font) and JetBrains Mono (monospace for financial data)

## Recent Changes (November 2025)

### Bajas Module - Employee Termination Workflow

**Complete Mexican Labor Law Compliance System**

The Bajas module implements a comprehensive employee termination workflow that automatically calculates severance pay (finiquito/liquidación) according to Mexican Federal Labor Law (Ley Federal del Trabajo).

**Key Features**:
1. **Automatic Calculation Engine** (`shared/finiquitoCalculations.ts`)
   - Aguinaldo proporcional (proportional Christmas bonus)
   - Vacaciones proporcionales (proportional vacation days)
   - Prima vacacional (vacation premium - 25% of vacation pay)
   - Prima de antigüedad (seniority premium for employees with 15+ years)
   - Indemnización constitutional (3 months salary for unjustified termination)
   - Indemnización de 20 días (20 days per year for specific termination types)
   - Accounts for days already paid/taken in current year

2. **Multi-Step Wizard** (`client/src/components/BajaWizard.tsx`)
   - Step 1: Basic Information with employee selection dropdown
     - Employee dropdown loads active employees from database
     - Auto-fills employee data: salarioDiario (calculated from monthly salary), empleadoFechaInicio
     - Manual entry fields for termination type, dates, and additional details
     - Dropdown disabled in edit mode to prevent changing employee after creation
   - Step 2: Automatic Calculation Display with approval workflow
   - Step 3: Documentation checklist
   - Step 4: Final authorization and signature

3. **Termination Letter Generation** (`client/src/components/CartaFiniquito.tsx`)
   - Professional legal format compliant with Mexican labor law
   - Detailed breakdown of all concepts and amounts
   - Signature lines for employee and employer
   - Witness signatures for liquidación cases
   - Download as text file or print functionality
   - Automatic distinction between finiquito (simple termination) and liquidación (termination with indemnification)

4. **Drag-and-Drop Kanban Board** (`client/src/components/CasosLegalesKanban.tsx`)
   - Visual workflow management with status columns: Cálculo, Documentación, Firma, Trámites, Entrega, Completado, Demanda
   - Drag-and-drop to update case status
   - Color-coded cards by termination category
   - Quick view of case details and progress

**Database Schema Extensions**:
- `salarioDiario` (decimal) - Daily salary for calculations
- `empleadoFechaInicio` (date) - Employment start date
- `calculoAprobado` (text) - Approval status of calculation ("true"/"false")
- `calculoData` (jsonb) - Complete calculation breakdown storage

**Technical Implementation**:
- Employee selection via dropdown: useQuery loads active employees from GET /api/employees
- Auto-fill logic: handleEmployeeSelect calculates salarioDiario as (salary/30).toFixed(2) and populates empleadoFechaInicio
- Reactive calculations using useMemo - recalculates when salary/dates/type change
- Zod validation for PATCH updates (updateLegalCaseSchema)
- Early return validation in CartaFiniquito to prevent "Invalid Date" errors
- Modal state cleanup to prevent UI blocking
- Type-safe calculation functions shared between frontend and backend
- salarioDiario sent as string (not number) to match Drizzle decimal field expectations

### Altas Module - Employee Hiring Process Workflow

**Complete Hiring Process Management System**

The Altas module implements a comprehensive hiring process workflow that manages candidate onboarding from offer letter to completion, with automatic document tracking and stage-based workflow management.

**Key Features**:
1. **Multi-Step Hiring Wizard** (`client/src/components/AltaWizard.tsx`)
   - Step 1: Candidate Information (name, email, phone, RFC, CURP, NSS)
   - Step 2: Offer Details (position, department, salary, start date, contract type, notes)
   - Step 3: Documentation Checklist (10 standard documents: acta de nacimiento, CURP, RFC, comprobante de domicilio, etc.)
   - Step 4: Review and Confirmation

2. **Kanban Board Workflow** (`client/src/components/KanbanAltas.tsx`)
   - Visual process tracking with 7 stages: Carta Oferta → Documentos → Contrato → Alta IMSS → Onboarding → Completado → No Completado
   - Stage order reflects real-world Mexican hiring process (contract signature before IMSS registration)
   - "No Completado" (red column) for canceled or incomplete hiring processes
   - Color-coded column headers with visual hierarchy (blue, purple, indigo, cyan, teal, green, red)
   - Quick actions: Edit, Move Forward/Back, Mark as Not Completed, Delete
   - Integrated offer letter generation

3. **Offer Letter Generation** (`client/src/components/CartaOferta.tsx`)
   - Professional format for job offer letters
   - Includes candidate details, position, salary, start date, benefits
   - Placeholder for company-specific information
   - Print and download functionality
   - Accessible from Kanban board dropdown menu when process is in "oferta" stage

**Database Schema** (`hiring_process` table):
- `id` (uuid) - Primary key
- `candidateName`, `position`, `department` - Basic job information
- `proposedSalary` (decimal), `startDate` (date) - Compensation details
- `stage` (text) - Current workflow stage (oferta, documentos, contrato, alta_imss, onboarding, completado, cancelado)
  - Stage order reflects real-world process: contract signature comes before IMSS registration
  - "cancelado" stage for incomplete or canceled hiring processes
- `status` (text) - Process status
- `contractType` (text) - Type of employment contract (planta, temporal, por_obra, honorarios, practicante)
- `email`, `phone`, `rfc`, `curp`, `nss` - Candidate identification
- `documentsChecklist` (jsonb) - Document collection tracking
- `notes` (text) - Additional information
- `createdAt`, `updatedAt` - Timestamps

**Contract Types Supported**:
- Planta (Indefinido) - Permanent employment
- Temporal - Fixed-term contract
- Por Obra Determinada - Project-based contract
- Honorarios - Professional services
- Practicante - Internship

**API Endpoints**:
- `POST /api/hiring/processes` - Create new hiring process
- `GET /api/hiring/processes` - Get all hiring processes
- `GET /api/hiring/processes/:id` - Get single hiring process
- `PATCH /api/hiring/processes/:id` - Update hiring process (including stage changes)
- `DELETE /api/hiring/processes/:id` - Delete hiring process

**Technical Implementation**:
- Consistent architecture with Bajas module (wizard + Kanban pattern)
- Zod validation for all data inputs
- Type-safe schemas shared between frontend and backend
- React Query for optimistic updates and cache invalidation
- Document checklist stored as JSONB for flexibility
- Stage transitions tracked for compliance and auditing

**Document Upload & Management** (November 2025):

The Altas module has been enhanced with comprehensive document upload capabilities and special NSS handling:

1. **DocumentInfo Structure**:
   - Changed from simple `string[]` to rich `DocumentInfo[]` objects
   - Structure: `{ name: string, uploaded: boolean, url?: string, uploadedAt?: string }`
   - Allows tracking of upload status, file URLs, and timestamps
   - Optional fields (url, uploadedAt) enable backward compatibility

2. **Enhanced UI for Step 3 - Documentation**:
   - Individual Card components for each required document
   - Checkbox to mark documents as received
   - "Recibido" badge appears when document is marked
   - "Subir" button with ObjectUploader integration for file uploads
   - Download link and "Remover" button when document has been uploaded
   - Visual feedback for upload completion and errors

3. **Special NSS Handling**:
   - NSS captured in Step 1 (Personal Information)
   - In Step 3 (Documentation), NSS is displayed as text instead of requiring upload
   - Shows captured NSS value (e.g., "12345678901") with checkbox
   - No upload button for NSS (it's not a physical document)
   - If NSS not captured in Step 1, shows input field for manual entry
   - Checkbox allows marking NSS as "verified" without file upload

4. **Object Storage Integration**:
   - Uses Replit Object Storage for secure file hosting
   - ObjectUploader component (`client/src/components/ObjectUploader.tsx`)
   - Unique file input IDs using React `useId` hook to prevent conflicts
   - Supports multiple simultaneous uploads
   - Upload process: POST to `/api/object-storage/upload` → stores in PRIVATE_OBJECT_DIR
   - Returns uploadURL for permanent storage reference
   - Error handling and validation for upload completion

5. **Backward Compatibility & Data Migration**:
   - Legacy hiring processes used `documentsChecklist: string[]`
   - New processes use `documentsChecklist: DocumentInfo[]`
   - Migration logic in `useEffect` of AltaWizard.tsx:
     - Detects legacy string[] data using `typeof docs[0] === 'string'`
     - Converts to DocumentInfo[] with `uploaded: true` flag
     - Handles mixed data scenarios gracefully
   - JSONB field in PostgreSQL accommodates both formats transparently

6. **Required Documents**:
   - Identificación oficial
   - Comprobante de domicilio
   - Acta de nacimiento
   - NSS (special handling - text display only)
   - RFC
   - CURP
   - Currículum vitae
   - Carta de recomendación
   - Estudios (certificado o título)
   - Certificado médico

7. **State Management**:
   - Toggle function clears `url` and `uploadedAt` when unchecking document
   - Prevents stale data from persisting
   - Upload completion validates response before marking as uploaded
   - Consistent state across wizard steps and Kanban board

**Object Storage Configuration**:
- Requires user to configure Object Storage in Replit
- Uses environment variables: `PRIVATE_OBJECT_DIR`, `PUBLIC_OBJECT_SEARCH_PATHS`
- File uploads will not function until Object Storage is properly configured
- Setup instructions provided in `OBJECT_STORAGE_SETUP.md`

**Technical Notes**:
- ObjectUploader generates unique IDs per instance using React's `useId` hook
- Supports prop `inputId` for custom ID override if needed
- Upload validation prevents false positive completions
- Error handling with toast notifications for user feedback
- Compatible with existing Kanban workflow and process editing

### Future Considerations
- Authentication system needs to be fully implemented
- CFDI (Mexican electronic invoicing) integration may be required
- SAT (Mexican tax authority) API integration for tax filing