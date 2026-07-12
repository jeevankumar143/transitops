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
app.use(express.static(path.join(__dirname, 'public')));

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
