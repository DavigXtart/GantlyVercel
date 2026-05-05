import { useState } from 'react';
import { companyAuthService } from '../services/api';
import LogoSvg from '../assets/logo-gantly.svg';

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
        <div className="rounded-2xl shadow-xl shadow-slate-900/10 overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-gantly-blue to-gantly-cyan rounded-t-2xl" />
          <div className="bg-white rounded-b-2xl p-10">
            <img src={LogoSvg} alt="Gantly" className="h-8 mb-6" />
            <h1 className="font-heading font-bold text-gantly-text text-2xl mb-2">
              Registrar empresa
            </h1>
            <p className="text-slate-500 font-body text-sm mb-6">
              Crea tu cuenta como empresa. Recibirás un código de referencia para que tus psicólogos se registren.
            </p>
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div>
                <label className="block font-heading font-semibold text-gantly-text text-sm mb-2">Nombre de la empresa *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Clínica Psicológica XYZ"
                  required
                  className="w-full h-14 px-4 rounded-xl border-2 border-slate-200 text-base outline-none focus:border-gantly-blue focus:ring-2 focus:ring-gantly-blue/10 transition-all duration-200"
                />
              </div>
              <div>
                <label className="block font-heading font-semibold text-gantly-text text-sm mb-2">Email *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="empresa@ejemplo.com"
                  required
                  className="w-full h-14 px-4 rounded-xl border-2 border-slate-200 text-base outline-none focus:border-gantly-blue focus:ring-2 focus:ring-gantly-blue/10 transition-all duration-200"
                />
              </div>
              <div>
                <label className="block font-heading font-semibold text-gantly-text text-sm mb-2">Contraseña *</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                  minLength={6}
                  className="w-full h-14 px-4 rounded-xl border-2 border-slate-200 text-base outline-none focus:border-gantly-blue focus:ring-2 focus:ring-gantly-blue/10 transition-all duration-200"
                />
              </div>
              {error && <p className="text-red-500 text-sm font-body">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-14 rounded-xl border-none bg-gradient-to-r from-gantly-blue to-gantly-cyan text-white text-base font-heading font-bold cursor-pointer shadow-lg hover:shadow-xl hover:shadow-gantly-blue/25 transition-all duration-300 disabled:bg-gray-300 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {loading ? 'Registrando...' : 'Registrarme'}
              </button>
            </form>
            <div className="mt-6 flex gap-4 justify-center flex-wrap">
              <button
                type="button"
                onClick={onBack}
                className="py-2.5 px-5 rounded-xl border-2 border-slate-200 bg-transparent text-gantly-blue font-heading font-semibold text-sm cursor-pointer hover:border-gantly-blue hover:bg-gantly-blue/5 transition-all duration-200"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={onLogin}
                className="py-2.5 px-5 rounded-xl border-2 border-slate-200 bg-transparent text-gantly-blue font-heading font-semibold text-sm cursor-pointer hover:border-gantly-blue hover:bg-gantly-blue/5 transition-all duration-200"
              >
                Ya tengo cuenta
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
