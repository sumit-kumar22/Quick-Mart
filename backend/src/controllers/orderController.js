import { repo } from '../data-access/repo.js';
import { COLLECTIONS, ORDER_STATUS, PAYMENT_METHOD_ALIASES, STATUS_TRANSITIONS, CANCELLABLE_STATUSES, STATUS_TO_EVENT } from '../config/constants.js';
import { env } from '../config/env.js';
import { AppError, asyncHandler, ok } from '../utils/response.js';
import { orderId, otpCode, id } from '../utils/ids.js';
import { findEligibleStore, estimateEta } from '../services/maps.js';
import { createPaymentRequest, refundPayment } from '../services/payments.js';
import { validateStock, reserveItems, releaseItems } from '../services/stock.js';
import { emitAll, emitUser } from '../sockets/index.js';

const taxRate = 0.05;

async function getStore(storeId) {
  const store = await repo.findById(COLLECTIONS.STORES, storeId);
  if (!store || store.status !== 'active') throw new AppError('No store available for delivery right now', { status: 404, code: 'STORE_UNAVAILABLE' });
  return store;
}

const MAX_ORDER_QTY = 99;

function normalizeItems(items) {
  if (!Array.isArray(items) || items.length === 0) throw new AppError('Cart is empty', { code: 'EMPTY_CART' });
  return items.map((it) => {
    if (!it || typeof it.productId !== 'string' || it.productId.length < 3 || /[${}\s]/.test(it.productId)) {
      throw new AppError('Invalid product reference in cart', { code: 'VALIDATION_ERROR' });
    }
    const quantity = Math.floor(Number(it.quantity));
    if (!Number.isFinite(quantity) || quantity < 1 || quantity > MAX_ORDER_QTY) {
      throw new AppError(`Quantity must be a whole number between 1 and ${MAX_ORDER_QTY}`, { code: 'VALIDATION_ERROR' });
    }
    return {
      productId: it.productId,
      name: it.name || 'Item',
      emoji: it.emoji || '📦',
      color: it.color || 'from-slate-100 to-slate-200',
      variantId: it.variantId || null,
      weight: it.weight || '',
      unitSize: it.unitSize || '',
      price: Number(it.price || 0),
      mrp: Number(it.mrp || it.price || 0),
      quantity,
      image: it.image || null,
    };
  });
}

async function computePricing(items, couponCode) {
  let subtotal = 0;
  for (const it of items) subtotal += it.price * it.quantity;
  let discount = 0;
  let coupon = null;
  if (couponCode) {
    coupon = await repo.findOne(COLLECTIONS.COUPONS, { code: String(couponCode).toUpperCase() });
    if (!coupon || !coupon.active) throw new AppError('This coupon is no longer valid', { code: 'INVALID_COUPON' });
    if (coupon.endDate && new Date(coupon.endDate) < new Date()) throw new AppError('This coupon has expired', { code: 'COUPON_EXPIRED' });
    if (coupon.minCartValue > subtotal) throw new AppError(`Add items worth ₹${coupon.minCartValue} to use this coupon`, { code: 'MIN_CART_NOT_MET' });
    if ((coupon.applicableCategories?.length || coupon.applicableProducts?.length)) {
      const qualifies = items.some((it) => (coupon.applicableCategories || []).includes(it.category) || (coupon.applicableProducts || []).includes(it.productId));
      if (!qualifies) throw new AppError('This coupon is not applicable to the items in your cart', { code: 'COUPON_NOT_APPLICABLE' });
    }
    if (coupon.type === 'flat') discount = Math.min(coupon.amount || 0, coupon.maxDiscount ?? coupon.amount ?? 0);
    else if (coupon.type === 'percentage') discount = Math.min(Math.round((subtotal * (coupon.percentage || 0)) / 100), coupon.maxDiscount ?? Number.MAX_SAFE_INTEGER);
    else if (coupon.type === 'free_delivery') discount = 0;
  }
  const deliveryFee = subtotal >= env.freeDeliveryThreshold ? 0 : env.deliveryFee;
  const taxAmount = Math.round((subtotal - discount) * taxRate);
  const total = Math.max(0, subtotal - discount + deliveryFee + taxAmount);
  return { subtotal, discount, coupon, deliveryFee, taxAmount, total };
}

async function validateCouponUser(user, coupon) {
  if (!coupon) return;
  if (coupon.usageLimit && coupon.usageLimit > 0 && (coupon.usedCount || 0) >= coupon.usageLimit) {
    throw new AppError('This coupon has reached its usage limit', { code: 'COUPON_LIMIT' });
  }
  const used = (user.coupons || []).filter((c) => c.toUpperCase() === coupon.code.toUpperCase()).length;
  if (used >= (coupon.perUserLimit || 1)) throw new AppError('You have already used this coupon', { code: 'COUPON_LIMIT' });
}

export const placeOrder = asyncHandler(async (req, res) => {
  const user = req.user;
  const { items: rawItems, address, addressId, paymentMethod: rawPaymentMethod = 'COD', slotId = null } = req.body;
  const paymentMethod = PAYMENT_METHOD_ALIASES[String(rawPaymentMethod || 'COD').toUpperCase()] || String(rawPaymentMethod || 'COD').toUpperCase();
  const couponCode = req.body.couponCode ?? req.body.coupon ?? null;
  const storeOverride = req.body.storeId ?? null;
  const items = normalizeItems(rawItems);

  // 2. validate address
  const account = req.user.role !== 'CUSTOMER' ? user : await repo.findById(COLLECTIONS.USERS, user._id);
  let shipAddress = address;
  if (!shipAddress || !shipAddress.line1) {
    const match = addressId ? (account.addresses || []).find((a) => a.id === addressId) : null;
    shipAddress = match || (account.addresses || []).find((a) => a.isDefault) || account.addresses?.[0] || account.address || null;
    if (!shipAddress) throw new AppError('Please add a delivery address', { code: 'ADDRESS_REQUIRED' });
  }

  // 3. identify eligible store
  let store;
  if (storeOverride) store = await getStore(storeOverride);
  else {
    const stores = await repo.findMany(COLLECTIONS.STORES, { status: 'active' });
    store = await findEligibleStore({ stores, latitude: shipAddress.latitude, longitude: shipAddress.longitude });
    if (!store) throw new AppError('No store available for delivery right now', { status: 404, code: 'STORE_UNAVAILABLE' });
  }
  const eta = await estimateEta(store, shipAddress);

  // 4-5. current prices + stock
  const priced = [];
  for (const it of items) {
    const p = await repo.findById(COLLECTIONS.PRODUCTS, it.productId);
    if (!p) throw new AppError(`Product not found: ${it.name}`, { status: 404, code: 'ITEM_UNAVAILABLE' });
    const variant = it.variantId ? p.variants?.find((v) => v.id === it.variantId) : p.variants?.[0];
    const price = variant?.price ?? p.sellingPrice;
    priced.push({ ...it, price, mrp: variant?.mrp ?? p.mrp, name: p.name, emoji: p.emoji || it.emoji, color: p.color || it.color, weight: variant?.weight ?? p.weight ?? it.weight, unitSize: variant?.unitSize ?? '', category: p.category || '' });
  }
  await validateStock(store._id, priced);

  // 6-10. pricing + coupon validation
  const pricing = await computePricing(priced, couponCode);
  await validateCouponUser(user, pricing.coupon);

  // 11. payment request (online methods only)
  let payment = { method: paymentMethod, status: 'pending', provider: 'mock', gatewayOrderId: null, gatewayPaymentId: null, signature: null };
  if (paymentMethod !== 'COD') {
    const request = await createPaymentRequest({
      amount: pricing.total,
      method: paymentMethod.toUpperCase(),
      metadata: { receipt: `ord_${Date.now()}`, userId: user._id },
    });
    payment = { ...payment, provider: request.provider, gatewayOrderId: request.gatewayOrderId };
    if (request.provider === 'mock') {
      payment.status = 'paid';
      payment.gatewayPaymentId = `mock_${Date.now()}`;
    }
    await repo.insertOne(COLLECTIONS.PAYMENTS, {
      _id: id('pay'),
      orderId: null,
      userId: user._id,
      amount: pricing.total,
      method: paymentMethod.toUpperCase(),
      provider: payment.provider,
      status: payment.status === 'paid' ? 'PAID' : 'PENDING',
      gatewayOrderId: payment.gatewayOrderId,
      gatewayPaymentId: payment.gatewayPaymentId || null,
      metadata: { receipt: `ord_${Date.now()}` },
    });
  }

  // 12. reserve inventory
  await reserveItems(store._id, priced);

  // 13. create order
  const oid = orderId();
  const status = payment.status === 'paid' || paymentMethod === 'COD' ? ORDER_STATUS.PENDING : ORDER_STATUS.PAYMENT_PENDING;
  const timeline = [{ status, at: new Date().toISOString() }];
  const order = await repo.insertOne(COLLECTIONS.ORDERS, {
    _id: oid,
    orderId: oid,
    userId: user._id,
    userName: user.name,
    userPhone: shipAddress.phone || user.phone || '',
    storeId: store._id,
    storeName: store.name,
    items: priced,
    subtotal: pricing.subtotal,
    discount: pricing.discount,
    couponCode: pricing.coupon?.code || null,
    deliveryFee: pricing.deliveryFee,
    tax: taxRate,
    taxAmount: pricing.taxAmount,
    total: pricing.total,
    paymentMethod,
    paymentStatus: payment.status,
    paymentId: payment.gatewayPaymentId || null,
    status,
    etd: eta.label,
    otp: otpCode(),
    deliveryPartnerId: null,
    address: shipAddress,
    statusTimeline: timeline,
  });

  if (pricing.coupon) {
    const userCoupons = [...(user.coupons || []), pricing.coupon.code];
    await repo.updateById(COLLECTIONS.USERS, user._id, { $set: { coupons: userCoupons } });
    await repo.updateOne(COLLECTIONS.COUPONS, { code: pricing.coupon.code }, { $inc: { usedCount: 1 } });
  }
  if (payment.gatewayOrderId) await repo.updateOne(COLLECTIONS.PAYMENTS, { gatewayOrderId: payment.gatewayOrderId }, { $set: { orderId: oid } });
  await repo.updateOne(COLLECTIONS.STORES, { _id: store._id }, { $inc: { ordersToday: 1 } });

  emitUser((STATUS_TO_EVENT[status] || 'order:created'), order, user._id);
  emitAll(STATUS_TO_EVENT[status] || 'order:created', order);

  return ok(res, { orderId: oid, status, order: stripSensitive(order, user) }, { message: 'Order placed successfully', status: 201 });
});

function stripSensitive(order, user) {
  if (!order) return order;
  const isStaff = ['ADMIN', 'SUPER_ADMIN', 'DELIVERY_PARTNER'].includes(user?.role);
  if (isStaff) return order;
  const { otp, ...safe } = order;
  return safe;
}

export const getOrder = asyncHandler(async (req, res) => {
  const order = await repo.findById(COLLECTIONS.ORDERS, req.params.id);
  if (!order) throw new AppError('Order not found', { status: 404, code: 'NOT_FOUND' });
  const isAdmin = req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN';
  const isPartner = req.user.role === 'DELIVERY_PARTNER';
  if (!isAdmin && !(isPartner && order.deliveryPartnerId)) {
    if (order.userId !== req.user._id) throw new AppError('Not authorized to view this order', { status: 403, code: 'FORBIDDEN' });
  }
  return ok(res, stripSensitive(order, req.user), { message: 'Order fetched' });
});

export const getMyOrdersList = asyncHandler(async (req, res) => {
  const rows = await repo.findMany(COLLECTIONS.ORDERS, { userId: req.user._id }, { sort: { createdAt: -1 } });
  return ok(res, rows.map((o) => stripSensitive(o, req.user)), { message: 'Orders fetched' });
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status: next } = req.body;
  if (!next || !STATUS_TRANSITIONS[next]) throw new AppError('Invalid status', { code: 'VALIDATION_ERROR' });
  const order = await repo.findById(COLLECTIONS.ORDERS, req.params.id);
  if (!order) throw new AppError('Order not found', { status: 404, code: 'NOT_FOUND' });

  const allowed = (STATUS_TRANSITIONS[order.status] || []);
  if (!allowed.includes(next)) {
    throw new AppError(`Cannot move order from ${order.status} to ${next}`, { status: 409, code: 'INVALID_TRANSITION' });
  }

  // delivery partners may only advance their own assigned orders
  if (req.user.role === 'DELIVERY_PARTNER') {
    const partner = await repo.findOne(COLLECTIONS.DELIVERY_PARTNERS, { userId: req.user._id });
    if (order.deliveryPartnerId !== partner?._id && order.deliveryPartnerId !== req.user._id) {
      throw new AppError('Order is not assigned to you', { status: 403, code: 'FORBIDDEN' });
    }
  }

  const patch = { status: next, statusTimeline: [...(order.statusTimeline || []), { status: next, at: new Date().toISOString(), by: req.user._id }] };
  if (next === ORDER_STATUS.DELIVERED) {
    if (!order.otpVerifiedAt && !(req.body.skipOtp === true || req.body.skipOtp === 'true')) {
      throw new AppError('OTP verification is required before marking the order delivered', { status: 400, code: 'OTP_REQUIRED' });
    }
    if (!order.otpVerifiedAt) patch.otpVerifiedAt = new Date().toISOString();
    if (String(order.paymentMethod || '').toUpperCase() === 'COD' && order.paymentStatus !== 'refunded_or_cancelled') patch.paymentStatus = 'paid';
  }

  // auto-assign a partner when ready for pickup
  if (next === ORDER_STATUS.READY_FOR_PICKUP && !order.deliveryPartnerId) {
    const partner = await repo.findOne(COLLECTIONS.DELIVERY_PARTNERS, { status: 'active', online: true, storeId: order.storeId });
    if (partner) {
      patch.deliveryPartnerId = partner._id;
      patch.deliveryPartnerName = partner.name;
      await repo.updateById(COLLECTIONS.DELIVERY_PARTNERS, partner._id, { $set: { currentOrder: order._id } });
    }
  }

  const updated = await repo.updateById(COLLECTIONS.ORDERS, order._id, { $set: patch });
  emitUser(STATUS_TO_EVENT[next] || 'order:status', updated, order.userId);
  emitAll(STATUS_TO_EVENT[next] || 'order:status', updated);
  return ok(res, updated, { message: `Order marked as ${next}` });
});

export const cancelOrder = asyncHandler(async (req, res) => {
  const order = await repo.findById(COLLECTIONS.ORDERS, req.params.id);
  if (!order) throw new AppError('Order not found', { status: 404, code: 'NOT_FOUND' });
  if (order.userId !== req.user._id && req.user.role !== 'ADMIN') throw new AppError('Not authorized', { status: 403, code: 'FORBIDDEN' });
  if (!CANCELLABLE_STATUSES.includes(order.status)) throw new AppError(`Order cannot be cancelled at this stage (${order.status})`, { status: 409, code: 'NOT_CANCELLABLE' });

  await releaseItems(order.storeId, order.items);
  let refundId = null;
  if (order.paymentStatus === 'paid' && order.paymentMethod !== 'COD') {
    const r = await refundPayment({ gatewayOrderId: order.paymentId || order.payment?.gatewayOrderId, metadata: { orderId: order._id } });
    refundId = r.refundId;
  }
  const updated = await repo.updateById(COLLECTIONS.ORDERS, order._id, {
    $set: {
      status: ORDER_STATUS.CANCELLED,
      cancelReason: req.body.reason || 'Cancelled by user',
      cancelledBy: req.user._id,
      paymentStatus: order.paymentMethod === 'COD' ? 'pending' : 'refunded_or_cancelled',
      statusTimeline: [...(order.statusTimeline || []), { status: ORDER_STATUS.CANCELLED, at: new Date().toISOString(), by: req.user._id }],
    },
  });
  emitAll('order:cancelled', updated);
  return ok(res, { id: order._id, status: ORDER_STATUS.CANCELLED, refundId }, { message: 'Order cancelled successfully' });
});

export const reorder = asyncHandler(async (req, res) => {
  const order = await repo.findById(COLLECTIONS.ORDERS, req.params.id);
  if (!order) throw new AppError('Order not found', { status: 404, code: 'NOT_FOUND' });
  if (order.userId !== req.user._id) throw new AppError('Not authorized', { status: 403, code: 'FORBIDDEN' });
  // Reuse pricing path without express plumbing
  const items = order.items.map((i) => ({ ...i, quantity: i.quantity }));
  const oid = orderId();
  await validateStock(order.storeId, items);
  const pricing = await computePricing(items.slice(), null);
  await reserveItems(order.storeId, items);
  const status = ORDER_STATUS.PENDING;
  const orderDoc = await repo.insertOne(COLLECTIONS.ORDERS, {
    _id: oid,
    orderId: oid,
    userId: req.user._id,
    userName: req.user.name,
    userPhone: order.userPhone,
    storeId: order.storeId,
    storeName: order.storeName,
    items,
    subtotal: pricing.subtotal,
    discount: 0,
    couponCode: null,
    deliveryFee: pricing.deliveryFee,
    tax: taxRate,
    taxAmount: pricing.taxAmount,
    total: pricing.total,
    paymentMethod: 'COD',
    paymentStatus: 'pending',
    status,
    etd: order.etd,
    otp: otpCode(),
    address: order.address,
    statusTimeline: [{ status, at: new Date().toISOString() }],
  });
  emitAll('order:created', orderDoc);
  return ok(res, { orderId: oid }, { message: 'Order placed from previous order' });
});

const orderController = { placeOrder, getOrder, getMyOrdersList, updateOrderStatus, cancelOrder, reorder };
export default orderController;