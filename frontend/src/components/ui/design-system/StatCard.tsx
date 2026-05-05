import { cn } from '@/lib/utils';

interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: { value: string; positive: boolean };
  variant?: 'default' | 'warm' | 'saas';
}

export function StatCard({
  label,
  value,
  icon,
  trend,
  variant = 'default',
  className,
  ...props
}: StatCardProps) {
  const bgStyles = {
    default: 'bg-white border-[var(--color-border-light)]',
    warm: 'bg-gantly-cloud-100 border-gantly-blue-100',
    saas: 'bg-white border-slate-200',
  };

  return (
    <div
      className={cn(
        'rounded-2xl border p-5 shadow-soft transition-all duration-200 hover:shadow-card',
        bgStyles[variant],
        className
      )}
      {...props}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gantly-muted mb-1">{label}</p>
          <p className="text-2xl font-heading font-bold text-gantly-text">{value}</p>
          {trend && (
            <p className={cn(
              'text-xs font-medium mt-1',
              trend.positive ? 'text-gantly-emerald-600' : 'text-red-500'
            )}>
              {trend.positive ? '+' : ''}{trend.value}
            </p>
          )}
        </div>
        {icon && (
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gantly-blue-50 flex items-center justify-center text-gantly-blue-500">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
