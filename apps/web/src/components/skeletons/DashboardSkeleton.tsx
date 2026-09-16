import { Card, CardContent, CardHeader } from "@dailylift/ui/components/card";
import { Skeleton } from "@dailylift/ui/components/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 animate-fade-in">
      {/* Header */}
      <div className="mb-6 space-y-2">
        <Skeleton className="h-8 w-64 rounded-lg" />
        <Skeleton className="h-4 w-80 max-w-full rounded-md" />
      </div>

      {/* Hero card */}
      <Card className="mb-6 overflow-hidden border-0 bg-primary/10">
        <CardContent className="flex flex-wrap items-center justify-between gap-6 p-6">
          <div className="flex items-center gap-4">
            <Skeleton className="size-14 rounded-2xl" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-28 rounded" />
              <Skeleton className="h-7 w-44 rounded-lg" />
              <Skeleton className="h-3 w-32 rounded" />
            </div>
          </div>

          <div className="flex items-center gap-5">
            <Skeleton className="size-24 rounded-full" />
            <Skeleton className="h-11 w-36 rounded-lg" />
          </div>
        </CardContent>
      </Card>

      {/* Weekly overview stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="size-8 rounded-lg" />
                <Skeleton className="h-4 w-10 rounded-full" />
              </div>
              <Skeleton className="h-7 w-20 rounded-md" />
              <Skeleton className="h-3 w-16 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Insight */}
      <Card className="mb-6">
        <CardContent className="flex items-start gap-3 p-4">
          <Skeleton className="size-9 shrink-0 rounded-lg" />
          <div className="w-full space-y-2">
            <Skeleton className="h-4 w-48 rounded" />
            <Skeleton className="h-3 w-full max-w-md rounded" />
          </div>
        </CardContent>
      </Card>

      {/* Charts row */}
      <div className="mb-6 grid gap-6 lg:grid-cols-3">
        <Card className="h-full lg:col-span-2">
          <CardHeader className="pb-3">
            <Skeleton className="h-5 w-52 rounded" />
          </CardHeader>
          <CardContent>
            <div className="h-[200px] flex flex-col justify-end space-y-2 pt-4">
              <div className="flex items-end justify-between gap-2 h-36 px-2">
                {[40, 65, 30, 80, 55, 90, 70, 85].map((h, i) => (
                  <Skeleton
                    key={i}
                    className="w-full rounded-t-md opacity-70"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
              <div className="flex justify-between px-2 pt-2 border-t border-border/50">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-3 w-8 rounded" />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardHeader className="pb-3">
            <Skeleton className="h-5 w-32 rounded" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-baseline gap-2">
              <Skeleton className="h-8 w-24 rounded-md" />
              <Skeleton className="h-4 w-12 rounded" />
            </div>
            <Skeleton className="h-[120px] w-full rounded-xl" />
          </CardContent>
        </Card>
      </div>

      {/* Metrics and Records */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="h-full">
          <CardHeader className="pb-3">
            <Skeleton className="h-5 w-32 rounded" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-xl bg-secondary/50 p-3 space-y-2 text-center">
                  <Skeleton className="h-6 w-12 mx-auto rounded" />
                  <Skeleton className="h-3 w-8 mx-auto rounded" />
                </div>
              ))}
            </div>
            <Skeleton className="h-10 w-full rounded-lg" />
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardHeader className="pb-3">
            <Skeleton className="h-5 w-36 rounded" />
          </CardHeader>
          <CardContent className="space-y-2.5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg bg-secondary/40 p-2.5">
                <Skeleton className="h-4 w-32 rounded" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="flex flex-col items-center gap-2 p-4 text-center">
              <Skeleton className="size-10 rounded-xl" />
              <Skeleton className="h-4 w-20 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
