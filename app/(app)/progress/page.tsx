import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProgressClient } from './progress-client'
import type { Profile, WeightLog } from '@/types'

export default async function ProgressPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('user_id', user.id).single()
  if (!profile) redirect('/auth/onboarding')

  const { data: weightLogs } = await supabase
    .from('weight_logs')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: true })

  return (
    <ProgressClient
      profile={profile as Profile}
      weightLogs={(weightLogs ?? []) as WeightLog[]}
      userId={user.id}
    />
  )
}
