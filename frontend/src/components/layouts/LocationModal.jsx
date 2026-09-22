import { useState } from 'react';
import { X, MapPin, Navigation, Search } from 'lucide-react';
import Modal from '../ui/Modal.jsx';
import { useLocationCtx } from '../../context/LocationContext.jsx';
import { useUI } from '../../context/UIContext.jsx';
import { cn } from '../../utils/cn.js';

const SAVED_LOCATIONS = [
  { label: 'Home', address: 'B-402, Sunshine Apartments, Veera Desai Road, Mumbai 400053', storeId: 'st-1', latitude: 19.1304, longitude: 72.8224 },
  { label: 'Work', address: '12th Floor, Tech Tower, BKC, Bandra East, Mumbai 400051', storeId: 'st-1', latitude: 19.0625, longitude: 72.8369 },
  { label: 'Salt Lake', address: 'Sector V, Salt Lake, Kolkata 700091', storeId: 'st-2', latitude: 22.5751, longitude: 88.4353 },
  { label: 'New Town', address: 'Action Area III, New Town, Kolkata 700160', storeId: 'st-4', latitude: 22.5761, longitude: 88.4808 },
];

export default function LocationModal() {
  const { locationOpen, setLocationOpen } = useUI();
  const { location, setLocation, stores } = useLocationCtx();
  const [query, setQuery] = useState('');

  const filtered = SAVED_LOCATIONS.filter(
    (l) => !query || `${l.label} ${l.address}`.toLowerCase().includes(query.toLowerCase())
  );

  const pick = (loc) => {
    setLocation(loc);
    setLocationOpen(false);
  };

  const useCurrent = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          pick({
            label: 'My Current Location',
            address: `Lat ${pos.coords.latitude.toFixed(4)}, Lng ${pos.coords.longitude.toFixed(4)}`,
            storeId: storageFor(pos.coords.latitude, pos.coords.longitude),
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
        },
        () => pick({ label: 'Mumbai', address: 'Veera Desai Road, Andheri West, Mumbai', storeId: 'st-1' })
      );
    } else {
      pick({ label: 'Mumbai', address: 'Veera Desai Road, Andheri West, Mumbai', storeId: 'st-1' });
    }
  };

  return (
    <Modal open={locationOpen} onClose={() => setLocationOpen(false)} title="Choose your delivery location">
      <div className="space-y-4">
        <button onClick={useCurrent} className="btn-primary w-full justify-center">
          <Navigation size={16} /> Use My Current Location
        </button>

        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search area, street, city" className="input pl-10" aria-label="Search location" />
        </div>

        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Saved Locations</p>
          <ul className="space-y-1.5">
            {filtered.map((l) => {
              const store = stores.find((s) => s.id === l.storeId);
              const active = location?.storeId === l.storeId && location?.label === l.label;
              return (
                <li key={l.address}>
                  <button
                    onClick={() => pick(l)}
                    className={cn(
                      'w-full flex items-start gap-3 rounded-xl border p-3 text-left transition cursor-pointer',
                      active ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:border-brand-300 hover:bg-slate-50'
                    )}
                  >
                    <MapPin size={18} className={cn('mt-0.5 shrink-0', active ? 'text-brand-600' : 'text-slate-400')} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800">{l.label}</p>
                      <p className="text-xs text-slate-500 truncate">{l.address}</p>
                      {store && <p className="text-[11px] text-success font-medium mt-0.5">{store.name}</p>}
                    </div>
                  </button>
                </li>
              );
            })}
            {filtered.length === 0 && <p className="text-sm text-slate-400 py-3 text-center">No locations found</p>}
          </ul>
        </div>

        <p className="text-[11px] text-slate-400 flex items-start gap-1.5">
          <MapPin size={12} className="shrink-0 mt-0.5" />
          Delivery is available within the serviceable radius of selected QuickMart stores.
        </p>
      </div>
    </Modal>
  );
}

function storageFor() {
  return 'st-1';
}