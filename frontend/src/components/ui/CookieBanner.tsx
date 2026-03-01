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
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 9998,
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      background: 'rgba(255, 255, 255, 0.92)',
      borderTop: '1px solid rgba(90, 146, 112, 0.25)',
      boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.08)',
      animation: 'cookieBannerSlideUp 0.4s ease-out',
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '20px',
        flexWrap: 'wrap',
        fontFamily: "'Inter', sans-serif",
      }}>
        <div style={{
          flex: 1,
          minWidth: '280px',
        }}>
          <p style={{
            margin: 0,
            fontSize: '14px',
            lineHeight: '1.6',
            color: '#374151',
          }}>
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
              style={{
                color: '#5a9270',
                textDecoration: 'underline',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              Política de privacidad
            </span>
          </p>
        </div>

        <div style={{
          display: 'flex',
          gap: '12px',
          flexShrink: 0,
        }}>
          <button
            onClick={handleReject}
            style={{
              padding: '10px 24px',
              borderRadius: '8px',
              border: '1px solid #d1d5db',
              background: 'transparent',
              color: '#6b7280',
              fontSize: '14px',
              fontWeight: 500,
              fontFamily: "'Inter', sans-serif",
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#9ca3af';
              e.currentTarget.style.color = '#374151';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#d1d5db';
              e.currentTarget.style.color = '#6b7280';
            }}
          >
            Rechazar
          </button>
          <button
            onClick={handleAccept}
            style={{
              padding: '10px 24px',
              borderRadius: '8px',
              border: 'none',
              background: '#5a9270',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: 600,
              fontFamily: "'Inter', sans-serif",
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 8px rgba(90, 146, 112, 0.3)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#4a7f5f';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(90, 146, 112, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#5a9270';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(90, 146, 112, 0.3)';
            }}
          >
            Aceptar
          </button>
        </div>
      </div>

      <style>{`
        @keyframes cookieBannerSlideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
