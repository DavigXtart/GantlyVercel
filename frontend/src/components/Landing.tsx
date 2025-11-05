import { useState, useEffect, useRef } from 'react';
import PSYmatchLogo from './PSYmatchLogo';
import landingImage from '../assets/Gemini_Generated_Image_m85mytm85mytm85m.png';

interface LandingProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

export default function Landing({ onGetStarted, onLogin }: LandingProps) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const observerRef = useRef<any>(null);

  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const scrollY = window.scrollY;
      const progress = Math.min(scrollY / windowHeight, 1);
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    // Intersection Observer para animaciones de aparición
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('.fade-in').forEach((el) => observerRef.current.observe(el));

    return () => {
      window.removeEventListener('scroll', handleScroll);
      observerRef.current?.disconnect();
    };
  }, []);

  return (
    <div style={{ overflowX: 'hidden', background: '#fefefe' }}>
      <style>{`
        .fade-in {
          opacity: 0;
          transform: translateY(30px);
          transition: opacity 0.8s ease-out, transform 0.8s ease-out;
        }
        .fade-in.visible {
          opacity: 1;
          transform: translateY(0);
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>

      {/* Navigation bar */}
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        background: 'rgba(254, 254, 254, 0.85)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
        padding: '20px 40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <PSYmatchLogo size="small" />
        <button
          onClick={onLogin}
          style={{
            padding: '12px 28px',
            fontSize: '16px',
            fontWeight: 500,
            background: 'transparent',
            color: '#1e3a8a',
            border: '2px solid #2563eb',
            borderRadius: '50px',
            cursor: 'pointer',
            transition: 'all 0.3s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#2563eb';
            e.currentTarget.style.color = 'white';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = '#1e3a8a';
          }}
        >
          Iniciar Sesión
        </button>
      </nav>

      {/* Hero Section */}
      <section
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '140px 20px 80px',
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #f0f9ff 0%, #ecfdf5 50%, #fef3c7 100%)',
          backgroundSize: '200% 200%',
          animation: 'gradient-shift 15s ease infinite',
        }}
      >
        {/* Floating decorative elements */}
        <div
          style={{
            position: 'absolute',
            top: '15%',
            left: '8%',
            width: '120px',
            height: '120px',
            borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%',
            background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(16, 185, 129, 0.15))',
            animation: 'float 8s ease-in-out infinite',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '25%',
            right: '10%',
            width: '80px',
            height: '80px',
            borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%',
            background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.15), rgba(6, 182, 212, 0.15))',
            animation: 'float 6s ease-in-out infinite reverse',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '20%',
            left: '12%',
            width: '100px',
            height: '100px',
            borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(251, 191, 36, 0.1))',
            animation: 'pulse 4s ease-in-out infinite',
          }}
        />

        {/* Logo */}
        <div className="fade-in" style={{ marginBottom: '40px' }}>
          <PSYmatchLogo size="large" />
        </div>

        <h1
          className="fade-in"
          style={{
            fontSize: 'clamp(42px, 8vw, 76px)',
            fontWeight: 700,
            letterSpacing: '-0.04em',
            textAlign: 'center',
            marginBottom: '32px',
            color: '#0f172a',
            lineHeight: '1.1',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          Encuentra tu psicólogo ideal
        </h1>

        <p
          className="fade-in"
          style={{
            fontSize: 'clamp(18px, 2.5vw, 24px)',
            color: '#475569',
            textAlign: 'center',
            maxWidth: '680px',
            marginBottom: '56px',
            lineHeight: '1.7',
            fontWeight: 400,
          }}
        >
          A través de tests personalizados, conectamos contigo el profesional que mejor se adapta a tu situación única. Tu bienestar mental es nuestra prioridad.
        </p>

        <div
          className="fade-in"
          style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '60px' }}
        >
          <button
            onClick={onGetStarted}
            style={{
              padding: '20px 56px',
              fontSize: '18px',
              fontWeight: 600,
              background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #06b6d4 100%)',
              backgroundSize: '200% 200%',
              border: 'none',
              borderRadius: '50px',
              color: 'white',
              cursor: 'pointer',
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 4px 20px rgba(37, 99, 235, 0.3)',
              letterSpacing: '0.5px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
              e.currentTarget.style.boxShadow = '0 8px 30px rgba(37, 99, 235, 0.5)';
              e.currentTarget.style.backgroundPosition = '100% 50%';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(37, 99, 235, 0.3)';
              e.currentTarget.style.backgroundPosition = '0% 50%';
            }}
          >
            Comenzar mi camino
          </button>
        </div>

        {/* Scroll indicator */}
        <div
          style={{
            position: 'absolute',
            bottom: '40px',
            left: '50%',
            transform: 'translateX(-50%)',
            opacity: 1 - scrollProgress * 2,
            transition: 'opacity 0.3s',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <div style={{ textAlign: 'center', color: '#64748b', fontSize: '14px', fontWeight: 500 }}>
            Descubre más
          </div>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" style={{ animation: 'bounce 2s infinite' }}>
            <path d="M12 5v14M19 12l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* Sección 2: Por qué elegirnos */}
      <section
        className="fade-in"
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '120px 20px',
          background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
          position: 'relative',
        }}
      >
        {/* Background pattern */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'radial-gradient(circle at 20% 30%, rgba(6, 182, 212, 0.05) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(16, 185, 129, 0.05) 0%, transparent 50%)',
          pointerEvents: 'none',
        }} />

        <div className="container" style={{ maxWidth: '1100px', position: 'relative', zIndex: 1 }}>
          <h2 style={{
            fontSize: 'clamp(36px, 5vw, 56px)',
            textAlign: 'center',
            marginBottom: '20px',
            fontWeight: 700,
            color: '#0f172a',
            letterSpacing: '-0.02em',
          }}>
            Por qué elegir PSYmatch
          </h2>
          <p
            style={{
              fontSize: 'clamp(18px, 2vw, 22px)',
              color: '#475569',
              textAlign: 'center',
              lineHeight: '1.8',
              maxWidth: '700px',
              margin: '0 auto 80px',
              fontWeight: 400,
            }}
          >
            No todos los caminos hacia el bienestar son iguales. Cada persona tiene sus propias necesidades, y nosotros las entendemos.
          </p>

          {/* Features grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '40px',
            marginTop: '60px',
            maxWidth: '900px',
            margin: '60px auto 0',
          }}>
            <div style={{
              textAlign: 'center',
              padding: '40px 30px',
              background: 'white',
              borderRadius: '24px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
              transition: 'all 0.3s',
              border: '1px solid rgba(0, 0, 0, 0.04)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-8px)';
              e.currentTarget.style.boxShadow = '0 12px 40px rgba(37, 99, 235, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.06)';
            }}
            >
              <div style={{
                width: '100px',
                height: '100px',
                background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                borderRadius: '50%',
                margin: '0 auto 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '48px',
              }}>
                🧩
              </div>
              <h3 style={{ fontSize: '22px', marginBottom: '12px', fontWeight: 600, color: '#0f172a' }}>
                Tests personalizados
              </h3>
              <p style={{ color: '#64748b', lineHeight: '1.7', fontSize: '16px' }}>
                Cada pregunta está diseñada para entender tu situación única y conectar con el profesional adecuado
              </p>
            </div>

            <div style={{
              textAlign: 'center',
              padding: '40px 30px',
              background: 'white',
              borderRadius: '24px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
              transition: 'all 0.3s',
              border: '1px solid rgba(0, 0, 0, 0.04)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-8px)';
              e.currentTarget.style.boxShadow = '0 12px 40px rgba(6, 182, 212, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.06)';
            }}
            >
              <div style={{
                width: '100px',
                height: '100px',
                background: 'linear-gradient(135deg, #ccfbf1 0%, #99f6e4 100%)',
                borderRadius: '50%',
                margin: '0 auto 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '48px',
              }}>
                ✨
              </div>
              <h3 style={{ fontSize: '22px', marginBottom: '12px', fontWeight: 600, color: '#0f172a' }}>
                Matching inteligente
              </h3>
              <p style={{ color: '#64748b', lineHeight: '1.7', fontSize: '16px' }}>
                Nuestro algoritmo conecta tu perfil con psicólogos especializados en lo que realmente necesitas
              </p>
            </div>

            <div style={{
              textAlign: 'center',
              padding: '40px 30px',
              background: 'white',
              borderRadius: '24px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
              transition: 'all 0.3s',
              border: '1px solid rgba(0, 0, 0, 0.04)',
              gridColumn: '1 / -1',
              justifySelf: 'center',
              maxWidth: '450px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-8px)';
              e.currentTarget.style.boxShadow = '0 12px 40px rgba(16, 185, 129, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.06)';
            }}
            >
              <div style={{
                width: '100px',
                height: '100px',
                background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                borderRadius: '50%',
                margin: '0 auto 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '48px',
              }}>
                🔐
              </div>
              <h3 style={{ fontSize: '22px', marginBottom: '12px', fontWeight: 600, color: '#0f172a' }}>
                Privacidad total
              </h3>
              <p style={{ color: '#64748b', lineHeight: '1.7', fontSize: '16px' }}>
                Tus datos están protegidos con los más altos estándares de seguridad y confidencialidad
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Sección 3: Cómo funciona */}
      <section
        className="fade-in"
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          padding: '120px 20px',
          background: 'linear-gradient(135deg, #f0f9ff 0%, #ecfdf5 100%)',
          position: 'relative',
        }}
      >
        <div className="container" style={{ maxWidth: '1200px' }}>
          <h2 style={{
            fontSize: 'clamp(36px, 5vw, 56px)',
            textAlign: 'center',
            marginBottom: '80px',
            fontWeight: 700,
            color: '#0f172a',
            letterSpacing: '-0.02em',
          }}>
            Tres pasos simples
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '50px',
            position: 'relative',
            maxWidth: '900px',
            margin: '0 auto',
          }}>
            {/* Connecting line */}
            <div style={{
              position: 'absolute',
              top: '80px',
              left: '15%',
              right: '15%',
              height: '3px',
              background: 'linear-gradient(90deg, transparent, #06b6d4, transparent)',
              display: 'none',
            }}
            className="desktop-only"
            />

            <div style={{
              textAlign: 'center',
              padding: '50px 30px',
              background: 'white',
              borderRadius: '20px',
              position: 'relative',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #2563eb, #06b6d4)',
                margin: '0 auto 32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '36px',
                fontWeight: 700,
                color: 'white',
                boxShadow: '0 8px 24px rgba(37, 99, 235, 0.3)',
              }}>
                1
              </div>
              <h3 style={{
                fontSize: '24px',
                marginBottom: '16px',
                fontWeight: 600,
                color: '#0f172a',
              }}>
                Completa el test
              </h3>
              <p style={{
                color: '#64748b',
                lineHeight: '1.7',
                fontSize: '16px',
              }}>
                Responde preguntas diseñadas para entenderte mejor. Solo toma unos minutos.
              </p>
            </div>

            <div style={{
              textAlign: 'center',
              padding: '50px 30px',
              background: 'white',
              borderRadius: '20px',
              position: 'relative',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #06b6d4, #10b981)',
                margin: '0 auto 32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '36px',
                fontWeight: 700,
                color: 'white',
                boxShadow: '0 8px 24px rgba(6, 182, 212, 0.3)',
              }}>
                2
              </div>
              <h3 style={{
                fontSize: '24px',
                marginBottom: '16px',
                fontWeight: 600,
                color: '#0f172a',
              }}>
                Analizamos tu perfil
              </h3>
              <p style={{
                color: '#64748b',
                lineHeight: '1.7',
                fontSize: '16px',
              }}>
                Nuestro sistema evalúa tus respuestas para crear un perfil único y personalizado.
              </p>
            </div>

            <div style={{
              textAlign: 'center',
              padding: '50px 30px',
              background: 'white',
              borderRadius: '20px',
              position: 'relative',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
              gridColumn: '1 / -1',
              justifySelf: 'center',
              maxWidth: '450px',
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                margin: '0 auto 32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '36px',
                fontWeight: 700,
                color: 'white',
                boxShadow: '0 8px 24px rgba(16, 185, 129, 0.3)',
              }}>
                3
              </div>
              <h3 style={{
                fontSize: '24px',
                marginBottom: '16px',
                fontWeight: 600,
                color: '#0f172a',
              }}>
                Conecta con tu psicólogo
              </h3>
              <p style={{
                color: '#64748b',
                lineHeight: '1.7',
                fontSize: '16px',
              }}>
                Te emparejamos con el profesional especializado que mejor se adapta a ti.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section
        className="fade-in"
        style={{
          minHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '120px 20px',
          background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 30%, #06b6d4 70%, #10b981 100%)',
          backgroundSize: '200% 200%',
          animation: 'gradient-shift 12s ease infinite',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative circles */}
        <div style={{
          position: 'absolute',
          top: '-100px',
          right: '-100px',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.1)',
          filter: 'blur(60px)',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-150px',
          left: '-150px',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.08)',
          filter: 'blur(80px)',
        }} />

        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <h2
            style={{
              fontSize: 'clamp(40px, 6vw, 64px)',
              color: 'white',
              textAlign: 'center',
              marginBottom: '28px',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              textShadow: '0 2px 20px rgba(0, 0, 0, 0.2)',
            }}
          >
            Tu bienestar empieza aquí
          </h2>
          <p
            style={{
              fontSize: 'clamp(18px, 2.5vw, 24px)',
              color: 'rgba(255, 255, 255, 0.95)',
              textAlign: 'center',
              marginBottom: '56px',
              maxWidth: '680px',
              lineHeight: '1.7',
              fontWeight: 400,
            }}
          >
            Únete a miles de personas que están descubriendo el apoyo psicológico que necesitan para mejorar su vida
          </p>
          <button
            onClick={onGetStarted}
            style={{
              padding: '22px 64px',
              fontSize: '20px',
              fontWeight: 600,
              background: 'white',
              color: '#1e3a8a',
              border: 'none',
              borderRadius: '50px',
              cursor: 'pointer',
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
              letterSpacing: '0.5px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px) scale(1.03)';
              e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.2)';
            }}
          >
            Empezar ahora — Es gratis
          </button>
        </div>

        {/* Footer */}
        <div style={{
          position: 'absolute',
          bottom: '40px',
          left: '50%',
          transform: 'translateX(-50%)',
          color: 'rgba(255, 255, 255, 0.7)',
          fontSize: '14px',
        }}>
          <img
            src={landingImage}
            alt="PSYmatch"
            style={{
              display: 'block',
              width: '120px',
              height: 'auto',
              objectFit: 'contain',
            }}
          />
        </div>
      </section>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(10px); }
        }
        @media (min-width: 768px) {
          .desktop-only {
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
}
