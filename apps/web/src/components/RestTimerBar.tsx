"use client";

import { useEffect } from "react";
import { Timer, Plus, X } from "lucide-react";
import { Button } from "@dailylift/ui/components/button";
import { useRestTimer, formatClock } from "@/stores/restTimer";

/**
 * Sticky rest-timer bar shown app-wide whenever a rest is running. Because the
 * timer state lives in a global store (mirrored to localStorage), it survives
 * navigation between pages and page refreshes mid-workout.
 */
export function RestTimerBar() {
  const { running, remaining, duration, addTime, skip, _hydrate } = useRestTimer();

  useEffect(() => {
    _hydrate();
  }, [_hydrate]);

  if (!running) return null;

  const pct = duration > 0 ? ((duration - remaining) / duration) * 100 : 0;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur">
      <div className="relative h-1 w-full bg-secondary">
        <div
          className="h-full bg-primary transition-[width] duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Timer className="size-4 text-primary" />
          <span className="font-display text-lg font-bold tabular-nums">
            {formatClock(remaining)}
          </span>
          <span className="text-sm text-muted-foreground">rest</span>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => addTime(15)}>
            <Plus className="size-4" /> 15s
          </Button>
          <Button size="sm" variant="ghost" onClick={skip}>
            <X className="size-4" /> Skip
          </Button>
        </div>
      </div>
    </div>
  );
}
