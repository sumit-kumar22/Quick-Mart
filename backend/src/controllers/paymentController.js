import { repo } from '../data-access/repo.js';
import { COLLECTIONS } from '../config/constants.js';
import { env } from '../config/env.js';
import { AppError, asyncHandler, ok } from '../utils/response.js';
import { createPaymentRequest, verifyPayment } from '../services/payments.js';
import { emitAll, emitUser } from '../sockets/index.js';

export const createPayment = asyncHandler(async (req, res) => {
  const { orderId, method = 'RAZORPAY' } = req.body;
  const order = await repo.findById(COLLECTIONS.ORDERS, orderId);
  if (!order) throw new AppError('Order not found', { status: 404, code: 'NOT_FOUND' });
  if (order.userId !== req.user._id) throw new AppError('Not authorized', { status: 403, code: 'FORBIDDEN' });
  if (String(order.paymentMethod || '').toUpperCase() === 'COD') {
    throw new AppError('COD orders are settled at delivery', { status: 409, code: 'INVALID_TRANSITION' });
  }

  const request = await createPaymentRequest({
    amount: order.total,
    method: method.toUpperCase(),
    metadata: { orderId, receipt: order.orderId, userId: order.userId },
  });

  const payment = await repo.insertOne(COLLECTIONS.PAYMENTS, {
    _id: `pay-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    orderId,
    userId: order.userId,
    amount: order.total,
    method: method.toUpperCase(),
    provider: request.provider,
    status: 'PENDING',
    gatewayOrderId: request.gatewayOrderId || null,
  });
  await repo.updateById(COLLECTIONS.ORDERS, orderId, { $set: { paymentMethod: method.toUpperCase(), paymentId: request.gatewayOrderId || null } });

  return ok(res, { ...request, paymentId: payment._id }, { message: 'Payment initiated' });
});

export const verifyPaymentControl = asyncHandler(async (req, res) => {
  const { gatewayOrderId, gatewayPaymentId, signature, orderId } = req.body;

  // Resolve a candidate order from the explicit orderId supplied by the client.
  let order = orderId ? await repo.findById(COLLECTIONS.ORDERS, orderId) : null;

  // Resolve a payment record; prefer one tied to a gatewayOrderId.
  const payment = gatewayOrderId
    ? await repo.findOne(COLLECTIONS.PAYMENTS, { gatewayOrderId })
    : orderId
      ? await repo.findOne(COLLECTIONS.PAYMENTS, { orderId })
      : null;

  if (!order && payment?.orderId) order = await repo.findById(COLLECTIONS.ORDERS, payment.orderId);
  if (!order) throw new AppError('Order not found', { status: 404, code: 'NOT_FOUND' });

  // Ownership check: the verifying user must own the order (admins may operate on any).
  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(req.user.role);
  if (!isAdmin && order.userId !== req.user._id) {
    throw new AppError('Not authorized', { status: 403, code: 'FORBIDDEN' });
  }

  // A confirmed payment record linking this order is mandatory.
  if (!payment || payment.userId !== req.user._id || payment.orderId !== order._id) {
    throw new AppError('No matching payment record', { status: 400, code: 'INVALID_PAYMENT_CONTEXT' });
  }

  if (payment.status === 'PAID') {
    return ok(res, { verified: true, transactionId: payment.gatewayPaymentId || payment.transactionId }, { message: 'Payment already verified' });
  }

  if (String(order.paymentMethod || '').toUpperCase() === 'COD') {
    throw new AppError('COD orders are settled at delivery, not via online verification', { status: 409, code: 'INVALID_TRANSITION' });
  }

  if (!Number.isFinite(payment.amount) || payment.amount <= 0 || payment.amount > order.total) {
    throw new AppError('Payment amount is invalid', { status: 400, code: 'INVALID_AMOUNT' });
  }

  const result = await verifyPayment({
    gatewayOrderId,
    gatewayPaymentId,
    signature,
    keySecret: process.env.RAZORPAY_KEY_SECRET || '',
    allowMock: payment.provider === 'mock',
  });
  if (!result.verified) throw new AppError('Payment verification failed', { status: 400, code: 'PAYMENT_FAILED' });

  await repo.updateById(COLLECTIONS.PAYMENTS, payment._id, {
    $set: { status: 'PAID', gatewayPaymentId, transactionId: result.transactionId, signature: signature || null },
  });
  const updated = await repo.updateById(COLLECTIONS.ORDERS, order._id, {
    $set: {
      paymentStatus: 'paid',
      paymentId: gatewayPaymentId || order.paymentId,
      status: order.status === 'PAYMENT_PENDING' ? 'CONFIRMED' : order.status,
      statusTimeline: order.status === 'PAYMENT_PENDING'
        ? [...(order.statusTimeline || []), { status: 'CONFIRMED', at: new Date().toISOString(), by: req.user._id }]
        : order.statusTimeline,
    },
  });

  emitUser('payment:confirmed', updated, order.userId);
  return ok(res, { verified: true, transactionId: result.transactionId }, { message: 'Payment verified successfully' });
});

export const paymentWebhook = asyncHandler(async (_req, res) => {
  // Real gateways (Razorpay/Stripe) delivered later; mark as acknowledged.
  return ok(res, { acknowledged: true }, { message: 'Webhook acknowledged' });
});

const paymentController = { createPayment, verifyPaymentControl, paymentWebhook };
export default paymentController;