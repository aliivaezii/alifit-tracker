'use client'

import { useMemo } from 'react'
import { format, subDays, eachDayOfInterval } from 'date-fns'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, ReferenceLine,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ComputedStats, Profile } from '@/types'

interface MealItem {
  calories: number
  protein: number
  carbs: number
  fat: number
}

interface MealLog {
  date: string
  meal_items: MealItem[]
}

interface Props {
  mealLogs: MealLog[]
  stats: ComputedStats
  profile: Profile
}

export function NutritionAnalyticsClient({ mealLogs, stats }: Props) {
  // Aggregate by date
  const byDate = useMemo(() => {
    const map: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {}
    for (const log of mealLogs) {
      if (!map[log.date]) map[log.date] = { calories: 0, protein: 0, carbs: 0, fat: 0 }
      for (const item of log.meal_items ?? []) {
        map[log.date].calories += item.calories
        map[log.date].protein += item.protein
        map[log.date].carbs += item.carbs
        map[log.date].fat += item.fat
      }
    }
    return map
  }, [mealLogs])

  // 7-day chart
  const last7Days = eachDayOfInterval({ start: subDays(new Date(), 6), end: new Date() }).map((d) => {
    const key = format(d, 'yyyy-MM-dd')
    const data = byDate[key]
    return {
      date: format(d, 'EEE'),
      calories: data ? Math.round(data.calories) : 0,
      target: stats.recommendedCalories,
    }
  })

  // 30-day protein line chart
  const last30Days = eachDayOfInterval({ start: subDays(new Date(), 29), end: new Date() }).map((d) => {
    const key = format(d, 'yyyy-MM-dd')
    const data = byDate[key]
    return {
      date: format(d, 'MMM d'),
      protein: data ? Math.round(data.protein) : 0,
    }
  })

  // Today's macro pie
  const today = format(new Date(), 'yyyy-MM-dd')
  const todayData = byDate[today] ?? { calories: 0, protein: 0, carbs: 0, fat: 0 }
  const macroCalories = {
    protein: todayData.protein * 4,
    carbs: todayData.carbs * 4,
    fat: todayData.fat * 9,
  }
  const pieData = [
    { name: 'Protein', value: macroCalories.protein, fill: '#10b981' },
    { name: 'Carbs', value: macroCalories.carbs, fill: '#3b82f6' },
    { name: 'Fat', value: macroCalories.fat, fill: '#f59e0b' },
  ].filter((d) => d.value > 0)

  // Weekly average
  const last7DaysData = Object.entries(byDate)
    .filter(([date]) => date >= format(subDays(new Date(), 6), 'yyyy-MM-dd'))
    .map(([, v]) => v)

  const weekAvg = last7DaysData.length
    ? {
        calories: Math.round(last7DaysData.reduce((s, v) => s + v.calories, 0) / last7DaysData.length),
        protein: Math.round(last7DaysData.reduce((s, v) => s + v.protein, 0) / last7DaysData.length),
        carbs: Math.round(last7DaysData.reduce((s, v) => s + v.carbs, 0) / last7DaysData.length),
        fat: Math.round(last7DaysData.reduce((s, v) => s + v.fat, 0) / last7DaysData.length),
      }
    : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Nutrition Analytics</h1>
        <p className="text-muted-foreground text-sm mt-1">Calorie intake, macro split, and protein tracking</p>
      </div>

      {/* 7-day calorie bar chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Calorie Intake — Last 7 Days</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={last7Days}>
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} width={36} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8, fontSize: 12 }}
                formatter={(v) => [`${v as number} kcal`]}
              />
              <ReferenceLine y={stats.recommendedCalories} stroke="#10b981" strokeDasharray="4 2" strokeOpacity={0.7} />
              <Bar dataKey="calories" fill="#10b981" radius={[4, 4, 0, 0]} opacity={0.85} />
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs text-muted-foreground mt-1">Green dashed line = calorie target ({stats.recommendedCalories} kcal)</p>
        </CardContent>
      </Card>

      {/* Today macro pie + weekly avg */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Today&apos;s Macro Split</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <div className="flex items-center gap-4">
                <PieChart width={120} height={120}>
                  <Pie data={pieData} cx={55} cy={55} innerRadius={35} outerRadius={55} dataKey="value" strokeWidth={0}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                </PieChart>
                <div className="space-y-2 text-sm">
                  {pieData.map((d) => (
                    <div key={d.name} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.fill }} />
                      <span>{d.name}</span>
                      <span className="text-muted-foreground text-xs">{Math.round(d.value)} kcal</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm py-8 text-center">No meals logged today</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Weekly Average vs Target</CardTitle>
          </CardHeader>
          <CardContent>
            {weekAvg ? (
              <div className="space-y-3">
                {[
                  { label: 'Calories', avg: weekAvg.calories, target: stats.recommendedCalories, unit: 'kcal', color: '#10b981' },
                  { label: 'Protein', avg: weekAvg.protein, target: stats.proteinTarget, unit: 'g', color: '#3b82f6' },
                  { label: 'Carbs', avg: weekAvg.carbs, target: stats.carbTarget, unit: 'g', color: '#f59e0b' },
                  { label: 'Fat', avg: weekAvg.fat, target: stats.fatTarget, unit: 'g', color: '#ef4444' },
                ].map(({ label, avg, target, unit, color }) => {
                  const pct = Math.round((avg / target) * 100)
                  return (
                    <div key={label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span style={{ color }}>{label}</span>
                        <span className="text-muted-foreground">{avg} / {target} {unit} ({pct}%)</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-1.5">
                        <div className="h-1.5 rounded-full" style={{ width: `${Math.min(100, pct)}%`, backgroundColor: color }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm py-8 text-center">Log meals to see weekly stats</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 30-day protein chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Daily Protein — Last 30 Days</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={last30Days}>
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} interval={6} />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} width={36} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8, fontSize: 12 }}
                formatter={(v) => [`${v as number}g`, 'Protein']}
              />
              <ReferenceLine y={stats.proteinTarget} stroke="#3b82f6" strokeDasharray="4 2" strokeOpacity={0.7} />
              <Line type="monotone" dataKey="protein" stroke="#3b82f6" strokeWidth={1.5} dot={false} activeDot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-xs text-muted-foreground mt-1">Blue dashed = protein target ({stats.proteinTarget}g)</p>
        </CardContent>
      </Card>
    </div>
  )
}
