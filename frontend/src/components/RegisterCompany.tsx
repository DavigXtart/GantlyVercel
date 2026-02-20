import { useState } from 'react';
import { companyAuthService } from '../services/api';

interface RegisterCompanyProps {
  onBack: () => void;
  onLogin: () => void;
  onSuccess: () => void;
}

export default function RegisterCompany({ onBack, onLogin, onSuccess }: RegisterCompanyProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim() || !email.trim() || !password) {
      setError('Completa todos los campos');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    setLoading(true);
    try {
      await companyAuthService.register(name.trim(), email.trim(), password);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al registrarse. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7f6 0%, #e8ece9 50%, #d4e0d8 100%)',
      padding: '100px 24px 80px',
      fontFamily: "'Inter', sans-serif",
    }}>
      <div style={{ maxWidth: '420px', margin: '0 auto' }}>
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '40px',
          boxShadow: '0 8px 32px rgba(90, 146, 112, 0.15)',
          border: '1px solid rgba(90, 146, 112, 0.2)',
        }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1a2e22', marginBottom: '8px' }}>
            Registrar empresa
          </h1>
          <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '24px' }}>
            Crea tu cuenta como empresa. Recibirás un código de referencia para que tus psicólogos se registren.
          </p>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Nombre de la empresa *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Clínica Psicológica XYZ"
                required
              />
            </div>
            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="empresa@ejemplo.com"
                required
              />
            </div>
            <div className="form-group">
              <label>Contraseña *</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
                minLength={6}
              />
            </div>
            {error && <p style={{ color: '#dc2626', fontSize: '14px', marginBottom: '16px' }}>{error}</p>}
            <button type="submit" className="btn" disabled={loading} style={{ width: '100%' }}>
              {loading ? 'Registrando...' : 'Registrarme'}
            </button>
          </form>
          <div style={{ marginTop: '24px', display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button type="button" className="btn-secondary" onClick={onBack} style={{ padding: '10px 20px' }}>
              Volver
            </button>
            <button type="button" className="btn-secondary" onClick={onLogin} style={{ padding: '10px 20px' }}>
              Ya tengo cuenta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
