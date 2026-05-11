import { NumberInput } from '../ui/NumberInput';
import { Select } from '../ui/Select';
import type { SupplementType, Unit } from '../../core/types';

interface TMConfiguratorProps {
  tmPercentage: number;
  onTMChange: (value: number) => void;
  unit: Unit;
  onUnitChange: (unit: Unit) => void;
  supplement: SupplementType;
  onSupplementChange: (type: SupplementType) => void;
}

export function TMConfigurator({
  tmPercentage, onTMChange,
  unit, onUnitChange,
  supplement, onSupplementChange,
}: TMConfiguratorProps) {
  return (
    <div className="flex flex-col gap-5">
      <Select
        label="Weight Unit"
        value={unit}
        onChange={e => onUnitChange(e.target.value as Unit)}
        options={[
          { value: 'kg', label: 'Kilograms (kg)' },
          { value: 'lbs', label: 'Pounds (lbs)' },
        ]}
      />
      <NumberInput
        label="Training Max %"
        value={tmPercentage}
        onChange={onTMChange}
        step={5}
        min={75}
        max={95}
        unit="%"
      />
      <Select
        label="Supplement Template"
        value={supplement}
        onChange={e => onSupplementChange(e.target.value as SupplementType)}
        options={[
          { value: 'bbb', label: 'BBB (Boring But Big) - 5x10' },
          { value: 'fsl', label: 'FSL (First Set Last) - 5x5' },
          { value: 'none', label: 'None (Main Sets Only)' },
        ]}
      />
    </div>
  );
}
