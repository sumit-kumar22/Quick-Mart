import { repo } from '../data-access/repo.js';
import { COLLECTIONS } from '../config/constants.js';
import { AppError, asyncHandler, ok } from '../utils/response.js';
import { id } from '../utils/ids.js';

export const getProfile = asyncHandler(async (req, res) => {
  const user = await repo.findById(COLLECTIONS.USERS, req.user._id);
  if (!user) throw new AppError('User not found', { status: 404, code: 'NOT_FOUND' });
  const { passwordHash, ...safe } = user;
  return ok(res, safe, { message: 'Profile fetched successfully' });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const allowed = ['name', 'phone', 'avatar', 'notificationPrefs'];
  const patch = {};
  for (const k of allowed) if (req.body[k] !== undefined) patch[k] = req.body[k];
  const user = await repo.updateById(COLLECTIONS.USERS, req.user._id, { $set: patch });
  const { passwordHash, ...safe } = user;
  return ok(res, safe, { message: 'Profile updated successfully' });
});

export const getAddresses = asyncHandler(async (req, res) => {
  const user = await repo.findById(COLLECTIONS.USERS, req.user._id, { projection: { addresses: 1 } });
  return ok(res, user?.addresses || [], { message: 'Addresses fetched' });
});

export const addAddress = asyncHandler(async (req, res) => {
  const { line1, city, ...rest } = req.body;
  if (!line1 || !city) throw new AppError('line1 and city are required', { code: 'VALIDATION_ERROR' });
  const user = await repo.findById(COLLECTIONS.USERS, req.user._id);
  const addresses = user.addresses || [];
  const newAddr = { id: id('ad'), line1, city, ...rest, isDefault: addresses.length === 0 ? true : !!rest.isDefault };
  if (newAddr.isDefault) addresses.forEach((a) => { a.isDefault = false; });
  addresses.push(newAddr);
  await repo.updateById(COLLECTIONS.USERS, req.user._id, { $set: { addresses } });
  return ok(res, newAddr, { message: 'Address added successfully', status: 201 });
});

export const updateAddress = asyncHandler(async (req, res) => {
  const user = await repo.findById(COLLECTIONS.USERS, req.user._id);
  const idx = (user.addresses || []).findIndex((a) => a.id === req.params.addressId);
  if (idx === -1) throw new AppError('Address not found', { status: 404, code: 'NOT_FOUND' });
  const addresses = [...user.addresses];
  addresses[idx] = { ...addresses[idx], ...req.body, _id: undefined, id: addresses[idx].id };
  if (req.body.isDefault) addresses.forEach((a) => { a.isDefault = false; });
  if (req.body.isDefault) addresses[idx].isDefault = true;
  await repo.updateById(COLLECTIONS.USERS, req.user._id, { $set: { addresses } });
  return ok(res, addresses[idx], { message: 'Address updated successfully' });
});

export const deleteAddress = asyncHandler(async (req, res) => {
  const user = await repo.findById(COLLECTIONS.USERS, req.user._id);
  const addresses = (user.addresses || []).filter((a) => a.id !== req.params.addressId);
  if (addresses.length === user.addresses?.length) throw new AppError('Address not found', { status: 404, code: 'NOT_FOUND' });
  await repo.updateById(COLLECTIONS.USERS, req.user._id, { $set: { addresses } });
  return ok(res, { deleted: true }, { message: 'Address deleted successfully' });
});

export const getWishlist = asyncHandler(async (req, res) => {
  const user = await repo.findById(COLLECTIONS.USERS, req.user._id);
  const ids = user?.wishlist || [];
  const items = [];
  for (const pid of ids) {
    const p = await repo.findById(COLLECTIONS.PRODUCTS, pid);
    if (p) items.push(p);
  }
  return ok(res, items, { message: 'Wishlist fetched' });
});

export const toggleWishlist = asyncHandler(async (req, res) => {
  const productId = req.params.productId;
  const product = await repo.findById(COLLECTIONS.PRODUCTS, productId);
  if (!product) throw new AppError('Product not found', { status: 404, code: 'NOT_FOUND' });
  const user = await repo.findById(COLLECTIONS.USERS, req.user._id);
  const wishlist = user.wishlist || [];
  const has = wishlist.includes(productId);
  const next = has ? wishlist.filter((x) => x !== productId) : [...wishlist, productId];
  await repo.updateById(COLLECTIONS.USERS, req.user._id, { $set: { wishlist: next } });
  return ok(res, { wishlist: next, inWishlist: !has }, { message: has ? 'Removed from wishlist' : 'Added to wishlist' });
});

export const getNotifications = asyncHandler(async (req, res) => {
  const notifs = await repo.findMany(
    COLLECTIONS.NOTIFICATIONS,
    { $or: [{ userId: req.user._id }, { userId: null }] },
    { sort: { createdAt: -1 }, limit: 50 }
  );
  return ok(res, notifs, { message: 'Notifications fetched' });
});

export const markNotificationsRead = asyncHandler(async (req, res) => {
  const notifs = await repo.findMany(COLLECTIONS.NOTIFICATIONS, { userId: req.user._id });
  for (const n of notifs) await repo.updateById(COLLECTIONS.NOTIFICATIONS, n._id, { $set: { read: true } });
  return ok(res, { updated: notifs.length }, { message: 'Notifications marked as read' });
});

export const getMyOrders = asyncHandler(async (req, res) => {
  const orders2 = await repo.findMany(COLLECTIONS.ORDERS, { userId: req.user._id }, { sort: { createdAt: -1 } });
  return ok(res, orders2, { message: 'Orders fetched' });
});

const userController = {
  getProfile, updateProfile, getAddresses, addAddress, updateAddress, deleteAddress,
  getWishlist, toggleWishlist, getNotifications, markNotificationsRead, getMyOrders,
};
export default userController;