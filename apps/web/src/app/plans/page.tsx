"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { AuthGate } from "@/components/AuthGate";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { PlansSkeleton } from "@/components/skeletons";
import { useAuthStore } from "@/stores/authStore";
import { usePlans, useExercises, useSetActivePlan, useArchivePlan, useDeletePlan } from "@/hooks/queries";
import { savePlan } from "@/lib/db/plans";
import { buildPlan } from "@/lib/fitness/planBuilder";
import { SPLITS, recommendSplit, type TrainingSplit } from "@/lib/fitness/split";
import { useQueryClient } from "@tanstack/react-query";
import { qk } from "@/hooks/queries";
import { Button } from "@dailylift/ui/components/button";
import { Card, CardContent } from "@dailylift/ui/components/card";
import { Badge } from "@dailylift/ui/components/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
  ClipboardList,
  Plus,
  Sparkles,
  CheckCircle2,
  Archive,
  Trash2,
  ChevronRight,
} from "lucide-react";

export default function PlansPage() {
  return (
    <Suspense
      fallback={
        <AuthGate requireOnboarding fallback={<PlansSkeleton />}>
          <PlansSkeleton />
        </AuthGate>
      }
    >
      <Plans />
    </Suspense>
  );
}

function Plans() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlTab = searchParams.get("tab") ?? "active";
  const urlAction = searchParams.get("action");

  const { data: plans, isLoading } = usePlans();
  const [tab, setTab] = useState<"active" | "archived" | "all">(urlTab === "archived" ? "archived" : "active");
  const [buildOpen, setBuildOpen] = useState(urlAction === "build" || urlAction === "create");
  const setActive = useSetActivePlan();
  const archive = useArchivePlan();
  const del = useDeletePlan();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    if (urlTab === "archived" || urlTab === "active" || urlTab === "all") {
      setTab(urlTab);
    }
  }, [urlTab]);

  useEffect(() => {
    setBuildOpen(urlAction === "build" || urlAction === "create");
  }, [urlAction]);

  const updateQuery = (updates: { tab?: string; action?: string | null }) => {
    const params = new URLSearchParams(searchParams.toString());
    if (updates.tab !== undefined) {
      if (updates.tab === "active" || !updates.tab) params.delete("tab");
      else params.set("tab", updates.tab);
    }
    if (updates.action !== undefined) {
      if (!updates.action) params.delete("action");
      else params.set("action", updates.action);
    }
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const handleBuildOpenChange = (open: boolean) => {
    setBuildOpen(open);
    updateQuery({ action: open ? "build" : null });
  };

  const handleTabChange = (nextTab: "active" | "archived" | "all") => {
    setTab(nextTab);
    updateQuery({ tab: nextTab });
  };

  const active = plans?.filter((p) => !p.is_archived) ?? [];
  const archived = plans?.filter((p) => p.is_archived) ?? [];

  return (
    <AuthGate requireOnboarding fallback={<PlansSkeleton />}>
      {isLoading ? (
        <PlansSkeleton />
      ) : (
        <div className="container mx-auto max-w-4xl px-4 py-8">
          <PageHeader
            title="Workout plans"
            subtitle="Your training splits and weekly schedules."
            actions={
              <Button onClick={() => handleBuildOpenChange(true)}>
                <Plus className="size-4" /> Build a plan
              </Button>
            }
          />

          {/* Filter tabs if archived plans exist */}
          {archived.length > 0 && (
            <div className="mb-6 flex gap-2">
              <button
                onClick={() => handleTabChange("active")}
                className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                  tab === "active"
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:border-primary/40 text-muted-foreground"
                }`}
              >
                Active ({active.length})
              </button>
              <button
                onClick={() => handleTabChange("archived")}
                className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                  tab === "archived"
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:border-primary/40 text-muted-foreground"
                }`}
              >
                Archived ({archived.length})
              </button>
              <button
                onClick={() => handleTabChange("all")}
                className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                  tab === "all"
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:border-primary/40 text-muted-foreground"
                }`}
              >
                All ({(plans ?? []).length})
              </button>
            </div>
          )}

          {active.length === 0 && (tab === "active" || archived.length === 0) ? (
            <EmptyState
              icon={ClipboardList}
              title="No plans yet"
              description="Build a personalized training split in seconds — pick a split or let us suggest one from your profile."
              action={
                <Button onClick={() => handleBuildOpenChange(true)}>
                  <Sparkles className="size-4" /> Build my first plan
                </Button>
              }
            />
          ) : (
            <div className="space-y-3">
              {(tab === "active" || tab === "all") &&
                active.map((plan) => (
                  <Card key={plan.id} className="hover-lift transition-colors hover:border-primary/40">
                    <CardContent className="flex items-center gap-4 p-4">
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <Link href={`/plans/${plan.id}`} className="truncate font-display font-semibold hover:underline">
                            {plan.name}
                          </Link>
                          {plan.is_active && (
                            <Badge className="gap-1">
                              <CheckCircle2 className="size-3" /> Active
                            </Badge>
                          )}
                          <Badge variant="outline" className="capitalize">{plan.source}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {plan.days_per_week ?? "—"} days / week
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        {!plan.is_active && (
                          <Button size="sm" variant="outline" onClick={() => setActive.mutate(plan.id)}>
                            Set active
                          </Button>
                        )}
                        <Button size="icon" variant="ghost" title="Archive" onClick={() => archive.mutate(plan.id)}>
                          <Archive className="size-4" />
                        </Button>
                        <Button size="icon" variant="ghost" title="Delete" onClick={() => setConfirmDelete(plan.id)}>
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                        <Link href={`/plans/${plan.id}`}>
                          <Button size="icon" variant="ghost">
                            <ChevronRight className="size-4" />
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}

              {(tab === "archived" || (tab === "all" && archived.length > 0)) && (
                <>
                  {tab === "all" && <h2 className="pt-4 text-sm font-medium text-muted-foreground">Archived</h2>}
                  {archived.map((plan) => (
                    <Card key={plan.id} className="opacity-70">
                      <CardContent className="flex items-center justify-between gap-4 p-4">
                        <Link href={`/plans/${plan.id}`} className="truncate font-medium hover:underline">
                          {plan.name}
                        </Link>
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" onClick={() => setActive.mutate(plan.id)}>
                            Restore
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => setConfirmDelete(plan.id)}>
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </>
              )}
            </div>
          )}

          <BuildPlanDialog open={buildOpen} onOpenChange={handleBuildOpenChange} />

          <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this plan?</AlertDialogTitle>
                <AlertDialogDescription>
                  This permanently removes the plan and its days. Logged workouts are kept.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    if (confirmDelete) del.mutate(confirmDelete);
                    setConfirmDelete(null);
                  }}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </AuthGate>
  );
}

function BuildPlanDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { profile } = useAuthStore();
  const { data: exercises } = useExercises();
  const router = useRouter();
  const qc = useQueryClient();

  const experience = profile?.fitness_level ?? "beginner";
  const goal = profile?.fitness_goal ?? "general_fitness";
  const environment = profile?.workout_preference ?? "gym";

  const [days, setDays] = useState<number>(profile?.training_days_per_week ?? 3);
  const suggested = useMemo(
    () => recommendSplit({ experience, daysPerWeek: days, goal, location: environment }),
    [experience, days, goal, environment],
  );
  const [split, setSplit] = useState<TrainingSplit>(suggested.split);
  const [saving, setSaving] = useState(false);

  const useSuggested = () => setSplit(suggested.split);

  const handleBuild = async () => {
    if (!exercises || exercises.length === 0) {
      toast.error("Exercise library is still loading. Try again in a moment.");
      return;
    }
    setSaving(true);
    try {
      const built = buildPlan({ split, daysPerWeek: days, goal, environment, library: exercises });
      const id = await savePlan(built, { source: "custom", goal });
      qc.invalidateQueries({ queryKey: qk.plans });
      qc.invalidateQueries({ queryKey: qk.activePlan });
      toast.success("Plan created and set active");
      onOpenChange(false);
      router.push(`/plans/${id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to build plan");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Build a workout plan</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium">Training days per week</label>
            <div className="flex flex-wrap gap-2">
              {[2, 3, 4, 5, 6].map((d) => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  className={`size-10 rounded-lg border text-sm font-medium transition-colors ${
                    days === d
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-primary/30 bg-accent/50 p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2">
                <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Suggested: {SPLITS.find((s) => s.value === suggested.split)?.label}. </span>
                  {suggested.rationale}
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={useSuggested}>
                Use
              </Button>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Split</label>
            <div className="grid gap-2 sm:grid-cols-2">
              {SPLITS.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setSplit(s.value)}
                  className={`rounded-lg border p-3 text-left transition-colors ${
                    split === s.value ? "border-primary bg-accent/50" : "border-border hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{s.label}</span>
                    {split === s.value && <CheckCircle2 className="size-4 text-primary" />}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{s.tagline}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleBuild} disabled={saving}>
            {saving ? "Building…" : "Build plan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
