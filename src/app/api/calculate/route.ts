import { NextResponse } from "next/server";

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

const RPE_PERCENT: Record<number, number> = {
    // mapping integer RPE -> %1RM (examples, adjustable)
    10: 1.0,
    9: 0.97,
    8: 0.92,
    7: 0.87,
    6: 0.83,
    5: 0.79,
};

const GOAL_INTENSITY: Record<Goal, number> = {
    STRENGTH: 0.925,
    HYPERTROPHY: 0.75,
    ENDURANCE: 0.575,
};

const GOAL_REPS: Record<Goal, number> = {
    STRENGTH: 5,
    HYPERTROPHY: 10,
    ENDURANCE: 15,
};

const GOAL_SETS: Record<Goal, number> = {
    STRENGTH: 3,
    HYPERTROPHY: 4,
    ENDURANCE: 3,
};

function rpeFromRIR(rir: number): number {
    // simple inference: RPE = 10 - RIR
    const r = 10 - (isFinite(rir) ? rir : 2);
    if (r >= 10) return 10;
    if (r <= 5) return 5;
    return Math.round(r);
}

function percentFromRPE(rpe: number): number {
    return RPE_PERCENT[rpe] ?? 0.92; // default to RPE 8 if unknown
}

function epley1RM(weight: number, reps: number, rir = 0): number {
    // Epley's formula using reps + RIR per user's spec
    return weight * (1 + (reps + rir) / 30);
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
            // compute per-set metrics
            const sets = (ex.sets || []).map((s) => {
                const rir = s.rir ?? 2; // default RIR if missing
                const rpe = rpeFromRIR(rir);
                const percent = percentFromRPE(rpe);
                const perceived1RM = s.weight / percent; // weight at RPE -> 1RM
                const epley = epley1RM(s.weight, s.reps, rir);
                const volume = s.weight * s.reps;
                return { ...s, rir, rpe, percent, perceived1RM, epley, volume };
            });

            // pick representative 1RM: use the max of perceived and epley across sets
            const maxPerceived = Math.max(...sets.map((ss) => ss.perceived1RM));
            const maxEpley = Math.max(...sets.map((ss) => ss.epley));
            const representative1RM = Math.max(maxPerceived, maxEpley);

            return {
                id: ex.id,
                name: ex.name,
                group: ex.group,
                sets,
                representative1RM,
            };
        });

        // Build recommendations using goal from previous workout if present, else default to HYPERTROPHY
        const goal: Goal = (previousWorkout.goal as Goal) ?? "HYPERTROPHY";

        const recommendedExercises = exercises.map((ex) => {
            const targetIntensity = GOAL_INTENSITY[goal];
            const targetReps = GOAL_REPS[goal];
            const setsCount = GOAL_SETS[goal];

            // compute raw target weight (use lbs for rounding logic)
            const rep1rmLbs = toLbs(ex.representative1RM, unit);
            let targetLbs = rep1rmLbs * targetIntensity;
            // round to nearest 2.5 lbs
            targetLbs = roundToNearest25lbs(targetLbs);
            const targetWeight = fromLbs(targetLbs, unit);

            const newSets = Array.from({ length: setsCount }).map((_, idx) => ({
                setIndex: idx + 1,
                weight: Number(targetWeight.toFixed(2)),
                reps: targetReps,
                rir: 2,
                notes: `Generated from representative 1RM ${ex.representative1RM.toFixed(2)} ${unit} using intensity ${(
                    targetIntensity * 100
                ).toFixed(1)}%`,
            }));

            return {
                id: ex.id,
                name: ex.name,
                group: ex.group,
                recommended: {
                    representative1RM: Number(ex.representative1RM.toFixed(2)),
                    targetIntensity,
                    targetReps,
                    sets: newSets,
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

        const res = NextResponse.json({ newWorkout, details: { exercises } });
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
    } catch (e) {
        // no-op in case headers are immutable in some contexts
    }
}


