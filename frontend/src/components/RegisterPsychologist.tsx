import { useState } from 'react';
import { authService } from '../services/api';

interface RegisterPsychologistProps {
  onBack: () => void;
  onLogin: () => void;
  onSuccess: () => void;
}

export default function RegisterPsychologist({ onBack, onLogin, onSuccess }: RegisterPsychologistProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    // Paso 1: Información personal
    name: '',
    email: '',
    phone: '',
    
    // Paso 2: Credenciales profesionales
    license: '',
    experience: '',
    specialization: '',
    
    // Paso 3: Credenciales de acceso
    password: '',
    confirmPassword: '',
    
    // Paso 4: Términos y condiciones
    acceptTerms: false,
    acceptPrivacy: false,
  });

  const totalSteps = 4;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setError('');
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim()) {
          setError('Por favor, completa todos los campos');
          return false;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          setError('Por favor, ingresa un email válido');
          return false;
        }
        return true;
      case 2:
        if (!formData.license.trim() || !formData.experience || !formData.specialization.trim()) {
          setError('Por favor, completa todos los campos');
          return false;
        }
        return true;
      case 3:
        if (!formData.password || !formData.confirmPassword) {
          setError('Por favor, completa todos los campos');
          return false;
        }
        if (formData.password.length < 8) {
          setError('La contraseña debe tener al menos 8 caracteres');
          return false;
        }
        if (formData.password !== formData.confirmPassword) {
          setError('Las contraseñas no coinciden');
          return false;
        }
        return true;
      case 4:
        if (!formData.acceptTerms || !formData.acceptPrivacy) {
          setError('Debes aceptar los términos y condiciones y la política de privacidad');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
      setError('');
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(4)) return;

    setLoading(true);
    setError('');

    try {
      // Registrar como psicólogo con role PSYCHOLOGIST
      await authService.register(formData.name, formData.email, formData.password, undefined, 'PSYCHOLOGIST');
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al registrarse. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { number: 1, title: 'Información personal', icon: '👤' },
    { number: 2, title: 'Credenciales profesionales', icon: '🎓' },
    { number: 3, title: 'Contraseña', icon: '🔒' },
    { number: 4, title: 'Confirmación', icon: '✅' },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7f6 0%, #e8ece9 50%, #d4e0d8 100%)',
      padding: '100px 24px 80px',
      fontFamily: "'Inter', sans-serif",
    }}>
      {/* Navigation */}
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
            cursor: 'pointer',
            transition: 'opacity 0.3s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.7'; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
        >
          PSYmatch
        </div>
        <button
          onClick={onLogin}
          style={{
            padding: '10px 24px',
            fontSize: '15px',
            fontWeight: 600,
            background: 'transparent',
            color: '#5a9270',
            border: '2px solid #5a9270',
            borderRadius: '24px',
            cursor: 'pointer',
            transition: 'all 0.3s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#5a9270';
            e.currentTarget.style.color = 'white';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = '#5a9270';
          }}
        >
          Iniciar sesión
        </button>
      </nav>

      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
      }}>
        {/* Progress Bar */}
        <div style={{
          marginBottom: '48px',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
          }}>
            {steps.map((step, idx) => (
              <div key={step.number} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  background: currentStep >= step.number ? '#5a9270' : '#d4e0d8',
                  color: currentStep >= step.number ? 'white' : '#3a5a4a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  fontWeight: 600,
                  marginBottom: '8px',
                  transition: 'all 0.3s',
                  position: 'relative',
                  zIndex: 2,
                }}>
                  {currentStep > step.number ? '✓' : step.number}
                </div>
                <span style={{
                  fontSize: '12px',
                  color: currentStep >= step.number ? '#5a9270' : '#9ca3af',
                  fontWeight: currentStep >= step.number ? 600 : 400,
                  textAlign: 'center',
                }}>
                  {step.title}
                </span>
                {idx < steps.length - 1 && (
                  <div style={{
                    position: 'absolute',
                    top: '25px',
                    left: 'calc(50% + 25px)',
                    right: 'calc(-50% + 25px)',
                    height: '2px',
                    background: currentStep > step.number ? '#5a9270' : '#d4e0d8',
                    zIndex: 1,
                  }} />
                )}
              </div>
            ))}
          </div>
          <div style={{
            height: '4px',
            background: '#d4e0d8',
            borderRadius: '2px',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${(currentStep / totalSteps) * 100}%`,
              background: 'linear-gradient(90deg, #5a9270, #4a8062)',
              transition: 'width 0.3s ease',
            }} />
          </div>
        </div>

        {/* Form Card */}
        <div style={{
          background: 'white',
          borderRadius: '24px',
          padding: '48px',
          boxShadow: '0 10px 40px rgba(90, 146, 112, 0.15)',
          border: '1px solid rgba(90, 146, 112, 0.1)',
        }}>
          {error && (
            <div style={{
              padding: '16px',
              background: '#fee2e2',
              border: '1px solid #fca5a5',
              borderRadius: '12px',
              color: '#991b1b',
              marginBottom: '24px',
              fontSize: '14px',
            }}>
              {error}
            </div>
          )}

          <form onSubmit={currentStep === totalSteps ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }}>
            {/* Paso 1: Información personal */}
            {currentStep === 1 && (
              <div style={{ animation: 'fadeIn 0.3s' }}>
                <h2 style={{
                  fontSize: '32px',
                  fontWeight: 700,
                  color: '#1a2e22',
                  marginBottom: '8px',
                  fontFamily: "'Nunito', sans-serif",
                }}>
                  Información personal
                </h2>
                <p style={{
                  fontSize: '16px',
                  color: '#3a5a4a',
                  marginBottom: '32px',
                }}>
                  Comienza con tus datos básicos
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: 600,
                      color: '#1a2e22',
                      marginBottom: '8px',
                    }}>
                      Nombre completo *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Ej: María García López"
                      required
                      style={{
                        width: '100%',
                        padding: '14px 18px',
                        borderRadius: '12px',
                        border: '1px solid #d4e0d8',
                        fontSize: '16px',
                        transition: 'all 0.3s',
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#5a9270';
                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(90, 146, 112, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = '#d4e0d8';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    />
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: 600,
                      color: '#1a2e22',
                      marginBottom: '8px',
                    }}>
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="tu@email.com"
                      required
                      style={{
                        width: '100%',
                        padding: '14px 18px',
                        borderRadius: '12px',
                        border: '1px solid #d4e0d8',
                        fontSize: '16px',
                        transition: 'all 0.3s',
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#5a9270';
                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(90, 146, 112, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = '#d4e0d8';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    />
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: 600,
                      color: '#1a2e22',
                      marginBottom: '8px',
                    }}>
                      Teléfono *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+34 600 000 000"
                      required
                      style={{
                        width: '100%',
                        padding: '14px 18px',
                        borderRadius: '12px',
                        border: '1px solid #d4e0d8',
                        fontSize: '16px',
                        transition: 'all 0.3s',
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#5a9270';
                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(90, 146, 112, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = '#d4e0d8';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Paso 2: Credenciales profesionales */}
            {currentStep === 2 && (
              <div style={{ animation: 'fadeIn 0.3s' }}>
                <h2 style={{
                  fontSize: '32px',
                  fontWeight: 700,
                  color: '#1a2e22',
                  marginBottom: '8px',
                  fontFamily: "'Nunito', sans-serif",
                }}>
                  Credenciales profesionales
                </h2>
                <p style={{
                  fontSize: '16px',
                  color: '#3a5a4a',
                  marginBottom: '32px',
                }}>
                  Verificaremos tus credenciales para ejercer como psicólogo
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: 600,
                      color: '#1a2e22',
                      marginBottom: '8px',
                    }}>
                      Número de colegiado *
                    </label>
                    <input
                      type="text"
                      name="license"
                      value={formData.license}
                      onChange={handleChange}
                      placeholder="Ej: M-12345"
                      required
                      style={{
                        width: '100%',
                        padding: '14px 18px',
                        borderRadius: '12px',
                        border: '1px solid #d4e0d8',
                        fontSize: '16px',
                        transition: 'all 0.3s',
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#5a9270';
                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(90, 146, 112, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = '#d4e0d8';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    />
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: 600,
                      color: '#1a2e22',
                      marginBottom: '8px',
                    }}>
                      Años de experiencia *
                    </label>
                    <select
                      name="experience"
                      value={formData.experience}
                      onChange={handleChange}
                      required
                      style={{
                        width: '100%',
                        padding: '14px 18px',
                        borderRadius: '12px',
                        border: '1px solid #d4e0d8',
                        fontSize: '16px',
                        background: 'white',
                        cursor: 'pointer',
                        transition: 'all 0.3s',
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#5a9270';
                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(90, 146, 112, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = '#d4e0d8';
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

                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: 600,
                      color: '#1a2e22',
                      marginBottom: '8px',
                    }}>
                      Especialización *
                    </label>
                    <input
                      type="text"
                      name="specialization"
                      value={formData.specialization}
                      onChange={handleChange}
                      placeholder="Ej: Psicología clínica, Terapia cognitivo-conductual..."
                      required
                      style={{
                        width: '100%',
                        padding: '14px 18px',
                        borderRadius: '12px',
                        border: '1px solid #d4e0d8',
                        fontSize: '16px',
                        transition: 'all 0.3s',
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#5a9270';
                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(90, 146, 112, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = '#d4e0d8';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Paso 3: Contraseña */}
            {currentStep === 3 && (
              <div style={{ animation: 'fadeIn 0.3s' }}>
                <h2 style={{
                  fontSize: '32px',
                  fontWeight: 700,
                  color: '#1a2e22',
                  marginBottom: '8px',
                  fontFamily: "'Nunito', sans-serif",
                }}>
                  Crea tu contraseña
                </h2>
                <p style={{
                  fontSize: '16px',
                  color: '#3a5a4a',
                  marginBottom: '32px',
                }}>
                  Elige una contraseña segura para tu cuenta
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: 600,
                      color: '#1a2e22',
                      marginBottom: '8px',
                    }}>
                      Contraseña *
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Mínimo 8 caracteres"
                      required
                      style={{
                        width: '100%',
                        padding: '14px 18px',
                        borderRadius: '12px',
                        border: '1px solid #d4e0d8',
                        fontSize: '16px',
                        transition: 'all 0.3s',
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#5a9270';
                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(90, 146, 112, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = '#d4e0d8';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    />
                    <p style={{
                      fontSize: '12px',
                      color: '#6b7280',
                      marginTop: '6px',
                    }}>
                      Debe tener al menos 8 caracteres
                    </p>
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: 600,
                      color: '#1a2e22',
                      marginBottom: '8px',
                    }}>
                      Confirmar contraseña *
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Repite tu contraseña"
                      required
                      style={{
                        width: '100%',
                        padding: '14px 18px',
                        borderRadius: '12px',
                        border: '1px solid #d4e0d8',
                        fontSize: '16px',
                        transition: 'all 0.3s',
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#5a9270';
                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(90, 146, 112, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = '#d4e0d8';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Paso 4: Confirmación */}
            {currentStep === 4 && (
              <div style={{ animation: 'fadeIn 0.3s' }}>
                <h2 style={{
                  fontSize: '32px',
                  fontWeight: 700,
                  color: '#1a2e22',
                  marginBottom: '8px',
                  fontFamily: "'Nunito', sans-serif",
                }}>
                  Último paso
                </h2>
                <p style={{
                  fontSize: '16px',
                  color: '#3a5a4a',
                  marginBottom: '32px',
                }}>
                  Revisa y acepta los términos para completar tu registro
                </p>

                <div style={{
                  background: '#f9fafb',
                  borderRadius: '12px',
                  padding: '24px',
                  marginBottom: '24px',
                  border: '1px solid #e5e7eb',
                }}>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: 600,
                    color: '#1a2e22',
                    marginBottom: '16px',
                  }}>
                    Resumen de tu información
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px', color: '#3a5a4a' }}>
                    <div><strong>Nombre:</strong> {formData.name}</div>
                    <div><strong>Email:</strong> {formData.email}</div>
                    <div><strong>Teléfono:</strong> {formData.phone}</div>
                    <div><strong>Colegiado:</strong> {formData.license}</div>
                    <div><strong>Experiencia:</strong> {formData.experience} años</div>
                    <div><strong>Especialización:</strong> {formData.specialization}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    cursor: 'pointer',
                  }}>
                    <input
                      type="checkbox"
                      name="acceptTerms"
                      checked={formData.acceptTerms}
                      onChange={handleChange}
                      style={{
                        marginTop: '4px',
                        width: '20px',
                        height: '20px',
                        cursor: 'pointer',
                      }}
                    />
                    <span style={{ fontSize: '14px', color: '#3a5a4a', lineHeight: 1.6 }}>
                      Acepto los <a href="#" style={{ color: '#5a9270', textDecoration: 'underline' }}>términos y condiciones</a> de PSYmatch *
                    </span>
                  </label>

                  <label style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    cursor: 'pointer',
                  }}>
                    <input
                      type="checkbox"
                      name="acceptPrivacy"
                      checked={formData.acceptPrivacy}
                      onChange={handleChange}
                      style={{
                        marginTop: '4px',
                        width: '20px',
                        height: '20px',
                        cursor: 'pointer',
                      }}
                    />
                    <span style={{ fontSize: '14px', color: '#3a5a4a', lineHeight: 1.6 }}>
                      Acepto la <a href="#" style={{ color: '#5a9270', textDecoration: 'underline' }}>política de privacidad</a> y el tratamiento de mis datos *
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '40px',
              gap: '16px',
            }}>
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handlePrevious}
                  style={{
                    padding: '14px 32px',
                    fontSize: '16px',
                    fontWeight: 600,
                    background: 'white',
                    color: '#5a9270',
                    border: '2px solid #5a9270',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f9fafb';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'white';
                  }}
                >
                  Anterior
                </button>
              )}
              <div style={{ flex: 1 }} />
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '14px 32px',
                  fontSize: '16px',
                  fontWeight: 600,
                  background: loading ? '#cbd5d1' : '#5a9270',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s',
                  boxShadow: loading ? 'none' : '0 4px 12px rgba(90, 146, 112, 0.3)',
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.background = '#4a8062';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(90, 146, 112, 0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.currentTarget.style.background = '#5a9270';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(90, 146, 112, 0.3)';
                  }
                }}
              >
                {loading ? 'Registrando...' : currentStep === totalSteps ? 'Completar registro' : 'Siguiente'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

