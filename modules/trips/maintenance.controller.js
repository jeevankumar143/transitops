// modules/trips/maintenance.controller.js
const { getDb } = require('../../database/db');

const VALID_TYPES = ['Scheduled', 'Breakdown', 'Inspection', 'Tyres', 'Engine', 'Other'];

const list = async (req, res, next) => {
  try {
    const db = await getDb();
    const { vehicle_id, status } = req.query;
    let sql = `SELECT m.*, v.name as vehicle_name, v.registration_no
               FROM maintenance_records m JOIN vehicles v ON v.id=m.vehicle_id WHERE 1=1`;
    const params = [];
    if (vehicle_id) { sql += ' AND m.vehicle_id=?'; params.push(vehicle_id); }
    if (status)     { sql += ' AND m.status=?';     params.push(status); }
    sql += ' ORDER BY m.created_at DESC';
    res.json({ success: true, data: await db.all(sql, ...params) });
  } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const db = await getDb();
    const record = await db.get(`SELECT m.*, v.name as vehicle_name, v.registration_no
      FROM maintenance_records m JOIN vehicles v ON v.id=m.vehicle_id WHERE m.id=?`, req.params.id);
    if (!record) return res.status(404).json({ success: false, message: 'Record not found.' });
    res.json({ success: true, data: record });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const db = await getDb();
    const { vehicle_id, type, description, cost, technician, start_date } = req.body;
    if (!vehicle_id || !type || !description)
      return res.status(400).json({ success: false, message: 'vehicle_id, type, and description are required.' });
    if (!VALID_TYPES.includes(type))
      return res.status(400).json({ success: false, message: `Invalid type. Valid: ${VALID_TYPES.join(', ')}` });

    const vehicle = await db.get('SELECT * FROM vehicles WHERE id=?', vehicle_id);
    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found.' });
    if (vehicle.status === 'Retired') return res.status(422).json({ success: false, message: 'Cannot create maintenance for a Retired vehicle.' });
    if (vehicle.status === 'On Trip') return res.status(422).json({ success: false, message: 'Cannot send a vehicle On Trip to maintenance.' });

    // Set vehicle to In Shop
    await db.run("UPDATE vehicles SET status='In Shop', updated_at=datetime('now') WHERE id=?", vehicle_id);
    const result = await db.run(`
      INSERT INTO maintenance_records (vehicle_id, type, description, cost, status, technician, start_date)
      VALUES (?, ?, ?, ?, 'Active', ?, ?)`,
      vehicle_id, type, description, parseFloat(cost) || 0, technician || null,
      start_date || new Date().toISOString()
    );
    const record = await db.get(`SELECT m.*, v.name as vehicle_name, v.registration_no
      FROM maintenance_records m JOIN vehicles v ON v.id=m.vehicle_id WHERE m.id=?`, result.lastID);
    res.status(201).json({ success: true, message: 'Maintenance logged. Vehicle is now In Shop.', data: record });
  } catch (err) { next(err); }
};

const close = async (req, res, next) => {
  try {
    const db     = await getDb();
    const record = await db.get('SELECT * FROM maintenance_records WHERE id=?', req.params.id);
    if (!record) return res.status(404).json({ success: false, message: 'Record not found.' });
    if (record.status === 'Closed') return res.status(422).json({ success: false, message: 'Already closed.' });

    const vehicle  = await db.get('SELECT * FROM vehicles WHERE id=?', record.vehicle_id);
    const { end_date, cost } = req.body;

    if (vehicle && vehicle.status !== 'Retired')
      await db.run("UPDATE vehicles SET status='Available', updated_at=datetime('now') WHERE id=?", record.vehicle_id);

    await db.run(`UPDATE maintenance_records SET
      status='Closed', end_date=?, cost=?, updated_at=datetime('now') WHERE id=?`,
      end_date || new Date().toISOString(),
      cost !== undefined ? parseFloat(cost) : record.cost,
      req.params.id
    );
    const updated = await db.get(`SELECT m.*, v.name as vehicle_name, v.registration_no
      FROM maintenance_records m JOIN vehicles v ON v.id=m.vehicle_id WHERE m.id=?`, req.params.id);
    res.json({ success: true, message: 'Maintenance closed. Vehicle restored to Available.', data: updated });
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const db     = await getDb();
    const record = await db.get('SELECT * FROM maintenance_records WHERE id=?', req.params.id);
    if (!record) return res.status(404).json({ success: false, message: 'Record not found.' });
    const { type, description, cost, technician } = req.body;
    await db.run(`UPDATE maintenance_records SET type=?, description=?, cost=?, technician=?, updated_at=datetime('now') WHERE id=?`,
      type || record.type, description || record.description,
      cost !== undefined ? parseFloat(cost) : record.cost,
      technician !== undefined ? technician : record.technician,
      req.params.id
    );
    const updated = await db.get(`SELECT m.*, v.name as vehicle_name, v.registration_no
      FROM maintenance_records m JOIN vehicles v ON v.id=m.vehicle_id WHERE m.id=?`, req.params.id);
    res.json({ success: true, message: 'Record updated.', data: updated });
  } catch (err) { next(err); }
};

module.exports = { list, getOne, create, close, update };
