"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@dailylift/ui/components/button';
import { Input } from '@dailylift/ui/components/input';
import { Label } from '@dailylift/ui/components/label';
import { useAuthStore } from '@/stores/authStore';
import { SPLITS, recommendSplit, type TrainingSplit } from '@/lib/fitness/split';
import { toast } from 'sonner';
import {
  Dumbbell,
  ArrowRight,
  ArrowLeft,
  User,
  Target,
  Check,
  Loader2,
  Flame,
  Activity,
  Zap,
  PersonStanding,
  Home,
  Trees,
  Shuffle,
  Salad,
  Beef,
  Leaf,
  Sparkles,
  CalendarDays,
} from 'lucide-react';

const steps = [
  { id: 1, title: 'You', icon: User },
  { id: 2, title: 'Goal', icon: Target },
  { id: 3, title: 'Training', icon: Dumbbell },
  { id: 4, title: 'Food', icon: Salad },
];

const fitnessGoals = [
  { value: 'weight_loss', label: 'Lose fat', icon: Flame, description: 'Lean out while keeping strength' },
  { value: 'muscle_gain', label: 'Build muscle', icon: Dumbbell, description: 'Add size and strength' },
  { value: 'endurance', label: 'Endurance', icon: Activity, description: 'Go longer, recover faster' },
  { value: 'flexibility', label: 'Mobility', icon: PersonStanding, description: 'Move better, stay supple' },
  { value: 'general_fitness', label: 'Stay fit', icon: Zap, description: 'Overall health and energy' },
];

const fitnessLevels = [
  { value: 'beginner', label: 'Beginner', description: 'New, or back after a long break' },
  { value: 'intermediate', label: 'Intermediate', description: 'Training consistently for 6+ months' },
  { value: 'advanced', label: 'Advanced', description: 'Years of steady training' },
];

const workoutPreferences = [
  { value: 'gym', label: 'Gym', icon: Dumbbell, description: 'Full equipment' },
  { value: 'home', label: 'Home', icon: Home, description: 'Minimal gear' },
  { value: 'outdoor', label: 'Outdoor', icon: Trees, description: 'Parks & open space' },
  { value: 'mixed', label: 'Mixed', icon: Shuffle, description: 'A bit of everything' },
];

const dietaryOptions = [
  { value: 'vegetarian', label: 'Vegetarian', icon: Salad },
  { value: 'non_vegetarian', label: 'Non-veg', icon: Beef },
  { value: 'vegan', label: 'Vegan', icon: Leaf },
];

interface Suggestion {
  split: TrainingSplit;
  rationale: string;
  aiNote: string | null;
}

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const router = useRouter();
  const { updateProfile } = useAuthStore();

  const [formData, setFormData] = useState({
    full_name: '',
    age: '',
    gender: '',
    height_cm: '',
    weight_kg: '',
    fitness_goal: 'general_fitness',
    fitness_level: 'beginner',
    workout_preference: 'gym',
    training_days_per_week: 4,
    training_split: '' as TrainingSplit | '',
    available_time_minutes: 45,
    dietary_preference: 'non_vegetarian',
  });

  const updateField = (field: string, value: unknown) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  // Split selection is only relevant for equipment-rich settings.
  const showSplit =
    formData.workout_preference === 'gym' || formData.workout_preference === 'mixed';

  const canProceed = () => {
    if (currentStep === 1) {
      return (
        formData.full_name &&
        formData.age &&
        formData.gender &&
        formData.height_cm &&
        formData.weight_kg
      );
    }
    return true;
  };

  const handleSuggest = async () => {
    setSuggesting(true);
    try {
      const res = await fetch('/api/suggest-split', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          experience: formData.fitness_level,
          daysPerWeek: formData.training_days_per_week,
          goal: formData.fitness_goal,
          location: formData.workout_preference,
        }),
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as Suggestion;
      setSuggestion(data);
      updateField('training_split', data.split);
    } catch {
      // Fall back to the instant deterministic recommendation.
      const rec = recommendSplit({
        experience: formData.fitness_level,
        daysPerWeek: formData.training_days_per_week,
        goal: formData.fitness_goal,
        location: formData.workout_preference,
      });
      setSuggestion({ ...rec, aiNote: null });
      updateField('training_split', rec.split);
    } finally {
      setSuggesting(false);
    }
  };

  const handleNext = () => currentStep < 4 && setCurrentStep((s) => s + 1);
  const handleBack = () => currentStep > 1 && setCurrentStep((s) => s - 1);

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      // For home/outdoor users we didn't ask for a split — pick a sensible one.
      const split =
        formData.training_split ||
        recommendSplit({
          experience: formData.fitness_level,
          daysPerWeek: formData.training_days_per_week,
          goal: formData.fitness_goal,
          location: formData.workout_preference,
        }).split;

      await updateProfile({
        full_name: formData.full_name,
        gender: formData.gender,
        fitness_goal: formData.fitness_goal as never,
        fitness_level: formData.fitness_level as never,
        workout_preference: formData.workout_preference as never,
        dietary_preference: formData.dietary_preference,
        age: parseInt(formData.age),
        height_cm: parseFloat(formData.height_cm),
        weight_kg: parseFloat(formData.weight_kg),
        available_time_minutes: formData.available_time_minutes,
        training_days_per_week: formData.training_days_per_week,
        training_split: split,
        onboarding_completed: true,
      });
      toast.success("You're all set");
      router.push('/dashboard');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Could not save your profile.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <Dumbbell className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight">DailyLift</span>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center gap-2">
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-colors ${
                  currentStep === step.id
                    ? 'bg-primary text-primary-foreground'
                    : currentStep > step.id
                      ? 'bg-accent text-accent-foreground'
                      : 'bg-secondary text-muted-foreground'
                }`}
              >
                {currentStep > step.id ? <Check className="w-4 h-4" /> : <step.icon className="w-4 h-4" />}
                <span className="font-medium hidden sm:inline">{step.title}</span>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-5 h-px ${currentStep > step.id ? 'bg-primary' : 'bg-border'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm animate-fade-in">
          {/* Step 1 */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h1 className="font-display text-xl font-bold mb-1">First, the basics</h1>
                <p className="text-sm text-muted-foreground">We use these to size your plans and targets.</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="full_name">Full name</Label>
                  <Input id="full_name" placeholder="Jane Doe" value={formData.full_name}
                    onChange={(e) => updateField('full_name', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input id="age" type="number" inputMode="numeric" placeholder="25" value={formData.age}
                    onChange={(e) => updateField('age', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Sex <span className="text-muted-foreground font-normal">(for calorie math)</span></Label>
                  <div className="flex gap-2">
                    {['male', 'female', 'other'].map((g) => (
                      <Button key={g} type="button" variant={formData.gender === g ? 'default' : 'outline'}
                        size="sm" className="flex-1 capitalize" onClick={() => updateField('gender', g)}>
                        {g}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="height_cm">Height (cm)</Label>
                  <Input id="height_cm" type="number" inputMode="numeric" placeholder="175" value={formData.height_cm}
                    onChange={(e) => updateField('height_cm', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weight_kg">Weight (kg)</Label>
                  <Input id="weight_kg" type="number" inputMode="decimal" placeholder="70" value={formData.weight_kg}
                    onChange={(e) => updateField('weight_kg', e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {/* Step 2 */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h1 className="font-display text-xl font-bold mb-1">What are you training for?</h1>
                <p className="text-sm text-muted-foreground">Pick the goal that matters most right now.</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {fitnessGoals.map((goal) => (
                  <button key={goal.value} type="button" onClick={() => updateField('fitness_goal', goal.value)}
                    className={`p-4 rounded-xl border text-left transition-colors ${
                      formData.fitness_goal === goal.value ? 'border-primary bg-accent' : 'border-border hover:border-primary/50'
                    }`}>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                        <goal.icon className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">{goal.label}</div>
                        <div className="text-sm text-muted-foreground">{goal.description}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <div className="space-y-3">
                <Label>Experience level</Label>
                <div className="grid gap-3">
                  {fitnessLevels.map((level) => (
                    <button key={level.value} type="button" onClick={() => updateField('fitness_level', level.value)}
                      className={`p-4 rounded-xl border text-left transition-colors ${
                        formData.fitness_level === level.value ? 'border-primary bg-accent' : 'border-border hover:border-primary/50'
                      }`}>
                      <div className="font-medium">{level.label}</div>
                      <div className="text-sm text-muted-foreground">{level.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3 — Training */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h1 className="font-display text-xl font-bold mb-1">How do you like to train?</h1>
                <p className="text-sm text-muted-foreground">Where, how often, and which split.</p>
              </div>

              <div className="space-y-3">
                <Label>Where you train</Label>
                <div className="grid grid-cols-2 gap-3">
                  {workoutPreferences.map((pref) => (
                    <button key={pref.value} type="button"
                      onClick={() => { updateField('workout_preference', pref.value); setSuggestion(null); }}
                      className={`p-4 rounded-xl border text-center transition-colors ${
                        formData.workout_preference === pref.value ? 'border-primary bg-accent' : 'border-border hover:border-primary/50'
                      }`}>
                      <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center mx-auto mb-2">
                        <pref.icon className="w-4 h-4 text-primary" />
                      </div>
                      <div className="font-medium">{pref.label}</div>
                      <div className="text-xs text-muted-foreground">{pref.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="flex items-center gap-2"><CalendarDays className="w-4 h-4" /> Days per week</Label>
                <div className="flex gap-2">
                  {[2, 3, 4, 5, 6].map((d) => (
                    <Button key={d} type="button" variant={formData.training_days_per_week === d ? 'default' : 'outline'}
                      size="sm" className="flex-1"
                      onClick={() => { updateField('training_days_per_week', d); setSuggestion(null); }}>
                      {d}
                    </Button>
                  ))}
                </div>
              </div>

              {showSplit && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Your split</Label>
                    <Button type="button" variant="outline" size="sm" onClick={handleSuggest} disabled={suggesting}>
                      {suggesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      Suggest for me
                    </Button>
                  </div>

                  {suggestion && (
                    <div className="p-4 rounded-xl bg-accent border border-primary/30">
                      <p className="text-sm font-medium mb-1 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-primary" /> We suggest {SPLITS.find((s) => s.value === suggestion.split)?.label}
                      </p>
                      <p className="text-sm text-muted-foreground">{suggestion.aiNote || suggestion.rationale}</p>
                    </div>
                  )}

                  <div className="grid sm:grid-cols-2 gap-3">
                    {SPLITS.map((split) => (
                      <button key={split.value} type="button" onClick={() => updateField('training_split', split.value)}
                        className={`p-4 rounded-xl border text-left transition-colors ${
                          formData.training_split === split.value ? 'border-primary bg-accent' : 'border-border hover:border-primary/50'
                        }`}>
                        <div className="font-medium">{split.label}</div>
                        <div className="text-xs text-primary/80 mb-1">{split.tagline}</div>
                        <div className="text-sm text-muted-foreground">{split.description}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <Label>Time per session</Label>
                <div className="flex gap-2">
                  {[30, 45, 60, 90].map((t) => (
                    <Button key={t} type="button" variant={formData.available_time_minutes === t ? 'default' : 'outline'}
                      size="sm" className="flex-1" onClick={() => updateField('available_time_minutes', t)}>
                      {t}m
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 4 — Nutrition */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h1 className="font-display text-xl font-bold mb-1">Last thing — how you eat</h1>
                <p className="text-sm text-muted-foreground">So meal suggestions actually fit your plate.</p>
              </div>
              <div className="space-y-3">
                <Label>Dietary preference</Label>
                <div className="flex gap-2">
                  {dietaryOptions.map((diet) => (
                    <Button key={diet.value} type="button" variant={formData.dietary_preference === diet.value ? 'default' : 'outline'}
                      size="sm" className="flex-1 gap-2" onClick={() => updateField('dietary_preference', diet.value)}>
                      <diet.icon className="w-4 h-4" />
                      {diet.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <Button type="button" variant="ghost" onClick={handleBack} disabled={currentStep === 1}>
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            {currentStep < 4 ? (
              <Button type="button" onClick={handleNext} disabled={!canProceed()}>
                Next
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button type="button" onClick={handleComplete} disabled={isLoading}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (<>Finish setup<Check className="w-4 h-4" /></>)}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
