import mockApi from './mockApi.js';
import api from './api.js';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

const withId = (d) => (d && typeof d === 'object' && !Object.prototype.hasOwnProperty.call(d, 'id') ? { ...d, id: d.id || d._id || d.orderId } : d);

const listData = (r) => {
  const raw = r.data?.data ?? [];
  return { ...r.data, data: Array.isArray(raw) ? raw.map(withId) : raw };
};

const oneData = (r) => {
  const raw = r.data?.data ?? r.data;
  return { ...r.data, data: withId(raw) };
};

const plain = (r) => r.data;

export const apiService = {
  // ---- products ----
  getProducts: (params) => (USE_MOCK ? mockApi.getProducts(params) : api.get('/products', { params }).then(plain)),
  getProduct: (slug) => (USE_MOCK ? mockApi.getProduct(slug) : api.get(`/products/${slug}`).then(oneData)),
  getRelatedProducts: (product) => (USE_MOCK ? mockApi.getRelatedProducts(product) : api.get(`/products/${product.id}/related`).then(listData)),
  getProductReviews: (id) => (USE_MOCK ? mockApi.getProductReviews(id) : api.get(`/products/${id}/reviews`).then(plain)),
  getSearchSuggestions: (q) => (USE_MOCK ? mockApi.getSearchSuggestions(q) : api.get('/products/suggest', { params: { q } }).then(plain)),

  // ---- categories / stores / banners / offers ----
  getCategories: () => (USE_MOCK ? mockApi.getCategories() : api.get('/categories').then(listData)),
  getCategory: (id) => (USE_MOCK ? mockApi.getCategory?.(id) : api.get(`/categories/${id}`).then(oneData)),
  getBanners: () => (USE_MOCK ? mockApi.getBanners() : api.get('/banners').then(listData)),
  getFreshnessBanners: () => (USE_MOCK ? mockApi.getFreshnessBanners() : api.get('/banners/freshness').then(listData)),
  getStores: () => (USE_MOCK ? mockApi.getStores() : api.get('/stores').then(plain)),
  getStore: (id) => (USE_MOCK ? mockApi.getStore?.(id) : api.get(`/stores/${id}`).then(plain)),
  getOffers: () => (USE_MOCK ? mockApi.getOffers() : api.get('/offers').then(plain)),

  // ---- coupons ----
  getCoupons: () => (USE_MOCK ? mockApi.getCoupons() : api.get('/coupons').then(plain)),
  validateCoupon: (code, amount) => (USE_MOCK ? mockApi.validateCoupon(code, amount) : api.post('/coupons/validate', { code, amount }).then(plain)),
  createCoupon: (data) => (USE_MOCK ? okStub({ ...data, id: 'cp-new' }) : api.post('/coupons', data).then(plain)),
  updateCoupon: (id, data) => (USE_MOCK ? okStub({ id, ...data }) : api.patch(`/coupons/${id}`, data).then(plain)),
  deleteCoupon: (id) => (USE_MOCK ? okStub({ deleted: true }) : api.delete(`/coupons/${id}`).then(plain)),

  // ---- orders (customer) ----
  placeOrder: (payload) => (USE_MOCK ? mockApi.placeOrder(payload) : api.post('/orders', payload).then(oneData)),
  getOrders: (userId) => (USE_MOCK ? mockApi.getOrders(userId) : api.get('/users/me/orders').then(listData)),
  getOrder: (id) => (USE_MOCK ? mockApi.getOrder(id) : api.get(`/orders/${id}`).then(oneData)),
  cancelOrder: (id) => (USE_MOCK ? mockApi.cancelOrder(id) : api.post(`/orders/${id}/cancel`).then(oneData)),
  reorder: (id) => (USE_MOCK ? mockApi.reorder(id) : api.post(`/orders/${id}/reorder`).then(plain)),
  updateOrderStatus: (id, status) => (USE_MOCK ? okStub({ id, status }) : api.patch(`/orders/${id}/status`, { status }).then(oneData)),

  // ---- auth ----
  login: (data) => (USE_MOCK ? mockApi.login(data) : api.post('/auth/login', data).then(plain)),
  googleSignIn: (credential) => (USE_MOCK ? mockApi.login({ email: 'aarav@example.com', password: 'customer123' }) : api.post('/auth/google', { credential }).then(plain)),
  register: (data) => (USE_MOCK ? mockApi.register(data) : api.post('/auth/register', data).then(plain)),
  logout: () => (USE_MOCK ? okStub({ loggedOut: true }) : api.post('/auth/logout').then(plain)),
  verifyOtp: (data) => (USE_MOCK ? okStub({ verified: true }) : api.post('/auth/verify-otp', data).then(plain)),
  forgotPassword: (data) => (USE_MOCK ? okStub({ sent: true }) : api.post('/auth/forgot-password', data).then(plain)),
  resetPassword: (data) => (USE_MOCK ? okStub({ reset: true }) : api.post('/auth/reset-password', data).then(plain)),

  // ---- user profile / addresses / wishlist / notifications ----
  getProfile: () => (USE_MOCK ? mockApi.getProfile() : api.get('/users/me').then(oneData)),
  updateProfile: (patch) => (USE_MOCK ? mockApi.updateProfile(patch) : api.patch('/users/me', patch).then(oneData)),
  getAddresses: () => (USE_MOCK ? mockApi.getAddresses() : api.get('/users/me/addresses').then(plain)),
  addAddress: (data) => (USE_MOCK ? okStub({ id: `ad-${Date.now()}`, ...data }) : api.post('/users/me/addresses', data).then(plain)),
  updateAddress: (id, data) => (USE_MOCK ? okStub({ id, ...data }) : api.patch(`/users/me/addresses/${id}`, data).then(plain)),
  deleteAddress: (id) => (USE_MOCK ? okStub({ deleted: true }) : api.delete(`/users/me/addresses/${id}`).then(plain)),
  getNotifications: () => (USE_MOCK ? mockApi.getNotifications() : api.get('/users/me/notifications').then(plain)),
  markNotificationsRead: () => (USE_MOCK ? okStub({ updated: 0 }) : api.post('/users/me/notifications/read').then(plain)),
  getWishlist: () => (USE_MOCK ? mockApi.getWishlist() : api.get('/users/me/wishlist').then(listData)),
  toggleWishlist: (productId) => (USE_MOCK ? okStub({ wishlist: [], inWishlist: true }) : api.post(`/users/me/wishlist/${productId}`).then(plain)),

  // ---- reviews ----
  addReview: (data) => (USE_MOCK ? okStub({ ...data, id: `rev-${Date.now()}` }) : api.post('/reviews', data).then(plain)),
  deleteReview: (id) => (USE_MOCK ? okStub({ deleted: true }) : api.delete(`/reviews/${id}`).then(plain)),
  getAdminReviews: () => (USE_MOCK ? mockApi.getAdminReviews() : api.get('/admin/reviews').then(plain)),

  // ---- support ----
  createTicket: (data) => (USE_MOCK ? okStub({ ...data, id: `tk-${Date.now()}` }) : api.post('/support/tickets', data).then(plain)),
  getMyTickets: () => (USE_MOCK ? okStub([]) : api.get('/support/tickets/my').then(plain)),
  getAdminTickets: () => (USE_MOCK ? okStub([]) : api.get('/admin/tickets').then(plain)),
  replyTicket: (id, data) => (USE_MOCK ? okStub({ id }) : api.patch(`/admin/tickets/${id}/reply`, data).then(plain)),
  updateTicketStatus: (id, status) => (USE_MOCK ? okStub({ id, status }) : api.patch(`/admin/tickets/${id}/status`, { status }).then(plain)),

  // ---- admin ----
  getAdminDashboard: () => (USE_MOCK ? mockApi.getAdminDashboard() : api.get('/admin/dashboard').then(plain)),
  getRecentOrders: () => (USE_MOCK ? mockApi.getRecentOrders() : api.get('/admin/orders/recent').then(plain)),
  getAdminOrders: (params) => (USE_MOCK ? mockApi.getAdminOrders() : api.get('/admin/orders', { params }).then(listData)),
  getAdminReports: () => (USE_MOCK ? mockApi.getAdminReports() : api.get('/admin/reports').then(plain)),
  getAllUsers: () => (USE_MOCK ? mockApi.getAllUsers() : api.get('/admin/users').then(plain)),
  updateUserStatus: (id, status) => (USE_MOCK ? okStub({ id, status }) : api.patch(`/admin/users/${id}/status`, { status }).then(plain)),
  getDeliveryPartners: () => (USE_MOCK ? mockApi.getDeliveryPartners() : api.get('/admin/delivery').then(plain)),
  updateDeliveryPartner: (id, patch) => (USE_MOCK ? okStub({ id, ...patch }) : api.patch(`/admin/delivery/${id}`, patch).then(plain)),
  getAdminOffers: () => (USE_MOCK ? okStub([]) : api.get('/admin/offers').then(plain)),
  createOffer: (data) => (USE_MOCK ? okStub({ ...data, id: `of-${Date.now()}` }) : api.post('/offers', data).then(plain)),
  updateOffer: (id, data) => (USE_MOCK ? okStub({ id, ...data }) : api.patch(`/offers/${id}`, data).then(plain)),
  deleteOffer: (id) => (USE_MOCK ? okStub({ deleted: true }) : api.delete(`/offers/${id}`).then(plain)),
  getAdminProducts: (params) => (USE_MOCK ? mockApi.getProducts(params) : api.get('/admin/products', { params }).then(listData)),
  createProduct: (data) => (USE_MOCK ? okStub({ ...data, id: `p-${Date.now()}` }) : api.post('/products', data).then(plain)),
  updateProduct: (id, data) => (USE_MOCK ? okStub({ id, ...data }) : api.patch(`/products/${id}`, data).then(plain)),
  deleteProduct: (id) => (USE_MOCK ? okStub({ deleted: true }) : api.delete(`/products/${id}`).then(plain)),
  createCategory: (data) => (USE_MOCK ? okStub({ ...data, id: `cat-${Date.now()}` }) : api.post('/categories', data).then(plain)),
  updateCategory: (id, data) => (USE_MOCK ? okStub({ id, ...data }) : api.patch(`/categories/${id}`, data).then(plain)),
  deleteCategory: (id) => (USE_MOCK ? okStub({ deleted: true }) : api.delete(`/categories/${id}`).then(plain)),
  createStore: (data) => (USE_MOCK ? okStub({ ...data, id: `st-${Date.now()}` }) : api.post('/stores', data).then(plain)),
  updateStore: (id, data) => (USE_MOCK ? okStub({ id, ...data }) : api.patch(`/stores/${id}`, data).then(plain)),
  deleteStore: (id) => (USE_MOCK ? okStub({ deleted: true }) : api.delete(`/stores/${id}`).then(plain)),
  getAdminInventory: () => (USE_MOCK ? okStub([]) : api.get('/admin/inventory').then(plain)),
  updateInventory: (productId, patch) => (USE_MOCK ? okStub({ productId, ...patch }) : api.patch(`/admin/inventory/${productId}`, patch).then(plain)),
  getAdminBanners: () => (USE_MOCK ? okStub([]) : api.get('/admin/banners').then(plain)),
  createBanner: (data) => (USE_MOCK ? okStub({ ...data, id: `bn-${Date.now()}` }) : api.post('/banners', data).then(plain)),
  updateBanner: (id, data) => (USE_MOCK ? okStub({ id, ...data }) : api.patch(`/banners/${id}`, data).then(plain)),
  deleteBanner: (id) => (USE_MOCK ? okStub({ deleted: true }) : api.delete(`/banners/${id}`).then(plain)),
  getSettings: () => (USE_MOCK ? okStub({}) : api.get('/admin/settings').then(plain)),
  updateSettings: (data) => (USE_MOCK ? okStub({ ...data }) : api.patch('/admin/settings', data).then(plain)),
  getAuditLogs: () => (USE_MOCK ? mockApi.getAuditLogs() : api.get('/super-admin/audit-logs').then(plain)),

  // ---- super admin ----
  getAdmins: () => (USE_MOCK ? okStub([]) : api.get('/super-admin/admins').then(plain)),
  createAdmin: (data) => (USE_MOCK ? okStub({ ...data, id: `u-${Date.now()}` }) : api.post('/super-admin/admins', data).then(plain)),
  updateAdmin: (id, data) => (USE_MOCK ? okStub({ id, ...data }) : api.patch(`/super-admin/admins/${id}`, data).then(plain)),
  deleteAdmin: (id) => (USE_MOCK ? okStub({ deleted: true }) : api.delete(`/super-admin/admins/${id}`).then(plain)),
  getSuperStats: () => (USE_MOCK ? okStub({}) : api.get('/super-admin/stats').then(plain)),
  getSuperAdminUsers: (params) => (USE_MOCK ? mockApi.getAllUsers() : api.get('/super-admin/users', { params }).then(plain)),
  getSecuritySettings: () => (USE_MOCK ? okStub({ twoFactor: true, sessionTimeout: 30 }) : api.get('/super-admin/settings/security').then(plain)),
  updateSecuritySettings: (data) => (USE_MOCK ? okStub({ ...data }) : api.patch('/super-admin/settings/security', data).then(plain)),

  // ---- delivery partner ----
  getDeliveryOrders: (scope) => (USE_MOCK ? okStub([]) : api.get('/delivery/orders', { params: scope ? { scope } : {} }).then(listData)),
  acceptDeliveryOrder: (id) => (USE_MOCK ? okStub({ id }) : api.post(`/delivery/orders/${id}/accept`).then(oneData)),
  updateDeliveryStatus: (id, data) => (USE_MOCK ? okStub({ id, ...data }) : api.patch(`/delivery/orders/${id}/status`, data).then(oneData)),
  verifyDeliveryOtp: (id, otp) => (USE_MOCK ? okStub({ id }) : api.post(`/delivery/orders/${id}/verify-otp`, { otp }).then(oneData)),
  getDeliveryProfile: () => (USE_MOCK ? okStub({}) : api.get('/delivery/profile').then(plain)),
  getDeliveryPartnerById: (id) => (USE_MOCK ? okStub(null) : api.get(`/delivery/partners/${id}`).then(plain)),
};

function okStub(data) {
  return Promise.resolve({ success: true, message: 'OK', data });
}

export default apiService;