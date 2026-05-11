import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { BottomSheet } from '../ui/BottomSheet';
import type { AccessoryExercise } from '../../core/types';
import { addAccessory, deleteAccessory, updateAccessory } from '../../db/repositories/accessory.repo';

interface AccessorySectionProps {
  workoutDayId: number;
  accessories: AccessoryExercise[];
}

export function AccessorySection({ workoutDayId, accessories }: AccessorySectionProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [sets, setSets] = useState('3');
  const [reps, setReps] = useState('10');

  const handleAdd = async () => {
    if (!name.trim()) return;
    await addAccessory({
      workoutDayId,
      name: name.trim(),
      targetSets: parseInt(sets) || 3,
      targetReps: parseInt(reps) || 10,
      completedSets: 0,
    });
    setName('');
    setSets('3');
    setReps('10');
    setShowAdd(false);
  };

  const handleSetDone = async (acc: AccessoryExercise) => {
    if (!acc.id || acc.completedSets >= acc.targetSets) return;
    await updateAccessory(acc.id, { completedSets: acc.completedSets + 1 });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">Accessories</p>
        <button onClick={() => setShowAdd(true)} className="p-1.5 rounded-lg hover:bg-[var(--color-surface-elevated)]">
          <Plus size={18} className="text-[var(--color-primary)]" />
        </button>
      </div>

      {accessories.length === 0 && (
        <p className="text-sm text-[var(--color-text-muted)] text-center py-3">No accessories added</p>
      )}

      <div className="flex flex-col gap-1.5">
        {accessories.map(acc => (
          <div key={acc.id} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--color-surface-elevated)]">
            <div className="flex-1">
              <p className="font-medium text-sm">{acc.name}</p>
              <p className="text-xs text-[var(--color-text-secondary)]">
                {acc.completedSets}/{acc.targetSets} x {acc.targetReps}
              </p>
            </div>
            <button
              onClick={() => handleSetDone(acc)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${acc.completedSets >= acc.targetSets ? 'bg-[var(--color-success)]/20 text-[var(--color-success)]' : 'bg-[var(--color-primary)] text-white active:scale-95'}`}
            >
              {acc.completedSets >= acc.targetSets ? 'Done' : '+1 Set'}
            </button>
            <button onClick={() => acc.id && deleteAccessory(acc.id)} className="p-1.5">
              <Trash2 size={16} className="text-[var(--color-text-muted)]" />
            </button>
          </div>
        ))}
      </div>

      <BottomSheet open={showAdd} onClose={() => setShowAdd(false)} title="Add Accessory">
        <div className="flex flex-col gap-4">
          <Input label="Exercise name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Barbell Row" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Sets" type="number" inputMode="numeric" value={sets} onChange={e => setSets(e.target.value)} />
            <Input label="Reps" type="number" inputMode="numeric" value={reps} onChange={e => setReps(e.target.value)} />
          </div>
          <Button onClick={handleAdd} disabled={!name.trim()} fullWidth>Add</Button>
        </div>
      </BottomSheet>
    </div>
  );
}
