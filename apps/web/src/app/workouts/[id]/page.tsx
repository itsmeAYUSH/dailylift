"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { AuthGate } from "@/components/AuthGate";
import { useExercises } from "@/hooks/queries";
import {
  fetchWorkout,
  addWorkoutExercise,
  removeWorkoutExercise,
  addSet,
  updateSet,
  deleteSet,
  updateWorkout,
  cancelWorkout,
  finishWorkout,
  fetchLastPerformance,
  type FinishResult,
} from "@/lib/db/workouts";
import type { FullWorkout, WorkoutExerciseWithSets, WorkoutSetRow } from "@/lib/db/types";
import { suggestProgression, summarizeSets, sessionVolume } from "@/lib/fitness/overload";
import { useRestTimer, formatClock } from "@/stores/restTimer";
import { Button } from "@dailylift/ui/components/button";
import { Card, CardContent, CardHeader } from "@dailylift/ui/components/card";
import { Input } from "@dailylift/ui/components/input";
import { Badge } from "@dailylift/ui/components/badge";
import { Skeleton } from "@dailylift/ui/components/skeleton";
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
  Check,
  Plus,
  Trash2,
  Timer,
  Flag,
  X,
  Dumbbell,
  Search,
  TrendingUp,
  Trophy,
} from "lucide-react";

type LocalWorkout = FullWorkout;

export default function WorkoutLoggerPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [workout, setWorkout] = useState<LocalWorkout | null>(null);
  const [loading, setLoading] = useState(true);
  const [prev, setPrev] = useState<Record<string, WorkoutSetRow[]>>({});
  const [addOpen, setAddOpen] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [summary, setSummary] = useState<FinishResult | null>(null);
  const [finishing, setFinishing] = useState(false);

  // Debounced per-set saves — fast typing UX, batched writes.
  const pending = useRef<Map<string, Partial<WorkoutSetRow>>>(new Map());
  const flushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(async () => {
    if (flushTimer.current) {
      clearTimeout(flushTimer.current);
      flushTimer.current = null;
    }
    const entries = Array.from(pending.current.entries());
    pending.current.clear();
    await Promise.all(entries.map(([id, patch]) => updateSet(id, patch).catch(() => {})));
  }, []);

  const scheduleFlush = useCallback(() => {
    if (flushTimer.current) clearTimeout(flushTimer.current);
    flushTimer.current = setTimeout(() => void flush(), 600);
  }, [flush]);

  const reload = useCallback(async () => {
    const w = await fetchWorkout(params.id);
    setWorkout(w);
    return w;
  }, [params.id]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const w = await fetchWorkout(params.id);
        if (!alive) return;
        setWorkout(w);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [params.id]);

  // Save any pending edits when leaving the page.
  useEffect(() => () => void flush(), [flush]);

  // Load previous performance for each exercise (once per exercise present).
  useEffect(() => {
    if (!workout) return;
    for (const we of workout.workout_exercises) {
      if (prev[we.id] !== undefined) continue;
      fetchLastPerformance({ exerciseId: we.exercise_id, name: we.name, excludeWorkoutId: workout.id })
        .then((sets) => setPrev((p) => ({ ...p, [we.id]: sets })))
        .catch(() => setPrev((p) => ({ ...p, [we.id]: [] })));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workout?.workout_exercises.map((e) => e.id).join(",")]);

  const patchSetLocal = (weId: string, setId: string, patch: Partial<WorkoutSetRow>) => {
    setWorkout((w) => {
      if (!w) return w;
      return {
        ...w,
        workout_exercises: w.workout_exercises.map((we) =>
          we.id !== weId
            ? we
            : {
                ...we,
                workout_sets: we.workout_sets.map((s) => (s.id === setId ? { ...s, ...patch } : s)),
              },
        ),
      };
    });
  };

  const onFieldChange = (weId: string, setId: string, field: "weight_kg" | "reps" | "rpe", value: string) => {
    const num = value === "" ? null : Number(value);
    patchSetLocal(weId, setId, { [field]: num } as Partial<WorkoutSetRow>);
    const existing = pending.current.get(setId) ?? {};
    pending.current.set(setId, { ...existing, [field]: num });
    scheduleFlush();
  };

  const restTimer = useRestTimer();

  const toggleComplete = async (we: WorkoutExerciseWithSets, set: WorkoutSetRow) => {
    const next = !set.is_completed;
    patchSetLocal(we.id, set.id, {
      is_completed: next,
      completed_at: next ? new Date().toISOString() : null,
    });
    await flush(); // ensure weight/reps are saved before marking complete
    await updateSet(set.id, {
      is_completed: next,
      completed_at: next ? new Date().toISOString() : null,
    }).catch(() => toast.error("Could not save set"));
    if (next) {
      restTimer.start(set.rest_seconds ?? 90);
    }
  };

  const handleAddSet = async (we: WorkoutExerciseWithSets) => {
    const last = we.workout_sets[we.workout_sets.length - 1];
    const created = await addSet(we.id, {
      set_type: "working",
      weight_kg: last?.weight_kg ?? null,
      rest_seconds: last?.rest_seconds ?? null,
    });
    setWorkout((w) =>
      !w
        ? w
        : {
            ...w,
            workout_exercises: w.workout_exercises.map((x) =>
              x.id === we.id ? { ...x, workout_sets: [...x.workout_sets, created] } : x,
            ),
          },
    );
  };

  const handleDeleteSet = async (weId: string, setId: string) => {
    setWorkout((w) =>
      !w
        ? w
        : {
            ...w,
            workout_exercises: w.workout_exercises.map((x) =>
              x.id === weId ? { ...x, workout_sets: x.workout_sets.filter((s) => s.id !== setId) } : x,
            ),
          },
    );
    await deleteSet(setId).catch(() => {});
  };

  const handleRemoveExercise = async (weId: string) => {
    setWorkout((w) =>
      !w ? w : { ...w, workout_exercises: w.workout_exercises.filter((x) => x.id !== weId) },
    );
    await removeWorkoutExercise(weId).catch(() => {});
  };

  const handleAddExercise = async (input: { exercise_id: string | null; name: string; muscle_group: string | null }) => {
    if (!workout) return;
    await addWorkoutExercise(workout.id, { ...input, target_sets: 3 });
    await reload();
    setAddOpen(false);
  };

  const handleFinish = async () => {
    if (!workout) return;
    const anyDone = workout.workout_exercises.some((we) =>
      we.workout_sets.some((s) => s.is_completed),
    );
    if (!anyDone) {
      toast.error("Complete at least one set before finishing.");
      return;
    }
    setFinishing(true);
    try {
      await flush();
      const result = await finishWorkout(workout.id);
      restTimer.skip();
      setSummary(result);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not finish workout");
    } finally {
      setFinishing(false);
    }
  };

  const handleCancel = async () => {
    if (!workout) return;
    await flush();
    await cancelWorkout(workout.id).catch(() => {});
    restTimer.skip();
    router.push("/workouts");
  };

  return (
    <AuthGate>
      <div className="container mx-auto max-w-2xl px-4 py-6">
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-14 rounded-xl" />
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        ) : !workout ? (
          <p className="text-muted-foreground">Workout not found.</p>
        ) : workout.status !== "in_progress" && !summary ? (
          <div className="py-10 text-center">
            <p className="mb-4 text-muted-foreground">This workout is already {workout.status}.</p>
            <Button onClick={() => router.push("/workouts/history")}>View history</Button>
          </div>
        ) : (
          <>
            <LoggerHeader
              workout={workout}
              onRename={(name) => {
                setWorkout((w) => (w ? { ...w, name } : w));
                updateWorkout(workout.id, { name }).catch(() => {});
              }}
              onFinish={handleFinish}
              onCancel={() => setConfirmCancel(true)}
              finishing={finishing}
            />

            <div className="mt-5 space-y-4">
              {workout.workout_exercises.map((we) => (
                <ExerciseCard
                  key={we.id}
                  we={we}
                  prevSets={prev[we.id] ?? []}
                  onField={onFieldChange}
                  onToggle={(set) => toggleComplete(we, set)}
                  onAddSet={() => handleAddSet(we)}
                  onDeleteSet={(setId) => handleDeleteSet(we.id, setId)}
                  onRemove={() => handleRemoveExercise(we.id)}
                />
              ))}
            </div>

            <Button variant="outline" className="mt-4 w-full" onClick={() => setAddOpen(true)}>
              <Plus className="size-4" /> Add exercise
            </Button>
          </>
        )}

        <AddExerciseDialog open={addOpen} onOpenChange={setAddOpen} onSelect={handleAddExercise} />

        <AlertDialog open={confirmCancel} onOpenChange={setConfirmCancel}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel this workout?</AlertDialogTitle>
              <AlertDialogDescription>
                It will be discarded and won&apos;t appear in your history.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep going</AlertDialogCancel>
              <AlertDialogAction onClick={handleCancel}>Cancel workout</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {summary && workout && (
          <SummaryDialog
            workout={workout}
            result={summary}
            onClose={() => router.push("/workouts/history")}
          />
        )}
      </div>
    </AuthGate>
  );
}

/* ------------------------------- header ---------------------------------- */

function LoggerHeader({
  workout,
  onRename,
  onFinish,
  onCancel,
  finishing,
}: {
  workout: FullWorkout;
  onRename: (name: string) => void;
  onFinish: () => void;
  onCancel: () => void;
  finishing: boolean;
}) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const started = new Date(workout.started_at).getTime();
    const tick = () => setElapsed(Math.max(0, Math.round((Date.now() - started) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [workout.started_at]);

  return (
    <div className="sticky top-16 z-20 -mx-4 border-b bg-background/90 px-4 py-3 backdrop-blur md:top-[4.5rem]">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <input
            defaultValue={workout.name}
            onBlur={(e) => onRename(e.target.value.trim() || "Workout")}
            className="w-full truncate bg-transparent font-display text-lg font-bold outline-none"
          />
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Timer className="size-3.5" />
            <span className="tabular-nums">{formatClock(elapsed)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={onCancel}>
            <X className="size-4" />
          </Button>
          <Button size="sm" onClick={onFinish} disabled={finishing}>
            <Flag className="size-4" /> {finishing ? "Finishing…" : "Finish"}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------- exercise card ------------------------------ */

function ExerciseCard({
  we,
  prevSets,
  onField,
  onToggle,
  onAddSet,
  onDeleteSet,
  onRemove,
}: {
  we: WorkoutExerciseWithSets;
  prevSets: WorkoutSetRow[];
  onField: (weId: string, setId: string, field: "weight_kg" | "reps" | "rpe", value: string) => void;
  onToggle: (set: WorkoutSetRow) => void;
  onAddSet: () => void;
  onDeleteSet: (setId: string) => void;
  onRemove: () => void;
}) {
  const lastSummary = summarizeSets(prevSets);
  const suggestion = useMemo(
    () => suggestProgression({ lastSets: prevSets }),
    [prevSets],
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Dumbbell className="size-4 text-primary" />
            <h3 className="font-display font-semibold">{we.name}</h3>
            {we.muscle_group && (
              <Badge variant="secondary" className="capitalize">
                {we.muscle_group}
              </Badge>
            )}
          </div>
          {lastSummary && (
            <p className="mt-1 text-xs text-muted-foreground">Last: {lastSummary}</p>
          )}
        </div>
        <Button size="icon" variant="ghost" onClick={onRemove} title="Remove exercise">
          <Trash2 className="size-4 text-muted-foreground" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {suggestion.action !== "none" && suggestion.action !== "hold" && (
          <div className="flex items-start gap-2 rounded-lg bg-accent/50 px-3 py-2 text-xs text-muted-foreground">
            <TrendingUp className="mt-0.5 size-3.5 shrink-0 text-primary" />
            <span>{suggestion.message}</span>
          </div>
        )}

        {/* Column labels */}
        <div className="grid grid-cols-[1.5rem_1fr_1fr_2.5rem_2rem] items-center gap-2 px-1 text-xs font-medium text-muted-foreground">
          <span>#</span>
          <span>kg</span>
          <span>reps</span>
          <span className="text-center">done</span>
          <span />
        </div>

        {we.workout_sets.map((set, i) => (
          <div
            key={set.id}
            className={`grid grid-cols-[1.5rem_1fr_1fr_2.5rem_2rem] items-center gap-2 rounded-lg px-1 py-1 ${
              set.is_completed ? "bg-primary/5" : ""
            }`}
          >
            <span className="text-sm font-medium text-muted-foreground">{i + 1}</span>
            <Input
              type="number"
              inputMode="decimal"
              step="2.5"
              defaultValue={set.weight_kg ?? ""}
              onChange={(e) => onField(we.id, set.id, "weight_kg", e.target.value)}
              placeholder="0"
              className="h-9"
            />
            <Input
              type="number"
              inputMode="numeric"
              defaultValue={set.reps ?? ""}
              onChange={(e) => onField(we.id, set.id, "reps", e.target.value)}
              placeholder="0"
              className="h-9"
            />
            <button
              onClick={() => onToggle(set)}
              className={`mx-auto grid size-8 place-items-center rounded-lg border transition-colors ${
                set.is_completed
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border hover:border-primary/50"
              }`}
              aria-label="Mark set complete"
            >
              <Check className="size-4" />
            </button>
            <button
              onClick={() => onDeleteSet(set.id)}
              className="mx-auto text-muted-foreground hover:text-destructive"
              aria-label="Delete set"
            >
              <X className="size-4" />
            </button>
          </div>
        ))}

        <Button variant="ghost" size="sm" className="w-full" onClick={onAddSet}>
          <Plus className="size-4" /> Add set
        </Button>
      </CardContent>
    </Card>
  );
}

/* ------------------------- add-exercise dialog --------------------------- */

function AddExerciseDialog({
  open,
  onOpenChange,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSelect: (input: { exercise_id: string | null; name: string; muscle_group: string | null }) => void;
}) {
  const { data: exercises } = useExercises();
  const [search, setSearch] = useState("");
  const filtered = (exercises ?? []).filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Add exercise</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search library…"
            className="pl-9"
          />
        </div>
        <div className="-mx-2 max-h-[50vh] overflow-y-auto px-2">
          {search && (
            <button
              onClick={() => onSelect({ exercise_id: null, name: search, muscle_group: null })}
              className="mb-2 flex w-full items-center gap-2 rounded-lg border border-dashed px-3 py-2 text-left text-sm hover:border-primary/50"
            >
              <Plus className="size-4" /> Add custom “{search}”
            </button>
          )}
          {filtered.map((e) => (
            <button
              key={e.id}
              onClick={() => onSelect({ exercise_id: e.id, name: e.name, muscle_group: e.primary_muscle })}
              className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left hover:bg-secondary"
            >
              <span className="font-medium">{e.name}</span>
              <Badge variant="secondary" className="capitalize">
                {e.primary_muscle}
              </Badge>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------------------- finish summary ----------------------------- */

function SummaryDialog({
  workout,
  result,
  onClose,
}: {
  workout: FullWorkout;
  result: FinishResult;
  onClose: () => void;
}) {
  const allSets = workout.workout_exercises.flatMap((we) => we.workout_sets);
  const completed = allSets.filter((s) => s.is_completed);
  const totalReps = completed.reduce((n, s) => n + (s.reps ?? 0), 0);
  const volume = Math.round(
    sessionVolume(completed.map((s) => ({ weight_kg: s.weight_kg, reps: s.reps }))),
  );

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-xl">
            <Trophy className="size-5 text-primary" /> Workout complete
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-3 text-center">
          <Stat label="Exercises" value={String(workout.workout_exercises.length)} />
          <Stat label="Sets" value={String(completed.length)} />
          <Stat label="Reps" value={String(totalReps)} />
          <Stat label="Volume" value={`${volume} kg`} />
          <Stat
            label="Duration"
            value={formatClock(workout.duration_seconds ?? 0)}
          />
          <Stat label="PRs" value={String(result.newPRs.length)} />
        </div>

        {result.newPRs.length > 0 && (
          <div className="space-y-1.5 rounded-lg bg-accent/50 p-3">
            <p className="flex items-center gap-1.5 text-sm font-medium">
              <Trophy className="size-4 text-primary" /> New personal records
            </p>
            {result.newPRs.map((pr, i) => (
              <p key={i} className="text-sm text-muted-foreground">
                {pr.exercise_name} — {pr.record_type === "est_1rm" ? "est. 1RM" : "max weight"}{" "}
                {Math.round(pr.value * 10) / 10} kg
              </p>
            ))}
          </div>
        )}

        <Button onClick={onClose} className="w-full">
          Done
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-secondary p-3">
      <p className="font-display text-lg font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
