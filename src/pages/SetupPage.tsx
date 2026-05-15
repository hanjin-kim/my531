import { useState } from 'react';
import { LiftSetupCard } from '../components/setup/LiftSetupCard';
import { TMConfigurator } from '../components/setup/TMConfigurator';
import { Button } from '../components/ui/Button';
import { LIFT_NAMES } from '../core/constants';
import { calculateTM } from '../core/calculator';
import type { LiftName, MainLift, SupplementType, Unit } from '../core/types';
import { DEFAULT_TM_PERCENTAGE, DEFAULT_ROUNDING_KG, DEFAULT_ROUNDING_LBS, DEFAULT_LEADER_CYCLES, DEFAULT_ANCHOR_CYCLES } from '../core/constants';
import { db } from '../db/schema';
import { createNewProgram } from '../db/repositories/program.repo';
import { seedDefaults } from '../db/seed';
import { importBackup } from '../db/import-backup';

export default function SetupPage() {
  const [unit, setUnit] = useState<Unit>('kg');
  const [tmPercentage, setTMPercentage] = useState(DEFAULT_TM_PERCENTAGE);
  const [supplement, setSupplement] = useState<SupplementType>('bbb');
  const [maxes, setMaxes] = useState<Record<LiftName, number>>({
    squat: 0, bench: 0, deadlift: 0, ohp: 0,
  });
  const [saving, setSaving] = useState(false);

  const allSet = LIFT_NAMES.every(name => maxes[name] > 0);

  const handleSave = async () => {
    if (!allSet || saving) return;
    setSaving(true);

    try {
      await seedDefaults();

      const roundingIncrement = unit === 'kg' ? DEFAULT_ROUNDING_KG : DEFAULT_ROUNDING_LBS;
      await db.settings.update(1, {
        unit,
        tmPercentage,
        roundingIncrement,
        defaultSupplement: supplement,
        updatedAt: new Date().toISOString(),
      });

      const now = new Date().toISOString();
      const mainLifts: MainLift[] = LIFT_NAMES.map(name => ({
        name,
        oneRepMax: maxes[name],
        trainingMax: calculateTM(maxes[name], tmPercentage),
        unit,
        updatedAt: now,
      }));

      await db.mainLifts.clear();
      const liftIds = await db.mainLifts.bulkAdd(mainLifts as MainLift[], { allKeys: true });
      const savedLifts = mainLifts.map((l, i) => ({ ...l, id: liftIds[i] }));

      const settings = await db.settings.get(1);
      await createNewProgram(savedLifts, {
        ...settings!,
        leaderCycles: DEFAULT_LEADER_CYCLES,
        anchorCycles: DEFAULT_ANCHOR_CYCLES,
      });

    } catch (e) {
      console.error('Setup failed:', e);
      alert(`Setup failed: ${e instanceof Error ? e.message : String(e)}`);
      setSaving(false);
    }
  };

  return (
    <div className="min-h-full px-4 py-6 flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Welcome to 5/3/1</h1>
        <p className="text-[var(--color-text-secondary)] mt-1">
          Set up your lifts to get started. Enter your 1RM directly or calculate it from reps.
        </p>
      </div>

      <TMConfigurator
        tmPercentage={tmPercentage}
        onTMChange={setTMPercentage}
        unit={unit}
        onUnitChange={setUnit}
        supplement={supplement}
        onSupplementChange={setSupplement}
      />

      <div className="flex flex-col gap-4">
        {LIFT_NAMES.map(name => (
          <LiftSetupCard
            key={name}
            liftName={name}
            oneRepMax={maxes[name]}
            tmPercentage={tmPercentage}
            unit={unit}
            onChange={(val) => setMaxes(prev => ({ ...prev, [name]: val }))}
          />
        ))}
      </div>

      <Button
        onClick={handleSave}
        disabled={!allSet || saving}
        fullWidth
        size="lg"
      >
        {saving ? 'Creating Program...' : 'Start Program'}
      </Button>

      <button
        onClick={importBackup}
        className="text-sm text-[var(--color-text-secondary)] underline text-center"
      >
        Import from backup
      </button>
    </div>
  );
}
