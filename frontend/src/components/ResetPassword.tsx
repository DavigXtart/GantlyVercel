import { useState } from 'react';
import { authService } from '../services/api';
import FormField from './ui/FormField';
import { toast } from './ui/Toast';
import { CheckCircle } from 'lucide-react';

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
      <div className="min-h-screen bg-gradient-to-br from-gantly-navy-700 via-gantly-blue-600 to-gantly-cyan-500 flex justify-center items-center px-6 py-20">
        <div className="w-full max-w-[500px] bg-white shadow-card border border-gantly-blue-100 rounded-2xl p-12 text-center">
          <div className="mb-6 flex justify-center"><CheckCircle className="w-14 h-14 text-gantly-emerald" /></div>
          <h2 className="m-0 mb-4 text-[28px] text-gantly-text font-heading font-bold">
            Contraseña restablecida
          </h2>
          <p className="m-0 mb-8 text-base text-gantly-muted">
            Tu contraseña ha sido restablecida exitosamente. Serás redirigido al inicio de sesión.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gantly-navy-700 via-gantly-blue-600 to-gantly-cyan-500 flex justify-center items-center px-6 py-20">
      <div className="w-full max-w-[500px] bg-white shadow-card border border-gantly-blue-100 rounded-2xl p-12">
        <h2 className="m-0 mb-2 text-[28px] text-gantly-text font-heading font-bold">
          Restablecer contraseña
        </h2>
        <p className="m-0 mb-8 text-base text-gantly-muted">
          Ingresa tu nueva contraseña.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
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
            className="mt-2 py-3.5 px-6 rounded-full border-none bg-gantly-blue-500 hover:bg-gantly-blue-600 text-white text-base font-semibold cursor-pointer shadow-md hover:shadow-lg transition-all disabled:bg-gray-300 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {loading ? 'Restableciendo...' : 'Restablecer contraseña'}
          </button>

          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="py-3 px-6 rounded-full border border-gantly-blue-200 bg-transparent text-gantly-blue-600 text-[15px] font-semibold cursor-pointer transition-all hover:bg-gantly-blue-50"
            >
              ← Volver
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
