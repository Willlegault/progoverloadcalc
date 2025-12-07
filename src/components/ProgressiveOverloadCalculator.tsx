"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ZONE_PRESETS } from "@/lib/zones";

type WeightUnit = "lbs" | "kg";
type Goal = "STRENGTH" | "HYPERTROPHY" | "ENDURANCE";

interface SetInput {
  weight: string;
  reps: string;
  rir: string;
}

interface ExerciseInput {
  name: string;
  sets: SetInput[];
}

interface RecommendedSet {
  setIndex: number;
  weight: number;
  reps: number;
  targetRPE: number;
  percentOf1RM: number;
  notes: string;
}

interface ExerciseRecommendation {
  id?: string;
  name: string;
  perceived1RM: number;
  estimated1RM: number;
  topSetRPE: number;
  recommended: {
    targetPercentRange: string;
    targetReps: string;
    sets: RecommendedSet[];
  };
}

interface NewWorkout {
  date: string;
  split: string;
  goal: Goal;
  status: string;
  exerciseInstances: ExerciseRecommendation[];
}

interface CalculationDetails {
  exercises: Array<{
    name: string;
    topSet: {
      weight: number;
      reps: number;
      rir: number;
      rpe: number;
    };
    perceived1RM: number;
    estimated1RM: number;
    rpeChartPercent: number;
  }>;
}

// Goal configurations based on training zones
const GOAL_CONFIG: Record<Goal, { percentRange: string; reps: string; sets: number; targetRPE: number; restTime: string }> = {
  STRENGTH: {
    percentRange: "85-100%",
    reps: `${ZONE_PRESETS.STRENGTH.low}-${ZONE_PRESETS.STRENGTH.high}`,
    sets: ZONE_PRESETS.STRENGTH.sets,
    targetRPE: 10 - ZONE_PRESETS.STRENGTH.targetRIR,
    restTime: ZONE_PRESETS.STRENGTH.restTime
  },
  HYPERTROPHY: {
    percentRange: "65-85%",
    reps: `${ZONE_PRESETS.HYPERTROPHY.low}-${ZONE_PRESETS.HYPERTROPHY.high}`,
    sets: ZONE_PRESETS.HYPERTROPHY.sets,
    targetRPE: 10 - ZONE_PRESETS.HYPERTROPHY.targetRIR,
    restTime: ZONE_PRESETS.HYPERTROPHY.restTime
  },
  ENDURANCE: {
    percentRange: "50-65%",
    reps: `${ZONE_PRESETS.ENDURANCE.low}-${ZONE_PRESETS.ENDURANCE.high}+`,
    sets: ZONE_PRESETS.ENDURANCE.sets,
    targetRPE: 10 - ZONE_PRESETS.ENDURANCE.targetRIR,
    restTime: ZONE_PRESETS.ENDURANCE.restTime
  },
};

const goalOptions: Record<Goal, string> = {
  STRENGTH: "Strength (85-100% 1RM, 1-5 reps) - Max strength & neural adaptations",
  HYPERTROPHY: "Hypertrophy (65-85% 1RM, 6-12 reps) - Muscle size & growth",
  ENDURANCE: "Endurance (50-65% 1RM, 12-20+ reps) - Muscular endurance",
};

export default function ProgressiveOverloadCalculator() {
  const [goal, setGoal] = useState<Goal>("HYPERTROPHY");
  const [weightUnit, setWeightUnit] = useState<WeightUnit>("lbs");
  const [split, setSplit] = useState("");
  
  const [exercises, setExercises] = useState<ExerciseInput[]>([
    {
      name: "",
      sets: [
        { weight: "", reps: "", rir: "2" },
        { weight: "", reps: "", rir: "2" },
        { weight: "", reps: "", rir: "2" },
      ],
    },
  ]);

  const [newWorkout, setNewWorkout] = useState<NewWorkout | null>(null);
  const [details, setDetails] = useState<CalculationDetails | null>(null);

  const removeExercise = (exerciseIndex: number) => {
    setExercises(exercises.filter((_, i) => i !== exerciseIndex));
  };

  const addSet = (exerciseIndex: number) => {
    const updated = [...exercises];
    updated[exerciseIndex].sets.push({ weight: "", reps: "", rir: "2" });
    setExercises(updated);
  };

  const removeSet = (exerciseIndex: number, setIndex: number) => {
    const updated = [...exercises];
    updated[exerciseIndex].sets = updated[exerciseIndex].sets.filter((_, i) => i !== setIndex);
    setExercises(updated);
  };

  const updateExerciseName = (exerciseIndex: number, name: string) => {
    const updated = [...exercises];
    updated[exerciseIndex].name = name;
    setExercises(updated);
  };

  const updateSet = (
    exerciseIndex: number,
    setIndex: number,
    field: keyof SetInput,
    value: string
  ) => {
    const updated = [...exercises];
    updated[exerciseIndex].sets[setIndex][field] = value;
    setExercises(updated);
  };

  const handleCalculate = async () => {
    // Validate inputs
    const validExercises = exercises.filter((ex) => {
      if (!ex.name.trim()) return false;
      const validSets = ex.sets.filter((s) => {
        const weight = parseFloat(s.weight);
        const reps = parseInt(s.reps);
        const rir = parseInt(s.rir);
        return !isNaN(weight) && !isNaN(reps) && weight > 0 && reps > 0 && !isNaN(rir) && rir >= 0;
      });
      return validSets.length > 0;
    });

    if (validExercises.length === 0) {
      alert("Please enter at least one exercise with valid set data (weight, reps, and RIR).");
      return;
    }

    // Call API route for calculations
    try {
      const response = await fetch("/api/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          previousWorkout: {
            date: new Date().toISOString().split("T")[0],
            split: split.trim() || "Workout",
            goal,
            exerciseInstances: validExercises.map((ex) => ({
              name: ex.name,
              sets: ex.sets
                .filter((s) => {
                  const weight = parseFloat(s.weight);
                  const reps = parseInt(s.reps);
                  const rir = parseInt(s.rir);
                  return !isNaN(weight) && !isNaN(reps) && weight > 0 && reps > 0 && !isNaN(rir) && rir >= 0;
                })
                .map((s) => ({
                  weight: parseFloat(s.weight),
                  reps: parseInt(s.reps),
                  rir: parseInt(s.rir),
                })),
            })),
          },
          weightUnit,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to calculate workout");
      }

      const data = await response.json();
      setNewWorkout(data.newWorkout);
      setDetails(data.details);
    } catch (error) {
      alert(`Error calculating workout: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Progressive Overload Calculator</CardTitle>
          <CardDescription>
            Enter all sets from your previous workout. The calculator will automatically identify your top set (highest Epley 1RM) for progressive overload calculations.
            <br />
            <span className="text-xs mt-2 inline-block">
              Example: Bench Press - Set 1: 175 lbs × 8 reps, Set 2: 185 lbs × 6 reps (top set), Set 3: 180 lbs × 7 reps
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Goal & Weight Unit Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="goal">Training Goal</Label>
              <Select value={goal} onValueChange={(value: Goal) => setGoal(value)}>
                <SelectTrigger id="goal">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(goalOptions).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="split">Workout Split (optional)</Label>
              <Input
                id="split"
                type="text"
                placeholder="e.g., Upper, Lower, Push, Pull"
                value={split}
                onChange={(e) => setSplit(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Label>Weight Unit:</Label>
            <Button
              type="button"
              variant="outline"
              onClick={() => setWeightUnit(weightUnit === "lbs" ? "kg" : "lbs")}
              className="min-w-[80px] px-3"
            >
              <span
                className={
                  weightUnit === "lbs"
                    ? "font-semibold text-foreground"
                    : "font-normal text-muted-foreground"
                }
              >
                lbs
              </span>
              <span className="mx-1 text-muted-foreground">/</span>
              <span
                className={
                  weightUnit === "kg"
                    ? "font-semibold text-foreground"
                    : "font-normal text-muted-foreground"
                }
              >
                kg
              </span>
            </Button>
          </div>

          {/* Exercise Inputs */}
          <div className="space-y-4">
            <div>
              <Label className="text-lg font-semibold">Previous Workout - All Sets</Label>
            </div>

            <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
              <p className="font-semibold mb-1">Instructions:</p>
              <p>Enter all sets for each exercise. The calculator will automatically identify your <strong>top set</strong> (highest Epley 1RM) for calculations.</p>
              <p className="mt-1"><strong>RIR</strong> = Reps in Reserve (how many more reps you could have done)</p>
            </div>

            {exercises.map((exercise, exerciseIndex) => (
              <Card key={exerciseIndex} className="p-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder={`Exercise ${exerciseIndex + 1} (e.g., Bench Press, Squat)`}
                      value={exercise.name}
                      onChange={(e) => updateExerciseName(exerciseIndex, e.target.value)}
                      className="flex-1"
                    />
                    {exercises.length > 1 && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => removeExercise(exerciseIndex)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Sets</Label>
                    {exercise.sets.map((set, setIndex) => (
                      <div key={setIndex} className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground w-12">Set {setIndex + 1}</span>
                        <Input
                          type="number"
                          placeholder="Weight"
                          value={set.weight}
                          onChange={(e) => updateSet(exerciseIndex, setIndex, "weight", e.target.value)}
                          className="w-24"
                          min="0"
                          step="0.01"
                        />
                        <span className="text-sm text-muted-foreground">{weightUnit}</span>
                        <Input
                          type="number"
                          placeholder="Reps"
                          value={set.reps}
                          onChange={(e) => updateSet(exerciseIndex, setIndex, "reps", e.target.value)}
                          className="w-20"
                          min="1"
                        />
                        <span className="text-sm text-muted-foreground">reps</span>
                        <Input
                          type="number"
                          placeholder="RIR"
                          value={set.rir}
                          onChange={(e) => updateSet(exerciseIndex, setIndex, "rir", e.target.value)}
                          className="w-20"
                          min="0"
                          max="10"
                        />
                        <span className="text-sm text-muted-foreground">RIR</span>
                        {exercise.sets.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSet(exerciseIndex, setIndex)}
                          >
                            ✕
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addSet(exerciseIndex)}
                    >
                      + Add Set
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Button onClick={handleCalculate} className="w-full" size="lg">
            Generate Next Workout
          </Button>
        </CardContent>
      </Card>

      {newWorkout && details && (
        <Tabs defaultValue="workout" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="workout">Recommended Workout</TabsTrigger>
            <TabsTrigger value="details">Calculation Details</TabsTrigger>
          </TabsList>

          <TabsContent value="workout" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Your Next Workout ({newWorkout.date})</CardTitle>
                <CardDescription>
                  {newWorkout.split} • {newWorkout.goal} • Status: {newWorkout.status} • Rest: {GOAL_CONFIG[newWorkout.goal].restTime}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {newWorkout.exerciseInstances.map((exercise, idx) => (
                  <div key={idx} className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">{exercise.name}</h3>
                        <div className="text-sm text-muted-foreground mt-1 space-y-0.5">
                          <div>
                            <span className="font-semibold">Perceived 1RM (RPE):</span> {exercise.perceived1RM.toFixed(1)} {weightUnit}
                          </div>
                          <div>
                            <span className="font-semibold">Estimated 1RM (Epley):</span> {exercise.estimated1RM.toFixed(1)} {weightUnit}
                          </div>
                          <div className="text-xs mt-1">
                            Using Perceived 1RM for progressive overload (accounts for how you felt)
                          </div>
                        </div>
                      </div>
                      <span className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded">
                        RPE {exercise.topSetRPE}
                      </span>
                    </div>

                    <div className="bg-muted p-4 rounded-lg">
                      <div className="text-sm text-muted-foreground mb-3">
                        <strong>Target:</strong> {exercise.recommended.targetPercentRange} of 1RM • {exercise.recommended.targetReps} reps • {exercise.recommended.sets.length} sets
                      </div>

                      <div className="space-y-2">
                        {exercise.recommended.sets.map((set) => (
                          <div
                            key={set.setIndex}
                            className="flex items-center justify-between p-3 bg-background rounded"
                          >
                            <span className="font-medium">Set {set.setIndex}</span>
                            <div className="flex items-center gap-4">
                              <span className="text-lg font-bold">
                                {set.weight} {weightUnit} × {set.reps} reps
                              </span>
                              <span className="text-sm text-muted-foreground">
                                @ RPE {set.targetRPE} ({set.percentOf1RM}%)
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}

                <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <h4 className="font-semibold mb-2">Progressive Overload Applied</h4>
                  <p className="text-sm text-muted-foreground">
                    Recommendations use your <strong>Perceived 1RM</strong> (from RPE chart) which accounts for how you felt during your top set.
                    This automatically provides progressive overload as RPE is based on your RIR (reps in reserve).
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Weights are rounded to the nearest 2.5 {weightUnit} for practical gym use.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="details" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Calculation Details</CardTitle>
                <CardDescription>
                  How we computed your recommendations using the RPE Chart and Epley&apos;s formula
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {details.exercises.map((exercise, idx) => (
                  <div key={idx} className="space-y-3">
                    <h3 className="text-lg font-semibold text-blue-600">{exercise.name}</h3>
                    
                    <div className="pl-4 space-y-3">
                      <div className="bg-muted p-3 rounded text-sm font-mono">
                        <div className="font-semibold mb-2">Top Set Data (Highest Epley 1RM):</div>
                        <div>Weight: {exercise.topSet.weight} {weightUnit}</div>
                        <div>Reps: {exercise.topSet.reps}</div>
                        <div>RIR: {exercise.topSet.rir}</div>
                        <div className="mt-2 text-blue-600">RPE: {exercise.topSet.rpe} (calculated from RIR = 10 - {exercise.topSet.rir})</div>
                        <div className="text-xs text-muted-foreground mt-2">
                          This set was automatically selected as your top set based on the highest Epley 1RM score.
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="bg-green-50 dark:bg-green-950 p-3 rounded text-sm">
                          <div className="font-semibold mb-1">Perceived 1RM (RPE-Based):</div>
                          <div className="font-mono text-xs space-y-1">
                            <div>1. Look up RPE Chart: {exercise.topSet.reps} reps @ RPE {exercise.topSet.rpe}</div>
                            <div>2. Chart shows: {exercise.rpeChartPercent}% of 1RM</div>
                            <div>3. Perceived 1RM = {exercise.topSet.weight} / ({exercise.rpeChartPercent} / 100)</div>
                            <div className="font-bold text-base mt-2">
                              = {exercise.perceived1RM.toFixed(2)} {weightUnit}
                            </div>
                          </div>
                        </div>

                        <div className="bg-orange-50 dark:bg-orange-950 p-3 rounded text-sm">
                          <div className="font-semibold mb-1">Estimated 1RM (Epley&apos;s Formula):</div>
                          <div className="font-mono text-xs space-y-1">
                            <div>Formula: 1RM = weight × (1 + (reps + RIR) / 30)</div>
                            <div>
                              = {exercise.topSet.weight} × (1 + ({exercise.topSet.reps} + {exercise.topSet.rir}) / 30)
                            </div>
                            <div className="font-bold text-base mt-2">
                              = {exercise.estimated1RM.toFixed(2)} {weightUnit}
                            </div>
                          </div>
                        </div>

                        <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded text-sm">
                          <div className="font-semibold mb-2">Which 1RM do we use?</div>
                          <div className="text-xs">
                            We use <strong>Perceived 1RM ({exercise.perceived1RM.toFixed(1)} {weightUnit})</strong> for progressive overload because:
                          </div>
                          <ul className="text-xs mt-2 space-y-1 list-disc list-inside">
                            <li>It accounts for how you <em>felt</em> during the lift (RPE/RIR)</li>
                            <li>Automatically adjusts for fatigue, recovery, and daily variations</li>
                            <li>Provides built-in progressive overload as you improve</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold mb-3">Formulas & Methods</h4>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="font-semibold">RPE from RIR:</span>
                      <div className="font-mono text-xs mt-1">RPE = 10 - RIR</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        (Example: If you could do 2 more reps, RIR = 2, so RPE = 8)
                      </div>
                    </div>

                    <div>
                      <span className="font-semibold">Epley&apos;s Formula:</span>
                      <div className="font-mono text-xs mt-1">1RM = weight × (1 + (reps + RIR) / 30)</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Estimates your max based on weight lifted and total reps capacity
                      </div>
                    </div>

                    <div>
                      <span className="font-semibold">RPE Chart Method:</span>
                      <div className="text-xs mt-1">
                        Uses a table mapping (reps, RPE) → %1RM to calculate perceived strength.
                        More accurate for daily variation and fatigue levels.
                      </div>
                    </div>

                    <div>
                      <span className="font-semibold">Progressive Overload:</span>
                      <div className="text-xs mt-1">
                        As your Perceived 1RM increases (from better performance or lower RIR),
                        the next workout automatically prescribes heavier weights.
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Training Goal: {newWorkout?.goal}</h4>
                  <div className="text-sm space-y-1">
                    <div><strong>Intensity Range:</strong> {GOAL_CONFIG[newWorkout?.goal || "HYPERTROPHY"].percentRange} of 1RM</div>
                    <div><strong>Reps per Set:</strong> {GOAL_CONFIG[newWorkout?.goal || "HYPERTROPHY"].reps}</div>
                    <div><strong>Sets:</strong> {GOAL_CONFIG[newWorkout?.goal || "HYPERTROPHY"].sets}</div>
                    <div><strong>Rest Time:</strong> {GOAL_CONFIG[newWorkout?.goal || "HYPERTROPHY"].restTime}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
