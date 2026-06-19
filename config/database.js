const mysql = require('mysql2');
require('dotenv').config();
const logger = require('./logger');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'admin',
  database: process.env.DB_NAME || 'shoes_cart',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+00:00',
});

const db = pool.promise();

const connectDB = async () => {
  try {
    const conn = await db.getConnection();
    logger.info(`MySQL connected: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
    conn.release();
  } catch (err) {
    logger.error(`MySQL connection failed: ${err.message}`, { stack: err.stack });
    process.exit(1);
  }
};

module.exports = { db, connectDB };
