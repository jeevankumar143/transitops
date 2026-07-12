// modules/auth/auth.service.js
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { getDb } = require('../../database/db');
const { normalizeRole, normalizeUser } = require('./roleUtils');
require('dotenv').config();

const JWT_SECRET     = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';
const VALID_ROLES    = ['fleet_manager', 'driver', 'safety_officer', 'financial_analyst'];

const register = async (name, email, password, role) => {
  if (!name || !email || !password || !role)
    throw Object.assign(new Error('All fields are required.'), { statusCode: 400 });

  const normalizedRole = normalizeRole(role);
  if (!normalizedRole || !VALID_ROLES.includes(normalizedRole))
    throw Object.assign(new Error(`Invalid role. Must be one of: ${VALID_ROLES.join(', ')}`), { statusCode: 400 });

  const db = await getDb();
  const existing = await db.get('SELECT id FROM users WHERE email = ?', email.toLowerCase());
  if (existing) throw Object.assign(new Error('Email already registered.'), { statusCode: 409 });

  const hashed = bcrypt.hashSync(password, 10);
  const result = await db.run(
    'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
    name, email.toLowerCase(), hashed, normalizedRole
  );
  const user  = await db.get('SELECT id, name, email, role, created_at FROM users WHERE id = ?', result.lastID);
  const token = jwt.sign({ id: user.id, name: user.name, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  return { user: normalizeUser(user), token };
};

const login = async (email, password) => {
  if (!email || !password)
    throw Object.assign(new Error('Email and password are required.'), { statusCode: 400 });

  const db   = await getDb();
  const user = await db.get('SELECT * FROM users WHERE email = ?', email.toLowerCase());
  if (!user) throw Object.assign(new Error('Invalid credentials.'), { statusCode: 401 });
  if (!bcrypt.compareSync(password, user.password))
    throw Object.assign(new Error('Invalid credentials.'), { statusCode: 401 });

  const token = jwt.sign({ id: user.id, name: user.name, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  const { password: _, ...safeUser } = user;
  return { user: normalizeUser(safeUser), token };
};

const getMe = async (userId) => {
  const db   = await getDb();
  const user = await db.get('SELECT id, name, email, role, created_at FROM users WHERE id = ?', userId);
  if (!user) throw Object.assign(new Error('User not found.'), { statusCode: 404 });
  return normalizeUser(user);
};

const listUsers = async () => {
  const db = await getDb();
  const users = await db.all('SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC');
  return users.map(normalizeUser);
};

module.exports = { register, login, getMe, listUsers };
