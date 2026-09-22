import {
  products,
  getProduct,
  getProductsByCategory,
  getFeaturedProducts,
  getBestsellers,
  getNewArrivals,
  searchProducts,
} from '../data/products.js';
import { categories } from '../data/categories.js';
import { stores } from '../data/stores.js';
import banners, { freshnessBanners } from '../data/banners.js';
import coupons from '../data/coupons.js';
import { orders, getOrder, getOrdersByUser } from '../data/orders.js';
import { users, currentUser } from '../data/users.js';
import reviews from '../data/reviews.js';
import { notifications } from '../data/notifications.js';
import { offers } from '../data/coupons.js';
import { deliveryPartners } from '../data/users.js';
import { adminAnalytics, recentOrders, auditLogs } from '../data/admin.js';

const delay = (ms = 350) => new Promise((r) => setTimeout(r, ms));

function ok(data, meta) {
  return { success: true, message: 'OK', data, meta };
}

export const mockApi = {
  // ---- products ----
  getProducts: async ({ category, search, featured, bestseller, newArrival, page = 1, limit = 20, sort = 'relevance', filters = {} } = {}) => {
    await delay();
    let list = [...products];
    if (category) list = list.filter((p) => p.category === category);
    if (search) list = searchProducts(search);
    else if (featured) list = getFeaturedProducts();
    else if (bestseller) list = getBestsellers();
    else if (newArrival) list = getNewArrivals();
    if (filters.priceMin != null) list = list.filter((p) => p.sellingPrice >= filters.priceMin);
    if (filters.priceMax != null) list = list.filter((p) => p.sellingPrice <= filters.priceMax);
    if (filters.brands && filters.brands.length) list = list.filter((p) => filters.brands.includes(p.brand));
    if (filters.maxDiscount != null) list = list.filter((p) => p.discount >= filters.maxDiscount);
    if (filters.rating != null) list = list.filter((p) => p.rating >= filters.rating);
    switch (sort) {
      case 'price-asc': list.sort((a, b) => a.sellingPrice - b.sellingPrice); break;
      case 'price-desc': list.sort((a, b) => b.sellingPrice - a.sellingPrice); break;
      case 'discount': list.sort((a, b) => b.discount - a.discount); break;
      case 'rating': list.sort((a, b) => b.rating - a.rating); break;
      case 'newest': list.sort((a, b) => (b.newArrival ? 1 : 0) - (a.newArrival ? 1 : 0)); break;
      default: list.sort((a, b) => (b.bestseller ? 1 : 0) - (a.bestseller ? 1 : 0));
    }
    const total = list.length;
    const start = (page - 1) * limit;
    return ok(list.slice(start, start + limit), { page, limit, total });
  },

  getProduct: async (slug) => {
    await delay(250);
    const p = getProduct(slug);
    if (!p) throw Object.assign(new Error('Product not found'), { code: 'NOT_FOUND' });
    return ok(p);
  },

  getRelatedProducts: async (product) => {
    await delay(200);
    return ok(products.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 8));
  },

  getProductReviews: async (productId) => {
    await delay(200);
    return ok(reviews.filter((r) => r.productId === productId));
  },

  getSearchSuggestions: async (query) => {
    await delay(150);
    const results = query ? searchProducts(query).slice(0, 6) : getBestsellers().slice(0, 6);
    return ok(results.map((p) => ({ id: p.id, name: p.name, emoji: p.emoji, price: p.sellingPrice })));
  },

  // ---- categories / banners ----
  getCategories: async () => {
    await delay(250);
    return ok(categories);
  },
  getBanners: async () => ok(banners),
  getFreshnessBanners: async () => ok(freshnessBanners),
  getOffers: async () => ok(offers),

  // ---- stores ----
  getStores: async () => {
    await delay(250);
    return ok(stores);
  },

  // ---- coupons ----
  getCoupons: async () => ok(coupons),
  validateCoupon: async (code, amount) => {
    await delay(400);
    const coupon = coupons.find((c) => c.code.toUpperCase() === String(code).toUpperCase());
    if (!coupon) throw Object.assign(new Error('This coupon is no longer valid'), { code: 'INVALID_COUPON' });
    if (!coupon.active) throw Object.assign(new Error('This coupon is no longer valid'), { code: 'INVALID_COUPON' });
    if (new Date(coupon.endDate) < new Date()) throw Object.assign(new Error('This coupon has expired'), { code: 'COUPON_EXPIRED' });
    if (coupon.minCartValue > amount) throw Object.assign(new Error(`Add ${amount - coupon.minCartValue >= 0 ? 'more' : ''} items worth ₹${coupon.minCartValue} to use this coupon`), { code: 'MIN_CART_NOT_MET' });
    return ok(coupon);
  },

  // ---- cart / orders ----
  getCart: async () => ok({ items: [], coupon: null }),
  placeOrder: async (payload) => {
    await delay(1200);
    return ok({ orderId: `ord-${Date.now()}`, status: 'PENDING' });
  },
  getOrders: async (userId) => ok(getOrdersByUser(userId)),
  getOrder: async (id) => {
    const o = getOrder(id);
    if (!o) throw Object.assign(new Error('Order not found'), { code: 'NOT_FOUND' });
    return ok(o);
  },
  cancelOrder: async (id) => {
    await delay(700);
    return ok({ id, status: 'CANCELLED' });
  },
  reorder: async (id) => ok({ orderId: `ord-${Date.now()}` }),

  // ---- user ----
  register: async (data) => ok({ ...data, id: 'u-new' }),
  login: async (data) => ok({ token: 'mock-token', user: currentUser }),
  getProfile: async () => ok(currentUser),
  updateProfile: async (patch) => ok({ ...currentUser, ...patch }),
  getAddresses: async () => ok(currentUser.addresses),
  getNotifications: async (userId) => ok(notifications.filter((n) => n.userId === userId || !n.userId)),
  getWishlist: async () => ok(products.filter((p) => currentUser.wishlist.includes(p.id))),

  // ---- admin ----
  getAdminDashboard: async () => ok(adminAnalytics),
  getRecentOrders: async () => ok(recentOrders),
  getAdminOrders: async () => ok(orders),
  getAdminReports: async () => ok({
    grossRevenue: '₹30,21,400',
    revenueGrowth: 12.4,
    totalOrders: 12480,
    orderGrowth: 8.9,
    avgOrderValue: '₹242',
    storeCount: 4,
    revenueTrend: [
      { month: 'May', revenue: 1820000 },
      { month: 'Jun', revenue: 2140000 },
      { month: 'Jul', revenue: 1980000 },
      { month: 'Aug', revenue: 2510000 },
      { month: 'Sep', revenue: 3021400 },
    ],
    categorySales: (adminAnalytics.topCategories || []).map((c) => ({ name: c.name, revenue: c.revenue })),
    paymentMethods: [
      { name: 'upi', value: 52 },
      { name: 'cod', value: 22 },
      { name: 'card', value: 18 },
      { name: 'wallet', value: 8 },
    ],
    topProducts: adminAnalytics.topProducts || [],
    storePerformance: (adminAnalytics.storePerformance || []).map((s) => {
      const total = adminAnalytics.storePerformance.reduce((t, x) => t + x.revenue, 0) || 1;
      return { ...s, share: Math.round((s.revenue / total) * 100) };
    }),
  }),
  getAllUsers: async () => ok(users),
  getDeliveryPartners: async () => ok(deliveryPartners),
  getAuditLogs: async () => ok(auditLogs),
  getAdminReviews: async () => ok(reviews),
};

export default mockApi;