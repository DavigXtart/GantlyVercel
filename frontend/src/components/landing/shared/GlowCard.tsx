import { type ReactNode, useState } from 'react';

interface GlowCardProps {
  children: ReactNode;
  className?: string;
  glowColor?: string;
}

export default function GlowCard({ children, className = '', glowColor = '#22D3EE' }: GlowCardProps) {
  const [hovering, setHovering] = useState(false);

  return (
    <div
      className={`relative rounded-2xl p-px cursor-pointer transition-shadow duration-300 ${className}`}
      style={{
        boxShadow: hovering ? `0 0 30px ${glowColor}33, 0 0 60px ${glowColor}1A` : 'none',
      }}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <div
        className="absolute inset-0 rounded-2xl transition-opacity duration-300"
        style={{
          background: `linear-gradient(135deg, ${glowColor}44, transparent, ${glowColor}22)`,
          opacity: hovering ? 1 : 0,
        }}
      />
      <div className="relative rounded-2xl bg-gantly-navy/80 backdrop-blur-sm p-6 lg:p-8 h-full border border-white/5">
        {children}
      </div>
    </div>
  );
}
