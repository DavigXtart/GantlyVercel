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
    <div className="fixed top-0 left-0 w-full h-[3px] z-[99999] overflow-hidden bg-gantly-blue-100">
      <div className="h-full w-[40%] bg-gradient-to-r from-gantly-blue-500 via-gantly-cyan-400 to-gantly-blue-300 rounded-r animate-[globalLoaderSlide_1.2s_ease-in-out_infinite]" />
      <style>{`
        @keyframes globalLoaderSlide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(350%); }
        }
      `}</style>
    </div>
  );
}
