import { cn } from '@/lib/utils';

interface DashboardShellProps {
  variant?: 'warm' | 'saas';
  sidebar: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function DashboardShell({
  variant = 'warm',
  sidebar,
  children,
  className,
}: DashboardShellProps) {
  const bgStyles = {
    warm: 'bg-gantly-cloud-100',
    saas: 'bg-slate-50',
  };

  return (
    <div className={cn('flex min-h-screen', bgStyles[variant], className)}>
      {sidebar}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
