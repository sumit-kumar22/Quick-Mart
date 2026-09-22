import { getProduct } from './products.js';
import { getStore } from './stores.js';

const toItem = ([productId, qty, price, variantId]) => {
  const p = getProduct(productId);
  const variant = p ? p.variants.find((v) => v.id === variantId) || p.variants[0] : null;
  return {
    productId,
    name: p ? p.name : 'Unknown product',
    emoji: p ? p.emoji : '📦',
    color: p ? p.color : 'from-slate-100 to-slate-200',
    variantId,
    weight: variant ? variant.weight : (p ? p.weight : ''),
    unitSize: variant ? variant.unitSize : '',
    price: price ?? variant.price,
    mrp: variant ? variant.mrp : price,
    quantity: qty,
    image: null,
  };
};

function buildOrder({
  id, userId, userName, storeId, status, items, paymentMethod, createdAt,
  deliveryPartnerId = null, etd = '35-40 min', otp = '482913',
}) {
  const store = getStore(storeId);
  const subtotal = items.reduce((s, it) => s + it.price * it.quantity, 0);
  const discount = Math.round(subtotal * 0.08);
  const deliveryFee = subtotal >= 499 ? 0 : 19;
  const tax = Math.round((subtotal - discount) * 0.05);
  const total = subtotal - discount + deliveryFee + tax;
  return {
    id,
    orderId: id,
    userId,
    userName,
    storeId,
    storeName: store ? store.name : 'QuickMart Store',
    status,
    items,
    subtotal,
    discount,
    deliveryFee,
    tax: 5,
    taxAmount: tax,
    total,
    paymentMethod,
    paymentStatus: status === 'FAILED' ? 'failed' : status === 'CANCELLED' ? 'refunded_or_cancelled' : 'paid',
    createdAt,
    deliveryPartnerId,
    etd,
    otp,
    address: {
      name: userName,
      line1: 'B-402, Sunshine Apartments',
      line2: 'Veera Desai Road',
      city: 'Mumbai',
      pincode: '400053',
    },
  };
}

export const orders = [
  buildOrder({
    id: 'ord-1001', userId: 'u-1', userName: 'Aarav Mehta', storeId: 'st-1',
    status: 'DELIVERED', paymentMethod: 'RAZORPAY', createdAt: '2026-09-12T10:20:00',
    items: [
      toItem(['p020', 2, 48, 'p020-v2']),
      toItem(['p024', 1, 92, 'p024-v2']),
      toItem(['p007', 1, 189, 'p007-v2']),
    ],
  }),
  buildOrder({
    id: 'ord-1002', userId: 'u-1', userName: 'Aarav Mehta', storeId: 'st-1',
    status: 'OUT_FOR_DELIVERY', paymentMethod: 'RAZORPAY', createdAt: '2026-09-18T09:05:00',
    items: [
      toItem(['p001', 1, 46, 'p001-v2']),
      toItem(['p042', 2, 49, 'p042-v1']),
    ],
    deliveryPartnerId: 'dp-1',
  }),
  buildOrder({
    id: 'ord-1003', userId: 'u-1', userName: 'Aarav Mehta', storeId: 'st-4',
    status: 'PREPARING', paymentMethod: 'COD', createdAt: '2026-09-18T11:45:00',
    items: [
      toItem(['p063', 1, 269, 'p063-v1']),
      toItem(['p025', 1, 219, 'p025-v2']),
      toItem(['p160', 1, 34, 'p160-v1']),
    ],
  }),
  buildOrder({
    id: 'ord-1004', userId: 'u-1', userName: 'Aarav Mehta', storeId: 'st-2',
    status: 'CANCELLED', paymentMethod: 'RAZORPAY', createdAt: '2026-08-04T13:30:00',
    items: [
      toItem(['p080', 1, 149, 'p080-v1']),
      toItem(['p082', 2, 55, 'p082-v1']),
    ],
  }),
  buildOrder({
    id: 'ord-1005', userId: 'u-1', userName: 'Aarav Mehta', storeId: 'st-1',
    status: 'REFUNDED', paymentMethod: 'RAZORPAY', createdAt: '2026-07-22T18:10:00',
    items: [
      toItem(['p141', 1, 439, 'p141-v1']),
      toItem(['p140', 1, 349, 'p140-v1']),
    ],
  }),
  // additional orders for admin views
  buildOrder({
    id: 'ord-1006', userId: 'u-5', userName: 'Rohan Das', storeId: 'st-2',
    status: 'ASSIGNED', paymentMethod: 'RAZORPAY', createdAt: '2026-09-18T12:00:00',
    items: [
      toItem(['p020', 3, 48, 'p020-v2']),
      toItem(['p026', 2, 79, 'p026-v1']),
      toItem(['p161', 1, 44, 'p161-v1']),
    ],
    deliveryPartnerId: 'dp-2',
  }),
  buildOrder({
    id: 'ord-1007', userId: 'u-2', userName: 'Ishita Roy', storeId: 'st-4',
    status: 'PENDING', paymentMethod: 'COD', createdAt: '2026-09-18T12:15:00',
    items: [
      toItem(['p009', 1, 179, 'p009-v1']),
      toItem(['p064', 2, 38, 'p064-v2']),
      toItem(['p102', 1, 82, 'p102-v1']),
    ],
  }),
  buildOrder({
    id: 'ord-1008', userId: 'u-3', userName: 'Vikram Singh', storeId: 'st-1',
    status: 'DELIVERED', paymentMethod: 'STRIPE', createdAt: '2026-09-17T17:40:00',
    items: [
      toItem(['p007', 2, 99, 'p007-v1']),
      toItem(['p020', 4, 48, 'p020-v2']),
      toItem(['p022', 2, 34, 'p022-v2']),
      toItem(['p042', 1, 49, 'p042-v1']),
    ],
  }),
  buildOrder({
    id: 'ord-1009', userId: 'u-6', userName: 'Meera Nair', storeId: 'st-1',
    status: 'CONFIRMED', paymentMethod: 'RAZORPAY', createdAt: '2026-09-18T13:05:00',
    items: [
      toItem(['p001', 2, 46, 'p001-v2']),
      toItem(['p006', 1, 38, 'p006-v2']),
      toItem(['p010', 1, 30, 'p010-v2']),
    ],
  }),
  buildOrder({
    id: 'ord-1010', userId: 'u-4', userName: 'Sneha Gupta', storeId: 'st-3',
    status: 'DELIVERED', paymentMethod: 'COD', createdAt: '2026-09-16T15:55:00',
    items: [toItem(['p022', 1, 34, 'p022-v2']), toItem(['p024', 1, 48, 'p024-v1'])],
  }),
];

export function getOrder(id) {
  return orders.find((o) => o.id === id);
}

export function getOrdersByUser(userId) {
  return orders.filter((o) => o.userId === userId);
}

export default orders;