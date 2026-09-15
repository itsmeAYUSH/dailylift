"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@dailylift/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@dailylift/ui/components/card';
import { Badge } from '@dailylift/ui/components/badge';
import { Progress } from '@dailylift/ui/components/progress';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import { 
  UtensilsCrossed, 
  Clock, 
  Flame, 
  Zap,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Droplets,
  Apple,
  Beef,
  Wheat,
  Check
} from 'lucide-react';

interface Meal {
  type: string;
  time: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: string[];
  instructions: string;
  prep_time: string;
}

interface MealPlan {
  title: string;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  meals: Meal[];
  hydration: string;
  tips: string[];
}

export default function Meals() {
  const { user, profile, isLoading, isInitialized } = useAuthStore();
  const router = useRouter();
  const [generating, setGenerating] = useState(false);
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [completedMeals, setCompletedMeals] = useState<Set<number>>(new Set());
  const [expandedMeal, setExpandedMeal] = useState<number | null>(null);

  useEffect(() => {
    if (isInitialized && !isLoading && !user) {
      router.push('/auth');
    }
  }, [user, isLoading, isInitialized, router]);

  const calculateDailyCalories = () => {
    if (!profile?.height_cm || !profile?.weight_kg) return 2000;
    
    const height = profile.height_cm / 100;
    const weight = profile.weight_kg;
    
    let bmr = 10 * weight + 6.25 * profile.height_cm - 5 * (profile.age || 25);
    bmr += profile.gender === 'male' ? 5 : -161;
    
    const activityMultiplier = 
      profile.workout_preference === 'gym' ? 1.55 :
      profile.workout_preference === 'outdoor' ? 1.725 :
      1.375;
    
    let dailyCalories = Math.round(bmr * activityMultiplier);
    
    // Adjust based on goal
    if (profile.fitness_goal === 'weight_loss') {
      dailyCalories -= 500; // 500 calorie deficit
    } else if (profile.fitness_goal === 'muscle_gain') {
      dailyCalories += 300; // 300 calorie surplus
    }
    
    return dailyCalories;
  };

  const generateMealPlan = async () => {
    if (!profile) return;
    
    setGenerating(true);
    try {
      const dailyCalories = calculateDailyCalories();
      
      const res = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'meal',
          profile: { ...profile, daily_calories: dailyCalories },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate meal plan');

      setMealPlan(data.plan);
      setCompletedMeals(new Set());
      toast.success('Meal plan generated!');
    } catch (error: any) {
      console.error('Error generating meal plan:', error);
      toast.error(error.message || 'Failed to generate meal plan');
    } finally {
      setGenerating(false);
    }
  };

  const toggleMeal = (index: number) => {
    const newCompleted = new Set(completedMeals);
    if (newCompleted.has(index)) {
      newCompleted.delete(index);
    } else {
      newCompleted.add(index);
    }
    setCompletedMeals(newCompleted);
  };

  const getMealIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'breakfast': return '🌅';
      case 'lunch': return '☀️';
      case 'dinner': return '🌙';
      case 'snack': return '🍎';
      default: return '🍽️';
    }
  };

  const consumedCalories = mealPlan 
    ? mealPlan.meals.reduce((sum, meal, i) => completedMeals.has(i) ? sum + meal.calories : sum, 0)
    : 0;

  if (isLoading || !isInitialized) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full gradient-accent animate-pulse mx-auto mb-4" />
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
            <div className="w-12 h-12 rounded-xl gradient-accent flex items-center justify-center">
              <UtensilsCrossed className="w-6 h-6 text-accent-foreground" />
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold">AI Meal Planner</h1>
              <p className="text-muted-foreground">Get a personalized nutrition plan for today</p>
            </div>
          </div>
        </div>

        {/* Generate Button */}
        {!mealPlan && (
          <Card className="glass mb-8 animate-fade-in-up">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 rounded-2xl gradient-accent flex items-center justify-center mx-auto mb-6">
                <Apple className="w-10 h-10 text-accent-foreground" />
              </div>
              <h2 className="font-display text-2xl font-bold mb-2">Ready to Eat Right?</h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Our AI will create a personalized meal plan based on your goal ({profile?.fitness_goal?.replace('_', ' ')}), 
                dietary preference ({profile?.dietary_preference?.replace('_', ' ')}), and calorie needs ({calculateDailyCalories()} cal).
              </p>
              <Button 
                variant="gradient-accent" 
                size="xl" 
                onClick={generateMealPlan}
                disabled={generating}
              >
                {generating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full animate-spin mr-2" />
                    Creating Your Meal Plan...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5 mr-2" />
                    Generate Today's Meals
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Meal Plan */}
        {mealPlan && (
          <div className="space-y-6 animate-fade-in-up">
            {/* Plan Header */}
            <Card className="glass overflow-hidden">
              <div className="p-6 gradient-accent">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-2xl font-bold text-accent-foreground">{mealPlan.title}</h2>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={generateMealPlan}
                    disabled={generating}
                    className="text-accent-foreground hover:bg-accent-foreground/20"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Regenerate
                  </Button>
                </div>
                <div className="grid grid-cols-4 gap-4 text-accent-foreground">
                  <div className="text-center">
                    <Flame className="w-5 h-5 mx-auto mb-1 opacity-80" />
                    <p className="text-2xl font-bold">{mealPlan.total_calories}</p>
                    <p className="text-xs opacity-80">Calories</p>
                  </div>
                  <div className="text-center">
                    <Beef className="w-5 h-5 mx-auto mb-1 opacity-80" />
                    <p className="text-2xl font-bold">{mealPlan.total_protein}g</p>
                    <p className="text-xs opacity-80">Protein</p>
                  </div>
                  <div className="text-center">
                    <Wheat className="w-5 h-5 mx-auto mb-1 opacity-80" />
                    <p className="text-2xl font-bold">{mealPlan.total_carbs}g</p>
                    <p className="text-xs opacity-80">Carbs</p>
                  </div>
                  <div className="text-center">
                    <Droplets className="w-5 h-5 mx-auto mb-1 opacity-80" />
                    <p className="text-2xl font-bold">{mealPlan.total_fat}g</p>
                    <p className="text-xs opacity-80">Fat</p>
                  </div>
                </div>
              </div>
              
              {/* Calorie Progress */}
              <div className="p-4 bg-secondary/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Calories Consumed</span>
                  <span className="text-sm text-muted-foreground">
                    {consumedCalories}/{mealPlan.total_calories} cal
                  </span>
                </div>
                <Progress value={(consumedCalories / mealPlan.total_calories) * 100} className="h-2" />
              </div>
            </Card>

            {/* Hydration Reminder */}
            <Card className="glass border-blue-500/20">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <Droplets className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-medium">Daily Hydration</h3>
                  <p className="text-sm text-muted-foreground">{mealPlan.hydration}</p>
                </div>
              </CardContent>
            </Card>

            {/* Meals */}
            <div className="space-y-4">
              {mealPlan.meals.map((meal, index) => (
                <Card 
                  key={index} 
                  className={`glass overflow-hidden transition-all ${
                    completedMeals.has(index) ? 'border-primary/30' : ''
                  }`}
                >
                  <div 
                    className="p-4 cursor-pointer"
                    onClick={() => setExpandedMeal(expandedMeal === index ? null : index)}
                  >
                    <div className="flex items-center gap-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleMeal(index);
                        }}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all text-xl ${
                          completedMeals.has(index)
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary hover:bg-primary/20'
                        }`}
                      >
                        {completedMeals.has(index) ? <Check className="w-5 h-5" /> : getMealIcon(meal.type)}
                      </button>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {meal.type}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{meal.time}</span>
                        </div>
                        <p className={`font-medium ${completedMeals.has(index) ? 'line-through opacity-60' : ''}`}>
                          {meal.name}
                        </p>
                      </div>
                      
                      <div className="text-right hidden sm:block">
                        <p className="font-bold text-primary">{meal.calories} cal</p>
                        <p className="text-xs text-muted-foreground">
                          P: {meal.protein}g • C: {meal.carbs}g • F: {meal.fat}g
                        </p>
                      </div>
                      
                      {expandedMeal === index ? (
                        <ChevronUp className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                  
                  {expandedMeal === index && (
                    <div className="px-4 pb-4 pt-2 border-t border-border/50">
                      <div className="grid md:grid-cols-2 gap-4">
                        {/* Macros on mobile */}
                        <div className="sm:hidden grid grid-cols-4 gap-2 p-3 rounded-lg bg-secondary/50 mb-2">
                          <div className="text-center">
                            <p className="text-lg font-bold text-primary">{meal.calories}</p>
                            <p className="text-xs text-muted-foreground">cal</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-bold">{meal.protein}g</p>
                            <p className="text-xs text-muted-foreground">protein</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-bold">{meal.carbs}g</p>
                            <p className="text-xs text-muted-foreground">carbs</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-bold">{meal.fat}g</p>
                            <p className="text-xs text-muted-foreground">fat</p>
                          </div>
                        </div>
                        
                        {/* Ingredients */}
                        <div>
                          <h4 className="font-medium mb-2 flex items-center gap-2">
                            <Apple className="w-4 h-4 text-primary" />
                            Ingredients
                          </h4>
                          <ul className="space-y-1">
                            {meal.ingredients.map((ingredient, i) => (
                              <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                                {ingredient}
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        {/* Instructions */}
                        <div>
                          <h4 className="font-medium mb-2 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-accent" />
                            Instructions ({meal.prep_time})
                          </h4>
                          <p className="text-sm text-muted-foreground">{meal.instructions}</p>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex gap-2">
                        <Button 
                          variant={completedMeals.has(index) ? "outline" : "default"}
                          size="sm"
                          onClick={() => toggleMeal(index)}
                        >
                          {completedMeals.has(index) ? 'Mark Uneaten' : 'Mark as Eaten'}
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>

            {/* Tips */}
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Zap className="w-5 h-5 text-yellow-400" />
                  Nutrition Tips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {mealPlan.tips.map((tip, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-accent/20 text-accent flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                        {index + 1}
                      </span>
                      <span className="text-muted-foreground">{tip}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
}