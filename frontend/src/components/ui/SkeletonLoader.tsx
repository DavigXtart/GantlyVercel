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
