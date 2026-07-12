// modules/trips/trip.routes.js

const router = require('express').Router();
const ctrl = require('./trip.controller');
const { authenticate, requireRole } = require('../../middleware/auth');

router.use(authenticate);

router.get('/',    ctrl.list);
router.get('/:id', ctrl.getOne);

// Create trip: fleet_manager only
router.post('/', requireRole('fleet_manager', 'safety_officer'), ctrl.create);

// State transitions
router.post('/:id/dispatch', requireRole('fleet_manager'), ctrl.dispatch);
router.post('/:id/complete', requireRole('fleet_manager', 'safety_officer'), ctrl.complete);
router.post('/:id/cancel',   requireRole('fleet_manager', 'safety_officer'), ctrl.cancel);

module.exports = router;
