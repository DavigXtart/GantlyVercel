import { cn } from '@/lib/utils';

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface SidebarProps {
  items: SidebarItem[];
  activeId: string;
  onSelect: (id: string) => void;
  variant?: 'warm' | 'saas';
  header?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function Sidebar({
  items,
  activeId,
  onSelect,
  variant = 'warm',
  header,
  footer,
  className,
}: SidebarProps) {
  const containerStyles = {
    warm: 'bg-white/80 backdrop-blur-sm border-r border-gantly-blue-100',
    saas: 'bg-white border-r border-slate-200',
  };

  const itemActiveStyles = {
    warm: 'bg-gantly-blue-50 text-gantly-blue-600 border-r-gantly-blue-500',
    saas: 'bg-slate-100 text-slate-900 border-r-slate-900',
  };

  const itemHoverStyles = {
    warm: 'hover:bg-gantly-blue-50/50 hover:text-gantly-blue-500',
    saas: 'hover:bg-slate-50 hover:text-slate-700',
  };

  return (
    <aside
      className={cn(
        'w-[72px] md:w-[200px] flex flex-col shrink-0 sticky top-0 h-screen',
        containerStyles[variant],
        className
      )}
    >
      {header && <div className="p-3 md:p-4 border-b border-inherit">{header}</div>}

      <nav className="flex-1 flex flex-col gap-1 p-2 md:p-3 overflow-y-auto">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            className={cn(
              'flex flex-col md:flex-row items-center md:items-center gap-1 md:gap-3',
              'w-full px-2 md:px-3 py-2.5 rounded-xl border-r-2 border-r-transparent',
              'text-gantly-muted text-[11px] md:text-sm font-medium',
              'transition-all duration-150 cursor-pointer',
              itemHoverStyles[variant],
              activeId === item.id && itemActiveStyles[variant]
            )}
          >
            <span className="text-lg md:text-base flex-shrink-0">{item.icon}</span>
            <span className="truncate hidden md:block">{item.label}</span>
          </button>
        ))}
      </nav>

      {footer && <div className="p-3 md:p-4 border-t border-inherit">{footer}</div>}
    </aside>
  );
}
