# 🏋️‍♂️ DailyLift — AI-Powered Health & Fitness Platform

Transform your fitness journey with intelligent, personalized workout routines, precision nutrition planning, progressive-overload tracking, and a full suite of health calculators.

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Turborepo](https://img.shields.io/badge/Turborepo-2-EF4444?style=flat-square&logo=turborepo)](https://turbo.build/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth_%26_DB-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com/)

---

## 📑 Table of contents

- [Overview](#-overview)
- [Feature tour](#-feature-tour)
  - [Authentication & onboarding](#authentication--onboarding)
  - [Dashboard](#dashboard)
  - [Training plans](#training-plans)
  - [Workout logger (Train)](#workout-logger-train)
  - [Rest timer](#rest-timer)
  - [Progressive overload & personal records](#progressive-overload--personal-records)
  - [Workout history](#workout-history)
  - [Exercise library](#exercise-library)
  - [Progress tracking](#progress-tracking)
  - [Meal planner](#meal-planner)
  - [Health calculators](#health-calculators)
  - [Profile](#profile)
- [How the intelligence works](#-how-the-intelligence-works)
- [Tech stack](#-tech-stack)
- [Project architecture](#-project-architecture)
- [Data model](#-data-model)
- [Getting started](#-getting-started)
- [Environment variables](#-environment-variables)
- [Available scripts](#-available-scripts)
- [AI configuration](#-ai-configuration)
- [Security model](#-security-model)
- [Deployment](#-deployment)
- [License](#-license)

---

## 🌟 Overview

**DailyLift** is a full-stack fitness application that delivers a hyper-personalized health experience. It pairs **Google Gemini** with a **deterministic fitness engine** so the parts that must be correct and instant (splits, plan skeletons, calorie math, progressive overload) never depend on an API call, while the parts that benefit from natural language (full workout/meal plans, coaching notes) are AI-generated and then strictly validated before they reach you.

Everything is scoped to the signed-in user and protected by Postgres Row-Level Security — you only ever see your own data.

---

## 🧭 Feature tour

### Authentication & onboarding

- **Email/password and Google OAuth** via Supabase Auth (`/auth`), with **forgot-password** (`/auth/forgot-password`), **reset-password** (`/auth/reset-password`), and an OAuth **callback** handler (`/auth/callback`).
- Sessions are persisted in cookies and shared between the browser and the server, so refreshes and server-rendered routes stay authenticated.
- A **Next.js proxy** (`src/proxy.ts` → `src/supabase/middleware.ts`) refreshes the session on every request and enforces redirects: signed-out users hitting a protected route are sent to `/auth?redirect=…`; signed-in users hitting `/auth` are sent to `/dashboard`.
- A database trigger creates a `profiles` row automatically when a user signs up.
- **Onboarding** (`/onboarding`) is a multi-step wizard that captures the basics (name, age, sex, height, weight), goal, how you like to train (location, weekly frequency, time available), and diet preference. It can **suggest a training split for you** (backed by the deterministic engine) and marks `onboarding_completed` when done. `AuthGate` nudges users into onboarding before letting them use training features.

### Dashboard

`/dashboard` — your home base after signing in. It aggregates data server-side in one call (`fetchDashboardData`) and shows:

- **Today's session** — the next workout suggested from your active plan (rotates through the plan's days based on how many workouts you've completed), or a rest-day / “no active plan” state.
- **Weekly stat cards** — workouts this week, current streak (days), weekly training volume (kg lifted), and latest body weight with its change.
- A **motivational summary line** that adapts to your streak and weekly volume.
- Quick links into the rest of the app.

### Training plans

`/plans` and `/plans/[id]` — structured, multi-day routines.

- **Deterministic plan builder** assembles a full plan from a chosen split + your goal + training environment by mapping each day's focus to muscle groups and picking real exercises from the library (compound movements first, beginner-friendly next). No AI required — instant and fully editable.
- Supported **splits**: Full Body, Upper/Lower, Push/Pull/Legs, and Bro Split — each with an ideal weekly frequency and a day-rotation template.
- **Rep/rest schemes adapt to your goal**: e.g. muscle gain → 8–12 reps, 4 sets, 90s rest; weight-loss/endurance → 12–20 reps, 3 sets, 45s rest.
- One plan can be **active** at a time; the dashboard and Train page read from it. You can **activate, archive, or delete** plans.
- The plan detail page shows every day and its planned exercises (sets, rep range, rest) and lets you start a session from a day.

### Workout logger (Train)

`/workouts` (hub) and `/workouts/[id]` (live session).

- Start a session from your active plan's suggested day (target sets are pre-created so you just fill in weight/reps) or start an empty session and add exercises on the fly.
- **Set-by-set logging** with weight, reps, and optional RPE, plus set types (`warmup`, `working`, `drop`, `failure`).
- **Debounced auto-save** — fast typing feels instant and writes are batched; pending edits are flushed when you leave the page.
- **“Last time” hints** show your previous performance for each exercise so you know what to beat.
- Add/remove exercises mid-session, see a live elapsed-time counter, and **finish** or **cancel** the workout.

### Rest timer

- A **global rest timer** (`RestTimerBar`) lives outside the page tree, so it keeps counting while you scroll or navigate within a workout.
- Start, add time, or skip; the target end-time is mirrored to `localStorage` so a refresh recovers a running timer instead of losing it.
- Plays a gentle completion beep (best-effort; silently ignored if audio is blocked).

### Progressive overload & personal records

- A **deterministic progressive-overload engine** suggests your next load, entirely explainable and instant (works with AI off). Rules, most specific first:
  - Hit the top of the rep range on every working set → bump weight (~2.5 kg, or 5 kg for heavier lifts) and reset reps to the bottom of the range.
  - Reached the bottom-to-mid of the range → keep the weight, aim for +1 rep.
  - Fell below the range → hold and clean up the reps first.
  - Every result is labelled a **suggestion** you can override.
- Includes **Epley estimated 1RM**, **session volume** (Σ weight × reps), and human-readable set summaries (e.g. “40 kg × 10, 10, 8”).
- **Personal records** are detected automatically when you finish a workout across four record types: `max_weight`, `max_reps`, `est_1rm`, and `max_volume`. New PRs are surfaced in the finish summary.

### Workout history

`/workouts/history` — a reverse-chronological list of completed sessions with duration, exercise count, and total volume; drill into any session, or delete it.

### Exercise library

`/exercises` — browse the movement catalog.

- Each exercise carries a **primary muscle**, **exercise type** (`compound` / `isolation` / `cardio` / `mobility`), **equipment**, **environment** (`gym` / `home` / `both`), and form guidance.
- Search and filter, view details, and see **alternatives** (same primary muscle) for easy swaps.
- The library is shared (global exercises) plus your own **custom exercises**; RLS lets everyone read global entries while you manage only your own.

### Progress tracking

`/progress` — visualize trends over selectable ranges (30D / 90D / 1Y / All).

- **Body-weight chart** from your logged entries, with an inline “log weight” dialog.
- **Weekly training-volume chart** aggregated from your workout history.
- **Personal-record highlights**.
- Charts are rendered with Recharts and themed for light and dark.

### Meal planner

`/meals` — an **AI-generated full-day nutrition plan** tailored to your profile.

- Computes a **daily calorie target** from your BMR/TDEE and goal, then asks Gemini for a day of meals hitting that target.
- Returns per-meal **calories and macros** (protein/carbs/fat), ingredients, prep instructions and time, plus daily totals, a hydration tip, and coaching tips.
- Track which meals you've completed for the day; regenerate any time.
- The AI response is **validated with Zod** before display — malformed output is rejected, never rendered.

### Health calculators

`/calculators` — instant, deterministic tools (the active tool syncs with the `?type=` query param so it's linkable):

| Calculator | What it does |
|---|---|
| **BMI** | Body Mass Index from height & weight |
| **BMR** | Basal Metabolic Rate (Mifflin–St Jeor) |
| **Daily calories** | TDEE + goal-adjusted target (−500 cut / +300 lean bulk) |
| **Body fat** | Estimate via the U.S. Navy method |
| **Water intake** | Recommended daily water |

Inputs prefill from your profile when available. All results are estimates, not medical advice.

### Profile

`/profile` — edit the details that drive your plans and targets (name, age, sex, height, weight, goal, experience level, training preference, weekly training days, diet preference). Saved to your `profiles` row.

---

## 🧠 How the intelligence works

DailyLift deliberately splits “intelligence” into two layers:

**1. Deterministic engine** (`src/lib/fitness/`) — pure TypeScript, no network, always available:
- `calculations.ts` — BMR (Mifflin–St Jeor), TDEE (activity multipliers), and goal-adjusted calorie targets.
- `split.ts` — recommends a training split from experience, weekly frequency, goal, and equipment, with a plain-language rationale.
- `planBuilder.ts` — turns a split + goal + environment + the exercise library into a complete, editable multi-day plan.
- `overload.ts` — next-session load suggestions, estimated 1RM, and volume math.

**2. AI layer** (`src/lib/ai/` + route handlers) — Google Gemini for natural-language generation, always validated:
- `POST /api/generate-plan` — generates a full **workout** or **meal** plan. It authenticates the user, **rate-limits** per user, loads the profile **server-side** (never trusting client input), builds the prompt, calls Gemini constrained to JSON, then parses the result through **Zod schemas** before returning it.
- `POST /api/suggest-split` — returns a deterministic split recommendation and, optionally, a short AI coaching note. If the AI call fails or the key is absent, it still returns the deterministic answer — AI is pure enrichment here.
- `gemini.ts` — a thin, server-only `fetch` wrapper around the Gemini REST API (no SDK).
- `rate-limit.ts` — a minimal in-memory limiter (8 requests/user/minute) to stop double-clicks and basic abuse.
- `schemas.ts` — Zod schemas that every AI response must satisfy; numbers are coerced because models often return them as strings.

The result: correctness-critical features are instant and reliable, and AI output is treated as **untrusted** until validated.

---

## 🧱 Tech stack

| Layer | Technology |
|---|---|
| Monorepo | Turborepo + npm workspaces |
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5.8 |
| UI | React 19, Tailwind CSS v4, shadcn/Radix components, lucide-react icons |
| State / data | Zustand (auth, rest timer), TanStack Query (server cache) |
| Charts | Recharts |
| Smooth scroll | Lenis |
| Backend | Supabase (Auth + Postgres with Row-Level Security) |
| AI | Google Gemini API (REST via `fetch`) |
| Validation | Zod, `@t3-oss/env-nextjs` (typed, validated env) |
| Linting | ESLint 9 (flat config, `eslint-config-next`) |

---

## 🗂️ Project architecture

```
dailylift/
├── apps/
│   └── web/                       # Next.js app (App Router)
│       ├── src/
│       │   ├── app/               # routes
│       │   │   ├── page.tsx               # marketing landing
│       │   │   ├── auth/                  # sign in, callback, forgot/reset password
│       │   │   ├── onboarding/            # multi-step setup wizard
│       │   │   ├── dashboard/             # home overview
│       │   │   ├── plans/ + plans/[id]/   # training plans
│       │   │   ├── workouts/ + [id]/ + history/  # session logger
│       │   │   ├── exercises/             # exercise library
│       │   │   ├── progress/              # charts & PRs
│       │   │   ├── meals/                 # AI meal planner
│       │   │   ├── calculators/           # health calculators
│       │   │   ├── profile/               # profile editor
│       │   │   └── api/
│       │   │       ├── generate-plan/route.ts   # Gemini workout/meal generation
│       │   │       └── suggest-split/route.ts   # split recommendation (+AI note)
│       │   ├── components/        # layout (sidebar, top nav, theme toggle), AuthGate, rest timer, etc.
│       │   ├── hooks/             # TanStack Query hooks (queries.ts)
│       │   ├── lib/
│       │   │   ├── ai/            # gemini client, schemas, rate limit
│       │   │   ├── db/            # typed data-access layer (exercises, plans, workouts, metrics)
│       │   │   └── fitness/       # deterministic engine (calculations, split, planBuilder, overload)
│       │   ├── stores/            # Zustand stores (authStore, restTimer)
│       │   ├── supabase/          # browser/server/admin clients, middleware, generated types
│       │   └── proxy.ts           # Next.js proxy (session refresh + auth redirects)
│       └── .env.example
├── packages/
│   ├── ui/                        # shared design system (shadcn components, Tailwind v4 theme, globals.css)
│   ├── env/                       # validated environment (@t3-oss/env-nextjs)
│   └── config/                    # shared tsconfig base
├── supabase/
│   ├── config.toml
│   └── migrations/                # SQL migrations (schema, RLS, triggers)
├── turbo.json
└── package.json                   # workspaces + turbo scripts
```

---

## 🗃️ Data model

All tables live in Postgres (Supabase) and are protected by **Row-Level Security** — every policy scopes rows to `auth.uid()`, so users can only read/write their own data (global exercises are the one shared, read-only-to-others exception).

| Table | Purpose |
|---|---|
| `profiles` | One row per user: bio, goal, experience, training preferences, diet, onboarding flag |
| `exercises` | Movement library (global + per-user custom); muscle, type, equipment, environment |
| `workout_plans` | Saved routines; one can be `is_active` |
| `workout_plan_days` | Days within a plan (e.g. Push / Pull / Legs) |
| `planned_exercises` | Planned exercises per day (target sets, rep range, rest) |
| `workouts` | Logged sessions (status, started/finished timestamps) |
| `workout_exercises` | Exercises performed in a session |
| `workout_sets` | Individual sets (weight, reps, RPE, set type, completion) |
| `body_weight_logs` | Body-weight entries over time |
| `personal_records` | Auto-detected PRs (`max_weight`, `max_reps`, `est_1rm`, `max_volume`) |
| `meal_plans` / `progress_logs` | Meal plans and generic progress logs |

Enums include `fitness_level`, `fitness_goal`, and `workout_preference`. Triggers keep `updated_at` fresh and auto-create a profile on sign-up.

---

## 🏁 Getting started

### Prerequisites
- Node.js ≥ 18
- npm ≥ 10
- A Supabase project
- A Google Gemini API key (for AI plan/meal generation)

### Installation

```bash
npm install
```

> **Monorepo note:** the workspace packages (`@dailylift/ui`, `@dailylift/env`, `@dailylift/config`) are linked into `node_modules` by `npm install`. If you move or rename the repository folder, run `npm install` again so those symlinks are recreated.

### Environment variables

Copy the example and fill in your values (this file is gitignored):

```bash
cp apps/web/.env.example apps/web/.env.local
```

### Supabase setup

Apply the SQL in `supabase/migrations/` to your project — via the Supabase SQL editor or the CLI:

```bash
supabase db push
```

This creates the tables, enums, RLS policies, and triggers described above. Populate the `exercises` table with your movement library (global exercises) so the plan builder has moves to choose from; users can also add their own custom exercises from within the app.

### Running the app

```bash
npm run dev          # runs the web app via turbo (http://localhost:3000)
```

---

## 🔐 Environment variables

| Variable | Scope | Required | Description |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | client | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | client | ✅ | Supabase publishable/anon key |
| `NEXT_PUBLIC_APP_URL` | client | – | This app's origin, used to build OAuth/email redirect callbacks (defaults to `http://localhost:3000`) |
| `GEMINI_API_KEY` | server | – | Google Gemini key used by the AI route handlers. If unset, AI generation returns a clear “not configured” response and deterministic features still work. |
| `SUPABASE_SECRET_KEY` | server | – | Service-role key for privileged/admin tasks (bypasses RLS). Never exposed to the browser. |

Environment is validated at build/run time by `@t3-oss/env-nextjs` (`packages/env`), so a missing/malformed required variable fails fast with a helpful error.

---

## 📜 Available scripts

Run from the repo root:

| Script | Description |
|---|---|
| `npm run dev` | Start the web app (Turbopack) at `http://localhost:3000` |
| `npm run build` | Build all workspaces via Turbo |
| `npm run start` | Start the production build of the web app |
| `npm run check-types` | Type-check all workspaces |
| `npm run lint` | Lint all workspaces (ESLint flat config) |

---

## 🤖 AI configuration

- AI generation is powered by the **Google Gemini API** through the route handlers at `/api/generate-plan` and `/api/suggest-split`.
- The model is set in `apps/web/src/lib/ai/gemini.ts` (`DEFAULT_MODEL`). Change it there to use a different Gemini model.
- The AI layer is optional: without `GEMINI_API_KEY`, split recommendations, the plan builder, calculators, overload suggestions, and all tracking still work — only the AI-authored full plans and coaching notes are unavailable.
- Every AI response is parsed through Zod (`src/lib/ai/schemas.ts`) before it is trusted, and generation is rate-limited per user.

---

## 🛡️ Security model

- **Row-Level Security** on every table ensures users only access their own data.
- **Server-side auth on API routes:** route handlers call `auth.getUser()` (which re-validates the token) and derive the user id server-side — client-supplied ids/profiles are never trusted.
- **Session integrity:** the proxy uses `getUser()` (not `getSession()`) to re-validate on each request and refresh cookies.
- **Server-only secrets:** `GEMINI_API_KEY` and `SUPABASE_SECRET_KEY` have no `NEXT_PUBLIC_` prefix and are only read on the server; the admin (service-role) client is confined to server code.
- **Untrusted AI output:** all model responses are schema-validated before use.
- **Rate limiting** guards the expensive generation endpoints.

---

## 🚀 Deployment

- Deploy the `web` app to any Next.js-compatible host (e.g. Vercel). Set the environment variables above in the host's dashboard.
- Point the project at your Supabase instance and apply the migrations.
- Set `NEXT_PUBLIC_APP_URL` to your production origin so OAuth and password-reset callbacks resolve correctly, and add that origin to Supabase Auth's allowed redirect URLs.
- The in-memory rate limiter is per-instance; for horizontally scaled deployments, swap it for a shared limiter (e.g. Redis/Upstash).

---

## 📄 License

MIT
