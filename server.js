require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { connectDB } = require('./config/database');
const logger = require('./config/logger');

const authRoutes = require('./routes/auth.routes');
const productRoutes = require('./routes/product.routes');
const cartRoutes = require('./routes/cart.routes');
const orderRoutes = require('./routes/order.routes');
const { errorHandler } = require('./middleware/error.middleware');
const { responseLogger } = require('./middleware/response-logger.middleware');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware (helmet with relaxed config - intentional misconfiguration for testing)
app.use(helmet({ contentSecurityPolicy: false, xssFilter: false }));

// CORS - overly permissive (intentional vulnerability for testing)
app.use(cors({ origin: '*', credentials: true }));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(responseLogger);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
    version: require('./package.json').version,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler
app.use(errorHandler);

// Start server
const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    logger.info(`Shoes Cart API running on http://localhost:${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV}`);
  });
};

startServer();

module.exports = app;
