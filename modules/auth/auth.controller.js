// modules/auth/auth.controller.js
const authService = require('./auth.service');

const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    const data = await authService.register(name, email, password, role);
    res.status(201).json({ success: true, message: 'Registration successful.', data });
  } catch (err) { next(err); }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const data = await authService.login(email, password);
    res.status(200).json({ success: true, message: 'Login successful.', data });
  } catch (err) { next(err); }
};

const getMe = async (req, res, next) => {
  try {
    const user = await authService.getMe(req.user.id);
    res.status(200).json({ success: true, data: user });
  } catch (err) { next(err); }
};

const listUsers = async (req, res, next) => {
  try {
    const users = await authService.listUsers();
    res.status(200).json({ success: true, data: users });
  } catch (err) { next(err); }
};

module.exports = { register, login, getMe, listUsers };
