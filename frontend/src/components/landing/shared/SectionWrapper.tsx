import { type ReactNode } from 'react';

interface SectionWrapperProps {
  children: ReactNode;
  id?: string;
  className?: string;
  dark?: boolean;
  fullWidth?: boolean;
}

export default function SectionWrapper({
  children, id, className = '', dark = false, fullWidth = false,
}: SectionWrapperProps) {
  const bg = dark ? 'bg-gantly-navy text-white' : 'bg-gantly-cloud text-gantly-text';
  return (
    <section id={id} className={`relative py-28 lg:py-36 overflow-hidden ${bg} ${className}`}>
      <div className={fullWidth ? 'w-full' : 'mx-auto max-w-7xl px-6 lg:px-8'}>
        {children}
      </div>
    </section>
  );
}
