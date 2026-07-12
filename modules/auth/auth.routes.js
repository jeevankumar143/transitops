// modules/auth/auth.routes.js

const router = require('express').Router();
const controller = require('./auth.controller');
const { authenticate, requireRole } = require('../../middleware/auth');

// Public routes
router.post('/register', controller.register);
router.post('/login', controller.login);

// Protected routes
router.get('/me', authenticate, controller.getMe);
router.get('/users', authenticate, requireRole('fleet_manager'), controller.listUsers);

module.exports = router;
