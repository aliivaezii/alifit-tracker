import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TrainingAnalyticsClient } from './analytics-client'

export default async function TrainingAnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: sessions } = await supabase
    .from('workout_sessions')
    .select('*, exercise_logs(*)')
    .eq('user_id', user.id)
    .order('date', { ascending: true })

  return <TrainingAnalyticsClient sessions={sessions ?? []} />
}
