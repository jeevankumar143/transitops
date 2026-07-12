// modules/trips/trip.service.js
// ============================================================
// CORE STATE MACHINE for Trip Lifecycle (async version)
// Draft → Dispatched → Completed | Cancelled
// ============================================================

const { getDb } = require('../../database/db');

const TRANSITIONS = {
  Draft:      ['Dispatched', 'Cancelled'],
  Dispatched: ['Completed',  'Cancelled'],
  Completed:  [],
  Cancelled:  [],
};

const createTrip = async (data) => {
  const { vehicle_id, driver_id, source, destination, cargo_weight, planned_distance, revenue, notes } = data;
  if (!vehicle_id || !driver_id || !source || !destination)
    throw Object.assign(new Error('vehicle_id, driver_id, source, and destination are required.'), { statusCode: 400 });

  const db = await getDb();

  // Validate vehicle
  const vehicle = await db.get('SELECT * FROM vehicles WHERE id = ?', vehicle_id);
  if (!vehicle) throw Object.assign(new Error('Vehicle not found.'), { statusCode: 404 });
  if (vehicle.status === 'Retired')  throw Object.assign(new Error('Cannot assign a Retired vehicle.'), { statusCode: 422 });
  if (vehicle.status === 'In Shop')  throw Object.assign(new Error('Cannot assign a vehicle that is In Shop.'), { statusCode: 422 });
  if (vehicle.status === 'On Trip')  throw Object.assign(new Error('Vehicle is already On Trip.'), { statusCode: 422 });

  // Capacity check
  const weight = parseFloat(cargo_weight) || 0;
  if (weight > vehicle.max_load_capacity)
    throw Object.assign(new Error(
      `Cargo weight (${weight} kg) exceeds vehicle max load capacity (${vehicle.max_load_capacity} kg).`
    ), { statusCode: 422 });

  // Validate driver
  const driver = await db.get('SELECT * FROM drivers WHERE id = ?', driver_id);
  if (!driver) throw Object.assign(new Error('Driver not found.'), { statusCode: 404 });
  if (driver.status === 'Suspended') throw Object.assign(new Error('Cannot assign a Suspended driver.'), { statusCode: 422 });
  if (driver.status === 'On Trip')   throw Object.assign(new Error('Driver is already On Trip.'), { statusCode: 422 });
  if (driver.status === 'Off Duty')  throw Object.assign(new Error('Driver is Off Duty.'), { statusCode: 422 });

  // License expiry
  const today = new Date().toISOString().slice(0, 10);
  if (driver.license_expiry < today)
    throw Object.assign(new Error(`Driver's license expired on ${driver.license_expiry}. Cannot assign.`), { statusCode: 422 });

  const result = await db.run(`
    INSERT INTO trips (vehicle_id, driver_id, source, destination, cargo_weight, planned_distance, revenue, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    vehicle_id, driver_id, source, destination, weight,
    parseFloat(planned_distance) || 0, parseFloat(revenue) || 0, notes || null
  );

  return db.get(`
    SELECT t.*, v.name as vehicle_name, v.registration_no, d.name as driver_name
    FROM trips t JOIN vehicles v ON v.id=t.vehicle_id JOIN drivers d ON d.id=t.driver_id
    WHERE t.id = ?`, result.lastID);
};

const transitionTrip = async (tripId, targetStatus, extra = {}) => {
  const db   = await getDb();
  const trip = await db.get('SELECT * FROM trips WHERE id = ?', tripId);
  if (!trip) throw Object.assign(new Error('Trip not found.'), { statusCode: 404 });

  const allowed = TRANSITIONS[trip.status];
  if (!allowed.includes(targetStatus))
    throw Object.assign(new Error(
      `Invalid transition: ${trip.status} → ${targetStatus}. Allowed: ${allowed.join(', ') || 'none (terminal state)'}`
    ), { statusCode: 422 });

  const now = new Date().toISOString();

  if (targetStatus === 'Dispatched') {
    await db.run("UPDATE vehicles SET status='On Trip', updated_at=datetime('now') WHERE id=?", trip.vehicle_id);
    await db.run("UPDATE drivers  SET status='On Trip', updated_at=datetime('now') WHERE id=?", trip.driver_id);
    await db.run("UPDATE trips SET status='Dispatched', dispatched_at=?, updated_at=datetime('now') WHERE id=?", now, tripId);
  }
  else if (targetStatus === 'Completed') {
    const actualDistance = parseFloat(extra.actual_distance) || trip.planned_distance;
    await db.run("UPDATE vehicles SET status='Available', odometer=odometer+?, updated_at=datetime('now') WHERE id=?", actualDistance, trip.vehicle_id);
    await db.run("UPDATE drivers  SET status='Available', updated_at=datetime('now') WHERE id=?", trip.driver_id);
    await db.run("UPDATE trips SET status='Completed', completed_at=?, actual_distance=?, updated_at=datetime('now') WHERE id=?", now, actualDistance, tripId);
  }
  else if (targetStatus === 'Cancelled') {
    if (trip.status === 'Dispatched') {
      await db.run("UPDATE vehicles SET status='Available', updated_at=datetime('now') WHERE id=?", trip.vehicle_id);
      await db.run("UPDATE drivers  SET status='Available', updated_at=datetime('now') WHERE id=?", trip.driver_id);
    }
    await db.run("UPDATE trips SET status='Cancelled', cancelled_at=?, updated_at=datetime('now') WHERE id=?", now, tripId);
  }

  return db.get(`
    SELECT t.*, v.name as vehicle_name, v.registration_no, d.name as driver_name
    FROM trips t JOIN vehicles v ON v.id=t.vehicle_id JOIN drivers d ON d.id=t.driver_id
    WHERE t.id = ?`, tripId);
};

const listTrips = async (filters = {}) => {
  const db = await getDb();
  const { status, vehicle_id, driver_id } = filters;
  let sql = `
    SELECT t.*, v.name as vehicle_name, v.registration_no, v.type as vehicle_type, d.name as driver_name
    FROM trips t JOIN vehicles v ON v.id=t.vehicle_id JOIN drivers d ON d.id=t.driver_id WHERE 1=1
  `;
  const params = [];
  if (status)     { sql += ' AND t.status = ?';     params.push(status); }
  if (vehicle_id) { sql += ' AND t.vehicle_id = ?'; params.push(vehicle_id); }
  if (driver_id)  { sql += ' AND t.driver_id = ?';  params.push(driver_id); }
  sql += ' ORDER BY t.created_at DESC';
  return db.all(sql, ...params);
};

const getTrip = async (id) => {
  const db   = await getDb();
  const trip = await db.get(`
    SELECT t.*, v.name as vehicle_name, v.registration_no, v.type as vehicle_type,
           v.max_load_capacity, d.name as driver_name, d.license_no, d.safety_score
    FROM trips t JOIN vehicles v ON v.id=t.vehicle_id JOIN drivers d ON d.id=t.driver_id
    WHERE t.id = ?`, id);
  if (!trip) throw Object.assign(new Error('Trip not found.'), { statusCode: 404 });
  return trip;
};

module.exports = { createTrip, transitionTrip, listTrips, getTrip };
