import { useState } from 'react';

export default function CrisisButton() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      {/* Floating SOS Button */}
      <button
        onClick={() => setModalOpen(true)}
        aria-label="Ayuda de crisis"
        className="fixed bottom-6 right-6 z-[9999] w-14 h-14 rounded-full border-none bg-red-600 text-white text-base font-extrabold tracking-wider cursor-pointer flex items-center justify-center hover:scale-110 transition-transform"
        style={{
          boxShadow: '0 4px 16px rgba(220, 38, 38, 0.45)',
          animation: 'sosPulse 2s ease-in-out infinite',
        }}
      >
        SOS
      </button>

      {/* Modal Overlay */}
      {modalOpen && (
        <div
          onClick={() => setModalOpen(false)}
          className="fixed inset-0 z-[10000] bg-black/40 backdrop-blur-sm flex items-center justify-center p-5"
          style={{ animation: 'crisisOverlayFadeIn 0.2s ease-out' }}
        >
          {/* Modal Content */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-[440px] w-full p-8 relative shadow-elevated border border-gantly-blue/10 font-body"
            style={{ animation: 'crisisModalSlideIn 0.3s ease-out' }}
          >
            {/* Close Button */}
            <button
              onClick={() => setModalOpen(false)}
              aria-label="Cerrar"
              className="absolute top-4 right-4 w-8 h-8 rounded-full border border-gantly-blue/15 bg-gantly-cloud text-gantly-muted text-lg cursor-pointer flex items-center justify-center leading-none hover:bg-gantly-blue-50 hover:border-gantly-blue/30 transition-all"
            >
              x
            </button>

            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-full bg-gantly-blue/10 flex items-center justify-center mx-auto mb-3">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#2E93CC"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </div>
              <h2 className="m-0 text-xl font-bold text-gantly-navy">
                Recursos de ayuda en crisis
              </h2>
              <p className="mt-2 text-sm text-gantly-muted leading-relaxed">
                No estas solo/a. Hay personas dispuestas a ayudarte ahora mismo.
              </p>
            </div>

            {/* Contact Links */}
            <div className="flex flex-col gap-2.5 mb-5">
              {/* Telefono de la Esperanza */}
              <a
                href="tel:024"
                className="flex items-center gap-3.5 px-4 py-3.5 rounded-2xl bg-gantly-blue/[0.04] border border-gantly-blue/10 no-underline text-gantly-navy hover:bg-gantly-blue/10 hover:border-gantly-blue/20 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-gantly-blue flex items-center justify-center shrink-0">
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
                  <div className="font-semibold text-[15px] text-gantly-navy">
                    Telefono de la Esperanza
                  </div>
                  <div className="text-xl font-bold text-gantly-blue">
                    024
                  </div>
                </div>
              </a>

              {/* Emergencias 112 */}
              <a
                href="tel:112"
                className="flex items-center gap-3.5 px-4 py-3.5 rounded-2xl bg-gantly-blue/[0.04] border border-gantly-blue/10 no-underline text-gantly-navy hover:bg-gantly-blue/10 hover:border-gantly-blue/20 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-600 flex items-center justify-center shrink-0">
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
                  <div className="font-semibold text-[15px] text-gantly-navy">
                    Emergencias
                  </div>
                  <div className="text-xl font-bold text-amber-600">
                    112
                  </div>
                </div>
              </a>

              {/* Chat de Crisis */}
              <a
                href="https://www.telefonodelaesperanza.org"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3.5 px-4 py-3.5 rounded-2xl bg-gantly-blue/[0.04] border border-gantly-blue/10 no-underline text-gantly-navy hover:bg-gantly-blue/10 hover:border-gantly-blue/20 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-gantly-blue flex items-center justify-center shrink-0">
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
                  <div className="font-semibold text-[15px] text-gantly-navy">
                    Chat de crisis
                  </div>
                  <div className="text-[13px] text-gantly-blue">
                    telefonodelaesperanza.org
                  </div>
                </div>
              </a>
            </div>

            {/* Safety Warning */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3.5 mb-4">
              <p className="m-0 text-sm font-semibold text-amber-800 leading-relaxed">
                Si estas en peligro inmediato, llama al 112.
              </p>
            </div>

            {/* Disclaimer */}
            <p className="m-0 text-xs text-gantly-muted leading-relaxed text-center">
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
