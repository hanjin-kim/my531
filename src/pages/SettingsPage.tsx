import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { Select } from '../components/ui/Select';
import { NumberInput } from '../components/ui/NumberInput';
import { Button } from '../components/ui/Button';
import { useSettings } from '../hooks/useSettings';
import { LIFT_DISPLAY_NAMES, TM_INCREASE } from '../core/constants';
import type { LiftName, MainSetStyle, SupplementType, Unit } from '../core/types';
import { db } from '../db/schema';
import { importBackup } from '../db/import-backup';
import { regenerateActiveCycleForLift, regenerateActiveCycleAllLifts } from '../db/repositories/supplement.repo';

export default function SettingsPage() {
  const { settings, update } = useSettings();
  const mainLifts = useLiveQuery(() => db.mainLifts.toArray());
  const [showReset, setShowReset] = useState(false);

  if (!settings) return null;

  const usesBbb = mainLifts?.some(l => l.supplementType === 'bbb') ?? false;
  const usesFsl = mainLifts?.some(l => l.supplementType === 'fsl') ?? false;

  const tmIncrease = settings.tmIncrease ?? {
    squat: TM_INCREASE[settings.unit].lower,
    bench: TM_INCREASE[settings.unit].upper,
    deadlift: TM_INCREASE[settings.unit].lower,
    ohp: TM_INCREASE[settings.unit].upper,
  };

  const handleExport = async () => {
    const data = {
      settings: await db.settings.toArray(),
      mainLifts: await db.mainLifts.toArray(),
      programs: await db.programs.toArray(),
      cycles: await db.cycles.toArray(),
      workoutDays: await db.workoutDays.toArray(),
      workoutSets: await db.workoutSets.toArray(),
      accessoryExercises: await db.accessoryExercises.toArray(),
      amrapRecords: await db.amrapRecords.toArray(),
      seventhWeekProtocols: await db.seventhWeekProtocols.toArray(),
      accessoryPresets: await db.accessoryPresets.toArray(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `531-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => importBackup();

  // Save a lift's main-set style / supplement, then rebuild that lift's pending days in the
  // active cycle so the change takes effect now (completed/in-progress days keep their reps).
  const updateLiftConfig = async (
    liftId: number,
    liftName: LiftName,
    updates: { mainSetStyle?: MainSetStyle; supplementType?: SupplementType },
  ) => {
    await db.mainLifts.update(liftId, { ...updates, updatedAt: new Date().toISOString() });
    await regenerateActiveCycleForLift(liftName);
  };

  // Set counts are global; changing one rebuilds every lift that uses that supplement.
  const updateSetCount = async (updates: { bbbSets?: number; fslSets?: number }) => {
    await update(updates);
    await regenerateActiveCycleAllLifts();
  };

  const handleReset = async () => {
    await db.delete();
    window.location.reload();
  };

  return (
    <div className="px-4 py-2 flex flex-col gap-4">
      <Header title="Settings" />

      <Card>
        <h3 className="font-semibold mb-3">Units & Calculation</h3>
        <div className="flex flex-col gap-4">
          <Select
            label="Weight Unit"
            value={settings.unit}
            onChange={e => update({ unit: e.target.value as Unit })}
            options={[
              { value: 'kg', label: 'Kilograms (kg)' },
              { value: 'lbs', label: 'Pounds (lbs)' },
            ]}
          />
          <NumberInput
            label="Training Max %"
            value={settings.tmPercentage}
            onChange={v => update({ tmPercentage: v })}
            step={5}
            min={75}
            max={95}
            unit="%"
          />
          <NumberInput
            label="Rounding Increment"
            value={settings.roundingIncrement}
            onChange={v => update({ roundingIncrement: v })}
            step={settings.unit === 'kg' ? 0.5 : 5}
            min={settings.unit === 'kg' ? 0.5 : 1}
            max={settings.unit === 'kg' ? 5 : 10}
            unit={settings.unit}
          />
          {(['squat', 'bench', 'deadlift', 'ohp'] as LiftName[]).map(lift => (
            <NumberInput
              key={lift}
              label={`TM Increase - ${LIFT_DISPLAY_NAMES[lift]}`}
              value={tmIncrease[lift]}
              onChange={v => update({ tmIncrease: { ...tmIncrease, [lift]: v } })}
              step={settings.unit === 'kg' ? 0.5 : 1}
              min={0}
              max={settings.unit === 'kg' ? 10 : 20}
              unit={settings.unit}
            />
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="font-semibold mb-3">Program Structure</h3>
        <div className="flex flex-col gap-4">
          <NumberInput
            label="Leader Cycles"
            value={settings.leaderCycles}
            onChange={v => update({ leaderCycles: v })}
            min={1}
            max={5}
          />
          <NumberInput
            label="Anchor Cycles"
            value={settings.anchorCycles}
            onChange={v => update({ anchorCycles: v })}
            min={1}
            max={3}
          />
        </div>
      </Card>

      <Card>
        <h3 className="font-semibold mb-1">Per-Lift Setup</h3>
        <p className="text-xs text-[var(--color-text-muted)] mb-3">
          Main-set style and supplement for each lift.
        </p>
        <div className="flex flex-col gap-4">
          {mainLifts?.map(lift => (
            <div key={lift.id} className="flex flex-col gap-2">
              <span className="font-medium text-sm">{LIFT_DISPLAY_NAMES[lift.name]}</span>
              <div className="grid grid-cols-2 gap-2">
                <Select
                  label="Main Sets"
                  value={lift.mainSetStyle}
                  onChange={e => updateLiftConfig(lift.id!, lift.name, { mainSetStyle: e.target.value as MainSetStyle })}
                  options={[
                    { value: '531', label: '5/3/1 (AMRAP)' },
                    { value: '5spro', label: "5's PRO" },
                  ]}
                />
                <Select
                  label="Supplement"
                  value={lift.supplementType}
                  onChange={e => updateLiftConfig(lift.id!, lift.name, { supplementType: e.target.value as SupplementType })}
                  options={[
                    { value: 'bbb', label: 'BBB' },
                    { value: 'fsl', label: 'FSL' },
                    { value: 'none', label: 'None' },
                  ]}
                />
              </div>
            </div>
          ))}
          {usesBbb && (
            <NumberInput
              label="BBB Sets"
              value={settings.bbbSets}
              onChange={v => updateSetCount({ bbbSets: v })}
              min={1}
              max={5}
            />
          )}
          {usesFsl && (
            <NumberInput
              label="FSL Sets"
              value={settings.fslSets}
              onChange={v => updateSetCount({ fslSets: v })}
              min={1}
              max={5}
            />
          )}
        </div>
      </Card>

      <Card>
        <h3 className="font-semibold mb-3">Data Management</h3>
        <div className="flex flex-col gap-2">
          <Button variant="secondary" fullWidth onClick={handleExport}>Export Backup (JSON)</Button>
          <Button variant="secondary" fullWidth onClick={handleImport}>Import Backup</Button>
          {!showReset ? (
            <Button variant="danger" fullWidth onClick={() => setShowReset(true)}>Reset All Data</Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="danger" fullWidth onClick={handleReset}>Confirm Reset</Button>
              <Button variant="secondary" fullWidth onClick={() => setShowReset(false)}>Cancel</Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
