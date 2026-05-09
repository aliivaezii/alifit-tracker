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
})
type FormData = z.infer<typeof schema>

export function SettingsClient({ profile, email }: { profile: Profile; email: string }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [currentStats] = useState(() => computeStats(
    profile.weight_kg, profile.height_cm, profile.dob, profile.gender, profile.activity_level, profile.goal
  ))

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
      })
      .eq('user_id', profile.user_id)

    if (error) { toast.error(error.message); setSaving(false); return }
    toast.success('Profile updated -- targets recalculated')
    setSaving(false)
    router.refresh()
  }

  async function deleteAccount() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
    toast.success('Account deleted. Data removed.')
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
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</Button>
          </CardFooter>
        </Card>
      </form>

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
                  <AlertDialogAction onClick={deleteAccount} className="bg-destructive text-destructive-foreground">
                    Delete my account
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
