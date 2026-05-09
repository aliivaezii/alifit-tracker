'use client'

import { useState, useMemo } from 'react'
import { toast } from 'sonner'
import { Plus, Trash2, Search } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { createClient } from '@/lib/supabase/client'
import { computeMacrosFromFood } from '@/lib/fitness-math'
import { MEAL_TYPE_LABELS, type Food, type MealLog, type MealType, type ComputedStats, type Profile } from '@/types'

interface MealItemWithFood {
  id: string
  meal_log_id: string
  food_id: string
  quantity_g: number
  calories: number
  protein: number
  carbs: number
  fat: number
  food: Food
}

interface MealLogWithItems extends MealLog {
  meal_items: MealItemWithFood[]
}

interface Props {
  foods: Food[]
  initialMealLogs: MealLog[]
  stats: ComputedStats
  userId: string
  today: string
  profile: Profile
}

const MEAL_TYPES = Object.entries(MEAL_TYPE_LABELS) as [MealType, string][]

export function NutritionLogClient({ foods, initialMealLogs, stats, userId, today }: Props) {
  const [mealLogs, setMealLogs] = useState<MealLogWithItems[]>(initialMealLogs as MealLogWithItems[])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedMealType, setSelectedMealType] = useState<MealType>('breakfast')
  const [selectedFood, setSelectedFood] = useState<Food | null>(null)
  const [quantity, setQuantity] = useState('100')
  const [foodSearch, setFoodSearch] = useState('')
  const [saving, setSaving] = useState(false)

  const totals = useMemo(() => {
    return mealLogs.flatMap((m) => m.meal_items ?? []).reduce(
      (acc, item) => ({
        calories: acc.calories + item.calories,
        protein: acc.protein + item.protein,
        carbs: acc.carbs + item.carbs,
        fat: acc.fat + item.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    )
  }, [mealLogs])

  const filteredFoods = useMemo(() =>
    foods.filter((f) => f.name.toLowerCase().includes(foodSearch.toLowerCase())),
    [foods, foodSearch]
  )

  const preview = useMemo(() => {
    if (!selectedFood || !quantity) return null
    return computeMacrosFromFood(
      selectedFood.calories_per_100g,
      selectedFood.protein_per_100g,
      selectedFood.carbs_per_100g,
      selectedFood.fat_per_100g,
      parseFloat(quantity) || 0
    )
  }, [selectedFood, quantity])

  async function addFoodEntry() {
    if (!selectedFood || !quantity) return
    setSaving(true)
    const supabase = createClient()

    let mealLog = mealLogs.find((m) => m.meal_type === selectedMealType)

    if (!mealLog) {
      const { data, error } = await supabase
        .from('meal_logs')
        .insert({ user_id: userId, date: today, meal_type: selectedMealType })
        .select()
        .single()
      if (error || !data) { toast.error(error?.message ?? 'Error'); setSaving(false); return }
      mealLog = { ...data, meal_items: [] } as MealLogWithItems
    }

    const macros = computeMacrosFromFood(
      selectedFood.calories_per_100g,
      selectedFood.protein_per_100g,
      selectedFood.carbs_per_100g,
      selectedFood.fat_per_100g,
      parseFloat(quantity)
    )

    const { data: item, error: itemError } = await supabase
      .from('meal_items')
      .insert({
        meal_log_id: mealLog.id,
        food_id: selectedFood.id,
        quantity_g: parseFloat(quantity),
        ...macros,
      })
      .select()
      .single()

    if (itemError || !item) { toast.error(itemError?.message ?? 'Error'); setSaving(false); return }

    setMealLogs((prev) => {
      const existing = prev.find((m) => m.meal_type === selectedMealType)
      if (existing) {
        return prev.map((m) =>
          m.meal_type === selectedMealType
            ? { ...m, meal_items: [...(m.meal_items ?? []), { ...item, food: selectedFood }] }
            : m
        )
      }
      return [...prev, { ...mealLog!, meal_items: [{ ...item, food: selectedFood }] } as MealLogWithItems]
    })

    toast.success(`${selectedFood.name} added`)
    setDialogOpen(false)
    setSelectedFood(null)
    setQuantity('100')
    setFoodSearch('')
    setSaving(false)
  }

  async function removeItem(mealLogId: string, itemId: string) {
    const supabase = createClient()
    await supabase.from('meal_items').delete().eq('id', itemId)
    setMealLogs((prev) =>
      prev.map((m) =>
        m.id === mealLogId
          ? { ...m, meal_items: m.meal_items.filter((i) => i.id !== itemId) }
          : m
      )
    )
    toast.success('Removed')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Calorie Log</h1>
          <p className="text-muted-foreground text-sm">{today}</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="h-4 w-4 mr-1" />Add Meal
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Food Entry</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Meal</Label>
                <Select value={selectedMealType} onValueChange={(v) => setSelectedMealType(v as MealType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MEAL_TYPES.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Search food</Label>
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search foods…"
                    value={foodSearch}
                    onChange={(e) => setFoodSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="max-h-40 overflow-y-auto space-y-1 border border-border rounded-md p-1">
                  {filteredFoods.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setSelectedFood(f)}
                      className={`w-full text-left px-3 py-1.5 rounded text-sm transition-colors ${
                        selectedFood?.id === f.id ? 'bg-primary/20 text-primary' : 'hover:bg-secondary'
                      }`}
                    >
                      <span className="font-medium">{f.name}</span>
                      <span className="text-muted-foreground ml-2 text-xs">{f.calories_per_100g} kcal/100g</span>
                    </button>
                  ))}
                </div>
              </div>
              {selectedFood && (
                <div className="space-y-2">
                  <Label>Quantity (g)</Label>
                  <Input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    min="1"
                  />
                  {preview && (
                    <div className="flex gap-2 flex-wrap">
                      <Badge variant="secondary">{preview.calories} kcal</Badge>
                      <Badge variant="secondary">P: {preview.protein}g</Badge>
                      <Badge variant="secondary">C: {preview.carbs}g</Badge>
                      <Badge variant="secondary">F: {preview.fat}g</Badge>
                    </div>
                  )}
                </div>
              )}
              <Button
                className="w-full"
                disabled={!selectedFood || !quantity || saving}
                onClick={addFoodEntry}
              >
                {saving ? 'Adding…' : 'Add to log'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Daily totals */}
      <Card className="border-primary/30">
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Calories', consumed: totals.calories, target: stats.recommendedCalories, unit: 'kcal', color: '#10b981' },
              { label: 'Protein', consumed: totals.protein, target: stats.proteinTarget, unit: 'g', color: '#3b82f6' },
              { label: 'Carbs', consumed: totals.carbs, target: stats.carbTarget, unit: 'g', color: '#f59e0b' },
              { label: 'Fat', consumed: totals.fat, target: stats.fatTarget, unit: 'g', color: '#ef4444' },
            ].map(({ label, consumed, target, unit, color }) => (
              <div key={label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium" style={{ color }}>{label}</span>
                  <span className="text-muted-foreground">{Math.round(consumed)}/{target} {unit}</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-1.5">
                  <div
                    className="h-1.5 rounded-full"
                    style={{ width: `${Math.min(100, (consumed / target) * 100)}%`, backgroundColor: color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Meal groups */}
      {mealLogs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <p>No meals logged today.</p>
            <p className="text-sm mt-1">Click &quot;Add Meal&quot; to start logging.</p>
          </CardContent>
        </Card>
      ) : (
        mealLogs.map((meal) => (
          <Card key={meal.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">{MEAL_TYPE_LABELS[meal.meal_type]}</CardTitle>
                <div className="text-xs text-muted-foreground">
                  {Math.round((meal.meal_items ?? []).reduce((s, i) => s + i.calories, 0))} kcal
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {(meal.meal_items ?? []).map((item) => (
                <div key={item.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium">{item.food?.name ?? 'Unknown food'}</p>
                    <p className="text-xs text-muted-foreground">{item.quantity_g}g · {Math.round(item.calories)} kcal · P:{Math.round(item.protein)}g C:{Math.round(item.carbs)}g F:{Math.round(item.fat)}g</p>
                  </div>
                  <button
                    onClick={() => removeItem(meal.id, item.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors p-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}
