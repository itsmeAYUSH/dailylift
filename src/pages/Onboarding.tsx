import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import { 
  Activity, 
  ArrowRight, 
  ArrowLeft, 
  User, 
  Target, 
  Dumbbell,
  Check,
  Loader2
} from 'lucide-react';

const steps = [
  { id: 1, title: 'Personal Info', icon: User },
  { id: 2, title: 'Fitness Goals', icon: Target },
  { id: 3, title: 'Preferences', icon: Dumbbell },
];

const fitnessGoals = [
  { value: 'weight_loss', label: 'Weight Loss', emoji: '🔥', description: 'Burn fat and get lean' },
  { value: 'muscle_gain', label: 'Muscle Gain', emoji: '💪', description: 'Build strength and size' },
  { value: 'endurance', label: 'Endurance', emoji: '🏃', description: 'Improve stamina and cardio' },
  { value: 'flexibility', label: 'Flexibility', emoji: '🧘', description: 'Enhance mobility and balance' },
  { value: 'general_fitness', label: 'General Fitness', emoji: '⚡', description: 'Overall health improvement' },
];

const fitnessLevels = [
  { value: 'beginner', label: 'Beginner', description: 'New to fitness or returning after a break' },
  { value: 'intermediate', label: 'Intermediate', description: 'Regular exercise for 6+ months' },
  { value: 'advanced', label: 'Advanced', description: 'Consistent training for 2+ years' },
];

const workoutPreferences = [
  { value: 'home', label: 'Home', emoji: '🏠', description: 'Minimal equipment workouts' },
  { value: 'gym', label: 'Gym', emoji: '🏋️', description: 'Full equipment access' },
  { value: 'outdoor', label: 'Outdoor', emoji: '🌳', description: 'Parks and open spaces' },
  { value: 'mixed', label: 'Mixed', emoji: '🔄', description: 'Combination of all' },
];

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { updateProfile } = useAuthStore();
  
  // Form state
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
    if (currentStep < 3) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
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
      
      toast.success('Profile setup complete!');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Failed to save profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-dark flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-2xl relative z-10">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
            <Activity className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-2xl">
            Fit<span className="text-gradient">AI</span>
          </span>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center gap-4">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                currentStep === step.id 
                  ? 'gradient-primary text-primary-foreground' 
                  : currentStep > step.id
                    ? 'bg-primary/20 text-primary'
                    : 'bg-card text-muted-foreground'
              }`}>
                {currentStep > step.id ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <step.icon className="w-4 h-4" />
                )}
                <span className="text-sm font-medium hidden sm:inline">{step.title}</span>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-8 h-0.5 ${currentStep > step.id ? 'bg-primary' : 'bg-border'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="glass rounded-2xl p-8 animate-scale-in">
          {/* Step 1: Personal Info */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h1 className="font-display text-2xl font-bold mb-2">Tell us about yourself</h1>
                <p className="text-muted-foreground">This helps us personalize your experience</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    placeholder="John Doe"
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
              <div className="text-center mb-8">
                <h1 className="font-display text-2xl font-bold mb-2">What's your goal?</h1>
                <p className="text-muted-foreground">We'll customize your plans based on this</p>
              </div>

              <div className="space-y-4">
                <Label>Primary Goal</Label>
                <div className="grid sm:grid-cols-2 gap-3">
                  {fitnessGoals.map((goal) => (
                    <button
                      key={goal.value}
                      type="button"
                      onClick={() => updateField('fitness_goal', goal.value)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        formData.fitness_goal === goal.value
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{goal.emoji}</span>
                        <div>
                          <div className="font-medium">{goal.label}</div>
                          <div className="text-sm text-muted-foreground">{goal.description}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <Label>Fitness Level</Label>
                <div className="grid gap-3">
                  {fitnessLevels.map((level) => (
                    <button
                      key={level.value}
                      type="button"
                      onClick={() => updateField('fitness_level', level.value)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        formData.fitness_level === level.value
                          ? 'border-primary bg-primary/10'
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
              <div className="text-center mb-8">
                <h1 className="font-display text-2xl font-bold mb-2">Your Preferences</h1>
                <p className="text-muted-foreground">Help us create the perfect plan for you</p>
              </div>

              <div className="space-y-4">
                <Label>Workout Location</Label>
                <div className="grid grid-cols-2 gap-3">
                  {workoutPreferences.map((pref) => (
                    <button
                      key={pref.value}
                      type="button"
                      onClick={() => updateField('workout_preference', pref.value)}
                      className={`p-4 rounded-xl border-2 text-center transition-all ${
                        formData.workout_preference === pref.value
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="text-2xl mb-2">{pref.emoji}</div>
                      <div className="font-medium">{pref.label}</div>
                      <div className="text-xs text-muted-foreground">{pref.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <Label>Available Time Per Day</Label>
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

              <div className="space-y-4">
                <Label>Dietary Preference</Label>
                <div className="flex gap-2">
                  {[
                    { value: 'vegetarian', label: '🥗 Vegetarian' },
                    { value: 'non_vegetarian', label: '🍖 Non-Veg' },
                    { value: 'vegan', label: '🌱 Vegan' },
                  ].map((diet) => (
                    <Button
                      key={diet.value}
                      type="button"
                      variant={formData.dietary_preference === diet.value ? 'default' : 'outline'}
                      size="sm"
                      className="flex-1"
                      onClick={() => updateField('dietary_preference', diet.value)}
                    >
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
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            {currentStep < 3 ? (
              <Button
                type="button"
                variant="gradient"
                onClick={handleNext}
                disabled={!canProceed()}
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                type="button"
                variant="gradient"
                onClick={handleComplete}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Complete Setup
                    <Check className="w-4 h-4 ml-2" />
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
