import { useState } from 'react';
import { authService } from '../services/api';

interface LoginProps {
  onLogin: () => void;
  onSwitchToRegister: () => void;
}

export default function Login({ onLogin, onSwitchToRegister }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authService.login(email, password);
      onLogin();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0b1629 0%, #101a32 40%, #0b1629 100%)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '60px 24px',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <style>{`
        @keyframes glow {
          0%, 100% { transform: translateY(0); opacity: 0.5; }
          50% { transform: translateY(-8px); opacity: 0.9; }
        }
      `}</style>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 20% 30%, rgba(37, 99, 235, 0.22), transparent 55%), radial-gradient(circle at 80% 20%, rgba(59, 130, 246, 0.18), transparent 60%), radial-gradient(circle at 50% 85%, rgba(34, 197, 94, 0.18), transparent 55%)',
          pointerEvents: 'none'
        }}
      />
      {[...Array(5)].map((_, idx) => (
        <div
          key={idx}
          style={{
            position: 'absolute',
            width: `${120 + idx * 40}px`,
            height: `${120 + idx * 40}px`,
            borderRadius: '50%',
            border: '1px solid rgba(148, 163, 184, 0.08)',
            top: `${10 + idx * 15}%`,
            left: `${5 + idx * 12}%`,
            animation: `glow ${12 + idx * 2}s ease-in-out ${idx}s infinite`
          }}
        />
      ))}
      <div
        style={{
          width: '100%',
          maxWidth: '1040px',
          display: 'grid',
          gridTemplateColumns: 'minmax(300px, 420px) minmax(320px, 420px)',
          gap: '36px',
          position: 'relative',
          zIndex: 1
        }}
      >
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.65)',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            borderRadius: '28px',
            padding: '46px 44px',
            color: 'rgba(226, 232, 240, 0.88)',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
            boxShadow: '0 24px 50px rgba(15, 23, 42, 0.45)'
          }}
        >
          <div style={{ letterSpacing: '0.14em', textTransform: 'uppercase', fontSize: '13px', color: '#93c5fd' }}>
            Acceso profesional
          </div>
          <h1 style={{ margin: 0, fontSize: '34px', lineHeight: 1.2, color: '#f8fafc' }}>
            Bienvenido de nuevo a PSYmatch
          </h1>
          <p style={{ margin: 0, fontSize: '16px', lineHeight: 1.7, color: 'rgba(226, 232, 240, 0.7)' }}>
            Conecta con tus evaluaciones, seguimiento emocional y citas. Tu espacio seguro para gestionar el acompañamiento psicológico.
          </p>
          <div style={{ marginTop: '24px', display: 'grid', gap: '12px', fontSize: '15px', color: 'rgba(226, 232, 240, 0.75)' }}>
            <div>• Analíticas en tiempo real</div>
            <div>• Comunicación confidencial con especialistas</div>
            <div>• Historial y planes personalizados</div>
          </div>
          <div style={{ marginTop: 'auto', fontSize: '14px', color: 'rgba(226, 232, 240, 0.65)' }}>
            ¿No tienes cuenta?{' '}
            <button
              onClick={onSwitchToRegister}
              style={{
                border: 'none',
                background: 'transparent',
                color: '#60a5fa',
                fontWeight: 600,
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Crear acceso
            </button>
          </div>
        </div>

        <div
          style={{
            background: 'rgba(15, 23, 42, 0.78)',
            border: '1px solid rgba(148, 163, 184, 0.16)',
            borderRadius: '28px',
            padding: '44px',
            boxShadow: '0 18px 40px rgba(15, 23, 42, 0.38)',
            backdropFilter: 'blur(12px)'
          }}
        >
          <h2 style={{ margin: '0 0 6px', fontSize: '24px', color: '#f1f5f9' }}>Iniciar sesión</h2>
          <p style={{ margin: '0 0 24px', fontSize: '15px', color: 'rgba(226, 232, 240, 0.62)' }}>
            Ingresa tus credenciales corporativas para continuar.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '13px',letterSpacing:'0.08em',color:'rgba(226,232,240,0.6)',textTransform:'uppercase' }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="nombre@empresa.com"
                style={{
                  padding: '16px 18px',
                  borderRadius: '14px',
                  border: '1px solid rgba(148, 163, 184, 0.25)',
                  background: 'rgba(15, 23, 42, 0.55)',
                  color: '#f8fafc',
                  fontSize: '15px'
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '13px',letterSpacing:'0.08em',color:'rgba(226,232,240,0.6)',textTransform:'uppercase' }}>Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                style={{
                  padding: '16px 18px',
                  borderRadius: '14px',
                  border: '1px solid rgba(148, 163, 184, 0.25)',
                  background: 'rgba(15, 23, 42, 0.55)',
                  color: '#f8fafc',
                  fontSize: '15px'
                }}
              />
            </div>

            {error && (
              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: '12px',
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(248, 113, 113, 0.35)',
                  color: '#fecaca',
                  fontSize: '14px'
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: '12px',
                padding: '16px 20px',
                borderRadius: '999px',
                border: 'none',
                background: loading
                  ? 'rgba(148, 163, 184, 0.4)'
                  : 'linear-gradient(135deg, #38bdf8 0%, #2563eb 50%, #1e3a8a 100%)',
                color: '#0f172a',
                fontSize: '15px',
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : '0 12px 32px rgba(37, 99, 235, 0.35)',
                transition: 'transform 0.3s ease'
              }}
            >
              {loading ? 'Validando acceso…' : 'Entrar a PSYmatch'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

