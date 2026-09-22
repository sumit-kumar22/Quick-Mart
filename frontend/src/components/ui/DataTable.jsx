import { ArrowUpDown, MoreHorizontal } from 'lucide-react';
import { cn } from '../../utils/cn.js';
import Loader from './Loader.jsx';
import EmptyState from './EmptyState.jsx';
import ErrorState from './ErrorState.jsx';

export default function DataTable({ columns, rows, loading, error, onRetry, onRowClick, emptyTitle = 'No data found', emptyDescription = 'Nothing here yet.', emptyIcon, total, page, totalPages, onPageChange }) {
  if (loading) return <Loader label="Loading..." className="py-16" />;
  if (error) return <ErrorState message={error.message} onRetry={onRetry} />;
  if (!rows?.length) return <EmptyState title={emptyTitle} description={emptyDescription} icon={emptyIcon} />;

  return (
    <div>
      <div className="overflow-x-auto thin-scroll">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn('px-4 py-3 text-left font-semibold text-slate-600 whitespace-nowrap', col.sortable && 'cursor-pointer hover:text-brand-600')}
                  onClick={col.sortable ? col.onSort : undefined}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {col.sortable && <ArrowUpDown size={12} className="text-slate-400" />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr
                key={row.id || idx}
                onClick={() => onRowClick?.(row)}
                className={cn('border-b border-slate-100 transition-colors', onRowClick ? 'cursor-pointer hover:bg-brand-50/40' : '')}
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 text-slate-700 whitespace-nowrap">
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm">
          <span className="text-slate-500">Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button className="btn-secondary btn-sm" disabled={page <= 1} onClick={() => onPageChange?.(page - 1)}>Prev</button>
            <button className="btn-secondary btn-sm" disabled={page >= totalPages} onClick={() => onPageChange?.(page + 1)}>Next</button>
          </div>
        </div>
      )}
    </div>
  );
}