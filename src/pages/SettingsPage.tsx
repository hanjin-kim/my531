import { useState } from 'react';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { Select } from '../components/ui/Select';
import { NumberInput } from '../components/ui/NumberInput';
import { Button } from '../components/ui/Button';
import { useSettings } from '../hooks/useSettings';
import type { SupplementType, Unit } from '../core/types';
import { db } from '../db/schema';

export default function SettingsPage() {
  const { settings, update } = useSettings();
  const [showReset, setShowReset] = useState(false);

  if (!settings) return null;

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
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wendler-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const EXPECTED_TABLES = [
    'settings', 'mainLifts', 'programs', 'cycles',
    'workoutDays', 'workoutSets', 'accessoryExercises',
    'amrapRecords', 'seventhWeekProtocols',
  ] as const;

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (typeof data !== 'object' || data === null || Array.isArray(data)) {
          alert('Invalid backup file format.');
          return;
        }

        await db.transaction('rw', db.tables, async () => {
          for (const tableName of EXPECTED_TABLES) {
            const table = db.table(tableName);
            await table.clear();
            const rows = data[tableName];
            if (Array.isArray(rows) && rows.length > 0) {
              await table.bulkAdd(rows);
            }
          }
        });
        window.location.reload();
      } catch {
        alert('Failed to import backup: invalid or corrupted file.');
      }
    };
    input.click();
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
          <Select
            label="Default Supplement"
            value={settings.defaultSupplement}
            onChange={e => update({ defaultSupplement: e.target.value as SupplementType })}
            options={[
              { value: 'bbb', label: 'BBB (5x10)' },
              { value: 'fsl', label: 'FSL (5x5)' },
              { value: 'none', label: 'None' },
            ]}
          />
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
