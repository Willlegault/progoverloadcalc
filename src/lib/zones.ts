/**
 * Training Zones Configuration
 * Defines rep ranges, RIR targets, and progression logic for each training goal
 */

export type TrainingGoal = 'STRENGTH' | 'HYPERTROPHY' | 'ENDURANCE';

interface ZonePreset {
  low: number;           // Low end of rep range
  high: number;          // High end of rep range
  defaultReps: number;   // Default target reps for planning
  targetRIR: number;     // Target RIR for this zone
  sets: number;          // Recommended number of sets
  restTime: string;      // Rest time between sets
}

export const ZONE_PRESETS: Record<TrainingGoal, ZonePreset> = {
  STRENGTH: {
    low: 1,
    high: 5,
    defaultReps: 3,
    targetRIR: 2,
    sets: 3,
    restTime: '2 minutes 30 seconds',
  },
  HYPERTROPHY: {
    low: 6,
    high: 12,
    defaultReps: 8,
    targetRIR: 2,
    sets: 3,
    restTime: '1 minute 30 seconds',
  },
  ENDURANCE: {
    low: 12,
    high: 20,
    defaultReps: 15,
    targetRIR: 2,
    sets: 3,
    restTime: '45 seconds',
  },
};

/**
 * Clamp target reps to the zone's valid range
 */
export function clampToZoneReps(zone: TrainingGoal, targetReps?: number): number {
  const preset = ZONE_PRESETS[zone];
  if (!targetReps) return preset.defaultReps;
  
  return Math.max(preset.low, Math.min(preset.high, targetReps));
}

/**
 * Check if performance is in the top of the rep range with good RIR
 */
export function isInTopOfRange(
  reps: number,
  RIR: number,
  zone: TrainingGoal
): boolean {
  const preset = ZONE_PRESETS[zone];
  return reps >= preset.high && RIR <= preset.targetRIR;
}

/**
 * Check if performance is below the target range
 */
export function isBelowRange(
  reps: number,
  RIR: number,
  zone: TrainingGoal
): boolean {
  const preset = ZONE_PRESETS[zone];
  return reps < preset.low || RIR > preset.targetRIR + 1;
}
