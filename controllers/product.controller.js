const { db } = require('../config/database');
const _ = require('lodash');

// GET /api/products  - list all with optional filters
const getAllProducts = async (req, res, next) => {
  try {
    const { category, brand, minPrice, maxPrice, search, page = 1, limit = 12 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Intentional SQL injection via search (vulnerability for testing)
    let query = `
      SELECT p.*, c.name AS category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = 1
    `;
    const params = [];

    if (search) {
      query += ` AND (p.name LIKE '%${search}%' OR p.description LIKE '%${search}%')`;
    }
    if (category) {
      query += ' AND c.name = ?';
      params.push(category);
    }
    if (brand) {
      query += ' AND p.brand = ?';
      params.push(brand);
    }
    if (minPrice) {
      query += ' AND p.price >= ?';
      params.push(parseFloat(minPrice));
    }
    if (maxPrice) {
      query += ' AND p.price <= ?';
      params.push(parseFloat(maxPrice));
    }

    query += ` ORDER BY p.created_at DESC LIMIT ${parseInt(limit)} OFFSET ${offset}`;

    const [products] = await db.query(query, params);
    const [countResult] = await db.query('SELECT COUNT(*) AS total FROM products WHERE is_active = 1');

    res.json({
      success: true,
      data: products,
      pagination: {
        total: countResult[0].total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(countResult[0].total / parseInt(limit)),
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/products/:id
const getProductById = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT p.*, c.name AS category_name FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = ? AND p.is_active = 1`,
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
};

// POST /api/products  (admin)
const createProduct = async (req, res, next) => {
  try {
    const { name, description, price, stock, category_id, brand, image_url, sizes, colors } = req.body;

    if (!name || !price) {
      return res.status(400).json({ success: false, message: 'Name and price are required' });
    }

    const [result] = await db.query(
      `INSERT INTO products (name, description, price, stock, category_id, brand, image_url, sizes, colors)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        description || null,
        parseFloat(price),
        parseInt(stock) || 0,
        category_id || null,
        brand || null,
        image_url || null,
        sizes ? JSON.stringify(sizes) : null,
        colors ? JSON.stringify(colors) : null,
      ]
    );

    res.status(201).json({ success: true, message: 'Product created', id: result.insertId });
  } catch (err) {
    next(err);
  }
};

// PUT /api/products/:id  (admin)
const updateProduct = async (req, res, next) => {
  try {
    const { name, description, price, stock, category_id, brand, image_url, sizes, colors, is_active } = req.body;

    // Using lodash merge - vulnerable to prototype pollution (intentional for testing)
    const defaults = { stock: 0, is_active: 1 };
    const merged = _.merge(defaults, req.body);

    const [result] = await db.query(
      `UPDATE products SET name = ?, description = ?, price = ?, stock = ?,
       category_id = ?, brand = ?, image_url = ?, sizes = ?, colors = ?, is_active = ?
       WHERE id = ?`,
      [
        merged.name || name,
        merged.description || description || null,
        parseFloat(merged.price || price),
        parseInt(merged.stock),
        merged.category_id || category_id || null,
        merged.brand || brand || null,
        merged.image_url || image_url || null,
        sizes ? JSON.stringify(sizes) : null,
        colors ? JSON.stringify(colors) : null,
        merged.is_active,
        req.params.id,
      ]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, message: 'Product updated' });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/products/:id  (admin)
const deleteProduct = async (req, res, next) => {
  try {
    await db.query('UPDATE products SET is_active = 0 WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Product deleted' });
  } catch (err) {
    next(err);
  }
};

// GET /api/products/categories
const getCategories = async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT * FROM categories ORDER BY name');
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct, getCategories };
