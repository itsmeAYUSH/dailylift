"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@dailylift/ui/components/button';
import { Input } from '@dailylift/ui/components/input';
import { Label } from '@dailylift/ui/components/label';
import { useAuthStore } from '@/stores/authStore';
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
} from 'lucide-react';

const steps = [
  { id: 1, title: 'Personal', icon: User },
  { id: 2, title: 'Goals', icon: Target },
  { id: 3, title: 'Preferences', icon: Dumbbell },
];

const fitnessGoals = [
  { value: 'weight_loss', label: 'Weight loss', icon: Flame, description: 'Burn fat and get lean' },
  { value: 'muscle_gain', label: 'Muscle gain', icon: Dumbbell, description: 'Build strength and size' },
  { value: 'endurance', label: 'Endurance', icon: Activity, description: 'Improve stamina and cardio' },
  { value: 'flexibility', label: 'Flexibility', icon: PersonStanding, description: 'Enhance mobility and balance' },
  { value: 'general_fitness', label: 'General fitness', icon: Zap, description: 'Overall health improvement' },
];

const fitnessLevels = [
  { value: 'beginner', label: 'Beginner', description: 'New to fitness or returning after a break' },
  { value: 'intermediate', label: 'Intermediate', description: 'Regular exercise for 6+ months' },
  { value: 'advanced', label: 'Advanced', description: 'Consistent training for 2+ years' },
];

const workoutPreferences = [
  { value: 'home', label: 'Home', icon: Home, description: 'Minimal equipment' },
  { value: 'gym', label: 'Gym', icon: Dumbbell, description: 'Full equipment access' },
  { value: 'outdoor', label: 'Outdoor', icon: Trees, description: 'Parks and open spaces' },
  { value: 'mixed', label: 'Mixed', icon: Shuffle, description: 'A combination of all' },
];

const dietaryOptions = [
  { value: 'vegetarian', label: 'Vegetarian', icon: Salad },
  { value: 'non_vegetarian', label: 'Non-veg', icon: Beef },
  { value: 'vegan', label: 'Vegan', icon: Leaf },
];

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { updateProfile } = useAuthStore();

  const [formData, setFormData] = useState({
    full_name: '',
    age: '',
    gender: '',
    height_cm: '',
    weight_kg: '',
    fitness_goal: 'general_fitness' as const,
    fitness_level: 'beginner' as const,
    workout_preference: 'mixed' as const,
    available_time_minutes: 30,
    dietary_preference: 'non_vegetarian',
  });

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const canProceed = () => {
    if (currentStep === 1) {
      return formData.full_name && formData.age && formData.gender &&
             formData.height_cm && formData.weight_kg;
    }
    return true;
  };

  const handleNext = () => {
    if (currentStep < 3) setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(prev => prev - 1);
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      await updateProfile({
        ...formData,
        age: parseInt(formData.age),
        height_cm: parseFloat(formData.height_cm),
        weight_kg: parseFloat(formData.weight_kg),
        onboarding_completed: true,
      });
      toast.success('Profile setup complete');
      router.push('/dashboard');
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to save profile. Please try again.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <Dumbbell className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight">DailyLift</span>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center gap-3">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-colors ${
                currentStep === step.id
                  ? 'bg-primary text-primary-foreground'
                  : currentStep > step.id
                    ? 'bg-accent text-accent-foreground'
                    : 'bg-secondary text-muted-foreground'
              }`}>
                {currentStep > step.id ? <Check className="w-4 h-4" /> : <step.icon className="w-4 h-4" />}
                <span className="font-medium hidden sm:inline">{step.title}</span>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-6 h-px ${currentStep > step.id ? 'bg-primary' : 'bg-border'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm animate-fade-in">
          {/* Step 1: Personal Info */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="mb-6">
                <h1 className="font-display text-xl font-bold mb-1">Tell us about yourself</h1>
                <p className="text-sm text-muted-foreground">This helps us personalize your plans.</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="full_name">Full name</Label>
                  <Input
                    id="full_name"
                    placeholder="Jane Doe"
                    value={formData.full_name}
                    onChange={(e) => updateField('full_name', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    placeholder="25"
                    value={formData.age}
                    onChange={(e) => updateField('age', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Gender</Label>
                  <div className="flex gap-2">
                    {['male', 'female', 'other'].map((gender) => (
                      <Button
                        key={gender}
                        type="button"
                        variant={formData.gender === gender ? 'default' : 'outline'}
                        size="sm"
                        className="flex-1 capitalize"
                        onClick={() => updateField('gender', gender)}
                      >
                        {gender}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="height_cm">Height (cm)</Label>
                  <Input
                    id="height_cm"
                    type="number"
                    placeholder="175"
                    value={formData.height_cm}
                    onChange={(e) => updateField('height_cm', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="weight_kg">Weight (kg)</Label>
                  <Input
                    id="weight_kg"
                    type="number"
                    placeholder="70"
                    value={formData.weight_kg}
                    onChange={(e) => updateField('weight_kg', e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Fitness Goals */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="mb-2">
                <h1 className="font-display text-xl font-bold mb-1">What's your goal?</h1>
                <p className="text-sm text-muted-foreground">We'll tailor your plans around it.</p>
              </div>

              <div className="space-y-3">
                <Label>Primary goal</Label>
                <div className="grid sm:grid-cols-2 gap-3">
                  {fitnessGoals.map((goal) => (
                    <button
                      key={goal.value}
                      type="button"
                      onClick={() => updateField('fitness_goal', goal.value)}
                      className={`p-4 rounded-xl border text-left transition-colors ${
                        formData.fitness_goal === goal.value
                          ? 'border-primary bg-accent'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
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
              </div>

              <div className="space-y-3">
                <Label>Fitness level</Label>
                <div className="grid gap-3">
                  {fitnessLevels.map((level) => (
                    <button
                      key={level.value}
                      type="button"
                      onClick={() => updateField('fitness_level', level.value)}
                      className={`p-4 rounded-xl border text-left transition-colors ${
                        formData.fitness_level === level.value
                          ? 'border-primary bg-accent'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="font-medium">{level.label}</div>
                      <div className="text-sm text-muted-foreground">{level.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Preferences */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="mb-2">
                <h1 className="font-display text-xl font-bold mb-1">Your preferences</h1>
                <p className="text-sm text-muted-foreground">A few last details to finish setup.</p>
              </div>

              <div className="space-y-3">
                <Label>Workout location</Label>
                <div className="grid grid-cols-2 gap-3">
                  {workoutPreferences.map((pref) => (
                    <button
                      key={pref.value}
                      type="button"
                      onClick={() => updateField('workout_preference', pref.value)}
                      className={`p-4 rounded-xl border text-center transition-colors ${
                        formData.workout_preference === pref.value
                          ? 'border-primary bg-accent'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
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
                <Label>Available time per day</Label>
                <div className="flex gap-2">
                  {[15, 30, 45, 60, 90].map((time) => (
                    <Button
                      key={time}
                      type="button"
                      variant={formData.available_time_minutes === time ? 'default' : 'outline'}
                      size="sm"
                      className="flex-1"
                      onClick={() => updateField('available_time_minutes', time)}
                    >
                      {time}m
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label>Dietary preference</Label>
                <div className="flex gap-2">
                  {dietaryOptions.map((diet) => (
                    <Button
                      key={diet.value}
                      type="button"
                      variant={formData.dietary_preference === diet.value ? 'default' : 'outline'}
                      size="sm"
                      className="flex-1 gap-2"
                      onClick={() => updateField('dietary_preference', diet.value)}
                    >
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
            <Button
              type="button"
              variant="ghost"
              onClick={handleBack}
              disabled={currentStep === 1}
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>

            {currentStep < 3 ? (
              <Button type="button" onClick={handleNext} disabled={!canProceed()}>
                Next
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button type="button" onClick={handleComplete} disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Complete setup
                    <Check className="w-4 h-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
