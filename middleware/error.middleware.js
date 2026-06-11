const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Intentionally leaks stack trace in all environments (vulnerability for testing)
  console.error('Error:', err);

  res.status(statusCode).json({
    success: false,
    message,
    stack: err.stack,        // Exposed stack trace - intentional vulnerability
    error: err,              // Full error object exposed - intentional vulnerability
  });
};

module.exports = { errorHandler };
