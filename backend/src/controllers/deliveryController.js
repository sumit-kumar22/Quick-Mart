import { repo } from '../data-access/repo.js';
import { COLLECTIONS, ORDER_STATUS, STATUS_TRANSITIONS, STATUS_TO_EVENT } from '../config/constants.js';
import { AppError, asyncHandler, ok } from '../utils/response.js';
import { emitAll, emitUser } from '../sockets/index.js';

async function getPartner(userId) {
  const partner = await repo.findOne(COLLECTIONS.DELIVERY_PARTNERS, { userId });
  if (!partner || partner.status !== 'active') throw new AppError('Delivery partner profile not found or inactive', { status: 403, code: 'FORBIDDEN' });
  return partner;
}

export const getDeliveryOrders = asyncHandler(async (req, res) => {
  const partner = await getPartner(req.user._id);
  const scope = req.query.scope || 'assigned';

  let rows = [];
  if (scope === 'available') {
    rows = await repo.findMany(
      COLLECTIONS.ORDERS,
      { status: { $in: ['READY_FOR_PICKUP', 'ASSIGNED'] }, deliveryPartnerId: { $in: [null, partner._id] }, storeId: { $in: [partner.storeId, partner._id] } },
      { sort: { createdAt: 1 } }
    );
    rows = rows.filter((o) => !o.deliveryPartnerId || o.deliveryPartnerId === partner._id);
  } else {
    rows = await repo.findMany(
      COLLECTIONS.ORDERS,
      { deliveryPartnerId: partner._id, status: { $in: ['ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'ARRIVING'] } },
      { sort: { createdAt: 1 } }
    );
  }
  return ok(res, rows, { message: 'Delivery orders fetched' });
});

export const acceptOrder = asyncHandler(async (req, res) => {
  const partner = await getPartner(req.user._id);
  const order = await repo.findById(COLLECTIONS.ORDERS, req.params.id);
  if (!order) throw new AppError('Order not found', { status: 404, code: 'NOT_FOUND' });

  if (order.deliveryPartnerId && order.deliveryPartnerId !== partner._id) {
    throw new AppError('Order has already been assigned', { status: 409, code: 'ALREADY_ASSIGNED' });
  }
  if (order.status !== 'READY_FOR_PICKUP' && order.status !== 'ASSIGNED') {
    throw new AppError(`Order cannot be accepted in ${order.status} state`, { status: 409, code: 'INVALID_TRANSITION' });
  }

  await repo.updateById(COLLECTIONS.DELIVERY_PARTNERS, partner._id, { $set: { currentOrder: order._id } });
  await repo.updateById(COLLECTIONS.DELIVERY_PARTNERS, partner._id, { $set: { online: true } });
  const updated = await repo.updateById(COLLECTIONS.ORDERS, order._id, {
    $set: {
      deliveryPartnerId: partner._id,
      deliveryPartnerName: partner.name,
      status: 'ASSIGNED',
      statusTimeline: [...(order.statusTimeline || []), { status: 'ASSIGNED', at: new Date().toISOString(), by: partner._id }],
    },
  });
  emitAll('delivery:assignment', { orderId: order._id, partnerId: partner._id, partnerName: partner.name });
  emitUser('order:assigned', updated, order.userId);
  return ok(res, updated, { message: 'Order accepted' });
});

export const updateStatus = asyncHandler(async (req, res) => {
  const partner = await getPartner(req.user._id);
  const { status: next } = req.body;
  if (!next) throw new AppError('status is required', { code: 'VALIDATION_ERROR' });

  const order = await repo.findById(COLLECTIONS.ORDERS, req.params.id);
  if (!order) throw new AppError('Order not found', { status: 404, code: 'NOT_FOUND' });
  if (order.deliveryPartnerId !== partner._id) throw new AppError('Order is not assigned to you', { status: 403, code: 'FORBIDDEN' });
  if (!STATUS_TRANSITIONS[order.status]?.includes(next)) {
    throw new AppError(`Cannot move order from ${order.status} to ${next}`, { status: 409, code: 'INVALID_TRANSITION' });
  }

  const patch = { status: next, statusTimeline: [...(order.statusTimeline || []), { status: next, at: new Date().toISOString(), by: partner._id }] };
  if (next === 'DELIVERED') {
    if (!order.otpVerifiedAt) {
      throw new AppError('OTP verification is required before marking the order delivered', { status: 400, code: 'OTP_REQUIRED' });
    }
    if (String(order.paymentMethod || '').toUpperCase() === 'COD' && order.paymentStatus !== 'refunded_or_cancelled') patch.paymentStatus = 'paid';
    await repo.updateById(COLLECTIONS.DELIVERY_PARTNERS, partner._id, {
      $set: { currentOrder: null, completed: partner.completed + 1, earnings: partner.earnings + order.total },
    });
  }
  const updated = await repo.updateById(COLLECTIONS.ORDERS, order._id, { $set: patch });
  emitUser(STATUS_TO_EVENT[next] || 'order:status', updated, order.userId);
  emitAll(STATUS_TO_EVENT[next] || 'order:status', updated);
  return ok(res, updated, { message: `Order marked as ${next}` });
});

export const verifyOtp = asyncHandler(async (req, res) => {
  const partner = await getPartner(req.user._id);
  const { otp } = req.body;
  if (!otp) throw new AppError('otp is required', { code: 'VALIDATION_ERROR' });

  const order = await repo.findById(COLLECTIONS.ORDERS, req.params.id);
  if (!order) throw new AppError('Order not found', { status: 404, code: 'NOT_FOUND' });
  if (order.deliveryPartnerId !== partner._id) throw new AppError('Order is not assigned to you', { status: 403, code: 'FORBIDDEN' });
  if (String(order.otp) !== String(otp).trim()) throw new AppError('Invalid OTP. Please try again.', { status: 400, code: 'INVALID_OTP' });

  await repo.updateById(COLLECTIONS.DELIVERY_PARTNERS, partner._id, {
    $set: { currentOrder: null, completed: partner.completed + 1, earnings: partner.earnings + order.total },
  });
  const updated = await repo.updateById(COLLECTIONS.ORDERS, order._id, {
    $set: {
      status: ORDER_STATUS.DELIVERED,
      otpVerifiedAt: new Date().toISOString(),
      paymentStatus: String(order.paymentMethod || '').toUpperCase() === 'COD' && order.paymentStatus !== 'refunded_or_cancelled' ? 'paid' : order.paymentStatus,
      statusTimeline: [...(order.statusTimeline || []), { status: ORDER_STATUS.DELIVERED, at: new Date().toISOString(), by: partner._id }],
    },
  });
  emitUser('order:delivered', updated, order.userId);
  emitAll('order:delivered', updated);
  return ok(res, updated, { message: 'OTP verified — order delivered' });
});

export const getDeliveryProfile = asyncHandler(async (req, res) => {
  const partner = await getPartner(req.user._id);
  const orders = await repo.findMany(COLLECTIONS.ORDERS, { deliveryPartnerId: partner._id }, { sort: { createdAt: -1 } });
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const delivered = orders.filter((o) => o.status === 'DELIVERED');
  const todayDelivered = delivered.filter((o) => new Date(o.createdAt) >= today);
  const earningsToday = todayDelivered.reduce((s, o) => s + o.total, 0);
  const profile = {
    id: partner._id,
    name: partner.name,
    phone: partner.phone,
    vehicle: partner.vehicle || '',
    vehicleNumber: partner.vehicleNumber || '',
    storeId: partner.storeId,
    online: !!partner.online,
    status: partner.status,
    rating: partner.rating || 0,
    deliveriesTotal: partner.completed || delivered.length,
    deliveriesToday: todayDelivered.length,
    earningsTotal: partner.earnings || delivered.reduce((s, o) => s + o.total, 0),
    earningsToday,
    currentOrder: partner.currentOrder || null,
  };
  return ok(res, profile, { message: 'Delivery profile fetched' });
});

export const getDeliveryPartnerById = asyncHandler(async (req, res) => {
  const key = req.params.id;
  const partner = await repo.findOne(COLLECTIONS.DELIVERY_PARTNERS, { $or: [{ _id: key }, { id: key }, { userId: key }] });
  if (!partner) throw new AppError('Delivery partner not found', { status: 404, code: 'NOT_FOUND' });
  return ok(res, {
    id: partner._id,
    name: partner.name,
    phone: partner.phone,
    vehicle: partner.vehicle || '',
    vehicleNumber: partner.vehicleNumber || '',
    rating: partner.rating || 0,
  }, { message: 'Delivery partner fetched' });
});

const deliveryController = { getDeliveryOrders, acceptOrder, updateStatus, verifyOtp, getDeliveryProfile, getDeliveryPartnerById };
export default deliveryController;