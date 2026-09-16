"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@dailylift/ui/components/button';
import { Layout } from '@/components/layout/Layout';
import { StructuredData } from '@/components/StructuredData';
import { useAuthStore } from '@/stores/authStore';
import {
  MAIN_FAQS,
  getFAQSchema,
  getHowToSchema,
} from '@/lib/seo';
import {
  Dumbbell,
  UtensilsCrossed,
  TrendingUp,
  Brain,
  Target,
  Calculator,
  ArrowRight,
  Check,
  ChevronDown,
  Sparkles,
  ShieldCheck,
  Zap,
  Activity,
  Award,
  HelpCircle,
} from 'lucide-react';

const features = [
  {
    icon: Brain,
    title: 'AI-Generated Workout Splits',
    description: 'Custom Push-Pull-Legs, Upper-Lower, or Full Body routines built around your exact experience level, recovery capacity, and weekly schedule.',
  },
  {
    icon: Dumbbell,
    title: 'Adaptive Training & Logging',
    description: 'Gym, home, or outdoor routines with integrated rest timers, real-time RPE tracking, warm-up guidance, and exercise swap options.',
  },
  {
    icon: UtensilsCrossed,
    title: 'Personalized Daily Meal Plans',
    description: 'Macro-tailored daily nutrition for vegetarian, vegan, non-veg, or eggetarian diets with exact ingredient portions, cook instructions, and meal timing.',
  },
  {
    icon: TrendingUp,
    title: 'Smart Progressive Overload',
    description: 'Automated performance comparison across sets and sessions with data-backed progression prompts to steadily build muscle and strength.',
  },
  {
    icon: Calculator,
    title: 'Clinical Health Calculators',
    description: 'Mifflin-St Jeor BMR, Total Daily Energy Expenditure (TDEE), U.S. Navy body fat %, BMI, and hydration math — all in one dashboard.',
  },
  {
    icon: Target,
    title: 'Goal-Driven Optimization',
    description: 'Whether cutting body fat, bulking lean muscle, or increasing cardiovascular endurance, workout volume and calories dynamically calibrate to match.',
  },
];

const methodologySteps = [
  {
    number: "01",
    title: "Mifflin-St Jeor Energy Formulation",
    description:
      "Calculates resting metabolic rate with high clinical accuracy, factoring age, sex, weight, and height, then scales by physical activity level.",
  },
  {
    number: "02",
    title: "Algorithmic Split Structuring",
    description:
      "Selects optimal frequency (PPL, Upper/Lower, Full Body) based on your training days to balance muscle protein synthesis and systemic recovery.",
  },
  {
    number: "03",
    title: "Active Overload Feedback Loop",
    description:
      "Logs every set, comparing historical volume and RPE to recommend micro-progressions in weight or reps for continuous adaptation.",
  },
  {
    number: "04",
    title: "Targeted Macro Distribution",
    description:
      "Allocates 1.6–2.2g of protein per kg of body mass with balanced complex carbs and healthy fats aligned with your primary goal.",
  },
];

const stats = [
  { value: '5+', label: 'Clinical Calculators' },
  { value: '4', label: 'Workout Environments' },
  { value: '100%', label: 'AI-Tailored Plans' },
  { value: '100%', label: 'Free to Get Started' },
];

export default function Index() {
  const { user } = useAuthStore();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const toggleFaq = (idx: number) => {
    setOpenFaq((curr) => (curr === idx ? null : idx));
  };

  return (
    <Layout>
      {/* Inject AEO and SEO Structured Data into page */}
      <StructuredData data={getFAQSchema(MAIN_FAQS)} />
      <StructuredData data={getHowToSchema()} />

      {/* Hero Section */}
      <section className="border-b border-border bg-gradient-to-b from-background via-background to-accent/20">
        <div className="container mx-auto px-4 py-20 md:py-32">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-6 animate-fade-in border border-primary/20">
              <Sparkles className="size-3.5" /> AI-Powered Fitness &amp; Nutrition System
            </div>

            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold mb-6 leading-[1.1] tracking-tight">
              Personalized fitness &amp; nutrition,
              <br className="hidden sm:block" /> engineered for results
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              DailyLift builds intelligent workout routines, macro-balanced daily meal plans, and provides real-time progressive overload logging to help you build muscle, lose fat, and stay consistent.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
              {user ? (
                <Link href="/dashboard">
                  <Button size="xl" className="group shadow-lg">
                    Open Your Dashboard
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/auth?mode=signup">
                    <Button size="xl" className="group shadow-lg">
                      Get Started Free
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </Button>
                  </Link>
                  <Link href="/auth">
                    <Button variant="outline" size="xl">
                      Sign In
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Feature Badges */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-10">
              {["Push-Pull-Legs", "Upper/Lower", "Full Body", "Home & Gym", "Vegan & Non-Veg", "Progressive Overload"].map((goal) => (
                <span
                  key={goal}
                  className="px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-xs font-medium border border-border"
                >
                  {goal}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-b border-border bg-card/50">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="font-display text-3xl md:text-4xl font-bold text-primary">{stat.value}</div>
                <div className="text-xs sm:text-sm text-muted-foreground mt-1 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 md:py-28" id="features">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mb-14 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary uppercase tracking-wider mb-2">
              <Zap className="size-3.5" /> Built for Serious Lifters
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">
              Everything you need to train smarter
            </h2>
            <p className="text-muted-foreground text-base">
              A comprehensive system replacing scattered spreadsheets, generic PDF templates, and manual calorie math.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="p-6 sm:p-7 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all hover:shadow-md"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-5">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="font-display text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Scientific Methodology / How It Works (AEO Authority) */}
      <section className="py-16 md:py-24 border-y border-border bg-accent/20" id="methodology">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary uppercase tracking-wider mb-2">
              <ShieldCheck className="size-3.5" /> Evidence-Based Methodology
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">
              Grounding AI in Exercise Science
            </h2>
            <p className="text-muted-foreground">
              Every plan, progression prompt, and calorie calculation is built on peer-reviewed exercise physiology and clinical nutrition models.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {methodologySteps.map((step) => (
              <div key={step.number} className="p-6 rounded-xl bg-card border border-border">
                <span className="font-mono text-xs font-bold text-primary px-2.5 py-1 rounded bg-primary/10 mb-3 inline-block">
                  STEP {step.number}
                </span>
                <h3 className="font-display text-base font-semibold mb-2">{step.title}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions (AEO / Search Answer Engine Optimization) */}
      <section className="py-20 md:py-28" id="faqs">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary uppercase tracking-wider mb-2">
              <HelpCircle className="size-3.5" /> Frequently Asked Questions
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">
              Answers to Common Questions
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Everything you need to know about DailyLift workouts, meal plans, progressive overload, and calculators.
            </p>
          </div>

          <div className="space-y-4">
            {MAIN_FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={faq.question}
                  className="rounded-xl border border-border bg-card transition-colors overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    className="flex w-full items-center justify-between p-5 text-left font-display font-medium text-base hover:text-primary transition-colors gap-4"
                    aria-expanded={isOpen}
                  >
                    <span>{faq.question}</span>
                    <ChevronDown
                      className={`size-5 shrink-0 text-muted-foreground transition-transform duration-200 ${
                        isOpen ? "rotate-180 text-primary" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-sm text-muted-foreground leading-relaxed border-t border-border/50 animate-fade-in">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="pb-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="rounded-3xl border border-border bg-card px-8 py-12 md:px-14 md:py-16 text-center shadow-lg relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="font-display text-3xl md:text-5xl font-bold mb-4 tracking-tight">
                Start building your plan today
              </h2>
              <p className="text-muted-foreground mb-8 max-w-xl mx-auto text-base sm:text-lg">
                Set up your fitness profile in under two minutes to get your first custom workout routine and meal plan.
              </p>

              {!user && (
                <Link href="/auth?mode=signup">
                  <Button size="xl" className="shadow-lg">
                    Create Your Free Account
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              )}

              <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-8 text-sm text-muted-foreground">
                {['100% Free to start', 'No credit card required', 'Immediate plan generation'].map((item) => (
                  <div key={item} className="flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-primary shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Rich Footer with Nav and Semantic Links */}
      <footer className="py-12 border-t border-border bg-card/30">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
                  <Dumbbell className="w-4 h-4" />
                </div>
                <span className="font-display font-bold text-lg">DailyLift</span>
              </div>
              <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
                Your AI-powered fitness companion for custom workout routines, progressive overload tracking, and nutrition planning.
              </p>
            </div>

            <div>
              <h4 className="font-display font-semibold text-sm mb-3">Features</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/workouts" className="hover:text-foreground">Workouts &amp; Logger</Link></li>
                <li><Link href="/plans" className="hover:text-foreground">Training Splits</Link></li>
                <li><Link href="/exercises" className="hover:text-foreground">Exercise Library</Link></li>
                <li><Link href="/meals" className="hover:text-foreground">Meal Plans</Link></li>
                <li><Link href="/progress" className="hover:text-foreground">Progress &amp; PRs</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-display font-semibold text-sm mb-3">Calculators</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/calculators?type=bmr" className="hover:text-foreground">BMR Calculator</Link></li>
                <li><Link href="/calculators?type=calories" className="hover:text-foreground">TDEE &amp; Calories</Link></li>
                <li><Link href="/calculators?type=bodyfat" className="hover:text-foreground">Navy Body Fat %</Link></li>
                <li><Link href="/calculators?type=bmi" className="hover:text-foreground">BMI Calculator</Link></li>
                <li><Link href="/calculators?type=water" className="hover:text-foreground">Water Intake</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <p>© {new Date().getFullYear()} DailyLift. All rights reserved.</p>
            <div className="flex gap-4">
              <Link href="/calculators" className="hover:text-foreground">Health Calculators</Link>
              <Link href="/exercises" className="hover:text-foreground">Exercises</Link>
              <Link href="/auth" className="hover:text-foreground">Sign In</Link>
            </div>
          </div>
        </div>
      </footer>
    </Layout>
  );
}
