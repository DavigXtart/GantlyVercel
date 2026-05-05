import alvaroPhoto from '../assets/chumte.jpeg';

interface AboutProps {
  onBack: () => void;
  onLogin: () => void;
  onGetStarted: () => void;
}

export default function About({ onBack, onLogin, onGetStarted }: AboutProps) {
  return (
    <div className="min-h-screen bg-gantly-cloud text-gantly-text font-body">
      <nav className="sticky top-0 z-[1000] bg-white/95 backdrop-blur-md border-b border-gantly-blue/10 px-6 md:px-10 py-5 flex justify-between items-center">
        <button
          onClick={onBack}
          className="flex items-center gap-2.5 bg-transparent border-none cursor-pointer text-gantly-muted text-[15px] font-medium hover:text-gantly-blue transition-colors"
        >
          &larr; Volver
        </button>
        <div className="font-heading text-[28px] font-bold text-gantly-blue tracking-tight">
          Gantly
        </div>
        <div className="flex items-center gap-5">
          <button
            onClick={onLogin}
            className="px-6 py-2.5 rounded-full border border-gantly-blue/30 bg-transparent text-gantly-blue text-[15px] font-medium cursor-pointer hover:bg-gantly-blue/5 hover:border-gantly-blue transition-all"
          >
            Iniciar sesion
          </button>
          <button
            onClick={onGetStarted}
            className="px-6 py-2.5 rounded-full border-none bg-gantly-blue text-white text-[15px] font-semibold cursor-pointer shadow-glow-blue hover:bg-gantly-blue-600 hover:shadow-elevated transition-all"
          >
            Agendar evaluacion
          </button>
        </div>
      </nav>

      <main className="max-w-[1200px] mx-auto px-6 py-[100px] flex flex-col gap-20">
        <section className="grid grid-cols-1 md:grid-cols-[minmax(280px,350px)_1fr] gap-[60px] items-center">
          <div className="relative rounded-3xl overflow-hidden shadow-elevated border-2 border-gantly-blue/15 bg-white">
            <img
              src={alvaroPhoto}
              alt="Alvaro Garcia-Alonso"
              className="w-full h-auto object-cover block"
            />
            <div className="absolute bottom-0 left-0 right-0 px-6 py-5 bg-gradient-to-t from-gantly-navy/90 to-transparent">
              <p className="m-0 text-xl font-semibold text-white font-body">
                Alvaro Garcia-Alonso
              </p>
              <p className="mt-1.5 text-sm text-white/90 font-body">
                Licenciado en Psicologia - Fundacion Gantly
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-7">
            <span className="text-[13px] tracking-[0.12em] text-gantly-blue uppercase font-semibold">
              Vision ejecutiva del bienestar mental
            </span>
            <h1 className="text-[clamp(40px,6vw,64px)] font-heading font-light tracking-tight leading-[0.9] m-0 text-gantly-navy">
              Psicologia estrategica para profesionales y organizaciones
            </h1>
            <p className="text-lg leading-relaxed text-gantly-muted">
              Alvaro combina formacion academica en psicologia con experiencia en evaluacion psicoemocional orientada a resultados. Su enfoque integra
              herramientas clinicas y metodologias de acompanamiento ejecutivo para ofrecer un servicio confidencial, medible y adaptado a cada etapa
              profesional.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-5 mt-4">
              {[
                { title: 'Experiencia clinica', detail: 'Evaluacion y seguimiento individual, enfoque integrativo.' },
                { title: 'Acompanamiento ejecutivo', detail: 'Procesos de alto rendimiento y gestion emocional.' },
                { title: 'Mentoria estrategica', detail: 'Programas a medida para equipos directivos y founders.' }
              ].map((item) => (
                <div
                  key={item.title}
                  className="bg-white border-2 border-gantly-blue/15 rounded-2xl px-[22px] py-6 shadow-card hover:-translate-y-1 hover:shadow-elevated hover:border-gantly-blue/30 transition-all"
                >
                  <h3 className="m-0 text-base font-semibold tracking-wide text-gantly-navy mb-2.5 font-body">
                    {item.title}
                  </h3>
                  <p className="m-0 text-sm leading-relaxed text-gantly-muted font-body">
                    {item.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white border-2 border-gantly-blue/10 rounded-3xl px-8 md:px-14 py-12 grid grid-cols-1 md:grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-10 shadow-card">
          {[
            {
              heading: 'Formacion continua',
              body: 'Programas de especializacion en psicologia clinica, salud mental y acompanamiento empresarial. Colegiado y en supervision permanente.'
            },
            {
              heading: 'Metodologia',
              body: 'Analisis cuantitativo y cualitativo, sesiones orientadas a objetivos y sistemas de seguimiento seguros para profesionales y equipos.'
            },
            {
              heading: 'Confidencialidad',
              body: 'Entorno protegido, protocolos GDPR y acuerdos de confidencialidad para procesos individuales y corporativos.'
            }
          ].map((item) => (
            <div key={item.heading} className="flex flex-col gap-4">
              <h3 className="m-0 text-xl font-semibold tracking-tight text-gantly-navy font-body">
                {item.heading}
              </h3>
              <p className="m-0 text-base leading-relaxed text-gantly-muted font-body">
                {item.body}
              </p>
            </div>
          ))}
        </section>

        <section className="bg-gradient-to-br from-gantly-blue to-gantly-blue-700 rounded-3xl px-8 md:px-14 py-[60px] text-center shadow-elevated relative overflow-hidden">
          <div className="absolute -top-[50px] -right-[50px] w-[300px] h-[300px] rounded-full bg-white/10 blur-[40px]" />
          <div className="absolute -bottom-[50px] -left-[50px] w-[300px] h-[300px] rounded-full bg-white/[0.08] blur-[40px]" />
          <div className="relative z-10">
            <h2 className="m-0 text-[clamp(32px,4vw,48px)] font-heading font-bold tracking-tight text-white mb-5">
              Descubre como potenciar tu bienestar y liderazgo
            </h2>
            <p className="mx-auto mt-5 mb-9 text-lg leading-relaxed max-w-[680px] text-white/95 font-body">
              Agenda una reunion para explorar planes individuales y corporativos. Construimos procesos discretos y orientados a objetivos.
            </p>
            <button
              onClick={onGetStarted}
              className="px-11 py-4 rounded-[30px] border-none bg-white text-gantly-blue text-[17px] font-semibold cursor-pointer shadow-elevated hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(0,0,0,0.3)] transition-all font-body"
            >
              Coordinar una reunion
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
