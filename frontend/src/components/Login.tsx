import { useState, useEffect } from 'react';
import { authService, companyAuthService, twoFactorService } from '../services/api';
import FormField from './ui/FormField';
import { toast } from './ui/Toast';

interface LoginProps {
  onLogin: () => void;
  onSwitchToRegister: () => void;
  onForgotPassword?: () => void;
  oauthError?: string | null;
  onClearOauthError?: () => void;
  /** Variante visual/funcional del login */
  variant?: 'user' | 'company';
  /** Desde login usuario → navegar a login empresa */
  onSwitchToCompanyLogin?: () => void;
  /** Desde login empresa → volver a login usuario */
  onSwitchToUserLogin?: () => void;
}

export default function Login({
  onLogin,
  onSwitchToRegister,
  onForgotPassword,
  oauthError,
  onClearOauthError,
  variant = 'user',
  onSwitchToCompanyLogin,
  onSwitchToUserLogin,
}: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // En modo empresa forzado, siempre usamos login de empresa; en modo usuario se puede cambiar internamente
  const isCompanyMode = variant === 'company';
  const [internalIsCompanyLogin, setInternalIsCompanyLogin] = useState(false);
  const isCompanyLogin = isCompanyMode ? true : internalIsCompanyLogin;
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState('');
  const [needsVerification, setNeedsVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (oauthError) {
      toast.error(oauthError);
      onClearOauthError?.();
    }
  }, [oauthError, onClearOauthError]);

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
    setFormError(null);
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);

    if (emailError || passwordError) {
      setErrors({ email: emailError, password: passwordError });
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      if (isCompanyLogin) {
        await companyAuthService.login(email, password);
      } else {
        const result = await authService.login(email, password);
        if (result && typeof result === 'object' && result.requires2FA) {
          setRequires2FA(true);
          setTempToken(result.tempToken);
          setLoading(false);
          return;
        }
      }
      setFormError(null);
      toast.success('Sesión iniciada correctamente');
      onLogin();
    } catch (err: any) {
      const status = err.response?.status;
      const backendMessage: string | undefined = err.response?.data?.message;
      let friendlyMessage = backendMessage || 'Error al iniciar sesión';

      // Email not verified — show verification code screen
      if (backendMessage?.includes('EMAIL_NOT_VERIFIED')) {
        setNeedsVerification(true);
        authService.resendVerificationByEmail(email).catch(() => {});
        toast.warning('Debes verificar tu email antes de iniciar sesión. Te hemos reenviado el código.');
        setLoading(false);
        return;
      }

      // Mensaje claro para credenciales incorrectas
      if (status === 401 || status === 403) {
        friendlyMessage = 'Email o contraseña incorrectos';
        if (!isCompanyMode) {
          friendlyMessage += '. Si eres una empresa, utiliza el acceso de empresas.';
        }
      }

      toast.error(friendlyMessage);
      setFormError(friendlyMessage);
      setErrors({
        email: friendlyMessage.toLowerCase().includes('email') ? friendlyMessage : undefined,
        password: !friendlyMessage.toLowerCase().includes('email') ? friendlyMessage : undefined,
      });
    } finally {
      setLoading(false);
    }
  };

  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempToken || !totpCode.trim()) return;
    setLoading(true);
    setFormError(null);
    try {
      await twoFactorService.login(tempToken, totpCode.trim());
      toast.success('Sesión iniciada correctamente');
      onLogin();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Código incorrecto';
      toast.error(msg);
      setFormError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (verificationCode.length !== 6) return;
    setVerifying(true);
    setFormError(null);
    try {
      const res = await authService.verifyCode(email, verificationCode);
      if (res.status === 'success') {
        toast.success('Email verificado. Iniciando sesión...');
        setNeedsVerification(false);
        // Re-attempt login automatically
        try {
          const result = await authService.login(email, password);
          if (result && typeof result === 'object' && result.requires2FA) {
            setRequires2FA(true);
            setTempToken(result.tempToken);
          } else {
            toast.success('Sesión iniciada correctamente');
            onLogin();
          }
        } catch {
          toast.success('Email verificado. Por favor inicia sesión.');
        }
      } else {
        toast.error(res.message || 'Código inválido o expirado');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al verificar el código');
    } finally {
      setVerifying(false);
    }
  };

  if (needsVerification) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gantly-navy-700 via-gantly-blue-600 to-gantly-cyan-500 flex justify-center items-center px-6 py-20">
        <div className="w-full max-w-[420px] bg-white shadow-card rounded-2xl p-12">
          <h2 className="font-heading text-[28px] font-bold text-gantly-blue-600 mb-2 text-center">Verifica tu email</h2>
          <p className="text-gantly-muted text-[15px] text-center mb-2">Hemos enviado un código de 6 dígitos a:</p>
          <p className="text-gantly-text font-semibold text-base text-center mb-6">{email}</p>
          <form onSubmit={handleVerifyCode}>
            <div className="mb-5">
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={verificationCode}
                onChange={e => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                autoFocus
                className="w-full p-4 text-2xl text-center tracking-[8px] border-2 border-gantly-blue-200 rounded-xl outline-none font-bold focus:border-gantly-blue-500 focus:ring-2 focus:ring-gantly-blue-500/20 transition-colors"
              />
            </div>
            {formError && <p className="text-red-600 text-sm mb-4 text-center">{formError}</p>}
            <button
              type="submit"
              disabled={verifying || verificationCode.length !== 6}
              className="w-full py-3.5 bg-gantly-blue-500 hover:bg-gantly-blue-600 text-white rounded-full text-base font-semibold transition-all disabled:bg-gray-300 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {verifying ? 'Verificando...' : 'Verificar'}
            </button>
          </form>
          <div className="text-center mt-4 text-sm text-gray-500">
            ¿No recibiste el código?{' '}
            <button onClick={() => { authService.resendVerificationByEmail(email).then(() => toast.success('Código reenviado')).catch(() => toast.error('Error al reenviar')); }} type="button" className="bg-transparent border-none text-gantly-blue-600 font-semibold cursor-pointer text-sm hover:underline">
              Reenviar
            </button>
          </div>
          <button onClick={() => { setNeedsVerification(false); setVerificationCode(''); setFormError(null); }} className="w-full mt-3 py-3 bg-transparent border border-gantly-blue-200 rounded-xl text-gantly-blue-600 text-sm cursor-pointer hover:bg-gantly-blue-50 transition-colors">
            Volver al login
          </button>
        </div>
      </div>
    );
  }

  if (requires2FA) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gantly-navy-700 via-gantly-blue-600 to-gantly-cyan-500 flex justify-center items-center px-6 py-20">
        <div className="w-full max-w-[420px] bg-white shadow-card rounded-2xl p-12">
          <h2 className="font-heading text-[28px] font-bold text-gantly-blue-600 mb-2 text-center">Verificación 2FA</h2>
          <p className="text-gantly-muted text-[15px] text-center mb-6">Introduce el código de tu aplicación de autenticación.</p>
          <form onSubmit={handle2FASubmit}>
            <div className="mb-5">
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={totpCode}
                onChange={e => setTotpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full py-3.5 px-4 text-2xl text-center tracking-[0.3em] border border-gantly-blue-200 rounded-xl outline-none focus:border-gantly-blue-500 focus:ring-2 focus:ring-gantly-blue-500/20 transition-colors"
              />
            </div>
            {formError && <p className="text-red-600 text-sm mb-4 text-center">{formError}</p>}
            <button
              type="submit"
              disabled={loading || totpCode.length !== 6}
              className="w-full py-3.5 bg-gantly-blue-500 hover:bg-gantly-blue-600 text-white rounded-full text-base font-semibold transition-all disabled:bg-gray-300 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Verificando...' : 'Verificar'}
            </button>
          </form>
          <button onClick={() => { setRequires2FA(false); setTempToken(null); setTotpCode(''); setFormError(null); }} className="w-full mt-3 py-3 bg-transparent border border-gantly-blue-200 rounded-xl text-gantly-blue-600 text-sm cursor-pointer hover:bg-gantly-blue-50 transition-colors">
            Volver al login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gantly-navy-700 via-gantly-blue-600 to-gantly-cyan-500 flex justify-center items-center px-6 py-20 relative">
      <div className="w-full max-w-[1000px] grid grid-cols-1 md:grid-cols-[minmax(300px,1fr)_minmax(320px,1fr)] gap-12 relative z-[1]">
        {/* Panel izquierdo - Información */}
        <div className="bg-white/90 border border-gantly-blue-100 rounded-2xl p-12 flex flex-col gap-6 shadow-card">
          <div className="font-heading text-[32px] font-bold text-gantly-blue-500 tracking-tight mb-2">
            Gantly
          </div>
          <h1 className="m-0 text-4xl leading-tight text-gantly-text font-heading font-bold">
            {isCompanyMode ? 'Acceso empresas' : 'Bienvenido de nuevo'}
          </h1>
          <p className="m-0 text-[17px] leading-relaxed text-gantly-muted mb-2">
            {isCompanyMode
              ? 'Gestiona a tus psicólogos y el bienestar emocional de tu equipo desde un panel unificado y seguro.'
              : 'Inicia sesión para acceder a tus citas, tareas y chat con tu psicólogo.'}
          </p>
          <div className="mt-6 flex flex-col gap-4 text-base text-gantly-muted">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-gantly-blue-100 flex items-center justify-center flex-shrink-0 text-gantly-blue-600 text-sm">✓</div>
              <span>Citas y videollamadas</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-gantly-blue-100 flex items-center justify-center flex-shrink-0 text-gantly-blue-600 text-sm">✓</div>
              <span>Tests y seguimiento</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-gantly-blue-100 flex items-center justify-center flex-shrink-0 text-gantly-blue-600 text-sm">✓</div>
              <span>Chat directo con tu profesional</span>
            </div>
          </div>
          <div className="mt-auto text-[15px] text-gantly-muted pt-6 border-t border-gantly-blue-100">
            ¿No tienes cuenta?{' '}
            <button
              onClick={onSwitchToRegister}
              className="border-none bg-transparent text-gantly-blue-600 font-semibold cursor-pointer text-[15px] hover:underline"
            >
              Crear cuenta
            </button>
          </div>
        </div>

        {/* Panel derecho - Formulario */}
        <div className="bg-white shadow-card border border-gantly-blue-100 rounded-2xl p-12">
          <h2 className="m-0 mb-2 text-[28px] text-gantly-text font-heading font-bold">
            {isCompanyMode ? 'Iniciar sesión como empresa' : 'Iniciar sesión'}
          </h2>
          <p className="m-0 mb-8 text-base text-gantly-muted">
            {isCompanyMode
              ? 'Introduce las credenciales de tu cuenta de empresa para acceder al panel de Gantly.'
              : 'Ingresa tus datos para acceder a tu espacio personal.'}
          </p>

          {formError && (
            <div className="mb-6 px-4 py-3 rounded-xl bg-red-50 border border-red-400 text-red-800 text-sm">
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {!isCompanyMode && (
              <a
                href={authService.getOAuth2LoginUrl('google')}
                className="flex items-center justify-center gap-3 py-3.5 px-6 rounded-full border border-gantly-blue-200 bg-white text-gantly-text text-base font-semibold no-underline transition-all hover:bg-gantly-blue-50 hover:border-gantly-blue-400"
              >
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continuar con Google
              </a>
            )}
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-gantly-blue-100" />
              <span className="text-[13px] text-gantly-muted">o</span>
              <div className="flex-1 h-px bg-gantly-blue-100" />
            </div>
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

            <div className="flex justify-between items-center mt-1">
              {!isCompanyMode ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      onSwitchToCompanyLogin?.();
                    }}
                    className="bg-transparent border-none text-gantly-blue-600 text-sm font-medium cursor-pointer p-0 hover:underline"
                  >
                    Soy empresa
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    onSwitchToUserLogin?.();
                  }}
                  className="bg-transparent border-none text-gantly-blue-600 text-sm font-medium cursor-pointer p-0 hover:underline"
                >
                  Acceder como usuario
                </button>
              )}
            </div>
            <div className="-mt-2 mb-2">
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
                className="bg-transparent border-none text-gantly-blue-600 text-sm font-medium cursor-pointer p-0 hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              aria-label="Iniciar sesión"
              aria-busy={loading}
              className="mt-2 py-3.5 px-6 rounded-full border-none bg-gantly-blue-500 hover:bg-gantly-blue-600 text-white text-base font-semibold cursor-pointer shadow-md hover:shadow-lg transition-all disabled:bg-gray-300 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
