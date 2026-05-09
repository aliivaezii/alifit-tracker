'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Dumbbell, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { computeStats } from '@/lib/fitness-math'
import { GOAL_LABELS, ACTIVITY_LABELS, type Goal, type ActivityLevel, type Gender } from '@/types'

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  dob: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['male', 'female']),
  weight_kg: z.coerce.number().min(30).max(300),
  height_cm: z.coerce.number().min(100).max(250),
  goal: z.enum(['fat_loss', 'recomposition', 'muscle_gain']),
  activity_level: z.enum(['sedentary', 'lightly_active', 'moderately_active', 'very_active']),
})
type FormData = z.infer<typeof schema>

const SEED_VALUES = {
  name: 'Ali Vaezi',
  dob: '1999-05-09',
  gender: 'male' as Gender,
  weight_kg: 86,
  height_cm: 177,
  goal: 'recomposition' as Goal,
  activity_level: 'moderately_active' as ActivityLevel,
}

export default function OnboardingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [previewStats, setPreviewStats] = useState<ReturnType<typeof computeStats> | null>(null)

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
    defaultValues: SEED_VALUES,
  })

  const watchAll = watch()

  function handlePreview() {
    try {
      const stats = computeStats(
        watchAll.weight_kg,
        watchAll.height_cm,
        watchAll.dob,
        watchAll.gender,
        watchAll.activity_level,
        watchAll.goal
      )
      setPreviewStats(stats)
      setShowPreview(true)
    } catch {
      toast.error('Fill in all fields to preview your stats.')
    }
  }

  async function onSubmit(data: FormData) {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      toast.error('Session expired, please sign in again.')
      router.push('/auth/login')
      return
    }

    const { error } = await supabase.from('profiles').upsert({
      user_id: user.id,
      name: data.name,
      dob: data.dob,
      gender: data.gender,
      weight_kg: data.weight_kg,
      height_cm: data.height_cm,
      goal: data.goal,
      activity_level: data.activity_level,
    })

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    // Seed starting weight log
    await supabase.from('weight_logs').upsert({
      user_id: user.id,
      date: new Date().toISOString().split('T')[0],
      weight_kg: data.weight_kg,
    })

    toast.success('Profile saved! Welcome to AliFit.')
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg space-y-6">
        <div className="flex flex-col items-center gap-2">
          <Dumbbell className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold">Complete your profile</h1>
          <p className="text-muted-foreground text-sm text-center">
            We&apos;ll calculate your personalized targets — BMR, TDEE, macros, and calories.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle>Personal stats</CardTitle>
              <CardDescription>Pre-filled with Ali Vaezi&apos;s data — edit as needed</CardDescription>
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
                  {errors.dob && <p className="text-destructive text-xs">{errors.dob.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Select defaultValue={SEED_VALUES.gender} onValueChange={(v) => setValue('gender', v as Gender)}>
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
                  {errors.weight_kg && <p className="text-destructive text-xs">{errors.weight_kg.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Height (cm)</Label>
                  <Input type="number" {...register('height_cm')} />
                  {errors.height_cm && <p className="text-destructive text-xs">{errors.height_cm.message}</p>}
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Goal</Label>
                  <Select defaultValue={SEED_VALUES.goal} onValueChange={(v) => setValue('goal', v as Goal)}>
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
                  <Select defaultValue={SEED_VALUES.activity_level} onValueChange={(v) => setValue('activity_level', v as ActivityLevel)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.entries(ACTIVITY_LABELS) as [ActivityLevel, string][]).map(([v, l]) => (
                        <SelectItem key={v} value={v}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {showPreview && previewStats && (
                <div className="rounded-lg bg-secondary p-4 space-y-3">
                  <p className="text-sm font-semibold text-primary">Your targets</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>BMI <Badge variant="secondary">{previewStats.bmi}</Badge></div>
                    <div>BMR <Badge variant="secondary">{previewStats.bmr} kcal</Badge></div>
                    <div>TDEE <Badge variant="secondary">{previewStats.tdee} kcal</Badge></div>
                    <div>Daily target <Badge className="bg-primary text-primary-foreground">{previewStats.recommendedCalories} kcal</Badge></div>
                    <div>Protein <Badge variant="secondary">{previewStats.proteinTarget}g</Badge></div>
                    <div>Carbs <Badge variant="secondary">{previewStats.carbTarget}g</Badge></div>
                    <div>Fat <Badge variant="secondary">{previewStats.fatTarget}g</Badge></div>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button type="button" variant="outline" className="w-full" onClick={handlePreview}>
                Preview my targets
              </Button>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Saving…' : 'Save & go to dashboard'}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </div>
  )
}
