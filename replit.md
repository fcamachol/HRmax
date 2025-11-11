# NominaHub - Sistema de Recursos Humanos y Nómina para México

## Overview
NominaHub is a comprehensive HR and payroll management system for Mexican businesses. It centralizes employee data, handles payroll compliant with Mexican tax regulations (ISR, IMSS, Infonavit), tracks attendance, and generates essential reports. The system supports complex payroll scenarios, offering a modern SaaS-style interface. Key modules include Altas (hiring with onboarding and document management), Bajas (employee termination with severance calculation), and extensive multi-company management. NominaHub aims to streamline HR processes, reduce compliance risks, and provide a user-friendly experience for managing human capital in Mexico.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The frontend uses React 18, TypeScript, and Vite, with a modern SaaS aesthetic inspired by Linear and Notion. It's built with shadcn/ui components, Tailwind CSS, and custom design tokens, supporting dark and light modes. `wouter` handles routing.

### Technical Implementations
**Frontend**: Employs @tanstack/react-query for server state management and React Hook Form with Zod for validation.
**Backend**: An Express.js and Node.js backend provides a RESTful API. `tsx` is used for development and `esbuild` for production.
**Database**: PostgreSQL (Neon serverless) with Drizzle ORM for type-safe schemas and migrations, using Spanish column names.
**Payroll Engine**: A core engine calculates ISR, IMSS, and Subsidy based on 2025 tax tables, supporting various payment frequencies.
**Authentication & Authorization**: Features a multi-tenant permission system with hierarchical scope resolution (cliente → empresa → centro_trabajo → módulo), `requirePermission` middleware, and mock authentication for development. Supports MaxTalent (internal) and Cliente user types with granular access control.
**Super Admin System**: Includes an `isSuperAdmin` field in the `users` table, an `admin_audit_logs` table for tracking actions, and a `requireSuperAdmin` middleware.

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