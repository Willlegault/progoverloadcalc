import { NextResponse } from "next/server";

type Gender = "male" | "female";
type ExerciseFrequency = "1" | "2" | "3" | "4" | "5";
type Goal = "loseMax" | "loseMid" | "loseMin" | "maintain" | "gainMin" | "gainMid" | "gainMax";
type ExerciseType = "strength" | "endurance" | "hypertrophy";
type WeightUnit = "lbs" | "kg";
type HeightUnit = "in" | "cm";

interface CalculateRequest {
    age: number;
    gender: Gender;
    weight: number;
    height: number;
    exerciseFrequency: ExerciseFrequency;
    goal: Goal;
    exerciseType: ExerciseType;
    weightUnit: WeightUnit;
    heightUnit: HeightUnit;
}

const goalAdjustments = {
    loseMax: { value: -1000 },
    loseMid: { value: -750 },
    loseMin: { value: -500 },
    maintain: { value: 0 },
    gainMin: { value: 500 },
    gainMid: { value: 750 },
    gainMax: { value: 1000 },
};

const exerciseFrequencyOptions = {
    "1": "1 day per week",
    "2": "2 days per week",
    "3": "3 days per week",
    "4": "4 days per week",
    "5": "5+ days per week",
};

const exerciseTypeOptions = {
    strength: "Strength Training",
    endurance: "Endurance Training",
    hypertrophy: "Hypertrophy Training",
};

export async function POST(req: Request) {
    try {
        const body = (await req.json()) as CalculateRequest;
        const {
            age,
            gender,
            weight,
            height,
            exerciseFrequency,
            goal,
            exerciseType,
            weightUnit,
            heightUnit,
        } = body;

        if (
            [age, weight, height].some((n) => typeof n !== "number" || isNaN(n) || n <= 0) ||
            !gender || !exerciseFrequency || !goal || !exerciseType || !weightUnit || !heightUnit
        ) {
            return NextResponse.json({ error: "Invalid input" }, { status: 400 });
        }

        const bmrResult = calculateBMR(weight, height, age, gender, weightUnit, heightUnit);
        const tefResult = calculateTEF(bmrResult.bmr);
        const eeeResult = calculateEEE(weight, weightUnit, exerciseFrequency);
        const neatResult = calculateNEAT();
        const tdeeResult = calculateTDEE(bmrResult.bmr, tefResult.tef, eeeResult.eee, neatResult.neat);
        const targetResult = calculateTargetCalories(tdeeResult.tdee, goal);
        const macrosResult = calculateMacros(
            targetResult.targetCalories,
            weight,
            weightUnit,
            goal,
            exerciseType,
            exerciseFrequency
        );

    const res = NextResponse.json({
            results: {
                bmr: bmrResult.bmr,
                tef: tefResult.tef,
                eee: eeeResult.eee,
                neat: neatResult.neat,
                tdee: tdeeResult.tdee,
                targetCalories: targetResult.targetCalories,
                protein: macrosResult.protein,
                fat: macrosResult.fat,
                carbs: macrosResult.carbs,
            },
            steps: {
                bmrSteps: bmrResult.steps,
                tefSteps: tefResult.steps,
                eeeSteps: eeeResult.steps,
                neatSteps: neatResult.steps,
                tdeeSteps: tdeeResult.steps,
                calorieAdjustmentSteps: targetResult.steps,
                proteinSteps: macrosResult.proteinSteps,
                fatSteps: macrosResult.fatSteps,
                carbSteps: macrosResult.carbSteps,
            },
    });
    res.headers.set("Access-Control-Allow-Origin", "http://localhost:3000");
    res.headers.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    return res;
    } catch {
    const res = NextResponse.json({ error: "Unexpected error" }, { status: 500 });
    res.headers.set("Access-Control-Allow-Origin", "http://localhost:3000");
    res.headers.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
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

function calculateBMR(
    weight: number,
    height: number,
    age: number,
    gender: Gender,
    weightUnit: WeightUnit,
    heightUnit: HeightUnit
): { bmr: number; steps: string[] } {
    const weightKg = weightUnit === "lbs" ? weight * 0.453592 : weight;
    const heightCm = heightUnit === "in" ? height * 2.54 : height;

    const steps: string[] = [];
    if (weightUnit === "lbs" || heightUnit === "in") {
        steps.push("**Convert Units:**");
        if (weightUnit === "lbs") steps.push(`Weight: ${weight} lbs × 0.453592 = ${weightKg.toFixed(2)} kg`);
        if (heightUnit === "in") steps.push(`Height: ${height} inches × 2.54 = ${heightCm.toFixed(2)} cm`);
        steps.push("");
    }

    steps.push("**Mifflin-St Jeor Equation:**");
    if (gender === "male") {
        const bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
        steps.push(`BMR = (10 × ${weightKg.toFixed(2)}) + (6.25 × ${heightCm.toFixed(2)}) - (5 × ${age}) + 5`);
        steps.push(`BMR = ${(10 * weightKg).toFixed(2)} + ${(6.25 * heightCm).toFixed(2)} - ${5 * age} + 5`);
        steps.push(`BMR = ${bmr.toFixed(2)} calories/day`);
        return { bmr, steps };
    } else {
        const bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
        steps.push(`BMR = (10 × ${weightKg.toFixed(2)}) + (6.25 × ${heightCm.toFixed(2)}) - (5 × ${age}) - 161`);
        steps.push(`BMR = ${(10 * weightKg).toFixed(2)} + ${(6.25 * heightCm).toFixed(2)} - ${5 * age} - 161`);
        steps.push(`BMR = ${bmr.toFixed(2)} calories/day`);
        return { bmr, steps };
    }
}

function calculateTEF(bmr: number): { tef: number; steps: string[] } {
    const steps: string[] = [];
    steps.push("**Thermic Effect of Feeding (TEF):**");
    steps.push("TEF represents calories burned during digestion (10% of BMR)");
    steps.push(`TEF = 0.1 × ${bmr.toFixed(2)}`);
    const tef = 0.1 * bmr;
    steps.push(`TEF = ${tef.toFixed(2)} calories/day`);
    return { tef, steps };
}

function calculateEEE(
    weight: number,
    weightUnit: WeightUnit,
    exerciseFrequency: ExerciseFrequency
): { eee: number; steps: string[] } {
    const steps: string[] = [];
    const f = parseInt(exerciseFrequency);
    const weightKg = weightUnit === "lbs" ? weight * 0.453592 : weight;

    steps.push("**Exercise Energy Expenditure (EEE):**");
    steps.push("Formula for one workout: EEE = ((3.5 × 3.5 × weight_kg) / 200) × 60 × f");
    steps.push("where f = exercise frequency per week");
    if (weightUnit === "lbs") {
        steps.push(`Weight: ${weight} ${weightUnit} = ${weightKg.toFixed(2)} kg`);
    } else {
        steps.push(`Weight: ${weight} ${weightUnit}`);
    }
    steps.push(`Exercise frequency (f): ${f} days/week`);
    steps.push(`EEE = ((3.5 × 3.5 × ${weightKg.toFixed(2)}) / 200) × 60 × ${f}`);
    const eeePerWorkout = ((3.5 * 3.5 * weightKg) / 200) * 60;
    steps.push(`EEE per workout = ${eeePerWorkout.toFixed(2)} calories`);
    const eee = eeePerWorkout * f;
    steps.push(`Total EEE = ${eeePerWorkout.toFixed(2)} × ${f} = ${eee.toFixed(2)} calories/week`);
    const eeePerDay = eee / 7;
    steps.push(`EEE per day = ${eee.toFixed(2)} / 7 = ${eeePerDay.toFixed(2)} calories/day`);
    return { eee: eeePerDay, steps };
}

function calculateNEAT(): { neat: number; steps: string[] } {
    const steps: string[] = [];
    const neat = 300;
    steps.push("**Non-Exercise Activity Thermogenesis (NEAT):**");
    steps.push("NEAT represents daily activities like walking, fidgeting, etc.");
    steps.push(`Using conservative estimate: ${neat} calories/day`);
    steps.push("(This varies by lifestyle but we use a standard value)");
    return { neat, steps };
}

function calculateTDEE(
    bmr: number,
    tef: number,
    eee: number,
    neat: number
): { tdee: number; steps: string[] } {
    const steps: string[] = [];
    steps.push("**Total Daily Energy Expenditure (TDEE):**");
    steps.push("TDEE = BMR + TEF + EEE + NEAT");
    steps.push(`TDEE = ${bmr.toFixed(2)} + ${tef.toFixed(2)} + ${eee.toFixed(2)} + ${neat.toFixed(2)}`);
    const tdee = bmr + tef + eee + neat;
    steps.push(`TDEE = ${tdee.toFixed(2)} calories/day`);
    return { tdee, steps };
}

function calculateTargetCalories(tdee: number, goal: Goal): { targetCalories: number; steps: string[] } {
    const adjustment = goalAdjustments[goal].value;
    const steps: string[] = [];
    steps.push("**Calorie Adjustment for Goal:**");
    steps.push(`Adjustment: ${adjustment >= 0 ? "+" : ""}${adjustment} calories`);
    steps.push("Target Calories = TDEE + Adjustment");
    steps.push(`Target Calories = ${tdee.toFixed(2)} ${adjustment >= 0 ? "+" : ""} ${adjustment}`);
    const targetCalories = tdee + adjustment;
    steps.push(`Target Calories = ${targetCalories.toFixed(2)} calories/day`);
    return { targetCalories, steps };
}

function calculateMacros(
    targetCalories: number,
    weight: number,
    weightUnit: WeightUnit,
    goal: Goal,
    exerciseType: ExerciseType,
    exerciseFrequency: ExerciseFrequency
): {
    protein: number;
    fat: number;
    carbs: number;
    proteinSteps: string[];
    fatSteps: string[];
    carbSteps: string[];
} {
    const proteinSteps: string[] = [];
    const fatSteps: string[] = [];
    const carbSteps: string[] = [];

    const weightLbs = weightUnit === "kg" ? weight * 2.20462 : weight;

    const proteinMultiplier: Record<ExerciseType, Record<ExerciseFrequency, number>> = {
        strength: { "1": 0.7, "2": 0.85, "3": 0.95, "4": 1.1, "5": 1.25 },
        endurance: { "1": 0.7, "2": 0.8, "3": 0.9, "4": 0.95, "5": 1.0 },
        hypertrophy: { "1": 0.7, "2": 0.85, "3": 0.95, "4": 1.1, "5": 1.25 },
    };
    const selectedProteinMultiplier = proteinMultiplier[exerciseType]?.[exerciseFrequency] ?? 0.8;

    const fatMultiplier: Record<ExerciseType, Record<ExerciseFrequency, number>> = {
        strength: { "1": 0.45, "2": 0.45, "3": 0.45, "4": 0.45, "5": 0.45 },
        endurance: { "1": 0.4, "2": 0.4, "3": 0.4, "4": 0.4, "5": 0.4 },
        hypertrophy: { "1": 0.36, "2": 0.36, "3": 0.36, "4": 0.36, "5": 0.36 },
    };
    const selectedFatMultiplier = fatMultiplier[exerciseType]?.[exerciseFrequency] ?? 0.4;

    const baseProteinPerLb = 0.8;
    proteinSteps.push("**Protein Calculation:**");
    proteinSteps.push(`Base recommendation: ${baseProteinPerLb}g per lb of body weight`);
    proteinSteps.push(`Training goal: ${exerciseTypeOptions[exerciseType]}`);
    proteinSteps.push(`Exercise frequency: ${exerciseFrequencyOptions[exerciseFrequency]}`);
    proteinSteps.push(`Protein multiplier: ${selectedProteinMultiplier}`);
    proteinSteps.push(`Adjusted recommendation: ${selectedProteinMultiplier.toFixed(2)}g per lb of body weight`);
    proteinSteps.push(`Protein = ${weightLbs.toFixed(2)} lbs × ${selectedProteinMultiplier.toFixed(2)}g/lb`);
    const proteinGrams = weightLbs * selectedProteinMultiplier;
    proteinSteps.push(`Protein = ${proteinGrams.toFixed(1)}g`);
    const proteinCalories = proteinGrams * 4;
    proteinSteps.push(`Protein Calories = ${proteinGrams.toFixed(1)}g × 4 cal/g = ${proteinCalories.toFixed(1)} calories`);

    const fatPerLb = selectedFatMultiplier;
    fatSteps.push("**Fat Calculation:**");
    fatSteps.push(`Training goal: ${exerciseTypeOptions[exerciseType]}`);
    fatSteps.push(`Exercise frequency: ${exerciseFrequencyOptions[exerciseFrequency]}`);
    fatSteps.push(`Fat multiplier: ${fatPerLb.toFixed(2)}g per lb of body weight`);
    fatSteps.push(`Fat = ${weightLbs.toFixed(2)} lbs × ${fatPerLb.toFixed(2)}g/lb`);
    const fatGrams = weightLbs * fatPerLb;
    fatSteps.push(`Fat = ${fatGrams.toFixed(1)}g`);
    const fatCalories = fatGrams * 9;
    fatSteps.push(`Fat Calories = ${fatGrams.toFixed(1)}g × 9 cal/g = ${fatCalories.toFixed(1)} calories`);

    const carbCalories = targetCalories - proteinCalories - fatCalories;
    carbSteps.push("**Carbohydrate Calculation:**");
    carbSteps.push("Carbs fill the remaining calories");
    carbSteps.push(`Carb Calories = Total - Protein - Fat`);
    carbSteps.push(`Carb Calories = ${targetCalories.toFixed(2)} - ${proteinCalories.toFixed(1)} - ${fatCalories.toFixed(1)}`);
    carbSteps.push(`Carb Calories = ${carbCalories.toFixed(1)} calories`);
    const carbGrams = carbCalories / 4;
    carbSteps.push(`Carbs = ${carbCalories.toFixed(1)} ÷ 4 cal/g = ${carbGrams.toFixed(1)}g`);

    return {
        protein: proteinGrams,
        fat: fatGrams,
        carbs: carbGrams,
        proteinSteps,
        fatSteps,
        carbSteps,
    };
}


