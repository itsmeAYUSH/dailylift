"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { toast } from "sonner";
import { AuthGate } from "@/components/AuthGate";
import { PageHeader } from "@/components/PageHeader";
import { ProfileSkeleton } from "@/components/skeletons";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@dailylift/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@dailylift/ui/components/card";
import { Input } from "@dailylift/ui/components/input";
import { Label } from "@dailylift/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@dailylift/ui/components/select";
import { User, Dumbbell, Utensils, LogOut, Check } from "lucide-react";

const GOALS = [
  ["weight_loss", "Lose fat"],
  ["muscle_gain", "Build muscle"],
  ["endurance", "Improve endurance"],
  ["flexibility", "Improve flexibility"],
  ["general_fitness", "General fitness"],
] as const;
const LEVELS = [
  ["beginner", "Beginner"],
  ["intermediate", "Intermediate"],
  ["advanced", "Advanced"],
] as const;
const PREFS = [
  ["gym", "Gym"],
  ["home", "Home"],
  ["outdoor", "Outdoor"],
  ["mixed", "Both / mixed"],
] as const;
const DIETS = [
  ["non_vegetarian", "Non-vegetarian"],
  ["vegetarian", "Vegetarian"],
  ["vegan", "Vegan"],
  ["eggetarian", "Eggetarian"],
] as const;

const PROFILE_TABS = [
  { id: "all", label: "All Details", icon: User },
  { id: "personal", label: "Personal", icon: User },
  { id: "training", label: "Training & Goal", icon: Dumbbell },
  { id: "nutrition", label: "Nutrition", icon: Utensils },
] as const;

type ProfileTab = (typeof PROFILE_TABS)[number]["id"];

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <AuthGate fallback={<ProfileSkeleton />}>
          <ProfileSkeleton />
        </AuthGate>
      }
    >
      <Profile />
    </Suspense>
  );
}

function Profile() {
  const { profile, updateProfile, signOut } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlTab = (searchParams.get("tab") as ProfileTab) || "all";
  const [activeTab, setActiveTab] = useState<ProfileTab>(
    PROFILE_TABS.some((t) => t.id === urlTab) ? urlTab : "all"
  );

  const [form, setForm] = useState({
    full_name: "",
    age: "",
    gender: "",
    height_cm: "",
    weight_kg: "",
    fitness_goal: "general_fitness",
    fitness_level: "beginner",
    workout_preference: "gym",
    dietary_preference: "non_vegetarian",
    training_days_per_week: "3",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (urlTab && PROFILE_TABS.some((t) => t.id === urlTab)) {
      setActiveTab(urlTab);
    }
  }, [urlTab]);

  const handleTabChange = (tabId: ProfileTab) => {
    setActiveTab(tabId);
    const params = new URLSearchParams(searchParams.toString());
    if (tabId === "all") {
      params.delete("tab");
    } else {
      params.set("tab", tabId);
    }
    const qs = params.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  };

  useEffect(() => {
    if (!profile) return;
    // Prefill the form once the user's profile loads.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm({
      full_name: profile.full_name ?? "",
      age: profile.age?.toString() ?? "",
      gender: profile.gender ?? "",
      height_cm: profile.height_cm?.toString() ?? "",
      weight_kg: profile.weight_kg?.toString() ?? "",
      fitness_goal: profile.fitness_goal ?? "general_fitness",
      fitness_level: profile.fitness_level ?? "beginner",
      workout_preference: profile.workout_preference ?? "gym",
      dietary_preference: profile.dietary_preference ?? "non_vegetarian",
      training_days_per_week: profile.training_days_per_week?.toString() ?? "3",
    });
  }, [profile]);

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      await updateProfile({
        full_name: form.full_name || null,
        age: form.age ? Number(form.age) : null,
        gender: form.gender || null,
        height_cm: form.height_cm ? Number(form.height_cm) : null,
        weight_kg: form.weight_kg ? Number(form.weight_kg) : null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        fitness_goal: form.fitness_goal as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        fitness_level: form.fitness_level as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        workout_preference: form.workout_preference as any,
        dietary_preference: form.dietary_preference,
        training_days_per_week: form.training_days_per_week ? Number(form.training_days_per_week) : null,
      });
      toast.success("Profile updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update profile");
    } finally {
      setSaving(false);
    }
  };

  const showPersonal = activeTab === "all" || activeTab === "personal";
  const showTraining = activeTab === "all" || activeTab === "training";
  const showNutrition = activeTab === "all" || activeTab === "nutrition";

  return (
    <AuthGate fallback={<ProfileSkeleton />}>
      {!profile ? (
        <ProfileSkeleton />
      ) : (
        <div className="container mx-auto max-w-4xl px-4 py-8">
          <PageHeader title="Profile" subtitle="Your details drive your plans and targets." />

          {/* Section Tabs synced with URL query ?tab= */}
          <div className="mb-6 flex flex-wrap gap-2">
            {PROFILE_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <Button
                  key={tab.id}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleTabChange(tab.id)}
                  className="rounded-full gap-2 transition-all"
                >
                  <Icon className="size-3.5" />
                  {tab.label}
                </Button>
              );
            })}
          </div>

          <div className="space-y-6">
            {showPersonal && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="size-4 text-primary" /> Personal details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Field label="Full name">
                    <Input value={form.full_name} onChange={(e) => set("full_name", e.target.value)} />
                  </Field>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Age">
                      <Input type="number" value={form.age} onChange={(e) => set("age", e.target.value)} />
                    </Field>
                    <Field label="Sex (for calculations)">
                      <SelectInput value={form.gender} onChange={(v) => set("gender", v)} options={[["male", "Male"], ["female", "Female"], ["other", "Prefer not to say"]]} placeholder="Select" />
                    </Field>
                    <Field label="Height (cm)">
                      <Input type="number" value={form.height_cm} onChange={(e) => set("height_cm", e.target.value)} />
                    </Field>
                    <Field label="Weight (kg)">
                      <Input type="number" value={form.weight_kg} onChange={(e) => set("weight_kg", e.target.value)} />
                    </Field>
                  </div>
                </CardContent>
              </Card>
            )}

            {showTraining && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Dumbbell className="size-4 text-primary" /> Training &amp; Goals
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Primary goal">
                    <SelectInput value={form.fitness_goal} onChange={(v) => set("fitness_goal", v)} options={GOALS} />
                  </Field>
                  <Field label="Experience level">
                    <SelectInput value={form.fitness_level} onChange={(v) => set("fitness_level", v)} options={LEVELS} />
                  </Field>
                  <Field label="Where you train">
                    <SelectInput value={form.workout_preference} onChange={(v) => set("workout_preference", v)} options={PREFS} />
                  </Field>
                  <Field label="Training days / week">
                    <SelectInput
                      value={form.training_days_per_week}
                      onChange={(v) => set("training_days_per_week", v)}
                      options={[2, 3, 4, 5, 6].map((d) => [String(d), `${d} days`] as [string, string])}
                    />
                  </Field>
                </CardContent>
              </Card>
            )}

            {showNutrition && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Utensils className="size-4 text-primary" /> Dietary preference
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Dietary preference">
                    <SelectInput value={form.dietary_preference} onChange={(v) => set("dietary_preference", v)} options={DIETS} />
                  </Field>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="mt-6 flex items-center justify-between">
            <Button variant="ghost" className="text-destructive hover:text-destructive gap-2" onClick={signOut}>
              <LogOut className="size-4" /> Sign out
            </Button>
            <Button onClick={save} disabled={saving} className="gap-2">
              <Check className="size-4" /> {saving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </div>
      )}
    </AuthGate>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function SelectInput({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: readonly (readonly [string, string])[];
  placeholder?: string;
}) {
  return (
    <Select value={value || undefined} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder ?? "Select"} />
      </SelectTrigger>
      <SelectContent>
        {options.map(([v, label]) => (
          <SelectItem key={v} value={v}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
