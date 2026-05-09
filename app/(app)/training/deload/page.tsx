import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { format, subWeeks, startOfWeek } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default async function DeloadPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Determine mesocycle week (weeks since first session, mod 4)
  const { data: firstSession } = await supabase
    .from('workout_sessions')
    .select('date')
    .eq('user_id', user.id)
    .order('date', { ascending: true })
    .limit(1)
    .single()

  const firstDate = firstSession ? new Date(firstSession.date) : new Date()
  const weeksSinceStart = Math.floor((Date.now() - firstDate.getTime()) / (7 * 24 * 60 * 60 * 1000))
  const mesocycleWeek = (weeksSinceStart % 4) + 1
  const isDeloadWeek = mesocycleWeek === 4

  // Get last working weights for key exercises
  const { data: recentLogs } = await supabase
    .from('exercise_logs')
    .select('exercise_name, weight_kg, session_id, workout_sessions!inner(user_id)')
    .eq('workout_sessions.user_id', user.id)
    .eq('completed', true)
    .order('created_at', { ascending: false })

  const lastWeights: Record<string, number> = {}
  for (const log of recentLogs ?? []) {
    if (!(log.exercise_name in lastWeights)) {
      lastWeights[log.exercise_name] = log.weight_kg
    }
  }

  const deloadWeights = Object.entries(lastWeights).map(([name, weight]) => ({
    name,
    lastWeight: weight,
    deloadWeight: Math.round(weight * 0.55 * 2) / 2, // 55%, rounded to nearest 0.5kg
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Deload Tracker</h1>
        <p className="text-muted-foreground text-sm mt-1">4-week mesocycle management</p>
      </div>

      <Card className={isDeloadWeek ? 'border-amber-500/40' : 'border-primary/30'}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isDeloadWeek ? <AlertTriangle className="h-5 w-5 text-amber-400" /> : <RefreshCw className="h-5 w-5 text-primary" />}
            Mesocycle Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold">Week {mesocycleWeek} <span className="text-muted-foreground text-lg font-normal">/ 4</span></p>
              {isDeloadWeek ? (
                <p className="text-amber-400 font-medium mt-1">⚠️ Deload week -- reduce intensity to 50-60%</p>
              ) : (
                <p className="text-muted-foreground mt-1">
                  {4 - mesocycleWeek} week{4 - mesocycleWeek !== 1 ? 's' : ''} until next deload
                </p>
              )}
            </div>
            <Badge className={isDeloadWeek ? 'bg-amber-500/20 text-amber-400' : 'bg-primary/20 text-primary'}>
              {isDeloadWeek ? 'DELOAD' : 'LOADING'}
            </Badge>
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
                    w < mesocycleWeek ? 'bg-primary' :
                    w === mesocycleWeek ? 'bg-primary/60' :
                    'bg-secondary'
                  } ${w === 4 ? 'bg-amber-500/40' : ''}`}
                />
              ))}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>W1 Load</span><span>W2 Load</span><span>W3 Load</span><span>W4 Deload</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {isDeloadWeek && deloadWeights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Deload Weights (55% of last working weight)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border">
              {deloadWeights.map(({ name, lastWeight, deloadWeight }) => (
                <div key={name} className="py-2 flex items-center justify-between text-sm">
                  <span className="font-medium">{name}</span>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <span className="line-through">{lastWeight} kg</span>
                    <span className="text-amber-400 font-medium">→ {deloadWeight} kg</span>
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
              '🏋️ Reduce all weights to 50-60% of your last working weight',
              '📉 Drop 1-2 sets per exercise (e.g. 4×8 → 3×8)',
              '🚫 Do NOT train to failure -- stop 3-4 reps from failure',
              '😴 Prioritise sleep (8h+) and recovery',
              '💧 Stay hydrated and maintain protein intake',
              '🔁 Return to Week 1 loading next week, slightly heavier than before deload',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
