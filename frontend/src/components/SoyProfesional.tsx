import { useState } from 'react';

interface SoyProfesionalProps {
  onBack: () => void;
  onLogin: () => void;
  onGetStarted: () => void;
}

export default function SoyProfesional({ onBack, onLogin, onGetStarted }: SoyProfesionalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    type: 'psychologist' as 'psychologist' | 'company',
    license: '',
    experience: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    // Simular envío del formulario
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
    }, 1500);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

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
          Psymatch
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
              ¿Quieres ser psicólogo online con Psymatch?
            </h1>
            <p style={{
              fontSize: '18px',
              lineHeight: 1.7,
              color: '#3a5a4a',
              marginBottom: '32px',
              fontFamily: "'Inter', sans-serif",
            }}>
              Enriquece tu práctica sanitaria dedicándote a lo más importante, nosotros nos encargamos del resto. Con Psymatch podrás ofrecer terapia online de forma fácil, segura y confidencial.
            </p>
            <button
              onClick={() => {
                const formSection = document.getElementById('registro-profesional');
                formSection?.scrollIntoView({ behavior: 'smooth' });
              }}
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
              Solicita una demo
            </button>
          </div>

          {/* Right Side - Images Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '24px',
          }}>
            {[1, 2, 3, 4, 5, 6].map((idx) => (
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
                }}
              >
                <div style={{
                  width: '80%',
                  height: '80%',
                  borderRadius: '50%',
                  background: 'rgba(90, 146, 112, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#5a9270',
                  fontSize: '32px',
                  fontWeight: 600,
                  fontFamily: "'Inter', sans-serif",
                }}>
                  {idx}
                </div>
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
              sesiones realizadas a través de Psymatch de forma segura
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
              de los psicólogos recomiendan Psymatch a otros compañeros
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
              onClick={() => {
                const formSection = document.getElementById('registro-profesional');
                formSection?.scrollIntoView({ behavior: 'smooth' });
              }}
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
              Solicita una demo
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
              Descubre todas las ventajas de Psymatch
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

            {/* Right Side - Image Placeholder */}
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
              <div style={{
                fontSize: '18px',
                color: '#5a9270',
                opacity: 0.4,
                fontFamily: "'Inter', sans-serif",
                fontWeight: 500,
                textAlign: 'center',
                padding: '24px',
              }}>
                Imagen profesional
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Registration Form Section */}
      <section
        id="registro-profesional"
        style={{
          padding: '80px 24px',
          background: 'linear-gradient(135deg, #e8ece9 0%, #d4e0d8 50%, #e0e8e3 100%)',
        }}
      >
        <div style={{
          maxWidth: '900px',
          margin: '0 auto',
        }}>
          <div style={{
            textAlign: 'center',
            marginBottom: '48px',
          }}>
            <h2 style={{
              fontSize: 'clamp(32px, 4vw, 42px)',
              fontWeight: 700,
              color: '#1a2e22',
              marginBottom: '16px',
              fontFamily: "'Nunito', sans-serif",
            }}>
              Solicita información
            </h2>
            <p style={{
              fontSize: '18px',
              color: '#3a5a4a',
              fontFamily: "'Inter', sans-serif",
            }}>
              Completa el formulario y nos pondremos en contacto contigo
            </p>
          </div>

          {submitted ? (
            <div style={{
              background: 'rgba(250, 232, 214, 0.9)',
              border: '1px solid rgba(90, 146, 112, 0.2)',
              borderRadius: '24px',
              padding: '64px 40px',
              textAlign: 'center',
              boxShadow: '0 8px 32px rgba(90, 146, 112, 0.15)',
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: '#5a9270',
                margin: '0 auto 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  border: '4px solid #ffffff',
                  borderTop: 'none',
                  borderRight: 'none',
                  transform: 'rotate(-45deg)',
                  marginTop: '-8px',
                }} />
              </div>
              <h3 style={{
                fontSize: '28px',
                fontWeight: 700,
                color: '#1a2e22',
                marginBottom: '16px',
                fontFamily: "'Nunito', sans-serif",
              }}>
                ¡Gracias por tu interés!
              </h3>
              <p style={{
                fontSize: '18px',
                color: '#3a5a4a',
                marginBottom: '32px',
                fontFamily: "'Inter', sans-serif",
              }}>
                Hemos recibido tu solicitud. Nos pondremos en contacto contigo pronto.
              </p>
              <button
                onClick={() => {
                  setSubmitted(false);
                  setFormData({
                    name: '',
                    email: '',
                    phone: '',
                    type: 'psychologist',
                    license: '',
                    experience: '',
                    message: '',
                  });
                }}
                style={{
                  padding: '14px 32px',
                  fontSize: '16px',
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
                Enviar otra solicitud
              </button>
            </div>
          ) : (
            <div style={{
              background: 'rgba(250, 232, 214, 0.9)',
              border: '1px solid rgba(90, 146, 112, 0.2)',
              borderRadius: '24px',
              padding: '48px 40px',
              boxShadow: '0 8px 32px rgba(90, 146, 112, 0.15)',
            }}>
              <form onSubmit={handleSubmit} style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '24px',
              }}>
                {/* Type Selection */}
                <div style={{
                  display: 'flex',
                  gap: '16px',
                  marginBottom: '8px',
                }}>
                  <label style={{
                    flex: 1,
                    padding: '16px 24px',
                    borderRadius: '16px',
                    border: `2px solid ${formData.type === 'psychologist' ? '#5a9270' : 'rgba(90, 146, 112, 0.3)'}`,
                    background: formData.type === 'psychologist' ? '#d4e0d8' : 'rgba(250, 232, 214, 0.5)',
                    cursor: 'pointer',
                    textAlign: 'center',
                    fontSize: '16px',
                    fontWeight: 600,
                    color: formData.type === 'psychologist' ? '#1a2e22' : '#3a5a4a',
                    fontFamily: "'Inter', sans-serif",
                    transition: 'all 0.3s',
                  }}>
                    <input
                      type="radio"
                      name="type"
                      value="psychologist"
                      checked={formData.type === 'psychologist'}
                      onChange={handleChange}
                      style={{ display: 'none' }}
                    />
                    Psicólogo
                  </label>
                  <label style={{
                    flex: 1,
                    padding: '16px 24px',
                    borderRadius: '16px',
                    border: `2px solid ${formData.type === 'company' ? '#5a9270' : 'rgba(90, 146, 112, 0.3)'}`,
                    background: formData.type === 'company' ? '#d4e0d8' : 'rgba(250, 232, 214, 0.5)',
                    cursor: 'pointer',
                    textAlign: 'center',
                    fontSize: '16px',
                    fontWeight: 600,
                    color: formData.type === 'company' ? '#1a2e22' : '#3a5a4a',
                    fontFamily: "'Inter', sans-serif",
                    transition: 'all 0.3s',
                  }}>
                    <input
                      type="radio"
                      name="type"
                      value="company"
                      checked={formData.type === 'company'}
                      onChange={handleChange}
                      style={{ display: 'none' }}
                    />
                    Empresa
                  </label>
                </div>

                {/* Name */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <label style={{
                    fontSize: '14px',
                    color: '#3a5a4a',
                    fontWeight: 500,
                    fontFamily: "'Inter', sans-serif",
                  }}>
                    {formData.type === 'psychologist' ? 'Nombre completo' : 'Nombre de la empresa'}
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder={formData.type === 'psychologist' ? 'Tu nombre' : 'Nombre de la empresa'}
                    style={{
                      padding: '14px 18px',
                      borderRadius: '12px',
                      border: '1px solid rgba(90, 146, 112, 0.3)',
                      background: '#f8f9fa',
                      color: '#1a2e22',
                      fontSize: '15px',
                      fontFamily: "'Inter', sans-serif",
                      transition: 'all 0.3s',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#5a9270';
                      e.currentTarget.style.background = '#fff';
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(90, 146, 112, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(90, 146, 112, 0.3)';
                      e.currentTarget.style.background = '#f8f9fa';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                </div>

                {/* Email */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <label style={{
                    fontSize: '14px',
                    color: '#3a5a4a',
                    fontWeight: 500,
                    fontFamily: "'Inter', sans-serif",
                  }}>
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="tu@email.com"
                    style={{
                      padding: '14px 18px',
                      borderRadius: '12px',
                      border: '1px solid rgba(90, 146, 112, 0.3)',
                      background: '#f8f9fa',
                      color: '#1a2e22',
                      fontSize: '15px',
                      fontFamily: "'Inter', sans-serif",
                      transition: 'all 0.3s',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#5a9270';
                      e.currentTarget.style.background = '#fff';
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(90, 146, 112, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(90, 146, 112, 0.3)';
                      e.currentTarget.style.background = '#f8f9fa';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                </div>

                {/* Phone */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <label style={{
                    fontSize: '14px',
                    color: '#3a5a4a',
                    fontWeight: 500,
                    fontFamily: "'Inter', sans-serif",
                  }}>
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    placeholder="+34 600 000 000"
                    style={{
                      padding: '14px 18px',
                      borderRadius: '12px',
                      border: '1px solid rgba(90, 146, 112, 0.3)',
                      background: '#f8f9fa',
                      color: '#1a2e22',
                      fontSize: '15px',
                      fontFamily: "'Inter', sans-serif",
                      transition: 'all 0.3s',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#5a9270';
                      e.currentTarget.style.background = '#fff';
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(90, 146, 112, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(90, 146, 112, 0.3)';
                      e.currentTarget.style.background = '#f8f9fa';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                </div>

                {/* License (only for psychologists) */}
                {formData.type === 'psychologist' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <label style={{
                      fontSize: '14px',
                      color: '#3a5a4a',
                      fontWeight: 500,
                      fontFamily: "'Inter', sans-serif",
                    }}>
                      Número de colegiado
                    </label>
                    <input
                      type="text"
                      name="license"
                      value={formData.license}
                      onChange={handleChange}
                      placeholder="Número de colegiado"
                      style={{
                        padding: '14px 18px',
                        borderRadius: '12px',
                        border: '1px solid rgba(90, 146, 112, 0.3)',
                        background: '#f8f9fa',
                        color: '#1a2e22',
                        fontSize: '15px',
                        fontFamily: "'Inter', sans-serif",
                        transition: 'all 0.3s',
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#5a9270';
                        e.currentTarget.style.background = '#fff';
                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(90, 146, 112, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(90, 146, 112, 0.3)';
                        e.currentTarget.style.background = '#f8f9fa';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                )}

                {/* Experience (only for psychologists) */}
                {formData.type === 'psychologist' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <label style={{
                      fontSize: '14px',
                      color: '#3a5a4a',
                      fontWeight: 500,
                      fontFamily: "'Inter', sans-serif",
                    }}>
                      Años de experiencia
                    </label>
                    <select
                      name="experience"
                      value={formData.experience}
                      onChange={handleChange}
                      style={{
                        padding: '14px 18px',
                        borderRadius: '12px',
                        border: '1px solid rgba(90, 146, 112, 0.3)',
                        background: '#f8f9fa',
                        color: '#1a2e22',
                        fontSize: '15px',
                        fontFamily: "'Inter', sans-serif",
                        transition: 'all 0.3s',
                        cursor: 'pointer',
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#5a9270';
                        e.currentTarget.style.background = '#fff';
                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(90, 146, 112, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(90, 146, 112, 0.3)';
                        e.currentTarget.style.background = '#f8f9fa';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <option value="">Selecciona una opción</option>
                      <option value="0-2">0-2 años</option>
                      <option value="3-5">3-5 años</option>
                      <option value="6-10">6-10 años</option>
                      <option value="10+">Más de 10 años</option>
                    </select>
                  </div>
                )}

                {/* Message */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <label style={{
                    fontSize: '14px',
                    color: '#3a5a4a',
                    fontWeight: 500,
                    fontFamily: "'Inter', sans-serif",
                  }}>
                    Mensaje (opcional)
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Cuéntanos más sobre ti o tu empresa..."
                    rows={4}
                    style={{
                      padding: '14px 18px',
                      borderRadius: '12px',
                      border: '1px solid rgba(90, 146, 112, 0.3)',
                      background: '#f8f9fa',
                      color: '#1a2e22',
                      fontSize: '15px',
                      fontFamily: "'Inter', sans-serif",
                      resize: 'vertical',
                      transition: 'all 0.3s',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#5a9270';
                      e.currentTarget.style.background = '#fff';
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(90, 146, 112, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(90, 146, 112, 0.3)';
                      e.currentTarget.style.background = '#f8f9fa';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    marginTop: '8px',
                    padding: '16px 32px',
                    borderRadius: '24px',
                    border: 'none',
                    background: submitting ? '#cbd5d1' : '#5a9270',
                    color: '#ffffff',
                    fontSize: '16px',
                    fontWeight: 600,
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    boxShadow: submitting ? 'none' : '0 4px 12px rgba(90, 146, 112, 0.3)',
                    transition: 'all 0.3s',
                    fontFamily: "'Inter', sans-serif",
                  }}
                  onMouseEnter={(e) => {
                    if (!submitting) {
                      e.currentTarget.style.background = '#4a8062';
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(90, 146, 112, 0.4)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!submitting) {
                      e.currentTarget.style.background = '#5a9270';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(90, 146, 112, 0.3)';
                    }
                  }}
                >
                  {submitting ? 'Enviando...' : 'Enviar solicitud'}
                </button>
              </form>
            </div>
          )}
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
            Psymatch se adhiere al Código de Conducta de Buenas Prácticas en Telepsicología del Colegio Oficial de Psicólogos de Madrid.
          </p>
        </div>
      </section>
    </div>
  );
}

