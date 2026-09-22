import { env } from '../config/env.js';

const R = 6371; // earth radius km

export function haversineKm(lat1, lon1, lat2, lon2) {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/**
 * Pick the store closest to a customer, provided it is inside the store's
 * delivery radius. Falls back to the nearest active store regardless of radius.
 */
export async function findEligibleStore({ stores, latitude, longitude }) {
  const withDistance = stores
    .filter((s) => s && s.status === 'active')
    .map((s) => ({
      ...s,
      distanceKm: s.latitude != null && s.longitude != null
        ? haversineKm(latitude, longitude, s.latitude, s.longitude)
        : 9999,
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm);

  const inRadius = withDistance.find((s) => s.distanceKm <= (s.deliveryRadius || env.defaultRadiusKm));
  return inRadius || withDistance[0] || null;
}

export async function estimateEta(store, customer) {
  const distKm = store.distanceKm || haversineKm(customer.latitude, customer.longitude, store.latitude, store.longitude);
  // ~6 km/h walking/packing + 45 km/h riding blended heuristic
  const minutes = Math.round(store.deliveryRadius ? 18 + distKm * 2.2 : 32);
  return { minutes, label: `${Math.min(55, minutes)} min` };
}

const maps = { findEligibleStore, estimateEta, haversineKm };
export default maps;