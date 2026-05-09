'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { computeStats } from '@/lib/fitness-math'
import { GOAL_LABELS, ACTIVITY_LABELS, type Goal, type ActivityLevel, type Gender, type Profile } from '@/types'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Download } from 'lucide-react'

const schema = z.object({
  name: z.string().min(2),
  dob: z.string().min(1),
  gender: z.enum(['male', 'female']),
  weight_kg: z.coerce.number().min(30).max(300),
  height_cm: z.coerce.number().min(100).max(250),
  goal: z.enum(['fat_loss', 'recomposition', 'muscle_gain']),
  activity_level: z.enum(['sedentary', 'lightly_active', 'moderately_active', 'very_active']),
  goal_weight_kg: z.coerce.number().min(40).max(300),
})
type FormData = z.infer<typeof schema>

export function SettingsClient({ profile, email }: { profile: Profile; email: string }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [currentStats] = useState(() => computeStats(
    profile.weight_kg, profile.height_cm, profile.dob, profile.gender, profile.activity_level, profile.goal
  ))

  const defaultGoalWeight = profile.goal_weight_kg ?? Math.round(25.5 * Math.pow(profile.height_cm / 100, 2))

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
    defaultValues: {
      name: profile.name,
      dob: profile.dob,
      gender: profile.gender,
      weight_kg: profile.weight_kg,
      height_cm: profile.height_cm,
      goal: profile.goal,
      activity_level: profile.activity_level,
      goal_weight_kg: defaultGoalWeight,
    },
  })

  const watchAll = watch()
  const previewStats = (() => {
    try {
      return computeStats(watchAll.weight_kg, watchAll.height_cm, watchAll.dob, watchAll.gender, watchAll.activity_level, watchAll.goal)
    } catch { return null }
  })()

  async function onSubmit(data: FormData) {
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update({
        name: data.name,
        dob: data.dob,
        gender: data.gender,
        weight_kg: data.weight_kg,
        height_cm: data.height_cm,
        goal: data.goal,
        activity_level: data.activity_level,
        goal_weight_kg: data.goal_weight_kg,
      })
      .eq('user_id', profile.user_id)

    if (error) { toast.error(error.message); setSaving(false); return }
    toast.success('Profile updated -- targets recalculated')
    setSaving(false)
    router.refresh()
  }

  async function deleteAccount() {
    setDeleting(true)
    const supabase = createClient()

    // Delete all user data in dependency order (child rows first)
    const { data: mealLogIds } = await supabase
      .from('meal_logs')
      .select('id')
      .eq('user_id', profile.user_id)

    if (mealLogIds && mealLogIds.length > 0) {
      const ids = mealLogIds.map((r) => r.id)
      const { error } = await supabase.from('meal_items').delete().in('meal_log_id', ids)
      if (error) { toast.error('Failed to delete meal items: ' + error.message); setDeleting(false); return }
    }

    const { error: mlErr } = await supabase.from('meal_logs').delete().eq('user_id', profile.user_id)
    if (mlErr) { toast.error('Failed to delete meal logs: ' + mlErr.message); setDeleting(false); return }

    const { data: sessionIds } = await supabase
      .from('workout_sessions')
      .select('id')
      .eq('user_id', profile.user_id)

    if (sessionIds && sessionIds.length > 0) {
      const ids = sessionIds.map((r) => r.id)
      const { error } = await supabase.from('exercise_logs').delete().in('session_id', ids)
      if (error) { toast.error('Failed to delete exercise logs: ' + error.message); setDeleting(false); return }
    }

    const { error: wsErr } = await supabase.from('workout_sessions').delete().eq('user_id', profile.user_id)
    if (wsErr) { toast.error('Failed to delete workout sessions: ' + wsErr.message); setDeleting(false); return }

    const { error: wlErr } = await supabase.from('weight_logs').delete().eq('user_id', profile.user_id)
    if (wlErr) { toast.error('Failed to delete weight logs: ' + wlErr.message); setDeleting(false); return }

    const { error: profErr } = await supabase.from('profiles').delete().eq('user_id', profile.user_id)
    if (profErr) { toast.error('Failed to delete profile: ' + profErr.message); setDeleting(false); return }

    // Delete auth user via API route (requires service role key server-side)
    const res = await fetch('/api/delete-account', { method: 'POST' })
    if (!res.ok) {
      // Auth user deletion failed but data is gone -- still sign out
      console.error('Auth user deletion failed, but data was deleted')
    }

    await supabase.auth.signOut()
    router.push('/auth/login')
    toast.success('Account and all data deleted.')
  }

  async function exportData(format: 'csv' | 'json') {
    setExporting(true)
    const supabase = createClient()
    const today = new Date().toISOString().slice(0, 10)

    const [{ data: weightLogs }, { data: sessions }, { data: mealLogs }, { data: mealItems }] = await Promise.all([
      supabase.from('weight_logs').select('*').eq('user_id', profile.user_id).order('date'),
      supabase.from('workout_sessions').select('*').eq('user_id', profile.user_id).order('date'),
      supabase.from('meal_logs').select('*').eq('user_id', profile.user_id).order('date'),
      supabase.from('meal_items').select('*'),
    ])

    // Fetch exercise_logs for all sessions
    const sessionIds = (sessions ?? []).map((s) => s.id)
    const { data: exerciseLogs } = sessionIds.length > 0
      ? await supabase.from('exercise_logs').select('*').in('session_id', sessionIds)
      : { data: [] }

    if (format === 'json') {
      const payload = {
        exported_at: new Date().toISOString(),
        weight_logs: weightLogs ?? [],
        workout_sessions: sessions ?? [],
        exercise_logs: exerciseLogs ?? [],
        meal_logs: mealLogs ?? [],
        meal_items: mealItems ?? [],
      }
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `alifit_export_${today}.json`
      a.click()
      URL.revokeObjectURL(url)
    } else {
      const { default: JSZip } = await import('jszip')
      const zip = new JSZip()

      const toCsv = (rows: Record<string, unknown>[] | null) => {
        if (!rows || rows.length === 0) return ''
        const keys = Object.keys(rows[0])
        return [keys.join(','), ...rows.map((r) => keys.map((k) => JSON.stringify(r[k] ?? '')).join(','))].join('\n')
      }

      zip.file('weight_logs.csv', toCsv(weightLogs))
      zip.file('workout_sessions.csv', toCsv(sessions))
      zip.file('exercise_logs.csv', toCsv(exerciseLogs))
      zip.file('meal_logs.csv', toCsv(mealLogs))
      zip.file('meal_items.csv', toCsv(mealItems))

      const blob = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `alifit_export_${today}.zip`
      a.click()
      URL.revokeObjectURL(url)
    }

    setExporting(false)
    toast.success(`Data exported as ${format.toUpperCase()}`)
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Signed in as {email}</p>
      </div>

      {/* Current targets */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Current Targets</CardTitle>
          <CardDescription>Recalculated from your latest profile</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-primary/20 text-primary">{currentStats.recommendedCalories} kcal</Badge>
            <Badge variant="secondary">P: {currentStats.proteinTarget}g</Badge>
            <Badge variant="secondary">C: {currentStats.carbTarget}g</Badge>
            <Badge variant="secondary">F: {currentStats.fatTarget}g</Badge>
            <Badge variant="secondary">BMR: {currentStats.bmr} kcal</Badge>
            <Badge variant="secondary">TDEE: {currentStats.tdee} kcal</Badge>
            <Badge variant="secondary">BMI: {currentStats.bmi}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Edit profile form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Edit Profile</CardTitle>
            <CardDescription>Changes recalculate all your targets automatically</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label>Full name</Label>
                <Input {...register('name')} />
                {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Date of birth</Label>
                <Input type="date" {...register('dob')} />
              </div>
              <div className="space-y-2">
                <Label>Gender</Label>
                <Select defaultValue={profile.gender} onValueChange={(v) => setValue('gender', v as Gender)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Weight (kg)</Label>
                <Input type="number" step="0.1" {...register('weight_kg')} />
              </div>
              <div className="space-y-2">
                <Label>Height (cm)</Label>
                <Input type="number" {...register('height_cm')} />
              </div>
              <div className="space-y-2">
                <Label>Goal weight (kg)</Label>
                <Input type="number" step="0.1" {...register('goal_weight_kg')} />
                {errors.goal_weight_kg && <p className="text-destructive text-xs">{errors.goal_weight_kg.message}</p>}
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Goal</Label>
                <Select defaultValue={profile.goal} onValueChange={(v) => setValue('goal', v as Goal)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.entries(GOAL_LABELS) as [Goal, string][]).map(([v, l]) => (
                      <SelectItem key={v} value={v}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Activity level</Label>
                <Select defaultValue={profile.activity_level} onValueChange={(v) => setValue('activity_level', v as ActivityLevel)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.entries(ACTIVITY_LABELS) as [ActivityLevel, string][]).map(([v, l]) => (
                      <SelectItem key={v} value={v}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {previewStats && (
              <div className="rounded-lg bg-secondary p-3 text-xs space-y-1">
                <p className="font-medium text-primary">Updated targets preview</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  <Badge className="bg-primary/20 text-primary text-xs">{previewStats.recommendedCalories} kcal</Badge>
                  <Badge variant="secondary" className="text-xs">P: {previewStats.proteinTarget}g</Badge>
                  <Badge variant="secondary" className="text-xs">C: {previewStats.carbTarget}g</Badge>
                  <Badge variant="secondary" className="text-xs">F: {previewStats.fatTarget}g</Badge>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save changes'}</Button>
          </CardFooter>
        </Card>
      </form>

      {/* Data export */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export My Data
          </CardTitle>
          <CardDescription>Download all your data as CSV (ZIP) or JSON</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Button variant="outline" size="sm" disabled={exporting} onClick={() => exportData('csv')}>
              {exporting ? 'Exporting...' : 'Export as CSV (ZIP)'}
            </Button>
            <Button variant="outline" size="sm" disabled={exporting} onClick={() => exportData('json')}>
              {exporting ? 'Exporting...' : 'Export as JSON'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-sm text-destructive">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Delete account</p>
              <p className="text-xs text-muted-foreground">Permanently remove your account and all data</p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger render={<Button variant="destructive" size="sm" />}>
                Delete
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete your account and all associated data. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={deleteAccount}
                    className="bg-destructive text-destructive-foreground"
                    disabled={deleting}
                  >
                    {deleting ? 'Deleting...' : 'Delete my account'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
