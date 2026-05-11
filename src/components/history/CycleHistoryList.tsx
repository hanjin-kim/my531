import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import type { Cycle } from '../../core/types';
import { LIFT_NAMES, LIFT_DISPLAY_NAMES } from '../../core/constants';

interface CycleHistoryListProps {
  cycles: Cycle[];
  unit: string;
}

export function CycleHistoryList({ cycles, unit }: CycleHistoryListProps) {
  if (cycles.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">Cycle History</p>
      {[...cycles].reverse().map(cycle => (
        <Card key={cycle.id}>
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">Cycle {cycle.cycleIndex + 1}</span>
            <div className="flex gap-1.5">
              <Badge variant={cycle.cycleType === 'leader' ? 'info' : 'warning'}>
                {cycle.cycleType}
              </Badge>
              <Badge variant={cycle.status === 'completed' ? 'success' : 'default'}>
                {cycle.status}
              </Badge>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {LIFT_NAMES.map(name => (
              <div key={name} className="flex justify-between text-sm">
                <span className="text-[var(--color-text-secondary)]">{LIFT_DISPLAY_NAMES[name].slice(0, 5)}</span>
                <span className="tabular-nums">{Math.round(cycle.tmSnapshots[name])} {unit}</span>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
