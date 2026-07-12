// modules/vehicles/vehicle.controller.js
const { getDb } = require('../../database/db');

const VALID_STATUS = ['Available', 'On Trip', 'In Shop', 'Retired'];
const VALID_TYPES  = ['Truck', 'Van', 'Bus', 'Pickup', 'Tanker', 'Other'];

const list = async (req, res, next) => {
  try {
    const db = await getDb();
    const { status, type, region } = req.query;
    let sql = 'SELECT * FROM vehicles WHERE 1=1';
    const params = [];
    if (status) { sql += ' AND status = ?'; params.push(status); }
    if (type)   { sql += ' AND type = ?';   params.push(type); }
    if (region) { sql += ' AND region LIKE ?'; params.push(`%${region}%`); }
    sql += ' ORDER BY created_at DESC';
    const vehicles = await db.all(sql, ...params);
    res.json({ success: true, data: vehicles });
  } catch (err) { next(err); }
};

const listAvailable = async (req, res, next) => {
  try {
    const db = await getDb();
    const vehicles = await db.all("SELECT * FROM vehicles WHERE status = 'Available' ORDER BY name");
    res.json({ success: true, data: vehicles });
  } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const db = await getDb();
    const vehicle = await db.get('SELECT * FROM vehicles WHERE id = ?', req.params.id);
    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found.' });
    res.json({ success: true, data: vehicle });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const db = await getDb();
    const { registration_no, name, model, type, max_load_capacity, odometer, acquisition_cost, status, region } = req.body;
    if (!registration_no || !name || !model || !type)
      return res.status(400).json({ success: false, message: 'registration_no, name, model, and type are required.' });
    if (!VALID_TYPES.includes(type))
      return res.status(400).json({ success: false, message: `Invalid type. Valid: ${VALID_TYPES.join(', ')}` });
    const vStatus = status || 'Available';
    if (!VALID_STATUS.includes(vStatus))
      return res.status(400).json({ success: false, message: 'Invalid status.' });

    const result = await db.run(`
      INSERT INTO vehicles (registration_no, name, model, type, max_load_capacity, odometer, acquisition_cost, status, region)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      registration_no.toUpperCase(), name, model, type,
      parseFloat(max_load_capacity) || 0, parseFloat(odometer) || 0,
      parseFloat(acquisition_cost) || 0, vStatus, region || null
    );
    const vehicle = await db.get('SELECT * FROM vehicles WHERE id = ?', result.lastID);
    res.status(201).json({ success: true, message: 'Vehicle created.', data: vehicle });
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const db = await getDb();
    const vehicle = await db.get('SELECT * FROM vehicles WHERE id = ?', req.params.id);
    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found.' });
    const { registration_no, name, model, type, max_load_capacity, odometer, acquisition_cost, status, region } = req.body;
    if (status && !VALID_STATUS.includes(status))
      return res.status(400).json({ success: false, message: 'Invalid status.' });

    await db.run(`UPDATE vehicles SET
        registration_no=?, name=?, model=?, type=?, max_load_capacity=?, odometer=?, acquisition_cost=?,
        status=?, region=?, updated_at=datetime('now') WHERE id=?`,
      registration_no || vehicle.registration_no, name || vehicle.name, model || vehicle.model,
      type || vehicle.type,
      max_load_capacity !== undefined ? parseFloat(max_load_capacity) : vehicle.max_load_capacity,
      odometer !== undefined ? parseFloat(odometer) : vehicle.odometer,
      acquisition_cost !== undefined ? parseFloat(acquisition_cost) : vehicle.acquisition_cost,
      status || vehicle.status, region !== undefined ? region : vehicle.region, req.params.id
    );
    const updated = await db.get('SELECT * FROM vehicles WHERE id = ?', req.params.id);
    res.json({ success: true, message: 'Vehicle updated.', data: updated });
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    const db = await getDb();
    const vehicle = await db.get('SELECT * FROM vehicles WHERE id = ?', req.params.id);
    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found.' });
    const activeTrip = await db.get("SELECT id FROM trips WHERE vehicle_id = ? AND status IN ('Draft','Dispatched')", req.params.id);
    if (activeTrip) return res.status(409).json({ success: false, message: 'Cannot delete vehicle with active trips.' });
    await db.run('DELETE FROM vehicles WHERE id = ?', req.params.id);
    res.json({ success: true, message: 'Vehicle deleted.' });
  } catch (err) { next(err); }
};

module.exports = { list, listAvailable, getOne, create, update, remove };
