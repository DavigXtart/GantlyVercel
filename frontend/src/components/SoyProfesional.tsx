import gemini1 from '../assets/Gemini_Generated_Image_gvn6grgvn6grgvn6.png';
import gemini2 from '../assets/Gemini_Generated_Image_9ho60t9ho60t9ho6.png';
import gemini3 from '../assets/Gemini_Generated_Image_pg3gfvpg3gfvpg3g.png';
import gemini4 from '../assets/Gemini_Generated_Image_kng45nkng45nkng4.png';
import gemini5 from '../assets/Gemini_Generated_Image_xta9abxta9abxta9.png';
import gemini6 from '../assets/Gemini_Generated_Image_wqpn45wqpn45wqpn.png';
import imagenProfesional from '../assets/imagenProfesional.jpg';

interface SoyProfesionalProps {
  onBack: () => void;
  onLogin: () => void;
  onGetStarted: () => void;
}

export default function SoyProfesional({ onBack, onLogin, onGetStarted }: SoyProfesionalProps) {
  return (
    <div style={{ overflowX: 'hidden', background: '#f5f7f6', minHeight: '100vh' }}>
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
        borderBottom: '1px solid rgba(90, 146, 112, 0.15)',
        padding: '20px 40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div
          onClick={onBack}
          style={{
            fontFamily: "'Nunito', sans-serif",
            fontSize: '28px',
            fontWeight: 700,
            color: '#5a9270',
            letterSpacing: '-0.02em',
            cursor: 'pointer',
            transition: 'opacity 0.3s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.7'; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
        >
          Gantly
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <button
            onClick={onBack}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#3a5a4a',
              fontSize: '15px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'color 0.3s',
              fontFamily: "'Inter', sans-serif",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#5a9270'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#3a5a4a'; }}
          >
            Volver
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
          padding: '120px 24px 80px',
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '64px',
          alignItems: 'center',
          width: '100%',
          marginBottom: '80px',
        }}>
          {/* Left Side - Text */}
          <div>
            <div style={{
              fontSize: '14px',
              fontWeight: 600,
              color: '#5a9270',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: '16px',
              fontFamily: "'Inter', sans-serif",
            }}>
              Para profesionales
            </div>
            <h1 style={{
              fontSize: 'clamp(36px, 5vw, 56px)',
              fontWeight: 700,
              color: '#1a2e22',
              lineHeight: 1.2,
              marginBottom: '24px',
              fontFamily: "'Nunito', sans-serif",
            }}>
              ¿Quieres ser psicólogo online con Gantly?
            </h1>
            <p style={{
              fontSize: '18px',
              lineHeight: 1.7,
              color: '#3a5a4a',
              marginBottom: '32px',
              fontFamily: "'Inter', sans-serif",
            }}>
              Enriquece tu práctica sanitaria dedicándote a lo más importante, nosotros nos encargamos del resto. Con Gantly podrás ofrecer terapia online de forma fácil, segura y confidencial.
            </p>
            <button
              onClick={onGetStarted}
              style={{
                padding: '16px 32px',
                fontSize: '16px',
                fontWeight: 600,
                background: '#5a9270',
                color: 'white',
                border: 'none',
                borderRadius: '28px',
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(90, 146, 112, 0.3)',
                transition: 'all 0.3s',
                fontFamily: "'Inter', sans-serif",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#4a8062';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(90, 146, 112, 0.4)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#5a9270';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(90, 146, 112, 0.3)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Comenzar registro
            </button>
          </div>

          {/* Right Side - Images Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '24px',
          }}>
            {[gemini1, gemini2, gemini6, gemini5, gemini3, gemini4].map((imgSrc, idx) => (
              <div
                key={idx}
                style={{
                  aspectRatio: '1',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, rgba(250, 232, 214, 0.6), rgba(212, 224, 216, 0.6))',
                  border: '2px solid rgba(90, 146, 112, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                <img 
                  src={imgSrc} 
                  alt={`Imagen ${idx + 1}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: '50%',
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Statistics Section */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '48px',
          width: '100%',
          padding: '48px 0',
          borderTop: '1px solid rgba(90, 146, 112, 0.15)',
          borderBottom: '1px solid rgba(90, 146, 112, 0.15)',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '48px',
              fontWeight: 700,
              color: '#5a9270',
              marginBottom: '8px',
              fontFamily: "'Nunito', sans-serif",
            }}>
              100%
            </div>
            <p style={{
              fontSize: '15px',
              color: '#3a5a4a',
              lineHeight: 1.6,
              fontFamily: "'Inter', sans-serif",
            }}>
              psicólogos están titulados, colegiados y habilitados para ejercer
            </p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '48px',
              fontWeight: 700,
              color: '#5a9270',
              marginBottom: '8px',
              fontFamily: "'Nunito', sans-serif",
            }}>
              +300 mil
            </div>
            <p style={{
              fontSize: '15px',
              color: '#3a5a4a',
              lineHeight: 1.6,
              fontFamily: "'Inter', sans-serif",
            }}>
              sesiones realizadas a través de Gantly de forma segura
            </p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '48px',
              fontWeight: 700,
              color: '#5a9270',
              marginBottom: '8px',
              fontFamily: "'Nunito', sans-serif",
            }}>
              +92%
            </div>
            <p style={{
              fontSize: '15px',
              color: '#3a5a4a',
              lineHeight: 1.6,
              fontFamily: "'Inter', sans-serif",
            }}>
              de los psicólogos recomiendan Gantly a otros compañeros
            </p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '48px',
              fontWeight: 700,
              color: '#5a9270',
              marginBottom: '8px',
              fontFamily: "'Nunito', sans-serif",
            }}>
              +8
            </div>
            <p style={{
              fontSize: '15px',
              color: '#3a5a4a',
              lineHeight: 1.6,
              fontFamily: "'Inter', sans-serif",
            }}>
              años de experiencia encriptado y confidencial, asegurando el mayor nivel de seguridad
            </p>
          </div>
        </div>
      </section>

      {/* How it works Section */}
      <section
        style={{
          padding: '80px 24px',
          background: 'rgba(250, 232, 214, 0.3)',
        }}
      >
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '64px',
          alignItems: 'center',
        }}>
          {/* Left Side - Requirements */}
          <div>
            <div style={{
              fontSize: '14px',
              fontWeight: 600,
              color: '#5a9270',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: '16px',
              fontFamily: "'Inter', sans-serif",
            }}>
              Cómo funciona
            </div>
            <h2 style={{
              fontSize: 'clamp(32px, 4vw, 48px)',
              fontWeight: 700,
              color: '#1a2e22',
              lineHeight: 1.3,
              marginBottom: '24px',
              fontFamily: "'Nunito', sans-serif",
            }}>
              Me interesa, ¿qué necesito?
            </h2>
            <p style={{
              fontSize: '18px',
              lineHeight: 1.7,
              color: '#3a5a4a',
              marginBottom: '32px',
              fontFamily: "'Inter', sans-serif",
            }}>
              Verificaremos que tienes los requisitos esenciales para ejercer legalmente como Psicólogo Sanitario. Además necesitarás un ordenador y smartphone con buena conexión a internet.
            </p>
            <button
              onClick={onGetStarted}
              style={{
                padding: '16px 32px',
                fontSize: '16px',
                fontWeight: 600,
                background: '#5a9270',
                color: 'white',
                border: 'none',
                borderRadius: '28px',
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(90, 146, 112, 0.3)',
                transition: 'all 0.3s',
                fontFamily: "'Inter', sans-serif",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#4a8062';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(90, 146, 112, 0.4)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#5a9270';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(90, 146, 112, 0.3)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Comenzar registro
            </button>
          </div>

          {/* Right Side - Steps */}
          <div style={{ position: 'relative', padding: '40px 0' }}>
            <div style={{
              position: 'absolute',
              left: '40px',
              top: '0',
              bottom: '0',
              width: '3px',
              background: '#d4e0d8',
              borderRadius: '2px',
            }} />
            {[
              { number: 1, text: 'Rellena tus datos' },
              { number: 2, text: 'Completa la verificación' },
              { number: 3, text: 'Haz crecer tu práctica profesional' },
            ].map((step, idx) => (
              <div
                key={step.number}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: idx < 2 ? '48px' : '0',
                  position: 'relative',
                }}
              >
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: 'rgba(250, 232, 214, 0.85)',
                  border: '3px solid #5a9270',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '32px',
                  fontWeight: 700,
                  color: '#5a9270',
                  fontFamily: "'Nunito', sans-serif",
                  zIndex: 2,
                  marginRight: '24px',
                }}>
                  {step.number}
                </div>
                <div style={{
                  fontSize: '20px',
                  fontWeight: 600,
                  color: '#1a2e22',
                  fontFamily: "'Inter', sans-serif",
                }}>
                  {step.text}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Advantages Section */}
      <section
        style={{
          padding: '80px 24px',
          background: '#f5f7f6',
        }}
      >
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
        }}>
          <div style={{
            textAlign: 'center',
            marginBottom: '64px',
          }}>
            <div style={{
              fontSize: '14px',
              fontWeight: 600,
              color: '#5a9270',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: '16px',
              fontFamily: "'Inter', sans-serif",
            }}>
              Ventajas
            </div>
            <h2 style={{
              fontSize: 'clamp(32px, 4vw, 48px)',
              fontWeight: 700,
              color: '#1a2e22',
              lineHeight: 1.3,
              fontFamily: "'Nunito', sans-serif",
            }}>
              Descubre todas las ventajas de Gantly
            </h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '64px',
            alignItems: 'center',
          }}>
            {/* Left Side - Advantages List */}
            <div style={{
              display: 'grid',
              gap: '32px',
            }}>
              {[
                'Aumenta tu cartera de pacientes',
                'Sesiones cuando quieras, desde donde quieras',
                'Resúmenes automatizados de las sesiones',
                'Proceso automatizado de pago',
                'Asistente de IA personalizado',
                'Comprometidos con las buenas prácticas de Telepsicología del COP de Madrid',
              ].map((title, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '20px',
                    padding: '24px',
                    background: 'rgba(250, 232, 214, 0.5)',
                    borderRadius: '16px',
                    border: '1px solid rgba(90, 146, 112, 0.2)',
                  }}
                >
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: '#5a9270',
                    flexShrink: 0,
                    marginTop: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#ffffff',
                    }} />
                  </div>
                  <div style={{
                    fontSize: '18px',
                    fontWeight: 500,
                    color: '#1a2e22',
                    lineHeight: 1.6,
                    fontFamily: "'Inter', sans-serif",
                  }}>
                    {title}
                  </div>
                </div>
              ))}
            </div>

            {/* Right Side - Image */}
            <div style={{
              background: 'rgba(250, 232, 214, 0.6)',
              borderRadius: '24px',
              aspectRatio: '4/5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid rgba(90, 146, 112, 0.2)',
              overflow: 'hidden',
            }}>
              <img
                src={imagenProfesional}
                alt="Imagen profesional"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
            </div>
          </div>
        </div>
      </section>


      {/* Footer - Adherence Statement */}
      <section style={{
        padding: '48px 24px',
        background: 'rgba(212, 224, 216, 0.5)',
        borderTop: '1px solid rgba(90, 146, 112, 0.15)',
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          padding: '24px 32px',
          background: 'rgba(250, 232, 214, 0.6)',
          borderRadius: '16px',
          border: '1px solid rgba(90, 146, 112, 0.2)',
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: '#5a9270',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <div style={{
              width: '20px',
              height: '20px',
              border: '3px solid #ffffff',
              borderTop: 'none',
              borderRight: 'none',
              transform: 'rotate(-45deg)',
              marginTop: '-4px',
            }} />
          </div>
          <p style={{
            margin: 0,
            fontSize: '16px',
            color: '#1a2e22',
            lineHeight: 1.6,
            fontFamily: "'Inter', sans-serif",
          }}>
            Gantly se adhiere al Código de Conducta de Buenas Prácticas en Telepsicología del Colegio Oficial de Psicólogos de Madrid.
          </p>
        </div>
      </section>
    </div>
  );
}

