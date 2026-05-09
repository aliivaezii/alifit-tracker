'use client'

import { useState, useCallback } from 'react'
import { TRAINING_PLAN, type Exercise } from '@/lib/training-plan'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BedDouble, Dumbbell, GripVertical, RotateCcw } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const STORAGE_KEY_PREFIX = 'alifit_plan_order_day_'

function loadOrder(dayNumber: number, defaultExercises: Exercise[]): Exercise[] {
  try {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}${dayNumber}`)
    if (!saved) return defaultExercises
    const names: string[] = JSON.parse(saved)
    const byName = Object.fromEntries(defaultExercises.map((e) => [e.name, e]))
    const reordered = names.map((n) => byName[n]).filter(Boolean)
    // Include any new exercises not in saved order
    const savedSet = new Set(names)
    const newOnes = defaultExercises.filter((e) => !savedSet.has(e.name))
    return [...reordered, ...newOnes]
  } catch {
    return defaultExercises
  }
}

function saveOrder(dayNumber: number, exercises: Exercise[]) {
  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${dayNumber}`, JSON.stringify(exercises.map((e) => e.name)))
  } catch { /* ignore */ }
}

interface SortableExerciseProps {
  exercise: Exercise
  index: number
}

function SortableExercise({ exercise: ex, index }: SortableExerciseProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: ex.name })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="py-3 flex items-start gap-3">
      <button
        {...attributes}
        {...listeners}
        className="mt-1 text-muted-foreground/40 hover:text-muted-foreground transition-colors cursor-grab active:cursor-grabbing"
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="text-2xl font-bold text-muted-foreground/30 w-6 shrink-0 select-none">{index + 1}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center flex-wrap gap-2">
          <span className="font-medium">{ex.name}</span>
          <Badge variant="secondary" className="text-xs">{ex.muscleGroup}</Badge>
          <Badge className={`text-xs ${ex.progressionRule === 'compound' ? 'bg-primary/20 text-primary' : 'bg-secondary'}`}>
            {ex.progressionRule}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-0.5">
          {ex.sets} sets x {ex.repsRange} reps
        </p>
        <p className="text-xs text-muted-foreground/70 mt-0.5 italic">{ex.coachingNote}</p>
      </div>
    </div>
  )
}

interface DayExercisesProps {
  dayNumber: number
  defaultExercises: Exercise[]
}

function DayExercises({ dayNumber, defaultExercises }: DayExercisesProps) {
  const [exercises, setExercises] = useState<Exercise[]>(() => loadOrder(dayNumber, defaultExercises))

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setExercises((prev) => {
      const oldIdx = prev.findIndex((e) => e.name === active.id)
      const newIdx = prev.findIndex((e) => e.name === over.id)
      const next = arrayMove(prev, oldIdx, newIdx)
      saveOrder(dayNumber, next)
      return next
    })
  }, [dayNumber])

  function resetOrder() {
    try { localStorage.removeItem(`${STORAGE_KEY_PREFIX}${dayNumber}`) } catch { /* ignore */ }
    setExercises([...defaultExercises])
  }

  return (
    <>
      <div className="flex justify-end mb-2">
        <button
          onClick={resetOrder}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <RotateCcw className="h-3 w-3" />Reset order
        </button>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={exercises.map((e) => e.name)} strategy={verticalListSortingStrategy}>
          <div className="divide-y divide-border">
            {exercises.map((ex, i) => (
              <SortableExercise key={ex.name} exercise={ex} index={i} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </>
  )
}

export default function TrainingPlanPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">6-Day Training Plan</h1>
          <p className="text-muted-foreground text-sm mt-1">Push / Pull / Legs split with arms & shoulders days</p>
        </div>
        <Button asChild>
          <Link href="/training/log">Log Workout</Link>
        </Button>
      </div>

      <Tabs defaultValue="1">
        <TabsList className="grid grid-cols-6 w-full">
          {TRAINING_PLAN.map((day) => (
            <TabsTrigger key={day.dayNumber} value={String(day.dayNumber)}>
              D{day.dayNumber}
            </TabsTrigger>
          ))}
        </TabsList>

        {TRAINING_PLAN.map((day) => (
          <TabsContent key={day.dayNumber} value={String(day.dayNumber)}>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {day.isRest ? <BedDouble className="h-5 w-5 text-muted-foreground" /> : <Dumbbell className="h-5 w-5 text-primary" />}
                      {day.name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{day.focus}</p>
                  </div>
                  {!day.isRest && (
                    <Button asChild size="sm">
                      <Link href={`/training/log?day=${day.dayNumber}`}>Start Session</Link>
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {day.isRest ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <BedDouble className="h-12 w-12 mx-auto mb-2 opacity-40" />
                    <p>Rest day -- prioritise sleep, hydration, and light activity.</p>
                    <p className="text-xs mt-1">Walking, stretching, or mobility work is encouraged.</p>
                  </div>
                ) : (
                  <DayExercises dayNumber={day.dayNumber} defaultExercises={day.exercises} />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
