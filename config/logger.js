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
  winston.format.splat(),
  winston.format.printf((info) => {
    const { timestamp, level, message, stack, statusCode, path, method, ...rest } = info;
    const meta = { statusCode, path, method };
    const metaStr = Object.values(meta).some((v) => v !== undefined)
      ? ` | ${JSON.stringify(meta)}`
      : '';
    const base = `[${timestamp}] ${level.toUpperCase()}: ${message}${metaStr}`;
    const stackTrace = stack || rest.stack;
    return stackTrace ? `${base}\n${stackTrace}` : base;
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
