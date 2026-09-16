import { Card, CardContent, CardHeader } from "@dailylift/ui/components/card";
import { Skeleton } from "@dailylift/ui/components/skeleton";

export function ProgressSkeleton() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 animate-fade-in">
      {/* Page Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32 rounded-lg" />
          <Skeleton className="h-4 w-72 rounded-md" />
        </div>
        <Skeleton className="h-10 w-28 rounded-lg" />
      </div>

      {/* Ranges */}
      <div className="mb-6 flex gap-2">
        {["w-12", "w-12", "w-12", "w-12"].map((w, i) => (
          <Skeleton key={i} className={`h-8 ${w} rounded-lg`} />
        ))}
      </div>

      {/* 3 Stat cards */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4 text-center space-y-2">
              <Skeleton className="h-6 w-16 mx-auto rounded-md" />
              <Skeleton className="h-3 w-12 mx-auto rounded" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="space-y-6">
        {/* Weight chart card */}
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32 rounded-md" />
          </CardHeader>
          <CardContent>
            <div className="h-[240px] flex flex-col justify-between py-2">
              <div className="flex items-center justify-between h-44 px-4 border-b border-border/50">
                <Skeleton className="h-32 w-full rounded-xl opacity-60" />
              </div>
              <div className="flex justify-between px-4 pt-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-3 w-10 rounded" />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Volume chart card */}
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-44 rounded-md" />
          </CardHeader>
          <CardContent>
            <div className="h-[240px] flex flex-col justify-end space-y-2 pt-4">
              <div className="flex items-end justify-between gap-3 h-40 px-4">
                {[50, 75, 40, 90, 60, 85, 70].map((h, i) => (
                  <Skeleton
                    key={i}
                    className="w-full rounded-t-md opacity-70"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
              <div className="flex justify-between px-4 pt-2 border-t border-border/50">
                {Array.from({ length: 7 }).map((_, i) => (
                  <Skeleton key={i} className="h-3 w-10 rounded" />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal records card */}
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-36 rounded-md" />
          </CardHeader>
          <CardContent className="space-y-2.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2.5"
              >
                <div className="space-y-1">
                  <Skeleton className="h-4 w-36 rounded" />
                  <Skeleton className="h-3 w-28 rounded" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
