import { useState, useEffect, useRef } from 'react';
import { Pricing } from './ui/pricing';

interface LandingProps {
  onGetStarted: () => void;
  onLogin: () => void;
  onShowAbout: () => void;
}

export default function Landing({ onGetStarted, onLogin, onShowAbout }: LandingProps) {
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
    <div style={{ overflowX: 'hidden', background: '#f5f7f6' }}>
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
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(10px); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
      `}</style>

      {/* Navigation bar */}
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(93, 143, 168, 0.15)',
        padding: '20px 40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{
          fontFamily: "'Nunito', sans-serif",
          fontSize: '28px',
          fontWeight: 700,
          color: '#5a9270',
          letterSpacing: '-0.02em',
        }}>
          Psymatch
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <button
            onClick={onShowAbout}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#3d5a4e',
              fontSize: '15px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'color 0.3s',
              fontFamily: "'Inter', sans-serif",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#5a9270'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#3d5a4e'; }}
          >
            Sobre nosotros
          </button>
          <button
            onClick={onLogin}
            style={{
              padding: '10px 24px',
              fontSize: '15px',
              fontWeight: 600,
              background: '#5a9270',
              color: 'white',
              border: 'none',
              borderRadius: '24px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(90, 146, 112, 0.3)',
              transition: 'all 0.3s',
              fontFamily: "'Inter', sans-serif",
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
            Iniciar sesión
          </button>
        </div>
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
          background: 'linear-gradient(135deg, #e8ece9 0%, #d4e0d8 50%, #e0e8e3 100%)',
          color: '#2d4a3e',
        }}
      >
        {/* Subtle background pattern */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at 20% 30%, rgba(90, 146, 112, 0.15), transparent 50%), radial-gradient(circle at 80% 70%, rgba(93, 143, 168, 0.12), transparent 50%)',
            pointerEvents: 'none',
          }}
        />

        {/* Logo */}
        <div className="fade-in" style={{ marginBottom: '40px' }}>
          <div style={{
            fontFamily: "'Nunito', sans-serif",
            fontSize: '64px',
            fontWeight: 700,
            color: '#5a9270',
            letterSpacing: '-0.03em',
            textAlign: 'center',
          }}>
            Psymatch
          </div>
        </div>

        <h1
          className="fade-in"
          style={{
            fontSize: 'clamp(36px, 6vw, 60px)',
            fontWeight: 600,
            letterSpacing: '-0.02em',
            textAlign: 'center',
            marginBottom: '24px',
            color: '#1a2e22',
            lineHeight: '1.2',
            fontFamily: "'Inter', sans-serif",
          }}
        >
          Encuentra tu psicólogo ideal
        </h1>

        <p
          className="fade-in"
          style={{
            fontSize: 'clamp(18px, 2vw, 22px)',
            color: '#3a5a4a',
            textAlign: 'center',
            maxWidth: '700px',
            marginBottom: '48px',
            lineHeight: '1.7',
            fontWeight: 400,
            fontFamily: "'Inter', sans-serif",
          }}
        >
          Terapia psicológica profesional adaptada a tu ritmo y necesidades. Encuentra el apoyo que buscas con profesionales especializados.
        </p>

        <div
          className="fade-in"
          style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '64px' }}
        >
          <button
            onClick={onGetStarted}
            style={{
              padding: '16px 40px',
              fontSize: '17px',
              fontWeight: 600,
              background: '#5a9270',
              border: 'none',
              borderRadius: '30px',
              color: '#ffffff',
              cursor: 'pointer',
              transition: 'all 0.3s',
              boxShadow: '0 6px 20px rgba(90, 146, 112, 0.35)',
              fontFamily: "'Inter', sans-serif",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(90, 146, 112, 0.45)';
              e.currentTarget.style.background = '#4a8062';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(90, 146, 112, 0.35)';
              e.currentTarget.style.background = '#5a9270';
            }}
          >
            Comenzar evaluación
          </button>
          <button
            onClick={onShowAbout}
            style={{
              padding: '16px 36px',
              fontSize: '17px',
              fontWeight: 500,
              background: 'transparent',
              color: '#5a9270',
              border: '2px solid #5a9270',
              borderRadius: '30px',
              cursor: 'pointer',
              transition: 'all 0.3s',
              fontFamily: "'Inter', sans-serif",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f0f5f3';
              e.currentTarget.style.borderColor = '#4a8062';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = '#5a9270';
            }}
          >
            Conocer más
          </button>
        </div>

      </section>

      {/* Benefits Section */}
      <section
        className="fade-in"
        style={{
          padding: '100px 20px',
          background: '#f8f9fa',
          position: 'relative',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: 'clamp(32px, 4vw, 48px)',
            textAlign: 'center',
            marginBottom: '20px',
            fontWeight: 700,
            color: '#1a2e22',
            letterSpacing: '-0.02em',
            fontFamily: "'Inter', sans-serif",
          }}>
            Beneficios de Psymatch
          </h2>
          <p style={{
            fontSize: 'clamp(16px, 1.8vw, 20px)',
            color: '#3a5a4a',
            textAlign: 'center',
            maxWidth: '700px',
            margin: '0 auto 60px',
            lineHeight: '1.7',
            fontFamily: "'Inter', sans-serif",
          }}>
            Pensamos en una forma de acceder a terapia que se ajuste a tu vida, manteniendo siempre la calidad profesional que mereces.
          </p>

          {/* Benefits Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '30px',
            maxWidth: '1100px',
            margin: '0 auto',
          }}>
            {[
              {
                title: 'Flexibilidad y comodidad',
                description: 'Accede a terapia desde donde te encuentres, sin desplazamientos ni complicaciones de horarios que afecten tu día a día.',
              },
              {
                title: 'Emparejamiento personalizado',
                description: 'Nos encargamos de conectarte con el profesional que mejor se adapte a tus necesidades, evitando búsquedas frustrantes y listas de espera.',
              },
              {
                title: 'Flexibilidad para cambiar',
                description: 'Si sientes que necesitas un enfoque diferente, podemos facilitarte el cambio a otro terapeuta sin costes adicionales.',
              },
              {
                title: 'Atención profesional accesible',
                description: 'Ofrecemos terapia psicológica de calidad a precios que permiten el cuidado continuo de tu bienestar mental.',
              },
            ].map((benefit, index) => (
              <div
                key={index}
                style={{
                  padding: '40px 30px',
                  background: '#ffffff',
                  borderRadius: '20px',
                  textAlign: 'center',
                  border: '2px solid rgba(90, 146, 112, 0.2)',
                  transition: 'all 0.3s',
                  boxShadow: '0 6px 20px rgba(45, 74, 62, 0.12)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.boxShadow = '0 12px 28px rgba(90, 146, 112, 0.25)';
                  e.currentTarget.style.borderColor = 'rgba(90, 146, 112, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(45, 74, 62, 0.12)';
                  e.currentTarget.style.borderColor = 'rgba(90, 146, 112, 0.2)';
                }}
              >
                <h3 style={{
                  fontSize: '20px',
                  marginBottom: '12px',
                  fontWeight: 600,
                  color: '#1a2e22',
                  fontFamily: "'Inter', sans-serif",
                }}>
                  {benefit.title}
                </h3>
                <p style={{
                  color: '#3a5a4a',
                  lineHeight: '1.6',
                  fontSize: '15px',
                  fontFamily: "'Inter', sans-serif",
                }}>
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section
        className="fade-in"
        style={{
          padding: '100px 20px',
          background: '#ffffff',
          position: 'relative',
        }}
      >
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: 'clamp(32px, 4vw, 48px)',
            textAlign: 'center',
            marginBottom: '60px',
            fontWeight: 700,
            color: '#1a2e22',
            letterSpacing: '-0.02em',
            fontFamily: "'Inter', sans-serif",
          }}>
            Psymatch vs. Terapia Presencial
          </h2>

          {/* Comparison Table */}
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            overflow: 'hidden',
            boxShadow: '0 10px 30px rgba(26, 46, 34, 0.15)',
            border: '1px solid rgba(90, 146, 112, 0.15)',
          }}>
            {/* Header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr',
              borderBottom: '2px solid #e8f0ed',
            }}>
              <div style={{
                padding: '24px',
                fontWeight: 600,
                color: '#1a2e22',
                fontSize: '16px',
                fontFamily: "'Inter', sans-serif",
              }}>
                Características
              </div>
              <div style={{
                padding: '24px',
                background: '#5a9270',
                color: '#ffffff',
                fontWeight: 600,
                textAlign: 'center',
                fontSize: '16px',
                fontFamily: "'Inter', sans-serif",
              }}>
                Psymatch
              </div>
              <div style={{
                padding: '24px',
                background: '#f8f9fa',
                color: '#1a2e22',
                fontWeight: 600,
                textAlign: 'center',
                fontSize: '16px',
                borderLeft: '2px solid #d4e0d8',
                fontFamily: "'Inter', sans-serif",
              }}>
                Presencial
              </div>
            </div>

            {/* Rows */}
            {[
              { feature: 'Psicólogo licenciado en tu estado', psymatch: true, presencial: true },
              { feature: 'Terapia desde cualquier lugar', psymatch: true, presencial: false },
              { feature: 'Mensajea a tu terapeuta en cualquier momento', psymatch: true, presencial: false },
              { feature: 'Recibe respuestas cuando lo necesites', psymatch: true, presencial: false },
              { feature: 'Agenda citas fácilmente', psymatch: true, presencial: false },
              { feature: 'Cambia de terapeuta fácilmente', psymatch: true, presencial: false },
              { feature: 'Sin gastos de transporte ni tiempo perdido', psymatch: true, presencial: false },
            ].map((row, index) => (
              <div
                key={index}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr',
                  borderBottom: index < 6 ? '1px solid #e8f0ed' : 'none',
                }}
              >
                <div style={{
                  padding: '20px 24px',
                  color: '#1a2e22',
                  fontSize: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  fontFamily: "'Inter', sans-serif",
                  background: '#ffffff',
                }}>
                  {row.feature}
                </div>
                <div style={{
                  padding: '20px 24px',
                  background: '#f0f5f3',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {row.psymatch ? (
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: '#5a9270',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      fontWeight: 'bold',
                    }}>
                      ✓
                    </div>
                  ) : (
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: '#e8e8e8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#999999',
                    }}>
                      ✗
                    </div>
                  )}
                </div>
                <div style={{
                  padding: '20px 24px',
                  background: '#f8f9fa',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderLeft: '2px solid #d4e0d8',
                }}>
                  {row.presencial ? (
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: '#5a9270',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      fontWeight: 'bold',
                    }}>
                      ✓
                    </div>
                  ) : (
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: '#ffe5e5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#d4a5a5',
                    }}>
                      ✗
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section
        className="fade-in"
        style={{
          padding: '100px 20px',
          background: '#f8f9fa',
          position: 'relative',
        }}
      >
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: 'clamp(32px, 4vw, 48px)',
            textAlign: 'center',
            marginBottom: '20px',
            fontWeight: 700,
            color: '#1a2e22',
            letterSpacing: '-0.02em',
            fontFamily: "'Inter', sans-serif",
          }}>
            Cómo funciona
          </h2>
          <p style={{
            fontSize: 'clamp(16px, 1.8vw, 20px)',
            color: '#3a5a4a',
            textAlign: 'center',
            maxWidth: '700px',
            margin: '0 auto 60px',
            lineHeight: '1.7',
            fontFamily: "'Inter', sans-serif",
          }}>
            Un proceso sencillo para iniciar tu acompañamiento psicológico.
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '40px',
            marginTop: '60px',
          }}>
            {[
              {
                number: '1',
                title: 'Completa el test',
                description: 'Comparte información sobre ti a través de un cuestionario sencillo que nos ayuda a conocerte mejor.',
                color: '#5a9270',
              },
              {
                number: '2',
                title: 'Analizamos tu perfil',
                description: 'Analizamos tus respuestas con cuidado para identificar qué tipo de acompañamiento se ajusta mejor a tu situación.',
                color: '#5b8fa8',
              },
              {
                number: '3',
                title: 'Conecta con tu psicólogo',
                description: 'Te ponemos en contacto con un psicólogo especializado cuya experiencia y enfoque encajan con lo que necesitas.',
                color: '#7fb3a3',
              },
            ].map((step, index) => (
              <div
                key={index}
                style={{
                  textAlign: 'center',
                  padding: '40px 30px',
                  background: '#ffffff',
                  borderRadius: '20px',
                  border: '2px solid rgba(90, 146, 112, 0.2)',
                  transition: 'all 0.3s',
                  boxShadow: '0 6px 20px rgba(45, 74, 62, 0.12)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.boxShadow = '0 12px 28px rgba(90, 146, 112, 0.25)';
                  e.currentTarget.style.borderColor = 'rgba(90, 146, 112, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(45, 74, 62, 0.12)';
                  e.currentTarget.style.borderColor = 'rgba(90, 146, 112, 0.2)';
                }}
              >
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: step.color,
                  margin: '0 auto 24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '36px',
                  fontWeight: 700,
                  color: '#ffffff',
                  boxShadow: `0 6px 20px ${step.color}40`,
                  fontFamily: "'Inter', sans-serif",
                }}>
                  {step.number}
                </div>
                <h3 style={{
                  fontSize: '22px',
                  marginBottom: '16px',
                  fontWeight: 600,
                  color: '#1a2e22',
                  fontFamily: "'Inter', sans-serif",
                }}>
                  {step.title}
                </h3>
                <p style={{
                  color: '#3a5a4a',
                  lineHeight: '1.7',
                  fontSize: '16px',
                  fontFamily: "'Inter', sans-serif",
                }}>
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section
        className="fade-in"
        style={{
          padding: '100px 20px',
          background: '#ffffff',
          position: 'relative',
        }}
      >
        <Pricing
          plans={[
            {
              name: "PLAN PRUEBA 1",
              price: "29",
              yearlyPrice: "25",
              period: "por mes",
              features: [
                "Texto de prueba feature 1",
                "Texto de prueba feature 2",
                "Texto de prueba feature 3",
                "Texto de prueba feature 4",
                "Texto de prueba feature 5",
              ],
              description: "Texto de prueba para el plan básico",
              buttonText: "Comenzar prueba",
              onClick: onGetStarted,
              isPopular: false,
            },
            {
              name: "PLAN PRUEBA 2",
              price: "59",
              yearlyPrice: "49",
              period: "por mes",
              features: [
                "Texto de prueba feature 1",
                "Texto de prueba feature 2",
                "Texto de prueba feature 3",
                "Texto de prueba feature 4",
                "Texto de prueba feature 5",
                "Texto de prueba feature 6",
                "Texto de prueba feature 7",
              ],
              description: "Texto de prueba para el plan popular",
              buttonText: "Comenzar prueba",
              onClick: onGetStarted,
              isPopular: true,
            },
            {
              name: "PLAN PRUEBA 3",
              price: "99",
              yearlyPrice: "85",
              period: "por mes",
              features: [
                "Texto de prueba feature 1",
                "Texto de prueba feature 2",
                "Texto de prueba feature 3",
                "Texto de prueba feature 4",
                "Texto de prueba feature 5",
                "Texto de prueba feature 6",
                "Texto de prueba feature 7",
                "Texto de prueba feature 8",
              ],
              description: "Texto de prueba para el plan premium",
              buttonText: "Comenzar prueba",
              onClick: onGetStarted,
              isPopular: false,
            },
          ]}
          title="Planes de prueba"
          description="Elige el plan que mejor se ajuste a tus necesidades\nTodos los planes incluyen características de prueba para evaluar el servicio."
        />
      </section>

      {/* CTA Final */}
      <section
        className="fade-in"
        style={{
          minHeight: '70vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '100px 20px',
          background: 'linear-gradient(135deg, #5a9270 0%, #5b8fa8 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative elements */}
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

        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: '700px' }}>
          <h2
            style={{
              fontSize: 'clamp(36px, 5vw, 56px)',
              color: '#ffffff',
              textAlign: 'center',
              marginBottom: '24px',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              fontFamily: "'Inter', sans-serif",
            }}
          >
            Tu bienestar empieza aquí
          </h2>
          <p
            style={{
              fontSize: 'clamp(18px, 2vw, 22px)',
              color: 'rgba(255, 255, 255, 0.95)',
              textAlign: 'center',
              marginBottom: '48px',
              lineHeight: '1.7',
              fontWeight: 400,
              fontFamily: "'Inter', sans-serif",
            }}
          >
            Da el primer paso. Completa una breve evaluación y descubre cómo podemos acompañarte en este momento.
          </p>
          <button
            onClick={onGetStarted}
            style={{
              padding: '18px 48px',
              fontSize: '18px',
              fontWeight: 600,
              background: '#ffffff',
              color: '#5a9270',
              border: 'none',
              borderRadius: '30px',
              cursor: 'pointer',
              transition: 'all 0.3s',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
              fontFamily: "'Inter', sans-serif",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)';
              e.currentTarget.style.boxShadow = '0 12px 32px rgba(0, 0, 0, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.2)';
            }}
          >
            Comenzar evaluación
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '40px 20px',
        background: '#2d4a3e',
        color: '#ffffff',
        textAlign: 'center',
      }}>
        <div style={{
          fontFamily: "'Nunito', sans-serif",
          fontSize: '24px',
          fontWeight: 700,
          color: '#ffffff',
          marginBottom: '16px',
        }}>
          Psymatch
        </div>
        <p style={{
          color: 'rgba(255, 255, 255, 0.8)',
          fontSize: '14px',
          fontFamily: "'Inter', sans-serif",
        }}>
          © 2024 Psymatch. Todos los derechos reservados.
        </p>
      </footer>
    </div>
  );
}