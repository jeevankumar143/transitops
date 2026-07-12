# 🚌 TransitOps — Smart Transport Operations Platform

An end-to-end transport operations platform built for the **Odoo 8-Hour Hackathon** that digitizes vehicle, driver, dispatch, maintenance, and expense management while enforcing strict business rules and providing real-time operational insights.

---

## 🏛️ System Highlights & Architecture

Built with **Node.js**, **Express**, and **SQLite** following a clean 4-module routing and frontend architecture:

1. **Module 1: Auth & Backend Core (`/modules/auth/`)**
   * Role-Based Access Control (RBAC) across 4 roles: `FLEET_MANAGER`, `DRIVER`, `SAFETY_OFFICER`, and `FINANCIAL_ANALYST`.
   * JWT Authentication & Role authorization middleware.
2. **Module 2: Fleet & Driver Registry (`/modules/vehicles/`)**
   * CRUD for vehicles and drivers with real-time status availability tracking.
   * Automated license expiration monitoring and capacity validation.
3. **Module 3: Trip & Maintenance State Machine (`/modules/trips/`)**
   * Trip lifecycle: `Draft` → `Dispatched` → `Completed` → `Cancelled`.
   * Automated status transitions (`Available` ↔ `On Trip` ↔ `In Shop`).
4. **Module 4: Financial Analytics & ROI (`/modules/dashboard/`)**
   * Real-time calculation of **Vehicle ROI**:
     $$\text{ROI} = \frac{\text{Revenue} - (\text{Maintenance} + \text{Fuel})}{\text{Acquisition Cost}} \times 100\%$$
   * One-click CSV Export and interactive Chart.js visualizations.

---

## 👥 Role-Specific Standalone Portals

When users sign in via `/login.html`, they are directed to their dedicated portal page:

| Role | Demo Email | Password | Dedicated Portal | Focus Area |
| :--- | :--- | :--- | :--- | :--- |
| **Fleet Manager** | `admin@transitops.io` | `password123` | `/index.html` | Full national fleet administrative & operational command |
| **Driver** | `driver@transitops.io` | `password123` | `/portal-driver.html` | Assigned trip dispatches, actual distance recording & roadside fuel refills |
| **Safety Officer** | `safety@transitops.io` | `password123` | `/portal-safety.html` | Driver licensure monitoring, safety scores (0–100) & vehicle roadworthiness |
| **Financial Analyst** | `finance@transitops.io` | `password123` | `/portal-finance.html` | Fleet ROI formulas, fuel efficiency (`km/L`) & CSV audit exports |

---

## ⚖️ Mandatory Business Rules Enforced

1. **Unique Registration**: Vehicle registration numbers must be unique across the fleet.
2. **Dispatch Pool Filtering**: `Retired` or `In Shop` vehicles never appear in dispatch selections.
3. **License & Suspension Validation**: Drivers with expired licenses or `Suspended` status are blocked from assignment.
4. **Concurrent Trip Lock**: A driver or vehicle currently `On Trip` cannot be assigned to another trip.
5. **Capacity Guard**: Cargo weight cannot exceed the vehicle's maximum load capacity (`kg`).
6. **Automated Maintenance Lock**: Logging a maintenance record automatically switches the vehicle status to `In Shop` and removes it from the dispatch pool. Closing maintenance restores it to `Available`.

---

## 🚀 Quick Start & Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Seed Sample Database
Populates sample vehicles, drivers, trips, fuel logs, and user roles:
```bash
npm run seed
```

### 3. Start Development Server
```bash
npm start
```
Visit **http://localhost:3000** in your browser.

---

## 📄 API Documentation Overview

* `POST /api/auth/login` — Authenticate and receive JWT token
* `GET /api/vehicles` / `GET /api/vehicles/available` — List fleet assets
* `GET /api/drivers` / `GET /api/drivers/available` — List driver roster
* `POST /api/trips/:id/dispatch` — Dispatch trip & switch vehicle/driver to `On Trip`
* `POST /api/trips/:id/complete` — Complete trip & record actual distance
* `POST /api/maintenance` — Log maintenance & switch vehicle to `In Shop`
* `GET /api/dashboard/financials` — Retrieve vehicle ROI analytics & totals
