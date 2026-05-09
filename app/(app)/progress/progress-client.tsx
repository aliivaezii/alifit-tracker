'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { createClient } from '@/lib/supabase/client'
import type { Profile, WeightLog } from '@/types'
import { TrendingDown, Target, Scale } from 'lucide-react'

interface Props {
  profile: Profile
  weightLogs: WeightLog[]
  userId: string
}

export function ProgressClient({ profile, weightLogs: initialLogs, userId }: Props) {
  const [weightLogs, setWeightLogs] = useState(initialLogs)
  const [newWeight, setNewWeight] = useState('')
  const [logDate, setLogDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [saving, setSaving] = useState(false)

  // Derive start from oldest log; derive goal from healthy BMI 25.5 for user's height
  const START_WEIGHT = Number(initialLogs.at(0)?.weight_kg ?? profile.weight_kg)
  const GOAL_WEIGHT = Math.round(25.5 * Math.pow(profile.height_cm / 100, 2))

  const currentWeight = weightLogs.at(-1)?.weight_kg ?? profile.weight_kg
  const totalLoss = START_WEIGHT - currentWeight
  const remainingLoss = currentWeight - GOAL_WEIGHT
  const progressPct = Math.max(
    0,
    Math.round(((START_WEIGHT - currentWeight) / (START_WEIGHT - GOAL_WEIGHT)) * 100),
  )

  // Estimate weekly loss
  let weeklyLoss = 0
  if (weightLogs.length >= 2) {
    const oldest = weightLogs[0]
    const newest = weightLogs.at(-1)!
    const weeks = (new Date(newest.date).getTime() - new Date(oldest.date).getTime()) / (7 * 24 * 60 * 60 * 1000)
    weeklyLoss = weeks > 0 ? (Number(oldest.weight_kg) - Number(newest.weight_kg)) / weeks : 0
  }
  const estimatedWeeks = weeklyLoss > 0 ? Math.ceil(remainingLoss / weeklyLoss) : null

  const chartData = weightLogs.map((w) => ({
    date: format(new Date(w.date), 'MMM d'),
    weight: w.weight_kg,
  }))

  async function logWeight() {
    if (!newWeight) return
    setSaving(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('weight_logs')
      .upsert({ user_id: userId, date: logDate, weight_kg: parseFloat(newWeight) })
      .select()
      .single()

    if (error || !data) { toast.error(error?.message ?? 'Error'); setSaving(false); return }

    setWeightLogs((prev) => {
      const filtered = prev.filter((w) => w.date !== logDate)
      return [...filtered, data as WeightLog].sort((a, b) => a.date.localeCompare(b.date))
    })
    toast.success('Weight logged!')
    setNewWeight('')
    setSaving(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Progress Tracker</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Start: {START_WEIGHT} kg &rarr; Current: {currentWeight} kg &rarr; Goal: {GOAL_WEIGHT} kg
        </p>
      </div>

      {/* Progress bar */}
      <Card className="border-primary/30">
        <CardContent className="pt-5 pb-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">{START_WEIGHT} kg (start)</span>
            <span className="font-semibold text-primary">{currentWeight} kg</span>
            <span className="text-muted-foreground">{GOAL_WEIGHT} kg (goal)</span>
          </div>
          <Progress value={progressPct} className="h-3" />
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>−{totalLoss.toFixed(1)} kg lost</span>
            <span>{progressPct}% to goal</span>
            <span>{remainingLoss.toFixed(1)} kg to go</span>
          </div>
        </CardContent>
      </Card>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <Scale className="h-4 w-4 text-muted-foreground mb-1" />
            <p className="text-2xl font-bold">{currentWeight}</p>
            <p className="text-xs text-muted-foreground">Current (kg)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <TrendingDown className="h-4 w-4 text-primary mb-1" />
            <p className="text-2xl font-bold text-primary">−{totalLoss.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">kg lost total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <Target className="h-4 w-4 text-amber-400 mb-1" />
            <p className="text-2xl font-bold">{remainingLoss.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">kg to goal</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold">
              {estimatedWeeks ? `~${estimatedWeeks}w` : '--'}
            </p>
            <p className="text-xs text-muted-foreground">est. to goal</p>
          </CardContent>
        </Card>
      </div>

      {/* Log weight */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Log Today&apos;s Weight</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 items-end">
            <div className="space-y-1">
              <Label className="text-xs">Date</Label>
              <Input type="date" value={logDate} onChange={(e) => setLogDate(e.target.value)} className="w-40" />
            </div>
            <div className="space-y-1 flex-1">
              <Label className="text-xs">Weight (kg)</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="86.5"
                value={newWeight}
                onChange={(e) => setNewWeight(e.target.value)}
              />
            </div>
            <Button onClick={logWeight} disabled={!newWeight || saving}>
              {saving ? 'Saving…' : 'Log'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Weight chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Weight History</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length > 1 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
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
                <ReferenceLine y={GOAL_WEIGHT} stroke="#f59e0b" strokeDasharray="4 2" label={{ value: `Goal ${GOAL_WEIGHT}kg`, fill: '#f59e0b', fontSize: 11 }} />
                <Line type="monotone" dataKey="weight" stroke="#10b981" strokeWidth={2} dot={{ r: 3, fill: '#10b981' }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">
              Log at least 2 weight entries to see your trend
            </div>
          )}
        </CardContent>
      </Card>

      {/* History table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Weight Log History</CardTitle>
        </CardHeader>
        <CardContent>
          {weightLogs.length === 0 ? (
            <p className="text-muted-foreground text-sm">No weight logs yet.</p>
          ) : (
            <div className="divide-y divide-border">
              {[...weightLogs].reverse().slice(0, 30).map((w) => {
                const idx = weightLogs.findIndex((x) => x.id === w.id)
                const prev = idx > 0 ? weightLogs[idx - 1] : null
                const diff = prev ? Number(w.weight_kg) - Number(prev.weight_kg) : null
                return (
                  <div key={w.id} className="py-2 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{format(new Date(w.date), 'EEE, MMM d yyyy')}</span>
                    <div className="flex items-center gap-3">
                      {diff !== null && (
                        <span className={`text-xs ${diff < 0 ? 'text-primary' : diff > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                          {diff > 0 ? '+' : ''}{diff.toFixed(1)} kg
                        </span>
                      )}
                      <span className="font-medium">{w.weight_kg} kg</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
