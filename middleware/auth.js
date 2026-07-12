// middleware/auth.js
// JWT verification + Role-Based Access Control (RBAC)

const jwt = require('jsonwebtoken');
require('dotenv').config();
const { normalizeRole } = require('../modules/auth/roleUtils');

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Verify JWT token from Authorization header or cookie.
 * Attaches decoded user payload to req.user.
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7);
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = {
      ...decoded,
      role: normalizeRole(decoded.role) || decoded.role,
    };
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

/**
 * Role-based access guard.
 * Usage: requireRole('fleet_manager', 'safety_officer')
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }
    const normalizedRole = normalizeRole(req.user.role);
    if (!roles.includes(normalizedRole || req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access restricted. Required role(s): ${roles.join(', ')}`
      });
    }
    next();
  };
};

module.exports = { authenticate, requireRole };
