# Design Guidelines: HR/Nomina Application for Mexico

## Design Approach

**Selected Approach:** Design System - Modern SaaS Productivity Platform  
**Primary References:** Linear (clean data presentation), Notion (information hierarchy), Gusto (payroll-specific patterns)  
**Rationale:** This is an enterprise productivity tool requiring clarity, efficiency, and data density. Professional credibility through clean, systematic design is paramount.

---

## Core Design Elements

### A. Typography System

**Font Families:**
- Primary: Inter (via Google Fonts CDN) - exceptional legibility for data-heavy interfaces
- Monospace: JetBrains Mono - for employee IDs, RFC, CURP, NSS numbers, and financial figures

**Type Scale:**
- Page Titles: text-3xl font-semibold (36px)
- Section Headers: text-2xl font-semibold (24px)
- Card Titles: text-lg font-medium (18px)
- Body Text: text-base (16px)
- Labels/Metadata: text-sm font-medium (14px)
- Helper Text: text-xs (12px)
- Financial Data: text-lg font-mono (18px monospace)

**Hierarchy Rules:**
- Employee names and key identifiers: font-semibold
- Currency amounts: font-mono to align decimals
- Legal identifiers (RFC, CURP, NSS): uppercase, font-mono, tracking-wide
- Status indicators: text-xs font-semibold uppercase tracking-wider

---

### B. Layout System

**Spacing Primitives (Tailwind):**
Core spacing units: **2, 4, 6, 8, 12, 16**

**Application:**
- Component padding: p-4 to p-6
- Card spacing: p-6
- Section margins: mb-8 to mb-12
- Form field gaps: gap-4
- Grid gaps: gap-6
- Page container: px-6 py-8

**Grid Structures:**
- Dashboard Overview: 3-column grid (grid-cols-3) for statistics cards
- Employee List: Single column with full-width table
- Employee Detail: 2-column split (2/3 main content, 1/3 sidebar)
- Payroll Calculator: Stacked single-column form with results panel
- Reports Page: 2-column grid for report cards

**Container Strategy:**
- Max width: max-w-7xl for main content
- Sidebar: Fixed width w-64
- Modal/Dialog: max-w-2xl to max-w-4xl based on complexity

---

### C. Component Library

**Navigation:**
- **Primary Sidebar Navigation** (left-aligned, fixed, w-64)
  - Company logo at top (h-12)
  - Icon + label navigation items
  - Active state: subtle background treatment
  - Categories: Dashboard, Employees, Payroll, Attendance, Reports, Settings
  - Icons: Heroicons (outline for inactive, solid for active)

- **Top Bar** (fixed, full-width)
  - Search bar (prominent, w-96)
  - User profile dropdown (right-aligned)
  - Quick actions: "+ New Employee", "Run Payroll"
  - Notification bell with badge

**Data Tables:**
- **Employee Table**
  - Column headers: text-xs font-semibold uppercase tracking-wider
  - Row height: h-16
  - Alternating row treatment for readability
  - Sticky header on scroll
  - Columns: Photo (w-10 h-10 rounded-full), Name, Position, Department, RFC, Status, Actions
  - Sortable columns with arrow indicators
  - Row actions: 3-dot menu (right-aligned)

- **Payroll Table**
  - Monospace numbers right-aligned
  - Currency symbol (MXN $) prefix
  - Decimal alignment for amounts
  - Summary row: font-semibold with top border treatment

**Cards:**
- **Stat Cards** (dashboard metrics)
  - Grid layout: grid-cols-3 gap-6
  - Structure: Icon (h-10 w-10), Label (text-sm), Value (text-2xl font-semibold), Change indicator (text-xs)
  - Metrics: Total Employees, Monthly Payroll, Active Contracts

- **Employee Detail Card**
  - Avatar placement: top-left (h-20 w-20)
  - Information grid: 2-column (label: value pairs)
  - Sections: Personal Info, Employment Details, Tax Info, Contact

- **Payroll Calculation Card**
  - Line-item breakdown layout
  - Concepts: left-aligned, Amounts: right-aligned
  - Grouped sections: Earnings (Percepciones), Deductions (Deducciones)
  - Subtotal rows with visual separation
  - Net pay: prominent display (text-xl font-bold)

**Forms:**
- **Employee Form**
  - Two-column layout for efficiency (grid-cols-2 gap-x-6 gap-y-4)
  - Input fields: h-10, rounded borders
  - Required field indicator: red asterisk
  - Mexican-specific fields clearly labeled:
    - RFC (13 characters, uppercase validation)
    - CURP (18 characters)
    - NSS (11 digits)
  - Date pickers for: Fecha de Ingreso, Fecha de Nacimiento
  - Dropdown selects for: Department, Position, Contract Type

- **Payroll Period Selector**
  - Radio button group for frequency: Weekly, Biweekly, Monthly
  - Date range picker (inline calendar)
  - Employee multi-select with search

**Buttons & Actions:**
- **Primary Actions:** Rounded (rounded-md), height h-10, px-6
  - Examples: "Save Employee", "Calculate Payroll", "Generate Receipt"
- **Secondary Actions:** Ghost style, h-10, px-4
- **Danger Actions:** Reserved for Delete, Terminate Contract
- **Icon Buttons:** w-10 h-10, rounded-md (for table row actions)

**Status Badges:**
- Pill shape (rounded-full), px-3, h-6
- Employment Status: Active, Inactive, On Leave, Terminated
- Payment Status: Paid, Pending, Failed
- Attendance: Present, Absent, Late, Vacation

**Modals & Overlays:**
- **Employee Quick View:** Slide-over panel from right (w-96 to w-1/3)
- **Payroll Receipt Preview:** Full modal (max-w-2xl)
  - Mimic official Mexican payroll receipt (recibo de nómina) format
  - Company header section
  - Employee information block
  - Earnings/deductions table
  - Legal footer text (small print)
- **Delete Confirmation:** Centered modal (max-w-md)

**Empty States:**
- Centered layout with icon (h-16 w-16)
- Primary message: text-lg font-medium
- Secondary explanation: text-sm
- Primary action button below
- Examples: "No employees yet", "No payroll records", "No attendance data"

---

### D. Mexican-Specific Considerations

**Currency Formatting:**
- Always display: MXN $XX,XXX.XX
- Use comma thousands separator
- Two decimal precision
- Monospace font for alignment

**Legal Identifiers Display:**
- RFC: XXXX######XXX format with dashes for readability
- CURP: Full 18 characters, uppercase, monospace
- NSS: Display with dashes: ###-##-####-#

**Date Formatting:**
- Spanish locale: DD/MM/YYYY
- Month names in Spanish for reports
- Payroll periods: "Del DD de MMM al DD de MMM de YYYY"

**Payroll Concepts (Use Spanish Labels):**
- Percepciones (Earnings)
- Deducciones (Deductions)
- Neto a Pagar (Net Pay)
- ISR, IMSS, Infonavit labels clearly visible

---

### E. Dashboard & Report Layouts

**Dashboard Layout:**
- Top stats row: 3 metric cards (grid-cols-3)
- Quick actions section: Horizontal button row
- Recent activity table: Full-width, last 10 actions
- Payroll summary chart: Full-width area (upcoming/recent payrolls)

**Employee Directory:**
- Search + filters bar (Department, Position, Status)
- Main table below
- Pagination footer: 20 rows per page

**Payroll Processing Page:**
- Left: Selection panel (period, employees)
- Right: Calculation preview panel
- Full-width results table below
- Action bar: "Calculate", "Review", "Process Payment"

**Reports Page:**
- Grid of report cards: grid-cols-2 gap-6
- Each card: Report name, description, "Generate" button
- Report types: Payroll Summary, Tax Reports, IMSS Reports, Employee Census

---

### F. Images

**Hero Section: No**  
This is a productivity application, not a marketing site. No hero image needed.

**Supporting Images:**
- Employee profile photos: Circular avatars (user uploads)
- Empty state illustrations: Simple line-art icons from Heroicons or similar
- Company logo placeholder: Top-left sidebar (h-8 to h-12)

**Image Strategy:**
All functional imagery (avatars, icons). No decorative photography required for this application type.

---

## Animation Guidelines

**Minimal, Purposeful Motion:**
- Table row hover: Subtle background transition (duration-150)
- Modal entry: Fade + slight scale (duration-200)
- Dropdown menus: Slide down (duration-150)
- Loading states: Subtle spinner or skeleton screens
- **No scroll animations, parallax, or decorative motion**

---

**Design Philosophy:** Professional credibility through systematic clarity. Every element serves employee management and payroll processing efficiency. Mexican legal compliance visible and accessible throughout.