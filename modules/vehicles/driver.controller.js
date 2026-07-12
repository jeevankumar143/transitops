// modules/vehicles/driver.controller.js
const { getDb } = require('../../database/db');

const VALID_STATUS     = ['Available', 'On Trip', 'Off Duty', 'Suspended'];
const VALID_CATEGORIES = ['A', 'B', 'C', 'D', 'E', 'Heavy', 'PSV'];

const list = async (req, res, next) => {
  try {
    const db = await getDb();
    const { status, category } = req.query;
    let sql = 'SELECT * FROM drivers WHERE 1=1';
    const params = [];
    if (status)   { sql += ' AND status = ?';           params.push(status); }
    if (category) { sql += ' AND license_category = ?'; params.push(category); }
    sql += ' ORDER BY created_at DESC';
    const drivers = await db.all(sql, ...params);
    const today = new Date().toISOString().slice(0, 10);
    res.json({ success: true, data: drivers.map(d => ({ ...d, license_expired: d.license_expiry < today })) });
  } catch (err) { next(err); }
};

const listAvailable = async (req, res, next) => {
  try {
    const db    = await getDb();
    const today = new Date().toISOString().slice(0, 10);
    const drivers = await db.all("SELECT * FROM drivers WHERE status = 'Available' AND license_expiry >= ? ORDER BY name", today);
    res.json({ success: true, data: drivers });
  } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const db     = await getDb();
    const driver = await db.get('SELECT * FROM drivers WHERE id = ?', req.params.id);
    if (!driver) return res.status(404).json({ success: false, message: 'Driver not found.' });
    const today = new Date().toISOString().slice(0, 10);
    res.json({ success: true, data: { ...driver, license_expired: driver.license_expiry < today } });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const db = await getDb();
    const { name, license_no, license_category, license_expiry, contact_no, safety_score, status } = req.body;
    if (!name || !license_no || !license_category || !license_expiry || !contact_no)
      return res.status(400).json({ success: false, message: 'name, license_no, license_category, license_expiry, and contact_no are required.' });
    if (!VALID_CATEGORIES.includes(license_category))
      return res.status(400).json({ success: false, message: `Invalid license category. Valid: ${VALID_CATEGORIES.join(', ')}` });
    const dStatus = status || 'Available';
    if (!VALID_STATUS.includes(dStatus))
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    const score = parseFloat(safety_score);
    if (!isNaN(score) && (score < 0 || score > 100))
      return res.status(400).json({ success: false, message: 'Safety score must be between 0 and 100.' });

    const result = await db.run(
      'INSERT INTO drivers (name, license_no, license_category, license_expiry, contact_no, safety_score, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      name, license_no.toUpperCase(), license_category, license_expiry, contact_no, isNaN(score) ? 100 : score, dStatus
    );
    const driver = await db.get('SELECT * FROM drivers WHERE id = ?', result.lastID);
    res.status(201).json({ success: true, message: 'Driver created.', data: driver });
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const db     = await getDb();
    const driver = await db.get('SELECT * FROM drivers WHERE id = ?', req.params.id);
    if (!driver) return res.status(404).json({ success: false, message: 'Driver not found.' });
    const { name, license_no, license_category, license_expiry, contact_no, safety_score, status } = req.body;
    if (status && !VALID_STATUS.includes(status))
      return res.status(400).json({ success: false, message: 'Invalid status.' });

    await db.run(`UPDATE drivers SET
      name=?, license_no=?, license_category=?, license_expiry=?, contact_no=?, safety_score=?, status=?, updated_at=datetime('now')
      WHERE id=?`,
      name || driver.name, license_no || driver.license_no,
      license_category || driver.license_category, license_expiry || driver.license_expiry,
      contact_no || driver.contact_no,
      safety_score !== undefined ? parseFloat(safety_score) : driver.safety_score,
      status || driver.status, req.params.id
    );
    const updated = await db.get('SELECT * FROM drivers WHERE id = ?', req.params.id);
    res.json({ success: true, message: 'Driver updated.', data: updated });
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    const db     = await getDb();
    const driver = await db.get('SELECT * FROM drivers WHERE id = ?', req.params.id);
    if (!driver) return res.status(404).json({ success: false, message: 'Driver not found.' });
    const activeTrip = await db.get("SELECT id FROM trips WHERE driver_id = ? AND status IN ('Draft','Dispatched')", req.params.id);
    if (activeTrip) return res.status(409).json({ success: false, message: 'Cannot delete driver with active trips.' });
    await db.run('DELETE FROM drivers WHERE id = ?', req.params.id);
    res.json({ success: true, message: 'Driver deleted.' });
  } catch (err) { next(err); }
};

module.exports = { list, listAvailable, getOne, create, update, remove };
