import { repo } from '../data-access/repo.js';
import { COLLECTIONS } from '../config/constants.js';
import { env } from '../config/env.js';
import { AppError, asyncHandler, ok } from '../utils/response.js';

async function getCart(userId) {
  let cart = await repo.findOne(COLLECTIONS.CARTS, { userId, active: true });
  if (!cart) {
    cart = await repo.insertOne(COLLECTIONS.CARTS, { _id: `cart-${userId}`, userId, storeId: null, items: [], couponCode: null, active: true });
  }
  return cart;
}

const taxRate = 0.05;

function computeTotals(cart, coupon = null) {
  let subtotal = 0;
  for (const it of cart.items || []) subtotal += Number(it.price || 0) * Number(it.quantity || 0);

  let discount = 0;
  if (coupon) {
    if (coupon.type === 'flat') discount = Math.min(coupon.amount || 0, coupon.maxDiscount || coupon.amount || 0);
    else if (coupon.type === 'percentage') discount = Math.min(Math.round((subtotal * (coupon.percentage || 0)) / 100), coupon.maxDiscount || Number.MAX_SAFE_INTEGER);
    else if (coupon.type === 'free_delivery') discount = 0;
  }
  const deliveryFee = subtotal >= env.freeDeliveryThreshold || subtotal === 0 ? 0 : env.deliveryFee;
  const taxAmount = Math.round((subtotal - discount) * taxRate);
  const total = subtotal - discount + deliveryFee + taxAmount;
  return { subtotal, discount, deliveryFee, tax: taxRate, taxAmount, total, itemCount: (cart.items || []).reduce((n, i) => n + i.quantity, 0) };
}

export const getCartSummary = asyncHandler(async (req, res) => {
  const cart = await getCart(req.user._id);
  const coupon = cart.couponCode ? await repo.findOne(COLLECTIONS.COUPONS, { code: cart.couponCode }) : null;
  const totals = computeTotals(cart, coupon);
  return ok(res, { items: cart.items || [], coupon: coupon ? { code: coupon.code, name: coupon.code, discount: totals.discount } : null, ...totals }, { message: 'Cart fetched' });
});

export const addCartItem = asyncHandler(async (req, res) => {
  const { productId, variantId, quantity = 1, storeId } = req.body;
  const product = await repo.findById(COLLECTIONS.PRODUCTS, productId);
  if (!product || !product.active) throw new AppError('Product not found', { status: 404, code: 'NOT_FOUND' });

  const variant = variantId ? product.variants?.find((v) => v.id === variantId) : product.variants?.[0] || null;
  const price = variant?.price ?? product.sellingPrice;
  const mrp = variant?.mrp ?? product.mrp;
  const qty = Math.max(1, Number(quantity) || 1);

  const cart = await getCart(req.user._id);
  const items = [...(cart.items || [])];
  const existing = items.find((i) => i.productId === productId && (variantId == null || i.variantId === variantId));
  if (existing) {
    existing.quantity = Math.min(existing.quantity + qty, product.maxQty || 12);
  } else {
    if (qty > (product.maxQty || 12)) throw new AppError(`Maximum order quantity is ${product.maxQty || 12}`, { code: 'MAX_QTY' });
    items.push({
      productId,
      variantId: variant?.id || null,
      name: product.name,
      emoji: product.emoji || '📦',
      color: product.color || 'from-slate-100 to-slate-200',
      weight: variant?.weight ?? product.weight ?? '',
      unitSize: variant?.unitSize ?? '',
      price,
      mrp,
      quantity: qty,
      image: null,
    });
  }
  const next = await repo.updateById(COLLECTIONS.CARTS, cart._id, {
    $set: { items, storeId: storeId || cart.storeId || product.storeStock ? Object.keys(product.storeStock || {})[0] || null : null },
  });
  const totals = computeTotals(next);
  return ok(res, { items: next.items, ...totals }, { message: 'Item added to cart' });
});

export const updateCartItem = asyncHandler(async (req, res) => {
  const { quantity } = req.body;
  if (quantity == null || quantity < 0) throw new AppError('quantity is required and cannot be negative', { code: 'VALIDATION_ERROR' });
  const cart = await getCart(req.user._id);
  const items = [...(cart.items || [])];
  const idx = items.findIndex((i) => i.productId === req.params.productId);
  if (idx === -1) throw new AppError('Item not in cart', { status: 404, code: 'NOT_FOUND' });
  if (quantity === 0) items.splice(idx, 1);
  else items[idx] = { ...items[idx], quantity };
  const next = await repo.updateById(COLLECTIONS.CARTS, cart._id, { $set: { items } });
  const totals = computeTotals(next);
  return ok(res, { items: next.items, ...totals }, { message: 'Cart updated' });
});

export const removeCartItem = asyncHandler(async (req, res) => {
  const cart = await getCart(req.user._id);
  const items = (cart.items || []).filter((i) => i.productId !== req.params.productId);
  const next = await repo.updateById(COLLECTIONS.CARTS, cart._id, { $set: { items } });
  const totals = computeTotals(next);
  return ok(res, { items: next.items, ...totals }, { message: 'Item removed from cart' });
});

export const clearCart = asyncHandler(async (req, res) => {
  const cart = await getCart(req.user._id);
  const next = await repo.updateById(COLLECTIONS.CARTS, cart._id, { $set: { items: [], couponCode: null } });
  const totals = computeTotals(next);
  return ok(res, { items: [], ...totals }, { message: 'Cart cleared' });
});

export const applyCoupon = asyncHandler(async (req, res) => {
  const { code } = req.body;
  const coupon = await repo.findOne(COLLECTIONS.COUPONS, { code: String(code).toUpperCase() });
  if (!coupon || !coupon.active) throw new AppError('This coupon is no longer valid', { code: 'INVALID_COUPON' });
  if (coupon.endDate && new Date(coupon.endDate) < new Date()) throw new AppError('This coupon has expired', { code: 'COUPON_EXPIRED' });
  const user = await repo.findById(COLLECTIONS.USERS, req.user._id);
  const used = (user.coupons || []).filter((c) => c.toUpperCase() === coupon.code.toUpperCase()).length;
  if (used >= (coupon.perUserLimit || 1)) throw new AppError('You have already used this coupon', { code: 'COUPON_LIMIT' });

  const cart = await getCart(req.user._id);
  const totals = computeTotals(cart, coupon);
  if (coupon.minCartValue > totals.subtotal) throw new AppError(`Add items worth ₹${coupon.minCartValue} to use this coupon`, { code: 'MIN_CART_NOT_MET' });

  const next = await repo.updateById(COLLECTIONS.CARTS, cart._id, { $set: { couponCode: coupon.code } });
  const t = computeTotals(next, coupon);
  return ok(res, { ...t, coupon: { code: coupon.code, discount: t.discount } }, { message: 'Coupon applied' });
});

const cartController = { getCartSummary, addCartItem, updateCartItem, removeCartItem, clearCart, applyCoupon };
export default cartController;