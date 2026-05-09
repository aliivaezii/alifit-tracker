'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format, differenceInDays } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import type { WorkoutSession } from '@/types'

interface ExerciseWeight {
  name: string
  lastWeight: number
  deloadWeight: number
}

export default function DeloadPage() {
  const [exerciseWeights, setExerciseWeights] = useState<ExerciseWeight[]>([])
  const [mesocycleWeek, setMesocycleWeek] = useState(1)
  const [isDeloadWeek, setIsDeloadWeek] = useState(false)
  const [sessionCount, setSessionCount] = useState(0)
  const [marking, setMarking] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [{ data: allSessions }, { data: recentLogs }] = await Promise.all([
      supabase
        .from('workout_sessions')
        .select('id, date, is_deload')
        .eq('user_id', user.id)
        .order('date', { ascending: true }),
      supabase
        .from('exercise_logs')
        .select('exercise_name, weight_kg, workout_sessions!inner(user_id)')
        .eq('workout_sessions.user_id', user.id)
        .eq('completed', true)
        .order('created_at', { ascending: false }),
    ])

    const sessions = (allSessions ?? []) as Pick<WorkoutSession, 'id' | 'date' | 'is_deload'>[]
    setSessionCount(sessions.length)

    if (sessions.length > 0) {
      const week = computeMesocycleWeek(sessions)
      setMesocycleWeek(week)
      const hasCurrentDeload = sessions.some(
        (s) => s.is_deload && differenceInDays(new Date(), new Date(s.date)) < 7
      )
      setIsDeloadWeek(week === 4 || hasCurrentDeload)
    }

    const lastWeights: Record<string, number> = {}
    for (const log of recentLogs ?? []) {
      if (!(log.exercise_name in lastWeights)) {
        lastWeights[log.exercise_name] = log.weight_kg
      }
    }
    setExerciseWeights(
      Object.entries(lastWeights).map(([name, weight]) => ({
        name,
        lastWeight: weight,
        deloadWeight: Math.round(weight * 0.55 * 2) / 2,
      }))
    )
    setLoading(false)
  }

  // Group sessions into mesocycles: a new cycle begins after a 5+ day gap or after an is_deload session.
  // Count 7-day windows from current cycle start to determine week number.
  function computeMesocycleWeek(sessions: Pick<WorkoutSession, 'date' | 'is_deload'>[]): number {
    if (sessions.length === 0) return 1

    let cycleStart = new Date(sessions[0].date)
    for (let i = 1; i < sessions.length; i++) {
      const gap = differenceInDays(new Date(sessions[i].date), new Date(sessions[i - 1].date))
      if (gap >= 5 || sessions[i - 1].is_deload) {
        cycleStart = new Date(sessions[i].date)
      }
    }

    const daysSinceCycleStart = differenceInDays(new Date(), cycleStart)
    const week = Math.floor(daysSinceCycleStart / 7) + 1
    return Math.min(4, Math.max(1, week))
  }

  async function markCurrentWeekAsDeload() {
    setMarking(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setMarking(false); return }

    const sevenDaysAgo = format(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')
    const { error } = await supabase
      .from('workout_sessions')
      .update({ is_deload: true })
      .eq('user_id', user.id)
      .gte('date', sevenDaysAgo)

    if (error) { toast.error(error.message); setMarking(false); return }
    toast.success('Current week marked as deload. New cycle starts from your next session.')
    setIsDeloadWeek(true)
    setMarking(false)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Deload Tracker</h1>
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Deload Tracker</h1>
        <p className="text-muted-foreground text-sm mt-1">4-week mesocycle management</p>
      </div>

      <Card className={isDeloadWeek ? 'border-amber-500/40' : 'border-primary/30'}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isDeloadWeek
              ? <AlertTriangle className="h-5 w-5 text-amber-400" />
              : <RefreshCw className="h-5 w-5 text-primary" />}
            Mesocycle Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold">
                Week {mesocycleWeek} <span className="text-muted-foreground text-lg font-normal">/ 4</span>
              </p>
              {isDeloadWeek ? (
                <p className="text-amber-400 font-medium mt-1">Deload week -- reduce intensity to 50-60%</p>
              ) : (
                <p className="text-muted-foreground mt-1">
                  {4 - mesocycleWeek} week{4 - mesocycleWeek !== 1 ? 's' : ''} until next deload
                </p>
              )}
              {sessionCount > 0 && (
                <p className="text-xs text-muted-foreground mt-1">Based on {sessionCount} logged sessions</p>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge className={isDeloadWeek ? 'bg-amber-500/20 text-amber-400' : 'bg-primary/20 text-primary'}>
                {isDeloadWeek ? 'DELOAD' : 'LOADING'}
              </Badge>
              {!isDeloadWeek && (
                <Button size="sm" variant="outline" disabled={marking} onClick={markCurrentWeekAsDeload}>
                  {marking ? 'Marking...' : 'Mark as Deload'}
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Mesocycle progress</span>
              <span>Week {mesocycleWeek}/4</span>
            </div>
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((w) => (
                <div
                  key={w}
                  className={`flex-1 h-3 rounded-sm transition-colors ${
                    w === 4 ? 'bg-amber-500/40' :
                    w < mesocycleWeek ? 'bg-primary' :
                    w === mesocycleWeek ? 'bg-primary/60' :
                    'bg-secondary'
                  }`}
                />
              ))}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>W1 Load</span><span>W2 Load</span><span>W3 Load</span><span>W4 Deload</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {isDeloadWeek && exerciseWeights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Deload Weights (55% of last working weight)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border">
              {exerciseWeights.map(({ name, lastWeight, deloadWeight }) => (
                <div key={name} className="py-2 flex items-center justify-between text-sm">
                  <span className="font-medium">{name}</span>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <span className="line-through">{lastWeight} kg</span>
                    <span className="text-amber-400 font-medium">-&gt; {deloadWeight} kg</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Deload Protocol</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>During deload week (Week 4), follow these guidelines:</p>
          <ul className="space-y-2 list-none">
            {[
              'Reduce all weights to 50-60% of your last working weight',
              'Drop 1-2 sets per exercise (e.g. 4x8 -> 3x8)',
              'Do NOT train to failure -- stop 3-4 reps from failure',
              'Prioritise sleep (8h+) and recovery',
              'Stay hydrated and maintain protein intake',
              'Return to Week 1 loading next week, slightly heavier than before deload',
            ].map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
