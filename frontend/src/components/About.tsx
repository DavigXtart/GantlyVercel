import { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  Menu, X, ArrowDown,
  Shield, Heart, Eye, Zap,
  Lock, GraduationCap, Target,
} from 'lucide-react';
import LogoSvg from '../assets/logo-gantly.svg';
import Footer from './landing/Footer';
import SEO, { breadcrumbSchema } from './seo/SEO';

interface AboutProps {
  onBack: () => void;
  onLogin: () => void;
  onGetStarted: () => void;
}

/* ─── Values ─── */
const values = [
  { icon: Heart, accent: '#2E93CC', title: 'Bienestar ante todo', body: 'Cada decision que tomamos parte de una pregunta: mejora esto la vida de nuestros usuarios? Si la respuesta no es un si rotundo, no lo hacemos.' },
  { icon: Shield, accent: '#059669', title: 'Seguridad sin compromisos', body: 'Encriptacion de extremo a extremo, protocolos GDPR y auditorias constantes. Tus datos y los de tus pacientes estan protegidos.' },
  { icon: Eye, accent: '#7C3AED', title: 'Transparencia radical', body: 'Sin letra pequena, sin costes ocultos, sin sorpresas. Creemos que la confianza se construye con claridad.' },
  { icon: Zap, accent: '#F0C930', title: 'Tecnologia con alma', body: 'La IA y la automatizacion estan al servicio de la conexion humana, nunca al reves. La tecnologia facilita, el terapeuta cura.' },
];

/* ─── Pillars ─── */
const pillars = [
  { number: '01', icon: GraduationCap, accent: '#2E93CC', title: 'Rigor clinico', body: 'Tests validados, baterias estandarizadas y metodologias basadas en evidencia. Todos los profesionales verificados, colegiados y habilitados.' },
  { number: '02', icon: Target, accent: '#F0C930', title: 'Resultados medibles', body: 'Cada proceso tiene objetivos claros, metricas de seguimiento y evaluacion continua. Porque lo que no se mide, no se mejora.' },
  { number: '03', icon: Lock, accent: '#059669', title: 'Confidencialidad total', body: 'Chat encriptado con AES-256-GCM, videollamadas privadas con Jitsi, y un equipo que entiende que la discrecion no es negociable.' },
];

export default function About({ onBack, onLogin, onGetStarted }: AboutProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { scrollYProgress } = useScroll();
  const progressWidth = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="overflow-x-hidden bg-white min-h-screen">
      <SEO
        title="Sobre nosotros"
        description="Conoce Gantly: la plataforma de salud mental que conecta pacientes con psicólogos verificados. Nuestra misión, valores y compromiso con tu bienestar."
        path="/about"
        jsonLd={breadcrumbSchema([
          { name: 'Inicio', url: 'https://gantly.es/' },
          { name: 'Sobre nosotros', url: 'https://gantly.es/about' },
        ])}
      />
      {/* ─── Progress bar ─── */}
      <motion.div
        className="fixed top-0 left-0 h-[3px] bg-gantly-blue z-[60]"
        style={{ width: progressWidth }}
      />

      {/* ─── Navbar ─── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white/95 shadow-sm border-b border-slate-100'
            : 'bg-transparent'
        }`}
        style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <img
            src={LogoSvg}
            alt="Gantly"
            className="h-7 cursor-pointer"
            onClick={onBack}
          />

          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={onLogin}
              className="text-sm font-body text-slate-500 hover:text-gantly-blue transition-colors cursor-pointer"
            >
              Iniciar sesion
            </button>
            <button
              onClick={onGetStarted}
              className="text-sm font-heading font-semibold text-white bg-gantly-blue hover:bg-gantly-blue/90 px-5 py-2 rounded-lg cursor-pointer transition-colors"
            >
              Empezar
            </button>
          </div>

          <button
            className="md:hidden text-slate-600 cursor-pointer p-1"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-slate-100 px-6 py-4 bg-white flex flex-col gap-3">
            <button
              onClick={() => { onLogin(); setMobileOpen(false); }}
              className="text-sm font-body text-slate-600 text-left cursor-pointer py-2"
            >
              Iniciar sesion
            </button>
            <button
              onClick={() => { onGetStarted(); setMobileOpen(false); }}
              className="text-sm font-heading font-semibold text-white bg-gantly-blue px-5 py-2.5 rounded-lg cursor-pointer text-center"
            >
              Empezar
            </button>
          </div>
        )}
      </nav>

      {/* ─── Hero — Editorial, typography-driven ─── */}
      <section className="relative min-h-[90vh] flex flex-col justify-center px-6 pt-24 pb-16">
        <div className="max-w-4xl mx-auto w-full">
          {/* Accent line */}
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: 80 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="h-1 bg-gantly-blue rounded-full mb-10"
          />

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="font-body text-sm font-semibold text-gantly-blue tracking-widest uppercase mb-6"
          >
            Sobre Gantly
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="font-heading text-4xl sm:text-5xl lg:text-7xl font-bold text-slate-900 leading-[1.08] mb-8 max-w-3xl"
          >
            Creemos que cuidar la mente no deberia ser complicado.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="font-body text-lg lg:text-xl text-slate-500 leading-relaxed max-w-2xl mb-12"
          >
            Gantly nace de una idea simple: que la tecnologia puede hacer la psicologia mas accesible, mas segura y mas humana. No somos una app de bienestar. Somos una plataforma clinica construida con y para profesionales de la salud mental.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="flex items-center gap-2 text-slate-400 cursor-pointer hover:text-gantly-blue transition-colors"
            onClick={() => document.getElementById('mision')?.scrollIntoView({ behavior: 'smooth' })}
          >
            <span className="text-sm font-body">Descubre mas</span>
            <ArrowDown size={16} />
          </motion.div>
        </div>

        {/* Decorative dots */}
        <div className="absolute top-32 right-12 lg:right-24 hidden lg:grid grid-cols-4 gap-3 opacity-[0.08]">
          {Array.from({ length: 16 }).map((_, i) => (
            <div key={i} className="w-2 h-2 rounded-full bg-gantly-blue" />
          ))}
        </div>
      </section>

      {/* ─── Mission statement — large quote ─── */}
      <section id="mision" className="bg-slate-50 py-24 lg:py-32 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.7 }}
          >
            <div className="font-heading text-6xl lg:text-8xl text-gantly-blue/15 leading-none mb-4 select-none">"</div>
            <blockquote className="font-heading text-2xl sm:text-3xl lg:text-4xl font-semibold text-slate-800 leading-snug mb-8 -mt-8">
              Nuestra mision es democratizar el acceso a la salud mental de calidad, conectando a personas con profesionales verificados a traves de herramientas seguras y basadas en evidencia.
            </blockquote>
            <div className="flex items-center gap-3">
              <div className="w-10 h-[2px] bg-gantly-blue rounded-full" />
              <span className="font-body text-sm text-slate-500">Fundacion Gantly</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Values — left-border accent cards ─── */}
      <section className="py-24 lg:py-32 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
            className="mb-16"
          >
            <p className="font-body text-sm font-semibold text-gantly-blue tracking-widest uppercase mb-4">
              Nuestros valores
            </p>
            <h2 className="font-heading text-3xl lg:text-5xl font-bold text-slate-900">
              En que creemos
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {values.map((v, i) => {
              const Icon = v.icon;
              return (
                <motion.div
                  key={v.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="relative bg-white rounded-xl p-6 lg:p-8 border border-slate-100 hover:border-slate-200 hover:shadow-md transition-all duration-300 cursor-pointer group"
                >
                  <div
                    className="absolute left-0 top-6 bottom-6 w-1 rounded-full transition-all duration-300 group-hover:top-4 group-hover:bottom-4"
                    style={{ backgroundColor: v.accent }}
                  />
                  <div className="pl-4">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                      style={{ backgroundColor: v.accent + '12' }}
                    >
                      <Icon size={20} style={{ color: v.accent }} />
                    </div>
                    <h3 className="font-heading text-lg font-semibold text-slate-900 mb-2">
                      {v.title}
                    </h3>
                    <p className="font-body text-sm text-slate-500 leading-relaxed">
                      {v.body}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Pillars — numbered, editorial ─── */}
      <section className="bg-slate-50 py-24 lg:py-32 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
            className="mb-16"
          >
            <p className="font-body text-sm font-semibold text-gantly-blue tracking-widest uppercase mb-4">
              Como trabajamos
            </p>
            <h2 className="font-heading text-3xl lg:text-5xl font-bold text-slate-900">
              Tres pilares, un objetivo
            </h2>
          </motion.div>

          <div className="flex flex-col gap-8">
            {pillars.map((p, i) => {
              const Icon = p.icon;
              return (
                <motion.div
                  key={p.number}
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.5, delay: i * 0.15 }}
                  className="flex gap-6 lg:gap-10 items-start group"
                >
                  <div className="flex-shrink-0 text-center">
                    <span
                      className="font-heading text-4xl lg:text-5xl font-bold block leading-none transition-colors duration-300"
                      style={{ color: p.accent + '30' }}
                    >
                      {p.number}
                    </span>
                  </div>
                  <div className="flex-1 bg-white rounded-xl p-6 lg:p-8 border border-slate-100 hover:shadow-md transition-all duration-300 cursor-pointer">
                    <div className="flex items-center gap-3 mb-3">
                      <Icon size={20} style={{ color: p.accent }} />
                      <h3 className="font-heading text-lg font-semibold text-slate-900">
                        {p.title}
                      </h3>
                    </div>
                    <p className="font-body text-sm text-slate-500 leading-relaxed">
                      {p.body}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── CTA — clean, editorial ─── */}
      <section className="py-24 lg:py-32 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-heading text-3xl lg:text-5xl font-bold text-slate-900 mb-5">
              Tu bienestar empieza con un paso
            </h2>
            <p className="font-body text-lg text-slate-500 leading-relaxed mb-10">
              Tanto si buscas apoyo profesional como si quieres ofrecer tus servicios como terapeuta, Gantly es tu espacio seguro.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={onGetStarted}
                className="px-8 py-3.5 rounded-lg bg-gantly-blue text-white font-heading font-semibold text-base hover:bg-gantly-blue/90 transition-colors cursor-pointer shadow-sm shadow-gantly-blue/20 min-w-[200px]"
              >
                Comenzar ahora
              </button>
              <button
                onClick={onBack}
                className="px-8 py-3.5 rounded-lg border border-slate-200 text-slate-600 font-heading font-semibold text-base hover:border-slate-300 hover:bg-slate-50 transition-all cursor-pointer min-w-[200px]"
              >
                Volver a inicio
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
