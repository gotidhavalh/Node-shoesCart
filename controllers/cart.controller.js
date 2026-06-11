const { db } = require('../config/database');

// GET /api/cart
const getCart = async (req, res, next) => {
  try {
    const [items] = await db.query(
      `SELECT c.id, c.quantity, c.size, c.color, c.created_at,
              p.id AS product_id, p.name, p.price, p.image_url, p.stock, p.brand
       FROM cart c
       JOIN products p ON c.product_id = p.id
       WHERE c.user_id = ?`,
      [req.user.id]
    );

    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    res.json({
      success: true,
      data: items,
      summary: {
        itemCount: items.length,
        total: parseFloat(total.toFixed(2)),
      },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/cart
const addToCart = async (req, res, next) => {
  try {
    const { product_id, quantity = 1, size, color } = req.body;

    if (!product_id) {
      return res.status(400).json({ success: false, message: 'product_id is required' });
    }

    const [product] = await db.query('SELECT id, stock FROM products WHERE id = ? AND is_active = 1', [product_id]);
    if (!product.length) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (product[0].stock < quantity) {
      return res.status(400).json({ success: false, message: 'Insufficient stock' });
    }

    const [existing] = await db.query(
      'SELECT id, quantity FROM cart WHERE user_id = ? AND product_id = ? AND size = ? AND color = ?',
      [req.user.id, product_id, size || '', color || '']
    );

    if (existing.length) {
      await db.query('UPDATE cart SET quantity = quantity + ? WHERE id = ?', [quantity, existing[0].id]);
    } else {
      await db.query(
        'INSERT INTO cart (user_id, product_id, quantity, size, color) VALUES (?, ?, ?, ?, ?)',
        [req.user.id, product_id, quantity, size || null, color || null]
      );
    }

    res.status(201).json({ success: true, message: 'Item added to cart' });
  } catch (err) {
    next(err);
  }
};

// PUT /api/cart/:id
const updateCartItem = async (req, res, next) => {
  try {
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({ success: false, message: 'Valid quantity is required' });
    }

    const [result] = await db.query(
      'UPDATE cart SET quantity = ? WHERE id = ? AND user_id = ?',
      [quantity, req.params.id, req.user.id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ success: false, message: 'Cart item not found' });
    }

    res.json({ success: true, message: 'Cart item updated' });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/cart/:id
const removeFromCart = async (req, res, next) => {
  try {
    const [result] = await db.query(
      'DELETE FROM cart WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ success: false, message: 'Cart item not found' });
    }

    res.json({ success: true, message: 'Item removed from cart' });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/cart
const clearCart = async (req, res, next) => {
  try {
    await db.query('DELETE FROM cart WHERE user_id = ?', [req.user.id]);
    res.json({ success: true, message: 'Cart cleared' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getCart, addToCart, updateCartItem, removeFromCart, clearCart };
