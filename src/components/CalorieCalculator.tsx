"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

type Gender = "male" | "female";
type ExerciseFrequency = "1" | "2" | "3" | "4" | "5";
type Goal = "loseMax" | "loseMid" | "loseMin" | "maintain" | "gainMin" | "gainMid" | "gainMax";
type ExerciseType = "strength" | "endurance" | "hypertrophy";
type WeightUnit = "lbs" | "kg";
type HeightUnit = "in" | "cm";

interface UserData {
  age: string;
  gender: Gender;
  weight: string;
  height: string;
  exerciseFrequency: ExerciseFrequency;
  goal: Goal;
  exerciseType: ExerciseType;
}

interface Results {
  bmr: number;
  tef: number;
  eee: number;
  neat: number;
  tdee: number;
  targetCalories: number;
  protein: number;
  fat: number;
  carbs: number;
}

interface CalculationSteps {
  bmrSteps: string[];
  tefSteps: string[];
  eeeSteps: string[];
  neatSteps: string[];
  tdeeSteps: string[];
  calorieAdjustmentSteps: string[];
  proteinSteps: string[];
  fatSteps: string[];
  carbSteps: string[];
}

const exerciseFrequencyOptions = {
  "1": "1 day per week",
  "2": "2 days per week",
  "3": "3 days per week",
  "4": "4 days per week",
  "5": "5+ days per week",
};

const goalAdjustments = {
  loseMax: { value: -1000, label: "Lose weight (-1000 cal/day, ~2 lb/week)" },
  loseMid: { value: -750, label: "Lose weight (-750 cal/day, ~1.5 lb/week)" },
  loseMin: { value: -500, label: "Lose weight (-500 cal/day, ~1 lb/week)" },
  maintain: { value: 0, label: "Maintain weight" },
  gainMin: { value: 500, label: "Gain weight (+500 cal/day, ~1 lb/week)" },
  gainMid: { value: 750, label: "Gain weight (+750 cal/day, ~1.5 lb/week)" },
  gainMax: { value: 1000, label: "Gain weight (+1000 cal/day, ~2 lb/week)" },
};

const exerciseTypeOptions = {
  "strength": "Strength Training",
  "endurance": "Endurance Training",
  "hypertrophy": "Hypertrophy Training"
}

export default function CalorieCalculator() {
  const [userData, setUserData] = useState<UserData>({
    age: "",
    gender: "male",
    weight: "",
    height: "",
    exerciseFrequency: "3",
    goal: "maintain",
    exerciseType: "strength",
  });

  const [weightUnit, setWeightUnit] = useState<WeightUnit>("lbs");
  const [heightUnit, setHeightUnit] = useState<HeightUnit>("in");

  const [results, setResults] = useState<Results | null>(null);
  const [steps, setSteps] = useState<CalculationSteps | null>(null);

  // moved calculations to API route /api/calculate

  const handleCalculate = async () => {
    // Use placeholder values if fields are empty
    const weight = parseFloat(userData.weight);
    const height = parseFloat(userData.height);
    const age = parseInt(userData.age);

    if (!weight || !height || !age || isNaN(weight) || isNaN(height) || isNaN(age)) {
      alert("Please fill in all fields with valid numbers");
      return;
    }

    const response = await fetch("/api/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        age,
        gender: userData.gender,
        weight,
        height,
        exerciseFrequency: userData.exerciseFrequency,
        goal: userData.goal,
        exerciseType: userData.exerciseType,
        weightUnit,
        heightUnit,
      }),
    });
    if (!response.ok) {
      alert("There was a problem calculating your results.");
      return;
    }
    const data = await response.json();
    setResults(data.results);
    setSteps(data.steps);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Calorie & Macro Calculator</CardTitle>
          <CardDescription>Enter your information to calculate your daily calorie and macronutrient needs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                min={0}
                value={userData.age}
                onChange={(e) => {
                  const value = e.target.value;
                  setUserData({
                    ...userData,
                    age: value === "" ? "" : Math.max(0, Number(value)).toString(),
                  });
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select value={userData.gender} onValueChange={(value: Gender) => setUserData({ ...userData, gender: value })}>
                <SelectTrigger id="gender">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight">Weight ({weightUnit})</Label>
              <div className="flex gap-2">
                <Input
                  id="weight"
                  type="number"
                  min={0}
                  value={userData.weight}
                  onChange={(e) => {
                    const value = e.target.value;
                    setUserData({
                      ...userData,
                      weight: value === "" ? "" : Math.max(0, Number(value)).toString(),
                    });
                  }}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const currentWeight = parseFloat(userData.weight);
                    if (!isNaN(currentWeight) && currentWeight > 0) {
                      // Convert value when switching units
                      const convertedWeight = weightUnit === "lbs" 
                        ? (currentWeight * 0.453592).toFixed(2)
                        : (currentWeight / 0.453592).toFixed(2);
                      setUserData({
                        ...userData,
                        weight: convertedWeight,
                      });
                    }
                    setWeightUnit(weightUnit === "lbs" ? "kg" : "lbs");
                  }}
                  className="min-w-[80px] px-3"
                >
                  <span className={weightUnit === "lbs" ? "font-semibold text-foreground" : "font-normal text-muted-foreground"}>
                    lbs
                  </span>
                  <span className="mx-1 text-muted-foreground">/</span>
                  <span className={weightUnit === "kg" ? "font-semibold text-foreground" : "font-normal text-muted-foreground"}>
                    kg
                  </span>
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="height">Height ({heightUnit === "in" ? "inches" : "cm"})</Label>
              <div className="flex gap-2">
                <Input
                  id="height"
                  type="number"
                  min={0}
                  value={userData.height}
                  onChange={(e) => {
                    const value = e.target.value;
                    setUserData({
                      ...userData,
                      height: value === "" ? "" : Math.max(0, Number(value)).toString(),
                    });
                  }}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const currentHeight = parseFloat(userData.height);
                    if (!isNaN(currentHeight) && currentHeight > 0) {
                      // Convert value when switching units
                      const convertedHeight = heightUnit === "in" 
                        ? (currentHeight * 2.54).toFixed(2)
                        : (currentHeight / 2.54).toFixed(2);
                      setUserData({
                        ...userData,
                        height: convertedHeight,
                      });
                    }
                    setHeightUnit(heightUnit === "in" ? "cm" : "in");
                  }}
                  className="min-w-[80px] px-3"
                >
                  <span className={heightUnit === "in" ? "font-semibold text-foreground" : "font-normal text-muted-foreground"}>
                    in
                  </span>
                  <span className="mx-1 text-muted-foreground">/</span>
                  <span className={heightUnit === "cm" ? "font-semibold text-foreground" : "font-normal text-muted-foreground"}>
                    cm
                  </span>
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="exercise">Exercise Frequency</Label>
              <Select
                value={userData.exerciseFrequency}
                onValueChange={(value: ExerciseFrequency) => setUserData({ ...userData, exerciseFrequency: value })}
              >
                <SelectTrigger id="exercise">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(exerciseFrequencyOptions).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="exerciseType">Exercise Goal</Label>
              <Select
                value={userData.exerciseType}
                onValueChange={(value: ExerciseType) => setUserData({ ...userData, exerciseType: value })}
              >
                <SelectTrigger id="exerciseType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(exerciseTypeOptions).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="goal">Nutrition Goal</Label>
              <Select value={userData.goal} onValueChange={(value: Goal) => setUserData({ ...userData, goal: value })}>
                <SelectTrigger id="goal">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(goalAdjustments).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={handleCalculate} className="w-full mt-6">
            Calculate
          </Button>
        </CardContent>
      </Card>

      {results && steps && (
        <Tabs defaultValue="results" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="results">Results</TabsTrigger>
            <TabsTrigger value="advanced">Advanced Details</TabsTrigger>
          </TabsList>

          <TabsContent value="results" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Your Results</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Energy Expenditure Breakdown</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                      <div className="text-sm text-muted-foreground">BMR (Basal Metabolic Rate)</div>
                      <div className="text-2xl font-bold">{results.bmr.toFixed(0)}</div>
                      <div className="text-xs text-muted-foreground">calories/day</div>
                    </div>
                    <div className="p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
                      <div className="text-sm text-muted-foreground">TEF (Thermic Effect of Feeding)</div>
                      <div className="text-2xl font-bold">{results.tef.toFixed(0)}</div>
                      <div className="text-xs text-muted-foreground">calories/day</div>
                    </div>
                    <div className="p-4 bg-pink-50 dark:bg-pink-950 rounded-lg">
                      <div className="text-sm text-muted-foreground">EEE (Exercise Energy Expenditure)</div>
                      <div className="text-2xl font-bold">{results.eee.toFixed(0)}</div>
                      <div className="text-xs text-muted-foreground">calories/day</div>
                    </div>
                    <div className="p-4 bg-cyan-50 dark:bg-cyan-950 rounded-lg">
                      <div className="text-sm text-muted-foreground">NEAT (Non-Exercise Activity Thermogenesis)</div>
                      <div className="text-2xl font-bold">{results.neat.toFixed(0)}</div>
                      <div className="text-xs text-muted-foreground">calories/day</div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                    <div className="text-sm text-muted-foreground">TDEE (Total Daily Energy Expenditure)</div>
                    <div className="text-3xl font-bold">{results.tdee.toFixed(0)}</div>
                    <div className="text-xs text-muted-foreground">calories/day</div>
                    <div className="text-xs text-muted-foreground mt-2">
                      = BMR + TEF + EEE + NEAT
                    </div>
                  </div>
                  <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                    <div className="text-sm text-muted-foreground">Target Calories</div>
                    <div className="text-3xl font-bold">{results.targetCalories.toFixed(0)}</div>
                    <div className="text-xs text-muted-foreground">calories/day</div>
                    <div className="text-xs text-muted-foreground mt-2">
                      = TDEE {goalAdjustments[userData.goal].value >= 0 ? "+" : ""} {goalAdjustments[userData.goal].value}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Daily Macronutrients</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 border rounded-lg">
                      <div className="text-sm text-muted-foreground">Protein</div>
                      <div className="text-3xl font-bold text-red-600">{results.protein.toFixed(1)}g</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {(results.protein * 4).toFixed(0)} calories (4 cal/g)
                      </div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="text-sm text-muted-foreground">Fat</div>
                      <div className="text-3xl font-bold text-yellow-600">{results.fat.toFixed(1)}g</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {(results.fat * 9).toFixed(0)} calories (9 cal/g)
                      </div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="text-sm text-muted-foreground">Carbohydrates</div>
                      <div className="text-3xl font-bold text-blue-600">{results.carbs.toFixed(1)}g</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {(results.carbs * 4).toFixed(0)} calories (4 cal/g)
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-2">Summary</h4>
                  <p className="text-sm text-muted-foreground">
                    To {userData.goal === "loseMax" ? "lose weight" : userData.goal === "loseMid" ? "lose weight" : userData.goal === "loseMin" ? "lose weight" : userData.goal === "maintain" ? "maintain your weight" : userData.goal === "gainMin" ? "gain weight" : userData.goal === "gainMid" ? "gain weight" : "gain weight"}, 
                    consume <span className="font-bold text-foreground">{results.targetCalories.toFixed(0)} calories</span> per day with{" "}
                    <span className="font-bold text-red-600">{results.protein.toFixed(0)}g protein</span>,{" "}
                    <span className="font-bold text-yellow-600">{results.fat.toFixed(0)}g fat</span>, and{" "}
                    <span className="font-bold text-blue-600">{results.carbs.toFixed(0)}g carbs</span>.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Formula Breakdown</CardTitle>
                <CardDescription>
                  Detailed step-by-step calculations showing how we arrived at your results
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-blue-600">1. Basal Metabolic Rate (BMR)</h3>
                  <div className="pl-4 space-y-1 font-mono text-sm">
                    {steps.bmrSteps.map((step, i) => (
                      <div key={i} className={step.startsWith("**") ? "font-bold text-foreground mt-2" : "text-muted-foreground"}>
                        {step.replace(/\*\*/g, "")}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-orange-600">2a. Thermic Effect of Feeding (TEF)</h3>
                  <div className="pl-4 space-y-1 font-mono text-sm">
                    {steps.tefSteps.map((step, i) => (
                      <div key={i} className={step.startsWith("**") ? "font-bold text-foreground mt-2" : "text-muted-foreground"}>
                        {step.replace(/\*\*/g, "")}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-pink-600">2b. Exercise Energy Expenditure (EEE)</h3>
                  <div className="pl-4 space-y-1 font-mono text-sm">
                    {steps.eeeSteps.map((step, i) => (
                      <div key={i} className={step.startsWith("**") ? "font-bold text-foreground mt-2" : "text-muted-foreground"}>
                        {step.replace(/\*\*/g, "")}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-cyan-600">2c. Non-Exercise Activity Thermogenesis (NEAT)</h3>
                  <div className="pl-4 space-y-1 font-mono text-sm">
                    {steps.neatSteps.map((step, i) => (
                      <div key={i} className={step.startsWith("**") ? "font-bold text-foreground mt-2" : "text-muted-foreground"}>
                        {step.replace(/\*\*/g, "")}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-green-600">2d. Total Daily Energy Expenditure (TDEE)</h3>
                  <div className="pl-4 space-y-1 font-mono text-sm">
                    {steps.tdeeSteps.map((step, i) => (
                      <div key={i} className={step.startsWith("**") ? "font-bold text-foreground mt-2" : "text-muted-foreground"}>
                        {step.replace(/\*\*/g, "")}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-purple-600">3. Target Calorie Adjustment</h3>
                  <div className="pl-4 space-y-1 font-mono text-sm">
                    {steps.calorieAdjustmentSteps.map((step, i) => (
                      <div key={i} className={step.startsWith("**") ? "font-bold text-foreground mt-2" : "text-muted-foreground"}>
                        {step.replace(/\*\*/g, "")}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-xl font-semibold mb-4">Macronutrient Distribution</h3>
                  
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <h4 className="text-lg font-semibold text-red-600">Protein</h4>
                      <div className="pl-4 space-y-1 font-mono text-sm">
                        {steps.proteinSteps.map((step, i) => (
                          <div key={i} className={step.startsWith("**") ? "font-bold text-foreground mt-2" : "text-muted-foreground"}>
                            {step.replace(/\*\*/g, "")}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-lg font-semibold text-yellow-600">Fat</h4>
                      <div className="pl-4 space-y-1 font-mono text-sm">
                        {steps.fatSteps.map((step, i) => (
                          <div key={i} className={step.startsWith("**") ? "font-bold text-foreground mt-2" : "text-muted-foreground"}>
                            {step.replace(/\*\*/g, "")}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-lg font-semibold text-blue-600">Carbohydrates</h4>
                      <div className="pl-4 space-y-1 font-mono text-sm">
                        {steps.carbSteps.map((step, i) => (
                          <div key={i} className={step.startsWith("**") ? "font-bold text-foreground mt-2" : "text-muted-foreground"}>
                            {step.replace(/\*\*/g, "")}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Verification</h4>
                  <div className="font-mono text-sm space-y-1">
                    <div>Protein: {results.protein.toFixed(1)}g × 4 cal/g = {(results.protein * 4).toFixed(1)} calories</div>
                    <div>Fat: {results.fat.toFixed(1)}g × 9 cal/g = {(results.fat * 9).toFixed(1)} calories</div>
                    <div>Carbs: {results.carbs.toFixed(1)}g × 4 cal/g = {(results.carbs * 4).toFixed(1)} calories</div>
                    <div className="border-t pt-1 mt-1 font-bold">
                      Total: {((results.protein * 4) + (results.fat * 9) + (results.carbs * 4)).toFixed(1)} calories
                    </div>
                    <div className="text-xs text-muted-foreground">
                      (Should match target: {results.targetCalories.toFixed(1)} calories)
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
