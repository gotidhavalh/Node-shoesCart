const logger = require('../config/logger');

const responseLogger = (req, res, next) => {
  const originalJson = res.json.bind(res);

  res.json = (body) => {
    if (res.statusCode >= 400) {
      const message = (body && body.message) || 'Request failed';
      const logMeta = {
        statusCode: res.statusCode,
        method: req.method,
        path: req.originalUrl,
      };

      if (body && body.stack) {
        logMeta.stack = body.stack;
      }

      logger.error(message, logMeta);
    }

    return originalJson(body);
  };

  next();
};

module.exports = { responseLogger };
