import { cn } from '../../utils/cn.js';

export function Skeleton({ className }) {
  return <div className={cn('skeleton rounded-lg', className)} />;
}

export function ProductCardSkeleton() {
  return (
    <div className="card p-3">
      <Skeleton className="aspect-square w-full rounded-xl" />
      <Skeleton className="h-3 w-3/4 mt-3" />
      <Skeleton className="h-2.5 w-1/2 mt-2" />
      <div className="flex items-center justify-between mt-3">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-8 w-16 rounded-lg" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function RowSkeleton({ rows = 6 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}