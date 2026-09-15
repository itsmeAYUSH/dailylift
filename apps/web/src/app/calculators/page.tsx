"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@dailylift/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@dailylift/ui/components/card';
import { Input } from '@dailylift/ui/components/input';
import { Label } from '@dailylift/ui/components/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@dailylift/ui/components/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@dailylift/ui/components/select';
import { Progress } from '@dailylift/ui/components/progress';
import { useAuthStore } from '@/stores/authStore';
import { 
  Calculator, 
  Scale, 
  Flame, 
  Target,
  Activity,
  Droplets,
  Heart,
  Zap
} from 'lucide-react';

export default function Calculators() {
  const { user, profile, isLoading, isInitialized } = useAuthStore();
  const router = useRouter();
  
  // BMI Calculator
  const [bmiHeight, setBmiHeight] = useState(profile?.height_cm?.toString() || '');
  const [bmiWeight, setBmiWeight] = useState(profile?.weight_kg?.toString() || '');
  const [bmiResult, setBmiResult] = useState<{ value: number; category: string; color: string } | null>(null);
  
  // BMR Calculator
  const [bmrAge, setBmrAge] = useState(profile?.age?.toString() || '');
  const [bmrGender, setBmrGender] = useState(profile?.gender || 'male');
  const [bmrHeight, setBmrHeight] = useState(profile?.height_cm?.toString() || '');
  const [bmrWeight, setBmrWeight] = useState(profile?.weight_kg?.toString() || '');
  const [bmrResult, setBmrResult] = useState<number | null>(null);
  
  // Calorie Calculator
  const [calActivity, setCalActivity] = useState('moderate');
  const [calGoal, setCalGoal] = useState<string>(profile?.fitness_goal || 'general_fitness');
  const [calorieResult, setCalorieResult] = useState<{ maintain: number; goal: number; label: string } | null>(null);
  
  // Body Fat Calculator
  const [bfWaist, setBfWaist] = useState('');
  const [bfNeck, setBfNeck] = useState('');
  const [bfHip, setBfHip] = useState('');
  const [bfHeight, setBfHeight] = useState(profile?.height_cm?.toString() || '');
  const [bfGender, setBfGender] = useState(profile?.gender || 'male');
  const [bfResult, setBfResult] = useState<{ percentage: number; category: string } | null>(null);
  
  // Water Intake
  const [waterWeight, setWaterWeight] = useState(profile?.weight_kg?.toString() || '');
  const [waterActivity, setWaterActivity] = useState('moderate');
  const [waterResult, setWaterResult] = useState<number | null>(null);

  useEffect(() => {
    if (isInitialized && !isLoading && !user) {
      router.push('/auth');
    }
  }, [user, isLoading, isInitialized, router]);

  useEffect(() => {
    if (profile) {
      setBmiHeight(profile.height_cm?.toString() || '');
      setBmiWeight(profile.weight_kg?.toString() || '');
      setBmrAge(profile.age?.toString() || '');
      setBmrGender(profile.gender || 'male');
      setBmrHeight(profile.height_cm?.toString() || '');
      setBmrWeight(profile.weight_kg?.toString() || '');
      setBfHeight(profile.height_cm?.toString() || '');
      setBfGender(profile.gender || 'male');
      setWaterWeight(profile.weight_kg?.toString() || '');
      setCalGoal(profile.fitness_goal || 'general_fitness');
    }
  }, [profile]);

  const calculateBMI = () => {
    const height = parseFloat(bmiHeight) / 100;
    const weight = parseFloat(bmiWeight);
    
    if (height && weight) {
      const bmi = weight / (height * height);
      let category = 'Normal';
      let color = 'text-primary';
      
      if (bmi < 18.5) {
        category = 'Underweight';
        color = 'text-blue-400';
      } else if (bmi >= 25 && bmi < 30) {
        category = 'Overweight';
        color = 'text-yellow-400';
      } else if (bmi >= 30) {
        category = 'Obese';
        color = 'text-destructive';
      }
      
      setBmiResult({ value: parseFloat(bmi.toFixed(1)), category, color });
    }
  };

  const calculateBMR = () => {
    const age = parseFloat(bmrAge);
    const height = parseFloat(bmrHeight);
    const weight = parseFloat(bmrWeight);
    
    if (age && height && weight) {
      // Mifflin-St Jeor Equation
      let bmr = 10 * weight + 6.25 * height - 5 * age;
      bmr += bmrGender === 'male' ? 5 : -161;
      setBmrResult(Math.round(bmr));
    }
  };

  const calculateCalories = () => {
    if (!bmrResult) {
      calculateBMR();
    }
    
    const bmr = bmrResult || 1800;
    const activityMultipliers: Record<string, number> = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9,
    };
    
    const maintain = Math.round(bmr * activityMultipliers[calActivity]);
    let goal = maintain;
    let label = 'Maintenance';
    
    switch (calGoal) {
      case 'weight_loss':
        goal = maintain - 500;
        label = 'For Weight Loss';
        break;
      case 'muscle_gain':
        goal = maintain + 300;
        label = 'For Muscle Gain';
        break;
      case 'endurance':
        goal = maintain + 200;
        label = 'For Endurance';
        break;
    }
    
    setCalorieResult({ maintain, goal, label });
  };

  const calculateBodyFat = () => {
    const waist = parseFloat(bfWaist);
    const neck = parseFloat(bfNeck);
    const height = parseFloat(bfHeight);
    const hip = parseFloat(bfHip);
    
    if (waist && neck && height) {
      let bf: number;
      
      if (bfGender === 'male') {
        bf = 495 / (1.0324 - 0.19077 * Math.log10(waist - neck) + 0.15456 * Math.log10(height)) - 450;
      } else {
        if (!hip) return;
        bf = 495 / (1.29579 - 0.35004 * Math.log10(waist + hip - neck) + 0.22100 * Math.log10(height)) - 450;
      }
      
      let category = 'Average';
      if (bfGender === 'male') {
        if (bf < 6) category = 'Essential';
        else if (bf < 14) category = 'Athletic';
        else if (bf < 18) category = 'Fitness';
        else if (bf < 25) category = 'Average';
        else category = 'Obese';
      } else {
        if (bf < 14) category = 'Essential';
        else if (bf < 21) category = 'Athletic';
        else if (bf < 25) category = 'Fitness';
        else if (bf < 32) category = 'Average';
        else category = 'Obese';
      }
      
      setBfResult({ percentage: parseFloat(bf.toFixed(1)), category });
    }
  };

  const calculateWater = () => {
    const weight = parseFloat(waterWeight);
    
    if (weight) {
      const baseWater = weight * 0.033;
      const activityMultipliers: Record<string, number> = {
        sedentary: 1,
        moderate: 1.2,
        active: 1.4,
      };
      
      const water = baseWater * activityMultipliers[waterActivity];
      setWaterResult(parseFloat(water.toFixed(1)));
    }
  };

  if (isLoading || !isInitialized) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-pink-500 animate-pulse mx-auto mb-4" />
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
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center">
              <Calculator className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold">Health Tools</h1>
              <p className="text-muted-foreground">Calculate your fitness metrics</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="bmi" className="space-y-6">
          <TabsList className="grid grid-cols-5 w-full bg-secondary/50 p-1">
            <TabsTrigger value="bmi" className="text-xs sm:text-sm">BMI</TabsTrigger>
            <TabsTrigger value="bmr" className="text-xs sm:text-sm">BMR</TabsTrigger>
            <TabsTrigger value="calories" className="text-xs sm:text-sm">Calories</TabsTrigger>
            <TabsTrigger value="bodyfat" className="text-xs sm:text-sm">Body Fat</TabsTrigger>
            <TabsTrigger value="water" className="text-xs sm:text-sm">Water</TabsTrigger>
          </TabsList>

          {/* BMI Calculator */}
          <TabsContent value="bmi">
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scale className="w-5 h-5 text-primary" />
                  Body Mass Index (BMI)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Height (cm)</Label>
                    <Input
                      type="number"
                      value={bmiHeight}
                      onChange={(e) => setBmiHeight(e.target.value)}
                      placeholder="170"
                      className="bg-secondary/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Weight (kg)</Label>
                    <Input
                      type="number"
                      value={bmiWeight}
                      onChange={(e) => setBmiWeight(e.target.value)}
                      placeholder="70"
                      className="bg-secondary/50"
                    />
                  </div>
                </div>
                
                <Button onClick={calculateBMI} variant="gradient" className="w-full">
                  Calculate BMI
                </Button>
                
                {bmiResult && (
                  <div className="p-6 rounded-xl bg-secondary/50 text-center animate-fade-in">
                    <p className={`text-5xl font-bold font-display ${bmiResult.color}`}>
                      {bmiResult.value}
                    </p>
                    <p className="text-lg text-muted-foreground mt-2">{bmiResult.category}</p>
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Underweight</span>
                        <span>Normal</span>
                        <span>Overweight</span>
                        <span>Obese</span>
                      </div>
                      <div className="h-3 rounded-full overflow-hidden flex">
                        <div className="bg-blue-400 flex-1" />
                        <div className="bg-primary flex-1" />
                        <div className="bg-yellow-400 flex-1" />
                        <div className="bg-destructive flex-1" />
                      </div>
                      <div className="relative h-4">
                        <div 
                          className="absolute w-3 h-3 bg-foreground rounded-full transform -translate-x-1/2"
                          style={{ left: `${Math.min(Math.max((bmiResult.value - 15) / 25 * 100, 0), 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* BMR Calculator */}
          <TabsContent value="bmr">
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-400" />
                  Basal Metabolic Rate (BMR)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Age</Label>
                    <Input
                      type="number"
                      value={bmrAge}
                      onChange={(e) => setBmrAge(e.target.value)}
                      placeholder="25"
                      className="bg-secondary/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Gender</Label>
                    <Select value={bmrGender} onValueChange={setBmrGender}>
                      <SelectTrigger className="bg-secondary/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Height (cm)</Label>
                    <Input
                      type="number"
                      value={bmrHeight}
                      onChange={(e) => setBmrHeight(e.target.value)}
                      placeholder="170"
                      className="bg-secondary/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Weight (kg)</Label>
                    <Input
                      type="number"
                      value={bmrWeight}
                      onChange={(e) => setBmrWeight(e.target.value)}
                      placeholder="70"
                      className="bg-secondary/50"
                    />
                  </div>
                </div>
                
                <Button onClick={calculateBMR} variant="gradient" className="w-full">
                  Calculate BMR
                </Button>
                
                {bmrResult && (
                  <div className="p-6 rounded-xl bg-secondary/50 text-center animate-fade-in">
                    <p className="text-5xl font-bold font-display text-gradient">
                      {bmrResult}
                    </p>
                    <p className="text-lg text-muted-foreground mt-2">calories/day at rest</p>
                    <p className="text-sm text-muted-foreground mt-4">
                      This is the minimum calories your body needs to function at rest.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Calorie Calculator */}
          <TabsContent value="calories">
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-400" />
                  Daily Calorie Calculator
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Activity Level</Label>
                    <Select value={calActivity} onValueChange={setCalActivity}>
                      <SelectTrigger className="bg-secondary/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sedentary">Sedentary (desk job)</SelectItem>
                        <SelectItem value="light">Light (1-2 days/week)</SelectItem>
                        <SelectItem value="moderate">Moderate (3-5 days/week)</SelectItem>
                        <SelectItem value="active">Active (6-7 days/week)</SelectItem>
                        <SelectItem value="very_active">Very Active (2x/day)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Goal</Label>
                    <Select value={calGoal} onValueChange={setCalGoal}>
                      <SelectTrigger className="bg-secondary/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weight_loss">Weight Loss</SelectItem>
                        <SelectItem value="general_fitness">Maintain Weight</SelectItem>
                        <SelectItem value="muscle_gain">Muscle Gain</SelectItem>
                        <SelectItem value="endurance">Endurance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground">
                  Fill in your BMR details first, then calculate your daily calorie needs.
                </p>
                
                <Button onClick={calculateCalories} variant="gradient" className="w-full">
                  Calculate Daily Calories
                </Button>
                
                {calorieResult && (
                  <div className="p-6 rounded-xl bg-secondary/50 text-center animate-fade-in">
                    <p className="text-sm text-muted-foreground mb-2">Maintenance</p>
                    <p className="text-3xl font-bold text-muted-foreground">
                      {calorieResult.maintain} cal
                    </p>
                    <div className="my-4 border-t border-border" />
                    <p className="text-sm text-muted-foreground mb-2">{calorieResult.label}</p>
                    <p className="text-5xl font-bold font-display text-gradient">
                      {calorieResult.goal}
                    </p>
                    <p className="text-lg text-muted-foreground mt-2">calories/day</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Body Fat Calculator */}
          <TabsContent value="bodyfat">
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-rose-400" />
                  Body Fat Calculator (Navy Method)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Gender</Label>
                    <Select value={bfGender} onValueChange={setBfGender}>
                      <SelectTrigger className="bg-secondary/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Height (cm)</Label>
                    <Input
                      type="number"
                      value={bfHeight}
                      onChange={(e) => setBfHeight(e.target.value)}
                      placeholder="170"
                      className="bg-secondary/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Waist (cm)</Label>
                    <Input
                      type="number"
                      value={bfWaist}
                      onChange={(e) => setBfWaist(e.target.value)}
                      placeholder="80"
                      className="bg-secondary/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Neck (cm)</Label>
                    <Input
                      type="number"
                      value={bfNeck}
                      onChange={(e) => setBfNeck(e.target.value)}
                      placeholder="38"
                      className="bg-secondary/50"
                    />
                  </div>
                  {bfGender === 'female' && (
                    <div className="space-y-2 col-span-2">
                      <Label>Hip (cm)</Label>
                      <Input
                        type="number"
                        value={bfHip}
                        onChange={(e) => setBfHip(e.target.value)}
                        placeholder="95"
                        className="bg-secondary/50"
                      />
                    </div>
                  )}
                </div>
                
                <Button onClick={calculateBodyFat} variant="gradient" className="w-full">
                  Calculate Body Fat
                </Button>
                
                {bfResult && (
                  <div className="p-6 rounded-xl bg-secondary/50 text-center animate-fade-in">
                    <p className="text-5xl font-bold font-display text-gradient">
                      {bfResult.percentage}%
                    </p>
                    <p className="text-lg text-muted-foreground mt-2">{bfResult.category}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Water Intake */}
          <TabsContent value="water">
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Droplets className="w-5 h-5 text-blue-400" />
                  Daily Water Intake
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Weight (kg)</Label>
                    <Input
                      type="number"
                      value={waterWeight}
                      onChange={(e) => setWaterWeight(e.target.value)}
                      placeholder="70"
                      className="bg-secondary/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Activity Level</Label>
                    <Select value={waterActivity} onValueChange={setWaterActivity}>
                      <SelectTrigger className="bg-secondary/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sedentary">Sedentary</SelectItem>
                        <SelectItem value="moderate">Moderate Exercise</SelectItem>
                        <SelectItem value="active">Very Active</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Button onClick={calculateWater} variant="gradient" className="w-full">
                  Calculate Water Intake
                </Button>
                
                {waterResult && (
                  <div className="p-6 rounded-xl bg-secondary/50 text-center animate-fade-in">
                    <Droplets className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                    <p className="text-5xl font-bold font-display text-blue-400">
                      {waterResult}L
                    </p>
                    <p className="text-lg text-muted-foreground mt-2">per day</p>
                    <p className="text-sm text-muted-foreground mt-4">
                      That's about {Math.round(waterResult * 4)} glasses of water (250ml each)
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}