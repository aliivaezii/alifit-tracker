'use client'

import Link from 'next/link'
import { format } from 'date-fns'
import { PlusCircle, Flame, Dumbbell, TrendingUp, Activity } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import type { Profile, WeightLog, ComputedStats } from '@/types'
import type { TrainingDay } from '@/lib/training-plan'
import { GOAL_LABELS } from '@/types'

interface Props {
  profile: Profile
  stats: ComputedStats
  todayMacros: { calories: number; protein: number; carbs: number; fat: number }
  weightLogs: WeightLog[]
  currentTrainingDay: TrainingDay
  lastSessionDate: string | null
}

const MACRO_COLORS = {
  protein: '#10b981',
  carbs: '#3b82f6',
  fat: '#f59e0b',
}

export function DashboardClient({ profile, stats, todayMacros, weightLogs, currentTrainingDay, lastSessionDate }: Props) {
  const calorieProgress = Math.min(100, (todayMacros.calories / stats.recommendedCalories) * 100)
  const remaining = Math.max(0, stats.recommendedCalories - todayMacros.calories)

  const pieData = [
    { name: 'Consumed', value: todayMacros.calories, fill: '#10b981' },
    { name: 'Remaining', value: remaining, fill: '#1e293b' },
  ]

  const weightData = weightLogs.map((w) => ({
    date: format(new Date(w.date), 'MMM d'),
    weight: w.weight_kg,
  }))

  const latestWeight = weightLogs.at(-1)?.weight_kg ?? profile.weight_kg

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Hey, {profile.name.split(' ')[0]} 👋
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {format(new Date(), 'EEEE, MMMM d')} · {GOAL_LABELS[profile.goal]}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild size="sm">
            <Link href="/nutrition/log"><PlusCircle className="h-4 w-4 mr-1" />Log Meal</Link>
          </Button>
          <Button asChild size="sm" variant="secondary">
            <Link href="/training/log"><Dumbbell className="h-4 w-4 mr-1" />Log Workout</Link>
          </Button>
        </div>
      </div>

      {/* Today's Training Day */}
      <Card className={currentTrainingDay.isRest ? 'border-muted' : 'border-primary/30'}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Dumbbell className="h-4 w-4" />
            Today&apos;s Training
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold">Day {currentTrainingDay.dayNumber} — {currentTrainingDay.name}</p>
              <p className="text-sm text-muted-foreground">{currentTrainingDay.focus}</p>
            </div>
            {!currentTrainingDay.isRest && (
              <Button asChild size="sm">
                <Link href={`/training/log?day=${currentTrainingDay.dayNumber}`}>Start</Link>
              </Button>
            )}
            {currentTrainingDay.isRest && <Badge variant="secondary">Rest day</Badge>}
          </div>
        </CardContent>
      </Card>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Activity className="h-3 w-3" />BMI
            </div>
            <p className="text-2xl font-bold">{stats.bmi}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Flame className="h-3 w-3" />TDEE
            </div>
            <p className="text-2xl font-bold">{stats.tdee}</p>
            <p className="text-xs text-muted-foreground">kcal/day</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-muted-foreground text-xs mb-1">Current weight</div>
            <p className="text-2xl font-bold">{latestWeight}<span className="text-sm font-normal text-muted-foreground"> kg</span></p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-muted-foreground text-xs mb-1">Calorie target</div>
            <p className="text-2xl font-bold">{stats.recommendedCalories}</p>
            <p className="text-xs text-muted-foreground">kcal/day</p>
          </CardContent>
        </Card>
      </div>

      {/* Calorie ring + macro bars */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Today&apos;s Calories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="relative">
                <PieChart width={120} height={120}>
                  <Pie
                    data={pieData}
                    cx={55}
                    cy={55}
                    innerRadius={38}
                    outerRadius={55}
                    startAngle={90}
                    endAngle={-270}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-lg font-bold">{Math.round(todayMacros.calories)}</span>
                  <span className="text-xs text-muted-foreground">kcal</span>
                </div>
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Consumed</span><span>{Math.round(todayMacros.calories)} / {stats.recommendedCalories}</span>
                </div>
                <Progress value={calorieProgress} className="h-2" />
                <p className="text-xs text-muted-foreground">{remaining > 0 ? `${Math.round(remaining)} kcal remaining` : 'Goal reached!'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Macros Today</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: 'Protein', consumed: todayMacros.protein, target: stats.proteinTarget, color: MACRO_COLORS.protein },
              { label: 'Carbs', consumed: todayMacros.carbs, target: stats.carbTarget, color: MACRO_COLORS.carbs },
              { label: 'Fat', consumed: todayMacros.fat, target: stats.fatTarget, color: MACRO_COLORS.fat },
            ].map(({ label, consumed, target, color }) => (
              <div key={label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium" style={{ color }}>{label}</span>
                  <span className="text-muted-foreground">{Math.round(consumed)}g / {target}g</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (consumed / target) * 100)}%`, backgroundColor: color }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Weight trend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Weight Trend — Last 30 Days
          </CardTitle>
        </CardHeader>
        <CardContent>
          {weightData.length > 1 ? (
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={weightData}>
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis
                  domain={['dataMin - 1', 'dataMax + 1']}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={false}
                  width={36}
                />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8, fontSize: 12 }}
                  formatter={(v) => [`${v as number} kg`, 'Weight']}
                />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: '#10b981' }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">
              Log your weight daily to see the trend
            </div>
          )}
          <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
            <span>Start: {weightLogs.at(0)?.weight_kg ?? profile.weight_kg} kg</span>
            <span>Current: {latestWeight} kg</span>
            <span>Goal: {Math.round(25.5 * Math.pow(profile.height_cm / 100, 2))} kg</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
