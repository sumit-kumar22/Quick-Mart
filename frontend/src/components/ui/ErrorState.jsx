import { AlertTriangle, RotateCcw } from 'lucide-react';

export default function ErrorState({ title = 'Something went wrong', message, onRetry, className }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-4">
      <div className="h-16 w-16 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
        <AlertTriangle size={28} className="text-danger" />
      </div>
      <h3 className="text-base font-semibold text-slate-800">{title}</h3>
      {message && <p className="mt-1 text-sm text-slate-500 max-w-sm">{message}</p>}
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary btn-sm mt-5">
          <RotateCcw size={14} /> Retry
        </button>
      )}
    </div>
  );
}