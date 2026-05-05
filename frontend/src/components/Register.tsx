import { useState, useEffect } from 'react';
import { authService } from '../services/api';
import FormField from './ui/FormField';
import { toast } from './ui/Toast';

interface RegisterProps {
  onRegister: () => void;
  onSwitchToLogin: () => void;
  sessionId?: string | null;
  /** Slug del psicólogo (ej: juan-garcia) - si viene por enlace, el usuario se asigna como paciente suyo */
  psychologistReferralCode?: string;
  /** Token de invitación de empresa */
  inviteToken?: string;
}

export default function Register({ onRegister, onSwitchToLogin, sessionId, psychologistReferralCode, inviteToken }: RegisterProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; birthDate?: string }>({});
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'verify'>('form');
  const [verificationCode, setVerificationCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [inviteInfo, setInviteInfo] = useState<{ companyName: string; email: string } | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');

  useEffect(() => {
    if (!inviteToken) return;
    setInviteLoading(true);
    setInviteError('');
    authService.getInviteInfo(inviteToken)
      .then((info) => {
        setInviteInfo({ companyName: info.companyName, email: info.email });
        setEmail(info.email);
      })
      .catch(() => {
        setInviteError('El enlace de invitación no es válido o ha expirado.');
      })
      .finally(() => {
        setInviteLoading(false);
      });
  }, [inviteToken]);

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
        inviteToken ? 'PSYCHOLOGIST' : 'USER',
        undefined,
        psychologistReferralCode || undefined,
        birthDate.trim() || undefined,
        inviteToken || undefined
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
    <div className="min-h-screen bg-gradient-to-br from-gantly-navy-700 via-gantly-blue-600 to-gantly-cyan-500 flex justify-center items-center px-6 py-20 relative">
      <div className="w-full max-w-[1000px] grid grid-cols-1 md:grid-cols-[minmax(300px,1fr)_minmax(320px,1fr)] gap-12 relative z-[1]">
        {/* Panel izquierdo - Información */}
        <div className="bg-white/90 border border-gantly-blue-100 rounded-2xl p-12 flex flex-col gap-6 shadow-card">
          <div className="font-heading text-[32px] font-bold text-gantly-blue-500 tracking-tight mb-2">
            Gantly
          </div>
          <h1 className="m-0 text-4xl leading-tight text-gantly-text font-heading font-bold">
            Comienza tu camino
          </h1>
          {psychologistReferralCode && (
            <div className="py-3 px-4 bg-gantly-blue-50 rounded-xl text-[15px] text-gantly-muted mb-3">
              Serás asignado directamente a tu psicólogo tras registrarte.
            </div>
          )}
          <p className="m-0 text-[17px] leading-relaxed text-gantly-muted mb-2">
            Crea tu cuenta para acceder a evaluaciones personalizadas, seguimiento emocional y acompañamiento profesional adaptado a tus necesidades.
          </p>
          <div className="mt-6 flex flex-col gap-4 text-base text-gantly-muted">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-gantly-blue-100 flex items-center justify-center flex-shrink-0 text-gantly-blue-600 text-sm">✓</div>
              <span>Evaluaciones basadas en ciencia</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-gantly-blue-100 flex items-center justify-center flex-shrink-0 text-gantly-blue-600 text-sm">✓</div>
              <span>Sesiones con profesionales especializados</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-gantly-blue-100 flex items-center justify-center flex-shrink-0 text-gantly-blue-600 text-sm">✓</div>
              <span>Planes personalizados para ti</span>
            </div>
          </div>
          <div className="mt-auto text-[15px] text-gantly-muted pt-6 border-t border-gantly-blue-100">
            ¿Ya tienes cuenta?{' '}
            <button
              onClick={onSwitchToLogin}
              className="border-none bg-transparent text-gantly-blue-600 font-semibold cursor-pointer text-[15px] hover:underline"
            >
              Iniciar sesión
            </button>
          </div>
        </div>

        {/* Panel derecho - Formulario / Verificación */}
        <div className="bg-white shadow-card border border-gantly-blue-100 rounded-2xl p-12">
          {step === 'form' ? (
            <>
              <h2 className="m-0 mb-2 text-[28px] text-gantly-text font-heading font-bold">
                Crear cuenta
              </h2>
              <p className="m-0 mb-8 text-base text-gantly-muted">
                Completa tus datos para comenzar tu experiencia.
              </p>

              {inviteLoading && (
                <div className="flex items-center justify-center py-4 mb-4">
                  <div className="w-5 h-5 border-2 border-gantly-blue-200 border-t-gantly-blue-500 rounded-full animate-spin" />
                </div>
              )}

              {inviteError && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4">
                  <p className="text-sm text-red-600">{inviteError}</p>
                </div>
              )}

              {inviteInfo && (
                <div className="bg-gantly-blue-50 border border-gantly-blue-200 rounded-2xl p-4 mb-4 flex items-center gap-3">
                  <span className="material-symbols-outlined text-gantly-blue-500">business</span>
                  <div>
                    <p className="text-sm font-medium text-gantly-text">Invitación de {inviteInfo.companyName}</p>
                    <p className="text-xs text-gantly-muted">Crea tu cuenta para unirte a la clínica</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-6" aria-label="Formulario de registro">
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
                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 py-3.5 px-6 rounded-full border-none bg-gantly-blue-500 hover:bg-gantly-blue-600 text-white text-base font-semibold cursor-pointer shadow-md hover:shadow-lg transition-all disabled:bg-gray-300 disabled:cursor-not-allowed disabled:shadow-none"
                >
                  {loading ? 'Creando cuenta...' : 'Crear cuenta'}
                </button>
              </form>
            </>
          ) : (
            <>
              <h2 className="m-0 mb-2 text-[28px] text-gantly-text font-heading font-bold">
                Verifica tu email
              </h2>
              <p className="m-0 mb-2 text-base text-gantly-muted">
                Hemos enviado un codigo de 6 digitos a:
              </p>
              <p className="m-0 mb-8 text-base text-gantly-text font-semibold">
                {email}
              </p>

              <form onSubmit={handleVerifyCode} className="flex flex-col gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gantly-muted mb-2">
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
                    className="w-full p-4 rounded-xl border-2 border-gantly-blue-200 text-2xl font-bold text-center tracking-[8px] outline-none transition-colors focus:border-gantly-blue-500 focus:ring-2 focus:ring-gantly-blue-500/20"
                  />
                </div>

                <button
                  type="submit"
                  disabled={verifying || verificationCode.length !== 6}
                  className="py-3.5 px-6 rounded-full border-none bg-gantly-blue-500 hover:bg-gantly-blue-600 text-white text-base font-semibold cursor-pointer shadow-md transition-all disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {verifying ? 'Verificando...' : 'Verificar'}
                </button>

                <div className="text-center text-sm text-gray-500">
                  ¿No recibiste el codigo?{' '}
                  <button onClick={handleResendCode} type="button" className="border-none bg-transparent text-gantly-blue-600 font-semibold cursor-pointer text-sm hover:underline">
                    Reenviar
                  </button>
                </div>

                <button onClick={() => { setStep('form'); setVerificationCode(''); }} type="button" className="border-none bg-transparent text-gray-500 cursor-pointer text-sm text-center hover:underline">
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
