'use client'

import { useState, useEffect, Suspense, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { TRAINING_PLAN, type Exercise } from '@/lib/training-plan'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { Check, Save, ChevronDown, ChevronUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

interface SetLog {
  setNumber: number
  weightKg: number
  reps: number
  completed: boolean
}

interface ExerciseState {
  exercise: Exercise
  sets: SetLog[]
  notes: string
  expanded: boolean
}

// Previous session reference: maps exercise_name -> "w1 / w2 / w3 kg"
type PreviousWeights = Record<string, string>

function WorkoutLoggerInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialDay = searchParams.get('day')

  const [selectedDay, setSelectedDay] = useState(initialDay ?? '1')
  const [exercises, setExercises] = useState<ExerciseState[]>([])
  const [previousWeights, setPreviousWeights] = useState<PreviousWeights>({})
  const [saving, setSaving] = useState(false)
  const [sessionNotes, setSessionNotes] = useState('')

  const trainingDay = TRAINING_PLAN.find((d) => d.dayNumber === Number(selectedDay))!

  // Load previous session weights for this day number
  const loadPreviousWeights = useCallback(async (dayNumber: number) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Find the most recent past session for this day
    const { data: lastSession } = await supabase
      .from('workout_sessions')
      .select('id, date')
      .eq('user_id', user.id)
      .eq('day_number', dayNumber)
      .lt('date', format(new Date(), 'yyyy-MM-dd'))
      .order('date', { ascending: false })
      .limit(1)
      .single()

    if (!lastSession) { setPreviousWeights({}); return }

    const { data: logs } = await supabase
      .from('exercise_logs')
      .select('exercise_name, set_number, weight_kg')
      .eq('session_id', lastSession.id)
      .eq('completed', true)
      .order('set_number')

    const map: PreviousWeights = {}
    for (const log of logs ?? []) {
      if (!map[log.exercise_name]) map[log.exercise_name] = ''
      map[log.exercise_name] += (map[log.exercise_name] ? ' / ' : '') + log.weight_kg
    }
    // Append "kg" suffix
    for (const key of Object.keys(map)) {
      map[key] = map[key] + ' kg'
    }
    setPreviousWeights(map)
  }, [])

  useEffect(() => {
    if (!trainingDay || trainingDay.isRest) {
      setExercises([])
      setPreviousWeights({})
      return
    }
    setExercises(
      trainingDay.exercises.map((ex) => ({
        exercise: ex,
        sets: Array.from({ length: ex.sets }, (_, i) => ({
          setNumber: i + 1,
          weightKg: 0,
          reps: 0,
          completed: false,
        })),
        notes: '',
        expanded: true,
      }))
    )
    loadPreviousWeights(Number(selectedDay))
  }, [selectedDay, trainingDay, loadPreviousWeights])

  function updateSet(exIdx: number, setIdx: number, field: 'weightKg' | 'reps', value: number) {
    setExercises((prev) => {
      const next = [...prev]
      next[exIdx] = {
        ...next[exIdx],
        sets: next[exIdx].sets.map((s, i) =>
          i === setIdx ? { ...s, [field]: value } : s
        ),
      }
      return next
    })
  }

  function toggleSet(exIdx: number, setIdx: number) {
    setExercises((prev) => {
      const next = [...prev]
      next[exIdx] = {
        ...next[exIdx],
        sets: next[exIdx].sets.map((s, i) =>
          i === setIdx ? { ...s, completed: !s.completed } : s
        ),
      }
      return next
    })
  }

  function toggleExpand(exIdx: number) {
    setExercises((prev) => {
      const next = [...prev]
      next[exIdx] = { ...next[exIdx], expanded: !next[exIdx].expanded }
      return next
    })
  }

  async function saveWorkout() {
    if (!trainingDay || trainingDay.isRest) return
    setSaving(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Not authenticated'); setSaving(false); return }

    const { data: session, error: sessionError } = await supabase
      .from('workout_sessions')
      .insert({
        user_id: user.id,
        date: format(new Date(), 'yyyy-MM-dd'),
        day_number: trainingDay.dayNumber,
        notes: sessionNotes || null,
        completed_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (sessionError || !session) {
      toast.error('Failed to save session')
      setSaving(false)
      return
    }

    const exerciseLogs = exercises.flatMap((ex) =>
      ex.sets.map((s) => ({
        session_id: session.id,
        exercise_name: ex.exercise.name,
        muscle_group: ex.exercise.muscleGroup,
        set_number: s.setNumber,
        weight_kg: s.weightKg,
        reps: s.reps,
        completed: s.completed,
      }))
    )

    const { error: logsError } = await supabase.from('exercise_logs').insert(exerciseLogs)

    if (logsError) {
      toast.error('Failed to save exercise logs')
      setSaving(false)
      return
    }

    toast.success('Workout saved!')
    router.push('/training/analytics')
  }

  const completedSets = exercises.flatMap((e) => e.sets).filter((s) => s.completed).length
  const totalSets = exercises.flatMap((e) => e.sets).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Log Workout</h1>
        <Badge variant="secondary">{completedSets}/{totalSets} sets done</Badge>
      </div>

      <div className="flex items-center gap-3">
        <Select value={selectedDay} onValueChange={(v) => setSelectedDay(v ?? '')}>
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TRAINING_PLAN.map((d) => (
              <SelectItem key={d.dayNumber} value={String(d.dayNumber)}>
                Day {d.dayNumber} -- {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">{format(new Date(), 'MMM d, yyyy')}</span>
      </div>

      {trainingDay?.isRest ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            This is a rest day. Select a training day to log a workout.
          </CardContent>
        </Card>
      ) : (
        <>
          {exercises.map((ex, exIdx) => (
            <Card key={exIdx}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">{ex.exercise.name}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {ex.exercise.sets}x{ex.exercise.repsRange} &middot; <Badge variant="secondary" className="text-xs">{ex.exercise.muscleGroup}</Badge>
                    </p>
                  </div>
                  <button onClick={() => toggleExpand(exIdx)} className="text-muted-foreground">
                    {ex.expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                </div>
              </CardHeader>
              {ex.expanded && (
                <CardContent className="space-y-2">
                  <p className="text-xs text-muted-foreground italic mb-1">{ex.exercise.coachingNote}</p>
                  {/* Previous session reference */}
                  <p className="text-xs text-muted-foreground mb-3">
                    Last session: {previousWeights[ex.exercise.name] ?? 'No previous data'}
                  </p>

                  <div className="grid grid-cols-[40px_1fr_1fr_48px] gap-2 text-xs text-muted-foreground pb-1">
                    <span>Set</span><span>Weight (kg)</span><span>Reps</span><span></span>
                  </div>

                  {ex.sets.map((s, sIdx) => (
                    <div key={sIdx} className="grid grid-cols-[40px_1fr_1fr_48px] gap-2 items-center">
                      <span className={cn('text-sm font-medium', s.completed && 'text-primary')}>{s.setNumber}</span>
                      <Input
                        type="number"
                        step="0.5"
                        min="0"
                        value={s.weightKg || ''}
                        onChange={(e) => updateSet(exIdx, sIdx, 'weightKg', parseFloat(e.target.value) || 0)}
                        className="h-8 text-sm"
                        placeholder="kg"
                      />
                      <Input
                        type="number"
                        min="0"
                        value={s.reps || ''}
                        onChange={(e) => updateSet(exIdx, sIdx, 'reps', parseInt(e.target.value) || 0)}
                        className="h-8 text-sm"
                        placeholder="reps"
                      />
                      <button
                        onClick={() => toggleSet(exIdx, sIdx)}
                        className={cn(
                          'w-8 h-8 rounded-md border flex items-center justify-center transition-colors',
                          s.completed
                            ? 'bg-primary border-primary text-primary-foreground'
                            : 'border-border text-muted-foreground hover:border-primary'
                        )}
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    </div>
                  ))}

                  <Textarea
                    placeholder="Notes for this exercise..."
                    value={ex.notes}
                    onChange={(e) => {
                      setExercises((prev) => {
                        const next = [...prev]
                        next[exIdx] = { ...next[exIdx], notes: e.target.value }
                        return next
                      })
                    }}
                    className="mt-2 text-sm h-16 resize-none"
                  />
                </CardContent>
              )}
            </Card>
          ))}

          <Card>
            <CardContent className="pt-4">
              <Textarea
                placeholder="Session notes (optional)..."
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                className="h-20 resize-none"
              />
            </CardContent>
          </Card>

          <Button className="w-full" size="lg" disabled={saving || completedSets === 0} onClick={saveWorkout}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : `Finish Workout (${completedSets}/${totalSets} sets)`}
          </Button>
        </>
      )}
    </div>
  )
}

export default function WorkoutLogPage() {
  return (
    <Suspense>
      <WorkoutLoggerInner />
    </Suspense>
  )
}
