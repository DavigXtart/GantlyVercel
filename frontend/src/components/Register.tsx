import { useState } from 'react';
import { authService } from '../services/api';
import FormField from './ui/FormField';
import { toast } from './ui/Toast';

interface RegisterProps {
  onRegister: () => void;
  onSwitchToLogin: () => void;
  sessionId?: string | null;
  /** Slug del psicólogo (ej: juan-garcia) - si viene por enlace, el usuario se asigna como paciente suyo */
  psychologistReferralCode?: string;
}

export default function Register({ onRegister, onSwitchToLogin, sessionId, psychologistReferralCode }: RegisterProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; birthDate?: string }>({});
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'verify'>('form');
  const [verificationCode, setVerificationCode] = useState('');
  const [verifying, setVerifying] = useState(false);

  const validateName = (name: string): string | undefined => {
    if (!name.trim()) return 'El nombre es obligatorio';
    if (name.trim().length < 2) return 'El nombre debe tener al menos 2 caracteres';
    return undefined;
  };

  const validateEmail = (email: string): string | undefined => {
    if (!email.trim()) return 'El email es obligatorio';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Ingresa un email válido';
    return undefined;
  };

  const validatePassword = (password: string): string | undefined => {
    if (!password) return 'La contraseña es obligatoria';
    if (password.length < 6) return 'La contraseña debe tener al menos 6 caracteres';
    return undefined;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nameError = validateName(name);
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    
    if (nameError || emailError || passwordError) {
      setErrors({ name: nameError, email: emailError, password: passwordError });
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      await authService.register(
        name,
        email,
        password,
        sessionId || undefined,
        'USER',
        undefined,
        psychologistReferralCode || undefined,
        birthDate.trim() || undefined
      );
      toast.success('Te hemos enviado un codigo de verificacion a tu email');
      setStep('verify');
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Error al registrarse';
      toast.error(errorMsg);
      setErrors({ email: errorMsg.includes('email') ? errorMsg : undefined });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (verificationCode.length !== 6) {
      toast.warning('Introduce el codigo de 6 digitos');
      return;
    }
    setVerifying(true);
    try {
      const res = await authService.verifyCode(email, verificationCode);
      if (res.status === 'success') {
        toast.success('Email verificado. Bienvenido!');
        onRegister();
      } else {
        toast.error(res.message || 'Codigo invalido o expirado');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al verificar el codigo');
    } finally {
      setVerifying(false);
    }
  };

  const handleResendCode = async () => {
    try {
      await authService.resendVerificationEmail();
      toast.success('Codigo reenviado a tu email');
    } catch {
      toast.error('Error al reenviar el codigo');
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #e8ece9 0%, #d4e0d8 50%, #e0e8e3 100%)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '80px 24px',
        position: 'relative',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '1000px',
          display: 'grid',
          gridTemplateColumns: 'minmax(300px, 1fr) minmax(320px, 1fr)',
          gap: '48px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Panel izquierdo - Información */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.9)',
            border: '1px solid rgba(90, 146, 112, 0.2)',
            borderRadius: '24px',
            padding: '48px 40px',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            boxShadow: '0 8px 32px rgba(90, 146, 112, 0.15)',
          }}
        >
          <div style={{ 
            fontFamily: "'Nunito', sans-serif",
            fontSize: '32px', 
            fontWeight: 700, 
            color: '#5a9270',
            letterSpacing: '-0.02em',
            marginBottom: '8px',
          }}>
            Gantly
          </div>
          <h1 style={{ 
            margin: 0, 
            fontSize: '36px', 
            lineHeight: 1.3, 
            color: '#1a2e22',
            fontFamily: "'Nunito', sans-serif",
            fontWeight: 700,
          }}>
            Comienza tu camino
          </h1>
          {psychologistReferralCode && (
            <div style={{
              padding: '12px 16px',
              background: 'rgba(90, 146, 112, 0.15)',
              borderRadius: '12px',
              fontSize: '15px',
              color: '#3a5a4a',
              marginBottom: '12px',
            }}>
              Serás asignado directamente a tu psicólogo tras registrarte.
            </div>
          )}
          <p style={{ 
            margin: 0, 
            fontSize: '17px', 
            lineHeight: 1.7, 
            color: '#3a5a4a',
            marginBottom: '8px',
          }}>
            Crea tu cuenta para acceder a evaluaciones personalizadas, seguimiento emocional y acompañamiento profesional adaptado a tus necesidades.
          </p>
          <div style={{ 
            marginTop: '24px', 
            display: 'flex', 
            flexDirection: 'column',
            gap: '16px', 
            fontSize: '16px', 
            color: '#3a5a4a',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ 
                width: '24px', 
                height: '24px', 
                borderRadius: '50%', 
                background: '#d4e0d8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>✓</div>
              <span>Evaluaciones basadas en ciencia</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ 
                width: '24px', 
                height: '24px', 
                borderRadius: '50%', 
                background: '#d4e0d8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>✓</div>
              <span>Sesiones con profesionales especializados</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ 
                width: '24px', 
                height: '24px', 
                borderRadius: '50%', 
                background: '#d4e0d8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>✓</div>
              <span>Planes personalizados para ti</span>
            </div>
          </div>
          <div style={{ 
            marginTop: 'auto', 
            fontSize: '15px', 
            color: '#3a5a4a',
            paddingTop: '24px',
            borderTop: '1px solid rgba(90, 146, 112, 0.15)',
          }}>
            ¿Ya tienes cuenta?{' '}
            <button
              onClick={onSwitchToLogin}
              style={{
                border: 'none',
                background: 'transparent',
                color: '#5a9270',
                fontWeight: 600,
                cursor: 'pointer',
                textDecoration: 'none',
                fontFamily: "'Inter', sans-serif",
                fontSize: '15px',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.textDecoration = 'underline'; }}
              onMouseLeave={(e) => { e.currentTarget.style.textDecoration = 'none'; }}
            >
              Iniciar sesión
            </button>
          </div>
        </div>

        {/* Panel derecho - Formulario / Verificación */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid rgba(90, 146, 112, 0.2)',
            borderRadius: '24px',
            padding: '48px 40px',
            boxShadow: '0 8px 32px rgba(90, 146, 112, 0.15)',
          }}
        >
          {step === 'form' ? (
            <>
              <h2 style={{ margin: '0 0 8px', fontSize: '28px', color: '#1a2e22', fontFamily: "'Nunito', sans-serif", fontWeight: 700 }}>
                Crear cuenta
              </h2>
              <p style={{ margin: '0 0 32px', fontSize: '16px', color: '#3a5a4a' }}>
                Completa tus datos para comenzar tu experiencia.
              </p>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} aria-label="Formulario de registro">
                <FormField label="Nombre completo" name="name" type="text" value={name}
                  onChange={(e) => { setName(e.target.value); if (errors.name) setErrors({ ...errors, name: validateName(e.target.value) }); }}
                  error={errors.name} required placeholder="Tu nombre" ariaLabel="Nombre completo" />
                <FormField label="Email" name="email" type="email" value={email}
                  onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors({ ...errors, email: validateEmail(e.target.value) }); }}
                  error={errors.email} required placeholder="tu@email.com" ariaLabel="Correo electrónico" />
                <FormField label="Contraseña" name="password" type="password" value={password}
                  onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors({ ...errors, password: validatePassword(e.target.value) }); }}
                  error={errors.password} required placeholder="Minimo 6 caracteres" ariaLabel="Contraseña" />
                <FormField label="Fecha de nacimiento" name="birthDate" type="date" value={birthDate}
                  onChange={(e) => { setBirthDate(e.target.value); if (errors.birthDate) setErrors({ ...errors, birthDate: undefined }); }}
                  error={errors.birthDate} placeholder="" ariaLabel="Fecha de nacimiento" />
                <button type="submit" disabled={loading} style={{
                  marginTop: '8px', padding: '14px 24px', borderRadius: '24px', border: 'none',
                  background: loading ? '#cbd5d1' : '#5a9270', color: '#ffffff', fontSize: '16px',
                  fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: loading ? 'none' : '0 4px 12px rgba(90, 146, 112, 0.3)',
                  transition: 'all 0.3s', fontFamily: "'Inter', sans-serif",
                }}>
                  {loading ? 'Creando cuenta...' : 'Crear cuenta'}
                </button>
              </form>
            </>
          ) : (
            <>
              <h2 style={{ margin: '0 0 8px', fontSize: '28px', color: '#1a2e22', fontFamily: "'Nunito', sans-serif", fontWeight: 700 }}>
                Verifica tu email
              </h2>
              <p style={{ margin: '0 0 8px', fontSize: '16px', color: '#3a5a4a' }}>
                Hemos enviado un codigo de 6 digitos a:
              </p>
              <p style={{ margin: '0 0 32px', fontSize: '16px', color: '#1a2e22', fontWeight: 600 }}>
                {email}
              </p>

              <form onSubmit={handleVerifyCode} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#3a5a4a', marginBottom: '8px', fontFamily: "'Inter', sans-serif" }}>
                    Codigo de verificacion
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    autoFocus
                    style={{
                      width: '100%', padding: '16px', borderRadius: '12px', border: '2px solid rgba(90, 146, 112, 0.3)',
                      fontSize: '24px', fontWeight: 700, textAlign: 'center', letterSpacing: '8px',
                      fontFamily: "'Inter', sans-serif", outline: 'none', boxSizing: 'border-box',
                      transition: 'border-color 0.2s ease',
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#5a9270'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(90, 146, 112, 0.3)'; }}
                  />
                </div>

                <button type="submit" disabled={verifying || verificationCode.length !== 6} style={{
                  padding: '14px 24px', borderRadius: '24px', border: 'none',
                  background: (verifying || verificationCode.length !== 6) ? '#cbd5d1' : '#5a9270',
                  color: '#ffffff', fontSize: '16px', fontWeight: 600,
                  cursor: (verifying || verificationCode.length !== 6) ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 12px rgba(90, 146, 112, 0.3)', transition: 'all 0.3s',
                  fontFamily: "'Inter', sans-serif",
                }}>
                  {verifying ? 'Verificando...' : 'Verificar'}
                </button>

                <div style={{ textAlign: 'center', fontSize: '14px', color: '#6b7280' }}>
                  ¿No recibiste el codigo?{' '}
                  <button onClick={handleResendCode} type="button" style={{
                    border: 'none', background: 'transparent', color: '#5a9270',
                    fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif", fontSize: '14px',
                  }}>
                    Reenviar
                  </button>
                </div>

                <button onClick={() => { setStep('form'); setVerificationCode(''); }} type="button" style={{
                  border: 'none', background: 'transparent', color: '#6b7280',
                  cursor: 'pointer', fontFamily: "'Inter', sans-serif", fontSize: '14px',
                  textAlign: 'center',
                }}>
                  Volver al formulario
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

