// Flags vitals that fall outside typical adult resting ranges. Vitals are
// stored as free text ("72 bpm", "98.6°F", "120/80 mmHg"), so each check pulls
// the numbers out first and stays silent when it can't parse them.
// This is a visual cue for review, not a clinical judgement.
import type { PatientData } from '@/lib/patient';

export type VitalFlag = 'low' | 'high';

interface Range {
  min: number;
  max: number;
}

const NUMBER = /-?\d+(?:\.\d+)?/g;

const numbersIn = (value: string) => (value.match(NUMBER) ?? []).map(Number);

const compare = (n: number, { min, max }: Range): VitalFlag | null =>
  n < min ? 'low' : n > max ? 'high' : null;

// Checks the first number in the value against a single range.
const single = (range: Range) => (value: string) => {
  const [n] = numbersIn(value);
  return n === undefined ? null : compare(n, range);
};

const SYSTOLIC: Range = { min: 90, max: 139 };
const DIASTOLIC: Range = { min: 60, max: 89 };

// "120/80": either side out of range flags the reading; high wins over low.
const bloodPressure = (value: string) => {
  const [systolic, diastolic] = numbersIn(value);
  if (systolic === undefined || diastolic === undefined) return null;
  const flags = [compare(systolic, SYSTOLIC), compare(diastolic, DIASTOLIC)];
  return flags.includes('high') ? 'high' : flags.includes('low') ? 'low' : null;
};

// Temperatures may be in °F or °C. Anything under 50 can only be Celsius.
const temperature = (value: string) => {
  const [n] = numbersIn(value);
  if (n === undefined) return null;
  return n < 50 ? compare(n, { min: 36.1, max: 37.5 }) : compare(n, { min: 97, max: 99.5 });
};

const CHECKS: Partial<Record<keyof PatientData, (value: string) => VitalFlag | null>> = {
  bloodPressure,
  heartRate: single({ min: 60, max: 100 }),
  temperature,
  respiratoryRate: single({ min: 12, max: 20 }),
  oxygenSaturation: single({ min: 95, max: 100 }),
};

// Returns 'low' / 'high' for an out-of-range vital, or null when the value is
// normal, empty, unparseable, or a field we don't have a range for (weight, height).
export const flagVital = (field: keyof PatientData, value: string): VitalFlag | null => {
  const check = CHECKS[field];
  return check && value.trim() ? check(value) : null;
};
