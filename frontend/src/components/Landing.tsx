import logoImage from '../assets/8e16ea61-e62c-4196-9aca-b95cf9b35322_removalai_preview.png';
import testInicialImage from '../assets/Gemini_Generated_Image_2xvx8k2xvx8k2xvx.png';

interface LandingProps {
  onGetStarted: () => void;
  onLogin: () => void;
  onShowAbout: () => void;
  onShowSoyProfesional: () => void;
}

export default function Landing({ onGetStarted, onLogin, onShowAbout, onShowSoyProfesional }: LandingProps) {
  return (
    <div className="min-h-screen bg-cream text-forest selection:bg-mint selection:text-forest">
      {/* Navigation bar */}
      <nav
        style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(90, 146, 112, 0.15)',
        padding: '20px 40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        }}
      >
        <div
          style={{
          fontFamily: "'Nunito', sans-serif",
          fontSize: '28px',
          fontWeight: 700,
          color: '#5a9270',
          letterSpacing: '-0.02em',
          }}
        >
          Gantly
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <button
            onClick={onShowAbout}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#3a5a4a',
              fontSize: '15px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'color 0.3s',
              fontFamily: "'Inter', sans-serif",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#5a9270';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#3a5a4a';
            }}
          >
            Sobre nosotros
          </button>
          <button
            onClick={onShowSoyProfesional}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#3a5a4a',
              fontSize: '15px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'color 0.3s',
              fontFamily: "'Inter', sans-serif",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#5a9270';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#3a5a4a';
            }}
          >
            Soy profesional
          </button>
          <button
            onClick={onLogin}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#3a5a4a',
              fontSize: '15px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'color 0.3s',
              fontFamily: "'Inter', sans-serif",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#5a9270';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#3a5a4a';
            }}
          >
            Iniciar sesión
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-8 max-w-7xl mx-auto overflow-hidden" style={{ paddingTop: '140px' }}>
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="relative z-10">
            <span className="inline-block px-4 py-1.5 bg-mint rounded-full text-xs font-medium tracking-widest uppercase mb-8">
              Matching psicológico con cuidado humano
            </span>
            <h1 className="text-5xl lg:text-7xl font-normal leading-[0.9] mb-8 text-forest">
              Encuentra al <span className="italic text-sage">psicólogo ideal</span> para ti.
        </h1>
            <p className="text-lg text-forest/80 mb-10 max-w-xl leading-relaxed font-light">
              Te acompañamos desde el primer test hasta la primera sesión. Menos fricción, más tiempo para tu bienestar
              emocional.
            </p>
            <div className="flex flex-wrap gap-4">
          <button
                type="button"
            onClick={onGetStarted}
                className="bg-forest text-cream px-8 py-3 rounded-full font-medium text-base hover:shadow-xl hover:shadow-sage/10 transition-all"
              >
                Comenzar ahora
          </button>
              <a
                href="#care"
                className="group border border-sage/30 px-8 py-3 rounded-full font-medium text-base hover:bg-mint/40 transition-all flex items-center gap-2"
              >
                Cómo funciona
                <span className="material-symbols-outlined text-sage group-hover:translate-x-1 transition-transform text-base">
                  arrow_forward
                </span>
              </a>
            </div>
              </div>
          <div className="relative">
            <div className="absolute inset-0 bg-mint/30 organic-shape -z-10 blur-3xl opacity-60" />
            <img 
              src={logoImage} 
              alt="Gantly" 
              className="mx-auto"
              style={{ width: '139%', maxWidth: 'none', height: 'auto', marginLeft: '-100px' }}
            />
          </div>
        </div>
      </section>

      {/* Mini features strip */}
      <div className="px-8 py-16 bg-mint/20 border-y border-mint/40">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-center items-center gap-10" style={{ color: '#5a9270' }}>
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest font-medium">
            <span className="material-symbols-outlined text-base" style={{ color: '#5a9270' }}>psychology</span>
            Matching inteligente
          </div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest font-medium">
            <span className="material-symbols-outlined text-base" style={{ color: '#5a9270' }}>self_improvement</span>
            Test inicial guiado
          </div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest font-medium">
            <span className="material-symbols-outlined text-base" style={{ color: '#5a9270' }}>calendar_today</span>
            Agenda online
          </div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest font-medium">
            <span className="material-symbols-outlined text-base" style={{ color: '#5a9270' }}>chat</span>
            Chat y videollamadas seguras
          </div>
        </div>
      </div>

      {/* Philosophy */}
      <section id="philosophy" className="py-24 px-8">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
          <div>
            <h2 className="text-4xl lg:text-6xl font-normal mb-6 leading-tight text-forest">
              Un espacio tranquilo para<span className="italic text-sage"> tomar decisiones con calma.</span>
          </h2>
            <p className="text-forest/80 text-base leading-relaxed mb-8 font-light">
              Gantly no es solo un directorio de psicólogos. Es una experiencia completa: test inicial, matching
              avanzado y un panel sencillo donde puedes gestionar tus sesiones, tareas y evolución emocional.
            </p>
            <div className="flex gap-3">
              <div className="size-10 rounded-full border border-sage/30 flex items-center justify-center group cursor-pointer transition-all hover:border-sage hover:bg-mint/30">
                <span className="material-symbols-outlined text-sage/60 text-base transition-colors group-hover:text-sage">spa</span>
              </div>
              <div className="size-10 rounded-full border border-sage/30 flex items-center justify-center group cursor-pointer transition-all hover:border-sage hover:bg-mint/30">
                <span className="material-symbols-outlined text-sage/60 text-base transition-colors group-hover:text-sage">potted_plant</span>
              </div>
              <div className="size-10 rounded-full border border-sage/30 flex items-center justify-center group cursor-pointer transition-all hover:border-sage hover:bg-mint/30">
                <span className="material-symbols-outlined text-sage/60 text-base transition-colors group-hover:text-sage">air</span>
              </div>
            </div>
                </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="p-8 rounded-[3rem] bg-white soft-shadow border border-sage/10 hover:-translate-y-2 transition-transform duration-500">
              <div className="size-12 bg-mint/50 organic-shape flex items-center justify-center text-sage mb-4">
                <span className="material-symbols-outlined">person_search</span>
                    </div>
              <h3 className="text-2xl font-normal mb-2">Matching clínico</h3>
              <p className="text-sm text-sage/70 leading-relaxed font-light">
                Un test que tiene en cuenta tu historia, preferencias y nivel de malestar para proponerte perfiles
                adecuados.
              </p>
                    </div>
            <div className="p-8 rounded-[3rem] bg-white soft-shadow border border-sage/10 translate-y-8 hover:-translate-y-2 transition-transform duration-500">
              <div className="size-12 bg-mint/50 organic-shape flex items-center justify-center text-sage mb-4">
                <span className="material-symbols-outlined">event_available</span>
              </div>
              <h3 className="text-2xl font-normal mb-2">Todo en un solo lugar</h3>
              <p className="text-sm text-sage/70 leading-relaxed font-light">
                Citas, pagos, tareas, tests y seguimiento de tu estado de ánimo integrados en un panel sencillo.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Care paths */}
      <section id="care" className="py-24 bg-mint/10">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-normal mb-4">
              Cómo funciona <span className="italic text-sage">Gantly</span>
          </h2>
            <p className="text-forest/80 max-w-xl mx-auto font-light">
              Tres formas de conectar con tu psicólogo y seguir tu proceso terapéutico.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-10">
            <div className="group">
              <div className="relative h-[360px] w-full overflow-hidden rounded-[3rem] mb-6 bg-cream border border-sage/10">
                <img
                  alt="Evaluación inicial"
                  className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-700"
                  style={{ objectPosition: 'center top' }}
                  src={testInicialImage}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-cream/80 via-transparent to-transparent" />
              </div>
              <h3 className="text-3xl font-normal mb-2 flex items-center justify-between px-1">
                1. Test inicial
                <span className="material-symbols-outlined text-sage/40 group-hover:text-sage transition-colors text-base">
                  arrow_outward
                </span>
              </h3>
              <p className="text-forest/80 px-1 text-sm font-light">
                Responde a un test diseñado por psicólogos clínicos para entender mejor tu situación actual.
              </p>
            </div>
            <div className="group">
              <div className="relative h-[360px] w-full overflow-hidden rounded-[3rem] mb-6 bg-cream border border-sage/10">
                <img
                  alt="Matching"
                  className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-700"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDl9XHOnef7e4cMADy1MLQXH3lijmCTkFM07ejnr1nlvV_EpLJswahIRm8490KjTB89daBx6g1sV4PMEJpIxS3uFf-1PeYlyFCo8Y260LhBkN9n3Ed7PhcbqwmDV6UUCmdIinacdzHCLXKKwq2n3T4dCpkZXfQRGT33izjg2l1_De-IaU5rY8Aj2wHhzCusx3hR6d_zrT7mjSfXhZkKSCSa9rEYjM9Jf4CqA0Sxg7bqlZvs21ng8FJ5pSQRv4JjHYb114tv4WEI-K-_"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-cream/80 via-transparent to-transparent" />
                </div>
              <h3 className="text-3xl font-normal mb-2 flex items-center justify-between px-1">
                2. Matching
                <span className="material-symbols-outlined text-sage/40 group-hover:text-sage transition-colors text-base">
                  arrow_outward
                </span>
                </h3>
              <p className="text-forest/80 px-1 text-sm font-light">
                Te mostramos psicólogos compatibles contigo, con información clara sobre su enfoque y experiencia.
              </p>
            </div>
            <div className="group">
              <div className="relative h-[360px] w-full overflow-hidden rounded-[3rem] mb-6 bg-cream border border-sage/10">
                <img
                  alt="Sesiones online"
                  className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-700"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuD2YWC_tBvBTOttAXPFkZO-27_xC3xjDp_Wp_7M7yFODVyIk5u8NycdrvLyRt3z7Vfs8CpjKGGXQsI2RG2IHqIGBmiF8shOONg-fyue_vdcBH-GvfMe041v_WbCHVUqT0-r89tuNtJFzEn0RvkiChKd2Mi0rDBMX6hXTP-MWtSwE8x62UwGqCWrZJmkt9ITKg6jf1QOYxRYSHw4NwKcV7iofmhdpdwKnH0qXMh1Km7LjIqesuz7_frVuZCuTa6wJFnzUGsxxUdgkaW4"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-cream/80 via-transparent to-transparent" />
              </div>
              <h3 className="text-3xl font-normal mb-2 flex items-center justify-between px-1">
                3. Sesiones y seguimiento
                <span className="material-symbols-outlined text-sage/40 group-hover:text-sage transition-colors text-base">
                  arrow_outward
                </span>
              </h3>
              <p className="text-forest/80 px-1 text-sm font-light">
                Agenda online, chat seguro, videollamadas y herramientas de seguimiento de tu evolución.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section id="team" className="py-24">
        <div className="max-w-7xl mx-auto px-8 grid lg:grid-cols-4 gap-12">
          <div>
            <h2 className="text-4xl font-normal mb-6 leading-tight text-forest">
              Un equipo<span className="italic text-sage"> cercano.</span>
            </h2>
            <p className="text-forest/80 font-light mb-8 leading-relaxed text-sm">
              Psicólogos seleccionados por su experiencia clínica y su forma cálida de acompañar procesos complejos.
            </p>
            <button
              type="button"
              onClick={onShowSoyProfesional}
              className="text-xs font-medium tracking-widest uppercase text-sage flex items-center gap-2 group"
            >
              ¿Eres profesional?
              <span className="w-10 h-px bg-sage/40 group-hover:w-16 transition-all" />
            </button>
          </div>
          <div className="lg:col-span-3 grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-[2.5rem] border border-sage/10 soft-shadow">
              <div className="aspect-[4/5] bg-mint rounded-[2rem] mb-6 overflow-hidden">
                <img
                  className="w-full h-full object-cover grayscale opacity-80"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBnHq8RW26VBkKrvYu7FDWXM50zguYZOQn_M-FpIfsJf2z8nK-pDwROnmbXYNrkEz_qrKTley4iF6u7Y9H-c21WxA3oH31WDxFMBjso9Ob5VZGiOaiGOB82nf6W9dn8DHSHeq_VGKAk-R6s5-UNY07k26i9nCClo-3Zayf_omTz8X64rWFu40GFFlg1HdWjqp8-oj-hhUPDAevxKGCTHtOLKhonR5-DQEV4aOyzf3sYiGsoyyp6axCRBkOCKAgrIYVJysurmhKFF-yO"
                  alt=""
                />
              </div>
              <h4 className="text-2xl font-normal mb-1">Equipo clínico</h4>
              <p className="text-xs text-sage/60 uppercase tracking-widest font-medium mb-3">Evaluación y matching</p>
            </div>
            <div className="bg-white p-6 rounded-[2.5rem] border border-sage/10 soft-shadow translate-y-8">
              <div className="aspect-[4/5] bg-mint rounded-[2rem] mb-6 overflow-hidden">
                <img
                  className="w-full h-full object-cover grayscale opacity-80"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuB_fplQIpMFrUMQnOjnBo-r9O2kUBwurKqFeBPR0Byrx2vlg0hORFpJLWVKsO54jPnNzmtVbB8H22uii13qRTE15Z-4ya1hHDHLjL11wvVNZ50wu2teJ33XIzRy7yjtU6PwYmdmsTofY4RKe9tJ50kXKMiFlg6nuXxxvwlp-g8dD9m_aqI59myJ0ySLehZPpzOytiL1bT7p55fQKDupv99YHPhgS8p8VZdcFx-Hd1hd7sdCvWISECWRvsDscm1vSpvrLm_FIwcRvxUD"
                  alt=""
                />
              </div>
              <h4 className="text-2xl font-normal mb-1">Psicólogos colaboradores</h4>
              <p className="text-xs text-sage/60 uppercase tracking-widest font-medium mb-3">Red nacional</p>
            </div>
            <div className="bg-white p-6 rounded-[2.5rem] border border-sage/10 soft-shadow translate-y-16">
              <div className="aspect-[4/5] bg-mint rounded-[2rem] mb-6 overflow-hidden">
                <img
                  className="w-full h-full object-cover grayscale opacity-80"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAnNvjXfG1GDMedezgIrHJhUBP8kfQopfwsTWJQIzJ021dsZX_dGL19Rpjqj8WUr_1ATZQLgsCV_puf2vE4bKnRkJDz5Rh5nbhPmiVV2dpspfsglDXuvFm3ijXHodBwx-SCfL3-HWUtfXk9r-7GKx1_bctNN-ZSPesHn9LAZsvhf--Pov1SCVPdJn6Nvm5eFq3aBClvX92o-qVg_XJIj-q_VqNUz8pVU94CG86gH3RpGW4fGdOmpo36fQI9ho8sozKORMq92dZYh4Vy"
                  alt=""
                />
              </div>
              <h4 className="text-2xl font-normal mb-1">Equipo producto</h4>
              <p className="text-xs text-sage/60 uppercase tracking-widest font-medium mb-3">
                Tecnología al servicio de la terapia
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 px-8">
        <div className="max-w-7xl mx-auto bg-forest rounded-[4rem] p-10 lg:p-20 text-center relative overflow-hidden text-cream">
          <div className="absolute -top-1/2 -left-1/4 size-[500px] bg-sage/20 organic-shape blur-[100px] opacity-40" />
          <div className="relative z-10">
            <h2 className="text-4xl lg:text-6xl font-normal mb-8 max-w-3xl mx-auto leading-none">
              Da un paso tranquilo hacia tu próxima sesión.
          </h2>
            <p className="text-mint text-lg mb-10 max-w-xl mx-auto font-light leading-relaxed">
              Empieza con un test gratuito y descubre qué profesional encaja mejor contigo.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
                type="button"
            onClick={onGetStarted}
                className="bg-cream text-forest px-10 py-4 rounded-full font-medium text-lg hover:scale-105 transition-transform duration-300"
          >
            Comenzar evaluación
          </button>
              <button
                type="button"
                onClick={onLogin}
                className="bg-transparent text-cream px-10 py-4 rounded-full font-medium text-lg hover:bg-white/5 transition-all border border-cream/30"
              >
                Iniciar sesión
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-cream py-12 px-8 border-t border-sage/10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs uppercase tracking-widest" style={{ color: '#5a9270' }}>
            © {new Date().getFullYear()} Gantly. Todos los derechos reservados.
          </p>
          <div className="flex gap-4 text-xs" style={{ color: '#5a9270' }}>
            <button type="button" onClick={onShowAbout} className="hover:text-forest transition-colors">
              Sobre nosotros
            </button>
            <button type="button" onClick={onShowSoyProfesional} className="hover:text-forest transition-colors">
              Soy profesional
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

