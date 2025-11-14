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
        background: 'linear-gradient(135deg, #0f1527 0%, #121f36 45%, #0f1527 100%)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '60px 24px',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); opacity: 0.55; }
          50% { transform: translateY(-10px); opacity: 0.9; }
        }
      `}</style>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 25% 25%, rgba(78, 205, 196, 0.2), transparent 55%), radial-gradient(circle at 80% 20%, rgba(59, 130, 246, 0.2), transparent 60%), radial-gradient(circle at 50% 85%, rgba(34, 197, 94, 0.18), transparent 55%)'
        }}
      />
      {[...Array(5)].map((_, idx) => (
        <div
          key={idx}
          style={{
            position: 'absolute',
            width: `${140 + idx * 30}px`,
            height: `${140 + idx * 30}px`,
            borderRadius: '50%',
            border: '1px solid rgba(148, 163, 184, 0.08)',
            bottom: `${10 + idx * 12}%`,
            right: `${8 + idx * 10}%`,
            animation: `float ${11 + idx * 2}s ease-in-out ${idx}s infinite`
          }}
        />
      ))}
      <div
        style={{
          width: '100%',
          maxWidth: '1080px',
          display: 'grid',
          gridTemplateColumns: 'minmax(320px, 440px) minmax(320px, 420px)',
          gap: '36px',
          position: 'relative',
          zIndex: 1
        }}
      >
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.62)',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            borderRadius: '28px',
            padding: '48px 46px',
            color: 'rgba(226, 232, 240, 0.88)',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
            boxShadow: '0 24px 50px rgba(15, 23, 42, 0.45)'
          }}
        >
          <div style={{ letterSpacing: '0.14em', textTransform: 'uppercase', fontSize: '13px', color: '#7dd3fc' }}>
            Nuevo acceso
          </div>
          <h1 style={{ margin: 0, fontSize: '34px', lineHeight: 1.2, color: '#f8fafc' }}>
            Diseña tu viaje con PSYmatch
          </h1>
          <p style={{ margin: 0, fontSize: '16px', lineHeight: 1.7, color: 'rgba(226, 232, 240, 0.7)' }}>
            Registra tu cuenta para acceder a diagnósticos personalizados, seguimiento emocional y acompañamiento profesional de alto nivel.
          </p>
          <div style={{ marginTop: '24px', display: 'grid', gap: '12px', fontSize: '15px', color: 'rgba(226, 232, 240, 0.75)' }}>
            <div>• Evaluaciones basadas en ciencia</div>
            <div>• Sesiones privadas con psicólogos especializados</div>
            <div>• Planes y reportes adaptados a tu perfil</div>
          </div>
          <div style={{ marginTop: 'auto', fontSize: '14px', color: 'rgba(226, 232, 240, 0.65)' }}>
            ¿Ya tienes cuenta?{' '}
            <button
              onClick={onSwitchToLogin}
              style={{
                border: 'none',
                background: 'transparent',
                color: '#60a5fa',
                fontWeight: 600,
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Iniciar sesión
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
          <h2 style={{ margin: '0 0 6px', fontSize: '24px', color: '#f1f5f9' }}>Crear cuenta</h2>
          <p style={{ margin: '0 0 24px', fontSize: '15px', color: 'rgba(226, 232, 240, 0.62)' }}>
            Completa los datos para personalizar tu experiencia.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '13px',letterSpacing:'0.08em',color:'rgba(226,232,240,0.6)',textTransform:'uppercase' }}>Nombre completo</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Nombre y apellidos"
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
                placeholder="Mínimo 6 caracteres"
                minLength={6}
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
                  : 'linear-gradient(135deg, #38d9a9 0%, #22d3ee 50%, #2563eb 100%)',
                color: '#0f172a',
                fontSize: '15px',
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : '0 12px 32px rgba(34, 197, 94, 0.35)',
                transition: 'transform 0.3s ease'
              }}
            >
              {loading ? 'Creando acceso…' : 'Crear cuenta PSYmatch'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

