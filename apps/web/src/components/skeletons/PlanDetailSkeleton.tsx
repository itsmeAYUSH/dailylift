import { Card, CardContent, CardHeader } from "@dailylift/ui/components/card";
import { Skeleton } from "@dailylift/ui/components/skeleton";

export function PlanDetailSkeleton() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 animate-fade-in">
      {/* Back link */}
      <Skeleton className="mb-4 h-4 w-20 rounded" />

      {/* Page Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="flex gap-2">
            <Skeleton className="h-3 w-12 rounded" />
            <Skeleton className="h-3 w-12 rounded" />
            <Skeleton className="h-3 w-24 rounded" />
          </div>
          <Skeleton className="h-8 w-56 rounded-lg" />
          <Skeleton className="h-4 w-72 rounded-md" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-9 w-20 rounded-lg" />
        </div>
      </div>

      {/* Plan days */}
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 pb-3">
              <div className="space-y-1">
                <Skeleton className="h-5 w-32 rounded-md" />
                <Skeleton className="h-4 w-24 rounded" />
              </div>
              <Skeleton className="h-9 w-20 rounded-lg" />
            </CardHeader>
            <CardContent className="space-y-2">
              {Array.from({ length: 3 }).map((_, j) => (
                <div
                  key={j}
                  className="flex items-center justify-between gap-3 rounded-lg bg-secondary/50 px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <Skeleton className="size-4 rounded" />
                    <Skeleton className="h-4 w-36 rounded" />
                  </div>
                  <Skeleton className="h-4 w-16 rounded" />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
