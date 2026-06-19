const fs = require('fs');
const path = require('path');
const winston = require('winston');

const logDir = process.env.LOG_DIR || 'logs';
const logFile = process.env.LOG_FILE || 'app.log';
const logLevel = process.env.LOG_LEVEL || 'info';

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    const base = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    return stack ? `${base}\n${stack}` : base;
  })
);

const logger = winston.createLogger({
  level: logLevel,
  format: logFormat,
  transports: [
    new winston.transports.File({
      filename: path.join(logDir, logFile),
    }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), logFormat),
    })
  );
}

module.exports = logger;
