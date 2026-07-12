-- ============================================================
-- TransitOps Master Database Schema
-- All tables for 4 modules — applied once on server start
-- ============================================================

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- ============================================================
-- MODULE 1: AUTH & CORE — Users
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT    NOT NULL,
  email       TEXT    NOT NULL UNIQUE,
  password    TEXT    NOT NULL,
  role        TEXT    NOT NULL CHECK(role IN ('fleet_manager','driver','safety_officer','financial_analyst')),
  created_at  TEXT    DEFAULT (datetime('now')),
  updated_at  TEXT    DEFAULT (datetime('now'))
);

-- ============================================================
-- MODULE 2: VEHICLE & DRIVER MANAGEMENT
-- ============================================================
CREATE TABLE IF NOT EXISTS vehicles (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  registration_no   TEXT    NOT NULL UNIQUE,
  name              TEXT    NOT NULL,
  model             TEXT    NOT NULL,
  type              TEXT    NOT NULL CHECK(type IN ('Truck','Van','Bus','Pickup','Tanker','Other')),
  max_load_capacity REAL    NOT NULL DEFAULT 0,  -- in kg
  odometer          REAL    NOT NULL DEFAULT 0,  -- in km
  acquisition_cost  REAL    NOT NULL DEFAULT 0,  -- in currency units
  status            TEXT    NOT NULL DEFAULT 'Available' CHECK(status IN ('Available','On Trip','In Shop','Retired')),
  region            TEXT    DEFAULT NULL,
  created_at        TEXT    DEFAULT (datetime('now')),
  updated_at        TEXT    DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS drivers (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  name            TEXT    NOT NULL,
  license_no      TEXT    NOT NULL UNIQUE,
  license_category TEXT   NOT NULL CHECK(license_category IN ('A','B','C','D','E','Heavy','PSV')),
  license_expiry  TEXT    NOT NULL,  -- ISO date string
  contact_no      TEXT    NOT NULL,
  safety_score    REAL    NOT NULL DEFAULT 100 CHECK(safety_score >= 0 AND safety_score <= 100),
  status          TEXT    NOT NULL DEFAULT 'Available' CHECK(status IN ('Available','On Trip','Off Duty','Suspended')),
  created_at      TEXT    DEFAULT (datetime('now')),
  updated_at      TEXT    DEFAULT (datetime('now'))
);

-- ============================================================
-- MODULE 3: TRIP & MAINTENANCE LOGIC
-- ============================================================
CREATE TABLE IF NOT EXISTS trips (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  vehicle_id      INTEGER NOT NULL REFERENCES vehicles(id),
  driver_id       INTEGER NOT NULL REFERENCES drivers(id),
  source          TEXT    NOT NULL,
  destination     TEXT    NOT NULL,
  cargo_weight    REAL    NOT NULL DEFAULT 0,   -- in kg
  planned_distance REAL   NOT NULL DEFAULT 0,  -- in km
  actual_distance REAL    DEFAULT NULL,
  status          TEXT    NOT NULL DEFAULT 'Draft' CHECK(status IN ('Draft','Dispatched','Completed','Cancelled')),
  revenue         REAL    NOT NULL DEFAULT 0,
  notes           TEXT    DEFAULT NULL,
  dispatched_at   TEXT    DEFAULT NULL,
  completed_at    TEXT    DEFAULT NULL,
  cancelled_at    TEXT    DEFAULT NULL,
  created_at      TEXT    DEFAULT (datetime('now')),
  updated_at      TEXT    DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS maintenance_records (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  vehicle_id      INTEGER NOT NULL REFERENCES vehicles(id),
  type            TEXT    NOT NULL CHECK(type IN ('Scheduled','Breakdown','Inspection','Tyres','Engine','Other')),
  description     TEXT    NOT NULL,
  cost            REAL    NOT NULL DEFAULT 0,
  status          TEXT    NOT NULL DEFAULT 'Active' CHECK(status IN ('Active','Closed')),
  technician      TEXT    DEFAULT NULL,
  start_date      TEXT    DEFAULT (datetime('now')),
  end_date        TEXT    DEFAULT NULL,
  created_at      TEXT    DEFAULT (datetime('now')),
  updated_at      TEXT    DEFAULT (datetime('now'))
);

-- ============================================================
-- MODULE 4: DASHBOARD, FUEL & EXPENSES
-- ============================================================
CREATE TABLE IF NOT EXISTS fuel_logs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  vehicle_id  INTEGER NOT NULL REFERENCES vehicles(id),
  trip_id     INTEGER REFERENCES trips(id),
  liters      REAL    NOT NULL CHECK(liters > 0),
  cost        REAL    NOT NULL CHECK(cost > 0),
  odometer_reading REAL DEFAULT NULL,
  log_date    TEXT    NOT NULL DEFAULT (date('now')),
  station     TEXT    DEFAULT NULL,
  created_at  TEXT    DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS expenses (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  vehicle_id  INTEGER REFERENCES vehicles(id),
  trip_id     INTEGER REFERENCES trips(id),
  category    TEXT    NOT NULL CHECK(category IN ('Toll','Maintenance','Fuel','Salary','Insurance','Other')),
  amount      REAL    NOT NULL CHECK(amount > 0),
  description TEXT    DEFAULT NULL,
  expense_date TEXT   NOT NULL DEFAULT (date('now')),
  recorded_by INTEGER REFERENCES users(id),
  created_at  TEXT    DEFAULT (datetime('now'))
);

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_drivers_status  ON drivers(status);
CREATE INDEX IF NOT EXISTS idx_trips_status    ON trips(status);
CREATE INDEX IF NOT EXISTS idx_trips_vehicle   ON trips(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_trips_driver    ON trips(driver_id);
CREATE INDEX IF NOT EXISTS idx_fuel_vehicle    ON fuel_logs(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_expenses_vehicle ON expenses(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_vehicle ON maintenance_records(vehicle_id);
