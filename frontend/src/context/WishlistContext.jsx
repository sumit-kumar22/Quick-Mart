import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { apiService } from '../services/apiService.js';
import { useAuth } from './AuthContext.jsx';

const WishlistContext = createContext(null);
const KEY = 'quickmart_wishlist';

function readIds() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function WishlistProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const [items, setItems] = useState(readIds);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let active = true;
    apiService
      .getWishlist()
      .then((res) => {
        if (!active) return;
        const list = res?.data?.data ?? [];
        setProducts(list);
        setItems(list.map((p) => p.id || p._id).filter(Boolean));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(items));
  }, [items]);

  const syncProducts = useCallback((nextIds) => {
    setItems(nextIds);
    setProducts((prev) => prev.filter((p) => nextIds.includes(p.id || p._id)));
  }, []);

  const toggle = useCallback(
    async (productId) => {
      const has = items.includes(productId);
      const nextIds = has ? items.filter((id) => id !== productId) : [...items, productId];
      syncProducts(nextIds);
      try {
        await apiService.toggleWishlist(productId);
      } catch {
        syncProducts(items);
      }
    },
    [items, syncProducts]
  );

  const isWishlisted = useCallback((productId) => items.includes(productId), [items]);

  const remove = useCallback(
    async (productId) => {
      await toggle(productId);
    },
    [toggle]
  );

  const value = useMemo(
    () => ({ items, products, toggle, isWishlisted, remove }),
    [items, products, toggle, isWishlisted, remove]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
}