# TransitOps — Smart Transport Operations Platform

## Overview

A full-stack hackathon application built with **Node.js + Express + SQLite** on the backend and **vanilla HTML/CSS/JS** on the frontend. The project is structured as 4 independent modules, each owning its routes, UI components, and database interactions. A single `server.js` entry-point mounts all module routers.

---

## Architecture

```
transistops/
├── server.js                  # Express entry point, mounts all routers
├── package.json
├── .env
├── database/
│   ├── db.js                  # SQLite connection singleton
│   └── schema.sql             # Master schema (all tables)
├── middleware/
│   ├── auth.js                # JWT verify + RBAC guard
│   └── errorHandler.js
├── modules/
│   ├── auth/                  # Module 1 – Auth & Core
│   │   ├── auth.routes.js
│   │   ├── auth.controller.js
│   │   └── auth.service.js
│   ├── vehicles/              # Module 2 – Vehicle & Driver
│   │   ├── vehicle.routes.js
│   │   ├── vehicle.controller.js
│   │   ├── driver.routes.js
│   │   └── driver.controller.js
│   ├── trips/                 # Module 3 – Trip & Maintenance
│   │   ├── trip.routes.js
│   │   ├── trip.controller.js
│   │   ├── trip.service.js     # State machine logic
│   │   ├── maintenance.routes.js
│   │   └── maintenance.controller.js
│   └── dashboard/             # Module 4 – Dashboard & Financials
│       ├── dashboard.routes.js
│       ├── dashboard.controller.js
│       ├── fuel.routes.js
│       └── expense.routes.js
└── public/                    # Frontend (single-page, tab-based)
    ├── index.html
    ├── login.html
    ├── css/
    │   └── styles.css
    └── js/
        ├── auth.js
        ├── vehicles.js
        ├── drivers.js
        ├── trips.js
        ├── maintenance.js
        └── dashboard.js
```

---

## Module Breakdown

### Module 1 — Auth & Backend Core
- **Tables:** `users`
- JWT-based auth (HS256, 8h expiry)
- RBAC roles: `fleet_manager`, `driver`, `safety_officer`, `financial_analyst`
- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- Frontend: `login.html` + `auth.js` — login/signup form with role selector

### Module 2 — Vehicle & Driver Management
- **Tables:** `vehicles`, `drivers`
- Full CRUD for both entities
- Status enums enforced at DB + API level
- Validation: expired license → block, Suspended driver → block, Retired/In-Shop vehicle → blocked in dispatch
- Routes: `/api/vehicles/*`, `/api/drivers/*`
- Frontend: Vehicle registry tab + Driver management tab (modals for create/edit)

### Module 3 — Trip & Maintenance Logic
- **Tables:** `trips`, `maintenance_records`
- State machine: `Draft → Dispatched → Completed | Cancelled`
- Auto-sync: vehicle + driver status changes on dispatch/complete/cancel
- Capacity validation on trip creation
- Maintenance: creating active record → vehicle `In Shop`; closing → `Available`
- Routes: `/api/trips/*`, `/api/maintenance/*`
- Frontend: Trip dispatch tab + Maintenance tab

### Module 4 — Dashboard, Reports & Financials
- **Tables:** `fuel_logs`, `expenses`
- KPI cards pulled from live DB aggregations
- Financial formulas computed server-side:
  - Total OpCost = Fuel + Maintenance per vehicle
  - Fuel Efficiency = Distance / Fuel
  - Vehicle ROI = (Revenue − (Maint + Fuel)) / Acquisition Cost
- CSV export endpoints
- Charts via Chart.js (CDN)
- Routes: `/api/dashboard/*`, `/api/fuel/*`, `/api/expenses/*`

---

## Database Schema (All Tables)

```sql
-- users, vehicles, drivers, trips, maintenance_records, fuel_logs, expenses
```

Full schema locked in `database/schema.sql` — applied once on server start.

---

## Proposed Changes

### [NEW] package.json
### [NEW] .env
### [NEW] server.js
### [NEW] database/db.js
### [NEW] database/schema.sql
### [NEW] middleware/auth.js + errorHandler.js
### [NEW] modules/auth/* (3 files)
### [NEW] modules/vehicles/* (4 files)
### [NEW] modules/trips/* (5 files — state machine priority)
### [NEW] modules/dashboard/* (4 files)
### [NEW] public/* (full SPA with 6 JS modules + CSS)

---

## Verification Plan

### Automated
- `npm start` → server boots without errors
- SQLite schema auto-created on first run
- Seed script creates default `fleet_manager` admin

### Manual
- Login with seeded user → JWT stored → protected routes accessible
- Create vehicle → vehicle appears in registry
- Create driver → assign to trip → status auto-flips to "On Trip"
- Complete trip → statuses restore to "Available"
- Create maintenance record → vehicle flips to "In Shop"
- Dashboard KPIs reflect live data
- CSV export downloads valid file
