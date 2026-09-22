import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { repo } from '../data-access/repo.js';
import { COLLECTIONS } from '../config/constants.js';
import { env } from '../config/env.js';
import { AppError, asyncHandler, ok } from '../utils/response.js';
import { signTokens } from '../middleware/auth.js';
import { id, otpCode } from '../utils/ids.js';
import { email } from '../services/email.js';
import { cache } from '../services/cache.js';

const otpKey = (email, purpose) => `otp:${purpose}:${String(email).toLowerCase()}`;

function publicUser(u) {
  const { passwordHash, roles, permissions, ...safe } = u;
  return safe;
}

export const register = asyncHandler(async (req, res) => {
  const { name, email: rawEmail, phone, password } = req.body;
  if (!name || !password || password.length < 6) {
    throw new AppError('Name and a password of at least 6 characters are required', { code: 'VALIDATION_ERROR' });
  }
  const email = String(rawEmail || '').toLowerCase().trim();
  const exists = await repo.findOne(COLLECTIONS.USERS, { $or: [{ email }, ...(phone ? [{ phone }] : [])] });
  if (exists) throw new AppError('An account with this email or phone already exists', { status: 409, code: 'DUPLICATE_KEY' });

  const addr = req.body.address && (req.body.address.line1 || req.body.address.address)
    ? { id: 'ad-home', line1: req.body.address.address || req.body.address.line1, city: req.body.address.city || '', state: req.body.address.state || '', pincode: String(req.body.address.pincode || ''), phone: req.body.address.phone || phone || '', isDefault: true }
    : null;

  const user = await repo.insertOne(COLLECTIONS.USERS, {
    _id: id('u'),
    name,
    email,
    phone: phone || '',
    role: 'CUSTOMER',
    roles: ['CUSTOMER'],
    permissions: [],
    status: 'active',
    passwordHash: bcrypt.hashSync(password, 10),
    avatar: null,
    addresses: addr ? [addr] : [],
    wishlist: [],
    coupons: [],
  });
  const tokens = signTokens(user);
  await cache.del('users:list');
  return ok(res, { ...tokens, user: publicUser(user) }, { message: 'Account created successfully', status: 201 });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password, phone } = req.body;
  const user = email
    ? await repo.findOne(COLLECTIONS.USERS, { email: String(email).toLowerCase().trim() })
    : phone
      ? await repo.findOne(COLLECTIONS.USERS, { phone })
      : null;
  if (!user || !user.passwordHash) throw new AppError('Invalid email or password', { status: 401, code: 'INVALID_CREDENTIALS' });
  const valid = bcrypt.compareSync(String(password || ''), user.passwordHash);
  if (!valid) throw new AppError('Invalid email or password', { status: 401, code: 'INVALID_CREDENTIALS' });
  if (user.status !== 'active') throw new AppError('Your account has been suspended. Contact support.', { status: 403, code: 'ACCOUNT_SUSPENDED' });

  const tokens = signTokens(user);
  return ok(res, { ...tokens, user: publicUser(user) }, { message: 'Logged in successfully' });
});

export const logout = asyncHandler(async (_req, res) => ok(res, { loggedOut: true }, { message: 'Logged out successfully' }));

export const googleSignIn = asyncHandler(async (req, res) => {
  const { credential } = req.body;
  if (!credential) throw new AppError('Google credential is required', { status: 400, code: 'VALIDATION_ERROR' });

  const tokenRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
  const payload = await tokenRes.json();
  if (!tokenRes.ok || !payload || payload.error || !payload.email) {
    throw new AppError('Google token could not be verified', { status: 401, code: 'INVALID_GOOGLE_TOKEN' });
  }
  if (env.googleClientId && payload.aud && payload.aud !== env.googleClientId) {
    throw new AppError('Google token was issued for a different application', { status: 401, code: 'INVALID_GOOGLE_TOKEN' });
  }

  const email = String(payload.email).toLowerCase().trim();
  let user = await repo.findOne(COLLECTIONS.USERS, { email });
  if (!user) {
    const newUser = {
      _id: id('u'),
      name: payload.name || email.split('@')[0] || 'Google User',
      email,
      phone: payload.phone_number || '',
      role: 'CUSTOMER',
      roles: ['CUSTOMER'],
      permissions: [],
      status: 'active',
      passwordHash: bcrypt.hashSync(`google-oauth-${Math.random().toString(36).slice(2)}`, 10),
      avatar: payload.picture || null,
      googleId: payload.sub || null,
      addresses: [],
      wishlist: [],
      coupons: [],
    };
    user = await repo.insertOne(COLLECTIONS.USERS, newUser);
  } else {
    if (user.status !== 'active') {
      throw new AppError('Your account has been suspended. Contact support.', { status: 403, code: 'ACCOUNT_SUSPENDED' });
    }
    const patch = {};
    if (!user.name && payload.name) patch.name = payload.name;
    if (!user.avatar && payload.picture) patch.avatar = payload.picture;
    if (!user.googleId && payload.sub) patch.googleId = payload.sub;
    if (Object.keys(patch).length) {
      user = await repo.updateById(COLLECTIONS.USERS, user._id, { $set: patch });
    }
  }

  await cache.del('users:list');
  const tokens = signTokens(user);
  return ok(res, { ...tokens, user: publicUser(user) }, { message: 'Signed in with Google' });
});

export const refresh = asyncHandler(async (req, res) => {
  if (!refreshToken) throw new AppError('Refresh token is required', { status: 401, code: 'UNAUTHORIZED' });
  let payload;
  try {
    payload = jwt.verify(refreshToken, env.jwtRefreshSecret);
  } catch {
    throw new AppError('Refresh token expired or invalid', { status: 401, code: 'UNAUTHORIZED' });
  }
  const user = await repo.findById(COLLECTIONS.USERS, payload.sub);
  if (!user || user.status !== 'active') throw new AppError('Account not found or inactive', { status: 401, code: 'UNAUTHORIZED' });
  const tokens = signTokens(user);
  return ok(res, { ...tokens, user: publicUser(user) }, { message: 'Token refreshed' });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const email = String(req.body.email || '').toLowerCase().trim();
  const user = await repo.findOne(COLLECTIONS.USERS, { email });
  if (!user) throw new AppError('No account found with this email', { status: 404, code: 'NOT_FOUND' });
  const code = otpCode();
  const key = otpKey(email, 'reset');
  await cache.set(key, code, 600);
  await email.sendOtp(email, code, 'password reset');
  return ok(res, { sent: true, email }, { message: 'Reset code sent to your email' });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { email: rawEmail, code, newPassword } = req.body;
  const email = String(rawEmail || '').toLowerCase().trim();
  if (!newPassword || newPassword.length < 6) throw new AppError('Password must be at least 6 characters', { code: 'VALIDATION_ERROR' });
  const key = otpKey(email, 'reset');
  const stored = await cache.get(key);
  if (!stored || String(stored) !== String(code)) throw new AppError('Invalid or expired reset code', { status: 400, code: 'INVALID_OTP' });
  const user = await repo.findOne(COLLECTIONS.USERS, { email });
  if (!user) throw new AppError('No account found with this email', { status: 404, code: 'NOT_FOUND' });
  await repo.updateById(COLLECTIONS.USERS, user._id, {
    $set: { passwordHash: bcrypt.hashSync(newPassword, 10) },
  });
  await cache.del(key);
  return ok(res, { reset: true }, { message: 'Password updated successfully' });
});

export const verifyOtp = asyncHandler(async (req, res) => {
  const { email, code, phone, purpose = 'verification' } = req.body;
  const key = email ? otpKey(email, purpose) : phone ? otpKey(phone, purpose) : null;
  if (!key) throw new AppError('email or phone is required', { code: 'VALIDATION_ERROR' });
  const stored = await cache.get(key);
  if (String(stored) === String(code)) {
    await cache.del(key);
    return ok(res, { verified: true }, { message: 'OTP verified' });
  }
  throw new AppError('Invalid or expired OTP', { status: 400, code: 'INVALID_OTP' });
});

const authController = { register, login, googleSignIn, logout, refresh, forgotPassword, resetPassword, verifyOtp };
export default authController;