import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export function ProtectedRoute({ roles = ['CUSTOMER'], children }) {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to={roles.includes('ADMIN') ? '/admin/login' : roles.includes('SUPER_ADMIN') ? '/super-admin/login' : roles.includes('DELIVERY_PARTNER') ? '/delivery/login' : '/login'} state={{ from: location }} replace />;
  }

  if (!roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children || <Outlet />;
}

export function PublicOnlyRoute({ children }) {
  const { isAuthenticated, user } = useAuth();
  if (isAuthenticated && user?.role === 'CUSTOMER') {
    return <Navigate to="/" replace />;
  }
  return children || <Outlet />;
}