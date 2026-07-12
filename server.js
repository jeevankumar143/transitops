// server.js — TransitOps Express entry point

require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const { getDb } = require('./database/db');
const errorHandler = require('./middleware/errorHandler');

const authRoutes        = require('./modules/auth/auth.routes');
const vehicleRoutes     = require('./modules/vehicles/vehicle.routes');
const driverRoutes      = require('./modules/vehicles/driver.routes');
const tripRoutes        = require('./modules/trips/trip.routes');
const maintenanceRoutes = require('./modules/trips/maintenance.routes');
const dashboardRoutes   = require('./modules/dashboard/dashboard.routes');
const fuelRoutes        = require('./modules/dashboard/fuel.routes');
const expenseRoutes     = require('./modules/dashboard/expense.routes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve landing introduction page at root /
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'landing.html'));
});

app.use(express.static(path.join(__dirname, 'public'), { index: false }));

// Public Delivery & Order Tracking endpoint (no auth required)
app.get('/api/public/track', async (req, res, next) => {
  try {
    const db = await getDb();
    const rawQuery = (req.query.order_id || req.query.q || '').trim();
    if (!rawQuery) {
      return res.status(400).json({ success: false, message: 'Please enter a valid Order or Tracking ID.' });
    }
    // Clean query: strip TRP-, #, leading zeroes if numeric
    const cleanId = rawQuery.replace(/^(#?TRP-?|ORD-?|#)/i, '').trim();
    const numId = parseInt(cleanId, 10);

    let sql = `
      SELECT t.*, v.registration_no, v.name as vehicle_name, v.type as vehicle_type, d.name as driver_name
      FROM trips t
      LEFT JOIN vehicles v ON v.id = t.vehicle_id
      LEFT JOIN drivers d ON d.id = t.driver_id
      WHERE t.id = ? OR t.source LIKE ? OR t.destination LIKE ?
      ORDER BY t.created_at DESC
      LIMIT 1
    `;
    const searchPattern = `%${rawQuery}%`;
    const trip = await db.get(sql, !isNaN(numId) ? numId : -1, searchPattern, searchPattern);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: `No active delivery order found matching "${rawQuery}". Try demo order IDs: 1, 2, or TRP-101.`
      });
    }

    res.json({
      success: true,
      data: {
        tracking_code: `TRP-100${trip.id}`,
        order_id: trip.id,
        source: trip.source,
        destination: trip.destination,
        status: trip.status,
        cargo_weight: trip.cargo_weight,
        planned_distance: trip.planned_distance,
        actual_distance: trip.actual_distance,
        vehicle_registration: trip.registration_no || 'Assigned soon',
        vehicle_type: trip.vehicle_type || 'Transport Unit',
        driver_name: trip.driver_name || 'Assigned Dispatcher',
        created_at: trip.created_at,
        dispatched_at: trip.dispatched_at,
        completed_at: trip.completed_at
      }
    });
  } catch (err) {
    next(err);
  }
});

app.use('/api/auth',        authRoutes);
app.use('/api/vehicles',    vehicleRoutes);
app.use('/api/drivers',     driverRoutes);
app.use('/api/trips',       tripRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/dashboard',   dashboardRoutes);
app.use('/api/fuel',        fuelRoutes);
app.use('/api/expenses',    expenseRoutes);

app.get('*', (req, res) => {
  if (req.path.startsWith('/api/'))
    return res.status(404).json({ success: false, message: 'API endpoint not found.' });
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use(errorHandler);

const PORT = process.env.PORT || 3000;

async function start() {
  await getDb(); // Initialize DB and apply schema
  app.listen(PORT, () => {
    console.log(`
  ╔════════════════════════════════════════╗
  ║   🚌 TransitOps is running!            ║
  ║   http://localhost:${PORT}               ║
  ╚════════════════════════════════════════╝
    `);
  });
}

start().catch(err => { console.error('Failed to start:', err); process.exit(1); });

module.exports = app;
