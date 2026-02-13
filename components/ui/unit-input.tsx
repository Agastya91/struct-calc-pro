import React, { useEffect, useState } from 'react';
import { Input } from './input';
import { UnitSystem, UnitType, toDisplay, fromDisplay } from '../../utils/units';

interface UnitInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: number | undefined;
  onChange: (val: number) => void;
  unitSystem: UnitSystem;
  unitType: UnitType;
  precision?: number;
}

export const UnitInput = ({ value, onChange, unitSystem, unitType, precision = 4, ...props }: UnitInputProps) => {
  const [displayValue, setDisplayValue] = useState('');

  // Sync internal state with external prop, converting units
  useEffect(() => {
    const val = value ?? 0;
    const converted = toDisplay(val, unitType, unitSystem);
    // Round for display cleanly
    const p = Math.pow(10, precision);
    const rounded = Math.round(converted * p) / p;
    
    // Check if we need to update to avoid overwriting user typing (e.g. "1." vs "1")
    // We strictly update if the drift is large (unit change) or value changed externally
    const current = parseFloat(displayValue);
    if (isNaN(current) || Math.abs(current - rounded) > (1/p)) {
       setDisplayValue(String(rounded));
    }
  }, [value, unitSystem, unitType, precision]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valStr = e.target.value;
    setDisplayValue(valStr);
    const num = parseFloat(valStr);
    if (!isNaN(num)) {
      onChange(fromDisplay(num, unitType, unitSystem));
    } else if (valStr === '') {
      onChange(0);
    }
  };

  return <Input {...props} type="number" step="any" value={displayValue} onChange={handleChange} />;
};