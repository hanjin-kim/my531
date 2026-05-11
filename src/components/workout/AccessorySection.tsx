import { useState, useEffect } from 'react';
import { Plus, Trash2, Bookmark, Check, Undo2 } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { BottomSheet } from '../ui/BottomSheet';
import type { AccessoryExercise, AccessoryPreset } from '../../core/types';
import {
  addAccessory, deleteAccessory, completeAccessorySet, undoAccessorySet,
  buildSetRecords, getAllPresets, addPreset, deletePreset,
} from '../../db/repositories/accessory.repo';

const CATEGORIES = ['push', 'pull', 'legs', 'core', 'other'] as const;
const CATEGORY_LABELS: Record<string, string> = {
  push: 'Push', pull: 'Pull', legs: 'Legs', core: 'Core', other: 'Other',
};

interface AccessorySectionProps {
  workoutDayId: number;
  accessories: AccessoryExercise[];
}

export function AccessorySection({ workoutDayId, accessories }: AccessorySectionProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [name, setName] = useState('');
  const [sets, setSets] = useState('3');
  const [reps, setReps] = useState('10');
  const [weight, setWeight] = useState('');
  const [editingSet, setEditingSet] = useState<{ accId: number; setIdx: number } | null>(null);
  const [editWeight, setEditWeight] = useState('');
  const [editReps, setEditReps] = useState('');

  const presets = useLiveQuery(() => getAllPresets(), []);

  const handleAdd = async () => {
    if (!name.trim()) return;
    const s = parseInt(sets) || 3;
    const r = parseInt(reps) || 10;
    const w = parseFloat(weight) || 0;
    await addAccessory({
      workoutDayId,
      name: name.trim(),
      targetSets: s,
      targetReps: r,
      weight: w || undefined,
      completedSets: 0,
      setRecords: buildSetRecords(s, r, w),
    });
    resetForm();
    setShowAdd(false);
  };

  const handleAddFromPreset = async (preset: AccessoryPreset) => {
    const w = preset.defaultWeight || 0;
    await addAccessory({
      workoutDayId,
      name: preset.name,
      targetSets: preset.defaultSets,
      targetReps: preset.defaultReps,
      weight: w || undefined,
      completedSets: 0,
      setRecords: buildSetRecords(preset.defaultSets, preset.defaultReps, w),
    });
    setShowPresets(false);
  };

  const handleSavePreset = async () => {
    if (!name.trim()) return;
    await addPreset({
      name: name.trim(),
      defaultSets: parseInt(sets) || 3,
      defaultReps: parseInt(reps) || 10,
      defaultWeight: parseFloat(weight) || undefined,
      category: 'other',
    });
  };

  const handleCompleteSet = async (accId: number, setIdx: number, record: { weight: number; reps: number }) => {
    const w = editWeight !== '' ? parseFloat(editWeight) : record.weight;
    const r = editReps !== '' ? parseInt(editReps) : record.reps;
    await completeAccessorySet(accId, setIdx, w || 0, r || 0);
    setEditingSet(null);
    setEditWeight('');
    setEditReps('');
  };

  const startEditSet = (accId: number, setIdx: number, record: { weight: number; reps: number }) => {
    setEditingSet({ accId, setIdx });
    setEditWeight(record.weight ? String(record.weight) : '');
    setEditReps(String(record.reps));
  };

  const resetForm = () => {
    setName('');
    setSets('3');
    setReps('10');
    setWeight('');
  };

  useEffect(() => {
    if (!showAdd) resetForm();
  }, [showAdd]);

  const groupedPresets = (presets ?? []).reduce<Record<string, AccessoryPreset[]>>((acc, p) => {
    (acc[p.category] ??= []).push(p);
    return acc;
  }, {});

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">Accessories</p>
        <div className="flex gap-1">
          {(presets ?? []).length > 0 && (
            <button onClick={() => setShowPresets(true)} className="p-1.5 rounded-lg hover:bg-[var(--color-surface-elevated)]">
              <Bookmark size={18} className="text-[var(--color-primary)]" />
            </button>
          )}
          <button onClick={() => setShowAdd(true)} className="p-1.5 rounded-lg hover:bg-[var(--color-surface-elevated)]">
            <Plus size={18} className="text-[var(--color-primary)]" />
          </button>
        </div>
      </div>

      {accessories.length === 0 && (
        <p className="text-sm text-[var(--color-text-muted)] text-center py-3">No accessories added</p>
      )}

      <div className="flex flex-col gap-2">
        {accessories.map(acc => (
          <div key={acc.id} className="rounded-xl bg-[var(--color-surface-elevated)] border border-[var(--color-border)] overflow-hidden">
            <div className="flex items-center justify-between px-3 pt-3 pb-1">
              <div>
                <p className="font-medium text-sm">{acc.name}</p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {acc.completedSets}/{acc.targetSets} sets
                  {acc.weight ? ` · ${acc.weight}kg` : ''}
                </p>
              </div>
              <button onClick={() => acc.id && deleteAccessory(acc.id)} className="p-1.5">
                <Trash2 size={16} className="text-[var(--color-text-muted)]" />
              </button>
            </div>

            <div className="flex gap-1.5 px-3 pb-3 pt-1">
              {acc.setRecords.map((record, idx) => {
                const isEditing = editingSet?.accId === acc.id && editingSet?.setIdx === idx;

                if (isEditing) {
                  return (
                    <div key={idx} className="flex-1 flex flex-col gap-1 bg-[var(--color-surface)] rounded-lg p-2">
                      <div className="flex gap-1">
                        <input
                          type="number"
                          inputMode="decimal"
                          placeholder="kg"
                          value={editWeight}
                          onChange={e => setEditWeight(e.target.value)}
                          className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded px-1.5 py-1 text-xs text-center text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
                        />
                        <input
                          type="number"
                          inputMode="numeric"
                          placeholder="reps"
                          value={editReps}
                          onChange={e => setEditReps(e.target.value)}
                          className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded px-1.5 py-1 text-xs text-center text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
                        />
                      </div>
                      <button
                        onClick={() => handleCompleteSet(acc.id!, idx, record)}
                        className="bg-[var(--color-primary)] text-white rounded py-1 text-xs font-medium"
                      >
                        Done
                      </button>
                    </div>
                  );
                }

                return (
                  <button
                    key={idx}
                    onClick={() => {
                      if (record.completed) {
                        undoAccessorySet(acc.id!, idx);
                      } else {
                        startEditSet(acc.id!, idx, record);
                      }
                    }}
                    className={`flex-1 rounded-lg py-2 px-1 text-center transition-colors ${
                      record.completed
                        ? 'bg-[var(--color-success)]/20 border border-[var(--color-success)]/40'
                        : 'bg-[var(--color-surface)] border border-[var(--color-border)]'
                    }`}
                  >
                    {record.completed ? (
                      <div className="flex flex-col items-center">
                        <Check size={14} className="text-[var(--color-success)] mb-0.5" />
                        <span className="text-[10px] text-[var(--color-success)]">
                          {record.weight > 0 ? `${record.weight}` : ''}{record.weight > 0 ? '×' : ''}{record.reps}
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <span className="text-xs font-medium text-[var(--color-text-secondary)]">S{idx + 1}</span>
                        <span className="text-[10px] text-[var(--color-text-muted)]">{acc.targetReps}r</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Add accessory sheet */}
      <BottomSheet open={showAdd} onClose={() => setShowAdd(false)} title="Add Accessory">
        <div className="flex flex-col gap-4">
          <Input label="Exercise name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Barbell Row" />
          <Input label="Weight" type="number" inputMode="decimal" value={weight} onChange={e => setWeight(e.target.value)} placeholder="Optional" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Sets" type="number" inputMode="numeric" value={sets} onChange={e => setSets(e.target.value)} />
            <Input label="Reps" type="number" inputMode="numeric" value={reps} onChange={e => setReps(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleAdd} disabled={!name.trim()} fullWidth>Add</Button>
            <Button variant="secondary" onClick={handleSavePreset} disabled={!name.trim()} fullWidth>
              <span className="flex items-center justify-center gap-1.5">
                <Bookmark size={16} /> Save Preset
              </span>
            </Button>
          </div>
        </div>
      </BottomSheet>

      {/* Presets sheet */}
      <BottomSheet open={showPresets} onClose={() => setShowPresets(false)} title="Presets">
        <div className="flex flex-col gap-4">
          {CATEGORIES.filter(c => groupedPresets[c]?.length).map(cat => (
            <div key={cat}>
              <p className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
                {CATEGORY_LABELS[cat]}
              </p>
              <div className="flex flex-col gap-1.5">
                {groupedPresets[cat].map(preset => (
                  <div
                    key={preset.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-[var(--color-surface-elevated)] border border-[var(--color-border)]"
                  >
                    <button className="flex-1 text-left" onClick={() => handleAddFromPreset(preset)}>
                      <p className="font-medium text-sm">{preset.name}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {preset.defaultSets}×{preset.defaultReps}
                        {preset.defaultWeight ? ` @ ${preset.defaultWeight}kg` : ''}
                      </p>
                    </button>
                    <button onClick={() => preset.id && deletePreset(preset.id)} className="p-1.5">
                      <Trash2 size={14} className="text-[var(--color-text-muted)]" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {(presets ?? []).length === 0 && (
            <p className="text-sm text-[var(--color-text-muted)] text-center py-4">
              No presets yet. Add an accessory and save it as a preset.
            </p>
          )}
        </div>
      </BottomSheet>
    </div>
  );
}
