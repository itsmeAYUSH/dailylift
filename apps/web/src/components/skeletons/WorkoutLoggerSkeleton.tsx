import { Card, CardContent, CardHeader } from "@dailylift/ui/components/card";
import { Skeleton } from "@dailylift/ui/components/skeleton";

export function WorkoutLoggerSkeleton() {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-6 animate-fade-in">
      {/* Sticky Header Skeleton */}
      <div className="sticky top-16 z-20 -mx-4 border-b bg-background/90 px-4 py-3 backdrop-blur md:top-[4.5rem]">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1.5">
            <Skeleton className="h-6 w-48 rounded-md" />
            <Skeleton className="h-4 w-20 rounded" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="size-8 rounded-lg" />
            <Skeleton className="h-8 w-20 rounded-lg" />
          </div>
        </div>
      </div>

      {/* Exercise Cards */}
      <div className="mt-5 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-3">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Skeleton className="size-4 rounded" />
                  <Skeleton className="h-5 w-36 rounded-md" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-3 w-40 rounded" />
              </div>
              <Skeleton className="size-8 rounded-lg" />
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Column labels */}
              <div className="grid grid-cols-[1.5rem_1fr_1fr_2.5rem_2rem] items-center gap-2 px-1">
                <Skeleton className="h-3 w-3 rounded" />
                <Skeleton className="h-3 w-8 rounded" />
                <Skeleton className="h-3 w-8 rounded" />
                <Skeleton className="h-3 w-8 mx-auto rounded" />
                <div />
              </div>

              {/* Set rows */}
              {Array.from({ length: 3 }).map((_, j) => (
                <div
                  key={j}
                  className="grid grid-cols-[1.5rem_1fr_1fr_2.5rem_2rem] items-center gap-2 rounded-lg px-1 py-1"
                >
                  <Skeleton className="h-4 w-3 rounded" />
                  <Skeleton className="h-9 w-full rounded-md" />
                  <Skeleton className="h-9 w-full rounded-md" />
                  <Skeleton className="size-8 mx-auto rounded-lg" />
                  <Skeleton className="size-6 mx-auto rounded" />
                </div>
              ))}

              <Skeleton className="h-8 w-full rounded-md" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add exercise button */}
      <Skeleton className="mt-4 h-10 w-full rounded-lg" />
    </div>
  );
}
