import { SetRow } from './SetRow';
import type { WorkoutSet } from '../../core/types';

interface SetListProps {
  sets: WorkoutSet[];
  unit: string;
  prBaselineE1RM?: number;
  onCompleteSet: (set: WorkoutSet, actualReps?: number) => void;
  // When provided, completed sets are editable (tap to un-complete).
  onUncompleteSet?: (set: WorkoutSet) => void;
}

export function SetList({ sets, unit, prBaselineE1RM, onCompleteSet, onUncompleteSet }: SetListProps) {
  const warmupSets = sets.filter(s => s.setType === 'warmup');
  const mainSets = sets.filter(s => s.setType === 'main' || s.setType === 'amrap');
  const supplementSets = sets.filter(s => s.setType === 'supplement');

  return (
    <div className="flex flex-col gap-2">
      {warmupSets.length > 0 && (
        <div>
          <p className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider mb-2">Warm-up</p>
          <div className="flex flex-col gap-1.5">
            {warmupSets.map(set => (
              <SetRow
                key={set.id}
                set={set}
                unit={unit}
                onComplete={() => onCompleteSet(set)}
                onUncomplete={onUncompleteSet ? () => onUncompleteSet(set) : undefined}
              />
            ))}
          </div>
        </div>
      )}

      {mainSets.length > 0 && (
        <div>
          <p className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider mb-2">Main Sets</p>
          <div className="flex flex-col gap-1.5">
            {mainSets.map(set => (
              <SetRow
                key={set.id}
                set={set}
                unit={unit}
                prBaselineE1RM={prBaselineE1RM}
                onComplete={(reps) => onCompleteSet(set, reps)}
                onUncomplete={onUncompleteSet ? () => onUncompleteSet(set) : undefined}
              />
            ))}
          </div>
        </div>
      )}

      {supplementSets.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider mb-2">Supplement</p>
          <div className="flex flex-col gap-1.5">
            {supplementSets.map(set => (
              <SetRow
                key={set.id}
                set={set}
                unit={unit}
                onComplete={() => onCompleteSet(set)}
                onUncomplete={onUncompleteSet ? () => onUncompleteSet(set) : undefined}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
