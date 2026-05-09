import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock } from 'lucide-react'

const MEAL_PLAN = [
  {
    time: '6:15–6:30 AM',
    label: 'Pre-Workout',
    foods: '1 banana · ½ scoop Whey ON · 1 coffee',
    kcal: 180,
    protein: 14,
    carbs: 28,
    fat: 2,
    color: '#10b981',
  },
  {
    time: '8:30–9:00 AM',
    label: 'Post-Workout Breakfast',
    foods: '80g oat flakes · 250ml protein milk · 1 scoop Whey ON · banana/strawberries · 3–5g Creatine',
    kcal: 680,
    protein: 57,
    carbs: 87,
    fat: 10,
    color: '#3b82f6',
  },
  {
    time: '12:30–1:00 PM',
    label: 'Mensa Lunch',
    foods: 'Salad (mozzarella + tuna + lettuce) · chicken/fish secondo · fruit dessert',
    kcal: 550,
    protein: 52,
    carbs: 35,
    fat: 18,
    color: '#f59e0b',
  },
  {
    time: '4:00–4:30 PM',
    label: 'Afternoon Snack',
    foods: '1 ES Sport High Protein Bar',
    kcal: 200,
    protein: 20,
    carbs: 20,
    fat: 5,
    color: '#8b5cf6',
  },
  {
    time: '7:30–8:00 PM',
    label: 'Dinner',
    foods: '150g ground meat or chicken · 200g potato · salad',
    kcal: 520,
    protein: 40,
    carbs: 45,
    fat: 18,
    color: '#ef4444',
  },
  {
    time: '9:30–10:00 PM',
    label: 'Evening Snack',
    foods: '200g fat-free yogurt · strawberries',
    kcal: 148,
    protein: 20,
    carbs: 14,
    fat: 1,
    color: '#ec4899',
  },
]

const TOTAL = MEAL_PLAN.reduce(
  (acc, m) => ({
    kcal: acc.kcal + m.kcal,
    protein: acc.protein + m.protein,
    carbs: acc.carbs + m.carbs,
    fat: acc.fat + m.fat,
  }),
  { kcal: 0, protein: 0, carbs: 0, fat: 0 }
)

export default function MealPlanPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Daily Meal Plan</h1>
        <p className="text-muted-foreground text-sm mt-1">Reference schedule — 6 meals · ~2,450 kcal · 172g protein</p>
      </div>

      {/* Totals card */}
      <Card className="border-primary/30">
        <CardContent className="pt-4">
          <div className="grid grid-cols-4 gap-4 text-center">
            {[
              { label: 'Calories', value: TOTAL.kcal, unit: 'kcal', color: '#10b981' },
              { label: 'Protein', value: TOTAL.protein, unit: 'g', color: '#3b82f6' },
              { label: 'Carbs', value: TOTAL.carbs, unit: 'g', color: '#f59e0b' },
              { label: 'Fat', value: TOTAL.fat, unit: 'g', color: '#ef4444' },
            ].map(({ label, value, unit, color }) => (
              <div key={label}>
                <p className="text-2xl font-bold" style={{ color }}>{value}<span className="text-sm font-normal text-muted-foreground"> {unit}</span></p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Meal cards */}
      <div className="space-y-3">
        {MEAL_PLAN.map((meal, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: meal.color }} />
                  <CardTitle className="text-base">{meal.label}</CardTitle>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {meal.time}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">{meal.foods}</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="text-xs">{meal.kcal} kcal</Badge>
                <Badge variant="secondary" className="text-xs" style={{ color: '#3b82f6' }}>P: {meal.protein}g</Badge>
                <Badge variant="secondary" className="text-xs" style={{ color: '#f59e0b' }}>C: {meal.carbs}g</Badge>
                <Badge variant="secondary" className="text-xs" style={{ color: '#ef4444' }}>F: {meal.fat}g</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
