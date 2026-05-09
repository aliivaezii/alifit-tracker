import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CalorieCalculatorApp } from './calculator-client'
import type { Profile } from '@/types'

export default async function NutritionCalculatorPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!profile) redirect('/auth/onboarding')

  return <CalorieCalculatorApp profile={profile as Profile} userId={user.id} />
}
