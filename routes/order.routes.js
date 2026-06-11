const express = require('express');
const router = express.Router();
const {
  placeOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
} = require('../controllers/order.controller');
const { protect, adminOnly } = require('../middleware/auth.middleware');

router.use(protect);

router.post('/', placeOrder);
router.get('/', getMyOrders);
router.get('/admin/all', adminOnly, getAllOrders);
router.get('/:id', getOrderById);
router.put('/:id/cancel', cancelOrder);
router.put('/admin/:id/status', adminOnly, updateOrderStatus);

module.exports = router;
