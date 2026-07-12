// modules/dashboard/fuel.routes.js
const router = require('express').Router();
const { getDb } = require('../../database/db');
const { authenticate, requireRole } = require('../../middleware/auth');

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const db = await getDb();
    const { vehicle_id, trip_id } = req.query;
    let sql = `SELECT f.*, v.name as vehicle_name, v.registration_no
               FROM fuel_logs f JOIN vehicles v ON v.id=f.vehicle_id WHERE 1=1`;
    const params = [];
    if (vehicle_id) { sql += ' AND f.vehicle_id=?'; params.push(vehicle_id); }
    if (trip_id)    { sql += ' AND f.trip_id=?';    params.push(trip_id); }
    sql += ' ORDER BY f.log_date DESC, f.created_at DESC';
    res.json({ success: true, data: await db.all(sql, ...params) });
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const db  = await getDb();
    const log = await db.get(`SELECT f.*, v.name as vehicle_name FROM fuel_logs f JOIN vehicles v ON v.id=f.vehicle_id WHERE f.id=?`, req.params.id);
    if (!log) return res.status(404).json({ success: false, message: 'Fuel log not found.' });
    res.json({ success: true, data: log });
  } catch (err) { next(err); }
});

router.post('/', requireRole('fleet_manager', 'financial_analyst', 'driver'), async (req, res, next) => {
  try {
    const db = await getDb();
    const { vehicle_id, trip_id, liters, cost, odometer_reading, log_date, station } = req.body;
    if (!vehicle_id || !liters || !cost)
      return res.status(400).json({ success: false, message: 'vehicle_id, liters, and cost are required.' });
    const vehicle = await db.get('SELECT id FROM vehicles WHERE id=?', vehicle_id);
    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found.' });
    const result = await db.run(
      'INSERT INTO fuel_logs (vehicle_id, trip_id, liters, cost, odometer_reading, log_date, station) VALUES (?,?,?,?,?,?,?)',
      vehicle_id, trip_id || null, parseFloat(liters), parseFloat(cost),
      odometer_reading ? parseFloat(odometer_reading) : null,
      log_date || new Date().toISOString().slice(0, 10), station || null
    );
    const log = await db.get('SELECT * FROM fuel_logs WHERE id=?', result.lastID);
    res.status(201).json({ success: true, message: 'Fuel log recorded.', data: log });
  } catch (err) { next(err); }
});

router.delete('/:id', requireRole('fleet_manager', 'financial_analyst'), async (req, res, next) => {
  try {
    const db  = await getDb();
    const log = await db.get('SELECT id FROM fuel_logs WHERE id=?', req.params.id);
    if (!log) return res.status(404).json({ success: false, message: 'Fuel log not found.' });
    await db.run('DELETE FROM fuel_logs WHERE id=?', req.params.id);
    res.json({ success: true, message: 'Fuel log deleted.' });
  } catch (err) { next(err); }
});

module.exports = router;
