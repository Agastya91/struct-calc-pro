export type UnitSystem = 'SI' | 'Imperial';
export type UnitType = 'length' | 'section' | 'force' | 'moment' | 'distributed' | 'stress' | 'deflection' | 'area' | 'inertia' | 'modulus';

export const UNITS = {
  SI: {
    length: 'm',
    section: 'm',
    force: 'kN',
    moment: 'kNm',
    distributed: 'kN/m',
    stress: 'MPa',
    deflection: 'mm',
    area: 'm²',
    inertia: 'm⁴',
    modulus: 'GPa'
  },
  Imperial: {
    length: 'ft',
    section: 'in',
    force: 'kips',
    moment: 'k-ft',
    distributed: 'k/ft',
    stress: 'ksi',
    deflection: 'in',
    area: 'in²',
    inertia: 'in⁴',
    modulus: 'ksi'
  }
};

const FACTORS: Record<UnitType, number> = {
  length: 3.28084,      // m -> ft
  section: 39.3701,     // m -> in
  force: 0.224809,      // kN -> kips
  moment: 0.737562,     // kNm -> k-ft
  distributed: 0.0685218, // kN/m -> k/ft
  stress: 0.145038,     // MPa -> ksi
  deflection: 0.0393701, // mm -> in
  area: 1550.0031,      // m² -> in²
  inertia: 2402509.61,  // m⁴ -> in⁴
  modulus: 145.038      // GPa -> ksi
};

export const toDisplay = (val: number | undefined, type: UnitType, system: UnitSystem): number => {
  if (val === undefined || val === null) return 0;
  if (system === 'SI') return val;
  return val * FACTORS[type];
};

export const fromDisplay = (val: number, type: UnitType, system: UnitSystem): number => {
  if (system === 'SI') return val;
  return val / FACTORS[type];
};

export const getUnit = (type: UnitType, system: UnitSystem): string => {
  return UNITS[system][type];
};
