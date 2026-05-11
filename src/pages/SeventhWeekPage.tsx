import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { generateTMTestSets, evaluateTMTest } from '../core/seventh-week';
import { reduceTM } from '../core/progression';
import { LIFT_NAMES, LIFT_DISPLAY_NAMES } from '../core/constants';
import { createSeventhWeek, recordTMTestResult, completeSeventhWeek } from '../db/repositories/seventh-week.repo';
import { completeProgram } from '../db/repositories/program.repo';
import { db } from '../db/schema';
import { useSettings } from '../hooks/useSettings';
import { useLiveQuery } from 'dexie-react-hooks';
import type { LiftName, SeventhWeekChoice, TMTestResult } from '../core/types';

export default function SeventhWeekPage() {
  const { programId: pidStr } = useParams<{ programId: string }>();
  const programId = parseInt(pidStr ?? '0', 10);
  const navigate = useNavigate();
  const { settings } = useSettings();
  const [choice, setChoice] = useState<SeventhWeekChoice | null>(null);
  const [protocolId, setProtocolId] = useState<number | null>(null);
  const [testResults, setTestResults] = useState<Record<LiftName, { reps: string; result?: TMTestResult }>>({
    squat: { reps: '' }, bench: { reps: '' }, deadlift: { reps: '' }, ohp: { reps: '' },
  });

  const mainLifts = useLiveQuery(() => db.mainLifts.toArray()) ?? [];
  const lastCycle = useLiveQuery(
    () => db.cycles.where('programId').equals(programId).last(),
    [programId],
  );

  if (!settings) return null;

  const handleChoose = async (c: SeventhWeekChoice) => {
    setChoice(c);
    if (lastCycle?.id) {
      const id = await createSeventhWeek(programId, lastCycle.id, c);
      setProtocolId(id);
    }
  };

  const handleTestLift = async (liftName: LiftName) => {
    const reps = parseInt(testResults[liftName].reps, 10);
    if (isNaN(reps) || reps < 0 || !protocolId) return;
    const result = evaluateTMTest(reps);
    const lift = mainLifts.find(l => l.name === liftName);
    if (!lift) return;

    setTestResults(prev => ({ ...prev, [liftName]: { ...prev[liftName], result } }));
    await recordTMTestResult(protocolId, liftName, lift.trainingMax, reps, result === 'pass');

    if (result === 'fail' && lift.id) {
      const newTM = reduceTM(lift.trainingMax);
      await db.mainLifts.update(lift.id, { trainingMax: Math.round(newTM * 100) / 100 });
    }
  };

  const handleFinish = async () => {
    if (protocolId) {
      await completeSeventhWeek(protocolId);
    }
    await completeProgram(programId);
    navigate('/setup', { replace: true });
  };

  const allTested = LIFT_NAMES.every(name => testResults[name].result !== undefined);

  return (
    <div className="px-4 py-2 flex flex-col gap-4">
      <Header title="7th Week Protocol" subtitle="Choose your protocol after this cycle" />

      {!choice && (
        <div className="flex flex-col gap-3">
          <Card onClick={() => handleChoose('tm_test')}>
            <h3 className="font-semibold">TM Test</h3>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              Test your Training Max with each lift at 100% TM for max reps. 5+ reps = pass, 3-4 = marginal, &lt;3 = reduce TM by 10%.
            </p>
          </Card>
          <Card onClick={() => handleChoose('deload')}>
            <h3 className="font-semibold">Deload Week</h3>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              Light week at 40/50/60% of TM. Good for recovery before starting the next program.
            </p>
          </Card>
        </div>
      )}

      {choice === 'tm_test' && (
        <div className="flex flex-col gap-3">
          {LIFT_NAMES.map(name => {
            const lift = mainLifts.find(l => l.name === name);
            if (!lift) return null;
            const tmTestSets = generateTMTestSets(lift.trainingMax, settings.roundingIncrement);
            const lastSet = tmTestSets[tmTestSets.length - 1];
            const res = testResults[name];

            return (
              <Card key={name}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{LIFT_DISPLAY_NAMES[name]}</h3>
                  {res.result && (
                    <Badge variant={res.result === 'pass' ? 'success' : res.result === 'marginal' ? 'warning' : 'default'}>
                      {res.result}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-[var(--color-text-secondary)] mb-2">
                  Work up to {lastSet?.weight} {settings.unit} x max reps
                </p>
                {!res.result && (
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      inputMode="numeric"
                      placeholder="Reps"
                      value={res.reps}
                      onChange={e => setTestResults(prev => ({ ...prev, [name]: { ...prev[name], reps: e.target.value } }))}
                    />
                    <Button onClick={() => handleTestLift(name)} disabled={!res.reps}>
                      Record
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}

          {allTested && (
            <Button onClick={handleFinish} fullWidth size="lg">
              Complete & Start New Program
            </Button>
          )}
        </div>
      )}

      {choice === 'deload' && (
        <div className="flex flex-col gap-3">
          <Card>
            <p className="text-[var(--color-text-secondary)]">
              Perform deload workouts at 40/50/60% of your TM for each lift. Focus on recovery.
            </p>
          </Card>
          <Button onClick={handleFinish} fullWidth size="lg">
            Complete & Start New Program
          </Button>
        </div>
      )}
    </div>
  );
}
