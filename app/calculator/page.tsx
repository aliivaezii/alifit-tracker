'use client'

import { useState } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { Dumbbell, Calculator } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { computeStats } from '@/lib/fitness-math'
import { GOAL_LABELS, ACTIVITY_LABELS, type Goal, type ActivityLevel, type Gender, type ComputedStats } from '@/types'

const schema = z.object({
  weight_kg: z.coerce.number().min(30).max(300),
  height_cm: z.coerce.number().min(100).max(250),
  age: z.coerce.number().min(10).max(100),
  gender: z.enum(['male', 'female']),
  goal: z.enum(['fat_loss', 'recomposition', 'muscle_gain']),
  activity_level: z.enum(['sedentary', 'lightly_active', 'moderately_active', 'very_active']),
})
type FormData = z.infer<typeof schema>

export default function CalorieCalculatorPage() {
  const [result, setResult] = useState<ComputedStats | null>(null)

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
    defaultValues: {
      weight_kg: 86,
      height_cm: 177,
      age: 26,
      gender: 'male',
      goal: 'recomposition',
      activity_level: 'moderately_active',
    },
  })

  function onSubmit(data: FormData) {
    // Build a fake DOB from age for computeStats compatibility
    const fakeDob = `${new Date().getFullYear() - data.age}-01-01`
    const stats = computeStats(data.weight_kg, data.height_cm, fakeDob, data.gender, data.activity_level, data.goal)
    setResult(stats)
  }

  return (
    <div className="min-h-screen flex items-start justify-center px-4 py-12">
      <div className="w-full max-w-lg space-y-6">
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2">
            <Calculator className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold tracking-tight">Calorie Calculator</span>
          </div>
          <p className="text-muted-foreground text-sm text-center">
            Free BMR/TDEE calculator -- no account required
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle>Your stats</CardTitle>
              <CardDescription>Enter your details to get personalized targets</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
                <div className="space-y-2">
                  <Label>Age</Label>
                  <Input type="number" {...register('age')} />
                  {errors.age && <p className="text-destructive text-xs">{errors.age.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Select defaultValue="male" onValueChange={(v) => setValue('gender', v as Gender)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Goal</Label>
                  <Select defaultValue="recomposition" onValueChange={(v) => setValue('goal', v as Goal)}>
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
                  <Select defaultValue="moderately_active" onValueChange={(v) => setValue('activity_level', v as ActivityLevel)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.entries(ACTIVITY_LABELS) as [ActivityLevel, string][]).map(([v, l]) => (
                        <SelectItem key={v} value={v}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" className="w-full">Calculate</Button>
            </CardContent>
          </Card>
        </form>

        {result && (
          <Card className="border-primary/40">
            <CardHeader>
              <CardTitle className="text-primary">Your Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'BMI', value: result.bmi, unit: '' },
                  { label: 'BMR', value: result.bmr, unit: 'kcal/day' },
                  { label: 'TDEE', value: result.tdee, unit: 'kcal/day' },
                  { label: 'Daily Target', value: result.recommendedCalories, unit: 'kcal', highlight: true },
                ].map(({ label, value, unit, highlight }) => (
                  <div key={label} className={`p-3 rounded-lg ${highlight ? 'bg-primary/10 border border-primary/30' : 'bg-secondary'}`}>
                    <p className={`text-xl font-bold ${highlight ? 'text-primary' : ''}`}>{value}</p>
                    <p className="text-xs text-muted-foreground">{label} {unit && `(${unit})`}</p>
                  </div>
                ))}
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Daily Macro Targets</p>
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-emerald-500/20 text-emerald-400">Protein: {result.proteinTarget}g</Badge>
                  <Badge className="bg-blue-500/20 text-blue-400">Carbs: {result.carbTarget}g</Badge>
                  <Badge className="bg-amber-500/20 text-amber-400">Fat: {result.fatTarget}g</Badge>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                BMR calculated using Mifflin-St Jeor equation. Macros: 2g protein/kg, 0.8g fat/kg, remaining calories from carbs.
              </p>

              <Button asChild variant="outline" className="w-full">
                <Link href="/auth/signup">
                  <Dumbbell className="h-4 w-4 mr-2" />
                  Save to my AliFit profile
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        <p className="text-center text-xs text-muted-foreground">
          <Link href="/auth/login" className="text-primary hover:underline">Sign in</Link>
          {' '}to access your full fitness dashboard
        </p>
      </div>
    </div>
  )
}
