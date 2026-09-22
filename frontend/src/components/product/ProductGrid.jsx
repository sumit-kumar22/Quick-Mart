import ProductCard from './ProductCard.jsx';
import { ProductGridSkeleton } from '../ui/Skeleton.jsx';
import ErrorState from '../ui/ErrorState.jsx';
import EmptyState from '../ui/EmptyState.jsx';
import { SearchX } from 'lucide-react';

export default function ProductGrid({ products, loading, error, onRetry, emptyTitle = 'No products found', emptyDescription = 'Try adjusting your search or filters.' }) {
  if (loading) return <ProductGridSkeleton />;
  if (error) return <ErrorState message={error.message} onRetry={onRetry} />;
  if (!products?.length) return <EmptyState title={emptyTitle} description={emptyDescription} icon={SearchX} />;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}