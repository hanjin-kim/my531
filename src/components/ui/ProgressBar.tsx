interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  className?: string;
}

export function ProgressBar({ value, max = 100, label, className = '' }: ProgressBarProps) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className={className}>
      {label && (
        <div className="flex justify-between text-sm mb-1.5">
          <span className="text-[var(--color-text-secondary)]">{label}</span>
          <span className="text-[var(--color-text-muted)] tabular-nums">{Math.round(percent)}%</span>
        </div>
      )}
      <div className="h-2 rounded-full bg-[var(--color-surface-elevated)] overflow-hidden">
        <div
          className="h-full rounded-full bg-[var(--color-primary)] transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
