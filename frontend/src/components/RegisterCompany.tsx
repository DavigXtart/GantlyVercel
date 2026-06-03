import { useState } from 'react';
import { companyAuthService } from '../services/api';
import FormField from './ui/FormField';
import { Building2, Users, BarChart3, Mail, Shield, CheckCircle } from 'lucide-react';

interface RegisterCompanyProps {
  onBack: () => void;
  onLogin: () => void;
  onSuccess: () => void;
}

export default function RegisterCompany({ onBack, onLogin, onSuccess }: RegisterCompanyProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
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
    if (!acceptTerms) {
      setError('Debes aceptar los terminos y la politica de privacidad');
      return;
    }
    setLoading(true);
    try {
      await companyAuthService.register(name.trim(), email.trim(), password);
      onSuccess();
    } catch (err: any) {
      setError('No se pudo completar el registro. Verifica los datos e inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const benefits = [
    { icon: Building2, text: 'Dashboard centralizado para tu clínica' },
    { icon: Users, text: 'Gestión completa de psicólogos y pacientes' },
    { icon: BarChart3, text: 'Facturación y métricas en tiempo real' },
    { icon: Mail, text: 'Invitaciones por email a profesionales' },
    { icon: Shield, text: 'Datos protegidos con cifrado de extremo a extremo' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gantly-navy-700 via-gantly-blue-600 to-gantly-cyan-500 flex justify-center items-center px-6 py-20 relative">
      <div className="w-full max-w-[1000px] grid grid-cols-1 md:grid-cols-[minmax(300px,1fr)_minmax(320px,1fr)] gap-12 relative z-[1]">
        {/* Panel izquierdo - Información */}
        <div className="bg-white/90 border border-gantly-blue-100 rounded-2xl p-12 flex flex-col gap-6 shadow-card">
          <div className="font-heading text-[32px] font-bold text-gantly-blue-500 tracking-tight mb-2">
            Gantly
          </div>
          <h1 className="m-0 text-4xl leading-tight text-gantly-text font-heading font-bold">
            Gestiona tu clínica
          </h1>
          <p className="m-0 text-[17px] leading-relaxed text-gantly-muted mb-2">
            Centraliza la gestión de tu clínica psicológica con herramientas profesionales diseñadas para equipos de salud mental.
          </p>
          <div className="mt-4 flex flex-col gap-4 text-base text-gantly-muted">
            {benefits.map((benefit, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gantly-blue-50 flex items-center justify-center flex-shrink-0">
                  <benefit.icon className="w-4.5 h-4.5 text-gantly-blue-500" size={18} />
                </div>
                <span className="text-[15px]">{benefit.text}</span>
              </div>
            ))}
          </div>
          <div className="mt-auto text-[15px] text-gantly-muted pt-6 border-t border-gantly-blue-100 flex items-center gap-4 flex-wrap">
            <span>¿Ya tienes cuenta?</span>
            <button
              onClick={onLogin}
              className="border-none bg-transparent text-gantly-blue-600 font-semibold cursor-pointer text-[15px] hover:underline"
            >
              Iniciar sesión
            </button>
            <button
              onClick={onBack}
              className="border-none bg-transparent text-slate-400 cursor-pointer text-[15px] hover:text-slate-600 hover:underline transition-colors"
            >
              Volver
            </button>
          </div>
        </div>

        {/* Panel derecho - Formulario */}
        <div className="bg-white shadow-card border border-gantly-blue-100 rounded-2xl p-12">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gantly-blue-50 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-gantly-blue-500" />
            </div>
            <h2 className="m-0 text-[28px] text-gantly-text font-heading font-bold">
              Crear cuenta de clínica
            </h2>
          </div>
          <p className="m-0 mb-8 text-base text-gantly-muted">
            Registra tu clinica y recibe un codigo de referencia para tus profesionales.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6" aria-label="Formulario de registro de clínica">
            <FormField
              label="Nombre de la clínica"
              name="companyName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Ej: Clínica Psicológica XYZ"
              ariaLabel="Nombre de la clínica"
            />
            <FormField
              label="Email"
              name="companyEmail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="clinica@ejemplo.com"
              ariaLabel="Correo electrónico de la clínica"
            />
            <FormField
              label="Contraseña"
              name="companyPassword"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Mínimo 6 caracteres"
              ariaLabel="Contraseña"
            />

            <div>
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="mt-1 w-4 h-4 accent-gantly-blue cursor-pointer flex-shrink-0"
                />
                <span className="text-sm text-slate-500 leading-relaxed">
                  Acepto los{' '}
                  <a href="/terms" target="_blank" className="text-gantly-blue font-medium hover:underline">terminos y condiciones</a>
                  {' '}y la{' '}
                  <a href="/privacy" target="_blank" className="text-gantly-blue font-medium hover:underline">politica de privacidad</a>
                  {' '}*
                </span>
              </label>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <p className="text-red-600 text-sm font-body m-0">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !acceptTerms}
              className="mt-2 py-3.5 px-6 rounded-full border-none bg-gantly-blue-500 hover:bg-gantly-blue-600 text-white text-base font-semibold cursor-pointer shadow-md hover:shadow-lg transition-all disabled:bg-gray-300 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Registrando...
                </>
              ) : (
                <>
                  <CheckCircle size={18} />
                  Crear cuenta de clínica
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
