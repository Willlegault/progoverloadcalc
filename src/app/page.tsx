import ProgressiveOverloadCalculator from "@/components/ProgressiveOverloadCalculator";

export default function Home() {
  return (
    <div className="min-h-screen p-8 pb-20 sm:p-20">
      <main className="flex flex-col gap-8 items-center">
        <div className="text-center space-y-4 mb-8">
          <h1 className="text-4xl font-bold tracking-tight">Progressive Overload Calculator</h1>
          <p className="text-muted-foreground max-w-2xl">
            Enter your previous top sets to generate your next workout. We calculate both <strong>Perceived 1RM</strong> (RPE-based) 
            and <strong>Estimated 1RM</strong> (Epley&apos;s formula), then use your Perceived 1RM for progressive overload recommendations 
            that account for how you felt during your lifts.
          </p>
        </div>
        <ProgressiveOverloadCalculator />
      </main>
    </div>
  );
}
