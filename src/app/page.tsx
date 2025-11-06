import CalorieCalculator from "@/components/CalorieCalculator"; 

export default function Home() {
  return (
    <div className="min-h-screen p-8 pb-20 sm:p-20">
      <main className="flex flex-col gap-8 items-center">
        <div className="text-center space-y-4 mb-8">
          <h1 className="text-4xl font-bold tracking-tight">Sculpt Nutrition Calculator</h1>
          <p className="text-muted-foreground max-w-2xl">
            Calculate your personalized calorie and macronutrient targets based on scientifically-backed formulas.
            View detailed breakdowns to understand exactly how your numbers are calculated.
          </p>
        </div>
        <CalorieCalculator />
      </main>
    </div>
  );
}
