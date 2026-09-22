import Razorpay from 'razorpay';
import Stripe from 'stripe';
import { env } from '../config/env.js';
import { paymentRef, randomHex } from '../utils/ids.js';

let razorpay = null;
let stripe = null;
try {
  if (env.razorpayKeyId && env.razorpayKeySecret) razorpay = new Razorpay({ key_id: env.razorpayKeyId, key_secret: env.razorpayKeySecret });
} catch { /* noop */ }
try {
  if (env.stripeSecretKey) stripe = new Stripe(env.stripeSecretKey);
} catch { /* noop */ }

/**
 * Creates an order on the real gateway when configured. Otherwise returns a
 * mock gateway order so the full checkout flow works out of the box.
 */
export async function createPaymentRequest({ amount, currency = 'INR', method, metadata = {} }) {
  const amountPaise = Math.round(amount * 100);

  if (method === 'RAZORPAY' && razorpay) {
    const order = await razorpay.orders.create({ amount: amountPaise, currency, receipt: metadata.receipt });
    return { provider: 'razorpay', gatewayOrderId: order.id, amount, currency, keyId: env.razorpayKeyId };
  }

  if (method === 'STRIPE' && stripe) {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price_data: { currency: currency.toLowerCase(), product_data: { name: 'QuickMart order' }, unit_amount: amountPaise }, quantity: 1 }],
      metadata,
    });
    return { provider: 'stripe', gatewayOrderId: session.id, amount, currency, url: session.url };
  }

  return { provider: 'mock', gatewayOrderId: `mock_${randomHex(16)}`, amount, currency, verifyEndpoint: '/payments/verify' };
}

export async function verifyPayment({ gatewayOrderId, gatewayPaymentId, signature, keySecret, allowMock = false }) {
  // signature = hmac_sha256(orderid + "|" + paymentid, key_secret)
  if (gatewayOrderId && gatewayPaymentId && signature && keySecret) {
    const crypto = await import('node:crypto');
    const expected = crypto.createHmac('sha256', keySecret).update(`${gatewayOrderId}|${gatewayPaymentId}`).digest('hex');
    const ok = expected === signature;
    return { verified: ok, transactionId: gatewayPaymentId };
  }
  // Mock driver (development only): passes when explicitly allowed and no real gateway secret is presented.
  if (allowMock && gatewayPaymentId && !keySecret && env.paymentsMockEnabled) {
    return { verified: true, transactionId: gatewayPaymentId };
  }
  return { verified: false };
}

export async function refundPayment({ gatewayOrderId, metadata = {} }) {
  if (stripe && gatewayOrderId) {
    const refund = await stripe.refunds.create({ payment_intent: gatewayOrderId, metadata });
    return { refundId: refund.id };
  }
  return { refundId: paymentRef('ref') };
}

const payments = { createPaymentRequest, verifyPayment, refundPayment, hasGateway: Boolean(razorpay || stripe) };
export default payments;