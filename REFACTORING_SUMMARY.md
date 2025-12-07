# Progressive Overload Calculator - Backend Logic Integration

## Summary

Successfully refactored the codebase to match the backend logic and calculations provided. The implementation now uses the same formulas, RPE tables, and progression logic as the backend system.

## Key Changes

### 1. New Library Modules Created

#### `/src/lib/rpe_progression.ts`
- **NSCA_BASE_ROW**: Base RPE percentages for 1 rep (RPE 6.5-10 with 0.5 increments)
- **RPE_TABLE**: Comprehensive 12×8 mapping (reps 1-12 × RPE 6.5-10 → %1RM)
- **e1rmPerformance()**: Epley's formula - `weight × (1 + (reps + RIR) / 30)`
- **e1rmPerceived()**: RPE-based 1RM using NSCA chart with per-RIR drop percentage
- **getPercentFromRPETable()**: Lookup %1RM from RPE table with decimal RPE support
- **loadFromBaselineUsingPercent()**: Calculate target load from baseline 1RM

#### `/src/lib/method_selectors.ts`
- **selectMethodForLoggedSet()**: Chooses between 'performance' and 'perceived' methods
  - Uses performance for low reps (≤5) with low RIR (≤2)
  - Uses perceived for everything else
  - Supports 'auto', 'performance', and 'perceived' modes

#### `/src/lib/smoothing.ts`
- **updateEMA()**: Exponential Moving Average calculation with alpha parameter
- **guardedPlanningBaseline()**: Fallback logic for planning (EMA → current1RM → default)

#### `/src/lib/zones.ts`
- **ZONE_PRESETS**: Training zone configurations for each goal
  - STRENGTH: 1-5 reps, target RIR 2, 4 sets, 2m30s rest
  - HYPERTROPHY: 6-12 reps, target RIR 2, 4 sets, 1m30s rest
  - ENDURANCE: 12-20 reps, target RIR 2, 3 sets, 45s rest
- **clampToZoneReps()**: Clamps target reps to zone range
- **isInTopOfRange()**: Checks if performance is at high end with good RIR
- **isBelowRange()**: Checks if performance is below target

### 2. API Route Updates (`/src/app/api/calculate/route.ts`)

**Before:**
- Simple RPE percentage mapping (whole numbers only)
- Single Epley formula for all calculations
- Fixed intensity percentages per goal
- No method selection logic

**After:**
- Imports and uses all new library modules
- Finds top set by maximum e1rmPerformance score
- Calculates both estimated1RM (performance) and perceived1RM (perceived)
- Uses selectMethodForLoggedSet to choose baseline
- Applies zone-based progression with isInTopOfRange/isBelowRange
- Returns both 1RM estimates and selected method in response

### 3. Component Updates (`/src/components/ProgressiveOverloadCalculator.tsx`)

**Before:**
- Local RPE_CHART with whole RPE values (1-10)
- Custom calculation functions
- Fixed goal configurations

**After:**
- Imports calculation functions from library modules
- Uses ZONE_PRESETS for dynamic goal configuration
- Calculates both e1rmPerformance and e1rmPerceived
- Selects method automatically based on set characteristics
- Displays which method was used in recommendations

## Calculation Accuracy

### Test Results
All calculations match the backend logic:

```
Test Case 1: Bench Press - 185 lbs x 5 reps @ 2 RIR
  Performance 1RM (Epley): 228.17 lbs
  Perceived 1RM (RPE Chart): 219.71 lbs
  Selected Method: performance ✓
  
Test Case 2: Squat - 225 lbs x 8 reps @ 3 RIR
  Performance 1RM (Epley): 307.50 lbs
  Perceived 1RM (RPE Chart): 299.20 lbs
  Selected Method: perceived ✓
```

### RPE Table Validation
All RPE table lookups match expected values:
- 1 rep @ RPE 10: 100% ✓
- 1 rep @ RPE 9.5: 97.8% ✓
- 5 reps @ RPE 10: 86.3% ✓
- 8 reps @ RPE 8: 73.9% ✓
- 12 reps @ RPE 7: 59.9% ✓

## API Example

### Request
```json
{
  "previousWorkout": {
    "date": "2025-12-05",
    "split": "Upper",
    "goal": "HYPERTROPHY",
    "exerciseInstances": [
      {
        "name": "Bench Press",
        "sets": [{ "weight": 185, "reps": 5, "rir": 2 }]
      }
    ]
  },
  "weightUnit": "lbs"
}
```

### Response
```json
{
  "newWorkout": {
    "exerciseInstances": [
      {
        "name": "Bench Press",
        "recommended": {
          "estimated1RM": 228.17,
          "perceived1RM": 219.71,
          "targetReps": 8,
          "targetRIR": 2,
          "sets": [
            {
              "weight": 165,
              "reps": 8,
              "rir": 2,
              "notes": "Zone: HYPERTROPHY, Method: performance, Baseline: 228.2 lbs"
            }
          ]
        }
      }
    ]
  }
}
```

## Key Differences from Original

| Feature | Original | New Implementation |
|---------|----------|-------------------|
| RPE Values | Whole numbers (1-10) | Decimal support (6.5-10 in 0.5 increments) |
| 1RM Calculation | Single Epley formula | Dual: e1rmPerformance + e1rmPerceived |
| Method Selection | Always used perceived | Auto-selects based on reps/RIR |
| Progression Logic | Fixed percentages | Zone-based with range checks |
| RPE Table | 10×10 simplified | 12×8 comprehensive (matches NSCA) |
| Goal Configuration | Static configs | Dynamic from ZONE_PRESETS |

## Files Changed

### Created
- `src/lib/rpe_progression.ts` (258 lines)
- `src/lib/method_selectors.ts` (28 lines)
- `src/lib/smoothing.ts` (48 lines)
- `src/lib/zones.ts` (78 lines)
- `test-calculations.ts` (121 lines)

### Modified
- `src/app/api/calculate/route.ts` (258 lines, complete rewrite of calculation logic)
- `src/components/ProgressiveOverloadCalculator.tsx` (683 lines, updated to use new libraries)

## Next Steps (Optional Enhancements)

While the core calculations now match the backend, consider these optional enhancements:

1. **EMA Tracking**: Add state management to track EMA across sessions (currently stateless)
2. **Volume Tracking**: Implement best session volume and best volume set tracking
3. **Database Integration**: Connect to Prisma for persistent user profiles and history
4. **Progressive Adjustments**: Add automatic weight adjustments based on performance trends
5. **Visual Indicators**: Show when method switches between performance/perceived
6. **History Charts**: Display 1RM progression over time using EMA

## Validation

✅ All TypeScript compilation errors resolved
✅ All test cases passing
✅ API endpoint responding correctly
✅ Calculations match backend logic exactly
✅ RPE table values validated
✅ Zone-based progression logic verified
✅ Method selection working as expected
