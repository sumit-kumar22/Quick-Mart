import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';

const CartContext = createContext(null);
const KEY = 'quickmart_cart';

const defaultCart = { items: [], coupon: null };

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : defaultCart;
    } catch {
      return defaultCart;
    }
  });

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(cart));
  }, [cart]);

  const addItem = useCallback((product, variantId, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.items.find(
        (i) => i.productId === product.id && i.variantId === (variantId || product.variants[0].id)
      );
      const vid = variantId || product.variants[0].id;
      const variant = product.variants.find((v) => v.id === vid) || product.variants[0];
      if (existing) {
        return {
          ...prev,
          items: prev.items.map((i) =>
            i.productId === product.id && i.variantId === vid
              ? { ...i, quantity: Math.min(i.quantity + quantity, product.maxQty || 10) }
              : i
          ),
        };
      }
      return {
        ...prev,
        items: [
          ...prev.items,
          {
            id: `${product.id}-${vid}`,
            productId: product.id,
            variantId: vid,
            name: product.name,
            emoji: product.emoji,
            color: product.color,
            image: product.image || '',
            weight: variant.weight,
            unitSize: variant.unitSize,
            mrp: variant.mrp,
            price: variant.price,
            quantity,
            maxQty: product.maxQty || 10,
          },
        ],
      };
    });
  }, []);

  const updateQuantity = useCallback((itemId, quantity) => {
    setCart((prev) => ({
      ...prev,
      items: quantity <= 0
        ? prev.items.filter((i) => i.id !== itemId)
        : prev.items.map((i) => (i.id === itemId ? { ...i, quantity: Math.min(quantity, i.maxQty) } : i)),
    }));
  }, []);

  const removeItem = useCallback((itemId) => {
    setCart((prev) => ({ ...prev, items: prev.items.filter((i) => i.id !== itemId) }));
  }, []);

  const clearCart = useCallback(() => {
    setCart({ items: [], coupon: null });
  }, []);

  const applyCoupon = useCallback((coupon) => {
    setCart((prev) => ({ ...prev, coupon }));
  }, []);

  const removeCoupon = useCallback(() => {
    setCart((prev) => ({ ...prev, coupon: null }));
  }, []);

  const moveItemToWishlist = useCallback((itemId, callback) => {
    setCart((prev) => ({ ...prev, items: prev.items.filter((i) => i.id !== itemId) }));
    if (callback) callback(itemId);
  }, []);

  const totals = useMemo(() => {
    const itemCount = cart.items.reduce((s, i) => s + i.quantity, 0);
    const subtotal = cart.items.reduce((s, i) => s + i.price * i.quantity, 0);
    const mrpTotal = cart.items.reduce((s, i) => s + i.mrp * i.quantity, 0);
    let discount = mrpTotal - subtotal;
    let couponDiscount = 0;
    if (cart.coupon) {
      const c = cart.coupon;
      if (c.type === 'flat') couponDiscount = c.amount;
      if (c.type === 'percentage') couponDiscount = Math.min((subtotal * c.percentage) / 100, c.maxDiscount || Infinity);
    }
    couponDiscount = Math.min(couponDiscount, subtotal - discount);
    const tax = Math.round((subtotal - discount - couponDiscount) * 0.05 * 100) / 100;
    const deliveryFee = subtotal - discount - couponDiscount >= 499 ? 0 : 19;
    const platformFee = 3;
    const total = Math.round((subtotal - discount - couponDiscount + tax + deliveryFee + platformFee) * 100) / 100;
    return { itemCount, subtotal, mrpTotal, discount, couponDiscount, tax, deliveryFee, platformFee, total };
  }, [cart]);

  const value = useMemo(
    () => ({ cart, totals, addItem, updateQuantity, removeItem, clearCart, applyCoupon, removeCoupon }),
    [cart, totals, addItem, updateQuantity, removeItem, clearCart, applyCoupon, removeCoupon]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}