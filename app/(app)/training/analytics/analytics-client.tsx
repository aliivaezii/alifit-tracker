'use client'

import { useMemo } from 'react'
import { format } from 'date-fns'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, TrendingDown, TrendingUp } from 'lucide-react'
import { VOLUME_TARGETS, MUSCLE_GROUP_COLORS } from '@/lib/training-plan'
import type { WorkoutSession, ExerciseLog } from '@/types'

interface Session extends WorkoutSession {
  exercise_logs: ExerciseLog[]
}

const KEY_EXERCISES = [
  'Barbell Bench Press',
  'Barbell Back Squat',
  'Lat Pull-Down',
  'Leg Press (Wide Stance)',
  'Overhead Cable Extension',
]

export function TrainingAnalyticsClient({ sessions }: { sessions: Session[] }) {
  const progressionData = useMemo(() => {
    return KEY_EXERCISES.map((name) => {
      const points = sessions
        .filter((s) => s.exercise_logs.some((l) => l.exercise_name === name))
        .map((s) => {
          const logs = s.exercise_logs.filter((l) => l.exercise_name === name && l.completed)
          if (!logs.length) return null
          const maxWeight = Math.max(...logs.map((l) => l.weight_kg))
          return { date: format(new Date(s.date), 'MMM d'), weight: maxWeight }
        })
        .filter(Boolean) as { date: string; weight: number }[]
      return { name, points }
    })
  }, [sessions])

  // Weekly volume per muscle group
  const weeklyVolume = useMemo(() => {
    const last7DaysSessions = sessions.filter((s) => {
      const d = new Date(s.date)
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - 7)
      return d >= cutoff
    })

    const volumes: Record<string, number> = {}
    for (const s of last7DaysSessions) {
      for (const log of s.exercise_logs) {
        if (log.completed) {
          volumes[log.muscle_group] = (volumes[log.muscle_group] ?? 0) + 1
        }
      }
    }
    return volumes
  }, [sessions])

  // Performance flags
  const flags = useMemo(() => {
    const result: { exercise: string; type: 'regression' | 'stall'; message: string }[] = []
    for (const ex of KEY_EXERCISES) {
      const exSessions = sessions
        .filter((s) => s.exercise_logs.some((l) => l.exercise_name === ex && l.completed))
        .slice(-4)
      if (exSessions.length < 2) continue

      const weights = exSessions.map((s) => {
        const logs = s.exercise_logs.filter((l) => l.exercise_name === ex && l.completed)
        return Math.max(...logs.map((l) => l.weight_kg))
      })

      const last = weights.at(-1)!
      const prev = weights.at(-2)!

      if (last < prev) {
        result.push({ exercise: ex, type: 'regression', message: `Weight dropped ${prev}→${last}kg last session` })
      } else if (weights.length >= 3 && weights.slice(-3).every((w) => w === weights.at(-1))) {
        result.push({ exercise: ex, type: 'stall', message: `No progress in last 3 sessions (${last}kg)` })
      }
    }
    return result
  }, [sessions])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Training Analytics</h1>
        <p className="text-muted-foreground text-sm mt-1">Progressive overload tracking and performance flags</p>
      </div>

      {/* Performance Flags */}
      {flags.length > 0 && (
        <Card className="border-destructive/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" /> Performance Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {flags.map((f, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                {f.type === 'regression'
                  ? <TrendingDown className="h-4 w-4 text-destructive shrink-0" />
                  : <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                }
                <span className="font-medium">{f.exercise}:</span>
                <span className="text-muted-foreground">{f.message}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Progressive Overload Charts */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Progressive Overload</h2>
        {progressionData.map(({ name, points }) => (
          <Card key={name}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{name}</CardTitle>
            </CardHeader>
            <CardContent>
              {points.length < 2 ? (
                <div className="h-24 flex items-center justify-center text-muted-foreground text-xs">
                  Log at least 2 sessions to see progression
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={120}>
                  <LineChart data={points}>
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
                    <YAxis
                      domain={['dataMin - 2.5', 'dataMax + 2.5']}
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      tickLine={false}
                      axisLine={false}
                      width={36}
                    />
                    <Tooltip
                      contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8, fontSize: 12 }}
                      formatter={(v) => [`${v as number} kg`, 'Max weight']}
                    />
                    <Line
                      type="monotone"
                      dataKey="weight"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ r: 3, fill: '#10b981' }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Weekly Volume Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Weekly Volume (Last 7 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(VOLUME_TARGETS).length > 0 ? (
            <div className="space-y-2">
              {Object.entries(VOLUME_TARGETS).map(([muscle, target]) => {
                const sets = weeklyVolume[muscle] ?? 0
                const status = sets >= target.min && sets <= target.max
                  ? 'optimal'
                  : sets < target.min
                  ? 'low'
                  : 'high'
                return (
                  <div key={muscle} className="grid grid-cols-[120px_1fr_80px_60px] gap-3 items-center text-sm">
                    <span className="font-medium" style={{ color: MUSCLE_GROUP_COLORS[muscle] }}>{muscle}</span>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, (sets / target.max) * 100)}%`,
                          backgroundColor: MUSCLE_GROUP_COLORS[muscle],
                        }}
                      />
                    </div>
                    <span className="text-muted-foreground text-xs">{sets} / {target.min}–{target.max}</span>
                    <Badge
                      variant={status === 'optimal' ? 'default' : 'secondary'}
                      className={
                        status === 'optimal' ? 'bg-primary/20 text-primary text-xs' :
                        status === 'low' ? 'text-amber-400 text-xs' :
                        'text-xs'
                      }
                    >
                      {status === 'optimal' ? '✅' : status === 'low' ? '⚠️' : '📈'}
                    </Badge>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No workout data yet. Log a session to see your volume.</p>
          )}
        </CardContent>
      </Card>

      {/* Session History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Session History</CardTitle>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <p className="text-muted-foreground text-sm">No sessions logged yet.</p>
          ) : (
            <div className="divide-y divide-border">
              {[...sessions].reverse().slice(0, 20).map((s) => (
                <div key={s.id} className="py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{format(new Date(s.date), 'MMM d, yyyy')} — Day {s.day_number}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {s.exercise_logs?.filter((l) => l.completed).length ?? 0} sets completed
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {s.exercise_logs?.map((l) => l.exercise_name).filter((v, i, a) => a.indexOf(v) === i).length ?? 0} exercises
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
