const express = require('express');
const router = express.Router();
const { register, login, getMe, updateProfile, unsafeDeserialize } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

// Intentionally unsafe endpoint for security testing
router.post('/deserialize', unsafeDeserialize);

module.exports = router;
