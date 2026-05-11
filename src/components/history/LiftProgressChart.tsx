import type { Cycle, LiftName } from '../../core/types';
import { LIFT_DISPLAY_NAMES } from '../../core/constants';

interface LiftProgressChartProps {
  cycles: Cycle[];
  liftName: LiftName;
}

export function LiftProgressChart({ cycles, liftName }: LiftProgressChartProps) {
  const data = cycles
    .filter(c => c.tmSnapshots[liftName] !== undefined)
    .map((c, i) => ({ index: i, tm: c.tmSnapshots[liftName] }));

  if (data.length === 0) return null;

  const maxTm = Math.max(...data.map(d => d.tm));
  const minTm = Math.min(...data.map(d => d.tm));
  const range = maxTm - minTm || 1;
  const height = 120;
  const width = 300;
  const padding = { top: 10, right: 10, bottom: 20, left: 40 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const points = data.map((d, i) => ({
    x: padding.left + (i / Math.max(1, data.length - 1)) * chartW,
    y: padding.top + chartH - ((d.tm - minTm) / range) * chartH,
  }));

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <div>
      <p className="text-sm font-medium text-[var(--color-text-secondary)] mb-2">{LIFT_DISPLAY_NAMES[liftName]} TM</p>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ maxHeight: height }}>
        {points.length > 1 && (
          <path d={pathD} fill="none" stroke="var(--color-success)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        )}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={3} fill="var(--color-success)" />
        ))}
        <text x={padding.left - 5} y={padding.top + 4} textAnchor="end" fontSize={9} fill="var(--color-text-muted)">{Math.round(maxTm)}</text>
        <text x={padding.left - 5} y={padding.top + chartH + 4} textAnchor="end" fontSize={9} fill="var(--color-text-muted)">{Math.round(minTm)}</text>
      </svg>
    </div>
  );
}
