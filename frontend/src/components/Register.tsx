import { useState, useEffect } from 'react';
import { authService } from '../services/api';
import FormField from './ui/FormField';
import { toast } from './ui/Toast';
import { Building2 } from 'lucide-react';
import { trackEvent } from '../utils/analytics';
import SEO from './seo/SEO';

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
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [healthConsent, setHealthConsent] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; birthDate?: string; terms?: string; healthConsent?: string }>({});
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
    if (password.length < 10) return 'La contraseña debe tener al menos 10 caracteres';
    if (!/[A-Z]/.test(password)) return 'Debe contener al menos una letra mayuscula';
    if (!/[!@#$%^&*()_+\-=\[\]{}|;:'",.<>?/\\]/.test(password)) return 'Debe contener al menos un simbolo especial';
    return undefined;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nameError = validateName(name);
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);

    const termsError = !acceptTerms ? 'Debes aceptar los terminos y la politica de privacidad' : undefined;
    const healthConsentError = !healthConsent ? 'Debes consentir el tratamiento de datos de salud' : undefined;

    if (nameError || emailError || passwordError || termsError || healthConsentError) {
      setErrors({ name: nameError, email: emailError, password: passwordError, terms: termsError, healthConsent: healthConsentError });
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
        inviteToken || undefined,
        acceptTerms,
        healthConsent
      );
      trackEvent('register', { role: inviteToken ? 'PSYCHOLOGIST' : 'USER' });
      toast.success('Te hemos enviado un código de verificación a tu email');
      setStep('verify');
    } catch (err: any) {
      const raw = err.response?.data?.message || err.response?.data?.error || '';
      const status = err.response?.status;
      let errorMsg: string;
      let fieldErrors: typeof errors = {};

      if (status === 400 && /email.*registrad|already/i.test(raw)) {
        errorMsg = 'Este email ya está registrado. ¿Quieres iniciar sesión?';
        fieldErrors = { email: errorMsg };
      } else if (status === 400 && /password|contraseña/i.test(raw)) {
        errorMsg = raw;
        fieldErrors = { password: errorMsg };
      } else {
        errorMsg = raw || 'Error al registrarse. Inténtalo de nuevo.';
      }

      toast.error(errorMsg);
      setErrors(fieldErrors);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (verificationCode.length !== 6) {
      toast.warning('Introduce el código de 6 dígitos');
      return;
    }
    setVerifying(true);
    try {
      const res = await authService.verifyCode(email, verificationCode);
      if (res.status === 'success') {
        toast.success('Email verificado. Bienvenido!');
        onRegister();
      } else {
        toast.error(res.message || 'Código inválido o expirado');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al verificar el código');
    } finally {
      setVerifying(false);
    }
  };

  const handleResendCode = async () => {
    try {
      await authService.resendVerificationEmail();
      toast.success('Código reenviado a tu email');
    } catch {
      toast.error('Error al reenviar el código');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gantly-navy-700 via-gantly-blue-600 to-gantly-cyan-500 flex justify-center items-center px-6 py-20 relative">
      <SEO
        title="Crear cuenta gratis"
        description="Regístrate en Gantly y encuentra tu psicólogo ideal con matching inteligente. Test de personalidad gratuito."
        path="/register"
        noindex
      />
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
                  <Building2 className="text-gantly-blue-500" size={20} />
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
                  error={errors.password} required placeholder="Minimo 10 caracteres, mayuscula y simbolo" ariaLabel="Contraseña" />
                <FormField label="Fecha de nacimiento" name="birthDate" type="date" value={birthDate}
                  onChange={(e) => { setBirthDate(e.target.value); if (errors.birthDate) setErrors({ ...errors, birthDate: undefined }); }}
                  error={errors.birthDate} placeholder="" ariaLabel="Fecha de nacimiento" />
                <div>
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={acceptTerms}
                      onChange={(e) => { setAcceptTerms(e.target.checked); if (errors.terms) setErrors({ ...errors, terms: undefined }); }}
                      className="mt-1 w-4 h-4 accent-gantly-blue cursor-pointer flex-shrink-0"
                    />
                    <span className="text-sm text-slate-500 leading-relaxed">
                      Acepto los{' '}
                      <a href="/terms" target="_blank" className="text-gantly-blue font-medium hover:underline">terminos y condiciones</a>
                      {' '}y la{' '}
                      <a href="/privacidad" target="_blank" className="text-gantly-blue font-medium hover:underline">politica de privacidad</a>
                      {' '}de Gantly *
                    </span>
                  </label>
                  {errors.terms && <p className="text-red-500 text-xs mt-1.5 ml-6">{errors.terms}</p>}
                </div>
                <div>
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={healthConsent}
                      onChange={(e) => { setHealthConsent(e.target.checked); if (errors.healthConsent) setErrors({ ...errors, healthConsent: undefined }); }}
                      className="mt-1 w-4 h-4 accent-gantly-blue cursor-pointer flex-shrink-0"
                    />
                    <span className="text-sm text-slate-500 leading-relaxed">
                      Consiento el tratamiento de mis <strong>datos de salud mental</strong> (resultados de tests, diario emocional, historial de sesiones) para la prestacion del servicio terapeutico conforme al Art. 9.2.a del RGPD *
                    </span>
                  </label>
                  {errors.healthConsent && <p className="text-red-500 text-xs mt-1.5 ml-6">{errors.healthConsent}</p>}
                </div>
                <button
                  type="submit"
                  disabled={loading || !acceptTerms || !healthConsent}
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
                Hemos enviado un código de 6 dígitos a:
              </p>
              <p className="m-0 mb-8 text-base text-gantly-text font-semibold">
                {email}
              </p>

              <form onSubmit={handleVerifyCode} className="flex flex-col gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gantly-muted mb-2">
                    Código de verificación
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
                  ¿No recibiste el código?{' '}
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
