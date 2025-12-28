import { useState } from 'react';
import { authService } from '../services/api';
import FormField from './ui/FormField';
import { toast } from './ui/Toast';

interface ForgotPasswordProps {
  onBack: () => void;
  onSuccess?: () => void;
}

export default function ForgotPassword({ onBack, onSuccess }: ForgotPasswordProps) {
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<{ email?: string }>({});
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const validateEmail = (email: string): string | undefined => {
    if (!email.trim()) return 'El email es obligatorio';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Ingresa un email válido';
    return undefined;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailError = validateEmail(email);
    
    if (emailError) {
      setErrors({ email: emailError });
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      await authService.forgotPassword(email);
      setSent(true);
      toast.success('Si el email existe, se enviará un enlace de recuperación');
    } catch (err: any) {
      // Siempre mostrar éxito para seguridad
      setSent(true);
      toast.success('Si el email existe, se enviará un enlace de recuperación');
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
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '500px',
          background: 'rgba(255, 255, 255, 0.95)',
          border: '1px solid rgba(90, 146, 112, 0.2)',
          borderRadius: '24px',
          padding: '48px 40px',
          boxShadow: '0 8px 32px rgba(90, 146, 112, 0.15)',
        }}
      >
        {!sent ? (
          <>
            <h2 style={{ 
              margin: '0 0 8px', 
              fontSize: '28px', 
              color: '#1a2e22',
              fontFamily: "'Nunito', sans-serif",
              fontWeight: 700,
            }}>
              Recuperar contraseña
            </h2>
            <p style={{ 
              margin: '0 0 32px', 
              fontSize: '16px', 
              color: '#3a5a4a',
            }}>
              Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña.
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
                    setErrors({ email: validateEmail(e.target.value) });
                  }
                }}
                error={errors.email}
                required
                placeholder="tu@email.com"
                ariaLabel="Correo electrónico"
              />

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
              >
                {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
              </button>

              <button
                type="button"
                onClick={onBack}
                style={{
                  padding: '12px 24px',
                  borderRadius: '24px',
                  border: '1px solid #5a9270',
                  background: 'transparent',
                  color: '#5a9270',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  fontFamily: "'Inter', sans-serif",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f0f5f3';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                ← Volver
              </button>
            </form>
          </>
        ) : (
          <>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '64px', marginBottom: '24px' }}>✉️</div>
              <h2 style={{ 
                margin: '0 0 16px', 
                fontSize: '28px', 
                color: '#1a2e22',
                fontFamily: "'Nunito', sans-serif",
                fontWeight: 700,
              }}>
                Email enviado
              </h2>
              <p style={{ 
                margin: '0 0 32px', 
                fontSize: '16px', 
                color: '#3a5a4a',
                lineHeight: '1.6',
              }}>
                Si el email <strong>{email}</strong> existe en nuestra base de datos, recibirás un enlace para restablecer tu contraseña.
              </p>
              <button
                type="button"
                onClick={onBack}
                style={{
                  padding: '14px 24px',
                  borderRadius: '24px',
                  border: 'none',
                  background: '#5a9270',
                  color: '#ffffff',
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(90, 146, 112, 0.3)',
                  transition: 'all 0.3s',
                  fontFamily: "'Inter', sans-serif",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#4a8062';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#5a9270';
                }}
              >
                Volver al inicio de sesión
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

