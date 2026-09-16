"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { AuthGate } from "@/components/AuthGate";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { useActivePlan, useActiveWorkout, useWorkoutHistory, useDashboard } from "@/hooks/queries";
import { startWorkout } from "@/lib/db/workouts";
import type { PlanDayWithExercises } from "@/lib/db/types";
import { Button } from "@dailylift/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@dailylift/ui/components/card";
import { Badge } from "@dailylift/ui/components/badge";
import { Skeleton } from "@dailylift/ui/components/skeleton";
import {
  Play,
  ClipboardList,
  History,
  Zap,
  ArrowRight,
  CalendarClock,
} from "lucide-react";

export default function WorkoutsHub() {
  const { data: activePlan, isLoading: planLoading } = useActivePlan();
  const { data: active } = useActiveWorkout();
  const { data: history } = useWorkoutHistory();
  const { data: dashboard } = useDashboard();
  const router = useRouter();
  const [starting, setStarting] = useState<string | null>(null);

  const startFromDay = async (day: PlanDayWithExercises) => {
    setStarting(day.id);
    try {
      const w = await startWorkout({
        name: `${activePlan?.name ? activePlan.name.split(" — ")[0] : "Workout"} · ${day.name}`,
        planId: activePlan?.id,
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
      router.push(`/workouts/${w.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not start");
      setStarting(null);
    }
  };

  const quickStart = async () => {
    setStarting("quick");
    try {
      const w = await startWorkout({ name: "Quick workout" });
      router.push(`/workouts/${w.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not start");
      setStarting(null);
    }
  };

  const days = activePlan?.workout_plan_days ?? [];
  const suggestedIndex = days.length ? (dashboard?.totalCompletedWorkouts ?? 0) % days.length : 0;

  return (
    <AuthGate requireOnboarding>
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <PageHeader
          title="Train"
          subtitle="Start today's session and log every set."
          actions={
            <Link href="/workouts/history">
              <Button variant="outline">
                <History className="size-4" /> History
              </Button>
            </Link>
          }
        />

        {active && (
          <Card className="mb-6 border-primary/40 bg-accent/40">
            <CardContent className="flex items-center justify-between gap-4 p-4">
              <div>
                <p className="text-sm text-muted-foreground">Workout in progress</p>
                <p className="font-display font-semibold">{active.name}</p>
              </div>
              <Link href={`/workouts/${active.id}`}>
                <Button>
                  Resume <ArrowRight className="size-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {planLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        ) : !activePlan ? (
          <EmptyState
            icon={ClipboardList}
            title="No active plan"
            description="Build a training plan to get a structured session, or jump straight into a quick workout."
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Link href="/plans">
                  <Button>
                    <ClipboardList className="size-4" /> Build a plan
                  </Button>
                </Link>
                <Button variant="outline" onClick={quickStart} disabled={starting === "quick"}>
                  <Zap className="size-4" /> Quick workout
                </Button>
              </div>
            }
          />
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
                <CalendarClock className="size-4 text-primary" /> {activePlan.name}
              </h2>
              <Link href={`/plans/${activePlan.id}`} className="text-sm text-muted-foreground hover:text-foreground">
                View plan
              </Link>
            </div>
            <div className="space-y-3">
              {days.map((day, i) => (
                <Card
                  key={day.id}
                  className={i === suggestedIndex ? "border-primary/50" : ""}
                >
                  <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 pb-3">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-base">
                        {day.name}
                        {i === suggestedIndex && <Badge>Up next</Badge>}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {day.planned_exercises.length} exercises
                      </p>
                    </div>
                    <Button
                      onClick={() => startFromDay(day)}
                      disabled={starting === day.id}
                      variant={i === suggestedIndex ? "default" : "outline"}
                    >
                      <Play className="size-4" /> {starting === day.id ? "…" : "Start"}
                    </Button>
                  </CardHeader>
                </Card>
              ))}
            </div>

            <Button variant="ghost" className="mt-4 w-full" onClick={quickStart} disabled={starting === "quick"}>
              <Zap className="size-4" /> Or start an empty workout
            </Button>
          </>
        )}

        {history && history.length > 0 && (
          <div className="mt-8">
            <h2 className="mb-3 font-display text-lg font-semibold">Recent</h2>
            <div className="space-y-2">
              {history.slice(0, 3).map((w) => (
                <Link key={w.id} href={`/workouts/history`}>
                  <Card className="hover-lift transition-colors hover:border-primary/40">
                    <CardContent className="flex items-center justify-between p-3.5">
                      <div>
                        <p className="font-medium">{w.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(w.started_at).toLocaleDateString(undefined, {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                      <Badge variant="secondary">
                        {w.workout_exercises.reduce(
                          (n, we) => n + we.workout_sets.filter((s) => s.is_completed).length,
                          0,
                        )}{" "}
                        sets
                      </Badge>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </AuthGate>
  );
}
