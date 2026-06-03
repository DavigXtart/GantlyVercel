import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight, ChevronDown, Menu, X,
  Calendar, MessageCircle, Brain, Receipt,
  Video, Shield, FileCheck, Users,
  Lock, BarChart3, Clock, Zap,
  CheckCircle2, Globe, Smartphone,
} from 'lucide-react';
import LogoSvg from '../assets/logo-gantly.svg';
import SectionWrapper from './landing/shared/SectionWrapper';
import ScrollReveal from './landing/shared/ScrollReveal';
import Footer from './landing/Footer';
import SEO, { breadcrumbSchema } from './seo/SEO';

interface ParaProfesionalesProps {
  onBack: () => void;
  onLogin: () => void;
  onGetStarted: () => void;
}

/* ─── Feature sections data ─── */
const features = [
  {
    id: 'agenda',
    icon: Calendar,
    color: '#2E93CC',
    title: 'Agenda inteligente',
    subtitle: 'Tu tiempo, perfectamente organizado',
    points: [
      'Configura tu disponibilidad semanal y genera franjas automaticamente',
      'Slots recurrentes (semanal, quincenal, mensual) con un clic',
      'Los pacientes reservan directamente sin intermediarios',
      'Bloquea tiempo personal o citas internas en tu calendario',
      'Exporta tus citas a Google Calendar, Apple o cualquier app (iCal)',
    ],
  },
  {
    id: 'chat',
    icon: MessageCircle,
    color: '#22D3EE',
    title: 'Chat cifrado de extremo a extremo',
    subtitle: 'Comunicacion segura entre sesiones',
    points: [
      'Cifrado AES-256-GCM con derivacion de clave PBKDF2 por conversacion',
      'Salt unico por cada relacion terapeutica',
      'Notificaciones en tiempo real via WebSocket',
      'Historial completo accesible en cualquier momento',
      'Indicador de mensajes no leidos en el dashboard',
    ],
  },
  {
    id: 'tests',
    icon: Brain,
    color: '#F0C930',
    title: 'Tests clinicos integrados',
    subtitle: 'Evaluaciones validadas, resultados inmediatos',
    points: [
      'Bateria de tests: ansiedad, depresion, estres, personalidad, aptitudes',
      'Asigna tests a pacientes con un clic desde su perfil',
      'Resultados con graficos radar, percentiles y barras bipolares',
      'Exportacion de informes en PDF (html2canvas + jsPDF)',
      'Importa tus propios tests desde Excel (formato Delphos o generico)',
    ],
  },
  {
    id: 'billing',
    icon: Receipt,
    color: '#059669',
    title: 'Facturacion y cobros automaticos',
    subtitle: 'Cobra sin perseguir pagos',
    points: [
      'Stripe integrado: el paciente paga antes de la sesion (deadline 48h)',
      'Planes de suscripcion (Basic/Premium/Enterprise) para clinicas',
      'Facturación con IVA configurable (exencion sanitaria Art. 20 LIVA)',
      'Panel de billing con historial, filtros y exportacion CSV',
      'Generacion de facturas PDF con datos fiscales completos',
    ],
  },
  {
    id: 'video',
    icon: Video,
    color: '#2E93CC',
    title: 'Videollamadas privadas',
    subtitle: 'Sesiones online sin descargas',
    points: [
      'Jitsi Meet integrado — sin instalaciones para el paciente',
      'Sala privada por cita, acceso controlado por JWT',
      'Video HD con cifrado de extremo a extremo',
      'Sin grabacion por defecto (cumplimiento RGPD)',
      'Funciona desde cualquier navegador moderno',
    ],
  },
  {
    id: 'consent',
    icon: FileCheck,
    color: '#22D3EE',
    title: 'Consentimientos digitales',
    subtitle: 'Firma electronica integrada',
    points: [
      'Plantillas personalizables: consentimiento informado + ficha de ingreso',
      'Formularios condicionales con logica showIf',
      'Firma con SignaturePad (curvas Bezier, grosor por velocidad)',
      'Variables auto-rellenadas (nombre, colegiado, fecha)',
      'Envio automatico al asignar un nuevo paciente',
    ],
  },
];

/* ─── Security items ─── */
const securityItems = [
  { icon: Lock, label: 'Cifrado AES-256-GCM', desc: 'Datos en reposo y en transito' },
  { icon: Shield, label: 'RGPD completo', desc: 'Doble consentimiento Art. 9' },
  { icon: Globe, label: 'Servidores EU', desc: 'Datos alojados en la UE' },
  { icon: Clock, label: 'Retencion programada', desc: 'Borrado automatico 3AM diario' },
];

/* ─── Animations ─── */
const fadeUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: 'easeOut' as const },
};

export default function ParaProfesionales({ onBack, onLogin, onGetStarted }: ParaProfesionalesProps) {
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
        title="Funcionalidades para profesionales - Gantly"
        description="Descubre todas las herramientas que Gantly ofrece a psicologos: agenda inteligente, chat cifrado, tests clinicos, facturacion automatica, videollamadas y consentimientos digitales."
        path="/para-profesionales"
        jsonLd={breadcrumbSchema([
          { name: 'Inicio', url: 'https://gantly.es/' },
          { name: 'Para profesionales', url: 'https://gantly.es/para-profesionales' },
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
        <div className="flex items-center justify-between px-5 py-3">
          <img
            src={LogoSvg}
            alt="Gantly"
            className={`h-7 cursor-pointer transition-all duration-300 ${scrolled ? '' : 'brightness-0 invert'}`}
            onClick={onBack}
          />

          <ul className="hidden lg:flex items-center gap-7">
            {[
              { label: 'Funcionalidades', id: 'funcionalidades' },
              { label: 'Seguridad', id: 'seguridad' },
              { label: 'Numeros', id: 'numeros' },
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

          <div className="hidden lg:flex items-center gap-3">
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
              Unirme ahora
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
              { label: 'Funcionalidades', id: 'funcionalidades' },
              { label: 'Seguridad', id: 'seguridad' },
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
                Unirme ahora
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* ─── Hero Section ─── */}
      <section className="relative min-h-[80vh] overflow-hidden flex flex-col justify-center bg-[#0F172A]">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-gantly-blue/[0.08] blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-cyan-400/[0.06] blur-3xl pointer-events-none" />

        <div className="relative z-10 mx-auto max-w-5xl px-6 lg:px-12 w-full pt-32 pb-16">
          <div className="text-center">
            <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.2 }}>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-8">
                <Zap size={14} className="text-gantly-gold" />
                <span className="text-xs font-semibold font-body text-white/70 tracking-wide uppercase">
                  Plataforma completa para psicologos
                </span>
              </div>
            </motion.div>

            <motion.h1
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: 0.35 }}
              className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.1] mb-6"
            >
              Todo lo que necesitas{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-gantly-blue to-cyan-400">
                en un solo lugar
              </span>
            </motion.h1>

            <motion.p
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: 0.5 }}
              className="font-body text-lg text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed"
            >
              Agenda, chat cifrado, tests clinicos, facturacion, videollamadas y consentimientos digitales.
              Diseñado por y para profesionales de la salud mental.
            </motion.p>

            <motion.div
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: 0.65 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-3"
            >
              <button
                onClick={onGetStarted}
                className="px-8 py-3.5 rounded-xl bg-gantly-blue text-white font-heading font-semibold text-base hover:bg-sky-600 transition-colors cursor-pointer shadow-lg shadow-gantly-blue/30 flex items-center gap-2"
              >
                Empezar gratis
                <ArrowRight size={18} />
              </button>
              <button
                onClick={() => scrollToSection('funcionalidades')}
                className="px-8 py-3.5 rounded-xl border border-white/20 text-white/80 font-heading font-semibold text-base hover:border-white/40 hover:text-white transition-all cursor-pointer"
              >
                Ver funcionalidades
              </button>
            </motion.div>

            {/* Quick feature pills */}
            <motion.div
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: 0.8 }}
              className="flex flex-wrap items-center justify-center gap-3 mt-12"
            >
              {[
                { icon: Calendar, label: 'Agenda' },
                { icon: MessageCircle, label: 'Chat E2E' },
                { icon: Brain, label: 'Tests' },
                { icon: Receipt, label: 'Cobros' },
                { icon: Video, label: 'Video' },
                { icon: FileCheck, label: 'Consentimientos' },
              ].map((pill) => {
                const Icon = pill.icon;
                return (
                  <span
                    key={pill.label}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/60 text-xs font-body"
                  >
                    <Icon size={12} />
                    {pill.label}
                  </span>
                );
              })}
            </motion.div>
          </div>
        </div>

        <motion.div
          className="relative z-10 flex justify-center pb-8"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ChevronDown size={24} className="text-white/20" />
        </motion.div>
      </section>

      {/* ─── Feature deep-dives ─── */}
      <div id="funcionalidades">
        {features.map((feature, idx) => {
          const Icon = feature.icon;
          const isOdd = idx % 2 === 1;
          const isDark = isOdd;

          return (
            <SectionWrapper
              key={feature.id}
              id={feature.id}
              dark={isDark}
              className={isDark ? 'bg-[#0F172A]' : ''}
            >
              {isDark && (
                <div
                  className="absolute inset-0 opacity-[0.03]"
                  style={{
                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                    backgroundSize: '60px 60px',
                  }}
                />
              )}
              <div className="relative">
                <div className={`grid lg:grid-cols-2 gap-12 lg:gap-16 items-center max-w-5xl mx-auto ${
                  idx % 2 === 0 ? '' : 'lg:[direction:rtl]'
                }`}>
                  {/* Text side */}
                  <ScrollReveal direction={idx % 2 === 0 ? 'left' : 'right'}>
                    <div className={idx % 2 === 1 ? 'lg:[direction:ltr]' : ''}>
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                        style={{ backgroundColor: feature.color + '15' }}
                      >
                        <Icon size={24} style={{ color: feature.color }} />
                      </div>
                      <h2 className={`font-heading text-3xl lg:text-4xl font-bold mb-2 ${
                        isDark ? 'text-white' : 'text-gantly-text'
                      }`}>
                        {feature.title}
                      </h2>
                      <p className={`font-body text-lg mb-6 ${
                        isDark ? 'text-white/50' : 'text-slate-500'
                      }`}>
                        {feature.subtitle}
                      </p>
                      <ul className="flex flex-col gap-3">
                        {feature.points.map((point) => (
                          <li key={point} className="flex items-start gap-3">
                            <CheckCircle2
                              size={18}
                              className="flex-shrink-0 mt-0.5"
                              style={{ color: feature.color }}
                            />
                            <span className={`font-body text-sm leading-relaxed ${
                              isDark ? 'text-white/70' : 'text-slate-600'
                            }`}>
                              {point}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </ScrollReveal>

                  {/* Visual side — mockup card */}
                  <ScrollReveal direction={idx % 2 === 0 ? 'right' : 'left'}>
                    <div className={idx % 2 === 1 ? 'lg:[direction:ltr]' : ''}>
                      <FeatureMockup feature={feature} isDark={isDark} />
                    </div>
                  </ScrollReveal>
                </div>
              </div>
            </SectionWrapper>
          );
        })}
      </div>

      {/* ─── Security & Compliance ─── */}
      <SectionWrapper id="seguridad" dark className="bg-[#0F172A]">
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
              <h2 className="font-heading text-3xl lg:text-5xl font-bold text-white mb-4">
                Seguridad de nivel clinico
              </h2>
              <p className="font-body text-lg text-white/50 max-w-2xl mx-auto">
                Datos de salud requieren la maxima proteccion. Asi protegemos a tus pacientes.
              </p>
            </ScrollReveal>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {securityItems.map((item, i) => {
              const SIcon = item.icon;
              return (
                <ScrollReveal key={item.label} delay={i * 0.1}>
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center hover:bg-white/[0.08] transition-colors">
                    <div className="w-12 h-12 rounded-xl bg-gantly-emerald/10 flex items-center justify-center mx-auto mb-4">
                      <SIcon size={22} className="text-gantly-emerald" />
                    </div>
                    <h4 className="font-heading font-bold text-white text-sm mb-1">{item.label}</h4>
                    <p className="font-body text-xs text-white/50">{item.desc}</p>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>

          <ScrollReveal>
            <div className="flex flex-wrap items-center justify-center gap-3 mt-12">
              {['Rate limiting', 'Account lockout', 'CSP headers', 'IDOR protection', 'XSS sanitizer', 'Audit logging'].map((tag) => (
                <span key={tag} className="font-body text-[11px] text-gantly-emerald/80 bg-gantly-emerald/5 border border-gantly-emerald/10 rounded-full px-3 py-1">
                  {tag}
                </span>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </SectionWrapper>

      {/* ─── Numbers / Key metrics ─── */}
      <SectionWrapper id="numeros">
        <div className="text-center mb-16">
          <ScrollReveal>
            <h2 className="font-heading text-3xl lg:text-5xl font-bold text-gantly-text mb-4">
              Construido para escalar contigo
            </h2>
            <p className="font-body text-lg text-slate-500 max-w-2xl mx-auto">
              Desde un solo psicologo hasta clinicas con equipos completos.
            </p>
          </ScrollReveal>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {[
            { value: '27+', label: 'Entidades JPA', sub: 'Modelo de datos completo', icon: BarChart3 },
            { value: '60+', label: 'Componentes React', sub: 'Interfaz rica y adaptable', icon: Smartphone },
            { value: '20+', label: 'API endpoints', sub: 'Backend robusto', icon: Globe },
            { value: 'E2E', label: 'Cifrado completo', sub: 'AES-256-GCM + PBKDF2', icon: Lock },
          ].map((stat, i) => {
            const StatIcon = stat.icon;
            return (
              <ScrollReveal key={stat.label} delay={i * 0.1}>
                <div className="bg-white rounded-2xl border border-slate-100 p-6 text-center hover:shadow-lg transition-all duration-300">
                  <div className="w-10 h-10 rounded-xl bg-gantly-blue/10 flex items-center justify-center mx-auto mb-4">
                    <StatIcon size={20} className="text-gantly-blue" />
                  </div>
                  <p className="font-heading text-3xl font-bold text-gantly-text mb-1">{stat.value}</p>
                  <p className="font-heading text-sm font-semibold text-gantly-text mb-0.5">{stat.label}</p>
                  <p className="font-body text-xs text-slate-500">{stat.sub}</p>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </SectionWrapper>

      {/* ─── Final CTA ─── */}
      <section className="relative py-28 lg:py-36 overflow-hidden bg-gradient-to-br from-gantly-blue to-cyan-600">
        <div className="absolute inset-0 opacity-10">
          <div
            style={{
              backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
              backgroundSize: '32px 32px',
              width: '100%',
              height: '100%',
            }}
          />
        </div>

        <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
          <ScrollReveal>
            <h2 className="font-heading text-4xl lg:text-5xl font-bold text-white mb-4">
              Empieza hoy, gratis
            </h2>
            <p className="font-body text-lg text-white/70 mb-10 max-w-xl mx-auto">
              Crea tu cuenta en 2 minutos. Sin tarjeta de credito. Sin permanencia.
              0% comision los primeros 3 meses.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={onGetStarted}
                className="px-8 py-3.5 rounded-xl bg-white text-gantly-blue font-heading font-semibold text-base hover:bg-white/90 transition-colors cursor-pointer shadow-lg shadow-black/10 flex items-center gap-2"
              >
                Registrarme como psicologo
                <ArrowRight size={18} />
              </button>
              <button
                onClick={onBack}
                className="px-8 py-3.5 rounded-xl border border-white/30 text-white font-heading font-semibold text-base hover:border-white/60 transition-all cursor-pointer"
              >
                Volver al inicio
              </button>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <Footer />
    </div>
  );
}

/* ─── Feature Mockup Component ─── */
function FeatureMockup({ feature, isDark }: { feature: typeof features[0]; isDark: boolean }) {
  const cardBg = isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-100';
  const textPrimary = isDark ? 'text-white' : 'text-gantly-text';
  const textMuted = isDark ? 'text-white/50' : 'text-slate-500';
  const barBg = isDark ? 'bg-white/10' : 'bg-slate-100';

  if (feature.id === 'agenda') {
    return (
      <div className={`rounded-2xl border p-6 ${cardBg} shadow-sm`}>
        <div className="flex items-center gap-2 mb-4">
          <Calendar size={16} style={{ color: feature.color }} />
          <span className={`font-heading text-sm font-semibold ${textPrimary}`}>Semana 12 - 18 junio</span>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {['Lun', 'Mar', 'Mie', 'Jue', 'Vie'].map((day, i) => (
            <div key={day} className="text-center">
              <p className={`text-[10px] font-body mb-2 ${textMuted}`}>{day}</p>
              {[0, 1, 2].map((slot) => {
                const isBooked = (i === 0 && slot === 1) || (i === 2 && slot === 0) || (i === 4 && slot === 2);
                const isInternal = i === 3 && slot === 1;
                return (
                  <div
                    key={slot}
                    className={`h-6 rounded-md mb-1 text-[9px] flex items-center justify-center font-body ${
                      isBooked
                        ? 'bg-gantly-blue/20 text-gantly-blue'
                        : isInternal
                        ? 'bg-gantly-gold/20 text-gantly-gold'
                        : `${barBg} ${textMuted}`
                    }`}
                  >
                    {isBooked ? 'Cita' : isInternal ? 'Interna' : `${9 + slot * 2}:00`}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (feature.id === 'chat') {
    return (
      <div className={`rounded-2xl border p-6 ${cardBg} shadow-sm`}>
        <div className="flex items-center gap-2 mb-4">
          <MessageCircle size={16} style={{ color: feature.color }} />
          <span className={`font-heading text-sm font-semibold ${textPrimary}`}>Chat con Maria G.</span>
          <Lock size={12} className="text-gantly-emerald ml-auto" />
        </div>
        <div className="space-y-3">
          <div className="flex justify-start">
            <div className={`max-w-[75%] px-3 py-2 rounded-xl rounded-bl-sm ${isDark ? 'bg-white/10' : 'bg-slate-50'}`}>
              <p className={`text-xs font-body ${isDark ? 'text-white/70' : 'text-slate-600'}`}>He practicado los ejercicios de respiracion que me recomendaste</p>
            </div>
          </div>
          <div className="flex justify-end">
            <div className="max-w-[75%] px-3 py-2 rounded-xl rounded-br-sm bg-gantly-blue text-white">
              <p className="text-xs font-body">Genial Maria, me encanta oir eso. Vamos a hablar de ello en la sesion</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Lock size={10} className="text-gantly-emerald" />
            <span className={`text-[9px] font-body ${textMuted}`}>Cifrado AES-256-GCM</span>
          </div>
        </div>
      </div>
    );
  }

  if (feature.id === 'tests') {
    return (
      <div className={`rounded-2xl border p-6 ${cardBg} shadow-sm`}>
        <div className="flex items-center gap-2 mb-4">
          <Brain size={16} style={{ color: feature.color }} />
          <span className={`font-heading text-sm font-semibold ${textPrimary}`}>Resultado: Test Ansiedad</span>
        </div>
        <div className="space-y-3">
          {[
            { label: 'Ansiedad Estado', value: 72, level: 'Alto' },
            { label: 'Ansiedad Rasgo', value: 45, level: 'Medio' },
            { label: 'Preocupacion', value: 81, level: 'Alto' },
          ].map((item) => (
            <div key={item.label}>
              <div className="flex justify-between items-center mb-1">
                <span className={`text-xs font-body ${textMuted}`}>{item.label}</span>
                <span className={`text-[10px] font-heading font-semibold px-2 py-0.5 rounded-full ${
                  item.level === 'Alto'
                    ? 'bg-red-500/10 text-red-500'
                    : 'bg-gantly-gold/10 text-gantly-gold'
                }`}>
                  {item.level}
                </span>
              </div>
              <div className={`h-2 rounded-full ${barBg} overflow-hidden`}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: item.level === 'Alto' ? '#ef4444' : '#F0C930' }}
                  initial={{ width: 0 }}
                  whileInView={{ width: `${item.value}%` }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3, duration: 0.8 }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (feature.id === 'billing') {
    return (
      <div className={`rounded-2xl border p-6 ${cardBg} shadow-sm`}>
        <div className="flex items-center gap-2 mb-4">
          <Receipt size={16} style={{ color: feature.color }} />
          <span className={`font-heading text-sm font-semibold ${textPrimary}`}>Facturacion - Junio</span>
        </div>
        <div className="space-y-2">
          {[
            { patient: 'Maria G.', date: '04 jun', amount: '50,00', status: 'Pagado' },
            { patient: 'Carlos R.', date: '02 jun', amount: '60,00', status: 'Pagado' },
            { patient: 'Ana L.', date: '01 jun', amount: '50,00', status: 'Pendiente' },
          ].map((row) => (
            <div key={row.patient} className={`flex items-center justify-between py-2 border-b ${isDark ? 'border-white/5' : 'border-slate-50'}`}>
              <div>
                <p className={`text-xs font-heading font-semibold ${textPrimary}`}>{row.patient}</p>
                <p className={`text-[10px] font-body ${textMuted}`}>{row.date}</p>
              </div>
              <div className="text-right">
                <p className={`text-xs font-heading font-bold ${textPrimary}`}>{row.amount}&euro;</p>
                <span className={`text-[9px] font-body px-2 py-0.5 rounded-full ${
                  row.status === 'Pagado'
                    ? 'bg-gantly-emerald/10 text-gantly-emerald'
                    : 'bg-gantly-gold/10 text-gantly-gold'
                }`}>
                  {row.status}
                </span>
              </div>
            </div>
          ))}
        </div>
        <div className={`mt-3 pt-3 border-t ${isDark ? 'border-white/10' : 'border-slate-100'} flex justify-between`}>
          <span className={`text-xs font-body ${textMuted}`}>Total junio</span>
          <span className={`text-sm font-heading font-bold ${textPrimary}`}>160,00&euro;</span>
        </div>
      </div>
    );
  }

  if (feature.id === 'video') {
    return (
      <div className={`rounded-2xl border p-6 ${cardBg} shadow-sm`}>
        <div className="aspect-video rounded-xl bg-gradient-to-br from-gantly-blue/10 to-cyan-500/10 flex flex-col items-center justify-center gap-3 relative overflow-hidden">
          <div className="w-16 h-16 rounded-full bg-gantly-blue/20 flex items-center justify-center">
            <Video size={28} className="text-gantly-blue" />
          </div>
          <span className={`text-xs font-body ${textMuted}`}>Sesion con Maria G. — 50:00</span>
          <div className="absolute bottom-3 right-3 w-16 h-12 rounded-lg bg-gantly-blue/30 flex items-center justify-center">
            <Users size={14} className="text-white/60" />
          </div>
          <div className="absolute top-3 left-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gantly-emerald/20">
            <Lock size={9} className="text-gantly-emerald" />
            <span className="text-[9px] text-gantly-emerald font-body">E2E</span>
          </div>
        </div>
      </div>
    );
  }

  // consent
  return (
    <div className={`rounded-2xl border p-6 ${cardBg} shadow-sm`}>
      <div className="flex items-center gap-2 mb-4">
        <FileCheck size={16} style={{ color: feature.color }} />
        <span className={`font-heading text-sm font-semibold ${textPrimary}`}>Consentimiento informado</span>
      </div>
      <div className={`rounded-xl p-4 ${isDark ? 'bg-white/5' : 'bg-slate-50'} space-y-3`}>
        <div className={`h-2 rounded-full ${barBg} w-3/4`} />
        <div className={`h-2 rounded-full ${barBg} w-full`} />
        <div className={`h-2 rounded-full ${barBg} w-5/6`} />
        <div className={`h-2 rounded-full ${barBg} w-2/3`} />
        <div className="pt-3 flex items-center gap-3">
          <div className={`flex-1 h-10 rounded-lg border-2 border-dashed ${isDark ? 'border-white/20' : 'border-slate-200'} flex items-center justify-center`}>
            <span className="font-caveat text-sm text-gantly-blue italic">Maria Garcia</span>
          </div>
          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gantly-emerald/10">
            <CheckCircle2 size={12} className="text-gantly-emerald" />
            <span className="text-[10px] text-gantly-emerald font-heading font-semibold">Firmado</span>
          </div>
        </div>
      </div>
    </div>
  );
}
