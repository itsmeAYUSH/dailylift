"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AuthGate } from "@/components/AuthGate";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { WorkoutHistorySkeleton } from "@/components/skeletons";
import { useWorkoutHistory, qk } from "@/hooks/queries";
import { fetchWorkout, deleteWorkout, fetchLastPerformance } from "@/lib/db/workouts";
import type { FullWorkout, WorkoutSetRow } from "@/lib/db/types";
import { formatClock } from "@/stores/restTimer";
import {
  summarizeSets,
  suggestProgression,
  compareProgress,
  type ProgressDirection,
} from "@/lib/fitness/overload";
import { Button } from "@dailylift/ui/components/button";
import { Card, CardContent } from "@dailylift/ui/components/card";
import { Badge } from "@dailylift/ui/components/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@dailylift/ui/components/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@dailylift/ui/components/alert-dialog";
import {
  ArrowLeft,
  Trash2,
  Dumbbell,
  Clock,
  Layers,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
} from "lucide-react";

const DIRECTION: Record<
  ProgressDirection,
  { label: string; variant: "default" | "secondary" | "outline"; icon: typeof TrendingUp }
> = {
  up: { label: "Improved", variant: "default", icon: TrendingUp },
  same: { label: "Similar", variant: "secondary", icon: Minus },
  down: { label: "Down", variant: "outline", icon: TrendingDown },
  baseline: { label: "Baseline", variant: "secondary", icon: Sparkles },
};

export default function HistoryPage() {
  return (
    <Suspense
      fallback={
        <AuthGate fallback={<WorkoutHistorySkeleton />}>
          <WorkoutHistorySkeleton />
        </AuthGate>
      }
    >
      <History />
    </Suspense>
  );
}

function History() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlWorkoutId = searchParams.get("workout") ?? searchParams.get("id");

  const { data: history, isLoading } = useWorkoutHistory();
  const qc = useQueryClient();
  const [detail, setDetail] = useState<FullWorkout | null>(null);
  const [prevMap, setPrevMap] = useState<Record<string, WorkoutSetRow[]>>({});
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const openDetail = async (id: string, updateUrl = true) => {
    const w = await fetchWorkout(id);
    setDetail(w);
    setPrevMap({});
    if (updateUrl) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("workout", id);
      params.delete("id");
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
    if (!w) return;
    // Pull each exercise's previous session for a progression comparison.
    const entries = await Promise.all(
      w.workout_exercises.map(async (we) => {
        const prev = await fetchLastPerformance({
          exerciseId: we.exercise_id,
          name: we.name,
          excludeWorkoutId: w.id,
        }).catch(() => [] as WorkoutSetRow[]);
        return [we.id, prev] as const;
      }),
    );
    setPrevMap(Object.fromEntries(entries));
  };

  const closeDetail = () => {
    setDetail(null);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("workout");
    params.delete("id");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  useEffect(() => {
    if (urlWorkoutId && (!detail || detail.id !== urlWorkoutId)) {
      openDetail(urlWorkoutId, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlWorkoutId]);

  const handleDelete = async () => {
    if (!confirmDelete) return;
    await deleteWorkout(confirmDelete).catch(() => toast.error("Could not delete"));
    setConfirmDelete(null);
    qc.invalidateQueries({ queryKey: qk.history });
    qc.invalidateQueries({ queryKey: qk.dashboard });
    toast.success("Workout deleted");
  };

  return (
    <AuthGate fallback={<WorkoutHistorySkeleton />}>
      {isLoading ? (
        <WorkoutHistorySkeleton />
      ) : (
        <div className="container mx-auto max-w-4xl px-4 py-8">
          <Link href="/workouts" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> Train
          </Link>
          <PageHeader
            title="Workout history"
            subtitle="Every completed session, with sets, volume, and duration."
            breadcrumbs={[
              { label: "Home", href: "/dashboard" },
              { label: "Workouts", href: "/workouts" },
              { label: "History" },
            ]}
          />

          {!history || history.length === 0 ? (
            <EmptyState
              icon={Dumbbell}
              title="No workouts logged yet"
              description="Finish your first session and it will show up here with all your stats."
              action={
                <Link href="/workouts">
                  <Button>Start a workout</Button>
                </Link>
              }
            />
          ) : (
            <div className="space-y-3">
              {history.map((w) => {
                const sets = w.workout_exercises.flatMap((we) => we.workout_sets).filter((s) => s.is_completed);
                const volume = Math.round(
                  sets.reduce((v, s) => v + (s.weight_kg ?? 0) * (s.reps ?? 0), 0),
                );
                return (
                  <Card key={w.id} className="hover-lift transition-colors hover:border-primary/40">
                    <CardContent className="flex items-center gap-4 p-4">
                      <button className="min-w-0 flex-1 text-left" onClick={() => openDetail(w.id)}>
                        <p className="font-display font-semibold">{w.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(w.started_at).toLocaleDateString(undefined, {
                            weekday: "short",
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          <Badge variant="secondary" className="gap-1">
                            <Layers className="size-3" /> {w.workout_exercises.length} ex
                          </Badge>
                          <Badge variant="secondary">{sets.length} sets</Badge>
                          <Badge variant="secondary">{volume} kg</Badge>
                          {w.duration_seconds != null && (
                            <Badge variant="secondary" className="gap-1">
                              <Clock className="size-3" /> {formatClock(w.duration_seconds)}
                            </Badge>
                          )}
                        </div>
                      </button>
                      <Button size="icon" variant="ghost" onClick={() => setConfirmDelete(w.id)}>
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          <Dialog open={!!detail} onOpenChange={(o) => !o && closeDetail()}>
            <DialogContent className="max-h-[85vh] overflow-y-auto">
              {detail && (
                <>
                  <DialogHeader>
                    <DialogTitle className="font-display text-xl">{detail.name}</DialogTitle>
                  </DialogHeader>
                  <p className="text-sm text-muted-foreground">
                    {new Date(detail.started_at).toLocaleString()}
                    {detail.duration_seconds != null && ` · ${formatClock(detail.duration_seconds)}`}
                  </p>
                  <div className="space-y-3">
                    {detail.workout_exercises.map((we) => {
                      const completed = we.workout_sets.filter((s) => s.is_completed);
                      const prev = prevMap[we.id] ?? [];
                      const suggestion = suggestProgression({ lastSets: completed });
                      const dirMeta = DIRECTION[compareProgress(completed, prev)];
                      return (
                        <div key={we.id} className="rounded-lg bg-secondary/50 p-3">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium">{we.name}</p>
                            <Badge variant={dirMeta.variant} className="shrink-0 gap-1">
                              <dirMeta.icon className="size-3" /> {dirMeta.label}
                            </Badge>
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {summarizeSets(completed) || "No sets logged"}
                          </p>
                          {prev.length > 0 && (
                            <p className="text-xs text-muted-foreground">
                              Prev: {summarizeSets(prev)}
                            </p>
                          )}
                          {suggestion.action === "none" ? (
                            <p className="mt-1 text-xs text-muted-foreground">
                              Build baseline — log a full working set to get a suggestion.
                            </p>
                          ) : (
                            <p className="mt-1 flex items-start gap-1.5 text-xs text-muted-foreground">
                              <TrendingUp className="mt-0.5 size-3 shrink-0 text-primary" />
                              <span>Next: {suggestion.message}</span>
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Suggestions are general guidance from your logged sets, not medical advice.
                  </p>
                </>
              )}
            </DialogContent>
          </Dialog>

          <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this workout?</AlertDialogTitle>
                <AlertDialogDescription>
                  This permanently removes the session and its sets. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </AuthGate>
  );
}
