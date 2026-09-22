import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import bcrypt from 'bcryptjs';
import { repo } from '../data-access/repo.js';
import { COLLECTIONS } from './constants.js';
import { connectDb, disconnectDb, dbState } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataFile = (name) =>
  pathToFileURL(path.join(__dirname, '../../../frontend/src/data', `${name}.js`)).href;

async function clearDatabase() {
  if (dbState.engine === 'mongo') {
    const mongoose = (await import('mongoose')).default;
    await mongoose.connection.dropDatabase();
    console.log('[seed] dropped MongoDB database');
  } else {
    const { memory } = await import('../data-access/memory.js');
    memory.reset();
    console.log('[seed] cleared in-memory store');
  }
}

// Deterministic PRNG so analytics numbers are stable between runs
function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

async function loadFrontendData() {
  const names = [
    'products', 'categories', 'stores', 'coupons', 'banners', 'users', 'reviews', 'notifications', 'orders',
  ];
  const out = {};
  for (const n of names) {
    try {
      const mod = await import(dataFile(n));
      out[n] = mod;
    } catch (err) {
      console.warn(`[seed] frontend data "${n}" unavailable: ${err.message}`);
      out[n] = {};
    }
  }
  return out;
}

function buildOrderFromSeed({ id, userId, userName, storeId, status, items, paymentMethod, createdAt, deliveryPartnerId = null, otp = '482913', productsMap, storesMap }) {
  const store = storesMap[storeId];
  const subtotal = items.reduce((s, it) => s + it.price * it.quantity, 0);
  const discount = Math.round(subtotal * 0.08);
  const deliveryFee = subtotal >= 499 ? 0 : 19;
  const tax = 5;
  const taxAmount = Math.round((subtotal - discount) * (tax / 100));
  const total = subtotal - discount + deliveryFee + taxAmount;
  const paymentStatus = status === 'FAILED' ? 'failed' : status === 'CANCELLED' || status === 'REFUNDED' ? 'refunded_or_cancelled' : 'paid';
  return {
    _id: id,
    orderId: id,
    userId,
    userName,
    userPhone: '+919876500001',
    storeId,
    storeName: store ? store.name : 'QuickMart Store',
    status,
    items,
    subtotal,
    discount,
    deliveryFee,
    tax,
    taxAmount,
    total,
    paymentMethod,
    paymentStatus,
    createdAt,
    deliveryPartnerId,
    deliveryPartnerName: deliveryPartnerId ? null : null,
    etd: '35-40 min',
    otp,
    otpVerifiedAt: status === 'DELIVERED' ? createdAt : null,
    address: { name: userName, line1: 'B-402, Sunshine Apartments', line2: 'Veera Desai Road', city: 'Mumbai', pincode: '400053' },
    statusTimeline: [
      { status: 'PENDING', at: createdAt },
      { status: 'CONFIRMED', at: createdAt },
      { status: 'PREPARING', at: createdAt },
      ...(status === 'OUT_FOR_DELIVERY' || status === 'DELIVERED' ? [{ status: 'PICKED_UP', at: createdAt }] : []),
      ...(status === 'OUT_FOR_DELIVERY' || status === 'DELIVERED' ? [{ status: 'OUT_FOR_DELIVERY', at: createdAt }] : []),
      ...(status === 'DELIVERED' ? [{ status: 'DELIVERED', at: createdAt }] : []),
    ],
  };
}

function makeOrderItem(productId, qty, price, variantId) {
  return { productId, name: 'item', emoji: '📦', color: 'from-slate-100 to-slate-200', variantId, weight: '', unitSize: '', price, mrp: price, quantity: qty, image: null };
}

export async function seedDatabase() {
  const data = await loadFrontendData();
  const products = data.products.products || [];
  const categories = data.categories.categories || [];
  const stores = data.stores.stores || [];
  const coupons = data.coupons.coupons || [];
  const offers = data.coupons.offers || [];
  const banners = data.banners.default || data.banners.banners || [];
  const freshnessBanners = data.banners.freshnessBanners || [];
  const reviewerUsers = (data.users.users || []).slice(0, 3);
  const frontendOrders = data.orders.orders || [];

  const existing = await repo.count(COLLECTIONS.USERS, { role: 'SUPER_ADMIN' });
  if (existing > 0) {
    console.log(`[seed] database already seeded (${await repo.count(COLLECTIONS.USERS, {})} users) - skipping`);
    return { seeded: false };
  }

  const hash = (s) => bcrypt.hashSync(s, 10);
  const now = () => new Date().toISOString();

  // ---- stores ----
  const storeDocs = stores.map((s) => ({ ...s, _id: s.id }));
  // ---- categories ----
  const categoryDocs = categories.map((c) => ({ ...c, _id: c.id, active: true }));
  // ---- products ----
  const productDocs = products.map((p) => ({ ...p, _id: p.id }));
  // ---- inventory ----
  const invDocs = [];
  for (const p of products) {
    const storeStock = p.storeStock || {};
    for (const [storeId, stock] of Object.entries(storeStock)) {
      invDocs.push({
        _id: `inv-${storeId}-${p.id}`,
        storeId,
        productId: p.id,
        name: p.name,
        emoji: p.emoji,
        mrp: p.mrp,
        price: p.sellingPrice,
        stock,
        reorderLevel: 10,
        status: stock <= 0 ? 'out_of_stock' : stock < 15 ? 'low_stock' : 'in_stock',
      });
    }
  }
  // ---- banners ----
  const bannerDocs = [];
  (Array.isArray(banners) ? banners : []).forEach((b, i) => bannerDocs.push({ ...b, _id: b.id || `b-${i + 1}`, type: 'main' }));
  (Array.isArray(freshnessBanners) ? freshnessBanners : []).forEach((b, i) => bannerDocs.push({ ...b, _id: b.id || `bf-${i + 1}`, type: 'freshness' }));

  // ---- users ----
  const customerDocs = (data.users.users || [{ id: 'u-0', name: 'Demo Customer', email: 'demo@quickmart.co', phone: '+919876500000' }]).map((u, i) => ({
    _id: u.id || `u-c${i}`,
    name: u.name,
    email: u.email,
    phone: u.phone,
    role: 'CUSTOMER',
    roles: ['CUSTOMER'],
    permissions: [],
    status: u.status === 'suspended' || u.status === 'blocked' ? u.status : 'active',
    passwordHash: hash('customer123'),
    avatar: null,
    addresses: [],
    wishlist: [],
    coupons: [],
  }));

  const adminUser = {
    _id: 'u-admin',
    name: 'Admin User',
    email: 'admin@quickmart.co',
    phone: '+919812340001',
    role: 'ADMIN',
    roles: ['ADMIN'],
    permissions: ['dashboard', 'orders', 'products', 'categories', 'inventory', 'users', 'delivery', 'stores', 'offers', 'reports', 'settings', 'reviews'],
    status: 'active',
    passwordHash: hash('admin@123'),
    avatar: null,
    addresses: [],
    wishlist: [],
    coupons: [],
  };
  const superAdminUser = {
    _id: 'u-superadmin',
    name: 'Super Admin',
    email: 'superadmin@quickmart.co',
    phone: '+919812340000',
    role: 'SUPER_ADMIN',
    roles: ['SUPER_ADMIN', 'ADMIN'],
    permissions: ['*'],
    status: 'active',
    passwordHash: hash('admin@123'),
    avatar: null,
    addresses: [],
    wishlist: [],
    coupons: [],
  };
  const dpSeeds = (data.users.deliveryPartners || [
    { id: 'dp-1', name: 'Ajay Kumar', phone: '+91 98111 00001', email: 'ajay@quickmart.co', storeId: 'st-1' },
  ]);
  const partnerUsers = dpSeeds.map((dp, i) => ({
    _id: `u-dp-${dp.id}`,
    name: dp.name,
    email: dp.email,
    phone: dp.phone,
    role: 'DELIVERY_PARTNER',
    roles: ['DELIVERY_PARTNER'],
    permissions: ['orders', 'delivery'],
    status: 'active',
    passwordHash: hash('ajay@123'),
    avatar: null,
    addresses: [],
    wishlist: [],
    coupons: [],
  }));
  const partnerDocs = dpSeeds.map((dp, i) => ({
    ...dp,
    _id: dp.id,
    userId: `u-dp-${dp.id}`,
    status: dp.status || 'active',
    online: !!dp.online,
    rating: dp.rating || 4.5,
    completed: dp.completed || 0,
    earnings: dp.earnings || 0,
    storeId: dp.storeId || 'st-1',
    currentOrder: dp.currentOrder || null,
    joinedAt: dp.joinedAt || '2026-01-20',
  }));

  const allUsers = [...customerDocs, adminUser, superAdminUser, ...partnerUsers];
  const firstCustomer = customerDocs[0];

  // ---- reviews ----
  const reviewDocs = (data.reviews.default || data.reviews.reviews || []).map((r, i) => ({
    _id: r.id || `rev-${i + 1}`,
    productId: r.productId,
    userId: r.userId || `u-reviewer-${String(r.user?.name || 'guest').toLowerCase().replace(/[^a-z]/g, '') || i}`,
    userName: r.user?.name || r.userName || 'Guest',
    rating: r.rating,
    title: r.title || '',
    comment: r.content || r.comment || '',
    helpfulCount: r.helpful ?? r.helpfulCount ?? 0,
    verified: r.verified ?? true,
  }));

  // ---- notifications ----
  const notifDocs = (data.notifications.default || data.notifications.notifications || []).map((n, i) => ({
    ...n,
    _id: n.id || `ntf-${i + 1}`,
  }));
  notifDocs.forEach((n) => { if (!n.userId) n.userId = firstCustomer?._id || null; });

  // ---- coupons / offers / settings ----
  const couponDocs = coupons.map((c) => ({ ...c, _id: c.id }));
  const offerDocs = offers.map((o) => ({ ...o, _id: o.id }));
  const settingsDoc = { _id: 'settings-singleton', deliveryFee: 39, freeDeliveryThreshold: 499, defaultRadiusKm: 8, support: { email: 'support@quickmart.co', phone: '+91 1800 419 0000' }, social: { instagram: '@quickmart', x: '@quickmart' }, maintenanceMode: false, security: { twoFactor: true, sessionTimeout: 30 } };

  // ---- orders: demo orders mirroring the frontend ----
  const productsMap = Object.fromEntries(products.map((p) => [p.id, p]));
  const storesMap = Object.fromEntries(stores.map((s) => [s.id, s]));
  const toItem = (productId, qty, price, variantId) => {
    const p = productsMap[productId];
    const variant = p ? p.variants.find((v) => v.id === variantId) || p.variants[0] : null;
    return {
      productId,
      name: p ? p.name : 'Unknown product',
      emoji: p ? p.emoji : '📦',
      color: p ? p.color : 'from-slate-100 to-slate-200',
      variantId,
      weight: variant ? variant.weight : (p ? p.weight : ''),
      unitSize: variant ? variant.unitSize : '',
      price: price ?? variant?.price,
      mrp: variant ? variant.mrp : price,
      quantity: qty,
      image: null,
    };
  };

  const demoOrderDefs = [
    { id: 'ord-1001', userId: 'u-1', userName: 'Aarav Mehta', storeId: 'st-1', status: 'DELIVERED', paymentMethod: 'RAZORPAY', createdAt: '2026-09-12T10:20:00', items: [['p020', 2, 48, 'p020-v2'], ['p024', 1, 92, 'p024-v2'], ['p007', 1, 189, 'p007-v2']] },
    { id: 'ord-1002', userId: 'u-1', userName: 'Aarav Mehta', storeId: 'st-1', status: 'OUT_FOR_DELIVERY', paymentMethod: 'RAZORPAY', createdAt: '2026-09-18T09:05:00', items: [['p001', 1, 46, 'p001-v2'], ['p042', 2, 49, 'p042-v1']] },
    { id: 'ord-1003', userId: 'u-1', userName: 'Aarav Mehta', storeId: 'st-4', status: 'PREPARING', paymentMethod: 'COD', createdAt: '2026-09-18T11:45:00', items: [['p063', 1, 269, 'p063-v1'], ['p025', 1, 219, 'p025-v2'], ['p160', 1, 34, 'p160-v1']] },
    { id: 'ord-1004', userId: 'u-1', userName: 'Aarav Mehta', storeId: 'st-2', status: 'CANCELLED', paymentMethod: 'RAZORPAY', createdAt: '2026-08-04T13:30:00', items: [['p080', 1, 149, 'p080-v1'], ['p082', 2, 55, 'p082-v1']] },
    { id: 'ord-1005', userId: 'u-1', userName: 'Aarav Mehta', storeId: 'st-1', status: 'REFUNDED', paymentMethod: 'RAZORPAY', createdAt: '2026-07-22T18:10:00', items: [['p141', 1, 439, 'p141-v1'], ['p140', 1, 349, 'p140-v1']] },
    { id: 'ord-1006', userId: 'u-5', userName: 'Rohan Das', storeId: 'st-2', status: 'ASSIGNED', paymentMethod: 'RAZORPAY', createdAt: '2026-09-18T12:00:00', items: [['p020', 3, 48, 'p020-v2'], ['p026', 2, 79, 'p026-v1'], ['p161', 1, 44, 'p161-v1']] },
    { id: 'ord-1007', userId: 'u-2', userName: 'Ishita Roy', storeId: 'st-4', status: 'PENDING', paymentMethod: 'COD', createdAt: '2026-09-18T12:15:00', items: [['p063', 1, 269, 'p063-v1'], ['p025', 1, 219, 'p025-v2']] },
    { id: 'ord-1008', userId: 'u-5', userName: 'Rohan Das', storeId: 'st-1', status: 'DELIVERED', paymentMethod: 'COD', createdAt: '2026-09-15T16:40:00', items: [['p001', 1, 30, 'p001-v1'], ['p002', 1, 50, 'p002-v2']] },
  ];
  const orderDocs = demoOrderDefs.map((d) =>
    buildOrderFromSeed({
      id: d.id,
      userId: d.userId,
      userName: d.userName,
      storeId: d.storeId,
      status: d.status,
      paymentMethod: d.paymentMethod,
      createdAt: d.createdAt,
      items: d.items.map((it) => toItem(it[0], it[1], it[2], it[3])),
      deliveryPartnerId: d.id === 'ord-1002' || d.id === 'ord-1006' ? (d.id === 'ord-1002' ? 'dp-1' : 'dp-2') : null,
      productsMap,
      storesMap,
    })
  );

  // ---- analytics orders (deterministic, last 30 days) ----
  const rnd = mulberry32(20260921);
  const statuses = ['DELIVERED', 'DELIVERED', 'DELIVERED', 'DELIVERED', 'DELIVERED', 'OUT_FOR_DELIVERY', 'PREPARING', 'PENDING', 'DELIVERED', 'CANCELLED'];
  const payMethods = ['RAZORPAY', 'UPI', 'COD', 'CARD', 'RAZORPAY', 'COD'];
  const analyticUsers = customerDocs.slice(0, 6);
  let seq = 2000;
  for (let i = 0; i < 140; i++) {
    const daysAgo = Math.floor(rnd() * 30);
    const at = new Date(Date.now() - daysAgo * 864e5 - Math.floor(rnd() * 12) * 36e5).toISOString();
    const user = analyticUsers[Math.floor(rnd() * analyticUsers.length)];
    const store = stores[Math.floor(rnd() * (stores.length - 1))];
    const count = 1 + Math.floor(rnd() * 4);
    const itemDefs = [];
    for (let j = 0; j < count; j++) {
      const p = products[Math.floor(rnd() * products.length)];
      const variant = p.variants[Math.floor(rnd() * p.variants.length)] || { id: `${p.id}-v1`, price: p.sellingPrice, mrp: p.mrp, weight: p.weight, unitSize: p.unit };
      const qty = 1 + Math.floor(rnd() * 3);
      itemDefs.push([p.id, qty, variant.price, variant.id]);
    }
    const status = i < 5 ? ['PENDING', 'PREPARING', 'OUT_FOR_DELIVERY', 'OUT_FOR_DELIVERY', 'ASSIGNED'][i] : statuses[Math.floor(rnd() * statuses.length)];
    const order = buildOrderFromSeed({
      id: `ord-${seq++}`,
      userId: user._id,
      userName: user.name,
      storeId: store.id,
      status,
      paymentMethod: payMethods[Math.floor(rnd() * payMethods.length)],
      createdAt: at,
      items: itemDefs.map((it) => toItem(it[0], it[1], it[2], it[3])),
      deliveryPartnerId: status === 'DELIVERED' || status === 'OUT_FOR_DELIVERY' ? partnerDocs[Math.floor(rnd() * partnerDocs.length)]._id : null,
      productsMap,
      storesMap,
    });
    order.orderId = order._id;
    order.userPhone = user.phone;
    orderDocs.push(order);
  }

  // ---- carts ----
  const cartDocs = [{ _id: 'cart-u-1', userId: customerDocs[0]._id, storeId: 'st-1', items: [], couponCode: null, subtotal: 0, deliveryFee: 0, tax: 0, total: 0, active: true }];

  console.log(`[seed] inserting ${storeDocs.length} stores, ${categoryDocs.length} categories, ${productDocs.length} products, ${invDocs.length} inventory, ${allUsers.length} users, ${orderDocs.length} orders ...`);

  const safeInsert = async (name, docs) => {
    try {
      await repo.insertMany(name, docs);
      console.log(`[seed]   + ${name}: ${docs.length} docs`);
    } catch (err) {
      console.warn(`[seed]   ! ${name} skipped: ${err.message}`);
    }
  };

  await safeInsert(COLLECTIONS.STORES, storeDocs);
  await safeInsert(COLLECTIONS.CATEGORIES, categoryDocs);
  await safeInsert(COLLECTIONS.PRODUCTS, productDocs);
  await safeInsert(COLLECTIONS.INVENTORY, invDocs);
  await safeInsert(COLLECTIONS.USERS, allUsers);
  await safeInsert(COLLECTIONS.DELIVERY_PARTNERS, partnerDocs);
  await safeInsert(COLLECTIONS.COUPONS, couponDocs);
  await safeInsert(COLLECTIONS.OFFERS, offerDocs);
  await safeInsert(COLLECTIONS.BANNERS, bannerDocs);
  await safeInsert(COLLECTIONS.REVIEWS, reviewDocs);
  await safeInsert(COLLECTIONS.NOTIFICATIONS, notifDocs);
  await safeInsert(COLLECTIONS.ORDERS, orderDocs);
  await safeInsert(COLLECTIONS.CARTS, cartDocs);
  await safeInsert(COLLECTIONS.SETTINGS, [settingsDoc]);

  const superAdmin = await repo.findOne(COLLECTIONS.USERS, { email: 'superadmin@quickmart.co' });
  await repo.insertOne(COLLECTIONS.AUDIT_LOGS, {
    _id: `aud-${Date.now()}`,
    action: 'system.seed',
    actorId: superAdmin?._id || 'system',
    actorName: 'Seeder',
    actorRole: 'SUPER_ADMIN',
    entity: 'database',
    details: { counts: { stores: storeDocs.length, products: productDocs.length, users: allUsers.length, orders: orderDocs.length } },
    ip: '127.0.0.1',
    createdAt: now(),
  });

  console.log(`[seed] done. engine=${dbState.engine}`);
  return { seeded: true };
}

// CLI entry
const isMain = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isMain) {
  await connectDb();
  try {
    const wantsReset = process.argv.includes('--reset') || process.env.SEED_RESET === 'true';
    if (wantsReset) await clearDatabase();
    await seedDatabase();
  } catch (err) {
    console.error('[seed] failed', err);
    process.exitCode = 1;
  } finally {
    await disconnectDb();
    process.exit(process.exitCode || 0);
  }
}

export default seedDatabase;