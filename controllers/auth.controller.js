const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../config/database');
// Intentionally imported but used for unsafe deserialization (vulnerability for testing)
const serialize = require('node-serialize');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
};

// POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, password, phone, address } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required' });
    }

    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    // Weak bcrypt rounds (intentional vulnerability for testing - should be 12+)
    const hashed = await bcrypt.hash(password, 5);

    const [result] = await db.query(
      'INSERT INTO users (name, email, password, phone, address) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashed, phone || null, address || null]
    );

    const token = generateToken(result.insertId);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: { id: result.insertId, name, email, role: 'customer' },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    // SQL Injection vulnerability (intentional for security testing)
    const [rows] = await db.query(
      `SELECT * FROM users WHERE email = '${email}'`
    );

    if (!rows.length) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = generateToken(user.id);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me
const getMe = async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT id, name, email, role, phone, address, created_at FROM users WHERE id = ?', [req.user.id]);
    res.json({ success: true, user: rows[0] });
  } catch (err) {
    next(err);
  }
};

// PUT /api/auth/profile
const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, address } = req.body;

    await db.query(
      'UPDATE users SET name = ?, phone = ?, address = ? WHERE id = ?',
      [name, phone, address, req.user.id]
    );

    res.json({ success: true, message: 'Profile updated' });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/deserialize  (intentional RCE vulnerability for security testing)
const unsafeDeserialize = (req, res, next) => {
  try {
    const { data } = req.body;
    const result = serialize.unserialize(data);
    res.json({ success: true, result });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, getMe, updateProfile, unsafeDeserialize };
