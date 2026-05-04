import { motion } from 'framer-motion';
import LogoDoubleSvg from '../../assets/logo-gantly-double.svg';

/**
 * Hero visual scene — animated gradient blobs, floating grid, glowing G logo.
 * Replaced Three.js with CSS + Framer Motion for reliability and visual impact.
 */
export default function Hero3DScene() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
      {/* Animated gradient blobs */}
      <motion.div
        className="absolute w-[700px] h-[700px] rounded-full blur-[120px] opacity-20"
        style={{ background: 'radial-gradient(circle, #2E93CC 0%, transparent 70%)' }}
        animate={{
          x: ['-10%', '5%', '-10%'],
          y: ['-5%', '10%', '-5%'],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        initial={{ top: '10%', left: '20%' }}
      />
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full blur-[100px] opacity-15"
        style={{ background: 'radial-gradient(circle, #22D3EE 0%, transparent 70%)' }}
        animate={{
          x: ['5%', '-8%', '5%'],
          y: ['8%', '-5%', '8%'],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        initial={{ top: '30%', right: '10%' }}
      />
      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full blur-[90px] opacity-10"
        style={{ background: 'radial-gradient(circle, #F0C930 0%, transparent 70%)' }}
        animate={{
          x: ['-5%', '10%', '-5%'],
          y: ['5%', '-8%', '5%'],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        initial={{ bottom: '10%', left: '40%' }}
      />

      {/* Subtle dot grid */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Glowing G logo (double G yin-yang) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        {/* Glow behind logo */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(46,147,204,0.25) 0%, rgba(34,211,238,0.08) 40%, transparent 70%)',
          }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0.9, 0.6] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Logo */}
        <motion.img
          src={LogoDoubleSvg}
          alt=""
          className="relative w-40 h-44 lg:w-52 lg:h-56 brightness-0 invert opacity-[0.12]"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.12 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </div>

      {/* Floating particles */}
      {Array.from({ length: 30 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: `${2 + Math.random() * 3}px`,
            height: `${2 + Math.random() * 3}px`,
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            backgroundColor: i % 3 === 0 ? '#F0C930' : i % 3 === 1 ? '#22D3EE' : '#2E93CC',
          }}
          animate={{
            y: [0, -(20 + Math.random() * 40), 0],
            opacity: [0.1, 0.5, 0.1],
          }}
          transition={{
            duration: 4 + Math.random() * 6,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Orbiting rings */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <motion.div
          className="w-[350px] h-[350px] lg:w-[450px] lg:h-[450px] rounded-full border border-gantly-cyan/[0.06]"
          animate={{ rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-gantly-cyan/30" />
        </motion.div>
      </div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <motion.div
          className="w-[250px] h-[250px] lg:w-[320px] lg:h-[320px] rounded-full border border-gantly-gold/[0.05]"
          animate={{ rotate: -360 }}
          transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
        >
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-1.5 h-1.5 rounded-full bg-gantly-gold/30" />
        </motion.div>
      </div>
    </div>
  );
}
