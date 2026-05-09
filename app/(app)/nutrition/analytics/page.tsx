import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { computeStats } from '@/lib/fitness-math'
import { NutritionAnalyticsClient } from './nutrition-analytics-client'
import type { Profile } from '@/types'
import { subDays, format } from 'date-fns'

export default async function NutritionAnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('user_id', user.id).single()
  if (!profile) redirect('/auth/onboarding')

  const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd')

  const { data: mealLogs } = await supabase
    .from('meal_logs')
    .select('*, meal_items(*)')
    .eq('user_id', user.id)
    .gte('date', thirtyDaysAgo)
    .order('date', { ascending: true })

  const stats = computeStats(
    profile.weight_kg, profile.height_cm, profile.dob,
    profile.gender, profile.activity_level, profile.goal
  )

  return (
    <NutritionAnalyticsClient
      mealLogs={mealLogs ?? []}
      stats={stats}
      profile={profile as Profile}
    />
  )
}
