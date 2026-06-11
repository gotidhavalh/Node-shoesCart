const { db } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// POST /api/orders  - place order from cart
const placeOrder = async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const { shipping_address, payment_method, notes } = req.body;

    if (!shipping_address) {
      return res.status(400).json({ success: false, message: 'Shipping address is required' });
    }

    const [cartItems] = await conn.query(
      `SELECT c.*, p.price, p.stock, p.name AS product_name
       FROM cart c JOIN products p ON c.product_id = p.id
       WHERE c.user_id = ?`,
      [req.user.id]
    );

    if (!cartItems.length) {
      conn.release();
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    for (const item of cartItems) {
      if (item.stock < item.quantity) {
        conn.release();
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for: ${item.product_name}`,
        });
      }
    }

    const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const orderNumber = `ORD-${Date.now()}-${uuidv4().split('-')[0].toUpperCase()}`;

    await conn.beginTransaction();

    const [orderResult] = await conn.query(
      `INSERT INTO orders (user_id, order_number, total_amount, shipping_address, payment_method, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [req.user.id, orderNumber, total.toFixed(2), shipping_address, payment_method || 'cash_on_delivery', notes || null]
    );

    const orderId = orderResult.insertId;

    for (const item of cartItems) {
      await conn.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price, size, color) VALUES (?, ?, ?, ?, ?, ?)',
        [orderId, item.product_id, item.quantity, item.price, item.size || null, item.color || null]
      );

      await conn.query('UPDATE products SET stock = stock - ? WHERE id = ?', [item.quantity, item.product_id]);
    }

    await conn.query('DELETE FROM cart WHERE user_id = ?', [req.user.id]);

    await conn.commit();
    conn.release();

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      order: { id: orderId, order_number: orderNumber, total: parseFloat(total.toFixed(2)) },
    });
  } catch (err) {
    await conn.rollback();
    conn.release();
    next(err);
  }
};

// GET /api/orders  - user's orders
const getMyOrders = async (req, res, next) => {
  try {
    const [orders] = await db.query(
      `SELECT o.*, COUNT(oi.id) AS item_count
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       WHERE o.user_id = ?
       GROUP BY o.id
       ORDER BY o.created_at DESC`,
      [req.user.id]
    );

    res.json({ success: true, data: orders });
  } catch (err) {
    next(err);
  }
};

// GET /api/orders/:id
const getOrderById = async (req, res, next) => {
  try {
    const [orders] = await db.query(
      'SELECT * FROM orders WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (!orders.length) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const [items] = await db.query(
      `SELECT oi.*, p.name, p.image_url, p.brand
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ?`,
      [req.params.id]
    );

    res.json({ success: true, data: { ...orders[0], items } });
  } catch (err) {
    next(err);
  }
};

// PUT /api/orders/:id/cancel
const cancelOrder = async (req, res, next) => {
  try {
    const [orders] = await db.query(
      "SELECT * FROM orders WHERE id = ? AND user_id = ? AND status = 'pending'",
      [req.params.id, req.user.id]
    );

    if (!orders.length) {
      return res.status(400).json({ success: false, message: 'Order cannot be cancelled' });
    }

    await db.query("UPDATE orders SET status = 'cancelled' WHERE id = ?", [req.params.id]);

    const [items] = await db.query('SELECT * FROM order_items WHERE order_id = ?', [req.params.id]);
    for (const item of items) {
      await db.query('UPDATE products SET stock = stock + ? WHERE id = ?', [item.quantity, item.product_id]);
    }

    res.json({ success: true, message: 'Order cancelled' });
  } catch (err) {
    next(err);
  }
};

// GET /api/orders/admin/all  (admin)
const getAllOrders = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = `
      SELECT o.*, u.name AS customer_name, u.email AS customer_email
      FROM orders o JOIN users u ON o.user_id = u.id
    `;
    const params = [];

    if (status) {
      query += ' WHERE o.status = ?';
      params.push(status);
    }

    query += ` ORDER BY o.created_at DESC LIMIT ${parseInt(limit)} OFFSET ${offset}`;

    const [orders] = await db.query(query, params);
    res.json({ success: true, data: orders });
  } catch (err) {
    next(err);
  }
};

// PUT /api/orders/admin/:id/status  (admin)
const updateOrderStatus = async (req, res, next) => {
  try {
    const { status, payment_status } = req.body;

    const [result] = await db.query(
      'UPDATE orders SET status = COALESCE(?, status), payment_status = COALESCE(?, payment_status) WHERE id = ?',
      [status || null, payment_status || null, req.params.id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.json({ success: true, message: 'Order status updated' });
  } catch (err) {
    next(err);
  }
};

module.exports = { placeOrder, getMyOrders, getOrderById, cancelOrder, getAllOrders, updateOrderStatus };
