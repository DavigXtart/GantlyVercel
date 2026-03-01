import { useState } from 'react';

export default function CrisisButton() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      {/* Floating SOS Button */}
      <button
        onClick={() => setModalOpen(true)}
        aria-label="Ayuda de crisis"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          border: 'none',
          background: '#dc2626',
          color: '#ffffff',
          fontSize: '16px',
          fontWeight: 800,
          fontFamily: "'Inter', sans-serif",
          letterSpacing: '0.5px',
          cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(220, 38, 38, 0.45)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'sosPulse 2s ease-in-out infinite',
          transition: 'transform 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        SOS
      </button>

      {/* Modal Overlay */}
      {modalOpen && (
        <div
          onClick={() => setModalOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 10000,
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            animation: 'crisisOverlayFadeIn 0.2s ease-out',
          }}
        >
          {/* Modal Content */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '440px',
              width: '100%',
              padding: '32px',
              position: 'relative',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
              animation: 'crisisModalSlideIn 0.3s ease-out',
              fontFamily: "'Inter', sans-serif",
            }}
          >
            {/* Close Button */}
            <button
              onClick={() => setModalOpen(false)}
              aria-label="Cerrar"
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                border: 'none',
                background: '#f3f4f6',
                color: '#6b7280',
                fontSize: '18px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: 1,
                transition: 'background 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#e5e7eb';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#f3f4f6';
              }}
            >
              ×
            </button>

            {/* Header */}
            <div style={{
              textAlign: 'center',
              marginBottom: '24px',
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: '#fef2f2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
                fontSize: '24px',
              }}>
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#dc2626"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </div>
              <h2 style={{
                margin: 0,
                fontSize: '20px',
                fontWeight: 700,
                color: '#111827',
              }}>
                Recursos de ayuda en crisis
              </h2>
              <p style={{
                margin: '8px 0 0',
                fontSize: '14px',
                color: '#6b7280',
                lineHeight: '1.5',
              }}>
                No estás solo/a. Hay personas dispuestas a ayudarte ahora mismo.
              </p>
            </div>

            {/* Contact Links */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              marginBottom: '20px',
            }}>
              {/* Telefono de la Esperanza */}
              <a
                href="tel:024"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  textDecoration: 'none',
                  color: '#991b1b',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#fee2e2';
                  e.currentTarget.style.borderColor = '#fca5a5';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#fef2f2';
                  e.currentTarget.style.borderColor = '#fecaca';
                }}
              >
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: '#dc2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '15px' }}>
                    Telefono de la Esperanza
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: '#dc2626' }}>
                    024
                  </div>
                </div>
              </a>

              {/* Emergencias 112 */}
              <a
                href="tel:112"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  background: '#fffbeb',
                  border: '1px solid #fde68a',
                  textDecoration: 'none',
                  color: '#92400e',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#fef3c7';
                  e.currentTarget.style.borderColor = '#fcd34d';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#fffbeb';
                  e.currentTarget.style.borderColor = '#fde68a';
                }}
              >
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: '#d97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '15px' }}>
                    Emergencias
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: '#d97706' }}>
                    112
                  </div>
                </div>
              </a>

              {/* Chat de Crisis */}
              <a
                href="https://www.telefonodelaesperanza.org"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  background: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  textDecoration: 'none',
                  color: '#1e40af',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#dbeafe';
                  e.currentTarget.style.borderColor = '#93c5fd';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#eff6ff';
                  e.currentTarget.style.borderColor = '#bfdbfe';
                }}
              >
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: '#2563eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '15px' }}>
                    Chat de crisis
                  </div>
                  <div style={{ fontSize: '13px', color: '#3b82f6' }}>
                    telefonodelaesperanza.org
                  </div>
                </div>
              </a>
            </div>

            {/* Safety Warning */}
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '10px',
              padding: '14px 16px',
              marginBottom: '16px',
            }}>
              <p style={{
                margin: 0,
                fontSize: '14px',
                fontWeight: 600,
                color: '#991b1b',
                lineHeight: '1.5',
              }}>
                Si estas en peligro inmediato, llama al 112.
              </p>
            </div>

            {/* Disclaimer */}
            <p style={{
              margin: 0,
              fontSize: '12px',
              color: '#9ca3af',
              lineHeight: '1.6',
              textAlign: 'center',
            }}>
              Gantly no es un servicio de emergencias. En caso de crisis, contacta con los
              servicios profesionales indicados. Esta informacion se proporciona como recurso
              orientativo y no sustituye la atencion profesional inmediata.
            </p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes sosPulse {
          0% {
            box-shadow: 0 4px 16px rgba(220, 38, 38, 0.45);
          }
          50% {
            box-shadow: 0 4px 24px rgba(220, 38, 38, 0.7), 0 0 0 8px rgba(220, 38, 38, 0.12);
          }
          100% {
            box-shadow: 0 4px 16px rgba(220, 38, 38, 0.45);
          }
        }
        @keyframes crisisOverlayFadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes crisisModalSlideIn {
          from {
            transform: translateY(20px) scale(0.95);
            opacity: 0;
          }
          to {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}
