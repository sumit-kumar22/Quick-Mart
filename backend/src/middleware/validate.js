import { validationResult } from 'express-validator';
import { AppError } from '../utils/response.js';

export function validate(req, _res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const first = errors.array({ onlyFirstError: true })[0];
    return next(
      new AppError(first?.msg || 'Validation failed', {
        status: 422,
        code: 'VALIDATION_ERROR',
        errors: errors.array(),
      })
    );
  }
  return next();
}

export const isEmail = (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
export const isPhone = (v) => !v || /^[+]?[\d\s-]{10,15}$/.test(String(v).trim());
export const isPincode = (v) => !v || /^\d{6}$/.test(String(v).trim());

export default validate;