// modules/trips/maintenance.routes.js

const router = require('express').Router();
const ctrl = require('./maintenance.controller');
const { authenticate, requireRole } = require('../../middleware/auth');

router.use(authenticate);

router.get('/',    ctrl.list);
router.get('/:id', ctrl.getOne);

router.post('/',           requireRole('fleet_manager', 'safety_officer'), ctrl.create);
router.put('/:id',         requireRole('fleet_manager', 'safety_officer'), ctrl.update);
router.post('/:id/close',  requireRole('fleet_manager', 'safety_officer'), ctrl.close);

module.exports = router;
