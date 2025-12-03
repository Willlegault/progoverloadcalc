"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

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
  rir: number;
  notes: string;
}

interface ExerciseRecommendation {
  id?: string;
  name: string;
  group?: string;
  recommended: {
    representative1RM: number;
    targetIntensity: number;
    targetReps: number;
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
    id?: string;
    name: string;
    group?: string;
    sets: Array<{
      weight: number;
      reps: number;
      rir: number;
      rpe: number;
      percent: number;
      perceived1RM: number;
      epley: number;
      volume: number;
    }>;
    representative1RM: number;
  }>;
}

const goalOptions: Record<Goal, string> = {
  STRENGTH: "Strength (3 sets × 5 reps @ 92.5% intensity)",
  HYPERTROPHY: "Hypertrophy (4 sets × 10 reps @ 75% intensity)",
  ENDURANCE: "Endurance (3 sets × 15 reps @ 57.5% intensity)",
};

export default function ProgressiveOverloadCalculator() {
  const [goal, setGoal] = useState<Goal>("HYPERTROPHY");
  const [weightUnit, setWeightUnit] = useState<WeightUnit>("lbs");
  const [split, setSplit] = useState("");
  
  const [exercises, setExercises] = useState<ExerciseInput[]>([
    {
      name: "",
      sets: [{ weight: "", reps: "", rir: "2" }],
    },
  ]);

  const [newWorkout, setNewWorkout] = useState<NewWorkout | null>(null);
  const [details, setDetails] = useState<CalculationDetails | null>(null);

  const addExercise = () => {
    setExercises([
      ...exercises,
      {
        name: "",
        sets: [{ weight: "", reps: "", rir: "2" }],
      },
    ]);
  };

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
      const validSets = ex.sets.filter(
        (s) =>
          s.weight.trim() !== "" &&
          s.reps.trim() !== "" &&
          !isNaN(parseFloat(s.weight)) &&
          !isNaN(parseInt(s.reps)) &&
          parseFloat(s.weight) > 0 &&
          parseInt(s.reps) > 0
      );
      return validSets.length > 0;
    });

    if (validExercises.length === 0) {
      alert("Please enter at least one exercise with valid sets (weight and reps).");
      return;
    }

    // Build previousWorkout payload
    const previousWorkout = {
      date: new Date().toISOString().split("T")[0],
      split: split.trim() || "Workout",
      goal,
      exerciseInstances: validExercises.map((ex, idx) => ({
        id: `exercise-${idx}`,
        name: ex.name,
        group: "",
        sets: ex.sets
          .filter(
            (s) =>
              s.weight.trim() !== "" &&
              s.reps.trim() !== "" &&
              !isNaN(parseFloat(s.weight)) &&
              !isNaN(parseInt(s.reps))
          )
          .map((s) => ({
            weight: parseFloat(s.weight),
            reps: parseInt(s.reps),
            rir: s.rir.trim() !== "" && !isNaN(parseInt(s.rir)) ? parseInt(s.rir) : 2,
          })),
      })),
    };

    try {
      const response = await fetch("/api/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          previousWorkout,
          weightUnit,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(`Error: ${errorData.error || "Unable to calculate workout"}`);
        return;
      }

      const data = await response.json();
      setNewWorkout(data.newWorkout);
      setDetails(data.details);
    } catch (err) {
      alert("Network error or server unavailable.");
      console.error(err);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Progressive Overload Calculator</CardTitle>
          <CardDescription>
            Enter your previous workout data to generate your next workout with progressive overload recommendations
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
            <div className="flex items-center justify-between">
              <Label className="text-lg font-semibold">Previous Workout Exercises</Label>
              <Button type="button" variant="outline" size="sm" onClick={addExercise}>
                + Add Exercise
              </Button>
            </div>

            {exercises.map((exercise, exerciseIndex) => (
              <Card key={exerciseIndex} className="p-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder={`Exercise ${exerciseIndex + 1} name (e.g., Bench Press)`}
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
                  {newWorkout.split} • {newWorkout.goal} • Status: {newWorkout.status}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {newWorkout.exerciseInstances.map((exercise, idx) => (
                  <div key={idx} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">{exercise.name}</h3>
                      <span className="text-sm text-muted-foreground">
                        Est. 1RM: {exercise.recommended.representative1RM.toFixed(1)} {weightUnit}
                      </span>
                    </div>

                    <div className="bg-muted p-3 rounded-lg">
                      <div className="text-sm text-muted-foreground mb-2">
                        Target Intensity: {(exercise.recommended.targetIntensity * 100).toFixed(1)}% •{" "}
                        {exercise.recommended.targetReps} reps per set
                      </div>

                      <div className="space-y-2">
                        {exercise.recommended.sets.map((set) => (
                          <div
                            key={set.setIndex}
                            className="flex items-center justify-between p-2 bg-background rounded"
                          >
                            <span className="font-medium">Set {set.setIndex}</span>
                            <div className="flex items-center gap-4">
                              <span className="text-lg font-bold">
                                {set.weight} {weightUnit} × {set.reps} reps
                              </span>
                              <span className="text-sm text-muted-foreground">RIR: {set.rir}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}

                <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                  <h4 className="font-semibold mb-2">💪 Progressive Overload Applied</h4>
                  <p className="text-sm text-muted-foreground">
                    Weights have been adjusted based on your estimated 1RM using {newWorkout.goal.toLowerCase()}{" "}
                    training intensity. All weights are rounded to the nearest 2.5 {weightUnit} for practical gym
                    use.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="details" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Calculation Details</CardTitle>
                <CardDescription>How we computed your recommendations using Epley&apos;s formula and RPE-based 1RM</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {details.exercises.map((exercise, idx) => (
                  <div key={idx} className="space-y-3">
                    <h3 className="text-lg font-semibold text-blue-600">{exercise.name}</h3>
                    
                    <div className="pl-4 space-y-2">
                      <div className="text-sm">
                        <span className="font-semibold">Representative 1RM:</span>{" "}
                        {exercise.representative1RM.toFixed(2)} {weightUnit}
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="font-semibold">Previous Sets Analysis:</div>
                        {exercise.sets.map((set, setIdx) => (
                          <div key={setIdx} className="pl-4 space-y-1 font-mono text-xs bg-muted p-2 rounded">
                            <div className="font-semibold">
                              Set {setIdx + 1}: {set.weight} {weightUnit} × {set.reps} reps @ RIR {set.rir}
                            </div>
                            <div>RPE: {set.rpe} → {(set.percent * 100).toFixed(1)}% of 1RM</div>
                            <div>
                              Perceived 1RM = {set.weight} / {set.percent.toFixed(3)} ={" "}
                              {set.perceived1RM.toFixed(2)} {weightUnit}
                            </div>
                            <div>
                              Epley 1RM = {set.weight} × (1 + ({set.reps} + {set.rir}) / 30) ={" "}
                              {set.epley.toFixed(2)} {weightUnit}
                            </div>
                            <div className="text-muted-foreground">
                              Volume: {set.volume.toFixed(1)} {weightUnit}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="text-sm bg-green-50 dark:bg-green-950 p-3 rounded">
                        <div className="font-semibold">Selected 1RM:</div>
                        <div className="font-mono">
                          Max(Perceived: {Math.max(...exercise.sets.map((s) => s.perceived1RM)).toFixed(2)},{" "}
                          Epley: {Math.max(...exercise.sets.map((s) => s.epley)).toFixed(2)}) ={" "}
                          {exercise.representative1RM.toFixed(2)} {weightUnit}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Formulas Used</h4>
                  <div className="space-y-2 text-sm font-mono">
                    <div>
                      <span className="font-semibold">Epley&apos;s Formula:</span> 1RM = weight × (1 + (reps + RIR) / 30)
                    </div>
                    <div>
                      <span className="font-semibold">RPE to %1RM:</span> RPE 10 → 100%, RPE 9 → 97%, RPE 8 → 92%, etc.
                    </div>
                    <div>
                      <span className="font-semibold">Perceived 1RM:</span> weight / (RPE%1RM)
                    </div>
                    <div>
                      <span className="font-semibold">Target Weight:</span> Representative 1RM × Goal Intensity (rounded to nearest 2.5 {weightUnit})
                    </div>
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
