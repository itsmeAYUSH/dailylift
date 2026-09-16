import { Card, CardContent } from "@dailylift/ui/components/card";
import { Skeleton } from "@dailylift/ui/components/skeleton";

export function ExercisesSkeleton() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 animate-fade-in">
      {/* Page Header */}
      <div className="mb-8 space-y-2">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Skeleton className="h-4 w-80 rounded-md" />
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-3">
        <Skeleton className="h-10 w-full rounded-lg" />
        <div className="flex flex-wrap gap-2">
          {["w-20", "w-16", "w-16", "w-20", "w-14", "w-16", "w-20"].map((w, i) => (
            <Skeleton key={i} className={`h-8 ${w} rounded-full`} />
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {["w-20", "w-16", "w-16"].map((w, i) => (
            <Skeleton key={i} className={`h-8 ${w} rounded-full`} />
          ))}
        </div>
      </div>

      {/* Grid of exercises */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <Card key={i} className="h-full">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <Skeleton className="h-5 w-32 rounded-md" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                <Skeleton className="h-5 w-14 rounded-full" />
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
