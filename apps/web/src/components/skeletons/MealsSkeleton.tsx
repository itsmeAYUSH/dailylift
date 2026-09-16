import { Card, CardContent } from "@dailylift/ui/components/card";
import { Skeleton } from "@dailylift/ui/components/skeleton";

export function MealsSkeleton() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 animate-fade-in">
      {/* Page Header */}
      <div className="mb-8 space-y-2">
        <Skeleton className="h-8 w-44 rounded-lg" />
        <Skeleton className="h-4 w-96 max-w-full rounded-md" />
      </div>

      <div className="space-y-6">
        {/* Macro Header Hero Card */}
        <Card className="overflow-hidden">
          <div className="bg-primary/15 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-48 rounded-md" />
              <Skeleton className="h-8 w-24 rounded-lg" />
            </div>
            <div className="grid grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="text-center space-y-1.5">
                  <Skeleton className="size-5 mx-auto rounded" />
                  <Skeleton className="h-6 w-14 mx-auto rounded-md" />
                  <Skeleton className="h-3 w-10 mx-auto rounded" />
                </div>
              ))}
            </div>
          </div>
          <div className="bg-secondary/30 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-32 rounded" />
              <Skeleton className="h-4 w-24 rounded" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        </Card>

        {/* Hydration Reminder */}
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <Skeleton className="size-12 rounded-xl" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-28 rounded" />
              <Skeleton className="h-3 w-48 rounded" />
            </div>
          </CardContent>
        </Card>

        {/* Meals */}
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <div className="flex items-center gap-4 p-4">
                <Skeleton className="size-10 rounded-full shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-16 rounded-full" />
                    <Skeleton className="h-3 w-12 rounded" />
                  </div>
                  <Skeleton className="h-5 w-44 rounded-md" />
                </div>
                <div className="hidden sm:block text-right space-y-1">
                  <Skeleton className="h-5 w-16 ml-auto rounded" />
                  <Skeleton className="h-3 w-28 rounded" />
                </div>
                <Skeleton className="size-5 rounded" />
              </div>
            </Card>
          ))}
        </div>

        {/* Tips */}
        <Card>
          <CardContent className="p-6 space-y-3">
            <Skeleton className="h-5 w-32 rounded-md" />
            <div className="space-y-2 pt-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-start gap-2">
                  <Skeleton className="size-5 rounded-full shrink-0" />
                  <Skeleton className="h-4 w-full max-w-lg rounded" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
