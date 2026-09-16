import { Card, CardContent, CardHeader } from "@dailylift/ui/components/card";
import { Skeleton } from "@dailylift/ui/components/skeleton";

export function CalculatorsSkeleton() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 animate-fade-in">
      {/* Page Header */}
      <div className="mb-8 space-y-2">
        <Skeleton className="h-8 w-52 rounded-lg" />
        <Skeleton className="h-4 w-96 max-w-full rounded-md" />
      </div>

      <div className="space-y-6">
        {/* Selector dropdown */}
        <div className="max-w-md space-y-2">
          <Skeleton className="h-4 w-36 rounded" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>

        {/* Calculator Form Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Skeleton className="size-5 rounded" />
              <Skeleton className="h-6 w-48 rounded-md" />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24 rounded" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24 rounded" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
            </div>

            <Skeleton className="h-11 w-full rounded-lg" />

            {/* Result preview card */}
            <div className="p-6 rounded-xl bg-secondary/50 text-center space-y-3">
              <Skeleton className="h-12 w-28 mx-auto rounded-lg" />
              <Skeleton className="h-4 w-24 mx-auto rounded" />
              <Skeleton className="h-3 w-48 mx-auto rounded" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
