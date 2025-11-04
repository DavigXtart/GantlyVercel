import React from 'react';

type PieDatum = {
  label: string;
  value: number; // 0-100 expected for percentages, but can be any positive number
  color?: string;
};

interface PieChartProps {
  data: PieDatum[];
  size?: number; // px
  thickness?: number; // for donut thickness
  showCenterLabel?: boolean;
  centerLabel?: string;
}

// Simple SVG pie/donut chart
export default function PieChart({ data, size = 180, thickness = 22, showCenterLabel = true, centerLabel }: PieChartProps) {
  const total = Math.max(data.reduce((sum, d) => sum + (isFinite(d.value) ? Math.max(d.value, 0) : 0), 0), 0.0001);
  const radius = size / 2;
  const innerRadius = Math.max(radius - thickness, 0);

  let cumulative = 0;

  const defaultPalette = [
    '#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#a855f7', '#84cc16', '#e11d48', '#f43f5e', '#14b8a6'
  ];

  const arcs = data.map((d, idx) => {
    const value = isFinite(d.value) ? Math.max(d.value, 0) : 0;
    const startAngle = (cumulative / total) * 2 * Math.PI;
    cumulative += value;
    const endAngle = (cumulative / total) * 2 * Math.PI;

    const largeArcFlag = endAngle - startAngle > Math.PI ? 1 : 0;
    const sx = radius + radius * Math.cos(startAngle);
    const sy = radius + radius * Math.sin(startAngle);
    const ex = radius + radius * Math.cos(endAngle);
    const ey = radius + radius * Math.sin(endAngle);

    const pathOuter = `M ${sx} ${sy} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${ex} ${ey}`;

    const six = radius + innerRadius * Math.cos(endAngle);
    const siy = radius + innerRadius * Math.sin(endAngle);
    const eix = radius + innerRadius * Math.cos(startAngle);
    const eiy = radius + innerRadius * Math.sin(startAngle);
    const pathInner = `L ${six} ${siy} A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${eix} ${eiy} Z`;

    const path = `${pathOuter} ${pathInner}`;
    const fill = d.color || defaultPalette[idx % defaultPalette.length];

    return <path key={idx} d={path} fill={fill} stroke="none" />;
  });

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={radius} cy={radius} r={radius} fill="#f3f4f6" />
        <circle cx={radius} cy={radius} r={innerRadius} fill="white" />
        {arcs}
      </svg>
      {showCenterLabel && (
        <div style={{ position: 'absolute', textAlign: 'center', fontSize: 14, color: 'var(--text-secondary)' }}>
          {centerLabel || ''}
        </div>
      )}
    </div>
  );
}


