import { Card, CardContent, CardHeader } from "@dailylift/ui/components/card";
import { Skeleton } from "@dailylift/ui/components/skeleton";

export function ProfileSkeleton() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 animate-fade-in">
      {/* Page Header */}
      <div className="mb-8 space-y-2">
        <Skeleton className="h-8 w-28 rounded-lg" />
        <Skeleton className="h-4 w-72 rounded-md" />
      </div>

      {/* Personal details card */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-36 rounded-md" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-20 rounded" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <Skeleton className="h-4 w-24 rounded" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Training & nutrition card */}
      <Card className="mt-4">
        <CardHeader>
          <Skeleton className="h-5 w-44 rounded-md" />
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-4 w-28 rounded" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Footer buttons */}
      <div className="mt-6 flex items-center justify-between">
        <Skeleton className="h-9 w-24 rounded-lg" />
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>
    </div>
  );
}
