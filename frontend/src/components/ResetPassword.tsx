import { useState } from 'react';
import { authService } from '../services/api';
import FormField from './ui/FormField';
import { toast } from './ui/Toast';

interface ResetPasswordProps {
  token: string;
  onSuccess?: () => void;
  onBack?: () => void;
}

export default function ResetPassword({ token, onSuccess, onBack }: ResetPasswordProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ newPassword?: string; confirmPassword?: string }>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validatePassword = (password: string): string | undefined => {
    if (!password) return 'La contraseña es obligatoria';
    if (password.length < 6) return 'La contraseña debe tener al menos 6 caracteres';
    return undefined;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const passwordError = validatePassword(newPassword);
    const confirmError = newPassword !== confirmPassword ? 'Las contraseñas no coinciden' : undefined;
    
    if (passwordError || confirmError) {
      setErrors({ newPassword: passwordError, confirmPassword: confirmError });
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const response = await authService.resetPassword(token, newPassword);
      if (response.status === 'success') {
        setSuccess(true);
        toast.success('Contraseña restablecida exitosamente');
        setTimeout(() => {
          if (onSuccess) onSuccess();
        }, 2000);
      } else {
        toast.error(response.message || 'Error al restablecer la contraseña');
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Error al restablecer la contraseña';
      toast.error(errorMsg);
      setErrors({ newPassword: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
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
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '64px', marginBottom: '24px' }}>✅</div>
          <h2 style={{ 
            margin: '0 0 16px', 
            fontSize: '28px', 
            color: '#1a2e22',
            fontFamily: "'Nunito', sans-serif",
            fontWeight: 700,
          }}>
            Contraseña restablecida
          </h2>
          <p style={{ 
            margin: '0 0 32px', 
            fontSize: '16px', 
            color: '#3a5a4a',
          }}>
            Tu contraseña ha sido restablecida exitosamente. Serás redirigido al inicio de sesión.
          </p>
        </div>
      </div>
    );
  }

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
        <h2 style={{ 
          margin: '0 0 8px', 
          fontSize: '28px', 
          color: '#1a2e22',
          fontFamily: "'Nunito', sans-serif",
          fontWeight: 700,
        }}>
          Restablecer contraseña
        </h2>
        <p style={{ 
          margin: '0 0 32px', 
          fontSize: '16px', 
          color: '#3a5a4a',
        }}>
          Ingresa tu nueva contraseña.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <FormField
            label="Nueva contraseña"
            name="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              if (errors.newPassword) {
                setErrors({ ...errors, newPassword: validatePassword(e.target.value) });
              }
              if (errors.confirmPassword && confirmPassword) {
                setErrors({ ...errors, confirmPassword: e.target.value !== confirmPassword ? 'Las contraseñas no coinciden' : undefined });
              }
            }}
            error={errors.newPassword}
            required
            placeholder="••••••••"
            ariaLabel="Nueva contraseña"
          />

          <FormField
            label="Confirmar contraseña"
            name="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (errors.confirmPassword) {
                setErrors({ ...errors, confirmPassword: e.target.value !== newPassword ? 'Las contraseñas no coinciden' : undefined });
              }
            }}
            error={errors.confirmPassword}
            required
            placeholder="••••••••"
            ariaLabel="Confirmar contraseña"
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
            {loading ? 'Restableciendo...' : 'Restablecer contraseña'}
          </button>

          {onBack && (
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
          )}
        </form>
      </div>
    </div>
  );
}

