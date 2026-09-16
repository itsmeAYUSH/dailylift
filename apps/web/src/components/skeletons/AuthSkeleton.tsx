import { Skeleton } from "@dailylift/ui/components/skeleton";

export function AuthSkeleton() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-md space-y-6">
        <Skeleton className="h-4 w-28 rounded" />

        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm space-y-6">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2.5">
            <Skeleton className="size-10 rounded-lg" />
            <Skeleton className="h-6 w-24 rounded-md" />
          </div>

          {/* Title */}
          <div className="text-center space-y-2">
            <Skeleton className="h-7 w-48 mx-auto rounded-md" />
            <Skeleton className="h-4 w-64 mx-auto rounded" />
          </div>

          {/* Form fields */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-16 rounded" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-18 rounded" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
            <Skeleton className="h-11 w-full rounded-lg" />
          </div>

          {/* Divider */}
          <div className="relative my-4">
            <div className="border-t border-border" />
          </div>

          {/* OAuth button */}
          <Skeleton className="h-11 w-full rounded-lg" />

          {/* Bottom link */}
          <Skeleton className="h-4 w-44 mx-auto rounded" />
        </div>
      </div>
    </div>
  );
}
