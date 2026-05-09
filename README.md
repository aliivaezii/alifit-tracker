# AliFit Tracker

> A personal fitness web application for body recomposition — track workouts, monitor progressive overload, and manage nutrition with a built-in calorie calculator.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-alifit--tracker.vercel.app-10b981?logo=vercel)](https://alifit-tracker.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?logo=supabase)](https://supabase.com)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)](https://vercel.com)

**🔗 Live app: [https://alifit-tracker.vercel.app](https://alifit-tracker.vercel.app)**

---

## Features

- **Training Tracker** — 6-day Push/Pull/Legs plan with set-by-set logging, progressive overload line charts, performance regression/stall alerts, and 4-week mesocycle deload management
- **Nutrition Tracker** — Daily calorie and macro logger with a 16-food library, 7-day bar charts, 30-day protein trend, and macro pie breakdown
- **Calorie Calculator** — Standalone BMR/TDEE tool (no login required), with Mifflin-St Jeor formula and personalized macro split
- **Progress Dashboard** — Weight log with goal tracker (96 kg → 80 kg), weekly loss rate, and ETA to goal
- **Authentication** — Email/password auth with user profiles and auto-computed daily targets

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + Shadcn/UI |
| Database & Auth | Supabase (PostgreSQL) |
| Charts | Recharts |
| Deployment | Vercel |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) account (free tier)

### Installation

```bash
git clone https://github.com/aliivaezii/alifit-tracker.git
cd alifit-tracker
npm install
```

### Environment Variables

Create a `.env.local` file in the root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Database Setup

Run these files in your Supabase **SQL Editor** in order:

1. `supabase/migrations/001_initial_schema.sql` — creates all tables, RLS policies, and indexes
2. `supabase/seed.sql` — seeds the 16 default foods library

### Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you will be redirected to the login page.

### First-time Setup

1. Sign up with your email and password
2. Complete the onboarding profile wizard (pre-filled with example data)
3. BMI, BMR, TDEE, and macro targets are computed automatically from your stats

---

## Project Structure

```
alifit-tracker/
├── app/
│   ├── (app)/                  # Authenticated routes with sidebar layout
│   │   ├── dashboard/          # Home dashboard
│   │   ├── training/
│   │   │   ├── plan/           # 6-day plan reference cards
│   │   │   ├── log/            # Workout logger (set-by-set)
│   │   │   ├── analytics/      # Progressive overload charts
│   │   │   └── deload/         # Mesocycle deload tracker
│   │   ├── nutrition/
│   │   │   ├── meals/          # Meal plan reference
│   │   │   ├── log/            # Daily calorie logger
│   │   │   ├── analytics/      # Nutrition charts
│   │   │   └── calculator/     # Calorie calculator (re-export)
│   │   ├── progress/           # Weight trend and goal tracker
│   │   └── settings/           # Profile and account settings
│   ├── auth/                   # Login, signup, onboarding, OAuth callback
│   └── calculator/             # Standalone page (no login required)
├── components/
│   ├── layout/                 # Sidebar + bottom navigation
│   └── ui/                     # Shadcn/UI components
├── lib/
│   ├── supabase/               # Browser, server, and proxy clients
│   ├── fitness-math.ts         # BMR, TDEE, BMI, macro calculations
│   └── training-plan.ts        # 6-day plan data and volume targets
├── supabase/
│   ├── migrations/             # SQL schema migration
│   └── seed.sql                # Default foods data
└── types/                      # Shared TypeScript interfaces
```

---

## Key Formulas

**BMR (Mifflin-St Jeor):**
- Male: `10 × weight + 6.25 × height − 5 × age + 5`
- Female: `10 × weight + 6.25 × height − 5 × age − 161`

**TDEE:** `BMR × activity_multiplier`

| Activity Level | Multiplier |
|---|---|
| Sedentary | 1.2 |
| Lightly Active | 1.375 |
| Moderately Active | 1.55 |
| Very Active | 1.725 |

**Calorie Targets:** Fat Loss: TDEE − 400 · Recomp: TDEE · Muscle Gain: TDEE + 300

**Macros:** Protein = 2 g/kg · Fat = 0.8 g/kg · Carbs = (remaining calories) ÷ 4

---

## Database Schema

```sql
profiles         -- user stats: weight, height, dob, goal, activity level
weight_logs      -- daily weight entries
workout_sessions -- logged workout sessions
exercise_logs    -- set-by-set exercise data (weight × reps)
foods            -- default food library + user-added foods
meal_logs        -- daily meals grouped by meal type
meal_items       -- individual food items within each meal
```

All tables use Row Level Security (RLS). Users can only access their own data. Default foods (`is_default = true`) are readable by all authenticated users.

---

## Deployment

### Vercel (recommended)

1. Fork this repository
2. Import it on [Vercel](https://vercel.com/new)
3. Add the two environment variables in Vercel dashboard settings
4. Set the Supabase redirect URL to `https://your-app.vercel.app/auth/callback`

Every push to `main` triggers an automatic deployment.

---

## License

MIT © Ali Vaezi
