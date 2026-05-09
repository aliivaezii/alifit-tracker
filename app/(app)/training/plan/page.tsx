import { TRAINING_PLAN } from '@/lib/training-plan'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BedDouble, Dumbbell } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

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
                  <div className="divide-y divide-border">
                    {day.exercises.map((ex, i) => (
                      <div key={i} className="py-3 flex items-start gap-4">
                        <div className="text-2xl font-bold text-muted-foreground/30 w-8 shrink-0">{i + 1}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center flex-wrap gap-2">
                            <span className="font-medium">{ex.name}</span>
                            <Badge variant="secondary" className="text-xs">{ex.muscleGroup}</Badge>
                            <Badge
                              className={`text-xs ${ex.progressionRule === 'compound' ? 'bg-primary/20 text-primary' : 'bg-secondary'}`}
                            >
                              {ex.progressionRule}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {ex.sets} sets × {ex.repsRange} reps
                          </p>
                          <p className="text-xs text-muted-foreground/70 mt-0.5 italic">{ex.coachingNote}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
