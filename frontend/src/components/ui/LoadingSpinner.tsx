import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  text?: string;
  className?: string;
}

export default function LoadingSpinner({
  size = 'medium',
  color,
  text,
  className
}: LoadingSpinnerProps) {
  const sizeClasses = {
    small: 'w-5 h-5 border-2',
    medium: 'w-10 h-10 border-3',
    large: 'w-[60px] h-[60px] border-4',
  };

  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 p-5', className)}>
      <div
        className={cn(
          'rounded-full animate-spin border-gantly-blue-100 border-t-gantly-blue-500',
          sizeClasses[size]
        )}
        style={color ? { borderTopColor: color, borderColor: `${color}20` } : undefined}
      />
      {text && (
        <p className="m-0 text-sm text-gantly-muted">{text}</p>
      )}
    </div>
  );
}
