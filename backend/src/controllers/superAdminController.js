import bcrypt from 'bcryptjs';
import { repo } from '../data-access/repo.js';
import { COLLECTIONS } from '../config/constants.js';
import { AppError, asyncHandler, ok, parsePagination } from '../utils/response.js';
import { id } from '../utils/ids.js';
import audit from '../middleware/audit.js';

export const getAuditLogs = asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const [rows, total] = await Promise.all([
    repo.findMany(COLLECTIONS.AUDIT_LOGS, {}, { sort: { createdAt: -1 }, skip: (page - 1) * limit, limit }),
    repo.count(COLLECTIONS.AUDIT_LOGS, {}),
  ]);
  return ok(res, rows, { message: 'Audit logs fetched', meta: { page, limit, total } });
});

export const getAdmins = asyncHandler(async (_req, res) => {
  const admins = await repo.findMany(COLLECTIONS.USERS, { role: { $in: ['ADMIN', 'SUPER_ADMIN'] } }, { sort: { createdAt: 1 } });
  return ok(res, admins, { message: 'Admins fetched' });
});

export const createAdmin = asyncHandler(async (req, res) => {
  const { name, email, phone, password, storeId } = req.body;
  if (!name || !email || !password) throw new AppError('name, email and password are required', { code: 'VALIDATION_ERROR' });
  if (await repo.findOne(COLLECTIONS.USERS, { email: String(email).toLowerCase() })) throw new AppError('Email already in use', { status: 409, code: 'DUPLICATE_KEY' });
  const admin = await repo.insertOne(COLLECTIONS.USERS, {
    _id: id('u'),
    name,
    email: String(email).toLowerCase(),
    phone: phone || '',
    role: 'ADMIN',
    roles: ['ADMIN'],
    permissions: ['dashboard', 'orders', 'products', 'categories', 'inventory', 'users', 'delivery', 'stores', 'offers', 'reports', 'settings', 'reviews'],
    status: 'active',
    passwordHash: bcrypt.hashSync(password, 10),
    avatar: null,
    addresses: [],
    wishlist: [],
    coupons: [],
  });
  if (storeId) await repo.updateById(COLLECTIONS.STORES, storeId, { $set: { adminId: admin._id } });
  await audit(req, { action: 'ADMIN_CREATED', entity: 'users', entityId: admin._id, details: { name, email } });
  return ok(res, admin, { message: 'Admin created', status: 201 });
});

export const updateAdmin = asyncHandler(async (req, res) => {
  const { name, phone, status, storeId, password } = req.body;
  const patch = {};
  if (name) patch.name = name;
  if (phone) patch.phone = phone;
  if (status) patch.status = status;
  if (password) patch.passwordHash = bcrypt.hashSync(password, 10);
  const admin = await repo.updateById(COLLECTIONS.USERS, req.params.id, { $set: patch });
  if (!admin) throw new AppError('Admin not found', { status: 404, code: 'NOT_FOUND' });
  if (storeId) await repo.updateById(COLLECTIONS.STORES, storeId, { $set: { adminId: admin._id } });
  return ok(res, admin, { message: 'Admin updated' });
});

export const deleteAdmin = asyncHandler(async (req, res) => {
  const admin = await repo.findById(COLLECTIONS.USERS, req.params.id);
  if (!admin || admin.role === 'SUPER_ADMIN') throw new AppError('Cannot delete this admin', { status: 404, code: 'NOT_FOUND' });
  await repo.deleteById(COLLECTIONS.USERS, admin._id);
  await audit(req, { action: 'ADMIN_DELETED', entity: 'users', entityId: admin._id });
  return ok(res, { deleted: true }, { message: 'Admin deleted' });
});

export const platformStats = asyncHandler(async (_req, res) => {
  const [stores, users, orders, products, revenueOrders] = await Promise.all([
    repo.count(COLLECTIONS.STORES, {}),
    repo.count(COLLECTIONS.USERS, { role: 'CUSTOMER' }),
    repo.count(COLLECTIONS.ORDERS, {}),
    repo.count(COLLECTIONS.PRODUCTS, {}),
    repo.findMany(COLLECTIONS.ORDERS, {}),
  ]);
  const gross = revenueOrders.reduce((s, o) => s + (['DELIVERED', 'OUT_FOR_DELIVERY', 'ARRIVING', 'CONFIRMED', 'PREPARING'].includes(o.status) ? o.total : 0), 0);
  return ok(res, { stores, customers: users, orders, products, grossRevenue: Math.round(gross) }, { message: 'Platform stats fetched' });
});

export const getSecuritySettings = asyncHandler(async (req, res) => {
  const settings = await repo.findOne(COLLECTIONS.SETTINGS, {});
  return ok(res, settings?.security || { twoFactor: true, sessionTimeout: 30 }, { message: 'Security settings fetched' });
});

export const updateSecuritySettings = asyncHandler(async (req, res) => {
  const settings = await repo.findOne(COLLECTIONS.SETTINGS, {});
  const patch = { security: { ...(settings?.security || {}), ...req.body } };
  const updated = settings
    ? await repo.updateById(COLLECTIONS.SETTINGS, settings._id, { $set: patch })
    : await repo.insertOne(COLLECTIONS.SETTINGS, { _id: 'settings-singleton', ...patch });
  await audit(req, { action: 'SECURITY_UPDATED', entity: 'settings', entityId: 'settings-singleton' });
  return ok(res, updated, { message: 'Security settings updated' });
});

export const getAllUsersSuper = asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  const [rows, total] = await Promise.all([
    repo.findMany(COLLECTIONS.USERS, filter, { sort: { createdAt: -1 }, skip: (page - 1) * limit, limit }),
    repo.count(COLLECTIONS.USERS, filter),
  ]);
  return ok(res, rows, { message: 'Users fetched', meta: { page, limit, total } });
});

const superAdminController = {
  getAuditLogs, getAdmins, createAdmin, updateAdmin, deleteAdmin,
  platformStats, getSecuritySettings, updateSecuritySettings, getAllUsersSuper,
};
export default superAdminController;