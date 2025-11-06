# Calorie & Macro Calculation Methodology

## Inputs
- age (years)
- gender (male | female)
- weight (lbs | kg)
- height (in | cm)
- exerciseFrequency (1–5 days/week)
- exerciseType (strength | endurance | hypertrophy)
- goal (loseMax | loseMid | loseMin | maintain | gainMin | gainMid | gainMax)

## Unit Handling
- Weight: if entered in lbs, convert to kg for BMR/EEE using: kg = lbs × 0.453592. For protein/fat calculations, lbs are used; if entered in kg, convert to lbs with: lbs = kg × 2.20462.
- Height: if entered in inches, convert to cm for BMR using: cm = in × 2.54.

## Algorithms

### Basal Metabolic Rate (BMR)
Mifflin–St Jeor (uses metric):
- Male: BMR = 10 × weight_kg + 6.25 × height_cm − 5 × age + 5
- Female: BMR = 10 × weight_kg + 6.25 × height_cm − 5 × age − 161

### Thermic Effect of Feeding (TEF)
- TEF = 0.10 × BMR

### Exercise Energy Expenditure (EEE) – Daily Average
1. Convert weight to kg if needed.
2. Per workout: eeePerWorkout = ((3.5 × 3.5 × weight_kg) / 200) × 60
3. Weekly: weeklyEEE = eeePerWorkout × exerciseFrequency
4. Daily: EEE = weeklyEEE ÷ 7

### Non-Exercise Activity Thermogenesis (NEAT)
- NEAT = 300 calories/day (conservative constant)

### Total Daily Energy Expenditure (TDEE)
- TDEE = BMR + TEF + EEE + NEAT

### Target Calories (per goal)
Adjustments (cal/day):
- loseMax: −1000
- loseMid: −750
- loseMin: −500
- maintain: 0
- gainMin: +500
- gainMid: +750
- gainMax: +1000

targetCalories = TDEE + adjustment

### Macronutrient Allocation

Protein (grams):
- Determine `selectedProteinMultiplier` based on exerciseType × exerciseFrequency (approx 0.7–1.25 g/lb).
- weightLbs = (kg ? × 2.20462 : lbs)
- proteinGrams = weightLbs × selectedProteinMultiplier
- proteinCalories = proteinGrams × 4

Fat (grams):
- Determine `fatPerLb` based on exerciseType × exerciseFrequency (typical ranges: strength ~0.45, endurance ~0.40, hypertrophy ~0.36 g/lb).
- fatGrams = weightLbs × fatPerLb
- fatCalories = fatGrams × 9

Carbohydrates (grams):
- carbCalories = targetCalories − proteinCalories − fatCalories
- carbGrams = carbCalories ÷ 4

## Outputs
- bmr, tef, eee, neat, tdee
- targetCalories
- protein (g), fat (g), carbs (g)

## Notes
- Unit toggles allow entry in imperial or metric; conversions occur automatically for the relevant formulas.
- Protein and fat scale with body weight (lbs); carbs fill remaining calories to meet `targetCalories`.
- The app provides an “Advanced Details” tab that displays conversions, intermediate steps, and a verification sum of macro calories equaling `targetCalories`.


