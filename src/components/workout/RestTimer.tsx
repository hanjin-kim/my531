import { useEffect, useState } from 'react';
import { useWorkoutStore } from '../../stores/workout.store';

export function RestTimer() {
  const { restTimerEnd, clearRestTimer } = useWorkoutStore();
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!restTimerEnd) return;
    const tick = () => {
      const left = Math.max(0, Math.ceil((restTimerEnd - Date.now()) / 1000));
      setRemaining(left);
      if (left <= 0) clearRestTimer();
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [restTimerEnd, clearRestTimer]);

  if (!restTimerEnd || remaining <= 0) return null;

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  return (
    <div className="fixed top-4 right-4 bg-[var(--color-surface-elevated)] rounded-2xl px-4 py-2 shadow-lg z-50">
      <p className="text-xs text-[var(--color-text-muted)]">Rest</p>
      <p className="text-xl font-bold tabular-nums">
        {minutes}:{seconds.toString().padStart(2, '0')}
      </p>
      <button onClick={clearRestTimer} className="text-xs text-[var(--color-primary)] mt-0.5">Skip</button>
    </div>
  );
}
