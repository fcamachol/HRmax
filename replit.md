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

### Future Considerations
- Authentication system needs to be fully implemented
- CFDI (Mexican electronic invoicing) integration may be required
- SAT (Mexican tax authority) API integration for tax filing