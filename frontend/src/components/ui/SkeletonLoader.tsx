import { cn } from '@/lib/utils';

interface SkeletonLoaderProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
  count?: number;
  className?: string;
}

export default function SkeletonLoader({
  width = '100%',
  height = '20px',
  borderRadius = '8px',
  count = 1,
  className
}: SkeletonLoaderProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={cn('animate-pulse bg-slate-200 rounded-lg', className)}
          style={{
            width: typeof width === 'number' ? `${width}px` : width,
            height: typeof height === 'number' ? `${height}px` : height,
            borderRadius,
            marginBottom: count > 1 ? '8px' : '0'
          }}
        />
      ))}
    </>
  );
}

/** Skeleton for a card with title + 2-3 lines of text */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('bg-white rounded-2xl border border-slate-100 p-5 space-y-3', className)}>
      <div className="animate-pulse bg-slate-200 rounded-lg h-4 w-1/3" />
      <div className="animate-pulse bg-slate-100 rounded-lg h-3 w-full" />
      <div className="animate-pulse bg-slate-100 rounded-lg h-3 w-2/3" />
    </div>
  );
}

/** Skeleton for a list of items (appointment list, patient list, etc.) */
export function SkeletonList({ rows = 3, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-100">
          <div className="animate-pulse bg-slate-200 rounded-full w-10 h-10 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="animate-pulse bg-slate-200 rounded h-3.5 w-2/5" />
            <div className="animate-pulse bg-slate-100 rounded h-3 w-3/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Skeleton for stat cards (KPIs) */
export function SkeletonStats({ count = 3, className }: { count?: number; className?: string }) {
  return (
    <div className={cn('grid grid-cols-1 sm:grid-cols-3 gap-4', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3">
          <div className="animate-pulse bg-slate-100 rounded h-3 w-20" />
          <div className="animate-pulse bg-slate-200 rounded-lg h-7 w-16" />
        </div>
      ))}
    </div>
  );
}
