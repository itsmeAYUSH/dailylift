import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/integrations/supabase/client';
import { 
  Activity, 
  Dumbbell, 
  UtensilsCrossed, 
  TrendingUp,
  Target,
  Flame,
  Clock,
  ChevronRight,
  Zap,
  Scale,
  Ruler,
  Brain
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
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    if (isInitialized && !isLoading && !user) {
      navigate('/auth');
    }
  }, [user, isLoading, isInitialized, navigate]);

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
              <div className="w-16 h-16 rounded-full gradient-primary animate-pulse mx-auto mb-4" />
              <p className="text-muted-foreground">Loading your dashboard...</p>
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
            <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center mb-6">
              <Activity className="w-10 h-10 text-primary-foreground" />
            </div>
            <h1 className="font-display text-3xl font-bold mb-4">Complete Your Profile</h1>
            <p className="text-muted-foreground mb-8 max-w-md">
              Let's set up your profile to get personalized workout and meal recommendations.
            </p>
            <Link to="/onboarding">
              <Button variant="gradient" size="lg">
                Start Setup
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const quickActions = [
    { 
      title: 'Generate Workout', 
      description: 'AI-powered weekly plan',
      icon: Dumbbell, 
      href: '/workouts',
      color: 'from-emerald-500 to-teal-500'
    },
    { 
      title: 'Create Meal Plan', 
      description: 'Daily nutrition guide',
      icon: UtensilsCrossed, 
      href: '/meals',
      color: 'from-orange-500 to-amber-500'
    },
    { 
      title: 'Log Progress', 
      description: 'Track your journey',
      icon: TrendingUp, 
      href: '/progress',
      color: 'from-violet-500 to-purple-500'
    },
    { 
      title: 'Health Tools', 
      description: 'BMI, BMR & more',
      icon: Target, 
      href: '/calculators',
      color: 'from-pink-500 to-rose-500'
    },
  ];

  const getBmiColor = (bmi: number) => {
    if (bmi < 18.5) return 'text-blue-400';
    if (bmi < 25) return 'text-primary';
    if (bmi < 30) return 'text-yellow-400';
    return 'text-destructive';
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8 animate-fade-in">
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
            Welcome back, <span className="text-gradient">{profile?.full_name?.split(' ')[0] || 'Champion'}</span>
          </h1>
          <p className="text-muted-foreground">
            Ready to crush your {profile?.fitness_goal?.replace('_', ' ')} goals today?
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {quickActions.map((action, index) => (
            <Link 
              key={action.title} 
              to={action.href}
              className="group animate-fade-in-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <Card className="h-full glass hover:bg-card/90 transition-all hover:scale-[1.02] cursor-pointer">
                <CardContent className="p-4 md:p-6">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${action.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <action.icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <h3 className="font-display font-semibold mb-1">{action.title}</h3>
                  <p className="text-sm text-muted-foreground">{action.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* BMI Card */}
          <Card className="glass animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
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

          {/* BMR Card */}
          <Card className="glass animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Flame className="w-4 h-4" />
                BMR
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-display font-bold text-gradient">
                {stats?.bmr || '--'}
              </div>
              <p className="text-sm text-muted-foreground">calories/day at rest</p>
            </CardContent>
          </Card>

          {/* Daily Calories Card */}
          <Card className="glass animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Daily Target
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-display font-bold text-gradient-accent">
                {stats?.dailyCalories || '--'}
              </div>
              <p className="text-sm text-muted-foreground">calories to consume</p>
            </CardContent>
          </Card>

          {/* Ideal Weight Card */}
          <Card className="glass animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Ruler className="w-4 h-4" />
                Ideal Weight
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-display font-bold">
                {stats ? `${stats.idealWeight.min}-${stats.idealWeight.max}` : '--'}
              </div>
              <p className="text-sm text-muted-foreground">kg (healthy BMI range)</p>
            </CardContent>
          </Card>
        </div>

        {/* Profile Summary */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Current Stats */}
          <Card className="glass animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Your Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-secondary/50">
                  <p className="text-sm text-muted-foreground">Height</p>
                  <p className="font-display font-semibold">{profile?.height_cm} cm</p>
                </div>
                <div className="p-3 rounded-lg bg-secondary/50">
                  <p className="text-sm text-muted-foreground">Weight</p>
                  <p className="font-display font-semibold">{profile?.weight_kg} kg</p>
                </div>
                <div className="p-3 rounded-lg bg-secondary/50">
                  <p className="text-sm text-muted-foreground">Goal</p>
                  <p className="font-display font-semibold capitalize">{profile?.fitness_goal?.replace('_', ' ')}</p>
                </div>
                <div className="p-3 rounded-lg bg-secondary/50">
                  <p className="text-sm text-muted-foreground">Level</p>
                  <p className="font-display font-semibold capitalize">{profile?.fitness_level}</p>
                </div>
              </div>
              <Link to="/profile">
                <Button variant="outline" className="w-full mt-4">
                  Edit Profile
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* AI Suggestions */}
          <Card className="glass animate-fade-in-up" style={{ animationDelay: '0.35s' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-accent" />
                AI Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
                    <Dumbbell className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Today's Focus: Upper Body</h4>
                    <p className="text-sm text-muted-foreground">Based on your {profile?.workout_preference} preference and {profile?.available_time_minutes} min availability</p>
                  </div>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-r from-accent/10 to-accent/5 border border-accent/20">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg gradient-accent flex items-center justify-center flex-shrink-0">
                    <UtensilsCrossed className="w-5 h-5 text-accent-foreground" />
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Nutrition Tip</h4>
                    <p className="text-sm text-muted-foreground">
                      {profile?.fitness_goal === 'weight_loss' 
                        ? 'Focus on high protein meals to maintain muscle while cutting'
                        : profile?.fitness_goal === 'muscle_gain'
                          ? 'Ensure you hit your protein target of 1.6-2.2g per kg bodyweight'
                          : 'Balance your macros for optimal energy throughout the day'
                      }
                    </p>
                  </div>
                </div>
              </div>
              <Link to="/workouts">
                <Button variant="gradient" className="w-full">
                  Generate Today's Plan
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
