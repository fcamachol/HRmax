# NominaHub - Sistema de Recursos Humanos y Nómina para México

## Overview
NominaHub is a comprehensive HR and payroll management system designed for Mexican businesses. Its primary purpose is to centralize employee data, manage payroll in compliance with Mexican tax regulations (ISR, IMSS, Infonavit), track attendance, and generate essential reports. The system supports complex payroll scenarios and aims to provide a modern, user-friendly SaaS experience. Key capabilities include modules for hiring (Altas), employee terminations (Bajas), and multi-company management. NominaHub's ambition is to streamline HR operations, reduce compliance risks, and enhance human capital management for its users in Mexico.

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
**Authentication & Authorization**: Features a multi-tenant permission system with hierarchical scope resolution (cliente → empresa → centro_trabajo → módulo), `requirePermission` middleware, and mock authentication for development. It supports internal (MaxTalent) and client user types with granular access control.
**Super Admin System**: Includes an independent authentication portal, cross-tenant user management, audit trails, and bcrypt password hashing. Accessible at `/super-admin/login`.
**Vacation & Benefits System**: Configurable benefits catalog (`cat_tablas_prestaciones`) and a ledger-based system (`kardex_vacaciones`) for tracking vacation accrual, usage, and expiration, compliant with LFT Art. 76.
**Basis Points Helper Library**: A shared library (`shared/basisPoints.ts`) provides functions for converting pesos to basis points and performing safe arithmetic with 4-decimal precision using `Math.trunc()` to prevent rounding errors.

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

## External Dependencies

*   **Database & Infrastructure**: `@neondatabase/serverless`, `drizzle-orm`, `drizzle-kit`.
*   **UI Framework & Components**: `@radix-ui/**`, `tailwindcss`, `lucide-react`.
*   **Form Management**: `react-hook-form`, `@hookform/resolvers`, `zod`, `drizzle-zod`.
*   **Data Fetching**: `@tanstack/react-query`.
*   **Date Handling**: `date-fns`.
*   **Object Storage**: `Replit Object Storage`.