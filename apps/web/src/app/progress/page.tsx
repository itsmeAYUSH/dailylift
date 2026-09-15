"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@dailylift/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@dailylift/ui/components/card';
import { Input } from '@dailylift/ui/components/input';
import { Label } from '@dailylift/ui/components/label';
import { Textarea } from '@dailylift/ui/components/textarea';
import { Switch } from '@dailylift/ui/components/switch';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/supabase/client';
import { toast } from 'sonner';
import { format, subDays, parseISO } from 'date-fns';
import { 
  TrendingUp, 
  Scale, 
  Dumbbell, 
  UtensilsCrossed,
  Calendar,
  Plus,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Target,
  Flame
} from 'lucide-react';

interface ProgressLog {
  id: string;
  log_date: string;
  weight_kg: number | null;
  workout_completed: boolean | null;
  meals_followed: boolean | null;
  notes: string | null;
  created_at: string | null;
}

export default function Progress() {
  const { user, profile, isLoading, isInitialized } = useAuthStore();
  const router = useRouter();
  const [logs, setLogs] = useState<ProgressLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Form state
  const [weight, setWeight] = useState('');
  const [workoutCompleted, setWorkoutCompleted] = useState(false);
  const [mealsFollowed, setMealsFollowed] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isInitialized && !isLoading && !user) {
      router.push('/auth');
    }
  }, [user, isLoading, isInitialized, router]);

  useEffect(() => {
    if (user) {
      fetchLogs();
    }
  }, [user]);

  useEffect(() => {
    // Load existing log for selected date
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const existingLog = logs.find(log => log.log_date === dateStr);
    
    if (existingLog) {
      setWeight(existingLog.weight_kg?.toString() || '');
      setWorkoutCompleted(!!existingLog.workout_completed);
      setMealsFollowed(!!existingLog.meals_followed);
      setNotes(existingLog.notes || '');
    } else {
      setWeight(profile?.weight_kg?.toString() || '');
      setWorkoutCompleted(false);
      setMealsFollowed(false);
      setNotes('');
    }
  }, [selectedDate, logs, profile]);

  const fetchLogs = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('progress_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('log_date', { ascending: false })
        .limit(30);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching logs:', error);
      toast.error('Failed to load progress logs');
    } finally {
      setLoading(false);
    }
  };

  const saveLog = async () => {
    if (!user) return;
    
    setSaving(true);
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const existingLog = logs.find(log => log.log_date === dateStr);
    
    try {
      const logData = {
        user_id: user.id,
        log_date: dateStr,
        weight_kg: weight ? parseFloat(weight) : null,
        workout_completed: workoutCompleted,
        meals_followed: mealsFollowed,
        notes: notes || null,
      };

      if (existingLog) {
        const { error } = await supabase
          .from('progress_logs')
          .update(logData)
          .eq('id', existingLog.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('progress_logs')
          .insert(logData);
        
        if (error) throw error;
      }

      toast.success('Progress saved!');
      fetchLogs();
    } catch (error) {
      console.error('Error saving log:', error);
      toast.error('Failed to save progress');
    } finally {
      setSaving(false);
    }
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = direction === 'prev' 
      ? subDays(selectedDate, 1)
      : new Date(selectedDate.getTime() + 24 * 60 * 60 * 1000);
    
    if (newDate <= new Date()) {
      setSelectedDate(newDate);
    }
  };

  const getStreakCount = () => {
    let streak = 0;
    const sortedLogs = [...logs].sort((a, b) => 
      new Date(b.log_date).getTime() - new Date(a.log_date).getTime()
    );
    
    for (const log of sortedLogs) {
      if (log.workout_completed || log.meals_followed) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  const getWeightChange = () => {
    const logsWithWeight = logs.filter(log => log.weight_kg);
    if (logsWithWeight.length < 2) return null;
    
    const latest = logsWithWeight[0].weight_kg!;
    const oldest = logsWithWeight[logsWithWeight.length - 1].weight_kg!;
    return latest - oldest;
  };

  const isToday = format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const hasLogForDate = logs.some(log => log.log_date === dateStr);

  if (isLoading || !isInitialized || loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-violet-500 animate-pulse mx-auto mb-4" />
              <p className="text-muted-foreground">Loading...</p>
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
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold">Progress Tracker</h1>
              <p className="text-muted-foreground">Log your daily fitness journey</p>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="glass">
            <CardContent className="p-4 text-center">
              <Flame className="w-6 h-6 text-orange-400 mx-auto mb-2" />
              <p className="text-2xl font-bold">{getStreakCount()}</p>
              <p className="text-xs text-muted-foreground">Day Streak</p>
            </CardContent>
          </Card>
          
          <Card className="glass">
            <CardContent className="p-4 text-center">
              <Dumbbell className="w-6 h-6 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold">
                {logs.filter(l => l.workout_completed).length}
              </p>
              <p className="text-xs text-muted-foreground">Workouts</p>
            </CardContent>
          </Card>
          
          <Card className="glass">
            <CardContent className="p-4 text-center">
              <UtensilsCrossed className="w-6 h-6 text-accent mx-auto mb-2" />
              <p className="text-2xl font-bold">
                {logs.filter(l => l.meals_followed).length}
              </p>
              <p className="text-xs text-muted-foreground">Meals Followed</p>
            </CardContent>
          </Card>
          
          <Card className="glass">
            <CardContent className="p-4 text-center">
              <Scale className="w-6 h-6 text-blue-400 mx-auto mb-2" />
              <p className={`text-2xl font-bold ${
                getWeightChange() !== null 
                  ? getWeightChange()! < 0 
                    ? 'text-green-400' 
                    : getWeightChange()! > 0 
                      ? 'text-red-400' 
                      : ''
                  : ''
              }`}>
                {getWeightChange() !== null 
                  ? `${getWeightChange()! > 0 ? '+' : ''}${getWeightChange()!.toFixed(1)}kg`
                  : '--'
                }
              </p>
              <p className="text-xs text-muted-foreground">Weight Change</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Log Entry Form */}
          <Card className="glass">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Log Progress
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => navigateDate('prev')}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm font-medium min-w-[100px] text-center">
                    {isToday ? 'Today' : format(selectedDate, 'MMM d, yyyy')}
                  </span>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => navigateDate('next')}
                    disabled={isToday}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Weight */}
              <div className="space-y-2">
                <Label htmlFor="weight" className="flex items-center gap-2">
                  <Scale className="w-4 h-4" />
                  Weight (kg)
                </Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  placeholder="Enter your weight"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="bg-secondary/50"
                />
              </div>

              {/* Workout Completed */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                <div className="flex items-center gap-3">
                  <Dumbbell className="w-5 h-5 text-primary" />
                  <div>
                    <Label htmlFor="workout">Workout Completed</Label>
                    <p className="text-xs text-muted-foreground">Did you complete your workout?</p>
                  </div>
                </div>
                <Switch
                  id="workout"
                  checked={workoutCompleted}
                  onCheckedChange={setWorkoutCompleted}
                />
              </div>

              {/* Meals Followed */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                <div className="flex items-center gap-3">
                  <UtensilsCrossed className="w-5 h-5 text-accent" />
                  <div>
                    <Label htmlFor="meals">Followed Meal Plan</Label>
                    <p className="text-xs text-muted-foreground">Did you follow your nutrition plan?</p>
                  </div>
                </div>
                <Switch
                  id="meals"
                  checked={mealsFollowed}
                  onCheckedChange={setMealsFollowed}
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="How did you feel today? Any challenges or wins?"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="bg-secondary/50 min-h-[100px]"
                />
              </div>

              <Button 
                onClick={saveLog} 
                disabled={saving}
                className="w-full"
                variant="gradient"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    {hasLogForDate ? 'Update Progress' : 'Save Progress'}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Recent Logs */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-violet-400" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {logs.length === 0 ? (
                <div className="text-center py-8">
                  <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No progress logs yet</p>
                  <p className="text-sm text-muted-foreground">Start logging to see your journey!</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                  {logs.slice(0, 10).map((log) => (
                    <div 
                      key={log.id}
                      className={`p-4 rounded-lg border transition-all cursor-pointer hover:bg-secondary/50 ${
                        log.log_date === dateStr ? 'border-primary bg-primary/5' : 'border-transparent bg-secondary/30'
                      }`}
                      onClick={() => setSelectedDate(parseISO(log.log_date))}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">
                          {format(parseISO(log.log_date), 'EEEE, MMM d')}
                        </span>
                        {log.weight_kg && (
                          <span className="text-sm text-muted-foreground">
                            {log.weight_kg} kg
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1 text-sm">
                          {log.workout_completed ? (
                            <CheckCircle2 className="w-4 h-4 text-primary" />
                          ) : (
                            <XCircle className="w-4 h-4 text-muted-foreground" />
                          )}
                          <span className={log.workout_completed ? 'text-primary' : 'text-muted-foreground'}>
                            Workout
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-sm">
                          {log.meals_followed ? (
                            <CheckCircle2 className="w-4 h-4 text-accent" />
                          ) : (
                            <XCircle className="w-4 h-4 text-muted-foreground" />
                          )}
                          <span className={log.meals_followed ? 'text-accent' : 'text-muted-foreground'}>
                            Meals
                          </span>
                        </div>
                      </div>
                      {log.notes && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                          {log.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}