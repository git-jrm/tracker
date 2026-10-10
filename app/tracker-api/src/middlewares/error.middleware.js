export const globalErrorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const mensaje = err.statusCode ? err.message : 'Internal error. Please try again later.';

  if (statusCode >= 500) {
    console.error(`❌ [Internal Error]: ${err.message}`);
    console.error(err.stack);
  }

  res.status(statusCode).json({
    OK: false,
    message: mensaje
  });
};
