import type { AMRAPRecord } from '../../core/types';

interface AMRAPChartProps {
  records: AMRAPRecord[];
  title: string;
}

export function AMRAPChart({ records, title }: AMRAPChartProps) {
  if (records.length === 0) return null;

  const maxE1rm = Math.max(...records.map(r => r.e1rm));
  const height = 160;
  const width = 300;
  const padding = { top: 10, right: 10, bottom: 25, left: 40 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const points = records.map((r, i) => ({
    x: padding.left + (i / Math.max(1, records.length - 1)) * chartW,
    y: padding.top + chartH - (r.e1rm / maxE1rm) * chartH,
    record: r,
  }));

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <div>
      <p className="text-sm font-medium text-[var(--color-text-secondary)] mb-2">{title}</p>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ maxHeight: height }}>
        <line x1={padding.left} y1={padding.top} x2={padding.left} y2={padding.top + chartH} stroke="var(--color-border)" strokeWidth={1} />
        <line x1={padding.left} y1={padding.top + chartH} x2={padding.left + chartW} y2={padding.top + chartH} stroke="var(--color-border)" strokeWidth={1} />

        <text x={padding.left - 5} y={padding.top + 4} textAnchor="end" fontSize={9} fill="var(--color-text-muted)">
          {Math.round(maxE1rm)}
        </text>
        <text x={padding.left - 5} y={padding.top + chartH + 4} textAnchor="end" fontSize={9} fill="var(--color-text-muted)">
          0
        </text>

        {points.length > 1 && (
          <path d={pathD} fill="none" stroke="var(--color-primary)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        )}

        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={3} fill="var(--color-primary)" />
        ))}
      </svg>
    </div>
  );
}
