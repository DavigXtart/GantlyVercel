import { useState, useEffect } from 'react';
import { authService } from '../services/api';
import FormField from './ui/FormField';
import { toast } from './ui/Toast';

interface LoginProps {
  onLogin: () => void;
  onSwitchToRegister: () => void;
  onForgotPassword?: () => void;
  oauthError?: string | null;
  onClearOauthError?: () => void;
}

export default function Login({ onLogin, onSwitchToRegister, onForgotPassword, oauthError, onClearOauthError }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (oauthError) {
      toast.error(oauthError);
      onClearOauthError?.();
    }
  }, [oauthError, onClearOauthError]);

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
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    
    if (emailError || passwordError) {
      setErrors({ email: emailError, password: passwordError });
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      await authService.login(email, password);
      toast.success('Sesión iniciada correctamente');
      onLogin();
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Error al iniciar sesión';
      toast.error(errorMsg);
      setErrors({ email: errorMsg.includes('email') ? errorMsg : undefined });
    } finally {
      setLoading(false);
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
            Bienvenido de nuevo
          </h1>
          <p style={{ 
            margin: 0, 
            fontSize: '17px', 
            lineHeight: 1.7, 
            color: '#3a5a4a',
            marginBottom: '8px',
          }}>
            Conecta con tu espacio de bienestar emocional. Accede a tus evaluaciones, seguimiento personalizado y sesiones con profesionales de la psicología.
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
              <span>Evaluaciones personalizadas</span>
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
              <span>Seguimiento emocional confidencial</span>
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
              <span>Planes adaptados a ti</span>
            </div>
          </div>
          <div style={{ 
            marginTop: 'auto', 
            fontSize: '15px', 
            color: '#3a5a4a',
            paddingTop: '24px',
            borderTop: '1px solid rgba(90, 146, 112, 0.15)',
          }}>
            ¿No tienes cuenta?{' '}
            <button
              onClick={onSwitchToRegister}
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
              Crear cuenta
            </button>
          </div>
        </div>

        {/* Panel derecho - Formulario */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid rgba(90, 146, 112, 0.2)',
            borderRadius: '24px',
            padding: '48px 40px',
            boxShadow: '0 8px 32px rgba(90, 146, 112, 0.15)',
          }}
        >
          <h2 style={{ 
            margin: '0 0 8px', 
            fontSize: '28px', 
            color: '#1a2e22',
            fontFamily: "'Nunito', sans-serif",
            fontWeight: 700,
          }}>
            Iniciar sesión
          </h2>
          <p style={{ 
            margin: '0 0 32px', 
            fontSize: '16px', 
            color: '#3a5a4a',
          }}>
            Ingresa tus datos para acceder a tu espacio personal.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <a
              href={authService.getOAuth2LoginUrl('google')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                padding: '14px 24px',
                borderRadius: '24px',
                border: '1px solid rgba(90, 146, 112, 0.3)',
                background: '#fff',
                color: '#1a2e22',
                fontSize: '16px',
                fontWeight: 600,
                cursor: 'pointer',
                textDecoration: 'none',
                fontFamily: "'Inter', sans-serif",
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f8fbf7';
                e.currentTarget.style.borderColor = '#5a9270';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#fff';
                e.currentTarget.style.borderColor = 'rgba(90, 146, 112, 0.3)';
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continuar con Google
            </a>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ flex: 1, height: '1px', background: 'rgba(90, 146, 112, 0.2)' }} />
              <span style={{ fontSize: '13px', color: '#3a5a4a' }}>o</span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(90, 146, 112, 0.2)' }} />
            </div>
            <FormField
              label="Email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) {
                  setErrors({ ...errors, email: validateEmail(e.target.value) });
                }
              }}
              error={errors.email}
              required
              placeholder="tu@email.com"
              ariaLabel="Correo electrónico"
            />

            <FormField
              label="Contraseña"
              name="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) {
                  setErrors({ ...errors, password: validatePassword(e.target.value) });
                }
              }}
              error={errors.password}
              required
              placeholder="••••••••"
              ariaLabel="Contraseña"
            />

            <div style={{ marginTop: '-8px', marginBottom: '8px' }}>
              <button
                type="button"
                onClick={() => {
                  if (onForgotPassword) {
                    onForgotPassword();
                  } else {
                    const emailValue = email.trim();
                    if (!emailValue) {
                      toast.error('Por favor ingresa tu email primero');
                      return;
                    }
                    authService.forgotPassword(emailValue).then(() => {
                      toast.success('Si el email existe, se enviará un enlace de recuperación');
                    }).catch(() => {
                      toast.success('Si el email existe, se enviará un enlace de recuperación');
                    });
                  }
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#5a9270',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  textDecoration: 'none',
                  padding: 0,
                  fontFamily: "'Inter', sans-serif",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.textDecoration = 'underline'; }}
                onMouseLeave={(e) => { e.currentTarget.style.textDecoration = 'none'; }}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              aria-label="Iniciar sesión"
              aria-busy={loading}
              style={{
                marginTop: '8px',
                padding: '14px 24px',
                borderRadius: '24px',
                border: 'none',
                background: loading ? '#cbd5d1' : '#5a9270',
                color: '#ffffff',
                fontSize: '16px',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : '0 4px 12px rgba(90, 146, 112, 0.3)',
                transition: 'all 0.3s',
                fontFamily: "'Inter', sans-serif",
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
              {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

