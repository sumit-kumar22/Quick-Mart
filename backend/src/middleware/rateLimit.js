import rateLimit from 'express-rate-limit';
import { AppError } from '../utils/response.js';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (req, res) =>
    res.status(429).json({ success: false, message: 'Too many attempts. Please try again later.', code: 'RATE_LIMITED' }),
});

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 600,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (req, res) =>
    res.status(429).json({ success: false, message: 'Too many requests. Please slow down.', code: 'RATE_LIMITED' }),
});

export const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (req, res) =>
    res.status(429).json({ success: false, message: 'Too many OTP attempts. Please try again later.', code: 'RATE_LIMITED' }),
});

export default { authLimiter, apiLimiter, otpLimiter, rateLimitErr: AppError };