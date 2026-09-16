"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  Tooltip,
} from "recharts";
import { startOfWeek, format, subWeeks } from "date-fns";
import { AuthGate } from "@/components/AuthGate";
import { Reveal } from "@/components/Reveal";
import { DashboardSkeleton } from "@/components/skeletons";
import { useAuthStore } from "@/stores/authStore";
import {
  useDashboard,
  useActivePlan,
  useActiveWorkout,
  useLogBodyWeight,
  useWorkoutHistory,
  useBodyWeightLogs,
} from "@/hooks/queries";
import {
  calculateBMR,
  calculateTDEE,
  activityFromWorkoutPreference,
  calorieTargetForGoal,
} from "@/lib/fitness/calculations";
import { Button } from "@dailylift/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@dailylift/ui/components/card";
import { Badge } from "@dailylift/ui/components/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@dailylift/ui/components/dialog";
import { Input } from "@dailylift/ui/components/input";
import {
  Dumbbell,
  Flame,
  TrendingUp,
  TrendingDown,
  Scale,
  ArrowRight,
  Play,
  Trophy,
  Activity,
  Lightbulb,
  ClipboardList,
  Plus,
  Target,
} from "lucide-react";

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <AuthGate requireOnboarding fallback={<DashboardSkeleton />}>
          <DashboardSkeleton />
        </AuthGate>
      }
    >
      <Dashboard />
    </Suspense>
  );
}

function Dashboard() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlDialog = searchParams.get("dialog");

  const { profile } = useAuthStore();
  const { data: dash, isLoading: dashLoading } = useDashboard();
  const { data: activePlan, isLoading: planLoading } = useActivePlan();
  const { data: activeWorkout, isLoading: activeWorkoutLoading } = useActiveWorkout();
  const { data: history, isLoading: historyLoading } = useWorkoutHistory();
  const { data: weights, isLoading: weightsLoading } = useBodyWeightLogs();
  const [weightOpen, setWeightOpen] = useState(urlDialog === "weight" || urlDialog === "log-weight");

  useEffect(() => {
    setWeightOpen(urlDialog === "weight" || urlDialog === "log-weight");
  }, [urlDialog]);

  const handleWeightOpenChange = (open: boolean) => {
    setWeightOpen(open);
    const params = new URLSearchParams(searchParams.toString());
    if (!open) params.delete("dialog");
    else params.set("dialog", "weight");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const greeting = useMemo(() => getGreeting(profile?.fitness_goal), [profile?.fitness_goal]);

  const derived = useMemo(() => {
    if (!profile?.height_cm || !profile?.weight_kg) return null;
    const heightM = profile.height_cm / 100;
    const weight = dash?.latestWeight ?? profile.weight_kg;
    const bmi = weight / (heightM * heightM);
    let category = "Normal";
    if (bmi < 18.5) category = "Underweight";
    else if (bmi >= 25 && bmi < 30) category = "Overweight";
    else if (bmi >= 30) category = "Obese";
    const bmr = calculateBMR({
      weightKg: weight,
      heightCm: profile.height_cm,
      age: profile.age ?? 25,
      sex: profile.gender,
    });
    const tdee = calculateTDEE(bmr, activityFromWorkoutPreference(profile.workout_preference));
    const target = calorieTargetForGoal(tdee, profile.fitness_goal ?? "general_fitness");
    return { bmi: Math.round(bmi * 10) / 10, category, bmr, target };
  }, [profile, dash?.latestWeight]);

  // Last 8 weeks of training volume.
  const volumeSeries = useMemo(() => {
    const weeks: { key: string; label: string; volume: number }[] = [];
    for (let i = 7; i >= 0; i--) {
      const d = startOfWeek(subWeeks(new Date(), i), { weekStartsOn: 1 });
      weeks.push({ key: format(d, "yyyy-MM-dd"), label: format(d, "MMM d"), volume: 0 });
    }
    const index = new Map(weeks.map((w) => [w.key, w]));
    for (const w of history ?? []) {
      const key = format(startOfWeek(new Date(w.started_at), { weekStartsOn: 1 }), "yyyy-MM-dd");
      const bucket = index.get(key);
      if (!bucket) continue;
      bucket.volume += w.workout_exercises
        .flatMap((we) => we.workout_sets)
        .filter((s) => s.is_completed)
        .reduce((v, s) => v + (s.weight_kg ?? 0) * (s.reps ?? 0), 0);
    }
    return weeks.map((w) => ({ ...w, volume: Math.round(w.volume) }));
  }, [history]);

  const weightSpark = useMemo(
    () => (weights ?? []).slice(-14).map((w) => ({ v: w.weight_kg })),
    [weights],
  );

  const goal = profile?.training_days_per_week ?? 3;
  const done = dash?.workoutsThisWeek ?? 0;
  const goalPct = Math.min(100, Math.round((done / Math.max(1, goal)) * 100));

  const suggestedDay = useMemo(() => {
    const days = activePlan?.workout_plan_days ?? [];
    if (!days.length) return null;
    return days[(dash?.totalCompletedWorkouts ?? 0) % days.length];
  }, [activePlan, dash?.totalCompletedWorkouts]);

  const insight = buildInsight({
    workoutsThisWeek: done,
    streak: dash?.streakDays ?? 0,
    weeklyVolume: dash?.weeklyVolumeKg ?? 0,
    hasPlan: !!activePlan,
  });

  const hasVolume = volumeSeries.some((v) => v.volume > 0);

  if ((dashLoading || planLoading) && !dash && !activePlan) {
    return (
      <AuthGate requireOnboarding fallback={<DashboardSkeleton />}>
        <DashboardSkeleton />
      </AuthGate>
    );
  }

  return (
    <AuthGate requireOnboarding fallback={<DashboardSkeleton />}>
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <Reveal>
          <div className="mb-6">
            <h1 className="font-display text-2xl font-bold md:text-3xl">
              {greeting.hello}, <span className="text-brand-gradient">{profile?.full_name?.split(" ")[0] || "athlete"}</span>
            </h1>
            <p className="text-muted-foreground">{greeting.line}</p>
          </div>
        </Reveal>

        {/* Hero: today's session + weekly goal ring */}
        <Reveal delay={60}>
          <Card className="mb-6 overflow-hidden border-0 text-primary-foreground gradient-primary">
            <CardContent className="flex flex-wrap items-center justify-between gap-6 p-6">
              <div className="flex items-center gap-4">
                <div className="grid size-14 place-items-center rounded-2xl bg-white/15 backdrop-blur">
                  <Dumbbell className="size-7" />
                </div>
                <div>
                  <p className="text-sm text-primary-foreground/80">Today&apos;s session</p>
                  <p className="font-display text-2xl font-bold">
                    {suggestedDay ? suggestedDay.name : activePlan ? "Rest day" : "No active plan"}
                  </p>
                  {suggestedDay && (
                    <p className="text-sm text-primary-foreground/80">
                      {suggestedDay.planned_exercises.length} exercises planned
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-5">
                <div className="relative h-24 w-24">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart
                      innerRadius="72%"
                      outerRadius="100%"
                      data={[{ value: goalPct, fill: "rgba(255,255,255,0.95)" }]}
                      startAngle={90}
                      endAngle={-270}
                    >
                      <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                      <RadialBar background={{ fill: "rgba(255,255,255,0.2)" }} dataKey="value" cornerRadius={10} />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 grid place-items-center text-center">
                    <div>
                      <p className="font-display text-xl font-bold leading-none">{done}/{goal}</p>
                      <p className="text-[10px] text-primary-foreground/80">this week</p>
                    </div>
                  </div>
                </div>
                {activeWorkoutLoading ? (
                  <Button size="lg" variant="secondary" className="shadow-sm" disabled>
                    <Play className="size-4" /> …
                  </Button>
                ) : (
                  <Link href={activeWorkout ? `/workouts/${activeWorkout.id}` : "/workouts"}>
                    <Button size="lg" variant="secondary" className="shadow-sm">
                      <Play className="size-4" />{" "}
                      {activeWorkout ? "Resume workout" : activePlan ? "Start training" : "Set up plan"}
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        </Reveal>

        {/* Weekly overview stats */}
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { icon: Dumbbell, label: "This week", value: String(done), sub: "workouts" },
            { icon: Activity, label: "Streak", value: String(dash?.streakDays ?? 0), sub: "days" },
            { icon: TrendingUp, label: "Weekly volume", value: (dash?.weeklyVolumeKg ?? 0).toLocaleString(), sub: "kg lifted" },
            {
              icon: Scale,
              label: "Weight",
              value: dash?.latestWeight != null ? `${dash.latestWeight}` : profile?.weight_kg ? `${profile.weight_kg}` : "--",
              sub: "kg",
              change: dash?.weightChange ?? null,
            },
          ].map((s, i) => (
            <Reveal key={s.label} delay={120 + i * 60}>
              <StatCard {...s} />
            </Reveal>
          ))}
        </div>

        {/* Insight */}
        <Reveal delay={360}>
          <Card className="mb-6 hover-lift">
            <CardContent className="flex items-start gap-3 p-4">
              <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent text-primary">
                <Lightbulb className="size-5" />
              </div>
              <div>
                <p className="font-medium">{insight.title}</p>
                <p className="text-sm text-muted-foreground">{insight.body}</p>
              </div>
            </CardContent>
          </Card>
        </Reveal>

        {/* Charts row */}
        <div className="mb-6 grid gap-6 lg:grid-cols-3">
          <Reveal delay={420} className="lg:col-span-2">
            <Card className="h-full hover-lift">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="size-4 text-primary" /> Training volume · last 8 weeks
                </CardTitle>
              </CardHeader>
              <CardContent>
                {hasVolume ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={volumeSeries} margin={{ left: -18, right: 6, top: 6 }}>
                      <defs>
                        <linearGradient id="volFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area
                        type="monotone"
                        dataKey="volume"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2.5}
                        fill="url(#volFill)"
                      />
                      <Tooltip content={<MiniTooltip unit="kg" />} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-[200px] flex-col items-center justify-center text-center">
                    <p className="text-sm text-muted-foreground">Log workouts to see your volume trend.</p>
                    <Link href="/workouts" className="mt-3">
                      <Button size="sm" variant="outline">Start a workout</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </Reveal>

          <Reveal delay={480}>
            <Card className="h-full hover-lift">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Scale className="size-4 text-primary" /> Body weight
                </CardTitle>
              </CardHeader>
              <CardContent>
                {weightSpark.length >= 2 ? (
                  <>
                    <div className="mb-2 flex items-baseline gap-2">
                      <span className="font-display text-2xl font-bold">{dash?.latestWeight} kg</span>
                      {dash?.weightChange != null && dash.weightChange !== 0 && (
                        <span className={`flex items-center gap-0.5 text-sm ${dash.weightChange < 0 ? "text-[hsl(var(--success))]" : "text-muted-foreground"}`}>
                          {dash.weightChange < 0 ? <TrendingDown className="size-3.5" /> : <TrendingUp className="size-3.5" />}
                          {Math.abs(dash.weightChange)} kg
                        </span>
                      )}
                    </div>
                    <ResponsiveContainer width="100%" height={120}>
                      <AreaChart data={weightSpark} margin={{ left: 0, right: 0, top: 4, bottom: 0 }}>
                        <defs>
                          <linearGradient id="wFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <Area type="monotone" dataKey="v" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#wFill)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </>
                ) : (
                  <div className="flex h-[150px] flex-col items-center justify-center text-center">
                    <p className="text-sm text-muted-foreground">Log your weight to track trends.</p>
                    <Button size="sm" variant="outline" className="mt-3" onClick={() => handleWeightOpenChange(true)}>
                      <Plus className="size-4" /> Log weight
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </Reveal>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Reveal delay={520}>
            <Card className="h-full hover-lift">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Target className="size-4 text-primary" /> Body metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <Metric label="BMI" value={derived ? String(derived.bmi) : "--"} note={derived?.category} />
                  <Metric label="BMR" value={derived ? String(derived.bmr) : "--"} note="kcal rest" />
                  <Metric label="Target" value={derived ? String(derived.target) : "--"} note="kcal/day" />
                </div>
                <Button variant="outline" className="w-full" onClick={() => handleWeightOpenChange(true)}>
                  <Plus className="size-4" /> Log body weight
                </Button>
              </CardContent>
            </Card>
          </Reveal>

          <Reveal delay={580}>
            <Card className="h-full hover-lift">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Trophy className="size-4 text-primary" /> Personal records
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dash && dash.recentPRs.length > 0 ? (
                  <div className="space-y-2">
                    {dash.recentPRs.map((pr) => (
                      <div key={pr.id} className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2">
                        <span className="truncate font-medium">{pr.exercise_name}</span>
                        <Badge variant="secondary">
                          {pr.record_type === "est_1rm" ? "1RM " : ""}
                          {Math.round(pr.value * 10) / 10} kg
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    Log workouts to start setting records.
                  </p>
                )}
              </CardContent>
            </Card>
          </Reveal>
        </div>

        {/* Quick actions */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { href: "/workouts", icon: Play, label: "Start workout" },
            { href: "/plans", icon: ClipboardList, label: "View plans" },
            { href: "/progress", icon: TrendingUp, label: "Progress" },
            { href: "/meals", icon: Flame, label: "Meal plan" },
          ].map((a, i) => (
            <Reveal key={a.href} delay={640 + i * 50}>
              <QuickAction {...a} />
            </Reveal>
          ))}
        </div>
      </div>

      <LogWeightDialog open={weightOpen} onOpenChange={handleWeightOpenChange} current={dash?.latestWeight ?? profile?.weight_kg ?? null} />
    </AuthGate>
  );
}

function getGreeting(goal?: string | null): { hello: string; line: string } {
  const hour = new Date().getHours();
  const goalLine: Record<string, string> = {
    muscle_gain: "Time to build. Every set counts today.",
    weight_loss: "Stay in the deficit — consistency wins.",
    endurance: "Go the distance. One rep further than yesterday.",
    flexibility: "Move well, feel better. Ease into it.",
    general_fitness: "Show up for yourself today.",
  };
  const fallback = goal ? goalLine[goal] : undefined;

  if (hour >= 5 && hour < 12) {
    return { hello: "Good morning", line: fallback ?? "A fresh day, a fresh set of gains awaits." };
  }
  if (hour >= 12 && hour < 17) {
    return { hello: "Good afternoon", line: fallback ?? "Midday momentum — let's keep it rolling." };
  }
  if (hour >= 17 && hour < 22) {
    return { hello: "Good evening", line: fallback ?? "Finish the day strong. You've got this." };
  }
  return { hello: "Burning the midnight oil", line: fallback ?? "Dedication doesn't watch the clock. Respect." };
}

function buildInsight(d: { workoutsThisWeek: number; streak: number; weeklyVolume: number; hasPlan: boolean }) {
  if (!d.hasPlan) {
    return { title: "Set up your first plan", body: "Build a training split to get a structured weekly schedule and start logging sessions." };
  }
  if (d.workoutsThisWeek === 0) {
    return { title: "No sessions logged this week yet", body: "Get one in today — even a short workout keeps your momentum going." };
  }
  if (d.streak >= 3) {
    return { title: `You're on a ${d.streak}-day streak 🔥`, body: `You've moved ${d.weeklyVolume.toLocaleString()} kg this week across ${d.workoutsThisWeek} session${d.workoutsThisWeek > 1 ? "s" : ""}. Keep it consistent.` };
  }
  return { title: `${d.workoutsThisWeek} workout${d.workoutsThisWeek > 1 ? "s" : ""} this week`, body: `That's ${d.weeklyVolume.toLocaleString()} kg of total volume so far. Log another to build the week.` };
}

function StatCard({ icon: Icon, value, sub, change }: { icon: typeof Dumbbell; label: string; value: string; sub: string; change?: number | null }) {
  return (
    <Card className="hover-lift">
      <CardContent className="p-4">
        <div className="mb-2 flex items-center justify-between">
          <div className="grid size-8 place-items-center rounded-lg bg-accent text-primary">
            <Icon className="size-4" />
          </div>
          {change != null && change !== 0 && (
            <span className={`flex items-center gap-0.5 text-xs font-medium ${change < 0 ? "text-[hsl(var(--success))]" : "text-muted-foreground"}`}>
              {change < 0 ? <TrendingDown className="size-3" /> : <TrendingUp className="size-3" />}
              {Math.abs(change)}
            </span>
          )}
        </div>
        <p className="font-display text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </CardContent>
    </Card>
  );
}

function Metric({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-xl bg-secondary p-3 text-center">
      <p className="font-display text-xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
      {note && <p className="text-[11px] capitalize text-muted-foreground">{note}</p>}
    </div>
  );
}

function QuickAction({ href, icon: Icon, label }: { href: string; icon: typeof Dumbbell; label: string }) {
  return (
    <Link href={href} className="group block">
      <Card className="hover-lift">
        <CardContent className="flex flex-col items-center gap-2 p-4 text-center">
          <div className="grid size-10 place-items-center rounded-xl bg-accent text-primary transition-transform group-hover:scale-110">
            <Icon className="size-5" />
          </div>
          <span className="text-sm font-medium">{label}</span>
          <ArrowRight className="size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
        </CardContent>
      </Card>
    </Link>
  );
}

function MiniTooltip({ active, payload, unit }: { active?: boolean; payload?: { value: number; payload: { label?: string } }[]; unit: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-background px-3 py-2 text-sm shadow-md">
      {payload[0].payload.label && <p className="font-medium">{payload[0].payload.label}</p>}
      <p className="text-muted-foreground">{payload[0].value.toLocaleString()} {unit}</p>
    </div>
  );
}

function LogWeightDialog({ open, onOpenChange, current }: { open: boolean; onOpenChange: (o: boolean) => void; current: number | null }) {
  const [value, setValue] = useState("");
  const logWeight = useLogBodyWeight();
  const save = () => {
    const num = Number(value);
    if (!num || num < 20 || num > 400) {
      toast.error("Enter a weight between 20 and 400 kg.");
      return;
    }
    logWeight.mutate(
      { weightKg: num },
      {
        onSuccess: () => {
          toast.success("Weight logged");
          setValue("");
          onOpenChange(false);
        },
        onError: () => toast.error("Could not log weight"),
      },
    );
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log body weight</DialogTitle>
        </DialogHeader>
        <div className="flex items-center gap-2">
          <Input type="number" inputMode="decimal" autoFocus placeholder={current ? String(current) : "kg"} value={value} onChange={(e) => setValue(e.target.value)} />
          <span className="text-muted-foreground">kg</span>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={logWeight.isPending}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
