/**
 * Test calculations to verify they match backend logic
 */

import {
  e1rmPerformance,
  e1rmPerceived,
  NSCA_BASE_ROW,
  getPercentFromRPETable,
  RPE_TABLE,
} from './src/lib/rpe_progression';
import { ZONE_PRESETS, isInTopOfRange, isBelowRange } from './src/lib/zones';

console.log('=== Testing RPE Progression Calculations ===\n');

// Test Case 1: Bench Press - 185 lbs x 5 reps @ 2 RIR
console.log('Test Case 1: Bench Press - 185 lbs x 5 reps @ 2 RIR');
const weight1 = 185;
const reps1 = 5;
const rir1 = 2;

const perf1 = e1rmPerformance(weight1, reps1, rir1);
const perc1 = e1rmPerceived(weight1, reps1, rir1, NSCA_BASE_ROW, 2.0);
console.log(`  Performance 1RM (Epley): ${perf1.toFixed(2)} lbs`);
console.log(`  Perceived 1RM (RPE Chart): ${perc1.toFixed(2)} lbs`);
console.log(`  Using Perceived 1RM for all progressive overload calculations\n`);

// Test Case 2: Squat - 225 lbs x 8 reps @ 3 RIR
console.log('Test Case 2: Squat - 225 lbs x 8 reps @ 3 RIR');
const weight2 = 225;
const reps2 = 8;
const rir2 = 3;

const perf2 = e1rmPerformance(weight2, reps2, rir2);
const perc2 = e1rmPerceived(weight2, reps2, rir2, NSCA_BASE_ROW, 2.0);
console.log(`  Performance 1RM (Epley): ${perf2.toFixed(2)} lbs`);
console.log(`  Perceived 1RM (RPE Chart): ${perc2.toFixed(2)} lbs`);
console.log(`  Using Perceived 1RM for all progressive overload calculations\n`);

// Test Case 3: RPE Table Lookups
console.log('Test Case 3: RPE Table Lookups');
console.log('  1 rep @ RPE 10:', RPE_TABLE.get(1)?.get(10), '% (expected: 100)');
console.log('  1 rep @ RPE 9.5:', RPE_TABLE.get(1)?.get(9.5), '% (expected: 97.8)');
console.log('  5 reps @ RPE 10:', RPE_TABLE.get(5)?.get(10), '% (expected: 86.3)');
console.log('  8 reps @ RPE 8:', RPE_TABLE.get(8)?.get(8), '% (expected: 73.9)');
console.log('  12 reps @ RPE 7:', RPE_TABLE.get(12)?.get(7), '% (expected: 59.9)\n');

// Test Case 4: Zone Configuration
console.log('Test Case 4: Zone Configuration');
console.log('  STRENGTH zone:', JSON.stringify(ZONE_PRESETS.STRENGTH, null, 2));
console.log('  HYPERTROPHY zone:', JSON.stringify(ZONE_PRESETS.HYPERTROPHY, null, 2));
console.log('  ENDURANCE zone:', JSON.stringify(ZONE_PRESETS.ENDURANCE, null, 2));
console.log();

// Test Case 5: Zone-based progression logic
console.log('Test Case 5: Zone-based Progression Logic (HYPERTROPHY)');
const testReps = 12; // High end of hypertrophy range
const testRIR = 2;   // At target RIR
const inTop = isInTopOfRange(testReps, testRIR, 'HYPERTROPHY');
const below = isBelowRange(testReps, testRIR, 'HYPERTROPHY');
console.log(`  12 reps @ 2 RIR - In top of range: ${inTop} (should be true)`);
console.log(`  12 reps @ 2 RIR - Below range: ${below} (should be false)`);

const testReps2 = 5;  // Below hypertrophy range
const testRIR2 = 4;   // Above target RIR
const inTop2 = isInTopOfRange(testReps2, testRIR2, 'HYPERTROPHY');
const below2 = isBelowRange(testReps2, testRIR2, 'HYPERTROPHY');
console.log(`  5 reps @ 4 RIR - In top of range: ${inTop2} (should be false)`);
console.log(`  5 reps @ 4 RIR - Below range: ${below2} (should be true)\n`);

// Test Case 6: getPercentFromRPETable
console.log('Test Case 6: getPercentFromRPETable function');
const percent1 = getPercentFromRPETable(5, 8);
const percent2 = getPercentFromRPETable(8, 9);
const percent3 = getPercentFromRPETable(10, 7);
console.log(`  5 reps @ RPE 8: ${percent1}% (expected: 81.1)`);
console.log(`  8 reps @ RPE 9: ${percent2}% (expected: 75.1)`);
console.log(`  10 reps @ RPE 7: ${percent3}% (expected: 65.3)\n`);

console.log('=== All Tests Complete ===');
