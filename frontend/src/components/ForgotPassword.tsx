import { useState } from 'react';
import { authService } from '../services/api';
import FormField from './ui/FormField';
import { toast } from './ui/Toast';
import { Mail } from 'lucide-react';

interface ForgotPasswordProps {
  onBack: () => void;
  onSuccess?: () => void;
}

export default function ForgotPassword({ onBack, onSuccess: _onSuccess }: ForgotPasswordProps) {
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
    <div className="min-h-screen bg-gradient-to-br from-gantly-navy-700 via-gantly-blue-600 to-gantly-cyan-500 flex justify-center items-center px-6 py-20">
      <div className="w-full max-w-[500px] bg-white shadow-card border border-gantly-blue-100 rounded-2xl p-12">
        {!sent ? (
          <>
            <h2 className="m-0 mb-2 text-[28px] text-gantly-text font-heading font-bold">
              Recuperar contraseña
            </h2>
            <p className="m-0 mb-8 text-base text-gantly-muted">
              Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
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
                className="mt-2 py-3.5 px-6 rounded-full border-none bg-gantly-blue-500 hover:bg-gantly-blue-600 text-white text-base font-semibold cursor-pointer shadow-md hover:shadow-lg transition-all disabled:bg-gray-300 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
              </button>

              <button
                type="button"
                onClick={onBack}
                className="py-3 px-6 rounded-full border border-gantly-blue-200 bg-transparent text-gantly-blue-600 text-[15px] font-semibold cursor-pointer transition-all hover:bg-gantly-blue-50"
              >
                ← Volver
              </button>
            </form>
          </>
        ) : (
          <>
            <div className="text-center">
              <div className="mb-6 flex justify-center"><Mail className="w-14 h-14 text-gantly-blue" /></div>
              <h2 className="m-0 mb-4 text-[28px] text-gantly-text font-heading font-bold">
                Email enviado
              </h2>
              <p className="m-0 mb-8 text-base text-gantly-muted leading-relaxed">
                Si el email <strong>{email}</strong> existe en nuestra base de datos, recibirás un enlace para restablecer tu contraseña.
              </p>
              <button
                type="button"
                onClick={onBack}
                className="py-3.5 px-6 rounded-full border-none bg-gantly-blue-500 hover:bg-gantly-blue-600 text-white text-base font-semibold cursor-pointer shadow-md hover:shadow-lg transition-all"
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
