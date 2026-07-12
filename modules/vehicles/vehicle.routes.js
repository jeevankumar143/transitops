// modules/vehicles/vehicle.routes.js

const router = require('express').Router();
const ctrl = require('./vehicle.controller');
const { authenticate, requireRole } = require('../../middleware/auth');

// All vehicle routes require authentication
router.use(authenticate);

router.get('/',          ctrl.list);
router.get('/available', ctrl.listAvailable);
router.get('/:id',       ctrl.getOne);

// Write operations: fleet_manager and safety_officer
router.post('/',    requireRole('fleet_manager', 'safety_officer'), ctrl.create);
router.put('/:id',  requireRole('fleet_manager', 'safety_officer'), ctrl.update);
router.delete('/:id', requireRole('fleet_manager'), ctrl.remove);

module.exports = router;
