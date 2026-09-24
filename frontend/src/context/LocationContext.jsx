import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { apiService } from '../services/apiService.js';

const LocationContext = createContext(null);
const KEY = 'quickmart_location';

export function LocationProvider({ children }) {
  const [location, setLocationState] = useState(() => {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [stores, setStores] = useState([]);

  useEffect(() => {
    let active = true;
    apiService
      .getStores()
      .then((res) => {
        const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res?.data?.data) ? res.data.data : (Array.isArray(res) ? res : []));
        if (active) setStores(list);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const setLocation = useCallback((loc) => {
    setLocationState(loc);
    localStorage.setItem(KEY, JSON.stringify(loc));
  }, []);

  const eligibleStores = useMemo(() => stores.filter((s) => s.status === 'active'), [stores]);

  const value = useMemo(
    () => ({ location, setLocation, stores: eligibleStores, selectedStore: eligibleStores[0] || null }),
    [location, setLocation, eligibleStores]
  );

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useLocationCtx() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('useLocationCtx must be used within LocationProvider');
  return ctx;
}