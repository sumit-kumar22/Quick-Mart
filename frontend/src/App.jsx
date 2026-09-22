import { Routes, Route } from 'react-router-dom';
import CustomerLayout from './components/layouts/CustomerLayout.jsx';
import AuthLayout from './components/layouts/AuthLayout.jsx';
import { ProtectedRoute, PublicOnlyRoute } from './routes/ProtectedRoute.jsx';

import Home from './pages/Home.jsx';
import Categories from './pages/Categories.jsx';
import CategoryPage from './pages/CategoryPage.jsx';
import Search from './pages/Search.jsx';
import ProductDetail from './pages/ProductDetail.jsx';
import CartPage from './pages/CartPage.jsx';
import Checkout from './pages/Checkout.jsx';
import OrderSuccess from './pages/OrderSuccess.jsx';
import Orders from './pages/Orders.jsx';
import OrderDetail from './pages/OrderDetail.jsx';
import TrackOrder from './pages/TrackOrder.jsx';
import Wishlist from './pages/Wishlist.jsx';
import Profile from './pages/Profile.jsx';
import Addresses from './pages/Addresses.jsx';
import Coupons from './pages/Coupons.jsx';
import Notifications from './pages/Notifications.jsx';
import Support from './pages/Support.jsx';

import Login from './pages/auth/Login.jsx';
import Register from './pages/auth/Register.jsx';
import ForgotPassword from './pages/auth/ForgotPassword.jsx';

import DeliveryLogin from './pages/delivery/DeliveryLogin.jsx';
import DeliveryLayout from './components/layouts/DeliveryLayout.jsx';
import DeliveryDashboard from './pages/delivery/DeliveryDashboard.jsx';
import DeliveryOrders from './pages/delivery/DeliveryOrders.jsx';
import DeliveryOrderDetail from './pages/delivery/DeliveryOrderDetail.jsx';
import DeliveryEarnings from './pages/delivery/DeliveryEarnings.jsx';

import AdminLayout from './components/layouts/AdminLayout.jsx';
import AdminLogin from './pages/admin/AdminLogin.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import AdminOrders from './pages/admin/AdminOrders.jsx';
import AdminProducts from './pages/admin/AdminProducts.jsx';
import AdminCategories from './pages/admin/AdminCategories.jsx';
import AdminInventory from './pages/admin/AdminInventory.jsx';
import AdminUsers from './pages/admin/AdminUsers.jsx';
import AdminDelivery from './pages/admin/AdminDelivery.jsx';
import AdminStores from './pages/admin/AdminStores.jsx';
import AdminOffers from './pages/admin/AdminOffers.jsx';
import AdminReports from './pages/admin/AdminReports.jsx';
import AdminSettings from './pages/admin/AdminSettings.jsx';

import SuperAdminLayout from './components/layouts/SuperAdminLayout.jsx';
import SuperAdminLogin from './pages/super-admin/SuperAdminLogin.jsx';
import SuperAdminDashboard from './pages/super-admin/SuperAdminDashboard.jsx';
import SuperAdminStores from './pages/super-admin/SuperAdminStores.jsx';
import SuperAdminOrders from './pages/super-admin/SuperAdminOrders.jsx';
import SuperAdminAdmins from './pages/super-admin/SuperAdminAdmins.jsx';
import SuperAdminUsers from './pages/super-admin/SuperAdminUsers.jsx';
import SuperAdminDelivery from './pages/super-admin/SuperAdminDelivery.jsx';
import SuperAdminProducts from './pages/super-admin/SuperAdminProducts.jsx';
import SuperAdminCategories from './pages/super-admin/SuperAdminCategories.jsx';
import SuperAdminReports from './pages/super-admin/SuperAdminReports.jsx';
import SuperAdminSettings from './pages/super-admin/SuperAdminSettings.jsx';
import SuperAdminSecurity from './pages/super-admin/SuperAdminSecurity.jsx';
import SuperAdminAuditLogs from './pages/super-admin/SuperAdminAuditLogs.jsx';

export default function App() {
  return (
    <Routes>
      {/* ---- Customer ---- */}
      <Route element={<CustomerLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/category/:slug" element={<CategoryPage />} />
        <Route path="/search" element={<Search />} />
        <Route path="/product/:slug" element={<ProductDetail />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/orders" element={<ProtectedRoute roles={['CUSTOMER']}><Orders /></ProtectedRoute>} />
        <Route path="/orders/:id" element={<ProtectedRoute roles={['CUSTOMER']}><OrderDetail /></ProtectedRoute>} />
        <Route path="/track-order/:id" element={<ProtectedRoute roles={['CUSTOMER']}><TrackOrder /></ProtectedRoute>} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/profile" element={<ProtectedRoute roles={['CUSTOMER']}><Profile /></ProtectedRoute>} />
        <Route path="/addresses" element={<ProtectedRoute roles={['CUSTOMER']}><Addresses /></ProtectedRoute>} />
        <Route path="/coupons" element={<Coupons />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/support" element={<Support />} />
      </Route>
      <Route path="/checkout" element={<ProtectedRoute roles={['CUSTOMER']}><Checkout /></ProtectedRoute>} />
      <Route path="/order-success/:orderId" element={<ProtectedRoute roles={['CUSTOMER']}><OrderSuccess /></ProtectedRoute>} />

      {/* ---- Auth ---- */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
        <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />
        <Route path="/forgot-password" element={<PublicOnlyRoute><ForgotPassword /></PublicOnlyRoute>} />
      </Route>

      {/* ---- Delivery ---- */}
      <Route path="/delivery/login" element={<DeliveryLogin />} />
      <Route element={<ProtectedRoute roles={['DELIVERY_PARTNER']}><DeliveryLayout /></ProtectedRoute>}>
        <Route path="/delivery/dashboard" element={<DeliveryDashboard />} />
        <Route path="/delivery/orders" element={<DeliveryOrders />} />
        <Route path="/delivery/orders/:id" element={<DeliveryOrderDetail />} />
        <Route path="/delivery/earnings" element={<DeliveryEarnings />} />
      </Route>

      {/* ---- Admin ---- */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route element={<ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN']}><AdminLayout /></ProtectedRoute>}>
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/orders" element={<AdminOrders />} />
        <Route path="/admin/products" element={<AdminProducts />} />
        <Route path="/admin/categories" element={<AdminCategories />} />
        <Route path="/admin/inventory" element={<AdminInventory />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/delivery" element={<AdminDelivery />} />
        <Route path="/admin/stores" element={<AdminStores />} />
        <Route path="/admin/offers" element={<AdminOffers />} />
        <Route path="/admin/reports" element={<AdminReports />} />
        <Route path="/admin/settings" element={<AdminSettings />} />
      </Route>

      {/* ---- Super Admin ---- */}
      <Route path="/super-admin/login" element={<SuperAdminLogin />} />
      <Route element={<ProtectedRoute roles={['SUPER_ADMIN']}><SuperAdminLayout /></ProtectedRoute>}>
        <Route path="/super-admin/dashboard" element={<SuperAdminDashboard />} />
        <Route path="/super-admin/stores" element={<SuperAdminStores />} />
        <Route path="/super-admin/orders" element={<SuperAdminOrders />} />
        <Route path="/super-admin/admins" element={<SuperAdminAdmins />} />
        <Route path="/super-admin/users" element={<SuperAdminUsers />} />
        <Route path="/super-admin/delivery" element={<SuperAdminDelivery />} />
        <Route path="/super-admin/products" element={<SuperAdminProducts />} />
        <Route path="/super-admin/categories" element={<SuperAdminCategories />} />
        <Route path="/super-admin/reports" element={<SuperAdminReports />} />
        <Route path="/super-admin/settings" element={<SuperAdminSettings />} />
        <Route path="/super-admin/security" element={<SuperAdminSecurity />} />
        <Route path="/super-admin/audit-logs" element={<SuperAdminAuditLogs />} />
      </Route>

      <Route path="*" element={<Home />} />
    </Routes>
  );
}