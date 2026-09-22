import { repo } from '../data-access/repo.js';
import { COLLECTIONS } from '../config/constants.js';
import { AppError, asyncHandler, ok, pickPatch } from '../utils/response.js';
import { id } from '../utils/ids.js';
import audit from '../middleware/audit.js';

export const getCoupons = asyncHandler(async (_req, res) => {
  const coupons = await repo.findMany(COLLECTIONS.COUPONS, { active: true }, { sort: { code: 1 } });
  return ok(res, coupons, { message: 'Coupons fetched' });
});

export const validateCoupon = asyncHandler(async (req, res) => {
  const { code, amount } = req.body;
  const coupon = await repo.findOne(COLLECTIONS.COUPONS, { code: String(code || '').toUpperCase() });
  if (!coupon || !coupon.active) throw new AppError('This coupon is no longer valid', { code: 'INVALID_COUPON' });
  if (coupon.endDate && new Date(coupon.endDate) < new Date()) throw new AppError('This coupon has expired', { code: 'COUPON_EXPIRED' });
  if (coupon.startDate && new Date(coupon.startDate) > new Date()) throw new AppError('This coupon has expired', { code: 'COUPON_EXPIRED' });
  if (coupon.minCartValue > Number(amount || 0)) throw new AppError(`Add ${Number(amount || 0) - coupon.minCartValue >= 0 ? 'more' : ''} items worth ₹${coupon.minCartValue} to use this coupon`, { code: 'MIN_CART_NOT_MET' });
  if (coupon.usageLimit && coupon.usageLimit > 0 && (coupon.usedCount || 0) >= coupon.usageLimit) throw new AppError('This coupon has reached its usage limit', { code: 'COUPON_LIMIT' });
  return ok(res, coupon, { message: 'Coupon applied' });
});

export const createCoupon = asyncHandler(async (req, res) => {
  const exists = await repo.findOne(COLLECTIONS.COUPONS, { code: String(req.body.code || '').toUpperCase() });
  if (exists) throw new AppError('Coupon code already exists', { status: 409, code: 'DUPLICATE_KEY' });
  const coupon = await repo.insertOne(COLLECTIONS.COUPONS, { _id: id('cp'), ...req.body, code: String(req.body.code || '').toUpperCase() });
  await audit(req, { action: 'COUPON_CREATED', entity: 'coupons', entityId: coupon._id });
  return ok(res, coupon, { message: 'Coupon created', status: 201 });
});

export const updateCoupon = asyncHandler(async (req, res) => {
  const patch = pickPatch(['code', 'type', 'value', 'maxDiscount', 'minCartValue', 'perUserLimit', 'usageLimit', 'description', 'active', 'startDate', 'endDate'], req.body);
  if (patch.code) patch.code = String(patch.code).toUpperCase();
  const coupon = await repo.updateById(COLLECTIONS.COUPONS, req.params.id, { $set: patch });
  if (!coupon) throw new AppError('Coupon not found', { status: 404, code: 'NOT_FOUND' });
  await audit(req, { action: 'COUPON_UPDATED', entity: 'coupons', entityId: coupon._id });
  return ok(res, coupon, { message: 'Coupon updated' });
});

export const deleteCoupon = asyncHandler(async (req, res) => {
  const res2 = await repo.deleteById(COLLECTIONS.COUPONS, req.params.id);
  if (!res2.deletedCount) throw new AppError('Coupon not found', { status: 404, code: 'NOT_FOUND' });
  await audit(req, { action: 'COUPON_DELETED', entity: 'coupons', entityId: req.params.id });
  return ok(res, { deleted: true }, { message: 'Coupon deleted' });
});

const couponController = { getCoupons, validateCoupon, createCoupon, updateCoupon, deleteCoupon };
export default couponController;