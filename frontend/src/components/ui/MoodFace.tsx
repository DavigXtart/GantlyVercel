/**
 * Custom SVG mood face icons replacing emoji-based mood indicators.
 * 5 faces: Muy triste (1) → Muy feliz (5) with distinct gradient colors.
 */

interface MoodFaceProps {
  /** Mood value 1-5 */
  value: number;
  /** Size in pixels (default 48) */
  size?: number;
  className?: string;
}

/* ── Face SVG renderers ─────────────────────────────────────────── */

function SadFace({ size, id }: { size: number; id: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop stopColor="#376AA3" />
          <stop offset="1" stopColor="#7794B4" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill={`url(#${id}-g)`} />
      {/* Eyes */}
      <ellipse cx="36" cy="40" rx="5" ry="5.5" fill="white" opacity="0.95" />
      <ellipse cx="64" cy="40" rx="5" ry="5.5" fill="white" opacity="0.95" />
      {/* Pupils */}
      <circle cx="36" cy="42" r="2.5" fill="#1e3a5f" />
      <circle cx="64" cy="42" r="2.5" fill="#1e3a5f" />
      {/* Eyebrows - sad slant */}
      <line x1="28" y1="30" x2="40" y2="32" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
      <line x1="72" y1="30" x2="60" y2="32" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
      {/* Sad mouth */}
      <path d="M 33 68 Q 50 58, 67 68" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.9" />
    </svg>
  );
}

function DownFace({ size, id }: { size: number; id: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop stopColor="#873131" />
          <stop offset="1" stopColor="#CF4747" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill={`url(#${id}-g)`} />
      {/* Eyes */}
      <ellipse cx="36" cy="40" rx="5" ry="5" fill="white" opacity="0.95" />
      <ellipse cx="64" cy="40" rx="5" ry="5" fill="white" opacity="0.95" />
      {/* Pupils */}
      <circle cx="36" cy="41" r="2.5" fill="#4a1515" />
      <circle cx="64" cy="41" r="2.5" fill="#4a1515" />
      {/* Furrowed brows */}
      <line x1="27" y1="32" x2="42" y2="30" stroke="white" strokeWidth="2.8" strokeLinecap="round" opacity="0.75" />
      <line x1="73" y1="32" x2="58" y2="30" stroke="white" strokeWidth="2.8" strokeLinecap="round" opacity="0.75" />
      {/* Slight frown */}
      <path d="M 35 66 Q 50 60, 65 66" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.9" />
    </svg>
  );
}

function NeutralFace({ size, id }: { size: number; id: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop stopColor="#5F3A76" />
          <stop offset="1" stopColor="#9D77B4" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill={`url(#${id}-g)`} />
      {/* Eyes */}
      <circle cx="36" cy="40" r="5" fill="white" opacity="0.95" />
      <circle cx="64" cy="40" r="5" fill="white" opacity="0.95" />
      {/* Pupils */}
      <circle cx="36" cy="41" r="2.5" fill="#2d1a3a" />
      <circle cx="64" cy="41" r="2.5" fill="#2d1a3a" />
      {/* O-shaped mouth */}
      <ellipse cx="50" cy="65" rx="7" ry="8" fill="white" opacity="0.9" />
    </svg>
  );
}

function HappyFace({ size, id }: { size: number; id: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop stopColor="#57794F" />
          <stop offset="1" stopColor="#83B477" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill={`url(#${id}-g)`} />
      {/* Eyes */}
      <circle cx="36" cy="40" r="5" fill="white" opacity="0.95" />
      <circle cx="64" cy="40" r="5" fill="white" opacity="0.95" />
      {/* Pupils */}
      <circle cx="36" cy="40" r="2.5" fill="#2a3f25" />
      <circle cx="64" cy="40" r="2.5" fill="#2a3f25" />
      {/* Smile */}
      <path d="M 33 60 Q 50 75, 67 60" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.9" />
    </svg>
  );
}

function JoyFace({ size, id }: { size: number; id: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop stopColor="#973F5E" />
          <stop offset="1" stopColor="#F194B4" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill={`url(#${id}-g)`} />
      {/* Squinting happy eyes */}
      <path d="M 28 40 Q 36 34, 44 40" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.95" />
      <path d="M 56 40 Q 64 34, 72 40" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.95" />
      {/* Wide smile with open mouth */}
      <path d="M 30 58 Q 50 80, 70 58" stroke="white" strokeWidth="3" fill="white" opacity="0.9" strokeLinecap="round" />
    </svg>
  );
}

/* ── Exported component ─────────────────────────────────────────── */

let moodFaceCounter = 0;

export default function MoodFace({ value, size = 48, className }: MoodFaceProps) {
  const id = `mf-${value}-${++moodFaceCounter}`;
  const clampedValue = Math.max(1, Math.min(5, Math.round(value)));
  const s = size;

  const faces: Record<number, JSX.Element> = {
    1: <SadFace size={s} id={id} />,
    2: <DownFace size={s} id={id} />,
    3: <NeutralFace size={s} id={id} />,
    4: <HappyFace size={s} id={id} />,
    5: <JoyFace size={s} id={id} />,
  };

  return (
    <span className={`inline-flex items-center justify-center ${className || ''}`} role="img" aria-label={moodLabels[clampedValue]}>
      {faces[clampedValue]}
    </span>
  );
}

const moodLabels: Record<number, string> = {
  1: 'Muy triste',
  2: 'Triste',
  3: 'Neutral',
  4: 'Feliz',
  5: 'Muy feliz',
};

/** Color associated with each mood value (matches gradient start) */
export const moodColors: Record<number, string> = {
  1: '#376AA3',
  2: '#873131',
  3: '#5F3A76',
  4: '#57794F',
  5: '#973F5E',
};
