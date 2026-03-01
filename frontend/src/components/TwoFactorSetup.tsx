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

  // ---- Styles ----
  const containerStyle: React.CSSProperties = {
    fontFamily: "'Inter', sans-serif",
    background: 'rgba(255,255,255,0.95)',
    border: '1px solid rgba(90,146,112,0.2)',
    borderRadius: '16px',
    padding: '32px',
    boxShadow: '0 4px 16px rgba(90,146,112,0.08)',
  };

  const headingStyle: React.CSSProperties = {
    fontSize: '20px',
    fontWeight: 700,
    color: '#2d4a3a',
    marginBottom: '8px',
    fontFamily: "'Inter', sans-serif",
  };

  const descriptionStyle: React.CSSProperties = {
    fontSize: '14px',
    color: '#5a7a6a',
    lineHeight: '1.6',
    marginBottom: '24px',
  };

  const primaryButtonStyle: React.CSSProperties = {
    padding: '12px 24px',
    background: '#5a9270',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: "'Inter', sans-serif",
    transition: 'opacity 0.2s',
  };

  const secondaryButtonStyle: React.CSSProperties = {
    padding: '10px 20px',
    background: 'transparent',
    color: '#5a9270',
    border: '1px solid rgba(90,146,112,0.3)',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: "'Inter', sans-serif",
    transition: 'opacity 0.2s',
  };

  const dangerButtonStyle: React.CSSProperties = {
    padding: '12px 24px',
    background: '#dc2626',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: "'Inter', sans-serif",
    transition: 'opacity 0.2s',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px',
    border: '1px solid rgba(90,146,112,0.3)',
    borderRadius: '12px',
    fontSize: '14px',
    outline: 'none',
    fontFamily: "'Inter', sans-serif",
    boxSizing: 'border-box',
  };

  const codeInputStyle: React.CSSProperties = {
    ...inputStyle,
    fontSize: '24px',
    textAlign: 'center' as const,
    letterSpacing: '0.3em',
    maxWidth: '220px',
  };

  const errorStyle: React.CSSProperties = {
    color: '#dc2626',
    fontSize: '14px',
    marginTop: '12px',
  };

  const badgeStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    background: '#d1fae5',
    color: '#065f46',
    fontSize: '13px',
    fontWeight: 600,
    padding: '6px 14px',
    borderRadius: '20px',
    marginBottom: '16px',
  };

  // ================================================================
  // 2FA IS ENABLED
  // ================================================================
  if (isEnabled) {
    return (
      <div style={containerStyle}>
        <div style={headingStyle}>Autenticacion en dos pasos</div>
        <div style={badgeStyle}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
            <circle cx="7" cy="7" r="7" fill="#10b981" />
            <path d="M4 7l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          2FA activado
        </div>
        <p style={descriptionStyle}>
          Tu cuenta esta protegida con autenticacion en dos pasos. Cada vez que inicies sesion,
          necesitaras un codigo de tu aplicacion de autenticacion.
        </p>

        {!showDisable ? (
          <button
            style={{ ...dangerButtonStyle, opacity: loading ? 0.6 : 1 }}
            disabled={loading}
            onClick={() => { setShowDisable(true); setError(null); }}
          >
            Desactivar 2FA
          </button>
        ) : (
          <form onSubmit={handleDisable}>
            <p style={{ fontSize: '14px', color: '#5a7a6a', marginBottom: '12px' }}>
              Introduce tu contrasena para confirmar la desactivacion:
            </p>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <input
                type="password"
                value={disablePassword}
                onChange={e => setDisablePassword(e.target.value)}
                placeholder="Tu contrasena"
                style={{ ...inputStyle, flex: '1', minWidth: '200px' }}
                autoFocus
              />
              <button
                type="submit"
                disabled={loading || !disablePassword.trim()}
                style={{ ...dangerButtonStyle, opacity: loading || !disablePassword.trim() ? 0.6 : 1 }}
              >
                {loading ? 'Desactivando...' : 'Confirmar'}
              </button>
              <button
                type="button"
                style={secondaryButtonStyle}
                onClick={() => { setShowDisable(false); setDisablePassword(''); setError(null); }}
              >
                Cancelar
              </button>
            </div>
            {error && <p style={errorStyle}>{error}</p>}
          </form>
        )}
      </div>
    );
  }

  // ================================================================
  // 2FA IS NOT ENABLED
  // ================================================================
  return (
    <div style={containerStyle}>
      <div style={headingStyle}>Activar autenticacion en dos pasos</div>
      <p style={descriptionStyle}>
        Anade una capa extra de seguridad a tu cuenta. Al activar la autenticacion en dos pasos (2FA),
        necesitaras un codigo temporal de tu aplicacion de autenticacion (como Google Authenticator,
        Authy o similar) cada vez que inicies sesion.
      </p>

      {/* Step 1: Show setup button */}
      {!setupData && (
        <button
          style={{ ...primaryButtonStyle, opacity: loading ? 0.6 : 1 }}
          disabled={loading}
          onClick={handleSetup}
        >
          {loading ? 'Configurando...' : 'Configurar 2FA'}
        </button>
      )}

      {/* Step 2: Show QR / secret + verification */}
      {setupData && (
        <div style={{ marginTop: '8px' }}>
          {/* Instructions */}
          <div style={{
            background: 'rgba(90,146,112,0.06)',
            border: '1px solid rgba(90,146,112,0.15)',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '24px',
          }}>
            <p style={{ fontSize: '15px', fontWeight: 600, color: '#2d4a3a', marginBottom: '12px' }}>
              Paso 1: Configura tu aplicacion de autenticacion
            </p>
            <p style={{ fontSize: '14px', color: '#5a7a6a', lineHeight: '1.6', marginBottom: '16px' }}>
              Abre tu aplicacion de autenticacion (Google Authenticator, Authy, etc.) y anade una nueva
              cuenta usando la clave secreta que aparece a continuacion.
            </p>

            {/* Secret key display */}
            <div style={{
              background: 'white',
              border: '1px solid rgba(90,146,112,0.2)',
              borderRadius: '10px',
              padding: '16px',
              marginBottom: '12px',
            }}>
              <p style={{ fontSize: '12px', color: '#5a7a6a', marginBottom: '8px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Clave secreta (introducir manualmente)
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <code style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#2d4a3a',
                  letterSpacing: '0.1em',
                  wordBreak: 'break-all',
                  fontFamily: "'Courier New', Courier, monospace",
                  flex: '1',
                  minWidth: '150px',
                  userSelect: 'all',
                }}>
                  {setupData.secret}
                </code>
                <button
                  type="button"
                  onClick={() => copySecret(setupData.secret)}
                  style={{
                    ...secondaryButtonStyle,
                    padding: '8px 16px',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    flexShrink: 0,
                  }}
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
            <details style={{ marginTop: '8px' }}>
              <summary style={{ fontSize: '13px', color: '#5a9270', cursor: 'pointer', fontWeight: 500 }}>
                Mostrar URI para escaneo manual
              </summary>
              <div style={{
                marginTop: '8px',
                background: '#f5f5f5',
                borderRadius: '8px',
                padding: '12px',
                wordBreak: 'break-all',
                fontSize: '12px',
                color: '#555',
                fontFamily: "'Courier New', Courier, monospace",
                lineHeight: '1.5',
                userSelect: 'all',
              }}>
                {setupData.qrCodeUri}
              </div>
            </details>
          </div>

          {/* Step 2: Verify */}
          <div style={{
            background: 'rgba(90,146,112,0.06)',
            border: '1px solid rgba(90,146,112,0.15)',
            borderRadius: '12px',
            padding: '20px',
          }}>
            <p style={{ fontSize: '15px', fontWeight: 600, color: '#2d4a3a', marginBottom: '12px' }}>
              Paso 2: Verifica el codigo
            </p>
            <p style={{ fontSize: '14px', color: '#5a7a6a', lineHeight: '1.6', marginBottom: '16px' }}>
              Introduce el codigo de 6 digitos que aparece en tu aplicacion de autenticacion para
              completar la configuracion.
            </p>

            <form onSubmit={handleVerify} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={verifyCode}
                onChange={e => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                style={codeInputStyle}
                autoFocus
              />
              <button
                type="submit"
                disabled={loading || verifyCode.length !== 6}
                style={{ ...primaryButtonStyle, opacity: loading || verifyCode.length !== 6 ? 0.6 : 1 }}
              >
                {loading ? 'Verificando...' : 'Verificar y activar'}
              </button>
            </form>

            {error && <p style={errorStyle}>{error}</p>}
          </div>

          {/* Cancel setup */}
          <button
            type="button"
            style={{ ...secondaryButtonStyle, marginTop: '16px' }}
            onClick={() => { setSetupData(null); setVerifyCode(''); setError(null); }}
          >
            Cancelar configuracion
          </button>
        </div>
      )}

      {/* Error when setup hasn't started yet */}
      {!setupData && error && <p style={errorStyle}>{error}</p>}
    </div>
  );
}
