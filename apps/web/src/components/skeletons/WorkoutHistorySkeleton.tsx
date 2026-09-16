import { Card, CardContent } from "@dailylift/ui/components/card";
import { Skeleton } from "@dailylift/ui/components/skeleton";

export function WorkoutHistorySkeleton() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 animate-fade-in">
      {/* Back link */}
      <Skeleton className="mb-4 h-4 w-16 rounded" />

      {/* Page Header */}
      <div className="mb-8 space-y-2">
        <div className="flex gap-2">
          <Skeleton className="h-3 w-12 rounded" />
          <Skeleton className="h-3 w-16 rounded" />
          <Skeleton className="h-3 w-14 rounded" />
        </div>
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Skeleton className="h-4 w-72 rounded-md" />
      </div>

      {/* History cards */}
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-5 w-48 rounded-md" />
                <Skeleton className="h-3 w-32 rounded" />
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-14 rounded-full" />
                  <Skeleton className="h-5 w-18 rounded-full" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              </div>
              <Skeleton className="size-8 rounded-lg" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
