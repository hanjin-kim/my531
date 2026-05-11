import { useState } from 'react';
import { Header } from '../components/layout/Header';
import { AMRAPChart } from '../components/history/AMRAPChart';
import { LiftProgressChart } from '../components/history/LiftProgressChart';
import { CycleHistoryList } from '../components/history/CycleHistoryList';
import { EmptyState } from '../components/ui/EmptyState';
import { useAMRAPHistory, useCycleHistory } from '../hooks/useHistory';
import { useSettings } from '../hooks/useSettings';
import { LIFT_NAMES, LIFT_DISPLAY_NAMES } from '../core/constants';
import type { LiftName } from '../core/types';
import { TrendingUp } from 'lucide-react';

export default function HistoryPage() {
  const [selectedLift, setSelectedLift] = useState<LiftName>('squat');
  const amrapRecords = useAMRAPHistory(selectedLift);
  const cycles = useCycleHistory();
  const { settings } = useSettings();

  if (cycles.length === 0) {
    return (
      <div className="px-4">
        <Header title="History" />
        <EmptyState
          icon={<TrendingUp size={48} />}
          title="No History Yet"
          description="Complete some workouts to see your progress."
        />
      </div>
    );
  }

  return (
    <div className="px-4 py-2 flex flex-col gap-5">
      <Header title="History" />

      <div className="flex gap-2 overflow-x-auto pb-1">
        {LIFT_NAMES.map(name => (
          <button
            key={name}
            onClick={() => setSelectedLift(name)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              selectedLift === name
                ? 'bg-[var(--color-primary)] text-white'
                : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)]'
            }`}
          >
            {LIFT_DISPLAY_NAMES[name]}
          </button>
        ))}
      </div>

      <div className="bg-[var(--color-surface)] rounded-2xl p-4">
        <AMRAPChart
          records={amrapRecords}
          title={`${LIFT_DISPLAY_NAMES[selectedLift]} - Estimated 1RM`}
        />
      </div>

      <div className="bg-[var(--color-surface)] rounded-2xl p-4">
        <LiftProgressChart cycles={cycles} liftName={selectedLift} />
      </div>

      <CycleHistoryList cycles={cycles} unit={settings?.unit ?? 'kg'} />
    </div>
  );
}
