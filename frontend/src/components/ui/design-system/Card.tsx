import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'warm' | 'saas';
  padding?: 'sm' | 'md' | 'lg';
  hover?: boolean;
}

const variantStyles = {
  default: 'bg-white border border-[var(--color-border-light)] shadow-card',
  warm: 'bg-gantly-cloud-100 border border-gantly-blue-100 shadow-card',
  saas: 'bg-white border border-slate-200 shadow-soft',
};

const paddingStyles = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export function Card({
  variant = 'default',
  padding = 'md',
  hover = false,
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl transition-all duration-200',
        variantStyles[variant],
        paddingStyles[padding],
        hover && 'hover:shadow-elevated hover:-translate-y-0.5 cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
