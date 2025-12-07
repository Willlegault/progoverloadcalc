/**
 * RPE Progression Library
 * Implements e1rmPerformance, e1rmPerceived, and RPE table lookups
 */

// NSCA Base Row: RPE values for 1 rep at different RPE levels
export const NSCA_BASE_ROW = new Map<number, number>([
  [10, 100],
  [9.5, 97.8],
  [9, 95.5],
  [8.5, 93.9],
  [8, 92.2],
  [7.5, 90.7],
  [7, 89.2],
  [6.5, 87.8],
]);

// RPE Table: reps (1-12) × RPE (6.5-10) → %1RM
export const RPE_TABLE = new Map<number, Map<number, number>>([
  [
    1,
    new Map([
      [10, 100],
      [9.5, 97.8],
      [9, 95.5],
      [8.5, 93.9],
      [8, 92.2],
      [7.5, 90.7],
      [7, 89.2],
      [6.5, 87.8],
    ]),
  ],
  [
    2,
    new Map([
      [10, 95.5],
      [9.5, 93.9],
      [9, 92.2],
      [8.5, 90.7],
      [8, 89.2],
      [7.5, 87.8],
      [7, 86.4],
      [6.5, 85],
    ]),
  ],
  [
    3,
    new Map([
      [10, 92.2],
      [9.5, 90.7],
      [9, 89.2],
      [8.5, 87.8],
      [8, 86.4],
      [7.5, 85],
      [7, 83.7],
      [6.5, 82.4],
    ]),
  ],
  [
    4,
    new Map([
      [10, 89.2],
      [9.5, 87.8],
      [9, 86.4],
      [8.5, 85],
      [8, 83.7],
      [7.5, 82.4],
      [7, 81.1],
      [6.5, 79.8],
    ]),
  ],
  [
    5,
    new Map([
      [10, 86.3],
      [9.5, 85],
      [9, 83.7],
      [8.5, 82.4],
      [8, 81.1],
      [7.5, 79.9],
      [7, 78.6],
      [6.5, 77.4],
    ]),
  ],
  [
    6,
    new Map([
      [10, 83.7],
      [9.5, 82.4],
      [9, 81.1],
      [8.5, 79.9],
      [8, 78.6],
      [7.5, 77.4],
      [7, 76.2],
      [6.5, 75.1],
    ]),
  ],
  [
    7,
    new Map([
      [10, 81.1],
      [9.5, 79.9],
      [9, 78.6],
      [8.5, 77.4],
      [8, 76.2],
      [7.5, 75.1],
      [7, 73.9],
      [6.5, 72.3],
    ]),
  ],
  [
    8,
    new Map([
      [10, 78.6],
      [9.5, 77.4],
      [9, 76.2],
      [8.5, 75.1],
      [8, 73.9],
      [7.5, 72.3],
      [7, 70.7],
      [6.5, 69.4],
    ]),
  ],
  [
    9,
    new Map([
      [10, 76.2],
      [9.5, 75.1],
      [9, 73.9],
      [8.5, 72.3],
      [8, 70.7],
      [7.5, 69.4],
      [7, 68],
      [6.5, 66.7],
    ]),
  ],
  [
    10,
    new Map([
      [10, 73.9],
      [9.5, 72.3],
      [9, 70.7],
      [8.5, 69.4],
      [8, 68],
      [7.5, 66.7],
      [7, 65.3],
      [6.5, 64],
    ]),
  ],
  [
    11,
    new Map([
      [10, 70.7],
      [9.5, 69.4],
      [9, 68],
      [8.5, 66.7],
      [8, 65.3],
      [7.5, 64],
      [7, 62.6],
      [6.5, 61.3],
    ]),
  ],
  [
    12,
    new Map([
      [10, 68],
      [9.5, 66.7],
      [9, 65.3],
      [8.5, 64],
      [8, 62.6],
      [7.5, 61.3],
      [7, 59.9],
      [6.5, 58.6],
    ]),
  ],
]);

/**
 * Epley's formula for performance-based 1RM
 * 1RM = weight × (1 + (reps + RIR) / 30)
 */
export function e1rmPerformance(weight: number, reps: number, RIR: number): number {
  return weight * (1 + (reps + RIR) / 30);
}

/**
 * RPE-based perceived 1RM using NSCA chart
 * Uses per-RIR drop percentage to estimate 1RM
 */
export function e1rmPerceived(
  weight: number,
  reps: number,
  RIR: number,
  baseRow: Map<number, number> = NSCA_BASE_ROW,
  perRirDropPct: number = 2.0
): number {
  const RPE = 10 - RIR;
  
  // Clamp RPE to valid range
  const clampedRPE = Math.max(6.5, Math.min(10, RPE));
  
  // Find the closest RPE value in the base row
  const availableRPEs = Array.from(baseRow.keys()).sort((a, b) => b - a);
  let closestRPE = availableRPEs[0];
  let minDiff = Math.abs(clampedRPE - closestRPE);
  
  for (const rpeVal of availableRPEs) {
    const diff = Math.abs(clampedRPE - rpeVal);
    if (diff < minDiff) {
      minDiff = diff;
      closestRPE = rpeVal;
    }
  }
  
  const basePercent = baseRow.get(closestRPE) ?? 100;
  
  // Adjust for additional reps beyond 1
  const additionalReps = Math.max(0, reps - 1);
  const adjustedPercent = basePercent - (additionalReps * perRirDropPct);
  
  return (weight / adjustedPercent) * 100;
}

/**
 * Get percentage from RPE table for given reps and RPE
 */
export function getPercentFromRPETable(reps: number, RPE: number): number {
  const clampedReps = Math.max(1, Math.min(12, Math.round(reps)));
  const clampedRPE = Math.max(6.5, Math.min(10, RPE));
  
  const repsMap = RPE_TABLE.get(clampedReps);
  if (!repsMap) return 75; // fallback
  
  // Find closest RPE in the map
  const availableRPEs = Array.from(repsMap.keys()).sort((a, b) => b - a);
  let closestRPE = availableRPEs[0];
  let minDiff = Math.abs(clampedRPE - closestRPE);
  
  for (const rpeVal of availableRPEs) {
    const diff = Math.abs(clampedRPE - rpeVal);
    if (diff < minDiff) {
      minDiff = diff;
      closestRPE = rpeVal;
    }
  }
  
  return repsMap.get(closestRPE) ?? 75;
}

/**
 * Calculate load from baseline 1RM using target reps, RIR, and per-RIR drop
 */
export function loadFromBaselineUsingPercent(
  baseline1RM: number,
  targetReps: number,
  targetRIR: number,
  roundIncrement: number = 2.5
): number {
  const targetRPE = 10 - targetRIR;
  const basePercent = getPercentFromRPETable(targetReps, targetRPE);
  
  // Apply per-RIR adjustment if needed (already factored into table lookup in most cases)
  const loadKg = (baseline1RM * basePercent) / 100;
  
  // Round to increment
  return Math.round(loadKg / roundIncrement) * roundIncrement;
}
