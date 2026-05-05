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
    <div className="min-h-screen bg-gradient-to-br from-gantly-navy-700 via-gantly-blue-600 to-gantly-cyan-500 px-6 pt-[100px] pb-20">
      <div className="max-w-[420px] mx-auto">
        <div className="bg-white rounded-2xl p-10 shadow-card border border-gantly-blue-100">
          <h1 className="text-2xl font-bold text-gantly-text mb-2 font-heading">
            Registrar empresa
          </h1>
          <p className="text-gantly-muted text-sm mb-6">
            Crea tu cuenta como empresa. Recibirás un código de referencia para que tus psicólogos se registren.
          </p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="block text-sm font-semibold text-gantly-text mb-2">Nombre de la empresa *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Clínica Psicológica XYZ"
                required
                className="w-full py-3.5 px-4 rounded-xl border border-gantly-blue-200 text-base outline-none transition-colors focus:border-gantly-blue-500 focus:ring-2 focus:ring-gantly-blue-500/20"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gantly-text mb-2">Email *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="empresa@ejemplo.com"
                required
                className="w-full py-3.5 px-4 rounded-xl border border-gantly-blue-200 text-base outline-none transition-colors focus:border-gantly-blue-500 focus:ring-2 focus:ring-gantly-blue-500/20"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gantly-text mb-2">Contraseña *</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
                minLength={6}
                className="w-full py-3.5 px-4 rounded-xl border border-gantly-blue-200 text-base outline-none transition-colors focus:border-gantly-blue-500 focus:ring-2 focus:ring-gantly-blue-500/20"
              />
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-full border-none bg-gantly-blue-500 hover:bg-gantly-blue-600 text-white text-base font-semibold cursor-pointer shadow-md hover:shadow-lg transition-all disabled:bg-gray-300 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {loading ? 'Registrando...' : 'Registrarme'}
            </button>
          </form>
          <div className="mt-6 flex gap-4 justify-center flex-wrap">
            <button
              type="button"
              onClick={onBack}
              className="py-2.5 px-5 rounded-full border border-gantly-blue-200 bg-transparent text-gantly-blue-600 text-sm font-semibold cursor-pointer transition-all hover:bg-gantly-blue-50"
            >
              Volver
            </button>
            <button
              type="button"
              onClick={onLogin}
              className="py-2.5 px-5 rounded-full border border-gantly-blue-200 bg-transparent text-gantly-blue-600 text-sm font-semibold cursor-pointer transition-all hover:bg-gantly-blue-50"
            >
              Ya tengo cuenta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
