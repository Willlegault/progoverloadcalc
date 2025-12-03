import ProgressiveOverloadCalculator from "@/components/ProgressiveOverloadCalculator";

export default function Home() {
  return (
    <div className="min-h-screen p-8 pb-20 sm:p-20">
      <main className="flex flex-col gap-8 items-center">
        <div className="text-center space-y-4 mb-8">
          <h1 className="text-4xl font-bold tracking-tight">Progressive Overload Calculator</h1>
          <p className="text-muted-foreground max-w-2xl">
            Generate your next workout with progressive overload recommendations based on your previous workout data.
            Uses Epley&apos;s formula and RPE-based calculations to optimize your training progression.
          </p>
        </div>
        <ProgressiveOverloadCalculator />
      </main>
    </div>
  );
}
