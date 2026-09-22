import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';

const UIContext = createContext(null);

export function UIProvider({ children }) {
  const [cartOpen, setCartOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const openCart = useCallback(() => setCartOpen(true), []);
  const closeCart = useCallback(() => setCartOpen(false), []);

  const value = useMemo(
    () => ({
      cartOpen, openCart, closeCart,
      locationOpen, setLocationOpen,
      searchOpen, setSearchOpen,
      mobileMenuOpen, setMobileMenuOpen,
    }),
    [cartOpen, openCart, closeCart, locationOpen, searchOpen, mobileMenuOpen]
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI must be used within UIProvider');
  return ctx;
}