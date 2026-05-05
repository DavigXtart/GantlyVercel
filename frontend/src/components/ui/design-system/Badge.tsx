import { cn } from '@/lib/utils';

type BadgeVariant = 'active' | 'inactive' | 'pending' | 'paid' | 'error' | 'info';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, string> = {
  active: 'bg-gantly-emerald-50 text-gantly-emerald-700 border-gantly-emerald-200',
  inactive: 'bg-slate-100 text-slate-600 border-slate-200',
  pending: 'bg-gantly-gold-50 text-gantly-gold-700 border-gantly-gold-200',
  paid: 'bg-gantly-blue-50 text-gantly-blue-700 border-gantly-blue-200',
  error: 'bg-red-50 text-red-700 border-red-200',
  info: 'bg-gantly-cyan-50 text-gantly-cyan-700 border-gantly-cyan-200',
};

export function Badge({ variant = 'info', className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
