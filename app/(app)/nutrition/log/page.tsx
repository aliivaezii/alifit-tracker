import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { computeStats } from '@/lib/fitness-math'
import { NutritionLogClient } from './nutrition-log-client'
import type { Food, MealLog, Profile } from '@/types'

export default async function NutritionLogPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('user_id', user.id).single()

  if (!profile) redirect('/auth/onboarding')

  const today = new Date().toISOString().split('T')[0]

  const [{ data: foods }, { data: mealLogs }] = await Promise.all([
    supabase.from('foods').select('*').order('name'),
    supabase
      .from('meal_logs')
      .select('*, meal_items(*, food:foods(*))')
      .eq('user_id', user.id)
      .eq('date', today),
  ])

  const stats = computeStats(
    profile.weight_kg, profile.height_cm, profile.dob,
    profile.gender, profile.activity_level, profile.goal
  )

  return (
    <NutritionLogClient
      foods={(foods ?? []) as Food[]}
      initialMealLogs={(mealLogs ?? []) as MealLog[]}
      stats={stats}
      userId={user.id}
      today={today}
      profile={profile as Profile}
    />
  )
}
