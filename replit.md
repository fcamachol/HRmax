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
**Authentication**: Basic user schema and session storage infrastructure are in place, awaiting full session-based authentication.

### Feature Specifications
*   **Bajas (Terminations)**: Multi-step wizard for severance calculation (finiquito/liquidación) compliant with Mexican labor law, termination letter generation, and a Kanban board for workflow management.
*   **Altas (Hiring)**: Multi-step hiring wizard, offer letter generation, document upload and management (using Replit Object Storage), and a Kanban board to track hiring stages. Supports various contract types.
*   **Empresas (Company Management)**: Supports multi-company management with full fiscal data, `Registros Patronales` (IMSS employer registrations), and secure credential management for government systems (integrating with Replit Secrets for sensitive data). E.firma support is also included.
*   **Centros de Trabajo & Multi-Shift System**: Manages multiple work centers and configurable shifts per center, including schedules, working days, and tolerance settings. Employees are assigned to specific shifts for precise attendance tracking.
*   **Grupos de Nómina (Payroll Groups)**: Allows defining configurable payroll groups with different payment frequencies (weekly, biweekly, twice monthly, monthly). It features automatic generation of payroll periods for the current and next year, ensuring full year coverage. Employees can be assigned to specific payroll groups.
*   **Payroll Module (Nómina)**: Provides interfaces for creating and managing payroll, dynamically selecting payroll groups, and ensuring data consistency via API integration.
*   **Attendance Module (Asistencia)**: Redesigned for period-based tracking, allowing mass incident capture (absences, tardiness, overtime, medical leave, etc.) in an Excel-like grid. Features dual filtering by work center and payroll group, and smart period selection.

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