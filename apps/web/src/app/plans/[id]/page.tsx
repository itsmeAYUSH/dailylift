"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { AuthGate } from "@/components/AuthGate";
import { PageHeader } from "@/components/PageHeader";
import { usePlan, useSetActivePlan } from "@/hooks/queries";
import { startWorkout } from "@/lib/db/workouts";
import type { PlanDayWithExercises } from "@/lib/db/types";
import { Button } from "@dailylift/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@dailylift/ui/components/card";
import { Badge } from "@dailylift/ui/components/badge";
import { Skeleton } from "@dailylift/ui/components/skeleton";
import { ClipboardList, Play, CheckCircle2, ArrowLeft, Dumbbell } from "lucide-react";

function titleCase(s: string | null) {
  return (s ?? "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function PlanDetailPage() {
  const params = useParams<{ id: string }>();
  const { data: plan, isLoading } = usePlan(params.id);
  const setActive = useSetActivePlan();
  const router = useRouter();
  const [startingDay, setStartingDay] = useState<string | null>(null);

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
    <AuthGate>
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <Link href="/plans" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> All plans
        </Link>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-64" />
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-xl" />
            ))}
          </div>
        ) : !plan ? (
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
                plan.is_active ? (
                  <Badge className="gap-1">
                    <CheckCircle2 className="size-3" /> Active plan
                  </Badge>
                ) : (
                  <Button variant="outline" onClick={() => setActive.mutate(plan.id)}>
                    Set as active
                  </Button>
                )
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
                    <Button onClick={() => handleStart(day)} disabled={startingDay === day.id}>
                      <Play className="size-4" />
                      {startingDay === day.id ? "Starting…" : "Start"}
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {day.planned_exercises.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No exercises on this day.</p>
                    ) : (
                      day.planned_exercises.map((pe) => (
                        <div
                          key={pe.id}
                          className="flex items-center justify-between gap-3 rounded-lg bg-secondary/50 px-3 py-2"
                        >
                          <div className="flex items-center gap-2">
                            <Dumbbell className="size-4 text-muted-foreground" />
                            <span className="font-medium">{pe.name}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {pe.target_sets ?? 3} ×{" "}
                            {pe.target_reps_min && pe.target_reps_max
                              ? `${pe.target_reps_min}–${pe.target_reps_max}`
                              : "—"}
                          </span>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </AuthGate>
  );
}
