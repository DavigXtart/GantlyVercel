import React from 'react';

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
  const skeletonStyle: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    borderRadius,
    background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
    backgroundSize: '200% 100%',
    animation: 'loading 1.5s ease-in-out infinite',
    marginBottom: count > 1 ? '8px' : '0'
  };

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={className}
          style={skeletonStyle}
        />
      ))}
      <style>{`
        @keyframes loading {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
      `}</style>
    </>
  );
}

