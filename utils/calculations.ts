import { BeamConfig, Load, AnalysisResult, SectionProperties, MATERIALS, SectionType, SectionDimensions } from '../types';

export const calcSection = (type: SectionType, d: SectionDimensions): SectionProperties => {
  let A = 0, I = 0, c = 0;
  
  if (type === 'rectangle') { 
    const b = d.width || 0.1, h = d.height || 0.1; 
    A = b * h; 
    I = b * Math.pow(h, 3) / 12; 
    c = h / 2; 
  }
  else if (type === 'circle') { 
    const r = (d.diameter || 0.1) / 2; 
    A = Math.PI * Math.pow(r, 2); 
    I = Math.PI * Math.pow(r, 4) / 4; 
    c = r; 
  }
  else if (type === 'hollow-circle') { 
    const ro = (d.outerDiameter || 0.1) / 2;
    const ri = (d.innerDiameter || 0.08) / 2; 
    A = Math.PI * (Math.pow(ro, 2) - Math.pow(ri, 2)); 
    I = Math.PI * (Math.pow(ro, 4) - Math.pow(ri, 4)) / 4; 
    c = ro; 
  }
  else if (type === 'i-beam') { 
    const bf = d.flangeWidth || 0.1;
    const tf = d.flangeThickness || 0.01;
    const hw = d.webHeight || 0.2;
    const tw = d.webThickness || 0.01;
    const h = hw + 2 * tf; 
    // Simplified I-beam I calculation (Parallel axis theorem applied)
    // Flanges
    const I_flanges = 2 * ( (bf * Math.pow(tf, 3) / 12) + (bf * tf * Math.pow(hw/2 + tf/2, 2)) );
    // Web
    const I_web = tw * Math.pow(hw, 3) / 12;
    
    A = 2 * bf * tf + hw * tw; 
    I = I_flanges + I_web; 
    c = h / 2; 
  }
  
  // Prevent division by zero later
  if (I === 0) I = 0.00001;
  if (c === 0) c = 0.00001;
  
  return { area: A, I, c };
};

export const analyzeBeam = (cfg: BeamConfig, loads: Load[]): AnalysisResult => {
  const L = cfg.length;
  const mat = MATERIALS[cfg.material];
  const E = mat.E * 1e9; // Convert GPa to Pa
  const sy = mat.yieldStrength * 1e6; // Convert MPa to Pa
  const { I, c } = cfg.sectionProps;
  const fos = cfg.factorOfSafety;

  if (loads.length === 0) {
    return { error: 'Add at least one load to run analysis' };
  }

  // 1. Calculate Statics (Reactions)
  let sumFy = 0; // Sum of external vertical forces
  let sumM_start = 0; // Sum of moments about x=0 from external forces

  // Pre-calculate sums for basic statics (Simply Supported / Cantilever)
  loads.forEach(ld => {
    if (ld.type === 'point') { 
      const P = (ld.magnitude || 0) * 1000; // kN -> N
      const pos = ld.position || 0;
      sumFy += P; 
      sumM_start += P * pos; 
    }
    else if (ld.type === 'udl') { 
      const w = (ld.magnitude || 0) * 1000; // kN/m -> N/m
      const start = ld.startPosition || 0;
      const end = ld.endPosition || 0;
      const len = end - start;
      const totalLoad = w * len;
      const center = start + len / 2;
      sumFy += totalLoad;
      sumM_start += totalLoad * center; 
    }
    else if (ld.type === 'triangular') { 
      const start = ld.startPosition || 0;
      const end = ld.endPosition || 0;
      const len = end - start;
      const w1 = (ld.startMagnitude || 0) * 1000;
      const w2 = (ld.endMagnitude || 0) * 1000;
      
      const totalLoad = 0.5 * (w1 + w2) * len;
      
      // Moment of the trapezoidal load about its own start position (local x=0)
      const momentAboutLoadStart = (Math.pow(len, 2) * (w1 + 2 * w2)) / 6;
      
      sumFy += totalLoad;
      sumM_start += momentAboutLoadStart + (totalLoad * start); 
    }
  });

  let R1 = 0, R2 = 0, M1 = 0; // Reactions

  if (cfg.beamType === 'simply-supported') { 
    // Sum M_point_1 = 0 => R2 * L - sumM_start = 0
    R2 = sumM_start / L; 
    R1 = sumFy - R2; 
  }
  else if (cfg.beamType === 'cantilever') { 
    // Fixed at x=0
    R1 = sumFy; 
    M1 = sumM_start; // Reaction moment opposes the load moment
  }
  else if (cfg.beamType === 'fixed-fixed') {
    // Indeterminate Beam - Fixed End Moments (FEM)
    let fixedMomentLeft = 0; // FEM at x=0 (Counter-Clockwise positive)
    let fixedMomentRight = 0; // FEM at x=L (Clockwise positive)
    let reactionLeft_forceOnly = 0; // Part of R1 due to force balance if simply supported

    // We calculate R1 and R2 using Superposition of Fixed End Moments
    loads.forEach(ld => {
        if (ld.type === 'point') {
            const P = (ld.magnitude || 0) * 1000;
            const a = ld.position || 0;
            const b = L - a;
            
            // Standard Fixed-Fixed Point Load Formulas
            const M_L = (P * a * Math.pow(b, 2)) / Math.pow(L, 2);
            const M_R = (P * Math.pow(a, 2) * b) / Math.pow(L, 2);
            
            fixedMomentLeft += M_L;
            fixedMomentRight += M_R;
        } else if (ld.type === 'udl') {
             // Approximation: Treat UDL as a point load at center for FEM (Simpler than exact integration for partial UDLs)
             // For professional accuracy, we'd need exact partial UDL formulas, but this is better than the previous simple avg
             const w = (ld.magnitude || 0) * 1000;
             const start = ld.startPosition || 0;
             const end = ld.endPosition || 0;
             const length = end - start;
             const P_equiv = w * length;
             const a = start + length/2;
             const b = L - a;

             // Using Point Load Equivalent for Moment Approximation
             const M_L = (P_equiv * a * Math.pow(b, 2)) / Math.pow(L, 2);
             const M_R = (P_equiv * Math.pow(a, 2) * b) / Math.pow(L, 2);

             fixedMomentLeft += M_L;
             fixedMomentRight += M_R;
        } else {
             // Fallback for triangular: treat as point load at centroid
             // (This is an approximation)
             const start = ld.startPosition || 0;
             const end = ld.endPosition || 0;
             const w1 = (ld.startMagnitude || 0) * 1000;
             const w2 = (ld.endMagnitude || 0) * 1000;
             const len = end - start;
             const P_equiv = 0.5 * (w1 + w2) * len;
             // Centroid distance from start
             const c_dist = (len * (w1 + 2*w2)) / (3 * (w1 + w2));
             const a = start + c_dist;
             const b = L - a;

             const M_L = (P_equiv * a * Math.pow(b, 2)) / Math.pow(L, 2);
             const M_R = (P_equiv * Math.pow(a, 2) * b) / Math.pow(L, 2);

             fixedMomentLeft += M_L;
             fixedMomentRight += M_R;
        }
    });

    // M1 (Wall Moment) corresponds to the Fixed End Moment
    M1 = fixedMomentLeft;
    
    // R1 = (Sum Forces * Distance to R2 + M_Reaction_Left - M_Reaction_Right) / L ?
    // Using Slope Deflection or simpler Superposition:
    // R1 = R_simply_supported + (M_left - M_right) / L
    // Note: Our M1/M_left is CounterClockwise (Hogging), M_right is Clockwise (Hogging)
    // R1_ss (Simply Supported R1)
    const R1_ss = (sumM_start / L); // Wait, sumM_start is Moment about 0. So R2_ss = sumM_start / L.
    const R2_ss = sumM_start / L;
    const R1_simple = sumFy - R2_ss;

    // Adjust for the fixed moments
    // The moments at supports push the beam down/up.
    // Sum M about R2 = 0 => R1*L - Sum_Load_Moments - M1 + M2 = 0  (Sign convention varies)
    // Let's use standard formula: R1 = R1_simple + (M1 - M2) / L
    // Where M1 and M2 are the magnitude of fixing moments (hogging).
    // If M1 is CCW and M2 is CW (both hogging), then:
    R1 = R1_simple + (fixedMomentLeft - fixedMomentRight) / L;
    R2 = sumFy - R1;
  }

  // 2. Generate Diagram Data
  const points = 150;
  const sd: { x: number, V: number }[] = [];
  const md: { x: number, M: number }[] = [];
  let maxV = 0;
  let maxM = 0;

  for (let i = 0; i <= points; i++) {
    const x = (i / points) * L;
    
    // Initial values based on reactions
    let V = R1;
    let M = 0;

    if (cfg.beamType === 'cantilever') {
        // For cantilever (fixed at left), Moment starts at -M1 (Hogging)
        M = -M1 + R1 * x;
    } else if (cfg.beamType === 'simply-supported') {
        M = R1 * x;
    } else if (cfg.beamType === 'fixed-fixed') {
        // Fixed Fixed starts with hogging moment -M1
        M = -M1 + R1 * x;
    }

    // Apply loads (Singularity Functions approach logic)
    loads.forEach(ld => {
      if (ld.type === 'point') {
        const P = (ld.magnitude || 0) * 1000;
        const pos = ld.position || 0;
        if (x >= pos) {
          V -= P;
          M -= P * (x - pos);
        }
      } 
      else if (ld.type === 'udl') {
        const w = (ld.magnitude || 0) * 1000;
        const start = ld.startPosition || 0;
        const end = ld.endPosition || 0;
        
        if (x > start) {
          const effEnd = Math.min(x, end);
          const effLen = effEnd - start;
          const loadP = w * effLen;
          const momentArm = x - (start + effLen / 2);
          
          V -= loadP;
          M -= loadP * momentArm;
        }
      }
      else if (ld.type === 'triangular') {
        const start = ld.startPosition || 0;
        const end = ld.endPosition || 0;
        const totalLen = end - start;
        
        if (x > start && totalLen > 0) {
          const w1 = (ld.startMagnitude || 0) * 1000;
          const w2 = (ld.endMagnitude || 0) * 1000;
          
          const effEnd = Math.min(x, end);
          const effLen = effEnd - start;
          
          // Interpolate w at current effective end (x or end)
          const wx = w1 + (w2 - w1) * (effLen / totalLen);
          
          // Trapezoid area for V
          const loadP = 0.5 * (w1 + wx) * effLen;
          
          // Moment about x (the cut section)
          const momentContrib = (Math.pow(effLen, 2) * (2 * w1 + wx)) / 6;
          
          V -= loadP;
          
          if (x <= end) {
             M -= momentContrib;
          } else {
             // Entire load is passed
             const fullLoadMomentAboutEnd = (Math.pow(totalLen, 2) * (2 * w1 + w2)) / 6;
             M -= fullLoadMomentAboutEnd + (loadP * (x - end));
          }
        }
      }
    });

    sd.push({ x, V: V / 1000 }); // Store in kN
    md.push({ x, M: M / 1000 }); // Store in kNm

    if (Math.abs(V/1000) > Math.abs(maxV)) maxV = V / 1000;
    if (Math.abs(M/1000) > Math.abs(maxM)) maxM = M / 1000;
  }

  // 3. Stress & Safety
  const maxM_Nm = Math.abs(maxM) * 1000;
  const stress = (maxM_Nm * c) / I; // Pa
  const aFOS = sy / (stress || 1); // Prevent NaN if stress is 0
  const status = aFOS < fos ? 'failure' : aFOS < fos * 1.2 ? 'warning' : 'safe';
  
  // 4. Deflection Estimate (Simplified Max Deflection formulas)
  let defl = 0;
  if (loads.length > 0) {
      // Note: These are simplified "worst case" estimations based on total load P
      // For accurate deflection at every point, double integration of the Moment array is needed.
      if (cfg.beamType === 'simply-supported') {
        defl = (5 * sumFy * Math.pow(L, 3)) / (384 * E * I);
      } else if (cfg.beamType === 'cantilever') {
        defl = (sumFy * Math.pow(L, 3)) / (3 * E * I);
      } else {
        // Fixed-Fixed
        defl = (sumFy * Math.pow(L, 3)) / (384 * E * I);
      }
  }

  return { 
    reactions: { R1: R1 / 1000, R2: R2 / 1000, M1: M1 / 1000 }, 
    shearData: sd, 
    momentData: md, 
    maxShear: maxV, 
    maxMoment: maxM, 
    maxStress: stress / 1e6, // MPa
    maxDeflection: defl * 1000, // mm
    actualFOS: aFOS, 
    safetyStatus: status, 
    allowableStress: sy / fos / 1e6 
  };
};