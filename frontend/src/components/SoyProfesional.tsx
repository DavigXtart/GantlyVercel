import gemini1 from '../assets/Gemini_Generated_Image_gvn6grgvn6grgvn6.png';
import gemini2 from '../assets/Gemini_Generated_Image_9ho60t9ho60t9ho6.png';
import gemini3 from '../assets/Gemini_Generated_Image_pg3gfvpg3gfvpg3g.png';
import gemini4 from '../assets/Gemini_Generated_Image_kng45nkng45nkng4.png';
import gemini5 from '../assets/Gemini_Generated_Image_xta9abxta9abxta9.png';
import gemini6 from '../assets/Gemini_Generated_Image_wqpn45wqpn45wqpn.png';
import imagenProfesional from '../assets/imagenProfesional.jpg';

interface SoyProfesionalProps {
  onBack: () => void;
  onLogin: () => void;
  onGetStarted: () => void;
  onRegisterCompany?: () => void;
}

export default function SoyProfesional({ onBack, onLogin, onGetStarted, onRegisterCompany }: SoyProfesionalProps) {
  return (
    <div className="overflow-x-hidden bg-gantly-cloud min-h-screen font-body">
      <style>{`
        .fade-in {
          opacity: 0;
          transform: translateY(30px);
          transition: opacity 0.8s ease-out, transform 0.8s ease-out;
        }
        .fade-in.visible {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>

      {/* Navigation bar */}
      <nav className="fixed top-0 left-0 right-0 z-[1000] bg-white/95 backdrop-blur-md border-b border-gantly-blue/10 px-6 md:px-10 py-5 flex justify-between items-center">
        <div
          onClick={onBack}
          className="font-heading text-[28px] font-bold text-gantly-blue tracking-tight cursor-pointer hover:opacity-70 transition-opacity"
        >
          Gantly
        </div>
        <div className="flex items-center gap-6">
          <button
            onClick={onBack}
            className="bg-transparent border-none text-gantly-muted text-[15px] font-medium cursor-pointer hover:text-gantly-blue transition-colors"
          >
            Volver
          </button>
          <button
            onClick={onLogin}
            className="px-6 py-2.5 text-[15px] font-semibold bg-gantly-blue text-white border-none rounded-full cursor-pointer shadow-glow-blue hover:bg-gantly-blue-600 hover:shadow-elevated transition-all"
          >
            Iniciar sesion
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="min-h-screen flex flex-col justify-center items-center px-6 pt-[120px] pb-20 max-w-[1200px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center w-full mb-20">
          {/* Left Side - Text */}
          <div>
            <div className="text-[13px] font-semibold text-gantly-blue uppercase tracking-[0.12em] mb-4">
              Para profesionales
            </div>
            <h1 className="text-[clamp(40px,6vw,64px)] font-heading font-light text-gantly-navy leading-[0.9] mb-6">
              Quieres ser psicologo online con Gantly?
            </h1>
            <p className="text-lg leading-relaxed text-gantly-muted mb-8">
              Enriquece tu practica sanitaria dedicandote a lo mas importante, nosotros nos encargamos del resto. Con Gantly podras ofrecer terapia online de forma facil, segura y confidencial.
            </p>
            <div className="flex flex-col gap-3 items-start">
              <button
                onClick={onGetStarted}
                className="px-8 py-4 text-base font-semibold bg-gantly-blue text-white border-none rounded-[28px] cursor-pointer shadow-glow-blue hover:bg-gantly-blue-600 hover:shadow-elevated hover:-translate-y-0.5 transition-all"
              >
                Registrarme como psicologo
              </button>
              {onRegisterCompany && (
                <button
                  onClick={onRegisterCompany}
                  className="px-6 py-3 text-[15px] font-semibold bg-transparent text-gantly-blue border-2 border-gantly-blue rounded-full cursor-pointer hover:bg-gantly-blue/10 transition-all"
                >
                  Soy empresa
                </button>
              )}
            </div>
          </div>

          {/* Right Side - Images Grid */}
          <div className="grid grid-cols-2 gap-6">
            {[gemini1, gemini2, gemini6, gemini5, gemini3, gemini4].map((imgSrc, idx) => (
              <div
                key={idx}
                className="aspect-square rounded-full bg-gradient-to-br from-gantly-cloud to-gantly-blue-100 border-2 border-gantly-blue/15 flex items-center justify-center overflow-hidden relative"
              >
                <img
                  src={imgSrc}
                  alt={`Imagen ${idx + 1}`}
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Statistics Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 w-full py-12 border-t border-b border-gantly-blue/10">
          <div className="text-center">
            <div className="text-5xl font-bold text-gantly-blue mb-2 font-heading">
              100%
            </div>
            <p className="text-[15px] text-gantly-muted leading-relaxed">
              psicologos estan titulados, colegiados y habilitados para ejercer
            </p>
          </div>
          <div className="text-center">
            <div className="text-5xl font-bold text-gantly-blue mb-2 font-heading">
              +300 mil
            </div>
            <p className="text-[15px] text-gantly-muted leading-relaxed">
              sesiones realizadas a traves de Gantly de forma segura
            </p>
          </div>
          <div className="text-center">
            <div className="text-5xl font-bold text-gantly-blue mb-2 font-heading">
              +92%
            </div>
            <p className="text-[15px] text-gantly-muted leading-relaxed">
              de los psicologos recomiendan Gantly a otros companeros
            </p>
          </div>
          <div className="text-center">
            <div className="text-5xl font-bold text-gantly-blue mb-2 font-heading">
              +8
            </div>
            <p className="text-[15px] text-gantly-muted leading-relaxed">
              anos de experiencia encriptado y confidencial, asegurando el mayor nivel de seguridad
            </p>
          </div>
        </div>
      </section>

      {/* How it works Section */}
      <section className="py-20 px-6 bg-gantly-blue-50/50">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          {/* Left Side - Requirements */}
          <div>
            <div className="text-sm font-semibold text-gantly-blue uppercase tracking-[0.1em] mb-4">
              Como funciona
            </div>
            <h2 className="text-[clamp(32px,4vw,48px)] font-heading font-bold text-gantly-navy leading-tight mb-6">
              Me interesa, que necesito?
            </h2>
            <p className="text-lg leading-relaxed text-gantly-muted mb-8">
              Verificaremos que tienes los requisitos esenciales para ejercer legalmente como Psicologo Sanitario. Ademas necesitaras un ordenador y smartphone con buena conexion a internet.
            </p>
            <button
              onClick={onGetStarted}
              className="px-8 py-4 text-base font-semibold bg-gantly-blue text-white border-none rounded-[28px] cursor-pointer shadow-glow-blue hover:bg-gantly-blue-600 hover:shadow-elevated hover:-translate-y-0.5 transition-all"
            >
              Comenzar registro
            </button>
          </div>

          {/* Right Side - Steps */}
          <div className="relative py-10">
            <div className="absolute left-10 top-0 bottom-0 w-[3px] bg-gantly-blue/20 rounded-full" />
            {[
              { number: 1, text: 'Rellena tus datos' },
              { number: 2, text: 'Completa la verificacion' },
              { number: 3, text: 'Haz crecer tu practica profesional' },
            ].map((step, idx) => (
              <div
                key={step.number}
                className={`flex items-center relative ${idx < 2 ? 'mb-12' : ''}`}
              >
                <div className="w-20 h-20 rounded-full bg-gantly-cloud border-[3px] border-gantly-blue flex items-center justify-center text-[32px] font-bold text-gantly-blue font-heading z-[2] mr-6 shrink-0">
                  {step.number}
                </div>
                <div className="text-xl font-semibold text-gantly-navy">
                  {step.text}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Advantages Section */}
      <section className="py-20 px-6 bg-gantly-cloud">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-16">
            <div className="text-sm font-semibold text-gantly-blue uppercase tracking-[0.1em] mb-4">
              Ventajas
            </div>
            <h2 className="text-[clamp(32px,4vw,48px)] font-heading font-bold text-gantly-navy leading-tight">
              Descubre todas las ventajas de Gantly
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            {/* Left Side - Advantages List */}
            <div className="grid gap-5">
              {[
                'Aumenta tu cartera de pacientes',
                'Sesiones cuando quieras, desde donde quieras',
                'Resumenes automatizados de las sesiones',
                'Proceso automatizado de pago',
                'Asistente de IA personalizado',
                'Comprometidos con las buenas practicas de Telepsicologia del COP de Madrid',
              ].map((title, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-5 p-6 bg-white rounded-2xl border border-gantly-blue/15 shadow-soft"
                >
                  <div className="w-6 h-6 rounded-full bg-gantly-blue shrink-0 mt-0.5 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </div>
                  <div className="text-lg font-medium text-gantly-navy leading-relaxed">
                    {title}
                  </div>
                </div>
              ))}
            </div>

            {/* Right Side - Image */}
            <div className="bg-gantly-blue-50 rounded-3xl aspect-[4/5] flex items-center justify-center border-2 border-gantly-blue/15 overflow-hidden">
              <img
                src={imagenProfesional}
                alt="Imagen profesional"
                className="w-full h-full object-cover block"
              />
            </div>
          </div>
        </div>
      </section>


      {/* Footer - Adherence Statement */}
      <section className="py-12 px-6 bg-gantly-blue-50/70 border-t border-gantly-blue/10">
        <div className="max-w-[1200px] mx-auto flex items-center justify-center gap-4 px-8 py-6 bg-white rounded-2xl border border-gantly-blue/15 shadow-soft">
          <div className="w-12 h-12 rounded-xl bg-gantly-blue flex items-center justify-center shrink-0">
            <div className="w-5 h-5 border-[3px] border-white border-t-0 border-r-0 -rotate-45 -mt-1" />
          </div>
          <p className="m-0 text-base text-gantly-navy leading-relaxed">
            Gantly se adhiere al Codigo de Conducta de Buenas Practicas en Telepsicologia del Colegio Oficial de Psicologos de Madrid.
          </p>
        </div>
      </section>
    </div>
  );
}
