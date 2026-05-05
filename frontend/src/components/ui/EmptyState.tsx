import React from 'react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export default function EmptyState({
  icon = '📭',
  title,
  description,
  action,
  className
}: EmptyStateProps) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center py-12 px-6 text-center',
      className
    )}>
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-xl font-heading font-semibold text-gantly-text mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-gantly-muted max-w-[400px] mb-6">
          {description}
        </p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}
