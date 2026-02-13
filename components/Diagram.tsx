import React from 'react';
import { UnitSystem, toDisplay, getUnit } from '../utils/units';

interface DiagramProps {
  data: { x: number; V?: number; M?: number }[];
  type: 'shear' | 'moment';
  maxVal: number;
  len: number;
  unitSystem: UnitSystem;
}

const Diagram: React.FC<DiagramProps> = ({ data, type, maxVal, len, unitSystem }) => {
  const w = 800;
  const h = 300;
  const mg = { t: 40, r: 45, b: 50, l: 70 };
  const pw = w - mg.l - mg.r;
  const ph = h - mg.t - mg.b;
  
  const col = type === 'shear' ? '#3b82f6' : '#a855f7';
  const label = type === 'shear' ? 'Shear Force (V)' : 'Bending Moment (M)';
  
  const uForce = getUnit('force', unitSystem);
  const uMom = getUnit('moment', unitSystem);
  const unit = type === 'shear' ? uForce : uMom;
  
  const uType = type === 'shear' ? 'force' : 'moment';

  // Convert max val for display scaling. Use Absolute value to ensure scale is positive.
  // Otherwise, a negative max shear causes the graph to invert upside down.
  const maxValDisp = Math.abs(toDisplay(maxVal, uType, unitSystem));

  // Prevent division by zero if maxVal is 0
  const safeMax = maxValDisp === 0 ? 1 : maxValDisp;
  const ys = ph / (safeMax * 2.4); 
  const zy = mg.t + ph / 2; // Zero line Y position

  const points = data.map(d => {
    const rawVal = type === 'shear' ? (d.V || 0) : (d.M || 0);
    const dispVal = toDisplay(rawVal, uType, unitSystem);
    // SVG Y increases downwards. Positive value should go UP (subtract from zy).
    return `${mg.l + (d.x / len) * pw},${zy - dispVal * ys}`;
  }).join(' ');

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm mt-4">
      <svg width={w} height={h} className="mx-auto">
        <text x={w / 2} y={25} textAnchor="middle" fontSize="14" fontWeight="600" fill="#334155">{label} Diagram</text>
        
        {/* Grid Lines */}
        {[...Array(11)].map((_, i) => (
          <line key={i} x1={mg.l} y1={mg.t + i * ph / 10} x2={mg.l + pw} y2={mg.t + i * ph / 10} stroke="#f1f5f9" strokeWidth="1" />
        ))}

        {/* Axes */}
        <line x1={mg.l} y1={zy} x2={mg.l + pw} y2={zy} stroke="#94a3b8" strokeWidth="2" strokeDasharray="4 4" />
        <line x1={mg.l} y1={mg.t} x2={mg.l} y2={mg.t + ph} stroke="#000" strokeWidth="2" />

        {/* The Graph */}
        <polyline points={points} fill="none" stroke={col} strokeWidth="2.5" strokeLinejoin="round" />
        <polygon points={`${mg.l},${zy} ${points} ${mg.l + pw},${zy}`} fill={col} fillOpacity="0.1" />

        {/* Labels */}
        <text x={mg.l - 10} y={mg.t} textAnchor="end" fontSize="10" fill="#64748b">+{safeMax.toFixed(2)} {unit}</text>
        <text x={mg.l - 10} y={zy + 4} textAnchor="end" fontSize="10" fill="#64748b" fontWeight="bold">0</text>
        <text x={mg.l - 10} y={mg.t + ph + 4} textAnchor="end" fontSize="10" fill="#64748b">-{safeMax.toFixed(2)} {unit}</text>

        <text x={w / 2} y={h - 15} textAnchor="middle" fontSize="11" fontWeight="600" fill="#475569">Position ({getUnit('length', unitSystem)})</text>
        
        <g transform={`translate(${w - 100}, 30)`}>
            <rect width="80" height="24" rx="4" fill={col} fillOpacity="0.1" stroke={col} />
            <text x="40" y="16" textAnchor="middle" fontSize="11" fill={col} fontWeight="700">Max: {maxValDisp.toFixed(2)}</text>
        </g>
      </svg>
    </div>
  );
};

export default Diagram;