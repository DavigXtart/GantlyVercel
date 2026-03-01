import { useState, useEffect } from 'react';

export default function GlobalLoader() {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      setLoading((e as CustomEvent).detail.loading);
    };
    window.addEventListener('loading-change', handler);
    return () => window.removeEventListener('loading-change', handler);
  }, []);

  if (!loading) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '3px',
      zIndex: 99999,
      overflow: 'hidden',
      background: 'rgba(16, 185, 129, 0.2)',
    }}>
      <div style={{
        height: '100%',
        width: '40%',
        background: 'linear-gradient(90deg, #10b981, #34d399, #6ee7b7)',
        borderRadius: '0 2px 2px 0',
        animation: 'globalLoaderSlide 1.2s ease-in-out infinite',
      }} />
      <style>{`
        @keyframes globalLoaderSlide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(350%); }
        }
      `}</style>
    </div>
  );
}
