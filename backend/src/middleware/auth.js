import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { repo } from '../data-access/repo.js';
import { COLLECTIONS } from '../config/constants.js';
import { AppError } from '../utils/response.js';

export function signTokens(user) {
  const token = jwt.sign({ sub: user._id, role: user.role }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
  const refreshToken = jwt.sign({ sub: user._id, role: user.role, type: 'refresh' }, env.jwtRefreshSecret, { expiresIn: env.jwtRefreshExpiresIn });
  return { token, refreshToken };
}

export async function loadUser(req) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return null;
  try {
    const payload = jwt.verify(token, env.jwtSecret);
    const user = await repo.findById(COLLECTIONS.USERS, payload.sub);
    if (!user || user.status !== 'active') return null;
    return user;
  } catch {
    return null;
  }
}

export function auth(req, _res, next) {
  loadUser(req)
    .then((user) => {
      if (!user) throw new AppError('Authentication required', { status: 401, code: 'UNAUTHORIZED' });
      req.user = user;
      next();
    })
    .catch(next);
}

export function optionalAuth(req, _res, next) {
  loadUser(req)
    .then((user) => {
      req.user = user || null;
      next();
    })
    .catch(() => {
      req.user = null;
      next();
    });
}

export const requireRole = (...roles) => (req, _res, next) => {
  if (!req.user) return next(new AppError('Authentication required', { status: 401, code: 'UNAUTHORIZED' }));
  const allowed = roles.some((r) => req.user.role === r || (req.user.roles || []).includes(r));
  if (!allowed) return next(new AppError('You do not have permission to perform this action', { status: 403, code: 'FORBIDDEN' }));
  return next();
};

export const requireAdmin = requireRole('ADMIN', 'SUPER_ADMIN');

export { requireAdmin as requirePermission };

export default { auth, optionalAuth, requireRole, requireAdmin, signTokens, loadUser };