import { useState, useEffect } from 'react';

interface CookieBannerProps {
  onPrivacyClick?: () => void;
}

export default function CookieBanner({ onPrivacyClick }: CookieBannerProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (consent === null) {
      setVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setVisible(false);
  };

  const handleReject = () => {
    localStorage.setItem('cookie-consent', 'rejected');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9998] backdrop-blur-xl bg-white/92 border-t border-gantly-blue-100 shadow-elevated animate-[cookieBannerSlideUp_0.4s_ease-out]">
      <div className="max-w-[1200px] mx-auto px-6 py-5 flex items-center justify-between gap-5 flex-wrap">
        <div className="flex-1 min-w-[280px]">
          <p className="m-0 text-sm leading-relaxed text-slate-700">
            Usamos cookies esenciales para el funcionamiento de la app.
            {' '}
            <span
              onClick={onPrivacyClick}
              role="link"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onPrivacyClick?.();
                }
              }}
              className="text-gantly-blue-500 underline cursor-pointer font-medium hover:text-gantly-blue-700"
            >
              Política de privacidad
            </span>
          </p>
        </div>

        <div className="flex gap-3 shrink-0">
          <button
            onClick={handleReject}
            className="px-6 py-2.5 rounded-lg border border-slate-200 bg-transparent text-gantly-muted text-sm font-medium cursor-pointer transition-all duration-200 hover:border-slate-300 hover:text-slate-700"
          >
            Rechazar
          </button>
          <button
            onClick={handleAccept}
            className="px-6 py-2.5 rounded-lg border-none bg-gantly-blue-500 text-white text-sm font-semibold cursor-pointer transition-all duration-200 shadow-glow-blue hover:bg-gantly-blue-600"
          >
            Aceptar
          </button>
        </div>
      </div>

      <style>{`
        @keyframes cookieBannerSlideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
