"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { startOfWeek, format } from "date-fns";
import { AuthGate } from "@/components/AuthGate";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import {
  useBodyWeightLogs,
  useWorkoutHistory,
  usePersonalRecords,
  useLogBodyWeight,
} from "@/hooks/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@dailylift/ui/components/card";
import { Button } from "@dailylift/ui/components/button";
import { Badge } from "@dailylift/ui/components/badge";
import { Input } from "@dailylift/ui/components/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@dailylift/ui/components/dialog";
import { Scale, Dumbbell, Trophy, Plus } from "lucide-react";

const RANGES = [
  { label: "30D", days: 30 },
  { label: "90D", days: 90 },
  { label: "1Y", days: 365 },
  { label: "All", days: 100000 },
] as const;

export default function ProgressPage() {
  const { data: weights } = useBodyWeightLogs();
  const { data: history } = useWorkoutHistory();
  const { data: prs } = usePersonalRecords();
  const [range, setRange] = useState<(typeof RANGES)[number]>(RANGES[1]);
  const [weightOpen, setWeightOpen] = useState(false);

  // Capture "now" once on mount so the cutoff stays stable across renders.
  const [now] = useState(() => Date.now());
  const cutoff = useMemo(
    () => now - range.days * 24 * 3600 * 1000,
    [now, range.days],
  );

  const weightSeries = useMemo(() => {
    return (weights ?? [])
      .filter((w) => new Date(w.logged_on).getTime() >= cutoff)
      .map((w) => ({ date: format(new Date(w.logged_on), "MMM d"), weight: w.weight_kg }));
  }, [weights, cutoff]);

  const volumeSeries = useMemo(() => {
    const byWeek = new Map<string, number>();
    for (const w of history ?? []) {
      if (new Date(w.started_at).getTime() < cutoff) continue;
      const wk = format(startOfWeek(new Date(w.started_at), { weekStartsOn: 1 }), "MMM d");
      const vol = w.workout_exercises
        .flatMap((we) => we.workout_sets)
        .filter((s) => s.is_completed)
        .reduce((v, s) => v + (s.weight_kg ?? 0) * (s.reps ?? 0), 0);
      byWeek.set(wk, (byWeek.get(wk) ?? 0) + vol);
    }
    return Array.from(byWeek.entries()).map(([week, volume]) => ({ week, volume: Math.round(volume) }));
  }, [history, cutoff]);

  const workoutsInRange = (history ?? []).filter((w) => new Date(w.started_at).getTime() >= cutoff).length;
  const totalVolume = volumeSeries.reduce((s, v) => s + v.volume, 0);
  const hasData = weightSeries.length > 0 || volumeSeries.length > 0;

  return (
    <AuthGate>
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <PageHeader
          title="Progress"
          subtitle="Your training and body-weight trends over time."
          actions={
            <Button variant="outline" onClick={() => setWeightOpen(true)}>
              <Plus className="size-4" /> Log weight
            </Button>
          }
        />

        <div className="mb-6 flex gap-2">
          {RANGES.map((r) => (
            <button
              key={r.label}
              onClick={() => setRange(r)}
              className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                range.label === r.label
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border hover:border-primary/40"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        <div className="mb-6 grid grid-cols-3 gap-4">
          <StatCard label="Workouts" value={String(workoutsInRange)} />
          <StatCard label="Volume" value={`${totalVolume.toLocaleString()} kg`} />
          <StatCard label="PRs" value={String(prs?.length ?? 0)} />
        </div>

        {!hasData ? (
          <EmptyState
            icon={Dumbbell}
            title="Not enough data yet"
            description="Log a few workouts and body-weight entries to see your trends here."
          />
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Scale className="size-4 text-primary" /> Body weight
                </CardTitle>
              </CardHeader>
              <CardContent>
                {weightSeries.length < 2 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    Log at least two body-weight entries to see a trend.
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <LineChart data={weightSeries} margin={{ left: -10, right: 8, top: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" fontSize={12} stroke="hsl(var(--muted-foreground))" />
                      <YAxis domain={["dataMin - 2", "dataMax + 2"]} fontSize={12} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip content={<ChartTooltip unit="kg" />} />
                      <Line
                        type="monotone"
                        dataKey="weight"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Dumbbell className="size-4 text-primary" /> Weekly training volume
                </CardTitle>
              </CardHeader>
              <CardContent>
                {volumeSeries.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No completed workouts in this range.
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={volumeSeries} margin={{ left: -10, right: 8, top: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="week" fontSize={12} stroke="hsl(var(--muted-foreground))" />
                      <YAxis fontSize={12} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip content={<ChartTooltip unit="kg" />} />
                      <Bar dataKey="volume" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {prs && prs.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Trophy className="size-4 text-primary" /> Personal records
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {prs.slice(0, 12).map((pr) => (
                    <div key={pr.id} className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2">
                      <div>
                        <p className="font-medium">{pr.exercise_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {pr.record_type === "est_1rm" ? "Estimated 1RM" : "Max weight"} ·{" "}
                          {new Date(pr.achieved_on).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge>{Math.round(pr.value * 10) / 10} kg</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      <LogWeightDialog open={weightOpen} onOpenChange={setWeightOpen} />
    </AuthGate>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4 text-center">
        <p className="font-display text-xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}

function ChartTooltip({
  active,
  payload,
  label,
  unit,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
  unit: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-background px-3 py-2 text-sm shadow-md">
      <p className="font-medium">{label}</p>
      <p className="text-muted-foreground">
        {payload[0].value.toLocaleString()} {unit}
      </p>
    </div>
  );
}

function LogWeightDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
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
          <Input
            type="number"
            inputMode="decimal"
            autoFocus
            placeholder="kg"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <span className="text-muted-foreground">kg</span>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={logWeight.isPending}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
