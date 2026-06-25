import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight, ChevronDown, Menu, X,
  Calendar, ClipboardCheck, Users, Shield,
  Brain, Video, Receipt, Sparkles,
  BadgeCheck, Laptop, HeartPulse, CheckCircle2,
} from 'lucide-react';
import LogoSvg from '../assets/logo-gantly.svg';
import SectionWrapper from './landing/shared/SectionWrapper';
import ScrollReveal from './landing/shared/ScrollReveal';
import GlowCard from './landing/shared/GlowCard';
import TiltCard from './landing/shared/TiltCard';
import Footer from './landing/Footer';
import SEO, { breadcrumbSchema } from './seo/SEO';

interface SoyProfesionalProps {
  onBack: () => void;
  onLogin: () => void;
  onGetStarted: () => void;
  onRegisterCompany?: () => void;
}

/* ─── Stats data ─── */
const stats = [
  { value: '100%', label: 'Psicólogos titulados, colegiados y habilitados' },
  { value: '+92%', label: 'Profesionales que recomiendan Gantly' },
  { value: '24/7', label: 'Soporte técnico y acompañamiento' },
  { value: '0%', label: 'Comisión los primeros 3 meses' },
];

/* ─── Advantage cards ─── */
const advantages = [
  { icon: Users, color: '#2E93CC', title: 'Amplia tu cartera', desc: 'Accede a pacientes que buscan exactamente tu especialidad gracias a nuestro matching inteligente.' },
  { icon: Calendar, color: '#22D3EE', title: 'Horario flexible', desc: 'Trabaja cuando quieras, desde donde quieras. Tu agenda, tus reglas.' },
  { icon: ClipboardCheck, color: '#F0C930', title: 'Tareas personalizadas', desc: 'Asigna tareas terapéuticas entre sesiones y haz seguimiento del progreso de cada paciente.' },
  { icon: Receipt, color: '#059669', title: 'Cobro automatico', desc: 'Olvida perseguir pagos. Stripe gestiona todo automaticamente antes de cada sesion.' },
  { icon: Video, color: '#2E93CC', title: 'Videollamada integrada', desc: 'Jitsi Meet privado, sin descargas, con encriptación de extremo a extremo.' },
  { icon: Brain, color: '#22D3EE', title: 'Tests y evaluacion', desc: 'Baterias de tests clinicos integradas. Asigna, recoge resultados y genera informes en un clic.' },
  { icon: Shield, color: '#059669', title: 'Consentimientos informados', desc: 'Gestiona consentimientos informados digitales con firma electrónica integrada.' },
  { icon: HeartPulse, color: '#2E93CC', title: 'Trae tus pacientes', desc: 'Importa tu cartera de pacientes actual y gestiona toda tu consulta desde un solo lugar.' },
];

/* ─── Steps ─── */
const steps = [
  { number: '01', title: 'Crea tu perfil', desc: 'Rellena tus datos, sube tu titulo y numero de colegiado. Solo te llevara unos minutos.', icon: ClipboardCheck },
  { number: '02', title: 'Verificacion', desc: 'Nuestro equipo revisara tus credenciales y habilitara tu cuenta en menos de 48 horas.', icon: BadgeCheck },
  { number: '03', title: 'Empieza a crecer', desc: 'Configura tu agenda, define tus tarifas y comienza a recibir pacientes compatibles contigo.', icon: HeartPulse },
];

/* ─── Requirements ─── */
const requirements = [
  'Titulo oficial en Psicologia',
  'Habilitacion sanitaria vigente',
  'Colegiacion activa',
  'Ordenador con webcam y buena conexion',
];

export default function SoyProfesional({ onBack, onLogin, onGetStarted, onRegisterCompany }: SoyProfesionalProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    setMobileOpen(false);
  };

  return (
    <div className="overflow-x-hidden bg-gantly-cloud min-h-screen">
      <SEO
        title="Para profesionales - Únete como psicólogo"
        description="Gestiona tu consulta desde Gantly: agenda inteligente, tests clínicos validados, facturación automática y panel de pacientes. Únete gratis."
        path="/soy-profesional"
        jsonLd={breadcrumbSchema([
          { name: 'Inicio', url: 'https://gantly.es/' },
          { name: 'Para profesionales', url: 'https://gantly.es/soy-profesional' },
        ])}
      />
      {/* ─── Floating Navbar ─── */}
      <nav
        className={`fixed top-4 left-4 right-4 z-50 rounded-2xl transition-all duration-300 ${
          scrolled
            ? 'bg-white/90 shadow-lg shadow-slate-200/50 border border-slate-200/60'
            : 'bg-white/15 border border-white/20'
        }`}
        style={{ backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }}
      >
        <div className="flex items-center px-5 py-3">
          <img
            src={LogoSvg}
            alt="Gantly"
            className={`h-7 cursor-pointer transition-all duration-300 flex-shrink-0 ${scrolled ? '' : 'brightness-0 invert'}`}
            onClick={onBack}
          />

          <ul className="hidden lg:flex items-center gap-7 flex-1 justify-center">
            {[
              { label: 'Ventajas', id: 'ventajas' },
              { label: 'Como funciona', id: 'pasos' },
              { label: 'Requisitos', id: 'requisitos' },
            ].map((link) => (
              <li key={link.id}>
                <button
                  onClick={() => scrollToSection(link.id)}
                  className={`text-[15px] font-medium font-body transition-colors cursor-pointer ${
                    scrolled ? 'text-slate-600 hover:text-gantly-blue' : 'text-white/90 hover:text-white'
                  }`}
                >
                  {link.label}
                </button>
              </li>
            ))}
          </ul>

          <div className="hidden lg:flex items-center gap-3 flex-shrink-0">
            <button
              onClick={onLogin}
              className={`text-[15px] font-semibold font-body transition-colors px-5 py-2 rounded-xl border cursor-pointer ${
                scrolled
                  ? 'text-slate-700 hover:text-slate-900 border-slate-300 hover:border-slate-400 bg-slate-50 hover:bg-slate-100'
                  : 'text-white hover:text-white border-white/40 hover:border-white/60 bg-white/10 hover:bg-white/20'
              }`}
            >
              Iniciar sesion
            </button>
            <button
              onClick={onGetStarted}
              className={`text-sm font-heading font-semibold transition-colors px-5 py-2 rounded-xl cursor-pointer ${
                scrolled
                  ? 'text-white bg-gantly-blue hover:bg-sky-600 shadow-sm shadow-gantly-blue/20'
                  : 'text-gantly-text bg-white hover:bg-white/90'
              }`}
            >
              Registrarme
            </button>
          </div>

          <button
            className={`lg:hidden transition-colors p-1 cursor-pointer ${
              scrolled ? 'text-slate-600 hover:text-slate-800' : 'text-white/80 hover:text-white'
            }`}
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {mobileOpen && (
          <div className={`lg:hidden border-t px-5 py-4 flex flex-col gap-3 ${scrolled ? 'border-slate-200/60' : 'border-white/20'}`}>
            {[
              { label: 'Ventajas', id: 'ventajas' },
              { label: 'Como funciona', id: 'pasos' },
              { label: 'Requisitos', id: 'requisitos' },
            ].map((link) => (
              <button
                key={link.id}
                onClick={() => scrollToSection(link.id)}
                className={`text-sm font-body transition-colors text-left cursor-pointer ${
                  scrolled ? 'text-slate-600 hover:text-gantly-blue' : 'text-white/80 hover:text-white'
                }`}
              >
                {link.label}
              </button>
            ))}
            <div className={`flex flex-col gap-2 pt-2 border-t ${scrolled ? 'border-slate-200/60' : 'border-white/20'}`}>
              <button
                onClick={() => { onLogin(); setMobileOpen(false); }}
                className={`text-sm font-body transition-colors text-left py-2 cursor-pointer ${
                  scrolled ? 'text-slate-600 hover:text-slate-800' : 'text-white/80 hover:text-white'
                }`}
              >
                Iniciar sesion
              </button>
              <button
                onClick={() => { onGetStarted(); setMobileOpen(false); }}
                className={`text-sm font-heading font-semibold transition-colors px-5 py-2 rounded-xl text-center cursor-pointer ${
                  scrolled
                    ? 'text-white bg-gantly-blue hover:bg-sky-600'
                    : 'text-gantly-text bg-white hover:bg-white/90'
                }`}
              >
                Registrarme
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* ─── Hero Section ─── */}
      <section className="relative min-h-screen overflow-hidden flex flex-col bg-[#FAFBFC]">
        {/* Subtle dot pattern */}
        <div
          className="absolute inset-0 opacity-[0.4]"
          style={{
            backgroundImage: 'radial-gradient(circle, #CBD5E1 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Accent shape — top right */}
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-gantly-blue/[0.06] blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] rounded-full bg-cyan-400/[0.04] blur-3xl pointer-events-none" />

        <div className="relative z-10 flex-1 flex items-center pt-28 pb-16">
          <div className="mx-auto max-w-6xl px-6 lg:px-12 w-full">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Left — Copy */}
              <div>
                <motion.h1
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.25, ease: 'easeOut' }}
                  className="font-heading text-4xl sm:text-5xl lg:text-[3.5rem] font-bold text-[#0A1628] leading-[1.1] tracking-tight mb-5"
                >
                  Haz crecer tu practica clinica con Gantly
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.45 }}
                  className="font-body text-lg text-slate-600 leading-[1.7] mb-8 max-w-lg"
                >
                  Dedicarte a lo que importa: tus pacientes. Nosotros nos encargamos de la agenda, los pagos, la tecnologia y la seguridad.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.7 }}
                  className="flex flex-col sm:flex-row items-start gap-3"
                >
                  <button
                    onClick={onGetStarted}
                    className="font-heading font-semibold text-[15px] text-white bg-gantly-blue hover:bg-sky-600 transition-colors px-7 py-3 rounded-xl cursor-pointer shadow-sm shadow-gantly-blue/20"
                  >
                    Registrarme como psicólogo
                  </button>
                  {onRegisterCompany && (
                    <button
                      onClick={onRegisterCompany}
                      className="font-heading font-semibold text-[15px] text-slate-700 border border-slate-300 hover:border-slate-400 hover:bg-slate-50 transition-all px-7 py-3 rounded-xl cursor-pointer flex items-center gap-2"
                    >
                      Soy empresa / clinica
                      <ArrowRight size={16} />
                    </button>
                  )}
                </motion.div>
              </div>

              {/* Right — Stats + Trust card */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="hidden lg:block"
              >
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-lg shadow-slate-200/50 p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-gantly-blue/10 flex items-center justify-center">
                      <Shield size={20} className="text-gantly-blue" />
                    </div>
                    <div>
                      <p className="font-heading font-semibold text-[15px] text-[#0A1628]">Plataforma verificada</p>
                      <p className="font-body text-xs text-slate-500">Código de Buenas Prácticas COP Madrid</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {stats.map((stat, i) => (
                      <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 + i * 0.1 }}
                        className="bg-[#FAFBFC] rounded-xl p-4 border border-slate-100"
                      >
                        <p className="font-heading text-2xl font-bold text-[#0A1628] mb-1">{stat.value}</p>
                        <p className="font-body text-xs text-slate-500 leading-snug">{stat.label}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="relative z-10 flex justify-center pb-8"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ChevronDown size={24} className="text-slate-300" />
        </motion.div>
      </section>

      {/* ─── Advantages (light) ─── */}
      <SectionWrapper id="ventajas">
        <div className="text-center mb-16">
          <ScrollReveal>
            <h2 className="font-heading text-3xl lg:text-[2.75rem] font-bold text-gantly-text mb-4 tracking-tight">
              Todo lo que necesitas, en un solo lugar
            </h2>
            <p className="font-body text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Herramientas disenadas para que te centres en la terapia mientras Gantly gestiona el resto.
            </p>
          </ScrollReveal>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {advantages.map((card, i) => {
            const Icon = card.icon;
            return (
              <ScrollReveal key={card.title} delay={i * 0.08}>
                <div className="bg-white rounded-2xl border border-slate-100 p-6 lg:p-8 hover:border-slate-200 hover:shadow-lg transition-all duration-300 h-full cursor-pointer">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center mb-5"
                    style={{ backgroundColor: card.color + '15' }}
                  >
                    <Icon size={22} style={{ color: card.color }} />
                  </div>
                  <h3 className="font-heading text-[17px] font-semibold text-gantly-text mb-2">
                    {card.title}
                  </h3>
                  <p className="font-body text-[15px] text-slate-600 leading-[1.65]">
                    {card.desc}
                  </p>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </SectionWrapper>

      {/* ─── How it works (dark) ─── */}
      <SectionWrapper id="pasos" dark className="bg-[#0F172A]">
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        <div className="relative">
          <div className="text-center mb-16">
            <ScrollReveal>
              <h2 className="font-heading text-3xl lg:text-[2.75rem] font-bold text-white mb-4 tracking-tight">
                Empieza en tres pasos
              </h2>
              <p className="font-body text-lg text-white/60 leading-relaxed">
                El proceso es rapido, seguro y 100% online.
              </p>
            </ScrollReveal>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <ScrollReveal key={step.number} delay={i * 0.15}>
                  <TiltCard>
                    <GlowCard glowColor={i === 0 ? '#2E93CC' : i === 1 ? '#F0C930' : '#059669'}>
                      <div className="font-heading text-3xl font-bold text-white/20 mb-4">
                        {step.number}
                      </div>
                      <Icon size={28} style={{ color: i === 0 ? '#2E93CC' : i === 1 ? '#F0C930' : '#059669' }} className="mb-4" />
                      <h3 className="font-heading text-lg font-semibold text-white mb-2">
                        {step.title}
                      </h3>
                      <p className="font-body text-[15px] text-white/65 leading-[1.65]">
                        {step.desc}
                      </p>
                    </GlowCard>
                  </TiltCard>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </SectionWrapper>

      {/* ─── Requirements (light) ─── */}
      <SectionWrapper id="requisitos">
        <div className="grid md:grid-cols-2 gap-16 items-center max-w-5xl mx-auto">
          <ScrollReveal direction="left">
            <h2 className="font-heading text-3xl lg:text-[2.75rem] font-bold text-gantly-text mb-4 tracking-tight">
              ¿Qué necesitas para unirte?
            </h2>
            <p className="font-body text-lg text-slate-600 mb-8 leading-[1.7]">
              Verificaremos que cumples los requisitos esenciales para ejercer legalmente como psicólogo sanitario online.
            </p>
            <div className="flex flex-col gap-4">
              {requirements.map((req, i) => (
                <motion.div
                  key={req}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + i * 0.1, duration: 0.4 }}
                  className="flex items-center gap-3"
                >
                  <CheckCircle2 size={20} className="text-gantly-emerald flex-shrink-0" />
                  <span className="font-body text-[15px] text-slate-700">{req}</span>
                </motion.div>
              ))}
            </div>
          </ScrollReveal>

          <ScrollReveal direction="right">
            <div className="bg-white rounded-2xl border border-slate-100 p-8 lg:p-10 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gantly-blue/10 flex items-center justify-center">
                  <Laptop size={20} className="text-gantly-blue" />
                </div>
                <h3 className="font-heading text-lg font-semibold text-gantly-text">
                  Ademas necesitaras
                </h3>
              </div>
              <ul className="flex flex-col gap-3">
                {[
                  'Ordenador o tablet con webcam',
                  'Smartphone con conexion estable',
                  'Espacio privado para las sesiones',
                  'Ganas de hacer crecer tu practica',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-gantly-blue mt-2 flex-shrink-0" />
                    <span className="font-body text-[15px] text-slate-600">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </ScrollReveal>
        </div>
      </SectionWrapper>

      {/* ─── Final CTA ─── */}
      <section className="relative py-28 lg:py-36 overflow-hidden bg-[#0F172A]">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
          <ScrollReveal>
            <h2 className="font-heading text-4xl lg:text-5xl font-bold text-white mb-4 tracking-tight">
              Tu consultorio, sin límites
            </h2>
            <p className="font-body text-lg text-white/60 mb-10 max-w-xl mx-auto leading-relaxed">
              Únete a la comunidad de profesionales que ya confían en Gantly para transformar su práctica clínica.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={onGetStarted}
                className="px-8 py-3.5 rounded-xl bg-gantly-blue text-white font-heading font-semibold text-base hover:bg-sky-600 transition-colors cursor-pointer min-w-[240px] shadow-sm shadow-gantly-blue/30"
              >
                Registrarme como psicólogo
              </button>
              {onRegisterCompany && (
                <button
                  onClick={onRegisterCompany}
                  className="px-8 py-3.5 rounded-xl border border-white/20 text-white/80 font-heading font-semibold text-base hover:border-white/40 hover:text-white transition-all cursor-pointer min-w-[240px] flex items-center justify-center gap-2"
                >
                  Registrar clinica
                  <ArrowRight size={18} />
                </button>
              )}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ─── COP Badge ─── */}
      <SectionWrapper dark className="bg-[#0F172A] !py-16 lg:!py-20">
        <ScrollReveal>
          <div className="flex items-center justify-center gap-4 px-6 py-5 bg-white/5 rounded-2xl border border-white/10 max-w-3xl mx-auto">
            <Shield size={28} className="text-gantly-emerald flex-shrink-0" />
            <p className="font-body text-sm text-white/70 leading-relaxed">
              Gantly se adhiere al Código de Conducta de Buenas Prácticas en Telepsicología del Colegio Oficial de Psicólogos de Madrid.
            </p>
          </div>
        </ScrollReveal>
      </SectionWrapper>

      <Footer />
    </div>
  );
}
