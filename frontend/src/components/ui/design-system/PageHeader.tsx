import { cn } from '@/lib/utils';

interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  avatar?: React.ReactNode;
  actions?: React.ReactNode;
}

export function PageHeader({
  title,
  subtitle,
  avatar,
  actions,
  className,
  ...props
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 pb-6',
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-4">
        {avatar && (
          <div className="flex-shrink-0">{avatar}</div>
        )}
        <div>
          <h1 className="text-2xl font-heading font-bold text-gantly-text">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-gantly-muted mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-3 flex-shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
