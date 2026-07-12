-- ============================================================
-- TransitOps Master Database Schema  v2.0
-- Production-grade schema for 4-module fleet platform
-- Applied on server start via db.js exec()
-- ============================================================

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;
PRAGMA synchronous  = NORMAL;

-- ============================================================
-- MODULE 1: AUTH & ACCESS CONTROL
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  name            TEXT    NOT NULL,
  email           TEXT    NOT NULL UNIQUE,
  password        TEXT    NOT NULL,
  role            TEXT    NOT NULL CHECK(role IN ('fleet_manager','driver','safety_officer','financial_analyst')),
  phone           TEXT    DEFAULT NULL,
  avatar_url      TEXT    DEFAULT NULL,
  is_active       INTEGER NOT NULL DEFAULT 1,
  last_login      TEXT    DEFAULT NULL,
  login_count     INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action      TEXT    NOT NULL,
  entity      TEXT    DEFAULT NULL,
  entity_id   INTEGER DEFAULT NULL,
  detail      TEXT    DEFAULT NULL,
  ip_address  TEXT    DEFAULT NULL,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- MODULE 2: VEHICLE & DRIVER MANAGEMENT
-- ============================================================

CREATE TABLE IF NOT EXISTS vehicles (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  registration_no     TEXT    NOT NULL UNIQUE,
  name                TEXT    NOT NULL,
  model               TEXT    NOT NULL,
  make                TEXT    DEFAULT NULL,
  year                INTEGER DEFAULT NULL,
  type                TEXT    NOT NULL CHECK(type IN ('Truck','Van','Bus','Pickup','Tanker','Other')),
  max_load_capacity   REAL    NOT NULL DEFAULT 0,
  fuel_capacity       REAL    NOT NULL DEFAULT 200,
  fuel_type           TEXT    NOT NULL DEFAULT 'Diesel' CHECK(fuel_type IN ('Diesel','Petrol','CNG','Electric')),
  odometer            REAL    NOT NULL DEFAULT 0,
  acquisition_cost    REAL    NOT NULL DEFAULT 0,
  current_value       REAL    DEFAULT NULL,
  insurance_expiry    TEXT    DEFAULT NULL,
  road_license_expiry TEXT    DEFAULT NULL,
  status              TEXT    NOT NULL DEFAULT 'Available' CHECK(status IN ('Available','On Trip','In Shop','Retired')),
  region              TEXT    DEFAULT NULL,
  depot               TEXT    DEFAULT NULL,
  colour              TEXT    DEFAULT NULL,
  notes               TEXT    DEFAULT NULL,
  created_at          TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at          TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS drivers (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id          INTEGER DEFAULT NULL REFERENCES users(id) ON DELETE SET NULL,
  name             TEXT    NOT NULL,
  license_no       TEXT    NOT NULL UNIQUE,
  license_category TEXT    NOT NULL CHECK(license_category IN ('A','B','C','D','E','Heavy','PSV')),
  license_expiry   TEXT    NOT NULL,
  id_number        TEXT    DEFAULT NULL UNIQUE,
  contact_no       TEXT    NOT NULL,
  alt_contact_no   TEXT    DEFAULT NULL,
  email            TEXT    DEFAULT NULL,
  address          TEXT    DEFAULT NULL,
  next_of_kin      TEXT    DEFAULT NULL,
  next_of_kin_contact TEXT DEFAULT NULL,
  date_of_birth    TEXT    DEFAULT NULL,
  date_hired       TEXT    DEFAULT (date('now')),
  safety_score     REAL    NOT NULL DEFAULT 100 CHECK(safety_score >= 0 AND safety_score <= 100),
  total_trips      INTEGER NOT NULL DEFAULT 0,
  total_km         REAL    NOT NULL DEFAULT 0,
  status           TEXT    NOT NULL DEFAULT 'Available' CHECK(status IN ('Available','On Trip','Off Duty','Suspended')),
  notes            TEXT    DEFAULT NULL,
  created_at       TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at       TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS safety_incidents (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  driver_id       INTEGER NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  trip_id         INTEGER DEFAULT NULL REFERENCES trips(id) ON DELETE SET NULL,
  type            TEXT    NOT NULL CHECK(type IN ('Accident','Near Miss','Traffic Violation','Breakdown','Customer Complaint','Other')),
  severity        TEXT    NOT NULL DEFAULT 'Low' CHECK(severity IN ('Low','Medium','High','Critical')),
  description     TEXT    NOT NULL,
  location        TEXT    DEFAULT NULL,
  cost            REAL    DEFAULT 0,
  score_deduction REAL    NOT NULL DEFAULT 0,
  reported_by     INTEGER REFERENCES users(id) ON DELETE SET NULL,
  incident_date   TEXT    NOT NULL DEFAULT (date('now')),
  resolved        INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- MODULE 3: TRIP & MAINTENANCE LOGIC
-- ============================================================

CREATE TABLE IF NOT EXISTS trips (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  vehicle_id       INTEGER NOT NULL REFERENCES vehicles(id),
  driver_id        INTEGER NOT NULL REFERENCES drivers(id),
  source           TEXT    NOT NULL,
  destination      TEXT    NOT NULL,
  cargo_type       TEXT    DEFAULT NULL,
  cargo_weight     REAL    NOT NULL DEFAULT 0,
  cargo_description TEXT   DEFAULT NULL,
  planned_distance REAL    NOT NULL DEFAULT 0,
  actual_distance  REAL    DEFAULT NULL,
  status           TEXT    NOT NULL DEFAULT 'Draft' CHECK(status IN ('Draft','Dispatched','Completed','Cancelled')),
  revenue          REAL    NOT NULL DEFAULT 0,
  fuel_consumed    REAL    DEFAULT NULL,
  notes            TEXT    DEFAULT NULL,
  client_name      TEXT    DEFAULT NULL,
  client_contact   TEXT    DEFAULT NULL,
  priority         TEXT    NOT NULL DEFAULT 'Normal' CHECK(priority IN ('Low','Normal','High','Urgent')),
  dispatched_at    TEXT    DEFAULT NULL,
  completed_at     TEXT    DEFAULT NULL,
  cancelled_at     TEXT    DEFAULT NULL,
  cancel_reason    TEXT    DEFAULT NULL,
  created_by       INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at       TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at       TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS maintenance_records (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  vehicle_id          INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  type                TEXT    NOT NULL CHECK(type IN ('Scheduled','Breakdown','Inspection','Tyres','Engine','Electrical','Body Work','Other')),
  description         TEXT    NOT NULL,
  cost                REAL    NOT NULL DEFAULT 0,
  parts_cost          REAL    NOT NULL DEFAULT 0,
  labour_cost         REAL    NOT NULL DEFAULT 0,
  status              TEXT    NOT NULL DEFAULT 'Active' CHECK(status IN ('Active','Closed')),
  technician          TEXT    DEFAULT NULL,
  workshop            TEXT    DEFAULT NULL,
  odometer_at_service REAL    DEFAULT NULL,
  next_service_km     REAL    DEFAULT NULL,
  start_date          TEXT    NOT NULL DEFAULT (datetime('now')),
  end_date            TEXT    DEFAULT NULL,
  invoice_no          TEXT    DEFAULT NULL,
  warranty_months     INTEGER DEFAULT NULL,
  created_by          INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at          TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at          TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- MODULE 4: FINANCIAL, FUEL & EXPENSE AUDITING
-- ============================================================

CREATE TABLE IF NOT EXISTS fuel_logs (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  vehicle_id       INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  driver_id        INTEGER DEFAULT NULL REFERENCES drivers(id) ON DELETE SET NULL,
  trip_id          INTEGER DEFAULT NULL REFERENCES trips(id) ON DELETE SET NULL,
  liters           REAL    NOT NULL CHECK(liters > 0),
  cost_per_litre   REAL    DEFAULT NULL,
  cost             REAL    NOT NULL CHECK(cost > 0),
  odometer_reading REAL    DEFAULT NULL,
  fuel_type        TEXT    NOT NULL DEFAULT 'Diesel' CHECK(fuel_type IN ('Diesel','Petrol','CNG','Electric')),
  log_date         TEXT    NOT NULL DEFAULT (date('now')),
  station          TEXT    DEFAULT NULL,
  receipt_no       TEXT    DEFAULT NULL,
  km_since_last_fill REAL  DEFAULT NULL,
  efficiency       REAL    DEFAULT NULL,
  notes            TEXT    DEFAULT NULL,
  recorded_by      INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at       TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS expenses (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  vehicle_id    INTEGER DEFAULT NULL REFERENCES vehicles(id) ON DELETE SET NULL,
  driver_id     INTEGER DEFAULT NULL REFERENCES drivers(id) ON DELETE SET NULL,
  trip_id       INTEGER DEFAULT NULL REFERENCES trips(id) ON DELETE SET NULL,
  category      TEXT    NOT NULL CHECK(category IN ('Toll','Maintenance','Fuel','Salary','Insurance','Permit','Fine','Other')),
  amount        REAL    NOT NULL CHECK(amount > 0),
  description   TEXT    DEFAULT NULL,
  expense_date  TEXT    NOT NULL DEFAULT (date('now')),
  receipt_no    TEXT    DEFAULT NULL,
  approved      INTEGER NOT NULL DEFAULT 0,
  approved_by   INTEGER REFERENCES users(id) ON DELETE SET NULL,
  recorded_by   INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS invoices (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  trip_id       INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  invoice_no    TEXT    NOT NULL UNIQUE,
  client_name   TEXT    NOT NULL,
  client_email  TEXT    DEFAULT NULL,
  amount        REAL    NOT NULL CHECK(amount > 0),
  tax           REAL    NOT NULL DEFAULT 0,
  total         REAL    NOT NULL,
  status        TEXT    NOT NULL DEFAULT 'Pending' CHECK(status IN ('Pending','Paid','Overdue','Cancelled')),
  issued_date   TEXT    NOT NULL DEFAULT (date('now')),
  due_date      TEXT    DEFAULT NULL,
  paid_date     TEXT    DEFAULT NULL,
  notes         TEXT    DEFAULT NULL,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS budget_items (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  category     TEXT    NOT NULL,
  budget_year  INTEGER NOT NULL,
  budget_month INTEGER NOT NULL CHECK(budget_month BETWEEN 1 AND 12),
  allocated    REAL    NOT NULL DEFAULT 0,
  spent        REAL    NOT NULL DEFAULT 0,
  notes        TEXT    DEFAULT NULL,
  created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE(category, budget_year, budget_month)
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS notifications (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        TEXT    NOT NULL CHECK(type IN ('Info','Warning','Alert','Success')),
  title       TEXT    NOT NULL,
  message     TEXT    NOT NULL,
  entity      TEXT    DEFAULT NULL,
  entity_id   INTEGER DEFAULT NULL,
  is_read     INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- PERFORMANCE INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_vehicles_status     ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_region     ON vehicles(region);
CREATE INDEX IF NOT EXISTS idx_vehicles_type       ON vehicles(type);
CREATE INDEX IF NOT EXISTS idx_drivers_status      ON drivers(status);
CREATE INDEX IF NOT EXISTS idx_drivers_license     ON drivers(license_no);
CREATE INDEX IF NOT EXISTS idx_trips_status        ON trips(status);
CREATE INDEX IF NOT EXISTS idx_trips_vehicle       ON trips(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_trips_driver        ON trips(driver_id);
CREATE INDEX IF NOT EXISTS idx_trips_dates         ON trips(dispatched_at, completed_at);
CREATE INDEX IF NOT EXISTS idx_maintenance_vehicle ON maintenance_records(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_status  ON maintenance_records(status);
CREATE INDEX IF NOT EXISTS idx_fuel_vehicle        ON fuel_logs(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_fuel_date           ON fuel_logs(log_date);
CREATE INDEX IF NOT EXISTS idx_expenses_vehicle    ON expenses(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_expenses_category   ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_date       ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_incidents_driver    ON safety_incidents(driver_id);
CREATE INDEX IF NOT EXISTS idx_audit_user          ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user  ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_invoices_trip       ON invoices(trip_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status     ON invoices(status);

-- ============================================================
-- TRIGGERS: auto-update timestamps & state machines
-- ============================================================

CREATE TRIGGER IF NOT EXISTS trg_vehicles_updated
AFTER UPDATE ON vehicles FOR EACH ROW
BEGIN
  UPDATE vehicles SET updated_at = datetime('now') WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_drivers_updated
AFTER UPDATE ON drivers FOR EACH ROW
BEGIN
  UPDATE drivers SET updated_at = datetime('now') WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_trips_updated
AFTER UPDATE ON trips FOR EACH ROW
BEGIN
  UPDATE trips SET updated_at = datetime('now') WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_maintenance_updated
AFTER UPDATE ON maintenance_records FOR EACH ROW
BEGIN
  UPDATE maintenance_records SET updated_at = datetime('now') WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_expenses_updated
AFTER UPDATE ON expenses FOR EACH ROW
BEGIN
  UPDATE expenses SET updated_at = datetime('now') WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_invoices_updated
AFTER UPDATE ON invoices FOR EACH ROW
BEGIN
  UPDATE invoices SET updated_at = datetime('now') WHERE id = OLD.id;
END;

-- Trip dispatched: lock vehicle and driver
CREATE TRIGGER IF NOT EXISTS trg_trip_dispatched
AFTER UPDATE OF status ON trips FOR EACH ROW
WHEN NEW.status = 'Dispatched' AND OLD.status != 'Dispatched'
BEGIN
  UPDATE vehicles SET status = 'On Trip' WHERE id = NEW.vehicle_id;
  UPDATE drivers  SET status = 'On Trip' WHERE id = NEW.driver_id;
END;

-- Trip completed: free resources, update stats
CREATE TRIGGER IF NOT EXISTS trg_trip_completed
AFTER UPDATE OF status ON trips FOR EACH ROW
WHEN NEW.status = 'Completed' AND OLD.status != 'Completed'
BEGIN
  UPDATE vehicles SET status = 'Available',
    odometer = odometer + COALESCE(NEW.actual_distance, NEW.planned_distance)
    WHERE id = NEW.vehicle_id;
  UPDATE drivers SET status = 'Available',
    total_trips = total_trips + 1,
    total_km    = total_km + COALESCE(NEW.actual_distance, NEW.planned_distance)
    WHERE id = NEW.driver_id;
END;

-- Trip cancelled: free resources if they were locked
CREATE TRIGGER IF NOT EXISTS trg_trip_cancelled
AFTER UPDATE OF status ON trips FOR EACH ROW
WHEN NEW.status = 'Cancelled' AND OLD.status != 'Cancelled'
BEGIN
  UPDATE vehicles SET status = 'Available' WHERE id = NEW.vehicle_id AND status = 'On Trip';
  UPDATE drivers  SET status = 'Available' WHERE id = NEW.driver_id  AND status = 'On Trip';
END;

-- New active maintenance → put vehicle In Shop
CREATE TRIGGER IF NOT EXISTS trg_maintenance_in_shop
AFTER INSERT ON maintenance_records FOR EACH ROW
WHEN NEW.status = 'Active'
BEGIN
  UPDATE vehicles SET status = 'In Shop' WHERE id = NEW.vehicle_id;
END;

-- Maintenance closed → restore vehicle to Available
CREATE TRIGGER IF NOT EXISTS trg_maintenance_closed
AFTER UPDATE OF status ON maintenance_records FOR EACH ROW
WHEN NEW.status = 'Closed' AND OLD.status = 'Active'
BEGIN
  UPDATE vehicles SET status = 'Available' WHERE id = NEW.vehicle_id AND status = 'In Shop';
END;

-- Safety incident → deduct from driver safety score
CREATE TRIGGER IF NOT EXISTS trg_incident_score
AFTER INSERT ON safety_incidents FOR EACH ROW
WHEN NEW.score_deduction > 0
BEGIN
  UPDATE drivers SET safety_score = MAX(0, safety_score - NEW.score_deduction)
    WHERE id = NEW.driver_id;
END;

-- ============================================================
-- VIEWS: pre-built aggregates for dashboards
-- ============================================================

CREATE VIEW IF NOT EXISTS v_fleet_summary AS
SELECT
  COUNT(*) AS total_vehicles,
  SUM(CASE WHEN status='Available' THEN 1 ELSE 0 END) AS available,
  SUM(CASE WHEN status='On Trip'   THEN 1 ELSE 0 END) AS on_trip,
  SUM(CASE WHEN status='In Shop'   THEN 1 ELSE 0 END) AS in_shop,
  SUM(CASE WHEN status='Retired'   THEN 1 ELSE 0 END) AS retired,
  ROUND(SUM(CASE WHEN status='On Trip' THEN 1.0 ELSE 0 END)*100.0/MAX(COUNT(*),1),1) AS utilisation_pct
FROM vehicles;

CREATE VIEW IF NOT EXISTS v_driver_summary AS
SELECT
  COUNT(*) AS total_drivers,
  SUM(CASE WHEN status='Available' THEN 1 ELSE 0 END) AS available,
  SUM(CASE WHEN status='On Trip'   THEN 1 ELSE 0 END) AS on_trip,
  SUM(CASE WHEN status='Off Duty'  THEN 1 ELSE 0 END) AS off_duty,
  SUM(CASE WHEN status='Suspended' THEN 1 ELSE 0 END) AS suspended,
  ROUND(AVG(safety_score),1) AS avg_safety_score
FROM drivers;

CREATE VIEW IF NOT EXISTS v_trips_performance AS
SELECT
  COUNT(*) AS total_trips,
  SUM(CASE WHEN status='Draft'      THEN 1 ELSE 0 END) AS draft,
  SUM(CASE WHEN status='Dispatched' THEN 1 ELSE 0 END) AS active,
  SUM(CASE WHEN status='Completed'  THEN 1 ELSE 0 END) AS completed,
  SUM(CASE WHEN status='Cancelled'  THEN 1 ELSE 0 END) AS cancelled,
  COALESCE(SUM(CASE WHEN status='Completed' THEN revenue        ELSE 0 END),0) AS total_revenue,
  COALESCE(SUM(CASE WHEN status='Completed' THEN actual_distance ELSE 0 END),0) AS total_km
FROM trips;

CREATE VIEW IF NOT EXISTS v_financial_overview AS
SELECT
  (SELECT COALESCE(SUM(revenue),0) FROM trips WHERE status='Completed') AS total_revenue,
  (SELECT COALESCE(SUM(cost),0)    FROM fuel_logs)                       AS total_fuel_cost,
  (SELECT COALESCE(SUM(amount),0)  FROM expenses)                        AS total_expenses,
  (SELECT COALESCE(SUM(cost),0)    FROM maintenance_records)             AS total_maintenance_cost,
  (SELECT COALESCE(SUM(revenue),0) FROM trips WHERE status='Completed')
  - (SELECT COALESCE(SUM(cost),0)  FROM fuel_logs)
  - (SELECT COALESCE(SUM(amount),0) FROM expenses)
  - (SELECT COALESCE(SUM(cost),0)  FROM maintenance_records)            AS net_profit;

