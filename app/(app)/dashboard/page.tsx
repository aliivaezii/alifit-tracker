import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { computeStats } from '@/lib/fitness-math'
import { TRAINING_PLAN } from '@/lib/training-plan'
import { format, subDays } from 'date-fns'
import { DashboardClient } from './dashboard-client'
import type { MealLog, WeightLog, Profile } from '@/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!profile) redirect('/auth/onboarding')

  const today = format(new Date(), 'yyyy-MM-dd')
  const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd')

  const [{ data: mealLogs }, { data: weightLogs }, { data: recentSessions }] = await Promise.all([
    supabase
      .from('meal_logs')
      .select('*, meal_items(*)')
      .eq('user_id', user.id)
      .eq('date', today),
    supabase
      .from('weight_logs')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', thirtyDaysAgo)
      .order('date', { ascending: true }),
    supabase
      .from('workout_sessions')
      .select('date, day_number')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(10),
  ])

  const stats = computeStats(
    profile.weight_kg,
    profile.height_cm,
    profile.dob,
    profile.gender,
    profile.activity_level,
    profile.goal
  )

  const todayMacros = (mealLogs ?? []).reduce(
    (acc, meal) => {
      const items = (meal as MealLog & { meal_items: Array<{ calories: number; protein: number; carbs: number; fat: number }> }).meal_items ?? []
      return {
        calories: acc.calories + items.reduce((s, i) => s + i.calories, 0),
        protein: acc.protein + items.reduce((s, i) => s + i.protein, 0),
        carbs: acc.carbs + items.reduce((s, i) => s + i.carbs, 0),
        fat: acc.fat + items.reduce((s, i) => s + i.fat, 0),
      }
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )

  // Derive next training day from the most recent session, not from date arithmetic.
  // If today already has a session, show that day as active.
  // Otherwise advance to the next day (wrap 6 -> 1).
  const sessions = recentSessions ?? []
  let nextDayNumber = 1
  if (sessions.length > 0) {
    const todaySession = sessions.find((s) => s.date === today)
    if (todaySession) {
      nextDayNumber = todaySession.day_number
    } else {
      const lastDayNumber = sessions[0].day_number
      nextDayNumber = lastDayNumber >= 6 ? 1 : lastDayNumber + 1
    }
  }

  const currentTrainingDay = TRAINING_PLAN.find((d) => d.dayNumber === nextDayNumber) ?? TRAINING_PLAN[0]
  const lastSessionDate = sessions[0]?.date ?? null

  return (
    <DashboardClient
      profile={profile as Profile}
      stats={stats}
      todayMacros={todayMacros}
      weightLogs={(weightLogs ?? []) as WeightLog[]}
      currentTrainingDay={currentTrainingDay}
      lastSessionDate={lastSessionDate}
    />
  )
}
