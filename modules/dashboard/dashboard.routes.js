// modules/dashboard/dashboard.routes.js

const router = require('express').Router();
const ctrl = require('./dashboard.controller');
const { authenticate } = require('../../middleware/auth');

router.use(authenticate);

router.get('/kpis',        ctrl.getKPIs);
router.get('/financials',  ctrl.getFinancials);
router.get('/export/trips',       ctrl.exportTripsCSV);
router.get('/export/vehicles',    ctrl.exportVehiclesCSV);
router.get('/export/financials',  ctrl.exportFinancialsCSV);

module.exports = router;
