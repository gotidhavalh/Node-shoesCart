const express = require('express');
const router = express.Router();
const { getCart, addToCart, updateCartItem, removeFromCart, clearCart } = require('../controllers/cart.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

router.get('/', getCart);
router.post('/', addToCart);
router.put('/:id', updateCartItem);
router.delete('/', clearCart);
router.delete('/:id', removeFromCart);

module.exports = router;
