import { motion, type Variants } from 'framer-motion';
import { type ReactNode } from 'react';

interface ScrollRevealProps {
  children: ReactNode;
  direction?: 'up' | 'down' | 'left' | 'right';
  delay?: number;
  duration?: number;
  className?: string;
  once?: boolean;
}

const offsets = { up: [40, 0], down: [-40, 0], left: [0, 40], right: [0, -40] } as const;

export default function ScrollReveal({
  children, direction = 'up', delay = 0, duration = 0.6, className = '', once = true,
}: ScrollRevealProps) {
  const [y, x] = offsets[direction];
  const variants: Variants = {
    hidden: { opacity: 0, y, x },
    visible: { opacity: 1, y: 0, x: 0, transition: { duration, delay, ease: 'easeOut' } },
  };

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: '-80px' }}
      variants={variants}
      className={className}
    >
      {children}
    </motion.div>
  );
}
