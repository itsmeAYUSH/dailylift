"use client";

import Link from 'next/link';
import { Button } from '@dailylift/ui/components/button';
import { Layout } from '@/components/layout/Layout';
import { useAuthStore } from '@/stores/authStore';
import {
  Dumbbell,
  UtensilsCrossed,
  TrendingUp,
  Brain,
  Target,
  Calculator,
  ArrowRight,
  Check,
} from 'lucide-react';

const features = [
  {
    icon: Brain,
    title: 'AI-generated plans',
    description: 'Workout and meal plans built around your goals, level, and schedule — not a generic template.',
  },
  {
    icon: Dumbbell,
    title: 'Adaptive workouts',
    description: 'Home, gym, or outdoor routines with warm-ups, rest timers, and clear form guidance.',
  },
  {
    icon: UtensilsCrossed,
    title: 'Daily meal plans',
    description: 'Full-day nutrition with timings, calories, and macros that fit your dietary preference.',
  },
  {
    icon: TrendingUp,
    title: 'Progress tracking',
    description: 'Log weight, workouts, and meals to see streaks and trends over time.',
  },
  {
    icon: Calculator,
    title: 'Health calculators',
    description: 'BMI, BMR, calorie needs, body fat, and hydration — all in one place.',
  },
  {
    icon: Target,
    title: 'Goal-focused',
    description: 'Weight loss, muscle gain, endurance, or general fitness — plans adjust to match.',
  },
];

const goals = ['Weight loss', 'Muscle gain', 'Endurance', 'Flexibility', 'General fitness'];

const stats = [
  { value: '6', label: 'Health calculators' },
  { value: '4', label: 'Workout environments' },
  { value: '100%', label: 'Personalized plans' },
];

export default function Index() {
  const { user } = useAuthStore();

  return (
    <Layout>
      {/* Hero */}
      <section className="border-b border-border">
        <div className="container mx-auto px-4 py-20 md:py-28">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-medium mb-6 animate-fade-in">
              AI-powered fitness planning
            </div>

            <h1 className="font-display text-4xl md:text-6xl font-bold mb-6 leading-[1.1] tracking-tight">
              Personalized fitness,
              <br className="hidden sm:block" /> planned for you
            </h1>

            <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto leading-relaxed">
              DailyLift builds workout and meal plans tailored to your goals and lifestyle,
              then helps you track every step of the way.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              {user ? (
                <Link href="/dashboard">
                  <Button size="xl" className="group">
                    Go to dashboard
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/auth?mode=signup">
                    <Button size="xl" className="group">
                      Get started free
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </Button>
                  </Link>
                  <Link href="/auth">
                    <Button variant="outline" size="xl">
                      Sign in
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Goal chips */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-12">
              {goals.map((goal) => (
                <span
                  key={goal}
                  className="px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-sm font-medium"
                >
                  {goal}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-border">
        <div className="container mx-auto px-4 py-10">
          <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="font-display text-3xl md:text-4xl font-bold">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">
              Everything in one place
            </h2>
            <p className="text-muted-foreground">
              A focused set of tools to plan, follow, and track your fitness — without the clutter.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="p-6 rounded-xl bg-card border border-border hover:border-primary/40 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center mb-4">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-display text-lg font-semibold mb-1.5">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="pb-20">
        <div className="container mx-auto px-4">
          <div className="rounded-2xl border border-border bg-card px-8 py-12 md:px-12 md:py-16 text-center">
            <h2 className="font-display text-2xl md:text-4xl font-bold mb-3">
              Start your plan today
            </h2>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
              Set up your profile in under two minutes and get your first AI-generated plan.
            </p>

            {!user && (
              <Link href="/auth?mode=signup">
                <Button size="xl">
                  Create your free account
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            )}

            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-8 text-sm text-muted-foreground">
              {['Free to start', 'No credit card required', 'Cancel anytime'].map((item) => (
                <div key={item} className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-primary" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
                <Dumbbell className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-display font-semibold">DailyLift</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} DailyLift. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </Layout>
  );
}
