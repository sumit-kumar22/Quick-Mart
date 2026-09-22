import { AppError } from '../utils/response.js';
import { env } from '../config/env.js';

export function notFound(req, _res, next) {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, { status: 404, code: 'NOT_FOUND' }));
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  let status = err.status || 500;
  let code = err.code || 'SERVER_ERROR';
  let message = err.message || 'Something went wrong';
  let errors = err.errors || null;
  let details = err.details || null;

  if (err.name === 'ValidationError') { status = 422; code = 'VALIDATION_ERROR'; message = 'Validation failed'; errors = Object.values(err.errors || {}).map((e) => e.message); }
  if (err.code === 11000) { status = 409; code = 'DUPLICATE_KEY'; message = 'A record with this identifier already exists'; }
  if (err && err.type === 'entity.parse.failed') { status = 400; code = 'BAD_JSON'; message = 'Invalid JSON in request body'; }

  if (status >= 500) {
    console.error(`[error] ${req.method} ${req.originalUrl}`, err);
    if (env.isProd) message = 'Something went wrong'; // never leak internals in production
  }

  const body = { success: false, message, code };
  if (errors) body.errors = errors;
  if (details) body.details = details;
  return res.status(status).json(body);
}

export default errorHandler;