// modules/dashboard/expense.routes.js
const router = require('express').Router();
const { getDb } = require('../../database/db');
const { authenticate, requireRole } = require('../../middleware/auth');

const VALID_CATEGORIES = ['Toll', 'Maintenance', 'Fuel', 'Salary', 'Insurance', 'Other'];

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const db = await getDb();
    const { vehicle_id, trip_id, category } = req.query;
    let sql = `SELECT e.*, v.name as vehicle_name, v.registration_no, u.name as recorded_by_name
               FROM expenses e LEFT JOIN vehicles v ON v.id=e.vehicle_id LEFT JOIN users u ON u.id=e.recorded_by WHERE 1=1`;
    const params = [];
    if (vehicle_id) { sql += ' AND e.vehicle_id=?'; params.push(vehicle_id); }
    if (trip_id)    { sql += ' AND e.trip_id=?';    params.push(trip_id); }
    if (category)   { sql += ' AND e.category=?';   params.push(category); }
    sql += ' ORDER BY e.expense_date DESC, e.created_at DESC';
    res.json({ success: true, data: await db.all(sql, ...params) });
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const db  = await getDb();
    const exp = await db.get(`SELECT e.*, v.name as vehicle_name FROM expenses e LEFT JOIN vehicles v ON v.id=e.vehicle_id WHERE e.id=?`, req.params.id);
    if (!exp) return res.status(404).json({ success: false, message: 'Expense not found.' });
    res.json({ success: true, data: exp });
  } catch (err) { next(err); }
});

router.post('/', requireRole('fleet_manager', 'financial_analyst'), async (req, res, next) => {
  try {
    const db = await getDb();
    const { vehicle_id, trip_id, category, amount, description, expense_date } = req.body;
    if (!category || !amount)
      return res.status(400).json({ success: false, message: 'category and amount are required.' });
    if (!VALID_CATEGORIES.includes(category))
      return res.status(400).json({ success: false, message: `Invalid category. Valid: ${VALID_CATEGORIES.join(', ')}` });
    const result = await db.run(
      'INSERT INTO expenses (vehicle_id, trip_id, category, amount, description, expense_date, recorded_by) VALUES (?,?,?,?,?,?,?)',
      vehicle_id || null, trip_id || null, category, parseFloat(amount),
      description || null, expense_date || new Date().toISOString().slice(0, 10), req.user.id
    );
    const exp = await db.get('SELECT * FROM expenses WHERE id=?', result.lastID);
    res.status(201).json({ success: true, message: 'Expense recorded.', data: exp });
  } catch (err) { next(err); }
});

router.delete('/:id', requireRole('fleet_manager', 'financial_analyst'), async (req, res, next) => {
  try {
    const db  = await getDb();
    const exp = await db.get('SELECT id FROM expenses WHERE id=?', req.params.id);
    if (!exp) return res.status(404).json({ success: false, message: 'Expense not found.' });
    await db.run('DELETE FROM expenses WHERE id=?', req.params.id);
    res.json({ success: true, message: 'Expense deleted.' });
  } catch (err) { next(err); }
});

module.exports = router;
