"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { AuthGate } from "@/components/AuthGate";
import { PageHeader } from "@/components/PageHeader";
import { ExercisePickerDialog, type ExercisePick } from "@/components/ExercisePickerDialog";
import { PlanDetailSkeleton } from "@/components/skeletons";
import { usePlan, useSetActivePlan, useActiveWorkout, qk } from "@/hooks/queries";
import { startWorkout } from "@/lib/db/workouts";
import {
  addPlannedExercise,
  replacePlannedExercise,
  removePlannedExercise,
  reorderPlannedExercises,
} from "@/lib/db/plans";
import type { PlanDayWithExercises } from "@/lib/db/types";
import { Button } from "@dailylift/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@dailylift/ui/components/card";
import { Badge } from "@dailylift/ui/components/badge";
import { Skeleton } from "@dailylift/ui/components/skeleton";
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
  Play,
  CheckCircle2,
  ArrowLeft,
  Dumbbell,
  Pencil,
  Plus,
  Trash2,
  Replace,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

function titleCase(s: string | null) {
  return (s ?? "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function PlanDetailPage() {
  const params = useParams<{ id: string }>();
  const { data: plan, isLoading } = usePlan(params.id);
  const { data: activeWorkout, isLoading: activeWorkoutLoading } = useActiveWorkout();
  const setActive = useSetActivePlan();
  const router = useRouter();
  const qc = useQueryClient();
  const [startingDay, setStartingDay] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  // Picker target: add to a day, or replace a specific planned exercise.
  const [picker, setPicker] = useState<{ mode: "add" | "replace"; id: string } | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  const refresh = () => qc.invalidateQueries({ queryKey: qk.plan(params.id) });

  const runEdit = async (fn: () => Promise<void>) => {
    setSaving(true);
    try {
      await fn();
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save change");
    } finally {
      setSaving(false);
    }
  };

  const handlePick = (pick: ExercisePick) => {
    const target = picker;
    setPicker(null);
    if (!target) return;
    if (target.mode === "add") {
      runEdit(() => addPlannedExercise(target.id, { exercise_id: pick.exercise_id, name: pick.name }));
    } else {
      runEdit(() => replacePlannedExercise(target.id, { exercise_id: pick.exercise_id, name: pick.name }));
    }
  };

  const move = (day: PlanDayWithExercises, index: number, dir: -1 | 1) => {
    const ids = day.planned_exercises.map((pe) => pe.id);
    const to = index + dir;
    if (to < 0 || to >= ids.length) return;
    [ids[index], ids[to]] = [ids[to], ids[index]];
    runEdit(() => reorderPlannedExercises(ids));
  };

  const handleStart = async (day: PlanDayWithExercises) => {
    setStartingDay(day.id);
    try {
      const workout = await startWorkout({
        name: `${plan?.name ? plan.name.split(" — ")[0] : "Workout"} · ${day.name}`,
        planId: plan?.id,
        planDayId: day.id,
        exercises: day.planned_exercises.map((pe) => ({
          exercise_id: pe.exercise_id,
          name: pe.name,
          target_sets: pe.target_sets,
          target_reps_min: pe.target_reps_min,
          target_reps_max: pe.target_reps_max,
          rest_seconds: pe.rest_seconds,
        })),
      });
      router.push(`/workouts/${workout.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not start workout");
      setStartingDay(null);
    }
  };

  return (
    <AuthGate fallback={<PlanDetailSkeleton />}>
      {isLoading ? (
        <PlanDetailSkeleton />
      ) : (
        <div className="container mx-auto max-w-4xl px-4 py-8">
          <Link href="/plans" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> All plans
          </Link>

          {!plan ? (
            <p className="text-muted-foreground">Plan not found.</p>
          ) : (
            <>
              <PageHeader
                title={plan.name ?? "Plan"}
                subtitle={plan.description ?? undefined}
                breadcrumbs={[
                  { label: "Home", href: "/dashboard" },
                  { label: "Plans", href: "/plans" },
                  { label: plan.name ?? "Plan" },
                ]}
              actions={
                <div className="flex items-center gap-2">
                  {plan.is_active ? (
                    <Badge className="gap-1">
                      <CheckCircle2 className="size-3" /> Active plan
                    </Badge>
                  ) : (
                    <Button variant="outline" onClick={() => setActive.mutate(plan.id)}>
                      Set as active
                    </Button>
                  )}
                  <Button
                    variant={editing ? "default" : "outline"}
                    onClick={() => setEditing((v) => !v)}
                  >
                    {editing ? (
                      "Done"
                    ) : (
                      <>
                        <Pencil className="size-4" /> Edit
                      </>
                    )}
                  </Button>
                </div>
              }
            />

            <div className="space-y-4">
              {plan.workout_plan_days.map((day) => (
                <Card key={day.id}>
                  <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
                    <div>
                      <CardTitle className="text-lg">{day.name}</CardTitle>
                      {day.focus && (
                        <p className="text-sm text-muted-foreground capitalize">{titleCase(day.focus)}</p>
                      )}
                    </div>
                    <Button
                      onClick={() =>
                        activeWorkout ? router.push(`/workouts/${activeWorkout.id}`) : handleStart(day)
                      }
                      disabled={activeWorkoutLoading || startingDay === day.id}
                    >
                      <Play className="size-4" />
                      {activeWorkout ? "Resume" : startingDay === day.id ? "Starting…" : "Start"}
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {day.planned_exercises.length === 0 && !editing ? (
                      <p className="text-sm text-muted-foreground">No exercises on this day.</p>
                    ) : (
                      day.planned_exercises.map((pe, i) => (
                        <div
                          key={pe.id}
                          className="flex items-center justify-between gap-3 rounded-lg bg-secondary/50 px-3 py-2"
                        >
                          <div className="flex min-w-0 items-center gap-2">
                            <Dumbbell className="size-4 shrink-0 text-muted-foreground" />
                            <span className="truncate font-medium">{pe.name}</span>
                          </div>
                          {editing ? (
                            <div className="flex shrink-0 items-center gap-0.5">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="size-8"
                                disabled={saving || i === 0}
                                onClick={() => move(day, i, -1)}
                                aria-label="Move up"
                              >
                                <ChevronUp className="size-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="size-8"
                                disabled={saving || i === day.planned_exercises.length - 1}
                                onClick={() => move(day, i, 1)}
                                aria-label="Move down"
                              >
                                <ChevronDown className="size-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="size-8"
                                disabled={saving}
                                onClick={() => setPicker({ mode: "replace", id: pe.id })}
                                aria-label="Replace exercise"
                              >
                                <Replace className="size-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="size-8"
                                disabled={saving}
                                onClick={() => setConfirmRemove(pe.id)}
                                aria-label="Remove exercise"
                              >
                                <Trash2 className="size-4 text-destructive" />
                              </Button>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              {pe.target_sets ?? 3} ×{" "}
                              {pe.target_reps_min && pe.target_reps_max
                                ? `${pe.target_reps_min}–${pe.target_reps_max}`
                                : "—"}
                            </span>
                          )}
                        </div>
                      ))
                    )}
                    {editing && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full"
                        disabled={saving}
                        onClick={() => setPicker({ mode: "add", id: day.id })}
                      >
                        <Plus className="size-4" /> Add exercise
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            <ExercisePickerDialog
              open={!!picker}
              onOpenChange={(o) => !o && setPicker(null)}
              onSelect={handlePick}
              title={picker?.mode === "replace" ? "Replace exercise" : "Add exercise"}
            />

            <AlertDialog open={!!confirmRemove} onOpenChange={(o) => !o && setConfirmRemove(null)}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remove this exercise?</AlertDialogTitle>
                  <AlertDialogDescription>
                    It will be removed from this plan day.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      const id = confirmRemove;
                      setConfirmRemove(null);
                      if (id) runEdit(() => removePlannedExercise(id));
                    }}
                  >
                    Remove
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      </div>
      )}
    </AuthGate>
  );
}
