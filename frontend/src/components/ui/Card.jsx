import { cn } from '../../utils/cn.js';

export function Card({ children, className, onClick }) {
  return (
    <div onClick={onClick} className={cn('card', onClick && 'cursor-pointer hover:shadow-cardHover transition-shadow', className)}>
      {children}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions, back }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-xl md:text-2xl font-bold">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

export default Card;