import { useState } from 'react';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { BottomSheet } from '../ui/BottomSheet';
import { NRMCalculator } from './NRMCalculator';
import { LIFT_DISPLAY_NAMES } from '../../core/constants';
import { calculateTM } from '../../core/calculator';
import type { LiftName } from '../../core/types';

interface LiftSetupCardProps {
  liftName: LiftName;
  oneRepMax: number;
  tmPercentage: number;
  unit: string;
  onChange: (oneRepMax: number) => void;
}

export function LiftSetupCard({ liftName, oneRepMax, tmPercentage, unit, onChange }: LiftSetupCardProps) {
  const [showNRM, setShowNRM] = useState(false);
  const [inputValue, setInputValue] = useState(oneRepMax > 0 ? String(oneRepMax) : '');
  const tm = oneRepMax > 0 ? calculateTM(oneRepMax, tmPercentage) : 0;

  const handleDirectInput = (val: string) => {
    setInputValue(val);
    const parsed = parseFloat(val);
    if (parsed > 0) onChange(parsed);
  };

  return (
    <>
      <Card>
        <h3 className="text-lg font-semibold mb-3">{LIFT_DISPLAY_NAMES[liftName]}</h3>
        <div className="flex flex-col gap-3">
          <Input
            label={`1RM (${unit})`}
            type="number"
            inputMode="decimal"
            value={inputValue}
            onChange={e => handleDirectInput(e.target.value)}
            placeholder="Enter 1RM"
          />
          <Button variant="secondary" size="sm" onClick={() => setShowNRM(true)}>
            Calculate from Reps
          </Button>
          {tm > 0 && (
            <div className="flex justify-between items-center pt-1 border-t border-[var(--color-border)]">
              <span className="text-sm text-[var(--color-text-secondary)]">Training Max ({tmPercentage}%)</span>
              <span className="font-semibold tabular-nums">{Math.round(tm * 10) / 10} {unit}</span>
            </div>
          )}
        </div>
      </Card>

      <BottomSheet open={showNRM} onClose={() => setShowNRM(false)} title="NRM Calculator">
        <NRMCalculator
          unit={unit}
          onCalculate={(val) => {
            setInputValue(String(val));
            onChange(val);
            setShowNRM(false);
          }}
        />
      </BottomSheet>
    </>
  );
}
