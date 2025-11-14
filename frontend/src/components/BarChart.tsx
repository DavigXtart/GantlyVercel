type BarDatum = {
  label: string;
  value: number;
  color?: string;
};

interface BarChartProps {
  data: BarDatum[];
  maxValue?: number;
  showValues?: boolean;
  formatValue?: (value: number) => string;
  barHeight?: number;
  gap?: number;
}

const DEFAULT_COLORS = [
  '#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#a855f7', '#84cc16', '#e11d48', '#f43f5e', '#14b8a6'
];

export default function BarChart({
  data,
  maxValue,
  showValues = true,
  formatValue = (v) => `${Math.round(v)}%`,
  barHeight = 24,
  gap = 12,
}: BarChartProps) {
  if (!data || data.length === 0) {
    return <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Sin datos disponibles</div>;
  }

  const safeData = data.map((d) => ({
    ...d,
    value: Number.isFinite(d.value) ? Math.max(0, d.value) : 0,
  }));

  const computedMax = maxValue && maxValue > 0 ? maxValue : Math.max(...safeData.map((d) => d.value), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap }}>
      {safeData.map((datum, idx) => {
        const widthPercent = Math.min(100, (datum.value / computedMax) * 100);
        const color = datum.color || DEFAULT_COLORS[idx % DEFAULT_COLORS.length];

        return (
          <div key={datum.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 120, fontSize: 14, color: 'var(--text-secondary)' }}>{datum.label}</div>
            <div style={{ flex: 1, background: 'var(--bg-secondary, #f3f4f6)', borderRadius: 9999, height: barHeight, position: 'relative' }}>
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  height: '100%',
                  width: `${widthPercent}%`,
                  background: color,
                  borderRadius: 9999,
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
            {showValues && (
              <div style={{ minWidth: 48, textAlign: 'right', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                {formatValue(datum.value)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}


