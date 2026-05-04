import { motion } from 'framer-motion';

/**
 * Hero visual — product mockup showing the actual platform.
 * NOT generic blobs/particles. Shows what Gantly does.
 */

function DashboardMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, rotateY: -8 }}
      animate={{ opacity: 1, y: 0, rotateY: -4 }}
      transition={{ duration: 1, delay: 0.8, ease: 'easeOut' }}
      className="relative"
      style={{ perspective: '1200px' }}
    >
      {/* Main browser window */}
      <div
        className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-gantly-blue/10"
        style={{ transform: 'rotateY(-4deg) rotateX(2deg)' }}
      >
        {/* Browser chrome */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-[#0F1A2E] border-b border-white/5">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#28ca42]" />
          </div>
          <div className="flex-1 flex justify-center">
            <div className="bg-white/5 rounded-md px-12 py-1">
              <span className="text-[10px] text-white/30 font-body">app.gantly.com</span>
            </div>
          </div>
        </div>

        {/* Dashboard content */}
        <div className="bg-[#0B1222] p-4 lg:p-5">
          {/* Top nav inside mockup */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-gantly-blue/20 flex items-center justify-center">
                <span className="text-[10px] font-bold text-gantly-blue">G</span>
              </div>
              <div className="flex gap-4">
                {['Dashboard', 'Pacientes', 'Agenda', 'Tests'].map((tab, i) => (
                  <span key={tab} className={`text-[10px] font-body ${i === 0 ? 'text-white' : 'text-white/30'}`}>{tab}</span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-gantly-emerald/20 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-gantly-emerald" />
              </div>
              <div className="w-6 h-6 rounded-full bg-gantly-blue/30" />
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-4 gap-2.5 mb-4">
            {[
              { label: 'Pacientes activos', value: '47', color: '#2E93CC', change: '+12%' },
              { label: 'Sesiones / mes', value: '128', color: '#22D3EE', change: '+8%' },
              { label: 'Satisfacción', value: '98%', color: '#059669', change: '+2%' },
              { label: 'Tests realizados', value: '312', color: '#F0C930', change: '+23%' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/[0.03] rounded-lg p-2.5 border border-white/5">
                <div className="text-[9px] text-white/30 font-body mb-1">{stat.label}</div>
                <div className="flex items-end justify-between">
                  <span className="text-lg font-heading font-bold" style={{ color: stat.color }}>{stat.value}</span>
                  <span className="text-[8px] text-gantly-emerald font-medium">{stat.change}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Main content area */}
          <div className="grid grid-cols-5 gap-2.5">
            {/* Left: Upcoming sessions */}
            <div className="col-span-3 bg-white/[0.03] rounded-lg p-3 border border-white/5">
              <div className="text-[10px] font-heading font-semibold text-white mb-2.5">Próximas sesiones</div>
              {[
                { name: 'María G.', time: 'Hoy, 16:00', type: 'Videollamada', color: '#2E93CC' },
                { name: 'Carlos R.', time: 'Hoy, 17:30', type: 'Presencial', color: '#059669' },
                { name: 'Ana P.', time: 'Mañana, 10:00', type: 'Videollamada', color: '#2E93CC' },
              ].map((session) => (
                <div key={session.name} className="flex items-center gap-2 py-1.5 border-b border-white/5 last:border-0">
                  <div className="w-5 h-5 rounded-full bg-gantly-blue/20 flex items-center justify-center">
                    <span className="text-[8px] font-bold text-gantly-blue">{session.name[0]}</span>
                  </div>
                  <div className="flex-1">
                    <div className="text-[9px] text-white/80 font-medium">{session.name}</div>
                    <div className="text-[8px] text-white/30">{session.time}</div>
                  </div>
                  <span
                    className="text-[7px] px-1.5 py-0.5 rounded font-medium"
                    style={{ backgroundColor: session.color + '1A', color: session.color }}
                  >
                    {session.type}
                  </span>
                </div>
              ))}
            </div>

            {/* Right: Mini personality chart */}
            <div className="col-span-2 bg-white/[0.03] rounded-lg p-3 border border-white/5">
              <div className="text-[10px] font-heading font-semibold text-white mb-2">Perfil 16PF</div>
              {[
                { label: 'Apertura', value: 82 },
                { label: 'Ansiedad', value: 35 },
                { label: 'Autonomía', value: 71 },
                { label: 'Autocontrol', value: 68 },
                { label: 'Social', value: 88 },
              ].map((trait) => (
                <div key={trait.label} className="flex items-center gap-2 mb-1.5 last:mb-0">
                  <span className="text-[8px] text-white/40 w-14 text-right font-body">{trait.label}</span>
                  <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gantly-blue"
                      initial={{ width: 0 }}
                      animate={{ width: `${trait.value}%` }}
                      transition={{ duration: 1.2, delay: 1.5 + Math.random() * 0.5, ease: 'easeOut' }}
                    />
                  </div>
                  <span className="text-[8px] text-white/50 font-heading font-bold w-5">{trait.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating notification card */}
      <motion.div
        initial={{ opacity: 0, x: 40, y: 20 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ duration: 0.6, delay: 2 }}
        className="absolute -right-6 top-1/4 bg-[#0F1A2E] border border-white/10 rounded-xl p-3 shadow-xl shadow-black/30 w-52"
      >
        <div className="flex items-start gap-2">
          <div className="w-7 h-7 rounded-lg bg-gantly-emerald/20 flex items-center justify-center flex-shrink-0">
            <span className="text-[10px]" role="img" aria-label="check">&#10003;</span>
          </div>
          <div>
            <div className="text-[10px] font-heading font-semibold text-white">Nuevo match</div>
            <div className="text-[8px] text-white/40 mt-0.5">María G. → Dr. López — 94% compatibilidad</div>
          </div>
        </div>
      </motion.div>

      {/* Floating chat bubble */}
      <motion.div
        initial={{ opacity: 0, x: -30, y: -10 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ duration: 0.6, delay: 2.4 }}
        className="absolute -left-4 bottom-1/4 bg-[#0F1A2E] border border-white/10 rounded-xl p-3 shadow-xl shadow-black/30 w-48"
      >
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-5 h-5 rounded-full bg-gantly-blue/30 flex items-center justify-center">
            <span className="text-[8px] font-bold text-gantly-blue">Dr</span>
          </div>
          <span className="text-[9px] font-medium text-white/80">Dr. García</span>
          <div className="ml-auto w-1.5 h-1.5 rounded-full bg-gantly-emerald" />
        </div>
        <div className="bg-white/5 rounded-lg p-1.5">
          <span className="text-[8px] text-white/50">¿Cómo te has sentido esta semana?</span>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function Hero3DScene() {
  return (
    <div className="hidden lg:flex items-center justify-center w-full max-w-[580px]">
      <DashboardMockup />
    </div>
  );
}
