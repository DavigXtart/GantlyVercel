import { useState } from 'react';
import { authService } from '../services/api';

interface RegisterPsychologistProps {
  onBack: () => void;
  onLogin: () => void;
  onSuccess: () => void;
}

export default function RegisterPsychologist({ onBack, onLogin, onSuccess }: RegisterPsychologistProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    // Paso 1: Información personal
    name: '',
    email: '',
    phone: '',
    companyReferralCode: '',

    // Paso 2: Credenciales profesionales
    license: '',
    experience: '',
    specialization: '',

    // Paso 3: Credenciales de acceso
    password: '',
    confirmPassword: '',

    // Paso 4: Términos y condiciones
    acceptTerms: false,
    acceptPrivacy: false,
  });

  const totalSteps = 4;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setError('');
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim()) {
          setError('Por favor, completa todos los campos');
          return false;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          setError('Por favor, ingresa un email válido');
          return false;
        }
        return true;
      case 2:
        if (!formData.license.trim() || !formData.experience || !formData.specialization.trim()) {
          setError('Por favor, completa todos los campos');
          return false;
        }
        return true;
      case 3:
        if (!formData.password || !formData.confirmPassword) {
          setError('Por favor, completa todos los campos');
          return false;
        }
        if (formData.password.length < 8) {
          setError('La contraseña debe tener al menos 8 caracteres');
          return false;
        }
        if (formData.password !== formData.confirmPassword) {
          setError('Las contraseñas no coinciden');
          return false;
        }
        return true;
      case 4:
        if (!formData.acceptTerms || !formData.acceptPrivacy) {
          setError('Debes aceptar los términos y condiciones y la política de privacidad');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
      setError('');
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(4)) return;

    setLoading(true);
    setError('');

    try {
      const companyCode = formData.companyReferralCode.trim();
      // Registrar como psicólogo con role PSYCHOLOGIST (el código de empresa es opcional)
      await authService.register(
        formData.name,
        formData.email,
        formData.password,
        undefined,
        'PSYCHOLOGIST',
        companyCode ? companyCode.toUpperCase() : undefined,
        undefined
      );
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al registrarse. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { number: 1, title: 'Información personal', icon: '👤' },
    { number: 2, title: 'Credenciales profesionales', icon: '🎓' },
    { number: 3, title: 'Contraseña', icon: '🔒' },
    { number: 4, title: 'Confirmación', icon: '✅' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gantly-navy-700 via-gantly-blue-600 to-gantly-cyan-500 px-6 pt-[100px] pb-20">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-[1000] bg-white/95 backdrop-blur-md border-b border-gantly-blue-100 py-5 px-10 flex justify-between items-center">
        <div
          onClick={onBack}
          className="font-heading text-[28px] font-bold text-gantly-blue-500 cursor-pointer transition-opacity hover:opacity-70"
        >
          Gantly
        </div>
        <button
          onClick={onLogin}
          className="py-2.5 px-6 text-[15px] font-semibold bg-transparent text-gantly-blue-600 border-2 border-gantly-blue-500 rounded-full cursor-pointer transition-all hover:bg-gantly-blue-500 hover:text-white"
        >
          Iniciar sesión
        </button>
      </nav>

      <div className="max-w-[800px] mx-auto">
        {/* Progress Bar */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-6">
            {steps.map((step, idx) => (
              <div key={step.number} className="flex-1 flex flex-col items-center">
                <div
                  className={`w-[50px] h-[50px] rounded-full flex items-center justify-center text-xl font-semibold mb-2 transition-all relative z-[2] ${
                    currentStep >= step.number
                      ? 'bg-gantly-blue-500 text-white'
                      : 'bg-gantly-blue-100 text-gantly-muted'
                  }`}
                >
                  {currentStep > step.number ? '✓' : step.number}
                </div>
                <span
                  className={`text-xs text-center ${
                    currentStep >= step.number
                      ? 'text-gantly-blue-500 font-semibold'
                      : 'text-gray-400 font-normal'
                  }`}
                >
                  {step.title}
                </span>
                {idx < steps.length - 1 && (
                  <div
                    className={`absolute top-[25px] left-[calc(50%+25px)] right-[calc(-50%+25px)] h-0.5 z-[1] ${
                      currentStep > step.number ? 'bg-gantly-blue-500' : 'bg-gantly-blue-100'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="h-1 bg-gantly-blue-100 rounded-sm overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-gantly-blue-500 to-gantly-blue-600 transition-[width] duration-300 ease-in-out"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl p-12 shadow-card border border-gantly-blue-100">
          {error && (
            <div className="p-4 bg-red-50 border border-red-300 rounded-xl text-red-800 mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={currentStep === totalSteps ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }}>
            {/* Paso 1: Información personal */}
            {currentStep === 1 && (
              <div className="animate-[fadeIn_0.3s]">
                <h2 className="text-[32px] font-bold text-gantly-text mb-2 font-heading">
                  Información personal
                </h2>
                <p className="text-base text-gantly-muted mb-8">
                  Comienza con tus datos básicos
                </p>

                <div className="flex flex-col gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gantly-text mb-2">
                      Nombre completo *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Ej: María García López"
                      required
                      className="w-full py-3.5 px-[18px] rounded-xl border border-gantly-blue-200 text-base transition-all outline-none focus:border-gantly-blue-500 focus:ring-2 focus:ring-gantly-blue-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gantly-text mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="tu@email.com"
                      required
                      className="w-full py-3.5 px-[18px] rounded-xl border border-gantly-blue-200 text-base transition-all outline-none focus:border-gantly-blue-500 focus:ring-2 focus:ring-gantly-blue-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gantly-text mb-2">
                      Teléfono *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+34 600 000 000"
                      required
                      className="w-full py-3.5 px-[18px] rounded-xl border border-gantly-blue-200 text-base transition-all outline-none focus:border-gantly-blue-500 focus:ring-2 focus:ring-gantly-blue-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gantly-text mb-2">
                      Código de empresa (opcional)
                    </label>
                    <input
                      type="text"
                      name="companyReferralCode"
                      value={formData.companyReferralCode}
                      onChange={handleChange}
                      placeholder="Ej: EMP-XXXXXXXX (solicítalo a tu empresa)"
                      className="w-full py-3.5 px-[18px] rounded-xl border border-gantly-blue-200 text-base transition-all outline-none focus:border-gantly-blue-500 focus:ring-2 focus:ring-gantly-blue-500/20"
                    />
                    <p className="text-[13px] text-gray-500 mt-1.5">
                      Si trabajas con una empresa o clínica que usa Gantly, introduce aquí el código que te hayan dado. Si no, puedes dejarlo vacío.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Paso 2: Credenciales profesionales */}
            {currentStep === 2 && (
              <div className="animate-[fadeIn_0.3s]">
                <h2 className="text-[32px] font-bold text-gantly-text mb-2 font-heading">
                  Credenciales profesionales
                </h2>
                <p className="text-base text-gantly-muted mb-8">
                  Verificaremos tus credenciales para ejercer como psicólogo
                </p>

                <div className="flex flex-col gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gantly-text mb-2">
                      Número de colegiado *
                    </label>
                    <input
                      type="text"
                      name="license"
                      value={formData.license}
                      onChange={handleChange}
                      placeholder="Ej: M-12345"
                      required
                      className="w-full py-3.5 px-[18px] rounded-xl border border-gantly-blue-200 text-base transition-all outline-none focus:border-gantly-blue-500 focus:ring-2 focus:ring-gantly-blue-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gantly-text mb-2">
                      Años de experiencia *
                    </label>
                    <select
                      name="experience"
                      value={formData.experience}
                      onChange={handleChange}
                      required
                      className="w-full py-3.5 px-[18px] rounded-xl border border-gantly-blue-200 text-base bg-white cursor-pointer transition-all outline-none focus:border-gantly-blue-500 focus:ring-2 focus:ring-gantly-blue-500/20"
                    >
                      <option value="">Selecciona una opción</option>
                      <option value="0-2">0-2 años</option>
                      <option value="3-5">3-5 años</option>
                      <option value="6-10">6-10 años</option>
                      <option value="10+">Más de 10 años</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gantly-text mb-2">
                      Especialización *
                    </label>
                    <input
                      type="text"
                      name="specialization"
                      value={formData.specialization}
                      onChange={handleChange}
                      placeholder="Ej: Psicología clínica, Terapia cognitivo-conductual..."
                      required
                      className="w-full py-3.5 px-[18px] rounded-xl border border-gantly-blue-200 text-base transition-all outline-none focus:border-gantly-blue-500 focus:ring-2 focus:ring-gantly-blue-500/20"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Paso 3: Contraseña */}
            {currentStep === 3 && (
              <div className="animate-[fadeIn_0.3s]">
                <h2 className="text-[32px] font-bold text-gantly-text mb-2 font-heading">
                  Crea tu contraseña
                </h2>
                <p className="text-base text-gantly-muted mb-8">
                  Elige una contraseña segura para tu cuenta
                </p>

                <div className="flex flex-col gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gantly-text mb-2">
                      Contraseña *
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Mínimo 8 caracteres"
                      required
                      className="w-full py-3.5 px-[18px] rounded-xl border border-gantly-blue-200 text-base transition-all outline-none focus:border-gantly-blue-500 focus:ring-2 focus:ring-gantly-blue-500/20"
                    />
                    <p className="text-xs text-gray-500 mt-1.5">
                      Debe tener al menos 8 caracteres
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gantly-text mb-2">
                      Confirmar contraseña *
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Repite tu contraseña"
                      required
                      className="w-full py-3.5 px-[18px] rounded-xl border border-gantly-blue-200 text-base transition-all outline-none focus:border-gantly-blue-500 focus:ring-2 focus:ring-gantly-blue-500/20"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Paso 4: Confirmación */}
            {currentStep === 4 && (
              <div className="animate-[fadeIn_0.3s]">
                <h2 className="text-[32px] font-bold text-gantly-text mb-2 font-heading">
                  Último paso
                </h2>
                <p className="text-base text-gantly-muted mb-8">
                  Revisa y acepta los términos para completar tu registro
                </p>

                <div className="bg-gray-50 rounded-xl p-6 mb-6 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gantly-text mb-4">
                    Resumen de tu información
                  </h3>
                  <div className="flex flex-col gap-3 text-sm text-gantly-muted">
                    <div><strong>Nombre:</strong> {formData.name}</div>
                    <div><strong>Email:</strong> {formData.email}</div>
                    <div><strong>Teléfono:</strong> {formData.phone}</div>
                    <div><strong>Colegiado:</strong> {formData.license}</div>
                    <div><strong>Experiencia:</strong> {formData.experience} años</div>
                    <div><strong>Especialización:</strong> {formData.specialization}</div>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="acceptTerms"
                      checked={formData.acceptTerms}
                      onChange={handleChange}
                      className="mt-1 w-5 h-5 cursor-pointer accent-gantly-blue-500"
                    />
                    <span className="text-sm text-gantly-muted leading-relaxed">
                      Acepto los <a href="#" className="text-gantly-blue-600 underline">términos y condiciones</a> de Gantly *
                    </span>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="acceptPrivacy"
                      checked={formData.acceptPrivacy}
                      onChange={handleChange}
                      className="mt-1 w-5 h-5 cursor-pointer accent-gantly-blue-500"
                    />
                    <span className="text-sm text-gantly-muted leading-relaxed">
                      Acepto la <a href="#" className="text-gantly-blue-600 underline">política de privacidad</a> y el tratamiento de mis datos *
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-10 gap-4">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handlePrevious}
                  className="py-3.5 px-8 text-base font-semibold bg-white text-gantly-blue-600 border-2 border-gantly-blue-500 rounded-xl cursor-pointer transition-all hover:bg-gantly-blue-50"
                >
                  Anterior
                </button>
              )}
              <div className="flex-1" />
              <button
                type="submit"
                disabled={loading}
                className="py-3.5 px-8 text-base font-semibold bg-gantly-blue-500 hover:bg-gantly-blue-600 text-white border-none rounded-xl cursor-pointer transition-all shadow-md hover:shadow-lg disabled:bg-gray-300 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {loading ? 'Registrando...' : currentStep === totalSteps ? 'Completar registro' : 'Siguiente'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
