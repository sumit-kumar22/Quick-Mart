import { Link } from 'react-router-dom';
import { useAsync } from '../../hooks/useAsync.js';
import { apiService } from '../../services/apiService.js';
import { Skeleton } from '../ui/Skeleton.jsx';

export default function PromoBanners() {
  const { data, loading } = useAsync(() => apiService.getFreshnessBanners(), []);
  if (loading) return <div className="grid grid-cols-2 md:grid-cols-4 gap-3"><Skeleton className="h-32 rounded-card" /><Skeleton className="h-32 rounded-card" /><Skeleton className="h-32 rounded-card" /><Skeleton className="h-32 rounded-card" /></div>;
  if (!data?.length) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {data.map((b) => (
        <Link
          key={b.id}
          to={b.link}
          className="relative overflow-hidden rounded-card p-4 flex flex-col justify-end min-h-32 transition hover:scale-[1.02] shadow-card group"
        >
          {b.imageUrl && <img src={b.imageUrl} alt={b.title} loading="lazy" className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition duration-300" />}
          <div className={`absolute inset-0 bg-gradient-to-br ${b.gradient} opacity-90`} />
          {b.imageUrl && <div className="absolute inset-0 bg-black/20" />}
          <span className="absolute right-3 top-3 text-3xl drop-shadow z-10" aria-hidden="true">{b.image}</span>
          {b.imageUrl && <span className="absolute -right-2 -top-2 text-5xl opacity-0 z-0" aria-hidden="true" />}
          <h3 className="relative text-sm font-bold text-white drop-shadow">{b.title}</h3>
          <p className="relative text-[11px] text-white/90 mt-0.5">{b.subtitle}</p>
        </Link>
      ))}
    </div>
  );
}