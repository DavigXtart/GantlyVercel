import { useState } from 'react';
import { twoFactorService } from '../services/api';
import { toast } from './ui/Toast';

interface Props {
  isEnabled: boolean;
  onStatusChange: () => void;
}

export default function TwoFactorSetup({ isEnabled, onStatusChange }: Props) {
  // Setup flow state
  const [setupData, setSetupData] = useState<{ secret: string; qrCodeUri: string } | null>(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [secretCopied, setSecretCopied] = useState(false);

  // Disable flow state
  const [showDisable, setShowDisable] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');

  const handleSetup = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await twoFactorService.setup();
      setSetupData(data);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error al configurar 2FA';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyCode.length !== 6) return;
    setLoading(true);
    setError(null);
    try {
      await twoFactorService.verify(verifyCode.trim());
      toast.success('Autenticacion en dos pasos activada correctamente');
      setSetupData(null);
      setVerifyCode('');
      onStatusChange();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Codigo incorrecto. Intentalo de nuevo.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disablePassword.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await twoFactorService.disable(disablePassword);
      toast.success('Autenticacion en dos pasos desactivada');
      setShowDisable(false);
      setDisablePassword('');
      onStatusChange();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Contrasena incorrecta';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const copySecret = async (secret: string) => {
    try {
      await navigator.clipboard.writeText(secret);
      setSecretCopied(true);
      toast.success('Clave copiada al portapapeles');
      setTimeout(() => setSecretCopied(false), 2000);
    } catch {
      toast.error('No se pudo copiar. Selecciona y copia manualmente.');
    }
  };

  // ================================================================
  // 2FA IS ENABLED
  // ================================================================
  if (isEnabled) {
    return (
      <div className="bg-white/95 border border-gantly-blue/15 rounded-2xl p-8 shadow-card font-body">
        <div className="text-xl font-bold text-gantly-navy mb-2">Autenticacion en dos pasos</div>
        <div className="inline-flex items-center gap-1.5 bg-gantly-emerald-100 text-gantly-emerald-800 text-[13px] font-semibold px-3.5 py-1.5 rounded-full mb-4">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
            <circle cx="7" cy="7" r="7" fill="#10b981" />
            <path d="M4 7l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          2FA activado
        </div>
        <p className="text-sm text-gantly-muted leading-relaxed mb-6">
          Tu cuenta esta protegida con autenticacion en dos pasos. Cada vez que inicies sesion,
          necesitaras un codigo de tu aplicacion de autenticacion.
        </p>

        {!showDisable ? (
          <button
            className="px-6 py-3 bg-red-600 text-white border-none rounded-xl text-[15px] font-semibold cursor-pointer transition-opacity disabled:opacity-60"
            disabled={loading}
            onClick={() => { setShowDisable(true); setError(null); }}
          >
            Desactivar 2FA
          </button>
        ) : (
          <form onSubmit={handleDisable}>
            <p className="text-sm text-gantly-muted mb-3">
              Introduce tu contrasena para confirmar la desactivacion:
            </p>
            <div className="flex gap-3 items-start flex-wrap">
              <input
                type="password"
                value={disablePassword}
                onChange={e => setDisablePassword(e.target.value)}
                placeholder="Tu contrasena"
                className="flex-1 min-w-[200px] px-4 py-3 border border-gantly-blue/20 rounded-xl text-sm outline-none font-body focus:border-gantly-blue focus:ring-1 focus:ring-gantly-blue/20"
                autoFocus
              />
              <button
                type="submit"
                disabled={loading || !disablePassword.trim()}
                className="px-6 py-3 bg-red-600 text-white border-none rounded-xl text-[15px] font-semibold cursor-pointer transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? 'Desactivando...' : 'Confirmar'}
              </button>
              <button
                type="button"
                className="px-5 py-2.5 bg-transparent text-gantly-blue border border-gantly-blue/30 rounded-xl text-sm font-medium cursor-pointer transition-opacity hover:bg-gantly-blue/5"
                onClick={() => { setShowDisable(false); setDisablePassword(''); setError(null); }}
              >
                Cancelar
              </button>
            </div>
            {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
          </form>
        )}
      </div>
    );
  }

  // ================================================================
  // 2FA IS NOT ENABLED
  // ================================================================
  return (
    <div className="bg-white/95 border border-gantly-blue/15 rounded-2xl p-8 shadow-card font-body">
      <div className="text-xl font-bold text-gantly-navy mb-2">Activar autenticacion en dos pasos</div>
      <p className="text-sm text-gantly-muted leading-relaxed mb-6">
        Anade una capa extra de seguridad a tu cuenta. Al activar la autenticacion en dos pasos (2FA),
        necesitaras un codigo temporal de tu aplicacion de autenticacion (como Google Authenticator,
        Authy o similar) cada vez que inicies sesion.
      </p>

      {/* Step 1: Show setup button */}
      {!setupData && (
        <button
          className="px-6 py-3 bg-gantly-blue text-white border-none rounded-xl text-[15px] font-semibold cursor-pointer transition-opacity disabled:opacity-60"
          disabled={loading}
          onClick={handleSetup}
        >
          {loading ? 'Configurando...' : 'Configurar 2FA'}
        </button>
      )}

      {/* Step 2: Show QR / secret + verification */}
      {setupData && (
        <div className="mt-2">
          {/* Instructions */}
          <div className="bg-gantly-blue/[0.04] border border-gantly-blue/10 rounded-xl p-5 mb-6">
            <p className="text-[15px] font-semibold text-gantly-navy mb-3">
              Paso 1: Configura tu aplicacion de autenticacion
            </p>
            <p className="text-sm text-gantly-muted leading-relaxed mb-4">
              Abre tu aplicacion de autenticacion (Google Authenticator, Authy, etc.) y anade una nueva
              cuenta usando la clave secreta que aparece a continuacion.
            </p>

            {/* Secret key display */}
            <div className="bg-white border border-gantly-blue/15 rounded-[10px] p-4 mb-3">
              <p className="text-xs text-gantly-muted mb-2 font-medium uppercase tracking-wider">
                Clave secreta (introducir manualmente)
              </p>
              <div className="flex items-center gap-3 flex-wrap">
                <code className="text-base font-semibold text-gantly-navy tracking-wider break-all font-mono flex-1 min-w-[150px] select-all">
                  {setupData.secret}
                </code>
                <button
                  type="button"
                  onClick={() => copySecret(setupData.secret)}
                  className="px-4 py-2 bg-transparent text-gantly-blue border border-gantly-blue/30 rounded-xl text-[13px] font-medium cursor-pointer flex items-center gap-1.5 shrink-0 hover:bg-gantly-blue/5 transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                  </svg>
                  {secretCopied ? 'Copiado' : 'Copiar'}
                </button>
              </div>
            </div>

            {/* otpauth URI for advanced users */}
            <details className="mt-2">
              <summary className="text-[13px] text-gantly-blue cursor-pointer font-medium">
                Mostrar URI para escaneo manual
              </summary>
              <div className="mt-2 bg-gray-100 rounded-lg p-3 break-all text-xs text-gray-600 font-mono leading-relaxed select-all">
                {setupData.qrCodeUri}
              </div>
            </details>
          </div>

          {/* Step 2: Verify */}
          <div className="bg-gantly-blue/[0.04] border border-gantly-blue/10 rounded-xl p-5">
            <p className="text-[15px] font-semibold text-gantly-navy mb-3">
              Paso 2: Verifica el codigo
            </p>
            <p className="text-sm text-gantly-muted leading-relaxed mb-4">
              Introduce el codigo de 6 digitos que aparece en tu aplicacion de autenticacion para
              completar la configuracion.
            </p>

            <form onSubmit={handleVerify} className="flex gap-3 items-start flex-wrap">
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={verifyCode}
                onChange={e => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full max-w-[220px] px-4 py-3 border border-gantly-blue/20 rounded-xl text-2xl text-center tracking-[0.3em] outline-none font-body focus:border-gantly-blue focus:ring-1 focus:ring-gantly-blue/20"
                autoFocus
              />
              <button
                type="submit"
                disabled={loading || verifyCode.length !== 6}
                className="px-6 py-3 bg-gantly-blue text-white border-none rounded-xl text-[15px] font-semibold cursor-pointer transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? 'Verificando...' : 'Verificar y activar'}
              </button>
            </form>

            {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
          </div>

          {/* Cancel setup */}
          <button
            type="button"
            className="mt-4 px-5 py-2.5 bg-transparent text-gantly-blue border border-gantly-blue/30 rounded-xl text-sm font-medium cursor-pointer hover:bg-gantly-blue/5 transition-colors"
            onClick={() => { setSetupData(null); setVerifyCode(''); setError(null); }}
          >
            Cancelar configuracion
          </button>
        </div>
      )}

      {/* Error when setup hasn't started yet */}
      {!setupData && error && <p className="text-red-600 text-sm mt-3">{error}</p>}
    </div>
  );
}
