import { useState, useEffect, useRef } from 'react';

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
    <div style={{ overflowX: 'hidden', background: '#fafafa' }}>
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
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
      `}</style>

      {/* Hero Section con animación de scroll */}
      <section
        style={{
          minHeight: '120vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'linear-gradient(180deg, #ffffff 0%, #f5f7fa 100%)',
          padding: '80px 20px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Elementos decorativos que aparecen con scroll */}
        <div
          style={{
            position: 'absolute',
            top: `${50 - scrollProgress * 30}%`,
            left: '10%',
            width: '200px',
            height: '200px',
            background: 'radial-gradient(circle, rgba(173, 216, 230, 0.3) 0%, transparent 70%)',
            borderRadius: '50%',
            transform: `translateX(${-scrollProgress * 100}px)`,
            transition: 'transform 0.1s ease-out',
          }}
        />

        <h1
          className="fade-in"
          style={{
            fontSize: '72px',
            fontWeight: 600,
            letterSpacing: '-0.03em',
            textAlign: 'center',
            marginBottom: '24px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            transform: `translateY(${-scrollProgress * 50}px)`,
          }}
        >
          Bienestar Mental
        </h1>

        <p
          className="fade-in"
          style={{
            fontSize: '24px',
            color: '#6b7280',
            textAlign: 'center',
            maxWidth: '700px',
            marginBottom: '48px',
            lineHeight: '1.6',
          }}
        >
          Conectamos tu camino hacia el bienestar psicológico con profesionales especializados
        </p>

        <div
          className="fade-in"
          style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center' }}
        >
          <button
            className="btn"
            onClick={onGetStarted}
            style={{
              width: 'auto',
              padding: '18px 48px',
              fontSize: '18px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              borderRadius: '12px',
              color: 'white',
              cursor: 'pointer',
              transition: 'all 0.3s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(102, 126, 234, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            Comenzar Ahora
          </button>

          <button
            className="btn-secondary"
            onClick={onLogin}
            style={{
              width: 'auto',
              padding: '18px 48px',
              fontSize: '18px',
            }}
          >
            Ya tengo cuenta
          </button>
        </div>

        {/* Indicador de scroll animado */}
        <div
          style={{
            position: 'absolute',
            bottom: '40px',
            left: '50%',
            transform: 'translateX(-50%)',
            opacity: 1 - scrollProgress * 2,
            transition: 'opacity 0.3s',
          }}
        >
          <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: '14px', marginBottom: '8px' }}>
            Desplázate para explorar
          </div>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'bounce 2s infinite' }}>
            <path d="M12 5v14M19 12l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* Sección 2: Misión con revelación progresiva */}
      <section
        className="fade-in"
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '120px 20px',
          background: '#ffffff',
        }}
      >
        <div className="container" style={{ maxWidth: '900px' }}>
          <h2 style={{ fontSize: '48px', textAlign: 'center', marginBottom: '24px', fontWeight: 600 }}>
            Tu Bienestar es Nuestra Prioridad
          </h2>
          <p
            style={{
              fontSize: '20px',
              color: '#6b7280',
              textAlign: 'center',
              lineHeight: '1.8',
              maxWidth: '700px',
              margin: '0 auto',
            }}
          >
            Entendemos que cada persona es única. Por eso, nuestros tests personalizados
            te conectan con psicólogos que realmente comprenden tus necesidades específicas.
          </p>

          {/* Elementos decorativos */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '60px', marginTop: '80px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '120px', height: '120px', background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)', borderRadius: '50%', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px' }}>
                🧠
              </div>
              <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>Tests Personalizados</h3>
              <p style={{ color: '#9ca3af' }}>Diseñados específicamente para ti</p>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '120px', height: '120px', background: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)', borderRadius: '50%', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px' }}>
                🤝
              </div>
              <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>Matching Inteligente</h3>
              <p style={{ color: '#9ca3af' }}>Conecta con el profesional ideal</p>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '120px', height: '120px', background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)', borderRadius: '50%', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px' }}>
                🔒
              </div>
              <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>100% Privado</h3>
              <p style={{ color: '#9ca3af' }}>Tus datos siempre protegidos</p>
            </div>
          </div>
        </div>
      </section>

      {/* Sección 3: Proceso con animación */}
      <section
        className="fade-in"
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          padding: '120px 20px',
          background: 'linear-gradient(180deg, #fafafa 0%, #ffffff 100%)',
        }}
      >
        <div className="container" style={{ maxWidth: '1100px' }}>
          <h2 style={{ fontSize: '48px', textAlign: 'center', marginBottom: '80px', fontWeight: 600 }}>
            Cómo Funciona
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '40px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '56px', marginBottom: '24px', opacity: 0.9 }}>1️⃣</div>
              <h3 style={{ fontSize: '24px', marginBottom: '16px', fontWeight: 600 }}>Completa el Test</h3>
              <p style={{ color: '#6b7280', lineHeight: '1.6' }}>
                Responde nuestras preguntas diseñadas para entender tus necesidades
              </p>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '56px', marginBottom: '24px', opacity: 0.9 }}>2️⃣</div>
              <h3 style={{ fontSize: '24px', marginBottom: '16px', fontWeight: 600 }}>Analizamos tus Resultados</h3>
              <p style={{ color: '#6b7280', lineHeight: '1.6' }}>
                Nuestro sistema inteligente evalúa tu perfil psicológico
              </p>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '56px', marginBottom: '24px', opacity: 0.9 }}>3️⃣</div>
              <h3 style={{ fontSize: '24px', marginBottom: '16px', fontWeight: 600 }}>Conectamos con tu Psicólogo</h3>
              <p style={{ color: '#6b7280', lineHeight: '1.6' }}>
                Te emparejamos con el profesional especializado en tu caso
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
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      >
        <h2
          style={{
            fontSize: '56px',
            color: 'white',
            textAlign: 'center',
            marginBottom: '24px',
            fontWeight: 600,
          }}
        >
          Comienza tu Viaje Hoy
        </h2>
        <p
          style={{
            fontSize: '24px',
            color: 'rgba(255, 255, 255, 0.9)',
            textAlign: 'center',
            marginBottom: '48px',
            maxWidth: '600px',
          }}
        >
          Únete a miles de personas que están transformando su bienestar mental
        </p>
        <button
          onClick={onGetStarted}
          style={{
            padding: '20px 56px',
            fontSize: '21px',
            fontWeight: 500,
            background: 'white',
            color: '#667eea',
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
            transition: 'all 0.3s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.boxShadow = '0 12px 32px rgba(0, 0, 0, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          Registrarse Gratis
        </button>
      </section>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(10px); }
        }
      `}</style>
    </div>
  );
}
