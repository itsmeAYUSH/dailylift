"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@dailylift/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@dailylift/ui/components/card';
import { Badge } from '@dailylift/ui/components/badge';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import { 
  Dumbbell, 
  Clock, 
  Flame, 
  Zap,
  Play,
  CheckCircle2,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Timer,
  Target
} from 'lucide-react';

interface Exercise {
  name: string;
  sets: number;
  reps: string;
  rest: string;
  description: string;
  muscle_group: string;
}

interface WarmupCooldown {
  name: string;
  duration: string;
  description: string;
}

interface WorkoutPlan {
  title: string;
  duration: string;
  calories_burn: number;
  difficulty: string;
  warmup: WarmupCooldown[];
  exercises: Exercise[];
  cooldown: WarmupCooldown[];
  tips: string[];
}

export default function Workouts() {
  const { user, profile, isLoading, isInitialized } = useAuthStore();
  const router = useRouter();
  const [generating, setGenerating] = useState(false);
  const [workout, setWorkout] = useState<WorkoutPlan | null>(null);
  const [completedExercises, setCompletedExercises] = useState<Set<number>>(new Set());
  const [expandedExercise, setExpandedExercise] = useState<number | null>(null);
  const [activeTimer, setActiveTimer] = useState<number | null>(null);
  const [timerSeconds, setTimerSeconds] = useState(0);

  useEffect(() => {
    if (isInitialized && !isLoading && !user) {
      router.push('/auth');
    }
  }, [user, isLoading, isInitialized, router]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeTimer !== null) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeTimer]);

  const generateWorkout = async () => {
    if (!profile) return;
    
    setGenerating(true);
    try {
      const res = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'workout' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate workout');

      setWorkout(data.plan);
      setCompletedExercises(new Set());
      toast.success('Workout plan generated!');
    } catch (error: any) {
      console.error('Error generating workout:', error);
      toast.error(error.message || 'Failed to generate workout');
    } finally {
      setGenerating(false);
    }
  };

  const toggleExercise = (index: number) => {
    const newCompleted = new Set(completedExercises);
    if (newCompleted.has(index)) {
      newCompleted.delete(index);
    } else {
      newCompleted.add(index);
    }
    setCompletedExercises(newCompleted);
  };

  const startRestTimer = (index: number, restTime: string) => {
    const seconds = parseInt(restTime) || 60;
    setActiveTimer(index);
    setTimerSeconds(0);
    
    setTimeout(() => {
      setActiveTimer(null);
      toast.success('Rest complete! Next exercise.');
    }, seconds * 1000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = workout ? (completedExercises.size / workout.exercises.length) * 100 : 0;

  if (isLoading || !isInitialized) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="w-8 h-8 rounded-full border-2 border-muted border-t-primary animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading…</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold">Workout generator</h1>
              <p className="text-sm text-muted-foreground">A personalized routine for today</p>
            </div>
          </div>
        </div>

        {/* Generate Button */}
        {!workout && (
          <Card className="mb-8">
            <CardContent className="p-8 text-center">
              <div className="w-14 h-14 rounded-xl bg-accent flex items-center justify-center mx-auto mb-5">
                <Zap className="w-7 h-7 text-primary" />
              </div>
              <h2 className="font-display text-xl font-bold mb-2">Generate today's workout</h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                We'll build a routine around your {profile?.fitness_level} level,
                {' '}{profile?.fitness_goal?.replace('_', ' ')} goal, and {profile?.available_time_minutes} minutes available.
              </p>
              <Button 
                variant="gradient" 
                size="xl" 
                onClick={generateWorkout}
                disabled={generating}
              >
                {generating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
                    Generating Your Workout...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5 mr-2" />
                    Generate Today's Workout
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Workout Plan */}
        {workout && (
          <div className="space-y-6 animate-fade-in-up">
            {/* Workout Header */}
            <Card className="glass overflow-hidden">
              <div className="p-6 gradient-primary">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-2xl font-bold text-primary-foreground">{workout.title}</h2>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={generateWorkout}
                    disabled={generating}
                    className="text-primary-foreground hover:bg-primary-foreground/20"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Regenerate
                  </Button>
                </div>
                <div className="flex flex-wrap gap-4">
                  <Badge variant="secondary" className="bg-primary-foreground/20 text-primary-foreground">
                    <Clock className="w-3 h-3 mr-1" />
                    {workout.duration}
                  </Badge>
                  <Badge variant="secondary" className="bg-primary-foreground/20 text-primary-foreground">
                    <Flame className="w-3 h-3 mr-1" />
                    {workout.calories_burn} cal
                  </Badge>
                  <Badge variant="secondary" className="bg-primary-foreground/20 text-primary-foreground capitalize">
                    <Target className="w-3 h-3 mr-1" />
                    {workout.difficulty}
                  </Badge>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="p-4 bg-secondary/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Progress</span>
                  <span className="text-sm text-muted-foreground">
                    {completedExercises.size}/{workout.exercises.length} exercises
                  </span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full gradient-primary transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </Card>

            {/* Warm-up */}
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Play className="w-5 h-5 text-orange-400" />
                  Warm-up
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {workout.warmup.map((item, index) => (
                  <div key={index} className="p-3 rounded-lg bg-secondary/50 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                    <Badge variant="outline">{item.duration}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Exercises */}
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Dumbbell className="w-5 h-5 text-primary" />
                  Exercises
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {workout.exercises.map((exercise, index) => (
                  <div 
                    key={index} 
                    className={`p-4 rounded-xl border transition-all ${
                      completedExercises.has(index) 
                        ? 'bg-primary/10 border-primary/30' 
                        : 'bg-secondary/30 border-transparent hover:border-primary/20'
                    }`}
                  >
                    <div 
                      className="flex items-center gap-3 cursor-pointer"
                      onClick={() => setExpandedExercise(expandedExercise === index ? null : index)}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExercise(index);
                        }}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                          completedExercises.has(index)
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary hover:bg-primary/20'
                        }`}
                      >
                        {completedExercises.has(index) ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : (
                          <span className="font-bold text-sm">{index + 1}</span>
                        )}
                      </button>
                      
                      <div className="flex-1">
                        <p className={`font-medium ${completedExercises.has(index) ? 'line-through opacity-60' : ''}`}>
                          {exercise.name}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{exercise.sets} sets × {exercise.reps}</span>
                          <span>•</span>
                          <span>{exercise.rest} rest</span>
                        </div>
                      </div>
                      
                      <Badge variant="outline" className="hidden sm:flex">
                        {exercise.muscle_group}
                      </Badge>
                      
                      {expandedExercise === index ? (
                        <ChevronUp className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    
                    {expandedExercise === index && (
                      <div className="mt-4 pt-4 border-t border-border/50">
                        <p className="text-muted-foreground mb-4">{exercise.description}</p>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => startRestTimer(index, exercise.rest)}
                            disabled={activeTimer !== null}
                          >
                            <Timer className="w-4 h-4 mr-2" />
                            {activeTimer === index ? formatTime(timerSeconds) : `Start ${exercise.rest} Rest`}
                          </Button>
                          <Button 
                            variant={completedExercises.has(index) ? "outline" : "default"}
                            size="sm"
                            onClick={() => toggleExercise(index)}
                          >
                            {completedExercises.has(index) ? 'Mark Incomplete' : 'Mark Complete'}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Cool-down */}
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Play className="w-5 h-5 text-blue-400" />
                  Cool-down
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {workout.cooldown.map((item, index) => (
                  <div key={index} className="p-3 rounded-lg bg-secondary/50 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                    <Badge variant="outline">{item.duration}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Tips */}
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Zap className="w-5 h-5 text-yellow-400" />
                  Pro Tips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {workout.tips.map((tip, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                        {index + 1}
                      </span>
                      <span className="text-muted-foreground">{tip}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Complete Workout */}
            {progress === 100 && (
              <Card className="glass border-primary animate-fade-in">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <h3 className="font-display text-xl font-bold mb-2">Workout Complete!</h3>
                  <p className="text-muted-foreground mb-4">
                    Great job! You burned approximately {workout.calories_burn} calories.
                  </p>
                  <Button variant="gradient" onClick={() => router.push('/progress')}>
                    Log Your Progress
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}