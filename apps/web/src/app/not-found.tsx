import Link from "next/link";
import { Dumbbell, Home, Search } from "lucide-react";
import { Button } from "@dailylift/ui/components/button";

export default function NotFound() {
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden px-6 text-center">
      {/* Soft brand glow */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-glow" />
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-grid opacity-40" />

      <div className="relative flex flex-col items-center">
        <Link href="/" className="mb-8 flex items-center gap-2.5">
          <span className="grid size-10 place-items-center rounded-xl text-primary-foreground shadow-sm gradient-primary">
            <Dumbbell className="size-5" />
          </span>
          <span className="font-display text-xl font-bold tracking-tight">DailyLift</span>
        </Link>

        <p className="font-display text-8xl font-extrabold leading-none text-brand-gradient sm:text-9xl">404</p>

        <h1 className="mt-6 font-display text-2xl font-bold tracking-tight sm:text-3xl">
          This page skipped leg day
        </h1>
        <p className="mt-3 max-w-md text-muted-foreground">
          We couldn&apos;t find the page you&apos;re looking for. It may have been moved, renamed, or never existed.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/dashboard">
            <Button size="lg">
              <Home className="size-4" /> Back to dashboard
            </Button>
          </Link>
          <Link href="/exercises">
            <Button size="lg" variant="outline">
              <Search className="size-4" /> Browse exercises
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
