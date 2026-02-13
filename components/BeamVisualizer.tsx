import React from 'react';
import { BeamConfig, Load, AnalysisResult } from '../types';
import { UnitSystem, toDisplay, getUnit } from '../utils/units';

interface BeamVizProps {
  cfg: BeamConfig;
  loads: Load[];
  res: AnalysisResult | null;
  unitSystem: UnitSystem;
}

const BeamVisualizer: React.FC<BeamVizProps> = ({ cfg, loads, res, unitSystem }) => {
  const w = 800;
  const h = 240;
  const m = 85; // Margin
  const by = h / 2; // Beam Y position
  const bl = w - 2 * m; // Beam pixel length
  const sc = bl / cfg.length; // Scale factor (pixels per meter)

  const uLen = getUnit('length', unitSystem);
  const uForce = getUnit('force', unitSystem);
  const uDist = getUnit('distributed', unitSystem);
  const uMom = getUnit('moment', unitSystem);

  // Helper to format values
  const fmt = (val: number, type: any) => toDisplay(val, type, unitSystem).toFixed(1);

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
      <svg width={w} height={h} className="mx-auto">
        {/* Title */}
        <text x={w / 2} y={25} textAnchor="middle" fontSize="14" fontWeight="600" fill="#1e293b">
          Free Body Diagram
        </text>

        {/* The Beam */}
        <rect x={m} y={by - 6} width={bl} height={12} fill="#475569" rx="2" stroke="#334155" strokeWidth="1" />

        {/* Supports */}
        {cfg.beamType === 'simply-supported' && (
          <>
            {/* Pin Support Left */}
            <g>
              <polygon points={`${m},${by + 6} ${m - 12},${by + 25} ${m + 12},${by + 25}`} fill="#22c55e" strokeWidth="2" stroke="#16a34a" />
              <line x1={m - 16} y1={by + 25} x2={m + 16} y2={by + 25} stroke="#000" strokeWidth="2" />
              {res && res.reactions && <text x={m} y={by + 43} textAnchor="middle" fontSize="11" fill="#16a34a" fontWeight="700">R₁={fmt(res.reactions.R1, 'force')}{uForce}</text>}
            </g>
            {/* Roller Support Right */}
            <g>
              <polygon points={`${m + bl},${by + 6} ${m + bl - 12},${by + 25} ${m + bl + 12},${by + 25}`} fill="#22c55e" strokeWidth="2" stroke="#16a34a" />
              <circle cx={m + bl - 6} cy={by + 33} r={4} fill="#94a3b8" />
              <circle cx={m + bl + 6} cy={by + 33} r={4} fill="#94a3b8" />
              <line x1={m + bl - 16} y1={by + 37} x2={m + bl + 16} y2={by + 37} stroke="#000" strokeWidth="2" />
              {res && res.reactions && <text x={m + bl} y={by + 52} textAnchor="middle" fontSize="11" fill="#16a34a" fontWeight="700">R₂={fmt(res.reactions.R2, 'force')}{uForce}</text>}
            </g>
          </>
        )}

        {cfg.beamType === 'cantilever' && (
          <g>
            {/* Fixed Wall Left */}
            <rect x={m - 16} y={by - 40} width={16} height={80} fill="#cbd5e1" strokeWidth="2" stroke="#64748b" />
            {[...Array(8)].map((_, i) => (
              <line key={i} x1={m - 16} y1={by - 40 + i * 10} x2={m - 24} y2={by - 32 + i * 10} stroke="#64748b" strokeWidth="1.5" />
            ))}
            {res && res.reactions && (
              <>
                 <text x={m - 20} y={by - 50} textAnchor="end" fontSize="10" fill="#16a34a" fontWeight="600">M₁={fmt(res.reactions.M1, 'moment')}{uMom}</text>
                 <text x={m - 20} y={by + 60} textAnchor="end" fontSize="10" fill="#16a34a" fontWeight="600">R₁={fmt(res.reactions.R1, 'force')}{uForce}</text>
              </>
            )}
          </g>
        )}

        {cfg.beamType === 'fixed-fixed' && (
          <>
            <g>
              <rect x={m - 16} y={by - 40} width={16} height={80} fill="#cbd5e1" strokeWidth="2" stroke="#64748b" />
              {[...Array(8)].map((_, i) => (
                <line key={i} x1={m - 16} y1={by - 40 + i * 10} x2={m - 24} y2={by - 32 + i * 10} stroke="#64748b" strokeWidth="1.5" />
              ))}
            </g>
            <g>
              <rect x={m + bl} y={by - 40} width={16} height={80} fill="#cbd5e1" strokeWidth="2" stroke="#64748b" />
              {[...Array(8)].map((_, i) => (
                <line key={i} x1={m + bl + 16} y1={by - 40 + i * 10} x2={m + bl + 24} y2={by - 32 + i * 10} stroke="#64748b" strokeWidth="1.5" />
              ))}
            </g>
          </>
        )}

        {/* Loads */}
        {loads.map((ld, i) => {
          if (ld.type === 'point') {
            const x = m + (ld.position || 0) * sc;
            return (
              <g key={ld.id}>
                <defs>
                  <marker id={`arrow-${i}`} markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto">
                    <path d="M0,0 L0,10 L10,5 z" fill="#ef4444" />
                  </marker>
                </defs>
                <line x1={x} y1={by - 65} x2={x} y2={by - 10} stroke="#ef4444" strokeWidth="3" markerEnd={`url(#arrow-${i})`} />
                <text x={x} y={by - 70} textAnchor="middle" fontSize="11" fill="#ef4444" fontWeight="700">{fmt(ld.magnitude || 0, 'force')}{uForce}</text>
              </g>
            );
          } else if (ld.type === 'udl') {
            const x1 = m + (ld.startPosition || 0) * sc;
            const x2 = m + (ld.endPosition || 0) * sc;
            const yLine = by - 55;
            return (
              <g key={ld.id}>
                <defs>
                  <marker id={`u${i}`} markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                    <polygon points="0 0,6 3,0 6" fill="#ef4444" />
                  </marker>
                </defs>
                <line x1={x1} y1={yLine} x2={x2} y2={yLine} stroke="#ef4444" strokeWidth="2" />
                {[...Array(6)].map((_, j) => {
                  const x = x1 + ((x2 - x1) * j) / 5;
                  return <line key={j} x1={x} y1={yLine} x2={x} y2={by - 8} stroke="#ef4444" strokeWidth="1.5" markerEnd={`url(#u${i})`} />;
                })}
                <text x={(x1 + x2) / 2} y={by - 65} textAnchor="middle" fontSize="11" fill="#ef4444" fontWeight="700">{fmt(ld.magnitude || 0, 'distributed')}{uDist}</text>
              </g>
            );
          } else if (ld.type === 'triangular') {
             const x1 = m + (ld.startPosition || 0) * sc;
             const x2 = m + (ld.endPosition || 0) * sc;
             const h1 = (ld.startMagnitude || 0) * 3; // Scaling height for visual (unitless factor for pixels)
             const h2 = (ld.endMagnitude || 0) * 3;
             return (
               <g key={ld.id}>
                 <defs>
                  <marker id={`t${i}`} markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                    <polygon points="0 0,6 3,0 6" fill="#f97316" />
                  </marker>
                </defs>
                {/* Top line connecting magnitudes */}
                <line x1={x1} y1={by - 15 - h1} x2={x2} y2={by - 15 - h2} stroke="#f97316" strokeWidth="2" />
                {[...Array(6)].map((_, j) => {
                  const x = x1 + ((x2 - x1) * j) / 5;
                  const ratio = j / 5;
                  const hAtX = h1 + (h2 - h1) * ratio;
                  // Don't draw if height is basically 0
                  if (hAtX < 2) return null;
                  return <line key={j} x1={x} y1={by - 15 - hAtX} x2={x} y2={by - 8} stroke="#f97316" strokeWidth="1.5" markerEnd={`url(#t${i})`} />;
                })}
                 <text x={(x1 + x2) / 2} y={by - 65} textAnchor="middle" fontSize="11" fill="#f97316" fontWeight="700">Triangular</text>
               </g>
             )
          }
          return null;
        })}

        {/* Dimension Line */}
        <line x1={m} y1={by + 75} x2={m + bl} y2={by + 75} stroke="#64748b" strokeWidth="1.5" />
        <line x1={m} y1={by + 70} x2={m} y2={by + 80} stroke="#64748b" strokeWidth="1.5" />
        <line x1={m + bl} y1={by + 70} x2={m + bl} y2={by + 80} stroke="#64748b" strokeWidth="1.5" />
        <text x={m + bl / 2} y={by + 90} textAnchor="middle" fontSize="12" fill="#475569" fontWeight="600">L = {fmt(cfg.length, 'length')} {uLen}</text>
      </svg>
    </div>
  );
};

export default BeamVisualizer;
