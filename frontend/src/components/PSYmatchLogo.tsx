import psymatchLogo from '../assets/psymatch-removebg-preview.png';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export default function PSYmatchLogo({ size = 'medium', className }: LogoProps) {
  const sizes = {
    small: { width: 120 },
    medium: { width: 200 },
    large: { width: 300 },
  };

  const { width } = sizes[size];

  return (
    <img
      src={psymatchLogo}
      alt="PSYmatch"
      className={className}
      style={{
        display: 'block',
        width: `${width}px`,
        height: 'auto',
        objectFit: 'contain',
      }}
    />
  );
}

