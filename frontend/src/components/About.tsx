import alvaroPhoto from '../assets/alvarogan.jpeg';

interface AboutProps {
  onBack: () => void;
  onLogin: () => void;
  onGetStarted: () => void;
}

export default function About({ onBack, onLogin, onGetStarted }: AboutProps) {
  return (
    <div style={{ minHeight: '100vh', background: '#f5f7f6', color: '#1a2e22' }}>
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(93, 143, 168, 0.15)',
          padding: '20px 40px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <button
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: '#3a5a4a',
            fontSize: '15px',
            fontWeight: 500,
            fontFamily: "'Inter', sans-serif",
            transition: 'color 0.3s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#5a9270'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#3a5a4a'; }}
        >
          ← Volver
        </button>
        <div style={{
          fontFamily: "'Nunito', sans-serif",
          fontSize: '28px',
          fontWeight: 700,
          color: '#5a9270',
          letterSpacing: '-0.02em',
        }}>
          Psymatch
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button
            onClick={onLogin}
            style={{
              padding: '10px 24px',
              borderRadius: '24px',
              border: '1px solid rgba(90, 146, 112, 0.3)',
              background: 'transparent',
              color: '#5a9270',
              fontSize: '15px',
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: "'Inter', sans-serif",
              transition: 'all 0.3s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f0f5f3';
              e.currentTarget.style.borderColor = '#5a9270';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = 'rgba(90, 146, 112, 0.3)';
            }}
          >
            Iniciar sesión
          </button>
          <button
            onClick={onGetStarted}
            style={{
              padding: '10px 24px',
              borderRadius: '24px',
              border: 'none',
              background: '#5a9270',
              color: '#ffffff',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(90, 146, 112, 0.3)',
              fontFamily: "'Inter', sans-serif",
              transition: 'all 0.3s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#4a8062';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(90, 146, 112, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#5a9270';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(90, 146, 112, 0.3)';
            }}
          >
            Agendar evaluación
          </button>
        </div>
      </nav>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '100px 24px 80px', display: 'flex', flexDirection: 'column', gap: '80px' }}>
        <section style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 350px) 1fr', gap: '60px', alignItems: 'center' }}>
          <div
            style={{
              position: 'relative',
              borderRadius: '24px',
              overflow: 'hidden',
              boxShadow: '0 12px 40px rgba(26, 46, 34, 0.15)',
              border: '2px solid rgba(90, 146, 112, 0.2)',
              background: '#ffffff',
            }}
          >
            <img
              src={alvaroPhoto}
              alt="Álvaro García-Alonso"
              style={{ width: '100%', height: 'auto', objectFit: 'cover', display: 'block' }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                padding: '20px 24px',
                background: 'linear-gradient(to top, rgba(26, 46, 34, 0.9), transparent)',
              }}
            >
              <p style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: '#ffffff', fontFamily: "'Inter', sans-serif" }}>
                Álvaro García-Alonso
              </p>
              <p style={{ margin: '6px 0 0', fontSize: '14px', color: 'rgba(255, 255, 255, 0.9)', fontFamily: "'Inter', sans-serif" }}>
                Licenciado en Psicología • Fundación PSYmatch
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            <span style={{
              fontSize: '13px',
              letterSpacing: '0.12em',
              color: '#5a9270',
              textTransform: 'uppercase',
              fontWeight: 600,
              fontFamily: "'Inter', sans-serif",
            }}>
              Visión ejecutiva del bienestar mental
            </span>
            <h1 style={{
              fontSize: 'clamp(36px, 5vw, 52px)',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
              margin: 0,
              color: '#1a2e22',
              fontFamily: "'Inter', sans-serif",
            }}>
              Psicología estratégica para profesionales y organizaciones
            </h1>
            <p style={{
              fontSize: '18px',
              lineHeight: 1.7,
              color: '#3a5a4a',
              fontFamily: "'Inter', sans-serif",
            }}>
              Álvaro combina formación académica en psicología con experiencia en evaluación psicoemocional orientada a resultados. Su enfoque integra
              herramientas clínicas y metodologías de acompañamiento ejecutivo para ofrecer un servicio confidencial, medible y adaptado a cada etapa
              profesional.
            </p>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '20px',
                marginTop: '16px'
              }}
            >
              {[
                { title: 'Experiencia clínica', detail: 'Evaluación y seguimiento individual, enfoque integrativo.' },
                { title: 'Acompañamiento ejecutivo', detail: 'Procesos de alto rendimiento y gestión emocional.' },
                { title: 'Mentoría estratégica', detail: 'Programas a medida para equipos directivos y founders.' }
              ].map((item) => (
                <div
                  key={item.title}
                  style={{
                    background: '#ffffff',
                    border: '2px solid rgba(90, 146, 112, 0.2)',
                    borderRadius: '16px',
                    padding: '24px 22px',
                    boxShadow: '0 4px 12px rgba(26, 46, 34, 0.08)',
                    transition: 'all 0.3s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(90, 146, 112, 0.15)';
                    e.currentTarget.style.borderColor = 'rgba(90, 146, 112, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(26, 46, 34, 0.08)';
                    e.currentTarget.style.borderColor = 'rgba(90, 146, 112, 0.2)';
                  }}
                >
                  <h3 style={{
                    margin: 0,
                    fontSize: '16px',
                    fontWeight: 600,
                    letterSpacing: '0.02em',
                    color: '#1a2e22',
                    fontFamily: "'Inter', sans-serif",
                    marginBottom: '10px',
                  }}>
                    {item.title}
                  </h3>
                  <p style={{
                    margin: 0,
                    fontSize: '14px',
                    lineHeight: 1.6,
                    color: '#3a5a4a',
                    fontFamily: "'Inter', sans-serif",
                  }}>
                    {item.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          style={{
            background: '#ffffff',
            border: '2px solid rgba(90, 146, 112, 0.15)',
            borderRadius: '24px',
            padding: '50px 56px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '40px',
            boxShadow: '0 8px 24px rgba(26, 46, 34, 0.12)'
          }}
        >
          {[
            {
              heading: 'Formación continua',
              body: 'Programas de especialización en psicología clínica, salud mental y acompañamiento empresarial. Colegiado y en supervisión permanente.'
            },
            {
              heading: 'Metodología',
              body: 'Análisis cuantitativo y cualitativo, sesiones orientadas a objetivos y sistemas de seguimiento seguros para profesionales y equipos.'
            },
            {
              heading: 'Confidencialidad',
              body: 'Entorno protegido, protocolos GDPR y acuerdos de confidencialidad para procesos individuales y corporativos.'
            }
          ].map((item) => (
            <div key={item.heading} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{
                margin: 0,
                fontSize: '20px',
                fontWeight: 600,
                letterSpacing: '-0.01em',
                color: '#1a2e22',
                fontFamily: "'Inter', sans-serif",
              }}>
                {item.heading}
              </h3>
              <p style={{
                margin: 0,
                fontSize: '16px',
                lineHeight: 1.7,
                color: '#3a5a4a',
                fontFamily: "'Inter', sans-serif",
              }}>
                {item.body}
              </p>
            </div>
          ))}
        </section>

        <section
          style={{
            background: 'linear-gradient(135deg, #5a9270 0%, #5b8fa8 100%)',
            border: 'none',
            borderRadius: '24px',
            padding: '60px 56px',
            textAlign: 'center',
            boxShadow: '0 12px 40px rgba(90, 146, 112, 0.25)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{
            position: 'absolute',
            top: '-50px',
            right: '-50px',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.1)',
            filter: 'blur(40px)',
          }} />
          <div style={{
            position: 'absolute',
            bottom: '-50px',
            left: '-50px',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.08)',
            filter: 'blur(40px)',
          }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h2 style={{
              margin: 0,
              fontSize: 'clamp(32px, 4vw, 48px)',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: '#ffffff',
              fontFamily: "'Inter', sans-serif",
              marginBottom: '20px',
            }}>
              Descubre cómo potenciar tu bienestar y liderazgo
            </h2>
            <p style={{
              margin: '20px auto 36px',
              fontSize: '18px',
              lineHeight: 1.7,
              maxWidth: '680px',
              color: 'rgba(255, 255, 255, 0.95)',
              fontFamily: "'Inter', sans-serif",
            }}>
              Agenda una reunión para explorar planes individuales y corporativos. Construimos procesos discretos y orientados a objetivos.
            </p>
            <button
              onClick={onGetStarted}
              style={{
                padding: '16px 44px',
                borderRadius: '30px',
                border: 'none',
                background: '#ffffff',
                color: '#5a9270',
                fontSize: '17px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
                fontFamily: "'Inter', sans-serif",
                transition: 'all 0.3s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 12px 32px rgba(0, 0, 0, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.2)';
              }}
            >
              Coordinar una reunión
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
