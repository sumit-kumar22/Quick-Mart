import { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn.js';

export default function Modal({ open, onClose, title, children, footer, size = 'md', closable = true }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape' && closable) onClose?.();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, closable, onClose]);

  if (!open) return null;

  const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

  return (
    <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm animate-fade-in" onClick={() => closable && onClose?.()} />
      <div
        className={cn('relative w-full bg-white rounded-t-card sm:rounded-card shadow-modal animate-scale-in max-h-[92vh] flex flex-col', sizes[size])}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h3 className="text-base font-semibold">{title}</h3>
            {closable && (
              <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer" aria-label="Close">
                <X size={18} />
              </button>
            )}
          </div>
        )}
        <div className="px-5 py-4 overflow-y-auto thin-scroll flex-1">{children}</div>
        {footer && <div className="px-5 py-4 border-t border-slate-100 flex justify-end gap-3">{footer}</div>}
      </div>
    </div>
  );
}