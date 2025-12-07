import { NextResponse } from "next/server";
import {
  e1rmPerformance,
  e1rmPerceived,
  NSCA_BASE_ROW,
  loadFromBaselineUsingPercent,
  getPercentFromRPETable,
} from "@/lib/rpe_progression";
import { ZONE_PRESETS, clampToZoneReps, isInTopOfRange, isBelowRange } from "@/lib/zones";

/*
 Progressive overload workout generator
 Accepts a previous workout payload and a training goal and returns a new planned workout for tomorrow

 Request shape (example):
 {
     "previousWorkout": {
         "date": "2025-12-01",
         "split": "Upper",
         "goal": "HYPERTROPHY",
         "exerciseInstances": [
             {
                 "id": "bench-1",
                 "name": "Bench Press",
                 "group": "Chest",
                 "sets": [ { "weight": 175, "reps": 6, "rir": 2 }, ... ]
             }
         ]
     },
     "weightUnit": "lbs" // or "kg"
 }

 Response: new workout object with recommended sets (weights rounded to nearest 2.5 lbs)
*/

type WeightUnit = "lbs" | "kg";
type Goal = "STRENGTH" | "HYPERTROPHY" | "ENDURANCE";

interface PreviousSet {
    weight: number; // user input weight for the set
    reps: number;
    rir?: number; // reps in reserve (optional) — we assume it's provided; if not default to 2
}

interface PreviousExerciseInstance {
    id?: string;
    name: string;
    group?: string;
    sets: PreviousSet[];
}

interface PreviousWorkout {
    date?: string;
    split?: string;
    goal?: Goal;
    exerciseInstances: PreviousExerciseInstance[];
}

interface CalculateRequest {
    previousWorkout: PreviousWorkout;
    weightUnit?: WeightUnit;
}

function roundToNearest25lbs(lbs: number): number {
    // rounds to nearest 2.5 lbs
    return Math.round(lbs / 2.5) * 2.5;
}

function toLbs(value: number, unit: WeightUnit): number {
    return unit === "kg" ? value * 2.2046226218 : value;
}

function fromLbs(valueLbs: number, unit: WeightUnit): number {
    return unit === "kg" ? valueLbs / 2.2046226218 : valueLbs;
}

export async function POST(req: Request) {
    try {
        const body = (await req.json()) as CalculateRequest;
        const previousWorkout = body.previousWorkout;
        const unit: WeightUnit = body.weightUnit ?? "lbs";

        if (!previousWorkout || !Array.isArray(previousWorkout.exerciseInstances)) {
            const res = NextResponse.json({ error: "Invalid previousWorkout payload" }, { status: 400 });
            setCors(res);
            return res;
        }

        const exercises = previousWorkout.exerciseInstances.map((ex) => {
            // Find top set by maximum Epley score
            let topSet = null;
            let maxEpleyScore = 0;

            for (const s of ex.sets || []) {
                const rir = s.rir ?? 2;
                const epleyScore = e1rmPerformance(s.weight, s.reps, rir);
                
                if (epleyScore > maxEpleyScore) {
                    maxEpleyScore = epleyScore;
                    topSet = { ...s, rir };
                }
            }

            if (!topSet) {
                return {
                    id: ex.id,
                    name: ex.name,
                    group: ex.group,
                    topSet: null,
                    estimated1RM: 0,
                    perceived1RM: 0,
                };
            }

            // Calculate both 1RM estimates
            const perRirDropPct = 2.0;
            const estimated1RM = e1rmPerformance(topSet.weight, topSet.reps, topSet.rir);
            const perceived1RM = e1rmPerceived(
                topSet.weight,
                topSet.reps,
                topSet.rir,
                NSCA_BASE_ROW,
                perRirDropPct
            );

            // Always use perceived1RM (RPE-based) for progressive overload
            // RPE already accounts for how the user feels and progressive overload
            const currentBaseline = perceived1RM;
            
            // Calculate RPE and chart percentage for details
            const rpe = 10 - topSet.rir;
            const rpeChartPercent = getPercentFromRPETable(topSet.reps, rpe);

            return {
                id: ex.id,
                name: ex.name,
                group: ex.group,
                topSet: { ...topSet, rpe },
                estimated1RM,
                perceived1RM,
                currentBaseline,
                rpeChartPercent,
            };
        });

        // Build recommendations using goal from previous workout if present, else default to HYPERTROPHY
        const goal: Goal = (previousWorkout.goal as Goal) ?? "HYPERTROPHY";
        const zonePreset = ZONE_PRESETS[goal];
        const roundIncrement = 2.5;

        const recommendedExercises = exercises.map((ex) => {
            if (!ex.topSet || !ex.currentBaseline) {
                return {
                    id: ex.id,
                    name: ex.name,
                    group: ex.group,
                    perceived1RM: 0,
                    estimated1RM: 0,
                    topSetRPE: 0,
                    recommended: {
                        targetPercentRange: `${zonePreset.low}-${zonePreset.high}%`,
                        targetReps: `${zonePreset.defaultReps}`,
                        sets: [],
                    },
                };
            }

            // Determine if we should adjust weight based on performance
            const topSet = ex.topSet;
            const inTopOfRange = isInTopOfRange(topSet.reps, topSet.rir, goal);
            const belowRange = isBelowRange(topSet.reps, topSet.rir, goal);

            // Calculate base target weight from baseline
            const targetReps = clampToZoneReps(goal, zonePreset.defaultReps);
            const targetRIR = zonePreset.targetRIR;
            
            let plannedWeight = loadFromBaselineUsingPercent(
                ex.currentBaseline,
                targetReps,
                targetRIR,
                roundIncrement
            );

            // Apply progressive overload adjustments
            if (inTopOfRange) {
                plannedWeight = Math.max(roundIncrement, plannedWeight + roundIncrement);
            } else if (belowRange) {
                plannedWeight = Math.max(roundIncrement, plannedWeight - roundIncrement);
            }

            // Convert to lbs for rounding, then back to user's unit
            const plannedLbs = toLbs(plannedWeight, unit);
            const roundedLbs = roundToNearest25lbs(plannedLbs);
            const finalWeight = fromLbs(roundedLbs, unit);

            const newSets = Array.from({ length: zonePreset.sets }).map((_, idx) => ({
                setIndex: idx + 1,
                weight: Number(finalWeight.toFixed(2)),
                reps: targetReps,
                rir: targetRIR,
                notes: `Zone: ${goal}, Perceived 1RM: ${ex.currentBaseline.toFixed(1)} ${unit}`,
            }));

            return {
                id: ex.id,
                name: ex.name,
                group: ex.group,
                perceived1RM: Number(ex.perceived1RM.toFixed(2)),
                estimated1RM: Number(ex.estimated1RM.toFixed(2)),
                topSetRPE: ex.topSet.rpe,
                recommended: {
                    targetPercentRange: `${zonePreset.low}-${zonePreset.high}%`,
                    targetReps: `${targetReps}`,
                    sets: newSets.map(set => ({
                        setIndex: set.setIndex,
                        weight: set.weight,
                        reps: set.reps,
                        targetRPE: 10 - set.rir,
                        percentOf1RM: Number(((set.weight / ex.perceived1RM) * 100).toFixed(1)),
                        notes: set.notes,
                    })),
                },
            };
        });

        // Build new workout for tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        const newWorkout = {
            date: tomorrow.toISOString().split("T")[0],
            split: previousWorkout.split ?? "",
            goal,
            status: "planned",
            exerciseInstances: recommendedExercises,
        };

        // Format calculation details for frontend
        const details = {
            exercises: exercises.map((ex) => ({
                name: ex.name,
                topSet: {
                    weight: ex.topSet?.weight ?? 0,
                    reps: ex.topSet?.reps ?? 0,
                    rir: ex.topSet?.rir ?? 0,
                    rpe: ex.topSet?.rpe ?? 0,
                },
                perceived1RM: ex.perceived1RM,
                estimated1RM: ex.estimated1RM,
                rpeChartPercent: ex.rpeChartPercent ?? 0,
            })),
        };

        const res = NextResponse.json({ newWorkout, details });
        setCors(res);
        return res;
    } catch (err) {
        const res = NextResponse.json({ error: "Unexpected error", details: String(err) }, { status: 500 });
        setCors(res);
        return res;
    }
}

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: {
            "Access-Control-Allow-Origin": "http://localhost:3000",
            "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
    });
}

function setCors(res: NextResponse) {
    try {
        res.headers.set("Access-Control-Allow-Origin", "http://localhost:3000");
        res.headers.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
        res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    } catch {
        // no-op in case headers are immutable in some contexts
    }
}


