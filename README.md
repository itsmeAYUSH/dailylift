# 🏋️‍♂️ DailyLift — AI-Powered Health & Fitness Platform

Transform your fitness journey with intelligent, personalized AI-generated workout routines, precision nutrition planning, and comprehensive wellness analytics.

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Turborepo](https://img.shields.io/badge/Turborepo-2-EF4444?style=flat-square&logo=turborepo)](https://turbo.build/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth_%26_DB-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com/)

---

## 🌟 Overview

**DailyLift** is a full-stack fitness application that delivers hyper-personalized health experiences. It combines Anthropic's Claude models with biometric profiling to generate tailored workout routines, balanced meal plans with exact macros, plus a suite of health calculators and progress-tracking tools.

## 🚀 Key Features

- **🤖 AI-generated workouts** — adaptive plans by fitness level, goal, and environment, with warm-ups, exercise cards, rest timers, and cool-downs.
- **🥗 Smart meal planner** — daily calorie/macro targets from BMR & TDEE, full-day breakdowns with ingredients and prep steps, hydration tips.
- **🧮 Health calculators** — BMI, BMR (Mifflin–St Jeor), TDEE, and calorie-goal tools.
- **📊 Progress tracking** — weight and workout history with charts.
- **🔐 Auth & profiles** — email/password and Google OAuth via Supabase, onboarding flow, persisted profile.

AI generation is powered by the **Anthropic API** (Claude) through a Next.js route handler at `/api/generate-plan`.

## 🧱 Tech Stack

| Layer | Technology |
|---|---|
| Monorepo | Turborepo + npm workspaces |
| Framework | Next.js 16 (App Router, Turbopack) |
| UI | React 19, Tailwind CSS v4, shadcn/Radix components |
| State/Data | Zustand, TanStack Query |
| Backend | Supabase (Auth + Postgres) |
| AI | Anthropic API (`@anthropic-ai/sdk`) |
| Validation | Zod, `@t3-oss/env-nextjs` |

## 🗂️ Project Architecture

```
dailylift/
├── apps/
│   └── web/                 # Next.js app (App Router)
│       ├── src/app/         # routes: /, /auth, /onboarding, /dashboard,
│       │                    #         /workouts, /meals, /progress, /calculators
│       │   └── api/generate-plan/route.ts   # Anthropic-powered plan generation
│       ├── src/components/  # app-specific components (layout, etc.)
│       ├── src/stores/      # Zustand auth store
│       └── src/supabase/    # browser client + generated types
├── packages/
│   ├── ui/                  # shared design system (shadcn components, Tailwind v4 theme)
│   ├── env/                 # validated environment (@t3-oss/env-nextjs)
│   └── config/              # shared tsconfig base
├── supabase/                # config + SQL migrations
├── turbo.json
└── package.json             # workspaces + turbo scripts
```

## 🏁 Getting Started

### Prerequisites
- Node.js ≥ 18
- npm ≥ 10
- A Supabase project
- An Anthropic API key (for AI plan generation)

### Installation

```bash
npm install
```

### Environment variables

Copy the example and fill in your values (this file is gitignored):

```bash
cp apps/web/.env.example apps/web/.env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable-or-anon-key>
NEXT_PUBLIC_APP_URL=http://localhost:3000
ANTHROPIC_API_KEY=<your-anthropic-api-key>
```

> `ANTHROPIC_API_KEY` is server-only and is read exclusively by the `/api/generate-plan` route handler — it is never exposed to the browser.

### Supabase setup

Apply the SQL migration in `supabase/migrations/` to your project (via the Supabase SQL editor or `supabase db push`) to create the `profiles` table and related policies.

### Running the app

```bash
npm run dev          # runs the web app via turbo (http://localhost:3000)
```

## 📜 Available Scripts

Run from the repo root:

| Script | Description |
|---|---|
| `npm run dev` | Start the web app (Turbopack) |
| `npm run build` | Build all workspaces via Turbo |
| `npm run start` | Start the production build of the web app |
| `npm run check-types` | Type-check all workspaces |
| `npm run lint` | Lint all workspaces |

## 📄 License

MIT
