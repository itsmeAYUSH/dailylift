"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@dailylift/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@dailylift/ui/components/card';
import { Progress } from '@dailylift/ui/components/progress';
import { useAuthStore } from '@/stores/authStore';
import {
  Dumbbell,
  UtensilsCrossed,
  TrendingUp,
  Target,
  Flame,
  ChevronRight,
  Zap,
  Scale,
  Ruler,
  ArrowRight,
} from 'lucide-react';

interface DashboardStats {
  bmi: number;
  bmiCategory: string;
  bmr: number;
  dailyCalories: number;
  idealWeight: { min: number; max: number };
  workoutsThisWeek: number;
  mealsFollowed: number;
}

export default function Dashboard() {
  const { user, profile, isLoading, isInitialized } = useAuthStore();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    if (isInitialized && !isLoading && !user) {
      router.push('/auth');
    }
  }, [user, isLoading, isInitialized, router]);

  useEffect(() => {
    if (profile && profile.height_cm && profile.weight_kg) {
      const height = profile.height_cm / 100;
      const weight = profile.weight_kg;
      const bmi = weight / (height * height);

      let bmiCategory = 'Normal';
      if (bmi < 18.5) bmiCategory = 'Underweight';
      else if (bmi >= 25 && bmi < 30) bmiCategory = 'Overweight';
      else if (bmi >= 30) bmiCategory = 'Obese';

      // BMR calculation (Mifflin-St Jeor)
      let bmr = 10 * weight + 6.25 * profile.height_cm - 5 * (profile.age || 25);
      bmr += profile.gender === 'male' ? 5 : -161;

      // Activity multiplier based on workout preference
      const activityMultiplier =
        profile.workout_preference === 'gym' ? 1.55 :
        profile.workout_preference === 'outdoor' ? 1.725 :
        1.375;

      const dailyCalories = Math.round(bmr * activityMultiplier);

      // Ideal weight range (BMI 18.5-24.9)
      const idealWeight = {
        min: Math.round(18.5 * height * height),
        max: Math.round(24.9 * height * height),
      };

      setStats({
        bmi: parseFloat(bmi.toFixed(1)),
        bmiCategory,
        bmr: Math.round(bmr),
        dailyCalories,
        idealWeight,
        workoutsThisWeek: 0,
        mealsFollowed: 0,
      });
    }
  }, [profile]);

  if (isLoading || !isInitialized) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="w-8 h-8 rounded-full border-2 border-muted border-t-primary animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading your dashboard…</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!profile?.onboarding_completed) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="w-14 h-14 rounded-xl bg-accent flex items-center justify-center mb-6">
              <Target className="w-7 h-7 text-primary" />
            </div>
            <h1 className="font-display text-2xl font-bold mb-3">Complete your profile</h1>
            <p className="text-muted-foreground mb-8 max-w-md">
              Set up a few details so we can tailor your workout and meal plans.
            </p>
            <Link href="/onboarding">
              <Button size="lg">
                Start setup
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const quickActions = [
    { title: 'Generate workout', description: 'Personalized daily plan', icon: Dumbbell, href: '/workouts' },
    { title: 'Create meal plan', description: 'Daily nutrition guide', icon: UtensilsCrossed, href: '/meals' },
    { title: 'Log progress', description: 'Track your journey', icon: TrendingUp, href: '/progress' },
    { title: 'Health tools', description: 'BMI, BMR & more', icon: Target, href: '/calculators' },
  ];

  const getBmiColor = (bmi: number) => {
    if (bmi < 18.5) return 'text-blue-500';
    if (bmi < 25) return 'text-[hsl(var(--success))]';
    if (bmi < 30) return 'text-[hsl(var(--warning))]';
    return 'text-destructive';
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="font-display text-2xl md:text-3xl font-bold mb-1">
            Welcome back, {profile?.full_name?.split(' ')[0] || 'there'}
          </h1>
          <p className="text-muted-foreground capitalize">
            Your {profile?.fitness_goal?.replace('_', ' ')} plan at a glance
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {quickActions.map((action) => (
            <Link key={action.title} href={action.href} className="group">
              <Card className="h-full transition-colors hover:border-primary/40">
                <CardContent className="p-5">
                  <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center mb-4">
                    <action.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-display font-semibold mb-0.5 flex items-center gap-1">
                    {action.title}
                    <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </h3>
                  <p className="text-sm text-muted-foreground">{action.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Scale className="w-4 h-4" />
                BMI
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-display font-bold ${stats ? getBmiColor(stats.bmi) : ''}`}>
                {stats?.bmi || '--'}
              </div>
              <p className="text-sm text-muted-foreground">{stats?.bmiCategory || 'Calculate'}</p>
              <Progress
                value={stats ? Math.min((stats.bmi / 40) * 100, 100) : 0}
                className="mt-2 h-1.5"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Flame className="w-4 h-4" />
                BMR
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-display font-bold">
                {stats?.bmr || '--'}
              </div>
              <p className="text-sm text-muted-foreground">calories/day at rest</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Daily target
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-display font-bold text-primary">
                {stats?.dailyCalories || '--'}
              </div>
              <p className="text-sm text-muted-foreground">calories to consume</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Ruler className="w-4 h-4" />
                Ideal weight
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-display font-bold">
                {stats ? `${stats.idealWeight.min}–${stats.idealWeight.max}` : '--'}
              </div>
              <p className="text-sm text-muted-foreground">kg (healthy range)</p>
            </CardContent>
          </Card>
        </div>

        {/* Profile + Recommendations */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Your profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-secondary">
                  <p className="text-sm text-muted-foreground">Height</p>
                  <p className="font-display font-semibold">{profile?.height_cm} cm</p>
                </div>
                <div className="p-3 rounded-lg bg-secondary">
                  <p className="text-sm text-muted-foreground">Weight</p>
                  <p className="font-display font-semibold">{profile?.weight_kg} kg</p>
                </div>
                <div className="p-3 rounded-lg bg-secondary">
                  <p className="text-sm text-muted-foreground">Goal</p>
                  <p className="font-display font-semibold capitalize">{profile?.fitness_goal?.replace('_', ' ')}</p>
                </div>
                <div className="p-3 rounded-lg bg-secondary">
                  <p className="text-sm text-muted-foreground">Level</p>
                  <p className="font-display font-semibold capitalize">{profile?.fitness_level}</p>
                </div>
              </div>
              <Link href="/profile">
                <Button variant="outline" className="w-full">
                  Edit profile
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Suggestions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-4 rounded-lg bg-secondary flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
                  <Dumbbell className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium mb-0.5">Today's focus: upper body</h4>
                  <p className="text-sm text-muted-foreground">
                    Based on your {profile?.workout_preference} preference and {profile?.available_time_minutes} min availability.
                  </p>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-secondary flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
                  <UtensilsCrossed className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium mb-0.5">Nutrition tip</h4>
                  <p className="text-sm text-muted-foreground">
                    {profile?.fitness_goal === 'weight_loss'
                      ? 'Prioritize high-protein meals to maintain muscle while in a deficit.'
                      : profile?.fitness_goal === 'muscle_gain'
                        ? 'Aim for 1.6–2.2 g of protein per kg of bodyweight each day.'
                        : 'Balance your macros for steady energy throughout the day.'}
                  </p>
                </div>
              </div>
              <Link href="/workouts">
                <Button className="w-full">
                  Generate today's plan
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
