import { Card, CardContent, CardHeader } from "@dailylift/ui/components/card";
import { Skeleton } from "@dailylift/ui/components/skeleton";

export function WorkoutsSkeleton() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 animate-fade-in">
      {/* Page Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32 rounded-lg" />
          <Skeleton className="h-4 w-64 rounded-md" />
        </div>
        <Skeleton className="h-10 w-28 rounded-lg" />
      </div>

      {/* In-progress card placeholder */}
      <Card className="mb-6 border-primary/20 bg-accent/20">
        <CardContent className="flex items-center justify-between gap-4 p-4">
          <div className="space-y-2">
            <Skeleton className="h-3 w-32 rounded" />
            <Skeleton className="h-5 w-48 rounded" />
          </div>
          <Skeleton className="h-9 w-24 rounded-lg" />
        </CardContent>
      </Card>

      {/* Plan Days Section */}
      <div className="mb-4 flex items-center justify-between">
        <Skeleton className="h-6 w-44 rounded-md" />
        <Skeleton className="h-4 w-16 rounded" />
      </div>

      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 pb-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-36 rounded-md" />
                  {i === 0 && <Skeleton className="h-5 w-16 rounded-full" />}
                </div>
                <Skeleton className="h-4 w-24 rounded" />
              </div>
              <Skeleton className="h-9 w-20 rounded-lg" />
            </CardHeader>
          </Card>
        ))}
      </div>

      <Skeleton className="mt-4 h-10 w-full rounded-lg" />

      {/* Recent workouts */}
      <div className="mt-8 space-y-3">
        <Skeleton className="h-6 w-24 rounded-md" />
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="flex items-center justify-between p-3.5">
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-40 rounded" />
                  <Skeleton className="h-3 w-24 rounded" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
