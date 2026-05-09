# AliFit Tracker

> A personal fitness web application for body recomposition - track workouts, monitor progressive overload, and manage nutrition with a built-in calorie calculator.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-alifit--tracker.vercel.app-10b981?logo=vercel)](https://alifit-tracker.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?logo=supabase)](https://supabase.com)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)](https://vercel.com)

**Live app: [https://alifit-tracker.vercel.app](https://alifit-tracker.vercel.app)**

---

## Features

- **Training Tracker** - 6-day Push/Pull/Legs split with set-by-set logging, progressive overload line charts, performance regression/stall alerts, and 4-week mesocycle deload management
- **Nutrition Tracker** - Daily calorie and macro logger with a 16-food library, 7-day bar charts, protein trend chart, and macro pie breakdown
- **Calorie Calculator** - Standalone BMR/TDEE tool (no login required), using Mifflin-St Jeor formula with a personalised macro split
- **Progress Dashboard** - Weight log with dynamic goal tracker, weekly loss rate, and ETA to goal
- **Authentication** - Email/password auth with user profiles and auto-computed daily targets

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS + Shadcn/UI |
| Database & Auth | Supabase (PostgreSQL + RLS) |
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

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Database Setup

Run these files in your Supabase **SQL Editor** in order:

1. `supabase/migrations/001_initial_schema.sql` - creates all tables, RLS policies, and indexes
2. `supabase/seed.sql` - seeds the 16 default foods library

### Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) - you will be redirected to the login page.

### First-time Setup

1. Sign up with your email and password
2. Complete the onboarding profile wizard
3. BMI, BMR, TDEE, and macro targets are calculated automatically from your stats

---

## Project Structure

```
alifit-tracker/
├── app/
│   ├── (app)/                  # Authenticated routes (sidebar layout)
│   │   ├── dashboard/          # Home dashboard with calorie ring + weight trend
│   │   ├── training/
│   │   │   ├── plan/           # 6-day plan reference cards
│   │   │   ├── log/            # Interactive set-by-set workout logger
│   │   │   ├── analytics/      # Progressive overload charts (auto-detected exercises)
│   │   │   └── deload/         # 4-week mesocycle deload tracker
│   │   ├── nutrition/
│   │   │   ├── meals/          # Daily meal plan reference
│   │   │   ├── log/            # Daily calorie logger
│   │   │   ├── analytics/      # 7-day macro charts
│   │   │   └── calculator/     # Calorie calculator shortcut
│   │   ├── progress/           # Weight trend, dynamic goal bar, ETA
│   │   └── settings/           # Profile editor + live targets preview
│   ├── auth/                   # Login, signup, onboarding, OAuth callback
│   └── calculator/             # Standalone BMR/TDEE tool (no login required)
├── components/
│   ├── layout/                 # Collapsible sidebar + mobile bottom navigation
│   └── ui/                     # Shadcn/UI component library
├── lib/
│   ├── supabase/               # Browser, server, and proxy clients
│   ├── fitness-math.ts         # BMR, TDEE, BMI, macro calculations
│   └── training-plan.ts        # 6-day plan data and weekly volume targets
├── supabase/
│   ├── migrations/             # SQL schema with RLS policies
│   └── seed.sql                # Default 16-food library
└── types/                      # Shared TypeScript interfaces and constants
```

---

## Key Formulas

**BMR (Mifflin-St Jeor):**
- Male: `(10 x weight_kg) + (6.25 x height_cm) - (5 x age) + 5`
- Female: `(10 x weight_kg) + (6.25 x height_cm) - (5 x age) - 161`

**TDEE:** `BMR x activity_multiplier`

| Activity Level | Multiplier |
|---|---|
| Sedentary | 1.2 |
| Lightly Active | 1.375 |
| Moderately Active | 1.55 |
| Very Active | 1.725 |

**Calorie Targets:**
- Fat Loss: `TDEE - 400`
- Recomposition: `TDEE`
- Muscle Gain: `TDEE + 300`

**Macros:** Protein = 2 g/kg body weight | Fat = 0.8 g/kg | Carbs = remaining calories / 4

---

## Database Schema

```sql
profiles         -- user stats: weight, height, dob, goal, activity level
weight_logs      -- daily weight entries (unique per user per date)
workout_sessions -- logged workout sessions (date, day_number, notes)
exercise_logs    -- set-by-set data: exercise_name, muscle_group, weight_kg, reps
foods            -- food library: default entries + user-added items
meal_logs        -- daily meals grouped by meal_type
meal_items       -- individual food quantities with pre-calculated macros
```

All tables use Row Level Security (RLS). Users can only read and write their own rows.

---

## Deployment

### Vercel (recommended)

1. Fork this repository
2. Import it on [Vercel](https://vercel.com/new)
3. Add both environment variables in the Vercel dashboard
4. Set the Supabase redirect URL to `https://your-app.vercel.app/auth/callback`

Every push to `main` triggers an automatic Vercel deployment.

---

## License

MIT (c) Ali Vaezi
