"use client";

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Layout } from '@/components/layout/Layout';
import { PageHeader } from '@/components/PageHeader';
import { MealsSkeleton } from '@/components/skeletons';
import { Button } from '@dailylift/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@dailylift/ui/components/card';
import { Badge } from '@dailylift/ui/components/badge';
import { Progress } from '@dailylift/ui/components/progress';
import { useAuthStore } from '@/stores/authStore';
import { dailyCalorieTargetFromProfile } from '@/lib/fitness/calculations';
import { saveMealPlan, fetchLatestMealPlan } from '@/lib/db/meals';
import { toast } from 'sonner';
import {
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
  Check,
  Sunrise,
  Sun,
  Moon,
  Cookie,
  Utensils
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

export default function MealsPage() {
  return (
    <Suspense
      fallback={
        <Layout>
          <MealsSkeleton />
        </Layout>
      }
    >
      <Meals />
    </Suspense>
  );
}

function Meals() {
  const { user, profile, isLoading, isInitialized } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlMeal = searchParams.get('meal');

  const [generating, setGenerating] = useState(false);
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [completedMeals, setCompletedMeals] = useState<Set<number>>(new Set());
  const [expandedMeal, setExpandedMeal] = useState<number | null>(null);

  useEffect(() => {
    if (isInitialized && !isLoading && !user) {
      router.push('/auth');
    }
  }, [user, isLoading, isInitialized, router]);

  // Restore the last saved plan so a refresh doesn't lose it.
  useEffect(() => {
    if (!user) return;
    let alive = true;
    fetchLatestMealPlan()
      .then((plan) => {
        if (alive && plan) {
          setMealPlan(plan);
          if (urlMeal) {
            const idx = Number(urlMeal);
            if (!Number.isNaN(idx) && idx >= 0 && idx < plan.meals.length) {
              setExpandedMeal(idx);
            } else {
              const matchedIdx = plan.meals.findIndex(
                (m) => m.type.toLowerCase() === urlMeal.toLowerCase(),
              );
              if (matchedIdx !== -1) setExpandedMeal(matchedIdx);
            }
          }
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [user, urlMeal]);

  const handleExpandMeal = (index: number | null) => {
    setExpandedMeal(index);
    const params = new URLSearchParams(searchParams.toString());
    if (index === null || !mealPlan) {
      params.delete('meal');
    } else {
      params.set('meal', mealPlan.meals[index]?.type.toLowerCase() ?? String(index));
    }
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  // Shared with the server route so the displayed target matches what the AI
  // is asked to hit. Falls back to 2000 when biometrics are missing.
  const calculateDailyCalories = () =>
    dailyCalorieTargetFromProfile(profile ?? {}) ?? 2000;

  const generateMealPlan = async () => {
    if (!profile) return;

    setGenerating(true);
    try {
      const res = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'meal' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate meal plan');

      setMealPlan(data.plan);
      setCompletedMeals(new Set());
      // Persist so it survives refresh; upsert replaces today's plan only.
      saveMealPlan(data.plan).catch(() =>
        toast.error('Plan generated but could not be saved.'),
      );
      toast.success('Meal plan generated!');
    } catch (error) {
      console.error('Error generating meal plan:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to generate meal plan',
      );
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
      case 'breakfast': return Sunrise;
      case 'lunch': return Sun;
      case 'dinner': return Moon;
      case 'snack': return Cookie;
      default: return Utensils;
    }
  };

  const consumedCalories = mealPlan 
    ? mealPlan.meals.reduce((sum, meal, i) => completedMeals.has(i) ? sum + meal.calories : sum, 0)
    : 0;

  if (isLoading || !isInitialized) {
    return (
      <Layout>
        <MealsSkeleton />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <PageHeader
          title="Meal planner"
          subtitle="A personalized daily nutrition plan built around your goals and preferences."
        />

        {/* Generate Button */}
        {!mealPlan && (
          <Card className="mb-8">
            <CardContent className="p-8 text-center">
              <div className="w-14 h-14 rounded-xl bg-accent flex items-center justify-center mx-auto mb-5">
                <Apple className="w-7 h-7 text-primary" />
              </div>
              <h2 className="font-display text-xl font-bold mb-2">Generate today&apos;s meals</h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                We&apos;ll build a plan around your {profile?.fitness_goal?.replace('_', ' ')} goal,
                {' '}{profile?.dietary_preference?.replace('_', ' ')} preference, and {calculateDailyCalories()} cal target.
              </p>
              <Button
                size="xl"
                onClick={generateMealPlan}
                disabled={generating}
              >
                {generating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
                    Creating your plan…
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5 mr-2" />
                    Generate today&apos;s meals
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
            <Card className="overflow-hidden">
              <div className="p-6 bg-primary">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-xl font-bold text-primary-foreground">{mealPlan.title}</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={generateMealPlan}
                    disabled={generating}
                    className="text-primary-foreground hover:bg-primary-foreground/15"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Regenerate
                  </Button>
                </div>
                <div className="grid grid-cols-4 gap-4 text-primary-foreground">
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
                    onClick={() => handleExpandMeal(expandedMeal === index ? null : index)}
                  >
                    <div className="flex items-center gap-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleMeal(index);
                        }}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                          completedMeals.has(index)
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {(() => {
                          const MealIcon = getMealIcon(meal.type);
                          return completedMeals.has(index)
                            ? <Check className="w-5 h-5" />
                            : <MealIcon className="w-5 h-5" />;
                        })()}
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
                            <Clock className="w-4 h-4 text-primary" />
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
                      <span className="w-5 h-5 rounded-full bg-accent text-primary flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
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