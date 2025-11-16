import { useState } from 'react';
import { authService } from '../services/api';

interface RegisterProps {
  onRegister: () => void;
  onSwitchToLogin: () => void;
  sessionId?: string | null;
}

export default function Register({ onRegister, onSwitchToLogin, sessionId }: RegisterProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authService.register(name, email, password, sessionId || undefined);
      onRegister();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al registrarse');
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
            Comienza tu camino
          </h1>
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
            Crear cuenta
          </h2>
          <p style={{ 
            margin: '0 0 32px', 
            fontSize: '16px', 
            color: '#3a5a4a',
          }}>
            Completa tus datos para comenzar tu experiencia.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label style={{ 
                fontSize: '14px',
                color: '#3a5a4a',
                fontWeight: 500,
                fontFamily: "'Inter', sans-serif",
              }}>
                Nombre completo
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Tu nombre"
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label style={{ 
                fontSize: '14px',
                color: '#3a5a4a',
                fontWeight: 500,
                fontFamily: "'Inter', sans-serif",
              }}>
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Mínimo 6 caracteres"
                minLength={6}
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

            {error && (
              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: '12px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#dc2626',
                  fontSize: '14px',
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
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
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

