import { useState } from 'react';
import { authService } from '../services/api';
import FormField from './ui/FormField';
import { toast } from './ui/Toast';

interface LoginProps {
  onLogin: () => void;
  onSwitchToRegister: () => void;
  onForgotPassword?: () => void;
}

export default function Login({ onLogin, onSwitchToRegister, onForgotPassword }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);

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
            Psymatch
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

