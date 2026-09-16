import { Card, CardContent } from "@dailylift/ui/components/card";
import { Skeleton } from "@dailylift/ui/components/skeleton";

export function PlansSkeleton() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 animate-fade-in">
      {/* Page Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-44 rounded-lg" />
          <Skeleton className="h-4 w-64 rounded-md" />
        </div>
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>

      {/* Plan list */}
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-44 rounded-md" />
                  {i === 0 && <Skeleton className="h-5 w-16 rounded-full" />}
                  <Skeleton className="h-5 w-14 rounded-full" />
                </div>
                <Skeleton className="h-4 w-28 rounded" />
              </div>
              <div className="flex items-center gap-1.5">
                {i !== 0 && <Skeleton className="h-8 w-20 rounded-md" />}
                <Skeleton className="size-8 rounded-lg" />
                <Skeleton className="size-8 rounded-lg" />
                <Skeleton className="size-8 rounded-lg" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
