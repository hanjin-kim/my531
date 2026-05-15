import { db } from './schema';

const EXPECTED_TABLES = [
  'settings', 'mainLifts', 'programs', 'cycles',
  'workoutDays', 'workoutSets', 'accessoryExercises',
  'amrapRecords', 'seventhWeekProtocols', 'accessoryPresets',
] as const;

export function importBackup(): void {
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
}
