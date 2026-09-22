import { Router } from 'express';

import { env } from '../config/env.js';
import { auth, optionalAuth, requireRole, requireAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { authLimiter, apiLimiter } from '../middleware/rateLimit.js';

import authController from '../controllers/authController.js';
import userController from '../controllers/userController.js';
import catalogController from '../controllers/catalogController.js';
import cartController from '../controllers/cartController.js';
import orderController from '../controllers/orderController.js';
import paymentController from '../controllers/paymentController.js';
import deliveryController from '../controllers/deliveryController.js';
import couponController from '../controllers/couponController.js';
import reviewController from '../controllers/reviewController.js';
import supportController from '../controllers/supportController.js';
import adminController from '../controllers/adminController.js';
import superAdminController from '../controllers/superAdminController.js';

const router = Router();
router.use(apiLimiter);

// ---- health ----
router.get('/health', (_req, res) => {
  res.json({ success: true, status: 'ok', time: new Date().toISOString(), env: env.nodeEnv });
});

// ---- auth ----
router.post('/auth/register', authLimiter, authController.register);
router.post('/auth/login', authLimiter, authController.login);
router.post('/auth/google', authLimiter, authController.googleSignIn);
router.post('/auth/logout', authController.logout);
router.post('/auth/refresh', authController.refresh);
router.post('/auth/forgot-password', authLimiter, authController.forgotPassword);
router.post('/auth/reset-password', authLimiter, authController.resetPassword);
router.post('/auth/verify-otp', authLimiter, authController.verifyOtp);

// ---- products (public reads) ----
router.get('/products', optionalAuth, catalogController.getProducts);
router.get('/products/suggest', catalogController.getSearchSuggestions);
router.get('/products/:id', catalogController.getProduct);
router.get('/products/:id/related', catalogController.getRelatedProducts);
router.get('/products/:id/reviews', catalogController.getProductReviews);

// ---- categories / stores / banners / offers ----
router.get('/categories', catalogController.getCategories);
router.get('/categories/:id', catalogController.getCategory);
router.get('/stores', catalogController.getStores);
router.get('/stores/:id', catalogController.getStore);
router.get('/banners', catalogController.getBanners);
router.get('/banners/freshness', catalogController.getFreshnessBanners);
router.get('/offers', catalogController.getOffers);
router.get('/delivery/partners/:id', deliveryController.getDeliveryPartnerById);

// ---- coupons ----
router.get('/coupons', couponController.getCoupons);
router.post('/coupons/validate', couponController.validateCoupon);

// ---- users (profile, addresses, wishlist, notifications) ----
router.get('/users/me', auth, userController.getProfile);
router.patch('/users/me', auth, userController.updateProfile);
router.get('/users/me/orders', auth, userController.getMyOrders);
router.get('/users/me/wishlist', auth, userController.getWishlist);
router.post('/users/me/wishlist/:productId', auth, userController.toggleWishlist);
router.get('/users/me/addresses', auth, userController.getAddresses);
router.post('/users/me/addresses', auth, userController.addAddress);
router.patch('/users/me/addresses/:addressId', auth, userController.updateAddress);
router.delete('/users/me/addresses/:addressId', auth, userController.deleteAddress);
router.get('/users/me/notifications', auth, userController.getNotifications);
router.post('/users/me/notifications/read', auth, userController.markNotificationsRead);

// ---- cart ----
router.get('/cart', auth, cartController.getCartSummary);
router.post('/cart/items', auth, validate, cartController.addCartItem);
router.patch('/cart/items/:productId', auth, validate, cartController.updateCartItem);
router.delete('/cart/items/:productId', auth, cartController.removeCartItem);
router.delete('/cart', auth, cartController.clearCart);
router.post('/cart/coupon', auth, cartController.applyCoupon);

// ---- orders ----
router.post('/orders', auth, orderController.placeOrder);
router.get('/orders', auth, orderController.getMyOrdersList);
router.get('/orders/:id', auth, orderController.getOrder);
router.patch('/orders/:id/status', auth, requireAdmin, orderController.updateOrderStatus);
router.post('/orders/:id/cancel', auth, orderController.cancelOrder);
router.post('/orders/:id/reorder', auth, orderController.reorder);

// ---- payments ----
router.post('/payments/create', auth, paymentController.createPayment);
router.post('/payments/verify', auth, paymentController.verifyPaymentControl);
router.post('/payments/webhook', paymentController.paymentWebhook);

// ---- delivery partner ----
router.get('/delivery/orders', auth, requireRole('DELIVERY_PARTNER'), deliveryController.getDeliveryOrders);
router.get('/delivery/profile', auth, requireRole('DELIVERY_PARTNER'), deliveryController.getDeliveryProfile);
router.post('/delivery/orders/:id/accept', auth, requireRole('DELIVERY_PARTNER'), deliveryController.acceptOrder);
router.patch('/delivery/orders/:id/status', auth, requireRole('DELIVERY_PARTNER'), deliveryController.updateStatus);
router.post('/delivery/orders/:id/verify-otp', auth, requireRole('DELIVERY_PARTNER'), deliveryController.verifyOtp);

// ---- reviews ----
router.post('/reviews', auth, reviewController.addReview);
router.delete('/reviews/:id', auth, reviewController.deleteReview);

// ---- support ----
router.post('/support/tickets', auth, supportController.createTicket);
router.get('/support/tickets/my', auth, supportController.getMyTickets);

// ---------------- Admin ----------------
router.get('/admin/dashboard', auth, requireAdmin, adminController.getDashboard);
router.get('/admin/reports', auth, requireAdmin, adminController.getReports);
router.get('/admin/orders', auth, requireAdmin, adminController.getAdminOrders);
router.get('/admin/orders/recent', auth, requireAdmin, adminController.getRecentOrders);
router.get('/admin/users', auth, requireAdmin, adminController.getAdminUsers);
router.patch('/admin/users/:id/status', auth, requireAdmin, adminController.updateUserStatus);
router.get('/admin/delivery', auth, requireAdmin, adminController.getDeliveryPartnersAdmin);
router.patch('/admin/delivery/:id', auth, requireAdmin, adminController.updateDeliveryPartnerStatus);
router.get('/admin/reviews', auth, requireAdmin, reviewController.getAdminReviews);
router.get('/admin/tickets', auth, requireAdmin, supportController.getAllTickets);
router.patch('/admin/tickets/:id/reply', auth, requireAdmin, supportController.replyTicket);
router.patch('/admin/tickets/:id/status', auth, requireAdmin, supportController.updateTicketStatus);
router.get('/admin/settings', auth, requireAdmin, adminController.getSettings);
router.patch('/admin/settings', auth, requireAdmin, adminController.updateSettings);
router.get('/admin/offers', auth, requireAdmin, adminController.getOffersAdmin);
router.get('/admin/inventory', auth, requireAdmin, adminController.getAdminInventory);
router.patch('/admin/inventory/:productId', auth, requireAdmin, adminController.updateInventory);
router.get('/admin/banners', auth, requireAdmin, adminController.getAdminBanners);
router.post('/banners', auth, requireAdmin, adminController.createBanner);
router.patch('/banners/:id', auth, requireAdmin, adminController.updateBanner);
router.delete('/banners/:id', auth, requireAdmin, adminController.deleteBanner);

// admin-guarded catalog CRUD
router.get('/admin/products', auth, requireAdmin, adminController.getAdminProducts);
router.post('/products', auth, requireAdmin, adminController.createProduct);
router.patch('/products/:id', auth, requireAdmin, adminController.updateProduct);
router.delete('/products/:id', auth, requireAdmin, adminController.deleteProduct);
router.post('/categories', auth, requireAdmin, adminController.createCategory);
router.patch('/categories/:id', auth, requireAdmin, adminController.updateCategory);
router.delete('/categories/:id', auth, requireAdmin, adminController.deleteCategory);
router.post('/stores', auth, requireAdmin, adminController.createStore);
router.patch('/stores/:id', auth, requireAdmin, adminController.updateStore);
router.delete('/stores/:id', auth, requireAdmin, adminController.deleteStore);
router.post('/coupons', auth, requireAdmin, couponController.createCoupon);
router.patch('/coupons/:id', auth, requireAdmin, couponController.updateCoupon);
router.delete('/coupons/:id', auth, requireAdmin, couponController.deleteCoupon);
router.post('/offers', auth, requireAdmin, adminController.createOffer);
router.patch('/offers/:id', auth, requireAdmin, adminController.updateOffer);
router.delete('/offers/:id', auth, requireAdmin, adminController.deleteOffer);

// ---------------- Super Admin ----------------
router.get('/super-admin/audit-logs', auth, requireRole('SUPER_ADMIN'), superAdminController.getAuditLogs);
router.get('/super-admin/admins', auth, requireRole('SUPER_ADMIN'), superAdminController.getAdmins);
router.post('/super-admin/admins', auth, requireRole('SUPER_ADMIN'), superAdminController.createAdmin);
router.patch('/super-admin/admins/:id', auth, requireRole('SUPER_ADMIN'), superAdminController.updateAdmin);
router.delete('/super-admin/admins/:id', auth, requireRole('SUPER_ADMIN'), superAdminController.deleteAdmin);
router.get('/super-admin/stats', auth, requireRole('SUPER_ADMIN'), superAdminController.platformStats);
router.get('/super-admin/users', auth, requireRole('SUPER_ADMIN'), superAdminController.getAllUsersSuper);
router.get('/super-admin/settings/security', auth, requireRole('SUPER_ADMIN'), superAdminController.getSecuritySettings);
router.patch('/super-admin/settings/security', auth, requireRole('SUPER_ADMIN'), superAdminController.updateSecuritySettings);

export default router;