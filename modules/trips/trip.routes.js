// modules/trips/trip.routes.js

const router = require('express').Router();
const ctrl = require('./trip.controller');
const { authenticate, requireRole } = require('../../middleware/auth');

router.use(authenticate);

router.get('/',    ctrl.list);
router.get('/:id', ctrl.getOne);

// Create trip: fleet_manager, safety_officer, driver
router.post('/', requireRole('fleet_manager', 'safety_officer', 'driver'), ctrl.create);

// State transitions
router.post('/:id/dispatch', requireRole('fleet_manager', 'driver'), ctrl.dispatch);
router.post('/:id/complete', requireRole('fleet_manager', 'safety_officer', 'driver'), ctrl.complete);
router.post('/:id/cancel',   requireRole('fleet_manager', 'safety_officer'), ctrl.cancel);

module.exports = router;
