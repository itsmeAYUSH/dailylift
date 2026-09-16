"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { AuthGate } from "@/components/AuthGate";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { ExercisesSkeleton } from "@/components/skeletons";
import { useExercises } from "@/hooks/queries";
import type { ExerciseRow } from "@/lib/db/types";
import { MUSCLE_GROUPS } from "@/lib/db/types";
import { Input } from "@dailylift/ui/components/input";
import { Badge } from "@dailylift/ui/components/badge";
import { Card, CardContent } from "@dailylift/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@dailylift/ui/components/dialog";
import { Search, Dumbbell, Info, AlertTriangle, X } from "lucide-react";

const ENVIRONMENTS = ["all", "gym", "home"] as const;

function titleCase(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function ExercisesPage() {
  return (
    <Suspense
      fallback={
        <AuthGate fallback={<ExercisesSkeleton />}>
          <ExercisesSkeleton />
        </AuthGate>
      }
    >
      <Exercises />
    </Suspense>
  );
}

function Exercises() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlMuscle = searchParams.get("muscle") ?? "all";
  const urlPlace = searchParams.get("place") ?? searchParams.get("env") ?? "all";
  const urlSearch = searchParams.get("q") ?? searchParams.get("search") ?? "";
  const urlExerciseId = searchParams.get("exercise") ?? searchParams.get("id");

  const { data: exercises, isLoading } = useExercises();
  const [search, setSearch] = useState(urlSearch);
  const [muscle, setMuscle] = useState<string>(urlMuscle);
  const [environment, setEnvironment] = useState<(typeof ENVIRONMENTS)[number]>(
    (ENVIRONMENTS.includes(urlPlace as (typeof ENVIRONMENTS)[number]) ? urlPlace : "all") as (typeof ENVIRONMENTS)[number]
  );
  const [selected, setSelected] = useState<ExerciseRow | null>(null);

  // Sync state when URL searchParams change
  useEffect(() => {
    setMuscle(urlMuscle);
    setEnvironment((ENVIRONMENTS.includes(urlPlace as (typeof ENVIRONMENTS)[number]) ? urlPlace : "all") as (typeof ENVIRONMENTS)[number]);
    setSearch(urlSearch);
  }, [urlMuscle, urlPlace, urlSearch]);

  // Open exercise dialog if ?exercise= is in URL and data is available
  useEffect(() => {
    if (urlExerciseId && exercises && exercises.length > 0) {
      const found = exercises.find((e) => e.id === urlExerciseId || e.name.toLowerCase() === urlExerciseId.toLowerCase());
      if (found) setSelected(found);
    }
  }, [urlExerciseId, exercises]);

  // Helper to update query parameters in URL
  const updateQuery = (updates: { muscle?: string; place?: string; q?: string; exercise?: string | null }) => {
    const params = new URLSearchParams(searchParams.toString());

    if (updates.muscle !== undefined) {
      if (updates.muscle === "all" || !updates.muscle) params.delete("muscle");
      else params.set("muscle", updates.muscle);
    }

    if (updates.place !== undefined) {
      if (updates.place === "all" || !updates.place) {
        params.delete("place");
        params.delete("env");
      } else {
        params.set("place", updates.place);
        params.delete("env");
      }
    }

    if (updates.q !== undefined) {
      if (!updates.q) params.delete("q");
      else params.set("q", updates.q);
    }

    if (updates.exercise !== undefined) {
      if (!updates.exercise) {
        params.delete("exercise");
        params.delete("id");
      } else {
        params.set("exercise", updates.exercise);
      }
    }

    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const handleMuscleChange = (m: string) => {
    setMuscle(m);
    updateQuery({ muscle: m });
  };

  const handlePlaceChange = (p: (typeof ENVIRONMENTS)[number]) => {
    setEnvironment(p);
    updateQuery({ place: p });
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
    updateQuery({ q: val });
  };

  const handleSelectExercise = (ex: ExerciseRow | null) => {
    setSelected(ex);
    updateQuery({ exercise: ex ? ex.id : null });
  };

  const filtered = useMemo(() => {
    const list = exercises ?? [];
    return list.filter((e) => {
      if (search && !e.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (muscle !== "all" && e.primary_muscle !== muscle) return false;
      if (environment !== "all" && e.environment !== environment && e.environment !== "both")
        return false;
      return true;
    });
  }, [exercises, search, muscle, environment]);

  return (
    <AuthGate fallback={<ExercisesSkeleton />}>
      {isLoading ? (
        <ExercisesSkeleton />
      ) : (
        <div className="container mx-auto max-w-4xl px-4 py-8">
          <PageHeader
            title="Exercise library"
            subtitle="Browse movements, learn the form, and see what to train."
          />

          {/* Filters */}
          <div className="mb-6 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search exercises…"
                className="pl-9 pr-9"
              />
              {search && (
                <button
                  onClick={() => handleSearchChange("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <FilterChip active={muscle === "all"} onClick={() => handleMuscleChange("all")}>
                All muscles
              </FilterChip>
              {MUSCLE_GROUPS.map((m) => (
                <FilterChip key={m} active={muscle === m} onClick={() => handleMuscleChange(m)}>
                  {titleCase(m)}
                </FilterChip>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {ENVIRONMENTS.map((env) => (
                <FilterChip
                  key={env}
                  active={environment === env}
                  onClick={() => handlePlaceChange(env)}
                >
                  {env === "all" ? "Anywhere" : titleCase(env)}
                </FilterChip>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon={Dumbbell}
              title="No exercises match"
              description="Try clearing a filter or searching a different term."
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((ex) => (
                <button
                  key={ex.id}
                  onClick={() => handleSelectExercise(ex)}
                  className="text-left"
                >
                  <Card className="hover-lift h-full transition-colors hover:border-primary/40">
                    <CardContent className="p-4">
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <h3 className="font-display font-semibold leading-tight">{ex.name}</h3>
                        <Badge variant="outline" className="shrink-0 capitalize">
                          {titleCase(ex.exercise_type)}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <Badge variant="secondary" className="capitalize">
                          {titleCase(ex.primary_muscle)}
                        </Badge>
                        <Badge variant="secondary" className="capitalize">
                          {titleCase(ex.equipment)}
                        </Badge>
                        <Badge variant="secondary" className="capitalize">
                          {titleCase(ex.difficulty)}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </button>
              ))}
            </div>
          )}

          <ExerciseDialog exercise={selected} onClose={() => handleSelectExercise(null)} />
        </div>
      )}
    </AuthGate>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-sm transition-colors ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function ExerciseDialog({
  exercise,
  onClose,
}: {
  exercise: ExerciseRow | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={!!exercise} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        {exercise && (
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-xl">{exercise.name}</DialogTitle>
            </DialogHeader>
            <div className="flex flex-wrap gap-1.5">
              <Badge className="capitalize">{titleCase(exercise.primary_muscle)}</Badge>
              {exercise.secondary_muscles.map((m) => (
                <Badge key={m} variant="secondary" className="capitalize">
                  {titleCase(m)}
                </Badge>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
              <Meta label="Equipment" value={titleCase(exercise.equipment)} />
              <Meta label="Type" value={titleCase(exercise.exercise_type)} />
              <Meta label="Difficulty" value={titleCase(exercise.difficulty)} />
              <Meta label="Environment" value={titleCase(exercise.environment)} />
              {exercise.movement_pattern && (
                <Meta label="Pattern" value={titleCase(exercise.movement_pattern)} />
              )}
            </div>

            {exercise.instructions.length > 0 && (
              <Section icon={Info} title="How to perform">
                <ol className="list-decimal space-y-1.5 pl-5 text-sm text-muted-foreground">
                  {exercise.instructions.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
              </Section>
            )}

            {exercise.common_mistakes.length > 0 && (
              <Section icon={AlertTriangle} title="Common mistakes">
                <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
                  {exercise.common_mistakes.map((m, i) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
              </Section>
            )}

            {exercise.safety_notes && (
              <div className="rounded-lg bg-secondary p-3 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Safety: </span>
                {exercise.safety_notes}
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-secondary px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Info;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h4 className="mb-2 flex items-center gap-2 font-medium">
        <Icon className="size-4 text-primary" />
        {title}
      </h4>
      {children}
    </div>
  );
}
