import { Skeleton } from "@dailylift/ui/components/skeleton";

export function OnboardingSkeleton() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-2xl space-y-8">
        {/* Brand */}
        <div className="flex items-center justify-center gap-2.5">
          <Skeleton className="size-10 rounded-lg" />
          <Skeleton className="h-6 w-24 rounded-md" />
        </div>

        {/* Steps indicator */}
        <div className="flex items-center justify-center gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-8 w-20 rounded-full" />
              {i < 3 && <Skeleton className="h-0.5 w-6 rounded" />}
            </div>
          ))}
        </div>

        {/* Form Card */}
        <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-6 w-48 rounded-md" />
            <Skeleton className="h-4 w-72 rounded-md" />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 space-y-2">
              <Skeleton className="h-4 w-20 rounded" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-12 rounded" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-16 rounded" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-border/50">
            <Skeleton className="h-10 w-20 rounded-lg" />
            <Skeleton className="h-10 w-24 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
