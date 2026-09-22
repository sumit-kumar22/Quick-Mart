import { repo } from '../data-access/repo.js';
import { COLLECTIONS, PAYMENT_METHODS } from '../config/constants.js';
import { AppError, asyncHandler, ok, parsePagination, pickPatch } from '../utils/response.js';
import { id } from '../utils/ids.js';
import audit from '../middleware/audit.js';

const ACTIVE_ORDER_STATUSES = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'ARRIVING'];
const REVENUE_STATUSES = ['DELIVERED', 'OUT_FOR_DELIVERY', 'ARRIVING', 'PICKED_UP', 'READY_FOR_PICKUP', 'ASSIGNED', 'CONFIRMED', 'PREPARING', 'PAYMENT_CONFIRMED'];

const inr = (n) => '₹' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 });
const withId = (doc) => (doc && !Object.prototype.hasOwnProperty.call(doc, 'id') ? { ...doc, id: doc._id } : doc);
const dayLabel = (d) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
const monthLabel = (d) => d.toLocaleDateString('en-IN', { month: 'short' });
const relTime = (iso) => {
  const mins = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs > 1 ? 's' : ''} ago`;
  return `${Math.round(hrs / 24)} day${hrs > 47 ? 's' : ''} ago`;
};

const revenueOf = (o) => (REVENUE_STATUSES.includes(o.status) ? o.total || 0 : 0);

async function computeAnalytics() {
  const [orders, products, stores, partners, users] = await Promise.all([
    repo.findMany(COLLECTIONS.ORDERS, {}),
    repo.findMany(COLLECTIONS.PRODUCTS, {}),
    repo.findMany(COLLECTIONS.STORES, {}),
    repo.findMany(COLLECTIONS.DELIVERY_PARTNERS, {}),
    repo.findMany(COLLECTIONS.USERS, {}),
  ]);

  const now = Date.now();
  const dayStart = new Date(now); dayStart.setHours(0, 0, 0, 0);
  const weekAgo = now - 6 * 864e5;

  const ordersToday = orders.filter((o) => new Date(o.createdAt) >= dayStart);
  const today = {
    orders: ordersToday.length,
    revenue: Math.round(ordersToday.reduce((s, o) => s + revenueOf(o), 0)),
    activeUsers: users.filter((u) => u.status === 'active').length,
    pendingOrders: ordersToday.filter((o) => o.status === 'PENDING').length,
    deliveredOrders: ordersToday.filter((o) => o.status === 'DELIVERED').length,
    cancelledOrders: ordersToday.filter((o) => o.status === 'CANCELLED').length,
    lowStockProducts: products.filter((p) => (p.stock || 0) < 15).length,
  };

  const salesChart = [];
  for (let i = 6; i >= 0; i -= 1) {
    const start = new Date(dayStart.getTime() - i * 864e5);
    const end = new Date(start.getTime() + 864e5);
    const dayOrders = orders.filter((o) => { const t = new Date(o.createdAt); return t >= start && t < end; });
    salesChart.push({ day: dayLabel(start), orders: dayOrders.length, revenue: Math.round(dayOrders.reduce((s, o) => s + revenueOf(o), 0)) });
  }

  const statusCounts = {};
  for (const o of orders) statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
  const statusNames = {
    DELIVERED: 'Delivered', PREPARING: 'Preparing', OUT_FOR_DELIVERY: 'Out for Delivery',
    PENDING: 'Pending', CANCELLED: 'Cancelled', CONFIRMED: 'Confirmed', ASSIGNED: 'Assigned',
  };
  const orderStatusDistribution = Object.entries(statusCounts)
    .map(([k, v]) => ({ name: statusNames[k] || k, value: v }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const productMap = Object.fromEntries(products.map((p) => [p._id, p]));
  const unitsSold = {};
  const productRevenue = {};
  for (const o of orders) {
    for (const it of o.items || []) {
      unitsSold[it.productId] = (unitsSold[it.productId] || 0) + it.quantity;
      productRevenue[it.productId] = (productRevenue[it.productId] || 0) + it.price * it.quantity;
    }
  }
  const topProducts = Object.entries(productRevenue)
    .map(([pid, revenue]) => ({ id: pid, name: productMap[pid]?.name || 'Unknown', units: unitsSold[pid] || 0, revenue: Math.round(revenue) }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const catRevenue = {};
  for (const o of orders) {
    for (const it of o.items || []) {
      const cat = productMap[it.productId]?.category || 'Other';
      catRevenue[cat] = (catRevenue[cat] || 0) + it.price * it.quantity;
    }
  }
  const catNames = { 'fruits-vegetables': 'Fruits & Vegetables', 'dairy-breakfast': 'Dairy & Breakfast', 'snacks-munchies': 'Snacks & Munchies', beverages: 'Beverages', 'personal-care': 'Personal Care', 'home-cleaning': 'Home & Cleaning', 'baby-care': 'Baby Care', 'pet-care': 'Pet Care', bakery: 'Bakery', 'meat-seafood': 'Meat & Seafood', stationery: 'Stationery', household: 'Household' };
  const topCategories = Object.entries(catRevenue)
    .map(([slug, revenue]) => ({ name: catNames[slug] || slug, revenue: Math.round(revenue) }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const storePerformance = stores
    .map((s) => {
      const so = orders.filter((o) => o.storeId === s._id);
      return { id: s._id, name: (s.name || '').replace('QuickMart ', ''), orders: so.length, revenue: Math.round(so.reduce((sum, o) => sum + revenueOf(o), 0)) };
    })
    .filter((s) => s.orders > 0 || s.revenue > 0);

  const deliveries = orders.filter((o) => o.status === 'DELIVERED');
  const deliveryPerformance = {
    avgDeliveryMinutes: 28,
    onTimeRate: 94,
    activePartners: partners.filter((p) => p.online).length || partners.length,
    deliveriesToday: ordersToday.filter((o) => o.status === 'DELIVERED').length,
    totalDelivered: deliveries.length,
  };

  return { today, salesChart, orderStatusDistribution, topProducts, topCategories, storePerformance, deliveryPerformance };
}

export const getDashboard = asyncHandler(async (req, res) => {
  const analytics = await computeAnalytics();
  return ok(res, analytics, { message: 'Dashboard fetched' });
});

export const getRecentOrders = asyncHandler(async (_req, res) => {
  const orders = await repo.findMany(COLLECTIONS.ORDERS, {}, { sort: { createdAt: -1 }, limit: 5 });
  return ok(res, orders.map((o) => ({ id: o._id, customer: o.userName, storeName: o.storeName, amount: o.total, status: o.status, time: relTime(o.createdAt) })), { message: 'Recent orders fetched' });
});

export const getAdminOrders = asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.storeId) filter.storeId = req.query.storeId;
  const [rows, total] = await Promise.all([
    repo.findMany(COLLECTIONS.ORDERS, filter, { sort: { createdAt: -1 }, skip: (page - 1) * limit, limit }),
    repo.count(COLLECTIONS.ORDERS, filter),
  ]);
  return ok(res, rows.map(withId), { message: 'Orders fetched', meta: { page, limit, total } });
});

export const getReports = asyncHandler(async (_req, res) => {
  const a = await computeAnalytics();
  const allOrders = await repo.findMany(COLLECTIONS.ORDERS, {});
  const gross = allOrders.reduce((s, o) => s + revenueOf(o), 0);
  const totalOrders = allOrders.length;
  const avg = totalOrders ? Math.round(gross / totalOrders) : 0;

  const now = new Date();
  const months = [];
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ label: monthLabel(d), start: d });
  }
  const revenueTrend = months.map((m) => ({
    month: m.label,
    revenue: Math.round(allOrders.filter((o) => new Date(o.createdAt) >= m.start).reduce((s, o) => s + revenueOf(o), 0)),
  }));

  const methodCounts = { upi: 0, cod: 0, card: 0, wallet: 0 };
  for (const o of allOrders) {
    const m = (o.paymentMethod || '').toLowerCase();
    if (m === 'razorpay' || m === 'upi') methodCounts.upi += 1;
    else if (m === 'cod') methodCounts.cod += 1;
    else if (m === 'stripe' || m === 'card') methodCounts.card += 1;
    else methodCounts.wallet += 1;
  }
  const methodTotal = Math.max(1, allOrders.length);
  const paymentMethods = Object.entries(methodCounts).map(([name, value]) => ({ name, value: Math.round((value / methodTotal) * 100) }));

  const totalStoreRevenue = a.storePerformance.reduce((s, x) => s + x.revenue, 0) || 1;
  const storePerformance = a.storePerformance.map((s) => ({ ...s, share: Math.round((s.revenue / totalStoreRevenue) * 100) }));

  const last30 = allOrders.filter((o) => new Date(o.createdAt) >= now - 30 * 864e5);
  const prev30 = allOrders.filter((o) => new Date(o.createdAt) < now - 30 * 864e5 && new Date(o.createdAt) >= now - 60 * 864e5);
  const growth = (curr, prev) => (prev > 0 ? Math.round(((curr - prev) / prev) * 1000) / 10 : 0);
  const last30Rev = last30.reduce((s, o) => s + revenueOf(o), 0);
  const prev30Rev = prev30.reduce((s, o) => s + revenueOf(o), 0);

  return ok(res, {
    grossRevenue: inr(gross),
    revenueGrowth: growth(last30Rev, prev30Rev),
    totalOrders,
    orderGrowth: growth(last30.length, prev30.length),
    avgOrderValue: inr(avg),
    storeCount: (await repo.count(COLLECTIONS.STORES, { status: 'active' })),
    revenueTrend,
    categorySales: a.topCategories.map((c) => ({ name: c.name, revenue: c.revenue })),
    paymentMethods,
    topProducts: a.topProducts.map((p) => ({ name: p.name, revenue: p.revenue, units: p.units })),
    storePerformance,
  }, { message: 'Reports fetched' });
});

export const getAdminUsers = asyncHandler(async (req, res) => {
  const users = await repo.findMany(COLLECTIONS.USERS, {}, { sort: { createdAt: 1 } });
  const ordersByUser = {};
  const orders = await repo.findMany(COLLECTIONS.ORDERS, {});
  for (const o of orders) {
    if (!ordersByUser[o.userId]) ordersByUser[o.userId] = { orders: 0, spent: 0 };
    ordersByUser[o.userId].orders += 1;
    ordersByUser[o.userId].spent += revenueOf(o);
  }
  const rows = users
    .filter((u) => u.role === 'CUSTOMER')
    .map((u) => ({
      id: u._id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      status: u.status,
      createdAt: u.createdAt?.slice(0, 10),
      orders: ordersByUser[u._id]?.orders || 0,
      spent: ordersByUser[u._id]?.spent || 0,
      address: u.addresses?.[0]?.city || '',
      avatar: u.avatar,
    }));
  return ok(res, rows, { message: 'Users fetched' });
});

export const updateUserStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['active', 'suspended', 'blocked'].includes(status)) throw new AppError('Invalid status', { code: 'VALIDATION_ERROR' });
  const user = await repo.findById(COLLECTIONS.USERS, req.params.id);
  if (!user) throw new AppError('User not found', { status: 404, code: 'NOT_FOUND' });
  const updated = await repo.updateById(COLLECTIONS.USERS, user._id, { $set: { status } });
  await audit(req, { action: status === 'blocked' ? 'USER_BLOCKED' : 'USER_SUSPENDED', entity: 'users', entityId: user._id, details: { name: user.name, status } });
  return ok(res, updated, { message: `User ${status}` });
});

export const getDeliveryPartnersAdmin = asyncHandler(async (_req, res) => {
  const partners = await repo.findMany(COLLECTIONS.DELIVERY_PARTNERS, {});
  return ok(res, partners.map(withId), { message: 'Delivery partners fetched' });
});

export const updateDeliveryPartnerStatus = asyncHandler(async (req, res) => {
  const { status, online } = req.body;
  const patch = {};
  if (status) patch.status = status;
  if (online != null) patch.online = Boolean(online);
  const partner = await repo.updateById(COLLECTIONS.DELIVERY_PARTNERS, req.params.id, { $set: patch });
  if (!partner) throw new AppError('Partner not found', { status: 404, code: 'NOT_FOUND' });
  return ok(res, partner, { message: 'Partner updated' });
});

function slug(str) {
  return String(str || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export const createProduct = asyncHandler(async (req, res) => {
  const body = { ...req.body };
  body.slug = body.slug || slug(body.name);
  body.sku = body.sku || `${(body.brand || 'QM').slice(0, 2).toUpperCase()}${id('p').toUpperCase().slice(-8)}`;
  const product = await repo.insertOne(COLLECTIONS.PRODUCTS, { _id: id('p'), ...body, storeStock: body.storeStock || {} });
  if (body.category) {
    const cat = await repo.findOne(COLLECTIONS.CATEGORIES, { slug: body.category });
    if (cat) await repo.updateById(COLLECTIONS.CATEGORIES, cat._id, { $inc: { productCount: 1 } });
  }
  await audit(req, { action: 'PRODUCT_CREATED', entity: 'products', entityId: product._id, details: { name: product.name } });
  return ok(res, product, { message: 'Product created', status: 201 });
});

export const updateProduct = asyncHandler(async (req, res) => {
  const { ...patchBody } = req.body;
  if (patchBody.name) patchBody.slug = slug(patchBody.name);
  const product = await repo.findById(COLLECTIONS.PRODUCTS, req.params.id);
  if (!product) throw new AppError('Product not found', { status: 404, code: 'NOT_FOUND' });
  const updated = await repo.updateById(COLLECTIONS.PRODUCTS, product._id, { $set: patchBody });
  await audit(req, { action: 'PRODUCT_UPDATED', entity: 'products', entityId: product._id });
  return ok(res, updated, { message: 'Product updated' });
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const res2 = await repo.deleteById(COLLECTIONS.PRODUCTS, req.params.id);
  if (!res2.deletedCount) throw new AppError('Product not found', { status: 404, code: 'NOT_FOUND' });
  await audit(req, { action: 'PRODUCT_DELETED', entity: 'products', entityId: req.params.id });
  return ok(res, { deleted: true }, { message: 'Product deleted' });
});

export const createCategory = asyncHandler(async (req, res) => {
  const { name, icon, color } = req.body;
  if (!name) throw new AppError('name is required', { code: 'VALIDATION_ERROR' });
  const cat = await repo.insertOne(COLLECTIONS.CATEGORIES, { _id: id('cat'), name, slug: slug(name), icon: icon || 'Carrot', color: color || 'from-green-100 to-lime-100', productCount: 0, active: true });
  return ok(res, cat, { message: 'Category created', status: 201 });
});

export const updateCategory = asyncHandler(async (req, res) => {
  const patch = pickPatch(['name', 'slug', 'icon', 'color', 'active'], req.body);
  const cat = await repo.updateById(COLLECTIONS.CATEGORIES, req.params.id, { $set: patch });
  if (!cat) throw new AppError('Category not found', { status: 404, code: 'NOT_FOUND' });
  return ok(res, cat, { message: 'Category updated' });
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const res2 = await repo.deleteById(COLLECTIONS.CATEGORIES, req.params.id);
  if (!res2.deletedCount) throw new AppError('Category not found', { status: 404, code: 'NOT_FOUND' });
  return ok(res, { deleted: true }, { message: 'Category deleted' });
});

export const createStore = asyncHandler(async (req, res) => {
  const { name, ...rest } = req.body;
  if (!name) throw new AppError('name is required', { code: 'VALIDATION_ERROR' });
  const store = await repo.insertOne(COLLECTIONS.STORES, { _id: id('st'), code: rest.code || `QM-${id('').toUpperCase().slice(0, 4)}`, name, ...rest, status: rest.status || 'active' });
  return ok(res, store, { message: 'Store created', status: 201 });
});

export const updateStore = asyncHandler(async (req, res) => {
  const patch = pickPatch(['name', 'code', 'address', 'city', 'pincode', 'lat', 'lng', 'phone', 'status', 'adminId'], req.body);
  const store = await repo.updateById(COLLECTIONS.STORES, req.params.id, { $set: patch });
  if (!store) throw new AppError('Store not found', { status: 404, code: 'NOT_FOUND' });
  await audit(req, { action: 'STORE_UPDATED', entity: 'stores', entityId: store._id, details: { name: store.name } });
  return ok(res, store, { message: 'Store updated' });
});

export const deleteStore = asyncHandler(async (req, res) => {
  const res2 = await repo.deleteById(COLLECTIONS.STORES, req.params.id);
  if (!res2.deletedCount) throw new AppError('Store not found', { status: 404, code: 'NOT_FOUND' });
  await audit(req, { action: 'STORE_DELETED', entity: 'stores', entityId: req.params.id });
  return ok(res, { deleted: true }, { message: 'Store deleted' });
});

export const getOffersAdmin = asyncHandler(async (req, res) => {
  const coupons = await repo.findMany(COLLECTIONS.COUPONS, {}, { sort: { createdAt: -1 } });
  return ok(res, coupons.map(withId), { message: 'Coupons fetched' });
});

export const createOffer = asyncHandler(async (req, res) => {
  const { title, description, tag } = req.body;
  if (!title) throw new AppError('title is required', { code: 'VALIDATION_ERROR' });
  const offer = await repo.insertOne(COLLECTIONS.OFFERS, { _id: id('of'), title, description: description || '', tag: tag || '', active: true });
  return ok(res, offer, { message: 'Offer created', status: 201 });
});

export const updateOffer = asyncHandler(async (req, res) => {
  const patch = pickPatch(['title', 'description', 'tag', 'active'], req.body);
  const offer = await repo.updateById(COLLECTIONS.OFFERS, req.params.id, { $set: patch });
  if (!offer) throw new AppError('Offer not found', { status: 404, code: 'NOT_FOUND' });
  return ok(res, offer, { message: 'Offer updated' });
});

export const deleteOffer = asyncHandler(async (req, res) => {
  const res2 = await repo.deleteById(COLLECTIONS.OFFERS, req.params.id);
  if (!res2.deletedCount) throw new AppError('Offer not found', { status: 404, code: 'NOT_FOUND' });
  return ok(res, { deleted: true }, { message: 'Offer deleted' });
});

export const getSettings = asyncHandler(async (_req, res) => {
  const settings = await repo.findOne(COLLECTIONS.SETTINGS, {});
  return ok(res, settings || { deliveryFee: 39, freeDeliveryThreshold: 499 }, { message: 'Settings fetched' });
});

export const updateSettings = asyncHandler(async (req, res) => {
  const ing = await repo.findOne(COLLECTIONS.SETTINGS, {});
  const patch = pickPatch(['deliveryFee', 'freeDeliveryThreshold', 'adminCommissionPercent', 'helpEmail', 'helpPhone'], req.body);
  const updated = ing
    ? await repo.updateById(COLLECTIONS.SETTINGS, ing._id, { $set: patch })
    : await repo.insertOne(COLLECTIONS.SETTINGS, { _id: 'settings-singleton', ...patch });
  await audit(req, { action: 'SETTINGS_UPDATED', entity: 'settings', entityId: 'settings-singleton' });
  return ok(res, updated, { message: 'Settings updated' });
});

export const getAdminProducts = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.search) filter.$or = [
    { name: { $regex: String(req.query.search), $options: 'i' } },
    { brand: { $regex: String(req.query.search), $options: 'i' } },
  ];
  if (req.query.category) filter.category = req.query.category;
  if (req.query.active === 'true') filter.active = true;
  if (req.query.active === 'false') filter.active = false;
  const rows = await repo.findMany(COLLECTIONS.PRODUCTS, filter, { sort: { createdAt: -1 }, limit: Number(req.query.limit) || 500 });
  return ok(res, rows.map(withId), { message: 'Products fetched' });
});

export const getAdminInventory = asyncHandler(async (_req, res) => {
  const [products, stores] = await Promise.all([
    repo.findMany(COLLECTIONS.PRODUCTS, {}, { sort: { name: 1 } }),
    repo.findMany(COLLECTIONS.STORES, {}),
  ]);
  const storeMap = Object.fromEntries(stores.map((s) => [s._id, s]));
  return ok(res, products.map((p) => ({
    id: p.id || p._id,
    name: p.name,
    emoji: p.emoji,
    color: p.color,
    weight: p.weight,
    stock: p.stock || 0,
    storeStock: p.storeStock || {},
    stores: storeMap,
  })), { message: 'Inventory fetched' });
});

export const updateInventory = asyncHandler(async (req, res) => {
  const patch = pickPatch(['stock', 'storeStock', 'lowStockThreshold'], req.body);
  if (typeof patch.storeStock !== 'object' && patch.storeStock !== undefined) delete patch.storeStock;
  const product = await repo.updateById(COLLECTIONS.PRODUCTS, req.params.productId, { $set: patch });
  if (!product) throw new AppError('Product not found', { status: 404, code: 'NOT_FOUND' });
  await audit(req, { action: 'INVENTORY_UPDATED', entity: 'products', entityId: product._id, details: { stock: patch.stock } });
  return ok(res, product, { message: 'Inventory updated' });
});

export const getAdminBanners = asyncHandler(async (_req, res) => {
  const banners = await repo.findMany(COLLECTIONS.BANNERS, {}, { sort: { position: 1 } });
  return ok(res, banners.map(withId), { message: 'Banners fetched' });
});

export const createBanner = asyncHandler(async (req, res) => {
  const { title, type, emoji, subtitle, ctaText, ctaLink, bgColor, textColor, position, active, image } = req.body;
  const banner = await repo.insertOne(COLLECTIONS.BANNERS, {
    _id: id('bn'),
    title: title || '',
    type: type || 'main',
    emoji: emoji || '🛒',
    subtitle: subtitle || '',
    ctaText: ctaText || 'Shop now',
    ctaLink: ctaLink || '/',
    bgColor: bgColor || 'from-brand-600 to-violet-600',
    textColor: textColor || 'text-white',
    position: Number(position) || 0,
    active: active !== false,
    image: image || null,
  });
  return ok(res, banner, { message: 'Banner created', status: 201 });
});

export const updateBanner = asyncHandler(async (req, res) => {
  const patch = pickPatch(['title', 'type', 'emoji', 'subtitle', 'ctaText', 'ctaLink', 'bgColor', 'textColor', 'position', 'active', 'image'], req.body);
  const banner = await repo.updateById(COLLECTIONS.BANNERS, req.params.id, { $set: patch });
  if (!banner) throw new AppError('Banner not found', { status: 404, code: 'NOT_FOUND' });
  return ok(res, banner, { message: 'Banner updated' });
});

export const deleteBanner = asyncHandler(async (req, res) => {
  const res2 = await repo.deleteById(COLLECTIONS.BANNERS, req.params.id);
  if (!res2.deletedCount) throw new AppError('Banner not found', { status: 404, code: 'NOT_FOUND' });
  return ok(res, { deleted: true }, { message: 'Banner deleted' });
});

const adminController = {
  getDashboard, getRecentOrders, getAdminOrders, getReports, getAdminUsers, updateUserStatus,
  getDeliveryPartnersAdmin, updateDeliveryPartnerStatus,
  createProduct, updateProduct, deleteProduct, createCategory, updateCategory, deleteCategory,
  createStore, updateStore, deleteStore, getOffersAdmin, createOffer, updateOffer, deleteOffer,
  getSettings, updateSettings, getAdminProducts, getAdminInventory, updateInventory,
  getAdminBanners, createBanner, updateBanner, deleteBanner,
};
export default adminController;
export { computeAnalytics };